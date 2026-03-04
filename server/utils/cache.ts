const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_SIZE = 500;

interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

/** Simple TTL + size-bounded cache. */
export class TtlCache<K, V> {
  private map = new Map<K, CacheEntry<V>>();
  private ttlMs: number;
  private maxSize: number;

  constructor(ttlMs = DEFAULT_TTL_MS, maxSize = DEFAULT_MAX_SIZE) {
    this.ttlMs = ttlMs;
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.map.size >= this.maxSize) {
      // Evict oldest entry
      const first = this.map.keys().next().value;
      if (first !== undefined) this.map.delete(first);
    }
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}
