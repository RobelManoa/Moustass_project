import {
  createHash,
  createSign,
  createVerify,
  generateKeyPairSync,
  constants,
} from 'node:crypto';
import { env } from '../../config/env';

export interface MessageManifest {
  id: string;
  clientName: string;
  ownerId: string;
  title: string;
  description: string | null;
  originalFileName: string;
  mimeType: string;
  size: number;
  mediaSha256: string;
  uploadedAt: string;
  signatureAlgorithm: 'PS256';
}

let cachedPrivateKey: string | null = null;
let cachedPublicKey: string | null = null;

function getKeyPair() {
  if (cachedPrivateKey && cachedPublicKey) {
    return { privateKey: cachedPrivateKey, publicKey: cachedPublicKey };
  }

  if (env.CRYPTO_PRIVATE_KEY_PEM && env.CRYPTO_PUBLIC_KEY_PEM) {
    cachedPrivateKey = env.CRYPTO_PRIVATE_KEY_PEM;
    cachedPublicKey = env.CRYPTO_PUBLIC_KEY_PEM;
    return { privateKey: cachedPrivateKey, publicKey: cachedPublicKey };
  }

  const keyPair = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
    publicKeyEncoding: { format: 'pem', type: 'spki' },
  });

  cachedPrivateKey = keyPair.privateKey;
  cachedPublicKey = keyPair.publicKey;

  return keyPair;
}

export function sha256(buffer: Buffer | string) {
  return createHash('sha256').update(buffer).digest('hex');
}

export function buildMessageManifest(manifest: Omit<MessageManifest, 'signatureAlgorithm'>): MessageManifest {
  return {
    ...manifest,
    signatureAlgorithm: 'PS256',
  };
}

function stringifyManifest(manifest: MessageManifest) {
  return JSON.stringify({
    clientName: manifest.clientName,
    description: manifest.description,
    id: manifest.id,
    mimeType: manifest.mimeType,
    mediaSha256: manifest.mediaSha256,
    originalFileName: manifest.originalFileName,
    ownerId: manifest.ownerId,
    signatureAlgorithm: manifest.signatureAlgorithm,
    size: manifest.size,
    title: manifest.title,
    uploadedAt: manifest.uploadedAt,
  });
}

export function signManifest(manifest: MessageManifest) {
  const { privateKey } = getKeyPair();
  const signer = createSign('sha256');
  signer.update(stringifyManifest(manifest));
  signer.end();

  return signer.sign(
    {
      key: privateKey,
      padding: constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 32,
    },
    'base64',
  );
}

export function verifyManifest(manifest: MessageManifest, signature: string) {
  const { publicKey } = getKeyPair();
  const verifier = createVerify('sha256');
  verifier.update(stringifyManifest(manifest));
  verifier.end();

  return verifier.verify(
    {
      key: publicKey,
      padding: constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 32,
    },
    signature,
  );
}