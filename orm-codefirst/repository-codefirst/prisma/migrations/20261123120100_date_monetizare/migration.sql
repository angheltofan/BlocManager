-- Migrare de date (aplicatia finala): datele de care are nevoie mecanismul de monetizare.
--   actiuni_taxabile   cele 5 actiuni care consuma tokeni
--   pachete_tokeni     pachetele de tokeni extra
--   utilizatori        cate un administrator pentru fiecare asociatie (parola de test: parola123)
--   portofele_tokeni   portofelele de tokeni ale tuturor asociatiilor, cu jurnalul tranzactiilor
--   facturi_simulate   factura comenzii achitate SIM-2026-000001

-- InsertData: actiuni_taxabile
INSERT INTO "actiuni_taxabile" ("cod", "denumire", "cost_tokeni") VALUES
  ('CALCUL', 'Calcul întreținere lunară', 10),
  ('RECALCUL', 'Recalculare întreținere', 5),
  ('NOTIFICARI', 'Notificări lunare către proprietari', 5),
  ('EXPORT_PDF', 'Export listă de plată (PDF)', 2),
  ('RAPORT', 'Raport anual de încasări', 15);

-- InsertData: pachete_tokeni
INSERT INTO "pachete_tokeni" ("denumire", "tokeni", "pret", "activ") VALUES
  ('Pachet 100 tokeni', 100, 19.00, true),
  ('Pachet 300 tokeni', 300, 49.00, true),
  ('Pachet 1000 tokeni', 1000, 129.00, true);

-- InsertData: utilizatori (administratorii asociatiilor)
INSERT INTO "utilizatori" ("asociatie_id", "email", "parola_hash", "nume", "prenume", "rol", "updated_at") VALUES
  ((SELECT "id" FROM "asociatii" WHERE "cui" = 'RO40000012'), 'admin.florilor@blockmanager.test', 'scrypt$e5789e9f9d64223d3500dc6a46963aba$ce13dce1170f6937f0a179e2b4ba751b49e697ce79cd3b88f49eeb5bba527a8fe2e2ca7abf573493e81f5e393828efe7f7f788752592b5dd2fa84756c89911e8', 'Popescu', 'Andrei', 'ADMIN', CURRENT_TIMESTAMP),
  ((SELECT "id" FROM "asociatii" WHERE "cui" = 'RO40000034'), 'admin.parculverde@blockmanager.test', 'scrypt$f832fe4de719ec002086cc176011cc6b$70e27fb25a85d1d5e9b35ecad51f8cd0ebe9706afb7d4e13b0e82034d04db1b0714c5d84c9eb5bb4033c59a9d7964548f0b4b04528ffaadba9d1565ecb89020c', 'Ionescu', 'Maria', 'ADMIN', CURRENT_TIMESTAMP),
  ((SELECT "id" FROM "asociatii" WHERE "cui" = 'RO40000056'), 'admin.marasti@blockmanager.test', 'scrypt$79ac4f298994de26c1246b69d1529c6d$99e4a618e66bdc68d1f2ebc9f9ca7ffd9d6cbbd380fe1780df14d5b596fef1ab533bafce3f532716ebee0766bce7534d05b8885ee7c577493fe0574987265164', 'Rusu', 'Elena', 'ADMIN', CURRENT_TIMESTAMP),
  ((SELECT "id" FROM "asociatii" WHERE "cui" = 'RO40000078'), 'admin.zorilor@blockmanager.test', 'scrypt$17dd7d891fb39eb7bfa91d4e92433427$658c5e3d9a208a804435eae7cf02388a7457e045b187d497d5d18e7c45df1d106e5e6d8a3056ae65a0d228d48770f39c89798a7d45399c7125cd1625f4a9966e', 'Matei', 'Ioan', 'ADMIN', CURRENT_TIMESTAMP);

-- InsertData: portofele_tokeni (Florilor 12: Pro, 400 alocati, 10 consumati; Parcul Verde: Free, 50 alocati)
INSERT INTO "portofele_tokeni" ("asociatie_id", "tokeni_plan", "tokeni_extra", "ultima_resetare", "updated_at") VALUES
  ((SELECT "id" FROM "asociatii" WHERE "cui" = 'RO40000012'), 390, 0, '2026-11-01 09:30:00', CURRENT_TIMESTAMP),
  ((SELECT "id" FROM "asociatii" WHERE "cui" = 'RO40000034'), 50, 0, '2026-11-01 00:00:00', CURRENT_TIMESTAMP);

-- InsertData: portofele goale pentru celelalte asociatii (primesc tokeni la alegerea si plata unui plan)
INSERT INTO "portofele_tokeni" ("asociatie_id", "tokeni_plan", "tokeni_extra", "updated_at")
SELECT a."id", 0, 0, CURRENT_TIMESTAMP FROM "asociatii" a
WHERE NOT EXISTS (SELECT 1 FROM "portofele_tokeni" p WHERE p."asociatie_id" = a."id");

-- InsertData: tranzactii_tokeni (jurnalul: soldul din portofel = ultimul sold_dupa = suma cantitatilor)
INSERT INTO "tranzactii_tokeni" ("portofel_id", "tip", "cantitate", "sold_dupa", "actiune_id", "comanda_id", "descriere", "created_at") VALUES
  ((SELECT p."id" FROM "portofele_tokeni" p JOIN "asociatii" a ON a."id" = p."asociatie_id" WHERE a."cui" = 'RO40000012'),
   'ALOCARE', 400, 400, NULL, (SELECT "id" FROM "comenzi_simulate" WHERE "referinta" = 'SIM-2026-000001'), 'Alocare plan Pro', '2026-11-01 09:30:00'),
  ((SELECT p."id" FROM "portofele_tokeni" p JOIN "asociatii" a ON a."id" = p."asociatie_id" WHERE a."cui" = 'RO40000012'),
   'CONSUM', -10, 390, (SELECT "id" FROM "actiuni_taxabile" WHERE "cod" = 'CALCUL'), NULL, 'Calcul întreținere lunară', '2026-11-05 10:00:00'),
  ((SELECT p."id" FROM "portofele_tokeni" p JOIN "asociatii" a ON a."id" = p."asociatie_id" WHERE a."cui" = 'RO40000034'),
   'ALOCARE', 50, 50, NULL, NULL, 'Alocare plan Free', '2026-11-01 00:00:00');

-- InsertData: facturi_simulate (comanda SIM-2026-000001: 49,00 lei cu TVA 21% inclus)
INSERT INTO "facturi_simulate" ("comanda_id", "numar", "data_emitere", "subtotal", "tva", "total") VALUES
  ((SELECT "id" FROM "comenzi_simulate" WHERE "referinta" = 'SIM-2026-000001'), 'BM-2026-000001', '2026-11-01', 40.50, 8.50, 49.00);
