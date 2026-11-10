import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Conexiunea la baza de date existenta, din care se genereaza modelele (Database First).
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
