// 모락모락 타운 시뮬레이션 점검: node games/morak-town/test/sim.test.cjs
const assert = require('assert');
const Sim = require('../js/sim.js');

function finite(S) {
  for (const c of S.companies) for (const k of ['cash', 'debt', 'price', 'value']) assert(Number.isFinite(c[k]), `${c.name}.${k}=${c[k]}`);
  for (const st of S.stores) for (const k of ['dem', 'served', 'profit', 'rating', 'price']) assert(Number.isFinite(st[k]), `store.${k}=${st[k]}`);
}

// 1) 아무것도 안 하는 플레이어: 경쟁사만 성장, 숫자가 깨지지 않아야 함
{
  const S = Sim.newGame({ seed: 7 });
  assert.equal(S.stores.filter(s => s.owner !== 0).length, 9, '경쟁사 초기 매장 9곳');
  for (let i = 0; i < 720; i++) Sim.step(S);
  finite(S);
  const ai = S.companies.filter(c => c.ai).map(c => S.stores.filter(s => s.owner === c.id).length);
  console.log('[대기] 2년 뒤 경쟁사 매장 수', ai.join('/'), '인구', Sim.population(S));
  assert(ai.every(n => n <= 36), '경쟁사 매장 상한');
  assert(!S.gameOver);
}

// 2) 간단한 봇 플레이어: 확장 → 물류 → 가맹 → 상장
{
  const S = Sim.newGame({ seed: 11 });
  const p = S.companies[0];
  let firstProfit = null;
  for (let d = 0; d < 1080; d++) {
    if (d % 10 === 0) {
      const cat = ['cafe', 'dessert', 'bakery'][Math.floor(d / 10) % 3];
      const spot = Sim.bestLot(S, cat, 0, 5);
      if (spot && p.cash > Sim.storeCost(S, cat, spot.x, spot.y) + 15e6) Sim.openStore(S, 0, spot.x, spot.y, cat);
    }
    if (d === 120) {
      const lot = S.tiles.find(t => Sim.isLot(t) && t.d === 'off');
      Sim.buildFacility(S, 0, lot.x, lot.y, 'warehouse');
    }
    if (d % 60 === 0) for (const k of ['cafe', 'dessert', 'bakery']) { if (Sim.canFranchise(S, k).ok) Sim.setFranchise(S, k, true, 0.06); Sim.research(S, 0, k); }
    if (Sim.ipoCheck(S).ok) Sim.ipo(S);
    Sim.step(S);
    if (d === 60) firstProfit = p.months[p.months.length - 1];
  }
  finite(S);
  const own = S.stores.filter(s => s.owner === 0);
  const m = p.months[p.months.length - 1];
  console.log('[봇] 3년 뒤 매장', own.length, '(가맹', own.filter(s => s.franchise).length + ')',
    '현금', Sim.won(p.cash), '부채', Sim.won(p.debt), '가치', Sim.won(p.value), '상장', p.listed, '최근 월 순이익', Sim.won(m.ni));
  console.log('[봇] 2개월차 순이익', Sim.won(firstProfit.ni), '평균 평점', (own.reduce((a, s) => a + s.rating, 0) / own.length).toFixed(2));
  console.log('[봇] 목표', Object.keys(S.quests).join(', '));
  assert(own.length >= 8, '봇이 매장을 늘릴 수 있어야 함');
  assert(m.ni > 0, '확장한 회사는 흑자여야 함');
  // 저장/불러오기
  const S2 = Sim.deserialize(Sim.serialize(S));
  Sim.step(S2); finite(S2);
}

// 3) 인수 합병
{
  const S = Sim.newGame({ seed: 3 });
  const p = S.companies[0]; p.cash = 1e12;
  const t = S.companies[1];
  while ((p.holdings[1] || 0) <= t.shares * 0.5) { const r = Sim.buyStake(S, 1, 0.05); assert(r.ok, r.msg); }
  const before = S.stores.filter(s => s.owner === 1).length;
  const r = Sim.acquire(S, 1); assert(r.ok, r.msg);
  assert(t.dead && S.stores.filter(s => s.owner === 1).length === 0 && before > 0);
  for (let i = 0; i < 60; i++) Sim.step(S);
  finite(S);
  console.log('[인수] 경쟁사 매장', before, '곳 인수 완료');
}
console.log('모든 시뮬레이션 점검 통과');
