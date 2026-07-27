/**
 * ============================================================================
 *  Migración de la base real de empleados de Zambon desde Excel.
 *
 *  ARCHIVO 1 — baseempleados.xlsx (identidad y ubicación)
 *    Header en fila 1. Columnas: CC | Nombre | Cargo | Fecha ingreso | Ciudad
 *    El nombre viene como "APELLIDOS NOMBRES".
 *
 *  ARCHIVO 2 — salariosbases.xlsx (salario y equipo)
 *    Header en fila 2, datos desde la 3. Columnas relevantes:
 *      D = IDENTIFICACIÓN · E = NOMBRE EMPLEADO · F = CARGO (→ equipo)
 *      G = BASE SALARIO VARIABLE
 *    (H = COMPONENT y I = NON-COMPONENT son fórmulas G*0.8 y G*0.2: derivadas,
 *     NO se migran — el motor las recalcula.)
 *    El nombre viene como "NOMBRES APELLIDOS" (orden inverso al archivo 1).
 *
 *  Reglas acordadas con el negocio:
 *   - Filas con documento 0 se vinculan POR NOMBRE contra el archivo 1
 *     (JOLTMANTH POVEDA → 79881218, JUAN ESTEBAN ARISTIZABAL → 1233894053).
 *   - Se migra TODO: los empleados sin salario entran con baseSalary 0 y los
 *     que solo están en salarios se crean igualmente. Ambos casos se reportan.
 *   - Los salarios se redondean (Excel arrastra ruido de coma flotante).
 *
 *  IDEMPOTENTE: upsert por documento; re-ejecutable sin duplicar.
 *
 *  Uso:
 *    npm run import:employees -- --dry-run
 *    npm run import:employees
 *    npm run import:employees -- --salaries=../otra-ruta.xlsx
 * ============================================================================
 */
import './load-env';
import { PrismaClient, Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import {
  splitFullName,
  parseCellDate,
  employeeCodeFromDocument,
  nameSimilarity,
  roundMoney,
} from './employee-import.helpers';

const prisma = new PrismaClient();

/** Región por defecto: el Excel solo trae ciudad y `zone` exige `regionId`. */
const DEFAULT_REGION = 'Colombia';

/** Umbral de similitud para vincular una fila sin documento con un empleado. */
const NAME_MATCH_THRESHOLD = 0.8;

/**
 * Vinculaciones manuales confirmadas con el negocio (23-jul-2026), para filas
 * cuyo documento viene en 0 y cuyo nombre difiere demasiado entre archivos como
 * para vincularlas automáticamente sin riesgo de falso positivo.
 *
 * "JOLTMANTH POVEDA" (salarios) vs "POVEDA DIAZ JOLMANTH JOSE" (base): el nombre
 * está escrito distinto (JOLTMANTH / JOLMANTH), solo comparten el apellido.
 *
 * Clave: nombre exacto tal como aparece en salariosbases.xlsx → documento real.
 */
const MANUAL_DOCUMENT_LINKS: Record<string, string> = {
  'JOLTMANTH POVEDA': '79881218',
};

interface BaseRow {
  documentNumber: string;
  fullNameRaw: string;
  positionName: string;
  hireDate: Date | null;
  cityName: string;
}

interface SalaryRow {
  documentNumber: string; // puede venir '0'
  fullNameRaw: string;
  teamName: string;
  baseSalary: number;
  /** Documento resuelto tras el matching por nombre. */
  resolvedDocument?: string;
}

function cellText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && v instanceof Date) return v.toISOString();
  if (typeof v === 'object' && 'text' in v) return String((v as any).text).trim();
  if (typeof v === 'object' && 'result' in v)
    return String((v as any).result ?? '').trim();
  return String(v).trim();
}

async function readBaseFile(filePath: string): Promise<BaseRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error(`El archivo ${filePath} no tiene hojas`);

  const rows: BaseRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header
    const documentNumber = cellText(row.getCell(1).value);
    const fullNameRaw = cellText(row.getCell(2).value);
    if (!documentNumber || !fullNameRaw) return;

    rows.push({
      documentNumber,
      fullNameRaw,
      positionName: cellText(row.getCell(3).value),
      hireDate: parseCellDate(row.getCell(4).value),
      cityName: cellText(row.getCell(5).value),
    });
  });
  return rows;
}

/** Lee salariosbases.xlsx: header en fila 2, datos desde la 3. */
async function readSalaryFile(filePath: string): Promise<SalaryRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error(`El archivo ${filePath} no tiene hojas`);

  const rows: SalaryRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < 3) return; // filas 1-2: título y encabezado
    const fullNameRaw = cellText(row.getCell(5).value);
    if (!fullNameRaw) return; // filas de relleno al final

    const salaryRaw = cellText(row.getCell(7).value).replace(/[^0-9.,-]/g, '');
    const parsed = Number(salaryRaw.replace(/,/g, ''));

    rows.push({
      documentNumber: cellText(row.getCell(4).value),
      fullNameRaw,
      teamName: cellText(row.getCell(6).value),
      baseSalary: Number.isFinite(parsed) ? roundMoney(parsed) : 0,
    });
  });
  return rows;
}

/**
 * Resuelve el documento de las filas de salario que vienen en 0 (o vacío),
 * buscando por similitud de nombre contra la base de empleados.
 */
function resolveMissingDocuments(
  salaries: SalaryRow[],
  base: BaseRow[],
): { matched: { salary: SalaryRow; base: BaseRow; score: number }[]; unmatched: SalaryRow[] } {
  const matched: { salary: SalaryRow; base: BaseRow; score: number }[] = [];
  const unmatched: SalaryRow[] = [];

  const baseDocs = new Set(base.map((b) => b.documentNumber));

  for (const s of salaries) {
    const needsResolution = !s.documentNumber || s.documentNumber === '0';
    if (!needsResolution) {
      s.resolvedDocument = s.documentNumber;
      continue;
    }

    // 1) Vinculación manual confirmada con el negocio.
    const manual = MANUAL_DOCUMENT_LINKS[s.fullNameRaw.trim()];
    if (manual) {
      const target = base.find((b) => b.documentNumber === manual);
      if (target) {
        s.resolvedDocument = manual;
        matched.push({ salary: s, base: target, score: 1 });
        continue;
      }
    }

    // 2) Vinculación automática por similitud de nombre.
    let best: { base: BaseRow; score: number } | null = null;
    for (const b of base) {
      const score = nameSimilarity(s.fullNameRaw, b.fullNameRaw);
      if (!best || score > best.score) best = { base: b, score };
    }

    if (best && best.score >= NAME_MATCH_THRESHOLD && baseDocs.has(best.base.documentNumber)) {
      s.resolvedDocument = best.base.documentNumber;
      matched.push({ salary: s, base: best.base, score: best.score });
    } else {
      unmatched.push(s);
    }
  }

  return { matched, unmatched };
}

/** Convierte un nombre de equipo a un código estable (`team_code` es @unique). */
function teamCodeFrom(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const root = path.resolve(__dirname, '../../../../');

  const baseArg = args.find((a) => a.startsWith('--file='));
  const basePath = baseArg
    ? baseArg.split('=')[1]
    : path.join(root, 'baseempleados.xlsx');

  const salArg = args.find((a) => a.startsWith('--salaries='));
  const salariesPath = salArg
    ? salArg.split('=')[1]
    : path.join(root, 'salariosbases.xlsx');

  console.log(`\n📄 Base de empleados: ${basePath}`);
  const baseRows = await readBaseFile(basePath);
  console.log(`   ${baseRows.length} empleados`);

  console.log(`📄 Salarios y equipos: ${salariesPath}`);
  const salaryRows = await readSalaryFile(salariesPath);
  console.log(`   ${salaryRows.length} filas de salario`);

  // Vinculación por nombre de los documentos en 0
  const { matched, unmatched } = resolveMissingDocuments(salaryRows, baseRows);
  if (matched.length > 0) {
    console.log(`\n🔗 Documentos resueltos por nombre (${matched.length}):`);
    for (const m of matched) {
      console.log(
        `   "${m.salary.fullNameRaw}" → ${m.base.documentNumber} ` +
          `(${m.base.fullNameRaw}) · similitud ${(m.score * 100).toFixed(0)}%`,
      );
    }
  }
  if (unmatched.length > 0) {
    console.log(`\n⚠ Filas de salario sin documento resoluble (${unmatched.length}):`);
    unmatched.forEach((s) => console.log(`   "${s.fullNameRaw}" · ${s.teamName}`));
  }

  // Índice de salarios por documento resuelto
  const salaryByDoc = new Map<string, SalaryRow>();
  for (const s of salaryRows) {
    if (s.resolvedDocument) salaryByDoc.set(s.resolvedDocument, s);
  }

  // Empleados que solo están en el archivo de salarios (se crean igualmente)
  const baseDocs = new Set(baseRows.map((b) => b.documentNumber));
  const onlyInSalary = salaryRows.filter(
    (s) => s.resolvedDocument && !baseDocs.has(s.resolvedDocument),
  );
  const withoutSalary = baseRows.filter((b) => !salaryByDoc.has(b.documentNumber));

  console.log(`\n📊 Cruce:`);
  console.log(`   ${baseRows.length - withoutSalary.length} empleados con datos completos`);
  console.log(`   ${withoutSalary.length} sin salario (entran con baseSalary 0)`);
  console.log(`   ${onlyInSalary.length} solo en salarios (se crean sin ciudad/fecha)`);

  if (withoutSalary.length > 0) {
    console.log('\n⚠ Sin salario:');
    withoutSalary.forEach((b) =>
      console.log(`   ${b.documentNumber} ${b.fullNameRaw} · ${b.positionName}`),
    );
  }
  if (onlyInSalary.length > 0) {
    console.log('\n⚠ Solo en el archivo de salarios:');
    onlyInSalary.forEach((s) =>
      console.log(`   ${s.resolvedDocument} ${s.fullNameRaw} · ${s.teamName} · $${s.baseSalary.toLocaleString()}`),
    );
  }

  if (dryRun) {
    console.log('\n🔎 DRY RUN — no se escribió nada en la base');
    console.log('\nEquipos que se crearán:');
    const teams = new Map<string, number>();
    for (const s of salaryRows) {
      if (s.teamName) teams.set(s.teamName, (teams.get(s.teamName) ?? 0) + 1);
    }
    [...teams.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([t, n]) => console.log(`   ${String(n).padStart(2)}  ${t}  [${teamCodeFrom(t)}]`));
    console.log(`\nTotal de empleados a persistir: ${baseRows.length + onlyInSalary.length}`);
    return;
  }

  // ---- Escritura -----------------------------------------------------------
  console.log('\n💾 Escribiendo en la base de datos...');

  let region = await prisma.region.findFirst({ where: { regionName: DEFAULT_REGION } });
  if (!region) {
    region = await prisma.region.create({ data: { regionName: DEFAULT_REGION } });
  }

  // Cargos
  const positionIds = new Map<string, string>();
  for (const name of new Set(baseRows.map((r) => r.positionName).filter(Boolean))) {
    const found = await prisma.position.findFirst({ where: { positionName: name } });
    const p = found ?? (await prisma.position.create({ data: { positionName: name } }));
    positionIds.set(name, p.positionId);
  }
  console.log(`   ✔ ${positionIds.size} cargos`);

  // Zonas (ciudades)
  const zoneIds = new Map<string, string>();
  for (const city of new Set(baseRows.map((r) => r.cityName).filter(Boolean))) {
    const found = await prisma.zone.findFirst({ where: { zoneName: city } });
    const z =
      found ??
      (await prisma.zone.create({
        data: { zoneName: city, regionId: region.regionId },
      }));
    zoneIds.set(city, z.zoneId);
  }
  console.log(`   ✔ ${zoneIds.size} zonas`);

  // Equipos (desde el CARGO del archivo de salarios)
  const teamIds = new Map<string, string>();
  for (const teamName of new Set(salaryRows.map((s) => s.teamName).filter(Boolean))) {
    const code = teamCodeFrom(teamName);
    const t = await prisma.team.upsert({
      where: { teamCode: code },
      create: { teamCode: code, teamName },
      update: { teamName },
    });
    teamIds.set(teamName, t.teamId);
  }
  console.log(`   ✔ ${teamIds.size} equipos`);

  // Unifica los empleados a persistir: los de la base + los que solo tienen salario
  type Unified = {
    documentNumber: string;
    fullNameRaw: string;
    positionName?: string;
    hireDate: Date | null;
    cityName?: string;
    salary?: SalaryRow;
  };

  const unified: Unified[] = [
    ...baseRows.map((b) => ({
      documentNumber: b.documentNumber,
      fullNameRaw: b.fullNameRaw,
      positionName: b.positionName,
      hireDate: b.hireDate,
      cityName: b.cityName,
      salary: salaryByDoc.get(b.documentNumber),
    })),
    ...onlyInSalary.map((s) => ({
      documentNumber: s.resolvedDocument!,
      fullNameRaw: s.fullNameRaw,
      hireDate: null,
      salary: s,
    })),
  ];

  let created = 0;
  let updated = 0;

  for (const u of unified) {
    const { lastName, firstName, fullName } = splitFullName(u.fullNameRaw);
    const salaryValue = u.salary?.baseSalary ?? 0;

    const person = await prisma.person.upsert({
      where: { documentNumber: u.documentNumber },
      create: {
        documentNumber: u.documentNumber,
        documentType: 'CC',
        firstName,
        lastName,
        fullName,
      },
      update: { firstName, lastName, fullName },
    });

    const existing = await prisma.employee.findUnique({
      where: { personId: person.personId },
    });

    const data = {
      employeeCode: employeeCodeFromDocument(u.documentNumber),
      hireDate: u.hireDate,
      zoneId: u.cityName ? (zoneIds.get(u.cityName) ?? null) : null,
      positionId: u.positionName ? (positionIds.get(u.positionName) ?? null) : null,
    };

    const employee = existing
      ? await prisma.employee.update({
          where: { employeeId: existing.employeeId },
          data: {
            ...data,
            // No pisamos con 0 un salario ya cargado.
            baseSalary: u.salary
              ? new Prisma.Decimal(salaryValue)
              : existing.baseSalary,
          },
        })
      : await prisma.employee.create({
          data: {
            ...data,
            personId: person.personId,
            baseSalary: new Prisma.Decimal(salaryValue),
          },
        });

    existing ? updated++ : created++;

    // Asignación de equipo (histórica), si el archivo de salarios trae equipo.
    const teamId = u.salary?.teamName ? teamIds.get(u.salary.teamName) : undefined;
    if (teamId) {
      const current = await prisma.employeeTeamAssignment.findFirst({
        where: { employeeId: employee.employeeId, teamId, active: true },
      });
      if (!current) {
        await prisma.employeeTeamAssignment.create({
          data: {
            employeeId: employee.employeeId,
            teamId,
            validFrom: u.hireDate ?? new Date(),
            isPrimary: true,
          },
        });
      }
    }
  }

  console.log(`\n✅ Migración completa: ${created} creados · ${updated} actualizados`);
  if (withoutSalary.length > 0) {
    console.warn(
      `⚠ ${withoutSalary.length} empleados con salario 0 — el motor calculará 0 para ellos.`,
    );
  }
}

main()
  .catch((e) => {
    console.error('\n❌ Error en la migración:', e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
