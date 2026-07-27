# Arquitectura de Backend Propuesta

## 1. Objetivo

Definir una arquitectura de backend robusta, mantenible y sin sobrecomplicación para el sistema de incentivos de Zambon. La solución debe soportar:

- Carga de archivos con ventas por empleado y componente.
- Cálculo mensual y por ciclo de incentivos.
- Consulta por periodos, equipos, regiones y zonas.
- Jerarquías de acceso por rol y por subordinación.
- Historial de parámetros y liquidaciones.
- Descarga de reportes individuales y consolidados.

## 2. Recomendación principal

La mejor opción equilibrada para este proyecto es un **monolito modular** con **Node.js + NestJS + TypeScript**.

### Por qué esta opción

- Tiene buena robustez sin llegar a la complejidad operativa de microservicios.
- Encaja bien con una aplicación de negocio con reglas cambiantes.
- TypeScript ayuda a mantener consistencia en un dominio con muchas entidades y cálculos.
- NestJS da estructura, inyección de dependencias, módulos y validación sin tener que construir todo desde cero.
- Permite crecer después hacia servicios separados si el volumen lo exige.

### Cuándo elegir Spring Boot en lugar de Node

Spring Boot es una gran opción si se prioriza:

- Equipo con experiencia fuerte en Java.
- Necesidad de disciplina empresarial muy estricta desde el inicio.
- Integración futura con ecosistema Java o herramientas corporativas ya existentes.

Pero para este caso, si no hay una restricción fuerte de Java, **Node.js con NestJS ofrece una relación mejor entre velocidad de desarrollo, orden arquitectónico y mantenibilidad**.

## 3. Estilo arquitectónico

### Monolito modular

La aplicación debe organizarse en módulos claramente separados, pero desplegarse como una sola unidad.

Esto evita:

- Complejidad de red entre servicios.
- Duplicación de despliegues.
- Costos operativos innecesarios.

Y permite mantener:

- Separación de responsabilidades.
- Código más entendible.
- Evolución gradual del sistema.

## 4. Capas propuestas

### 4.1. Capa de presentación

API REST para consumo desde las interfaces actuales y futuras.

Responsabilidades:

- Autenticación.
- Validación básica de entrada.
- Exposición de endpoints por módulo.
- Paginación, filtros y ordenamiento.

### 4.2. Capa de aplicación

Coordina casos de uso del negocio.

Responsabilidades:

- Orquestar la carga de archivos.
- Disparar el cálculo de incentivos.
- Aplicar reglas de acceso.
- Generar reportes.
- Registrar auditoría funcional.

### 4.3. Capa de dominio

Contiene la lógica principal del negocio.

Responsabilidades:

- Reglas de cálculo del 80%.
- Reglas del 20%.
- Validaciones de periodo.
- Reglas de pago garantizado.
- Reglas de cuotas por componente y equipo.
- Jerarquías de visibilidad.

### 4.4. Capa de infraestructura

Implementa el acceso a datos y servicios externos.

Responsabilidades:

- Persistencia en PostgreSQL.
- Lectura de archivos Excel o CSV.
- Generación de reportes.
- Envío de archivos descargables.
- Cola de trabajos en segundo plano.

## 5. Módulos funcionales

La arquitectura debe dividirse en módulos de negocio, no solo técnicos.

### 5.1. Auth y usuarios

- Login.
- JWT y refresh token.
- Roles.
- Acceso por jerarquía.

### 5.2. Organización

- Personas.
- Empleados.
- Equipos.
- Regiones.
- Zonas.
- Jerarquía de jefes y subordinados.

### 5.3. Catálogos

- Componentes de venta.
- Curva de pago.
- Periodos.
- Parámetros de cálculo.

### 5.4. Carga operativa

- Recepción de archivo.
- Validación de estructura.
- Importación de ventas.
- Registro de incidencias o novedades.

### 5.5. Cálculo de incentivos

- Cálculo del 80%.
- Cálculo del 20%.
- Aplicación de excepciones.
- Consolidación final por empleado.

### 5.6. Reportes

- Reporte individual.
- Reporte por equipo.
- Reporte por periodo.
- Exportación en Excel o PDF.

### 5.7. Administración

- Ajuste de parámetros por periodo.
- Historial de cambios.
- Reprocesos controlados.

## 6. Tecnología recomendada

### Opción recomendada

- **Backend**: Node.js + NestJS + TypeScript
- **Base de datos**: PostgreSQL
- **ORM**: Prisma o TypeORM, con preferencia por Prisma si se quiere simplicidad operativa
- **Autenticación**: JWT + refresh tokens
- **Colas**: Redis + BullMQ para cálculos pesados, importaciones y reportes
- **Documentación API**: OpenAPI / Swagger
- **Contenedores**: Docker y Docker Compose

### Alternativa empresarial

- **Backend**: Spring Boot
- **Base de datos**: PostgreSQL
- **Seguridad**: Spring Security
- **ORM**: JPA / Hibernate

Spring Boot es más pesado en arranque, pero muy sólido. Es una buena segunda opción si el equipo domina Java o si se prevé un crecimiento corporativo fuerte.

### Alternativa de menor complejidad

- **Backend**: Node.js con Express

No la recomiendo como base principal si el sistema va a crecer, porque se pierde estructura y se termina construyendo a mano lo que NestJS ya resuelve de forma ordenada.

## 7. Diseño de módulos internos

Cada módulo debe seguir la misma organización:

- `controller`
- `service`
- `repository`
- `dto`
- `entity` o `model`
- `tests`

Esto mantiene el código legible y facilita mantenimiento.

## 8. Flujo principal del sistema

### 8.1. Carga de ventas

1. El usuario sube el archivo.
2. El backend valida periodo, formato y columnas.
3. Se guarda el lote de carga.
4. Se importan las transacciones.
5. Se marca el lote como procesado o con errores.

### 8.2. Cálculo de comisiones

1. Se toma el periodo cerrado o en revisión.
2. Se consultan ventas, cuotas y curva de pago.
3. Se calculan los componentes por empleado.
4. Se aplican excepciones de antigüedad o cambio de zona.
5. Se consolida el resultado final.
6. Se guarda la liquidación histórica.

### 8.3. Consulta y reportes

1. El usuario consulta por su alcance autorizado.
2. El backend filtra por jerarquía, equipo o periodo.
3. Se entrega vista resumida o exportable.

## 9. Seguridad y permisos

Se recomienda un esquema simple pero estricto:

- `ADMIN`: ve todo y administra parámetros.
- `NOMINA`: ve liquidaciones y resultados globales.
- `GERENTE`: ve subordinados directos e indirectos.
- `COORDINADOR`: ve su equipo.
- `EMPLEADO`: ve solo su propia información.

### Reglas de acceso

- El permiso no debe depender solo del frontend.
- La verificación debe hacerse en el backend.
- La subordinación debe salir de la jerarquía persistida.

## 10. Persistencia y auditoría

La base de datos debe ser la fuente de verdad.

Se recomienda guardar:

- Lote de carga.
- Transacciones de ventas.
- Resultado de cálculo por periodo.
- Detalle por componente.
- Excepciones aplicadas.
- Historial de cambios administrativos.

### Buen criterio de auditoría

- No recalcular silenciosamente resultados cerrados.
- Si se reprocesa un periodo, guardar nueva versión.
- Conservar trazabilidad de qué archivo originó cada carga.

## 11. Procesamiento asíncrono

No todo debe ejecutarse en una petición HTTP.

Usar cola para:

- Importación de archivos grandes.
- Cálculo masivo por periodo.
- Generación de Excel o PDF.
- Reprocesos administrativos.

Esto mejora estabilidad y evita timeouts.

## 12. API sugerida

Algunos grupos de endpoints útiles:

- `/auth`
- `/employees`
- `/teams`
- `/regions`
- `/zones`
- `/components`
- `/periods`
- `/sales-upload`
- `/incentives`
- `/reports`
- `/admin`

## 13. Infraestructura mínima sugerida

### Desarrollo y despliegue

- Backend en un contenedor.
- PostgreSQL en otro contenedor.
- Redis solo si se usa cola o cache.
- Storage de archivos en disco o en un servicio compatible S3 si luego se escala.

### Observabilidad

- Logs estructurados.
- Registro de errores.
- Métricas básicas de tiempo de cálculo e importación.

## 14. Recomendación final

Si el objetivo es una solución robusta pero no excesivamente cargada, mi recomendación es:

**Node.js + NestJS + PostgreSQL + Redis opcional para colas, en una arquitectura de monolito modular.**

Es la mejor relación entre:

- velocidad de desarrollo,
- orden del código,
- escalabilidad razonable,
- y facilidad de mantenimiento.

Spring Boot queda como alternativa válida si el equipo ya trabaja con Java o si quieren una base más corporativa desde el inicio.

## 15. Siguiente paso sugerido

El siguiente documento natural sería el diseño de módulos con endpoints y responsabilidades, o directamente el esqueleto técnico del backend con carpetas y convenciones.