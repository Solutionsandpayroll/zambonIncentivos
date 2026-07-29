/**
 * Importa cuotas y ventas reales desde `calculocomisiones.xlsx`.
 *
 * QUÉ SE IMPORTA (entrada del cálculo):
 *   - Componentes de venta        -> sales_component
 *   - Pesos por equipo y periodo  -> team_component_weight
 *   - Cuotas por empleado         -> team_component_target
 *   - Ventas por empleado         -> sales_transaction (dentro de un lote)
 *
 * QUÉ NO SE IMPORTA (lo produce el motor):
 *   - % cumplimiento, % tabla, TOTAL, pagos del 80/20 y hojas de RESUMEN.
 *     El TOTAL del Excel se conserva solo en el informe, para contrastar.
 *
 * Uso:
 *   npm run import:commissions              # SIMULACIÓN: no escribe nada
 *   npm run import:commissions -- --apply   # escribe en la base
 *   npm run import:commissions -- --period=2026-1 --file=../otro.xlsx
 *
 * Es idempotente: repetir la carga actualiza los mismos registros (upsert por
 * empleado+componente+periodo) en vez de duplicarlos.
 */
import './load-env';
import { PrismaClient, Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import {
  extractBlocks,
  extractProductTable,
  toComponentCode,
  inferComponentType,
  cellToString,
  SheetRow,
  ComponentBlock,
} from './commissions-import.helpers';

const prisma = new PrismaClient();

/** Hojas que no son de equipo: consolidados, parámetros y referencias. */
const NON_TEAM_SHEETS = new Set([
  'RESUMEN',
  'RESUMEN (04)',
  'Curve Pay',
  'BASES',
  'NOVEDADES',
  'RECAUDO',
  'Cuota - TM',
]);

/**
 * Hoja del Excel -> `team_code` en la base.
 * Se mapea explícitamente porque los nombres del Excel son abreviaturas de uso
 * interno y no coinciden con los códigos del sistema.
 */
const SHEET_TO_TEAM: Record<string, string> = {
  'REP. TM (Cadena)': 'PHARMACY_REP_CHAINS',
  'REP. TM (IND)': 'PHARMACY_REP_INDEPENDET',
  'Coor. TM': 'NATIONAL_PHARMACY_COORDINATOR',
  'REP. XADAGO': 'MEDICAL_SALES_REP_XADAGO',
  'REP. MIXTA': 'MEDICAL_REP_MIXTA_INDEPENDET',
  'REP. VM (E+X)': 'MEDICAL_REP_SENIOR_E_X',
  GD: 'DISTRICT_MANAGER',
  KAMS: 'REGIONAL_SALES_MANAGER_KAM',
  'DIR. COMERCIAL': 'COMMERCIAL_MARKET_ACCESS_DIRECTOR',
  'DIR. SELL OUT': 'DIRECTORA_DBDT_SELL_OUT',
};

interface Args {
  apply: boolean;
  year: number;
  month: number;
  file: string;
}

/** Raíz del proyecto (dos niveles por encima de `backend/src`). */
const PROJECT_ROOT = path.resolve(__dirname, '../../../..');

/** Resuelve la ruta del libro relativa a la raíz del proyecto. */
function resolveFile(file: string): string {
  return path.isAbsolute(file) ? file : path.resolve(PROJECT_ROOT, file);
}

/** Huella del archivo cargado: permite rastrear qué versión originó un lote. */
function fileHash(file: string): string {
  const buffer = fs.readFileSync(resolveFile(file));
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (name: string): string | undefined =>
    argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];

  const period = get('period') ?? '2026-1';
  const [year, month] = period.split('-').map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    throw new Error(`--period inválido: "${period}". Formato esperado: AAAA-M`);
  }

  return {
    apply: argv.includes('--apply'),
    year,
    month,
    file: get('file') ?? 'calculocomisiones.xlsx',
  };
}

/** Una fila lista para insertar, ya resuelta contra la base. */
interface ResolvedRow {
  sheet: string;
  teamCode: string;
  componentName: string;
  employeeId: string;
  documentNumber: string;
  employeeName: string;
  quota: number;
  sale: number;
  expectedTotal: number | null;
}

interface Report {
  resolved: ResolvedRow[];
  components: Map<string, { name: string; type: string }>;
  weights: { teamCode: string; componentName: string; weight: number }[];
  skippedPlaceholder: ResolvedRow[];
  unknownEmployees: { sheet: string; documentNumber: string; name: string }[];
  unmappedSheets: string[];
  weightWarnings: string[];
}

/** Empleado del equipo, ya resuelto contra la base. */
interface SheetMember {
  employeeId: string;
  documentNumber: string;
  fullName: string;
}

/**
 * Empleados listados en la cabecera de una hoja (tabla IDENTIFICACIÓN / NOMBRE
 * EMPLEADO). En las hojas con tabla por producto, la cuota es del equipo y hay
 * que repartirla entre estos miembros.
 *
 * Solo se devuelven los que existen en la base: un nombre suelto sin empleado
 * asociado no puede recibir cuota.
 */
function extractSheetMembers(
  rows: SheetRow[],
  byDocument: Map<string, { employeeId: string; person: { fullName: string | null } }>,
): SheetMember[] {
  const members: SheetMember[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (!row) continue;
    for (let col = 1; col < row.length; col++) {
      const value = cellToString(row[col]).trim();
      if (!/^\d{6,11}$/.test(value) || seen.has(value)) continue;

      const employee = byDocument.get(value);
      if (!employee) continue;

      seen.add(value);
      members.push({
        employeeId: employee.employeeId,
        documentNumber: value,
        fullName: employee.person.fullName ?? '',
      });
    }
  }

  return members;
}

async function analyze(args: Args): Promise<Report> {
  const filePath = resolveFile(args.file);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  // Índice documento -> empleado, para resolver por cédula.
  const employees = await prisma.employee.findMany({
    select: { employeeId: true, person: { select: { documentNumber: true, fullName: true } } },
  });
  const byDocument = new Map(
    employees.map((e) => [String(e.person.documentNumber).trim(), e]),
  );

  const teams = await prisma.team.findMany({ select: { teamId: true, teamCode: true } });
  const teamCodes = new Set(teams.map((t) => t.teamCode));

  const report: Report = {
    resolved: [],
    components: new Map(),
    weights: [],
    skippedPlaceholder: [],
    unknownEmployees: [],
    unmappedSheets: [],
    weightWarnings: [],
  };

  for (const ws of wb.worksheets) {
    if (NON_TEAM_SHEETS.has(ws.name)) continue;

    const teamCode = SHEET_TO_TEAM[ws.name];
    if (!teamCode || !teamCodes.has(teamCode)) {
      report.unmappedSheets.push(ws.name);
      continue;
    }

    // Volcar la hoja a filas indexadas desde 1 (como las entrega ExcelJS).
    const rows: SheetRow[] = [];
    for (let i = 1; i <= ws.rowCount; i++) {
      rows[i - 1] = ws.getRow(i).values as SheetRow;
    }

    const blocks: ComponentBlock[] = extractBlocks(rows);
    let weightSum = 0;

    for (const block of blocks) {
      const code = toComponentCode(block.name);
      report.components.set(code, {
        name: block.name,
        type: inferComponentType(block.name),
      });

      if (block.weight !== null) {
        weightSum += block.weight;
        report.weights.push({
          teamCode,
          componentName: block.name,
          weight: block.weight,
        });
      }

      for (const row of block.rows) {
        const employee = byDocument.get(row.documentNumber);
        if (!employee) {
          report.unknownEmployees.push({
            sheet: ws.name,
            documentNumber: row.documentNumber,
            name: row.employeeName,
          });
          continue;
        }

        const resolved: ResolvedRow = {
          sheet: ws.name,
          teamCode,
          componentName: block.name,
          employeeId: employee.employeeId,
          documentNumber: row.documentNumber,
          employeeName: row.employeeName || (employee.person.fullName ?? ''),
          quota: row.quota,
          sale: row.sale,
          expectedTotal: row.expectedTotal,
        };

        // Las filas marcadoras (cuota=1, venta=1) NO son datos: importarlas
        // crearía cuotas ficticias y cumplimientos del 100% inventados.
        if (row.isPlaceholder) report.skippedPlaceholder.push(resolved);
        else report.resolved.push(resolved);
      }
    }

    // Segundo formato: una tabla por producto, cuya cuota aplica a todo el
    // equipo. Solo se intenta si la hoja no traía bloques por empleado.
    if (blocks.length === 0) {
      const products = extractProductTable(rows);

      if (products.length > 0) {
        // Los miembros del equipo salen de la cabecera de la hoja (la tabla de
        // IDENTIFICACIÓN / NOMBRE EMPLEADO que la encabeza).
        const members = extractSheetMembers(rows, byDocument);

        if (members.length === 0) {
          report.unmappedSheets.push(`${ws.name} (tabla por producto sin empleados legibles)`);
        } else {
          for (const product of products) {
            const code = toComponentCode(product.productName);
            report.components.set(code, {
              name: product.productName,
              type: inferComponentType(product.productName),
            });

            weightSum += product.weight;
            report.weights.push({
              teamCode,
              componentName: product.productName,
              weight: product.weight,
            });

            for (const member of members) {
              report.resolved.push({
                sheet: ws.name,
                teamCode,
                componentName: product.productName,
                employeeId: member.employeeId,
                documentNumber: member.documentNumber,
                employeeName: member.fullName,
                quota: product.quota,
                sale: product.sale,
                expectedTotal: product.expectedTotal,
              });
            }
          }
        }
      }
    }

    // Los pesos de un equipo deben sumar 1.0 (regla del esquema).
    if (weightSum > 0 && Math.abs(weightSum - 1) > 0.001) {
      report.weightWarnings.push(
        `${ws.name} (${teamCode}): los pesos suman ${weightSum.toFixed(4)}, se esperaba 1.0`,
      );
    }
  }

  return report;
}

function printReport(report: Report, args: Args): void {
  const money = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 2 });

  console.log('='.repeat(76));
  console.log(`  IMPORTACIÓN DE COMISIONES — periodo ${args.year}-${args.month}`);
  console.log(`  Modo: ${args.apply ? 'APLICAR (escribe en la base)' : 'SIMULACIÓN (no escribe nada)'}`);
  console.log('='.repeat(76));

  console.log(`\n▸ COMPONENTES DETECTADOS (${report.components.size})`);
  for (const [code, c] of report.components) {
    console.log(`    ${code.padEnd(34)} ${c.type.padEnd(13)} ${c.name}`);
  }

  console.log(`\n▸ PESOS POR EQUIPO (${report.weights.length})`);
  const byTeam = new Map<string, typeof report.weights>();
  for (const w of report.weights) {
    if (!byTeam.has(w.teamCode)) byTeam.set(w.teamCode, []);
    byTeam.get(w.teamCode)!.push(w);
  }
  for (const [team, ws] of byTeam) {
    const total = ws.reduce((s, w) => s + w.weight, 0);
    console.log(`    ${team}  (suma ${total.toFixed(2)})`);
    for (const w of ws) {
      console.log(`      · ${String((w.weight * 100).toFixed(0) + '%').padStart(4)}  ${w.componentName}`);
    }
  }

  console.log(`\n▸ FILAS A IMPORTAR: ${report.resolved.length}`);
  const perSheet = new Map<string, number>();
  for (const r of report.resolved) {
    perSheet.set(r.sheet, (perSheet.get(r.sheet) ?? 0) + 1);
  }
  for (const [sheet, n] of perSheet) {
    console.log(`    ${sheet.padEnd(20)} ${String(n).padStart(4)} filas`);
  }

  const empleados = new Set(report.resolved.map((r) => r.documentNumber));
  const ventaTotal = report.resolved.reduce((s, r) => s + r.sale, 0);
  console.log(`\n    Empleados distintos : ${empleados.size}`);
  console.log(`    Suma de ventas      : ${money(ventaTotal)}`);

  if (report.skippedPlaceholder.length) {
    console.log(`\n▸ OMITIDAS — marcador "sin cuota" (cuota=1, venta=1): ${report.skippedPlaceholder.length}`);
    for (const r of report.skippedPlaceholder.slice(0, 10)) {
      console.log(`    ${r.sheet.padEnd(18)} ${r.documentNumber.padEnd(12)} ${r.employeeName.slice(0, 26).padEnd(26)} ${r.componentName.slice(0, 24)}`);
    }
    if (report.skippedPlaceholder.length > 10) {
      console.log(`    ... y ${report.skippedPlaceholder.length - 10} más`);
    }
  }

  if (report.unknownEmployees.length) {
    console.log(`\n▸ ⚠ EMPLEADOS NO ENCONTRADOS EN LA BASE: ${report.unknownEmployees.length}`);
    for (const u of report.unknownEmployees.slice(0, 10)) {
      console.log(`    ${u.sheet.padEnd(18)} ${u.documentNumber.padEnd(12)} ${u.name}`);
    }
  }

  if (report.unmappedSheets.length) {
    console.log(`\n▸ HOJAS SIN MAPEO A EQUIPO (se omiten): ${report.unmappedSheets.join(', ')}`);
  }

  if (report.weightWarnings.length) {
    console.log('\n▸ ⚠ PESOS QUE NO SUMAN 1.0');
    for (const w of report.weightWarnings) console.log(`    ${w}`);
  }
}

async function apply(report: Report, args: Args): Promise<void> {
  const period = await prisma.period.findFirst({
    where: { periodYear: args.year, periodMonth: args.month },
  });
  if (!period) {
    throw new Error(`No existe el periodo ${args.year}-${args.month}. Créalo antes de importar.`);
  }
  if (period.isClosed) {
    throw new Error(`El periodo ${args.year}-${args.month} está CERRADO: no admite cargas.`);
  }

  // Los 5 s por defecto de Prisma no alcanzan: son varias operaciones contra
  // Supabase (latencia de red por cada una) y la carga debe ser atómica.
  await prisma.$transaction(
    async (tx) => {
      // 1. Componentes
      const componentIds = new Map<string, string>();
      for (const [code, c] of report.components) {
        const saved = await tx.salesComponent.upsert({
          where: { componentCode: code },
          create: {
            componentCode: code,
            componentName: c.name,
            componentType: c.type as never,
          },
          update: { componentName: c.name },
        });
        // Se indexa por CÓDIGO, no por nombre: variantes de escritura del mismo
        // producto ("% Order Taking" y "%Order Taking") comparten código, y
        // guardar por nombre dejaría sin id a todas menos la última.
        componentIds.set(code, saved.componentId);
      }
      console.log(`  ✔ ${componentIds.size} componentes`);

      // 2. Pesos por equipo
      const teams = await tx.team.findMany({ select: { teamId: true, teamCode: true } });
      const teamIds = new Map(teams.map((t) => [t.teamCode, t.teamId]));
      for (const w of report.weights) {
        const teamId = teamIds.get(w.teamCode)!;
        const componentId = componentIds.get(toComponentCode(w.componentName))!;
        await tx.teamComponentWeight.upsert({
          where: {
            teamId_componentId_periodId: { teamId, componentId, periodId: period.periodId },
          },
          create: {
            teamId,
            componentId,
            periodId: period.periodId,
            weightPercent: new Prisma.Decimal(w.weight),
          },
          update: { weightPercent: new Prisma.Decimal(w.weight) },
        });
      }
      console.log(`  ✔ ${report.weights.length} pesos`);

      // 3. Cuotas. Se borran las del periodo y se insertan en bloque: un upsert
      // por fila abre una ida y vuelta a la base por cada una y agota el tiempo
      // de la transacción contra Supabase.
      await tx.teamComponentTarget.deleteMany({ where: { periodId: period.periodId } });
      await tx.teamComponentTarget.createMany({
        data: report.resolved.map((r) => ({
          employeeId: r.employeeId,
          componentId: componentIds.get(toComponentCode(r.componentName))!,
          periodId: period.periodId,
          quotaValue: new Prisma.Decimal(r.quota),
        })),
      });
      console.log(`  ✔ ${report.resolved.length} cuotas`);

      // 4. Ventas, dentro de un lote identificable y reversible.
      // El lote exige un usuario responsable: se atribuye al ADMIN del sistema.
      const admin = await tx.appUser.findFirst({
        where: { roles: { some: { role: { roleName: 'ADMIN' } } } },
        select: { userId: true },
      });
      if (!admin) {
        throw new Error(
          'No hay usuario ADMIN para atribuir el lote. Ejecuta antes: npm run seed:roles',
        );
      }

      const batch = await tx.salesUploadBatch.create({
        data: {
          periodId: period.periodId,
          uploadedByUserId: admin.userId,
          fileName: path.basename(args.file),
          fileHash: fileHash(args.file),
          sourceFormat: 'XLSX',
          status: 'IMPORTED',
        },
      });

      // Recarga limpia: se borran las ventas previas del periodo para no sumar
      // duplicados si el importador se corre dos veces.
      await tx.salesTransaction.deleteMany({ where: { periodId: period.periodId } });
      await tx.salesTransaction.createMany({
        data: report.resolved.map((r) => ({
          salesUploadBatchId: batch.salesUploadBatchId,
          employeeId: r.employeeId,
          componentId: componentIds.get(toComponentCode(r.componentName))!,
          periodId: period.periodId,
          saleValue: new Prisma.Decimal(r.sale),
        })),
      });
        console.log(`  ✔ ${report.resolved.length} ventas (lote ${batch.salesUploadBatchId})`);
    },
    { timeout: 120_000, maxWait: 30_000 },
  );
}

async function main(): Promise<void> {
  const args = parseArgs();
  const report = await analyze(args);
  printReport(report, args);

  if (!args.apply) {
    console.log('\n' + '='.repeat(76));
    console.log('  SIMULACIÓN: no se escribió nada en la base de datos.');
    console.log('  Para aplicar:  npm run import:commissions -- --apply');
    console.log('='.repeat(76));
    return;
  }

  if (report.unknownEmployees.length) {
    throw new Error(
      `Hay ${report.unknownEmployees.length} empleados del Excel que no existen en la base. ` +
        'Revisa el informe antes de aplicar.',
    );
  }

  console.log('\n▸ APLICANDO...');
  await apply(report, args);
  console.log('\n✔ Importación completada.');
}

main()
  .catch((e) => {
    console.error('\n✗ ' + (e instanceof Error ? e.message : String(e)));
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
