# Diseño de frontend del sistema Zambon

> **Versión ajustada** — alineada con `backend/USECASES.md`, `backend/API.md` y `prisma/schema.prisma`.
> Cada pantalla se define ahora por: su **acción principal**, los **endpoints** que consume, los **campos reales** del modelo de datos, los **estados** (enums) que muestra y el **alcance por rol**. Se elimina todo contenido demo/ficticio.

## 1. Objetivo

Definir el frontend del sistema de incentivos Zambon: una interfaz que ejecuta un flujo operativo concreto —autenticarse, parametrizar, cargar ventas, calcular incentivos, revisar liquidaciones y exportar reportes— sobre la identidad visual dark glassmorphic con acento lime ya establecida.

La interfaz no decora: **cada pantalla resuelve una tarea del negocio** y refleja el estado real de los datos (periodos, lotes, cálculos, versiones).

## 2. Principio rector

**Precisión operativa, no marketing.**

- Mantener la identidad dark glassmorphic con acento lime.
- **Cero datos ficticios.** Ningún KPI inventado, ninguna métrica de "crecimiento", ningún texto motivacional. Si un dato no viene de un endpoint, no se muestra.
- Prioridad a acciones, estados, resultados y trazabilidad.
- Animar solo cuando aporte lectura o feedback (carga, cálculo, confirmación).
- Densidad de información cuando el contexto lo exige.

> **Regla de validación:** todo número visible en pantalla debe poder rastrearse a un campo del schema o un cálculo del backend. Si no, se elimina.

## 3. Identidad visual (se conserva — ya implementada)

La base visual vive en `shared/zambon-theme.js` y `shared/zambon-base.html`, y **no se rediseña**. Se reutilizan sus tokens y componentes.

### 3.1. Paleta (tokens Tailwind reales)

| Token | Hex | Uso |
|---|---|---|
| `background` / `surface` | `#121414` | Fondo base |
| `surface-container-low` | `#1a1c1c` | Paneles |
| `surface-container` | `#1e2020` | Tarjetas glass |
| `surface-container-high` | `#282a2b` | Controles, chips neutros |
| `surface-container-highest` | `#333535` | Bordes, barras |
| `on-surface` | `#e2e2e2` | Texto principal |
| `on-surface-variant` | `#c8c8ae` | Texto secundario |
| `primary` | `#dfea3a` | Acento hover / brillo |
| `primary-container` | `#c3cd17` | Acento principal (botones, activos) |
| `error` | `#ffb4ab` | Estados de error |

### 3.2. Tipografía y forma

- **Poppins** en toda la jerarquía (`display-xl` 48px → `label-sm` 12px), ya definida en `fontSize`.
- Radios `md`/`lg`/`xl`; bordes sutiles (`rgba(255,255,255,0.06)`); profundidad por blur + contraste, no por sombra.

### 3.3. Componentes reutilizables (clases `z-*` ya existentes)

`.glass-card` · `.z-sidebar` · `.z-nav-item` · `.z-topbar` · `.z-btn` (`--primary`/`--secondary`/`--ghost`) · `.z-pill` (chips de estado) · `.z-progress` · `.z-input` · `.z-rise` (entrada escalonada). **Construir las pantallas componiendo estos**, no inventando estilos nuevos.

## 4. Correcciones al frontend actual (deuda a saldar)

Las maquetas actuales (`home/code.html`, etc.) tienen la **identidad correcta pero contenido demo** que contradice el principio rector. A corregir:

| Pantalla | Problema actual | Corrección |
|---|---|---|
| Sidebar | Nav en inglés y con "Production Line" | Español, nombres reales: Inicio, Cálculo, Resultados, Reportes, Admin. |
| Home | KPIs inventados (`€1,240,500`, `+12.5%`, regiones de España), gráfico de barras decorativo | Reemplazar por estado operativo real (ver §7.2): periodo activo, lotes, cálculos, alertas. |
| Perfil | "Carlos Zambon / Incentive Manager" hardcodeado | Nombre y rol reales de `GET /auth/me`. |
| General | Moneda en `€` | Pesos colombianos `$` (COP). |
| General | Textos en inglés | Todo en español. |

## 5. Navegación y estructura global

Sidebar fijo (identidad actual) con navegación en español. El **conjunto de ítems visibles depende del rol** (`scope` de `/auth/me`):

| Ítem | Ruta | Icono | Roles que lo ven |
|---|---|---|---|
| Inicio | `home` | `dashboard` | Todos |
| Cálculo | `calculof` | `calculate` | ADMIN, NOMINA |
| Resultados | `resultsf` | `analytics` | Todos (alcance filtrado) |
| Reportes | `reportesf` | `description` | ADMIN, NOMINA, GERENTE, COORDINADOR |
| Admin | `adminf` | `admin_panel_settings` | ADMIN |

- **Empleado:** solo ve Inicio y Resultados (los suyos).
- El perfil al pie muestra `fullName` + rol reales; el logout llama `POST /auth/logout`.
- Top bar: la búsqueda es **contextual** (empleado/periodo), no global genérica.

## 6. Estados del sistema como chips (`.z-pill`)

Los estados no son decorativos: mapean a enums reales del schema. Color según semántica.

| Estado UI | Enum origen | Pill |
|---|---|---|
| Pendiente | `BatchStatus.PENDING` | muted |
| Procesando | `BatchStatus.PROCESSING` / cálculo en cola | active (pulsa) |
| Importado | `BatchStatus.IMPORTED` | active |
| Con errores | `BatchStatus.ERROR` | error |
| Calculado | `CalculationStatus.CALCULATED` | active |
| Cerrado | `CalculationStatus.CLOSED` / `period.isClosed` | muted |
| Pago garantizado | `header.guaranteedPayApplied` | active (distinto icono) |

---

## 7. Diseño por pestaña

Cada pestaña declara: **objetivo · endpoints · contenido real · estados · alcance**.

### 7.1. `Login`

- **Objetivo:** autenticar y entrar.
- **Endpoint:** `POST /auth/login`.
- **Contenido:** tarjeta central con `usuario` y `contraseña`, botón primario **Ingresar**, recuperación si aplica.
- **Estados:** cargando (botón), error (`401` credenciales / `USER_STATUS != ACTIVE`) con mensaje operativo.
- **Al éxito:** guarda tokens, redirige según `roles`/`scope` (empleado → Inicio; nómina/admin → Inicio con panel operativo).
- **No debe aparecer:** métricas, texto institucional largo, paneles decorativos.

### 7.2. `Home` / Inicio

- **Objetivo:** estado operativo inmediato según rol.
- **Endpoint:** `GET /home/summary`, `GET /auth/me`.

**Empleado** — 3 tarjetas + acceso:
- Periodo activo (`period` abierto).
- Estado de su última liquidación (`CalculationStatus` + total).
- Botón: **Ver mi resultado** → Resultados.

**Nómina / Admin** — tablero operativo real (reemplaza el demo actual):
- Tarjetas: periodos abiertos/cerrados · lotes pendientes de calcular · cálculos en proceso · alertas de inconsistencia.
- Bloque de **actividad reciente real**: cargas, cálculos, reprocesos (de auditoría), con timestamp real.
- Acceso rápido a la acción más frecuente del rol (cargar ventas / ejecutar cálculo).

- **No debe aparecer:** KPIs de crecimiento inventados, gráficos genéricos, "performance up X%".

### 7.3. `Calculo` / Cálculo

- **Objetivo:** cargar el archivo de ventas, validarlo y ejecutar el cálculo.
- **Endpoints:** `GET /sales-upload/template`, `POST /sales-upload`, `GET /sales-upload/batches/:id`, `POST /incentives/calculate`, `GET /incentives/calculate/status/:jobId`.
- **Roles:** ADMIN, NOMINA.

**Flujo en dos fases, una pantalla:**

**Fase A — Importación:**
1. Selector de **periodo** (`GET /periods?isClosed=false`).
2. Enlace **Descargar plantilla** (`/sales-upload/template`).
3. Panel de carga (drag & drop) → `POST /sales-upload` (multipart).
4. Panel de validación: columnas detectadas (`documento, periodo, componente, cuota, venta_real`) + **conteos** (`valid / duplicated / errors`) del response `202`.
5. `.z-progress` de importación; chip de estado del lote.
6. Si hay errores por fila → tabla expandible con fila + motivo.

**Fase B — Cálculo:**
7. Con lote `IMPORTED`, se habilita botón primario **Ejecutar cálculo** → `POST /incentives/calculate`.
8. **Progress tracker** por etapas (consultando ventas → 80% → 20% → consolidando), sondeando `status/:jobId`.
9. Al terminar: chip `Calculado v{n}` + acceso a Resultados.

- **Estados:** Archivo pendiente · Cargado · Validación en curso · Importado · Con error · Cálculo ejecutado.
- **Errores manejados:** periodo cerrado (`409`), archivo inválido (`400`), faltan parámetros / pesos ≠ 100% (`422`) → mensaje claro + acción (reintentar / ir a Admin a parametrizar).
- **No debe aparecer:** paneles vacíos sin archivo, explicaciones largas del negocio, varios dashboards.

### 7.4. `Results` / Resultados

- **Objetivo:** liquidación final y detalle por empleado.
- **Endpoints:** `GET /results?periodId=`, `GET /results/:headerId`, `GET /results/:headerId/versions`.
- **Alcance:** empleado → solo lo suyo; coordinador/gerente → su árbol (`org_hierarchy`); nómina/admin → todo.

**Estructura:**
- Cabecera: `documentNumber`, `fullName`, `team`, periodo.
- Resumen superior (4 valores reales del `header`): **base salarial**, **total 80%**, **total 20%**, **total final** (en COP). Chip **Pago garantizado** si `guaranteedPayApplied`.
- Tabla **detalle por componente** (`incentive_calculation_detail`): componente · cuota · venta · % cumplimiento · % curva · % ponderado · valor.
- Bloque **ejecución 20%**: `executionKpiName`, cumple/no cumple, multiplicador (1 ó 4).
- **Historial de versión** si hubo reproceso (`calculationVersion` > 1).
- Acciones: **Descargar** soporte.

- **No debe aparecer:** gráficos de adorno, mismos totales repetidos en 3 formatos.

### 7.5. `Reportes`

- **Objetivo:** consultar y exportar según alcance.
- **Endpoints:** `GET /reports/employee/:id`, `/reports/team/:id`, `/reports/consolidated`, `POST /reports/export`, `GET /reports/export/:jobId`.
- **Roles/alcance:** filtrado en backend por jerarquía.

**Estructura:**
- Barra de **filtros** destacada: periodo, equipo, empleado, zona, estado, componente.
- **Tabla principal** densa (chips de estado, acciones por fila).
- Acción **Exportar** (Excel/PDF) → `202` con `jobId`; barra de progreso; descarga al finalizar.
- Vista previa de reportes disponibles según rol.

- **Contenido del reporte de empleado:** 80% por componente (cumplimiento, % curva, total) + 20% (cumple/no, sin sobrecumplimiento).
- **No debe aparecer:** tableros que repitan lo de Home/Results.

### 7.6. `Admin`

- **Objetivo:** parametrizar, gestionar usuarios/jerarquías y gobernar (reprocesos, auditoría).
- **Endpoints:** los de `organization`, `catalogs`, `users`, `admin` (novedades, pago garantizado, reproceso, auditoría).

**Menú secundario por subsección** (cada una es tabla o formulario compacto):

| Subsección | Endpoints | Contenido |
|---|---|---|
| Empleados | `/employees`, `/persons` | CRUD, salario base, zona, cargo, asignación a equipo. |
| Usuarios y roles | `/users` | Crear usuario ligado a empleado, asignar rol, reset password. |
| Estructura | `/teams`, `/zones`, `/regions`, `/positions` | Catálogos organizacionales. |
| Jerarquía | `/hierarchy` | Relaciones jefe–subordinado (árbol). |
| Periodos | `/periods` | Crear periodo, **cerrar** periodo. |
| Componentes y pesos | `/components`, `/component-weights` | Pesos por equipo/periodo con **validación suma = 100%** en la UI. |
| Curva de pago | `/curve-pay` | Editor de escalones (% cumplimiento → % pago) + tope >120%. |
| Cuotas | `/targets` | Upsert; recálculo de coordinadores. |
| Novedades | `/novelties` | Incapacidades, licencias, cambio de zona. |
| Pago garantizado | `/payment-conditions` | `NEW_HIRE`/`ZONE_CHANGE`, aplica 80/20. |
| Reprocesos | `/admin/reprocess` | Relanzar cálculo → nueva versión. |
| Auditoría | `/admin/audit` | Bitácora (usuario, fecha, motivo). |

- **Trazabilidad visible** cuando el cambio sea sensible (cierres, reprocesos, parámetros).
- **No debe aparecer:** cards decorativas sin decisión asociada.

---

## 8. Validaciones de UI críticas (reflejan reglas del backend)

La UI **anticipa** las reglas que el backend impone, para no golpear errores evitables:

1. **Pesos de componentes:** la UI suma en vivo y bloquea guardar si ≠ 100% (backend responde `422`).
2. **Periodo cerrado:** oculta/deshabilita cargar y calcular (backend responde `409`).
3. **Orden de dependencias:** si un periodo no tiene parámetros, Cálculo muestra estado guía "Faltan parámetros → ir a Admin", no un formulario de carga muerto.
4. **Alcance:** la UI nunca pide `id` fuera del alcance del rol; si el backend responde `403`, se muestra estado "Sin permiso".
5. **Sobrecumplimiento del 20%:** la UI muestra el 20% topado al 100% (nunca >100%).

## 9. Jerarquía de información por rol

| Rol | Ve | Puede |
|---|---|---|
| Empleado | Su liquidación e historial | Descargar sus reportes |
| Coordinador | Su equipo (incl. cuota derivada) | Consultar agregados, incidencias |
| Gerente | Su árbol (directos + indirectos) | Consolidados de su estructura |
| Nómina | Todos los resultados | Comparar, revisar, exportar |
| Admin | Todo | Parametrizar, usuarios, reprocesos, cierres |

## 10. Patrones de layout

- **Resumen** (Home): encabezado corto · tarjetas de estado · actividad · una acción primaria.
- **Operación** (Cálculo): paso actual arriba · estado del proceso · evidencia de validación/resultado.
- **Consulta** (Reportes/Results): filtros primero · resultados · exportación.
- **Admin:** navegación secundaria · formularios compactos · historial/trazabilidad.

## 11. Estados vacíos y errores (operativos, no genéricos)

**Vacíos:** "No hay archivo cargado para este periodo" · "No existen resultados para el filtro" · "No hay reprocesos" · "No hay reportes para tu rol".
**Errores:** archivo inválido · periodo cerrado · sin permiso (`403`) · cálculo fallido · faltan parámetros. Cada uno con su acción: reintentar · cambiar filtros · subir archivo · ir a Admin · volver.

## 12. Responsividad

- **Escritorio:** paneles laterales, tablas completas, multi-columna.
- **Tablet:** conserva flujo principal, compacta secundarios.
- **Móvil:** prioriza totales, estado y acciones; colapsa nav secundaria; tablas con scroll horizontal claro.

## 13. Accesibilidad

- Contraste alto (ya cumplido por la paleta); no depender solo del color para el estado (chips llevan texto).
- Etiquetas claras en botones/campos; no texto crítico diminuto.
- `prefers-reduced-motion` ya contemplado en `zambon-base`.

## 14. Animación (criterio ya definido en base)

Animar: entrada de paneles (`z-rise`), progreso de carga/cálculo (`z-progress`), confirmaciones, hover en interactivos. No animar pantallas de uso repetitivo ni durante revisión/cálculo. Easing y duraciones ya en tokens (`--ease-out`, etc.).

## 15. Reglas finales

1. Conservar la base visual (identidad ya definida).
2. Eliminar todo bloque que no apoye una tarea real (empezando por el demo del Home).
3. Diseñar cada pestaña desde su acción principal y sus endpoints.
4. Todo dato visible se rastrea a un campo del schema o un cálculo del backend.
5. Los estados de la UI son los enums reales del sistema.
6. La UI anticipa las reglas del backend (pesos=100%, periodo cerrado, alcance).

## 16. Resumen ejecutivo

El frontend conserva el estilo dark glassmorphic con acento lime, pero su contenido pasa a ser estrictamente el del negocio: login, resumen operativo real por rol, carga y cálculo de ventas con estados verdaderos, liquidaciones con detalle 80/20 y versión, reportes filtrados por jerarquía, y administración con trazabilidad. La deuda inmediata es reemplazar el contenido demo de las maquetas actuales por datos reales conectados a los endpoints de `API.md`.
