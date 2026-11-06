/* Fog of Fallacy - live conversations.
   When the server has the two API keys (/api/health says talk: true) and the device has a
   microphone, a trickster talks instead of showing three answers to pick from: the server
   writes the character's lines (js/talk.rs on the server side), the child answers out loud,
   the server hears it and judges whether the trick was spotted. The game then pays out as
   the scripted scene would. Anything missing (no keys, no microphone, the day's budget spent,
   a network error before the first line) falls back to the scripted answers in game.js.
   Typing is always offered too, for a quiet room or a parent helping. */
window.Talk = (function () {
  const $ = id => document.getElementById(id);
  const T = s => (window.I18N ? I18N.t(s) : s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const MAX_SECONDS = 10;
  const SILENCE_MS = 1400;      // this long without speech after she has spoken ends the recording
  const SILENCE_LEVEL = 0.015;  // RMS below this counts as quiet
  const A2 = () => window.Audio2;
  /* Once the browser has allowed the microphone, later turns open it without a tap. */
  let micGranted = false;
  (async () => { try { if (navigator.permissions && navigator.permissions.query) { const p = await navigator.permissions.query({ name: 'microphone' }); micGranted = p.state === 'granted'; p.onchange = () => { micGranted = p.state === 'granted'; }; } } catch (e) { } })();

  let serverTalk = false;
  async function prime() {
    try { const r = await fetch('/api/health', { cache: 'no-store' }); const j = r.ok ? await r.json() : {}; serverTalk = !!j.talk; }
    catch (e) { serverTalk = false; }
    return serverTalk;
  }
  const hasMic = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  const available = () => serverTalk && (hasMic() || true);   // typing works without a microphone

  let conv = null;   // { id, seed, hooks, turnsLeft, recorder, stream, timer, busy, finalSay }

  function box() { return $('dlg-talk'); }
  function status(text, cls) { const s = $('talk-status'); s.textContent = text || ''; s.className = 'talk-status ' + (cls || ''); }
  function render(state) {
    const b = box(); if (!b) return;
    b.hidden = false; $('dlg-choices').hidden = true; $('dlg-next').hidden = true;
    const mic = $('talk-mic'), type = $('talk-type'), form = $('talk-form'), next = $('talk-next');
    mic.hidden = !hasMic() || state === 'done' || state === 'typing';
    type.hidden = state === 'done' || state === 'typing' || state === 'recording' || state === 'busy' || state === 'speaking';
    form.hidden = state !== 'typing';
    next.hidden = state !== 'done';
    mic.classList.toggle('rec', state === 'recording');
    mic.disabled = state === 'busy' || state === 'speaking';
    mic.setAttribute('aria-label', state === 'recording' ? T('Stop') : T('Say your answer'));
    mic.querySelector('.mic-label').textContent = state === 'recording' ? T('Tap when you are done') : T('Say your answer');
    if (state === 'typing') { const inp = $('talk-input'); inp.value = ''; setTimeout(() => inp.focus(), 50); }
  }
  function hideBox() { const b = box(); if (b) b.hidden = true; }

  function mimeType() {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    return types.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
  }

  async function startRecording() {
    if (!conv || conv.busy || conv.recorder || conv.verdict) return;
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); micGranted = true; }
    catch (e) { micGranted = false; render('idle'); status(T('I need the microphone to hear you. You can type instead.'), 'warn'); return; }
    if (!conv || conv.recorder) { stream.getTracks().forEach(t => t.stop()); return; }
    const chunks = [];
    const type = mimeType();
    const rec = type ? new MediaRecorder(stream, { mimeType: type }) : new MediaRecorder(stream);
    rec.addEventListener('dataavailable', e => { if (e.data && e.data.size) chunks.push(e.data); });
    rec.addEventListener('stop', () => {
      stream.getTracks().forEach(t => t.stop());
      conv.recorder = null; conv.stream = null;
      const blob = new Blob(chunks, { type: rec.mimeType || type || 'audio/webm' });
      send(blob, null);
    });
    conv.recorder = rec; conv.stream = stream;
    try { A2() && A2().stop(); } catch (e) { }
    rec.start();
    render('recording'); status(T('Listening…'), 'live');
    const t0 = performance.now();
    let spoke = false, quietSince = 0;
    const meter = levelMeter(stream);
    conv.meterStop = meter ? meter.stop : null;
    conv.timer = setInterval(() => {
      const now = performance.now(), left = MAX_SECONDS - Math.floor((now - t0) / 1000);
      status(T('Listening…') + ' ' + Math.max(0, left), 'live');
      const level = meter ? meter() : 0;
      if (level > SILENCE_LEVEL) { spoke = true; quietSince = 0; }
      else if (spoke && !quietSince) quietSince = now;
      /* She spoke and then went quiet: that is the end of her answer. No need to tap again. */
      if ((spoke && quietSince && now - quietSince > SILENCE_MS) || left <= 0) stopRecording();
    }, 100);
  }
  /* Microphone loudness, 0..1, from a tiny analyser on the stream. Null where WebAudio is missing. */
  function levelMeter(stream) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser(); an.fftSize = 512; src.connect(an);
      const buf = new Float32Array(an.fftSize);
      const f = () => { an.getFloatTimeDomainData(buf); let sum = 0; for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]; return Math.sqrt(sum / buf.length); };
      f.stop = () => { try { src.disconnect(); ctx.close(); } catch (e) { } };
      return f;
    } catch (e) { return null; }
  }
  function stopRecording() {
    if (!conv || !conv.recorder) return;
    clearInterval(conv.timer); conv.timer = null;
    if (conv.meterStop) { conv.meterStop(); conv.meterStop = null; }
    try { conv.recorder.stop(); } catch (e) { conv.recorder = null; }
  }

  /* The character is talking: nothing can interrupt the line. When it ends, `then` runs: listen by
     itself (once the mic was allowed), or show Next after the last line, which also advances on its own. */
  function afterSpeech(then) {
    if (!conv) return;
    const mine = conv;
    render('speaking'); status(T('Listen…'), 'live');
    const a = A2();
    const wait = setInterval(() => {
      if (conv !== mine) { clearInterval(wait); return; }
      if (a && a.isBusy && a.isBusy() && performance.now() - mine.spokeAt < 20000) return;   // 20 s: longer than any line, in case a clip never ends
      clearInterval(wait);
      then();
    }, 120);
  }

  async function send(blob, text) {
    if (!conv) return;
    conv.busy = true; render('busy'); status(T('Thinking…'), 'live');
    let r, j;
    try {
      const url = '/api/talk/' + encodeURIComponent(conv.id) + (text !== null ? '?text=' + encodeURIComponent(text) : '');
      r = await fetch(url, text !== null ? { method: 'POST' } : { method: 'POST', headers: { 'content-type': blob.type || 'audio/webm' }, body: blob });
      j = await r.json().catch(() => ({}));
    } catch (e) { r = null; }
    conv.busy = false;
    if (!r || !r.ok) {
      if (r && (r.status === 404 || r.status === 410 || r.status === 429)) { giveUp(); return; }
      render('idle'); status(T('I could not hear that. Try again.'), 'warn'); return;
    }
    if (!j.heard) { render('idle'); status(T('I could not hear that. Try again.'), 'warn'); return; }
    $('talk-heard').innerHTML = '<small>' + esc(T('You said')) + '</small>' + esc(j.heard);
    $('talk-heard').hidden = false;
    conv.turnsLeft = j.turns_left;
    if (j.say) { conv.spokeAt = performance.now(); conv.hooks.line(conv.seed.who, j.say); }
    if (j.done) {
      conv.finalSay = j.say; conv.verdict = j.verdict; conv.heard = j.heard;
      afterSpeech(() => { render('done'); status(''); conv.autoNext = setTimeout(() => { if (conv && conv.verdict) finish(); }, 1500); });
    } else {
      afterSpeech(() => { render('idle'); status(''); if (micGranted) startRecording(); });
    }
  }

  /* The server dropped the conversation (over, or the day's budget ran out): no verdict, no
     coins change hands, the child can try the scripted version by talking again. */
  function giveUp() {
    const h = conv.hooks; stop();
    h.abort();
  }

  function finish() {
    if (!conv) return;
    const { hooks, verdict, heard, finalSay } = conv;
    stop();
    hooks.finish(verdict, heard, finalSay);
  }
  function stop() {
    if (!conv) return;
    clearInterval(conv.timer); clearTimeout(conv.autoNext);
    if (conv.meterStop) conv.meterStop();
    if (conv.recorder) { try { conv.recorder.stop(); } catch (e) { } }
    if (conv.stream) conv.stream.getTracks().forEach(t => t.stop());
    conv = null; hideBox();
    $('talk-heard').hidden = true;
  }

  /* Start a conversation for a scripted scene. Resolves true when the character has spoken
     (the dialogue is now live), false when the scripted scene should run instead. */
  async function run(seed, hooks) {
    if (!available() || conv) return false;
    let j;
    try {
      const r = await fetch('/api/talk', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(seed) });
      if (!r.ok) { if (r.status === 429 || r.status === 503) serverTalk = false; return false; }
      j = await r.json();
    } catch (e) { return false; }
    if (!j || !j.id || !j.say) return false;
    conv = { id: j.id, seed, hooks, turnsLeft: j.turns_left, recorder: null, stream: null, timer: null, busy: false, spokeAt: performance.now() };
    hooks.line(seed.who, j.say);
    afterSpeech(() => { render('idle'); status(''); if (micGranted) startRecording(); });
    return true;
  }

  function wire() {
    const b = box(); if (!b) return;
    $('talk-mic').addEventListener('click', () => { if (!conv) return; if (conv.recorder) stopRecording(); else startRecording(); });
    $('talk-type').addEventListener('click', () => { if (conv && !conv.busy) render('typing'); });
    $('talk-form').addEventListener('submit', e => {
      e.preventDefault();
      const v = $('talk-input').value.trim();
      if (!v || !conv) return;
      send(null, v);
    });
    $('talk-cancel').addEventListener('click', () => { if (conv) render('idle'); });
    $('talk-next').addEventListener('click', finish);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  prime();

  return {
    prime, available, run,
    active: () => !!conv,
    /* The A button / Enter while a conversation is on screen: advance when the scene is over, else toggle the microphone. */
    press: () => { if (!conv) return; if (conv.verdict) { if (!$('talk-next').hidden) finish(); } else if (conv.recorder) stopRecording(); else if (!conv.busy && !$('talk-mic').disabled && hasMic()) startRecording(); },
    stop
  };
})();
