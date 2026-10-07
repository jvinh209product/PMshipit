import {readFile, readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

export const projectRoot=fileURLToPath(new URL('../',import.meta.url));
export const appRoot=path.join(projectRoot,'dist');

export async function filesIn(directory) {
  const files=[];
  for(const item of await readdir(directory,{withFileTypes:true})) {
    const filename=path.join(directory,item.name);
    if(item.isSymbolicLink())throw new Error(`Unexpected symlink: ${filename}`);
    if(item.isDirectory())files.push(...await filesIn(filename));
    else if(item.isFile())files.push(filename);
  }
  return files.sort();
}

export async function verifyApplication() {
  const files=await filesIn(appRoot),relative=files.map(f=>path.relative(appRoot,f).replaceAll(path.sep,'/'));
  const required=['index.html','app.mjs','data.mjs','engine.mjs','office.mjs','office-life.mjs','navigation.mjs','activities.mjs','style.css','readability.css','vendor/three.module.js','vendor/three.core.js','vendor/gsap.min.js','vendor/THREE-LICENSE.txt','assets/favicon.svg','assets/og-preview.png','assets/studio-regular.ttf','assets/studio-medium.ttf','assets/studio-bold.ttf','assets/studio-mono.ttf'];
  for(const name of required)assert.ok(relative.includes(name),`Missing required application file: ${name}`);
  let references=0,totalBytes=0;const hashes={};
  for(const file of files) {
    const bytes=await readFile(file),name=path.relative(appRoot,file).replaceAll(path.sep,'/');
    totalBytes+=bytes.length;hashes[`dist/${name}`]=createHash('sha256').update(bytes).digest('hex');
    if(!/\.(?:mjs|js|css|html)$/.test(file))continue;
    const text=bytes.toString();
    assert.ok(!/chatgpt\.site|chatgpt-team\.site|@openai\/sites|OAI-Sites-Authorization|CUSTOMER_HTTP_|oaiapp_|appgprj_/.test(text),`Hosting runtime or identity remains in ${name}`);
    if(/\.(?:mjs|js)$/.test(file)) {
      const parsed=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
      assert.equal(parsed.status,0,`JavaScript syntax error in ${name}: ${parsed.stderr}`);
    }
    const links=[];
    if(/\.html$/.test(file))for(const match of text.matchAll(/<(?:script|link|img|source)\b[^>]*?\b(?:src|href)=["']([^"']+)["']/g))links.push(match[1]);
    if(/\.css$/.test(file))for(const match of text.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g))links.push(match[1]);
    if(/\.(?:mjs|js)$/.test(file))for(const match of text.matchAll(/\b(?:from|import)\s*\(?\s*["']([^"']+)["']/g))if(match[1].startsWith('.'))links.push(match[1]);
    for(const link of links) {
      if(/^(?:https?:|data:|#)/.test(link))continue;
      const clean=decodeURIComponent(link.split(/[?#]/)[0]);
      const target=path.resolve(clean.startsWith('/')?appRoot:path.dirname(file),clean.replace(/^\//,''));
      assert.ok(target.startsWith(appRoot+path.sep),`Reference escapes app directory: ${name} → ${link}`);
      assert.ok((await stat(target).catch(()=>null))?.isFile(),`Missing asset/import: ${name} → ${link}`);references++;
    }
  }
  const html=await readFile(path.join(appRoot,'index.html'),'utf8'),app=await readFile(path.join(appRoot,'app.mjs'),'utf8');
  const ids=new Set([...`${html}\n${app}`.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  for(const match of app.matchAll(/\$\('#([\w-]+)'\)/g))assert.ok(ids.has(match[1]),`Missing static or generated UI element: ${match[1]}`);
  assert.ok(html.includes('readability.css'),'Latest readability stylesheet is absent');
  assert.ok(html.includes('Built by Vinh Nguyen')&&html.includes('https://vinh-nguyen-portfolio-three.vercel.app/'),'Creator section is absent');
  const data=await import(new URL('../dist/data.mjs',import.meta.url));
  const state=await import(new URL('../dist/engine.mjs',import.meta.url));
  const three=await import(new URL('../dist/vendor/three.module.js',import.meta.url));
  await import(new URL('../dist/office-life.mjs',import.meta.url));
  await import(new URL('../dist/office.mjs',import.meta.url));
  assert.equal(data.scenarios.length,37);assert.equal(data.chapters.length,5);
  assert.equal(state.createState().day,1);assert.equal(state.createState().focus,100);assert.ok(three.Scene);
  return {files:files.length,localReferences:references,totalBytes,scenarios:data.scenarios.length,chapters:data.chapters.length,stakeholders:Object.keys(data.people).length,threeRevision:three.REVISION,hashes};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const report=await verifyApplication();const {hashes,...summary}=report;
  console.log('Application verification passed:',JSON.stringify(summary));
}
