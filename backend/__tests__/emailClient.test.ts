import fs from "node:fs";
import nodemailer from "nodemailer";
import { getEmailConfiguration } from "../config/emailClient";
import { EmailConfigurationError } from "../errors/AppError";

jest.mock("node:fs");
jest.mock("nodemailer");

describe("emailClient config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reads configuration and creates nodemailer transporter", () => {
    (fs.readFileSync as jest.Mock).mockReturnValueOnce(
      JSON.stringify({
        user: "test@gmail.com",
        app_password: "abcd efgh ijkl mnop",
      }),
    );
    const mockTransporter = { sendMail: jest.fn() };
    (nodemailer.createTransport as jest.Mock).mockReturnValueOnce(
      mockTransporter,
    );

    const config = getEmailConfiguration();

    expect(config.sender).toBe("test@gmail.com");
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        service: "gmail",
        auth: {
          user: "test@gmail.com",
          pass: "abcdefghijklmnop",
        },
      }),
    );
  });

  it("throws EmailConfigurationError when file read fails", () => {
    // Reset cached configuration by isolating module
    jest.resetModules();
    const { getEmailConfiguration: freshGetEmailConfig } = require("../config/emailClient");

    const freshFs = require("node:fs");
    (freshFs.readFileSync as jest.Mock).mockImplementationOnce(() => {
      throw new Error("File not found");
    });

    expect(() => freshGetEmailConfig()).toThrow(
      "Cannot read gmail-account.json: check that it exists and contains valid JSON.",
    );
  });

  it("throws EmailConfigurationError when file is not a JSON object", () => {
    jest.resetModules();
    const { getEmailConfiguration: freshGetEmailConfig } = require("../config/emailClient");

    const freshFs = require("node:fs");
    (freshFs.readFileSync as jest.Mock).mockReturnValueOnce(
      JSON.stringify(["array", "not", "object"]),
    );

    expect(() => freshGetEmailConfig()).toThrow(
      "gmail-account.json must contain a JSON object.",
    );
  });

  it("throws EmailConfigurationError when user field is missing", () => {
    jest.resetModules();
    const { getEmailConfiguration: freshGetEmailConfig } = require("../config/emailClient");

    const freshFs = require("node:fs");
    (freshFs.readFileSync as jest.Mock).mockReturnValueOnce(
      JSON.stringify({ app_password: "secret" }),
    );

    expect(() => freshGetEmailConfig()).toThrow(
      "Missing email configuration field: gmail-account.json: user",
    );
  });

  it("throws EmailConfigurationError when app_password field is missing", () => {
    jest.resetModules();
    const { getEmailConfiguration: freshGetEmailConfig } = require("../config/emailClient");

    const freshFs = require("node:fs");
    (freshFs.readFileSync as jest.Mock).mockReturnValueOnce(
      JSON.stringify({ user: "test@gmail.com" }),
    );

    expect(() => freshGetEmailConfig()).toThrow(
      "Missing email configuration field: app_password",
    );
  });
});
