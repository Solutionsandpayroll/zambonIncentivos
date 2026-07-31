/**
 * Diagnóstico: confirma que el detalle de una liquidación mensual devuelve el
 * bloque de devengo del 20% (lo que se cobrará al cierre del ciclo).
 *
 * Uso: npx ts-node -r tsconfig-paths/register src/database/seed/check-accrual.ts
 */
import "./load-env";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../../app.module";
import { ResultsService } from "../../modules/results/results.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const svc = app.get(ResultsService);

  const month = await prisma.period.findFirst({
    where: { periodType: "MONTH", periodYear: 2026, periodMonth: 1 },
  });
  const header = await prisma.incentiveCalculationHeader.findFirst({
    where: { periodId: month!.periodId, execution20Mode: "ACCRUE" },
    orderBy: { calculationVersion: "desc" },
  });
  if (!header) throw new Error("No hay liquidación en modo ACCRUE");

  // Alcance ALL: el diagnóstico mira cualquier liquidación, como un admin.
  const admin = {
    userId: "diag",
    username: "diag",
    roles: ["ADMIN"],
    employeeId: null,
    scope: { type: "ALL", subordinateEmployeeIds: [] },
  } as never;

  const detail = (await svc.detail(admin, header.incentiveCalculationHeaderId)) as {
    component20: { result: number };
    accrual: unknown;
  };

  console.log("20% del mes :", detail.component20.result);
  console.log("devengo     :", JSON.stringify(detail.accrual));

  await app.close();
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e instanceof Error ? e.message : e);
  await prisma.$disconnect();
  process.exit(1);
});
