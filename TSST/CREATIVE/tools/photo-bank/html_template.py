"""
Offline Visual Browser HTML Generator for TSST Photo Bank.
Generates <bank>/_catalog/BANK.html with:
- Dark luxury architecture theme
- 100% offline self-contained HTML (all data embedded)
- Custom-styled controls only (dropdowns, review items toggle, score pills, sort)
- Single-card near-twin collapsing with '+N similar' badges
- Modal inspector with interactive preview, score breakdown, full path display, copy-to-clipboard, and twin takes gallery
- Dynamic brand header (name, subtitle, logo) driven by brand profile
"""

import json

def generate_bank_html_content(items, profile):
    brand_logo = profile.get("brand_logo_text", "BANK")
    brand_title = profile.get("brand_name", "Photo Bank")
    brand_subtitle = profile.get("brand_subtitle", "Visual Asset Library & Catalog")

    # Extract unique filter values
    pieces = sorted(list(set(it["p"] for it in items if it.get("p"))))
    materials = sorted(list(set(it["m"] for it in items if it.get("m"))))
    colours = sorted(list(set(it["c"] for it in items if it.get("c"))))
    stages = sorted(list(set(it["s"] for it in items if it.get("s"))))
    angles = sorted(list(set(it["a"] for it in items if it.get("a"))))
    folders = sorted(list(set(it["d"] for it in items if it.get("d") and it["d"] != "_review")))

    # Pieces HTML options
    piece_opts = "".join(f'<div class="custom-option" data-value="{p}">{p}</div>' for p in pieces)
    mat_opts = "".join(f'<div class="custom-option" data-value="{m}">{m}</div>' for m in materials)
    col_opts = "".join(f'<div class="custom-option" data-value="{c}">{c}</div>' for c in colours)
    stg_opts = "".join(f'<div class="custom-option" data-value="{s}">{s}</div>' for s in stages)
    ang_opts = "".join(f'<div class="custom-option" data-value="{a}">{a}</div>' for a in angles)
    fld_opts = "".join(f'<div class="custom-option" data-value="{f}">{f}</div>' for f in folders)

    raw_items_json = json.dumps(items, ensure_ascii=False)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{brand_title} — Visual Photo Bank</title>
  <style>
    /* -------------------------------------------------------------
       Luxury Dark Theme (100% Offline, Custom UI)
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

    .custom-select-trigger:hover {{
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
      min-width: 180px;
      max-height: 280px;
      overflow-y: auto;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
      z-index: 500;
      display: none;
    }}

    .custom-select.active .custom-select-options {{
      display: block;
    }}

    .custom-option {{
      padding: 8px 12px;
      font-size: 13px;
      color: var(--text-muted);
      cursor: pointer;
      transition: background 0.12s;
    }}

    .custom-option:hover {{
      background: var(--bg-card);
      color: var(--text-main);
    }}

    .custom-option.selected {{
      background: rgba(212, 175, 55, 0.15);
      color: var(--gold-text);
      font-weight: 600;
    }}

    /* Score Pills */
    .score-pills {{
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: auto;
    }}

    .score-pill {{
      background: var(--bg-control);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }}

    .score-pill:hover {{
      border-color: var(--border-hover);
      color: var(--text-main);
    }}

    .score-pill.active {{
      background: var(--gold-primary);
      color: #000;
      border-color: var(--gold-primary);
      box-shadow: 0 0 10px var(--gold-glow);
    }}

    /* Gallery Grid */
    main {{
      padding: 24px 28px;
    }}

    .gallery-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 18px;
    }}

    .card {{
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s, box-shadow 0.2s;
      display: flex;
      flex-direction: column;
      position: relative;
    }}

    .card:hover {{
      transform: translateY(-4px);
      border-color: var(--border-hover);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5);
    }}

    .card.is-review {{
      border-left: 3px solid #ef4444;
    }}

    .card-thumb-wrapper {{
      position: relative;
      width: 100%;
      height: 200px;
      background: #0d111a;
      overflow: hidden;
    }}

    .card-thumb {{
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }}

    .card:hover .card-thumb {{
      transform: scale(1.04);
    }}

    /* Score Badge */
    .card-score {{
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 800;
      font-size: 12px;
      color: #000;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      z-index: 2;
    }}

    .score-5 {{ background: var(--badge-score-5); color: #fff; }}
    .score-4 {{ background: var(--badge-score-4); color: #000; }}
    .score-3 {{ background: var(--badge-score-3); color: #000; }}
    .score-2 {{ background: var(--badge-score-2); color: #fff; }}
    .score-1 {{ background: #991b1b; color: #fff; }}

    /* Near-Twin Group Badge */
    .twin-badge {{
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(18, 22, 32, 0.9);
      border: 1px solid var(--gold-primary);
      color: var(--gold-text);
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 4px;
    }}

    .card-content {{
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }}

    .card-title {{
      font-size: 13px;
      font-weight: 600;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }}

    .card-specs {{
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }}

    .spec-item {{
      text-transform: capitalize;
    }}

    .spec-dot {{
      color: var(--text-faint);
    }}

    .card-chips {{
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
    }}

    .chip {{
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--bg-control);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      text-transform: capitalize;
    }}

    .card-folder {{
      font-size: 11px;
      color: var(--text-faint);
      margin-top: auto;
      padding-top: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }}

    /* Modal Inspector */
    .modal-overlay {{
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(5, 7, 10, 0.85);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 30px;
    }}

    .modal-overlay.open {{
      display: flex;
    }}

    .modal-dialog {{
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      width: 100%;
      max-width: 1060px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
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
      gap: 16px;
    }}

    .modal-title h2 {{
      font-size: 16px;
      font-weight: 700;
      color: var(--text-main);
    }}

    .modal-title p {{
      font-size: 12px;
      color: var(--text-muted);
    }}

    .modal-close {{
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 24px;
      cursor: pointer;
      line-height: 1;
    }}

    .modal-close:hover {{
      color: var(--text-main);
    }}

    .modal-body {{
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 24px;
      padding: 24px;
    }}

    .modal-preview-box {{
      background: #090b10;
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 380px;
    }}

    .modal-preview-box img {{
      max-width: 100%;
      max-height: 520px;
      object-fit: contain;
    }}

    .modal-details {{
      display: flex;
      flex-direction: column;
      gap: 16px;
    }}

    .detail-section-title {{
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--gold-text);
      margin-bottom: 8px;
    }}

    .specs-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }}

    .specs-table tr {{
      border-bottom: 1px solid var(--border-subtle);
    }}

    .specs-table td {{
      padding: 8px 4px;
    }}

    .specs-table td:first-child {{
      color: var(--text-muted);
      width: 120px;
    }}

    .specs-table td:last-child {{
      color: var(--text-main);
      font-weight: 500;
    }}

    /* Score breakdown bars */
    .score-breakdown {{
      display: flex;
      flex-direction: column;
      gap: 8px;
    }}

    .score-bar-row {{
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
    }}

    .score-bar-label {{
      width: 80px;
      color: var(--text-muted);
      text-transform: capitalize;
    }}

    .score-bar-track {{
      flex: 1;
      height: 6px;
      background: var(--bg-control);
      border-radius: 3px;
      overflow: hidden;
    }}

    .score-bar-fill {{
      height: 100%;
      background: var(--gold-primary);
      border-radius: 3px;
    }}

    .score-bar-val {{
      width: 30px;
      text-align: right;
      color: var(--text-main);
      font-weight: 600;
    }}

    .path-copy-box {{
      background: var(--bg-control);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }}

    .path-copy-text {{
      font-family: monospace;
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }}

    .btn-copy {{
      background: rgba(212, 175, 55, 0.15);
      border: 1px solid var(--gold-primary);
      color: var(--gold-text);
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }}

    .btn-copy:hover {{
      background: var(--gold-primary);
      color: #000;
    }}

    /* Twin Takes Mini Gallery in Modal */
    .modal-twins-section {{
      padding: 0 24px 24px 24px;
    }}

    .twins-strip {{
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 8px;
    }}

    .twin-mini-card {{
      background: var(--bg-control);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 6px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;
      min-width: 80px;
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
        <div class="brand-logo">{brand_logo}</div>
        <div class="brand-title">
          <h1>{brand_title}</h1>
          <p>{brand_subtitle}</p>
        </div>
      </div>

      <!-- Search Input -->
      <div class="search-wrapper">
        <input type="text" id="searchInput" class="search-input" placeholder="Search piece, material, colour, project note, or filename...">
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
          Showing <strong id="visibleCount">0</strong> cards
        </div>
        <button id="resetFiltersBtn" class="btn-reset">Reset Filters</button>
      </div>
    </div>

    <!-- Filter Toolbar -->
    <div class="filter-bar">
      <!-- Piece Dropdown -->
      <div class="custom-select" id="selectPiece" data-field="piece">
        <div class="custom-select-trigger">
          <span class="trigger-label">Category: All</span>
          <span style="font-size: 10px;">▼</span>
        </div>
        <div class="custom-select-options">
          <div class="custom-option selected" data-value="">All Categories</div>
          {piece_opts}
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
          {mat_opts}
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
          {col_opts}
        </div>
      </div>

      <!-- Stage Dropdown -->
      <div class="custom-select" id="selectStage" data-field="stage">
        <div class="custom-select-trigger">
          <span class="trigger-label">Stage: All</span>
          <span style="font-size: 10px;">▼</span>
        </div>
        <div class="custom-select-options">
          <div class="custom-option selected" data-value="">All Stages</div>
          {stg_opts}
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
          {ang_opts}
        </div>
      </div>

      <!-- Folder Dropdown -->
      <div class="custom-select" id="selectFolder" data-field="folder">
        <div class="custom-select-trigger">
          <span class="trigger-label">Folder: All</span>
          <span style="font-size: 10px;">▼</span>
        </div>
        <div class="custom-select-options">
          <div class="custom-option selected" data-value="">All Folders</div>
          {fld_opts}
        </div>
      </div>

      <!-- Sort Dropdown -->
      <div class="custom-select" id="selectSort">
        <div class="custom-select-trigger">
          <span class="trigger-label">Sort: AI Score (High → Low)</span>
          <span style="font-size: 10px;">▼</span>
        </div>
        <div class="custom-select-options">
          <div class="custom-option selected" data-value="score-desc">AI Score (High → Low)</div>
          <div class="custom-option" data-value="score-asc">AI Score (Low → High)</div>
          <div class="custom-option" data-value="date-desc">Date (Newest First)</div>
          <div class="custom-option" data-value="date-asc">Date (Oldest First)</div>
          <div class="custom-option" data-value="name-asc">File Name (A → Z)</div>
        </div>
      </div>

      <!-- Score Pills -->
      <div class="score-pills">
        <div class="score-pill active" data-score="0">All</div>
        <div class="score-pill" data-score="3.0">≥ 3.0</div>
        <div class="score-pill" data-score="3.5">≥ 3.5</div>
        <div class="score-pill" data-score="4.0">≥ 4.0</div>
        <div class="score-pill" data-score="4.5">≥ 4.5</div>
      </div>
    </div>
  </header>

  <!-- Gallery Main View -->
  <main>
    <div id="galleryGrid" class="gallery-grid"></div>
  </main>

  <!-- Modal Inspector -->
  <div id="modalOverlay" class="modal-overlay">
    <div class="modal-dialog">
      <div class="modal-header">
        <div class="modal-title">
          <h2 id="modalFilename">filename.jpg</h2>
          <p id="modalFolderInfo">folder name • dimensions • date</p>
        </div>
        <button id="modalCloseBtn" class="modal-close">&times;</button>
      </div>

      <div class="modal-body">
        <div class="modal-preview-box">
          <img id="modalPreviewImg" src="" alt="Photo Preview">
        </div>

        <div class="modal-details">
          <div>
            <div class="detail-section-title">Zero-Shot Specifications</div>
            <table class="specs-table">
              <tr><td>Category</td><td id="modalSpecPiece">-</td></tr>
              <tr><td>Material</td><td id="modalSpecMaterial">-</td></tr>
              <tr><td>Colour</td><td id="modalSpecColour">-</td></tr>
              <tr><td>Stage</td><td id="modalSpecStage">-</td></tr>
              <tr><td>Angle</td><td id="modalSpecAngle">-</td></tr>
              <tr><td>Space / Type</td><td id="modalSpecSpace">-</td></tr>
            </table>
          </div>

          <div>
            <div class="detail-section-title">Explainable AI-Source Score (<span id="modalAiScoreTotal">4.2</span>/5.0)</div>
            <div class="score-breakdown">
              <div class="score-bar-row">
                <span class="score-bar-label">Resolution</span>
                <div class="score-bar-track"><div id="barResolution" class="score-bar-fill" style="width: 80%;"></div></div>
                <span id="valResolution" class="score-bar-val">4.0</span>
              </div>
              <div class="score-bar-row">
                <span class="score-bar-label">Sharpness</span>
                <div class="score-bar-track"><div id="barSharpness" class="score-bar-fill" style="width: 70%;"></div></div>
                <span id="valSharpness" class="score-bar-val">3.5</span>
              </div>
              <div class="score-bar-row">
                <span class="score-bar-label">Exposure</span>
                <div class="score-bar-track"><div id="barExposure" class="score-bar-fill" style="width: 90%;"></div></div>
                <span id="valExposure" class="score-bar-val">4.5</span>
              </div>
              <div class="score-bar-row">
                <span class="score-bar-label">Clutter Free</span>
                <div class="score-bar-track"><div id="barClutter" class="score-bar-fill" style="width: 85%;"></div></div>
                <span id="valClutter" class="score-bar-val">4.2</span>
              </div>
              <div class="score-bar-row">
                <span class="score-bar-label">Dominance</span>
                <div class="score-bar-track"><div id="barDominance" class="score-bar-fill" style="width: 95%;"></div></div>
                <span id="valDominance" class="score-bar-val">4.8</span>
              </div>
            </div>
          </div>

          <div>
            <div class="detail-section-title">Project Note</div>
            <p id="modalProjectNote" style="font-size: 13px; color: var(--text-muted);">-</p>
          </div>

          <div>
            <div class="detail-section-title">Full Disk Path</div>
            <div class="path-copy-box">
              <span id="modalPathText" class="path-copy-text">/path/to/file.jpg</span>
              <button id="modalCopyBtn" class="btn-copy">Copy Path</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Near-Twin Takes Strip -->
      <div id="modalTwinsSection" class="modal-twins-section" style="display: none;">
        <div class="detail-section-title" id="modalTwinsTitle">Near-Twin Takes In This Group (3 Photos)</div>
        <div id="modalTwinsStrip" class="twins-strip"></div>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="toast" class="toast">✓ Path copied to clipboard!</div>

  <!-- Data & Application Logic -->
  <script>
    const RAW_ITEMS = {raw_items_json};

    // Application State
    const state = {{
      search: "",
      piece: "",
      material: "",
      colour: "",
      stage: "",
      angle: "",
      folder: "",
      minScore: 0.0,
      showReview: false,
      sortBy: "score-desc"
    }};

    // DOM Elements
    const galleryGrid = document.getElementById("galleryGrid");
    const visibleCount = document.getElementById("visibleCount");
    const searchInput = document.getElementById("searchInput");
    const searchClearBtn = document.getElementById("searchClearBtn");
    const toggleReviewLabel = document.getElementById("toggleReviewLabel");
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");
    const scorePills = document.querySelectorAll(".score-pill");

    const modalOverlay = document.getElementById("modalOverlay");
    const modalCloseBtn = document.getElementById("modalCloseBtn");
    const modalFilename = document.getElementById("modalFilename");
    const modalFolderInfo = document.getElementById("modalFolderInfo");
    const modalPreviewImg = document.getElementById("modalPreviewImg");
    const modalSpecPiece = document.getElementById("modalSpecPiece");
    const modalSpecMaterial = document.getElementById("modalSpecMaterial");
    const modalSpecColour = document.getElementById("modalSpecColour");
    const modalSpecStage = document.getElementById("modalSpecStage");
    const modalSpecAngle = document.getElementById("modalSpecAngle");
    const modalSpecSpace = document.getElementById("modalSpecSpace");
    const modalAiScoreTotal = document.getElementById("modalAiScoreTotal");
    const modalProjectNote = document.getElementById("modalProjectNote");
    const modalPathText = document.getElementById("modalPathText");
    const modalCopyBtn = document.getElementById("modalCopyBtn");
    const toastEl = document.getElementById("toast");

    const barResolution = document.getElementById("barResolution");
    const barSharpness = document.getElementById("barSharpness");
    const barExposure = document.getElementById("barExposure");
    const barClutter = document.getElementById("barClutter");
    const barDominance = document.getElementById("barDominance");
    const valResolution = document.getElementById("valResolution");
    const valSharpness = document.getElementById("valSharpness");
    const valExposure = document.getElementById("valExposure");
    const valClutter = document.getElementById("valClutter");
    const valDominance = document.getElementById("valDominance");

    const modalTwinsSection = document.getElementById("modalTwinsSection");
    const modalTwinsTitle = document.getElementById("modalTwinsTitle");
    const modalTwinsStrip = document.getElementById("modalTwinsStrip");

    // Map of items by filename
    const itemsMap = {{}};
    RAW_ITEMS.forEach(it => {{ itemsMap[it.f] = it; }});

    function getScoreClass(score) {{
      if (score >= 4.5) return "score-5";
      if (score >= 4.0) return "score-4";
      if (score >= 3.0) return "score-3";
      if (score >= 2.0) return "score-2";
      return "score-1";
    }}

    function filterAndSortItems() {{
      const q = state.search.toLowerCase().trim();

      return RAW_ITEMS.filter(it => {{
        // Filter review items
        if (!state.showReview && it.d === "_review") return false;

        // Near-twin collapsing: in default gallery, only show primary twin cards
        if (!it.is_twin_primary) return false;

        // Score filter
        if (state.minScore > 0 && it.sc < state.minScore) return false;

        // Custom dropdown filters
        if (state.piece && it.p !== state.piece && it.p2 !== state.piece) return false;
        if (state.material && it.m !== state.material && it.m2 !== state.material) return false;
        if (state.colour && it.c !== state.colour) return false;
        if (state.stage && it.s !== state.stage) return false;
        if (state.angle && it.a !== state.angle) return false;
        if (state.folder && it.d !== state.folder) return false;

        // Search text matching
        if (q) {{
          const matchF = it.f.toLowerCase().includes(q);
          const matchP = (it.p || "").toLowerCase().includes(q) || (it.p2 || "").toLowerCase().includes(q);
          const matchM = (it.m || "").toLowerCase().includes(q) || (it.m2 || "").toLowerCase().includes(q);
          const matchC = (it.c || "").toLowerCase().includes(q);
          const matchN = (it.n || "").toLowerCase().includes(q);
          const matchD = (it.d || "").toLowerCase().includes(q);
          const matchS = (it.s || "").toLowerCase().includes(q);
          if (!matchF && !matchP && !matchM && !matchC && !matchN && !matchD && !matchS) {{
            return false;
          }}
        }}

        return true;
      }}).sort((a, b) => {{
        if (state.sortBy === "score-desc") return b.sc - a.sc;
        if (state.sortBy === "score-asc") return a.sc - b.sc;
        if (state.sortBy === "date-desc") return (b.dt || "").localeCompare(a.dt || "");
        if (state.sortBy === "date-asc") return (a.dt || "").localeCompare(b.dt || "");
        if (state.sortBy === "name-asc") return a.f.localeCompare(b.f);
        return 0;
      }});
    }}

    function renderGallery() {{
      const filtered = filterAndSortItems();
      visibleCount.textContent = filtered.length;

      if (filtered.length === 0) {{
        galleryGrid.innerHTML = `
          <div class="empty-state">
            <h3>No Photographs Match the Current Filters</h3>
            <p>Try resetting some filters, clearing the search term, or toggling "Show review items".</p>
          </div>
        `;
        return;
      }}

      let html = "";
      for (let i = 0; i < filtered.length; i++) {{
        const it = filtered[i];
        const scClass = getScoreClass(it.sc);
        const isRev = it.d === "_review";
        const hasTwins = it.twin_count > 0;

        const twinBadgeHtml = hasTwins
          ? `<div class="twin-badge"><span>❖</span> +${{it.twin_count}} similar</div>`
          : "";

        html += `
          <div class="card ${{isRev ? 'is-review' : ''}}" onclick="openModal('${{it.f}}')">
            <div class="card-thumb-wrapper">
              <img class="card-thumb" src="${{it.t}}" loading="lazy" alt="${{it.f}}">
              <div class="card-score ${{scClass}}">${{it.sc.toFixed(1)}}</div>
              ${{twinBadgeHtml}}
            </div>
            <div class="card-content">
              <div class="card-title" title="${{it.f}}">${{it.f}}</div>
              <div class="card-specs">
                <span class="spec-item">${{it.p}}</span>
                <span class="spec-dot">•</span>
                <span class="spec-item">${{it.m}}</span>
                <span class="spec-dot">•</span>
                <span class="spec-item">${{it.c}}</span>
              </div>
              <div class="card-chips">
                <span class="chip">${{it.s}}</span>
                <span class="chip">${{it.a}}</span>
              </div>
              <div class="card-folder" title="${{it.d}}">${{it.d}}</div>
            </div>
          </div>
        `;
      }}
      galleryGrid.innerHTML = html;
    }}

    function openModal(filename) {{
      const it = itemsMap[filename];
      if (!it) return;

      modalFilename.textContent = it.f;
      modalFolderInfo.textContent = `${{it.d}} • ${{it.w}}x${{it.h}} px • ${{it.dt}}`;
      modalPreviewImg.src = it.t;

      modalSpecPiece.textContent = it.p + (it.p2 ? ` (also: ${{it.p2}})` : '');
      modalSpecMaterial.textContent = it.m + (it.m2 ? ` (also: ${{it.m2}})` : '');
      modalSpecColour.textContent = it.c;
      modalSpecStage.textContent = it.s;
      modalSpecAngle.textContent = it.a;
      modalSpecSpace.textContent = it.st;

      modalAiScoreTotal.textContent = it.sc.toFixed(1);
      const parts = it.parts || {{}};

      const r = parts.resolution || 3.0;
      const sh = parts.sharpness || 3.0;
      const exp = parts.exposure || 3.0;
      const cl = parts.clutter || 3.0;
      const dom = parts.dominance || 3.0;

      barResolution.style.width = (r / 5 * 100) + "%";
      valResolution.textContent = r.toFixed(1);
      barSharpness.style.width = (sh / 5 * 100) + "%";
      valSharpness.textContent = sh.toFixed(1);
      barExposure.style.width = (exp / 5 * 100) + "%";
      valExposure.textContent = exp.toFixed(1);
      barClutter.style.width = (cl / 5 * 100) + "%";
      valClutter.textContent = cl.toFixed(1);
      barDominance.style.width = (dom / 5 * 100) + "%";
      valDominance.textContent = dom.toFixed(1);

      modalProjectNote.textContent = it.n || "No project note recorded.";
      modalPathText.textContent = it.fp;

      // Handle Near-Twins Strip
      if (it.tg && it.twins && it.twins.length > 0) {{
        modalTwinsSection.style.display = "block";
        modalTwinsTitle.textContent = `Near-Twin Takes In This Group (${{it.twins.length + 1}} Photos • ${{it.tg}})`;

        const allTwinFnames = [it.is_twin_primary ? it.f : (it.primary || it.f), ...it.twins].filter((v, idx, arr) => arr.indexOf(v) === idx);

        let stripHtml = "";
        allTwinFnames.forEach(fn => {{
          const twinItem = itemsMap[fn];
          if (twinItem) {{
            const isCur = fn === filename;
            stripHtml += `
              <div class="twin-mini-card ${{isCur ? 'active' : ''}}" onclick="openModal('${{fn}}')">
                <img class="twin-mini-thumb" src="${{twinItem.t}}" alt="${{fn}}">
                <span class="twin-mini-score">${{twinItem.sc.toFixed(1)}}</span>
              </div>
            `;
          }}
        }});
        modalTwinsStrip.innerHTML = stripHtml;
      }} else {{
        modalTwinsSection.style.display = "none";
      }}

      modalOverlay.classList.add("open");
    }}

    function closeModal() {{
      modalOverlay.classList.remove("open");
    }}

    modalCloseBtn.onclick = closeModal;
    modalOverlay.onclick = (e) => {{
      if (e.target === modalOverlay) closeModal();
    }};
    document.addEventListener("keydown", (e) => {{
      if (e.key === "Escape") closeModal();
    }});

    // Copy Path Button
    modalCopyBtn.onclick = () => {{
      const path = modalPathText.textContent;
      navigator.clipboard.writeText(path).then(() => {{
        toastEl.textContent = "✓ Path copied to clipboard!";
        toastEl.classList.add("show");
        setTimeout(() => toastEl.classList.remove("show"), 2500);
      }}).catch(() => {{
        const ta = document.createElement("textarea");
        ta.value = path;
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

    // Review Toggle Button
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
    return html
