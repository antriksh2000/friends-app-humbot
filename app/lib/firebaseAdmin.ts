import admin from "firebase-admin";

let initialized = false;

function initAdmin() {
  if (initialized) return;

  let serviceAccount: any = null;
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    try {
      serviceAccount = JSON.parse(rawJson);
    } catch (err) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON could not be parsed as JSON');
    }
  } else {
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!clientEmail || !privateKey || !projectId) {
      throw new Error('Provide FIREBASE_SERVICE_ACCOUNT_JSON or set FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and FIREBASE_PROJECT_ID');
    }
    serviceAccount = {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
      project_id: projectId,
    };
  }

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) } as any);
  }
  initialized = true;
}

export async function verifyIdToken(idToken: string): Promise<{ uid: string; email?: string; name?: string; picture?: string }> {
  initAdmin();
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: (decoded.name as string) || undefined,
      picture: (decoded.picture as string) || undefined,
    };
  } catch (err) {
    throw err;
  }
}
