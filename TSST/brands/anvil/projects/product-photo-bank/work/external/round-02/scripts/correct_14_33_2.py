import os
import numpy as np
from PIL import Image, ImageFilter

src_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products"
round02_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-02"
outputs_dir = os.path.join(round02_dir, "outputs")
work_dir = os.path.join(round02_dir, "work")

stem = "PHOTO-2026-10-04-01-14-33 2"
src_path = os.path.join(src_dir, f"{stem}.jpg")
im = Image.open(src_path).convert('RGB')
w, h = im.size

# In 14-33 2:
# The product is a TVN Pistachio Protein Bar box on a white background with a soft drop shadow on the bottom-left.
# Image is 1063x709.
# Let's inspect the bounding box without cutting the shadow:
arr = np.array(im, dtype=np.float32)
lum = 0.299 * arr[:,:,0] + 0.587 * arr[:,:,1] + 0.114 * arr[:,:,2]

# Detect product core (where lum < 240)
core_mask = lum < 240
y_idx, x_idx = np.where(core_mask)
# Box boundaries
box_ymin, box_ymax = int(y_idx.min()), int(y_idx.max())
box_xmin, box_xmax = int(x_idx.min()), int(x_idx.max())

# In original, shadow on left extends to x ~ 100.
# Instead of tight cropping, use the full image height and generous width so shadow has room to fade completely to 255!
crop_xmin = max(0, box_xmin - 150)
crop_xmax = min(w, box_xmax + 60)
crop_ymin = max(0, box_ymin - 40)
crop_ymax = min(h, box_ymax + 40)

crop_im = im.crop((crop_xmin, crop_ymin, crop_xmax, crop_ymax))
cw, ch = crop_im.size

# Scale constraint <= 1.25x
scale = min(1350.0 / cw, 1350.0 / ch, 1.25)
new_w = int(cw * scale)
new_h = int(ch * scale)

resized_im = crop_im.resize((new_w, new_h), Image.Resampling.LANCZOS)
resized_arr = np.array(resized_im, dtype=np.float32)

# Inside the product box: 100% original RGB (alpha = 1.0)
# Outside the product box: soft shadow blending
# The shadow is naturally dark (lum < 255) on white background.
# To blend smoothly into 255 at the crop edges without any hard boundary line:
# Apply a subtle edge fade to pure white (255) only in the outer 15 pixels of the crop.
fade_mask = np.ones((new_h, new_w), dtype=np.float32)
edge_w = int(25 * scale)
for i in range(edge_w):
    factor = i / float(edge_w)
    fade_mask[i, :] = np.minimum(fade_mask[i, :], factor)
    fade_mask[new_h - 1 - i, :] = np.minimum(fade_mask[new_h - 1 - i, :], factor)
    fade_mask[:, i] = np.minimum(fade_mask[:, i], factor)
    fade_mask[:, new_w - 1 - i] = np.minimum(fade_mask[:, new_w - 1 - i], factor)

# For pixels outside the product box, blend towards 255 based on fade_mask
blended_arr = resized_arr.copy()
for c in range(3):
    # Where pixel was near white (> 245) and near edge, blend to 255
    near_white_weight = np.clip((resized_arr[:, :, c] - 220) / 35.0, 0.0, 1.0)
    # At edges, push near-white background to 255
    edge_blend = 1.0 - (1.0 - near_white_weight) * fade_mask
    blended_arr[:, :, c] = resized_arr[:, :, c] * fade_mask + 255.0 * (1.0 - fade_mask)

# Product box itself remains 100% un-faded
product_area = (resized_arr[:, :, 0] < 220) | (resized_arr[:, :, 1] < 220) | (resized_arr[:, :, 2] < 220)
for c in range(3):
    blended_arr[:, :, c] = np.where(product_area & (fade_mask > 0.5), resized_arr[:, :, c], blended_arr[:, :, c])

out_im = Image.fromarray(np.clip(blended_arr, 0, 255).astype(np.uint8))

canvas = Image.new('RGB', (1600, 1600), (255, 255, 255))
pos_x = (1600 - new_w) // 2
pos_y = (1600 - new_h) // 2
canvas.paste(out_im, (pos_x, pos_y))

out_path = os.path.join(outputs_dir, f"{stem}__white_v02.png")
canvas.save(out_path, format="PNG")
print(f"Saved {out_path}")
