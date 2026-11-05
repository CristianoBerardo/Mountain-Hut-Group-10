import { adminAuth } from "../config/firebaseAdmin";

describe("Firebase Admin SDK", () => {
  it("generates a custom token when Firebase credentials are configured", async () => {
    const customToken = await adminAuth.createCustomToken("test-connection");

    expect(typeof customToken).toBe("string");
    expect(customToken.length).toBeGreaterThan(0);
  });
});
