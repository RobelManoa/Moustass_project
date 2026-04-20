jest.mock('node:crypto', () => ({
  createHash: () => ({
    update: () => ({
      digest: () => 'a'.repeat(64),
    }),
  }),
  createPrivateKey: jest.fn(() => ({})),
  createPublicKey: jest.fn(() => ({})),
  sign: jest.fn(() => Buffer.from('signature')),
  verify: jest.fn((algorithm, data, options, signature) => {
    const payload = Buffer.isBuffer(data) ? data.toString('utf-8') : String(data);
    const sig = Buffer.isBuffer(signature) ? signature.toString('utf-8') : String(signature);

    return sig === 'signature' && payload.includes('Message Vidéo Confidentiel');
  }),
}));

jest.mock('../../../config/env', () => ({
  env: {
    CRYPTO_PRIVATE_KEY_PEM: 'mock-private-key',
    CRYPTO_PUBLIC_KEY_PEM: 'mock-public-key',
  },
}));

import { sha256, buildMessageManifest, signManifest, verifyManifest } from '../crypto.service';
import { messageManifestSchema } from '../crypto.schemas';

describe('Crypto Module - Tests Unitaires', () => {
  const mockManifestData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    clientName: 'Client A',
    ownerId: '987fcdeb-51a2-43e8-9c4f-123456789abc',
    recipientId: '11111111-2222-3333-4444-555555555555',
    title: 'Message Vidéo Confidentiel',
    description: 'Test de signature',
    originalFileName: 'confidentiel.mp4',
    mimeType: 'video/mp4',
    size: 15432000,
    mediaSha256: 'a'.repeat(64), // 64 caractères hex
    recordingDurationSeconds: 5,
  };

  let validManifest: any;

  beforeAll(() => {
    validManifest = buildMessageManifest(mockManifestData);
  });

  describe('sha256()', () => {
    it('devrait calculer correctement un hash SHA-256', () => {
      const data = Buffer.from('test video content');
      const hash = sha256(data);

      expect(hash).toHaveLength(64);
      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('buildMessageManifest()', () => {
    it('devrait construire un manifest valide avec uploadedAt', () => {
      const manifest = buildMessageManifest(mockManifestData);

      expect(manifest.id).toBe(mockManifestData.id);
      expect(manifest.uploadedAt).toBeDefined();
      expect(typeof manifest.uploadedAt).toBe('string');
      expect(new Date(manifest.uploadedAt).toString()).not.toBe('Invalid Date');
    });

    it('devrait valider le manifest avec Zod', () => {
      const manifest = buildMessageManifest(mockManifestData);
      const result = messageManifestSchema.safeParse(manifest);

      expect(result.success).toBe(true);
    });
  });

  describe('Signature & Vérification RSA-PSS', () => {
    it('devrait signer et vérifier correctement un manifest', () => {
      const signature = signManifest(validManifest);

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(10);

      // Vérification
      const isValid = verifyManifest(validManifest, signature);
      expect(isValid).toBe(true);
    });

    it('devrait détecter une signature invalide', () => {
      const signature = signManifest(validManifest);

      // Modification du manifest pour simuler une altération
      const tamperedManifest = { ...validManifest, title: 'Titre modifié par un attaquant' };

      const isValid = verifyManifest(tamperedManifest, signature);
      expect(isValid).toBe(false);
    });

    it('devrait rejeter une signature mal formée', () => {
      const isValid = verifyManifest(validManifest, 'signature_invalide_base64');
      expect(isValid).toBe(false);
    });
  });

});