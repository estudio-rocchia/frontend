import { isArgentinaPais, PAIS_LOCALIDAD_DEFAULT } from "@/data/paises";

export type LocalidadOption = { id: number; name: string; province: string; country?: string };

export function normalizeLocalidadText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function resolveCountryLabel(country: string, countryOther: string): string {
  const trimmed = country.trim();
  if (trimmed === "Otro") return countryOther.trim();
  return trimmed || PAIS_LOCALIDAD_DEFAULT;
}

export function localidadesInRegion(
  localidades: LocalidadOption[],
  country: string,
  province: string,
): LocalidadOption[] {
  const countryNorm = normalizeLocalidadText(country);
  const provinceNorm = normalizeLocalidadText(province);
  if (!provinceNorm) return [];

  return localidades
    .filter((item) => {
      const itemCountry = item.country?.trim() || PAIS_LOCALIDAD_DEFAULT;
      return (
        normalizeLocalidadText(itemCountry) === countryNorm &&
        normalizeLocalidadText(item.province) === provinceNorm
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export function provincesInCountry(localidades: LocalidadOption[], country: string): string[] {
  const countryNorm = normalizeLocalidadText(country);
  const seen = new Set<string>();
  for (const item of localidades) {
    const itemCountry = item.country?.trim() || PAIS_LOCALIDAD_DEFAULT;
    if (normalizeLocalidadText(itemCountry) !== countryNorm) continue;
    const province = item.province.trim();
    if (province) seen.add(province);
  }
  return [...seen].sort((a, b) => a.localeCompare(b, "es"));
}

export function filterCitiesByName(
  cities: LocalidadOption[],
  filter: string,
  limit = 80,
): LocalidadOption[] {
  const normalized = normalizeLocalidadText(filter);
  if (!normalized) return cities.slice(0, limit);
  return cities
    .filter((item) => normalizeLocalidadText(item.name).includes(normalized))
    .slice(0, limit);
}

export function formatLocalidadUbicacion(item: LocalidadOption): string {
  const country = item.country?.trim() || PAIS_LOCALIDAD_DEFAULT;
  const parts = [item.name, item.province];
  if (!isArgentinaPais(country)) parts.push(country);
  return parts.join(", ");
}
