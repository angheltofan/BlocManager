-- Laboratorul 9: notificari de test pentru administratorii asociatiilor (entitatea stearsa fizic).
-- Orele sunt in UTC, ca toate coloanele DateTime din Prisma (07:00 UTC = 09:00 ora Romaniei).
INSERT INTO "notificari" ("utilizator_id", "tip", "mesaj", "citita", "data_creare")
SELECT u."id", n."tip"::"TipNotificare", n."mesaj", n."citita", n."data_creare"
FROM (VALUES
    ('RO40000012', 'SISTEM',    'Bun venit în BlockManager! Asociația folosește planul Pro.', TRUE,  TIMESTAMP '2026-11-01 07:00:00'),
    ('RO40000012', 'ABONAMENT', 'Plata comenzii SIM-2026-000001 (49,00 lei) a fost înregistrată. Abonament Pro este activ: 400 tokeni alocați.', TRUE, TIMESTAMP '2026-11-01 07:05:00'),
    ('RO40000012', 'SISTEM',    'Lista de plată pentru octombrie poate fi exportată în PDF din secțiunea Acțiuni.', FALSE, TIMESTAMP '2026-11-10 06:30:00'),
    ('RO40000034', 'SISTEM',    'Bun venit în BlockManager! Asociația folosește planul Free, cu 50 de tokeni pe lună.', FALSE, TIMESTAMP '2026-11-01 07:00:00')
) AS n("cui", "tip", "mesaj", "citita", "data_creare")
JOIN "asociatii" a ON a."cui" = n."cui"
JOIN "utilizatori" u ON u."asociatie_id" = a."id" AND u."rol" = 'ADMIN';
