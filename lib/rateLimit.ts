type Key = string;
const memory = new Map<Key, { count: number; reset: number }>();

export interface LimitConfig {
  limit: number;       // requests
  windowMs: number;    // window size
}

export async function rateLimit(key: string, cfg: LimitConfig) {
  // Upstash REST if configured
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const id = `rl:${key}`;
    const ttl = Math.ceil(cfg.windowMs / 1000);
    const resp = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        commands: [
          ["INCR", id],
          ["EXPIRE", id, ttl]
        ]
      })
    });
    const data = await resp.json();
    const count = Number(Array.isArray(data) ? data[0].result : 0);
    return { ok: count <= cfg.limit, count, remaining: Math.max(cfg.limit - count, 0) };
  }

  // In-memory fallback (dev only)
  const now = Date.now();
  const row = memory.get(key);
  if (!row || row.reset < now) {
    memory.set(key, { count: 1, reset: now + cfg.windowMs });
    return { ok: true, count: 1, remaining: cfg.limit - 1 };
  }
  row.count += 1;
  return { ok: row.count <= cfg.limit, count: row.count, remaining: Math.max(cfg.limit - row.count, 0) };
}
