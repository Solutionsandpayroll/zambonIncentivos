# Diseño de módulos y esqueleto técnico del backend

## 1. Objetivo

Definir una estructura técnica y funcional para el backend del sistema de incentivos de Zambon, alineada con los documentos de arquitectura, diseño relacional y la distribución actual de pestañas del sistema: `home`, `login`, `admin`, `calculo`, `reportes` y `results`.

Este documento busca servir como guía base para implementar un backend robusto, modular, auditable y fácil de evolucionar sin caer en una sobreingeniería innecesaria.

## 2. Principios de diseño

1. Monolito modular como punto de partida.
2. Separación por dominio de negocio, no por simple tipo de archivo.
3. Trazabilidad completa de cargas, cálculos, parámetros y reportes.
4. Seguridad validada en backend, nunca solo en frontend.
5. Reglas históricas por periodo o ciclo, sin sobrescribir resultados cerrados.
6. Nombres consistentes, predecibles y fáciles de buscar.
7. Capacidad de crecimiento hacia colas, jobs y servicios separados si el volumen lo exige.

## 3. Mapa funcional desde las pestañas del sistema

La UI actual no debe dictar la arquitectura, pero sí ayuda a agrupar responsabilidades de forma natural.

### 3.1. `login`

Punto de entrada autenticado.

Responsabilidades backend:

- Autenticación con usuario y contraseña.
- Emisión de JWT y refresh token.
- Recuperación de sesión.
- Cierre de sesión lógico.
- Identificación de rol y alcance jerárquico.

### 3.2. `home`

Vista de tablero o resumen operativo.

Responsabilidades backend:

- Resumen de indicadores del usuario autenticado.
- Acceso rápido a reportes recientes.
- Estado de periodos, cargas y cálculos.
- Noticias o alertas funcionales si se requieren.

### 3.3. `admin`

Panel de parametrización y gobierno.

Responsabilidades backend:

- Gestión de usuarios, roles y permisos.
- Gestión de personas, empleados, equipos, regiones y zonas.
- Parametrización histórica por periodo.
- Catálogos de componentes, cuotas y curva de pago.
- Reprocesos controlados.
- Auditoría administrativa.

### 3.4. `calculo`

Centro operativo del negocio.

Responsabilidades backend:

- Carga de archivo de ventas.
- Validación de estructura y contenido.
- Importación de transacciones.
- Cálculo del 80%.
- Cálculo del 20%.
- Aplicación de excepciones y pago garantizado.
- Consolidación por empleado y periodo.

### 3.5. `reportes`

Consulta y exportación.

Responsabilidades backend:

- Reporte individual.
- Reporte por equipo.
- Reporte por gerente, coordinador o director.
- Reporte consolidado por periodo o ciclo.
- Exportación a Excel y PDF.

### 3.6. `results`

Detalle de liquidaciones y resultados finales.

Responsabilidades backend:

- Consulta del cálculo final por empleado.
- Detalle del 80% por componente.
- Detalle del 20% por KPI o regla de ejecución.
- Versionamiento de resultados.
- Descarga de soporte histórico.

## 4. Arquitectura funcional propuesta

La solución recomendada es un monolito modular con NestJS, TypeScript y PostgreSQL.

### Capas principales

#### 4.1. Capa de presentación

Expone REST APIs para la UI y para integraciones futuras.

Responsabilidades:

- Validación de entrada.
- Serialización y deserialización.
- Control de acceso por guardas.
- Paginación, filtros y ordenamiento.

#### 4.2. Capa de aplicación

Coordina los casos de uso.

Responsabilidades:

- Orquestar importaciones.
- Ejecutar cálculos.
- Generar reportes.
- Consultar resultados según rol.
- Registrar auditoría funcional.

#### 4.3. Capa de dominio

Contiene las reglas puras del negocio.

Responsabilidades:

- Cálculo de incentivos.
- Reglas de pago garantizado.
- Reglas por equipo.
- Reglas de periodo y ciclo.
- Reglas de subordinación y visibilidad.

#### 4.4. Capa de infraestructura

Implementa persistencia y servicios técnicos.

Responsabilidades:

- PostgreSQL.
- ORM.
- Manejo de archivos.
- Generación de reportes.
- Cola de trabajos.
- Logs y métricas.

## 5. Módulos de backend

Los módulos deben reflejar el negocio y no solo el tipo de recurso.

### 5.1. `auth`

Gestión de autenticación y sesión.

Incluye:

- Login.
- Refresh token.
- Logout.
- Recuperación de credenciales si aplica.
- Guards de acceso.

### 5.2. `users`

Usuarios de aplicación.

Incluye:

- Creación de usuarios.
- Asociación con empleado.
- Estado de usuario.
- Cambio de contraseña.
- Asignación de roles.

### 5.3. `organization`

Estructura organizacional.

Incluye:

- Personas.
- Empleados.
- Equipos.
- Cargos.
- Regiones.
- Zonas.
- Jerarquía jefe-subordinado.

### 5.4. `catalogs`

Maestros parametrizables.

Incluye:

- Componentes de venta.
- Periodos.
- Curva de pago.
- Parámetros del sistema.
- Cuotas por componente.

### 5.5. `sales-import`

Entrada operativa de ventas.

Incluye:

- Recepción de archivo.
- Validación de columnas.
- Hash del archivo.
- Lote de carga.
- Errores de importación.

### 5.6. `incentives`

Motor de cálculo.

Incluye:

- Cálculo del 80%.
- Cálculo del 20%.
- Aplicación de novedades.
- Pago garantizado.
- Consolidación final.

### 5.7. `reports`

Generación y consulta de reportes.

Incluye:

- Reportes por empleado.
- Reportes por equipo.
- Exportación.
- Historial de generación.

### 5.8. `admin`

Gobierno funcional.

Incluye:

- Parámetros por periodo.
- Historial de cambios.
- Reprocesos.
- Auditoría.

### 5.9. `notifications` opcional

Solo si el sistema requiere avisos internos o notificaciones de proceso.

## 6. Esqueleto técnico de carpetas

Propuesta base de estructura para un backend NestJS:

```text
backend/
  src/
    main.ts
    app.module.ts
    config/
      env.config.ts
      database.config.ts
      auth.config.ts
      queue.config.ts
    common/
      constants/
      decorators/
      dto/
      exceptions/
      filters/
      guards/
      interceptors/
      pipes/
      utils/
      types/
    shared/
      database/
      logging/
      files/
      reporting/
      security/
    modules/
      auth/
        auth.controller.ts
        auth.service.ts
        auth.module.ts
        dto/
        strategies/
        guards/
      users/
        users.controller.ts
        users.service.ts
        users.repository.ts
        users.module.ts
        dto/
        entities/
      organization/
        employees/
        teams/
        regions/
        zones/
        hierarchy/
      catalogs/
        periods/
        components/
        curve-pay/
        targets/
      sales-import/
        import.controller.ts
        import.service.ts
        import.processor.ts
        import.repository.ts
        dto/
        jobs/
      incentives/
        calculation.controller.ts
        calculation.service.ts
        calculation-engine.ts
        calculation.repository.ts
        dto/
        domain/
        jobs/
      reports/
        reports.controller.ts
        reports.service.ts
        reports.repository.ts
        dto/
        exporters/
      admin/
        admin.controller.ts
        admin.service.ts
        admin.repository.ts
        dto/
        audit/
    database/
      migrations/
      seed/
      views/
    jobs/
      processors/
      queues/
    tests/
      unit/
      integration/
      e2e/
  prisma/
    schema.prisma
  docs/
    openapi/
  scripts/
  docker/
  .env.example
  package.json
  tsconfig.json
  nest-cli.json
  docker-compose.yml
```

## 7. Convenciones técnicas

### 7.1. Convención de nombres

- Archivos y carpetas en `kebab-case`.
- Clases en `PascalCase`.
- Variables y funciones en `camelCase`.
- Constantes en `SCREAMING_SNAKE_CASE`.
- Tablas y columnas en `snake_case` si se usa convención SQL directa.

### 7.2. Convención de módulos

Cada módulo debe seguir esta estructura mínima:

- `controller`
- `service`
- `repository`
- `dto`
- `entity` o `model`
- `tests`

Si el cálculo lo requiere, se puede agregar una carpeta `domain` para reglas puras.

### 7.3. Convención de endpoints

Usar nombres consistentes y previsibles.

- `GET /auth/me`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /employees`
- `GET /employees/:id`
- `GET /periods`
- `POST /sales-upload`
- `POST /incentives/calculate`
- `GET /reports/employees/:id`
- `GET /results/:id`

### 7.4. Convención de DTOs

- Un DTO por intención de uso.
- No exponer entidades de persistencia directamente.
- Validar con `class-validator` o equivalente.
- Separar DTO de creación, actualización, filtros y respuesta.

### 7.5. Convención de servicios

- Un servicio por caso de uso o dominio cercano.
- No mezclar importación, cálculo y exportación en un mismo servicio si ya crece el módulo.
- Mantener funciones pequeñas y testeables.

### 7.6. Convención de repositorios

- Encapsular acceso a datos.
- Evitar queries dispersas en controladores.
- Reutilizar filtros de jerarquía, periodo y equipo.

## 8. Responsabilidades por módulo

### auth

- Autenticación.
- Autorización base.
- Renovación de sesión.

### users

- Gestión de usuarios del sistema.
- Vinculación con empleados.
- Roles.

### organization

- Estructura humana y territorial.
- Visibilidad jerárquica.
- Relación entre jefe y subordinado.

### catalogs

- Parametrización histórica.
- Componentes.
- Curvas de pago.
- Cuotas.
- Periodos.

### sales-import

- Recepción de archivo.
- Validación estructural.
- Persistencia de lote.
- Cola para procesamiento si el archivo es grande.

### incentives

- Cálculo del 80% mensual.
- Cálculo del 20% por mes o por ciclo según equipo.
- Consolidación final.
- Historial de versiones.

### reports

- Exportación de información individual y consolidada.
- Descargas.
- Formatos Excel y PDF.

### admin

- Parametrización operativa.
- Auditoría.
- Reprocesos.

## 9. Flujo técnico principal

### 9.1. Flujo de login

1. El usuario envía credenciales.
2. Se valida contra `users` y `auth`.
3. Se emiten tokens.
4. Se carga el alcance del usuario.
5. La UI redirige según rol y permisos.

### 9.2. Flujo de carga de ventas

1. El usuario autorizado sube archivo.
2. El backend valida periodo, formato y columnas.
3. Se registra lote y hash.
4. Se importan transacciones.
5. Se registra estado final del lote.

### 9.3. Flujo de cálculo

1. Se selecciona periodo o ciclo.
2. Se consultan ventas, cuotas, curva y parámetros.
3. Se aplican excepciones y reglas de pago garantizado.
4. Se calcula el 80%.
5. Se calcula el 20%.
6. Se consolida la liquidación.
7. Se guarda versión histórica.

### 9.4. Flujo de reportes

1. El usuario solicita un alcance permitido.
2. El backend filtra por jerarquía, equipo o periodo.
3. Se entrega vista o exportación.

## 10. Dominio técnico y reglas de negocio

### Reglas centrales que debe soportar el motor

- Cálculo del 80% por componente y peso por equipo.
- Cálculo del 20% por KPI o regla de ejecución.
- Pago mensual o por ciclo según equipo.
- Coordinadores con cuota derivada de la suma de su equipo.
- Pago garantizado en los primeros dos meses o por cambio de zona.
- Visibilidad por jerarquía y subordinación persistida.
- Versionamiento de resultados cerrados.

### Recomendación de implementación

Las reglas críticas deben vivir en una capa de dominio o en servicios de cálculo dedicados, no dentro del controlador ni en el frontend.

## 11. Persistencia y auditoría

La base de datos debe seguir siendo la fuente de verdad.

Se recomienda conservar al menos:

- Lotes de carga.
- Transacciones de venta.
- Parámetros por periodo.
- Resultados calculados.
- Detalle por componente.
- Excepciones aplicadas.
- Historial de reprocesos.
- Archivo origen y hash.

### Buenas prácticas de auditoría

- No sobrescribir resultados cerrados.
- Si se recalcula un periodo, guardar nueva versión.
- Mantener trazabilidad entre archivo, lote y liquidación.
- Registrar usuario, fecha y motivo de cambios administrativos.

## 12. Asincronía y colas

No todo debe resolverse en una petición HTTP.

Usar jobs o colas para:

- Importación de archivos grandes.
- Cálculo masivo por periodo.
- Exportación de Excel o PDF.
- Reprocesos administrativos.

Tecnología sugerida:

- Redis.
- BullMQ.

## 13. Seguridad

### Autenticación

- JWT para sesión principal.
- Refresh token para renovación.

### Autorización

- RBAC para roles.
- Validación por jerarquía para alcance de datos.
- Filtro obligatorio en backend para empleado, coordinador, gerente, nómina y admin.

### Roles sugeridos

- `ADMIN`
- `NOMINA`
- `GERENTE`
- `COORDINADOR`
- `EMPLEADO`

## 14. Contratos de datos sugeridos

Los objetos de respuesta deben ser estables y claros.

### Respuesta de cálculo por empleado

- Datos de identificación.
- Equipo.
- Periodo.
- Base salarial.
- 80% teórico y real.
- 20% teórico y real.
- Total liquidado.
- Estado de cálculo.
- Indicador de pago garantizado.

### Respuesta de reporte individual

- Resumen del periodo.
- Detalle por componente.
- Curva de pago aplicada.
- KPI de ejecución.
- Totales descargables.

## 15. Convenciones de desarrollo recomendadas

### Código

- Evitar servicios gigantes.
- Mantener funciones con una sola responsabilidad.
- Escribir lógica de cálculo con pruebas unitarias.
- No mezclar acceso a datos con lógica de negocio.

### API

- Versionar endpoints si el sistema evoluciona.
- Responder con códigos HTTP consistentes.
- Estandarizar errores y validaciones.

### Pruebas

- Unitarias para reglas de cálculo.
- Integración para importación y persistencia.
- E2E para login, carga, cálculo y descarga.

## 16. Observabilidad

El backend debe permitir ver el estado de procesos críticos.

Recomendado:

- Logs estructurados.
- Trazabilidad por `requestId` o `correlationId`.
- Métricas de importación y cálculo.
- Registro de errores de negocio y técnicos.

## 17. Despliegue mínimo

Infraestructura mínima sugerida:

- Backend en un contenedor.
- PostgreSQL en otro contenedor.
- Redis opcional si se usan colas.
- Almacenamiento local o compatible S3 para archivos.

## 18. Ruta de evolución

Este esqueleto permite crecer por etapas:

1. API monolítica modular.
2. Introducción de colas para procesamiento pesado.
3. Separación de reportes si la demanda crece.
4. Extracción de cálculo a servicio dedicado solo si el volumen lo justifica.

## 19. Resumen ejecutivo

La propuesta técnica más coherente para Zambon es un backend modular con estructura por dominio, apoyado en NestJS, PostgreSQL y procesos asíncronos para importación, cálculo y exportación. La arquitectura debe reflejar el negocio real: autenticación, organización, catálogos, importación de ventas, cálculo de incentivos, reportes y administración.

La distribución de pestañas del sistema ayuda a traducir la experiencia de usuario en módulos backend claros, sin obligar al backend a depender de la UI. La clave es mantener el motor de cálculo aislado, auditado y versionado.

## 20. Prompt para generar un diagrama visual de arquitectura

Usa este prompt en una herramienta de diagramación o en un modelo generador de diagramas:

```text
Genera un diagrama visual de arquitectura del sistema de incentivos de Zambon en estilo limpio, corporativo y moderno, con fondo claro y alta legibilidad.

El diagrama debe mostrar estas capas y componentes:

1. Capa de presentación:
- Home
- Login
- Admin
- Calculo
- Reportes
- Results

2. Capa de backend modular:
- Auth
- Users
- Organization
- Catalogs
- Sales Import
- Incentives Engine
- Reports
- Admin

3. Capa de infraestructura:
- PostgreSQL
- Redis opcional para colas
- File Storage
- PDF/Excel Generator
- Audit Logs

4. Flujo principal:
- Login -> Auth -> Roles y jerarquía
- Calculo -> Sales Import -> Validación -> Lotes -> Incentives Engine
- Incentives Engine -> PostgreSQL -> Results
- Reportes -> Reports -> File Storage / PDF / Excel
- Admin -> Catalogs / Organization / Parameters

5. Reglas visuales:
- Representa el sistema como un monolito modular.
- Usa flechas para indicar flujo de datos y dependencias.
- Agrupa por capas con cajas bien definidas.
- Incluye una caja transversal de seguridad con JWT, RBAC y jerarquía.
- Incluye una caja transversal de auditoría y trazabilidad.
- Destaca el motor de incentivos como el componente central del dominio.

6. Estilo:
- Sin estética oscura.
- Paleta clara con acentos verdes o lima para resaltar el motor de cálculo.
- Tipografía clara y ordenada.
- Componentes con bordes suaves y sin exceso decorativo.

7. Salida solicitada:
- Un diagrama de arquitectura en formato de alto nivel.
- Si es posible, incluir una versión tipo C4 nivel 2.
- Mostrar claramente la relación entre UI, backend, persistencia y procesos asíncronos.
```
