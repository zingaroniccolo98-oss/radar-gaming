import type { Status } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SemaphoreDot({ status, className }: { status: Status; className?: string }) {
  return <span className={cn("semaphore-dot", `semaphore-dot-${status}`, className)} aria-hidden />;
}

export default function StatusChip({ status, label, className }: { status: Status; label: string; className?: string }) {
  return (
    <span className={cn("status-chip", `status-chip-${status}`, className)}>
      <SemaphoreDot status={status} />
      {label}
    </span>
  );
}

/** 4-bar signal glyph colored by status (mockup cards). */
export function SignalBars({ status, className }: { status: Status; className?: string }) {
  const color = status === "ok" ? "var(--ok)" : status === "warn" ? "var(--warn)" : "var(--bad)";
  const bars = status === "ok" ? 4 : status === "warn" ? 3 : 2;
  return (
    <span className={cn("inline-flex items-end gap-[3px]", className)} aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-[4px] rounded-sm transition-all"
          style={{
            height: `${6 + i * 4}px`,
            background: i < bars ? color : "rgba(120,140,190,0.25)",
            boxShadow: i < bars ? `0 0 6px ${color}` : "none",
          }}
        />
      ))}
    </span>
  );
}
