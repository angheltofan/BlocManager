/**
 * WebAPI: API-ul REST BlockManager (Express, JSON) si sectiunea de utilizator, pe portul 3002.
 *
 *   http://localhost:3002/            pagina "Abonamentul meu" (public/), care foloseste doar endpoint-urile de mai jos
 *   /api/planuri, /api/asociatii/...  monetizarea: planuri, abonament, comenzi, plata simulata, tokeni (MonetizareController)
 *   /api/cupoane                      CRUD pentru cupoane, cu DTO-uri si AutoMapper (CupoaneController)
 *
 * Controllerele primesc serviciile din containerul de dependency injection (proiectul Servicii).
 * Sirul de conexiune (DATABASE_URL) si portul (PORT) sunt in fisierul .env al proiectului.
 */
import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import path from "node:path";
import { inchideContext } from "repository-codefirst";
import { creeazaContainer, EroareBusiness } from "servicii";
import { CupoaneController } from "./controllers/CupoaneController.ts";
import { MonetizareController } from "./controllers/MonetizareController.ts";

const port = Number(process.env.PORT ?? 3002);
const container = creeazaContainer("api");
const { logger, magistralaEvenimente } = container.cradle;

const app = express();
app.use(express.json()); // body-ul cererilor POST si PUT, in format JSON
app.use(express.static(path.resolve(import.meta.dirname, "../public"))); // sectiunea de utilizator

app.use("/api", (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => logger.info(`${req.method} ${req.originalUrl}`, { status: res.statusCode, ms: Date.now() - start }));
  next();
});

const m = new MonetizareController(container.cradle);
app.get("/api/planuri", m.planuri);
app.get("/api/pachete", m.pachete);
app.get("/api/actiuni", m.actiuni);
app.get("/api/cupoane/verifica", m.verificaCupon);
app.get("/api/asociatii", m.asociatii);
app.get("/api/asociatii/:id/stare", m.stare);
app.post("/api/asociatii/:id/abonament", m.alegePlan);
app.post("/api/asociatii/:id/pachete", m.cumparaPachet);
app.post("/api/asociatii/:id/actiuni", m.executaActiune);
app.post("/api/comenzi/:id/plata", m.plateste);
app.post("/api/comenzi/:id/anulare", m.anuleaza);

const cupoane = new CupoaneController(container.cradle);
app.get("/api/cupoane", cupoane.get);
app.get("/api/cupoane/:id", cupoane.getById);
app.post("/api/cupoane", cupoane.post);
app.put("/api/cupoane/:id", cupoane.put);
app.delete("/api/cupoane/:id", cupoane.delete);

app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ eroare: "Endpoint inexistent." });
});
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof EroareBusiness) {
    const erori = err.camp ? { [err.camp]: err.message } : undefined;
    return res.status(err.status).json({ eroare: err.message, cod: err.cod, ...(erori ? { erori } : {}), ...(err.detalii ? { detalii: err.detalii } : {}) });
  }
  // JSON invalid in body: express.json() arunca o eroare cu status 400
  if (typeof err === "object" && err !== null && "type" in err && err.type === "entity.parse.failed") {
    return res.status(400).json({ eroare: "Body-ul cererii nu este un JSON valid." });
  }
  logger.eroare(`Eroare la ${req.method} ${req.originalUrl}`, { eroare: String(err) });
  res.status(500).json({ eroare: "Eroare la server. Verifică dacă PostgreSQL rulează și DATABASE_URL din .env." });
});

const server = app.listen(port, () => {
  logger.info(`Secțiunea de utilizator: http://localhost:${port}/  ·  API: http://localhost:${port}/api/planuri`);
});

const opreste = () =>
  server.close(() => void magistralaEvenimente.asteaptaConsumatorii().then(() => inchideContext()).then(() => process.exit(0)));
process.on("SIGINT", opreste);
process.on("SIGTERM", opreste);
