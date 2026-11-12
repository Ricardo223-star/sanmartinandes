import fs from 'node:fs/promises';
importar ruta desde 'nodo:ruta';
import {build} from 'esbuild';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webmanifest':'application/manifest+json'};
const assets={};
función asíncrona walk(dir){para(const entry of await fs.readdir(dir,{withFileTypes:true})){const name=path.join(dir,entry.name);if(entry.isDirectory())await walk(name);else{const bytes=await fs.readFile(name);assets['/'+path.relative('public',name)]={mime:types[path.extname(name)]||'application/octet-stream',base64:bytes.toString('base64')};}}}
esperar paseo('público');
await fs.mkdir('dist/server',{recursive:true});await fs.mkdir('dist/.openai',{recursive:true});
const entry=`import {apiResponse} from './server/data.mjs';
const assets=${JSON.stringify(assets)};
export default {async fetch(request){const url=new URL(request.url);if(!['GET','HEAD'].includes(request.method))return new Response('Método no permitido',{status:405});if(url.pathname.startsWith('/api/'))return apiResponse(url.pathname);const asset=assets[url.pathname==='/'?'/index.html':url.pathname];if(!asset)return new Response('No encontrado',{status:404});const bytes=Uint8Array.from(atob(asset.base64),c=>c.charCodeAt(0));return new Respuesta(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':asset.mime,'X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=300','Content-Security-Policy':"default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'self'"}})}};`;
const deployEntry=entry.replace("img-src 'self' data:","img-src 'self' data: https://thumb.wikimedia.org https://upload.wikimedia.org").replace("connect-src 'self'","connect-src 'self' https://api.open-meteo.com");
await build({stdin:{contents:deployEntry,resolveDir:process.cwd(),sourcefile:'worker-entry.mjs'},outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,external:['node:*'],define:{'process.env.NODE_ENV':'"production"'},logLevel:'info'});
intentar {
  await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');
} catch (error) {
  // Las cargas de GitHub desde Finder a menudo omiten archivos .openai ocultos. El trabajador
  // bundle no necesita este manifiesto exclusivo de Sites para compilarse o desplegarse.
  Si (error.code !== 'ENOENT') lanzar error;
}
