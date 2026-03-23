import crypto from 'crypto';

const CANVAS_ENCRYPTION_KEY_HEX = process.env.CANVAS_ENCRYPTION_KEY;

function getCanvasEncryptionKey(): Buffer {
  if (!CANVAS_ENCRYPTION_KEY_HEX) {
    throw new Error(
      'CANVAS_ENCRYPTION_KEY is not set. It must be a 64-character hex string (32 bytes) for AES-256-GCM.'
    );
  }

  if (!/^[0-9a-fA-F]{64}$/.test(CANVAS_ENCRYPTION_KEY_HEX)) {
    throw new Error(
      'CANVAS_ENCRYPTION_KEY must be a 64-character hex string (32 bytes) for AES-256-GCM.'
    );
  }

  return Buffer.from(CANVAS_ENCRYPTION_KEY_HEX, 'hex');
}

export function isEncryptedCanvasToken(value: string): boolean {
  return value.startsWith('enc:');
}

export function encryptCanvasToken(token: string): string {
  const key = getCanvasEncryptionKey();
  const iv = crypto.randomBytes(12); // recommended IV length for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    'enc',
    iv.toString('base64'),
    ciphertext.toString('base64'),
    authTag.toString('base64'),
  ].join(':');
}

export function decryptCanvasToken(stored: string): string {
  if (!isEncryptedCanvasToken(stored)) {
    throw new Error('Canvas token is not encrypted. All tokens must use the "enc:" prefix.');
  }

  const key = getCanvasEncryptionKey();
  const parts = stored.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted Canvas token format.');
  }

  const [, ivB64, ciphertextB64, authTagB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');

  if (iv.length !== 12) throw new Error('Invalid IV length in encrypted Canvas token.');
  if (authTag.length !== 16) throw new Error('Invalid auth tag length in encrypted Canvas token.');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    throw new Error('Failed to decrypt Canvas token.');
  }
}

