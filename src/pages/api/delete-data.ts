export const prerender = false;

import type { APIRoute } from 'astro';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (singleton)
function getFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccount = JSON.parse(
    import.meta.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT || '{}'
  );

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

// Rate limiting: simple in-memory store (resets on cold start)
const requestLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3; // max 3 requests per hour per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requests = requestLog.get(ip) || [];
  const recent = requests.filter((t) => now - t < RATE_LIMIT_WINDOW);
  requestLog.set(ip, recent);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  requestLog.set(ip, recent);
  return false;
}

export const POST: APIRoute = async ({ request }) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // Rate limit check
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

    // Parse and validate input
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'A valid email address is required.' }),
        { status: 400, headers }
      );
    }

    // Initialize Firebase
    getFirebaseAdmin();
    const auth = getAuth();
    const db = getFirestore();

    // Look up the user by email
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch {
      // Don't reveal whether an account exists (security)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'If an account exists with this email, a deletion request has been processed.',
        }),
        { status: 200, headers }
      );
    }

    const uid = userRecord.uid;

    // Delete user data from Firestore
    const batch = db.batch();

    // Delete user document
    const userDoc = db.collection('users').doc(uid);
    const userSnapshot = await userDoc.get();
    if (userSnapshot.exists) {
      batch.delete(userDoc);
    }

    // Find and clean up group memberships
    const groupsSnapshot = await db
      .collection('groups')
      .where('memberIds', 'array-contains', uid)
      .get();

    for (const groupDoc of groupsSnapshot.docs) {
      const groupData = groupDoc.data();
      const memberIds: string[] = groupData.memberIds || [];
      const updatedMembers = memberIds.filter((id: string) => id !== uid);

      if (updatedMembers.length === 0) {
        // Last member — delete the group and its bills
        batch.delete(groupDoc.ref);
        const billsSnapshot = await groupDoc.ref.collection('bills').get();
        for (const bill of billsSnapshot.docs) {
          batch.delete(bill.ref);
        }
      } else {
        // Remove user from group members
        batch.update(groupDoc.ref, { memberIds: updatedMembers });
      }
    }

    await batch.commit();

    // Delete the Firebase Auth account
    await auth.deleteUser(uid);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'If an account exists with this email, a deletion request has been processed.',
      }),
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

// Handle CORS preflight
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
