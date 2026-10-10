#!/usr/bin/env python
"""
TSST Photo Bank — Reusable Visual Asset Management CLI
Universal tool for sorting, tagging, and cataloging brand photo banks.

Subcommands:
  embed     <src> <bank> [--profile <name>]
  group     <bank> [--profile <name>]
  sort      <bank> --labels <json>
  catalog   <bank> [--profile <name>]
  search    <bank> ["<text>"] [--like <file>] [--top N] [--min-score S] [--piece P] [--include-review]
  dupes     <folder>
  fidelity  <render> <source...>
"""

import sys
import os
import argparse

# Ensure local module directory is in sys.path
_TOOL_DIR = os.path.dirname(os.path.abspath(__file__))
if _TOOL_DIR not in sys.path:
    sys.path.insert(0, _TOOL_DIR)

# Reconfigure stdout for UTF-8 on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from embed import run_embed
from group import run_group
from sort import run_sort
from catalog import run_catalog
from search import run_search
from dupes import run_dupes
from fidelity import run_fidelity

def main():
    parser = argparse.ArgumentParser(
        prog="photobank",
        description="TSST Photo Bank — Universal Brand Visual Asset Management Engine"
    )
    subparsers = parser.add_subparsers(dest="command", help="Subcommand to execute")

    # 1. embed <src> <bank>
    parser_embed = subparsers.add_parser("embed", help="Extract media, timestamps, hashes, and CLIP embeddings")
    parser_embed.add_argument("src", help="Path to read-only source media directory")
    parser_embed.add_argument("bank", help="Path to destination photo bank directory")
    parser_embed.add_argument("--profile", default="generic", help="Brand profile name or path (default: generic)")

    # 2. group <bank>
    parser_group = subparsers.add_parser("group", help="Cluster time bursts, merge embeddings, detect duplicates, and generate contact sheets")
    parser_group.add_argument("bank", help="Path to photo bank directory")
    parser_group.add_argument("--profile", default="generic", help="Brand profile name or path (default: generic)")

    # 3. sort <bank> --labels <json>
    parser_sort = subparsers.add_parser("sort", help="Copy media into named project folders, duplicates, review, and generate INDEX.md")
    parser_sort.add_argument("bank", help="Path to photo bank directory")
    parser_sort.add_argument("--labels", required=True, help="Path to labels JSON defining folder assignments")

    # 4. catalog <bank>
    parser_catalog = subparsers.add_parser("catalog", help="Zero-shot tagging, AI scoring, twin takes detection, CATALOG.csv, BANK.html, and STUDIO_PICKS.md")
    parser_catalog.add_argument("bank", help="Path to photo bank directory")
    parser_catalog.add_argument("--profile", default="generic", help="Brand profile name or path (default: generic)")

    # 5. search <bank> "<text>" | --like <file>
    parser_search = subparsers.add_parser("search", help="Semantic text search or visual similarity search across photo bank")
    parser_search.add_argument("bank", help="Path to photo bank directory")
    parser_search.add_argument("query", nargs="?", default=None, help="Natural language text query")
    parser_search.add_argument("--like", dest="like_file", default=None, help="Find photos similar to a given file name or image path")
    parser_search.add_argument("--top", type=int, default=20, help="Number of results to return (default: 20)")
    parser_search.add_argument("--min-score", type=float, default=None, help="Minimum AI-source score filter (1.0 to 5.0)")
    parser_search.add_argument("--piece", default=None, help="Filter by piece/category")
    parser_search.add_argument("--material", default=None, help="Filter by material")
    parser_search.add_argument("--colour", default=None, help="Filter by colour")
    parser_search.add_argument("--stage", default=None, help="Filter by stage")
    parser_search.add_argument("--folder", default=None, help="Filter by folder name")
    parser_search.add_argument("--include-review", action="store_true", default=False, help="Include _review folder in search results")

    # 6. dupes <folder>
    parser_dupes = subparsers.add_parser("dupes", help="Scan any folder for exact and near duplicates (no bank required)")
    parser_dupes.add_argument("folder", help="Folder path to scan")

    # 7. fidelity <render> <source...>
    parser_fidelity = subparsers.add_parser("fidelity", help="Compute CLIP cosine and pHash distance between an AI render and reference product photos")
    parser_fidelity.add_argument("render", help="Path to the generated/rendered image")
    parser_fidelity.add_argument("sources", nargs="+", help="One or more reference photo paths (or directories)")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    if args.command == "embed":
        run_embed(args.src, args.bank, profile_name=args.profile)
    elif args.command == "group":
        run_group(args.bank, profile_name=args.profile)
    elif args.command == "sort":
        run_sort(args.bank, labels_path=args.labels)
    elif args.command == "catalog":
        run_catalog(args.bank, profile_name=args.profile)
    elif args.command == "search":
        run_search(
            args.bank,
            query=args.query,
            like_file=args.like_file,
            top=args.top,
            min_score=args.min_score,
            piece=args.piece,
            material=args.material,
            colour=args.colour,
            stage=args.stage,
            folder=args.folder,
            include_review=args.include_review
        )
    elif args.command == "dupes":
        run_dupes(args.folder)
    elif args.command == "fidelity":
        run_fidelity(args.render, args.sources)

if __name__ == "__main__":
    main()
