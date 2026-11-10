/* 모락모락 타운 — 소리 (Web Audio로 직접 만드는 잔잔한 음악과 효과음, 음원 파일 없음) */
(function (root) {
  'use strict';
  const PREF_KEY = 'morak.audio';
  const A = { ctx: null, music: true, sfx: true, vol: 0.7, mood: 'day', rain: false, started: false, season: 'spring', weather: 'sun', amt: 0 };
  try { Object.assign(A, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch (e) { /* 저장소 없음 */ }
  A.started = false; A.ctx = null;
  function save() { try { localStorage.setItem(PREF_KEY, JSON.stringify({ music: A.music, sfx: A.sfx, vol: A.vol })); } catch (e) { /* 무시 */ } }

  let master, musicBus, sfxBus, rainNode, rainGain, verb, rainLP, rumbleGain, windGain, ambBus, noiseBuf;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function makeReverb(ctx) {
    const len = ctx.sampleRate * 2.2, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const cv = ctx.createConvolver(); cv.buffer = buf; return cv;
  }
  function start() {
    if (A.started) { if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const AC = root.AudioContext || root.webkitAudioContext; if (!AC) return;
    try { A.ctx = new AC(); } catch (e) { return; }
    const ctx = A.ctx;
    master = ctx.createGain(); master.gain.value = A.vol; master.connect(ctx.destination);
    verb = makeReverb(ctx); const verbGain = ctx.createGain(); verbGain.gain.value = 0.35; verb.connect(verbGain); verbGain.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = A.music ? 0.32 : 0; musicBus.connect(master); musicBus.connect(verb);
    sfxBus = ctx.createGain(); sfxBus.gain.value = A.sfx ? 0.5 : 0; sfxBus.connect(master);
    // 날씨 소리: 부드러운 분홍 잡음 바탕 + 빗방울 + (장대비) 낮은 웅웅거림 + (눈) 바람
    ambBus = ctx.createGain(); ambBus.gain.value = 1; ambBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate); { const nd = noiseBuf.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0; for (let i = 0; i < nd.length; i++) { const w = Math.random() * 2 - 1; b0 = 0.997 * b0 + w * 0.029; b1 = 0.985 * b1 + w * 0.032; b2 = 0.95 * b2 + w * 0.048; nd[i] = (b0 + b1 + b2 + w * 0.02) * 0.9; } }
    const loopNoise = () => { const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true; n.loopStart = Math.random(); n.start(0, Math.random() * 2); return n; };
    rainNode = loopNoise(); rainLP = ctx.createBiquadFilter(); rainLP.type = 'lowpass'; rainLP.frequency.value = 900;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 180;
    rainGain = ctx.createGain(); rainGain.gain.value = 0; rainNode.connect(rainLP); rainLP.connect(hp); hp.connect(rainGain); rainGain.connect(ambBus);
    const rum = loopNoise(), rlp = ctx.createBiquadFilter(); rlp.type = 'lowpass'; rlp.frequency.value = 220; rumbleGain = ctx.createGain(); rumbleGain.gain.value = 0; rum.connect(rlp); rlp.connect(rumbleGain); rumbleGain.connect(ambBus);
    const wind = loopNoise(), wlp = ctx.createBiquadFilter(); wlp.type = 'bandpass'; wlp.frequency.value = 420; wlp.Q.value = 0.6; windGain = ctx.createGain(); windGain.gain.value = 0; wind.connect(wlp); wlp.connect(windGain); windGain.connect(ambBus);
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = 0.07; lfoG.gain.value = 160; lfo.connect(lfoG); lfoG.connect(wlp.frequency); lfo.start();
    A.started = true;
    scheduler();
  }

  // ---------- 음악 ----------
  // 진행: Fmaj7 - Em7 - Dm7 - Cmaj7 (낮), Am7 - Fmaj7 - Cmaj7 - G (밤은 느리고 성기게)
  const PROG = {
    day:   [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]],
    eve:   [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 66]],
    night: [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 67]],
  };
  const SCALE = [0, 2, 4, 7, 9];      // 장조 5음 음계
  let nextBar = 0, bar = 0, lastNote = 72;
  function voice(t, freq, dur, type, gain, dest, attack) {
    const ctx = A.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + (attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || musicBus); o.start(t); o.stop(t + dur + 0.05);
  }
  function pad(t, notes, dur) {
    const ctx = A.ctx, f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = A.mood === 'night' ? 700 : 1100; f.connect(musicBus);
    for (const n of notes) { voice(t, mtof(n), dur, 'triangle', 0.035, f, 0.6); voice(t, mtof(n) * 1.003, dur, 'sine', 0.03, f, 0.8); }
    voice(t, mtof(notes[0] - 12), dur * 0.9, 'sine', 0.09, musicBus, 0.05);
  }
  function bell(t, m, g) { voice(t, mtof(m), 1.6, 'sine', g, musicBus, 0.005); voice(t, mtof(m) * 2, 0.6, 'sine', g * 0.25, musicBus, 0.005); voice(t, mtof(m) * 3.01, 0.3, 'sine', g * 0.08, musicBus, 0.005); }
  // 계절마다 화성·빠르기·음색이 다름: 봄 밝은 종소리, 여름 마림바와 셰이커, 가을 낮고 따뜻한 퉁김, 겨울 높고 성긴 첼레스타
  const SEASON = {
    spring: { shift: 0, beat: 0.74, dens: 1, voice: 'bell' },
    summer: { shift: 2, beat: 0.68, dens: 1.1, voice: 'marimba', prog: [[50, 54, 57, 61], [52, 55, 59, 62], [47, 50, 54, 57], [49, 52, 56, 59]] },
    autumn: { shift: -3, beat: 0.86, dens: 0.8, voice: 'pluck', prog: [[45, 48, 52, 55], [50, 53, 57, 60], [43, 47, 50, 53], [48, 52, 55, 59]] },
    winter: { shift: 0, beat: 0.98, dens: 0.55, voice: 'celesta', prog: [[48, 52, 55, 59], [45, 48, 52, 55], [41, 45, 48, 52], [43, 47, 50, 55]] },
  };
  function marimba(t, m, g) { voice(t, mtof(m), 0.45, 'triangle', g * 1.1, musicBus, 0.003); voice(t, mtof(m) * 4, 0.08, 'sine', g * 0.2, musicBus, 0.002); }
  function pluck(t, m, g) { const ctx = A.ctx, f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(500, t + 0.6); f.connect(musicBus); voice(t, mtof(m), 1.1, 'sawtooth', g * 0.35, f, 0.004); }
  function celesta(t, m, g) { voice(t, mtof(m + 12), 2.2, 'sine', g * 0.8, musicBus, 0.004); voice(t, mtof(m + 24), 0.7, 'sine', g * 0.18, musicBus, 0.004); }
  function shaker(t, g) { const ctx = A.ctx, s2 = ctx.createBufferSource(), f = ctx.createBiquadFilter(), gg = ctx.createGain(); s2.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 5000; gg.gain.setValueAtTime(0.0001, t); gg.gain.exponentialRampToValueAtTime(g, t + 0.01); gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); s2.connect(f); f.connect(gg); gg.connect(musicBus); s2.start(t, Math.random() * 2, 0.12); }
  function scheduleBar(t) {
    const SE = SEASON[A.season] || SEASON.spring;
    const wet = A.weather === 'rain', snowy = A.weather === 'snow', hot = A.weather === 'heat';
    const base = SE.prog && A.mood === 'day' ? SE.prog : (PROG[A.mood] || PROG.day);
    const chord = base[bar % base.length].map(n => n + (SE.prog && A.mood === 'day' ? 0 : SE.shift));
    const beat = (A.mood === 'night' ? 0.95 : A.mood === 'eve' ? 0.85 : SE.beat) * (wet ? 1.12 : snowy ? 1.18 : hot ? 1.1 : 1);
    const len = beat * 4;
    pad(t, chord, len + 0.6);
    const density = (A.mood === 'night' ? 0.25 : A.mood === 'eve' ? 0.38 : 0.5) * SE.dens * (wet ? 0.7 : snowy ? 0.55 : 1);
    if (SE.voice === 'marimba' && A.mood === 'day' && !wet) for (let i = 0; i < 4; i++) shaker(t + (i + 0.5) * beat, 0.012);
    const root0 = chord[0] % 12;
    for (let i = 0; i < 8; i++) {
      if (Math.random() > density) continue;
      // 음계 위를 조금씩 걸어 다니는 선율
      const cand = [];
      for (let o = 60; o <= 84; o += 12) for (const d of SCALE) cand.push(o + ((d + root0 + (A.mood === 'day' ? 0 : 0)) % 12));
      cand.sort((a, b) => Math.abs(a - lastNote) - Math.abs(b - lastNote));
      const n = cand[Math.floor(Math.random() * 4)];
      lastNote = n;
      const tt = t + i * beat / 2 + (Math.random() - 0.5) * 0.02, g = 0.07 + Math.random() * 0.03, nn = wet ? n - 12 : n;
      if (SE.voice === 'marimba') marimba(tt, nn, g); else if (SE.voice === 'pluck') pluck(tt, nn - 12, g); else if (SE.voice === 'celesta' || snowy) celesta(tt, nn, g * 0.8); else bell(tt, nn, g);
    }
    bar++;
    return len;
  }
  function scheduler() {
    if (!A.ctx) return;
    const now = A.ctx.currentTime;
    if (nextBar < now) nextBar = now + 0.1;
    while (nextBar < now + 0.5) {
      if (A.music) nextBar += scheduleBar(nextBar);
      else nextBar += 1;
    }
    if (A.rain && A.weather === 'rain') scheduleDrops(now);
    setTimeout(scheduler, 150);
  }

  // 빗방울: 잎·처마에 떨어지는 짧은 '톡'과 가끔 물방울 '퐁'. 세기에 따라 빈도·밝기가 바뀜
  let nextDrop = 0, nextThunder = 0;
  function drop(t, amt) {
    const ctx = A.ctx, s2 = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s2.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = 1400 + Math.random() * 2600; f.Q.value = 2 + Math.random() * 3;
    const peak = (0.012 + Math.random() * 0.022) * (0.6 + amt * 0.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03 + Math.random() * 0.05);
    let out = g; if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.random() * 1.6 - 0.8; g.connect(p); out = p; }
    s2.connect(f); f.connect(g); out.connect(ambBus); s2.start(t, Math.random() * 2.5, 0.1);
  }
  function plink(t) { const ctx = A.ctx, o = ctx.createOscillator(), g = ctx.createGain(), f0 = 900 + Math.random() * 1500; o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.6, t + 0.05); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g); g.connect(verb || ambBus); o.start(t); o.stop(t + 0.25); }
  function thunder(t) { const ctx = A.ctx, s2 = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s2.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.value = 160; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5); s2.connect(f); f.connect(g); g.connect(ambBus); s2.start(t, 0, 3); }
  function scheduleDrops(now) {
    const amt = A.amt;
    if (nextDrop < now) nextDrop = now + 0.05;
    while (nextDrop < now + 0.4) { drop(nextDrop, amt); if (Math.random() < 0.06 + 0.04 * (1 - amt)) plink(nextDrop + 0.02); nextDrop += (0.32 - 0.26 * amt) * (0.4 + Math.random() * 1.2); }
    if (amt > 0.8) { if (!nextThunder) nextThunder = now + 30 + Math.random() * 50; if (now > nextThunder) { thunder(now + 0.1); nextThunder = now + 45 + Math.random() * 70; } } else nextThunder = 0;
  }

  // ---------- 효과음 ----------
  function blip(t, f0, f1, dur, type, g) {
    const ctx = A.ctx, o = ctx.createOscillator(), gg = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    gg.gain.setValueAtTime(0.0001, t); gg.gain.exponentialRampToValueAtTime(g, t + 0.008); gg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gg); gg.connect(sfxBus); o.start(t); o.stop(t + dur + 0.05);
  }
  function thump(t, g) {
    const ctx = A.ctx, len = ctx.sampleRate * 0.12, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), gg = ctx.createGain();
    s.buffer = b; f.type = 'lowpass'; f.frequency.value = 500; gg.gain.value = g;
    s.connect(f); f.connect(gg); gg.connect(sfxBus); s.start(t);
  }
  const lastPlay = {};
  const SFX = {
    click: t => blip(t, 900, 620, 0.06, 'sine', 0.12),
    tab: t => blip(t, 660, 760, 0.05, 'triangle', 0.08),
    build: t => { thump(t, 0.6); [60, 64, 67, 72].forEach((m, i) => blip(t + 0.06 + i * 0.07, mtof(m + 12), null, 0.35, 'triangle', 0.14)); },
    coin: t => { blip(t, mtof(83), null, 0.09, 'square', 0.035); blip(t + 0.07, mtof(88), null, 0.3, 'square', 0.035); },
    good: t => [72, 76, 79].forEach((m, i) => blip(t + i * 0.08, mtof(m), null, 0.4, 'sine', 0.12)),
    bad: t => { blip(t, mtof(64), null, 0.25, 'triangle', 0.12); blip(t + 0.14, mtof(60), null, 0.35, 'triangle', 0.12); },
    hire: t => { blip(t, 1320, null, 0.9, 'sine', 0.12); blip(t, 2640, null, 0.4, 'sine', 0.04); blip(t + 0.12, 1760, null, 0.8, 'sine', 0.08); },
    door: t => [84, 88, 91, 96, 91].forEach((m, i) => blip(t + i * 0.06 + Math.random() * 0.02, mtof(m), null, 0.8, 'sine', 0.05)),
    fanfare: t => { [60, 64, 67, 72, 76, 79, 84].forEach((m, i) => blip(t + i * 0.07, mtof(m), null, 0.5, 'triangle', 0.1)); thump(t, 0.3); },
    page: t => blip(t, 2000, 1500, 0.03, 'triangle', 0.04),
    news: t => { blip(t, mtof(79), null, 0.3, 'sine', 0.06); blip(t + 0.1, mtof(84), null, 0.4, 'sine', 0.05); },
  };
  function play(name) {
    if (!A.started || !A.sfx || !SFX[name]) return;
    const now = A.ctx.currentTime;
    if (lastPlay[name] && now - lastPlay[name] < (name === 'coin' ? 0.9 : 0.05)) return;
    lastPlay[name] = now;
    SFX[name](now + 0.01);
  }
  // 시간·날씨·계절·비 세기(0~1)에 맞춰 음악 분위기와 날씨 소리를 천천히 바꿈
  function setMood(hour, weather, season, amt) {
    A.mood = hour >= 21 || hour < 6 ? 'night' : hour >= 17 ? 'eve' : 'day';
    A.season = season || A.season; A.weather = weather; A.amt = amt == null ? 0.6 : amt;
    const rain = weather === 'rain', snow = weather === 'snow';
    A.rain = rain || snow;
    if (!A.started) return;
    const t = A.ctx.currentTime, k = A.amt;
    rainGain.gain.setTargetAtTime(rain ? 0.018 + 0.07 * k : 0, t, 2);
    rainLP.frequency.setTargetAtTime(600 + 1500 * k, t, 2);
    rumbleGain.gain.setTargetAtTime(rain && k > 0.6 ? 0.05 * (k - 0.6) / 0.4 : 0, t, 3);
    windGain.gain.setTargetAtTime(snow ? 0.01 + 0.025 * k : weather === 'cold' ? 0.012 : 0, t, 3);
  }
  function toggleMusic() { A.music = !A.music; if (A.started) musicBus.gain.setTargetAtTime(A.music ? 0.32 : 0, A.ctx.currentTime, 0.3); save(); return A.music; }
  function toggleSfx() { A.sfx = !A.sfx; if (A.started) sfxBus.gain.setTargetAtTime(A.sfx ? 0.5 : 0, A.ctx.currentTime, 0.05); save(); return A.sfx; }
  function setVolume(v) { A.vol = Math.max(0, Math.min(1, v)); if (A.started) master.gain.setTargetAtTime(A.vol, A.ctx.currentTime, 0.1); save(); }

  root.GameAudio = { start, play, setMood, toggleMusic, toggleSfx, setVolume, get state() { return { music: A.music, sfx: A.sfx, vol: A.vol, started: A.started }; } };
})(typeof window !== 'undefined' ? window : globalThis);
