import { createLicense, deleteLicense, listLicenses, updateLicense } from '../license.service';

jest.mock('../../../infrastructure/prisma', () => ({
  prisma: {
    license: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const { prisma } = require('../../../infrastructure/prisma');

describe('License Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listLicenses retourne la liste', async () => {
    prisma.license.findMany.mockResolvedValue([{ id: 'l1' }]);

    const result = await listLicenses();

    expect(result).toEqual([{ id: 'l1' }]);
  });

  it('createLicense crée une licence', async () => {
    prisma.license.create.mockResolvedValue({ id: 'l1' });

    const result = await createLicense({
      clientName: 'Client',
      serialNumber: 'SER-1',
    });

    expect(prisma.license.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 'l1' });
  });

  it('updateLicense met à jour une licence existante', async () => {
    prisma.license.findUnique.mockResolvedValue({ id: 'l1' });
    prisma.license.update.mockResolvedValue({ id: 'l1', clientName: 'New' });

    const result = await updateLicense('l1', { clientName: 'New' });

    expect(result).toEqual({ id: 'l1', clientName: 'New' });
  });

  it('deleteLicense supprime une licence existante', async () => {
    prisma.license.findUnique.mockResolvedValue({ id: 'l1' });
    prisma.license.delete.mockResolvedValue({ id: 'l1' });

    const result = await deleteLicense('l1');

    expect(result).toEqual({ deleted: true });
  });
});
