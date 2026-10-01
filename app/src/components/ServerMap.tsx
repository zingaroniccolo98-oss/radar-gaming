import { useMemo } from "react";
import type { Status } from "@/lib/types";
import { SERVERS } from "@/data/servers";
import { EUROPE_LAND_PATHS } from "@/data/europe-land";
import { cn } from "@/lib/utils";

// ============================================================
// Real-Europe SVG map: actual country coastlines (world-atlas
// 110m), glowing server nodes on top. No tiles: crisp at any
// DPI, offline-friendly (Capacitor-ready).
// Projection: x = (lon+12)*20, y = (72-lat)*26, viewBox 720×960.
// ============================================================

const VW = 720;
const VBY = 60; // crop: hide empty far-north, keep Iberia/Greece visible
const VBH = 840;
const CENTER_Y = VBY + VBH / 2;

const proj = (lon: number, lat: number) => ({ x: (lon + 12) * 20, y: (72 - lat) * 26 });

/** Default status from baseline ping (home preview): mix like the mockup. */
function statusFromPing(ping: number): Status {
  if (ping <= 40) return "ok";
  if (ping <= 58) return "warn";
  return "bad";
}

/** Label placement overrides to avoid collisions (Milano/Torino/Londra). */
const LABEL_SIDE: Record<string, "right" | "left" | "bottom"> = {
  milano: "bottom",
  torino: "left",
  londra: "left",
  amsterdam: "right",
  varsavia: "left",
};

const STATUS_COLOR: Record<Status, string> = {
  ok: "#22E06C",
  warn: "#FFC81F",
  bad: "#FF4D5E",
};

export interface MapNode {
  id: string;
  status: Status;
  ping?: number;
}

export default function ServerMap({
  nodes,
  onSelect,
  selectedId,
  zoomTo,
  className,
  showLabels = true,
}: {
  nodes?: MapNode[];
  onSelect?: (id: string) => void;
  selectedId?: string;
  zoomTo?: { lon: number; lat: number; scale: number } | null;
  className?: string;
  showLabels?: boolean;
}) {
  const nodeMap = useMemo(
    () => new Map((nodes ?? SERVERS.map((s) => ({ id: s.id, status: statusFromPing(s.basePingMs), ping: s.basePingMs }))).map((n) => [n.id, n])),
    [nodes],
  );

  const transform = zoomTo
    ? (() => {
        const p = proj(zoomTo.lon, zoomTo.lat);
        const tx = VW / 2 - zoomTo.scale * p.x;
        const ty = CENTER_Y - zoomTo.scale * p.y;
        return `translate(${tx} ${ty}) scale(${zoomTo.scale})`;
      })()
    : "translate(0 0) scale(1)";

  return (
    <svg viewBox={`0 ${VBY} ${VW} ${VBH}`} className={cn("h-full w-full", className)} role="img" aria-label="Mappa dei server in Europa">
      <defs>
        <radialGradient id="oceanGlow" cx="50%" cy="55%" r="70%">
          <stop offset="0%" stopColor="rgba(46,124,255,0.22)" />
          <stop offset="60%" stopColor="rgba(34,216,255,0.07)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="landGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="rgba(46,124,255,0.35)" />
        </filter>
      </defs>
      <rect x={0} y={VBY} width={VW} height={VBH} fill="url(#oceanGlow)" />

      <g style={{ transform, transition: "transform 1.1s cubic-bezier(0.22,0.8,0.24,1)", transformOrigin: "0 0" }}>
        {/* REAL landmass */}
        <g filter="url(#landGlow)">
          {EUROPE_LAND_PATHS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="#152349"
              fillOpacity={0.92}
              stroke="rgba(90,150,255,0.5)"
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
          ))}
        </g>

        {/* server nodes */}
        {SERVERS.map((sv) => {
          const p = proj(sv.lon, sv.lat);
          const n = nodeMap.get(sv.id);
          const status = n?.status ?? "ok";
          const color = STATUS_COLOR[status];
          const selected = selectedId === sv.id;
          const interactive = Boolean(onSelect);
          const label = n?.ping != null ? `${sv.city} · ${n.ping} ms` : sv.city;
          const labelW = label.length * 8 + 20;
          return (
            <g
              key={sv.id}
              onClick={() => onSelect?.(sv.id)}
              onKeyDown={(e) => {
                if (interactive && (e.key === "Enter" || e.key === " ")) onSelect?.(sv.id);
              }}
              tabIndex={interactive ? 0 : -1}
              role={interactive ? "button" : undefined}
              aria-label={`Server ${sv.city}`}
              className={cn(interactive && "cursor-pointer")}
              style={{ outline: "none" }}
            >
              {/* radar pulse */}
              <circle
                cx={p.x}
                cy={p.y}
                r={12}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                opacity={0.8}
                className="motion-reduce:hidden"
                style={{
                  transformOrigin: `${p.x}px ${p.y}px`,
                  animation: "radar-ping 2.2s ease-out infinite",
                  animationDelay: `${(sv.lon + 12) * 0.12}s`,
                }}
              />
              {/* halo */}
              <circle cx={p.x} cy={p.y} r={selected ? 20 : 15} fill={color} opacity={0.28} style={{ transition: "all 0.3s ease" }} />
              {/* core */}
              <circle
                cx={p.x}
                cy={p.y}
                r={selected ? 10 : 8}
                fill={color}
                stroke="rgba(255,255,255,0.95)"
                strokeWidth={selected ? 3 : 2}
                style={{ filter: `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 4px ${color})`, transition: "all 0.3s ease" }}
              />
              {showLabels &&
                (() => {
                  const side = LABEL_SIDE[sv.id] ?? "right";
                  const rectX = side === "right" ? p.x + 14 : side === "left" ? p.x - 14 - labelW : p.x - labelW / 2;
                  const rectY = side === "bottom" ? p.y + 16 : p.y - 16;
                  return (
                    <g>
                      <rect
                        x={rectX}
                        y={rectY}
                        rx={9}
                        width={labelW}
                        height={28}
                        fill="rgba(4,8,26,0.92)"
                        stroke={color}
                        strokeWidth={1.2}
                        strokeOpacity={0.7}
                      />
                      <circle cx={rectX + 12} cy={rectY + 14} r={4} fill={color} />
                      <text x={rectX + 22} y={rectY + 18.5} fill="#F2F6FF" fontSize={14} fontWeight={700} fontFamily="Inter, sans-serif">
                        {label}
                      </text>
                    </g>
                  );
                })()}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
