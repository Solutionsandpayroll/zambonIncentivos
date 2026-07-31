/**
 * Cuota y venta de enero de Pablo Rodriguez, que en 2026-01 pertenecía a
 * Medical Sales Rep Xadago (pasó a GD desde febrero).
 *
 * Fuente: hoja "REP. XADAGO", filas 27:28. Ojo con la forma de esa hoja: la
 * cuota NO es por empleado sino **de país, compartida por todo el equipo** —
 * hay un único bloque (PRODUCTO / CUOTA / VENTA) que los tres representantes
 * usan por igual, y lo que los diferencia es su base salarial:
 *
 *     XADAGO (COM + INST)   peso 0.8   cuota 2.279.515.481   venta 2.182.744.995
 *     URSACOL               peso 0.2   cuota   699.164.348   venta 1.256.377.172
 *
 * Se comprobó contra los dos compañeros ya cargados (Orlando Ramos y Wilson
 * Landys): ambos tienen exactamente esos mismos valores en base. Pablo lleva
 * los mismos, y su liquidación difiere por su base (3.597.500 según BASES!F69,
 * la misma que ya tiene en Employee.baseSalary).
 *
 * Requiere que la asignación histórica de Pablo esté corregida (Xadago hasta
 * 2026-01-31), cosa que hace `npm run seed:directors`.
 *
 * Idempotente. Uso:
 *   npm run seed:pablo -- --year=2026 --month=1
 *   npm run seed:pablo -- --year=2026 --month=1 --dry-run
 */
import './load-env';
import { PrismaClient, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';

const prisma = new PrismaClient();
const BOOK = path.resolve(__dirname, '../../../../calculocomisiones.xlsx');

const DOC = '72131017';
const NAME = 'Pablo Emilio Rodriguez Osorio';

/** Bloque de cuota/venta del equipo en la hoja "REP. XADAGO". */
const SHEET_ROWS = [
  { row: 27, componentCode: 'XADAGO_COM_INST' },
  { row: 28, componentCode: 'URSACOL' },
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

  const employee = await prisma.employee.findFirst({
    where: { person: { documentNumber: DOC } },
    include: { person: true },
  });
  if (!employee) {
    console.error(`❌ No existe el empleado ${DOC}.`);
    process.exit(1);
  }

  // El equipo vigente en el periodo debe ser Xadago; si no, la corrección de
  // historial no se aplicó y cargar aquí dejaría los datos incoherentes.
  const assignment = await prisma.employeeTeamAssignment.findFirst({
    where: {
      employeeId: employee.employeeId,
      active: true,
      isPrimary: true,
      validFrom: { lte: period.endDate },
      OR: [{ validTo: null }, { validTo: { gte: period.startDate } }],
    },
    include: { team: true },
    orderBy: { validFrom: 'desc' },
  });
  if (!assignment) {
    console.error('❌ Pablo no tiene asignación vigente en el periodo.');
    process.exit(1);
  }
  if (assignment.team.teamCode !== 'MEDICAL_SALES_REP_XADAGO') {
    console.error(
      `❌ En ${periodLabel} Pablo resuelve a "${assignment.team.teamName}", no a Xadago.\n` +
        '   Corre antes: npm run seed:directors  (corrige su historial de equipo).',
    );
    process.exit(1);
  }
  console.log(`Equipo vigente en ${periodLabel}: ${assignment.team.teamName}  ✔`);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(BOOK);
  const ws = wb.getWorksheet('REP. XADAGO');
  if (!ws) throw new Error('No existe la hoja "REP. XADAGO"');

  type Row = { componentId: string; code: string; quota: number; sale: number };
  const rows: Row[] = [];

  console.log(`\n${NAME}   ← hoja "REP. XADAGO" (cuota de país, compartida por el equipo)`);
  for (const r of SHEET_ROWS) {
    const component = await prisma.salesComponent.findUnique({
      where: { componentCode: r.componentCode },
    });
    if (!component) throw new Error(`No existe el componente ${r.componentCode}`);

    const quota = num(ws.getCell('E' + r.row).value);
    const sale = num(ws.getCell('F' + r.row).value);
    if (quota == null || sale == null) {
      console.log(`   ⚠ fila ${r.row} ${r.componentCode}: sin cuota o venta, se omite`);
      continue;
    }
    rows.push({ componentId: component.componentId, code: r.componentCode, quota, sale });
    console.log(
      `   ${r.componentCode.padEnd(18)} Q=${quota.toLocaleString('es-CO').padStart(15)}  V=${sale.toLocaleString('es-CO').padStart(15)}   (fila ${r.row})`,
    );
  }

  if (dryRun) {
    console.log(`\n(dry-run) ${rows.length} cuotas + ${rows.length} ventas.`);
    return;
  }

  const admin = await prisma.appUser.findFirst({ where: { username: 'admin' } });
  if (!admin) {
    console.error('❌ No hay usuario admin. Corre antes: npm run seed:roles');
    process.exit(1);
  }

  await prisma.$transaction(
    async (tx) => {
      for (const r of rows) {
        await tx.teamComponentTarget.upsert({
          where: {
            employeeId_componentId_periodId: {
              employeeId: employee.employeeId,
              componentId: r.componentId,
              periodId: period.periodId,
            },
          },
          create: {
            employeeId: employee.employeeId,
            componentId: r.componentId,
            periodId: period.periodId,
            quotaValue: new Prisma.Decimal(r.quota),
          },
          update: { quotaValue: new Prisma.Decimal(r.quota) },
        });
      }

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
      await tx.salesTransaction.deleteMany({
        where: { periodId: period.periodId, employeeId: employee.employeeId },
      });
      await tx.salesTransaction.createMany({
        data: rows.map((r) => ({
          salesUploadBatchId: batch.salesUploadBatchId,
          employeeId: employee.employeeId,
          componentId: r.componentId,
          periodId: period.periodId,
          saleValue: new Prisma.Decimal(r.sale),
        })),
      });
    },
    { timeout: 120_000, maxWait: 30_000 },
  );

  console.log(`\n✔ ${rows.length} cuotas y ${rows.length} ventas escritas.`);

  const q = await prisma.teamComponentTarget.count({
    where: { periodId: period.periodId, employeeId: employee.employeeId },
  });
  const s = await prisma.salesTransaction.count({
    where: { periodId: period.periodId, employeeId: employee.employeeId },
  });
  console.log(`--- verificación ---\n${q === 2 && s === 2 ? '✔' : '⚠'} ${NAME}: ${q} cuotas, ${s} ventas`);
}

main()
  .catch((e) => {
    console.error('Error:', e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
