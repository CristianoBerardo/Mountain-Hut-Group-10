import { getEmailConfiguration } from "../config/emailClient";

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
  details: ReservationEmailDetails
): Promise<void> {
  const subject = `Mountain Hut - Reservation Confirmed (#${details.reservationId.slice(0, 8)})`;
  const text = buildConfirmationText(details);
  const html = buildConfirmationHtml(details);

  const { client, sender } = getEmailConfiguration();
  await client.sendMail({
    from: { name: "Mountain Hut", address: sender },
    to,
    subject,
    text,
    html,
  });
}

export interface ReservationEmailDetails {
  hikerName: string;
  hikerSurname?: string | null;
  reservationId: string;
  date: string;
  startsAt: string;
  endsAt: string;
  partySize: number;
  tables: Array<{ tableNumber: number; seatsAssigned: number }>;
}

function buildConfirmationText(d: ReservationEmailDetails): string {
  const tableList = d.tables
    .map(t => `- Table ${t.tableNumber} (${t.seatsAssigned} seats)`)
    .join("\n");

  return [
    `Dear ${d.hikerName}${d.hikerSurname ? " " + d.hikerSurname : ""},`,
    "",
    "Your reservation at Mountain Hut is CONFIRMED!",
    "",
    `Reservation Reference: ${d.reservationId}`,
    `Date: ${d.date}`,
    `Time: ${d.startsAt} - ${d.endsAt}`,
    `Guests: ${d.partySize}`,
    "Assigned Table(s):",
    tableList,
    "",
    "Please note: reservations can be cancelled or modified up to 2 hours before the service time.",
    "",
    "We look forward to welcoming you to the hut!",
    "Mountain Hut Team"
  ].join("\n");
}

function buildConfirmationHtml(d: ReservationEmailDetails): string {
  const tableRows = d.tables
    .map(t => `<li><strong>Table ${t.tableNumber}</strong>: ${t.seatsAssigned} seat(s)</li>`)
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #2b6cb0; margin-top: 0;">🏔️ Mountain Hut - Reservation Confirmed</h2>
      <p>Dear <strong>${d.hikerName}</strong>,</p>
      <p>We are pleased to inform you that your table reservation has been successfully confirmed.</p>
      
      <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Reference ID:</strong> <span style="font-family: monospace;">${d.reservationId}</span></p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${d.date}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${d.startsAt} - ${d.endsAt}</p>
        <p style="margin: 5px 0;"><strong>Guests:</strong> ${d.partySize} person(s)</p>
        <p style="margin: 5px 0;"><strong>Assigned Tables:</strong></p>
        <ul style="margin: 5px 0; padding-left: 20px;">
          ${tableRows}
        </ul>
      </div>

      <p style="font-size: 13px; color: #718096;">
        ⚠️ <em>Reminder: modifications and cancellations are allowed up to 2 hours prior to your slot time.</em>
      </p>
      <p>We look forward to seeing you at the hut!</p>
      <p style="color: #4a5568; font-weight: bold;">Mountain Hut Staff</p>
    </div>
  `;
}