# Backend — Sistema de Incentivos Zambon (NestJS)

Monolito modular NestJS + TypeScript + Prisma/PostgreSQL. Implementa el contrato
de `docs/backend/API.md` sobre el modelo de `prisma/schema.prisma`.

## Estado actual (primer hito de backend)

Implementado en esta iteración:

- **Andamiaje**: `main.ts` (prefijo `/api/v1`, ValidationPipe global, filtro de
  errores estándar `{ statusCode, message, error, correlationId }`), config tipada.
- **Prisma**: `PrismaService`/`PrismaModule` globales sobre el schema de la raíz.
- **Seguridad**: `auth` (login/refresh/logout/me) con JWT + refresh, hashing
  `bcryptjs`, `JwtStrategy`, `JwtAuthGuard` (con `@Public()`), `RolesGuard` (RBAC)
  y `ScopeService` (filtro de alcance por jerarquía desde `org_hierarchy`).
- **Motor de incentivos** (`incentives`): dominio puro testeado — curva de pago,
  80% por componente ponderado, 20% por ciclo/mensual, pago garantizado. Servicio
  que valida periodo abierto + parámetros, itera empleados y persiste versión.
- **Carga de ventas** (`sales-import`): parser CSV "largo" puro y testeado
  (`documento,periodo,componente,cuota,venta_real`), validación fila a fila +
  contra BD, `sales_upload_batch` con hash (rechaza recargas), persiste
  `sales_transaction` + upsert de `team_component_target`.
- **Resultados** (`results`): listar/detalle de liquidaciones y versiones, con
  la forma del contrato (§7) y filtro de alcance jerárquico.
- **Soporte**: `catalogs` (periodos + cierre, componentes, `PUT /component-weights`
  con validación de suma = 1.0) y `organization` (empleados y subordinados con
  alcance por jerarquía).

- **Usuarios** (`users`): CRUD de usuarios de app, asignación de roles, reset de
  contraseña (ADMIN) y cambio de la propia (`PATCH /users/me/password`). Hash
  bcrypt; nunca se expone `passwordHash`.
- **Gobierno** (`admin`): novedades (`/novelties`), pago garantizado
  (`/payment-conditions`), reproceso (`/admin/reprocess`, reusa el motor → nueva
  versión) y bitácora (`/admin/audit`). Valida periodo abierto.
- **Auditoría** (`shared/audit`): `AuditService` global y best-effort (un fallo del
  log nunca tumba la operación). Registra novedades, pago garantizado, reprocesos
  y cierres de periodo. Modelo `admin_audit_log`.
- **Reportes** (`reports`): reporte individual (`/reports/employee/:id`), consolidado
  por equipo (`/reports/team/:id`) y por periodo (`/reports/consolidated`), más
  exportación (`POST /reports/export`). Agregación en `domain/` (pura, testeada):
  consolida **solo la versión vigente** de cada liquidación (nunca suma reprocesos
  históricos). Alcance jerárquico en todos. Exportadores **XLSX** (exceljs) y **PDF**
  (pdfkit) funcionales. Export síncrono por el volumen (~50 empleados); `jobId`/cola
  es punto de extensión.
- **Home** (`home`): `GET /home/summary` con tarjetas según rol — ADMIN/NÓMINA ven
  estado global (periodos, lotes, cálculos); el resto ve su última liquidación y
  alcance. No inventa datos: refleja el estado real de la BD.
- **Frontend servido** por NestJS (`ServeStaticModule`, mismo origen): la raíz `/`
  redirige al login; `/api/v1/*` es la API. El cliente `shared/api.js` maneja JWT,
  refresh y helpers de formato (`—` para nulos) + UI (`fillSidebar`, `toast`,
  `confirmAction`). **Las 19 pantallas conectadas** de verdad: login, results, home,
  reportes, calculof, y todo admin (parametrización, gobierno, organización, cuotas).
  El backend implementa el contrato completo de `API.md`, más extensiones:
  `home` avance por equipo; `reports` filtros zona/componente; `organization` POST de
  empleados/estructura/jerarquía; `catalogs` GET/PUT targets; `GET /zones`.

- **Catálogos** (`catalogs`): periodos (+ cierre auditado), componentes,
  `PUT /component-weights` (suma = 1.0) y `GET/PUT /curve-pay` (escalones de la
  curva; reemplazo por periodo, valida umbrales sin repetir; `isCeiling` = tope).
  La curva oficial (calculocomisiones.xlsx) se carga con `npm run seed:curve`.

Con esto el flujo **parametrizar → cargar → calcular → consultar → reportar →
gobernar** está cerrado y **verificado end-to-end por API** (incluida la curva);
el frontend consume la API real (piloto: login + results).

Pendiente (próximas iteraciones): endpoint `PUT /targets` en `catalogs`; conectar
las 17 pantallas restantes del frontend; colas BullMQ.

## Seed y migración de datos

```bash
npm run seed:roles                 # 5 roles + usuario ADMIN inicial
# ADMIN_USERNAME=admin ADMIN_PASSWORD=... npm run seed:roles

npm run import:employees -- --dry-run          # simula, no escribe
npm run import:employees                       # migra baseempleados.xlsx
npm run import:employees -- --salaries=ruta.xlsx   # + salarios y equipos
```

`import:employees` es **idempotente** (upsert por documento): puede correrse de
nuevo cuando llegue el archivo de salarios/equipos para completar los datos sin
duplicar. No pisa con 0 un salario ya cargado.

## Tests

35 tests en verde (curva de pago, motor de cálculo, parser de ventas, helpers de
migración): `npm test`.

## Puesta en marcha

```bash
cd backend
npm install
npm run prisma:generate          # genera el cliente desde ../prisma/schema.prisma
cp .env.example .env             # completa DATABASE_URL/DIRECT_URL y secretos JWT
npm run start:dev                # http://localhost:3000/api/v1
```

## Scripts

- `npm run build` — compila (genera Prisma en prebuild).
- `npm test` — tests unitarios (motor de cálculo).
- `npm run start:dev` — servidor con recarga.

## Convenciones

- Un módulo por dominio (`controller` / `service` / `repository` / `dto` / `domain`).
- Autorización **siempre** en backend (RBAC + alcance jerárquico); nunca por
  confianza en el frontend.
- Reglas de cálculo en la capa `domain/` (pura, sin Nest/Prisma) → testeable.
- Los resultados de cálculo se **versionan**, nunca se sobrescriben.

Ver `docs/backend/` (API.md, USECASES.md) y `docs/diseno/diseno-modulos-backend.md`.
