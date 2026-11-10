import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Modelele vin din LibrarieModele; migrarile si seed-ul stau in Repository_CodeFirst.
export default defineConfig({
  schema: "../librarie-modele/prisma/schema",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
