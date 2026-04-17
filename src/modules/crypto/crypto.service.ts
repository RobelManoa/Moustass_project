import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from 'node:crypto';
import { env } from '../../config/env';

// ====================== TYPES ======================

export interface MessageManifest {
  id: string;
  clientName: string;
  ownerId: string;
  recipientId: string | null;
  title: string;
  description: string | null;
  originalFileName: string;
  mimeType: string;
  size: number;
  mediaSha256: string;
  recordingDurationSeconds: number;
  uploadedAt: string;
}

// ====================== HASH ======================

export function sha256(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

// ====================== MANIFEST ======================

export function buildMessageManifest(data: Omit<MessageManifest, 'uploadedAt'>): MessageManifest {
  return {
    ...data,
    uploadedAt: new Date().toISOString(),
  };
}

// ====================== CLÉS ======================

let privateKey: Buffer | null = null;
let publicKey: Buffer | null = null;

function loadKeys() {
  if (privateKey && publicKey) return;

  if (!env.CRYPTO_PRIVATE_KEY_PEM || !env.CRYPTO_PUBLIC_KEY_PEM) {
    if (env.NODE_ENV !== 'production') {
      const generatedKeyPair = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicExponent: 0x10001,
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        publicKeyEncoding: { type: 'spki', format: 'pem' },
      });

      privateKey = Buffer.from(generatedKeyPair.privateKey, 'utf-8');
      publicKey = Buffer.from(generatedKeyPair.publicKey, 'utf-8');
      return;
    }

    throw new Error('CRYPTO_PRIVATE_KEY_PEM and CRYPTO_PUBLIC_KEY_PEM must be defined in .env');
  }

  privateKey = Buffer.from(env.CRYPTO_PRIVATE_KEY_PEM, 'utf-8');
  publicKey = Buffer.from(env.CRYPTO_PUBLIC_KEY_PEM, 'utf-8');
}

function getPrivateKey() {
  loadKeys();
  return createPrivateKey({ key: privateKey!, format: 'pem' });
}

function getPublicKey() {
  loadKeys();
  return createPublicKey({ key: publicKey!, format: 'pem' });
}

// ====================== SIGNATURE RSA-PSS ======================

export function signManifest(manifest: MessageManifest): string {
  const privateKeyObj = getPrivateKey();
  const manifestStr = JSON.stringify(manifest, Object.keys(manifest).sort((left, right) => left.localeCompare(right)));

  const signature = sign(
    'RSA-SHA256',
    Buffer.from(manifestStr),
    {
      key: privateKeyObj,
      padding: 6,                    // RSA_PKCS1_PSS_PADDING (valeur numérique)
      saltLength: 32,
    }
  );

  return signature.toString('base64');
}

export function verifyManifest(manifest: MessageManifest, signatureBase64: string): boolean {
  try {
    const publicKeyObj = getPublicKey();
    const manifestStr = JSON.stringify(manifest, Object.keys(manifest).sort((left, right) => left.localeCompare(right)));
    const signatureBuffer = Buffer.from(signatureBase64, 'base64');

    return verify(
      'RSA-SHA256',
      Buffer.from(manifestStr),
      {
        key: publicKeyObj,
        padding: 6,                    // RSA_PKCS1_PSS_PADDING
        saltLength: 32,
      },
      signatureBuffer
    );
  } catch (error) {
    console.error('[Crypto] Signature verification failed:', error);
    return false;
  }
}
