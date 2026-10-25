/*
    1. Define data structure for ticket
    2. Define the properties of the ticket interface
    3. Specify the types for each property
    
    Used from other levels of the application to ensure consistency and type safety
*/
export interface Ticket {
    id: string;                    // Unique identifier for the ticket (uuid)
    code: string;                  // Unique code for the ticket (alphanumeric string)
    service_type: string;          // Type of service associated with the ticket
    status: string;                // Current status of the ticket
    creation_date: Date;           // Date when the ticket was created
    expiration_date: Date | null;  // Date when the ticket expires (null if it has been just created)
}