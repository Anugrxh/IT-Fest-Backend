const express = require('express');
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
// If you implemented image upload middleware:
// const upload = require('../middleware/uploadMiddleware'); 

const router = express.Router();

// Public: Get all events
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);

// Protected: Create Event (Admin/Coordinator Only)
router.post(
  '/',
  authMiddleware.protect,
  authMiddleware.restrictTo('admin', 'coordinator'),
  uploadMiddleware.uploadEventBanner, // 1. Parse upload to memory
  uploadMiddleware.resizeEventBanner, // 2. Resize & Save to disk
  eventController.createEvent         // 3. Save info to Database
);

module.exports = router;