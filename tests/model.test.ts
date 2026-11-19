// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildRadar, assertBoard, farmPlan, productLike, quantile } from '../lib/model.ts';
const file=process.env.RADAR_SNAPSHOT||new URL('../../../token-radar-01-kit/input/snapshot.json',import.meta.url);
const snapshot=JSON.parse(readFileSync(file,'utf8'));
const radar=buildRadar(snapshot);
const clone=()=>structuredClone(snapshot);
test('snapshot partition, coverage and monotone ranks satisfy board schema',()=>{
 assertBoard(radar,snapshot);
 assert.equal(radar.rows.length+radar.live.length+radar.excluded,snapshot.protocols.length);
 assert.equal(radar.watch_count,snapshot.watchlist.length);
 assert.ok(radar.rows.length>=100);
 assert.ok(new Set(radar.rows.map((r:any)=>r.implied_value_usd)).size>1);
});
test('same snapshot produces identical canonical JSON',()=>assert.equal(JSON.stringify(buildRadar(snapshot)),JSON.stringify(radar)));
test('names do not determine conditional valuations',()=>{
 const s=clone();s.protocols.forEach((p:any)=>{if(!productLike(p))p.name='Original Protocol';});
 const other=buildRadar(s);
 const map=new Map(other.rows.map((r:any)=>[r.slug,r.implied_value_usd]));
 for(const row of radar.rows)if(map.has(row.slug))assert.equal(map.get(row.slug),row.implied_value_usd);
});
test('valuation exactly reconstructs from unrounded factors',()=>{
 for(const r of radar.rows){assert.equal(r.implied_value_usd,Math.round(r.tvl_usd*r.multiple*r.momentum*r.maturity));assert.ok(r.low<r.implied_value_usd&&r.high>r.implied_value_usd);}
});
test('higher candidate TVL raises implied value linearly',()=>{
 const r=radar.rows.find((r:any)=>!r.symbol&&!r.gecko_id),s=clone();s.protocols.find((p:any)=>p.slug===r.slug).tvl_usd*=2;
 const updated=buildRadar(s).rows.find((p:any)=>p.slug===r.slug);
 assert.ok(Math.abs(updated.implied_value_usd/r.implied_value_usd-2)<1e-6);
});
test('momentum winsorization limits extreme growth',()=>{
 const s=clone();s.protocols.forEach((p:any)=>p.change_7d=1e9);
 for(const r of buildRadar(s).rows)assert.equal(r.momentum,1.1575);
 s.protocols.forEach((p:any)=>p.change_7d=-1e9);
 for(const r of buildRadar(s).rows)assert.equal(r.momentum,.8425);
});
test('unknown inputs are neutral and flagged, never NaN',()=>{
 const s=clone();s.protocols.forEach((p:any)=>{p.change_7d=null;p.listed_at=null;});
 const result=buildRadar(s);assertBoard(result,s);
 for(const r of result.rows){assert.equal(r.momentum,1);assert.equal(r.maturity,1);assert.equal(r.age_days,null);assert.ok(r.flags.includes('7d growth missing'));}
});
test('dates use snapshot clock rather than runtime clock',()=>{
 for(const r of radar.rows)if(r.listed_at)assert.equal(r.age_days,Math.max(0,Math.floor((Date.parse(snapshot.as_of)-Date.parse(r.listed_at))/86400000)));
});
test('future and malformed tracking dates cannot inflate maturity',()=>{
 const s=clone();s.protocols.forEach((p:any,i:number)=>p.listed_at=i%2?'2099-01-01':'not-a-date');
 const result=buildRadar(s);assertBoard(result,s);for(const r of result.rows)assert.equal(r.maturity,1);
});
test('required watchlist overrides related-product selection',()=>{
 const s=clone();const slug=s.watchlist[0];const p=s.protocols.find((p:any)=>p.slug===slug);p.category='Liquid Staking';
 const r=buildRadar(s).rows.find((r:any)=>r.slug===slug);assert.ok(r);assert.ok(r.flags.includes('Related-product review'));
});
test('token records and candidate set do not overlap absent required conflicts',()=>{
 const live=new Set(radar.live.map((p:any)=>p.slug));for(const r of radar.rows)if(!snapshot.watchlist.includes(r.slug))assert.ok(!live.has(r.slug));
});
test('peer calibration has positive support and bounded output',()=>{
 assert.ok(radar.model.peer_count>0);for(const r of radar.rows){assert.ok(r.multiple>=.08&&r.multiple<=4);assert.ok(r.peer_count>=0);assert.ok(r.maturity>=1&&r.maturity<=1.25);}
});
test('farm plans are legal length, contextual and explicitly conditional',()=>{
 for(const r of radar.rows){assert.equal(r.farm_steps.length,6);assert.ok(r.farm_steps.every((x:string)=>x.trim().length>=20&&x.trim().length<=600));assert.ok(r.farm_steps.join(' ').includes(r.name));assert.ok(r.farm_steps.join(' ').includes('$0'));assert.ok(r.farm_steps.join(' ').includes('4 weeks'));}
});
test('category plan branches discourage leverage and gate institutional access',()=>{
 const p={name:'Example',category:'Derivatives',chains:['Base'],symbol:null,gecko_id:null};assert.match(farmPlan(p)[2],/paper-trading/);
 assert.match(farmPlan({...p,category:'RWA'})[2],/KYC/);
 assert.match(farmPlan({...p,category:'Dexs'})[2],/slippage capped/);
 assert.match(farmPlan({...p,category:'CDP'})[2],/mint\/redeem/);
 assert.match(farmPlan({...p,category:'Restaking'})[2],/slashing/);
});
test('execution chain is selected from recorded support and fee assumptions agree',()=>{
 for(const r of radar.rows){assert.ok(r.chains.includes(r.plan_chain)||!r.chains.length);const fees=r.plan_chain==='Ethereum'?'$5–25':'$1–5';assert.ok(r.farm_steps[3].includes(fees));assert.ok(r.farm_steps[3].includes(r.plan_chain));}
});
test('Ethereum proposed-network fees differ from recorded lower-fee routes',()=>{
 const p={name:'Example',category:'Lending',chains:['Ethereum']};assert.match(farmPlan(p)[3],/\$5–25/);assert.match(farmPlan({...p,chains:['Ethereum','Base']})[3],/\$1–5/);
});
test('quantile interpolation and empty fallback are defined',()=>{assert.equal(quantile([1,2,3,4],.5),2.5);assert.equal(quantile([], .5),.6);});
test('bad snapshot, duplicate slug and missing watchlist input fail clearly',()=>{
 assert.throws(()=>buildRadar({}),/Invalid snapshot/);
 const s=clone();s.protocols.push(s.protocols[0]);assert.throws(()=>buildRadar(s),/Duplicate/);
 const t=clone();t.watchlist.push('missing-slug');assert.throws(()=>buildRadar(t),/Missing/);
});
