-- BlockManager - Laborator 3, Exercitiul 3
-- Modificarea bazei de date: coloana noua "descriere" in tabelul existent "planuri".
-- Rulare: psql -h localhost -U postgres -d blockmanager -v ON_ERROR_STOP=1 -f 01_ex3_planuri_descriere.sql

SET client_encoding = 'UTF8';

-- AlterTable
ALTER TABLE "planuri" ADD COLUMN     "descriere" VARCHAR(200);

-- Date pentru coloana noua
UPDATE "planuri" SET "descriere" = CASE "cod"
    WHEN 'FREE' THEN 'Pentru asociații mici: un bloc, cel mult 30 de apartamente și 50 de tokeni pe lună.'
    WHEN 'PRO'  THEN 'Pentru asociații obișnuite: până la 5 blocuri, 400 de tokeni pe lună și raport anual.'
    WHEN 'MAX'  THEN 'Pentru complexe mari: fără limită de blocuri sau apartamente și 2.000 de tokeni pe lună.'
END;
