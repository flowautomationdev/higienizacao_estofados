import { supabase } from "@/integrations/supabase/client";

export async function fetchConfig() {
  const { data, error } = await supabase
    .from("configuracoes_empresa")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchRegras() {
  const { data, error } = await supabase
    .from("regras_financeiras")
    .select("*")
    .order("ordem");
  if (error) throw error;
  return data ?? [];
}

export async function fetchClientes() {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("nome");
  if (error) throw error;
  return data ?? [];
}

export async function fetchServicos() {
  const { data, error } = await supabase
    .from("servicos")
    .select("*, clientes(nome, telefone)")
    .order("data_agendada", { ascending: false });
  if (error) throw error;
  return data ?? [];
}