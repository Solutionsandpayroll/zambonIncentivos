/**
 * Cuotas y ventas de los dos directores, y corrección del histórico de equipo
 * de Pablo Rodriguez.
 *
 * 1) DIRECTORES — fuente: hojas "DIR. COMERCIAL" (filas 22:24) y
 *    "DIR. SELL OUT" (filas 18:20). Ambas tienen la MISMA estructura del 80%:
 *    tres productos con peso 0.4 / 0.4 / 0.2, que es exactamente lo que ya
 *    tienen configurado sus equipos en team_component_weight. No hay que crear
 *    componentes: Fluimucil Fmlia., Xadago ® y Panotil ® ya existen.
 *
 *    Nota sobre Javier Morales: la cifra de 8.289.637.355 que aparece en la
 *    fila 30 de "DIR. COMERCIAL" NO es su cuota del 80%. Es el bloque
 *    "KPI 1: RECAUDO", que pesa 0.05 y forma parte del 20% de ejecución
 *    (junto con "KPI 2: Duo Dilligence", 0.15). El 20% se maneja como booleano
 *    por decisión de negocio, así que ese bloque no se persiste como cuota.
 *
 * 2) PABLO RODRIGUEZ (72131017) — en 2026-01 pertenecía a Medical Sales Rep
 *    Xadago; pasó a GD (District Manager) después. Se cierra la asignación
 *    vieja y se abre la nueva, en vez de reescribir la actual: así enero
 *    liquida con el equipo que tenía entonces y febrero en adelante con el
 *    nuevo. Requiere el filtro temporal de incentives.repository.
 *
 * Idempotente. Uso:
 *   npm run seed:directors -- --year=2026 --month=1
 *   npm run seed:directors -- --year=2026 --month=1 --dry-run
 */
import './load-env';
import { PrismaClient, Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const BOOK = path.resolve(__dirname, '../../../../calculocomisiones.xlsx');

/** Bloque de 80% de cada director: producto → (cuota, venta) por fila. */
const DIRECTORS: Array<{
  sheet: string;
  label: string;
  doc: string;
  rows: Array<{ row: number; componentCode: string; quotaCol: string; saleCol: string }>;
}> = [
  {
    sheet: 'DIR. COMERCIAL',
    label: 'Javier Morales (Commercial Director)',
    doc: '7169722',
    rows: [
      { row: 22, componentCode: 'FLUIMUCIL_FMLIA', quotaCol: 'D', saleCol: 'E' },
      { row: 23, componentCode: 'XADAGO', quotaCol: 'D', saleCol: 'E' },
      { row: 24, componentCode: 'PANOTIL', quotaCol: 'D', saleCol: 'E' },
    ],
  },
  {
    sheet: 'DIR. SELL OUT',
    label: 'Fabiana Aristizabal (Sell-Out Director)',
    doc: '31309556',
    rows: [
      { row: 18, componentCode: 'FLUIMUCIL_FMLIA', quotaCol: 'D', saleCol: 'E' },
      { row: 19, componentCode: 'XADAGO', quotaCol: 'D', saleCol: 'E' },
      { row: 20, componentCode: 'PANOTIL', quotaCol: 'D', saleCol: 'E' },
    ],
  },
];

/** Cambio de equipo de Pablo: Xadago hasta enero, GD desde febrero. */
const PABLO = {
  doc: '72131017',
  name: 'Pablo Emilio Rodriguez Osorio',
  previousTeamCode: 'MEDICAL_SALES_REP_XADAGO',
  currentTeamCode: 'DISTRICT_MANAGER',
  changeDate: new Date('2026-02-01'),
  previousEndsAt: new Date('2026-01-31'),
};

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
  const yearArg = arg('year');
  const monthArg = arg('month');
  const periodIdArg = arg('periodId');

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

  const people = await prisma.employee.findMany({ include: { person: true } });
  const byDoc = new Map(people.map((e) => [String(e.person.documentNumber).trim(), e.employeeId]));

  type Row = { employeeId: string; componentId: string; quota: number; sale: number };
  const rows: Row[] = [];
  const touched = new Set<string>();

  // ---------- 1) Directores ----------
  for (const dir of DIRECTORS) {
    const ws = wb.getWorksheet(dir.sheet);
    if (!ws) throw new Error(`No existe la hoja ${dir.sheet}`);

    const employeeId = byDoc.get(dir.doc);
    if (!employeeId) {
      console.log(`\n⚠ ${dir.label}: sin empleado en base (${dir.doc}), se omite`);
      continue;
    }

    console.log(`\n${dir.label}   ← hoja "${dir.sheet}"`);
    for (const r of dir.rows) {
      const component = await prisma.salesComponent.findUnique({
        where: { componentCode: r.componentCode },
      });
      if (!component) throw new Error(`No existe el componente ${r.componentCode}`);

      const quota = num(ws.getCell(r.quotaCol + r.row).value);
      const sale = num(ws.getCell(r.saleCol + r.row).value);
      if (quota == null || sale == null) {
        console.log(`   ⚠ fila ${r.row} ${r.componentCode}: sin cuota o venta, se omite`);
        continue;
      }
      rows.push({ employeeId, componentId: component.componentId, quota, sale });
      touched.add(employeeId);
      console.log(
        `   ${r.componentCode.padEnd(18)} Q=${quota.toLocaleString('es-CO').padStart(15)}  V=${sale.toLocaleString('es-CO').padStart(15)}   (fila ${r.row})`,
      );
    }
  }

  // ---------- 2) Historial de equipo de Pablo ----------
  console.log(`\n${PABLO.name}   — corrección de historial de equipo`);
  const pabloId = byDoc.get(PABLO.doc);
  let pabloPlan: { closeId: string | null; openTeamId: string } | null = null;

  if (!pabloId) {
    console.log('   ⚠ sin empleado en base, se omite');
  } else {
    const prevTeam = await prisma.team.findFirst({ where: { teamCode: PABLO.previousTeamCode } });
    const currTeam = await prisma.team.findFirst({ where: { teamCode: PABLO.currentTeamCode } });
    if (!prevTeam || !currTeam) throw new Error('No se encontraron los equipos de Pablo');

    const existing = await prisma.employeeTeamAssignment.findMany({
      where: { employeeId: pabloId },
      include: { team: true },
    });
    existing.forEach((a) =>
      console.log(
        `   actual: ${a.team.teamName} desde ${a.validFrom.toISOString().slice(0, 10)} hasta ${a.validTo ? a.validTo.toISOString().slice(0, 10) : '(abierta)'}`,
      ),
    );

    // La asignación abierta a GD se reescribe como la histórica de Xadago
    // (cerrada en enero) y se crea una nueva de GD desde febrero.
    const openGd = existing.find((a) => a.teamId === currTeam.teamId && a.validTo === null);
    const alreadyDone =
      existing.some((a) => a.teamId === prevTeam.teamId && a.validTo !== null) &&
      existing.some(
        (a) => a.teamId === currTeam.teamId && a.validFrom >= PABLO.changeDate,
      );

    if (alreadyDone) {
      console.log('   = ya estaba corregido, no se toca');
    } else {
      pabloPlan = { closeId: openGd?.employeeTeamAssignmentId ?? null, openTeamId: currTeam.teamId };
      console.log(
        `   → ${prevTeam.teamName} hasta ${PABLO.previousEndsAt.toISOString().slice(0, 10)}` +
          `  |  ${currTeam.teamName} desde ${PABLO.changeDate.toISOString().slice(0, 10)}`,
      );
      console.log('   (su cuota de enero sale de la hoja "REP. XADAGO", se carga aparte)');
    }
  }

  if (dryRun) {
    console.log(
      `\n(dry-run) ${rows.length} cuotas + ${rows.length} ventas de ${touched.size} empleados.`,
    );
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
              employeeId: r.employeeId,
              componentId: r.componentId,
              periodId: period.periodId,
            },
          },
          create: {
            employeeId: r.employeeId,
            componentId: r.componentId,
            periodId: period.periodId,
            quotaValue: new Prisma.Decimal(r.quota),
          },
          update: { quotaValue: new Prisma.Decimal(r.quota) },
        });
      }

      if (rows.length > 0) {
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
          where: { periodId: period.periodId, employeeId: { in: [...touched] } },
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
      }

      // Historial de Pablo.
      if (pabloId && pabloPlan) {
        const prevTeam = await tx.team.findFirst({
          where: { teamCode: PABLO.previousTeamCode },
        });
        if (prevTeam) {
          if (pabloPlan.closeId) {
            // La asignación abierta pasa a ser la histórica de Xadago, cerrada.
            await tx.employeeTeamAssignment.update({
              where: { employeeTeamAssignmentId: pabloPlan.closeId },
              data: { teamId: prevTeam.teamId, validTo: PABLO.previousEndsAt },
            });
          }
          await tx.employeeTeamAssignment.create({
            data: {
              employeeId: pabloId,
              teamId: pabloPlan.openTeamId,
              validFrom: PABLO.changeDate,
              validTo: null,
              isPrimary: true,
              active: true,
            },
          });
        }
      }
    },
    { timeout: 120_000, maxWait: 30_000 },
  );

  console.log(`\n✔ ${rows.length} cuotas y ${rows.length} ventas escritas.`);

  // Verificación
  console.log('\n--- verificación ---');
  for (const dir of DIRECTORS) {
    const employeeId = byDoc.get(dir.doc);
    if (!employeeId) continue;
    const q = await prisma.teamComponentTarget.count({
      where: { periodId: period.periodId, employeeId },
    });
    const s = await prisma.salesTransaction.count({
      where: { periodId: period.periodId, employeeId },
    });
    console.log(`${q === 3 && s === 3 ? '✔' : '⚠'} ${dir.label.padEnd(42)} ${q} cuotas, ${s} ventas`);
  }
  if (pabloId) {
    const asg = await prisma.employeeTeamAssignment.findMany({
      where: { employeeId: pabloId },
      include: { team: true },
      orderBy: { validFrom: 'asc' },
    });
    asg.forEach((a) =>
      console.log(
        `  Pablo: ${a.team.teamName.padEnd(26)} ${a.validFrom.toISOString().slice(0, 10)} → ${a.validTo ? a.validTo.toISOString().slice(0, 10) : '(abierta)'}`,
      ),
    );
  }
}

main()
  .catch((e) => {
    console.error('Error:', e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
