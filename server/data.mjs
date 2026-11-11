import { parseHTML, DOMParser } from 'linkedom';
import { extractText, getDocumentProxy } from 'unpdf';

export const TZ = 'America/Argentina/Buenos_Aires';
export const SOURCES = {
  weather: 'https://api.open-meteo.com/v1/forecast?latitude=-40.1579&longitude=-71.3534&current=temperature_2m,apparent_temperature,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=America%2FArgentina%2FBuenos_Aires&forecast_days=5',
  news: 'https://prensa.sma.gob.ar/?feed=rss2',
  newsLocal: ['https://realidadsm.com/feed/','https://www.lacardigital.com.ar/feed/','https://noticiasdelosandes.com.ar/feed/'],
  arrivals: 'https://fids.aeropuertochapelco.com/P26/arrp24.php',
  departures: 'https://fids.aeropuertochapelco.com/P26/parp24.php',
  roads: 'https://w2.dpvneuquen.gov.ar/ParteDiario.pdf'
};
const SCHEDULE_SOURCES={arrivals:'https://zbordirect.com/es/tools/schedule/AEP/CPC',departures:'https://zbordirect.com/es/tools/schedule/CPC/AEP'};
const ROADS_BACKUP='https://www.ruta0.com/estado-de-rutas/ciudad/san-martin-de-los-andes/';
const ROADS_OFFICIAL_HTML='https://w2.dpvneuquen.gov.ar/ultimoparte.php';
export function localDay(date = new Date()) { return new Intl.DateTimeFormat('en-CA', {timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(date); }
export function plain(value) { const {document}=parseHTML(`<html><body>${value || ''}</body></html>`);document.querySelectorAll('script,style').forEach(x=>x.remove());return document.body.textContent.replace(/\s+/g,' ').trim(); }
const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

export function parseFlights(html, direction, now = new Date()) {
  const {document}=parseHTML(html);
  const heading=document.querySelector('h1')?.textContent || '';
  if (!/Chapelco/i.test(document.title) || !heading.includes(direction === 'arrivals' ? 'Arribos' : 'Partidas')) throw Error('El tablero no identifica el servicio esperado de Chapelco.');
  const section=document.querySelector('section.data');
  if (!section) throw Error('El formato del tablero cambió.');
  const items=[...section.querySelectorAll('li.dl')];
  const rows=[];
  let empty=false;
  for (const item of items) {
    if (/No hay vuelos programados para hoy/i.test(item.textContent)) { empty=true; continue; }
    const cells=[1,2,3,4,5,6].map(n=>item.querySelector(`.c${n}`));
    if(cells.some(c=>!c)) throw Error('No se pudo interpretar una fila del tablero.');
    const airline=cells[0].textContent.trim() || cells[0].querySelector('img')?.getAttribute('alt') || '';
    const values=cells.map(c=>c.textContent.replace(/\s+/g,' ').trim());
    const time=v=>v.replace(/\s*hs?\.?\s*$/i,'').trim();
    values[3]=time(values[3]); values[4]=values[4]?time(values[4]):'';
    if(!airline || !values[1] || !values[2] || !/^\d{1,2}:\d{2}$/.test(values[3])) throw Error('El vuelo tiene campos esenciales no verificables.');
    // The source labels these boards "hoy". Its JS clock is NOT a data update timestamp.
    // Never translate a time into a flight status, or 00:00 into a guessed estimate.
    rows.push({airline,number:values[1],place:values[2],scheduled:values[3],estimated:values[4] || null,status:values[5] || 'No informado por la fuente',date:localDay(now)});
  }
  if(!rows.length && !empty) throw Error('Tablero vacío sin confirmación de ausencia de vuelos.');
  if(rows.length && empty) throw Error('El tablero contiene información contradictoria.');
  return {airport:'CPC',direction,date:localDay(now),rows,emptyConfirmed:empty,sourceUpdatedAt:null,source:SOURCES[direction],dateBasis:'La fuente identifica este tablero como el de hoy; no publica fecha individual de vuelo ni hora de actualización. Los horarios se reproducen como hora local argentina.'};
}

export function parseNews(xml, now = new Date()) {
  const doc=new DOMParser().parseFromString(xml,'text/xml');
  if(!doc.querySelector('rss channel')) throw Error('El boletín municipal no tiene formato RSS válido.');
  const all=[...doc.querySelectorAll('item')];
  const rows=all.map(item=>{
    const title=plain(item.querySelector('title')?.textContent);
    const excerpt=plain(item.querySelector('description')?.textContent);
    const date=new Date(item.querySelector('pubDate')?.textContent);
    const source=item.querySelector('link')?.textContent?.trim();
    if(!title || !excerpt || !/^https:\/\/(prensa\.sma\.gob\.ar|realidadsm\.com|(?:www\.)?lacardigital\.com\.ar|noticiasdelosandes\.com\.ar)\//.test(source||'') || !Number.isFinite(date.getTime())) return null;
    const age=now-date;
    if(age<0 || age>3*86400000) return null;
    const text=normalize(title+' '+excerpt);
    if(!/(san martin|nuestra ciudad|lacar|chapelco)/.test(text)) return null;
    if(!/(turis|visit|ruta|transito|corte|transport|aeropuerto|cultura|museo|festival|actividad|evento|servicio|sucursal|cajero|costanera|parque|recoleccion|agua|luz)/.test(text)) return null;
    // Reuse only the actual publisher's excerpt, never generate text from a headline.
    const words=excerpt.split(/\s+/);
    const sourceName=source.includes('prensa.sma.gob.ar')?'San Martín Informa · Municipalidad':source.includes('realidadsm.com')?'Realidad Sanmartinense':source.includes('lacardigital.com.ar')?'Lacar Digital':'Noticias de los Andes';
    return {id:encodeURIComponent(source),title,excerpt:words.slice(0,24).join(' ')+(words.length>24?'…':''),publishedAt:date.toISOString(),source,sourceName,kind:'Extracto breve del boletín de la fuente; no es el artículo completo.',historical:age>7*86400000};
  }).filter(Boolean).slice(0,8);
  return {rows,source:SOURCES.news,sourceUpdatedAt:doc.querySelector('lastBuildDate')?.textContent || null,scope:'Publicaciones locales de los últimos tres días relacionadas con una visita. La fecha de publicación no confirma que un evento siga vigente.'};
}

export function parseSchedule(html, direction, now = new Date()) {
  const target=localDay(new Date(now.getTime()+86400000));
  const [y,m,d]=target.split('-'); const wanted=`${d}/${m}/${y.slice(2)}`;
  const text=plain(html).replace(/\u00a0/g,' ');
  const rows=[];
  const re=/(\d{2}\/\d{2}\/\d{2})\s+(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})\s+([A-Za-zÁÉÍÓÚáéíóúÑñ .'-]+?)\s+((?:AR|JA)\s*\d{3,4})/g;
  for(const match of text.matchAll(re)) if(match[1]===wanted){
    const code=match[5].match(/^(AR|JA)\s*(\d{3,4})$/i); if(!code) continue;
    const airline=code[1].toUpperCase(),number=code[2];
    rows.push({airline:airline==='AR'?'Aerolíneas Argentinas':'JetSMART',number:`${airline} ${number}`,scheduledDeparture:match[2],scheduledArrival:match[3],route:direction==='arrivals'?'Aeroparque → Chapelco CPC':'Chapelco CPC → Aeroparque',status:'Programado según calendario',date:target});
  }
  return {airport:'CPC',direction,date:target,rows,source:SCHEDULE_SOURCES[direction],sourceUpdatedAt:null,dateBasis:'Programación publicada por una fuente secundaria. No es un tablero operativo y no confirma estado, demora ni cancelación.',consultedAt:new Date().toISOString()};
}

export function parseRoadText(text, now = new Date()) {
  const stamp=text.match(/Información Actualizada a las\s+(\d{1,2}:\d{2})\s*hs\.\s*del\s+(\d{2})\/(\d{2})\/(\d{4})/);
  if(!stamp) throw Error('No se pudo verificar la fecha del parte vial.');
  const reportedAt=`${stamp[4]}-${stamp[3]}-${stamp[2]}T${stamp[1]}:00-03:00`;
  if(!Number.isFinite(Date.parse(reportedAt)) || Date.parse(reportedAt)>now.getTime()+3600000) throw Error('La fecha del parte vial no es válida.');
  const clean=text.replace(/Estado de Rutas de la Provincia del Neuquén[\s\S]*?\(Km\)/g,'\n').split('Referencias Transitabilidad:')[0];
  const blocks=clean.match(/^[PN]\d{3}\b[\s\S]*?(?=^[PN]\d{3}\b|(?![\s\S]))/gm) || [];
  const rows=[];
  for(const block of blocks) {
    const compact=block.split('Estado de Rutas de la Provincia')[0].replace(/\s+/g,' ').trim();
    if(!/San Mart[ií]n|Lolog|Quila Quina|Hua Hum|Siete Lagos|Acc\. Chapelco|Lago Villarino/i.test(compact)) continue;
    const m=compact.match(/^([PN])(\d{3})\s+(.+?)\s+(?:(\d+)\s+)?((?:No Pav|Pavim)(?:-(?:No Pav|Pavim))*)\s+(TCP|TP|S\/I|I|T)\b\s*([\s\S]*)$/);
    if(!m) throw Error('Cambió el formato de un tramo local del parte vial.');
    const label={TCP:'Transitable con precaución',TP:'Transitable pesado',I:'Intransitable',T:'Transitable','S/I':'Estado sin verificar'}[m[6]];
    const route=/^Acc Quila Quina/i.test(m[3])?'Acceso Quila Quina':/^Paso Hua Hum/i.test(m[3])?'Paso Hua Hum':`${m[1]==='N'?'RN':'RP'} ${Number(m[2])}`;
    rows.push({route,segment:m[3],status:label,details:m[7] || 'Sin observaciones publicadas en este tramo.',surface:m[5],reportedAt,source:SOURCES.roads,sourceName:m[1]==='N'&&!/^Paso/.test(m[3])?'Vialidad Provincial · información nacional provista por DNV':'Vialidad Provincial del Neuquén'});
  }
  if(!rows.length) throw Error('No se pudieron identificar reportes de los accesos locales.');
  return {rows,reportedAt,stale:now-Date.parse(reportedAt)>24*3600000,source:SOURCES.roads};
}
export function parseRoadBackup(html, now = new Date()) {
  const modified=html.match(/"dateModified"\s*:\s*"([^"]+)"/)?.[1];
  if(!modified) throw Error('La fuente secundaria no informa fecha de modificación.');
  const rows=[];
  const re=/capas\[\d+\]=\{([^}]+)\}/g;
  for(const match of html.matchAll(re)) {
    const block=match[1], pick=name=>block.match(new RegExp(`${name}:'([^']*)'`))?.[1] || '';
    const route=pick('ruta'), from=pick('desde'), to=pick('hasta');
    if(!/^(RN 40|RP 48|RP 62|RP 63)$/.test(route) || !/San Martín|Lago Lolog|Cruce RN 40 y RP 63/i.test(`${from} ${to}`)) continue;
    const status=pick('estadoSrc'), relative=pick('fechaRel');
    rows.push({route,segment:`${from} — ${to}`,status:status||'Estado sin verificar',details:`Reporte de Ruta0: ${status||'sin estado publicado'}; referencia temporal de la fuente: ${relative||'no informada'}. Es una fuente secundaria basada en reportes de viajeros y Vialidad; no sustituye un parte oficial.`,surface:'No informado',reportedAt:modified,source:ROADS_BACKUP,sourceName:'Ruta0 · reportes secundarios'});
  }
  if(!rows.length) throw Error('La fuente secundaria no publicó tramos locales interpretables.');
  return {rows,reportedAt:modified,stale:now-Date.parse(modified)>24*3600000,source:ROADS_BACKUP,secondary:true,sourceNote:'Respaldo secundario utilizado porque el parte oficial no respondió. Confirmar siempre con Vialidad antes de salir.'};
}

export function parseRoadOfficialHtml(html, now = new Date()) {
  const {document}=parseHTML(html);
  const rows=[];
  for(const tr of document.querySelectorAll('tr')) {
    const cells=[...tr.querySelectorAll('td,th')].map(x=>plain(x.textContent));
    if(cells.length<4) continue;
    const routeText=cells.join(' ');
    if(!/^(40|48|62)\b|\b(40|48|62)\s/.test(routeText) || !/San Martín|Chapelco|Villarino|Lolog|Hua Hum|Carrirriñe|Quila Quina/i.test(routeText)) continue;
    const routeMatch=routeText.match(/\b(40|48|62)\b/); if(!routeMatch) continue;
    const route=`${routeMatch[1]==='40'?'RN':'RP'} ${routeMatch[1]}`;
    const status=/\bI\b|INTRANSITABLE/i.test(routeText)?'Intransitable':/\bTCP\b|HABILITADA/i.test(routeText)?'Transitable con precaución':'Estado sin verificar';
    rows.push({route,segment:cells[1]||route,status,details:cells.at(-1)||'Sin observaciones publicadas.',surface:cells[2]||'No informado',reportedAt:null,source:ROADS_OFFICIAL_HTML,sourceName:'Dirección Provincial de Vialidad del Neuquén'});
  }
  if(!rows.length) throw Error('El parte HTML no publicó tramos locales interpretables.');
  return {rows,reportedAt:null,stale:true,source:ROADS_OFFICIAL_HTML,official:true,sourceNote:'Parte oficial provincial. La fuente no publicó una fecha de actualización legible en la respuesta; verificar antes de salir.'};
}

const cache=new Map();
async function readSource(url, binary=false) {
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),25000);
  try {
    const res=await fetch(url,{signal:controller.signal,headers:{'Accept':binary?'application/pdf':'application/json, application/xml, text/html, */*','User-Agent':'SanMartinGuia/1.0 (personal travel information)'}});
    if(!res.ok) throw Error(`La fuente respondió HTTP ${res.status}.`);
    const declared=Number(res.headers.get('content-length')||0);if(declared>6000000) throw Error('Respuesta demasiado grande.');
    const buf=await res.arrayBuffer();if(buf.byteLength>6000000) throw Error('Respuesta demasiado grande.');
    return binary?new Uint8Array(buf):new TextDecoder().decode(buf);
  } finally {clearTimeout(timer);}
}

export async function getData(kind) {
  const prior=cache.get(kind);const ttl={weather:300000,news:600000,roads:600000,arrivals:60000,departures:60000}[kind];
  if(prior && Date.now()-Date.parse(prior.consultedAt)<ttl) return {...prior,serverCached:true};
  let data;
  if(kind==='weather') {
    const raw=JSON.parse(await readSource(SOURCES.weather));
    const dailyKeys=['temperature_2m_max','temperature_2m_min','precipitation_probability_max','weather_code'];
    if(raw.timezone!==TZ || !Number.isFinite(raw.latitude) || !Number.isFinite(raw.longitude) || Math.abs(raw.latitude+40.1579)>.15 || Math.abs(raw.longitude+71.3534)>.15 || !raw.current?.time || !raw.daily?.time?.length || !Number.isFinite(raw.current.temperature_2m) || dailyKeys.some(k=>!Array.isArray(raw.daily[k]) || raw.daily[k].length!==raw.daily.time.length)) throw Error('Respuesta meteorológica incompleta o ubicación incorrecta.');
    data={...raw,location:'San Martín de los Andes, Neuquén',requestedCoordinates:{latitude:-40.1579,longitude:-71.3534},source:'https://open-meteo.com/en/docs',sourceUpdatedAt:null};
  } else if(kind==='news') {
    const feeds=await Promise.allSettled([readSource(SOURCES.news),...SOURCES.newsLocal.map(url=>readSource(url))]);
    const parsed=feeds.filter(x=>x.status==='fulfilled').map(x=>parseNews(x.value));
    data={rows:parsed.flatMap(x=>x.rows).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,12),source:SOURCES.news,sourceUpdatedAt:parsed.map(x=>x.sourceUpdatedAt).filter(Boolean).join(' · ')||null,scope:'Publicaciones locales de los últimos tres días relacionadas con una visita. Se consultaron la Municipalidad y medios locales; la fecha de publicación no confirma que un evento siga vigente.'};
  } else if(kind==='scheduleArrivals'||kind==='scheduleDepartures') data=parseSchedule(await readSource(SCHEDULE_SOURCES[kind==='scheduleArrivals'?'arrivals':'departures']),kind==='scheduleArrivals'?'arrivals':'departures');
  else if(kind==='arrivals'||kind==='departures') data=parseFlights(await readSource(SOURCES[kind]),kind);
  else if(kind==='roads') {
    try {const bytes=await readSource(SOURCES.roads,true);const pdf=await getDocumentProxy(bytes,{maxImageSize:1000000,isEvalSupported:false});try {if(pdf.numPages>20) throw Error('Parte vial demasiado extenso.');const {text}=await extractText(pdf,{mergePages:true});data=parseRoadText(text);} finally {if(typeof pdf.destroy==='function')await pdf.destroy();else if(typeof pdf.cleanup==='function')await pdf.cleanup();}}
    catch(officialError) {
      try { data=parseRoadOfficialHtml(await readSource(ROADS_OFFICIAL_HTML),new Date()); }
      catch(htmlError) { data=parseRoadBackup(await readSource(ROADS_BACKUP),new Date()); data.officialError=`Parte PDF: ${officialError.message}. Parte HTML: ${htmlError.message}`; }
    }
  } else throw Error('Consulta desconocida.');
  const result={...data,consultedAt:new Date().toISOString(),serverCached:false};cache.set(kind,result);return result;
}

export async function apiResponse(path) {
  const kind=path.replace('/api/','');
  if(!['scheduleArrivals','scheduleDepartures'].includes(kind) && !Object.hasOwn(SOURCES,kind)) return new Response(JSON.stringify({error:'Consulta desconocida.'}),{status:404,headers:{'Content-Type':'application/json'}});
  try {return new Response(JSON.stringify(await getData(kind)),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});}
  catch(error) {return new Response(JSON.stringify({error:kind==='arrivals'||kind==='departures'||kind==='scheduleArrivals'||kind==='scheduleDepartures'?'No se pudieron consultar los vuelos':kind==='roads'?'No se pudo consultar el parte vial':kind==='news'?'No se pudieron consultar las noticias':'No se pudo consultar el clima',detail:error.name==='AbortError'?'La fuente no respondió en 12 segundos.':error.message,attemptedAt:new Date().toISOString()}),{status:502,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});}
}
