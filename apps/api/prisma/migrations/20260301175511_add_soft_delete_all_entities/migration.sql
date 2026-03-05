/*
  Warnings:

  - You are about to drop the column `first_name` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `customers` table. All the data in the column will be lost.
  - Added the required column `name` to the `customers` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "customers_first_name_last_name_idx";

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "first_name",
DROP COLUMN "last_name",
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "scheduled_delete_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "insurers" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT,
ADD COLUMN     "scheduled_delete_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "providers" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT,
ADD COLUMN     "scheduled_delete_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT,
ADD COLUMN     "scheduled_delete_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT,
ADD COLUMN     "scheduled_delete_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");

-- CreateIndex
CREATE INDEX "customers_deleted_at_idx" ON "customers"("deleted_at");

-- CreateIndex
CREATE INDEX "insurers_deleted_at_idx" ON "insurers"("deleted_at");

-- CreateIndex
CREATE INDEX "providers_deleted_at_idx" ON "providers"("deleted_at");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "vehicles_deleted_at_idx" ON "vehicles"("deleted_at");
