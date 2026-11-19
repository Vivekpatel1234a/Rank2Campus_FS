import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, me } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
const router = Router();
router.post('/register', [body('name').trim().isLength({ min: 2, max: 80 }), body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 8 })], register);
router.post('/login', login);
router.get('/me', protect, me);
export default router;
