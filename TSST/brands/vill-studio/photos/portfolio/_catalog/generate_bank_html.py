"""
VILL Portfolio - Interactive Offline Catalog Web App Generator
Step 5: Generates portfolio/_catalog/BANK.html

Fix 1: Re-tagged stages (showroom removed; workshop, installation, handover only).
Fix 2: Hides _review by default with custom styled toggle "Show review items".
Fix 3: Near-twin grouping (hides near-identical takes by default; primary card has "+N similar" badge;
       modal inspector displays all member takes with interactive preview & path copy).
"""

import os
import sys
import json

REPO_DIR = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS"
PORTFOLIO_DIR = os.path.join(REPO_DIR, "TSST", "brands", "vill-studio", "assets", "source", "portfolio")
CATALOG_DIR = os.path.join(PORTFOLIO_DIR, "_catalog")

def generate_bank_html():
    json_path = os.path.join(CATALOG_DIR, "catalog_data.json")
    scores_path = os.path.join(CATALOG_DIR, "scores.json")
    tags_path = os.path.join(CATALOG_DIR, "tags.json")
    twins_path = os.path.join(CATALOG_DIR, "twin_groups.json")

    with open(json_path, "r", encoding="utf-8") as f:
        catalog_items = json.load(f)
    with open(scores_path, "r", encoding="utf-8") as f:
        scores_data = json.load(f)
    with open(tags_path, "r", encoding="utf-8") as f:
        tags_data = json.load(f)

    twin_file_map = {}
    if os.path.exists(twins_path):
        with open(twins_path, "r", encoding="utf-8") as f:
            twins_data = json.load(f)
        twin_file_map = twins_data.get("file_map", {})

    # Prepare enriched items
    items = []
    for it in catalog_items:
        fname = it["file"]
        fld = it["folder"]
        sc = scores_data.get(fname, {})
        tg = tags_data.get(fname, {})
        tw = twin_file_map.get(fname, {})
        
        full_disk_path = os.path.join(PORTFOLIO_DIR, fld, fname)
        thumb_name = f"{os.path.splitext(fname)[0]}.jpg"
        
        items.append({
            "f": fname,
            "d": fld,
            "p": it["piece"],
            "m": it["material"],
            "c": it["colour"],
            "s": it["stage"],
            "a": it["angle"],
            "st": it["space_tag"],
            "sc": float(it["ai_score"]),
            "sp": it["score_parts"],
            "parts": sc.get("parts", {}),
            "w": it["width"],
            "h": it["height"],
            "dt": it["date"],
            "n": it["project folder note (from INDEX.md)"],
            "t": f"thumbs/{thumb_name}",
            "fp": full_disk_path,
            "p2": tg.get("piece_top2", ""),
            "m2": tg.get("material_top2", ""),
            "tg": tw.get("twin_group", ""),
            "is_twin_primary": tw.get("is_primary", True),
            "twin_count": tw.get("twin_count", 0),
            "twins": tw.get("twins", [])
        })

    # Sort items initially by score descending
    items.sort(key=lambda x: x["sc"], reverse=True)

    # Extract unique filter values
    pieces = sorted(list(set(it["p"] for it in items)))
    materials = sorted(list(set(it["m"] for it in items)))
    colours = sorted(list(set(it["c"] for it in items)))
    stages = sorted(list(set(it["s"] for it in items)))
    angles = sorted(list(set(it["a"] for it in items)))
    folders = sorted(list(set(it["d"] for it in items if it["d"] != "_review")))

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VILL Studio — Searchable Photo Bank Catalog</title>
  <style>
    /* -------------------------------------------------------------
       VILL Luxury Dark Architecture Theme (100% Offline, Custom UI)
       ------------------------------------------------------------- */
    :root {{
      --bg-base: #090b10;
      --bg-surface: #121620;
      --bg-card: #181d2a;
      --bg-card-hover: #21283a;
      --bg-control: #1a2030;
      --border-subtle: #242c40;
      --border-hover: #3b4664;
      --gold-primary: #d4af37;
      --gold-glow: rgba(212, 175, 55, 0.25);
      --gold-text: #e8c865;
      --text-main: #f0f3f8;
      --text-muted: #8b97af;
      --text-faint: #56637d;
      --badge-score-5: #10b981;
      --badge-score-4: #06b6d4;
      --badge-score-3: #f59e0b;
      --badge-score-2: #ef4444;
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}

    body {{
      background: var(--bg-base);
      color: var(--text-main);
      font-family: var(--font-family);
      font-size: 14px;
      line-height: 1.5;
      min-height: 100vh;
      overflow-x: hidden;
    }}

    /* Header */
    header {{
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-subtle);
      padding: 16px 28px;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }}

    .header-top {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 16px;
    }}

    .brand-group {{
      display: flex;
      align-items: center;
      gap: 14px;
    }}

    .brand-logo {{
      background: linear-gradient(135deg, #2d2410 0%, #17130a 100%);
      border: 1px solid var(--gold-primary);
      color: var(--gold-text);
      font-weight: 800;
      font-size: 16px;
      letter-spacing: 2px;
      padding: 6px 14px;
      border-radius: 6px;
      box-shadow: 0 0 12px var(--gold-glow);
    }}

    .brand-title h1 {{
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: var(--text-main);
    }}

    .brand-title p {{
      font-size: 12px;
      color: var(--text-muted);
    }}

    /* Global Search Bar */
    .search-wrapper {{
      flex: 1;
      max-width: 500px;
      position: relative;
    }}

    .search-input {{
      width: 100%;
      background: var(--bg-control);
      border: 1px solid var(--border-subtle);
      color: var(--text-main);
      padding: 10px 40px 10px 16px;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: all 0.2s ease;
    }}

    .search-input:focus {{
      border-color: var(--gold-primary);
      box-shadow: 0 0 0 3px var(--gold-glow);
    }}

    .search-clear {{
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 16px;
      display: none;
    }}

    /* Header Actions: Review Toggle, Stats & Reset */
    .header-actions {{
      display: flex;
      align-items: center;
      gap: 16px;
    }}

    /* Custom Styled Toggle Switch (No Browser Native Checkbox) */
    .custom-toggle {{
      display: inline-flex;
      align-items: center;
      gap: 9px;
      cursor: pointer;
      user-select: none;
      background: var(--bg-control);
      border: 1px solid var(--border-subtle);
      padding: 6px 12px;
      border-radius: 6px;
      transition: all 0.2s ease;
    }}

    .custom-toggle:hover {{
      border-color: var(--border-hover);
    }}

    .toggle-track {{
      width: 32px;
      height: 18px;
      background: #0d111a;
      border: 1px solid #303a50;
      border-radius: 10px;
      position: relative;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }}

    .toggle-thumb {{
      width: 12px;
      height: 12px;
      background: var(--text-muted);
      border-radius: 50%;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }}

    .custom-toggle.active {{
      border-color: var(--gold-primary);
      background: rgba(212, 175, 55, 0.08);
    }}

    .custom-toggle.active .toggle-track {{
      background: rgba(212, 175, 55, 0.25);
      border-color: var(--gold-primary);
    }}

    .custom-toggle.active .toggle-thumb {{
      background: var(--gold-primary);
      transform: translateX(14px);
    }}

    .toggle-text {{
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
      transition: color 0.15s;
    }}

    .custom-toggle.active .toggle-text {{
      color: var(--gold-text);
      font-weight: 600;
    }}

    .stats-badge {{
      background: var(--bg-control);
      border: 1px solid var(--border-subtle);
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      color: var(--text-muted);
      white-space: nowrap;
    }}

    .stats-badge strong {{
      color: var(--gold-text);
    }}

    .btn-reset {{
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }}

    .btn-reset:hover {{
      border-color: var(--gold-primary);
      color: var(--text-main);
    }}

    /* Custom Filter Bar */
    .filter-bar {{
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
    }}

    /* Custom Dropdown Control */
    .custom-select {{
      position: relative;
      user-select: none;
    }}

    .custom-select-trigger {{
      background: var(--bg-control);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      padding: 7px 12px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.15s ease;
    }}

    .custom-select-trigger:hover, .custom-select.active .custom-select-trigger {{
      border-color: var(--border-hover);
      color: var(--text-main);
    }}

    .custom-select.has-value .custom-select-trigger {{
      border-color: var(--gold-primary);
      color: var(--gold-text);
      background: rgba(212, 175, 55, 0.08);
    }}

    .custom-select-options {{
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      background: var(--bg-surface);
      border: 1px solid var(--border-hover);
      border-radius: 8px;
      box-shadow: 0 10px 28px rgba(0,0,0,0.6);
      width: 240px;
      max-height: 280px;
      overflow-y: auto;
      z-index: 200;
      display: none;
      padding: 4px;
    }}

    .custom-select.active .custom-select-options {{
      display: block;
    }}

    .custom-option {{
      padding: 7px 10px;
      border-radius: 4px;
      font-size: 13px;
      color: var(--text-main);
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background 0.15s;
    }}

    .custom-option:hover {{
      background: var(--bg-card-hover);
    }}

    .custom-option.selected {{
      background: rgba(212, 175, 55, 0.15);
      color: var(--gold-text);
      font-weight: 600;
    }}

    /* Score Filter Pills */
    .score-pills {{
      display: flex;
      align-items: center;
      background: var(--bg-control);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 2px;
      gap: 2px;
    }}

    .score-pill {{
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 5px 9px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }}

    .score-pill:hover {{
      color: var(--text-main);
    }}

    .score-pill.active {{
      background: var(--gold-primary);
      color: #0b0d13;
      font-weight: 700;
    }}

    /* Sort Control */
    .sort-control {{
      margin-left: auto;
    }}

    /* Main Grid View */
    main {{
      padding: 24px 28px;
    }}

    .gallery-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    }}

    /* Image Card */
    .photo-card {{
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s, box-shadow 0.2s;
      display: flex;
      flex-direction: column;
    }}

    .photo-card:hover {{
      transform: translateY(-4px);
      border-color: var(--gold-primary);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
    }}

    .thumb-container {{
      width: 100%;
      height: 220px;
      background: #0d1017;
      position: relative;
      overflow: hidden;
    }}

    .thumb-img {{
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }}

    .photo-card:hover .thumb-img {{
      transform: scale(1.04);
    }}

    .score-badge {{
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(14, 17, 24, 0.88);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 3px 8px;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 4px;
    }}

    .score-badge.tier-5 {{ color: var(--badge-score-5); border-color: var(--badge-score-5); }}
    .score-badge.tier-4 {{ color: var(--badge-score-4); border-color: var(--badge-score-4); }}
    .score-badge.tier-3 {{ color: var(--badge-score-3); border-color: var(--badge-score-3); }}
    .score-badge.tier-2 {{ color: var(--badge-score-2); border-color: var(--badge-score-2); }}

    /* Near-Twin "+N Similar" Badge */
    .twin-badge {{
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: rgba(14, 17, 24, 0.92);
      border: 1px solid var(--gold-primary);
      color: var(--gold-text);
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      backdrop-filter: blur(4px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      transition: all 0.15s ease;
    }}

    .photo-card:hover .twin-badge {{
      background: var(--gold-primary);
      color: #0c0f17;
    }}

    .card-body {{
      padding: 14px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }}

    .card-primary-tag {{
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }}

    .card-meta-row {{
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }}

    .meta-chip {{
      background: var(--bg-control);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 4px;
      white-space: nowrap;
    }}

    .color-chip {{
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }}

    .color-dot {{
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }}

    .card-folder {{
      font-size: 11px;
      color: var(--text-faint);
      margin-top: auto;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }}

    /* Modal / Inspector Dialog */
    .modal-overlay {{
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(5, 7, 12, 0.88);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }}

    .modal-overlay.active {{
      display: flex;
    }}

    .modal-container {{
      background: var(--bg-surface);
      border: 1px solid var(--border-hover);
      border-radius: 14px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8);
      width: 100%;
      max-width: 1120px;
      max-height: 92vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }}

    .modal-header {{
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}

    .modal-header h2 {{
      font-size: 16px;
      color: var(--text-main);
      font-family: monospace;
    }}

    .btn-close-modal {{
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 24px;
      cursor: pointer;
      line-height: 1;
      padding: 4px;
      border-radius: 4px;
      transition: color 0.15s;
    }}

    .btn-close-modal:hover {{
      color: var(--text-main);
    }}

    .modal-content {{
      display: grid;
      grid-template-columns: 1fr 380px;
      overflow-y: auto;
      flex: 1;
    }}

    .modal-preview-pane {{
      background: #080a0f;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
    }}

    .modal-preview-img {{
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
      border-radius: 6px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.7);
    }}

    .modal-info-pane {{
      padding: 24px;
      background: var(--bg-surface);
      border-left: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 18px;
      overflow-y: auto;
    }}

    .info-section {{
      display: flex;
      flex-direction: column;
      gap: 6px;
    }}

    .info-label {{
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      font-weight: 700;
    }}

    .info-value {{
      font-size: 14px;
      color: var(--text-main);
    }}

    /* Copy Path Box */
    .path-copy-box {{
      background: var(--bg-control);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }}

    .path-text {{
      font-family: monospace;
      font-size: 11px;
      color: #93c5fd;
      word-break: break-all;
      user-select: all;
    }}

    .btn-copy-path {{
      background: var(--gold-primary);
      border: none;
      color: #0c0f17;
      font-weight: 700;
      font-size: 12px;
      padding: 7px 12px;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s;
    }}

    .btn-copy-path:hover {{
      background: #e5c07b;
      box-shadow: 0 0 10px var(--gold-glow);
    }}

    /* Score Parts Bar Breakdown */
    .score-breakdown-list {{
      display: flex;
      flex-direction: column;
      gap: 8px;
    }}

    .breakdown-row {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
    }}

    .breakdown-bar-bg {{
      flex: 1;
      height: 6px;
      background: var(--bg-control);
      border-radius: 3px;
      margin: 0 10px;
      overflow: hidden;
    }}

    .breakdown-bar-fill {{
      height: 100%;
      background: var(--gold-primary);
      border-radius: 3px;
    }}

    /* Near-Twins Strip in Modal */
    .twins-strip {{
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px;
    }}

    .twin-mini-card {{
      background: var(--bg-control);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 4px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      min-width: 72px;
      transition: all 0.15s;
    }}

    .twin-mini-card:hover, .twin-mini-card.active {{
      border-color: var(--gold-primary);
      background: rgba(212, 175, 55, 0.12);
    }}

    .twin-mini-thumb {{
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
    }}

    .twin-mini-score {{
      font-size: 10px;
      font-weight: 700;
      color: var(--gold-text);
    }}

    /* Toast Notification */
    .toast {{
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #10b981;
      color: #04261d;
      font-weight: 700;
      font-size: 13px;
      padding: 10px 18px;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      z-index: 2000;
      opacity: 0;
      transform: translateY(12px);
      transition: all 0.25s ease;
      pointer-events: none;
    }}

    .toast.show {{
      opacity: 1;
      transform: translateY(0);
    }}

    /* Empty State */
    .empty-state {{
      grid-column: 1 / -1;
      padding: 60px 20px;
      text-align: center;
      color: var(--text-muted);
    }}

    .empty-state h3 {{
      font-size: 18px;
      color: var(--text-main);
      margin-bottom: 8px;
    }}

    /* Scrollbars */
    ::-webkit-scrollbar {{
      width: 8px;
      height: 8px;
    }}
    ::-webkit-scrollbar-track {{
      background: var(--bg-base);
    }}
    ::-webkit-scrollbar-thumb {{
      background: var(--border-subtle);
      border-radius: 4px;
    }}
    ::-webkit-scrollbar-thumb:hover {{
      background: var(--border-hover);
    }}
  </style>
</head>
<body>

  <!-- App Header -->
  <header>
    <div class="header-top">
      <div class="brand-group">
        <div class="brand-logo">VILL</div>
        <div class="brand-title">
          <h1>Interior Finishing & Custom Furniture Photo Bank</h1>
          <p>Searchable Visual Catalog & Architectural Portfolio Asset Engine</p>
        </div>
      </div>

      <!-- Search Input -->
      <div class="search-wrapper">
        <input type="text" id="searchInput" class="search-input" placeholder="Search piece, material, colour, project note, or filename... (e.g., velvet, dressing table, marble)">
        <button id="searchClearBtn" class="search-clear">&times;</button>
      </div>

      <!-- Header Actions: Review Toggle, Stats & Reset -->
      <div class="header-actions">
        <!-- Styled Custom Toggle: Show Review Items -->
        <label class="custom-toggle" id="toggleReviewLabel">
          <span class="toggle-track">
            <span class="toggle-thumb"></span>
          </span>
          <span class="toggle-text">Show review items</span>
        </label>

        <!-- Stats Counter -->
        <div class="stats-badge">
          Showing <strong id="visibleCount">866</strong> cards
        </div>
        <button id="resetFiltersBtn" class="btn-reset">Reset Filters</button>
      </div>
    </div>

    <!-- Filter Toolbar -->
    <div class="filter-bar">
      <!-- Piece Dropdown -->
      <div class="custom-select" id="selectPiece" data-field="piece">
        <div class="custom-select-trigger">
          <span class="trigger-label">Piece: All</span>
          <span style="font-size: 10px;">▼</span>
        </div>
        <div class="custom-select-options">
          <div class="custom-option selected" data-value="">All Pieces</div>
          {"".join(f'<div class="custom-option" data-value="{p}">{p}</div>' for p in pieces)}
        </div>
      </div>

      <!-- Material Dropdown -->
      <div class="custom-select" id="selectMaterial" data-field="material">
        <div class="custom-select-trigger">
          <span class="trigger-label">Material: All</span>
          <span style="font-size: 10px;">▼</span>
        </div>
        <div class="custom-select-options">
          <div class="custom-option selected" data-value="">All Materials</div>
          {"".join(f'<div class="custom-option" data-value="{m}">{m}</div>' for m in materials)}
        </div>
      </div>

      <!-- Colour Dropdown -->
      <div class="custom-select" id="selectColour" data-field="colour">
        <div class="custom-select-trigger">
          <span class="trigger-label">Colour: All</span>
          <span style="font-size: 10px;">▼</span>
        </div>
        <div class="custom-select-options">
          <div class="custom-option selected" data-value="">All Colours</div>
          {"".join(f'<div class="custom-option" data-value="{c}">{c}</div>' for c in colours)}
        </div>
      </div>

      <!-- Stage Dropdown (Only 3 Stages: workshop, installation, handover) -->
      <div class="custom-select" id="selectStage" data-field="stage">
        <div class="custom-select-trigger">
          <span class="trigger-label">Stage: All</span>
          <span style="font-size: 10px;">▼</span>
        </div>
        <div class="custom-select-options">
          <div class="custom-option selected" data-value="">All Stages</div>
          {"".join(f'<div class="custom-option" data-value="{s}">{s}</div>' for s in stages)}
        </div>
      </div>

      <!-- Angle Dropdown -->
      <div class="custom-select" id="selectAngle" data-field="angle">
        <div class="custom-select-trigger">
          <span class="trigger-label">Angle: All</span>
          <span style="font-size: 10px;">▼</span>
        </div>
        <div class="custom-select-options">
          <div class="custom-option selected" data-value="">All Angles</div>
          {"".join(f'<div class="custom-option" data-value="{a}">{a}</div>' for a in angles)}
        </div>
      </div>

      <!-- Folder Dropdown -->
      <div class="custom-select" id="selectFolder" data-field="folder">
        <div class="custom-select-trigger">
          <span class="trigger-label">Folder: All (54 Projects)</span>
          <span style="font-size: 10px;">▼</span>
        </div>
        <div class="custom-select-options">
          <div class="custom-option selected" data-value="">All Folders</div>
          {"".join(f'<div class="custom-option" data-value="{fld}">{fld[:32]}...</div>' if len(fld) > 32 else f'<div class="custom-option" data-value="{fld}">{fld}</div>' for fld in folders)}
        </div>
      </div>

      <!-- Min Score Filter Pills -->
      <div class="score-pills" id="scorePills">
        <span style="font-size: 11px; color: var(--text-muted); padding: 0 6px;">Min Score:</span>
        <button class="score-pill active" data-score="0">All</button>
        <button class="score-pill" data-score="2.5">2.5+</button>
        <button class="score-pill" data-score="3.0">3.0+</button>
        <button class="score-pill" data-score="3.5">3.5+</button>
        <button class="score-pill" data-score="4.0">4.0+</button>
        <button class="score-pill" data-score="4.5">4.5+</button>
      </div>

      <!-- Sort Dropdown -->
      <div class="custom-select sort-control" id="selectSort">
        <div class="custom-select-trigger">
          <span class="trigger-label">Sort: Highest Score</span>
          <span style="font-size: 10px;">▼</span>
        </div>
        <div class="custom-select-options">
          <div class="custom-option selected" data-value="score-desc">Highest Score</div>
          <div class="custom-option" data-value="score-asc">Lowest Score</div>
          <div class="custom-option" data-value="date-desc">Newest Date</div>
          <div class="custom-option" data-value="date-asc">Oldest Date</div>
          <div class="custom-option" data-value="res-desc">Highest Resolution</div>
        </div>
      </div>
    </div>
  </header>

  <!-- Gallery Grid -->
  <main>
    <div class="gallery-grid" id="galleryGrid"></div>
  </main>

  <!-- Detail Modal -->
  <div class="modal-overlay" id="detailModal">
    <div class="modal-container">
      <div class="modal-header">
        <h2 id="modalFilename">20171128_020539.jpg</h2>
        <button class="btn-close-modal" id="modalCloseBtn">&times;</button>
      </div>
      <div class="modal-content">
        <!-- Image Preview -->
        <div class="modal-preview-pane">
          <img id="modalImg" class="modal-preview-img" src="" alt="Detail Preview">
        </div>
        <!-- Info Pane -->
        <div class="modal-info-pane">
          <!-- Copy Path -->
          <div class="path-copy-box">
            <span class="info-label">Full Local File Path</span>
            <div class="path-text" id="modalFullPath">G:\\...</div>
            <button class="btn-copy-path" id="copyPathBtn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy Full Path</span>
            </button>
          </div>

          <!-- Near-Twins Section (if any) -->
          <div class="info-section" id="modalTwinsSection" style="display:none;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span class="info-label" id="modalTwinsTitle">Similar Takes In Group</span>
              <span id="modalTwinsCount" style="font-size: 11px; color: var(--gold-text); font-weight: 600;"></span>
            </div>
            <div class="twins-strip" id="modalTwinsStrip"></div>
          </div>

          <!-- AI Score Breakdown -->
          <div class="info-section">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span class="info-label">AI Source Score</span>
              <span id="modalScoreVal" style="font-size: 20px; font-weight: 800; color: var(--gold-text);">4.2 / 5.0</span>
            </div>
            <div class="score-breakdown-list" id="modalScoreBreakdown"></div>
          </div>

          <!-- Classification Details -->
          <div class="info-section">
            <span class="info-label">Piece & Material</span>
            <div class="info-value" id="modalPieceMaterial">Dressing table / vanity · White lacquer</div>
          </div>

          <div class="info-section">
            <span class="info-label">Colour & Stage</span>
            <div class="info-value" id="modalColourStage">Navy/blue · Finished / handover</div>
          </div>

          <div class="info-section">
            <span class="info-label">Camera Angle & Space Tag</span>
            <div class="info-value" id="modalAngleSpace">Three-quarter · Furniture-pieces</div>
          </div>

          <div class="info-section">
            <span class="info-label">Resolution & Date</span>
            <div class="info-value" id="modalDimDate">2988 x 5312 px · 2017-11-28</div>
          </div>

          <div class="info-section">
            <span class="info-label">Project Folder Note</span>
            <div class="info-value" id="modalFolderNote" style="font-size: 13px; color: var(--text-muted); font-style: italic;"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div class="toast" id="toast">Path copied to clipboard!</div>

  <!-- Embedded Catalog Dataset & Logic -->
  <script>
    const CATALOG = {json.dumps(items, ensure_ascii=False)};

    // State
    const state = {{
      search: "",
      piece: "",
      material: "",
      colour: "",
      stage: "",
      angle: "",
      folder: "",
      minScore: 0.0,
      showReview: false,  // Fix 2: Off by default
      sortBy: "score-desc"
    }};

    // DOM Elements
    const gridEl = document.getElementById("galleryGrid");
    const visibleCountEl = document.getElementById("visibleCount");
    const searchInput = document.getElementById("searchInput");
    const searchClearBtn = document.getElementById("searchClearBtn");
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");
    const scorePills = document.querySelectorAll(".score-pill");
    const toggleReviewLabel = document.getElementById("toggleReviewLabel");

    // Modal Elements
    const modalEl = document.getElementById("detailModal");
    const modalCloseBtn = document.getElementById("modalCloseBtn");
    const modalImg = document.getElementById("modalImg");
    const modalFilename = document.getElementById("modalFilename");
    const modalFullPath = document.getElementById("modalFullPath");
    const copyPathBtn = document.getElementById("copyPathBtn");
    const modalScoreVal = document.getElementById("modalScoreVal");
    const modalScoreBreakdown = document.getElementById("modalScoreBreakdown");
    const modalPieceMaterial = document.getElementById("modalPieceMaterial");
    const modalColourStage = document.getElementById("modalColourStage");
    const modalAngleSpace = document.getElementById("modalAngleSpace");
    const modalDimDate = document.getElementById("modalDimDate");
    const modalFolderNote = document.getElementById("modalFolderNote");
    const modalTwinsSection = document.getElementById("modalTwinsSection");
    const modalTwinsTitle = document.getElementById("modalTwinsTitle");
    const modalTwinsCount = document.getElementById("modalTwinsCount");
    const modalTwinsStrip = document.getElementById("modalTwinsStrip");
    const toastEl = document.getElementById("toast");

    let currentModalItem = null;

    // Helper: color dot mapping
    const COLOR_HEX = {{
      "white": "#f8fafc",
      "black": "#0f172a",
      "grey": "#94a3b8",
      "beige/cream": "#fef3c7",
      "brown/wood": "#92400e",
      "navy/blue": "#2563eb",
      "turquoise": "#06b6d4",
      "green/emerald": "#059669",
      "gold/yellow": "#eab308",
      "red/burgundy": "#dc2626",
      "pink": "#ec4899",
      "purple": "#9333ea",
      "orange": "#ea580c"
    }};

    function getScoreTierClass(score) {{
      if (score >= 4.5) return "tier-5";
      if (score >= 3.8) return "tier-4";
      if (score >= 2.8) return "tier-3";
      return "tier-2";
    }}

    // Render Gallery
    function renderGallery() {{
      const q = state.search.toLowerCase().trim();
      
      const filtered = CATALOG.filter(item => {{
        // Fix 2: Hide _review by default unless showReview is checked
        if (!state.showReview && item.d === "_review") return false;

        // Fix 3: In grid view, only show the primary card of each twin group
        // Non-primary twin takes are collapsed and accessed via the "+N similar" badge / modal
        if (!item.is_twin_primary) return false;

        if (state.minScore > 0 && item.sc < state.minScore) return false;
        if (state.piece && item.p !== state.piece) return false;
        if (state.material && item.m !== state.material) return false;
        if (state.colour && item.c !== state.colour) return false;
        if (state.stage && item.s !== state.stage) return false;
        if (state.angle && item.a !== state.angle) return false;
        if (state.folder && item.d !== state.folder) return false;
        if (q) {{
          const hay = (item.f + " " + item.p + " " + item.m + " " + item.c + " " + item.s + " " + item.d + " " + item.n).toLowerCase();
          if (!hay.includes(q)) return false;
        }}
        return true;
      }});

      // Sort
      filtered.sort((a, b) => {{
        if (state.sortBy === "score-desc") return b.sc - a.sc;
        if (state.sortBy === "score-asc") return a.sc - b.sc;
        if (state.sortBy === "date-desc") return (b.dt || "").localeCompare(a.dt || "");
        if (state.sortBy === "date-asc") return (a.dt || "").localeCompare(b.dt || "");
        if (state.sortBy === "res-desc") return (Math.max(b.w, b.h)) - (Math.max(a.w, a.h));
        return 0;
      }});

      // Dynamic visible counter
      visibleCountEl.textContent = filtered.length;

      if (filtered.length === 0) {{
        gridEl.innerHTML = `
          <div class="empty-state">
            <h3>No matching photos found</h3>
            <p>Try clearing your search query or loosening filter criteria.</p>
          </div>
        `;
        return;
      }}

      // Build cards
      const html = filtered.map((item, idx) => {{
        const dotColor = COLOR_HEX[item.c] || "#94a3b8";
        const tierCls = getScoreTierClass(item.sc);

        // Fix 3: "+N similar" badge for twin groups
        const twinBadgeHTML = item.twin_count > 0 ? `
          <div class="twin-badge" title="Group contains ${{item.twin_count + 1}} near-twin takes (click to inspect)">
            +${{item.twin_count}} similar
          </div>
        ` : "";

        return `
          <div class="photo-card" data-idx="${{idx}}" onclick="openModal('${{item.f}}')">
            <div class="thumb-container">
              <img class="thumb-img" src="${{item.t}}" loading="lazy" alt="${{item.p}}">
              <div class="score-badge ${{tierCls}}">
                ★ ${{item.sc.toFixed(1)}}
              </div>
              ${{twinBadgeHTML}}
            </div>
            <div class="card-body">
              <div class="card-primary-tag">${{item.p}}</div>
              <div class="card-meta-row">
                <span class="meta-chip">${{item.m}}</span>
                <span class="meta-chip color-chip">
                  <span class="color-dot" style="background: ${{dotColor}};"></span>
                  ${{item.c}}
                </span>
                <span class="meta-chip">${{item.s}}</span>
              </div>
              <div class="card-folder" title="${{item.d}}">${{item.d}}</div>
            </div>
          </div>
        `;
      }}).join("");

      gridEl.innerHTML = html;
    }}

    // Modal Inspection
    function openModal(filename) {{
      const item = CATALOG.find(x => x.f === filename);
      if (!item) return;
      currentModalItem = item;

      modalFilename.textContent = item.f;
      modalImg.src = item.t;
      modalFullPath.textContent = item.fp;
      modalScoreVal.textContent = item.sc.toFixed(1) + " / 5.0";

      // Breakdown bars
      const p = item.parts || {{}};
      const breakdownHTML = `
        <div class="breakdown-row">
          <span style="color: var(--text-muted); width: 85px;">Resolution</span>
          <div class="breakdown-bar-bg"><div class="breakdown-bar-fill" style="width: ${{((p.resolution || 3)/5)*100}}%;"></div></div>
          <span style="font-weight: 700;">${{(p.resolution || 0).toFixed(1)}}</span>
        </div>
        <div class="breakdown-row">
          <span style="color: var(--text-muted); width: 85px;">Sharpness</span>
          <div class="breakdown-bar-bg"><div class="breakdown-bar-fill" style="width: ${{((p.sharpness || 3)/5)*100}}%;"></div></div>
          <span style="font-weight: 700;">${{(p.sharpness || 0).toFixed(1)}}</span>
        </div>
        <div class="breakdown-row">
          <span style="color: var(--text-muted); width: 85px;">Exposure</span>
          <div class="breakdown-bar-bg"><div class="breakdown-bar-fill" style="width: ${{((p.exposure || 3)/5)*100}}%;"></div></div>
          <span style="font-weight: 700;">${{(p.exposure || 0).toFixed(1)}}</span>
        </div>
        <div class="breakdown-row">
          <span style="color: var(--text-muted); width: 85px;">Clutter Free</span>
          <div class="breakdown-bar-bg"><div class="breakdown-bar-fill" style="width: ${{((p.clutter || 3)/5)*100}}%;"></div></div>
          <span style="font-weight: 700;">${{(p.clutter || 0).toFixed(1)}}</span>
        </div>
        <div class="breakdown-row">
          <span style="color: var(--text-muted); width: 85px;">Dominance</span>
          <div class="breakdown-bar-bg"><div class="breakdown-bar-fill" style="width: ${{((p.dominance || 3)/5)*100}}%;"></div></div>
          <span style="font-weight: 700;">${{(p.dominance || 0).toFixed(1)}}</span>
        </div>
      `;
      modalScoreBreakdown.innerHTML = breakdownHTML;

      modalPieceMaterial.textContent = `${{item.p}} · ${{item.m}}` + (item.p2 ? ` (alt: ${{item.p2}})` : "");
      modalColourStage.textContent = `${{item.c}} · ${{item.s}}`;
      modalAngleSpace.textContent = `${{item.a}} · ${{item.st}}`;
      modalDimDate.textContent = `${{item.w}} × ${{item.h}} px · ${{item.dt || 'No date'}}`;
      modalFolderNote.textContent = item.n || "No note recorded in INDEX.md";

      // Fix 3: Render Twin Group in Modal (if item belongs to a twin group)
      if (item.tg) {{
        modalTwinsSection.style.display = "flex";
        // All members in this group
        const allMembers = CATALOG.filter(x => x.tg === item.tg);
        allMembers.sort((a, b) => b.sc - a.sc);
        modalTwinsTitle.textContent = `Near-Twin Takes (${{item.tg}})`;
        modalTwinsCount.textContent = `${{allMembers.length}} takes in folder`;

        modalTwinsStrip.innerHTML = allMembers.map(m => `
          <div class="twin-mini-card ${{m.f === item.f ? 'active' : ''}}" onclick="openModal('${{m.f}}')">
            <img class="twin-mini-thumb" src="${{m.t}}" alt="${{m.f}}">
            <span class="twin-mini-score">★ ${{m.sc.toFixed(1)}}</span>
          </div>
        `).join("");
      }} else {{
        modalTwinsSection.style.display = "none";
      }}

      modalEl.classList.add("active");
    }}

    function closeModal() {{
      modalEl.classList.remove("active");
      currentModalItem = null;
    }}

    modalCloseBtn.onclick = closeModal;
    modalEl.onclick = e => {{
      if (e.target === modalEl) closeModal();
    }};

    // Keyboard Shortcuts
    document.addEventListener("keydown", e => {{
      if (e.key === "Escape") closeModal();
    }});

    // Copy Path Button
    copyPathBtn.onclick = () => {{
      if (!currentModalItem) return;
      navigator.clipboard.writeText(currentModalItem.fp).then(() => {{
        toastEl.textContent = "✓ Path copied: " + currentModalItem.f;
        toastEl.classList.add("show");
        setTimeout(() => toastEl.classList.remove("show"), 2500);
      }}).catch(err => {{
        // Fallback
        const ta = document.createElement("textarea");
        ta.value = currentModalItem.fp;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        toastEl.textContent = "✓ Path copied to clipboard!";
        toastEl.classList.add("show");
        setTimeout(() => toastEl.classList.remove("show"), 2500);
      }});
    }};

    // Search Input Handling
    searchInput.addEventListener("input", e => {{
      state.search = e.target.value;
      searchClearBtn.style.display = state.search ? "block" : "none";
      renderGallery();
    }});

    searchClearBtn.onclick = () => {{
      searchInput.value = "";
      state.search = "";
      searchClearBtn.style.display = "none";
      renderGallery();
    }};

    // Fix 2: Review Toggle Button
    toggleReviewLabel.onclick = () => {{
      state.showReview = !state.showReview;
      toggleReviewLabel.classList.toggle("active", state.showReview);
      renderGallery();
    }};

    // Custom Dropdown Setup
    document.querySelectorAll(".custom-select").forEach(selectEl => {{
      const trigger = selectEl.querySelector(".custom-select-trigger");
      const label = selectEl.querySelector(".trigger-label");
      const field = selectEl.getAttribute("data-field");

      trigger.onclick = (e) => {{
        e.stopPropagation();
        document.querySelectorAll(".custom-select").forEach(s => {{
          if (s !== selectEl) s.classList.remove("active");
        }});
        selectEl.classList.toggle("active");
      }};

      selectEl.querySelectorAll(".custom-option").forEach(opt => {{
        opt.onclick = (e) => {{
          e.stopPropagation();
          const val = opt.getAttribute("data-value");
          selectEl.querySelectorAll(".custom-option").forEach(o => o.classList.remove("selected"));
          opt.classList.add("selected");
          selectEl.classList.remove("active");

          if (field) {{
            state[field] = val;
            if (val) {{
              selectEl.classList.add("has-value");
              label.textContent = `${{field.charAt(0).toUpperCase() + field.slice(1)}}: ${{val}}`;
            }} else {{
              selectEl.classList.remove("has-value");
              label.textContent = `${{field.charAt(0).toUpperCase() + field.slice(1)}}: All`;
            }}
          }} else if (selectEl.id === "selectSort") {{
            state.sortBy = val;
            label.textContent = "Sort: " + opt.textContent;
          }}
          renderGallery();
        }};
      }});
    }});

    // Close dropdowns on outside click
    document.addEventListener("click", () => {{
      document.querySelectorAll(".custom-select").forEach(s => {{
        s.classList.remove("active");
      }});
    }});

    // Score Pills
    scorePills.forEach(pill => {{
      pill.onclick = () => {{
        scorePills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        state.minScore = parseFloat(pill.getAttribute("data-score")) || 0;
        renderGallery();
      }};
    }});

    // Reset All Filters
    resetFiltersBtn.onclick = () => {{
      state.search = "";
      state.piece = "";
      state.material = "";
      state.colour = "";
      state.stage = "";
      state.angle = "";
      state.folder = "";
      state.minScore = 0.0;
      state.showReview = false;
      state.sortBy = "score-desc";

      searchInput.value = "";
      searchClearBtn.style.display = "none";
      toggleReviewLabel.classList.remove("active");

      document.querySelectorAll(".custom-select").forEach(s => {{
        s.classList.remove("has-value");
        const fld = s.getAttribute("data-field");
        if (fld) {{
          s.querySelector(".trigger-label").textContent = `${{fld.charAt(0).toUpperCase() + fld.slice(1)}}: All`;
          s.querySelectorAll(".custom-option").forEach(o => {{
            o.classList.toggle("selected", o.getAttribute("data-value") === "");
          }});
        }}
      }});

      scorePills.forEach(p => {{
        p.classList.toggle("active", p.getAttribute("data-score") === "0");
      }});

      renderGallery();
    }};

    // Initial Render
    renderGallery();
  </script>
</body>
</html>
"""

    out_html_path = os.path.join(CATALOG_DIR, "BANK.html")
    with open(out_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"BANK.html successfully updated and generated at {out_html_path} ({len(items)} items embedded)!")

if __name__ == "__main__":
    generate_bank_html()
