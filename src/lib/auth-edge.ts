import { jwtVerify, SignJWT, type JWTPayload } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET as string | undefined;

function getJwtSecretKey(): Uint8Array {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set. It must be a strong, random secret string (at least 32 characters).');
  }
  if (JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for adequate entropy.');
  }
  return new TextEncoder().encode(JWT_SECRET);
}

type EdgeSessionPayload = JWTPayload & {
  sub: string;
  iat: number;
  origIat?: number;
  jti?: string;
};

export async function verifySessionEdge(token: string): Promise<EdgeSessionPayload | null> {
  try {
    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS512'],
      issuer: 'canvas-dashboard',
      audience: 'canvas-users',
    });

    if (!payload.sub || typeof payload.iat !== 'number') {
      return null;
    }

    return payload as EdgeSessionPayload;
  } catch {
    return null;
  }
}

export async function signSessionEdge(sub: string, origIat?: number): Promise<string> {
  const secret = getJwtSecretKey();
  const nowSec = Math.floor(Date.now() / 1000);
  const baseOrigIat = origIat ?? nowSec;

  return await new SignJWT({
    sub,
    iat: nowSec,
    origIat: baseOrigIat,
    jti: crypto.randomUUID(),
  })
    .setProtectedHeader({ alg: 'HS512' })
    .setIssuer('canvas-dashboard')
    .setAudience('canvas-users')
    .setExpirationTime('7d')
    .sign(secret);
}

