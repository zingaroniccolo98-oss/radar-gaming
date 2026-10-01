// ============================================================
// CONNECTION RADAR — Evaluation Engine
// Fully isolated from UI and from any AI: deterministic,
// game-profile-driven, testable. In production this module
// becomes a Vercel API route / Supabase Edge Function with the
// exact same input/output contract. The AI advisor only gets
// to EXPLAIN these numbers, never to invent them.
// ============================================================

import type {
  ConfidenceLevel,
  EngineResult,
  GameProfile,
  IndicatorResult,
  Status,
  TestInput,
  TimeSlot,
  Verdict,
} from "@/lib/types";
import { SERVERS, serverPingNow } from "@/data/servers";

const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));

// ------------------------------------------------------------
// 1. CONFIDENCE — user rule: manual/auto × same device ×
//    Ethernet/Wi-Fi/unknown. Never blocks, only weights.
// ------------------------------------------------------------
export function computeConfidence(input: TestInput): ConfidenceLevel {
  let score = 0;
  score += input.source === "manual" ? 2 : 1; // console values are ground truth for the gaming device
  score += input.sameDevice ? 2 : 0;
  score += input.testDeviceConnection === "lan" ? 2 : input.testDeviceConnection === "wifi" ? 1 : 0;
  if (input.testDeviceConnection === "hotspot") score -= 1;
  if (score >= 5) return "alta";
  if (score >= 3) return "media";
  return "bassa";
}

// ------------------------------------------------------------
// 2. CONNECTION SCORE — weighted by the game's sensitivities.
// ------------------------------------------------------------
function metricScore(value: number, good: number, ok: number): number {
  if (value <= good) return 100;
  if (value <= ok) return 100 - ((value - good) / (ok - good)) * 45; // 100 → 55
  return clamp(55 - ((value - ok) / ok) * 110, 0, 55); // decays to 0
}

export function connectionScore(input: TestInput, game: GameProfile): IndicatorResult {
  const s = game.sensitivity;
  const ping = metricScore(input.pingMs, game.pingThresholds.good, game.pingThresholds.ok);
  const jitter = metricScore(input.jitterMs, game.jitterThresholds.good, game.jitterThresholds.ok);
  const loss = metricScore(input.packetLossPct, game.lossThresholds.good, game.lossThresholds.ok);
  const bwDown = clamp((input.downloadMbps / Math.max(game.bandwidthReq.download * 4, 1)) * 100);
  const bwUp = clamp((input.uploadMbps / Math.max(game.bandwidthReq.upload * 4, 1)) * 100);
  const bandwidth = Math.min(bwDown, bwUp);

  const total = s.ping + s.jitter + s.packetLoss + s.bandwidth;
  const score = Math.round(
    (ping * s.ping + jitter * s.jitter + loss * s.packetLoss + bandwidth * s.bandwidth) / total,
  );

  const status: Status = score >= 70 ? "ok" : score >= 45 ? "warn" : "bad";
  const label = score >= 85 ? "Ottima" : score >= 70 ? "Buona" : score >= 45 ? "Variabile" : "Critica";
  return { status, label, score };
}

// ------------------------------------------------------------
// 3. SERVER SCORE — priority regions for the game, current load.
// ------------------------------------------------------------
export function serverScore(game: GameProfile, hour: number, userPingMs: number): IndicatorResult & { bestServerId: string } {
  const nodes = SERVERS.filter((sv) => game.priorityServers.includes(sv.id));
  const pool = nodes.length > 0 ? nodes : SERVERS.slice(0, 4);

  let best = pool[0];
  let bestPing = Infinity;
  let sum = 0;
  for (const sv of pool) {
    const p = serverPingNow(sv, hour, userPingMs);
    sum += p;
    if (p < bestPing) {
      bestPing = p;
      best = sv;
    }
  }
  const avg = sum / pool.length;
  const score = Math.round(metricScore(avg, game.pingThresholds.good + 5, game.pingThresholds.ok + 10));
  const status: Status = score >= 70 ? "ok" : score >= 45 ? "warn" : "bad";
  const label = score >= 70 ? "Favorevoli" : score >= 45 ? "Variabili" : "Problematici";
  return { status, label, score, bestServerId: best.id };
}

// ------------------------------------------------------------
// 4. TIME SCORE — conservative rules now, real stats later
//    (brief: all'inizio regole conservative, poi statistiche).
// ------------------------------------------------------------
export function timeScore(hour: number): IndicatorResult {
  // Evening peak 20–23 is worst for matchmaking congestion;
  // late night / early morning best. Afternoon neutral.
  let score: number;
  if (hour >= 23 || hour < 2) score = 88;
  else if (hour >= 2 && hour < 8) score = 92;
  else if (hour >= 8 && hour < 17) score = 72;
  else if (hour >= 17 && hour < 20) score = 58;
  else score = 38; // 20–23 peak
  const status: Status = score >= 70 ? "ok" : score >= 45 ? "warn" : "bad";
  const label = score >= 70 ? "Favorevole" : score >= 45 ? "Nella media" : "Ora di punta";
  return { status, label, score };
}

// ------------------------------------------------------------
// 5. MATCH INSTABILITY RISK (match_instability_risk) 0..100
//    Proprietary index: never presented as certainty about the
//    opponent's connection. Thresholds configurable per game.
// ------------------------------------------------------------
export function instabilityRisk(
  input: TestInput,
  game: GameProfile,
  hour: number,
  confidence: ConfidenceLevel,
): { risk: number; status: Status; label: string } {
  const t = timeScore(hour);
  const timeComponent = 100 - t.score; // peak hours raise risk

  const stability = metricScore(input.jitterMs, game.jitterThresholds.good, game.jitterThresholds.ok);
  const loss = metricScore(input.packetLossPct, game.lossThresholds.good, game.lossThresholds.ok);
  const connectionComponent = 100 - (stability * 0.6 + loss * 0.4);

  const sv = serverScore(game, hour, input.pingMs);
  const serverComponent = 100 - sv.score;

  // Lower confidence → we widen the estimate upward slightly (conservative).
  const confidencePenalty = confidence === "alta" ? 0 : confidence === "media" ? 6 : 12;

  const risk = Math.round(
    clamp(timeComponent * 0.35 + connectionComponent * 0.4 + serverComponent * 0.25 + confidencePenalty),
  );

  const status: Status = risk <= game.riskBands.low ? "ok" : risk <= game.riskBands.medium ? "warn" : "bad";
  const label = status === "ok" ? "Basso" : status === "warn" ? "Medio" : "Alto";
  return { risk, status, label };
}

// ------------------------------------------------------------
// 6. TIME SLOTS — simple forecast, always presented as estimate.
// ------------------------------------------------------------
export function computeSlots(currentHour: number): { slots: TimeSlot[]; bestSlot: string } {
  const raw: Array<{ label: string; start: number; end: number }> = [
    { label: "Adesso", start: currentHour, end: currentHour + 1 },
    { label: "21 – 22", start: 21, end: 22 },
    { label: "22 – 23", start: 22, end: 23 },
    { label: "23 – 00:30", start: 23, end: 24.5 },
    { label: "00:30 – 02", start: 0.5, end: 2 },
  ];
  const seen = new Set<string>();
  const slots: TimeSlot[] = [];
  for (const r of raw) {
    if (seen.has(r.label)) continue;
    seen.add(r.label);
    const mid = r.start >= 24 ? r.start - 24 : r.start;
    const s = timeScore(mid % 24);
    slots.push({
      label: r.label,
      status: s.status,
      word: s.score >= 85 ? "Ideale" : s.score >= 70 ? "Buono" : s.score >= 50 ? "Variabile" : s.score >= 40 ? "Peggiore" : "Sconsigliato",
    });
  }
  const best = slots.reduce((a, b) => {
    const rank = (x: TimeSlot) => (x.status === "ok" ? 2 : x.status === "warn" ? 1 : 0);
    return rank(b) > rank(a) ? b : a;
  });
  const bestSlot = slots.find((s) => s.word === "Ideale")?.label ?? best.label;
  return { slots, bestSlot };
}

// ------------------------------------------------------------
// 7. ADVISOR — rule-based, 1–3 sentences, problem-derived
//    (never generic "riavvia il router"). Same I/O contract as
//    the future LLM+RAG advisor: engine result + profile → text.
// ------------------------------------------------------------
export function buildAdvice(input: TestInput, game: GameProfile, conn: IndicatorResult, risk: number, verdict: Verdict): string {
  const fastEnough = input.downloadMbps >= game.bandwidthReq.download * 2;
  const jitterBad = input.jitterMs > game.jitterThresholds.ok;
  const lossBad = input.packetLossPct > game.lossThresholds.ok;
  const pingBad = input.pingMs > game.pingThresholds.ok;
  const onWifi = input.testDeviceConnection === "wifi" || input.testDeviceConnection === "hotspot";

  if (verdict === "GIOCA ADESSO") {
    return `La tua connessione è ${conn.label.toLowerCase()} e le aree server principali risultano favorevoli. Questo è un buon momento per giocare a ${game.name}.`;
  }

  const problems: string[] = [];
  const fixes: string[] = [];

  if (jitterBad) {
    problems.push(fastEnough ? "la velocità è già sufficiente, il problema è la stabilità (jitter)" : "il jitter è alto");
    fixes.push(onWifi ? "prova via cavo Ethernet o avvicinati al router" : "controlla che nessun download sia attivo in casa");
  }
  if (lossBad) {
    problems.push("c'è perdita di pacchetti");
    fixes.push(onWifi ? "il Wi-Fi è la causa più probabile: passa al cavo se puoi" : "riavvia il router e ricontrolla tra qualche minuto");
  }
  if (pingBad && !jitterBad && !lossBad) {
    problems.push("il ping è alto per questo gioco");
    fixes.push("gioca in una fascia meno affollata o verifica la regione di matchmaking");
  }
  if (problems.length === 0) {
    if (risk > game.riskBands.medium) {
      return `La tua linea è a posto, ma in questa fascia oraria il rischio di partite instabili è più alto. Se puoi, riprova più tardi: trovi la fascia migliore qui sotto.`;
    }
    return `La connessione è sufficiente per ${game.name}, ma le condizioni non sono ideali. Puoi giocare, aspettandoti qualche partita meno fluida.`;
  }

  const gameWhy = game.note;
  const sentence1 = `Il problema principale: ${problems.join(" e ")}.`;
  const sentence2 = fixes.length > 0 ? `${capitalize(fixes[0])} — su ${game.name} questo incide molto.` : gameWhy;
  return `${sentence1} ${sentence2}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ------------------------------------------------------------
// 8. MAIN ENTRY — overall score + verdict
//    Weights (design.md): connection 45 / server 30 / time 15 / risk 10
// ------------------------------------------------------------
export function evaluate(input: TestInput, game: GameProfile, now = new Date()): EngineResult {
  const hour = now.getHours() + now.getMinutes() / 60;
  const confidence = computeConfidence(input);

  const connection = connectionScore(input, game);
  const server = serverScore(game, hour, input.pingMs);
  const time = timeScore(hour);
  const { risk, status: riskStatus, label: riskLabel } = instabilityRisk(input, game, hour, confidence);

  let overall = Math.round(connection.score * 0.45 + server.score * 0.3 + time.score * 0.15 + (100 - risk) * 0.1);
  // Low confidence nudges the verdict one notch more conservative.
  if (confidence === "bassa") overall = Math.max(0, overall - 5);

  const verdict: Verdict = overall >= 70 ? "GIOCA ADESSO" : overall >= 45 ? "PUOI GIOCARE" : "MEGLIO ASPETTARE";
  const verdictTone: Status = verdict === "GIOCA ADESSO" ? "ok" : verdict === "PUOI GIOCARE" ? "warn" : "bad";

  const { slots, bestSlot } = computeSlots(Math.floor(hour));
  const advice = buildAdvice(input, game, connection, risk, verdict);

  return {
    gameId: game.id,
    connection,
    server: { status: server.status, label: server.label, score: server.score },
    time,
    risk,
    riskStatus,
    riskLabel,
    overallScore: overall,
    verdict,
    verdictTone,
    confidence,
    indicative: confidence === "bassa",
    bestSlot,
    slots,
    advice,
    bestServerId: server.bestServerId,
    createdAt: now.getTime(),
    input,
  };
}

// ------------------------------------------------------------
// Simulated automatic test — in production replaced by real
// client-side measurements (fetch timing / WebRTC) against
// Vercel/Supabase edge endpoints. Plausible values around the
// user's declared connection type.
// ------------------------------------------------------------
export function simulateAutoTest(conn: NonNullable<TestInput["testDeviceConnection"]>): Omit<TestInput, "testDeviceConnection" | "sameDevice" | "source"> {
  const jittery = conn === "wifi" || conn === "hotspot";
  const base = jittery ? 1.6 : 1;
  return {
    downloadMbps: Math.round((160 + Math.random() * 80) / base),
    uploadMbps: Math.round((24 + Math.random() * 12) / base),
    pingMs: Math.round((14 + Math.random() * 10) * base),
    jitterMs: Math.round((jittery ? 6 + Math.random() * 12 : 2 + Math.random() * 3)),
    packetLossPct: jittery ? Math.round(Math.random() * 14) / 10 : Math.round(Math.random() * 2) / 10,
  };
}
