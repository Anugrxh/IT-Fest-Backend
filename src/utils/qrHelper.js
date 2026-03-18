const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

// Generate a signed token to embed in QR
function generateQRToken(registrationId, eventId) {
  return jwt.sign(
    { registrationId, eventId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Verify the scanned QR token
function verifyQRToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Generate QR code as base64 image
async function generateQRCode(registrationId, eventId) {
  const token = generateQRToken(registrationId, eventId);
  const qrDataURL = await QRCode.toDataURL(token, {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 2,
  });
  return { qrDataURL, token };
}

module.exports = { generateQRCode, verifyQRToken };