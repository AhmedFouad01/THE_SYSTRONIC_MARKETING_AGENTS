import os
import sys
import csv
import json
import hashlib
from PIL import Image
import numpy as np

def sha256_file(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def main():
    round02_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    src_dir = os.path.abspath(os.path.join(round02_dir, "..", "..", "..", "..", "..", "assets", "Anvil products"))
    outputs_dir = os.path.join(round02_dir, "outputs")
    work_dir = os.path.join(round02_dir, "work")
    manifest_path = os.path.join(round02_dir, "MANIFEST.csv")

    print("[QA Verification] Running comprehensive Round 02 QA verification...")

    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest_rows = list(csv.DictReader(f))

    print(f"Manifest rows: {len(manifest_rows)}")

    dim_errors = 0
    opacity_errors = 0
    canvas_color_errors = 0
    scale_errors = 0
    source_hash_mismatches = 0
    output_hash_mismatches = 0
    work_file_missing = 0

    qa_details = []

    for idx, r in enumerate(manifest_rows, 1):
        fn = r['filename']
        stem = os.path.splitext(fn)[0]
        src_path = os.path.join(src_dir, fn)
        out_path = os.path.join(round02_dir, r['output_path'])
        
        # 1. Source Hash
        actual_src_sha = sha256_file(src_path)
        if actual_src_sha != r['source_sha256']:
            print(f"ERROR: Source hash mismatch for {fn}")
            source_hash_mismatches += 1

        # 2. Output file existence & hash
        if not os.path.exists(out_path):
            print(f"ERROR: Output missing: {out_path}")
            output_hash_mismatches += 1
            continue
        actual_out_sha = sha256_file(out_path)
        if actual_out_sha != r['output_sha256']:
            print(f"ERROR: Output hash mismatch for {out_path}")
            output_hash_mismatches += 1

        # 3. Image inspection
        with Image.open(out_path) as im:
            # Dimension check
            if im.size != (1600, 1600):
                print(f"ERROR: Dimensions {im.size} for {out_path}")
                dim_errors += 1

            # Opacity check
            if im.mode not in ['RGB', 'RGBA']:
                print(f"ERROR: Unexpected mode {im.mode} for {out_path}")
                opacity_errors += 1
            elif im.mode == 'RGBA':
                arr = np.array(im)
                if (arr[:, :, 3] != 255).any():
                    print(f"ERROR: Transparent pixels found in {out_path}")
                    opacity_errors += 1

            # Canvas border check (corners must be #FFFFFF)
            arr_rgb = np.array(im.convert('RGB'))
            corners = [
                arr_rgb[0, 0].tolist(),
                arr_rgb[0, -1].tolist(),
                arr_rgb[-1, 0].tolist(),
                arr_rgb[-1, -1].tolist()
            ]
            for c in corners:
                if c != [255, 255, 255]:
                    print(f"WARNING: Non-white corner {c} in {out_path}")
                    canvas_color_errors += 1

        # 4. Scale check
        scale = float(r['placement_scale'])
        if scale > 1.2501:
            print(f"ERROR: Scale {scale} exceeds 1.25x limit for {fn}")
            scale_errors += 1

        # 5. Work files check
        file_work_dir = os.path.join(work_dir, stem)
        mask_p = os.path.join(file_work_dir, "mask.png")
        crop_p = os.path.join(file_work_dir, "crop_info.json")
        ref_p = os.path.join(file_work_dir, "source_ref.txt")
        if not (os.path.exists(mask_p) and os.path.exists(crop_p) and os.path.exists(ref_p)):
            print(f"ERROR: Missing work files in {file_work_dir}")
            work_file_missing += 1

        qa_details.append({
            "filename": fn,
            "status": r['status'],
            "scale": scale,
            "qa_outcome": r['qa_outcome'],
            "unresolved_reason": r['unresolved_reason']
        })

    print("\n--- QA Verification Summary ---")
    print(f"Total files audited: {len(manifest_rows)}")
    print(f"Source hash mismatches: {source_hash_mismatches}")
    print(f"Output hash mismatches: {output_hash_mismatches}")
    print(f"Dimension errors: {dim_errors}")
    print(f"Opacity errors: {opacity_errors}")
    print(f"Canvas corner errors: {canvas_color_errors}")
    print(f"Scale (> 1.25x) errors: {scale_errors}")
    print(f"Missing work files: {work_file_missing}")

    status_counts = {}
    for r in manifest_rows:
        status_counts[r['status']] = status_counts.get(r['status'], 0) + 1

    print("\nFinal Status Tally:")
    for st, cnt in sorted(status_counts.items()):
        print(f"  {st}: {cnt}")
    print(f"Sum: {sum(status_counts.values())} (must equal 95)")

    qa_report_path = os.path.join(round02_dir, "qa_audit_summary.json")
    with open(qa_report_path, 'w', encoding='utf-8') as f:
        json.dump({
            "total_audited": len(manifest_rows),
            "source_hash_mismatches": source_hash_mismatches,
            "output_hash_mismatches": output_hash_mismatches,
            "dimension_errors": dim_errors,
            "opacity_errors": opacity_errors,
            "canvas_color_errors": canvas_color_errors,
            "scale_errors": scale_errors,
            "missing_work_files": work_file_missing,
            "status_breakdown": status_counts,
            "total_sum": sum(status_counts.values())
        }, f, indent=2)
    print(f"\nSaved QA summary to {qa_report_path}")

if __name__ == '__main__':
    main()
