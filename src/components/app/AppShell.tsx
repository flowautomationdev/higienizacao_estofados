import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Wrench,
  Settings,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/hooks/use-theme";

const LOGO_URL = "https://upptcyqsfjlproclqemt.supabase.co/storage/v1/object/public/LOGO%20SISTEM/logo-LAVO.jpeg";

const nav: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/", label: "Início", icon: LayoutDashboard, exact: true },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/servicos", label: "Serviços", icon: Wrench },
  { to: "/configuracoes", label: "Config.", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { theme, toggle } = useTheme();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Até logo!");
    navigate({ to: "/auth", replace: true });
  }

  const isActive = (to: string, exact?: boolean) =>
    exact ? loc.pathname === to : loc.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-[var(--brand)] text-primary-foreground p-5 gap-1 z-30">
        <div className="flex items-center gap-3 mb-6">
          <img src={LOGO_URL} alt="" className="h-11 w-11 rounded-xl object-cover ring-2 ring-white/20" />
          <div>
            <div className="font-bold text-base leading-tight">Lavô! Manager</div>
            <div className="text-[11px] opacity-70 italic">novo de novo</div>
          </div>
        </div>
        {nav.map((n) => {
          const active = isActive(n.to, n.exact);
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {n.label === "Início" ? "Dashboard" : n.label === "Config." ? "Configurações" : n.label}
            </Link>
          );
        })}
        <button
          onClick={toggle}
          className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition"
          aria-label="Alternar tema"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Tema claro" : "Tema escuro"}
        </button>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-[var(--brand)] text-primary-foreground px-4 py-3 flex items-center justify-between shadow-card">
        <div className="flex items-center gap-2.5">
          <img src={LOGO_URL} alt="" className="h-9 w-9 rounded-lg object-cover ring-2 ring-white/20" />
          <div>
            <div className="font-bold text-sm leading-none">Lavô!</div>
            <div className="text-[10px] opacity-70 italic">novo de novo</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            aria-label="Alternar tema"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            aria-label="Sair"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 md:ml-64 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-5 md:py-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t shadow-card pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {nav.map((n) => {
            const active = isActive(n.to, n.exact);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition ${
                  active ? "text-[var(--brand-bright)]" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "scale-110" : ""} transition-transform`} />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}