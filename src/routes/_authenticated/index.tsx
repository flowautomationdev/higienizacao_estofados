import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchServicos, fetchRegras } from "@/lib/lavo/queries";
import { brl, calcReservas } from "@/lib/lavo/calc";
import {
  Wallet,
  PiggyBank,
  Fuel,
  TrendingUp,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react";
import { statusInfo, labelTipo } from "@/lib/lavo/tipos";

export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: servicos = [] } = useQuery({ queryKey: ["servicos"], queryFn: fetchServicos });
  const { data: regras = [] } = useQuery({ queryKey: ["regras"], queryFn: fetchRegras });

  const agora = new Date();
  const mesAtual = servicos.filter((s) => {
    const d = new Date(s.data_agendada);
    return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
  });
  const concluidosMes = mesAtual.filter((s) => s.status === "concluido");

  const faturamento = concluidosMes.reduce((sum, s) => sum + Number(s.valor || 0), 0);
  const reservasTotais = concluidosMes.reduce((sum, s) => {
    const r = calcReservas(Number(s.valor || 0), regras);
    return sum + r.reduce((a, b) => a + b.valor, 0);
  }, 0);
  const combustivel = concluidosMes.reduce(
    (sum, s) => sum + Number(s.custo_combustivel || 0),
    0,
  );
  const disponivel = faturamento - reservasTotais - combustivel;

  const agendados = servicos.filter(
    (s) => s.status === "agendado" || s.status === "em_andamento",
  ).length;
  const concluidosCount = servicos.filter((s) => s.status === "concluido").length;

  const proximos = servicos
    .filter((s) => s.status === "agendado" || s.status === "em_andamento")
    .sort(
      (a, b) =>
        new Date(a.data_agendada).getTime() - new Date(b.data_agendada).getTime(),
    )
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          {agora.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-0.5">
          Olá, bem-vindo de volta 👋
        </h1>
      </header>

      {/* Hero card: Disponível para retirada */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-card"
        style={{ background: "var(--gradient-brand)" }}>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/80 text-xs uppercase tracking-wider font-semibold">
            <TrendingUp className="h-3.5 w-3.5" /> Disponível para retirada
          </div>
          <div className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">
            {brl(disponivel)}
          </div>
          <p className="mt-2 text-sm text-white/70 max-w-md">
            Quanto da operação realmente pertence aos sócios — descontadas reservas e combustível.
          </p>
        </div>
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -right-6 -bottom-16 h-40 w-40 rounded-full bg-white/5" />
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard icon={Wallet} label="Faturamento do Mês" value={brl(faturamento)} tone="bright" />
        <KpiCard icon={PiggyBank} label="Total Reservado" value={brl(reservasTotais)} />
        <KpiCard icon={Fuel} label="Combustível Estimado" value={brl(combustivel)} />
        <KpiCard icon={CalendarCheck} label="Serviços Agendados" value={String(agendados)} />
        <KpiCard icon={CheckCircle2} label="Serviços Concluídos" value={String(concluidosCount)} />
      </div>

      {/* Próximos */}
      <section>
        <h2 className="text-lg font-bold mb-3">Próximos atendimentos</h2>
        <div className="space-y-2">
          {proximos.length === 0 && (
            <div className="bg-card border rounded-2xl p-6 text-center text-sm text-muted-foreground">
              Nenhum serviço agendado.
            </div>
          )}
          {proximos.map((s) => {
            const st = statusInfo(s.status);
            return (
              <div key={s.id} className="bg-card border rounded-2xl p-4 flex items-center justify-between shadow-card">
                <div>
                  <div className="font-semibold text-sm">
                    {(s as any).clientes?.nome ?? "Cliente"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {labelTipo(s.tipo_servico)} ·{" "}
                    {new Date(s.data_agendada).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm">{brl(Number(s.valor))}</span>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${st.tone}`}>
                    {st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone?: "bright";
}) {
  return (
    <div className="bg-card border rounded-2xl p-4 shadow-card">
      <div
        className={`inline-flex items-center justify-center h-9 w-9 rounded-xl mb-2 ${
          tone === "bright"
            ? "bg-[var(--brand-bright)]/10 text-[var(--brand-bright)]"
            : "bg-[var(--brand)]/10 text-[var(--brand)]"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-[11px] text-muted-foreground font-medium leading-tight">{label}</div>
      <div className="text-lg font-bold mt-1">{value}</div>
    </div>
  );
}