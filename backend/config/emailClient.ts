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
    throw new EmailConfigurationError(
      `${fileName} must contain a JSON object.`,
    );
  }
  return value as Secret;
}

// Email is a required field
function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new EmailConfigurationError(
      `Missing email configuration field: ${field}`,
    );
  }
  return value.trim();
}

function createEmailConfiguration() {
  const account = readSecret("gmail-account.json");
  const sender = requiredString(account.user, "gmail-account.json: user");
  const client = nodemailer.createTransport({
    service: "gmail",
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    auth: {
      user: sender,
      pass: requiredString(account.app_password, "app_password").replace(
        /\s/g,
        "",
      ),
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
