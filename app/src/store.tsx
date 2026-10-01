import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { EngineResult, HistoryEntry, OnboardingAnswers, TestInput } from "@/lib/types";

// ============================================================
// Demo store — persisted to localStorage.
// In production: replaced by Supabase Auth + Postgres tables
// (profiles, tests, results, history). Anonymous users keep
// local-only data, exactly like here.
// ============================================================

interface StoreState {
  onboarding: OnboardingAnswers;
  selectedGameId: string | null;
  lastInput: TestInput | null;
  lastResult: EngineResult | null;
  history: HistoryEntry[];
  setOnboarding: (o: Partial<OnboardingAnswers>) => void;
  selectGame: (id: string) => void;
  saveTest: (input: TestInput, result: EngineResult) => void;
  clearHistory: () => void;
}

const DEFAULT_ONBOARDING: OnboardingAnswers = { games: [], platform: null, connection: null, done: false };

const LS_KEY = "connection-radar-v1";

interface Persisted {
  onboarding: OnboardingAnswers;
  selectedGameId: string | null;
  lastInput: TestInput | null;
  lastResult: EngineResult | null;
  history: HistoryEntry[];
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Persisted;
      return {
        onboarding: p.onboarding ?? DEFAULT_ONBOARDING,
        selectedGameId: p.selectedGameId ?? null,
        lastInput: p.lastInput ?? null,
        lastResult: p.lastResult ?? null,
        history: Array.isArray(p.history) ? p.history : [],
      };
    }
  } catch {
    /* corrupted storage → start clean */
  }
  return { onboarding: DEFAULT_ONBOARDING, selectedGameId: null, lastInput: null, lastResult: null, history: seedHistory() };
}

/** A few believable past tests so the dashboard is alive on first visit. */
function seedHistory(): HistoryEntry[] {
  const now = Date.now();
  const mk = (id: string, gameId: string, hoursAgo: number, score: number, verdict: EngineResult["verdict"], risk: number): HistoryEntry => ({
    id,
    gameId,
    result: {
      gameId,
      connection: { status: score >= 70 ? "ok" : "warn", label: score >= 70 ? "Ottima" : "Variabile", score },
      server: { status: "ok", label: "Favorevoli", score: 78 },
      time: { status: "warn", label: "Nella media", score: 60 },
      risk,
      riskStatus: risk <= 30 ? "ok" : "warn",
      riskLabel: risk <= 30 ? "Basso" : "Medio",
      overallScore: score,
      verdict,
      verdictTone: verdict === "GIOCA ADESSO" ? "ok" : "warn",
      confidence: "media",
      indicative: false,
      bestSlot: "23 – 00:30",
      slots: [],
      advice: "",
      bestServerId: "milano",
      createdAt: now - hoursAgo * 3600_000,
      input: {
        source: "auto",
        downloadMbps: 180,
        uploadMbps: 28,
        pingMs: 18,
        jitterMs: 4,
        packetLossPct: 0.1,
        testDeviceConnection: "wifi",
        sameDevice: false,
      },
    },
  });
  return [
    mk("seed-1", "eafc", 3, 82, "GIOCA ADESSO", 22),
    mk("seed-2", "valorant", 26, 64, "PUOI GIOCARE", 41),
    mk("seed-3", "eafc", 49, 74, "GIOCA ADESSO", 28),
    mk("seed-4", "warzone", 76, 58, "PUOI GIOCARE", 47),
  ];
}

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {
      /* storage full/blocked — app keeps working in-memory */
    }
  }, [state]);

  const value = useMemo<StoreState>(
    () => ({
      ...state,
      setOnboarding: (o) => setState((s) => ({ ...s, onboarding: { ...s.onboarding, ...o } })),
      selectGame: (id) => setState((s) => ({ ...s, selectedGameId: id })),
      saveTest: (input, result) =>
        setState((s) => ({
          ...s,
          lastInput: input,
          lastResult: result,
          history: [{ id: `t-${result.createdAt}`, gameId: result.gameId, result }, ...s.history].slice(0, 20),
        })),
      clearHistory: () => setState((s) => ({ ...s, history: [] })),
    }),
    [state],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
