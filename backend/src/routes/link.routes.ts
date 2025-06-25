import express from 'express';
import * as linkController from '../controllers/link.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Preview a link (must come before routes with :id)
router.get('/preview', linkController.previewLink);

// Create a link
router.post('/', linkController.createLink);

// Get all links
router.get('/', linkController.getLinks);

// Get a link by ID
router.get('/:id', linkController.getLinkById);

// Update a link
router.put('/:id', linkController.updateLink);

// Delete a link
router.delete('/:id', linkController.deleteLink);

export default router; 