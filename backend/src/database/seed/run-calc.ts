/**
 * Diagnóstico: ejecuta el cálculo del periodo con el motor real (vía Nest) y
 * resume el resultado por equipo. No es un seed; sirve para verificar que los
 * datos cargados producen liquidación.
 *
 * Uso: npx ts-node -r tsconfig-paths/register src/database/seed/run-calc.ts --year=2026 --month=1
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
  const month = Number(arg("month"));
  // Filtrar por MONTH: los ciclos comparten periodMonth con su último mes
  // (Ciclo1 → 4), así que sin esto un --month=4 podría traer el ciclo.
  const period = await prisma.period.findFirst({
    where: { periodYear: year, periodMonth: month, periodType: "MONTH" },
  });
  if (!period) throw new Error("No se encontró el periodo");

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const service = app.get(IncentivesService);

  console.log(`Calculando ${year}-${String(month).padStart(2, "0")}...`);
  const result = await service.calculate({
    periodId: period.periodId,
  } as never);
  console.log("resumen:", JSON.stringify(result, null, 2).slice(0, 600));

  // Detalle por equipo de la última versión. El header ya trae teamId.
  const headers = await prisma.incentiveCalculationHeader.findMany({
    where: { periodId: period.periodId },
  });
  const teams = new Map(
    (
      await prisma.team.findMany({ select: { teamId: true, teamName: true } })
    ).map((t) => [t.teamId, t.teamName]),
  );

  const byTeam = new Map<string, { n: number; total: number }>();
  for (const h of headers) {
    const team = teams.get(h.teamId) ?? "(sin equipo)";
    const acc = byTeam.get(team) ?? { n: 0, total: 0 };
    acc.n += 1;
    acc.total += Number(h.totalIncentive ?? 0);
    byTeam.set(team, acc);
  }

  console.log("\n--- liquidación por equipo ---");
  let total = 0;
  for (const [team, v] of [...byTeam.entries()].sort()) {
    console.log(
      `  ${team.padEnd(32)} ${String(v.n).padStart(3)} empl  $${v.total.toLocaleString("es-CO")}`,
    );
    total += v.total;
  }
  console.log(
    `  ${"TOTAL".padEnd(32)} ${String(headers.length).padStart(3)} empl  $${total.toLocaleString("es-CO")}`,
  );

  await app.close();
}

main()
  .catch((e) => {
    console.error("Error:", e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
