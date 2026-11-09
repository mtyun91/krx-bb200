/* 모락모락 타운 — 아이소메트릭 캔버스 렌더러 (도시 + 매장 내부) */
(function (root) {
  'use strict';
  const Sim = root.Sim;
  const TW = 64, TH = 32, HW = TW / 2, HH = TH / 2;
  const REDUCED = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

  const SEASON_GRASS = {
    spring: ['#cfe6bf', '#c7e1b5', '#d6eac8'], summer: ['#b9dca6', '#b0d69c', '#c2e1b0'],
    autumn: ['#dfdcae', '#d8d3a2', '#e4e1b8'], winter: ['#e6eeea', '#dfe9e5', '#edf3f0'],
  };
  const TREE = {
    spring: ['#f5c3d3', '#f9d7e2', '#a9d39a'], summer: ['#86bf7d', '#98cb8c', '#76b06f'],
    autumn: ['#eba468', '#f1c072', '#df8a5d'], winter: ['#f4f8f8', '#e6eeee', '#9dbfa8'],
  };
  const WALLS = ['#fbe3d4', '#e4eefa', '#fdf1c9', '#e2f1e4', '#f1e3f4', '#ffe9dc'];
  const ROOFS = ['#e9967a', '#86a8cf', '#e6b65c', '#8fbf95', '#b495c7', '#d98d8d'];
  const SHIRTS = ['#e98a7a', '#7fa7d6', '#f2c14e', '#86b98f', '#b495c7', '#f0a6c0', '#6fb7b2', '#c9a27e'];
  const HAIR = ['#3b2f2a', '#5a4033', '#1f1b1a', '#8a5a3c', '#c79b6b'];

  function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + (s || 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }
  function iso(x, y) { return { x: (x - y) * HW, y: (x + y) * HH }; }
  function diamondPath(ctx, cx, cy, s, hw, hh) {
    hw = hw || HW; hh = hh || HH;
    ctx.beginPath(); ctx.moveTo(cx, cy - hh * s); ctx.lineTo(cx + hw * s, cy); ctx.lineTo(cx, cy + hh * s); ctx.lineTo(cx - hw * s, cy); ctx.closePath();
  }
  function diamond(ctx, cx, cy, s, fill) { diamondPath(ctx, cx, cy, s); ctx.fillStyle = fill; ctx.fill(); }
  function box(ctx, cx, cy, s, h, wall, top, dark) {
    const l = { x: cx - HW * s, y: cy }, r = { x: cx + HW * s, y: cy }, b = { x: cx, y: cy + HH * s };
    ctx.fillStyle = shade(wall, -0.04);
    ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x, b.y - h); ctx.lineTo(l.x, l.y - h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(wall, dark == null ? -0.16 : dark);
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(r.x, r.y); ctx.lineTo(r.x, r.y - h); ctx.lineTo(b.x, b.y - h); ctx.closePath(); ctx.fill();
    if (top) diamond(ctx, cx, cy - h, s, top);
    ctx.strokeStyle = 'rgba(74,62,56,0.45)'; ctx.lineWidth = 0.8; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(b.x, b.y); ctx.lineTo(r.x, r.y); ctx.lineTo(r.x, r.y - h); ctx.lineTo(cx, cy - HH * s - h); ctx.lineTo(l.x, l.y - h); ctx.closePath();
    ctx.moveTo(b.x, b.y); ctx.lineTo(b.x, b.y - h); ctx.lineTo(l.x, l.y - h); ctx.moveTo(b.x, b.y - h); ctx.lineTo(r.x, r.y - h); ctx.stroke();
    return { l, r, b };
  }
  function pyramid(ctx, cx, cy, s, h, rh, roof) {
    ctx.fillStyle = roof;
    ctx.beginPath(); ctx.moveTo(cx - HW * s, cy - h); ctx.lineTo(cx, cy + HH * s - h); ctx.lineTo(cx, cy - h - rh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(roof, -0.15);
    ctx.beginPath(); ctx.moveTo(cx, cy + HH * s - h); ctx.lineTo(cx + HW * s, cy - h); ctx.lineTo(cx, cy - h - rh); ctx.closePath(); ctx.fill();
  }
  function faceQuad(ctx, cx, cy, s, side, u0, u1, v0, v1, color) {
    const sx = side === 'L' ? -HW * s : HW * s;
    const ax = cx + sx * (1 - u0), ay = cy + HH * s * u0, bx = cx + sx * (1 - u1), by = cy + HH * s * u1;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(ax, ay - v0); ctx.lineTo(bx, by - v0); ctx.lineTo(bx, by - v1); ctx.lineTo(ax, ay - v1); ctx.closePath(); ctx.fill();
  }
  function windowsOn(ctx, cx, cy, s, h, rows, cols, color, side, lit) {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const on = lit && hash(cx | 0, (cy | 0) + r * 7, c) < lit;
      faceQuad(ctx, cx, cy, s, side, (c + 0.25) / cols, (c + 0.75) / cols, h * (r + 0.3) / rows, h * (r + 0.75) / rows, on ? '#ffd98a' : color);
    }
  }
  function shadow(ctx, cx, cy, s) { ctx.fillStyle = 'rgba(60,80,60,0.12)'; ctx.beginPath(); ctx.ellipse(cx + 4, cy + 3, HW * s, HH * s, 0, 0, Math.PI * 2); ctx.fill(); }
  function drawTree(ctx, cx, cy, season, k) {
    const c = TREE[season];
    ctx.fillStyle = 'rgba(60,80,60,0.12)'; ctx.beginPath(); ctx.ellipse(cx + 3, cy + 2, 10, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#a7826a'; ctx.fillRect(cx - 1.5, cy - 10, 3, 10);
    ctx.fillStyle = c[2]; ctx.beginPath(); ctx.arc(cx, cy - 15, 9, 0, 7); ctx.fill();
    ctx.fillStyle = c[k % 2]; ctx.beginPath(); ctx.arc(cx - 3, cy - 18, 7, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(cx - 5, cy - 21, 2.5, 0, 7); ctx.fill();
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
    ctx.lineWidth = Math.max(1, r * 0.18); ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = `bold ${Math.round(r * 1.05)}px "Jua","Gowun Dodum",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(comp.name.charAt(0), x, y + r * 0.08);
    ctx.restore();
  }

  function Renderer(canvas) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.cam = { x: 0, y: (Sim.W + Sim.H) * HH / 2, z: 0.9 };
    this.S = null; this.hover = null; this.sel = null; this.ghost = null; this.hourF = 12;
    this.overlay = null; this.walkers = []; this.trucks = []; this.floaters = []; this.particles = [];
    this.clouds = []; this.groundKey = ''; this.pathCache = new Map(); this.t = 0;
    for (let i = 0; i < 5; i++) this.clouds.push({ x: Math.random() * 2400 - 1200, y: Math.random() * 1000, s: 0.6 + Math.random() * 0.8 });
    this.resize();
  }
  const R = Renderer.prototype;
  Renderer.drawLogo = drawLogo;

  R.resize = function () {
    const r = this.c.getBoundingClientRect();
    this.dpr = Math.min(2, root.devicePixelRatio || 1);
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.c.width = this.w * this.dpr; this.c.height = this.h * this.dpr;
  };
  R.setState = function (S) { this.S = S; this.groundKey = ''; this.walkers = []; this.trucks = []; this.pathCache.clear(); };
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
    this.cam.z = Math.max(0.35, Math.min(2.6, this.cam.z * f));
    const after = this.toWorld(sx, sy);
    this.cam.x += before.x - after.x; this.cam.y += before.y - after.y;
  };
  R.fit = function () { this.cam.z = Math.max(0.35, Math.min(1.2, Math.min(this.w / (Sim.W * TW * 0.92), this.h / (Sim.H * TH * 1.15)))); this.cam.x = 0; this.cam.y = (Sim.W + Sim.H) * HH / 2 - 10; };

  // 0 = 낮, 1 = 한밤
  function darkness(h) {
    if (h >= 7 && h < 17.5) return 0;
    if (h >= 17.5 && h < 20) return (h - 17.5) / 2.5 * 0.85;
    if (h >= 5 && h < 7) return (7 - h) / 2 * 0.85;
    return 0.85;
  }
  function duskTint(h) { return (h >= 16.5 && h < 19.5) ? Math.sin((h - 16.5) / 3 * Math.PI) : (h >= 5 && h < 7.5 ? Math.sin((h - 5) / 2.5 * Math.PI) * 0.6 : 0); }

  // ---------- 바닥 캐시 ----------
  R.buildGround = function () {
    const S = this.S, season = Sim.seasonOf(S);
    const key = season + ':' + S.tiles.map(t => t.t[0]).join('');
    if (key === this.groundKey) return;
    this.groundKey = key;
    const W = Sim.W * TW + TW, Hh = (Sim.W + Sim.H) * HH + TH + 8;
    const g = this.ground || (this.ground = document.createElement('canvas'));
    g.width = W; g.height = Hh; this.gox = W / 2; this.goy = HH;
    const ctx = g.getContext('2d');
    ctx.clearRect(0, 0, W, Hh);
    const grass = SEASON_GRASS[season];
    for (const t of S.tiles) {
      const p = iso(t.x, t.y); const cx = p.x + this.gox, cy = p.y + this.goy;
      const kind = Sim.HOODS[t.h].kind;
      let col;
      if (t.t === 'road') col = season === 'winter' ? '#eef1f1' : '#ebe4d8';
      else if (t.t === 'water') col = '#a9d6e8';
      else if (kind === 'off') col = season === 'winter' ? '#e8ecea' : '#e3e6dc';
      else if (t.h === 5) col = season === 'winter' ? '#ece6e2' : '#e8ddd2';
      else col = grass[Math.floor(hash(t.x, t.y) * 3)];
      diamond(ctx, cx, cy, 1, col);
      if (t.t === 'road') {
        ctx.strokeStyle = 'rgba(160,145,120,0.25)'; ctx.lineWidth = 1; diamondPath(ctx, cx, cy, 1); ctx.stroke();
        const hor = t.y % Sim.ROAD_EVERY === 0, ver = t.x % Sim.ROAD_EVERY === 0;
        if (hor !== ver) {
          ctx.strokeStyle = '#fbf8f2'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath();
          if (hor) { ctx.moveTo(cx - HW * 0.5, cy - HH * 0.5); ctx.lineTo(cx + HW * 0.5, cy + HH * 0.5); }
          else { ctx.moveTo(cx + HW * 0.5, cy - HH * 0.5); ctx.lineTo(cx - HW * 0.5, cy + HH * 0.5); }
          ctx.stroke(); ctx.setLineDash([]);
        }
      } else if (t.t === 'water') {
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(cx - 8 + hash(t.x, t.y, 2) * 10, cy - 2 + hash(t.x, t.y, 3) * 4, 7, 1.5);
      } else if (kind !== 'off' && hash(t.x, t.y, 5) < 0.35) {
        ctx.fillStyle = season === 'spring' ? '#f7d6e0' : season === 'autumn' ? '#e8b878' : season === 'winter' ? '#ffffff' : '#f3e7a0';
        for (let i = 0; i < 3; i++) ctx.fillRect(cx - 12 + hash(t.x, t.y, 10 + i) * 24, cy - 5 + hash(t.x, t.y, 20 + i) * 10, 2, 2);
      }
    }
  };

  // ---------- 건물 ----------
  R.drawBuilding = function (ctx, t, cx, cy, season, night) {
    const S = this.S, b = t.b, k = b.k;
    const hv = hash(t.x, t.y, 7), ci = Math.floor(hv * WALLS.length);
    const snow = season === 'winter';
    const lit = night > 0.3 ? 0.55 : 0;
    if (k === 'res') {
      const h = 12 + b.lv * 7, s = 0.62 + Math.min(b.lv, 4) * 0.04;
      shadow(ctx, cx, cy, s); box(ctx, cx, cy, s, h, WALLS[ci]);
      windowsOn(ctx, cx, cy, s, h, Math.min(3, b.lv), 2, 'rgba(255,255,255,0.75)', 'L', lit);
      windowsOn(ctx, cx, cy, s, h, Math.min(3, b.lv), 2, 'rgba(255,255,255,0.55)', 'R', lit);
      pyramid(ctx, cx, cy, s, h, 14, snow ? '#f4f7f8' : ROOFS[ci]);
    } else if (k === 'off') {
      const h = 26 + b.lv * 16, s = 0.7;
      shadow(ctx, cx, cy, s);
      const wall = ['#dfe8f0', '#e8e4f0', '#e4efe9', '#f0ebe0'][ci % 4];
      box(ctx, cx, cy, s, h, wall, shade(wall, 0.3));
      const offLit = night > 0.3 && this.hourF < 22 ? 0.45 : night > 0.3 ? 0.08 : 0;
      windowsOn(ctx, cx, cy, s, h, 2 + b.lv * 2, 3, 'rgba(140,180,215,0.55)', 'L', offLit);
      windowsOn(ctx, cx, cy, s, h, 2 + b.lv * 2, 3, 'rgba(120,160,200,0.5)', 'R', offLit);
      if (snow) diamond(ctx, cx, cy - h, 0.7, '#ffffff');
    } else if (k === 'uni') {
      const h = 18 + b.lv * 9, s = 0.78;
      shadow(ctx, cx, cy, s); box(ctx, cx, cy, s, h, '#efc9b4', '#e9b9a0');
      windowsOn(ctx, cx, cy, s, h, 1 + b.lv, 3, 'rgba(255,250,235,0.8)', 'L', lit * 0.6);
      windowsOn(ctx, cx, cy, s, h, 1 + b.lv, 3, 'rgba(255,250,235,0.6)', 'R', lit * 0.6);
      ctx.fillStyle = '#9a8a7a'; ctx.fillRect(cx - 0.5, cy - h - 18, 1.5, 18);
      ctx.fillStyle = '#7fb2d9'; ctx.fillRect(cx + 1, cy - h - 18, 9, 6);
    } else if (k === 'tour') {
      const h = 16 + b.lv * 10, s = 0.74;
      shadow(ctx, cx, cy, s);
      const wall = ['#fff1d6', '#e0f3f1', '#fde2e6'][ci % 3];
      box(ctx, cx, cy, s, h, wall);
      windowsOn(ctx, cx, cy, s, h, 1 + b.lv, 3, 'rgba(255,200,150,0.55)', 'L', lit);
      windowsOn(ctx, cx, cy, s, h, 1 + b.lv, 3, 'rgba(255,200,150,0.45)', 'R', lit);
      pyramid(ctx, cx, cy, s, h, 10, snow ? '#f4f7f8' : '#7cc0b6');
    } else if (k === 'park') {
      diamond(ctx, cx, cy, 0.92, season === 'winter' ? '#eef5f2' : '#bfe3ab');
      ctx.fillStyle = '#e8dfcf'; ctx.beginPath(); ctx.ellipse(cx, cy, 11, 5.5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#a9d6e8'; ctx.beginPath(); ctx.ellipse(cx, cy, 7, 3.5, 0, 0, 7); ctx.fill();
      const jet = REDUCED ? 0 : Math.sin(this.t / 300) * 1.5;
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(cx - 1, cy - 8 - jet, 2, 7 + jet);
      drawTree(ctx, cx - 18, cy - 2, season, 1); drawTree(ctx, cx + 16, cy + 3, season, 2);
    } else if (k === 'bus') {
      ctx.fillStyle = '#9fb7c9'; ctx.fillRect(cx - 12, cy - 18, 2, 18); ctx.fillRect(cx + 10, cy - 14, 2, 14);
      ctx.fillStyle = '#7fb2d9'; ctx.beginPath(); ctx.moveTo(cx - 15, cy - 19); ctx.lineTo(cx + 15, cy - 14); ctx.lineTo(cx + 15, cy - 11); ctx.lineTo(cx - 15, cy - 16); ctx.fill();
      ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.arc(cx + 16, cy - 22, 4, 0, 7); ctx.fill();
      ctx.fillStyle = '#c7b8a5'; ctx.fillRect(cx - 9, cy - 6, 16, 2);
    } else if (k === 'store') {
      const st = S.stores.find(s => s.id === b.id); if (st) this.drawStore(ctx, st, cx, cy, season, night);
    } else if (k === 'fac') {
      const f = S.facs.find(x => x.id === b.id); if (!f) return;
      const comp = S.companies[f.owner]; const s = 0.88;
      shadow(ctx, cx, cy, s);
      let h;
      if (f.kind === 'warehouse') {
        h = 16 + f.level * 4;
        const e = box(ctx, cx, cy, s, h, '#efe6d6', snow ? '#ffffff' : '#d9c7a8');
        ctx.fillStyle = 'rgba(150,130,100,0.45)';
        ctx.beginPath(); ctx.moveTo(e.b.x + 8, e.b.y - 4); ctx.lineTo(e.r.x - 8, e.r.y); ctx.lineTo(e.r.x - 8, e.r.y - h * 0.7); ctx.lineTo(e.b.x + 8, e.b.y - 4 - h * 0.7); ctx.fill();
      } else {
        h = 20 + (f.level || 1) * 4;
        box(ctx, cx, cy, s, h, f.kind === 'kitchen' ? '#f6efe6' : '#e9dccd', snow ? '#ffffff' : (f.kind === 'kitchen' ? '#cfd9d3' : '#b08b6e'));
        ctx.fillStyle = '#b9a99a'; ctx.fillRect(cx + 10, cy - h - 16, 6, 16);
        if (!REDUCED) this.steam(ctx, cx + 13, cy - h - 16, f.id, true);
      }
      ctx.font = `13px ${EMOJI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      drawLogo(ctx, comp, cx + 12, cy - h - 10, 6);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx - 6, cy - h - 12, 9, 0, 7); ctx.fill();
      ctx.fillText(Sim.FAC[f.kind].icon, cx - 6, cy - h - 11);
    }
  };

  R.drawStore = function (ctx, st, cx, cy, season, night) {
    const S = this.S, comp = S.companies[st.owner];
    const snow = season === 'winter';
    const A = Sim.ARCH[st.owned ? st.arch : 'basic'];
    const arch = st.owned ? st.arch : 'basic';
    const floors = st.owned ? 2 : 1;
    const h = (18 + st.size * 5) * (floors === 2 ? 1.55 : 1), s = 0.68 + st.size * 0.06;
    const open = this.hourF >= st.open && this.hourF < st.close;
    shadow(ctx, cx, cy, s);
    let topCol = snow ? '#ffffff' : shade(comp.color, 0.55);
    if (arch === 'glass' || arch === 'greenhouse') topCol = snow ? '#ffffff' : shade(A.wall, 0.4);
    const e = box(ctx, cx, cy, s, h, A.wall, A.roof ? null : topCol, arch === 'glass' ? -0.08 : null);
    // 양식별 디테일
    if (arch === 'brick') {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.6;
      for (let i = 1; i < 8; i++) for (const side of ['L', 'R']) { const v = h * i / 8; const sx = side === 'L' ? -HW * s : HW * s; ctx.beginPath(); ctx.moveTo(cx + sx, cy - v); ctx.lineTo(cx, cy + HH * s - v); ctx.stroke(); }
      diamond(ctx, cx, cy - h, s, snow ? '#ffffff' : '#a65f4c');
      diamond(ctx, cx, cy - h - 1, s * 0.85, snow ? '#f4f7f8' : shade(comp.color, 0.55));
    } else if (arch === 'glass') {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.8;
      for (let i = 1; i < 6; i++) for (const side of ['L', 'R']) { const u = i / 6; const p0 = side === 'L' ? e.l : e.b, p1 = side === 'L' ? e.b : e.r; const x = p0.x + (p1.x - p0.x) * u, y = p0.y + (p1.y - p0.y) * u; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke(); }
    } else if (arch === 'container') {
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
      for (let i = 1; i < 12; i++) for (const side of ['L', 'R']) { const u = i / 12; const p0 = side === 'L' ? e.l : e.b, p1 = side === 'L' ? e.b : e.r; const x = p0.x + (p1.x - p0.x) * u, y = p0.y + (p1.y - p0.y) * u; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke(); }
      ctx.fillStyle = '#e9a05f'; ctx.fillRect(e.b.x - 2, e.b.y - h, 4, h * 0.45);
    } else if (arch === 'greenhouse') {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.8;
      for (let i = 1; i < 5; i++) for (const side of ['L', 'R']) { const u = i / 5; const p0 = side === 'L' ? e.l : e.b, p1 = side === 'L' ? e.b : e.r; const x = p0.x + (p1.x - p0.x) * u, y = p0.y + (p1.y - p0.y) * u; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke(); }
      pyramid(ctx, cx, cy, s, h, 16, snow ? 'rgba(255,255,255,0.9)' : 'rgba(190,230,200,0.85)');
      for (let i = 0; i < 4; i++) { ctx.fillStyle = TREE.summer[i % 3]; ctx.beginPath(); ctx.arc(cx - 14 + i * 9, cy + 2 - h * 0.25 + (i % 2) * 4, 4, 0, 7); ctx.fill(); }
    }
    if (A.roof && arch === 'hanok') {
      const ov = s * 1.22, rh = 13, top = cy - h;
      ctx.fillStyle = snow ? '#f4f7f8' : A.roof;
      ctx.beginPath(); ctx.moveTo(cx - HW * ov - 4, top - 4); ctx.quadraticCurveTo(cx - HW * ov * 0.5, top + HH * ov * 0.5 + 2, cx, top + HH * ov); ctx.lineTo(cx, top - rh); ctx.closePath(); ctx.fill();
      ctx.fillStyle = snow ? '#e6eeee' : shade(A.roof, -0.2);
      ctx.beginPath(); ctx.moveTo(cx, top + HH * ov); ctx.quadraticCurveTo(cx + HW * ov * 0.5, top + HH * ov * 0.5 + 2, cx + HW * ov + 4, top - 4); ctx.lineTo(cx, top - rh); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 1.2;
      for (let i = 1; i < 4; i++) { const u = i / 4; ctx.beginPath(); ctx.moveTo(e.l.x + (e.b.x - e.l.x) * u, e.l.y + (e.b.y - e.l.y) * u); ctx.lineTo(e.l.x + (e.b.x - e.l.x) * u, e.l.y + (e.b.y - e.l.y) * u - h); ctx.stroke(); }
    } else if (A.roof && arch !== 'greenhouse') {
      pyramid(ctx, cx, cy, s, h, arch === 'european' ? 20 : 12, snow ? '#f4f7f8' : A.roof);
      if (arch === 'european') { faceQuad(ctx, cx, cy, s, 'L', 0.4, 0.6, h * 0.62, h * 0.9, 'rgba(255,255,255,0.8)'); }
    }
    // 창·차양
    const glow = night > 0.3 && open;
    windowsOn(ctx, cx, cy, s, h * (floors === 2 ? 0.36 : 0.55), 1, 2, glow ? '#ffe2a0' : 'rgba(150,200,230,0.65)', 'L');
    windowsOn(ctx, cx, cy, s, h * (floors === 2 ? 0.36 : 0.55), 1, 2, glow ? '#ffd88a' : 'rgba(150,200,230,0.5)', 'R');
    if (floors === 2) { const f2 = night > 0.3 && hash(st.id, 3) < 0.6 ? '#ffd98a' : 'rgba(220,235,245,0.7)'; faceQuad(ctx, cx, cy, s, 'L', 0.2, 0.45, h * 0.62, h * 0.82, f2); faceQuad(ctx, cx, cy, s, 'R', 0.55, 0.8, h * 0.62, h * 0.82, f2); }
    const aw = 5, ay = h * (floors === 2 ? 0.4 : 0.62);
    for (const side of ['L', 'R']) {
      const p0 = side === 'L' ? e.l : e.b, p1 = side === 'L' ? e.b : e.r; const n = 6;
      for (let i = 0; i < n; i++) {
        const u0 = i / n, u1 = (i + 1) / n;
        const ax = p0.x + (p1.x - p0.x) * u0, ayy = p0.y + (p1.y - p0.y) * u0, bx = p0.x + (p1.x - p0.x) * u1, by = p0.y + (p1.y - p0.y) * u1;
        ctx.fillStyle = i % 2 ? '#ffffff' : (side === 'L' ? comp.color : shade(comp.color, -0.12));
        const d = side === 'L' ? -2 : 2;
        ctx.beginPath(); ctx.moveTo(ax, ayy - ay - aw); ctx.lineTo(bx, by - ay - aw); ctx.lineTo(bx + d, by - ay + 2); ctx.lineTo(ax + d, ayy - ay + 2); ctx.closePath(); ctx.fill();
      }
    }
    // 간판: 업종 아이콘 + 회사 로고
    const roofTop = A.roof ? (arch === 'hanok' ? 13 : arch === 'european' ? 20 : arch === 'greenhouse' ? 16 : 12) : 0;
    const sy = cy - h - roofTop - 9;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = comp.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx - 5, sy, 9.5, 0, 7); ctx.fill(); ctx.stroke();
    ctx.font = `11px ${EMOJI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(Sim.CATS[st.cat].icon, cx - 5, sy + 1);
    drawLogo(ctx, comp, cx + 9, sy + 2, 6.5);
    if (st.franchise) { ctx.fillStyle = comp.color; ctx.font = 'bold 7.5px "Gowun Dodum",sans-serif'; ctx.fillText('가맹', cx - 5, sy - 15); }
    if (!open) { ctx.fillStyle = 'rgba(80,80,80,0.7)'; ctx.font = 'bold 7px sans-serif'; ctx.fillText('CLOSED', cx, cy - 4); }
    if ((st.cat === 'cafe' || st.cat === 'noodle') && !REDUCED && open && st.served > 0) this.steam(ctx, cx + 10, cy - h - roofTop, st.id);
    if (glow) this._glows.push({ x: cx, y: cy - h * 0.25, r: 34, a: 0.55 });
  };

  R.pop = function (x, y) { (this.pops || (this.pops = {}))[x + ',' + y] = this.t; };
  R.steam = function (ctx, x, y, seed, big) {
    for (let i = 0; i < 3; i++) {
      const ph = ((this.t / 1400) + i / 3 + seed * 0.13) % 1;
      ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - ph)})`;
      ctx.beginPath(); ctx.arc(x + Math.sin(ph * 6 + seed) * 3, y - ph * (big ? 22 : 14), (big ? 3 : 2) + ph * (big ? 5 : 3), 0, 7); ctx.fill();
    }
  };

  // ---------- 이동체 ----------
  function roadAt(S, x, y) { const t = Sim.tile(S, x, y); return t && t.t === 'road'; }
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
  R.updateMovers = function (dt, speed) {
    const S = this.S;
    const act = ACTIVITY[Math.floor(this.hourF) % 24] * (S.weather && (S.weather.kind === 'rain' || S.weather.kind === 'snow') ? 0.6 : 1);
    const want = REDUCED ? 0 : Math.min(160, Math.round(Sim.population(S) / 200 * act));
    while (this.walkers.length < want) {
      const t = S.tiles[Math.floor(Math.random() * S.tiles.length)];
      if (t.t !== 'road') continue;
      this.walkers.push({ x: t.x, y: t.y, tx: t.x, ty: t.y, f: 1, side: Math.random() < 0.5 ? -1 : 1, c: SHIRTS[Math.floor(Math.random() * SHIRTS.length)], sp: 0.6 + Math.random() * 0.5, umb: Math.random() < 0.8 });
    }
    if (this.walkers.length > want) this.walkers.length = want;
    const sp = Math.min(2, Math.max(0.6, speed || 1));
    for (const w of this.walkers) {
      w.f += dt / 1000 * w.sp * sp;
      if (w.f >= 1) {
        w.x = w.tx; w.y = w.ty; w.f = 0;
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => roadAt(S, w.x + dx, w.y + dy));
        const back = opts.filter(([dx, dy]) => !(w.x + dx === w.px && w.y + dy === w.py));
        const L = back.length ? back : opts; const pk = L[Math.floor(Math.random() * L.length)];
        w.px = w.x; w.py = w.y;
        if (pk) { w.tx = w.x + pk[0]; w.ty = w.y + pk[1]; }
      }
    }
    for (const tr of this.trucks) { tr.f += dt / 1000 * 3 * Math.min(3, speed || 1); while (tr.f >= 1) { tr.f -= 1; tr.i++; } }
    this.trucks = this.trucks.filter(tr => tr.i < tr.p.length - 1);
    for (const f of this.floaters) f.t += dt;
    this.floaters = this.floaters.filter(f => f.t < 1800);
  };

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
    const SK = { spring: ['#eaf4fb', '#f6eef2'], summer: ['#e3f2fb', '#eef8ef'], autumn: ['#f5efe4', '#f7e9dc'], winter: ['#eef3f7', '#f4f6f8'] }[season];
    const sky = ctx.createLinearGradient(0, 0, 0, this.h);
    sky.addColorStop(0, SK[0]); sky.addColorStop(1, SK[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, this.w, this.h);

    ctx.setTransform(z * dpr, 0, 0, z * dpr, (this.w / 2 - this.cam.x * z) * dpr, (this.h / 2 - this.cam.y * z) * dpr);
    ctx.fillStyle = '#c9b89c';
    const L = iso(0, Sim.H - 1), B = iso(Sim.W - 1, Sim.H - 1), Rr = iso(Sim.W - 1, 0);
    ctx.beginPath(); ctx.moveTo(L.x - HW, L.y); ctx.lineTo(B.x, B.y + HH); ctx.lineTo(B.x, B.y + HH + 14); ctx.lineTo(L.x - HW, L.y + 14); ctx.fill();
    ctx.fillStyle = '#b5a387';
    ctx.beginPath(); ctx.moveTo(B.x, B.y + HH); ctx.lineTo(Rr.x + HW, Rr.y); ctx.lineTo(Rr.x + HW, Rr.y + 14); ctx.lineTo(B.x, B.y + HH + 14); ctx.fill();
    ctx.drawImage(this.ground, -this.gox, -this.goy);
    if (!REDUCED) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (const t of S.tiles) if (t.t === 'water') {
        const p = iso(t.x, t.y), ph = (this.t / 2000 + hash(t.x, t.y, 9)) % 1;
        ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.7; ctx.fillRect(p.x - 6 + ph * 8, p.y + 3 - ph * 4, 6, 1.2);
      }
      ctx.globalAlpha = 1;
    }
    if (this.overlay && this.overlay.type === 'logistics') this.drawLogistics(ctx);

    const items = [];
    for (const t of S.tiles) if (t.b || t.tree) items.push({ d: t.x + t.y, t });
    const ovp = this.overlay && this.overlay.type === 'potential' && this.overlay.data;
    if (ovp) { const max = Math.max(1, ...ovp.map(d => d.cust)); for (const o of ovp) items.push({ d: o.x + o.y - 0.01, o, k: o.cust / max }); }
    for (const w of this.walkers) items.push({ d: w.x + (w.tx - w.x) * w.f + w.y + (w.ty - w.y) * w.f + 0.1, w });
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
            if (k < 0.5) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ctx.fillStyle = `rgba(255,255,255,${0.8 - k})`; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * (14 + k * 40), p.y + Math.sin(a) * (7 + k * 20), 4 - k * 4, 0, 7); ctx.fill(); }
          } else this.drawBuilding(ctx, it.t, p.x, p.y, season, night);
          if (it.t.b.k === 'res' && hash(it.t.x, it.t.y, 31) < 0.12 && night < 0.5) this.drawCat(ctx, p.x + 14, p.y + 6, it.t.x);
        }
        else {
          const k = Math.floor(hash(it.t.x, it.t.y, 4) * 10);
          drawTree(ctx, p.x - 8 + (k % 3) * 6, p.y - 2 + (k % 2) * 4, season, k);
          if (k > 5) drawTree(ctx, p.x + 12, p.y + 4, season, k + 1);
        }
      } else if (it.o) {
        const p = iso(it.o.x, it.o.y), k = it.k;
        diamond(ctx, p.x, p.y, 0.92, k < 0.2 ? 'rgba(150,140,130,0.2)' : `rgba(${Math.round(120 - 60 * k)},${Math.round(185 - 15 * k)},${Math.round(120 - 20 * k)},${(0.3 + 0.5 * k).toFixed(2)})`);
      } else if (it.w) {
        const w = it.w; const fx = w.x + (w.tx - w.x) * w.f, fy = w.y + (w.ty - w.y) * w.f;
        const p = iso(fx, fy); const ox = w.side * 9, oy = w.side * 2;
        const bob = REDUCED ? 0 : Math.abs(Math.sin(this.t / 120 + fx * 3)) * 1.2;
        ctx.fillStyle = 'rgba(60,80,60,0.15)'; ctx.beginPath(); ctx.ellipse(p.x + ox, p.y + oy + 1, 2.5, 1.2, 0, 0, 7); ctx.fill();
        ctx.fillStyle = w.c; ctx.fillRect(p.x + ox - 1.5, p.y + oy - 6 - bob, 3, 5);
        ctx.fillStyle = '#f6dcc6'; ctx.beginPath(); ctx.arc(p.x + ox, p.y + oy - 8 - bob, 1.8, 0, 7); ctx.fill();
        if (rain && w.umb) { ctx.fillStyle = w.c; ctx.beginPath(); ctx.arc(p.x + ox, p.y + oy - 10 - bob, 4.5, Math.PI, 0); ctx.fill(); }
      } else if (it.tr) {
        const tr = it.tr; const a = tr.p[tr.i], b = tr.p[tr.i + 1];
        const p = iso(a.x + (b.x - a.x) * tr.f, a.y + (b.y - a.y) * tr.f);
        ctx.save(); ctx.translate(p.x, p.y);
        box(ctx, 0, 0, 0.22, 8, '#ffffff', shade(tr.color, 0.2));
        box(ctx, 5, 2, 0.12, 6, tr.color, shade(tr.color, 0.3));
        ctx.restore();
        if (night > 0.3) this._glows.push({ x: p.x + 6, y: p.y, r: 12, a: 0.5 });
      }
    }

    // 낮·밤 색조
    if (night > 0 || dusk > 0) {
      ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (dusk > 0) { ctx.fillStyle = `rgba(255,150,90,${0.16 * dusk})`; ctx.fillRect(0, 0, this.w, this.h); }
      if (night > 0) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(60,70,130,${night})`; ctx.fillRect(0, 0, this.w, this.h); }
      ctx.restore();
      if (night > 0.2) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        // 가로등
        for (const t of S.tiles) if (t.t === 'road' && t.x % Sim.ROAD_EVERY === 0 && t.y % Sim.ROAD_EVERY === 0) this._glows.push({ x: iso(t.x, t.y).x, y: iso(t.x, t.y).y, r: 26, a: 0.35 });
        for (const g of this._glows) {
          const gr = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
          gr.addColorStop(0, `rgba(255,200,120,${g.a * night})`); gr.addColorStop(1, 'rgba(255,200,120,0)');
          ctx.fillStyle = gr; ctx.fillRect(g.x - g.r, g.y - g.r, g.r * 2, g.r * 2);
        }
        ctx.restore();
      }
    }
    if (wk === 'cloud' || wk === 'rain' || wk === 'snow') { ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = `rgba(120,130,150,${wk === 'cloud' ? 0.06 : 0.12})`; ctx.fillRect(0, 0, this.w, this.h); ctx.restore(); }

    if (ovp) this.drawPotentialTags(ctx, ovp);
    if (this.hover) { const p = iso(this.hover.x, this.hover.y); diamondPath(ctx, p.x, p.y, 1); ctx.strokeStyle = 'rgba(80,110,95,0.6)'; ctx.lineWidth = 1.5 / z + 0.5; ctx.stroke(); }
    if (this.ghost) {
      const p = iso(this.ghost.x, this.ghost.y);
      diamond(ctx, p.x, p.y, 1, this.ghost.ok ? 'rgba(120,200,140,0.45)' : 'rgba(230,120,120,0.4)');
      if (this.ghost.icon) { ctx.font = `18px ${EMOJI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = 0.85; ctx.fillText(this.ghost.icon, p.x, p.y - 16); ctx.globalAlpha = 1; }
    }
    if (this.sel) { const p = iso(this.sel.x, this.sel.y); diamondPath(ctx, p.x, p.y, 1.04); ctx.strokeStyle = '#f2b950'; ctx.lineWidth = 2.5; ctx.stroke(); }

    if (night < 0.5) this.drawBirds(ctx, dt);
    if (!REDUCED && wk !== 'rain' && wk !== 'snow') {
      for (const c of this.clouds) {
        c.x += dt * 0.006; if (c.x > 1400) c.x = -1400;
        ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - night * 0.7)})`;
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(c.x + i * 26 * c.s, c.y - 120 + Math.sin(i) * 8, 34 * c.s, 16 * c.s, 0, 0, 7); ctx.fill(); }
      }
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const f of this.floaters) {
      const p = iso(f.x, f.y); const k = f.t / 1800;
      ctx.globalAlpha = 1 - k; ctx.font = 'bold 11px "Gowun Dodum", sans-serif';
      ctx.fillStyle = f.v >= 0 ? (night > 0.4 ? '#9fe0b4' : '#3d8a5c') : '#e48a9a';
      ctx.fillText((f.v >= 0 ? '+' : '') + Sim.won(f.v).replace('원', ''), p.x, p.y - 62 - k * 26);
    }
    ctx.globalAlpha = 1;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drawHoodLabels(ctx);
    this.drawParticles(ctx, dt, season, wk);
  };

  R.drawCat = function (ctx, x, y, seed) {
    const tail = REDUCED ? 0 : Math.sin(this.t / 300 + seed) * 3;
    ctx.fillStyle = ['#f3a95f', '#5b5450', '#f5f0e6'][seed % 3]; ctx.strokeStyle = 'rgba(74,62,56,0.5)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.ellipse(x, y - 3, 4, 3, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 3, y - 7, 2.6, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 5, y - 9); ctx.lineTo(x - 4.5, y - 11.5); ctx.lineTo(x - 3.2, y - 9.6); ctx.moveTo(x - 2.4, y - 9.6); ctx.lineTo(x - 1.5, y - 11.5); ctx.lineTo(x - 1, y - 9); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 3.5, y - 3); ctx.quadraticCurveTo(x + 7, y - 6, x + 6 + tail, y - 10); ctx.stroke();
  };
  R.drawBirds = function (ctx, dt) {
    if (REDUCED) return;
    if (!this.birds || this.birds.x > 1500) this.birds = { x: -1500 - Math.random() * 2000, y: 100 + Math.random() * 700 };
    this.birds.x += dt * 0.05;
    ctx.strokeStyle = 'rgba(70,70,80,0.6)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      const bx = this.birds.x - i * 14 - (i % 2) * 6, by = this.birds.y - 150 + i * 6 * (i % 2 ? 1 : -0.5), f = Math.sin(this.t / 120 + i) * 3;
      ctx.beginPath(); ctx.moveTo(bx - 5, by - f); ctx.quadraticCurveTo(bx - 2, by - 2, bx, by); ctx.quadraticCurveTo(bx + 2, by - 2, bx + 5, by - f); ctx.stroke();
    }
  };
  R.drawHoodLabels = function (ctx) {
    if (this.cam.z > 1.15 || !this.showHoods) return;
    const S = this.S;
    ctx.font = '12px "Jua","Gowun Dodum",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    Sim.HOODS.forEach((H, i) => {
      const hx = (i % 3) * Sim.HOOD + 5, hy = Math.floor(i / 3) * Sim.HOOD + 5;
      const p = this.tileScreen(hx, hy);
      const hot = S.hoods[i].hype >= 40;
      const text = (hot ? '🔥 ' : '') + H.name;
      const w = ctx.measureText(text).width + 16;
      ctx.fillStyle = hot ? 'rgba(255,240,225,0.92)' : 'rgba(255,255,255,0.82)';
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(p.x - w / 2, p.y - 11, w, 22, 11); else ctx.rect(p.x - w / 2, p.y - 11, w, 22); ctx.fill();
      ctx.fillStyle = hot ? '#c0573f' : '#4c5a52'; ctx.fillText(text, p.x, p.y + 1);
    });
  };

  R.drawLogistics = function (ctx) {
    const S = this.S;
    for (const f of S.facs) {
      if (f.owner !== 0 || !Sim.FAC[f.kind].range) continue;
      const r = Sim.facRange(f);
      for (const t of S.tiles) if (Math.abs(t.x - f.x) + Math.abs(t.y - f.y) <= r) { const p = iso(t.x, t.y); diamond(ctx, p.x, p.y, 1, f.kind === 'kitchen' ? 'rgba(242,185,80,0.12)' : 'rgba(127,178,217,0.14)'); }
    }
    ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    for (const st of S.stores) {
      if (st.owner !== 0) continue;
      const a = iso(st.x, st.y);
      if (st.supply === 'direct') { diamond(ctx, a.x, a.y, 0.5, 'rgba(224,122,139,0.45)'); continue; }
      const f = S.facs.find(x => x.id === st.facId); if (!f) continue;
      const b = iso(f.x, f.y);
      ctx.strokeStyle = 'rgba(70,120,160,0.6)'; ctx.beginPath(); ctx.moveTo(a.x, a.y - 10); ctx.lineTo(b.x, b.y - 10); ctx.stroke();
    }
    ctx.setLineDash([]);
  };
  R.drawPotentialTags = function (ctx, data) {
    const top = data.slice().sort((a, b) => b.cust - a.cust).slice(0, 5);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const d of top) {
      const p = iso(d.x, d.y), bob = REDUCED ? 0 : Math.sin(this.t / 300 + d.x) * 2, q = 1 / Math.max(0.55, Math.min(1.3, this.cam.z));
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#4f9a6e'; ctx.lineWidth = 1.5 * q;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(p.x - 20 * q, p.y - 26 - 16 * q + bob, 40 * q, 16 * q, 8 * q); else ctx.rect(p.x - 20 * q, p.y - 26 - 16 * q + bob, 40 * q, 16 * q); ctx.fill(); ctx.stroke();
      ctx.font = `${Math.round(11 * q)}px "Gowun Dodum", sans-serif`; ctx.fillStyle = '#3d7a56';
      ctx.fillText(Math.round(d.cust) + '명', p.x, p.y - 26 - 8 * q + bob);
    }
  };
  R.drawParticles = function (ctx, dt, season, wk) {
    if (REDUCED) { this.particles.length = 0; return; }
    let mode = wk === 'rain' ? 'rain' : wk === 'snow' ? 'snow' : season === 'spring' ? 'petal' : season === 'autumn' ? 'leaf' : season === 'winter' ? 'snowlite' : null;
    if (!mode) { this.particles.length = 0; return; }
    const n = mode === 'rain' ? 120 : mode === 'snow' ? 90 : 28;
    if (this._pmode !== mode) { this.particles = []; this._pmode = mode; }
    while (this.particles.length < n) this.particles.push({ x: Math.random() * this.w, y: Math.random() * this.h - this.h, v: 0.012 + Math.random() * 0.02, s: 2 + Math.random() * 2.5, ph: Math.random() * 6 });
    for (const p of this.particles) {
      if (mode === 'rain') { p.y += dt * 0.9; p.x -= dt * 0.12; }
      else { p.y += dt * p.v * (mode === 'snow' ? 2 : 1.4); p.x += Math.sin(this.t / 900 + p.ph) * 0.3 + dt * 0.006; }
      if (p.y > this.h + 10) { p.y = -10; p.x = Math.random() * (this.w + 100); }
      if (mode === 'rain') { ctx.strokeStyle = 'rgba(150,180,210,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 3, p.y + 12); ctx.stroke(); continue; }
      ctx.fillStyle = mode === 'petal' ? '#f6bfd0' : mode === 'leaf' ? '#e9a35f' : '#ffffff';
      ctx.globalAlpha = mode === 'petal' || mode === 'leaf' ? 0.75 : 0.9;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.s, mode === 'petal' || mode === 'leaf' ? p.s * 0.6 : p.s, p.ph + this.t / 1000, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  // ================= 매장 내부 =================
  function person(ctx, x, y, shirt, hair, apron, bob, sitting, k) {
    k = k || 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-x, -y);
    personBody(ctx, x, y, shirt, hair, apron, bob, sitting);
    ctx.restore();
  }
  function personBody(ctx, x, y, shirt, hair, apron, bob, sitting) {
    ctx.fillStyle = 'rgba(40,40,40,0.12)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 6, 2.5, 0, 0, 7); ctx.fill();
    const h = sitting ? 9 : 15;
    ctx.fillStyle = shirt; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - 4.5, y - h - bob, 9, h, 4); else ctx.rect(x - 4.5, y - h - bob, 9, h); ctx.fill();
    if (apron) { ctx.fillStyle = apron; ctx.fillRect(x - 3.5, y - h + 4 - bob, 7, h - 5); }
    ctx.fillStyle = '#f6dcc6'; ctx.beginPath(); ctx.arc(x, y - h - 4.5 - bob, 4.5, 0, 7); ctx.fill();
    ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(x, y - h - 6 - bob, 4.6, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(74,62,56,0.5)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(x, y - h - 4.5 - bob, 4.5, 0, 7); ctx.stroke();
    ctx.fillStyle = '#4a3e38'; ctx.fillRect(x - 2, y - h - 4.5 - bob, 1, 1.2); ctx.fillRect(x + 1, y - h - 4.5 - bob, 1, 1.2);
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
    ctx.fillStyle = '#f4f1ea'; ctx.fillRect(0, 0, W, Hh);
    const bg = ctx.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, '#f6f2ea'); bg.addColorStop(1, '#ece6dc'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, Hh);
    // 바닥
    for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
      const c = P(x + 0.5, y + 0.5);
      let col = style.floor;
      if (st.interior.style === 'vintage') col = (x + y) % 2 ? '#efe2c9' : '#b9806a';
      else if (st.interior.style === 'luxury') col = (x + y) % 2 ? '#3e3a3a' : '#4a4545';
      else if (st.interior.style === 'minimal' || st.interior.style === 'industrial') col = shade(style.floor, (hash(x, y) - 0.5) * 0.08);
      else col = shade(style.floor, ((x * 3 + y) % 4) * 0.025);
      diamondPath(ctx, c.x, c.y, 1, tw / 2, th / 2); ctx.fillStyle = col; ctx.fill();
      if (['wood', 'nordic', 'hanok'].includes(st.interior.style)) { ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 0.8; ctx.stroke(); }
      if (st.interior.style === 'luxury') { ctx.strokeStyle = 'rgba(199,163,90,0.35)'; ctx.lineWidth = 0.6; ctx.stroke(); }
    }
    // 벽
    const p00 = P(0, 0), pX0 = P(nx, 0), p0Y = P(0, ny);
    const wallL = style.wall, wallR = shade(style.wall, -0.06);
    ctx.fillStyle = wallL; ctx.beginPath(); ctx.moveTo(p0Y.x, p0Y.y); ctx.lineTo(p00.x, p00.y); ctx.lineTo(p00.x, p00.y - wallH); ctx.lineTo(p0Y.x, p0Y.y - wallH); ctx.closePath(); ctx.fill();
    ctx.fillStyle = wallR; ctx.beginPath(); ctx.moveTo(p00.x, p00.y); ctx.lineTo(pX0.x, pX0.y); ctx.lineTo(pX0.x, pX0.y - wallH); ctx.lineTo(p00.x, p00.y - wallH); ctx.closePath(); ctx.fill();
    const wallQuad = (side, u0, u1, v0, v1, col) => {
      const a = side === 'L' ? P(0, ny * (1 - u0)) : P(nx * u0, 0), b = side === 'L' ? P(0, ny * (1 - u1)) : P(nx * u1, 0);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(a.x, a.y - wallH * v0); ctx.lineTo(b.x, b.y - wallH * v0); ctx.lineTo(b.x, b.y - wallH * v1); ctx.lineTo(a.x, a.y - wallH * v1); ctx.closePath(); ctx.fill();
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
      ctx.fillStyle = shade(style.accent, -0.05); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(c.x, c.y - ch); ctx.lineTo(b.x, b.y - ch); ctx.fill();
      ctx.fillStyle = style.accent; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(e.x, e.y); ctx.lineTo(e.x, e.y - ch); ctx.lineTo(c.x, c.y - ch); ctx.fill();
      ctx.fillStyle = top; ctx.beginPath(); ctx.moveTo(a.x, a.y - ch); ctx.lineTo(b.x, b.y - ch); ctx.lineTo(c.x, c.y - ch); ctx.lineTo(e.x, e.y - ch); ctx.fill();
      // 업종 장비
      const m = P(0.7, (cy0 + cy1) / 2 - 0.6), m2 = P(0.7, (cy0 + cy1) / 2 + 0.7);
      if (st.cat === 'cafe') { ctx.fillStyle = '#9aa3aa'; ctx.fillRect(m.x - tw * 0.22, m.y - ch - tw * 0.38, tw * 0.44, tw * 0.3); ctx.fillStyle = '#5f676d'; ctx.fillRect(m.x - tw * 0.16, m.y - ch - tw * 0.12, tw * 0.08, tw * 0.06); ctx.fillStyle = '#ffffff'; ctx.fillRect(m2.x - 3, m2.y - ch - 7, 6, 7); ctx.fillRect(m2.x + 5, m2.y - ch - 7, 6, 7); }
      else if (st.cat === 'bakery' || st.cat === 'dessert') { ctx.fillStyle = 'rgba(210,235,245,0.7)'; ctx.fillRect(m.x - tw * 0.3, m.y - ch - tw * 0.3, tw * 0.6, tw * 0.3); const col = st.cat === 'bakery' ? ['#d9a05b', '#c8874a', '#e8bd7a'] : ['#f6c6d6', '#fff1d6', '#c98b6b']; for (let i = 0; i < 4; i++) { ctx.fillStyle = col[i % 3]; ctx.beginPath(); ctx.ellipse(m.x - tw * 0.2 + i * tw * 0.13, m.y - ch - tw * 0.08, tw * 0.06, tw * 0.04, 0, 0, 7); ctx.fill(); } }
      else if (st.cat === 'noodle') { ctx.fillStyle = '#7d858a'; ctx.beginPath(); ctx.ellipse(m.x, m.y - ch - tw * 0.12, tw * 0.2, tw * 0.09, 0, 0, 7); ctx.fill(); ctx.fillRect(m.x - tw * 0.2, m.y - ch - tw * 0.12, tw * 0.4, tw * 0.1); if (open) for (let i = 0; i < 3; i++) { const ph = (t / 1500 + i / 3) % 1; ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - ph)})`; ctx.beginPath(); ctx.arc(m.x + Math.sin(ph * 5 + i) * 4, m.y - ch - tw * 0.2 - ph * 20, 3 + ph * 4, 0, 7); ctx.fill(); } }
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
          ctx.fillStyle = shade(tableCol, -0.15); ctx.beginPath(); ctx.ellipse(c.x, c.y - 4, tw * 0.12, tw * 0.06, 0, 0, 7); ctx.fill();
          ctx.fillRect(c.x - 1, c.y - 4, 2, 5);
          if (filled) person(ctx, c.x, c.y - 2, SHIRTS[(ti * 3 + si) % SHIRTS.length], HAIR[(ti + si) % HAIR.length], null, REDUCED ? 0 : Math.sin(t / 700 + ti + si) * 0.6, true, tw / 38);
        } });
      });
      items.push({ d: x + y, draw: () => {
        const c = P(x, y);
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 2, tw * 0.3, tw * 0.13, 0, 0, 7); ctx.fill();
        ctx.fillStyle = shade(tableCol, -0.2); ctx.fillRect(c.x - 1.5, c.y - tw * 0.3, 3, tw * 0.3);
        ctx.fillStyle = tableCol; ctx.beginPath(); ctx.ellipse(c.x, c.y - tw * 0.3, tw * 0.28, tw * 0.13, 0, 0, 7); ctx.fill();
        if (open && seatIdx > 0) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(c.x + 3, c.y - tw * 0.32, 2.5, 0, 7); ctx.fill(); }
        if (tier >= 3) { ctx.strokeStyle = 'rgba(80,80,80,0.5)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(c.x, c.y - tw * 0.3 - wallH * 0.75); ctx.lineTo(c.x, c.y - tw * 0.3 - wallH * 0.45); ctx.stroke(); ctx.fillStyle = st.interior.style === 'luxury' ? '#c7a35a' : style.accent; ctx.beginPath(); ctx.arc(c.x, c.y - tw * 0.3 - wallH * 0.45, tw * 0.09, Math.PI, 0); ctx.fill(); if (open) { ctx.fillStyle = 'rgba(255,220,150,0.25)'; ctx.beginPath(); ctx.ellipse(c.x, c.y - tw * 0.3, tw * 0.3, tw * 0.12, 0, 0, 7); ctx.fill(); } }
      } });
    });
    // 화분·장식
    const plants = st.interior.style === 'plant' ? 6 : tier >= 2 ? Math.min(4, tier) : 0;
    const pspots = [[nx - 0.5, 0.5], [1.6, 0.4], [nx - 0.5, ny - 0.6], [nx - 2.2, 0.4], [1.7, ny - 0.5], [nx * 0.5, 0.4]];
    for (let i = 0; i < plants; i++) {
      const [x, y] = pspots[i];
      items.push({ d: x + y, draw: () => { const c = P(x, y); ctx.fillStyle = '#c9876a'; ctx.fillRect(c.x - 5, c.y - 9, 10, 9); ctx.fillStyle = '#6fa36a'; ctx.beginPath(); ctx.arc(c.x, c.y - 16, 8, 0, 7); ctx.arc(c.x - 5, c.y - 12, 5, 0, 7); ctx.arc(c.x + 5, c.y - 13, 5, 0, 7); ctx.fill(); } });
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
    if (!open) { ctx.fillStyle = 'rgba(40,46,70,0.35)'; ctx.fillRect(0, 0, W, Hh); ctx.fillStyle = '#ffffff'; ctx.font = '600 15px "Jua","Gowun Dodum",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`영업 준비 중 · ${st.open}시 오픈`, W / 2, 26); }
    else if (hour >= 18 || hour < 6) { ctx.fillStyle = 'rgba(255,190,110,0.08)'; ctx.fillRect(0, 0, W, Hh); }
  };

  root.Renderer = Renderer;
})(typeof window !== 'undefined' ? window : globalThis);
