import { getEmailConfiguration } from "../config/emailClient";
import { MealReservation } from "../models/MealReservation";

export type EmailCopies = {
  cc?: string | string[];
  bcc?: string | string[];
};

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  copies: EmailCopies = {},
) {
  const { client, sender } = getEmailConfiguration();
  return client.sendMail({
    from: { name: "Mountain Hut", address: sender },
    to,
    subject,
    text,
    cc: copies.cc,
    bcc: copies.bcc,
  });
}

export async function sendReservationConfirmation(
  to: string,
  reservation: MealReservation,
  name: String = "Guest",
  copies: EmailCopies = {},
): Promise<void> {
  const startsAt = new Date(reservation.starts_at).toLocaleString("it-IT", {
    timeZone: "Europe/Rome",
  });
  await sendEmail(
    to,
    "Reservation pre-confirmation",
    [
      `Dear ${name},`,
      "Your reservation request has been received and is awaiting final confirmation.",
      "Please review your reservation details below.",
      `Reservation reference: ${reservation.id}`,
      `Date and time: ${startsAt}`,
      `Number of guests: ${reservation.party_size}`,
    ].join("\n"),
    copies,
  );
}
