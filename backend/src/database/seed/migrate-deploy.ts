/**
 * Aplica las migraciones pendientes contra la base de Supabase.
 *
 * Existe porque el CLI de Prisma solo busca el `.env` junto al schema
 * (`prisma/`) o en el directorio de trabajo (`backend/`), y en este proyecto
 * DATABASE_URL / DIRECT_URL viven en el `.env` de la RAÍZ. Llamar a
 * `prisma migrate deploy` directamente falla con:
 *     P1012 Environment variable not found: DIRECT_URL
 *
 * `load-env` resuelve ese mismo respaldo que ya usan los scripts de seed, y
 * las variables se heredan al proceso hijo.
 *
 * En Render no se usa: el plan Free no admite pre-deploy y las migraciones se
 * aplican a mano desde una máquina de trabajo (ver RENDER.md, paso 3).
 */
import './load-env';
import { spawnSync } from 'child_process';
import * as path from 'path';

const schema = path.resolve(__dirname, '../../../../prisma/schema.prisma');

for (const name of ['DATABASE_URL', 'DIRECT_URL']) {
  if (!process.env[name]) {
    console.error(
      `Falta ${name}. Debe estar en el .env de la raíz del proyecto.`,
    );
    process.exit(1);
  }
}

// `shell: true` es necesario en Windows para resolver el .cmd de prisma.
const result = spawnSync(
  'npx',
  ['prisma', 'migrate', 'deploy', '--schema', schema],
  { stdio: 'inherit', shell: true },
);

process.exit(result.status ?? 1);
