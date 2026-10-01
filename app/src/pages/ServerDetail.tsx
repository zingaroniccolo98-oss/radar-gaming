import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { ChevronLeft, Clock, Server as ServerIcon, ShieldCheck, Trophy } from "lucide-react";
import AppShell from "@/components/AppShell";
import CountUp from "@/components/CountUp";
import GlowCard from "@/components/GlowCard";
import StatusChip, { SignalBars } from "@/components/StatusChip";
import { getServer, serverStatusAt } from "@/data/servers";
import { computeSlots } from "@/engine";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

// DETTAGLIO SERVER — mockup schermata 4: città, stato, fasce orarie,
// raccomandazione finale. Solo info utili, mai dati tecnici inutili.

export default function ServerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lastInput } = useStore();
  const server = getServer(id ?? "milano");
  const now = new Date();
  const hour = now.getHours();
  const userPing = lastInput?.pingMs ?? 20;

  const now_ = useMemo(() => serverStatusAt(server, hour, userPing), [server, hour, userPing]);
  const { slots, bestSlot } = useMemo(() => computeSlots(hour), [hour]);

  const good = now_.status === "ok";

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl py-6">
        <button onClick={() => navigate("/risultato")} className="mb-4 flex items-center gap-1 text-[14px] font-semibold text-text-mid hover:text-text-hi">
          <ChevronLeft size={18} /> Torna alla mappa
        </button>

        {/* hero città */}
        <div className="relative overflow-hidden rounded-[20px] border border-[var(--border-glow)]">
          <img src={server.photo ?? "/city-night.png"} alt={`${server.city} di notte`} className="h-44 w-full object-cover md:h-56" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-abyss)] via-transparent to-transparent" />
          <div className="absolute bottom-4 left-5 flex items-center gap-3">
            <span className={cn("semaphore-dot !h-4 !w-4", `semaphore-dot-${now_.status}`)} />
            <h1 className="font-display text-3xl font-extrabold text-text-hi md:text-4xl">{server.city}</h1>
          </div>
        </div>

        {/* status card */}
        <GlowCard tone={now_.status} className="animate-fade-up mt-4 flex items-center justify-between p-5">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(34,216,255,0.1)] text-cyan">
              <ServerIcon size={24} />
            </span>
            <div>
              <div className="font-display text-xl font-extrabold text-text-hi">{now_.word}</div>
              <div className="text-[15px] text-text-mid">
                <CountUp value={now_.ping} className="font-display font-extrabold text-text-hi" /> <span className="text-[13px]">ms</span> · stabilità {good ? "alta" : "variabile"}
              </div>
            </div>
          </div>
          <SignalBars status={now_.status} />
        </GlowCard>

        {/* fasce orarie */}
        <GlowCard className="animate-fade-up mt-4 p-5" style={{ animationDelay: "0.08s" }}>
          <div className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-text-mid">
            <Clock size={15} className="text-cyan" /> Fasce orarie
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
            {slots.map((s) => (
              <div
                key={s.label}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-3",
                  s.status === "ok" && "border-[rgba(34,224,108,0.45)] bg-[rgba(34,224,108,0.08)]",
                  s.status === "warn" && "border-[rgba(255,200,31,0.35)] bg-[rgba(255,200,31,0.06)]",
                  s.status === "bad" && "border-[rgba(255,77,94,0.35)] bg-[rgba(255,77,94,0.06)]",
                )}
              >
                <span className="text-[12px] font-semibold text-text-hi">{s.label}</span>
                <SignalBars status={s.status} />
                <StatusChip status={s.status} label={s.word} className="!px-2 !py-0.5 !text-[10px]" />
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] text-text-low">
            Stima basata sui pattern di congestione tipici: non è una certezza, ma una previsione. Miglior fascia:{" "}
            <span className="font-semibold text-ok">{bestSlot}</span>
          </p>
        </GlowCard>

        {/* raccomandazione */}
        <GlowCard tone={good ? "ok" : "warn"} className="animate-fade-up mt-4 flex items-center gap-4 p-5" style={{ animationDelay: "0.14s" }}>
          <span
            className={cn(
              "flex h-14 w-14 flex-none items-center justify-center rounded-2xl",
              good ? "bg-[rgba(34,224,108,0.15)] text-ok shadow-[0_0_20px_rgba(34,224,108,0.4)]" : "bg-[rgba(255,200,31,0.15)] text-warn",
            )}
          >
            <Trophy size={28} />
          </span>
          <div>
            <div className="font-display text-[17px] font-extrabold text-text-hi">
              {good ? "Buon momento per giocare" : "Condizioni variabili su questo server"}
            </div>
            <p className="mt-0.5 text-[13px] leading-relaxed text-text-mid">
              {good
                ? `${server.city} risponde benissimo in questo momento. Se il gioco ti fa scegliere la regione, questa è tra le migliori.`
                : `Su ${server.city} la congestione è più alta del solito. Controlla le fasce orarie qui sopra o guarda gli altri nodi sulla mappa.`}
            </p>
          </div>
        </GlowCard>

        {/* affidabilità dato */}
        <div className="mt-4 flex items-center gap-2 text-[12px] text-text-low">
          <ShieldCheck size={14} className="text-cyan" />
          Affidabilità dato: {server.confidence} · fonte {server.sourceType === "official" ? "ufficiale" : "osservata"} · {server.provider}
        </div>
      </div>
    </AppShell>
  );
}
