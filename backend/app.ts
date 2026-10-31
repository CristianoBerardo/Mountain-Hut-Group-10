import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { startServer } from "./connections/PostgreSQL/database";
import authRoutes from "./routes/authRoutes";
import statsRoutes from "./routes/statsRoutes";
import tableRoutes from "./routes/tableRoutes";
import ticketRoutes from "./routes/ticketRoutes";
import userRoutes from "./routes/userRoutes";
import { testFirebaseAuth } from "./test-auth";

// Carica il file .env dalla root del progetto (Single Source of Truth)
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/tickets", ticketRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/stats", statsRoutes);


app.use("/api/v1/tables", tableRoutes);

const PORT = Number(process.env.PORT) || 3000;

app.get("/", (_req, res) => {
  res.json({ message: "Mountain Hut Backend API is running", status: "ok" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

//app.listen(PORT, async () => {
//  console.log(`Server is running on http://localhost:${PORT}`);
//  await startServer();
//});

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`Backend server is running on port ${PORT}...`);
    await startServer();
    // At server start, generate a test token to verify firebase connection
    await testFirebaseAuth();
  });
}

export default app;
