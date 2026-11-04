// Run: node tools/test_strategy.cjs — pure engine regression tests; no bridge, orders or user state.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'partisan_investment.html'), 'utf8');
function fn(name) {
  const start = html.indexOf(`    function ${name}(`);
  assert(start >= 0, name);
  const lineEnd = html.indexOf('\n', start);
  const end = html.slice(start, lineEnd).trimEnd().endsWith('}') ? lineEnd : html.indexOf('\n    }', start) + 6;
  return html.slice(start, end);
}
const defaults = html.slice(html.indexOf('    const DEFAULTS ='), html.indexOf('    const SETTING_DEFS ='));
const ctx = vm.createContext({assert, console});
vm.runInContext(defaults + `
const state={cfg:{...DEFAULTS},data:{},marks:[]};
const STOP_NAMES={BREAK:'돌파',TREND:'추세',BOX:'박스'};
const won=String, ruleOn=()=>null, sectorOf=()=>null, fmtDate=String;
const styleModel={m:null};
let clock={ymd:'20261231',min:940};const kstNow=()=>clock;
const executionMinutes={};
const coreBreakout=(bars,i)=>!!bars[i].signal;
const FEAT_NAMES=Array(9).fill('feature');
let rowsForTraining=[];
const btTrades=()=>rowsForTraining, myTrades=()=>[];
`, ctx);
const names=['costBuy','costSell','seqBuy','tpTarget','seqSellHalf','seqSellAll','maN','stepSeq','stopPrice','exitOrStop','exitSignal','plannedRisk','entryRiskBudget','widthLow','squeezeCore','featuresAt','preferenceMatch','featVec','trainStyle','mlpForward','aucOf','predictWin','pullbackSignal','isBreakout','minuteEvidence'];
vm.runInContext(names.map(fn).join('\n'),ctx);
let count=0;
function test(name, code) {vm.runInContext(`{ state.cfg={...DEFAULTS,buyFee:0,sellFee:0,taxPct:0,slipPct:0}; ${code} }`,ctx);console.log('PASS',name);count++;}
const seq=`{code:'A',slot:10000,stage:1,qty:10,avg:100,invested:1000,proceeds:0,extreme:120,pullbackSeen:true,startT:'20260101',startIdx:0,entries:[],exits:[],stopLow:90}`;
test('zero cash never advances an entry stage', `const q=${seq}; assert.equal(seqBuy(q,100,.5,'','20260103',0),0);assert.equal(q.stage,1);`);
test('trend exit wins over an add-on rebound', `state.cfg.w2=50; state.cfg.exitMa=3;const q=${seq};const b=[{t:'20260101',c:120},{t:'20260102',c:90},{t:'20260103',o:94,c:95,h:99,l:93,mid:90}];const r=stepSeq(q,b,2);assert.equal(r.exited,true);assert.equal(q.entries.length,0);`);
test('approval mode never executes an add-on', `state.cfg.w2=50;state.cfg.exitMa=3;const q=${seq};const b=[{t:'20260101',c:100},{t:'20260102',c:99},{t:'20260103',o:101,c:105,h:108,l:99,mid:95}];const r=stepSeq(q,b,2,{skipExit:true});assert.equal(r.cash,0);assert.equal(q.qty,10);`);
test('risk distance caps quantity instead of using a price percentage stop', `const q=${seq};q.qty=0;q.invested=0;q.stage=0;q.riskBudget=50;seqBuy(q,100,1,'','20260101');assert.equal(q.qty,5);assert.equal(plannedRisk(q),50);`);
test('risk cap includes costs and blocks a missing stop', `state.cfg.buyFee=1;state.cfg.sellFee=1;const q=${seq};q.qty=0;q.invested=0;q.riskBudget=50;seqBuy(q,100,1,'','20260101');assert.equal(q.qty,4);assert(plannedRisk(q)<=50);state.cfg.stopMode='NONE';const before=q.qty;assert.equal(seqBuy(q,100,.5,'','20260102'),0);assert.equal(q.qty,before);`);
test('portfolio risk reserves subsequent planned entries', `state.cfg.riskPct=1;state.cfg.totalRiskPct=2;const q=${seq};q.riskBudget=150;assert.equal(entryRiskBudget(10000,{A:q}),50);assert.equal(entryRiskBudget(10000,{A:q,B:q}),0);`);
test('pivot uses two completed right bars and never lowers stop', `state.cfg.stopMode='TREND';const q=${seq};const b=[110,108,100,106,107,108,99,104,105,106].map((l,i)=>({t:'202601'+String(i+1).padStart(2,'0'),l,c:115}));exitOrStop(q,b,4);assert.equal(stopPrice(q),90);exitOrStop(q,b,5);assert.equal(stopPrice(q),100);exitOrStop(q,b,9);assert.equal(stopPrice(q),100);`);
test('future candles do not affect current trend stop', `state.cfg.stopMode='TREND';const a=${seq},q=${seq};const b=[110,108,100,106,107,108].map((l,i)=>({t:'202601'+String(i+1).padStart(2,'0'),l,c:115}));exitOrStop(a,b,5);exitOrStop(q,b.concat([{t:'20260107',l:999,c:1000}]),5);assert.equal(stopPrice(a),stopPrice(q));`);
test('contraction rejects parallel rising bands', `const b=Array.from({length:800},(_,i)=>({ready:true,mid:100,upper:110,lower:90,h:110,l:90,c:100}));state.cfg.sqDrop=0;state.cfg.sqZone=100;state.cfg.sqConverge=true;assert.equal(squeezeCore(b,799,100),false);b[799].upper=109;b[799].lower=91;assert.equal(squeezeCore(b,799,100),true);`);
test('decline must occur before the consolidation window', `const b=Array.from({length:800},()=>({ready:true,mid:100,upper:110,lower:90,h:110,l:90,c:100}));state.cfg.sqDrop=30;state.cfg.sqZone=100;state.cfg.sqOrdered=true;b[750].h=200;assert.equal(squeezeCore(b,799,100),false);b[750].h=110;b[400].h=200;b[401].l=100;assert.equal(squeezeCore(b,799,100),true);`);
test('preferred losing examples remain preferences, not return-model labels', `const f={dayChg:1,toUpper:2,ma5gap:3,volRatio:1};state.marks=Array.from({length:3},(_,i)=>({tf:'D',label:'good',ctx:f,exitCtx:f,name:'예시',a:'20260101',b:'20260102',ret:-20}));const r=preferenceMatch(f);assert.equal(r.good,3);rowsForTraining=[];assert(trainStyle().error);state.marks=[];assert.equal(preferenceMatch(f),null);`);
test('low quality or legacy models cannot predict wins', `styleModel.m={version:2,auc:.54,bins:[]};assert.equal(predictWin({}),null);styleModel.m={version:1,auc:.9,bins:[]};assert.equal(predictWin({}),null);`);
test('training purges trades crossing the validation boundary', `rowsForTraining=Array.from({length:80},(_,i)=>({start:String(20200101+i),end:String(20200101+i),ret:i%2?1:-1,dayChg:i%2}));rowsForTraining[0].end='20201231';const m=trainStyle();assert.equal(m.version,2);assert.equal(m.n,79);assert.equal(m.test,20);`);
test('one weak close does not trigger a two-close exit', `state.cfg.exitMa=2;state.cfg.exitConfirm=2;const b=[{c:100},{c:110},{c:105,t:'20260103'}];assert.equal(exitSignal(b,2).hit,false);b.push({c:100,t:'20260104'});assert.equal(exitSignal(b,3).hit,true);`);
test('unfinished today is not counted as a confirmed daily close', `state.cfg.exitMa=2;state.cfg.exitConfirm=2;clock={ymd:'20260104',min:910};const b=[{c:100},{c:110},{c:105,t:'20260103'},{c:100,t:'20260104'}];assert.equal(exitSignal(b,3).hit,false);clock.min=940;assert.equal(exitSignal(b,3).hit,true);clock={ymd:'20261231',min:940};`);
test('grace never disables structural invalidation', `state.cfg.exitGrace=3;const q=${seq};const b=[{c:100,t:'20260101'},{c:85,t:'20260102'}];assert.equal(exitOrStop(q,b,1).stop,true);`);
test('post-breakout MA5 support is eligible only inside the configured window', `state.cfg.pullbackDays=3;const b=Array.from({length:8},(_,i)=>({t:String(i),c:100,o:100,l:99,h:102,signal:false}));b[5].signal=true;b[5].l=95;b[6]={c:99,o:100,l:98,h:100};b[7]={c:102,o:100,l:100,h:103};assert.equal(pullbackSignal(b,7),5);assert.equal(isBreakout(b,7),true);state.cfg.pullbackDays=1;assert.equal(pullbackSignal(b,7),null);`);
test('a rising 5-minute breakout must be fresh and above VWAP', `clock={ymd:'20260105',min:565};executionMinutes.A={at:Date.now(),bars:[{t:'202601050900',h:101,l:99,c:100,v:100},{t:'202601050905',h:102,l:100,c:101,v:100},{t:'202601050910',h:103,l:101,c:102,v:100},{t:'202601050915',h:106,l:102,c:105,v:100}]};assert.equal(minuteEvidence('A',105).pass,true);assert.equal(minuteEvidence('A',99).pass,false);executionMinutes.A.at-=130000;assert.equal(minuteEvidence('A',105).ready,false);clock={ymd:'20261231',min:940};`);
console.log(count+' strategy regression tests passed');

