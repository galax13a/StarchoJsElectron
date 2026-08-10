# Starcho JS

Starcho JS es una aplicación de notas de escritorio, rápida y local, construida con Electron, Express 5, SQLite y JavaScript vanilla. Permite crear, editar, organizar y consultar notas sin depender de servicios externos.

## Características

- Autenticación local con sesión persistente opcional.
- Crear, editar, eliminar y consultar notas.
- Título, contenido, color y fecha importante para cada nota.
- Base de datos SQLite local con migraciones idempotentes.
- Perfil de usuario y ajustes de aplicación.
- Tema claro y oscuro.
- Interfaz en Español e Inglés.
- Arquitectura modular con el plugin oficial de notas.
- Sin reproductor de YouTube, música, descargas multimedia ni biblioteca de medios.

## Requisitos

- Windows, macOS o Linux.
- Node.js `24.19.0` (recomendado; compatible con `>=24.19.0 <25`).
- npm 11 o una versión compatible.

La versión de Node está indicada en `.nvmrc`.

## Instalación

```bash
npm install
npm run rebuild
```

`better-sqlite3` debe reconstruirse para la versión de Electron instalada. El comando `rebuild` realiza ese proceso automáticamente.

## Ejecutar en desarrollo

```bash
npm start
```

Para iniciar con el entorno de desarrollo explícito:

```bash
npm run dev
```

La aplicación inicia un servidor Express local dentro del proceso principal y después abre la ventana de Electron.

## Crear instaladores

```bash
npm run build
```

Comandos específicos por plataforma:

```bash
npm run build:win
npm run build:mac
```

Los artefactos se generan en `dist/`.

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm start` | Inicia la aplicación Electron |
| `npm run dev` | Inicia Electron en modo desarrollo |
| `npm run rebuild` | Reconstruye dependencias nativas para Electron |
| `npm run build` | Genera el instalador de la plataforma actual |
| `npm run build:win` | Genera el instalador para Windows |
| `npm run build:mac` | Genera el instalador para macOS |

## Estructura del proyecto

```text
main.js                    Proceso principal de Electron
preload.js                 Puente seguro entre Electron y el renderer
src/backend/               Servidor Express, autenticación y SQLite
src/main/                  Ventanas, IPC y entorno de Electron
src/renderer/              Interfaz, login, navegación y ajustes
plugins/notes/             Módulo de notas frontend/backend
assets/                    Iconos y recursos de la aplicación
```

## Datos locales

La base de datos se guarda en:

```text
%APPDATA%/StarchoJS/starcho-js.db
```

Los datos permanecen en el equipo del usuario. El proyecto no incluye `node_modules` ni `dist` en el código fuente publicado; deben generarse localmente con npm.

## Dependencias principales

| Componente | Versión |
| --- | --- |
| Node.js | `24.19.0` |
| Electron | `43.3.0` |
| Express | `5.2.1` |
| better-sqlite3 | `13.0.3` |
| electron-builder | `26.15.3` |

## Licencia

Este proyecto se distribuye bajo la licencia MIT.
