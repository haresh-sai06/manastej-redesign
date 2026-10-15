/** Leaf motif echoing the leaves around the brain in the Manastej logo. */
export function Leaf({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 40 40" className={className} style={style} aria-hidden="true">
      <path d="M6 34C6 18 16 6 34 6c0 18-12 28-28 28Z" fill="currentColor" opacity=".9" />
      <path d="M8 32 30 10" stroke="rgba(5,19,17,.45)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
