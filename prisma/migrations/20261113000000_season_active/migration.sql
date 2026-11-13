ALTER TABLE "Season" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT false;

-- Mantém o comportamento atual: o período em andamento hoje vira o ativo.
UPDATE "Season" SET "active" = true
WHERE "id" = (
  SELECT "id" FROM "Season"
  WHERE (now() AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN "startDate" AND "endDate"
  ORDER BY "startDate" DESC
  LIMIT 1
)
AND NOT EXISTS (SELECT 1 FROM "Season" WHERE "active" = true);
