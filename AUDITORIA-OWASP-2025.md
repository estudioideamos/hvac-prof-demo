# Revision OWASP Top 10:2025

Fecha: 29/09/2026. HVAC PROF. Desarrollado por Estudio Ideamos.

Revision acotada de codigo, dependencias, configuracion del sitio y pruebas
funcionales. No es certificacion, pentest completo ni garantia de ausencia de fallos.

## Incidente prioritario: DNS

Los resolutores 1.1.1.1 y 8.8.8.8 devuelven SERVFAIL para hvacprof.com.ar.
La evidencia incluye No Reachable Authority y respuestas REFUSED desde
200.58.116.147 y 200.58.116.130. El problema se reproduce desde el equipo local
y el hosting. No se modificaron zonas ni delegaciones para intentar adivinar la causa.

El origen 167.250.5.104 responde HTTPS 200 usando el nombre correcto y validacion
normal del certificado. Esto NO significa disponibilidad publica normal:
resolver el DNS es prioritario para web y correo. Solicitar al proveedor que
revise zona autoritativa, delegacion, estado del servicio y consistencia de NS.

## Matriz de riesgos

| Categoria | Aplicacion al sitio y resultado |
| --- | --- |
| A01 Control de acceso | Sin panel, usuarios o datos privados publicados. Bloqueo de dotfiles, repositorios, backups y scripts PHP distintos del formulario. Permisos privados 700/600 comprobados. |
| A02 Configuracion | HTTPS, CSP, HSTS, noindex de endpoint, no listados, errores ocultos. Bloqueo ampliado de copias, claves y archivos de desarrollo. MFA y configuracion global del host no auditados. |
| A03 Cadena de suministro | npm audit sin vulnerabilidades conocidas; Sharp actualizado a 0.35.5. Lockfile, Dependabot, checkout por SHA y permisos de lectura en CI. Ningun paquete npm ejecutado en produccion. |
| A04 Criptografia | HTTPS validado al origen. Datos antiabuso fuera de public_html; IP/correo como hashes, no como cifrado anonimizado. No se invento garantia de privacidad absoluta. |
| A05 Inyeccion | Sin SQL ni comandos construidos con entradas. Correo fijo; Reply-To validado; limites de longitud, UTF-8, tipos, enlaces y adjuntos. No se refleja HTML del visitante. |
| A06 Diseno inseguro | Limites de envio y de solicitudes invalidas independientes, duplicados y honeypot. El tiempo de llenado es una heuristica, no una prueba de humanidad. No existe proteccion DDoS a nivel red implementada por la aplicacion. |
| A07 Autenticacion | No hay login en la web. GitHub/cPanel/SSH quedan bajo controles de sus proveedores; MFA y revisiones de acceso requieren verificacion del administrador. |
| A08 Integridad | Rama protegida, PR y pruebas obligatorias, dependencias fijadas. Normalizacion LF para hashes reproducibles Windows/Linux. SSH separado de GitHub Actions. |
| A09 Registros y alertas | Fallos operativos registrados con codigos sin mensajes del cliente. No se activo un servicio de alertas externas ni se verifico rotacion de logs del hosting. |
| A10 Excepciones | Respuestas genericas ante fallos, almacenamiento corrupto/grande/inaccesible, bloqueo no bloqueante y chequeos de escritura. No se afirma envio exitoso cuando mail falla o el formulario se completa demasiado rapido. |

## Cambios y pruebas

- Presupuesto de solicitudes: 20 por IP y 200 globales por minuto, antes de validar campos.
- Envios: 5 por IP, 3 por correo, 60 globales por 15 minutos; duplicados rechazados.
- No se incorporaron CAPTCHA, rastreadores ni intermediarios de correo.
- El destino sigue siendo info@hvacprof.com.ar. La entrega real fue verificada el
  16/09; esta revision no la da por verificada de nuevo durante el incidente DNS.
- Pruebas locales aisladas cubren entradas invalidas, intentos rapidos, adjuntos,
  limites, duplicados, almacenamiento defectuoso y excepciones de correo. El correo
  de estas pruebas es simulado; no se bombardeo la casilla del cliente.
- La revision no envio ataques de carga a produccion.

## Rendimiento

Linea base local Chrome: 9 subrecursos iniciales, 160272 bytes en mobile y
266638 bytes en desktop, sin overflow ni errores JS observados. No incluye HTML,
no simula una red movil y no representa datos de usuarios reales. LCP mobile no
obtenido en esta muestra; no se informa como cero ni como resultado favorable.
El origen entrega JS con Brotli y cache immutable; HTML revalida. Se conservaron
imagenes responsive WebP, fuentes locales y carga diferida, sin agregar librerias
de frontend. No hay un nuevo puntaje Lighthouse ni verificacion de INP real.

## Pendiente del proveedor/administrador

1. Resolver SERVFAIL/REFUSED en DNS y luego repetir disponibilidad y correo reales.
2. Aplicar PHP 8.4.26 o parche posterior compatible. La instalacion disponible
   ea-php84 reporta 8.4.25; la rama sigue soportada, pero falta el ultimo parche.
3. Verificar MFA, acceso minimo, restauracion de backup, renovacion TLS, rotacion
   y alertas de logs, proteccion de red y SPF/DKIM/DMARC. No estan certificados.
4. Tras recuperar DNS, medir PageSpeed/CWV y revisar Search Console/Bing.

## Referencias

- https://top10.owasp.org/2025/
- https://top10.owasp.org/2025/A10_2025-Mishandling_of_Exceptional_Conditions/
- https://top10.owasp.org/2025/A09_2025-Security_Logging_and_Alerting_Failures/
- https://www.php.net/supported-versions.php
- https://www.php.net/releases/8_4_26.php
