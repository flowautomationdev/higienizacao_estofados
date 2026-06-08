import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchServicos } from "@/lib/lavo/queries";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { brl } from "@/lib/lavo/calc";
import { labelTipo, statusInfo } from "@/lib/lavo/tipos";

export const Route = createFileRoute("/_authenticated/agenda")({
  component: Agenda,
});

function Agenda() {
  const { data: servicos = [] } = useQuery({ queryKey: ["servicos"], queryFn: fetchServicos });
  const [view, setView] = useState<"dia" | "semana">("dia");
  const [base, setBase] = useState(() => startOfDay(new Date()));

  const range = view === "dia" ? [base] : weekDays(base);

  const byDay = (d: Date) =>
    servicos
      .filter((s) => sameDay(new Date(s.data_agendada), d))
      .sort((a, b) => new Date(a.data_agendada).getTime() - new Date(b.data_agendada).getTime());

  function shift(n: number) {
    const d = new Date(base);
    d.setDate(d.getDate() + n * (view === "dia" ? 1 : 7));
    setBase(d);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <div className="flex bg-muted rounded-xl p-1">
          <button onClick={() => setView("dia")} className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${view === "dia" ? "bg-card shadow" : ""}`}>Dia</button>
          <button onClick={() => setView("semana")} className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${view === "semana" ? "bg-card shadow" : ""}`}>Semana</button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-card border rounded-2xl p-3 shadow-card">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shift(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-semibold">
          {view === "dia"
            ? base.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
            : `${range[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${range[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shift(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {range.map((d) => {
          const list = byDay(d);
          return (
            <div key={d.toISOString()}>
              {view === "semana" && (
                <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2 px-1">
                  {d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" })}
                </div>
              )}
              <div className="space-y-2">
                {list.length === 0 && (
                  <div className="bg-card border rounded-2xl p-5 text-center text-xs text-muted-foreground">
                    Sem agendamentos.
                  </div>
                )}
                {list.map((s: any) => {
                  const st = statusInfo(s.status);
                  return (
                    <div key={s.id} className="bg-card border rounded-2xl p-3 flex items-center gap-3 shadow-card">
                      <div className="flex flex-col items-center bg-[var(--brand)]/5 rounded-xl px-2.5 py-2 min-w-14">
                        <Clock className="h-3 w-3 text-[var(--brand)] mb-0.5" />
                        <span className="text-xs font-bold text-[var(--brand)]">
                          {new Date(s.data_agendada).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{s.clientes?.nome ?? "Cliente"}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {labelTipo(s.tipo_servico)}
                          {s.endereco && (<span className="inline-flex items-center gap-1 ml-1"><MapPin className="h-3 w-3" /> {s.endereco}</span>)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-bold">{brl(Number(s.valor))}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${st.tone}`}>{st.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function weekDays(base: Date) {
  const start = startOfDay(base);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}