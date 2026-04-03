import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../shared/middleware/authenticate';
import { upload, read, remove } from './video.controller';

const router = Router();
const uploadMiddleware = multer({ storage: multer.memoryStorage(), limits: { fileSize: 250 * 1024 * 1024 } });

router.post('/upload', authenticate, uploadMiddleware.single('file'), upload);
router.get('/:id', authenticate, read);
router.delete('/:id', authenticate, remove);

export default router;