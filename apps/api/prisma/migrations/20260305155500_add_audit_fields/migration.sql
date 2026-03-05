-- Migration: add_audit_fields
-- Backwards compatible: agrega campos nuevos con defaults o nullable

-- Agregar columnas nuevas (todas nullable o con default)
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "request_id" TEXT;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "actor_email" TEXT;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "event_type" TEXT;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'SUCCESS';
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "message" TEXT;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "metadata_json" TEXT;

-- Hacer entity_id nullable
ALTER TABLE "audit_log" ALTER COLUMN "entity_id" DROP NOT NULL;

-- Poblar event_type con valor por defecto para registros existentes
UPDATE "audit_log" SET "event_type" = action WHERE "event_type" IS NULL;

-- Ahora hacer event_type NOT NULL
ALTER TABLE "audit_log" ALTER COLUMN "event_type" SET NOT NULL;

-- Crear índices
CREATE INDEX IF NOT EXISTS "audit_log_request_id_idx" ON "audit_log"("request_id");
CREATE INDEX IF NOT EXISTS "audit_log_event_type_idx" ON "audit_log"("event_type");
CREATE INDEX IF NOT EXISTS "audit_log_status_idx" ON "audit_log"("status");
