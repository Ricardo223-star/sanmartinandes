# Verificación — 8/11/2026

## Realizada

- Siete pruebas automatizadas aprobadas: zona horaria argentina; respuesta real vacía CPC; rechazo de tableros vacíos/ajenos; no inferir estado por horario; noticias con extractos y fechas; lectura del PDF vial real; limpieza de HTML.
- Navegación en Google Chrome mediante Playwright, 390×844 y 1280×900: ocho pantallas internas, Inicio visible, ausencia de iframes y de desplazamiento horizontal.
- Filtros de paseos, tres categorías comerciales, pestañas de vuelos, botón Copiar y diálogo Salir/Volver a la app comprobados.
- Hospital sin enlace de llamada. Error de consulta de vuelos simulado y comprobado: no aparece “No hay vuelos programados”. Clima sin conexión muestra copia anterior y aviso explícito.
- Revisión visual de captura a 390 px. Texto principal de 18 px y controles de al menos 48 px por CSS; los metadatos secundarios utilizan tamaño menor.
- Consultas HTTP reales del backend: clima correcto para la región, tres noticias seleccionadas, nueve tramos del parte vial y tablero CPC con ausencia explícita de vuelos. Ver `live-checks.json`.
- Compilación del Worker completada. La publicación y su resultado se informan por separado; compilar no prueba el alojamiento.

## Pendiente o no realizada

- Safari en iPhone físico, instalación real en pantalla de inicio, permisos de iOS y comportamiento de llamadas/WhatsApp en el dispositivo.
- Fila real de vuelo activo: el tablero público devolvió ausencia explícita al consultar. La prueba con fila sintética está identificada y no forma parte de datos visibles de la app.
- Confirmación telefónica de empresas y organismos; teléfono actual del hospital; vigencia de horarios de transporte y condiciones de apertura/accesibilidad de paseos.
- Una fotografía específica reutilizable para cada excursión. Se entrega solo la foto de San Martín/Lácar con licencia comprobada.
- No se comprobó exhaustividad del RSS: se consultan los ítems que el municipio ofrece y se filtran por pertinencia y fecha.
- No se probó cierre de una ventana abierta por otra mediante script; en una pestaña normal se comprobó el aviso de salida sin simular cierre.

Los datos guardados en `docs/evidence/` son evidencia de consulta para pruebas, no una fuente de actualización de la app. La interfaz obtiene las fuentes nuevamente a través del backend.
