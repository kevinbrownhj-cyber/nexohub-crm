-- AlterTable
ALTER TABLE "audit_log" ADD COLUMN     "actor_name" TEXT,
ADD COLUMN     "actor_role" TEXT,
ADD COLUMN     "details" TEXT;

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
