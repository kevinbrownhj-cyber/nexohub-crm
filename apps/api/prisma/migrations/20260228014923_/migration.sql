/*
  Warnings:

  - The `status` column on the `cases` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `invoices` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `surcharges` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('IMPORTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'PENDING_BILLING_REVIEW', 'READY_TO_INVOICE', 'INVOICED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SurchargeStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED');

-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by_id" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "CaseStatus" NOT NULL DEFAULT 'IMPORTED';

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "status",
ADD COLUMN     "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "family" TEXT;

-- AlterTable
ALTER TABLE "surcharges" DROP COLUMN "status",
ADD COLUMN     "status" "SurchargeStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "user_id" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_attempts_email_idx" ON "login_attempts"("email");

-- CreateIndex
CREATE INDEX "login_attempts_ip_idx" ON "login_attempts"("ip");

-- CreateIndex
CREATE INDEX "login_attempts_created_at_idx" ON "login_attempts"("created_at");

-- CreateIndex
CREATE INDEX "login_attempts_success_idx" ON "login_attempts"("success");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_first_name_last_name_idx" ON "customers"("first_name", "last_name");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "providers_name_idx" ON "providers"("name");

-- CreateIndex
CREATE INDEX "providers_type_idx" ON "providers"("type");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_idx" ON "refresh_tokens"("family");

-- CreateIndex
CREATE INDEX "surcharges_status_idx" ON "surcharges"("status");

-- CreateIndex
CREATE INDEX "vehicles_plate_idx" ON "vehicles"("plate");
