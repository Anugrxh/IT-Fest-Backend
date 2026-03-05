const express = require('express');
const router = express.Router();

// placeholder route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route working' });
});

module.exports = router; // ← this line is critical