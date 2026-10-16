"""Remove the backdrop from the repaired brain loop and package transparent assets.
Run rebuild-brain-motion.py first, then this script with --original PATH_TO_VIDEO.
Requires numpy, OpenCV, Pillow and FFmpeg (or imageio-ffmpeg).
"""
import argparse
import hashlib
import json
import shutil
import subprocess
import tempfile
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public' / 'media'
OUTPUT = ROOT / 'output' / 'brain-video'
SIZE, FPS, CROP_X = 480, 48, 195


def matte_distance(image):
    # Fit the pale background from the empty bands on either side of the head.
    left = np.median(image[:, 50:180], axis=1)
    right = np.median(image[:, 700:820], axis=1)
    horizontal = np.linspace(0, 1, image.shape[1])[None, :, None]
    background = left[:, None, :] * (1 - horizontal) + right[:, None, :] * horizontal
    difference = np.linalg.norm(image.astype(np.float32) - background, axis=2)
    mask = (difference > 13).astype(np.uint8) * 255
    mask[:, :235], mask[:, 680:] = 0, 0
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    silhouette = np.zeros_like(mask)
    # Fill the closed silhouette instead of keying away pale pixels inside the
    # glass face. This preserves the nose, eyes, lips and surface highlights.
    cv2.drawContours(silhouette, [max(contours, key=cv2.contourArea)], -1, 255, -1)
    inside = (silhouette[:, CROP_X:CROP_X + SIZE] > 0).astype(np.uint8)
    return cv2.distanceTransform(inside, cv2.DIST_L2, 5) - cv2.distanceTransform(1 - inside, cv2.DIST_L2, 5)


def gif_info(path):
    with Image.open(path) as gif:
        duration, clear = 0, True
        for index in range(gif.n_frames):
            gif.seek(index)
            duration += gif.info.get('duration', 0)
            alpha = np.array(gif.convert('RGBA'))[:, :, 3]
            clear &= all(alpha[y, x] == 0 for x, y in ((0, 0), (479, 0), (0, 479), (479, 479)))
        return {'width': gif.width, 'height': gif.height, 'frames': gif.n_frames,
                'duration_ms': duration, 'loop': gif.info.get('loop'),
                'transparent_corners_every_frame': bool(clear), 'bytes': path.stat().st_size}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--original', type=Path)
    args = parser.parse_args()
    source = OUTPUT / 'botanical-brain-smooth-loop.mp4'
    if not source.is_file():
        raise FileNotFoundError('Run scripts/rebuild-brain-motion.py first.')
    ffmpeg = shutil.which('ffmpeg')
    if not ffmpeg:
        import imageio_ffmpeg
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    PUBLIC.mkdir(parents=True, exist_ok=True)
    cap = cv2.VideoCapture(str(source))
    frames, distances = [], []
    print('Separating the head from the white backdrop...', flush=True)
    # Reuse the exact forward frames and mattes on the return for a stable seam.
    for _ in range(241):
        ok, frame = cap.read()
        if not ok:
            raise ValueError('Corrected video ended unexpectedly.')
        frames.append(frame[:, CROP_X:CROP_X + SIZE].copy())
        distances.append(matte_distance(frame).astype(np.float16))
    cap.release()
    rgba_frames = []
    sheet = Image.new('RGB', (SIZE * 3, SIZE * 2), '#f4faf8')
    bottom = np.clip((SIZE - 1 - np.arange(SIZE, dtype=np.float32)) / 34, 0, 1)
    bottom = bottom * bottom * (3 - 2 * bottom)
    for i, frame in enumerate(frames):
        # Smooth the silhouette distance, not the image texture, to prevent edge
        # chatter without ghosting the moving face or the leaves.
        field = sum(distances[min(max(i + offset, 0), 240)].astype(np.float32) * weight
                    for offset, weight in ((-2, 1/9), (-1, 2/9), (0, 3/9), (1, 2/9), (2, 1/9)))
        field = cv2.GaussianBlur(field, (0, 0), 0.7)
        alpha = np.clip((field - 0.2) / 1.8 + 0.5, 0, 1) * bottom[:, None]
        rgba = cv2.cvtColor(frame, cv2.COLOR_BGR2BGRA)
        rgba[:, :, 3] = np.rint(alpha * 255).astype(np.uint8)
        rgba[rgba[:, :, 3] == 0, :3] = 0
        rgba_frames.append(rgba)
        if i in (0, 48, 96, 144, 192, 240):
            k = i // 48
            green = np.full_like(frame, (43, 75, 55))
            composite = np.rint(frame * alpha[:, :, None] + green * (1 - alpha[:, :, None])).astype(np.uint8)
            sheet.paste(Image.fromarray(cv2.cvtColor(composite, cv2.COLOR_BGR2RGB)), ((k % 3) * SIZE, (k // 3) * SIZE))
    sheet.save(OUTPUT / 'transparent-rotation-contact-sheet.jpg', quality=94)
    poster = PUBLIC / 'botanical-brain-poster.webp'
    Image.fromarray(cv2.cvtColor(rgba_frames[0], cv2.COLOR_BGRA2RGBA)).save(poster, lossless=True)
    sequence = rgba_frames + rgba_frames[-2:0:-1]
    webm = PUBLIC / 'botanical-brain-transparent.webm'
    animated = PUBLIC / 'botanical-brain.webp'
    gif = PUBLIC / 'botanical-brain.gif'
    preview = OUTPUT / 'botanical-brain-website-preview.mp4'
    with tempfile.TemporaryDirectory(prefix='manastej-cutout-') as temp:
        raw = Path(temp) / 'cutout.bgra'
        with raw.open('wb') as stream:
            for frame in sequence:
                stream.write(frame.tobytes())

        def encode(destination, *options):
            subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo',
                            '-pixel_format', 'bgra', '-video_size', f'{SIZE}x{SIZE}', '-framerate', str(FPS),
                            '-i', str(raw), *options, str(destination)], check=True)

        print('Encoding transparent video and animated WebP...', flush=True)
        encode(webm, '-an', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-auto-alt-ref', '0',
               '-b:v', '0', '-crf', '22', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '3')
        encode(animated, '-an', '-c:v', 'libwebp_anim', '-quality', '86', '-compression_level', '5', '-loop', '0')
        print('Encoding transparent GIF and MP4 preview...', flush=True)
        # GIF only supports binary alpha; WebP/WebM preserve the soft edge.
        encode(gif, '-filter_complex', 'fps=24,split[frames][palette];[palette]palettegen=max_colors=256:reserve_transparent=1:stats_mode=diff[colors];[frames][colors]paletteuse=dither=bayer:bayer_scale=4:alpha_threshold=128',
               '-an', '-loop', '0', '-gifflags', '+transdiff')
        # MP4 has no alpha. This review copy is on the site's cream background.
        encode(preview, '-filter_complex', 'color=c=0xf4faf8:s=480x480:r=48[bg];[bg][0:v]overlay=shortest=1:format=auto,format=yuv420p',
               '-an', '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-movflags', '+faststart')
    motion = json.loads((OUTPUT / 'motion-manifest.json').read_text(encoding='utf-8'))
    manifest = {'motion': motion, 'crop': {'x': CROP_X, 'y': 0, 'width': SIZE, 'height': SIZE},
                'background': 'Exterior white backdrop removed; glass silhouette retained, edges feathered, bottom of neck faded into alpha.',
                'website': 'Animated WebP retains soft alpha at 48fps; transparent GIF fallback; matching reduced-motion still.',
                'gif': gif_info(gif), 'files': {p.name: p.stat().st_size for p in (webm, animated, gif, poster, preview)}}
    assert manifest['gif']['transparent_corners_every_frame']
    assert manifest['gif']['duration_ms'] == 10000
    if args.original:
        manifest['original_sha256'] = hashlib.sha256(args.original.read_bytes()).hexdigest()
    (OUTPUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    (OUTPUT / 'README.txt').write_text('''MANASTEJ - CORRECTED BRAIN ROTATION / TRANSPARENT ASSETS

website/botanical-brain.webp: 480x480, 48fps animated WebP; preferred website asset with soft alpha.
website/botanical-brain.gif: 480x480, 24fps transparent GIF fallback, 10-second loop.
website/botanical-brain-transparent.webm: 480x480, 48fps VP9 video with an alpha channel.
website/botanical-brain-poster.webp: lossless transparent still for reduced motion.
botanical-brain-website-preview.mp4: cropped 48fps review video on website cream. MP4 has no alpha.
botanical-brain-smooth-loop.mp4: corrected 854x480 video before backdrop removal.
source/reference-brain.mp4: untouched supplied video, if included.
embed.html: standalone responsive preview; open alongside the website folder.

Motion repair uses the clean recorded frames 0-119, removes duplicate frame 89,
and excludes the broken edits at 5 and 6 seconds. Bidirectional optical flow
retimes the recorded views; cosine easing and a mirrored return form a smooth
left > right > left loop. No rear view or new 3D geometry is invented.

The exterior white background is removed. Glass inside the silhouette is retained
to preserve the eyes, nose and lips. WebP/WebM have soft alpha; GIF has only binary
transparency. GIF frame timing uses 10ms increments. Source detail is preserved
without AI upscaling. The square crop keeps the head in frame throughout its turn.

Regenerate: python scripts/rebuild-brain-motion.py PATH_TO_ORIGINAL
then python scripts/prepare-brain-video.py --original PATH_TO_ORIGINAL
Dependencies: numpy, opencv-python, Pillow, FFmpeg (or imageio-ffmpeg).
''', encoding='utf-8')
    (OUTPUT / 'embed.html').write_text('''<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Manastej - corrected botanical brain rotation</title>
<style>body{margin:0;min-height:100svh;display:grid;place-items:center;background:#f4faf8}picture{display:block;width:min(88vw,480px)}img{display:block;width:100%;height:auto}</style>
<picture>
  <source media="(prefers-reduced-motion: reduce)" srcset="website/botanical-brain-poster.webp">
  <source type="image/webp" srcset="website/botanical-brain.webp">
  <img src="website/botanical-brain.gif" width="480" height="480" alt="A glass human head with a green botanical brain turning smoothly left, right, and back">
</picture>
</html>
''', encoding='utf-8')
    archive = ROOT / 'output' / 'manastej-brain-video-assets.zip'
    with ZipFile(archive, 'w', compression=ZIP_DEFLATED) as bundle:
        for path in (webm, animated, gif, poster):
            bundle.write(path, f'website/{path.name}')
        for path in (preview, source):
            bundle.write(path, path.name)
        if args.original:
            bundle.write(args.original, 'source/reference-brain.mp4')
        for name in ('README.txt', 'embed.html', 'manifest.json', 'motion-manifest.json'):
            bundle.write(OUTPUT / name, name)
        for name in ('rebuild-brain-motion.py', 'prepare-brain-video.py'):
            bundle.write(ROOT / 'scripts' / name, f'scripts/{name}')
    with ZipFile(archive) as bundle:
        assert bundle.testzip() is None
    print(json.dumps({**manifest, 'zip': str(archive), 'zip_bytes': archive.stat().st_size}, indent=2))


if __name__ == '__main__':
    main()
