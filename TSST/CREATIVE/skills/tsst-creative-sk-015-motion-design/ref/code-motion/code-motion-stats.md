# Code-drawn motion: index of public examples (auto-built, no video watched)

Built by script from the text files of two public lists (downloaded 2026-10-08, text only, no media):
- yihui-dev/awesome-opus5-5-videos (MIT for the repo; every prompt and video belongs to its creator)
- athemeroy/awesome-claude-5-5-videos (annotations CC BY 4.0; linked works belong to their creators)
Rule: we link and learn patterns; we never copy a creator's prompt into TSST skills.
Full row list: `code-motion-index.csv` (1914 rows; 437 flagged ad-like).

## yihui list: 513 prompts
Prompt length (words): min 1, median 31, max 4093.

| category | count |
|---|---|
| motion | 317 |
| interactive | 70 |
| explainer | 67 |
| 3d | 59 |

| tech tag | count |
|---|---|
| canvas | 351 |
| svg | 219 |
| threejs | 147 |
| shader | 104 |
| gsap | 100 |
| css | 68 |
| audio | 36 |
| particles | 26 |
| playable | 22 |
| pixel | 16 |
| ai-image | 10 |
| webgl | 9 |
| physics | 9 |

## athemeroy atlas: 1401 reviewed cases
| domain | count |
|---|---|
| ai_self_meta | 297 |
| product_ad | 279 |
| game_interactive | 264 |
| education_science | 167 |
| story_short | 122 |
| music_video | 86 |
| humor_meme | 55 |
| history_culture | 53 |
| art_abstract | 43 |
| data_viz | 18 |
| other | 17 |

| visual style | count |
|---|---|
| motion_graphics_ui | 823 |
| 3d_render | 502 |
| flat_vector_cartoon | 300 |
| pixel_art | 106 |
| hand_drawn_sketch | 100 |
| photoreal | 97 |
| generative_abstract | 78 |
| live_action | 73 |
| paper_cutout_collage | 66 |
| math_diagram | 65 |
| painterly_ink_sand | 64 |
| anime | 59 |
| retro_terminal_ascii | 26 |
| data_viz | 1 |

| production path | count |
|---|---|
| procedural_2d | 52 |
| existing_source_transformation | 32 |
| educational_explainer | 27 |
| 3d_or_realtime_graphics | 19 |
| app_or_game_capture | 14 |
| mixed_or_not_established | 14 |
| external_video_model | 10 |

## Where to look first (for TSST ads / brands)
Filter `code-motion-index.csv` by `ad_like = yes`, or athemeroy `category = product_ad`. Open only the rows you need (post_url / prompt_page); do not batch-watch videos.

## Refresh (free, no tokens)
1. Text-only sparse clone of both repos into an empty temp folder (folders `data/`, `prompts/`, `docs/`; never `assets/`).
2. `python -I build_motion_index.py <download_dir> <this_folder>`
