const express = require('express');
const registrationController = require('../controllers/registrationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All registration routes require login
router.use(authMiddleware.protect);

router.post('/', registrationController.registerForEvent);
router.get('/my-registrations', registrationController.getMyRegistrations);

module.exports = router;