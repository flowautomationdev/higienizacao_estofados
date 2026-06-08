export const TIPOS_SERVICO = [
  { value: "sofa", label: "Sofá" },
  { value: "colchao", label: "Colchão" },
  { value: "poltrona", label: "Poltrona" },
  { value: "tapete", label: "Tapete" },
  { value: "banco_automotivo", label: "Banco Automotivo" },
  { value: "outro", label: "Outro" },
] as const;

export const STATUS_SERVICO = [
  { value: "agendado", label: "Agendado", tone: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  { value: "em_andamento", label: "Em andamento", tone: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" },
  { value: "concluido", label: "Concluído", tone: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" },
  { value: "cancelado", label: "Cancelado", tone: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300" },
] as const;

export type TipoServico = (typeof TIPOS_SERVICO)[number]["value"];
export type StatusServico = (typeof STATUS_SERVICO)[number]["value"];

export const labelTipo = (t: string) =>
  TIPOS_SERVICO.find((x) => x.value === t)?.label ?? t;
export const statusInfo = (s: string) =>
  STATUS_SERVICO.find((x) => x.value === s) ?? STATUS_SERVICO[0];