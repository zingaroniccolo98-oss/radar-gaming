import { useState } from "react";
import { useNavigate } from "react-router";
import { Cable, Check, Gamepad2, HelpCircle, Monitor, Router, Smartphone, Wifi } from "lucide-react";
import AppShell from "@/components/AppShell";
import GlowCard from "@/components/GlowCard";
import { GAMES } from "@/data/games";
import { useStore } from "@/store";
import type { ConnectionType, Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

// Onboarding estremamente breve (brief): 3 domande, sempre skippabile.

const PLATFORMS: Array<{ id: Platform; label: string; icon: typeof Monitor }> = [
  { id: "playstation", label: "PlayStation", icon: Gamepad2 },
  { id: "xbox", label: "Xbox", icon: Gamepad2 },
  { id: "pc", label: "PC", icon: Monitor },
  { id: "mobile", label: "Mobile", icon: Smartphone },
  { id: "nintendo", label: "Nintendo", icon: Gamepad2 },
  { id: "altro", label: "Altro", icon: HelpCircle },
];

const CONNECTIONS: Array<{ id: ConnectionType; label: string; icon: typeof Wifi }> = [
  { id: "lan", label: "Cavo LAN", icon: Cable },
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
  { id: "hotspot", label: "Hotspot", icon: Router },
  { id: "unknown", label: "Non lo so", icon: HelpCircle },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { onboarding, setOnboarding, selectGame } = useStore();
  const [step, setStep] = useState(0);
  const [games, setGames] = useState<string[]>(onboarding.games);

  const finish = (connection: ConnectionType | null, platform: Platform | null) => {
    setOnboarding({ games, platform, connection, done: true });
    if (games[0]) selectGame(games[0]);
    navigate("/", { replace: true });
  };

  const toggleGame = (id: string) => {
    setGames((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  };

  return (
    <AppShell hideNav>
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-2xl flex-col justify-center py-10">
        {/* progress */}
        <div className="mb-8 flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500",
                i <= step ? "bg-cyan shadow-[0_0_8px_rgba(34,216,255,0.6)]" : "bg-surface2",
              )}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="animate-fade-up">
            <span className="eyebrow">Benvenuto</span>
            <h1 className="font-display mt-2 text-3xl font-extrabold text-text-hi md:text-4xl">A cosa giochi?</h1>
            <p className="mt-2 text-[15px] text-text-mid">Scegli uno o più giochi: la valutazione dipende dal gioco selezionato.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {GAMES.map((g) => {
                const selected = games.includes(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleGame(g.id)}
                    className={cn(
                      "glow-card relative flex min-h-[92px] flex-col justify-end overflow-hidden p-3 text-left transition-transform active:scale-[0.97]",
                      selected && "glow-card-cyan",
                    )}
                    aria-pressed={selected}
                  >
                    <img src={g.tileImg} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,8,26,0.94)] via-[rgba(4,8,26,0.3)] to-transparent" />
                    {selected && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-cyan text-abyss">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                    <span className="font-display relative text-[13px] font-bold uppercase leading-tight tracking-wide text-text-hi">{g.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex items-center justify-between">
              <button onClick={() => finish(null, null)} className="text-[14px] font-semibold text-text-low underline-offset-4 hover:underline">
                Salta
              </button>
              <button onClick={() => setStep(1)} className="btn-primary h-12 px-7 text-[15px]" disabled={games.length === 0} style={games.length === 0 ? { opacity: 0.4 } : undefined}>
                Continua
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-up">
            <span className="eyebrow">Passo 2 di 3</span>
            <h1 className="font-display mt-2 text-3xl font-extrabold text-text-hi md:text-4xl">Da dove giochi?</h1>
            <p className="mt-2 text-[15px] text-text-mid">Console, PC o mobile: i consigli cambiano in base alla piattaforma.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PLATFORMS.map((p) => (
                <GlowCard key={p.id} className="transition-transform active:scale-[0.97]">
                  <button
                    className="flex min-h-[92px] w-full flex-col items-center justify-center gap-2 p-4"
                    onClick={() => {
                      setOnboarding({ platform: p.id });
                      setStep(2);
                    }}
                  >
                    <p.icon size={26} className="text-cyan" />
                    <span className="font-display text-[14px] font-bold text-text-hi">{p.label}</span>
                  </button>
                </GlowCard>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-between">
              <button onClick={() => setStep(0)} className="text-[14px] font-semibold text-text-low underline-offset-4 hover:underline">
                Indietro
              </button>
              <button onClick={() => finish(null, null)} className="text-[14px] font-semibold text-text-low underline-offset-4 hover:underline">
                Salta
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up">
            <span className="eyebrow">Ultimo passo</span>
            <h1 className="font-display mt-2 text-3xl font-extrabold text-text-hi md:text-4xl">Come giochi?</h1>
            <p className="mt-2 text-[15px] text-text-mid">Il tipo di rete pesa molto sulla stabilità: ce ne serviamo per i consigli.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {CONNECTIONS.map((c) => (
                <GlowCard key={c.id} className="transition-transform active:scale-[0.97]">
                  <button
                    className="flex min-h-[92px] w-full flex-col items-center justify-center gap-2 p-4"
                    onClick={() => finish(c.id, onboarding.platform)}
                  >
                    <c.icon size={26} className="text-cyan" />
                    <span className="font-display text-[14px] font-bold text-text-hi">{c.label}</span>
                  </button>
                </GlowCard>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-between">
              <button onClick={() => setStep(1)} className="text-[14px] font-semibold text-text-low underline-offset-4 hover:underline">
                Indietro
              </button>
              <button onClick={() => finish(null, onboarding.platform)} className="text-[14px] font-semibold text-text-low underline-offset-4 hover:underline">
                Salta
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
