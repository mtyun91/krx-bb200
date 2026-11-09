/* 모락모락 타운 — 아이소메트릭 캔버스 렌더러 */
(function (root) {
  'use strict';
  const Sim = root.Sim;
  const TW = 64, TH = 32, HW = TW / 2, HH = TH / 2;
  const REDUCED = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SEASON_GRASS = {
    spring: ['#cfe6bf', '#c7e1b5', '#d6eac8'],
    summer: ['#b9dca6', '#b0d69c', '#c2e1b0'],
    autumn: ['#dfdcae', '#d8d3a2', '#e4e1b8'],
    winter: ['#e6eeea', '#dfe9e5', '#edf3f0'],
  };
  const TREE = {
    spring: ['#f5c3d3', '#f9d7e2', '#a9d39a'],
    summer: ['#86bf7d', '#98cb8c', '#76b06f'],
    autumn: ['#eba468', '#f1c072', '#df8a5d'],
    winter: ['#f4f8f8', '#e6eeee', '#9dbfa8'],
  };
  const WALLS = ['#fbe3d4', '#e4eefa', '#fdf1c9', '#e2f1e4', '#f1e3f4', '#ffe9dc'];
  const ROOFS = ['#e9967a', '#86a8cf', '#e6b65c', '#8fbf95', '#b495c7', '#d98d8d'];

  function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + (s || 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }
  function iso(x, y) { return { x: (x - y) * HW, y: (x + y) * HH }; }

  function Renderer(canvas) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.cam = { x: 0, y: (Sim.W + Sim.H) * HH / 2, z: 0.9 };
    this.S = null; this.hover = null; this.sel = null; this.ghost = null;
    this.overlay = null; this.walkers = []; this.trucks = []; this.floaters = []; this.particles = [];
    this.clouds = []; this.groundKey = ''; this.pathCache = new Map(); this.t = 0;
    for (let i = 0; i < 5; i++) this.clouds.push({ x: Math.random() * 2400 - 1200, y: Math.random() * 1000, s: 0.6 + Math.random() * 0.8 });
    this.resize();
  }
  const R = Renderer.prototype;

  R.resize = function () {
    const r = this.c.getBoundingClientRect();
    this.dpr = Math.min(2, root.devicePixelRatio || 1);
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.c.width = this.w * this.dpr; this.c.height = this.h * this.dpr;
  };
  R.setState = function (S) { this.S = S; this.groundKey = ''; this.walkers = []; this.trucks = []; this.pathCache.clear(); };
  R.toScreen = function (wx, wy) { return { x: (wx - this.cam.x) * this.cam.z + this.w / 2, y: (wy - this.cam.y) * this.cam.z + this.h / 2 }; };
  R.toWorld = function (sx, sy) { return { x: (sx - this.w / 2) / this.cam.z + this.cam.x, y: (sy - this.h / 2) / this.cam.z + this.cam.y }; };
  R.pick = function (sx, sy) {
    const w = this.toWorld(sx, sy);
    const a = w.y / HH, b = w.x / HW;
    const x = Math.floor((a + b) / 2 + 0.5), y = Math.floor((a - b) / 2 + 0.5);
    return (x >= 0 && y >= 0 && x < Sim.W && y < Sim.H) ? { x, y } : null;
  };
  R.centerOn = function (x, y) { const p = iso(x, y); this.cam.x = p.x; this.cam.y = p.y; };
  R.zoomAt = function (sx, sy, f) {
    const before = this.toWorld(sx, sy);
    this.cam.z = Math.max(0.35, Math.min(2.4, this.cam.z * f));
    const after = this.toWorld(sx, sy);
    this.cam.x += before.x - after.x; this.cam.y += before.y - after.y;
  };
  R.fit = function () { this.cam.z = Math.max(0.35, Math.min(1.2, Math.min(this.w / (Sim.W * TW * 0.92), this.h / (Sim.H * TH * 1.15)))); this.cam.x = 0; this.cam.y = (Sim.W + Sim.H) * HH / 2 - 10; };

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
      let col;
      if (t.t === 'road') col = season === 'winter' ? '#eef1f1' : '#ebe4d8';
      else if (t.t === 'water') col = '#a9d6e8';
      else if (t.d === 'off') col = season === 'winter' ? '#e8ecea' : '#e3e6dc';
      else col = grass[Math.floor(hash(t.x, t.y) * 3)];
      diamond(ctx, cx, cy, 1, col);
      if (t.t === 'road') {
        ctx.strokeStyle = 'rgba(160,145,120,0.25)'; ctx.lineWidth = 1; diamondPath(ctx, cx, cy, 1); ctx.stroke();
        const hor = t.y % Sim.ROAD_EVERY === 0, ver = t.x % Sim.ROAD_EVERY === 0;
        if (hor !== ver) {
          ctx.strokeStyle = '#fbf8f2'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
          ctx.beginPath();
          if (hor) { ctx.moveTo(cx - HW * 0.5, cy - HH * 0.5); ctx.lineTo(cx + HW * 0.5, cy + HH * 0.5); }
          else { ctx.moveTo(cx + HW * 0.5, cy - HH * 0.5); ctx.lineTo(cx - HW * 0.5, cy + HH * 0.5); }
          ctx.stroke(); ctx.setLineDash([]);
        }
      } else if (t.t === 'water') {
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(cx - 8 + hash(t.x, t.y, 2) * 10, cy - 2 + hash(t.x, t.y, 3) * 4, 7, 1.5);
      } else if (t.d !== 'off' && hash(t.x, t.y, 5) < 0.35) {
        ctx.fillStyle = season === 'spring' ? '#f7d6e0' : season === 'autumn' ? '#e8b878' : season === 'winter' ? '#ffffff' : '#f3e7a0';
        for (let i = 0; i < 3; i++) ctx.fillRect(cx - 12 + hash(t.x, t.y, 10 + i) * 24, cy - 5 + hash(t.x, t.y, 20 + i) * 10, 2, 2);
      }
    }
  };

  function diamondPath(ctx, cx, cy, s) {
    ctx.beginPath(); ctx.moveTo(cx, cy - HH * s); ctx.lineTo(cx + HW * s, cy); ctx.lineTo(cx, cy + HH * s); ctx.lineTo(cx - HW * s, cy); ctx.closePath();
  }
  function diamond(ctx, cx, cy, s, fill) { diamondPath(ctx, cx, cy, s); ctx.fillStyle = fill; ctx.fill(); }

  // 상자: 바닥 중심(cx,cy), 크기 s, 높이 h
  function box(ctx, cx, cy, s, h, wall, top) {
    const l = { x: cx - HW * s, y: cy }, r = { x: cx + HW * s, y: cy }, b = { x: cx, y: cy + HH * s };
    ctx.fillStyle = shade(wall, -0.04);
    ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x, b.y - h); ctx.lineTo(l.x, l.y - h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(wall, -0.16);
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(r.x, r.y); ctx.lineTo(r.x, r.y - h); ctx.lineTo(b.x, b.y - h); ctx.closePath(); ctx.fill();
    if (top) diamond(ctx, cx, cy - h, s, top);
    return { l, r, b };
  }
  function pyramid(ctx, cx, cy, s, h, rh, roof) {
    const ap = { x: cx, y: cy - h - rh };
    ctx.fillStyle = roof;
    ctx.beginPath(); ctx.moveTo(cx - HW * s, cy - h); ctx.lineTo(cx, cy + HH * s - h); ctx.lineTo(ap.x, ap.y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(roof, -0.15);
    ctx.beginPath(); ctx.moveTo(cx, cy + HH * s - h); ctx.lineTo(cx + HW * s, cy - h); ctx.lineTo(ap.x, ap.y); ctx.closePath(); ctx.fill();
  }
  // 왼쪽/오른쪽 벽 위의 창문
  function windowsOn(ctx, cx, cy, s, h, rows, cols, color, side) {
    const sx = side === 'L' ? -HW * s : HW * s;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const u0 = (c + 0.25) / cols, u1 = (c + 0.75) / cols;
      const v0 = h * (r + 0.3) / rows, v1 = h * (r + 0.75) / rows;
      const ax = cx + sx * (1 - u0), ay = cy + HH * s * u0, bx = cx + sx * (1 - u1), by = cy + HH * s * u1;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(ax, ay - v0); ctx.lineTo(bx, by - v0); ctx.lineTo(bx, by - v1); ctx.lineTo(ax, ay - v1); ctx.closePath(); ctx.fill();
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

  R.drawBuilding = function (ctx, t, cx, cy, season) {
    const S = this.S, b = t.b, k = b.k;
    const hv = hash(t.x, t.y, 7), ci = Math.floor(hv * WALLS.length);
    const snow = season === 'winter';
    if (k === 'res') {
      const h = 12 + b.lv * 7, s = 0.62 + Math.min(b.lv, 4) * 0.04;
      shadow(ctx, cx, cy, s);
      box(ctx, cx, cy, s, h, WALLS[ci]);
      windowsOn(ctx, cx, cy, s, h, Math.min(3, b.lv), 2, 'rgba(255,255,255,0.75)', 'L');
      windowsOn(ctx, cx, cy, s, h, Math.min(3, b.lv), 2, 'rgba(255,255,255,0.55)', 'R');
      pyramid(ctx, cx, cy, s, h, 14, snow ? '#f4f7f8' : ROOFS[ci]);
    } else if (k === 'off') {
      const h = 26 + b.lv * 16, s = 0.7;
      shadow(ctx, cx, cy, s);
      const wall = ['#dfe8f0', '#e8e4f0', '#e4efe9', '#f0ebe0'][ci % 4];
      box(ctx, cx, cy, s, h, wall, shade(wall, 0.3));
      windowsOn(ctx, cx, cy, s, h, 2 + b.lv * 2, 3, 'rgba(140,180,215,0.55)', 'L');
      windowsOn(ctx, cx, cy, s, h, 2 + b.lv * 2, 3, 'rgba(120,160,200,0.5)', 'R');
      if (snow) diamond(ctx, cx, cy - h, 0.7, '#ffffff');
    } else if (k === 'uni') {
      const h = 18 + b.lv * 9, s = 0.78;
      shadow(ctx, cx, cy, s);
      box(ctx, cx, cy, s, h, '#efc9b4', '#e9b9a0');
      windowsOn(ctx, cx, cy, s, h, 1 + b.lv, 3, 'rgba(255,250,235,0.8)', 'L');
      windowsOn(ctx, cx, cy, s, h, 1 + b.lv, 3, 'rgba(255,250,235,0.6)', 'R');
      ctx.fillStyle = '#9a8a7a'; ctx.fillRect(cx - 0.5, cy - h - 18, 1.5, 18);
      ctx.fillStyle = '#7fb2d9'; ctx.fillRect(cx + 1, cy - h - 18, 9, 6);
    } else if (k === 'tour') {
      const h = 16 + b.lv * 10, s = 0.74;
      shadow(ctx, cx, cy, s);
      const wall = ['#fff1d6', '#e0f3f1', '#fde2e6'][ci % 3];
      box(ctx, cx, cy, s, h, wall);
      windowsOn(ctx, cx, cy, s, h, 1 + b.lv, 3, 'rgba(255,200,150,0.55)', 'L');
      windowsOn(ctx, cx, cy, s, h, 1 + b.lv, 3, 'rgba(255,200,150,0.45)', 'R');
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
      const st = S.stores.find(s => s.id === b.id); if (!st) return;
      const comp = S.companies[st.owner];
      const h = 20 + st.level * 6, s = 0.7 + st.level * 0.05;
      shadow(ctx, cx, cy, s);
      const e = box(ctx, cx, cy, s, h, '#fffaf2', snow ? '#ffffff' : shade(comp.color, 0.55));
      // 문·유리창
      windowsOn(ctx, cx, cy, s, h * 0.55, 1, 2, 'rgba(150,200,230,0.65)', 'L');
      windowsOn(ctx, cx, cy, s, h * 0.55, 1, 2, 'rgba(150,200,230,0.5)', 'R');
      // 줄무늬 차양
      const aw = 6, ay = h * 0.62;
      for (const side of ['L', 'R']) {
        const p0 = side === 'L' ? e.l : e.b, p1 = side === 'L' ? e.b : e.r;
        const n = 6;
        for (let i = 0; i < n; i++) {
          const u0 = i / n, u1 = (i + 1) / n;
          const ax = p0.x + (p1.x - p0.x) * u0, ayy = p0.y + (p1.y - p0.y) * u0, bx = p0.x + (p1.x - p0.x) * u1, by = p0.y + (p1.y - p0.y) * u1;
          ctx.fillStyle = i % 2 ? '#ffffff' : (side === 'L' ? comp.color : shade(comp.color, -0.12));
          ctx.beginPath(); ctx.moveTo(ax, ayy - ay - aw); ctx.lineTo(bx, by - ay - aw); ctx.lineTo(bx + (side === 'L' ? -2 : 2), by - ay + 2); ctx.lineTo(ax + (side === 'L' ? -2 : 2), ayy - ay + 2); ctx.closePath(); ctx.fill();
        }
      }
      // 간판
      const sy = cy - h - 8;
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = comp.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, sy, 10, 0, 7); ctx.fill(); ctx.stroke();
      ctx.font = '12px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(Sim.CATS[st.cat].icon, cx, sy + 1);
      if (st.franchise) { ctx.fillStyle = comp.color; ctx.font = 'bold 8px sans-serif'; ctx.fillText('가맹', cx + 14, sy - 8); }
      if ((st.cat === 'cafe' || st.cat === 'noodle') && !REDUCED && st.served > 0) this.steam(ctx, cx + 8, cy - h - 2, st.id);
    } else if (k === 'fac') {
      const f = S.facs.find(x => x.id === b.id); if (!f) return;
      const comp = S.companies[f.owner];
      const s = 0.88;
      shadow(ctx, cx, cy, s);
      if (f.kind === 'warehouse') {
        const h = 16 + f.level * 4;
        const e = box(ctx, cx, cy, s, h, '#efe6d6', snow ? '#ffffff' : '#d9c7a8');
        ctx.fillStyle = 'rgba(150,130,100,0.45)';
        ctx.beginPath(); ctx.moveTo(e.b.x + 8, e.b.y - 4); ctx.lineTo(e.r.x - 8, e.r.y + 0); ctx.lineTo(e.r.x - 8, e.r.y - h * 0.7); ctx.lineTo(e.b.x + 8, e.b.y - 4 - h * 0.7); ctx.fill();
      } else {
        const h = 20 + (f.level || 1) * 4;
        box(ctx, cx, cy, s, h, f.kind === 'kitchen' ? '#f6efe6' : '#e9dccd', snow ? '#ffffff' : (f.kind === 'kitchen' ? '#cfd9d3' : '#b08b6e'));
        ctx.fillStyle = '#b9a99a'; ctx.fillRect(cx + 10, cy - h - 16, 6, 16);
        if (!REDUCED) this.steam(ctx, cx + 13, cy - h - 16, f.id, true);
      }
      ctx.font = '13px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = comp.color; ctx.beginPath(); ctx.arc(cx - 10, cy - 34, 9, 0, 7); ctx.fill();
      ctx.fillText(Sim.FAC[f.kind].icon, cx - 10, cy - 33);
    }
  };

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

  R.onDay = function (ev) {
    for (const m of ev.money.slice(0, 14)) this.floaters.push({ x: m.x, y: m.y, v: m.v, t: 0 });
    for (const tr of ev.trucks.slice(0, 12)) {
      const p = this.path(tr.from, tr.to); if (p && p.length > 1) this.trucks.push({ p, i: 0, f: 0, color: tr.color });
    }
    if (this.trucks.length > 30) this.trucks.splice(0, this.trucks.length - 30);
  };

  R.updateMovers = function (dt, speed) {
    const S = this.S;
    const want = REDUCED ? 0 : Math.min(150, Math.round(Sim.population(S) / 220));
    while (this.walkers.length < want) {
      const t = S.tiles[Math.floor(Math.random() * S.tiles.length)];
      if (t.t !== 'road') continue;
      this.walkers.push({ x: t.x, y: t.y, tx: t.x, ty: t.y, f: 1, side: Math.random() < 0.5 ? -1 : 1, c: ['#e98a7a', '#7fa7d6', '#f2c14e', '#86b98f', '#b495c7', '#5f6f68'][Math.floor(Math.random() * 6)], sp: 0.6 + Math.random() * 0.5 });
    }
    if (this.walkers.length > want) this.walkers.length = want;
    for (const w of this.walkers) {
      w.f += dt / 1000 * w.sp * Math.min(2, speed || 1);
      if (w.f >= 1) {
        w.x = w.tx; w.y = w.ty; w.f = 0;
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => roadAt(S, w.x + dx, w.y + dy));
        const back = opts.filter(([dx, dy]) => !(w.x + dx === w.px && w.y + dy === w.py));
        const pick = (back.length ? back : opts)[Math.floor(Math.random() * (back.length ? back.length : opts.length))];
        w.px = w.x; w.py = w.y;
        if (pick) { w.tx = w.x + pick[0]; w.ty = w.y + pick[1]; }
      }
    }
    for (const tr of this.trucks) {
      tr.f += dt / 1000 * 3 * Math.min(3, speed || 1);
      while (tr.f >= 1) { tr.f -= 1; tr.i++; }
    }
    this.trucks = this.trucks.filter(tr => tr.i < tr.p.length - 1);
    for (const f of this.floaters) f.t += dt;
    this.floaters = this.floaters.filter(f => f.t < 1800);
  };

  // ---------- 그리기 ----------
  R.draw = function (dt, speed) {
    const S = this.S; if (!S) return;
    this.t += dt;
    this.updateMovers(dt, speed);
    this.buildGround();
    const ctx = this.ctx, z = this.cam.z, dpr = this.dpr;
    const season = Sim.seasonOf(S);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, this.h);
    const SK = { spring: ['#eaf4fb', '#f6eef2'], summer: ['#e3f2fb', '#eef8ef'], autumn: ['#f5efe4', '#f7e9dc'], winter: ['#eef3f7', '#f4f6f8'] }[season];
    sky.addColorStop(0, SK[0]); sky.addColorStop(1, SK[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, this.w, this.h);

    ctx.setTransform(z * dpr, 0, 0, z * dpr, (this.w / 2 - this.cam.x * z) * dpr, (this.h / 2 - this.cam.y * z) * dpr);
    // 땅 가장자리 두께
    ctx.fillStyle = '#c9b89c';
    const L = iso(0, Sim.H - 1), B = iso(Sim.W - 1, Sim.H - 1), Rr = iso(Sim.W - 1, 0);
    ctx.beginPath(); ctx.moveTo(L.x - HW, L.y); ctx.lineTo(B.x, B.y + HH); ctx.lineTo(B.x, B.y + HH + 14); ctx.lineTo(L.x - HW, L.y + 14); ctx.fill();
    ctx.fillStyle = '#b5a387';
    ctx.beginPath(); ctx.moveTo(B.x, B.y + HH); ctx.lineTo(Rr.x + HW, Rr.y); ctx.lineTo(Rr.x + HW, Rr.y + 14); ctx.lineTo(B.x, B.y + HH + 14); ctx.fill();
    ctx.drawImage(this.ground, -this.gox, -this.goy);

    // 물결
    if (!REDUCED) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (const t of S.tiles) if (t.t === 'water') {
        const p = iso(t.x, t.y), ph = (this.t / 2000 + hash(t.x, t.y, 9)) % 1;
        ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.7; ctx.fillRect(p.x - 6 + ph * 8, p.y + 3 - ph * 4, 6, 1.2);
      }
      ctx.globalAlpha = 1;
    }

    if (!this.overlay || this.overlay.type !== 'potential') this.drawOverlay(ctx);

    // 깊이 정렬 그리기
    const items = [];
    for (const t of S.tiles) if (t.b || t.tree) items.push({ d: t.x + t.y, t });
    const ovp = this.overlay && this.overlay.type === 'potential' && this.overlay.data;
    if (ovp) { const max = Math.max(1, ...ovp.map(d => d.cust)); for (const o of ovp) items.push({ d: o.x + o.y - 0.01, o, k: o.cust / max }); }
    for (const w of this.walkers) items.push({ d: w.x + (w.tx - w.x) * w.f + w.y + (w.ty - w.y) * w.f + 0.1, w });
    for (const tr of this.trucks) { const a = tr.p[tr.i], b = tr.p[tr.i + 1]; items.push({ d: a.x + (b.x - a.x) * tr.f + a.y + (b.y - a.y) * tr.f + 0.2, tr }); }
    items.sort((a, b) => a.d - b.d);
    for (const it of items) {
      if (it.t) {
        const p = iso(it.t.x, it.t.y);
        if (it.t.b) this.drawBuilding(ctx, it.t, p.x, p.y, season);
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
        const p = iso(fx, fy);
        const ox = w.side * 9, oy = w.side * 2;
        const bob = REDUCED ? 0 : Math.abs(Math.sin(this.t / 120 + fx * 3)) * 1.2;
        ctx.fillStyle = 'rgba(60,80,60,0.15)'; ctx.beginPath(); ctx.ellipse(p.x + ox, p.y + oy + 1, 2.5, 1.2, 0, 0, 7); ctx.fill();
        ctx.fillStyle = w.c; ctx.fillRect(p.x + ox - 1.5, p.y + oy - 6 - bob, 3, 5);
        ctx.fillStyle = '#f6dcc6'; ctx.beginPath(); ctx.arc(p.x + ox, p.y + oy - 8 - bob, 1.8, 0, 7); ctx.fill();
      } else if (it.tr) {
        const tr = it.tr; const a = tr.p[tr.i], b = tr.p[tr.i + 1];
        const p = iso(a.x + (b.x - a.x) * tr.f, a.y + (b.y - a.y) * tr.f);
        ctx.save(); ctx.translate(p.x, p.y);
        box(ctx, 0, 0, 0.22, 8, '#ffffff', shade(tr.color, 0.2));
        box(ctx, 5, 2, 0.12, 6, tr.color, shade(tr.color, 0.3));
        ctx.restore();
      }
    }

    if (this.overlay && this.overlay.type === 'potential') this.drawOverlay(ctx);
    // 선택·미리보기
    if (this.hover) { const p = iso(this.hover.x, this.hover.y); diamondPath(ctx, p.x, p.y, 1); ctx.strokeStyle = 'rgba(80,110,95,0.55)'; ctx.lineWidth = 1.5 / z + 0.5; ctx.stroke(); }
    if (this.ghost) {
      const p = iso(this.ghost.x, this.ghost.y);
      diamond(ctx, p.x, p.y, 1, this.ghost.ok ? 'rgba(120,200,140,0.45)' : 'rgba(230,120,120,0.4)');
      if (this.ghost.icon) { ctx.font = '18px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = 0.8; ctx.fillText(this.ghost.icon, p.x, p.y - 16); ctx.globalAlpha = 1; }
    }
    if (this.sel) { const p = iso(this.sel.x, this.sel.y); diamondPath(ctx, p.x, p.y, 1.04); ctx.strokeStyle = '#f2b950'; ctx.lineWidth = 2.5; ctx.stroke(); }

    // 구름
    if (!REDUCED) {
      for (const c of this.clouds) {
        c.x += dt * 0.006; if (c.x > 1400) c.x = -1400;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(c.x + i * 26 * c.s, c.y - 120 + Math.sin(i) * 8, 34 * c.s, 16 * c.s, 0, 0, 7); ctx.fill(); }
      }
    }

    // 떠오르는 돈
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const f of this.floaters) {
      const p = iso(f.x, f.y); const k = f.t / 1800;
      ctx.globalAlpha = 1 - k;
      ctx.font = `bold ${11}px "Gowun Dodum", sans-serif`;
      ctx.fillStyle = f.v >= 0 ? '#3d8a5c' : '#c85a6a';
      ctx.fillText((f.v >= 0 ? '+' : '') + Sim.won(f.v).replace('원', ''), p.x, p.y - 58 - k * 26);
    }
    ctx.globalAlpha = 1;

    // 계절 입자 (화면 좌표)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drawParticles(ctx, dt, season);
  };

  R.drawOverlay = function (ctx) {
    const S = this.S, ov = this.overlay; if (!ov) return;
    if (ov.type === 'potential' && ov.data) {
      const max = Math.max(1, ...ov.data.map(d => d.cust));
      const top = ov.data.slice().sort((a, b) => b.cust - a.cust).slice(0, 5);
      ctx.font = '11px "Gowun Dodum", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const d of top) {
        const p = iso(d.x, d.y), bob = REDUCED ? 0 : Math.sin(this.t / 300 + d.x) * 2, q = 1 / Math.max(0.55, Math.min(1.3, this.cam.z));
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#4f9a6e'; ctx.lineWidth = 1.5 * q;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(p.x - 18 * q, p.y - 26 - 16 * q + bob, 36 * q, 16 * q, 8 * q) : ctx.rect(p.x - 18 * q, p.y - 26 - 16 * q + bob, 36 * q, 16 * q); ctx.fill(); ctx.stroke();
        ctx.font = `${Math.round(11 * q)}px "Gowun Dodum", sans-serif`;
        ctx.fillStyle = '#3d7a56'; ctx.fillText(Math.round(d.cust) + '명', p.x, p.y - 26 - 8 * q + bob);
      }
    } else if (ov.type === 'logistics') {
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
    }
  };

  R.drawParticles = function (ctx, dt, season) {
    if (REDUCED || season === 'summer') { this.particles.length = 0; return; }
    const col = season === 'spring' ? '#f6bfd0' : season === 'autumn' ? '#e9a35f' : '#ffffff';
    while (this.particles.length < 28) this.particles.push({ x: Math.random() * this.w, y: Math.random() * -this.h, v: 0.012 + Math.random() * 0.02, s: 2 + Math.random() * 2.5, ph: Math.random() * 6 });
    for (const p of this.particles) {
      p.y += dt * p.v * 1.4; p.x += Math.sin(this.t / 900 + p.ph) * 0.3 + dt * 0.006;
      if (p.y > this.h + 10) { p.y = -10; p.x = Math.random() * this.w; }
      ctx.fillStyle = col; ctx.globalAlpha = season === 'winter' ? 0.9 : 0.75;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.s, season === 'winter' ? p.s : p.s * 0.6, p.ph + this.t / 1000, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  root.Renderer = Renderer;
})(typeof window !== 'undefined' ? window : globalThis);
