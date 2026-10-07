/** Ventana habitual de cobro del alquiler (días 1–10 de cada mes). */
export const RENT_COLLECTION_WINDOW_DAYS = 10;

export function isRentCollectionWindow(asOf = new Date()): boolean {
  const day = asOf.getDate();
  return day >= 1 && day <= RENT_COLLECTION_WINDOW_DAYS;
}

export function rentCollectionWindowHint(): string {
  return `Período de cobro: del 1 al ${RENT_COLLECTION_WINDOW_DAYS} de cada mes`;
}
