"""Mix QA from audio stems (TSST-MOTION-SK-003). Render the stems first, from the job root:

  for st in vo music all: npx remotion render src/index.ts Master-9x16-A <dir>/<st>.wav --codec=wav \
      --props='{"variant":"A","safe":false,"stem":"<st>"}'
  python qa/mix_check.py <dir>

- Speech regions are found in the VO stem itself (20 ms windows above -40 dBFS, gaps < 0.35 s merged,
  regions < 0.3 s dropped), so no schedule file is needed.
- VO over music: RMS of the VO stem vs the music stem inside every region. Target ≥ 8 dB.
- Clipping: samples at full scale in the full mix. Clicks: a jump > 0.25 between neighbouring samples where
  the 10 ms before it is quiet (< 0.05 RMS). Exit 0 only if all pass.
"""
import array, math, sys, wave
from pathlib import Path


def mono(path):
    w = wave.open(str(path))
    if w.getsampwidth() != 2:
        sys.exit(f"{path}: 16-bit PCM WAV expected")
    ch, sr = w.getnchannels(), w.getframerate()
    x = array.array("h", w.readframes(w.getnframes()))
    w.close()
    if ch == 2:
        x = [(x[i] + x[i + 1]) / 65536 for i in range(0, len(x) - 1, 2)]
    else:
        x = [v / 32768 for v in x]
    return sr, x


def rms(x, a, b):
    seg = x[a:b]
    return math.sqrt(sum(v * v for v in seg) / len(seg)) if seg else 0.0


def db(v):
    return 20 * math.log10(max(v, 1e-9))


def main():
    d = Path(sys.argv[1])
    sr, vo = mono(d / "vo.wav")
    _, mu = mono(d / "music.wav")
    _, mix = mono(d / "all.wav")
    win = int(0.02 * sr)
    loud = [db(rms(vo, i, i + win)) > -40 for i in range(0, len(vo) - win, win)]
    regions, start, gap = [], None, int(0.35 / 0.02)
    last = -10 ** 9
    for k, on in enumerate(loud):
        if on:
            if start is None or k - last > gap:
                if start is not None:
                    regions.append((start, last + 1))
                start = k
            last = k
    if start is not None:
        regions.append((start, last + 1))
    regions = [(a * win, b * win) for a, b in regions if (b - a) * 0.02 >= 0.3]
    fails = 0
    print("region          VO dB  music dB  VO-music")
    for a, b in regions:
        dv, dm = db(rms(vo, a, b)), db(rms(mu, a, b))
        ok = dv - dm >= 8
        fails += not ok
        print(f"{a / sr:6.2f}-{b / sr:6.2f}s  {dv:6.1f}  {dm:8.1f}   {dv - dm:+6.1f} dB {'OK' if ok else 'LOW'}")
    clip = sum(1 for v in mix if abs(v) >= 0.999)
    print("speech regions:", len(regions))
    print("full-scale samples in the mix:", clip)
    clicks = []
    for i in range(481, len(mix)):
        if abs(mix[i] - mix[i - 1]) > 0.25 and rms(mix, i - 480, i - 5) < 0.05:
            clicks.append(i)
    print("click candidates:", len(clicks), [round(i / sr, 3) for i in clicks[:10]])
    ok = regions and fails == 0 and clip == 0 and not clicks
    print("MIX OK" if ok else "MIX NEEDS WORK")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
