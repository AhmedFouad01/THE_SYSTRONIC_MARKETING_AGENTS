"""Final-file QA for one rendered video (TSST-MOTION-SK-002 / 003 / 007): spec, faststart, loudness,
flash-like transitions, end-card hold and first frame. Exit 0 only if every check passes.

Run from the job root (the copy of this kit that has node_modules):
  python qa/check_video.py final/<file>.mp4 --frames 1200 [--size 1080x1920] [--fps 30] [--hold 2] [--lufs -14] [--tp -1]

Thresholds (EX-MO-001, owner-approved job): integrated loudness within ±1 LU of --lufs, true peak ≤ --tp dBTP,
no more than 2 flash-like transitions (mean-luma jump ≥ 20% of full scale) in any 1 s window, the last --hold
seconds static, frame 0 not blank. Uses the ffmpeg/ffprobe that ship with Remotion (`npx remotion ffmpeg`):
a minimal build with no null video muxer and no rawvideo muxer, so video is decoded through image2pipe.
"""
import argparse, json, os, shutil, subprocess, sys
from pathlib import Path

KIT = Path(os.environ.get("REMOTION_DIR") or Path(__file__).resolve().parents[1])
NPX = shutil.which("npx") or "npx"


def tool(name, *args):
    return subprocess.run([NPX, "remotion", name, "-hide_banner", *args], cwd=KIT, capture_output=True, check=False)


def moov_first(path):
    """True when the moov atom comes before mdat (web-optimised / faststart)."""
    with open(path, "rb") as fh:
        while True:
            head = fh.read(8)
            if len(head) < 8:
                return False
            size, kind = int.from_bytes(head[:4], "big"), head[4:]
            if size == 1:
                size = int.from_bytes(fh.read(8), "big") - 8
            if kind == b"moov":
                return True
            if kind == b"mdat":
                return False
            fh.seek(size - 8, 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--frames", type=int, required=True)
    ap.add_argument("--size", default="1080x1920")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--hold", type=float, default=2.0)
    ap.add_argument("--lufs", type=float, default=-14.0)
    ap.add_argument("--tp", type=float, default=-1.0)
    a = ap.parse_args()
    src = str(Path(a.video).resolve())
    w, h = (int(x) for x in a.size.split("x"))
    rows = []

    def row(name, ok, value):
        rows.append((name, ok, value))

    # 1 · spec
    p = tool("ffprobe", "-v", "error", "-count_frames", "-show_entries",
             "stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate,nb_read_frames,sample_rate,channels:format=duration",
             "-of", "json", src)
    info = json.loads(p.stdout or b"{}")
    v = next((s for s in info.get("streams", []) if s.get("codec_type") == "video"), {})
    au = next((s for s in info.get("streams", []) if s.get("codec_type") == "audio"), {})
    dur = float(info.get("format", {}).get("duration", 0))
    frames = int(v.get("nb_read_frames", 0) or 0)
    row("video h264 yuv420p", v.get("codec_name") == "h264" and v.get("pix_fmt") == "yuv420p", f"{v.get('codec_name')} {v.get('pix_fmt')}")
    row("size / fps", (v.get("width"), v.get("height")) == (w, h) and v.get("r_frame_rate") == f"{a.fps}/1",
        f"{v.get('width')}x{v.get('height')} @ {v.get('r_frame_rate')}")
    row("frames / duration", frames == a.frames and abs(dur - a.frames / a.fps) < 0.002, f"{frames} frames, {dur:.3f}s (want {a.frames}, {a.frames / a.fps:.3f}s)")
    row("audio aac 48k stereo", au.get("codec_name") == "aac" and au.get("sample_rate") == "48000" and au.get("channels") == 2,
        f"{au.get('codec_name')} {au.get('sample_rate')} {au.get('channels')}ch")
    row("faststart (moov first)", moov_first(src), "")

    # 2 · loudness (audio only: the null muxer accepts audio)
    p = tool("ffmpeg", "-nostats", "-i", src, "-vn", "-af", f"loudnorm=I={a.lufs}:TP={a.tp}:print_format=json", "-f", "null", "-")
    t = p.stderr.decode("utf-8", "replace")
    try:
        d = json.loads(t[t.rindex("{"):t.rindex("}") + 1])
        lufs, tp = float(d["input_i"]), float(d["input_tp"])
        row("loudness", abs(lufs - a.lufs) <= 1.0, f"{lufs:.2f} LUFS (target {a.lufs:g} ±1)")
        row("true peak", tp <= a.tp, f"{tp:.2f} dBTP (max {a.tp:g})")
    except ValueError:
        row("loudness", False, "loudnorm gave no measurement")

    # 3 · flashes, end hold, first frame (54x96 grey frames)
    gw, gh = 54, 96
    p = tool("ffmpeg", "-v", "error", "-i", src, "-vf", f"scale={gw}:{gh},format=gray", "-f", "image2pipe", "-c:v", "rawvideo", "-")
    raw, px = p.stdout, gw * gh
    n = len(raw) // px
    means = [sum(raw[i * px:(i + 1) * px]) / px for i in range(n)]
    jumps = [i for i in range(1, n) if abs(means[i] - means[i - 1]) >= 0.20 * 255]
    worst = max((sum(1 for j in jumps if s <= j < s + a.fps), s) for s in range(max(1, n - a.fps + 1))) if n else (0, 0)
    row("flash-like transitions", worst[0] <= 2, f"{len(jumps)} total, worst 1s window {worst[0]} (max 2)"
        + "".join(f"\n      at {j / a.fps:.2f}s: {means[j - 1]:.0f} -> {means[j]:.0f}" for j in jumps))
    hold = int(a.hold * a.fps)
    tail = [sum(abs(raw[i * px + k] - raw[(i - 1) * px + k]) for k in range(px)) / px for i in range(max(1, n - hold + 1), n)]  # changes inside the hold only
    row(f"last {a.hold:g}s static", bool(tail) and max(tail) <= 0.5, f"max frame-to-frame change {max(tail) if tail else -1:.3f} (max 0.5 of 255)")
    f0 = raw[:px]
    m0 = sum(f0) / px if px and f0 else 0
    sd0 = (sum((x - m0) ** 2 for x in f0) / px) ** 0.5 if f0 else 0
    row("frame 0 not blank", sd0 > 4, f"mean {m0:.0f}, spread {sd0:.1f}")

    ok = all(r[1] for r in rows)
    for name, good, value in rows:
        print(f"{'PASS' if good else 'FAIL'}  {name:26} {value}")
    print("ALL CHECKS PASS" if ok else "CHECKS FAILED")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
