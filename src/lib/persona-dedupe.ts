import type { PersonaRecord } from "@/lib/api/types";
import { personaDisplayName } from "@/lib/format";

function personaDedupeKey(persona: PersonaRecord): string {
  const doc = persona.numeroDocumento?.trim() || persona.cuit?.trim();
  if (doc) return `doc:${doc.toLowerCase()}`;
  const name = personaDisplayName(persona).toLowerCase().replace(/\s+/g, " ");
  return `name:${name}`;
}

function personaCompletenessScore(persona: PersonaRecord): number {
  let score = 0;
  if (persona.numeroDocumento?.trim()) score += 8;
  if (persona.cuit?.trim()) score += 6;
  if (persona.email?.trim()) score += 4;
  if (persona.phone?.trim()) score += 2;
  if (persona.address?.trim()) score += 1;
  return score;
}

function pickPreferredPersona(candidates: PersonaRecord[]): PersonaRecord {
  return candidates.reduce((best, current) => {
    const scoreDiff = personaCompletenessScore(current) - personaCompletenessScore(best);
    if (scoreDiff !== 0) return scoreDiff > 0 ? current : best;
    return current.id < best.id ? current : best;
  });
}

/** Colapsa duplicados (mismo nombre visible o mismo documento). */
export function dedupePersonaResults(personas: PersonaRecord[]): PersonaRecord[] {
  const groups = new Map<string, PersonaRecord[]>();
  for (const persona of personas) {
    const key = personaDedupeKey(persona);
    const bucket = groups.get(key) ?? [];
    bucket.push(persona);
    groups.set(key, bucket);
  }
  return [...groups.values()].map(pickPreferredPersona);
}
