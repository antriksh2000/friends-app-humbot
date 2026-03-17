"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || undefined,
};

function ensureClientAppInitialized() {
  if (typeof window === 'undefined') return;
  if (!getApps().length) {
    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
      throw new Error('Missing NEXT_PUBLIC_FIREBASE_* environment variables for Firebase client initialization');
    }
    try {
      initializeApp(firebaseConfig as any);
    } catch (err) {
      console.warn('Firebase client initialize error', err);
    }
  }
}

export async function signInWithGooglePopup(): Promise<{ idToken: string; user: { uid?: string; email?: string; displayName?: string; photoURL?: string } }> {
  ensureClientAppInitialized();
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const idToken = await user.getIdToken();
  return {
    idToken,
    user: {
      uid: user.uid || undefined,
      email: user.email || undefined,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
    },
  };
}

export async function signOutClient(): Promise<void> {
  try {
    const auth = getAuth();
    await auth.signOut();
  } catch (err) {
    // ignore
  }
}
