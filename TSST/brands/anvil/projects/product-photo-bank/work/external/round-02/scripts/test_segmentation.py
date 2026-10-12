import os
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
from sklearn.mixture import GaussianMixture

def isolate_product(image_path, debug_out_dir=None):
    im = Image.open(image_path).convert('RGB')
    w, h = im.size
    arr = np.array(im, dtype=np.float32)

    # 1. Define seeds
    # Background seeds: perimeter (top 8%, left 8%, right 8%)
    bg_mask = np.zeros((h, w), dtype=bool)
    bg_mask[:int(h*0.08), :] = True
    bg_mask[:, :int(w*0.08)] = True
    bg_mask[:, int(w*0.92):] = True

    # Foreground seeds: central core (inner 40% horizontally, central 40% vertically)
    fg_mask = np.zeros((h, w), dtype=bool)
    fg_mask[int(h*0.3):int(h*0.7), int(w*0.3):int(w*0.7)] = True

    bg_pixels = arr[bg_mask].reshape(-1, 3)
    fg_pixels = arr[fg_mask].reshape(-1, 3)

    # Subsample if too many
    if len(bg_pixels) > 10000:
        bg_idx = np.random.choice(len(bg_pixels), 10000, replace=False)
        bg_pixels = bg_pixels[bg_idx]
    if len(fg_pixels) > 10000:
        fg_idx = np.random.choice(len(fg_pixels), 10000, replace=False)
        fg_pixels = fg_pixels[fg_idx]

    # Fit GMMs for Color Likelihood
    gmm_bg = GaussianMixture(n_components=5, covariance_type='diag', random_state=42)
    gmm_fg = GaussianMixture(n_components=5, covariance_type='diag', random_state=42)

    gmm_bg.fit(bg_pixels)
    gmm_fg.fit(fg_pixels)

    flat_arr = arr.reshape(-1, 3)
    log_p_bg = gmm_bg.score_samples(flat_arr).reshape(h, w)
    log_p_fg = gmm_fg.score_samples(flat_arr).reshape(h, w)

    # Log likelihood ratio
    llr = log_p_fg - log_p_bg

    # Spatial prior: center is more likely foreground
    y_coords, x_coords = np.ogrid[:h, :w]
    cy, cx = h / 2.0, w / 2.0
    dist_sq = ((x_coords - cx) / (w * 0.45)) ** 2 + ((y_coords - cy) / (h * 0.45)) ** 2
    spatial_penalty = dist_sq * 2.0

    energy = llr - spatial_penalty
    binary_fg = energy > 0.0

    # Ensure background perimeter is background
    binary_fg[:int(h*0.05), :] = False
    binary_fg[:, :int(w*0.05)] = False
    binary_fg[:, int(w*0.95):] = False

    # Morphological cleanup
    struct = ndimage.generate_binary_structure(2, 2)
    cleaned = ndimage.binary_opening(binary_fg, structure=struct, iterations=2)
    cleaned = ndimage.binary_closing(cleaned, structure=struct, iterations=3)
    cleaned = ndimage.binary_fill_holes(cleaned)

    # Keep largest connected component (or components that are central)
    labels, num_features = ndimage.label(cleaned)
    if num_features > 0:
        sizes = ndimage.sum(cleaned, labels, range(1, num_features + 1))
        # Keep components that have substantial size and touch central area
        center_labels = np.unique(labels[int(h*0.3):int(h*0.7), int(w*0.25):int(w*0.75)])
        center_labels = [l for l in center_labels if l > 0]
        final_mask = np.zeros_like(cleaned, dtype=bool)
        for l in center_labels:
            if sizes[l - 1] > (w * h * 0.05):
                final_mask |= (labels == l)
    else:
        final_mask = cleaned

    final_mask = ndimage.binary_fill_holes(final_mask)
    final_mask = ndimage.binary_closing(final_mask, structure=struct, iterations=2)

    # Edge feathering (soft mask)
    alpha = (final_mask.astype(np.float32) * 255.0)
    alpha_im = Image.fromarray(alpha.astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=1.5))
    alpha_mat = np.array(alpha_im, dtype=np.float32) / 255.0

    # Compute bounding box of foreground
    y_indices, x_indices = np.where(final_mask)
    if len(y_indices) == 0:
        bbox = (0, 0, w, h)
    else:
        ymin, ymax = int(y_indices.min()), int(y_indices.max())
        xmin, xmax = int(x_indices.min()), int(x_indices.max())
        bbox = (xmin, ymin, xmax, ymax)

    return im, alpha_mat, bbox

if __name__ == '__main__':
    src = 'G:/My Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/assets/Anvil products/PHOTO-2026-10-04-01-16-54.jpg'
    im, alpha, bbox = isolate_product(src)
    print('Processed test image:', src)
    print('Bbox:', bbox)
    print('Foreground area ratio:', alpha.sum() / (im.size[0] * im.size[1]))
