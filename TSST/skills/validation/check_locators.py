#!/usr/bin/env python3
"""
check_locators.py - Verify LOCATOR and EXCERPT blocks in judge packets.

Usage:
    python check_locators.py <path-to-judge-packet.md>

Rules:
- Standard library only.
- For each LOCATOR: <path>#L<start>-L<end> followed by EXCERPT:,
  verifies that the target file exists and that the excerpt appears
  within the specified 1-indexed line range [start, end].
- Whitespace differences (spaces, tabs, newlines) are ignored.
- Exits with 0 if all locators are OK; exits with 1 if any locator is MISSING.
"""

import sys
import os
import re

def normalize_ws(text: str) -> str:
    """Collapse all whitespace sequences to single space and strip."""
    return re.sub(r'\s+', ' ', text).strip()

def parse_packet(md_path: str):
    with open(md_path, 'r', encoding='utf-8', errors='replace') as f:
        lines = f.readlines()

    locators = []
    i = 0
    n = len(lines)

    locator_pattern = re.compile(r'^\s*LOCATOR:\s*([^\s#]+)#L(\d+)-L(\d+)\s*$', re.IGNORECASE)

    while i < n:
        line = lines[i]
        m = locator_pattern.match(line)
        if m:
            file_path = m.group(1).strip()
            start_line = int(m.group(2))
            end_line = int(m.group(3))
            raw_locator = line.strip()

            # Advance to find EXCERPT:
            i += 1
            while i < n and not lines[i].strip().upper().startswith('EXCERPT:'):
                if locator_pattern.match(lines[i]):
                    break
                i += 1

            excerpt_lines = []
            if i < n and lines[i].strip().upper().startswith('EXCERPT:'):
                # Check if excerpt is inline on same line after EXCERPT:
                rest_of_line = lines[i].strip()[len('EXCERPT:'):].strip()
                i += 1
                if rest_of_line:
                    excerpt_lines.append(rest_of_line)
                elif i < n and lines[i].strip().startswith('```'):
                    # Fenced code block
                    i += 1
                    while i < n and not lines[i].strip().startswith('```'):
                        excerpt_lines.append(lines[i])
                        i += 1
                    if i < n and lines[i].strip().startswith('```'):
                        i += 1
                else:
                    # Regular text until blank line or next marker
                    while i < n:
                        curr = lines[i]
                        if locator_pattern.match(curr) or curr.strip().startswith('##') or curr.strip().startswith('###'):
                            break
                        if curr.strip() == '':
                            # peek ahead
                            if i + 1 < n and (locator_pattern.match(lines[i+1]) or lines[i+1].strip().startswith('#')):
                                break
                        excerpt_lines.append(curr)
                        i += 1

            excerpt_text = "".join(excerpt_lines)
            locators.append({
                'locator_str': f"{file_path}#L{start_line}-L{end_line}",
                'file_path': file_path,
                'start_line': start_line,
                'end_line': end_line,
                'excerpt': excerpt_text
            })
            continue
        i += 1

    return locators

def check_locator(loc, base_dir: str):
    file_path = loc['file_path']
    # Try resolving path relative to cwd, base_dir, or as absolute
    candidates = [
        file_path,
        os.path.join(base_dir, file_path),
        os.path.abspath(file_path),
        os.path.normpath(file_path)
    ]
    # In Windows/drive setups, also try relative to repo root
    resolved_path = None
    for cand in candidates:
        if os.path.isfile(cand):
            resolved_path = cand
            break

    if not resolved_path:
        return ("MISSING", f"File not found: {file_path}")

    try:
        with open(resolved_path, 'r', encoding='utf-8', errors='replace') as f:
            target_lines = f.readlines()
    except Exception as e:
        return ("MISSING", f"Error reading file: {e}")

    total_lines = len(target_lines)
    s = loc['start_line']
    e = loc['end_line']

    if s < 1 or e > total_lines or s > e:
        return ("MISSING", f"Line range L{s}-L{e} out of bounds (file has {total_lines} lines)")

    target_slice = "".join(target_lines[s - 1:e])

    norm_target = normalize_ws(target_slice)
    norm_excerpt = normalize_ws(loc['excerpt'])

    if not norm_excerpt:
        return ("MISSING", "Empty excerpt text")

    # Check match or containment
    if norm_excerpt in norm_target or norm_target in norm_excerpt:
        return ("OK", "Match verified")

    # Fallback: check token set or character similarity ignoring all spacing
    target_clean = re.sub(r'\s+', '', target_slice)
    excerpt_clean = re.sub(r'\s+', '', loc['excerpt'])
    if excerpt_clean in target_clean or target_clean in excerpt_clean:
        return ("OK", "Match verified (whitespace-collapsed)")

    return ("MISSING", f"Excerpt not found in lines {s}-{e}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python check_locators.py <path-to-judge-packet.md>")
        sys.exit(1)

    packet_path = sys.argv[1]
    if not os.path.isfile(packet_path):
        print(f"Error: Packet file not found: {packet_path}")
        sys.exit(1)

    base_dir = os.path.dirname(os.path.abspath(packet_path))
    locators = parse_packet(packet_path)

    if not locators:
        print(f"No locators found in {packet_path}")
        sys.exit(0)

    print(f"\nChecking {len(locators)} locator(s) in {packet_path}...\n")
    print(f"{'LOCATOR':<65} | {'STATUS':<8} | {'DETAIL'}")
    print("-" * 105)

    has_missing = False
    for loc in locators:
        status, detail = check_locator(loc, base_dir)
        print(f"{loc['locator_str']:<65} | {status:<8} | {detail}")
        if status != "OK":
            has_missing = True

    print("-" * 105)
    if has_missing:
        print("\nResult: FAILED (one or more locators are MISSING)\n")
        sys.exit(1)
    else:
        print("\nResult: ALL OK\n")
        sys.exit(0)

if __name__ == '__main__':
    main()
