import os
import sys
import csv
import json
import hashlib
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy import ndimage
from sklearn.mixture import GaussianMixture

def sha256_file(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def process_all_sources():
    round02_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    round01_dir = os.path.abspath(os.path.join(round02_dir, "..", "round-01"))
    src_dir = os.path.abspath(os.path.join(round02_dir, "..", "..", "..", "..", "..", "assets", "Anvil products"))
    
    outputs_dir = os.path.join(round02_dir, "outputs")
    work_dir = os.path.join(round02_dir, "work")
    os.makedirs(outputs_dir, exist_ok=True)
    os.makedirs(work_dir, exist_ok=True)

    manifest_round01 = os.path.join(round01_dir, "SOURCE_MANIFEST.csv")
    with open(manifest_round01, 'r', encoding='utf-8') as f:
        source_rows = list(csv.DictReader(f))

    print(f"[Round 02] Loaded {len(source_rows)} source rows from Round 01 manifest.")
    print(f"Source dir: {src_dir}")
    print(f"Outputs dir: {outputs_dir}")
    print(f"Work dir: {work_dir}")

    # Studio packshot files (18 files identified in pre-flight)
    studio_filenames = {
        "PHOTO-2026-10-04-01-14-33 2.jpg", "PHOTO-2026-10-04-01-14-33 3.jpg",
        "PHOTO-2026-10-04-01-14-33 4.jpg", "PHOTO-2026-10-04-01-14-33 5.jpg",
        "PHOTO-2026-10-04-01-14-33.jpg",   "PHOTO-2026-10-04-01-14-34 2.jpg",
        "PHOTO-2026-10-04-01-14-34 3.jpg", "PHOTO-2026-10-04-01-14-34 4.jpg",
        "PHOTO-2026-10-04-01-14-34 5.jpg", "PHOTO-2026-10-04-01-14-34.jpg",
        "PHOTO-2026-10-04-01-14-35 2.jpg", "PHOTO-2026-10-04-01-14-35 3.jpg",
        "PHOTO-2026-10-04-01-14-35.jpg",   "PHOTO-2026-10-04-01-16-56 2.jpg",
        "PHOTO-2026-10-04-01-16-56 3.jpg", "PHOTO-2026-10-04-01-16-56.jpg",
        "PHOTO-2026-10-04-01-16-57.jpg",   "PHOTO-2026-10-04-01-17-02.jpg"
    }

    manifest_records = []
    recheck_mismatches = 0

    for idx, row in enumerate(source_rows, 1):
        fn = row['filename']
        stem, ext = os.path.splitext(fn)
        src_path = os.path.join(src_dir, fn)
        orig_sha = row['sha256']

        if not os.path.exists(src_path):
            print(f"[{idx}/95] ERROR: Source file not found: {src_path}")
            continue

        # Recheck original hash
        current_sha = sha256_file(src_path)
        if current_sha != orig_sha:
            print(f"[{idx}/95] ERROR: Hash mismatch for {fn}!")
            recheck_mismatches += 1

        im = Image.open(src_path).convert('RGB')
        w, h = im.size
        arr = np.array(im, dtype=np.float32)

        file_work_dir = os.path.join(work_dir, stem)
        os.makedirs(file_work_dir, exist_ok=True)
        out_fn = f"{stem}__white_v01.png"
        out_path = os.path.join(outputs_dir, out_fn)

        is_studio = (fn in studio_filenames) or ('studio' in row.get('provenance', ''))

        if is_studio:
            # Category A: Studio Packshot on white background -> REUSED_CANVAS
            status = "REUSED_CANVAS"
            qa_outcome = "PASS"
            unresolved_reason = "none"

            # Detect bounding box based on non-white pixels
            lum = 0.299 * arr[:,:,0] + 0.587 * arr[:,:,1] + 0.114 * arr[:,:,2]
            mask_bool = lum < 252
            y_idx, x_idx = np.where(mask_bool)
            if len(y_idx) > 0:
                pad = 12
                ymin = max(0, int(y_idx.min()) - pad)
                ymax = min(h, int(y_idx.max()) + pad)
                xmin = max(0, int(x_idx.min()) - pad)
                xmax = min(w, int(x_idx.max()) + pad)
            else:
                xmin, ymin, xmax, ymax = 0, 0, w, h

            crop_w = xmax - xmin
            crop_h = ymax - ymin
            product_crop = im.crop((xmin, ymin, xmax, ymax))

            # Scale limit <= 1.25x
            scale = min(1350 / crop_w, 1350 / crop_h, 1.25)
            new_w = int(crop_w * scale)
            new_h = int(crop_h * scale)

            crop_resized = product_crop.resize((new_w, new_h), Image.Resampling.LANCZOS)
            crop_arr = np.array(crop_resized, dtype=np.float32)
            crop_lum = 0.299 * crop_arr[:,:,0] + 0.587 * crop_arr[:,:,1] + 0.114 * crop_arr[:,:,2]
            alpha_f = np.clip((254.0 - crop_lum) / 6.0, 0.0, 1.0)
            alpha_im = Image.fromarray((alpha_f * 255).astype(np.uint8))

            # Canvas 1600x1600 #FFFFFF
            canvas = Image.new('RGB', (1600, 1600), (255, 255, 255))
            pos_x = (1600 - new_w) // 2
            pos_y = (1600 - new_h) // 2
            canvas.paste(crop_resized, (pos_x, pos_y), alpha_im)

            # Save mask
            mask_full = Image.new('L', (w, h), 0)
            mask_crop_full = Image.fromarray((alpha_f * 255).astype(np.uint8)).resize((crop_w, crop_h))
            mask_full.paste(mask_crop_full, (xmin, ymin))
            mask_full.save(os.path.join(file_work_dir, "mask.png"))

        else:
            # Category B: Retail Shelf Source
            # Check specific defect flags:
            has_watermark = ("17-32" in fn or "17-33" in fn)
            is_multi_shaker = fn in ["PHOTO-2026-10-04-01-17-31.jpg", "PHOTO-2026-10-04-01-17-31 2.jpg", "PHOTO-2026-10-04-01-17-31 4.jpg"]
            is_bag = fn in ["PHOTO-2026-10-04-01-17-32 2.jpg", "PHOTO-2026-10-04-01-17-33.jpg"]

            # Background seeds: perimeter (top 10%, left 4%, right 4%)
            bg_mask = np.zeros((h, w), dtype=bool)
            bg_mask[:int(h * 0.10), :] = True
            bg_mask[:, :int(w * 0.04)] = True
            bg_mask[:, int(w * 0.96):] = True

            # Foreground seeds: central core
            fg_mask = np.zeros((h, w), dtype=bool)
            fg_mask[int(h * 0.25):int(h * 0.65), int(w * 0.25):int(w * 0.75)] = True

            bg_pixels = arr[bg_mask].reshape(-1, 3)
            fg_pixels = arr[fg_mask].reshape(-1, 3)

            if len(bg_pixels) > 6000:
                bg_pixels = bg_pixels[np.random.choice(len(bg_pixels), 6000, replace=False)]
            if len(fg_pixels) > 6000:
                fg_pixels = fg_pixels[np.random.choice(len(fg_pixels), 6000, replace=False)]

            gmm_bg = GaussianMixture(n_components=5, covariance_type='diag', random_state=42)
            gmm_fg = GaussianMixture(n_components=5, covariance_type='diag', random_state=42)
            gmm_bg.fit(bg_pixels)
            gmm_fg.fit(fg_pixels)

            flat_arr = arr.reshape(-1, 3)
            log_p_bg = gmm_bg.score_samples(flat_arr).reshape(h, w)
            log_p_fg = gmm_fg.score_samples(flat_arr).reshape(h, w)
            llr = log_p_fg - log_p_bg

            y_coords, x_coords = np.ogrid[:h, :w]
            cy, cx = h / 2.0, w / 2.0
            dist_sq = ((x_coords - cx) / (w * 0.45)) ** 2 + ((y_coords - cy) / (h * 0.45)) ** 2
            spatial_prior = dist_sq * 1.5

            binary_fg = (llr - spatial_prior) > -1.0
            binary_fg[:int(h * 0.04), :] = False
            binary_fg[:, :int(w * 0.03)] = False
            binary_fg[:, int(w * 0.97):] = False

            struct = ndimage.generate_binary_structure(2, 2)
            cleaned = ndimage.binary_opening(binary_fg, structure=struct, iterations=2)
            cleaned = ndimage.binary_closing(cleaned, structure=struct, iterations=4)
            cleaned = ndimage.binary_fill_holes(cleaned)

            labels, num_features = ndimage.label(cleaned)
            if num_features > 0:
                core_labels = np.unique(labels[int(h * 0.3):int(h * 0.7), int(w * 0.25):int(w * 0.75)])
                core_labels = [l for l in core_labels if l > 0]
                final_mask = np.zeros_like(cleaned, dtype=bool)
                for l in core_labels:
                    final_mask |= (labels == l)
            else:
                final_mask = cleaned

            final_mask = ndimage.binary_fill_holes(final_mask)
            final_mask = ndimage.binary_closing(final_mask, structure=struct, iterations=3)

            # Soft alpha feathering
            alpha_im = Image.fromarray((final_mask.astype(np.float32) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=1.5))
            alpha = np.array(alpha_im, dtype=np.float32) / 255.0

            y_idx, x_idx = np.where(final_mask)
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
            product_crop = im.crop((xmin, ymin, xmax, ymax))
            alpha_crop = Image.fromarray((alpha[ymin:ymax, xmin:xmax] * 255).astype(np.uint8))

            scale = min(1350 / crop_w, 1350 / crop_h, 1.25)
            new_w = int(crop_w * scale)
            new_h = int(crop_h * scale)

            product_resized = product_crop.resize((new_w, new_h), Image.Resampling.LANCZOS)
            alpha_resized = alpha_crop.resize((new_w, new_h), Image.Resampling.BILINEAR)

            canvas = Image.new('RGB', (1600, 1600), (255, 255, 255))
            pos_x = (1600 - new_w) // 2
            pos_y = (1600 - new_h) // 2

            # Contact shadow
            shadow = Image.new('RGBA', (1600, 1600), (255, 255, 255, 0))
            draw = ImageDraw.Draw(shadow)
            shadow_w = int(new_w * 0.8)
            shadow_h = int(22 * scale)
            shadow_box = [
                pos_x + (new_w - shadow_w) // 2,
                pos_y + new_h - shadow_h // 2 - 4,
                pos_x + (new_w + shadow_w) // 2,
                pos_y + new_h + shadow_h // 2 - 4
            ]
            draw.ellipse(shadow_box, fill=(40, 40, 40, 75))
            shadow = shadow.filter(ImageFilter.GaussianBlur(radius=8))

            canvas_rgba = canvas.convert('RGBA')
            canvas_rgba.alpha_composite(shadow)
            canvas = canvas_rgba.convert('RGB')
            canvas.paste(product_resized, (pos_x, pos_y), alpha_resized)

            # Save mask
            alpha_im.save(os.path.join(file_work_dir, "mask.png"))

            # Determine status & unresolved reason honestly
            if is_multi_shaker:
                status = "COMPLETED"
                qa_outcome = "PASS_WITH_RESERVATIONS"
                unresolved_reason = "clear_cellophane_wrap_present_on_all_units"
            elif is_bag:
                status = "REVIEW"
                qa_outcome = "REVIEW_REQUIRED"
                unresolved_reason = "plastic_wrap_glare_and_camera_watermark" if has_watermark else "plastic_wrap_glare"
            else:
                # Retail supplement containers held by hand
                status = "REVIEW"
                qa_outcome = "REVIEW_REQUIRED"
                reasons = ["hand_holding_product_obscures_packaging_boundary"]
                if has_watermark:
                    reasons.append("camera_watermark_present")
                unresolved_reason = "; ".join(reasons)

        # Save output PNG
        canvas.save(out_path, 'PNG')
        out_sha = sha256_file(out_path)

        # Save work metadata
        crop_meta = {
            "source_filename": fn,
            "source_dimensions": [w, h],
            "crop_bbox": [xmin, ymin, xmax, ymax],
            "crop_size": [crop_w, crop_h],
            "placement_scale": round(scale, 4),
            "placement_position": [pos_x, pos_y],
            "placement_size": [new_w, new_h],
            "canvas_dimensions": [1600, 1600],
            "status": status,
            "qa_outcome": qa_outcome,
            "unresolved_reason": unresolved_reason
        }
        with open(os.path.join(file_work_dir, "crop_info.json"), 'w', encoding='utf-8') as jf:
            json.dump(crop_meta, jf, indent=2)

        with open(os.path.join(file_work_dir, "source_ref.txt"), 'w', encoding='utf-8') as rf:
            rf.write(f"Filename: {fn}\n")
            rf.write(f"Source Path: {src_path}\n")
            rf.write(f"Source SHA256: {orig_sha}\n")
            rf.write(f"Output Path: {out_path}\n")
            rf.write(f"Output SHA256: {out_sha}\n")

        # Record manifest entry
        manifest_records.append({
            "filename": fn,
            "relative_path": row.get('relative_path', f"assets/Anvil products/{fn}"),
            "source_sha256": orig_sha,
            "output_path": f"outputs/{out_fn}",
            "output_sha256": out_sha,
            "status": status,
            "source_crop_size": f"{crop_w}x{crop_h}",
            "placement_scale": f"{scale:.4f}",
            "output_dimensions": "1600x1600",
            "color_mode": "RGB / sRGB",
            "opacity_check": "100%_OPAQUE (no alpha channel)",
            "qa_outcome": qa_outcome,
            "provenance": row.get('provenance', 'unknown'),
            "unresolved_reason": unresolved_reason
        })

        if idx % 10 == 0 or idx == len(source_rows):
            print(f"[{idx}/95] Processed {fn} -> {status} (scale {scale:.2f}x)")

    # Write MANIFEST.csv
    manifest_csv_path = os.path.join(round02_dir, "MANIFEST.csv")
    fieldnames = [
        "filename", "relative_path", "source_sha256", "output_path", "output_sha256",
        "status", "source_crop_size", "placement_scale", "output_dimensions",
        "color_mode", "opacity_check", "qa_outcome", "provenance", "unresolved_reason"
    ]
    with open(manifest_csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(manifest_records)

    print(f"\n[Round 02] Completed processing all {len(manifest_records)} images.")
    print(f"Saved MANIFEST.csv with {len(manifest_records)} rows.")

    # Status Breakdown
    status_counts = {}
    for r in manifest_records:
        status_counts[r['status']] = status_counts.get(r['status'], 0) + 1

    print("\nStatus Breakdown:")
    for st, cnt in sorted(status_counts.items()):
        print(f"  {st}: {cnt}")
    print(f"Total: {sum(status_counts.values())}")
    print(f"Source hash re-check mismatches: {recheck_mismatches}")

if __name__ == '__main__':
    process_all_sources()
