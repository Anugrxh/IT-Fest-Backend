const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendRegistrationEmail({ to, registrationId, eventName, isTeamEvent, teamName, participants, qrDataURL }) {
  const participantRows = participants.map((p) => `
    <tr>
      <td style="padding:8px 10px;border:1px solid #e0e0e0">${p.isLeader ? '* ' : ''}${p.name}</td>
      <td style="padding:8px 10px;border:1px solid #e0e0e0">${p.email}</td>
      <td style="padding:8px 10px;border:1px solid #e0e0e0">${p.phone}</td>
      <td style="padding:8px 10px;border:1px solid #e0e0e0">${p.college}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
    </head>
    <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;color:#222">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0">
        <tr><td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border:1px solid #ddd">

            <!-- Header -->
            <tr>
              <td style="padding:28px 30px;border-bottom:2px solid #222">
                <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#666">College IT Fest</p>
                <h1 style="margin:6px 0 0;font-size:22px;letter-spacing:2px">ZEITGEIST 2026</h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:28px 30px">
                <p style="margin:0 0 6px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:1px">Registration Confirmed</p>
                <h2 style="margin:0 0 20px;font-size:18px">${eventName}</h2>

                <p style="margin:0 0 16px">Hello ${participants.find(p => p.isLeader)?.name || participants[0].name},</p>
                <p style="margin:0 0 20px;color:#444">Your registration has been confirmed. Please find your details below.</p>

                <!-- Info block -->
                <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ddd;margin-bottom:24px">
                  <tr><td style="padding:14px 16px;border-bottom:1px solid #eee">
                    <p style="margin:0;font-size:13px"><strong>Registration ID</strong></p>
                    <p style="margin:4px 0 0;font-size:13px;color:#555;word-break:break-all">${registrationId}</p>
                  </td></tr>
                  <tr><td style="padding:14px 16px${isTeamEvent ? ';border-bottom:1px solid #eee' : ''}">
                    <p style="margin:0;font-size:13px"><strong>Event</strong></p>
                    <p style="margin:4px 0 0;font-size:13px;color:#555">${eventName}</p>
                  </td></tr>
                  ${isTeamEvent ? `<tr><td style="padding:14px 16px">
                    <p style="margin:0;font-size:13px"><strong>Team Name</strong></p>
                    <p style="margin:4px 0 0;font-size:13px;color:#555">${teamName}</p>
                  </td></tr>` : ''}
                </table>

                <!-- Participants -->
                <p style="margin:0 0 10px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px">Participants</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;margin-bottom:8px">
                  <thead>
                    <tr style="background:#f5f5f5">
                      <th style="padding:8px 10px;border:1px solid #e0e0e0;text-align:left;font-weight:bold">Name</th>
                      <th style="padding:8px 10px;border:1px solid #e0e0e0;text-align:left;font-weight:bold">Email</th>
                      <th style="padding:8px 10px;border:1px solid #e0e0e0;text-align:left;font-weight:bold">Phone</th>
                      <th style="padding:8px 10px;border:1px solid #e0e0e0;text-align:left;font-weight:bold">College</th>
                    </tr>
                  </thead>
                  <tbody>${participantRows}</tbody>
                </table>
                ${isTeamEvent ? '<p style="margin:0 0 24px;font-size:11px;color:#888">* Team Leader</p>' : '<p style="margin:0 0 24px"></p>'}

                <!-- QR -->
                <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ddd;margin-bottom:24px">
                  <tr><td style="padding:20px;text-align:center">
                    <p style="margin:0 0 6px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px">Your Entry QR Code</p>
                    <p style="margin:0 0 12px;font-size:13px;color:#555">Your QR code is attached to this email as a PNG file.</p>
                    <p style="margin:0;font-size:13px;font-weight:bold">Attachment: QR-${registrationId}.png</p>
                    <p style="margin:8px 0 0;font-size:12px;color:#888">Save it to your phone or print it. Show at the venue for check-in.</p>
                  </td></tr>
                </table>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:18px 30px;border-top:1px solid #ddd;text-align:center">
                <p style="margin:0;font-size:11px;color:#999">This is an automated email. Please do not reply.</p>
                <p style="margin:4px 0 0;font-size:11px;color:#999">ZEITGEIST 2026</p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  // Convert base64 QR to buffer for attachment
  const base64Data = qrDataURL.includes(',') ? qrDataURL.split(',')[1] : qrDataURL;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || `${process.env.FEST_NAME || 'Tech Fest'} <onboarding@resend.dev>`,
    to: [to],
    subject: `Registration Confirmed - ${eventName} | ${process.env.FEST_NAME || 'Tech Fest'}`,
    html: htmlContent,
    attachments: [
      {
        filename: `QR-${registrationId}.png`,
        content: base64Data,
      },
    ],
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  console.log(`[mailer]  Email sent to ${to} for registration ${registrationId}`);
  return data;
}

module.exports = { sendRegistrationEmail };
