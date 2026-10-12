import os
import json
import csv

job_root = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-01"
clusters_path = os.path.join(job_root, "bank", "_work", "clusters.json")
pre_products_path = os.path.join(job_root, "correction-01", "pre-correction", "PRODUCTS.csv")
pre_manifest_path = os.path.join(job_root, "correction-01", "pre-correction", "SOURCE_MANIFEST.csv")

with open(clusters_path, "r", encoding="utf-8") as f:
    clusters = json.load(f)

manifest = {}
with open(pre_manifest_path, "r", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        manifest[row["filename"]] = row

pre_products = {}
with open(pre_products_path, "r", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        for img in row["linked_image_ids"].split(";"):
            img = img.strip()
            if img:
                pre_products[img] = row

for c in clusters:
    gid = c["group_id"]
    files = c["files"]
    print(f"\n=================== CLUSTER {gid} ({len(files)} files) ===================")
    for idx, fn in enumerate(files):
        row = pre_products.get(fn, {})
        brand = row.get("brand", "UNKNOWN")
        prod = row.get("product_name", "UNKNOWN")
        flavor = row.get("flavor", "UNKNOWN")
        size = row.get("pack_size", "UNKNOWN")
        servings = row.get("serving_count", "UNKNOWN")
        m_row = manifest.get(fn, {})
        dest = m_row.get("intended_bank_destination", "UNKNOWN")
        print(f"[{idx:02d}] {fn}")
        print(f"     Old: {brand} | {prod} | {flavor} | {size} | {servings}s")
        print(f"     Dest: {dest}")
