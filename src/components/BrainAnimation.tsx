/** Corrected recorded rotation, with transparent edges and a reduced-motion still. */
export default function BrainAnimation() {
  return (
    <div className="relative aspect-[495/604] w-full" data-brain-animation>
      <picture className="absolute -inset-[20%] block h-[140%] w-[140%]">
        <source media="(prefers-reduced-motion: reduce)" srcSet="/media/botanical-brain-poster.webp" />
        <source type="image/webp" srcSet="/media/botanical-brain.webp" />
        {/* Keep the animation intact instead of passing it through image optimization. */}
        <img src="/media/botanical-brain.gif" alt="" width={480} height={480} loading="lazy" decoding="async" className="h-full w-full max-w-none object-contain" />
      </picture>
    </div>
  );
}
