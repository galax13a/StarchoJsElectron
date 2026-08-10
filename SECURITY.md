# Seguridad

Si encuentras una vulnerabilidad en Starcho JS, no la publiques primero en un issue.

- Abre un reporte privado en GitHub usando la pestaña **Security** del repositorio.
- Incluye la versión afectada, pasos reproducibles, impacto y una posible mitigación.
- No adjuntes contraseñas, tokens, bases de datos personales ni archivos `.env`.

Las dependencias de producción se revisan con `npm audit --omit=dev --audit-level=high` en cada ejecución de CI. Las actualizaciones automáticas de npm se proponen semanalmente mediante Dependabot.
