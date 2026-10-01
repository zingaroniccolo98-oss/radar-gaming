export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Lightning "Z" bolt */}
      <svg width="30" height="30" viewBox="0 0 96 96" className="drop-shadow-[0_0_10px_rgba(255,200,31,0.55)]" aria-hidden>
        <path
          d="M18 14 H78 L40 50 H66 L22 86 L36 56 H14 Z"
          fill="#FFC81F"
          stroke="#FFC81F"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </svg>
      {!compact && (
        <div className="leading-none">
          <div className="font-display font-black italic uppercase text-[13px] tracking-[0.06em] text-text-hi">
            From Zero to Hero
          </div>
          <div className="eyebrow mt-1 !text-[9px]">Connection Radar</div>
        </div>
      )}
    </div>
  );
}
