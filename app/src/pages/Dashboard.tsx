import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Activity, Calendar, Clock, Gamepad2, Trophy, Zap } from "lucide-react";
import AppShell from "@/components/AppShell";
import GlowCard from "@/components/GlowCard";
import StatusChip from "@/components/StatusChip";
import { getGame } from "@/data/games";
import { useStore } from "@/store";

// DASHBOARD — volutamente semplice (brief): Oggi, ultimi test,
// orario migliore, gioco più testato, connessione media.

function timeAgo(ts: number): string {
  const h = Math.floor((Date.now() - ts) / 3600_000);
  if (h < 1) return "Adesso";
  if (h < 24) return `${h} h fa`;
  return `${Math.floor(h / 24)} g fa`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { history, lastResult, onboarding } = useStore();

  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const avg = Math.round(history.reduce((a, h) => a + h.result.overallScore, 0) / history.length);
    const counts = new Map<string, number>();
    history.forEach((h) => counts.set(h.gameId, (counts.get(h.gameId) ?? 0) + 1));
    const topGame = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    // best hour: hour of the best-scoring tests
    const best = [...history].sort((a, b) => b.result.overallScore - a.result.overallScore).slice(0, 3);
    const bestHour = new Date(best[0]?.result.createdAt ?? Date.now()).getHours();
    const fmt = (h: number) => `${String(h).padStart(2, "0")}:00`;
    return { avg, topGame, bestWindow: `${fmt(bestHour)} – ${fmt((bestHour + 2) % 24)}` };
  }, [history]);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl py-8">
        <span className="eyebrow">Condizioni reali</span>
        <h1 className="font-display mt-2 text-3xl font-extrabold text-text-hi md:text-4xl">La tua situazione</h1>

        {/* OGGI */}
        <GlowCard tone={lastResult?.verdictTone ?? "cyan"} className="animate-fade-up mt-6 p-5">
          <div className="mb-1 text-[13px] font-semibold text-text-mid">Oggi</div>
          {lastResult ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-display text-2xl font-extrabold text-text-hi">{lastResult.verdict}</div>
                <div className="mt-1 text-[13px] text-text-mid">
                  {getGame(lastResult.gameId).name} · punteggio {lastResult.overallScore}/100 · rischio {lastResult.risk}%
                </div>
              </div>
              <button onClick={() => navigate("/risultato")} className="btn-secondary h-11 px-5 text-[13px]">
                Vedi dettaglio
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[15px] text-text-mid">Non hai ancora fatto un test oggi.</p>
              <button onClick={() => navigate("/test")} className="btn-primary h-11 px-5 text-[13px]">
                <Zap size={16} fill="currentColor" /> Avvia il test
              </button>
            </div>
          )}
        </GlowCard>

        {/* INSIGHTS 2×2 */}
        {stats && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <GlowCard className="animate-fade-up p-4" style={{ animationDelay: "0.06s" }}>
              <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-text-mid">
                <Clock size={13} className="text-cyan" /> Il tuo orario migliore
              </div>
              <div className="font-display text-[17px] font-extrabold text-ok">{stats.bestWindow}</div>
            </GlowCard>
            <GlowCard className="animate-fade-up p-4" style={{ animationDelay: "0.1s" }}>
              <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-text-mid">
                <Trophy size={13} className="text-cyan" /> Gioco più testato
              </div>
              <div className="font-display text-[17px] font-extrabold text-text-hi">{getGame(stats.topGame).name}</div>
            </GlowCard>
            <GlowCard className="animate-fade-up p-4" style={{ animationDelay: "0.14s" }}>
              <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-text-mid">
                <Activity size={13} className="text-cyan" /> Connessione media
              </div>
              <div className="font-display text-[17px] font-extrabold text-text-hi">{stats.avg}/100</div>
            </GlowCard>
            <GlowCard className="animate-fade-up p-4" style={{ animationDelay: "0.18s" }}>
              <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-text-mid">
                <Calendar size={13} className="text-cyan" /> Test totali
              </div>
              <div className="font-display text-[17px] font-extrabold text-text-hi">{history.length}</div>
            </GlowCard>
          </div>
        )}

        {/* ULTIMI TEST */}
        <h2 className="font-display mt-8 text-xl font-extrabold text-text-hi">Ultimi test</h2>
        <div className="mt-3 flex flex-col gap-2.5">
          {history.slice(0, 10).map((h, i) => {
            const g = getGame(h.gameId);
            return (
              <GlowCard key={h.id} className="animate-fade-up flex items-center justify-between p-4" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[var(--border-soft)]">
                    {g.tileImg ? (
                      <img src={g.tileImg} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <Gamepad2 size={18} style={{ color: g.tile.accent }} />
                    )}
                  </span>
                  <div>
                    <div className="text-[14px] font-semibold text-text-hi">{g.name}</div>
                    <div className="text-[12px] text-text-low">{timeAgo(h.result.createdAt)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-[15px] font-extrabold text-text-hi">{h.result.overallScore}</span>
                  <StatusChip status={h.result.verdictTone} label={h.result.verdict} className="hidden sm:inline-flex !text-[10px]" />
                  <StatusChip status={h.result.verdictTone} label={h.result.verdictTone === "ok" ? "OK" : h.result.verdictTone === "warn" ? "OK con riserve" : "Attendi"} className="sm:hidden !text-[10px]" />
                </div>
              </GlowCard>
            );
          })}
          {history.length === 0 && <p className="text-[14px] text-text-mid">I tuoi test appariranno qui.</p>}
        </div>

        <p className="mt-6 text-[12px] leading-relaxed text-text-low">
          I dati sono salvati solo su questo dispositivo{onboarding.done ? "" : " (onboarding non completato)"}. Con un account verranno sincronizzati e useremo il tuo storico
          per affinare le previsioni — sempre in forma aggregata e anonima.
        </p>
      </div>
    </AppShell>
  );
}
