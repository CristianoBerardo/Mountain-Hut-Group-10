// Import the configured Firebase Authentication instance.
import { adminAuth } from "./config/firebaseAdmin";

// Test whether Firebase Admin SDK can generate a custom token.
export async function testFirebaseAuth() {
  try {
    // Generate a custom token for a test UID.
    // This does not create a Firebase Authentication user.
    const customToken =
      await adminAuth.createCustomToken("test-connection");

    console.log("Firebase Admin SDK initialized successfully!");
    console.log("Custom token generated successfully.");

    // Print the token only for local debugging.
    // Do not share it or expose it in public logs.
    console.log("Token:", customToken);
  } catch (error) {
    console.error("Firebase Admin SDK test failed:", error);
    process.exitCode = 1;
  }
}

// Run the test.
// testFirebaseAuth();