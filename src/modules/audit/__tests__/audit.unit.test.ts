import { getAuditById, listAudits, recordAudit } from '../audit.service';

jest.mock('../../../infrastructure/prisma', () => ({
  prisma: {
    audit: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

const { prisma } = require('../../../infrastructure/prisma');

describe('Audit Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('recordAudit crée un audit', async () => {
    const mockAudit = { id: 'a1', action: 'VIDEO_UPLOADED' };
    prisma.audit.create.mockResolvedValue(mockAudit);

    const result = await recordAudit({
      actorId: 'u1',
      action: 'VIDEO_UPLOADED',
      resource: 'video_message',
      resourceId: 'm1',
    });

    expect(prisma.audit.create).toHaveBeenCalled();
    expect(result).toBe(mockAudit);
  });

  it('listAudits retourne les audits ordonnés', async () => {
    prisma.audit.findMany.mockResolvedValue([{ id: 'a1' }]);

    const result = await listAudits(10);

    expect(prisma.audit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
    );
    expect(result).toEqual([{ id: 'a1' }]);
  });

  it('getAuditById retourne un audit', async () => {
    prisma.audit.findUnique.mockResolvedValue({ id: 'a1' });

    const result = await getAuditById('a1');

    expect(prisma.audit.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'a1' } })
    );
    expect(result).toEqual({ id: 'a1' });
  });
});
