import type { NextRequest } from 'next/server';

type AuditEventType =
  | 'login.success'
  | 'login.failure'
  | 'logout'
  | 'signup.success'
  | 'signup.failure'
  | 'password.change'
  | 'account.delete'
  | 'oauth.authorize'
  | 'oauth.callback.success'
  | 'oauth.callback.failure'
  | 'oauth.token_refresh'
  | 'oauth.disconnect'
  | 'canvas.token_renewal';

type BaseAuditEvent = {
  type: AuditEventType;
  ip: string;
  timestamp: string;
};

type AuditEvent =
  | (BaseAuditEvent & { type: 'login.success' | 'login.failure'; username: string })
  | (BaseAuditEvent & { type: 'logout'; userId?: string })
  | (BaseAuditEvent & { type: 'signup.success'; username: string })
  | (BaseAuditEvent & { type: 'signup.failure'; username?: string; reason: string })
  | (BaseAuditEvent & { type: 'password.change'; userId: string })
  | (BaseAuditEvent & { type: 'account.delete'; userId: string })
  | (BaseAuditEvent & { type: 'oauth.authorize'; userId?: string; pendingUsername?: string })
  | (BaseAuditEvent & { type: 'oauth.callback.success'; userId: string })
  | (BaseAuditEvent & { type: 'oauth.callback.failure'; reason: string; userId?: string })
  | (BaseAuditEvent & { type: 'oauth.token_refresh'; userId: string })
  | (BaseAuditEvent & { type: 'oauth.disconnect'; userId: string })
  | (BaseAuditEvent & { type: 'canvas.token_renewal'; userId: string });

function normalizeIp(ip: string): string {
  if (ip === '::1') return '127.0.0.1';
  return ip.replace(/^::ffff:/i, '');
}

function getClientIp(request: NextRequest | null): string {
  if (!request) return 'unknown';

  // Only trust forwarded headers when TRUST_PROXY=true is explicitly set.
  // Without this guard, clients can send arbitrary headers to log fake IPs
  // in audit events and bypass rate limiting.
  if (process.env.TRUST_PROXY === 'true') {
    const candidates = [
      request.headers.get('x-forwarded-for')?.split(',')[0].trim(), // standard proxy chain
      request.headers.get('x-real-ip'),                              // nginx
      request.headers.get('cf-connecting-ip'),                       // Cloudflare
      request.headers.get('x-client-ip'),                            // Apache
      request.headers.get('true-client-ip'),                         // Akamai / Cloudflare Enterprise
    ];
    const forwarded = candidates.find((v) => v && v.length > 0);
    if (forwarded) return normalizeIp(forwarded);
  }

  // @ts-ignore - NextRequest may expose ip in some runtimes
  const raw = (request as any).ip ?? 'unknown';
  return normalizeIp(raw);
}

export function logAuditEvent(event: AuditEvent) {
  // Current implementation logs to stdout in structured JSON format.
  // This can be shipped to centralized logging in production.
  // Never include secrets (passwords, tokens) in this payload.
  // eslint-disable-next-line no-console
  console.log('[audit]', JSON.stringify(event));
}

export function buildBaseAuditEvent<T extends AuditEventType>(
  type: T,
  request: NextRequest | null
): { type: T; ip: string; timestamp: string } {
  return {
    type,
    ip: getClientIp(request),
    timestamp: new Date().toISOString(),
  };
}

