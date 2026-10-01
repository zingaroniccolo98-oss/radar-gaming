import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { BarChart3, Gamepad2, Menu, Server } from "lucide-react";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";

// ============================================================
// App shell: starfield background, header, desktop top nav,
// mobile bottom nav (mockup) with safe-area. Capacitor-ready.
// ============================================================

const TABS = [
  { id: "connessione", label: "Connessione", icon: Gamepad2, path: "/", match: ["/", "/test", "/giochi", "/onboarding"] },
  { id: "server", label: "Server", icon: Server, path: "/risultato", match: ["/risultato", "/server"] },
  { id: "condizioni", label: "Condizioni reali", icon: BarChart3, path: "/dashboard", match: ["/dashboard"] },
];

function isActive(match: string[], pathname: string): boolean {
  return match.some((m) => (m === "/" ? pathname === "/" : pathname.startsWith(m)));
}

export default function AppShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-dvh bg-abyss">
      {/* background layers */}
      <div className="starfield pointer-events-none fixed inset-0" aria-hidden />
      <div className="planet-glow pointer-events-none fixed inset-0" aria-hidden />

      {/* header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border-soft)] bg-[rgba(4,8,26,0.82)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5">
          <Link to="/" aria-label="Connection Radar — home">
            <Logo />
          </Link>
          {/* desktop nav */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigazione principale">
            {TABS.map((t) => {
              const active = isActive(t.match, pathname);
              return (
                <button
                  key={t.id}
                  onClick={() => navigate(t.path)}
                  className={cn(
                    "font-display flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold uppercase tracking-wider transition-colors",
                    active ? "bg-[rgba(34,216,255,0.1)] text-cyan" : "text-text-mid hover:text-text-hi",
                  )}
                >
                  <t.icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </nav>
          <button className="rounded-lg p-2 text-text-mid hover:text-text-hi md:hidden" aria-label="Menu">
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* content */}
      <main className={cn("relative mx-auto w-full max-w-[1180px] px-5", !hideNav && "pb-28 md:pb-12")}>{children}</main>

      {/* mobile bottom nav */}
      {!hideNav && (
        <nav
          className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border-soft)] bg-[rgba(4,8,26,0.92)] backdrop-blur-md md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="Navigazione principale"
        >
          <div className="mx-auto flex max-w-md items-stretch justify-around">
            {TABS.map((t) => {
              const active = isActive(t.match, pathname);
              return (
                <button
                  key={t.id}
                  onClick={() => navigate(t.path)}
                  className="relative flex min-h-[64px] min-w-[88px] flex-col items-center justify-center gap-1"
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <span className="absolute top-0 h-1 w-8 rounded-full bg-cyan shadow-[0_0_10px_rgba(34,216,255,0.8)]" aria-hidden />
                  )}
                  <t.icon size={22} className={active ? "text-cyan" : "text-text-low"} />
                  <span className={cn("text-[11px] font-semibold", active ? "text-cyan" : "text-text-low")}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
