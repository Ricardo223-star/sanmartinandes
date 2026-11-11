# San Martín de los Andes

Aplicación turística en español. Versión 1.0.0, implementada el 8 de noviembre de 2026.

## Abrir en la computadora

Requiere Node.js 24 o posterior. En esta carpeta:

```sh
npm ci
npm start
```

Abrir http://localhost:4173. La aplicación no tiene registro ni contraseña. Para probar desde un iPhone en la misma red Wi-Fi, abrir `http://IP-DE-LA-MAC:4173` con el servidor encendido y permitir conexiones entrantes si macOS lo solicita. `localhost` en el iPhone no apunta a la Mac.

## Publicar

Se incluye frontend HTML/CSS/JavaScript y backend JavaScript. **No alcanza con subir public/ a GitHub Pages**: clima, noticias, vuelos y caminos utilizan las rutas `/api/` del servidor. No se emplean proxies públicos ni claves privadas en el navegador.

Opciones:

1. Un alojamiento con Node.js 24: instalar con `npm ci --omit=dev`, iniciar con `npm start`, configurar `PORT` si el proveedor lo requiere y servir con HTTPS.
2. Cloudflare Workers: ejecutar `npm ci`, `npm run build` y, desde una cuenta propia, `npx wrangler deploy`. El archivo `wrangler.jsonc` apunta al Worker completo. Revisar límites del plan, especialmente lectura de PDF. No se contrató ningún plan de pago. Este flujo de publicación en una cuenta Cloudflare del usuario no fue ejecutado.
3. Sites: el proyecto ya tiene su identidad en `.openai/hosting.json`; conservarla al continuar. La vista de Sites utiliza acceso privado del propietario salvo que se cambie expresamente la audiencia. Esa protección pertenece al alojamiento, no es un registro implementado en la app.

## Agregar al inicio del iPhone

Abrir la dirección HTTPS publicada en Safari → botón Compartir → **Agregar a pantalla de inicio** → **Agregar**. Se incluyen iconos PNG para Apple y manifiesto. La app necesita conexión para consultar datos actuales. No se implementó una descarga completa para uso sin conexión.

## Qué contiene

- Inicio con hora argentina, clima y mensaje positivo o refrán; noticias y rutas se consultan dentro de sus propias secciones.
- Clima Open-Meteo para −40.1579, −71.3534, identificado como estimación de modelos, con cinco días de pronóstico.
- Llegadas y salidas exclusivas de CPC. Consulta del tablero público del propio aeropuerto desde el servidor, sin iframe. No se deducen estados por horario.
- Noticias del RSS municipal: título, fecha de publicación y extracto breve real, con lectura interna y filtro de relevancia local.
- Sección Caminos y rutas con enlaces a Vialidad Neuquén, Vialidad Nacional, Turismo municipal y una referencia secundaria claramente identificada.
- Cinco paseos, filtros, contactos y tres categorías de agencias/transporte con fichas internas.
- Enlaces útiles, llamadas, copia de teléfono, WhatsApp donde la fuente lo confirmó, salida con explicación y regreso.

## Fuentes, límites y mantenimiento

Consultar [FUENTES.md](docs/FUENTES.md) y [VERIFICACION.md](docs/VERIFICACION.md).

Los contactos y paseos son un catálogo editorial consultado el 8/11/2026, no un directorio actualizado automáticamente. El teléfono del hospital queda pendiente por discrepancia entre fuentes. No se certificaron accesibilidad, apertura, reservas ni tarifas; las fichas señalan lo que no se pudo comprobar. La costanera no tiene distancia medida desde la plaza en las fuentes consultadas. Las fotos específicas sin licencia comprobada se omiten.

El tablero CPC consultado devolvió explícitamente ausencia de vuelos para hoy. Se comprobó esta respuesta real y se probó el analizador con una fila sintética **solo en tests**. Falta contrastarlo con una fila real de vuelo activo. La fuente no publica hora de actualización ni fecha individual de cada vuelo: se explica que el día corresponde al tablero “hoy”. Si el formato cambia, se muestra error, no vuelos inventados.

El RSS no constituye una agenda de eventos futuros. Se muestran publicaciones locales recientes con fecha propia y sin afirmar que sus eventos sigan vigentes. No se copian artículos completos.

## Archivos

- `public/`: interfaz, catálogo, foto de dominio público e iconos propios.
- `server/`: consultas limitadas a fuentes predefinidas y servidor local.
- `scripts/build.mjs`: empaqueta un Worker con archivos integrados, sin dependencias en tiempo de ejecución.
- `tests/`: pruebas de integridad de datos y navegador; datos sintéticos solo de prueba.
- `docs/`: fuentes, evidencia de consultas y alcance de verificación.
- `dist/`: resultado generado para alojamiento Worker.

## Verificación reproducible

```sh
npm test
npm run build
# Con npm start en otra terminal y Google Chrome instalado en macOS:
npm run test:browser
```

La app limita cada consulta remota a 12 segundos y la espera del navegador a 20 segundos. Caché de servidor: vuelos 1 minuto, clima 5 minutos, noticias/caminos 10 minutos. El botón Actualizar consulta el servidor y conserva la hora real de la respuesta cacheada. Si una actualización falla, clima/noticias/caminos pueden mostrar una consulta anterior con su antigüedad; vuelos no utiliza copia local como información actual. La caché no sustituye las fechas propias de publicación o reporte.
