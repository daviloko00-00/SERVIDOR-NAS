import express from 'express';
const router = express.Router();
import * as authController from '../controllers/authController.js';
import auth from '../middlewares/auth.js';

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.me);

export default router; // Isso resolve o erro do "default"