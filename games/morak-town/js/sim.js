/* 모락모락 타운 — 시뮬레이션 코어 (브라우저/Node 공용, DOM 없음) */
(function (root) {
  'use strict';

  const W = 33, H = 33, ROAD_EVERY = 4, REACH = 6;
  const WAGE = 80000, CAP_PER_STAFF = 70, OUTSIDE = 1.2;
  const MKT = [0, 30000, 80000, 200000];
  const DAYS_PER_MONTH = 30;

  const CATS = {
    cafe:    { name: '카페',     icon: '☕', price: 4500, build: 20e6, recipe: { bean: 0.9, milk: 0.6 }, food: false, cap: 1 },
    bakery:  { name: '베이커리', icon: '🥐', price: 4200, build: 24e6, recipe: { flour: 2, milk: 0.8 }, food: true, cap: 1.1 },
    noodle:  { name: '국수집',   icon: '🍜', price: 8000, build: 22e6, recipe: { flour: 1.5, veg: 1, meat: 0.6 }, food: true, cap: 0.65 },
    burger:  { name: '버거',     icon: '🍔', price: 9000, build: 30e6, recipe: { meat: 1, flour: 1, veg: 1 }, food: true, cap: 0.7 },
    dessert: { name: '디저트',   icon: '🍰', price: 6000, build: 18e6, recipe: { milk: 2, flour: 1 }, food: true, cap: 0.9 },
  };
  const CAT_KEYS = Object.keys(CATS);

  const INGR = {
    bean:  { name: '원두',   base: 1000, unit: 'kg당 1/10' },
    flour: { name: '밀가루', base: 300 },
    milk:  { name: '우유',   base: 500 },
    meat:  { name: '고기',   base: 2000 },
    veg:   { name: '채소',   base: 500 },
  };

  const SEG = {
    res:  { name: '주민',   sens: 1.0, pop: 45 },
    off:  { name: '직장인', sens: 0.6, pop: 65 },
    uni:  { name: '대학생', sens: 1.6, pop: 80 },
    tour: { name: '관광객', sens: 0.5, pop: 55 },
  };
  const APPETITE = {
    cafe:    { res: 0.10, off: 0.35, uni: 0.30, tour: 0.25 },
    bakery:  { res: 0.26, off: 0.18, uni: 0.14, tour: 0.20 },
    noodle:  { res: 0.10, off: 0.20, uni: 0.18, tour: 0.12 },
    burger:  { res: 0.08, off: 0.10, uni: 0.22, tour: 0.15 },
    dessert: { res: 0.09, off: 0.09, uni: 0.16, tour: 0.32 },
  };
  // 월(0=1월)별 계절 수요 배율
  const SEASON = {
    cafe:    [0.95, 0.95, 1, 1, 1.05, 1.1, 1.15, 1.15, 1.05, 1, 1, 0.95],
    bakery:  [1, 1, 1, 1, 1, 0.95, 0.95, 0.95, 1, 1.05, 1.05, 1.15],
    noodle:  [1.25, 1.2, 1.05, 0.95, 0.9, 0.85, 0.85, 0.85, 0.95, 1.05, 1.15, 1.25],
    burger:  [0.95, 0.95, 1, 1, 1.05, 1.05, 1.1, 1.1, 1, 1, 0.95, 1],
    dessert: [0.85, 0.9, 1, 1.05, 1.15, 1.25, 1.3, 1.25, 1.05, 0.95, 0.9, 1.15],
  };

  const DISTRICTS = {
    off:  { name: '중앙 업무지구',   land: 60000 },
    uni:  { name: '은행나무 대학가', land: 32000 },
    res:  { name: '햇살 주택가',     land: 28000 },
    tour: { name: '호수 공원',       land: 42000 },
  };

  const FAC = {
    warehouse: { name: '물류창고', icon: '📦', cost: 40e6, upkeep: 250000, range: 8, cap: 8, desc: '반경 8칸 매장에 식자재를 모아 배송. 원가 -15%' },
    kitchen:   { name: '중앙주방', icon: '🍳', cost: 60e6, upkeep: 450000, range: 8, cap: 6, desc: '반경 8칸 음식 매장 원가 -21%, 품질 +10%' },
    roastery:  { name: '로스터리', icon: '🫘', cost: 55e6, upkeep: 400000, desc: '회사 전체 카페 원두값 -35%, 품질 +8% (1곳만)' },
  };
  const PUBLIC = {
    park: { name: '공원',       icon: '🌳', cost: 8e6, desc: '관광객이 찾아오고 주변 매장 매력 +10%, 주변 개발 촉진' },
    bus:  { name: '버스정류장', icon: '🚏', cost: 5e6, desc: '출퇴근 인구 유입, 주변 건물 성장 촉진' },
  };

  const AI_PROFILES = [
    { name: '구름커피',       color: '#7fa7d6', focus: ['cafe', 'dessert'], pricing: 1.0, aggr: 1.0 },
    { name: '보리밭베이커리', color: '#e3a07f', focus: ['bakery', 'cafe'],  pricing: 0.95, aggr: 0.85 },
    { name: '한그릇푸드',     color: '#86b98f', focus: ['noodle', 'burger'], pricing: 1.05, aggr: 1.1 },
  ];
  const PLAYER_COLOR = '#f2b950';

  // ---------- 난수 ----------
  function rnd(S) {
    S.rng = (S.rng + 0x6D2B79F5) | 0;
    let t = S.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function gauss(S) {
    const u = Math.max(1e-9, rnd(S)), v = rnd(S);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  // ---------- 지도 ----------
  function tile(S, x, y) { return (x < 0 || y < 0 || x >= W || y >= H) ? null : S.tiles[y * W + x]; }
  function isLot(t) { return t && t.t === 'land' && !t.b; }

  function districtOf(x, y) {
    const c = (W - 1) / 2;
    if (Math.max(Math.abs(x - c), Math.abs(y - c)) <= 6) return 'off';
    if (x < c && y < c) return 'uni';
    if (x >= c && y >= c) return 'tour';
    return 'res';
  }

  function buildMap(S) {
    S.tiles = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const road = x % ROAD_EVERY === 0 || y % ROAD_EVERY === 0;
      const t = { x, y, t: road ? 'road' : 'land', d: districtOf(x, y), b: null, tree: false, lv: 0 };
      const lx = x - 27.5, ly = y - 27.5;
      if (!road && lx * lx + ly * ly < 11) t.t = 'water';
      S.tiles.push(t);
    }
    for (const t of S.tiles) {
      if (t.t !== 'land') continue;
      const dev = { off: 0.55, uni: 0.38, res: 0.42, tour: 0.3 }[t.d];
      const r = rnd(S);
      if (r < dev) {
        t.b = { k: t.d, lv: t.d === 'off' ? 1 + Math.floor(rnd(S) * 3) : 1 + Math.floor(rnd(S) * 2) };
      } else if (r < dev + 0.18) t.tree = true;
    }
    // 시작 공원 하나
    const p = tile(S, 26, 25);
    if (p && p.t === 'land') { p.b = { k: 'park', lv: 1 }; p.tree = false; }
  }

  function computeLand(S) {
    const parks = S.tiles.filter(t => t.b && t.b.k === 'park');
    for (const t of S.tiles) {
      if (t.t !== 'land') { t.lv = 0; continue; }
      let v = DISTRICTS[t.d].land;
      let dens = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const n = tile(S, t.x + dx, t.y + dy);
        if (n && n.b && SEG[n.b.k]) dens += n.b.lv;
      }
      v += dens * 900;
      for (const p of parks) if (dist(p, t) <= 3) v *= 1.08;
      t.lv = Math.round(v / 1000) * 1000;
    }
  }

  function sources(S) {
    const out = [];
    for (const t of S.tiles) {
      if (!t.b) continue;
      const k = t.b.k;
      if (SEG[k]) out.push({ x: t.x, y: t.y, seg: k, pop: SEG[k].pop * t.b.lv, d: t.d });
      else if (k === 'park') out.push({ x: t.x, y: t.y, seg: 'tour', pop: 50, d: t.d });
      else if (k === 'bus') out.push({ x: t.x, y: t.y, seg: 'off', pop: 120, d: t.d });
    }
    return out;
  }

  function population(S) { return sources(S).reduce((a, s) => a + s.pop, 0); }

  // ---------- 새 게임 ----------
  function newGame(opts) {
    opts = opts || {};
    const S = {
      v: 1, rng: (opts.seed || 20261109) | 0, day: 0, startMonth: 2,
      tiles: [], stores: [], facs: [], companies: [], news: [], nextId: 1,
      ingr: {}, trends: {}, festival: null, econ: { mult: 1, until: 0 },
      founder: { cash: 0 }, quests: {}, distress: 0, gameOver: false, autoStaff: true,
      stats: { pop: [] },
    };
    buildMap(S);
    computeLand(S);
    for (const k in INGR) S.ingr[k] = { p: INGR[k].base, hist: [INGR[k].base] };

    S.companies.push(makeCompany(S, 0, opts.name || '모락상회', PLAYER_COLOR, true));
    AI_PROFILES.forEach((p, i) => {
      const c = makeCompany(S, i + 1, p.name, p.color, false);
      c.ai = { focus: p.focus, pricing: p.pricing, aggr: p.aggr };
      c.cash = 160e6;
      c.listed = true;
      c.founderShares = 400000;
      for (const cat of p.focus) c.brand[cat] = 12 + rnd(S) * 8;
      S.companies.push(c);
    });
    // 경쟁사 초기 매장
    for (const c of S.companies) {
      if (!c.ai) continue;
      for (let i = 0; i < 3; i++) {
        const cat = c.ai.focus[i % c.ai.focus.length];
        const spot = bestLot(S, cat, c.id, 50);
        if (spot) openStore(S, c.id, spot.x, spot.y, cat, { free: true });
      }
    }
    assignSupply(S);
    for (const c of S.companies) { c.value = valuation(S, c); c.price = c.value / c.shares; c.priceHist = [c.price]; }
    log(S, '🌱 모락모락 타운에 오신 것을 환영합니다. 첫 가게 자리를 골라보세요.', 'info');
    return S;
  }

  function makeCompany(S, id, name, color, isPlayer) {
    const brand = {}, recipe = {}, fr = {};
    for (const k of CAT_KEYS) { brand[k] = 0; recipe[k] = 1; fr[k] = { on: false, royalty: 0.06 }; }
    return {
      id, name, color, isPlayer, cash: isPlayer ? 50e6 : 0, debt: 0,
      shares: 1e6, founderShares: isPlayer ? 1e6 : 0, listed: false,
      price: 0, priceHist: [], value: 0, brand, recipe, fr,
      roastery: false, farm: false, dividend: 0, holdings: {},
      cur: blankLedger(), months: [], dailyNI: [], storeHist: [],
      dead: false, ai: null,
    };
  }
  function blankLedger() { return { rev: 0, cogs: 0, wage: 0, rent: 0, mkt: 0, upkeep: 0, interest: 0, royalty: 0, other: 0, capex: 0, served: 0 }; }

  function log(S, text, kind) {
    S.news.unshift({ day: S.day, text, kind: kind || 'info' });
    if (S.news.length > 80) S.news.length = 80;
  }

  // ---------- 날짜 ----------
  function dateOf(S, day) {
    day = day == null ? S.day : day;
    const m = Math.floor(day / DAYS_PER_MONTH) + S.startMonth;
    return { year: 1 + Math.floor(m / 12), month: (m % 12) + 1, day: (day % DAYS_PER_MONTH) + 1, mi: m % 12 };
  }
  function seasonOf(S) { const mi = dateOf(S).mi; return mi >= 2 && mi <= 4 ? 'spring' : mi >= 5 && mi <= 7 ? 'summer' : mi >= 8 && mi <= 10 ? 'autumn' : 'winter'; }

  // ---------- 비용·품질 ----------
  function storeCost(S, cat, x, y) {
    const t = tile(S, x, y);
    return Math.round(CATS[cat].build * (0.85 + (t ? t.lv : 30000) / 120000) / 1e5) * 1e5;
  }
  function propertyPrice(S, st) { const t = tile(S, st.x, st.y); return Math.round(t.lv * 365 * 6 / 1e5) * 1e5; }
  function rentOf(S, st) { if (st.owned) return 0; const t = tile(S, st.x, st.y); return t.lv * (1 + 0.15 * (st.level - 1)); }
  function upgradeCost(st) { return Math.round(CATS[st.cat].build * 0.7 * st.level / 1e5) * 1e5; }
  function staffCap(st) { return CAP_PER_STAFF * CATS[st.cat].cap * (1 + 0.25 * (st.level - 1)); }
  function capacity(st) { return st.staff * staffCap(st); }
  function maxStaff(st) { return 3 + 2 * st.level; }
  function researchCost(c, cat) { return Math.round(10e6 * Math.pow(c.recipe[cat], 1.6) / 1e5) * 1e5; }
  const CAMPAIGN_COST = 30e6;

  function unitCost(S, comp, st) {
    const rec = CATS[st.cat].recipe;
    let u = 0;
    for (const k in rec) {
      let p = S.ingr[k].p;
      if (k === 'bean' && comp.roastery) p *= 0.65;
      if ((k === 'meat' || k === 'veg') && comp.farm) p *= 0.85;
      u += rec[k] * p;
    }
    const mode = st.supply;
    const m = mode === 'kitchen' ? (CATS[st.cat].food ? 0.88 : 0.95) : mode === 'warehouse' ? 0.95 : 1.12;
    return u * m;
  }

  function quality(S, st) {
    const comp = S.companies[st.owner];
    let q = 1 + 0.1 * (comp.recipe[st.cat] - 1);
    q *= 1 + 0.08 * (st.level - 1);
    if (st.supply === 'kitchen' && CATS[st.cat].food) q *= 1.1;
    if (st.cat === 'cafe' && comp.roastery) q *= 1.08;
    return q;
  }

  function attraction(S, st, segSens, d, parkBonus) {
    const comp = S.companies[st.owner];
    const base = CATS[st.cat].price;
    const pf = Math.exp(-segSens * 1.8 * (st.price / base - 1));
    const rf = 0.55 + 0.15 * st.rating;
    return quality(S, st) * (1 + comp.brand[st.cat] / 110) * clamp(pf, 0.05, 3) * rf * (1 + 0.08 * st.mkt) * (parkBonus || 1) / (1 + 0.5 * d);
  }

  function parkBonusMap(S) {
    const parks = S.tiles.filter(t => t.b && t.b.k === 'park');
    const m = new Map();
    for (const st of S.stores) {
      let b = 1;
      for (const p of parks) if (dist(p, st) <= 2) { b = 1.1; break; }
      m.set(st.id, b);
    }
    return m;
  }

  function demandMult(S, cat, src) {
    const mi = dateOf(S).mi;
    let m = SEASON[cat][mi] * S.econ.mult;
    const tr = S.trends[cat];
    if (tr && tr.until > S.day) m *= tr.mult;
    if (S.festival && S.festival.until > S.day && S.festival.d === src.d) m *= 1.4;
    return m;
  }

  // ---------- 매장/시설 ----------
  function openStore(S, compId, x, y, cat, opt) {
    opt = opt || {};
    const t = tile(S, x, y);
    if (!isLot(t)) return { ok: false, msg: '빈 땅에만 지을 수 있어요.' };
    const comp = S.companies[compId];
    const cost = storeCost(S, cat, x, y);
    if (!opt.free && !opt.franchise) {
      if (comp.cash < cost) return { ok: false, msg: '자금이 부족해요.' };
      comp.cash -= cost; comp.cur.capex += cost;
    }
    const st = {
      id: S.nextId++, x, y, cat, owner: compId, franchise: !!opt.franchise,
      level: 1, staff: 2, auto: true, price: Math.round(CATS[cat].price * (comp.ai ? comp.ai.pricing : 1) / 100) * 100,
      mkt: comp.ai ? 1 : 0, owned: false, invest: cost, opened: S.day,
      dem: 0, demAvg: 60, served: 0, rev: 0, profit: 0, profitAvg: 0, lossDays: 0, rating: 3, lost: 0,
      m: { rev: 0, profit: 0, cust: 0 }, lm: null, supply: 'direct', propValue: 0,
    };
    S.stores.push(st);
    t.b = { k: 'store', id: st.id }; t.tree = false;
    assignSupply(S);
    return { ok: true, store: st, cost };
  }

  function closeStore(S, id, silent) {
    const i = S.stores.findIndex(s => s.id === id);
    if (i < 0) return { ok: false };
    const st = S.stores[i];
    const comp = S.companies[st.owner];
    let refund = 0;
    if (!st.franchise) {
      refund = st.invest * 0.25 + (st.owned ? st.propValue * 0.9 : 0);
      comp.cash += refund; comp.cur.other += refund;
    }
    S.stores.splice(i, 1);
    const t = tile(S, st.x, st.y); t.b = null;
    assignSupply(S);
    if (!silent && comp.isPlayer) log(S, `${CATS[st.cat].icon} 매장을 정리했어요. 회수 ${won(refund)}`, 'info');
    return { ok: true, refund };
  }

  function buildFacility(S, compId, x, y, kind) {
    const t = tile(S, x, y);
    const comp = S.companies[compId];
    const f = FAC[kind];
    if (!isLot(t)) return { ok: false, msg: '빈 땅에만 지을 수 있어요.' };
    if (kind === 'roastery' && comp.roastery) return { ok: false, msg: '로스터리는 한 곳이면 충분해요.' };
    if (comp.cash < f.cost) return { ok: false, msg: '자금이 부족해요.' };
    comp.cash -= f.cost; comp.cur.capex += f.cost;
    const fac = { id: S.nextId++, x, y, kind, owner: compId, level: 1, invest: f.cost };
    S.facs.push(fac);
    t.b = { k: 'fac', id: fac.id }; t.tree = false;
    if (kind === 'roastery') comp.roastery = true;
    assignSupply(S);
    return { ok: true, fac };
  }

  function upgradeFacility(S, id) {
    const f = S.facs.find(x => x.id === id); if (!f) return { ok: false };
    const comp = S.companies[f.owner];
    if (f.level >= 3 || f.kind === 'roastery') return { ok: false, msg: '더 이상 확장할 수 없어요.' };
    const cost = FAC[f.kind].cost * 0.6 * f.level;
    if (comp.cash < cost) return { ok: false, msg: '자금이 부족해요.' };
    comp.cash -= cost; comp.cur.capex += cost; f.invest += cost; f.level++;
    assignSupply(S);
    return { ok: true };
  }

  function removeFacility(S, id) {
    const i = S.facs.findIndex(x => x.id === id); if (i < 0) return { ok: false };
    const f = S.facs[i]; const comp = S.companies[f.owner];
    comp.cash += f.invest * 0.3; comp.cur.other += f.invest * 0.3;
    if (f.kind === 'roastery') comp.roastery = false;
    S.facs.splice(i, 1); tile(S, f.x, f.y).b = null;
    assignSupply(S);
    return { ok: true };
  }

  function buildPublic(S, x, y, kind) {
    const t = tile(S, x, y); const comp = S.companies[0];
    if (!isLot(t)) return { ok: false, msg: '빈 땅에만 지을 수 있어요.' };
    const cost = PUBLIC[kind].cost;
    if (comp.cash < cost) return { ok: false, msg: '자금이 부족해요.' };
    comp.cash -= cost; comp.cur.other -= cost;
    t.b = { k: kind, lv: 1 }; t.tree = false;
    computeLand(S);
    log(S, `${PUBLIC[kind].icon} 시에 ${PUBLIC[kind].name}을 기부했어요. 동네가 조금 더 활기차질 거예요.`, 'good');
    return { ok: true };
  }

  function facRange(f) { return FAC[f.kind].range || 0; }
  function facCap(f) { return (FAC[f.kind].cap || 0) * f.level; }

  function assignSupply(S) {
    for (const st of S.stores) st.supply = 'direct';
    for (const c of S.companies) {
      if (c.dead) continue;
      const mine = S.stores.filter(s => s.owner === c.id);
      if (c.ai) { if (mine.length >= 5) for (const s of mine) s.supply = 'warehouse'; continue; }
      const facs = S.facs.filter(f => f.owner === c.id && FAC[f.kind].range)
        .sort((a, b) => (a.kind === 'kitchen' ? 0 : 1) - (b.kind === 'kitchen' ? 0 : 1));
      for (const f of facs) {
        const cand = mine.filter(s => s.supply === 'direct' && dist(s, f) <= facRange(f))
          .filter(s => f.kind === 'warehouse' || CATS[s.cat].food || true)
          .sort((a, b) => dist(a, f) - dist(b, f));
        cand.slice(0, facCap(f)).forEach(s => { s.supply = f.kind; s.facId = f.id; });
      }
    }
  }

  // ---------- 입지 평가 ----------
  function existingScore(S, cat, srcs, pb) {
    const list = S.stores.filter(s => s.cat === cat);
    return srcs.map(src => {
      let sum = 0; const sens = SEG[src.seg].sens;
      for (const st of list) { const d = dist(st, src); if (d <= REACH) sum += attraction(S, st, sens, d, pb.get(st.id)); }
      return sum;
    });
  }

  // 지정 회사가 그 자리에 기본 설정으로 열면 예상되는 하루 손님
  function lotPotentials(S, cat, compId) {
    const srcs = sources(S); const pb = parkBonusMap(S);
    const ex = existingScore(S, cat, srcs, pb);
    const comp = S.companies[compId];
    const fake = { cat, owner: compId, price: CATS[cat].price * (comp.ai ? comp.ai.pricing : 1), rating: 3, mkt: comp.ai ? 1 : 0, level: 1, supply: 'direct', x: 0, y: 0 };
    const parks = S.tiles.filter(t => t.b && t.b.k === 'park');
    const out = [];
    for (const t of S.tiles) {
      if (!isLot(t)) continue;
      fake.x = t.x; fake.y = t.y;
      const pbn = parks.some(p => dist(p, t) <= 2) ? 1.1 : 1;
      let cust = 0;
      srcs.forEach((src, i) => {
        const d = dist(t, src); if (d > REACH) return;
        const a = attraction(S, fake, SEG[src.seg].sens, d, pbn);
        const D = src.pop * APPETITE[cat][src.seg] * demandMult(S, cat, src);
        cust += D * a / (ex[i] + a + OUTSIDE);
      });
      out.push({ x: t.x, y: t.y, cust });
    }
    return out;
  }

  // 한 자리만 빠르게 평가 (정보 카드용)
  function lotEstimate(S, x, y, cat, compId) {
    const srcs = sources(S).filter(s => Math.abs(s.x - x) + Math.abs(s.y - y) <= REACH);
    const pb = parkBonusMap(S);
    const ex = existingScore(S, cat, srcs, pb);
    const comp = S.companies[compId];
    const fake = { cat, owner: compId, price: CATS[cat].price, rating: 3, mkt: 0, level: 1, supply: 'direct', x, y };
    const pbn = S.tiles.some(t => t.b && t.b.k === 'park' && Math.abs(t.x - x) + Math.abs(t.y - y) <= 2) ? 1.1 : 1;
    let cust = 0, rivals = 0;
    srcs.forEach((src, i) => {
      const d = Math.abs(src.x - x) + Math.abs(src.y - y);
      const a = attraction(S, fake, SEG[src.seg].sens, d, pbn);
      cust += src.pop * APPETITE[cat][src.seg] * demandMult(S, cat, src) * a / (ex[i] + a + OUTSIDE);
    });
    for (const st of S.stores) if (st.cat === cat && st.owner !== compId && Math.abs(st.x - x) + Math.abs(st.y - y) <= 4) rivals++;
    void comp;
    return { cust, rivals };
  }

  function bestLot(S, cat, compId, sample) {
    let lots = lotPotentials(S, cat, compId);
    if (!lots.length) return null;
    lots.sort((a, b) => b.cust - a.cust);
    lots = lots.slice(0, sample || 8);
    return lots[Math.floor(rnd(S) * Math.min(lots.length, 4))];
  }

  // ---------- 하루 진행 ----------
  function step(S) {
    if (S.gameOver) return { money: [], trucks: [] };
    S.day++;
    const ev = { money: [], trucks: [] };
    updateIngredients(S);

    const srcs = sources(S); const pb = parkBonusMap(S);
    for (const st of S.stores) st.dem = 0;
    for (const cat of CAT_KEYS) {
      const list = S.stores.filter(s => s.cat === cat);
      if (!list.length) continue;
      for (const src of srcs) {
        const D = src.pop * APPETITE[cat][src.seg] * demandMult(S, cat, src);
        if (D <= 0) continue;
        const sens = SEG[src.seg].sens;
        let sum = 0; const sc = [];
        for (const st of list) {
          const d = dist(st, src); if (d > REACH) continue;
          const a = attraction(S, st, sens, d, pb.get(st.id));
          sc.push([st, a]); sum += a;
        }
        if (!sc.length) continue;
        const denom = sum + OUTSIDE;
        for (const [st, a] of sc) st.dem += D * a / denom;
      }
    }

    const servedBy = S.companies.map(() => { const o = {}; for (const k of CAT_KEYS) o[k] = 0; return o; });
    for (const st of S.stores) {
      const comp = S.companies[st.owner];
      const dem = st.dem * (0.92 + rnd(S) * 0.16);
      st.demAvg = st.demAvg * 0.85 + dem * 0.15;
      if (st.auto && (comp.ai || st.franchise || S.autoStaff)) {
        const want = clamp(Math.ceil(st.demAvg * 1.05 / staffCap(st)), 1, maxStaff(st));
        if (want > st.staff) st.staff++; else if (want < st.staff && rnd(S) < 0.3) st.staff--;
      }
      const cap = capacity(st);
      const served = Math.floor(Math.min(dem, cap));
      st.lost = Math.max(0, dem - served);
      st.served = served;
      const rev = served * st.price;
      const cogs = served * unitCost(S, comp, st);
      const wage = st.staff * WAGE;
      const rent = rentOf(S, st);
      const mkt = MKT[st.mkt];
      servedBy[st.owner][st.cat] += served;
      let profit;
      if (st.franchise) {
        const fr = comp.fr[st.cat];
        const royalty = rev * fr.royalty;
        const margin = st.supply !== 'direct' ? cogs * 0.08 : 0;
        profit = rev - cogs - margin - wage - rent - mkt - royalty;
        comp.cash += royalty + margin; comp.cur.royalty += royalty + margin;
        comp.cur.served += served;
      } else {
        profit = rev - cogs - wage - rent - mkt;
        comp.cash += profit;
        const L = comp.cur; L.rev += rev; L.cogs += cogs; L.wage += wage; L.rent += rent; L.mkt += mkt; L.served += served;
      }
      st.rev = rev; st.profit = profit;
      st.profitAvg = st.profitAvg * 0.93 + profit * 0.07;
      st.lossDays = st.profitAvg < 0 ? st.lossDays + 1 : 0;
      st.m.rev += rev; st.m.profit += profit; st.m.cust += served;
      // 평점
      const value = quality(S, st) / Math.pow(st.price / CATS[st.cat].price, 1.2);
      const over = dem > 0 ? st.lost / dem : 0;
      const target = clamp(3 + 2 * (value - 1) - over * 3 - (capacity(st) < dem * 0.8 ? 0.3 : 0), 1, 5);
      st.rating = clamp(st.rating + (target - st.rating) * 0.04, 1, 5);
      if (comp.isPlayer && served > 0 && rnd(S) < 0.25) ev.money.push({ x: st.x, y: st.y, v: st.franchise ? rev * comp.fr[st.cat].royalty : profit });
      if (st.supply !== 'direct' && rnd(S) < 0.18) {
        const f = S.facs.find(ff => ff.id === st.facId);
        if (f) ev.trucks.push({ from: { x: f.x, y: f.y }, to: { x: st.x, y: st.y }, color: comp.color });
      }
    }

    // 회사 단위
    S.companies.forEach((c, i) => {
      if (c.dead) return;
      for (const cat of CAT_KEYS) {
        const mktSpend = S.stores.filter(s => s.owner === c.id && s.cat === cat).reduce((a, s) => a + MKT[s.mkt], 0);
        const gain = (servedBy[i][cat] * 0.00024 + mktSpend / 1e6 * 0.5) * (1 - c.brand[cat] / 100);
        c.brand[cat] = clamp(c.brand[cat] * 0.9985 + gain, 0, 100);
      }
      let up = 0;
      for (const f of S.facs) if (f.owner === c.id) up += FAC[f.kind].upkeep * (1 + 0.5 * (f.level - 1));
      if (c.farm) up += 3e6 / DAYS_PER_MONTH;
      if (c.ai && S.stores.some(s => s.owner === c.id && s.supply === 'warehouse')) up += 200000;
      const interest = c.debt * 0.055 / 365;
      c.cash -= up + interest; c.cur.upkeep += up; c.cur.interest += interest;
    });

    franchiseTick(S);
    playerDistress(S);

    for (const c of S.companies) {
      if (c.dead) continue;
      const L = c.cur;
      const ni = todayNI(S, c);
      c.dailyNI.push(ni); if (c.dailyNI.length > 90) c.dailyNI.shift();
      c.value = valuation(S, c);
      if (c.listed) {
        const target = Math.max(1, c.value / c.shares);
        c.price = Math.max(1, c.price * Math.exp(0.04 * Math.log(target / c.price) + gauss(S) * 0.013));
      } else c.price = c.value / c.shares;
      c.priceHist.push(c.price); if (c.priceHist.length > 360) c.priceHist.shift();
      void L;
    }

    if (S.day % DAYS_PER_MONTH === 0) monthEnd(S);
    checkQuests(S);
    return ev;
  }

  // 오늘 하루 순이익 (장부 누적 차이로 계산)
  function todayNI(S, c) {
    const L = c.cur;
    const total = L.rev + L.royalty - L.cogs - L.wage - L.rent - L.mkt - L.upkeep - L.interest;
    const prev = c._prevTotal || 0;
    c._prevTotal = total;
    return total - prev;
  }

  function updateIngredients(S) {
    for (const k in S.ingr) {
      const g = S.ingr[k];
      const base = INGR[k].base;
      g.p = g.p * Math.exp(0.03 * Math.log(base / g.p) + gauss(S) * 0.012);
      if (S.day % 3 === 0) { g.hist.push(g.p); if (g.hist.length > 120) g.hist.shift(); }
    }
  }

  function playerDistress(S) {
    const p = S.companies[0];
    if (p.cash < 0) {
      const lim = loanLimit(S, p);
      if (p.debt + 1e8 <= lim) {
        p.debt += 1e8; p.cash += 1e8;
        log(S, '🏦 잔고가 바닥나 은행에서 1억원을 긴급 대출했어요.', 'warn');
      } else {
        S.distress++;
        if (S.distress === 1) log(S, '⚠️ 자금이 마이너스예요. 45일 안에 회복하지 못하면 파산합니다.', 'bad');
        if (S.distress > 45) { S.gameOver = true; log(S, '💔 회사가 파산했어요. 새 게임에서 다시 도전해 보세요.', 'bad'); }
      }
    } else S.distress = 0;
  }

  // ---------- 가치평가 ----------
  function bookValue(S, c) {
    let v = c.cash - c.debt;
    for (const s of S.stores) if (s.owner === c.id && !s.franchise) v += s.invest * 0.6 + (s.owned ? s.propValue : 0);
    for (const f of S.facs) if (f.owner === c.id) v += f.invest * 0.6;
    for (const id in c.holdings) { const t = S.companies[id]; if (t && !t.dead) v += c.holdings[id] * t.price; }
    return v;
  }
  function valuation(S, c) {
    const book = bookValue(S, c);
    const n = c.dailyNI.length;
    const annual = n ? c.dailyNI.reduce((a, b) => a + b, 0) / n * 365 : 0;
    const cnt = S.stores.filter(s => s.owner === c.id).length;
    const past = c.storeHist.length >= 6 ? c.storeHist[c.storeHist.length - 6] : (c.storeHist[0] || cnt);
    const growth = (cnt - past) / Math.max(3, past);
    const avgBrand = CAT_KEYS.reduce((a, k) => a + c.brand[k], 0) / CAT_KEYS.length;
    const per = 9 + clamp(growth * 10, -3, 8) + avgBrand / 12 + (c.dividend > 0 ? 1.5 : 0) + (S.econ.mult - 1) * 20;
    const royaltyBoost = c.isPlayer ? 1 : 1;
    const v = book + annual * per * royaltyBoost;
    return Math.max(book * 0.6, v, 5e6);
  }
  function marketCap(c) { return c.price * c.shares; }
  function loanLimit(S, c) { return Math.max(2e8, Math.floor(c.value * 0.4 / 1e8) * 1e8); }

  // ---------- 월말 ----------
  function monthEnd(S) {
    for (const c of S.companies) {
      if (c.dead) continue;
      const L = c.cur;
      const ni = L.rev + L.royalty - L.cogs - L.wage - L.rent - L.mkt - L.upkeep - L.interest;
      const rec = Object.assign({}, L, { ni, cash: c.cash, value: c.value, stores: S.stores.filter(s => s.owner === c.id).length, day: S.day });
      // 배당
      if (c.isPlayer && c.listed && c.dividend > 0 && ni > 0) {
        const pay = ni * c.dividend;
        c.cash -= pay; rec.dividend = pay;
        S.founder.cash += pay * c.founderShares / c.shares;
      }
      c.months.push(rec); if (c.months.length > 48) c.months.shift();
      c.storeHist.push(rec.stores); if (c.storeHist.length > 24) c.storeHist.shift();
      c.cur = blankLedger(); c._prevTotal = 0;
    }
    for (const st of S.stores) { st.lm = st.m; st.m = { rev: 0, profit: 0, cust: 0 }; }
    cityGrow(S);
    computeLand(S);
    randomEvents(S);
    aiMonth(S);
    assignSupply(S);
    S.stats.pop.push(population(S)); if (S.stats.pop.length > 48) S.stats.pop.shift();
    const p = S.companies[0];
    const last = p.months[p.months.length - 1];
    if (last) log(S, `📒 ${dateOf(S, S.day - 1).month}월 결산: 순이익 ${won(last.ni)}`, last.ni >= 0 ? 'good' : 'bad');
  }

  function cityGrow(S) {
    const empties = {}; const totals = {};
    for (const t of S.tiles) if (t.t === 'land') { totals[t.d] = (totals[t.d] || 0) + 1; if (isLot(t)) empties[t.d] = (empties[t.d] || 0) + 1; }
    const boosters = S.tiles.filter(t => t.b && (t.b.k === 'park' || t.b.k === 'bus'));
    for (const t of S.tiles) {
      if (t.t !== 'land') continue;
      const near = boosters.filter(b => dist(b, t) <= 4).length;
      if (t.b && SEG[t.b.k]) {
        const maxLv = near ? 5 : 4;
        if (t.b.lv < maxLv && rnd(S) < 0.025 + near * 0.02) t.b.lv++;
      } else if (isLot(t)) {
        if ((empties[t.d] || 0) / totals[t.d] < 0.34) continue;
        if (rnd(S) < 0.012 + near * 0.012) { t.b = { k: t.d, lv: 1 }; t.tree = false; empties[t.d]--; }
      }
    }
  }

  function randomEvents(S) {
    const r = rnd(S);
    if (r < 0.22) {
      const keys = Object.keys(INGR); const k = keys[Math.floor(rnd(S) * keys.length)];
      const up = rnd(S) < 0.65;
      S.ingr[k].p *= up ? 1.3 + rnd(S) * 0.3 : 0.75;
      log(S, up ? `📈 ${INGR[k].name} 국제 시세가 급등했어요.` : `📉 ${INGR[k].name} 풍작으로 값이 내렸어요.`, up ? 'warn' : 'good');
    } else if (r < 0.4) {
      const cat = CAT_KEYS[Math.floor(rnd(S) * CAT_KEYS.length)];
      S.trends[cat] = { mult: 1.3, until: S.day + 60 };
      log(S, `✨ SNS에서 ${CATS[cat].name} 열풍! 두 달간 수요가 늘어요.`, 'good');
    } else if (r < 0.55) {
      const ds = Object.keys(DISTRICTS); const d = ds[Math.floor(rnd(S) * ds.length)];
      S.festival = { d, until: S.day + 12 };
      log(S, `🎉 ${DISTRICTS[d].name}에서 축제가 열려요. 12일간 손님이 몰립니다.`, 'good');
    } else if (r < 0.63 && S.econ.until <= S.day) {
      const boom = rnd(S) < 0.5;
      S.econ = { mult: boom ? 1.08 : 0.88, until: S.day + 90 };
      log(S, boom ? '☀️ 경기가 좋아져 외식 소비가 늘고 있어요.' : '🌧️ 경기 둔화로 소비 심리가 위축됐어요.', boom ? 'good' : 'warn');
    }
    if (S.econ.until <= S.day) S.econ.mult = 1;
  }

  // ---------- 경쟁사 AI ----------
  function aiMonth(S) {
    for (const c of S.companies) {
      if (!c.ai || c.dead) continue;
      const mine = S.stores.filter(s => s.owner === c.id);
      for (const st of mine) if (st.lossDays > 75 && mine.length > 1) { closeStore(S, st.id, true); log(S, `🏚️ ${c.name}이(가) 적자 매장 하나를 닫았어요.`, 'info'); break; }
      // 가격 대응
      for (const st of S.stores.filter(s => s.owner === c.id)) {
        let target = CATS[st.cat].price * c.ai.pricing;
        const rival = S.stores.find(o => o.owner !== c.id && o.cat === st.cat && dist(o, st) <= 3 && o.price < st.price * 0.95);
        if (rival) target *= 0.95;
        if (st.lost > st.served * 0.2) target *= 1.05;
        st.price = Math.round((st.price * 0.6 + target * 0.4) / 100) * 100;
        if (st.level < 3 && st.lost > capacity(st) * 0.15 && c.cash > upgradeCost(st) * 2) { c.cash -= upgradeCost(st); st.invest += upgradeCost(st); st.level++; }
      }
      // 확장
      const count = S.stores.filter(s => s.owner === c.id).length;
      const maxStores = 8 + Math.floor(S.day / 90) * 2;
      let opens = rnd(S) < 0.5 * c.ai.aggr ? 2 : 1;
      while (opens-- > 0 && count < Math.min(36, maxStores)) {
        const cat = rnd(S) < 0.88 ? c.ai.focus[Math.floor(rnd(S) * c.ai.focus.length)] : CAT_KEYS[Math.floor(rnd(S) * CAT_KEYS.length)];
        const spot = bestLot(S, cat, c.id, 10);
        if (!spot) break;
        const cost = storeCost(S, cat, spot.x, spot.y);
        if (c.cash < cost * 1.5 || spot.cust < 45) break;
        openStore(S, c.id, spot.x, spot.y, cat);
        if (rnd(S) < 0.25) log(S, `🏪 ${c.name}이(가) ${DISTRICTS[tile(S, spot.x, spot.y).d].name}에 ${CATS[cat].name} 매장을 열었어요.`, 'info');
      }
      // 연구·광고
      if (c.cash > 150e6 && rnd(S) < 0.3) {
        const cat = c.ai.focus[Math.floor(rnd(S) * c.ai.focus.length)];
        const cost = researchCost(c, cat);
        if (c.recipe[cat] < 10 && c.cash > cost * 3) { c.cash -= cost; c.recipe[cat]++; }
      }
      if (c.cash > 250e6 && rnd(S) < 0.15) {
        const cat = c.ai.focus[0];
        c.cash -= CAMPAIGN_COST; c.brand[cat] = clamp(c.brand[cat] + 8 * (1 - c.brand[cat] / 100), 0, 100);
        log(S, `📺 ${c.name}이(가) ${CATS[cat].name} 광고 캠페인을 시작했어요.`, 'info');
      }
      if (c.cash < 0) { c.debt += 1e8; c.cash += 1e8; }
    }
  }

  // ---------- 가맹 ----------
  function canFranchise(S, cat) {
    const p = S.companies[0];
    const own = S.stores.filter(s => s.owner === 0 && !s.franchise && s.cat === cat).length;
    return { ok: own >= 3 && p.brand[cat] >= 20, own, brand: p.brand[cat] };
  }
  function setFranchise(S, cat, on, royalty) {
    const p = S.companies[0];
    if (on && !canFranchise(S, cat).ok) return { ok: false, msg: '직영점 3곳, 인지도 20 이상이 필요해요.' };
    p.fr[cat].on = !!on;
    if (royalty != null) p.fr[cat].royalty = clamp(royalty, 0.02, 0.15);
    return { ok: true };
  }
  function franchiseTick(S) {
    const p = S.companies[0];
    for (const cat of CAT_KEYS) {
      const fr = p.fr[cat];
      if (!fr.on) continue;
      const own = S.stores.filter(s => s.owner === 0 && !s.franchise && s.cat === cat).length;
      const frs = S.stores.filter(s => s.owner === 0 && s.franchise && s.cat === cat);
      // 장기 적자 가맹점 폐업
      for (const st of frs) if (st.lossDays > 90) {
        closeStore(S, st.id, true); p.brand[cat] = Math.max(0, p.brand[cat] - 2);
        log(S, `😢 ${CATS[cat].name} 가맹점 한 곳이 적자로 폐업했어요. 브랜드 이미지가 조금 상했어요.`, 'bad');
      }
      if (frs.length >= own * 4) continue;
      const monthly = clamp(0.25 + p.brand[cat] / 100 * 0.9 - (fr.royalty - 0.05) * 6, 0.02, 1.2);
      if (rnd(S) < monthly / DAYS_PER_MONTH) {
        const spot = bestLot(S, cat, 0, 12);
        if (!spot || spot.cust < 50) continue;
        const r = openStore(S, 0, spot.x, spot.y, cat, { franchise: true });
        if (r.ok) {
          const fee = 10e6; p.cash += fee; p.cur.royalty += fee;
          log(S, `🤝 새 ${CATS[cat].name} 가맹점이 문을 열었어요! 가맹비 ${won(fee)} 입금`, 'good');
        }
      }
    }
  }

  // ---------- 플레이어 행동 ----------
  function upgradeStore(S, id) {
    const st = S.stores.find(s => s.id === id); if (!st || st.franchise) return { ok: false };
    const c = S.companies[st.owner];
    if (st.level >= 3) return { ok: false, msg: '최고 단계예요.' };
    const cost = upgradeCost(st);
    if (c.cash < cost) return { ok: false, msg: '자금이 부족해요.' };
    c.cash -= cost; c.cur.capex += cost; st.invest += cost; st.level++;
    return { ok: true };
  }
  function buyProperty(S, id) {
    const st = S.stores.find(s => s.id === id); if (!st || st.franchise || st.owned) return { ok: false };
    const c = S.companies[st.owner]; const cost = propertyPrice(S, st);
    if (c.cash < cost) return { ok: false, msg: '자금이 부족해요.' };
    c.cash -= cost; c.cur.capex += cost; st.owned = true; st.propValue = cost;
    return { ok: true };
  }
  function research(S, compId, cat) {
    const c = S.companies[compId];
    if (c.recipe[cat] >= 10) return { ok: false, msg: '이미 최고 레시피예요.' };
    const cost = researchCost(c, cat);
    if (c.cash < cost) return { ok: false, msg: '자금이 부족해요.' };
    c.cash -= cost; c.cur.other -= cost; c.recipe[cat]++;
    return { ok: true };
  }
  function campaign(S, compId, cat) {
    const c = S.companies[compId];
    if (c.cash < CAMPAIGN_COST) return { ok: false, msg: '자금이 부족해요.' };
    c.cash -= CAMPAIGN_COST; c.cur.mkt += CAMPAIGN_COST;
    c.brand[cat] = clamp(c.brand[cat] + 8 * (1 - c.brand[cat] / 100), 0, 100);
    return { ok: true };
  }
  function setFarm(S, on) { S.companies[0].farm = !!on; return { ok: true }; }
  function borrow(S) {
    const c = S.companies[0];
    if (c.debt + 1e8 > loanLimit(S, c)) return { ok: false, msg: '대출 한도를 넘었어요.' };
    c.debt += 1e8; c.cash += 1e8; return { ok: true };
  }
  function repay(S) {
    const c = S.companies[0];
    if (c.debt <= 0) return { ok: false, msg: '갚을 대출이 없어요.' };
    const amt = Math.min(1e8, c.debt);
    if (c.cash < amt) return { ok: false, msg: '현금이 부족해요.' };
    c.cash -= amt; c.debt -= amt; return { ok: true };
  }

  // ---------- 주식 ----------
  function ipoCheck(S) {
    const p = S.companies[0];
    const n = S.stores.filter(s => s.owner === 0).length;
    const lastM = p.months.slice(-3);
    const profitable = lastM.length === 3 && lastM.every(m => m.ni > 0);
    return { ok: !p.listed && n >= 8 && p.value >= 3e9 && profitable, stores: n, value: p.value, profitable };
  }
  function ipo(S) {
    const p = S.companies[0];
    if (!ipoCheck(S).ok) return { ok: false, msg: '상장 요건을 아직 채우지 못했어요.' };
    const pricePer = p.value / p.shares * 0.9;
    const newShares = Math.round(p.shares * 0.3 / 0.7);
    p.shares += newShares; p.listed = true;
    const raised = newShares * pricePer;
    p.cash += raised; p.price = pricePer;
    log(S, `🔔 ${p.name} 상장! 공모로 ${won(raised)}을 조달했어요.`, 'good');
    return { ok: true, raised };
  }
  function issueShares(S) {
    const p = S.companies[0]; if (!p.listed) return { ok: false, msg: '상장 후 가능해요.' };
    const n = Math.round(p.shares * 0.1); const raised = n * p.price * 0.95;
    p.shares += n; p.cash += raised; p.price *= 0.97;
    log(S, `📄 유상증자로 ${won(raised)}을 조달했어요. 지분율이 낮아졌어요.`, 'info');
    return { ok: true, raised };
  }
  function buyback(S) {
    const p = S.companies[0]; if (!p.listed) return { ok: false, msg: '상장 후 가능해요.' };
    const n = Math.round(p.shares * 0.02); const cost = n * p.price * 1.02;
    if (p.cash < cost) return { ok: false, msg: '현금이 부족해요.' };
    if (p.shares - n <= p.founderShares) return { ok: false, msg: '유통 주식이 부족해요.' };
    p.cash -= cost; p.shares -= n; p.price *= 1.015;
    return { ok: true, cost };
  }
  function setDividend(S, ratio) { S.companies[0].dividend = clamp(ratio, 0, 0.6); return { ok: true }; }
  function floatAvail(S, t) {
    let held = 0; for (const c of S.companies) held += c.holdings[t.id] || 0;
    return Math.max(0, t.shares - t.founderShares - held);
  }
  function buyStake(S, targetId, pct) {
    const p = S.companies[0]; const t = S.companies[targetId];
    if (!t || t.dead || !t.listed || t.isPlayer) return { ok: false };
    const n = Math.min(Math.round(t.shares * pct), floatAvail(S, t));
    if (n <= 0) return { ok: false, msg: '살 수 있는 유통 주식이 없어요.' };
    const cost = n * t.price * (1 + pct * 0.6);
    if (p.cash < cost) return { ok: false, msg: '현금이 부족해요.' };
    p.cash -= cost; p.holdings[targetId] = (p.holdings[targetId] || 0) + n;
    t.price *= 1 + pct * 0.6;
    return { ok: true, cost, n };
  }
  function sellStake(S, targetId, pct) {
    const p = S.companies[0]; const t = S.companies[targetId];
    const have = p.holdings[targetId] || 0;
    const n = Math.min(have, Math.round(t.shares * pct));
    if (n <= 0) return { ok: false, msg: '보유 주식이 없어요.' };
    const got = n * t.price * (1 - pct * 0.4);
    p.cash += got; p.holdings[targetId] = have - n; t.price *= 1 - pct * 0.4;
    return { ok: true, got };
  }
  // 경영권 인수: 지분 50% 초과 시. 남은 지분은 현금(비상장) 또는 주식 교환(상장)으로 매수
  function acquire(S, targetId) {
    const p = S.companies[0]; const t = S.companies[targetId];
    const have = p.holdings[targetId] || 0;
    if (!t || t.dead || have <= t.shares * 0.5) return { ok: false, msg: '지분 50% 초과가 필요해요.' };
    const rest = t.shares - have;
    const restValue = rest * t.price;
    if (p.listed) {
      const newShares = Math.round(restValue / p.price);
      p.shares += newShares;
    } else {
      if (p.cash < restValue) return { ok: false, msg: `잔여 지분 매수 대금 ${won(restValue)}이 필요해요.` };
      p.cash -= restValue;
    }
    for (const st of S.stores) if (st.owner === t.id) { st.owner = 0; st.auto = true; }
    for (const f of S.facs) if (f.owner === t.id) f.owner = 0;
    p.cash += t.cash; p.debt += t.debt;
    for (const k of CAT_KEYS) { p.brand[k] = Math.max(p.brand[k], t.brand[k]); p.recipe[k] = Math.max(p.recipe[k], t.recipe[k]); }
    t.dead = true; t.cash = 0; t.debt = 0; delete p.holdings[targetId];
    assignSupply(S);
    log(S, `🏆 ${t.name} 인수 완료! 매장들이 우리 간판으로 바뀌었어요.`, 'good');
    return { ok: true };
  }

  // ---------- 목표 ----------
  const QUESTS = [
    { id: 'first', text: '첫 매장 열기', reward: 5e6, check: S => S.stores.some(s => s.owner === 0) },
    { id: 'three', text: '직영 매장 3곳 운영', reward: 10e6, check: S => S.stores.filter(s => s.owner === 0 && !s.franchise).length >= 3 },
    { id: 'wh', text: '물류창고 또는 중앙주방 짓기', reward: 10e6, check: S => S.facs.some(f => f.owner === 0 && FAC[f.kind].range) },
    { id: 'rd', text: '레시피 3단계 연구', reward: 10e6, check: S => CAT_KEYS.some(k => S.companies[0].recipe[k] >= 3) },
    { id: 'brand', text: '한 업종 브랜드 인지도 30', reward: 15e6, check: S => CAT_KEYS.some(k => S.companies[0].brand[k] >= 30) },
    { id: 'fr', text: '첫 가맹점 유치', reward: 20e6, check: S => S.stores.some(s => s.owner === 0 && s.franchise) },
    { id: 'ni', text: '월 순이익 3천만원', reward: 20e6, check: S => S.companies[0].months.some(m => m.ni >= 3e7) },
    { id: 'ipo', text: '주식시장 상장(IPO)', reward: 0, check: S => S.companies[0].listed },
    { id: 'thirty', text: '매장 30곳 (가맹 포함)', reward: 50e6, check: S => S.stores.filter(s => s.owner === 0).length >= 30 },
    { id: 'mna', text: '경쟁사 인수', reward: 0, check: S => S.companies.some(c => c.dead) },
    { id: 'cap', text: '시가총액 1,000억원', reward: 0, check: S => S.companies[0].listed && marketCap(S.companies[0]) >= 1e11 },
  ];
  function checkQuests(S) {
    for (const q of QUESTS) {
      if (S.quests[q.id]) continue;
      if (q.check(S)) {
        S.quests[q.id] = S.day;
        if (q.reward) { S.companies[0].cash += q.reward; S.companies[0].cur.other += q.reward; }
        log(S, `🎯 목표 달성: ${q.text}${q.reward ? ` (보상 ${won(q.reward)})` : ''}`, 'good');
      }
    }
  }

  // ---------- 통계 ----------
  function marketShare(S, cat) {
    const by = {};
    for (const st of S.stores) if (st.cat === cat) by[st.owner] = (by[st.owner] || 0) + st.served;
    const total = Object.values(by).reduce((a, b) => a + b, 0);
    return { by, total };
  }

  // ---------- 표시 ----------
  function won(v) {
    const s = v < 0 ? '-' : ''; v = Math.abs(v);
    if (v >= 1e12) return s + (v / 1e12).toFixed(2) + '조원';
    if (v >= 1e8) return s + (v / 1e8).toFixed(v >= 1e10 ? 0 : 1) + '억원';
    if (v >= 1e4) return s + Math.round(v / 1e4).toLocaleString('ko-KR') + '만원';
    return s + Math.round(v).toLocaleString('ko-KR') + '원';
  }

  function serialize(S) { return JSON.stringify(S); }
  function deserialize(str) { const S = JSON.parse(str); if (!S || S.v !== 1) throw new Error('저장 형식이 달라요'); return S; }

  const api = {
    W, H, ROAD_EVERY, REACH, CATS, CAT_KEYS, INGR, SEG, DISTRICTS, FAC, PUBLIC, MKT, WAGE, CAMPAIGN_COST, QUESTS, DAYS_PER_MONTH,
    newGame, step, tile, isLot, sources, population, dateOf, seasonOf,
    storeCost, propertyPrice, rentOf, upgradeCost, capacity, maxStaff, researchCost, unitCost, quality,
    openStore, closeStore, buildFacility, upgradeFacility, removeFacility, buildPublic, facRange, facCap, assignSupply,
    lotPotentials, lotEstimate, bestLot, valuation, bookValue, marketCap, loanLimit,
    canFranchise, setFranchise, upgradeStore, buyProperty, research, campaign, setFarm, borrow, repay,
    ipoCheck, ipo, issueShares, buyback, setDividend, floatAvail, buyStake, sellStake, acquire,
    marketShare, won, serialize, deserialize, log,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Sim = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
