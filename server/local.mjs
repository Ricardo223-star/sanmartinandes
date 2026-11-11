import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {apiResponse} from './data.mjs';
const root=resolve('public');const port=Number(process.env.PORT || 4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webmanifest':'application/manifest+json'};
http.createServer(async(req,res)=>{
  try {
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(path.startsWith('/api/')) {const response=await apiResponse(path);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;}
    const file=resolve(root,'.'+(path==='/'?'/index.html':path));if(!file.startsWith(root+sep)) {res.writeHead(403);res.end();return;}
    const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)] || 'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(bytes);
  } catch {res.writeHead(404,{'Content-Type':'text/plain'});res.end('No encontrado');}
}).listen(port,'0.0.0.0',()=>console.log(`Vista previa: http://localhost:${port}`));
