# Changelog — Starcho JS

## Próxima versión

- Mensajería activa revisada para mantener Español/Inglés en dashboard, notas, perfil, logout y bloqueo.
- Copias de seguridad SQLite desde Settings mediante IPC seguro.
- Suite de calidad ampliada para autenticación, perfil, avatar, preferencias y seguridad HTTP.
- Comando portable `npm run check` para validar la sintaxis JavaScript.
- Pipeline CI con pruebas, auditoría npm, CodeQL y Dependabot.
- Recuperación del PIN olvidado mediante la contraseña de la cuenta, con textos en Español/Inglés.
- El lock queda opt-in: solo aparece al pulsar el icono de bloqueo; reiniciar no bloquea el dashboard.
- Login y registro con timeout, mensajes localizados y recuperación segura ante errores de arranque.
- El login permanece visible hasta que el dashboard termina de renderizarse correctamente.
- Dashboard con render inmediato, carga tolerante a API lenta y protección contra renders obsoletos.
- ESLint, Prettier, Husky, rate limiting, hash de sesiones y builds multiplataforma automatizados.

## 2.0.0 — 2026-08-10

- Renombrado del producto a Starcho JS.
- Migración a Electron 43.3.0 y Node.js 24.19.0.
- Actualización a Express 5.2.1 y dependencias compatibles.
- Eliminación de reproductor, YouTube, descargas y módulos ajenos a notas.
- Dashboard y configuración adaptados a la aplicación de notas.
