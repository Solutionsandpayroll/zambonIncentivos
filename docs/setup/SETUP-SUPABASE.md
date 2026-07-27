# Guía: Base de datos en Supabase + Prisma (Sistema Zambon)

Esta guía te lleva desde cero hasta tener el esquema de `prisma/schema.prisma` corriendo en una base de datos PostgreSQL de Supabase, lista para el backend NestJS.

**Principio rector:** Supabase se usa **solo como PostgreSQL gestionado + panel de inspección**. NO usamos Supabase Auth, ni Row Level Security, ni su SDK. Toda la autenticación y la jerarquía viven en NestJS. Esto mantiene el proyecto portable: migrar mañana al servidor propio de Zambon será solo un `pg_dump` + cambiar la `DATABASE_URL`.

---

## Parte 1 — Crear el proyecto en Supabase

1. Entra a **https://supabase.com** y crea una cuenta (puedes usar GitHub o correo).
2. En el dashboard, clic en **New project**.
3. Completa:
   - **Organization:** crea una (ej. `Zambon`) si no tienes.
   - **Project name:** `zambon-incentivos` (o `zambon-dev`).
   - **Database Password:** genera una **contraseña fuerte** y **guárdala**. Es la contraseña del usuario `postgres`; la necesitarás en la cadena de conexión y Supabase no te la vuelve a mostrar completa.
   - **Region:** elige la más cercana a Colombia → **East US (North Virginia)** o **South America (São Paulo)** si aparece. Menor latencia.
   - **Plan:** **Free**.
4. Clic en **Create new project** y espera ~2 minutos mientras aprovisiona la base.

---

## Parte 2 — Obtener las cadenas de conexión

Prisma necesita **dos** URLs (por eso el schema tiene `url` y `directUrl`):

- **Pooled** (puerto `6543`, vía PgBouncer): la usa la app en runtime. Aguanta muchas conexiones simultáneas.
- **Direct** (puerto `5432`): la usan las **migraciones** de Prisma, que requieren conexión directa.

Para obtenerlas:

1. En tu proyecto, clic en **Connect** (botón arriba) — o ve a **Project Settings → Database**.
2. Busca la sección **Connection string** y selecciona la pestaña **Prisma** (o **ORMs**). Supabase te muestra exactamente las dos líneas ya con el formato correcto.
3. Copia ambas. Se ven así (los valores reales varían):

```
# Pooled (para DATABASE_URL) — puerto 6543, con pgbouncer
postgresql://postgres.xxxxxxxx:[TU-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct (para DIRECT_URL) — puerto 5432
postgresql://postgres.xxxxxxxx:[TU-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

4. Reemplaza `[TU-PASSWORD]` por la contraseña que guardaste en la Parte 1.

> Si la contraseña tiene caracteres especiales (`@`, `#`, `:`, `/`), debes codificarlos en URL (ej. `@` → `%40`). Para evitar líos, usa una contraseña larga solo con letras y números.

---

## Parte 3 — Preparar el proyecto local con Prisma

Asumiendo que ya tienes Node.js instalado y estás en la carpeta del proyecto (`c:\Users\juanc\Documents\zambon`).

### 3.1. Inicializar Node y Prisma (si aún no existe `package.json`)

```powershell
npm init -y
npm install prisma@6 --save-dev
npm install @prisma/client@6
```

> Fijamos **Prisma 6** a propósito: es la versión estable que soporta `directUrl` dentro del schema (Prisma 7 lo movió a otro archivo). Cuando el proyecto NestJS arranque de lleno, se mantiene esta versión.

El archivo `prisma/schema.prisma` **ya existe** en el proyecto — no hace falta `prisma init` para regenerarlo.

### 3.2. Crear el archivo `.env`

Crea un archivo `.env` en la raíz del proyecto con las dos URLs de la Parte 2:

```env
# Pooled — la usa la app en runtime
DATABASE_URL="postgresql://postgres.xxxxxxxx:TU-PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct — la usan las migraciones de Prisma
DIRECT_URL="postgresql://postgres.xxxxxxxx:TU-PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

### 3.3. Proteger el `.env`

Crea (o edita) `.gitignore` en la raíz y asegúrate de que incluya:

```gitignore
node_modules/
.env
```

> **Nunca** subas el `.env` a git: contiene la contraseña de la base de datos.

---

## Parte 4 — Crear las tablas en Supabase (migración)

Con el `.env` listo y `prisma/schema.prisma` en su sitio:

### 4.1. Validar el schema

```powershell
npx prisma validate
```

Debe decir que el schema es válido.

### 4.2. Ejecutar la primera migración

```powershell
npx prisma migrate dev --name init
```

Esto:
1. Se conecta a Supabase por la `DIRECT_URL`.
2. Genera el SQL de todas las tablas, enums, índices y relaciones.
3. Los crea en la base de Supabase.
4. Guarda la migración en `prisma/migrations/` (versionada, va a git).
5. Genera el cliente de Prisma (`@prisma/client`) para usarlo en NestJS.

### 4.3. Verificar en Supabase

1. Vuelve al dashboard de Supabase → **Table Editor**.
2. Deberías ver todas las tablas: `person`, `employee`, `team`, `period`, `sales_transaction`, `incentive_calculation_header`, etc.
3. También puedes ir a **SQL Editor** y correr `select * from period;` (vacío por ahora, pero confirma que existe).

---

## Parte 5 — Comandos útiles del día a día

| Comando | Para qué |
|---|---|
| `npx prisma studio` | Abre un panel visual local en el navegador para ver/editar datos (alternativa al Table Editor de Supabase). |
| `npx prisma migrate dev --name <cambio>` | Crea una nueva migración tras editar el schema. |
| `npx prisma generate` | Regenera el cliente Prisma tras cambiar el schema. |
| `npx prisma db pull` | Trae a tu schema cambios hechos directo en la BD (rara vez necesario). |
| `npx prisma migrate reset` | ⚠️ Borra TODO y reaplica migraciones. Solo en desarrollo. |

---

## Parte 6 — Conectar desde NestJS (cuando llegue el momento)

Cuando montes el backend, la conexión es directa (sin SDK de Supabase). Un `PrismaService` estándar:

```typescript
// src/shared/database/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

Prisma lee la `DATABASE_URL` del `.env` automáticamente. Nada más que configurar.

---

## Parte 7 — Notas importantes del plan Free

- **Pausa por inactividad:** si el proyecto pasa ~1 semana sin actividad, Supabase lo pausa. Se reactiva solo al primer request (tarda unos segundos). Para un sistema de uso mensual esto es aceptable; solo tenlo presente.
- **Límite:** 500 MB de base de datos. Para cientos de empleados y sus liquidaciones mensuales, sobra por bastante tiempo.
- **Backups:** el plan free tiene backups limitados. Antes de cada cierre de nómina importante, puedes hacer un respaldo manual: **Project Settings → Database → Backups**, o un `pg_dump` local.

---

## Parte 8 — Migrar a servidor propio de Zambon (futuro)

Cuando Zambon quiera todo on-premise, gracias a que usamos Postgres estándar + Prisma:

1. Respaldo de Supabase:
   ```powershell
   pg_dump "postgresql://postgres.xxxx:PASS@...:5432/postgres" > zambon_backup.sql
   ```
2. Restaurar en el Postgres de Zambon:
   ```powershell
   psql "postgresql://usuario:pass@servidor-zambon:5432/zambon" < zambon_backup.sql
   ```
3. Cambiar `DATABASE_URL` y `DIRECT_URL` en el `.env` del servidor apuntando al nuevo Postgres.
4. Listo. **Cero cambios de código.**

Ese es exactamente el beneficio de no atarnos a features propietarias de Supabase.

---

## Resumen del flujo

```
1. Crear proyecto en supabase.com (Free, región cercana, guardar password)
2. Copiar las 2 connection strings (pooled 6543 + direct 5432) desde "Connect → Prisma"
3. npm install prisma@6 @prisma/client@6
4. Crear .env con DATABASE_URL y DIRECT_URL   (+ .gitignore)
5. npx prisma migrate dev --name init          → crea todas las tablas
6. Verificar en Table Editor de Supabase
7. NestJS se conecta por DATABASE_URL (sin SDK de Supabase)
```
