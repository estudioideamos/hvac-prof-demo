import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
const php=process.env.PHP_BINARY || path.resolve('.audit/php/php.exe');
const source=fs.readFileSync('enviar-contacto.php','utf8');
const lint=spawnSync(php,['-n','-l','enviar-contacto.php'],{encoding:'utf8'});
if(lint.status!==0)throw Error(lint.stderr || lint.stdout);
const root=path.resolve('.audit/form-'+Date.now());
const publicRoot=path.join(root,'public');fs.mkdirSync(publicRoot,{recursive:true});
// Mail is stubbed only in this isolated copy; no test messages leave this computer.
fs.writeFileSync(path.join(publicRoot,'enviar-contacto.php'),source.replace('declare(strict_types=1);','declare(strict_types=1);\nnamespace HVACContactTest;\nfunction mail(...$args) { return true; }'));
const server=spawn(php,['-n','-d','display_errors=0','-d','log_errors=1','-S','127.0.0.1:4188','-t',publicRoot],{stdio:['ignore','pipe','pipe']});
const logs=[];server.stderr.on('data',b=>logs.push(b.toString()));
const url='http://127.0.0.1:4188/enviar-contacto.php';
const outcomes=[];
async function check(name,opts,expected){const response=await fetch(url,{redirect:'manual',headers:{Accept:'application/json',...opts.headers},...opts});const text=await response.text();outcomes.push({name,status:response.status});if(response.status!==expected)throw Error(name+': '+response.status+' '+text);return text;}
function post(extra={},headers={}){return {method:'POST',headers:{Accept:'application/json',Origin:'https://hvacprof.com.ar',...headers},body:new URLSearchParams({nombre:'Prueba QA',email:'qa@example.com',mensaje:'Consulta de prueba del formulario',consulta:'tecnica',...extra})};}
try {
  await new Promise((resolve,reject)=>{let count=0;const timer=setInterval(async()=>{try{await fetch(url);clearInterval(timer);resolve();}catch{if(++count>30){clearInterval(timer);reject(Error('PHP server failed'));}}},100);});
  await check('GET rejected',{headers:{Accept:'application/json'}},405);
  await check('External origin rejected',post({}, {Origin:'https://example.com'}),403);
  await check('Null origin rejected',post({}, {Origin:'null'}),403);
  await check('Oversized request rejected',post({mensaje:'x'.repeat(22000)}),413);
  await check('Invalid fields rejected',post({email:'not-email'}),422);
  await check('Header injection rejected',post({email:'qa@example.com\r\nBcc: other@example.com'}),422);
  await check('Missing origin rejected',{method:'POST',headers:{Accept:'application/json'},body:new URLSearchParams({})},403);
  await check('Link spam rejected',post({mensaje:'https://a.test https://b.test https://c.test'}),422);
  for(let i=0;i<3;i++)await check('Valid submission '+(i+1),post({mensaje:'Consulta de prueba del formulario '+i}),200);
  await check('Duplicate rejected',post({mensaje:'Consulta de prueba del formulario 0'}),429);
  await check('Rate limit enforced',post(),429);
  fs.renameSync(path.join(root,'.hvacprof-private'),path.join(root,'.hvacprof-private-test-backup'));
  fs.writeFileSync(path.join(root,'.hvacprof-private'),'Block directory creation for the failure test');
  await check('Unavailable rate storage fails closed',post(),503);
  fs.writeFileSync('.audit/contact-tests.json',JSON.stringify({lint:lint.stdout.trim(),outcomes,mail:'stubbed; no real messages sent'},null,2));
  console.log(JSON.stringify(outcomes));
} finally {server.kill();}
