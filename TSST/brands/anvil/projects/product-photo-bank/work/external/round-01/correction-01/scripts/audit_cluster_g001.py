import os, json, csv

job_root = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-01"
clusters_path = os.path.join(job_root, "bank", "_work", "clusters.json")
pre_products_path = os.path.join(job_root, "correction-01", "pre-correction", "PRODUCTS.csv")

with open(clusters_path, "r", encoding="utf-8") as f:
    clusters = json.load(f)
c1 = [c for c in clusters if c["group_id"] == "G001"][0]
pre_products = {}
with open(pre_products_path, "r", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        for img in r["linked_image_ids"].split(";"):
            if img.strip():
                pre_products[img.strip()] = r

print("G001 files and old associations:")
for idx, fn in enumerate(c1["files"]):
    r = pre_products.get(fn, {})
    print(f"[{idx:02d}] {fn} -> Flavor: {r.get('flavor')} | Size: {r.get('pack_size')} | Servings: {r.get('serving_count')}")
