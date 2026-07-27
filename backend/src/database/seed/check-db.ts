/** Verificación rápida de conexión y conteos. Uso: npm run check:db */
import './load-env';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const [persons, employees, teams, positions, zones, roles, users] =
    await Promise.all([
      prisma.person.count(),
      prisma.employee.count(),
      prisma.team.count(),
      prisma.position.count(),
      prisma.zone.count(),
      prisma.role.count(),
      prisma.appUser.count(),
    ]);

  console.log('✔ Conexión a la base OK');
  console.table({ persons, employees, teams, positions, zones, roles, users });
}

main()
  .catch((e) => {
    console.error('❌ No se pudo conectar:', e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
