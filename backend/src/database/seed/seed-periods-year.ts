/**
 * Siembra el calendario de un año: 3 ciclos y 12 meses enlazados a su ciclo.
 *
 * Llama al MISMO servicio que el endpoint `POST /periods/seed-year`, para que no
 * existan dos implementaciones del patrón que puedan divergir.
 *
 * Idempotente: lo que ya existe no se toca, y a un mes existente solo se le
 * asigna el ciclo si no lo tenía.
 *
 * Uso:
 *   npm run seed:periods -- --year=2026
 */
import './load-env';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CatalogsService } from '../../modules/catalogs/catalogs.service';

function arg(name: string): string | undefined {
  return process.argv
    .slice(2)
    .find((a) => a.startsWith(`--${name}=`))
    ?.split('=')[1];
}

async function main(): Promise<void> {
  const year = Number(arg('year'));
  if (!Number.isInteger(year) || year < 2000) {
    console.error('❌ Pasa --year=YYYY');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const catalogs = app.get(CatalogsService);

  const res = await catalogs.seedYear(year);

  console.log(`Año ${res.periodYear}`);
  console.log(`  creados: ${res.created.length}`);
  res.created.forEach((l) => console.log(`     + ${l}`));
  if (res.linked.length > 0) {
    console.log(`  enlazados a su ciclo: ${res.linked.length}`);
    res.linked.forEach((l) => console.log(`     ~ ${l}`));
  }
  if (res.skipped.length > 0) {
    console.log(`  sin cambios: ${res.skipped.length}`);
  }

  await app.close();
}

main().catch((e) => {
  console.error('Error:', e.message ?? e);
  process.exit(1);
});
