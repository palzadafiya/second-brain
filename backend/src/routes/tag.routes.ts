import express from 'express';
import * as tagController from '../controllers/tag.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Get all tags (no authentication required)
router.get('/', tagController.getAllTags);

// Get links by tag (authentication required)
router.get('/:tagName/links', authenticate, tagController.getLinksByTag);

export default router; 