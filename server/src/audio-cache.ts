// server-side audio cache — stores generated audio between generate and upload steps
// keyed by wallet address, auto-expires after 30 minutes

interface CacheEntry {
  data: string[]; // base64 encoded audio buffers
  tier: string;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function setCachedAudio(walletAddress: string, data: string[], tier: string): void {
  cache.set(walletAddress, { data, tier, timestamp: Date.now() });
}

export function getCachedAudio(walletAddress: string): CacheEntry | null {
  return cache.get(walletAddress) ?? null;
}

export function clearCachedAudio(walletAddress: string): void {
  cache.delete(walletAddress);
}
