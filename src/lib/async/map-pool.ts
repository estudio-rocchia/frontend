/** Ejecuta un mapper async con concurrencia limitada (evita saturar el servidor). */
export async function mapPool<T, R>(
  items: readonly T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  if (items.length === 0) return [];
  const limit = Math.max(1, Math.min(concurrency, items.length));
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index]!, index);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}
