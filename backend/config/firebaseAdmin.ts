import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const firebaseApp = getApps().length === 0 ? initializeApp({ credential: applicationDefault(),}): getApps()[0];

export const adminAuth = getAuth(firebaseApp);