import admin from "firebase-admin";

function parseServiceAccountFromEnv(): any | null {
  // Prefer FIREBASE_SERVICE_ACCOUNT (JSON string), fallback to FIREBASE_SERVICE_ACCOUNT_JSON
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    // If it's not JSON, return null to try next method
    return null;
  }
}


//testing antriksh
function buildServiceAccountFromParts(): any | null {
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!privateKeyRaw || !clientEmail || !projectId) return null;
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
  return {
    private_key: privateKey,
    client_email: clientEmail,
    project_id: projectId,
  };
}

function initAdmin() {
  if (admin.apps.length) return;

  const svcFromEnv = parseServiceAccountFromEnv();
  let serviceAccount: any = svcFromEnv;

  if (!serviceAccount) {
    serviceAccount = buildServiceAccountFromParts();
  }

  if (!serviceAccount) {
    // If no service account info provided, throw to surface config error on server startup
    throw new Error('Firebase admin credentials not found. Set FIREBASE_SERVICE_ACCOUNT (JSON) or FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID.');
  }

  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) } as any);
}

export async function verifyIdToken(idToken: string): Promise<any> {
  initAdmin();
  return admin.auth().verifyIdToken(idToken);
}
