describe("Firebase Admin SDK", () => {
  it("generates a custom token when Firebase credentials are configured", async () => {
    const { adminAuth } = await import("../config/firebaseAdmin");
    const customToken = await adminAuth.createCustomToken("test-connection");

    expect(typeof customToken).toBe("string");
    expect(customToken.length).toBeGreaterThan(0);
  });
});