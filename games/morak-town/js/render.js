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

  function icon(ctx, e, x, y, size, lw, fill) { if (!(root.Icons && root.Icons.draw(ctx, e, x, y, size, INK, lw, fill))) { ctx.font = `${size}px ${EMOJI}`; ctx.fillText(e, x, y); } }
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
  function walker(ctx, x, y, shirt, hair, bob, umbrella, step) {
    ctx.fillStyle = 'rgba(94,31,43,0.14)'; ctx.beginPath(); ctx.ellipse(x, y + 0.5, 2.6, 1.1, 0, 0, 7); ctx.fill();
    const sw = step == null ? 0 : Math.sin(step) * 1.6;
    ctx.beginPath(); ctx.moveTo(x - 0.8 + sw, y); ctx.lineTo(x - 0.8, y - 4 - bob * 0.3); ctx.moveTo(x + 0.8 - sw, y); ctx.lineTo(x + 0.8, y - 4 + bob * 0.3); ink(ctx, 1);
    ctx.beginPath(); ctx.moveTo(x - 2, y - 8 - bob); ctx.lineTo(x - 2.6 - sw * 0.6, y - 5 - bob); ctx.moveTo(x + 2, y - 8 - bob); ctx.lineTo(x + 2.6 + sw * 0.6, y - 5 - bob); ctx.strokeStyle = INK; ctx.lineWidth = 0.9; ctx.stroke();
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
    this.overlay = null; this.walkers = []; this.shoppers = []; this.inside = {}; this.shopT = {}; this.doors = new Map(); this.cars = []; this.trucks = []; this.floaters = []; this.particles = [];
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
  R.setState = function (S) { this.S = S; this.chunks = new Map(); this.sprites = new Map(); this.ov = null; this.walkers = []; this.cars = []; this.trucks = []; this.pathCache.clear(); };
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
    this.cam.z = Math.max(0.2, Math.min(3.6, this.cam.z * f));
    const after = this.toWorld(sx, sy);
    this.cam.x += before.x - after.x; this.cam.y += before.y - after.y;
  };
  R.fit = function () { this.cam.z = Math.max(0.2, Math.min(1.2, Math.min(this.w / (Sim.W * TW * 0.95), this.h / (Sim.H * TH * 1.1)))); this.cam.x = 0; this.cam.y = (Sim.W + Sim.H) * HH / 2 - 10; };
  R.home = function () { const c = this.S && this.S.hoodCenters ? this.S.hoodCenters[2] : { x: 40, y: 20 }; this.centerOn(c.x, c.y + 6); this.cam.z = Math.min(0.9, Math.max(0.6, this.w / 1400)); };
  R.pop = function (x, y) { (this.pops || (this.pops = {}))[x + ',' + y] = this.t; };

  function darkness(h) {
    if (h >= 7 && h < 17.5) return 0;
    if (h >= 17.5 && h < 20) return (h - 17.5) / 2.5 * 0.8;
    if (h >= 5 && h < 7) return (7 - h) / 2 * 0.8;
    return 0.8;
  }
  function duskTint(h) { return (h >= 16.5 && h < 19.5) ? Math.sin((h - 16.5) / 3 * Math.PI) : (h >= 5 && h < 7.5 ? Math.sin((h - 5) / 2.5 * Math.PI) * 0.6 : 0); }

  // ---------- 여러 칸 건물 도형 ----------
  function geo(ax, ay, w, d, m) {
    m = m == null ? 0.07 : m;
    const T = iso(ax - 0.5 + m, ay - 0.5 + m), Rr = iso(ax + w - 0.5 - m, ay - 0.5 + m), B = iso(ax + w - 0.5 - m, ay + d - 0.5 - m), L = iso(ax - 0.5 + m, ay + d - 0.5 - m);
    return { T, R: Rr, B, L, c: iso(ax + (w - 1) / 2, ay + (d - 1) / 2), w, d, ax, ay, m };
  }
  function up(p, h) { return [p.x, p.y - h]; }
  function fbox(ctx, g, h, wall, top, h0) {
    h0 = h0 || 0;
    poly(ctx, [up(g.L, h0), up(g.B, h0), up(g.B, h), up(g.L, h)], wall);
    poly(ctx, [up(g.B, h0), up(g.R, h0), up(g.R, h), up(g.B, h)], shade(wall, -0.14));
    poly(ctx, [up(g.L, h), up(g.B, h), up(g.R, h), up(g.T, h)], top || shade(wall, -0.25));
  }
  function gshadow(ctx, g) { ctx.fillStyle = 'rgba(94,31,43,0.12)'; ctx.beginPath(); ctx.moveTo(g.L.x + 5, g.L.y + 3); ctx.lineTo(g.B.x + 5, g.B.y + 3); ctx.lineTo(g.R.x + 5, g.R.y + 3); ctx.lineTo(g.T.x + 5, g.T.y + 3); ctx.closePath(); ctx.fill(); }
  function fpt(g, side, u) { const a = side === 'L' ? g.L : g.B, b = side === 'L' ? g.B : g.R; return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u }; }
  function fq(ctx, g, side, u0, u1, v0, v1, fill, w) { const a = fpt(g, side, u0), b = fpt(g, side, u1); poly(ctx, [up(a, v0), up(b, v0), up(b, v1), up(a, v1)], fill, w == null ? LW * 0.85 : w); }
  function wins(ctx, g, side, h0, h1, rows, perTile, glass, lit, seed, style) {
    const n = Math.max(1, Math.round(perTile * (side === 'L' ? g.w : g.d)));
    const fh = (h1 - h0) / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < n; c++) {
      const on = lit && hash(seed | 0, r * 7 + (side === 'L' ? 1 : 2), c) < lit;
      const v0 = h0 + fh * (r + 0.25), v1 = h0 + fh * (r + (style === 'ribbon' ? 0.8 : 0.78));
      const u0 = style === 'ribbon' ? (c + 0.04) / n : (c + 0.22) / n, u1 = style === 'ribbon' ? (c + 0.96) / n : (c + 0.78) / n;
      fq(ctx, g, side, u0, u1, v0, v1, on ? '#ffd98a' : glass, style === 'ribbon' ? 0.6 : 0.8);
      if (style === 'balcony') fq(ctx, g, side, u0 - 0.03, u1 + 0.03, v0 - 1, v0 + 2, '#fff8ee', 0.7);
    }
  }
  // 평지붕: 두꺼운 난간 테두리 + 밝은 안쪽 지붕면 (니펫츠풍)
  function ledgeG(ctx, g, h, col) {
    poly(ctx, [up(g.L, h), up(g.B, h), up(g.R, h), up(g.R, h + 3), up(g.B, h + 3), up(g.L, h + 3)], col);
    poly(ctx, [up(g.L, h + 3), up(g.B, h + 3), up(g.R, h + 3), up(g.T, h + 3)], col);
    const c = g.c, k = Math.min(0.2, 5 / (HW * Math.min(g.w, g.d)));
    const inn = p => [p.x + (c.x - p.x) * k, p.y + (c.y - p.y) * k - h - 3];
    poly(ctx, [inn(g.L), inn(g.B), inn(g.R), inn(g.T)], col[0] === '#' ? shade(col, 0.42) : col, 0.8);
  }
  function hipRoof(ctx, g, h, rh, col) {
    const cx = g.ax + (g.w - 1) / 2, cy = g.ay + (g.d - 1) / 2, k = Math.abs(g.w - g.d) / 2;
    const apexH = h + rh;
    if (g.w >= g.d) {
      const E1 = iso(cx - k, cy), E2 = iso(cx + k, cy);
      poly(ctx, [up(g.L, h), up(g.B, h), up(E2, apexH), up(E1, apexH)], col);
      poly(ctx, [up(g.B, h), up(g.R, h), up(E2, apexH)], shade(col, -0.15));
      poly(ctx, [up(g.T, h), up(g.L, h), up(E1, apexH)], shade(col, 0.08));
    } else {
      const E1 = iso(cx, cy - k), E2 = iso(cx, cy + k);
      poly(ctx, [up(g.L, h), up(g.B, h), up(E2, apexH)], col);
      poly(ctx, [up(g.B, h), up(g.R, h), up(E1, apexH), up(E2, apexH)], shade(col, -0.15));
      poly(ctx, [up(g.T, h), up(g.L, h), up(E2, apexH), up(E1, apexH)], shade(col, 0.08));
    }
  }
  function curvedRoof(ctx, g, h, rh, col, snow) {
    const ov = 5;
    const L = { x: g.L.x - ov, y: g.L.y }, Rr = { x: g.R.x + ov, y: g.R.y }, B = { x: g.B.x, y: g.B.y + ov * 0.5 }, T = g.T;
    const cx = g.ax + (g.w - 1) / 2, cy = g.ay + (g.d - 1) / 2, k = Math.max(0, (g.w - g.d) / 2);
    const E1 = iso(cx - k, cy), E2 = iso(cx + k, cy);
    const col1 = snow ? '#fbf7f7' : col, col2 = snow ? '#efe9ea' : shade(col, -0.2);
    ctx.beginPath(); ctx.moveTo(L.x, L.y - h - 4); ctx.quadraticCurveTo((L.x + B.x) / 2, (L.y + B.y) / 2 - h + 2, B.x, B.y - h); ctx.lineTo(E2.x, E2.y - h - rh); ctx.lineTo(E1.x, E1.y - h - rh); ctx.closePath(); ctx.fillStyle = col1; ctx.fill(); ink(ctx);
    ctx.beginPath(); ctx.moveTo(B.x, B.y - h); ctx.quadraticCurveTo((B.x + Rr.x) / 2, (B.y + Rr.y) / 2 - h + 2, Rr.x, Rr.y - h - 4); ctx.lineTo(E2.x, E2.y - h - rh); ctx.closePath(); ctx.fillStyle = col2; ctx.fill(); ink(ctx);
    void T;
  }

  // ---------- 니펫츠풍 외벽 장식 ----------
  const FLOWERS = ['#e46b5f', '#f2d36b', '#e58ba3', '#fff8ee', '#a99bd9'];
  // 크림색 창틀 + 유리 + 창턱 꽃상자
  function winBoxes(ctx, g, side, h0, h1, rows, perTile, seed, lit, glass) {
    const n = Math.max(1, Math.round(perTile * (side === 'L' ? g.w : g.d)));
    const fh2 = (h1 - h0) / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < n; c++) {
      const on = lit && hash(seed | 0, r * 7 + (side === 'L' ? 1 : 2), c) < lit;
      const v0 = h0 + fh2 * (r + 0.22), v1 = h0 + fh2 * (r + 0.86);
      const u0 = (c + 0.24) / n, u1 = (c + 0.76) / n;
      fq(ctx, g, side, u0 - 0.03, u1 + 0.03, v0 - 0.6, v1 + 0.6, '#fff4ea', 0.8);
      fq(ctx, g, side, u0, u1, v0 + 0.4, v1 - 0.6, on ? '#ffd98a' : (glass || GLASS), 0.6);
      if (!on && hash(seed | 0, r, c * 3 + 1) < 0.35) fq(ctx, g, side, u0, (u0 + u1) / 2, v0 + 0.4, v1 - 0.6, '#e46b5f', 0);
      fq(ctx, g, side, (u0 + u1) / 2 - 0.005, (u0 + u1) / 2 + 0.005, v0 + 0.4, v1 - 0.6, '#fff4ea', 0);
      if (hash(seed | 0, r * 3, c + 9) < 0.55) {
        fq(ctx, g, side, u0 - 0.04, u1 + 0.04, v0 - 2.2, v0, '#8a5a3c', 0.7);
        const a = fpt(g, side, u0), b = fpt(g, side, u1);
        for (let i = 0; i < 4; i++) { const k = (i + 0.5) / 4, x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k - v0 - 0.4; ctx.beginPath(); ctx.arc(x, y, 1.1, 0, 7); ctx.fillStyle = i % 2 ? '#7d9c55' : FLOWERS[(seed + r + c + i) % FLOWERS.length]; ctx.fill(); }
      }
    }
  }
  // 지붕선 아래 물결 장식(스캘럽)
  function scallop(ctx, g, h, col) {
    for (const side of ['L', 'R']) {
      const n = Math.max(3, Math.round(4 * (side === 'L' ? g.w : g.d)));
      const a0 = fpt(g, side, 0), b0 = fpt(g, side, 1);
      ctx.beginPath(); ctx.moveTo(a0.x, a0.y - h);
      for (let i = 0; i < n; i++) { const a = fpt(g, side, i / n), b = fpt(g, side, (i + 1) / n); ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - h + 4.5, b.x, b.y - h); }
      ctx.lineTo(b0.x, b0.y - h); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ink(ctx, 0.7);
    }
  }
  // 현관 계단과 문
  function stoop(ctx, g, side, u, col) {
    const a = fpt(g, side, u - 0.1), b = fpt(g, side, u + 0.1);
    poly(ctx, [up(a, 0), up(b, 0), up(b, 9), up(a, 9)], col, 0.9);
    fq(ctx, g, side, u - 0.06, u + 0.06, 6.5, 8.5, GLASS, 0.5);
    const d = side === 'L' ? [-1, 0.5] : [1, 0.5];
    for (let i = 0; i < 2; i++) { const o = (2 - i) * 1.6; poly(ctx, [[a.x + d[0] * o, a.y + d[1] * o - i * 1.5], [b.x + d[0] * o, b.y + d[1] * o - i * 1.5], [b.x + d[0] * o, b.y + d[1] * o - i * 1.5 - 1.5], [a.x + d[0] * o, a.y + d[1] * o - i * 1.5 - 1.5]], '#f1e2dc', 0.6); }
  }
  // 건물 밑동 덤불
  function hedge(ctx, g, side, u0, u1, season) {
    const col = season === 'winter' ? '#e9e1df' : season === 'autumn' ? '#b5964a' : '#7d9c55';
    const n = Math.max(2, Math.round((u1 - u0) * 6 * (side === 'L' ? g.w : g.d)));
    ctx.beginPath();
    for (let i = 0; i < n; i++) { const p = fpt(g, side, u0 + (u1 - u0) * (i + 0.5) / n); const ox = side === 'L' ? -1.5 : 1.5; ctx.moveTo(p.x + ox + 3, p.y + 1); ctx.arc(p.x + ox, p.y + 1, 3, 0, 7); }
    ctx.fillStyle = col; ctx.fill(); ink(ctx, 0.8);
  }
  // 평지붕 위 생활: 채광창, 실외기, 화분, 선베드, 비둘기
  function roofLife(R0, ctx, g, h, seed, season, night) {
    const c = up(g.c, h + 3), k = hash(seed, 5, 1);
    const gs = geo(g.ax + g.w * 0.25, g.ay + g.d * 0.25, g.w * 0.45, g.d * 0.45, 0.05);
    if (k < 0.35) { fbox(ctx, gs, h + 6, '#f6ead6', '#e9c9d6', h + 3); }
    else if (k < 0.6) { ctx.beginPath(); ctx.rect(c[0] - 7, c[1] - 6, 8, 6); ctx.fillStyle = '#efe2d0'; ctx.fill(); ink(ctx, 0.8); ctx.beginPath(); ctx.arc(c[0] - 3, c[1] - 3, 2, 0, 7); ink(ctx, 0.6); }
    if (hash(seed, 6) < 0.5 && season !== 'winter') { ctx.beginPath(); ctx.rect(c[0] + 5, c[1] - 4, 4, 4); ctx.fillStyle = '#d9785f'; ctx.fill(); ink(ctx, 0.7); ctx.beginPath(); ctx.arc(c[0] + 7, c[1] - 7, 3.2, 0, 7); ctx.fillStyle = '#7d9c55'; ctx.fill(); ink(ctx, 0.7); }
    if (hash(seed, 7) < 0.18 && night < 0.3 && (season === 'summer' || season === 'spring')) {
      poly(ctx, [[c[0] - 12, c[1] + 2], [c[0] - 2, c[1] + 7], [c[0] + 2, c[1] + 5], [c[0] - 8, c[1]]], '#e46b5f', 0.7);
      ctx.beginPath(); ctx.moveTo(c[0] - 10, c[1] + 1); ctx.lineTo(c[0] - 3, c[1] + 4.5); ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.stroke(); ctx.strokeStyle = '#f4d2bd'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.beginPath(); ctx.arc(c[0] - 10.5, c[1] + 0.5, 1.6, 0, 7); ctx.fillStyle = '#f4d2bd'; ctx.fill(); ink(ctx, 0.6);
    }
    if (hash(seed, 8) < 0.22) R0.pigeon(ctx, c[0] + (hash(seed, 9) - 0.5) * 14, c[1] + 2, seed);
  }

  // ---------- 유럽풍 지붕 ----------
  // 망사르드: 경사진 지붕 띠 + 지붕창(도머) + 굴뚝
  function mansard(ctx, g, h, col, seed, lit, snow) {
    const mh = 9, i = Math.min(0.18, 0.3 / Math.max(1, Math.min(g.w, g.d)) + 0.08);
    const gi = geo(g.ax + i, g.ay + i, g.w - 2 * i, g.d - 2 * i, g.m);
    const c1 = snow ? '#fbf7f7' : col, c2 = snow ? '#efe9ea' : shade(col, -0.15);
    poly(ctx, [up(g.L, h), up(g.B, h), up(gi.B, h + mh), up(gi.L, h + mh)], c1, 1);
    poly(ctx, [up(g.B, h), up(g.R, h), up(gi.R, h + mh), up(gi.B, h + mh)], c2, 1);
    poly(ctx, [up(gi.L, h + mh), up(gi.B, h + mh), up(gi.R, h + mh), up(gi.T, h + mh)], snow ? '#fbf7f7' : shade(col, 0.35), 1);
    poly(ctx, [up(g.L, h), up(g.B, h), up(g.R, h), up(g.R, h + 1.6), up(g.B, h + 1.6), up(g.L, h + 1.6)], '#fff4ea', 0.7);
    for (const side of ['L', 'R']) {
      const n = Math.max(1, Math.round(1.6 * (side === 'L' ? g.w : g.d)));
      for (let k = 0; k < n; k++) {
        const u = (k + 0.5) / n, a = fpt(g, side, u), b = fpt(gi, side, u), x = (a.x + b.x) / 2, y = (a.y + b.y) / 2 - h - mh * 0.45;
        const dx = side === 'L' ? -1 : 1;
        poly(ctx, [[x - 2.4, y + 3 - dx * 1.2], [x + 2.4, y + 3 + dx * 1.2], [x + 2.4, y - 2.5 + dx * 1.2], [x - 2.4, y - 2.5 - dx * 1.2]], '#fff4ea', 0.8);
        poly(ctx, [[x - 1.5, y + 2.4 - dx * 0.75], [x + 1.5, y + 2.4 + dx * 0.75], [x + 1.5, y - 1.8 + dx * 0.75], [x - 1.5, y - 1.8 - dx * 0.75]], lit && hash(seed, k, side === 'L' ? 3 : 4) < lit ? '#ffd98a' : GLASS, 0.5);
        poly(ctx, [[x - 3, y - 2.5 - dx * 1.5], [x + 3, y - 2.5 + dx * 1.5], [x, y - 6]], c2, 0.8);
      }
    }
    chimney(ctx, g, gi, h + mh, seed);
  }
  function chimney(ctx, g, gi, h, seed) {
    const n = 1 + (hash(seed, 2) < 0.5 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const p = iso(gi.ax + (k ? gi.w - 0.75 : 0.15) + 0.1, gi.ay + 0.15);
      ctx.beginPath(); ctx.rect(p.x - 2.5, p.y - h - 8, 5, 8); ctx.fillStyle = '#c86a55'; ctx.fill(); ink(ctx, 0.8);
      ctx.beginPath(); ctx.rect(p.x - 3.2, p.y - h - 9.5, 6.4, 2); ctx.fillStyle = '#efe2d0'; ctx.fill(); ink(ctx, 0.7);
    }
    void g;
  }
  // 박공지붕: 긴 쪽으로 용마루, 짧은 앞면에 삼각 박공과 둥근 창
  function gable(ctx, g, h, rh, col, wall, snow) {
    const c1 = snow ? '#fbf7f7' : col, c2 = snow ? '#efe9ea' : shade(col, -0.15);
    if (g.w >= g.d) {
      const cy = g.ay + (g.d - 1) / 2, E1 = iso(g.ax - 0.5 + g.m, cy), E2 = iso(g.ax + g.w - 0.5 - g.m, cy);
      poly(ctx, [up(g.L, h), up(g.B, h), up(E2, h + rh), up(E1, h + rh)], c1, 1);
      poly(ctx, [up(g.B, h), up(g.R, h), up(E2, h + rh)], wall, 1);
      const m = { x: (g.B.x + g.R.x + E2.x) / 3, y: (g.B.y + g.R.y + E2.y) / 3 - h - rh / 3 };
      ctx.beginPath(); ctx.ellipse(m.x, m.y, 2.4, 2.6, -0.45, 0, 7); ctx.fillStyle = GLASS; ctx.fill(); ink(ctx, 0.7);
      ctx.beginPath(); ctx.moveTo(g.B.x, g.B.y - h); ctx.lineTo(E2.x, E2.y - h - rh); ctx.lineTo(g.R.x, g.R.y - h); ink(ctx, 1.6);
    } else {
      const cx = g.ax + (g.w - 1) / 2, E1 = iso(cx, g.ay - 0.5 + g.m), E2 = iso(cx, g.ay + g.d - 0.5 - g.m);
      poly(ctx, [up(g.B, h), up(g.R, h), up(E1, h + rh), up(E2, h + rh)], c2, 1);
      poly(ctx, [up(g.L, h), up(g.B, h), up(E2, h + rh)], wall, 1);
      const m = { x: (g.L.x + g.B.x + E2.x) / 3, y: (g.L.y + g.B.y + E2.y) / 3 - h - rh / 3 };
      ctx.beginPath(); ctx.ellipse(m.x, m.y, 2.4, 2.6, 0.45, 0, 7); ctx.fillStyle = GLASS; ctx.fill(); ink(ctx, 0.7);
      ctx.beginPath(); ctx.moveTo(g.L.x, g.L.y - h); ctx.lineTo(E2.x, E2.y - h - rh); ctx.lineTo(g.B.x, g.B.y - h); ink(ctx, 1.6);
    }
  }
  const ROOFC = ['#6f7fa8', '#c86a55', '#7fa392', '#a8647a', '#d98a5a'];
  const FLOOR = 4.6;
  function fh(lv) { return 8 + lv * FLOOR; }

  // ---------- 바닥 (구역별 캐시) ----------
  function roadAt(S, x, y) { const t = Sim.tile(S, x, y); return t && (t.t === 'road' || t.t === 'bridge'); }
  const CH = 16;
  R.chunkBounds = function (cx, cy) {
    const x0 = cx * CH, y0 = cy * CH, x1 = x0 + CH - 1, y1 = y0 + CH - 1;
    return { minX: iso(x0, y1).x - HW - 2, maxX: iso(x1, y0).x + HW + 2, minY: iso(x0, y0).y - HH - 2, maxY: iso(x1, y1).y + HH + 2, x0, y0, x1, y1 };
  };
  R.getChunk = function (cx, cy, season) {
    const S = this.S, key = cx + ',' + cy, zs = this.cam.z * this.dpr, sc = zs > 2.3 ? 2.4 : zs > 1.5 ? 1.8 : this.dpr >= 2 ? 1.5 : 1.15;
    const ver = S.mapVer + ':' + season + ':' + S.stations.length + ':' + sc;
    const cache = this.chunks || (this.chunks = new Map());
    let ch = cache.get(key);
    if (ch && ch.ver === ver) { cache.delete(key); cache.set(key, ch); return ch; }
    // 이번 프레임 굽기 예산을 다 썼으면 예전 그림을 잠깐 그대로 씀 (한 프레임에 몰아서 굽다 끊기지 않게)
    if (ch && this._budgetG <= 0) return ch;
    const t0 = performance.now();
    const bd = this.chunkBounds(cx, cy);
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((bd.maxX - bd.minX) * sc); cv.height = Math.ceil((bd.maxY - bd.minY) * sc);
    const ctx = cv.getContext('2d');
    ctx.setTransform(sc, 0, 0, sc, -bd.minX * sc, -bd.minY * sc);
    for (let y = bd.y0; y <= bd.y1; y++) for (let x = bd.x0; x <= bd.x1; x++) { const t = Sim.tile(S, x, y); if (t) this.groundTile(ctx, t, season); }
    ch = { cv, ver, bd, sc }; cache.set(key, ch);
    // 화면에 보이는 구역 수보다 작게 잡으면 매 프레임 다시 굽느라 끊김
    while (cache.size > Math.max((this._visChunks || 0) + 4, sc > 1.6 ? 10 : 18)) cache.delete(cache.keys().next().value);
    this._budgetG -= performance.now() - t0;
    return ch;
  };
  function isRoadT(t) { return t && (t.t === 'road' || t.t === 'bridge'); }
  function isCross(S, t) { const r = (dx, dy) => isRoadT(Sim.tile(S, t.x + dx, t.y + dy)); return (r(1, 0) || r(-1, 0)) && (r(0, 1) || r(0, -1)); }
  // 골목 자갈 무늬 (한 번 만들어 반복)
  let COBBLE = null;
  function cobblePattern(ctx) {
    if (COBBLE || typeof document === 'undefined') return COBBLE;
    const c = document.createElement('canvas'); c.width = 16; c.height = 8; const g = c.getContext('2d');
    g.fillStyle = '#cdb9ad'; g.fillRect(0, 0, 16, 8); g.strokeStyle = 'rgba(94,31,43,0.28)'; g.lineWidth = 0.6;
    for (const [x, y] of [[4, 2], [12, 2], [0, 6], [8, 6], [16, 6]]) { g.beginPath(); g.ellipse(x, y, 3.4, 1.7, 0, 0, 7); g.stroke(); }
    COBBLE = ctx.createPattern(c, 'repeat'); return COBBLE;
  }
  const ROADC = { ave: '#8e7d84', st: '#a3939a', bridge: '#8e7d84' };
  R.roadTile = function (ctx, t, season, edges) {
    const S = this.S, p = iso(t.x, t.y), cx = p.x, cy = p.y, winter = season === 'winter';
    const ave = t.road === 'ave', alley = t.road === 'alley', bridge = t.t === 'bridge';
    const L = (u, v) => { const q = iso(t.x + u, t.y + v); return [q.x, q.y]; };
    const quad = (u0, u1, v0, v1, fill, w) => poly(ctx, [L(u0, v0), L(u1, v0), L(u1, v1), L(u0, v1)], fill, w == null ? 0 : w);
    const nbT = (dx, dy) => Sim.tile(S, t.x + dx, t.y + dy);
    const nb = (dx, dy) => isRoadT(nbT(dx, dy));
    const cross = isCross(S, t);
    const along = cross ? null : (nb(1, 0) || nb(-1, 0)) ? 'x' : 'y';
    // 바탕
    if (alley) { diamond(ctx, cx, cy, 1, '#cdb9ad'); const pat = cobblePattern(ctx); if (pat && !winter) { diamondPath(ctx, cx, cy, 1); ctx.fillStyle = pat; ctx.fill(); } if (winter) diamond(ctx, cx, cy, 1, '#efe7e4'); }
    else diamond(ctx, cx, cy, 1, winter ? '#cfc5c7' : ROADC[bridge ? 'bridge' : ave ? 'ave' : 'st']);
    if (!alley && !cross) {
      // 차선: 대로는 흰 점선 + 맞은편 차로와 닿은 변에 노란 중앙선, 이면도로는 가는 흰 점선
      const dash = (u0, v0, u1, v1, col, w, d) => { const A = L(u0, v0), B = L(u1, v1); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(d || []); ctx.stroke(); ctx.setLineDash([]); };
      if (along === 'x') dash(-0.5, 0, 0.5, 0, ave ? '#f4ece6' : 'rgba(244,236,230,0.75)', ave ? 1.4 : 1, [5, 6]);
      else dash(0, -0.5, 0, 0.5, ave ? '#f4ece6' : 'rgba(244,236,230,0.75)', ave ? 1.4 : 1, [5, 6]);
      if (ave) {
        if (along === 'x') { const o = nbT(0, 1) && nbT(0, 1).road === 'ave' ? 0.47 : nbT(0, -1) && nbT(0, -1).road === 'ave' ? -0.47 : null; if (o != null) dash(-0.5, o, 0.5, o, '#e3b04a', 2); }
        else { const o = nbT(1, 0) && nbT(1, 0).road === 'ave' ? 0.47 : nbT(-1, 0) && nbT(-1, 0).road === 'ave' ? -0.47 : null; if (o != null) dash(o, -0.5, o, 0.5, '#e3b04a', 2); }
      }
      // 횡단보도: 교차로 바로 앞 칸에, 길을 가로지르는 흰 줄
      for (const sgn of [1, -1]) {
        const n = along === 'x' ? nbT(sgn, 0) : nbT(0, sgn);
        if (!isRoadT(n) || !isCross(S, n) || n.road === 'alley') continue;
        const u0 = sgn > 0 ? 0.14 : -0.42, u1 = sgn > 0 ? 0.42 : -0.14;
        for (let i = 0; i < 5; i++) { const v0 = -0.42 + i * 0.18, v1 = v0 + 0.1; if (along === 'x') quad(u0, u1, v0, v1, '#f4ece6'); else quad(v0, v1, u0, u1, '#f4ece6'); }
      }
    }
    // 인도: 땅과 맞닿은 변을 따라 띠 + 연석, 교차로 모서리는 둥글게
    const SW = 0.24, swCol = winter ? '#f7f1f0' : '#efe0d8';
    const side = { '0,-1': [-0.5, 0.5, -0.5, -0.5 + SW], '1,0': [0.5 - SW, 0.5, -0.5, 0.5], '0,1': [-0.5, 0.5, 0.5 - SW, 0.5], '-1,0': [-0.5, -0.5 + SW, -0.5, 0.5] };
    for (const [dx, dy, a, b] of edges) {
      const n = nbT(dx, dy);
      if (!n || isRoadT(n)) continue;
      if (n.t === 'water') { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ink(ctx, 2.4); if (bridge) { ctx.save(); ctx.translate(0, -5); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ink(ctx, 1.2); ctx.restore(); for (let i = 0; i <= 4; i++) { const u = i / 4, x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 5); ink(ctx, 1); } } continue; }
      if (alley) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ink(ctx, 1.2); continue; }
      const [u0, u1, v0, v1] = side[dx + ',' + dy];
      quad(u0, u1, v0, v1, swCol, 0);
      ctx.strokeStyle = 'rgba(94,31,43,0.16)'; ctx.lineWidth = 0.6;
      for (let i = 1; i < 4; i++) { const k = -0.5 + i / 4; const A = dx ? L(u0, k) : L(k, v0), B = dx ? L(u1, k) : L(k, v1); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); }
      const inner = dx > 0 ? [L(u0, -0.5), L(u0, 0.5)] : dx < 0 ? [L(u1, -0.5), L(u1, 0.5)] : dy > 0 ? [L(-0.5, v0), L(0.5, v0)] : [L(-0.5, v1), L(0.5, v1)];
      ctx.beginPath(); ctx.moveTo(inner[0][0], inner[0][1]); ctx.lineTo(inner[1][0], inner[1][1]); ink(ctx, 1.5);
      // 낮은 거리 소품
      const h = hash(t.x * 3 + dx, t.y * 5 + dy, 11), mid = dx ? L((u0 + u1) / 2, 0) : L(0, (v0 + v1) / 2), mx = mid[0], my = mid[1];
      if (h < 0.13) this.planter(ctx, mx, my, season);
      else if (h < 0.19) this.bikes(ctx, mx, my);
      else if (h < 0.22) { ctx.beginPath(); ctx.rect(mx - 1.5, my - 5, 3, 5); ctx.fillStyle = '#e46b5f'; ctx.fill(); ink(ctx, 0.8); }
      else if (h < 0.25) { ctx.beginPath(); ctx.ellipse(mx, my - 1, 4, 2, 0, 0, 7); ctx.fillStyle = '#a99bd9'; ctx.fill(); ink(ctx, 0.7); }
    }
    // 교차로 안쪽 모서리: 대각선 칸이 땅이면 둥근 연석
    if (!alley) for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      if (!nb(sx, 0) || !nb(0, sy)) continue;
      const dn = nbT(sx, sy); if (!dn || isRoadT(dn) || dn.t === 'water') continue;
      const pts = []; for (let i = 0; i <= 6; i++) { const a2 = i / 6 * Math.PI / 2; pts.push(L(sx * (0.5 - SW * Math.sin(a2)), sy * (0.5 - SW * Math.cos(a2)))); }
      pts.push(L(sx * 0.5, sy * 0.5));
      poly(ctx, pts, swCol, 0);
      ctx.beginPath(); pts.slice(0, 7).forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ink(ctx, 1.5);
    }
  };
  R.planter = function (ctx, x, y, season) {
    poly(ctx, [[x - 6, y - 1], [x, y + 2], [x + 6, y - 1], [x + 6, y - 5], [x, y - 2], [x - 6, y - 5]], '#d9785f', 0.9);
    const fl = season === 'winter' ? ['#fbf7f7'] : season === 'autumn' ? ['#e39a4a', '#c94f6d'] : ['#e58ba3', '#f2d36b', '#fff8ee'];
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x - 4 + i * 2, y - 5 - (i % 2), 1.6, 0, 7); ctx.fillStyle = i % 2 ? '#8fb38a' : fl[i % fl.length]; ctx.fill(); }
  };
  R.bikes = function (ctx, x, y) {
    for (let i = 0; i < 2; i++) { const bx = x - 3 + i * 5, by = y + i * 2; ctx.beginPath(); ctx.arc(bx - 2.5, by, 2, 0, 7); ctx.arc(bx + 2.5, by + 1, 2, 0, 7); ink(ctx, 0.8); ctx.beginPath(); ctx.moveTo(bx - 2.5, by); ctx.lineTo(bx, by - 3); ctx.lineTo(bx + 2.5, by + 1); ctx.strokeStyle = ['#e46b5f', '#6f8fb5'][i]; ctx.lineWidth = 1; ctx.stroke(); }
  };
  R.streetTree = function (ctx, x, y, season, k) {
    ctx.fillStyle = 'rgba(94,31,43,0.12)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 1, 7, 3, 0, 0, 7); ctx.fill();
    poly(ctx, [[x - 4, y], [x, y + 2], [x + 4, y], [x, y - 2]], '#c9a27e', 0.7);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 14); ink(ctx, 2); ctx.strokeStyle = '#8a5a3c'; ctx.lineWidth = 1; ctx.stroke();
    const c = TREE[season];
    ctx.beginPath(); ctx.arc(x, y - 20, 7.5, 0, 7); ctx.moveTo(x + 10, y - 16); ctx.arc(x + 4, y - 16, 6, 0, 7); ctx.moveTo(x + 2, y - 16); ctx.arc(x - 4, y - 16, 6, 0, 7);
    ink(ctx, 2.4); ctx.fillStyle = c[k % 2]; ctx.fill();
  };
  R.trafficLight = function (ctx, x, y, green) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 22); ink(ctx, 1.4);
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - 2.5, y - 30, 5, 10, 2); else ctx.rect(x - 2.5, y - 30, 5, 10); ctx.fillStyle = '#3b2228'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 27.3, 1.6, 0, 7); ctx.fillStyle = green ? '#5a4448' : '#ff6b6b'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 22.7, 1.6, 0, 7); ctx.fillStyle = green ? '#7ee08a' : '#5a4448'; ctx.fill();
  };
  R.terrace = function (ctx, x, y, col, open, seed) {
    for (let i = 0; i < 2; i++) {
      const tx = x - 7 + i * 13, ty = y + (i ? 3 : -1);
      ctx.beginPath(); ctx.ellipse(tx, ty - 5, 4.5, 2.2, 0, 0, 7); ctx.fillStyle = '#fff8ee'; ctx.fill(); ink(ctx, 0.8);
      ctx.beginPath(); ctx.moveTo(tx, ty - 5); ctx.lineTo(tx, ty); ctx.moveTo(tx, ty - 5); ctx.lineTo(tx, ty - 17); ink(ctx, 0.9);
      ctx.beginPath(); ctx.moveTo(tx - 9, ty - 15); ctx.quadraticCurveTo(tx, ty - 22, tx + 9, ty - 15); ctx.closePath(); ctx.fillStyle = i ? '#fff8ee' : col; ctx.fill(); ink(ctx, 0.9);
      if (open && hash(seed, i) < 0.75) { walkerSit(ctx, tx - 5, ty, SHIRTS[(seed + i) % SHIRTS.length], HAIR[(seed + i * 3) % HAIR.length]); if (hash(seed, i, 3) < 0.5) walkerSit(ctx, tx + 5, ty + 1, SHIRTS[(seed + i + 4) % SHIRTS.length], HAIR[(seed + i) % HAIR.length]); }
    }
  };
  // 잔디에 누운 사람 (돗자리는 선택)
  function lying(ctx, x, y, shirt, mat) {
    if (mat) poly(ctx, [[x - 10, y - 1], [x + 1, y + 4.5], [x + 7, y + 1.5], [x - 4, y - 4]], mat, 0.8);
    ctx.beginPath(); ctx.moveTo(x - 7, y - 1); ctx.lineTo(x + 2, y + 3); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.stroke(); ctx.strokeStyle = shirt; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 2, y + 3); ctx.lineTo(x + 5, y + 4.3); ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.stroke(); ctx.strokeStyle = '#5d6a9e'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 8, y - 1.8, 1.8, 0, 7); ctx.fillStyle = '#f4d2bd'; ctx.fill(); ink(ctx, 0.6);
  }
  // 돗자리 소풍: 둘이 앉아 있고 바구니
  function picnic(ctx, x, y, sd) {
    poly(ctx, [[x - 9, y], [x, y + 4.5], [x + 9, y], [x, y - 4.5]], ['#e46b5f', '#f2d36b', '#9ea7de'][sd % 3], 0.8);
    ctx.beginPath(); ctx.moveTo(x - 4.5, y - 2.2); ctx.lineTo(x + 4.5, y + 2.2); ctx.moveTo(x + 4.5, y - 2.2); ctx.lineTo(x - 4.5, y + 2.2); ctx.strokeStyle = '#fff8ee'; ctx.lineWidth = 0.8; ctx.stroke();
    walkerSit(ctx, x - 4, y + 1, SHIRTS[(sd + 2) % 9], HAIR[(sd + 1) % 6]); walkerSit(ctx, x + 4, y + 1, SHIRTS[(sd + 5) % 9], HAIR[(sd + 4) % 6]);
    ctx.beginPath(); ctx.rect(x - 1.5, y - 3, 3, 2.4); ctx.fillStyle = '#c9a27e'; ctx.fill(); ink(ctx, 0.6);
  }
  function walkerSit(ctx, x, y, shirt, hair) {
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - 2, y - 7, 4, 4.5, 1.5); else ctx.rect(x - 2, y - 7, 4, 4.5); ctx.fillStyle = shirt; ctx.fill(); ink(ctx, 0.8);
    ctx.beginPath(); ctx.arc(x, y - 9, 1.8, 0, 7); ctx.fillStyle = '#f4d2bd'; ctx.fill(); ink(ctx, 0.7);
    ctx.beginPath(); ctx.arc(x, y - 9.6, 1.8, Math.PI, 0); ctx.fillStyle = hair; ctx.fill();
  }
  R.groundTile = function (ctx, t, season) {
    const S = this.S, p = iso(t.x, t.y), cx = p.x, cy = p.y, winter = season === 'winter';
    const edges = [[0, -1, [cx - HW, cy], [cx, cy - HH]], [1, 0, [cx, cy - HH], [cx + HW, cy]], [0, 1, [cx + HW, cy], [cx, cy + HH]], [-1, 0, [cx, cy + HH], [cx - HW, cy]]];
    if (t.t === 'road' || t.t === 'bridge') {
      this.roadTile(ctx, t, season, edges);
    } else if (t.t === 'water') {
      diamond(ctx, cx, cy, 1, t.sea ? '#7cc6cc' : '#86c3d3');
      if (t.sea) for (const [dx, dy, a, b] of edges) { const n = Sim.tile(S, t.x + dx, t.y + dy); if (n && n.t !== 'water') { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.6; for (let i = 0; i < 3; i++) { const u0 = 0.08 + i * 0.32, u1 = u0 + 0.22, f = 0.78; const p0 = [(a[0] + (b[0] - a[0]) * u0) * f + cx * (1 - f), (a[1] + (b[1] - a[1]) * u0) * f + cy * (1 - f)], p1 = [(a[0] + (b[0] - a[0]) * u1) * f + cx * (1 - f), (a[1] + (b[1] - a[1]) * u1) * f + cy * (1 - f)]; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 - 2.5, p1[0], p1[1]); ctx.stroke(); } } }
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); const wx = cx - 8 + hash(t.x, t.y, 2) * 10, wy = cy - 2 + hash(t.x, t.y, 3) * 4; ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 3, wy - 2, wx + 7, wy); ctx.stroke();
      for (const [dx, dy, a, b] of edges) { const n = Sim.tile(S, t.x + dx, t.y + dy); if (n && n.t !== 'water' && n.t !== 'bridge') { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ink(ctx, 1.4); } }
    } else if (t.t === 'mount') {
      diamond(ctx, cx, cy, 1, winter ? '#f6f1f1' : (hash(t.x, t.y) < 0.5 ? '#8ea760' : '#86a05a'));
      if (hash(t.x, t.y, 4) < 0.5) { ctx.beginPath(); ctx.ellipse(cx, cy, 10, 5, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.strokeStyle = 'rgba(94,31,43,0.3)'; ctx.lineWidth = 1; ctx.stroke(); }
    } else {
      const a = Sim.anchorOf(S, t);
      const k = a && a.b ? a.b.k : null;
      const paved = k && !['park', 'rpark'].includes(k) && !(k === 'lm' && a.b.kind === 'forest');
      if (k === 'rpark' && a.b.beach) { diamond(ctx, cx, cy, 1, winter ? '#f3ece4' : '#f3dfb4'); ctx.fillStyle = 'rgba(94,31,43,0.28)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(cx - 14 + hash(t.x, t.y, 30 + i) * 28, cy - 5 + hash(t.x, t.y, 40 + i) * 10, 0.8, 0, 7); ctx.fill(); } if (hash(t.x, t.y, 50) < 0.4) { ctx.beginPath(); const sx = cx - 8 + hash(t.x, t.y, 51) * 10, sy = cy - 2 + hash(t.x, t.y, 52) * 4; ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + 5, sy - 3, sx + 10, sy); ctx.strokeStyle = 'rgba(94,31,43,0.35)'; ctx.lineWidth = 0.8; ctx.stroke(); } }
      else if (k === 'rpark' || k === 'park' || (k === 'lm' && a.b.kind === 'forest')) diamond(ctx, cx, cy, 1, winter ? '#f6f1f1' : '#a9bd6e');
      else if (paved || ['off'].includes(Sim.HOODS[t.h].kind)) {
        diamond(ctx, cx, cy, 1, winter ? '#f6eeec' : PAVE);
        ctx.save(); diamondPath(ctx, cx, cy, 1); ctx.clip(); ctx.strokeStyle = 'rgba(94,31,43,0.16)'; ctx.lineWidth = 0.7;
        for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 8 - 30, cy + i * 4 + 15); ctx.lineTo(cx + i * 8 + 30, cy + i * 4 - 15); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + i * 8 - 30, cy - i * 4 - 15); ctx.lineTo(cx + i * 8 + 30, cy - i * 4 + 15); ctx.stroke(); }
        ctx.restore();
      } else {
        diamond(ctx, cx, cy, 1, hash(t.x, t.y) < 0.5 ? GRASS[season] : GRASS2[season]);
        ctx.strokeStyle = 'rgba(94,31,43,0.35)'; ctx.lineWidth = 0.8;
        for (let i = 0; i < 2; i++) { const gx = cx - 12 + hash(t.x, t.y, 10 + i) * 24, gy = cy - 5 + hash(t.x, t.y, 20 + i) * 10; ctx.beginPath(); ctx.moveTo(gx - 1.5, gy); ctx.lineTo(gx - 0.5, gy - 2.5); ctx.moveTo(gx + 0.5, gy); ctx.lineTo(gx + 1.5, gy - 2.5); ctx.stroke(); }
      }
    }
  };

  // ---------- 건물 ----------
  const GLASS = '#dcdcf4';
  const SHOP_SIGNS = ['약국', '편의점', '꽃집', '부동산', '미용실', '세탁소', '안경', '문구', '빵', '정육점', '서점', '은행'];
  R.drawBuilding = function (ctx, t, season, night, lod) {
    const S = this.S, b = t.b, k = b.k;
    const w = b.w || 1, d = b.d || 1;
    const g = geo(t.x, t.y, w, d);
    const seed = t.x * 31 + t.y * 17, hv = hash(t.x, t.y, 7);
    const snow = season === 'winter', lit = night > 0.3 ? 0.55 : 0;
    const roofSnow = c => snow ? '#fbf7f7' : c;
    if (k === 'store') { const st = S.stores.find(s => s.id === b.id); if (st) this.drawStore(ctx, st, g, season, night, lod); return; }
    if (k === 'fac') { const f = S.facs.find(x => x.id === b.id); if (f) this.drawFac(ctx, f, g, season, night, lod); return; }
    if (k === 'lm') { this.drawLandmark(ctx, b.kind, g, season, night, lod); return; }
    if (k === 'park' || k === 'rpark') {
      if (lod) { drawTree(ctx, g.c.x, g.c.y, season, 1); return; }
      const sd = t.x * 7 + t.y * 13, calm = night < 0.4 && season !== 'winter';
      if (k === 'park') {
        ctx.beginPath(); ctx.ellipse(g.c.x, g.c.y, 11, 5.5, 0, 0, 7); ctx.fillStyle = PAVE; ctx.fill(); ink(ctx); ctx.beginPath(); ctx.ellipse(g.c.x, g.c.y, 6.5, 3.2, 0, 0, 7); ctx.fillStyle = '#86c3d3'; ctx.fill(); ink(ctx, 1);
        if (calm) { picnic(ctx, g.c.x + 13, g.c.y + 6, sd); this.bench(ctx, g.c.x - 12, g.c.y + 7); walkerSit(ctx, g.c.x - 14, g.c.y + 5, SHIRTS[sd % 9], HAIR[sd % 6]); }
      }
      else if (b.beach) { this.beachProps(ctx, g.c.x, g.c.y, b.v, t.x * 7 + t.y, season, night); return; }
      else if (b.v === 0) { this.bench(ctx, g.c.x + 4, g.c.y + 2); if (calm && hash(sd, 1) < 0.7) { walkerSit(ctx, g.c.x + 1, g.c.y, SHIRTS[sd % 9], HAIR[sd % 6]); if (hash(sd, 2) < 0.4) walkerSit(ctx, g.c.x + 5, g.c.y + 2, SHIRTS[(sd + 3) % 9], HAIR[(sd + 2) % 6]); } }
      else if (b.v === 1) { ctx.beginPath(); ctx.moveTo(g.c.x - 12, g.c.y + 3); ctx.quadraticCurveTo(g.c.x, g.c.y - 4, g.c.x + 12, g.c.y + 3); ctx.strokeStyle = '#efdcd6'; ctx.lineWidth = 3; ctx.stroke(); if (calm && hash(sd, 3) < 0.6) lying(ctx, g.c.x + 6, g.c.y + 6, SHIRTS[sd % 9], null); }
      else if (calm && hash(sd, 4) < 0.7) { lying(ctx, g.c.x + 4, g.c.y + 4, SHIRTS[(sd + 1) % 9], ['#e46b5f', '#9ea7de', '#f2d36b'][sd % 3]); }
      drawTree(ctx, g.c.x - 10, g.c.y, season, 1 + (b.v || 0)); if (k === 'park') drawTree(ctx, g.c.x + 10, g.c.y - 4, season, 2);
      return;
    }
    if (k === 'bus') { this.drawBus(ctx, g.c.x, g.c.y); return; }
    const T2 = Sim.BTYPES[k]; if (!T2) return;
    let h = fh(b.lv);
    gshadow(ctx, g);
    if (lod) { const col = LODCOL[T2.cls] || '#e9d6d0'; fbox(ctx, g, Math.min(h, 120), col, roofSnow(shade(col, -0.2))); return; }
    switch (k) {
      case 'house': {
        const wall = WALLS[Math.floor(hv * WALLS.length)];
        fbox(ctx, g, h, wall);
        winBoxes(ctx, g, 'L', 2, h - 2, b.lv, 1.6, seed, lit);
        stoop(ctx, g, 'R', 0.5, shade(wall, -0.4));
        hedge(ctx, g, 'L', 0.1, 0.9, season);
        hipRoof(ctx, g, h, 12, roofSnow(ROOFS[Math.floor(hv * 9) % ROOFS.length]));
        { const p = iso(g.ax + 0.25, g.ay + 0.1); ctx.beginPath(); ctx.rect(p.x - 2.5, p.y - h - 12, 5, 9); ctx.fillStyle = '#c86a55'; ctx.fill(); ink(ctx, 0.8); }
        break;
      }
      case 'hanok': {
        const wall = ['#e58ba3', '#a99bd9', '#e3a63c', '#e46b5f', '#9ea7de', '#f0b6a8'][Math.floor(hv * 6)];
        fbox(ctx, g, h, wall, roofSnow(shade(wall, 0.35)));
        fq(ctx, g, 'L', 0, 1, h - 2.2, h, shade(wall, -0.2), 0.7); fq(ctx, g, 'R', 0, 1, h - 2.2, h, shade(wall, -0.25), 0.7);
        winBoxes(ctx, g, 'L', 10, h - 2, b.lv - 1, 2, seed, lit);
        winBoxes(ctx, g, 'R', 1, h - 2, b.lv, 1.5, seed + 4, lit);
        winBoxes(ctx, g, 'L', 1, 10, 1, 1, seed + 2, lit);
        stoop(ctx, g, 'L', 0.72, shade(wall, -0.35));
        hedge(ctx, g, 'L', 0.05, 0.55, season);
        ledgeG(ctx, g, h, roofSnow(shade(wall, 0.35)));
        if (hv < 0.5) scallop(ctx, g, h, '#fff4ea');
        roofLife(this, ctx, g, h, seed, season, night);
        break;
      }
      case 'villa': {
        const wall = ['#e9b8a0', '#d9c3a3', '#e58ba3', '#c9a27e', '#efd2c6'][Math.floor(hv * 5)];
        fbox(ctx, g, h, wall);
        winBoxes(ctx, g, 'L', 3, h - 2, b.lv, 2, seed, lit);
        winBoxes(ctx, g, 'R', 9, h - 2, b.lv - 1, 1, seed + 3, lit);
        stoop(ctx, g, 'R', 0.5, shade(wall, -0.4));
        if (hv < 0.55) gable(ctx, g, h, 13, ROOFC[Math.floor(hv * 50) % 5], shade(wall, -0.08), snow);
        else mansard(ctx, g, h, ROOFC[Math.floor(hv * 50) % 5], seed, lit, snow);
        const p = up(g.c, h + 3); ctx.beginPath(); ctx.ellipse(p[0] + 6, p[1] - 4, 4, 2, 0, 0, 7); ctx.fillStyle = '#9ea7de'; ctx.fill(); ink(ctx, 0.8); ctx.beginPath(); ctx.rect(p[0] + 2, p[1] - 4, 8, 4); ctx.fill(); ink(ctx, 0.8);
        break;
      }
      case 'oneroom': {
        const wall = ['#efe2d0', '#d0d2ee', '#e9d6d0', '#f0b6a8'][Math.floor(hv * 4)];
        fbox(ctx, g, h, wall);
        winBoxes(ctx, g, 'L', 3, h - 2, b.lv, 2.5, seed, lit * 1.2);
        winBoxes(ctx, g, 'R', 3, h - 2, b.lv, 1.5, seed + 5, lit * 1.2);
        if (hv < 0.6) mansard(ctx, g, h, ROOFC[Math.floor(hv * 70) % 5], seed, lit, snow);
        else { ledgeG(ctx, g, h, roofSnow(shade(wall, -0.1))); roofLife(this, ctx, g, h, seed, season, night); }
        if (hv < 0.5) { const p = fpt(g, 'R', 0.85); signBoard(ctx, p.x + 3, p.y - h * 0.6, 7, 20, '#fff8ee'); ctx.save(); ctx.translate(p.x + 3, p.y - h * 0.6); ctx.fillStyle = INK; ctx.font = '5.5px "Jua",sans-serif'; ctx.textAlign = 'center'; ctx.fillText('원', 0, -4); ctx.fillText('룸', 0, 3); ctx.restore(); }
        break;
      }
      case 'apt': {
        const wall = ['#fbf3e6', '#efe2d0', '#f3e6ee'][Math.floor(hv * 3)], stripe = ['#e46b5f', '#9ea7de', '#8fb38a', '#e3a63c'][Math.floor(hv * 9) % 4];
        fbox(ctx, g, h, wall);
        const n = Math.min(b.lv, 16);
        for (let r = 0; r < n; r++) { const v = 4 + (h - 8) * r / n; fq(ctx, g, 'L', 0.03, 0.97, v, v + 2.2, '#dcdcf4', 0.6); }
        for (let r = 0; r < n; r += 2) { const v = 4 + (h - 8) * r / n; fq(ctx, g, 'R', 0.15, 0.85, v, v + 2.2, night > 0.3 && hash(seed, r) < 0.6 ? '#ffd98a' : '#c8cbea', 0.6); }
        fq(ctx, g, 'R', 0.88, 0.97, 4, h, stripe, 0.8);
        mansard(ctx, g, h, ROOFC[Math.floor(hv * 40) % 5], seed, lit, snow);
        hedge(ctx, g, 'L', 0.05, 0.95, season);
        const p = fpt(g, 'R', 0.5); ctx.save(); ctx.fillStyle = stripe; ctx.font = '7px "Jua",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(['햇살', '푸른숲', '한별', '노을'][Math.floor(hv * 4)], p.x, p.y - h + 9); ctx.restore();
        break;
      }
      case 'luxury': {
        fbox(ctx, g, h, '#f6efe6', '#d8e6cf');
        fq(ctx, g, 'L', 0.08, 0.6, 3, h - 3, '#c8d8ef'); fq(ctx, g, 'L', 0.65, 0.95, 0, h - 3, '#b98a5e');
        fq(ctx, g, 'R', 0.1, 0.9, 3, h - 4, '#c8d8ef');
        for (let i = 1; i < 6; i++) fq(ctx, g, 'L', 0.08 + i * 0.087, 0.08 + i * 0.087, 3, h - 3, null, 0.6);
        const top = up(g.c, h); drawTree(ctx, top[0] - 6, top[1] + 2, season, 2); drawTree(ctx, g.L.x + 8, g.L.y + 2, season, 1);
        break;
      }
      case 'shop': {
        const wall = WALLS[Math.floor(hv * WALLS.length)];
        fbox(ctx, g, h, wall);
        fq(ctx, g, 'L', 0.08, 0.92, 2, 11, '#fff8ee');
        fq(ctx, g, 'L', 0.12, 0.88, 2, 9, night > 0.3 ? '#ffe2a0' : GLASS);
        this.awning(ctx, g, 'L', 11, ['#e46b5f', '#8fb38a', '#9ea7de', '#e3a63c'][Math.floor(hv * 4)]);
        if (b.lv > 1) winBoxes(ctx, g, 'L', 15, h - 2, b.lv - 1, 2, seed, lit);
        winBoxes(ctx, g, 'R', 4, h - 2, b.lv, 1, seed + 2, lit);
        if (hv < 0.35) { ledgeG(ctx, g, h, roofSnow(shade(wall, 0.3))); scallop(ctx, g, h, '#fff4ea'); }
        else if (hv < 0.7) gable(ctx, g, h, 12, ROOFC[Math.floor(hv * 30) % 5], shade(wall, -0.08), snow);
        if (hv >= 0.7) mansard(ctx, g, h, ROOFC[Math.floor(hv * 30) % 5], seed, lit, snow);
        if (night < 0.5) { const q = fpt(g, 'L', 0.25); poly(ctx, [[q.x - 7, q.y + 1], [q.x + 1, q.y + 5], [q.x + 1, q.y + 1], [q.x - 7, q.y - 3]], '#c9a27e', 0.8); for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(q.x - 6 + i * 1.7, q.y - 3 + i * 0.9, 1.5, 0, 7); ctx.fillStyle = ['#e46b5f', '#f2d36b', '#e3a63c'][i % 3]; ctx.fill(); ink(ctx, 0.4); } }
        if (hv < 0.35) roofLife(this, ctx, g, h, seed, season, night);
        const p = fpt(g, 'L', 0.5); signBoard(ctx, p.x, p.y - 17, 22, 8, '#fff8ee', SHOP_SIGNS[Math.floor(hv * SHOP_SIGNS.length)]);
        break;
      }
      case 'alley': {
        const wall = ['#e46b5f', '#e3a63c', '#d9677e', '#a3477a'][Math.floor(hv * 4)];
        fbox(ctx, g, h, wall);
        fq(ctx, g, 'L', 0.1, 0.9, 2, 11, night > 0.3 ? '#ffd88a' : '#f3e6cc');
        this.awning(ctx, g, 'L', 11, '#5e1f2b');
        const p = fpt(g, 'L', 0.5); signBoard(ctx, p.x, p.y - h - 4, 26, 9, '#fff2b8', ['포차', '고기집', '호프', '분식', '곱창', '노래방'][Math.floor(hv * 6)]);
        for (let i = 0; i < 4; i++) { const q = fpt(g, 'L', 0.15 + i * 0.23); ctx.beginPath(); ctx.arc(q.x, q.y - 13, 1.8, 0, 7); ctx.fillStyle = '#e46b5f'; ctx.fill(); ink(ctx, 0.6); if (night > 0.3) this._glows.push({ x: q.x, y: q.y - 13, r: 8, a: 0.7, c: '255,150,110' }); }
        break;
      }
      case 'plaza': {
        const wall = ['#e9d6d0', '#d0d2ee', '#f3e6cc'][Math.floor(hv * 3)];
        fbox(ctx, g, h, wall);
        fq(ctx, g, 'L', 0.04, 0.96, 1, 12, night > 0.3 ? '#ffe2a0' : GLASS);
        wins(ctx, g, 'L', 15, h - 3, b.lv - 1, 2, GLASS, lit, seed, 'ribbon');
        wins(ctx, g, 'R', 4, h - 3, b.lv, 1.5, GLASS, lit, seed + 1);
        // 세로 간판 줄
        for (let i = 0; i < Math.min(5, b.lv - 1); i++) { const q = fpt(g, 'L', 0.92); signBoard(ctx, q.x + 4, q.y - 18 - i * 10, 8, 8, ['#e46b5f', '#e3a63c', '#8fb38a', '#9ea7de', '#e58ba3'][(i + seed) % 5]); }
        mansard(ctx, g, h, ROOFC[Math.floor(hv * 13) % 5], seed, lit, snow);
        break;
      }
      case 'hotel': {
        fbox(ctx, g, h, '#efe2d0');
        wins(ctx, g, 'L', 14, h - 4, Math.min(12, b.lv), 2, GLASS, lit, seed, 'balcony');
        wins(ctx, g, 'R', 14, h - 4, Math.min(12, b.lv), 1.5, GLASS, lit, seed + 7);
        fq(ctx, g, 'L', 0.2, 0.8, 0, 11, '#b98a5e');
        mansard(ctx, g, h, '#5d6a9e', seed, lit, snow);
        const q = fpt(g, 'R', 0.92); signBoard(ctx, q.x + 3, q.y - h * 0.55, 9, 34, '#a3477a'); ctx.save(); ctx.fillStyle = '#fff8ee'; ctx.font = '6px "Jua",sans-serif'; ctx.textAlign = 'center'; 'HOTEL'.split('').forEach((c, i) => ctx.fillText(c, q.x + 3, q.y - h * 0.55 - 12 + i * 6.5)); ctx.restore();
        if (night > 0.3) this._glows.push({ x: q.x + 3, y: q.y - h * 0.55, r: 18, a: 0.7, c: '255,140,200' });
        break;
      }
      case 'office': {
        const wall = ['#a99bd9', '#9ea7de', '#e9d6d0', '#c8cbea'][Math.floor(hv * 4)];
        fbox(ctx, g, h, wall);
        wins(ctx, g, 'L', 4, h - 3, b.lv, 1, GLASS, night > 0.3 && this.hourF < 22 ? 0.5 : 0, seed, 'ribbon');
        wins(ctx, g, 'R', 4, h - 3, b.lv, 1, GLASS, night > 0.3 && this.hourF < 22 ? 0.5 : 0, seed + 1, 'ribbon');
        mansard(ctx, g, h, ROOFC[Math.floor(hv * 20) % 5], seed, night > 0.3 ? 0.4 : 0, snow);
        break;
      }
      case 'tower': {
        const wall = ['#efe2d0', '#f3e1c4', '#e9d6d0', '#f0dcc8'][Math.floor(hv * 4)];
        fbox(ctx, g, h, wall);
        fq(ctx, g, 'L', 0.02, 0.98, 0, 9, shade(wall, -0.12), 0.8); fq(ctx, g, 'R', 0.02, 0.98, 0, 9, shade(wall, -0.18), 0.8);
        for (let i = 0; i < 4 * w; i++) fq(ctx, g, 'L', (i + 0.2) / (4 * w), (i + 0.8) / (4 * w), 1, 7, night > 0.3 ? '#ffe2a0' : GLASS, 0.6);
        winBoxes(ctx, g, 'L', 10, h - 2, b.lv - 1, 3, seed, night > 0.3 && this.hourF < 22 ? 0.45 : 0);
        winBoxes(ctx, g, 'R', 10, h - 2, b.lv - 1, 3, seed + 1, night > 0.3 && this.hourF < 22 ? 0.45 : 0);
        for (let r = 1; r < b.lv; r += 2) { fq(ctx, g, 'L', 0, 1, 10 + r * (h - 12) / (b.lv - 1) - 0.8, 10 + r * (h - 12) / (b.lv - 1) + 0.8, '#fff4ea', 0.5); fq(ctx, g, 'R', 0, 1, 10 + r * (h - 12) / (b.lv - 1) - 0.8, 10 + r * (h - 12) / (b.lv - 1) + 0.8, '#fff4ea', 0.5); }
        mansard(ctx, g, h, ROOFC[Math.floor(hv * 9) % 5], seed, night > 0.3 ? 0.4 : 0, snow);
        break;
      }
      case 'cowork': {
        fbox(ctx, g, h, '#c86a55');
        for (let i = 1; i < 9; i++) fq(ctx, g, 'L', 0, 1, h * i / 9, h * i / 9, null, 0.4);
        winBoxes(ctx, g, 'L', 3, h - 3, b.lv, 1.6, seed, lit, '#f6ead6');
        winBoxes(ctx, g, 'R', 3, h - 3, b.lv, 1.2, seed + 2, lit, '#f6ead6');
        ledgeG(ctx, g, h, roofSnow('#3b2228'));
        roofLife(this, ctx, g, h, seed, season, night);
        break;
      }
      case 'knowledge': {
        fbox(ctx, g, h, '#e9e4ea');
        wins(ctx, g, 'L', 3, h - 3, b.lv, 3, '#c8cbea', night > 0.3 ? 0.4 : 0, seed);
        wins(ctx, g, 'R', 3, h - 3, b.lv, 3, '#c8cbea', night > 0.3 ? 0.4 : 0, seed + 4);
        ledgeG(ctx, g, h, roofSnow('#6f8fb5'));
        break;
      }
      case 'campus': {
        fbox(ctx, g, h, '#d9785f');
        wins(ctx, g, 'L', 3, h - 3, b.lv, 2, '#f6ead6', lit * 0.6, seed);
        wins(ctx, g, 'R', 3, h - 3, b.lv, 2, '#f6ead6', lit * 0.6, seed + 1);
        ledgeG(ctx, g, h, roofSnow('#efd2c6'));
        break;
      }
      case 'factory': {
        fbox(ctx, g, h, '#d9b8a8');
        fq(ctx, g, 'L', 0.2, 0.55, 0, h * 0.75, '#b9a99a');
        for (let i = 0; i < 3 * w; i++) { const a = fpt(g, 'L', i / (3 * w)), b2 = fpt(g, 'L', (i + 1) / (3 * w)); poly(ctx, [up(a, h), up(b2, h), up(b2, h + 9), up(a, h + 2)], roofSnow('#9ea7de'), 1); }
        const p = up(g.R, h); ctx.beginPath(); ctx.rect(p[0] - 10, p[1] - 22, 5, 22); ctx.fillStyle = '#c94f6d'; ctx.fill(); ink(ctx);
        break;
      }
    }
    if (k === 'house' && hash(t.x, t.y, 31) < 0.15 && night < 0.5) this.drawCat(ctx, g.B.x + 6, g.B.y + 2, t.x);
  };
  const LODCOL = { res: '#e9b8a0', com: '#e58ba3', off: '#a99bd9', edu: '#d9785f', ind: '#c9a27e', pub: '#a9bd6e' };
  R.awning = function (ctx, g, side, ay, col) {
    const n = Math.max(4, Math.round(5 * (side === 'L' ? g.w : g.d))), d = side === 'L' ? -3 : 3;
    for (let i = 0; i < n; i++) {
      const a = fpt(g, side, i / n), b = fpt(g, side, (i + 1) / n);
      ctx.beginPath(); ctx.moveTo(a.x, a.y - ay - 5); ctx.lineTo(b.x, b.y - ay - 5); ctx.lineTo(b.x + d, b.y - ay + 1);
      ctx.quadraticCurveTo((a.x + b.x) / 2 + d, (a.y + b.y) / 2 - ay + 4.5, a.x + d, a.y - ay + 1); ctx.closePath();
      ctx.fillStyle = i % 2 ? '#fff8ee' : col; ctx.fill(); ink(ctx, 0.8);
    }
  };
  R.beachProps = function (ctx, x, y, v, seed, season, night) {
    if (season === 'winter' || night > 0.5) { if (v === 0) this.bench(ctx, x, y); return; }
    const col = ['#e46b5f', '#f2d36b', '#9ea7de', '#e58ba3'][seed % 4];
    if (v === 2) { // 수건과 누운 사람
      poly(ctx, [[x - 9, y - 1], [x + 1, y + 4], [x + 6, y + 1], [x - 4, y - 4]], col, 0.8);
      ctx.beginPath(); ctx.moveTo(x - 6, y - 1); ctx.lineTo(x + 2, y + 2.5); ctx.strokeStyle = INK; ctx.lineWidth = 2.8; ctx.stroke(); ctx.strokeStyle = '#f4d2bd'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(x - 6.5, y - 1.5, 1.7, 0, 7); ctx.fillStyle = '#f4d2bd'; ctx.fill(); ink(ctx, 0.6);
      return;
    }
    // 파라솔과 선베드
    poly(ctx, [[x - 2, y + 2], [x + 8, y + 7], [x + 11, y + 5], [x + 1, y]], '#fff8ee', 0.8);
    ctx.beginPath(); ctx.moveTo(x - 4, y + 2); ctx.lineTo(x - 4, y - 16); ink(ctx, 1);
    ctx.beginPath(); ctx.moveTo(x - 16, y - 13); ctx.quadraticCurveTo(x - 4, y - 24, x + 8, y - 13); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ink(ctx, 0.9);
    ctx.beginPath(); ctx.moveTo(x - 10, y - 14.5); ctx.quadraticCurveTo(x - 6, y - 21, x - 4, y - 21); ctx.lineTo(x - 2, y - 14); ctx.closePath(); ctx.fillStyle = '#fff8ee'; ctx.fill(); ink(ctx, 0.6);
    if (v === 1) { ctx.beginPath(); ctx.arc(x + 12, y - 2, 3, 0, 7); ctx.fillStyle = '#e3a63c'; ctx.fill(); ink(ctx, 0.7); }
  };
  R.drawBus = function (ctx, cx, cy) {
    ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx - 12, cy - 18); ctx.moveTo(cx + 10, cy + 3); ctx.lineTo(cx + 10, cy - 14); ink(ctx, 1.8);
    poly(ctx, [[cx - 15, cy - 19], [cx + 15, cy - 14], [cx + 15, cy - 11], [cx - 15, cy - 16]], '#9ea7de');
    ctx.beginPath(); ctx.arc(cx + 17, cy - 22, 4, 0, 7); ctx.fillStyle = '#e3a63c'; ctx.fill(); ink(ctx, 1);
    this.bench(ctx, cx - 2, cy - 2);
  };
  R.pigeon = function (ctx, x, y, seed) {
    const bob = (Math.sin(this.t / 400 + seed) > 0.85 ? -1.5 : 0);
    ctx.beginPath(); ctx.ellipse(x, y + bob, 3, 2, 0, 0, 7); ctx.fillStyle = '#ece8ee'; ctx.fill(); ink(ctx, 0.8);
    ctx.beginPath(); ctx.arc(x + 2.6, y - 1.6 + bob, 1.4, 0, 7); ctx.fill(); ink(ctx, 0.7);
  };
  R.bench = function (ctx, x, y) {
    poly(ctx, [[x - 6, y - 4], [x + 2, y], [x + 2, y - 2], [x - 6, y - 6]], '#e58ba3', 1);
    ctx.beginPath(); ctx.moveTo(x - 5, y - 4); ctx.lineTo(x - 5, y - 1); ctx.moveTo(x + 1, y - 1); ctx.lineTo(x + 1, y + 2); ink(ctx, 1);
  };

  R.drawLandmark = function (ctx, kind, g, season, night, lod) {
    const snow = season === 'winter', rs = c => snow ? '#fbf7f7' : c, nl = night > 0.3;
    gshadow(ctx, g);
    const c = g.c;
    if (lod && kind !== 'tower') { fbox(ctx, g, 30, '#f2d36b', rs('#e3a63c')); return; }
    if (kind === 'palace') {
      // 시계탑 광장: 분수, 화단, 벤치, 가운데 시계탑
      const fp = iso(g.ax + 1, g.ay + 2.5);
      ctx.beginPath(); ctx.ellipse(fp.x, fp.y, 18, 9, 0, 0, 7); ctx.fillStyle = '#efe2d0'; ctx.fill(); ink(ctx, 1.2);
      ctx.beginPath(); ctx.ellipse(fp.x, fp.y - 1, 13, 6.5, 0, 0, 7); ctx.fillStyle = '#86c3d3'; ctx.fill(); ink(ctx, 1);
      ctx.beginPath(); ctx.rect(fp.x - 2, fp.y - 12, 4, 11); ctx.fillStyle = '#efe2d0'; ctx.fill(); ink(ctx, 1);
      if (!REDUCED) for (let i = 0; i < 3; i++) { const ph = (this.t / 900 + i / 3) % 1; ctx.beginPath(); ctx.arc(fp.x + (i - 1) * 4 * ph, fp.y - 13 - Math.sin(ph * Math.PI) * 6, 1.4, 0, 7); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill(); }
      for (const [dx, dy] of [[0.3, 0.6], [3.6, 0.6], [0.3, 3.4], [3.6, 3.2]]) { const p = iso(g.ax + dx, g.ay + dy); this.planter(ctx, p.x, p.y, season); }
      this.bench(ctx, iso(g.ax + 2.5, g.ay + 3.4).x, iso(g.ax + 2.5, g.ay + 3.4).y);
      const gt = geo(g.ax + 3, g.ay + 1, 1, 1, 0.18);
      fbox(ctx, gt, 58, '#e58ba3', rs('#c75b6a'));
      for (let i = 1; i < 6; i++) { fq(ctx, gt, 'L', 0, 1, i * 10, i * 10 + 1.5, '#fff4ea', 0.5); fq(ctx, gt, 'R', 0, 1, i * 10, i * 10 + 1.5, '#fff4ea', 0.5); }
      fq(ctx, gt, 'L', 0.35, 0.65, 0, 9, '#8a5a3c');
      for (const side of ['L', 'R']) { const p = fpt(gt, side, 0.5); ctx.beginPath(); ctx.ellipse(p.x, p.y - 48, 5, 5.5, side === 'L' ? 0.45 : -0.45, 0, 7); ctx.fillStyle = '#fff8ee'; ctx.fill(); ink(ctx, 1); const hh = ((this.hourF || 12) % 12) / 12 * Math.PI * 2 - Math.PI / 2; ctx.beginPath(); ctx.moveTo(p.x, p.y - 48); ctx.lineTo(p.x + Math.cos(hh) * 3, p.y - 48 + Math.sin(hh) * 3); ctx.moveTo(p.x, p.y - 48); ctx.lineTo(p.x, p.y - 52); ink(ctx, 0.8); }
      pyramid(ctx, gt.c.x, gt.c.y + HH * 0.64 * 0, 0.64, 58, 18, rs('#7d6fb8'));
      const tp = up(gt.c, 58 + 18); ctx.beginPath(); ctx.moveTo(tp[0], tp[1]); ctx.lineTo(tp[0], tp[1] - 8); ink(ctx, 1); poly(ctx, [[tp[0], tp[1] - 8], [tp[0] + 7, tp[1] - 6], [tp[0], tp[1] - 4]], '#f2d36b', 0.8);
      drawTree(ctx, g.L.x + 14, g.L.y - 2, season, 1); drawTree(ctx, g.R.x - 12, g.R.y + 2, season, 2);
    } else if (kind === 'cityhall') {
      fbox(ctx, g, 30, '#efe2d0'); for (let i = 0; i < 8; i++) fq(ctx, g, 'L', 0.06 + i * 0.12, 0.1 + i * 0.12, 0, 24, '#fbf3e6');
      wins(ctx, g, 'R', 4, 28, 2, 2, GLASS, nl ? 0.5 : 0, 5); ledgeG(ctx, g, 30, rs('#e3a63c'));
      const gt = geo(g.ax + 1, g.ay, 1, 1, 0.2); fbox(ctx, gt, 52, '#efe2d0', rs('#e3a63c'));
      const p = up(gt.c, 52); ctx.beginPath(); ctx.arc(p[0], p[1], 7, Math.PI, 0); ctx.fillStyle = '#e3a63c'; ctx.fill(); ink(ctx);
      ctx.beginPath(); ctx.moveTo(p[0], p[1] - 7); ctx.lineTo(p[0], p[1] - 18); ink(ctx, 1.2); poly(ctx, [[p[0], p[1] - 18], [p[0] + 9, p[1] - 15], [p[0], p[1] - 12]], '#e46b5f', 1);
    } else if (kind === 'tower') {
      // 달빛 등대: 빨강·크림 줄무늬, 밤에는 빛이 돌아감
      for (let i = 0; i < 6; i++) { const y0 = c.y - i * 10, w0 = 7 - i * 0.6, w1 = 7 - (i + 1) * 0.6; poly(ctx, [[c.x - w0, y0], [c.x + w0, y0], [c.x + w1, y0 - 10], [c.x - w1, y0 - 10]], i % 2 ? '#fff4ea' : '#e46b5f', 1); }
      ctx.beginPath(); ctx.rect(c.x - 5, c.y - 70, 10, 8); ctx.fillStyle = nl ? '#ffe9a0' : '#c8d8ef'; ctx.fill(); ink(ctx, 1);
      poly(ctx, [[c.x - 7, c.y - 70], [c.x + 7, c.y - 70], [c.x, c.y - 80]], '#5e1f2b', 1);
      ctx.beginPath(); ctx.moveTo(c.x - 8, c.y - 61); ctx.lineTo(c.x + 8, c.y - 61); ink(ctx, 2);
      if (nl) { const a2 = this.t / 1500; ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#fff2b0'; ctx.beginPath(); ctx.moveTo(c.x, c.y - 66); ctx.lineTo(c.x + Math.cos(a2) * 120, c.y - 66 + Math.sin(a2) * 40 - 10); ctx.lineTo(c.x + Math.cos(a2) * 120, c.y - 66 + Math.sin(a2) * 40 + 10); ctx.closePath(); ctx.fill(); ctx.restore(); this._glows.push({ x: c.x, y: c.y - 66, r: 18, a: 0.9, c: '255,240,170' }); }
    } else if (kind === 'univ') {
      for (const [dx, dy, ww, dd, hh] of [[0, 0, 2, 1, 26], [2, 1, 2, 2, 30], [0, 2, 1, 2, 22]]) { const gb = geo(g.ax + dx, g.ay + dy, ww, dd, 0.1); fbox(ctx, gb, hh, '#c86a55'); wins(ctx, gb, 'L', 3, hh - 3, 3, 2, '#f6ead6', nl ? 0.4 : 0, dx + dy); wins(ctx, gb, 'R', 3, hh - 3, 3, 2, '#f6ead6', 0, dx); ledgeG(ctx, gb, hh, rs('#efd2c6')); }
      const gt = geo(g.ax + 1, g.ay + 1, 1, 1, 0.25); fbox(ctx, gt, 48, '#c86a55', rs('#efd2c6'));
      const p = up(gt.c, 48); ctx.beginPath(); ctx.moveTo(p[0] - 8, p[1] + 2); ctx.lineTo(p[0], p[1] - 14); ctx.lineTo(p[0] + 8, p[1] + 2); ctx.closePath(); ctx.fillStyle = rs('#6f8fb5'); ctx.fill(); ink(ctx);
      ctx.beginPath(); ctx.arc(p[0] - 3, p[1] + 10, 3.2, 0, 7); ctx.fillStyle = '#fff8ee'; ctx.fill(); ink(ctx, 1);
      drawTree(ctx, g.B.x - 10, g.B.y - 6, season, 1); drawTree(ctx, g.B.x + 6, g.B.y - 12, season, 2);
    } else if (kind === 'market') {
      for (let i = 0; i < 3; i++) { const gs = geo(g.ax + i, g.ay, 1, 2, 0.12); fbox(ctx, gs, 14, '#efe2d0'); hipRoof(ctx, gs, 14, 8, i % 2 ? rs('#e46b5f') : rs('#e3a63c')); fq(ctx, gs, 'L', 0.1, 0.9, 1, 9, '#f6ead6'); }
      signBoard(ctx, c.x, c.y - 36, 40, 11, '#fff8ee', '토요 장터');
    } else if (kind === 'museum') {
      fbox(ctx, g, 30, '#e46b5f');
      const p = fpt(g, 'L', 0.35); ctx.beginPath(); ctx.arc(p.x, p.y - 17, 8, 0, 7); ctx.fillStyle = GLASS; ctx.fill(); ink(ctx);
      fq(ctx, g, 'R', 0.2, 0.5, 4, 26, '#f2d36b'); fq(ctx, g, 'R', 0.65, 0.85, 0, 13, INK);
      ledgeG(ctx, g, 30, rs('#f0b6a8'));
    } else if (kind === 'forest') {
      for (let i = 0; i < 9; i++) { const p = iso(g.ax + (i % 3), g.ay + Math.floor(i / 3)); drawTree(ctx, p.x + (hash(i, 3) - 0.5) * 14, p.y + (hash(i, 4) - 0.5) * 6, season, i); }
      ctx.beginPath(); const p = iso(g.ax + 1, g.ay + 1); ctx.ellipse(p.x, p.y + 4, 14, 6, 0, 0, 7); ctx.fillStyle = '#86c3d3'; ctx.fill(); ink(ctx, 1);
    } else if (kind === 'finance') {
      // 등대섬 전망대: 낮은 파스텔 건물 위 둥근 전망 데크
      fbox(ctx, g, 46, '#9ea7de', rs('#c8cbea'));
      winBoxes(ctx, g, 'L', 4, 44, 5, 2, 31, nl ? 0.5 : 0); winBoxes(ctx, g, 'R', 4, 44, 5, 2, 37, nl ? 0.5 : 0);
      ledgeG(ctx, g, 46, rs('#fff4ea')); scallop(ctx, g, 46, '#fff4ea');
      const p = up(g.c, 49); ctx.beginPath(); ctx.rect(p[0] - 2, p[1] - 16, 4, 16); ctx.fillStyle = '#fff4ea'; ctx.fill(); ink(ctx, 1);
      ctx.beginPath(); ctx.ellipse(p[0], p[1] - 18, 14, 6, 0, 0, 7); ctx.fillStyle = '#e3a63c'; ctx.fill(); ink(ctx, 1.2);
      ctx.beginPath(); ctx.ellipse(p[0], p[1] - 22, 11, 4.5, 0, Math.PI, 0); ctx.fillStyle = nl ? '#ffe2a0' : GLASS; ctx.fill(); ink(ctx, 1);
    } else if (kind === 'convention') {
      fbox(ctx, g, 26, '#d0d2ee');
      for (let i = 1; i < 12; i++) fq(ctx, g, 'L', i / 12, i / 12, 2, 24, null, 0.6);
      const p = up(g.c, 26); ctx.beginPath(); ctx.ellipse(p[0], p[1], 34, 14, 0, Math.PI, 0); ctx.fillStyle = rs('#a99bd9'); ctx.fill(); ink(ctx);
      signBoard(ctx, fpt(g, 'L', 0.5).x, fpt(g, 'L', 0.5).y - 20, 44, 10, '#fff8ee', '바람 음악당');
    } else if (kind === 'mall') {
      fbox(ctx, g, 40, '#e58ba3');
      fq(ctx, g, 'L', 0.05, 0.95, 2, 16, nl ? '#ffe2a0' : GLASS); fq(ctx, g, 'R', 0.05, 0.95, 2, 16, nl ? '#ffd88a' : GLASS);
      for (let i = 1; i < 10; i++) fq(ctx, g, 'L', i / 10, i / 10, 2, 16, null, 0.6);
      ledgeG(ctx, g, 40, rs('#f0b6a8'));
      const p = up(g.c, 43); ctx.beginPath(); ctx.ellipse(p[0], p[1], 20, 9, 0, Math.PI, 0); ctx.fillStyle = rs('#c8d8ef'); ctx.fill(); ink(ctx);
      const q = fpt(g, 'L', 0.5); signBoard(ctx, q.x, q.y - 30, 48, 13, '#fff8ee', '조개 아케이드');
    } else if (kind === 'amusement') {
      const p = iso(g.ax + 1, g.ay + 1); const r = 30, ang = this.t / 4000;
      ctx.beginPath(); ctx.moveTo(p.x - 12, p.y); ctx.lineTo(p.x, p.y - 40); ctx.lineTo(p.x + 12, p.y); ink(ctx, 2);
      ctx.beginPath(); ctx.arc(p.x, p.y - 40, r, 0, 7); ink(ctx, 2);
      for (let i = 0; i < 8; i++) { const a = ang + i * Math.PI / 4; const x = p.x + Math.cos(a) * r, y = p.y - 40 + Math.sin(a) * r; ctx.beginPath(); ctx.moveTo(p.x, p.y - 40); ctx.lineTo(x, y); ink(ctx, 0.8); ctx.beginPath(); ctx.arc(x, y + 3, 4, 0, 7); ctx.fillStyle = ['#e46b5f', '#e3a63c', '#9ea7de', '#8fb38a'][i % 4]; ctx.fill(); ink(ctx, 0.8); }
      // 롤러코스터 레일
      const q = iso(g.ax + 2, g.ay + 3);
      ctx.beginPath(); ctx.moveTo(q.x - 30, q.y); ctx.bezierCurveTo(q.x - 10, q.y - 40, q.x + 10, q.y + 10, q.x + 30, q.y - 30); ink(ctx, 2.2); ctx.strokeStyle = '#e46b5f'; ctx.lineWidth = 1; ctx.stroke();
      if (nl) this._glows.push({ x: p.x, y: p.y - 40, r: 40, a: 0.6, c: '255,170,220' });
    } else if (kind === 'stadium') {
      const p = g.c;
      ctx.beginPath(); ctx.ellipse(p.x, p.y - 10, 46, 24, 0, 0, 7); ctx.fillStyle = '#efe2d0'; ctx.fill(); ink(ctx, 1.6);
      ctx.beginPath(); ctx.ellipse(p.x, p.y - 12, 34, 17, 0, 0, 7); ctx.fillStyle = '#a9bd6e'; ctx.fill(); ink(ctx, 1.2);
      ctx.beginPath(); ctx.ellipse(p.x, p.y - 12, 14, 7, 0, 0, 7); ctx.strokeStyle = '#fff8ee'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(p.x, p.y - 10, 46, 24, 0, Math.PI * 0.05, Math.PI * 0.95); ctx.lineTo(p.x - 46, p.y + 2); ink(ctx, 1.4);
      if (nl) for (const s2 of [-1, 1]) this._glows.push({ x: p.x + s2 * 40, y: p.y - 40, r: 30, a: 0.8, c: '255,255,230' });
    }
  };

  R.drawStore = function (ctx, st, g, season, night, lod) {
    const S = this.S, comp = S.companies[st.owner], snow = season === 'winter';
    const arch = st.owned ? st.arch : 'basic', A = Sim.ARCH[arch];
    const floors = st.owned ? 2 : 1;
    const h = (19 + st.size * 4) * (floors === 2 ? 1.55 : 1);
    const open = this.hourF >= st.open && this.hourF < st.close;
    const wallCol = arch === 'basic' ? shade(comp.color, 0.55) : A.wall;
    gshadow(ctx, g);
    if (lod) { fbox(ctx, g, h, wallCol, comp.color); const p = up(g.c, h + 10); drawLogo(ctx, comp, p[0], p[1], 7); return; }
    if (this.cut) { this.drawStoreCut(ctx, st, g, season, night); return; }
    fbox(ctx, g, h, wallCol);
    if (arch === 'brick') { ctx.strokeStyle = 'rgba(94,31,43,0.35)'; ctx.lineWidth = 0.6; for (let i = 1; i < 9; i++) { fq(ctx, g, 'L', 0, 1, h * i / 9, h * i / 9, null, 0.5); fq(ctx, g, 'R', 0, 1, h * i / 9, h * i / 9, null, 0.5); } }
    if (arch === 'glass' || arch === 'greenhouse' || arch === 'container') { const n = arch === 'container' ? 10 : 6; for (let i = 1; i < n * g.w; i++) fq(ctx, g, 'L', i / (n * g.w), i / (n * g.w), 0, h, null, 0.6); for (let i = 1; i < n * g.d; i++) fq(ctx, g, 'R', i / (n * g.d), i / (n * g.d), 0, h, null, 0.6); }
    let roofTop = 3;
    if (arch === 'hanok') { curvedRoof(ctx, g, h, 13, A.roof, snow); roofTop = 13; }
    else if (A.roof && arch !== 'greenhouse') { hipRoof(ctx, g, h, arch === 'european' ? 20 : 12, snow ? '#fbf7f7' : A.roof); roofTop = arch === 'european' ? 20 : 12; }
    else if (arch === 'greenhouse') { hipRoof(ctx, g, h, 16, snow ? '#fbf7f7' : '#cfe7d2'); roofTop = 16; }
    else ledgeG(ctx, g, h, snow ? '#fbf7f7' : shade(wallCol, -0.12));
    const fh0 = floors === 2 ? h * 0.42 : h * 0.62, glow = night > 0.3 && open;
    fq(ctx, g, 'L', 0.08, 0.66, 3, fh0 * 0.78, glow ? '#ffe2a0' : GLASS);
    fq(ctx, g, 'L', 0.72, 0.9, 0, fh0 * 0.8, shade(comp.color, -0.2));
    fq(ctx, g, 'R', 0.12, 0.88, 3, fh0 * 0.78, glow ? '#ffd88a' : '#d0d2ee');
    if (floors === 2) { winBoxes(ctx, g, 'L', h * 0.52, h * 0.95, 1, 2, st.id, night > 0.3 ? 0.6 : 0); winBoxes(ctx, g, 'R', h * 0.52, h * 0.95, 1, 1.5, st.id + 1, night > 0.3 ? 0.6 : 0); }
    if (!A.roof && arch !== 'hanok') scallop(ctx, g, h, shade(comp.color, 0.7));
    this.awning(ctx, g, 'L', fh0 + 1, comp.color); this.awning(ctx, g, 'R', fh0 + 1, comp.color);
    const pp = fpt(g, 'L', 0.95); ctx.beginPath(); ctx.rect(pp.x + 2, pp.y - 6, 4, 4); ctx.fillStyle = '#d9785f'; ctx.fill(); ink(ctx, 0.8); ctx.beginPath(); ctx.arc(pp.x + 4, pp.y - 9, 3.4, 0, 7); ctx.fillStyle = '#8fb38a'; ctx.fill(); ink(ctx, 0.8);
    if (open) { const ab = fpt(g, 'L', 0.18); const x = ab.x - 6, y = ab.y + 4; poly(ctx, [[x - 3, y], [x, y - 9], [x + 3, y]], '#fff8ee', 0.8); ctx.beginPath(); ctx.arc(x, y - 4.5, 1.4, 0, 7); ctx.fillStyle = comp.color; ctx.fill(); }
    hedge(ctx, g, 'R', 0.1, 0.4, season);
    const sp = up(g.c, h + roofTop + 10);
    signBoard(ctx, sp[0] + 1, sp[1], 30, 15, '#fff8ee');
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    icon(ctx, Sim.CATS[st.cat].icon, sp[0] - 6, sp[1] + 0.5, 10, 1.9);
    drawLogo(ctx, comp, sp[0] + 8, sp[1] + 0.5, 5.2);
    if (st.franchise) { ctx.fillStyle = INK; ctx.font = '7px "Jua",sans-serif'; ctx.fillText('가맹', sp[0] + 1, sp[1] - 12); }
    if (!open) { ctx.fillStyle = INK; ctx.font = '7px "Jua",sans-serif'; const q = fpt(g, 'L', 0.4); ctx.fillText('CLOSED', q.x, q.y - 2); }
    if (['cafe', 'noodle', 'hansik', 'japanese', 'chinese', 'snack', 'chicken'].includes(st.cat) && open && st.served > 0) this.steam(ctx, sp[0] + 12, sp[1] + 10, st.id);
    if (open && st.delivery && Sim.CATS[st.cat].dlv > 0) { const ph = (this.t / 3000 + st.id * 0.3) % 1; if (ph < 0.5) this.scooter(ctx, g.R.x + 4 + ph * 30, g.R.y + 4 - ph * 15, comp.color); }
    if (glow) this._glows.push({ x: g.c.x, y: g.c.y - h * 0.25, r: 30 + 8 * g.w, a: 0.55 });
  };

  // ---------- 확대하면 매장 안이 보이는 단면 ----------
  // 지붕과 앞벽을 걷어 내고 바닥·뒷벽·가구·손님을 지도 위에 직접 그려요.
  function roomFit(st) {
    const [nx, ny] = Sim.ROOM[st.size], w = st.w || 1, d = st.d || 1, m = 0.07;
    const s = Math.min((w - 2 * m) / nx, (d - 2 * m) / ny);
    const x0 = st.x - 0.5 + m + ((w - 2 * m) - nx * s) / 2, y0 = st.y - 0.5 + m + ((d - 2 * m) - ny * s) / 2;
    const o = iso(x0, y0);
    return { s, tw: s * TW, ox: o.x, oy: o.y, x0, y0 };
  }
  R.drawStoreCut = function (ctx, st, g, season, night) {
    const S = this.S, comp = S.companies[st.owner], style = Sim.STYLES[st.interior.style];
    const arch = st.owned ? st.arch : 'basic', A = Sim.ARCH[arch];
    const wallCol = arch === 'basic' ? shade(comp.color, 0.55) : A.wall;
    const open = this.hourF >= st.open && this.hourF < st.close;
    const wh = 20;
    gshadow(ctx, g);
    // 바닥 (매장 전체)
    poly(ctx, [up(g.L, 0), up(g.B, 0), up(g.R, 0), up(g.T, 0)], style.floor, 1.2);
    ctx.save(); ctx.beginPath(); ctx.moveTo(g.L.x, g.L.y); ctx.lineTo(g.B.x, g.B.y); ctx.lineTo(g.R.x, g.R.y); ctx.lineTo(g.T.x, g.T.y); ctx.closePath(); ctx.clip();
    ctx.strokeStyle = 'rgba(94,31,43,0.18)'; ctx.lineWidth = 0.5;
    const n = Math.round(6 * (g.d)); for (let i = 1; i < n; i++) { const a = fpt(g, 'R', 1 - i / n), b = { x: g.L.x + (g.T.x - g.L.x) * (i / n), y: g.L.y + (g.T.y - g.L.y) * (i / n) }; void a; const p0 = iso(g.ax - 0.5 + g.m, g.ay - 0.5 + g.m + (g.d - 2 * g.m) * i / n), p1 = iso(g.ax + g.w - 0.5 - g.m, g.ay - 0.5 + g.m + (g.d - 2 * g.m) * i / n); ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke(); void b; }
    ctx.restore();
    // 뒷벽 두 면 (안쪽 면이 보임) + 벽 윗면 두께
    poly(ctx, [up(g.L, 0), up(g.T, 0), up(g.T, wh), up(g.L, wh)], style.wall, 1.1);
    poly(ctx, [up(g.T, 0), up(g.R, 0), up(g.R, wh), up(g.T, wh)], shade(style.wall, -0.06), 1.1);
    poly(ctx, [up(g.L, wh), up(g.T, wh), [g.T.x, g.T.y - wh - 2.5], [g.L.x, g.L.y - wh - 2.5]], wallCol, 0.9);
    poly(ctx, [up(g.T, wh), up(g.R, wh), [g.R.x, g.R.y - wh - 2.5], [g.T.x, g.T.y - wh - 2.5]], shade(wallCol, -0.1), 0.9);
    const sky = this.hourF >= 7 && this.hourF < 17 ? '#bfe0f3' : this.hourF >= 17 && this.hourF < 20 ? '#f6c9a0' : '#4a4f86';
    const wq = (a, b, u0, u1, v0, v1, col, lw) => { const p = u => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u }); poly(ctx, [[p(u0).x, p(u0).y - v0], [p(u1).x, p(u1).y - v0], [p(u1).x, p(u1).y - v1], [p(u0).x, p(u0).y - v1]], col, lw); };
    const nw = Math.max(1, Math.round(1.5 * g.w));
    for (let i = 0; i < nw; i++) { const u0 = (i + 0.25) / nw, u1 = (i + 0.75) / nw; wq(g.T, g.R, u0 - 0.03, u1 + 0.03, 7, 17, '#fff4ea', 0.7); wq(g.T, g.R, u0, u1, 8, 16, sky, 0.5); }
    wq(g.L, g.T, 0.35, 0.75, 9, 16, '#3e4a44', 0.7);
    wq(g.L, g.T, 0, 1, 0, 2.5, shade(style.accent, 0.3), 0.5); wq(g.T, g.R, 0, 1, 0, 2.5, shade(style.accent, 0.25), 0.5);
    // 가구와 사람
    const rf = roomFit(st);
    Renderer.drawInterior(null, S, st, { embed: { ctx, tw: rf.tw, ox: rf.ox, oy: rf.oy }, hour: Math.floor(this.hourF) % 24, t: this.t, visitors: (this.inside && this.inside[st.id] || []).length });
    // 앞쪽 낮은 벽 (입구는 비워 둠)
    const lowH = 3.2;
    poly(ctx, [up(g.L, 0), up(fpt(g, 'L', 0.78), 0), up(fpt(g, 'L', 0.78), lowH), up(g.L, lowH)], wallCol, 1);
    poly(ctx, [up(fpt(g, 'R', 0.2), 0), up(g.R, 0), up(g.R, lowH), up(fpt(g, 'R', 0.2), lowH)], shade(wallCol, -0.12), 1);
    for (const [a, b] of [[g.L, fpt(g, 'L', 0.78)], [fpt(g, 'R', 0.2), g.R]]) { ctx.beginPath(); ctx.moveTo(a.x, a.y - lowH); ctx.lineTo(b.x, b.y - lowH); ctx.strokeStyle = '#fff4ea'; ctx.lineWidth = 1.2; ctx.stroke(); }
    // 기둥과 간판
    for (const p of [g.L, g.B, g.R]) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - wh); ink(ctx, 1.4); }
    const sp = up(g.T, wh + 12);
    ctx.beginPath(); ctx.moveTo(g.T.x, g.T.y - wh - 2); ctx.lineTo(sp[0], sp[1] + 6); ink(ctx, 1);
    signBoard(ctx, sp[0] + 1, sp[1], 30, 14, '#fff8ee');
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    icon(ctx, Sim.CATS[st.cat].icon, sp[0] - 6, sp[1] + 0.5, 10, 1.9);
    drawLogo(ctx, comp, sp[0] + 8, sp[1] + 0.5, 5);
    if (!open) { ctx.fillStyle = INK; ctx.font = '7px "Jua",sans-serif'; ctx.fillText('CLOSED', g.c.x, g.c.y - 2); }
    if (open && night > 0.3) this._glows.push({ x: g.c.x, y: g.c.y - 8, r: 26 + 8 * g.w, a: 0.6 });
  };
  // 매장 출입문: 매장에 붙은 길 칸과, 문 안쪽 지점
  R.doorOf = function (st) {
    const S = this.S, w = st.w || 1, d = st.d || 1;
    const c = [];
    for (let i = 0; i < w; i++) c.push([st.x + i, st.y + d, st.x + i, st.y + d - 0.8]);
    for (let j = 0; j < d; j++) c.push([st.x + w, st.y + j, st.x + w - 0.8, st.y + j]);
    for (let i = 0; i < w; i++) c.push([st.x + i, st.y - 1, st.x + i, st.y - 0.2]);
    for (let j = 0; j < d; j++) c.push([st.x - 1, st.y + j, st.x - 0.2, st.y + j]);
    for (const [rx, ry, ix, iy] of c) if (roadAt(S, rx, ry)) return { rx, ry, ix, iy, sx: rx + (ix - rx) * 0.45, sy: ry + (iy - ry) * 0.45 };
    return null;
  };
  R.scooter = function (ctx, x, y, col) {
    ctx.beginPath(); ctx.arc(x - 3, y, 1.8, 0, 7); ctx.arc(x + 3, y + 1.5, 1.8, 0, 7); ctx.fillStyle = '#3b2228'; ctx.fill();
    poly(ctx, [[x - 4, y - 1], [x + 4, y + 1], [x + 3, y - 3], [x - 3, y - 5]], col, 0.8);
    walker(ctx, x, y - 2, '#fff8ee', '#3b2228', 0);
    ctx.beginPath(); ctx.rect(x - 5, y - 9, 4, 4); ctx.fillStyle = col; ctx.fill(); ink(ctx, 0.7);
  };
  R.drawFac = function (ctx, f, g, season, night, lod) {
    const S = this.S, comp = S.companies[f.owner], snow = season === 'winter', rs = c => snow ? '#fbf7f7' : c;
    gshadow(ctx, g);
    let h = 20;
    if (lod) { fbox(ctx, g, 30, shade(comp.color, 0.4), comp.color); const p = up(g.c, 40); drawLogo(ctx, comp, p[0], p[1], 7); return; }
    if (f.kind === 'warehouse') { h = 18 + f.level * 4; fbox(ctx, g, h, '#efe2d0', rs('#d9c3a3')); for (const u of [0.15, 0.55]) { fq(ctx, g, 'R', u, u + 0.3, 0, h * 0.7, '#c9b39a'); for (let i = 1; i < 5; i++) fq(ctx, g, 'R', u, u + 0.3, h * 0.14 * i, h * 0.14 * i, null, 0.6); } }
    else if (f.kind === 'kitchen' || f.kind === 'roastery') { h = 22 + (f.level || 1) * 4; fbox(ctx, g, h, f.kind === 'kitchen' ? '#f0b6a8' : '#c9a27e', snow ? '#fbf7f7' : null); wins(ctx, g, 'L', 4, h - 4, 1, 2, GLASS, 0, 2); const p = up(g.R, h); ctx.beginPath(); ctx.rect(p[0] - 12, p[1] - 16, 6, 16); ctx.fillStyle = '#d9785f'; ctx.fill(); ink(ctx); this.steam(ctx, p[0] - 9, p[1] - 16, f.id, true); }
    else if (f.kind === 'hq') { h = 90; fbox(ctx, g, h, shade(comp.color, 0.35)); wins(ctx, g, 'L', 6, h - 10, 12, 2, GLASS, night > 0.3 ? 0.6 : 0, f.id, 'ribbon'); wins(ctx, g, 'R', 6, h - 10, 12, 2, GLASS, night > 0.3 ? 0.6 : 0, f.id + 3, 'ribbon'); ledgeG(ctx, g, h, rs(comp.color)); fq(ctx, g, 'L', 0.3, 0.7, h - 9, h - 2, comp.color); const p = up(g.c, h + 18); drawLogo(ctx, comp, p[0], p[1], 10); }
    else if (f.kind === 'factory') { h = 22 + f.level * 3; fbox(ctx, g, h, '#e9d6d0'); for (let i = 0; i < 3 * g.w; i++) { const a = fpt(g, 'L', i / (3 * g.w)), b2 = fpt(g, 'L', (i + 1) / (3 * g.w)); poly(ctx, [up(a, h), up(b2, h), up(b2, h + 10), up(a, h + 2)], rs('#9ea7de'), 1); } const p = up(g.R, h); ctx.beginPath(); ctx.rect(p[0] - 10, p[1] - 28, 5, 28); ctx.fillStyle = '#c94f6d'; ctx.fill(); ink(ctx); this.steam(ctx, p[0] - 8, p[1] - 28, f.id, true); fq(ctx, g, 'R', 0.25, 0.6, 0, h * 0.6, '#c9b39a'); }
    else if (f.kind === 'rental') { h = fh(8 + f.level * 4); const wall = ['#e58ba3', '#a99bd9', '#f2d36b'][f.id % 3]; fbox(ctx, g, h, wall); wins(ctx, g, 'L', 4, h - 3, 8 + f.level * 4, 2.5, GLASS, night > 0.3 ? 0.55 : 0, f.id, 'balcony'); wins(ctx, g, 'R', 4, h - 3, 8 + f.level * 4, 2, GLASS, night > 0.3 ? 0.55 : 0, f.id + 9); ledgeG(ctx, g, h, rs(shade(wall, 0.3))); const p = up(g.c, h + 12); drawLogo(ctx, comp, p[0], p[1], 7); }
    else if (f.kind === 'smartfarm') { for (let i = 0; i < 2; i++) { const gg = geo(g.ax + i, g.ay, 1, g.d, 0.1); fbox(ctx, gg, 14, 'rgba(207,231,210,0.95)', rs('#cfe7d2')); hipRoof(ctx, gg, 14, 8, rs('#e8f3e9')); } h = 22; }
    if (f.kind !== 'hq' && f.kind !== 'rental') {
      const p = up(g.c, h + 14);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      signBoard(ctx, p[0] - 4, p[1], 26, 13, '#fff8ee'); icon(ctx, Sim.FAC[f.kind].icon, p[0] - 10, p[1], 10, 1.9); drawLogo(ctx, comp, p[0] + 4, p[1], 4.6);
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
    const p = iso(s2.x + 0.5, s2.y + 0.5), x = p.x + 30, y = p.y + 2;
    const cols = s2.line.split('').map(k => Sim.LINES[k].color);
    poly(ctx, [[x - 9, y], [x + 1, y + 5], [x + 1, y - 3], [x - 9, y - 8]], cols[0], 1.1);
    poly(ctx, [[x - 10, y - 8], [x + 2, y - 2], [x + 4, y - 4], [x - 8, y - 10]], '#e9d6d0', 1);
    ctx.beginPath(); ctx.moveTo(x + 5, y + 4); ctx.lineTo(x + 5, y - 16); ink(ctx, 1.4);
    cols.forEach((c, i) => { ctx.beginPath(); ctx.arc(x + 5 + i * 9, y - 19, 4.5, 0, 7); ctx.fillStyle = c; ctx.fill(); ink(ctx, 1); ctx.fillStyle = '#fff8ee'; ctx.font = '6.5px "Jua",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(Sim.LINES[s2.line[i]].name[0], x + 5 + i * 9, y - 18.6); });
    if (this.cam.z >= 0.65) { ctx.font = '8px "Jua",sans-serif'; const w = ctx.measureText(s2.name).width + 8; signBoard(ctx, x + 5, y - 31, w, 11, '#fff8ee', s2.name); }
  };
  R.drawLamp = function (ctx, x, y, night) {
    ctx.beginPath(); ctx.ellipse(x, y, 2.4, 1.2, 0, 0, 7); ctx.fillStyle = '#3b2228'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 22); ink(ctx, 1.6);
    ctx.beginPath(); ctx.moveTo(x - 1.6, y - 3); ctx.lineTo(x + 1.6, y - 3); ink(ctx, 1.2);
    const on = night > 0.3;
    poly(ctx, [[x - 2.6, y - 23], [x + 2.6, y - 23], [x + 3.4, y - 29], [x - 3.4, y - 29]], on ? '#ffe7a6' : '#f6ead6', 0.9);
    poly(ctx, [[x - 4, y - 29], [x + 4, y - 29], [x, y - 32]], '#3b2228', 0.8);
    if (night > 0.2) this._glows.push({ x, y: y - 22, r: 28, a: 0.45 });
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
    let guard = 0;
    while (q.length && guard++ < 5000) {
      const c = q.shift(); if (c.x === e.x && c.y === e.y) break;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = { x: c.x + dx, y: c.y + dy };
        if (!roadAt(S, n.x, n.y) || prev.has(k(n))) continue;
        prev.set(k(n), c); q.push(n);
      }
    }
    if (!prev.has(k(e))) return null;
    const out = []; let c = e; while (c) { out.unshift(c); c = prev.get(k(c)); }
    if (this.pathCache.size > 300) this.pathCache.clear();
    this.pathCache.set(key, out);
    return out;
  };
  R.onStep = function (ev) {
    for (const m of ev.money.slice(0, 10)) this.floaters.push({ x: m.x, y: m.y, v: m.v, t: 0 });
    for (const tr of ev.trucks.slice(0, 8)) { const p = this.path(tr.from, tr.to); if (p && p.length > 1) this.trucks.push({ p, i: 0, f: 0, color: tr.color }); }
    if (this.trucks.length > 24) this.trucks.splice(0, this.trucks.length - 24);
    if (this.floaters.length > 40) this.floaters.splice(0, this.floaters.length - 40);
  };
  // 길 위 사람: 산책·러닝·출근·강아지 산책·둘이 걷기
  const SPORT = ['#e46b5f', '#6fb7b2', '#f2d36b', '#9ea7de', '#e58ba3'];
  function newWalker(hour, weekend, o) {
    const commuteH = !weekend && ((hour >= 7 && hour < 10) || (hour >= 17 && hour < 20));
    const runH = (hour >= 6 && hour < 9) || (hour >= 17 && hour < 21);
    const r = Math.random();
    const kind = commuteH && r < 0.45 ? 'commute' : runH && r > 0.86 ? 'run' : 'stroll';
    const w = { f: 1, side: Math.random() < 0.5 ? -1 : 1, kind,
      c: kind === 'commute' ? ['#5d6a9e', '#3b2228', '#7a4a5a', '#efe2d0'][Math.floor(Math.random() * 4)] : kind === 'run' ? SPORT[Math.floor(Math.random() * SPORT.length)] : SHIRTS[Math.floor(Math.random() * SHIRTS.length)],
      hair: HAIR[Math.floor(Math.random() * HAIR.length)], c2: SHIRTS[Math.floor(Math.random() * SHIRTS.length)], hair2: HAIR[Math.floor(Math.random() * HAIR.length)],
      pair: kind === 'stroll' && Math.random() < 0.2, sp: kind === 'run' ? 1.5 + Math.random() * 0.5 : kind === 'commute' ? 0.95 + Math.random() * 0.2 : 0.45 + Math.random() * 0.3,
      umb: Math.random() < 0.8, dog: kind === 'stroll' && Math.random() < 0.09 };
    return Object.assign(w, o);
  }
  const ACTIVITY = [0.1, 0.05, 0.03, 0.03, 0.03, 0.08, 0.2, 0.5, 0.8, 0.7, 0.7, 0.85, 1, 0.95, 0.8, 0.8, 0.85, 0.9, 1, 0.9, 0.7, 0.5, 0.35, 0.2];
  function stepMover(S, w, dt, sp, phase) {
    if (w.enter != null || w.leave != null) return;
    if (w.path) {
      w.f += dt / 1000 * w.sp * sp;
      while (w.f >= 1) {
        w.f -= 1; w.pi++; w.x = w.tx; w.y = w.ty;
        if (w.pi >= w.path.length - 1) { w.path = null; w.enter = 0; w.f = 0; return; }
        const n = w.path[w.pi + 1]; w.dx = n.x - w.x; w.dy = n.y - w.y; w.tx = n.x; w.ty = n.y;
      }
      return;
    }
    w.f += dt / 1000 * w.sp * sp;
    if (w.f >= 1 && w.car && w.tx !== undefined) {
      // 다음 칸이 교차로이고 내 방향 신호가 빨간불이면 정지선에서 대기
      const cur = Sim.tile(S, w.tx, w.ty), nx = Sim.tile(S, w.tx + (w.dx || 0), w.ty + (w.dy || 0));
      if (cur && nx && !isCross(S, cur) && isCross(S, nx) && nx.road === 'ave' && ((w.dx ? 0 : 1) !== phase)) { w.f = 1; w.wait = true; return; }
      w.wait = false;
    }
    if (w.f >= 1) {
      w.x = w.tx; w.y = w.ty; w.f = 0;
      const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => { const t = Sim.tile(S, w.x + dx, w.y + dy); return t && (t.t === 'road' || t.t === 'bridge') && (!w.car || t.road !== 'alley'); });
      const fwd = opts.filter(([dx, dy]) => dx === w.dx && dy === w.dy);
      const back = opts.filter(([dx, dy]) => !(w.x + dx === w.px && w.y + dy === w.py));
      const L = w.car && fwd.length && Math.random() < 0.75 ? fwd : (back.length ? back : opts);
      const pk = L[Math.floor(Math.random() * L.length)];
      w.px = w.x; w.py = w.y;
      if (pk) { w.tx = w.x + pk[0]; w.ty = w.y + pk[1]; w.dx = pk[0]; w.dy = pk[1]; }
    }
  }
  R.updateMovers = function (dt, speed, view) {
    const S = this.S;
    const act = ACTIVITY[Math.floor(this.hourF) % 24] * (S.weather && (S.weather.kind === 'rain' || S.weather.kind === 'snow') ? 0.6 : 1);
    const lod = this.cam.z < 0.5;
    const area = Math.max(1, (view.x1 - view.x0) * (view.y1 - view.y0));
    const mobile = this.w < 760;
    const want = REDUCED || lod ? 0 : Math.min(mobile ? 90 : 170, Math.round(area / 14 * act));
    const wantCars = REDUCED || lod ? 0 : Math.min(mobile ? 24 : 50, Math.round(area / 60 * act));
    const roadsIn = () => { for (let i = 0; i < 40; i++) { const x = view.x0 + Math.floor(Math.random() * (view.x1 - view.x0)), y = view.y0 + Math.floor(Math.random() * (view.y1 - view.y0)); const t = Sim.tile(S, x, y); if (t && (t.t === 'road' || t.t === 'bridge')) return t; } return null; };
    const outside = m => m.x < view.x0 - 2 || m.x > view.x1 + 2 || m.y < view.y0 - 2 || m.y > view.y1 + 2;
    this.walkers = this.walkers.filter(m => !outside(m)); this.cars = this.cars.filter(m => !outside(m));
    const hr = Math.floor(this.hourF) % 24, wkend = S.day ? !!(S.day.weekend || S.day.holiday) : false;
    this.shoppers = (this.shoppers || []).filter(m => !outside(m));
    while (this.walkers.length < want) { const t = roadsIn(); if (!t) break; this.walkers.push(newWalker(hr, wkend, { x: t.x, y: t.y, tx: t.x, ty: t.y })); }
    if (this.walkers.length > want) this.walkers.length = want;
    while (this.cars.length < wantCars) { const t = roadsIn(); if (!t || t.road === 'alley') break; this.cars.push({ car: true, x: t.x, y: t.y, tx: t.x, ty: t.y, f: 1, c: CARS[Math.floor(Math.random() * CARS.length)], sp: 1.4 + Math.random() * 0.8, taxi: Math.random() < 0.15 }); }
    if (this.cars.length > wantCars) this.cars.length = wantCars;
    if (!speed) return;
    const sp = Math.min(2, Math.max(0.6, speed));
    for (const w of this.walkers) stepMover(S, w, dt, sp);
    this.updateShoppers(dt, sp, view, hr, wkend, mobile, lod);
    const phase = this.sigPhase || 0;
    for (const c of this.cars) stepMover(S, c, dt, sp, phase);
    for (const tr of this.trucks) { tr.f += dt / 1000 * 3 * Math.min(3, speed); while (tr.f >= 1) { tr.f -= 1; tr.i++; } }
    this.trucks = this.trucks.filter(tr => tr.i < tr.p.length - 1);
    for (const f of this.floaters) f.t += dt;
    this.floaters = this.floaters.filter(f => f.t < 1800);
  };

  // 손님: 매장 수요에 맞춰 근처 길에서 출발해 문으로 걸어 들어가고, 잠시 머문 뒤 컵을 들고 나와요
  R.updateShoppers = function (dt, sp, view, hr, wkend, mobile, lod) {
    const S = this.S;
    this.inside = this.inside || {}; this.shopT = this.shopT || {}; this.doors = this.doors || new Map();
    if (!lod && this.cam.z >= 0.9) for (const st of S.stores) {
      if (st.x < view.x0 - 1 || st.x > view.x1 + 1 || st.y < view.y0 - 1 || st.y > view.y1 + 1) continue;
      if (hr < st.open || hr >= st.close) continue;
      const nt = this.shopT[st.id];
      if (nt == null || nt > this.t + 20000) { this.shopT[st.id] = this.t + Math.random() * 2500; continue; }
      if (this.t < nt) continue;
      const rate = st.hourly[hr] || st.hourly[(hr + 23) % 24] || 0;
      this.shopT[st.id] = this.t + Math.min(14000, Math.max(1500, 9000 / (0.3 + rate / 8))) * (0.6 + Math.random() * 0.8);
      if (this.shoppers.length >= (mobile ? 14 : 30)) continue;
      let dc = this.doors.get(st.id);
      if (!dc || dc.v !== S.mapVer) { dc = { v: S.mapVer, d: this.doorOf(st) }; this.doors.set(st.id, dc); }
      const door = dc.d; if (!door) continue;
      let start = null;
      for (let k = 0; k < 14 && !start; k++) { const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 4; const t = Sim.tile(S, Math.round(door.rx + Math.cos(a) * r), Math.round(door.ry + Math.sin(a) * r)); if (t && t.t === 'road') start = t; }
      if (!start) continue;
      const path = this.path(start, { x: door.rx, y: door.ry });
      if (!path || path.length < 2 || path.length > 16) continue;
      const p2 = path.slice(), last = p2[p2.length - 1];
      if (last.x !== door.rx || last.y !== door.ry) { if (Math.abs(last.x - door.rx) + Math.abs(last.y - door.ry) !== 1) continue; p2.push({ x: door.rx, y: door.ry }); }
      if (p2.length < 2) continue;
      this.shoppers.push(newWalker(hr, wkend, { path: p2, pi: 0, x: p2[0].x, y: p2[0].y, tx: p2[1].x, ty: p2[1].y, f: 0, dx: p2[1].x - p2[0].x, dy: p2[1].y - p2[0].y, shop: st.id, door, kind: 'stroll', pair: false, dog: false, sp: 0.75 + Math.random() * 0.3 }));
    }
    for (const w of this.shoppers) {
      stepMover(S, w, dt, sp);
      if (w.enter != null) { w.enter += dt / 1000 * 1.3 * sp; if (w.enter >= 1) { w.gone = true; (this.inside[w.shop] || (this.inside[w.shop] = [])).push({ until: this.t + 6000 + Math.random() * 10000, w }); } }
      else if (w.leave != null) { w.leave += dt / 1000 * 1.3 * sp; if (w.leave >= 1) { w.leave = null; w.x = w.tx = w.door.rx; w.y = w.ty = w.door.ry; w.f = 1; w.done = true; } }
    }
    for (const w of this.shoppers) if (w.done) { w.done = false; w.shop = null; w.gone = true; this.walkers.push(w); }
    this.shoppers = this.shoppers.filter(w => !w.gone);
    for (const id in this.inside) {
      const L = this.inside[id];
      for (let i = L.length - 1; i >= 0; i--) if (this.t > L[i].until) { const v = L.splice(i, 1)[0].w; v.gone = false; v.enter = null; v.leave = 0; v.cup = true; this.shoppers.push(v); }
    }
  };
  // 그릴 위치: 길 위(인도 쪽), 문으로 들어가는 중, 나오는 중
  function walkerPos(w) {
    if (w.enter != null || w.leave != null) {
      const k = w.enter != null ? w.enter : 1 - w.leave, D = w.door;
      const fx = k < 0.5 ? D.rx + (D.sx - D.rx) * k * 2 : D.sx + (D.ix - D.sx) * (k - 0.5) * 2, fy = k < 0.5 ? D.ry + (D.sy - D.ry) * k * 2 : D.sy + (D.iy - D.sy) * (k - 0.5) * 2;
      return { fx, fy, p: iso(fx, fy), moving: true };
    }
    const fx = w.x + (w.tx - w.x) * w.f, fy = w.y + (w.ty - w.y) * w.f;
    return { fx, fy, moving: true };
  }
  function drawCar(ctx, x, y, dx, dy, col, taxi) {
    const along = dx !== 0 ? 'x' : 'y';
    const s = 0.24, sy = 0.14;
    ctx.save(); ctx.translate(x, y);
    const L = along === 'x' ? [HW * s, HH * s] : [-HW * s, HH * s];
    const Wd = along === 'x' ? [-HW * sy, HH * sy] : [HW * sy, HH * sy];
    const P = (a, b, h) => [L[0] * a + Wd[0] * b, L[1] * a + Wd[1] * b - h];
    const pts = (h) => [P(-1, -1, h), P(1, -1, h), P(1, 1, h), P(-1, 1, h)];
    ctx.fillStyle = 'rgba(94,31,43,0.15)'; ctx.beginPath(); ctx.ellipse(1, 2, 9, 4.5, 0, 0, 7); ctx.fill();
    const b0 = pts(2), b1 = pts(7);
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

  // ---------- 건물 그림 캐시 ----------
  R.spriteFor = function (t, season, night, sc) {
    const b = t.b, w = b.w || 1, d = b.d || 1;
    const nf = night > 0.3 ? (this.hourF < 22 ? 2 : 1) : 0;
    const key = `${t.y * Sim.W + t.x}|${b.k}|${b.kind || ''}|${b.lv}|${w}x${d}|${season === 'winter' ? 1 : 0}|${nf}|${sc}`;
    const cache = this.sprites || (this.sprites = new Map());
    let sp = cache.get(key);
    if (sp) { cache.delete(key); cache.set(key, sp); return sp; }
    // 배율만 다른 예전 그림이 있고 예산을 다 썼으면 그것을 잠깐 씀
    const base = key.slice(0, key.lastIndexOf('|')), latest = this.spriteLast || (this.spriteLast = new Map());
    const old = latest.get(base);
    if (old) { latest.delete(base); latest.set(base, old); }
    if (this._budget <= 0) return old || null;   // 처음 보는 건물은 이번 프레임엔 간단한 상자로 그림
    const t0 = performance.now();
    const g = geo(t.x, t.y, w, d);
    const tall = b.k === 'lm' ? 230 : fh(b.lv || 1) + (['hotel', 'tower', 'alley', 'villa', 'oneroom'].includes(b.k) ? 34 : 22);
    const minX = g.L.x - 14, maxX = g.R.x + 14, minY = g.T.y - tall, maxY = g.B.y + 10;
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil((maxX - minX) * sc)); cv.height = Math.max(1, Math.ceil((maxY - minY) * sc));
    const c2 = cv.getContext('2d'); c2.setTransform(sc, 0, 0, sc, -minX * sc, -minY * sc);
    const saved = this._glows; this._glows = [];
    this.drawBuilding(c2, t, season, night, false);
    sp = { cv, minX, minY, sc, glows: this._glows };
    this._glows = saved;
    cache.set(key, sp); latest.set(base, sp);
    const cap = Math.max(300, Math.min(2400, Math.round((this._visB || 400) * 1.5)));
    while (cache.size > cap) cache.delete(cache.keys().next().value);
    while (latest.size > cap * 2) latest.delete(latest.keys().next().value);
    this._budget -= performance.now() - t0;
    return sp;
  };
  R.bakeOverview = function (season, night) {
    const S = this.S, key = S.mapVer + ':' + season + ':' + (night > 0.3 ? 1 : 0);
    if (this.ov && this.ov.key === key) return this.ov;
    const sc = 0.32;
    const minX = iso(0, Sim.H - 1).x - HW, maxX = iso(Sim.W - 1, 0).x + HW, minY = -HH - 140, maxY = iso(Sim.W - 1, Sim.H - 1).y + HH + 20;
    const cv = (this.ov && this.ov.cv) || document.createElement('canvas');
    cv.width = Math.ceil((maxX - minX) * sc); cv.height = Math.ceil((maxY - minY) * sc);
    const c2 = cv.getContext('2d'); c2.setTransform(sc, 0, 0, sc, -minX * sc, -minY * sc);
    const nch = Math.ceil(Sim.W / CH);
    for (let cy = 0; cy < nch; cy++) for (let cx = 0; cx < nch; cx++) { const bd = this.chunkBounds(cx, cy), ch = this.getChunk(cx, cy, season); c2.drawImage(ch.cv, bd.minX, bd.minY, ch.cv.width / ch.sc, ch.cv.height / ch.sc); }
    const items = [];
    for (const t of S.tiles) { if (t.b) items.push({ d: t.x + (t.b.w || 1) - 1 + t.y + (t.b.d || 1) - 1, t }); else if (t.ref == null && (t.tree || t.t === 'mount')) items.push({ d: t.x + t.y, tree: t }); }
    items.sort((a, b) => a.d - b.d);
    const saved = this._glows; this._glows = [];
    for (const it of items) {
      if (it.t) this.drawBuilding(c2, it.t, season, night, true);
      else { const p = iso(it.tree.x, it.tree.y); c2.beginPath(); c2.arc(p.x, p.y - 8, 8, 0, 7); c2.fillStyle = it.tree.t === 'mount' ? (season === 'winter' ? '#f7f3f3' : '#6f8f55') : TREE[season][0]; c2.fill(); c2.strokeStyle = INK; c2.lineWidth = 1.4; c2.stroke(); }
    }
    this._glows = saved;
    this.ov = { cv, key, minX, minY, sc };
    return this.ov;
  };

  // ---------- 도시 그리기 ----------
  R.draw = function (dt, speed) {
    const S = this.S; if (!S) return;
    const paused = !speed;
    const adt = paused ? 0 : dt;           // 정지하면 모든 움직임이 멈춰요
    this.t += adt; this._glows = [];
    this._budget = 8; this._budgetG = 6;   // 프레임마다 건물·바닥 캐시 굽기에 쓸 수 있는 시간(ms)
    const ctx = this.ctx, z = this.cam.z, dpr = this.dpr;
    const season = Sim.seasonOf(S);
    const hf = this.hourF, night = darkness(hf), dusk = duskTint(hf);
    const wk = S.weather ? S.weather.kind : 'sun';
    const lod = z < 0.5;
    // 지붕 걷기: 확대할 땐 1.5배, 축소할 땐 1.35배에서 바뀜(경계에서 깜박이지 않게)
    this.cut = this.cut ? z >= 1.35 : z >= 1.5;
    // 신호등: 게임 시각이 아니라 화면 시간 7초마다 바뀜(하루 1분 속도에서 깜박이지 않게). 정지하면 멈춤
    this.sigPhase = Math.floor(this.t / 7000) % 2;
    // 보이는 범위 (월드 좌표 + 타일 범위)
    const wv = { x0: this.toWorld(0, 0).x - 80, x1: this.toWorld(this.w, 0).x + 80, y0: this.toWorld(0, 0).y - 60, y1: this.toWorld(0, this.h).y + 260 };
    const tl = [[wv.x0, wv.y0], [wv.x1, wv.y0], [wv.x0, wv.y1], [wv.x1, wv.y1]].map(([x, y]) => ({ x: (y / HH + x / HW) / 2, y: (y / HH - x / HW) / 2 }));
    const view = { x0: Math.max(0, Math.floor(Math.min(...tl.map(p => p.x)))), x1: Math.min(Sim.W - 1, Math.ceil(Math.max(...tl.map(p => p.x)))), y0: Math.max(0, Math.floor(Math.min(...tl.map(p => p.y)))), y1: Math.min(Sim.H - 1, Math.ceil(Math.max(...tl.map(p => p.y)))) };
    this.updateMovers(adt, speed, view);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const BG = { spring: '#f3ddd6', summer: '#ecdcd2', autumn: '#f1dccb', winter: '#ece4ea' }[season];
    ctx.fillStyle = BG; ctx.fillRect(0, 0, this.w, this.h);
    ctx.setTransform(z * dpr, 0, 0, z * dpr, (this.w / 2 - this.cam.x * z) * dpr, (this.h / 2 - this.cam.y * z) * dpr);
    const L0 = iso(0, Sim.H - 1), B0 = iso(Sim.W - 1, Sim.H - 1), R0 = iso(Sim.W - 1, 0);
    poly(ctx, [[L0.x - HW, L0.y], [B0.x, B0.y + HH], [B0.x, B0.y + HH + 18], [L0.x - HW, L0.y + 18]], '#d9a98f', 1.6);
    poly(ctx, [[B0.x, B0.y + HH], [R0.x + HW, R0.y], [R0.x + HW, R0.y + 18], [B0.x, B0.y + HH + 18]], '#c48f78', 1.6);
    if (lod) {
      const ov = this.bakeOverview(season, night);
      ctx.drawImage(ov.cv, ov.minX, ov.minY, ov.cv.width / ov.sc, ov.cv.height / ov.sc);
      for (const st of S.stores) { const g = geo(st.x, st.y, st.w || 1, st.d || 1); drawLogo(ctx, S.companies[st.owner], g.c.x, g.c.y - 46, 9); }
      const ovp0 = this.overlay && this.overlay.type === 'potential' && this.overlay.data;
      if (ovp0) { const max = Math.max(1, ...ovp0.map(o => o.cust)); for (const o of ovp0) { const p = iso(o.x, o.y), k = o.cust / max; if (k < 0.2) continue; diamondPath(ctx, p.x, p.y, 0.95); ctx.fillStyle = `rgba(${Math.round(150 - 70 * k)},${Math.round(185 - 10 * k)},${Math.round(110 - 30 * k)},${(0.4 + 0.5 * k).toFixed(2)})`; ctx.fill(); } this.drawPotentialTags(ctx, ovp0); }
      if (this.overlay && this.overlay.type === 'logistics') this.drawLogistics(ctx);
      if (this.sel) { const st = Sim.anchorOf(S, Sim.tile(S, this.sel.x, this.sel.y)); const b = st && st.b; const g = geo(st.x, st.y, b ? b.w || 1 : 1, b ? b.d || 1 : 1, -0.03); ctx.beginPath(); ctx.moveTo(g.T.x, g.T.y); ctx.lineTo(g.R.x, g.R.y); ctx.lineTo(g.B.x, g.B.y); ctx.lineTo(g.L.x, g.L.y); ctx.closePath(); ctx.strokeStyle = '#e3a63c'; ctx.lineWidth = 6; ctx.stroke(); }
      if (night > 0) { ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(70,62,120,${night * 0.8})`; ctx.fillRect(0, 0, this.w, this.h); ctx.restore(); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.drawHoodLabels(ctx);
      if (paused) { ctx.fillStyle = 'rgba(94,31,43,0.08)'; ctx.fillRect(0, 0, this.w, this.h); }
      return;
    }
    // 바닥 구역
    const nch = Math.ceil(Sim.W / CH);
    const visCh = []; for (let cy = 0; cy < nch; cy++) for (let cx = 0; cx < nch; cx++) { const bd = this.chunkBounds(cx, cy); if (!(bd.maxX < wv.x0 || bd.minX > wv.x1 || bd.maxY < wv.y0 - 200 || bd.minY > wv.y1)) visCh.push([cx, cy, bd]); }
    this._visChunks = visCh.length;
    for (const [cx, cy, bd] of visCh) {
      const ch = this.getChunk(cx, cy, season);
      ctx.drawImage(ch.cv, bd.minX, bd.minY, ch.cv.width / ch.sc, ch.cv.height / ch.sc);
    }
    if (!lod) {
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1;
      for (let y = view.y0; y <= view.y1; y++) for (let x = view.x0; x <= view.x1; x++) {
        const t = S.tiles[y * Sim.W + x]; if (t.t !== 'water' || hash(x, y, 1) > 0.35) continue;
        const p = iso(x, y), ph = (this.t / 2400 + hash(x, y, 9)) % 1;
        ctx.globalAlpha = Math.sin(ph * Math.PI); ctx.beginPath(); ctx.moveTo(p.x - 6 + ph * 6, p.y + 4 - ph * 3); ctx.quadraticCurveTo(p.x - 3 + ph * 6, p.y + 2 - ph * 3, p.x + ph * 6, p.y + 4 - ph * 3); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (this.overlay && this.overlay.type === 'logistics') this.drawLogistics(ctx);

    const items = [];
    const inView = (px, py) => px > wv.x0 && px < wv.x1 && py > wv.y0 && py < wv.y1;
    for (let y = view.y0; y <= view.y1; y++) for (let x = view.x0; x <= view.x1; x++) {
      const t = S.tiles[y * Sim.W + x];
      if (t.b) { const w = t.b.w || 1, d = t.b.d || 1; items.push({ d: x + w - 1 + y + d - 1, t }); continue; }
      if (t.ref != null) continue;
      const p = iso(x, y); if (!inView(p.x, p.y)) continue;
      if (t.tree) items.push({ d: x + y, tree: t });
      else if (t.t === 'mount' && hash(x, y, 5) < 0.75) items.push({ d: x + y, pine: t });
      if (!lod && t.t === 'road' && t.road !== 'alley') {
        const landE = [[0, -1], [1, 0], [0, 1], [-1, 0]].filter(([dx, dy]) => { const n = Sim.tile(S, x + dx, y + dy); return n && n.t === 'land'; });
        if (landE.length === 1 && !isCross(S, t)) {
          const [dx, dy] = landE[0];
          const sp = iso(x + dx * 0.36, y + dy * 0.36);
          if ((t.road === 'ave' && (x + y) % 2 === 0) || (t.road === 'st' && hash(x, y, 13) < 0.3)) items.push({ d: x + y + 0.35, stree: sp, k: x + y });
          else if ((x * 7 + y * 3) % 9 === 0) items.push({ d: x + y + 0.4, lamp: { sp } });
        }
        if (t.road === 'ave' && isCross(S, t)) { const nX = Sim.tile(S, x - 1, y), nY = Sim.tile(S, x, y - 1); if ((isRoadT(nX) && !isCross(S, nX)) || (isRoadT(nY) && !isCross(S, nY))) items.push({ d: x + y + 0.45, tlight: t }); }
      }
    }
    // 지도 밖으로 비어져 나온 큰 건물(왼쪽·위쪽 앵커)도 포함
    for (let y = Math.max(0, view.y0 - 4); y < view.y0; y++) for (let x = view.x0; x <= view.x1; x++) { const t = S.tiles[y * Sim.W + x]; if (t.b && (t.b.d || 1) > 1) items.push({ d: x + (t.b.w || 1) - 1 + y + (t.b.d || 1) - 1, t }); }
    for (let y = view.y0; y <= view.y1; y++) for (let x = Math.max(0, view.x0 - 4); x < view.x0; x++) { const t = S.tiles[y * Sim.W + x]; if (t.b && (t.b.w || 1) > 1) items.push({ d: x + (t.b.w || 1) - 1 + y + (t.b.d || 1) - 1, t }); }
    for (const s2 of S.stations) items.push({ d: s2.x + s2.y + 1.5, station: s2 });
    if (!lod) for (const st of S.stores) {
      if (st.x < view.x0 - 2 || st.x > view.x1 + 2 || st.y < view.y0 - 2 || st.y > view.y1 + 2) continue;
      if (!['cafe', 'dessert', 'brunch', 'bakery', 'pub', 'bubbletea', 'pizza'].includes(st.cat)) continue;
      const w = st.w || 1, d = st.d || 1;
      for (const [rx, ry, ox, oy] of [[st.x + w - 1, st.y + d, 0, -0.32], [st.x + w, st.y + d - 1, -0.32, 0]]) {
        const r = Sim.tile(S, rx, ry); if (!r || r.t !== 'road' || r.road === 'alley' || isCross(S, r)) continue;
        const sp = iso(rx + ox, ry + oy);
        const open = this.hourF >= st.open && this.hourF < st.close && Sim.seasonOf(S) !== 'winter';
        items.push({ d: rx + ry + 0.3, terr: sp, col: S.companies[st.owner].color, open, seed: st.id }); break;
      }
    }
    const ovp = this.overlay && this.overlay.type === 'potential' && this.overlay.data;
    if (ovp) { const max = Math.max(1, ...ovp.map(o => o.cust)); for (const o of ovp) items.push({ d: o.x + o.y - 0.01, o, k: o.cust / max }); }
    if (!lod) {
      for (const w of this.walkers) items.push({ d: w.x + (w.tx - w.x) * w.f + w.y + (w.ty - w.y) * w.f + 0.1, w });
      for (const w of this.shoppers || []) { const q = walkerPos(w); items.push({ d: q.fx + q.fy + 0.1, w }); }
      for (const c of this.cars) items.push({ d: c.x + (c.tx - c.x) * c.f + c.y + (c.ty - c.y) * c.f + 0.15, car: c });
      for (const tr of this.trucks) { const a = tr.p[tr.i], b = tr.p[tr.i + 1]; items.push({ d: a.x + (b.x - a.x) * tr.f + a.y + (b.y - a.y) * tr.f + 0.2, tr }); }
    }
    items.sort((a, b) => a.d - b.d);
    this._visB = items.reduce((n, it) => n + (it.t ? 1 : 0), 0);
    const rain = wk === 'rain';
    for (const it of items) {
      if (it.t) {
        const t = it.t;
        const pk = this.pops && this.pops[t.x + ',' + t.y];
        if (pk != null && this.t - pk < 700) {
          const g = geo(t.x, t.y, t.b.w || 1, t.b.d || 1), k = (this.t - pk) / 700, sy = 1 + Math.sin(k * Math.PI * 3) * 0.25 * (1 - k), sx = 1 - (sy - 1) * 0.6;
          ctx.save(); ctx.translate(g.c.x, g.c.y); ctx.scale(sx, sy); ctx.translate(-g.c.x, -g.c.y);
          this.drawBuilding(ctx, t, season, night, lod); ctx.restore();
          if (k < 0.5) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ctx.beginPath(); ctx.arc(g.c.x + Math.cos(a) * (14 + k * 40), g.c.y + Math.sin(a) * (7 + k * 20), 4 - k * 4, 0, 7); ctx.fillStyle = '#fff8ee'; ctx.fill(); ink(ctx, 0.8); }
        } else if (t.b.k === 'store' || t.b.k === 'fac' || (t.b.k === 'lm' && (t.b.kind === 'amusement' || t.b.kind === 'tower'))) this.drawBuilding(ctx, t, season, night, lod);
        else {
          const sc = z * dpr > 3 ? 3 : z * dpr > 1.6 ? 2 : z * dpr > 0.9 ? 1.25 : 0.8;
          const sp = this.spriteFor(t, season, night, sc);
          if (sp) { ctx.drawImage(sp.cv, sp.minX, sp.minY, sp.cv.width / sp.sc, sp.cv.height / sp.sc); for (const gl of sp.glows) this._glows.push(gl); }
          else this.drawBuilding(ctx, t, season, night, true);
        }
      } else if (it.tree) {
        const p = iso(it.tree.x, it.tree.y), k = Math.floor(hash(it.tree.x, it.tree.y, 4) * 10);
        if (lod) { ctx.beginPath(); ctx.arc(p.x, p.y - 8, 8, 0, 7); ctx.fillStyle = TREE[season][k % 2]; ctx.fill(); ink(ctx, 1); continue; }
        drawTree(ctx, p.x - 8 + (k % 3) * 6, p.y - 2 + (k % 2) * 4, season, k);
        if (k > 5) drawTree(ctx, p.x + 12, p.y + 4, season, k + 1);
      } else if (it.pine) { const p = iso(it.pine.x, it.pine.y); const k = hash(it.pine.x, it.pine.y, 8); drawPine(ctx, p.x - 6 + k * 12, p.y + 2 - k * 4, season, 0.8 + k * 0.5); if (k > 0.5 && !lod) drawPine(ctx, p.x + 8, p.y + 6, season, 0.7); }
      else if (it.lamp) { const p = it.lamp.sp || iso(it.lamp.x, it.lamp.y); this.drawLamp(ctx, p.x, p.y, night); }
      else if (it.stree) this.streetTree(ctx, it.stree.x, it.stree.y, season, it.k);
      else if (it.tlight) { const p = iso(it.tlight.x - 0.4, it.tlight.y - 0.4); this.trafficLight(ctx, p.x, p.y, (this.sigPhase || 0) === 0); }
      else if (it.terr) this.terrace(ctx, it.terr.x, it.terr.y, it.col, it.open, it.seed);
      else if (it.station) this.drawStation(ctx, it.station);
      else if (it.o) {
        const p = iso(it.o.x, it.o.y), k = it.k;
        diamondPath(ctx, p.x, p.y, 0.92); ctx.fillStyle = k < 0.2 ? 'rgba(94,31,43,0.12)' : `rgba(${Math.round(150 - 70 * k)},${Math.round(185 - 10 * k)},${Math.round(110 - 30 * k)},${(0.35 + 0.45 * k).toFixed(2)})`; ctx.fill();
        if (k >= 0.2) { ctx.setLineDash([3, 3]); ink(ctx, 1); ctx.setLineDash([]); }
      } else if (it.w) {
        const w = it.w; const wp = walkerPos(w), fx = wp.fx, fy = wp.fy;
        const ddx = w.dx || 0;
        const tw = Sim.tile(S, Math.round(fx), Math.round(fy));
        const sOff = tw && tw.road === 'alley' ? 0.15 : 0.37;
        const p = wp.p || (ddx ? iso(fx, fy + w.side * sOff) : iso(fx + w.side * sOff, fy));
        const run = w.kind === 'run';
        const bob = REDUCED || paused || w.wait ? 0 : Math.abs(Math.sin(this.t / (run ? 80 : 140) + fx * 3)) * (run ? 2.2 : 1.2);
        walker(ctx, p.x, p.y, w.c, w.hair, bob, rain && w.umb && !run, paused || w.wait ? 0 : this.t / (run ? 60 : 110) + w.sp * 10);
        if (run) { ctx.beginPath(); ctx.moveTo(p.x - 2, p.y - 12.2 - bob); ctx.lineTo(p.x + 2, p.y - 12.2 - bob); ctx.strokeStyle = '#fff8ee'; ctx.lineWidth = 1; ctx.stroke(); }
        if (w.kind === 'commute') { ctx.beginPath(); ctx.rect(p.x + 2.2, p.y - 5.5 - bob * 0.3, 3.4, 2.6); ctx.fillStyle = '#7a4a2e'; ctx.fill(); ink(ctx, 0.6); }
        if (w.cup) { ctx.beginPath(); ctx.rect(p.x + 2.4, p.y - 8.2 - bob, 1.8, 2.4); ctx.fillStyle = '#fff8ee'; ctx.fill(); ink(ctx, 0.5); }
        if (w.pair) walker(ctx, p.x + 5, p.y + 1.5, w.c2, w.hair2, bob, rain && w.umb, paused ? 0 : this.t / 110 + 1.5);
        const ox = 0, oy = 0;
        if (w.dog && !w.pair) { const dx = p.x + ox + 5, dy = p.y + oy + 1; ctx.beginPath(); ctx.ellipse(dx, dy - 2, 3, 1.8, 0, 0, 7); ctx.fillStyle = '#fff8ee'; ctx.fill(); ink(ctx, 0.8); ctx.beginPath(); ctx.arc(dx + 3, dy - 3.5, 1.4, 0, 7); ctx.fill(); ink(ctx, 0.7); }
      } else if (it.car) {
        const c = it.car; const fx = c.x + (c.tx - c.x) * c.f, fy = c.y + (c.ty - c.y) * c.f;
        const ddx = c.dx || 1, ddy = c.dy || 0, lane = 0.2;
        const p = iso(fx - ddy * lane, fy + ddx * lane);
        drawCar(ctx, p.x, p.y, c.dx || 1, c.dy || 0, c.c, c.taxi);
        if (night > 0.3) this._glows.push({ x: p.x, y: p.y, r: 12, a: 0.45 });
      } else if (it.tr) {
        const tr = it.tr; const a = tr.p[tr.i], b = tr.p[tr.i + 1];
        const p = iso(a.x + (b.x - a.x) * tr.f, a.y + (b.y - a.y) * tr.f);
        ctx.save(); ctx.translate(p.x, p.y);
        box(ctx, 0, 0, 0.22, 9, '#fff8ee', shade(tr.color, 0.2)); box(ctx, 6, 3, 0.12, 6, tr.color);
        ctx.restore();
      }
    }

    if (night > 0 || dusk > 0) {
      ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (dusk > 0) { ctx.fillStyle = `rgba(240,140,110,${0.14 * dusk})`; ctx.fillRect(0, 0, this.w, this.h); }
      if (night > 0) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(70,62,120,${night})`; ctx.fillRect(0, 0, this.w, this.h); }
      ctx.restore();
      if (night > 0.2) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const gl of this._glows) {
          const gr = ctx.createRadialGradient(gl.x, gl.y, 0, gl.x, gl.y, gl.r);
          gr.addColorStop(0, `rgba(${gl.c || '255,200,120'},${gl.a * night})`); gr.addColorStop(1, `rgba(${gl.c || '255,200,120'},0)`);
          ctx.fillStyle = gr; ctx.fillRect(gl.x - gl.r, gl.y - gl.r, gl.r * 2, gl.r * 2);
        }
        ctx.restore();
      }
    }
    if (wk === 'cloud' || wk === 'rain' || wk === 'snow') { ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = `rgba(110,100,130,${wk === 'cloud' ? 0.05 : 0.1})`; ctx.fillRect(0, 0, this.w, this.h); ctx.restore(); }
    if (ovp) this.drawPotentialTags(ctx, ovp);
    if (this.hover) { const ht = Sim.anchorOf(S, Sim.tile(S, this.hover.x, this.hover.y)); const b = ht && ht.b; const g = geo(ht.x, ht.y, b ? b.w || 1 : 1, b ? b.d || 1 : 1, 0); ctx.beginPath(); ctx.moveTo(g.T.x, g.T.y); ctx.lineTo(g.R.x, g.R.y); ctx.lineTo(g.B.x, g.B.y); ctx.lineTo(g.L.x, g.L.y); ctx.closePath(); ctx.setLineDash([4, 3]); ink(ctx, 1.4 / z + 0.4); ctx.setLineDash([]); }
    if (this.ghost) {
      const gw = this.ghost.w || 1, gd = this.ghost.d || 1, g = geo(this.ghost.x, this.ghost.y, gw, gd, 0);
      ctx.beginPath(); ctx.moveTo(g.T.x, g.T.y); ctx.lineTo(g.R.x, g.R.y); ctx.lineTo(g.B.x, g.B.y); ctx.lineTo(g.L.x, g.L.y); ctx.closePath();
      ctx.fillStyle = this.ghost.ok ? 'rgba(143,179,138,0.55)' : 'rgba(228,107,95,0.45)'; ctx.fill(); ink(ctx, 1.4);
      if (this.ghost.icon) { ctx.beginPath(); ctx.arc(g.c.x, g.c.y - 18, 12, 0, 7); ctx.fillStyle = '#fff8ee'; ctx.fill(); ink(ctx, 1.2); icon(ctx, this.ghost.icon, g.c.x, g.c.y - 18, 16, 1.8); }
    }
    if (this.sel) { const st = Sim.anchorOf(S, Sim.tile(S, this.sel.x, this.sel.y)); const b = st && st.b; const g = geo(st.x, st.y, b ? b.w || 1 : 1, b ? b.d || 1 : 1, -0.03); ctx.beginPath(); ctx.moveTo(g.T.x, g.T.y); ctx.lineTo(g.R.x, g.R.y); ctx.lineTo(g.B.x, g.B.y); ctx.lineTo(g.L.x, g.L.y); ctx.closePath(); ctx.strokeStyle = '#e3a63c'; ctx.lineWidth = 4; ctx.stroke(); ink(ctx, 1.4); }
    if (night < 0.5 && !lod) this.drawBirds(ctx, adt);
    if (!REDUCED && wk !== 'rain' && wk !== 'snow') {
      for (const c of this.clouds) {
        c.x += adt * 0.006; if (c.x > 2600) c.x = -2600;
        ctx.globalAlpha = 0.85 * (1 - night * 0.7);
        ctx.beginPath(); for (let i = 0; i < 4; i++) { const ex = c.x + i * 22 * c.s, ey = c.y - 120 + Math.sin(i) * 6; ctx.moveTo(ex + 26 * c.s, ey); ctx.ellipse(ex, ey, 26 * c.s, 13 * c.s, 0, 0, 7); }
        ink(ctx, 2.6); ctx.fillStyle = '#fff8f4'; ctx.fill(); ctx.globalAlpha = 1;
      }
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const f of this.floaters) {
      const p = iso(f.x, f.y); const k = f.t / 1800;
      ctx.globalAlpha = 1 - k; ctx.font = 'bold 11px "Gowun Dodum", sans-serif';
      const txt = (f.v >= 0 ? '+' : '') + Sim.won(f.v).replace('원', '');
      ctx.lineWidth = 3; ctx.strokeStyle = '#fff8ee'; ctx.strokeText(txt, p.x, p.y - 66 - k * 26);
      ctx.fillStyle = f.v >= 0 ? '#4f7f3f' : '#c94f6d'; ctx.fillText(txt, p.x, p.y - 66 - k * 26);
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drawHoodLabels(ctx);
    this.drawParticles(ctx, adt, season, wk);
    if (paused) { ctx.fillStyle = 'rgba(94,31,43,0.08)'; ctx.fillRect(0, 0, this.w, this.h); }
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
    if (!this.birds || this.birds.x > this.cam.x + 1500) this.birds = { x: this.cam.x - 1500 - Math.random() * 1500, y: this.cam.y - 300 + Math.random() * 600 };
    this.birds.x += dt * 0.05;
    for (let i = 0; i < 5; i++) {
      const bx = this.birds.x - i * 14 - (i % 2) * 6, by = this.birds.y - 150 + i * 6 * (i % 2 ? 1 : -0.5), f = Math.sin(this.t / 120 + i) * 3;
      ctx.beginPath(); ctx.moveTo(bx - 5, by - f); ctx.quadraticCurveTo(bx - 2, by - 2, bx, by); ctx.quadraticCurveTo(bx + 2, by - 2, bx + 5, by - f); ink(ctx, 1.2);
    }
  };
  R.drawHoodLabels = function (ctx) {
    if (this.cam.z > 1.05 || !this.showHoods || !this.S.hoodCenters) return;
    const S = this.S;
    ctx.font = `${this.cam.z < 0.4 ? 15 : 13}px "Jua","Gowun Dodum",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    Sim.HOODS.forEach((H0, i) => {
      const c = S.hoodCenters[i], p = this.tileScreen(c.x, c.y);
      if (p.x < -60 || p.x > this.w + 60 || p.y < -20 || p.y > this.h + 20) return;
      const hot = S.hoods[i].hype >= 40;
      const text = (hot ? '🔥 ' : '') + H0.name;
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
      for (let y = Math.max(0, f.y - r); y <= Math.min(Sim.H - 1, f.y + r); y++) for (let x = Math.max(0, f.x - r); x <= Math.min(Sim.W - 1, f.x + r); x++) if (Math.abs(x - f.x) + Math.abs(y - f.y) <= r) { const p = iso(x, y); diamond(ctx, p.x, p.y, 1, f.kind === 'kitchen' ? 'rgba(227,166,60,0.14)' : 'rgba(158,167,222,0.18)'); }
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
    const top = data.slice().sort((a, b) => b.cust - a.cust).slice(0, 6);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const d of top) {
      const p = iso(d.x, d.y), bob = REDUCED ? 0 : Math.sin(this.t / 300 + d.x) * 2, q = 1 / Math.max(0.35, Math.min(1.3, this.cam.z));
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
    const n = (mode === 'rain' ? 110 : mode === 'snow' ? 80 : 24) * (this.w < 760 ? 0.5 : 1);
    if (this._pmode !== mode) { this.particles = []; this._pmode = mode; }
    while (this.particles.length < n) this.particles.push({ x: Math.random() * this.w, y: Math.random() * this.h - this.h, v: 0.012 + Math.random() * 0.02, s: 2 + Math.random() * 2.5, ph: Math.random() * 6 });
    for (const p of this.particles) {
      if (mode === 'rain') { p.y += dt * 0.9; p.x -= dt * 0.12; }
      else { p.y += dt * p.v * (mode === 'snow' ? 2 : 1.4); p.x += (dt ? Math.sin(this.t / 900 + p.ph) * 0.3 : 0) + dt * 0.006; }
      if (p.y > this.h + 10) { p.y = -10; p.x = Math.random() * (this.w + 100); }
      if (mode === 'rain') { ctx.strokeStyle = 'rgba(94,31,43,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 3, p.y + 11); ctx.stroke(); continue; }
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.s, mode === 'petal' || mode === 'leaf' ? p.s * 0.6 : p.s, p.ph + this.t / 1000, 0, 7);
      ctx.fillStyle = mode === 'petal' ? '#f2b3c4' : mode === 'leaf' ? '#e39a4a' : '#ffffff'; ctx.fill();
      ctx.strokeStyle = 'rgba(94,31,43,0.5)'; ctx.lineWidth = 0.7; ctx.stroke();
    }
  };

  // ================= 매장 내부 =================
  // 니펫츠풍 선화: 두 벽과 판자 바닥, 잉크 외곽선, 납작한 색면. 가구는 Sim.FURN 격자 배치를 그대로 그림.
  const SKIN = ['#f4d2bd', '#e8b896', '#c98e6a', '#8d5a3c', '#f1c7a8', '#5e3b2a'];
  const PANTS = ['#5d6a9e', '#3b2228', '#c9a27e', '#7d8f4a', '#e3a63c', '#a3477a', '#6fb7b2'];
  // 사람: 가늘고 긴 몸, 바지·셔츠·머리 모양이 사람마다 다름
  function person(ctx, x, y, o) {
    const k = o.k || 1, bob = o.bob || 0, lw = Math.max(0.8, 1.05 * k);
    const ln = (pts, col, w) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.strokeStyle = INK; ctx.lineWidth = (w + 1.4) * k; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w * k; ctx.stroke(); };
    const skin = o.skin || SKIN[0];
    if (!o.sit) { ctx.fillStyle = 'rgba(94,31,43,0.13)'; ctx.beginPath(); ctx.ellipse(x, y + 0.5 * k, 5 * k, 2 * k, 0, 0, 7); ctx.fill(); }
    const hip = o.sit ? y - 7 * k : y - 11 * k - bob, sh = hip - 10 * k;
    // 다리
    const sw = o.walk ? Math.sin(o.walk) * 2.6 * k : 0;
    if (o.sit) { ln([[x - 1.6 * k, hip], [x - 1.6 * k + 5 * k, hip + 1 * k], [x - 1.6 * k + 5 * k, y]], o.pants, 2.4); ln([[x + 1.6 * k, hip], [x + 1.6 * k + 5 * k, hip + 1.6 * k], [x + 1.6 * k + 5 * k, y + 0.6 * k]], o.pants, 2.4); }
    else { ln([[x - 1.5 * k, hip], [x - 1.5 * k + sw, y]], o.pants, 2.4); ln([[x + 1.5 * k, hip], [x + 1.5 * k - sw, y]], o.pants, 2.4); }
    // 팔 (뒤)
    const arm = o.arm || 0;
    ln([[x - 3.6 * k, sh + 1.5 * k], [x - 4.8 * k - sw * 0.4, sh + 6 * k], [x - 4 * k, sh + 9 * k - arm * k]], skin, 1.7);
    // 몸통
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - 4 * k, sh, 8 * k, hip - sh + 1.5 * k, [3 * k, 3 * k, 1.5 * k, 1.5 * k]); else ctx.rect(x - 4 * k, sh, 8 * k, hip - sh);
    ctx.fillStyle = o.shirt; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.stroke();
    if (o.apron) { ctx.beginPath(); ctx.rect(x - 3 * k, sh + 3.5 * k, 6 * k, hip - sh - 1 * k); ctx.fillStyle = o.apron; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 2.2 * k, sh + 3.5 * k); ctx.lineTo(x - 1 * k, sh); ctx.moveTo(x + 2.2 * k, sh + 3.5 * k); ctx.lineTo(x + 1 * k, sh); ctx.lineWidth = 0.8 * k; ctx.stroke(); }
    // 팔 (앞) — 들고 있는 컵이나 손짓
    if (o.cup) { ln([[x + 3.6 * k, sh + 1.5 * k], [x + 5 * k, sh + 6 * k], [x + 2.5 * k, sh + 6.5 * k]], skin, 1.7); ctx.beginPath(); ctx.rect(x + 1 * k, sh + 4 * k, 2.6 * k, 3 * k); ctx.fillStyle = '#fff8ee'; ctx.fill(); ctx.lineWidth = 0.8 * k; ctx.strokeStyle = INK; ctx.stroke(); }
    else ln([[x + 3.6 * k, sh + 1.5 * k], [x + 4.8 * k + sw * 0.4, sh + 6 * k - arm * 2 * k], [x + 4.2 * k + arm * 2 * k, sh + 9 * k - arm * 5 * k]], skin, 1.7);
    // 목·머리
    const hx = x, hy = sh - 4.2 * k;
    ctx.beginPath(); ctx.arc(hx, hy, 3.6 * k, 0, 7); ctx.fillStyle = skin; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.stroke();
    ctx.fillStyle = o.hair; ctx.beginPath();
    const hs = o.hs || 0;
    if (hs === 0) { ctx.arc(hx, hy - 0.6 * k, 3.8 * k, Math.PI * 0.95, Math.PI * 2.05); ctx.closePath(); }
    else if (hs === 1) { ctx.arc(hx, hy - 0.4 * k, 3.9 * k, Math.PI * 0.8, Math.PI * 2.2); ctx.lineTo(hx + 3.6 * k, hy + 4 * k); ctx.lineTo(hx - 3.6 * k, hy + 4 * k); ctx.closePath(); }
    else if (hs === 2) { ctx.arc(hx, hy - 0.8 * k, 3.8 * k, Math.PI, Math.PI * 2); ctx.closePath(); ctx.moveTo(hx + 2 * k, hy - 4.5 * k); ctx.arc(hx + 1 * k, hy - 5 * k, 2.2 * k, 0, 7); }
    else { ctx.arc(hx, hy - 1.2 * k, 4.4 * k, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); }
    ctx.fill(); ctx.stroke();
    if (o.cap) { ctx.beginPath(); ctx.ellipse(hx, hy - 3 * k, 4 * k, 1.8 * k, 0, Math.PI, 0); ctx.fillStyle = o.cap; ctx.fill(); ctx.stroke(); }
    if (o.sit) {} else { ctx.fillStyle = INK; ctx.fillRect(hx + 0.6 * k, hy - 0.3 * k, 0.9 * k, 1.1 * k); }
  }
  function pal(style, styleKey) {
    const wall = style.wall, floor = style.floor, acc = style.accent;
    const dark = styleKey === 'luxury';
    return { wall, wall2: shade(wall, -0.07), trim: shade(acc, 0.2), floor, floor2: shade(floor, dark ? 0.08 : -0.08), acc, acc2: shade(acc, -0.15),
      wood: dark ? '#c7a35a' : styleKey === 'industrial' ? '#8a7a6a' : styleKey === 'minimal' ? '#e9d3b4' : '#e3a63c', cream: '#fff4ea',
      red: styleKey === 'nordic' ? '#9bb7c7' : styleKey === 'plant' ? '#e58ba3' : '#d9445a', metal: '#dcd8d4', bg: shade(acc, 0.62) };
  }
  // opts: { hour, t, hoverStaff, edit, ghost:{k,x,y,r} }
  Renderer.drawInterior = function (canvas, S, st, opts) {
    opts = opts || {};
    const E = opts.embed || null;   // 지도 위에 바로 그릴 때: { ctx, tw, ox, oy }
    let W = 0, Hh = 0, ctx;
    if (E) ctx = E.ctx;
    else {
      const dpr = Math.min(2, root.devicePixelRatio || 1);
      W = canvas.clientWidth; Hh = canvas.clientHeight; if (!W || !Hh) return;
      if (canvas.width !== Math.round(W * dpr)) { canvas.width = W * dpr; canvas.height = Hh * dpr; }
      ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const comp = S.companies[st.owner], skey = st.interior.style, style = Sim.STYLES[skey], tier = st.interior.tier, cat = Sim.CATS[st.cat];
    const hour = opts.hour == null ? S.hour % 24 : opts.hour, t = REDUCED ? 0 : (opts.t || 0);
    const open = hour >= st.open && hour < st.close;
    const [nx, ny] = Sim.ROOM[st.size];
    const furn = Sim.ensureFurn(st);
    const C = pal(style, skey);
    const tw = E ? E.tw : Math.min(W / (nx + ny) * 1.85, (Hh * 0.9) / ((nx + ny) / 4 + 2.25), 84), th = tw / 2, wallH = tw * 2.05;
    const ox = E ? E.ox : W / 2 + (ny - nx) * tw / 4, oy = E ? E.oy : (Hh - (nx + ny) * th / 2) / 2 + wallH * 0.52 + 6;
    const P = (x, y) => ({ x: ox + (x - y) * tw / 2, y: oy + (x + y) * th / 2 });
    if (!E) canvas._lay = { ox, oy, tw, th, nx, ny };
    const LWI = E ? 0.55 : Math.max(1, tw / 34);
    const q = (pts, fill, w) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (w !== 0) { ctx.strokeStyle = INK; ctx.lineWidth = (w || 1) * LWI; ctx.lineJoin = 'round'; ctx.stroke(); } };
    const Z = (p, z) => ({ x: p.x, y: p.y - z * tw });
    const PZ = (x, y, z) => Z(P(x, y), z);
    // 상자: 바닥 x0..x1, y0..y1, 높이 z0..z1(칸 너비 단위)
    const box = (x0, y0, x1, y1, z0, z1, top, l, r, w) => {
      const A = P(x0, y1), B = P(x1, y1), Cc = P(x1, y0), D = P(x0, y0);
      q([Z(A, z0), Z(B, z0), Z(B, z1), Z(A, z1)], l, w); q([Z(B, z0), Z(Cc, z0), Z(Cc, z1), Z(B, z1)], r || shade(l, -0.12), w); q([Z(A, z1), Z(B, z1), Z(Cc, z1), Z(D, z1)], top, w);
      return { A, B, C: Cc, D };
    };
    const disc = (x, y, z, rx, fill, w) => { const c = PZ(x, y, z); ctx.beginPath(); ctx.ellipse(c.x, c.y, rx * tw, rx * tw * 0.5, 0, 0, 7); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (w !== 0) { ctx.strokeStyle = INK; ctx.lineWidth = (w || 1) * LWI; ctx.stroke(); } return c; };
    const line = (a, b, col, w) => { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = col || INK; ctx.lineWidth = (w || 1) * LWI; ctx.lineCap = 'round'; ctx.stroke(); };

    if (!E) {
    // ----- 배경과 바닥 -----
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, Hh);
    const slab = tw * 0.14;
    q([P(0, ny), P(nx, ny), { x: P(nx, ny).x, y: P(nx, ny).y + slab }, { x: P(0, ny).x, y: P(0, ny).y + slab }], shade(C.floor, -0.3), 1.4);
    q([P(nx, ny), P(nx, 0), { x: P(nx, 0).x, y: P(nx, 0).y + slab }, { x: P(nx, ny).x, y: P(nx, ny).y + slab }], shade(C.floor, -0.38), 1.4);
    q([P(0, 0), P(nx, 0), P(nx, ny), P(0, ny)], C.floor, 1.4);
    // 주방 바닥: 체크 타일
    for (let y = 0; y < ny; y++) for (let x = 0; x < 2; x++) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) q([P(x + i / 2, y + j / 2), P(x + (i + 1) / 2, y + j / 2), P(x + (i + 1) / 2, y + (j + 1) / 2), P(x + i / 2, y + (j + 1) / 2)], skey === 'luxury' ? '#4c4747' : '#efe6dc', 0);
    for (let y = 0; y < ny; y++) for (let x = 0; x < 2; x++) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) q([P(x + i / 2, y + j / 2), P(x + (i + 1) / 2, y + j / 2), P(x + (i + 1) / 2, y + (j + 1) / 2), P(x + i / 2, y + (j + 1) / 2)], skey === 'luxury' ? '#3a3636' : '#d9cfc6', 0);
    // 홀 바닥: 판자 줄과 엇갈린 이음매
    ctx.save(); ctx.globalAlpha = 0.32;
    const planks = skey === 'vintage' || skey === 'luxury' ? 0 : 3;
    if (planks) for (let k = 1; k < ny * planks; k++) { const yy = k / planks; line(P(2, yy), P(nx, yy), INK, 0.6); for (let x = 2 + ((k * 0.37) % 1); x < nx; x += 1.3) line(P(x, yy), P(x, yy - 1 / planks), INK, 0.5); }
    else for (let y = 0; y < ny; y++) for (let x = 2; x < nx; x++) if ((x + y) % 2) q([P(x, y), P(x + 1, y), P(x + 1, y + 1), P(x, y + 1)], skey === 'luxury' ? 'rgba(199,163,90,0.35)' : 'rgba(94,31,43,0.35)', 0);
    ctx.restore();
    line(P(2, 0), P(2, ny), INK, 0.9);
    // ----- 벽 -----
    const wallL = (u0, u1, v0, v1) => [P(0, ny * (1 - u0)), P(0, ny * (1 - u1))].flatMap((p, i) => i ? [Z(p, v0 * wallH / tw), Z(p, v1 * wallH / tw)] : [Z(p, v1 * wallH / tw), Z(p, v0 * wallH / tw)]);
    const wq = (side, u0, u1, v0, v1, col, w) => {
      const a = side === 'L' ? P(0, ny * (1 - u0)) : P(nx * u0, 0), b = side === 'L' ? P(0, ny * (1 - u1)) : P(nx * u1, 0);
      q([Z(a, v0 * wallH / tw), Z(b, v0 * wallH / tw), Z(b, v1 * wallH / tw), Z(a, v1 * wallH / tw)], col, w == null ? 1 : w);
    };
    void wallL;
    const WT = 0.16;
    // 벽 두께(윗면)와 벽면
    q([Z(P(0, ny), wallH / tw), Z(P(0, 0), wallH / tw), Z(P(-WT, -WT), wallH / tw), Z(P(-WT, ny), wallH / tw)], shade(C.wall, -0.2), 1.3);
    q([Z(P(0, 0), wallH / tw), Z(P(nx, 0), wallH / tw), Z(P(nx, -WT), wallH / tw), Z(P(-WT, -WT), wallH / tw)], shade(C.wall, -0.2), 1.3);
    wq('L', 0, 1, 0, 1, C.wall, 1.4); wq('R', 0, 1, 0, 1, C.wall2, 1.4);
    q([P(0, ny), Z(P(0, ny), wallH / tw), Z(P(-WT, ny), wallH / tw), { x: P(-WT, ny).x, y: P(-WT, ny).y }], shade(C.wall, -0.3), 1.3);
    q([P(nx, 0), Z(P(nx, 0), wallH / tw), Z(P(nx, -WT), wallH / tw), { x: P(nx, -WT).x, y: P(nx, -WT).y }], shade(C.wall, -0.35), 1.3);
    // 징두리판과 걸레받이
    if (['wood', 'vintage', 'hanok', 'nordic'].includes(skey)) {
      wq('L', 0, 1, 0, 0.34, shade(C.acc, 0.45)); wq('R', 0, 1, 0, 0.34, shade(C.acc, 0.38));
      ctx.save(); ctx.globalAlpha = 0.45; for (let i = 1; i < ny * 3; i++) wq('L', i / (ny * 3), i / (ny * 3), 0.02, 0.32, null, 0.6); for (let i = 1; i < nx * 3; i++) wq('R', i / (nx * 3), i / (nx * 3), 0.02, 0.32, null, 0.6); ctx.restore();
    }
    wq('L', 0, 1, 0, 0.05, C.trim); wq('R', 0, 1, 0, 0.05, C.trim);
    if (skey === 'industrial') { ctx.save(); ctx.globalAlpha = 0.25; for (let r = 1; r < 6; r++) { wq('L', 0, 1, r / 6, r / 6, null, 0.6); wq('R', 0, 1, r / 6, r / 6, null, 0.6); } ctx.restore(); }
    if (skey === 'luxury') { wq('L', 0, 1, 0.34, 0.36, '#c7a35a', 0.6); wq('R', 0, 1, 0.34, 0.36, '#c7a35a', 0.6); }
    if (skey === 'hanok') for (let i = 1; i < nx; i++) wq('R', i / nx - 0.008, i / nx + 0.008, 0, 1, '#7a5c44', 0.8);
    // 창문 + 커튼 (오른쪽 벽) — 바깥은 시간대 색
    const sky = hour >= 7 && hour < 17 ? '#bfe0f3' : hour >= 17 && hour < 20 ? '#f6c9a0' : hour >= 5 && hour < 7 ? '#e8d0d8' : '#4a4f86';
    const winU = nx >= 8 ? [[0.3, 0.5], [0.62, 0.82]] : [[0.36, 0.56], [0.66, 0.86]];
    for (const [u0, u1] of winU) {
      wq('R', u0 - 0.015, u1 + 0.015, 0.32, 0.86, C.cream, 1.2);
      wq('R', u0, u1, 0.36, 0.82, sky, 1);
      if (hour >= 7 && hour < 19) { ctx.save(); ctx.globalAlpha = 0.6; wq('R', u0 + 0.02, u0 + 0.05, 0.5, 0.78, '#ffffff', 0); ctx.restore(); }
      wq('R', (u0 + u1) / 2 - 0.004, (u0 + u1) / 2 + 0.004, 0.36, 0.82, C.cream, 0.6);
      wq('R', u0 - 0.01, u1 + 0.01, 0.31, 0.34, C.cream, 1);
      if (skey !== 'industrial' && skey !== 'minimal') for (const [a, b] of [[u0 - 0.035, u0 + 0.02], [u1 - 0.02, u1 + 0.035]]) { wq('R', a, b, 0.3, 0.92, skey === 'luxury' ? '#7a2d3b' : skey === 'plant' ? '#8fb38a' : shade(C.acc, 0.1), 1); ctx.save(); ctx.globalAlpha = 0.35; for (let i = 1; i < 3; i++) wq('R', a + (b - a) * i / 3, a + (b - a) * i / 3, 0.32, 0.9, null, 0.6); ctx.restore(); }
      if (skey === 'plant' || tier >= 3) { const c = P(nx * (u0 + u1) / 2, 0); ctx.beginPath(); ctx.rect(c.x - tw * 0.12, c.y - wallH * 0.36, tw * 0.24, tw * 0.1); ctx.fillStyle = '#d9785f'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = LWI; ctx.stroke(); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(c.x - tw * 0.08 + i * tw * 0.08, c.y - wallH * 0.36 - tw * 0.04, tw * 0.05, 0, 7); ctx.fillStyle = i === 1 ? '#e58ba3' : '#8fb38a'; ctx.fill(); ctx.stroke(); } }
    }
    // 메뉴판 (왼쪽 벽, 주방 위)
    {
      const u0 = 1 - 3.2 / ny, u1 = 1 - 1.0 / ny;
      wq('L', u0 - 0.02, u1 + 0.02, 0.5, 0.9, C.wood, 1.2);
      wq('L', u0, u1, 0.53, 0.87, skey === 'minimal' ? '#ffffff' : '#3e4a44', 1);
      const a = P(0, ny * (1 - u0)), b = P(0, ny * (1 - u1));
      ctx.save(); ctx.strokeStyle = skey === 'minimal' ? 'rgba(94,31,43,0.5)' : 'rgba(255,248,238,0.75)'; ctx.lineWidth = LWI * 0.9;
      for (let i = 0; i < 4; i++) { const v = (0.63 + i * 0.06) * wallH, f0 = 0.15, f1 = i % 2 ? 0.7 : 0.85; ctx.beginPath(); ctx.moveTo(a.x + (b.x - a.x) * f0, a.y + (b.y - a.y) * f0 - v); ctx.lineTo(a.x + (b.x - a.x) * f1, a.y + (b.y - a.y) * f1 - v); ctx.stroke(); }
      ctx.restore();
      const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - wallH * 0.8 };
      ctx.save(); ctx.translate(m.x, m.y); ctx.transform(1, -0.5, 0, 1, 0, 0); ctx.fillStyle = skey === 'minimal' ? INK : '#fff8ee'; ctx.font = `${Math.round(tw * 0.17)}px "Jua",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('MENU', 0, 0); ctx.restore();
    }
    // 벽 선반: 병과 화분
    {
      const u0 = 1 - 4.9 / ny, u1 = 1 - 3.5 / ny;
      if (u0 > 0.02) {
        wq('L', u0, u1, 0.5, 0.53, C.wood, 1);
        const items2 = 4;
        for (let i = 0; i < items2; i++) { const u = u0 + (u1 - u0) * (i + 0.5) / items2, p = P(0, ny * (1 - u)); const hgt = tw * (i % 2 ? 0.2 : 0.14); ctx.beginPath(); if (i === 3) { ctx.rect(p.x + tw * 0.03, p.y - wallH * 0.53 - tw * 0.1, tw * 0.1, tw * 0.1); ctx.fillStyle = '#d9785f'; } else { ctx.rect(p.x + tw * 0.04, p.y - wallH * 0.53 - hgt, tw * 0.07, hgt); ctx.fillStyle = [C.red, '#9ea7de', '#f2d36b'][i]; } ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = LWI * 0.8; ctx.stroke(); if (i === 3) { ctx.beginPath(); ctx.arc(p.x + tw * 0.08, p.y - wallH * 0.53 - tw * 0.16, tw * 0.07, 0, 7); ctx.fillStyle = '#8fb38a'; ctx.fill(); ctx.stroke(); } }
      }
    }
    // 액자와 시계 (오른쪽 벽 앞쪽)
    if (nx >= 7) {
      const u0 = 0.06, u1 = 0.2;
      wq('R', u0, u1, 0.45, 0.75, C.wood, 1.2); wq('R', u0 + 0.015, u1 - 0.015, 0.48, 0.72, '#f6ead6', 0.8);
      const a = P(nx * (u0 + 0.02), 0), b = P(nx * (u1 - 0.02), 0);
      ctx.save(); ctx.beginPath(); ctx.moveTo(a.x, a.y - wallH * 0.52); ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - wallH * 0.72, b.x, b.y - wallH * 0.55); ctx.strokeStyle = C.red; ctx.lineWidth = LWI * 1.2; ctx.stroke(); ctx.restore();
    }
    { const c = P(nx * 0.25, 0); const cy = c.y - wallH * 0.9; if (!(nx >= 7)) {} ctx.beginPath(); ctx.ellipse(c.x, cy, tw * 0.1, tw * 0.11, -0.45, 0, 7); ctx.fillStyle = C.cream; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = LWI; ctx.stroke(); const a = ((hour % 12) / 12) * Math.PI * 2 - Math.PI / 2; ctx.beginPath(); ctx.moveTo(c.x, cy); ctx.lineTo(c.x + Math.cos(a) * tw * 0.055, cy + Math.sin(a) * tw * 0.055); ctx.moveTo(c.x, cy); ctx.lineTo(c.x, cy - tw * 0.08); ctx.stroke(); }
    // 회사 간판 (오른쪽 벽 위)
    { const a = P(nx * 0.58, 0); drawLogo(ctx, comp, a.x, a.y - wallH * 0.93, tw * 0.15); }
    if (skey === 'vintage' && open) { const a = P(nx * 0.18, 0); ctx.save(); ctx.translate(a.x, a.y - wallH * 0.62); ctx.transform(1, 0.5, 0, 1, 0, 0); ctx.fillStyle = '#ff7aa8'; ctx.shadowColor = '#ff7aa8'; ctx.shadowBlur = 10; ctx.font = `bold ${Math.round(tw * 0.22)}px "Jua",sans-serif`; ctx.textAlign = 'center'; ctx.fillText('OPEN', 0, 0); ctx.restore(); }
    if (skey === 'plant') for (let i = 0; i < 6; i++) { const a = P(nx * (0.06 + i * 0.16), 0); ctx.beginPath(); ctx.moveTo(a.x, a.y - wallH); ctx.quadraticCurveTo(a.x + 5, a.y - wallH * 0.86, a.x + 1, a.y - wallH * (0.7 + (i % 2) * 0.08)); ctx.strokeStyle = '#6fa36a'; ctx.lineWidth = LWI * 1.2; ctx.stroke(); for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.ellipse(a.x + (j % 2 ? 3 : -2), a.y - wallH * (0.95 - j * 0.09), tw * 0.04, tw * 0.025, 0.6, 0, 7); ctx.fillStyle = '#86bf7d'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = LWI * 0.7; ctx.stroke(); } }
    // 노후 흔적
    if (st.interior.cond < 65) { ctx.strokeStyle = 'rgba(94,31,43,0.35)'; ctx.lineWidth = LWI; for (let i = 0; i < (65 - st.interior.cond) / 6; i++) { const a = P(nx * hash(i, 1), 0), v = wallH * (0.4 + hash(i, 2) * 0.4); ctx.beginPath(); ctx.moveTo(a.x, a.y - v); ctx.lineTo(a.x + 6, a.y - v + 8); ctx.lineTo(a.x + 3, a.y - v + 14); ctx.stroke(); } }

    // ----- 편집 모드: 구역 표시 -----
    if (opts.edit) {
      ctx.save();
      for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) { const z = Sim.zoneAt(st, x, y); q([P(x, y), P(x + 1, y), P(x + 1, y + 1), P(x, y + 1)], z === 'kitchen' ? 'rgba(242,185,80,0.18)' : z === 'door' ? 'rgba(111,183,178,0.45)' : 'rgba(255,255,255,0.08)', 0); }
      ctx.setLineDash([3, 3]); ctx.globalAlpha = 0.45;
      for (let x = 0; x <= nx; x++) line(P(x, 0), P(x, ny), INK, 0.7);
      for (let y = 0; y <= ny; y++) line(P(0, y), P(nx, y), INK, 0.7);
      ctx.restore();
      const lab = (txt, x, y) => { const c = P(x, y); signBoard(ctx, c.x, c.y, txt.length * tw * 0.2 + 10, tw * 0.26, '#fff8ee', txt); };
      lab('주방', 1, ny - 0.5); lab('입구', nx - 0.5, ny - 0.5);
    }

    }
    // ----- 가구 -----
    const items = [];
    const seats = []; // 손님 자리 {x,y,dir}
    const occ = new Set();
    const drawF = (f, ghost) => {
      const F = Sim.FURN[f.k]; if (!F) return;
      const r = Sim.furnRect(f), x0 = f.x, y0 = f.y, x1 = f.x + r.w, y1 = f.y + r.d, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const along = r.w >= r.d; // 긴 쪽이 x 방향
      const push = (d, fn) => items.push({ d, draw: ghost ? () => { ctx.save(); ctx.globalAlpha = 0.65; fn(); ctx.restore(); } : fn });
      const chair = (x, y, back, col) => {
        // back: 등받이 방향 'x-','x+','y-','y+'
        push(x + y, () => {
          const s = 0.15; box(x - s, y - s, x + s, y + s, 0.2, 0.25, col, shade(col, -0.1));
          line(PZ(x - s * 0.8, y + s * 0.8, 0), PZ(x - s * 0.8, y + s * 0.8, 0.2), INK, 0.9); line(PZ(x + s * 0.8, y + s * 0.8, 0), PZ(x + s * 0.8, y + s * 0.8, 0.2), INK, 0.9); line(PZ(x + s * 0.8, y - s * 0.8, 0), PZ(x + s * 0.8, y - s * 0.8, 0.2), INK, 0.9);
          if (back === 'y-') box(x - s, y - s, x + s, y - s + 0.05, 0.25, 0.55, col, shade(col, -0.1));
          else if (back === 'x-') box(x - s, y - s, x - s + 0.05, y + s, 0.25, 0.55, col, shade(col, -0.1));
        });
        if (!ghost) seats.push({ x, y, d: x + y + 0.01, back });
      };
      if (F.floor) {
        push(-1 + (x0 + y0) * 0.001, () => {
          const i = 0.12; q([P(x0 + i, y0 + i), P(x1 - i, y0 + i), P(x1 - i, y1 - i), P(x0 + i, y1 - i)], skey === 'luxury' ? '#7a2d3b' : shade(C.acc, 0.25), 1.2);
          q([P(x0 + i + 0.18, y0 + i + 0.18), P(x1 - i - 0.18, y0 + i + 0.18), P(x1 - i - 0.18, y1 - i - 0.18), P(x0 + i + 0.18, y1 - i - 0.18)], null, 0.8);
          q([P(cx, y0 + 0.4), P(x1 - 0.4, cy), P(cx, y1 - 0.4), P(x0 + 0.4, cy)], C.red, 0.8);
          for (let k2 = 0; k2 <= 8; k2++) { const yy = y0 + i + (y1 - y0 - 2 * i) * k2 / 8; line(P(x1 - i, yy), P(x1 - i + 0.07, yy), INK, 0.6); line(P(x0 + i, yy), P(x0 + i - 0.07, yy), INK, 0.6); }
        });
        return;
      }
      switch (f.k) {
        case 'counter': {
          push(cx + cy, () => {
            const i = 0.08; box(x0 + i, y0 + i, x1 - i, y1 - i, 0, 0.5, C.cream, C.acc, C.acc2);
            ctx.save(); ctx.globalAlpha = 0.4; for (let k2 = 1; k2 < 6; k2++) { const yy = y0 + i + (y1 - y0 - 2 * i) * k2 / 6; line(PZ(x1 - i, yy, 0.04), PZ(x1 - i, yy, 0.44), INK, 0.6); } ctx.restore();
            box(x0 + i - 0.03, y0 + i - 0.03, x1 - i + 0.03, y1 - i + 0.03, 0.5, 0.54, C.wood, shade(C.wood, -0.1));
            // 계산기·팁 컵·케이크 돔
            const rx = x0 + 0.35, ry = along ? cx : y0 + 0.4;
            box(rx - 0.12, ry - 0.12, rx + 0.12, ry + 0.12, 0.54, 0.64, '#5b5f63', '#7d858a'); box(rx - 0.1, ry - 0.06, rx - 0.04, ry + 0.06, 0.64, 0.8, '#3e4a44', '#5b5f63');
            disc(x0 + 0.5, y1 - 0.4, 0.62, 0.07, '#fff8ee'); box(x0 + 0.44, y1 - 0.46, x0 + 0.56, y1 - 0.34, 0.54, 0.62, '#fff8ee', '#efe2d0');
            const dm = PZ(x0 + 0.45, y0 + 0.95, 0.54); ctx.beginPath(); ctx.ellipse(dm.x, dm.y, tw * 0.13, tw * 0.06, 0, 0, 7); ctx.fillStyle = C.cream; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = LWI; ctx.stroke();
            ctx.beginPath(); ctx.ellipse(dm.x, dm.y - tw * 0.04, tw * 0.07, tw * 0.035, 0, 0, 7); ctx.fillStyle = '#f6c6d6'; ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(dm.x, dm.y - tw * 0.02, tw * 0.11, tw * 0.15, 0, Math.PI, 0); ctx.fillStyle = 'rgba(220,235,245,0.45)'; ctx.fill(); ctx.stroke();
          });
          break;
        }
        case 'stove1': case 'stove2': case 'stove3': {
          push(cx + cy, () => {
            const i = 0.06, body = f.k === 'stove3' ? '#c94f4f' : f.k === 'stove2' ? '#b9bec2' : C.metal;
            box(x0 + i, y0 + i, x1 - i, y1 - i, 0, 0.48, '#4a4f53', body, shade(body, -0.12));
            q([PZ(x1 - i, y0 + 0.25, 0.08), PZ(x1 - i, y1 - 0.25, 0.08), PZ(x1 - i, y1 - 0.25, 0.32), PZ(x1 - i, y0 + 0.25, 0.32)], shade(body, -0.25), 0.8);
            const n = f.k === 'stove1' ? 2 : 4;
            for (let k2 = 0; k2 < n; k2++) { const bx = n === 2 ? cx : x0 + 0.32 + (k2 % 2) * 0.36, by = n === 2 ? y0 + 0.3 + k2 * 0.4 : y0 + 0.32 + Math.floor(k2 / 2) * 0.36; disc(bx, by, 0.48, 0.11, '#2f3336', 0.8); if (open) { const fl = 0.04 + 0.015 * Math.sin(t / 120 + k2); disc(bx, by, 0.49, fl, f.k === 'stove3' ? '#ff9a3c' : '#6fa8ff', 0); } }
            for (let k2 = 0; k2 < 3; k2++) disc(x1 - i, y0 + 0.3 + k2 * 0.2, 0.4, 0.03, f.k === 'stove3' ? '#f2d36b' : INK, 0);
            if (n === 2 || f.k === 'stove3') { // 냄비
              const px = cx, py = y0 + 0.3; box(px - 0.13, py - 0.13, px + 0.13, py + 0.13, 0.5, 0.68, '#9aa3aa', '#7d858a', '#6b737a');
              if (open) for (let k2 = 0; k2 < 3; k2++) { const ph = (t / 1500 + k2 / 3) % 1, c = PZ(px + Math.sin(ph * 5 + k2) * 0.08, py, 0.75 + ph * 0.5); ctx.fillStyle = `rgba(255,255,255,${0.75 * (1 - ph)})`; ctx.beginPath(); ctx.arc(c.x, c.y, tw * (0.04 + ph * 0.05), 0, 7); ctx.fill(); }
            }
          });
          break;
        }
        case 'fridge1': case 'fridge2': case 'fridge3': {
          push(cx + cy, () => {
            const i = 0.1, hgt = f.k === 'fridge1' ? 0.85 : 1.2, body = f.k === 'fridge3' ? '#d0d2ee' : '#eef2f4';
            box(x0 + i, y0 + i, x1 - i, y1 - i, 0, hgt, shade(body, -0.06), body, shade(body, -0.1));
            if (f.k === 'fridge3') { q([PZ(x1 - i, y0 + 0.2, 0.1), PZ(x1 - i, y1 - 0.2, 0.1), PZ(x1 - i, y1 - 0.2, hgt - 0.1), PZ(x1 - i, y0 + 0.2, hgt - 0.1)], 'rgba(190,220,240,0.7)', 0.9); for (let r2 = 0; r2 < 3; r2++) for (let k2 = 0; k2 < 3; k2++) { const p = PZ(x1 - i, y0 + 0.3 + k2 * 0.2, 0.2 + r2 * 0.32); ctx.fillStyle = [C.red, '#e3a63c', '#8fb38a'][(r2 + k2) % 3]; ctx.fillRect(p.x - 1.5, p.y - tw * 0.16, 3, tw * 0.16); } }
            else { line(PZ(x1 - i, y0 + i, hgt * 0.62), PZ(x1 - i, y1 - i, hgt * 0.62), INK, 0.9); if (f.k === 'fridge2') line(PZ(x1 - i, cy, 0), PZ(x1 - i, cy, hgt), INK, 0.9); line(PZ(x1 - i, y0 + 0.25, hgt * 0.7), PZ(x1 - i, y0 + 0.25, hgt * 0.85), INK, 1.6); line(PZ(x1 - i, y0 + 0.25, hgt * 0.35), PZ(x1 - i, y0 + 0.25, hgt * 0.52), INK, 1.6); }
            const m = PZ(x0 + 0.3, y1 - i, hgt * 0.8); ctx.beginPath(); ctx.arc(m.x, m.y, tw * 0.035, 0, 7); ctx.fillStyle = C.red; ctx.fill();
          });
          break;
        }
        case 'espresso': {
          push(cx + cy, () => {
            const i = 0.06; box(x0 + i, y0 + i, x1 - i, y1 - i, 0, 0.48, C.wood, C.acc, C.acc2);
            box(cx - 0.25, cy - 0.28, cx + 0.22, cy + 0.28, 0.48, 0.85, '#e8e4e0', '#c9cdd1', '#aeb3b8');
            box(cx - 0.25, cy - 0.28, cx - 0.05, cy + 0.28, 0.85, 0.9, '#9aa3aa', '#7d858a');
            for (let k2 = 0; k2 < 2; k2++) { const p = PZ(cx + 0.22, cy - 0.12 + k2 * 0.24, 0.64); ctx.beginPath(); ctx.rect(p.x - 2, p.y - 1, 6, 3); ctx.fillStyle = INK; ctx.fill(); }
            for (let k2 = 0; k2 < 3; k2++) box(x0 + 0.12, y1 - 0.25, x0 + 0.28, y1 - 0.12, 0.48 + k2 * 0.08, 0.56 + k2 * 0.08, '#fff8ee', '#efe2d0');
            if (open) { const ph = (t / 1800) % 1, c = PZ(cx, cy, 1 + ph * 0.4); ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - ph)})`; ctx.beginPath(); ctx.arc(c.x, c.y, tw * 0.05, 0, 7); ctx.fill(); }
          });
          break;
        }
        case 'oven': {
          push(cx + cy, () => {
            const i = 0.07; box(x0 + i, y0 + i, x1 - i, y1 - i, 0, 0.8, '#b9bec2', '#d7d2cc', '#c3beb8');
            q([PZ(x1 - i, y0 + 0.2, 0.18), PZ(x1 - i, y1 - 0.2, 0.18), PZ(x1 - i, y1 - 0.2, 0.55), PZ(x1 - i, y0 + 0.2, 0.55)], open ? '#ffb45a' : '#4a4f53', 1);
            line(PZ(x1 - i, y0 + 0.2, 0.62), PZ(x1 - i, y1 - 0.2, 0.62), INK, 1.6);
            if (open) { ctx.save(); ctx.globalAlpha = 0.5 + 0.2 * Math.sin(t / 300); const c = PZ(x1 - i, cy, 0.36); ctx.fillStyle = '#ffe2a0'; ctx.beginPath(); ctx.arc(c.x, c.y, tw * 0.12, 0, 7); ctx.fill(); ctx.restore(); }
          });
          break;
        }
        case 'sink': {
          push(cx + cy, () => {
            const i = 0.06; box(x0 + i, y0 + i, x1 - i, y1 - i, 0, 0.48, '#dcdcf4', '#eef2f4', '#d6dadd');
            const c = PZ(cx, cy, 0.48); ctx.beginPath(); ctx.ellipse(c.x, c.y, tw * 0.22, tw * 0.1, 0, 0, 7); ctx.fillStyle = '#b8c4cc'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = LWI; ctx.stroke();
            line(PZ(x0 + 0.2, cy, 0.48), PZ(x0 + 0.2, cy, 0.75), INK, 1.6); line(PZ(x0 + 0.2, cy, 0.75), PZ(x0 + 0.38, cy, 0.72), INK, 1.6);
            for (let k2 = 0; k2 < 3; k2++) disc(x1 - 0.25, y0 + 0.25, 0.5 + k2 * 0.03, 0.09, '#fff8ee', 0.7);
          });
          break;
        }
        case 'showcase': {
          push(cx + cy, () => {
            const i = 0.07; box(x0 + i, y0 + i, x1 - i, y1 - i, 0, 0.38, C.wood, C.acc, C.acc2);
            const cols = st.cat === 'bakery' || st.cat === 'brunch' ? ['#d9a05b', '#c8874a', '#e8bd7a'] : ['#f6c6d6', '#fff1d6', '#c98b6b'];
            for (let k2 = 0; k2 < 4; k2++) { const c = PZ(x0 + 0.3 + (k2 % 2) * 0.4, y0 + 0.3 + Math.floor(k2 / 2) * 0.4, 0.46); ctx.beginPath(); ctx.ellipse(c.x, c.y, tw * 0.1, tw * 0.06, 0, 0, 7); ctx.fillStyle = cols[k2 % 3]; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = LWI * 0.8; ctx.stroke(); }
            ctx.save(); ctx.globalAlpha = 0.45; box(x0 + i, y0 + i, x1 - i, y1 - i, 0.38, 0.72, '#e6f2f8', '#d6eaf4', '#c6e0ee', 0.9); ctx.restore();
            ctx.save(); ctx.globalAlpha = 0.9; q([PZ(x0 + i, y1 - i, 0.72), PZ(x1 - i, y1 - i, 0.72), PZ(x1 - i, y0 + i, 0.72), PZ(x0 + i, y0 + i, 0.72)], null, 1); line(PZ(x1 - i, y1 - i, 0.38), PZ(x1 - i, y1 - i, 0.72), INK, 1); ctx.restore();
          });
          break;
        }
        case 'table2': {
          chair(cx - 0.32, cy, 'x-', C.wood); chair(cx, cy - 0.32, 'y-', C.wood);
          push(cx + cy + 0.02, () => {
            ctx.fillStyle = 'rgba(94,31,43,0.1)'; const s = P(cx, cy); ctx.beginPath(); ctx.ellipse(s.x, s.y, tw * 0.26, tw * 0.12, 0, 0, 7); ctx.fill();
            line(PZ(cx, cy, 0), PZ(cx, cy, 0.42), INK, 2.2); disc(cx, cy, 0, 0.1, C.acc, 0.9);
            disc(cx, cy, 0.42, 0.27, skey === 'luxury' ? '#e9e3da' : C.wood, 1.1);
            const v = PZ(cx + 0.05, cy - 0.05, 0.42); ctx.beginPath(); ctx.ellipse(v.x, v.y - tw * 0.06, tw * 0.035, tw * 0.07, 0, 0, 7); ctx.fillStyle = 'rgba(220,235,245,0.8)'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = LWI * 0.8; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(v.x, v.y - tw * 0.1); ctx.lineTo(v.x + 1, v.y - tw * 0.2); ctx.stroke(); ctx.beginPath(); ctx.arc(v.x + 1, v.y - tw * 0.21, tw * 0.035, 0, 7); ctx.fillStyle = C.red; ctx.fill(); ctx.stroke();
          });
          chair(cx + 0.32, cy, 'x+', C.wood); chair(cx, cy + 0.32, 'y+', C.wood);
          break;
        }
        case 'table4': case 'bar': {
          const hi = f.k === 'bar', zt = hi ? 0.62 : 0.42;
          const cs = [];
          if (along) { for (const xx of [x0 + 0.5, x1 - 0.5]) { cs.push([xx, y0 + 0.15, 'y-']); if (!hi) cs.push([xx, y1 - 0.15, 'y+']); } if (hi) cs.push([cx, y0 + 0.15, 'y-']); }
          else { for (const yy of [y0 + 0.5, y1 - 0.5]) { cs.push([x0 + 0.15, yy, 'x-']); if (!hi) cs.push([x1 - 0.15, yy, 'x+']); } if (hi) cs.push([x0 + 0.15, cy, 'x-']); }
          const stool = (x, y) => { push(x + y, () => { line(PZ(x, y, 0), PZ(x, y, 0.42), INK, 1.8); disc(x, y, 0, 0.08, C.metal, 0.8); disc(x, y, 0.42, 0.12, C.red, 1); }); seats.push({ x, y, d: x + y + 0.01, back: 'none', hi: true }); };
          for (const [x, y, b] of cs) { if (b.endsWith('-')) hi ? stool(x, y) : chair(x, y, b, C.wood); }
          push(cx + cy + 0.02, () => {
            const ix = along ? 0.12 : 0.28, iy = along ? 0.28 : 0.12;
            for (const [lx, ly] of [[x0 + ix + 0.05, y0 + iy + 0.05], [x1 - ix - 0.05, y0 + iy + 0.05], [x1 - ix - 0.05, y1 - iy - 0.05], [x0 + ix + 0.05, y1 - iy - 0.05]]) line(PZ(lx, ly, 0), PZ(lx, ly, zt), INK, 1.6);
            box(x0 + ix, y0 + iy, x1 - ix, y1 - iy, zt - 0.05, zt, hi ? C.cream : (skey === 'luxury' ? '#e9e3da' : C.wood), shade(hi ? C.acc : C.wood, -0.1));
            for (let k2 = 0; k2 < 2; k2++) { const p = along ? [x0 + 0.5 + k2, cy] : [cx, y0 + 0.5 + k2]; disc(p[0], p[1], zt, 0.08, '#fff8ee', 0.7); }
          });
          for (const [x, y, b] of cs) { if (b.endsWith('+')) chair(x, y, b, C.wood); }
          break;
        }
        case 'sofa': {
          const col = skey === 'luxury' ? '#7a2d3b' : skey === 'nordic' ? '#9bb7c7' : C.red;
          push(cx + cy, () => {
            if (along) { box(x0 + 0.06, y0 + 0.1, x1 - 0.06, y0 + 0.32, 0, 0.6, shade(col, 0.1), col); box(x0 + 0.06, y0 + 0.1, x1 - 0.06, y1 - 0.12, 0, 0.26, shade(col, 0.15), col); box(x0 + 0.06, y0 + 0.1, x0 + 0.22, y1 - 0.12, 0, 0.42, shade(col, 0.05), col); box(x1 - 0.22, y0 + 0.1, x1 - 0.06, y1 - 0.12, 0, 0.42, shade(col, 0.05), col); for (let k2 = 0; k2 < 2; k2++) box(x0 + 0.3 + k2 * 0.72, y0 + 0.34, x0 + 0.98 + k2 * 0.72, y1 - 0.16, 0.26, 0.33, shade(col, 0.25), shade(col, 0.05)); disc(x0 + 0.55, y0 + 0.35, 0.48, 0.12, C.cream); }
            else { box(x0 + 0.1, y0 + 0.06, x0 + 0.32, y1 - 0.06, 0, 0.6, shade(col, 0.1), col); box(x0 + 0.1, y0 + 0.06, x1 - 0.12, y1 - 0.06, 0, 0.26, shade(col, 0.15), col); box(x0 + 0.1, y0 + 0.06, x1 - 0.12, y0 + 0.22, 0, 0.42, shade(col, 0.05), col); box(x0 + 0.1, y1 - 0.22, x1 - 0.12, y1 - 0.06, 0, 0.42, shade(col, 0.05), col); for (let k2 = 0; k2 < 2; k2++) box(x0 + 0.34, y0 + 0.3 + k2 * 0.72, x1 - 0.16, y0 + 0.98 + k2 * 0.72, 0.26, 0.33, shade(col, 0.25), shade(col, 0.05)); disc(x0 + 0.35, y0 + 0.55, 0.48, 0.12, C.cream); }
          });
          for (let k2 = 0; k2 < 3; k2++) seats.push(along ? { x: x0 + 0.42 + k2 * 0.58, y: cy + 0.05, d: cx + cy + 0.05 + k2 * 0.01, back: 'sofa' } : { x: cx + 0.05, y: y0 + 0.42 + k2 * 0.58, d: cx + cy + 0.05 + k2 * 0.01, back: 'sofa' });
          break;
        }
        case 'waiting': {
          push(cx + cy, () => { box(x0 + 0.1, y0 + 0.15, x1 - 0.1, y0 + 0.5, 0.22, 0.28, C.acc, C.acc2); box(x0 + 0.1, y0 + 0.12, x1 - 0.1, y0 + 0.2, 0.28, 0.55, C.acc, C.acc2); line(PZ(x0 + 0.15, y0 + 0.45, 0), PZ(x0 + 0.15, y0 + 0.45, 0.22), INK, 1.2); line(PZ(x1 - 0.15, y0 + 0.45, 0), PZ(x1 - 0.15, y0 + 0.45, 0.22), INK, 1.2); });
          break;
        }
        case 'plant': case 'tree': {
          push(cx + cy, () => {
            const big = f.k === 'tree';
            box(cx - 0.16, cy - 0.16, cx + 0.16, cy + 0.16, 0, big ? 0.32 : 0.26, '#7a3f2c', '#d9785f', '#c3654c');
            if (big) { line(PZ(cx, cy, 0.32), PZ(cx, cy, 1.1), '#8a5a3c', 2.4); const c = PZ(cx, cy, 1.25); ctx.beginPath(); ctx.arc(c.x, c.y, tw * 0.3, 0, 7); ctx.moveTo(c.x - tw * 0.1, c.y + tw * 0.15); ctx.arc(c.x - tw * 0.22, c.y + tw * 0.15, tw * 0.2, 0, 7); ctx.moveTo(c.x + tw * 0.4, c.y + tw * 0.12); ctx.arc(c.x + tw * 0.22, c.y + tw * 0.12, tw * 0.2, 0, 7); ctx.fillStyle = '#7d9c55'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = LWI * 1.2; ctx.stroke(); }
            else { const c = PZ(cx, cy, 0.3); const leaves = [[-0.2, -0.32, -0.7], [0.18, -0.36, 0.6], [-0.05, -0.5, 0], [0.24, -0.18, 1.1], [-0.26, -0.16, -1.1]]; for (const [lx, ly, a] of leaves) { ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.quadraticCurveTo(c.x + lx * tw * 0.4, c.y + ly * tw * 0.3, c.x + lx * tw, c.y + ly * tw); ctx.strokeStyle = '#5d7a3e'; ctx.lineWidth = LWI; ctx.stroke(); ctx.beginPath(); ctx.ellipse(c.x + lx * tw, c.y + ly * tw, tw * 0.12, tw * 0.075, a, 0, 7); ctx.fillStyle = '#7d9c55'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = LWI; ctx.stroke(); } }
          });
          break;
        }
        case 'shelf': {
          push(cx + cy - 0.3, () => {
            const bx0 = along ? x0 + 0.05 : x0 + 0.05, by0 = y0 + 0.05, bx1 = along ? x1 - 0.05 : x0 + 0.4, by1 = along ? y0 + 0.4 : y1 - 0.05;
            box(bx0, by0, bx1, by1, 0, 1.3, C.wood, along ? C.acc : shade(C.acc, -0.1), along ? shade(C.acc, -0.12) : C.acc);
            for (let r2 = 0; r2 < 4; r2++) {
              const z0 = 0.06 + r2 * 0.31, z1 = z0 + 0.25;
              if (along) { q([PZ(bx0 + 0.05, by1, z0), PZ(bx1 - 0.05, by1, z0), PZ(bx1 - 0.05, by1, z1), PZ(bx0 + 0.05, by1, z1)], shade(C.acc, -0.35), 0.7); for (let k2 = 0; k2 < 9; k2++) { const u0 = bx0 + 0.07 + k2 * 0.095, hh = z1 - 0.02 - hash(f.x * 7 + k2, r2) * 0.07; if (hash(k2, r2, 9) < 0.12) continue; q([PZ(u0, by1, z0), PZ(u0 + 0.075, by1, z0), PZ(u0 + 0.075, by1, hh), PZ(u0, by1, hh)], [C.red, '#f2d36b', '#fff4ea', '#9ea7de', '#e58ba3', '#e3a63c'][(k2 + r2 * 2) % 6], 0.6); } }
              else { q([PZ(bx1, by0 + 0.05, z0), PZ(bx1, by1 - 0.05, z0), PZ(bx1, by1 - 0.05, z1), PZ(bx1, by0 + 0.05, z1)], shade(C.acc, -0.35), 0.7); for (let k2 = 0; k2 < 9; k2++) { const u0 = by0 + 0.07 + k2 * 0.095, hh = z1 - 0.02 - hash(f.y * 7 + k2, r2) * 0.07; if (hash(k2, r2, 9) < 0.12) continue; q([PZ(bx1, u0, z0), PZ(bx1, u0 + 0.075, z0), PZ(bx1, u0 + 0.075, hh), PZ(bx1, u0, hh)], [C.red, '#f2d36b', '#fff4ea', '#9ea7de', '#e58ba3', '#e3a63c'][(k2 + r2 * 2) % 6], 0.6); } }
            }
            const top = PZ(bx0 + 0.2, by0 + 0.15, 1.3); ctx.beginPath(); ctx.rect(top.x - 3, top.y - 5, 6, 5); ctx.fillStyle = '#d9785f'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = LWI * 0.8; ctx.stroke(); ctx.beginPath(); ctx.arc(top.x, top.y - 8, 4, 0, 7); ctx.fillStyle = '#8fb38a'; ctx.fill(); ctx.stroke();
          });
          break;
        }
        case 'lamp': {
          push(cx + cy, () => {
            disc(cx, cy, 0, 0.12, C.wood, 0.9); line(PZ(cx, cy, 0), PZ(cx, cy, 1.15), INK, 1.4);
            const c = PZ(cx, cy, 1.15); const glow = open && (hour >= 17 || hour < 7);
            if (glow) { ctx.fillStyle = 'rgba(255,220,150,0.25)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + tw * 0.6, tw * 0.5, tw * 0.25, 0, 0, 7); ctx.fill(); }
            ctx.beginPath(); ctx.moveTo(c.x - tw * 0.1, c.y - tw * 0.18); ctx.lineTo(c.x + tw * 0.1, c.y - tw * 0.18); ctx.lineTo(c.x + tw * 0.17, c.y + tw * 0.02); ctx.lineTo(c.x - tw * 0.17, c.y + tw * 0.02); ctx.closePath(); ctx.fillStyle = glow ? '#ffe2a0' : '#e3a63c'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = LWI; ctx.stroke();
          });
          break;
        }
        case 'piano': {
          push(cx + cy - 0.2, () => {
            const bx0 = x0 + 0.08, by0 = y0 + 0.08, bx1 = along ? x1 - 0.08 : x0 + 0.5, by1 = along ? y0 + 0.5 : y1 - 0.08;
            box(bx0, by0, bx1, by1, 0, 0.95, '#3b2228', '#5a3a2e', '#4a2e25');
            if (along) { box(bx0 + 0.05, by1, bx1 - 0.05, by1 + 0.18, 0.42, 0.48, '#fff8ee', '#3b2228'); for (let k2 = 1; k2 < 14; k2++) line(PZ(bx0 + 0.05 + k2 * (bx1 - bx0 - 0.1) / 14, by1 + 0.18, 0.48), PZ(bx0 + 0.05 + k2 * (bx1 - bx0 - 0.1) / 14, by1, 0.48), INK, 0.5); box(cx - 0.3, by1 + 0.35, cx + 0.3, by1 + 0.5, 0.3, 0.35, '#5a3a2e', '#3b2228'); }
            else { box(bx1, by0 + 0.05, bx1 + 0.18, by1 - 0.05, 0.42, 0.48, '#fff8ee', '#3b2228'); box(bx1 + 0.35, cy - 0.3, bx1 + 0.5, cy + 0.3, 0.3, 0.35, '#5a3a2e', '#3b2228'); }
            const c = PZ(bx0 + 0.25, by0 + 0.2, 0.95); ctx.beginPath(); ctx.ellipse(c.x, c.y - 3, 3, 6, 0, 0, 7); ctx.fillStyle = 'rgba(220,235,245,0.8)'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = LWI * 0.8; ctx.stroke();
          });
          break;
        }
        case 'radio': {
          push(cx + cy, () => {
            line(PZ(cx - 0.12, cy, 0), PZ(cx - 0.12, cy, 0.4), INK, 1.3); line(PZ(cx + 0.12, cy, 0), PZ(cx + 0.12, cy, 0.4), INK, 1.3);
            disc(cx, cy, 0.4, 0.2, C.wood, 1);
            box(cx - 0.15, cy - 0.1, cx + 0.15, cy + 0.1, 0.4, 0.6, shade(C.red, 0.1), C.red); const p = PZ(cx + 0.02, cy + 0.1, 0.5); ctx.beginPath(); ctx.arc(p.x, p.y, tw * 0.045, 0, 7); ctx.fillStyle = C.cream; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = LWI * 0.8; ctx.stroke();
            if (open) { const ph = (t / 1200) % 1, c = PZ(cx + 0.2, cy, 0.8 + ph * 0.4); ctx.fillStyle = `rgba(94,31,43,${0.8 * (1 - ph)})`; ctx.font = `${Math.round(tw * 0.2)}px "Jua",sans-serif`; ctx.fillText('♪', c.x, c.y); }
          });
          break;
        }
      }
    };
    for (const f of furn) { drawF(f); for (const [x, y] of Sim.furnCells(f)) if (!Sim.FURN[f.k].floor) occ.add(x + ',' + y); }
    if (opts.ghost && Sim.FURN[opts.ghost.k]) {
      const g = opts.ghost, ok = Sim.furnFits(st, g);
      for (const [x, y] of Sim.furnCells(g)) if (x >= 0 && y >= 0 && x < nx && y < ny) items.push({ d: ok ? -0.5 : 999, draw: () => q([P(x, y), P(x + 1, y), P(x + 1, y + 1), P(x, y + 1)], ok ? 'rgba(143,179,138,0.55)' : 'rgba(228,107,95,0.45)', 1) });
      if (ok) drawF(g, true);
    }
    if (opts.erase) { const e = opts.erase; items.push({ d: 999, draw: () => q([P(e.x, e.y), P(e.x + 1, e.y), P(e.x + 1, e.y + 1), P(e.x, e.y + 1)], 'rgba(228,107,95,0.5)', 1) }); }
    // 펜던트 조명 (등급이 높을수록)
    if (tier >= 2 && !E) for (const f of furn) if (/^table|bar/.test(f.k)) {
      const r = Sim.furnRect(f), cx = f.x + r.w / 2, cy = f.y + r.d / 2;
      items.push({ d: cx + cy + 0.5, draw: () => { const top = PZ(cx, cy, wallH / tw + 0.2), c = PZ(cx, cy, 1.45); line(top, c, 'rgba(94,31,43,0.6)', 0.7); ctx.beginPath(); ctx.moveTo(c.x - tw * 0.13, c.y + tw * 0.08); ctx.quadraticCurveTo(c.x, c.y - tw * 0.14, c.x + tw * 0.13, c.y + tw * 0.08); ctx.closePath(); ctx.fillStyle = skey === 'luxury' ? '#c7a35a' : tier >= 3 ? C.red : C.acc; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = LWI; ctx.stroke(); if (open && (hour >= 17 || hour < 7 || tier >= 4)) { ctx.fillStyle = 'rgba(255,220,150,0.22)'; const s = PZ(cx, cy, 0.42); ctx.beginPath(); ctx.ellipse(s.x, s.y, tw * 0.4, tw * 0.18, 0, 0, 7); ctx.fill(); } } });
    }
    // ----- 사람 -----
    const rs = (i, k) => hash(st.id * 13 + i, k, 77);
    const cust = i => ({ shirt: SHIRTS[Math.floor(rs(i, 1) * SHIRTS.length)], pants: PANTS[Math.floor(rs(i, 2) * PANTS.length)], hair: HAIR[Math.floor(rs(i, 3) * HAIR.length)], skin: SKIN[Math.floor(rs(i, 4) * SKIN.length)], hs: Math.floor(rs(i, 5) * 4), cap: rs(i, 6) < 0.12 ? SHIRTS[Math.floor(rs(i, 7) * SHIRTS.length)] : null });
    const want = open ? Math.round((st.hourly[hour] || st.hourly[(hour + 23) % 24] || 0) * cat.dwell * (1 - cat.takeout) * 0.5) : 0;
    const seated = Math.min(seats.length, (E ? Math.round(want * 0.45) : want) + (opts.visitors || 0));
    const order = seats.map((s, i) => ({ s, k: hash(st.id, i, 5) })).sort((a, b) => a.k - b.k).map(o => o.s);
    const pk = E ? Math.max(0.4, tw / 26) : tw / 26;
    for (let i = 0; i < seated; i++) {
      const s = order[i], o = cust(i);
      items.push({ d: s.d, draw: () => { const c = PZ(s.x, s.y, s.hi ? 0.42 : s.back === 'sofa' ? 0.26 : 0.25); person(ctx, c.x, c.y + tw * 0.05, Object.assign(o, { sit: true, k: pk, cup: rs(i, 8) < 0.5, arm: Math.max(0, Math.sin(t / 900 + i * 2)) * (rs(i, 9) < 0.4 ? 1 : 0) })); } });
    }
    // 줄 선 손님
    const ctr = furn.find(f => f.k === 'counter');
    if (open && want > seats.length * 0.6 && ctr) { const r = Sim.furnRect(ctr); for (let i = 0; i < Math.min(3, Math.ceil((want - seats.length * 0.6) / 3)); i++) { const x = ctr.x + r.w + 0.35 + i * 0.45, y = ctr.y + r.d * 0.5 + i * 0.2; const o = cust(50 + i); items.push({ d: x + y, draw: () => { const c = P(x, y); person(ctx, c.x, c.y, Object.assign(o, { k: pk, bob: i === 0 ? Math.abs(Math.sin(t / 500)) * 0.6 : 0 })); } }); } }
    // 직원
    const onDuty = open ? st.staff.filter(s => Sim.onDuty(st, s, hour)) : [];
    const freeK = [], freeH = [];
    for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) if (!occ.has(x + ',' + y) && Sim.zoneAt(st, x, y) !== 'door') (x < 2 ? freeK : freeH).push([x + 0.5, y + 0.5]);
    const heat = furn.filter(f => /^stove|espresso|oven|sink/.test(f.k));
    onDuty.forEach((s, i) => {
      let x, y, walk = null;
      if (s.role === 'kitchen') {
        if (freeK.length) [x, y] = freeK[i % freeK.length];
        else { const h0 = heat[i % Math.max(1, heat.length)] || { x: 0, y: i }; x = 1.5; y = h0.y + 0.5; }
      } else if (s.role === 'manager') { if (ctr) { const r = Sim.furnRect(ctr); x = ctr.x + 0.5 - (ctr.x >= 1 ? 0.75 : -0.9); y = ctr.y + r.d / 2; if (x < 0.3) x = ctr.x + r.w + 0.3; } else { x = 2.3; y = 1; } }
      else if (freeH.length > 1) {
        const n = freeH.length, sp = 5200, tt = t / sp + i * 0.41, a = Math.floor(tt) , f2 = tt - a;
        const p0 = freeH[Math.floor(hash(s.id, a, 3) * n)], p1 = freeH[Math.floor(hash(s.id, a + 1, 3) * n)];
        const e = f2 < 0.55 ? 0 : (f2 - 0.55) / 0.45, ee = e * e * (3 - 2 * e);
        x = p0[0] + (p1[0] - p0[0]) * ee; y = p0[1] + (p1[1] - p0[1]) * ee; if (e > 0 && e < 1) walk = t / 110;
      } else { x = 2.5 + i * 0.4; y = 0.8; }
      items.push({ d: x + y + 0.02, draw: () => {
        const c = P(x, y), hi = opts.hoverStaff === s.id;
        if (hi) { ctx.fillStyle = 'rgba(242,185,80,0.5)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 1, tw * 0.28, tw * 0.13, 0, 0, 7); ctx.fill(); }
        person(ctx, c.x, c.y, { k: pk, shirt: '#fff8ee', pants: '#3b2228', hair: HAIR[s.id % HAIR.length], skin: SKIN[s.id % SKIN.length], hs: s.id % 4, apron: comp.color, walk, bob: s.role === 'kitchen' ? Math.abs(Math.sin(t / 260 + i)) * 0.8 : 0, cap: s.role === 'kitchen' ? '#fff8ee' : null, cup: s.role === 'hall' && !walk });
        const em = s.role === 'manager' ? '⭐' : s.morale < 40 ? '💧' : s.morale > 85 ? '♪' : '';
        if (em) { if (em === '♪') { ctx.font = `${Math.round(tw * 0.22)}px "Jua",sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.fillText(em, c.x + tw * 0.2, c.y - tw * 0.95); } else icon(ctx, em, c.x + tw * 0.2, c.y - tw * 0.98, tw * 0.24, 2, em === '⭐' ? '#f2d36b' : '#bfe0f3'); }
      } });
    });
    // 고양이 (꾸밈이 좋은 매장엔 가게 고양이가 놀러 와요)
    const fx = Sim.furnFx(st);
    if (fx && fx.sum.deco >= 8 && freeH.length) { const [x, y] = freeH[Math.floor(hash(st.id, Math.floor(t / 20000), 4) * freeH.length)]; items.push({ d: x + y, draw: () => { const c = P(x, y); const ck = E ? 0.42 : 1; ctx.save(); ctx.translate(c.x, c.y); ctx.scale(ck, ck); ctx.translate(-c.x, -c.y); ctx.beginPath(); ctx.ellipse(c.x, c.y - 4, 7, 4, 0, 0, 7); ctx.fillStyle = '#e3a63c'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = LWI; ctx.stroke(); ctx.beginPath(); ctx.arc(c.x + 6, c.y - 8, 3.5, 0, 7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(c.x - 7, c.y - 4); ctx.quadraticCurveTo(c.x - 12, c.y - 12 + Math.sin(t / 400) * 2, c.x - 9, c.y - 14); ctx.stroke(); ctx.restore(); } }); }
    items.sort((a, b) => a.d - b.d);
    for (const it of items) it.draw();
    // 영업 상태
    if (E) return;
    if (!open && !opts.edit) { ctx.fillStyle = 'rgba(70,62,120,0.3)'; ctx.fillRect(0, 0, W, Hh); signBoard(ctx, W / 2, 26, 170, 24, '#fff8ee', `영업 준비 중 · ${st.open}시 오픈`); }
    else if (hour >= 18 || hour < 6) { ctx.fillStyle = 'rgba(255,190,110,0.08)'; ctx.fillRect(0, 0, W, Hh); }
  };
  // 화면 좌표 → 매장 칸
  Renderer.interiorCell = function (canvas, sx, sy) {
    const L = canvas._lay; if (!L) return null;
    const dx = sx - L.ox, dy = sy - L.oy, a = dx / (L.tw / 2), b = dy / (L.th / 2);
    const x = Math.floor((a + b) / 2), y = Math.floor((b - a) / 2);
    return x >= 0 && y >= 0 && x < L.nx && y < L.ny ? { x, y } : null;
  };


  root.Renderer = Renderer;
})(typeof window !== 'undefined' ? window : globalThis);
