import type { ServerNode, Status } from "@/lib/types";

// ============================================================
// SERVER CATALOG — official vs observed kept separate (brief).
// Demo dataset: believable constants from design.md §9.
// loadCurve: 24 values (0..1) = typical congestion per hour.
// Peak evening 20–23, quiet late night / early morning.
// ============================================================

const eveningPeak = [
  0.25, 0.2, 0.15, 0.12, 0.1, 0.1, 0.12, 0.18, 0.25, 0.32, 0.38, 0.42, 0.48, 0.5, 0.52, 0.55,
  0.6, 0.68, 0.75, 0.85, 0.95, 1.0, 0.9, 0.6,
];
const highPeak = [
  0.3, 0.22, 0.18, 0.14, 0.12, 0.12, 0.15, 0.22, 0.3, 0.38, 0.45, 0.5, 0.55, 0.58, 0.6, 0.64,
  0.7, 0.78, 0.85, 0.95, 1.0, 0.98, 0.85, 0.55,
];
const mildCurve = [
  0.2, 0.16, 0.12, 0.1, 0.08, 0.08, 0.1, 0.15, 0.2, 0.26, 0.3, 0.34, 0.38, 0.4, 0.42, 0.45,
  0.5, 0.55, 0.62, 0.7, 0.8, 0.85, 0.7, 0.45,
];

export const SERVERS: ServerNode[] = [
  {
    id: "milano",
    city: "Milano",
    country: "Italia",
    region: "EU-Sud",
    provider: "MIX Milano / CDN locale",
    sourceType: "official",
    confidence: "alta",
    lon: 9.19,
    lat: 45.46,
    basePingMs: 16,
    loadCurve: mildCurve,
    photo: "/city-milano.png",
  },
  {
    id: "torino",
    city: "Torino",
    country: "Italia",
    region: "EU-Sud",
    provider: "Backbone nazionale",
    sourceType: "observed",
    confidence: "media",
    lon: 7.7,
    lat: 45.07,
    basePingMs: 22,
    loadCurve: mildCurve,
  },
  {
    id: "francoforte",
    city: "Francoforte",
    country: "Germania",
    region: "EU-Centro",
    provider: "AWS eu-central-1",
    sourceType: "official",
    confidence: "alta",
    lon: 8.68,
    lat: 50.11,
    basePingMs: 38,
    loadCurve: highPeak,
  },
  {
    id: "parigi",
    city: "Parigi",
    country: "Francia",
    region: "EU-Ovest",
    provider: "OVH / interconnessione FR",
    sourceType: "observed",
    confidence: "media",
    lon: 2.35,
    lat: 48.86,
    basePingMs: 41,
    loadCurve: eveningPeak,
  },
  {
    id: "londra",
    city: "Londra",
    country: "Regno Unito",
    region: "UK",
    provider: "AWS eu-west-2",
    sourceType: "official",
    confidence: "alta",
    lon: -0.13,
    lat: 51.5,
    basePingMs: 55,
    loadCurve: highPeak,
  },
  {
    id: "amsterdam",
    city: "Amsterdam",
    country: "Paesi Bassi",
    region: "EU-Ovest",
    provider: "AMS-IX / Google Cloud",
    sourceType: "official",
    confidence: "alta",
    lon: 4.9,
    lat: 52.37,
    basePingMs: 34,
    loadCurve: eveningPeak,
  },
  {
    id: "madrid",
    city: "Madrid",
    country: "Spagna",
    region: "EU-Sud-Ovest",
    provider: "Interconnessione ES",
    sourceType: "observed",
    confidence: "media",
    lon: -3.7,
    lat: 40.42,
    basePingMs: 47,
    loadCurve: eveningPeak,
  },
  {
    id: "varsavia",
    city: "Varsavia",
    country: "Polonia",
    region: "EU-Est",
    provider: "Interconnessione PL",
    sourceType: "observed",
    confidence: "bassa",
    lon: 21.01,
    lat: 52.23,
    basePingMs: 60,
    loadCurve: mildCurve,
  },
];

export function getServer(id: string): ServerNode {
  return SERVERS.find((s) => s.id === id) ?? SERVERS[0];
}

/** Effective server latency right now for a user with their own base latency factor. */
export function serverPingNow(server: ServerNode, hour: number, userPingMs: number): number {
  const load = server.loadCurve[Math.min(23, Math.max(0, Math.floor(hour)))];
  // Blend: server baseline + congestion + share of user's own latency.
  const estimated = server.basePingMs * 0.6 + userPingMs * 0.4 + load * server.basePingMs * 0.35;
  return Math.round(estimated);
}

export function serverStatusAt(server: ServerNode, hour: number, userPingMs: number): { status: Status; ping: number; word: string } {
  const ping = serverPingNow(server, hour, userPingMs);
  if (ping <= 25) return { status: "ok", ping, word: "Ottimo" };
  if (ping <= 40) return { status: "ok", ping, word: "Buono" };
  if (ping <= 58) return { status: "warn", ping, word: "Variabile" };
  return { status: "bad", ping, word: "Problematico" };
}
