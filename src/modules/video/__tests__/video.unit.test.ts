import * as fs from 'node:fs/promises';

import * as cryptoService from '../../crypto/crypto.service';
import * as auditService from '../../audit/audit.service';
import * as videoService from '../video.service';

// ====================== MOCKS (à mettre tout en haut) ======================

jest.mock('node:fs/promises');
jest.mock('../../crypto/crypto.service');
jest.mock('../../audit/audit.service');

// On mock Prisma avec des jest.fn() directement dans le factory
jest.mock('../../../infrastructure/prisma', () => ({
  prisma: {
    videoMessage: {
      create: jest.fn(),
      update: jest.fn(),
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
    title: 'Test Video',
    description: 'Test Description',
    originalFileName: 'video.mp4',
    mimeType: 'video/mp4',
    size: 5000000,
    mediaSha256: 'hash123',
    uploadedAt: new Date().toISOString(),
  };

  // Récupération des mocks après le jest.mock()
  const { prisma } = require('../../../infrastructure/prisma');

  beforeEach(() => {
    jest.clearAllMocks();
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
    prisma.videoMessage.create.mockResolvedValue({
      id: 'msg-123',
      title: 'Test Video',
    });

    const result = await videoService.uploadMessage({
      actor: mockActor,
      file: mockFile,
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
        title: 'Test Video',
      })
    ).rejects.toThrow();
  });
});