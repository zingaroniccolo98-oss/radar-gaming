// ============================================================
// CONNECTION RADAR — domain types
// These types mirror the future Supabase schema: each interface
// maps 1:1 to a table (games, servers, tests, results, profiles).
// ============================================================

export type Status = "ok" | "warn" | "bad";

export type Platform = "playstation" | "xbox" | "pc" | "mobile" | "nintendo" | "altro";

export type ConnectionType = "lan" | "wifi" | "hotspot" | "unknown";

export type TestSource = "manual" | "auto";

export type Verdict = "GIOCA ADESSO" | "PUOI GIOCARE" | "MEGLIO ASPETTARE";

/** GameConnectionProfile — adding a game = adding one of these (no core changes). */
export interface GameProfile {
  id: string;
  name: string;
  publisher: string;
  platforms: Platform[];
  /** client-server | p2p | hybrid */
  serverModel: "client-server" | "p2p" | "hybrid";
  /** Sensitivity weights 0..1 — how much each metric hurts THIS game. */
  sensitivity: {
    ping: number;
    jitter: number;
    packetLoss: number;
    bandwidth: number;
  };
  /** Minimum bandwidth requirements (Mbps). */
  bandwidthReq: { download: number; upload: number };
  /** Ping thresholds in ms: <=good is ok, <=ok is warn, above is bad. */
  pingThresholds: { good: number; ok: number };
  /** Jitter thresholds in ms. */
  jitterThresholds: { good: number; ok: number };
  /** Packet loss thresholds in %. */
  lossThresholds: { good: number; ok: number };
  /** Configurable instability-risk bands (brief: soglie configurabili per gioco). */
  riskBands: { low: number; medium: number }; // 0..low ok, low+1..medium warn, above bad
  /** Gradient for the game tile. */
  tile: { from: string; to: string; accent: string };
  /** Key-art image for the tile (falls back to gradient). */
  tileImg?: string;
  /** Priority server region ids for this game. */
  priorityServers: string[];
  /** Short technical note used by the advisor. */
  note: string;
}

/** Server/region node — source_type official vs observed never mixed. */
export interface ServerNode {
  id: string;
  city: string;
  country: string;
  region: string;
  provider: string;
  sourceType: "official" | "observed";
  confidence: "alta" | "media" | "bassa";
  /** Position on the stylized map (lon/lat). */
  lon: number;
  lat: number;
  /** Baseline ping from a typical Italian user (demo data). */
  basePingMs: number;
  /** 24h load curve 0..1 (index = hour). */
  loadCurve: number[];
  /** Photo asset for the detail hero (optional). */
  photo?: string;
}

export interface OnboardingAnswers {
  games: string[];
  platform: Platform | null;
  connection: ConnectionType | null;
  done: boolean;
}

export interface TestInput {
  source: TestSource;
  downloadMbps: number;
  uploadMbps: number;
  pingMs: number;
  jitterMs: number;
  packetLossPct: number;
  /** How the TEST device is connected (user rule: optional, feeds confidence only). */
  testDeviceConnection: ConnectionType;
  /** Whether the test device is the same device used for gaming. */
  sameDevice: boolean;
}

export type ConfidenceLevel = "alta" | "media" | "bassa";

export interface IndicatorResult {
  status: Status;
  label: string;
  score: number; // 0..100
}

export interface TimeSlot {
  label: string;
  status: Status;
  word: string;
}

export interface EngineResult {
  gameId: string;
  connection: IndicatorResult;
  server: IndicatorResult;
  time: IndicatorResult;
  /** match_instability_risk 0..100 */
  risk: number;
  riskStatus: Status;
  riskLabel: string;
  overallScore: number;
  verdict: Verdict;
  verdictTone: Status;
  confidence: ConfidenceLevel;
  indicative: boolean;
  bestSlot: string;
  slots: TimeSlot[];
  /** 1–3 Italian sentences, rule-based advisor (same I/O contract as future LLM+RAG). */
  advice: string;
  bestServerId: string;
  createdAt: number;
  input: TestInput;
}

export interface HistoryEntry {
  id: string;
  gameId: string;
  result: EngineResult;
}
