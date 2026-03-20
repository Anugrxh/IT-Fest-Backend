const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Required for Railway (proxy) — reads real client IP
app.set('trust proxy', 1);

app.use(cors([
  'http://localhost:3000',
  'https://zeitgeistkuc.in',
  'https://it-fest-frontend.vercel.app/',
]));
app.use(express.json());

// General limit — all /api routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Strict limit — registration & payment routes
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
});

// Relaxed limit — check-in scanner hits this frequently
const checkinLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many check-in requests.' },
});

app.use('/api', generalLimiter);
app.use('/api/registrations', paymentLimiter);
app.use('/api/payments', paymentLimiter);
app.use('/api/checkin', checkinLimiter);

const prisma = require('./config/prisma');

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'unreachable', timestamp: new Date().toISOString() });
  }
});


app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/checkin', require('./routes/checkin'));
app.use('/api/test-email', require('./routes/test-email'));

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});