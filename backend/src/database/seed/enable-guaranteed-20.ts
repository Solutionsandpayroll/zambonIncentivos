/**
 * Activa el 20% en las condiciones de pago garantizado ya existentes.
 *
 * El pago garantizado es una excepción contractual (ingreso reciente, cambio de
 * zona, ajuste manual) que cubre un MÍNIMO. Hasta ahora las condiciones creadas
 * solo tenían `apply80Percent`, así que a esas personas se les garantizaba la
 * bolsa del 80% pero su 20% seguía dependiendo del KPI. Por decisión de negocio
 * el garantizado cubre ambos componentes.
 *
 * Solo toca condiciones con `apply20Percent = false`; las que ya lo tengan en
 * true se dejan como están.
 *
 * Idempotente. Uso:
 *   npm run fix:guaranteed-20 -- --dry-run
 *   npm run fix:guaranteed-20
 */
import './load-env';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes('--dry-run');

  const pending = await prisma.employeePaymentCondition.findMany({
    where: { apply20Percent: false },
    include: {
      employee: { include: { person: true } },
      period: { select: { periodYear: true, periodMonth: true, isClosed: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const total = await prisma.employeePaymentCondition.count();
  console.log(
    `${total} condiciones en total · ${pending.length} con apply20Percent = false` +
      (dryRun ? '   [DRY-RUN, no escribe]' : ''),
  );

  if (pending.length === 0) {
    console.log('Nada que activar.');
    return;
  }

  // Un periodo cerrado ya no admite cambios: se reporta y no se toca.
  const closed = pending.filter((c) => c.period.isClosed);
  const editable = pending.filter((c) => !c.period.isClosed);

  editable.forEach((c) => {
    const n = `${c.employee.person.firstName} ${c.employee.person.lastName}`.trim();
    const per = `${c.period.periodYear}-${String(c.period.periodMonth).padStart(2, '0')}`;
    console.log(`   ${n.slice(0, 32).padEnd(34)} ${per}  → apply20Percent = true`);
  });

  if (closed.length > 0) {
    console.log(`\n⚠ ${closed.length} en periodos cerrados, se omiten:`);
    closed.forEach((c) => {
      const n = `${c.employee.person.firstName} ${c.employee.person.lastName}`.trim();
      console.log(`   ${n}`);
    });
  }

  if (dryRun) {
    console.log('\n(dry-run: no se escribió nada)');
    return;
  }

  const res = await prisma.employeePaymentCondition.updateMany({
    where: { employeePaymentConditionId: { in: editable.map((c) => c.employeePaymentConditionId) } },
    data: { apply20Percent: true },
  });

  console.log(`\n✔ ${res.count} condiciones actualizadas.`);
  console.log(
    'Recuerda recalcular el periodo para que el cambio se refleje en las liquidaciones.',
  );
}

main()
  .catch((e) => {
    console.error('Error:', e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
