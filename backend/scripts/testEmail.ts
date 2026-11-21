import { getEmailConfiguration } from "../config/emailClient";
import { sendEmail } from "../services/emailService";

async function main(): Promise<void> {
  const { client, sender } = getEmailConfiguration();
  console.log("Checking Gmail connection and authentication...");
  await client.verify();
  console.log("Gmail authentication successful.");

  // Send only to the configured sender: no reservations or customer emails.
  const result = await sendEmail(
    sender,
    "Mountain Hut - Test Email",
    "This is a test email from Mountain Hut. Sending email through Gmail OAuth2 works.",
  );
  if (!result.accepted.length || result.rejected.length) {
    throw new Error("Gmail did not accept the test email recipient.");
  }
  console.log(
    "Test email accepted by Gmail. Check the sender's inbox and spam folder.",
  );
}

main().catch((error: unknown) => {
  // Never print the complete error object, which can contain credentials.
  const message =
    error instanceof Error ? error.message : "Unknown email error";
  console.error(`Email test failed: ${message}`);
  process.exitCode = 1;
});
