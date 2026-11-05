/* Partisan 2 — pure, causal strategy engine. No I/O, orders, ticker exceptions or future labels. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PartisanEngine=api;})(globalThis,function(){
'use strict';
const VERSION='2.0';
const DEFAULTS=Object.freeze({capital:10000000,riskPct:.5,totalRiskPct:2,maxPositionPct:20,maxPositions:5,minValue:10,feePct:.01,taxPct:.2,slipPct:.05,confirmation:2,minuteRequired:true});
const PHASES=Object.freeze({DATA:{name:'자료 부족',color:'#94a3b8',action:'200일 이상 시세를 먼저 확보하세요'},BASE:{name:'기반 형성',color:'#8b97a7',action:'가격 정리와 이전 상승 흔적을 관찰하세요'},WAIT:{name:'첫 시도 · 대기',color:'#b48239',action:'상단 접근만으로 진입하지 말고 지지·재돌파를 기다리세요'},READY:{name:'준비된 돌파',color:'#087f77',action:'분봉과 구조 손절 거리로 진입 가격을 점검하세요'},HOLD:{name:'추세 유지',color:'#358a94',action:'5일선 흔들림보다 지지 구조와 거래 흐름을 보세요'},PULLBACK:{name:'정상 눌림 후보',color:'#738ac1',action:'줄어든 매도 거래량과 지지 회복을 확인하세요'},WEAK:{name:'힘 약화',color:'#c78040',action:'추가 매수를 멈추고 반등 실패 여부를 확인하세요'},FAIL:{name:'구조 훼손',color:'#b85b63',action:'보유분의 축소·청산 계획을 확인하세요'}});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const min=a=>a.length?Math.min(...a):null,max=a=>a.length?Math.max(...a):null;
const med=a=>{if(!a.length)return null;const b=a.slice().sort((x,y)=>x-y);return b[Math.floor(b.length/2)];};
function normalize(rows){
 const byDate=new Map();
 for(const r of rows||[]){const b={t:String(r.t),o:+r.o,h:+r.h,l:+r.l,c:+r.c,v:+r.v};
  if(!/^\d{8}(\d{4}(\d{2})?)?$/.test(b.t)||![b.o,b.h,b.l,b.c,b.v].every(Number.isFinite)||Math.min(b.o,b.h,b.l,b.c)<=0||b.v<0||b.h<Math.max(b.o,b.c)||b.l>Math.min(b.o,b.c)||b.h<b.l)continue;
  byDate.set(b.t,b);
 }
 return [...byDate.values()].sort((a,b)=>a.t.localeCompare(b.t));
}
function indicators(rows){
 const bars=normalize(rows);let sum=0,sq=0,obv=0;const sums={5:0,20:0,60:0};let volume=0,money=0,mf=0,tr=0;
 for(let i=0;i<bars.length;i++){
  const b=bars[i],p=bars[i-1];sum+=b.c;sq+=b.c*b.c;if(i>=200){sum-=bars[i-200].c;sq-=bars[i-200].c**2;}
  const mid=sum/Math.min(i+1,200),sd=Math.sqrt(Math.max(0,sq/Math.min(i+1,200)-mid*mid));
  b.mid=mid;b.upper=mid+2*sd;b.lower=mid-2*sd;b.ready=i>=199;b.width=mid>0?4*sd/mid:null;
  for(const n of [5,20,60]){sums[n]+=b.c;if(i>=n)sums[n]-=bars[i-n].c;b['ma'+n]=i>=n-1?sums[n]/n:null;}
  b.tr=p?Math.max(b.h-b.l,Math.abs(b.h-p.c),Math.abs(b.l-p.c)):b.h-b.l;
  tr+=b.tr;if(i>=20)tr-=bars[i-20].tr;b.atr=i>=19?tr/20:null;
  if(p)obv+=b.c>p.c?b.v:b.c<p.c?-b.v:0;b.obv=obv;
  b.mf=b.h>b.l?(2*b.c-b.h-b.l)/(b.h-b.l)*b.v:0;
  volume+=b.v;money+=b.v*b.c;mf+=b.mf;
  if(i>=20){volume-=bars[i-20].v;money-=bars[i-20].v*bars[i-20].c;mf-=bars[i-20].mf;}
  b.vol20=volume/Math.min(i+1,20);b.value20=money/Math.min(i+1,20)/1e8;b.cmf=volume>0?mf/volume:null;
  b.gap=p?b.o/p.c-1:0;b.dataBreak=!!p&&Math.abs(b.c/p.c-1)>.31;
 }
 return bars;
}
// All setup evidence stops at i-1. The current candle only confirms or rejects the trigger.
function context(bars,i){
 if(i<200||!bars[i]?.ready)return null;
 const b=bars[i],p=bars[i-1],from=Math.max(199,i-120),prior=bars.slice(from,i),base=bars.slice(i-15,i),recent=bars.slice(i-10,i);
 const pivots=[];
 for(let k=from+2;k<=i-4;k++){
  const x=bars[k];if(x.h>=bars[k-1].h&&x.h>bars[k-2].h&&x.h>=bars[k+1].h&&x.h>bars[k+2].h&&x.h>=x.upper*.90)pivots.push(k);
 }
 const peakIndex=pivots.length?pivots.reduce((a,k)=>bars[k].h>=bars[a].h?k:a,pivots[0]):null;
 const resistance=peakIndex==null?max(prior.map(x=>x.h)):bars[peakIndex].h;
 const since=peakIndex==null?[]:bars.slice(peakIndex+1,i);
 const holdRatio=since.length?min(since.map(x=>x.c))/resistance:null;
 const atr=p.atr||p.c*.02,body=med(recent.map(x=>Math.abs(x.c-x.o)));
 const small=body<=atr*.65;
 const baseRange=(max(base.map(x=>x.h))-min(base.map(x=>x.l)))/p.c;
 const rangePrior=bars.slice(i-45,i-15),oldRange=(max(rangePrior.map(x=>x.h))-min(rangePrior.map(x=>x.l)))/p.c;
 const compact=baseRange<=Math.max(.08,oldRange*.65);
 const beforePeak=peakIndex==null?null:bars[Math.max(0,peakIndex-20)].obv;
 const peakObv=peakIndex==null?null:max(bars.slice(Math.max(0,peakIndex-5),peakIndex+1).map(x=>x.obv));
 const retention=peakObv!=null&&peakObv>beforePeak?(p.obv-beforePeak)/(peakObv-beforePeak):null;
 const flowHeld=retention!=null?retention>=.5:(p.cmf!=null&&p.cmf>.05&&p.obv>=bars[i-20].obv);
 const volumeAttempt=pivots.some(k=>k>=20&&bars[k].v>=bars[k-1].vol20*1.5);
 const widths=bars.slice(Math.max(199,i-250),i).map(x=>x.width);
 const percentile=widths.filter(x=>x<p.width).length/widths.length;
 const compressed=percentile<=.35||p.width<=bars[Math.max(199,i-60)].width*.8;
 const priceHeld=holdRatio!=null&&holdRatio>=.86&&p.c>=resistance*.90;
 const matured=peakIndex!=null&&i-peakIndex>=5&&priceHeld&&(small||compact)&&flowHeld;
 const priorHigh=max(bars.slice(Math.max(0,i-500),i-60).map(x=>x.h));
 const decline=priorHigh?1-min(prior.map(x=>x.l))/priorHigh:0;
 const baseSupport=min(base.map(x=>x.l))-.25*atr;
 const quality=clamp((priceHeld?25:0)+(small?15:0)+(compact?10:0)+(flowHeld?25:0)+(compressed?15:0)+(volumeAttempt?10:0),0,100);
 return {resistance,peakIndex,holdRatio,retention,small,compact,compressed,percentile,flowHeld,volumeAttempt,priceHeld,matured,quality,decline,baseSupport,atr,baseRange};
}
// Recovery is a new causal trigger, not an instruction to rebuy a losing position.
function recovery(bars,i){
 if(i<220)return null;const b=bars[i],p=bars[i-1];
 if(!(b.c>b.ma5&&p.c<=p.ma5&&b.c>p.h&&b.c>b.o))return null;
 let origin=null;
 for(let k=i-2;k>=Math.max(200,i-40);k--){if(bars[k].c>bars[k].upper&&bars[k-1].c<=bars[k-1].upper){const x=context(bars,k);if(x?.matured){origin=k;break;}}}
 if(origin==null)return null;const anchor=context(bars,origin),span=bars.slice(origin,i+1);
 if(span.some(z=>z.c<anchor.baseSupport))return null;
 const lows=[];for(let k=origin+1;k<=i-2;k++)if(bars[k].l<bars[k-1].l&&bars[k].l<=bars[k+1].l)lows.push(k);
 let doubleBottom=false;for(let a=0;a<lows.length;a++)for(let z=a+1;z<lows.length;z++){
  const first=lows[a],second=lows[z],atr=p.atr||p.c*.02;
  if(second-first>=3&&second-first<=15&&i-second<=5&&Math.abs(bars[first].l-bars[second].l)<=atr*.8&&max(bars.slice(first+1,second).map(x=>x.h))-bars[first].l>=atr)doubleBottom=true;
 }
 let below=0;for(let k=i-1;k>=origin&&bars[k].c<bars[k].ma5;k--)below++;
 const quick=below>=1&&below<=3;
 const contraction=avg(bars.slice(Math.max(origin,i-3),i).map(x=>x.v))<=bars[Math.max(origin,i-4)].vol20*1.1;
 const flow=b.obv>=min(bars.slice(Math.max(origin,i-10),i).map(x=>x.obv))&&b.cmf!=null&&b.cmf>=-.05;
 return (doubleBottom||quick)&&contraction&&flow?{origin,doubleBottom,quick,support:anchor.baseSupport,reason:doubleBottom?'작은 조정 뒤 쌍바닥·5일선 회복':'1~3일 조정 뒤 5일선·직전 고가 회복'}:null;
}
function analyze(bars,i,settings=DEFAULTS){
 const b=bars[i],p=bars[i-1],x=context(bars,i);
 if(!x)return {phase:'DATA',signal:false,reasons:['BB200 계산을 위한 과거 자료가 부족합니다'],action:PHASES.DATA.action};
 if(bars.slice(Math.max(1,i-200),i+1).some(z=>z.dataBreak))return {phase:'DATA',signal:false,reasons:['가격 단절이 있어 수정주가 확인이 필요합니다'],action:PHASES.DATA.action};
 const above=b.c>b.upper,trigger=above&&b.c>b.o&&(p.c<=p.upper||(b.c>x.resistance&&p.c<=x.resistance));
 const recentCross=bars.slice(Math.max(200,i-20),i).some((z,n)=>z.c>z.upper&&bars[Math.max(200,i-20)+n-1].c<=bars[Math.max(200,i-20)+n-1].upper);
 const liquidity=b.value20>=(settings.minValue??DEFAULTS.minValue);
 const rebound=recovery(bars,i);
 const signal=(trigger&&x.matured&&(x.compressed||x.compact)||!!rebound)&&liquidity;
 const supportBroken=b.c<x.baseSupport;
 const selling=b.v>p.vol20*1.2&&b.c<p.c&&b.cmf!=null&&b.cmf<0;
 const lower=b.h<p.h&&b.l<p.l;
 let phase='BASE';
 if(supportBroken&&selling)phase='FAIL';
 else if(signal)phase='READY';
 else if(recentCross&&b.c<b.ma5&&lower&&selling)phase='WEAK';
 else if(recentCross&&b.c<b.ma5&&b.c>=x.baseSupport&&b.v<p.vol20&&!selling)phase='PULLBACK';
 else if(above&&x.flowHeld&&b.c>=b.ma20)phase='HOLD';
 else if(above||b.h>=b.upper*.97)phase='WAIT';
 const reasons=[...(rebound?[rebound.reason+' — 신규 회복 신호']:[]),x.peakIndex==null?'앞선 상단 부근 상승 시도가 뚜렷하지 않음':`이전 상승 시도 후 ${i-x.peakIndex}거래일 경과`,
  x.priceHeld?'이전 상승 이후 가격대 유지':'이전 상승 이후 가격 유지가 충분하지 않음',
  x.small?'최근 봉 몸통이 변동폭 대비 작음':'최근 봉의 변동폭이 아직 큼',
  x.flowHeld?'거래량 누적·자금 흐름 유지 근거 있음':'거래량 누적 유지 근거 부족',
  x.volumeAttempt?'과거 상승 시도에 거래량 증가 흔적':'과거 거래량 급증 흔적 부족 — 조용한 상승은 별도 관찰',
  x.compressed?'장기 밴드 폭이 상대적으로 좁음':'밴드 수축 확인 부족'];
 if(!liquidity)reasons.push('평균 거래대금이 검색 기준 미달');
 const risk=b.c>x.baseSupport?(b.c-x.baseSupport)/b.c*100:null;
 return {phase,signal,recovery:rebound,context:x,reasons,action:PHASES[phase].action,support:x.baseSupport,resistance:x.resistance,riskPct:risk,ma5Distance:(b.c-b.ma5)/b.c*100,
  ma5Meaning:b.c>=b.ma5?'5일선 위':phase==='PULLBACK'?'5일선 아래지만 지지 유지·거래량 감소':phase==='WEAK'?'5일선 아래 + 낮아지는 고저점·매도 거래량':'5일선 이탈만으로 매도 확정하지 않음'};
}
function segments(analysis,start=0){const out=[];for(let i=start;i<analysis.length;i++){const phase=analysis[i].phase,last=out.at(-1);if(last&&last.phase===phase)last.end=i;else out.push({phase,start:i,end:i});}return out;}
function timeline(bars,settings=DEFAULTS){return bars.map((_,i)=>analyze(bars,i,settings));}
function createPosition(code,bars,i,price,qty){
 const a=analyze(bars,i,{...DEFAULTS,minValue:0}),x=a.context;if(!x||!(qty>0&&price>x.baseSupport))return null;
 return {code,entryT:bars[i].t,entryPrice:price,qty,initialQty:qty,initialStop:x.baseSupport,stop:x.baseSupport,resistance:x.resistance,entryUpper:bars[i-1].upper,entryObv:bars[i-1].obv,entryAtr:x.atr,entryQuality:x.quality};
}
// 5-day MA is a diagnostic trigger, not a universal exit. A broken structure always wins.
function manage(position,bars,i,minutes=null,settings=DEFAULTS){
 const q={...position},b=bars[i],start=bars.findIndex(x=>x.t===q.entryT);
 if(start<0||i<start)return {position:q,exit:false,phase:'DATA',reason:'진입일 자료 없음'};
 const held=i-start,stop=q.stop||q.initialStop;
 if(held>=20){for(let k=Math.max(start+5,i-30);k<=i-6;k++){
  const l=bars[k].l,neighbors=bars.slice(k-5,k).concat(bars.slice(k+1,k+6));
  if(neighbors.every(z=>z.l>l))q.stop=Math.max(q.stop,l-.25*(bars[k].atr||q.entryAtr));
 }}
 if(b.c<q.stop)return {position:q,exit:true,phase:'FAIL',reason:'확인된 지지 구조 아래 — 손실 확대 방지',stop:q.stop};
 if(held===0)return {position:q,exit:false,phase:'HOLD',reason:'진입일 · 지지 구조 관찰',stop:q.stop};
 const p=bars[i-1],lowVolume=b.v<p.vol20,below5=b.c<b.ma5,lower=b.h<p.h&&b.l<p.l;
 const obvWeak=b.obv<bars[Math.max(start,i-5)].obv,flowWeak=b.cmf!=null&&b.cmf<0;
 const distribution=b.c<p.c&&b.v>=p.vol20*1.2&&obvWeak;
 const n=Math.max(2,settings.confirmation||2),closed=bars.slice(Math.max(start+1,i-n+(settings.live?0:1)),i+(settings.live?0:1));
 const failedRetest=closed.length===n&&closed.every(z=>z.c<q.resistance&&z.c<z.ma20)&&lower&&(flowWeak||distribution);
 const weakFive=held>=3&&below5&&lower&&distribution&&p.c<p.ma5;
 const minuteFailure=minutes?.ready&&minutes.sellPressure&&below5&&obvWeak&&lower;
 if(failedRetest||weakFive||minuteFailure)return {position:q,exit:true,phase:'WEAK',reason:failedRetest?'전고점 회복 실패 + 중기선 아래 유지 + 흐름 약화':weakFive?'5일선 이탈에 매도 거래량·고저점 하락이 함께 확인됨':'일봉 힘 약화와 분봉 지지 회복 실패가 겹침',stop:q.stop};
 if(below5&&lowVolume&&!distribution)return {position:q,exit:false,phase:'PULLBACK',reason:'5일선 이탈 · 매도 거래량 감소, 구조 지지 유지',stop:q.stop};
 if(below5)return {position:q,exit:false,phase:'WAIT',reason:'5일선 이탈만 확인 — 지지 회복·매도 거래량 추가 확인',stop:q.stop};
 return {position:q,exit:false,phase:'HOLD',reason:'추세 지지 유지 — 고정 수익률 익절 없이 관찰',stop:q.stop};
}
function minuteAnalysis(rows,day,minute,price){
 const mins=t=>+t.slice(8,10)*60+(+t.slice(10,12));
 const bars=normalize(rows).filter(x=>x.t.length>=12&&x.t.slice(0,8)===day&&mins(x.t)>=540&&mins(x.t)+5<=minute);
 if(bars.length<5)return {ready:false,buy:false,sellPressure:false,reason:'당일 확정 5분봉 5개 이상 필요'};
 const b=bars.at(-1),p=bars.at(-2),q=bars.at(-3),volume=bars.reduce((s,x)=>s+x.v,0);
 if(minute-mins(b.t)-5>10||!volume)return {ready:false,buy:false,sellPressure:false,reason:'오래된 분봉 또는 거래량 없음'};
 const vwap=bars.reduce((s,x)=>s+(x.h+x.l+x.c)/3*x.v,0)/volume;
 const higher=b.l>=p.l&&b.c>p.h,buy=higher&&price>=vwap&&price>=b.c*.995;
 const sellPressure=b.l<p.l&&p.l<q.l&&b.h<p.h&&p.h<q.h&&price<vwap&&b.c<p.c;
 return {ready:true,buy,sellPressure,vwap,support:min(bars.slice(-5).map(x=>x.l)),reason:buy?'저점 상승·전고점 재돌파·거래량 가중 평균 회복':sellPressure?'반등 고점·저점 하락·거래량 가중 평균 아래':'분봉 방향 미확정 — 지지 회복을 기다림'};
}
function sizeOrder({equity,cash,price,stop,positions=[],settings=DEFAULTS}){
 if(![equity,cash,price,stop].every(Number.isFinite)||equity<=0||price<=0||stop<=0||stop>=price)return {qty:0,reason:'진입가·구조 손절선을 확인하세요'};
 if(positions.length>=settings.maxPositions)return {qty:0,reason:'최대 보유 종목 수 도달'};
 const buyCost=(settings.feePct+settings.slipPct)/100,sellCost=(settings.feePct+settings.taxPct+settings.slipPct)/100;
 const perShare=price*(1+buyCost)-stop*(1-sellCost);
 const used=positions.reduce((s,q)=>s+Math.max(0,(q.entryPrice*(1+buyCost)-(q.stop||0)*(1-sellCost))*q.qty),0);
 const budget=Math.max(0,Math.min(equity*settings.riskPct/100,equity*settings.totalRiskPct/100-used));
 const qty=Math.max(0,Math.floor(Math.min(budget/perShare,cash/(price*(1+buyCost)),equity*settings.maxPositionPct/100/(price*(1+buyCost)))));
 return {qty,stop,price,perShare,risk:qty*perShare,budget,cost:qty*price*(1+buyCost),riskPct:(price-stop)/price*100,reason:qty?'구조 손절 거리·계좌 위험 예산으로 산정':'위험 예산 또는 현금 부족'};
}
function backtest(series,settings=DEFAULTS){
 const c={...DEFAULTS,...settings},prepared={},lookup={},dates=new Set();
 for(const [code,rows] of Object.entries(series)){const bars=indicators(rows);if(bars.length<202)continue;prepared[code]={bars,analysis:timeline(bars,c)};lookup[code]=new Map(bars.map((b,i)=>[b.t,i]));bars.slice(200).forEach(b=>dates.add(b.t));}
 let cash=c.capital,peak=c.capital,mdd=0;const positions={},pending={},trades=[],curve=[],lastExit={};const sellCost=(c.feePct+c.taxPct+c.slipPct)/100;
 for(const day of [...dates].sort()){
  // 1. Yesterday's exits execute at today's open; no today's closing information is used.
  for(const code of Object.keys(pending)){
   const i=lookup[code].get(day);if(i==null||day<=pending[code].day)continue;
   const b=prepared[code].bars[i],q=positions[code],intent=pending[code];
   if(q){const proceeds=q.qty*b.o*(1-sellCost);cash+=proceeds;trades.push({code,start:q.entryT,end:day,entry:q.entryPrice,exit:b.o,qty:q.qty,pnl:proceeds-q.cost,reason:intent.reason});delete positions[code];lastExit[code]=day;}
   delete pending[code];
  }
  const equityOpen=cash+Object.values(positions).reduce((sum,q)=>{const i=lookup[q.code].get(day);return sum+q.qty*(i!=null?prepared[q.code].bars[i].o:q.lastPrice);},0);
  // 2. Prior close signals enter at today's open with risk budget based only on known open prices.
  const entries=[];
  for(const code of Object.keys(prepared)){const {bars,analysis}=prepared[code],i=lookup[code].get(day);if(i==null||i<201||positions[code]||lastExit[code]===day)continue;if(analysis[i-1].signal)entries.push({code,i,quality:analysis[i-1].context.quality});}
  entries.sort((a,b)=>b.quality-a.quality||a.code.localeCompare(b.code));
  for(const {code,i} of entries){const {bars,analysis}=prepared[code],b=bars[i],a=analysis[i-1];const sizing=sizeOrder({equity:equityOpen,cash,price:b.o,stop:a.support,positions:Object.values(positions),settings:c});
   if(!sizing.qty)continue;const q=createPosition(code,bars,i-1,b.o,sizing.qty);if(!q)continue;q.entryT=b.t;q.cost=sizing.cost;q.lastPrice=b.o;cash-=q.cost;positions[code]=q;
  }
  // 3. Now the close is observable: update structural stops and queue next session's exits.
  for(const [code,q] of Object.entries(positions)){const i=lookup[code].get(day);if(i==null)continue;const {bars}=prepared[code],b=bars[i],result=manage(q,bars,i,null,c);positions[code]={...result.position,cost:q.cost,lastPrice:b.c};if(result.exit)pending[code]={day,reason:result.reason};}
  const equity=cash+Object.values(positions).reduce((sum,q)=>sum+q.qty*q.lastPrice,0);peak=Math.max(peak,equity);mdd=Math.max(mdd,(peak-equity)/peak);curve.push({t:day,equity});
 }
 const end=curve.at(-1)?.equity??c.capital;
 return {trades,open:Object.values(positions),curve,stats:{trades:trades.length,ret:(end/c.capital-1)*100,mdd:mdd*100,win:trades.length?trades.filter(t=>t.pnl>0).length/trades.length*100:null,equity:end},limitations:['일봉 종가 신호 → 다음 거래일 시가 체결 가정','5분봉 진입·장중 대응은 미반영','현재 불러온 종목 집합만 사용 · 상장폐지·거래정지·기업행사 별도 검증 필요']};
}
const FEATURE_KEYS=['quality','holdRatio','retention','baseRange','percentile'];
function similarity(features,examples){
 const scales={quality:100,holdRatio:.2,retention:1,baseRange:.2,percentile:1};
 return examples.filter(e=>e.features).map(e=>{const keys=FEATURE_KEYS.filter(k=>Number.isFinite(features?.[k])&&Number.isFinite(e.features[k]));return keys.length<3?null:{...e,distance:Math.sqrt(keys.reduce((s,k)=>s+((features[k]-e.features[k])/scales[k])**2,0)/keys.length)};}).filter(Boolean).sort((a,b)=>a.distance-b.distance).slice(0,3);
}
return {VERSION,DEFAULTS,PHASES,normalize,indicators,context,recovery,analyze,timeline,segments,createPosition,manage,minuteAnalysis,sizeOrder,backtest,similarity};
});
