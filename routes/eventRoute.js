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
  // upload.single('banner'), // Uncomment if using upload middleware
  eventController.createEvent
);

module.exports = router;