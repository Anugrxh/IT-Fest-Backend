const express = require('express');
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware'); 

const router = express.Router();

// --- Public Routes ---
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);

// --- Protected Routes (Admin & Coordinators) ---
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin', 'coordinator'));

// Create: Supports Image Upload
router.post(
  '/', 
  uploadMiddleware.uploadEventBanner, 
  uploadMiddleware.resizeEventBanner, 
  eventController.createEvent
);

// Update: Supports Image Upload (PATCH is for partial updates)
router.patch(
  '/:id', 
  uploadMiddleware.uploadEventBanner, 
  uploadMiddleware.resizeEventBanner, 
  eventController.updateEvent
);

// Delete
router.delete('/:id', eventController.deleteEvent);

module.exports = router;