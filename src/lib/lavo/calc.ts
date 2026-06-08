export function corrigirDistancia(distanciaKm: number) {
  if (distanciaKm <= 30) return Math.round(distanciaKm * 1.25 * 100) / 100;
  if (distanciaKm <= 100) return Math.round(distanciaKm * 1.10 * 100) / 100;
  return Math.round(distanciaKm * 1.017 * 100) / 100;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export function calcCombustivel(
  distanciaKm: number,
  consumoKmPorLitro: number,
  precoLitro: number,
) {
  const ida_volta = distanciaKm * 2;
  const litros = consumoKmPorLitro > 0 ? ida_volta / consumoKmPorLitro : 0;
  const custo = litros * precoLitro;
  return {
    distanciaKm: Math.round(distanciaKm * 100) / 100,
    litros: Math.round(litros * 100) / 100,
    custo: Math.round(custo * 100) / 100,
  };
}

export interface ReservaCalc {
  categoria: string;
  percentual: number;
  valor: number;
}

export function calcReservas(
  valorServico: number,
  regras: { nome: string; percentual: number; ativo: boolean }[],
): ReservaCalc[] {
  return regras
    .filter((r) => r.ativo)
    .map((r) => ({
      categoria: r.nome,
      percentual: Number(r.percentual),
      valor: Math.round(((valorServico * Number(r.percentual)) / 100) * 100) / 100,
    }));
}

export function calcDisponivel(
  valorServico: number,
  reservas: ReservaCalc[],
  custoCombustivel: number,
) {
  const totalReservas = reservas.reduce((s, r) => s + r.valor, 0);
  return Math.round((valorServico - totalReservas - custoCombustivel) * 100) / 100;
}

export function brl(v: number | null | undefined) {
  return (Number(v) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

export function formatCep(s: string) {
  const d = onlyDigits(s).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function formatPhone(s: string) {
  const d = onlyDigits(s).slice(0, 11);
  if (d.length <= 10)
    return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) =>
      [a && `(${a}`, a && a.length === 2 ? ") " : "", b, c && `-${c}`]
        .filter(Boolean)
        .join(""),
    );
  return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
}