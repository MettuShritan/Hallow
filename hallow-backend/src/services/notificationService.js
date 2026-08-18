// ─────────────────────────────────────────────
//  Hallow — Notification Service
//  Sends email and SMS alerts to user's
//  registered security contact
// ─────────────────────────────────────────────
import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

// ── Email transporter ────────────────────────
const transporter = nodemailer.createTransport({
  host:   config.email.host,
  port:   config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

// ── Send anomaly alert email ─────────────────
export const sendAnomalyEmail = async ({ to, userName, trustScore, url, time }) => {
  if (!to || !config.email.user) return;

  const scoreColor = trustScore >= 70 ? '#fbbf24' : '#f87171';

  await transporter.sendMail({
    from:    config.email.from,
    to,
    subject: '⚠️ Hallow — Unusual activity detected',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"/></head>
      <body style="background:#000;font-family:Inter,sans-serif;padding:40px 20px">
        <div style="max-width:500px;margin:0 auto">

          <!-- Logo -->
          <div style="text-align:center;margin-bottom:32px">
            <h1 style="color:#f1f5f9;font-size:28px;font-weight:900;letter-spacing:-1px;margin:0">hallow</h1>
            <p style="color:#475569;font-size:11px;letter-spacing:3px;margin:6px 0 0">BEHAVIORAL IDENTITY</p>
          </div>

          <!-- Alert card -->
          <div style="background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.3);border-radius:16px;padding:28px;margin-bottom:20px">
            <h2 style="color:#fca5a5;font-size:18px;font-weight:700;margin:0 0 8px">⚠️ Unusual activity detected</h2>
            <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0">
              Hi ${userName}, Hallow detected suspicious behavioral patterns that don't match your baseline.
            </p>
          </div>

          <!-- Details -->
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;margin-bottom:20px">
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="color:#475569;font-size:12px;padding:8px 0">Trust Score</td>
                <td style="color:${scoreColor};font-size:14px;font-weight:700;text-align:right">${trustScore?.toFixed(1)}%</td>
              </tr>
              <tr>
                <td style="color:#475569;font-size:12px;padding:8px 0">Website</td>
                <td style="color:#f1f5f9;font-size:13px;text-align:right">${url || 'Unknown'}</td>
              </tr>
              <tr>
                <td style="color:#475569;font-size:12px;padding:8px 0">Time</td>
                <td style="color:#f1f5f9;font-size:13px;text-align:right">${time || new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <!-- CTA -->
          <div style="text-align:center;margin-bottom:32px">
            <a href="https://app.hallow.id/dashboard" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,rgba(34,211,238,0.3),rgba(167,139,250,0.3));border:1px solid rgba(34,211,238,0.4);border-radius:12px;color:#f1f5f9;font-size:14px;font-weight:700;text-decoration:none">
              Review on Dashboard →
            </a>
          </div>

          <!-- Footer -->
          <p style="color:#1e293b;font-size:11px;text-align:center;letter-spacing:1px">
            PROTECTED BY HALLOW BEHAVIORAL AI
          </p>
        </div>
      </body>
      </html>
    `,
  });
};

// ── Send SMS alert (Twilio) ──────────────────
export const sendAnomalySMS = async ({ to, trustScore, url }) => {
  if (!to || !config.twilio.sid) return;

  // Dynamic import — Twilio is optional
  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(config.twilio.sid, config.twilio.token);

    await client.messages.create({
      body: `⚠️ Hallow Alert: Unusual activity detected. Trust score dropped to ${trustScore?.toFixed(1)}% on ${url || 'your browser'}. Open Hallow to review.`,
      from: config.twilio.phone,
      to,
    });
  } catch (err) {
    console.error('[Hallow SMS]', err.message);
  }
};

// ── Send lost device notification ────────────
export const sendLostDeviceEmail = async ({ to, userName }) => {
  if (!to || !config.email.user) return;

  await transporter.sendMail({
    from:    config.email.from,
    to,
    subject: '🚨 Hallow — Lost device tracking activated',
    html: `
      <div style="background:#000;font-family:Inter,sans-serif;padding:40px 20px;max-width:500px;margin:0 auto">
        <h1 style="color:#f1f5f9;font-size:28px;font-weight:900;letter-spacing:-1px;text-align:center">hallow</h1>
        <div style="background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.3);border-radius:16px;padding:28px;margin-top:24px">
          <h2 style="color:#fca5a5;font-size:18px;font-weight:700;margin:0 0 8px">🚨 Lost device tracking activated</h2>
          <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0">
            Hi ${userName}, you've activated lost device mode. Hallow is now streaming your device's location in real-time.
          </p>
        </div>
        <div style="text-align:center;margin-top:24px">
          <a href="https://app.hallow.id/lost" style="display:inline-block;padding:14px 32px;background:rgba(248,113,113,0.2);border:1px solid rgba(248,113,113,0.4);border-radius:12px;color:#fca5a5;font-size:14px;font-weight:700;text-decoration:none">
            View Live Location →
          </a>
        </div>
      </div>
    `,
  });
};
