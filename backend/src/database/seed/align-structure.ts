/**
 * Alinea equipos y cargos al organigrama oficial.
 *
 * La base traía equipos y cargos con nombres cruzados por traducción
 * ("Representante Médico Senior" vs "Medical Rep Senior"), lo que hacía que un
 * mismo rol apareciera como dos entidades distintas. Este script deja un
 * conjunto único: un equipo por rol real y un cargo homónimo por equipo.
 *
 * Uso:
 *   npm run align:structure              # SIMULACIÓN: no escribe nada
 *   npm run align:structure -- --apply   # aplica los cambios
 *
 * Nada se borra: los equipos y cargos que sobran se desactivan, porque están
 * referenciados por liquidaciones ya calculadas.
 */
import './load-env';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Organigrama oficial. `code` es la clave estable; `mergeFrom` lista los
 * códigos de equipos que se absorben (sus empleados se reasignan aquí).
 */
interface TeamSpec {
  code: string;
  name: string;
  /** Cargo homónimo que llevarán sus empleados. */
  position: string;
  mergeFrom?: string[];
  /** El equipo existe en el organigrama pero aún no tiene empleados. */
  empty?: boolean;
}

const OFFICIAL: TeamSpec[] = [
  {
    code: 'PHARMACY_REP_CHAINS',
    name: 'Pharmacy Rep Chains',
    position: 'Pharmacy Rep Chains',
  },
  {
    code: 'PHARMACY_REP_INDEPENDET',
    name: 'Pharmacy Rep Indep',
    position: 'Pharmacy Rep Indep',
  },
  {
    code: 'NATIONAL_PHARMACY_COORDINATOR',
    name: 'National Pharmacy Coordinator',
    position: 'National Pharmacy Coordinator',
  },
  {
    code: 'MEDICAL_SALES_REP_XADAGO',
    name: 'Medical Sales Rep Xadago',
    position: 'Medical Sales Rep Xadago',
  },
  {
    code: 'MEDICAL_REP_MIXTA_INDEPENDET',
    name: 'Rep Mixta',
    position: 'Rep Mixta',
  },
  {
    // "Rep VM (E+X)" y "Medical Rep Senior (E+X)" son el mismo equipo.
    code: 'MEDICAL_REP_SENIOR_E_X',
    name: 'Rep VM (E+X)',
    position: 'Rep VM (E+X)',
  },
  {
    code: 'DISTRICT_MANAGER',
    name: 'GD (District Manager)',
    position: 'GD (District Manager)',
  },
  {
    // KAM absorbe a Commercial Junior Specialist.
    code: 'REGIONAL_SALES_MANAGER_KAM',
    name: 'KAM (Regional Sales Manager)',
    position: 'KAM (Regional Sales Manager)',
    mergeFrom: ['COMMERCIAL_JUNIOR_SPECIALIST'],
  },
  {
    code: 'COMMERCIAL_MARKET_ACCESS_DIRECTOR',
    name: 'Commercial Director',
    position: 'Commercial Director',
  },
  {
    code: 'DIRECTORA_DBDT_SELL_OUT',
    name: 'Sell-Out Director',
    position: 'Sell-Out Director',
  },
];

interface Args {
  apply: boolean;
}

function parseArgs(): Args {
  return { apply: process.argv.slice(2).includes('--apply') };
}

interface Plan {
  renames: { code: string; from: string; to: string }[];
  merges: { from: string; into: string; employees: number }[];
  deactivateTeams: { code: string; name: string; employees: number }[];
  positionsToCreate: string[];
  deactivatePositions: { name: string; employees: number }[];
  reassignments: { employee: string; from: string; to: string }[];
  missingTeams: string[];
}

async function buildPlan(): Promise<Plan> {
  const plan: Plan = {
    renames: [],
    merges: [],
    deactivateTeams: [],
    positionsToCreate: [],
    deactivatePositions: [],
    reassignments: [],
    missingTeams: [],
  };

  const teams = await prisma.team.findMany();
  const byCode = new Map(teams.map((t) => [t.teamCode, t]));
  const officialCodes = new Set(OFFICIAL.map((t) => t.code));
  const absorbed = new Set(OFFICIAL.flatMap((t) => t.mergeFrom ?? []));

  for (const spec of OFFICIAL) {
    const team = byCode.get(spec.code);
    if (!team) {
      plan.missingTeams.push(spec.code);
      continue;
    }
    if (team.teamName !== spec.name) {
      plan.renames.push({ code: spec.code, from: team.teamName, to: spec.name });
    }

    for (const sourceCode of spec.mergeFrom ?? []) {
      const source = byCode.get(sourceCode);
      if (!source) continue;
      const employees = await prisma.employeeTeamAssignment.count({
        where: { teamId: source.teamId, active: true },
      });
      plan.merges.push({ from: sourceCode, into: spec.code, employees });
    }
  }

  // Equipos fuera del organigrama y no absorbidos: se desactivan.
  for (const team of teams) {
    if (officialCodes.has(team.teamCode) || absorbed.has(team.teamCode)) continue;
    if (!team.active) continue;
    const employees = await prisma.employeeTeamAssignment.count({
      where: { teamId: team.teamId, active: true },
    });
    plan.deactivateTeams.push({ code: team.teamCode, name: team.teamName, employees });
  }

  // Cargos: uno por equipo, con el mismo nombre.
  const positions = await prisma.position.findMany();
  const officialPositions = new Set(OFFICIAL.map((t) => t.position));
  const existing = new Set(positions.map((p) => p.positionName));

  for (const name of officialPositions) {
    if (!existing.has(name)) plan.positionsToCreate.push(name);
  }
  for (const position of positions) {
    if (officialPositions.has(position.positionName) || !position.active) continue;
    const employees = await prisma.employee.count({
      where: { positionId: position.positionId, active: true },
    });
    plan.deactivatePositions.push({ name: position.positionName, employees });
  }

  // Cada empleado toma el cargo homónimo de su equipo.
  for (const spec of OFFICIAL) {
    const team = byCode.get(spec.code);
    if (!team) continue;
    const codes = [spec.code, ...(spec.mergeFrom ?? [])];
    const teamIds = codes
      .map((code) => byCode.get(code)?.teamId)
      .filter((id): id is string => Boolean(id));

    const assignments = await prisma.employeeTeamAssignment.findMany({
      where: { teamId: { in: teamIds }, active: true },
      include: {
        employee: { include: { person: true, position: true } },
      },
    });

    for (const assignment of assignments) {
      const current = assignment.employee.position?.positionName ?? '(sin cargo)';
      if (current === spec.position) continue;
      plan.reassignments.push({
        employee: assignment.employee.person.fullName ?? assignment.employee.employeeCode,
        from: current,
        to: spec.position,
      });
    }
  }

  return plan;
}

function printPlan(plan: Plan, args: Args): void {
  console.log('='.repeat(74));
  console.log('  ALINEACIÓN DE EQUIPOS Y CARGOS');
  console.log(`  Modo: ${args.apply ? 'APLICAR (escribe en la base)' : 'SIMULACIÓN (no escribe nada)'}`);
  console.log('='.repeat(74));

  if (plan.renames.length) {
    console.log(`\n▸ EQUIPOS A RENOMBRAR (${plan.renames.length})`);
    plan.renames.forEach((r) => console.log(`    ${r.from}  →  ${r.to}`));
  }
  if (plan.merges.length) {
    console.log(`\n▸ EQUIPOS A FUSIONAR (${plan.merges.length})`);
    plan.merges.forEach((m) =>
      console.log(`    ${m.from} (${m.employees} empleados)  →  ${m.into}`),
    );
  }
  if (plan.deactivateTeams.length) {
    console.log(`\n▸ EQUIPOS A DESACTIVAR (${plan.deactivateTeams.length})`);
    plan.deactivateTeams.forEach((t) =>
      console.log(`    ${t.code.padEnd(36)} ${t.employees} empleados`),
    );
  }
  if (plan.positionsToCreate.length) {
    console.log(`\n▸ CARGOS A CREAR (${plan.positionsToCreate.length})`);
    plan.positionsToCreate.forEach((n) => console.log(`    ${n}`));
  }
  if (plan.deactivatePositions.length) {
    console.log(`\n▸ CARGOS A DESACTIVAR (${plan.deactivatePositions.length})`);
    plan.deactivatePositions.forEach((p) =>
      console.log(`    ${p.name.padEnd(40)} ${p.employees} empleados`),
    );
  }
  console.log(`\n▸ EMPLEADOS QUE CAMBIAN DE CARGO: ${plan.reassignments.length}`);
  plan.reassignments.slice(0, 12).forEach((r) =>
    console.log(`    ${r.employee.slice(0, 30).padEnd(32)} ${r.from.slice(0, 24).padEnd(26)} → ${r.to}`),
  );
  if (plan.reassignments.length > 12) {
    console.log(`    ... y ${plan.reassignments.length - 12} más`);
  }
  if (plan.missingTeams.length) {
    console.log(`\n▸ ⚠ EQUIPOS DEL ORGANIGRAMA QUE NO EXISTEN: ${plan.missingTeams.join(', ')}`);
  }
}

async function apply(): Promise<void> {
  const teams = await prisma.team.findMany();
  const byCode = new Map(teams.map((t) => [t.teamCode, t]));

  await prisma.$transaction(
    async (tx) => {
      // 1. Cargos oficiales (crear los que falten).
      const positionIds = new Map<string, string>();
      for (const spec of OFFICIAL) {
        const found = await tx.position.findFirst({
          where: { positionName: spec.position },
        });
        const saved = found
          ? await tx.position.update({
              where: { positionId: found.positionId },
              data: { active: true },
            })
          : await tx.position.create({ data: { positionName: spec.position } });
        positionIds.set(spec.code, saved.positionId);
      }

      // 2. Renombrar equipos y absorber los fusionados.
      for (const spec of OFFICIAL) {
        const team = byCode.get(spec.code);
        if (!team) continue;
        await tx.team.update({
          where: { teamId: team.teamId },
          data: { teamName: spec.name, active: true },
        });

        for (const sourceCode of spec.mergeFrom ?? []) {
          const source = byCode.get(sourceCode);
          if (!source) continue;
          // Las asignaciones del equipo absorbido pasan al equipo destino.
          await tx.employeeTeamAssignment.updateMany({
            where: { teamId: source.teamId, active: true },
            data: { teamId: team.teamId },
          });
          await tx.team.update({
            where: { teamId: source.teamId },
            data: { active: false },
          });
        }
      }

      // 3. Desactivar equipos fuera del organigrama.
      const keep = new Set(OFFICIAL.map((t) => t.code));
      const absorbed = new Set(OFFICIAL.flatMap((t) => t.mergeFrom ?? []));
      for (const team of teams) {
        if (keep.has(team.teamCode) || absorbed.has(team.teamCode)) continue;
        await tx.team.update({
          where: { teamId: team.teamId },
          data: { active: false },
        });
      }

      // 4. Cada empleado toma el cargo de su equipo.
      for (const spec of OFFICIAL) {
        const team = byCode.get(spec.code);
        if (!team) continue;
        const assignments = await tx.employeeTeamAssignment.findMany({
          where: { teamId: team.teamId, active: true },
          select: { employeeId: true },
        });
        if (!assignments.length) continue;
        await tx.employee.updateMany({
          where: { employeeId: { in: assignments.map((a) => a.employeeId) } },
          data: { positionId: positionIds.get(spec.code)! },
        });
      }

      // 5. Desactivar los cargos que ya no usa nadie.
      const officialNames = OFFICIAL.map((t) => t.position);
      await tx.position.updateMany({
        where: { positionName: { notIn: officialNames } },
        data: { active: false },
      });
    },
    { timeout: 120_000, maxWait: 30_000 },
  );
}

async function main(): Promise<void> {
  const args = parseArgs();
  const plan = await buildPlan();
  printPlan(plan, args);

  if (!args.apply) {
    console.log('\n' + '='.repeat(74));
    console.log('  SIMULACIÓN: no se escribió nada.');
    console.log('  Para aplicar:  npm run align:structure -- --apply');
    console.log('='.repeat(74));
    return;
  }

  console.log('\n▸ APLICANDO...');
  await apply();
  console.log('✔ Estructura alineada.');
}

main()
  .catch((e) => {
    console.error('\n✗ ' + (e instanceof Error ? e.message : String(e)));
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
