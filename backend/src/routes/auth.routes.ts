import express from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Register a new user
router.post('/register', authController.register);

// Login a user
router.post('/login', authController.login);

// Get user profile (protected route)
router.get('/profile', authenticate, authController.getProfile);

export default router; 