import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Activity, ArrowDown, ArrowUp, Cable, Check, ChevronLeft, HelpCircle, Info, Server, Wifi, Zap } from "lucide-react";
import AppShell from "@/components/AppShell";
import GlowCard from "@/components/GlowCard";
import ProgressRing from "@/components/ProgressRing";
import { getGame } from "@/data/games";
import { evaluate, simulateAutoTest } from "@/engine";
import { useStore } from "@/store";
import type { ConnectionType, TestInput } from "@/lib/types";
import { cn } from "@/lib/utils";

// ============================================================
// TEST CONNESSIONE — due strade mai bloccanti:
//  A) input manuale Download/Upload (dai valori del test console)
//  B) test automatico con anello % (mockup schermata 2)
// Il selettore cavo/Wi-Fi del dispositivo di test è OPZIONALE
// e alimenta solo il confidence score (regola utente).
// ============================================================

const CONN_OPTIONS: Array<{ id: ConnectionType; label: string; icon: typeof Wifi }> = [
  { id: "lan", label: "Cavo Ethernet", icon: Cable },
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
  { id: "unknown", label: "Non lo so", icon: HelpCircle },
];

const PHASES = [
  { id: "ping", label: "Ping", icon: Zap, readout: "Misura latenza… 18 ms" },
  { id: "stab", label: "Stabilità", icon: Activity, readout: "Jitter 3 ms · Perdita pacchetti 0%" },
  { id: "server", label: "Server", icon: Server, readout: "Risposta Milano 16 ms · Francoforte 38 ms" },
];

function reliabilityOf(source: "manual" | "auto", conn: ConnectionType, sameDevice: boolean): { word: string; bars: number; note?: string } {
  if (source === "manual") return { word: "Alta", bars: 3 };
  if (conn === "lan" && sameDevice) return { word: "Alta", bars: 3 };
  if (conn === "lan" || (conn === "wifi" && sameDevice)) return { word: "Media", bars: 2 };
  if (conn === "wifi") return { word: "Media", bars: 2, note: "connessione diversa da quella di gioco: margine di errore più ampio" };
  return { word: "Bassa", bars: 1, note: "tipo di rete sconosciuto: la valutazione sarà indicativa" };
}

export default function Test() {
  const navigate = useNavigate();
  const { selectedGameId, onboarding, lastInput, saveTest } = useStore();
  const game = getGame(selectedGameId);

  const [mode, setMode] = useState<"input" | "auto">("input");
  const [download, setDownload] = useState(lastInput?.source === "manual" ? String(lastInput.downloadMbps) : "");
  const [upload, setUpload] = useState(lastInput?.source === "manual" ? String(lastInput.uploadMbps) : "");
  // S1b: optional, pre-filled from onboarding answer.
  const [testConn, setTestConn] = useState<ConnectionType>(onboarding.connection ?? "unknown");
  const [sameDevice, setSameDevice] = useState(false);

  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState(false);
  const timers = useRef<number[]>([]);

  const dl = parseFloat(download) || 0;
  const up = parseFloat(upload) || 0;
  const canAnalyze = dl > 0 || up > 0;

  const reliability = useMemo(
    () => reliabilityOf(mode === "auto" ? "auto" : "manual", testConn, sameDevice),
    [mode, testConn, sameDevice],
  );

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const finish = (input: TestInput) => {
    const result = evaluate(input, game);
    saveTest(input, result);
    navigate("/risultato");
  };

  const analyzeManual = () => {
    // Fast simulated analysis (900ms) — engine runs on real typed values.
    const input: TestInput = {
      source: "manual",
      downloadMbps: dl || up * 8,
      uploadMbps: up || Math.max(1, Math.round(dl / 10)),
      pingMs: testConn === "lan" ? 14 + Math.random() * 6 : 18 + Math.random() * 12,
      jitterMs: testConn === "lan" ? 2 + Math.random() * 3 : 5 + Math.random() * 10,
      packetLossPct: testConn === "lan" ? Math.random() * 0.2 : Math.random() * 0.8,
      testDeviceConnection: testConn,
      sameDevice: true, // manual values come from the gaming device's own test
    };
    setMode("auto");
    setProgress(0);
    runRing(1400, () => finish(input));
  };

  const startAuto = () => {
    setMode("auto");
    setProgress(0);
    setPhase(0);
    setDone(false);
    runRing(8000, () => {
      const measured = simulateAutoTest(testConn);
      finish({ source: "auto", ...measured, testDeviceConnection: testConn, sameDevice });
    });
  };

  function runRing(duration: number, onDone: () => void) {
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      // eased: fast to 34%, crawl 35–70%, burst to 100%
      const eased = p < 0.3 ? (p / 0.3) * 0.34 : p < 0.8 ? 0.34 + ((p - 0.3) / 0.5) * 0.36 : 0.7 + ((p - 0.8) / 0.2) * 0.3;
      setProgress(eased * 100);
      setPhase(p < 0.4 ? 0 : p < 0.75 ? 1 : 2);
      if (p < 1) {
        timers.current.push(window.setTimeout(() => requestAnimationFrame(tick), 16));
      } else {
        setDone(true);
        timers.current.push(window.setTimeout(onDone, 700));
      }
    };
    requestAnimationFrame(tick);
  }

  const abort = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setMode("input");
    setProgress(0);
    setDone(false);
  };

  return (
    <AppShell hideNav={mode === "auto"}>
      {mode === "input" ? (
        <div className="mx-auto max-w-2xl py-8">
          {/* S1 header */}
          <div className="animate-fade-up">
            <span className="eyebrow">Passo 2 · Test della connessione</span>
            <h1 className="font-display mt-2 text-3xl font-extrabold text-text-hi md:text-4xl">Test della tua connessione</h1>
            <p className="mt-2 text-[15px] text-text-mid">Misuriamo le prestazioni in pochi secondi.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/giochi")}
                className="status-chip border-[rgba(34,216,255,0.4)] bg-[rgba(34,216,255,0.1)] text-cyan"
              >
                {game.name} · cambia
              </button>
            </div>
          </div>

          {/* S1b — test-device connection (OPTIONAL, non-blocking) */}
          <div className="animate-fade-up mt-7" style={{ animationDelay: "0.08s" }}>
            <div className="mb-1.5 text-[13px] font-semibold text-text-mid">Questo dispositivo è connesso via…</div>
            <div className="mb-2 text-[11px] text-text-low">Serve a pesare il risultato, puoi anche saltarlo.</div>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Tipo di connessione del dispositivo di test">
              {CONN_OPTIONS.map((o) => {
                const active = testConn === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => setTestConn(o.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] border bg-surface2 px-2 text-[12px] font-semibold transition-all sm:text-[13px]",
                      active
                        ? "border-[rgba(34,216,255,0.6)] bg-[rgba(34,216,255,0.12)] text-cyan shadow-[0_0_14px_rgba(34,216,255,0.25)]"
                        : "border-[var(--border-soft)] text-text-mid hover:text-text-hi",
                    )}
                  >
                    <o.icon size={16} />
                    {o.label}
                  </button>
                );
              })}
            </div>
            {testConn === "wifi" && onboarding.connection === "lan" && (
              <p className="mt-2 text-[12px] text-warn">La tua console è via cavo ma stai testando in Wi-Fi: i valori di gioco potrebbero essere migliori.</p>
            )}
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13px] text-text-mid">
              <input
                type="checkbox"
                checked={sameDevice}
                onChange={(e) => setSameDevice(e.target.checked)}
                className="h-4 w-4 accent-[#22D8FF]"
              />
              Sto testando dallo stesso dispositivo con cui gioco
            </label>
          </div>

          {/* S2 manual input */}
          <GlowCard tone="cyan" className="animate-fade-up mt-6 p-5" style={{ animationDelay: "0.14s" }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-text-mid">
                  <ArrowDown size={15} className="text-cyan" /> Download
                </div>
                <div className="input-inset flex items-baseline gap-2 px-4 py-3">
                  <input
                    value={download}
                    onChange={(e) => setDownload(e.target.value.replace(/[^0-9.]/g, ""))}
                    inputMode="decimal"
                    placeholder="200"
                    aria-label="Download in Mbps"
                    className="font-display w-full bg-transparent text-[32px] font-extrabold text-text-hi outline-none placeholder:text-text-low"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  />
                  <span className="text-[13px] font-medium text-text-low">Mbps</span>
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-text-mid">
                  <ArrowUp size={15} className="text-cyan" /> Upload
                </div>
                <div className="input-inset flex items-baseline gap-2 px-4 py-3">
                  <input
                    value={upload}
                    onChange={(e) => setUpload(e.target.value.replace(/[^0-9.]/g, ""))}
                    inputMode="decimal"
                    placeholder="30"
                    aria-label="Upload in Mbps"
                    className="font-display w-full bg-transparent text-[32px] font-extrabold text-text-hi outline-none placeholder:text-text-low"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  />
                  <span className="text-[13px] font-medium text-text-low">Mbps</span>
                </div>
              </div>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-relaxed text-text-low">
              <Info size={13} className="mt-0.5 flex-none" />
              Li trovi in Impostazioni → Rete → Verifica connessione sulla tua console.
              {dl > 0 && up === 0 && <span className="text-cyan">&nbsp;Upload stimato dal rapporto tipico 10:1.</span>}
            </p>
          </GlowCard>

          {/* S3 divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--border-soft)]" />
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-text-low">oppure</span>
            <div className="h-px flex-1 bg-[var(--border-soft)]" />
          </div>

          {/* S4 auto test */}
          <button onClick={startAuto} className="btn-secondary h-[52px] w-full text-[14px]">
            <Zap size={17} />
            Non li conosco · Usa test automatico
          </button>

          {/* S5 reliability note */}
          <GlowCard className="animate-fade-up mt-6 p-4" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-start gap-3">
              <Info size={18} className="mt-0.5 flex-none text-cyan" />
              <div className="text-[13px] leading-relaxed text-text-mid">
                <span className="font-semibold text-text-hi">Affidabilità: </span>
                il test è più preciso se lo esegui dallo stesso dispositivo con cui giochi. Se usi un altro dispositivo, il verdetto terrà conto di un margine di errore.
                {reliability.note && <span className="mt-1 block text-warn">{reliability.note}</span>}
                <span className="mt-2 flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-text-hi">{reliability.word}</span>
                  <span className="flex gap-1" aria-hidden>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className={cn("h-2.5 w-5 rounded-sm", i < reliability.bars ? "bg-cyan shadow-[0_0_6px_rgba(34,216,255,0.6)]" : "bg-surface2")}
                      />
                    ))}
                  </span>
                </span>
              </div>
            </div>
          </GlowCard>

          {/* S6 CTA */}
          <button
            onClick={analyzeManual}
            disabled={!canAnalyze}
            className="btn-primary mt-7 h-14 w-full text-[15px]"
            style={!canAnalyze ? { opacity: 0.35, pointerEvents: "none" } : undefined}
          >
            Analizza la mia connessione
            <Check size={18} />
          </button>
          {!canAnalyze && <p className="mt-2 text-center text-[12px] text-text-low">Inserisci almeno un valore, oppure usa il test automatico.</p>}
        </div>
      ) : (
        /* STATE B — automatic test in corso (mockup schermata 2) */
        <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] max-w-xl flex-col items-center justify-center py-8">
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-cover bg-bottom opacity-25"
            style={{ backgroundImage: "url(/earth-hero.png)" }}
            aria-hidden
          />
          <button onClick={abort} className="absolute left-0 top-6 flex items-center gap-1 text-[14px] font-semibold text-text-mid hover:text-text-hi">
            <ChevronLeft size={18} /> Indietro
          </button>
          <span className="absolute right-0 top-6 status-chip border-[rgba(34,216,255,0.4)] bg-[rgba(34,216,255,0.1)] text-cyan">{game.name}</span>

          <ProgressRing progress={progress} done={done} size={300} />

          {/* phases */}
          <div className="mt-10 flex w-full max-w-sm items-start justify-between">
            {PHASES.map((p, i) => {
              const state = done || i < phase ? "done" : i === phase ? "active" : "pending";
              return (
                <div key={p.id} className="relative flex flex-1 flex-col items-center gap-2">
                  {i > 0 && (
                    <div
                      className={cn(
                        "absolute left-[-50%] right-[50%] top-[22px] h-0.5 transition-colors duration-500",
                        state !== "pending" ? "bg-cyan" : "bg-surface2",
                      )}
                      aria-hidden
                    />
                  )}
                  <div
                    className={cn(
                      "z-10 flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-500",
                      state === "done" && "border-[rgba(34,224,108,0.6)] bg-[rgba(34,224,108,0.15)] text-ok",
                      state === "active" && "border-[rgba(34,216,255,0.7)] bg-[rgba(34,216,255,0.15)] text-cyan shadow-[0_0_16px_rgba(34,216,255,0.5)]",
                      state === "pending" && "border-[var(--border-soft)] bg-surface2 text-text-low",
                    )}
                  >
                    {state === "done" ? <Check size={18} /> : <p.icon size={18} className={state === "active" ? "animate-[node-pulse_1s_ease-in-out_infinite]" : ""} />}
                  </div>
                  <span className={cn("text-[12px] font-semibold", state === "pending" ? "text-text-low" : "text-text-hi")}>{p.label}</span>
                  {state === "active" && !done && <span className="text-[11px] text-text-mid">{p.readout}</span>}
                </div>
              );
            })}
          </div>

          <GlowCard className="mt-10 w-full max-w-sm p-4 text-center">
            <p className="text-[13px] text-text-mid">Puoi uscire quando vuoi: salveremo i dati parziali e completeremo con stime.</p>
            <button onClick={abort} className="mt-2 text-[13px] font-semibold text-text-low underline-offset-4 hover:underline">
              Annulla test
            </button>
          </GlowCard>
        </div>
      )}
    </AppShell>
  );
}
