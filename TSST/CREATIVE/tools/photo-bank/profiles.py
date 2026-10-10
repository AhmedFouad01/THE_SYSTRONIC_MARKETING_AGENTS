"""
Brand profile loader and resolver for TSST Photo Bank.
Loads brand-specific prompts, categories, score weights, and UI branding from profiles/*.yaml.
"""

import os
import yaml

DEFAULT_PROFILE = "generic"

def get_profiles_dir():
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "profiles")

def load_profile(name=None):
    """
    Loads a profile YAML by name or path.
    name can be 'vill', 'supplements', 'generic', or a path to a custom yaml file.
    """
    if not name:
        name = DEFAULT_PROFILE

    profiles_dir = get_profiles_dir()
    resolved_path = None

    # Check direct path
    if os.path.exists(name):
        resolved_path = name
    else:
        # Check profiles/ folder with or without .yaml
        cand1 = os.path.join(profiles_dir, f"{name}.yaml")
        cand2 = os.path.join(profiles_dir, f"{name}.yml")
        cand3 = os.path.join(profiles_dir, name)
        if os.path.exists(cand1):
            resolved_path = cand1
        elif os.path.exists(cand2):
            resolved_path = cand2
        elif os.path.exists(cand3):
            resolved_path = cand3

    if not resolved_path or not os.path.exists(resolved_path):
        fallback = os.path.join(profiles_dir, f"{DEFAULT_PROFILE}.yaml")
        print(f"[Profile] Warning: Profile '{name}' not found. Falling back to default '{fallback}'.")
        resolved_path = fallback

    with open(resolved_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}

    # Defaults
    data.setdefault("brand_name", "Photo Bank")
    data.setdefault("brand_subtitle", "Visual Asset Library & Catalog")
    data.setdefault("brand_logo_text", "BANK")
    data.setdefault("score_weights", {
        "resolution": 0.15,
        "sharpness": 0.20,
        "exposure": 0.15,
        "clutter": 0.25,
        "dominance": 0.25,
    })
    data.setdefault("space_tags", ["other"])
    data.setdefault("space_prompts", ["a photo of general subject or environment"])
    data.setdefault("piece_prompts", {"item": ["a photo of an item"], "none": ["a photo with nothing"]})
    data.setdefault("material_prompts", {"standard": ["standard material"]})
    data.setdefault("stage_prompts", {"finished": ["completed final state"]})
    data.setdefault("angle_prompts", {"standard": ["standard angle"]})
    data.setdefault("piece_order", list(data["piece_prompts"].keys()))
    data["_profile_path"] = resolved_path
    data["_profile_name"] = os.path.splitext(os.path.basename(resolved_path))[0]
    return data
