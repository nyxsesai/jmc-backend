// Firebase Admin SDK initialization
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "./env.js";

let initialized = false;
let firebaseApp = null;

export function initFirebase() {
  if (initialized) return { app: firebaseApp, auth: getAuth(firebaseApp) };

  const hasCreds =
    env.FIREBASE_PROJECT_ID &&
    env.FIREBASE_CLIENT_EMAIL &&
    env.FIREBASE_PRIVATE_KEY;

  if (!hasCreds) {
    console.warn("Firebase credentials not set — Firebase features disabled");
    return null;
  }

  try {
    if (getApps().length === 0) {
      firebaseApp = initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY,
        }),
      });
    } else {
      firebaseApp = getApps()[0];
    }

    initialized = true;
    console.log("Firebase Admin SDK initialized");
    return { app: firebaseApp, auth: getAuth(firebaseApp) };
  } catch (err) {
    console.error("Firebase init failed:", err.message);
    return null;
  }
}

export { getAuth };
