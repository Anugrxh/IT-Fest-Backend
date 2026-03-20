const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { verifyQRToken, generateQRCode } = require('../utils/qrHelper');

// POST /api/checkin — scan QR and mark as checked in
router.post('/', async (req, res) => {
  const { token } = req.body;

  try {
    // Verify the QR token
    let decoded;
    try {
      decoded = verifyQRToken(token.trim());
    } catch {
      return res.status(400).json({ error: 'Invalid or expired QR code' });
    }

    const { registrationId } = decoded;

    // Find registration
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { participants: true, payment: true },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Check if payment is confirmed
    if (registration.status !== 'confirmed') {
      return res.status(400).json({ error: 'Payment not completed for this registration' });
    }

    // Check if already checked in
    if (registration.checkedIn) {
      return res.status(400).json({
        error: 'Already checked in',
        checkedInAt: registration.checkedInAt,
        registration: {
          eventName: registration.eventName,
          teamName: registration.teamName,
          participants: registration.participants.map(p => ({
            name: p.name,
            college: p.college,
            isLeader: p.isLeader,
          })),
        },
      });
    }

    // Mark as checked in
    await prisma.registration.update({
      where: { id: registrationId },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Check-in successful!',
      registration: {
        eventName: registration.eventName,
        isTeamEvent: registration.isTeamEvent,
        teamName: registration.teamName,
        participants: registration.participants.map(p => ({
          name: p.name,
          college: p.college,
          isLeader: p.isLeader,
        })),
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/checkin/:registrationId — get check-in status
router.get('/:registrationId', async (req, res) => {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: req.params.registrationId },
      include: { participants: true },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    res.json({
      checkedIn: registration.checkedIn,
      checkedInAt: registration.checkedInAt,
      eventName: registration.eventName,
      participants: registration.participants.map(p => ({
        name: p.name,
        college: p.college,
        isLeader: p.isLeader,
      })),
    });

  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/checkin/qr/:registrationId — regenerate QR if needed
router.get('/qr/:registrationId', async (req, res) => {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: req.params.registrationId },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.status !== 'confirmed') {
      return res.status(400).json({ error: 'Payment not confirmed yet' });
    }

    const { qrDataURL } = await generateQRCode(registration.id, registration.eventId);

    res.json({ qrCode: qrDataURL });

  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;