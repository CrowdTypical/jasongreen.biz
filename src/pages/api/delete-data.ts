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
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5;

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

async function sendConfirmationEmail(to: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'spreadthefund@gmail.com',
      pass: import.meta.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: '"Spread the Fund" <spreadthefund@gmail.com>',
    to,
    subject: 'SPREAD THE FUND — Your Data Has Been Deleted',
    text: `Your data has been successfully deleted from Spread the Fund.\n\nAll account information, group memberships, bill history, and authentication data associated with this email have been permanently removed.\n\nIf you did not request this, please contact us immediately at spreadthefund@gmail.com.\n\n— Spread the Fund`,
    html: `
      <div style="font-family: 'Courier New', monospace; background: #0A0E14; color: #E0E0E0; padding: 40px; max-width: 500px;">
        <h1 style="color: #00E5CC; font-size: 14px; letter-spacing: 4px; margin-bottom: 24px; border-bottom: 1px solid #1E2A35; padding-bottom: 12px;">
          SPREAD THE FUND
        </h1>
        <p style="color: #8899AA; font-size: 12px; letter-spacing: 2px; margin-bottom: 16px;">DATA DELETION CONFIRMATION</p>
        <div style="background: #141A22; border: 1px solid #1E2A35; padding: 20px; margin: 20px 0;">
          <p style="color: #4CAF50; font-size: 13px; margin: 0;">&#10003; YOUR DATA HAS BEEN PERMANENTLY DELETED</p>
        </div>
        <p style="color: #556677; font-size: 12px; line-height: 1.8;">
          The following data has been removed:<br/>
          › Account information<br/>
          › Group memberships<br/>
          › Bill history<br/>
          › Authentication data
        </p>
        <p style="color: #556677; font-size: 12px; line-height: 1.8; margin-top: 16px;">
          If you did not request this deletion, please contact us immediately at
          <a href="mailto:spreadthefund@gmail.com" style="color: #00E5CC;">spreadthefund@gmail.com</a>.
        </p>
        <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #1E2A35;">
          <p style="color: #455566; font-size: 10px; letter-spacing: 1px;">SPREAD THE FUND — SPLIT BILLS IN REAL-TIME</p>
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

    if (isRateLimited(ip)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers }
      );
    }

    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'A valid email address is required.' }),
        { status: 400, headers }
      );
    }

    if (!code || !/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: 'A valid 6-digit verification code is required.' }),
        { status: 400, headers }
      );
    }

    getFirebaseAdmin();
    const auth = getAuth();
    const db = getFirestore();

    // Verify the code
    const codeDoc = await db.collection('deletion_codes').doc(email).get();
    if (!codeDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'No verification code found. Please request a new code.' }),
        { status: 400, headers }
      );
    }

    const codeData = codeDoc.data()!;

    // Check expiry
    if (Date.now() > codeData.expiresAt) {
      await db.collection('deletion_codes').doc(email).delete();
      return new Response(
        JSON.stringify({ error: 'Verification code has expired. Please request a new code.' }),
        { status: 400, headers }
      );
    }

    // Check max attempts (prevent brute force)
    if (codeData.attempts >= 5) {
      await db.collection('deletion_codes').doc(email).delete();
      return new Response(
        JSON.stringify({ error: 'Too many incorrect attempts. Please request a new code.' }),
        { status: 400, headers }
      );
    }

    // Verify code matches
    if (codeData.code !== code) {
      await db.collection('deletion_codes').doc(email).update({
        attempts: (codeData.attempts || 0) + 1,
      });
      return new Response(
        JSON.stringify({ error: 'Incorrect verification code.' }),
        { status: 400, headers }
      );
    }

    // Code is valid — delete it first
    await db.collection('deletion_codes').doc(email).delete();

    // Look up the user
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch {
      return new Response(
        JSON.stringify({ success: true, message: 'Data deletion complete.' }),
        { status: 200, headers }
      );
    }

    const uid = userRecord.uid;

    // Delete user data from Firestore
    const batch = db.batch();

    const userDoc = db.collection('users').doc(uid);
    const userSnapshot = await userDoc.get();
    if (userSnapshot.exists) {
      batch.delete(userDoc);
    }

    const groupsSnapshot = await db
      .collection('groups')
      .where('memberIds', 'array-contains', uid)
      .get();

    for (const groupDoc of groupsSnapshot.docs) {
      const groupData = groupDoc.data();
      const memberIds: string[] = groupData.memberIds || [];
      const updatedMembers = memberIds.filter((id: string) => id !== uid);

      if (updatedMembers.length === 0) {
        batch.delete(groupDoc.ref);
        const billsSnapshot = await groupDoc.ref.collection('bills').get();
        for (const bill of billsSnapshot.docs) {
          batch.delete(bill.ref);
        }
      } else {
        batch.update(groupDoc.ref, { memberIds: updatedMembers });
      }
    }

    await batch.commit();
    await auth.deleteUser(uid);

    // Send confirmation email
    try {
      await sendConfirmationEmail(email);
    } catch (emailErr) {
      console.error('Failed to send confirmation email:', emailErr);
      // Don't fail the deletion if email fails
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Your data has been permanently deleted.' }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Delete data error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again later.' }),
      { status: 500, headers }
    );
  }
};
