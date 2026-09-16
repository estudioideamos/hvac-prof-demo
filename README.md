# HVAC PROF

[![Validaciones](https://github.com/estudioideamos/hvac-prof-demo/actions/workflows/validate.yml/badge.svg)](https://github.com/estudioideamos/hvac-prof-demo/actions/workflows/validate.yml)

Sitio institucional de https://hvacprof.com.ar/, desarrollado por [Estudio Ideamos](https://ideamos.com.ar/).

## Plataforma

13 páginas HTML, una página 404, CSS y JavaScript propios. El formulario usa PHP en cPanel. El sitio no necesita WordPress, base de datos, Node.js ni paquetes de terceros en producción. GitHub Pages fue el entorno de demo y no puede ejecutar el formulario PHP.

## Edición y entrega

- Editar HTML, `styles.css` y `script.js` como fuentes.
- Ejecutar `node tools/package.mjs` después de editar. Genera CSS/JS con hash, actualiza sus referencias, recalcula los hashes de JSON-LD para CSP y produce `HVAC-PROF-public_html-optimizado.zip`.
- El ZIP incluye únicamente los archivos públicos necesarios. Excluye herramientas, registros, copias, Git y el runtime de pruebas.
- Subir y extraer su contenido directamente en `public_html`, incluyendo `.htaccess`.
- Publicar recursos nuevos antes del HTML para evitar referencias inexistentes. Conservar brevemente los recursos versionados anteriores para visitantes con HTML en caché.
- Publicado el 15/09/2026 mediante SSH (puerto 9022). PHP web 8.4.24 verificado; conservar el bloque PHP 8.4 generado por cPanel en `.htaccess` al actualizar.
- Backup previo privado: `/home3/hvacprofcom/.hvac-deploy/backups/before-optimized-20260915-01.tar.gz`. Recursos públicos con permisos 644 y directorios de recursos 755; almacenamiento privado 700.
- Verificación pública: páginas y recursos SEO accesibles, redirección de index y 404 correctas; home mobile/desktop sin errores ni desbordes. Evidencia en `.audit/live-verification.json`.
- Correo verificado el 16/09/2026: entrega directa a la casilla `info@hvacprof.com.ar`, sin reenvíos ni servicios intermediarios. Se comprobó la recepción real de una consulta de prueba en su bandeja.

Instalar herramientas con `npm ci` (Node.js 22 o superior). Ejecutar `npm run build` y `npm test`. JSZip, Sharp y Playwright son dependencias de desarrollo fijadas en package-lock.json y no forman parte de la web publicada. `HVAC_NODE_MODULES` permite otra carpeta de paquetes y `HVAC_CHROME` otro ejecutable de Chrome; por defecto Playwright usa su navegador instalado con `npx playwright install chromium`.

## GitHub

About apunta al dominio definitivo. GitHub Pages está deshabilitado para evitar duplicados. Actions comprueba sintaxis, paquete, enlaces, datos estructurados, antispam y vulnerabilidades conocidas de dependencias. Dependabot propone actualizaciones semanales. Las automatizaciones tienen permisos de lectura y no reciben claves del hosting. Consultar CONTRIBUTING.md y SECURITY.md. No hay despliegue automático a producción.

## Verificación

- `node tools/audit.mjs after`: navegador desktop/mobile, páginas, recursos, datos estructurados, política CSP, lightbox y contenido sin JavaScript. Guarda evidencias en `.audit/`.
- `node tools/test-contact.mjs`: validaciones y controles antiabuso con PHP local en `.audit/php/php.exe`. El correo se simula exclusivamente en una copia aislada. No se envían mensajes reales.
- `tools/optimize.mjs` documenta la migración inicial de fuentes y recursos. No volver a ejecutarlo sobre las páginas ya migradas.
- Consultar `AUDITORIA-PERFORMANCE-SEO.md` para resultados y pendientes.

## Hosting

- Utilizar una rama PHP con soporte vigente; las pruebas se realizaron con PHP 8.4.25 oficial.
- El usuario PHP debe poder crear `/home3/hvacprofcom/.hvacprof-private` (fuera de `public_html`) o el administrador debe crearla con propietario correcto y permisos 700. Archivo de control con permisos 600.
- El formulario falla de forma controlada si no puede guardar el límite. Cada 15 minutos: hasta 5 envíos por IP, 3 por correo y 60 globales; rechaza duplicados, más de dos enlaces y orígenes ausentes o externos. Conserva honeypot y validación de campos. Los identificadores de correo e IP se almacenan como hashes, no el mensaje.
- Verificar la recepción real en `info@hvacprof.com.ar` y SPF/DKIM/DMARC. Que `mail()` acepte un mensaje no prueba su entrega.
- Revisar HTTPS, redirecciones, compresión, caché, 404 y recursos tras cada despliegue. La configuración Apache se valida finalmente en el hosting.
- Guardar backups fuera del directorio público. No subir archivos ZIP, claves privadas, `.env`, herramientas ni carpetas de Git como contenido navegable.

## SEO y contenido

Canonical en dominio definitivo; sitemap sin fechas especulativas; títulos por página; Organization, WebSite, WebPage, BreadcrumbList y Service en JSON-LD; `llms.txt` con datos de la empresa y enlaces oficiales. Las páginas y sus datos estructurados deben actualizarse juntos. No agregar valoraciones, certificaciones, direcciones ni resultados de proyectos sin evidencia.

El marcado estructurado y `llms.txt` facilitan la interpretación; no garantizan indexación, ranking o menciones por IA. La demo debe retirarse o marcarse noindex desde su propio despliegue para evitar duplicados.

Las fuentes Barlow Condensed y Plus Jakarta Sans se sirven localmente como WOFF2. Sus licencias OFL están en `assets/fonts/`. Hay fotos y esquemas originales, además de imágenes ilustrativas generadas durante el diseño. Confirmar su uso comercial y evitar presentar ilustraciones como proyectos documentados.
