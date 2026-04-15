import type { Request, Response } from 'express';
import { upload, read, remove } from '../video.controller';
import * as videoService from '../video.service';

jest.mock('../video.service');

const mockService = videoService as jest.Mocked<typeof videoService>;

describe('Video Controller - Integration Tests', () => {
  const mockActor = { userId: 'user-123', role: 'USER' as const };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('upload devrait retourner 201', async () => {
    mockService.uploadMessage.mockResolvedValue({ id: 'msg-123', title: 'Test' } as any);

    const req = {
      auth: mockActor,
      file: { originalname: 'video.mp4' },
      body: { title: 'Test' },
    } as unknown as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await upload(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('read devrait définir les headers', async () => {
    mockService.openMessageStream.mockResolvedValue({
      id: 'msg-123',
      originalFileName: 'video.mp4',
      mimeType: 'video/mp4',
      storagePath: '/path/to/video',
    } as any);

    jest.spyOn(videoService, 'createMessageReadStream').mockReturnValue({
      pipe: jest.fn(),
    } as any);

    const req = { auth: mockActor, params: { id: 'msg-123' } } as unknown as Request;
    const res = {
      setHeader: jest.fn(),
      pipe: jest.fn(),
    } as unknown as Response;

    await read(req, res, jest.fn());

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'video/mp4');
  });

  it('remove devrait retourner deleted: true', async () => {
    mockService.removeMessage.mockResolvedValue({ deleted: true });

    const req = { auth: mockActor, params: { id: 'msg-123' } } as unknown as Request;
    const res = { json: jest.fn() } as unknown as Response;

    await remove(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith({ deleted: true });
  });
});
