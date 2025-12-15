import express from "express";
import { sharedHello } from "@lukyss-bar/shared";

const app = express();

// Middlewares
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/", (_req, res) => {
  res.json({ message: sharedHello("monorepo") });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, "0.0.0.0", () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
