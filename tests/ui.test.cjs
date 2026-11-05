const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');

const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');const artifacts=path.join(root,'work','test-output');fs.mkdirSync(artifacts,{recursive:true});const {fixtures}=require(root+'/tests/engine.test.cjs');
(async()=>{
 const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(path.resolve(root)+path.sep)){res.writeHead(403);return res.end();}try{res.setHeader('Content-Type',p.endsWith('.js')?'application/javascript':p.endsWith('.css')?'text/css':p.endsWith('.html')?'text/html;charset=utf-8':'application/json');res.end(fs.readFileSync(p));}catch(_){res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1600,height:1100}}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>{requests.push(r.request().url());const u=new URL(r.request().url());if(u.port===String(server.address().port))return r.continue();return r.abort();});
 await page.goto(`http://127.0.0.1:${server.address().port}/partisan_investment.html`,{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'가격보다 먼저, 흐름을 보세요.'}).waitFor();assert.deepEqual(errors,[]);
 const series=Object.fromEntries(['067310','085660','214430','383220','251270','005930'].map(code=>[code,{name:'가상 검증 자료',bars:fixtures()}]));
 await page.locator('#fileInput').setInputFiles({name:'fixtures.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({series}))});await page.waitForFunction(()=>document.querySelector('#chartEmpty').hidden);
 await page.locator('#connectionStatus').evaluate(el=>el.textContent='● 가상 데이터로 화면 검증 중');
 await page.screenshot({path:artifacts+'/v2-desktop.png',fullPage:true});
 const canvas=page.locator('#chart'),rect=await canvas.boundingBox();
 await page.keyboard.down('Shift');await page.mouse.move(rect.x+rect.width*.35,rect.y+100);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.60,rect.y+110,{steps:8});await page.mouse.up();await page.keyboard.up('Shift');
 await page.locator('#annotationDialog').waitFor({state:'visible'});await page.locator('#annotationRole').selectOption('hold');await page.locator('#annotationNote').fill('작은 봉의 지지 유지 · 5일선 단독 손절 아님');await page.locator('#annotationForm button[type=submit], #annotationForm button.primary').click();
 await page.locator('[data-page=lab]').click();assert(await page.locator('#annotationsList').innerText().then(x=>x.includes('작은 봉')));
 await page.locator('#backtestBtn').click();await page.waitForFunction(()=>document.querySelector('#backtestResult').textContent.includes('완료 거래'),null,{timeout:60000});
 await page.screenshot({path:artifacts+'/v2-lab.png',fullPage:true});
 await page.locator('[data-page=portfolio]').click();assert((await page.locator('#portfolioStats').innerText()).includes('10,000,000'));
 await page.locator('#settingsBtn').click();await page.locator('input[name=riskPct]').fill('0.7');await page.locator('#settingsForm > button.primary').click();
 await page.reload({waitUntil:'networkidle'});await page.locator('#settingsBtn').click();assert.equal(await page.locator('input[name=riskPct]').inputValue(),'0.7');await page.locator('#settingsDialog [data-close]').click();
 await page.locator('#connectBtn').click();await page.locator('#bridgeToken').fill('DO-NOT-PERSIST-TEST-TOKEN');await page.locator('#connectDialog [data-close]').click();const stored=await page.evaluate(()=>JSON.stringify({...localStorage}));assert(!stored.includes('DO-NOT-PERSIST-TEST-TOKEN'));
 assert(!requests.some(u=>new URL(u).pathname.startsWith('/trade/')));assert.deepEqual(errors,[]);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:artifacts+'/v2-mobile.png',fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 console.log('UI PASS: empty state, import/cache, chart range, annotation persistence, worker backtest, portfolio, settings, token isolation, mobile overflow');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
