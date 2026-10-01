import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { Calendar, ChevronRight, Clock, Gamepad2, RotateCcw, Server, Users, Wifi } from "lucide-react";
import AppShell from "@/components/AppShell";
import CountUp from "@/components/CountUp";
import GlowCard from "@/components/GlowCard";
import ServerMap, { type MapNode } from "@/components/ServerMap";
import StatusChip, { SignalBars } from "@/components/StatusChip";
import { getGame } from "@/data/games";
import { SERVERS, serverStatusAt } from "@/data/servers";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

// RISULTATO — mockup schermata 3: mappa con zoom automatico,
// verdetto grande, 4 indicatori, miglior fascia, consiglio.

export default function Result() {
  const navigate = useNavigate();
  const { lastResult } = useStore();

  useEffect(() => {
    if (!lastResult) navigate("/test", { replace: true });
  }, [lastResult, navigate]);

  const nodes: MapNode[] = useMemo(() => {
    if (!lastResult) return [];
    const hour = new Date(lastResult.createdAt).getHours();
    return SERVERS.map((sv) => {
      const st = serverStatusAt(sv, hour, lastResult.input.pingMs);
      return { id: sv.id, status: st.status, ping: st.ping };
    });
  }, [lastResult]);

  if (!lastResult) return null;

  const game = getGame(lastResult.gameId);
  const r = lastResult;
  const toneColor = r.verdictTone === "ok" ? "text-ok" : r.verdictTone === "warn" ? "text-warn" : "text-bad";

  const indicators = [
    { icon: Wifi, label: "Connessione", chip: { status: r.connection.status, label: r.connection.label } },
    { icon: Server, label: "Server", chip: { status: r.server.status, label: r.server.label } },
    { icon: Clock, label: "Orario", chip: { status: r.time.status, label: r.time.label } },
  ];

  return (
    <AppShell>
      <div className="py-6">
        <span className="eyebrow">Passo 3 · Risultato immediato</span>
        <div className="mt-4 grid gap-5 lg:grid-cols-12">
          {/* MAPPA */}
          <div className="lg:col-span-7">
            <GlowCard className="relative h-[46dvh] min-h-[320px] overflow-hidden lg:h-[560px]">
              <ServerMap
                nodes={nodes}
                selectedId={r.bestServerId}
                zoomTo={{ lon: 8.5, lat: 46.5, scale: 1.9 }}
                onSelect={(id) => navigate(`/server/${id}`)}
                className="p-2"
              />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl bg-[rgba(7,13,36,0.85)] px-3.5 py-2.5 backdrop-blur-sm">
                <span className="text-[12px] text-text-mid">Tocca un nodo per il dettaglio</span>
                <div className="flex items-center gap-3 text-[11px] text-text-mid">
                  <span className="flex items-center gap-1"><span className="semaphore-dot semaphore-dot-ok" /> Favorevole</span>
                  <span className="flex items-center gap-1"><span className="semaphore-dot semaphore-dot-warn" /> Variabile</span>
                  <span className="flex items-center gap-1"><span className="semaphore-dot semaphore-dot-bad" /> Problematico</span>
                </div>
              </div>
            </GlowCard>
          </div>

          {/* VERDETTO + INDICATORI */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            <GlowCard tone={r.verdictTone} className="animate-fade-up p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-2xl",
                      r.verdictTone === "ok" && "bg-[rgba(34,224,108,0.15)] text-ok shadow-[0_0_20px_rgba(34,224,108,0.4)]",
                      r.verdictTone === "warn" && "bg-[rgba(255,200,31,0.15)] text-warn shadow-[0_0_20px_rgba(255,200,31,0.35)]",
                      r.verdictTone === "bad" && "bg-[rgba(255,77,94,0.15)] text-bad shadow-[0_0_20px_rgba(255,77,94,0.4)]",
                    )}
                  >
                    <Gamepad2 size={30} />
                  </span>
                  <div>
                    <div className={cn("font-display text-[26px] font-black uppercase tracking-[0.04em] md:text-[30px]", toneColor)}>
                      {r.verdict}
                    </div>
                    <div className="text-[13px] text-text-mid">
                      {game.name} · punteggio <CountUp value={r.overallScore} className="font-display font-bold text-text-hi" />/100
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-text-low" size={22} />
              </div>
              {r.indicative && (
                <p className="mt-3 rounded-lg bg-[rgba(255,200,31,0.08)] px-3 py-2 text-[12px] text-warn">
                  Valutazione indicativa: il dispositivo di test è diverso da quello di gioco.
                </p>
              )}
            </GlowCard>

            {/* 4 indicatori */}
            <div className="grid grid-cols-2 gap-3">
              {indicators.map((ind, i) => (
                <GlowCard key={ind.label} className="animate-fade-up p-4" style={{ animationDelay: `${0.1 + i * 0.06}s` }}>
                  <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-text-mid">
                    <ind.icon size={14} className="text-cyan" /> {ind.label}
                  </div>
                  <StatusChip status={ind.chip.status} label={ind.chip.label} />
                </GlowCard>
              ))}
              <GlowCard className="animate-fade-up p-4" style={{ animationDelay: "0.28s" }}>
                <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-text-mid">
                  <Users size={14} className="text-cyan" /> Rischio partita instabile
                </div>
                <div className="flex items-center justify-between">
                  <CountUp value={r.risk} suffix="%" className="font-display text-[26px] font-extrabold text-text-hi" />
                  <div className="flex flex-col items-end gap-1">
                    <StatusChip status={r.riskStatus} label={r.riskLabel} />
                    <SignalBars status={r.riskStatus} />
                  </div>
                </div>
              </GlowCard>
            </div>

            {/* miglior fascia */}
            <GlowCard tone="cyan" className="animate-fade-up flex items-center justify-between p-4" style={{ animationDelay: "0.34s" }}>
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-cyan" />
                <div>
                  <div className="text-[12px] font-semibold text-text-mid">Miglior fascia stimata</div>
                  <div className="font-display text-[17px] font-extrabold text-text-hi">{r.bestSlot}</div>
                </div>
              </div>
              <button onClick={() => navigate(`/server/${r.bestServerId}`)} className="text-[12px] font-semibold text-cyan hover:underline">
                Vedi orari →
              </button>
            </GlowCard>

            {/* AI advice */}
            <GlowCard className="animate-fade-up p-4" style={{ animationDelay: "0.4s" }}>
              <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-cyan">Consiglio</div>
              <p className="text-[15px] leading-relaxed text-text-hi">{r.advice}</p>
              <p className="mt-2 text-[11px] text-text-low">Affidabilità del test: {r.confidence}</p>
            </GlowCard>

            <button onClick={() => navigate("/test")} className="btn-secondary h-12 text-[14px]">
              <RotateCcw size={16} /> Ripeti il test
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
