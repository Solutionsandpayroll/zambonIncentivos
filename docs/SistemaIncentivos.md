# Sistema de Incentivos Zambon

## Introducción

El Sistema de Incentivos automatiza la liquidación de la comisión variable de la
fuerza de ventas de Zambon.

Hasta hoy ese proceso vive en un libro de Excel con decenas de hojas enlazadas:
alguien consolida las ventas, cruza cuotas, aplica la tabla de pago y arma el
resumen para nómina. Toma días, es difícil de auditar y una fórmula rota pasa
desapercibida hasta que alguien reclama.

El sistema reemplaza ese libro conservando **las mismas reglas de negocio**: la
fórmula del 80/20, la tabla de pago, los pesos por equipo, los ciclos de cuatro
meses y las excepciones de pago garantizado son exactamente las que Zambon ya
usa. Lo que cambia no es el cálculo, sino cómo se ejecuta: se cargan las ventas,
se marca el cumplimiento, se calcula, y salen liquidaciones y reportes.

Este documento describe **cómo se opera el sistema**: quién hace qué, en qué
orden, y qué tener en cuenta en cada caso.

---

## Generalidades

### Qué resuelve

| | |
|---|---|
| **Trazabilidad** | Cada liquidación queda versionada. Recalcular no borra lo anterior: cualquier cifra se puede explicar y comparar |
| **Una sola fuente** | Cuotas, pesos y tabla de pago viven en un solo lugar, no repartidos en hojas |
| **Control de acceso** | Cada quien ve lo suyo: el vendedor su liquidación, el gerente su equipo, nómina todo |
| **Auditoría** | Queda registro de quién hizo qué y cuándo |
| **Velocidad** | Lo que tomaba días toma minutos |

### Cómo se organiza el año

El año se divide en **3 ciclos de 4 meses**: enero–abril, mayo–agosto y
septiembre–diciembre.

Esto tiene dos consecuencias operativas:

- Los **parámetros se cargan por ciclo** (cuotas, pesos, tabla de pago) y los
  cuatro meses los heredan. Si un mes necesita algo distinto, se le carga aparte
  y eso manda para ese mes.
- El **20% acumulado se paga al cerrar el ciclo**, es decir, al liquidar el
  cuarto mes: abril, agosto o diciembre.

### Quién usa el sistema

| Perfil | Alcance | Rol en el proceso |
|---|---|---|
| **Administrador** | Todo | Configura parámetros, usuarios y estructura |
| **Nómina** | Todo | Ejecuta el proceso mensual y emite reportes |
| **Gerente** | Su árbol de subordinados | Consulta |
| **Coordinador** | Su equipo | Consulta |
| **Empleado** | Solo lo propio | Consulta |

El alcance lo controla el servidor, no la pantalla: aunque alguien conozca una
dirección web, no accede a información ajena.

### Qué secciones ve cada perfil

| Sección | Admin | Nómina | Gerente | Coordinador | Empleado |
|---|:--:|:--:|:--:|:--:|:--:|
| Inicio | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cálculo | ✅ | ✅ | — | — | — |
| Resultados | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reportes | ✅ | ✅ | ✅ | ✅ | — |
| Administración | ✅ | — | — | — | — |

### Los módulos

- **Inicio** — resumen del periodo vigente y acceso a las secciones permitidas.
- **Cálculo** — el proceso mensual completo, en forma de asistente. Aquí ocurre
  todo el cálculo, incluido el pago del 20% al cerrar ciclo.
- **Resultados** — las liquidaciones ya calculadas, con detalle por producto.
- **Reportes** — consolidados con filtros, exportables a Excel y PDF.
- **Administración** — 12 pantallas de configuración: periodos, curva, pesos,
  cuotas, empleados, usuarios, estructura, jerarquía, novedades, pago
  garantizado, reprocesos y auditoría.

---

## Casos de uso

Cada caso indica **quién** lo ejecuta, **cuándo**, los **pasos** y los **puntos
de atención**.

---

### CU-01 · Preparar un ciclo nuevo

> **Quién:** Administrador · **Cuándo:** antes del primer mes del ciclo

Sin parámetros no hay cálculo posible: es lo primero de cada ciclo.

1. **Administración → Periodos.** Verificar que existan el ciclo y sus cuatro
   meses. Si es un año nuevo, sembrar el calendario.
2. **Administración → Curva.** Cargar la tabla de pago del ciclo.
3. **Administración → Pesos.** Definir cuánto pesa cada producto en cada equipo.
4. **Administración → Cuotas.** Cargar la meta de cada persona por producto.

**Puntos de atención**

- Los pesos de cada equipo **deben sumar 100%**. Si no, ese equipo queda mal
  liquidado.
- Basta cargar los parámetros **una vez en el ciclo**: los cuatro meses los
  heredan.
- Un equipo sin pesos, o una persona sin cuota, quedará fuera del cálculo.

---

### CU-02 · Liquidar un mes normal

> **Quién:** Nómina · **Cuándo:** al cierre de cada mes
> *(el caso más frecuente: 9 de cada 12 meses)*

Todo ocurre en **Cálculo**, como un asistente de pasos.

1. **Seleccionar el periodo** en la parte superior.
2. **Paso 1 — Cargar.** Descargar la plantilla del equipo (viene con empleados y
   productos ya rotulados: solo se llenan cuota y venta), completarla y subirla.
3. **Paso 2 — Validar.** El sistema revisa el archivo y muestra los problemas.
   Nada se guarda todavía.
4. **Paso 3 — Importar.** Confirmar. Ahí quedan registradas las ventas.
5. **Paso 4 — KPI 20%.** Indicar si el mes se mide con **1 o 2 indicadores** y
   marcar quién cumplió.
6. **Paso 5 — Calcular.** Ejecutar. Se genera una versión nueva.
7. **Revisar en Resultados** y **exportar el reporte** para nómina.

**Puntos de atención**

- Si la validación arroja avisos, se corrige el archivo y se vuelve a subir: no
  se escribe nada hasta el paso 3.
- **Quien quede sin marcar en el paso 4 no cobra el 20%.** Sin marca se asume
  incumplimiento.
- En estos meses el 20% aparece en **$0** para la mayoría de equipos. No es un
  error: se está acumulando para el cierre del ciclo.
- El asistente termina en el paso 5. El paso 6 solo aparece al cerrar ciclo.

---

### CU-03 · Liquidar el mes que cierra el ciclo

> **Quién:** Nómina · **Cuándo:** abril, agosto y diciembre

Igual que CU-02, pero con un paso más: aquí se paga el 20% acumulado de los
cuatro meses.

1. **Pasos 1 a 5:** idénticos al mes normal.
2. **Paso 6 — Liquidar 20%.** Aparece automáticamente porque el sistema detecta
   que este mes cierra el ciclo. Muestra **cuánto se va a pagar y a cuántas
   personas antes de confirmar**.
3. Revisar la cifra y confirmar.
4. **Cerrar el periodo** desde Administración → Periodos.

**Puntos de atención**

- El paso 6 **solo aparece en el cuarto mes** del ciclo. Si no aparece, es que
  ese mes no cierra ninguno.
- Se paga **una bolsa por cada mes cumplido** (media, en los meses que se
  midieron con dos indicadores).
- Los equipos que cobran el 20% mensual (KAM y las dos direcciones) **no entran
  aquí**: ya cobraron mes a mes.
- Revisar la previsualización con calma: es un pago grande y no tiene vuelta
  atrás.
- **Un ciclo no se puede cerrar sin haber liquidado su 20%.** El sistema lo
  impide.

---

### CU-04 · Consultar una liquidación

> **Quién:** cualquiera · **Cuándo:** en cualquier momento

1. Entrar a **Resultados**.
2. Seleccionar el periodo.
3. Abrir el detalle de una persona.

Se ve el desglose producto por producto: cuota, venta, cumplimiento, porcentaje
que pagó la tabla y aporte a la comisión.

**Puntos de atención**

- Cada perfil ve solo su alcance: el empleado lo suyo, el coordinador su equipo,
  el gerente su árbol.
- En los meses que acumulan, el detalle muestra **cuánto lleva devengado** del
  20% en el ciclo ("2 de 2 meses cumplidos"), para anticipar lo que se cobrará
  al cierre.

---

### CU-05 · Emitir reportes

> **Quién:** Nómina, Gerente o Coordinador · **Cuándo:** al cerrar el mes o a
> solicitud

1. Entrar a **Reportes**.
2. Filtrar por periodo, equipo, zona o producto.
3. Exportar a **Excel** o **PDF**.

**Puntos de atención**

- Al filtrar por un **ciclo**, el reporte reúne los cuatro meses **más** el pago
  del cierre: es la foto completa del ciclo, no la de un mes suelto.
- El archivo exportado lleva en el nombre el alcance temporal, para no confundir
  dos reportes distintos.

---

### CU-06 · Corregir una liquidación

> **Quién:** Nómina · **Cuándo:** cuando se detecta un error después de calcular

1. Corregir el origen del error: el archivo de ventas, la cuota o la marca del
   KPI, según corresponda.
2. Volver a ejecutar el cálculo del periodo.

**Puntos de atención**

- **Recalcular no borra.** Se crea una versión nueva y la anterior se conserva:
  siempre se puede comparar y explicar qué cambió.
- Los reportes toman siempre la **versión vigente**.
- Si el periodo ya está **cerrado**, no admite recálculo y el sistema no ofrece
  reabrirlo. Por eso conviene cerrar solo cuando la liquidación está aprobada.

---

### CU-07 · Registrar una excepción de pago

> **Quién:** Administrador · **Cuándo:** ingreso reciente o cambio de zona

1. **Administración → Pago garantizado.**
2. Seleccionar la persona y el periodo.
3. Indicar si la garantía cubre el 80%, el 20% o ambos.

**Puntos de atención**

- La garantía es un **piso, no un techo**: si la persona vendió más de lo
  esperado, cobra lo que ganó. Nunca castiga al que le fue bien.
- En la pantalla del KPI el sistema **avisa** de quién tiene garantía sobre el
  20%: esa persona lo cobra aunque no se le marque, y marcarla a mano no cambia
  nada.

---

### CU-08 · Alta de una persona nueva

> **Quién:** Administrador · **Cuándo:** al ingresar alguien a la fuerza de ventas

1. **Administración → Empleados.** Crear la ficha con su salario base y equipo.
2. **Administración → Jerarquía.** Indicar a quién le reporta.
3. **Administración → Usuarios.** Crear su cuenta y asignarle perfil.
4. **Administración → Cuotas.** Cargarle sus metas del ciclo vigente.
5. Si aplica, registrar el pago garantizado (CU-07).

**Puntos de atención**

- **Sin cuota no entra al cálculo.** Se reporta como omitido, pero no detiene el
  proceso.
- **Sin salario base liquida en cero.** Si alguien aparece con comisión $0, eso
  es lo primero a revisar.
- La jerarquía es la que define qué ve cada gerente: si se omite, su gente no le
  aparece.

---

### CU-09 · Cerrar un periodo

> **Quién:** Administrador · **Cuándo:** cuando la liquidación está aprobada

1. **Administración → Periodos.**
2. Cerrar el periodo.

**Puntos de atención**

- **Es definitivo.** Bloquea cargas y recálculos. Conviene cerrar solo cuando la
  liquidación ya fue revisada y aprobada por nómina.
- Un ciclo exige tener su 20% liquidado antes de cerrarse.

---

### CU-10 · Revisar quién hizo qué

> **Quién:** Administrador · **Cuándo:** ante una discrepancia o auditoría

1. **Administración → Auditoría** para ver las acciones registradas.
2. **Administración → Reprocesos** para el historial de recálculos.

**Puntos de atención**

- Quedan registradas las acciones sensibles: cálculos, cierres, marcas del KPI y
  liquidaciones de ciclo.

---

## Aspectos a tener en cuenta

### Operación

- **El 20% en $0 durante los meses normales no es un error.** Para la mayoría de
  equipos se acumula y se cobra al cerrar el ciclo.
- **Quien no tenga marcado el KPI no cobra el 20%.** Es deliberado: pagar de
  menos se corrige recalculando; pagar de más, no.
- **Cerrar un periodo es definitivo.**
- **Recalcular es seguro:** nunca se pierde lo anterior.

### Datos

- Los **pesos por equipo deben sumar 100%**.
- Quien no tenga equipo, pesos o cuota **se omite del cálculo** y se reporta al
  final.
- **Salario base en cero → comisión cero.**

### Seguridad

- Las **contraseñas iniciales son la cédula**. El sistema no obliga a cambiarlas
  al entrar, pero conviene promover que cada quien lo haga desde su cuenta.
- Los archivos con **cédulas y salarios** se mantienen fuera del repositorio de
  código, conforme a la Ley 1581 de 2012.

### Continuidad ⚠️

- **Hoy no hay copias de seguridad automáticas.** El plan actual de la base de
  datos no las incluye. Es el punto más frágil de la operación: conviene
  contratar el plan que las active, o establecer una rutina de respaldo manual
  antes de cada cierre.

---

## Estado actual

**El sistema está operativo y calculando con datos reales.**

| | |
|---|---|
| Personal | 52 empleados · 53 usuarios |
| Equipos | 11, con estructura y jerarquía |
| Tabla de pago | 31 escalones |
| Último cálculo | 2026-01 · **42 empleados** · **$58.943.213** |

### Próximos pasos sugeridos

1. **Activar copias de seguridad** — lo más urgente.
2. **Validar contra el Excel** — contrastar algunas liquidaciones con el libro
   oficial antes de dar el sistema por definitivo.
3. **Cargar los meses siguientes** — hoy solo está calculado 2026-01.
4. **Completar 4 salarios base** faltantes en el archivo de origen: esas
   personas liquidan en cero hasta que se carguen.

---

## Glosario

| Término | Qué significa |
|---|---|
| **Ciclo** | Bloque de 4 meses. El año tiene 3 |
| **Devengar** | Ganar el derecho a un pago que se cobrará después |
| **Liquidar** | Ejecutar el cálculo y dejar el pago registrado |
| **Versión** | Cada recálculo crea una; las anteriores se conservan |
| **Alcance** | Qué información puede ver cada perfil |
