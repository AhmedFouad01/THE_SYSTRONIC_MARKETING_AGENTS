"""Cut one full TTS take into one WAV per VO line, plus lines.json for src/job/vo.json.

  python audio/cut_vo.py <take.mp3> <spans.json> <out_dir> [--prefix line]

spans.json: {"voice": "<name, model, take>", "end": <last sample to keep, s>,
             "spans": [[first_word_start, last_word_end], ...]  (from the TTS tool's word timings),
             "text": ["line 1", ...]  (optional)}
Word timings are approximate, so each cut snaps to the quietest 20 ms between two lines (±60 ms around
the gap), with 10 ms fades so nothing clicks. Record every line of the master AND the cutdowns in one
session with one voice, then cut here (EX-MO-001). Uses Remotion's bundled ffmpeg (`npx remotion ffmpeg`).
"""
import argparse, array, json, os, shutil, subprocess, tempfile, wave
from pathlib import Path

KIT = Path(os.environ.get("REMOTION_DIR") or Path(__file__).resolve().parents[1])
NPX = shutil.which("npx") or "npx"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("take")
    ap.add_argument("spans")
    ap.add_argument("out")
    ap.add_argument("--prefix", default="line")
    a = ap.parse_args()
    cfg = json.load(open(a.spans, encoding="utf-8"))
    spans, end = cfg["spans"], cfg["end"]
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        full = os.path.join(tmp, "take.wav")
        subprocess.run([NPX, "remotion", "ffmpeg", "-hide_banner", "-v", "error", "-y", "-i", str(Path(a.take).resolve()),
                        "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", full], cwd=KIT, check=True)
        src = wave.open(full)
        sr = src.getframerate()
        pcm = array.array("h", src.readframes(src.getnframes()))
        src.close()
    fade = int(0.01 * sr)

    def quietest(lo, hi):
        win, step = int(0.02 * sr), int(0.002 * sr)
        best = (float("inf"), (lo + hi) / 2)
        for k in range(int(lo * sr), max(int(lo * sr) + 1, int(hi * sr) - win), step):
            e = sum(x * x for x in pcm[k:k + win])
            if e < best[0]:
                best = (e, (k + win / 2) / sr)
        return best[1]

    bounds = [0.0] + [quietest(spans[i][1] - 0.06, spans[i + 1][0] + 0.06) for i in range(len(spans) - 1)] + [end]
    lines = []
    for i in range(len(spans)):
        a0, b0 = round(bounds[i], 3), round(bounds[i + 1], 3)
        seg = pcm[int(a0 * sr):int(b0 * sr)]
        for k in range(min(fade, len(seg) // 2)):
            seg[k] = int(seg[k] * k / fade)
            seg[-1 - k] = int(seg[-1 - k] * k / fade)
        name = f"{a.prefix}-{i + 1:02d}.wav"
        w = wave.open(str(out / name), "wb")
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(seg.tobytes()); w.close()
        row = {"index": i + 1, "file": name, "duration": round(len(seg) / sr, 3), "speech": round(spans[i][1] - spans[i][0], 2),
               "cut": [a0, b0], "lead_in": round(max(0.0, spans[i][0] - a0), 3)}
        if cfg.get("text"):
            row["text"] = cfg["text"][i]
        lines.append(row)
        print(row)
    json.dump({"voice": cfg.get("voice"), "source": os.path.basename(a.take), "lines": lines},
              open(out / "lines.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
