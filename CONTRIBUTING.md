# Mantenimiento

Desarrollado por Estudio Ideamos para HVAC PROF.

Usar Node.js 22 o superior y PHP compatible. Ejecutar `npm ci`, `npm run build`
y `npm test`. Para pruebas aisladas del formulario establecer PHP_BINARY al
ejecutable PHP y ejecutar `npm run test:contact`; estas pruebas no envian correo.

Editar HTML, styles.css y script.js, no los recursos con hash. Abrir una rama
y un pull request; no subir .env, claves, archivos de clientes, backups o ZIP.
Mantener accesibilidad, diseno responsive y atribuciones de recursos de terceros.

El paquete ZIP es el unico contenido apto para public_html, nunca todo el repo.
Preservar el handler PHP de cPanel y los recursos versionados anteriores durante
la transicion de caches. Verificar entrega directa a info@hvacprof.com.ar tras
cambios al correo. GitHub Pages no es el hosting de produccion.
