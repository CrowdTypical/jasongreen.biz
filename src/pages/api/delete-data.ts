export const prerender = false;

import type { APIRoute } from 'astro';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '../../utils/firebase-admin';
import { createEmailTransport } from '../../utils/email';
import { isRateLimited } from '../../utils/rate-limit';

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5;

async function sendConfirmationEmail(to: string) {
  const transporter = createEmailTransport();

  await transporter.sendMail({
    from: '"Spread the Funds" <spreadthefund@gmail.com>',
    to,
    subject: 'SPREAD THE FUNDS — Your Data Has Been Deleted',
    text: `Your data has been successfully deleted from Spread the Funds.\n\nAll account information, group memberships, bill and settlement history, feedback, invitations, and authentication data associated with this email have been permanently removed.\n\nIf you did not request this, please contact us immediately at spreadthefund@gmail.com.\n\n— Spread the Funds`,
    html: `
      <div style="font-family: 'Courier New', monospace; background: #0A0E14; color: #E0E0E0; padding: 40px; max-width: 500px;">
        <h1 style="color: #00E5CC; font-size: 14px; letter-spacing: 4px; margin-bottom: 24px; border-bottom: 1px solid #1E2A35; padding-bottom: 12px;">
          SPREAD THE FUNDS
        </h1>
        <p style="color: #8899AA; font-size: 12px; letter-spacing: 2px; margin-bottom: 16px;">DATA DELETION CONFIRMATION</p>
        <div style="background: #141A22; border: 1px solid #1E2A35; padding: 20px; margin: 20px 0;">
          <p style="color: #4CAF50; font-size: 13px; margin: 0;">&#10003; YOUR DATA HAS BEEN PERMANENTLY DELETED</p>
        </div>
        <p style="color: #556677; font-size: 12px; line-height: 1.8;">
          The following data has been removed:<br/>
          › Account information<br/>
          › Group memberships<br/>
          › Bill &amp; settlement history<br/>
          › Feedback &amp; feature requests<br/>
          › Invitations<br/>
          › Authentication data
        </p>
        <p style="color: #556677; font-size: 12px; line-height: 1.8; margin-top: 16px;">
          If you did not request this deletion, please contact us immediately at
          <a href="mailto:spreadthefund@gmail.com" style="color: #00E5CC;">spreadthefund@gmail.com</a>.
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

    getFirebaseAdmin();
    if (await isRateLimited(ip, { windowMs: RATE_LIMIT_WINDOW, maxRequests: RATE_LIMIT_MAX })) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers }
      );
    }

    const body = await request.json();
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'A valid email address is required.' }),
        { status: 400, headers }
      );
    }

    if (!code || !/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({
          error: 'A valid 6-digit verification code is required.',
        }),
        { status: 400, headers }
      );
    }

    const auth = getAuth();
    const db = getFirestore();

    // Verify the code
    const codeDoc = await db.collection('deletion_codes').doc(email).get();
    if (!codeDoc.exists) {
      return new Response(
        JSON.stringify({
          error: 'No verification code found. Please request a new code.',
        }),
        { status: 400, headers }
      );
    }

    const codeData = codeDoc.data()!;

    // Check expiry
    if (Date.now() > codeData.expiresAt) {
      await db.collection('deletion_codes').doc(email).delete();
      return new Response(
        JSON.stringify({
          error: 'Verification code has expired. Please request a new code.',
        }),
        { status: 400, headers }
      );
    }

    // Check max attempts (prevent brute force)
    if (codeData.attempts >= 5) {
      await db.collection('deletion_codes').doc(email).delete();
      return new Response(
        JSON.stringify({
          error: 'Too many incorrect attempts. Please request a new code.',
        }),
        { status: 400, headers }
      );
    }

    // Verify code matches
    if (codeData.code !== code) {
      await db
        .collection('deletion_codes')
        .doc(email)
        .update({
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
    let uid: string | null = null;
    try {
      const userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
    } catch {
      // User may not exist in Auth but could still have Firestore data
    }

    // Helper to delete all docs in a subcollection
    async function deleteSubcollection(
      docRef: FirebaseFirestore.DocumentReference,
      subcollection: string
    ) {
      const snapshot = await docRef.collection(subcollection).get();
      const batch = db.batch();
      for (const doc of snapshot.docs) {
        batch.delete(doc.ref);
      }
      if (snapshot.docs.length > 0) await batch.commit();
    }

    // 1. Delete user doc (users/{uid}) and any user docs with matching email field
    if (uid) {
      const userDoc = db.collection('users').doc(uid);
      const userSnapshot = await userDoc.get();
      if (userSnapshot.exists) {
        await userDoc.delete();
      }
    }
    const usersByEmail = await db
      .collection('users')
      .where('email', '==', email)
      .get();
    const usersBatch = db.batch();
    for (const doc of usersByEmail.docs) {
      usersBatch.delete(doc.ref);
    }
    if (usersByEmail.docs.length > 0) await usersBatch.commit();

    // 2. Delete feedback by userId, userEmail, or email field
    const feedbackBatch = db.batch();
    const feedbackByUserEmail = await db
      .collection('feedback')
      .where('userEmail', '==', email)
      .get();
    for (const doc of feedbackByUserEmail.docs) {
      feedbackBatch.delete(doc.ref);
    }
    const feedbackByEmail = await db
      .collection('feedback')
      .where('email', '==', email)
      .get();
    for (const doc of feedbackByEmail.docs) {
      feedbackBatch.delete(doc.ref);
    }
    if (uid) {
      const feedbackByUid = await db
        .collection('feedback')
        .where('userId', '==', uid)
        .get();
      for (const doc of feedbackByUid.docs) {
        feedbackBatch.delete(doc.ref);
      }
    }
    await feedbackBatch.commit();

    // 3. Delete invites where user is inviter or invitee
    const invitesBatch = db.batch();
    const invitesByEmail = await db
      .collection('invites')
      .where('inviteeEmail', '==', email)
      .get();
    for (const doc of invitesByEmail.docs) {
      invitesBatch.delete(doc.ref);
    }
    if (uid) {
      const invitesByUid = await db
        .collection('invites')
        .where('inviterUid', '==', uid)
        .get();
      for (const doc of invitesByUid.docs) {
        invitesBatch.delete(doc.ref);
      }
    }
    await invitesBatch.commit();

    // 4. Handle groups (members array contains emails, createdBy is email)
    const groupsSnapshot = await db
      .collection('groups')
      .where('members', 'array-contains', email)
      .get();

    for (const groupDoc of groupsSnapshot.docs) {
      const groupData = groupDoc.data();
      const members: string[] = groupData.members || [];
      const updatedMembers = members.filter((m: string) => m !== email);

      if (updatedMembers.length === 0) {
        // Last member — delete the entire group and all subcollections
        await deleteSubcollection(groupDoc.ref, 'bills');
        await deleteSubcollection(groupDoc.ref, 'categories');
        await deleteSubcollection(groupDoc.ref, 'settlements');
        await groupDoc.ref.delete();
      } else {
        // Remove user from members array
        await groupDoc.ref.update({ members: updatedMembers });
      }
    }

    // Also check groups created by this email (in case they're not in members array)
    const groupsByCreator = await db
      .collection('groups')
      .where('createdBy', '==', email)
      .get();
    for (const groupDoc of groupsByCreator.docs) {
      const groupData = groupDoc.data();
      const members: string[] = groupData.members || [];
      const updatedMembers = members.filter((m: string) => m !== email);

      if (updatedMembers.length === 0) {
        await deleteSubcollection(groupDoc.ref, 'bills');
        await deleteSubcollection(groupDoc.ref, 'categories');
        await deleteSubcollection(groupDoc.ref, 'settlements');
        await groupDoc.ref.delete();
      } else {
        // Transfer ownership and remove from members
        await groupDoc.ref.update({
          members: updatedMembers,
          createdBy: updatedMembers[0],
        });
      }
    }

    // 5. Delete Firebase Auth account
    if (uid) {
      await auth.deleteUser(uid);
    }

    // Send confirmation email
    try {
      await sendConfirmationEmail(email);
    } catch (emailErr) {
      console.error('Failed to send confirmation email:', emailErr);
      // Don't fail the deletion if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Your data has been permanently deleted.',
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Delete data error:', error);
    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred. Please try again later.',
      }),
      { status: 500, headers }
    );
  }
};
