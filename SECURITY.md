# Seguridad

Desarrollado por Estudio Ideamos. Solo se mantiene la version actual en main.

Reportar vulnerabilidades mediante la opcion privada "Report a vulnerability"
de GitHub. No publicar credenciales, correos de clientes ni detalles explotables
en issues publicos. No realizar pruebas de carga o spam contra produccion.

Los cambios pasan validaciones de paquete, enlaces, datos estructurados y
formulario. Las dependencias son solo herramientas de desarrollo; el sitio
no ejecuta Node.js ni paquetes npm en produccion. No existe despliegue automatico
desde GitHub: cada publicacion requiere backup, revision y verificacion posterior.

El hosting mantiene PHP, TLS, servidor y correo. Mantener MFA en GitHub y cPanel,
claves SSH individuales y copias privadas recuperables. Ningun control garantiza
ausencia absoluta de vulnerabilidades o spam.
