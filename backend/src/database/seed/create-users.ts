/**
 * Crea los usuarios de acceso a partir de los empleados activos.
 *
 *   - Usuario  : el número de documento (único, sin acentos ni homónimos).
 *   - Rol      : se deriva del cargo (ver `user-provisioning.helpers`).
 *   - Contraseña: común para el lote, vía TEMP_PASSWORD.
 *
 * Nunca modifica un usuario existente: quien ya tiene cuenta se omite, para no
 * pisarle la contraseña.
 *
 * Uso:
 *   npm run create:users                          # SIMULACIÓN: no escribe
 *   npm run create:users -- --limit=3             # simula solo los 3 primeros
 *   TEMP_PASSWORD='...' npm run create:users -- --apply --limit=3
 *   TEMP_PASSWORD='...' npm run create:users -- --apply
 */
import './load-env';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  planProvisioning,
  EmployeeInput,
  ProvisionPlan,
} from './user-provisioning.helpers';

const prisma = new PrismaClient();

interface Args {
  apply: boolean;
  limit: number | null;
  only: string[] | null;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const raw = argv.find((a) => a.startsWith('--limit='))?.split('=')[1];
  const limit = raw ? Number(raw) : null;
  if (raw && (!Number.isInteger(limit) || limit! < 1)) {
    throw new Error(`--limit inválido: "${raw}". Debe ser un entero positivo.`);
  }

  // --only=doc1,doc2: acota el lote a documentos concretos, para una prueba
  // con un rol de cada tipo en vez de los primeros de la lista.
  const onlyRaw = argv.find((a) => a.startsWith('--only='))?.split('=')[1];
  const only = onlyRaw ? onlyRaw.split(',').map((d) => d.trim()).filter(Boolean) : null;

  return { apply: argv.includes('--apply'), limit, only };
}

const MIN_PASSWORD_LENGTH = 10;

/**
 * Exige una contraseña inicial utilizable antes de escribir nada.
 *
 * El mensaje incluye la sintaxis de PowerShell porque `VAR=valor comando` es
 * de bash: en PowerShell la variable no llega al proceso y el script la ve
 * ausente, sin que quede claro por qué.
 */
function assertTempPassword(): string {
  const password = process.env.TEMP_PASSWORD ?? '';

  if (!password) {
    throw new Error(
      'Falta TEMP_PASSWORD: es la contraseña inicial del lote.\n\n' +
        '  PowerShell:\n' +
        "    $env:TEMP_PASSWORD = 'MiClaveSegura2026'\n" +
        '    npm run create:users -- --apply\n' +
        '    $env:TEMP_PASSWORD = $null\n\n' +
        '  Bash:\n' +
        "    TEMP_PASSWORD='MiClaveSegura2026' npm run create:users -- --apply",
    );
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `TEMP_PASSWORD tiene ${password.length} caracteres y se exigen al menos ` +
        `${MIN_PASSWORD_LENGTH}. Será la clave de todas las cuentas del lote ` +
        'hasta que cada persona entre y la cambie.',
    );
  }

  return password;
}

async function loadEmployees(): Promise<EmployeeInput[]> {
  const employees = await prisma.employee.findMany({
    where: { active: true },
    orderBy: { employeeCode: 'asc' },
    select: {
      employeeId: true,
      person: { select: { fullName: true, firstName: true, lastName: true, documentNumber: true } },
      position: { select: { positionName: true } },
      appUser: { select: { userId: true } },
    },
  });

  return employees.map((e) => ({
    employeeId: e.employeeId,
    fullName:
      e.person.fullName ?? `${e.person.firstName} ${e.person.lastName}`.trim(),
    documentNumber: e.person.documentNumber,
    positionName: e.position?.positionName ?? null,
    hasUser: e.appUser !== null,
  }));
}

async function createUsers(plans: ProvisionPlan[], password: string): Promise<void> {
  const roles = await prisma.role.findMany({ select: { roleId: true, roleName: true } });
  const roleIds = new Map(roles.map((r) => [r.roleName, r.roleId]));

  const missing = [...new Set(plans.map((p) => p.role))].filter((r) => !roleIds.has(r));
  if (missing.length) {
    throw new Error(
      `Faltan roles en la base: ${missing.join(', ')}. Ejecuta antes: npm run seed:roles`,
    );
  }

  // Un único hash para todo el lote: bcrypt es deliberadamente lento y
  // repetirlo por usuario haría la carga innecesariamente larga.
  const passwordHash = await bcrypt.hash(password, 10);

  for (const plan of plans) {
    await prisma.appUser.create({
      data: {
        employeeId: plan.employeeId,
        username: plan.username,
        passwordHash,
        userStatus: 'ACTIVE',
        // Contraseña temporal compartida: el sistema exige cambiarla al entrar,
        // para que no quede como clave permanente de la cuenta.
        mustChangePassword: true,
        roles: { create: [{ roleId: roleIds.get(plan.role)! }] },
      },
    });
  }
}

async function main(): Promise<void> {
  const args = parseArgs();

  // Se valida ANTES de imprimir el plan: si falla al final, el error queda
  // sepultado bajo 52 líneas de nombres y parece que la carga funcionó.
  if (args.apply) assertTempPassword();

  const employees = await loadEmployees();
  const { plans: allPlans, skipped } = planProvisioning(employees);

  let plans = allPlans;
  if (args.only) {
    plans = allPlans.filter((p) => args.only!.includes(p.username));
    const notFound = args.only.filter((d) => !plans.some((p) => p.username === d));
    if (notFound.length) {
      throw new Error(
        `Estos documentos no están entre los candidatos: ${notFound.join(', ')}. ` +
          'Puede que ya tengan usuario o que el empleado esté inactivo.',
      );
    }
  } else if (args.limit) {
    plans = allPlans.slice(0, args.limit);
  }

  console.log('='.repeat(72));
  console.log('  ALTA DE USUARIOS DESDE EMPLEADOS');
  console.log(`  Modo: ${args.apply ? 'APLICAR (escribe en la base)' : 'SIMULACIÓN (no escribe nada)'}`);
  if (args.limit) console.log(`  Límite: ${args.limit} de ${allPlans.length} candidatos`);
  console.log('='.repeat(72));

  const byRole = new Map<string, number>();
  for (const p of allPlans) byRole.set(p.role, (byRole.get(p.role) ?? 0) + 1);
  console.log('\n▸ ROLES DERIVADOS DEL CARGO (sobre los ' + allPlans.length + ' candidatos)');
  for (const [role, n] of [...byRole.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(n).padStart(3)}  ${role}`);
  }

  console.log(`\n▸ USUARIOS A CREAR: ${plans.length}`);
  for (const p of plans) {
    console.log(`    ${p.username.padEnd(12)} ${p.role.padEnd(12)} ${p.fullName}`);
  }

  if (skipped.length) {
    console.log(`\n▸ OMITIDOS: ${skipped.length}`);
    for (const s of skipped.slice(0, 10)) {
      console.log(`    ${s.documentNumber.padEnd(12)} ${s.reason.padEnd(20)} ${s.fullName}`);
    }
    if (skipped.length > 10) console.log(`    ... y ${skipped.length - 10} más`);
  }

  if (!args.apply) {
    console.log('\n' + '='.repeat(72));
    console.log('  SIMULACIÓN: no se escribió nada.');
    console.log("  Para aplicar:  TEMP_PASSWORD='...' npm run create:users -- --apply");
    console.log('='.repeat(72));
    return;
  }

  const password = assertTempPassword();

  console.log('\n▸ CREANDO...');
  await createUsers(plans, password);
  console.log(`\n✔ ${plans.length} usuarios creados.`);
  console.log('  Todos comparten la misma contraseña temporal: entrégala por un canal');
  console.log('  seguro y pide que la cambien en su primer ingreso.');
}

main()
  .catch((e) => {
    console.error('\n✗ ' + (e instanceof Error ? e.message : String(e)));
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
