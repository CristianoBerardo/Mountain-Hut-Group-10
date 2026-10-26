import dotenv from "dotenv";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import path from "node:path";

// Load the environment file from the project root
// This assumes the backend is started from its own directory
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

// Read the service account path from the environment variables
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// If the path is not declared, throw an error
if (!credentialsPath) {
    throw new Error(
        "GOOGLE_APPLICATION_CREDENTIALS is not defined in the root .env file."
    )
}

// Resolve the service account path relative to the project root
const serviceAccountPath = path.resolve(
  process.cwd(),
  "..",
  process.env.GOOGLE_APPLICATION_CREDENTIALS!
);

const firebaseApp = getApps().length === 0 ? initializeApp({ credential: cert(serviceAccountPath),}): getApps()[0];

export const adminAuth = getAuth(firebaseApp);