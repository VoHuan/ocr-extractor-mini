import express from "express";
import cors from "cors";
import { PORT } from "./src/config/appConfig.js";
import uploadRoutes from "./src/routes/uploadRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/upload", uploadRoutes);

app.get("/", (_, res) => res.json({ ok: true, msg: "OCR backend running" }));

app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
