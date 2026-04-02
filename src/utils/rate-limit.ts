import { getFirestore, FieldValue } from 'firebase-admin/firestore';

interface RateLimitOptions {
  /** Firestore collection to store rate limit records. */
  collection?: string;
  /** Time window in milliseconds. */
  windowMs: number;
  /** Maximum requests allowed within the window. */
  maxRequests: number;
}

/**
 * Check whether a key (typically an IP) has exceeded the rate limit,
 * using Firestore for persistence across serverless cold starts.
 *
 * Each key gets a document in the `rate_limits` collection containing
 * an array of timestamps. Expired entries are pruned on every check.
 *
 * Returns `true` if the request should be blocked (rate limited).
 */
export async function isRateLimited(
  key: string,
  options: RateLimitOptions
): Promise<boolean> {
  const {
    collection = 'rate_limits',
    windowMs,
    maxRequests,
  } = options;

  const db = getFirestore();
  const docRef = db.collection(collection).doc(key);
  const now = Date.now();
  const windowStart = now - windowMs;

  const result = await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(docRef);
    const data = snapshot.data();
    const timestamps: number[] = data?.timestamps ?? [];

    // Prune expired entries
    const recent = timestamps.filter((t) => t > windowStart);

    if (recent.length >= maxRequests) {
      // Over limit — update pruned list but don't add new entry
      tx.set(docRef, { timestamps: recent, updatedAt: FieldValue.serverTimestamp() });
      return true;
    }

    // Under limit — record this request
    recent.push(now);
    tx.set(docRef, { timestamps: recent, updatedAt: FieldValue.serverTimestamp() });
    return false;
  });

  return result;
}
