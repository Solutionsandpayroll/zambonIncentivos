/**
 * Carga la curva de pago oficial (calculocomisiones.xlsx · "Curve Pay") en un
 * periodo. Idempotente: reemplaza los escalones existentes de ese periodo.
 *
 * Uso:
 *   npm run seed:curve -- --periodId=<uuid>
 *   npm run seed:curve -- --year=2025 --month=5      (busca el periodo por año/mes)
 */
import './load-env';
import { PrismaClient, Prisma } from '@prisma/client';
import { OFFICIAL_CURVE_PAY } from './curve-pay.data';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const periodIdArg = args.find((a) => a.startsWith('--periodId='))?.split('=')[1];
  const yearArg = args.find((a) => a.startsWith('--year='))?.split('=')[1];
  const monthArg = args.find((a) => a.startsWith('--month='))?.split('=')[1];

  let period;
  if (periodIdArg) {
    period = await prisma.period.findUnique({ where: { periodId: periodIdArg } });
  } else if (yearArg && monthArg) {
    period = await prisma.period.findFirst({
      where: { periodYear: Number(yearArg), periodMonth: Number(monthArg) },
    });
  }

  if (!period) {
    console.error(
      '❌ No se encontró el periodo. Pasa --periodId=<uuid> o --year=YYYY --month=M.',
    );
    process.exit(1);
  }

  await prisma.$transaction(async (tx) => {
    await tx.curvePay.deleteMany({
      where: { periodId: period.periodId, componentId: null },
    });
    await tx.curvePay.createMany({
      data: OFFICIAL_CURVE_PAY.map((s) => ({
        periodId: period.periodId,
        componentId: null,
        minCompliancePercent: new Prisma.Decimal(s.minCompliancePercent),
        payPercent: new Prisma.Decimal(s.payPercent),
        isCeiling: s.isCeiling ?? false,
      })),
    });
  });

  console.log(
    `✔ Curva cargada (${OFFICIAL_CURVE_PAY.length} escalones) en el periodo ` +
      `${period.periodYear}-${String(period.periodMonth).padStart(2, '0')}`,
  );
}

main()
  .catch((e) => {
    console.error('Error:', e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
