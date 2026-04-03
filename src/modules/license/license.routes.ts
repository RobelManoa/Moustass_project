import { Router } from 'express';
import { authenticate, requireRole } from '../../shared/middleware/authenticate';
import { validateBody } from '../../shared/middleware/validate';
import { licenseCreateSchema, licenseUpdateSchema } from './license.schemas';
import { createLicense, deleteLicense, listLicenses, updateLicense } from './license.controller';

const router = Router();

router.get('/', authenticate, requireRole('ADMIN'), listLicenses);
router.post('/', authenticate, requireRole('ADMIN'), validateBody(licenseCreateSchema), createLicense);
router.put('/:id', authenticate, requireRole('ADMIN'), validateBody(licenseUpdateSchema), updateLicense);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteLicense);

export default router;