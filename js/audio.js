/* Fog of Fallacy - sound effects and voices.
   SFX are synthesised with WebAudio so there are no files to load.
   Voice: the server can hand back a recorded clip (GET /api/voice); if it has
   no voice provider configured, the browser's own speech synthesis reads the line. */

window.Audio2 = (function () {
  let ctx = null, master = null;
  const settings = { sfx: true, voice: true };

  function ac() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, t0, dur, { type = 'sine', vol = 0.12, slide = 0, attack = 0.01 } = {}) {
    const c = ac(), o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, { vol = 0.08, hp = 800, lp = 6000 } = {}) {
    const c = ac(), n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(); s.buffer = buf;
    const h = c.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = hp;
    const l = c.createBiquadFilter(); l.type = 'lowpass'; l.frequency.value = lp;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(h).connect(l).connect(g).connect(master); s.start(t0);
  }

  const SFX = {
    talk: t => tone(520, t, 0.08, { vol: 0.05 }),
    step: t => noise(t, 0.05, { vol: 0.03, hp: 300, lp: 1500 }),
    coins: t => { [1320, 1760, 2093].forEach((f, i) => tone(f, t + i * 0.06, 0.18, { type: 'triangle', vol: 0.09 })); noise(t, 0.04, { vol: 0.03, hp: 4000, lp: 9000 }); },
    coin: t => { tone(1760, t, 0.14, { type: 'triangle', vol: 0.08 }); tone(2349, t + 0.05, 0.16, { type: 'triangle', vol: 0.06 }); },
    lose: t => { tone(330, t, 0.25, { type: 'sawtooth', vol: 0.08, slide: -120 }); tone(220, t + 0.18, 0.4, { type: 'sawtooth', vol: 0.07, slide: -90 }); },
    good: t => { tone(523, t, 0.16, { vol: 0.1 }); tone(784, t + 0.1, 0.24, { vol: 0.1 }); },
    bad: t => { tone(220, t, 0.2, { type: 'sawtooth', vol: 0.08 }); tone(170, t + 0.16, 0.3, { type: 'sawtooth', vol: 0.08 }); },
    badge: t => [523, 659, 784, 1046].forEach((f, i) => tone(f, t + i * 0.12, 0.3, { vol: 0.1 })),
    fanfare: t => { [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, t + i * 0.11, 0.35, { type: 'triangle', vol: 0.1 })); [523, 659, 784].forEach(f => tone(f, t + 0.75, 0.9, { type: 'triangle', vol: 0.07 })); },
    hammer: t => { noise(t, 0.06, { vol: 0.12, hp: 1500, lp: 7000 }); tone(180, t, 0.08, { type: 'square', vol: 0.05, slide: -80 }); },
    saw: t => { for (let i = 0; i < 4; i++) noise(t + i * 0.09, 0.07, { vol: 0.05, hp: 900, lp: 3000 }); },
    dice: t => { for (let i = 0; i < 5; i++) { noise(t + i * 0.07 + Math.random() * 0.02, 0.03, { vol: 0.08, hp: 2000, lp: 8000 }); tone(900 + Math.random() * 500, t + i * 0.07, 0.03, { type: 'square', vol: 0.03 }); } },
    fog: t => { noise(t, 1.6, { vol: 0.06, hp: 200, lp: 1200 }); tone(196, t, 1.6, { type: 'sine', vol: 0.05, slide: 200 }); tone(392, t + 0.3, 1.4, { type: 'sine', vol: 0.04, slide: 300 }); },
    omen: t => { [0, 0.55, 1.1].forEach(o => { tone(146, t + o, 0.5, { type: 'triangle', vol: 0.12, slide: -20 }); tone(220, t + o, 0.5, { type: 'sine', vol: 0.06 }); }); noise(t, 1.8, { vol: 0.04, hp: 100, lp: 600 }); },
    unlock: t => { tone(659, t, 0.2, { vol: 0.09 }); tone(880, t + 0.15, 0.2, { vol: 0.09 }); tone(1318, t + 0.3, 0.5, { vol: 0.09 }); },
    open: t => tone(440, t, 0.12, { type: 'triangle', vol: 0.06, slide: 200 }),
    close: t => tone(520, t, 0.12, { type: 'triangle', vol: 0.06, slide: -200 }),
    work: t => { for (let i = 0; i < 3; i++) { noise(t + i * 0.25, 0.08, { vol: 0.08, hp: 600, lp: 3000 }); } },
    splash: t => { noise(t, 0.4, { vol: 0.1, hp: 400, lp: 4000 }); tone(300, t, 0.3, { type: 'sine', vol: 0.05, slide: -200 }); },
    goat: t => { tone(440, t, 0.25, { type: 'sawtooth', vol: 0.05, slide: 60 }); tone(440, t + 0.3, 0.2, { type: 'sawtooth', vol: 0.05, slide: -60 }); },
    bird: t => { tone(2200, t, 0.08, { vol: 0.05, slide: 600 }); tone(2600, t + 0.12, 0.1, { vol: 0.05, slide: -400 }); tone(2400, t + 0.26, 0.08, { vol: 0.05, slide: 500 }); }
  };

  function play(kind) {
    if (!settings.sfx || !SFX[kind]) return;
    try { SFX[kind](ac().currentTime); } catch (e) { /* no audio */ }
  }

  /* ---------------- voice ---------------- */
  /* Voice profiles: pitch and rate for the browser synthesiser. */
  const PROFILES = {
    kid: { pitch: 1.5, rate: 1.05 }, woman: { pitch: 1.15, rate: 1.0 }, man: { pitch: 0.8, rate: 0.95 },
    old: { pitch: 0.7, rate: 0.85 }, narrator: { pitch: 1.0, rate: 0.92 }, you: { pitch: 1.25, rate: 1.0 }
  };
  let serverVoice = null;     // null = unknown, false = server has no voice, true = ask the server
  let current = null;         // current HTMLAudio clip
  let preferred = null;
  const clips = new Map();

  function pickVoice() {
    if (preferred !== null) return preferred;
    const vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    if (!vs.length) return null;
    const en = vs.filter(v => /^en/i.test(v.lang));
    const score = v => (/natural|neural|online/i.test(v.name) ? 4 : 0) + (/google|microsoft/i.test(v.name) ? 2 : 0) + (/en-(GB|AU|IE|NZ)/i.test(v.lang) ? 1 : 0) + (v.localService ? 0 : 1);
    en.sort((a, b) => score(b) - score(a));
    preferred = en[0] || vs[0] || null;
    return preferred;
  }
  if (window.speechSynthesis) speechSynthesis.addEventListener('voiceschanged', () => { preferred = null; });

  function stop() {
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { }
    if (current) { try { current.pause(); } catch (e) { } current = null; }
  }

  async function serverHasVoice() {
    if (serverVoice !== null) return serverVoice;
    try { const r = await fetch('/api/health', { cache: 'no-store' }); const j = r.ok ? await r.json() : {}; serverVoice = !!j.voice; }
    catch (e) { serverVoice = false; }
    return serverVoice;
  }

  /* Pre-generated clips: voice/index.json maps "who|raw line" to a file in voice/.
     The index changes whenever lines are added, so it must revalidate with the server
     ('no-cache' still sends a conditional request and takes a cheap 304 when unchanged).
     Never 'force-cache': a browser that cached an older or truncated index would keep it
     for good and every line would fall back to the robot speech synthesiser. The clips
     themselves are named after a hash of their text, so they stay cacheable for ever. */
  let index = null;
  async function clipIndex() {
    if (index !== null) return index;
    try {
      const r = await fetch('voice/index.json', { cache: 'no-cache' });
      const j = r.ok ? await r.json() : null;
      index = j && typeof j === 'object' ? j : {};
    } catch (e) { index = {}; }
    return index;
  }
  function playUrl(url) { current = new window.Audio(url); current.play().catch(() => { }); }

  async function say(text, who, profile, raw) {
    if (!settings.voice || !text) return;
    stop();
    const clean = text.replace(/[*_]/g, '');
    const idx = await clipIndex();
    const file = idx[who + '|' + (raw || text)];
    if (file) { playUrl('voice/' + file); return; }
    if (await serverHasVoice()) {
      const key = who + '|' + clean;
      try {
        let url = clips.get(key);
        if (!url) {
          const r = await fetch('/api/voice?who=' + encodeURIComponent(who) + '&profile=' + encodeURIComponent(profile || 'narrator') + '&text=' + encodeURIComponent(clean));
          if (r.status === 200) { url = URL.createObjectURL(await r.blob()); clips.set(key, url); }
        }
        if (url) { playUrl(url); return; }
      } catch (e) { /* fall back to the browser voice */ }
    }
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(clean);
    const p = PROFILES[profile] || PROFILES.narrator;
    u.pitch = p.pitch; u.rate = p.rate; u.volume = 1;
    const v = pickVoice(); if (v) u.voice = v;
    try { speechSynthesis.speak(u); } catch (e) { }
  }

  function isSpeaking() { try { if (current && !current.paused && !current.ended) return true; return !!(window.speechSynthesis && speechSynthesis.speaking); } catch (e) { return false; } }
  return { play, say, stop, isSpeaking, settings, unlock: () => { try { ac(); } catch (e) { } } };
})();
