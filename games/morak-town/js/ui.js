/* 모락모락 타운 — 화면 조작과 게임 루프 */
(function () {
  'use strict';
  const Sim = window.Sim;
  const $ = id => document.getElementById(id);
  const SAVE_KEY = 'morak.save.v1';
  const DAY_MS = 2400;

  let S = null, R = null, speed = 0, tool = 'select', tab = 'company', selected = null;
  let acc = 0, last = performance.now(), modalOpen = true, storeFilter = 'all', armed = null, armedTimer = 0;
  let charts = [];

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const won = v => Sim.won(v);
  const short = v => Sim.won(v).replace('원', '');
  const pct = v => (v * 100).toFixed(1) + '%';
  const district = (x, y) => Sim.DISTRICTS[Sim.tile(S, x, y).d].name;
  function stars(r) { const n = Math.round(r); return `<span class="stars" aria-label="평점 ${r.toFixed(1)}">${'★'.repeat(n)}<span class="off">${'★'.repeat(5 - n)}</span></span> ${r.toFixed(1)}`; }

  // ---------- 저장 ----------
  function readSave() { try { const s = localStorage.getItem(SAVE_KEY); return s ? Sim.deserialize(s) : null; } catch (e) { return null; } }
  function writeSave(quiet) { try { localStorage.setItem(SAVE_KEY, Sim.serialize(S)); if (!quiet) toast('저장했어요.', 'good'); } catch (e) { if (!quiet) toast('이 브라우저에서는 저장할 수 없어요.', 'bad'); } }

  // ---------- 도구 ----------
  const TOOLS = [
    { id: 'select', ic: '👆', nm: '살펴보기' }, 'sep',
    ...Sim.CAT_KEYS.map(k => ({ id: 'store:' + k, ic: Sim.CATS[k].icon, nm: Sim.CATS[k].name, co: Sim.CATS[k].build })), 'sep',
    ...Object.keys(Sim.FAC).map(k => ({ id: 'fac:' + k, ic: Sim.FAC[k].icon, nm: Sim.FAC[k].name, co: Sim.FAC[k].cost })), 'sep',
    ...Object.keys(Sim.PUBLIC).map(k => ({ id: 'pub:' + k, ic: Sim.PUBLIC[k].icon, nm: Sim.PUBLIC[k].name, co: Sim.PUBLIC[k].cost })),
  ];
  function renderTools() {
    $('tools').innerHTML = TOOLS.map(t => t === 'sep' ? '<div class="sep"></div>' :
      `<button class="tool ${tool === t.id ? 'on' : ''}" data-tool="${t.id}" title="${esc(t.nm)}${t.co ? ' · ' + won(t.co) + (t.id.startsWith('store') ? '부터' : '') : ''}">
        <span class="ic">${t.ic}</span><span class="nm">${esc(t.nm)}</span>${t.co ? `<span class="co">${short(t.co)}</span>` : ''}</button>`).join('');
  }
  function setTool(id) {
    tool = (tool === id && id !== 'select') ? 'select' : id;
    renderTools();
    $('map').classList.toggle('building', tool !== 'select');
    refreshOverlay();
    if (tool !== 'select') {
      const [kind, k] = tool.split(':');
      const d = kind === 'store' ? `${Sim.CATS[k].name}: 초록빛이 진할수록 손님이 많이 올 자리예요.` : kind === 'fac' ? Sim.FAC[k].desc : Sim.PUBLIC[k].desc;
      toast(d);
    } else R.ghost = null;
  }
  function refreshOverlay() {
    const [kind, k] = tool.split(':');
    if (kind === 'store') R.overlay = { type: 'potential', data: Sim.lotPotentials(S, k, 0) };
    else if (kind === 'fac' || $('btnLogi').classList.contains('on')) R.overlay = { type: 'logistics' };
    else R.overlay = null;
  }
  function toolIcon() {
    const [kind, k] = tool.split(':');
    return kind === 'store' ? Sim.CATS[k].icon : kind === 'fac' ? Sim.FAC[k].icon : kind === 'pub' ? Sim.PUBLIC[k].icon : '';
  }
  function buildAt(x, y) {
    const [kind, k] = tool.split(':');
    let r;
    if (kind === 'store') {
      const cost = Sim.storeCost(S, k, x, y);
      r = Sim.openStore(S, 0, x, y, k);
      if (r.ok) { toast(`${Sim.CATS[k].icon} ${Sim.CATS[k].name}을 열었어요. (${won(-cost)})`, 'good'); selected = { x, y }; }
    } else if (kind === 'fac') {
      r = Sim.buildFacility(S, 0, x, y, k);
      if (r.ok) { toast(`${Sim.FAC[k].icon} ${Sim.FAC[k].name}을 지었어요.`, 'good'); selected = { x, y }; }
    } else if (kind === 'pub') r = Sim.buildPublic(S, x, y, k);
    if (r && !r.ok) toast(r.msg || '지을 수 없어요.', 'bad');
    if (r && r.ok) { refreshOverlay(); renderAll(); }
  }

  // ---------- 토스트 ----------
  function toast(text, kind) {
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || ''); el.textContent = text;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), 2600);
    while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
  }
  function result(r, okText) { if (!r) return; if (r.ok) { if (okText) toast(okText, 'good'); } else toast(r.msg || '할 수 없어요.', 'bad'); renderAll(); }

  // ---------- 상단·목표·띠 ----------
  function renderTop() {
    const p = S.companies[0], d = Sim.dateOf(S);
    const seasonIc = { spring: '🌸', summer: '🌿', autumn: '🍁', winter: '❄️' }[Sim.seasonOf(S)];
    $('coName').textContent = p.name;
    $('date').textContent = `${seasonIc} ${d.year}년차 ${d.month}월 ${d.day}일`;
    $('kCash').textContent = won(p.cash);
    $('kCash').className = p.cash < 0 ? 'down' : '';
    $('kValLbl').textContent = p.listed ? '시가총액' : '기업가치';
    $('kVal').textContent = won(p.listed ? Sim.marketCap(p) : p.value);
    const own = S.stores.filter(s => s.owner === 0);
    $('kStores').textContent = `${own.length}곳`;
    $('kPop').textContent = Sim.population(S).toLocaleString('ko-KR') + '명';
    document.querySelectorAll('.speed button').forEach(b => b.classList.toggle('on', +b.dataset.speed === speed));
    $('ticker').textContent = S.news.slice(0, 3).map(n => n.text).join('   ·   ');
    const ban = $('banner');
    if (S.gameOver) { ban.hidden = false; ban.innerHTML = '회사가 파산했어요. <button class="btn" data-act="newgame">새 게임</button>'; }
    else if (S.distress > 0) { ban.hidden = false; ban.textContent = `자금 부족! ${45 - S.distress}일 안에 현금을 플러스로 돌려야 해요.`; }
    else ban.hidden = true;
  }
  let questMin = window.matchMedia('(max-width: 760px)').matches;
  function renderQuest() {
    const done = Sim.QUESTS.filter(q => S.quests[q.id]).length;
    const next = Sim.QUESTS.filter(q => !S.quests[q.id]).slice(0, 4);
    const recent = Sim.QUESTS.filter(q => S.quests[q.id] && S.day - S.quests[q.id] < 20);
    $('quest').className = 'quest' + (questMin ? ' min' : '');
    $('quest').innerHTML = `<h3>목표 <span class="chip">${done}/${Sim.QUESTS.length}</span><button data-act="questmin" aria-label="목표 접기">${questMin ? '펼치기' : '접기'}</button></h3>
      <ul>${recent.map(q => `<li class="done"><span class="ck"></span><span>${esc(q.text)}</span></li>`).join('')}
      ${next.map(q => `<li><span class="ck"></span><span>${esc(q.text)}</span>${q.reward ? `<span class="rw">+${short(q.reward)}</span>` : ''}</li>`).join('')}
      ${!next.length ? '<li>모든 목표를 이뤘어요. 도시의 전설이 되었네요!</li>' : ''}</ul>`;
  }

  // ---------- 정보 카드 ----------
  function renderInspector() {
    const el = $('inspector');
    if (!selected) { el.hidden = true; return; }
    const t = Sim.tile(S, selected.x, selected.y);
    const dn = Sim.DISTRICTS[t.d].name;
    let h = '';
    const head = (big, title, sub) => `<div class="insp-head"><span class="big">${big}</span><div><h2>${title}</h2><div class="sub">${sub}</div></div><button class="x" data-act="deselect" aria-label="닫기">✕</button></div>`;
    if (t.t === 'road') h = head('🛣️', '도로', dn) + '<p class="hint">길에는 지을 수 없어요. 사람과 배송 트럭이 오가는 곳이에요.</p>';
    else if (t.t === 'water') h = head('🌊', '호수', dn) + '<p class="hint">오리들이 사는 호수예요. 관광객이 이 근처를 좋아해요.</p>';
    else if (!t.b) {
      h = head(t.tree ? '🌳' : '🟩', '빈 땅', `${dn} · 임대료 하루 ${won(t.lv)}`);
      h += '<table class="t"><thead><tr><th>업종</th><th class="r">예상 손님</th><th class="r">경쟁</th><th class="r">비용</th><th></th></tr></thead><tbody>';
      for (const k of Sim.CAT_KEYS) {
        const e = Sim.lotEstimate(S, t.x, t.y, k, 0); const cost = Sim.storeCost(S, k, t.x, t.y);
        h += `<tr><td>${Sim.CATS[k].icon} ${Sim.CATS[k].name}</td><td class="r">${Math.round(e.cust)}명</td><td class="r">${e.rivals}곳</td><td class="r">${short(cost)}</td><td class="r"><button class="btn" data-act="buildhere" data-arg="${k}" ${S.companies[0].cash < cost ? 'disabled' : ''}>열기</button></td></tr>`;
      }
      h += '</tbody></table><p class="hint">예상 손님은 기준 가격·홍보 없이 열었을 때 하루 평균이에요. 근처 경쟁 매장 수도 함께 보세요.</p>';
    } else if (t.b.k === 'store') h = storeCard(S.stores.find(s => s.id === t.b.id), head);
    else if (t.b.k === 'fac') h = facCard(S.facs.find(f => f.id === t.b.id), head);
    else if (Sim.SEG[t.b.k]) {
      const names = { res: ['🏠', '주택'], off: ['🏢', '오피스'], uni: ['🏫', '대학 건물'], tour: ['🏨', '호텔·관광시설'] }[t.b.k];
      h = head(names[0], `${names[1]} Lv.${t.b.lv}`, dn) + `<div class="rows"><span>사는·일하는 사람</span><span>${Sim.SEG[t.b.k].pop * t.b.lv}명</span><span>손님 유형</span><span>${Sim.SEG[t.b.k].name}</span><span>가격 민감도</span><span>${Sim.SEG[t.b.k].sens >= 1.5 ? '아주 높음' : Sim.SEG[t.b.k].sens >= 1 ? '보통' : '낮음'}</span></div><p class="hint">공원과 버스정류장이 가까우면 건물이 더 빨리 커져요.</p>`;
    } else if (t.b.k === 'park') h = head('🌳', '공원', dn) + '<p class="hint">산책 나온 관광객이 찾아오고, 2칸 안 매장의 매력이 10% 올라가요.</p>';
    else if (t.b.k === 'bus') h = head('🚏', '버스정류장', dn) + '<p class="hint">하루 120명가량의 출퇴근 인구가 오가요. 주변 건물이 자라기 쉬워져요.</p>';
    el.innerHTML = h; el.hidden = false;
  }

  function storeCard(st, head) {
    if (!st) return '';
    const comp = S.companies[st.owner], cat = Sim.CATS[st.cat], dn = district(st.x, st.y);
    const cap = Sim.capacity(st), use = Math.min(1, st.served / Math.max(1, cap));
    const supName = st.supply === 'kitchen' ? '중앙주방 배송' : st.supply === 'warehouse' ? '물류창고 배송' : '도매상 직송 (원가 +12%)';
    if (st.owner !== 0) {
      return head(cat.icon, `${esc(comp.name)} ${cat.name}`, `${dn} · Lv.${st.level}`) +
        `<div class="rows"><span>평점</span><span>${stars(st.rating)}</span><span>가격</span><span>${won(st.price)}</span><span>오늘 손님(추정)</span><span>${st.served}명</span><span>브랜드 인지도</span><span>${comp.brand[st.cat].toFixed(0)}</span></div>
        <p class="hint"><span class="dot" style="background:${comp.color}"></span>경쟁사 매장이에요. 근처에 더 좋은 품질이나 더 나은 가격으로 맞서 보세요.</p>`;
    }
    if (st.franchise) {
      const fr = comp.fr[st.cat];
      return head(cat.icon, `${cat.name} 가맹점`, `${dn} · Lv.${st.level} · ${stars(st.rating)}`) +
        `<div class="rows"><span>오늘 손님</span><span>${st.served}명</span><span>오늘 매출</span><span>${won(st.rev)}</span><span>우리 로열티 (${pct(fr.royalty)})</span><span class="up">${won(st.rev * fr.royalty)}</span><span>점주 30일 손익</span><span class="${st.profitAvg >= 0 ? 'up' : 'down'}">${won(st.profitAvg * 30)}</span><span>공급</span><span>${supName}</span></div>
        <p class="hint">가맹점주가 직접 운영해요. 물류망 안에 있으면 식자재 공급 마진 8%도 받아요. 점주가 석 달 넘게 적자면 폐업해요.</p>`;
    }
    const step = Math.max(100, Math.round(cat.price * 0.03 / 100) * 100);
    const mk = ['없음', '전단', 'SNS', '방송'];
    const armedClose = armed === 'close:' + st.id;
    return head(cat.icon, `${cat.name} 직영점`, `${dn} · Lv.${st.level} · ${stars(st.rating)}`) +
      `<div class="rows">
        <span>오늘 손님 / 찾아온 손님</span><span>${st.served} / ${Math.round(st.served + st.lost)}명</span>
      </div>
      <div class="bar" title="좌석·직원 여유"><i class="${use > 0.95 ? 'warn' : ''}" style="width:${(use * 100).toFixed(0)}%"></i></div>
      <p class="hint" style="margin-top:4px">${st.lost > 5 ? `손님 ${Math.round(st.lost)}명이 자리가 없어 돌아갔어요. 직원을 늘리거나 확장해 보세요.` : `하루 최대 ${Math.round(cap)}명까지 받을 수 있어요.`}</p>
      <div class="rows">
        <span>오늘 매출 · 손익</span><span>${won(st.rev)} · <b class="${st.profit >= 0 ? 'up' : 'down'}">${won(st.profit)}</b></span>
        <span>이번 달 손익</span><span class="${st.m.profit >= 0 ? 'up' : 'down'}">${won(st.m.profit)}</span>
        <span>지난달 손익</span><span>${st.lm ? won(st.lm.profit) : '—'}</span>
      </div>
      <div class="ctl"><span class="lbl">가격</span><button class="step" data-act="price" data-arg="${-step}" aria-label="가격 내리기">−</button><span class="val">${won(st.price)}</span><button class="step" data-act="price" data-arg="${step}" aria-label="가격 올리기">+</button><span class="chip">기준 ${won(cat.price)}</span></div>
      <div class="ctl"><span class="lbl">직원</span><button class="step" data-act="staff" data-arg="-1" aria-label="직원 줄이기">−</button><span class="val">${st.staff}명 / ${Sim.maxStaff(st)}</span><button class="step" data-act="staff" data-arg="1" aria-label="직원 늘리기">+</button><button class="btn ${st.auto && S.autoStaff ? 'primary' : ''}" data-act="auto">${st.auto && S.autoStaff ? '자동' : '수동'}</button></div>
      <div class="ctl"><span class="lbl">홍보</span><div class="seg">${mk.map((n, i) => `<button class="${st.mkt === i ? 'on' : ''}" data-act="mkt" data-arg="${i}" title="하루 ${won(Sim.MKT[i])}">${n}</button>`).join('')}</div></div>
      <div class="rows">
        <span>식자재</span><span>${supName}</span>
        <span>1인분 원가</span><span>${won(Sim.unitCost(S, comp, st))}</span>
        <span>임대료</span><span>${st.owned ? '자가 건물' : '하루 ' + won(Sim.rentOf(S, st))}</span>
        <span>인건비</span><span>하루 ${won(st.staff * Sim.WAGE)}</span>
      </div>
      <div class="btn-row">
        ${st.level < 3 ? `<button class="btn primary" data-act="upgrade" ${comp.cash < Sim.upgradeCost(st) ? 'disabled' : ''}>Lv.${st.level + 1} 확장 <small>${short(Sim.upgradeCost(st))}</small></button>` : '<span class="chip good">최고 단계</span>'}
        ${!st.owned ? `<button class="btn" data-act="buyprop" ${comp.cash < Sim.propertyPrice(S, st) ? 'disabled' : ''}>건물 매입 <small>${short(Sim.propertyPrice(S, st))}</small></button>` : ''}
        <button class="btn danger ${armedClose ? 'armed' : ''}" data-act="close">${armedClose ? '정말 정리하기' : '매장 정리'}</button>
      </div>`;
  }

  function facCard(f, head) {
    if (!f) return '';
    const F = Sim.FAC[f.kind], comp = S.companies[f.owner];
    const served = S.stores.filter(s => s.facId === f.id && s.supply === f.kind).length;
    const armedDel = armed === 'facdel:' + f.id;
    let h = head(F.icon, `${F.name}${F.range ? ' Lv.' + f.level : ''}`, `${esc(comp.name)} · ${district(f.x, f.y)}`);
    h += `<div class="rows">${F.range ? `<span>담당 매장</span><span>${served} / ${Sim.facCap(f)}곳</span><span>배송 반경</span><span>${F.range}칸</span>` : ''}<span>유지비</span><span>하루 ${won(F.upkeep * (1 + 0.5 * (f.level - 1)))}</span></div><p class="hint">${F.desc}</p>`;
    if (f.owner === 0) h += `<div class="btn-row">${F.range && f.level < 3 ? `<button class="btn primary" data-act="facup" ${comp.cash < F.cost * 0.6 * f.level ? 'disabled' : ''}>확장 <small>${short(F.cost * 0.6 * f.level)}</small></button>` : ''}<button class="btn danger ${armedDel ? 'armed' : ''}" data-act="facdel">${armedDel ? '정말 철거하기' : '철거'}</button></div>`;
    return h;
  }

  // ---------- 패널 ----------
  const TABS = [['company', '회사'], ['stores', '매장'], ['logi', '물류'], ['brand', '브랜드·가맹'], ['stock', '주식'], ['market', '시장'], ['news', '소식']];
  function renderTabs() {
    $('tabs').innerHTML = TABS.map(([id, nm]) => `<button role="tab" class="${tab === id ? 'on' : ''}" data-tab="${id}" aria-selected="${tab === id}">${nm}</button>`).join('') +
      '<button class="only-sm" data-act="closepanel" aria-label="패널 닫기">✕</button>';
  }
  function renderPanel() {
    charts = [];
    const fn = { company: pCompany, stores: pStores, logi: pLogi, brand: pBrand, stock: pStock, market: pMarket, news: pNews }[tab];
    const body = $('tabBody'); const top = body.scrollTop;
    body.innerHTML = fn();
    body.scrollTop = top;
    for (const c of charts) { const cv = document.getElementById(c.id); if (cv) drawChart(cv, c.cfg); }
  }
  let chartN = 0;
  function chart(cfg, cls) { const id = 'ch' + (chartN++); charts.push({ id, cfg }); return `<canvas class="chart ${cls || ''}" id="${id}"></canvas>`; }

  function pCompany() {
    const p = S.companies[0], L = p.cur, lm = p.months[p.months.length - 1];
    const ni = x => x.rev + x.royalty - x.cogs - x.wage - x.rent - x.mkt - x.upkeep - x.interest;
    const fShare = p.founderShares / p.shares;
    const own = S.stores.filter(s => s.owner === 0);
    const months = p.months.slice(-12);
    let h = `<div class="cards">
      <div class="stat"><span class="lbl">현금</span><b class="${p.cash < 0 ? 'down' : ''}">${won(p.cash)}</b></div>
      <div class="stat"><span class="lbl">대출</span><b>${won(p.debt)}</b><span class="d">한도 ${short(Sim.loanLimit(S, p))}</span></div>
      <div class="stat"><span class="lbl">${p.listed ? '시가총액' : '기업가치(추정)'}</span><b>${won(p.listed ? Sim.marketCap(p) : p.value)}</b></div>
      <div class="stat"><span class="lbl">회장님 지분 ${pct(fShare)}</span><b>${won(fShare * (p.listed ? Sim.marketCap(p) : p.value) + S.founder.cash)}</b></div>
      <div class="stat"><span class="lbl">직영 · 가맹</span><b>${own.filter(s => !s.franchise).length} · ${own.filter(s => s.franchise).length}곳</b></div>
      <div class="stat"><span class="lbl">이번 달 손님</span><b>${L.served.toLocaleString('ko-KR')}명</b></div>
    </div>
    <h3>월별 매출과 순이익</h3>
    ${months.length ? chart({ bars: { data: months.map(m => m.rev + m.royalty), color: '#bcd8ee' }, series: [{ data: months.map(m => m.ni), color: '#4f9a6e' }], zero: true, labels: months.map(m => Sim.dateOf(S, m.day - 1).month + '월') }) : '<p class="hint">첫 달 결산이 끝나면 그래프가 나타나요.</p>'}
    <h3>손익 계산서</h3>
    <table class="t"><thead><tr><th></th><th class="r">이번 달(진행)</th><th class="r">지난달</th></tr></thead><tbody>
      ${[['매출', 'rev'], ['가맹 수입', 'royalty'], ['식자재 원가', 'cogs', 1], ['인건비', 'wage', 1], ['임대료', 'rent', 1], ['마케팅', 'mkt', 1], ['시설 유지', 'upkeep', 1], ['이자', 'interest', 1]]
        .map(([n, k, neg]) => `<tr><td>${n}</td><td class="r">${neg ? won(-L[k]) : won(L[k])}</td><td class="r">${lm ? (neg ? won(-lm[k]) : won(lm[k])) : '—'}</td></tr>`).join('')}
      <tr><td><b>순이익</b></td><td class="r"><b class="${ni(L) >= 0 ? 'up' : 'down'}">${won(ni(L))}</b></td><td class="r"><b class="${lm && lm.ni >= 0 ? 'up' : 'down'}">${lm ? won(lm.ni) : '—'}</b></td></tr>
    </tbody></table>
    <p class="hint">매장 개설·확장·연구 같은 투자비는 순이익이 아닌 현금에서 바로 빠져요.</p>
    <h3>은행</h3>
    <div class="btn-row"><button class="btn" data-act="borrow">1억 대출 받기</button><button class="btn" data-act="repay" ${p.debt <= 0 ? 'disabled' : ''}>1억 갚기</button><span class="chip">연 5.5%</span></div>
    <h3>운영 설정</h3>
    <div class="ctl"><span class="lbl" style="width:auto">직원 자동 배치</span><div class="seg" style="max-width:140px"><button class="${S.autoStaff ? 'on' : ''}" data-act="autostaff" data-arg="1">켜기</button><button class="${!S.autoStaff ? 'on' : ''}" data-act="autostaff" data-arg="0">끄기</button></div></div>
    <p class="hint">켜 두면 손님 수에 맞춰 직원을 알아서 조정해요. 매장 카드에서 매장별로 수동으로 바꿀 수 있어요.</p>
    <div class="btn-row"><button class="btn" data-act="save">지금 저장</button><button class="btn danger ${armed === 'newgame' ? 'armed' : ''}" data-act="newgame">${armed === 'newgame' ? '정말 새로 시작' : '새 게임'}</button></div>`;
    return h;
  }

  function pStores() {
    let list = S.stores.filter(s => s.owner === 0);
    if (storeFilter === 'direct') list = list.filter(s => !s.franchise);
    if (storeFilter === 'fr') list = list.filter(s => s.franchise);
    list.sort((a, b) => b.profitAvg - a.profitAvg);
    if (!S.stores.some(s => s.owner === 0)) return '<h3>아직 매장이 없어요</h3><p class="hint">왼쪽 도구에서 업종을 고르고 초록빛이 진한 빈 땅을 눌러 첫 가게를 열어 보세요. 대학가와 업무지구는 카페 손님이 많아요.</p>';
    return `<div class="filter seg">${[['all', '전체'], ['direct', '직영'], ['fr', '가맹']].map(([k, n]) => `<button class="${storeFilter === k ? 'on' : ''}" data-act="filter" data-arg="${k}">${n}</button>`).join('')}</div>
      <table class="t"><thead><tr><th>매장</th><th class="r">손님</th><th class="r">평점</th><th class="r">30일 손익</th></tr></thead><tbody>
      ${list.map(s => `<tr class="click" data-act="goto" data-arg="${s.id}"><td>${Sim.CATS[s.cat].icon} ${Sim.DISTRICTS[Sim.tile(S, s.x, s.y).d].name.split(' ').pop()}${s.franchise ? ' <span class="chip blue">가맹</span>' : ''}${s.lost > 5 && !s.franchise ? ' <span class="chip warn">붐빔</span>' : ''}</td><td class="r">${s.served}</td><td class="r">${s.rating.toFixed(1)}</td><td class="r ${s.profitAvg >= 0 ? 'up' : 'down'}">${short(s.profitAvg * 30)}</td></tr>`).join('')}
      </tbody></table><p class="hint">가맹점의 손익은 점주의 손익이에요. 줄을 누르면 지도에서 찾아가요.</p>`;
  }

  function pLogi() {
    const p = S.companies[0];
    const mine = S.stores.filter(s => s.owner === 0);
    const cnt = k => mine.filter(s => s.supply === k).length;
    const facs = S.facs.filter(f => f.owner === 0);
    let h = `<div class="cards">
      <div class="stat"><span class="lbl">직송 매장</span><b class="${cnt('direct') ? 'down' : ''}">${cnt('direct')}곳</b><span class="d">원가 +12%</span></div>
      <div class="stat"><span class="lbl">창고 · 주방 배송</span><b class="up">${cnt('warehouse')} · ${cnt('kitchen')}곳</b><span class="d">원가 -15% · -21%</span></div>
    </div>
    <div class="btn-row"><button class="btn ${$('btnLogi').classList.contains('on') ? 'primary' : ''}" data-act="logiview">지도에 물류망 ${$('btnLogi').classList.contains('on') ? '숨기기' : '보기'}</button></div>
    <h3>우리 시설</h3>`;
    if (!facs.length) h += '<p class="hint">아직 시설이 없어요. 매장이 모인 곳 근처에 물류창고를 지으면 배송 트럭이 오가며 원가가 내려가요.</p>';
    for (const f of facs) {
      const F = Sim.FAC[f.kind]; const n = S.stores.filter(s => s.facId === f.id && s.supply === f.kind).length;
      h += `<div class="box"><div class="box-h"><span class="ic">${F.icon}</span><strong>${F.name}${F.range ? ' Lv.' + f.level : ''}</strong><span class="chip">${district(f.x, f.y)}</span></div>
        <div class="rows">${F.range ? `<span>담당</span><span>${n} / ${Sim.facCap(f)}곳</span>` : '<span>효과</span><span>회사 전체 카페</span>'}<span>유지비</span><span>하루 ${won(F.upkeep * (1 + 0.5 * (f.level - 1)))}</span></div>
        <div class="btn-row"><button class="btn" data-act="gotofac" data-arg="${f.id}">지도에서 보기</button></div></div>`;
    }
    h += `<h3>식자재 시세</h3><table class="t"><thead><tr><th>품목</th><th class="r">현재가</th><th class="r">평년 대비</th><th style="width:90px">추이</th></tr></thead><tbody>`;
    for (const k in Sim.INGR) {
      const g = S.ingr[k], d = g.p / Sim.INGR[k].base - 1;
      h += `<tr><td>${Sim.INGR[k].name}</td><td class="r">${won(g.p)}</td><td class="r ${d > 0.05 ? 'down' : d < -0.05 ? 'up' : ''}">${d >= 0 ? '+' : ''}${(d * 100).toFixed(0)}%</td><td>${chart({ series: [{ data: g.hist.slice(-40), color: d > 0 ? '#cf6476' : '#4f9a6e' }], spark: true }, 'sm')}</td></tr>`;
    }
    h += `</tbody></table>
    <h3>공급 계약</h3>
    <div class="box"><div class="box-h"><span class="ic">🌾</span><strong>협력 농장 계약</strong><span class="chip ${p.farm ? 'good' : ''}">${p.farm ? '계약 중' : '미계약'}</span></div>
      <p class="hint">월 300만원으로 고기·채소를 15% 싸게 받아요. 국수집·버거 매장이 많을수록 이득이에요.</p>
      <div class="btn-row"><button class="btn ${p.farm ? '' : 'primary'}" data-act="farm">${p.farm ? '계약 해지' : '계약하기'}</button></div></div>
    <div class="box"><div class="box-h"><span class="ic">🫘</span><strong>로스터리</strong><span class="chip ${p.roastery ? 'good' : ''}">${p.roastery ? '운영 중' : '없음'}</span></div>
      <p class="hint">${Sim.FAC.roastery.desc}. 왼쪽 도구에서 빈 땅 어디에나 지을 수 있어요.</p></div>`;
    return h;
  }

  function pBrand() {
    const p = S.companies[0], alive = S.companies.filter(c => !c.dead);
    let h = '<p class="hint" style="margin-top:0">인지도는 손님이 늘고 홍보할수록 오르고, 가만히 두면 천천히 내려가요. 인지도와 레시피가 손님을 끄는 힘이 돼요.</p>';
    for (const k of Sim.CAT_KEYS) {
      const C = Sim.CATS[k], fr = p.fr[k], can = Sim.canFranchise(S, k);
      const frN = S.stores.filter(s => s.owner === 0 && s.franchise && s.cat === k).length;
      h += `<div class="box"><div class="box-h"><span class="ic">${C.icon}</span><strong>${C.name}</strong>${fr.on ? '<span class="chip good">가맹 모집 중</span>' : can.ok ? '<span class="chip warn">가맹 가능</span>' : ''}</div>
        <div class="brandbars">${alive.map(c => `<div class="brandbar"><span class="nm"><span class="dot" style="background:${c.color}"></span>${esc(c.name)}</span><div class="bar"><i style="width:${c.brand[k]}%;background:${c.color}"></i></div><span class="num">${c.brand[k].toFixed(0)}</span></div>`).join('')}</div>
        <div class="ctl"><span class="lbl">레시피</span><span class="val" style="min-width:auto">Lv.${p.recipe[k]} / 10</span>
          <button class="btn" data-act="research" data-arg="${k}" ${p.recipe[k] >= 10 || p.cash < Sim.researchCost(p, k) ? 'disabled' : ''}>연구 <small>${short(Sim.researchCost(p, k))}</small></button>
          <button class="btn" data-act="campaign" data-arg="${k}" ${p.cash < Sim.CAMPAIGN_COST ? 'disabled' : ''}>광고 <small>${short(Sim.CAMPAIGN_COST)}</small></button></div>
        ${can.ok || fr.on ? `<div class="ctl"><span class="lbl">가맹</span><button class="btn ${fr.on ? '' : 'primary'}" data-act="fr" data-arg="${k}">${fr.on ? '모집 중단' : '모집 시작'}</button>
            <span class="lbl" style="width:auto">로열티</span><button class="step" data-act="roy" data-arg="${k}:-1" aria-label="로열티 내리기">−</button><span class="val" style="min-width:44px">${pct(fr.royalty).replace('.0', '')}</span><button class="step" data-act="roy" data-arg="${k}:1" aria-label="로열티 올리기">+</button></div>
            <p class="hint" style="margin:0">가맹점 ${frN} / ${can.own * 4}곳. 로열티가 낮을수록 지원자가 많아지고 점주가 오래 버텨요.</p>`
          : `<p class="hint" style="margin:0">가맹 조건: 직영점 ${can.own}/3곳, 인지도 ${can.brand.toFixed(0)}/20</p>`}
      </div>`;
    }
    return h;
  }

  function pStock() {
    const p = S.companies[0];
    let h = '<h3>우리 회사</h3>';
    if (!p.listed) {
      const c = Sim.ipoCheck(S);
      const row = (ok, t) => `<li class="${ok ? 'done' : ''}" style="${ok ? 'text-decoration:none' : ''}"><span class="ck"></span><span>${t}</span></li>`;
      h += `<div class="box"><p class="hint" style="margin-top:0">상장하면 새 주식 30%를 공모해 큰 자금을 모을 수 있어요. 대신 회장님 지분은 70%로 줄어요.</p>
        <ul class="quest" style="position:static;box-shadow:none;padding:0;width:auto;background:none;list-style:none;display:grid;gap:4px">
        ${row(c.stores >= 8, `매장 8곳 이상 (지금 ${c.stores}곳)`)}${row(c.value >= 3e9, `기업가치 30억원 이상 (지금 ${won(c.value)})`)}${row(c.profitable, '석 달 연속 흑자')}</ul>
        <div class="btn-row"><button class="btn primary" data-act="ipo" ${c.ok ? '' : 'disabled'}>🔔 상장하기 <small>약 ${short(p.value * 0.9 * 0.3 / 0.7)} 조달</small></button></div></div>`;
    } else {
      const ph = p.priceHist, ch = ph.length > 30 ? p.price / ph[ph.length - 31] - 1 : 0;
      h += `<div class="cards">
        <div class="stat"><span class="lbl">주가</span><b>${Math.round(p.price).toLocaleString('ko-KR')}원</b><span class="d ${ch >= 0 ? 'up' : 'down'}">30일 ${ch >= 0 ? '+' : ''}${(ch * 100).toFixed(1)}%</span></div>
        <div class="stat"><span class="lbl">시가총액</span><b>${won(Sim.marketCap(p))}</b></div>
        <div class="stat"><span class="lbl">회장님 지분</span><b>${pct(p.founderShares / p.shares)}</b></div>
        <div class="stat"><span class="lbl">받은 배당</span><b>${won(S.founder.cash)}</b></div></div>
        ${chart({ series: [{ data: ph.slice(-180), color: '#e3a33a', fill: true }] })}
        <div class="btn-row"><button class="btn" data-act="issue">유상증자 10% <small>약 ${short(p.shares * 0.1 * p.price * 0.95)}</small></button><button class="btn" data-act="buyback">자사주 매입 2% <small>${short(p.shares * 0.02 * p.price * 1.02)}</small></button></div>
        <div class="ctl"><span class="lbl">배당 성향</span><button class="step" data-act="div" data-arg="-0.1" aria-label="배당 줄이기">−</button><span class="val">${Math.round(p.dividend * 100)}%</span><button class="step" data-act="div" data-arg="0.1" aria-label="배당 늘리기">+</button></div>
        <p class="hint">흑자인 달에 순이익의 일부를 배당해요. 배당을 하면 투자자들이 주가를 조금 더 높게 쳐줘요. 지분이 50% 아래로 내려가지 않게 조심하세요.</p>`;
    }
    h += '<h3>경쟁사 주식</h3><p class="hint" style="margin-top:0">지분을 50% 넘게 모으면 회사를 통째로 인수할 수 있어요. 창업주 지분 40%는 시장에 나오지 않아요.</p>';
    for (const c of S.companies) {
      if (c.isPlayer || c.dead) continue;
      const mine = (p.holdings[c.id] || 0) / c.shares, ph = c.priceHist, ch = ph.length > 30 ? c.price / ph[ph.length - 31] - 1 : 0;
      const canAcq = mine > 0.5;
      h += `<div class="box"><div class="box-h"><span class="dot" style="background:${c.color}"></span><strong>${esc(c.name)}</strong><span class="chip ${ch >= 0 ? 'good' : 'bad'}">${ch >= 0 ? '+' : ''}${(ch * 100).toFixed(1)}%</span></div>
        ${chart({ series: [{ data: ph.slice(-120), color: c.color }], spark: true }, 'sm')}
        <div class="rows"><span>주가 · 시총</span><span>${Math.round(c.price).toLocaleString('ko-KR')}원 · ${short(Sim.marketCap(c))}</span><span>내 지분</span><span>${pct(mine)}</span><span>매장</span><span>${S.stores.filter(s => s.owner === c.id).length}곳</span></div>
        <div class="btn-row"><button class="btn" data-act="buy" data-arg="${c.id}:0.01">1% 매수 <small>${short(c.shares * 0.01 * c.price * 1.006)}</small></button><button class="btn" data-act="buy" data-arg="${c.id}:0.05">5% 매수 <small>${short(c.shares * 0.05 * c.price * 1.03)}</small></button><button class="btn" data-act="sell" data-arg="${c.id}:0.05" ${mine <= 0 ? 'disabled' : ''}>5% 매도</button>
        ${canAcq ? `<button class="btn primary" data-act="acquire" data-arg="${c.id}">🏆 인수하기</button>` : ''}</div></div>`;
    }
    return h;
  }

  function pMarket() {
    const alive = S.companies.filter(c => !c.dead);
    let h = '<h3>업종별 점유율 (오늘 손님 기준)</h3>';
    for (const k of Sim.CAT_KEYS) {
      const ms = Sim.marketShare(S, k);
      h += `<div style="display:flex;justify-content:space-between;font-size:13px"><span>${Sim.CATS[k].icon} ${Sim.CATS[k].name}</span><span class="chip">하루 ${ms.total.toLocaleString('ko-KR')}명</span></div>
        <div class="share">${ms.total ? alive.map(c => `<i title="${esc(c.name)} ${pct((ms.by[c.id] || 0) / ms.total)}" style="width:${(ms.by[c.id] || 0) / ms.total * 100}%;background:${c.color}"></i>`).join('') : ''}</div>`;
    }
    h += `<div style="display:flex;flex-wrap:wrap;gap:10px;font-size:12.5px">${alive.map(c => `<span><span class="dot" style="background:${c.color}"></span>${esc(c.name)}</span>`).join('')}</div>
      <h3>회사 비교</h3><table class="t"><thead><tr><th>회사</th><th class="r">매장</th><th class="r">평점</th><th class="r">인지도</th><th class="r">가치</th></tr></thead><tbody>`;
    for (const c of alive) {
      const ss = S.stores.filter(s => s.owner === c.id);
      const rating = ss.length ? ss.reduce((a, s) => a + s.rating, 0) / ss.length : 0;
      const top = Math.max(...Sim.CAT_KEYS.map(k => c.brand[k]));
      h += `<tr><td><span class="dot" style="background:${c.color}"></span>${esc(c.name)}</td><td class="r">${ss.length}</td><td class="r">${rating ? rating.toFixed(1) : '—'}</td><td class="r">${top.toFixed(0)}</td><td class="r">${short(c.listed ? Sim.marketCap(c) : c.value)}</td></tr>`;
    }
    h += `</tbody></table><h3>도시</h3><div class="cards"><div class="stat"><span class="lbl">인구</span><b>${Sim.population(S).toLocaleString('ko-KR')}명</b></div><div class="stat"><span class="lbl">경기</span><b>${S.econ.mult > 1 ? '☀️ 호황' : S.econ.mult < 1 ? '🌧️ 둔화' : '⛅ 보통'}</b></div></div>
      ${S.stats.pop.length > 1 ? chart({ series: [{ data: S.stats.pop, color: '#7fb2d9', fill: true }] }) : ''}`;
    return h;
  }

  function pNews() {
    return `<ul class="news">${S.news.map(n => { const d = Sim.dateOf(S, Math.max(0, n.day - 1)); return `<li class="${n.kind}"><span class="when">${d.year}년 ${d.month}/${d.day}</span><span>${esc(n.text)}</span></li>`; }).join('')}</ul>`;
  }

  // ---------- 차트 ----------
  function drawChart(cv, cfg) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const all = [].concat(...(cfg.series || []).map(s => s.data), cfg.bars ? cfg.bars.data : []);
    if (!all.length) return;
    let lo = Math.min(...all), hi = Math.max(...all);
    if (cfg.zero) { lo = Math.min(0, lo); hi = Math.max(0, hi); }
    if (hi === lo) { hi += 1; lo -= 1; }
    const padL = cfg.spark ? 2 : 4, padR = cfg.spark ? 4 : 4, padT = cfg.spark ? 3 : 14, padB = cfg.spark ? 3 : (cfg.labels ? 16 : 6);
    const X = (i, n) => padL + (n <= 1 ? 0 : i / (n - 1)) * (w - padL - padR);
    const Y = v => padT + (1 - (v - lo) / (hi - lo)) * (h - padT - padB);
    const muted = '#7c8a82';
    if (!cfg.spark) {
      ctx.strokeStyle = '#e6ede7'; ctx.lineWidth = 1;
      for (let i = 0; i <= 2; i++) { const y = padT + i * (h - padT - padB) / 2; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke(); }
      if (cfg.zero && lo < 0) { ctx.strokeStyle = '#c9d6cc'; ctx.beginPath(); ctx.moveTo(padL, Y(0)); ctx.lineTo(w - padR, Y(0)); ctx.stroke(); }
      ctx.fillStyle = muted; ctx.font = '10.5px "Gowun Dodum", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(short(hi), padL, 0);
    }
    if (cfg.bars) {
      const n = cfg.bars.data.length, bw = Math.max(3, (w - padL - padR) / n * 0.6);
      cfg.bars.data.forEach((v, i) => {
        const x = padL + (i + 0.5) / n * (w - padL - padR);
        ctx.fillStyle = cfg.bars.color; const y0 = Y(Math.max(0, lo)), y1 = Y(v);
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - bw / 2, Math.min(y0, y1), bw, Math.abs(y1 - y0), 3) : ctx.rect(x - bw / 2, Math.min(y0, y1), bw, Math.abs(y1 - y0)); ctx.fill();
      });
      if (cfg.labels) {
        ctx.fillStyle = muted; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.font = '10px "Gowun Dodum", sans-serif';
        cfg.labels.forEach((l, i) => { if (n > 8 && i % 2) return; ctx.fillText(l, padL + (i + 0.5) / n * (w - padL - padR), h); });
      }
    }
    for (const s of cfg.series || []) {
      const n = s.data.length; if (!n) continue;
      const xs = cfg.bars ? (i => padL + (i + 0.5) / n * (w - padL - padR)) : (i => X(i, n));
      ctx.beginPath(); s.data.forEach((v, i) => i ? ctx.lineTo(xs(i), Y(v)) : ctx.moveTo(xs(i), Y(v)));
      ctx.strokeStyle = s.color; ctx.lineWidth = cfg.spark ? 1.5 : 2; ctx.lineJoin = 'round'; ctx.stroke();
      if (s.fill) { ctx.lineTo(xs(n - 1), h - padB); ctx.lineTo(xs(0), h - padB); ctx.closePath(); ctx.globalAlpha = 0.15; ctx.fillStyle = s.color; ctx.fill(); ctx.globalAlpha = 1; }
      ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(xs(n - 1), Y(s.data[n - 1]), cfg.spark ? 2 : 3, 0, 7); ctx.fill();
    }
  }

  // ---------- 행동 ----------
  function selStore() { if (!selected) return null; const t = Sim.tile(S, selected.x, selected.y); return t.b && t.b.k === 'store' ? S.stores.find(s => s.id === t.b.id) : null; }
  function selFac() { if (!selected) return null; const t = Sim.tile(S, selected.x, selected.y); return t.b && t.b.k === 'fac' ? S.facs.find(f => f.id === t.b.id) : null; }
  function arm(key) { armed = key; clearTimeout(armedTimer); armedTimer = setTimeout(() => { armed = null; renderAll(); }, 3500); }

  function act(a, arg) {
    const st = selStore();
    switch (a) {
      case 'deselect': selected = null; R.sel = null; break;
      case 'questmin': questMin = !questMin; break;
      case 'price': if (st) { const base = Sim.CATS[st.cat].price; st.price = Math.max(base * 0.6, Math.min(base * 1.8, st.price + +arg)); st.price = Math.round(st.price / 100) * 100; } break;
      case 'staff': if (st) { st.auto = false; st.staff = Math.max(1, Math.min(Sim.maxStaff(st), st.staff + +arg)); } break;
      case 'auto': if (st) { if (!S.autoStaff) { S.autoStaff = true; st.auto = true; } else st.auto = !st.auto; } break;
      case 'mkt': if (st) st.mkt = +arg; break;
      case 'upgrade': if (st) result(Sim.upgradeStore(S, st.id), '매장을 넓혔어요. 더 많은 손님을 받을 수 있어요.'); break;
      case 'buyprop': if (st) result(Sim.buyProperty(S, st.id), '건물을 샀어요. 이제 임대료가 들지 않아요.'); break;
      case 'close': if (st) { if (armed === 'close:' + st.id) { armed = null; result(Sim.closeStore(S, st.id)); selected = null; R.sel = null; } else arm('close:' + st.id); } break;
      case 'facup': { const f = selFac(); if (f) result(Sim.upgradeFacility(S, f.id), '시설을 확장했어요.'); break; }
      case 'facdel': { const f = selFac(); if (f) { if (armed === 'facdel:' + f.id) { armed = null; result(Sim.removeFacility(S, f.id), '시설을 철거했어요.'); selected = null; R.sel = null; } else arm('facdel:' + f.id); } break; }
      case 'buildhere': { const prev = tool; tool = 'store:' + arg; buildAt(selected.x, selected.y); tool = prev; break; }
      case 'research': result(Sim.research(S, 0, arg), `${Sim.CATS[arg].name} 레시피가 좋아졌어요!`); break;
      case 'campaign': result(Sim.campaign(S, 0, arg), `${Sim.CATS[arg].name} 광고를 내보냈어요.`); break;
      case 'fr': { const fr = S.companies[0].fr[arg]; result(Sim.setFranchise(S, arg, !fr.on), fr.on ? '' : '가맹점 모집 공고를 냈어요.'); break; }
      case 'roy': { const [k, d] = arg.split(':'); const fr = S.companies[0].fr[k]; Sim.setFranchise(S, k, fr.on, Math.round((fr.royalty + d * 0.01) * 100) / 100); break; }
      case 'farm': Sim.setFarm(S, !S.companies[0].farm); break;
      case 'logiview': $('btnLogi').classList.toggle('on'); refreshOverlay(); break;
      case 'borrow': result(Sim.borrow(S), '1억원을 빌렸어요.'); break;
      case 'repay': result(Sim.repay(S), '1억원을 갚았어요.'); break;
      case 'autostaff': S.autoStaff = arg === '1'; break;
      case 'ipo': result(Sim.ipo(S)); break;
      case 'issue': result(Sim.issueShares(S)); break;
      case 'buyback': result(Sim.buyback(S), '자사주를 사들였어요.'); break;
      case 'div': Sim.setDividend(S, Math.round((S.companies[0].dividend + +arg) * 10) / 10); break;
      case 'buy': { const [id, p] = arg.split(':'); result(Sim.buyStake(S, +id, +p), '주식을 샀어요.'); break; }
      case 'sell': { const [id, p] = arg.split(':'); result(Sim.sellStake(S, +id, +p), '주식을 팔았어요.'); break; }
      case 'acquire': result(Sim.acquire(S, +arg)); break;
      case 'goto': { const s = S.stores.find(x => x.id === +arg); if (s) { selected = { x: s.x, y: s.y }; R.sel = selected; R.centerOn(s.x, s.y); closePanelSm(); } break; }
      case 'gotofac': { const f = S.facs.find(x => x.id === +arg); if (f) { selected = { x: f.x, y: f.y }; R.sel = selected; R.centerOn(f.x, f.y); closePanelSm(); } break; }
      case 'filter': storeFilter = arg; break;
      case 'save': writeSave(); break;
      case 'newgame': if (armed === 'newgame' || S.gameOver) { armed = null; openModal(); } else arm('newgame'); break;
      case 'closepanel': closePanelSm(); break;
    }
    renderAll();
  }
  function closePanelSm() { $('panel').classList.remove('open'); }

  function renderAll() { if (!S) return; renderTop(); renderQuest(); renderInspector(); renderPanel(); }

  // ---------- 입력 ----------
  function bindInput() {
    const cv = $('map');
    const ptrs = new Map(); let down = null, dragged = false, pinch = null;
    cv.addEventListener('pointerdown', e => {
      cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
      if (ptrs.size === 1) { down = { x: e.offsetX, y: e.offsetY, cx: R.cam.x, cy: R.cam.y }; dragged = false; }
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: R.cam.z }; dragged = true; }
    });
    cv.addEventListener('pointermove', e => {
      if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
      if (pinch && ptrs.size === 2) {
        const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
        R.zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, (pinch.z * d / pinch.d) / R.cam.z); return;
      }
      if (down) {
        const dx = e.offsetX - down.x, dy = e.offsetY - down.y;
        if (!dragged && Math.hypot(dx, dy) > 6) dragged = true;
        if (dragged) { R.cam.x = down.cx - dx / R.cam.z; R.cam.y = down.cy - dy / R.cam.z; cv.style.cursor = 'grabbing'; }
      }
      const p = R.pick(e.offsetX, e.offsetY);
      R.hover = p;
      if (tool !== 'select' && p) R.ghost = { x: p.x, y: p.y, ok: Sim.isLot(Sim.tile(S, p.x, p.y)), icon: toolIcon() };
    });
    const up = e => {
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinch = null;
      if (ptrs.size === 0 && down) {
        cv.style.cursor = '';
        if (!dragged && !modalOpen) {
          const p = R.pick(e.offsetX, e.offsetY);
          if (p) {
            if (tool !== 'select') { if (Sim.isLot(Sim.tile(S, p.x, p.y))) buildAt(p.x, p.y); else toast('빈 땅을 골라주세요. 길·건물 위에는 지을 수 없어요.', 'bad'); }
            else { selected = p; R.sel = p; armed = null; renderInspector(); }
          }
        }
        down = null;
      }
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', () => { R.hover = null; if (tool === 'select') R.ghost = null; });
    cv.addEventListener('wheel', e => { e.preventDefault(); R.zoomAt(e.offsetX, e.offsetY, e.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });
    cv.addEventListener('contextmenu', e => { e.preventDefault(); if (tool !== 'select') setTool('select'); });

    $('tools').addEventListener('click', e => { const b = e.target.closest('[data-tool]'); if (b) setTool(b.dataset.tool); });
    document.querySelector('.speed').addEventListener('click', e => { const b = e.target.closest('[data-speed]'); if (b) { speed = +b.dataset.speed; renderTop(); } });
    $('tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; $('tabBody').scrollTop = 0; renderTabs(); renderPanel(); } });
    for (const id of ['tabBody', 'inspector', 'quest', 'banner', 'tabs']) $(id).addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && !b.disabled) act(b.dataset.act, b.dataset.arg); });
    $('btnFit').addEventListener('click', () => R.fit());
    $('btnLogi').addEventListener('click', () => { $('btnLogi').classList.toggle('on'); refreshOverlay(); if (tab === 'logi') renderPanel(); });
    $('btnPanel').addEventListener('click', () => { $('panel').classList.toggle('open'); renderPanel(); });
    window.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || modalOpen) return;
      if (e.code === 'Space') { e.preventDefault(); speed = speed ? 0 : 1; renderTop(); }
      else if (e.key === '1') { speed = 1; renderTop(); } else if (e.key === '2') { speed = 2; renderTop(); } else if (e.key === '3') { speed = 4; renderTop(); }
      else if (e.key === 'Escape') { setTool('select'); selected = null; R.sel = null; renderInspector(); }
    });
    new ResizeObserver(() => R.resize()).observe($('stage'));
    document.addEventListener('visibilitychange', () => { if (document.hidden && !modalOpen) writeSave(true); });

    $('btnNew').addEventListener('click', () => {
      const name = ($('nameInput').value || '').trim() || '모락상회';
      S = Sim.newGame({ seed: (Date.now() % 2147483647) | 0, name });
      start();
      toast('왼쪽에서 ☕ 카페를 골라 첫 가게를 열어 보세요!');
    });
    $('btnContinue').addEventListener('click', () => { const s = readSave(); if (s) { S = s; start(); toast('다시 오신 걸 환영해요.'); } });
    $('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('btnNew').click(); });
  }

  function openModal() {
    modalOpen = true; speed = 0;
    $('btnContinue').hidden = !readSave();
    $('modal').hidden = false;
    renderTop();
  }
  function start() {
    modalOpen = false; $('modal').hidden = true;
    selected = null; tool = 'select'; armed = null;
    R.setState(S); R.sel = null; R.overlay = null; R.fit();
    speed = 1; renderTabs(); renderTools(); renderAll();
  }

  // ---------- 루프 ----------
  function frame(now) {
    const dt = Math.min(100, now - last); last = now;
    if (!modalOpen && speed > 0 && !S.gameOver) {
      acc += dt * speed;
      let n = 0;
      while (acc >= DAY_MS && n < 3) {
        acc -= DAY_MS; n++;
        const ev = Sim.step(S);
        R.onDay(ev);
        if (S.day % Sim.DAYS_PER_MONTH === 0) writeSave(true);
      }
      if (n) {
        if (tool.startsWith('store:') && S.day % 3 === 0) refreshOverlay();
        renderAll();
      }
    }
    R.draw(dt, modalOpen ? 1 : speed);
    requestAnimationFrame(frame);
  }

  function boot(data) {
    R = new window.Renderer($('map'));
    bindInput();
    const hotSave = data && data.save ? (() => { try { return Sim.deserialize(data.save); } catch (e) { return null; } })() : null;
    if (hotSave) { S = hotSave; tab = data.tab || tab; start(); speed = data.speed != null ? data.speed : 1; }
    else {
      S = Sim.newGame({ seed: 20261109 });
      R.setState(S); R.fit();
      renderTabs(); renderTools(); renderAll();
      openModal();
    }
    window.__morak = { get S() { return S; }, R };
    window.claude?.hot?.snapshot?.(() => ({ save: modalOpen ? null : Sim.serialize(S), speed, tab }));
    requestAnimationFrame(frame);
  }
  const hot = window.claude?.hot;
  if (hot && hot.ready) hot.ready(boot); else boot(hot?.data ?? {});
})();
