/**
 * Seed idempotente: crea los 5 roles del sistema y un usuario ADMIN inicial.
 * Resuelve el problema del "primer login" (no hay endpoint público de registro).
 *
 * Uso:
 *   npm run seed:roles
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD=... npm run seed:roles
 *
 * Si el usuario admin ya existe, NO se toca su contraseña.
 */
import './load-env';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Contraseña temporal aleatoria para el ADMIN inicial cuando no se pasa
 * ADMIN_PASSWORD. Se imprime una sola vez por consola y nunca se persiste en
 * texto plano: así el repositorio no contiene ninguna credencial por defecto.
 */
function generateTempPassword(): string {
  return crypto.randomBytes(12).toString('base64url');
}

const ROLES: { roleName: string; description: string }[] = [
  { roleName: 'ADMIN', description: 'Administra todo el sistema: parámetros, usuarios, reprocesos y cierres' },
  { roleName: 'NOMINA', description: 'Consulta y exporta todos los resultados' },
  { roleName: 'GERENTE', description: 'Ve su árbol jerárquico (subordinados directos e indirectos)' },
  { roleName: 'COORDINADOR', description: 'Ve su equipo' },
  { roleName: 'EMPLEADO', description: 'Ve únicamente su propia liquidación' },
];

async function main(): Promise<void> {
  // 1. Roles (idempotente por roleName único)
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { roleName: role.roleName },
      create: role,
      update: { description: role.description },
    });
  }
  console.log(`✔ ${ROLES.length} roles asegurados`);

  // 2. Usuario ADMIN inicial
  const username = process.env.ADMIN_USERNAME ?? 'admin';
  const password = process.env.ADMIN_PASSWORD ?? generateTempPassword();

  const existing = await prisma.appUser.findUnique({ where: { username } });
  if (existing) {
    console.log(`• El usuario "${username}" ya existe; no se modifica su contraseña`);
    return;
  }

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { roleName: 'ADMIN' },
  });

  await prisma.appUser.create({
    data: {
      username,
      passwordHash: await bcrypt.hash(password, 10),
      employeeId: null, // usuario técnico, sin empleado asociado
      roles: { create: [{ roleId: adminRole.roleId }] },
    },
  });

  console.log(`✔ Usuario ADMIN creado: ${username}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      `⚠ Contraseña temporal generada: ${password}\n` +
        `  Anótala AHORA: no vuelve a mostrarse y no queda guardada en texto plano.\n` +
        `  Cámbiala tras el primer login (PATCH /api/v1/users/me/password).`,
    );
  }
}

main()
  .catch((e) => {
    console.error('Error en el seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
