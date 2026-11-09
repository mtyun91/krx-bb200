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
  assert.equal(S.stores.length, 12, '경쟁사 초기 매장 12곳');
  assert(S.stores.every(s => s.staff.length >= 1), '모든 매장에 직원');
  run(S, 730);
  finite(S);
  const ai = S.companies.filter(c => c.ai).map(c => S.stores.filter(s => s.owner === c.id).length);
  console.log('[대기] 2년 뒤 경쟁사 매장', ai.join('/'), '인구', Sim.population(S), '최저시급', S.minWage);
  assert(ai.every(n => n <= 32));
  assert(S.minWage > 10600, '최저시급 인상 반영');
}

// 2) 직원 능력치가 실제로 영향을 주는지
{
  const S = Sim.newGame({ seed: 9 });
  S.companies[0].cash = 1e10;
  const spot = Sim.bestLot(S, 'cafe', 0, 1);
  const st = Sim.openStore(S, 0, spot.x, spot.y, 'cafe', { size: 2, style: 'wood', tier: 2 }).store;
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
      if (spot) { const c = Sim.openCost(S, cat, spot.x, spot.y, 2, 'nordic', 2); if (p.cash < c.total + 3e7 && p.debt + 1e8 <= Sim.loanLimit(S, p) && own0(S)) Sim.borrow(S); if (p.cash > c.total + 3e7) Sim.openStore(S, 0, spot.x, spot.y, cat, { size: 2, style: 'nordic', tier: 2 }); }
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
  console.log('[땅값] 중앙동', Math.round(by('중앙동')), '호수공원동', Math.round(by('호수공원동')), '풍차언덕', Math.round(by('풍차언덕')));
  assert(by('중앙동') > by('호수공원동') && by('호수공원동') > by('풍차언덕') && by('물레방아동') < by('서재골'), '임대료 순서');
  const near = Sim.tile(S, 15, 15).rent, far = Sim.tile(S, 18, 18).rent;
  assert(near > far, '역·랜드마크 근처가 더 비쌈');
  const p = S.companies[0]; p.cash = 1e11;
  assert(!Sim.canFranchise(S, 'cafe').hq, '본사 없으면 가맹 불가');
  const lot = S.tiles.find(t => Sim.isLot(t) && t.h === 4);
  assert(Sim.buildFacility(S, 0, lot.x, lot.y, 'hq').ok && p.hq);
  for (const c of S.hqCands.slice(0, 4)) Sim.hqHire(S, c.id);
  const d = p.hq.staff[0].dept;
  assert(Sim.deptPower(S, p, d) > 0, '부서 힘');
  const lot2 = S.tiles.find(t => Sim.isLot(t) && t.h === 8);
  const r = Sim.buildFacility(S, 0, lot2.x, lot2.y, 'rental'); assert(r.ok);
  const spot = Sim.bestLot(S, 'chicken', 0, 1);
  const st = Sim.openStore(S, 0, spot.x, spot.y, 'chicken', {}).store;
  assert(st.delivery, '치킨은 배달 기본');
  run(S, 31);
  finite(S);
  const m = p.months[p.months.length - 1];
  console.log('[본사] 부서', d, '힘', Sim.deptPower(S, p, d).toFixed(2), '본사 인건비', Sim.won(m.hq), '임대 수입', Sim.won(m.biz), '배달 수수료', Sim.won(m.dlv));
  assert(m.biz > 0 && m.hq > 0 && m.dlv > 0);
  // 젠트리피케이션: 화제성이 높으면 소득↑ 노후도↓
  const h = S.hoods[2]; h.hype = 90; const inc0 = h.income, age0 = h.age;
  run(S, 62);
  console.log('[젠트리] 풍차언덕 소득', inc0, '→', Math.round(h.income), '노후도', age0, '→', h.age.toFixed(2), '떠난 주민', Math.round(h.displaced));
  assert(h.income > inc0 && h.age < age0);
}
console.log('모든 시뮬레이션 점검 통과');
