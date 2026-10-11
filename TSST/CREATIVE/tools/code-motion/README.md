# code-motion capture tool

Method: `TSST/MOTION/skills/tsst-motion-sk-001-motion-design/ref/code-motion.md`.

Installed 2026-10-08 OUTSIDE Google Drive (node_modules must not sync):

    C:\Users\10\tsst-tools\code-motion      (npm i -D playwright; npx playwright install chromium)

`capture.mjs` here is the canonical copy. Before a run, copy it into the local folder (Node resolves `playwright` from the script's folder):

    Copy-Item capture.mjs C:\Users\10\tsst-tools\code-motion\ -Force
    cd C:\Users\10\tsst-tools\code-motion
    node capture.mjs --html "<path>\sample.html" --out .\frames --fps 30 --duration 4 --width 1080 --height 1920 --mp4 .\sample.mp4 --ffmpeg "C:\Users\10\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe"

First run 2026-10-08: sample.html → 1080x1920, 30 fps, 4.0 s MP4; Cairo loaded, Arabic joined correctly, fade in/out as timed.

Omit `--ffmpeg` to only print the encode command. `--blur 4` captures 4 subframes per frame and blends them with ffmpeg tmix.
The page must define `window.seek(t)` (seconds). Frames and mp4 are scratch output; do not commit them.
sample.html loads GSAP from jsDelivr (needs internet); for offline use, download gsap.min.js next to it and change the script src.
