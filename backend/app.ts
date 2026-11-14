import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { swaggerConfig } from "./config/swagger-config";
import { startServer } from "./connections/PostgreSQL/database";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/authRoutes";
import reservationRoutes from "./routes/reservationRoutes";
import slotRoutes from "./routes/slotRoutes";
import tableRoutes from "./routes/tableRoutes";
import userRoutes from "./routes/userRoutes";

// Carica il file .env dalla root del progetto (Single Source of Truth)
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/tables", tableRoutes);

app.use("/api/v1/slots", slotRoutes);
app.use("/api/v1/reservations", reservationRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerConfig));

const publicPath = path.resolve(__dirname, "../public");

if (process.env.NODE_ENV === "production" && fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(publicPath, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.json({ message: "Mountain Hut Backend API is running", status: "ok" });
  });
}

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`Backend server is running on port ${PORT}...`);
    await startServer();
  });
}

export default app;
