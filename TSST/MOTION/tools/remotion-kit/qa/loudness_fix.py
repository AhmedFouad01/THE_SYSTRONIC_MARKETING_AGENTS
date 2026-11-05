"""Two-pass loudness normalisation of a rendered video; the picture is copied, never re-encoded.

  python qa/loudness_fix.py in.mp4 out.mp4 [--lufs -14] [--tp -1.5]

Pass 1 measures, pass 2 applies loudnorm in linear mode with the measured values (no pumping), then the
result is measured again. The output is cut to the picture's exact length (-t): loudnorm resamples and the AAC
encoder pads, which otherwise leaves the audio ~0.1 s longer than the video (MOTION-TRAIN-001). TP -1.5 leaves room for the AAC encode to stay ≤ -1 dBTP (EX-MO-001 landed at
-1.34). Audio: AAC 320k 48 kHz; +faststart. Uses Remotion's bundled ffmpeg (`npx remotion ffmpeg`).
"""
import argparse, json, os, shutil, subprocess, sys
from pathlib import Path

KIT = Path(os.environ.get("REMOTION_DIR") or Path(__file__).resolve().parents[1])
NPX = shutil.which("npx") or "npx"


def measure(src, lufs, tp):
    p = subprocess.run([NPX, "remotion", "ffmpeg", "-hide_banner", "-nostats", "-i", src, "-vn", "-af",
                        f"loudnorm=I={lufs}:TP={tp}:LRA=11:print_format=json", "-f", "null", "-"], cwd=KIT, capture_output=True)
    t = p.stderr.decode("utf-8", "replace")
    return json.loads(t[t.rindex("{"):t.rindex("}") + 1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--lufs", type=float, default=-14.0)
    ap.add_argument("--tp", type=float, default=-1.5)
    a = ap.parse_args()
    src, out = str(Path(a.src).resolve()), str(Path(a.out).resolve())
    if src == out:
        sys.exit("write to a new file; the source is the measurement reference")
    d = measure(src, a.lufs, a.tp)
    probe = subprocess.run([NPX, "remotion", "ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=duration",
                            "-of", "csv=p=0", src], cwd=KIT, capture_output=True, text=True)
    vdur = probe.stdout.strip().splitlines()[0]
    m = (f"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:"
         f"measured_thresh={d['input_thresh']}:offset={d['target_offset']}")
    subprocess.run([NPX, "remotion", "ffmpeg", "-hide_banner", "-v", "error", "-y", "-i", src, "-c:v", "copy",
                    "-af", f"loudnorm=I={a.lufs}:TP={a.tp}:LRA=11:{m}:linear=true", "-ar", "48000", "-c:a", "aac", "-b:a", "320k",
                    "-t", vdur, "-movflags", "+faststart", out], cwd=KIT, check=True)
    r = measure(out, a.lufs, a.tp)
    print(f"before {d['input_i']} LUFS / {d['input_tp']} dBTP  ->  after {r['input_i']} LUFS / {r['input_tp']} dBTP  ({out})")


if __name__ == "__main__":
    main()
