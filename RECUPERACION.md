# Recuperación de la base de datos

**Situación (31-jul-2026):** la base de Supabase quedó **completamente vacía**
(0 en todas las tablas, incluida `admin_audit_log`). El esquema y las
migraciones están intactos: lo que falta son los DATOS.

Antes de esto había 52 empleados, 53 usuarios, 10 equipos, la curva de 31
escalones y **490 liquidaciones** calculadas ($25.225.451 en 2026-01).

---

## Opción A — Restaurar el backup de Supabase (preferible)

Es lo único que recupera **todo**, incluido lo que ningún script puede
reconstruir (ver "Lo que el reseed NO recupera").

1. [dashboard.supabase.com](https://dashboard.supabase.com) → proyecto
   `yuswnhucfivuevqiyklf`
2. **Database → Backups**
3. Buscar el punto de restauración más reciente ANTES del vaciado
4. Restaurar

> La restauración **reemplaza la base entera**. Si ya se reseedeó, ese trabajo
> se pierde. Por eso el backup va primero.

Si el plan del proyecto es Free, puede que no haya backups automáticos: en ese
caso la única vía es la Opción B.

---

## Opción B — Reseed desde los Excel

Los cinco `.xlsx` de la raíz están intactos y son la fuente de verdad.
Todos los scripts son **idempotentes**: se pueden repetir sin duplicar.

Correr desde `backend/`, en este orden (cada paso depende del anterior):

```bash
# 1. Roles + usuario admin  (guarda la contraseña que imprime)
ADMIN_PASSWORD='<contraseña-fuerte>' npm run seed:roles

# 2. Empleados desde baseempleados.xlsx + salariosbases.xlsx
npm run import:employees

# 3. Equipos y cargos al organigrama oficial (primero simula, luego aplica)
npm run align:structure
npm run align:structure -- --apply

# 4. Calendario del año: 3 ciclos + 12 meses enlazados
npm run seed:periods -- --year=2026

# 5. Curva de pago (31 escalones) en el ciclo
npm run seed:curve -- --year=2026 --month=1

# 6. Usuarios de los empleados (primero simula, luego aplica)
npm run create:users
TEMP_PASSWORD='<temporal>' npm run create:users -- --apply

# 7. Parámetros y ventas de VM-GD
npm run seed:weights:vm-gd  -- --year=2026 --month=1
npm run seed:targets:vm-gd  -- --year=2026 --month=1
npm run seed:sales:vm-gd    -- --year=2026 --month=1

# 8. Directores, cadenas/garantizados, Pablo-Xadago, jerarquía
npm run seed:directors
npm run seed:chains-guaranteed
npm run seed:pablo
npm run seed:hierarchy

# 9. Ajustes finales
npm run fix:assignment-dates
npm run mark:monthly-20                              # equipos que cobran el 20% mensual
npm run promote:params -- --year=2026 --month=1      # sube los parámetros del mes al ciclo

# 10. Verificar
npm run check:db
```

Después, para rehacer la liquidación de 2026-01: entrar a **Cálculo** y correr
el asistente (cargar ventas → validar → importar → KPI 20% → calcular).

---

## Lo que el reseed NO recupera

Conviene tenerlo claro antes de descartar el backup:

1. **Las 490 liquidaciones ya calculadas.** Se rehacen corriendo el cálculo,
   pero se pierde el historial de versiones (v1, v2… de cada empleado).
2. **Las contraseñas que cada usuario ya se había cambiado.** Todos vuelven a
   la temporal del lote.
3. **Los pesos y cuotas cargados A MANO por pantalla.** Los scripts solo cubren
   VM-GD; los 4 equipos que faltaban (Rep VM E+X, GD, Commercial Director,
   Sell-Out Director) se habían empezado a cargar desde la interfaz.
4. **La jerarquía**, si se había cargado por pantalla y no desde
   `jerarquias.xlsx`.
5. **El log de auditoría** (`admin_audit_log`): quién hizo qué y cuándo.
6. **Las marcas del KPI del 20%**, si llegaron a cargarse.

---

## Prevención

Cuando la base vuelva a tener datos, vale la pena:

- Confirmar que los **backups automáticos** de Supabase estén activos (y su
  frecuencia). Es lo que hoy habría resuelto esto en dos minutos.
- Antes de cualquier operación de esquema, un volcado manual:
  ```bash
  pg_dump "$DIRECT_URL" > respaldo-$(date +%F).sql
  ```
