import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import path from "node:path";

const serviceAccountPath = path.resolve(
  process.cwd(),
  "secrets/mountain-hut-group-10-firebase.json",
);

const firebaseApp =
  getApps().length === 0
    ? initializeApp({ credential: cert(serviceAccountPath) })
    : getApps()[0];

export const adminAuth = getAuth(firebaseApp);
