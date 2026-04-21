import * as fs from 'node:fs/promises';

import * as cryptoService from '../../crypto/crypto.service';
import * as auditService from '../../audit/audit.service';
import * as videoService from '../video.service';
import { badRequest, forbidden, notFound } from '../../../shared/http-errors';

// ====================== MOCKS (à mettre tout en haut) ======================

jest.mock('node:fs/promises');
jest.mock('../../crypto/crypto.service');
jest.mock('../../audit/audit.service');

// On mock Prisma avec des jest.fn() directement dans le factory
jest.mock('../../../infrastructure/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    videoMessage: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// ====================== TESTS ======================

describe('Video Service - Unit Tests', () => {
  const mockActor = {
    userId: 'user-123',
    email: 'user@test.local',
    role: 'USER' as const,
    clientName: 'Test Client',
  };

  const mockFile: any = {
    fieldname: 'file',
    originalname: 'video.mp4',
    encoding: '7bit',
    mimetype: 'video/mp4',
    size: 5000000,
    buffer: Buffer.from('fake video data'),
  };

  const mockManifest = {
    id: 'msg-123',
    clientName: 'Test Client',
    ownerId: 'user-123',
    recipientId: 'user-456',
    title: 'Test Video',
    description: 'Test Description',
    originalFileName: 'video.mp4',
    mimeType: 'video/mp4',
    size: 5000000,
    mediaSha256: 'hash123',
    recordingDurationSeconds: 5,
    uploadedAt: new Date().toISOString(),
  };

  // Récupération des mocks après le jest.mock()
  const { prisma } = require('../../../infrastructure/prisma');

  beforeEach(() => {
    jest.clearAllMocks();
    (cryptoService.verifyManifest as jest.Mock).mockReturnValue(true);
  });

  it('devrait télécharger un message vidéo avec succès', async () => {
    // Mock fs
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    // Mock crypto service
    (cryptoService.sha256 as jest.Mock).mockReturnValue('hash123');
    (cryptoService.buildMessageManifest as jest.Mock).mockReturnValue(mockManifest);
    (cryptoService.signManifest as jest.Mock).mockReturnValue('sig123');

    // Mock audit
    (auditService.recordAudit as jest.Mock).mockResolvedValue(undefined);

    // Mock Prisma
    prisma.user.findUnique.mockResolvedValue({ id: 'user-456' });
    prisma.videoMessage.create.mockResolvedValue({
      id: 'msg-123',
      title: 'Test Video',
    });
    prisma.videoMessage.findUniqueOrThrow.mockResolvedValue({
      id: 'msg-123',
      ownerId: 'user-123',
      recipientId: 'user-456',
      title: 'Test Video',
      description: 'Test Description',
      originalFileName: 'video.mp4',
      mimeType: 'video/mp4',
      mediaSha256: 'hash123',
      mediaSignature: 'sig123',
      manifestJson: mockManifest,
      createdAt: new Date(),
      updatedAt: new Date(),
      owner: { id: 'user-123', email: 'user@test.local', name: 'User', role: 'USER' },
      recipient: { id: 'user-456', email: 'target@test.local', name: 'Target', role: 'USER' },
    });

    const result = await videoService.uploadMessage({
      actor: mockActor,
      file: mockFile,
      recipientId: 'user-456',
      title: 'Test Video',
      description: 'Test Description',
    });

    expect(result.id).toBe('msg-123');
    expect(auditService.recordAudit).toHaveBeenCalled();
  });

  it('devrait rejeter l’upload sans fichier', async () => {
    await expect(
      videoService.uploadMessage({
        actor: mockActor,
        file: null as any,
        recipientId: 'user-456',
        title: 'Test Video',
      })
    ).rejects.toThrow(badRequest('Fichier vidéo manquant'));
  });

  it('devrait rejeter l upload quand le media n est pas video', async () => {
    await expect(
      videoService.uploadMessage({
        actor: mockActor,
        file: { ...mockFile, mimetype: 'image/png' },
        recipientId: 'user-456',
        title: 'Invalid',
      })
    ).rejects.toThrow(badRequest('Le media doit etre une video'));
  });

  it('devrait rejeter l upload si destinataire introuvable', async () => {
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      videoService.uploadMessage({
        actor: mockActor,
        file: mockFile,
        recipientId: 'missing-user',
        title: 'Test',
      })
    ).rejects.toThrow(notFound('Destinataire introuvable'));
  });

  it('devrait rejeter l upload vers soi-meme', async () => {
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });

    await expect(
      videoService.uploadMessage({
        actor: mockActor,
        file: mockFile,
        recipientId: 'user-123',
        title: 'Self',
      })
    ).rejects.toThrow(badRequest('Vous ne pouvez pas vous envoyer un message a vous-meme'));
  });

  it('listMessageRecipients retourne les users sauf acteur', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: 'u2', email: 'u2@test.local', name: null, role: 'USER' },
    ]);

    const result = await videoService.listMessageRecipients(mockActor);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { not: 'user-123' } } })
    );
    expect(result).toEqual([
      { id: 'u2', email: 'u2@test.local', name: '', role: 'USER' },
    ]);
  });

  it('listMessages retourne pagination et totalPages', async () => {
    const message = {
      id: 'm1',
      ownerId: 'user-123',
      recipientId: 'user-456',
      title: 'Hello',
      description: null,
      originalFileName: 'video.mp4',
      mimeType: 'video/mp4',
      mediaSha256: 'hash123',
      mediaSignature: 'sig123',
      manifestJson: { id: 'm1' },
      createdAt: new Date(),
      updatedAt: new Date(),
      owner: { id: 'user-123', email: 'user@test.local', name: 'User', role: 'USER' },
      recipient: { id: 'user-456', email: 'target@test.local', name: 'Target', role: 'USER' },
    };

    prisma.videoMessage.findMany.mockResolvedValue([message]);
    prisma.videoMessage.count.mockResolvedValue(3);

    const result = await videoService.listMessages(mockActor, {
      box: 'all',
      page: 1,
      perPage: 2,
      q: 'Hello',
    });

    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(2);
    expect(result.messages).toHaveLength(1);
  });

  it('getMessageDetails retourne les details avec signatureValid', async () => {
    const storedMessage = {
      id: 'm1',
      ownerId: 'user-123',
      recipientId: 'user-456',
      title: 'Detail',
      description: null,
      originalFileName: 'video.mp4',
      mimeType: 'video/mp4',
      mediaSha256: 'hash123',
      mediaSignature: 'sig123',
      manifestJson: { id: 'm1' },
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      owner: { id: 'user-123', email: 'user@test.local', name: 'User', role: 'USER' },
      recipient: { id: 'user-456', email: 'target@test.local', name: 'Target', role: 'USER' },
    };
    prisma.videoMessage.findUnique.mockResolvedValue(storedMessage);
    (cryptoService.verifyManifest as jest.Mock).mockReturnValue(false);

    const result = await videoService.getMessageDetails('m1', mockActor);

    expect(result.signatureValid).toBe(false);
    expect(result.canDelete).toBe(true);
  });

  it('openMessageStream rejette si signature invalide', async () => {
    prisma.videoMessage.findUnique.mockResolvedValue({
      id: 'm1',
      ownerId: 'user-123',
      recipientId: 'user-456',
      title: 'Read',
      description: null,
      originalFileName: 'video.mp4',
      mimeType: 'video/mp4',
      mediaSha256: 'hash123',
      mediaSignature: 'sig123',
      manifestJson: { id: 'm1' },
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      owner: { id: 'user-123', email: 'user@test.local', name: 'User', role: 'USER' },
      recipient: { id: 'user-456', email: 'target@test.local', name: 'Target', role: 'USER' },
    });
    (cryptoService.verifyManifest as jest.Mock).mockReturnValue(false);

    await expect(videoService.openMessageStream('m1', mockActor)).rejects.toThrow(
      badRequest('Signature invalide – intégrité compromise')
    );
  });

  it('removeMessage rejette si non proprietaire et non admin', async () => {
    prisma.videoMessage.findUnique.mockResolvedValue({
      id: 'm1',
      ownerId: 'another-user',
      recipientId: 'user-123',
      title: 'Owned by another',
      description: null,
      originalFileName: 'video.mp4',
      mimeType: 'video/mp4',
      mediaSha256: 'hash123',
      mediaSignature: 'sig123',
      manifestJson: { id: 'm1' },
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      owner: { id: 'another-user', email: 'other@test.local', name: 'Other', role: 'USER' },
      recipient: { id: 'user-123', email: 'user@test.local', name: 'User', role: 'USER' },
      storagePath: '/tmp/m1.mp4',
    });

    await expect(videoService.removeMessage('m1', mockActor)).rejects.toThrow(
      forbidden('Accès refusé')
    );
  });

  it('openMessageStream rejette si message introuvable', async () => {
    prisma.videoMessage.findUnique.mockResolvedValue(null);

    await expect(videoService.openMessageStream('missing', mockActor)).rejects.toThrow(
      notFound('Message introuvable ou supprimé')
    );
  });
});