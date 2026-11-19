// SPDX-License-Identifier: MIT
// Local contract checks, not the sealed server scorer or an AI judge rating.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildDossier } from '../vendor/makefun-board.ts';
import { assertBoard } from '../lib/model.ts';
const out=resolve(process.env.RADAR_OUTPUT||'out');
const snapshot=JSON.parse(readFileSync(process.env.RADAR_SNAPSHOT||new URL('../../../token-radar-01-kit/input/snapshot.json',import.meta.url),'utf8'));
const board=JSON.parse(readFileSync(join(out,'board.json'),'utf8'));
function files(dir:string):string[]{return readdirSync(dir).flatMap(n=>{const p=join(dir,n);return statSync(p).isDirectory()?files(p):[p];});}
test('dashboard_files: correct entrypoint, safe names, size, and offline assets',()=>{
 const root=join(out,'dashboard'),list=files(root);
 assert.ok(list.includes(join(root,'index.html')));assert.ok(list.some(p=>p.endsWith('.css')));assert.ok(list.some(p=>p.endsWith('.js')));assert.ok(list.length<=400);
 assert.ok(list.reduce((sum,p)=>sum+statSync(p).size,0)<=4194304);
 assert.ok(list.reduce((sum,p)=>sum+statSync(p).size,0)<65536,'All dashboard source must fit the dossier');
 for(const p of list){assert.match(p.split('/').pop()!,/^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$/);const text=readFileSync(p,'utf8');
 if(p.endsWith('.html'))assert.ok(!/\b(?:href|src|action|poster)\s*=\s*["'][^"']*https?:\/\//i.test(text));
 if(p.endsWith('.css'))assert.ok(!/https?:\/\//i.test(text));
 if(p.endsWith('.js'))assert.ok(!/(?:from\s*|import\s*\(|require\s*\()\s*["']https?:\/\//i.test(text));
 }
});
test('board_file: legal rows, snapshot membership and bounded bytes',()=>{
 assert.ok(statSync(join(out,'board.json')).size<=8*1024*1024);assert.ok(board.rows.length>=100&&board.rows.length<=4000);assertBoard({rows:board.rows},snapshot);
});
test('sorted_by_value: unique ranks 1..N and descending unequal implied values',()=>{
 assert.deepEqual(board.rows.map((r:any)=>r.rank),Array.from({length:board.rows.length},(_,i)=>i+1));
 assert.ok(board.rows.some((r:any)=>r.implied_value_usd!==board.rows[0].implied_value_usd));
 for(let i=1;i<board.rows.length;i++)assert.ok(board.rows[i-1].implied_value_usd>=board.rows[i].implied_value_usd);
});
test('coverage: every required watchlist slug is represented',()=>{const slugs=new Set(board.rows.map((r:any)=>r.slug));assert.ok(snapshot.watchlist.every((s:string)=>slugs.has(s)));});
test('farm_steps: contextual 3..12 steps with 20..600 characters each',()=>{for(const r of board.rows){assert.ok(r.farm_steps.length>=3&&r.farm_steps.length<=12);for(const s of r.farm_steps)assert.ok(typeof s==='string'&&s.trim().length>=20&&s.trim().length<=600);}});
test('screenshots: three real PNGs with accepted dimensions and byte caps',()=>{
 const list=readdirSync(join(out,'screenshots')).filter(n=>!n.startsWith('.'));assert.ok(list.length>=3&&list.length<=4);
 for(const name of list){const p=join(out,'screenshots',name),b=readFileSync(p);assert.ok(statSync(p).isFile());assert.ok(b.length<=524288);assert.equal(b.subarray(1,4).toString(),'PNG');const w=b.readUInt32BE(16),h=b.readUInt32BE(20);assert.ok(Math.max(w,h)<=1440&&Math.min(w,h)>=800);}
});
test('dossier_matches: canonical bytes, all source visible, under 1.5 MiB',()=>{
 const b=readFileSync(join(out,'dossier.json'));assert.deepEqual(b,Buffer.from(buildDossier(out,{text_max_bytes:65536})));assert.ok(b.length<=1572864);const d=JSON.parse(b.toString());assert.equal(d.images.length,3);assert.ok(!/whole files.*left out|lines not shown/.test(d.text));
});
test('dashboard data and submitted board are identical row-for-row',()=>{
 const script=readFileSync(join(out,'data.js'),'utf8');const data=JSON.parse(script.slice('window.RADAR='.length).trim().slice(0,-1));assert.deepEqual(data.rows,board.rows);assert.equal(data.as_of,snapshot.as_of);assert.equal(data.watch_count,snapshot.watchlist.length);
});
