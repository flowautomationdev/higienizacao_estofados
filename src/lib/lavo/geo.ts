export interface ViaCepResult {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function lookupCep(cep: string): Promise<ViaCepResult> {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) throw new Error("CEP inválido");
  const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
  if (!res.ok) throw new Error("Falha ao consultar CEP");
  const data = (await res.json()) as ViaCepResult;
  if (data.erro) throw new Error("CEP não encontrado");
  return data;
}

export interface GeoCoords {
  lat: number;
  lng: number;
}

export async function geocodeAddress(query: string): Promise<GeoCoords | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "pt-BR" },
  });
  if (!res.ok) return null;
  const arr = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!arr.length) return null;
  return { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) };
}

export async function fullAddressFromCep(cep: string) {
  const v = await lookupCep(cep);
  const fullQuery = `${v.logradouro}, ${v.bairro}, ${v.localidade}, ${v.uf}, Brasil`;
  const coords = await geocodeAddress(fullQuery);
  return { ...v, coords };
}

export async function distanciaPorRota(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): Promise<number | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.routes?.length) return null;
  return data.routes[0].distance / 1000;
}

export async function distanciaPorRotaOpenRoute(
  apiKey: string,
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): Promise<number | null> {
  const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
    method: "POST",
    headers: {
      "Authorization": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coordinates: [
        [lng1, lat1],
        [lng2, lat2],
      ],
    }),
  });
  if (!res.ok) {
    console.warn("[OpenRoute] HTTP", res.status, await res.text().catch(() => ""));
    return null;
  }
  const data = await res.json();
  const dist = data?.routes?.[0]?.summary?.distance;
  if (dist == null) return null;
  return dist / 1000;
}