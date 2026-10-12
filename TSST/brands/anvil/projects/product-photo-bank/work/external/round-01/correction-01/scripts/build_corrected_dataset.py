import os
import json
import csv
import hashlib
from PIL import Image

job_root = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-01"
src_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products"
pre_dir = os.path.join(job_root, "correction-01", "pre-correction")

# Load pre-correction data
with open(os.path.join(pre_dir, "labels.json"), "r", encoding="utf-8") as f:
    pre_labels = json.load(f)
with open(os.path.join(pre_dir, "SOURCE_MANIFEST.csv"), "r", encoding="utf-8") as f:
    pre_manifest = {r["filename"]: r for r in csv.DictReader(f)}
with open(os.path.join(pre_dir, "PRODUCTS.csv"), "r", encoding="utf-8") as f:
    pre_products = {}
    for r in csv.DictReader(f):
        for img in r["linked_image_ids"].split(";"):
            if img.strip():
                pre_products[img.strip()] = r

# Load clusters and files
with open(os.path.join(job_root, "bank", "_work", "clusters.json"), "r", encoding="utf-8") as f:
    clusters = json.load(f)
with open(os.path.join(job_root, "bank", "_work", "files.json"), "r", encoding="utf-8") as f:
    files_work = json.load(f)

print(f"Loaded {len(pre_manifest)} pre-manifest entries, {len(pre_products)} pre-products entries.")
