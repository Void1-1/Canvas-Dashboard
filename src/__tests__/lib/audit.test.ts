import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('next/server', () => ({
  NextRequest: class NextRequest {},
}));

import { buildBaseAuditEvent, logAuditEvent } from '../../lib/audit';

function makeRequest(options: {
  ip?: string;
  forwardedFor?: string;
  realIp?: string;
  cfConnectingIp?: string;
} = {}): any {
  return {
    ip: options.ip ?? 'unknown',
    headers: {
      get: (name: string) => {
        if (name === 'x-forwarded-for') return options.forwardedFor ?? null;
        if (name === 'x-real-ip') return options.realIp ?? null;
        if (name === 'cf-connecting-ip') return options.cfConnectingIp ?? null;
        return null;
      },
    },
  };
}

describe('audit', () => {
  describe('buildBaseAuditEvent', () => {
    it('includes the correct event type', () => {
      const event = buildBaseAuditEvent('login.success', makeRequest({ ip: '1.2.3.4' }));
      expect(event.type).toBe('login.success');
    });

    it('includes an ISO timestamp', () => {
      const event = buildBaseAuditEvent('logout', makeRequest({ ip: '1.2.3.4' }));
      expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(() => new Date(event.timestamp)).not.toThrow();
    });

    it('includes the client IP from request.ip', () => {
      const event = buildBaseAuditEvent('login.failure', makeRequest({ ip: '5.6.7.8' }));
      expect(event.ip).toBe('5.6.7.8');
    });

    it('returns "unknown" when request is null', () => {
      const event = buildBaseAuditEvent('signup.success', null);
      expect(event.ip).toBe('unknown');
    });

    it('normalizes IPv6 loopback ::1 to 127.0.0.1', () => {
      const event = buildBaseAuditEvent('logout', makeRequest({ ip: '::1' }));
      expect(event.ip).toBe('127.0.0.1');
    });

    it('normalizes IPv4-mapped IPv6 addresses (::ffff:x.x.x.x)', () => {
      const event = buildBaseAuditEvent('logout', makeRequest({ ip: '::ffff:192.168.1.1' }));
      expect(event.ip).toBe('192.168.1.1');
    });

    it('uses x-forwarded-for when TRUST_PROXY=true', () => {
      process.env.TRUST_PROXY = 'true';
      const event = buildBaseAuditEvent(
        'login.success',
        makeRequest({ ip: 'unknown', forwardedFor: '203.0.113.1, 10.0.0.1' })
      );
      expect(event.ip).toBe('203.0.113.1');
      delete process.env.TRUST_PROXY;
    });

    it('takes the first IP from x-forwarded-for chain', () => {
      process.env.TRUST_PROXY = 'true';
      const event = buildBaseAuditEvent(
        'login.success',
        makeRequest({ forwardedFor: '1.1.1.1, 2.2.2.2, 3.3.3.3' })
      );
      expect(event.ip).toBe('1.1.1.1');
      delete process.env.TRUST_PROXY;
    });

    it('ignores x-forwarded-for when TRUST_PROXY is not set', () => {
      delete process.env.TRUST_PROXY;
      const event = buildBaseAuditEvent(
        'login.success',
        makeRequest({ ip: '5.5.5.5', forwardedFor: '9.9.9.9' })
      );
      expect(event.ip).toBe('5.5.5.5');
    });

    it('uses x-real-ip header when TRUST_PROXY=true and no x-forwarded-for', () => {
      process.env.TRUST_PROXY = 'true';
      const event = buildBaseAuditEvent(
        'logout',
        makeRequest({ realIp: '10.20.30.40' })
      );
      expect(event.ip).toBe('10.20.30.40');
      delete process.env.TRUST_PROXY;
    });

    it('uses cf-connecting-ip as fallback with TRUST_PROXY=true', () => {
      process.env.TRUST_PROXY = 'true';
      const event = buildBaseAuditEvent(
        'logout',
        makeRequest({ cfConnectingIp: '11.22.33.44' })
      );
      expect(event.ip).toBe('11.22.33.44');
      delete process.env.TRUST_PROXY;
    });
  });

  describe('logAuditEvent', () => {
    it('logs to console with [audit] prefix', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logAuditEvent({
        type: 'login.success',
        ip: '1.2.3.4',
        timestamp: new Date().toISOString(),
        username: 'testuser',
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        '[audit]',
        expect.stringContaining('"type":"login.success"')
      );
      consoleSpy.mockRestore();
    });

    it('logs valid JSON', () => {
      let logged = '';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation((_prefix: string, json: string) => {
        logged = json;
      });
      logAuditEvent({
        type: 'logout',
        ip: '1.2.3.4',
        timestamp: new Date().toISOString(),
      });
      consoleSpy.mockRestore();
      expect(() => JSON.parse(logged)).not.toThrow();
    });
  });
});
