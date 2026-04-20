import request from 'supertest';
import { app } from '../../../app';

describe('Video E2E', () => {
  it('GET /health devrait retourner 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /messages/upload sans token devrait retourner 401 ou 404', async () => {
    const res = await request(app).post('/messages/upload');
    expect([401, 404]).toContain(res.status);
  });
});
