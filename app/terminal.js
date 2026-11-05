/* Broker execution desk. Uses the existing bridge contract; never auto-arms or auto-orders. */
(function(root){'use strict';
root.PartisanTerminal=function(h){
 const $=id=>document.getElementById(id),esc=h.escape,money=h.money;
 let status=null,balance=null,orders=[],updated='',draft=null,readyAt=0,busy=false,refreshing=false,epoch=0,locked=false;
 const pendingKey=()=>`partisan.execution.pending:${h.identity()}:${status?.env||''}:${status?.acct||''}`;
 const notice=text=>$('brokerNotice').textContent=text;
 function render(){
  const available=status?.available,valid=available&&status.acctOk===true;
  $('brokerMode').textContent=available?`${status.envName} · ${status.armed?'주문 허용':'주문 정지'}`:'주문 서버 미연결';
  $('executionStatus').textContent=available?`${status.envName} · ${status.armed?'주문 허용':'주문 정지'}`:'주문 서버 미확인';
  $('brokerCaption').textContent=available?`${status.envName} · ${status.acct} · 1회 ${money(status.maxOrder)}원 / 일 ${money(status.maxDay)}원`:'시세 연결과 주문 연결은 별개입니다. 실행기의 --trade 설정이 필요합니다.';
  $('brokerArm').disabled=!valid||busy||status?.armed||locked;
  $('brokerReview').disabled=!valid||!status?.armed||busy||locked||!balance;
  $('brokerReconcile').hidden=!locked;
  $('brokerStats').innerHTML=[['주문 가능 현금',balance?money(balance.orderable)+'원':'—'],['평가 손익',balance?money(balance.pnl)+'원':'—'],['보유 종목',balance?balance.holdings.length+'종목':'—'],['일 주문 한도 잔여',available?money(Math.max(0,status.maxDay-status.usedToday))+'원':'—']].map(([k,v])=>`<div class="stat"><span>${k}</span><strong>${v}</strong></div>`).join('');
  $('brokerUpdated').textContent=updated||'조회 전';
  $('brokerHoldings').innerHTML=balance?.holdings.length?`<table><thead><tr><th>종목</th><th>보유</th><th>평균가</th><th>현재가</th><th>평가손익</th><th></th></tr></thead><tbody>${balance.holdings.map(q=>`<tr><td>${esc(q.name)}<small>${esc(q.code)}</small></td><td>${money(q.qty)}</td><td>${money(q.avg)}</td><td>${money(q.price)}</td><td class="${q.pnl>=0?'up':'down'}">${money(q.pnl)}</td><td><button class="text-button" data-broker-sell="${esc(q.code)}">매도 준비</button></td></tr>`).join('')}</tbody></table>`:`<div class="empty-note">${balance?'보유 잔고가 없습니다.':'증권사 잔고를 조회하면 표시됩니다.'}</div>`;
  $('brokerOrders').innerHTML=orders.length?`<table><thead><tr><th>주문번호 / 종목</th><th>구분</th><th>주문가</th><th>주문 / 체결</th><th>미체결</th><th>상태</th><th></th></tr></thead><tbody>${orders.map(o=>`<tr><td>#${esc(o.no)} · ${esc(o.name||o.code)}</td><td>${esc(o.side)}</td><td>${money(o.price)}</td><td>${money(o.qty)} / ${money(o.filled)}</td><td>${money(o.open)}</td><td>${esc(o.reject||(+o.open>0?'미체결':+o.canceled>0?'취소':+o.filled>0?'체결':'접수'))}</td><td>${+o.open>0?`<button class="button" data-broker-cancel="${esc(o.no)}" ${busy?'disabled':''}>취소</button>`:''}</td></tr>`).join('')}</tbody></table>`:'<div class="empty-note">조회된 당일 주문이 없습니다. 접수 후 반드시 체결 여부를 확인하세요.</div>';
 }
 async function refresh(){
  if(refreshing||!h.connected())return false;refreshing=true;const version=epoch;
  try{
   const s=await h.request('/trade/status',{});if(version!==epoch)return false;status=s;
   locked=!!localStorage.getItem(pendingKey());
   if(s.available&&s.acctOk===true){
    const b=await h.request('/trade/balance',{}),o=await h.request('/trade/orders',{});
    if(version!==epoch)return false;
    balance={...b,holdings:Array.isArray(b.holdings)?b.holdings:[]};orders=Array.isArray(o.items)?o.items:[];updated=h.time();
    notice(locked?'응답 미확인 주문이 있습니다. 중복 전송을 막았습니다. 당일 주문내역을 대조하세요.':`${s.envName} 서버 · ${s.armed?'주문 허용 중':'주문 정지 상태'} · 주문은 매번 확인 후 전송합니다.`);
   }else{balance=null;orders=[];notice(s.acctMsg||'주문 서버 미설정 · 맥: bash 맥에서_실행.command --trade 로 실행하세요.');}
   render();return true;
  }catch(e){if(version===epoch){status=null;balance=null;orders=[];notice('계좌 조회 실패 · '+e.message);render();}return false;}
  finally{refreshing=false;}
 }
 function confirm(kind,title,details,payload={}){
  draft={kind,payload,identity:h.identity(),epoch,env:status?.env,acct:status?.acct};readyAt=Date.now()+1500;
  $('brokerConfirmTitle').textContent=title;$('brokerConfirmDetails').textContent=details;
  $('brokerRead').checked=false;$('brokerReason').value='';$('brokerConfirmSubmit').disabled=true;
  $('brokerConfirm').showModal();setTimeout(updateConfirm,1550);
 }
 function updateConfirm(){$('brokerConfirmSubmit').disabled=busy||!draft||Date.now()<readyAt||!$('brokerRead').checked||!$('brokerReason').value.trim();}
 function validate(p){
  if(!status?.available||!status.armed||status.acctOk!==true)throw Error('주문 서버와 주문 허용 상태를 확인하세요.');
  if(locked)throw Error('응답 미확인 주문을 먼저 점검하세요.');
  if(!['BUY','SELL'].includes(p.side)||!/^[0-9A-Z]{6}$/.test(p.code)||!Number.isSafeInteger(p.qty)||p.qty<1||!Number.isSafeInteger(p.price)||p.price<1)throw Error('종목코드·정수 수량·지정가를 확인하세요.');
  const amount=p.price*p.qty;
  if(!Number.isSafeInteger(amount)||amount>status.maxOrder||amount+status.usedToday>status.maxDay)throw Error('실행기에 설정한 주문 한도를 초과합니다.');
  if(!balance)throw Error('최신 잔고 조회가 필요합니다.');
  if(p.side==='BUY'&&amount*1.001>balance.orderable)throw Error('수수료 여유를 포함한 주문 가능 금액이 부족합니다.');
  if(p.side==='SELL'){
   const qty=balance.holdings.find(x=>x.code===p.code)?.qty||0;
   const reserved=orders.filter(x=>x.code===p.code&&/매도|SELL/i.test(x.side)).reduce((sum,o)=>sum+(+o.open||0),0);
   if(p.qty>qty-reserved)throw Error('보유 수량에서 미체결 매도를 뺀 수량을 초과합니다.');
  }
 }
 async function review(e){e.preventDefault();if(busy)return;busy=true;render();try{
  if(!await refresh())throw Error('계좌를 새로고침한 후 다시 시도하세요.');
  const p={code:$('orderCode').value.trim().toUpperCase(),side:$('orderSide').value,type:'LMT',price:Number($('orderPrice').value),qty:Number($('orderQty').value)};
  validate(p);await h.quote(p.code);if(!h.fresh(p.code))throw Error('정규장 최신 시세가 없습니다.');
  confirm('order',status.env==='live'?'실제 자금 주문 확인':`${status.envName} 주문 확인`,`${status.envName} · 계좌 ${status.acct}\n${h.name(p.code)} (${p.code})\n${p.side==='BUY'?'매수':'매도'} ${money(p.qty)}주 · 지정가 ${money(p.price)}원\n주문 금액 ${money(p.qty*p.price)}원\n\n주문 접수는 체결이 아닙니다. 미체결 주문은 취소하기 전까지 남을 수 있습니다.`,p);
 }catch(e){h.notify(e.message);}finally{busy=false;render();updateConfirm();}}
 async function submit(e){
  e.preventDefault();if(busy||!draft||Date.now()<readyAt||!$('brokerRead').checked||!$('brokerReason').value.trim())return;
  const d=draft;busy=true;updateConfirm();render();let sent=false,key='';
  try{
   if(d.identity!==h.identity()||d.epoch!==epoch)throw Error('연결이 변경되었습니다. 처음부터 확인하세요.');
   if(!await refresh())throw Error('계좌 상태를 확인하지 못했습니다.');
   if(status?.env!==d.env||status?.acct!==d.acct)throw Error('주문 계좌가 변경되었습니다.');
   if(d.kind==='order'){
    validate(d.payload);await h.quote(d.payload.code);if(!h.fresh(d.payload.code))throw Error('최신 시세가 없어 주문하지 않았습니다.');
    if(d.epoch!==epoch||draft!==d)throw Error('주문 확인이 취소되었습니다.');
    key=pendingKey();localStorage.setItem(key,JSON.stringify({at:h.time(),code:d.payload.code,side:d.payload.side,qty:d.payload.qty,price:d.payload.price}));locked=true;
    sent=true;const r=await h.request('/trade/order',d.payload);
    if(!r.ok||!(+r.orderNo>0))throw Error('접수 확인을 받지 못했습니다. 주문내역을 확인하세요.');
    localStorage.removeItem(key);locked=false;notice(`주문 #${r.orderNo} 접수 · 체결 상태를 확인하세요.`);h.notify(`주문 #${r.orderNo} 접수 — 체결 내역에서 확인하세요.`);
   }else if(d.kind==='arm'){
    if(draft!==d)throw Error('허용 요청이 취소되었습니다.');
    status=await h.request('/trade/arm',{on:true});h.notify('주문을 허용했습니다. 자동 주문은 활성화되지 않습니다.');
   }else if(d.kind==='cancel'){
    if(draft!==d)throw Error('취소 확인이 만료되었습니다.');
    const o=orders.find(o=>String(o.no)===String(d.payload.orderNo)&&o.code===d.payload.code);
    if(!o||!(o.open>0))throw Error('취소할 미체결 수량이 없습니다.');
    const r=await h.request('/trade/cancel',d.payload);if(!r.ok)throw Error('취소 접수를 확인하지 못했습니다.');h.notify('취소 요청 접수 · 주문내역에서 결과를 확인하세요.');
   }else if(d.kind==='reconcile'){
    localStorage.removeItem(pendingKey());locked=false;h.notify('주문내역 대조 확인을 기록하고 잠금을 해제했습니다. 기존 주문은 취소되지 않습니다.');
   }
   draft=null;$('brokerConfirm').close();await refresh();
  }catch(e){
   h.notify(e.message);
   if(sent){locked=true;draft=null;$('brokerConfirm').close();notice('응답 미확인 · 자동 재전송하지 않습니다. 주문내역을 확인한 후 잠금을 해제하세요.');}
  }finally{busy=false;render();updateConfirm();}
 }
 async function stop(){
  epoch++;draft=null;$('brokerConfirm').close();h.stopObserver();
  if(!h.connected()){notice('연결이 없어 서버 정지를 확인할 수 없습니다. 중계기 상태를 직접 확인하세요.');h.notify('서버 정지 미확인 · 중계기 연결을 확인하세요.');return;}
  try{status=await h.request('/trade/arm',{on:false});notice('신규 주문 정지 확인 · 이미 접수된 주문은 자동 취소되지 않습니다.');h.notify('주문 정지 확인. 기존 미체결은 별도로 취소하세요.');}
  catch(e){status=null;notice('주문 정지 확인 실패 · '+e.message);h.notify('서버 정지 미확인 · 중계기를 직접 확인하세요.');}render();
 }
 function prepare(code,price=0,side='BUY',qty=''){
  $('orderCode').value=code||'';$('orderPrice').value=price>0?Math.round(price):'';$('orderSide').value=side;$('orderQty').value=qty;amount();
 }
 function amount(){const total=Number($('orderPrice').value)*Number($('orderQty').value);$('orderAmount').textContent=total>0?money(total)+'원':'—';}
 function reset(){epoch++;draft=null;status=null;balance=null;orders=[];updated='';locked=false;$('brokerConfirm').close();prepare('');render();}
 $('brokerTicket').addEventListener('submit',review);$('brokerTicket').addEventListener('input',amount);
 $('brokerConfirmForm').addEventListener('submit',submit);$('brokerRead').addEventListener('change',updateConfirm);$('brokerReason').addEventListener('input',updateConfirm);
 $('brokerConfirm').addEventListener('close',()=>{if(!$('brokerConfirm').open)draft=null;});
 document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;try{
  if(b.id==='globalStop'||b.id==='brokerDialogStop'){await stop();return;}
  if(busy)return;
  if(b.id==='brokerRefresh'){await refresh();return;}
  if(b.id==='brokerArm'){if(await refresh()&&status?.available&&!locked)confirm('arm',`${status.envName} 주문 허용`,`${status.envName} · ${status.acct}\n1회 ${money(status.maxOrder)}원 / 일 ${money(status.maxDay)}원\n주문마다 확인이 필요합니다. 전략 자동 주문은 연결되지 않았습니다.`);}
  if(b.dataset.brokerCancel){if(await refresh()){const o=orders.find(o=>String(o.no)===b.dataset.brokerCancel);if(o?.open>0)confirm('cancel','미체결 주문 취소',`주문 #${o.no} · ${o.name||o.code}\n미체결 ${money(o.open)}주 전량 취소를 요청합니다.`,{orderNo:o.no,code:o.code});}}
  if(b.dataset.brokerSell){const q=balance?.holdings.find(q=>q.code===b.dataset.brokerSell);if(q)prepare(q.code,q.price,'SELL',q.qty);}
  if(b.id==='brokerReconcile'&&await refresh())confirm('reconcile','응답 미확인 주문 대조',`${localStorage.getItem(pendingKey())||''}\n\n위 주문과 증권사 당일 주문내역을 대조했는지 확인하세요. 아직 확인되지 않으면 닫고 기다리세요. 잠금 해제는 기존 주문을 취소하지 않습니다.`);
 }catch(e){h.notify(e.message);}});
 render();return {refresh,prepare,reset,isBusy:()=>busy};
};
})(globalThis);
