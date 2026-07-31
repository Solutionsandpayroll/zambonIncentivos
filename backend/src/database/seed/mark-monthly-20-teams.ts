/**
 * Marca los equipos que cobran el 20% de ejecución MENSUALMENTE, en vez de
 * acumularlo hasta el cierre del ciclo.
 *
 * Corrige un defecto real: `execution-rules.ts` traía los códigos 'KAMS',
 * 'DIR_COMERCIAL' y 'DIR_SELL_OUT' quemados, y NINGUNO existe en el catálogo
 * —los reales son otros—, así que a esos tres equipos se les venía liquidando
 * por ciclo (multiplicador 4) cuando debían cobrar 1 cada mes. El propio
 * archivo lo advertía: "Ajustar estos códigos a los reales del catálogo".
 *
 * Con la columna `Team.pays20Monthly` la regla deja de depender de literales en
 * el código y se puede corregir desde la base sin desplegar.
 *
 * Idempotente. Uso:
 *   npm run mark:monthly-20 -- --dry-run
 *   npm run mark:monthly-20
 */
import './load-env';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Códigos REALES del catálogo (verificados contra la base). */
const MONTHLY_TEAM_CODES = [
  'REGIONAL_SALES_MANAGER_KAM',
  'COMMERCIAL_MARKET_ACCESS_DIRECTOR',
  'DIRECTORA_DBDT_SELL_OUT',
];

async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes('--dry-run');

  const teams = await prisma.team.findMany({
    select: { teamId: true, teamCode: true, teamName: true, pays20Monthly: true },
    orderBy: { teamName: 'asc' },
  });

  const missing = MONTHLY_TEAM_CODES.filter(
    (c) => !teams.some((t) => t.teamCode === c),
  );
  if (missing.length > 0) {
    console.error(
      `❌ Estos códigos no existen en el catálogo: ${missing.join(', ')}\n` +
        '   Revisa la lista antes de continuar: marcar mal esta columna cambia ' +
        'a quién se le paga el 20% cada mes.',
    );
    process.exit(1);
  }

  const toMark = teams.filter(
    (t) => MONTHLY_TEAM_CODES.includes(t.teamCode) && !t.pays20Monthly,
  );
  const toUnmark = teams.filter(
    (t) => !MONTHLY_TEAM_CODES.includes(t.teamCode) && t.pays20Monthly,
  );

  console.log(`${teams.length} equipos${dryRun ? '   [DRY-RUN, no escribe]' : ''}\n`);
  console.log('Cobran el 20% MENSUAL:');
  MONTHLY_TEAM_CODES.forEach((code) => {
    const t = teams.find((x) => x.teamCode === code)!;
    console.log(`   ${t.teamName.padEnd(32)} ${t.pays20Monthly ? '(ya marcado)' : '→ se marca'}`);
  });
  if (toUnmark.length > 0) {
    console.log('\nSe desmarcan (no están en la lista):');
    toUnmark.forEach((t) => console.log(`   ${t.teamName}`));
  }

  if (dryRun) {
    console.log('\n(dry-run: no se escribió nada)');
    return;
  }

  await prisma.$transaction([
    prisma.team.updateMany({
      where: { teamCode: { in: MONTHLY_TEAM_CODES } },
      data: { pays20Monthly: true },
    }),
    prisma.team.updateMany({
      where: { teamCode: { notIn: MONTHLY_TEAM_CODES } },
      data: { pays20Monthly: false },
    }),
  ]);

  const after = await prisma.team.findMany({
    where: { pays20Monthly: true },
    select: { teamName: true },
    orderBy: { teamName: 'asc' },
  });
  console.log(
    `\n✔ ${toMark.length} marcados, ${toUnmark.length} desmarcados.\n` +
      `Cobran mensual (${after.length}): ${after.map((t) => t.teamName).join(', ')}`,
  );
}

main()
  .catch((e) => {
    console.error('Error:', e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
