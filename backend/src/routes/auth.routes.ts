import { Router } from 'express';
import { register, login, logout, refresh, getMe, forgotPassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.get('/me', authenticate, getMe);

export default router;
