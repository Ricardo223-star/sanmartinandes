# Fuentes y decisiones de integración

Consulta: 8/11/2026. Las fechas de consulta no son fechas de publicación. La verificación de directorios fue documental; no hubo llamadas.

| Área | Fuente | Acceso y decisión |
|---|---|---|
| Clima | https://open-meteo.com/en/docs | API sin clave, coordenada de San Martín. La celda devuelta está cerca de la coordenada solicitada; se valida la región. Datos de modelos, no estación. |
| Condiciones de uso del clima | https://open-meteo.com/en/terms | API gratuita para uso no comercial y datos CC BY 4.0, con atribución. No se contrató servicio. |
| Aeropuerto | https://aeropuertochapelco.com/ | El sitio identifica CPC/SAZY. Su portada vacía no se usa como confirmación. |
| Llegadas | https://fids.aeropuertochapelco.com/P26/arrp24.php | Tablero público enlazado a través de la pantalla del aeropuerto. Respuesta HTTP 200 con ausencia explícita para hoy. |
| Salidas | https://fids.aeropuertochapelco.com/P26/parp24.php | Misma comprobación. Sin API documentada, clave ni fecha de actualización publicada. |
| Noticias | https://prensa.sma.gob.ar/?feed=rss2 | RSS municipal accesible. `/wp-json/wp/v2/posts` devolvió 404. Se usan extractos breves publicados, no artículos completos. |
| Caminos | https://w2.dpvneuquen.gov.ar/ParteDiario.pdf | PDF enlazado por https://www.dpvneuquen.gov.ar/ . Texto extraíble, fecha/hora dentro del documento. Tabla de referencias explica TCP, T, TP, I y S/I. La información de rutas nacionales es provista por DNV según el PDF. |
| Turismo | https://sanmartindelosandes.gob.ar/ciudad/ | Paseos urbanos, museos y proximidad a plaza. Distancias/duraciones editoriales se identifican como orientativas. |
| Miradores | https://sanmartindelosandes.gob.ar/ver-circuito/?id=16 | Mirador Arrayán, distancia y terreno. |
| Playas cercanas | https://sanmartindelosandes.gob.ar/ver-circuito/?id=11 | Quila Quina; discrepancia entre distancia total y suma de tramos se muestra. |
| Emergencias | https://turismo.neuquen.gob.ar/consejos/ | Números cortos oficiales 107, 101, 100. Aplicación local de SIEN corroborada en publicación provincial sobre base en San Martín. |
| Hospital | https://copronaf.neuquen.gob.ar/agenda-de-recursos/ y https://planpgn.com.ar/archivos/PM_PGN_Cartilla.pdf | Números diferentes. No se habilita llamada directa al hospital. |
| Agencia | https://sanmartindelosandes.gob.ar/ver-agencia/?id=3 | El Claro Turismo; WhatsApp corroborado en https://www.elclaroturismo.com.ar/es/traslados.html . |
| Alquiler | https://sanmartindelosandes.gob.ar/ver-transporte/?id=21 | Easy Rent a Car: dirección local publicada. No se afirma entrega en aeropuerto. |
| Taxis | https://sanmartindelosandes.gob.ar/ver-transporte/?id=8 | Asociación Taxistas Unidos. |
| Colectivos | https://expresolosandes.com.ar/contact-us/ | Expreso Los Andes; horarios de oficina diferenciados de circulación. Diferencia de numeración de terminal explicada. |
| Traslado CPC | https://aeropuertochapelco.com/pasajeros/transporte-publico/ | Expreso Colonia, recorrido, WhatsApp y horarios publicados. Días/vigencia no informados; contradicción de parada después de 17:00 visible. |
| Aerolíneas | https://aeropuertochapelco.com/aeropuerto/ | Enlaces a Aerolíneas Argentinas y JetSMART. No se usa para confirmar la programación del día. |
| Fotografía | https://commons.wikimedia.org/wiki/File:SAN_MARTIN_DE_LOS_ANDES_LACAR.JPG | Albasmalko, liberada al dominio público (PD-self), tomada 15/03/2006. Se identifica como archivo; no es webcam. |

Las consultas del navegador son al mismo origen `/api/`; el backend consulta exclusivamente URLs fijas. No dependen de que los portales habiliten CORS, no hay proxy público ni iframe, ni campos que permitan solicitar una URL arbitraria. Se comprobó acceso HTTP real a las fuentes integradas. No se verificó una autorización contractual ni garantía de continuidad del HTML del aeropuerto: es una integración al tablero público, sin API formal. Si cambia o restringe el acceso se informa error. No se eluden accesos privados.

No se incorporan artículos completos, fotos con licencia desconocida, precios, reservas, itinerarios o disponibilidad inventados. La noticia municipal muestra un máximo de 24 palabras del extracto por tarjeta. El HTML de fuentes nunca se inserta directamente en la interfaz.

Para revisar el catálogo editar `public/catalog.json` y cambiar `consultedDate` solo después de consultar realmente las fuentes. No utilizar las fechas del pie “declaración de accesibilidad” del municipio como actualización del directorio.

La web antigua del aeropuerto en `aeropuertochapelco.neuquen.gob.ar` dice que solo opera Aerolíneas, mientras el sitio actual también lista JetSMART. Se prioriza el sitio actual enlazado a su tablero; ninguna de esas listas reemplaza vuelos del día.
