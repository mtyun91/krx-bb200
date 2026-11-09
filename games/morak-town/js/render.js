/* 모락모락 타운 — 아이소메트릭 캔버스 렌더러 (도시 + 매장 내부)
 * 그림체: 진한 자주색 잉크 외곽선 + 납작한 따뜻한 색면(분홍·겨자·라벤더·산호·세이지) */
(function (root) {
  'use strict';
  const Sim = root.Sim;
  const TW = 64, TH = 32, HW = TW / 2, HH = TH / 2;
  const REDUCED = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  const INK = '#5e1f2b';
  const LW = 1.25;

  const GRASS = { spring: '#b7c17a', summer: '#a3b466', autumn: '#cdad5c', winter: '#f4eeec' };
  const GRASS2 = { spring: '#a9b56c', summer: '#94a85a', autumn: '#bf9d4f', winter: '#e9e1df' };
  const PAVE = '#efdcd6', ROAD = '#d8bfbe', ROAD_W = '#efe7e6';
  const TREE = {
    spring: ['#f2b3c4', '#e895ad', '#86a35a'], summer: ['#7f9c55', '#93ad62', '#6d8a49'],
    autumn: ['#e39a4a', '#d97b3f', '#c9a14a'], winter: ['#fbf8f8', '#efe9ea', '#7d9a6a'],
  };
  const WALLS = ['#a99bd9', '#e58ba3', '#e46b5f', '#e3a63c', '#d9677e', '#9ea7de', '#f0b6a8', '#8fb38a'];
  const ROOFS = ['#c75b6a', '#7d6fb8', '#d98a3a', '#a3477a', '#6f8fb5'];
  const SHIRTS = ['#e46b5f', '#9ea7de', '#e3a63c', '#8fb38a', '#a99bd9', '#e58ba3', '#6fb7b2', '#c9a27e', '#f2d36b'];
  const HAIR = ['#3b2228', '#5a3a2e', '#1f1416', '#8a5a3c', '#c79b6b', '#e3a63c'];
  const CARS = ['#e46b5f', '#e3a63c', '#a3477a', '#b9a3e0', '#c94f6d', '#7fb2d9'];

  function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + (s || 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function shade(hex, f) {
    if (hex[0] !== '#') return hex;
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }
  function iso(x, y) { return { x: (x - y) * HW, y: (x + y) * HH }; }
  function ink(ctx, w) { ctx.strokeStyle = INK; ctx.lineWidth = w || LW; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  function diamondPath(ctx, cx, cy, s, hw, hh) {
    hw = hw || HW; hh = hh || HH;
    ctx.beginPath(); ctx.moveTo(cx, cy - hh * s); ctx.lineTo(cx + hw * s, cy); ctx.lineTo(cx, cy + hh * s); ctx.lineTo(cx - hw * s, cy); ctx.closePath();
  }
  function diamond(ctx, cx, cy, s, fill, stroke) { diamondPath(ctx, cx, cy, s); ctx.fillStyle = fill; ctx.fill(); if (stroke) ink(ctx, stroke); }
  function poly(ctx, pts, fill, w) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (w !== 0) ink(ctx, w); }
  // 상자: 바닥 중심(cx,cy), 크기 s, 높이 h, 왼벽 색 wall
  function box(ctx, cx, cy, s, h, wall, top, sy) {
    sy = sy || s;
    const l = { x: cx - HW * s, y: cy - (HH * s - HH * sy) * 0 }, r = { x: cx + HW * s, y: cy }, b = { x: cx, y: cy + HH * sy }, t0 = { x: cx, y: cy - HH * sy };
    l.y = cy; r.y = cy;
    poly(ctx, [[l.x, l.y], [b.x, b.y], [b.x, b.y - h], [l.x, l.y - h]], wall);
    poly(ctx, [[b.x, b.y], [r.x, r.y], [r.x, r.y - h], [b.x, b.y - h]], shade(wall, -0.14));
    poly(ctx, [[l.x, l.y - h], [b.x, b.y - h], [r.x, r.y - h], [t0.x, t0.y - h]], top || shade(wall, -0.25));
    return { l, r, b, t: t0 };
  }
  function ledge(ctx, cx, cy, s, h, col) {
    const k = s * 1.04;
    poly(ctx, [[cx - HW * k, cy - h], [cx, cy + HH * k - h], [cx + HW * k, cy - h], [cx + HW * k, cy - h - 3], [cx, cy + HH * k - h - 3], [cx - HW * k, cy - h - 3]], col);
    poly(ctx, [[cx - HW * k, cy - h - 3], [cx, cy + HH * k - h - 3], [cx + HW * k, cy - h - 3], [cx, cy - HH * k - h - 3]], shade(col, -0.18));
  }
  function pyramid(ctx, cx, cy, s, h, rh, roof) {
    poly(ctx, [[cx - HW * s, cy - h], [cx, cy + HH * s - h], [cx, cy - h - rh]], roof);
    poly(ctx, [[cx, cy + HH * s - h], [cx + HW * s, cy - h], [cx, cy - h - rh]], shade(roof, -0.15));
  }
  // 벽 위 사각형 (side L/R, u 가로 0~1, v 높이 px)
  function faceQuad(ctx, cx, cy, s, side, u0, u1, v0, v1, fill, w) {
    const sx = side === 'L' ? -HW * s : HW * s;
    const ax = side === 'L' ? cx + sx * (1 - u0) : cx + sx * u0, ay = cy + HH * s * (side === 'L' ? u0 : 1 - u0);
    const bx = side === 'L' ? cx + sx * (1 - u1) : cx + sx * u1, by = cy + HH * s * (side === 'L' ? u1 : 1 - u1);
    poly(ctx, [[ax, ay - v0], [bx, by - v0], [bx, by - v1], [ax, ay - v1]], fill, w == null ? LW * 0.85 : w);
  }
  function windows(ctx, cx, cy, s, h, rows, cols, side, glass, lit, seed) {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const on = lit && hash(seed || 0, r * 7 + (side === 'L' ? 1 : 2), c) < lit;
      const v0 = h * (r + 0.28) / rows, v1 = h * (r + 0.78) / rows;
      faceQuad(ctx, cx, cy, s, side, (c + 0.22) / cols, (c + 0.78) / cols, v0, v1, on ? '#ffd98a' : glass);
      if ((r + c + (seed | 0)) % 3 === 0 && !on) faceQuad(ctx, cx, cy, s, side, (c + 0.22) / cols, (c + 0.78) / cols, v0, v0 + 2.2, shade(glass, -0.25), 0);
    }
  }
  function shadow(ctx, cx, cy, s) { ctx.fillStyle = 'rgba(94,31,43,0.12)'; ctx.beginPath(); ctx.ellipse(cx + 5, cy + 3, HW * s, HH * s, 0, 0, Math.PI * 2); ctx.fill(); }
  function drawTree(ctx, cx, cy, season, k) {
    const c = TREE[season];
    ctx.fillStyle = 'rgba(94,31,43,0.12)'; ctx.beginPath(); ctx.ellipse(cx + 3, cy + 2, 9, 4, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 10); ink(ctx, 2.2); ctx.strokeStyle = '#8a5a3c'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx - 4, cy - 15, 6.5, 0, 7); ctx.moveTo(cx + 10, cy - 14); ctx.arc(cx + 4, cy - 14, 6, 0, 7); ctx.moveTo(cx + 7, cy - 21); ctx.arc(cx, cy - 21, 7, 0, 7);
    ink(ctx, 2.6); ctx.fillStyle = c[k % 2]; ctx.fill();
    ctx.fillStyle = shade(c[k % 2], 0.25); ctx.beginPath(); ctx.arc(cx - 2, cy - 23, 2.2, 0, 7); ctx.fill();
  }
  function drawPine(ctx, cx, cy, season, sc) {
    sc = sc || 1;
    const col = season === 'winter' ? '#f7f3f3' : season === 'autumn' ? '#7d8f4a' : '#6f8f55';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 6 * sc); ink(ctx, 2);
    for (let i = 0; i < 3; i++) poly(ctx, [[cx - (9 - i * 2) * sc, cy - (5 + i * 7) * sc], [cx + (9 - i * 2) * sc, cy - (5 + i * 7) * sc], [cx, cy - (15 + i * 7) * sc]], col);
    if (season === 'winter') poly(ctx, [[cx - 3 * sc, cy - 23 * sc], [cx + 3 * sc, cy - 23 * sc], [cx, cy - 29 * sc]], '#7d9a6a', 0);
  }
  // 사람 (도시용, 작은 선화)
  function walker(ctx, x, y, shirt, hair, bob, umbrella) {
    ctx.fillStyle = 'rgba(94,31,43,0.14)'; ctx.beginPath(); ctx.ellipse(x, y + 0.5, 2.6, 1.1, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 1, y); ctx.lineTo(x - 1, y - 4 - bob * 0.3); ctx.moveTo(x + 1, y); ctx.lineTo(x + 1, y - 4 + bob * 0.3); ink(ctx, 1);
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - 2, y - 9 - bob, 4, 5.5, 1.5); else ctx.rect(x - 2, y - 9 - bob, 4, 5.5);
    ctx.fillStyle = shirt; ctx.fill(); ink(ctx, 0.9);
    ctx.beginPath(); ctx.arc(x, y - 11 - bob, 1.9, 0, 7); ctx.fillStyle = '#f4d2bd'; ctx.fill(); ink(ctx, 0.8);
    ctx.beginPath(); ctx.arc(x, y - 11.6 - bob, 1.9, Math.PI, 0); ctx.fillStyle = hair; ctx.fill();
    if (umbrella) { ctx.beginPath(); ctx.arc(x, y - 13 - bob, 5, Math.PI, 0); ctx.closePath(); ctx.fillStyle = shirt; ctx.fill(); ink(ctx, 0.9); }
  }

  // ---------- 회사 로고 ----------
  function logoPath(ctx, shape, x, y, r) {
    ctx.beginPath();
    if (shape === 'square') { const k = r * 0.9; if (ctx.roundRect) ctx.roundRect(x - k, y - k, k * 2, k * 2, r * 0.35); else ctx.rect(x - k, y - k, k * 2, k * 2); }
    else if (shape === 'leaf') { ctx.moveTo(x - r, y + r * 0.9); ctx.quadraticCurveTo(x - r * 1.1, y - r * 1.1, x + r, y - r); ctx.quadraticCurveTo(x + r * 1.1, y + r * 1.1, x - r, y + r * 0.9); }
    else if (shape === 'cloud') { ctx.arc(x - r * 0.45, y + r * 0.15, r * 0.6, 0, 7); ctx.arc(x + r * 0.45, y + r * 0.15, r * 0.6, 0, 7); ctx.arc(x, y - r * 0.25, r * 0.7, 0, 7); }
    else if (shape === 'heart') { ctx.moveTo(x, y + r); ctx.bezierCurveTo(x - r * 1.5, y - r * 0.1, x - r * 0.7, y - r * 1.3, x, y - r * 0.45); ctx.bezierCurveTo(x + r * 0.7, y - r * 1.3, x + r * 1.5, y - r * 0.1, x, y + r); }
    else if (shape === 'star') { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.5 : r * 1.05; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); }
    else ctx.arc(x, y, r, 0, Math.PI * 2);
  }
  function drawLogo(ctx, comp, x, y, r) {
    ctx.save();
    logoPath(ctx, comp.logo, x, y, r);
    ctx.fillStyle = comp.color; ctx.fill();
    ctx.lineWidth = Math.max(1, r * 0.2); ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.fillStyle = '#fff8ee'; ctx.font = `${Math.round(r * 1.05)}px "Jua","Gowun Dodum",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(comp.name.charAt(0), x, y + r * 0.1);
    ctx.restore();
  }
  function signBoard(ctx, x, y, w, h, fill, text, textCol) {
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, 3); else ctx.rect(x - w / 2, y - h / 2, w, h);
    ctx.fillStyle = fill; ctx.fill(); ink(ctx, 1.1);
    if (text) { ctx.fillStyle = textCol || INK; ctx.font = `${Math.round(h * 0.62)}px "Jua",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 0.5); }
  }

  function Renderer(canvas) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.cam = { x: 0, y: (Sim.W + Sim.H) * HH / 2, z: 0.9 };
    this.S = null; this.hover = null; this.sel = null; this.ghost = null; this.hourF = 12;
    this.overlay = null; this.walkers = []; this.cars = []; this.trucks = []; this.floaters = []; this.particles = [];
    this.clouds = []; this.groundKey = ''; this.pathCache = new Map(); this.t = 0;
    for (let i = 0; i < 4; i++) this.clouds.push({ x: Math.random() * 2400 - 1200, y: Math.random() * 1000, s: 0.6 + Math.random() * 0.8 });
    this.resize();
  }
  const R = Renderer.prototype;
  Renderer.drawLogo = drawLogo;
  Renderer.INK = INK;

  R.resize = function () {
    const r = this.c.getBoundingClientRect();
    this.dpr = Math.min(2, root.devicePixelRatio || 1);
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.c.width = this.w * this.dpr; this.c.height = this.h * this.dpr;
  };
  R.setState = function (S) { this.S = S; this.groundKey = ''; this.walkers = []; this.cars = []; this.trucks = []; this.pathCache.clear(); };
  R.toScreen = function (wx, wy) { return { x: (wx - this.cam.x) * this.cam.z + this.w / 2, y: (wy - this.cam.y) * this.cam.z + this.h / 2 }; };
  R.toWorld = function (sx, sy) { return { x: (sx - this.w / 2) / this.cam.z + this.cam.x, y: (sy - this.h / 2) / this.cam.z + this.cam.y }; };
  R.tileScreen = function (x, y) { const p = iso(x, y); return this.toScreen(p.x, p.y); };
  R.pick = function (sx, sy) {
    const w = this.toWorld(sx, sy);
    const a = w.y / HH, b = w.x / HW;
    const x = Math.floor((a + b) / 2 + 0.5), y = Math.floor((a - b) / 2 + 0.5);
    return (x >= 0 && y >= 0 && x < Sim.W && y < Sim.H) ? { x, y } : null;
  };
  R.centerOn = function (x, y) { const p = iso(x, y); this.cam.x = p.x; this.cam.y = p.y; };
  R.zoomAt = function (sx, sy, f) {
    const before = this.toWorld(sx, sy);
    this.cam.z = Math.max(0.35, Math.min(2.8, this.cam.z * f));
    const after = this.toWorld(sx, sy);
    this.cam.x += before.x - after.x; this.cam.y += before.y - after.y;
  };
  R.fit = function () { this.cam.z = Math.max(0.35, Math.min(1.2, Math.min(this.w / (Sim.W * TW * 0.92), this.h / (Sim.H * TH * 1.15)))); this.cam.x = 0; this.cam.y = (Sim.W + Sim.H) * HH / 2 - 10; };
  R.pop = function (x, y) { (this.pops || (this.pops = {}))[x + ',' + y] = this.t; };

  function darkness(h) {
    if (h >= 7 && h < 17.5) return 0;
    if (h >= 17.5 && h < 20) return (h - 17.5) / 2.5 * 0.8;
    if (h >= 5 && h < 7) return (7 - h) / 2 * 0.8;
    return 0.8;
  }
  function duskTint(h) { return (h >= 16.5 && h < 19.5) ? Math.sin((h - 16.5) / 3 * Math.PI) : (h >= 5 && h < 7.5 ? Math.sin((h - 5) / 2.5 * Math.PI) * 0.6 : 0); }

  // ---------- 바닥 캐시 ----------
  function roadAt(S, x, y) { const t = Sim.tile(S, x, y); return t && t.t === 'road'; }
  R.buildGround = function () {
    const S = this.S, season = Sim.seasonOf(S);
    const key = season + ':' + S.tiles.map(t => t.t[0] + (t.b && t.b.k !== 'store' && t.b.k !== 'fac' ? 'b' : '')).join('') + S.stations.length;
    if (key === this.groundKey) return;
    this.groundKey = key;
    const W = Sim.W * TW + TW, Hh = (Sim.W + Sim.H) * HH + TH + 8;
    const g = this.ground || (this.ground = document.createElement('canvas'));
    g.width = W * 1.5; g.height = Hh * 1.5; this.gox = W / 2; this.goy = HH;
    const ctx = g.getContext('2d');
    ctx.setTransform(1.5, 0, 0, 1.5, 0, 0);
    ctx.clearRect(0, 0, W, Hh);
    const winter = season === 'winter';
    for (const t of S.tiles) {
      const p = iso(t.x, t.y); const cx = p.x + this.gox, cy = p.y + this.goy;
      if (t.t === 'road') {
        diamond(ctx, cx, cy, 1, winter ? '#f1eaea' : ROAD);
        const hor = t.y % Sim.ROAD_EVERY === 0, ver = t.x % Sim.ROAD_EVERY === 0;
        ctx.save(); diamondPath(ctx, cx, cy, 1); ctx.clip();
        if (hor !== ver) {
          ctx.strokeStyle = ROAD_W; ctx.lineWidth = 1.6; ctx.setLineDash([6, 6]); ctx.beginPath();
          if (hor) { ctx.moveTo(cx - HW * 0.5, cy - HH * 0.5); ctx.lineTo(cx + HW * 0.5, cy + HH * 0.5); }
          else { ctx.moveTo(cx + HW * 0.5, cy - HH * 0.5); ctx.lineTo(cx - HW * 0.5, cy + HH * 0.5); }
          ctx.stroke(); ctx.setLineDash([]);
        } else {
          // 횡단보도
          ctx.fillStyle = 'rgba(255,250,248,0.9)';
          for (let i = -2; i <= 2; i++) { const ox = i * 6; ctx.save(); ctx.translate(cx + ox * 0.9 - 12, cy + ox * 0.45 - 4); ctx.transform(1, 0.5, 0, 1, 0, 0); ctx.fillRect(-1.5, -4, 3, 7); ctx.restore(); }
        }
        ctx.restore();
        // 연석: 땅과 맞닿은 변에 잉크 선
        const edges = [[0, -1, [cx - HW, cy], [cx, cy - HH]], [1, 0, [cx, cy - HH], [cx + HW, cy]], [0, 1, [cx + HW, cy], [cx, cy + HH]], [-1, 0, [cx, cy + HH], [cx - HW, cy]]];
        for (const [dx, dy, a, b] of edges) { const n = Sim.tile(S, t.x + dx, t.y + dy); if (n && n.t !== 'road') { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ink(ctx, 1.4); } }
      } else if (t.t === 'water') {
        diamond(ctx, cx, cy, 1, '#86c3d3');
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); const wx = cx - 8 + hash(t.x, t.y, 2) * 10, wy = cy - 2 + hash(t.x, t.y, 3) * 4; ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 3, wy - 2, wx + 7, wy); ctx.stroke();
        for (const [dx, dy, a, b] of [[0, -1, [cx - HW, cy], [cx, cy - HH]], [1, 0, [cx, cy - HH], [cx + HW, cy]], [0, 1, [cx + HW, cy], [cx, cy + HH]], [-1, 0, [cx, cy + HH], [cx - HW, cy]]]) { const n = Sim.tile(S, t.x + dx, t.y + dy); if (n && n.t !== 'water') { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ink(ctx, 1.4); } }
      } else if (t.t === 'mount') {
        diamond(ctx, cx, cy, 1, winter ? '#f6f1f1' : (hash(t.x, t.y) < 0.5 ? '#8ea760' : '#86a05a'));
      } else {
        const developed = t.b && t.b.k !== 'park';
        if (developed || Sim.HOODS[t.h].kind === 'off') {
          diamond(ctx, cx, cy, 1, winter ? '#f6eeec' : PAVE);
          ctx.save(); diamondPath(ctx, cx, cy, 1); ctx.clip(); ctx.strokeStyle = 'rgba(94,31,43,0.18)'; ctx.lineWidth = 0.7;
          for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 8 - 30, cy + i * 4 + 15); ctx.lineTo(cx + i * 8 + 30, cy + i * 4 - 15); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + i * 8 - 30, cy - i * 4 - 15); ctx.lineTo(cx + i * 8 + 30, cy - i * 4 + 15); ctx.stroke(); }
          ctx.restore();
        } else {
          diamond(ctx, cx, cy, 1, hash(t.x, t.y) < 0.5 ? GRASS[season] : GRASS2[season]);
          ctx.strokeStyle = 'rgba(94,31,43,0.35)'; ctx.lineWidth = 0.8;
          for (let i = 0; i < 3; i++) { const gx = cx - 12 + hash(t.x, t.y, 10 + i) * 24, gy = cy - 5 + hash(t.x, t.y, 20 + i) * 10; ctx.beginPath(); ctx.moveTo(gx - 1.5, gy); ctx.lineTo(gx - 0.5, gy - 2.5); ctx.moveTo(gx + 0.5, gy); ctx.lineTo(gx + 1.5, gy - 2.5); ctx.stroke(); }
        }
      }
    }
    // 산: 등고선
    for (const t of S.tiles) if (t.t === 'mount') {
      const p = iso(t.x, t.y), cx = p.x + this.gox, cy = p.y + this.goy;
      const dd = Math.hypot(t.x - 31.5, t.y - 0.5);
      if (dd > 3) { ctx.beginPath(); ctx.ellipse(cx, cy, 10, 5, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.strokeStyle = 'rgba(94,31,43,0.35)'; ctx.lineWidth = 1; ctx.stroke(); }
    }
  };

  // ---------- 건물 ----------
  R.drawBuilding = function (ctx, t, cx, cy, season, night) {
    const S = this.S, b = t.b, k = b.k;
    const hv = hash(t.x, t.y, 7), ci = Math.floor(hv * WALLS.length);
    const snow = season === 'winter';
    const lit = night > 0.3 ? 0.55 : 0;
    const glass = '#dcdcf4';
    if (k === 'res') {
      const h = 13 + b.lv * 8, s = 0.6 + Math.min(b.lv, 4) * 0.045;
      const wall = WALLS[ci];
      shadow(ctx, cx, cy, s); box(ctx, cx, cy, s, h, wall);
      windows(ctx, cx, cy, s, h, Math.min(3, b.lv), 2, 'L', glass, lit, t.x * 31 + t.y);
      windows(ctx, cx, cy, s, h, Math.min(3, b.lv), 1, 'R', glass, lit, t.y * 17 + t.x);
      faceQuad(ctx, cx, cy, s, 'R', 0.55, 0.85, 0, h / Math.max(2, b.lv) * 0.8, shade(wall, -0.35));
      if (b.lv <= 2) pyramid(ctx, cx, cy, s, h, 13, snow ? '#fbf7f7' : ROOFS[ci % ROOFS.length]);
      else { ledge(ctx, cx, cy, s, h, snow ? '#fbf7f7' : shade(wall, 0.25)); if (hash(t.x, t.y, 41) < 0.12) this.pigeon(ctx, cx + 4, cy - h - 3, t.x); }
    } else if (k === 'off') {
      const h = 28 + b.lv * 17, s = 0.7;
      const wall = ['#a99bd9', '#9ea7de', '#e9d6d0', '#e58ba3'][ci % 4];
      shadow(ctx, cx, cy, s); box(ctx, cx, cy, s, h, wall);
      const offLit = night > 0.3 && this.hourF < 22 ? 0.5 : night > 0.3 ? 0.08 : 0;
      windows(ctx, cx, cy, s, h, 2 + b.lv * 2, 3, 'L', glass, offLit, t.x * 13 + t.y);
      windows(ctx, cx, cy, s, h, 2 + b.lv * 2, 3, 'R', glass, offLit, t.y * 11 + t.x);
      ledge(ctx, cx, cy, s, h, snow ? '#fbf7f7' : shade(wall, 0.3));
      if (hash(t.x, t.y, 43) < 0.1) this.pigeon(ctx, cx - 6, cy - h - 4, t.y);
    } else if (k === 'uni') {
      const h = 20 + b.lv * 9, s = 0.78;
      shadow(ctx, cx, cy, s); box(ctx, cx, cy, s, h, '#d9785f');
      windows(ctx, cx, cy, s, h, 1 + b.lv, 3, 'L', '#f6ead6', lit * 0.6, t.x);
      windows(ctx, cx, cy, s, h, 1 + b.lv, 3, 'R', '#f6ead6', lit * 0.6, t.y);
      ledge(ctx, cx, cy, s, h, snow ? '#fbf7f7' : '#efd2c6');
    } else if (k === 'tour') {
      const h = 18 + b.lv * 10, s = 0.74;
      const wall = ['#f2d36b', '#8fb38a', '#f0b6a8'][ci % 3];
      shadow(ctx, cx, cy, s); box(ctx, cx, cy, s, h, wall);
      windows(ctx, cx, cy, s, h, 1 + b.lv, 3, 'L', glass, lit, t.x * 7);
      windows(ctx, cx, cy, s, h, 1 + b.lv, 2, 'R', glass, lit, t.y * 7);
      pyramid(ctx, cx, cy, s, h, 11, snow ? '#fbf7f7' : '#5f9e93');
    } else if (k === 'park') {
      diamond(ctx, cx, cy, 0.95, snow ? '#f6f1f1' : '#a9bd6e', LW);
      ctx.beginPath(); ctx.ellipse(cx, cy, 11, 5.5, 0, 0, 7); ctx.fillStyle = PAVE; ctx.fill(); ink(ctx);
      ctx.beginPath(); ctx.ellipse(cx, cy, 6.5, 3.2, 0, 0, 7); ctx.fillStyle = '#86c3d3'; ctx.fill(); ink(ctx, 1);
      const jet = REDUCED ? 0 : Math.sin(this.t / 300) * 1.5;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx, cy - 1); ctx.lineTo(cx, cy - 8 - jet); ctx.stroke();
      this.bench(ctx, cx + 14, cy + 4);
      drawTree(ctx, cx - 18, cy - 1, season, 1); drawTree(ctx, cx + 4, cy - 10, season, 2);
    } else if (k === 'bus') {
      ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx - 12, cy - 18); ctx.moveTo(cx + 10, cy + 3); ctx.lineTo(cx + 10, cy - 14); ink(ctx, 1.8);
      poly(ctx, [[cx - 15, cy - 19], [cx + 15, cy - 14], [cx + 15, cy - 11], [cx - 15, cy - 16]], '#9ea7de');
      ctx.beginPath(); ctx.arc(cx + 17, cy - 22, 4, 0, 7); ctx.fillStyle = '#e3a63c'; ctx.fill(); ink(ctx, 1);
      this.bench(ctx, cx - 2, cy - 2);
    } else if (k === 'lm') {
      this.drawLandmark(ctx, b.kind, cx, cy, season, night);
    } else if (k === 'store') {
      const st = S.stores.find(s => s.id === b.id); if (st) this.drawStore(ctx, st, cx, cy, season, night);
    } else if (k === 'fac') {
      const f = S.facs.find(x => x.id === b.id); if (f) this.drawFac(ctx, f, cx, cy, season, night);
    }
  };

  R.pigeon = function (ctx, x, y, seed) {
    const bob = REDUCED ? 0 : (Math.sin(this.t / 400 + seed) > 0.85 ? -1.5 : 0);
    ctx.beginPath(); ctx.ellipse(x, y + bob, 3, 2, 0, 0, 7); ctx.fillStyle = '#ece8ee'; ctx.fill(); ink(ctx, 0.8);
    ctx.beginPath(); ctx.arc(x + 2.6, y - 1.6 + bob, 1.4, 0, 7); ctx.fill(); ink(ctx, 0.7);
  };
  R.bench = function (ctx, x, y) {
    poly(ctx, [[x - 6, y - 4], [x + 2, y], [x + 2, y - 2], [x - 6, y - 6]], '#e58ba3', 1);
    ctx.beginPath(); ctx.moveTo(x - 5, y - 4); ctx.lineTo(x - 5, y - 1); ctx.moveTo(x + 1, y - 1); ctx.lineTo(x + 1, y + 2); ink(ctx, 1);
  };

  R.drawLandmark = function (ctx, kind, cx, cy, season, night) {
    const snow = season === 'winter';
    if (kind === 'cityhall') {
      shadow(ctx, cx, cy, 0.95);
      const e = box(ctx, cx, cy, 0.92, 34, '#efe2d0', null);
      for (let i = 0; i < 5; i++) faceQuad(ctx, cx, cy, 0.92, 'L', 0.1 + i * 0.18, 0.16 + i * 0.18, 0, 26, '#fbf3e6');
      windows(ctx, cx, cy, 0.92, 30, 2, 4, 'R', '#dcdcf4', night > 0.3 ? 0.5 : 0, 5);
      ledge(ctx, cx, cy, 0.92, 34, snow ? '#fbf7f7' : '#e3a63c');
      box(ctx, cx, cy - 6, 0.32, 26, '#efe2d0', '#e3a63c');
      ctx.beginPath(); ctx.arc(cx, cy - 6 - 34, 8, Math.PI, 0); ctx.fillStyle = '#e3a63c'; ctx.fill(); ink(ctx);
      ctx.beginPath(); ctx.arc(cx - 4, cy - 22, 3.5, 0, 7); ctx.fillStyle = '#fff8ee'; ctx.fill(); ink(ctx, 1);
      ctx.beginPath(); ctx.moveTo(cx, cy - 46); ctx.lineTo(cx, cy - 58); ink(ctx, 1.2); poly(ctx, [[cx, cy - 58], [cx + 9, cy - 55], [cx, cy - 52]], '#e46b5f', 1);
      void e;
    } else if (kind === 'museum') {
      shadow(ctx, cx, cy, 0.9);
      box(ctx, cx, cy, 0.88, 30, '#e46b5f');
      ctx.beginPath(); ctx.arc(cx - 15, cy - 17, 7, 0, 7); ctx.fillStyle = '#dcdcf4'; ctx.fill(); ink(ctx);
      ctx.beginPath(); ctx.moveTo(cx - 22, cy - 17); ctx.lineTo(cx - 8, cy - 17); ctx.moveTo(cx - 15, cy - 24); ctx.lineTo(cx - 15, cy - 10); ink(ctx, 0.9);
      faceQuad(ctx, cx, cy, 0.88, 'R', 0.2, 0.45, 4, 26, '#f2d36b');
      faceQuad(ctx, cx, cy, 0.88, 'R', 0.6, 0.8, 0, 12, '#5e1f2b');
      ledge(ctx, cx, cy, 0.88, 30, snow ? '#fbf7f7' : '#f0b6a8');
    } else if (kind === 'univ') {
      shadow(ctx, cx, cy, 0.95);
      box(ctx, cx, cy, 0.92, 28, '#c86a55');
      windows(ctx, cx, cy, 0.92, 26, 2, 4, 'L', '#f6ead6', night > 0.3 ? 0.4 : 0, 3);
      windows(ctx, cx, cy, 0.92, 26, 2, 3, 'R', '#f6ead6', night > 0.3 ? 0.4 : 0, 4);
      ledge(ctx, cx, cy, 0.92, 28, snow ? '#fbf7f7' : '#efd2c6');
      box(ctx, cx + 6, cy - 2, 0.25, 30, '#c86a55', '#efd2c6');
      pyramid(ctx, cx + 6, cy - 2 - 28, 0.25, 30, 14, '#6f8fb5');
      ctx.beginPath(); ctx.arc(cx + 3, cy - 46, 3, 0, 7); ctx.fillStyle = '#fff8ee'; ctx.fill(); ink(ctx, 1);
    } else if (kind === 'market') {
      for (let i = 0; i < 3; i++) {
        const x = cx - 16 + i * 14, y = cy - 4 + i * 4;
        poly(ctx, [[x - 8, y], [x + 6, y + 5], [x + 6, y - 6], [x - 8, y - 11]], '#efe2d0', 1);
        for (let j = 0; j < 4; j++) poly(ctx, [[x - 9 + j * 3.6, y - 11 + j * 1.3], [x - 5.4 + j * 3.6, y - 9.7 + j * 1.3], [x - 5.4 + j * 3.6, y - 14.7 + j * 1.3], [x - 9 + j * 3.6, y - 16 + j * 1.3]], j % 2 ? '#fff8ee' : '#e46b5f', 0.9);
        ctx.beginPath(); for (let j = 0; j < 4; j++) { ctx.arc(x - 6 + j * 3, y - 2 + j, 1.6, 0, 7); } ctx.fillStyle = ['#e3a63c', '#8fb38a', '#e46b5f'][i]; ctx.fill(); ink(ctx, 0.7);
      }
      signBoard(ctx, cx, cy - 26, 30, 9, '#fff8ee', '전통시장');
    } else if (kind === 'tower') {
      ctx.beginPath(); ctx.moveTo(cx - 5, cy); ctx.lineTo(cx - 1.5, cy - 58); ctx.lineTo(cx + 1.5, cy - 58); ctx.lineTo(cx + 5, cy); ctx.closePath(); ctx.fillStyle = '#a99bd9'; ctx.fill(); ink(ctx);
      ctx.beginPath(); ctx.ellipse(cx, cy - 52, 9, 5, 0, 0, 7); ctx.fillStyle = '#e58ba3'; ctx.fill(); ink(ctx);
      ctx.beginPath(); ctx.moveTo(cx, cy - 57); ctx.lineTo(cx, cy - 72); ink(ctx, 1.2);
      if (night > 0.3) this._glows.push({ x: cx, y: cy - 72, r: 14, a: 0.9, c: '255,120,120' });
    }
  };

  R.drawStore = function (ctx, st, cx, cy, season, night) {
    const S = this.S, comp = S.companies[st.owner];
    const snow = season === 'winter';
    const arch = st.owned ? st.arch : 'basic';
    const A = Sim.ARCH[arch];
    const floors = st.owned ? 2 : 1;
    const h = (19 + st.size * 5) * (floors === 2 ? 1.55 : 1), s = 0.68 + st.size * 0.06;
    const open = this.hourF >= st.open && this.hourF < st.close;
    const wallCol = arch === 'basic' ? shade(comp.color, 0.55) : A.wall;
    shadow(ctx, cx, cy, s);
    const e = box(ctx, cx, cy, s, h, wallCol);
    if (arch === 'brick') { ctx.strokeStyle = 'rgba(94,31,43,0.35)'; ctx.lineWidth = 0.6; for (let i = 1; i < 9; i++) for (const side of ['L', 'R']) { const v = h * i / 9; const sx = side === 'L' ? -HW * s : HW * s; ctx.beginPath(); ctx.moveTo(cx + sx, cy - v); ctx.lineTo(cx, cy + HH * s - v); ctx.stroke(); } }
    if (arch === 'glass' || arch === 'greenhouse' || arch === 'container') {
      const n = arch === 'container' ? 12 : 6;
      ctx.strokeStyle = arch === 'container' ? 'rgba(94,31,43,0.3)' : INK; ctx.lineWidth = arch === 'container' ? 0.8 : 0.8;
      for (let i = 1; i < n; i++) for (const side of ['L', 'R']) { const u = i / n; const p0 = side === 'L' ? e.l : e.b, p1 = side === 'L' ? e.b : e.r; const x = p0.x + (p1.x - p0.x) * u, y = p0.y + (p1.y - p0.y) * u; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke(); }
    }
    if (arch === 'hanok') {
      const ov = s * 1.25, rh = 13, top = cy - h;
      ctx.beginPath(); ctx.moveTo(cx - HW * ov - 4, top - 5); ctx.quadraticCurveTo(cx - HW * ov * 0.5, top + HH * ov * 0.5 + 2, cx, top + HH * ov); ctx.lineTo(cx, top - rh); ctx.closePath(); ctx.fillStyle = snow ? '#fbf7f7' : A.roof; ctx.fill(); ink(ctx);
      ctx.beginPath(); ctx.moveTo(cx, top + HH * ov); ctx.quadraticCurveTo(cx + HW * ov * 0.5, top + HH * ov * 0.5 + 2, cx + HW * ov + 4, top - 5); ctx.lineTo(cx, top - rh); ctx.closePath(); ctx.fillStyle = snow ? '#efe9ea' : shade(A.roof, -0.2); ctx.fill(); ink(ctx);
    } else if (A.roof && arch !== 'greenhouse') pyramid(ctx, cx, cy, s, h, arch === 'european' ? 20 : 12, snow ? '#fbf7f7' : A.roof);
    else if (arch === 'greenhouse') pyramid(ctx, cx, cy, s, h, 16, snow ? '#fbf7f7' : '#cfe7d2');
    else ledge(ctx, cx, cy, s, h, snow ? '#fbf7f7' : shade(wallCol, -0.12));
    // 1층 진열창과 문
    const fh = floors === 2 ? h * 0.42 : h * 0.62;
    const glow = night > 0.3 && open;
    faceQuad(ctx, cx, cy, s, 'L', 0.12, 0.62, 3, fh * 0.78, glow ? '#ffe2a0' : '#dcdcf4');
    faceQuad(ctx, cx, cy, s, 'L', 0.7, 0.9, 0, fh * 0.8, shade(comp.color, -0.2));
    faceQuad(ctx, cx, cy, s, 'R', 0.15, 0.85, 3, fh * 0.78, glow ? '#ffd88a' : '#d0d2ee');
    if (floors === 2) { const f2 = night > 0.3 && hash(st.id, 3) < 0.6 ? '#ffd98a' : '#dcdcf4'; faceQuad(ctx, cx, cy, s, 'L', 0.2, 0.45, h * 0.6, h * 0.82, f2); faceQuad(ctx, cx, cy, s, 'L', 0.55, 0.8, h * 0.6, h * 0.82, f2); faceQuad(ctx, cx, cy, s, 'R', 0.3, 0.7, h * 0.6, h * 0.82, f2); }
    // 물결 차양
    for (const side of ['L', 'R']) {
      const p0 = side === 'L' ? e.l : e.b, p1 = side === 'L' ? e.b : e.r, n = 6, d = side === 'L' ? -3 : 3, ay = fh + 1;
      for (let i = 0; i < n; i++) {
        const u0 = i / n, u1 = (i + 1) / n;
        const ax = p0.x + (p1.x - p0.x) * u0, ayy = p0.y + (p1.y - p0.y) * u0, bx = p0.x + (p1.x - p0.x) * u1, by = p0.y + (p1.y - p0.y) * u1;
        ctx.beginPath(); ctx.moveTo(ax, ayy - ay - 6); ctx.lineTo(bx, by - ay - 6); ctx.lineTo(bx + d, by - ay + 1);
        ctx.quadraticCurveTo((ax + bx) / 2 + d, (ayy + by) / 2 - ay + 4.5, ax + d, ayy - ay + 1); ctx.closePath();
        ctx.fillStyle = i % 2 ? '#fff8ee' : comp.color; ctx.fill(); ink(ctx, 0.9);
      }
    }
    // 화분
    ctx.beginPath(); ctx.rect(e.b.x + 6, e.b.y - 6, 4, 4); ctx.fillStyle = '#d9785f'; ctx.fill(); ink(ctx, 0.8);
    ctx.beginPath(); ctx.arc(e.b.x + 8, e.b.y - 9, 3.4, 0, 7); ctx.fillStyle = '#8fb38a'; ctx.fill(); ink(ctx, 0.8);
    // 간판: 업종 아이콘 + 로고
    const roofTop = A.roof ? (arch === 'hanok' ? 13 : arch === 'european' ? 20 : 12) : arch === 'greenhouse' ? 16 : 3;
    const sy = cy - h - roofTop - 10;
    signBoard(ctx, cx + 1, sy, 30, 15, '#fff8ee');
    ctx.font = `10px ${EMOJI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(Sim.CATS[st.cat].icon, cx - 6, sy + 1);
    drawLogo(ctx, comp, cx + 8, sy + 0.5, 5.2);
    if (st.franchise) { ctx.fillStyle = INK; ctx.font = '7px "Jua",sans-serif'; ctx.fillText('가맹', cx + 1, sy - 12); }
    if (!open) { ctx.fillStyle = INK; ctx.font = '7px "Jua",sans-serif'; ctx.fillText('CLOSED', e.l.x + 14, e.l.y - 2); }
    if (['cafe', 'noodle', 'hansik', 'japanese', 'chinese', 'snack', 'chicken'].includes(st.cat) && !REDUCED && open && st.served > 0) this.steam(ctx, cx + 12, cy - h - roofTop, st.id);
    if (open && st.delivery && Sim.CATS[st.cat].dlv > 0 && !REDUCED) { const ph = (this.t / 3000 + st.id * 0.3) % 1; if (ph < 0.5) this.scooter(ctx, e.r.x + 4 + ph * 30, e.r.y + 4 - ph * 15, comp.color); }
    if (glow) this._glows.push({ x: cx, y: cy - h * 0.25, r: 34, a: 0.55 });
  };
  R.scooter = function (ctx, x, y, col) {
    ctx.beginPath(); ctx.arc(x - 3, y, 1.8, 0, 7); ctx.arc(x + 3, y + 1.5, 1.8, 0, 7); ctx.fillStyle = '#3b2228'; ctx.fill();
    poly(ctx, [[x - 4, y - 1], [x + 4, y + 1], [x + 3, y - 3], [x - 3, y - 5]], col, 0.8);
    walker(ctx, x, y - 2, '#fff8ee', '#3b2228', 0);
    ctx.beginPath(); ctx.rect(x - 5, y - 9, 4, 4); ctx.fillStyle = col; ctx.fill(); ink(ctx, 0.7);
  };

  R.drawFac = function (ctx, f, cx, cy, season, night) {
    const S = this.S, comp = S.companies[f.owner], snow = season === 'winter', s = 0.88;
    shadow(ctx, cx, cy, s);
    let h = 20;
    if (f.kind === 'warehouse') {
      h = 16 + f.level * 4;
      const e = box(ctx, cx, cy, s, h, '#efe2d0', snow ? '#fbf7f7' : '#d9c3a3');
      faceQuad(ctx, cx, cy, s, 'R', 0.2, 0.75, 0, h * 0.7, '#c9b39a');
      for (let i = 1; i < 5; i++) faceQuad(ctx, cx, cy, s, 'R', 0.2, 0.75, h * 0.14 * i, h * 0.14 * i, null, 0.6);
      void e;
    } else if (f.kind === 'kitchen' || f.kind === 'roastery') {
      h = 22 + (f.level || 1) * 4;
      box(ctx, cx, cy, s, h, f.kind === 'kitchen' ? '#f0b6a8' : '#c9a27e', snow ? '#fbf7f7' : null);
      windows(ctx, cx, cy, s, h, 1, 3, 'L', '#dcdcf4', 0, 2);
      ctx.beginPath(); ctx.rect(cx + 10, cy - h - 16, 6, 16); ctx.fillStyle = '#d9785f'; ctx.fill(); ink(ctx);
      if (!REDUCED) this.steam(ctx, cx + 13, cy - h - 16, f.id, true);
    } else if (f.kind === 'hq') {
      h = 70;
      box(ctx, cx, cy, 0.8, h, shade(comp.color, 0.35));
      windows(ctx, cx, cy, 0.8, h - 10, 6, 3, 'L', '#dcdcf4', night > 0.3 ? 0.6 : 0, f.id);
      windows(ctx, cx, cy, 0.8, h - 10, 6, 3, 'R', '#dcdcf4', night > 0.3 ? 0.6 : 0, f.id + 3);
      ledge(ctx, cx, cy, 0.8, h, snow ? '#fbf7f7' : comp.color);
      faceQuad(ctx, cx, cy, 0.8, 'L', 0.3, 0.7, h - 9, h - 2, comp.color);
      drawLogo(ctx, comp, cx, cy - h - 14, 9);
    } else if (f.kind === 'factory') {
      h = 20 + f.level * 3;
      const e = box(ctx, cx, cy, s, h, '#e9d6d0', null);
      for (let i = 0; i < 3; i++) { const x0 = e.l.x + i * 9, y0 = e.l.y - h + i * 4.5; poly(ctx, [[x0, y0], [x0 + 9, y0 + 4.5], [x0 + 9, y0 - 6], [x0, y0 - 1.5]], snow ? '#fbf7f7' : '#9ea7de', 1); }
      ctx.beginPath(); ctx.rect(cx + 12, cy - h - 24, 5, 24); ctx.fillStyle = '#c94f6d'; ctx.fill(); ink(ctx);
      if (!REDUCED) this.steam(ctx, cx + 14, cy - h - 24, f.id, true);
      faceQuad(ctx, cx, cy, s, 'R', 0.25, 0.6, 0, h * 0.6, '#c9b39a');
    } else if (f.kind === 'rental') {
      h = 50 + f.level * 14;
      const wall = ['#e58ba3', '#a99bd9', '#f2d36b'][f.id % 3];
      box(ctx, cx, cy, 0.78, h, wall);
      windows(ctx, cx, cy, 0.78, h, 5 + f.level * 2, 3, 'L', '#dcdcf4', night > 0.3 ? 0.55 : 0, f.id);
      windows(ctx, cx, cy, 0.78, h, 5 + f.level * 2, 2, 'R', '#dcdcf4', night > 0.3 ? 0.55 : 0, f.id + 9);
      ledge(ctx, cx, cy, 0.78, h, snow ? '#fbf7f7' : shade(wall, 0.3));
      drawLogo(ctx, comp, cx, cy - h - 10, 6);
      if (hash(f.id, 2) < 0.4) this.pigeon(ctx, cx + 6, cy - h - 3, f.id);
    } else if (f.kind === 'smartfarm') {
      for (let i = 0; i < 2; i++) {
        const ox = cx - 8 + i * 14, oy = cy - 2 + i * 6;
        poly(ctx, [[ox - 14, oy], [ox + 6, oy + 9], [ox + 6, oy - 3], [ox - 14, oy - 12]], 'rgba(207,231,210,0.9)', 1);
        ctx.beginPath(); ctx.moveTo(ox - 14, oy - 12); ctx.quadraticCurveTo(ox - 4, oy - 22, ox + 6, oy - 3); ink(ctx, 1);
        for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(ox - 10 + j * 4.5, oy - 3 + j * 2, 1.8, 0, 7); ctx.fillStyle = '#6f8f55'; ctx.fill(); }
      }
      h = 14;
    }
    if (f.kind !== 'hq' && f.kind !== 'rental') {
      ctx.font = `11px ${EMOJI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      signBoard(ctx, cx - 4, cy - h - 12, 26, 13, '#fff8ee');
      ctx.fillText(Sim.FAC[f.kind].icon, cx - 10, cy - h - 11);
      drawLogo(ctx, comp, cx + 4, cy - h - 12, 4.6);
    }
  };

  R.steam = function (ctx, x, y, seed, big) {
    for (let i = 0; i < 3; i++) {
      const ph = ((this.t / 1400) + i / 3 + seed * 0.13) % 1;
      ctx.beginPath(); ctx.arc(x + Math.sin(ph * 6 + seed) * 3, y - ph * (big ? 22 : 14), (big ? 3 : 2) + ph * (big ? 5 : 3), 0, 7);
      ctx.fillStyle = `rgba(255,252,248,${0.85 * (1 - ph)})`; ctx.fill();
      ctx.strokeStyle = `rgba(94,31,43,${0.35 * (1 - ph)})`; ctx.lineWidth = 0.7; ctx.stroke();
    }
  };
  R.drawStation = function (ctx, s2) {
    const p = iso(s2.x, s2.y), x = p.x + 18, y = p.y - 6;
    poly(ctx, [[x - 9, y], [x + 1, y + 5], [x + 1, y - 3], [x - 9, y - 8]], '#5c9c7a', 1.1);
    poly(ctx, [[x - 10, y - 8], [x + 2, y - 2], [x + 4, y - 4], [x - 8, y - 10]], '#e9d6d0', 1);
    ctx.beginPath(); ctx.moveTo(x + 5, y + 4); ctx.lineTo(x + 5, y - 16); ink(ctx, 1.4);
    ctx.beginPath(); ctx.arc(x + 5, y - 19, 4.5, 0, 7); ctx.fillStyle = '#5c9c7a'; ctx.fill(); ink(ctx, 1);
    ctx.fillStyle = '#fff8ee'; ctx.font = '6.5px "Jua",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('M', x + 5, y - 18.6);
    if (this.cam.z >= 0.75) { ctx.font = '8px "Jua",sans-serif'; const w = ctx.measureText(s2.name).width + 8; signBoard(ctx, x + 5, y - 30, w, 11, '#fff8ee', s2.name); }
  };
  R.drawLamp = function (ctx, x, y, night) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 24); ctx.quadraticCurveTo(x, y - 28, x + 4, y - 28); ink(ctx, 1.5);
    ctx.beginPath(); ctx.arc(x + 5, y - 27, 2.4, 0, 7); ctx.fillStyle = night > 0.3 ? '#ffe7a6' : '#f2d36b'; ctx.fill(); ink(ctx, 0.9);
    if (night > 0.2) this._glows.push({ x: x + 5, y: y - 20, r: 28, a: 0.45 });
  };

  // ---------- 이동체 ----------
  function nearestRoad(S, x, y) {
    for (let r = 1; r < 6; r++) for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) if (Math.abs(dx) + Math.abs(dy) === r && roadAt(S, x + dx, y + dy)) return { x: x + dx, y: y + dy };
    return null;
  }
  R.path = function (a, b) {
    const S = this.S, key = `${a.x},${a.y}>${b.x},${b.y}`;
    if (this.pathCache.has(key)) return this.pathCache.get(key);
    const s = nearestRoad(S, a.x, a.y), e = nearestRoad(S, b.x, b.y);
    if (!s || !e) return null;
    const prev = new Map(), q = [s], k = p => p.x + ',' + p.y; prev.set(k(s), null);
    while (q.length) {
      const c = q.shift(); if (c.x === e.x && c.y === e.y) break;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = { x: c.x + dx, y: c.y + dy };
        if (!roadAt(S, n.x, n.y) || prev.has(k(n))) continue;
        prev.set(k(n), c); q.push(n);
      }
    }
    if (!prev.has(k(e))) return null;
    const out = []; let c = e; while (c) { out.unshift(c); c = prev.get(k(c)); }
    if (this.pathCache.size > 400) this.pathCache.clear();
    this.pathCache.set(key, out);
    return out;
  };
  R.onStep = function (ev) {
    for (const m of ev.money.slice(0, 10)) this.floaters.push({ x: m.x, y: m.y, v: m.v, t: 0 });
    for (const tr of ev.trucks.slice(0, 12)) { const p = this.path(tr.from, tr.to); if (p && p.length > 1) this.trucks.push({ p, i: 0, f: 0, color: tr.color }); }
    if (this.trucks.length > 30) this.trucks.splice(0, this.trucks.length - 30);
    if (this.floaters.length > 40) this.floaters.splice(0, this.floaters.length - 40);
  };
  const ACTIVITY = [0.1, 0.05, 0.03, 0.03, 0.03, 0.08, 0.2, 0.5, 0.8, 0.7, 0.7, 0.85, 1, 0.95, 0.8, 0.8, 0.85, 0.9, 1, 0.9, 0.7, 0.5, 0.35, 0.2];
  function stepMover(S, w, dt, sp) {
    w.f += dt / 1000 * w.sp * sp;
    if (w.f >= 1) {
      w.x = w.tx; w.y = w.ty; w.f = 0;
      const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => roadAt(S, w.x + dx, w.y + dy));
      const fwd = opts.filter(([dx, dy]) => dx === w.dx && dy === w.dy);
      const back = opts.filter(([dx, dy]) => !(w.x + dx === w.px && w.y + dy === w.py));
      const L = w.car && fwd.length && Math.random() < 0.7 ? fwd : (back.length ? back : opts);
      const pk = L[Math.floor(Math.random() * L.length)];
      w.px = w.x; w.py = w.y;
      if (pk) { w.tx = w.x + pk[0]; w.ty = w.y + pk[1]; w.dx = pk[0]; w.dy = pk[1]; }
    }
  }
  R.updateMovers = function (dt, speed) {
    const S = this.S;
    const act = ACTIVITY[Math.floor(this.hourF) % 24] * (S.weather && (S.weather.kind === 'rain' || S.weather.kind === 'snow') ? 0.6 : 1);
    const want = REDUCED ? 0 : Math.min(170, Math.round(Sim.population(S) / 190 * act));
    const wantCars = REDUCED ? 0 : Math.round(26 * act);
    const roads = this._roads || (this._roads = S.tiles.filter(t => t.t === 'road'));
    while (this.walkers.length < want) { const t = roads[Math.floor(Math.random() * roads.length)]; this.walkers.push({ x: t.x, y: t.y, tx: t.x, ty: t.y, f: 1, side: Math.random() < 0.5 ? -1 : 1, c: SHIRTS[Math.floor(Math.random() * SHIRTS.length)], hair: HAIR[Math.floor(Math.random() * HAIR.length)], sp: 0.5 + Math.random() * 0.4, umb: Math.random() < 0.8, dog: Math.random() < 0.06 }); }
    if (this.walkers.length > want) this.walkers.length = want;
    while (this.cars.length < wantCars) { const t = roads[Math.floor(Math.random() * roads.length)]; this.cars.push({ car: true, x: t.x, y: t.y, tx: t.x, ty: t.y, f: 1, c: CARS[Math.floor(Math.random() * CARS.length)], sp: 1.4 + Math.random() * 0.8, taxi: Math.random() < 0.15 }); }
    if (this.cars.length > wantCars) this.cars.length = wantCars;
    const sp = Math.min(2, Math.max(0.6, speed || 1));
    for (const w of this.walkers) stepMover(S, w, dt, sp);
    for (const c of this.cars) stepMover(S, c, dt, sp);
    for (const tr of this.trucks) { tr.f += dt / 1000 * 3 * Math.min(3, speed || 1); while (tr.f >= 1) { tr.f -= 1; tr.i++; } }
    this.trucks = this.trucks.filter(tr => tr.i < tr.p.length - 1);
    for (const f of this.floaters) f.t += dt;
    this.floaters = this.floaters.filter(f => f.t < 1800);
  };
  function drawCar(ctx, x, y, dx, dy, col, taxi) {
    const along = dx !== 0 ? 'x' : 'y';
    const s = 0.24, sy = 0.14;
    ctx.save(); ctx.translate(x, y);
    // 진행 방향에 맞춰 차체를 늘림
    const L = along === 'x' ? [HW * s, HH * s] : [-HW * s, HH * s];
    const Wd = along === 'x' ? [-HW * sy, HH * sy] : [HW * sy, HH * sy];
    const P = (a, b, h) => [L[0] * a + Wd[0] * b, L[1] * a + Wd[1] * b - h];
    const pts = (h) => [P(-1, -1, h), P(1, -1, h), P(1, 1, h), P(-1, 1, h)];
    ctx.fillStyle = 'rgba(94,31,43,0.15)'; ctx.beginPath(); ctx.ellipse(1, 2, 9, 4.5, 0, 0, 7); ctx.fill();
    const b0 = pts(2), b1 = pts(7);
    // 옆면
    poly(ctx, [b0[3], b0[2], b1[2], b1[3]], shade(col, -0.1), 1);
    poly(ctx, [b0[2], b0[1], b1[1], b1[2]], shade(col, -0.22), 1);
    poly(ctx, b1, col, 1);
    const c1 = [P(-0.45, -0.85, 7), P(0.55, -0.85, 7), P(0.55, 0.85, 7), P(-0.45, 0.85, 7)];
    const c2 = c1.map(p => [p[0], p[1] - 4]);
    poly(ctx, [c1[3], c1[2], c2[2], c2[3]], '#dcdcf4', 0.9);
    poly(ctx, [c1[2], c1[1], c2[1], c2[2]], '#c8cbea', 0.9);
    poly(ctx, c2, col, 0.9);
    if (taxi) { const tp = P(0, 0, 13); ctx.beginPath(); ctx.rect(tp[0] - 2, tp[1] - 2, 4, 2.4); ctx.fillStyle = '#fff8ee'; ctx.fill(); ink(ctx, 0.7); }
    ctx.restore();
  }

  // ---------- 도시 그리기 ----------
  R.draw = function (dt, speed) {
    const S = this.S; if (!S) return;
    this.t += dt; this._glows = [];
    this.updateMovers(dt, speed);
    this.buildGround();
    const ctx = this.ctx, z = this.cam.z, dpr = this.dpr;
    const season = Sim.seasonOf(S);
    const hf = this.hourF, night = darkness(hf), dusk = duskTint(hf);
    const wk = S.weather ? S.weather.kind : 'sun';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const BG = { spring: '#f3ddd6', summer: '#ecdcd2', autumn: '#f1dccb', winter: '#ece4ea' }[season];
    ctx.fillStyle = BG; ctx.fillRect(0, 0, this.w, this.h);

    ctx.setTransform(z * dpr, 0, 0, z * dpr, (this.w / 2 - this.cam.x * z) * dpr, (this.h / 2 - this.cam.y * z) * dpr);
    const L = iso(0, Sim.H - 1), B = iso(Sim.W - 1, Sim.H - 1), Rr = iso(Sim.W - 1, 0);
    poly(ctx, [[L.x - HW, L.y], [B.x, B.y + HH], [B.x, B.y + HH + 16], [L.x - HW, L.y + 16]], '#d9a98f', 1.6);
    poly(ctx, [[B.x, B.y + HH], [Rr.x + HW, Rr.y], [Rr.x + HW, Rr.y + 16], [B.x, B.y + HH + 16]], '#c48f78', 1.6);
    ctx.drawImage(this.ground, -this.gox, -this.goy, this.ground.width / 1.5, this.ground.height / 1.5);
    if (!REDUCED) {
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1;
      for (const t of S.tiles) if (t.t === 'water') {
        const p = iso(t.x, t.y), ph = (this.t / 2400 + hash(t.x, t.y, 9)) % 1;
        ctx.globalAlpha = Math.sin(ph * Math.PI); ctx.beginPath(); ctx.moveTo(p.x - 6 + ph * 6, p.y + 4 - ph * 3); ctx.quadraticCurveTo(p.x - 3 + ph * 6, p.y + 2 - ph * 3, p.x + ph * 6, p.y + 4 - ph * 3); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (this.overlay && this.overlay.type === 'logistics') this.drawLogistics(ctx);

    const items = [];
    for (const t of S.tiles) {
      if (t.b || t.tree) items.push({ d: t.x + t.y, t });
      else if (t.t === 'mount' && hash(t.x, t.y, 5) < 0.75) items.push({ d: t.x + t.y, pine: t });
      if (t.t === 'road' && t.x % Sim.ROAD_EVERY === 0 && t.y % Sim.ROAD_EVERY === 0 && (t.x + t.y) % 8 === 0) items.push({ d: t.x + t.y + 0.4, lamp: t });
    }
    for (const s2 of S.stations) items.push({ d: s2.x + s2.y + 0.5, station: s2 });
    const ovp = this.overlay && this.overlay.type === 'potential' && this.overlay.data;
    if (ovp) { const max = Math.max(1, ...ovp.map(d => d.cust)); for (const o of ovp) items.push({ d: o.x + o.y - 0.01, o, k: o.cust / max }); }
    for (const w of this.walkers) items.push({ d: w.x + (w.tx - w.x) * w.f + w.y + (w.ty - w.y) * w.f + 0.1, w });
    for (const c of this.cars) items.push({ d: c.x + (c.tx - c.x) * c.f + c.y + (c.ty - c.y) * c.f + 0.15, car: c });
    for (const tr of this.trucks) { const a = tr.p[tr.i], b = tr.p[tr.i + 1]; items.push({ d: a.x + (b.x - a.x) * tr.f + a.y + (b.y - a.y) * tr.f + 0.2, tr }); }
    items.sort((a, b) => a.d - b.d);
    const rain = wk === 'rain';
    for (const it of items) {
      if (it.t) {
        const p = iso(it.t.x, it.t.y);
        if (it.t.b) {
          const pk = this.pops && this.pops[it.t.x + ',' + it.t.y];
          if (pk != null && this.t - pk < 700) {
            const k = (this.t - pk) / 700, sy = 1 + Math.sin(k * Math.PI * 3) * 0.25 * (1 - k), sx = 1 - (sy - 1) * 0.6;
            ctx.save(); ctx.translate(p.x, p.y); ctx.scale(sx, sy); ctx.translate(-p.x, -p.y);
            this.drawBuilding(ctx, it.t, p.x, p.y, season, night); ctx.restore();
            if (k < 0.5) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * (14 + k * 40), p.y + Math.sin(a) * (7 + k * 20), 4 - k * 4, 0, 7); ctx.fillStyle = '#fff8ee'; ctx.fill(); ink(ctx, 0.8); }
          } else this.drawBuilding(ctx, it.t, p.x, p.y, season, night);
          if (it.t.b.k === 'res' && hash(it.t.x, it.t.y, 31) < 0.12 && night < 0.5) this.drawCat(ctx, p.x + 15, p.y + 7, it.t.x);
        } else {
          const k = Math.floor(hash(it.t.x, it.t.y, 4) * 10);
          drawTree(ctx, p.x - 8 + (k % 3) * 6, p.y - 2 + (k % 2) * 4, season, k);
          if (k > 5) drawTree(ctx, p.x + 12, p.y + 4, season, k + 1);
        }
      } else if (it.pine) { const p = iso(it.pine.x, it.pine.y); const k = hash(it.pine.x, it.pine.y, 8); drawPine(ctx, p.x - 6 + k * 12, p.y + 2 - k * 4, season, 0.8 + k * 0.5); if (k > 0.5) drawPine(ctx, p.x + 8, p.y + 6, season, 0.7); }
      else if (it.lamp) { const p = iso(it.lamp.x, it.lamp.y); this.drawLamp(ctx, p.x - 20, p.y - 2, night); }
      else if (it.station) this.drawStation(ctx, it.station);
      else if (it.o) {
        const p = iso(it.o.x, it.o.y), k = it.k;
        diamondPath(ctx, p.x, p.y, 0.92); ctx.fillStyle = k < 0.2 ? 'rgba(94,31,43,0.12)' : `rgba(${Math.round(150 - 70 * k)},${Math.round(185 - 10 * k)},${Math.round(110 - 30 * k)},${(0.35 + 0.45 * k).toFixed(2)})`; ctx.fill();
        if (k >= 0.2) { ctx.setLineDash([3, 3]); ink(ctx, 1); ctx.setLineDash([]); }
      } else if (it.w) {
        const w = it.w; const fx = w.x + (w.tx - w.x) * w.f, fy = w.y + (w.ty - w.y) * w.f;
        const p = iso(fx, fy); const ox = w.side * 11, oy = w.side * 3;
        const bob = REDUCED ? 0 : Math.abs(Math.sin(this.t / 140 + fx * 3)) * 1.2;
        walker(ctx, p.x + ox, p.y + oy, w.c, w.hair, bob, rain && w.umb);
        if (w.dog) { const dx = p.x + ox + 5, dy = p.y + oy + 1; ctx.beginPath(); ctx.ellipse(dx, dy - 2, 3, 1.8, 0, 0, 7); ctx.fillStyle = '#fff8ee'; ctx.fill(); ink(ctx, 0.8); ctx.beginPath(); ctx.arc(dx + 3, dy - 3.5, 1.4, 0, 7); ctx.fill(); ink(ctx, 0.7); ctx.beginPath(); ctx.moveTo(p.x + ox + 1.5, p.y + oy - 7); ctx.lineTo(dx + 2, dy - 3); ctx.strokeStyle = INK; ctx.lineWidth = 0.5; ctx.stroke(); }
      } else if (it.car) {
        const c = it.car; const fx = c.x + (c.tx - c.x) * c.f, fy = c.y + (c.ty - c.y) * c.f;
        const p = iso(fx, fy); const lane = (c.dx || 0) + (c.dy || 0) > 0 ? 1 : -1;
        const off = c.dx ? [lane * -4, lane * 6] : [lane * 9, lane * 3];
        drawCar(ctx, p.x + off[0] * 0.6, p.y + off[1] * 0.4, c.dx || 1, c.dy || 0, c.c, c.taxi);
        if (night > 0.3) this._glows.push({ x: p.x, y: p.y, r: 12, a: 0.45 });
      } else if (it.tr) {
        const tr = it.tr; const a = tr.p[tr.i], b = tr.p[tr.i + 1];
        const p = iso(a.x + (b.x - a.x) * tr.f, a.y + (b.y - a.y) * tr.f);
        ctx.save(); ctx.translate(p.x, p.y);
        box(ctx, 0, 0, 0.22, 9, '#fff8ee', shade(tr.color, 0.2));
        box(ctx, 6, 3, 0.12, 6, tr.color);
        ctx.restore();
        if (night > 0.3) this._glows.push({ x: p.x + 6, y: p.y, r: 12, a: 0.5 });
      }
    }

    if (night > 0 || dusk > 0) {
      ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (dusk > 0) { ctx.fillStyle = `rgba(240,140,110,${0.14 * dusk})`; ctx.fillRect(0, 0, this.w, this.h); }
      if (night > 0) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(70,62,120,${night})`; ctx.fillRect(0, 0, this.w, this.h); }
      ctx.restore();
      if (night > 0.2) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const g of this._glows) {
          const gr = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
          gr.addColorStop(0, `rgba(${g.c || '255,200,120'},${g.a * night})`); gr.addColorStop(1, `rgba(${g.c || '255,200,120'},0)`);
          ctx.fillStyle = gr; ctx.fillRect(g.x - g.r, g.y - g.r, g.r * 2, g.r * 2);
        }
        ctx.restore();
      }
    }
    if (wk === 'cloud' || wk === 'rain' || wk === 'snow') { ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = `rgba(110,100,130,${wk === 'cloud' ? 0.05 : 0.1})`; ctx.fillRect(0, 0, this.w, this.h); ctx.restore(); }

    if (ovp) this.drawPotentialTags(ctx, ovp);
    if (this.hover) { const p = iso(this.hover.x, this.hover.y); diamondPath(ctx, p.x, p.y, 1); ctx.setLineDash([4, 3]); ink(ctx, 1.4 / z + 0.4); ctx.setLineDash([]); }
    if (this.ghost) {
      const p = iso(this.ghost.x, this.ghost.y);
      diamondPath(ctx, p.x, p.y, 1); ctx.fillStyle = this.ghost.ok ? 'rgba(143,179,138,0.55)' : 'rgba(228,107,95,0.45)'; ctx.fill(); ink(ctx, 1.4);
      if (this.ghost.icon) { ctx.font = `18px ${EMOJI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = 0.9; ctx.fillText(this.ghost.icon, p.x, p.y - 16); ctx.globalAlpha = 1; }
    }
    if (this.sel) { const p = iso(this.sel.x, this.sel.y); diamondPath(ctx, p.x, p.y, 1.06); ctx.strokeStyle = '#e3a63c'; ctx.lineWidth = 4; ctx.stroke(); ink(ctx, 1.4); }

    if (night < 0.5) this.drawBirds(ctx, dt);
    if (!REDUCED && wk !== 'rain' && wk !== 'snow') {
      for (const c of this.clouds) {
        c.x += dt * 0.006; if (c.x > 1400) c.x = -1400;
        ctx.globalAlpha = 0.85 * (1 - night * 0.7);
        ctx.beginPath(); for (let i = 0; i < 4; i++) { const ex = c.x + i * 22 * c.s, ey = c.y - 120 + Math.sin(i) * 6; ctx.moveTo(ex + 26 * c.s, ey); ctx.ellipse(ex, ey, 26 * c.s, 13 * c.s, 0, 0, 7); }
        ink(ctx, 2.6); ctx.fillStyle = '#fff8f4'; ctx.fill(); ctx.globalAlpha = 1;
      }
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const f of this.floaters) {
      const p = iso(f.x, f.y); const k = f.t / 1800;
      ctx.globalAlpha = 1 - k; ctx.font = '11px "Jua", sans-serif';
      const txt = (f.v >= 0 ? '+' : '') + Sim.won(f.v).replace('원', '');
      ctx.lineWidth = 3; ctx.strokeStyle = '#fff8ee'; ctx.strokeText(txt, p.x, p.y - 66 - k * 26);
      ctx.fillStyle = f.v >= 0 ? '#4f7f3f' : '#c94f6d'; ctx.fillText(txt, p.x, p.y - 66 - k * 26);
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drawHoodLabels(ctx);
    this.drawParticles(ctx, dt, season, wk);
  };

  R.drawCat = function (ctx, x, y, seed) {
    const tail = REDUCED ? 0 : Math.sin(this.t / 300 + seed) * 3;
    ctx.fillStyle = ['#e3a63c', '#5b4448', '#fff8ee'][seed % 3];
    ctx.beginPath(); ctx.ellipse(x, y - 3, 4, 3, 0, 0, 7); ctx.fill(); ink(ctx, 0.8);
    ctx.beginPath(); ctx.arc(x - 3, y - 7, 2.6, 0, 7); ctx.fill(); ink(ctx, 0.8);
    ctx.beginPath(); ctx.moveTo(x - 5, y - 9); ctx.lineTo(x - 4.5, y - 11.5); ctx.lineTo(x - 3.2, y - 9.6); ctx.moveTo(x - 2.4, y - 9.6); ctx.lineTo(x - 1.5, y - 11.5); ctx.lineTo(x - 1, y - 9); ctx.fill(); ink(ctx, 0.7);
    ctx.beginPath(); ctx.moveTo(x + 3.5, y - 3); ctx.quadraticCurveTo(x + 7, y - 6, x + 6 + tail, y - 10); ink(ctx, 1.1);
  };
  R.drawBirds = function (ctx, dt) {
    if (REDUCED) return;
    if (!this.birds || this.birds.x > 1500) this.birds = { x: -1500 - Math.random() * 2000, y: 100 + Math.random() * 700 };
    this.birds.x += dt * 0.05;
    for (let i = 0; i < 5; i++) {
      const bx = this.birds.x - i * 14 - (i % 2) * 6, by = this.birds.y - 150 + i * 6 * (i % 2 ? 1 : -0.5), f = Math.sin(this.t / 120 + i) * 3;
      ctx.beginPath(); ctx.moveTo(bx - 5, by - f); ctx.quadraticCurveTo(bx - 2, by - 2, bx, by); ctx.quadraticCurveTo(bx + 2, by - 2, bx + 5, by - f); ink(ctx, 1.2);
    }
  };
  R.drawHoodLabels = function (ctx) {
    if (this.cam.z > 1.15 || !this.showHoods) return;
    const S = this.S;
    ctx.font = '13px "Jua","Gowun Dodum",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    Sim.HOODS.forEach((H, i) => {
      const hx = (i % 3) * Sim.HOOD + 5, hy = Math.floor(i / 3) * Sim.HOOD + 5;
      const p = this.tileScreen(hx, hy);
      const hot = S.hoods[i].hype >= 40;
      const text = (hot ? '🔥 ' : '') + H.name;
      const w = ctx.measureText(text).width + 18;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(p.x - w / 2, p.y - 12, w, 24, 12); else ctx.rect(p.x - w / 2, p.y - 12, w, 24);
      ctx.fillStyle = hot ? '#ffe3cf' : '#fff8ee'; ctx.fill(); ink(ctx, 1.8);
      ctx.fillStyle = INK; ctx.fillText(text, p.x, p.y + 1);
    });
  };
  R.drawLogistics = function (ctx) {
    const S = this.S;
    for (const f of S.facs) {
      if (f.owner !== 0 || !Sim.FAC[f.kind].range) continue;
      const r = Sim.facRange(f);
      for (const t of S.tiles) if (Math.abs(t.x - f.x) + Math.abs(t.y - f.y) <= r) { const p = iso(t.x, t.y); diamond(ctx, p.x, p.y, 1, f.kind === 'kitchen' ? 'rgba(227,166,60,0.14)' : 'rgba(158,167,222,0.18)'); }
    }
    ctx.setLineDash([4, 4]);
    for (const st of S.stores) {
      if (st.owner !== 0) continue;
      const a = iso(st.x, st.y);
      if (st.supply === 'direct') { diamond(ctx, a.x, a.y, 0.5, 'rgba(228,107,95,0.45)'); continue; }
      const f = S.facs.find(x => x.id === st.facId); if (!f) continue;
      const b = iso(f.x, f.y);
      ctx.beginPath(); ctx.moveTo(a.x, a.y - 10); ctx.lineTo(b.x, b.y - 10); ink(ctx, 1.4);
    }
    ctx.setLineDash([]);
  };
  R.drawPotentialTags = function (ctx, data) {
    const top = data.slice().sort((a, b) => b.cust - a.cust).slice(0, 5);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const d of top) {
      const p = iso(d.x, d.y), bob = REDUCED ? 0 : Math.sin(this.t / 300 + d.x) * 2, q = 1 / Math.max(0.55, Math.min(1.3, this.cam.z));
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(p.x - 21 * q, p.y - 26 - 17 * q + bob, 42 * q, 17 * q, 8.5 * q); else ctx.rect(p.x - 21 * q, p.y - 26 - 17 * q + bob, 42 * q, 17 * q);
      ctx.fillStyle = '#fff8ee'; ctx.fill(); ink(ctx, 1.5 * q);
      ctx.font = `${Math.round(11 * q)}px "Jua", sans-serif`; ctx.fillStyle = INK;
      ctx.fillText(Math.round(d.cust) + '명', p.x, p.y - 26 - 8.5 * q + bob);
    }
  };
  R.drawParticles = function (ctx, dt, season, wk) {
    if (REDUCED) { this.particles.length = 0; return; }
    const mode = wk === 'rain' ? 'rain' : wk === 'snow' ? 'snow' : season === 'spring' ? 'petal' : season === 'autumn' ? 'leaf' : season === 'winter' ? 'snowlite' : null;
    if (!mode) { this.particles.length = 0; return; }
    const n = mode === 'rain' ? 110 : mode === 'snow' ? 80 : 24;
    if (this._pmode !== mode) { this.particles = []; this._pmode = mode; }
    while (this.particles.length < n) this.particles.push({ x: Math.random() * this.w, y: Math.random() * this.h - this.h, v: 0.012 + Math.random() * 0.02, s: 2 + Math.random() * 2.5, ph: Math.random() * 6 });
    for (const p of this.particles) {
      if (mode === 'rain') { p.y += dt * 0.9; p.x -= dt * 0.12; }
      else { p.y += dt * p.v * (mode === 'snow' ? 2 : 1.4); p.x += Math.sin(this.t / 900 + p.ph) * 0.3 + dt * 0.006; }
      if (p.y > this.h + 10) { p.y = -10; p.x = Math.random() * (this.w + 100); }
      if (mode === 'rain') { ctx.strokeStyle = 'rgba(94,31,43,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 3, p.y + 11); ctx.stroke(); continue; }
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.s, mode === 'petal' || mode === 'leaf' ? p.s * 0.6 : p.s, p.ph + this.t / 1000, 0, 7);
      ctx.fillStyle = mode === 'petal' ? '#f2b3c4' : mode === 'leaf' ? '#e39a4a' : '#ffffff'; ctx.fill();
      ctx.strokeStyle = 'rgba(94,31,43,0.5)'; ctx.lineWidth = 0.7; ctx.stroke();
    }
  };

  // ================= 매장 내부 =================
  function person(ctx, x, y, shirt, hair, apron, bob, sitting, k) {
    k = k || 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-x, -y);
    personBody(ctx, x, y, shirt, hair, apron, bob, sitting);
    ctx.restore();
  }
  function personBody(ctx, x, y, shirt, hair, apron, bob, sitting) {
    ctx.fillStyle = 'rgba(94,31,43,0.14)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 6, 2.5, 0, 0, 7); ctx.fill();
    const h = sitting ? 9 : 15;
    if (!sitting) { ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x - 2, y - 5); ctx.moveTo(x + 2, y); ctx.lineTo(x + 2, y - 5); ink(ctx, 1.3); }
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - 4.5, y - h - bob, 9, h - (sitting ? 0 : 4), 3.5); else ctx.rect(x - 4.5, y - h - bob, 9, h);
    ctx.fillStyle = shirt; ctx.fill(); ink(ctx, 1);
    if (apron) { ctx.beginPath(); ctx.rect(x - 3.2, y - h + 4 - bob, 6.4, h - (sitting ? 5 : 8)); ctx.fillStyle = apron; ctx.fill(); ink(ctx, 0.8); }
    ctx.beginPath(); ctx.arc(x, y - h - 4.5 - bob, 4.5, 0, 7); ctx.fillStyle = '#f4d2bd'; ctx.fill(); ink(ctx, 1);
    ctx.beginPath(); ctx.arc(x, y - h - 5.6 - bob, 4.6, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(x, y - h - 5 - bob); ctx.closePath(); ctx.fillStyle = hair; ctx.fill(); ink(ctx, 0.8);
    ctx.fillStyle = INK; ctx.fillRect(x - 2, y - h - 4.2 - bob, 1, 1.3); ctx.fillRect(x + 1, y - h - 4.2 - bob, 1, 1.3);
  }
  // opts: { hour, t, hoverStaff }
  Renderer.drawInterior = function (canvas, S, st, opts) {
    opts = opts || {};
    const dpr = Math.min(2, root.devicePixelRatio || 1);
    const W = canvas.clientWidth, Hh = canvas.clientHeight; if (!W || !Hh) return;
    if (canvas.width !== Math.round(W * dpr)) { canvas.width = W * dpr; canvas.height = Hh * dpr; }
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const comp = S.companies[st.owner], style = Sim.STYLES[st.interior.style], tier = st.interior.tier, cat = Sim.CATS[st.cat];
    const hour = opts.hour == null ? S.hour % 24 : opts.hour, t = opts.t || 0;
    const open = hour >= st.open && hour < st.close;
    const nx = [0, 7, 8, 9][st.size], ny = [0, 5, 6, 7][st.size];
    const tw = Math.min(W / (nx + ny) * 1.9, 60), th = tw / 2, wallH = tw * 2.3;
    const ox = W / 2 + (ny - nx) * tw / 4, oy = Math.max(wallH + 18, (Hh - (nx + ny) * th / 2) / 2 + wallH * 0.55);
    const P = (x, y) => ({ x: ox + (x - y) * tw / 2, y: oy + (x + y) * th / 2 });
    ctx.fillStyle = '#6fb7b2'; ctx.fillRect(0, 0, W, Hh);
    // 바닥
    for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
      const c = P(x + 0.5, y + 0.5);
      let col = style.floor;
      if (st.interior.style === 'vintage') col = (x + y) % 2 ? '#efe2c9' : '#b9806a';
      else if (st.interior.style === 'luxury') col = (x + y) % 2 ? '#3e3a3a' : '#4a4545';
      else if (st.interior.style === 'minimal' || st.interior.style === 'industrial') col = shade(style.floor, (hash(x, y) - 0.5) * 0.08);
      else col = shade(style.floor, ((x * 3 + y) % 4) * 0.025);
      diamondPath(ctx, c.x, c.y, 1, tw / 2, th / 2); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = 'rgba(94,31,43,0.18)'; ctx.lineWidth = 0.7; ctx.stroke();
      if (['wood', 'nordic', 'hanok'].includes(st.interior.style)) { ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 0.8; ctx.stroke(); }
      if (st.interior.style === 'luxury') { ctx.strokeStyle = 'rgba(199,163,90,0.35)'; ctx.lineWidth = 0.6; ctx.stroke(); }
    }
    // 벽
    const p00 = P(0, 0), pX0 = P(nx, 0), p0Y = P(0, ny);
    const wallL = style.wall, wallR = shade(style.wall, -0.06);
    poly(ctx, [[p0Y.x, p0Y.y], [p00.x, p00.y], [p00.x, p00.y - wallH], [p0Y.x, p0Y.y - wallH]], wallL, 1.6);
    poly(ctx, [[p00.x, p00.y], [pX0.x, pX0.y], [pX0.x, pX0.y - wallH], [p00.x, p00.y - wallH]], wallR, 1.6);
    { const pXY = P(nx, ny); poly(ctx, [[p0Y.x, p0Y.y], [p00.x, p00.y], [pX0.x, pX0.y], [pXY.x, pXY.y]], null, 1.6); }
    const wallQuad = (side, u0, u1, v0, v1, col) => {
      const a = side === 'L' ? P(0, ny * (1 - u0)) : P(nx * u0, 0), b = side === 'L' ? P(0, ny * (1 - u1)) : P(nx * u1, 0);
      poly(ctx, [[a.x, a.y - wallH * v0], [b.x, b.y - wallH * v0], [b.x, b.y - wallH * v1], [a.x, a.y - wallH * v1]], col, (v1 - v0) < 0.05 ? 0 : 1);
    };
    // 징두리·포인트
    wallQuad('L', 0, 1, 0, 0.3, shade(style.accent, 0.35)); wallQuad('R', 0, 1, 0, 0.3, shade(style.accent, 0.3));
    if (st.interior.style === 'industrial') { ctx.strokeStyle = '#6b6f73'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p00.x, p00.y - wallH * 0.92); ctx.lineTo(pX0.x, pX0.y - wallH * 0.92); ctx.stroke(); }
    if (st.interior.style === 'hanok') for (let i = 1; i < nx; i++) { const a = P(i, 0); ctx.strokeStyle = '#7a5c44'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x, a.y - wallH); ctx.stroke(); }
    if (st.interior.style === 'luxury') { wallQuad('R', 0, 1, 0.29, 0.31, '#c7a35a'); wallQuad('L', 0, 1, 0.29, 0.31, '#c7a35a'); }
    // 창문 (오른쪽 벽) — 시간대별 바깥 색
    const skyCol = hour >= 7 && hour < 17 ? '#bfe0f3' : hour >= 17 && hour < 20 ? '#f6c9a0' : hour >= 5 && hour < 7 ? '#e8d0d8' : '#38406a';
    for (const [u0, u1] of [[0.18, 0.42], [0.58, 0.82]]) {
      wallQuad('R', u0 - 0.02, u1 + 0.02, 0.36, 0.86, shade(style.accent, -0.1));
      wallQuad('R', u0, u1, 0.39, 0.83, skyCol);
      if (st.interior.style === 'hanok') { for (let k = 1; k < 4; k++) wallQuad('R', u0 + (u1 - u0) * k / 4 - 0.004, u0 + (u1 - u0) * k / 4 + 0.004, 0.39, 0.83, '#7a5c44'); }
      else wallQuad('R', (u0 + u1) / 2 - 0.006, (u0 + u1) / 2 + 0.006, 0.39, 0.83, 'rgba(255,255,255,0.8)');
    }
    // 메뉴판 (왼쪽 벽)
    wallQuad('L', 0.55, 0.9, 0.5, 0.85, st.interior.style === 'minimal' ? '#ffffff' : '#3e4a44');
    { const a = P(0, ny * 0.28); ctx.font = `${Math.round(tw * 0.32)}px ${EMOJI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(cat.icon, a.x - tw * 0.1, a.y - wallH * 0.72); }
    // 액자·포스터
    if (tier >= 3 || st.interior.style === 'vintage') { wallQuad('L', 0.12, 0.32, 0.5, 0.75, st.interior.style === 'vintage' ? '#e98a7a' : '#f3e7c8'); wallQuad('L', 0.15, 0.29, 0.54, 0.71, st.interior.style === 'vintage' ? '#f2c14e' : '#9bb7c7'); }
    if (st.interior.style === 'vintage' && open) { const a = P(nx * 0.5, 0); ctx.fillStyle = '#ff7aa8'; ctx.shadowColor = '#ff7aa8'; ctx.shadowBlur = 10; ctx.font = `bold ${Math.round(tw * 0.28)}px "Jua",sans-serif`; ctx.textAlign = 'center'; ctx.fillText('OPEN', a.x, a.y - wallH * 0.95 + 4); ctx.shadowBlur = 0; }
    // 로고 (오른쪽 벽 중앙 위)
    { const a = P(nx * 0.5, 0); drawLogo(ctx, comp, a.x, a.y - wallH * 0.94, tw * 0.17); }
    // 노후 흔적
    if (st.interior.cond < 65) { ctx.strokeStyle = 'rgba(90,80,70,0.35)'; ctx.lineWidth = 1; for (let i = 0; i < (65 - st.interior.cond) / 6; i++) { const a = P(nx * hash(i, 1), 0); ctx.beginPath(); ctx.moveTo(a.x, a.y - wallH * (0.4 + hash(i, 2) * 0.4)); ctx.lineTo(a.x + 6, a.y - wallH * (0.4 + hash(i, 2) * 0.4) + 8); ctx.lineTo(a.x + 3, a.y - wallH * (0.4 + hash(i, 2) * 0.4) + 14); ctx.stroke(); } }

    const items = [];
    // 카운터
    const cy0 = 0.6, cy1 = Math.min(ny - 0.5, 3.4);
    items.push({ d: 0.9 + cy1, draw: () => {
      const a = P(0.25, cy0), b = P(0.25, cy1), c = P(1.15, cy1), e = P(1.15, cy0), ch = tw * 0.38;
      const top = shade(style.accent, 0.25);
      poly(ctx, [[b.x, b.y], [c.x, c.y], [c.x, c.y - ch], [b.x, b.y - ch]], shade(style.accent, -0.05));
      poly(ctx, [[c.x, c.y], [e.x, e.y], [e.x, e.y - ch], [c.x, c.y - ch]], style.accent);
      poly(ctx, [[a.x, a.y - ch], [b.x, b.y - ch], [c.x, c.y - ch], [e.x, e.y - ch]], top);
      // 업종 장비
      const m = P(0.7, (cy0 + cy1) / 2 - 0.6), m2 = P(0.7, (cy0 + cy1) / 2 + 0.7);
      const eq = ({ cafe: 'machine', bubbletea: 'machine', bakery: 'case', dessert: 'case', brunch: 'case', salad: 'case', noodle: 'pot', hansik: 'pot', japanese: 'pot', chinese: 'pot', snack: 'pot' })[st.cat] || 'grill';
      if (eq === 'machine') { ctx.fillStyle = '#9aa3aa'; ctx.fillRect(m.x - tw * 0.22, m.y - ch - tw * 0.38, tw * 0.44, tw * 0.3); ctx.fillStyle = '#5f676d'; ctx.fillRect(m.x - tw * 0.16, m.y - ch - tw * 0.12, tw * 0.08, tw * 0.06); ctx.fillStyle = '#ffffff'; ctx.fillRect(m2.x - 3, m2.y - ch - 7, 6, 7); ctx.fillRect(m2.x + 5, m2.y - ch - 7, 6, 7); }
      else if (eq === 'case') { ctx.fillStyle = 'rgba(210,235,245,0.7)'; ctx.fillRect(m.x - tw * 0.3, m.y - ch - tw * 0.3, tw * 0.6, tw * 0.3); const col = st.cat === 'bakery' || st.cat === 'brunch' ? ['#d9a05b', '#c8874a', '#e8bd7a'] : st.cat === 'salad' ? ['#8cc084', '#e9a05f', '#f3e7a0'] : ['#f6c6d6', '#fff1d6', '#c98b6b']; for (let i = 0; i < 4; i++) { ctx.fillStyle = col[i % 3]; ctx.beginPath(); ctx.ellipse(m.x - tw * 0.2 + i * tw * 0.13, m.y - ch - tw * 0.08, tw * 0.06, tw * 0.04, 0, 0, 7); ctx.fill(); } }
      else if (eq === 'pot') { ctx.fillStyle = '#7d858a'; ctx.beginPath(); ctx.ellipse(m.x, m.y - ch - tw * 0.12, tw * 0.2, tw * 0.09, 0, 0, 7); ctx.fill(); ctx.fillRect(m.x - tw * 0.2, m.y - ch - tw * 0.12, tw * 0.4, tw * 0.1); if (open) for (let i = 0; i < 3; i++) { const ph = (t / 1500 + i / 3) % 1; ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - ph)})`; ctx.beginPath(); ctx.arc(m.x + Math.sin(ph * 5 + i) * 4, m.y - ch - tw * 0.2 - ph * 20, 3 + ph * 4, 0, 7); ctx.fill(); } }
      else { ctx.fillStyle = '#5a5f63'; ctx.fillRect(m.x - tw * 0.26, m.y - ch - tw * 0.1, tw * 0.52, tw * 0.1); ctx.fillStyle = '#c87a4a'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(m.x - tw * 0.15 + i * tw * 0.15, m.y - ch - tw * 0.11, tw * 0.05, tw * 0.025, 0, 0, 7); ctx.fill(); } }
    } });
    // 테이블
    const nTables = [0, 3, 5, 7][st.size];
    const spots = [];
    for (let y = 1; y < ny - 0.5; y += 1.6) for (let x = 2.4; x < nx - 0.6; x += 1.7) spots.push([x, y]);
    const tables = spots.slice(0, nTables);
    const seatsPerTable = 3;
    const seated = open ? Math.min(tables.length * seatsPerTable, Math.round((st.hourly[hour] || st.hourly[(hour + 23) % 24] || 0) * cat.dwell * (1 - cat.takeout) * 0.5)) : 0;
    const tableCol = st.interior.style === 'luxury' ? '#e9e3da' : st.interior.style === 'industrial' ? '#4f5357' : st.interior.style === 'minimal' ? '#ffffff' : shade(style.accent, 0.1);
    let seatIdx = 0;
    tables.forEach(([x, y], ti) => {
      const seats = [[x - 0.45, y], [x + 0.45, y], [x, y + 0.45]];
      seats.forEach(([sx, sy2], si) => {
        const filled = seatIdx++ < seated;
        items.push({ d: sx + sy2 - 0.05, draw: () => {
          const c = P(sx, sy2);
          ctx.beginPath(); ctx.ellipse(c.x, c.y - 4, tw * 0.12, tw * 0.06, 0, 0, 7); ctx.fillStyle = shade(tableCol, -0.15); ctx.fill(); ink(ctx, 0.8);
          ctx.fillRect(c.x - 1, c.y - 4, 2, 5);
          if (filled) person(ctx, c.x, c.y - 2, SHIRTS[(ti * 3 + si) % SHIRTS.length], HAIR[(ti + si) % HAIR.length], null, REDUCED ? 0 : Math.sin(t / 700 + ti + si) * 0.6, true, tw / 38);
        } });
      });
      items.push({ d: x + y, draw: () => {
        const c = P(x, y);
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 2, tw * 0.3, tw * 0.13, 0, 0, 7); ctx.fill();
        ctx.fillStyle = shade(tableCol, -0.2); ctx.fillRect(c.x - 1.5, c.y - tw * 0.3, 3, tw * 0.3);
        ctx.beginPath(); ctx.ellipse(c.x, c.y - tw * 0.3, tw * 0.28, tw * 0.13, 0, 0, 7); ctx.fillStyle = tableCol; ctx.fill(); ink(ctx, 1);
        if (open && seatIdx > 0) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(c.x + 3, c.y - tw * 0.32, 2.5, 0, 7); ctx.fill(); }
        if (tier >= 3) { ctx.strokeStyle = 'rgba(80,80,80,0.5)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(c.x, c.y - tw * 0.3 - wallH * 0.75); ctx.lineTo(c.x, c.y - tw * 0.3 - wallH * 0.45); ctx.stroke(); ctx.fillStyle = st.interior.style === 'luxury' ? '#c7a35a' : style.accent; ctx.beginPath(); ctx.arc(c.x, c.y - tw * 0.3 - wallH * 0.45, tw * 0.09, Math.PI, 0); ctx.fill(); if (open) { ctx.fillStyle = 'rgba(255,220,150,0.25)'; ctx.beginPath(); ctx.ellipse(c.x, c.y - tw * 0.3, tw * 0.3, tw * 0.12, 0, 0, 7); ctx.fill(); } }
      } });
    });
    // 화분·장식
    const plants = st.interior.style === 'plant' ? 6 : tier >= 2 ? Math.min(4, tier) : 0;
    const pspots = [[nx - 0.5, 0.5], [1.6, 0.4], [nx - 0.5, ny - 0.6], [nx - 2.2, 0.4], [1.7, ny - 0.5], [nx * 0.5, 0.4]];
    for (let i = 0; i < plants; i++) {
      const [x, y] = pspots[i];
      items.push({ d: x + y, draw: () => { const c = P(x, y); ctx.beginPath(); ctx.rect(c.x - 5, c.y - 9, 10, 9); ctx.fillStyle = '#d9785f'; ctx.fill(); ink(ctx, 1); ctx.beginPath(); ctx.arc(c.x, c.y - 16, 8, 0, 7); ctx.arc(c.x - 5, c.y - 12, 5, 0, 7); ctx.arc(c.x + 5, c.y - 13, 5, 0, 7); ctx.fillStyle = '#8fb38a'; ctx.fill(); ink(ctx, 1); } });
    }
    if (st.interior.style === 'plant') for (let i = 0; i < 5; i++) { const a = P(nx * (0.15 + i * 0.17), 0); ctx.strokeStyle = '#6fa36a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a.x, a.y - wallH); ctx.quadraticCurveTo(a.x + 4, a.y - wallH * 0.85, a.x, a.y - wallH * 0.7); ctx.stroke(); ctx.fillStyle = '#86bf7d'; ctx.beginPath(); ctx.arc(a.x, a.y - wallH * 0.7, 4, 0, 7); ctx.fill(); }
    if (tier >= 4) { const c = P(nx * 0.6, ny * 0.5); ctx.strokeStyle = 'rgba(80,80,80,0.5)'; ctx.beginPath(); ctx.moveTo(c.x, c.y - wallH * 1.05); ctx.lineTo(c.x, c.y - wallH * 0.8); ctx.stroke(); ctx.fillStyle = '#e8cf8a'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(c.x - 12 + i * 6, c.y - wallH * 0.78 + Math.abs(i - 2) * -2, 3, 0, 7); ctx.fill(); } }
    if (tier >= 3) items.push({ d: nx * 0.4 + ny * 0.6 - 2, draw: () => { const c = P(nx * 0.55, ny * 0.7); ctx.fillStyle = st.interior.style === 'luxury' ? 'rgba(199,163,90,0.25)' : 'rgba(255,255,255,0.35)'; diamondPath(ctx, c.x, c.y, 1.5, tw / 2, th / 2); ctx.fill(); } });
    // 직원
    const onDuty = open ? st.staff.filter(s => Sim.onDuty(st, s, hour)) : [];
    onDuty.forEach((s, i) => {
      let x, y;
      if (s.role === 'kitchen') { x = 0.05; y = cy0 + 0.5 + (i * 1.1) % Math.max(0.5, cy1 - cy0 - 0.3); }
      else if (s.role === 'manager') { x = 1.7; y = ny - 1.2; }
      else { const tt = (t / 4000 + i * 0.37) % 1; x = 2 + (nx - 3) * (0.5 + 0.45 * Math.sin(tt * Math.PI * 2 + i)); y = 1.2 + (ny - 2.4) * (0.5 + 0.45 * Math.cos(tt * Math.PI * 2 + i * 1.7)); if (REDUCED) { x = 2 + i; y = 1.5; } }
      items.push({ d: x + y + 0.2, draw: () => {
        const c = P(x, y);
        const hi = opts.hoverStaff === s.id;
        if (hi) { ctx.fillStyle = 'rgba(242,185,80,0.45)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 1, 10, 4.5, 0, 0, 7); ctx.fill(); }
        person(ctx, c.x, c.y, '#ffffff', HAIR[s.id % HAIR.length], comp.color, REDUCED ? 0 : Math.abs(Math.sin(t / 260 + i)) * 1.2, false, tw / 34);
        if (s.role === 'manager') { ctx.fillStyle = '#f2b950'; ctx.font = `${Math.round(tw * 0.18)}px ${EMOJI}`; ctx.textAlign = 'center'; ctx.fillText('⭐', c.x, c.y - tw * 0.95); }
        if (s.morale < 40) { ctx.font = `${Math.round(tw * 0.18)}px ${EMOJI}`; ctx.textAlign = 'center'; ctx.fillText('💧', c.x + 10, c.y - tw * 0.85); }
        else if (s.morale > 85) { ctx.font = `${Math.round(tw * 0.16)}px ${EMOJI}`; ctx.textAlign = 'center'; ctx.fillText('♪', c.x + 10, c.y - tw * 0.85); }
      } });
    });
    items.sort((a, b) => a.d - b.d);
    for (const it of items) it.draw();
    // 영업 상태
    if (!open) { ctx.fillStyle = 'rgba(70,62,120,0.35)'; ctx.fillRect(0, 0, W, Hh); signBoard(ctx, W / 2, 26, 170, 24, '#fff8ee', `영업 준비 중 · ${st.open}시 오픈`); }
    else if (hour >= 18 || hour < 6) { ctx.fillStyle = 'rgba(255,190,110,0.08)'; ctx.fillRect(0, 0, W, Hh); }
  };


  root.Renderer = Renderer;
})(typeof window !== 'undefined' ? window : globalThis);
