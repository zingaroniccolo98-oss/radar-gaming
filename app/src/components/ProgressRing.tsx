import { Zap } from "lucide-react";

/** Mockup-style gradient progress ring with bolt + percentage. */
export default function ProgressRing({
  progress, // 0..100
  size = 300,
  done = false,
}: {
  progress: number;
  size?: number;
  done?: boolean;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }} role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
      <svg width={size} height={size} className="animate-[spin-slow_12s_linear_infinite] motion-reduce:animate-none">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22D8FF" />
            <stop offset="100%" stopColor="#2E7CFF" />
          </linearGradient>
          <linearGradient id="ringGradDone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22E06C" />
            <stop offset="100%" stopColor="#22D8FF" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-2)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={done ? "url(#ringGradDone)" : "url(#ringGrad)"}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: "stroke-dashoffset 0.3s ease-out",
            filter: done ? "drop-shadow(0 0 14px rgba(34,224,108,0.7))" : "drop-shadow(0 0 12px rgba(34,216,255,0.6))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <Zap
          size={44}
          className={done ? "text-ok" : "text-brand animate-[node-pulse_1.6s_ease-in-out_infinite]"}
          fill="currentColor"
        />
        <span className="font-display font-extrabold text-[52px] leading-none text-text-hi" style={{ fontVariantNumeric: "tabular-nums" }}>
          {Math.round(progress)}%
        </span>
        <span className="text-[13px] font-medium text-text-mid">
          {done ? "Completato" : "Test in corso"}
          {!done && <span className="animated-ellipsis" />}
        </span>
      </div>
    </div>
  );
}
