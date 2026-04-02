import { initializeApp, cert, getApps } from 'firebase-admin/app';

export function getFirebaseAdmin() {
  if (getApps().length > 0) return getApps()[0];
  const serviceAccount = JSON.parse(
    import.meta.env.FIREBASE_SERVICE_ACCOUNT ||
      process.env.FIREBASE_SERVICE_ACCOUNT ||
      '{}'
  );
  return initializeApp({ credential: cert(serviceAccount) });
}
