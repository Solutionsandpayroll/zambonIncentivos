/**
 * Carga la jerarquía (org_hierarchy) desde jerarquias.xlsx.
 *
 * Formato del archivo: CC | Nombre | Jerarquia (jefe). El jefe viene por
 * NOMBRE, no por cédula, así que se resuelve contra la lista de empleados del
 * propio archivo (que sí trae la cédula de cada uno). Un guion '-' en la
 * tercera columna significa que la persona no tiene jefe: es raíz del árbol y
 * simplemente no genera fila.
 *
 * Esta tabla es la que alimenta el alcance por rol: un GERENTE/COORDINADOR solo
 * ve su árbol (ScopeService), y GD necesita agregar las cuotas de sus
 * subordinados. Estaba vacía, de ahí que esos roles no vieran a nadie.
 *
 * Idempotente: reemplaza el árbol completo en una transacción.
 *
 * Uso:
 *   npm run seed:hierarchy -- --dry-run
 *   npm run seed:hierarchy
 */
import './load-env';
import { PrismaClient } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import * as path from 'path';

const prisma = new PrismaClient();
const BOOK = path.resolve(__dirname, '../../../../jerarquias.xlsx');

/** Desde cuándo vale la relación (no hay fecha en el archivo). */
const VALID_FROM = new Date('2025-01-01');

/** Normaliza un nombre para comparar: sin tildes, sin dobles espacios, mayúsculas. */
function norm(s: unknown): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // marcas diacríticas: ONORO == OÑORO
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function cellText(v: unknown): string {
  if (v && typeof v === 'object') {
    const o = v as { result?: unknown; richText?: Array<{ text: string }> };
    if (o.richText) return o.richText.map((t) => t.text).join('');
    if (o.result != null) return String(o.result);
    return '';
  }
  return String(v ?? '');
}

async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes('--dry-run');

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(BOOK);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error('El archivo no tiene hojas');

  // 1) Leer el archivo: cédula → nombre, y cédula → nombre del jefe.
  type Row = { doc: string; name: string; bossName: string };
  const rows: Row[] = [];
  ws.eachRow({ includeEmpty: false }, (row, n) => {
    if (n === 1) return; // encabezado
    const doc = cellText(row.getCell('A').value).trim();
    const name = cellText(row.getCell('B').value).trim();
    const boss = cellText(row.getCell('C').value).trim();
    if (!doc) return;
    rows.push({ doc, name, bossName: boss });
  });

  // Índice nombre→cédula con los nombres del PROPIO archivo: así el jefe se
  // resuelve aunque en la base el nombre esté partido en otro orden.
  const docByName = new Map<string, string>();
  rows.forEach((r) => docByName.set(norm(r.name), r.doc));

  // 2) Cruzar con la base por cédula.
  const employees = await prisma.employee.findMany({ include: { person: true } });
  const idByDoc = new Map(
    employees.map((e) => [String(e.person.documentNumber).trim(), e.employeeId]),
  );

  const links: Array<{ managerId: string; subordinateId: string; label: string }> = [];
  const roots: string[] = [];
  const problems: string[] = [];

  for (const r of rows) {
    const subId = idByDoc.get(r.doc);
    if (!subId) {
      problems.push(`${r.doc} ${r.name}: no existe en la base`);
      continue;
    }
    // '-' o vacío = sin jefe.
    if (!r.bossName || r.bossName === '-') {
      roots.push(r.name);
      continue;
    }
    const bossDoc = docByName.get(norm(r.bossName));
    if (!bossDoc) {
      problems.push(`${r.name}: jefe "${r.bossName}" no aparece en el archivo`);
      continue;
    }
    const mgrId = idByDoc.get(bossDoc);
    if (!mgrId) {
      problems.push(`${r.name}: jefe "${r.bossName}" (${bossDoc}) no existe en la base`);
      continue;
    }
    if (mgrId === subId) {
      problems.push(`${r.name}: figura como su propio jefe, se omite`);
      continue;
    }
    links.push({ managerId: mgrId, subordinateId: subId, label: `${r.name}  →  ${r.bossName}` });
  }

  console.log(`Archivo: ${rows.length} filas${dryRun ? '   [DRY-RUN, no escribe]' : ''}`);
  console.log(`  relaciones a crear: ${links.length}`);
  console.log(`  sin jefe (raíces):  ${roots.length}  → ${roots.join(', ')}`);
  if (problems.length) {
    console.log(`\n⚠ ${problems.length} filas con problema:`);
    problems.forEach((p) => console.log('   ' + p));
  }

  // Resumen por jefe, que es lo que se va a ver en pantalla.
  const byBoss = new Map<string, number>();
  links.forEach((l) => byBoss.set(l.managerId, (byBoss.get(l.managerId) ?? 0) + 1));
  console.log('\nSubordinados por jefe:');
  for (const [mgrId, count] of byBoss) {
    const e = employees.find((x) => x.employeeId === mgrId);
    const n = e ? `${e.person.firstName} ${e.person.lastName}`.trim() : mgrId;
    console.log(`   ${String(count).padStart(3)}  ${n}`);
  }

  if (dryRun) {
    console.log('\n(dry-run: no se escribió nada)');
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      // Reemplazo completo: el archivo es la fuente de verdad del árbol.
      await tx.orgHierarchy.deleteMany({});
      await tx.orgHierarchy.createMany({
        data: links.map((l) => ({
          managerEmployeeId: l.managerId,
          subordinateEmployeeId: l.subordinateId,
          validFrom: VALID_FROM,
          validTo: null,
          active: true,
        })),
      });
    },
    { timeout: 120_000, maxWait: 30_000 },
  );

  const total = await prisma.orgHierarchy.count();
  console.log(`\n✔ ${total} relaciones de jerarquía cargadas.`);
}

main()
  .catch((e) => {
    console.error('Error:', e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
