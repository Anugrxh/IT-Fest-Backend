const { sequelize, Registration, Event, User } = require('../models');

exports.registerForEvent = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { eventId, teamName, memberIds } = req.body;
    const userId = req.user.id;

    // ... (Keep your existing validations: Event exists, Team Size, Duplicate check) ...
    const event = await Event.findByPk(eventId, { transaction: t });
    // Assume validations pass...

    // A. Check if Paid Event
    const isPaidEvent = event.registrationFee > 0;
    
    let razorpayOrder = null;
    let status = 'approved'; // Default for free events

    if (isPaidEvent) {
      status = 'pending'; // Waiting for payment
      
      // Create Order with Razorpay
      const options = {
        amount: event.registrationFee * 100, // Amount in paise (100 INR = 10000 paise)
        currency: "INR",
        receipt: `rcpt_${Date.now()}_${userId.substring(0,5)}`
      };
      razorpayOrder = await razorpay.orders.create(options);
    }

    // B. Create Registration in DB
    const newRegistration = await Registration.create({
      eventId,
      leaderId: userId,
      teamName,
      status: isPaidEvent ? 'pending' : 'approved',
      paymentStatus: isPaidEvent ? 'pending' : 'paid',
      paymentOrderId: razorpayOrder ? razorpayOrder.id : null,
      amountPaid: isPaidEvent ? event.registrationFee : 0
    }, { transaction: t });

    // ... (Add Members logic here) ...

    await t.commit();

    res.status(201).json({
      status: 'success',
      data: {
        registration: newRegistration,
        // Frontend checks this. If exists, open Razorpay popup. If null, show "Success".
        paymentConfig: razorpayOrder ? {
          key: process.env.RAZORPAY_KEY_ID,
          amount: razorpayOrder.amount,
          orderId: razorpayOrder.id,
          currency: razorpayOrder.currency,
          name: "IT Fest 2026",
          description: `Registration for ${event.title}`
        } : null
      }
    });

  } catch (err) {
    await t.rollback();
    res.status(400).json({ error: err.message });
  }
};
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // A. Cryptographic Verification (Security Critical!)
    // We hash the order_id + payment_id and compare it with the signature sent by Razorpay
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ status: 'fail', message: 'Invalid Signature' });
    }

    // B. Update Database
    const registration = await Registration.findOne({ 
      where: { paymentOrderId: razorpay_order_id } 
    });

    if (!registration) return res.status(404).json({ message: 'Registration not found' });

    registration.paymentId = razorpay_payment_id;
    registration.paymentStatus = 'paid';
    registration.status = 'approved'; // Now valid!
    await registration.save();

    res.status(200).json({ status: 'success', message: 'Payment Verified' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.findAll({
      where: { leaderId: req.user.id },
      include: [
        { model: Event, attributes: ['title', 'venue', 'dateTime'] },
        { model: User, as: 'Members', attributes: ['name', 'email'] } // See team members
      ]
    });
    res.status(200).json({ status: 'success', results: registrations.length, data: registrations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};