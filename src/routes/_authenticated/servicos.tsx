import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchClientes,
  fetchConfig,
  fetchRegras,
  fetchServicos,
} from "@/lib/lavo/queries";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Fuel, PiggyBank, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  STATUS_SERVICO,
  TIPOS_SERVICO,
  labelTipo,
  statusInfo,
} from "@/lib/lavo/tipos";
import { fullAddressFromCep, distanciaPorRotaOpenRoute } from "@/lib/lavo/geo";
import {
  brl,
  calcCombustivel,
  calcDisponivel,
  calcReservas,
  formatCep,
} from "@/lib/lavo/calc";

export const Route = createFileRoute("/_authenticated/servicos")({
  component: Servicos,
});

function Servicos() {
  const { data = [] } = useQuery({ queryKey: ["servicos"], queryFn: fetchServicos });
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Serviços</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEdit(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-[var(--brand)] hover:bg-[var(--brand)]/90 rounded-xl h-10">
              <Plus className="h-4 w-4 mr-1" /> Novo
            </Button>
          </DialogTrigger>
          <ServicoDialog initial={edit} onClose={() => { setOpen(false); setEdit(null); }} />
        </Dialog>
      </div>

      <div className="space-y-2">
        {data.length === 0 && (
          <div className="bg-card border rounded-2xl p-8 text-center text-sm text-muted-foreground">
            Cadastre o primeiro serviço.
          </div>
        )}
        {data.map((s: any) => (
          <ServicoCard key={s.id} s={s} onEdit={() => { setEdit(s); setOpen(true); }} />
        ))}
      </div>
    </div>
  );
}

function ServicoCard({ s, onEdit }: { s: any; onEdit: () => void }) {
  const qc = useQueryClient();
  const st = statusInfo(s.status);
  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("servicos").delete().eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos"] });
      toast.success("Serviço excluído");
    },
  });
  const setStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("servicos").update({ status: status as any }).eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicos"] }),
  });

  return (
    <div className="bg-card border rounded-2xl p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{s.clientes?.nome ?? "Cliente"}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {labelTipo(s.tipo_servico)} ·{" "}
            {new Date(s.data_agendada).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
            })}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Fuel className="h-3 w-3" /> {brl(Number(s.custo_combustivel))} ({Number(s.distancia_km).toFixed(1)} km)
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="font-bold">{brl(Number(s.valor))}</span>
          <Select value={s.status} onValueChange={(v) => setStatus.mutate(v)}>
            <SelectTrigger className={`h-7 text-[10px] px-2 rounded-full border-0 font-semibold w-auto ${st.tone}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_SERVICO.map((s2) => (
                <SelectItem key={s2.value} value={s2.value}>{s2.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-1 mt-2 pt-2 border-t">
        <Button variant="ghost" size="sm" onClick={onEdit} className="text-xs">
          <Pencil className="h-3 w-3 mr-1" /> Editar
        </Button>
        <Button variant="ghost" size="sm" className="text-xs text-destructive"
          onClick={() => { if (confirm("Excluir serviço?")) del.mutate(); }}>
          <Trash2 className="h-3 w-3 mr-1" /> Excluir
        </Button>
      </div>
    </div>
  );
}

function ServicoDialog({ initial, onClose }: { initial: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: clientes = [] } = useQuery({ queryKey: ["clientes"], queryFn: fetchClientes });
  const { data: config } = useQuery({ queryKey: ["config"], queryFn: fetchConfig });
  const { data: regras = [] } = useQuery({ queryKey: ["regras"], queryFn: fetchRegras });

  const [form, setForm] = useState({
    cliente_id: initial?.cliente_id ?? "",
    tipo_servico: initial?.tipo_servico ?? "sofa",
    valor: initial?.valor ?? 0,
    status: initial?.status ?? "agendado",
    data_agendada: initial?.data_agendada
      ? new Date(initial.data_agendada).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    cep: initial?.cep ?? "",
    endereco: initial?.endereco ?? "",
    observacoes: initial?.observacoes ?? "",
    destino_lat: initial?.destino_lat ?? null,
    destino_lng: initial?.destino_lng ?? null,
    distancia_km: initial?.distancia_km ?? 0,
    litros_estimados: initial?.litros_estimados ?? 0,
    custo_combustivel: initial?.custo_combustivel ?? 0,
  });
  const [loadingCep, setLoadingCep] = useState(false);

  // auto preencher cliente endereço
  function onSelectCliente(id: string) {
    const c = clientes.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      cliente_id: id,
      cep: c?.cep ? formatCep(c.cep) : f.cep,
      endereco: c?.endereco ?? f.endereco,
    }));
  }

  async function buscarRota() {
    if (!config?.latitude_sede || !config?.longitude_sede) {
      toast.error("Configure o CEP da sede em Configurações");
      return;
    }
    if (form.cep.replace(/\D/g, "").length !== 8) return;
    setLoadingCep(true);
    try {
      const r = await fullAddressFromCep(form.cep);
      if (!r.coords) throw new Error("Endereço não encontrado");

      const sedeLat = Number(config.latitude_sede);
      const sedeLng = Number(config.longitude_sede);
      const destLat = r.coords.lat;
      const destLng = r.coords.lng;

      console.log("[ROTA] Coordenadas sede:", sedeLat, sedeLng);
      console.log("[ROTA] Coordenadas destino:", destLat, destLng);

      if (!config.api_rotas) {
        throw new Error("Configure a chave da API de Rotas em Configurações");
      }

      const dist = await distanciaPorRotaOpenRoute(config.api_rotas, sedeLat, sedeLng, destLat, destLng);
      if (dist == null) throw new Error("Falha ao calcular rota. Verifique o CEP e tente novamente.");

      const c = calcCombustivel(dist, Number(config.consumo_medio_veiculo), Number(config.preco_combustivel));
      setForm((f) => ({
        ...f,
        endereco: r.logradouro || f.endereco,
        destino_lat: r.coords!.lat,
        destino_lng: r.coords!.lng,
        distancia_km: c.distanciaKm,
        litros_estimados: c.litros,
        custo_combustivel: c.custo,
      }));
      toast.success("Rota calculada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingCep(false);
    }
  }

  const reservas = useMemo(
    () => calcReservas(Number(form.valor || 0), regras),
    [form.valor, regras],
  );
  const disponivel = calcDisponivel(Number(form.valor || 0), reservas, Number(form.custo_combustivel || 0));

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        cliente_id: form.cliente_id,
        tipo_servico: form.tipo_servico,
        valor: Number(form.valor),
        status: form.status,
        data_agendada: new Date(form.data_agendada).toISOString(),
        cep: form.cep,
        endereco: form.endereco,
        observacoes: form.observacoes,
        origem_lat: config?.latitude_sede ?? null,
        origem_lng: config?.longitude_sede ?? null,
        destino_lat: form.destino_lat,
        destino_lng: form.destino_lng,
        distancia_km: Number(form.distancia_km),
        litros_estimados: Number(form.litros_estimados),
        custo_combustivel: Number(form.custo_combustivel),
      };
      let servicoId = initial?.id;
      if (initial) {
        const { error } = await supabase.from("servicos").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("servicos").insert(payload).select("id").single();
        if (error) throw error;
        servicoId = data.id;
      }
      // movimentações snapshot
      if (servicoId) {
        await supabase.from("movimentacoes").delete().eq("servico_id", servicoId);
        const movs = [
          ...reservas.map((r) => ({ servico_id: servicoId, categoria: r.categoria, valor: r.valor })),
          { servico_id: servicoId, categoria: "Combustível", valor: Number(form.custo_combustivel) },
        ];
        if (movs.length) await supabase.from("movimentacoes").insert(movs);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos"] });
      toast.success(initial ? "Serviço atualizado" : "Serviço criado");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
      <DialogHeader>
        <DialogTitle>{initial ? "Editar serviço" : "Novo serviço"}</DialogTitle>
      </DialogHeader>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        <div className="space-y-1.5">
          <Label>Cliente *</Label>
          <Select value={form.cliente_id} onValueChange={onSelectCliente}>
            <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
            <SelectContent>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={form.tipo_servico} onValueChange={(v) => setForm({ ...form, tipo_servico: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS_SERVICO.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.01" min="0" value={form.valor}
              onChange={(e) => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Data e hora</Label>
          <Input type="datetime-local" value={form.data_agendada}
            onChange={(e) => setForm({ ...form, data_agendada: e.target.value })} />
        </div>

        <div className="flex gap-2">
          <div className="flex-1 space-y-1.5">
            <Label>CEP</Label>
            <Input value={form.cep} onChange={(e) => setForm({ ...form, cep: formatCep(e.target.value) })} onBlur={buscarRota} />
          </div>
          <Button type="button" variant="outline" className="self-end h-10 rounded-xl" onClick={buscarRota} disabled={loadingCep}>
            {loadingCep ? "..." : "Calcular"}
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label>Endereço</Label>
          <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
        </div>

        <div className="space-y-1.5">
          <Label>Observações</Label>
          <Textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
        </div>

        {/* Preview financeiro */}
        <div className="bg-muted/40 rounded-xl p-3 space-y-2 text-xs">
          <div className="font-semibold flex items-center gap-1.5 text-foreground">
            <PiggyBank className="h-3.5 w-3.5" /> Distribuição
          </div>
          {reservas.map((r) => (
            <div key={r.categoria} className="flex justify-between">
              <span className="text-muted-foreground">{r.categoria} ({r.percentual}%)</span>
              <span className="font-medium">{brl(r.valor)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-1.5">
            <span className="text-muted-foreground flex items-center gap-1"><Fuel className="h-3 w-3" /> Combustível ({Number(form.distancia_km).toFixed(1)} km)</span>
            <span className="font-medium">{brl(Number(form.custo_combustivel))}</span>
          </div>
          <div className="flex justify-between border-t pt-1.5 text-sm">
            <span className="font-semibold flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-[var(--brand-bright)]" /> Disponível</span>
            <span className="font-bold text-[var(--brand-bright)]">{brl(disponivel)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={save.isPending || !form.cliente_id}
            className="bg-[var(--brand)] hover:bg-[var(--brand)]/90 w-full h-11 rounded-xl">
            {save.isPending ? "Salvando..." : "Salvar serviço"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}