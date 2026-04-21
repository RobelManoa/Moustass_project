import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { createUser, deleteUser, listUsers, toPublicUser, updateUser } from '../user.service';
import { badRequest, notFound } from '../../../shared/http-errors';

jest.mock('bcryptjs');
jest.mock('../../../infrastructure/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const { prisma } = require('../../../infrastructure/prisma');

describe('User Service - Unit Tests', () => {
  const now = new Date('2026-04-17T10:00:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('toPublicUser masque le passwordHash', () => {
    const user = toPublicUser({
      id: 'u1',
      email: 'a@a.com',
      name: null,
      role: Role.USER,
      createdAt: now,
      updatedAt: now,
    });

    expect(user).toEqual({
      id: 'u1',
      email: 'a@a.com',
      name: '',
      role: Role.USER,
      createdAt: now,
      updatedAt: now,
    });
  });

  it('listUsers retourne des users publics', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: 'u1', email: 'a@a.com', name: null, role: Role.USER, createdAt: now, updatedAt: now },
    ]);

    const result = await listUsers();

    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('a@a.com');
  });

  it('createUser crée un nouvel utilisateur', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    prisma.user.create.mockResolvedValue({
      id: 'u2',
      email: 'new@a.com',
      name: 'New',
      role: Role.ADMIN,
      createdAt: now,
      updatedAt: now,
    });

    const result = await createUser({
      email: 'new@a.com',
      name: 'New',
      password: 'Admin@123',
      role: Role.ADMIN,
    });

    expect(result.email).toBe('new@a.com');
  });

  it('createUser rejette un email déjà existant', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u-existing' });

    await expect(
      createUser({
        email: 'existing@a.com',
        name: 'Existing',
        password: 'Admin@123',
        role: Role.USER,
      })
    ).rejects.toThrow(badRequest('Un utilisateur existe déjà avec cet email'));
  });

  it('updateUser met à jour un user existant', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.user.update.mockResolvedValue({
      id: 'u1',
      email: 'a@a.com',
      name: 'Updated',
      role: Role.USER,
      createdAt: now,
      updatedAt: now,
    });

    const result = await updateUser('u1', { name: 'Updated' });

    expect(result.name).toBe('Updated');
  });

  it('updateUser met à jour le password hash quand password est fourni', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
    prisma.user.update.mockResolvedValue({
      id: 'u1',
      email: 'a@a.com',
      name: 'A',
      role: Role.USER,
      createdAt: now,
      updatedAt: now,
    });

    await updateUser('u1', { password: 'NewPassword123!' });

    expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 12);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({ passwordHash: 'new-hash' }),
      })
    );
  });

  it('updateUser rejette un user introuvable', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(updateUser('missing', { name: 'X' })).rejects.toThrow(
      notFound('Utilisateur introuvable')
    );
  });

  it('deleteUser supprime un user existant', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.user.delete.mockResolvedValue({ id: 'u1' });

    const result = await deleteUser('u1');

    expect(result).toEqual({ deleted: true });
  });

  it('deleteUser rejette un user introuvable', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(deleteUser('missing')).rejects.toThrow(
      notFound('Utilisateur introuvable')
    );
  });
});
