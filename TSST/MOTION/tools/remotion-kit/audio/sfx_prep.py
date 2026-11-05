"""Prepare SFX files so each transient lands exactly on its animation frame and volumes compare.

  python audio/sfx_prep.py <in_dir with .mp3/.wav> <out_dir>   (out_dir = public/audio/sfx)

Per file: onset = first 5 ms window within 30 dB of the file's peak; writes <out_dir>/<name>.wav with the
onset trimmed, sample peak at -6 dBFS and a 5 ms fade-in, and the measurements to <out_dir>/sfx.json.
Uses Remotion's bundled ffmpeg (`npx remotion ffmpeg`).
"""
import array, json, math, os, shutil, subprocess, sys, tempfile, wave
from pathlib import Path

KIT = Path(os.environ.get("REMOTION_DIR") or Path(__file__).resolve().parents[1])
NPX = shutil.which("npx") or "npx"


def main():
    src_dir, out_dir = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    report = {}
    files = sorted(p for p in src_dir.iterdir() if p.suffix.lower() in (".mp3", ".wav") and p.parent != out_dir)
    with tempfile.TemporaryDirectory() as tmp:
        for f in files:
            wav = os.path.join(tmp, f.stem + ".wav")
            subprocess.run([NPX, "remotion", "ffmpeg", "-hide_banner", "-v", "error", "-y", "-i", str(f), "-ac", "1", "-ar", "48000",
                            "-c:a", "pcm_s16le", wav], cwd=KIT, check=True)
            w = wave.open(wav)
            sr = w.getframerate()
            pcm = array.array("h", w.readframes(w.getnframes()))
            w.close()
            win = int(0.005 * sr)
            levels = [math.sqrt(sum(x * x for x in pcm[i:i + win]) / win) / 32768 for i in range(0, len(pcm) - win, win)]
            peak = max(levels) if levels else 0
            if not peak:
                print(f.name, "is silent, skipped")
                continue
            onset = next(i for i, r in enumerate(levels) if r >= peak * 10 ** (-30 / 20)) * win / sr
            seg = pcm[int(onset * sr):]
            g = (10 ** (-6 / 20)) * 32767 / (max(abs(v) for v in seg) or 1)
            fade = int(0.005 * sr)
            norm = array.array("h", (int(max(-32767, min(32767, v * g * min(1, k / fade)))) for k, v in enumerate(seg)))
            nw = wave.open(str(out_dir / (f.stem + ".wav")), "wb")
            nw.setnchannels(1); nw.setsampwidth(2); nw.setframerate(sr); nw.writeframes(norm.tobytes()); nw.close()
            report[f.stem] = {"onset": round(onset, 3), "peak_db": round(20 * math.log10(peak), 1), "duration": round(len(pcm) / sr, 3),
                              "gain_db": round(20 * math.log10(g), 1)}
            print(f.stem, report[f.stem])
    json.dump(report, open(out_dir / "sfx.json", "w"), indent=1)


if __name__ == "__main__":
    main()
