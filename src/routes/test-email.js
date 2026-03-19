const express = require('express');
const router = express.Router();
const { sendRegistrationEmail } = require('../utils/mailer');

// Test email endpoint
router.post('/', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required in request body' });
  }

  try {
    // Generate a simple test QR code (1x1 pixel PNG in base64)
    const testQR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    await sendRegistrationEmail({
      to: email,
      registrationId: 'TEST-' + Date.now(),
      eventName: 'Test Event - Code Sprint',
      isTeamEvent: true,
      teamName: 'Test Team Alpha',
      participants: [
        {
          name: 'John Doe',
          email: email,
          phone: '9876543210',
          college: 'Test College',
          food: 'veg',
          isLeader: true,
        },
        {
          name: 'Jane Smith',
          email: 'anugrahmv007@gmail.com',
          phone: '9876543211',
          college: 'Test College',
          food: 'non-veg',
          isLeader: false,
        },
      ],
      qrDataURL: testQR,
    });

    res.json({ 
      success: true, 
      message: `Test email sent successfully to ${email}`,
      note: 'Check your inbox (and spam folder)'
    });
  } catch (err) {
    console.error('Test email error:', err);
    res.status(500).json({ 
      error: 'Failed to send email', 
      details: err.message,
    });
  }
});

module.exports = router;
