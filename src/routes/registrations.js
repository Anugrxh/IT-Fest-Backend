const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

router.post('/', async (req, res) => {
  const { eventId, eventName, isTeamEvent, teamName, participant, participants } = req.body;

  try {
    // Build participants array uniformly
    const members = isTeamEvent ? participants : [{ ...participant, isLeader: true }];

    // Basic validation
    for (const m of members) {
      if (!m.name || !m.email || !m.phone || !m.college || !m.food) {
        return res.status(400).json({ error: 'All participant fields are required' });
      }
    }

    // Create registration + participants in one atomic transaction
    const registration = await prisma.$transaction(async (tx) => {
      const reg = await tx.registration.create({
        data: {
          eventId,
          eventName,
          isTeamEvent: !!isTeamEvent,
          teamName: teamName || null,
          participants: {
            create: members.map((m) => ({
              name: m.name,
              email: m.email,
              phone: m.phone,
              college: m.college,
              food: m.food,
              isLeader: m.isLeader || false,
            })),
          },
        },
        include: { participants: true },
      });
      return reg;
    });

    res.status(201).json({
      message: 'Registration created successfully',
      registrationId: registration.id,
      registration,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Get a single registration by ID (useful for confirmation page)
router.get('/:id', async (req, res) => {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: req.params.id },
      include: { participants: true, payment: true },
    });
    if (!registration) return res.status(404).json({ error: 'Registration not found' });

    // Strip sensitive payment internals and participant PII
    res.json({
      id: registration.id,
      eventId: registration.eventId,
      eventName: registration.eventName,
      isTeamEvent: registration.isTeamEvent,
      teamName: registration.teamName,
      status: registration.status,
      createdAt: registration.createdAt,
      participants: registration.participants.map(p => ({
        name: p.name,
        college: p.college,
        isLeader: p.isLeader,
      })),
      payment: registration.payment ? {
        status: registration.payment.status,
        amount: registration.payment.amount,
      } : null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;