const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

export async function withCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  const data = await fetcher();
  memoryCache.set(key, { data, expiresAt: now + CACHE_TTL_MS });
  return data;
}

export function invalidateCache(key?: string) {
  if (key) {
    memoryCache.delete(key);
    return;
  }
  memoryCache.clear();
}
