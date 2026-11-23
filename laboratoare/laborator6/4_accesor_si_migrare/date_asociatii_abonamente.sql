-- Migrare de date (Laboratorul 6): asociatii de test si abonamentele lor,
-- ca entitatea Abonament (cu cheile straine asociatie_id si plan_id) sa aiba date in pagina Index.
-- Asociatiile Marasti 7 si Zorilor 3 raman fara abonament: pentru ele se poate crea unul din pagina Create.

-- InsertData: asociatii
INSERT INTO "asociatii" ("denumire", "cui", "adresa", "iban", "banca") VALUES
  ('Asociația de Proprietari Florilor 12', 'RO40000012', 'Str. Florilor nr. 12, Cluj-Napoca', 'RO49AAAA1B31007593840000', 'Banca Test'),
  ('Asociația de Proprietari Parcul Verde', 'RO40000034', 'Aleea Parcului nr. 3, Cluj-Napoca', 'RO49AAAA1B31007593840001', 'Banca Test'),
  ('Asociația de Proprietari Mărăști 7', 'RO40000056', 'Bd. 1 Decembrie 1918 nr. 7, Cluj-Napoca', 'RO49AAAA1B31007593840002', 'Banca Test'),
  ('Asociația de Proprietari Zorilor 3', 'RO40000078', 'Str. Zorilor nr. 3, Cluj-Napoca', 'RO49AAAA1B31007593840003', NULL);

-- InsertData: abonamente (Florilor 12 pe Pro, platit; Parcul Verde pe Free)
INSERT INTO "abonamente" ("asociatie_id", "plan_id", "inceput_perioada", "sfarsit_perioada", "status", "reinnoire_automata") VALUES
  ((SELECT "id" FROM "asociatii" WHERE "cui" = 'RO40000012'), (SELECT "id" FROM "planuri" WHERE "cod" = 'PRO'),  '2026-11-01', '2026-12-01', 'ACTIV', true),
  ((SELECT "id" FROM "asociatii" WHERE "cui" = 'RO40000034'), (SELECT "id" FROM "planuri" WHERE "cod" = 'FREE'), '2026-11-01', '2026-12-01', 'ACTIV', true);

-- InsertData: comanda simulata achitata pentru abonamentul Pro al asociatiei Florilor 12
INSERT INTO "comenzi_simulate" ("asociatie_id", "abonament_id", "tip", "plan_id", "suma", "status", "referinta", "achitata_la") VALUES
  ((SELECT "id" FROM "asociatii" WHERE "cui" = 'RO40000012'),
   (SELECT a."id" FROM "abonamente" a JOIN "asociatii" s ON s."id" = a."asociatie_id" WHERE s."cui" = 'RO40000012'),
   'ABONAMENT', (SELECT "id" FROM "planuri" WHERE "cod" = 'PRO'), 49.00, 'ACHITATA', 'SIM-2026-000001', '2026-11-01 09:30:00');
