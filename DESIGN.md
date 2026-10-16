# Manastej redesign: design notes

## Concept: "From night to radiance"
*Manastej* means **Manas (mind) + Tej (radiance)**. The page tells that story as one continuous scroll, starting in a deep night-teal and ending at dawn:

1. **Night**: the hero glows out of darkness. The brand's brain-and-leaves mark breathes inside radiance rings.
2. **Problem**: the darkest beat, "One crisis, three broken systems".
3. **First light**: a cream "Manas + Tej" scene where the two halves of the name fuse around the head visual from manastej.com.
4. **Day**: features, the HR suite, privacy, technology and audiences alternate between deep and light surfaces.
5. **Dawn**: the closing CTA. A warm sun rises behind मनस्तेज and layered hills.

**Palette** comes from manastej.com's CSS (`#2a8f85`, `#3db8ad`, `#56d4cf`, `#9dc4be`, `#4c6f69`, `#e8f6f4`, `#f0faf8`), deepened into `#051311` / `#0a211e` for night scenes. I added one accent, a warm **radiance gold `#f2c46d`**, because *Tej* means radiance. It's used sparingly.
**Type**: Manrope (kept from the current site) for UI and body, Instrument Serif for editorial display, and Tiro Devanagari Hindi for मनस्तेज.
**Leaf motif**: the leaves around the brain in the logo become floating parallax particles and list bullets.

## Content rules
Every word of copy comes from the live manastej.com (captured Oct 2026) and lives in `src/lib/content.ts`. The site's own caveats are kept next to each feature ("Not a diagnosis", "requires validation", and so on), along with the "in active development" disclaimer. I invented no clients, testimonials, metrics or claims. See TODOs at the bottom.

## Sections → inspiration
| Section | What it does | Borrowed from / remixed |
|---|---|---|
| Hero (pinned 230vh) | 5 depth layers: aurora → outlined मनस्तेज → radiance rings → glowing mark → leaves. Each moves at a different scroll speed, plus pointer parallax. A second beat scrub-reveals the brand quote word by word. | MotionSites **"Dreamcore Landing"** (sticky-viewport, two scroll-driven scenes) and **"Bloom"** (500vh fixed-viewport scene). Re-themed from a theatre/fantasy feel to a calm "mind glowing in the dark". |
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
- **Model**: “Human Head Basemesh” (male) by **pistachio**, [OpenGameArt](https://opengameart.org/content/2-human-head-basemeshes), **CC0 1.0** (no attribution required, credited anyway in the footer). `scripts/build-head.mjs` crops the shoulders, applies 2x Loop subdivision, quantizes and compresses with **meshopt**. Result: `public/models/head.glb` at about 67 KB, about 10k triangles.
- **Brain**: built procedurally at runtime (`src/components/three/brainGeometry.ts`): two hemispheres plus a cerebellum and stem, with ridged-noise folds. No third-party asset.
- **Materials**: the glass is drei `MeshTransmissionMaterial` (a MeshPhysicalMaterial extension: transmission 1, ior 1.32, roughness 0.12, thickness 0.35, clearcoat), plus a thin blue fresnel shell for the saturated rim. The brain is `MeshPhysicalMaterial` (pink, clearcoat, sheen). Lighting is local lightformers (`Environment`), so there's no HDR download.
- **Motion**: `src/lib/headState.ts` is a shared mutable state. GSAP writes `intro` (time-based spin-in, started once the stage enters and the model is ready) and `scroll` (ScrollTrigger progress). `useFrame` reads them, so React doesn't re-render. The pinned Manas/Tej timeline only moves the wrapper `.ab-head` (yPercent), which keeps the existing choreography intact.
- **Cost controls**: the three.js chunk is loaded with `next/dynamic` only when the section is within 1.5 viewports. DPR is capped at 1.5, the transmission buffer is 256–384 px, and the render loop stops (`frameloop="never"`) when the section is off-screen.
- **Fallbacks**: the original head image shows until the 3D model is ready. It stays as the only (static) visual when WebGL is unavailable or `prefers-reduced-motion: reduce` is set; the 3D bundle isn't even downloaded in those cases.

## Performance (local `next start`, Lighthouse 12)
Desktop: Perf 99 · A11y 96 · BP 100 · SEO 100. Mobile (simulated 4G/CPU throttle): Perf ~89 · A11y 97 · BP 100 · SEO 100. No WebGL. Images are optimised webp/png from manastej.com assets. First-load JS is ~172 kB.

## TODO placeholders (real content missing)
- `TODO(source)`: the problem stats (1 in 7, $1T, <10%, 13 per 100k) are copied from manastej.com without citations. Add sources (e.g. WHO) before launch.
- `TODO`: no real product screenshots or UI exist yet. The illustrations are abstract and decorative only.
- `TODO`: no team, founders, partners, testimonials or pricing appear on the current site, so none are included.
- `TODO`: the contact route is only `mailto:contact@manastej.in`. A waitlist form needs a real backend.
- `TODO`: social links and legal pages (privacy policy, terms) aren't on the current site.
