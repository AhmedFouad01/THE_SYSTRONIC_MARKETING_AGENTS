// TSST BR-002 — one-time verbatim export of Google Docs to plain files beside them.
// Run once at script.google.com (New project → paste → Run `exportAll` → authorise your own account).
// Writes/refreshes the plain export next to each Doc (re-run safe); never edits, moves or
// deletes the Docs. All exports are text/plain (verbatim); shortcuts are followed.
const ROOT = 'THE_SYSTRONIC_MARKETING_AGENTS';
const FILES = [
  ["CRM_UI_HANDOFF/CLAUDE.md.gdoc", "CRM_UI_HANDOFF/CLAUDE.md"],
  ["CRM_UI_HANDOFF/docs/ui-system/ACCEPTANCE_GATES.md.gdoc", "CRM_UI_HANDOFF/docs/ui-system/ACCEPTANCE_GATES.md"],
  ["CRM_UI_HANDOFF/docs/ui-system/COMPONENT_CONTRACTS.md.gdoc", "CRM_UI_HANDOFF/docs/ui-system/COMPONENT_CONTRACTS.md"],
  ["CRM_UI_HANDOFF/docs/ui-system/CRM_DATA_WORKSPACE.md.gdoc", "CRM_UI_HANDOFF/docs/ui-system/CRM_DATA_WORKSPACE.md"],
  ["CRM_UI_HANDOFF/docs/ui-system/DESIGN_TOKENS.md.gdoc", "CRM_UI_HANDOFF/docs/ui-system/DESIGN_TOKENS.md"],
  ["CRM_UI_HANDOFF/docs/ui-system/IMPLEMENTATION_SEQUENCE.md.gdoc", "CRM_UI_HANDOFF/docs/ui-system/IMPLEMENTATION_SEQUENCE.md"],
  ["CRM_UI_HANDOFF/docs/ui-system/README.md.gdoc", "CRM_UI_HANDOFF/docs/ui-system/README.md"],
  ["CRM_UI_HANDOFF/docs/ui-system/RTL_RESPONSIVE.md.gdoc", "CRM_UI_HANDOFF/docs/ui-system/RTL_RESPONSIVE.md"],
  ["CRM_UI_HANDOFF/docs/ui-system/UI_ARCHITECTURE.md.gdoc", "CRM_UI_HANDOFF/docs/ui-system/UI_ARCHITECTURE.md"],
  ["CRM_UI_HANDOFF/docs/ui-system/UX_RULES.md.gdoc", "CRM_UI_HANDOFF/docs/ui-system/UX_RULES.md"],
  ["CRM_UI_HANDOFF/docs/ui-system/reference/REFERENCE_INDEX.md.gdoc", "CRM_UI_HANDOFF/docs/ui-system/reference/REFERENCE_INDEX.md"],
  ["CRM_UI_HANDOFF/docs/ui-system/prototype/CRMMVPSharedArchitecture.css.gdoc", "CRM_UI_HANDOFF/docs/ui-system/prototype/CRMMVPSharedArchitecture.css"],
  ["CRM_UI_HANDOFF/docs/ui-system/prototype/CRMMVPSharedArchitecture.tsx.gdoc", "CRM_UI_HANDOFF/docs/ui-system/prototype/CRMMVPSharedArchitecture.tsx"],
  ["CRM_UI_HANDOFF/docs/ui-system/prototype/CRM_index.css.gdoc", "CRM_UI_HANDOFF/docs/ui-system/prototype/CRM_index.css"],
  ["CRM_UI_HANDOFF/docs/ui-system/prototype/SystronicUIDesignSystem.tsx.gdoc", "CRM_UI_HANDOFF/docs/ui-system/prototype/SystronicUIDesignSystem.tsx"],
  ["CRM_APP/CRM_MVP_SPRINT_PLAN_v0.1.md.gdoc", "CRM_APP/CRM_MVP_SPRINT_PLAN_v0.1.md"],
  ["CRM_APP/CRM_UI_FOUNDATIONS_v0.1.md.gdoc", "CRM_APP/CRM_UI_FOUNDATIONS_v0.1.md"],
  ["CRM_APP/MVP_COMMAND_MAP.md.gdoc", "CRM_APP/MVP_COMMAND_MAP.md"],
  ["CRM_APP/MVP_CORE_TASK_FLOWS.md.gdoc", "CRM_APP/MVP_CORE_TASK_FLOWS.md"],
  ["CRM_APP/MVP_INFORMATION_ARCHITECTURE.md.gdoc", "CRM_APP/MVP_INFORMATION_ARCHITECTURE.md"],
  ["CRM_APP/MVP_INTERACTION_MODEL.md.gdoc", "CRM_APP/MVP_INTERACTION_MODEL.md"],
  ["CRM_APP/MVP_KEYBOARD_FOCUS_MAP.md.gdoc", "CRM_APP/MVP_KEYBOARD_FOCUS_MAP.md"],
  ["CRM_APP/MVP_LOFI_WORKSPACE_WIREFRAMES.md.gdoc", "CRM_APP/MVP_LOFI_WORKSPACE_WIREFRAMES.md"],
  ["CRM_APP/MVP_SCREEN_INVENTORY.md.gdoc", "CRM_APP/MVP_SCREEN_INVENTORY.md"],
  ["CRM_APP/MVP_STATE_OVERLAY_MATRIX.md.gdoc", "CRM_APP/MVP_STATE_OVERLAY_MATRIX.md"],
  ["CRM_APP/MVP_UI_DIRECTIONS_BRIEF_v0.1.md.gdoc", "CRM_APP/MVP_UI_DIRECTIONS_BRIEF_v0.1.md"],
  ["CRM_APP/MVP_UX_AUDIT.md.gdoc", "CRM_APP/MVP_UX_AUDIT.md"],
  ["CRM_APP/MVP_VISUAL_FOUNDATIONS_LOCK_v0.1.md.gdoc", "CRM_APP/MVP_VISUAL_FOUNDATIONS_LOCK_v0.1.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-RM-20260927-0521-001.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-RM-20260927-0521-001.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-RM-20261004-0456-001.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-RM-20261004-0456-001.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20260928-1220-DEV_AG-IMPLEMENTATION.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20260928-1220-DEV_AG-IMPLEMENTATION.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261002-1644-CRM-M1-CLOSURE.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261002-1644-CRM-M1-CLOSURE.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261003-0102-CRM-M2-MVP-DIRECTION.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261003-0102-CRM-M2-MVP-DIRECTION.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261003-1356-CRM-MVP-UIUX-SPRINT.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261003-1356-CRM-MVP-UIUX-SPRINT.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261003-2342-CRM-UI-SYSTEM-BASELINE.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261003-2342-CRM-UI-SYSTEM-BASELINE.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261004-0218-SECOND-BRAIN-RUNBOOK — العقل التاني وطريقة تشغيله.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261004-0218-SECOND-BRAIN-RUNBOOK — العقل التاني وطريقة تشغيله.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261004-CRM-UI-MVP-FOUNDATION.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261004-CRM-UI-MVP-FOUNDATION.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/registry.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/registry.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/brand.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/brand.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/rules.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/rules.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/scope.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/scope.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/status.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/status.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/memory/source.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/memory/source.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/brand.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/brand.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/rules.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/rules.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/scope.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/scope.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/status.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/status.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/memory/source.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/memory/source.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/brand.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/brand.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/rules.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/rules.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/scope.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/scope.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/status.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/status.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/memory/source.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/memory/source.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/brand.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/brand.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/rules.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/rules.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/scope.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/scope.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/status.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/status.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/memory/source.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/memory/source.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/brand.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/brand.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/rules.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/rules.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/scope.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/scope.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/status.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/status.md"],
  ["REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/memory/source.md.gdoc", "REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/memory/source.md"],
  // BR-004 (2026-10-04): CREATIVE skills 020-030, CREATIVE CRM docs, legacy Real Memory
  ["TSST/CREATIVE/skills/tsst-creative-sk-020-product-ux-architecture-information-architecture/SKILL.md.gdoc", "TSST/CREATIVE/skills/tsst-creative-sk-020-product-ux-architecture-information-architecture/SKILL.md"],
  ["TSST/CREATIVE/skills/tsst-creative-sk-021-enterprise-workspace-navigation-context/SKILL.md.gdoc", "TSST/CREATIVE/skills/tsst-creative-sk-021-enterprise-workspace-navigation-context/SKILL.md"],
  ["TSST/CREATIVE/skills/tsst-creative-sk-022-crm-data-grids-tables-views-bulk-actions/SKILL.md.gdoc", "TSST/CREATIVE/skills/tsst-creative-sk-022-crm-data-grids-tables-views-bulk-actions/SKILL.md"],
  ["TSST/CREATIVE/skills/tsst-creative-sk-023-master-detail-records-drawers-contextual-actions/SKILL.md.gdoc", "TSST/CREATIVE/skills/tsst-creative-sk-023-master-detail-records-drawers-contextual-actions/SKILL.md"],
  ["TSST/CREATIVE/skills/tsst-creative-sk-024-command-palette-keyboard-first-productivity/SKILL.md.gdoc", "TSST/CREATIVE/skills/tsst-creative-sk-024-command-palette-keyboard-first-productivity/SKILL.md"],
  ["TSST/CREATIVE/skills/tsst-creative-sk-025-forms-validation-error-recovery/SKILL.md.gdoc", "TSST/CREATIVE/skills/tsst-creative-sk-025-forms-validation-error-recovery/SKILL.md"],
  ["TSST/CREATIVE/skills/tsst-creative-sk-026-arabic-first-rtl-bidi-product-ux/SKILL.md.gdoc", "TSST/CREATIVE/skills/tsst-creative-sk-026-arabic-first-rtl-bidi-product-ux/SKILL.md"],
  ["TSST/CREATIVE/skills/tsst-creative-sk-027-accessible-interaction-wcag22/SKILL.md.gdoc", "TSST/CREATIVE/skills/tsst-creative-sk-027-accessible-interaction-wcag22/SKILL.md"],
  ["TSST/CREATIVE/skills/tsst-creative-sk-028-responsive-adaptive-saas-layouts/SKILL.md.gdoc", "TSST/CREATIVE/skills/tsst-creative-sk-028-responsive-adaptive-saas-layouts/SKILL.md"],
  ["TSST/CREATIVE/skills/tsst-creative-sk-029-dashboard-data-visualization-ux/SKILL.md.gdoc", "TSST/CREATIVE/skills/tsst-creative-sk-029-dashboard-data-visualization-ux/SKILL.md"],
  ["TSST/CREATIVE/skills/tsst-creative-sk-030-usability-testing-heuristic-evaluation-ux-qa/SKILL.md.gdoc", "TSST/CREATIVE/skills/tsst-creative-sk-030-usability-testing-heuristic-evaluation-ux-qa/SKILL.md"],
  ["TSST/CREATIVE/CRM_MVP_UIUX_EXECUTION_PLAN_v0.1.md.gdoc", "TSST/CREATIVE/CRM_MVP_UIUX_EXECUTION_PLAN_v0.1.md"],
  ["TSST/CREATIVE/CRM_MVP_COMPONENT_SYSTEM_BRIEF_v0.1.md.gdoc", "TSST/CREATIVE/CRM_MVP_COMPONENT_SYSTEM_BRIEF_v0.1.md"],
  ["REAL_MEMORY/THE_SYSTRONIC_LEGACY_REAL_MEMORY/00_START_HERE/PROJECT_WORK_INSTRUCTIONS.md.gdoc", "REAL_MEMORY/THE_SYSTRONIC_LEGACY_REAL_MEMORY/00_START_HERE/PROJECT_WORK_INSTRUCTIONS.md"],
  ["REAL_MEMORY/THE_SYSTRONIC_LEGACY_REAL_MEMORY/01_CURRENT_STATUS/CURRENT_STATUS.md.gdoc", "REAL_MEMORY/THE_SYSTRONIC_LEGACY_REAL_MEMORY/01_CURRENT_STATUS/CURRENT_STATUS.md"],
  ["REAL_MEMORY/THE_SYSTRONIC_LEGACY_REAL_MEMORY/02_PROJECT_MEMORY/PROJECT_MASTER.md.gdoc", "REAL_MEMORY/THE_SYSTRONIC_LEGACY_REAL_MEMORY/02_PROJECT_MEMORY/PROJECT_MASTER.md"],
  ["REAL_MEMORY/THE_SYSTRONIC_LEGACY_REAL_MEMORY/04_SOURCE_MAP/SOURCE_MAP.md.gdoc", "REAL_MEMORY/THE_SYSTRONIC_LEGACY_REAL_MEMORY/04_SOURCE_MAP/SOURCE_MAP.md"],
  ["REAL_MEMORY/THE_SYSTRONIC_LEGACY_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/SYNC_INBOX_CONTRACT.md.gdoc", "REAL_MEMORY/THE_SYSTRONIC_LEGACY_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/SYNC_INBOX_CONTRACT.md"],
  ["REAL_MEMORY/THE_SYSTRONIC_LEGACY_REAL_MEMORY/PROJECT_SETUP_MANIFEST.md.gdoc", "REAL_MEMORY/THE_SYSTRONIC_LEGACY_REAL_MEMORY/PROJECT_SETUP_MANIFEST.md"]
];

// Repo folder (owned by another account, shared with edit rights). Pinned by id, not by name.
const ROOT_ID = '1n3wJ3zQ3CP4WkjmfXFbJM2mInS1Z_aNM';

function findRoot() {
  let f;
  try { f = DriveApp.getFolderById(ROOT_ID); }
  catch (e) { throw new Error('No access to folder ' + ROOT_ID + ' from this account: ' + e.message); }
  if (f.getName() !== ROOT || !f.getFoldersByName('TSST').hasNext() || !f.getFoldersByName('CRM_APP').hasNext())
    throw new Error('Folder ' + ROOT_ID + ' is "' + f.getName() + '", not the TSST repo root');
  return f;
}

function exportAll() {
  const root = findRoot();
  Logger.log('root folder id: ' + root.getId());
  const report = {created: 0, updated: 0, missing: []};
  FILES.forEach(([src, dst]) => {
    const parts = src.split('/');
    const title = parts.pop().replace(/\.gdoc$/, '');
    let folders = [root];
    for (const p of parts) {
      folders = [].concat(...folders.map(f => subfolders(f, p)));
      if (!folders.length) { report.missing.push(src + ' (folder "' + p + '" not found)'); return; }
    }
    let folder = null, doc = null;
    for (const f of folders) { doc = findDoc(f, title); if (doc) { folder = f; break; } }
    if (!doc) { report.missing.push(src + ' (' + seen(folders, title) + ')'); return; }
    // Docs hold raw text (Markdown or code), so text/plain is the verbatim export;
    // text/markdown would escape it (\# , \_).
    const url = 'https://www.googleapis.com/drive/v3/files/' + doc.getId() + '/export?mimeType=text%2Fplain';
    const res = UrlFetchApp.fetch(url, {headers: {Authorization: 'Bearer ' + ScriptApp.getOAuthToken()}, muteHttpExceptions: true});
    if (res.getResponseCode() !== 200) { report.missing.push(src + ' (HTTP ' + res.getResponseCode() + ')'); return; }
    const text = res.getContentText('UTF-8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
    const outName = dst.split('/').pop();
    const existing = findPlain(folder, outName);
    if (existing) { existing.setContent(text); report.updated++; }
    else { folder.createFile(outName, text, MimeType.PLAIN_TEXT); report.created++; }
  });
  Logger.log(JSON.stringify(report, null, 1));
}

// Real subfolders plus folder shortcuts with that name.
function subfolders(folder, name) {
  const out = [];
  const it = folder.getFoldersByName(name);
  while (it.hasNext()) out.push(it.next());
  const sc = folder.getFilesByName(name);
  while (sc.hasNext()) {
    const f = sc.next();
    if (f.getMimeType() === MimeType.SHORTCUT && f.getTargetMimeType() === MimeType.FOLDER)
      out.push(DriveApp.getFolderById(f.getTargetId()));
  }
  return out;
}

// A Google Doc with that title, directly or through a shortcut.
function findDoc(folder, name) {
  const it = folder.getFilesByName(name);
  while (it.hasNext()) {
    const f = it.next();
    if (f.getMimeType() === MimeType.GOOGLE_DOCS) return f;
    if (f.getMimeType() === MimeType.SHORTCUT && f.getTargetMimeType() === MimeType.GOOGLE_DOCS)
      return DriveApp.getFileById(f.getTargetId());
  }
  return null;
}

function findPlain(folder, name) {
  const it = folder.getFilesByName(name);
  while (it.hasNext()) {
    const f = it.next();
    const m = f.getMimeType();
    if (m !== MimeType.GOOGLE_DOCS && m !== MimeType.SHORTCUT) return f;
  }
  return null;
}

// Diagnostic for a miss: what files with that name exist, and of which type.
function seen(folders, name) {
  const types = [];
  folders.forEach(f => { const it = f.getFilesByName(name); while (it.hasNext()) types.push(it.next().getMimeType()); });
  return types.length ? 'found types: ' + types.join(', ') : 'no file titled "' + name + '"';
}

// ---------------------------------------------------------------------------------------
// Brand canonical memory roots (outside the repo). Exports are written IN PLACE, beside each
// Doc in its own Drive folder — never copied into the repo (pointer-only rule). Run
// `exportBrandRoots` from the account whose My Drive holds these paths (Drive for desktop).
// Each root: [folder id OR My-Drive path, depth (0 = that folder only, -1 = subtree), expected folder name].
// Prefer ids (Share → Copy link → the part after /folders/): they work from any account with edit access.
// Re-run after the Docs change (stale rule).
const BRAND_ROOTS = [
  ['Real Memory/real-memory-os/USERS/AHMED_FOUAD/PROJECTS/VILL_STUDIO', -1, 'VILL_STUDIO'],
  ['Real Memory/real-memory-os/01_PROJECTS/AKYRO_STUDIO', -1, 'AKYRO_STUDIO'],
  ['Yakebda_MS_Newmap', 0, 'Yakebda_MS_Newmap'],
];
const EXPORT_TAG = 'tsst-export: verbatim text/plain of the Google Doc beside it';
const KNOWN_EXT = /\.(md|txt|tsx|ts|jsx|js|css|json|ya?ml|html)$/i;

function resolveRoot(ref) {
  if (!ref.includes('/') && /^[A-Za-z0-9_-]{20,}$/.test(ref)) return DriveApp.getFolderById(ref);
  let folders = [DriveApp.getRootFolder()];
  for (const p of ref.split('/')) {
    folders = [].concat(...folders.map(f => subfolders(f, p)));
    if (!folders.length) throw new Error('folder "' + p + '" not found in this account My Drive');
  }
  return folders[0];
}

function exportBrandRoots() {
  const report = {created: 0, updated: 0, missing: []};
  BRAND_ROOTS.forEach(([ref, depth, expected]) => {
    let root;
    try { root = resolveRoot(ref); } catch (e) { report.missing.push(expected + ': ' + e.message); return; }
    if (root.getName() !== expected) { report.missing.push(expected + ': id points to "' + root.getName() + '"'); return; }
    walk(root, depth, report);
  });
  Logger.log(JSON.stringify(report, null, 1));
}

function walk(folder, depth, report) {
  const it = folder.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    let doc = null;
    if (f.getMimeType() === MimeType.GOOGLE_DOCS) doc = f;
    else if (f.getMimeType() === MimeType.SHORTCUT && f.getTargetMimeType() === MimeType.GOOGLE_DOCS)
      doc = DriveApp.getFileById(f.getTargetId());
    if (!doc) continue;
    const title = f.getName();
    const outName = KNOWN_EXT.test(title) ? title : title + '.md';
    const url = 'https://www.googleapis.com/drive/v3/files/' + doc.getId() + '/export?mimeType=text%2Fplain';
    const res = UrlFetchApp.fetch(url, {headers: {Authorization: 'Bearer ' + ScriptApp.getOAuthToken()}, muteHttpExceptions: true});
    if (res.getResponseCode() !== 200) { report.missing.push(folder.getName() + '/' + title + ' (HTTP ' + res.getResponseCode() + ')'); continue; }
    const text = res.getContentText('UTF-8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
    // Brand roots hold authored files: only overwrite exports this script created (tagged).
    const existing = findPlain(folder, outName);
    if (existing && existing.getDescription() !== EXPORT_TAG) {
      report.conflicts = (report.conflicts || []).concat(folder.getName() + '/' + outName + ' (authored file kept; Doc not exported)');
    } else if (existing) { existing.setContent(text); report.updated++; }
    else { folder.createFile(outName, text, MimeType.PLAIN_TEXT).setDescription(EXPORT_TAG); report.created++; }
  }
  if (depth === 0) return;
  const subs = folder.getFolders();
  while (subs.hasNext()) walk(subs.next(), depth - 1, report);
}
