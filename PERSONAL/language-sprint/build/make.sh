#!/usr/bin/env bash
# Build both booklet PDFs: HTML -> PDF (pass 1) -> page numbers -> HTML -> PDF (pass 2) -> footer stamp.
set -e
B="$(cd "$(dirname "$0")" && pwd)"
S="$(dirname "$B")"
OUT="$S/booklets"
mkdir -p "$OUT"
cd "$TEMP"
for pass in 1 2; do
  python "$B/build_booklets.py" "$S"
  node "$B/render.mjs" "$B/English.html" "$B/English_raw.pdf" "$B/French.html" "$B/French_raw.pdf"
  python "$B/finish.py" pages "$B/English_raw.pdf" "$B/pages_en.json"
  python "$B/finish.py" pages "$B/French_raw.pdf" "$B/pages_fr.json"
done
python "$B/finish.py" stamp "$B/English_raw.pdf" "$OUT/English_7Day_Booklet.pdf" "Business English - 7-Day Intensive"
python "$B/finish.py" stamp "$B/French_raw.pdf" "$OUT/French_7Day_Booklet.pdf" "Le francais des affaires - 7 jours intensifs"
