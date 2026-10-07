import {cp, mkdtemp, rename, rm, readFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {appRoot,projectRoot,verifyApplication,filesIn} from './verify.mjs';

const report=await verifyApplication();
const temporary=await mkdtemp(path.join(projectRoot,'.pmshipit-build-'));
const output=path.join(projectRoot,'build');
try {
  await cp(appRoot,temporary,{recursive:true});
  const copied=await filesIn(temporary);assert.equal(copied.length,report.files);
  for(const file of copied)assert.ok((await readFile(file)).equals(await readFile(path.join(appRoot,path.relative(temporary,file)))),`Output differs from source: ${file}`);
  await rm(output,{recursive:true,force:true});await rename(temporary,output);
  console.log(`Production build passed: ${report.files} files, ${report.localReferences} local asset/import references, ${report.scenarios} authored scenarios.`);
  console.log(`Static output: ${output}`);
} catch(error) {
  await rm(temporary,{recursive:true,force:true});throw error;
}
