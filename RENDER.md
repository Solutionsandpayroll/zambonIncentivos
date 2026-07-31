# Subir a Render

Guía para poner el sistema en línea. **~20 minutos** la primera vez.

El backend sirve la API **y** las 18 pantallas desde un mismo servicio: se
despliega **un solo servicio**, no dos. La base de datos es Supabase y es
externa a Render: no se crea nada de base aquí.

---

## Antes de empezar: lista de verificación

| | Qué |
|---|---|
| ☐ | Cuenta en [render.com](https://render.com) |
| ☐ | Permiso de escritura en `Solutionsandpayroll/zambonIncentivos` |
| ☐ | El `.env` local a mano (de ahí salen las dos URLs de la base) |
| ☐ | Node instalado (para generar los secretos del paso 2) |

---

## 1. Subir el código a GitHub  ⚠️ IMPRESCINDIBLE

**Render despliega lo que hay en GitHub, no lo que tienes en tu máquina.** Hoy
el repositorio local tiene **18 commits que nunca se han subido**, así que sin
este paso no hay nada que desplegar.

```bash
cd c:/Users/juanc/Documents/zambon

git add -A
git commit -m "Centraliza el 20% en Cálculo y corrige el reporte por ciclo"
git push -u origin main
```

Si el `push` devuelve **403**, es el problema conocido de credenciales: Windows
tiene guardada una cuenta personal sin permiso en la organización. Para
arreglarlo:

1. Panel de control → **Administrador de credenciales** → *Credenciales de Windows*
2. Borra la entrada `git:https://github.com`
3. Repite el `git push`: pedirá usuario y contraseña
4. Usa la cuenta corporativa y, como contraseña, un **Personal Access Token**
   (GitHub → Settings → Developer settings → Tokens → *Generate new token*,
   con permiso `repo`)

> **Verifica antes de seguir:** entra al repositorio en GitHub y comprueba que
> ves las carpetas `backend/`, `adminf/`, `calculof/`, `home/`, `loginf/`,
> `reportesf/`, `resultsf/`, `shared/` y `prisma/`. Si falta alguna, el
> despliegue arrancará pero las pantallas darán 404.

---

## 2. Generar los dos secretos

Corre esto **dos veces** y guarda cada resultado por separado — deben ser
**distintos entre sí**:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64url'))"
```

El primero será `JWT_SECRET`, el segundo `REFRESH_TOKEN_SECRET`.

> No reuses los de desarrollo. Con `NODE_ENV=production` el arranque se aborta
> si faltan, si son iguales entre sí o si miden menos de 32 caracteres.

---

## 3. Aplicar las migraciones desde tu máquina

El plan **Free** de Render no permite órdenes previas al despliegue
(`pre-deploy command is not supported for free tier services`), así que las
migraciones no corren solas. Aplícalas tú antes de desplegar — es la misma base
de Supabase, da igual desde dónde se ejecuten:

```bash
cd c:/Users/juanc/Documents/zambon/backend
npm run migrate:deploy
```

`migrate deploy` solo aplica lo pendiente y nunca reescribe el historial. Si no
hay nada pendiente, termina sin hacer cambios.

> Repite este paso cada vez que un cambio incluya una migración nueva, **antes**
> del `git push` que dispara el despliegue.

---

## 4. Crear el servicio

1. Entra a [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint**
2. Conecta el repositorio `Solutionsandpayroll/zambonIncentivos`
3. Render lee el `render.yaml` solo: **no** configures build ni start a mano

---

## 5. Cargar las 4 variables

En el panel del servicio → **Environment** → añade:

| Variable | De dónde sale |
|---|---|
| `DATABASE_URL` | del `.env` local (pooler Supabase, puerto **6543**) |
| `DIRECT_URL` | del `.env` local (sesión, puerto **5432**) |
| `JWT_SECRET` | el primero del paso 2 |
| `REFRESH_TOKEN_SECRET` | el segundo del paso 2 |

**No agregues `PORT`.** Render lo inyecta; fijarlo a mano tumba el despliegue.

`NODE_ENV` y `CORS_ORIGINS` ya vienen en el `render.yaml`.

---

## 6. Desplegar

**Apply** / **Create**. Tarda unos minutos. Cuando el estado sea **Live**, abre
la URL: debe redirigir al login.

Comprobación de salud:
`https://TU-URL.onrender.com/api/v1/health` → `{"status":"ok","uptime":N}`

---

## 7. Entrar y verificar

Entra con el usuario **admin** y su contraseña. Recorre esta lista corta:

| | Qué comprobar |
|---|---|
| ☐ | El login acepta las credenciales y entra al inicio |
| ☐ | **Resultados** muestra las liquidaciones de 2026-01 |
| ☐ | **Reportes** con el filtro *2026 · Ciclo 1* trae filas (no vacío) |
| ☐ | **Admin › Periodos** lista los 3 ciclos y los 12 meses |
| ☐ | Exportar un reporte a XLSX descarga el archivo |

---

## Si algo falla

**`nest: not found` en el build**
El Build Command perdió `--include=dev`. Debe ser exactamente:
```
npm ci --include=dev && npx prisma generate --schema=../prisma/schema.prisma && npm run build
```

**`pre-deploy command is not supported for free tier services`**
El plan Free no admite `preDeployCommand`; el `render.yaml` ya no lo lleva. Las
migraciones van a mano (paso 3). Si vuelve a aparecer, borra esa línea del
`render.yaml`.

**El deploy arranca pero una tabla o columna nueva no existe**
Te saltaste el paso 3. Corre `npm run migrate:deploy` desde `backend/` y
vuelve a desplegar.

**El deploy queda colgado en "in progress" y muere por timeout**
Es el bind del puerto. `main.ts` ya escucha en `0.0.0.0`; verifica que no se
haya revertido y que no exista una variable `PORT` cargada a mano.

**Arranca pero las pantallas dan 404**
Faltan las carpetas del frontend en GitHub (`adminf/`, `calculof/`, `home/`,
`loginf/`, `reportesf/`, `resultsf/`, `shared/`). Vuelve al paso 1.

**El login dice "credenciales inválidas" con la contraseña correcta**
La base apunta a otro sitio. Revisa que `DATABASE_URL` en Render sea la misma
que en tu `.env` local.

---

## Cuatro cosas que debes saber

**1. El plan `free` duerme.** Tras 15 minutos sin uso tarda ~50 s en despertar.
Para uso real de nómina, súbelo a `starter` (panel → *Settings* → *Instance Type*).

**2. Los datos se cargan desde tu máquina, no desde Render.** Los `.xlsx` con
cédulas y salarios están fuera del control de versiones a propósito (Ley 1581
de 2012, y el repositorio es público). Los scripts de importación los leen por
ruta local y escriben en la misma base de Supabase, así que da igual desde
dónde se corran.

**3. Las migraciones ya están al día.** La base fue *baselined* el 31-jul-2026:
`migrate deploy` aplica solo lo pendiente y no reescribe historial. No hace
falta ninguna acción manual.

**4. No hay copias de seguridad automáticas.** El plan Free de Supabase no las
incluye. Antes de cualquier cambio grande, haz un volcado manual:

```bash
pg_dump "$DIRECT_URL" > respaldo-$(date +%F).sql
```

Es la lección de una pérdida real de datos: sin respaldo no hubo forma de
recuperar y todo tuvo que reconstruirse desde los Excel.

---

## Cómo actualizar después

Cada `git push` a `main` dispara un despliegue automático.

```bash
git add -A
git commit -m "Descripción del cambio"
git push
```

Se sigue en el panel de Render → pestaña **Events**. Si algo sale mal, ahí
mismo se puede volver a la versión anterior con **Rollback**.
