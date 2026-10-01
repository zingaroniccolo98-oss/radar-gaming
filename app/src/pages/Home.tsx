import { useNavigate } from "react-router";
import { ArrowRight, Zap } from "lucide-react";
import AppShell from "@/components/AppShell";
import GlowCard from "@/components/GlowCard";
import ServerMap from "@/components/ServerMap";
import { useStore } from "@/store";
import { useEffect } from "react";

const STEPS = ["Avvia il test", "Test connessione", "Risultato", "Dettaglio server"];

export default function Home() {
  const navigate = useNavigate();
  const { onboarding } = useStore();

  useEffect(() => {
    if (!onboarding.done) navigate("/onboarding", { replace: true });
  }, [onboarding.done, navigate]);

  return (
    <AppShell>
      {/* HERO — tutto in una viewport */}
      <section className="relative flex min-h-[calc(100dvh-4rem)] flex-col justify-center py-6">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-cover bg-bottom opacity-40"
          style={{
            backgroundImage: "url(/earth-hero.png)",
            maskImage: "linear-gradient(to top, black 30%, transparent 90%)",
            WebkitMaskImage: "linear-gradient(to top, black 30%, transparent 90%)",
          }}
          aria-hidden
        />
        <div className="grid items-center gap-6 lg:grid-cols-2">
          {/* testo + CTA */}
          <div className="animate-fade-up flex flex-col items-start gap-5">
            <span className="eyebrow">Connection Radar</span>
            <p className="font-display text-[28px] font-extrabold text-ok md:text-[36px]">niccolò</p>
            <h1 className="font-display text-[40px] font-extrabold leading-[1.05] tracking-[-0.02em] text-text-hi md:text-[60px]">
              È il momento giusto per <span className="text-brand drop-shadow-[0_0_18px_rgba(255,200,31,0.5)]">giocare?</span>
            </h1>
            <p className="max-w-md text-[15px] leading-relaxed text-text-mid md:text-[17px]">
              Controlla la tua connessione, le aree server e il momento migliore per entrare in partita.
            </p>
            <button onClick={() => navigate("/test")} className="btn-primary h-14 px-8 text-base md:h-16 md:px-10 md:text-lg">
              <Zap size={20} fill="currentColor" />
              Avvia il test
              <ArrowRight size={20} />
            </button>
            {/* step flow compatto */}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-text-low">
              {STEPS.map((s, i) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[rgba(46,124,255,0.5)] bg-[rgba(46,124,255,0.15)] font-display text-[10px] font-bold text-cyan">
                    {i + 1}
                  </span>
                  {s}
                  {i < STEPS.length - 1 && <span className="ml-1 text-text-low">›</span>}
                </span>
              ))}
            </div>
          </div>

          {/* mappa live */}
          <GlowCard className="animate-fade-up relative h-[42dvh] min-h-[300px] overflow-hidden lg:h-[62dvh]" style={{ animationDelay: "0.15s" }}>
            <ServerMap className="p-3" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-4 rounded-xl bg-[rgba(4,8,26,0.88)] px-3 py-2 text-[11px] font-semibold text-text-mid backdrop-blur-sm">
              <span className="flex items-center gap-1.5"><span className="semaphore-dot semaphore-dot-ok" /> Favorevole</span>
              <span className="flex items-center gap-1.5"><span className="semaphore-dot semaphore-dot-warn" /> Variabile</span>
              <span className="flex items-center gap-1.5"><span className="semaphore-dot semaphore-dot-bad" /> Problematico</span>
            </div>
          </GlowCard>
        </div>
      </section>
    </AppShell>
  );
}
