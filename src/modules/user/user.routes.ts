import { Router } from 'express';
import { createUserSchema, updateUserSchema } from './user.schemas';
import { createUser, deleteUser, listUsers, updateUser } from './user.controller';
import { authenticate, requireRole } from '../../shared/middleware/authenticate';
import { validateBody } from '../../shared/middleware/validate';

const router = Router();

router.get('/', authenticate, requireRole('ADMIN'), listUsers);
router.post('/', authenticate, requireRole('ADMIN'), validateBody(createUserSchema), createUser);
router.put('/:id', authenticate, requireRole('ADMIN'), validateBody(updateUserSchema), updateUser);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteUser);

export default router;