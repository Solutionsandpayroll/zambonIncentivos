/**
 * Carga las cuotas por empleado/componente (team_component_target) de
 * REP. VM (E+X) y GD (District Manager), leyéndolas del libro oficial.
 *
 * Fuente: calculocomisiones.xlsx
 *   - "REP. VM (E+X)" filas 44:59 → columnas D (Fluimucil), H (Monuril), L (Flutox)
 *   - "GD"            filas 31:32 → columnas D (Fluimucil PH360), H (Monuril PH360), L (XADAGO)
 * En ambas hojas la columna de CUOTA es la primera del trío por componente
 * (CUOTA / VENTA / CUMP. / % TABLA), y el empleado se identifica por la cédula
 * de la columna B.
 *
 * Notas de datos reales que NO son errores (verificadas en la hoja):
 *   - Diana Cortes (f.54) y Claudia Matta (f.59) tienen Monuril = 0. La hoja lo
 *     trata con IF(OR(H=0,...),0%) → cumplimiento 0. El motor hace lo mismo
 *     (calculation-engine: `quota.isZero() ? ZERO : sale/quota`), así que se
 *     cargan tal cual: un 0 explícito es "no aplica", no un dato faltante.
 *   - El tercer componente de esas dos filas y de los dos GD viene marcado como
 *     "FUENTE SELL IN NET SALES - XADAGO": son pesos, no unidades, de ahí la
 *     magnitud (2.279.515.481) frente a las unidades del resto.
 *
 * Idempotente: upsert por (employeeId, componentId, periodId).
 *
 * Uso:
 *   npm run seed:targets:vm-gd -- --year=2026 --month=1
 *   npm run seed:targets:vm-gd -- --year=2026 --month=1 --dry-run
 */
import './load-env';
import { PrismaClient, Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import * as path from 'path';

const prisma = new PrismaClient();
const BOOK = path.resolve(__dirname, '../../../../calculocomisiones.xlsx');

const BLOCKS: Array<{
  sheet: string;
  teamCode: string;
  label: string;
  firstRow: number;
  lastRow: number;
  docCol: string;
  nameCol: string;
  quotaCols: Array<{ col: string; componentCode: string }>;
}> = [
  {
    sheet: 'REP. VM (E+X)',
    teamCode: 'MEDICAL_REP_SENIOR_E_X',
    label: 'Rep VM (E+X)',
    firstRow: 44,
    lastRow: 59,
    docCol: 'B',
    nameCol: 'C',
    quotaCols: [
      { col: 'D', componentCode: 'FLUIMUCIL_VM' },
      { col: 'H', componentCode: 'MONURIL_VM' },
      { col: 'L', componentCode: 'FLUTOX' },
    ],
  },
  {
    sheet: 'GD',
    teamCode: 'DISTRICT_MANAGER',
    label: 'GD (District Manager)',
    firstRow: 31,
    lastRow: 32,
    docCol: 'B',
    nameCol: 'C',
    quotaCols: [
      { col: 'D', componentCode: 'FLUIMUCIL_PH360' },
      { col: 'H', componentCode: 'MONURIL_PH360' },
      { col: 'L', componentCode: 'XADAGO' },
    ],
  },
];

/** Lee un número, resolviendo celdas con fórmula por su resultado cacheado. */
function num(v: unknown): number | null {
  if (v && typeof v === 'object') {
    const r = (v as { result?: unknown }).result;
    return typeof r === 'number' ? r : null;
  }
  return typeof v === 'number' ? v : null;
}

function arg(name: string): string | undefined {
  return process.argv
    .slice(2)
    .find((a) => a.startsWith(`--${name}=`))
    ?.split('=')[1];
}

async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes('--dry-run');
  const periodIdArg = arg('periodId');
  const yearArg = arg('year');
  const monthArg = arg('month');

  const period = periodIdArg
    ? await prisma.period.findUnique({ where: { periodId: periodIdArg } })
    : yearArg && monthArg
      ? await prisma.period.findFirst({
          where: { periodYear: Number(yearArg), periodMonth: Number(monthArg) },
        })
      : null;

  if (!period) {
    console.error('❌ No se encontró el periodo. Pasa --periodId=<uuid> o --year=YYYY --month=M.');
    process.exit(1);
  }
  if (period.isClosed) {
    console.error('❌ El periodo está cerrado.');
    process.exit(1);
  }

  const periodLabel = `${period.periodYear}-${String(period.periodMonth).padStart(2, '0')}`;
  console.log(`Periodo: ${periodLabel}${dryRun ? '   [DRY-RUN, no escribe]' : ''}`);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(BOOK);

  let written = 0;
  const skipped: string[] = [];

  for (const b of BLOCKS) {
    const ws = wb.getWorksheet(b.sheet);
    if (!ws) throw new Error(`No existe la hoja ${b.sheet}`);

    const team = await prisma.team.findFirst({ where: { teamCode: b.teamCode } });
    if (!team) throw new Error(`No existe el equipo ${b.teamCode}`);

    // Empleados del equipo, indexados por cédula, para cruzar con la hoja.
    const assignments = await prisma.employeeTeamAssignment.findMany({
      where: { teamId: team.teamId },
      include: { employee: { include: { person: true } } },
    });
    const byDoc = new Map(
      assignments.map((a) => [String(a.employee.person.documentNumber).trim(), a.employeeId]),
    );

    // Componentes destino.
    const components = new Map<string, string>();
    for (const q of b.quotaCols) {
      const c = await prisma.salesComponent.findUnique({
        where: { componentCode: q.componentCode },
      });
      if (!c) throw new Error(`No existe el componente ${q.componentCode}`);
      components.set(q.componentCode, c.componentId);
    }

    console.log(`\n${b.label}   ← hoja "${b.sheet}" filas ${b.firstRow}-${b.lastRow}`);

    for (let r = b.firstRow; r <= b.lastRow; r++) {
      const rawDoc = ws.getCell(b.docCol + r).value;
      const name = String(ws.getCell(b.nameCol + r).value ?? '').trim();
      if (rawDoc == null) continue;
      const doc = String(num(rawDoc) ?? rawDoc).trim();

      const employeeId = byDoc.get(doc);
      if (!employeeId) {
        skipped.push(`${b.sheet}!${r}  ${doc}  ${name}  (sin empleado en el equipo)`);
        continue;
      }

      const values: string[] = [];
      for (const q of b.quotaCols) {
        const quota = num(ws.getCell(q.col + r).value);
        if (quota == null) {
          values.push(`${q.componentCode}=—`);
          continue;
        }
        if (!dryRun) {
          await prisma.teamComponentTarget.upsert({
            where: {
              employeeId_componentId_periodId: {
                employeeId,
                componentId: components.get(q.componentCode)!,
                periodId: period.periodId,
              },
            },
            create: {
              employeeId,
              componentId: components.get(q.componentCode)!,
              periodId: period.periodId,
              quotaValue: new Prisma.Decimal(quota),
            },
            update: { quotaValue: new Prisma.Decimal(quota) },
          });
        }
        written++;
        values.push(`${q.componentCode}=${quota.toLocaleString('es-CO')}`);
      }
      console.log(`  ${name.slice(0, 34).padEnd(36)} ${values.join('  ')}`);
    }
  }

  if (skipped.length) {
    console.log('\n⚠ filas de la hoja que no se cruzaron con ningún empleado:');
    skipped.forEach((s) => console.log('   ' + s));
  }

  console.log(`\n${dryRun ? '(dry-run) se escribirían' : 'escritas'} ${written} cuotas.`);
  if (dryRun) return;

  // Verificación: cuántos empleados de cada equipo quedaron con cuota.
  console.log('\n--- verificación ---');
  for (const b of BLOCKS) {
    const team = await prisma.team.findFirst({ where: { teamCode: b.teamCode } });
    if (!team) continue;
    const asg = await prisma.employeeTeamAssignment.findMany({
      where: { teamId: team.teamId },
      select: { employeeId: true },
    });
    const ids = asg.map((a) => a.employeeId);
    const rows = await prisma.teamComponentTarget.findMany({
      where: { periodId: period.periodId, employeeId: { in: ids } },
      select: { employeeId: true },
    });
    const withQuota = new Set(rows.map((x) => x.employeeId)).size;
    const ok = withQuota === ids.length;
    console.log(
      `${ok ? '✔' : '⚠'} ${b.label.padEnd(24)} ${withQuota}/${ids.length} empleados con cuota, ${rows.length} filas`,
    );
  }
}

main()
  .catch((e) => {
    console.error('Error:', e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
