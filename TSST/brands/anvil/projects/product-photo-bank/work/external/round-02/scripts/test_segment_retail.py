import os
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy import ndimage
from sklearn.mixture import GaussianMixture

def segment_retail_item(image_path):
    im = Image.open(image_path).convert('RGB')
    w, h = im.size
    arr = np.array(im, dtype=np.float32)

    # 1. Background seeds: perimeter
    # In retail shelf photos, background is top 10%, left 5%, right 5%
    bg_mask = np.zeros((h, w), dtype=bool)
    bg_mask[:int(h * 0.10), :] = True
    bg_mask[:, :int(w * 0.05)] = True
    bg_mask[:, int(w * 0.95):] = True

    # 2. Foreground seeds: central core
    # Focal product sits in center 40%
    fg_mask = np.zeros((h, w), dtype=bool)
    fg_mask[int(h * 0.25):int(h * 0.65), int(w * 0.25):int(w * 0.75)] = True

    bg_pixels = arr[bg_mask].reshape(-1, 3)
    fg_pixels = arr[fg_mask].reshape(-1, 3)

    if len(bg_pixels) > 8000:
        bg_pixels = bg_pixels[np.random.choice(len(bg_pixels), 8000, replace=False)]
    if len(fg_pixels) > 8000:
        fg_pixels = fg_pixels[np.random.choice(len(fg_pixels), 8000, replace=False)]

    gmm_bg = GaussianMixture(n_components=5, covariance_type='diag', random_state=42)
    gmm_fg = GaussianMixture(n_components=5, covariance_type='diag', random_state=42)

    gmm_bg.fit(bg_pixels)
    gmm_fg.fit(fg_pixels)

    flat_arr = arr.reshape(-1, 3)
    log_p_bg = gmm_bg.score_samples(flat_arr).reshape(h, w)
    log_p_fg = gmm_fg.score_samples(flat_arr).reshape(h, w)
    llr = log_p_fg - log_p_bg

    # Spatial prior favoring center
    y_coords, x_coords = np.ogrid[:h, :w]
    cy, cx = h / 2.0, w / 2.0
    dist_sq = ((x_coords - cx) / (w * 0.45)) ** 2 + ((y_coords - cy) / (h * 0.45)) ** 2
    spatial_prior = dist_sq * 1.5

    binary_fg = (llr - spatial_prior) > -1.0
    binary_fg[:int(h * 0.04), :] = False
    binary_fg[:, :int(w * 0.03)] = False
    binary_fg[:, int(w * 0.97):] = False

    # Morphological cleanup
    struct = ndimage.generate_binary_structure(2, 2)
    cleaned = ndimage.binary_opening(binary_fg, structure=struct, iterations=2)
    cleaned = ndimage.binary_closing(cleaned, structure=struct, iterations=4)
    cleaned = ndimage.binary_fill_holes(cleaned)

    # Connected components
    labels, num_features = ndimage.label(cleaned)
    if num_features > 0:
        # Keep connected components that intersect the central core
        core_labels = np.unique(labels[int(h * 0.3):int(h * 0.7), int(w * 0.3):int(w * 0.7)])
        core_labels = [l for l in core_labels if l > 0]
        final_mask = np.zeros_like(cleaned, dtype=bool)
        for l in core_labels:
            final_mask |= (labels == l)
    else:
        final_mask = cleaned

    final_mask = ndimage.binary_fill_holes(final_mask)
    final_mask = ndimage.binary_closing(final_mask, structure=struct, iterations=3)

    # Soft alpha feathering (radius 1.5)
    alpha_im = Image.fromarray((final_mask.astype(np.float32) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=1.5))
    alpha = np.array(alpha_im, dtype=np.float32) / 255.0

    # Bbox
    y_idx, x_idx = np.where(final_mask)
    if len(y_idx) == 0:
        bbox = (0, 0, w, h)
    else:
        pad = 8
        ymin = max(0, int(y_idx.min()) - pad)
        ymax = min(h, int(y_idx.max()) + pad)
        xmin = max(0, int(x_idx.min()) - pad)
        xmax = min(w, int(x_idx.max()) + pad)
        bbox = (xmin, ymin, xmax, ymax)

    return im, alpha, bbox

if __name__ == '__main__':
    for test_fn in ['PHOTO-2026-10-04-01-16-55.jpg', 'PHOTO-2026-10-04-01-17-04.jpg', 'PHOTO-2026-10-04-01-17-31.jpg']:
        p = os.path.join('G:/My Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/assets/Anvil products', test_fn)
        im, alpha, bbox = segment_retail_item(p)
        print(f'{test_fn}: size={im.size}, bbox={bbox}, fg_ratio={alpha.sum() / (im.size[0] * im.size[1]):.2f}')
