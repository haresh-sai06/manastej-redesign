# Botanical brain animation

The About section uses the supplied recorded head, with corrected motion and a
transparent exterior. Its existing layout and GSAP section movement are preserved.

`src/components/BrainAnimation.tsx` serves the 480 × 480 animated WebP at 48 fps.
This retains soft alpha edges; the transparent GIF is a 24 fps fallback. A matching
lossless WebP still is selected by `prefers-reduced-motion`. All three images load
through a native `picture` element so Next image optimization does not flatten
their animation. The image is decorative inside the existing accessible section.

The source has hard edits at frames 120 and 144 (5 and 6 seconds). The corrected
10-second loop uses recorded frames 0–119, excludes duplicate frame 89, and
interpolates adjacent views using bidirectional optical flow. Measured visual
progress is retimed with cosine easing; the same views play in reverse on the
return, giving smooth turnarounds and a continuous seam. It does not invent a
rear view or generate new 3D geometry.

Backdrop removal estimates the background from the empty side bands, fills the
closed head silhouette to retain the pale glass face, and smooths the matte's
distance field over time. The neck fades into alpha at the bottom of the crop.
The recorded glass and leaf pixels inside the silhouette remain in the asset.

To regenerate with Python, NumPy, OpenCV, Pillow, and FFmpeg (or imageio-ffmpeg):

```powershell
python scripts/rebuild-brain-motion.py "PATH_TO_SUPPLIED_VIDEO.mp4"
python scripts/prepare-brain-video.py --original "PATH_TO_SUPPLIED_VIDEO.mp4"
```

The scripts are specific to the inspected 854 × 480, 24 fps reference. They keep
its native detail; no upscaling is used. They write the website assets under
`public/media/`, diagnostics and review videos under `output/brain-video/`, and
`output/manastej-brain-video-assets.zip`. The ZIP contains the transparent GIF,
animated WebP, alpha WebM video, reduced-motion still, MP4 review copies, source
reference, manifests, a standalone HTML embed, and both generation scripts.

MP4 cannot store the alpha channel. The cropped MP4 preview uses the website's
cream background; the WebM, WebP and GIF exports have a transparent exterior.
WebP/WebM retain soft alpha, while GIF only supports binary transparency.
