/**
 * WebMVC: aplicatia web MVC pentru cupoanele de reducere (Express + EJS).
 *
 *   Model       src/models/CuponViewModel.ts
 *   Controller  src/controllers/CupoaneController.ts
 *   View-uri    views/cupoane/*.ejs
 *
 * Sirul de conexiune la baza de date (DATABASE_URL) si portul (PORT) sunt in fisierul .env al proiectului,
 * echivalentul sectiunii connectionStrings din web.config. Contextul din Repository_CodeFirst il citeste de acolo.
 */
import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inchideContext } from "repository-codefirst";
import { CupoaneController } from "./controllers/CupoaneController.ts";

const radacina = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT ?? 3001);

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(radacina, "views"));
app.use(express.urlencoded({ extended: false })); // corpul formularelor POST
app.use(express.static(path.join(radacina, "public")));

// Rutele: fiecare URL este legat de o actiune a controller-ului
const cupoane = new CupoaneController();
app.get("/", (_req, res) => res.redirect("/cupoane"));
app.get("/cupoane", cupoane.index);
app.get("/cupoane/create", cupoane.createGet);
app.post("/cupoane/create", cupoane.createPost);
app.get("/cupoane/edit/:id", cupoane.editGet);
app.post("/cupoane/edit/:id", cupoane.editPost);
app.get("/cupoane/:id", cupoane.details);

app.use((_req: Request, res: Response) => {
  res.status(404).render("eroare", { titlu: "Pagină inexistentă", mesaj: "Adresa cerută nu există." });
});
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).render("eroare", {
    titlu: "Eroare la server",
    mesaj: "Nu am putut citi sau salva datele. Verifică dacă PostgreSQL rulează și DATABASE_URL din .env.",
  });
});

const server = app.listen(port, () => {
  console.log(`BlockManager MVC: http://localhost:${port}/cupoane`);
});

const opreste = () => server.close(() => void inchideContext().then(() => process.exit(0)));
process.on("SIGINT", opreste);
process.on("SIGTERM", opreste);
