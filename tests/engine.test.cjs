'use strict';
const assert=require('node:assert/strict');const E=require('../app/engine.js');
let n=0;function test(name,fn){fn();console.log('PASS',name);n++;}
function fixtures(count=730){let day=new Date('2022-01-03T00:00:00Z'),rows=[];for(let i=0;i<count;i++){while([0,6].includes(day.getUTCDay()))day.setUTCDate(day.getUTCDate()+1);const t=day.toISOString().slice(0,10).replaceAll('-','');day.setUTCDate(day.getUTCDate()+1);let c=i<300?160-i*.2:100+Math.sin(i*.21)*.8;let v=1000000;
 if(i===650){c=110;v=12000000;}if(i>650){c=104+Math.sin(i*.3)*.3;v=200000;}if(i===700){c=113;v=3000000;}if(i>700)c=113+(i-700)*.7;
 rows.push({t,o:(c-.25)*100,h:(c+.6)*100,l:(c-.65)*100,c:c*100,v});}return rows;}
const bars=E.indicators(fixtures()),cfg={...E.DEFAULTS,minValue:0};
test('invalid candles and duplicate dates are normalized',()=>{const b=E.normalize([{t:'20260101',o:10,h:11,l:9,c:10,v:1},{t:'20260101',o:10,h:12,l:9,c:11,v:2},{t:'20260102',o:10,h:8,l:9,c:10,v:1}]);assert.equal(b.length,1);assert.equal(b[0].c,11);});
test('BB200 requires 200 historical bars',()=>{assert.equal(bars[198].ready,false);assert.equal(bars[199].ready,true);assert.equal(E.analyze(bars,150).phase,'DATA');});
test('setup and classifications never use future candles',()=>{const prefix=E.indicators(fixtures(701));for(const i of [250,500,650,699,700])assert.deepEqual(E.analyze(prefix,i,cfg),E.analyze(bars,i,cfg));});
test('prepared breakout fixture is recognized without ticker knowledge',()=>{const a=E.analyze(bars,700,cfg);assert(a.context.matured,JSON.stringify(a.context));assert.equal(a.signal,true);assert.equal(a.phase,'READY');});
test('volume spike alone cannot certify accumulation',()=>{const copy=fixtures();for(let i=651;i<700;i++){copy[i].c=9700;copy[i].o=9750;copy[i].h=9800;copy[i].l=9600;}const a=E.analyze(E.indicators(copy),700,cfg);assert.equal(a.signal,false);});
test('MA5 distance is not a hard exclusion',()=>{const a=E.analyze(bars,700,cfg);assert(a.ma5Distance>3);assert(a.signal);});
test('risk sizing includes fees and aggregate exposure',()=>{const a=E.sizeOrder({equity:1e7,cash:1e7,price:10000,stop:9000,settings:cfg});assert(a.qty>0);assert(a.risk<=50000);const wide=E.sizeOrder({equity:1e7,cash:1e7,price:10000,stop:8000,settings:cfg});assert(wide.qty<a.qty);const none=E.sizeOrder({equity:1e7,cash:1e7,price:10000,stop:10100,settings:cfg});assert.equal(none.qty,0);});
test('maximum position count blocks new buys',()=>{const positions=Array.from({length:5},()=>({qty:1,entryPrice:10000,stop:9000}));assert.equal(E.sizeOrder({equity:1e7,cash:1e7,price:10000,stop:9000,positions,settings:cfg}).qty,0);});
test('one quiet MA5 break is a pullback, not an exit',()=>{const b=bars.slice(0,704).map(x=>({...x}));b[703]={...b[703],c:11200,ma5:11500,v:100};const q=E.createPosition('ABC',bars,700,11300,10);const r=E.manage(q,b,703);assert.equal(r.exit,false);assert.equal(r.phase,'PULLBACK');});
test('broken structure always exits, including entry day',()=>{const q=E.createPosition('ABC',bars,700,11300,10),b=bars.slice(0,701).map(x=>({...x}));b[700].c=q.stop-1;const r=E.manage(q,b,700);assert(r.exit);assert.equal(r.phase,'FAIL');});
test('distribution plus falling highs/lows can make MA5 failure an exit',()=>{const q=E.createPosition('ABC',bars,700,11300,10),b=bars.slice(0,706).map(x=>({...x}));b[704]={...b[704],h:11600,l:11200,c:11300,ma5:11500,vol20:1000};b[705]={...b[705],h:11400,l:11000,c:11100,ma5:11400,v:2000,obv:b[700].obv-1000};const r=E.manage(q,b,705);assert(r.exit);});
test('future candle mutation cannot move current structural stop',()=>{const q=E.createPosition('ABC',bars,700,11300,10),copy=bars.map(x=>({...x}));copy[728].l=1;assert.deepEqual(E.manage(q,bars,720),E.manage(q,copy,720));});
test('minute bars must be same session, completed and recent',()=>{const rows=Array.from({length:5},(_,i)=>({t:'20260105'+'09'+String(i*5).padStart(2,'0'),o:100+i,h:101+i,l:99+i,c:100+i,v:100}));rows[4]={...rows[4],c:107,h:108};assert(E.minuteAnalysis(rows,'20260105',565,107).buy);assert(!E.minuteAnalysis(rows,'20260105',560,107).ready);assert(!E.minuteAnalysis(rows,'20260106',565,107).ready);assert(!E.minuteAnalysis(rows,'20260105',600,107).ready);});
test('backtest has trades and uses next open instead of signal close',()=>{const r=E.backtest({A:fixtures()},cfg),q=r.open[0]||r.trades[0];assert(q,JSON.stringify(r.stats));const entry=q.entryT||q.start;assert.notEqual(entry,bars[700].t);assert(r.curve.every(x=>Number.isFinite(x.equity)));});
test('backtest past equity is invariant under future data extension',()=>{const short=E.backtest({A:fixtures(710)},cfg),long=E.backtest({A:fixtures(730)},cfg);assert.deepEqual(short.curve,long.curve.slice(0,short.curve.length));});
test('preference memories never relabel financial success',()=>{const a=E.analyze(bars,700,cfg);const notes=[{role:'avoid',note:'positive return but unacceptable path',features:a.context,ret:50}];assert.equal(E.similarity(a.context,notes)[0].role,'avoid');});
test('1–3 day pullback recovery emits a fresh re-entry trigger',()=>{
 const raw=fixtures(708),prices={701:114,702:115,703:116,704:113,705:112,706:117};
 for(const [key,c]of Object.entries(prices)){const i=+key;raw[i]={...raw[i],o:(c-.25)*100,h:(c+.6)*100,l:(c-.65)*100,c:c*100,v:150000};}
 const b=E.indicators(raw),r=E.recovery(b,706);assert(r?.quick,JSON.stringify(r));assert(E.analyze(b,706,cfg).signal);
});
test('double bottom recovery is detected from completed past lows',()=>{
 const raw=fixtures(711),prices={701:114,702:113,703:112,704:113.5,705:114,706:113,707:112.1,708:113,709:115};
 for(const [key,c]of Object.entries(prices)){const i=+key;raw[i]={...raw[i],o:(c-.25)*100,h:(c+.6)*100,l:(c-.65)*100,c:c*100,v:150000};}
 const b=E.indicators(raw),r=E.recovery(b,709);assert(r?.doubleBottom,JSON.stringify(r));
 raw[705]={...raw[705],o:9900,h:10000,l:9800,c:9900};assert.equal(E.recovery(E.indicators(raw),709),null);
});
console.log(`${n} new-engine tests passed`);
module.exports={fixtures};

