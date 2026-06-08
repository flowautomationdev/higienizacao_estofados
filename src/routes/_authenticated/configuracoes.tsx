import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchConfig, fetchRegras } from "@/lib/lavo/queries";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatCep } from "@/lib/lavo/calc";
import { fullAddressFromCep } from "@/lib/lavo/geo";
import { Building2, Fuel, Key, PiggyBank, Plus, Trash2, Mail, Copy, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: Configuracoes,
});

function Configuracoes() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <EmpresaSection />
      <RegrasSection />
      <ConvitesSection />
    </div>
  );
}

function EmpresaSection() {
  const qc = useQueryClient();
  const { data: config } = useQuery({ queryKey: ["config"], queryFn: fetchConfig });
  const [f, setF] = useState({
    nome_empresa: "", slogan: "", cep_sede: "", endereco_sede: "",
    latitude_sede: "" as string | number, longitude_sede: "" as string | number,
    consumo_medio_veiculo: 10, preco_combustivel: 6.5,
    api_rotas: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (config) {
      setF({
        nome_empresa: config.nome_empresa ?? "",
        slogan: config.slogan ?? "",
        cep_sede: config.cep_sede ?? "",
        endereco_sede: config.endereco_sede ?? "",
        latitude_sede: config.latitude_sede ?? "",
        longitude_sede: config.longitude_sede ?? "",
        consumo_medio_veiculo: Number(config.consumo_medio_veiculo) || 10,
        preco_combustivel: Number(config.preco_combustivel) || 6.5,
        api_rotas: config.api_rotas ?? "",
      });
    }
  }, [config]);

  async function buscarCep() {
    if ((f.cep_sede || "").replace(/\D/g, "").length !== 8) return;
    setLoading(true);
    try {
      const r = await fullAddressFromCep(f.cep_sede);
      setF((prev) => ({
        ...prev,
        endereco_sede: `${r.logradouro}, ${r.bairro}, ${r.localidade} - ${r.uf}`,
        latitude_sede: r.coords?.lat ?? prev.latitude_sede,
        longitude_sede: r.coords?.lng ?? prev.longitude_sede,
      }));
      toast.success("Endereço encontrado");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!config) return;
      const { error } = await supabase
        .from("configuracoes_empresa")
        .update({
          ...f,
          latitude_sede: f.latitude_sede === "" ? null : Number(f.latitude_sede),
          longitude_sede: f.longitude_sede === "" ? null : Number(f.longitude_sede),
          api_rotas: f.api_rotas || null,
        } as any)
        .eq("id", config.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["config"] });
      toast.success("Configurações salvas");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="bg-card border rounded-2xl p-5 shadow-card">
      <h2 className="font-bold flex items-center gap-2 mb-4"><Building2 className="h-4 w-4 text-[var(--brand)]" /> Empresa & Sede</h2>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={f.nome_empresa} onChange={(e) => setF({ ...f, nome_empresa: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Slogan</Label>
            <Input value={f.slogan} onChange={(e) => setF({ ...f, slogan: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 space-y-1.5">
            <Label>CEP da sede</Label>
            <Input value={f.cep_sede} onChange={(e) => setF({ ...f, cep_sede: formatCep(e.target.value) })} onBlur={buscarCep} />
          </div>
          <Button type="button" variant="outline" className="self-end h-10 rounded-xl" onClick={buscarCep} disabled={loading}>
            {loading ? "..." : "Buscar"}
          </Button>
        </div>
        <div className="space-y-1.5">
          <Label>Endereço da sede</Label>
          <Input value={f.endereco_sede} onChange={(e) => setF({ ...f, endereco_sede: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>Latitude</Label>
            <Input value={f.latitude_sede} onChange={(e) => setF({ ...f, latitude_sede: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Longitude</Label>
            <Input value={f.longitude_sede} onChange={(e) => setF({ ...f, longitude_sede: e.target.value })} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Key className="h-3.5 w-3.5 text-muted-foreground" /> Chave da API de Rotas</Label>
          <Input type="password" placeholder="OpenRouteService API key" value={f.api_rotas}
            onChange={(e) => setF({ ...f, api_rotas: e.target.value })} />
          <p className="text-[10px] text-muted-foreground">Deixe vazio para usar OSRM grátis (menos preciso). Obtenha em openrouteservice.org</p>
        </div>

        <div className="border-t pt-4 mt-2">
          <h3 className="font-semibold flex items-center gap-2 mb-3 text-sm"><Fuel className="h-4 w-4 text-[var(--brand-bright)]" /> Combustível</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Consumo (km/L)</Label>
              <Input type="number" step="0.1" value={f.consumo_medio_veiculo}
                onChange={(e) => setF({ ...f, consumo_medio_veiculo: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label>Preço (R$/L)</Label>
              <Input type="number" step="0.01" value={f.preco_combustivel}
                onChange={(e) => setF({ ...f, preco_combustivel: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
        </div>

        <Button onClick={() => save.mutate()} disabled={save.isPending}
          className="bg-[var(--brand)] hover:bg-[var(--brand)]/90 w-full h-11 rounded-xl">
          {save.isPending ? "Salvando..." : "Salvar empresa"}
        </Button>
      </div>
    </section>
  );
}

function RegrasSection() {
  const qc = useQueryClient();
  const { data: regras = [] } = useQuery({ queryKey: ["regras"], queryFn: fetchRegras });
  const [novo, setNovo] = useState({ nome: "", percentual: 5 });

  const total = regras.filter((r) => r.ativo).reduce((s, r) => s + Number(r.percentual), 0);

  const upsert = useMutation({
    mutationFn: async (r: { id?: string; nome: string; percentual: number; ativo: boolean }) => {
      if (r.id) {
        const { error } = await supabase.from("regras_financeiras").update(r).eq("id", r.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("regras_financeiras").insert({ ...r, ordem: regras.length + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["regras"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("regras_financeiras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["regras"] }),
  });

  return (
    <section className="bg-card border rounded-2xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-bold flex items-center gap-2"><PiggyBank className="h-4 w-4 text-[var(--brand)]" /> Reservas financeiras</h2>
        <span className="text-xs text-muted-foreground">Total: <span className="font-bold text-foreground">{total}%</span></span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Cada percentual é descontado automaticamente do faturamento.</p>

      <div className="space-y-2 mb-4">
        {regras.map((r) => (
          <div key={r.id} className="flex items-center gap-2 p-2 rounded-xl border bg-background">
            <Input className="flex-1 h-9" defaultValue={r.nome}
              onBlur={(e) => e.target.value !== r.nome &&
                upsert.mutate({ id: r.id, nome: e.target.value, percentual: Number(r.percentual), ativo: r.ativo })} />
            <div className="relative w-20">
              <Input type="number" step="0.5" min="0" max="100" className="h-9 pr-6" defaultValue={Number(r.percentual)}
                onBlur={(e) => {
                  const v = parseFloat(e.target.value);
                  if (v !== Number(r.percentual))
                    upsert.mutate({ id: r.id, nome: r.nome, percentual: v, ativo: r.ativo });
                }} />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
            </div>
            <Switch checked={r.ativo} onCheckedChange={(v) => upsert.mutate({ id: r.id, nome: r.nome, percentual: Number(r.percentual), ativo: v })} />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("Excluir?")) del.mutate(r.id); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2 p-3 rounded-xl bg-muted/40">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs">Nova categoria</Label>
          <Input className="h-9" placeholder="Ex: Impostos" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
        </div>
        <div className="w-20 space-y-1.5">
          <Label className="text-xs">%</Label>
          <Input type="number" step="0.5" className="h-9" value={novo.percentual} onChange={(e) => setNovo({ ...novo, percentual: parseFloat(e.target.value) || 0 })} />
        </div>
        <Button
          className="h-9 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand)]/90"
          onClick={() => {
            if (!novo.nome.trim()) return;
            upsert.mutate({ nome: novo.nome, percentual: novo.percentual, ativo: true });
            setNovo({ nome: "", percentual: 5 });
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-3 italic">
        A categoria "Combustível" é calculada automaticamente pelo sistema e não pode ser configurada manualmente.
      </p>
    </section>
  );
}

function ConvitesSection() {
  const { data: user } = useQuery({ queryKey: ["user"], queryFn: () => supabase.auth.getUser().then((r) => r.data.user) });
  const qc = useQueryClient();
  const { data: convites = [] } = useQuery({
    queryKey: ["convites"],
    queryFn: () => supabase.from("convites").select("*").order("created_at", { ascending: false }).then((r) => r.data ?? []),
  });
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const criar = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from("convites").insert({
        email: email.trim(),
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setEmail("");
      qc.invalidateQueries({ queryKey: ["convites"] });
      toast.success("Convite criado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="bg-card border rounded-2xl p-5 shadow-card">
      <h2 className="font-bold flex items-center gap-2 mb-4">
        <Mail className="h-4 w-4 text-[var(--brand)]" /> Convites
      </h2>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs">Email do convidado</Label>
          <Input type="email" placeholder="email@exemplo.com" value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button className="self-end h-10 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand)]/90"
          onClick={() => email.trim() && criar.mutate()} disabled={criar.isPending || !email.trim()}>
          {criar.isPending ? "..." : <><Plus className="h-4 w-4 mr-1" /> Convidar</>}
        </Button>
      </div>

      <div className="space-y-2">
        {convites.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhum convite enviado ainda.
          </p>
        )}
        {convites.map((c: any) => {
          const link = `${window.location.origin}/auth?invite=${c.token}`;
          const usado = !!c.used_at;
          return (
            <div key={c.id}
              className={`flex items-center gap-2 p-3 rounded-xl border ${usado ? "bg-muted/20 opacity-60" : "bg-background"}`}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{c.email}</div>
                <div className="text-[10px] text-muted-foreground">
                  {usado
                    ? `Usado em ${new Date(c.used_at).toLocaleDateString("pt-BR")}`
                    : `Expira em ${new Date(c.expires_at).toLocaleDateString("pt-BR")}`}
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1 rounded-lg"
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  setCopied(c.id);
                  setTimeout(() => setCopied(null), 2000);
                  toast.success("Link copiado!");
                }}>
                {copied === c.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied === c.id ? "Copiado" : "Copiar"}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}