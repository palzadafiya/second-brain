import express from 'express';
import * as chatController from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Chat with links
router.post('/', chatController.chatWithLinks);

export default router; 