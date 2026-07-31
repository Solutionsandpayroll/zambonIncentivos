-- El 20% de algunos meses se mide con DOS KPIs en vez de uno. Cuando es así,
-- el mes se gana por mitades: un KPI cumplido = 50% de la bolsa del mes, los
-- dos = 100%. `kpi_count` guarda con cuántos se midió ese mes.
--
-- Los valores por defecto (1 KPI, segundo sin cumplir) reproducen exactamente
-- el comportamiento anterior, así que lo ya marcado no cambia de resultado.
-- AlterTable
ALTER TABLE "employee_execution_kpi" ADD COLUMN     "kpi_count" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "meets_kpi_2" BOOLEAN NOT NULL DEFAULT false;

-- Media bolsa es ahora un resultado válido, y un entero la redondearía a una
-- bolsa entera o a ninguna. Los valores existentes son enteros y se convierten
-- sin pérdida.
-- AlterTable
ALTER TABLE "incentive_calculation_header" ALTER COLUMN "execution_cycle_multiplier" SET DEFAULT 4,
ALTER COLUMN "execution_cycle_multiplier" SET DATA TYPE DECIMAL(5,2);
