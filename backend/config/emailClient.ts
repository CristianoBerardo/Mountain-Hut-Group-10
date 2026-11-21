import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { EmailConfigurationError } from "../errors/AppError";

type Secret = Record<string, unknown>;

// read the file
function readSecret(fileName: string): Secret {
  const filePath = path.resolve(process.cwd(), "secrets", fileName);
  let value: unknown;
  try {
    value = JSON.parse(
      fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""),
    );
  } catch {
    // the file is not reachable (it does not exist or it does not contain a valid json)
    throw new EmailConfigurationError(
      `Cannot read ${fileName}: check that it exists and contains valid JSON.`,
    );
  }
  // the file does not contain a JSON object
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new EmailConfigurationError(`${fileName} must contain a JSON object.`);
  }
  return value as Secret;
}

// Email is a required field
function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new EmailConfigurationError(`Missing email configuration field: ${field}`);
  }
  return value.trim();
}

// Both authorization and SMTP use exactly the same OAuth client credentials.
export function getGoogleOAuthCredentials() {
  const oauth = readSecret(
    "mountain-hut-group-10.apps.googleusercontent.com.json",
  );
  const credentials = oauth.web ?? oauth.installed ?? oauth;
  if (
    !credentials ||
    typeof credentials !== "object" ||
    Array.isArray(credentials)
  ) {
    throw new EmailConfigurationError("Invalid OAuth client JSON structure.");
  }
  const values = credentials as Secret;
  return {
    clientId: requiredString(values.client_id, "client_id"),
    clientSecret: requiredString(values.client_secret, "client_secret"),
  };
}

function createEmailConfiguration() {
  const credentials = getGoogleOAuthCredentials();
  const account = readSecret("gmail-account.json");
  const sender = requiredString(account.user, "gmail-account.json: user");
  const client = nodemailer.createTransport({
    service: "gmail",
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    auth: {
      type: "OAuth2",
      user: sender,
      ...credentials,
      refreshToken: requiredString(account.refresh_token, "refresh_token"),
    },
  });
  return { client, sender };
}

let configuration: ReturnType<typeof createEmailConfiguration> | undefined;

// Load secrets only when sending email, without affecting other backend features.
export function getEmailConfiguration() {
  configuration ??= createEmailConfiguration();
  return configuration;
}
