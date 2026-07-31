/**
 * Sube al ciclo los parámetros que hoy viven a nivel de mes.
 *
 * Los pesos, la curva y las cuotas se definen por ciclo; los meses los heredan.
 * Lo que ya está cargado en un mes quedaría como una excepción permanente que
 * tapa al ciclo para siempre, así que se copia al ciclo y se borra del mes.
 *
 * Se hace en una transacción: copiar sin borrar dejaría el mes como excepción
 * y el ciclo como valor muerto.
 *
 * Idempotente: si el ciclo ya tiene el parámetro, no lo pisa; solo limpia el mes.
 *
 * Uso:
 *   npm run promote:params -- --year=2026 --month=1 --dry-run
 *   npm run promote:params -- --year=2026 --month=1
 */
import './load-env';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  return process.argv
    .slice(2)
    .find((a) => a.startsWith(`--${name}=`))
    ?.split('=')[1];
}

async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes('--dry-run');
  const year = Number(arg('year'));
  const month = Number(arg('month'));

  const monthPeriod = await prisma.period.findFirst({
    where: { periodYear: year, periodMonth: month, periodType: 'MONTH' },
    include: { parent: true },
  });
  if (!monthPeriod) {
    console.error(`❌ No existe el mes ${year}-${month}`);
    process.exit(1);
  }
  if (!monthPeriod.parentPeriodId || !monthPeriod.parent) {
    console.error(
      `❌ ${year}-${month} no está enlazado a un ciclo. Corre antes: npm run seed:periods -- --year=${year}`,
    );
    process.exit(1);
  }

  const monthId = monthPeriod.periodId;
  const cycleId = monthPeriod.parentPeriodId;
  const cycleLabel = `Ciclo ${monthPeriod.parent.cycleNumber}`;

  const [weights, curve, targets] = await Promise.all([
    prisma.teamComponentWeight.findMany({ where: { periodId: monthId } }),
    prisma.curvePay.findMany({ where: { periodId: monthId } }),
    prisma.teamComponentTarget.findMany({ where: { periodId: monthId } }),
  ]);

  const [cw, cc, ct] = await Promise.all([
    prisma.teamComponentWeight.count({ where: { periodId: cycleId } }),
    prisma.curvePay.count({ where: { periodId: cycleId } }),
    prisma.teamComponentTarget.count({ where: { periodId: cycleId } }),
  ]);

  console.log(
    `${year}-${String(month).padStart(2, '0')} → ${cycleLabel}` +
      (dryRun ? '   [DRY-RUN, no escribe]' : ''),
  );
  console.log(`   pesos:  ${weights.length} en el mes, ${cw} ya en el ciclo`);
  console.log(`   curva:  ${curve.length} en el mes, ${cc} ya en el ciclo`);
  console.log(`   cuotas: ${targets.length} en el mes, ${ct} ya en el ciclo`);

  if (weights.length + curve.length + targets.length === 0) {
    console.log('\nNada que subir: el mes ya hereda todo del ciclo.');
    return;
  }
  if (dryRun) {
    console.log('\n(dry-run: no se escribió nada)');
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      // `skipDuplicates` respeta lo que el ciclo ya tenga: este script mueve,
      // no reescribe la parametrización del ciclo.
      if (weights.length > 0) {
        await tx.teamComponentWeight.createMany({
          data: weights.map((w) => ({
            teamId: w.teamId,
            componentId: w.componentId,
            periodId: cycleId,
            weightPercent: w.weightPercent,
            validFrom: w.validFrom,
            validTo: w.validTo,
          })),
          skipDuplicates: true,
        });
        await tx.teamComponentWeight.deleteMany({ where: { periodId: monthId } });
      }

      if (curve.length > 0) {
        await tx.curvePay.createMany({
          data: curve.map((c) => ({
            periodId: cycleId,
            componentId: c.componentId,
            minCompliancePercent: c.minCompliancePercent,
            payPercent: c.payPercent,
            isCeiling: c.isCeiling,
            active: c.active,
          })),
          skipDuplicates: true,
        });
        await tx.curvePay.deleteMany({ where: { periodId: monthId } });
      }

      if (targets.length > 0) {
        await tx.teamComponentTarget.createMany({
          data: targets.map((t) => ({
            employeeId: t.employeeId,
            componentId: t.componentId,
            periodId: cycleId,
            quotaValue: t.quotaValue,
          })),
          skipDuplicates: true,
        });
        await tx.teamComponentTarget.deleteMany({ where: { periodId: monthId } });
      }
    },
    { timeout: 120_000, maxWait: 30_000 },
  );

  const [aw, ac, at] = await Promise.all([
    prisma.teamComponentWeight.count({ where: { periodId: cycleId } }),
    prisma.curvePay.count({ where: { periodId: cycleId } }),
    prisma.teamComponentTarget.count({ where: { periodId: cycleId } }),
  ]);
  console.log(
    `\n✔ En ${cycleLabel}: ${aw} pesos, ${ac} escalones de curva, ${at} cuotas.\n` +
      `  El mes queda sin parámetros propios: los hereda del ciclo.`,
  );
}

main()
  .catch((e) => {
    console.error('Error:', e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
