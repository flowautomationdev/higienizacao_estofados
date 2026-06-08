import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClientes } from "@/lib/lavo/queries";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Phone, MapPin, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatCep, formatPhone } from "@/lib/lavo/calc";
import { lookupCep } from "@/lib/lavo/geo";

export const Route = createFileRoute("/_authenticated/clientes")({
  component: Clientes,
});

type Cliente = Awaited<ReturnType<typeof fetchClientes>>[number];

function Clientes() {
  const { data = [] } = useQuery({ queryKey: ["clientes"], queryFn: fetchClientes });
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Cliente | null>(null);

  const filtered = data.filter(
    (c) =>
      c.nome.toLowerCase().includes(q.toLowerCase()) ||
      (c.telefone || "").includes(q) ||
      (c.bairro || "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setEdit(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-[var(--brand)] hover:bg-[var(--brand)]/90 rounded-xl h-10">
              <Plus className="h-4 w-4 mr-1" /> Novo
            </Button>
          </DialogTrigger>
          <ClienteDialog
            initial={edit}
            onClose={() => {
              setOpen(false);
              setEdit(null);
            }}
          />
        </Dialog>
      </div>

      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, telefone, bairro..."
          className="pl-9 h-11 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-card border rounded-2xl p-8 text-center text-sm text-muted-foreground">
            Nenhum cliente {q && "encontrado"}.
          </div>
        )}
        {filtered.map((c) => (
          <div key={c.id} className="bg-card border rounded-2xl p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{c.nome}</div>
                <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {c.telefone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3" /> {c.telefone}
                    </div>
                  )}
                  {(c.bairro || c.cidade) && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" /> {[c.bairro, c.cidade].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setEdit(c);
                    setOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <DeleteCliente id={c.id} nome={c.nome} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeleteCliente({ id, nome }: { id: string; nome: string }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente excluído");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-destructive"
      onClick={() => {
        if (confirm(`Excluir ${nome}?`)) m.mutate();
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function ClienteDialog({
  initial,
  onClose,
}: {
  initial: Cliente | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    nome: initial?.nome ?? "",
    telefone: initial?.telefone ?? "",
    cep: initial?.cep ?? "",
    endereco: initial?.endereco ?? "",
    bairro: initial?.bairro ?? "",
    cidade: initial?.cidade ?? "",
    observacoes: initial?.observacoes ?? "",
  });
  const [loadingCep, setLoadingCep] = useState(false);

  async function buscarCep() {
    if (form.cep.replace(/\D/g, "").length !== 8) return;
    setLoadingCep(true);
    try {
      const r = await lookupCep(form.cep);
      setForm((f) => ({
        ...f,
        endereco: r.logradouro || f.endereco,
        bairro: r.bairro || f.bairro,
        cidade: r.localidade || f.cidade,
      }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingCep(false);
    }
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form };
      if (initial) {
        const { error } = await supabase.from("clientes").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clientes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      toast.success(initial ? "Cliente atualizado" : "Cliente criado");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-md rounded-2xl">
      <DialogHeader>
        <DialogTitle>{initial ? "Editar cliente" : "Novo cliente"}</DialogTitle>
      </DialogHeader>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Field label="Nome" required value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
        <Field
          label="Telefone"
          value={form.telefone}
          onChange={(v) => setForm({ ...form, telefone: formatPhone(v) })}
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <Field
              label="CEP"
              value={form.cep}
              onChange={(v) => setForm({ ...form, cep: formatCep(v) })}
              onBlur={buscarCep}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="self-end h-10 rounded-xl"
            onClick={buscarCep}
            disabled={loadingCep}
          >
            {loadingCep ? "..." : "Buscar"}
          </Button>
        </div>
        <Field label="Endereço" value={form.endereco} onChange={(v) => setForm({ ...form, endereco: v })} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Bairro" value={form.bairro} onChange={(v) => setForm({ ...form, bairro: v })} />
          <Field label="Cidade" value={form.cidade} onChange={(v) => setForm({ ...form, cidade: v })} />
        </div>
        <div className="space-y-1.5">
          <Label>Observações</Label>
          <Textarea
            rows={2}
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
          />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            disabled={save.isPending}
            className="bg-[var(--brand)] hover:bg-[var(--brand)]/90 w-full h-11 rounded-xl"
          >
            {save.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  onBlur?: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
}