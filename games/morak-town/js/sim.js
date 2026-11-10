/* 모락모락 타운 — 시뮬레이션 코어 v2 (브라우저/Node 공용, DOM 없음)
 * 시간 단위: 1스텝 = 1시간. 하루 24시간, 실제 달력(2027년 3월 1일 월요일 시작).
 * 금액 단위: 원. 메뉴 가격은 부가세 포함, 매출은 부가세(10%)를 뺀 금액으로 장부에 올린다. */
(function (root) {
  'use strict';

  const W = 80, H = 80, ROAD_EVERY = 4, REACH = 7, HOOD = 11;
  const START = Date.UTC(2027, 2, 1);
  const OUTSIDE = 0.65, WALLET = 0.14;
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
  const SIZES = [null, { py: 15, name: '소형 15평', menu: 5, fp: [1, 1] }, { py: 25, name: '중형 25평', menu: 7, fp: [2, 1] }, { py: 40, name: '대형 40평', menu: 9, fp: [2, 2] }];
  function defaultMenu(cat, size) { const M2 = CATS[cat].menu; let L = M2.filter(m => m.def).map(m => m.id); if (L.length > SIZES[size || 2].menu) L = L.slice(0, SIZES[size || 2].menu); return L; }
  const CAT_EXTRA = {
    cafe:      { dlv: 0.1,  lux: 0.3,  study: true, traits: ['카공족: 대학생이 많으면 오래 앉아 있어 좌석 회전이 느려요', '아침 출근길 테이크아웃이 많아요', '배달은 객단가가 낮아 수수료 부담이 커요'] },
    bakery:    { dlv: 0.05, lux: 0.2,  waste: true, traits: ['아침 7~9시 갓 구운 빵 수요가 커요', '전날 손님 기준으로 빵을 구워 남으면 폐기돼요', '주민 단골이 핵심이에요'] },
    noodle:    { dlv: 0.15, lux: -0.2, traits: ['점심 회전이 빨라요', '여름엔 콩국수·막국수, 겨울엔 국물 메뉴가 잘 팔려요'] },
    burger:    { dlv: 0.3,  lux: 0,    traits: ['포장·배달 비중이 높아요', '대학생이 좋아해요', '늦은 밤 손님도 있어요'] },
    dessert:   { dlv: 0.15, lux: 0.4,  queue: true, traits: ['오후 2~5시와 저녁이 피크예요', '사진 잘 나오는 인테리어가 특히 중요해요', '인기 매장엔 웨이팅이 생겨요'] },
    snack:     { dlv: 0.35, lux: -0.5, traits: ['학교 끝나는 오후가 대목이에요', '객단가는 낮지만 회전이 빨라요', '소득이 낮은 동네에서도 잘돼요'] },
    chicken:   { dlv: 0.6,  lux: -0.1, traits: ['배달이 매출의 절반 이상이에요', '금·토요일 밤에 붐벼요', '생맥주로 마진을 남겨요'] },
    pizza:     { dlv: 0.55, lux: 0.1,  traits: ['배달·포장 위주예요', '오븐 처리량이 매출 한계를 정해요'] },
    hansik:    { dlv: 0.2,  lux: 0,    traits: ['직장인 점심 단골이 핵심이에요', '관광객은 정식·비빔밥을 좋아해요'] },
    japanese:  { dlv: 0.2,  lux: 0.6,  traits: ['소득이 높은 동네에서 잘돼요', '초밥은 주방 기술이 높아야 품질이 나와요'] },
    chinese:   { dlv: 0.45, lux: -0.3, traits: ['배달 비중이 높아요', '저렴한 가격으로 넓은 손님층을 잡아요'] },
    salad:     { dlv: 0.35, lux: 0.8,  traits: ['평일 점심 직장인 수요가 거의 전부예요', '소득이 높은 동네일수록 잘 팔려요'] },
    bubbletea: { dlv: 0.2,  lux: 0.1,  traits: ['대학생·관광객 테이크아웃 위주예요', '여름에 매출이 크게 올라요'] },
    brunch:    { dlv: 0,    lux: 0.9,  queue: true, traits: ['주말 오전에 웨이팅이 생겨요', '오후 5시면 문을 닫아요', '부유한 동네와 관광지에서 잘돼요'] },
    pub:       { dlv: 0,    lux: 0.2,  traits: ['주류 판매로 마진이 좋아요', '금·토요일 밤이 대목이고 오래 머물러요', '주택가에선 늦은 영업 민원이 있어요'] },
  };
  for (const k in CAT_EXTRA) Object.assign(CATS[k], CAT_EXTRA[k]);
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
  // ---------- 구역(동네) ----------
  // 바닷가 강 하구의 작은 가상 도시 '모락 베이'. income: 가구 월평균 소득(만원), age: 노후도, rent: 기준 평당 월세(원), mix: 새로 지어지는 건물 종류 비중
  const HOODS = [
    { name: '해바라기언덕', kind: 'uni',  rent: 85000,  income: 300, age: 0.45, dev: 0.62, mix: { campus: 2, oneroom: 5, alley: 3, villa: 2, shop: 2, cowork: 1 }, desc: '해바라기대학 정문 앞 언덕. 자취방과 작은 술집 골목이 모여 밤늦게까지 웃음소리가 나요.' },
    { name: '시계탑마을', kind: 'old',  rent: 75000,  income: 420, age: 0.55, dev: 0.58, mix: { hanok: 6, house: 2, shop: 3, alley: 1, hotel: 0.2 }, desc: '오래된 시계탑과 박공지붕 타운하우스가 남은 구시가. 관광객이 사진을 찍으러 와요.' },
    { name: '라일락중심가', kind: 'off',  rent: 230000, income: 600, age: 0.3,  dev: 0.72, mix: { tower: 4, office: 4, plaza: 3, hotel: 0.4, shop: 1 }, desc: '타운홀과 사무실 건물이 모인 도심. 점심마다 직장인이 쏟아져 나오고 땅값이 비싸요.' },
    { name: '고양이언덕',   kind: 'old',  rent: 42000,  income: 250, age: 0.8,  dev: 0.66, mix: { villa: 5, house: 4, shop: 1, alley: 1 }, desc: '등대 언덕 아래 낡은 계단 동네. 길고양이가 많고 임대료가 싸요.' },
    { name: '느티나무길',   kind: 'res',  rent: 70000,  income: 380, age: 0.5,  dev: 0.62, mix: { house: 3, villa: 3, oneroom: 2, shop: 2, cowork: 1 }, desc: '느티나무 그늘 아래 조용한 주택가. 작은 공방과 카페가 섞여 있어요.' },
    { name: '빨랫줄골목', kind: 'res',  rent: 65000,  income: 290, age: 0.55, dev: 0.66, mix: { oneroom: 5, villa: 3, alley: 2, shop: 2 }, desc: '빨랫줄이 걸린 좁은 골목과 원룸. 혼자 사는 사람이 많아 배달 주문이 많아요.' },
    { name: '벽돌부두',   kind: 'ind',  rent: 80000,  income: 330, age: 0.7,  dev: 0.56, mix: { factory: 4, cowork: 2, alley: 2, oneroom: 2, shop: 1 }, desc: '옛 부두 창고를 고친 골목. 힙한 가게가 하나둘 들어오며 젠트리피케이션이 진행 중이에요.', hype: 30 },
    { name: '등대섬',   kind: 'off',  rent: 260000, income: 750, age: 0.2,  dev: 0.6,  mix: { tower: 6, office: 2, plaza: 1, hotel: 0.4 }, desc: '강 하구의 작은 섬. 은행과 방송국, 전망 좋은 사무실이 모여 있어요.' },
    { name: '수국언덕', kind: 'rich', rent: 160000, income: 900, age: 0.15, dev: 0.52, mix: { luxury: 5, apt: 2, house: 2, shop: 1 }, desc: '수국이 핀 정원 주택가. 여유 있는 주민이 많아 가격에 덜 민감하고 브런치·일식을 좋아해요.' },
    { name: '포플러대로', kind: 'off',  rent: 250000, income: 700, age: 0.15, dev: 0.72, mix: { tower: 4, plaza: 4, office: 3, oneroom: 2, hotel: 0.4, alley: 1 }, desc: '포플러 가로수가 늘어선 새 시가지. 직장인과 쇼핑객이 많아요.' },
    { name: '솔방울밸리', kind: 'off',  rent: 120000, income: 480, age: 0.1,  dev: 0.58, mix: { knowledge: 5, office: 3, oneroom: 2, apt: 1, shop: 1 }, desc: '작은 연구소와 스튜디오가 모인 숲가 업무단지.' },
    { name: '햇살정원', kind: 'res',  rent: 85000,  income: 560, age: 0.25, dev: 0.62, mix: { apt: 7, shop: 2, villa: 1 }, desc: '정원이 딸린 저층 아파트 마을. 가족 손님이 많고 주말에 붐벼요.' },
    { name: '조개해변', kind: 'tour', rent: 140000, income: 620, age: 0.2,  dev: 0.42, mix: { apt: 3, plaza: 2, hotel: 0.6, shop: 2, luxury: 1 }, desc: '모래사장과 호수, 해변 놀이공원과 아케이드가 있는 관광 권역.' },
  ];

  // ---------- 건물 종류 ----------
  // cls: res 주택 · com 상가 · off 오피스 · edu · ind · pub 공공. prof: 손님 성향, inc: 소득 배율, popPer: 층·칸당 인원
  const BTYPES = {
    house:     { cls: 'res', name: '단독주택',      seg: 'res',  prof: 'family',  inc: 1.0,  fp: [[1, 1]], floors: [1, 2], popPer: 6 },
    hanok:     { cls: 'res', name: '타운하우스',    seg: 'res',  prof: 'family',  inc: 1.15, fp: [[1, 1], [2, 1]], floors: [2, 3], popPer: 2.5, tourPop: 12 },
    villa:     { cls: 'res', name: '다세대 빌라',   seg: 'res',  prof: 'family',  inc: 0.85, fp: [[1, 1]], floors: [3, 5], popPer: 7 },
    oneroom:   { cls: 'res', name: '원룸·오피스텔', seg: 'res',  prof: 'single',  inc: 0.8,  fp: [[1, 1], [2, 1]], floors: [3, 6], popPer: 7.5 },
    apt:       { cls: 'res', name: '아파트',        seg: 'res',  prof: 'family',  inc: 1.15, fp: [[2, 1], [2, 2], [3, 1]], floors: [4, 7], popPer: 7.5 },
    luxury:    { cls: 'res', name: '고급 주택',     seg: 'res',  prof: 'rich',    inc: 2.6,  fp: [[2, 2], [2, 1]], floors: [2, 4], popPer: 2.5 },
    shop:      { cls: 'com', name: '근린상가',      seg: 'tour', prof: 'shopper', inc: 1.0,  fp: [[1, 1]], floors: [2, 4], popPer: 4 },
    alley:     { cls: 'com', name: '먹자골목 상가', seg: 'tour', prof: 'night',   inc: 1.0,  fp: [[1, 1]], floors: [1, 2], popPer: 7 },
    plaza:     { cls: 'com', name: '대로변 상가빌딩', seg: 'tour', prof: 'shopper', inc: 1.1, fp: [[2, 1], [2, 2]], floors: [3, 5], popPer: 4.8 },
    hotel:     { cls: 'com', name: '호텔',          seg: 'tour', prof: 'tourist', inc: 1.4,  fp: [[2, 1], [2, 2]], floors: [4, 7], popPer: 6.8 },
    office:    { cls: 'off', name: '소형 사무실',   seg: 'off',  prof: 'worker',  inc: 1.0,  fp: [[1, 1]], floors: [3, 5], popPer: 8.5 },
    tower:     { cls: 'off', name: '프라임 오피스', seg: 'off',  prof: 'worker',  inc: 1.3,  fp: [[2, 2]], floors: [6, 9], popPer: 9 },
    cowork:    { cls: 'off', name: '공유오피스',    seg: 'off',  prof: 'young',   inc: 0.95, fp: [[1, 1], [2, 1]], floors: [3, 6], popPer: 8 },
    knowledge: { cls: 'off', name: '지식산업센터',  seg: 'off',  prof: 'worker',  inc: 1.0,  fp: [[2, 2], [3, 2]], floors: [4, 6], popPer: 8 },
    campus:    { cls: 'edu', name: '대학 건물',     seg: 'uni',  prof: 'student', inc: 0.7,  fp: [[2, 1], [2, 2]], floors: [3, 6], popPer: 10 },
    factory:   { cls: 'ind', name: '낡은 공장',     seg: 'off',  prof: 'worker',  inc: 0.85, fp: [[2, 1], [2, 2]], floors: [1, 2], popPer: 6 },
    park:      { cls: 'pub', name: '공원',          seg: 'tour', prof: 'tourist', inc: 1.0,  fp: [[1, 1]], floors: [0, 0], popPer: 0, fixedPop: 60 },
    rpark:     { cls: 'pub', name: '강변·해변 공원',      seg: 'tour', prof: 'tourist', inc: 1.0,  fp: [[1, 1]], floors: [0, 0], popPer: 0, fixedPop: 25 },
    parking:   { cls: 'pub', name: '공영주차장',    seg: 'res',  prof: 'family',  inc: 1.0,  fp: [[1, 1]], floors: [0, 0], popPer: 0, fixedPop: 0 },
    bus:       { cls: 'pub', name: '버스정류장',    seg: 'off',  prof: 'worker',  inc: 1.0,  fp: [[1, 1]], floors: [0, 0], popPer: 0, fixedPop: 140 },
  };
  const CLS_NAME = { res: '주택', com: '상가', off: '오피스', edu: '교육', ind: '산업', pub: '공공', lm: '랜드마크' };
  // 손님 성향별 업종 선호 배율
  const PROFILE_MULT = {
    family:  { bakery: 1.2, hansik: 1.1, pizza: 1.15, chicken: 1.1, pub: 0.7 },
    single:  { chicken: 1.5, snack: 1.4, pizza: 1.35, burger: 1.3, chinese: 1.4, pub: 1.3, bubbletea: 1.1, brunch: 0.8, bakery: 0.8, hansik: 0.9 },
    rich:    { brunch: 1.9, japanese: 1.6, salad: 1.6, dessert: 1.3, bakery: 1.3, cafe: 1.2, snack: 0.4, chinese: 0.6, chicken: 0.7, pub: 0.8 },
    worker:  { hansik: 1.15, salad: 1.1, cafe: 1.05 },
    young:   { cafe: 1.3, salad: 1.3, burger: 1.2, pub: 1.3, brunch: 1.2 },
    student: { snack: 1.2, bubbletea: 1.2, chicken: 1.1 },
    shopper: { cafe: 1.3, dessert: 1.5, bubbletea: 1.4, burger: 1.2, brunch: 1.2, pizza: 1.1, hansik: 0.8 },
    night:   { pub: 2.0, chicken: 1.8, snack: 1.3, burger: 1.1, cafe: 0.6, brunch: 0.3, bakery: 0.4, salad: 0.5 },
    tourist: { hansik: 1.5, dessert: 1.3, cafe: 1.2, noodle: 1.1 },
  };
  const PROFILE_NAME = { family: '가족', single: '1인 가구', rich: '부유층', worker: '직장인', young: '젊은 직장인', student: '대학생', shopper: '쇼핑객', night: '밤손님', tourist: '관광객' };

  // ---------- 랜드마크 ----------
  const LANDMARKS = {
    palace:     { name: '시계탑 광장',            x: 28, y: 7,  w: 5, d: 4, seg: 'tour', prof: 'tourist', pop: 420, rent: 0.18 },
    cityhall:   { name: '타운홀',       x: 44, y: 18, w: 3, d: 2, seg: 'tour', prof: 'tourist', pop: 220, rent: 0.25 },
    tower:      { name: '달빛 등대',         x: 40, y: 3,  w: 1, d: 1, seg: 'tour', prof: 'tourist', pop: 260, rent: 0.1, mount: true },
    univ:       { name: '해바라기대학교',        x: 4,  y: 4,  w: 4, d: 4, seg: 'uni',  prof: 'student', pop: 900, rent: 0.15 },
    market:     { name: '토요 장터',     x: 59, y: 16, w: 3, d: 2, seg: 'res',  prof: 'family',  pop: 380, rent: 0.12 },
    museum:     { name: '벽돌 미술관',       x: 62, y: 31, w: 2, d: 2, seg: 'tour', prof: 'young',   pop: 260, rent: 0.2 },
    forest:     { name: '숲속 놀이터',       x: 70, y: 32, w: 3, d: 3, seg: 'tour', prof: 'young',   pop: 300, rent: 0.18 },
    finance:    { name: '등대섬 전망대', x: 21, y: 38, w: 2, d: 2, seg: 'off',  prof: 'worker',  pop: 900, rent: 0.25 },
    convention: { name: '바람 음악당',   x: 44, y: 54, w: 3, d: 3, seg: 'tour', prof: 'shopper', pop: 600, rent: 0.25 },
    mall:       { name: '조개 아케이드',            x: 60, y: 56, w: 3, d: 3, seg: 'tour', prof: 'shopper', pop: 900, rent: 0.25 },
    amusement:  { name: '해변 놀이공원',          x: 56, y: 59, w: 3, d: 4, seg: 'tour', prof: 'tourist', pop: 800, rent: 0.15 },
    stadium:    { name: '바닷가 야구장',       x: 58, y: 68, w: 3, d: 3, seg: 'tour', prof: 'night',   pop: 500, rent: 0.12 },
  };
  // 트램: 초록(강 북쪽 동서) · 파랑(강 남쪽 동서) · 주황(남북)
  const LINES = { g: { name: '초록 트램', color: '#5c9c7a' }, b: { name: '파랑 트램', color: '#6f7fd0' }, o: { name: '주황 트램', color: '#e08a3c' } };
  const STATION_SITES = [
    { x: 12, y: 28, name: '느티나무길역', line: 'g' }, { x: 26, y: 28, name: '빨랫줄역', line: 'g' }, { x: 40, y: 28, name: '중앙역', line: 'go' },
    { x: 54, y: 28, name: '부두역', line: 'g' }, { x: 40, y: 14, name: '타운홀역', line: 'o' },
    { x: 26, y: 50, name: '수국역', line: 'b' }, { x: 40, y: 50, name: '포플러역', line: 'bo' }, { x: 54, y: 50, name: '햇살정원역', line: 'b' },
  ];
  const FUTURE_STATIONS = [
    { x: 12, y: 14, name: '해바라기대역', line: 'g' }, { x: 68, y: 28, name: '숲공원역', line: 'g' }, { x: 68, y: 14, name: '고양이언덕역', line: 'g' },
    { x: 12, y: 50, name: '수국언덕역', line: 'b' }, { x: 68, y: 50, name: '조개해변역', line: 'b' }, { x: 40, y: 64, name: '솔방울역', line: 'o' },
  ];
  const AVE_X = [12, 26, 40, 54, 68], AVE_Y = [14, 28, 50, 64];
  const SEA_Y = 75.5;
  const MAP_VERSION = 'bay-3';
  // 해안선은 연속 곡선이 원본이다. 칸(바다·모래사장)은 이 곡선을 칸 중심에서 칠한 결과.
  function coastY(x) { return SEA_Y + 1.6 * Math.sin(x / 7) + 0.8 * Math.sin(x / 3.1); }
  const BEACH_W = 2.2, PROM_IN = 0.45, PROM_OUT = 0.95;   // 모래사장 폭, 산책로가 모래 쪽·땅 쪽으로 걸치는 폭(칸)
  // 기준 구역(계획서 P1): 조개해변 구역
  const REF_AREA = { x0: 54, y0: 62, x1: 68, y1: 77, name: '조개해변' };

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
    warehouse: { name: '물류센터', icon: '📦', fp: [2, 2], cost: 12e8, upkeep: 2.5e7, range: 9, cap: 10, desc: '반경 9칸 매장에 식자재를 모아 배송. 식자재 원가 -12%' },
    kitchen:   { name: '중앙주방', icon: '🍳', fp: [2, 1], cost: 25e8, upkeep: 4e7,   range: 9, cap: 8,  desc: '반경 9칸 음식 매장 원가 -18%, 품질 +8%' },
    roastery:  { name: '로스터리', icon: '🫘', fp: [1, 1], cost: 8e8,  upkeep: 1.5e7, desc: '회사 전체 카페 원두값 -35%, 품질 +6% (한 곳만)' },
    hq:        { name: '본사', icon: '🏢', fp: [2, 2], cost: 10e8, upkeep: 2e7, desc: '부서와 본사 직원을 두고 교육·리서치·홍보·물류·가맹관리·메뉴 개발을 해요. 가맹사업에 꼭 필요해요. (한 곳만)' },
    factory:   { name: '식품 공장', icon: '🏭', fp: [3, 2], cost: 30e8, upkeep: 4e7, industry: true, desc: '밀키트·소스를 만들어 마트에 납품해요(월 매출 약 2억원~). 우리 매장 식자재 원가 -5%' },
    rental:    { name: '임대 빌딩', icon: '🏬', fp: [2, 2], cost: 0, upkeep: 0, industry: true, desc: '빌딩을 지어 사무실·주거를 임대해요. 땅값과 동네 인기에 따라 임대 수입과 건물 가치가 달라져요' },
    smartfarm: { name: '스마트팜', icon: '🌱', fp: [2, 2], cost: 6e8, upkeep: 8e6, industry: true, desc: '채소 원가 -25%(회사 전체), 남는 채소를 팔아 월 1,500만원' },
  };
  const DEPTS = {
    train:     { name: '서비스 교육팀', icon: '🎓', desc: '매장 직원 능력치가 조금씩 오르고 사기가 높아져요. 자동 채용 직원 수준도 올라가요.' },
    research:  { name: '리서치·전략팀', icon: '🔍', desc: '뜰 동네를 한 달 먼저 알려주고, 상권 맞춤 전략으로 손님이 조금 늘어요.' },
    pr:        { name: '홍보팀', icon: '📣', desc: '인지도가 더 빨리 오르고 가만히 있어도 조금씩 올라요.' },
    logistics: { name: '물류·구매팀', icon: '🚚', desc: '회사 전체 식자재 원가가 내려가고 가맹점 공급 마진이 늘어요.' },
    fran:      { name: '직영·가맹관리팀', icon: '🤝', desc: '가맹 문의가 늘고 가맹점이 더 오래 버텨요. 매장 인테리어도 덜 낡아요.' },
    rnd:       { name: '메뉴 R&D팀', icon: '🧪', desc: '레시피가 저절로 개선되고 연구비가 줄며 메뉴 매력이 올라가요.' },
  };
  const DEPT_KEYS = Object.keys(DEPTS);
  const DIFFICULTY = {
    easy:   { name: '편안하게', cash: 8e8, personal: 3e8, ai: 0.7, distress: 90, desc: '자금이 넉넉하고 경쟁사가 느긋해요.' },
    normal: { name: '보통',     cash: 5e8, personal: 1e8, ai: 1.0, distress: 45, desc: '현실적인 출발. 실수하면 파산할 수 있어요.' },
    hard:   { name: '도전',     cash: 3e8, personal: 3e7, ai: 1.3, distress: 30, desc: '자금이 빠듯하고 경쟁사가 공격적이에요.' },
  };
  const PUBLIC = {
    park: { name: '공원',       icon: '🌳', cost: 5e8, desc: '관광객이 찾아오고 2칸 안 매장 매력 +10%, 주변 개발 촉진' },
    bus:  { name: '버스정류장', icon: '🚏', cost: 6e7, desc: '출퇴근 인구 유입, 주변 건물 성장 촉진', sponsor: true },
    parking: { name: '공영주차장', icon: '🅿️', cost: 15e8, desc: '반경 4칸 매장의 주차 여유 +40%. 차로 오는 가족·부유층 손님이 늘어요', sponsor: true },
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
  // ---------- 경쟁사 ----------
  const ARCHETYPES = {
    chain:    { name: '프랜차이즈 확장형', goal: '매장 수를 빠르게 늘려 시장을 장악하려 해요', max: 40, aggr: 1.2, pricing: 0.95, tier: 2, minCust: 110, start: 4, cash: 40e8, listed: true },
    premium:  { name: '프리미엄형', goal: '매장은 적게, 최고 품질과 높은 가격을 지켜요', max: 8, aggr: 0.5, pricing: 1.25, tier: 4, minCust: 80, start: 2, cash: 20e8, recipe: 4, listed: false },
    local:    { name: '동네 맛집형', goal: '한두 곳에서 최고 평점을 지키는 게 목표예요', max: 2, aggr: 0.25, pricing: 1.0, tier: 2, minCust: 60, start: 1, cash: 3e8, recipe: 5, listed: false },
    discount: { name: '박리다매형', goal: '싼 가격으로 소득이 낮은 동네를 공략해요', max: 25, aggr: 1.0, pricing: 0.85, tier: 1, minCust: 120, start: 3, cash: 25e8, listed: true },
    trend:    { name: '트렌드형', goal: '뜨는 동네와 유행 업종을 먼저 잡아요', max: 15, aggr: 1.0, pricing: 1.1, tier: 3, minCust: 90, start: 2, cash: 15e8, listed: true },
    investor: { name: '부동산 투자형', goal: '매장 건물을 사들여 자산을 불려요', max: 10, aggr: 0.7, pricing: 1.0, tier: 2, minCust: 100, start: 2, cash: 30e8, listed: true },
  };
  const ARCH_ORDER = ['chain', 'local', 'trend', 'premium', 'discount', 'investor', 'local', 'chain', 'local', 'trend'];
  const AI_SUFFIX = { cafe: ['커피', '카페', '로스터스'], bakery: ['베이커리', '제과', '빵집'], noodle: ['국수', '면옥', '칼국수'], burger: ['버거', '버거하우스'], dessert: ['디저트', '케이크', '파티세리'], snack: ['분식', '떡볶이'], chicken: ['치킨', '통닭'], pizza: ['피자', '피제리아'], hansik: ['밥상', '한식당', '식당'], japanese: ['라멘', '스시', '돈카츠'], chinese: ['반점', '차이나', '마라'], salad: ['샐러드', '그린볼'], bubbletea: ['티하우스', '버블티'], brunch: ['브런치', '키친'], pub: ['포차', '이자카야', '주막'] };
  const AI_PREFIX = ['구름', '보리밭', '한그릇', '달빛', '소나무', '바람', '오렌지', '동네', '작은', '하얀', '파란', '숲속', '골목', '햇살', '새벽', '노을', '모퉁이', '고래', '여우', '토끼', '곰돌', '별빛', '마당', '은하', '봄날', '온기', '단골', '반달', '호박', '사계절', '초록', '빨간', '꿀벌', '돌담', '바다', '시골', '할머니', '도토리', '참새', '등대'];
  const AI_COLORS = ['#7fa7d6', '#e3a07f', '#86b98f', '#c94f6d', '#a99bd9', '#e3a63c', '#6fb7b2', '#d9677e', '#8a7fc0', '#b98a5e', '#5f9e93', '#e46b5f'];
  const RELATED = { cafe: ['dessert', 'bakery', 'brunch'], bakery: ['cafe', 'dessert'], noodle: ['hansik', 'chinese'], burger: ['pizza', 'chicken'], dessert: ['cafe', 'bubbletea'], snack: ['chinese', 'chicken'], chicken: ['pub', 'pizza'], pizza: ['burger', 'chicken'], hansik: ['noodle', 'japanese'], japanese: ['hansik', 'pub'], chinese: ['noodle', 'snack'], salad: ['brunch', 'cafe'], bubbletea: ['dessert', 'cafe'], brunch: ['cafe', 'salad'], pub: ['chicken', 'japanese'] };
  function genCompanies(S, n) {
    const used = new Set(), out = [];
    for (let i = 0; i < n; i++) {
      const cat = CAT_KEYS[(i * 7 + Math.floor(rnd(S) * 3)) % CAT_KEYS.length];
      const arch = ARCH_ORDER[i % ARCH_ORDER.length];
      let name = '';
      for (let k = 0; k < 20 && (!name || used.has(name)); k++) name = pick(S, AI_PREFIX) + pick(S, AI_SUFFIX[cat]);
      used.add(name);
      const A = ARCHETYPES[arch];
      const focus = [cat].concat(arch === 'local' ? [] : RELATED[cat].slice(0, arch === 'chain' || arch === 'trend' ? 2 : 1));
      out.push({ name, color: AI_COLORS[i % AI_COLORS.length], logo: LOGO_SHAPES[i % LOGO_SHAPES.length], focus, pricing: A.pricing, aggr: A.aggr, style: pick(S, STYLE_KEYS), arch });
    }
    return out;
  }


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
  function isLot(t) { return !!t && t.t === 'land' && !t.b && t.ref == null && !t.open; }
  function anchorOf(S, t) { return t && t.ref != null ? S.tiles[t.ref] : t; }
  function hoodAt(S, x, y) { const t = tile(S, x, y); return t ? t.h : 0; }
  function hood(S, t) { return S.hoods[t.h]; }
  function riverC(x) { return 39 + 2.4 * Math.sin(x / 11) + 1.2 * Math.sin(x / 5.3); }
  function regionOf(x, y) {
    const c = riverC(x);
    if (y >= c - 3.5 && y <= c + 3.5 && x >= 16 && x <= 31) return 7;
    if (y < c) {
      if (x < 22 && y < 21) return 0;
      if (x < 38 && y < 23) return 1;
      if (x < 56 && y < 25) return 2;
      if (y < 23) return 3;
      if (x < 30) return 4;
      if (x < 52) return 5;
      return 6;
    }
    if (x < 26) return 8;
    if (x < 50) return y < 60 ? 9 : 10;
    return y < 57 ? 11 : 12;
  }
  function fits(S, x, y, w, d) {
    for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) if (!isLot(tile(S, x + i, y + j))) return false;
    return true;
  }
  function occupy(S, x, y, w, d, b) {
    b.w = w; b.d = d;
    const a = tile(S, x, y); a.b = b; a.tree = false;
    for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) { if (!i && !j) continue; const t = tile(S, x + i, y + j); t.ref = a.y * W + a.x; t.tree = false; }
    S.mapVer = (S.mapVer || 0) + 1; S._srcDirty = true;
  }
  function vacate(S, a) {
    const b = a.b; if (!b) return;
    for (let j = 0; j < (b.d || 1); j++) for (let i = 0; i < (b.w || 1); i++) { const t = tile(S, a.x + i, a.y + j); if (t) { t.ref = null; if (i || j) t.b = null; } }
    a.b = null;
    S.mapVer = (S.mapVer || 0) + 1; S._srcDirty = true;
  }
  // 빈 땅 (x,y)를 포함해 w×d (또는 d×w) 크기가 들어가는 자리
  function findFit(S, x, y, w, d) {
    for (const [ww, dd] of w === d ? [[w, d]] : [[w, d], [d, w]]) for (let oy = 0; oy < dd; oy++) for (let ox = 0; ox < ww; ox++) if (fits(S, x - ox, y - oy, ww, dd)) return { x: x - ox, y: y - oy, w: ww, d: dd };
    return null;
  }
  function placeBuilding(S, x, y, k, lvBoost) {
    const T = BTYPES[k]; if (!T) return false;
    const fps = T.fp.slice().sort(() => rnd(S) - 0.5);
    for (const [w, d] of fps) {
      const f = findFit(S, x, y, w, d);
      if (!f) continue;
      const lv = Math.round(T.floors[0] + (T.floors[1] - T.floors[0]) * clamp(rnd(S) * 0.7 + (lvBoost || 0), 0, 1));
      occupy(S, f.x, f.y, f.w, f.d, { k, lv: Math.max(T.floors[0], lv), v: Math.floor(rnd(S) * 6) });
      return true;
    }
    return false;
  }

  function buildMap(S) {
    S.tiles = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) S.tiles.push({ x, y, t: 'land', h: regionOf(x, y), b: null, ref: null, tree: false, rent: 0, road: null });
    const T = (x, y) => tile(S, x, y);
    // 강과 섬
    for (const t of S.tiles) {
      const c = riverC(t.x), dy = Math.abs(t.y - c);
      const island = t.x >= 17 && t.x <= 30;
      const half = island ? 3.6 : 2.6;
      if (dy <= half && !(island && dy <= 1.6)) t.t = 'water';
    }
    // 산과 호수
    for (const t of S.tiles) {
      const mx = (t.x - 40) / 11, my = (t.y - 3) / 5.5; if (mx * mx + my * my < 1) t.t = 'mount';
      const lx = (t.x - 70) / 5.2, ly = (t.y - 68) / 4.2; if (lx * lx + ly * ly < 1) t.t = 'water';
      // 남쪽 바다와 모래사장 (해안선이 완만하게 굽이침)
      const coast = coastY(t.x);
      if (t.y >= coast) { t.t = 'water'; t.sea = true; }
      else if (t.y >= coast - BEACH_W) t.beach = true;
    }
    // 대로 (2칸 폭)
    const setRoad = (t, kind) => { if (!t || t.t === 'mount') return; if (t.t === 'water') { if (kind === 'ave') { t.t = 'bridge'; t.road = 'ave'; } return; } if (t.road === 'ave') return; t.t = 'road'; t.road = kind; };
    for (const ax of AVE_X) for (let y = 0; y < H; y++) for (const x of [ax, ax + 1]) { const t = T(x, y); if (t.beach || t.y >= coastY(t.x) - BEACH_W - 1.2 || (t.t === 'water' && Math.abs(t.y - riverC(t.x)) > 4.5)) continue; setRoad(t, 'ave'); }
    for (const ay of AVE_Y) for (let x = 0; x < W; x++) for (const y of [ay, ay + 1]) setRoad(T(x, y), 'ave');
    // 강변: 물에 닿은 땅 한 줄은 한강공원, 그 바깥 한 줄은 강변도로
    const isRiver = t => t && t.t === 'water' && !t.sea && Math.abs(t.y - riverC(t.x)) < 5;
    const n8 = (t, f) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; if (f(T(t.x + dx, t.y + dy))) return true; } return false; };
    const bank = new Set();
    for (const t of S.tiles) if (t.t !== 'water' && t.t !== 'mount' && t.road !== 'ave' && (n8(t, isRiver) || t.beach)) { if (t.t === 'road') { t.t = 'land'; t.road = null; } bank.add(t); t.bank = true; }
    // 강변은 이면도로, 해변 앞은 차가 다니지 않는 산책로(walk)
    for (const t of S.tiles) if (!bank.has(t) && t.t === 'land' && n8(t, n => n && bank.has(n))) { if (n8(t, n => n && n.beach)) { t.t = 'road'; t.road = 'walk'; } else setRoad(t, 'st'); }
    // 산책로 곡선(원본): 모래사장 안쪽 가장자리를 따라감. 호수와 겹치는 구간은 끊음
    const prom = []; let seg = [];
    for (let x = -0.5; x <= W - 0.5 + 1e-6; x += 0.25) {
      const y = coastY(x) - BEACH_W - (PROM_OUT - PROM_IN) / 2, tt = T(Math.round(x), Math.round(y)), tt2 = T(Math.round(x), Math.round(y - 0.8));
      const blocked = (tt && tt.t === 'water' && !tt.sea) || (tt2 && tt2.t === 'water' && !tt2.sea);
      if (blocked) { if (seg.length > 3) prom.push(seg); seg = []; } else seg.push([+x.toFixed(2), +y.toFixed(3)]);
    }
    if (seg.length > 3) prom.push(seg);
    // 기준 구역의 작은 원형 광장: 상점가 끝, 산책로 바로 뒤
    const pc = { x: 61, y: +(coastY(61) - BEACH_W - 2.4).toFixed(2), r: 1.9 };
    for (const t of S.tiles) if (t.t === 'land' && !t.bank && Math.hypot(t.x - pc.x, t.y - pc.y) <= pc.r) { t.t = 'road'; t.road = 'walk'; t.plaza = true; }
    // 산책로 소품: 땅 쪽 가장자리에 가로등·벤치·나무·화분을 번갈아
    const props = []; let k = 0;
    for (const sg of prom) for (let i = 4; i < sg.length - 2; i += 7) { const [x, y] = sg[i]; props.push({ x, y: +(y - PROM_OUT * 0.55).toFixed(3), k: ['lamp', 'bench', 'tree', 'bench', 'lamp', 'planter'][k++ % 6], v: Math.floor(rnd(S) * 4) }); }
    S.world = { mapVersion: MAP_VERSION, coast: { base: SEA_Y, waves: [[1.6, 7], [0.8, 3.1]], beachW: BEACH_W }, prom, promIn: PROM_IN, promOut: PROM_OUT, promProps: props, plaza: pc, ref: REF_AREA };
    // 이면도로·골목: 대로로 둘러싸인 큰 블록(슈퍼블록)마다 같은 간격으로 반듯하게 나눔
    const BLOCK = { old: 3, uni: 4, res: 4, ind: 4, tour: 5, rich: 5, off: 5 };
    const cuts = (lo, hi, b) => { const L = hi - lo + 1, n = Math.max(0, Math.round((L + 1) / (b + 1)) - 1), out = []; for (let i = 1; i <= n; i++) out.push(lo - 1 + Math.round(i * (L + 1) / (n + 1))); return out; };
    const spans = (aves, max) => { const out = []; let lo = 0; for (const a of aves) { if (a - 1 >= lo) out.push([lo, a - 1]); lo = a + 2; } if (lo <= max) out.push([lo, max]); return out; };
    for (const [x0, x1] of spans(AVE_X, W - 1)) for (const [y0, y1] of spans(AVE_Y, H - 1)) {
      const hc = regionOf(Math.round((x0 + x1) / 2), Math.round((y0 + y1) / 2));
      const kind = HOODS[hc].kind, b = hc === 11 ? 6 : (BLOCK[kind] || 4);
      const vx = cuts(x0, x1, b), vy = cuts(y0, y1, Math.max(3, b - (kind === 'old' ? 0 : 1)));
      vx.forEach((x, i) => { for (let y = y0; y <= y1; y++) { const t = T(x, y); if (t && t.t === 'land' && !t.beach) { t.t = 'road'; t.road = kind === 'old' && i % 2 ? 'alley' : 'st'; } } });
      vy.forEach((y, i) => { for (let x = x0; x <= x1; x++) { const t = T(x, y); if (t && t.t === 'land' && !t.beach) { t.t = 'road'; t.road = kind === 'old' && i % 2 ? 'alley' : (t.road === 'alley' ? 'st' : 'st'); } } });
    }
    // 랜드마크 자리는 비워서 배치
    for (const k in LANDMARKS) {
      const L = LANDMARKS[k];
      for (let j = 0; j < L.d; j++) for (let i = 0; i < L.w; i++) { const t = T(L.x + i, L.y + j); if (t.t === 'road' && t.road !== 'ave') { t.t = 'land'; t.road = null; } if (L.mount) t.t = 'land'; }
    }
    fixRoads(S);
    for (const k in LANDMARKS) { const L = LANDMARKS[k]; if (fits(S, L.x, L.y, L.w, L.d)) occupy(S, L.x, L.y, L.w, L.d, { k: 'lm', kind: k, lv: 1 }); }
    // 랜드마크 둘레 한 칸은 비워 앞마당(광장·잔디)으로 둠: 건물에 둘러싸여 안 보이지 않게
    for (const k in LANDMARKS) { const L = LANDMARKS[k]; if (L.mount) continue; for (let y = L.y - 1; y <= L.y + L.d; y++) for (let x = L.x - 1; x <= L.x + L.w; x++) { const t = T(x, y); if (t && t.t === 'land' && !t.b && t.ref == null && !t.bank) { t.open = k === 'forest' || k === 'univ' ? 'lawn' : 'plaza'; t.tree = false; } } }
    // 강변 공원과 해변
    for (const t of S.tiles) if (t.bank && isLot(t)) occupy(S, t.x, t.y, 1, 1, { k: 'rpark', lv: 1, v: Math.floor(rnd(S) * 3), beach: !!t.beach });
    // 기준 구역 블록 안 중정: 길에 닿지 않은 빈 땅 일부를 작은 정원으로 남김(계획서 1.2-7 여백)
    for (const t of S.tiles) { if (t.h !== 12 || !isLot(t)) continue; const nearRoad = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const n = T(t.x + dx, t.y + dy); return n && n.t === 'road'; }); if (!nearRoad && rnd(S) < 0.35) { t.open = 'lawn'; t.tree = rnd(S) < 0.6; } }
    // 동네 공원: 건물보다 먼저 자리를 잡고, 자리가 막혔으면 가까운 빈 땅으로
    for (const [x, y] of [[33, 33], [9, 22], [47, 44], [62, 46], [18, 60], [35, 70], [20, 18], [50, 8], [6, 46], [30, 58], [46, 68], [64, 22], [16, 32], [58, 40], [24, 44], [44, 24]]) {
      let done = false;
      for (let r = 0; r < 4 && !done; r++) for (let dy = -r; dy <= r && !done; dy++) for (let dx = -r; dx <= r && !done; dx++) { const t = T(x + dx, y + dy); if (isLot(t) && !t.bank) { occupy(S, t.x, t.y, 1, 1, { k: 'park', lv: 1, v: 0 }); const n = T(t.x + 1, t.y); if (isLot(n) && !n.bank) occupy(S, n.x, n.y, 1, 1, { k: 'park', lv: 1, v: 1 }); done = true; } }
    }
    // 동네별 건물 채우기
    for (const t of S.tiles) {
      if (!isLot(t)) continue;
      const hd = HOODS[t.h];
      const r = rnd(S);
      if (r < hd.dev) placeBuilding(S, t.x, t.y, wpick(S, hd.mix), t.h === 2 || t.h === 7 || t.h === 9 ? 0.3 : 0);
      else if (r < hd.dev + 0.16) t.tree = true;
    }
    S.hoodCenters = HOODS.map((_, i) => { const ts = S.tiles.filter(t => t.h === i && t.t !== 'water'); return { x: Math.round(ts.reduce((a, t) => a + t.x, 0) / ts.length), y: Math.round(ts.reduce((a, t) => a + t.y, 0) / ts.length) }; });
    precomputeFixed(S);
  }
  // 도로망 정리: 대각선으로만 이어진 곳 메우기, 짧은 막다른 길 제거, 끊긴 조각 제거
  function fixRoads(S) {
    const T = (x, y) => tile(S, x, y);
    const isR = t => t && (t.t === 'road' || t.t === 'bridge');
    const free = t => t && t.t === 'land' && !t.b && t.ref == null && !Object.values(LANDMARKS).some(L => t.x >= L.x && t.x < L.x + L.w && t.y >= L.y && t.y < L.y + L.d);
    for (const t of S.tiles) {
      if (!isR(t)) continue;
      for (const [dx, dy] of [[1, 1], [1, -1]]) {
        const d = T(t.x + dx, t.y + dy); if (!isR(d)) continue;
        const a = T(t.x + dx, t.y), b = T(t.x, t.y + dy);
        if (isR(a) || isR(b)) continue;
        const f = free(a) ? a : free(b) ? b : null; if (f) { f.t = 'road'; f.road = 'st'; }
      }
    }
    for (let pass = 0; pass < 3; pass++) for (const t of S.tiles) {
      if (!isR(t) || t.road === 'ave' || t.t === 'bridge') continue;
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => isR(T(t.x + dx, t.y + dy))).length;
      if (n <= 1) {
        let len = 0, cx = t.x, cy = t.y, px = -1, py = -1;
        while (len < 4) { const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => T(cx + dx, cy + dy)).filter(q => isR(q) && !(q.x === px && q.y === py)); if (nb.length !== 1) break; px = cx; py = cy; cx = nb[0].x; cy = nb[0].y; len++; }
        if (len < 3) { t.t = 'land'; t.road = null; }
      }
    }
    const start = S.tiles.find(t => t.road === 'ave');
    const seen = new Set([start]), q = [start];
    while (q.length) { const c = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = T(c.x + dx, c.y + dy); if (isR(n) && !seen.has(n)) { seen.add(n); q.push(n); } } }
    for (const t of S.tiles) if (isR(t) && !seen.has(t)) { if (t.t === 'bridge') t.t = 'water'; else t.t = 'land'; t.road = null; }
  }
  function roadComponents(S) {
    const isR = t => t && (t.t === 'road' || t.t === 'bridge'); const seen = new Set(); let n = 0;
    for (const t of S.tiles) { if (!isR(t) || seen.has(t)) continue; n++; const q = [t]; seen.add(t); while (q.length) { const c = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const m = tile(S, c.x + dx, c.y + dy); if (isR(m) && !seen.has(m)) { seen.add(m); q.push(m); } } } }
    return n;
  }
  function hashI(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

  // 고정 요인(랜드마크·물·산까지 거리)은 한 번만 계산
  function precomputeFixed(S) {
    const water = S.tiles.filter(t => t.t === 'water'), mount = S.tiles.filter(t => t.t === 'mount');
    for (const t of S.tiles) {
      let lm = 0;
      for (const k in LANDMARKS) { const L = LANDMARKS[k]; const dx = Math.max(0, L.x - t.x, t.x - (L.x + L.w - 1)), dy = Math.max(0, L.y - t.y, t.y - (L.y + L.d - 1)); const d = dx + dy; if (d <= 5) lm = Math.max(lm, L.rent * (1 - d / 6)); }
      t.fx = { lm, view: water.some(w => Math.abs(w.x - t.x) + Math.abs(w.y - t.y) <= 3) ? 0.2 : mount.some(w => Math.abs(w.x - t.x) + Math.abs(w.y - t.y) <= 2) ? 0.08 : 0 };
    }
  }

  // 평당 월세 = 구역 기준 × 소득 × (1 + 랜드마크 + 역세권 + 조망 + 공원) × (1 − 노후도) × 밀도 × 화제성
  function landFactors(S, t) {
    const hd = S.hoods[t.h], H0 = HOODS[t.h];
    let st = 0;
    for (const s2 of S.stations) { const d = Math.abs(s2.x - t.x) + Math.abs(s2.y - t.y); if (d <= 5) st = Math.max(st, 0.45 * (1 - d / 6)); }
    let dens = 0, park = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const n = anchorOf(S, tile(S, t.x + dx, t.y + dy)); if (!n || !n.b) continue;
      const T2 = BTYPES[n.b.k]; if (T2 && T2.cls !== 'pub') dens += Math.min(6, n.b.lv) * 0.3; if (n.b.k === 'park' || n.b.k === 'rpark') park = 0.06;
    }
    return { base: H0.rent, income: Math.sqrt(hd.income / H0.income), lm: t.fx ? t.fx.lm : 0, st, view: t.fx ? t.fx.view : 0, age: hd.age, dens: Math.min(0.4, dens * 0.01), park, hype: hd.rentMult };
  }
  function computeLand(S) {
    for (const t of S.tiles) {
      if (t.t !== 'land') { t.rent = 0; continue; }
      const f = landFactors(S, t);
      t.rent = Math.round(f.base * f.income * f.hype * (1 + f.lm + f.st + f.view + f.park) * (1 - 0.35 * f.age) * (1 + f.dens) / 1000) * 1000;
    }
  }

  // ---------- 손님 원천 (공간 색인 포함) ----------
  function buildingPop(b) {
    const T2 = BTYPES[b.k]; if (!T2) return 0;
    if (T2.fixedPop) return T2.fixedPop;
    return T2.popPer * b.lv * (b.w || 1) * (b.d || 1);
  }
  function rebuildSources(S) {
    const out = [];
    for (const t of S.tiles) {
      if (!t.b) continue;
      const b = t.b, hd = S.hoods[t.h];
      const cx = t.x + ((b.w || 1) - 1) / 2, cy = t.y + ((b.d || 1) - 1) / 2;
      const push = (seg, prof, pop, inc) => { if (pop > 0) out.push({ x: Math.round(cx), y: Math.round(cy), seg, prof, pop: pop * hd.popMult * (seg === 'off' ? hd.offMult : 1), income: hd.income * inc, h: t.h, _s: {} }); };
      if (BTYPES[b.k]) { const T2 = BTYPES[b.k]; push(T2.seg, T2.prof, buildingPop(b), T2.inc); if (T2.tourPop) push('tour', 'tourist', T2.tourPop, 1); }
      else if (b.k === 'lm') { const L = LANDMARKS[b.kind]; push(L.seg, L.prof, L.pop, 1.1); }
      else if (b.k === 'fac') { const f = S.facs.find(x => x.id === b.id); if (f && f.kind === 'rental') push(['off', 'ind'].includes(HOODS[t.h].kind) ? 'off' : 'res', HOODS[t.h].kind === 'off' ? 'worker' : 'single', 120 * f.level, 1); }
    }
    for (const s2 of S.stations) {
      const h = hoodAt(S, s2.x, s2.y), m = S.hoods[h].popMult, inc = S.hoods[h].income;
      out.push({ x: s2.x, y: s2.y, seg: 'off', prof: 'worker', pop: 520 * m, income: inc, h, _s: {}, ext: 1 }, { x: s2.x, y: s2.y, seg: 'uni', prof: 'student', pop: 160 * m, income: inc * 0.7, h, _s: {}, ext: 1 }, { x: s2.x, y: s2.y, seg: 'tour', prof: 'shopper', pop: 140 * m, income: inc, h, _s: {}, ext: 1 });
    }
    // 외곽 생활권(결정 (가)): 지도 밖 주거·직장 인구가 대로 진입로로 들어옴
    for (const ax of AVE_X) for (const y of [0, H - 1]) { const t = tile(S, ax, y); if (t && t.t === 'road') out.push({ x: ax, y: y ? y - 2 : 2, seg: 'off', prof: 'worker', pop: 380, income: 420, h: t.h, _s: {}, ext: 1 }, { x: ax, y: y ? y - 2 : 2, seg: 'res', prof: 'family', pop: 260, income: 380, h: t.h, _s: {}, ext: 1 }); }
    for (const ay of AVE_Y) for (const x of [0, W - 1]) { const t = tile(S, x, ay); if (t && t.t === 'road') out.push({ x: x ? x - 2 : 2, y: ay, seg: 'off', prof: 'young', pop: 380, income: 400, h: t.h, _s: {}, ext: 1 }, { x: x ? x - 2 : 2, y: ay, seg: 'res', prof: 'single', pop: 260, income: 330, h: t.h, _s: {}, ext: 1 }); }
    const G = 8, gw = Math.ceil(W / G), grid = new Array(gw * Math.ceil(H / G)).fill(null).map(() => []);
    for (const s of out) grid[Math.floor(s.y / G) * gw + Math.floor(s.x / G)].push(s);
    S._srcs = out; S._grid = { G, gw, cells: grid }; S._srcDirty = false;
    return out;
  }
  function sources(S) { if (!S._srcs || S._srcDirty) rebuildSources(S); return S._srcs; }
  function nearSources(S, x, y, r) {
    sources(S);
    const { G, gw, cells } = S._grid, out = [];
    for (let cy = Math.max(0, Math.floor((y - r) / G)); cy <= Math.min(Math.ceil(H / G) - 1, Math.floor((y + r) / G)); cy++)
      for (let cx = Math.max(0, Math.floor((x - r) / G)); cx <= Math.min(gw - 1, Math.floor((x + r) / G)); cx++)
        for (const s of cells[cy * gw + cx]) if (Math.abs(s.x - x) + Math.abs(s.y - y) <= r) out.push(s);
    return out;
  }
  function population(S) { return Math.round(sources(S).reduce((a, s) => a + s.pop, 0)); }

  // ---------- 삶의 질 ----------
  // ---------- 교통·주차 ----------
  // 구역별 혼잡도(0~1.5): 인구 × 시간대 활동 ÷ 도로 용량
  const TRAFFIC_HOURS = [0.1, 0.05, 0.03, 0.03, 0.05, 0.15, 0.4, 0.9, 1.0, 0.6, 0.45, 0.55, 0.7, 0.6, 0.5, 0.5, 0.6, 0.85, 1.0, 0.8, 0.55, 0.4, 0.3, 0.2];
  function computeTraffic(S) {
    const pop = S.hoods.map(() => 0), cap = S.hoods.map(() => 0), lots = S.hoods.map(() => 0);
    for (const sc of sources(S)) pop[sc.h] += sc.pop;
    for (const t of S.tiles) { if (t.t === 'road' || t.t === 'bridge') cap[t.h] += t.road === 'ave' ? 3 : t.road === 'st' ? 1.2 : 0.3; if (t.b && t.b.k === 'parking') lots[t.h]++; }
    S.traffic = S.hoods.map((hd, i) => ({ base: clamp(pop[i] / Math.max(1, cap[i]) / 28, 0.1, 1.5), lots: lots[i] }));
  }
  function congestion(S, h, hour) {
    if (!S.traffic) computeTraffic(S);
    const w = S.weather && (S.weather.kind === 'rain' || S.weather.kind === 'snow') ? 1.25 : 1;
    const d = S.day; const wk = d && (d.weekend || d.holiday) ? 0.7 : 1;
    return clamp(S.traffic[h].base * TRAFFIC_HOURS[hour % 24] * w * wk, 0, 1.6);
  }
  const PARK_BASE = { off: 0.35, old: 0.25, uni: 0.3, res: 0.55, ind: 0.6, tour: 0.5, rich: 0.75 };
  function parkingScore(S, st) {
    const t = tile(S, st.x, st.y); let v = PARK_BASE[HOODS[t.h].kind] || 0.5;
    if (st.owned) v += 0.15;
    if ((st.size || 1) >= 3) v += 0.1;
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const n = tile(S, st.x + dx, st.y + dy); if (n && n.b && n.b.k === 'parking' && Math.abs(dx) + Math.abs(dy) <= 4) v += 0.4; }
    return clamp(v, 0.1, 1);
  }
  // 정책 AI: 분기마다 가장 막히는 구역을 골라 주차장이나 버스정류장을 짓는다
  function policyQuarter(S) {
    computeTraffic(S);
    const ranked = S.hoods.map((hd, i) => ({ i, c: S.traffic[i].base, lots: S.traffic[i].lots })).sort((a, b) => b.c - a.c);
    const top = ranked[0];
    if (!top || top.c < 0.55) { log(S, '🏛️ 시청 교통 점검: 큰 혼잡 없이 도로가 원활해요.', 'info'); return; }
    const kind = top.lots < 2 && rnd(S) < 0.6 ? 'parking' : 'bus';
    const lots = S.tiles.filter(t => t.h === top.i && isLot(t));
    if (!lots.length) { log(S, `🏛️ 시청: ${HOODS[top.i].name} 혼잡도 ${Math.round(top.c * 100)} — 땅이 없어 출퇴근 시차제를 권고했어요.`, 'info'); S.traffic[top.i].base *= 0.95; return; }
    const t = pick(S, lots);
    occupy(S, t.x, t.y, 1, 1, { k: kind, lv: 1, v: 0 });
    computeLand(S); computeTraffic(S);
    log(S, `🏛️ 시청 정책: ${HOODS[top.i].name} 출퇴근 혼잡도 ${Math.round(top.c * 100)} → ${kind === 'parking' ? '공영주차장을 새로 지어요' : '버스정류장을 새로 놓아요'}.`, 'good');
  }

  function computeQol(S) {
    const cnt = S.hoods.map(() => ({ parks: 0, lms: 0, sts: 0, nature: 0 }));
    for (const t of S.tiles) {
      const c = cnt[t.h];
      if (t.b && (t.b.k === 'park' || t.b.k === 'rpark')) c.parks++;
      if (t.b && t.b.k === 'lm') c.lms++;
      if (t.t === 'water' || t.t === 'mount') c.nature = 8;
    }
    for (const s2 of S.stations) cnt[hoodAt(S, s2.x, s2.y)].sts++;
    S.hoods.forEach((hd, i) => {
      const c = cnt[i];
      hd.qol = Math.round(clamp(40 + Math.min(4, c.parks) * 3 + c.lms * 6 + Math.min(2, c.sts) * 7 + c.nature + (hd.income - 400) / 15 - hd.age * 25 + hd.hype / 12, 5, 98));
    });
  }

  // ---------- 본사 ----------
  function hqSalaryAsk(e) { return Math.round((2.8e6 + e.exp * 4e4) / 1e4) * 1e4; }
  function makeHqStaff(S, dept) {
    const e = { id: S.nextId++, name: pick(S, SURNAMES) + pick(S, GIVEN), dept, exp: statRoll(S, rnd(S) < 0.15 ? 75 : 52, 14), mbti: pick(S, MBTIS), morale: 70, salary: 0, days: 0 };
    e.salary = hqSalaryAsk(e); return e;
  }
  function refreshHqCands(S) { S.hqCands = []; for (let i = 0; i < 6; i++) S.hqCands.push(makeHqStaff(S, DEPT_KEYS[(i + Math.floor(rnd(S) * 6)) % 6])); }
  function deptPower(S, c, d) {
    if (c.ai) return 1;
    if (!c.hq) return 0;
    let sum = 0;
    for (const e of c.hq.staff) if (e.dept === d) sum += (e.exp / 60) * (0.7 + 0.3 * e.morale / 100);
    return Math.min(4, Math.pow(sum, 0.85));
  }
  function hqHire(S, candId) {
    const c = S.companies[0]; if (!c.hq) return { ok: false, msg: '본사를 먼저 지어야 해요.' };
    const i = S.hqCands.findIndex(x => x.id === candId); if (i < 0) return { ok: false };
    if (c.hq.staff.length >= 30) return { ok: false, msg: '본사 직원은 30명까지예요.' };
    const e = S.hqCands.splice(i, 1)[0]; c.hq.staff.push(e);
    return { ok: true, msg: `${e.name}님이 ${DEPTS[e.dept].name}에 합류했어요.` };
  }
  function hqAct(S, id, act, arg) {
    const c = S.companies[0]; if (!c.hq) return { ok: false };
    const i = c.hq.staff.findIndex(x => x.id === id); if (i < 0) return { ok: false };
    const e = c.hq.staff[i];
    if (act === 'dept') { e.dept = arg; e.morale -= 5; return { ok: true }; }
    if (act === 'raise') { e.salary = Math.round(e.salary * 1.05 / 1e4) * 1e4; e._bonus = (e._bonus || 0) + 12; return { ok: true, msg: `${e.name}님 연봉을 올렸어요.` }; }
    if (act === 'workshop') { const cost = 3e6; if (c.cash < cost) return { ok: false, msg: '자금이 부족해요.' }; if (e.exp >= 95) return { ok: false, msg: '이미 최고 전문가예요.' }; c.cash -= cost; c.cur.hq += cost; e.exp = Math.min(98, e.exp + 3 + Math.floor(rnd(S) * 3)); return { ok: true, msg: `${e.name}님이 외부 워크숍을 다녀왔어요.` }; }
    if (act === 'fire') { c.hq.staff.splice(i, 1); const sev = e.days >= 365 ? e.salary * Math.floor(e.days / 365) : 0; c.cash -= sev; c.cur.hq += sev; return { ok: true, msg: `${e.name}님과 계약을 끝냈어요.${sev ? ` 퇴직금 ${won(sev)}` : ''}` }; }
    return { ok: false };
  }
  function hqDaily(S, dim) {
    for (const c of S.companies) {
      if (!c.hq || c.dead) continue;
      let pay = 0;
      for (const e of c.hq.staff.slice()) {
        pay += e.salary / dim; e.days++;
        const mates = c.hq.staff.filter(o => o !== e && o.dept === e.dept);
        const rel = mates.length ? mates.reduce((a, o) => a + compat(e.mbti, o.mbti), 0) / mates.length : 0;
        const target = 65 + (e.salary / hqSalaryAsk(e) - 1) * 120 + rel * 15 + (e._bonus || 0);
        e.morale = clamp(e.morale + (target - e.morale) * 0.08, 0, 100);
        if (e._bonus) e._bonus *= 0.92;
        if (e.days % 30 === 0 && e.exp < 85) e.exp++;
        if (e.morale < 30 && rnd(S) < 0.01) { c.hq.staff.splice(c.hq.staff.indexOf(e), 1); log(S, `👋 본사 ${DEPTS[e.dept].name} ${e.name}님이 회사를 떠났어요.`, 'warn'); }
      }
      c.cash -= pay; c.cur.hq += pay;
    }
  }

  // ---------- 새 게임 ----------
  function newGame(opts) {
    opts = opts || {};
    const S = {
      v: 6, schemaVersion: 6, mapVersion: MAP_VERSION, contentVersion: 2, rng: (opts.seed || 20261109) | 0, hour: 6,
      tiles: [], stores: [], facs: [], companies: [], news: [], nextId: 1,
      hoods: HOODS.map(h => ({ hype: h.hype || 0, rentMult: 1 + (h.hype || 0) / 250, popMult: 1, offMult: 1, transit: false, festival: 0, income: h.income, age: h.age, qol: 50, displaced: 0, gentri: 0 })),
      stations: STATION_SITES.map(x => Object.assign({}, x)), hqCands: [], nextHype: null,
      ingr: {}, trends: {}, econ: { mult: 1, until: 0 }, minWage: BASE_MIN_WAGE, nextMinWage: null,
      founder: { cash: 0 }, quests: {}, distress: 0, gameOver: false, autoHire: true, mapVer: 1,
      opts: { difficulty: opts.difficulty || 'normal', events: opts.events !== false, competitors: Math.max(0, Math.min(50, opts.competitors == null ? 8 : opts.competitors)), sponsor: !!opts.sponsor },
      macro: { base: 2.5, hist: [2.5] },
      weather: null, cands: [], stats: { pop: [] }, day: null,
    };
    buildMap(S);
    computeLand(S); computeQol(S);
    for (const k in INGR) S.ingr[k] = { p: INGR[k].base, hist: [INGR[k].base] };
    const D0 = DIFFICULTY[S.opts.difficulty] || DIFFICULTY.normal;
    const player = makeCompany(S, 0, opts.name || '모락상회', opts.color || '#f2b950', true);
    player.logo = opts.logo || 'circle';
    player.cash = D0.cash;
    S.founder.cash = D0.personal;
    S.companies.push(player);
    genCompanies(S, S.opts.competitors).forEach((p, i) => {
      const A = ARCHETYPES[p.arch];
      const c = makeCompany(S, i + 1, p.name, p.color, false);
      c.logo = p.logo;
      c.ai = { focus: p.focus, pricing: p.pricing, aggr: p.aggr * D0.ai, style: p.style, arch: p.arch, max: A.max, tier: A.tier, minCust: A.minCust };
      c.cash = A.cash * (0.8 + rnd(S) * 0.4); c.listed = A.listed;
      for (const cat of p.focus) c.brand[cat] = 8 + rnd(S) * (A.start * 4);
      c.recipe[p.focus[0]] = A.recipe || 2;
      S.companies.push(c);
    });
    startDay(S, true);
    S._bulk = true;
    for (const c of S.companies) {
      if (!c.ai) continue;
      const A = ARCHETYPES[c.ai.arch];
      for (let i = 0; i < A.start; i++) {
        const cat = c.ai.focus[i % c.ai.focus.length];
        const spot = aiLot(S, c, cat);
        if (spot) openStore(S, c.id, spot.x, spot.y, cat, { size: A.tier >= 3 ? 2 : (rnd(S) < 0.5 ? 1 : 2), style: c.ai.style, tier: A.tier, free: true });
      }
    }
    S._bulk = false;
    refreshCands(S); refreshHqCands(S);
    computeDemand(S);
    assignSupply(S);
    for (const c of S.companies) {
      c.value = valuation(S, c);
      if (c.ai) { c.shares = Math.max(1e5, Math.round(c.value / 25000 / 1000) * 1000); c.founderShares = Math.round(c.shares * (c.listed ? 0.4 : 1)); }
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
      roastery: false, farm: false, app: false, hq: null, dividend: 0, holdings: {}, ev: [],
      cur: blankLedger(), months: [], dailyNI: [], storeHist: [], dead: false, ai: null, _prev: 0,
    };
  }
  function blankLedger() { return { rev: 0, royalty: 0, biz: 0, cogs: 0, wage: 0, rent: 0, util: 0, card: 0, dlv: 0, mkt: 0, upkeep: 0, hq: 0, bizCost: 0, interest: 0, dep: 0, tax: 0, other: 0, capex: 0, served: 0 }; }
  function ledgerNI(L) { return L.rev + L.royalty + (L.biz || 0) - L.cogs - L.wage - L.rent - L.util - L.card - (L.dlv || 0) - L.mkt - L.upkeep - (L.hq || 0) - (L.bizCost || 0) - L.interest - L.dep; }

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
  function hourCap(st, h) { const p = hourParts(st, h); return p.dine; }
  function hourParts(st, h) {
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
    const ffx = st.furn ? furnFx(st) : null; if (ffx) k *= ffx.kitF;
    if (mgr) { k *= 1.08; hall *= 1.08; }
    if (hall === 0) { hall = k * 0.6; k *= 0.7; }
    const seatCap = seatCapOf(st);
    const ch = st._chem || 1;
    return { dine: Math.max(0, Math.min(k, hall, seatCap) * ch), kitchen: k * ch };
  }
  function seatCapOf(st) {
    const cat = CATS[st.cat]; let dwell = cat.dwell;
    if (cat.study && st.segDem) { const tot = SEG_KEYS.reduce((a, k) => a + st.segDem[k], 0) || 1; dwell *= 1 + 0.8 * st.segDem.uni / tot; }
    const ffx = st.furn ? furnFx(st) : null;
    return SIZES[st.size].py * 1.3 / dwell / (1 - cat.takeout) * (ffx ? ffx.seatF : 1);
  }
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
  function researchCost(c, cat) { return r5(2e7 * Math.pow(c.recipe[cat], 1.5) * (1 - 0.08 * (c.ai ? 1 : c.hq ? Math.min(4, c.hq.staff.filter(e => e.dept === 'rnd').reduce((a, e) => a + e.exp / 60, 0)) : 0))); }
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

  // 공급자 계약(계획서 P2): 값·품질·납품 안정성이 다름
  const VENDORS = {
    local: { name: '모락 농협', price: 1.0, qual: 1.0, rel: 0.98, desc: '무난한 값과 품질, 거의 늘 제때 와요.' },
    whole: { name: '바다 도매상', price: 0.9, qual: 0.93, rel: 0.88, desc: '10% 싸지만 품질이 조금 낮고 가끔 절반만 와요.' },
    farm:  { name: '해바라기 직송 농장', price: 1.12, qual: 1.08, rel: 0.95, desc: '비싸지만 신선해서 맛이 좋아져요.' },
  };
  function setVendor(S, id, key) { const st = S.stores.find(s => s.id === id); if (!st || !VENDORS[key]) return { ok: false }; st.vendor = key; return { ok: true, msg: `${VENDORS[key].name}와 납품 계약을 맺었어요.` }; }
  // 가게 이름: 매장마다 고유한 상호(예: 윤슬 식탁, 오늘의 빵)
  const TITLE_PRE = ['윤슬', '오늘의', '바다', '햇살', '모락', '포근', '소금', '달빛', '몽글', '한입', '골목', '파도'];
  const TITLE_SUF = { cafe: '커피', bakery: '빵', noodle: '국수', burger: '버거', dessert: '디저트', snack: '분식', chicken: '치킨', pizza: '피자', hansik: '식탁', japanese: '스시', chinese: '반점', salad: '샐러드', bubbletea: '티하우스', brunch: '브런치', pub: '이자카야' };
  function storeTitle(st) { return TITLE_PRE[(st.id * 7 + st.x) % TITLE_PRE.length] + ' ' + (TITLE_SUF[st.cat] || CATS[st.cat].name); }
  function unitCost(S, comp, st) {
    const cat = CATS[st.cat];
    const base = (st._mi ? st._mi.ticket * st._mi.cost : cat.ticket * cat.cogs) / VAT;
    let idx = 0;
    for (const k in cat.recipe) {
      if (k === 'etc') { idx += cat.recipe[k]; continue; }
      let p = S.ingr[k].p / INGR[k].base;
      if (k === 'bean' && comp.roastery) p *= 0.65;
      if ((k === 'meat' || k === 'veg') && comp.farm) p *= 0.85;
      if (k === 'veg' && comp.smartfarm) p *= 0.75;
      idx += cat.recipe[k] * p;
    }
    const mode = st.supply;
    const m = mode === 'kitchen' ? (cat.food ? 0.82 : 0.88) : mode === 'warehouse' ? 0.88 : 1.08;
    const waste = (1 + Math.max(0, 50 - (st._skill || 50)) / 50 * 0.06) * (1 - 0.02 * deptPower(S, comp, 'logistics')) * (comp.factory ? 0.95 : 1);
    let ev = 1; for (const e of st.ev) if (e.until > S.hour && STORE_EVENTS[e.kind].cogs) ev *= STORE_EVENTS[e.kind].cogs;
    return base * idx * m * waste * ev * (VENDORS[st.vendor || 'local'].price);
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
    q *= VENDORS[st.vendor || 'local'].qual;
    return q;
  }
  function interiorAppeal(st, seg) {
    const i = st.interior, m = STYLES[i.style].appeal[seg];
    return (0.85 + 0.15 * i.cond / 100) * (1 + (i.tier - 1) * 0.09 * (0.5 + m));
  }

  // ---------- 매장 가구 배치 ----------
  // 매장 안은 칸 격자. 왼쪽 두 줄(x<2)이 주방, 나머지가 홀, 오른쪽 앞 모서리 한 칸은 입구.
  // zone: kitchen(주방에만) · hall(홀에만) · any. seats 좌석, kit 주방 속도, fresh 신선도(품질), deco 꾸밈 점수, segs 좋아하는 손님층
  // 매장 안 격자(칸 수). 넓이를 예전의 4배로(가로·세로 2배). KW는 주방 폭
  const ROOM = [null, [14, 10], [16, 12], [18, 14]], KW = [0, 4, 4, 5];
  function kitchenW(size) { return KW[size]; }
  const FURN = {
    counter:  { name: '계산대',        icon: '🧾', grp: 'base',    zone: 'any',     w: 1, d: 2, cost: 2.5e6, need: true, desc: '주문을 받는 곳. 매장마다 하나는 꼭 있어야 해요.' },
    stove1:   { name: '가정용 화구',   icon: '🔥', grp: 'kitchen', zone: 'kitchen', w: 1, d: 1, cost: 1.2e6, kit: 0.06, desc: '화구 2개. 기본 주방 속도.' },
    stove2:   { name: '업소용 화구',   icon: '🔥', grp: 'kitchen', zone: 'kitchen', w: 1, d: 1, cost: 4e6,   kit: 0.11, desc: '화구 4개. 조리가 빨라져요.' },
    stove3:   { name: '고화력 레인지', icon: '🔥', grp: 'kitchen', zone: 'kitchen', w: 1, d: 1, cost: 9e6,   kit: 0.16, fresh: 0.01, desc: '불맛이 살아나고 가장 빨라요.' },
    fridge1:  { name: '소형 냉장고',   icon: '🧊', grp: 'kitchen', zone: 'kitchen', w: 1, d: 1, cost: 1e6,   fresh: 0.01, desc: '재료 신선도 조금 유지.' },
    fridge2:  { name: '업소용 냉장고', icon: '🧊', grp: 'kitchen', zone: 'kitchen', w: 1, d: 1, cost: 3.5e6, fresh: 0.03, desc: '재료가 오래 신선해 품질이 올라요.' },
    fridge3:  { name: '숙성 냉장고',   icon: '🧊', grp: 'kitchen', zone: 'kitchen', w: 1, d: 1, cost: 8e6,   fresh: 0.05, desc: '온도·습도 조절. 품질이 가장 좋아요.' },
    espresso: { name: '에스프레소 머신', icon: '☕', grp: 'kitchen', zone: 'kitchen', w: 1, d: 1, cost: 7e6, kit: 0.12, fresh: 0.02, desc: '음료 업종은 이게 화구 역할을 해요.' },
    oven:     { name: '오븐',          icon: '🥖', grp: 'kitchen', zone: 'kitchen', w: 1, d: 1, cost: 5e6,   kit: 0.08, desc: '빵·피자·디저트 업종에 좋아요.' },
    sink:     { name: '개수대',        icon: '🚰', grp: 'kitchen', zone: 'kitchen', w: 1, d: 1, cost: 8e5,   kit: 0.03, desc: '설거지가 빨라져요.' },
    showcase: { name: '쇼케이스',      icon: '🍰', grp: 'base',    zone: 'any',     w: 1, d: 1, cost: 3e6,   deco: 3, segs: { tour: 1, res: 1 }, desc: '진열된 디저트가 손님을 끌어요.' },
    table2:   { name: '2인 원형 테이블', icon: '🪑', grp: 'seat',  zone: 'hall',    w: 1, d: 1, cost: 6e5,   seats: 2, desc: '작은 원형 테이블과 의자 둘.' },
    table4:   { name: '4인 테이블',    icon: '🍽️', grp: 'seat',    zone: 'hall',    w: 2, d: 1, cost: 1.4e6, seats: 4, segs: { res: 1 }, desc: '가족 손님이 좋아해요.' },
    bar:      { name: '바 테이블',     icon: '🍸', grp: 'seat',    zone: 'hall',    w: 2, d: 1, cost: 1.2e6, seats: 3, segs: { off: 1 }, desc: '혼자 온 손님이 앉기 좋아요.' },
    sofa:     { name: '소파석',        icon: '🛋️', grp: 'seat',    zone: 'hall',    w: 2, d: 1, cost: 2.2e6, seats: 3, deco: 2, segs: { uni: 1, tour: 1 }, desc: '오래 머물고 싶어져요.' },
    waiting:  { name: '대기 의자',     icon: '💺', grp: 'seat',    zone: 'hall',    w: 1, d: 1, cost: 4e5,   deco: 1, desc: '줄 선 손님이 덜 떠나요.' },
    plant:    { name: '화분',          icon: '🪴', grp: 'deco',    zone: 'any',     w: 1, d: 1, cost: 2e5,   deco: 1.5, segs: { res: 1 }, desc: '초록이 있으면 편안해요.' },
    tree:     { name: '큰 나무 화분',  icon: '🌳', grp: 'deco',    zone: 'hall',    w: 1, d: 1, cost: 7e5,   deco: 3, segs: { tour: 1, res: 1 }, desc: '사진 찍기 좋은 자리가 돼요.' },
    shelf:    { name: '책장',          icon: '📚', grp: 'deco',    zone: 'hall',    w: 1, d: 1, cost: 9e5,   deco: 2.5, segs: { uni: 1, off: 1 }, desc: '대학생과 직장인이 좋아해요.' },
    lamp:     { name: '스탠드 조명',   icon: '💡', grp: 'deco',    zone: 'hall',    w: 1, d: 1, cost: 5e5,   deco: 2, segs: { tour: 1 }, desc: '저녁 분위기가 좋아져요.' },
    rug:      { name: '러그',          icon: '🟫', grp: 'deco',    zone: 'hall',    w: 2, d: 2, cost: 6e5,   deco: 2, floor: true, desc: '바닥에 깔아 다른 가구와 겹칠 수 있어요.' },
    piano:    { name: '작은 피아노',   icon: '🎹', grp: 'deco',    zone: 'hall',    w: 2, d: 1, cost: 6e6,   deco: 6, segs: { tour: 1, res: 1 }, desc: '분위기가 확 살아나요.' },
    radio:    { name: '레트로 라디오', icon: '📻', grp: 'deco',    zone: 'any',     w: 1, d: 1, cost: 4e5,   deco: 1.5, segs: { uni: 1 }, desc: '잔잔한 음악이 흘러요.' },
  };
  const FURN_KEYS = Object.keys(FURN);
  const DRINK_CATS = ['cafe', 'bubbletea'];
  function roomOf(st) { return ROOM[st.size]; }
  function zoneAt(st, x, y) { const [nx, ny] = roomOf(st); if (x === nx - 1 && y === ny - 1) return 'door'; return x < KW[st.size] ? 'kitchen' : 'hall'; }
  function furnRect(f) { const F = FURN[f.k]; return (f.r || 0) % 2 ? { w: F.d, d: F.w } : { w: F.w, d: F.d }; }
  // 자유 배치(계획서 2.4): 위치는 0.25칸 단위 실수, 회전 4방향. 충돌은 사각형 겹침으로 검사
  function fbox(f) { const r = furnRect(f); return { x0: f.x, y0: f.y, x1: f.x + r.w, y1: f.y + r.d }; }
  const ovl = (a, b) => a.x0 < b.x1 - 1e-6 && b.x0 < a.x1 - 1e-6 && a.y0 < b.y1 - 1e-6 && b.y0 < a.y1 - 1e-6;
  // 업종·크기별 기본 배치
  function defaultFurn(cat, size) {
    const [nx, ny] = ROOM[size], kw = KW[size], L = [];
    const heat = DRINK_CATS.includes(cat) ? 'espresso' : ['bakery', 'pizza', 'dessert'].includes(cat) ? 'oven' : 'stove1';
    // 주방: 뒷벽을 따라 냉장고·화구·개수대 줄, 가운데 작업 공간, 앞쪽에 계산대
    const line = ['fridge1', heat, heat === 'stove1' ? 'stove1' : 'stove1', 'sink', 'fridge1'];
    if (size >= 2) line.push(heat === 'oven' ? 'oven' : 'sink');
    if (size >= 3) line.push('fridge1');
    line.forEach((k, i) => { if (i < ny - 1) L.push({ k, x: 0, y: i }); });
    L.push({ k: 'counter', x: kw - 1, y: 2 }, { k: 'counter', x: kw - 1, y: 5 });
    if (['bakery', 'dessert', 'cafe'].includes(cat)) L.push({ k: 'showcase', x: kw - 1, y: 4 });
    // 홀: 뒷벽 소파, 넓은 통로를 두고 테이블 줄, 모서리 화분·책장
    for (let x = kw + 2; x + 2 <= nx - 1; x += 3) L.push({ k: 'sofa', x, y: 0 });
    const want = [0, 9, 12, 16][size]; let n = 0;
    for (let y = 2.5; y < ny - 1.5 && n < want; y += 2.5) for (let x = kw + 2; x < nx - 1.5 && n < want; x += 2.5) { L.push({ k: n % 3 === 1 && x + 2 < nx - 1 ? 'table4' : 'table2', x, y }); n++; }
    L.push({ k: 'plant', x: nx - 1, y: 0 }, { k: 'plant', x: kw, y: ny - 1 }, { k: 'tree', x: nx - 1, y: Math.floor(ny / 2) }, { k: 'waiting', x: nx - 3, y: ny - 1 });
    if (size >= 2) L.push({ k: 'shelf', x: kw + 1, y: 0 }, { k: 'lamp', x: nx - 2, y: 1 });
    return L.filter(f => furnFits({ size, furn: L }, f, f));
  }
  function furnCells(f) { const B = fbox(f), out = []; for (let y = Math.floor(B.y0); y < Math.ceil(B.y1 - 1e-6); y++) for (let x = Math.floor(B.x0); x < Math.ceil(B.x1 - 1e-6); x++) out.push([x, y]); return out; }
  function furnFits(st, f, ignore) {
    const F = FURN[f.k], [nx, ny] = ROOM[st.size]; if (!F) return false;
    const B = fbox(f);
    if (B.x0 < -1e-6 || B.y0 < -1e-6 || B.x1 > nx + 1e-6 || B.y1 > ny + 1e-6) return false;
    if (!F.floor && ovl(B, { x0: nx - 1, y0: ny - 1, x1: nx, y1: ny })) return false;      // 입구
    const kw = KW[st.size];
    if (F.zone === 'kitchen' && B.x1 > kw + 1e-6) return false;
    if (F.zone === 'hall' && B.x0 < kw - 1e-6) return false;
    for (const g of st.furn || []) { if (g === ignore || (!!FURN[g.k].floor) !== (!!F.floor)) continue; if (ovl(B, fbox(g))) return false; }
    return true;
  }
  // 동선 검사: 입구에서 0.25칸 격자로 걸어 갈 수 있는 곳을 찾아, 닿지 않는 좌석·계산대를 골라냄
  function furnFlow(st) {
    const [nx, ny] = ROOM[st.size], R2 = 4, gw = nx * R2, gh = ny * R2, block = new Uint8Array(gw * gh);
    const solid = (st.furn || []).filter(f => !FURN[f.k].floor);
    for (const f of solid) { const B = fbox(f); for (let y = Math.floor(B.y0 * R2); y < Math.ceil(B.y1 * R2 - 1e-6); y++) for (let x = Math.floor(B.x0 * R2); x < Math.ceil(B.x1 * R2 - 1e-6); x++) if (x >= 0 && y >= 0 && x < gw && y < gh) block[y * gw + x] = 1; }
    const seen = new Uint8Array(gw * gh), q = [];
    for (let y = gh - R2; y < gh; y++) for (let x = gw - R2; x < gw; x++) if (!block[y * gw + x]) { seen[y * gw + x] = 1; q.push(x, y); }
    while (q.length) { const y = q.pop(), x = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= gw || Y >= gh) continue; const i = Y * gw + X; if (!seen[i] && !block[i]) { seen[i] = 1; q.push(X, Y); } } }
    const reach = f => { const B = fbox(f); for (let y = Math.floor(B.y0 * R2) - 1; y <= Math.ceil(B.y1 * R2); y++) for (let x = Math.floor(B.x0 * R2) - 1; x <= Math.ceil(B.x1 * R2); x++) { if (x < 0 || y < 0 || x >= gw || y >= gh) continue; const inside = x >= B.x0 * R2 && x < B.x1 * R2 && y >= B.y0 * R2 && y < B.y1 * R2; if (!inside && seen[y * gw + x]) return true; } return false; };
    const blocked = solid.filter(f => (FURN[f.k].seats || f.k === 'counter') && !reach(f));
    return { blocked, blockedSeats: blocked.reduce((a, f) => a + (FURN[f.k].seats || 0), 0), counterOk: !blocked.some(f => f.k === 'counter') };
  }
  function ensureFurn(st) { if (!st.furn) st.furn = defaultFurn(st.cat, st.size); return st.furn; }
  // 가구 효과 (기본 배치일 때 모두 1이 되도록 기본 배치와 비교)
  const FXC = new WeakMap(), BASEC = {};
  function furnSum(cat, list) {
    let seats = 0, kit = 0, fresh = 0, deco = 0, counter = 0, heat = 0; const segs = { res: 0, off: 0, uni: 0, tour: 0 };
    for (const f of list) {
      const F = FURN[f.k]; if (!F) continue;
      seats += F.seats || 0; fresh += F.fresh || 0; deco += F.deco || 0; if (f.k === 'counter') counter++;
      if (F.kit) { if (/^stove|espresso|oven/.test(f.k)) heat++; kit += F.kit * (f.k === 'espresso' && !DRINK_CATS.includes(cat) ? 0.4 : 1); }
      if (F.segs) for (const k in F.segs) segs[k] += (F.deco || 1) * F.segs[k];
    }
    return { seats, kit: Math.min(kit, 0.45), fresh: Math.min(fresh, 0.08), deco, counter, heat, segs };
  }
  function furnFx(st) {
    if (!st.furn) return null;
    const key = JSON.stringify(st.furn);
    let c = FXC.get(st); if (c && c.key === key) return c;
    const bk = st.cat + st.size;
    const base = BASEC[bk] || (BASEC[bk] = furnSum(st.cat, defaultFurn(st.cat, st.size)));
    const cur = furnSum(st.cat, st.furn), flow = furnFlow(st); cur.seats -= flow.blockedSeats;
    c = { key, sum: cur,
      seatF: clamp(cur.seats / Math.max(1, base.seats), 0.3, 1.45) * (flow.counterOk ? 1 : 0.25),   // 계산대에 못 가면 주문을 거의 못 받음
      flow, kitF: (cur.counter && flow.counterOk ? 1 : 0.6) * (cur.heat ? 1 : 0.7) * (1 + cur.kit - base.kit),
      qualF: 1 + cur.fresh - base.fresh,
      deco: cur.deco - base.deco, segs: Object.fromEntries(Object.keys(cur.segs).map(k => [k, cur.segs[k] - base.segs[k]])), crowd: furnCrowd(st), crowd0: furnCrowd({ size: st.size, furn: defaultFurn(st.cat, st.size) }) };
    FXC.set(st, c); return c;
  }
  // 홀이 가구로 너무 꽉 차면 답답해서 매력이 떨어져요
  function furnCrowd(st) { const [nx, ny] = ROOM[st.size], kw = KW[st.size]; const hall = (nx - kw) * ny - 1; let used = 0; for (const f of st.furn) if (!FURN[f.k].floor) used += furnCells(f).filter(([x]) => x >= kw).length; return used / hall; }
  function furnAppeal(st, seg) {
    const fx = furnFx(st); if (!fx) return 1;
    const lim = Math.max(0.62, fx.crowd0), crowd = fx.crowd > lim ? 1 - (fx.crowd - lim) * 0.8 : 1;
    return clamp(1 + fx.deco * 0.008 + fx.segs[seg] * 0.006, 0.85, 1.25) * crowd;
  }
  function placeFurn(S, id, k, x, y, r) {
    const st = S.stores.find(s => s.id === id); if (!st) return { ok: false, msg: '매장이 없어요.' };
    const F = FURN[k]; if (!F) return { ok: false, msg: '없는 가구예요.' };
    ensureFurn(st);
    const f = { k, x: Math.round(x * 4) / 4, y: Math.round(y * 4) / 4 }; if (r) f.r = r % 4;
    if (!furnFits(st, f)) return { ok: false, msg: F.zone === 'kitchen' ? '주방 칸(왼쪽 두 줄)의 빈 곳에만 놓을 수 있어요.' : F.zone === 'hall' ? '홀의 빈 곳에만 놓을 수 있어요. 입구는 비워 둬야 해요.' : '빈 곳에만 놓을 수 있어요.' };
    const comp = S.companies[st.owner]; if (comp.cash < F.cost) return { ok: false, msg: '현금이 부족해요.' };
    comp.cash -= F.cost; comp.cur.capex += F.cost; st.equip += F.cost; st.furn.push(f);
    return { ok: true, cost: F.cost, msg: `${eul(F.name)} 놓았어요.` };
  }
  function resetFurn(S, id) {
    const st = S.stores.find(s => s.id === id); if (!st) return { ok: false };
    const L = defaultFurn(st.cat, st.size), cost = Math.round(L.reduce((a, f) => a + FURN[f.k].cost, 0) * 0.5 / 1e4) * 1e4;
    const comp = S.companies[st.owner]; if (comp.cash < cost) return { ok: false, msg: '현금이 부족해요.' };
    comp.cash -= cost; comp.cur.capex += cost; st.furn = L;
    return { ok: true, msg: '기본 배치로 다시 꾸몄어요.' };
  }
  function eul(w) { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? w + '을' : w + '를'; }
  function removeFurn(S, id, x, y) {
    const st = S.stores.find(s => s.id === id); if (!st) return { ok: false };
    ensureFurn(st);
    const hit = st.furn.filter(f => { const B = fbox(f); return x >= B.x0 && x < B.x1 && y >= B.y0 && y < B.y1; }).sort((a, b) => (FURN[a.k].floor ? 1 : 0) - (FURN[b.k].floor ? 1 : 0))[0];
    if (!hit) return { ok: false, msg: '여기엔 가구가 없어요.' };
    if (FURN[hit.k].need && st.furn.filter(f => f.k === hit.k).length <= 1) return { ok: false, msg: '계산대는 하나는 있어야 해요.' };
    st.furn.splice(st.furn.indexOf(hit), 1);
    const back = Math.round(FURN[hit.k].cost * 0.4 / 1e4) * 1e4; S.companies[st.owner].cash += back; st.equip = Math.max(0, st.equip - FURN[hit.k].cost);
    return { ok: true, msg: `${eul(FURN[hit.k].name)} 치웠어요. 중고로 ${Math.round(back / 1e4)}만원을 돌려받았어요.` };
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
    const inc = S.hoods[tile(S, st.x, st.y) ? tile(S, st.x, st.y).h : 4].income;
    const sens = SEG[seg].sens * (1 - 0.07 * (st.interior.tier - 1)) * clamp(Math.sqrt(400 / inc), 0.7, 1.35);
    const strat = 1 + 0.015 * deptPower(S, comp, 'research') + 0.015 * deptPower(S, comp, 'rnd');
    const pk = st._park == null ? 0.5 : st._park;
    const parkM = seg === 'res' ? 0.75 + 0.35 * pk : seg === 'tour' ? 0.85 + 0.2 * pk : 0.97 + 0.05 * pk;
    const pf = clamp(Math.exp(-sens * 1.8 * (st.price / 100 - 1)), 0.05, 3);
    const rf = 0.55 + 0.15 * st.rating;
    const star = 1 + ((st._star == null ? 50 : st._star) - 50) / 100 * 0.3;
    const regM = 1 + 0.15 * Math.min(1, (st.regulars || 0) / 300) * (seg === 'res' || seg === 'off' ? 1 : 0.5);
    return regM * quality(S, st) * (st._mi ? st._mi.appeal[seg] : 1) * (1 + comp.brand[st.cat] / 110) * pf * rf * (1 + 0.06 * st.mkt) * interiorAppeal(st, seg) * furnAppeal(st, seg) * archAppeal(st, seg) * star * eventMult(S, st, seg) * strat * parkM;
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
    // 비·눈의 세기(0.15 이슬비 ~ 1 장대비). 소리와 빗줄기 양에 쓰고, 수요 계산은 아직 종류만 씀
    const amt = kind === 'rain' || kind === 'snow' ? +(0.15 + 0.85 * Math.pow(rnd(S), 1.3)).toFixed(2) : 0;
    return { kind, temp, amt };
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
    snapDay(S);
    const d = dateOf(S);
    S.weather = rollWeather(S, d);
    S.day = d;
    if (first) return;
    // 직원 하루 회복·사기·이직
    for (const st of S.stores) {
      const comp = S.companies[st.owner];
      const ch = chemistry(st); st._chem = ch.mult;
      const mgr = st.staff.some(s => s.role === 'manager');
      const trainP = deptPower(S, comp, 'train');
      if (trainP > 0 && st.staff.length && rnd(S) < 0.03 * trainP) { const s = pick(S, st.staff); const k = pick(S, ['skill', 'speed', 'clean', 'star']); if (s[k] < 92) s[k]++; }
      for (const s of st.staff.slice()) {
        s.fatigue *= 0.5; s.days++;
        if (s.role !== 'hall' && s.skill < 90 && rnd(S) < 0.05) s.skill++;
        const ask = askWage(S, s);
        const mine = ch.pairs.filter(p => p.a === s.id || p.b === s.id);
        const rel = mine.length ? mine.reduce((a, p) => a + p.c, 0) / mine.length : 0;
        const target = 62 + trainP * 3 + (s.wage / ask - 1) * 150 + rel * 22 + (mgr ? 6 : 0) - s.fatigue * 0.4 + (st.rating - 3) * 5 + (s._bonus || 0);
        s.morale = clamp(s.morale + (target - s.morale) * 0.12, 0, 100);
        if (s._bonus) s._bonus *= 0.9;
        if (s.morale < 35 && rnd(S) < (35 - s.morale) / 350) {
          st.staff.splice(st.staff.indexOf(s), 1);
          if (comp.isPlayer && !st.franchise) log(S, `👋 ${s.name}(${ROLES[s.role]}, ${s.mbti})님이 사기가 떨어져 그만뒀어요.`, 'warn');
          if (comp.ai || st.franchise || S.autoHire) { const n = makeStaff(S, s.role, comp.ai ? 50 : 46 + 4 * trainP); n.shift = s.shift; st.staff.push(n); }
        }
      }
      if (st.staff.length >= 2 && ch.avg < -0.25 && rnd(S) < 0.02 && comp.isPlayer && !st.franchise) {
        for (const s of st.staff) s.morale -= 8;
        log(S, `💢 ${hoodName(S, st)} ${CATS[st.cat].name}에서 직원끼리 다툼이 있었어요. 성향이 잘 맞는 사람으로 팀을 꾸려 보세요.`, 'warn');
      }
      if ((comp.ai || st.franchise) && rnd(S) < 0.05) autoStaff(S, st, comp.ai ? 50 : 46 + 4 * deptPower(S, comp, 'fran'));
      else if (comp.isPlayer && S.autoHire && st.staff.length < 16 && staffBound(st) && st.dayLost * ticket(st) / VAT * (1 - CATS[st.cat].cogs) * 0.7 > S.minWage * 5 * BURDEN * 2 && rnd(S) < 0.25) {
        const kit = st.staff.filter(s => s.role !== 'hall').length, hall = st.staff.filter(s => s.role === 'hall').length;
        const n = makeStaff(S, kit * CATS[st.cat].rate <= hall * HALL_RATE ? 'kitchen' : 'hall', 46 + 4 * trainP);
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
      st.interior.cond = clamp(st.interior.cond - 0.04 * (1.5 - (st._clean || 50) / 100) * (1 - 0.1 * deptPower(S, comp, 'fran')), 20, 100);
    }
    if (d.wd === 1) { refreshCands(S); refreshHqCands(S); }
    computeDemand(S);
  }

  function hoodName(S, st) { return HOODS[tile(S, st.x, st.y).h].name; }

  function parkNear(S, x, y, r) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const t = anchorOf(S, tile(S, x + dx, y + dy)); if (t && t.b && (t.b.k === 'park' || t.b.k === 'rpark' || (t.b.k === 'lm' && (t.b.kind === 'forest' || t.b.kind === 'palace')))) return true; }
    return false;
  }
  function srcDemand(S, src, cat, segM, catM) {
    const hd = S.hoods[src.h], C = CATS[cat];
    const hype = 1 + hd.hype / 100 * (src.seg === 'tour' || src.seg === 'uni' ? 0.8 : 0.15) + (hd.festival > S.hour ? 0.5 : 0);
    const pm = (PROFILE_MULT[src.prof] && PROFILE_MULT[src.prof][cat]) || 1;
    return src.pop * APPETITE[cat][src.seg] * segM[src.seg] * catM * hype * pm * Math.pow(src.income / 400, C.lux || 0);
  }
  function catDayMult(S, d, cat) {
    const w = WEATHER[S.weather.kind], C = CATS[cat];
    return (d.weekend || d.holiday ? C.weekend || 1 : 1) * (d.wd === 5 || d.wd === 6 ? C.fri || 1 : 1) * SEASON[cat][d.mi] * (w.cat && w.cat[cat] || 1) * (S.trends[cat] && S.trends[cat].until > S.hour ? S.trends[cat].mult : 1);
  }
  function computeDemand(S) {
    const d = S.day; const srcs = sources(S);
    for (const src of srcs) { src._s = {}; src._take = 0; src._k = 1; }
    const contrib = [];
    for (const st of S.stores) {
      refreshMenu(S, st);
      const ts = teamStats(st); st._skill = ts.skill; st._clean = ts.clean; st._star = ts.star;
      st.segDem = { res: 0, off: 0, uni: 0, tour: 0 };
      st._attr = {}; for (const seg of SEG_KEYS) st._attr[seg] = attraction(S, st, seg);
      st._pb = parkNear(S, st.x, st.y, 2) ? 1.1 : 1;
      st._park = parkingScore(S, st);
    }
    const segM = {}; for (const seg of SEG_KEYS) segM[seg] = segDayMult(S, d, seg);
    for (const cat of CAT_KEYS) {
      const list = S.stores.filter(s => s.cat === cat);
      if (!list.length) continue;
      const catM = catDayMult(S, d, cat);
      const pairs = [];
      for (const st of list) for (const src of nearSources(S, st.x, st.y, REACH)) {
        const a = st._attr[src.seg] * st._pb / (1 + 0.5 * dist(st, src));
        src._s[cat] = (src._s[cat] || 0) + a; pairs.push(st, src, a);
      }
      const Dc = new Map();
      for (let i = 0; i < pairs.length; i += 3) {
        const st = pairs[i], src = pairs[i + 1], a = pairs[i + 2];
        let D = Dc.get(src); if (D == null) { D = srcDemand(S, src, cat, segM, catM); Dc.set(src, D); }
        const v = D * a / (src._s[cat] + OUTSIDE);
        contrib.push(st, src, v); src._take += v;
      }
    }
    // 유한한 지갑(계획서 3.2): 한 원천이 모든 업종에서 쓰는 외식 횟수는 잠재 수요의 WALLET배를 넘지 못함.
    for (const src of srcs) if (src._take) { let P = 0; for (const cat of CAT_KEYS) P += srcDemand(S, src, cat, segM, catDayMult(S, d, cat)); src._P = P; src._k = Math.min(1, WALLET * P / src._take); }
    for (let i = 0; i < contrib.length; i += 3) contrib[i].segDem[contrib[i + 1].seg] += contrib[i + 2] * contrib[i + 1]._k;
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
    if (!isLot(tile(S, x, y))) return { ok: false, msg: '빈 땅에만 지을 수 있어요.' };
    const comp = S.companies[compId];
    const size = opt.size || 2, style = opt.style || 'wood', tier = opt.tier || 2;
    const fit = findFit(S, x, y, SIZES[size].fp[0], SIZES[size].fp[1]);
    if (!fit) return { ok: false, msg: `${SIZES[size].name} 매장이 들어갈 만큼 빈 땅이 붙어 있지 않아요. 더 작은 크기를 고르거나 다른 자리를 찾아 보세요.` };
    x = fit.x; y = fit.y;
    const cost = openCost(S, cat, x, y, size, style, tier);
    if (!opt.free && !opt.franchise) {
      if (comp.cash < cost.total) return { ok: false, msg: `자금이 부족해요. ${won(cost.total)}이 필요해요.` };
      comp.cash -= cost.total; comp.cur.capex += cost.total - cost.deposit; comp.cur.deposit = (comp.cur.deposit || 0) + cost.deposit;
    }
    const st = {
      id: S.nextId++, x, y, cat, owner: compId, franchise: !!opt.franchise, size,
      price: Math.round(100 * (comp.ai ? comp.ai.pricing : 1)), open: CATS[cat].hours[0], close: CATS[cat].hours[1],
      mkt: comp.ai ? 1 : 0, owned: false, propValue: 0, arch: 'basic',
      interior: { style, tier, cond: 100, cost: cost.interior, day: dayOf(S) },
      equip: cost.equip, deposit: cost.deposit, rent: cost.rent, leaseDay: dayOf(S), opened: dayOf(S),
      delivery: CATS[cat].dlv >= 0.2, queue: 0,
      menu: opt.menu && opt.menu.length ? opt.menu.slice(0, SIZES[size].menu) : defaultMenu(cat, size), sig: opt.sig || null,
      staff: [], ev: [], buzz: [], segDem: null, _chem: 1,
      hourly: new Array(24).fill(0), hourLost: new Array(24).fill(0), hourCap: new Array(24).fill(0),
      served: 0, lost: 0, rev: 0, profit: 0, dayServed: 0, dayLost: 0, dayRev: 0, dayCost: 0,
      profitAvg: 0, lossDays: 0, rating: 3.2, m: { rev: 0, profit: 0, cust: 0 }, lm: null, supply: 'direct', facId: null,
    };
    refreshMenu(S, st);
    S.stores.push(st);
    occupy(S, x, y, fit.w, fit.d, { k: 'store', id: st.id }); st.w = fit.w; st.d = fit.d;
    assignSupply(S);
    if (S.day && !S._bulk) computeDemandFor(S, st);
    autoStaff(S, st, comp.ai ? 50 : opt.franchise ? 46 : 48);
    if (!S._bulk) computeDemandFor(S, st);
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
    vacate(S, tile(S, st.x, st.y));
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
    const [nw, nd] = SIZES[st.size + 1].fp;
    const b0 = t.b; vacate(S, t);
    let fit = null;
    for (const [ww, dd] of nw === nd ? [[nw, nd]] : [[nw, nd], [nd, nw]]) for (let oy = 0; oy <= dd - (st.d || 1) && !fit; oy++) for (let ox = 0; ox <= ww - (st.w || 1) && !fit; ox++) if (fits(S, st.x - ox, st.y - oy, ww, dd)) fit = { x: st.x - ox, y: st.y - oy, w: ww, d: dd };
    if (!fit) { occupy(S, st.x, st.y, st.w || 1, st.d || 1, b0); return { ok: false, msg: '옆 칸이 비어 있지 않아 넓힐 수 없어요.' }; }
    st.x = fit.x; st.y = fit.y; st.w = fit.w; st.d = fit.d; occupy(S, fit.x, fit.y, fit.w, fit.d, b0);
    const oldPy = SIZES[st.size].py; st.size++; st.furn = null;
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
    if (kind === 'hq' && comp.hq) return { ok: false, msg: '본사는 한 곳이면 충분해요.' };
    const fit = findFit(S, x, y, f.fp[0], f.fp[1]);
    if (!fit) return { ok: false, msg: `${f.name}은 ${f.fp[0]}×${f.fp[1]}칸이 필요해요. 빈 땅이 붙어 있는 곳을 골라 주세요.` };
    x = fit.x; y = fit.y;
    const cost = facCost(S, kind, x, y);
    if (comp.cash < cost) return { ok: false, msg: `자금이 부족해요. ${won(cost)}이 필요해요.` };
    comp.cash -= cost; comp.cur.capex += cost;
    const fac = { id: S.nextId++, x, y, kind, owner: compId, level: 1, invest: cost };
    if (kind === 'hq') { comp.hq = { facId: fac.id, staff: [] }; log(S, `🏢 ${comp.name} 본사가 문을 열었어요. 부서별로 본사 직원을 뽑아 보세요.`, 'good'); }
    if (kind === 'factory') comp.factory = true;
    if (kind === 'smartfarm') comp.smartfarm = true;
    S.facs.push(fac); occupy(S, x, y, fit.w, fit.d, { k: 'fac', id: fac.id }); fac.w = fit.w; fac.d = fit.d;
    if (kind === 'roastery') comp.roastery = true;
    assignSupply(S); computeDemand(S);
    return { ok: true, fac };
  }
  function facCost(S, kind, x, y) {
    if (kind !== 'rental') return FAC[kind].cost;
    const t = tile(S, x, y); if (!t) return 0;
    return r5(t.rent * 150 * 12 / 0.045 + 300 * 6e6);   // 땅값(150평) + 공사비(연면적 300평 × 평당 600만)
  }
  function facValue(S, f) {
    if (f.kind === 'rental') { const t = tile(S, f.x, f.y); return r5(t.rent * 150 * 12 / 0.045 + 300 * 6e6 * f.level * 0.85); }
    return f.invest * 0.7;
  }
  function upgradeFacility(S, id) {
    const f = S.facs.find(x => x.id === id); if (!f) return { ok: false };
    const comp = S.companies[f.owner];
    if (f.level >= 3 || ['roastery', 'hq', 'smartfarm'].includes(f.kind)) return { ok: false, msg: '더 이상 확장할 수 없어요.' };
    const cost = f.kind === 'rental' ? r5(300 * 6e6 * 0.8) : FAC[f.kind].cost * 0.5 * f.level;
    if (comp.cash < cost) return { ok: false, msg: '자금이 부족해요.' };
    comp.cash -= cost; comp.cur.capex += cost; f.invest += cost; f.level++;
    assignSupply(S);
    return { ok: true };
  }
  function removeFacility(S, id) {
    const i = S.facs.findIndex(x => x.id === id); if (i < 0) return { ok: false };
    const f = S.facs[i]; const comp = S.companies[f.owner];
    const back = f.kind === 'rental' ? facValue(S, f) * 0.95 : f.invest * 0.4;
    comp.cash += back; comp.cur.other += back;
    if (f.kind === 'roastery') comp.roastery = false;
    if (f.kind === 'hq') { comp.hq = null; for (const k of CAT_KEYS) comp.fr[k].on = false; }
    if (f.kind === 'factory') comp.factory = S.facs.some(x => x !== f && x.owner === comp.id && x.kind === 'factory');
    if (f.kind === 'smartfarm') comp.smartfarm = false;
    S.facs.splice(i, 1); vacate(S, tile(S, f.x, f.y));
    assignSupply(S);
    return { ok: true };
  }
  function buildPublic(S, x, y, kind) {
    const t = tile(S, x, y); const comp = S.companies[0];
    if (!isLot(t)) return { ok: false, msg: '빈 땅에만 지을 수 있어요.' };
    const cost = PUBLIC[kind].cost;
    if (comp.cash < cost) return { ok: false, msg: `자금이 부족해요. ${won(cost)}이 필요해요.` };
    comp.cash -= cost; comp.cur.other -= cost;
    occupy(S, x, y, 1, 1, { k: kind, lv: 1, v: 0 });
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
    const d = S.day; const srcs = nearSources(S, x, y, REACH);
    const fake = fakeStore(S, cat, compId, x, y, opt.size, opt.style, opt.tier, opt);
    refreshMenu(S, fake);
    const attr = {}; for (const seg of SEG_KEYS) attr[seg] = attraction(S, fake, seg);
    const pb = parkNear(S, x, y, 2) ? 1.1 : 1;
    const segDem = { res: 0, off: 0, uni: 0, tour: 0 }, flow = { res: 0, off: 0, uni: 0, tour: 0 }, prof = {};
    const typ = { off: 0.78, tour: 0.96, uni: 0.86, res: 1.03 };
    const segM = typ, catM = SEASON[cat][d.mi];
    for (const src of srcs) {
      const D = srcDemand(S, src, cat, segM, catM);
      flow[src.seg] += src.pop * typ[src.seg]; prof[src.prof] = (prof[src.prof] || 0) + src.pop;
      const a = attr[src.seg] * pb / (1 + 0.5 * (Math.abs(src.x - x) + Math.abs(src.y - y)));
      segDem[src.seg] += D * a / (((src._s && src._s[cat]) || 0) + a + OUTSIDE);
    }
    let rivals = 0;
    for (const st of S.stores) if (st.cat === cat && st.owner !== compId && Math.abs(st.x - x) + Math.abs(st.y - y) <= 4) rivals++;
    const cust = SEG_KEYS.reduce((a2, k) => a2 + segDem[k], 0);
    return { cust, rivals, segDem, flow, prof };
  }
  function lotPotentials(S, cat, compId, sample) {
    let lots = S.tiles.filter(isLot);
    if (sample && lots.length > sample) { const out = []; for (let i = 0; i < sample; i++) out.push(lots[Math.floor(rnd(S) * lots.length)]); lots = out; }
    return lots.map(t => ({ x: t.x, y: t.y, cust: lotEstimate(S, t.x, t.y, cat, compId).cust }));
  }
  // 시간대별 유동인구 (상권 분석용)
  function hourlyFlow(S, x, y) {
    const srcs = nearSources(S, x, y, 3);
    const out = new Array(24).fill(0);
    for (const s of srcs) for (let h = 0; h < 24; h++) out[h] += s.pop * SEG_HOURS[s.seg][h] / 100;
    return out;
  }
  function bestLot(S, cat, compId, sample, pool) {
    let lots = lotPotentials(S, cat, compId, pool || 260);
    if (!lots.length) return null;
    lots.sort((a, b) => b.cust - a.cust);
    lots = lots.slice(0, sample || 8);
    return lots[Math.floor(rnd(S) * Math.min(lots.length, 4))];
  }

  // ---------- 1시간 진행 ----------

  // ---------- 재고 (계획서 3.3·3.4) ----------
  // 식재료 묶음별 금액(원). 손님마다 레시피 비율만큼 쓰고, 모자라면 품절. 매일 밤 어제 주문분이 도착(이때 현금 지급)하고
  // 목표 재고 일수만큼 다시 주문. 신선 재료는 하루 쓰는 양을 넘는 부분 일부가 상함(좋은 냉장고는 덜 상함).
  const SPOIL = { milk: 0.22, meat: 0.25, veg: 0.28, bean: 0.01, flour: 0.015, etc: 0.04 };
  function invNeed(S, comp, st) { const u = unitCost(S, comp, st), r = CATS[st.cat].recipe, o = {}; for (const g in r) o[g] = u * r[g]; return o; }
  function ensureInv(S, st) {
    if (st.inv || st.franchise) return;
    const comp = S.companies[st.owner], need = invNeed(S, comp, st), guess = 110 + st.size * 70;   // 넓어진 매장 기준 하루 손님 예상
    st.invDays = st.invDays || 2; st.inv = {}; st.onOrder = {}; st.invUse = {}; let cost = 0;
    for (const g in need) { st.inv[g] = need[g] * guess * st.invDays; st.invUse[g] = need[g] * guess; st.onOrder[g] = need[g] * guess * 1.2; cost += st.inv[g]; }   // 첫날 밤 배송도 미리 예약(이틀째 품절 방지)
    comp.cash -= cost; comp.cur.purchase = (comp.cur.purchase || 0) + cost; st.invValue = cost;
  }
  function stockCap(st, need) { let m = Infinity; for (const g in need) if (need[g] > 0) m = Math.min(m, (st.inv[g] || 0) / need[g]); return m; }
  function useStock(st, need, n) { st._use = st._use || {}; for (const g in need) { st.inv[g] = Math.max(0, (st.inv[g] || 0) - need[g] * n); st._use[g] = (st._use[g] || 0) + need[g] * n; } }
  function restock(S, st) {
    if (!st.inv) return 0;
    const comp = S.companies[st.owner], fx = st.furn ? furnFx(st) : null, keep = fx ? clamp(1 - (fx.qualF - 1) * 4, 0.6, 1) : 1;
    let waste = 0, paid = 0;
    for (const g in st.inv) {
      st.invUse[g] = (st.invUse[g] || 0) * 0.65 + ((st._use && st._use[g]) || 0) * 0.35;
      const over = Math.max(0, st.inv[g] - st.invUse[g]), sp = over * (SPOIL[g] || 0.03) * keep;
      st.inv[g] -= sp; waste += sp;
      const fill = (S.supply && S.supply[g] && S.supply[g].until > S.hour) ? S.supply[g].fill : 1;
      const rel = VENDORS[st.vendor || 'local'].rel, got = (st.onOrder[g] || 0) * fill * (rnd(S) < rel ? 1 : 0.5); st.inv[g] += got; paid += got;
      st.onOrder[g] = Math.max(0, (st.invDays + 1) * st.invUse[g] - st.inv[g]);
    }
    st._use = {};
    comp.cash -= paid; comp.cur.purchase = (comp.cur.purchase || 0) + paid;
    st.dayWaste = waste; st.invValue = Object.values(st.inv).reduce((a, b) => a + b, 0);
    return waste;
  }
  function setInvDays(S, id, d) { const st = S.stores.find(s => s.id === id); if (!st) return { ok: false }; st.invDays = clamp(Math.round(d), 1, 5); return { ok: true, msg: `발주 기준을 ${st.invDays}일치 재고로 바꿨어요.` }; }
  function supplyShock(S) {
    S.supply = S.supply || {};
    if (rnd(S) < 0.012) { const gs = ['milk', 'meat', 'veg', 'bean', 'flour'], g = gs[Math.floor(rnd(S) * gs.length)]; S.supply[g] = { fill: 0.5, until: S.hour + 24 * 7 }; log(S, `📦 ${INGR[g].name} 공급이 한 주 동안 절반으로 줄어요. 발주 기준 일수를 늘리거나 메뉴를 바꿔 대비하세요.`, 'bad'); }
  }
  function step(S) {
    if (S.gameOver) return { money: [], trucks: [] };
    const ev = { money: [], trucks: [], newDay: false };
    const h = S.hour % 24;
    for (const st of S.stores) {
      if (h === 0) { st.hourly.fill(0); st.hourLost.fill(0); st.hourCap.fill(0); if (st.hourDlv) st.hourDlv.fill(0); st.dayServed = 0; st.dayLost = 0; st.dayRev = 0; st.dayCost = 0; st.dayDlv = 0; st.dayDlvFee = 0; st.dayStockLost = 0; }
      const comp = S.companies[st.owner];
      const isOpen = h >= st.open && h < st.close;
      const C = CATS[st.cat];
      const base = wantAt(S, st, h) * (0.85 + rnd(S) * 0.3);
      if (!isOpen) { st.hourLost[h] = 0; st.queue = 0; continue; }
      const dlvOn = st.delivery && C.dlv > 0;
      const wantD = dlvOn ? base * C.dlv : 0;
      const wantDine = base * (1 - C.dlv) + (st.queue || 0);
      const parts = hourParts(st, h), cap = parts.dine;
      const rnd2 = v => Math.floor(v) + (rnd(S) < v % 1 ? 1 : 0);
      let servedDine = rnd2(Math.min(wantDine, cap));
      let servedD = rnd2(Math.min(wantD, Math.max(0, parts.kitchen - servedDine)));
      ensureInv(S, st);
      const need = st.inv ? invNeed(S, comp, st) : null;
      if (need) { const sc = Math.floor(stockCap(st, need)); if (servedDine + servedD > sc) { const cut = servedDine + servedD - sc; st.dayStockLost = (st.dayStockLost || 0) + cut; const cd = Math.min(servedD, cut); servedD -= cd; servedDine = Math.max(0, servedDine - (cut - cd)); } }
      const served = servedDine + servedD;
      if (need) useStock(st, need, served);
      const lostDine = Math.max(0, wantDine - servedDine);
      st.queue = C.queue ? lostDine * 0.3 : 0;
      st.hourly[h] = served; st.hourLost[h] = lostDine * (C.queue ? 0.7 : 1) + Math.max(0, wantD - servedD); st.hourCap[h] = cap;
      st.hourDlv = st.hourDlv || new Array(24).fill(0); st.hourDlv[h] = servedD;
      const tk = ticket(st);
      const gross = served * tk;
      const rev = gross / VAT;
      const cogs = served * unitCost(S, comp, st);
      const card = servedDine * tk * CARD_FEE;
      let dlvFee = servedD * (tk * 0.098 + 3000);
      if (servedD > 0) {
        const cg = congestion(S, tile(S, st.x, st.y).h, h);
        const wx = S.weather.kind === 'rain' ? 8 : S.weather.kind === 'snow' ? 14 : 0;
        const mins = 14 + 22 * cg + wx + Math.max(0, servedD - 12) * 0.4;
        const late = clamp((mins - 30) / 20, 0, 1);
        st.dlvMin = (st.dlvMin == null ? mins : st.dlvMin * 0.9 + mins * 0.1);
        st.dlvLate = (st.dlvLate == null ? late : st.dlvLate * 0.9 + late * 0.1);
        dlvFee += servedD * late * 0.15 * tk;          // 늦은 주문 환불·쿠폰
        if (late > 0.2) st.rating = Math.max(1, st.rating - 0.002 * late * servedD);
      }
      let wage = 0;
      for (const s of st.staff) if (onDuty(st, s, h)) {
        wage += s.wage * BURDEN;
        const util = cap > 0 ? served / cap : 0;
        s.fatigue = clamp(s.fatigue + util * (s.mbti[0] === 'I' ? 0.9 : 1.15) + 0.3, 0, 100);
      }
      st.dayServed += served; st.dayLost += st.hourLost[h]; st.dayRev += rev;
      st.m.cust += served;
      if (st.franchise) {
        const margin = st.supply !== 'direct' ? cogs * (0.06 + 0.01 * deptPower(S, comp, 'logistics')) : 0;
        const royalty = rev * comp.fr[st.cat].royalty;
        comp.cash += royalty + margin; comp.cur.royalty += royalty + margin; comp.cur.served += served;
        st.dayCost += cogs + margin + card + wage + royalty + dlvFee;
      } else {
        comp.cash += rev - (st.inv ? 0 : cogs) - card - wage - dlvFee;   // 재고 매장은 재료값을 입고 때 냈음
        if (!st.inv) comp.cur.cogsCash = (comp.cur.cogsCash || 0) + cogs;
        const L = comp.cur; L.rev += rev; L.cogs += cogs; L.card += card; L.wage += wage; L.dlv += dlvFee; L.served += served;
        st.dayCost += cogs + card + wage + dlvFee;
      }
      st.dayDlv = (st.dayDlv || 0) + servedD; st.dayDlvFee = (st.dayDlvFee || 0) + dlvFee;
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


  // ---------- 하루 장부 (계획서 3.1 대사) ----------
  // 현금이 움직이는 계정과 부호. 재고 매장의 재료비(cogs)는 손익에만 잡히고 현금은 입고(purchase) 때 나감.
  const CASH_ACCT = { rev: 1, royalty: 1, biz: 1, other: 1, cogsCash: -1, card: -1, wage: -1, dlv: -1, rent: -1, util: -1, mkt: -1, upkeep: -1, hq: -1, bizCost: -1, interest: -1, capex: -1, purchase: -1, loan: 1, equity: 1, invest: -1, deposit: -1 };
  const ACCT_NAME = { rev: '매출', royalty: '가맹 수입', biz: '다른 사업 수입', other: '기타', cogsCash: '재료비(즉시)', card: '카드 수수료', wage: '인건비', dlv: '배달 수수료', rent: '임대료', util: '관리비', mkt: '마케팅', upkeep: '시설 유지비', hq: '본사 인건비', bizCost: '다른 사업 비용', interest: '이자', capex: '투자(개점·공사·설비)', purchase: '식재료 입고', loan: '대출·상환', equity: '증자·자사주', invest: '지분 투자', deposit: '임대 보증금', tax: '법인세', dividend: '배당' };
  function snapDay(S) { const c = S.companies[0]; c._snap = { cash: c.cash, cur: Object.assign({}, c.cur) }; }
  function journalDay(S, d) {
    const c = S.companies[0], sn = c._snap; if (!sn) return;
    const ent = []; let flow = 0;
    for (const k in CASH_ACCT) { const dv = (c.cur[k] || 0) - (sn.cur[k] || 0); if (Math.abs(dv) < 1) continue; const v = dv * CASH_ACCT[k]; ent.push([k, Math.round(v)]); flow += v; }
    const actual = c.cash - sn.cash;
    S.journal = S.journal || []; S.journal.push({ y: d.year, m: d.month, d: d.day, ent, cash: Math.round(actual), residual: Math.round(actual - flow) });
    if (S.journal.length > 90) S.journal.shift();
  }
  // ---------- 하루 마감 ----------
  function endDay(S) {
    const d = dateOf(S, S.hour - 1);
    const dim = new Date(Date.UTC(d.year, d.month, 0)).getUTCDate();
    updateIngredients(S);
    supplyShock(S);
    const servedBy = S.companies.map(() => { const o = {}; for (const k of CAT_KEYS) o[k] = 0; return o; });
    for (const st of S.stores) {
      const comp = S.companies[st.owner];
      const rent = st.owned ? 0 : st.rent / dim;
      const util = utilMonth(st) / dim;
      const mkt = MKT[st.mkt];
      let waste = 0;
      if (CATS[st.cat].waste && st._prod) waste = Math.max(0, st._prod - st.dayServed) * unitCost(S, comp, st) * 0.7;
      st._prod = Math.max(20, st.dayServed * 1.1);
      // 단골(계획서 P3): 평점 3.5 위에서 손님 일부가 단골이 되고, 평점이 낮거나 품절·대기가 많으면 떠남
      st.regulars = Math.max(0, (st.regulars || 0) * 0.992 + st.dayServed * 0.01 * clamp((st.rating - 3.4) / 1.2, -1, 1) - (st.dayStockLost || 0) * 0.02);
      const spoil = restock(S, st);
      st.lossWhy = [['품절', st.dayStockLost || 0], ['자리·직원 부족', Math.round(st.dayLost || 0)], ['상한 재료(원)', Math.round(spoil + waste)]].filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
      if (spoil && !st.franchise) comp.cur.cogs += spoil;
      const fixed = rent + util + mkt + waste;
      if (waste && !st.franchise) { comp.cur.cogs += waste; comp.cur.mkt -= 0; }
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
        const protectedLease = dayOf(S) - st.opened < 3650;
        const next = Math.round((protectedLease ? Math.min(market, st.rent * 1.05) : market) / 1e4) * 1e4;
        if (!protectedLease && comp.isPlayer && !st.franchise && next > st.rent * 1.05) log(S, `🏚️ ${hoodName(S, st)} ${CATS[st.cat].name}의 10년 임대차 보호 기간이 끝나 월세가 시세대로 올랐어요.`, 'warn');
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
        const prP = deptPower(S, c, 'pr');
        const gain = ((servedBy[i][cat] * 0.00012 + mktSpend / 1e6 * 0.15 + starB) * (1 + 0.25 * prP) + (mine.length ? 0.015 * prP : 0)) * (1 - c.brand[cat] / 100);
        c.brand[cat] = clamp(c.brand[cat] * 0.9985 + gain, 0, 100);
      }
      let up = 0;
      for (const f of S.facs) if (f.owner === c.id) up += FAC[f.kind].upkeep * (1 + 0.5 * (f.level - 1)) / dim;
      if (c.farm) up += 5e6 / dim;
      if (c.ai && S.stores.some(s => s.owner === c.id && s.supply === 'warehouse')) up += 2e7 / dim;
      if (c.ai) up += S.stores.filter(s => s.owner === c.id).length * 1.5e6 / dim;   // 본사 관리비
      const interest = c.debt * loanRate(S) / 100 / 365;
      c.cash -= up + interest; c.cur.upkeep += up; c.cur.interest += interest;
      c.ev = c.ev.filter(e => e.until > S.hour);
    });
    hqDaily(S, dim);
    industryDaily(S, dim);
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
    journalDay(S, d);
    if (nd.month !== d.month) monthEnd(S, d);
    checkQuests(S);
  }

  function rentalIncome(S, f) {
    const t = tile(S, f.x, f.y), hd = S.hoods[t.h];
    const occ = clamp(0.5 + hd.qol / 250 + hd.hype / 400, 0.5, 0.98);
    return { month: 250 * t.rent * occ * f.level * 0.9, occ };
  }
  function industryDaily(S, dim) {
    for (const f of S.facs) {
      const c = S.companies[f.owner]; if (!c || c.dead) continue;
      let rev = 0, cost = 0;
      if (f.kind === 'factory') {
        const top = Math.max(...CAT_KEYS.map(k => c.brand[k]));
        rev = 2e8 * f.level * (0.6 + top / 100) * S.econ.mult / dim; cost = rev * 0.55;
      } else if (f.kind === 'rental') { rev = rentalIncome(S, f).month / dim; }
      else if (f.kind === 'smartfarm') rev = 1.5e7 / dim;
      if (rev || cost) { c.cash += rev - cost; c.cur.biz += rev; c.cur.bizCost += cost; f.mrev = (f.mrev || 0) + rev - cost; }
    }
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
        const lim = (DIFFICULTY[S.opts && S.opts.difficulty] || DIFFICULTY.normal).distress;
        if (S.distress === 1) log(S, `⚠️ 자금이 마이너스예요. ${lim}일 안에 회복하지 못하면 파산합니다.`, 'bad');
        if (S.distress > lim) { S.gameOver = true; log(S, '💔 회사가 파산했어요. 새 게임에서 다시 도전해 보세요.', 'bad'); }
      }
    } else S.distress = 0;
  }

  // ---------- 가치평가 ----------
  function bookValue(S, c) {
    let v = c.cash - c.debt;
    for (const s of S.stores) if (s.owner === c.id && !s.franchise) v += s.deposit + interiorBook(S, s) + equipBook(S, s) + (s.owned ? s.propValue : 0);
    for (const f of S.facs) if (f.owner === c.id) v += facValue(S, f);
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
    const per = 11 + clamp(growth * 10, -3, 8) + avgBrand / 15 + (c.dividend > 0 ? 1.5 : 0) + (S.econ.mult - 1) * 20 + (2.5 - (S.macro ? S.macro.base : 2.5)) * 1.5;
    return Math.max(book * 0.6, book + annual * per, 5e7);
  }
  function marketCap(c) { return c.price * c.shares; }
  function loanRate(S) { return (S.macro ? S.macro.base : 2.5) + 2.3; }
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
      if (c.isPlayer && S.journal && S.journal.length) { const jj = S.journal[S.journal.length - 1]; if (tax) { jj.ent.push(['tax', -Math.round(tax)]); jj.cash -= Math.round(tax); } if (rec.dividend) { jj.ent.push(['dividend', -Math.round(rec.dividend)]); jj.cash -= Math.round(rec.dividend); } }
      c.months.push(rec); if (c.months.length > 48) c.months.shift();
      c.storeHist.push(rec.stores); if (c.storeHist.length > 24) c.storeHist.shift();
      c.cur = blankLedger(); c._prev = 0;
      if (c.dailyNI.length) c.dailyNI[c.dailyNI.length - 1] -= tax;
    }
    for (const st of S.stores) { st.lm = st.m; st.m = { rev: 0, profit: 0, cust: 0 }; }
    cityGrow(S);
    gentrify(S);
    computeLand(S); computeQol(S);
    monthlyEvents(S, d);
    hqMonthly(S);
    if ([3, 6, 9, 12].includes(d.month)) policyQuarter(S);
    computeTraffic(S);
    aiMonth(S);
    assignSupply(S);
    S.stats.pop.push(population(S)); if (S.stats.pop.length > 48) S.stats.pop.shift();
    const p = S.companies[0]; const last = p.months[p.months.length - 1];
    if (last) log(S, `📒 ${d.month}월 결산: 매출 ${won(last.rev + last.royalty)}, 순이익 ${won(last.ni)}`, last.ni >= 0 ? 'good' : 'bad');
  }

  function gentrify(S) {
    S.hoods.forEach((hd, i) => {
      const tiles = S.tiles.filter(t => t.h === i && t.b && BTYPES[t.b.k] && ['house', 'villa', 'hanok', 'factory'].includes(t.b.k));
      if (hd.hype > 35) {
        hd.income *= 1 + 0.012 * hd.hype / 50;
        hd.age = Math.max(0.05, hd.age - 0.015);
        hd.gentri = Math.min(100, hd.gentri + hd.hype / 12);
        let moved = 0;
        for (const t of tiles) {
          if (rnd(S) < 0.05) {
            moved += buildingPop(t.b);
            const nk = t.b.k === 'factory' ? pick(S, ['cowork', 'alley', 'shop']) : pick(S, ['shop', 'alley', 'cowork', 'oneroom']);
            const T2 = BTYPES[nk]; t.b.k = nk; t.b.lv = T2.floors[0]; if (!T2.fp.some(f => f[0] === (t.b.w || 1) && f[1] === (t.b.d || 1)) && (t.b.w || 1) * (t.b.d || 1) > 1 && !['cowork', 'plaza'].includes(nk)) { t.b.k = 'cowork'; t.b.lv = 3; }
            S._srcDirty = true; S.mapVer++;
          }
        }
        hd.displaced += moved;
        if (moved && (!hd._lastG || S.hour - hd._lastG > 24 * 150)) {
          hd._lastG = S.hour;
          log(S, `🏘️ ${HOODS[i].name}: 임대료가 오르며 오래 살던 주민과 작은 가게들이 떠나고 있어요. 그 자리에 카페와 편집숍이 들어서요. (젠트리피케이션)`, 'warn');
        }
      } else {
        hd.age = Math.min(0.95, hd.age + 0.003);
        hd.gentri = Math.max(0, hd.gentri - 2);
        hd.income *= 1 + (rnd(S) - 0.45) * 0.004;
      }
    });
  }
  function hqMonthly(S) {
    const p = S.companies[0];
    if (!p.hq) return;
    const rP = deptPower(S, p, 'research');
    if (rP >= 0.8 && S.nextHype == null && rnd(S) < 0.25 + 0.15 * rP) {
      S.nextHype = Math.floor(rnd(S) * HOODS.length);
      log(S, `🔍 리서치팀 보고: ${HOODS[S.nextHype].name}이 곧 뜰 조짐이 보여요. 미리 자리를 잡아 보세요.`, 'good');
    }
    const dP = deptPower(S, p, 'rnd');
    for (const k of CAT_KEYS) {
      if (!S.stores.some(s => s.owner === 0 && s.cat === k) || p.recipe[k] >= 10) continue;
      if (rnd(S) < 0.12 * dP) { p.recipe[k]++; log(S, `🧪 메뉴 R&D팀이 ${CATS[k].name} 레시피를 ${p.recipe[k]}단계로 개선했어요.`, 'good'); }
    }
  }
  function cityGrow(S) {
    const empties = {}, totals = {};
    for (const t of S.tiles) if (t.t === 'land' && t.ref == null) { totals[t.h] = (totals[t.h] || 0) + 1; if (isLot(t)) empties[t.h] = (empties[t.h] || 0) + 1; }
    const boosters = S.tiles.filter(t => t.b && (t.b.k === 'park' || t.b.k === 'bus'));
    for (const t of S.tiles) {
      if (t.t !== 'land' || t.ref != null) continue;
      const hd = S.hoods[t.h];
      const near = boosters.some(b => dist(b, t) <= 4) ? 1 : 0;
      const nearSt = S.stations.some(s2 => Math.abs(s2.x - t.x) + Math.abs(s2.y - t.y) <= 4) ? 1 : 0;
      const boost = near * 0.012 + nearSt * 0.012 + hd.hype / 100 * 0.02 + (hd.qol - 50) / 3000;
      if (t.b && BTYPES[t.b.k] && BTYPES[t.b.k].cls !== 'pub') {
        const T2 = BTYPES[t.b.k];
        if (t.b.lv < T2.floors[1] && rnd(S) < 0.015 + boost) { t.b.lv++; S._srcDirty = true; S.mapVer++; }
      } else if (isLot(t)) {
        if ((empties[t.h] || 0) / totals[t.h] < 0.22) continue;
        if (rnd(S) < 0.008 + boost) { if (placeBuilding(S, t.x, t.y, wpick(S, HOODS[t.h].mix), 0)) empties[t.h]--; }
      }
    }
  }


  // ---------- 사건 ----------
  function dailyEvents(S) {
    const day = dayOf(S);
    // 한국은행 금리 결정 (연 8회)
    const dd = dateOf(S, S.hour);
    if (S.macro && [1, 2, 4, 5, 7, 8, 10, 11].includes(dd.month) && dd.day === 15) {
      const m = S.macro; let ch = 0;
      const infl = Object.keys(INGR).reduce((a, k) => a + S.ingr[k].p / INGR[k].base, 0) / Object.keys(INGR).length;
      if (S.econ.mult > 1.02 && infl > 1.08 && rnd(S) < 0.55) ch = 0.25;
      else if (S.econ.mult < 0.98 && rnd(S) < 0.6) ch = -0.25;
      else if (rnd(S) < 0.12) ch = rnd(S) < 0.5 ? 0.25 : -0.25;
      m.base = clamp(Math.round((m.base + ch) * 100) / 100, 0.5, 5);
      m.hist.push(m.base); if (m.hist.length > 40) m.hist.shift();
      log(S, ch > 0 ? `🏦 한국은행이 기준금리를 ${m.base.toFixed(2)}%로 올렸어요. 대출 이자가 늘고 주가에 부담이 돼요.` : ch < 0 ? `🏦 한국은행이 기준금리를 ${m.base.toFixed(2)}%로 내렸어요. 대출 이자가 줄어요.` : `🏦 한국은행이 기준금리를 ${m.base.toFixed(2)}%로 동결했어요.`, ch > 0 ? 'warn' : ch < 0 ? 'good' : 'info');
    }
    const ev = !S.opts || S.opts.events;
    // 위생 점검
    if (ev && rnd(S) < 0.04) {
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
    const evOn = !S.opts || S.opts.events;
    if (r < 0.3 || (S.nextHype != null && rnd(S) < 0.7)) {
      const i = S.nextHype != null ? S.nextHype : Math.floor(rnd(S) * HOODS.length); const h = S.hoods[i]; S.nextHype = null;
      h.hype = clamp(h.hype + 30 + rnd(S) * 15, 0, 100);
      log(S, `🔥 "요즘 ${HOODS[i].name}이 뜬다" — SNS에 골목 사진이 쏟아지고 있어요. 젊은 손님과 관광객이 늘고 임대료도 오를 거예요.`, 'good');
    } else if (r < 0.4) {
      const hot = S.hoods.map((h, i) => [h, i]).filter(([h]) => h.hype > 30);
      if (hot.length) { const [h, i] = pick(S, hot); h.hype *= 0.55; log(S, `🍂 ${HOODS[i].name} 상권의 열기가 식고 있어요. 방문객이 줄어드는 중이에요.`, 'warn'); }
    } else if (r < 0.46) {
      const cands = FUTURE_STATIONS.filter(f => !S.stations.some(s2 => s2.x === f.x && s2.y === f.y));
      if (cands.length) { const f = pick(S, cands); S.stations.push(Object.assign({}, f)); const i = hoodAt(S, f.x, f.y); S.hoods[i].transit = true; computeLand(S); log(S, `🚇 ${HOODS[i].name}에 ${f.name}이 개통했어요. 역 주변 유동인구와 임대료가 오를 거예요.`, 'good'); }
    } else if (r < 0.53 && S.hoods.some(h => h.age > 0.6)) {
      const L = S.hoods.map((h, i) => [h, i]).filter(([h]) => h.age > 0.6); const [h, i] = pick(S, L);
      let freed = 0;
      for (const t of S.tiles) if (t.h === i && t.b && ['house', 'villa'].includes(t.b.k) && rnd(S) < 0.3) { vacate(S, t); freed++; }
      h.age = 0.15; h.income *= 1.15; h.rentMult *= 1.1; h.displaced += freed * 30;
      log(S, `🏗️ ${HOODS[i].name} 재개발 확정! 낡은 주택 ${freed}채가 헐리고 빈 땅이 생겼어요. 앞으로 땅값이 오를 거예요.`, 'warn');
    } else if (r < 0.5) {
      const i = pick(S, [4, 7]); S.hoods[i].offMult *= 1.2;
      log(S, `🏢 대기업 본사가 ${HOODS[i].name}으로 이전해요. 직장인 손님이 20% 늘어요.`, 'good');
    }
    const r2 = rnd(S);
    if (r2 < 0.2) {
      const k = pick(S, Object.keys(INGR)); const up = evOn ? rnd(S) < 0.65 : false;
      S.ingr[k].p *= up ? 1.25 + rnd(S) * 0.25 : 0.8;
      log(S, up ? `📈 ${INGR[k].name} 국제 시세가 급등했어요.` : `📉 ${INGR[k].name} 풍작으로 값이 내렸어요.`, up ? 'warn' : 'good');
    } else if (r2 < 0.36) {
      const cat = pick(S, CAT_KEYS);
      S.trends[cat] = { mult: 1.25, until: S.hour + 60 * 24 };
      log(S, `✨ SNS에서 ${CATS[cat].name} 열풍! 두 달간 수요가 늘어요.`, 'good');
    } else if (r2 < 0.44 && S.econ.until <= S.hour) {
      const boom = !evOn || rnd(S) < 0.5;
      S.econ = { mult: boom ? 1.06 : 0.9, until: S.hour + 90 * 24 };
      log(S, boom ? '☀️ 경기가 좋아져 외식 소비가 늘고 있어요.' : '🌧️ 경기 둔화로 소비 심리가 위축됐어요.', boom ? 'good' : 'warn');
    }
    if (S.econ.until <= S.hour) S.econ.mult = 1;
    void d;
  }

  // ---------- 경쟁사 AI ----------
  // 성향에 맞는 입지 고르기
  function aiLot(S, c, cat) {
    const lots = lotPotentials(S, cat, c.id, 220);
    if (!lots.length) return null;
    const arch = c.ai.arch;
    for (const l of lots) {
      const hd = S.hoods[tile(S, l.x, l.y).h];
      let sc = l.cust;
      if (arch === 'discount') sc *= Math.pow(400 / hd.income, 0.8);
      if (arch === 'premium') sc *= Math.pow(hd.income / 400, 0.8);
      if (arch === 'trend') sc *= 1 + hd.hype / 40;
      if (arch === 'investor') sc *= 1 + hd.hype / 100 + (1 - hd.age) * 0.2;
      l.score = sc;
    }
    lots.sort((a, b) => b.score - a.score);
    return lots[Math.floor(rnd(S) * Math.min(lots.length, 3))];
  }
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
        if (st.size < 3 && st.lost > st.served * 0.3 && c.cash > upgradeCost(S, st) * 3) upgradeStore(S, st.id);
        if (c.ai.arch === 'investor' && !st.owned && c.cash > propertyPrice(S, st) * 2.5) buyProperty(S, st.id);
      }
      const count = S.stores.filter(s => s.owner === c.id).length;
      const maxStores = Math.min(c.ai.max || 32, 4 + Math.floor(dayOf(S) / 90) * 2);
      let opens = rnd(S) < 0.5 * c.ai.aggr ? 2 : (rnd(S) < 0.4 + 0.6 * c.ai.aggr ? 1 : 0);
      while (opens-- > 0 && count < maxStores) {
        let cat = rnd(S) < 0.88 ? pick(S, c.ai.focus) : pick(S, CAT_KEYS);
        if (c.ai.arch === 'trend') { const hot = CAT_KEYS.filter(k => S.trends[k] && S.trends[k].until > S.hour); if (hot.length) cat = pick(S, hot); }
        const spot = aiLot(S, c, cat);
        if (!spot) break;
        const size = c.ai.tier >= 3 ? 2 : (spot.cust > 220 ? 2 : 1);
        const cost = openCost(S, cat, spot.x, spot.y, size, c.ai.style, c.ai.tier || 2);
        if (c.cash < cost.total * 1.8 || spot.cust < (c.ai.minCust || 110)) break;
        openStore(S, c.id, spot.x, spot.y, cat, { size, style: c.ai.style, tier: c.ai.tier || 2 });
        if (rnd(S) < 0.3) log(S, `🏪 ${c.name}이(가) ${HOODS[tile(S, spot.x, spot.y).h].name}에 ${CATS[cat].name} 매장을 열었어요.`, 'info');
      }
      if (c.cash > (c.ai.arch === 'local' ? 5e7 : 8e8) && rnd(S) < (c.ai.arch === 'local' || c.ai.arch === 'premium' ? 0.5 : 0.25)) {
        const cat = pick(S, c.ai.focus); const cost = researchCost(c, cat);
        if (c.recipe[cat] < 10 && c.cash > cost * (c.ai.arch === 'local' ? 1.5 : 3)) { c.cash -= cost; c.recipe[cat]++; }
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
    return { ok: own >= 3 && p.brand[cat] >= 20 && !!p.hq, own, brand: p.brand[cat], hq: !!p.hq };
  }
  function setFranchise(S, cat, on, royalty) {
    const p = S.companies[0];
    if (on && !canFranchise(S, cat).ok) return { ok: false, msg: '본사, 직영점 3곳, 인지도 20 이상이 필요해요.' };
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
      const fP = deptPower(S, p, 'fran');
      for (const st of frs) if (st.lossDays > 100 + 30 * fP) {
        closeStore(S, st.id, true); p.brand[cat] = Math.max(0, p.brand[cat] - 2);
        log(S, `😢 ${CATS[cat].name} 가맹점 한 곳이 적자로 폐업했어요. 브랜드 이미지가 조금 상했어요.`, 'bad');
      }
      if (frs.length >= own * 5) continue;
      const monthly = clamp((0.3 + p.brand[cat] / 100 * 1.2 - (fr.royalty - 0.03) * 10) * (1 + 0.3 * fP), 0.03, 2);
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
    return HOODS.map((H0, i) => {
      const mix = { res: 0, off: 0, uni: 0, tour: 0 }, prof = {}, cls = {};
      for (const sc of srcs) if (sc.h === i) { mix[sc.seg] += sc.pop; prof[sc.prof] = (prof[sc.prof] || 0) + sc.pop; }
      const tiles = S.tiles.filter(t => t.h === i && t.t === 'land');
      for (const t of tiles) if (t.b && BTYPES[t.b.k]) { const c = BTYPES[t.b.k].cls; cls[c] = (cls[c] || 0) + 1; }
      const rent = tiles.reduce((a, t) => a + t.rent, 0) / Math.max(1, tiles.length);
      const stores = S.stores.filter(s2 => tile(S, s2.x, s2.y).h === i);
      const hd = S.hoods[i];
      return { i, name: H0.name, desc: H0.desc, kind: H0.kind, hype: hd.hype, transit: S.stations.some(s2 => hoodAt(S, s2.x, s2.y) === i), income: hd.income, qol: hd.qol, age: hd.age, gentri: hd.gentri, displaced: hd.displaced, mix, prof, cls, pop: Object.values(mix).reduce((a, b) => a + b, 0), rent, stores: stores.length, empty: tiles.filter(isLot).length };
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
    const S = JSON.parse(str);
    // 지도가 바뀐 저장은 이어갈 수 없음(사용자 결정: 새 도시로 시작, 예전 저장은 보관)
    if (!S || S.mapVersion !== MAP_VERSION || !S.world) throw new Error('예전 지도 저장이라 불러올 수 없어요');
    if (!S.contentVersion) S.contentVersion = 1;
    // 콘텐츠 2: 매장 안이 4배로 넓어짐 → 예전 가구 배치는 새 기본 배치로
    if (S.contentVersion < 2) { for (const st of S.stores) st.furn = null; S.contentVersion = 2; }
    if (S.v === 2) {
      S.v = 3; S.stations = STATION_SITES.map(x => Object.assign({}, x)); S.hqCands = []; S.nextHype = null;
      S.hoods.forEach((hd, i) => Object.assign(hd, { income: HOODS[i].income, age: HOODS[i].age, qol: 50, displaced: 0, gentri: 0 }));
      for (const c of S.companies) { c.hq = c.hq || null; for (const k in blankLedger()) if (c.cur[k] == null) c.cur[k] = 0; }
      computeLand(S); computeQol(S); refreshHqCands(S);
    }
    for (const c of S.companies) for (const k of CAT_KEYS) { if (c.brand[k] == null) c.brand[k] = 0; if (c.recipe[k] == null) c.recipe[k] = 1; if (!c.fr[k]) c.fr[k] = { on: false, royalty: 0.04 }; }
    for (const st of S.stores) { if (!st.menu) { st.menu = defaultMenu(st.cat, st.size); st.sig = null; } refreshMenu(S, st); }
    return S;
  }

  const api = {
    coastY, riverC, MAP_VERSION, REF_AREA, BEACH_W, AVE_X, AVE_Y,
    W, H, ROAD_EVERY, REACH, HOOD, congestion, parkingScore, computeTraffic, TRAFFIC_HOURS, ARCHETYPES, DIFFICULTY, loanRate, LANDMARKS, DEPTS, DEPT_KEYS, landFactors, deptPower, hqHire, hqAct, hqSalaryAsk, rentalIncome, facCost, facValue, computeQol, hourParts, CATS, CAT_KEYS, SIZES, INGR, SEG, SEG_KEYS, HOODS, TIERS, STYLES, STYLE_KEYS, ARCH, ARCH_KEYS,
    FAC, PUBLIC, MKT, MKT_NAME, STORE_EVENTS, CO_EVENTS, LOGO_SHAPES, ROLES, SHIFTS, WEATHER, QUESTS, BURDEN, PROFILE, SEG_HOURS,
    roadComponents, newGame, step, tile, isLot, anchorOf, hood, hoodAt, nearSources, BTYPES, CLS_NAME, PROFILE_NAME, PROFILE_MULT, LINES, buildingPop, findFit, sources, population, dateOf, seasonOf, dayOf,
    openCost, interiorCost, utilMonth, propertyPrice, archCost, researchCost, upgradeCost, interiorBook, spaceScore, keyMoney,
    ROOM, FURN, FURN_KEYS, zoneAt, furnRect, furnCells, furnFits, ensureFurn, defaultFurn, furnFx, furnAppeal, placeFurn, removeFurn, resetFurn, kitchenW, ACCT_NAME, CASH_ACCT, VENDORS, setVendor, storeTitle, furnFlow, fbox, setInvDays, invNeed, stockCap, WALLET,
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
