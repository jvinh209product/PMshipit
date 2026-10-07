import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const args=process.argv.slice(2);
const value=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const dir=value('--dir','dist');
if(!['dist','build'].includes(dir))throw new Error('Choose --dir dist or --dir build.');
const root=fileURLToPath(new URL(`../${dir}/`,import.meta.url));
const port=Number(value('--port',dir==='build'?'4173':'5173'));
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Choose a port between 1 and 65535.');
const host=value('--host','127.0.0.1');
if(!(await stat(path.join(root,'index.html')).catch(()=>null))?.isFile())throw new Error(`${dir}/index.html is missing. Run npm run build before preview.`);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8'};
const server=createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  try {
    const decoded=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(root,'.'+decoded+(decoded.endsWith('/')?'index.html':''));
    if(!file.startsWith(root)){res.writeHead(403);res.end('Forbidden');return;}
    const details=await stat(file).catch(()=>null);
    if(!details?.isFile()){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':details.size,'Cache-Control':'no-cache'});
    if(req.method==='HEAD')res.end();else createReadStream(file).on('error',()=>res.destroy()).pipe(res);
  } catch {res.writeHead(400);res.end('Bad request');}
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(port,host,()=>console.log(`SHIP IT! ${dir==='build'?'production preview':'local development'}: http://${host}:${port}\nPress Ctrl+C to stop. Edit files in dist/ and refresh the browser.`));
