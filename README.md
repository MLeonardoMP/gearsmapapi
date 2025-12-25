# Gearsmap API

API REST construida con [Hono](https://hono.dev/) y desplegada en [Vercel](https://vercel.com/). Utiliza [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) como base de datos.

## Estructura del Proyecto

- `src/index.ts`: Punto de entrada de la aplicación y configuración de Hono.
- `src/db/client.ts`: Configuración del cliente de base de datos (Vercel Postgres).
- `src/routes/`: Definición de los endpoints de la API.

## Endpoints Principales

La API tiene su base en `/api`. Algunos de los endpoints disponibles son:

- `/api/datos-acggp`: Datos generales de ACGGP.
- `/api/departamentos`: Información de departamentos.
- `/api/municipios`: Información de municipios.
- `/api/estadisticas-departamentales`: Estadísticas por departamento.
- `/api/produccion`: Datos de producción.
- `/api/health`: Check de salud de la API.

## Desarrollo

### Requisitos

- Node.js
- pnpm (recomendado)
- Vercel CLI

### Instalación

```bash
pnpm install
```

### Ejecución en local

```bash
pnpm dev
```

Esto iniciará el entorno de desarrollo de Vercel, que emula las funciones Edge y la conexión a la base de datos si está configurada.

## Despliegue

El despliegue se realiza automáticamente a través de Vercel al hacer push a la rama principal, o manualmente con:

```bash
pnpm deploy
```
