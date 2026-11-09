/* 모락모락 타운 — 소리 (Web Audio로 직접 만드는 잔잔한 음악과 효과음, 음원 파일 없음) */
(function (root) {
  'use strict';
  const PREF_KEY = 'morak.audio';
  const A = { ctx: null, music: true, sfx: true, vol: 0.7, mood: 'day', rain: false, started: false };
  try { Object.assign(A, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch (e) { /* 저장소 없음 */ }
  A.started = false; A.ctx = null;
  function save() { try { localStorage.setItem(PREF_KEY, JSON.stringify({ music: A.music, sfx: A.sfx, vol: A.vol })); } catch (e) { /* 무시 */ } }

  let master, musicBus, sfxBus, rainNode, rainGain, verb;
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
    // 빗소리: 걸러낸 잡음
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    rainNode = ctx.createBufferSource(); rainNode.buffer = nb; rainNode.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 300;
    rainGain = ctx.createGain(); rainGain.gain.value = 0;
    rainNode.connect(lp); lp.connect(hp); hp.connect(rainGain); rainGain.connect(master);
    rainNode.start();
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
  function scheduleBar(t) {
    const prog = PROG[A.mood] || PROG.day, chord = prog[bar % prog.length];
    const beat = A.mood === 'night' ? 0.95 : A.mood === 'eve' ? 0.85 : 0.75;
    const len = beat * 4;
    pad(t, chord, len + 0.6);
    const density = A.mood === 'night' ? 0.25 : A.mood === 'eve' ? 0.38 : 0.5;
    const root0 = chord[0] % 12;
    for (let i = 0; i < 8; i++) {
      if (Math.random() > density) continue;
      // 음계 위를 조금씩 걸어 다니는 선율
      const cand = [];
      for (let o = 60; o <= 84; o += 12) for (const d of SCALE) cand.push(o + ((d + root0 + (A.mood === 'day' ? 0 : 0)) % 12));
      cand.sort((a, b) => Math.abs(a - lastNote) - Math.abs(b - lastNote));
      const n = cand[Math.floor(Math.random() * 4)];
      lastNote = n;
      bell(t + i * beat / 2 + (Math.random() - 0.5) * 0.02, n, 0.07 + Math.random() * 0.03);
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
    setTimeout(scheduler, 150);
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
  function setMood(hour, weather) {
    A.mood = hour >= 21 || hour < 6 ? 'night' : hour >= 17 ? 'eve' : 'day';
    const rain = weather === 'rain' || weather === 'snow';
    if (A.started && rain !== A.rain) rainGain.gain.setTargetAtTime(rain ? (weather === 'rain' ? 0.05 : 0.015) : 0, A.ctx.currentTime, 1.5);
    A.rain = rain;
  }
  function toggleMusic() { A.music = !A.music; if (A.started) musicBus.gain.setTargetAtTime(A.music ? 0.32 : 0, A.ctx.currentTime, 0.3); save(); return A.music; }
  function toggleSfx() { A.sfx = !A.sfx; if (A.started) sfxBus.gain.setTargetAtTime(A.sfx ? 0.5 : 0, A.ctx.currentTime, 0.05); save(); return A.sfx; }
  function setVolume(v) { A.vol = Math.max(0, Math.min(1, v)); if (A.started) master.gain.setTargetAtTime(A.vol, A.ctx.currentTime, 0.1); save(); }

  root.GameAudio = { start, play, setMood, toggleMusic, toggleSfx, setVolume, get state() { return { music: A.music, sfx: A.sfx, vol: A.vol, started: A.started }; } };
})(typeof window !== 'undefined' ? window : globalThis);
