-- AlterTable
ALTER TABLE "incentive_calculation_header" ADD COLUMN     "execution_20_mode" TEXT NOT NULL DEFAULT 'PAY_MONTHLY';

-- AlterTable
ALTER TABLE "period" ADD COLUMN     "parent_period_id" TEXT;

-- AlterTable
ALTER TABLE "team" ADD COLUMN     "pays_20_monthly" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "period_parent_period_id_idx" ON "period"("parent_period_id");

-- AddForeignKey
ALTER TABLE "period" ADD CONSTRAINT "period_parent_period_id_fkey" FOREIGN KEY ("parent_period_id") REFERENCES "period"("period_id") ON DELETE SET NULL ON UPDATE CASCADE;
