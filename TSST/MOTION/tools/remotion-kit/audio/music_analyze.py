"""Tempo, first-beat offset and energy map of a music take, to fit it to the video's beat grid.

  python audio/music_analyze.py take.mp3 [take2.mp3 ...]

- tempo: autocorrelation of an energy-flux onset envelope (10 ms hops), searched 90–150 BPM, then refined
  with a beat-comb score (0.02 BPM steps)
- first beat: the offset of the grid that lines up best with the onsets → trim that much (MUSIC.trimFrames)
- energy per 2 s bar (dBFS): find intro / groove / breakdown / ending and pick the take whose structure fits
  the edit map (EX-MO-001: breakdown under the quiet scenes, natural ending on the last frame)
Standard library only; decodes with Remotion's bundled ffmpeg (`npx remotion ffmpeg`).
"""
import array, math, os, shutil, subprocess, sys, tempfile, wave
from pathlib import Path

KIT = Path(os.environ.get("REMOTION_DIR") or Path(__file__).resolve().parents[1])
NPX = shutil.which("npx") or "npx"
SR, HOP = 11025, 110  # ~100 envelope frames per second


def analyse(path):
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "m.wav")
        subprocess.run([NPX, "remotion", "ffmpeg", "-hide_banner", "-v", "error", "-y", "-i", str(Path(path).resolve()), "-ac", "1",
                        "-ar", str(SR), "-c:a", "pcm_s16le", wav], cwd=KIT, check=True)
        w = wave.open(wav)
        x = array.array("h", w.readframes(w.getnframes()))
        w.close()
    fps = SR / HOP
    env = [math.log1p(math.sqrt(sum(v * v for v in x[i:i + HOP]) / HOP)) for i in range(0, len(x) - HOP, HOP)]
    flux = [0.0] + [max(0.0, env[i] - env[i - 1]) for i in range(1, len(env))]
    mean = sum(flux) / len(flux)
    sd = math.sqrt(sum((v - mean) ** 2 for v in flux) / len(flux)) or 1
    flux = [(v - mean) / sd for v in flux]
    n = len(flux)

    def ac(lag):
        return sum(flux[i] * flux[i + lag] for i in range(n - lag)) / (n - lag)

    lags = range(int(60 * fps / 150), int(60 * fps / 90) + 1)
    best_lag = max(lags, key=ac)
    coarse = 60 * fps / best_lag

    def at(t):
        k = t * fps
        i = int(k)
        return flux[i] + (flux[i + 1] - flux[i]) * (k - i) if i + 1 < n else 0.0

    def score(bpm, phase):
        period, s, c, t = 60 / bpm, 0.0, 0, phase
        while t < n / fps - 0.05:
            s += at(t); c += 1; t += period
        return s / max(c, 1)

    cands = [coarse - 3 + 0.02 * k for k in range(301)]
    _, bpm, phase = max(((score(b, p / 100), b, p / 100) for b in cands for p in range(int(6000 / b) + 1)), key=lambda r: r[0])
    bars = [20 * math.log10(max(math.sqrt(sum(v * v for v in x[i:i + 2 * SR]) / (2 * SR)) / 32768, 1e-6)) for i in range(0, len(x) - SR // 2, 2 * SR)]
    print(f"{Path(path).name}: {len(x) / SR:.1f}s  tempo {bpm:.2f} BPM  first beat at {phase:.2f}s")
    print("  energy per 2s bar (dBFS):", [round(b, 1) for b in bars])


if __name__ == "__main__":
    for p in sys.argv[1:]:
        analyse(p)
