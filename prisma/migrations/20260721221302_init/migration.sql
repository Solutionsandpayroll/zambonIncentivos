-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('MONTH', 'CYCLE');

-- CreateEnum
CREATE TYPE "ConditionType" AS ENUM ('NEW_HIRE', 'ZONE_CHANGE', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('PENDING', 'PROCESSING', 'IMPORTED', 'ERROR');

-- CreateEnum
CREATE TYPE "CalculationStatus" AS ENUM ('DRAFT', 'CALCULATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ComponentType" AS ENUM ('MEDICINE', 'ORDER_TAKING', 'SELL_OUT', 'INSTALLATION', 'OTHER');

-- CreateTable
CREATE TABLE "person" (
    "person_id" TEXT NOT NULL,
    "document_type" TEXT,
    "document_number" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "full_name" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_pkey" PRIMARY KEY ("person_id")
);

-- CreateTable
CREATE TABLE "employee" (
    "employee_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "employee_code" TEXT NOT NULL,
    "hire_date" DATE,
    "termination_date" DATE,
    "base_salary" DECIMAL(14,2) NOT NULL,
    "zone_id" TEXT,
    "position_id" TEXT,
    "current_team_assignment_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "employee_team_assignment" (
    "employee_team_assignment_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "valid_from" DATE NOT NULL,
    "valid_to" DATE,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "employee_team_assignment_pkey" PRIMARY KEY ("employee_team_assignment_id")
);

-- CreateTable
CREATE TABLE "team" (
    "team_id" TEXT NOT NULL,
    "team_code" TEXT NOT NULL,
    "team_name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "team_pkey" PRIMARY KEY ("team_id")
);

-- CreateTable
CREATE TABLE "position" (
    "position_id" TEXT NOT NULL,
    "position_name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "position_pkey" PRIMARY KEY ("position_id")
);

-- CreateTable
CREATE TABLE "region" (
    "region_id" TEXT NOT NULL,
    "region_name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "region_pkey" PRIMARY KEY ("region_id")
);

-- CreateTable
CREATE TABLE "zone" (
    "zone_id" TEXT NOT NULL,
    "zone_name" TEXT NOT NULL,
    "region_id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "zone_pkey" PRIMARY KEY ("zone_id")
);

-- CreateTable
CREATE TABLE "org_hierarchy" (
    "org_hierarchy_id" TEXT NOT NULL,
    "manager_employee_id" TEXT NOT NULL,
    "subordinate_employee_id" TEXT NOT NULL,
    "valid_from" DATE NOT NULL,
    "valid_to" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "org_hierarchy_pkey" PRIMARY KEY ("org_hierarchy_id")
);

-- CreateTable
CREATE TABLE "employee_payment_condition" (
    "employee_payment_condition_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "condition_type" "ConditionType" NOT NULL,
    "apply_80_percent" BOOLEAN NOT NULL DEFAULT false,
    "apply_20_percent" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_payment_condition_pkey" PRIMARY KEY ("employee_payment_condition_id")
);

-- CreateTable
CREATE TABLE "app_user" (
    "user_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "user_status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "role" (
    "role_id" TEXT NOT NULL,
    "role_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "user_role" (
    "user_role_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("user_role_id")
);

-- CreateTable
CREATE TABLE "period" (
    "period_id" TEXT NOT NULL,
    "period_year" INTEGER NOT NULL,
    "period_month" INTEGER NOT NULL,
    "period_type" "PeriodType" NOT NULL DEFAULT 'MONTH',
    "cycle_number" INTEGER,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "period_pkey" PRIMARY KEY ("period_id")
);

-- CreateTable
CREATE TABLE "team_component_weight" (
    "team_component_weight_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "weight_percent" DECIMAL(9,6) NOT NULL,
    "valid_from" DATE,
    "valid_to" DATE,

    CONSTRAINT "team_component_weight_pkey" PRIMARY KEY ("team_component_weight_id")
);

-- CreateTable
CREATE TABLE "sales_component" (
    "component_id" TEXT NOT NULL,
    "component_code" TEXT NOT NULL,
    "component_name" TEXT NOT NULL,
    "component_type" "ComponentType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sales_component_pkey" PRIMARY KEY ("component_id")
);

-- CreateTable
CREATE TABLE "curve_pay" (
    "curve_pay_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "component_id" TEXT,
    "min_compliance_percent" DECIMAL(9,6) NOT NULL,
    "pay_percent" DECIMAL(9,6) NOT NULL,
    "is_ceiling" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "curve_pay_pkey" PRIMARY KEY ("curve_pay_id")
);

-- CreateTable
CREATE TABLE "team_component_target" (
    "team_component_target_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "quota_value" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_component_target_pkey" PRIMARY KEY ("team_component_target_id")
);

-- CreateTable
CREATE TABLE "sales_upload_batch" (
    "sales_upload_batch_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "uploaded_by_user_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_hash" TEXT NOT NULL,
    "source_format" TEXT,
    "status" "BatchStatus" NOT NULL DEFAULT 'PENDING',
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_upload_batch_pkey" PRIMARY KEY ("sales_upload_batch_id")
);

-- CreateTable
CREATE TABLE "sales_transaction" (
    "sales_transaction_id" TEXT NOT NULL,
    "sales_upload_batch_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "sale_value" DECIMAL(14,2) NOT NULL,
    "sale_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_transaction_pkey" PRIMARY KEY ("sales_transaction_id")
);

-- CreateTable
CREATE TABLE "absence_or_novelty" (
    "novelty_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "novelty_type" TEXT NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "days_affected" INTEGER,
    "impact_type" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "absence_or_novelty_pkey" PRIMARY KEY ("novelty_id")
);

-- CreateTable
CREATE TABLE "incentive_calculation_header" (
    "incentive_calculation_header_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "calculation_status" "CalculationStatus" NOT NULL DEFAULT 'DRAFT',
    "base_salary" DECIMAL(14,2) NOT NULL,
    "component_80_theoretical" DECIMAL(14,2) NOT NULL,
    "component_20_theoretical" DECIMAL(14,2) NOT NULL,
    "component_80_result" DECIMAL(14,2) NOT NULL,
    "component_20_result" DECIMAL(14,2) NOT NULL,
    "total_incentive" DECIMAL(14,2) NOT NULL,
    "guaranteed_pay_applied" BOOLEAN NOT NULL DEFAULT false,
    "execution_kpi_name" TEXT,
    "execution_kpi_result" BOOLEAN,
    "execution_compliance_percent" DECIMAL(9,6),
    "execution_pay_monthly" BOOLEAN NOT NULL DEFAULT false,
    "execution_cycle_multiplier" INTEGER NOT NULL DEFAULT 4,
    "calculation_version" INTEGER NOT NULL DEFAULT 1,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incentive_calculation_header_pkey" PRIMARY KEY ("incentive_calculation_header_id")
);

-- CreateTable
CREATE TABLE "incentive_calculation_detail" (
    "incentive_calculation_detail_id" TEXT NOT NULL,
    "incentive_calculation_header_id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "quota_value" DECIMAL(14,2) NOT NULL,
    "sale_value" DECIMAL(14,2) NOT NULL,
    "compliance_percent" DECIMAL(9,6) NOT NULL,
    "curve_pay_percent" DECIMAL(9,6) NOT NULL,
    "weighted_component_percent" DECIMAL(9,6) NOT NULL,
    "component_incentive_value" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "incentive_calculation_detail_pkey" PRIMARY KEY ("incentive_calculation_detail_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "person_document_number_key" ON "person"("document_number");

-- CreateIndex
CREATE INDEX "person_document_number_idx" ON "person"("document_number");

-- CreateIndex
CREATE UNIQUE INDEX "employee_person_id_key" ON "employee"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_employee_code_key" ON "employee"("employee_code");

-- CreateIndex
CREATE INDEX "employee_employee_code_idx" ON "employee"("employee_code");

-- CreateIndex
CREATE INDEX "employee_zone_id_idx" ON "employee"("zone_id");

-- CreateIndex
CREATE INDEX "employee_team_assignment_employee_id_idx" ON "employee_team_assignment"("employee_id");

-- CreateIndex
CREATE INDEX "employee_team_assignment_team_id_idx" ON "employee_team_assignment"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_team_code_key" ON "team"("team_code");

-- CreateIndex
CREATE INDEX "zone_region_id_idx" ON "zone"("region_id");

-- CreateIndex
CREATE INDEX "org_hierarchy_manager_employee_id_subordinate_employee_id_idx" ON "org_hierarchy"("manager_employee_id", "subordinate_employee_id");

-- CreateIndex
CREATE INDEX "employee_payment_condition_period_id_employee_id_idx" ON "employee_payment_condition"("period_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_employee_id_key" ON "app_user"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_username_key" ON "app_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "role_role_name_key" ON "role"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_user_id_role_id_key" ON "user_role"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "period_period_year_period_month_period_type_key" ON "period"("period_year", "period_month", "period_type");

-- CreateIndex
CREATE UNIQUE INDEX "team_component_weight_team_id_component_id_period_id_key" ON "team_component_weight"("team_id", "component_id", "period_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_component_component_code_key" ON "sales_component"("component_code");

-- CreateIndex
CREATE INDEX "curve_pay_period_id_min_compliance_percent_idx" ON "curve_pay"("period_id", "min_compliance_percent");

-- CreateIndex
CREATE INDEX "team_component_target_period_id_employee_id_component_id_idx" ON "team_component_target"("period_id", "employee_id", "component_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_component_target_employee_id_component_id_period_id_key" ON "team_component_target"("employee_id", "component_id", "period_id");

-- CreateIndex
CREATE INDEX "sales_upload_batch_period_id_idx" ON "sales_upload_batch"("period_id");

-- CreateIndex
CREATE INDEX "sales_upload_batch_file_hash_idx" ON "sales_upload_batch"("file_hash");

-- CreateIndex
CREATE INDEX "sales_transaction_period_id_employee_id_component_id_idx" ON "sales_transaction"("period_id", "employee_id", "component_id");

-- CreateIndex
CREATE INDEX "absence_or_novelty_period_id_employee_id_idx" ON "absence_or_novelty"("period_id", "employee_id");

-- CreateIndex
CREATE INDEX "incentive_calculation_header_period_id_employee_id_idx" ON "incentive_calculation_header"("period_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "incentive_calculation_header_employee_id_period_id_calculat_key" ON "incentive_calculation_header"("employee_id", "period_id", "calculation_version");

-- CreateIndex
CREATE INDEX "incentive_calculation_detail_incentive_calculation_header_i_idx" ON "incentive_calculation_detail"("incentive_calculation_header_id");

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("person_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zone"("zone_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "position"("position_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_team_assignment" ADD CONSTRAINT "employee_team_assignment_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_team_assignment" ADD CONSTRAINT "employee_team_assignment_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone" ADD CONSTRAINT "zone_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("region_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_hierarchy" ADD CONSTRAINT "org_hierarchy_manager_employee_id_fkey" FOREIGN KEY ("manager_employee_id") REFERENCES "employee"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_hierarchy" ADD CONSTRAINT "org_hierarchy_subordinate_employee_id_fkey" FOREIGN KEY ("subordinate_employee_id") REFERENCES "employee"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_payment_condition" ADD CONSTRAINT "employee_payment_condition_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_payment_condition" ADD CONSTRAINT "employee_payment_condition_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "period"("period_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_component_weight" ADD CONSTRAINT "team_component_weight_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_component_weight" ADD CONSTRAINT "team_component_weight_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "sales_component"("component_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_component_weight" ADD CONSTRAINT "team_component_weight_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "period"("period_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curve_pay" ADD CONSTRAINT "curve_pay_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "period"("period_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curve_pay" ADD CONSTRAINT "curve_pay_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "sales_component"("component_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_component_target" ADD CONSTRAINT "team_component_target_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_component_target" ADD CONSTRAINT "team_component_target_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "sales_component"("component_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_component_target" ADD CONSTRAINT "team_component_target_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "period"("period_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_upload_batch" ADD CONSTRAINT "sales_upload_batch_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "period"("period_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_upload_batch" ADD CONSTRAINT "sales_upload_batch_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_transaction" ADD CONSTRAINT "sales_transaction_sales_upload_batch_id_fkey" FOREIGN KEY ("sales_upload_batch_id") REFERENCES "sales_upload_batch"("sales_upload_batch_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_transaction" ADD CONSTRAINT "sales_transaction_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_transaction" ADD CONSTRAINT "sales_transaction_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "sales_component"("component_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_transaction" ADD CONSTRAINT "sales_transaction_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "period"("period_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absence_or_novelty" ADD CONSTRAINT "absence_or_novelty_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absence_or_novelty" ADD CONSTRAINT "absence_or_novelty_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "period"("period_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incentive_calculation_header" ADD CONSTRAINT "incentive_calculation_header_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incentive_calculation_header" ADD CONSTRAINT "incentive_calculation_header_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "period"("period_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incentive_calculation_header" ADD CONSTRAINT "incentive_calculation_header_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incentive_calculation_detail" ADD CONSTRAINT "incentive_calculation_detail_incentive_calculation_header__fkey" FOREIGN KEY ("incentive_calculation_header_id") REFERENCES "incentive_calculation_header"("incentive_calculation_header_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incentive_calculation_detail" ADD CONSTRAINT "incentive_calculation_detail_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "sales_component"("component_id") ON DELETE RESTRICT ON UPDATE CASCADE;
