"""Repair the supplied 24fps brain clip into a smooth, symmetric 48fps loop.

Usage: python scripts/rebuild-brain-motion.py "path/to/reference.mp4"
Requires numpy, opencv-python, Pillow and FFmpeg (or imageio-ffmpeg).
"""

import argparse
import json
import math
import shutil
import subprocess
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "brain-video"
FPS = 48
SECONDS = 10
HALF = FPS * SECONDS // 2
# The clean first traverse ends before the source edit at frame 120. Frame 89
# duplicates 88, then catches up at 90; optical flow bridges 88 to 90 directly.
SOURCE_IDS = [i for i in range(120) if i != 89]
# Leave the full exported frame intact; use flow only where the head appears.
ROI = (195, 0, 480, 480)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    args = parser.parse_args()
    source = args.source.resolve(strict=True)
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        import imageio_ffmpeg

        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    cap = cv2.VideoCapture(str(source))
    width, height, fps = int(cap.get(3)), int(cap.get(4)), cap.get(5)
    if (width, height, round(fps)) != (854, 480, 24):
        raise ValueError("This reconstruction's inspected cut points require the supplied 854x480/24fps reference.")
    frames = []
    for i in range(120):
        ok, frame = cap.read()
        if not ok:
            raise ValueError("The source ended before its clean first traverse was decoded.")
        if i in SOURCE_IDS:
            frames.append(frame)
    cap.release()
    x, y, w, h = ROI
    crops = [f[y:y + h, x:x + w] for f in frames]
    grays = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) for f in crops]
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    dis.setFinestScale(0)
    dis.setVariationalRefinementIterations(8)
    forward, backward, distances = [], [], []
    print("Measuring the clean rotation and estimating bidirectional optical flow...", flush=True)
    for i in range(len(frames) - 1):
        a = dis.calc(grays[i], grays[i + 1], None)
        b = dis.calc(grays[i + 1], grays[i], None)
        # Leaf texture gives a reliable motion measure without the nearly blank
        # background or reflections changing the recovered view progression.
        color = crops[i].astype(np.float32)
        mask = (color[:, :, 1] > color[:, :, 2] * 1.035) & (color[:, :, 1] > color[:, :, 0] * 1.025)
        mask[350:, :] = False
        magnitude = np.linalg.norm(a, axis=2)
        distance = float(np.median(magnitude[mask])) if mask.sum() > 500 else float(np.percentile(magnitude, 80))
        distances.append(max(distance, 0.015))
        forward.append(a.astype(np.float16))
        backward.append(b.astype(np.float16))
    # Remove measurement jitter while preserving the underlying view trajectory.
    pace = np.convolve(np.pad(distances, (2, 2), mode="edge"), np.array([1, 2, 3, 2, 1]) / 9, mode="valid")
    progress = np.r_[0, np.cumsum(pace)]
    progress /= progress[-1]
    grid_x, grid_y = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    cached_pair = -1
    flow_a = flow_b = error_a = error_b = None

    def remap(image, map_x, map_y):
        return cv2.remap(image, map_x, map_y, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

    def frame_at(position):
        nonlocal cached_pair, flow_a, flow_b, error_a, error_b
        if position <= 0:
            return frames[0].copy()
        if position >= len(frames) - 1:
            return frames[-1].copy()
        index = int(position)
        alpha = position - index
        if index != cached_pair:
            flow_a = forward[index].astype(np.float32)
            flow_b = backward[index].astype(np.float32)
            # Forward/backward consistency avoids averaging disoccluded nose,
            # glass and leaf edges with an unrelated pixel from the other frame.
            error_a = np.linalg.norm(flow_a + remap(flow_b, grid_x + flow_a[:, :, 0], grid_y + flow_a[:, :, 1]), axis=2)
            error_b = np.linalg.norm(flow_b + remap(flow_a, grid_x + flow_b[:, :, 0], grid_y + flow_b[:, :, 1]), axis=2)
            cached_pair = index
        ax, ay = grid_x - alpha * flow_a[:, :, 0], grid_y - alpha * flow_a[:, :, 1]
        bx, by = grid_x - (1 - alpha) * flow_b[:, :, 0], grid_y - (1 - alpha) * flow_b[:, :, 1]
        warped_a, warped_b = remap(crops[index], ax, ay), remap(crops[index + 1], bx, by)
        weight_a = (1 - alpha) / (1 + remap(error_a, ax, ay) ** 2)
        weight_b = alpha / (1 + remap(error_b, bx, by) ** 2)
        total = np.maximum(weight_a + weight_b, 1e-6)
        crop = (warped_a.astype(np.float32) * weight_a[:, :, None] + warped_b.astype(np.float32) * weight_b[:, :, None]) / total[:, :, None]
        output = cv2.addWeighted(frames[index], 1 - alpha, frames[index + 1], alpha, 0)
        output[y:y + h, x:x + w] = np.clip(crop, 0, 255).astype(np.uint8)
        return output

    # A raised cosine yields zero angular velocity at each turnaround. Invert
    # measured visual progress instead of retaining the clip's irregular speed.
    targets = (1 - np.cos(np.linspace(0, math.pi, HALF + 1))) / 2
    source_positions = np.interp(targets, progress, np.arange(len(frames)))
    print("Reconstructing the eased forward turn at 48fps...", flush=True)
    rendered = [frame_at(float(position)) for position in source_positions]
    # Each endpoint appears once; no duplicate last frame or freeze at the seam.
    sequence = rendered + rendered[-2:0:-1]
    destination = OUTPUT / "botanical-brain-smooth-loop.mp4"
    command = [
        ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo",
        "-pix_fmt", "bgr24", "-s:v", f"{width}x{height}", "-r", str(FPS), "-i", "-",
        "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", str(destination),
    ]
    print("Encoding the seamless left/right loop...", flush=True)
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for frame in sequence:
            process.stdin.write(frame.tobytes())
    finally:
        process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError("FFmpeg did not encode the corrected video.")
    # Diagnostic contact sheet uses rendered frames, not thumbnails of the old clip.
    sheet = Image.new("RGB", (3 * 427, 4 * 264), "#f4faf8")
    draw = ImageDraw.Draw(sheet)
    for k, index in enumerate(np.linspace(0, len(sequence) - 1, 12).round().astype(int)):
        rgb = cv2.cvtColor(sequence[index], cv2.COLOR_BGR2RGB)
        image = Image.fromarray(rgb).resize((427, 240), Image.Resampling.LANCZOS)
        px, py = (k % 3) * 427, (k // 3) * 264
        sheet.paste(image, (px, py))
        draw.text((px + 8, py + 244), f"{index / FPS:.2f}s", fill="#0f2f2b")
    sheet.save(OUTPUT / "smooth-loop-contact-sheet.jpg", quality=94)
    seam = float(np.abs(sequence[-1].astype(np.float32) - sequence[0].astype(np.float32)).mean())
    check = cv2.VideoCapture(str(destination))
    manifest = {
        "source": source.name,
        "source_frames_used": [0, 119],
        "source_duplicate_removed": 89,
        "source_hard_cuts_excluded": [120, 144],
        "width": int(check.get(3)), "height": int(check.get(4)),
        "fps": check.get(5), "frames": int(check.get(7)),
        "duration_seconds": len(sequence) / FPS,
        "loop_seam_mean_absolute_difference_0_to_255": seam,
        "method": "Recorded left-to-right views, optical-flow motion retiming, cosine turnarounds and mirrored return. No fabricated rear view or 3D geometry.",
        "bytes": destination.stat().st_size,
    }
    check.release()
    assert manifest["frames"] == FPS * SECONDS
    assert seam < 1, "Unexpected discontinuity at the loop seam"
    (OUTPUT / "motion-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"video": str(destination), **manifest}, indent=2))


if __name__ == "__main__":
    main()
