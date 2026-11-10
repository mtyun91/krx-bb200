/* 모락모락 타운 — 화면 조작과 게임 루프 (v2: 24시간 시계, 매장 내부, 직원, 상권) */
(function () {
  'use strict';
  const Sim = window.Sim, Renderer = window.Renderer, Snd = window.GameAudio;
  const $ = id => document.getElementById(id);
  const SAVE_KEY = 'morak.save.v6';
  const HOUR_MS = 2500;                 // 1배속: 게임 1시간 = 2.5초 (하루 1분)
  const SPEEDS = [0, 1, 3, 10];

  let S = null, R = null, speedIdx = 0, tool = 'select', tab = 'company', selected = null;
  let acc = 0, last = performance.now(), modalOpen = true, storeFilter = 'all', armed = null, armedTimer = 0;
  let charts = [], lastUi = 0, dirty = true, nightSkip = false;
  let openForm = null;                  // 개설 설정 { x, y, cat, size, style, tier }
  let storeView = null;                 // { id, tab }
  let hoverStaff = null, coCat = 'cafe';
  let newDiff = 'normal', newEvents = true, newSponsor = false;
  let newLogo = 'circle', newColor = '#f2b950', lotAll = false, pickerOpen = false, lastQuests = 0, lastNews = 0;

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const won = v => Sim.won(v);
  const short = v => Sim.won(v).replace('원', '');
  const pct = v => (v * 100).toFixed(1).replace('.0', '') + '%';
  const hoodOfXY = (x, y) => Sim.HOODS[Sim.tile(S, x, y).h];
  const storeName = st => `${hoodOfXY(st.x, st.y).name} ${Sim.CATS[st.cat].name}`;
  function stars(r) { const n = Math.round(r); return `<span class="stars" aria-label="평점 ${r.toFixed(1)}">${'★'.repeat(n)}<span class="off">${'★'.repeat(5 - n)}</span></span> ${r.toFixed(1)}`; }
  const logo = (c, size) => `<canvas class="logo-c" data-logo="${c.id}" width="${size || 18}" height="${size || 18}" style="width:${size || 18}px;height:${size || 18}px"></canvas>`;
  function paintLogos(rootEl) {
    rootEl.querySelectorAll('canvas[data-logo]').forEach(cv => {
      const c = cv.dataset.logo === 'new' ? { name: ($('nameInput').value || '모').trim() || '모', color: newColor, logo: newLogo } : S.companies[+cv.dataset.logo];
      const sz = parseInt(cv.style.width) || 18, dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = sz * dpr; cv.height = sz * dpr;
      const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, sz, sz);
      Renderer.drawLogo(ctx, c, sz / 2, sz / 2, sz * 0.4);
    });
  }
  const statBar = (label, v, cls) => `<div class="sbar"><span>${label}</span><div class="bar"><i class="${cls || ''}" style="width:${Math.round(v)}%"></i></div><b>${Math.round(v)}</b></div>`;
  function clockText(hf) {
    const h = Math.floor(hf) % 24, m = Math.floor((hf % 1) * 60 / 10) * 10;
    return `${h < 12 ? '오전' : '오후'} ${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}`;
  }

  // ---------- 저장 ----------
  function readSave() { try { const s = localStorage.getItem(SAVE_KEY); return s ? Sim.deserialize(s) : null; } catch (e) { return null; } }
  const OLD_KEYS = ['morak.save.v5', 'morak.save.v4', 'morak.save.v3', 'morak.save.v2'];
  function oldSaveExists() { try { return OLD_KEYS.some(k => localStorage.getItem(k)); } catch (e) { return false; } }
  // 덮어쓰기 전에 바로 앞 저장을 한 칸 보관해 둠
  function writeSave(quiet) { try { const prev = localStorage.getItem(SAVE_KEY); if (prev) localStorage.setItem(SAVE_KEY + '.prev', prev); localStorage.setItem(SAVE_KEY, Sim.serialize(S)); if (!quiet) toast('저장했어요.', 'good'); } catch (e) { if (!quiet) toast('이 브라우저에서는 저장할 수 없어요.', 'bad'); } }

  // ---------- 도구 ----------
  const TOOLS = [
    { id: 'select', ic: '👆', nm: '살펴보기' }, 'sep',
    { id: 'storepick', ic: '🏪', nm: '매장 열기' }, 'sep',
    ...['hq', 'warehouse', 'kitchen', 'roastery'].map(k => ({ id: 'fac:' + k, ic: Sim.FAC[k].icon, nm: Sim.FAC[k].name, co: Sim.FAC[k].cost })), 'sep',
    ...['factory', 'rental', 'smartfarm'].map(k => ({ id: 'fac:' + k, ic: Sim.FAC[k].icon, nm: Sim.FAC[k].name, co: Sim.FAC[k].cost || null, varCost: k === 'rental' })), 'sep',
    ...Object.keys(Sim.PUBLIC).map(k => ({ id: 'pub:' + k, ic: Sim.PUBLIC[k].icon, nm: Sim.PUBLIC[k].name, co: Sim.PUBLIC[k].cost, sponsor: Sim.PUBLIC[k].sponsor })),
  ];
  function renderTools() {
    const cur = tool.startsWith('store:') ? tool.split(':')[1] : null;
    $('tools').innerHTML = TOOLS.filter(t => t === 'sep' || !t.sponsor || (S && S.opts && S.opts.sponsor)).map(t => t === 'sep' ? '<div class="sep"></div>' : t.id === 'storepick' ?
      `<button class="tool ${cur || pickerOpen ? 'on' : ''}" data-tool="storepick" title="업종을 골라 매장 열기"><span class="ic">${cur ? Sim.CATS[cur].icon : '🏪'}</span><span class="nm">${cur ? Sim.CATS[cur].name : '매장 열기'}</span><span class="co">${Sim.CAT_KEYS.length}개 업종</span></button>` :
      `<button class="tool ${tool === t.id ? 'on' : ''}" data-tool="${t.id}" title="${esc(t.nm)}${t.co ? ' · ' + won(t.co) : ''}">
        <span class="ic">${t.ic}</span><span class="nm">${esc(t.nm)}</span>${t.co ? `<span class="co">${short(t.co)}</span>` : t.varCost ? '<span class="co">땅값 따라</span>' : ''}</button>`).join('');
  }
  function renderPicker() {
    const el = $('catPicker');
    el.hidden = !pickerOpen;
    if (!pickerOpen) return;
    el.innerHTML = `<div class="cp-head"><b>어떤 가게를 열까요?</b><button class="x" data-pick="close" aria-label="닫기">✕</button></div><div class="cp-grid">${Sim.CAT_KEYS.map(k => { const C = Sim.CATS[k]; return `<button class="cp ${tool === 'store:' + k ? 'on' : ''}" data-pick="${k}"><span class="ic">${C.icon}</span><b>${C.name}</b><small>객단가 ${short(C.ticket)} · ${C.hours[0]}~${C.hours[1]}시</small><small class="tr">${esc((C.traits || [''])[0])}</small></button>`; }).join('')}</div>`;
  }
  function setTool(id) {
    if (id === 'storepick') { pickerOpen = !pickerOpen; renderPicker(); renderTools(); return; }
    pickerOpen = false; renderPicker();
    tool = (tool === id && id !== 'select') ? 'select' : id;
    renderTools();
    $('map').classList.toggle('building', tool !== 'select');
    refreshOverlay();
    if (tool !== 'select') {
      const [kind, k] = tool.split(':');
      toast(kind === 'store' ? `${Sim.CATS[k].name}: 초록빛이 진할수록 손님이 많이 올 자리예요. 빈 땅을 눌러 계약 조건을 정해요.` : kind === 'fac' ? Sim.FAC[k].desc : Sim.PUBLIC[k].desc);
    } else R.ghost = null;
  }
  function refreshOverlay() {
    const [kind, k] = tool.split(':');
    if (kind === 'store') R.overlay = { type: 'potential', data: Sim.lotPotentials(S, k, 0) };
    else if (kind === 'fac' || $('btnLogi').classList.contains('on')) R.overlay = { type: 'logistics' };
    else R.overlay = null;
  }
  function toolIcon() { const [kind, k] = tool.split(':'); return kind === 'store' ? Sim.CATS[k].icon : kind === 'fac' ? Sim.FAC[k].icon : kind === 'pub' ? Sim.PUBLIC[k].icon : ''; }
  function clickBuild(x, y) {
    const [kind, k] = tool.split(':');
    if (kind === 'store') { openForm = { x, y, cat: k, size: 2, style: 'nordic', tier: 2, menu: Sim.defaultMenu(k, 2), sig: null }; selected = { x, y }; R.sel = selected; renderInspector(); return; }
    let r;
    if (kind === 'fac') { if (k === 'rental' && !confirmRental(x, y)) return; r = Sim.buildFacility(S, 0, x, y, k); if (r.ok) { toast(`${Sim.FAC[k].icon} ${Sim.FAC[k].name}을 지었어요.`, 'good'); R.pop(x, y); Snd.play('build'); } }
    else if (kind === 'pub') { r = Sim.buildPublic(S, x, y, k); if (r.ok) { R.pop(x, y); Snd.play('build'); } }
    if (r && !r.ok) toast(r.msg || '지을 수 없어요.', 'bad');
    if (r && r.ok) { refreshOverlay(); dirty = true; }
  }
  let rentalArm = null;
  function confirmRental(x, y) {
    const key = x + ',' + y, cost = Sim.facCost(S, 'rental', x, y);
    if (rentalArm === key) { rentalArm = null; return true; }
    rentalArm = key; toast(`임대 빌딩 건축비 ${won(cost)} (땅값 + 공사비). 한 번 더 누르면 지어요.`); return false;
  }
  function confirmOpen() {
    const f = openForm; if (!f) return;
    const r = Sim.openStore(S, 0, f.x, f.y, f.cat, { size: f.size, style: f.style, tier: f.tier, menu: f.menu, sig: f.sig });
    if (!r.ok) { toast(r.msg, 'bad'); return; }
    toast(`${Sim.CATS[f.cat].icon} ${storeName(r.store)}을 열었어요! 직원 ${r.store.staff.length}명이 함께해요.`, 'good');
    R.pop(f.x, f.y); Snd.play('build');
    openForm = null; selected = { x: r.store.x, y: r.store.y }; R.sel = selected;
    if (tool.startsWith('store:')) setTool('select');
    dirty = true;
  }

  // ---------- 토스트 ----------
  function toast(text, kind) {
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || ''); el.textContent = text;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), 3000);
    while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
  }
  function result(r, okText) { if (!r) return; if (r.ok) { const m = okText || r.msg; if (m) toast(m, 'good'); } else { toast(r.msg || '할 수 없어요.', 'bad'); Snd.play('bad'); } dirty = true; }

  // ---------- 상단 ----------
  function hourF() { return S.hour + Math.min(0.999, acc / HOUR_MS); }
  function renderClock() {
    const d = Sim.dateOf(S), w = Sim.WEATHER[S.weather.kind];
    const seasonIc = { spring: '🌸', summer: '🌿', autumn: '🍁', winter: '❄️' }[Sim.seasonOf(S)];
    $('date').innerHTML = `${seasonIc} ${d.year}.${d.month}.${d.day} (${d.wdName})${d.holiday ? ' <span class="chip bad">휴일</span>' : ''}`;
    $('clock').textContent = clockText(hourF());
    { // 장면 이름(시안 상단 띠): 계절 + 때 + 그때 동네에서 일어나는 일
      const hh = Math.floor(hourF()) % 24, se = Sim.seasonOf(S), wk = S.weather.kind, dd = Sim.dateOf(S);
      const sn = { spring: '봄날', summer: '여름', autumn: '가을', winter: '겨울' }[se];
      const tod = hh < 6 ? '새벽' : hh < 11 ? '아침' : hh < 14 ? '점심' : hh < 17 ? '오후' : hh < 21 ? '저녁' : '밤';
      const act = wk === 'rain' && hh >= 16 ? '배달과 실내 손님' : wk === 'snow' ? '눈 오는 거리' : hh < 11 ? '개점 준비' : hh < 14 ? '점심 피크' : hh < 17 ? (se === 'summer' && (dd.weekend || dd.holiday) ? '해변 나들이' : '느긋한 오후') : hh < 21 ? (se === 'winter' ? '따뜻한 저녁 장사' : '저녁 손님') : (se === 'winter' ? '연말 야경' : '야경');
      const sc = $('scene'); if (sc) sc.textContent = `${sn} ${tod} · ${act}`;
    }
    const amt = S.weather.amt || 0, wn = S.weather.kind === 'rain' ? (amt < 0.4 ? ' 이슬비' : amt > 0.75 ? ' 장대비' : ' 비') : S.weather.kind === 'snow' ? (amt < 0.4 ? ' 싸락눈' : amt > 0.75 ? ' 함박눈' : ' 눈') : '';
    $('weather').textContent = `${w.icon}${wn} ${S.weather.temp}°`;
    $('weather').title = w.name;
    $('nightSkip').hidden = !nightSkip;
  }
  function renderTop() {
    const p = S.companies[0];
    $('coName').textContent = p.name; $('coLogo').dataset.logo = '0'; paintLogos($('coLogo').parentNode);
    $('kCash').textContent = won(p.cash); $('kCash').className = p.cash < 0 ? 'down' : '';
    $('kValLbl').textContent = p.listed ? '시가총액' : '기업가치';
    $('kVal').textContent = won(p.listed ? Sim.marketCap(p) : p.value);
    $('kStores').textContent = `${S.stores.filter(s => s.owner === 0).length}곳`;
    $('kStaff').textContent = `${S.stores.filter(s => s.owner === 0 && !s.franchise).reduce((a, s) => a + s.staff.length, 0)}명`;
    document.querySelectorAll('.speed button').forEach(b => b.classList.toggle('on', +b.dataset.speed === speedIdx));
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
    $('quest').className = 'quest' + (questMin ? ' min' : '');
    $('quest').innerHTML = `<h3>목표 <span class="chip">${done}/${Sim.QUESTS.length}</span><button data-act="questmin">${questMin ? '펼치기' : '접기'}</button></h3>
      <ul>${next.map(q => `<li><span class="ck"></span><span>${esc(q.text)}</span>${q.reward ? `<span class="rw">+${short(q.reward)}</span>` : ''}</li>`).join('')}
      ${!next.length ? '<li>모든 목표를 이뤘어요. 도시의 전설이 되었네요!</li>' : ''}</ul>`;
  }

  // ---------- 정보 카드 ----------
  function head(big, title, sub, extra) { return `<div class="insp-head"><span class="big">${big}</span><div class="ttl"><h2>${title}</h2><div class="sub">${sub}</div></div>${extra || ''}<button class="x" data-act="deselect" aria-label="닫기">✕</button></div>`; }
  function segBars(obj) {
    const total = Sim.SEG_KEYS.reduce((a, k) => a + obj[k], 0) || 1;
    const col = { res: '#9ccf8f', off: '#7fb2d9', uni: '#f2b950', tour: '#e98a9a' };
    return `<div class="share">${Sim.SEG_KEYS.map(k => `<i style="width:${obj[k] / total * 100}%;background:${col[k]}" title="${Sim.SEG[k].name} ${pct(obj[k] / total)}"></i>`).join('')}</div>
      <div class="legend">${Sim.SEG_KEYS.map(k => `<span><span class="dot" style="background:${col[k]}"></span>${Sim.SEG[k].name} ${Math.round(obj[k] / total * 100)}%</span>`).join('')}</div>`;
  }
  function renderInspector() {
    const el = $('inspector');
    if (!selected) { el.hidden = true; return; }
    const t = Sim.anchorOf(S, Sim.tile(S, selected.x, selected.y));
    const H = Sim.HOODS[t.h], hd = S.hoods[t.h];
    const hot = hd.hype >= 40 ? ' <span class="chip bad">🔥 요즘 뜨는 동네</span>' : '';
    let h = '';
    charts = charts.filter(c => !c.insp);
    if (t.t === 'road') h = head('🛣️', '도로', H.name) + '<p class="hint">길에는 지을 수 없어요. 사람과 배송 트럭이 오가는 곳이에요.</p>';
    else if (t.t === 'mount') h = head('⛰️', '달빛산', H.name) + '<p class="hint">개발할 수 없는 산이에요. 산자락 근처는 조망이 좋아 임대료가 조금 올라가요.</p>';
    else if (t.t === 'bridge') h = head('🌉', '다리', H.name) + '<p class="hint">강 양쪽 동네를 잇는 다리예요. 출퇴근 시간에 차가 몰려요.</p>';
    else if (t.t === 'water') h = t.sea ? head('🌊', '모락 바다', H.name) + '<p class="hint">잔잔한 바다예요. 바다가 보이는 자리는 임대료가 조금 더 비싸요.</p>' : head('🌊', '물', H.name) + '<p class="hint">오리들이 사는 강과 호수예요. 관광객이 이 근처를 좋아해요.</p>';
    else if (!t.b) h = openForm && openForm.x === t.x && openForm.y === t.y ? openFormCard(t) : lotCard(t, hot);
    else if (t.b.k === 'store') h = storeSummary(S.stores.find(s => s.id === t.b.id));
    else if (t.b.k === 'fac') h = facCard(S.facs.find(f => f.id === t.b.id));
    else if (t.b.k === 'lm') {
      const L = Sim.LANDMARKS[t.b.kind];
      h = head('🏛️', L.name, `랜드마크 · ${H.name}`) + `<div class="rows"><span>하루 방문객</span><span>약 ${L.pop.toLocaleString('ko-KR')}명</span><span>손님 성향</span><span>${Sim.PROFILE_NAME[L.prof]}</span><span>주변 임대료</span><span>최대 +${Math.round(L.rent * 100)}%</span><span>크기</span><span>${L.w}×${L.d}칸</span></div><p class="hint">랜드마크 주변 5칸은 땅값이 오르고 관광객과 쇼핑객이 많이 지나가요.</p>`;
    } else if (Sim.BTYPES[t.b.k] && Sim.BTYPES[t.b.k].cls !== 'pub') {
      const T = Sim.BTYPES[t.b.k], pop = Math.round(Sim.buildingPop(t.b) * hd.popMult);
      const ic = { res: '🏠', com: '🏪', off: '🏢', edu: '🏫', ind: '🏭' }[T.cls];
      const who = T.cls === 'res' ? '사는 사람' : T.cls === 'off' || T.cls === 'ind' ? '일하는 사람' : T.cls === 'edu' ? '학생' : '오가는 손님';
      const pm = Sim.PROFILE_MULT[T.prof] || {};
      const likes = Object.entries(pm).filter(([, v]) => v >= 1.2).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => Sim.CATS[k].icon + Sim.CATS[k].name).join(', ');
      const dislikes = Object.entries(pm).filter(([, v]) => v <= 0.7).map(([k]) => Sim.CATS[k].name).join(', ');
      h = head(ic, T.name, `${Sim.CLS_NAME[T.cls]} · ${H.name}${hot}`) + `<div class="rows"><span>크기 · 층수</span><span>${t.b.w || 1}×${t.b.d || 1}칸 · ${t.b.lv}층</span><span>${who}</span><span>${pop.toLocaleString('ko-KR')}명</span><span>손님 성향</span><span>${Sim.PROFILE_NAME[T.prof]}</span><span>가구 소득</span><span>월 ${Math.round(hd.income * T.inc)}만원</span></div>
        ${likes ? `<p class="hint" style="margin:4px 0 0">잘 찾는 업종: ${likes}</p>` : ''}${dislikes ? `<p class="hint" style="margin:2px 0 0">잘 안 찾는 업종: ${dislikes}</p>` : ''}
        <p class="hint">역·공원이 가깝거나 동네가 뜨면 건물이 높아지고 사람이 늘어요.</p>`;
    } else if (t.b.k === 'rpark') h = t.b.beach ? head('🏖️', '모래사장', H.name) + '<p class="hint">파라솔과 선베드가 놓인 해변이에요. 여름과 주말에 관광객이 몰려요.</p>' : head('🌿', '강변 공원', H.name) + '<p class="hint">강변 산책로예요. 주말과 저녁에 산책하는 사람들이 와요.</p>';
    else if (t.b.k === 'park') h = head('🌳', '공원', H.name) + '<p class="hint">산책 나온 관광객이 찾아오고, 2칸 안 매장의 매력이 10% 올라가요.</p>';
    else if (t.b.k === 'bus') h = head('🚏', '버스정류장', H.name) + '<p class="hint">하루 140명가량의 출퇴근 인구가 오가요.</p>';
    el.innerHTML = h; el.hidden = false; paintLogos(el);
    for (const c of charts.filter(c => c.insp)) { const cv = document.getElementById(c.id); if (cv) drawChart(cv, c.cfg); }
  }
  function lotCard(t, hot) {
    const H = Sim.HOODS[t.h];
    const flow = Sim.hourlyFlow(S, t.x, t.y);
    const est = Sim.lotEstimate(S, t.x, t.y, 'cafe', 0);
    let h = head(t.tree ? '🌳' : '🟩', '빈 땅 · 상권 분석', `${H.name} · 평당 월세 ${won(t.rent)}${hot}`);
    const lf = Sim.landFactors(S, t), hd = S.hoods[t.h];
    const chips = [];
    if (lf.st > 0) chips.push(`<span class="chip blue">🚇 역세권 +${Math.round(lf.st * 100)}%</span>`);
    if (lf.lm > 0) chips.push(`<span class="chip warn">🏛️ 랜드마크 +${Math.round(lf.lm * 100)}%</span>`);
    if (lf.view >= 0.2) chips.push('<span class="chip blue">🌊 호수 조망 +20%</span>'); else if (lf.view > 0) chips.push('<span class="chip good">⛰️ 산 조망 +8%</span>');
    if (lf.park) chips.push('<span class="chip good">🌳 공원 +6%</span>');
    if (lf.age > 0.4) chips.push(`<span class="chip bad">🏚️ 노후 −${Math.round(lf.age * 35)}%</span>`);
    if (lf.hype > 1.03) chips.push(`<span class="chip bad">🔥 화제성 +${Math.round((lf.hype - 1) * 100)}%</span>`);
    h += `<p class="hint" style="margin-top:0">${esc(H.desc)}</p>
      <div class="rows"><span>가구 소득</span><span>월 ${hd.income.toFixed(0)}만원</span><span>삶의 질</span><span>${hd.qol} / 100</span><span>출퇴근 혼잡도</span><span>${Math.round(Sim.congestion(S, t.h, 18) * 100)}${Sim.congestion(S, t.h, 18) > 0.8 ? ' <span class="down">배달 지연 주의</span>' : ''}</span><span>주차 여유</span><span>${(() => { const v = Sim.parkingScore(S, { x: t.x, y: t.y, size: 1 }); return v < 0.4 ? '부족' : v < 0.7 ? '보통' : '넉넉'; })()}</span></div>
      <h4>임대료가 이렇게 정해졌어요</h4><div class="chips">${chips.join('') || '<span class="chip">특별한 요인 없음</span>'}</div>
      <h4>주변 유동인구 구성</h4>${segBars(est.flow)}
      <h4>시간대별 유동인구</h4>${chart({ bars: { data: flow, color: '#bcd8ee' }, labels: flow.map((_, i) => i % 6 === 0 ? i + '시' : ''), noMax: true }, 'xs', true)}
      <h4>업종별 예상 (월 매출 순)</h4><table class="t"><thead><tr><th>업종</th><th class="r">손님/일</th><th class="r">월 매출</th><th class="r">경쟁</th><th></th></tr></thead><tbody>`;
    const rows = Sim.CAT_KEYS.map(k => { const e = Sim.lotEstimate(S, t.x, t.y, k, 0); return { k, e, rev: e.cust * Sim.CATS[k].ticket / 1.1 * 30 }; }).sort((a, b) => b.rev - a.rev);
    for (const { k, e, rev } of (lotAll ? rows : rows.slice(0, 6))) {
      h += `<tr><td>${Sim.CATS[k].icon} ${Sim.CATS[k].name}</td><td class="r">${Math.round(e.cust)}명</td><td class="r">${short(rev)}</td><td class="r">${e.rivals}곳</td><td class="r"><button class="btn sm" data-act="planopen" data-arg="${k}">계약 검토</button></td></tr>`;
    }
    h += `</tbody></table><button class="btn sm" data-act="lotall" style="margin-top:6px">${lotAll ? '접기' : `${rows.length}개 업종 모두 보기`}</button>`;
    return h + '<p class="hint">평일 기준, 25평 스탠다드 인테리어로 열었을 때의 추정치예요. 주말·날씨·이벤트에 따라 달라져요.</p>';
  }
  function openFormCard(t) {
    const f = openForm, C = Sim.CATS[f.cat];
    const cost = Sim.openCost(S, f.cat, f.x, f.y, f.size, f.style, f.tier);
    const est = Sim.lotEstimate(S, f.x, f.y, f.cat, 0, { size: f.size, style: f.style, tier: f.tier, menu: f.menu });
    const mi = Sim.menuInfo(S, { cat: f.cat, size: f.size, menu: f.menu, sig: f.sig });
    const p = S.companies[0];
    let h = head(C.icon, `${C.name} 개설 계약`, `${Sim.HOODS[t.h].name} · 영업 ${C.hours[0]}~${C.hours[1]}시`);
    h += `<h4>매장 크기</h4><div class="seg">${[1, 2, 3].map(s => `<button class="${f.size === s ? 'on' : ''}" data-act="of" data-arg="size:${s}">${Sim.SIZES[s].name} <small>${Sim.SIZES[s].fp.join('×')}칸</small></button>`).join('')}</div>
      <h4>인테리어 스타일</h4><div class="chips">${Sim.STYLE_KEYS.map(k => `<button class="pick ${f.style === k ? 'on' : ''}" data-act="of" data-arg="style:${k}" title="${esc(Sim.STYLES[k].desc)}"><span class="sw" style="background:${Sim.STYLES[k].floor};border-color:${Sim.STYLES[k].accent}"></span>${Sim.STYLES[k].name}</button>`).join('')}</div>
      <p class="hint" style="margin:4px 0 0">${esc(Sim.STYLES[f.style].desc)}</p>
      <h4>인테리어 등급</h4><div class="seg">${[1, 2, 3, 4].map(k => `<button class="${f.tier === k ? 'on' : ''}" data-act="of" data-arg="tier:${k}">${Sim.TIERS[k].name}</button>`).join('')}</div>
      <h4>메뉴 <span class="chip">${f.menu.length} / ${Sim.SIZES[f.size].menu}개</span><span class="chip">객단가 약 ${won(mi.ticket)}</span><span class="chip">원가율 ${pct(mi.cost)}</span></h4>
      <div class="chips">${C.menu.map(m => `<button class="pick sm ${f.menu.includes(m.id) ? 'on' : ''}" data-act="ofmenu" data-arg="${m.id}" title="${won(m.price)} · 원가율 ${pct(m.cost)}">${f.sig === m.id ? '⭐ ' : ''}${esc(m.name)} <small>${short(m.price)}</small>${m.season ? ' <span class="sea">제철</span>' : ''}</button>`).join('')}</div>
      <p class="hint" style="margin:4px 0 0">누르면 넣고 빼요. 매장 안 메뉴 탭에서 대표 메뉴를 정하고 언제든 바꿀 수 있어요.</p>
      <div class="rows" style="margin-top:10px">
        <span>보증금 (돌려받음)</span><span>${won(cost.deposit)}</span>
        <span>인테리어 (평당 ${short(Sim.TIERS[f.tier].perPy * Sim.STYLES[f.style].cost)})</span><span>${won(cost.interior)}</span>
        <span>설비·주방기기</span><span>${won(cost.equip)}</span>
        <span>간판·집기·기타</span><span>${won(cost.misc)}</span>
        <span><b>합계</b></span><span><b>${won(cost.total)}</b></span>
        <span>월세 (2년 계약)</span><span>${won(cost.rent)}</span>
        <span>예상 손님 (평일)</span><span>${Math.round(est.cust)}명/일</span>
      </div>
      ${!Sim.findFit(S, f.x, f.y, Sim.SIZES[f.size].fp[0], Sim.SIZES[f.size].fp[1]) ? `<p class="hint down">${Sim.SIZES[f.size].name}은 ${Sim.SIZES[f.size].fp.join('×')}칸이 필요한데 붙어 있는 빈 땅이 부족해요. 더 작은 크기를 골라 주세요.</p>` : ''}
      <div class="btn-row"><button class="btn primary" data-act="confirmopen" ${p.cash < cost.total || !Sim.findFit(S, f.x, f.y, Sim.SIZES[f.size].fp[0], Sim.SIZES[f.size].fp[1]) ? 'disabled' : ''}>계약하고 열기</button><button class="btn" data-act="cancelopen">취소</button></div>
      ${p.cash < cost.total ? `<p class="hint down">현금이 ${won(cost.total - p.cash)} 부족해요. 회사 탭에서 대출을 받을 수 있어요.</p>` : '<p class="hint">기본 직원은 손님 예상에 맞춰 자동으로 뽑아요. 매장에 들어가 바꿀 수 있어요.</p>'}`;
    return h;
  }
  function storeSummary(st) {
    if (!st) return '';
    const comp = S.companies[st.owner], C = Sim.CATS[st.cat];
    const hf = Math.floor(hourF()) % 24, open = hf >= st.open && hf < st.close;
    const sub = `${logo(comp, 14)} ${esc(comp.name)} · ${Sim.SIZES[st.size].name} · ${stars(st.rating)}`;
    let h = head(C.icon, storeName(st) + (st.franchise ? ' 가맹점' : st.owner === 0 ? ' 직영점' : ''), sub);
    h += `<div class="rows"><span>지금</span><span>${open ? `<span class="chip good">영업 중</span> 최근 1시간 손님 ${st.hourly[(hf + 23) % 24] || 0}명` : `<span class="chip">영업 전·후</span> ${st.open}~${st.close}시`}</span>
      <span>어제 손님</span><span>${st.served}명${st.lost > 3 ? ` <span class="chip warn">놓침 ${Math.round(st.lost)}</span>` : ''}</span>
      <span>인테리어</span><span>${Sim.STYLES[st.interior.style].name} · ${Sim.TIERS[st.interior.tier].name}</span>
      <span>직원</span><span>${st.staff.length}명</span>
      ${st.owner === 0 && !st.franchise ? `<span>30일 손익(추정)</span><span class="${st.profitAvg >= 0 ? 'up' : 'down'}">${won(st.profitAvg * 30)}</span>` : `<span>가격</span><span>${won(Sim.ticket(st))}</span>`}</div>`;
    if (st.owner === 0 && !st.franchise) h += `<div class="btn-row"><button class="btn primary big" data-act="enter" data-arg="${st.id}">🚪 매장 들어가기</button></div>`;
    else if (st.owner === 0) h += `<p class="hint">가맹점주가 운영해요. 로열티 ${pct(comp.fr[st.cat].royalty)}와 물류 마진이 본사 수입이에요.</p><div class="btn-row"><button class="btn" data-act="enter" data-arg="${st.id}">🚪 구경하기</button></div>`;
    else h += `<p class="hint">경쟁사 매장이에요. 근처에 더 좋은 직원, 인테리어, 가격으로 맞서 보세요.</p><div class="btn-row"><button class="btn" data-act="enter" data-arg="${st.id}">🚪 손님인 척 들어가 보기</button></div>`;
    return h;
  }
  function facCard(f) {
    if (!f) return '';
    const F = Sim.FAC[f.kind], comp = S.companies[f.owner];
    const served = S.stores.filter(s => s.facId === f.id).length;
    const armedDel = armed === 'facdel:' + f.id;
    let h = head(F.icon, `${F.name}${F.range ? ' ' + f.level + '단계' : ''}`, `${logo(comp, 14)} ${esc(comp.name)} · ${hoodOfXY(f.x, f.y).name}`);
    let extra = '';
    if (f.kind === 'rental') { const ri = Sim.rentalIncome(S, f); extra = `<span>입주율</span><span>${Math.round(ri.occ * 100)}%</span><span>월 임대 수입</span><span class="up">${won(ri.month)}</span><span>건물 가치</span><span>${won(Sim.facValue(S, f))}</span><span>층</span><span>${4 + f.level * 2}층</span>`; }
    else if (f.kind === 'factory') extra = `<span>이번 달 영업이익(누적)</span><span class="up">${won(f.mrev || 0)}</span><span>생산 라인</span><span>${f.level}개</span>`;
    else if (f.kind === 'hq') extra = `<span>본사 직원</span><span>${comp.hq ? comp.hq.staff.length : 0}명</span>`;
    h += `<div class="rows">${F.range ? `<span>담당 매장</span><span>${served} / ${Sim.facCap(f)}곳</span><span>배송 반경</span><span>${F.range}칸</span>` : ''}${extra}${F.upkeep ? `<span>운영비</span><span>월 ${won(F.upkeep * (1 + 0.5 * (f.level - 1)))}</span>` : ''}</div><p class="hint">${F.desc}</p>`;
    const upCost = f.kind === 'rental' ? 300 * 6e6 * 0.8 : F.cost * 0.5 * f.level;
    if (f.owner === 0 && f.kind === 'hq') h += `<div class="btn-row"><button class="btn primary" data-act="tab" data-arg="hq">본사 관리 열기</button></div>`;
    if (f.owner === 0) h += `<div class="btn-row">${(F.range || f.kind === 'factory' || f.kind === 'rental') && f.level < 3 ? `<button class="btn primary" data-act="facup" ${comp.cash < upCost ? 'disabled' : ''}>${f.kind === 'rental' ? '증축' : '확장'} <small>${short(upCost)}</small></button>` : ''}<button class="btn danger ${armedDel ? 'armed' : ''}" data-act="facdel">${armedDel ? '정말 철거하기' : '철거'}</button></div>`;
    return h;
  }

  // ---------- 매장 안 (모달) ----------
  const SV_TABS = [['ops', '운영'], ['menu', '메뉴'], ['staff', '직원'], ['interior', '인테리어'], ['deco', '가구 배치'], ['building', '건물'], ['report', '기록']];
  function viewStore() { return storeView ? S.stores.find(s => s.id === storeView.id) : null; }
  function openStoreView(id) { Snd.play('door'); storeView = { id, tab: 'ops' }; $('storeModal').hidden = false; renderStoreView(); }
  function closeStoreView() { storeView = null; $('storeModal').hidden = true; hoverStaff = null; }
  function renderStoreView() {
    const st = viewStore(); if (!st) { closeStoreView(); return; }
    const comp = S.companies[st.owner], mine = st.owner === 0 && !st.franchise;
    $('svTitle').innerHTML = `${logo(comp, 22)} <span>${Sim.CATS[st.cat].icon} ${esc(storeName(st))}</span> <span class="chip">${Sim.SIZES[st.size].name}</span> <span class="chip">${stars(st.rating)}</span>`;
    const tabs = mine ? SV_TABS : [['ops', '둘러보기'], ['staff', '직원']];
    if (!tabs.some(t => t[0] === storeView.tab)) storeView.tab = tabs[0][0];
    $('svTabs').innerHTML = tabs.map(([k, n]) => `<button class="${storeView.tab === k ? 'on' : ''}" data-svtab="${k}">${n}</button>`).join('');
    charts = charts.filter(c => !c.sv);
    const body = $('svBody'), top = body.scrollTop;
    body.innerHTML = { ops: svOps, menu: svMenu, staff: svStaff, interior: svInterior, deco: svDeco, building: svBuilding, report: svReport }[storeView.tab](st, mine);
    body.scrollTop = top;
    paintLogos($('storeModal'));
    for (const c of charts.filter(c => c.sv)) { const cv = document.getElementById(c.id); if (cv) drawChart(cv, c.cfg); }
  }
  function hourChart(st) {
    const hours = []; for (let h = 6; h < 24; h++) hours.push(h);
    return chart({ bars: { data: hours.map(h => st.hourly[h]), color: '#9ccf8f', stack: hours.map(h => st.hourLost[h]), stackColor: '#f2b3bd' }, series: [{ data: hours.map(h => st.hourCap[h] || 0), color: '#7fb2d9', dashed: true }], labels: hours.map(h => h % 3 === 0 ? h + '시' : '') }, '', false, true);
  }
  function svOps(st, mine) {
    const comp = S.companies[st.owner], C = Sim.CATS[st.cat];
    const hf = Math.floor(hourF()) % 24;
    const today = st.hourly.reduce((a, b) => a + b, 0), lostT = st.hourLost.reduce((a, b) => a + b, 0);
    let h = `<div class="cards c4">
      <div class="stat"><span class="lbl">오늘 손님</span><b>${today}명</b><span class="d">최근 1시간 ${st.hourly[(hf + 23) % 24] || 0}명</span></div>
      <div class="stat"><span class="lbl">놓친 손님</span><b class="${lostT > today * 0.1 ? 'down' : ''}">${Math.round(lostT)}명</b><span class="d">자리·직원 부족</span></div>
      <div class="stat"><span class="lbl">오늘 매출</span><b>${won(st.dayRev)}</b><span class="d">부가세 제외</span></div>
      <div class="stat"><span class="lbl">어제 손익</span><b class="${st.profit >= 0 ? 'up' : 'down'}">${won(st.profit)}</b></div></div>
      <h4>오늘 시간대별 손님 <span class="legend inline"><span><span class="dot" style="background:#9ccf8f"></span>받은 손님</span><span><span class="dot" style="background:#f2b3bd"></span>놓친 손님</span><span><span class="dot" style="background:#7fb2d9"></span>처리 가능</span></span></h4>${hourChart(st)}`;
    if (!mine) return h + `<div class="rows"><span>가격</span><span>${won(Sim.ticket(st))}</span><span>영업시간</span><span>${st.open}~${st.close}시</span><span>인테리어</span><span>${Sim.STYLES[st.interior.style].name} ${Sim.TIERS[st.interior.tier].name}</span><span>인지도</span><span>${comp.brand[st.cat].toFixed(0)}</span></div>`;
    const armedClose = armed === 'close:' + st.id;
    h += `<div class="ctl"><span class="lbl">객단가</span><button class="step" data-act="price" data-arg="-5">−</button><span class="val">${won(Sim.ticket(st))}</span><button class="step" data-act="price" data-arg="5">+</button><span class="chip">메뉴 ${st.menu.length}개 · 업종 평균 ${won(C.ticket)}</span></div>
      <div class="ctl"><span class="lbl">영업시간</span><button class="step" data-act="hours" data-arg="open:-1">−</button><span class="val sm">${st.open}시 오픈</span><button class="step" data-act="hours" data-arg="open:1">+</button>
        <button class="step" data-act="hours" data-arg="close:-1">−</button><span class="val sm">${st.close}시 마감</span><button class="step" data-act="hours" data-arg="close:1">+</button></div>
      <div class="ctl"><span class="lbl">홍보</span><div class="seg">${Sim.MKT_NAME.map((n, i) => `<button class="${st.mkt === i ? 'on' : ''}" data-act="mkt" data-arg="${i}" title="하루 ${won(Sim.MKT[i])}">${n}</button>`).join('')}</div></div>
      ${C.dlv > 0 ? `<div class="ctl"><span class="lbl">배달앱</span><div class="seg" style="max-width:170px"><button class="${st.delivery ? 'on' : ''}" data-act="dlv" data-arg="1">입점</button><button class="${!st.delivery ? 'on' : ''}" data-act="dlv" data-arg="0">안 함</button></div><span class="chip">업종 배달 비중 ${Math.round(C.dlv * 100)}%</span></div>
      <p class="hint" style="margin-top:0">배달 주문은 좌석 없이 주방만 쓰지만 주문마다 수수료 9.8%와 배달비 3,000원이 들어요. 어제 배달 ${st.dayDlv || 0}건 · 수수료 ${won(st.dayDlvFee || 0)}${st.dlvMin != null ? ` · 평균 도착 ${Math.round(st.dlvMin)}분${st.dlvLate > 0.05 ? ` <span class="down">(지연 ${Math.round(st.dlvLate * 100)}%: 환불·평점 하락)</span>` : ''}` : ''}</p>` : ''}
      ${st.inv ? (() => { const days = Math.min(...Object.keys(st.inv).map(g => st.invUse[g] > 0 ? st.inv[g] / st.invUse[g] : 9)); return `<div class="row"><span class="lbl">재고</span><div class="seg">${[1, 2, 3, 4, 5].map(d => `<button class="${st.invDays === d ? 'on' : ''}" data-act="invdays" data-arg="${d}">${d}일치</button>`).join('')}</div></div>
      <p class="hint" style="margin-top:0">남은 재고 약 ${days.toFixed(1)}일치 (${won(st.invValue || 0)}) · 어제 품절로 놓친 손님 ${st.dayStockLost || 0}명 · 상한 재료 ${won(st.dayWaste || 0)}. 재고를 많이 두면 품절은 줄지만 우유·고기·채소가 더 상해요.</p>${st.lossWhy && st.lossWhy.length ? `<p class="hint" style="margin-top:0">어제 손해 원인: ${st.lossWhy.map(([k, v]) => `<b>${k} ${k.includes('원') ? won(v) : v + '명'}</b>`).join(' · ')}</p>` : ''}`; })() : ''}
      <h4>${C.icon} ${C.name}의 특징</h4><ul class="traits">${(C.traits || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <h4>매장 이벤트</h4><div class="evgrid">${Object.entries(Sim.STORE_EVENTS).map(([k, E]) => { const on = st.ev.find(e => e.kind === k && e.until > S.hour); return `<button class="evbtn ${on ? 'on' : ''}" data-act="sevent" data-arg="${k}" ${on ? 'disabled' : ''}><b>${E.name}</b><span>${E.desc}</span><small>${on ? `진행 중 · ${Math.ceil((on.until - S.hour) / 24)}일 남음` : E.cost ? won(E.cost) : '무료'}</small></button>`; }).join('')}</div>
      <div class="rows">
        <span>월세${st.owned ? '' : ` (${Math.max(0, 24 - Math.floor((Sim.dayOf(S) - st.leaseDay) / 30.4))}개월 뒤 갱신)`}</span><span>${st.owned ? '자가 건물' : won(st.rent)}</span>
        <span>관리비·공과금</span><span>월 ${won(Sim.utilMonth(st))}</span>
        <span>인건비 (4대보험 포함)</span><span>하루 ${won(Sim.laborDay(S, st))}</span>
        <span>1인분 원가</span><span>${won(Sim.unitCost(S, comp, st))} (${pct(Sim.unitCost(S, comp, st) / (Sim.ticket(st) / 1.1))})</span>
        <span>주차 여유</span><span>${(st._park || 0) < 0.4 ? '<span class="down">부족</span> (가족·부유층 손님 감소)' : (st._park || 0) < 0.7 ? '보통' : '<span class="up">넉넉</span>'}</span>
        <span>식자재 공급</span><span>${st.supply === 'kitchen' ? '중앙주방 배송' : st.supply === 'warehouse' ? '물류센터 배송' : '도매상 직송 (+8%)'}</span>
      </div>
      <div class="btn-row">${st.size < 3 ? `<button class="btn" data-act="upgrade">옆 칸까지 확장 → ${Sim.SIZES[st.size + 1].name} <small>${short(Sim.upgradeCost(S, st))}</small></button>` : ''}
        <button class="btn danger ${armedClose ? 'armed' : ''}" data-act="close">${armedClose ? '정말 정리하기' : '매장 정리'} <small>보증금+권리금 ${short((st.owned ? st.propValue * 0.97 : st.deposit) + Sim.keyMoney(S, st))}</small></button></div>`;
    return h;
  }
  function svMenu(st) {
    const C = Sim.CATS[st.cat], comp = S.companies[0];
    if (!storeView.menuSel) storeView.menuSel = { ids: st.menu.slice(), sig: st.sig };
    const sel = storeView.menuSel, max = Sim.SIZES[st.size].menu;
    const now = Sim.menuInfo(S, st), next = Sim.menuInfo(S, { cat: st.cat, size: st.size, menu: sel.ids, sig: sel.sig });
    const changed = sel.ids.join() !== st.menu.join() || sel.sig !== st.sig;
    const added = sel.ids.filter(x => !st.menu.includes(x)).length;
    const mi = S.day.mi;
    const dots = v => '●'.repeat(Math.max(1, Math.min(3, Math.round((v - 0.7) * 5)))) + '○'.repeat(Math.max(0, 3 - Math.max(1, Math.min(3, Math.round((v - 0.7) * 5)))));
    const cmp = (a, b, fmt, goodUp) => `${fmt(b)}${changed && Math.abs(b - a) > 1e-6 ? ` <span class="${(b > a) === goodUp ? 'up' : 'down'}">${b > a ? '▲' : '▼'}</span>` : ''}`;
    let h = `<div class="cards c4">
      <div class="stat"><span class="lbl">객단가</span><b>${cmp(now.ticket, next.ticket, v => won(Math.round(v * st.price / 1e4) * 100), true)}</b><span class="d">손님 1명이 쓰는 돈</span></div>
      <div class="stat"><span class="lbl">원가율</span><b>${cmp(now.cost, next.cost, pct, false)}</b><span class="d">식자재 비중</span></div>
      <div class="stat"><span class="lbl">주방 속도</span><b>${cmp(now.complexity, next.complexity, v => Math.round(v * 100) + '%', true)}</b><span class="d">메뉴가 많고 복잡하면 느려요</span></div>
      <div class="stat"><span class="lbl">메뉴 수</span><b>${sel.ids.length} / ${max}</b><span class="d">${Sim.SIZES[st.size].name}</span></div></div>
      <h4>손님층별 메뉴 매력</h4><div class="legend">${Sim.SEG_KEYS.map(k => `<span>${Sim.SEG[k].name} ${cmp(now.appeal[k], next.appeal[k], v => v.toFixed(2), true)}</span>`).join('')}</div>
      <p class="hint">손님층마다 좋아하는 메뉴가 달라요. 제철 메뉴는 그 계절에 더 잘 팔리고 철이 지나면 덜 팔려요. ⭐ 대표 메뉴는 두 배로 팔리고 매력이 조금 올라가요. 신메뉴는 하나에 레시피 개발비 50만원이 들어요.</p>
      <div class="menu-list">`;
    for (const m of C.menu) {
      const on = sel.ids.includes(m.id), sea = Sim.inSeason(m, mi);
      h += `<div class="mi ${on ? 'on' : ''}">
        <button class="mi-main" data-act="mtoggle" data-arg="${m.id}"><span class="ck">${on ? '✓' : ''}</span><b>${esc(m.name)}</b><span class="price">${won(m.price)}</span></button>
        <div class="mi-meta"><span>원가율 ${pct(m.cost)}</span>${m.diff ? '<span class="chip warn">손이 많이 감</span>' : ''}${m.season ? `<span class="chip ${sea ? 'good' : 'bad'}">${sea ? '지금 제철' : '철 지난 메뉴'}</span>` : ''}
          <span class="segs">${Sim.SEG_KEYS.map(k => `<span title="${Sim.SEG[k].name}">${Sim.SEG[k].name.slice(0, 2)} ${dots(m.appeal[k])}</span>`).join('')}</span>
          ${on ? `<button class="sigbtn ${sel.sig === m.id ? 'on' : ''}" data-act="msig" data-arg="${m.id}">${sel.sig === m.id ? '⭐ 대표 메뉴' : '☆ 대표로'}</button>` : ''}</div></div>`;
    }
    h += `</div><div class="btn-row sticky"><button class="btn primary" data-act="mapply" ${!changed || comp.cash < added * 5e5 ? 'disabled' : ''}>메뉴판 바꾸기${added ? ` <small>신메뉴 ${added}개 · ${short(added * 5e5)}</small>` : ''}</button>${changed ? '<button class="btn" data-act="mreset">되돌리기</button>' : ''}</div>`;
    return h;
  }
  function svStaff(st, mine) {
    const ts = Sim.teamStats(st), ch = Sim.chemistry(st);
    const hours = []; for (let h = st.open; h < st.close; h++) hours.push(h);
    let h = `<div class="cards c4">
      <div class="stat"><span class="lbl">기술 (주방)</span><b>${Math.round(ts.skill)}</b><span class="d">음식 품질</span></div>
      <div class="stat"><span class="lbl">청결</span><b class="${ts.clean < 45 ? 'down' : ''}">${Math.round(ts.clean)}</b><span class="d">평점·위생점검</span></div>
      <div class="stat"><span class="lbl">스타성 (홀)</span><b>${Math.round(ts.star)}</b><span class="d">손님 유입·SNS</span></div>
      <div class="stat"><span class="lbl">팀 케미</span><b class="${ch.avg < -0.1 ? 'down' : ch.avg > 0.15 ? 'up' : ''}">${ch.avg >= 0 ? '+' : ''}${Math.round(ch.avg * 100)}</b><span class="d">처리 속도 ${ch.mult >= 1 ? '+' : ''}${((ch.mult - 1) * 100).toFixed(0)}%</span></div></div>
      <h4>시간대별 근무 인원</h4><div class="duty">${hours.map(hh => { const on = st.staff.filter(s => Sim.onDuty(st, s, hh)); return `<div title="${hh}시: ${on.map(s => s.name).join(', ') || '없음'}"><i style="height:${Math.min(100, on.length * 20)}%"></i><span>${hh % 3 === 0 ? hh : ''}</span></div>`; }).join('')}</div>
      <p class="hint">속도는 시간당 처리 손님 수, 기술은 음식 품질과 원가 낭비, 청결은 평점과 위생 점검, 스타성은 새 손님 유입과 SNS 화제에 영향을 줘요. MBTI 궁합이 좋을수록 팀 처리 속도와 사기가 올라가요.</p>`;
    h += '<div class="staff-list">';
    for (const s of st.staff) {
      const mates = ch.pairs.filter(p => p.a === s.id || p.b === s.id).map(p => ({ o: st.staff.find(x => x.id === (p.a === s.id ? p.b : p.a)), c: p.c })).sort((a, b) => b.c - a.c);
      const best = mates[0], worst = mates[mates.length - 1];
      const [a, b] = Sim.shiftWindow(st, s.shift);
      const armedFire = armed === 'fire:' + s.id;
      const ask = Sim.askWage(S, s);
      h += `<div class="staff ${hoverStaff === s.id ? 'hi' : ''}" data-staff="${s.id}">
        <div class="staff-h"><b>${esc(s.name)}</b><span class="chip blue">${s.mbti}</span><span class="chip">${Sim.ROLES[s.role]}</span><span class="morale ${s.morale < 40 ? 'down' : s.morale > 75 ? 'up' : ''}">${s.morale < 40 ? '😣' : s.morale > 75 ? '😊' : '🙂'} 사기 ${Math.round(s.morale)}</span></div>
        ${statBar('기술', s.skill)}${statBar('속도', s.speed)}${statBar('청결', s.clean)}${statBar('스타성', s.star, 'star')}
        <div class="staff-m"><span>시급 ${won(s.wage)}${s.wage < ask ? ` <span class="down">(희망 ${won(ask)})</span>` : ''}</span><span>${a}~${b}시</span><span>피로 ${Math.round(s.fatigue)}</span><span>근속 ${s.days}일</span></div>
        ${best ? `<div class="staff-m"><span>${best.c > 0.2 ? '💛' : '🤝'} ${esc(best.o.name)}(${best.o.mbti})와 ${best.c > 0.2 ? '잘 맞아요' : '무난해요'}</span>${worst && worst !== best && worst.c < -0.1 ? `<span>⚡ ${esc(worst.o.name)}(${worst.o.mbti})와 자주 부딪혀요</span>` : ''}</div>` : ''}
        ${mine ? `<div class="staff-a"><div class="seg sm">${Object.keys(Sim.SHIFTS).map(k => `<button class="${s.shift === k ? 'on' : ''}" data-act="sshift" data-arg="${s.id}:${k}" title="${Sim.SHIFTS[k]}">${Sim.SHIFTS[k].split(' ')[0]}</button>`).join('')}</div>
          <div class="seg sm">${Object.keys(Sim.ROLES).map(k => `<button class="${s.role === k ? 'on' : ''}" data-act="srole" data-arg="${s.id}:${k}">${Sim.ROLES[k]}</button>`).join('')}</div>
          <button class="btn sm" data-act="strain" data-arg="${s.id}">교육 <small>60만</small></button><button class="btn sm" data-act="sraise" data-arg="${s.id}">시급 +5%</button><button class="btn sm danger ${armedFire ? 'armed' : ''}" data-act="sfire" data-arg="${s.id}">${armedFire ? '정말 내보내기' : '계약 종료'}</button></div>` : ''}
      </div>`;
    }
    h += '</div>';
    if (!mine) return h;
    h += `<h3>구직자 <span class="chip">매주 월요일 새로 와요</span></h3>
      <div class="ctl"><span class="lbl" style="width:auto">자동 인력 관리</span><div class="seg" style="max-width:160px"><button class="${S.autoHire ? 'on' : ''}" data-act="autohire" data-arg="1">켜기</button><button class="${!S.autoHire ? 'on' : ''}" data-act="autohire" data-arg="0">끄기</button></div></div>
      <p class="hint" style="margin-top:0">켜 두면 그만둔 자리를 채우고, 손님이 몰리면 알바를 더 뽑고, 한가하면 계약을 끝내요. 직접 뽑은 직원은 건드리지 않아요.</p><div class="staff-list">`;
    for (const c of S.cands) {
      h += `<div class="staff cand"><div class="staff-h"><b>${esc(c.name)}</b><span class="chip blue">${c.mbti}</span><span class="chip">${Sim.ROLES[c.role]} 지원</span><span class="morale">희망 시급 ${won(c.wage)}</span></div>
        ${statBar('기술', c.skill)}${statBar('속도', c.speed)}${statBar('청결', c.clean)}${statBar('스타성', c.star, 'star')}
        <div class="staff-m">${st.staff.length ? (() => { const avg = st.staff.reduce((a, s) => a + Sim.compat(c.mbti, s.mbti), 0) / st.staff.length; return `<span>${avg > 0.2 ? '💛 지금 팀과 잘 맞을 것 같아요' : avg < -0.1 ? '⚡ 지금 팀과 성향이 달라요' : '🤝 팀과 무난해요'}</span>`; })() : ''}</div>
        <div class="staff-a"><button class="btn sm primary" data-act="hire" data-arg="${c.id}">채용하기</button></div></div>`;
    }
    return h + '</div>';
  }
  function svInterior(st) {
    const i = st.interior, comp = S.companies[0];
    const sv = Sim.spaceScore(st);
    const sel = storeView.pick || { style: i.style, tier: i.tier };
    storeView.pick = sel;
    const same = sel.style === i.style && sel.tier === i.tier;
    const cost = same ? Math.round(i.cost * 0.3 / 1e5) * 1e5 : Sim.interiorCost(st.size, sel.style, sel.tier);
    const appeal = k => Sim.STYLES[sel.style].appeal[k];
    let h = `<div class="cards c3">
      <div class="stat"><span class="lbl">공간 가치</span><b>${sv} / 100</b><div class="bar"><i style="width:${sv}%"></i></div></div>
      <div class="stat"><span class="lbl">상태</span><b class="${i.cond < 60 ? 'down' : ''}">${Math.round(i.cond)}%</b><span class="d">청결이 낮으면 빨리 낡아요</span></div>
      <div class="stat"><span class="lbl">권리금 (추정)</span><b>${won(Sim.keyMoney(S, st))}</b><span class="d">매장을 넘길 때 받는 돈</span></div></div>
      <p class="hint">비싼 인테리어일수록 손님이 더 오래 머물고 싶어 하고, 가격에 덜 민감해지고, 권리금이 올라가요. 스타일마다 좋아하는 손님층이 달라요.</p>
      <h4>스타일</h4><div class="style-grid">${Sim.STYLE_KEYS.map(k => { const S2 = Sim.STYLES[k]; return `<button class="style-card ${sel.style === k ? 'on' : ''}" data-act="ipick" data-arg="style:${k}">
        <span class="sw2"><i style="background:${S2.wall}"></i><i style="background:${S2.floor}"></i><i style="background:${S2.accent}"></i></span><b>${S2.name}${i.style === k ? ' ✓' : ''}</b><small>${esc(S2.desc)}</small></button>`; }).join('')}</div>
      <h4>등급</h4><div class="seg">${[1, 2, 3, 4].map(k => `<button class="${sel.tier === k ? 'on' : ''}" data-act="ipick" data-arg="tier:${k}">${Sim.TIERS[k].name} <small>평당 ${short(Sim.TIERS[k].perPy * Sim.STYLES[sel.style].cost)}</small></button>`).join('')}</div>
      <h4>손님층별 선호도</h4><div class="legend">${Sim.SEG_KEYS.map(k => `<span>${Sim.SEG[k].name} ${'●'.repeat(Math.round(appeal(k) * 2))}${'○'.repeat(Math.max(0, 3 - Math.round(appeal(k) * 2)))}</span>`).join('')}</div>
      <div class="btn-row"><button class="btn primary" data-act="interior" ${comp.cash < cost ? 'disabled' : ''}>${same ? '리뉴얼 (상태 100%로)' : '새로 시공하기'} <small>${won(cost)}</small></button>${!same ? '<button class="btn" data-act="ipick" data-arg="reset">지금 그대로</button>' : ''}</div>`;
    return h;
  }
  // 마우스 위치를 가구 중심으로 두고 0.5칸(또는 0.25칸) 격자에 맞춤
  function furnPos(tl, c) { const F = Sim.FURN[tl.k], odd = (tl.r || 0) % 2, w = odd ? F.d : F.w, d = odd ? F.w : F.d, st2 = storeView.snap || 0.5; return { x: Math.round((c.fx - w / 2) / st2) * st2, y: Math.round((c.fy - d / 2) / st2) * st2 }; }
  const FGRP = [['base', '계산·진열'], ['kitchen', '주방 장비'], ['seat', '좌석'], ['deco', '꾸미기']];
  function svDeco(st) {
    Sim.ensureFurn(st);
    const fx = Sim.furnFx(st), comp = S.companies[0], tool = storeView.ftool || null;
    const pct = v => (v >= 0 ? '+' : '') + Math.round(v * 100) + '%';
    const segApp = Sim.SEG_KEYS.map(k => `${Sim.SEG[k].name} ${pct(Sim.furnAppeal(st, k) - 1)}`).join(' · ');
    let h = `<div class="cards c3">
      <div class="stat"><span class="lbl">좌석</span><b>${fx.sum.seats}석</b><span class="d">수용 ${pct(fx.seatF - 1)}</span></div>
      <div class="stat"><span class="lbl">주방 속도</span><b class="${fx.kitF < 0.95 ? 'down' : ''}">${pct(fx.kitF - 1)}</b><span class="d">화구·머신·오븐 등급</span></div>
      <div class="stat"><span class="lbl">꾸밈 점수</span><b>${Math.round(fx.sum.deco)}</b><span class="d">홀 ${Math.round(fx.crowd * 100)}% 사용${fx.crowd > 0.62 ? ' · 답답해요' : ''}${fx.flow.blockedSeats ? ` · <b class="down">길이 막힌 좌석 ${fx.flow.blockedSeats}석</b>` : ''}${!fx.flow.counterOk ? ' · <b class="down">계산대에 갈 수 없어요</b>' : ''}</span></div></div>
      <p class="hint">왼쪽 그림에서 원하는 자리를 눌러 가구를 놓아요(0.5칸·0.25칸 격자, 4방향 회전). 입구에서 걸어갈 수 없는 좌석은 손님을 받지 못해요. 왼쪽 두 줄은 <b>주방</b>, 나머지는 <b>홀</b>이고, 오른쪽 앞 모서리는 <b>입구</b>라 비워 둬야 해요. 좌석이 많으면 손님을 더 받지만 홀이 62%보다 꽉 차면 답답해서 손님이 덜 와요. 좋은 냉장고는 품질을, 좋은 화구는 조리 속도를 올려요.</p>
      <p class="hint" style="margin-top:0">손님층별 매력: ${segApp}</p>
      <div class="btn-row"><button class="btn ${tool && tool.k === 'erase' ? 'primary' : ''}" data-act="ftool" data-arg="erase">🧹 치우기</button><button class="btn ${tool && tool.r ? 'primary' : ''}" data-act="frot" ${!tool || tool.k === 'erase' ? 'disabled' : ''}>↻ 돌리기</button><button class="btn" data-act="fsnap">격자 ${storeView.snap === 0.25 ? '0.25칸' : '0.5칸'}</button><button class="btn" data-act="ftool" data-arg="">선택 해제</button><button class="btn" data-act="freset">기본 배치로</button></div>`;
    for (const [g, gn] of FGRP) {
      h += `<h4>${gn}</h4><div class="furn-grid">`;
      for (const k of Sim.FURN_KEYS) {
        const F = Sim.FURN[k]; if (F.grp !== g) continue;
        const eff = [F.seats ? `좌석 ${F.seats}` : '', F.kit ? `속도 +${Math.round(F.kit * 100)}%` : '', F.fresh ? `품질 +${Math.round(F.fresh * 100)}%` : '', F.deco ? `꾸밈 ${F.deco}` : ''].filter(Boolean).join(' · ');
        h += `<button class="furn-card ${tool && tool.k === k ? 'on' : ''}" data-act="ftool" data-arg="${k}" ${comp.cash < F.cost ? 'disabled' : ''} title="${esc(F.desc)}"><span class="fi">${F.icon}</span><b>${F.name}</b><small>${short(F.cost)} · ${F.w}×${F.d}칸</small><small>${eff || esc(F.desc)}</small></button>`;
      }
      h += '</div>';
    }
    return h;
  }
  function svBuilding(st) {
    const comp = S.companies[0];
    if (!st.owned) {
      const price = Sim.propertyPrice(S, st);
      return `<h3>건물 매입</h3><div class="rows"><span>매입가 (임대수익률 4.5% 기준)</span><span>${won(price)}</span><span>보증금 차감 후 필요 현금</span><span>${won(price - st.deposit)}</span><span>아끼는 월세</span><span>${won(st.rent)}</span><span>회수 기간</span><span>약 ${(price / Math.max(1, st.rent * 12)).toFixed(0)}년</span></div>
        <p class="hint">건물을 사면 월세가 없어지고 임대료 인상 걱정도 사라져요. 동네가 뜨면 건물값도 올라요. 매입한 건물은 원하는 건축 양식으로 다시 지을 수 있어요.</p>
        <div class="btn-row"><button class="btn primary" data-act="buyprop" ${comp.cash + st.deposit < price ? 'disabled' : ''}>건물 사기</button></div>`;
    }
    let h = `<div class="cards c3"><div class="stat"><span class="lbl">건물 가치</span><b>${won(st.propValue)}</b></div><div class="stat"><span class="lbl">지금 양식</span><b>${Sim.ARCH[st.arch].name}</b></div><div class="stat"><span class="lbl">층수</span><b>2층</b></div></div>
      <h4>건축 양식 바꾸기</h4><p class="hint" style="margin-top:0">리모델링 비용만큼 건물 가치가 오르고, 양식을 좋아하는 손님층이 더 찾아와요.</p><div class="style-grid">`;
    for (const k of Sim.ARCH_KEYS) {
      const A = Sim.ARCH[k], cost = Sim.archCost(st, k);
      const fans = Sim.SEG_KEYS.filter(s => A.appeal[s] >= 0.8).map(s => Sim.SEG[s].name).join('·') || '—';
      h += `<button class="style-card ${st.arch === k ? 'on' : ''}" data-act="arch" data-arg="${k}" ${st.arch === k || comp.cash < cost ? 'disabled' : ''}><span class="sw2"><i style="background:${A.wall}"></i><i style="background:${A.roof || A.wall}"></i></span><b>${A.name}${st.arch === k ? ' ✓' : ''}</b><small>${k === 'basic' ? '기본 상가 건물' : `좋아하는 손님: ${fans}`}</small><small>${cost ? won(cost) : '무료'}</small></button>`;
    }
    return h + '</div>';
  }
  function svReport(st) {
    const tot = Sim.dayDemand(st) || 1;
    const lm = st.lm;
    return `<h4>찾아오는 손님층 (오늘 예상)</h4>${segBars(st.segDem || { res: 0, off: 0, uni: 0, tour: 0 })}
      <div class="rows"><span>오늘 예상 수요</span><span>${Math.round(tot)}명</span><span>품질 지수</span><span>${Sim.quality(S, st).toFixed(2)}</span><span>평점</span><span>${stars(st.rating)}</span></div>
      <h4>이번 달 / 지난달</h4><table class="t"><thead><tr><th></th><th class="r">이번 달</th><th class="r">지난달</th></tr></thead><tbody>
      <tr><td>손님</td><td class="r">${st.m.cust.toLocaleString('ko-KR')}명</td><td class="r">${lm ? lm.cust.toLocaleString('ko-KR') + '명' : '—'}</td></tr>
      <tr><td>매출</td><td class="r">${won(st.m.rev)}</td><td class="r">${lm ? won(lm.rev) : '—'}</td></tr>
      <tr><td>영업이익</td><td class="r ${st.m.profit >= 0 ? 'up' : 'down'}">${won(st.m.profit)}</td><td class="r">${lm ? won(lm.profit) : '—'}</td></tr></tbody></table>
      <p class="hint">영업이익은 감가상각과 법인세를 빼기 전 금액이에요. 투자금 ${won(st.interior.cost + st.equip)}은 5년에 걸쳐 비용으로 잡혀요.</p>`;
  }

  // ---------- 패널 ----------
  const TABS = [['company', '회사'], ['hq', '본사'], ['stores', '매장'], ['hoods', '상권'], ['logi', '물류'], ['brand', '브랜드·가맹'], ['events', '이벤트'], ['stock', '주식'], ['news', '소식']];
  function renderTabs() {
    $('tabs').innerHTML = TABS.map(([id, nm]) => `<button role="tab" class="${tab === id ? 'on' : ''}" data-tab="${id}" aria-selected="${tab === id}">${nm}</button>`).join('') +
      '<button class="only-sm" data-act="closepanel" aria-label="패널 닫기">✕</button>';
  }
  function renderPanel() {
    charts = charts.filter(c => c.sv || c.insp);
    const fn = { hq: pHq, company: pCompany, stores: pStores, hoods: pHoods, logi: pLogi, brand: pBrand, events: pEvents, stock: pStock, news: pNews }[tab];
    const body = $('tabBody'); const top = body.scrollTop;
    body.innerHTML = fn(); body.scrollTop = top;
    paintLogos(body);
    for (const c of charts.filter(c => !c.sv && !c.insp)) { const cv = document.getElementById(c.id); if (cv) drawChart(cv, c.cfg); }
  }
  let chartN = 0;
  function chart(cfg, cls, insp, sv) { const id = 'ch' + (chartN++); charts.push({ id, cfg, insp: !!insp, sv: !!sv }); return `<canvas class="chart ${cls || ''}" id="${id}"></canvas>`; }

  function pCompany() {
    const p = S.companies[0], L = p.cur, lm = p.months[p.months.length - 1];
    const fShare = p.founderShares / p.shares;
    const own = S.stores.filter(s => s.owner === 0);
    const months = p.months.slice(-12);
    const rows = [['매출 (부가세 제외)', 'rev'], ['가맹 수입', 'royalty'], ['기타 사업 매출', 'biz'], ['식자재 원가', 'cogs', 1], ['인건비', 'wage', 1], ['임대료', 'rent', 1], ['관리비·공과금', 'util', 1], ['카드 수수료', 'card', 1], ['배달앱 수수료', 'dlv', 1], ['마케팅·이벤트', 'mkt', 1], ['시설 운영비', 'upkeep', 1], ['본사 인건비', 'hq', 1], ['기타 사업 원가', 'bizCost', 1], ['이자', 'interest', 1], ['감가상각', 'dep', 1], ['법인세', 'tax', 1]];
    return `<div class="cards">
      <div class="stat"><span class="lbl">현금</span><b class="${p.cash < 0 ? 'down' : ''}">${won(p.cash)}</b></div>
      <div class="stat"><span class="lbl">대출</span><b>${won(p.debt)}</b><span class="d">한도 ${short(Sim.loanLimit(S, p))}</span></div>
      <div class="stat"><span class="lbl">${p.listed ? '시가총액' : '기업가치(추정)'}</span><b>${won(p.listed ? Sim.marketCap(p) : p.value)}</b></div>
      <div class="stat"><span class="lbl">회장님 지분 ${pct(fShare)}</span><b>${won(fShare * (p.listed ? Sim.marketCap(p) : p.value) + S.founder.cash)}</b></div>
      <div class="stat"><span class="lbl">직영 · 가맹</span><b>${own.filter(s => !s.franchise).length} · ${own.filter(s => s.franchise).length}곳</b></div>
      <div class="stat"><span class="lbl">최저시급</span><b>${won(S.minWage)}</b>${S.nextMinWage ? `<span class="d">내년 ${won(S.nextMinWage)}</span>` : ''}</div>
      <div class="stat"><span class="lbl">기준금리 · 대출금리</span><b>${S.macro.base.toFixed(2)}% · ${Sim.loanRate(S).toFixed(2)}%</b></div>
      <div class="stat"><span class="lbl">회장님 개인 현금</span><b>${won(S.founder.cash)}</b><span class="d">배당으로 늘어요</span></div></div>
      <h3>월별 매출과 순이익</h3>
      ${months.length ? chart({ bars: { data: months.map(m => m.rev + m.royalty), color: '#bcd8ee' }, series: [{ data: months.map(m => m.ni), color: '#4f9a6e' }], zero: true, labels: months.map(m => m.month + '월') }) : '<p class="hint">첫 달 결산이 끝나면 그래프가 나타나요.</p>'}
      <h3>손익 계산서</h3>
      <table class="t"><thead><tr><th></th><th class="r">이번 달(진행)</th><th class="r">지난달</th></tr></thead><tbody>
      ${rows.filter(([n, k]) => (L[k] || 0) !== 0 || (lm && (lm[k] || 0) !== 0) || ['rev', 'cogs', 'wage', 'rent'].includes(k)).map(([n, k, neg]) => `<tr><td>${n}</td><td class="r">${neg ? won(-(L[k] || 0)) : won(L[k] || 0)}</td><td class="r">${lm ? (neg ? won(-(lm[k] || 0)) : won(lm[k] || 0)) : '—'}</td></tr>`).join('')}
      <tr><td><b>순이익</b></td><td class="r"><b class="${Sim.ledgerNI(L) >= 0 ? 'up' : 'down'}">${won(Sim.ledgerNI(L))}</b></td><td class="r"><b class="${lm && lm.ni >= 0 ? 'up' : 'down'}">${lm ? won(lm.ni) : '—'}</b></td></tr></tbody></table>
      <p class="hint">법인세는 월말에 9%(연 2억 이하)·19%로 계산해요. 매장 보증금은 자산이라 돌려받을 수 있어요.</p>
      <h3>은행</h3><div class="btn-row"><button class="btn" data-act="borrow">1억 대출 받기</button><button class="btn" data-act="repay" ${p.debt <= 0 ? 'disabled' : ''}>1억 갚기</button><span class="chip">연 ${Sim.loanRate(S).toFixed(2)}%</span></div>
      <h3>게임</h3><div class="btn-row"><button class="btn" data-act="save">지금 저장</button><button class="btn danger ${armed === 'newgame' ? 'armed' : ''}" data-act="newgame">${armed === 'newgame' ? '정말 새로 시작' : '새 게임'}</button></div>`;
  }
  function pHq() {
    const p = S.companies[0];
    if (!p.hq) return `<h3>아직 본사가 없어요</h3><p class="hint">매장이 몇 곳 생기면 본사를 세워 보세요. 본사가 있어야 가맹사업을 할 수 있고, 부서별 전문 인력이 회사 전체를 끌어올려요.</p>
      <div class="evgrid">${Sim.DEPT_KEYS.map(d => `<div class="evbtn"><b>${Sim.DEPTS[d].icon} ${Sim.DEPTS[d].name}</b><span>${esc(Sim.DEPTS[d].desc)}</span></div>`).join('')}</div>
      <div class="btn-row"><button class="btn primary" data-act="buildhq">🏢 본사 자리 고르기 <small>${short(Sim.FAC.hq.cost)}</small></button></div>`;
    const payroll = p.hq.staff.reduce((a, e) => a + e.salary, 0);
    let h = `<div class="cards"><div class="stat"><span class="lbl">본사 직원</span><b>${p.hq.staff.length}명</b></div><div class="stat"><span class="lbl">월 인건비</span><b>${won(payroll)}</b></div></div>
      <p class="hint">부서 힘은 소속 직원의 전문성과 사기로 정해져요. 같은 부서 사람끼리 MBTI가 잘 맞으면 사기가 올라요.</p>`;
    for (const d of Sim.DEPT_KEYS) {
      const D = Sim.DEPTS[d], P = Sim.deptPower(S, p, d), staff = p.hq.staff.filter(e => e.dept === d);
      h += `<div class="box"><div class="box-h"><span class="ic">${D.icon}</span><strong>${D.name}</strong><span class="chip ${P >= 2 ? 'good' : P > 0 ? 'warn' : ''}">힘 ${P.toFixed(1)} / 4</span></div>
        <div class="bar"><i style="width:${P / 4 * 100}%"></i></div><p class="hint" style="margin:6px 0">${esc(D.desc)}</p>
        ${staff.map(e => { const armedF = armed === 'hqfire:' + e.id; return `<div class="staff"><div class="staff-h"><b>${esc(e.name)}</b><span class="chip blue">${e.mbti}</span><span class="morale ${e.morale < 40 ? 'down' : e.morale > 75 ? 'up' : ''}">${e.morale < 40 ? '😣' : e.morale > 75 ? '😊' : '🙂'} 사기 ${Math.round(e.morale)}</span></div>
          ${statBar('전문성', e.exp)}<div class="staff-m"><span>월급 ${won(e.salary)}${e.salary < Sim.hqSalaryAsk(e) ? ` <span class="down">(희망 ${won(Sim.hqSalaryAsk(e))})</span>` : ''}</span><span>근속 ${e.days}일</span></div>
          <div class="staff-a"><div class="seg sm">${Sim.DEPT_KEYS.map(k => `<button class="${e.dept === k ? 'on' : ''}" data-act="hqdept" data-arg="${e.id}:${k}" title="${Sim.DEPTS[k].name}">${Sim.DEPTS[k].icon}</button>`).join('')}</div>
          <button class="btn sm" data-act="hqws" data-arg="${e.id}">워크숍 <small>300만</small></button><button class="btn sm" data-act="hqraise" data-arg="${e.id}">연봉 +5%</button><button class="btn sm danger ${armedF ? 'armed' : ''}" data-act="hqfire" data-arg="${e.id}">${armedF ? '정말 내보내기' : '계약 종료'}</button></div></div>`; }).join('') || '<p class="hint" style="margin:0">아직 사람이 없어요.</p>'}</div>`;
    }
    h += `<h3>본사 지원자 <span class="chip">매주 월요일 새로 와요</span></h3><div class="staff-list">${S.hqCands.map(c => `<div class="staff cand"><div class="staff-h"><b>${esc(c.name)}</b><span class="chip blue">${c.mbti}</span><span class="chip">${Sim.DEPTS[c.dept].icon} ${Sim.DEPTS[c.dept].name}</span><span class="morale">희망 월급 ${won(c.salary)}</span></div>${statBar('전문성', c.exp)}<div class="staff-a"><button class="btn sm primary" data-act="hqhire" data-arg="${c.id}">채용하기</button></div></div>`).join('')}</div>`;
    return h;
  }
  function pStores() {
    let list = S.stores.filter(s => s.owner === 0);
    if (!list.length) return '<h3>아직 매장이 없어요</h3><p class="hint">왼쪽 도구에서 업종을 고르고 초록빛이 진한 빈 땅을 눌러 보세요. 빈 땅을 그냥 누르면 상권 분석을 볼 수 있어요.</p>';
    if (storeFilter === 'direct') list = list.filter(s => !s.franchise);
    if (storeFilter === 'fr') list = list.filter(s => s.franchise);
    list.sort((a, b) => b.profitAvg - a.profitAvg);
    return `<div class="filter seg">${[['all', '전체'], ['direct', '직영'], ['fr', '가맹']].map(([k, n]) => `<button class="${storeFilter === k ? 'on' : ''}" data-act="filter" data-arg="${k}">${n}</button>`).join('')}</div>
      <table class="t"><thead><tr><th>매장</th><th class="r">어제 손님</th><th class="r">직원</th><th class="r">평점</th><th class="r">30일 손익</th></tr></thead><tbody>
      ${list.map(s => `<tr class="click" data-act="goto" data-arg="${s.id}"><td>${Sim.CATS[s.cat].icon} ${esc(hoodOfXY(s.x, s.y).name)}${s.franchise ? ' <span class="chip blue">가맹</span>' : ''}${s.lost > s.served * 0.1 && !s.franchise ? ' <span class="chip warn">붐빔</span>' : ''}${s.staff.some(x => x.morale < 40) && !s.franchise ? ' <span class="chip bad">사기↓</span>' : ''}</td><td class="r">${s.served}</td><td class="r">${s.staff.length}</td><td class="r">${s.rating.toFixed(1)}</td><td class="r ${s.profitAvg >= 0 ? 'up' : 'down'}">${short(s.profitAvg * 30)}</td></tr>`).join('')}
      </tbody></table><p class="hint">줄을 누르면 지도에서 찾아가요. 가맹점의 손익은 점주의 손익이에요.</p>`;
  }
  function pHoods() {
    const hs = Sim.hoodStats(S);
    return `<p class="hint" style="margin-top:0">동네마다 소득, 삶의 질, 노후도, 손님층, 임대료가 달라요. 역·랜드마크·호수가 가까우면 비싸고 낡은 동네는 싸요. 동네가 뜨면 임대료와 소득이 오르고 오래 살던 주민과 작은 가게가 밀려나요(젠트리피케이션). 소득이 높은 동네는 가격에 덜 민감하고 브런치·일식·샐러드를 좋아해요.</p>
      <div class="btn-row" style="margin-top:0"><button class="btn ${R.showHoods ? 'primary' : ''}" data-act="hoodlabels">지도에 동네 이름 ${R.showHoods ? '숨기기' : '보기'}</button></div>
      ${hs.map(h => `<div class="box click" data-act="gotohood" data-arg="${h.i}"><div class="box-h"><strong>${esc(h.name)}</strong>${h.hype >= 40 ? '<span class="chip bad">🔥 뜨는 중</span>' : h.hype >= 15 ? '<span class="chip warn">관심 상승</span>' : ''}${h.transit ? '<span class="chip blue">🚇 역세권</span>' : ''}</div>
        <p class="hint" style="margin:0 0 6px">${esc(h.desc)}</p>${segBars(h.mix)}
        <div class="legend" style="margin:2px 0 4px">${Object.entries(h.prof).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `<span>${Sim.PROFILE_NAME[k]} ${Math.round(v / Math.max(1, h.pop) * 100)}%</span>`).join('')}</div>
        <div class="legend" style="margin:0 0 4px">${Object.entries(h.cls).map(([k, v]) => `<span>${Sim.CLS_NAME[k]} ${v}동</span>`).join('')}</div>
        <div class="rows"><span>평당 월세 평균</span><span>${won(h.rent)}</span><span>가구 소득</span><span>월 ${h.income.toFixed(0)}만원</span><span>유동 인구</span><span>${Math.round(h.pop).toLocaleString('ko-KR')}명</span><span>매장 · 빈 땅</span><span>${h.stores}곳 · ${h.empty}칸</span></div>
        ${statBar('삶의 질', h.qol)}${statBar('노후도', h.age * 100, 'warn')}${statBar('화제성', h.hype, 'star')}${h.gentri > 5 ? statBar('젠트리', h.gentri, 'warn') : ''}
        ${h.displaced > 0 ? `<p class="hint" style="margin:4px 0 0">떠난 원주민 약 ${Math.round(h.displaced).toLocaleString('ko-KR')}명</p>` : ''}</div>`).join('')}`;
  }
  function pLogi() {
    const p = S.companies[0], mine = S.stores.filter(s => s.owner === 0);
    const cnt = k => mine.filter(s => s.supply === k).length;
    const facs = S.facs.filter(f => f.owner === 0);
    let h = `<div class="cards"><div class="stat"><span class="lbl">직송 매장</span><b class="${cnt('direct') ? 'down' : ''}">${cnt('direct')}곳</b><span class="d">원가 +8%</span></div>
      <div class="stat"><span class="lbl">센터 · 주방 배송</span><b class="up">${cnt('warehouse')} · ${cnt('kitchen')}곳</b><span class="d">원가 -12% · -18%</span></div></div>
      <div class="btn-row"><button class="btn ${$('btnLogi').classList.contains('on') ? 'primary' : ''}" data-act="logiview">지도에 물류망 ${$('btnLogi').classList.contains('on') ? '숨기기' : '보기'}</button></div><h3>우리 시설</h3>`;
    if (!facs.length) h += '<p class="hint">아직 시설이 없어요. 매장이 10곳 넘게 모이면 물류센터를 지어 원가를 줄여 보세요. 배송 트럭이 아침마다 매장을 돌아요.</p>';
    for (const f of facs) { const F = Sim.FAC[f.kind]; h += `<div class="box"><div class="box-h"><span class="ic">${F.icon}</span><strong>${F.name}</strong><span class="chip">${esc(hoodOfXY(f.x, f.y).name)}</span></div><div class="rows">${F.range ? `<span>담당</span><span>${S.stores.filter(s => s.facId === f.id).length} / ${Sim.facCap(f)}곳</span>` : '<span>효과</span><span>회사 전체 카페</span>'}<span>운영비</span><span>월 ${won(F.upkeep * (1 + 0.5 * (f.level - 1)))}</span></div><div class="btn-row"><button class="btn" data-act="gotofac" data-arg="${f.id}">지도에서 보기</button></div></div>`; }
    h += '<h3>식자재 시세</h3><table class="t"><thead><tr><th>품목</th><th class="r">현재가</th><th class="r">평년 대비</th><th style="width:90px">추이</th></tr></thead><tbody>';
    for (const k in Sim.INGR) { const g = S.ingr[k], d = g.p / Sim.INGR[k].base - 1; h += `<tr><td>${Sim.INGR[k].name}</td><td class="r">${won(g.p)}/${Sim.INGR[k].unit}</td><td class="r ${d > 0.05 ? 'down' : d < -0.05 ? 'up' : ''}">${d >= 0 ? '+' : ''}${(d * 100).toFixed(0)}%</td><td>${chart({ series: [{ data: g.hist.slice(-40), color: d > 0 ? '#cf6476' : '#4f9a6e' }], spark: true }, 'sm')}</td></tr>`; }
    return h + `</tbody></table><h3>공급 계약</h3><div class="box"><div class="box-h"><span class="ic">🌾</span><strong>협력 농장 계약</strong><span class="chip ${p.farm ? 'good' : ''}">${p.farm ? '계약 중' : '미계약'}</span></div>
      <p class="hint">월 500만원으로 고기·채소를 15% 싸게 받아요.</p><div class="btn-row"><button class="btn ${p.farm ? '' : 'primary'}" data-act="farm">${p.farm ? '계약 해지' : '계약하기'}</button></div></div>`;
  }
  function pBrand() {
    const p = S.companies[0], alive = S.companies.filter(c => !c.dead);
    let h = `<p class="hint" style="margin-top:0">인지도는 손님이 늘고 홍보할수록 오르고 가만히 두면 조금씩 내려가요. 가맹점은 본사가 정한 표준 인테리어로 열어요.</p>
      <div class="ctl"><span class="lbl" style="width:auto">가맹 표준 인테리어</span><div class="chips">${Sim.STYLE_KEYS.map(k => `<button class="pick sm ${p.frStyle === k ? 'on' : ''}" data-act="frstyle" data-arg="${k}">${Sim.STYLES[k].name}</button>`).join('')}</div></div>`;
    for (const k of Sim.CAT_KEYS) {
      const C = Sim.CATS[k], fr = p.fr[k], can = Sim.canFranchise(S, k);
      const frN = S.stores.filter(s => s.owner === 0 && s.franchise && s.cat === k).length;
      h += `<div class="box"><div class="box-h"><span class="ic">${C.icon}</span><strong>${C.name}</strong>${fr.on ? '<span class="chip good">가맹 모집 중</span>' : can.ok ? '<span class="chip warn">가맹 가능</span>' : ''}</div>
        <div class="brandbars">${alive.map(c => `<div class="brandbar"><span class="nm">${logo(c, 13)} ${esc(c.name)}</span><div class="bar"><i style="width:${c.brand[k]}%;background:${c.color}"></i></div><span class="num">${c.brand[k].toFixed(0)}</span></div>`).join('')}</div>
        <div class="ctl"><span class="lbl">레시피</span><span class="val" style="min-width:auto">${p.recipe[k]} / 10단계</span><button class="btn" data-act="research" data-arg="${k}" ${p.recipe[k] >= 10 || p.cash < Sim.researchCost(p, k) ? 'disabled' : ''}>연구 <small>${short(Sim.researchCost(p, k))}</small></button></div>
        ${can.ok || fr.on ? `<div class="ctl"><span class="lbl">가맹</span><button class="btn ${fr.on ? '' : 'primary'}" data-act="fr" data-arg="${k}">${fr.on ? '모집 중단' : '모집 시작'}</button><span class="lbl" style="width:auto">로열티</span><button class="step" data-act="roy" data-arg="${k}:-1">−</button><span class="val" style="min-width:44px">${pct(fr.royalty)}</span><button class="step" data-act="roy" data-arg="${k}:1">+</button></div>
          <p class="hint" style="margin:0">가맹점 ${frN} / ${can.own * 5}곳. 가맹비 1,000만·교육비 300만·인테리어 마진 10%를 받아요.</p>` : `<p class="hint" style="margin:0">가맹 조건: 본사 ${can.hq ? '✓' : '없음'}, 직영점 ${can.own}/3곳, 인지도 ${can.brand.toFixed(0)}/20</p>`}</div>`;
    }
    return h;
  }
  function pEvents() {
    const p = S.companies[0];
    const act = [];
    for (const c of S.companies) if (!c.dead) for (const e of c.ev) if (e.until > S.hour) act.push(`${logo(c, 13)} ${esc(c.name)} · ${Sim.CO_EVENTS[e.kind].name}${e.cat ? ` (${Sim.CATS[e.cat].name})` : ''} · ${Math.ceil((e.until - S.hour) / 24)}일 남음`);
    for (const k in S.trends) if (S.trends[k].until > S.hour) act.push(`✨ ${Sim.CATS[k].name} 열풍 · ${Math.ceil((S.trends[k].until - S.hour) / 24)}일 남음`);
    S.hoods.forEach((h, i) => { if (h.festival > S.hour) act.push(`🎉 ${Sim.HOODS[i].name} 축제`); if (h.hype >= 40) act.push(`🔥 ${Sim.HOODS[i].name}이 뜨는 중 (화제성 ${Math.round(h.hype)})`); });
    if (S.econ.mult !== 1) act.push(S.econ.mult > 1 ? '☀️ 경기 호황' : '🌧️ 경기 둔화');
    const w = Sim.WEATHER[S.weather.kind];
    return `<h3>오늘</h3><div class="rows"><span>날씨</span><span>${w.icon} ${w.name} ${S.weather.temp}°C</span><span>요일</span><span>${Sim.dateOf(S).wdName}요일${Sim.dateOf(S).holiday ? ' · 공휴일' : ''}${Sim.dateOf(S).meongjeol ? ' · 명절 연휴' : ''}</span></div>
      <h3>진행 중인 일</h3>${act.length ? `<ul class="news">${act.map(a => `<li><span class="when"></span><span>${a}</span></li>`).join('')}</ul>` : '<p class="hint">조용한 날이에요.</p>'}
      <h3>회사 이벤트</h3><div class="ctl"><span class="lbl">대상 업종</span><div class="seg">${Sim.CAT_KEYS.map(k => `<button class="${coCat === k ? 'on' : ''}" data-act="cocat" data-arg="${k}">${Sim.CATS[k].icon}</button>`).join('')}</div></div>
      <div class="evgrid">${Object.entries(Sim.CO_EVENTS).map(([k, E]) => { const on = k === 'app' ? p.app : p.ev.some(e => e.kind === k && e.cat === coCat && e.until > S.hour); return `<button class="evbtn ${on ? 'on' : ''}" data-act="coevent" data-arg="${k}" ${on || p.cash < E.cost ? 'disabled' : ''}><b>${E.name}</b><span>${E.desc}</span><small>${on ? (k === 'app' ? '출시함' : '진행 중') : won(E.cost)}</small></button>`; }).join('')}</div>
      <p class="hint">매장별 이벤트(1+1, 시즌 메뉴, 스탬프, SNS 체험단)는 매장 안 운영 탭에서 열 수 있어요.</p>`;
  }
  function pStock() {
    const p = S.companies[0];
    let h = '<h3>우리 회사</h3>';
    if (!p.listed) {
      const c = Sim.ipoCheck(S);
      const row = (ok, t) => `<li class="${ok ? 'ok' : ''}"><span class="ck"></span><span>${t}</span></li>`;
      h += `<div class="box"><p class="hint" style="margin-top:0">코스닥에 상장하면 새 주식 25%를 공모가 1만 5천원에 팔아 큰 자금을 모아요. 회장님 지분은 75%로 줄어요.</p>
        <ul class="checks">${row(c.stores >= 10, `매장 10곳 이상 (지금 ${c.stores}곳)`)}${row(c.value >= 1e10, `기업가치 100억원 이상 (지금 ${won(c.value)})`)}${row(c.profitable, '석 달 연속 흑자')}</ul>
        <div class="btn-row"><button class="btn primary" data-act="ipo" ${c.ok ? '' : 'disabled'}>🔔 상장하기</button></div></div>`;
    } else {
      const ph = p.priceHist, ch = ph.length > 30 ? p.price / ph[ph.length - 31] - 1 : 0;
      h += `<div class="cards"><div class="stat"><span class="lbl">주가</span><b>${Math.round(p.price).toLocaleString('ko-KR')}원</b><span class="d ${ch >= 0 ? 'up' : 'down'}">30일 ${ch >= 0 ? '+' : ''}${(ch * 100).toFixed(1)}%</span></div>
        <div class="stat"><span class="lbl">시가총액</span><b>${won(Sim.marketCap(p))}</b></div><div class="stat"><span class="lbl">회장님 지분</span><b>${pct(p.founderShares / p.shares)}</b></div><div class="stat"><span class="lbl">받은 배당</span><b>${won(S.founder.cash)}</b></div></div>
        ${chart({ series: [{ data: ph.slice(-180), color: '#e3a33a', fill: true }] })}
        <div class="btn-row"><button class="btn" data-act="issue">유상증자 10%</button><button class="btn" data-act="buyback">자사주 매입 2%</button></div>
        <div class="ctl"><span class="lbl">배당 성향</span><button class="step" data-act="div" data-arg="-0.1">−</button><span class="val">${Math.round(p.dividend * 100)}%</span><button class="step" data-act="div" data-arg="0.1">+</button></div>`;
    }
    h += '<h3>경쟁사 주식</h3><p class="hint" style="margin-top:0">지분을 50% 넘게 모으면 회사를 인수할 수 있어요. 창업주 지분 40%는 시장에 나오지 않아요.</p>';
    for (const c of S.companies) {
      if (c.isPlayer || c.dead) continue;
      const mine = (p.holdings[c.id] || 0) / c.shares, ph = c.priceHist, ch = ph.length > 30 ? c.price / ph[ph.length - 31] - 1 : 0;
      const A = c.ai && Sim.ARCHETYPES[c.ai.arch];
      if (!c.listed) { h += `<div class="box"><div class="box-h">${logo(c, 20)}<strong>${esc(c.name)}</strong><span class="chip">비상장</span>${A ? `<span class="chip blue">${A.name}</span>` : ''}</div><p class="hint" style="margin:0">${A ? esc(A.goal) : ''} · 매장 ${S.stores.filter(s => s.owner === c.id).length}곳</p></div>`; continue; }
      h += `<div class="box"><div class="box-h">${logo(c, 20)}<strong>${esc(c.name)}</strong>${A ? `<span class="chip blue">${A.name}</span>` : ''}<span class="chip ${ch >= 0 ? 'good' : 'bad'}">${ch >= 0 ? '+' : ''}${(ch * 100).toFixed(1)}%</span></div>
        ${chart({ series: [{ data: ph.slice(-120), color: c.color }], spark: true }, 'sm')}
        <div class="rows"><span>주가 · 시총</span><span>${Math.round(c.price).toLocaleString('ko-KR')}원 · ${short(Sim.marketCap(c))}</span><span>내 지분</span><span>${pct(mine)}</span><span>매장</span><span>${S.stores.filter(s => s.owner === c.id).length}곳</span></div>
        <div class="btn-row"><button class="btn" data-act="buy" data-arg="${c.id}:0.01">1% 매수 <small>${short(c.shares * 0.01 * c.price * 1.006)}</small></button><button class="btn" data-act="buy" data-arg="${c.id}:0.05">5% 매수 <small>${short(c.shares * 0.05 * c.price * 1.03)}</small></button><button class="btn" data-act="sell" data-arg="${c.id}:0.05" ${mine <= 0 ? 'disabled' : ''}>5% 매도</button>${mine > 0.5 ? `<button class="btn primary" data-act="acquire" data-arg="${c.id}">🏆 인수하기</button>` : ''}</div></div>`;
    }
    return h;
  }
  function pNews() { return `<ul class="news">${S.news.map(n => { const d = Sim.dateOf(S, n.hour); return `<li class="${n.kind}"><span class="when">${d.month}/${d.day} ${String(d.hour).padStart(2, '0')}시</span><span>${esc(n.text)}</span></li>`; }).join('')}</ul>`; }

  // ---------- 차트 ----------
  function drawChart(cv, cfg) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const stackSum = cfg.bars && cfg.bars.stack ? cfg.bars.data.map((v, i) => v + cfg.bars.stack[i]) : [];
    const all = [].concat(...(cfg.series || []).map(s => s.data), cfg.bars ? cfg.bars.data : [], stackSum);
    if (!all.length) return;
    let lo = Math.min(...all), hi = Math.max(...all);
    if (cfg.zero || cfg.bars) { lo = Math.min(0, lo); hi = Math.max(0, hi); }
    if (hi === lo) { hi += 1; }
    const padL = cfg.spark ? 2 : 4, padR = 4, padT = cfg.spark ? 3 : cfg.noMax ? 4 : 14, padB = cfg.spark ? 3 : (cfg.labels ? 15 : 6);
    const X = (i, n) => padL + (n <= 1 ? 0 : i / (n - 1)) * (w - padL - padR);
    const Y = v => padT + (1 - (v - lo) / (hi - lo)) * (h - padT - padB);
    const muted = '#7c8a82';
    if (!cfg.spark) {
      ctx.strokeStyle = '#e6ede7'; ctx.lineWidth = 1;
      for (let i = 0; i <= 2; i++) { const y = padT + i * (h - padT - padB) / 2; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke(); }
      if (lo < 0) { ctx.strokeStyle = '#c9d6cc'; ctx.beginPath(); ctx.moveTo(padL, Y(0)); ctx.lineTo(w - padR, Y(0)); ctx.stroke(); }
      if (!cfg.noMax) { ctx.fillStyle = muted; ctx.font = '10.5px "Gowun Dodum", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(hi >= 1e4 ? short(hi) : Math.round(hi) + '', padL, 0); }
    }
    const n = cfg.bars ? cfg.bars.data.length : 0;
    const bx = i => padL + (i + 0.5) / n * (w - padL - padR);
    if (cfg.bars) {
      const bw = Math.max(2, (w - padL - padR) / n * 0.62);
      const rr = (x, y, ww, hh) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, ww, hh, 2); else ctx.rect(x, y, ww, hh); ctx.fill(); };
      cfg.bars.data.forEach((v, i) => {
        const y0 = Y(0), y1 = Y(v);
        ctx.fillStyle = cfg.bars.color; rr(bx(i) - bw / 2, Math.min(y0, y1), bw, Math.abs(y1 - y0));
        if (cfg.bars.stack && cfg.bars.stack[i] > 0.5) { const y2 = Y(v + cfg.bars.stack[i]); ctx.fillStyle = cfg.bars.stackColor; rr(bx(i) - bw / 2, y2, bw, y1 - y2); }
      });
      if (cfg.labels) { ctx.fillStyle = muted; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.font = '10px "Gowun Dodum", sans-serif'; cfg.labels.forEach((l, i) => { if (l) ctx.fillText(l, bx(i), h); }); }
    }
    for (const s of cfg.series || []) {
      const m = s.data.length; if (!m) continue;
      const xs = cfg.bars ? bx : (i => X(i, m));
      ctx.beginPath(); s.data.forEach((v, i) => i ? ctx.lineTo(xs(i), Y(v)) : ctx.moveTo(xs(i), Y(v)));
      ctx.strokeStyle = s.color; ctx.lineWidth = cfg.spark ? 1.5 : 2; ctx.lineJoin = 'round';
      if (s.dashed) ctx.setLineDash([4, 3]);
      ctx.stroke(); ctx.setLineDash([]);
      if (s.fill) { ctx.lineTo(xs(m - 1), h - padB); ctx.lineTo(xs(0), h - padB); ctx.closePath(); ctx.globalAlpha = 0.15; ctx.fillStyle = s.color; ctx.fill(); ctx.globalAlpha = 1; }
      if (!s.dashed) { ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(xs(m - 1), Y(s.data[m - 1]), cfg.spark ? 2 : 3, 0, 7); ctx.fill(); }
    }
  }

  // ---------- 행동 ----------
  function selStore() { if (storeView) return viewStore(); if (!selected) return null; const t = Sim.tile(S, selected.x, selected.y); return t.b && t.b.k === 'store' ? S.stores.find(s => s.id === t.b.id) : null; }
  function selFac() { if (!selected) return null; const t = Sim.tile(S, selected.x, selected.y); return t.b && t.b.k === 'fac' ? S.facs.find(f => f.id === t.b.id) : null; }
  function arm(key) { armed = key; clearTimeout(armedTimer); armedTimer = setTimeout(() => { armed = null; dirty = true; }, 3500); }

  function act(a, arg) {
    const st = selStore();
    if (!['enter', 'hire', 'confirmopen', 'arch'].includes(a)) Snd.play('click');
    switch (a) {
      case 'deselect': selected = null; R.sel = null; openForm = null; break;
      case 'questmin': questMin = !questMin; break;
      case 'planopen': openForm = { x: selected.x, y: selected.y, cat: arg, size: 2, style: 'nordic', tier: 2, menu: Sim.defaultMenu(arg, 2), sig: null }; break;
      case 'of': { const [k, v] = arg.split(':'); openForm[k] = k === 'style' ? v : +v; if (k === 'size') openForm.menu = openForm.menu.slice(0, Sim.SIZES[+v].menu); break; }
      case 'ofmenu': { const L = openForm.menu, i = L.indexOf(arg); if (i >= 0) { if (L.length > 2) L.splice(i, 1); else toast('메뉴는 최소 2개가 필요해요.', 'bad'); } else if (L.length < Sim.SIZES[openForm.size].menu) L.push(arg); else toast(`${Sim.SIZES[openForm.size].name}은 메뉴를 ${Sim.SIZES[openForm.size].menu}개까지 둘 수 있어요.`, 'bad'); break; }
      case 'lotall': lotAll = !lotAll; break;
      case 'mtoggle': { const sel = storeView.menuSel, i = sel.ids.indexOf(arg), max = Sim.SIZES[st.size].menu; if (i >= 0) { if (sel.ids.length > 2) { sel.ids.splice(i, 1); if (sel.sig === arg) sel.sig = null; } else toast('메뉴는 최소 2개가 필요해요.', 'bad'); } else if (sel.ids.length < max) sel.ids.push(arg); else toast(`메뉴는 ${max}개까지예요. 매장을 넓히면 더 둘 수 있어요.`, 'bad'); break; }
      case 'msig': storeView.menuSel.sig = storeView.menuSel.sig === arg ? null : arg; break;
      case 'mreset': storeView.menuSel = null; break;
      case 'mapply': { const r = Sim.setMenu(S, st.id, storeView.menuSel.ids, storeView.menuSel.sig); result(r, '새 메뉴판을 걸었어요!'); if (r.ok) storeView.menuSel = null; break; }
      case 'confirmopen': confirmOpen(); break;
      case 'cancelopen': openForm = null; break;
      case 'enter': openStoreView(+arg); Snd.play('door'); break;
      case 'price': if (st) st.price = Math.max(60, Math.min(180, st.price + +arg)); Sim.computeDemand(S); break;
      case 'hours': if (st) { const [k, d] = arg.split(':'); const o = k === 'open' ? st.open + +d : st.open, c = k === 'close' ? st.close + +d : st.close; result(Sim.setHours(S, st.id, o, c)); } break;
      case 'mkt': if (st) { st.mkt = +arg; Sim.computeDemand(S); } break;
      case 'dlv': if (st) st.delivery = arg === '1'; break;
      case 'invdays': if (st) result(Sim.setInvDays(S, st.id, +arg)); break;
      case 'tab': tab = arg; renderTabs(); $('panel').classList.add('open'); break;
      case 'hqhire': { const r = Sim.hqHire(S, +arg); result(r); if (r.ok) Snd.play('hire'); break; }
      case 'hqdept': { const [id, d] = arg.split(':'); result(Sim.hqAct(S, +id, 'dept', d)); break; }
      case 'hqws': result(Sim.hqAct(S, +arg, 'workshop')); break;
      case 'hqraise': result(Sim.hqAct(S, +arg, 'raise')); break;
      case 'hqfire': if (armed === 'hqfire:' + arg) { armed = null; result(Sim.hqAct(S, +arg, 'fire')); } else arm('hqfire:' + arg); break;
      case 'buildhq': setTool('fac:hq'); closePanelSm(); break;
      case 'sevent': if (st) result(Sim.runStoreEvent(S, st.id, arg)); break;
      case 'upgrade': if (st) result(Sim.upgradeStore(S, st.id), '매장을 넓혔어요. 좌석이 늘어났어요.'); break;
      case 'buyprop': if (st) result(Sim.buyProperty(S, st.id), '건물을 샀어요! 이제 월세가 들지 않고, 건축 양식을 바꿀 수 있어요.'); break;
      case 'arch': if (st) { const r = Sim.setArch(S, st.id, arg); result(r); if (r.ok) { R.pop(st.x, st.y); Snd.play('build'); } } break;
      case 'ftool': storeView.ftool = arg ? { k: arg, r: 0 } : null; break;
      case 'frot': if (storeView.ftool) storeView.ftool.r = ((storeView.ftool.r || 0) + 1) % 4; break;
      case 'fsnap': storeView.snap = storeView.snap === 0.25 ? 0.5 : 0.25; break;
      case 'freset': if (st) { if (armed === 'freset') { armed = null; result(Sim.resetFurn(S, st.id)); } else arm('freset'); } break;
      case 'ipick': if (arg === 'reset') storeView.pick = null; else { const [k, v] = arg.split(':'); storeView.pick[k] = k === 'style' ? v : +v; } break;
      case 'interior': if (st && storeView.pick) { result(Sim.setInterior(S, st.id, storeView.pick.style, storeView.pick.tier)); storeView.pick = null; } break;
      case 'close': if (st) { if (armed === 'close:' + st.id) { armed = null; result(Sim.closeStore(S, st.id)); closeStoreView(); selected = null; R.sel = null; } else arm('close:' + st.id); } break;
      case 'hire': if (st) { const r = Sim.hire(S, st.id, +arg); result(r); if (r.ok) Snd.play('hire'); } break;
      case 'sshift': { const [id, v] = arg.split(':'); result(Sim.staffAct(S, st.id, +id, 'shift', v)); break; }
      case 'srole': { const [id, v] = arg.split(':'); result(Sim.staffAct(S, st.id, +id, 'role', v)); break; }
      case 'strain': result(Sim.staffAct(S, st.id, +arg, 'train')); break;
      case 'sraise': result(Sim.staffAct(S, st.id, +arg, 'raise')); break;
      case 'sfire': if (armed === 'fire:' + arg) { armed = null; result(Sim.fire(S, st.id, +arg)); } else arm('fire:' + arg); break;
      case 'autohire': S.autoHire = arg === '1'; break;
      case 'facup': { const f = selFac(); if (f) result(Sim.upgradeFacility(S, f.id), '시설을 확장했어요.'); break; }
      case 'facdel': { const f = selFac(); if (f) { if (armed === 'facdel:' + f.id) { armed = null; result(Sim.removeFacility(S, f.id), '시설을 철거했어요.'); selected = null; R.sel = null; } else arm('facdel:' + f.id); } break; }
      case 'research': result(Sim.research(S, 0, arg), `${Sim.CATS[arg].name} 레시피가 좋아졌어요!`); break;
      case 'fr': { const fr = S.companies[0].fr[arg]; result(Sim.setFranchise(S, arg, !fr.on), fr.on ? '' : '가맹점 모집 공고를 냈어요.'); break; }
      case 'roy': { const [k, d] = arg.split(':'); const fr = S.companies[0].fr[k]; Sim.setFranchise(S, k, fr.on, Math.round((fr.royalty + d * 0.005) * 1000) / 1000); break; }
      case 'frstyle': S.companies[0].frStyle = arg; break;
      case 'cocat': coCat = arg; break;
      case 'coevent': result(Sim.runCoEvent(S, 0, arg, coCat)); break;
      case 'farm': Sim.setFarm(S, !S.companies[0].farm); break;
      case 'logiview': $('btnLogi').classList.toggle('on'); refreshOverlay(); break;
      case 'hoodlabels': R.showHoods = !R.showHoods; break;
      case 'gotohood': { const c = S.hoodCenters[+arg]; R.centerOn(c.x, c.y); R.cam.z = Math.max(R.cam.z, 0.7); R.showHoods = true; closePanelSm(); break; }
      case 'borrow': result(Sim.borrow(S), '1억원을 빌렸어요.'); break;
      case 'repay': result(Sim.repay(S), '1억원을 갚았어요.'); break;
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
    dirty = true; renderUi(true);
  }
  function closePanelSm() { $('panel').classList.remove('open'); }
  function renderUi(force) {
    if (!S) return;
    const now = performance.now();
    if (!force && (!dirty || now - lastUi < 700)) return;
    lastUi = now; dirty = false;
    renderTop(); renderQuest(); renderInspector(); renderPanel();
    if (storeView) renderStoreView();
  }

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
      if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); R.zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, (pinch.z * d / pinch.d) / R.cam.z); return; }
      if (down) {
        const dx = e.offsetX - down.x, dy = e.offsetY - down.y;
        if (!dragged && Math.hypot(dx, dy) > 6) dragged = true;
        if (dragged) { R.cam.x = down.cx - dx / R.cam.z; R.cam.y = down.cy - dy / R.cam.z; cv.style.cursor = 'grabbing'; }
      }
      const p = R.pick(e.offsetX, e.offsetY);
      R.hover = p;
      if (tool !== 'select' && p) {
        const [kind, k] = tool.split(':');
        const fp = kind === 'fac' ? Sim.FAC[k].fp : [1, 1];
        const fit = Sim.isLot(Sim.tile(S, p.x, p.y)) ? Sim.findFit(S, p.x, p.y, fp[0], fp[1]) : null;
        R.ghost = fit ? { x: fit.x, y: fit.y, w: fit.w, d: fit.d, ok: true, icon: toolIcon() } : { x: p.x, y: p.y, w: fp[0], d: fp[1], ok: false, icon: toolIcon() };
      }
    });
    const up = e => {
      ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
      if (ptrs.size === 0 && down) {
        cv.style.cursor = '';
        if (!dragged && !modalOpen) {
          const p = R.pick(e.offsetX, e.offsetY);
          if (p) {
            if (tool !== 'select') { if (Sim.isLot(Sim.tile(S, p.x, p.y))) clickBuild(p.x, p.y); else toast('빈 땅을 골라주세요. 길·건물 위에는 지을 수 없어요.', 'bad'); }
            else {
              const t = Sim.anchorOf(S, Sim.tile(S, p.x, p.y));
              const q = t.b ? { x: t.x, y: t.y } : p;
              if (selected && selected.x === q.x && selected.y === q.y && t.b && t.b.k === 'store') openStoreView(t.b.id);
              else { selected = q; R.sel = q; armed = null; openForm = null; renderInspector(); }
            }
          }
        }
        down = null;
      }
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', () => { R.hover = null; if (tool === 'select') R.ghost = null; });
    cv.addEventListener('dblclick', e => { const p = R.pick(e.offsetX, e.offsetY); const t = p && Sim.tile(S, p.x, p.y); if (t && t.b && t.b.k === 'store') openStoreView(t.b.id); });
    cv.addEventListener('wheel', e => { e.preventDefault(); R.zoomAt(e.offsetX, e.offsetY, e.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });
    cv.addEventListener('contextmenu', e => { e.preventDefault(); if (tool !== 'select') setTool('select'); });
    $('tools').addEventListener('click', e => { const b = e.target.closest('[data-tool]'); if (b) setTool(b.dataset.tool); });
    document.querySelector('.speed').addEventListener('click', e => { const b = e.target.closest('[data-speed]'); if (b) { speedIdx = +b.dataset.speed; renderTop(); } });
    $('tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { Snd.play('tab'); tab = b.dataset.tab; $('tabBody').scrollTop = 0; renderTabs(); renderPanel(); } });
    $('svTabs').addEventListener('click', e => { const b = e.target.closest('[data-svtab]'); if (b) { Snd.play('tab'); storeView.tab = b.dataset.svtab; storeView.pick = null; storeView.menuSel = null; $('svBody').scrollTop = 0; renderStoreView(); } });
    for (const id of ['tabBody', 'inspector', 'quest', 'banner', 'tabs', 'svBody']) $(id).addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && !b.disabled) act(b.dataset.act, b.dataset.arg); });
    $('svBody').addEventListener('mouseover', e => { const c = e.target.closest('[data-staff]'); hoverStaff = c ? +c.dataset.staff : null; });
    const sc = $('svScene');
    sc.addEventListener('pointermove', e => { if (!storeView || storeView.tab !== 'deco') return; storeView.fcell = Renderer.interiorCell(sc, e.offsetX, e.offsetY); });
    sc.addEventListener('pointerleave', () => { if (storeView) storeView.fcell = null; });
    sc.addEventListener('click', e => {
      if (!storeView || storeView.tab !== 'deco' || !storeView.ftool) return;
      const st = viewStore(), c = Renderer.interiorCell(sc, e.offsetX, e.offsetY); if (!st || !c) return;
      const tl = storeView.ftool;
      const gp = furnPos(tl, c);
      const r = tl.k === 'erase' ? Sim.removeFurn(S, st.id, c.fx, c.fy) : Sim.placeFurn(S, st.id, tl.k, gp.x, gp.y, tl.r);
      result(r); if (r.ok) Snd.play(tl.k === 'erase' ? 'click' : 'build'); renderStoreView();
    });
    sc.addEventListener('contextmenu', e => { if (storeView && storeView.tab === 'deco') { e.preventDefault(); if (storeView.ftool && storeView.ftool.k !== 'erase') { storeView.ftool.r = ((storeView.ftool.r || 0) + 1) % 4; renderStoreView(); } } });
    $('svClose').addEventListener('click', closeStoreView);
    $('storeModal').addEventListener('click', e => { if (e.target.id === 'storeModal') closeStoreView(); });
    $('catPicker').addEventListener('click', e => { const b = e.target.closest('[data-pick]'); if (!b) return; Snd.play('click'); if (b.dataset.pick === 'close') { pickerOpen = false; renderPicker(); renderTools(); } else setTool('store:' + b.dataset.pick); });
    document.addEventListener('pointerdown', () => Snd.start(), { capture: true });
    const paintSnd = () => { const st = Snd.state; $('btnMusic').classList.toggle('on', st.music); $('btnSfx').classList.toggle('on', st.sfx); $('btnMusic').setAttribute('aria-pressed', st.music); $('btnSfx').setAttribute('aria-pressed', st.sfx); };
    $('btnMusic').addEventListener('click', () => { Snd.start(); Snd.toggleMusic(); paintSnd(); });
    $('btnSfx').addEventListener('click', () => { Snd.start(); Snd.toggleSfx(); paintSnd(); Snd.play('click'); });
    paintSnd();
    $('btnFit').addEventListener('click', () => R.fit());
    $('btnHood').addEventListener('click', () => { R.showHoods = !R.showHoods; $('btnHood').classList.toggle('on', R.showHoods); });
    $('btnLogi').addEventListener('click', () => { $('btnLogi').classList.toggle('on'); refreshOverlay(); if (tab === 'logi') renderPanel(); });
    $('btnPanel').addEventListener('click', () => { $('panel').classList.toggle('open'); renderPanel(); });
    window.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || modalOpen) return;
      if (e.code === 'Space') { e.preventDefault(); speedIdx = speedIdx ? 0 : 1; renderTop(); }
      else if (['1', '2', '3'].includes(e.key)) { speedIdx = +e.key; renderTop(); }
      else if (e.key === 'Escape') { if (storeView) closeStoreView(); else { setTool('select'); selected = null; R.sel = null; openForm = null; renderInspector(); } }
    });
    new ResizeObserver(() => R.resize()).observe($('stage'));
    document.addEventListener('visibilitychange', () => { if (document.hidden && !modalOpen) writeSave(true); });

    $('logoPick').addEventListener('click', e => {
      const b = e.target.closest('[data-logo-shape],[data-logo-color]'); if (!b) return;
      if (b.dataset.logoShape) newLogo = b.dataset.logoShape; else newColor = b.dataset.logoColor;
      renderLogoPick();
    });
    $('nameInput').addEventListener('input', renderLogoPick);
    $('diffPick').addEventListener('click', e => { const b = e.target.closest('[data-diff]'); if (b) { newDiff = b.dataset.diff; renderDiff(); } });
    $('evPick').addEventListener('click', e => { const b = e.target.closest('[data-ev]'); if (!b) return; if (b.dataset.ev === 'sp') newSponsor = !newSponsor; else newEvents = b.dataset.ev === '1'; renderDiff(); });
    $('compInput').addEventListener('input', () => { $('compVal').textContent = $('compInput').value + '개'; });
    $('btnNew').addEventListener('click', () => {
      const name = ($('nameInput').value || '').trim() || '모락상회';
      S = Sim.newGame({ seed: (Date.now() % 2147483647) | 0, name, color: newColor, logo: newLogo, difficulty: newDiff, events: newEvents, competitors: +$('compInput').value, sponsor: newSponsor });
      start();
      toast('빈 땅을 눌러 상권을 살펴보거나, 왼쪽에서 ☕ 카페를 골라 첫 가게를 열어 보세요!');
    });
    $('btnContinue').addEventListener('click', () => { const s = readSave(); if (s) { S = s; start(); toast('다시 오신 걸 환영해요.'); } });
    $('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('btnNew').click(); });
  }
  const LOGO_COLORS = ['#f2b950', '#e98a7a', '#7fb2d9', '#86b98f', '#b495c7', '#5f7f8f', '#d9768f', '#c79b6b'];
  function renderLogoPick() {
    $('logoPick').innerHTML = `<div class="lp-row">${Sim.LOGO_SHAPES.map(s => `<button class="lp ${newLogo === s ? 'on' : ''}" data-logo-shape="${s}" aria-label="${s}"><canvas data-logo="new" data-shape="${s}" style="width:26px;height:26px"></canvas></button>`).join('')}</div>
      <div class="lp-row">${LOGO_COLORS.map(c => `<button class="lc ${newColor === c ? 'on' : ''}" data-logo-color="${c}" style="background:${c}" aria-label="색 ${c}"></button>`).join('')}</div>`;
    $('logoPick').querySelectorAll('canvas').forEach(cv => {
      const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = 26 * dpr; cv.height = 26 * dpr;
      const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      Renderer.drawLogo(ctx, { name: ($('nameInput').value || '모').trim() || '모', color: newColor, logo: cv.dataset.shape }, 13, 13, 10);
    });
  }

  function renderDiff() {
    $('diffPick').innerHTML = Object.entries(Sim.DIFFICULTY).map(([k, D]) => `<button class="${newDiff === k ? 'on' : ''}" data-diff="${k}" title="${D.desc}">${D.name}</button>`).join('');
    $('diffDesc').textContent = Sim.DIFFICULTY[newDiff].desc + ` 시작 자금 ${won(Sim.DIFFICULTY[newDiff].cash)}.`;
    $('evPick').innerHTML = `<button class="${newEvents ? 'on' : ''}" data-ev="1">사건 있음</button><button class="${!newEvents ? 'on' : ''}" data-ev="0">평화롭게</button><button class="${newSponsor ? 'on' : ''}" data-ev="sp" title="버스정류장·공영주차장을 직접 후원해 지을 수 있어요">교통 후원 ${newSponsor ? '켬' : '끔'}</button>`;
  }
  function openModal() {
    modalOpen = true; speedIdx = 0;
    $('btnContinue').hidden = !readSave();
    $('oldSaveNote').hidden = !(oldSaveExists() && $('btnContinue').hidden);
    $('modal').hidden = false; renderLogoPick(); renderDiff();
    renderTop();
  }
  function start() {
    modalOpen = false; $('modal').hidden = true; closeStoreView(); lastQuests = Object.keys(S.quests).length; lastNews = S.news[0];
    selected = null; tool = 'select'; armed = null; openForm = null; acc = 0;
    R.setState(S); R.sel = null; R.overlay = null; R.home();
    speedIdx = 1; renderTabs(); renderTools(); dirty = true; renderUi(true);
  }

  // ---------- 루프 ----------
  let sceneT = 0;
  function frame(now) {
    const dt = Math.min(100, now - last); last = now;
    if (!modalOpen && speedIdx > 0 && !S.gameOver) {
      const h = S.hour % 24;
      const anyOpen = S.stores.some(s => s.owner === 0 && h >= s.open && h < s.close);
      nightSkip = !anyOpen && (h >= 22 || h < 7) && !storeView;
      acc += dt * SPEEDS[speedIdx] * (nightSkip ? 6 : 1);
      let n = 0;
      while (acc >= HOUR_MS && n < 6) {
        acc -= HOUR_MS; n++;
        const ev = Sim.step(S);
        R.onStep(ev);
        if (ev.money.length && SPEEDS[speedIdx] <= 3) Snd.play('coin');
        if (ev.newDay) { dirty = true; if (Sim.dateOf(S).day === 1) writeSave(true); if (tool.startsWith('store:')) refreshOverlay(); }
      }
      if (n) dirty = true;
    } else nightSkip = false;
    R.hourF = S ? hourF() % 24 : 12;
    R.draw(dt, modalOpen ? 1 : SPEEDS[speedIdx]);
    if (S) {
      renderClock();
      Snd.setMood(Math.floor(hourF()) % 24, S.weather.kind, Sim.seasonOf(S), S.weather.amt != null ? S.weather.amt : 0.6);
      const q = Object.keys(S.quests).length;
      if (q > lastQuests && lastQuests) Snd.play('fanfare');
      lastQuests = q;
      if (S.news.length && S.news[0] !== lastNews) { if (lastNews && S.news[0].kind === 'good') Snd.play('news'); lastNews = S.news[0]; }
    }
    renderUi();
    if (storeView) { const st = viewStore(); sceneT += dt; if (st) { const ed = storeView.tab === 'deco', tl = storeView.ftool, fc = storeView.fcell; Renderer.drawInterior($('svScene'), S, st, { hour: Math.floor(hourF()) % 24, t: sceneT, hoverStaff, edit: ed, ghost: ed && tl && fc && tl.k !== 'erase' ? Object.assign({ k: tl.k, r: tl.r }, furnPos(tl, fc)) : null, erase: ed && tl && fc && tl.k === 'erase' ? fc : null }); } }
    requestAnimationFrame(frame);
  }

  function boot(data) {
    R = new Renderer($('map'));
    if (window.Icons) Icons.watch(document.body);
    R.showHoods = true; $('btnHood').classList.add('on');
    bindInput();
    const hotSave = data && data.save ? (() => { try { return Sim.deserialize(data.save); } catch (e) { return null; } })() : null;
    if (hotSave) { S = hotSave; tab = data.tab || tab; start(); speedIdx = data.speed != null ? data.speed : 1; }
    else { S = Sim.newGame({ seed: 20261109 }); R.setState(S); R.home(); renderTabs(); renderTools(); dirty = true; renderUi(true); openModal(); }
    window.__morak = { get S() { return S; }, R, act, openStoreView };
    window.claude?.hot?.snapshot?.(() => ({ save: modalOpen ? null : Sim.serialize(S), speed: speedIdx, tab }));
    requestAnimationFrame(frame);
  }
  const hot = window.claude?.hot;
  if (hot && hot.ready) hot.ready(boot); else boot(hot?.data ?? {});
})();
