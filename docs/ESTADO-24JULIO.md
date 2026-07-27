# Estado del proyecto Zambon — cierre 24 de julio de 2026

Punto de entrada para retomar el proyecto en una nueva sesión. Resume qué está
hecho, cómo correrlo y qué queda pendiente.

---

## 1. Resumen ejecutivo

El **Sistema de Incentivos Zambon** está **funcionalmente completo de punta a
punta**: backend, base de datos y las 19 pantallas del frontend conectadas a la
API real.

- **Backend NestJS** (`backend/`): implementa el contrato completo de
  `docs/backend/API.md`. **84 pruebas unitarias en verde.**
- **Base de datos** PostgreSQL en Supabase: 52 empleados reales migrados, con
  roles y usuario administrador.
- **Frontend** (19 pantallas HTML en carpetas de la raíz): todas consumen la API
  real; muestran `—` donde no hay datos, sin información sintética.
- **Un solo proceso**: el backend sirve también el frontend (mismo origen, sin
  CORS). Ver `ARRANQUE.md`.

---

## 2. Cómo correr (resumen — detalle en `ARRANQUE.md`)

```bash
cd backend
npm install            # solo la primera vez
npm run prisma:generate # solo la primera vez
npm run start:dev      # arranca API + frontend en http://localhost:3000
```

- **Abrir:** http://localhost:3000
- **Usuario:** `admin` · la contraseña se define al ejecutar `seed:roles`
  (ver `ARRANQUE.md` §4). No hay contraseña por defecto en el código.

---

## 3. Qué está hecho

### Backend (todos los módulos del contrato + extensiones)
- `auth` — login/refresh/logout/me, JWT, RBAC, filtro de alcance por jerarquía.
- `organization` — empleados (listar/crear), estructura (equipos, cargos,
  regiones, zonas — listar/crear), jerarquía (listar/crear).
- `catalogs` — periodos (+ cierre), componentes, pesos (suma = 1.0), curva de
  pago, cuotas (targets).
- `sales-import` — carga del archivo de ventas (CSV), validación, lotes.
- `incentives` — motor de cálculo 80/20, curva, pago garantizado, versionado.
- `results` — liquidaciones por empleado, detalle, versiones.
- `reports` — consolidados (empleado/equipo/periodo), export **XLSX y PDF**.
- `admin` — novedades, pago garantizado, reprocesos, auditoría.
- `home` — resumen por rol, avance por equipo.

### Frontend (19/19 conectadas)
- **Operativas:** login, home, cálculo (carga + ejecución), resultados, reportes.
- **Admin — parámetros:** periodos, componentes y pesos, curva de pago, cuotas.
- **Admin — gobierno:** novedades, pago garantizado, reprocesos, auditoría.
- **Admin — organización:** empleados, usuarios y roles, estructura, jerarquía.

### Datos migrados
- 52 empleados (desde `baseempleados.xlsx` + `salariosbases.xlsx`).
- 11 equipos, 8 cargos, 11 zonas, 5 roles, usuario `admin`.
- La curva de pago oficial (de `calculocomisiones.xlsx`) está replicada en el
  código y se puede cargar a un periodo desde la pantalla de Curva.

---

## 4. Pendientes (mejoras evolutivas, no bloqueantes)

- **KPI real del 20%**: hoy se deriva del pago garantizado. Falta un subsistema
  de KPI de ejecución. Punto de extensión en `incentives.repository.ts`.
- **Cuota derivada de coordinadores**: la regla (suma de las cuotas del equipo)
  aún no está implementada en el motor.
- **Colas (BullMQ/Redis)**: importación y exportación pesadas corren síncronas;
  el diseño prevé moverlas a cola si el volumen crece.
- **Historial de exportaciones** (pantalla Reportes): requiere una tabla nueva.
- **Ediciones inline**: la mayoría de pantallas admin son crear + listar; no hay
  edición (PATCH) de registros existentes salvo lo ya expuesto.

---

## 5. Notas para quien retome

- **Memoria del proyecto**: en `~/.claude/projects/.../memory/` — `MEMORY.md` es
  el índice; `backend-estado.md` y `frontend-estado.md` tienen el detalle técnico.
- **Grafo del código**: `graphify-out/` (regenerar con `graphify update .` tras
  cambios de código).
- **Datos de prueba**: durante el desarrollo se sembraron y limpiaron datos por
  API/Prisma; la base queda solo con los 52 empleados reales, roles y `admin`.
- **Último fix (24-jul)**: se corrigió la navegación del menú lateral en
  `adminf/curva.html` (tenía los enlaces en `href="#"`).
