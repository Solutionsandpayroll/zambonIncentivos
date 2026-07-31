/**
 * Establece la contraseña de cada usuario a su número de cédula.
 *
 * Alcance: todos los usuarios EXCEPTO `admin`. Quien no tenga empleado
 * vinculado o no tenga cédula registrada conserva la contraseña que ya tiene
 * —no se le toca ni se le inventa una—, y se reporta al final.
 *
 * Nota de seguridad: la cédula es un dato conocido dentro de la empresa, así
 * que sirve como credencial de entrada inicial, no como contraseña definitiva.
 * Se deja `mustChangePassword` como está (por decisión de negocio no se fuerza
 * el cambio); si más adelante se quiere forzar, basta con poner ese campo en
 * true para estos usuarios.
 *
 * Dos usuarios tienen cédula de 7 dígitos y el sistema exige 8 caracteres al
 * cambiar la contraseña por la UI. Aquí se escribe el hash directo, así que
 * pueden entrar, pero al cambiarla desde la pantalla se les pedirán 8+.
 *
 * Idempotente: correrlo dos veces deja el mismo estado.
 *
 * Uso:
 *   npm run reset:passwords -- --dry-run
 *   npm run reset:passwords
 */
import './load-env';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Mismo coste que usa users.service.ts (BCRYPT_ROUNDS). */
const BCRYPT_ROUNDS = 10;

/** Usuarios que nunca se tocan. */
const PROTECTED_USERNAMES = new Set(['admin']);

async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes('--dry-run');

  const users = await prisma.appUser.findMany({
    include: { employee: { include: { person: true } } },
    orderBy: { username: 'asc' },
  });

  const toUpdate: Array<{ userId: string; username: string; document: string }> = [];
  const skipped: string[] = [];

  for (const u of users) {
    if (PROTECTED_USERNAMES.has(u.username)) {
      skipped.push(`${u.username}  (usuario protegido)`);
      continue;
    }
    const document = String(u.employee?.person?.documentNumber ?? '').trim();
    if (!document) {
      skipped.push(`${u.username}  (sin cédula registrada)`);
      continue;
    }
    toUpdate.push({ userId: u.userId, username: u.username, document });
  }

  console.log(
    `${users.length} usuarios · ${toUpdate.length} a actualizar · ${skipped.length} sin cambios` +
      (dryRun ? '   [DRY-RUN, no escribe]' : ''),
  );

  const short = toUpdate.filter((u) => u.document.length < 8);
  if (short.length > 0) {
    console.log(
      `\n⚠ ${short.length} con cédula de menos de 8 dígitos (por debajo del mínimo ` +
        'que pide la UI al cambiar la contraseña):',
    );
    short.forEach((u) => console.log(`   ${u.username}  ced=${u.document}`));
  }

  if (skipped.length > 0) {
    console.log('\nSin cambios:');
    skipped.forEach((s) => console.log(`   ${s}`));
  }

  if (dryRun) {
    console.log('\n(dry-run: no se escribió nada)');
    return;
  }

  // El hash es costoso (bcrypt, 10 rondas): se calculan todos antes de abrir
  // la transacción para no tenerla bloqueada mientras se cifra.
  const hashed = await Promise.all(
    toUpdate.map(async (u) => ({
      userId: u.userId,
      passwordHash: await bcrypt.hash(u.document, BCRYPT_ROUNDS),
    })),
  );

  await prisma.$transaction(
    hashed.map((h) =>
      prisma.appUser.update({
        where: { userId: h.userId },
        data: { passwordHash: h.passwordHash },
      }),
    ),
  );

  console.log(`\n✔ ${hashed.length} contraseñas establecidas a la cédula.`);

  // Verificación: se comprueba contra la BD que el hash valida de verdad.
  const sample = toUpdate.slice(0, 3);
  console.log('\n--- verificación (muestra) ---');
  for (const s of sample) {
    const fresh = await prisma.appUser.findUnique({
      where: { userId: s.userId },
      select: { username: true, passwordHash: true },
    });
    const ok = fresh ? await bcrypt.compare(s.document, fresh.passwordHash) : false;
    console.log(`${ok ? '✔' : '❌'} ${s.username}: la cédula valida contra el hash guardado`);
  }
}

main()
  .catch((e) => {
    console.error('Error:', e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
