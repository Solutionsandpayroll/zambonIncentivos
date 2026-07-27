# API REST — Sistema de Incentivos Zambon

Contrato de endpoints del backend **NestJS**, derivado de `diseno-modulos-backend.md`, los procesos de `USECASES.md` y los modelos reales de `prisma/schema.prisma`.

## Convenciones generales

- **Base URL:** `/api/v1`
- **Formato:** JSON en request y response. Fechas en ISO 8601. Dinero como número decimal (nunca string científico).
- **Autenticación:** `Authorization: Bearer <access_token>` (JWT) en todo endpoint salvo `login` y `refresh`.
- **Autorización:** cada endpoint declara los roles permitidos. Además, el alcance de datos se filtra **en backend** por jerarquía (`org_hierarchy`) — un `GERENTE` nunca recibe datos fuera de su árbol aunque pida un `id` ajeno.
- **IDs:** UUID (coinciden con las PK del schema).
- **Paginación:** query `?page=1&pageSize=25`. Respuesta con `{ data, total, page, pageSize }`.
- **Filtros/orden:** query params (`?periodId=&teamId=&sort=lastName:asc`).
- **Errores:** forma estándar `{ statusCode, message, error, correlationId }`.

### Roles

`ADMIN` · `NOMINA` · `GERENTE` · `COORDINADOR` · `EMPLEADO`

### Códigos de estado usados

`200` OK · `201` Creado · `202` Aceptado (proceso async/cola) · `204` Sin contenido · `400` Validación · `401` No autenticado · `403` Sin permiso/fuera de alcance · `404` No existe · `409` Conflicto (duplicado, periodo cerrado) · `422` Regla de negocio violada.

---

## 1. Módulo `auth`

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| `POST` | `/auth/login` | Público | Autentica con `username`/`password`, devuelve tokens + alcance. |
| `POST` | `/auth/refresh` | Público (con refresh token) | Renueva el access token. |
| `POST` | `/auth/logout` | Autenticado | Invalida el refresh token (logout lógico). |
| `GET` | `/auth/me` | Autenticado | Perfil, roles y alcance jerárquico del usuario actual. |

**`POST /auth/login`**
```jsonc
// request
{ "username": "csoto", "password": "••••••••" }
// response 200
{
  "accessToken": "jwt...",
  "refreshToken": "jwt...",
  "user": {
    "userId": "uuid", "username": "csoto",
    "employeeId": "uuid",
    "roles": ["EMPLEADO"],
    "scope": { "type": "SELF" }   // SELF | TEAM | HIERARCHY | ALL
  }
}
```
- `409/401` credenciales inválidas o `userStatus != ACTIVE`.
- Actualiza `app_user.lastLoginAt`.

---

## 2. Módulo `users` (gestión de usuarios de app)

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| `GET` | `/users` | ADMIN | Lista usuarios (paginado, filtro por rol/estado). |
| `GET` | `/users/:id` | ADMIN | Detalle de un usuario. |
| `POST` | `/users` | ADMIN | Crea usuario, lo vincula a un `employee`, asigna roles. |
| `PATCH` | `/users/:id` | ADMIN | Cambia estado o roles. |
| `POST` | `/users/:id/reset-password` | ADMIN | Restablece contraseña. |
| `PATCH` | `/users/me/password` | Autenticado | Cambia la propia contraseña. |

**`POST /users`** — mapea a `app_user` + `user_role`
```jsonc
{ "employeeId": "uuid", "username": "csoto", "password": "••••", "roleNames": ["EMPLEADO"] }
```
- `409` si `username` ya existe (`app_user.username` es único).

---

## 3. Módulo `organization`

Estructura humana y territorial. CRUD administrativo + consulta de jerarquía.

### 3.1. Personas y empleados

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| `GET` | `/persons` | ADMIN, NOMINA | Lista personas. |
| `POST` | `/persons` | ADMIN | Crea persona (`document_number` único). |
| `GET` | `/employees` | ADMIN, NOMINA, GERENTE, COORDINADOR | Lista empleados (alcance por jerarquía; filtros `teamId`, `zoneId`, `active`). |
| `GET` | `/employees/:id` | Según alcance | Detalle laboral del empleado. |
| `POST` | `/employees` | ADMIN | Crea empleado (persona, salario base, zona, cargo, ingreso). |
| `PATCH` | `/employees/:id` | ADMIN | Actualiza datos laborales. |
| `POST` | `/employees/:id/team-assignments` | ADMIN | Reasigna a equipo (histórico `employee_team_assignment`). |

### 3.2. Catálogos organizacionales

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| `GET`/`POST` | `/teams` | GET: todos · POST: ADMIN | Equipos/fuerzas (`team`). |
| `GET`/`POST` | `/positions` | GET: todos · POST: ADMIN | Cargos (`position`). |
| `GET`/`POST` | `/regions` | GET: todos · POST: ADMIN | Regiones (`region`). |
| `GET`/`POST` | `/zones` | GET: todos · POST: ADMIN | Zonas (`zone`, filtro `regionId`). |

### 3.3. Jerarquía

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| `GET` | `/hierarchy/subordinates/:employeeId` | ADMIN, GERENTE, COORDINADOR | Árbol de subordinados (directos e indirectos) desde `org_hierarchy`. |
| `POST` | `/hierarchy` | ADMIN | Crea relación jefe–subordinado con `validFrom`/`validTo`. |
| `DELETE` | `/hierarchy/:id` | ADMIN | Cierra una relación (setea `validTo`, no borra). |

---

## 4. Módulo `catalogs` (parámetros por periodo)

Todo lo que se versiona por `period`. **Prerrequisito del cálculo.**

### 4.1. Periodos

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| `GET` | `/periods` | Autenticado | Lista periodos (filtro `year`, `type`, `isClosed`). |
| `GET` | `/periods/:id` | Autenticado | Detalle de un periodo. |
| `POST` | `/periods` | ADMIN | Crea periodo (`MONTH`/`CYCLE`, `cycleNumber`, fechas). |
| `PATCH` | `/periods/:id/close` | ADMIN | Cierra el periodo (`isClosed = true`). Bloquea cargas/recálculos. |

### 4.2. Componentes de venta

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| `GET`/`POST` | `/components` | GET: todos · POST: ADMIN | `sales_component` (code, name, type). |

### 4.3. Pesos de componentes

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| `GET` | `/component-weights` | ADMIN, NOMINA | Filtra por `teamId`, `periodId`. |
| `PUT` | `/component-weights` | ADMIN | Define/actualiza pesos de un equipo en un periodo (batch). **Valida que sumen 1.0.** |

**`PUT /component-weights`** — mapea a `team_component_weight`
```jsonc
{
  "teamId": "uuid", "periodId": "uuid",
  "weights": [
    { "componentId": "uuid-medicine", "weightPercent": 0.70 },
    { "componentId": "uuid-order-taking", "weightPercent": 0.30 }
  ]
}
```
- `422` si la suma ≠ 1.0.

### 4.4. Curva de pago

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| `GET` | `/curve-pay` | ADMIN, NOMINA | Curva vigente (filtro `periodId`, `componentId`). |
| `PUT` | `/curve-pay` | ADMIN | Carga la curva de un periodo (lista de escalones + `isCeiling`). |

**`PUT /curve-pay`** — mapea a `curve_pay` (punto a punto, tope `>120%`)
```jsonc
{
  "periodId": "uuid", "componentId": null,   // null = aplica a todos
  "steps": [
    { "minCompliancePercent": 0.90, "payPercent": 0.50 },
    { "minCompliancePercent": 1.00, "payPercent": 1.00 },
    { "minCompliancePercent": 1.20, "payPercent": 1.50, "isCeiling": true }
  ]
}
```

### 4.5. Cuotas por empleado/componente/periodo

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| `GET` | `/targets` | ADMIN, NOMINA, COORDINADOR | `team_component_target` (filtros `periodId`, `employeeId`). |
| `PUT` | `/targets` | ADMIN | Upsert de cuotas (también puede llegar por el archivo de ventas). |
| `POST` | `/targets/coordinator/recalculate` | ADMIN | Deriva la cuota de coordinadores sumando las de su equipo. |

---

## 5. Módulo `sales-import` (`Calculo` — carga)

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| `GET` | `/sales-upload/template` | ADMIN, NOMINA | Descarga la plantilla oficial (columnas del archivo mensual). |
| `POST` | `/sales-upload` | ADMIN, NOMINA | Sube el archivo de ventas (`multipart/form-data`) para un `periodId`. |
| `GET` | `/sales-upload/batches` | ADMIN, NOMINA | Lista lotes (`sales_upload_batch`) por periodo/estado. |
| `GET` | `/sales-upload/batches/:id` | ADMIN, NOMINA | Estado del lote + conteos + errores por fila. |

**`POST /sales-upload`** (multipart: `file` + `periodId`)
- Valida periodo abierto, columnas obligatorias (`documento, periodo, componente, cuota, venta_real`).
- Crea `sales_upload_batch` con `fileHash`; persiste válidas en `sales_transaction` (+ upsert de `team_component_target`).
- **Response `202`** (procesa en cola si es grande) con `batchId`.
```jsonc
// response 202
{
  "batchId": "uuid", "status": "PROCESSING",
  "counts": { "total": 240, "valid": 238, "duplicated": 1, "errors": 1 }
}
```
- `409` periodo cerrado o `fileHash` repetido para el periodo.

---

## 6. Módulo `incentives` (`Calculo` — motor)

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| `POST` | `/incentives/calculate` | ADMIN, NOMINA | Ejecuta el cálculo del periodo (80% + 20% + excepciones). Genera nueva versión. |
| `GET` | `/incentives/calculate/status/:jobId` | ADMIN, NOMINA | Progreso del cálculo (si corre en cola). |

**`POST /incentives/calculate`**
```jsonc
// request
{ "periodId": "uuid", "employeeIds": null }   // null = todo el periodo; o subconjunto
// response 202
{ "jobId": "uuid", "periodId": "uuid", "status": "PROCESSING", "version": 2 }
```
- Aplica: 80% por componente (cumplimiento → curva → peso), 20% ejecución (multiplicador 1 o 4 según equipo), pago garantizado, cuota derivada de coordinadores.
- `409` si el periodo está cerrado.
- `422` si faltan parámetros (pesos no suman 1.0, sin curva, sin ventas).

---

## 7. Módulo `results` (`Results`)

Liquidación final por empleado. Alcance filtrado por jerarquía.

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| `GET` | `/results` | Según alcance | Lista liquidaciones (filtros `periodId`, `teamId`, `employeeId`). |
| `GET` | `/results/:headerId` | Según alcance | Cabecera + detalle por componente + ejecución 20%. |
| `GET` | `/results/employee/:employeeId/period/:periodId` | Según alcance | Última versión (o `?version=`) de un empleado en un periodo. |
| `GET` | `/results/:headerId/versions` | ADMIN, NOMINA | Historial de versiones (reprocesos). |

**`GET /results/:headerId`** — `incentive_calculation_header` + `incentive_calculation_detail`
```jsonc
{
  "employee": { "documentNumber": "43455696", "fullName": "CATALINA SOTO", "team": "REP. TM (Cadena)" },
  "period": { "year": 2025, "month": 5, "type": "MONTH" },
  "baseSalary": 930720.00,
  "component80": { "theoretical": 744576.00, "result": 812340.50 },
  "component20": { "theoretical": 186144.00, "result": 186144.00, "kpiResult": true, "cycleMultiplier": 4 },
  "totalIncentive": 998484.50,
  "guaranteedPayApplied": false,
  "calculationVersion": 2,
  "details": [
    { "component": "MEDICINE", "quotaValue": 855.36, "saleValue": 697.00,
      "compliancePercent": 0.8148, "curvePayPercent": 0.00, "weightedComponentPercent": 0.00,
      "componentIncentiveValue": 0.00 }
  ]
}
```
- Empleado: solo su propio `employeeId`; coordinador/gerente: su árbol; nómina/admin: todo. `403` fuera de alcance.

---

## 8. Módulo `reports` (`Reportes`)

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| `GET` | `/reports/employee/:employeeId` | Según alcance | Reporte individual (80% por componente + 20%). |
| `GET` | `/reports/team/:teamId` | ADMIN, NOMINA, GERENTE, COORDINADOR | Consolidado por equipo. |
| `GET` | `/reports/consolidated` | ADMIN, NOMINA | Consolidado por periodo/ciclo (para nómina). |
| `POST` | `/reports/export` | Según alcance | Genera exportación (Excel/PDF); async si es pesada. |
| `GET` | `/reports/export/:jobId` | Según alcance | Descarga/estado de la exportación. |

**`POST /reports/export`**
```jsonc
{ "type": "CONSOLIDATED", "format": "XLSX", "filters": { "periodId": "uuid", "teamId": null } }
// response 202 -> { "jobId": "uuid", "status": "PROCESSING" }
```

---

## 9. Módulo `admin` (gobierno: novedades, reprocesos, auditoría)

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| `GET`/`POST` | `/novelties` | ADMIN, NOMINA | Novedades (`absence_or_novelty`): incapacidad, licencia, cambio de zona. |
| `GET`/`POST` | `/payment-conditions` | ADMIN | Pago garantizado (`employee_payment_condition`: `NEW_HIRE`/`ZONE_CHANGE`). |
| `POST` | `/admin/reprocess` | ADMIN | Relanza el cálculo de un periodo → nueva versión (no sobrescribe). |
| `GET` | `/admin/audit` | ADMIN | Bitácora de cambios administrativos (usuario, fecha, motivo). |

**`POST /payment-conditions`** — controla la excepción de pago completo
```jsonc
{ "employeeId": "uuid", "periodId": "uuid", "conditionType": "NEW_HIRE",
  "apply80Percent": true, "apply20Percent": true, "notes": "Ingreso reciente < 2 meses" }
```

---

## 10. Módulo `home` (resumen operativo)

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| `GET` | `/home/summary` | Autenticado | Tarjetas de estado según rol (periodo activo, última liquidación, cargas/cálculos pendientes). |

- **Empleado:** periodo activo, estado y acceso a su última liquidación.
- **Nómina/Admin:** periodos abiertos/cerrados, lotes pendientes, cálculos en proceso, reprocesos, alertas.

---

## 11. Mapa proceso → endpoints (orden de ejecución)

```
1. Login            POST /auth/login → GET /auth/me
2. Parametrizar     POST /periods · POST /components · PUT /component-weights (=1.0)
                    PUT /curve-pay · PUT /targets · POST /payment-conditions
3. Cargar ventas    GET /sales-upload/template → POST /sales-upload → GET /sales-upload/batches/:id
4. Calcular         POST /incentives/calculate → GET .../status/:jobId
5. Resultados       GET /results?periodId= · GET /results/:headerId
6. Reportes         GET /reports/consolidated · POST /reports/export
7. Reproceso/cierre POST /admin/reprocess · PATCH /periods/:id/close
```

**Dependencias duras (el backend las hace cumplir):**
- Sin parámetros del periodo → `POST /sales-upload` y `/incentives/calculate` responden `422`.
- Periodo cerrado → cargas y recálculos responden `409`.
- El alcance de datos se filtra siempre en backend, nunca por confianza en el frontend.
