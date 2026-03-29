export const prerender = false;

import type { APIRoute } from 'astro';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';

function getFirebaseAdmin() {
  if (getApps().length > 0) return getApps()[0];
  const serviceAccount = JSON.parse(
    import.meta.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT || '{}'
  );
  return initializeApp({ credential: cert(serviceAccount) });
}

// Rate limiting
const requestLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5; // max 5 code requests per 15 min per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requests = requestLog.get(ip) || [];
  const recent = requests.filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) {
    requestLog.set(ip, recent);
    return true;
  }
  recent.push(now);
  requestLog.set(ip, recent);
  return false;
}

function generateCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, '0');
}

async function sendVerificationEmail(to: string, code: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'spreadthefund@gmail.com',
      pass: import.meta.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: '"Spread the Funds" <spreadthefund@gmail.com>',
    to,
    subject: 'SPREAD THE FUNDS — Data Deletion Verification Code',
    text: `Your data deletion verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, you can safely ignore this email.\n\n— Spread the Funds`,
    html: `
      <div style="font-family: 'Courier New', monospace; background: #0A0E14; color: #E0E0E0; padding: 40px; max-width: 500px;">
        <h1 style="color: #00E5CC; font-size: 14px; letter-spacing: 4px; margin-bottom: 24px; border-bottom: 1px solid #1E2A35; padding-bottom: 12px;">
          SPREAD THE FUNDS
        </h1>
        <p style="color: #8899AA; font-size: 12px; letter-spacing: 2px; margin-bottom: 8px;">DATA DELETION VERIFICATION CODE</p>
        <div style="background: #141A22; border: 1px solid #1E2A35; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #00E5CC;">${code}</span>
        </div>
        <p style="color: #556677; font-size: 12px; line-height: 1.8;">
          This code expires in 15 minutes.<br/>
          If you did not request data deletion, you can safely ignore this email.
        </p>
        <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #1E2A35;">
          <p style="color: #455566; font-size: 10px; letter-spacing: 1px;">SPREAD THE FUNDS — SPLIT BILLS IN REAL-TIME</p>
        </div>
      </div>
    `,
  });
}

export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // if (isRateLimited(ip)) {
    //   return new Response(
    //     JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    //     { status: 429, headers }
    //   );
    // }

    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'A valid email address is required.' }),
        { status: 400, headers }
      );
    }

    getFirebaseAdmin();
    const auth = getAuth();
    const db = getFirestore();

    // Check if user exists (don't reveal this to the client)
    let userExists = false;
    try {
      await auth.getUserByEmail(email);
      userExists = true;
    } catch {
      userExists = false;
    }

    if (userExists) {
      // Generate and store code
      const code = generateCode();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

      await db.collection('deletion_codes').doc(email).set({
        code,
        expiresAt,
        attempts: 0,
      });

      // Send email
      await sendVerificationEmail(email, code);
    }

    // Always return success (don't reveal whether account exists)
    return new Response(
      JSON.stringify({
        success: true,
        message: 'If an account exists with this email, a verification code has been sent.',
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Send code error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again later.' }),
      { status: 500, headers }
    );
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
