import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/server since we're in a Node test environment
vi.mock('next/server', () => ({
  NextRequest: class NextRequest {},
}));

import { checkRateLimit } from '../../lib/rateLimit';

/** Creates a minimal NextRequest-like object for testing. */
function makeRequest(ip: string, forwardedFor?: string): any {
  return {
    ip,
    headers: {
      get: (name: string) => {
        if (name === 'x-forwarded-for') return forwardedFor ?? null;
        return null;
      },
    },
  };
}

describe('checkRateLimit', () => {
  const config = {
    windowMs: 60 * 1000, // 1 minute window
    max: 3,
    keyPrefix: 'test',
  };

  beforeEach(() => {
    // Each test uses a unique IP to avoid shared state between tests
    vi.resetModules();
  });

  it('allows requests under the limit', () => {
    const req = makeRequest('10.0.0.1');
    const result1 = checkRateLimit(req, { ...config, keyPrefix: 'allow-test' });
    expect(result1.allowed).toBe(true);
  });

  it('allows up to max requests', () => {
    const prefix = `test-up-to-max-${Date.now()}`;
    const req = makeRequest('10.1.1.1');
    for (let i = 0; i < config.max; i++) {
      const result = checkRateLimit(req, { ...config, keyPrefix: prefix });
      expect(result.allowed).toBe(true);
    }
  });

  it('blocks the (max + 1)th request', () => {
    const prefix = `test-block-${Date.now()}`;
    const req = makeRequest('10.2.2.2');
    for (let i = 0; i < config.max; i++) {
      checkRateLimit(req, { ...config, keyPrefix: prefix });
    }
    const blocked = checkRateLimit(req, { ...config, keyPrefix: prefix });
    expect(blocked.allowed).toBe(false);
  });

  it('returns retryAfterSeconds > 0 when blocked', () => {
    const prefix = `test-retry-${Date.now()}`;
    const req = makeRequest('10.3.3.3');
    for (let i = 0; i < config.max; i++) {
      checkRateLimit(req, { ...config, keyPrefix: prefix });
    }
    const blocked = checkRateLimit(req, { ...config, keyPrefix: prefix });
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it('allows a different IP after another IP is rate-limited', () => {
    const prefix = `test-separate-ips-${Date.now()}`;
    const req1 = makeRequest('10.4.4.4');
    const req2 = makeRequest('10.4.4.5');

    for (let i = 0; i < config.max + 1; i++) {
      checkRateLimit(req1, { ...config, keyPrefix: prefix });
    }

    const result = checkRateLimit(req2, { ...config, keyPrefix: prefix });
    expect(result.allowed).toBe(true);
  });

  it('uses x-forwarded-for when TRUST_PROXY=true', () => {
    process.env.TRUST_PROXY = 'true';
    const prefix = `test-forwarded-${Date.now()}`;
    const req = makeRequest('unknown', '192.168.1.100');

    const result = checkRateLimit(req, { ...config, keyPrefix: prefix });
    expect(result.allowed).toBe(true);

    delete process.env.TRUST_PROXY;
  });

  it('does not use x-forwarded-for when TRUST_PROXY is not set', () => {
    delete process.env.TRUST_PROXY;
    const prefix = `test-no-proxy-${Date.now()}`;
    const req = makeRequest('10.5.5.5', '1.2.3.4');

    // Both calls should use the direct IP (10.5.5.5), not the forwarded header
    checkRateLimit(req, { ...config, keyPrefix: prefix });
    checkRateLimit(req, { ...config, keyPrefix: prefix });
    const third = checkRateLimit(req, { ...config, keyPrefix: prefix });
    expect(third.allowed).toBe(true); // still within max:3

    const fourth = checkRateLimit(req, { ...config, keyPrefix: prefix });
    expect(fourth.allowed).toBe(false); // now blocked under same IP key
  });

  it('allows requests again after window expires', async () => {
    const shortConfig = { windowMs: 100, max: 1, keyPrefix: `test-window-${Date.now()}` };
    const req = makeRequest('10.6.6.6');

    checkRateLimit(req, shortConfig);
    const blocked = checkRateLimit(req, shortConfig);
    expect(blocked.allowed).toBe(false);

    // Wait for window to expire
    await new Promise((r) => setTimeout(r, 150));

    const after = checkRateLimit(req, shortConfig);
    expect(after.allowed).toBe(true);
  });
});
