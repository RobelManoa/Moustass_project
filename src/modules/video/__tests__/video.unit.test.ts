import * as fs from 'node:fs/promises';
import * as cryptoService from '../../../modules/crypto/crypto.service';
import * as auditService from '../../../modules/audit/audit.service';
import * as metadataService from '../../../modules/metadata/metadata.service';
import { badRequest, forbidden, notFound } from '../../../shared/http-errors';
import * as videoService from '../video.service';

jest.mock('node:fs/promises');
jest.mock('../../../infrastructure/prisma');
jest.mock('../crypto/crypto.service');
jest.mock('../audit/audit.service');
jest.mock('../metadata/metadata.service');

const { prisma } = require('../../../infrastructure/prisma');

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
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait télécharger un message vidéo', async () => {
    jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    (cryptoService.sha256 as jest.Mock).mockReturnValue('hash123');
    (cryptoService.buildMessageManifest as jest.Mock).mockReturnValue(mockManifest);
    (cryptoService.signManifest as jest.Mock).mockReturnValue('sig123');
    (auditService.recordAudit as jest.Mock).mockResolvedValue(undefined);

    prisma.videoMessage.create.mockResolvedValue({ id: 'msg-123', title: 'Test Video' });

    const result = await videoService.uploadMessage({
      actor: mockActor,
      file: mockFile,
      title: 'Test Video',
    });

    expect(result.id).toBe('msg-123');
    expect(auditService.recordAudit).toHaveBeenCalled();
  });

  it('devrait rejeter sans fichier', async () => {
    await expect(
      videoService.uploadMessage({ actor: mockActor, file: null as any, title: 'Test' })
    ).rejects.toThrow();
  });
});
