-- Migrare de date (Code First): datele de test minime, inserate odata cu crearea tabelelor.
-- Tabelele: planuri si cupoane_reducere.

-- InsertData: planuri
INSERT INTO "planuri" ("cod", "denumire", "pret_lunar", "tokeni_lunari", "max_apartamente", "max_blocuri", "raport_anual", "activ", "descriere") VALUES
  ('FREE', 'Free', 0.00, 50, 30, 1, false, true, 'Inserat de migrarea date_test'),
  ('PRO', 'Pro', 49.00, 400, 300, 5, true, true, 'Inserat de migrarea date_test');

-- InsertData: cupoane_reducere
INSERT INTO "cupoane_reducere" ("cod", "procent_reducere", "plan_id", "valabil_pana", "utilizari_maxime", "utilizari", "activ") VALUES
  ('BUNVENIT20', 20, (SELECT "id" FROM "planuri" WHERE "cod" = 'PRO'), '2026-12-31', 100, 0, true),
  ('TOAMNA10', 10, NULL, '2026-11-30', 50, 12, true);
