import { Request, Response } from "express";
import { pool } from "../connections/PostgreSQL/database";


export const SERVICE_CODE_MAP: Record<string, string> = {
    "Account management": "A",
    "Billing support": "B",
    "General information": "C",
    "Technical assistance": "D",
};

export const MAX_TICKET_NUMBER = 999;

/*
    Generates a unique, sequential ticket code for a given service type.
    Format: <ServiceCode><ProgressiveNumber 3 digits> (e.g. "A001", "B002").
    - Service-specific code from SERVICE_CODE_MAP (or first letter).
    - Progressive number resets every day (calculated using CURRENT_DATE).
    - If the maximum number in a day is reached (MAX_TICKET_NUMBER), it restarts at 0.
*/
export async function generateTicketCode(serviceType: string): Promise<string> {
    const prefix =
        SERVICE_CODE_MAP[serviceType] || serviceType.charAt(0).toUpperCase();

    const result = await pool.query(
        `SELECT code FROM ticket
         WHERE service_type = $1
           AND DATE(creation_date) = CURRENT_DATE
         ORDER BY creation_date DESC
         LIMIT 1`,
        [serviceType]
    );

    let nextNumber = 1;

    if (result.rows.length > 0) {
        const lastCode: string = result.rows[0].code;
        const numericPart = parseInt(lastCode.slice(prefix.length), 10);

        if (!isNaN(numericPart)) {
            nextNumber = numericPart + 1;
        }

        if (nextNumber > MAX_TICKET_NUMBER) {
            nextNumber = 0;
        }
    }

    return `${prefix}${String(nextNumber).padStart(3, "0")}`;
}



export async function createTicket(req: Request, res: Response): Promise<void> {
    try {
        const { service_type } = req.body;

        if (
            typeof service_type !== "string" ||
            service_type.trim().length === 0
        ) {
            res.status(400).json({ error: "service_type is required" });
            return;
        }

        const trimmedService = service_type.trim();
        const code = await generateTicketCode(trimmedService);

        const result = await pool.query(
            `INSERT INTO ticket (code, service_type, status)
            VALUES ($1, $2, $3)
            RETURNING id, code, service_type, status,
                 creation_date, expiration_date`,
            [code, trimmedService, "QUEUE"]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating ticket:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


export async function getAllTickets(
    _req: Request,
    res: Response
): Promise<void> {
    try {
        const result = await pool.query(
            `SELECT id, code, service_type, status,
    creation_date, expiration_date
             FROM ticket
             ORDER BY creation_date DESC`
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error retrieving tickets:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function getTicketById(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT id, code, service_type, status,
    creation_date, expiration_date
             FROM ticket
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: "Ticket not found" });
            return;
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error retrieving ticket:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


export async function updateTicket(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const { id } = req.params;
        const { status, expiration_date } = req.body;

        const validStatuses = ["QUEUE", "SERVED", "CANCELLED"];

        if (
            typeof status !== "string" ||
            !validStatuses.includes(status)
        ) {
            res.status(400).json({ error: "Invalid ticket status" });
            return;
        }

        if (
            expiration_date !== null &&
            expiration_date !== undefined &&
            (
                typeof expiration_date !== "string" ||
                Number.isNaN(Date.parse(expiration_date))
            )
        ) {
            res.status(400).json({ error: "Invalid expiration_date" });
            return;
        }

        const result = await pool.query(
            `UPDATE ticket
             SET status = $1,
    expiration_date = $2
             WHERE id = $3
             RETURNING id, code, service_type, status,
    creation_date, expiration_date`,
            [status, expiration_date ?? null, id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: "Ticket not found" });
            return;
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error updating ticket:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


export async function deleteTicket(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE ticket
             SET status = $1
             WHERE id = $2
             RETURNING id, code, service_type, status,
    creation_date, expiration_date`,
            ["CANCELLED", id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: "Ticket not found" });
            return;
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error cancelling ticket:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}