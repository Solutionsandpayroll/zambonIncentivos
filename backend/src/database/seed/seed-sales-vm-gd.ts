/**
 * Carga las ventas por empleado/componente (sales_transaction) de
 * REP. VM (E+X) y GD (District Manager), leyéndolas del libro oficial.
 *
 * Fuente: calculocomisiones.xlsx — la VENTA es la columna que sigue a cada CUOTA
 * en el trío (CUOTA / VENTA / CUMP. / % TABLA):
 *   - "REP. VM (E+X)" filas 44:59 → E (Fluimucil), I (Monuril), M (Flutox)
 *   - "GD"            filas 31:32 → E (Fluimucil PH360), I (Monuril PH360), M (XADAGO)
 *
 * A diferencia de `import-commissions`, este script NO borra las ventas de todo
 * el periodo: solo reemplaza las de los empleados de estos dos equipos. Borrar
 * por periodo se llevaría por delante las 64 ventas ya cargadas de los demás.
 *
 * Idempotente: cada corrida crea un lote nuevo y sustituye únicamente las
 * ventas de los empleados que toca.
 *
 * Uso:
 *   npm run seed:sales:vm-gd -- --year=2026 --month=1
 *   npm run seed:sales:vm-gd -- --year=2026 --month=1 --dry-run
 */
import './load-env';
import { PrismaClient, Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import * as crypto from 'crypto';
import * as fs from 'fs';
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
  saleCols: Array<{ col: string; componentCode: string }>;
}> = [
  {
    sheet: 'REP. VM (E+X)',
    teamCode: 'MEDICAL_REP_SENIOR_E_X',
    label: 'Rep VM (E+X)',
    firstRow: 44,
    lastRow: 59,
    docCol: 'B',
    nameCol: 'C',
    saleCols: [
      { col: 'E', componentCode: 'FLUIMUCIL_VM' },
      { col: 'I', componentCode: 'MONURIL_VM' },
      { col: 'M', componentCode: 'FLUTOX' },
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
    saleCols: [
      { col: 'E', componentCode: 'FLUIMUCIL_PH360' },
      { col: 'I', componentCode: 'MONURIL_PH360' },
      { col: 'M', componentCode: 'XADAGO' },
    ],
  },
];

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

  // 1) Recolectar todo antes de escribir, para poder validar y mostrar.
  type Row = { employeeId: string; componentId: string; sale: number };
  const rows: Row[] = [];
  const touchedEmployees = new Set<string>();
  const skipped: string[] = [];
  const preview: string[] = [];

  for (const b of BLOCKS) {
    const ws = wb.getWorksheet(b.sheet);
    if (!ws) throw new Error(`No existe la hoja ${b.sheet}`);

    const team = await prisma.team.findFirst({ where: { teamCode: b.teamCode } });
    if (!team) throw new Error(`No existe el equipo ${b.teamCode}`);

    const assignments = await prisma.employeeTeamAssignment.findMany({
      where: { teamId: team.teamId },
      include: { employee: { include: { person: true } } },
    });
    const byDoc = new Map(
      assignments.map((a) => [String(a.employee.person.documentNumber).trim(), a.employeeId]),
    );

    const components = new Map<string, string>();
    for (const s of b.saleCols) {
      const c = await prisma.salesComponent.findUnique({
        where: { componentCode: s.componentCode },
      });
      if (!c) throw new Error(`No existe el componente ${s.componentCode}`);
      components.set(s.componentCode, c.componentId);
    }

    preview.push(`\n${b.label}   ← hoja "${b.sheet}" filas ${b.firstRow}-${b.lastRow}`);

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
      touchedEmployees.add(employeeId);

      const shown: string[] = [];
      for (const s of b.saleCols) {
        const sale = num(ws.getCell(s.col + r).value);
        if (sale == null) {
          shown.push(`${s.componentCode}=—`);
          continue;
        }
        rows.push({ employeeId, componentId: components.get(s.componentCode)!, sale });
        shown.push(`${s.componentCode}=${sale.toLocaleString('es-CO')}`);
      }
      preview.push(`  ${name.slice(0, 34).padEnd(36)} ${shown.join('  ')}`);
    }
  }

  preview.forEach((l) => console.log(l));

  if (skipped.length) {
    console.log('\n⚠ filas de la hoja que no se cruzaron con ningún empleado:');
    skipped.forEach((s) => console.log('   ' + s));
  }

  if (dryRun) {
    console.log(`\n(dry-run) se escribirían ${rows.length} ventas de ${touchedEmployees.size} empleados.`);
    return;
  }

  const admin = await prisma.appUser.findFirst({ where: { username: 'admin' } });
  if (!admin) {
    console.error('❌ No hay usuario admin para atribuir el lote. Corre antes: npm run seed:roles');
    process.exit(1);
  }

  await prisma.$transaction(
    async (tx) => {
      const batch = await tx.salesUploadBatch.create({
        data: {
          periodId: period.periodId,
          uploadedByUserId: admin.userId,
          fileName: path.basename(BOOK),
          fileHash: crypto.createHash('sha256').update(fs.readFileSync(BOOK)).digest('hex'),
          sourceFormat: 'XLSX',
          status: 'IMPORTED',
        },
      });

      // Solo las ventas de ESTOS empleados: borrar por periodo se llevaría las
      // de los demás equipos, ya cargadas por import-commissions.
      await tx.salesTransaction.deleteMany({
        where: { periodId: period.periodId, employeeId: { in: [...touchedEmployees] } },
      });

      await tx.salesTransaction.createMany({
        data: rows.map((r) => ({
          salesUploadBatchId: batch.salesUploadBatchId,
          employeeId: r.employeeId,
          componentId: r.componentId,
          periodId: period.periodId,
          saleValue: new Prisma.Decimal(r.sale),
        })),
      });

      console.log(`\n✔ ${rows.length} ventas escritas (lote ${batch.salesUploadBatchId})`);
    },
    { timeout: 120_000, maxWait: 30_000 },
  );

  // Verificación.
  console.log('\n--- verificación ---');
  for (const b of BLOCKS) {
    const team = await prisma.team.findFirst({ where: { teamCode: b.teamCode } });
    if (!team) continue;
    const asg = await prisma.employeeTeamAssignment.findMany({
      where: { teamId: team.teamId },
      select: { employeeId: true },
    });
    const ids = asg.map((a) => a.employeeId);
    const tx = await prisma.salesTransaction.findMany({
      where: { periodId: period.periodId, employeeId: { in: ids } },
      select: { employeeId: true },
    });
    const withSale = new Set(tx.map((x) => x.employeeId)).size;
    console.log(
      `${withSale === ids.length ? '✔' : '⚠'} ${b.label.padEnd(24)} ${withSale}/${ids.length} empleados con venta, ${tx.length} filas`,
    );
  }
  const total = await prisma.salesTransaction.count({ where: { periodId: period.periodId } });
  console.log(`total ventas del periodo: ${total}`);
}

main()
  .catch((e) => {
    console.error('Error:', e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
