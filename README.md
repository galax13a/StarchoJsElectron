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
- Copias de seguridad SQLite desde Settings.
- Mensajes de la aplicación centralizados para Español e Inglés, incluyendo notas, dashboard, perfil, logout y bloqueo.
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

## Pruebas y auditoría

```bash
npm run check
npm test
npm audit --omit=dev --audit-level=high
```

`npm run check` valida la sintaxis de todos los archivos JavaScript del proyecto. Las pruebas usan bases de datos temporales y cubren el hash de contraseñas, sesiones bearer, aislamiento de notas por usuario, perfil, avatar, preferencias, cabeceras de seguridad y operaciones CRUD. No se utiliza la base de datos personal del usuario durante `npm test`.

Para ejecutar la misma validación que CI:

```bash
npm run ci
```

GitHub Actions ejecuta automáticamente sintaxis, pruebas y auditoría en cada push o pull request. CodeQL analiza el código JavaScript y Dependabot revisa semanalmente las dependencias npm.

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
npm run build:linux
npm run build:mac
```

Los artefactos se generan en `dist/`. Los builds locales se generan sin firma para permitir pruebas; Windows mostrará la advertencia de editor desconocido hasta configurar un certificado de firma.

El build local de macOS requiere macOS para producir un artefacto confiable. Para generar los tres sistemas automáticamente, crea una etiqueta `v*` en GitHub; el workflow de release usa runners nativos de Windows, Ubuntu y macOS. Los instaladores generados sin certificados son aptos para pruebas, pero para distribución pública deben firmarse y, en macOS, notarizarse.

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm start` | Inicia la aplicación Electron |
| `npm run dev` | Inicia Electron en modo desarrollo |
| `npm run check` | Valida la sintaxis JavaScript |
| `npm run ci` | Ejecuta validaciones, pruebas y auditoría |
| `npm run rebuild` | Reconstruye dependencias nativas para Electron |
| `npm run build` | Genera el instalador de la plataforma actual |
| `npm run build:win` | Genera el instalador para Windows |
| `npm run build:linux` | Genera AppImage y DEB para Linux |
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

Desde **Settings → Datos y respaldo** puedes crear una copia SQLite mediante el diálogo nativo de Electron. Guarda el archivo en un lugar seguro y no lo publiques: contiene tus notas, preferencias y datos de usuario.

Los datos permanecen en el equipo del usuario. El proyecto no incluye `node_modules` ni `dist` en el código fuente publicado; deben generarse localmente con npm.

Para el panel administrativo, define `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `.env`. En producción no se aceptan credenciales administrativas implícitas.

La ventana Electron usa aislamiento de contexto, integración Node deshabilitada, sandbox, CSP, navegación limitada y un preload con una API IPC explícita. Las sesiones se guardan cifradas con `safeStorage` cuando el almacén seguro del sistema está disponible.

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
