/**
 * WebAPI: API REST pentru cupoanele de reducere (Express, raspunsuri JSON).
 *
 *   Controller  src/controllers/CupoaneController.ts
 *   Modele API  src/dtos/CuponDto.ts (raspuns), src/dtos/CuponInputDto.ts (body POST/PUT)
 *   Mapare      src/mapare/mapper.ts (AutoMapper: entitate <-> DTO)
 *
 * Sirul de conexiune (DATABASE_URL) si portul (PORT) sunt in fisierul .env al proiectului,
 * echivalentul sectiunii connectionStrings din web.config.
 */
import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import { inchideContext } from "repository-codefirst";
import { CupoaneController } from "./controllers/CupoaneController.ts";

const port = Number(process.env.PORT ?? 3002);
const app = express();
app.use(express.json()); // body-ul cererilor POST si PUT, in format JSON

const cupoane = new CupoaneController();
app.get("/api/cupoane", cupoane.get);
app.get("/api/cupoane/:id", cupoane.getById);
app.post("/api/cupoane", cupoane.post);
app.put("/api/cupoane/:id", cupoane.put);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ eroare: "Endpoint inexistent." });
});
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // JSON invalid in body: express.json() arunca o eroare cu status 400
  if (typeof err === "object" && err !== null && "type" in err && err.type === "entity.parse.failed") {
    return res.status(400).json({ eroare: "Body-ul cererii nu este un JSON valid." });
  }
  console.error(err);
  res.status(500).json({ eroare: "Eroare la server. Verifică dacă PostgreSQL rulează și DATABASE_URL din .env." });
});

const server = app.listen(port, () => {
  console.log(`BlockManager API: http://localhost:${port}/api/cupoane`);
});

const opreste = () => server.close(() => void inchideContext().then(() => process.exit(0)));
process.on("SIGINT", opreste);
process.on("SIGTERM", opreste);
