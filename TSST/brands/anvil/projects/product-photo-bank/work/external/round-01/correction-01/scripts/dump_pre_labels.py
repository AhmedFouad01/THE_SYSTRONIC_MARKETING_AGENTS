import os, json

job_root = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-01"
pre_labels_path = os.path.join(job_root, "correction-01", "pre-correction", "labels.json")

with open(pre_labels_path, "r", encoding="utf-8") as f:
    labels = json.load(f)

for idx, (k, v) in enumerate(labels.items()):
    fld = v.get("folder_name")
    inc = v.get("include_files", [])
    fn = inc[0] if inc else "NONE"
    print(f"[{idx:02d}] {k} -> {fld} ({fn})")
