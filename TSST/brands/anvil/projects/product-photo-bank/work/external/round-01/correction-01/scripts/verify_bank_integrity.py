import os
import sys
import json
import csv
import hashlib

def sha256_file(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    src_dir = os.path.abspath(os.path.join(root_dir, "..", "..", "..", "..", "..", "assets", "Anvil products"))
    bank_dir = os.path.join(root_dir, "bank")
    manifest_path = os.path.join(root_dir, "SOURCE_MANIFEST.csv")
    products_path = os.path.join(root_dir, "PRODUCTS.csv")
    labels_path = os.path.join(root_dir, "labels.json")
    old_to_new_path = os.path.join(root_dir, "correction-01", "old_to_new_mapping.json")

    print(f"Verifying integrity...")
    print(f"Root: {root_dir}")
    print(f"Source dir: {src_dir}")
    print(f"Bank dir: {bank_dir}")

    # 1. Read manifest
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest_rows = list(csv.DictReader(f))
    print(f"SOURCE_MANIFEST rows: {len(manifest_rows)}")

    # 2. Check each file in source and bank destination
    source_mismatches = 0
    dest_missing = 0
    dest_hash_mismatches = 0

    for row in manifest_rows:
        fname = row['filename']
        src_sha = row['sha256']
        src_path = os.path.join(src_dir, fname)

        if not os.path.exists(src_path):
            print(f"ERROR: Source file missing: {src_path}")
            source_mismatches += 1
        else:
            actual_src_sha = sha256_file(src_path)
            if actual_src_sha != src_sha:
                print(f"ERROR: Source hash mismatch for {fname}: expected {src_sha}, got {actual_src_sha}")
                source_mismatches += 1

        dest_rel = row.get('intended_bank_destination', '')
        if dest_rel.startswith('bank/'):
            dest_rel = dest_rel[5:]
        dest_path = os.path.join(bank_dir, dest_rel)

        if not os.path.exists(dest_path):
            print(f"ERROR: Dest file missing: {dest_path}")
            dest_missing += 1
        else:
            actual_dest_sha = sha256_file(dest_path)
            if actual_dest_sha != src_sha:
                print(f"ERROR: Dest hash mismatch for {dest_path}: expected {src_sha}, got {actual_dest_sha}")
                dest_hash_mismatches += 1

    print(f"Source check complete: {source_mismatches} errors.")
    print(f"Dest check complete: {dest_missing} missing, {dest_hash_mismatches} hash mismatches.")

    # 3. Check CATALOG.csv vs PRODUCTS.csv
    catalog_path = os.path.join(bank_dir, "CATALOG.csv")
    with open(catalog_path, 'r', encoding='utf-8') as f:
        catalog_rows = list(csv.DictReader(f))
    print(f"CATALOG.csv rows: {len(catalog_rows)}")

    with open(products_path, 'r', encoding='utf-8') as f:
        products_rows = list(csv.DictReader(f))
    print(f"PRODUCTS.csv rows: {len(products_rows)}")

    # 4. Check all files in bank directory to distinguish active primaries vs preserved stale files
    all_bank_files = []
    for root, dirs, files in os.walk(bank_dir):
        # skip _catalog and _work
        rel_root = os.path.relpath(root, bank_dir)
        if rel_root.startswith("_catalog") or rel_root.startswith("_work"):
            continue
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, bank_dir).replace('\\', '/')
                all_bank_files.append(rel_path)

    def normalize_dest(d):
        d = d.replace('\\', '/')
        return d[5:] if d.startswith('bank/') else d

    active_destinations = set(normalize_dest(row['intended_bank_destination']) for row in manifest_rows)
    stale_files = [f for f in all_bank_files if f not in active_destinations]

    print(f"\nTotal image files found in bank content folders: {len(all_bank_files)}")
    print(f"Active primary assignments: {len(active_destinations)}")
    print(f"Preserved prior-run (stale) copies: {len(stale_files)}")

    print("\nSummary of preserved stale copies:")
    for sf in sorted(stale_files)[:10]:
        print(f"  - {sf}")
    if len(stale_files) > 10:
        print(f"  ... and {len(stale_files) - 10} more.")

    # 5. Output audit json
    audit_data = {
        "source_count": len(manifest_rows),
        "source_hash_verified": source_mismatches == 0,
        "primary_destination_count": len(active_destinations),
        "primary_destination_verified": dest_missing == 0 and dest_hash_mismatches == 0,
        "catalog_rows": len(catalog_rows),
        "products_rows": len(products_rows),
        "total_bank_image_files": len(all_bank_files),
        "active_primaries": len(active_destinations),
        "preserved_stale_copies": len(stale_files),
        "stale_files_list": sorted(stale_files)
    }

    audit_out_path = os.path.join(root_dir, "correction-01", "bank_integrity_audit.json")
    with open(audit_out_path, 'w', encoding='utf-8') as f:
        json.dump(audit_data, f, indent=2)
    print(f"\nSaved audit to {audit_out_path}")

if __name__ == '__main__':
    main()
