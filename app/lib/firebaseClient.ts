"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

if (!getApps().length) {
  // Only initialize in browser environment when env vars are present
  try {
    if (typeof window !== 'undefined') initializeApp(firebaseConfig as any);
  } catch (err) {
    // ignore
    console.warn('Firebase client initialize error', err);
  }
}

export async function signInWithGooglePopup(): Promise<{ idToken: string; email?: string }> {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const idToken = await user.getIdToken();
  return { idToken, email: user.email || undefined };
}
