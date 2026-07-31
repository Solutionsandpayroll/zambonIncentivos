/**
 * Diagnóstico: liquida (o previsualiza) el 20% devengado de un ciclo con el
 * motor real, vía Nest. No es un seed.
 *
 * Uso: npx ts-node -r tsconfig-paths/register src/database/seed/run-cycle.ts --year=2026 --cycle=1 [--commit]
 */
import "./load-env";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../../app.module";
import { IncentivesService } from "../../modules/incentives/incentives.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  return process.argv
    .slice(2)
    .find((a) => a.startsWith(`--${name}=`))
    ?.split("=")[1];
}

async function main(): Promise<void> {
  const year = Number(arg("year"));
  const cycleNumber = Number(arg("cycle"));
  // Sin --commit no se escribe nada: el cierre mueve el 20% de un cuatrimestre
  // entero, así que el default es mirar.
  const commit = process.argv.includes("--commit");

  const period = await prisma.period.findFirst({
    where: { periodYear: year, cycleNumber, periodType: "CYCLE" },
  });
  if (!period) throw new Error(`No existe el ciclo ${year}-Ciclo${cycleNumber}`);

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const service = app.get(IncentivesService);

  console.log(
    `${commit ? "Liquidando" : "Previsualizando"} ${year}-Ciclo${cycleNumber}...`,
  );
  const result = await service.calculateCycle({
    periodId: period.periodId,
    dryRun: !commit,
  });
  console.log(JSON.stringify(result, null, 2));

  await app.close();
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e instanceof Error ? e.message : e);
  await prisma.$disconnect();
  process.exit(1);
});
