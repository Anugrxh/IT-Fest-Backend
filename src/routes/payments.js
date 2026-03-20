const express = require('express');
const router = express.Router();
const { Cashfree, CFEnvironment } = require('cashfree-pg');
const prisma = require('../config/prisma');
const { generateQRCode } = require('../utils/qrHelper');
const { sendRegistrationEmail } = require('../utils/mailer');

// Fix memory leak warning
process.setMaxListeners(20);

// Initialize Cashfree once
Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment = process.env.CASHFREE_ENV === 'PROD'
  ? CFEnvironment.PRODUCTION
  : CFEnvironment.SANDBOX;

// POST /api/payments/order — Create Cashfree order
router.post('/order', async (req, res) => {
  const { registrationId, amount } = req.body;

  try {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { participants: true },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.status === 'confirmed') {
      return res.status(400).json({ error: 'Already paid for this registration' });
    }

    const leader = registration.participants.find(p => p.isLeader)
                   ?? registration.participants[0];

    const orderData = {
      order_id: `order_${registrationId.slice(0, 20)}_${Date.now()}`,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: registrationId.slice(0, 36),
        customer_name: leader.name,
        customer_email: leader.email,
        customer_phone: leader.phone,
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/payment-status?registration_id=${registrationId}`,
      },
      order_note: `${registration.eventName} Registration`,
    };

    const response = await Cashfree.PGCreateOrder('2023-08-01', orderData);
    const order = response.data;

    await prisma.payment.upsert({
      where: { registrationId },
      update: {
        amount,
        razorpayOrderId: order.order_id,
        status: 'pending',
      },
      create: {
        registrationId,
        amount,
        razorpayOrderId: order.order_id,
        status: 'pending',
      },
    });

    res.json({
      orderId: order.order_id,
      orderToken: order.payment_session_id,
      amount: order.order_amount,
      currency: order.order_currency,
      appId: process.env.CASHFREE_APP_ID,
    });

  } catch (err) {
    console.error(err?.response?.data || err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// POST /api/payments/verify — Verify payment after user pays
router.post('/verify', async (req, res) => {
  const { orderId, registrationId } = req.body;

  try {
    // Fetch order status from Cashfree
    const response = await Cashfree.PGFetchOrder('2023-08-01', orderId);
    const order = response.data;

    if (order.order_status !== 'PAID') {
      return res.status(400).json({
        error: 'Payment not completed',
        status: order.order_status,
      });
    }

    // Get payment details
    const paymentsResponse = await Cashfree.PGOrderFetchPayments('2023-08-01', orderId);
    const payment = paymentsResponse.data?.[0];

    // Update DB atomically
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { registrationId },
        data: {
          razorpayPaymentId: payment?.cf_payment_id?.toString(),
          status: 'success',
        },
      });

      await tx.registration.update({
        where: { id: registrationId },
        data: { status: 'confirmed' },
      });
    });

    // Generate QR
    const fullRegistration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { participants: true },
    });

    const { qrDataURL } = await generateQRCode(registrationId, fullRegistration.eventId);

    // Send email (fire and forget)
    const leader = fullRegistration.participants.find(p => p.isLeader)
                   ?? fullRegistration.participants[0];

    sendRegistrationEmail({
      to: leader.email,
      registrationId,
      eventName: fullRegistration.eventName,
      isTeamEvent: fullRegistration.isTeamEvent,
      teamName: fullRegistration.teamName,
      participants: fullRegistration.participants,
      qrDataURL,
    }).catch(err => console.error('Email failed:', err));

    res.json({
      message: 'Payment verified successfully',
      status: 'confirmed',
      qrCode: qrDataURL,
    });

  } catch (err) {
    console.error(err?.response?.data || err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// GET /api/payments/status/:registrationId
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