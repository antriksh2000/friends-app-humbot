import admin from "firebase-admin";

let initialized = false;

function initAdmin() {
  if (initialized) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env var is not set');
  let serviceAccount: any;
  try {
    serviceAccount = JSON.parse(raw);
  } catch (err) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON could not be parsed as JSON');
  }

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) } as any);
  }
  initialized = true;
}

export async function verifyIdToken(idToken: string): Promise<{ uid: string; email?: string }> {
  initAdmin();
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return { uid: decoded.uid, email: decoded.email };
  } catch (err) {
    throw err;
  }
}
