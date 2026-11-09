/* 모락모락 타운 — 시뮬레이션 코어 v2 (브라우저/Node 공용, DOM 없음)
 * 시간 단위: 1스텝 = 1시간. 하루 24시간, 실제 달력(2027년 3월 1일 월요일 시작).
 * 금액 단위: 원. 메뉴 가격은 부가세 포함, 매출은 부가세(10%)를 뺀 금액으로 장부에 올린다. */
(function (root) {
  'use strict';

  const W = 33, H = 33, ROAD_EVERY = 4, REACH = 6, HOOD = 11;
  const START = Date.UTC(2027, 2, 1);
  const OUTSIDE = 0.65;
  const BURDEN = 1.18;          // 4대보험·주휴수당 등 사업주 부담 포함 배율
  const VAT = 1.1, CARD_FEE = 0.011;
  const HALL_RATE = 36;          // 홀 직원 1명이 1시간에 응대하는 손님
  const MKT = [0, 30000, 100000, 300000];
  const MKT_NAME = ['없음', '전단·SNS', '지역 광고', '인플루언서'];
  const BASE_MIN_WAGE = 10600;   // 2027년 최저시급 (게임 설정값)

  // ---------- 업종·메뉴 ----------
  // 메뉴: [이름, 가격(원, 부가세 포함), 원가율, 손님층 선호('r주민 o직장인 u대학생 t관광객', 기본 1), 옵션]
  // 옵션: s=제철(sum/win/spr/dec), d=손이 많이 감, def=기본 메뉴
  function parseAppeal(str) { const a = { res: 1, off: 1, uni: 1, tour: 1 }; const map = { r: 'res', o: 'off', u: 'uni', t: 'tour' }; (str || '').split(' ').filter(Boolean).forEach(p => { a[map[p[0]]] = parseFloat(p.slice(1)); }); return a; }
  const SEASON_MONTHS = { sum: [5, 6, 7], win: [11, 0, 1], spr: [2, 3, 4], dec: [11] };
  function M(cat, list) { return list.map((m, i) => ({ id: cat + i, name: m[0], price: m[1], cost: m[2], appeal: parseAppeal(m[3]), season: m[4] && m[4].s ? SEASON_MONTHS[m[4].s] : null, diff: !!(m[4] && m[4].d), def: !!(m[4] && m[4].def) })); }
  const CATS = {
    cafe: { name: '카페', icon: '☕', pattern: 'morning', per: 1.25, recipe: { bean: 0.45, milk: 0.35, etc: 0.2 }, food: false, equip: 35e6, rate: 32, takeout: 0.5, dwell: 0.9, hours: [7, 22],
      menu: M('cafe', [['아메리카노', 4500, 0.2, 'o1.3 u1.1 r.9 t.9', { def: 1 }], ['카페라테', 5000, 0.28, '', { def: 1 }], ['바닐라라테', 5500, 0.3, 'u1.3 t1.1', { def: 1 }], ['콜드브루', 5500, 0.2, 'o1.2', { s: 'sum' }], ['아인슈페너', 6000, 0.3, 't1.3 u1.2', { def: 1 }], ['녹차라테', 5500, 0.32, 'r1.1 t1.1'], ['핸드드립', 7000, 0.25, 'o1.1 t1.3 u.8', { d: 1 }], ['크로플', 6500, 0.3, 'u1.4 t1.2', { d: 1 }], ['치즈케이크', 6500, 0.35, 'r1.1 t1.1'], ['딸기라테', 6500, 0.35, 'u1.4 t1.1', { s: 'spr' }], ['뱅쇼', 7000, 0.3, 't1.2 u1.1', { s: 'win' }]]) },
    bakery: { name: '베이커리', icon: '🥐', pattern: 'bakery', per: 1.7, recipe: { flour: 0.45, milk: 0.2, etc: 0.35 }, food: true, equip: 60e6, rate: 40, takeout: 0.7, dwell: 0.6, hours: [7, 21],
      menu: M('bakery', [['소금빵', 3500, 0.3, 'u1.2 t1.2', { def: 1 }], ['우유식빵', 5500, 0.28, 'r1.5 o.8', { def: 1 }], ['크루아상', 4500, 0.33, 'o1.1 t1.1', { def: 1 }], ['단팥빵', 3000, 0.3, 'r1.3 u.8', { def: 1 }], ['베이글', 4000, 0.28, 'o1.3'], ['소시지빵', 4500, 0.35, 'u1.3 r1.1'], ['롤케이크', 8000, 0.32, 't1.3 r1.1'], ['마늘바게트', 5000, 0.3, 'u1.2'], ['샌드위치', 7500, 0.38, 'o1.5', { d: 1 }], ['슈톨렌', 18000, 0.35, 'r1.2 t1.3', { s: 'dec' }]]) },
    noodle: { name: '국수집', icon: '🍜', pattern: 'meal', per: 1.15, recipe: { flour: 0.3, veg: 0.3, meat: 0.3, etc: 0.1 }, food: true, equip: 40e6, rate: 22, takeout: 0.08, dwell: 0.6, hours: [10, 21],
      menu: M('noodle', [['잔치국수', 7000, 0.3, 'r1.2 o1.1', { def: 1 }], ['비빔국수', 8000, 0.32, 'u1.2', { def: 1 }], ['칼국수', 9000, 0.33, 'r1.2 o1.2', { def: 1 }], ['콩국수', 10000, 0.35, 'r1.2 o1.1', { s: 'sum' }], ['수제비', 8500, 0.32, 'r1.3'], ['고기만두', 6000, 0.35, 'u1.2 o1.1', { def: 1 }], ['들기름막국수', 11000, 0.33, 't1.4 o1.1', { d: 1 }], ['김치말이국수', 8500, 0.32, 'u1.1', { s: 'sum' }], ['어묵우동', 8000, 0.3, '', { s: 'win' }]]) },
    burger: { name: '버거', icon: '🍔', pattern: 'burger', per: 1.35, recipe: { meat: 0.45, flour: 0.2, veg: 0.2, etc: 0.15 }, food: true, equip: 55e6, rate: 22, takeout: 0.4, dwell: 0.5, hours: [10, 23],
      menu: M('burger', [['클래식버거', 8900, 0.35, '', { def: 1 }], ['치즈버거', 9500, 0.36, 'u1.2', { def: 1 }], ['베이컨버거', 11000, 0.38, 'o1.1 u1.1', { def: 1 }], ['더블패티', 13500, 0.4, 'u1.4 o1.1', { d: 1 }], ['치킨버거', 9000, 0.36, 'u1.2 r1.1'], ['감자튀김', 4000, 0.22, 'u1.2', { def: 1 }], ['밀크셰이크', 5500, 0.3, 'u1.3 t1.1'], ['트러플버거', 15000, 0.42, 't1.3 o1.2 u.8', { d: 1 }]]) },
    dessert: { name: '디저트', icon: '🍰', pattern: 'afternoon', per: 1.3, recipe: { milk: 0.4, flour: 0.25, etc: 0.35 }, food: true, equip: 30e6, rate: 26, takeout: 0.3, dwell: 1.0, hours: [11, 22],
      menu: M('dessert', [['조각케이크', 7500, 0.32, 't1.2', { def: 1 }], ['마카롱', 3000, 0.35, 'u1.5', { def: 1 }], ['눈꽃빙수', 13000, 0.3, 't1.5 u1.2', { s: 'sum' }], ['과일타르트', 7000, 0.35, 't1.2 r1.1', { def: 1 }], ['티라미수', 8000, 0.32, 'o1.1 u1.1', { def: 1 }], ['크레페', 8500, 0.3, 'u1.3', { d: 1 }], ['생과일주스', 6500, 0.38, 'r1.1', { s: 'sum' }], ['수제쿠키', 3500, 0.3, 'u1.2 r1.1'], ['딸기케이크', 9000, 0.38, 't1.3 u1.2', { s: 'spr' }]]) },
    snack: { name: '분식', icon: '🍢', pattern: 'snack', per: 1.6, recipe: { flour: 0.3, veg: 0.3, etc: 0.4 }, food: true, equip: 25e6, rate: 30, takeout: 0.5, dwell: 0.4, hours: [10, 22],
      menu: M('snack', [['떡볶이', 5000, 0.28, 'u1.5 r1.1', { def: 1 }], ['순대', 5000, 0.35, 'r1.1', { def: 1 }], ['김밥', 4000, 0.35, 'o1.4', { def: 1 }], ['모둠튀김', 4000, 0.3, 'u1.2', { def: 1 }], ['라볶이', 6500, 0.3, 'u1.3'], ['어묵', 3000, 0.28, '', { s: 'win' }], ['쫄면', 6500, 0.3, 'u1.2', { s: 'sum' }], ['로제떡볶이', 7500, 0.32, 'u1.5 t1.2', { d: 1 }]]) },
    chicken: { name: '치킨', icon: '🍗', pattern: 'evening', per: 1.15, recipe: { meat: 0.6, flour: 0.1, etc: 0.3 }, food: true, equip: 45e6, rate: 12, takeout: 0.65, dwell: 1.2, hours: [15, 24], fri: 1.35,
      menu: M('chicken', [['후라이드', 20000, 0.42, '', { def: 1 }], ['양념치킨', 21000, 0.43, 'u1.2', { def: 1 }], ['간장치킨', 21000, 0.43, 'r1.1'], ['반반치킨', 21000, 0.43, '', { def: 1 }], ['순살치킨', 23000, 0.45, 'o1.2'], ['생맥주', 5000, 0.25, 'o1.5 u1.2', { def: 1 }], ['치즈볼', 6000, 0.3, 'u1.3'], ['마늘치킨', 22000, 0.44, 't1.1', { d: 1 }]]) },
    pizza: { name: '피자', icon: '🍕', pattern: 'pizza', per: 1.2, recipe: { flour: 0.3, milk: 0.3, meat: 0.2, etc: 0.2 }, food: true, equip: 50e6, rate: 14, takeout: 0.6, dwell: 0.8, hours: [11, 23],
      menu: M('pizza', [['페퍼로니', 22000, 0.32, 'u1.2', { def: 1 }], ['콤비네이션', 24000, 0.34, 'r1.2', { def: 1 }], ['고르곤졸라', 18000, 0.3, 'u1.1 t1.1', { def: 1 }], ['불고기피자', 25000, 0.36, 'r1.2'], ['마르게리타', 19000, 0.3, 't1.3 o1.1'], ['크림파스타', 15000, 0.3, 'o1.1 t1.1', { d: 1 }], ['시저샐러드', 9000, 0.35, 'o1.2']]) },
    hansik: { name: '한식당', icon: '🍚', pattern: 'meal', per: 1.1, recipe: { meat: 0.3, veg: 0.4, etc: 0.3 }, food: true, equip: 45e6, rate: 18, takeout: 0.1, dwell: 0.7, hours: [10, 21],
      menu: M('hansik', [['김치찌개', 9000, 0.35, 'o1.4 r1.1', { def: 1 }], ['된장찌개', 9000, 0.34, 'o1.3 r1.2', { def: 1 }], ['제육볶음', 11000, 0.38, 'o1.3 u1.2', { def: 1 }], ['불고기정식', 15000, 0.4, 't1.5 r1.1', { d: 1 }], ['돌솥비빔밥', 11000, 0.35, 't1.5', { def: 1 }], ['순두부찌개', 9500, 0.34, 'o1.2'], ['갈비탕', 15000, 0.42, 'r1.3 o1.1', { d: 1 }], ['물냉면', 11000, 0.33, 'o1.2 t1.2', { s: 'sum' }], ['삼계탕', 17000, 0.42, 'r1.2 o1.2 t1.2', { s: 'sum' }]]) },
    japanese: { name: '일식', icon: '🍣', pattern: 'meal', per: 1.1, recipe: { meat: 0.3, flour: 0.2, veg: 0.1, etc: 0.4 }, food: true, equip: 50e6, rate: 16, takeout: 0.15, dwell: 0.7, hours: [11, 22],
      menu: M('japanese', [['돈카츠', 12000, 0.36, 'o1.2 u1.2', { def: 1 }], ['돈코츠라멘', 11000, 0.33, 'u1.4', { def: 1 }], ['모둠초밥', 18000, 0.45, 'o1.2 t1.3', { d: 1, def: 1 }], ['냉우동', 9000, 0.3, '', { s: 'sum' }], ['규동', 10000, 0.36, 'o1.3', { def: 1 }], ['사케동', 16000, 0.45, 't1.2 o1.1'], ['냉소바', 10000, 0.3, 'o1.2', { s: 'sum' }], ['카레우동', 10000, 0.3, 'u1.2', { s: 'win' }]]) },
    chinese: { name: '중식', icon: '🥟', pattern: 'meal', per: 1.3, recipe: { flour: 0.35, meat: 0.25, veg: 0.25, etc: 0.15 }, food: true, equip: 45e6, rate: 20, takeout: 0.35, dwell: 0.5, hours: [11, 21],
      menu: M('chinese', [['짜장면', 7500, 0.28, 'r1.1 u1.1', { def: 1 }], ['짬뽕', 9000, 0.32, 'o1.2', { def: 1 }], ['탕수육', 18000, 0.38, 'u1.1 r1.1', { def: 1 }], ['볶음밥', 8500, 0.3, 'o1.1', { def: 1 }], ['마라탕', 12000, 0.35, 'u1.6 t.9'], ['군만두', 7000, 0.3, 'u1.1'], ['깐풍기', 22000, 0.38, 'o1.2', { d: 1 }], ['중국냉면', 10000, 0.32, '', { s: 'sum' }]]) },
    salad: { name: '샐러드', icon: '🥗', pattern: 'lunch', per: 1.1, recipe: { veg: 0.5, meat: 0.2, etc: 0.3 }, food: true, equip: 25e6, rate: 28, takeout: 0.55, dwell: 0.5, hours: [8, 20],
      menu: M('salad', [['닭가슴살 샐러드', 9900, 0.38, 'o1.5', { def: 1 }], ['연어 포케', 13500, 0.42, 'o1.3 t1.2', { def: 1 }], ['그릭요거트볼', 7500, 0.35, 'u1.2 r1.1', { def: 1 }], ['클럽 샌드위치', 8500, 0.36, 'o1.3'], ['콥샐러드', 11000, 0.38, 'o1.2', { def: 1 }], ['그린 스무디', 6500, 0.35, 'o1.1', { s: 'sum' }], ['단호박 수프', 6500, 0.3, 'r1.1', { s: 'win' }]]) },
    bubbletea: { name: '버블티', icon: '🧋', pattern: 'afternoon', per: 1.1, recipe: { milk: 0.4, etc: 0.6 }, food: false, equip: 30e6, rate: 40, takeout: 0.8, dwell: 0.4, hours: [11, 22],
      menu: M('bubbletea', [['흑당버블티', 5500, 0.25, 'u1.5', { def: 1 }], ['타로밀크티', 5000, 0.25, 'u1.3', { def: 1 }], ['망고스무디', 6000, 0.32, 't1.2', { s: 'sum' }], ['클래식밀크티', 4500, 0.22, 'o1.1', { def: 1 }], ['치즈폼그린티', 5500, 0.27, 'u1.2 t1.2', { def: 1 }], ['자몽티', 5000, 0.3, 'o1.1 r1.1'], ['딸기요거트', 6000, 0.32, 'u1.3', { s: 'spr' }]]) },
    brunch: { name: '브런치', icon: '🥞', pattern: 'brunch', per: 1.4, weekend: 1.6, recipe: { flour: 0.2, milk: 0.3, meat: 0.2, veg: 0.1, etc: 0.2 }, food: true, equip: 40e6, rate: 14, takeout: 0.05, dwell: 1.2, hours: [9, 17],
      menu: M('brunch', [['에그베네딕트', 16000, 0.36, 't1.4 u1.1', { def: 1, d: 1 }], ['프렌치토스트', 14000, 0.32, 'u1.3', { def: 1 }], ['리코타 팬케이크', 13000, 0.32, 'u1.3 t1.1', { def: 1 }], ['리코타샐러드', 13500, 0.36, 'o1.1'], ['브런치 플레이트', 18000, 0.38, 't1.3 r1.1', { def: 1 }], ['치즈 오믈렛', 12000, 0.32, 'r1.1'], ['자몽에이드', 6500, 0.3, '', { s: 'sum' }]]) },
    pub: { name: '이자카야', icon: '🍶', pattern: 'evening', per: 2.2, fri: 1.4, recipe: { meat: 0.35, veg: 0.2, etc: 0.45 }, food: true, equip: 40e6, rate: 18, takeout: 0, dwell: 1.8, hours: [17, 24],
      menu: M('pub', [['하이볼', 7000, 0.2, 'o1.3 u1.3', { def: 1 }], ['생맥주', 5000, 0.22, 'o1.4', { def: 1 }], ['모둠꼬치', 18000, 0.38, 'o1.2 t1.1', { def: 1, d: 1 }], ['오뎅탕', 17000, 0.32, 'o1.2', { s: 'win' }], ['가라아게', 16000, 0.35, 'u1.2', { def: 1 }], ['감바스', 19000, 0.38, 't1.3'], ['소주', 5000, 0.25, 'o1.5 r1.1', { def: 1 }], ['계란말이', 13000, 0.28, 'r1.1']]) },
  };
  const CAT_KEYS = Object.keys(CATS);
  const SIZES = [null, { py: 15, name: '소형 15평', menu: 5 }, { py: 25, name: '중형 25평', menu: 7 }, { py: 40, name: '대형 40평', menu: 9 }];
  function defaultMenu(cat, size) { const M2 = CATS[cat].menu; let L = M2.filter(m => m.def).map(m => m.id); if (L.length > SIZES[size || 2].menu) L = L.slice(0, SIZES[size || 2].menu); return L; }
  for (const k of CAT_KEYS) {
    const def = CATS[k].menu.filter(m => m.def);
    const avg = def.reduce((a, m) => a + m.price, 0) / def.length;
    CATS[k].ticket = Math.round(avg * CATS[k].per / 100) * 100;
    CATS[k].cogs = def.reduce((a, m) => a + m.cost, 0) / def.length;
  }

  const INGR = {
    bean:  { name: '원두',     unit: 'kg', base: 18000 },
    flour: { name: '밀가루',   unit: 'kg', base: 1300 },
    milk:  { name: '우유',     unit: 'L',  base: 2900 },
    meat:  { name: '돼지고기', unit: 'kg', base: 16000 },
    veg:   { name: '채소',     unit: 'kg', base: 3800 },
  };

  // ---------- 손님 ----------
  const SEG = {
    res:  { name: '주민',   sens: 1.0, pop: 40 },
    off:  { name: '직장인', sens: 0.6, pop: 80 },
    uni:  { name: '대학생', sens: 1.6, pop: 100 },
    tour: { name: '관광객', sens: 0.5, pop: 50 },
  };
  const SEG_KEYS = Object.keys(SEG);
  const APPETITE = {
    cafe:    { res: 0.15, off: 0.40, uni: 0.38, tour: 0.32 },
    bakery:  { res: 0.20, off: 0.12, uni: 0.08, tour: 0.20 },
    noodle:  { res: 0.10, off: 0.18, uni: 0.18, tour: 0.15 },
    burger:  { res: 0.07, off: 0.10, uni: 0.20, tour: 0.15 },
    dessert: { res: 0.11, off: 0.08, uni: 0.18, tour: 0.38 },
    snack:     { res: 0.07, off: 0.07, uni: 0.16, tour: 0.08 },
    chicken:   { res: 0.07, off: 0.05, uni: 0.07, tour: 0.04 },
    pizza:     { res: 0.05, off: 0.03, uni: 0.06, tour: 0.05 },
    hansik:    { res: 0.07, off: 0.20, uni: 0.08, tour: 0.14 },
    japanese:  { res: 0.04, off: 0.10, uni: 0.09, tour: 0.09 },
    chinese:   { res: 0.07, off: 0.10, uni: 0.09, tour: 0.05 },
    salad:     { res: 0.03, off: 0.11, uni: 0.04, tour: 0.03 },
    bubbletea: { res: 0.04, off: 0.05, uni: 0.20, tour: 0.13 },
    brunch:    { res: 0.04, off: 0.03, uni: 0.06, tour: 0.11 },
    pub:       { res: 0.04, off: 0.09, uni: 0.09, tour: 0.06 },
  };
  const SEG_HOURS = {
    off:  [0, 0, 0, 0, 0, 0, 0.5, 4, 10, 6, 4, 7, 18, 14, 5, 6, 5, 5, 9, 5, 2, 1, 0.5, 0],
    uni:  [0.5, 0.3, 0, 0, 0, 0, 0, 1, 3, 5, 6, 9, 12, 11, 8, 7, 6, 6, 8, 8, 6, 4, 3, 1.5],
    res:  [0.3, 0, 0, 0, 0, 0, 1, 3, 4, 4, 5, 7, 9, 6, 5, 5, 6, 7, 10, 10, 7, 5, 3, 1],
    tour: [0, 0, 0, 0, 0, 0, 0, 0.5, 1, 3, 6, 9, 11, 11, 10, 10, 9, 8, 8, 6, 4, 2, 1, 0.3],
  };
  function catHourMult(cat, h) {
    const p = CATS[cat].pattern;
    if (p === 'morning') return h >= 7 && h <= 10 ? 1.7 : h === 11 ? 1 : h <= 13 && h >= 12 ? 1.3 : h >= 14 && h <= 17 ? 1.5 : h >= 18 && h <= 19 ? 0.8 : h >= 20 ? 0.6 : 0.3;
    if (p === 'bakery') return h >= 7 && h <= 9 ? 2 : h <= 11 && h >= 10 ? 1.2 : h <= 13 && h >= 12 ? 0.9 : h >= 14 && h <= 16 ? 1 : h >= 17 && h <= 19 ? 1.4 : h >= 20 ? 0.6 : 0.3;
    if (p === 'meal') return h >= 11 && h <= 13 ? 2 : h >= 14 && h <= 16 ? 0.5 : h >= 17 && h <= 20 ? 1.6 : h >= 21 ? 0.7 : 0.3;
    if (p === 'burger') return h >= 11 && h <= 13 ? 1.7 : h >= 14 && h <= 16 ? 0.8 : h >= 17 && h <= 20 ? 1.4 : h >= 21 ? 1.1 : 0.4;
    if (p === 'snack') return h >= 11 && h <= 13 ? 1.4 : h >= 14 && h <= 18 ? 1.6 : h >= 19 && h <= 21 ? 1 : h >= 22 ? 0.7 : 0.2;
    if (p === 'evening') return h >= 19 && h <= 22 ? 2.2 : h === 23 ? 1.5 : h >= 17 && h <= 18 ? 0.9 : h <= 1 ? 0.8 : h >= 12 && h <= 16 ? 0.25 : 0.1;
    if (p === 'pizza') return h >= 11 && h <= 13 ? 1.3 : h >= 17 && h <= 21 ? 1.8 : h >= 22 ? 1 : h >= 14 && h <= 16 ? 0.6 : 0.2;
    if (p === 'lunch') return h >= 11 && h <= 13 ? 2.6 : h >= 8 && h <= 10 ? 0.8 : h >= 14 && h <= 16 ? 0.6 : h >= 17 && h <= 19 ? 0.7 : 0.1;
    if (p === 'brunch') return h >= 10 && h <= 14 ? 2 : h === 9 || h === 15 ? 0.9 : h === 16 ? 0.6 : 0.15;
    return h >= 13 && h <= 17 ? 1.7 : h === 18 ? 1 : h >= 19 && h <= 22 ? 1.3 : h === 12 ? 0.7 : 0.35;
  }
  const PROFILE = {};
  for (const c of CAT_KEYS) {
    PROFILE[c] = {};
    for (const s of SEG_KEYS) {
      const raw = SEG_HOURS[s].map((v, h) => v * catHourMult(c, h));
      const sum = raw.reduce((a, b) => a + b, 0);
      PROFILE[c][s] = raw.map(v => v / sum);
    }
  }
  const SEASON = {
    cafe:    [0.95, 0.95, 1, 1, 1.05, 1.1, 1.15, 1.15, 1.05, 1, 1, 0.95],
    bakery:  [1, 1, 1, 1, 1, 0.95, 0.95, 0.95, 1, 1.05, 1.05, 1.15],
    noodle:  [1.25, 1.2, 1.05, 0.95, 0.9, 0.85, 0.85, 0.85, 0.95, 1.05, 1.15, 1.25],
    burger:  [0.95, 0.95, 1, 1, 1.05, 1.05, 1.1, 1.1, 1, 1, 0.95, 1],
    dessert: [0.85, 0.9, 1, 1.05, 1.15, 1.25, 1.3, 1.25, 1.05, 0.95, 0.9, 1.15],
    snack:     [1.1, 1.05, 1, 1, 1, 0.95, 0.9, 0.9, 1, 1, 1.05, 1.1],
    chicken:   [1, 1, 1, 1, 1.05, 1.1, 1.15, 1.15, 1, 1, 1, 1.05],
    pizza:     [1.05, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.15],
    hansik:    [1.1, 1.05, 1, 1, 1, 0.95, 0.95, 0.95, 1, 1.05, 1.05, 1.1],
    japanese:  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    chinese:   [1.05, 1.05, 1, 1, 1, 0.95, 0.95, 0.95, 1, 1, 1.05, 1.05],
    salad:     [0.85, 0.9, 1.05, 1.1, 1.15, 1.1, 1.05, 1.05, 1.05, 1, 0.9, 0.85],
    bubbletea: [0.85, 0.9, 1, 1.05, 1.15, 1.2, 1.25, 1.25, 1.05, 0.95, 0.9, 0.85],
    brunch:    [0.95, 0.95, 1.05, 1.1, 1.1, 1, 0.95, 0.95, 1.05, 1.1, 1, 1],
    pub:       [1.1, 1, 1, 1, 1, 1.05, 1.1, 1.1, 1, 1.05, 1.1, 1.2],
  };

  // ---------- 동네(상권) ----------
  const HOODS = [
    { name: '은행나무동', kind: 'uni',  mix: { uni: 0.55, res: 0.3, off: 0.1, tour: 0.05 }, rent: 90000,  dev: 0.45, desc: '대학 정문 앞 젊은 상권. 가격에 민감하고 밤늦게까지 붐벼요.' },
    { name: '서재골',     kind: 'res',  mix: { res: 0.55, uni: 0.3, off: 0.15 },             rent: 80000,  dev: 0.40, desc: '학원가와 주택이 섞인 조용한 동네예요.' },
    { name: '풍차언덕',   kind: 'res',  mix: { res: 0.8, off: 0.1, tour: 0.1 },              rent: 70000,  dev: 0.40, desc: '언덕 위 오래된 주택가. 주말과 저녁에 손님이 많아요.' },
    { name: '물레방아동', kind: 'res',  mix: { res: 0.6, tour: 0.2, off: 0.2 },              rent: 80000,  dev: 0.45, desc: '전통시장이 있는 정겨운 동네예요.' },
    { name: '중앙동',     kind: 'off',  mix: { off: 0.85, tour: 0.1, res: 0.05 },            rent: 180000, dev: 0.60, desc: '오피스 빌딩이 모인 업무지구. 평일 아침과 점심이 승부예요.' },
    { name: '벽돌골목',   kind: 'tour', mix: { tour: 0.35, uni: 0.3, res: 0.2, off: 0.15 }, rent: 110000, dev: 0.35, desc: '붉은 벽돌 공장을 고친 신흥 상권. 분위기 좋은 가게를 찾는 손님이 와요.', hype: 30 },
    { name: '햇살마을',   kind: 'res',  mix: { res: 0.85, uni: 0.1, off: 0.05 },             rent: 70000,  dev: 0.50, desc: '신축 아파트 단지. 가족 손님이 많아요.' },
    { name: '오피스파크', kind: 'off',  mix: { off: 0.55, res: 0.35, uni: 0.1 },             rent: 120000, dev: 0.45, desc: '오피스텔과 지식산업센터가 섞인 곳이에요.' },
    { name: '호수공원동', kind: 'tour', mix: { tour: 0.6, res: 0.3, off: 0.1 },              rent: 120000, dev: 0.30, desc: '호수 산책로를 따라 관광객이 찾아오는 동네예요.' },
  ];

  // ---------- 인테리어·건축 ----------
  const TIERS = [null, { name: '기본', perPy: 1.5e6 }, { name: '스탠다드', perPy: 2.5e6 }, { name: '프리미엄', perPy: 4e6 }, { name: '시그니처', perPy: 6.5e6 }];
  const STYLES = {
    minimal:    { name: '미니멀 화이트',  cost: 0.9,  appeal: { res: 0.6, off: 1.2, uni: 0.8, tour: 0.6 }, floor: '#f1efea', wall: '#fbfaf7', accent: '#cfd6dc', desc: '깔끔하고 밝아 직장인이 좋아해요.' },
    wood:       { name: '우드 내추럴',    cost: 1.0,  appeal: { res: 1.2, off: 0.8, uni: 0.8, tour: 0.8 }, floor: '#d9b48a', wall: '#f4eadb', accent: '#a7774f', desc: '따뜻한 나무 느낌. 동네 주민에게 편안해요.' },
    vintage:    { name: '빈티지 레트로',  cost: 0.95, appeal: { res: 0.6, off: 0.5, uni: 1.4, tour: 1.0 }, floor: '#b9806a', wall: '#f3dfc3', accent: '#7d9f8e', desc: '대학생들이 사진 찍으러 와요.' },
    industrial: { name: '인더스트리얼',   cost: 0.9,  appeal: { res: 0.5, off: 1.0, uni: 1.2, tour: 0.9 }, floor: '#a9a9a5', wall: '#c9c5bf', accent: '#5b5f63', desc: '노출 콘크리트와 철제 가구.' },
    nordic:     { name: '북유럽',         cost: 1.05, appeal: { res: 1.1, off: 1.0, uni: 0.9, tour: 0.8 }, floor: '#e7dcc9', wall: '#f7f5f0', accent: '#9bb7c7', desc: '밝은 원목과 파스텔. 누구나 무난하게 좋아해요.' },
    hanok:      { name: '모던 한옥',      cost: 1.4,  appeal: { res: 0.9, off: 0.7, uni: 0.8, tour: 1.5 }, floor: '#c79a6b', wall: '#efe4cf', accent: '#5d4636', desc: '관광객이 일부러 찾아와요.' },
    luxury:     { name: '모던 럭셔리',    cost: 1.5,  appeal: { res: 0.7, off: 1.3, uni: 0.5, tour: 1.2 }, floor: '#3e3a3a', wall: '#e9e3da', accent: '#c7a35a', desc: '높은 가격에도 손님이 덜 떠나요.' },
    plant:      { name: '플랜테리어',     cost: 1.15, appeal: { res: 1.0, off: 0.9, uni: 1.1, tour: 1.2 }, floor: '#e3dccd', wall: '#eef3e6', accent: '#6fa36a', desc: '초록 식물이 가득한 휴식 공간.' },
  };
  const STYLE_KEYS = Object.keys(STYLES);
  const ARCH = {
    basic:      { name: '기본 상가',       perPy: 0,     appeal: { res: 0, off: 0, uni: 0, tour: 0 },          wall: '#fffaf2', roof: null },
    brick:      { name: '붉은 벽돌',       perPy: 1.2e6, appeal: { res: 0.3, off: 0.2, uni: 0.8, tour: 0.8 },  wall: '#c9785f', roof: '#8d5a4a' },
    hanok:      { name: '한옥',            perPy: 3e6,   appeal: { res: 0.4, off: 0.1, uni: 0.4, tour: 1.5 },  wall: '#efe2c8', roof: '#4e5a63' },
    glass:      { name: '모던 유리',       perPy: 2.5e6, appeal: { res: 0.2, off: 1.2, uni: 0.4, tour: 0.6 },  wall: '#bfe0ee', roof: null },
    european:   { name: '유럽풍 타운하우스', perPy: 2e6, appeal: { res: 0.8, off: 0.3, uni: 0.5, tour: 1.0 },  wall: '#f3e1c4', roof: '#6f8fae' },
    japanese:   { name: '목조 주택',       perPy: 1.8e6, appeal: { res: 0.9, off: 0.2, uni: 0.6, tour: 0.8 },  wall: '#d8b48c', roof: '#5a4a42' },
    container:  { name: '컨테이너',        perPy: 1e6,   appeal: { res: 0.1, off: 0.3, uni: 1.2, tour: 0.6 },  wall: '#6f9fb8', roof: null },
    greenhouse: { name: '글래스하우스',    perPy: 2.2e6, appeal: { res: 0.7, off: 0.4, uni: 0.7, tour: 1.2 },  wall: '#d6eedb', roof: '#a8d4b4' },
  };
  const ARCH_KEYS = Object.keys(ARCH);

  // ---------- 시설·공공 ----------
  const FAC = {
    warehouse: { name: '물류센터', icon: '📦', cost: 12e8, upkeep: 2.5e7, range: 9, cap: 10, desc: '반경 9칸 매장에 식자재를 모아 배송. 식자재 원가 -12%' },
    kitchen:   { name: '중앙주방', icon: '🍳', cost: 25e8, upkeep: 4e7,   range: 9, cap: 8,  desc: '반경 9칸 음식 매장 원가 -18%, 품질 +8%' },
    roastery:  { name: '로스터리', icon: '🫘', cost: 8e8,  upkeep: 1.5e7, desc: '회사 전체 카페 원두값 -35%, 품질 +6% (한 곳만)' },
  };
  const PUBLIC = {
    park: { name: '공원',       icon: '🌳', cost: 5e8, desc: '관광객이 찾아오고 2칸 안 매장 매력 +10%, 주변 개발 촉진' },
    bus:  { name: '버스정류장', icon: '🚏', cost: 6e7, desc: '출퇴근 인구 유입, 주변 건물 성장 촉진' },
  };

  // ---------- 이벤트 ----------
  const STORE_EVENTS = {
    oneplus: { name: '1+1 프로모션',   days: 7,  cost: 0,     demand: 1.5,  cogs: 1.5, desc: '7일간 손님 +50%, 대신 원가가 1.5배' },
    season:  { name: '시즌 한정 메뉴', days: 30, cost: 3e6,   demand: 1.12, quality: 1.1, desc: '30일간 품질 +10%, 손님 +12%' },
    stamp:   { name: '스탬프 적립',    days: 30, cost: 5e5,   demand: 1.08, cogs: 1.03, desc: '30일간 단골 손님 +8%' },
    sns:     { name: 'SNS 체험단',     days: 14, cost: 1.5e6, demand: 1.2,  segs: ['uni', 'tour'], desc: '14일간 대학생·관광객 +20%, 인지도 상승' },
  };
  const CO_EVENTS = {
    collab:   { name: '브랜드 콜라보 굿즈', days: 21, cost: 5e7, demand: 1.25, brand: 6, desc: '한 업종 전 매장 21일간 손님 +25%, 인지도 +6' },
    campaign: { name: '온라인 광고 캠페인', days: 0,  cost: 3e7, brand: 8, desc: '한 업종 인지도 +8' },
    app:      { name: '멤버십 앱 출시',     days: 0,  cost: 2e8, once: true, desc: '모든 매장 단골 손님 +6% (영구, 한 번만)' },
    csr:      { name: '지역 상생 캠페인',   days: 0,  cost: 3e7, brand: 3, desc: '모든 업종 인지도 +3, 직원 사기 +8' },
  };

  // ---------- 회사 ----------
  const LOGO_SHAPES = ['circle', 'square', 'leaf', 'cloud', 'heart', 'star'];
  const AI_PROFILES = [
    { name: '구름커피',       color: '#7fa7d6', logo: 'cloud', focus: ['cafe', 'dessert', 'bubbletea'], pricing: 1.0,  aggr: 1.0,  style: 'nordic' },
    { name: '보리밭베이커리', color: '#e3a07f', logo: 'leaf',  focus: ['bakery', 'cafe', 'brunch'], pricing: 0.95, aggr: 0.85, style: 'wood' },
    { name: '한그릇푸드',     color: '#86b98f', logo: 'square', focus: ['noodle', 'hansik', 'chinese'], pricing: 1.05, aggr: 1.1, style: 'industrial' },
  ];

  // ---------- 직원 ----------
  const SURNAMES = '김이박최정강조윤장임한오서신권황안송류홍'.split('');
  const GIVEN = ['서연', '민준', '지우', '하은', '도윤', '수아', '예준', '지민', '하준', '윤서', '시우', '채원', '지호', '다은', '건우', '소율', '현우', '유나', '준서', '민서', '은우', '서아', '태민', '가은', '로운', '나연', '시온', '예린', '하람', '도아'];
  const MBTIS = ['ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP', 'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'];
  const GOLDEN = new Set(['INFP-ENFJ', 'INFP-ENTJ', 'ENFP-INFJ', 'ENFP-INTJ', 'INFJ-ENTP', 'INTJ-ENTP', 'INTP-ENTJ', 'INTP-ESTJ', 'ISFP-ENFJ', 'ISFP-ESFJ', 'ISFP-ESTJ', 'ESFP-ISFJ', 'ESFP-ISTJ', 'ISTP-ESFJ', 'ISTP-ESTJ', 'ESTP-ISFJ']);
  const ROLES = { kitchen: '주방', hall: '홀', manager: '점장' };
  const SHIFTS = { open: '오픈조 8시간', mid: '피크 알바 5시간', close: '마감조 8시간' };

  // ---------- 유틸 ----------
  function rnd(S) {
    S.rng = (S.rng + 0x6D2B79F5) | 0;
    let t = S.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function gauss(S) { const u = Math.max(1e-9, rnd(S)), v = rnd(S); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function pick(S, arr) { return arr[Math.floor(rnd(S) * arr.length)]; }
  function wpick(S, w) { let t = 0; for (const k in w) t += w[k]; let r = rnd(S) * t; for (const k in w) { r -= w[k]; if (r <= 0) return k; } return Object.keys(w)[0]; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const r5 = v => Math.round(v / 1e5) * 1e5;

  // ---------- 달력 ----------
  const HOLIDAYS = new Set(['01-01', '03-01', '05-05', '06-06', '08-15', '10-03', '10-09', '12-25',
    '2027-02-06', '2027-02-07', '2027-02-08', '2027-09-14', '2027-09-15', '2027-09-16',
    '2028-01-25', '2028-01-26', '2028-01-27', '2028-10-02', '2028-10-03', '2028-10-04',
    '2029-02-12', '2029-02-13', '2029-02-14', '2029-09-21', '2029-09-22', '2029-09-23',
    '2030-02-02', '2030-02-03', '2030-02-04', '2030-09-11', '2030-09-12', '2030-09-13']);
  const MEONGJEOL = new Set(['2027-02-07', '2027-09-15', '2028-01-26', '2028-10-03', '2029-02-13', '2029-09-22', '2030-02-03', '2030-09-12']);
  const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
  function dateOf(S, hour) {
    hour = hour == null ? S.hour : hour;
    const day = Math.floor(hour / 24);
    const d = new Date(START + day * 86400000);
    const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, dd = d.getUTCDate(), wd = d.getUTCDay();
    const mm = String(m).padStart(2, '0'), ds = String(dd).padStart(2, '0');
    const key = `${y}-${mm}-${ds}`;
    const holiday = HOLIDAYS.has(`${mm}-${ds}`) || HOLIDAYS.has(key);
    const near = [-1, 0, 1].some(k => { const e = new Date(START + (day + k) * 86400000); return MEONGJEOL.has(e.toISOString().slice(0, 10)); });
    return { year: y, month: m, day: dd, wd, wdName: WEEK[wd], hour: hour % 24, dayIndex: day, mi: m - 1, weekend: wd === 0 || wd === 6, holiday, meongjeol: near, key };
  }
  function seasonOf(S) { const mi = dateOf(S).mi; return mi >= 2 && mi <= 4 ? 'spring' : mi >= 5 && mi <= 7 ? 'summer' : mi >= 8 && mi <= 10 ? 'autumn' : 'winter'; }
  function dayOf(S) { return Math.floor(S.hour / 24); }

  // ---------- 지도 ----------
  function tile(S, x, y) { return (x < 0 || y < 0 || x >= W || y >= H) ? null : S.tiles[y * W + x]; }
  function isLot(t) { return t && t.t === 'land' && !t.b; }
  function hoodOf(x, y) { return Math.floor(y / HOOD) * 3 + Math.floor(x / HOOD); }
  function hood(S, t) { return S.hoods[t.h]; }

  function buildMap(S) {
    S.tiles = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const road = x % ROAD_EVERY === 0 || y % ROAD_EVERY === 0;
      const t = { x, y, t: road ? 'road' : 'land', h: hoodOf(x, y), b: null, tree: false, rent: 0 };
      const lx = x - 27.5, ly = y - 27.5;
      if (!road && lx * lx + ly * ly < 11) t.t = 'water';
      S.tiles.push(t);
    }
    for (const t of S.tiles) {
      if (t.t !== 'land') continue;
      const hd = HOODS[t.h];
      const r = rnd(S);
      if (r < hd.dev) t.b = { k: wpick(S, hd.mix), lv: hd.kind === 'off' ? 1 + Math.floor(rnd(S) * 3) : 1 + Math.floor(rnd(S) * 2) };
      else if (r < hd.dev + 0.18) t.tree = true;
    }
    const p = tile(S, 26, 25);
    if (p && p.t === 'land') { p.b = { k: 'park', lv: 1 }; p.tree = false; }
  }

  function computeLand(S) {
    const parks = S.tiles.filter(t => t.b && t.b.k === 'park');
    for (const t of S.tiles) {
      if (t.t !== 'land') { t.rent = 0; continue; }
      const hd = S.hoods[t.h];
      let v = HOODS[t.h].rent * hd.rentMult;
      let dens = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const n = tile(S, t.x + dx, t.y + dy);
        if (n && n.b && SEG[n.b.k]) dens += n.b.lv;
      }
      v *= 1 + dens * 0.012;
      for (const p of parks) if (dist(p, t) <= 3) { v *= 1.06; break; }
      t.rent = Math.round(v / 1000) * 1000;
    }
  }

  function sources(S) {
    const out = [];
    for (const t of S.tiles) {
      if (!t.b) continue;
      const k = t.b.k, hd = S.hoods[t.h];
      let pop = 0, seg = null;
      if (SEG[k]) { seg = k; pop = SEG[k].pop * t.b.lv; }
      else if (k === 'park') { seg = 'tour'; pop = 60; }
      else if (k === 'bus') { seg = 'off'; pop = 140; }
      if (!seg) continue;
      pop *= hd.popMult * (seg === 'off' ? hd.offMult : 1);
      out.push({ x: t.x, y: t.y, seg, pop, h: t.h });
    }
    return out;
  }
  function population(S) { return Math.round(sources(S).reduce((a, s) => a + s.pop, 0)); }

  // ---------- 새 게임 ----------
  function newGame(opts) {
    opts = opts || {};
    const S = {
      v: 2, rng: (opts.seed || 20261109) | 0, hour: 6,
      tiles: [], stores: [], facs: [], companies: [], news: [], nextId: 1,
      hoods: HOODS.map(h => ({ hype: h.hype || 0, rentMult: 1 + (h.hype || 0) / 250, popMult: 1, offMult: 1, transit: false, festival: 0 })),
      ingr: {}, trends: {}, econ: { mult: 1, until: 0 }, minWage: BASE_MIN_WAGE, nextMinWage: null,
      founder: { cash: 0 }, quests: {}, distress: 0, gameOver: false, autoHire: true,
      weather: null, cands: [], stats: { pop: [] }, day: null,
    };
    buildMap(S);
    computeLand(S);
    for (const k in INGR) S.ingr[k] = { p: INGR[k].base, hist: [INGR[k].base] };
    const player = makeCompany(S, 0, opts.name || '모락상회', opts.color || '#f2b950', true);
    player.logo = opts.logo || 'circle';
    player.cash = 5e8;
    S.companies.push(player);
    AI_PROFILES.forEach((p, i) => {
      const c = makeCompany(S, i + 1, p.name, p.color, false);
      c.logo = p.logo;
      c.ai = { focus: p.focus, pricing: p.pricing, aggr: p.aggr, style: p.style };
      c.cash = 30e8; c.listed = true;
      for (const cat of p.focus) c.brand[cat] = 15 + rnd(S) * 10;
      c.recipe[p.focus[0]] = 2;
      S.companies.push(c);
    });
    startDay(S, true);
    for (const c of S.companies) {
      if (!c.ai) continue;
      for (let i = 0; i < 4; i++) {
        const cat = c.ai.focus[i % c.ai.focus.length];
        const spot = bestLot(S, cat, c.id, 40);
        if (spot) openStore(S, c.id, spot.x, spot.y, cat, { size: 2, style: c.ai.style, tier: 2, free: true });
      }
    }
    refreshCands(S);
    computeDemand(S);
    assignSupply(S);
    for (const c of S.companies) {
      c.value = valuation(S, c);
      if (c.ai) { c.shares = Math.round(c.value / 25000 / 1000) * 1000; c.founderShares = Math.round(c.shares * 0.4); }
      c.price = c.value / c.shares; c.priceHist = [c.price];
    }
    log(S, '🌱 모락모락 타운에 오신 것을 환영합니다. 상권을 살펴보고 첫 가게 자리를 골라보세요.', 'info');
    return S;
  }

  function makeCompany(S, id, name, color, isPlayer) {
    const brand = {}, recipe = {}, fr = {};
    for (const k of CAT_KEYS) { brand[k] = 0; recipe[k] = 1; fr[k] = { on: false, royalty: 0.04 }; }
    return {
      id, name, color, logo: 'circle', isPlayer, cash: 0, debt: 0,
      shares: 1e6, founderShares: isPlayer ? 1e6 : 0, listed: false,
      price: 0, priceHist: [], value: 0, brand, recipe, fr, frStyle: 'wood',
      roastery: false, farm: false, app: false, dividend: 0, holdings: {}, ev: [],
      cur: blankLedger(), months: [], dailyNI: [], storeHist: [], dead: false, ai: null, _prev: 0,
    };
  }
  function blankLedger() { return { rev: 0, royalty: 0, cogs: 0, wage: 0, rent: 0, util: 0, card: 0, mkt: 0, upkeep: 0, interest: 0, dep: 0, tax: 0, other: 0, capex: 0, served: 0 }; }
  function ledgerNI(L) { return L.rev + L.royalty - L.cogs - L.wage - L.rent - L.util - L.card - L.mkt - L.upkeep - L.interest - L.dep; }

  function log(S, text, kind) {
    S.news.unshift({ hour: S.hour, text, kind: kind || 'info' });
    if (S.news.length > 120) S.news.length = 120;
  }

  // ---------- 직원 ----------
  function statRoll(S, mean, sd) { return Math.round(clamp(mean + gauss(S) * sd, 10, 98)); }
  function makeStaff(S, role, quality) {
    const q = quality == null ? 50 : quality;
    const s = {
      id: S.nextId++, name: pick(S, SURNAMES) + pick(S, GIVEN), role,
      skill: statRoll(S, q, 15), speed: statRoll(S, q, 15), clean: statRoll(S, q, 15), star: statRoll(S, q - 5, 18),
      mbti: pick(S, MBTIS), morale: 70, fatigue: 0, shift: 'open', days: 0, wage: 0,
    };
    if (rnd(S) < 0.06) s.star = statRoll(S, 88, 5);
    s.wage = askWage(S, s);
    return s;
  }
  function askWage(S, s) {
    const avg = (s.skill + s.speed + s.clean + s.star * 0.5) / 3.5;
    const prem = Math.max(0, avg - 45) / 100 * 0.9 + (s.role === 'manager' ? 0.35 : 0);
    return Math.round(S.minWage * (1 + prem) / 10) * 10;
  }
  function effStat(s, k) {
    let v = s[k];
    if (k === 'star' && s.mbti[0] === 'E' && s.role !== 'kitchen') v += 5;
    if (k === 'clean' && s.mbti[3] === 'J') v += 6;
    if (k === 'speed' && s.mbti[3] === 'P') v += 3;
    return clamp(v, 0, 100);
  }
  function compat(a, b) {
    let s = 0;
    s += a[1] === b[1] ? 0.5 : -0.4;
    s += a[0] !== b[0] ? 0.25 : 0;
    s += a[2] === b[2] ? 0.15 : -0.1;
    s += a[3] !== b[3] ? 0.1 : 0.05;
    if (GOLDEN.has(a + '-' + b) || GOLDEN.has(b + '-' + a)) s += 0.4;
    return clamp(s, -1, 1);
  }
  function chemistry(st) {
    const L = st.staff; if (L.length < 2) return { mult: 1, avg: 0, pairs: [] };
    let sum = 0, wsum = 0; const pairs = [];
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const c = compat(L[i].mbti, L[j].mbti);
      const w = (L[i].role === 'manager' || L[j].role === 'manager') ? 2 : (L[i].shift === L[j].shift ? 1.5 : 0.6);
      sum += c * w; wsum += w; pairs.push({ a: L[i].id, b: L[j].id, c });
    }
    const avg = sum / wsum;
    return { mult: 1 + 0.1 * avg, avg, pairs };
  }
  function shiftWindow(st, shift) {
    if (shift === 'open') return [st.open, Math.min(st.close, st.open + 8)];
    if (shift === 'close') return [Math.max(st.open, st.close - 8), st.close];
    const a = clamp(11, st.open, Math.max(st.open, st.close - 5));
    return [a, Math.min(st.close, a + 5)];
  }
  function onDuty(st, s, h) { const [a, b] = shiftWindow(st, s.shift); return h >= a && h < b; }
  function hourCap(st, h) {
    let k = 0, hall = 0, mgr = false;
    const cat = CATS[st.cat];
    for (const s of st.staff) {
      if (!onDuty(st, s, h)) continue;
      const eff = (0.6 + 0.8 * effStat(s, 'speed') / 100) * (0.75 + 0.25 * s.morale / 100) * (1 - s.fatigue / 250);
      if (s.role === 'kitchen') k += eff * cat.rate;
      else if (s.role === 'hall') hall += eff * HALL_RATE;
      else { k += eff * cat.rate * 0.5; hall += eff * HALL_RATE * 0.5; mgr = true; }
    }
    if (st._mi) k *= st._mi.complexity;
    if (mgr) { k *= 1.08; hall *= 1.08; }
    if (hall === 0) { hall = k * 0.6; k *= 0.7; }
    const seats = SIZES[st.size].py * 1.3;
    const seatCap = seats / cat.dwell / (1 - cat.takeout);
    return Math.max(0, Math.min(k, hall, seatCap) * st._chem);
  }
  function seatCapOf(st) { const cat = CATS[st.cat]; return SIZES[st.size].py * 1.3 / cat.dwell / (1 - cat.takeout); }
  // 가장 바빴던 시간에 좌석이 아니라 직원이 병목이었는지
  function staffBound(st) { const h = st.hourLost.indexOf(Math.max(...st.hourLost)); return st.hourCap[h] < seatCapOf(st) * 0.92; }
  function teamStats(st) {
    const L = st.staff;
    const avg = (arr, k) => arr.length ? arr.reduce((a, s) => a + effStat(s, k), 0) / arr.length : 0;
    const kit = L.filter(s => s.role !== 'hall'), hall = L.filter(s => s.role !== 'kitchen');
    const skill = kit.length ? avg(kit, 'skill') : 25;
    const clean = L.length ? (avg(L, 'clean') * 0.6 + avg(hall.length ? hall : L, 'clean') * 0.4) : 30;
    const stars = hall.map(s => effStat(s, 'star'));
    const star = stars.length ? Math.max(...stars) * 0.6 + stars.reduce((a, b) => a + b, 0) / stars.length * 0.4 : 30;
    return { skill, clean, star };
  }
  function laborDay(S, st) {
    let c = 0;
    for (const s of st.staff) { const [a, b] = shiftWindow(st, s.shift); c += Math.max(0, b - a) * s.wage * BURDEN; }
    return c;
  }
  function refreshCands(S) {
    S.cands = [];
    for (let i = 0; i < 9; i++) {
      const role = i < 4 ? 'kitchen' : i < 8 ? 'hall' : 'manager';
      const q = rnd(S) < 0.15 ? 70 : 48;
      S.cands.push(makeStaff(S, role, q));
    }
  }
  // 기대 수요에 맞춰 기본 팀 구성 (새 매장·AI·가맹점·자동 충원용)
  function idealTeam(S, st) {
    const cat = CATS[st.cat];
    let peak = 0;
    for (let h = st.open; h < st.close; h++) peak = Math.max(peak, wantAt(S, st, h));
    peak = Math.max(peak, 12);
    const seats = SIZES[st.size].py * 1.3 / cat.dwell / (1 - cat.takeout);
    peak = Math.min(peak, seats) * 0.7;
    const kPer = Math.max(1, Math.ceil(peak / (cat.rate * 0.85)));
    const hPer = Math.ceil(peak / (HALL_RATE * 0.85));
    const solo = peak < cat.rate * 0.55;   // 손님이 적으면 한 명이 주문·제조를 같이 맡음
    const twoShift = st.close - st.open > 9;
    const team = [];
    for (const sh of twoShift ? ['open', 'close'] : ['open']) {
      for (let i = 0; i < Math.min(kPer, 4); i++) team.push(['kitchen', sh]);
      if (!solo) for (let i = 0; i < Math.min(Math.max(1, hPer), 3); i++) team.push(['hall', sh]);
    }
    return team;
  }
  function autoStaff(S, st, quality) {
    const team = idealTeam(S, st);
    const have = st.staff.map(s => s.role + ':' + s.shift);
    for (const [role, sh] of team) {
      const key = role + ':' + sh;
      const i = have.indexOf(key);
      if (i >= 0) { have.splice(i, 1); continue; }
      const s = makeStaff(S, role, quality); s.shift = sh; st.staff.push(s);
    }
    st._chem = chemistry(st).mult;
  }

  // ---------- 비용 ----------
  function interiorCost(size, style, tier) { return r5(SIZES[size].py * TIERS[tier].perPy * STYLES[style].cost); }
  function openCost(S, cat, x, y, size, style, tier) {
    const t = tile(S, x, y);
    const rent = Math.round((t ? t.rent : 80000) * SIZES[size].py / 1e4) * 1e4;
    const deposit = rent * 10;
    const interior = interiorCost(size, style, tier);
    const equip = r5(CATS[cat].equip * (0.7 + 0.15 * size));
    const misc = 5e6;
    return { rent, deposit, interior, equip, misc, total: deposit + interior + equip + misc };
  }
  function utilMonth(st) { const py = SIZES[st.size].py; return py * 20000 + py * (st.close - st.open) * 1200; }
  function propertyPrice(S, st) { const t = tile(S, st.x, st.y); return r5(t.rent * SIZES[st.size].py * 12 / 0.045); }
  function archCost(st, key) { return r5(SIZES[st.size].py * ARCH[key].perPy * 1.6); }
  function researchCost(c, cat) { return r5(2e7 * Math.pow(c.recipe[cat], 1.5)); }
  function upgradeCost(S, st) {
    if (st.size >= 3) return 0;
    const add = SIZES[st.size + 1].py - SIZES[st.size].py;
    return r5(add * TIERS[st.interior.tier].perPy * STYLES[st.interior.style].cost + CATS[st.cat].equip * 0.3);
  }
  function interiorBook(S, st) { const age = dayOf(S) - st.interior.day; return st.interior.cost * Math.max(0, 1 - age / 1825); }
  function equipBook(S, st) { const age = dayOf(S) - st.opened; return st.equip * Math.max(0, 1 - age / 1825); }
  function spaceScore(st) {
    const i = st.interior;
    const tierPts = [0, 30, 50, 72, 92][i.tier];
    const arch = st.arch && st.arch !== 'basic' ? 8 : 0;
    return Math.round(clamp(tierPts * (0.55 + 0.45 * i.cond / 100) + arch, 0, 100));
  }
  function keyMoney(S, st) {
    const mp = Math.max(0, st.profitAvg * 30.4);
    return r5(mp * 10 * (0.5 + spaceScore(st) / 200) + interiorBook(S, st) * 0.2);
  }

  function unitCost(S, comp, st) {
    const cat = CATS[st.cat];
    const base = (st._mi ? st._mi.ticket * st._mi.cost : cat.ticket * cat.cogs) / VAT;
    let idx = 0;
    for (const k in cat.recipe) {
      if (k === 'etc') { idx += cat.recipe[k]; continue; }
      let p = S.ingr[k].p / INGR[k].base;
      if (k === 'bean' && comp.roastery) p *= 0.65;
      if ((k === 'meat' || k === 'veg') && comp.farm) p *= 0.85;
      idx += cat.recipe[k] * p;
    }
    const mode = st.supply;
    const m = mode === 'kitchen' ? (cat.food ? 0.82 : 0.88) : mode === 'warehouse' ? 0.88 : 1.08;
    const waste = 1 + Math.max(0, 50 - (st._skill || 50)) / 50 * 0.06;
    let ev = 1; for (const e of st.ev) if (e.until > S.hour && STORE_EVENTS[e.kind].cogs) ev *= STORE_EVENTS[e.kind].cogs;
    return base * idx * m * waste * ev;
  }
  function menuItems(st) { const C = CATS[st.cat]; const ids = st.menu && st.menu.length ? st.menu : defaultMenu(st.cat, st.size); return C.menu.filter(m => ids.includes(m.id)); }
  function inSeason(m, mi) { return m.season ? m.season.includes(mi) : null; }
  function menuInfo(S, st) {
    const C = CATS[st.cat], items = menuItems(st), mi = S.day ? S.day.mi : 2;
    let wsum = 0, psum = 0, csum = 0, diff = 0;
    const segA = { res: [], off: [], uni: [], tour: [] };
    for (const m of items) {
      const sea = inSeason(m, mi);
      let w = (st.sig === m.id ? 2 : 1) * (sea === true ? 1.3 : sea === false ? 0.4 : 1);
      const af = sea === true ? 1.2 : sea === false ? 0.6 : 1;
      wsum += w; psum += m.price * w; csum += m.cost * m.price * w; if (m.diff) diff++;
      for (const k of SEG_KEYS) segA[k].push(m.appeal[k] * af * (st.sig === m.id ? 1.08 : 1));
    }
    const n = items.length, appeal = {};
    for (const k of SEG_KEYS) {
      const a = segA[k].slice().sort((x, y) => y - x);
      const top = a.slice(0, 3), mean = x => x.reduce((p, q) => p + q, 0) / Math.max(1, x.length);
      appeal[k] = (0.7 * mean(top) + 0.3 * mean(a)) * (0.9 + 0.025 * Math.min(n, 9));
    }
    const avg = psum / Math.max(1, wsum);
    return { n, avg, ticket: avg * C.per, cost: csum / Math.max(1, psum), appeal, complexity: clamp(1.12 - 0.03 * n - 0.04 * diff, 0.7, 1.1), diff };
  }
  function refreshMenu(S, st) { st._mi = menuInfo(S, st); return st._mi; }
  function ticket(st) { const base = st._mi ? st._mi.ticket : CATS[st.cat].ticket; return Math.round(base * st.price / 1e4) * 100; }
  function setMenu(S, id, ids, sig) {
    const st = S.stores.find(s => s.id === id); if (!st) return { ok: false };
    const max = SIZES[st.size].menu;
    if (ids.length < 2) return { ok: false, msg: '메뉴는 최소 2개가 필요해요.' };
    if (ids.length > max) return { ok: false, msg: `${SIZES[st.size].name} 매장은 메뉴를 ${max}개까지 둘 수 있어요.` };
    const added = ids.filter(x => !(st.menu || []).includes(x)).length;
    const cost = added * 5e5, c = S.companies[st.owner];
    if (c.cash < cost) return { ok: false, msg: '자금이 부족해요.' };
    c.cash -= cost; c.cur.other -= cost;
    st.menu = ids.slice(); st.sig = ids.includes(sig) ? sig : null;
    refreshMenu(S, st); computeDemand(S);
    return { ok: true, cost };
  }

  function quality(S, st) {
    const comp = S.companies[st.owner];
    let q = 1 + 0.07 * (comp.recipe[st.cat] - 1);
    q *= 0.8 + 0.4 * (st._skill == null ? 50 : st._skill) / 100;
    if (st.supply === 'kitchen' && CATS[st.cat].food) q *= 1.08;
    if (st.cat === 'cafe' && comp.roastery) q *= 1.06;
    for (const e of st.ev) if (e.until > S.hour && STORE_EVENTS[e.kind].quality) q *= STORE_EVENTS[e.kind].quality;
    return q;
  }
  function interiorAppeal(st, seg) {
    const i = st.interior, m = STYLES[i.style].appeal[seg];
    return (0.85 + 0.15 * i.cond / 100) * (1 + (i.tier - 1) * 0.09 * (0.5 + m));
  }
  function archAppeal(st, seg) { return st.owned && st.arch && st.arch !== 'basic' ? 1 + 0.1 * ARCH[st.arch].appeal[seg] : 1; }
  function eventMult(S, st, seg) {
    let m = 1;
    for (const e of st.ev) { if (e.until <= S.hour) continue; const E = STORE_EVENTS[e.kind]; if (!E.demand) continue; if (E.segs && !E.segs.includes(seg)) continue; m *= E.demand; }
    const comp = S.companies[st.owner];
    for (const e of comp.ev) if (e.until > S.hour && e.cat === st.cat && CO_EVENTS[e.kind].demand) m *= CO_EVENTS[e.kind].demand;
    if (comp.app && seg !== 'tour') m *= 1.06;
    for (const e of st.buzz || []) if (e.until > S.hour) m *= e.mult;
    if (dayOf(S) - st.opened < 10) m *= 1.25;
    return m;
  }
  function attraction(S, st, seg) {
    const comp = S.companies[st.owner];
    const sens = SEG[seg].sens * (1 - 0.07 * (st.interior.tier - 1));
    const pf = clamp(Math.exp(-sens * 1.8 * (st.price / 100 - 1)), 0.05, 3);
    const rf = 0.55 + 0.15 * st.rating;
    const star = 1 + ((st._star == null ? 50 : st._star) - 50) / 100 * 0.3;
    return quality(S, st) * (st._mi ? st._mi.appeal[seg] : 1) * (1 + comp.brand[st.cat] / 110) * pf * rf * (1 + 0.06 * st.mkt) * interiorAppeal(st, seg) * archAppeal(st, seg) * star * eventMult(S, st, seg);
  }

  // ---------- 하루 상황 ----------
  const TEMP = [-2, 1, 7, 13, 18, 23, 26, 27, 22, 15, 7, 0];
  function rollWeather(S, d) {
    const mi = d.mi;
    const temp = Math.round(TEMP[mi] + gauss(S) * 3);
    const rainP = [0.08, 0.1, 0.15, 0.2, 0.22, 0.3, 0.5, 0.35, 0.22, 0.15, 0.18, 0.1][mi];
    let kind = 'sun';
    const r = rnd(S);
    if (r < rainP) kind = temp <= 1 ? 'snow' : 'rain';
    else if (r < rainP + 0.25) kind = 'cloud';
    if (kind !== 'rain' && kind !== 'snow' && temp >= 31) kind = 'heat';
    if (kind !== 'snow' && temp <= -8) kind = 'cold';
    return { kind, temp };
  }
  const WEATHER = {
    sun:   { name: '맑음', icon: '☀️', all: 1.03 },
    cloud: { name: '흐림', icon: '⛅', all: 1 },
    rain:  { name: '비',   icon: '🌧️', all: 0.84, tour: 0.75, cat: { cafe: 1.05, noodle: 1.12 } },
    snow:  { name: '눈',   icon: '🌨️', all: 0.78, tour: 0.8, cat: { noodle: 1.15, cafe: 1.05 } },
    heat:  { name: '폭염', icon: '🥵', all: 0.92, cat: { dessert: 1.28, cafe: 1.12, noodle: 0.82 } },
    cold:  { name: '한파', icon: '🥶', all: 0.85, tour: 0.8, cat: { noodle: 1.22, dessert: 0.85 } },
  };
  function segDayMult(S, d, seg) {
    let m = 1;
    const off = d.weekend || d.holiday;
    if (seg === 'off') m = off ? 0.22 : 1;
    if (seg === 'uni') { m = off ? 0.6 : 1; if ([0, 1, 6, 7].includes(d.mi)) m *= 0.55; }
    if (seg === 'res') m = off ? 1.3 : 0.92;
    if (seg === 'tour') m = d.holiday ? 1.8 : d.weekend ? 1.6 : 0.7;
    if (d.meongjeol) m *= seg === 'tour' ? 0.9 : 0.45;
    const w = WEATHER[S.weather.kind];
    m *= seg === 'tour' && w.tour ? w.tour : w.all;
    return m * S.econ.mult;
  }

  function startDay(S, first) {
    const d = dateOf(S);
    S.weather = rollWeather(S, d);
    S.day = d;
    if (first) return;
    // 직원 하루 회복·사기·이직
    for (const st of S.stores) {
      const comp = S.companies[st.owner];
      const ch = chemistry(st); st._chem = ch.mult;
      const mgr = st.staff.some(s => s.role === 'manager');
      for (const s of st.staff.slice()) {
        s.fatigue *= 0.5; s.days++;
        if (s.role !== 'hall' && s.skill < 90 && rnd(S) < 0.05) s.skill++;
        const ask = askWage(S, s);
        const mine = ch.pairs.filter(p => p.a === s.id || p.b === s.id);
        const rel = mine.length ? mine.reduce((a, p) => a + p.c, 0) / mine.length : 0;
        const target = 62 + (s.wage / ask - 1) * 150 + rel * 22 + (mgr ? 6 : 0) - s.fatigue * 0.4 + (st.rating - 3) * 5 + (s._bonus || 0);
        s.morale = clamp(s.morale + (target - s.morale) * 0.12, 0, 100);
        if (s._bonus) s._bonus *= 0.9;
        if (s.morale < 35 && rnd(S) < (35 - s.morale) / 350) {
          st.staff.splice(st.staff.indexOf(s), 1);
          if (comp.isPlayer && !st.franchise) log(S, `👋 ${s.name}(${ROLES[s.role]}, ${s.mbti})님이 사기가 떨어져 그만뒀어요.`, 'warn');
          if (comp.ai || st.franchise || S.autoHire) { const n = makeStaff(S, s.role, comp.ai ? 50 : 46); n.shift = s.shift; st.staff.push(n); }
        }
      }
      if (st.staff.length >= 2 && ch.avg < -0.25 && rnd(S) < 0.02 && comp.isPlayer && !st.franchise) {
        for (const s of st.staff) s.morale -= 8;
        log(S, `💢 ${hoodName(S, st)} ${CATS[st.cat].name}에서 직원끼리 다툼이 있었어요. 성향이 잘 맞는 사람으로 팀을 꾸려 보세요.`, 'warn');
      }
      if ((comp.ai || st.franchise) && rnd(S) < 0.05) autoStaff(S, st, comp.ai ? 50 : 46);
      else if (comp.isPlayer && S.autoHire && st.staff.length < 16 && staffBound(st) && st.dayLost * ticket(st) / VAT * (1 - CATS[st.cat].cogs) * 0.7 > S.minWage * 5 * BURDEN * 2 && rnd(S) < 0.25) {
        const kit = st.staff.filter(s => s.role !== 'hall').length, hall = st.staff.filter(s => s.role === 'hall').length;
        const n = makeStaff(S, kit * CATS[st.cat].rate <= hall * HALL_RATE ? 'kitchen' : 'hall', 46);
        const busiest = st.hourLost.indexOf(Math.max(...st.hourLost));
        n.shift = busiest >= 11 && busiest < 16 ? 'mid' : busiest < 11 ? 'open' : 'close';
        st.staff.push(n);
        log(S, `🧑‍🍳 ${hoodName(S, st)} ${CATS[st.cat].name}에 손님이 몰려 ${ROLES[n.role]} 직원 ${n.name}님을 자동으로 뽑았어요.`, 'info');
      }
      else if (comp.isPlayer && S.autoHire && !st.franchise && st.staff.length > idealTeam(S, st).length + 1 && st.dayLost < 3 && rnd(S) < 0.08) {
        const extra = st.staff.filter(x => !x.hired && x.role !== 'manager').sort((a, b) => (a.skill + a.speed + a.clean) - (b.skill + b.speed + b.clean))[0];
        if (extra) { st.staff.splice(st.staff.indexOf(extra), 1); log(S, `📄 ${hoodName(S, st)} ${CATS[st.cat].name}이 한가해져 ${extra.name}님과 계약을 끝냈어요. (자동 인력 관리)`, 'info'); }
      }
      st._chem = chemistry(st).mult;
      // 인테리어 노후
      st.interior.cond = clamp(st.interior.cond - 0.04 * (1.5 - (st._clean || 50) / 100), 20, 100);
    }
    if (d.wd === 1) refreshCands(S);
    computeDemand(S);
  }

  function hoodName(S, st) { return HOODS[tile(S, st.x, st.y).h].name; }

  function computeDemand(S) {
    const d = S.day; const srcs = sources(S);
    const parks = S.tiles.filter(t => t.b && t.b.k === 'park');
    for (const st of S.stores) {
      refreshMenu(S, st);
      const ts = teamStats(st); st._skill = ts.skill; st._clean = ts.clean; st._star = ts.star;
      st.segDem = { res: 0, off: 0, uni: 0, tour: 0 };
      st._attr = {}; for (const seg of SEG_KEYS) st._attr[seg] = attraction(S, st, seg);
      st._pb = parks.some(p => dist(p, st) <= 2) ? 1.1 : 1;
    }
    const segM = {}; for (const seg of SEG_KEYS) segM[seg] = segDayMult(S, d, seg);
    for (const cat of CAT_KEYS) {
      const list = S.stores.filter(s => s.cat === cat);
      if (!list.length) continue;
      const w = WEATHER[S.weather.kind];
      const C = CATS[cat];
      const catM = (d.weekend || d.holiday ? C.weekend || 1 : 1) * (d.wd === 5 || d.wd === 6 ? C.fri || 1 : 1) * SEASON[cat][d.mi] * (w.cat && w.cat[cat] || 1) * (S.trends[cat] && S.trends[cat].until > S.hour ? S.trends[cat].mult : 1);
      for (const src of srcs) {
        const hd = S.hoods[src.h];
        const hype = 1 + hd.hype / 100 * (src.seg === 'tour' || src.seg === 'uni' ? 0.8 : 0.15) + (hd.festival > S.hour ? 0.5 : 0);
        const D = src.pop * APPETITE[cat][src.seg] * segM[src.seg] * catM * hype;
        if (D <= 0) continue;
        let sum = 0; const sc = [];
        for (const st of list) {
          const dd = dist(st, src); if (dd > REACH) continue;
          const a = st._attr[src.seg] * st._pb / (1 + 0.5 * dd);
          sc.push(st, a); sum += a;
        }
        if (!sc.length) continue;
        const den = sum + OUTSIDE;
        for (let i = 0; i < sc.length; i += 2) sc[i].segDem[src.seg] += D * sc[i + 1] / den;
      }
    }
  }
  function wantAt(S, st, h) {
    if (!st.segDem) return 0;
    let v = 0; for (const seg of SEG_KEYS) v += st.segDem[seg] * PROFILE[st.cat][seg][h];
    return v;
  }
  function dayDemand(st) { return st.segDem ? SEG_KEYS.reduce((a, s) => a + st.segDem[s], 0) : 0; }

  // ---------- 매장 ----------
  function openStore(S, compId, x, y, cat, opt) {
    opt = opt || {};
    const t = tile(S, x, y);
    if (!isLot(t)) return { ok: false, msg: '빈 땅에만 지을 수 있어요.' };
    const comp = S.companies[compId];
    const size = opt.size || 2, style = opt.style || 'wood', tier = opt.tier || 2;
    const cost = openCost(S, cat, x, y, size, style, tier);
    if (!opt.free && !opt.franchise) {
      if (comp.cash < cost.total) return { ok: false, msg: `자금이 부족해요. ${won(cost.total)}이 필요해요.` };
      comp.cash -= cost.total; comp.cur.capex += cost.total - cost.deposit;
    }
    const st = {
      id: S.nextId++, x, y, cat, owner: compId, franchise: !!opt.franchise, size,
      price: Math.round(100 * (comp.ai ? comp.ai.pricing : 1)), open: CATS[cat].hours[0], close: CATS[cat].hours[1],
      mkt: comp.ai ? 1 : 0, owned: false, propValue: 0, arch: 'basic',
      interior: { style, tier, cond: 100, cost: cost.interior, day: dayOf(S) },
      equip: cost.equip, deposit: cost.deposit, rent: cost.rent, leaseDay: dayOf(S), opened: dayOf(S),
      menu: opt.menu && opt.menu.length ? opt.menu.slice(0, SIZES[size].menu) : defaultMenu(cat, size), sig: opt.sig || null,
      staff: [], ev: [], buzz: [], segDem: null, _chem: 1,
      hourly: new Array(24).fill(0), hourLost: new Array(24).fill(0), hourCap: new Array(24).fill(0),
      served: 0, lost: 0, rev: 0, profit: 0, dayServed: 0, dayLost: 0, dayRev: 0, dayCost: 0,
      profitAvg: 0, lossDays: 0, rating: 3.2, m: { rev: 0, profit: 0, cust: 0 }, lm: null, supply: 'direct', facId: null,
    };
    refreshMenu(S, st);
    S.stores.push(st);
    t.b = { k: 'store', id: st.id }; t.tree = false;
    assignSupply(S);
    if (S.day) computeDemandFor(S, st);
    autoStaff(S, st, comp.ai ? 50 : opt.franchise ? 46 : 48);
    computeDemandFor(S, st);
    return { ok: true, store: st, cost };
  }
  function computeDemandFor(S, st) { computeDemand(S); void st; }

  function closeStore(S, id, silent) {
    const i = S.stores.findIndex(s => s.id === id);
    if (i < 0) return { ok: false };
    const st = S.stores[i];
    const comp = S.companies[st.owner];
    let refund = 0;
    if (!st.franchise) {
      const km = keyMoney(S, st);
      refund = st.deposit + km + (st.owned ? st.propValue * 0.97 : 0);
      comp.cash += refund; comp.cur.other += km;
    }
    S.stores.splice(i, 1);
    tile(S, st.x, st.y).b = null;
    assignSupply(S);
    if (!silent && comp.isPlayer) log(S, `${CATS[st.cat].icon} 매장을 정리했어요. 보증금·권리금${st.owned ? '·건물 매각' : ''} ${won(refund)} 회수`, 'info');
    return { ok: true, refund };
  }

  function setInterior(S, id, style, tier) {
    const st = S.stores.find(s => s.id === id); if (!st || st.franchise) return { ok: false };
    const comp = S.companies[st.owner];
    const same = style === st.interior.style && tier === st.interior.tier;
    const cost = same ? r5(st.interior.cost * 0.3) : interiorCost(st.size, style, tier);
    if (comp.cash < cost) return { ok: false, msg: `자금이 부족해요. ${won(cost)}이 필요해요.` };
    comp.cash -= cost; comp.cur.capex += cost;
    if (same) st.interior.cond = 100;
    else st.interior = { style, tier, cond: 100, cost, day: dayOf(S) };
    computeDemand(S);
    return { ok: true, cost, msg: same ? '리뉴얼 공사를 마쳤어요.' : `${STYLES[style].name} ${TIERS[tier].name} 인테리어로 새 단장했어요.` };
  }
  function setArch(S, id, key) {
    const st = S.stores.find(s => s.id === id); if (!st || !st.owned) return { ok: false, msg: '건물을 먼저 매입해야 해요.' };
    const comp = S.companies[st.owner]; const cost = archCost(st, key);
    if (st.arch === key) return { ok: false, msg: '이미 이 양식이에요.' };
    if (comp.cash < cost) return { ok: false, msg: `자금이 부족해요. ${won(cost)}이 필요해요.` };
    comp.cash -= cost; comp.cur.capex += cost; st.arch = key; st.propValue += cost * 1.05;
    computeDemand(S);
    return { ok: true, msg: `${ARCH[key].name} 양식으로 건물을 다시 지었어요.` };
  }
  function upgradeStore(S, id) {
    const st = S.stores.find(s => s.id === id); if (!st || st.franchise) return { ok: false };
    const c = S.companies[st.owner];
    if (st.size >= 3) return { ok: false, msg: '가장 큰 매장이에요.' };
    const cost = upgradeCost(S, st);
    if (c.cash < cost) return { ok: false, msg: '자금이 부족해요.' };
    const t = tile(S, st.x, st.y);
    const oldPy = SIZES[st.size].py; st.size++;
    const newPy = SIZES[st.size].py;
    c.cash -= cost; c.cur.capex += cost; st.interior.cost += cost - CATS[st.cat].equip * 0.3; st.equip += CATS[st.cat].equip * 0.3;
    if (!st.owned) { const add = Math.round(t.rent * (newPy - oldPy) / 1e4) * 1e4; st.rent += add; st.deposit += add * 10; c.cash -= add * 10; }
    else st.propValue *= newPy / oldPy;
    computeDemand(S);
    return { ok: true };
  }
  function buyProperty(S, id) {
    const st = S.stores.find(s => s.id === id); if (!st || st.franchise || st.owned) return { ok: false };
    const c = S.companies[st.owner]; const cost = propertyPrice(S, st);
    if (c.cash + st.deposit < cost) return { ok: false, msg: `자금이 부족해요. 보증금을 빼고 ${won(cost - st.deposit)}이 필요해요.` };
    c.cash -= cost - st.deposit; c.cur.capex += cost; st.deposit = 0; st.owned = true; st.propValue = cost; st.rent = 0;
    return { ok: true };
  }
  function setHours(S, id, open, close) {
    const st = S.stores.find(s => s.id === id); if (!st) return { ok: false };
    if (close - open < 6 || open < 0 || close > 24) return { ok: false, msg: '최소 6시간은 열어야 해요.' };
    st.open = open; st.close = close; return { ok: true };
  }
  function runStoreEvent(S, id, kind) {
    const st = S.stores.find(s => s.id === id); if (!st) return { ok: false };
    const E = STORE_EVENTS[kind], c = S.companies[st.owner];
    if (st.ev.some(e => e.kind === kind && e.until > S.hour)) return { ok: false, msg: '이미 진행 중이에요.' };
    if (c.cash < E.cost) return { ok: false, msg: '자금이 부족해요.' };
    c.cash -= E.cost; c.cur.mkt += E.cost;
    st.ev = st.ev.filter(e => e.until > S.hour); st.ev.push({ kind, until: S.hour + E.days * 24 });
    if (kind === 'sns') c.brand[st.cat] = clamp(c.brand[st.cat] + 1.5, 0, 100);
    computeDemand(S);
    return { ok: true, msg: `${E.name}을 시작했어요.` };
  }
  function runCoEvent(S, compId, kind, cat) {
    const c = S.companies[compId], E = CO_EVENTS[kind];
    if (E.once && c.app) return { ok: false, msg: '이미 출시했어요.' };
    if (c.cash < E.cost) return { ok: false, msg: '자금이 부족해요.' };
    if (E.days && c.ev.some(e => e.kind === kind && e.cat === cat && e.until > S.hour)) return { ok: false, msg: '이미 진행 중이에요.' };
    c.cash -= E.cost; c.cur.mkt += E.cost;
    if (kind === 'app') c.app = true;
    if (E.brand) {
      const cats = kind === 'csr' ? CAT_KEYS : [cat];
      for (const k of cats) c.brand[k] = clamp(c.brand[k] + E.brand * (1 - c.brand[k] / 100), 0, 100);
    }
    if (kind === 'csr') for (const st of S.stores) if (st.owner === compId) for (const s of st.staff) s._bonus = (s._bonus || 0) + 8;
    if (E.days) { c.ev = c.ev.filter(e => e.until > S.hour); c.ev.push({ kind, cat, until: S.hour + E.days * 24 }); }
    computeDemand(S);
    return { ok: true, msg: `${E.name}${cat && kind !== 'csr' && kind !== 'app' ? ` (${CATS[cat].name})` : ''}을 진행했어요.` };
  }

  // ---------- 직원 행동 ----------
  function hire(S, storeId, candId) {
    const st = S.stores.find(s => s.id === storeId); const i = S.cands.findIndex(c => c.id === candId);
    if (!st || i < 0) return { ok: false };
    if (st.staff.length >= 16) return { ok: false, msg: '한 매장에 16명까지 둘 수 있어요.' };
    const s = S.cands.splice(i, 1)[0];
    s.hired = true;
    s.shift = st.staff.filter(x => x.shift === 'open').length <= st.staff.filter(x => x.shift === 'close').length ? 'open' : 'close';
    st.staff.push(s); st._chem = chemistry(st).mult; computeDemand(S);
    return { ok: true, msg: `${s.name}님을 ${ROLES[s.role]} 직원으로 채용했어요.` };
  }
  function fire(S, storeId, staffId) {
    const st = S.stores.find(s => s.id === storeId); if (!st) return { ok: false };
    const i = st.staff.findIndex(s => s.id === staffId); if (i < 0) return { ok: false };
    const s = st.staff.splice(i, 1)[0];
    const sev = s.days >= 365 ? s.wage * 8 * 30 * Math.floor(s.days / 365) : 0;
    S.companies[st.owner].cash -= sev; S.companies[st.owner].cur.wage += sev;
    for (const o of st.staff) o.morale -= 3;
    st._chem = chemistry(st).mult; computeDemand(S);
    return { ok: true, msg: `${s.name}님과 계약을 끝냈어요.${sev ? ` 퇴직금 ${won(sev)}` : ''}` };
  }
  function staffAct(S, storeId, staffId, act, arg) {
    const st = S.stores.find(s => s.id === storeId); if (!st) return { ok: false };
    const s = st.staff.find(x => x.id === staffId); if (!s) return { ok: false };
    const c = S.companies[st.owner];
    if (act === 'shift') s.shift = arg;
    else if (act === 'role') { s.role = arg; }
    else if (act === 'raise') { s.wage = Math.round(s.wage * 1.05 / 10) * 10; s._bonus = (s._bonus || 0) + 12; return { ok: true, msg: `${s.name}님 시급을 ${won(s.wage)}으로 올렸어요.` }; }
    else if (act === 'train') {
      const cost = 6e5; if (c.cash < cost) return { ok: false, msg: '자금이 부족해요.' };
      const keys = s.role === 'hall' ? ['speed', 'clean', 'star'] : ['skill', 'speed', 'clean'];
      const k = arg && keys.includes(arg) ? arg : keys[Math.floor(rnd(S) * keys.length)];
      const gain = 3 + Math.floor(rnd(S) * 4);
      if (s[k] >= 95) return { ok: false, msg: '이미 최고 수준이에요.' };
      c.cash -= cost; c.cur.other -= cost; s[k] = Math.min(98, s[k] + gain); s.fatigue += 15;
      if (!c.trained) c.trained = 0; c.trained++;
      st._chem = chemistry(st).mult; computeDemand(S);
      return { ok: true, msg: `${s.name}님이 교육을 마쳤어요. ${({ skill: '기술', speed: '속도', clean: '청결', star: '스타성' })[k]} +${gain}` };
    }
    st._chem = chemistry(st).mult; computeDemand(S);
    return { ok: true };
  }

  // ---------- 시설 ----------
  function buildFacility(S, compId, x, y, kind) {
    const t = tile(S, x, y); const comp = S.companies[compId]; const f = FAC[kind];
    if (!isLot(t)) return { ok: false, msg: '빈 땅에만 지을 수 있어요.' };
    if (kind === 'roastery' && comp.roastery) return { ok: false, msg: '로스터리는 한 곳이면 충분해요.' };
    if (comp.cash < f.cost) return { ok: false, msg: `자금이 부족해요. ${won(f.cost)}이 필요해요.` };
    comp.cash -= f.cost; comp.cur.capex += f.cost;
    const fac = { id: S.nextId++, x, y, kind, owner: compId, level: 1, invest: f.cost };
    S.facs.push(fac); t.b = { k: 'fac', id: fac.id }; t.tree = false;
    if (kind === 'roastery') comp.roastery = true;
    assignSupply(S); computeDemand(S);
    return { ok: true, fac };
  }
  function upgradeFacility(S, id) {
    const f = S.facs.find(x => x.id === id); if (!f) return { ok: false };
    const comp = S.companies[f.owner];
    if (f.level >= 3 || f.kind === 'roastery') return { ok: false, msg: '더 이상 확장할 수 없어요.' };
    const cost = FAC[f.kind].cost * 0.5 * f.level;
    if (comp.cash < cost) return { ok: false, msg: '자금이 부족해요.' };
    comp.cash -= cost; comp.cur.capex += cost; f.invest += cost; f.level++;
    assignSupply(S);
    return { ok: true };
  }
  function removeFacility(S, id) {
    const i = S.facs.findIndex(x => x.id === id); if (i < 0) return { ok: false };
    const f = S.facs[i]; const comp = S.companies[f.owner];
    comp.cash += f.invest * 0.4; comp.cur.other += f.invest * 0.4;
    if (f.kind === 'roastery') comp.roastery = false;
    S.facs.splice(i, 1); tile(S, f.x, f.y).b = null;
    assignSupply(S);
    return { ok: true };
  }
  function buildPublic(S, x, y, kind) {
    const t = tile(S, x, y); const comp = S.companies[0];
    if (!isLot(t)) return { ok: false, msg: '빈 땅에만 지을 수 있어요.' };
    const cost = PUBLIC[kind].cost;
    if (comp.cash < cost) return { ok: false, msg: `자금이 부족해요. ${won(cost)}이 필요해요.` };
    comp.cash -= cost; comp.cur.other -= cost;
    t.b = { k: kind, lv: 1 }; t.tree = false;
    for (const k of CAT_KEYS) comp.brand[k] = clamp(comp.brand[k] + 1, 0, 100);
    computeLand(S); computeDemand(S);
    log(S, `${PUBLIC[kind].icon} ${HOODS[t.h].name}에 ${PUBLIC[kind].name}을 기부했어요. 동네가 더 활기차질 거예요.`, 'good');
    return { ok: true };
  }
  function facRange(f) { return FAC[f.kind].range || 0; }
  function facCap(f) { return (FAC[f.kind].cap || 0) * f.level; }
  function assignSupply(S) {
    for (const st of S.stores) { st.supply = 'direct'; st.facId = null; }
    for (const c of S.companies) {
      if (c.dead) continue;
      const mine = S.stores.filter(s => s.owner === c.id);
      if (c.ai) { if (mine.length >= 8) for (const s of mine) s.supply = 'warehouse'; continue; }
      const facs = S.facs.filter(f => f.owner === c.id && FAC[f.kind].range)
        .sort((a, b) => (a.kind === 'kitchen' ? 0 : 1) - (b.kind === 'kitchen' ? 0 : 1));
      for (const f of facs) {
        const cand = mine.filter(s => s.supply === 'direct' && dist(s, f) <= facRange(f)).sort((a, b) => dist(a, f) - dist(b, f));
        cand.slice(0, facCap(f)).forEach(s => { s.supply = f.kind; s.facId = f.id; });
      }
    }
  }

  // ---------- 입지 평가 ----------
  function fakeStore(S, cat, compId, x, y, size, style, tier, opt8) {
    const comp = S.companies[compId];
    return { cat, owner: compId, x, y, size: size || 2, price: 100 * (comp.ai ? comp.ai.pricing : 1), rating: 3.2, mkt: comp.ai ? 1 : 0, owned: false, arch: 'basic',
      interior: { style: style || (comp.ai ? comp.ai.style : 'wood'), tier: tier || 2, cond: 100 }, supply: 'direct', ev: [], buzz: [], opened: -99, _skill: 50, _star: 50, menu: (opt8 && opt8.menu) || defaultMenu(cat, size || 2), sig: null };
  }
  function lotEstimate(S, x, y, cat, compId, opt) {
    opt = opt || {};
    const d = S.day; const srcs = sources(S).filter(s => Math.abs(s.x - x) + Math.abs(s.y - y) <= REACH);
    const fake = fakeStore(S, cat, compId, x, y, opt.size, opt.style, opt.tier, opt);
    refreshMenu(S, fake);
    const attr = {}; for (const seg of SEG_KEYS) attr[seg] = attraction(S, fake, seg);
    const pb = S.tiles.some(t => t.b && t.b.k === 'park' && Math.abs(t.x - x) + Math.abs(t.y - y) <= 2) ? 1.1 : 1;
    const list = S.stores.filter(s => s.cat === cat);
    const segDem = { res: 0, off: 0, uni: 0, tour: 0 }; const flow = { res: 0, off: 0, uni: 0, tour: 0 };
    const w = WEATHER.cloud; void w;
    for (const src of srcs) {
      const hd = S.hoods[src.h];
      const hype = 1 + hd.hype / 100 * (src.seg === 'tour' || src.seg === 'uni' ? 0.8 : 0.15);
      const typical = src.seg === 'off' ? 0.78 : src.seg === 'tour' ? 0.96 : src.seg === 'uni' ? 0.86 : 1.03;
      const D = src.pop * APPETITE[cat][src.seg] * typical * SEASON[cat][d.mi] * hype;
      flow[src.seg] += src.pop * typical;
      let sum = 0;
      for (const st of list) { const dd = dist(st, src); if (dd <= REACH) sum += (st._attr ? st._attr[src.seg] : 1) * (st._pb || 1) / (1 + 0.5 * dd); }
      const dd = Math.abs(src.x - x) + Math.abs(src.y - y);
      const a = attr[src.seg] * pb / (1 + 0.5 * dd);
      segDem[src.seg] += D * a / (sum + a + OUTSIDE);
    }
    let rivals = 0;
    for (const st of list) if (st.owner !== compId && Math.abs(st.x - x) + Math.abs(st.y - y) <= 4) rivals++;
    const cust = SEG_KEYS.reduce((a, s) => a + segDem[s], 0);
    return { cust, rivals, segDem, flow };
  }
  function lotPotentials(S, cat, compId) {
    const out = [];
    for (const t of S.tiles) if (isLot(t)) out.push({ x: t.x, y: t.y, cust: lotEstimate(S, t.x, t.y, cat, compId).cust });
    return out;
  }
  // 시간대별 유동인구 (상권 분석용)
  function hourlyFlow(S, x, y) {
    const srcs = sources(S).filter(s => Math.abs(s.x - x) + Math.abs(s.y - y) <= 3);
    const out = new Array(24).fill(0);
    for (const s of srcs) for (let h = 0; h < 24; h++) out[h] += s.pop * SEG_HOURS[s.seg][h] / 100;
    return out;
  }
  function bestLot(S, cat, compId, sample) {
    let lots = lotPotentials(S, cat, compId);
    if (!lots.length) return null;
    lots.sort((a, b) => b.cust - a.cust);
    lots = lots.slice(0, sample || 8);
    return lots[Math.floor(rnd(S) * Math.min(lots.length, 4))];
  }

  // ---------- 1시간 진행 ----------
  function step(S) {
    if (S.gameOver) return { money: [], trucks: [] };
    const ev = { money: [], trucks: [], newDay: false };
    const h = S.hour % 24;
    for (const st of S.stores) {
      if (h === 0) { st.hourly.fill(0); st.hourLost.fill(0); st.hourCap.fill(0); st.dayServed = 0; st.dayLost = 0; st.dayRev = 0; st.dayCost = 0; }
      const comp = S.companies[st.owner];
      const isOpen = h >= st.open && h < st.close;
      const want = wantAt(S, st, h) * (0.85 + rnd(S) * 0.3);
      if (!isOpen) { st.hourLost[h] = 0; continue; }
      const cap = hourCap(st, h);
      const raw = Math.min(want, cap);
      const served = Math.floor(raw) + (rnd(S) < raw % 1 ? 1 : 0);
      st.hourly[h] = served; st.hourLost[h] = Math.max(0, want - served); st.hourCap[h] = cap;
      const gross = served * ticket(st);
      const rev = gross / VAT;
      const cogs = served * unitCost(S, comp, st);
      const card = gross * CARD_FEE;
      let wage = 0;
      for (const s of st.staff) if (onDuty(st, s, h)) {
        wage += s.wage * BURDEN;
        const util = cap > 0 ? served / cap : 0;
        s.fatigue = clamp(s.fatigue + util * (s.mbti[0] === 'I' ? 0.9 : 1.15) + 0.3, 0, 100);
      }
      st.dayServed += served; st.dayLost += st.hourLost[h]; st.dayRev += rev;
      st.m.cust += served;
      if (st.franchise) {
        const margin = st.supply !== 'direct' ? cogs * 0.06 : 0;
        const royalty = rev * comp.fr[st.cat].royalty;
        comp.cash += royalty + margin; comp.cur.royalty += royalty + margin; comp.cur.served += served;
        st.dayCost += cogs + margin + card + wage + royalty;
      } else {
        comp.cash += rev - cogs - card - wage;
        const L = comp.cur; L.rev += rev; L.cogs += cogs; L.card += card; L.wage += wage; L.served += served;
        st.dayCost += cogs + card + wage;
      }
      if (comp.isPlayer && served > 4 && rnd(S) < 0.05) ev.money.push({ x: st.x, y: st.y, v: st.franchise ? rev * comp.fr[st.cat].royalty : rev - cogs - wage });
      if (st.supply !== 'direct' && h === st.open && rnd(S) < 0.6 && st.facId) {
        const f = S.facs.find(ff => ff.id === st.facId);
        if (f) ev.trucks.push({ from: { x: f.x, y: f.y }, to: { x: st.x, y: st.y }, color: comp.color });
      }
    }
    S.hour++;
    if (S.hour % 24 === 0) { endDay(S); startDay(S); ev.newDay = true; }
    return ev;
  }

  // ---------- 하루 마감 ----------
  function endDay(S) {
    const d = dateOf(S, S.hour - 1);
    const dim = new Date(Date.UTC(d.year, d.month, 0)).getUTCDate();
    updateIngredients(S);
    const servedBy = S.companies.map(() => { const o = {}; for (const k of CAT_KEYS) o[k] = 0; return o; });
    for (const st of S.stores) {
      const comp = S.companies[st.owner];
      const rent = st.owned ? 0 : st.rent / dim;
      const util = utilMonth(st) / dim;
      const mkt = MKT[st.mkt];
      const fixed = rent + util + mkt;
      if (st.franchise) st.dayCost += fixed;
      else {
        comp.cash -= fixed; comp.cur.rent += rent; comp.cur.util += util; comp.cur.mkt += mkt;
        comp.cur.dep += (interiorBook(S, st) > 0 ? st.interior.cost / 1825 : 0) + (equipBook(S, st) > 0 ? st.equip / 1825 : 0);
        st.dayCost += fixed;
      }
      st.served = st.dayServed; st.lost = st.dayLost; st.rev = st.dayRev;
      st.profit = st.dayRev - st.dayCost;
      st.profitAvg = st.profitAvg * 0.93 + st.profit * 0.07;
      st.lossDays = st.profitAvg < 0 ? st.lossDays + 1 : 0;
      st.m.rev += st.dayRev; st.m.profit += st.profit;
      servedBy[st.owner][st.cat] += st.dayServed;
      // 평점
      const appeal = SEG_KEYS.reduce((a, s) => a + interiorAppeal(st, s), 0) / 4;
      const v = quality(S, st) * appeal / Math.pow(st.price / 100, 1.1);
      const want = st.dayServed + st.dayLost;
      const lostR = want > 0 ? st.dayLost / want : 0;
      const target = clamp(1.6 + 1.8 * v + ((st._clean || 50) - 50) / 50 * 0.7 - lostR * 2 + (st._chem - 1) * 5, 1, 5);
      st.rating = clamp(st.rating + (target - st.rating) * 0.05, 1, 5);
      // 임대차 갱신 (2년마다, 상가임대차보호법 상한 5%)
      if (!st.owned && dayOf(S) - st.leaseDay >= 730) {
        const t = tile(S, st.x, st.y); const market = t.rent * SIZES[st.size].py;
        const next = Math.round(Math.min(market, st.rent * 1.05) / 1e4) * 1e4;
        if (comp.isPlayer && !st.franchise && next !== st.rent) log(S, `📝 ${hoodName(S, st)} ${CATS[st.cat].name} 임대차를 갱신했어요. 월세 ${won(st.rent)} → ${won(next)}`, 'info');
        st.rent = next; st.leaseDay = dayOf(S);
      }
      if (st.owned) st.propValue = Math.max(st.propValue, propertyPrice(S, st) * 0.98);
      st.ev = st.ev.filter(e => e.until > S.hour); st.buzz = (st.buzz || []).filter(e => e.until > S.hour);
    }
    S.companies.forEach((c, i) => {
      if (c.dead) return;
      for (const cat of CAT_KEYS) {
        const mine = S.stores.filter(s => s.owner === c.id && s.cat === cat);
        const mktSpend = mine.reduce((a, s) => a + MKT[s.mkt], 0);
        const starB = mine.reduce((a, s) => a + Math.max(0, (s._star || 50) - 60), 0) * 0.002;
        const gain = (servedBy[i][cat] * 0.00012 + mktSpend / 1e6 * 0.15 + starB) * (1 - c.brand[cat] / 100);
        c.brand[cat] = clamp(c.brand[cat] * 0.9985 + gain, 0, 100);
      }
      let up = 0;
      for (const f of S.facs) if (f.owner === c.id) up += FAC[f.kind].upkeep * (1 + 0.5 * (f.level - 1)) / dim;
      if (c.farm) up += 5e6 / dim;
      if (c.ai && S.stores.some(s => s.owner === c.id && s.supply === 'warehouse')) up += 2e7 / dim;
      if (c.ai) up += S.stores.filter(s => s.owner === c.id).length * 1.5e6 / dim;   // 본사 관리비
      const interest = c.debt * 0.055 / 365;
      c.cash -= up + interest; c.cur.upkeep += up; c.cur.interest += interest;
      c.ev = c.ev.filter(e => e.until > S.hour);
    });
    franchiseTick(S);
    dailyEvents(S);
    playerDistress(S);
    for (const c of S.companies) {
      if (c.dead) continue;
      const tot = ledgerNI(c.cur);
      c.dailyNI.push(tot - c._prev); c._prev = tot;
      if (c.dailyNI.length > 90) c.dailyNI.shift();
      c.value = valuation(S, c);
      if (c.listed) {
        const target = Math.max(100, c.value / c.shares);
        c.price = Math.max(100, c.price * Math.exp(0.04 * Math.log(target / c.price) + gauss(S) * 0.014));
      } else c.price = c.value / c.shares;
      c.priceHist.push(c.price); if (c.priceHist.length > 360) c.priceHist.shift();
    }
    for (const h of S.hoods) {
      h.hype *= 0.996;
      const target = 1 + h.hype / 250;
      h.rentMult += (target - h.rentMult) * 0.01;
    }
    const nd = dateOf(S, S.hour);
    if (nd.month !== d.month) monthEnd(S, d);
    checkQuests(S);
  }

  function updateIngredients(S) {
    for (const k in S.ingr) {
      const g = S.ingr[k]; const base = INGR[k].base;
      g.p = g.p * Math.exp(0.03 * Math.log(base / g.p) + gauss(S) * 0.012);
      if (dayOf(S) % 3 === 0) { g.hist.push(g.p); if (g.hist.length > 120) g.hist.shift(); }
    }
  }
  function playerDistress(S) {
    const p = S.companies[0];
    if (p.cash < 0) {
      if (p.debt + 1e8 <= loanLimit(S, p)) { p.debt += 1e8; p.cash += 1e8; log(S, '🏦 잔고가 바닥나 은행에서 1억원을 긴급 대출했어요.', 'warn'); }
      else {
        S.distress++;
        if (S.distress === 1) log(S, '⚠️ 자금이 마이너스예요. 45일 안에 회복하지 못하면 파산합니다.', 'bad');
        if (S.distress > 45) { S.gameOver = true; log(S, '💔 회사가 파산했어요. 새 게임에서 다시 도전해 보세요.', 'bad'); }
      }
    } else S.distress = 0;
  }

  // ---------- 가치평가 ----------
  function bookValue(S, c) {
    let v = c.cash - c.debt;
    for (const s of S.stores) if (s.owner === c.id && !s.franchise) v += s.deposit + interiorBook(S, s) + equipBook(S, s) + (s.owned ? s.propValue : 0);
    for (const f of S.facs) if (f.owner === c.id) v += f.invest * 0.7;
    for (const id in c.holdings) { const t = S.companies[id]; if (t && !t.dead) v += c.holdings[id] * t.price; }
    return v;
  }
  function valuation(S, c) {
    const book = bookValue(S, c);
    const n = c.dailyNI.length;
    const annual = n ? c.dailyNI.reduce((a, b) => a + b, 0) / n * 365 * 0.85 : 0;
    const cnt = S.stores.filter(s => s.owner === c.id).length;
    const past = c.storeHist.length >= 6 ? c.storeHist[c.storeHist.length - 6] : (c.storeHist[0] || cnt);
    const growth = (cnt - past) / Math.max(3, past);
    const avgBrand = CAT_KEYS.reduce((a, k) => a + c.brand[k], 0) / CAT_KEYS.length;
    const per = 11 + clamp(growth * 10, -3, 8) + avgBrand / 15 + (c.dividend > 0 ? 1.5 : 0) + (S.econ.mult - 1) * 20;
    return Math.max(book * 0.6, book + annual * per, 5e7);
  }
  function marketCap(c) { return c.price * c.shares; }
  function loanLimit(S, c) { return Math.max(3e8, Math.floor(c.value * 0.4 / 1e8) * 1e8); }

  // ---------- 월말 ----------
  function monthEnd(S, d) {
    for (const c of S.companies) {
      if (c.dead) continue;
      const L = c.cur;
      const pre = ledgerNI(L);
      const tax = pre > 0 ? pre * (pre * 12 <= 2e8 ? 0.09 : 0.19) : 0;
      c.cash -= tax; L.tax = tax;
      const ni = pre - tax;
      const rec = Object.assign({}, L, { ni, cash: c.cash, value: c.value, stores: S.stores.filter(s => s.owner === c.id).length, month: d.month, year: d.year });
      if (c.isPlayer && c.listed && c.dividend > 0 && ni > 0) { const pay = ni * c.dividend; c.cash -= pay; rec.dividend = pay; S.founder.cash += pay * c.founderShares / c.shares; }
      c.months.push(rec); if (c.months.length > 48) c.months.shift();
      c.storeHist.push(rec.stores); if (c.storeHist.length > 24) c.storeHist.shift();
      c.cur = blankLedger(); c._prev = 0;
      if (c.dailyNI.length) c.dailyNI[c.dailyNI.length - 1] -= tax;
    }
    for (const st of S.stores) { st.lm = st.m; st.m = { rev: 0, profit: 0, cust: 0 }; }
    cityGrow(S);
    computeLand(S);
    monthlyEvents(S, d);
    aiMonth(S);
    assignSupply(S);
    S.stats.pop.push(population(S)); if (S.stats.pop.length > 48) S.stats.pop.shift();
    const p = S.companies[0]; const last = p.months[p.months.length - 1];
    if (last) log(S, `📒 ${d.month}월 결산: 매출 ${won(last.rev + last.royalty)}, 순이익 ${won(last.ni)}`, last.ni >= 0 ? 'good' : 'bad');
  }

  function cityGrow(S) {
    const empties = {}, totals = {};
    for (const t of S.tiles) if (t.t === 'land') { totals[t.h] = (totals[t.h] || 0) + 1; if (isLot(t)) empties[t.h] = (empties[t.h] || 0) + 1; }
    const boosters = S.tiles.filter(t => t.b && (t.b.k === 'park' || t.b.k === 'bus'));
    for (const t of S.tiles) {
      if (t.t !== 'land') continue;
      const hd = S.hoods[t.h];
      const near = boosters.filter(b => dist(b, t) <= 4).length;
      const boost = near * 0.015 + hd.hype / 100 * 0.02 + (hd.transit ? 0.01 : 0);
      if (t.b && SEG[t.b.k]) { const maxLv = near || hd.transit ? 5 : 4; if (t.b.lv < maxLv && rnd(S) < 0.02 + boost) t.b.lv++; }
      else if (isLot(t)) {
        if ((empties[t.h] || 0) / totals[t.h] < 0.34) continue;
        if (rnd(S) < 0.01 + boost) { t.b = { k: wpick(S, HOODS[t.h].mix), lv: 1 }; t.tree = false; empties[t.h]--; }
      }
    }
  }

  // ---------- 사건 ----------
  function dailyEvents(S) {
    const day = dayOf(S);
    // 위생 점검
    if (rnd(S) < 0.04) {
      const mine = S.stores.filter(s => s.owner === 0 && !s.franchise);
      if (mine.length) {
        const st = pick(S, mine), c = st._clean || 50;
        if (c < 45) { const fine = 3e6; S.companies[0].cash -= fine; S.companies[0].cur.other -= fine; st.rating = Math.max(1, st.rating - 0.6); log(S, `🧽 ${hoodName(S, st)} ${CATS[st.cat].name}이 위생 점검에서 지적을 받았어요. 과태료 ${won(fine)}, 평점 하락. 청결 능력이 좋은 직원이 필요해요.`, 'bad'); }
        else if (c > 72) { st.rating = Math.min(5, st.rating + 0.15); log(S, `✨ ${hoodName(S, st)} ${CATS[st.cat].name}이 위생 우수 업소로 뽑혔어요.`, 'good'); }
      }
    }
    // 스타 직원 SNS 화제
    if (rnd(S) < 0.03) {
      const cand = S.stores.filter(s => s.owner === 0 && s.staff.some(x => x.role !== 'kitchen' && effStat(x, 'star') >= 82));
      if (cand.length) {
        const st = pick(S, cand); const s = st.staff.filter(x => x.role !== 'kitchen').sort((a, b) => b.star - a.star)[0];
        st.buzz.push({ until: S.hour + 10 * 24, mult: 1.3 });
        log(S, `📸 ${hoodName(S, st)} ${CATS[st.cat].name}의 ${s.name}님이 SNS에서 화제예요! 열흘간 손님이 늘어요.`, 'good');
      }
    }
    // 연예인 방문
    if (rnd(S) < 0.012) {
      const cand = S.stores.filter(s => s.rating >= 4);
      if (cand.length) {
        const st = pick(S, cand); st.buzz.push({ until: S.hour + 14 * 24, mult: 1.4 });
        const comp = S.companies[st.owner];
        log(S, `🌟 유명 배우가 ${hoodName(S, st)}의 ${comp.name} ${CATS[st.cat].name}을 다녀갔대요.`, comp.isPlayer ? 'good' : 'info');
      }
    }
    // 축제
    if (rnd(S) < 0.02) {
      const i = Math.floor(rnd(S) * HOODS.length);
      S.hoods[i].festival = S.hour + 3 * 24;
      log(S, `🎉 ${HOODS[i].name}에서 사흘간 동네 축제가 열려요.`, 'good');
    }
    // 최저임금
    const d = dateOf(S, S.hour);
    if (d.month === 8 && d.day === 5) {
      S.nextMinWage = Math.round(S.minWage * (1.025 + rnd(S) * 0.025) / 10) * 10;
      log(S, `⚖️ 내년 최저시급이 ${won(S.nextMinWage)}으로 결정됐어요. 1월 1일부터 적용돼요.`, 'warn');
    }
    if (d.month === 1 && d.day === 1 && S.nextMinWage) {
      S.minWage = S.nextMinWage; S.nextMinWage = null;
      for (const st of S.stores) for (const s of st.staff) if (s.wage < S.minWage) s.wage = S.minWage;
      log(S, `⚖️ 새해 최저시급 ${won(S.minWage)} 적용. 최저시급보다 낮던 직원 시급을 맞췄어요.`, 'info');
    }
    void day;
  }

  function monthlyEvents(S, d) {
    // 뜨는 동네 / 지는 동네
    const r = rnd(S);
    if (r < 0.3) {
      const i = Math.floor(rnd(S) * HOODS.length); const h = S.hoods[i];
      h.hype = clamp(h.hype + 30 + rnd(S) * 15, 0, 100);
      log(S, `🔥 "요즘 ${HOODS[i].name}이 뜬다" — SNS에 골목 사진이 쏟아지고 있어요. 젊은 손님과 관광객이 늘고 임대료도 오를 거예요.`, 'good');
    } else if (r < 0.4) {
      const hot = S.hoods.map((h, i) => [h, i]).filter(([h]) => h.hype > 30);
      if (hot.length) { const [h, i] = pick(S, hot); h.hype *= 0.55; log(S, `🍂 ${HOODS[i].name} 상권의 열기가 식고 있어요. 방문객이 줄어드는 중이에요.`, 'warn'); }
    } else if (r < 0.46) {
      const cands = S.hoods.map((h, i) => [h, i]).filter(([h]) => !h.transit);
      if (cands.length) { const [h, i] = pick(S, cands); h.transit = true; h.popMult *= 1.15; log(S, `🚇 ${HOODS[i].name}에 지하철역이 개통했어요. 유동인구가 15% 늘어요.`, 'good'); }
    } else if (r < 0.5) {
      const i = pick(S, [4, 7]); S.hoods[i].offMult *= 1.2;
      log(S, `🏢 대기업 본사가 ${HOODS[i].name}으로 이전해요. 직장인 손님이 20% 늘어요.`, 'good');
    }
    const r2 = rnd(S);
    if (r2 < 0.2) {
      const k = pick(S, Object.keys(INGR)); const up = rnd(S) < 0.65;
      S.ingr[k].p *= up ? 1.25 + rnd(S) * 0.25 : 0.8;
      log(S, up ? `📈 ${INGR[k].name} 국제 시세가 급등했어요.` : `📉 ${INGR[k].name} 풍작으로 값이 내렸어요.`, up ? 'warn' : 'good');
    } else if (r2 < 0.36) {
      const cat = pick(S, CAT_KEYS);
      S.trends[cat] = { mult: 1.25, until: S.hour + 60 * 24 };
      log(S, `✨ SNS에서 ${CATS[cat].name} 열풍! 두 달간 수요가 늘어요.`, 'good');
    } else if (r2 < 0.44 && S.econ.until <= S.hour) {
      const boom = rnd(S) < 0.5;
      S.econ = { mult: boom ? 1.06 : 0.9, until: S.hour + 90 * 24 };
      log(S, boom ? '☀️ 경기가 좋아져 외식 소비가 늘고 있어요.' : '🌧️ 경기 둔화로 소비 심리가 위축됐어요.', boom ? 'good' : 'warn');
    }
    if (S.econ.until <= S.hour) S.econ.mult = 1;
    void d;
  }

  // ---------- 경쟁사 AI ----------
  function aiMonth(S) {
    for (const c of S.companies) {
      if (!c.ai || c.dead) continue;
      const mine = S.stores.filter(s => s.owner === c.id);
      for (const st of mine) if (st.lossDays > 80 && mine.length > 2) { closeStore(S, st.id, true); log(S, `🏚️ ${c.name}이(가) ${HOODS[tile(S, st.x, st.y).h].name}의 적자 매장을 닫았어요.`, 'info'); break; }
      for (const st of S.stores.filter(s => s.owner === c.id)) {
        let target = 100 * c.ai.pricing;
        if (S.stores.some(o => o.owner !== c.id && o.cat === st.cat && dist(o, st) <= 3 && o.price < st.price * 0.95)) target *= 0.95;
        if (st.lost > st.served * 0.2) target *= 1.05;
        st.price = Math.round(st.price * 0.6 + target * 0.4);
        if (st.lost > st.served * 0.25) autoStaff(S, st, 50);
        if (st.interior.cond < 60 && c.cash > st.interior.cost) { c.cash -= st.interior.cost * 0.3; st.interior.cond = 100; }
        if (st.size < 3 && st.lost > st.served * 0.3 && c.cash > upgradeCost(S, st) * 3) { c.cash -= upgradeCost(S, st); st.size++; }
      }
      const count = S.stores.filter(s => s.owner === c.id).length;
      const maxStores = 6 + Math.floor(dayOf(S) / 90) * 2;
      let opens = rnd(S) < 0.5 * c.ai.aggr ? 2 : 1;
      while (opens-- > 0 && count < Math.min(32, maxStores)) {
        const cat = rnd(S) < 0.88 ? pick(S, c.ai.focus) : pick(S, CAT_KEYS);
        const spot = bestLot(S, cat, c.id, 10);
        if (!spot) break;
        const cost = openCost(S, cat, spot.x, spot.y, 2, c.ai.style, 2);
        if (c.cash < cost.total * 2 || spot.cust < 120) break;
        openStore(S, c.id, spot.x, spot.y, cat, { size: 2, style: c.ai.style, tier: rnd(S) < 0.3 ? 3 : 2 });
        if (rnd(S) < 0.3) log(S, `🏪 ${c.name}이(가) ${HOODS[tile(S, spot.x, spot.y).h].name}에 ${CATS[cat].name} 매장을 열었어요.`, 'info');
      }
      if (c.cash > 8e8 && rnd(S) < 0.25) {
        const cat = pick(S, c.ai.focus); const cost = researchCost(c, cat);
        if (c.recipe[cat] < 10 && c.cash > cost * 3) { c.cash -= cost; c.recipe[cat]++; }
      }
      if (c.cash > 10e8 && rnd(S) < 0.2) {
        const cat = c.ai.focus[0];
        const kind = rnd(S) < 0.5 ? 'collab' : 'campaign';
        runCoEvent(S, c.id, kind, cat);
        log(S, kind === 'collab' ? `🎁 ${c.name}이(가) ${CATS[cat].name} 콜라보 굿즈를 출시했어요. 3주간 손님이 몰릴 거예요.` : `📺 ${c.name}이(가) ${CATS[cat].name} 광고 캠페인을 시작했어요.`, 'info');
      }
      for (const st of S.stores.filter(s => s.owner === c.id)) {
        const mi = S.day.mi, C2 = CATS[st.cat];
        const sea = C2.menu.filter(m => m.season && m.season.includes(mi) && !st.menu.includes(m.id));
        st.menu = st.menu.filter(id => { const m = C2.menu.find(x => x.id === id); return !m.season || m.season.includes(mi); });
        for (const m of sea) if (st.menu.length < SIZES[st.size].menu) st.menu.push(m.id);
        if (st.menu.length < 2) st.menu = defaultMenu(st.cat, st.size);
      }
      if (rnd(S) < 0.15) {
        const ss = S.stores.filter(s => s.owner === c.id);
        if (ss.length) { const st = pick(S, ss); st.ev.push({ kind: 'season', until: S.hour + 30 * 24 }); if (rnd(S) < 0.4) log(S, `🍓 ${c.name}이(가) 시즌 한정 메뉴를 내놓았어요.`, 'info'); }
      }
      if (c.cash < 0) { c.debt += 5e8; c.cash += 5e8; }
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
    if (royalty != null) p.fr[cat].royalty = clamp(royalty, 0.01, 0.1);
    return { ok: true };
  }
  function franchiseTick(S) {
    const p = S.companies[0];
    for (const cat of CAT_KEYS) {
      const fr = p.fr[cat];
      if (!fr.on) continue;
      const own = S.stores.filter(s => s.owner === 0 && !s.franchise && s.cat === cat).length;
      const frs = S.stores.filter(s => s.owner === 0 && s.franchise && s.cat === cat);
      for (const st of frs) if (st.lossDays > 100) {
        closeStore(S, st.id, true); p.brand[cat] = Math.max(0, p.brand[cat] - 2);
        log(S, `😢 ${CATS[cat].name} 가맹점 한 곳이 적자로 폐업했어요. 브랜드 이미지가 조금 상했어요.`, 'bad');
      }
      if (frs.length >= own * 5) continue;
      const monthly = clamp(0.3 + p.brand[cat] / 100 * 1.2 - (fr.royalty - 0.03) * 10, 0.03, 1.5);
      if (rnd(S) < monthly / 30) {
        const spot = bestLot(S, cat, 0, 12);
        if (!spot || spot.cust < 130) continue;
        const cost = openCost(S, cat, spot.x, spot.y, 2, p.frStyle, 2);
        const r = openStore(S, 0, spot.x, spot.y, cat, { franchise: true, size: 2, style: p.frStyle, tier: 2 });
        if (r.ok) {
          const fee = 1e7 + 3e6 + cost.interior * 0.1;
          p.cash += fee; p.cur.royalty += fee;
          log(S, `🤝 ${HOODS[tile(S, spot.x, spot.y).h].name}에 새 ${CATS[cat].name} 가맹점이 문을 열었어요! 가맹비·교육비·인테리어 마진 ${won(fee)} 입금`, 'good');
        }
      }
    }
  }

  // ---------- 플레이어 행동 ----------
  function research(S, compId, cat) {
    const c = S.companies[compId];
    if (c.recipe[cat] >= 10) return { ok: false, msg: '이미 최고 레시피예요.' };
    const cost = researchCost(c, cat);
    if (c.cash < cost) return { ok: false, msg: '자금이 부족해요.' };
    c.cash -= cost; c.cur.other -= cost; c.recipe[cat]++;
    computeDemand(S);
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
    const last = p.months.slice(-3);
    const profitable = last.length === 3 && last.every(m => m.ni > 0);
    return { ok: !p.listed && n >= 10 && p.value >= 1e10 && profitable, stores: n, value: p.value, profitable };
  }
  function ipo(S) {
    const p = S.companies[0];
    if (!ipoCheck(S).ok) return { ok: false, msg: '상장 요건을 아직 채우지 못했어요.' };
    const pricePer = 15000;
    const pre = Math.round(p.value * 0.85 / pricePer / 1000) * 1000;
    p.shares = pre; p.founderShares = pre;
    const newShares = Math.round(pre * 0.25 / 0.75 / 1000) * 1000;
    p.shares += newShares; p.listed = true;
    const raised = newShares * pricePer;
    p.cash += raised; p.price = pricePer; p.priceHist = p.priceHist.map(() => pricePer);
    log(S, `🔔 ${p.name} 코스닥 상장! 공모가 ${won(pricePer)}, ${won(raised)}을 조달했어요.`, 'good');
    return { ok: true, raised };
  }
  function issueShares(S) {
    const p = S.companies[0]; if (!p.listed) return { ok: false, msg: '상장 후 가능해요.' };
    const n = Math.round(p.shares * 0.1); const raised = n * p.price * 0.92;
    p.shares += n; p.cash += raised; p.price *= 0.96;
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
  function floatAvail(S, t) { let held = 0; for (const c of S.companies) held += c.holdings[t.id] || 0; return Math.max(0, t.shares - t.founderShares - held); }
  function buyStake(S, targetId, pct) {
    const p = S.companies[0]; const t = S.companies[targetId];
    if (!t || t.dead || !t.listed || t.isPlayer) return { ok: false };
    const n = Math.min(Math.round(t.shares * pct), floatAvail(S, t));
    if (n <= 0) return { ok: false, msg: '살 수 있는 유통 주식이 없어요.' };
    const cost = n * t.price * (1 + pct * 0.6);
    if (p.cash < cost) return { ok: false, msg: '현금이 부족해요.' };
    p.cash -= cost; p.holdings[targetId] = (p.holdings[targetId] || 0) + n; t.price *= 1 + pct * 0.6;
    return { ok: true, cost, n };
  }
  function sellStake(S, targetId, pct) {
    const p = S.companies[0]; const t = S.companies[targetId]; const have = p.holdings[targetId] || 0;
    const n = Math.min(have, Math.round(t.shares * pct));
    if (n <= 0) return { ok: false, msg: '보유 주식이 없어요.' };
    const got = n * t.price * (1 - pct * 0.4);
    p.cash += got; p.holdings[targetId] = have - n; t.price *= 1 - pct * 0.4;
    return { ok: true, got };
  }
  function acquire(S, targetId) {
    const p = S.companies[0]; const t = S.companies[targetId]; const have = p.holdings[targetId] || 0;
    if (!t || t.dead || have <= t.shares * 0.5) return { ok: false, msg: '지분 50% 초과가 필요해요.' };
    const restValue = (t.shares - have) * t.price;
    if (p.listed) p.shares += Math.round(restValue / p.price);
    else { if (p.cash < restValue) return { ok: false, msg: `잔여 지분 매수 대금 ${won(restValue)}이 필요해요.` }; p.cash -= restValue; }
    for (const st of S.stores) if (st.owner === t.id) st.owner = 0;
    for (const f of S.facs) if (f.owner === t.id) f.owner = 0;
    p.cash += t.cash; p.debt += t.debt;
    for (const k of CAT_KEYS) { p.brand[k] = Math.max(p.brand[k], t.brand[k]); p.recipe[k] = Math.max(p.recipe[k], t.recipe[k]); }
    t.dead = true; t.cash = 0; t.debt = 0; delete p.holdings[targetId];
    assignSupply(S); computeDemand(S);
    log(S, `🏆 ${t.name} 인수 완료! 매장들이 우리 간판으로 바뀌었어요.`, 'good');
    return { ok: true };
  }

  // ---------- 목표 ----------
  const QUESTS = [
    { id: 'first', text: '첫 매장 열기', reward: 0, check: S => S.stores.some(s => s.owner === 0) },
    { id: 'hire', text: '직원 직접 채용하기', reward: 2e6, check: S => S.stores.some(s => s.owner === 0 && s.staff.some(x => x.hired)) },
    { id: 'train', text: '직원 교육 3회', reward: 3e6, check: S => (S.companies[0].trained || 0) >= 3 },
    { id: 'three', text: '직영 매장 3곳 운영', reward: 2e7, check: S => S.stores.filter(s => s.owner === 0 && !s.franchise).length >= 3 },
    { id: 'rating', text: '평점 4.5 매장 만들기', reward: 1e7, check: S => S.stores.some(s => s.owner === 0 && s.rating >= 4.5) },
    { id: 'premium', text: '프리미엄 이상 인테리어', reward: 1e7, check: S => S.stores.some(s => s.owner === 0 && s.interior.tier >= 3) },
    { id: 'building', text: '건물 매입 후 리모델링', reward: 3e7, check: S => S.stores.some(s => s.owner === 0 && s.owned && s.arch !== 'basic') },
    { id: 'wh', text: '물류센터 또는 중앙주방 짓기', reward: 5e7, check: S => S.facs.some(f => f.owner === 0 && FAC[f.kind].range) },
    { id: 'brand', text: '한 업종 브랜드 인지도 30', reward: 3e7, check: S => CAT_KEYS.some(k => S.companies[0].brand[k] >= 30) },
    { id: 'fr', text: '첫 가맹점 유치', reward: 3e7, check: S => S.stores.some(s => s.owner === 0 && s.franchise) },
    { id: 'ni', text: '월 순이익 1억원', reward: 5e7, check: S => S.companies[0].months.some(m => m.ni >= 1e8) },
    { id: 'ipo', text: '코스닥 상장(IPO)', reward: 0, check: S => S.companies[0].listed },
    { id: 'thirty', text: '매장 30곳 (가맹 포함)', reward: 1e8, check: S => S.stores.filter(s => s.owner === 0).length >= 30 },
    { id: 'mna', text: '경쟁사 인수', reward: 0, check: S => S.companies.some(c => c.dead) },
    { id: 'cap', text: '시가총액 1,000억원', reward: 0, check: S => S.companies[0].listed && marketCap(S.companies[0]) >= 1e11 },
  ];
  function checkQuests(S) {
    for (const q of QUESTS) {
      if (S.quests[q.id]) continue;
      if (q.check(S)) {
        S.quests[q.id] = S.hour;
        if (q.reward) { S.companies[0].cash += q.reward; S.companies[0].cur.other += q.reward; }
        log(S, `🎯 목표 달성: ${q.text}${q.reward ? ` (보상 ${won(q.reward)})` : ''}`, 'good');
      }
    }
  }

  function marketShare(S, cat) {
    const by = {};
    for (const st of S.stores) if (st.cat === cat) by[st.owner] = (by[st.owner] || 0) + st.served;
    const total = Object.values(by).reduce((a, b) => a + b, 0);
    return { by, total };
  }
  function hoodStats(S) {
    const srcs = sources(S);
    return HOODS.map((H, i) => {
      const mix = { res: 0, off: 0, uni: 0, tour: 0 };
      for (const s of srcs) if (s.h === i) mix[s.seg] += s.pop;
      const tiles = S.tiles.filter(t => t.h === i && t.t === 'land');
      const rent = tiles.reduce((a, t) => a + t.rent, 0) / Math.max(1, tiles.length);
      const stores = S.stores.filter(s => tile(S, s.x, s.y).h === i);
      return { i, name: H.name, desc: H.desc, hype: S.hoods[i].hype, transit: S.hoods[i].transit, mix, pop: Object.values(mix).reduce((a, b) => a + b, 0), rent, stores: stores.length, empty: tiles.filter(isLot).length };
    });
  }

  function won(v) {
    const s = v < 0 ? '-' : ''; v = Math.abs(v);
    if (v >= 1e12) return s + (v / 1e12).toFixed(2) + '조원';
    if (v >= 1e8) return s + (v / 1e8).toFixed(v >= 1e10 ? 0 : 1) + '억원';
    if (v >= 1e5) return s + Math.round(v / 1e4).toLocaleString('ko-KR') + '만원';
    return s + Math.round(v).toLocaleString('ko-KR') + '원';
  }
  function serialize(S) { return JSON.stringify(S); }
  function deserialize(str) {
    const S = JSON.parse(str); if (!S || S.v !== 2) throw new Error('저장 형식이 달라요');
    for (const c of S.companies) for (const k of CAT_KEYS) { if (c.brand[k] == null) c.brand[k] = 0; if (c.recipe[k] == null) c.recipe[k] = 1; if (!c.fr[k]) c.fr[k] = { on: false, royalty: 0.04 }; }
    for (const st of S.stores) { if (!st.menu) { st.menu = defaultMenu(st.cat, st.size); st.sig = null; } refreshMenu(S, st); }
    return S;
  }

  const api = {
    W, H, ROAD_EVERY, REACH, HOOD, CATS, CAT_KEYS, SIZES, INGR, SEG, SEG_KEYS, HOODS, TIERS, STYLES, STYLE_KEYS, ARCH, ARCH_KEYS,
    FAC, PUBLIC, MKT, MKT_NAME, STORE_EVENTS, CO_EVENTS, LOGO_SHAPES, ROLES, SHIFTS, WEATHER, QUESTS, BURDEN, PROFILE, SEG_HOURS,
    newGame, step, tile, isLot, hood, hoodOf, sources, population, dateOf, seasonOf, dayOf,
    openCost, interiorCost, utilMonth, propertyPrice, archCost, researchCost, upgradeCost, interiorBook, spaceScore, keyMoney,
    seatCapOf, staffBound, unitCost, ticket, quality, menuInfo, menuItems, refreshMenu, setMenu, defaultMenu, inSeason, interiorAppeal, hourCap, wantAt, dayDemand, teamStats, laborDay, chemistry, compat, effStat, shiftWindow, onDuty, askWage,
    openStore, closeStore, setInterior, setArch, upgradeStore, buyProperty, setHours, runStoreEvent, runCoEvent,
    hire, fire, staffAct, autoStaff, buildFacility, upgradeFacility, removeFacility, buildPublic, facRange, facCap, assignSupply,
    lotEstimate, lotPotentials, hourlyFlow, bestLot, valuation, bookValue, marketCap, loanLimit, ledgerNI,
    canFranchise, setFranchise, research, setFarm, borrow, repay,
    ipoCheck, ipo, issueShares, buyback, setDividend, floatAvail, buyStake, sellStake, acquire,
    marketShare, hoodStats, won, serialize, deserialize, log, computeDemand,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Sim = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
