import * as authService from '../auth.service';
import { unauthorized } from '../../../shared/http-errors';
import { signAuthToken, verifyAuthToken } from '../../../shared/security/jwt';
import bcrypt from 'bcryptjs';

// Mock Prisma
jest.mock('../../../infrastructure/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

const { prisma } = require('../../../infrastructure/prisma');

describe('Auth Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login()', () => {
    it('should return token and user when credentials are valid', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@client.local',
        passwordHash: 'hashed-password',
        role: 'USER',
        name: 'Test User',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login({
        email: ' TEST@CLIENT.LOCAL ',
        password: 'password123',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@client.local' },
      });

      expect(result).toHaveProperty('token');
      expect(result.user).toHaveProperty('id', 'user-123');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw unauthorized when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login({ email: 'unknown@test.com', password: 'pass' })
      ).rejects.toThrow(unauthorized('Identifiants invalides'));
    });

    it('should throw unauthorized when password is wrong', async () => {
      const mockUser = { id: '1', email: 'test@test.com', passwordHash: 'hash' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({ email: 'test@test.com', password: 'wrong' })
      ).rejects.toThrow(unauthorized('Identifiants invalides'));
    });
  });

  describe('me()', () => {
    it('should return public user when found', async () => {
      const now = new Date('2026-04-21T12:00:00.000Z');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'test@client.local',
        passwordHash: 'secret-hash',
        role: 'USER',
        name: null,
        createdAt: now,
        updatedAt: now,
      });

      const result = await authService.me('user-123');

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@client.local',
        name: '',
        role: 'USER',
        createdAt: now,
        updatedAt: now,
      });
    });

    it('should throw unauthorized when user is missing', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.me('missing-id')).rejects.toThrow(
        unauthorized('Utilisateur introuvable')
      );
    });
  });

  describe('JWT Functions', () => {
    it('should sign and verify token correctly', () => {
      const claims = {
        userId: 'user-123',
        email: 'test@client.local',
        role: 'USER' as const,
        clientName: 'Client A',
      };

      const token = signAuthToken(claims);
      const decoded = verifyAuthToken(token);

      expect(decoded.userId).toBe(claims.userId);
      expect(decoded.email).toBe(claims.email);
      expect(decoded.role).toBe(claims.role);
    });
  });
});