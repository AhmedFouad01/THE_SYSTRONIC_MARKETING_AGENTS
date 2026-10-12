import os
import numpy as np
from PIL import Image

src_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products"
round02_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-02"
outputs_dir = os.path.join(round02_dir, "outputs")
work_dir = os.path.join(round02_dir, "work")

affected_studio = [
    "PHOTO-2026-10-04-01-14-33 2", "PHOTO-2026-10-04-01-14-33 3",
    "PHOTO-2026-10-04-01-14-33 4", "PHOTO-2026-10-04-01-14-33 5",
    "PHOTO-2026-10-04-01-14-33",   "PHOTO-2026-10-04-01-14-34 2",
    "PHOTO-2026-10-04-01-14-34 3", "PHOTO-2026-10-04-01-14-34 4",
    "PHOTO-2026-10-04-01-14-34 5", "PHOTO-2026-10-04-01-14-34",
    "PHOTO-2026-10-04-01-14-35 2", "PHOTO-2026-10-04-01-14-35 3",
    "PHOTO-2026-10-04-01-14-35",   "PHOTO-2026-10-04-01-16-56 2"
]

print(f"Processing {len(affected_studio)} studio packshots with seamless shadow blending...")

for stem in affected_studio:
    src_path = os.path.join(src_dir, f"{stem}.jpg")
    im = Image.open(src_path).convert('RGB')
    w, h = im.size
    
    file_work_v02 = os.path.join(work_dir, stem, "v02")
    os.makedirs(file_work_v02, exist_ok=True)
    
    arr = np.array(im, dtype=np.float32)
    lum = 0.299 * arr[:,:,0] + 0.587 * arr[:,:,1] + 0.114 * arr[:,:,2]
    
    # Detect core product area
    core_mask = lum < 240
    y_idx, x_idx = np.where(core_mask)
    if len(y_idx) == 0:
        box_ymin, box_ymax, box_xmin, box_xmax = 0, h, 0, w
    else:
        box_ymin, box_ymax = int(y_idx.min()), int(y_idx.max())
        box_xmin, box_xmax = int(x_idx.min()), int(x_idx.max())
        
    # Generous margin around box so soft drop shadow is never cut off
    crop_xmin = max(0, box_xmin - 160)
    crop_xmax = min(w, box_xmax + 70)
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
    
    # Smooth edge fade mask: outer 25 pixels softly fade near-white pixels to pure 255
    fade_mask = np.ones((new_h, new_w), dtype=np.float32)
    edge_w = max(10, int(25 * scale))
    for i in range(edge_w):
        factor = i / float(edge_w)
        fade_mask[i, :] = np.minimum(fade_mask[i, :], factor)
        fade_mask[new_h - 1 - i, :] = np.minimum(fade_mask[new_h - 1 - i, :], factor)
        fade_mask[:, i] = np.minimum(fade_mask[:, i], factor)
        fade_mask[:, new_w - 1 - i] = np.minimum(fade_mask[:, new_w - 1 - i], factor)
        
    blended_arr = resized_arr.copy()
    for c in range(3):
        blended_arr[:, :, c] = resized_arr[:, :, c] * fade_mask + 255.0 * (1.0 - fade_mask)
        
    # Protect solid product packaging area from any fade
    product_area = (resized_arr[:, :, 0] < 220) | (resized_arr[:, :, 1] < 220) | (resized_arr[:, :, 2] < 220)
    for c in range(3):
        blended_arr[:, :, c] = np.where(product_area & (fade_mask > 0.4), resized_arr[:, :, c], blended_arr[:, :, c])
        
    out_im = Image.fromarray(np.clip(blended_arr, 0, 255).astype(np.uint8))
    
    canvas = Image.new('RGB', (1600, 1600), (255, 255, 255))
    pos_x = (1600 - new_w) // 2
    pos_y = (1600 - new_h) // 2
    canvas.paste(out_im, (pos_x, pos_y))
    
    out_path = os.path.join(outputs_dir, f"{stem}__white_v02.png")
    canvas.save(out_path, format="PNG")
    
    # Also save mask representation for audit
    mask_im = Image.fromarray((fade_mask * 255).astype(np.uint8))
    mask_im.save(os.path.join(file_work_v02, "mask.png"))
    print(f"Rendered v02: {out_path} (Scale: {scale:.3f})")

print("Done processing studio packshots.")
