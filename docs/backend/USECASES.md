# Casos de uso y procesos del sistema de incentivos Zambon

Este documento describe, **paso a paso y en orden de ejecución**, cada proceso que el sistema debe realizar, desde la interacción en el frontend hasta la persistencia y el cálculo en el backend. Sirve como validación de que el flujo del negocio está correctamente entendido antes de implementar.

El orden de las secciones respeta la **dependencia real** entre procesos: no se puede cargar ventas sin parámetros, no se puede calcular sin ventas, no se puede reportar sin cálculo.

---

## 0. Modelo mental del negocio (resumen operativo)

Antes de los pasos, hay que fijar las 6 verdades que gobiernan todo el sistema:

1. **Cada empleado tiene un salario base.** Sobre él se calculan dos bolsas teóricas: el **80% (Componente de Ventas)** y el **20% (Componente de Ejecución)**.
2. **El 80% se paga mensual.** Se descompone en componentes de venta (medicamentos, order taking, sell out, etc.) que, ponderados, suman 100% para ese equipo en ese ciclo.
3. **El 20% se paga por ciclo (4 meses)** para la mayoría de equipos, y se multiplica ×4 cuando se cumple. **Excepción:** KAMS, Director Comercial y Director de Sell Out lo cobran mensual (multiplicador = 1).
4. **Los pesos de los componentes cambian por ciclo**, no por mes.
5. **La curva de pago** traduce un `% de cumplimiento` de un componente en un `% de comisión` a pagar.
6. **Pago garantizado:** empleados con menos de 2 meses en la compañía o con cambio de zona cobran el 80% y/o el 20% completos, sin importar cumplimiento, durante ese periodo.

La fórmula conceptual por empleado y mes:

```
cumplimiento_componente = venta_real / cuota_del_componente
% comisión componente    = curva_pago(cumplimiento_componente)   // topado al 100% en el 20%
aporte_componente        = % comisión componente × peso_componente × (80% teórico)
resultado_80             = Σ aportes de todos los componentes
resultado_20             = (cumple_KPI ? 20% teórico : 0) × (mensual ? 1 : 4)
total_incentivo          = resultado_80 + resultado_20   // salvo pago garantizado
```

---

## 1. Proceso: Autenticación e ingreso (`Login`)

**Objetivo:** validar al usuario y cargar su alcance jerárquico para saber qué puede ver y hacer.

### Frontend — paso a paso
1. El usuario abre `Login` y ve la tarjeta central con `usuario/correo` y `contraseña`.
2. Escribe credenciales y presiona el botón primario **Ingresar**.
3. La UI muestra estado de carga en el botón; deshabilita el reenvío mientras espera.
4. Si falla: chip/mensaje de error operativo (`Credenciales inválidas`, `Usuario inactivo`) sin exponer detalle técnico.
5. Si acierta: se guardan tokens y se redirige a `Home` **según el rol**.

### Backend — paso a paso
1. `POST /auth/login` recibe `{ username, password }`.
2. `auth` busca en `app_user`, verifica `user_status = ACTIVO` y compara contra `password_hash`.
3. Se cargan los roles desde `user_role` → `role` (`ADMIN`, `NOMINA`, `GERENTE`, `COORDINADOR`, `EMPLEADO`).
4. Se resuelve el **alcance jerárquico**: para no-admin se consulta `org_hierarchy` (subordinados directos e indirectos) y el `employee_id` asociado al usuario.
5. Se emiten **JWT** (sesión) y **refresh token**; se actualiza `last_login_at`.
6. Respuesta: identidad, roles y alcance para que el front decida menús y filtros.

> A partir de aquí, **todo endpoint valida rol + alcance en backend**, nunca solo en frontend.

---

## 2. Proceso: Parametrización inicial en `Admin` (prerrequisito del cálculo)

**Nadie puede cargar ni calcular hasta que existan los parámetros del periodo.** Este es el primer trabajo real del sistema y lo hace `ADMIN`.

El orden importa porque cada tabla depende de la anterior.

### 2.1. Estructura organizacional (una vez, luego se mantiene)
1. Crear **regiones** → `region`.
2. Crear **zonas** dentro de cada región → `zone` (ciudad/pueblo).
3. Crear **cargos** → `position`.
4. Crear **equipos/fuerzas** → `team` (Trade Market–Cadena, Trade Market–Independientes, Coordinador Trade Market, Xadago, Representantes Mixtos, KAMS, Gerente de Distrito, Director Comercial, Director de Sell Out).
5. Crear **personas** → `person` (documento, nombres).
6. Crear **empleados** → `employee` (salario base, fecha de ingreso, zona, cargo).
7. Asignar empleado a equipo → `employee_team_assignment` (con `valid_from`, `is_primary`).
8. Definir **jerarquía jefe–subordinado** → `org_hierarchy` (habilita la visibilidad de reportes).
9. Crear **usuarios de app** por empleado → `app_user` (username derivado de nombre/cédula) y asignar rol → `user_role`.

### 2.2. Parámetros por periodo/ciclo (cada periodo)
Frontend: submenú de `Admin` con formularios compactos + historial visible.

1. Crear el **periodo** → `period` (`period_year`, `period_month`, `period_type = MONTH|CYCLE`, `cycle_number`, fechas, `is_closed = false`).
2. Registrar **componentes de venta** vigentes → `sales_component` (MEDICINE, ORDER_TAKING, SELL_OUT, etc.).
3. Definir **pesos de componentes por equipo y periodo** → `team_component_weight`. **Regla dura:** los pesos de un equipo deben **sumar 100%**; la UI lo valida antes de guardar.
4. Cargar la **curva de pago** del periodo → `curve_pay` (rangos de `min_compliance_percent` → `pay_percent`, por componente o global).
5. Definir **cuotas por empleado, componente y periodo** → `team_component_target`.
   - Para **coordinadores**: la cuota NO se captura directa; se **deriva sumando las cuotas de su equipo** (regla de negocio aplicada al guardar o al calcular).
   - **Nota operativa:** la cuota individual puede fijarse aquí en `Admin`, **o venir en el mismo archivo mensual de ventas** (columna `cuota`). Si viene en el archivo, la importación la persiste en `team_component_target`; si ya existía para ese `(empleado, componente, periodo)`, se actualiza. Ver sección 3.
6. Registrar **condiciones de pago especial** conocidas → `employee_payment_condition` (`NEW_HIRE`, `ZONE_CHANGE`, `MANUAL_ADJUSTMENT`), indicando si aplica al 80%, al 20% o ambos.

> **Frontera parametrización vs. carga:** todo lo de esta sección (2.1 y 2.2) vive **dentro del sistema** y NO se sube cada mes. El archivo mensual solo trae el dato-fuente que cambia: **venta real y cuota por empleado y componente** (sección 3). El `% de cumplimiento` **nunca se sube**: lo calcula el motor (`venta / cuota`).

### Backend — trazabilidad
- Cada cambio administrativo se persiste con **usuario, fecha y motivo** (auditoría).
- Nada sobrescribe periodos cerrados: parámetros nuevos se versionan por `period`.

---

## 3. Proceso: Carga de ventas (`Calculo` — fase de importación)

**Objetivo:** convertir el archivo de ventas del mes en transacciones y cuotas auditables. Prerrequisito: el periodo existe y tiene parámetros (pesos, curva, componentes).

### 3.1. Formato del archivo mensual (contrato de entrada)

El archivo trae **solo el dato-fuente que cambia mes a mes**: cuánto vendió cada empleado en cada componente y su cuota de ese mes. Todo lo demás (salario base, pesos, curva, jerarquía) ya vive en el sistema.

**Formato oficial: tabular "largo" — una fila por empleado + componente.** No el formato "ancho" por bloques del Excel actual, porque el largo mapea 1:1 a las tablas y soporta que cada equipo tenga distinta cantidad de componentes sin columnas vacías.

| columna | tipo | obligatorio | descripción |
|---|---|---|---|
| `documento` | texto/número | sí | Cédula del empleado. Llave real; debe existir en `employee`. |
| `nombre_empleado` | texto | no | Solo validación cruzada; la llave es el documento. |
| `periodo` | `YYYY-MM` | sí | Debe existir y estar **abierto** (`is_closed = false`). |
| `componente` | código | sí | `MEDICINE`, `ORDER_TAKING`, `SELL_OUT`, etc. Debe existir en `sales_component`. |
| `cuota` | número ≥ 0 | sí | Cuota objetivo del empleado en ese componente y mes → `team_component_target`. |
| `venta_real` | número ≥ 0 | sí | Venta lograda → `sale_value` en `sales_transaction`. |

Ejemplo:

```csv
documento,nombre_empleado,periodo,componente,cuota,venta_real
1110495490,ANA MARIA GUZMAN,2025-05,MEDICINE,1142.64,1567
1110495490,ANA MARIA GUZMAN,2025-05,ORDER_TAKING,290.52,340
43455696,CATALINA SOTO,2025-05,MEDICINE,855.36,697
```

**Lo que NO va en este archivo (por tener otra granularidad):**
- **`% cumplimiento`**: lo calcula el motor (`venta_real / cuota`). Subirlo duplicaría y arriesgaría inconsistencia.
- **Novedades** (incapacidades, licencias, cambio de zona): archivo/pestaña aparte → `documento, periodo, tipo, fecha_inicio, fecha_fin, dias` → `absence_or_novelty` / `employee_payment_condition`.
- **KPI del 20% (ejecución)**: archivo/pestaña aparte → `documento, periodo, kpi, cumple(Sí/No)`. Es booleano y frecuentemente por ciclo, no por venta.
- **Cuotas de coordinadores**: no se cargan; el sistema las **deriva** sumando las de su equipo.

### Frontend — paso a paso
1. En `Calculo`, el usuario (ADMIN/NOMINA) **selecciona el periodo o ciclo** de destino.
2. Sube el **archivo de ventas** (panel de carga principal). Un enlace ofrece **descargar la plantilla** con las columnas oficiales.
3. La UI muestra:
   - **Validación de formato** (extensión, tamaño, presencia de las columnas obligatorias).
   - **Columnas detectadas** y su mapeo (`documento → empleado`, `componente`, `cuota`, `venta_real`).
   - **Conteo**: filas válidas, duplicadas `(documento, periodo, componente)` y erróneas.
   - **Barra de progreso** de importación y **chip de estado del lote** (`Archivo pendiente → Cargado → Validación en curso → Importado` / `Con error`).
4. Si el archivo es inválido o el periodo está cerrado → estado de error con acción **Reintentar** / **Subir otro archivo**.
5. Con el lote importado correctamente, se habilita el botón primario **Ejecutar cálculo**.

### Backend — paso a paso
1. `POST /sales-upload` con archivo + `period_id`.
2. Se valida que el `period` exista y **no esté cerrado**.
3. Se calcula el **hash del archivo** y se crea `sales_upload_batch` (`file_name`, `file_hash`, `status = EN_PROCESO`, `uploaded_by_user_id`).
   - Si el hash ya existe para el periodo → advertir posible recarga duplicada.
4. Se **validan las columnas obligatorias** y luego el contenido **fila por fila**:
   - `documento` existe en `employee`; `componente` existe en `sales_component`.
   - `periodo` coincide con el lote y está abierto.
   - `cuota` y `venta_real` numéricos ≥ 0.
   - La combinación `(documento, periodo, componente)` no se repite dentro del archivo.
5. Filas válidas → se persisten **dos cosas**:
   - `sale_value` → `sales_transaction` (empleado, componente, periodo, lote).
   - `cuota` → `team_component_target` (upsert por `(empleado, componente, periodo)`).
6. Filas con error → se registran como errores de importación del lote (no bloquean las válidas, pero se reportan con fila y motivo).
7. Se actualiza `status` del lote (`IMPORTADO` / `CON_ERROR`) y se devuelve el resumen de conteos.
8. Si el archivo es grande, la importación va a **cola (BullMQ/Redis)** y el front consulta el progreso.

---

## 4. Proceso: Cálculo de incentivos (`Calculo` — motor)

**Este es el corazón del sistema.** Se dispara tras un lote importado. Es idempotente por versión: recalcular genera **nueva versión**, no sobrescribe.

### Frontend — paso a paso
1. El usuario presiona **Ejecutar cálculo** para el periodo.
2. La UI muestra un **progress tracker** (consultando ventas → aplicando reglas → 80% → 20% → consolidando).
3. Al terminar: chip `Cálculo ejecutado` y acceso directo a `Results`. Si falla: `Cálculo fallido` con acción **Reintentar**.

### Backend — paso a paso (por cada empleado del periodo)
1. `POST /incentives/calculate` con `period_id`.
2. Cargar insumos del periodo: `sales_transaction` (venta real) y `team_component_target` (cuota) — ambos ya persistidos por la importación —, más `curve_pay`, `team_component_weight`, `absence_or_novelty`, `employee_payment_condition`, KPI de ejecución y `employee.base_salary`.
3. Calcular bolsas teóricas: `component_80_theoretical = base_salary × 80%_config`; `component_20_theoretical = base_salary × 20%_config`.
4. **Cálculo del 80% (mensual), por componente:**
   1. Para cada componente del equipo del empleado:
      - `compliance = sale_value / quota_value`.
      - `curve_pay_percent = curva(compliance)` según `curve_pay` del periodo.
      - `weighted_component_percent = curve_pay_percent × weight_percent`.
      - `component_incentive_value = weighted_component_percent × component_80_theoretical`.
      - Persistir fila en `incentive_calculation_detail`.
   2. `component_80_result = Σ component_incentive_value`.
5. **Cálculo del 20% (ejecución):**
   - Evaluar el/los KPI de ejecución (booleano `cumple/no cumple`). **No paga sobrecumplimiento**: se topa al 100%.
   - `execution_cycle_multiplier = 1` si el equipo cobra mensual (KAMS, Dir. Comercial, Dir. Sell Out); si no, `= 4` (por ciclo).
   - `component_20_result = (cumple ? component_20_theoretical : 0) × execution_cycle_multiplier`.
6. **Excepciones y pago garantizado:**
   - Si hay `employee_payment_condition` (`NEW_HIRE` < 2 meses o `ZONE_CHANGE`) → forzar el pago completo del 80% y/o 20% según `apply_80_percent` / `apply_20_percent`, marcando `guaranteed_pay_applied = true`.
   - **Coordinadores:** su cumplimiento se evalúa contra la **cuota sumada de su equipo**.
   - Aplicar novedades (`absence_or_novelty`) que afecten proporcionalidad si corresponde.
7. **Consolidación:** `total_incentive = component_80_result + component_20_result`.
8. Guardar **cabecera** `incentive_calculation_header` con todos los totales, `calculation_version = anterior + 1`, `calculation_status = CALCULADO`, `calculated_at`.
9. Repetir para todos los empleados; para procesos masivos, usar cola.

> **Regla de oro:** toda liquidación debe poder **reconstruirse** desde ventas + cuotas + curva + pesos + parámetros vigentes. Se recomienda guardar además un JSON técnico con las fórmulas aplicadas.

---

## 5. Proceso: Consulta de resultados (`Results`)

**Objetivo:** mostrar la liquidación final y su detalle por empleado y periodo.

### Frontend — paso a paso
1. Cabecera con identidad del empleado (cédula, nombre, equipo) y periodo.
2. Resumen superior: **base salarial, total 80%, total 20%, total final**, y chip de **pago garantizado** si aplica.
3. Tabla de **detalle por componente** (cuota, venta, cumplimiento, % curva, % ponderado, valor).
4. Bloque de **ejecución 20%** (KPI, cumple/no cumple, multiplicador).
5. **Historial de versión** si el periodo fue reprocesado.
6. Acciones: **descargar** soporte y navegar.

### Backend — paso a paso
1. `GET /results/:id` (o por empleado+periodo).
2. Validar **alcance**: el empleado solo ve lo suyo; coordinador/gerente ven su árbol (`org_hierarchy`); nómina/admin ven todo.
3. Devolver `incentive_calculation_header` + `incentive_calculation_detail` de la **versión vigente** (o la solicitada).

---

## 6. Proceso: Reportes y exportación (`Reportes`)

**Objetivo:** consultar y exportar según alcance autorizado.

### Frontend — paso a paso
1. Barra de **filtros** destacada: periodo, equipo, empleado, zona, estado, componente.
2. Se aplican filtros → **tabla de resultados** (densa, con chips de estado).
3. Panel/acción de **exportación** (Excel / PDF).

### Backend — paso a paso
1. `GET /reports/...` con filtros.
2. **Filtrado obligatorio por jerarquía** en backend antes de devolver nada.
3. Consolidar según el reporte pedido (individual, por equipo, por gerente/coordinador/director, o consolidado por periodo/ciclo).
4. Para el empleado, el reporte descargable incluye:
   - **80%:** por componente, cumplimiento, % de curva y total.
   - **20%:** cumple/no cumple (sin sobrecumplimiento).
5. Exportaciones pesadas → cola; se registra el historial de generación.

---

## 7. Proceso: Reproceso y cierre de periodo (`Admin`)

**Objetivo:** corregir sin perder trazabilidad, y sellar el periodo.

### Reproceso — paso a paso
1. ADMIN ajusta un parámetro (cuota, peso, curva, novedad) o recarga ventas corregidas.
2. Ejecuta de nuevo el cálculo → se crea `calculation_version + 1`.
3. La versión anterior **se conserva**; `Results` muestra el historial de versiones.
4. Se registra en auditoría: usuario, fecha, motivo.

### Cierre — paso a paso
1. Verificado el periodo, ADMIN marca `period.is_closed = true`.
2. A partir de ahí: no se aceptan cargas ni recálculos sobre ese periodo; los resultados quedan sellados como fuente para nómina.

---

## 8. Resumen del orden global de ejecución

```
1. Login  ──►  carga rol + alcance jerárquico
2. Admin  ──►  organización + parámetros del periodo (pesos=100%, curva, cuotas, condiciones)
3. Calculo (importar)  ──►  archivo largo (documento,periodo,componente,cuota,venta_real)
                            → validación → sales_upload_batch → sales_transaction + team_component_target
4. Calculo (motor)     ──►  80% por componente + 20% ejecución + excepciones → header/detail (versión)
5. Results             ──►  liquidación final por empleado (filtrada por jerarquía)
6. Reportes            ──►  consulta + exportación Excel/PDF por alcance
7. Admin (reproceso/cierre)  ──►  nueva versión sin sobrescribir / is_closed
```

**Dependencias que no se pueden saltar:**
- Sin parámetros del periodo (paso 2) no hay importación válida.
- Sin lote importado (paso 3) no corre el motor (paso 4).
- Sin cálculo (paso 4) no hay `Results` ni `Reportes`.
- El pago garantizado y las reglas por equipo se aplican **dentro** del paso 4, nunca en el frontend.
