# Requerimientos de servidor e infraestructura — Sistema de Incentivos Zambon

**Propósito:** dimensionar el servidor para el despliegue web del sistema **en
infraestructura propia de la compañía**.
**Alcance:** ~50 empleados, uso interno, cálculo mensual/por ciclo de incentivos.
**Modelo de despliegue:** un único servidor (físico o VM) on-premise que aloja los
tres componentes.

---

## 1. Arquitectura de despliegue

Tres componentes en un mismo host:

| Componente | Tecnología | Rol |
|---|---|---|
| **API (backend)** | NestJS (Node.js 20 LTS) | Lógica de negocio, cálculo, autenticación |
| **Base de datos** | PostgreSQL 15+ | Fuente de verdad (empleados, ventas, liquidaciones) |
| **Frontend** | HTML/CSS/JS estático | Interfaz de usuario (19 pantallas), servida vía Nginx |

El backend es un **monolito modular**: un solo proceso, sin microservicios. El
sistema usa **PostgreSQL estándar + Prisma**, sin dependencias propietarias, por
lo que corre sobre cualquier servidor de la compañía sin cambios de código.

---

## 2. Dimensionamiento del servidor

Un único servidor cubre los tres componentes. El perfil de carga es bajo (decenas
de usuarios internos, no miles); el único pico es el **cálculo mensual** —un
proceso batch de ~50 liquidaciones que dura segundos—, no el tráfico web.

| Recurso | Requerido | Notas |
|---|---|---|
| **vCPU** | 2 núcleos | Suficiente para API + PostgreSQL en el mismo host. |
| **RAM** | 4 GB | ~1 GB Node.js + ~1 GB PostgreSQL + SO y margen. |
| **Almacenamiento** | **20 GB SSD** | Ver desglose en §3. Dominado por SO y logs, no por los datos. |
| **Sistema operativo** | Linux (Ubuntu 22.04 LTS o similar) | — |
| **Runtime** | Node.js 20 LTS · PostgreSQL 15+ | — |
| **Red** | Salida a internet + IP/DNS interno | BD sin exposición pública. |

No se requiere más: el sistema no es intensivo en cómputo ni en memoria. Escalar
por encima de esto no aporta rendimiento perceptible al volumen actual.

---

## 3. Estimación de espacio (objetiva)

El espacio total lo determinan el sistema operativo, el runtime y los respaldos
—**no el volumen de datos del negocio**, que es mínimo—.

### 3.1. Datos del negocio — crecimiento en el primer año

Cada cierre mensual (ventas, cuotas, liquidaciones y su detalle para ~50
empleados) genera del orden de **~0,4 MB**. Crecimiento medido, no estimado al alza:

| Horizonte | Datos acumulados en la base |
|---|---|
| 1 mes | ~0,4 MB |
| 6 meses | ~2,3 MB |
| **1 año** | **~4,5 MB** |

El volumen anual de datos es de unos pocos megabytes: irrelevante para el
dimensionamiento del disco.

### 3.2. Huella en disco (horizonte 1 año)

| Concepto | Espacio |
|---|---|
| Sistema operativo (Linux) | ~5–8 GB |
| Node.js + aplicación + dependencias | ~1 GB |
| Motor PostgreSQL (binarios + WAL + índices + vacuum) | ~1–2 GB de trabajo |
| Datos del negocio (1 año) | < 0,01 GB |
| Respaldos locales (**semanal**, retención 4 semanas) | < 0,1 GB |
| Logs del sistema y de aplicación | ~2–4 GB |
| **Subtotal** | **~10–15 GB** |
| **Provisión recomendada** | **20 GB SSD** |

Con respaldos semanales y horizonte de un año, 20 GB cubren la operación con
margen. Los respaldos y los datos del negocio son despreciables; el disco lo ocupan
el sistema operativo y los logs.

---

## 4. Seguridad y red

- **Transporte cifrado (HTTPS/TLS):** certificado en el punto de entrada web.
- **Autenticación:** JWT con refresh token; contraseñas con hash (bcrypt).
- **Autorización:** control de acceso por rol y por jerarquía, validado en el
  backend.
- **Base de datos:** no expuesta a internet; accesible solo desde el backend.
- **Variables sensibles:** credenciales y secretos fuera del código, en variables
  de entorno.
- **Dominio:** un subdominio corporativo (p. ej. `incentivos.zambon…`) apuntando
  al servidor de aplicación.

---

## 5. Continuidad operativa

| Aspecto | Recomendación |
|---|---|
| **Respaldos** | `pg_dump` semanal automatizado; retención 4 semanas. Copia fuera del servidor (NAS o almacenamiento corporativo). |
| **Recuperación** | Restauración desde respaldo; opcional point-in-time recovery activando archivado de WAL. |
| **Trazabilidad** | Resultados de cálculo versionados; nada se sobrescribe. |
| **Logs** | Registro estructurado de operaciones críticas (cargas, cálculos). |
| **Monitoreo** | Disponibilidad del API y de la base de datos; alerta de disco. |

---

## 6. Componentes opcionales (crecimiento futuro)

No requeridos para el arranque; se incorporan solo si el volumen lo justifica:

- **Cola de trabajos (Redis + BullMQ):** para importaciones o exportaciones
  masivas y reprocesos pesados en segundo plano.
- **Almacenamiento de archivos (S3 o compatible):** para conservar los archivos
  de ventas originales y los reportes generados (Excel/PDF).

---

## 7. Resumen ejecutivo

Para el alcance actual (~50 empleados, uso interno), el sistema corre en **un solo
servidor propio de la compañía** con un dimensionamiento contenido: **2 vCPU,
4 GB RAM y 20 GB SSD**, sobre Linux con Node.js 20 y PostgreSQL 15. Los datos del
negocio son mínimos —del orden de ~4,5 MB en el primer año—; el disco lo consumen
el sistema operativo y los logs, no la operación, con respaldos semanales. Los
componentes de escalamiento (colas, almacenamiento de archivos) quedan como
evolución opcional, no como requisito inicial.
