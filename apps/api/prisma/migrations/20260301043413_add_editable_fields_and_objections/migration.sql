-- AlterEnum
ALTER TYPE "CaseStatus" ADD VALUE 'OBJECTED';

-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "is_backdated" BOOLEAN DEFAULT false,
ADD COLUMN     "price_base_cents" INTEGER,
ADD COLUMN     "surcharge_amount_cents" INTEGER DEFAULT 0,
ADD COLUMN     "technician_rejected_at" TIMESTAMP(3),
ADD COLUMN     "technician_rejected_by" TEXT,
ADD COLUMN     "technician_rejection_reason" TEXT,
ADD COLUMN     "technician_rejection_status" TEXT,
ADD COLUMN     "technician_requested_amount_cents" INTEGER,
ADD COLUMN     "technician_requested_surcharge_cents" INTEGER;
