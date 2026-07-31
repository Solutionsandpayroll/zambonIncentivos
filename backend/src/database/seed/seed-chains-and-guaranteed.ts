/**
 * Dos cargas pendientes del periodo:
 *
 * 1) Cuotas y ventas de Pharmacy Rep Chains que faltaban (Liseth Navarro y
 *    Norma Salazar). Fuente: hoja "Cuota - TM", que trae tres bloques de
 *    (CUOTA / ACUMULADO) por producto:
 *      D/E → SELL OUT FLUIMUCIL   (SELL_OUT_TOTAL_FLUIMUCIL)
 *      J/K → SELL OUT PANOTIL     (SELL_OUT_TOTAL_PANOTIL)
 *      P/Q → ORDER TAKING         (ORDER_TAKING)
 *    Es el mismo mapeo con el que ya están cargados sus 4 compañeros de equipo.
 *
 *    Samuel Sepúlveda (1088824722) NO se carga: aparece en "REP. TM (Cadena)"
 *    solo con su base salarial, y no tiene cuota en "Cuota - TM" ni en ninguna
 *    otra hoja. Sin cuota no hay cumplimiento; inventarle una sería decidir lo
 *    que cobra.
 *
 * 2) Pago garantizado del 80% de Liliana Oñoro y Renato Martinez (Rep VM).
 *    En la hoja "REP. VM (E+X)" sus filas 51 y 53 usan `P=+E27` y `P=+E29`
 *    —la bolsa completa del 80%— en vez de la fórmula con curva, y están
 *    marcadas "*PAGO GARANTIZADO" en la columna U. Eso es exactamente
 *    `EmployeePaymentCondition.apply80Percent`, que el motor aplica en
 *    calculation-engine: `result80 = gp?.apply80 ? theoretical80 : sum80`.
 *
 * Idempotente. Uso:
 *   npm run seed:chains-guaranteed -- --year=2026 --month=1
 *   npm run seed:chains-guaranteed -- --year=2026 --month=1 --dry-run
 */
import './load-env';
import { PrismaClient, Prisma, ConditionType } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const BOOK = path.resolve(__dirname, '../../../../calculocomisiones.xlsx');

/** Bloques (cuota, venta) por componente en la hoja "Cuota - TM". */
const TM_BLOCKS = [
  { docCol: 'B', quotaCol: 'D', saleCol: 'E', componentCode: 'SELL_OUT_TOTAL_FLUIMUCIL' },
  { docCol: 'H', quotaCol: 'J', saleCol: 'K', componentCode: 'SELL_OUT_TOTAL_PANOTIL' },
  { docCol: 'N', quotaCol: 'P', saleCol: 'Q', componentCode: 'ORDER_TAKING' },
];

/** Empleados de Pharmacy Rep Chains a completar, por cédula. */
const CHAINS_DOCS = ['1098622018', '26946191'];

/** Pago garantizado del 80% (hoja REP. VM (E+X), marca "*PAGO GARANTIZADO"). */
const GUARANTEED_80 = [
  { doc: '22478211', name: 'Liliana Patricia Oñoro Ospino', sheetRow: 51 },
  { doc: '72134866', name: 'Renato Antonio Martinez Narvaez', sheetRow: 53 },
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

  // ---------- 1) Pharmacy Rep Chains ----------
  const ws = wb.getWorksheet('Cuota - TM');
  if (!ws) throw new Error('No existe la hoja "Cuota - TM"');

  // Empleados por cédula (con su equipo, para no cargar a quien no toca).
  const people = await prisma.employee.findMany({
    include: { person: true },
  });
  const byDoc = new Map(people.map((e) => [String(e.person.documentNumber).trim(), e.employeeId]));

  const componentIds = new Map<string, string>();
  for (const b of TM_BLOCKS) {
    const c = await prisma.salesComponent.findUnique({
      where: { componentCode: b.componentCode },
    });
    if (!c) throw new Error(`No existe el componente ${b.componentCode}`);
    componentIds.set(b.componentCode, c.componentId);
  }

  type Row = { employeeId: string; componentId: string; quota: number; sale: number };
  const rows: Row[] = [];
  const touched = new Set<string>();

  console.log('\nPharmacy Rep Chains   ← hoja "Cuota - TM"');
  for (const doc of CHAINS_DOCS) {
    const employeeId = byDoc.get(doc);
    if (!employeeId) {
      console.log(`  ⚠ ${doc}: sin empleado en base, se omite`);
      continue;
    }
    // Localiza la fila del empleado en el primer bloque (misma fila en los tres).
    let row = -1;
    for (let r = 7; r <= 29; r++) {
      const v = num(ws.getCell('B' + r).value) ?? ws.getCell('B' + r).value;
      if (String(v).trim() === doc) {
        row = r;
        break;
      }
    }
    if (row < 0) {
      console.log(`  ⚠ ${doc}: no aparece en "Cuota - TM", se omite`);
      continue;
    }

    const shown: string[] = [];
    for (const b of TM_BLOCKS) {
      // Cada bloque repite la cédula en su propia columna: se verifica que
      // la fila corresponda al mismo empleado antes de leer sus números.
      const blockDoc = num(ws.getCell(b.docCol + row).value) ?? ws.getCell(b.docCol + row).value;
      if (String(blockDoc).trim() !== doc) {
        console.log(`  ⚠ ${doc}: la fila ${row} no coincide en el bloque ${b.componentCode}`);
        continue;
      }
      const quota = num(ws.getCell(b.quotaCol + row).value);
      const sale = num(ws.getCell(b.saleCol + row).value);
      if (quota == null || sale == null) continue;
      rows.push({ employeeId, componentId: componentIds.get(b.componentCode)!, quota, sale });
      shown.push(`${b.componentCode}: Q=${quota.toLocaleString('es-CO')} V=${sale.toLocaleString('es-CO')}`);
    }
    touched.add(employeeId);
    const name = String(ws.getCell('C' + row).value ?? '').trim();
    console.log(`  ${name.slice(0, 32).padEnd(34)} fila ${row}`);
    shown.forEach((s) => console.log(`      ${s}`));
  }

  // ---------- 2) Pago garantizado ----------
  console.log('\nPago garantizado 80%   ← hoja "REP. VM (E+X)" (marca *PAGO GARANTIZADO)');
  const guaranteed: Array<{ employeeId: string; name: string }> = [];
  for (const g of GUARANTEED_80) {
    const employeeId = byDoc.get(g.doc);
    if (!employeeId) {
      console.log(`  ⚠ ${g.doc} ${g.name}: sin empleado en base`);
      continue;
    }
    guaranteed.push({ employeeId, name: g.name });
    console.log(`  ${g.name.padEnd(34)} fila ${g.sheetRow}  → apply80Percent`);
  }

  if (dryRun) {
    console.log(
      `\n(dry-run) ${rows.length} cuotas + ${rows.length} ventas de ${touched.size} empleados; ` +
        `${guaranteed.length} pagos garantizados.`,
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
      // Cuotas
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

      // Ventas: lote propio y reemplazo solo de estos empleados.
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

      // Pago garantizado del 80%.
      for (const g of guaranteed) {
        const existing = await tx.employeePaymentCondition.findFirst({
          where: { employeeId: g.employeeId, periodId: period.periodId },
        });
        const data = {
          employeeId: g.employeeId,
          periodId: period.periodId,
          conditionType: ConditionType.MANUAL_ADJUSTMENT,
          apply80Percent: true,
          apply20Percent: false,
          notes: 'Pago garantizado del 80% — calculocomisiones.xlsx, hoja "REP. VM (E+X)", marca *PAGO GARANTIZADO',
        };
        if (existing) {
          await tx.employeePaymentCondition.update({
            where: { employeePaymentConditionId: existing.employeePaymentConditionId },
            data,
          });
        } else {
          await tx.employeePaymentCondition.create({ data });
        }
      }
    },
    { timeout: 120_000, maxWait: 30_000 },
  );

  console.log(
    `\n✔ ${rows.length} cuotas y ${rows.length} ventas escritas; ${guaranteed.length} pagos garantizados.`,
  );

  // Verificación
  console.log('\n--- verificación ---');
  const team = await prisma.team.findFirst({ where: { teamCode: 'PHARMACY_REP_CHAINS' } });
  if (team) {
    const asg = await prisma.employeeTeamAssignment.findMany({
      where: { teamId: team.teamId },
      select: { employeeId: true },
    });
    const ids = asg.map((a) => a.employeeId);
    const q = new Set(
      (
        await prisma.teamComponentTarget.findMany({
          where: { periodId: period.periodId, employeeId: { in: ids } },
          select: { employeeId: true },
        })
      ).map((x) => x.employeeId),
    ).size;
    const s = new Set(
      (
        await prisma.salesTransaction.findMany({
          where: { periodId: period.periodId, employeeId: { in: ids } },
          select: { employeeId: true },
        })
      ).map((x) => x.employeeId),
    ).size;
    console.log(`Pharmacy Rep Chains   ${q}/${ids.length} con cuota, ${s}/${ids.length} con venta`);
  }
  const gp = await prisma.employeePaymentCondition.count({ where: { periodId: period.periodId } });
  console.log(`condiciones de pago en el periodo: ${gp}`);
}

main()
  .catch((e) => {
    console.error('Error:', e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
