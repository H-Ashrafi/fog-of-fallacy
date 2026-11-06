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
    type.hidden = state === 'done' || state === 'typing' || state === 'recording' || state === 'busy';
    form.hidden = state !== 'typing';
    next.hidden = state !== 'done';
    mic.classList.toggle('rec', state === 'recording');
    mic.disabled = state === 'busy';
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
    if (!conv || conv.busy || conv.recorder) return;
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { status(T('I need the microphone to hear you. You can type instead.'), 'warn'); return; }
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
    try { window.Audio2 && Audio2.stop(); } catch (e) { }
    rec.start();
    render('recording'); status(T('Listening…'), 'live');
    let left = MAX_SECONDS;
    conv.timer = setInterval(() => { left--; status(T('Listening…') + ' ' + left, 'live'); if (left <= 0) stopRecording(); }, 1000);
  }
  function stopRecording() {
    if (!conv || !conv.recorder) return;
    clearInterval(conv.timer); conv.timer = null;
    try { conv.recorder.stop(); } catch (e) { conv.recorder = null; }
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
    if (j.say) conv.hooks.line(conv.seed.who, j.say);
    if (j.done) { conv.finalSay = j.say; conv.verdict = j.verdict; conv.heard = j.heard; render('done'); status(''); }
    else { render('idle'); status(''); }
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
    clearInterval(conv.timer);
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
    conv = { id: j.id, seed, hooks, turnsLeft: j.turns_left, recorder: null, stream: null, timer: null, busy: false };
    hooks.line(seed.who, j.say);
    render('idle'); status('');
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
    press: () => { if (!conv) return; if (conv.verdict) finish(); else if (conv.recorder) stopRecording(); else if (!conv.busy && hasMic()) startRecording(); },
    stop
  };
})();
