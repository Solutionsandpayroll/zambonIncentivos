/**
 * Carga las variables de entorno para los scripts standalone (seed, migración,
 * verificación) que usan PrismaClient directo, sin pasar por @nestjs/config.
 *
 * Prioridad: backend/.env  y, como respaldo, el .env de la raíz del proyecto
 * (donde viven DATABASE_URL / DIRECT_URL). Import con efecto lateral: basta
 * `import './load-env';` como PRIMERA línea del script.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

// El .env de la raíz no pisa lo ya definido (backend/.env tiene prioridad).
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
