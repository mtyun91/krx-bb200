// 모락모락 타운 시뮬레이션 점검: node games/morak-town/test/sim.test.cjs
const assert = require('assert');
const Sim = require('../js/sim.js');
const DAY = 24;

function finite(S) {
  for (const c of S.companies) for (const k of ['cash', 'debt', 'price', 'value']) assert(Number.isFinite(c[k]), `${c.name}.${k}=${c[k]}`);
  for (const st of S.stores) {
    for (const k of ['served', 'profit', 'rating', 'price', 'profitAvg']) assert(Number.isFinite(st[k]), `store.${k}=${st[k]}`);
    for (const s of st.staff) for (const k of ['skill', 'speed', 'clean', 'star', 'morale', 'fatigue', 'wage']) assert(Number.isFinite(s[k]), `staff.${k}`);
  }
}
const own0 = S => S.stores.filter(s => s.owner === 0 && !s.franchise).every(s => s.profitAvg > 0) && S.stores.some(s => s.owner === 0);
const run = (S, days) => { for (let i = 0; i < days * DAY; i++) Sim.step(S); };

// 지도: 크기·구역·랜드마크·여러 칸 건물
{
  const S = Sim.newGame({ seed: 2 });
  assert.equal(S.tiles.length, 80 * 80);
  const lm = S.tiles.filter(t => t.b && t.b.k === 'lm').map(t => t.b.kind);
  console.log('[지도] 랜드마크', lm.length, '개 · 인구', Sim.population(S), '· 빈 땅', S.tiles.filter(Sim.isLot).length);
  assert(lm.length >= 11, '랜드마크');
  assert(S.tiles.some(t => t.t === 'bridge') && S.tiles.some(t => t.t === 'mount'), '다리·산');
  assert.equal(Sim.roadComponents(S), 1, '도로가 하나로 이어짐');
  const peak = Math.max(...Sim.HOODS.map((_, i) => Sim.congestion(S, i, 18))), night = Math.max(...Sim.HOODS.map((_, i) => Sim.congestion(S, i, 3)));
  console.log('[교통] 퇴근 최대 혼잡', peak.toFixed(2), '새벽', night.toFixed(2));
  assert(peak > night * 5, '퇴근길이 새벽보다 막힘');
  const big = S.tiles.filter(t => t.b && (t.b.w || 1) * (t.b.d || 1) >= 4);
  assert(big.length > 20, '2×2 이상 건물');
  for (const t of big) for (let j = 0; j < t.b.d; j++) for (let i = 0; i < t.b.w; i++) if (i || j) assert.equal(S.tiles[(t.y + j) * 80 + t.x + i].ref, t.y * 80 + t.x, '건물 칸 연결');
  const S2 = Sim.newGame({ seed: 4, competitors: 50, difficulty: 'hard' });
  assert.equal(S2.companies.length, 51); assert(S2.companies[0].cash === Sim.DIFFICULTY.hard.cash);
  assert(new Set(S2.companies.slice(1).map(c => c.ai.arch)).size >= 5, '다양한 성향');
}

// 0) 달력·시간
{
  const S = Sim.newGame({ seed: 1 });
  const d = Sim.dateOf(S);
  assert.deepEqual([d.year, d.month, d.day, d.wdName, d.hour], [2027, 3, 1, '월', 6], '2027-03-01(월) 06시 시작');
  assert(d.holiday, '3·1절은 공휴일');
  run(S, 31);
  const e = Sim.dateOf(S);
  assert.deepEqual([e.month, e.day], [4, 1], '31일 뒤 4월 1일');
  assert.equal(S.companies[0].months.length, 1, '3월 결산 1회');
}

// 1) 경쟁사만 있는 도시: 2년간 숫자가 깨지지 않고 매장 상한을 지킴
{
  const S = Sim.newGame({ seed: 7 });
  assert(S.stores.length >= 8, '경쟁사 초기 매장');
  assert(S.stores.every(s => Sim.tile(S, s.x, s.y).b && Sim.tile(S, s.x, s.y).b.id === s.id), '매장 자리 점유');
  assert(S.stores.every(s => s.staff.length >= 1), '모든 매장에 직원');
  run(S, 730);
  finite(S);
  const ai = S.companies.filter(c => c.ai).map(c => S.stores.filter(s => s.owner === c.id).length);
  console.log('[대기] 2년 뒤 경쟁사 매장', ai.join('/'), '인구', Sim.population(S), '최저시급', S.minWage);
  assert(ai.every(n => n <= 40));
  assert(S.minWage > 10600, '최저시급 인상 반영');
}

// 2) 직원 능력치가 실제로 영향을 주는지
{
  const S = Sim.newGame({ seed: 9 });
  S.companies[0].cash = 1e10;
  const spot = Sim.bestLot(S, 'cafe', 0, 1);
  const st = Sim.openStore(S, 0, spot.x, spot.y, 'cafe', { size: 1, style: 'wood', tier: 2 }).store;
  st.staff.forEach(s => { s.speed = 30; s.skill = 30; s.clean = 30; s.star = 30; s.morale = 70; });
  Sim.computeDemand(S); st._chem = 1;
  const slowCap = Sim.hourCap(st, 9), lowQ = Sim.quality(S, st), lowDem = Sim.dayDemand(st);
  st.staff.forEach(s => { s.speed = 90; s.skill = 90; s.clean = 90; s.star = 90; });
  Sim.computeDemand(S);
  const fastCap = Sim.hourCap(st, 9), hiQ = Sim.quality(S, st), hiDem = Sim.dayDemand(st);
  console.log(`[직원] 수용력 ${slowCap.toFixed(0)}→${fastCap.toFixed(0)}명/시, 품질 ${lowQ.toFixed(2)}→${hiQ.toFixed(2)}, 수요 ${lowDem.toFixed(0)}→${hiDem.toFixed(0)}명/일`);
  assert(fastCap > slowCap * 1.4 && hiQ > lowQ * 1.15 && hiDem > lowDem * 1.1);
  assert(Sim.compat('INFP', 'ENFJ') > Sim.compat('INFP', 'ESTJ'), 'MBTI 궁합');
  // 인테리어 등급
  const before = Sim.dayDemand(st), sv0 = Sim.spaceScore(st);
  assert(Sim.setInterior(S, st.id, 'luxury', 4).ok);
  console.log(`[인테리어] 수요 ${before.toFixed(0)}→${Sim.dayDemand(st).toFixed(0)}, 공간가치 ${sv0}→${Sim.spaceScore(st)}`);
  assert(Sim.dayDemand(st) > before && Sim.spaceScore(st) > sv0);
  // 건물 매입·양식
  assert(Sim.buyProperty(S, st.id).ok && st.owned && st.rent === 0);
  assert(Sim.setArch(S, st.id, 'hanok').ok && st.arch === 'hanok');
}

// 3) 간단한 봇: 카페 위주 확장 → 상장 시도
{
  const S = Sim.newGame({ seed: 11 });
  const p = S.companies[0];
  for (let d = 0; d < 900; d++) {
    if (d % 15 === 0) {
      const cat = d % 45 === 0 ? 'bakery' : 'cafe';
      const spot = Sim.bestLot(S, cat, 0, 4);
      if (spot) { const c = Sim.openCost(S, cat, spot.x, spot.y, 2, 'nordic', 2); if (p.cash < c.total + 3e7 && p.debt + 1e8 <= Sim.loanLimit(S, p) && own0(S)) Sim.borrow(S); if (p.cash > c.total + 3e7) Sim.openStore(S, 0, spot.x, spot.y, cat, { size: Sim.findFit(S, spot.x, spot.y, 2, 1) ? 2 : 1, style: 'nordic', tier: 2 }); }
    }
    if (d % 30 === 0 && p.cash < 1e8 && p.debt + 1e8 <= Sim.loanLimit(S, p) && S.stores.some(s => s.owner === 0)) Sim.borrow(S);
    if (d % 30 === 0) for (const k of ['cafe', 'bakery']) if (Sim.canFranchise(S, k).ok && !p.fr[k].on) Sim.setFranchise(S, k, true, 0.04);
    if (Sim.ipoCheck(S).ok) Sim.ipo(S);
    run(S, 1);
  }
  finite(S);
  const own = S.stores.filter(s => s.owner === 0);
  const m = p.months[p.months.length - 1];
  console.log('[봇] 900일 뒤 매장', own.length, '(가맹', own.filter(s => s.franchise).length + ')', '현금', Sim.won(p.cash), '부채', Sim.won(p.debt),
    '가치', Sim.won(p.value), '상장', p.listed, '최근 월 순이익', Sim.won(m.ni), '평균 평점', (own.reduce((a, s) => a + s.rating, 0) / own.length).toFixed(2));
  console.log('[봇] 목표', Object.keys(S.quests).join(', '));
  assert(own.length >= 6, '봇이 매장을 늘릴 수 있어야 함');
  const S2 = Sim.deserialize(Sim.serialize(S)); run(S2, 2); finite(S2);
}

// 4) 인수 합병
{
  const S = Sim.newGame({ seed: 3 });
  const p = S.companies[0]; p.cash = 1e13;
  const t = S.companies[1];
  while ((p.holdings[1] || 0) <= t.shares * 0.5) { const r = Sim.buyStake(S, 1, 0.05); assert(r.ok, r.msg); }
  const before = S.stores.filter(s => s.owner === 1).length;
  assert(Sim.acquire(S, 1).ok);
  assert(t.dead && S.stores.filter(s => s.owner === 1).length === 0 && before > 0);
  run(S, 40); finite(S);
  console.log('[인수] 경쟁사 매장', before, '곳 인수 완료');
}
// 5) 땅값 현실성·본사·임대 빌딩·배달
{
  const S = Sim.newGame({ seed: 21 });
  const hs = Sim.hoodStats(S);
  const by = n => hs.find(h => h.name === n).rent;
  console.log('[땅값] 라일락중심가', Math.round(by('라일락중심가')), '수국언덕', Math.round(by('수국언덕')), '고양이언덕', Math.round(by('고양이언덕')));
  assert(by('라일락중심가') > by('수국언덕') && by('수국언덕') > by('고양이언덕') && by('고양이언덕') < by('느티나무길'), '임대료 순서');
  const land = S.tiles.filter(t => t.t === 'land' && t.h === 9);
  const near = land.filter(t => Math.abs(t.x - 41) + Math.abs(t.y - 51) <= 3), far = land.filter(t => Math.abs(t.x - 41) + Math.abs(t.y - 51) >= 8);
  const avg = a => a.reduce((x, t) => x + t.rent, 0) / a.length;
  assert(avg(near) > avg(far), '역 근처가 더 비쌈');
  const p = S.companies[0]; p.cash = 1e11;
  assert(!Sim.canFranchise(S, 'cafe').hq, '본사 없으면 가맹 불가');
  const lot = S.tiles.find(t => Sim.isLot(t) && Sim.findFit(S, t.x, t.y, 2, 2));
  assert(Sim.buildFacility(S, 0, lot.x, lot.y, 'hq').ok && p.hq);
  for (const c of S.hqCands.slice(0, 4)) Sim.hqHire(S, c.id);
  const d = p.hq.staff[0].dept;
  assert(Sim.deptPower(S, p, d) > 0, '부서 힘');
  const lot2 = S.tiles.find(t => Sim.isLot(t) && t !== lot && Sim.findFit(S, t.x, t.y, 2, 2) && Math.abs(t.x - lot.x) + Math.abs(t.y - lot.y) > 4);
  const r = Sim.buildFacility(S, 0, lot2.x, lot2.y, 'rental'); assert(r.ok);
  const spot = Sim.bestLot(S, 'chicken', 0, 1);
  const st = Sim.openStore(S, 0, spot.x, spot.y, 'chicken', { size: 1 }).store;
  assert(st.delivery, '치킨은 배달 기본');
  run(S, 31);
  finite(S);
  const m = p.months[p.months.length - 1];
  console.log('[본사] 부서', d, '힘', Sim.deptPower(S, p, d).toFixed(2), '본사 인건비', Sim.won(m.hq), '임대 수입', Sim.won(m.biz), '배달 수수료', Sim.won(m.dlv));
  assert(m.biz > 0 && m.hq > 0 && m.dlv > 0);
  // 젠트리피케이션: 화제성이 높으면 소득↑ 노후도↓
  const h = S.hoods[3]; h.hype = 90; const inc0 = h.income, age0 = h.age;
  run(S, 62);
  console.log('[젠트리] 고양이언덕 소득', inc0, '→', Math.round(h.income), '노후도', age0, '→', h.age.toFixed(2), '떠난 주민', Math.round(h.displaced));
  assert(h.income > inc0 && h.age < age0);
}

// ---------- 가구 배치 ----------
{
  const S = Sim.newGame({ seed: 77, competitors: 0 });
  S.companies[0].cash = 5e8;
  let st = null;
  for (const t of S.tiles) { if (st) break; if (t.t !== 'land' || t.b || t.ref != null) continue; const r = Sim.openStore(S, 0, t.x, t.y, 'cafe', { size: 2 }); if (r.ok) st = r.store; }
  for (const cat of Sim.CAT_KEYS) for (const sz of [1, 2, 3]) { const L = Sim.defaultFurn(cat, sz); assert(L.filter(f => f.k === 'counter').length === 1, '기본 배치에 계산대 ' + cat + sz); assert(L.every(f => Sim.furnFits({ size: sz, furn: L }, f, f)), '기본 배치가 칸 안에 ' + cat + sz); }
  const cap0 = Sim.seatCapOf(st);
  Sim.ensureFurn(st);
  const fx = Sim.furnFx(st);
  assert(Math.abs(fx.seatF - 1) < 1e-9 && Math.abs(fx.kitF - 1) < 1e-9 && Math.abs(Sim.furnAppeal(st, 'res') - 1) < 0.03, '기본 배치는 효과 중립');
  assert(Math.abs(Sim.seatCapOf(st) - cap0) < 1e-6, '기본 배치 좌석 그대로');
  assert(!Sim.placeFurn(S, st.id, 'stove2', 4, 2).ok, '화구는 홀에 못 놓음');
  assert(!Sim.placeFurn(S, st.id, 'table2', 7, 5).ok, '입구는 비워야 함');
  const k0 = Sim.hourParts(st, 12).kitchen;
  assert(Sim.placeFurn(S, st.id, 'sofa', 3, 4).ok, '소파 놓기');
  assert(Sim.placeFurn(S, st.id, 'espresso', 0, 3).ok, '머신 추가');
  assert(Sim.seatCapOf(st) > cap0 && Sim.hourParts(st, 12).kitchen > k0, '좌석·주방 속도 증가');
  assert(Sim.furnAppeal(st, 'uni') > 1, '소파는 대학생 매력');
  assert(!Sim.removeFurn(S, st.id, 1, 1).ok, '계산대 하나는 남겨야 함');
  const S2 = Sim.deserialize(Sim.serialize(S));
  assert(S2.stores.find(s => s.id === st.id).furn.length === st.furn.length, '가구 저장');
  console.log('[가구] 좌석', fx.sum.seats, '→', Sim.furnFx(st).sum.seats, '수용', cap0.toFixed(1), '→', Sim.seatCapOf(st).toFixed(1), '주방', k0.toFixed(1), '→', Sim.hourParts(st, 12).kitchen.toFixed(1));
  // 새 도시: 바다와 모래사장
  assert(S.tiles.some(t => t.sea) && S.tiles.some(t => t.b && t.b.beach), '바다와 해변');
  assert(S.tiles.filter(t => t.b && Sim.BTYPES[t.b.k] && t.b.lv > 9).length === 0, '높은 건물 없이 낮은 동네');
  // 곡선 원본층: 바다·모래 칸은 해안 곡선에서 칠한 결과, 산책로·광장은 보행 전용
  assert(S.world && S.world.mapVersion === Sim.MAP_VERSION, '곡선 원본층');
  assert(S.tiles.every(t => !!t.sea === (t.y >= Sim.coastY(t.x))), '바다 칸 = 해안 곡선 아래');
  assert(S.world.prom.length >= 1 && S.world.prom.every(sg => sg.length > 3), '산책로 곡선');
  assert(S.world.prom.every(sg => sg.every(([x, y]) => Math.abs(y - (Sim.coastY(x) - Sim.BEACH_W - 0.25)) < 1e-2)), '산책로는 모래사장 안쪽 가장자리를 따라감');
  assert(S.tiles.some(t => t.plaza) && S.tiles.filter(t => t.plaza).every(t => t.road === 'walk'), '광장은 보행 전용');
  assert(Sim.roadComponents(S) === 1, '산책로를 넣어도 길은 하나로 이어짐');
  console.log('[지형] 산책로', S.world.prom.map(sg => sg.length).join('+'), '점, 소품', S.world.promProps.length, '개, 보행 전용 칸', S.tiles.filter(t => t.road === 'walk').length);
}
console.log('모든 시뮬레이션 점검 통과');
