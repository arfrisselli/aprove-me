-- Normaliza documentos existentes para apenas dígitos (evita duplicidade por máscara diferente).
UPDATE "Assignor"
SET "document" = REPLACE(
  REPLACE(REPLACE(REPLACE("document", '.', ''), '-', ''), '/', ''),
  ' ',
  ''
);

-- Unifica pagáveis para o menor id de cedente por documento (antes de remover duplicatas).
UPDATE "Payable"
SET "assignorId" = (
  SELECT MIN("a2"."id")
  FROM "Assignor" AS "a2"
  WHERE "a2"."document" = (SELECT "a1"."document" FROM "Assignor" AS "a1" WHERE "a1"."id" = "Payable"."assignorId")
);

-- Remove cedentes duplicados (mantém um registro por documento).
DELETE FROM "Assignor"
WHERE "id" NOT IN (SELECT MIN("id") FROM "Assignor" GROUP BY "document");

-- CreateIndex
CREATE UNIQUE INDEX "Assignor_document_key" ON "Assignor"("document");
