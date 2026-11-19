// SPDX-License-Identifier: MIT
// Optional development accessibility and hostile-state audit.
const {chromium}=require('playwright');
const {resolve,join}=require('node:path');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const url=pathToFileURL(join(resolve(process.argv[2]||'out'),'dashboard/index.html')).href;
 const page=await browser.newPage({viewport:{width:1440,height:1200}});
 const audit=[];
 try{
  for(const width of [1440,390]) for(const hash of ['', '#view=detail&slug=symbiotic', '#view=model', '#view=live']){
   await page.setViewportSize({width,height:width===1440?1200:844});
   await page.goto(url+hash);await page.waitForSelector('h1');await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
   const result=await page.evaluate(async()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));
   audit.push({width,route:hash||'board',violations:result.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});
  }
  const hostile=await browser.newPage();
  await hostile.addInitScript(()=>{
   let data;Object.defineProperty(window,'RADAR',{configurable:true,get(){return data;},set(v){
    v.rows[0].name='<img src=x onerror="window.__xss=true">';
    v.rows[0].category='<script>window.__xss=true</script>';
    data=v;
   }});
  });
  await hostile.goto(url);await hostile.waitForSelector('tbody tr');
  assert.equal(await hostile.evaluate(()=>Boolean(window.__xss)),false);
  assert.equal(await hostile.locator('tbody img,tbody script').count(),0);
  assert.match(await hostile.locator('tbody tr').first().innerText(),/<img src=x/);
  await hostile.close();
  console.log(JSON.stringify({audit,xss:'passed'},null,2));
  assert.equal(audit.reduce((s,a)=>s+a.violations.length,0),0,'Accessibility violations require review');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
