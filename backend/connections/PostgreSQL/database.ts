import dotenv from "dotenv";
import path from "path";
import { Pool } from "pg";

// Carica il file .env dalla root del progetto (Single Source of Truth)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config(); // fallback su eventuale file locale

// PostgreSQL connection pool configuration using environment variables
export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

/**
 * Asynchronously verifies the PostgreSQL connection.
 * Ensures that any issues are logged immediately at application startup.
 */
export async function startServer(): Promise<void> {
  try {
    // Attempt to acquire a client from the pool
    const client = await pool.connect();
    console.log("Connected to PostgreSQL database");
    client.release(); // Release the client back to the pool
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
}
