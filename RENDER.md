# Subir a Render

Guía corta. ~10 minutos.

El backend sirve la API **y** las 19 pantallas desde un mismo servicio: se
despliega **un solo servicio**, no dos.

---

## 1. Generar los dos secretos

Corre esto **dos veces** y guarda cada resultado por separado — deben ser
**distintos entre sí**:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64url'))"
```

El primero es `JWT_SECRET`, el segundo `REFRESH_TOKEN_SECRET`.

> No reuses los de desarrollo. Con `NODE_ENV=production` el arranque se
> aborta si faltan.

---

## 2. Crear el servicio

1. Entra a [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint**
2. Conecta el repo `Solutionsandpayroll/zambonIncentivos`
3. Render lee el `render.yaml` solo: no configures build ni start a mano

---

## 3. Cargar las 4 variables

En el panel del servicio → **Environment** → añade:

| Variable | De dónde sale |
|---|---|
| `DATABASE_URL` | del `.env` local (pooler Supabase, puerto **6543**) |
| `DIRECT_URL` | del `.env` local (sesión, puerto **5432**) |
| `JWT_SECRET` | el primero del paso 1 |
| `REFRESH_TOKEN_SECRET` | el segundo del paso 1 |

**No agregues `PORT`.** Render lo inyecta; fijarlo a mano tumba el despliegue.

`NODE_ENV` y `CORS_ORIGINS` ya vienen en el `render.yaml`.

---

## 4. Desplegar

**Apply** / **Create**. Tarda unos minutos. Cuando el estado sea **Live**, abre
la URL: debe redirigir al login.

Para comprobar que está sano: `https://TU-URL.onrender.com/api/v1/health`
→ `{"status":"ok","uptime":N}`

---

## Si algo falla

**`nest: not found` en el build**
El Build Command perdió `--include=dev`. Debe ser exactamente:
```
npm ci --include=dev && npx prisma generate --schema=../prisma/schema.prisma && npm run build
```

**`P1000: Authentication failed` en el preDeploy**
Las migraciones no pasan por el pooler de Supabase. Quita el
`preDeployCommand` del `render.yaml` y corre desde tu máquina:
```bash
cd backend
npm run migrate:deploy
```
Es la misma base de datos, así que da igual desde dónde se apliquen.

**El deploy queda colgado en "in progress" y muere por timeout**
Es el bind del puerto. `main.ts` ya escucha en `0.0.0.0`; verifica que no se
haya revertido y que no exista una variable `PORT` cargada a mano.

**Arranca pero las pantallas dan 404**
Faltan las carpetas del frontend (`adminf/`, `calculof/`, `home/`, `loginf/`,
`reportesf/`, `resultsf/`, `shared/`). El backend las sirve como estáticos.

---

## Dos cosas que debes saber

**El plan `free` duerme** tras 15 minutos sin uso y tarda ~50 s en despertar.
Para uso real de nómina, súbelo a `starter`.

**Los datos se cargan desde tu máquina, no desde Render.** Los `.xlsx` con
cédulas y salarios de los 52 empleados están en `.gitignore` a propósito (Ley
1581 de 2012). Los scripts de importación los leen por ruta local y apuntan a
la misma base de Supabase.
