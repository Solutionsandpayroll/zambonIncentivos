# Informe de avance — Sistema de Incentivos Zambon

**Fecha:** 22 de julio de 2025
**Alcance del informe:** módulos CRUD, mapa de APIs, roles y control de acceso, y módulos de reportes consolidados.

---

## 0. Resumen ejecutivo

El proyecto completó la fase de **arquitectura, diseño de datos, contrato de APIs e interfaces de usuario**. Sobre esa base quedó definido —y en varios frentes ya materializado— el modelo CRUD, el mapa completo de endpoints, el esquema de roles y control de acceso, y las pantallas de reportes consolidados.

Para lectura correcta del avance, el informe distingue de forma explícita entre:

- ✅ **Implementado**: existe como artefacto ejecutable o entregable (schema aplicado, pantallas construidas, documento versionado).
- 🟨 **Definido / contrato listo**: especificado en detalle y validado, listo para construir; aún no codificado en el backend.
- ⏳ **Pendiente**: no iniciado.

> **Nota de estado del backend:** el backend NestJS **arrancó y ya cubre el flujo
> núcleo cargar → calcular → consultar**. En `backend/`: andamiaje (NestJS +
> Prisma), `auth` (JWT + refresh + RBAC + filtro de alcance jerárquico), el
> **motor de incentivos** (80% por componente, 20% ciclo/mensual, pago
> garantizado), `sales-import` (parser CSV + lote con hash + upsert de ventas y
> cuotas) y `results` (liquidaciones con alcance y versiones). Dominio puro
> **probado (21 tests en verde)**; compila (`nest build`) sobre la BD operativa en
> Supabase. Faltan `users`, `reports` (Excel/PDF), `admin`, `home` y las colas.

| Frente | Estado | Evidencia |
|---|---|---|
| Modelo de datos (CRUD base) | ✅ Implementado (schema aplicado) | `prisma/schema.prisma` · 22 modelos, 6 enums |
| Base de datos | ✅ Operativa | Supabase PostgreSQL + migración inicial |
| Mapa de APIs | ✅ Definido | `docs/backend/API.md` · ~56 endpoints |
| Roles y control de acceso | ✅ Implementado (guards) | `backend/` — RBAC + `ScopeService` jerárquico |
| Reportes consolidados | 🟨 UI construida / lógica definida | `reportesf/`, `resultsf/` |
| Backend NestJS (código) | 🟨 En curso | `backend/` — auth + motor de incentivos + soporte |

---

## 1. Desarrollo de módulos CRUD

### 1.1. Estado

El **modelo de datos** que sustenta todos los CRUD está **implementado y aplicado** en la base de datos (Prisma + PostgreSQL/Supabase). Las **operaciones CRUD por módulo** están **contratadas** en el mapa de APIs y ya cuentan con **interfaz de usuario construida** para operarlas. La lógica de servicio NestJS es lo pendiente.

### 1.2. Entidades del modelo (22 modelos, 6 enums)

Traducción completa del diseño relacional a `schema.prisma`, agrupada por dominio:

| Dominio | Entidades | CRUD planteado |
|---|---|---|
| Personas y organización | `Person`, `Employee`, `EmployeeTeamAssignment`, `Team`, `Position`, `Region`, `Zone`, `OrgHierarchy`, `EmployeePaymentCondition` | Crear / listar / editar / desactivar |
| Seguridad | `AppUser`, `Role`, `UserRole` | Crear usuario, asignar roles, reset, estado |
| Periodos y parámetros | `Period`, `TeamComponentWeight` | Crear periodo, cerrar, definir pesos |
| Catálogos comerciales | `SalesComponent`, `CurvePay`, `TeamComponentTarget` | Upsert por periodo |
| Ventas y soporte | `SalesUploadBatch`, `SalesTransaction`, `AbsenceOrNovelty` | Alta por lote, consulta |
| Cálculo (resultados) | `IncentiveCalculationHeader`, `IncentiveCalculationDetail` | Generación versionada (no editable) |

**Enums:** `PeriodType`, `ConditionType`, `UserStatus`, `BatchStatus`, `CalculationStatus`, `ComponentType`.

### 1.3. Módulos CRUD por área (según diseño de backend)

Los módulos del monolito modular NestJS quedaron definidos con su responsabilidad CRUD:

- **`organization`** — CRUD de empleados, equipos, cargos, regiones, zonas, jerarquía.
- **`users`** — CRUD de usuarios de aplicación y asignación de roles.
- **`catalogs`** — CRUD/upsert de periodos, componentes, pesos, curva de pago, cuotas.
- **`sales-import`** — alta de lotes y transacciones de venta.
- **`admin`** — novedades, condiciones de pago garantizado, reprocesos, auditoría.
- **`incentives`** — generación de liquidaciones (escritura versionada, sin edición directa).

### 1.4. Evidencia en interfaz (CRUD operables desde UI)

Las pantallas de administración que ejercen estos CRUD ya están construidas (13 vistas en `adminf/`):

- Empleados, Usuarios y roles, Estructura, Jerarquía, Periodos, Componentes y pesos, Curva de pago, Cuotas, Novedades, Pago garantizado, Reprocesos, Auditoría.

**Pendiente para cerrar CRUD:** implementar `controller` / `service` / `repository` NestJS por módulo, con validación (`class-validator`) y tests unitarios de reglas.

---

## 2. Mapa de APIs

### 2.1. Estado

**Definido al 100%** en `docs/backend/API.md`: ~56 endpoints organizados por módulo, con método, ruta, roles permitidos, ejemplos de request/response y códigos de estado. Sirve como contrato entre frontend (ya construido) y backend (a implementar).

### 2.2. Convenciones establecidas

- **Base URL:** `/api/v1`; JSON; autenticación por `Bearer <JWT>`.
- **Paginación / filtros / orden** por query params.
- **Errores estándar:** `{ statusCode, message, error, correlationId }`.
- **Códigos de negocio como HTTP:** `409` periodo cerrado / duplicado · `422` regla violada (p. ej. pesos ≠ 100%) · `403` fuera de alcance.

### 2.3. Cobertura por módulo

| Módulo | Endpoints (ejemplos) |
|---|---|
| `auth` | `POST /auth/login`, `/refresh`, `/logout`, `GET /auth/me` |
| `users` | `GET/POST /users`, `PATCH /users/:id`, `/reset-password` |
| `organization` | `/employees`, `/teams`, `/zones`, `/hierarchy/...` |
| `catalogs` | `/periods`, `/component-weights`, `/curve-pay`, `/targets` |
| `sales-import` | `/sales-upload`, `/sales-upload/batches/:id`, `/template` |
| `incentives` | `POST /incentives/calculate`, `/status/:jobId` |
| `results` | `/results`, `/results/:id`, `/results/.../versions` |
| `reports` | `/reports/employee/:id`, `/team/:id`, `/consolidated`, `/export` |
| `admin` | `/novelties`, `/payment-conditions`, `/reprocess`, `/audit` |
| `home` | `GET /home/summary` |

### 2.4. Trazabilidad proceso → endpoints

`API.md` incluye el mapa de ejecución ordenado (login → parametrizar → cargar → calcular → resultados → reportes → cierre) con las dependencias que el backend hará cumplir.

**Pendiente:** exponer los endpoints como controladores NestJS y publicar el OpenAPI generado.

---

## 3. Roles, permisos y control de acceso

### 3.1. Estado

Esquema de seguridad **definido** en tres capas coherentes (datos, API, UI). La **aplicación efectiva** (guards NestJS + filtrado por jerarquía) se implementa con el backend.

### 3.2. Modelo RBAC

Cinco roles, persistidos en `Role` / `UserRole`:

| Rol | Alcance de datos |
|---|---|
| `ADMIN` | Todo el sistema; parámetros, usuarios, reprocesos, cierres |
| `NOMINA` | Todos los resultados; comparar, revisar, exportar |
| `GERENTE` | Su árbol (subordinados directos e indirectos) |
| `COORDINADOR` | Su equipo |
| `EMPLEADO` | Únicamente lo propio |

### 3.3. Control de acceso por jerarquía

- El alcance **no** se resuelve solo por rol: se filtra por la tabla `OrgHierarchy` (relación jefe–subordinado versionada por fechas).
- Principio establecido: **la autorización se valida en backend**, nunca por confianza en el frontend. Un `GERENTE` no recibe datos fuera de su árbol aunque solicite un `id` ajeno (`403`).

### 3.4. Evidencia en interfaz

- La UI ya adapta la navegación por rol (p. ej. un empleado solo ve Inicio y Resultados; Cálculo es de ADMIN/NÓMINA).
- La subsección **Usuarios y roles** (`adminf/usuarios.html`) muestra los cinco roles, la vinculación usuario↔empleado y el reset de contraseña.
- La subsección **Jerarquía** (`adminf/jerarquia.html`) permite construir el árbol que gobierna la visibilidad.

### 3.5. Seguridad de sesión (definida)

- **JWT** para sesión + **refresh token** para renovación.
- Guards de rol (RBAC) y guard de alcance (jerarquía) especificados en el diseño de backend.

**Pendiente:** implementar `AuthGuard`, `RolesGuard` y el filtro de alcance jerárquico en NestJS; hashing de contraseñas.

---

## 4. Módulos y reportes consolidados

### 4.1. Estado

La **capa de presentación** de resultados y reportes consolidados está **construida**; la **lógica de consolidación y exportación** está **definida** en API y casos de uso, pendiente de codificar.

### 4.2. Resultados (liquidación por empleado)

Pantalla `resultsf/` construida, con el detalle que exige el negocio:

- Cabecera de identidad (cédula, nombre, equipo, periodo).
- Totales: base salarial, **80%**, **20%**, total liquidado; indicador de **pago garantizado**.
- **Detalle del 80% por componente** (cuota, venta, % cumplimiento, % curva, ponderación, valor).
- **Bloque de ejecución 20%** (cumple/no cumple, multiplicador por ciclo, tope al 100%).
- **Historial de versiones** (reprocesos).

### 4.3. Reportes consolidados

Pantalla `reportesf/` construida, orientada a consulta y exportación por alcance:

- **Tres niveles de reporte:** individual, por equipo, consolidado por periodo/ciclo.
- **Barra de filtros:** periodo, equipo, zona, componente.
- **Resumen agregado del filtro:** empleados, total 80%, total 20%, total a pagar.
- **Tabla consolidada** (cédula, empleado, equipo, 80%, 20%, total, estado) con paginación.
- **Exportación Excel / PDF** con manejo asíncrono (job + descarga) e historial de generación.

### 4.4. Lógica de consolidación (definida)

- Consolidado por periodo/ciclo para nómina, con filtrado por jerarquía en backend.
- Reporte de empleado con desglose 80% por componente y 20% (sin sobrecumplimiento).
- Exportaciones pesadas vía cola de trabajos.

**Pendiente:** implementar el módulo `reports` (consultas agregadas, exportadores Excel/PDF) y el motor `incentives` que produce los datos consolidados.

---

## 5. Base habilitante ya operativa

Para respaldar los cuatro frentes anteriores, ya está en marcha:

- **Base de datos** PostgreSQL en **Supabase** con el esquema aplicado (migración inicial de Prisma).
- **Portabilidad garantizada:** uso de Postgres estándar + Prisma; migración a servidor propio de Zambon sin cambios de código.
- **Documentación versionada** en `docs/` (proyecto, arquitectura, modelo relacional, módulos backend, casos de uso, API, setup).
- **Frontend completo** (19 pantallas) con identidad visual definitiva, conectado conceptualmente a los endpoints del contrato.

---

## 6. Próximos hitos

1. **Backend NestJS:** andamiaje de módulos, `PrismaService`, DTOs y validación.
2. **Autenticación y guards:** JWT + refresh, `RolesGuard`, filtro de alcance por jerarquía.
3. **CRUD ejecutables:** controladores/servicios/repositorios por módulo.
4. **Motor de incentivos:** cálculo 80% / 20%, excepciones, pago garantizado, versionado.
5. **Reportes y exportación:** consolidados + exportadores Excel/PDF (con cola).
6. **Pruebas:** unitarias del cálculo, integración de importación, e2e del flujo.

---

## 7. Conclusión

Los cuatro frentes solicitados —CRUD, mapa de APIs, roles/control de acceso y reportes consolidados— están **definidos con nivel de detalle de implementación** y respaldados por artefactos concretos: el modelo de datos aplicado, el contrato de ~56 endpoints, el esquema RBAC + jerárquico, y las 19 pantallas de interfaz (incluidas las de resultados y reportes consolidados). El siguiente paso es la **codificación del backend NestJS**, que convierte estos contratos en servicios ejecutables sobre la base de datos que ya está operativa.
