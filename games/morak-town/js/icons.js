/* 모락모락 타운 — 선으로만 그린 카툰 아이콘 (24×24, 채움 없음)
 * 같은 경로를 HTML(SVG)과 캔버스(Path2D)에서 함께 씀. 화면의 이모지는 자동으로 이 아이콘으로 바뀜. */
(function (root) {
  'use strict';
  const C = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  const R = (x, y, w, h, r) => r ? `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z` : `M${x} ${y}h${w}v${h}h${-w}z`;
  const DOT = (x, y) => `M${x} ${y}h.01`;
  const BOWL = 'M3 12h18a9 8 0 0 1-18 0z';
  const CLOUD = 'M7 17a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 8.5 4 4 0 0 1 17.5 17z';
  const HOUSE = 'M4 11l8-7 8 7M6 9.5V20h12V9.5M10 20v-5h4v5';
  const STAR = 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z';
  const HEART = 'M12 20s-8-5-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15 12 20 12 20z';
  const FACE = C(12, 12, 9) + DOT(9, 10) + DOT(15, 10);
  const P = {
    fire: 'M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4.5 3-6.5.3 2 1.3 3 2.3 3C11.3 7.5 10.5 5.5 12 3z',
    temple: 'M3 9l9-5 9 5zM4 9h16M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16M3 21h18',
    office: R(5, 3, 14, 18, 1) + 'M8.5 7h2M13.5 7h2M8.5 11h2M13.5 11h2M8.5 15h2M13.5 15h2M10.5 21v-3h3v3',
    tree: C(12, 9, 6) + 'M12 15v6M9 21h6M10 11l2 2 2-3',
    sun: C(12, 12, 4) + 'M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    store: 'M4 10l1.5-6h13L20 10M5 10v10h14V10M10 20v-5h4v5M4 10a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0',
    star: STAR,
    sparkle: 'M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z',
    hand2: 'M3 12l3.5-3.5 3.5 1.5 2.5-1.5h4L21 12M6.5 8.5L5 14l4 4 2-1 2 1 4-4-3-3-3 2-2-1',
    bell: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 20.5a2 2 0 0 0 4 0',
    wave: 'M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0',
    tram: R(6, 3, 12, 14, 3) + 'M6 10h12M9 3V1.5h6V3' + DOT(9, 13.5) + DOT(15, 13.5) + 'M8.5 17L6.5 21M15.5 17l2 4',
    oldhouse: HOUSE + 'M15 7l-1 3 2 1-1 3',
    door: R(6, 3, 12, 18, 1) + DOT(15, 12) + 'M4 21h16',
    rain: CLOUD + 'M8 19l-1 2M12 19l-1 2M16 19l-1 2',
    cloud: CLOUD + 'M15 4.5A3.5 3.5 0 0 1 20 7.5',
    snow: CLOUD + DOT(8, 20) + DOT(12, 21) + DOT(16, 20),
    coffee: 'M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3c0 2 2 2 2 4M12 3c0 2 2 2 2 4',
    cube: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12L4 7.5M12 12v9',
    houses: 'M2 12l5-5 5 5M3.5 10.5V19h7v-8.5M12 10l5-5 5 5M13.5 8.5V19h7V8.5M5.5 19v-3h3v3M15.5 19v-3h3v3',
    truck: 'M2 6h11v10H2zM13 9h4l3.5 3.5V16H13' + C(6, 18, 2) + C(17, 18, 2),
    mountain: 'M2 20l7-12 4 6 2.5-3.5L22 20zM7.5 10.5l1.5 1.5 1.5-1.5',
    factory: 'M3 20V10l5 3v-3l5 3v-3l5 3V4h3v16zM7 17h2M12 17h2',
    busstop: 'M7 21V3M7 4h9a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H7M10 7.5h5M4 21h6',
    sad: FACE + 'M8.5 16.5a5 5 0 0 1 7 0',
    smile: FACE + 'M8 14a5 5 0 0 0 8 0',
    meh: FACE + 'M9 15h6',
    cry: FACE + 'M8.5 16.5a5 5 0 0 1 7 0M8 12v2',
    heart: HEART,
    broken: HEART + 'M12 7l-1.5 4 3 2-1.5 3',
    bolt: 'M13 2L5 13.5h6L10 22l8-11.5h-6z',
    party: 'M4 20l4-12 8 8zM7 11l6 6M13 3c0 2 2 2 2 4M18 6l2-1M17 11c2-1 3 0 4 1M14 8l1.5-1.5',
    trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4.5M16 6h3a3 3 0 0 1-3 4.5M12 13v4M9 21v-4h6v4M7 21h10',
    cake: 'M3 19l18-7v7zM3 19v-3l18-7v3M12 8.5V5' + DOT(12, 3.5) + 'M3 16l18-7',
    pan: C(10, 13, 6) + 'M14.5 8.5L21 3M9 11.5c1-1 3-1 3 1',
    search: C(10, 10, 6) + 'M14.5 14.5L20 20',
    flask: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3M7.5 15h9',
    wavehand: 'M7 13V6.5a1.5 1.5 0 0 1 3 0V11M10 11V4.5a1.5 1.5 0 0 1 3 0V11M13 11V5.5a1.5 1.5 0 0 1 3 0V12M16 10a1.5 1.5 0 0 1 3 0v4.5A6.5 6.5 0 0 1 12.5 21h-1a6 6 0 0 1-5-2.8L4 14a1.5 1.5 0 0 1 2.5-1.5L7 13.5',
    doc: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
    memo: 'M6 3h12v18H6zM9 8h6M9 12h6M9 16h3M15 15l2-2 1 1-2 2h-1z',
    scale: 'M12 4v16M7 20h10M4 8h16M6 8l-3 6a3 3 0 0 0 6 0zM18 8l-3 6a3 3 0 0 0 6 0z',
    music: 'M9 18V5l11-2v13' + C(6.5, 18, 2.5) + C(17.5, 16, 2.5),
    moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
    chart: 'M4 20h16M7 20v-6M12 20V8M17 20v-9',
    up: 'M4 20h16M4 16l5-5 4 3 7-8M15 6h5v5',
    down: 'M4 20h16M4 7l5 5 4-3 7 7M15 16h5v-5',
    point: 'M10 11V4.5a1.5 1.5 0 0 1 3 0V10l4.2 1a2 2 0 0 1 1.5 2.3L17.5 20H9.5L6 15a1.5 1.5 0 0 1 2.4-1.8L10 15',
    blossom: C(12, 12, 2) + C(12, 6.5, 2.8) + C(17.2, 10.3, 2.8) + C(15.2, 16.5, 2.8) + C(8.8, 16.5, 2.8) + C(6.8, 10.3, 2.8),
    maple: 'M12 3l2 4 4-1-1 4 3 2-4 2 1 4-5-2-5 2 1-4-4-2 3-2-1-4 4 1zM12 15v6',
    flake: 'M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9.5 3.5L12 5l2.5-1.5M9.5 20.5L12 19l2.5 1.5',
    road: 'M8 3L4 21M16 3l4 18M12 4v3M12 10.5v3M12 17v3',
    bridge: 'M2 16h20M3 16c4-8 14-8 18 0M6 16v4M18 16v4M12 10v6M8 11.5V16M16 11.5V16',
    house: HOUSE,
    school: 'M3 21V10l9-5 9 5v11M3 21h18M9 21v-5h6v5M12 5V2l3 1-3 1' + C(12, 11, 2),
    grad: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6',
    beach: 'M4 12a8 8 0 0 1 16 0zM12 12v8M7 21h10M12 4V3M8 12c0-4 2-7 4-8M16 12c0-4-2-7-4-8',
    square: R(4, 4, 16, 16, 3),
    broom: 'M15 3l-4 9M7 12h8l2 9H5zM9 16l-.5 5M12.5 16l.5 5',
    sprout: 'M12 21v-8M12 13c0-4-3-6-7-6 0 4 3 6 7 6zM12 11c0-3 2-5 6-5 0 3-2 5-6 5zM8 21h8',
    wheat: 'M12 21V6M12 8c-2-1-3-3-3-5 2 1 3 3 3 5zM12 8c2-1 3-3 3-5-2 1-3 3-3 5zM12 13c-2-1-3-3-3-5 2 1 3 3 3 5zM12 13c2-1 3-3 3-5-2 1-3 3-3 5zM12 18c-2-1-3-3-3-5 2 1 3 3 3 5zM12 18c2-1 3-3 3-5-2 1-3 3-3 5z',
    croissant: 'M3 15c2-7 16-7 18 0-2 2-4 1-5-1-1 2.5-6 2.5-8 0-1 2-3 3-5 1zM9 9l1 5M15 9l-1 5',
    noodle: BOWL + 'M8 21h8M14 3l3 8M18 2l2 9M7 12c0-2 1.5-3 3-3s1.5 3 3 3',
    burger: 'M4 11a8 6 0 0 1 16 0zM3 14h18M4.5 17h15a2 2 0 0 1-2 3h-11a2 2 0 0 1-2-3z' + DOT(10, 8) + DOT(14, 8),
    skewer: 'M3 21L21 3' + C(7.5, 16.5, 2.4) + C(12, 12, 2.4) + C(16.5, 7.5, 2.4),
    chicken: 'M15 3.5a5.5 5.5 0 0 1 5.5 5.5c0 4.5-5 6.5-8 6.5l-4 4a1.6 1.6 0 1 1-2.3-2.3l4-4c0-3 1.8-9.7 4.8-9.7z',
    pizza: 'M3.5 6.5L12 21l8.5-14.5zM3.5 6.5c5-2.5 12-2.5 17 0' + C(10, 11, 1.2) + C(14, 13, 1.2) + C(12, 16.5, 1),
    rice: BOWL + 'M6 12c0-3 3-5 6-5s6 2 6 5M8 21h8',
    sushi: R(3, 9, 18, 8, 4) + 'M3 13h18M9 9v8M15 9v8',
    dumpling: 'M3 16a9 7 0 0 1 18 0zM7 11l1 2M11 9l.5 3M15 9.5l-1 2.5M18 12l-1.5 1.5',
    salad: BOWL + 'M8 12c0-3 2-5 4-5M12 12c0-3 2-5 5-4M6 10c1-2 3-2 4 0M8 21h8',
    boba: 'M6 7h12l-2 14H8zM5 7h14M12 7l2-5' + C(10, 17, 1) + C(14, 17, 1) + C(12, 15, 1),
    pancake: 'M4 9h16v3H4zM3 12h18v3H3zM4 15h16v3H4zM9 9c0-2 6-2 6 0M14 9l1 2',
    sake: 'M10 3h4v3l2 3v12H8V9l2-3zM8 13h8',
    box: 'M3 8l9-4 9 4v9l-9 4-9-4zM3 8l9 4 9-4M12 12v9M7.5 6l9 4',
    bean: 'M8.5 4C14 2 20 8 18 14s-11 7.5-13 2.5S3.5 6 8.5 4zM9 10c2.5 0 4.5 2 4.5 5',
    mall: 'M3 9l2-5h14l2 5M4 9v11h16V9M3 9h18M8 20v-5h8v5M7 12h2M15 12h2',
    megaphone: 'M3 10v4h3l9 5V5L6 10zM18 9a4 4 0 0 1 0 6M6 14l1 6h3l-1-5',
    parking: R(4, 4, 16, 16, 4) + 'M10 17V7h3a3 3 0 0 1 0 6h-3',
    receipt: 'M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21zM9 8h6M9 12h6M9 16h4',
    baguette: 'M4 17L17 4a2.2 2.2 0 0 1 3 3L7 20a2.2 2.2 0 0 1-3-3zM9 12l2 2M12 9l2 2M15 6l2 2',
    faucet: 'M4 8h10a3 3 0 0 1 3 3v2M9 8V5M6 5h6M17 16v.01M17 19.5v.01',
    chair: 'M8 3v18M8 12h9v9M8 6h8M16 3v9',
    plate: C(12, 12, 6.5) + C(12, 12, 3.5) + 'M3 4v16M21 4v6a2 2 0 0 1-2 2M21 12v8',
    cocktail: 'M4 4h16l-8 9zM12 13v7M8 20h8M15 4l3-2',
    sofa: 'M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M2 12.5a2 2 0 0 1 4 0V14h12v-1.5a2 2 0 0 1 4 0V18H2zM5 18v2M19 18v2',
    plant: 'M7 14h10l-1 7H8zM12 14V8M12 9.5c-1-3-4-4-6.5-3 0 3 3 4 6.5 3zM12 8c1-3 4-4 6.5-3 0 3-3 4-6.5 3z',
    books: 'M4 4h4v16H4zM8 6h4v14H8zM13 6l3.5-1 3.5 14-3.5 1zM4 8h4M8 10h4',
    bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z',
    piano: R(3, 6, 18, 12, 1.5) + 'M3 12h18M7.5 12v6M12 12v6M16.5 12v6M6 6v4M10 6v4M14 6v4M18 6v4',
    radio: R(3, 8, 18, 12, 2) + C(9, 14, 3) + 'M15 12h3M15 15h3M6 8l12-5',
    hot: 'M10 4a2 2 0 0 1 4 0v10a4 4 0 1 1-4 0zM12 9v8M18 4l2-1M19 8h2',
    cold: 'M10 4a2 2 0 0 1 4 0v10a4 4 0 1 1-4 0zM12 13v4M18 3v6M15.5 4.5l5 3M15.5 7.5l5-3',
    anger: 'M4 9c3 0 5-2 5-5M15 4c0 3 2 5 5 5M20 15c-3 0-5 2-5 5M9 20c0-3-2-5-5-5',
    person: C(12, 7, 4) + 'M4 21a8 8 0 0 1 16 0',
    warn: 'M12 3l10 18H2zM12 10v5M12 18v.01',
    camera: 'M3 8h4l2-3h6l2 3h4v12H3z' + C(12, 14, 4),
    crane: 'M5 21V3h2M5 5h15M9 5L5 9M18 5v4M16 9h4v3h-4zM2 21h8',
    gift: R(4, 10, 16, 11, 1) + 'M3 7h18v3H3zM12 7v14M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0',
    tv: R(3, 6, 18, 13, 2) + 'M8 2l4 4 4-4',
    berry: 'M12 7c4 0 7 2.5 7 6 0 4.5-4 8-7 8s-7-3.5-7-8c0-3.5 3-6 7-6zM9 4l3 3 3-3' + DOT(10, 12) + DOT(14, 12) + DOT(12, 15),
    target: C(12, 12, 9) + C(12, 12, 5) + C(12, 12, 1.5),
    drop: 'M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z',
    sponge: R(4, 7, 16, 10, 3) + C(9, 11, 1) + C(14, 13, 1.2) + C(16, 10, .8),
    bank: 'M3 9l9-5 9 5zM5 9v9M9 9v9M15 9v9M19 9v9M3 18h18M3 21h18',
    note: 'M9 18V5l9-2v13' + C(6.5, 18, 2.5) + C(15.5, 16, 2.5),
    seat: 'M7 3v11h10M7 14v7M17 14v7M7 7c3 0 5 1 5 4',
    light: 'M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3zM9 18h6',
  };
  // 이모지 → 아이콘 이름
  const MAP = {
    '🔥': 'fire', '🏛': 'temple', '🏢': 'office', '🌳': 'tree', '☀': 'sun', '🏪': 'store', '⭐': 'star', '🌟': 'star', '✨': 'sparkle',
    '🤝': 'hand2', '🏦': 'bank', '🔔': 'bell', '🌊': 'wave', '🚇': 'tram', '🏚': 'oldhouse', '🚪': 'door', '🌧': 'rain', '☕': 'coffee',
    '🧊': 'cube', '🏘': 'houses', '🚚': 'truck', '🌿': 'sprout', '⛰': 'mountain', '🏭': 'factory', '🚏': 'busstop', '😣': 'sad', '😊': 'smile',
    '🙂': 'meh', '😢': 'cry', '💛': 'heart', '💔': 'broken', '⚡': 'bolt', '🎉': 'party', '🏆': 'trophy', '🍰': 'cake', '🍳': 'pan', '🌱': 'sprout',
    '🔍': 'search', '🧪': 'flask', '👋': 'wavehand', '📄': 'doc', '📝': 'memo', '📒': 'memo', '⚖': 'scale', '🎵': 'music', '🌙': 'moon', '📊': 'chart',
    '📈': 'up', '📉': 'down', '👆': 'point', '🌸': 'blossom', '🍁': 'maple', '🍂': 'maple', '❄': 'flake', '🛣': 'road', '🌉': 'bridge', '🏠': 'house',
    '🏫': 'school', '🎓': 'grad', '🏖': 'beach', '🟩': 'square', '🟫': 'square', '🧹': 'broom', '🌾': 'wheat', '🥐': 'croissant', '🍜': 'noodle',
    '🍔': 'burger', '🍢': 'skewer', '🍗': 'chicken', '🍕': 'pizza', '🍚': 'rice', '🍣': 'sushi', '🥟': 'dumpling', '🥗': 'salad', '🧋': 'boba',
    '🥞': 'pancake', '🍶': 'sake', '📦': 'box', '🫘': 'bean', '🏬': 'mall', '📣': 'megaphone', '🅿': 'parking', '🧾': 'receipt', '🥖': 'baguette',
    '🚰': 'faucet', '🪑': 'chair', '🍽': 'plate', '🍸': 'cocktail', '🛋': 'sofa', '💺': 'seat', '🪴': 'plant', '📚': 'books', '💡': 'light',
    '🎹': 'piano', '📻': 'radio', '⛅': 'cloud', '🌨': 'snow', '🥵': 'hot', '🥶': 'cold', '💢': 'anger', '🧑': 'person', '⚠': 'warn', '📸': 'camera',
    '🏗': 'crane', '🎁': 'gift', '📺': 'tv', '🍓': 'berry', '🎯': 'target', '💧': 'drop', '🧽': 'sponge',
  };
  const keys = Object.keys(MAP).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const RE = new RegExp('(' + keys.join('|') + ')[\\uFE0F\\u200D]*', 'gu');
  const nameOf = s => P[s] ? s : MAP[s] || MAP[String(s).replace(/[️‍]/g, '')] || null;
  function svg(s, cls) { const n = nameOf(s); if (!n) return s; return `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`; }
  const P2 = {};
  // 캔버스: 중심 (x,y), 크기 size(px), 선 색 col
  function draw(ctx, s, x, y, size, col, lw, fill) {
    const n = nameOf(s); if (!n || typeof Path2D === 'undefined') return false;
    const p = P2[n] || (P2[n] = new Path2D(P[n]));
    ctx.save(); ctx.translate(x - size / 2, y - size / 2); ctx.scale(size / 24, size / 24);
    if (fill) { ctx.fillStyle = fill; ctx.fill(p); }
    ctx.strokeStyle = col || '#5e1f2b'; ctx.lineWidth = lw || 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(p);
    ctx.restore(); return true;
  }
  // DOM 안의 이모지 글자를 아이콘으로 바꿈
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, OPTION: 1, TITLE: 1 };
  function iconize(node) {
    if (!node || typeof document === 'undefined') return;
    if (node.nodeType === 3) { swap(node); return; }
    if (node.nodeType !== 1 || SKIP[node.nodeName]) return;
    const w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, { acceptNode: t => (t.parentNode && SKIP[t.parentNode.nodeName]) || t.parentNode.closest('svg') ? 2 : 1 });
    const list = []; let t; while ((t = w.nextNode())) { RE.lastIndex = 0; if (RE.test(t.nodeValue)) list.push(t); }
    list.forEach(swap);
  }
  function swap(t) {
    RE.lastIndex = 0; if (!RE.test(t.nodeValue) || !t.parentNode) return;
    const span = document.createElement('span'); span.className = 'icw';
    span.innerHTML = t.nodeValue.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]).replace(RE, m => svg(m));
    const frag = document.createDocumentFragment(); while (span.firstChild) frag.appendChild(span.firstChild);
    t.parentNode.replaceChild(frag, t);
  }
  function watch(rootEl) {
    iconize(rootEl);
    new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') swap(m.target); else m.addedNodes.forEach(iconize); } }).observe(rootEl, { childList: true, subtree: true, characterData: true });
  }
  root.Icons = { svg, draw, iconize, watch, has: s => !!nameOf(s), names: Object.keys(P) };
})(typeof window !== 'undefined' ? window : globalThis);
