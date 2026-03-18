const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendRegistrationEmail({ to, registrationId, eventName, isTeamEvent, teamName, participants, qrDataURL }) {
  // Build participants table rows
  const participantRows = participants.map((p, i) => `
    <tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#ffffff'}">
      <td style="padding:10px;border:1px solid #ddd">${p.isLeader ? '👑 ' : ''}${p.name}</td>
      <td style="padding:10px;border:1px solid #ddd">${p.email}</td>
      <td style="padding:10px;border:1px solid #ddd">${p.phone}</td>
      <td style="padding:10px;border:1px solid #ddd">${p.college}</td>
      <td style="padding:10px;border:1px solid #ddd">${p.food === 'veg' ? '🥦 Veg' : '🍗 Non-Veg'}</td>
    </tr>
  `).join('');

  const teamSection = isTeamEvent ? `
    <p style="font-size:16px"><strong>Team Name:</strong> ${teamName}</p>
  ` : '';

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:10px;overflow:hidden">
      
      <!-- Header -->
      <div style="background:#00af5a;padding:30px;text-align:center">
        <h1 style="color:white;margin:0">${process.env.FEST_NAME}</h1>
        <p style="color:white;margin:5px 0">Registration Confirmed! 🎉</p>
      </div>

      <!-- Body -->
      <div style="padding:30px">
        <h2 style="color:#333">Hey ${participants.find(p => p.isLeader)?.name || participants[0].name}!</h2>
        <p>Your registration for <strong>${eventName}</strong> is confirmed.</p>
        
        <div style="background:#f0fff8;border-left:4px solid #00af5a;padding:15px;margin:20px 0;border-radius:4px">
          <p style="margin:0"><strong>Registration ID:</strong> ${registrationId}</p>
          <p style="margin:5px 0"><strong>Event:</strong> ${eventName}</p>
          ${teamSection}
        </div>

        <!-- Participants Table -->
        <h3 style="color:#333">Participant Details</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr style="background:#00af5a;color:white">
              <th style="padding:10px;text-align:left">Name</th>
              <th style="padding:10px;text-align:left">Email</th>
              <th style="padding:10px;text-align:left">Phone</th>
              <th style="padding:10px;text-align:left">College</th>
              <th style="padding:10px;text-align:left">Food</th>
            </tr>
          </thead>
          <tbody>
            ${participantRows}
          </tbody>
        </table>

        <!-- QR Section -->
        <div style="text-align:center;margin:30px 0;background:#f0fff8;border:2px dashed #00af5a;border-radius:8px;padding:25px">
          <h3 style="color:#333;margin-top:0">Your Entry QR Code</h3>
          <p style="color:#666;font-size:14px;margin:0 0 12px">Your QR code is attached to this email as a PNG file.</p>
          <div style="background:#00af5a;color:white;display:inline-block;padding:10px 24px;border-radius:4px;font-weight:bold;font-size:15px">
            📎 See Attachment: QR-${registrationId}.png
          </div>
          <p style="color:#999;font-size:12px;margin:12px 0 0">Save it to your phone or print it. Show at the venue for check-in.</p>
        </div>

        <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:15px;border-radius:4px">
          <p style="margin:0;font-size:14px">⚠️ Please carry this QR code (printed or on your phone) to the event.</p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#f5f5f5;padding:20px;text-align:center">
        <p style="color:#999;font-size:12px;margin:0">
          This is an automated email. Please do not reply.<br/>
          ${process.env.FEST_NAME} • Your College Name
        </p>
      </div>

    </div>
  `;

  // Convert base64 QR to buffer for attachment
  const base64Data = qrDataURL.includes(',') ? qrDataURL.split(',')[1] : qrDataURL;
  const qrBuffer = Buffer.from(base64Data, 'base64');

  await transporter.sendMail({
    from: `"${process.env.FEST_NAME}" <${process.env.GMAIL_USER}>`,
    to,
    subject: `✅ Registration Confirmed - ${eventName} | ${process.env.FEST_NAME}`,
    html: htmlContent,
    attachments: [
      {
        filename: `QR-${registrationId}.png`,
        content: qrBuffer,
        contentType: 'image/png',
      },
    ],
  });

  console.log(`[mailer] ✅ Email sent to ${to} for registration ${registrationId}`);
}

module.exports = { sendRegistrationEmail };
