# Seguridad

Si encuentras una vulnerabilidad en Starcho JS, no la publiques primero en un issue.

- Abre un reporte privado en GitHub usando la pestaña **Security** del repositorio.
- Incluye la versión afectada, pasos reproducibles, impacto y una posible mitigación.
- No adjuntes contraseñas, tokens, bases de datos personales ni archivos `.env`.

Las dependencias de producción se revisan con `npm audit --omit=dev --audit-level=high` en cada ejecución de CI. Las actualizaciones automáticas de npm se proponen semanalmente mediante Dependabot.

Las sesiones bearer no se almacenan en texto plano dentro de SQLite: la base de datos conserva únicamente su hash SHA-256. En el renderer, la sesión persistente usa `safeStorage` de Electron; si el almacén seguro del sistema no está disponible, no se guarda el token para el siguiente inicio.

El login y el registro tienen limitación de intentos por IP durante 15 minutos. Si cambias credenciales o detectas sesiones antiguas después de actualizar, vuelve a iniciar sesión: las sesiones creadas por versiones anteriores pueden quedar invalidadas por la migración de seguridad.
