import { useNavigate } from "react-router";
import { Check, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import { GAMES } from "@/data/games";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

const PLATFORM_LABEL: Record<string, string> = {
  playstation: "PS",
  xbox: "Xbox",
  pc: "PC",
  mobile: "Mobile",
  nintendo: "Switch",
};

export default function GameSelect() {
  const navigate = useNavigate();
  const { selectedGameId, selectGame } = useStore();
  const [query, setQuery] = useState("");

  const filtered = GAMES.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl py-8">
        <span className="eyebrow">Passo 1</span>
        <h1 className="font-display mt-2 text-3xl font-extrabold text-text-hi md:text-4xl">Seleziona il gioco</h1>
        <p className="mt-2 text-[15px] text-text-mid">La valutazione dipende dal gioco: ogni titolo ha sensibilità diverse a ping, jitter e perdita pacchetti.</p>

        {/* search */}
        <div className="input-inset mt-6 flex items-center gap-2 px-4">
          <Search size={18} className="text-text-low" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca un gioco…"
            className="h-12 w-full bg-transparent text-[15px] text-text-hi outline-none placeholder:text-text-low"
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((g, i) => {
            const selected = selectedGameId === g.id;
            return (
              <button
                key={g.id}
                onClick={() => selectGame(g.id)}
                className={cn(
                  "glow-card animate-fade-up group relative flex min-h-[120px] flex-col justify-end overflow-hidden p-4 text-left transition-transform active:scale-[0.97]",
                  selected && "glow-card-cyan",
                )}
                style={{ animationDelay: `${i * 0.04}s` }}
                aria-pressed={selected}
              >
                <img src={g.tileImg} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,8,26,0.94)] via-[rgba(4,8,26,0.3)] to-transparent" />
                {selected && (
                  <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-cyan text-abyss">
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
                <div className="relative">
                  <div className="font-display text-[14px] font-bold uppercase leading-tight tracking-wide text-text-hi">{g.name}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {g.platforms.slice(0, 3).map((p) => (
                      <span key={p} className="rounded-full bg-[rgba(120,160,255,0.12)] px-1.5 py-0.5 text-[10px] font-semibold text-text-mid">
                        {PLATFORM_LABEL[p] ?? p}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="mt-8 text-center text-[15px] text-text-mid">
            Il gioco non c'è ancora? Nessun problema: puoi fare il test con una valutazione generica.
          </p>
        )}

        {/* sticky CTA */}
        <div className="sticky bottom-24 z-10 mt-8 flex justify-center md:bottom-6">
          <button
            onClick={() => navigate("/test")}
            className="btn-primary h-13 px-8 py-3.5 text-[15px]"
          >
            {selectedGameId ? "Continua con " + (GAMES.find((g) => g.id === selectedGameId)?.name ?? "il gioco") : "Continua senza gioco"}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
