import { getEmailConfiguration } from "../config/emailClient";
import { ReservationEmailDetails, sendReservationConfirmation } from "../services/emailService";

jest.mock("../config/emailClient", () => ({
    getEmailConfiguration: jest.fn(),
}));

describe("EmailService - Reservation Confirmation (US3 Unit Tests)", () => {
    let mockSendMail: jest.Mock;

    const mockDetails: ReservationEmailDetails = {
        hikerName: "Mario",
        hikerSurname: "Rossi",
        reservationId: "12345678-abcd-ef01-2345-6789abcdef01",
        date: "2026-11-25",
        startsAt: "12:00",
        endsAt: "13:30",
        partySize: 4,
        tables: [
            { tableNumber: 1, seatsAssigned: 2 },
            { tableNumber: 2, seatsAssigned: 2 },
        ],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockSendMail = jest.fn().mockResolvedValue({ accepted: ["mario@example.com"], rejected: [] });
        (getEmailConfiguration as jest.Mock).mockReturnValue({
            client: { sendMail: mockSendMail },
            sender: "reservations.mountainhut10@gmail.com",
        });
    });

    test("1. sends confirmation email with correct recipient, sender and subject", async () => {
        await sendReservationConfirmation("mario@example.com", mockDetails);

        expect(mockSendMail).toHaveBeenCalledTimes(1);
        const mailOptions = mockSendMail.mock.calls[0][0];

        expect(mailOptions.to).toBe("mario@example.com");
        expect(mailOptions.from).toEqual({
            name: "Mountain Hut",
            address: "reservations.mountainhut10@gmail.com",
        });
        expect(mailOptions.subject).toContain("Mountain Hut - Reservation Confirmed");
        expect(mailOptions.subject).toContain("12345678");
    });

    test("2. generates plain text containing all required booking details", async () => {
        await sendReservationConfirmation("mario@example.com", mockDetails);

        const mailOptions = mockSendMail.mock.calls[0][0];
        const text: string = mailOptions.text;

        expect(text).toContain("Dear Mario Rossi,");
        expect(text).toContain("CONFIRMED");
        expect(text).toContain("12345678-abcd-ef01-2345-6789abcdef01");
        expect(text).toContain("2026-11-25");
        expect(text).toContain("12:00 - 13:30");
        expect(text).toContain("Guests: 4");
        expect(text).toContain("- Table 1 (2 seats)");
        expect(text).toContain("- Table 2 (2 seats)");
        expect(text).toContain("2 hours");
    });

    test("3. generates HTML template with card structure and table list", async () => {
        await sendReservationConfirmation("mario@example.com", mockDetails);

        const mailOptions = mockSendMail.mock.calls[0][0];
        const html: string = mailOptions.html;

        expect(html).toContain("Mountain Hut - Reservation Confirmed");
        expect(html).toContain("<strong>Mario</strong>");
        expect(html).toContain("Table 1</strong>: 2 seat(s)");
        expect(html).toContain("Table 2</strong>: 2 seat(s)");
        expect(html).toContain("12345678-abcd-ef01-2345-6789abcdef01");
        expect(html).toContain("2 hours");
    });

    test("4. formats greeting correctly when surname is null or omitted", async () => {
        const detailsWithoutSurname: ReservationEmailDetails = {
            ...mockDetails,
            hikerSurname: null,
        };

        await sendReservationConfirmation("mario@example.com", detailsWithoutSurname);

        const mailOptions = mockSendMail.mock.calls[0][0];
        expect(mailOptions.text).toContain("Dear Mario,");
        expect(mailOptions.text).not.toContain("null");
    });

    test("5. throws error if Nodemailer sendMail fails", async () => {
        mockSendMail.mockRejectedValue(new Error("SMTP Connection Refused"));

        await expect(
            sendReservationConfirmation("mario@example.com", mockDetails)
        ).rejects.toThrow("SMTP Connection Refused");
    });
});