/**
 * Corrige el `validFrom` de las asignaciones que quedaron con la fecha en que
 * se cargaron al sistema (2026-07-23) en vez de la fecha real de vinculación.
 *
 * Por qué importa: desde que el motor resuelve el equipo a la fecha del periodo
 * (incentives.repository), una asignación que "empieza" en julio deja al
 * empleado fuera de la liquidación de enero. Y el libro oficial sí los liquida
 * en enero —Javier Morales y Fabiana Aristizabal tienen cuota, venta y pago en
 * "DIR. COMERCIAL" y "DIR. SELL OUT"—, así que la fecha de carga es el dato
 * equivocado, no su pertenencia al equipo.
 *
 * No inventa una fecha de ingreso: usa un ancla anterior al periodo más antiguo
 * que se liquida, dejando claro en el propio valor que es una corrección de
 * carga y no un dato de RR.HH. Si más adelante llega la fecha real de
 * vinculación, se sobrescribe sin consecuencias.
 *
 * Idempotente. Uso:
 *   npm run fix:assignment-dates -- --dry-run
 *   npm run fix:assignment-dates
 */
import './load-env';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Fecha de carga que se debe corregir. */
const IMPORT_DATE = new Date('2026-07-23');

/** Ancla: anterior a cualquier periodo liquidable. */
const ANCHOR = new Date('2025-01-01');

async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes('--dry-run');

  const rows = await prisma.employeeTeamAssignment.findMany({
    where: { validFrom: IMPORT_DATE },
    include: { team: true, employee: { include: { person: true } } },
  });

  if (rows.length === 0) {
    console.log('No hay asignaciones con la fecha de carga: nada que corregir.');
    return;
  }

  console.log(
    `${rows.length} asignaciones con validFrom = ${IMPORT_DATE.toISOString().slice(0, 10)} ` +
      `(fecha de carga) → ${ANCHOR.toISOString().slice(0, 10)}${dryRun ? '   [DRY-RUN]' : ''}\n`,
  );
  for (const r of rows) {
    const name = `${r.employee.person.firstName} ${r.employee.person.lastName}`.trim();
    console.log(`  ${name.slice(0, 32).padEnd(34)} ${r.team.teamName}`);
  }

  if (dryRun) {
    console.log('\n(dry-run: no se escribió nada)');
    return;
  }

  const res = await prisma.employeeTeamAssignment.updateMany({
    where: { validFrom: IMPORT_DATE },
    data: { validFrom: ANCHOR },
  });
  console.log(`\n✔ ${res.count} asignaciones corregidas.`);
}

main()
  .catch((e) => {
    console.error('Error:', e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
