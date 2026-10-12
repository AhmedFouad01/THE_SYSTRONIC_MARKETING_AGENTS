import os
import csv
from PIL import Image
import numpy as np

src_dir = 'G:/My Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/assets/Anvil products'
manifest = 'G:/My Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/product-photo-bank/work/external/round-01/SOURCE_MANIFEST.csv'

with open(manifest, 'r', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

# Helper to detect skin tones / hand in lower quadrants or sides
def detect_hand_or_skin(im):
    arr = np.array(im.convert('RGB'), dtype=np.float32)
    h, w, _ = arr.shape
    # Skin tone detection in RGB
    # Common skin tone heuristics: R > 95, G > 40, B > 20, R > G, R > B, |R - G| > 15
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    skin = (r > 95) & (g > 40) & (b > 20) & (r > g) & (r > b) & ((r - g) > 15) & (r - b > 15)
    
    # Check bottom left, bottom right, and lower half perimeter
    bot_half = skin[int(h*0.5):, :]
    bot_skin_ratio = bot_half.sum() / (bot_half.shape[0] * bot_half.shape[1])
    
    # Left and right side lower quarters
    left_lower = skin[int(h*0.4):int(h*0.9), :int(w*0.3)]
    left_ratio = left_lower.sum() / (left_lower.shape[0] * left_lower.shape[1])
    
    right_lower = skin[int(h*0.4):int(h*0.9), int(w*0.7):]
    right_ratio = right_lower.sum() / (right_lower.shape[0] * right_lower.shape[1])
    
    has_hand = (left_ratio > 0.08) or (right_ratio > 0.08) or (bot_skin_ratio > 0.12)
    return has_hand, left_ratio, right_ratio, bot_skin_ratio

print(f"Auditing all {len(rows)} images...")
results = []
for idx, r in enumerate(rows):
    fn = r['filename']
    prov = r['provenance']
    p = os.path.join(src_dir, fn)
    with Image.open(p) as im:
        if 'studio' in prov:
            status = 'STUDIO_WHITE'
            details = 'studio packshot render on white background'
        else:
            has_hand, lr, rr, br = detect_hand_or_skin(im)
            if has_hand:
                status = 'HAND_OCCLUDED'
                details = f'hand holding product (skin ratio: L={lr:.2f}, R={rr:.2f}, B={br:.2f})'
            else:
                status = 'FREE_STANDING_SHELF'
                details = f'shelf/display (skin ratio: L={lr:.2f}, R={rr:.2f}, B={br:.2f})'
        results.append((fn, r['dimensions'], status, details))

studio_count = sum(1 for _, _, s, _ in results if s == 'STUDIO_WHITE')
hand_count = sum(1 for _, _, s, _ in results if s == 'HAND_OCCLUDED')
free_count = sum(1 for _, _, s, _ in results if s == 'FREE_STANDING_SHELF')

print(f"\nAudit Summary:")
print(f"Studio white: {studio_count}")
print(f"Hand occluded: {hand_count}")
print(f"Free standing shelf: {free_count}")
print(f"Total: {len(results)}")

print("\nFree standing shelf images:")
for fn, dim, s, det in results:
    if s == 'FREE_STANDING_SHELF':
        print(f"  {fn} ({dim}): {det}")
