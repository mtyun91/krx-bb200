/* Market-wide daily screening. A match is a review candidate, never an order. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PartisanScreener=api;})(globalThis,function(){
'use strict';
function marketKey(value){const m=String(value||'').toUpperCase();return /KOSDAQ|코스닥/.test(m)?'KOSDAQ':/KOSPI|코스피|유가증권/.test(m)?'KOSPI':m;}
function universe(items){
 return items.filter(x=>/^[0-9A-Z]{6}$/.test(x.code)&&!/(ETF|ETN)/i.test(x.market||'')&&!/(ETF|ETN|스팩|리츠|우B?$|KODEX|TIGER|ACE |SOL |PLUS |RISE |HANARO|KOSEF)/i.test(x.name));
}
function inspect(E,item,response,settings,day,minute){
 const bars=E.indicators(response.bars).filter(b=>b.t<=day),last=bars.at(-1);
 if(!last)return null;
 const a=E.analyze(bars,bars.length-1,settings);
 if(!a.signal)return null; // WAIT is not a buy candidate.
 return {code:item.code,name:item.name,market:item.market||'',date:last.t,price:last.c,
  change:bars.length>1?(last.c/bars.at(-2).c-1)*100:0,
  kind:a.recovery?'recovery':'breakout',quality:a.context?.quality||0,
  risk:a.support>0?(last.c-a.support)/last.c*100:null,support:a.support,
  value:last.value20||0,reasons:a.reasons||[],provisional:last.t===day&&minute<930};
}
function filter(rows,{query='',market='all',kind='all',sort='quality'}={}){
 const q=query.trim().toLowerCase();
 return rows.filter(r=>(!q||r.name.toLowerCase().includes(q)||r.code.includes(q))&&
  (market==='all'||marketKey(r.market)===market)&&(kind==='all'||r.kind===kind))
 .sort((a,b)=>sort==='risk'?(a.risk??Infinity)-(b.risk??Infinity):sort==='value'?b.value-a.value:b.quality-a.quality);
}
return {universe,inspect,filter};
});
