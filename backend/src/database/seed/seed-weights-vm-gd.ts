/**
 * Carga los pesos de componente (team_component_weight) de los dos equipos que
 * faltaban: REP. VM (E+X) y GD (District Manager).
 *
 * Fuente: calculocomisiones.xlsx, pestañas "REP. VM (E+X)" (F33:F35) y "GD"
 * (F21:F23), columna "Mix Pago". Las otras columnas de esa tabla —N° Unit,
 * Crec. Vs 24 y % Partc.— NO entran en el cálculo: se comprobó que ninguna
 * fórmula de pago las referencia (solo se suman/promedian en su fila TOTAL).
 * Son la justificación de negocio del Mix Pago, no un insumo. Por eso aquí solo
 * se persiste el Mix Pago, que es exactamente `weight_percent`.
 *
 * Los productos de estas dos hojas no existían en el catálogo, así que se crean
 * como componentes propios en vez de reusar variantes parecidas (Fluimucil
 * tiene 4 en el catálogo y la hoja no dice cuál es):
 *   - GD trabaja sobre PH360 para Fluimucil y Monuril → códigos *_PH360.
 *   - REP. VM tiene Flutox como producto propio       → FLUTOX.
 *
 * Idempotente: se puede correr varias veces; hace upsert por
 * (teamId, componentId, periodId) y borra los pesos sobrantes del equipo.
 *
 * Uso:
 *   npm run seed:weights:vm-gd -- --year=2026 --month=1
 *   npm run seed:weights:vm-gd -- --periodId=<uuid>
 *   npm run seed:weights:vm-gd -- --year=2026 --month=1 --dry-run
 */
import "./load-env";
import { PrismaClient, Prisma, ComponentType } from "@prisma/client";

const prisma = new PrismaClient();

/** Componentes que hay que crear si no existen (no estaban en el catálogo). */
const NEW_COMPONENTS: Array<{
  componentCode: string;
  componentName: string;
  componentType: ComponentType;
}> = [
  // REP. VM (E+X) — hoja fila 42: "Fluimucil (50%)", "Monuril (20%)", "Flutox (30%)".
  // Se crean propios en vez de reusar FLUIMUCIL_* / MONURIL_SELL_OUT: el catálogo
  // tiene 4 variantes de Fluimucil y la hoja no indica cuál, así que reusar una
  // sería adivinar sobre datos que determinan lo que cobra la gente.
  {
    componentCode: "FLUIMUCIL_VM",
    componentName: "Fluimucil (Rep VM)",
    componentType: ComponentType.OTHER,
  },
  {
    componentCode: "MONURIL_VM",
    componentName: "Monuril (Rep VM)",
    componentType: ComponentType.OTHER,
  },
  {
    componentCode: "FLUTOX",
    componentName: "Flutox",
    componentType: ComponentType.OTHER,
  },
  // GD — hoja fila 29: "Fluimucil (PH360)" y "Monuril (PH360)"
  {
    componentCode: "FLUIMUCIL_PH360",
    componentName: "Fluimucil (PH360)",
    componentType: ComponentType.OTHER,
  },
  {
    componentCode: "MONURIL_PH360",
    componentName: "Monuril (PH360)",
    componentType: ComponentType.OTHER,
  },
];

/**
 * Mix Pago por equipo. Cada bloque debe sumar exactamente 1.0: el backend
 * responde 422 si no, y el motor reparte la bolsa del 80% con estos pesos.
 */
const WEIGHTS: Array<{
  teamCode: string;
  label: string;
  sheet: string;
  weights: Array<{ componentCode: string; weight: number; sheetCell: string }>;
}> = [
  {
    teamCode: "MEDICAL_REP_SENIOR_E_X",
    label: "Rep VM (E+X)",
    sheet: "REP. VM (E+X)",
    weights: [
      { componentCode: "FLUIMUCIL_VM", weight: 0.5, sheetCell: "F33" },
      { componentCode: "MONURIL_VM", weight: 0.2, sheetCell: "F34" },
      { componentCode: "FLUTOX", weight: 0.3, sheetCell: "F35" },
    ],
  },
  {
    teamCode: "DISTRICT_MANAGER",
    label: "GD (District Manager)",
    sheet: "GD",
    weights: [
      { componentCode: "FLUIMUCIL_PH360", weight: 0.5, sheetCell: "F21" },
      { componentCode: "MONURIL_PH360", weight: 0.3, sheetCell: "F22" },
      // XADAGO sí se reusa del catálogo: la hoja lo nombra igual ("XADAGO",
      // fuente Sell In) y no hay ambigüedad como con Fluimucil/Monuril.
      { componentCode: "XADAGO", weight: 0.2, sheetCell: "F23" },
    ],
  },
];

function arg(name: string): string | undefined {
  return process.argv
    .slice(2)
    .find((a) => a.startsWith(`--${name}=`))
    ?.split("=")[1];
}

async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes("--dry-run");
  const periodIdArg = arg("periodId");
  const yearArg = arg("year");
  const monthArg = arg("month");

  const period = periodIdArg
    ? await prisma.period.findUnique({ where: { periodId: periodIdArg } })
    : yearArg && monthArg
      ? await prisma.period.findFirst({
          where: { periodYear: Number(yearArg), periodMonth: Number(monthArg) },
        })
      : null;

  if (!period) {
    console.error(
      "❌ No se encontró el periodo. Pasa --periodId=<uuid> o --year=YYYY --month=M.",
    );
    process.exit(1);
  }
  if (period.isClosed) {
    console.error(
      `❌ El periodo ${period.periodYear}-${String(period.periodMonth).padStart(2, "0")} está cerrado.`,
    );
    process.exit(1);
  }

  // Validación previa: los pesos de cada equipo deben sumar 1.0 exacto.
  for (const block of WEIGHTS) {
    const sum = block.weights.reduce((a, w) => a + w.weight, 0);
    if (Math.abs(sum - 1) > 1e-9) {
      console.error(
        `❌ ${block.label}: los pesos suman ${sum}, deben sumar 1.0.`,
      );
      process.exit(1);
    }
  }

  const periodLabel = `${period.periodYear}-${String(period.periodMonth).padStart(2, "0")}`;
  console.log(
    `Periodo: ${periodLabel}${dryRun ? "   [DRY-RUN, no escribe]" : ""}\n`,
  );

  // El timeout por defecto de Prisma (5s) se queda corto: este bloque hace
  // muchas idas y vueltas secuenciales contra un Postgres remoto.
  await prisma.$transaction(
    async (tx) => {
      // 1) Componentes que faltan en el catálogo.
      for (const c of NEW_COMPONENTS) {
        const existing = await tx.salesComponent.findUnique({
          where: { componentCode: c.componentCode },
        });
        if (existing) {
          console.log(`  = componente ya existía: ${c.componentCode}`);
          continue;
        }
        if (!dryRun) await tx.salesComponent.create({ data: c });
        console.log(
          `  + componente creado:     ${c.componentCode}  (${c.componentName})`,
        );
      }

      // 2) Pesos por equipo.
      for (const block of WEIGHTS) {
        console.log(`\n${block.label}   ← hoja "${block.sheet}"`);

        const team = await tx.team.findFirst({
          where: { teamCode: block.teamCode },
        });
        if (!team) throw new Error(`No existe el equipo ${block.teamCode}`);

        const keepComponentIds: string[] = [];

        for (const w of block.weights) {
          const component = await tx.salesComponent.findUnique({
            where: { componentCode: w.componentCode },
          });
          // En dry-run los componentes nuevos aún no existen: se reporta y sigue.
          if (!component) {
            if (dryRun) {
              console.log(
                `   ${w.weight.toFixed(2)}  ${w.componentCode.padEnd(20)} (se crearía)  ${block.sheet}!${w.sheetCell}`,
              );
              continue;
            }
            throw new Error(`No existe el componente ${w.componentCode}`);
          }
          keepComponentIds.push(component.componentId);

          if (!dryRun) {
            await tx.teamComponentWeight.upsert({
              where: {
                teamId_componentId_periodId: {
                  teamId: team.teamId,
                  componentId: component.componentId,
                  periodId: period.periodId,
                },
              },
              create: {
                teamId: team.teamId,
                componentId: component.componentId,
                periodId: period.periodId,
                weightPercent: new Prisma.Decimal(w.weight),
              },
              update: { weightPercent: new Prisma.Decimal(w.weight) },
            });
          }
          console.log(
            `   ${w.weight.toFixed(2)}  ${w.componentCode.padEnd(20)} ${block.sheet}!${w.sheetCell}`,
          );
        }

        // Pesos de este equipo/periodo que ya no corresponden: se retiran para que
        // la suma siga siendo 1.0 si el script se corrió antes con otro reparto.
        if (!dryRun) {
          const removed = await tx.teamComponentWeight.deleteMany({
            where: {
              teamId: team.teamId,
              periodId: period.periodId,
              componentId: { notIn: keepComponentIds },
            },
          });
          if (removed.count > 0)
            console.log(
              `   - ${removed.count} peso(s) obsoleto(s) retirado(s)`,
            );
        }
      }
    },
    { timeout: 120_000, maxWait: 20_000 },
  );

  if (dryRun) {
    console.log("\n(dry-run: no se escribió nada)");
    return;
  }

  // Verificación posterior: releer de la base y comprobar la suma.
  console.log("\n--- verificación ---");
  for (const block of WEIGHTS) {
    const team = await prisma.team.findFirst({
      where: { teamCode: block.teamCode },
    });
    if (!team) continue;
    const rows = await prisma.teamComponentWeight.findMany({
      where: { teamId: team.teamId, periodId: period.periodId },
      include: { component: { select: { componentCode: true } } },
    });
    const sum = rows.reduce((a, r) => a + Number(r.weightPercent), 0);
    const ok = Math.abs(sum - 1) < 1e-9;
    console.log(
      `${ok ? "✔" : "❌"} ${block.label.padEnd(24)} ${rows.length} componentes, suma = ${sum.toFixed(2)}`,
    );
  }
}

main()
  .catch((e) => {
    console.error("Error:", e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
