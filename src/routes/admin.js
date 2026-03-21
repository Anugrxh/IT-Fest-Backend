const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { superAdminAuth, adminAuth } = require('../middleware/adminAuth');

// ── Super Admin Only Routes ────────────────────────────

// GET /api/admin/stats
router.get('/stats', superAdminAuth, async (req, res) => {
  try {
    const [total, confirmed, pending, checkedIn] = await Promise.all([
      prisma.registration.count(),
      prisma.registration.count({ where: { status: 'confirmed' } }),
      prisma.registration.count({ where: { status: 'pending' } }),
      prisma.registration.count({ where: { checkedIn: true } }),
    ]);

    const revenue = await prisma.payment.aggregate({
      where: { status: 'success' },
      _sum: { amount: true },
    });

    res.json({
      total,
      confirmed,
      pending,
      checkedIn,
      revenue: revenue._sum.amount ?? 0,
    });

  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/admin/registrations — all registrations including pending
router.get('/registrations', superAdminAuth, async (req, res) => {
  try {
    const { status, eventId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (eventId) where.eventId = eventId;

    const registrations = await prisma.registration.findMany({
      where,
      include: { participants: true, payment: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ count: registrations.length, registrations });

  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// DELETE /api/admin/registrations/:id
router.delete('/registrations/:id', superAdminAuth, async (req, res) => {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: req.params.id },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    await prisma.payment.deleteMany({
      where: { registrationId: req.params.id },
    });

    await prisma.participant.deleteMany({
      where: { registrationId: req.params.id },
    });

    await prisma.registration.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Registration deleted successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete registration' });
  }
});

// ── Admin + Super Admin Routes ─────────────────────────

// GET /api/admin/confirmed — confirmed registrations only
router.get('/confirmed', adminAuth, async (req, res) => {
  try {
    const { eventId } = req.query;
    const where = { status: 'confirmed' };
    if (eventId) where.eventId = eventId;

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        participants: true,
        payment: {
          select: {
            amount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ count: registrations.length, registrations });

  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /api/admin/checkin — manual check-in by admin
router.post('/checkin', adminAuth, async (req, res) => {
  const { registrationId } = req.body;

  try {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { participants: true },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.status !== 'confirmed') {
      return res.status(400).json({ error: 'Registration not confirmed yet' });
    }

    if (registration.checkedIn) {
      return res.status(400).json({
        error: 'Already checked in',
        checkedInAt: registration.checkedInAt,
      });
    }

    await prisma.registration.update({
      where: { id: registrationId },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
      },
    });

    res.json({
      message: 'Checked in successfully',
      registration: {
        eventName: registration.eventName,
        teamName: registration.teamName,
        participants: registration.participants,
      },
    });

  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/admin/role — verify password and return role
// Frontend uses this to determine what to show
router.get('/role', adminAuth, async (req, res) => {
  res.json({ role: req.adminRole });
});

module.exports = router;