import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import libraryRouter from "./routes/library.js";
import assessmentsRouter from "./routes/assessments.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/v1/library", libraryRouter);
app.use("/api/v1/assessments", assessmentsRouter);

const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Bookio server running on http://0.0.0.0:${PORT}`);
});
