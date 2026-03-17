"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig: Record<string, any> = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

if (process.env.NEXT_PUBLIC_FIREBASE_APP_ID) {
  firebaseConfig.appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
}

function initFirebaseClient() {
  if (!getApps().length) {
    try {
      if (typeof window !== "undefined") {
        // initialize with config (some values may be undefined in non-Firebase setups)
        initializeApp(firebaseConfig as any);
      }
    } catch (err) {
      // ignore init errors in environments where firebase isn't configured
      // but allow runtime errors to surface during sign-in
      // eslint-disable-next-line no-console
      console.warn("Firebase client initialize error", err);
    }
  }
}

export async function signInWithGooglePopup(): Promise<{ idToken: string; user: { uid: string; email?: string | null } }> {
  initFirebaseClient();
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const idToken = await user.getIdToken();
  return { idToken, user: { uid: user.uid, email: user.email } };
}

export async function signOutFirebase(): Promise<void> {
  try {
    const auth = getAuth();
    await signOut(auth);
  } catch (err) {
    // ignore sign out errors locally
    // eslint-disable-next-line no-console
    console.warn("Firebase signOut error", err);
  }
}
