# Documentación — Sistema de Incentivos Zambon

Índice de toda la documentación de diseño, proyecto y configuración.

## Estructura

```
docs/
├── PROJECT.md              Visión general y reglas de negocio del sistema
├── diseno/                 Diseño del sistema
│   ├── ARQUITECTURA.md         Arquitectura general
│   ├── diseno-relacional.md    Modelo de base de datos (base del schema.prisma)
│   ├── diseno-modulos-backend.md   Módulos y esqueleto del backend NestJS
│   └── diseno-frontend.md      Diseño de la interfaz (dark glassmorphic / lime)
├── backend/                Especificación funcional del backend
│   ├── USECASES.md             Procesos paso a paso (parámetros, carga, cálculo)
│   └── API.md                  Contrato de endpoints REST
└── setup/                  Guías de configuración
    └── SETUP-SUPABASE.md       Crear la BD en Supabase + Prisma
```

## Orden de lectura recomendado

1. **[PROJECT.md](PROJECT.md)** — qué es el sistema y las reglas del negocio (80% / 20%, ciclos, excepciones).
2. **[diseno/ARQUITECTURA.md](diseno/ARQUITECTURA.md)** — cómo se estructura la solución.
3. **[diseno/diseno-relacional.md](diseno/diseno-relacional.md)** — el modelo de datos; se implementó en [`../prisma/schema.prisma`](../prisma/schema.prisma).
4. **[diseno/diseno-modulos-backend.md](diseno/diseno-modulos-backend.md)** — módulos del backend.
5. **[backend/USECASES.md](backend/USECASES.md)** — los procesos, paso a paso y en orden.
6. **[backend/API.md](backend/API.md)** — los endpoints que implementan esos procesos.
7. **[diseno/diseno-frontend.md](diseno/diseno-frontend.md)** — la interfaz.
8. **[setup/SETUP-SUPABASE.md](setup/SETUP-SUPABASE.md)** — poner la base de datos en marcha.

## Notas

- Los archivos `DESIGN.md` dentro de `adminf/`, `loginf/`, `calculof/`, etc. pertenecen a cada módulo de frontend y **no** forman parte de esta carpeta.
- El `schema.prisma` vive en [`../prisma/`](../prisma/), no aquí, porque es código ejecutable (fuente de las migraciones), no documentación.
