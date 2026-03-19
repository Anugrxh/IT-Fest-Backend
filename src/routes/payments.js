const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const prisma = require('../config/prisma');
const { generateQRCode } = require('../utils/qrHelper');
const { sendRegistrationEmail } = require('../utils/mailer');

// Step 1: Create a Razorpay order
router.post('/order', async (req, res) => {
  const { registrationId, amount } = req.body;
  // amount should be in paise (e.g. ₹500 = 50000 paise)

  try {
    // Check registration exists
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.status === 'confirmed') {
      return res.status(400).json({ error: 'Already paid for this registration' });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount, // in paise
      currency: 'INR',
      receipt: `rcpt_${registrationId.slice(0, 35)}`,
    });

    // Save payment record in DB
    await prisma.payment.create({
      data: {
        registrationId,
        amount: amount / 100, // store in rupees
        razorpayOrderId: order.id,
        status: 'pending',
      },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Step 2: Verify payment after user pays
router.post('/verify', async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, registrationId } = req.body;

  try {
    // Verify signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update payment and registration atomically
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { registrationId },
        data: {
          razorpayPaymentId,
          razorpaySignature,
          status: 'success',
        },
      });

      await tx.registration.update({
        where: { id: registrationId },
        data: { status: 'confirmed' },
      });
    });

    // Fetch full registration with participants for QR + email
    const fullRegistration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { participants: true },
    });

    const { qrDataURL } = await generateQRCode(registrationId, fullRegistration.eventId);

    // Get leader/solo participant for email
    const leader = fullRegistration.participants.find(p => p.isLeader)
                ?? fullRegistration.participants[0];

    // Send email with better error logging
    sendRegistrationEmail({
      to: leader.email,
      registrationId,
      eventName: fullRegistration.eventName,
      isTeamEvent: fullRegistration.isTeamEvent,
      teamName: fullRegistration.teamName,
      participants: fullRegistration.participants,
      qrDataURL,
    }).catch(err => {
      console.error('❌ Email failed:', err.message);
      console.error('Full error:', err);
    });

    res.json({
      message: 'Payment verified successfully',
      status: 'confirmed',
      qrCode: qrDataURL, // base64 PNG — frontend can display directly
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Get payment status for a registration
router.get('/status/:registrationId', async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { registrationId: req.params.registrationId },
    });

    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;