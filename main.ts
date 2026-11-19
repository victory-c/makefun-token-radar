// SPDX-License-Identifier: MIT
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRadar, assertBoard } from './lib/model.ts';
import { buildDossier } from './vendor/makefun-board.ts';
const root=fileURLToPath(new URL('.',import.meta.url));
function option(name:string,fallback:string) {
  const args=process.argv.slice(2), i=args.indexOf('--'+name);
  return i>=0?args[i+1]:args.find(x=>x.startsWith('--'+name+'='))?.split('=').slice(1).join('=')??fallback;
}
let input=option('input','/input/snapshot.json');
if(!input.endsWith('.json')) input=join(input,'snapshot.json');
const output=resolve(option('output',process.env.MAKEFUN_OUTPUT_DIR||'/output'));
if(output===root||root.startsWith(output+'/')) throw Error('Output must not contain the source repository');
const snapshot=JSON.parse(readFileSync(input,'utf8'));
const radar=buildRadar(snapshot);assertBoard(radar,snapshot);
mkdirSync(output,{recursive:true});
cpSync(join(root,'dashboard'),join(output,'dashboard'),{recursive:true});
writeFileSync(join(output,'board.json'),JSON.stringify({as_of:radar.as_of,model:radar.model,rows:radar.rows})+'\n');
writeFileSync(join(output,'data.js'),'window.RADAR='+JSON.stringify(radar).replace(/</g,'\\u003c')+';\n');
if(existsSync(join(root,'screenshots'))) cpSync(join(root,'screenshots'),join(output,'screenshots'),{recursive:true});
// Preview allows the very first browser capture before real screenshots exist.
if(!process.argv.includes('--preview')) writeFileSync(join(output,'dossier.json'),buildDossier(output,{text_max_bytes:65536,screenshots:{max:4,max_bytes:524288},dashboard:{max_files:400,max_bytes:4194304}}));
console.log(JSON.stringify({board_rows:radar.rows.length,watchlist:radar.watch_count,live:radar.live.length,excluded_related:radar.excluded,output,dossier:!process.argv.includes('--preview')}));
