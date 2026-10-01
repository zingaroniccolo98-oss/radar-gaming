import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "none" | "ok" | "warn" | "bad" | "cyan";

export default function GlowCard({
  tone = "none",
  className,
  children,
  ...rest
}: { tone?: Tone; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glow-card", tone !== "none" && `glow-card-${tone}`, className)} {...rest}>
      {children}
    </div>
  );
}
