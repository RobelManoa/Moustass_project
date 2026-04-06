import request from 'supertest';
import { app } from '../../../app';
import { unauthorized } from '../../../shared/http-errors';
import { signAuthToken } from '../../../shared/security/jwt';
import * as authService from '../auth.service';

jest.mock('../auth.service', () => ({
  login: jest.fn(),
  me: jest.fn(),
}));

describe('Auth Module - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      (authService.login as jest.Mock).mockResolvedValue({
        token: 'mock-token',
        user: {
          id: 'test-user-1',
          email: 'test@client.local',
          role: 'USER',
          name: 'Test User',
        },
      });

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@client.local',
          password: 'test123',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('test@client.local');
    });

    it('should return 401 with invalid credentials', async () => {
      (authService.login as jest.Mock).mockRejectedValue(
        unauthorized('Identifiants invalides')
      );

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@client.local',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return user info with valid token', async () => {
      const token = signAuthToken({
        userId: 'test-user-1',
        email: 'test@client.local',
        role: 'USER',
        clientName: 'Client A',
      });

      (authService.me as jest.Mock).mockResolvedValue({
        id: 'test-user-1',
        email: 'test@client.local',
        role: 'USER',
        name: 'Test User',
      });

      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('test@client.local');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
