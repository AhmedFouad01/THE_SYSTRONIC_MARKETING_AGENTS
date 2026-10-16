import os
from PIL import Image, ImageDraw, ImageFont

project_dir = r'G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\vill-studio\projects\tables-studio-01'
inputs_dir = os.path.join(project_dir, 'inputs')
exports_dir = os.path.join(project_dir, 'exports')

tables = [
    {
        'num': '01',
        'id': 'Table 01',
        'title': 'Faceted Carrara Marble Polyhedron Coffee Table',
        'desc': 'Polished White Carrara Marble Monolith | Elevated Oblique Architectural Angle (35°)',
        'orig': os.path.join(inputs_dir, 'table-01-original.jpg'),
        'gen': os.path.join(exports_dir, 'table-01.png')
    },
    {
        'num': '02',
        'id': 'Table 02',
        'title': 'Organic Live-Edge Solid Timber Coffee Table',
        'desc': 'Solid Hardwood Tree Trunk Slab with Branch Fork | Low Wide-Angle Forced Perspective (24mm)',
        'orig': os.path.join(inputs_dir, 'table-02-original.jpg'),
        'gen': os.path.join(exports_dir, 'table-02.png')
    },
    {
        'num': '03',
        'id': 'Table 03',
        'title': 'Honey Amber Onyx Dining Table with Gold X-Trestle',
        'desc': 'Translucent Amber Onyx Slab & Mirror Gold Stainless Steel | Dynamic Diagonal Perspective',
        'orig': os.path.join(inputs_dir, 'table-03-original.jpg'),
        'gen': os.path.join(exports_dir, 'table-03.png')
    },
    {
        'num': '04',
        'id': 'Table 04',
        'title': 'Tiered Fluted Gold Pipe Waterfall Leg & Black Glass Table',
        'desc': 'Black Smoked Glass & Stepped Cylindrical Gold Pipes | Controlled Low Wide-Angle (20mm)',
        'orig': os.path.join(inputs_dir, 'table-04-original.jpg'),
        'gen': os.path.join(exports_dir, 'table-04.png')
    },
    {
        'num': '05',
        'id': 'Table 05',
        'title': 'Hexagonal Wireframe Diamond Cage Coffee Table',
        'desc': 'Tinted Hexagonal Glass & 3D Triangular Brass Cage | Controlled Wide-Angle Oblique View',
        'orig': os.path.join(inputs_dir, 'table-05-original.jpg'),
        'gen': os.path.join(exports_dir, 'table-05.png')
    }
]

# Layout dimensions
W = 1320
box_w, box_h = 600, 750
pad_x = 40
gap_x = 40
top_banner_h = 160
row_header_h = 95
row_gap = 45
row_h = row_header_h + box_h + row_gap
total_h = top_banner_h + len(tables) * row_h + 30

canvas = Image.new('RGB', (W, total_h), color='#070E14')
draw = ImageDraw.Draw(canvas)

# Fonts
font_title = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 32)
font_subtitle = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 18)
font_header = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 22)
font_meta = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 15)
font_label = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 14)

# Draw Top Banner
draw.text((pad_x, 30), 'VILL STUDIO — FIVE PREMIUM TABLE IMAGES', fill='#F58021', font=font_title)
draw.text((pad_x, 75), 'Stage 1 Review Contact Sheet: Upright Photo-Bank Originals vs. Premium Studio Generations', fill='#FFFFFF', font=font_subtitle)
draw.text((pad_x, 105), 'Studio Direction: Cohesive VILL Orange #F58021 Floor & Sweep | Restrained Petrol #01304A Accent | Portrait 4:5', fill='#8898A6', font=font_meta)
draw.line([(pad_x, 140), (W - pad_x, 140)], fill='#1A2B38', width=2)

def fit_image(im, target_w, target_h, bg_color='#0B141C'):
    im_w, im_h = im.size
    ratio = min(target_w / im_w, target_h / im_h)
    new_w = int(im_w * ratio)
    new_h = int(im_h * ratio)
    resized = im.resize((new_w, new_h), Image.Resampling.LANCZOS)
    box = Image.new('RGB', (target_w, target_h), color=bg_color)
    paste_x = (target_w - new_w) // 2
    paste_y = (target_h - new_h) // 2
    box.paste(resized, (paste_x, paste_y))
    return box

y = top_banner_h + 10
for t in tables:
    num = t['num']
    table_id = t['id']
    title = t['title']
    desc = t['desc']
    
    # Header bar
    draw.text((pad_x, y), f"#{num} | {table_id} — {title}", fill='#FFFFFF', font=font_header)
    draw.text((pad_x, y + 28), desc, fill='#8898A6', font=font_meta)
    
    img_y = y + row_header_h
    
    # Left box: Original
    x_orig = pad_x
    draw.text((x_orig, img_y - 22), 'ORIGINAL PHOTO (UPRIGHT SOURCE)', fill='#7E8C9A', font=font_label)
    im_orig = Image.open(t['orig'])
    box_orig = fit_image(im_orig, box_w, box_h, bg_color='#0B141C')
    canvas.paste(box_orig, (x_orig, img_y))
    draw.rectangle([x_orig, img_y, x_orig + box_w, img_y + box_h], outline='#1D2D3D', width=1)
    
    # Right box: Generation
    x_gen = pad_x + box_w + gap_x
    draw.text((x_gen, img_y - 22), 'STUDIO GENERATION (PORTRAIT 4:5)', fill='#F58021', font=font_label)
    im_gen = Image.open(t['gen'])
    box_gen = fit_image(im_gen, box_w, box_h, bg_color='#0B141C')
    canvas.paste(box_gen, (x_gen, img_y))
    draw.rectangle([x_gen, img_y, x_gen + box_w, img_y + box_h], outline='#F58021', width=1)
    
    y += row_h

contact_path = os.path.join(exports_dir, 'tables-comparison-contact.jpg')
canvas.save(contact_path, quality=92)
print('Generated contact sheet:', contact_path, canvas.size)
