# Auditoría de HVAC PROF

Fecha: 15 de septiembre de 2026. Desarrollado por Estudio Ideamos.

## Estado de entrega

Mejoras publicadas por SSH en puerto 9022 el 15/09/2026. ZIP: `HVAC-PROF-public_html-optimizado.zip`. Backup previo privado conservado fuera de public_html. PHP web actualizado de 7.4 a 8.4.24 y verificado mediante diagnóstico temporal, eliminado después. Escritura privada correcta y permisos de recursos corregidos. Pruebas públicas de páginas, robots, sitemap, llms.txt, redirección, 404 y bloqueos correctas; home mobile/desktop sin errores ni desbordes. Evidencia: `.audit/live-verification.json`.

Actualización 16/09/2026: info@hvacprof.com.ar ya existe como casilla. Se verificó entrega real en su bandeja, sin reenvíos. Se reforzó el antispam con detección de duplicados, límite por correo, validación de origen y límite de enlaces. GitHub Pages fue deshabilitado para evitar duplicar producción.

## Rendimiento medido

Comparación con Chrome local, viewport mobile 390 x 844 y desktop 1366 x 768, caché de contexto nueva, sin desplazamiento y antes del primer avance automático del carrusel. Recursos medidos mediante Resource Timing; bytes corresponden a cuerpos de subrecursos, excluyen el HTML principal y pueden omitir bytes de terceros sin Timing-Allow-Origin. No son resultados de PageSpeed Insights ni datos de visitantes reales; no hay simulación de red 4G o CPU lenta.

| Indicador | Antes | Después |
| --- | ---: | ---: |
| Recursos iniciales home | 23 | 9 |
| Bytes iniciales mobile | 1.439.777 | 153.732 |
| Bytes iniciales desktop | 1.439.777 | 260.098 |
| LCP local mobile, una ejecución | 2,016 s | 1,292 s |
| LCP local desktop, una ejecución | 1,664 s | 0,836 s |
| CLS local mobile | 0 | 0 |
| CLS local desktop | 0,00656 | 0,00048 |

Reducción observada de subrecursos: aproximadamente 89% mobile y 82% desktop. LCP es el tiempo hasta el mayor elemento visible; CLS representa saltos del diseño. Los tiempos son orientativos y varían entre ejecuciones. No se midió INP con tráfico real. El ZIP contiene variantes de imagen para distintas pantallas y por eso ocupa más almacenamiento; cada visitante descarga la variante apropiada.

### Cambios aplicados

- Fuentes WOFF2 locales con font-display swap y licencias, sin conexiones a Google Fonts en producción.
- Variantes WebP responsive, srcset/sizes, dimensiones explícitas y carga diferida fuera del área inicial.
- Hero principal con prioridad alta y preload responsive. Los otros fondos del carrusel se cargan al necesitarlos.
- CSS y JS con nombre derivado del contenido y caché immutable de un año. HTML revalidable, PHP sin almacenamiento de respuesta.
- Reducción de actividad del carrusel en pestañas ocultas, con foco de teclado o preferencia de movimiento reducido.
- Contenido visible aunque JavaScript esté deshabilitado, foco visible, enlace para saltar al contenido y lightbox con foco contenido.
- Exclusión de un JPG inválido sin uso y de recursos no referenciados del paquete público.

## Seguridad

El sitio público ya responde con HTTPS y cabeceras CSP, nosniff, anti-iframe y política de permisos. La respuesta CSS observada tiene compresión Brotli. El servidor devuelve 404 real para una ruta inexistente.

Correcciones locales:

- CSP limitada a recursos locales; JSON-LD autorizado con hashes exactos, sin permitir scripts inline genéricos.
- Reglas para bloquear copias ZIP, archivos privados, claves, herramientas y carpetas internas. Límite de tamaño HTTP y métodos permitidos.
- HSTS limitado al dominio; no fuerza subdominios cuya configuración SSL no se ha comprobado.
- Validación de origen HTTPS, correo y campos, rechazo de inyección de cabeceras, honeypot y límite de intentos.
- Almacenamiento antiabuso acotado y privado fuera del directorio público, con bloqueo de concurrencia y fallo cerrado si no puede escribirse. Ya no crea un archivo por cada IP en un temporal compartido.
- Respuestas PHP no almacenables y sin mostrar errores internos. Timeout del envío en el navegador.
- No hay CMS, framework o dependencias JavaScript de terceros ejecutándose en producción. PHP y el servidor siguen necesitando mantenimiento del hosting.

Pruebas locales con PHP 8.4.25 oficial, descarga comprobada por SHA-256: sintaxis, método inválido, orígenes externo/nulo, petición grande, campos inválidos, inyección de cabeceras, envíos válidos con correo simulado, límite de intentos y almacenamiento indisponible. No se enviaron correos reales. Esto no equivale a una auditoría de infraestructura ni garantiza ausencia absoluta de vulnerabilidades.

## SEO e interpretación por IA

- Títulos descriptivos y específicos, conservando las descripciones existentes.
- Una URL canónica por página; redirección propuesta de `/index.html` a `/`; enlaces internos a la home normalizados.
- Sitemap con las 13 URL públicas, sin fechas de modificación inventadas.
- Robots permite rastrear contenido y recursos; excluye formulario y 404. No se agregó un bloqueo de buscadores de IA ni se modificaron preferencias de entrenamiento específicas.
- Datos estructurados consistentes: empresa, sitio, páginas, jerarquía y servicios. Datos de contacto tomados del contenido existente; no se inventaron valoraciones ni certificaciones.
- `llms.txt` resume la empresa, sus contactos y las páginas oficiales. Es un complemento de navegación, no un mecanismo de ranking ni una garantía de uso por un proveedor.
- HTML legible sin ejecución de JavaScript, un h1 por página, textos alternativos y páginas de detalle enlazadas.
- La 404 usa rutas de recursos absolutas, para funcionar también desde rutas inexistentes anidadas.

Validación: 14 páginas en navegador mobile, sin errores de carga/JavaScript/CSP detectados ni desbordes; JSON-LD parseable; lightbox probado; home sin JavaScript visible. Falta validación externa de resultados enriquecidos e indexación tras publicar.

## Pendientes priorizados

### P0: publicación y operación

1. COMPLETADO: SSH operativo, despliegue y copia de recuperación privada. El repositorio antiguo de cPanel sigue sin sincronizar; no desplegar desde él.
2. COMPLETADO: versión optimizada publicada, .htaccess y recursos nuevos comprobados, home desktop/mobile validada y ZIP antiguo retirado del directorio público.
3. COMPLETADO para PHP: versión web 8.4.24, función mail disponible y sintaxis del formulario correcta. Los parches generales de infraestructura siguen siendo responsabilidad del proveedor.
4. COMPLETADO: entrega real directa a info@hvacprof.com.ar y permisos privados verificados. Pendiente separado: revisar políticas SPF/DKIM/DMARC para correo saliente externo; la prueba de entrega local no valida reputación externa.
5. Confirmar backups periódicos y una restauración probada, renovación de SSL, MFA de cPanel/GitHub, acceso SSH restringido y permisos. WAF y alertas antiabuso dependen del hosting; no se inspeccionaron desde esta sesión.

### P1: indexación, posicionamiento y medición

6. Verificar propiedad de dominio en Google Search Console mediante DNS y Bing Webmaster Tools. Revisar si ya existen antes de crear duplicados; enviar sitemap y solicitar revisión de páginas principales.
7. Revisar indexación, robots efectivo, canonical elegido por Google, redirecciones anteriores y enlaces entrantes. La migración incluye las rutas principales conocidas; comparar con un inventario de URL antiguas de Search Console/logs para no perder otras.
8. COMPLETADO: GitHub Pages retirado el 16/09/2026. Revisar otros staging si se crean en el futuro.
9. Medir PageSpeed Insights mobile/desktop y Core Web Vitals reales una vez publicado: LCP, CLS e INP. Objetivos habituales: LCP <= 2,5 s, CLS <= 0,1 e INP <= 200 ms en el percentil 75. Si no hay suficiente tráfico, complementar con pruebas de laboratorio.
10. Definir medición de consultas: envíos válidos, clics en WhatsApp y llamadas. Revisar cuentas de Analytics existentes y requisitos de privacidad antes de agregar scripts de seguimiento. No se instalaron herramientas de rastreo nuevas.
11. Revisar/verificar Google Business Profile si el negocio es elegible; confirmar nombre comercial, dirección o área de servicio, horarios, teléfono y categorías. No inventar dirección pública si no recibe clientes allí.

### P2: contenido y autoridad

12. Confirmar zonas atendidas, materiales, espesores, capacidades, plazos y certificaciones con Andrés. Publicar fichas técnicas útiles y responder consultas reales de compradores; evitar afirmaciones absolutas no respaldadas sobre fugas, ahorro o cumplimiento.
13. Documentar proyectos reales: sector, necesidad, solución, ubicación autorizada, fotos propias y resultados verificables. Revisar permisos de logos de clientes e identificar imágenes ilustrativas que no sean fotos de obras ejecutadas.
14. Completar información comercial verificable: razón social si corresponde, ubicación, horarios, responsables técnicos y política de privacidad del formulario. Requiere datos y aprobación del cliente; no se fabricó información legal.
15. Investigar consultas y competencia con datos de Search Console antes de expandir páginas; priorizar demanda concreta y páginas diferentes, evitando contenido repetido por localidad o keyword stuffing.
16. Conseguir referencias legítimas de proveedores, clientes, cámaras o directorios sectoriales y reseñas auténticas. No comprar enlaces ni generar testimonios.
17. Evaluar CDN solamente si mediciones desde las zonas atendidas muestran latencia alta. Brotli ya está activo en la muestra pública; no hace falta agregar otra capa por defecto. Revisar caché, HTTP/2/3 y compresión con el proveedor tras desplegar.
18. Mantener una revisión mensual de errores, seguridad, formularios, enlaces y rendimiento, y una revisión de contenido según cambios reales. IndexNow es una mejora opcional para Bing si la frecuencia de cambios lo justifica.

## Fuentes técnicas

- Google, optimización para funciones de IA: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google, Core Web Vitals: https://developers.google.com/search/docs/appearance/core-web-vitals
- OpenAI, crawlers y controles: https://developers.openai.com/api/docs/bots
- PHP, versiones con soporte: https://www.php.net/supported-versions.php
- cPanel, despliegue Git: https://docs.cpanel.net/knowledge-base/web-services/guide-to-git-set-up-deployment/

No se garantiza posición en Google ni citación por IA. Las mejoras técnicas habilitan mejores condiciones de rastreo y experiencia; la relevancia, evidencia, autoridad y competencia determinan los resultados junto con otros factores.
