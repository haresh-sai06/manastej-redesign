# Manastej redesign: design notes

## Concept: "From night to radiance"
*Manastej* means **Manas (mind) + Tej (radiance)**. The page tells that story as one continuous scroll, starting in a deep night-teal and ending at dawn:

1. **Night**: the hero glows out of darkness. The brand's brain-and-leaves mark breathes inside radiance rings.
2. **Problem**: the darkest beat, "One crisis, three broken systems".
3. **First light**: a cream "Manas + Tej" scene where the two halves of the name fuse around the head visual from manastej.com.
4. **Day**: features, the HR suite, privacy, technology and audiences alternate between deep and light surfaces.
5. **Dawn**: the closing CTA. A warm sun rises behind layered hills.

**Palette** comes from manastej.com's CSS (`#2a8f85`, `#3db8ad`, `#56d4cf`, `#9dc4be`, `#4c6f69`, `#e8f6f4`, `#f0faf8`), deepened into `#051311` / `#0a211e` for night scenes. I added one accent, a warm **radiance gold `#f2c46d`**, because *Tej* means radiance. It's used sparingly.
**Type**: Manrope (kept from the current site) for UI and body, and Instrument Serif for editorial display.
**Leaf motif**: the leaves around the brain in the logo become floating parallax particles and list bullets.

## Content rules
Copy is adapted from the live manastej.com (captured Oct 2026), translated into English where needed, and lives in `src/lib/content.ts`. The site's own caveats are kept next to each feature ("Not a diagnosis", "requires validation", and so on), along with the "in active development" disclaimer. I invented no clients, testimonials, metrics or claims. See TODOs at the bottom.

## Sections → inspiration
| Section | What it does | Borrowed from / remixed |
|---|---|---|
| Hero (pinned 230vh) | 4 depth layers: aurora → radiance rings → glowing mark → leaves. Each moves at a different scroll speed, plus pointer parallax. A second beat scrub-reveals the brand quote word by word. | MotionSites **"Dreamcore Landing"** (sticky-viewport, two scroll-driven scenes) and **"Bloom"** (500vh fixed-viewport scene). Re-themed from a theatre/fantasy feel to a calm "mind glowing in the dark". |
| Marquee | Two rows (pillars and the 01–04 steps) loop in opposite directions, plus scroll-linked drift. | `bastrb/premium-landing-page-prompts` Block 3 "Marquee" |
| Problem (pinned) | Scrubbed headline reveal, then stats rise in, then the three failure cards fan out of a deck. A gold "crack" line draws under each. | premium-landing-page-prompts "Problem → Bento", plus Apple-style pinned storytelling |
| Manas + Tej (pinned) | The two words slide in from opposite sides and fuse around the rising head. A warm halo expands. Below, the definition reveals word by word, and the audience cards sit on three parallax speeds. | MotionSites **"Celestial Renewal"** (serene wellness, serif italics, soft glow). Its beauty-brand look was reworked into the brand's Sanskrit etymology. |
| Manas + Tej: WebGL head | A real 3D glass head with a pink brain inside (react-three-fiber + drei). On entering the stage it spins in from about 180° on Y with an X tilt while scaling from small to full (1.9 s, power2.out). After that its Y rotation and tilt follow scroll progress through the section and into Features, with a light idle float on top. | Remake of the head artwork from manastej.com |
| Core features (horizontal) | A pinned horizontal track with 6 panels. Inside each panel, the giant number and the illustration move at counter-speeds (`containerAnimation`). A background word drifts slower, and a progress rail runs along the bottom. | MotionSites **"Pulse 3D"** / **"Animated Cards"** (cylindrical card carousel). Simplified to a GPU-only horizontal parallax so it stays readable for health copy. |
| HR suite | Sticky left column. A dot-cluster illustration scrubs into place, then groups under 5 fade to "Suppressed", visualising the real 5+ privacy rule. Cards on the right use offset parallax. | Linear/Stripe-style sticky split layouts |
| Privacy | Sticky stacking cards. Each card recedes (scale + shade) as the next slides over it. Dashed "shield" rings rotate in the background. | Common Awwwards / Godly "stacked cards" pattern |
| Technology (pinned) | The 5 tech pillars orbit the "Science-led. Human-centered." core on an elliptical path driven by scroll. | MotionVault orbit/carousel examples, remixed into an orbit |
| Who it's for | Giant serif words slide in opposite directions (text parallax). Their descriptions scrub-fade in. | Editorial agency sites (big kinetic type rows) |
| Join + footer | A dawn scene: the sky brightens, the sun rises, and two hill layers at different speeds reveal the CTA. Magnetic "Contact the team" button. | MotionSites **"Wellness Hero"** (Aurai), reworked into a sunrise metaphor |

Prompt repos read: `xianxian-sensen/motionsites-prompts` (328 MotionSites prompts), `Melectrona/motionsites-prompts`, `bastrb/premium-landing-page-prompts` (design-system / sections / animation blocks), `xiyu519/MotionVault` (200 animation examples). Reference galleries: motionsites.ai, Awwwards, Godly, and Apple product pages (pinned scrub storytelling).

## Motion system
- **Lenis** smooth scroll (lerp 0.09), driven by the GSAP ticker and synced to **ScrollTrigger**.
- **One hook (`useScene`)** per section wraps `gsap.matchMedia`. Every scene declares desktop, mobile and reduced-motion variants, and everything reverts on unmount.
- **Primitives** (`src/lib/motion.ts`): `depthParallax` (`[data-speed]`), `wordReveal` (scrubbed word opacity) and `riseIn`.
- **Only `transform` and `opacity`** are animated. No layout properties and no filters on scroll. Pointer parallax uses `gsap.quickTo`.
- **Layout classes** (`pb-pinned`, `hz-on`, `tc-on`) are added only while motion is active. Without them, every section falls back to a normal stacked layout.
- **`prefers-reduced-motion: reduce`**: Lenis is off, there are no pins and no scrubs, the hero becomes a static two-part block, features become a grid, the tech orbit becomes a list, and CSS loops are disabled. A Playwright check confirms no text is left below 50% opacity in this mode.
- **Accessibility**: skip link, semantic landmarks, one screen-reader copy of split text, `aria-hidden` on decorative layers, visible focus rings, and an accessible mobile menu.

## 3D head (Manas + Tej)
- **Model**: “Human Head Basemesh” (male) by **pistachio**, [OpenGameArt](https://opengameart.org/content/2-human-head-basemeshes), **CC0 1.0** (no attribution required, credited anyway in the footer). `scripts/build-head.mjs` applies 3x Loop subdivision and Taubin smoothing (volume-preserving, removes lumps that showed up as "cracks" in glass highlights). It then does an **exact plane clip** under the chin: triangles crossing the plane are split, with intersection vertices shared per edge, so the cut is watertight and perfectly straight. The cut is **capped** (fan from the loop centroid, own vertices, so it stays flat). Normals aren't stored; they're recomputed smooth at runtime. The mesh is quantized and compressed with **meshopt**: `public/models/head.glb` is about 145 KB (about 90 KB gzipped), about 44k triangles.
- **Botanical brain**: the supplied 10-second, 854×480 reference shows a leafy green brain inside a clear head with vines through the neck. The existing CC0 “Human Brain” by **Grab3D**, [grab3d.com](https://grab3d.com/models/anatomy/human-brain/), remains the anatomical foundation. `HeadScene.tsx` remaps its baked cavity colours to moss, olive and sage. `BotanicalDetails.tsx` adds deterministically planted, curved leaves with raised midribs and branching veins, seven tapered vines, and small paired neck leaves. Shared instanced geometry uses three additional draw calls and a lower instance count on mobile. The underlying compressed brain remains about 315 KB. This is a reference-based reconstruction; the clip does not contain the original model or unseen surface geometry.
- **Materials**: a thin transparent Fresnel shader creates neutral glass edges and soft studio highlights while preserving the opaque botanical interior's depth buffer. There is no depth-clearing workaround or extra transmission render pass. Leaf surfaces use restrained clearcoat, roughness and subtle sheen; a local lightformer studio provides illumination without an HDR download. Contact shadows sit beneath the neck.
- **Surface refinement**: `smoothHeadGeometry.ts` removes collapsed triangles, fairs the shell, adds one Loop subdivision and smooths the normal field. The rendered head has about 175k triangles. The nose, lips, eyelids and ears retain their shapes; the neck cap stays flat. A depth-only pass prevents rear surface folds from blending through the visible face. The face has denser glass than the cranium so it reads clearly while the brain stays visible.
- **Motion**: `src/lib/headState.ts` remains the shared state between GSAP and WebGL. A continuous 18-second cosine arc turns left → front → right → front → left, with gentle turnarounds and matching loop endpoints. A local frame clock pauses off screen; capped frame deltas and exponential scroll damping avoid a jump when rendering resumes. The entrance is a small scale/orientation change. Existing wrapper choreography in `.ab-head` is retained.
- **Cost controls / loading**: the three.js chunk and both GLBs are preloaded on `requestIdleCallback` right after first paint (or as soon as the section is within 1.5 viewports), so they are ready before the visitor scrolls there. DPR is [1.5, 1.75] on desktop and [1, 1.5] on phones, antialias is on, and the render loop stops (`frameloop="never"`) when the section is off-screen.
- **Placeholder / fallbacks**: loading uses a sage glow and botanical head outline. Reduced motion, unavailable WebGL, rendering errors and context loss use `public/head-botanical-still.webp`, a transparent 1424×1672 still exported from the same scene. Motion preferences update live; hidden tabs pause rendering. Idle callbacks, timers, observers and listeners are cleaned up on unmount.

## Performance (local `next start`, Lighthouse 12)
Desktop: Perf 99 · A11y 96 · BP 100 · SEO 100. Mobile (simulated 4G/CPU throttle): Perf ~89 · A11y 97 · BP 100 · SEO 100. No WebGL. Images are optimised webp/png from manastej.com assets. First-load JS is ~172 kB.

## TODO placeholders (real content missing)
- `TODO(source)`: the problem stats (1 in 7, $1T, <10%, 13 per 100k) are copied from manastej.com without citations. Add sources (e.g. WHO) before launch.
- `TODO`: no real product screenshots or UI exist yet. The illustrations are abstract and decorative only.
- `TODO`: no team, founders, partners, testimonials or pricing appear on the current site, so none are included.
- `TODO`: the contact route is only `mailto:contact@manastej.in`. A waitlist form needs a real backend.
- `TODO`: social links and legal pages (privacy policy, terms) aren't on the current site.
