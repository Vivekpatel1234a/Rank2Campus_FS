import { Router } from 'express';
import { listAdmissionRounds } from '../controllers/admin.controller.js';

const router = Router();
router.get('/', listAdmissionRounds);

export default router;
