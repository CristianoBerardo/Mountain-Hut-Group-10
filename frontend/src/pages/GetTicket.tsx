import { useState } from "react";
import { createTicket } from "../api/ticketAPI";
import Navbar from "../components/Navbar";
import type { TicketDTO } from "../dto/TicketDTO";

function GetTicket() {

    const [ticket, setTicket] = useState<TicketDTO | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    /**
     * Creates a ticket for the selected service.
     *
     * @param serviceType - The service selected by the user.
     */
    async function handleGetTicket(serviceType: string) {
        setLoading(true);
        setError("");
        setTicket(null);

        try {
            const result = await createTicket({
                service_type: serviceType
            });

            setTicket(result);

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create ticket"
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Navbar />
            <div className="get-ticket-container">
                <h1>Choose the service you need</h1>
                <div className="button-container">
                    <button onClick={() => handleGetTicket("Account management")} className="nav-button" disabled={loading}>
                        Account management
                    </button>
                    <button onClick={() => handleGetTicket("Billing support")} className="nav-button" disabled={loading}>
                        Billing support
                    </button>
                    <button onClick={() => handleGetTicket("General information")} className="nav-button" disabled={loading}>
                        General Information
                    </button>
                    <button onClick={() => handleGetTicket("Technical assistance")} className="nav-button" disabled={loading}>
                        Technical assistance
                    </button>
                </div>
                {/* Loading message */}
                {loading && (
                    <p>Generating your ticket...</p>
                )}

                {/* Error message */}
                {error && (
                    <p className="login-error" role="alert">
                        {error}
                    </p>
                )}

                {/* Created ticket */}
                {ticket && (
                    <div className="ticket-result">

                        <h2>Ticket Created!</h2>

                        <p>
                            Your ticket number is:
                        </p>

                        <h1>{ticket.code}</h1>

                        <p>
                            Service: {ticket.service_type}
                        </p>

                    </div>
                )}
            </div>
        </>
    );
}

export default GetTicket;