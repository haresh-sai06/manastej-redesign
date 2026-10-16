/** Abstract, decorative illustrations per feature. Pure SVG/CSS, no data implied. */
export function FeatureArt({ i }: { i: number }) {
  const common = "absolute inset-0 h-full w-full";
  switch (i) {
    case 0: // Tracker: flowing check-in line
      return (
        <svg viewBox="0 0 400 200" className={common} aria-hidden="true">
          {[0, 1, 2].map((k) => (
            <path key={k} d={`M0 ${120 - k * 18} C 60 ${60 - k * 10}, 110 ${170 - k * 12}, 170 ${110 - k * 14} S 290 ${40 + k * 8}, 400 ${100 - k * 16}`} fill="none" stroke={["#56d4cf", "#3db8ad", "#f2c46d"][k]} strokeOpacity={0.8 - k * 0.2} strokeWidth="2" strokeDasharray="600" strokeDashoffset="600" style={{ animation: `draw 3.5s ${k * 0.4}s ease-out forwards` }} />
          ))}
          {[60, 140, 220, 300, 380].map((x) => <circle key={x} cx={x} cy={100} r="3" fill="#e8f6f4" opacity=".5" />)}
        </svg>
      );
    case 1: // Tele-health: two connected presences
      return (
        <svg viewBox="0 0 400 200" className={common} aria-hidden="true">
          <circle cx="130" cy="100" r="52" fill="none" stroke="#56d4cf" strokeOpacity=".6" />
          <circle cx="270" cy="100" r="52" fill="none" stroke="#f2c46d" strokeOpacity=".6" />
          <path d="M182 100h36" stroke="#e8f6f4" strokeDasharray="4 6" />
          <rect x="183" y="86" width="34" height="28" rx="8" fill="none" stroke="#9dc4be" strokeOpacity=".6" />
        </svg>
      );
    case 2: // Bio-nudge: breathing circle
      return (
        <div className={`${common} grid place-items-center`} aria-hidden="true">
          <div className="anim-breathe h-36 w-36 rounded-full border border-mint/50 bg-[radial-gradient(circle,rgba(86,212,207,.35),transparent_70%)]" />
          <div className="anim-breathe absolute h-56 w-56 rounded-full border border-mint/15 [animation-delay:-1.5s]" />
        </div>
      );
    case 3: // Mind Canvas: house, tree, person line drawing
      return (
        <svg viewBox="0 0 400 200" className={common} fill="none" stroke="#e8f6f4" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M70 160V105l45-35 45 35v55H70Z M100 160v-30h30v30" strokeDasharray="500" strokeDashoffset="500" style={{ animation: "draw 3s ease-out forwards" }} />
          <path d="M215 160v-50 M215 110c-30 0-34-48 0-52 34 4 30 52 0 52Z" stroke="#56d4cf" strokeDasharray="400" strokeDashoffset="400" style={{ animation: "draw 3s .4s ease-out forwards" }} />
          <path d="M310 78a12 12 0 1 0 0 .1 M310 92v38 M290 108h40 M310 130l-14 30 M310 130l14 30" stroke="#f2c46d" strokeDasharray="300" strokeDashoffset="300" style={{ animation: "draw 3s .8s ease-out forwards" }} />
        </svg>
      );
    case 4: // Peer support: two conversation bubbles
      return (
        <svg viewBox="0 0 400 200" className={common} aria-hidden="true">
          <path d="M90 60h140a20 20 0 0 1 20 20v30a20 20 0 0 1-20 20h-90l-30 22v-22H90a20 20 0 0 1-20-20V80a20 20 0 0 1 20-20Z" fill="rgba(86,212,207,.12)" stroke="#56d4cf" strokeOpacity=".6" />
          <path d="M310 100H200a18 18 0 0 0-18 18v18a18 18 0 0 0 18 18h70l26 18v-18h14a18 18 0 0 0 18-18v-18a18 18 0 0 0-18-18Z" fill="rgba(242,196,109,.10)" stroke="#f2c46d" strokeOpacity=".6" />
        </svg>
      );
    default: // Character Story: a sprout that grows
      return (
        <svg viewBox="0 0 400 200" className={common} fill="none" strokeLinecap="round" aria-hidden="true">
          <path d="M200 190V90" stroke="#3db8ad" strokeWidth="3" strokeDasharray="120" strokeDashoffset="120" style={{ animation: "draw 2.4s ease-out forwards" }} />
          <path d="M200 120c-40-4-56-30-56-52 30 0 54 18 56 52Z" fill="rgba(86,212,207,.25)" stroke="#56d4cf" />
          <path d="M200 100c34-6 50-30 50-50-28 0-50 18-50 50Z" fill="rgba(242,196,109,.2)" stroke="#f2c46d" />
          <circle cx="200" cy="40" r="6" fill="#f2c46d" className="anim-breathe" />
        </svg>
      );
  }
}
