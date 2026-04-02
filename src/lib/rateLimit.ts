import type { NextRequest } from 'next/server';

type RateLimitConfig = {
  windowMs: number;
  max: number;
  keyPrefix: string;
};

type RateLimitState = {
  hits: number[];
};

const store = new Map<string, RateLimitState>();

// The rate-limit store is in-memory and resets on every process restart.
// For multi-instance or resilient production deployments consider a Redis-backed
// store so limits survive restarts and are shared across instances.
if (process.env.NODE_ENV === 'production' && !process.env.RATE_LIMIT_STORE_WARNING_SUPPRESSED) {
  console.warn(
    '[rate-limit] Using in-memory store — limits reset on restart. ' +
    'Set RATE_LIMIT_STORE_WARNING_SUPPRESSED=true to silence this warning if intentional.'
  );
}

function getClientKey(request: NextRequest, prefix: string): string {
  // Only trust x-forwarded-for when TRUST_PROXY=true is explicitly set.
  // Without this guard, clients can spoof their IP by sending arbitrary
  // x-forwarded-for headers, bypassing rate limiting entirely.
  if (process.env.TRUST_PROXY === 'true') {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) return `${prefix}:${forwardedFor.split(',')[0].trim()}`;
  }
  // @ts-ignore - NextRequest may expose ip in some runtimes
  const ip = (request as any).ip || 'unknown';
  return `${prefix}:${ip}`;
}

export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const key = getClientKey(request, config.keyPrefix);
  const entry = store.get(key) ?? { hits: [] };

  // Drop hits outside the current window
  entry.hits = entry.hits.filter((ts) => ts > windowStart);

  if (entry.hits.length >= config.max) {
    const oldest = entry.hits[0];
    const retryAfterMs = windowStart + config.windowMs - oldest;
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    store.set(key, entry);
    return { allowed: false, retryAfterSeconds };
  }

  entry.hits.push(now);
  store.set(key, entry);
  return { allowed: true };
}

