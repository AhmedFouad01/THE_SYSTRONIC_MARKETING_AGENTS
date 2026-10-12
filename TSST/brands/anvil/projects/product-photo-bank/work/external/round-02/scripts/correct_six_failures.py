import os
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products"
round02_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-02"
outputs_dir = os.path.join(round02_dir, "outputs")
work_dir = os.path.join(round02_dir, "work")

os.makedirs(outputs_dir, exist_ok=True)
os.makedirs(work_dir, exist_ok=True)

def render_v02(stem, im, mask_full, overlay_im=None):
    w, h = im.size
    file_work_v02 = os.path.join(work_dir, stem, "v02")
    os.makedirs(file_work_v02, exist_ok=True)
    
    # Save mask
    mask_full.save(os.path.join(file_work_v02, "mask.png"))
    if overlay_im is not None:
        overlay_im.save(os.path.join(file_work_v02, "overlay.jpg"))
        
    # Find bounding box of mask
    mask_arr = np.array(mask_full)
    y_idx, x_idx = np.where(mask_arr > 10)
    if len(y_idx) == 0:
        xmin, ymin, xmax, ymax = 0, 0, w, h
    else:
        pad = 8
        ymin = max(0, int(y_idx.min()) - pad)
        ymax = min(h, int(y_idx.max()) + pad)
        xmin = max(0, int(x_idx.min()) - pad)
        xmax = min(w, int(x_idx.max()) + pad)
        
    crop_w = xmax - xmin
    crop_h = ymax - ymin
    
    # Crop image and mask
    crop_im = im.crop((xmin, ymin, xmax, ymax))
    crop_mask = mask_full.crop((xmin, ymin, xmax, ymax))
    
    # Scale constraint <= 1.25x
    scale = min(1350.0 / crop_w, 1350.0 / crop_h, 1.25)
    new_w = int(crop_w * scale)
    new_h = int(crop_h * scale)
    
    resized_im = crop_im.resize((new_w, new_h), Image.Resampling.LANCZOS)
    resized_mask = crop_mask.resize((new_w, new_h), Image.Resampling.BILINEAR)
    
    # Smooth edges gently (0.8 px)
    feathered_mask = resized_mask.filter(ImageFilter.GaussianBlur(radius=0.8))
    
    # Composite onto 1600x1600 pure #FFFFFF canvas
    canvas = Image.new('RGB', (1600, 1600), (255, 255, 255))
    pos_x = (1600 - new_w) // 2
    pos_y = (1600 - new_h) // 2
    canvas.paste(resized_im, (pos_x, pos_y), feathered_mask)
    
    out_path = os.path.join(outputs_dir, f"{stem}__white_v02.png")
    canvas.save(out_path, format="PNG")
    print(f"Rendered v02: {out_path} (Crop: {crop_w}x{crop_h}, Scale: {scale:.3f})")
    return out_path

# ==========================================
# 1. PHOTO-2026-10-04-01-17-30 2 (Zoomad One Raw Creatine)
# ==========================================
def process_17_30_2():
    stem = "PHOTO-2026-10-04-01-17-30 2"
    im = Image.open(os.path.join(src_dir, f"{stem}.jpg")).convert('RGB')
    w, h = im.size
    
    top_pts = []
    for t in np.linspace(-1, 1, 40):
        x = 535 + t * 291
        y = 91 + (69.0 + 3.0 * t) * (t ** 2)
        top_pts.append((float(x), float(y)))
        
    lid_right = [(826, 160), (828, 200), (828, 260), (826, 275)]
    body_right = [
        (826, 275), (825, 350), (825, 450), (824, 550), (824, 650),
        (823, 750), (822, 850), (820, 950), (814, 1035)
    ]
    
    bottom_pts = []
    for t in np.linspace(1, -1, 30):
        x = 532 + t * 282
        y = 1065 - 30.0 * (t ** 2)
        bottom_pts.append((float(x), float(y)))
        
    body_left = [
        (250, 1035), (248, 950), (247, 850), (246, 750), (246, 650),
        (247, 550), (247, 450), (246, 350), (245, 275)
    ]
    lid_left = [(245, 275), (244, 250), (244, 200), (244, 160)]
    
    pts = top_pts + lid_right + body_right + bottom_pts + body_left + lid_left
    
    mask = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(pts, fill=255)
    
    overlay = im.copy()
    odraw = ImageDraw.Draw(overlay)
    odraw.polygon(pts, outline=(0, 255, 0), width=3)
    
    return render_v02(stem, im, mask, overlay)

# ==========================================
# 2. PHOTO-2026-10-04-01-17-12 (Muscle Show Creatine)
# ==========================================
def process_17_12():
    stem = "PHOTO-2026-10-04-01-17-12"
    im = Image.open(os.path.join(src_dir, f"{stem}.jpg")).convert('RGB')
    w, h = im.size
    
    # Top lid shrink wrap band
    # Curves from (340, 460) up through (560, 305) to (740, 440)
    top_pts = []
    for t in np.linspace(-1, 1, 35):
        x = 540 + t * 200
        if t < 0:
            y = 305 + 155.0 * (t ** 2)
        else:
            y = 305 + 135.0 * (t ** 2)
        top_pts.append((float(x), float(y)))
        
    right_pts = [
        (740, 440), (738, 500), (735, 600), (732, 700), (728, 800), (720, 900), (715, 945)
    ]
    
    bottom_pts = []
    for t in np.linspace(1, -1, 25):
        x = 530 + t * 185
        y = 960 - 15.0 * (t ** 2)
        bottom_pts.append((float(x), float(y)))
        
    left_pts = [
        (345, 945), (342, 850), (340, 750), (338, 650), (338, 550), (340, 460)
    ]
    
    pts = top_pts + right_pts + bottom_pts + left_pts
    
    mask = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(pts, fill=255)
    
    overlay = im.copy()
    odraw = ImageDraw.Draw(overlay)
    odraw.polygon(pts, outline=(0, 255, 0), width=3)
    
    return render_v02(stem, im, mask, overlay)

# ==========================================
# 3. PHOTO-2026-10-04-01-17-07 2 (Red Premium Creatine)
# ==========================================
def process_17_07_2():
    stem = "PHOTO-2026-10-04-01-17-07 2"
    im = Image.open(os.path.join(src_dir, f"{stem}.jpg")).convert('RGB')
    w, h = im.size
    
    top_pts = []
    for t in np.linspace(-1, 1, 35):
        x = 414 + t * 206
        y = 250 + 95.0 * (t ** 2)
        top_pts.append((float(x), float(y)))
        
    right_pts = [
        (620, 345), (620, 420), (618, 520), (616, 620), (614, 720), (610, 820),
        (604, 920), (595, 990), (575, 1025)
    ]
    
    bottom_pts = []
    for t in np.linspace(1, -1, 25):
        x = 414 + t * 160
        y = 1035 - 12.0 * (t ** 2)
        bottom_pts.append((float(x), float(y)))
        
    left_pts = [
        (255, 1025), (235, 990), (220, 920), (214, 820), (210, 720), (210, 620),
        (210, 520), (210, 420), (208, 345)
    ]
    
    pts = top_pts + right_pts + bottom_pts + left_pts
    
    mask = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(pts, fill=255)
    
    overlay = im.copy()
    odraw = ImageDraw.Draw(overlay)
    odraw.polygon(pts, outline=(0, 255, 0), width=3)
    
    return render_v02(stem, im, mask, overlay)

# ==========================================
# 4. PHOTO-2026-10-04-01-17-31 (MET-Rx 4 shakers)
# ==========================================
def process_17_31():
    stem = "PHOTO-2026-10-04-01-17-31"
    im = Image.open(os.path.join(src_dir, f"{stem}.jpg")).convert('RGB')
    w, h = im.size
    
    sh1 = [
        (40, 275), (55, 230), (95, 190), (175, 185), (240, 195), (280, 240),
        (280, 320), (275, 450), (265, 580), (258, 715),
        (92, 715), (82, 580), (68, 450), (50, 320)
    ]
    sh2 = [
        (330, 300), (345, 240), (385, 185), (445, 175), (510, 185), (552, 240),
        (552, 320), (548, 450), (538, 580), (530, 715),
        (365, 715), (355, 580), (342, 450), (328, 320)
    ]
    sh3 = [
        (625, 300), (635, 240), (675, 180), (745, 168), (815, 180), (862, 240),
        (862, 320), (858, 450), (848, 580), (840, 715),
        (670, 715), (660, 580), (645, 450), (628, 320)
    ]
    sh4 = [
        (950, 300), (965, 235), (1005, 175), (1080, 155), (1160, 175), (1210, 235),
        (1210, 320), (1205, 450), (1195, 580), (1185, 715),
        (1005, 715), (995, 580), (980, 450), (960, 320)
    ]
    
    mask = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(sh1, fill=255)
    draw.polygon(sh2, fill=255)
    draw.polygon(sh3, fill=255)
    draw.polygon(sh4, fill=255)
    
    overlay = im.copy()
    odraw = ImageDraw.Draw(overlay)
    odraw.polygon(sh1, outline=(0, 255, 0), width=3)
    odraw.polygon(sh2, outline=(0, 255, 0), width=3)
    odraw.polygon(sh3, outline=(0, 255, 0), width=3)
    odraw.polygon(sh4, outline=(0, 255, 0), width=3)
    
    return render_v02(stem, im, mask, overlay)

# ==========================================
# 5. PHOTO-2026-10-04-01-17-31 2 (ON 7 shakers)
# ==========================================
def process_17_31_2():
    stem = "PHOTO-2026-10-04-01-17-31 2"
    im = Image.open(os.path.join(src_dir, f"{stem}.jpg")).convert('RGB')
    w, h = im.size
    
    # 7 ON shakers with curved dome lids matching observed silhouette
    sh1 = [(25, 200), (32, 130), (55, 95), (115, 88), (155, 95), (170, 130), (175, 200), (170, 320), (160, 430), (45, 430), (32, 320)]
    sh2 = [(180, 200), (188, 130), (215, 85), (275, 78), (320, 85), (338, 130), (340, 200), (335, 320), (325, 430), (200, 430), (190, 320)]
    sh3 = [(348, 200), (355, 130), (380, 95), (435, 88), (480, 95), (498, 130), (500, 200), (495, 320), (485, 430), (360, 430), (350, 320)]
    sh4 = [(525, 200), (530, 130), (555, 80), (610, 72), (655, 80), (672, 130), (675, 200), (670, 320), (660, 430), (535, 430), (525, 320)]
    sh5 = [(695, 200), (700, 130), (730, 90), (790, 84), (835, 90), (852, 130), (855, 200), (850, 320), (840, 430), (710, 430), (700, 320)]
    sh6 = [(880, 200), (885, 120), (920, 68), (985, 60), (1030, 68), (1045, 120), (1050, 200), (1045, 320), (1035, 430), (895, 430), (885, 320)]
    sh7 = [(1075, 200), (1080, 120), (1110, 68), (1170, 60), (1220, 68), (1235, 120), (1240, 200), (1235, 320), (1225, 430), (1085, 430), (1075, 320)]
    
    mask = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(mask)
    for sh in [sh1, sh2, sh3, sh4, sh5, sh6, sh7]:
        draw.polygon(sh, fill=255)
        
    overlay = im.copy()
    odraw = ImageDraw.Draw(overlay)
    for sh in [sh1, sh2, sh3, sh4, sh5, sh6, sh7]:
        odraw.polygon(sh, outline=(0, 255, 0), width=3)
        
    return render_v02(stem, im, mask, overlay)

# ==========================================
# 6. PHOTO-2026-10-04-01-17-31 4 (SPORTSIUM 4 shakers)
# ==========================================
def process_17_31_4():
    stem = "PHOTO-2026-10-04-01-17-31 4"
    im = Image.open(os.path.join(src_dir, f"{stem}.jpg")).convert('RGB')
    w, h = im.size
    
    # 4 SPORTSIUM shakers sitting on shelf at y=630
    sh1 = [
        (45, 290), (50, 220), (95, 175), (180, 165), (255, 175), (295, 220), (295, 290),
        (285, 420), (275, 550), (270, 630), (85, 630), (80, 550), (70, 420), (50, 320)
    ]
    sh2 = [
        (335, 290), (345, 220), (395, 175), (470, 165), (545, 175), (585, 220), (585, 290),
        (575, 420), (565, 550), (555, 630), (380, 630), (375, 550), (365, 420), (345, 320)
    ]
    sh3 = [
        (625, 290), (635, 220), (685, 175), (760, 165), (835, 175), (875, 220), (875, 290),
        (865, 420), (855, 550), (845, 630), (670, 630), (665, 550), (655, 420), (635, 320)
    ]
    sh4 = [
        (905, 290), (915, 220), (965, 175), (1040, 165), (1115, 175), (1155, 220), (1155, 290),
        (1145, 420), (1135, 550), (1125, 630), (950, 630), (945, 550), (935, 420), (915, 320)
    ]
    
    mask = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(mask)
    for sh in [sh1, sh2, sh3, sh4]:
        draw.polygon(sh, fill=255)
        
    overlay = im.copy()
    odraw = ImageDraw.Draw(overlay)
    for sh in [sh1, sh2, sh3, sh4]:
        odraw.polygon(sh, outline=(0, 255, 0), width=3)
        
    return render_v02(stem, im, mask, overlay)

if __name__ == "__main__":
    print("Executing fine-tuned correction of six failures...")
    process_17_30_2()
    process_17_12()
    process_17_07_2()
    process_17_31()
    process_17_31_2()
    process_17_31_4()
    print("Done fine-tuned correction of six failures.")
