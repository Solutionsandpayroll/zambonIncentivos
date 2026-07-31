# Cómo arrancar el sistema Zambon

El backend sirve **la API y las 18 pantallas del frontend** desde un mismo
servidor. Solo hay que arrancar el backend: no se corre nada aparte.

- **URL para abrir en el navegador:** http://localhost:3000
- **Usuario inicial:** `admin` · la contraseña se define al crear el usuario
  (ver §4). No hay contraseña por defecto en el código.

---

## 1. Preparación (una sola vez)

Solo la primera vez, o al mover el proyecto a otro computador:

```bash
cd C:\Users\juanc\Documents\zambon\backend

npm install              # instala dependencias
npm run prisma:generate  # genera el cliente de base de datos
```

> Las credenciales de la base de datos (Supabase) ya están en el archivo `.env`
> de la raíz del proyecto. El backend lo lee solo; no hay que configurar nada.

Verificar que conecta a la base de datos:

```bash
npm run check:db
```

---

## 2. Arrancar (uso diario)

Desde la carpeta `backend/`:

```bash
npm run start:dev
```

Luego abrir en el navegador: **http://localhost:3000**
(la raíz redirige al login automáticamente).

`start:dev` recarga el backend solo si cambias su código. El frontend es HTML:
si editas una pantalla `.html`, basta con recargar la página con **F5**.

Para detener el servidor: **Ctrl + C** en la terminal.

---

## 3. Modo producción (opcional)

Más estable para dejarlo corriendo (compila primero, luego ejecuta):

```bash
cd C:\Users\juanc\Documents\zambon\backend

npm run build
npm run start:prod
```

Se abre igual en **http://localhost:3000**.

---

## 4. Si la base de datos está vacía

Crear los roles y el usuario administrador inicial:

```bash
# Recomendado: fija tú la contraseña
ADMIN_PASSWORD='<una-contraseña-fuerte>' npm run seed:roles

# O sin variable: el seed genera una temporal y la imprime UNA sola vez
npm run seed:roles
```

Si el usuario `admin` ya existe, el seed **no toca** su contraseña.

Migrar los empleados desde los Excel (ver documentación de migración):

```bash
npm run import:employees
```

> **Los archivos `.xlsx` no están en el repositorio** — contienen cédula, nombre
> y salario de empleados reales, y este repo es público. Cópialos a la raíz del
> proyecto antes de importar: `baseempleados.xlsx`, `salariosbases.xlsx` y
> `calculocomisiones.xlsx`.

---

## Resumen rápido

| Quiero… | Comando (desde `backend/`) | Abro en el navegador |
|---|---|---|
| **Arrancar (uso diario)** | `npm run start:dev` | http://localhost:3000 |
| Arrancar (producción) | `npm run build` y `npm run start:prod` | http://localhost:3000 |
| Verificar la base de datos | `npm run check:db` | — |
| Correr las pruebas | `npm test` | — |

---

## Notas

- **Todo corre en el puerto 3000**: la API (`/api/v1/...`) y las pantallas
  (`/loginf/code.html`, `/home/code.html`, etc.) salen del mismo servidor. Por
  eso no hay problemas de CORS y solo se arranca una cosa.
- Si `npm run start:dev` diera algún error inesperado, usa la vía de producción
  (`npm run build` + `npm run start:prod`), que es la más estable.
- Cambia la contraseña del usuario `admin` tras el primer ingreso.
