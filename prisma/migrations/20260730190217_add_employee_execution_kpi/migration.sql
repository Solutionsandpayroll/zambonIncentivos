-- CreateTable
CREATE TABLE "employee_execution_kpi" (
    "employee_execution_kpi_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "meets_kpi" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "marked_by_username" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_execution_kpi_pkey" PRIMARY KEY ("employee_execution_kpi_id")
);

-- CreateIndex
CREATE INDEX "employee_execution_kpi_period_id_idx" ON "employee_execution_kpi"("period_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_execution_kpi_employee_id_period_id_key" ON "employee_execution_kpi"("employee_id", "period_id");

-- AddForeignKey
ALTER TABLE "employee_execution_kpi" ADD CONSTRAINT "employee_execution_kpi_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_execution_kpi" ADD CONSTRAINT "employee_execution_kpi_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "period"("period_id") ON DELETE RESTRICT ON UPDATE CASCADE;
