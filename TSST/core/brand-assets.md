# Brand material — folder contract (all brands)

Every brand keeps its material in `TSST/brands/<brand>/assets/`. The folder name **is the status**:
an agent may treat a file as brand truth only if it sits in `final/`.

| folder | what goes in | agents may |
|---|---|---|
| `final/` | approved identity: logo masters (vector + PNG), approved palette/fonts files, guidelines the user signed off | use as **authority**; never alter colours or marks |
| `source/` | raw material with rights: original photos/videos (high-res), plans, product shots, testimonials with permission | use in production; cite file in the asset record |
| `reference/` | inspiration, competitors, moodboards from others | learn from; **never** copy, never treat as VILL/brand style |
| `proposals/` | earlier explorations, old decks, drafts, AI images, anything not approved | read for history only; **never** as authority |
| `archive/` | superseded material | ignore unless the user asks |

Rules
1. Unsure where a file belongs → it is `proposals/` until the user moves it.
2. `assets/ASSETS.yaml` lists what is in `final/` (file, what it is, approved by, date). Empty list = no approved identity yet → ask, do not infer.
3. Rights unknown → the file stays in `source/` with `rights: unknown` in its asset record and cannot ship.
4. Binaries are not committed to git (Drive keeps them); `ASSETS.yaml` and READMEs are.
5. Brand isolation: never copy material between brand folders.
