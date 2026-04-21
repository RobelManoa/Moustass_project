import { getMessageById, getMessageByIdForActor, listMessagesForActor } from '../metadata.service';

jest.mock('../../../infrastructure/prisma', () => ({
  prisma: {
    videoMessage: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const { prisma } = require('../../../infrastructure/prisma');

describe('Metadata Service - Unit Tests', () => {
  const ownerId = 'user-123';
  const adminId = 'admin-123';

  const mockMessage = {
    id: 'msg-123',
    ownerId,
    title: 'Message vidéo',
    deletedAt: null,
    createdAt: new Date('2026-04-16T10:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getMessageById devrait retourner un message par id', async () => {
    prisma.videoMessage.findUnique.mockResolvedValue(mockMessage);

    const result = await getMessageById('msg-123');

    expect(prisma.videoMessage.findUnique).toHaveBeenCalledWith({
      where: { id: 'msg-123' },
    });
    expect(result).toBe(mockMessage);
  });

  it('getMessageByIdForActor devrait retourner le message pour le propriétaire', async () => {
    prisma.videoMessage.findUnique.mockResolvedValue(mockMessage);

    const result = await getMessageByIdForActor('msg-123', ownerId, false);

    expect(result).toBe(mockMessage);
  });

  it('getMessageByIdForActor devrait retourner le message pour un admin', async () => {
    prisma.videoMessage.findUnique.mockResolvedValue(mockMessage);

    const result = await getMessageByIdForActor('msg-123', adminId, true);

    expect(result).toBe(mockMessage);
  });

  it('getMessageByIdForActor devrait retourner null si accès refusé', async () => {
    prisma.videoMessage.findUnique.mockResolvedValue(mockMessage);

    const result = await getMessageByIdForActor('msg-123', 'other-user', false);

    expect(result).toBeNull();
  });

  it('getMessageByIdForActor devrait retourner null si message introuvable', async () => {
    prisma.videoMessage.findUnique.mockResolvedValue(null);

    const result = await getMessageByIdForActor('missing', ownerId, false);

    expect(result).toBeNull();
  });

  it('listMessagesForActor devrait filtrer les messages du propriétaire', async () => {
    prisma.videoMessage.findMany.mockResolvedValue([mockMessage]);

    const result = await listMessagesForActor(ownerId, false);

    expect(prisma.videoMessage.findMany).toHaveBeenCalledWith({
      where: { ownerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([mockMessage]);
  });

  it('listMessagesForActor devrait retourner tous les messages pour un admin', async () => {
    prisma.videoMessage.findMany.mockResolvedValue([mockMessage]);

    const result = await listMessagesForActor(adminId, true);

    expect(prisma.videoMessage.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([mockMessage]);
  });
});
