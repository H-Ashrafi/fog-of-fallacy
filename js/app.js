/* Fog of Fallacy - game loop, screens, progress. Picture-first version for a young reader.
   Depends on window.FOG (data.js) and window.Dragon (dragon.js). */

(function () {
  'use strict';

  const D = window.FOG;
  const Dragon = window.Dragon;
  const STAGES = Dragon.STAGES;
  const app = document.getElementById('app');
  const KEY = 'fog-of-fallacy-v2';

  /* ---------------- state ---------------- */
  const DEFAULT = {
    name: '', xp: 0, lessons: {}, stars: {}, stats: {}, best: 0, caught: 0,
    cleared: 0, patrols: 0, sound: true, bold: false, intros: {}, ending: false
  };
  let S = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign({}, DEFAULT, JSON.parse(raw));
    } catch (e) { /* storage unavailable: play without saving */ }
    return Object.assign({}, DEFAULT);
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
  }

  /* ---------------- helpers ---------------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fx = id => D.FALLACIES.find(f => f.id === id);
  const chapter = n => D.CHAPTERS.find(c => c.n === n);
  const scenesOf = n => D.SCENES.filter(s => s.chapter === n);
  const starsOf = id => S.stars[id] || 0;
  const chapterDone = n => scenesOf(n).every(s => starsOf(s.id) > 0);
  const chapterOpen = n => n === 1 || chapterDone(n - 1);
  const lessonsDone = n => chapter(n).unlocks.every(id => S.lessons[id]);
  const bossOpen = n => scenesOf(n).filter(s => !s.boss).every(s => starsOf(s.id) > 0);
  const learned = () => D.FALLACIES.filter(f => S.lessons[f.id]);
  const stage = () => Dragon.stageOf(S.xp);
  const rand = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const accuracy = id => { const t = S.stats[id]; return t && t.seen ? t.correct / t.seen : null; };
  const pct = n => Math.round(n * 100) + '%';
  const LAST = D.CHAPTERS[D.CHAPTERS.length - 1].n;

  function bump(id, ok) {
    const t = S.stats[id] || (S.stats[id] = { seen: 0, correct: 0 });
    t.seen++; if (ok) t.correct++;
  }

  function starStr(n) {
    return '<b>' + '★'.repeat(n) + '</b>' + '★'.repeat(3 - n);
  }

  function xpPct() {
    const s = stage();
    if (s >= STAGES.length - 1) return 100;
    const lo = STAGES[s].xp, hi = STAGES[s + 1].xp;
    return Math.min(100, Math.round((S.xp - lo) / (hi - lo) * 100));
  }

  function setFog() {
    const done = D.CHAPTERS.filter(c => chapterDone(c.n)).length;
    const level = 0.55 - 0.5 * (done / D.CHAPTERS.length);
    document.documentElement.style.setProperty('--fog-level', level.toFixed(2));
  }

  function avatar(who, size) {
    const c = D.CAST[who];
    if (c.img) return `<img class="avatar ${size || ''}" src="${c.img}" alt="${c.name}">`;
    return `<div class="avatar ${size || ''} avatar-emoji" aria-hidden="true">${c.emoji}</div>`;
  }

  /* ---------------- sound ---------------- */
  const Sound = {
    ctx: null,
    play(kind) {
      if (!S.sound) return;
      try {
        this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
        const c = this.ctx, now = c.currentTime;
        const seq = {
          catch: [[523, 0], [784, .1]],
          fair: [[440, 0]],
          miss: [[220, 0], [170, .16]],
          near: [[392, 0], [392, .12]],
          grow: [[523, 0], [659, .12], [784, .24], [1046, .38]],
          tap: [[660, 0]]
        }[kind] || [];
        seq.forEach(([f, t]) => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = kind === 'miss' ? 'sawtooth' : 'sine';
          o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, now + t);
          g.gain.exponentialRampToValueAtTime(kind === 'miss' ? 0.08 : 0.16, now + t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.28);
          o.connect(g).connect(c.destination);
          o.start(now + t); o.stop(now + t + 0.32);
        });
      } catch (e) { /* no audio */ }
    }
  };

  /* ---------------- Pip's lines ---------------- */
  const SAY = {
    open: ['Listen. Fair, or a trick?', 'I smell fog. Watch out!', 'Every line: fair, or a trick?'],
    catch: ['Caught it!', 'Fog, begone!', 'Nice eye!', 'Ha! Got it!'],
    fair: ['Fair. Let it pass.', 'Good call!', 'That one was honest.'],
    missed: ['Oops. It slipped by.', 'Sneaky! Next time.', 'The fog got thicker.'],
    falseAlarm: ['Careful. That was fair.', 'Not every line is a trick.', 'Fair is fair!'],
    wrongPick: ['Close! Wrong trick.', 'So close!', 'Right idea, wrong trick.'],
    result: ['We did it!', 'My wings feel bigger!', 'Sly won\'t like this!']
  };

  /* ---------------- shared bits ---------------- */
  function topbar() {
    const st = stage();
    return `
      <div class="topbar">
        <div class="pip-mini">${Dragon.svg(st, 'idle')}</div>
        <div class="grow">
          <div class="flex items-baseline justify-between gap-2">
            <span class="font-display font-bold truncate">${esc(S.name)} &amp; Pip</span>
            <span class="pill pill-lantern">${STAGES[st].name}</span>
          </div>
          <div class="xpbar mt-1"><i style="width:${xpPct()}%"></i></div>
        </div>
        <button class="iconbtn" data-act="sound" aria-label="Sound ${S.sound ? 'on' : 'off'}" title="Sound">${S.sound ? '🔔' : '🔕'}</button>
      </div>`;
  }

  let current = null;
  function show(fn, ...args) {
    current = { fn, args };
    window.scrollTo(0, 0);
    fn(...args);
  }
  function rerender() { if (current) current.fn(...current.args); }

  /* ---------------- title ---------------- */
  function renderTitle() {
    app.innerHTML = `
      <section class="screen items-center text-center">
        <div class="title-pip">${Dragon.svg(S.name ? stage() : 0, 'idle')}</div>
        <div>
          <p class="eyebrow">Thistlewood Forest</p>
          <h1>Fog of Fallacy</h1>
        </div>
        <p class="lede">Catch the tricks. Clear the fog. Grow Pip.</p>
        ${S.name ? `
          <button class="btn btn-wide btn-big" data-act="map">Play as ${esc(S.name)}</button>
          <button class="btn btn-ghost btn-sm" data-act="reset">Start again</button>
        ` : `
          <div class="w-full flex flex-col gap-3 text-left">
            <label class="eyebrow" for="name-input">What's your name?</label>
            <input id="name-input" class="input" maxlength="20" autocomplete="off" placeholder="Your name">
            <button class="btn btn-wide btn-big" data-act="start">Hatch Pip</button>
          </div>`}
      </section>`;
    const inp = document.getElementById('name-input');
    if (inp) inp.focus();
  }

  /* ---------------- story ---------------- */
  let onContinue = null;
  function renderStory(eyebrow, title, img, paras, mood, next, btnLabel) {
    onContinue = next;
    app.innerHTML = `
      <section class="screen">
        <div><p class="eyebrow">${eyebrow}</p><h2>${title}</h2></div>
        ${img ? `<img class="hero-img" src="${img}" alt="">` : ''}
        <div class="flex items-start gap-3">
          <div class="w-20 h-20 flex-none">${Dragon.svg(stage(), mood || 'idle')}</div>
          <div class="story card flex-1">${paras.map(p => `<p>${p}</p>`).join('')}</div>
        </div>
        <button class="btn btn-wide btn-big" data-act="continue">${btnLabel || 'Next'}</button>
      </section>`;
  }

  /* ---------------- map ---------------- */
  function renderMap() {
    setFog();
    const cards = D.CHAPTERS.map(c => {
      const open = chapterOpen(c.n), done = chapterDone(c.n);
      const sc = scenesOf(c.n);
      const got = sc.reduce((a, s) => a + starsOf(s.id), 0);
      return `
        <button class="chapter ${done ? 'done' : ''}" data-act="chapter" data-a="${c.n}" ${open ? '' : 'disabled'}>
          <img class="thumb" src="${c.img}" alt="">
          <span class="grow">
            <span class="font-display font-bold text-lg block leading-tight">${c.title}</span>
            <span class="sub block">${open ? c.unlocks.map(id => fx(id).icon).join(' ') + ' ' + c.unlocks.map(id => fx(id).nick).join(' · ') : '🔒 Finish chapter ' + (c.n - 1) + ' first'}</span>
          </span>
          ${open ? `<span class="pill ${done ? 'pill-fair' : 'pill-lantern'}">★ ${got}/${sc.length * 3}</span>` : ''}
        </button>`;
    }).join('');

    app.innerHTML = `
      <section class="screen">
        ${topbar()}
        <h2>Where to, ${esc(S.name)}?</h2>
        <div class="flex flex-col gap-2">${cards}</div>
        <div class="navrow">
          <button class="navbtn" data-act="patrol" ${learned().length ? '' : 'disabled'}><span class="ic">🔦</span>Fog Patrol</button>
          <button class="navbtn" data-act="guide"><span class="ic">📖</span>Trick Book</button>
          <button class="navbtn" data-act="den"><span class="ic">🏡</span>Pip's Den</button>
        </div>
        <button class="btn btn-ghost btn-sm self-center" data-act="title">Title screen</button>
      </section>`;
  }

  /* ---------------- chapter ---------------- */
  function renderChapter(n) {
    const c = chapter(n);
    if (!S.intros[n]) {
      renderStory('Chapter ' + n, c.title, c.img, c.intro, n === 1 ? 'happy' : 'idle', () => {
        S.intros[n] = 1; save(); show(renderChapter, n);
      }, n === 1 ? 'Help Pip' : 'Let\'s go');
      return;
    }
    const canPlay = lessonsDone(n);
    const lessons = c.unlocks.map(id => {
      const f = fx(id), done = !!S.lessons[id];
      return `
        <button class="task lesson ${done ? 'done' : ''}" data-act="lesson" data-a="${id}">
          <img class="thumb" src="${f.img}" alt="">
          <span class="grow"><b class="font-display">${f.nick}</b><span class="sub block">${done ? 'Learned ✓' : 'Learn this trick'}</span></span>
          <span class="pill ${done ? 'pill-fair' : 'pill-lantern'}">${done ? '✓' : 'New'}</span>
        </button>`;
    }).join('');
    const scenes = scenesOf(n).map(s => {
      const locked = s.boss ? !bossOpen(n) : !canPlay;
      const faces = [...new Set(s.lines.map(l => l.who))].slice(0, 3);
      return `
        <button class="task ${s.boss ? 'boss' : ''}" data-act="scene" data-a="${s.id}" ${locked ? 'disabled' : ''}>
          <span class="faces">${faces.map(w => avatar(w, 'sm')).join('')}</span>
          <span class="grow"><b class="font-display">${s.title}</b><span class="sub block">${s.boss ? 'Face Sly Fox' : s.where}</span></span>
          <span class="stars">${starStr(starsOf(s.id))}</span>
        </button>`;
    }).join('');

    app.innerHTML = `
      <section class="screen">
        ${topbar()}
        <img class="hero-img" src="${c.img}" alt="">
        <div><p class="eyebrow">Chapter ${n}</p><h2>${c.title}</h2></div>
        <div class="flex flex-col gap-2">
          <p class="eyebrow">Learn</p>
          ${lessons}
        </div>
        <div class="flex flex-col gap-2">
          <p class="eyebrow">Play${canPlay ? '' : ' · learn both tricks first'}</p>
          ${scenes}
        </div>
        <button class="switch" role="switch" aria-checked="${S.bold}" data-act="bold">
          <span class="knob"></span>
          <span class="grow"><b class="font-display">Bold mode</b><span class="sub block">No mistakes = double XP.</span></span>
        </button>
        <button class="btn btn-ghost" data-act="map">Map</button>
      </section>`;
  }

  /* ---------------- lesson ---------------- */
  let L = null;
  function renderLesson(fid) {
    const f = fx(fid);
    const others = learned().filter(o => o.id !== fid);
    const speakers = Object.keys(D.CAST).filter(k => k !== 'pip');
    const opts = [{ text: rand(f.drills), f: fid, who: rand(speakers) }];
    if (others.length && Math.random() < 0.5) { const o = rand(others); opts.push({ text: rand(o.drills), f: o.id, who: rand(speakers) }); }
    else opts.push({ text: rand(D.FAIR_LINES).text, f: null, who: rand(speakers) });
    L = { fid, opts: shuffle(opts), solved: false };

    app.innerHTML = `
      <section class="screen">
        <div class="flex items-center justify-between gap-2">
          <p class="eyebrow">New trick</p>
          <button class="btn btn-ghost btn-sm" data-act="chapterOf" data-a="${fid}">Back</button>
        </div>
        <div class="paper flex flex-col gap-4">
          <img class="trick-img" src="${f.img}" alt="">
          <div class="text-center">
            <h2>${f.icon} ${f.nick}</h2>
            <p class="text-lg font-bold mt-1">${f.one}</p>
          </div>
          <div class="hint"><span class="eyebrow">Ask</span><p>${f.spot}</p></div>
          <div class="flex flex-col gap-3">
            ${f.examples.map(e => `
              <div class="line">${avatar(e.who)}<div class="bubble"><span class="who">${D.CAST[e.who].name}</span><span class="text">${e.text}</span><span class="why">${e.why}</span></div></div>`).join('')}
          </div>
        </div>
        <div class="card flex flex-col gap-3">
          <h3>Which one is ${f.nick}?</h3>
          <div class="flex flex-col gap-2" id="quiz">
            ${L.opts.map((o, i) => `<button class="quiz-opt" data-act="quiz" data-a="${i}">${avatar(o.who, 'sm')}<span>${o.text}</span></button>`).join('')}
          </div>
          <div id="quiz-fb"></div>
        </div>
      </section>`;
  }

  function quiz(i) {
    if (!L || L.solved) return;
    const o = L.opts[i], f = fx(L.fid);
    const btns = app.querySelectorAll('.quiz-opt');
    const fb = document.getElementById('quiz-fb');
    if (o.f === L.fid) {
      L.solved = true;
      btns.forEach((b, j) => { b.disabled = true; if (j === i) b.classList.add('right'); });
      const first = !S.lessons[L.fid];
      if (first) { S.lessons[L.fid] = 1; S.xp += 5; save(); }
      fb.innerHTML = `
        <div class="feedback good">
          <div class="head"><span>Yes! ${f.icon} ${f.nick}</span>${first ? '<span class="xp">+5 XP</span>' : ''}</div>
        </div>
        <button class="btn btn-wide btn-big mt-3" data-act="chapterOf" data-a="${L.fid}">Got it!</button>`;
      Sound.play('catch');
    } else {
      btns[i].disabled = true; btns[i].classList.add('wrong');
      const msg = o.f ? `That one is ${fx(o.f).nick}. Try again.` : 'That one is fair. Try again.';
      fb.innerHTML = `<div class="feedback bad"><div class="head"><span>Not that one</span></div><div class="body">${msg}</div></div>`;
      Sound.play('miss');
    }
  }

  /* ---------------- scene play ---------------- */
  let P = null;

  function buildPatrol() {
    const pool = learned();
    const weights = pool.map(f => { const a = accuracy(f.id); return 1 + (1 - (a === null ? 0.5 : a)) * 3; });
    const pickWeighted = () => {
      let r = Math.random() * weights.reduce((a, b) => a + b, 0);
      for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; }
      return pool[pool.length - 1];
    };
    const used = new Set(), lines = [];
    const speakers = Object.keys(D.CAST).filter(k => k !== 'pip');
    let guard = 0;
    while (lines.length < 4 && guard++ < 60) {
      const f = pickWeighted(), text = rand(f.drills);
      if (used.has(text)) continue;
      used.add(text);
      lines.push({ who: rand(speakers), text, f: f.id, why: f.spot });
    }
    shuffle(D.FAIR_LINES).slice(0, 2).forEach(fl => lines.push({ who: rand(speakers), text: fl.text, f: null, why: fl.why }));
    return { id: 'patrol', title: 'Fog Patrol', where: 'Fair, or a trick?', lines: shuffle(lines), patrol: true };
  }

  function startScene(id) {
    const scene = id === 'patrol' ? buildPatrol() : D.SCENES.find(s => s.id === id);
    P = { scene, i: -1, streak: 0, best: 0, xp: 0, mistakes: 0, bold: !scene.patrol && S.bold, results: [], rebutted: false };
    current = { fn: renderSceneShell, args: [] };
    window.scrollTo(0, 0);
    renderSceneShell();
    nextLine();
  }

  function renderSceneShell() {
    const sc = P.scene;
    const c = sc.patrol ? null : chapter(sc.chapter);
    app.innerHTML = `
      <section class="screen">
        <div class="backdrop" ${c ? `style="background-image:url('${c.img}')"` : ''}>
          <div class="backdrop-text">
            <p class="eyebrow">${sc.patrol ? 'Fog Patrol' : (sc.boss ? 'Sly Fox!' : 'Chapter ' + c.n)}</p>
            <h3>${sc.title}</h3>
          </div>
          <div class="backdrop-pills">
            <span class="pill pill-lantern" id="sc-xp">+0 XP</span>
            <span class="pill pill-mist" id="sc-streak">🔥 0</span>
            <span class="pill" id="sc-prog">1 / ${sc.lines.length}</span>
            ${P.bold ? '<span class="pill pill-fog" id="sc-bold">Bold ×2</span>' : ''}
          </div>
        </div>
        <div class="pip-panel">
          <div class="pip-box" id="pip-box">${Dragon.svg(stage(), 'idle')}</div>
          <div class="pip-say" id="pip-say">${rand(SAY.open)}</div>
        </div>
        <div class="dialogue" id="dialogue"></div>
        <div id="actions" class="flex flex-col gap-2 pb-2"></div>
        <button class="btn btn-ghost btn-sm self-center" data-act="quit">Leave</button>
      </section>`;
  }

  function say(text) { const el = document.getElementById('pip-say'); if (el) el.textContent = text; }
  function pip(mood) { Dragon.react(document.getElementById('pip-box'), mood, mood === 'happy' ? 1500 : 1200); }
  function setActions(html) {
    const a = document.getElementById('actions');
    a.innerHTML = html;
    requestAnimationFrame(() => a.scrollIntoView({ block: 'end', behavior: 'smooth' }));
  }
  function updatePills() {
    const xp = document.getElementById('sc-xp'), st = document.getElementById('sc-streak'), pr = document.getElementById('sc-prog'), bd = document.getElementById('sc-bold');
    if (xp) xp.textContent = '+' + P.xp + ' XP';
    if (st) st.textContent = '🔥 ' + P.streak;
    if (pr) pr.textContent = Math.min(P.i + 1, P.scene.lines.length) + ' / ' + P.scene.lines.length;
    if (bd && P.mistakes > 0) { bd.textContent = 'Bold lost'; bd.classList.remove('pill-fog'); bd.classList.add('pill-mist'); }
  }

  function nextLine() {
    P.i++;
    const lines = P.scene.lines;
    if (P.i >= lines.length) { endLines(); return; }
    const prev = document.getElementById('line-' + (P.i - 1));
    if (prev) prev.classList.add('past');
    const ln = lines[P.i], who = D.CAST[ln.who];
    const dlg = document.getElementById('dialogue');
    dlg.insertAdjacentHTML('beforeend', `
      <div class="line ${who.villain ? 'villain' : ''}" id="line-${P.i}">
        ${avatar(ln.who)}
        <div class="bubble"><span class="who">${who.name}</span><span class="text">${ln.text}</span></div>
      </div>`);
    updatePills();
    setActions(`
      <div class="decide">
        <button class="btn btn-fair" data-act="judge" data-a="fair"><span class="big-ic">👍</span>Fair</button>
        <button class="btn btn-fog" data-act="judge" data-a="fog"><span class="big-ic">🚩</span>Trick!</button>
      </div>`);
  }

  function judge(call) {
    const ln = P.scene.lines[P.i];
    Sound.play('tap');
    if (call === 'fair') resolve(ln.f ? 'missed' : 'fairOk');
    else if (!ln.f) resolve('falseAlarm');
    else showPicker();
  }

  function showPicker() {
    const opts = learned();
    setActions(`
      <p class="eyebrow text-center">Which trick?</p>
      <div class="picker">
        ${opts.map(f => `<button class="pick" data-act="pick" data-a="${f.id}"><img src="${f.img}" alt=""><span class="nm">${f.icon} ${f.nick}</span></button>`).join('')}
      </div>`);
  }

  function pick(fid) {
    const ln = P.scene.lines[P.i];
    resolve(fid === ln.f ? 'caught' : 'wrongPick', fid);
  }

  function resolve(kind, picked) {
    const ln = P.scene.lines[P.i];
    const f = ln.f ? fx(ln.f) : null;
    const bubble = document.querySelector('#line-' + P.i + ' .bubble');
    let gain = 0, cls = 'good', head = '', mood = 'idle', tag = '', sound = 'fair';

    if (ln.f) bump(ln.f, kind === 'caught'); else bump('fair', kind === 'fairOk');

    switch (kind) {
      case 'fairOk':
        gain = 3; P.streak++; head = '👍 Fair!'; tag = '👍 Fair'; bubble.classList.add('is-fair'); say(rand(SAY.fair)); break;
      case 'caught':
        P.streak++; gain = 10 + Math.min(P.streak - 1, 4) * 2; S.caught++;
        head = 'Caught it! ' + f.icon + ' ' + f.nick; tag = f.icon + ' ' + f.nick; mood = 'happy'; sound = 'catch';
        bubble.classList.add('is-caught'); say(rand(SAY.catch)); break;
      case 'missed':
        P.streak = 0; P.mistakes++; cls = 'bad'; head = 'Oops! It was ' + f.icon + ' ' + f.nick; tag = f.icon + ' ' + f.nick;
        mood = 'confused'; sound = 'miss'; bubble.classList.add('is-missed'); say(rand(SAY.missed)); break;
      case 'falseAlarm':
        P.streak = 0; P.mistakes++; cls = 'bad'; head = 'That one was fair'; tag = '👍 Fair';
        mood = 'confused'; sound = 'miss'; bubble.classList.add('is-fair'); say(rand(SAY.falseAlarm)); break;
      case 'wrongPick':
        P.streak = 0; P.mistakes++; gain = 2; cls = 'near'; head = 'Close! It was ' + f.icon + ' ' + f.nick; tag = f.icon + ' ' + f.nick;
        mood = 'confused'; sound = 'near'; bubble.classList.add('is-missed'); say(rand(SAY.wrongPick)); break;
    }
    P.best = Math.max(P.best, P.streak);
    P.xp += gain;
    P.results.push({ ln, kind, picked });
    bubble.insertAdjacentHTML('beforeend', `<span class="tag">${tag}</span>`);
    updatePills();
    pip(mood);
    Sound.play(sound);

    const last = P.i === P.scene.lines.length - 1;
    const label = last ? (P.scene.rebuttal ? 'Your turn!' : 'Finish') : 'Next';
    setActions(`
      <div class="feedback ${cls}">
        <div class="head"><span>${head}</span>${gain ? `<span class="xp">+${gain} XP</span>` : ''}</div>
        <div class="body">${ln.why || ''}</div>
      </div>
      <button class="btn btn-wide btn-big" data-act="next">${label}</button>`);
  }

  function endLines() {
    const r = P.scene.rebuttal;
    if (!r || P.rebutted) { finish(); return; }
    P.rebutOpts = shuffle(r.options);
    document.getElementById('dialogue').insertAdjacentHTML('beforeend', `
      <div class="line" id="line-rebut">
        <div class="avatar avatar-emoji" aria-hidden="true">${D.CAST.pip.emoji}</div>
        <div class="bubble"><span class="who">Pip whispers</span><span class="text">${r.prompt}</span></div>
      </div>`);
    say('Your turn! Pick the best reply.');
    setActions(`
      <div class="flex flex-col gap-2" id="rebut">
        ${P.rebutOpts.map((o, i) => `<button class="rebuttal-opt" data-act="rebut" data-a="${i}">${o.text}</button>`).join('')}
      </div>`);
  }

  function rebut(i) {
    if (P.rebutted) return;
    P.rebutted = true;
    const o = P.rebutOpts[i];
    const btns = app.querySelectorAll('.rebuttal-opt');
    btns.forEach((b, j) => { b.disabled = true; if (P.rebutOpts[j].good) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
    let gain = 0;
    if (o.good) { gain = 15; P.xp += 15; pip('happy'); say('That clears the fog!'); Sound.play('catch'); }
    else { P.mistakes++; pip('confused'); say('Hmm. More fog, not less.'); Sound.play('miss'); }
    P.results.push({ ln: { text: o.text, f: null, why: o.why }, kind: o.good ? 'rebutGood' : 'rebutBad' });
    updatePills();
    const a = document.getElementById('actions');
    a.insertAdjacentHTML('beforeend', `
      <div class="feedback ${o.good ? 'good' : 'bad'}">
        <div class="head"><span>${o.good ? 'Well said!' : 'Not that one'}</span>${gain ? `<span class="xp">+${gain} XP</span>` : ''}</div>
        <div class="body">${o.why}</div>
      </div>
      <button class="btn btn-wide btn-big" data-act="next">Finish</button>`);
    requestAnimationFrame(() => a.scrollIntoView({ block: 'end', behavior: 'smooth' }));
  }

  function finish() {
    const sc = P.scene;
    const flawless = P.mistakes === 0;
    const boldWin = P.bold && flawless;
    const total = boldWin ? P.xp * 2 : P.xp;
    const got = flawless ? 3 : (P.mistakes === 1 ? 2 : 1);
    const before = stage();
    S.xp += total;
    S.best = Math.max(S.best, P.best);
    if (sc.patrol) S.patrols++;
    else { if (!S.stars[sc.id]) S.cleared++; S.stars[sc.id] = Math.max(starsOf(sc.id), got); }
    save();
    setFog();
    show(renderResult, { sc, total, got, boldWin, flawless, results: P.results, best: P.best, mistakes: P.mistakes });
    if (stage() > before) showGrow(stage());
  }

  function renderResult(r) {
    const sc = r.sc;
    const fallacies = sc.lines.filter(l => l.f).length;
    const caught = r.results.filter(x => x.kind === 'caught').length;
    const misses = r.results.filter(x => ['missed', 'falseAlarm', 'wrongPick', 'rebutBad'].includes(x.kind));
    const c = sc.patrol ? null : chapter(sc.chapter);
    const chapterNowDone = c && chapterDone(c.n);
    const nextCh = c && chapterNowDone && c.n < LAST ? c.n + 1 : null;
    const finale = c && c.n === LAST && sc.boss && chapterNowDone && !S.ending;

    const review = misses.map(m => {
      const f = m.ln.f ? fx(m.ln.f) : null;
      let why;
      if (m.kind === 'missed') why = 'It was ' + f.nick + '.';
      else if (m.kind === 'falseAlarm') why = 'That one was fair.';
      else if (m.kind === 'wrongPick') why = 'It was ' + f.nick + '.';
      else why = m.ln.why;
      return `<div class="item">${f ? `<img src="${f.img}" alt="">` : '<span class="ok">👍</span>'}<div><q>${m.ln.text}</q><div class="r">${why}</div></div></div>`;
    }).join('');

    app.innerHTML = `
      <section class="screen">
        <div class="text-center">
          <p class="eyebrow">${sc.patrol ? 'Fog Patrol' : sc.title}</p>
          <h2>${r.flawless ? 'Fog cleared!' : r.mistakes === 1 ? 'Nearly!' : 'Done!'}</h2>
        </div>
        ${sc.patrol ? '' : `<div class="result-stars">${'<b>★</b>'.repeat(r.got)}${'★'.repeat(3 - r.got)}</div>`}
        <div class="pip-panel">
          <div class="pip-box">${Dragon.svg(stage(), r.flawless ? 'happy' : 'idle')}</div>
          <div class="pip-say">${r.flawless ? rand(SAY.result) : 'Look at the ones we missed.'}</div>
        </div>
        <div class="statgrid">
          <div class="stat"><div class="v">+${r.total}</div><div class="l">XP${r.boldWin ? ' ×2' : ''}</div></div>
          <div class="stat"><div class="v">${caught}/${fallacies}</div><div class="l">tricks</div></div>
          <div class="stat"><div class="v">${r.best}</div><div class="l">streak</div></div>
        </div>
        ${misses.length ? `<div class="flex flex-col gap-2"><p class="eyebrow">Look again</p><div class="review">${review}</div></div>` : ''}
        <div class="flex flex-col gap-2">
          ${finale ? `<button class="btn btn-wide btn-big" data-act="ending">What happens next?</button>` : ''}
          ${nextCh && !finale ? `<button class="btn btn-wide btn-big" data-act="chapter" data-a="${nextCh}">Chapter ${nextCh}</button>` : ''}
          <button class="btn ${finale || nextCh ? 'btn-ghost' : ''} btn-wide" data-act="scene" data-a="${sc.id}">${sc.patrol ? 'Patrol again' : 'Play again'}</button>
          <button class="btn btn-ghost btn-wide" data-act="${sc.patrol ? 'map' : 'chapter'}" ${sc.patrol ? '' : `data-a="${c.n}"`}>${sc.patrol ? 'Map' : 'Back'}</button>
        </div>
      </section>`;
  }

  function showGrow(st) {
    const s = STAGES[st];
    document.body.insertAdjacentHTML('beforeend', `
      <div class="overlay" id="overlay">
        <div class="box">
          <div class="pip-big">
            <i class="spark"></i><i class="spark"></i><i class="spark"></i><i class="spark"></i><i class="spark"></i>
            ${Dragon.svg(st, 'grow')}
          </div>
          <p class="eyebrow">Pip grew!</p>
          <h2>${s.name}</h2>
          <p class="lede">${s.blurb}</p>
          <button class="btn btn-big" data-act="closeOverlay">Yay!</button>
        </div>
      </div>`);
    Sound.play('grow');
  }

  /* ---------------- guide ---------------- */
  function renderGuide(openId) {
    if (openId) {
      const f = fx(openId), a = accuracy(openId);
      app.innerHTML = `
        <section class="screen">
          <div class="flex items-center justify-between gap-2">
            <p class="eyebrow">Trick book</p>
            <button class="btn btn-ghost btn-sm" data-act="guide">All tricks</button>
          </div>
          <div class="paper flex flex-col gap-4">
            <img class="trick-img" src="${f.img}" alt="">
            <div class="text-center">
              <h2>${f.icon} ${f.nick}</h2>
              <p class="text-lg font-bold mt-1">${f.one}</p>
            </div>
            <div class="hint"><span class="eyebrow">Ask</span><p>${f.spot}</p></div>
            <div class="flex flex-col gap-3">
              ${f.examples.map(e => `
                <div class="line">${avatar(e.who)}<div class="bubble"><span class="who">${D.CAST[e.who].name}</span><span class="text">${e.text}</span><span class="why">${e.why}</span></div></div>`).join('')}
            </div>
            ${a === null ? '' : `<p class="text-center muted">You caught it ${pct(a)} of the time.</p>`}
          </div>
        </section>`;
      return;
    }
    const items = D.FALLACIES.map(f => {
      const known = !!S.lessons[f.id], a = accuracy(f.id);
      return `
        <button class="guide-card" data-act="guideOpen" data-a="${f.id}" ${known ? '' : 'disabled'}>
          <img src="${f.img}" alt="">
          <span class="nm">${known ? f.icon + ' ' + f.nick : '❔ Not yet'}</span>
          ${known && a !== null ? `<span class="pill ${a >= 0.8 ? 'pill-fair' : a >= 0.5 ? 'pill-lantern' : 'pill-fog'}">${pct(a)}</span>` : ''}
        </button>`;
    }).join('');
    app.innerHTML = `
      <section class="screen">
        ${topbar()}
        <div><p class="eyebrow">Trick book</p><h2>${learned().length} of ${D.FALLACIES.length} tricks</h2></div>
        <div class="guide-grid">${items}</div>
        <button class="btn btn-ghost" data-act="map">Map</button>
      </section>`;
  }

  /* ---------------- den ---------------- */
  function renderDen() {
    const st = stage(), s = STAGES[st];
    const next = STAGES[st + 1];
    const totalStars = Object.values(S.stars).reduce((a, b) => a + b, 0);
    const ladder = STAGES.map((g, i) => `
      <div class="rung ${i === st ? 'now' : i > st ? 'locked' : ''}">
        <span>${i < st ? '✓' : i === st ? '🐉' : '·'}</span>
        <span class="font-display font-bold">${g.name}</span>
        <span class="xp">${g.xp} XP</span>
      </div>`).join('');
    app.innerHTML = `
      <section class="screen">
        <div class="flex items-center justify-between gap-2">
          <p class="eyebrow">Pip's den</p>
          <button class="btn btn-ghost btn-sm" data-act="map">Map</button>
        </div>
        <div class="den-pip">${Dragon.svg(st, 'idle')}</div>
        <div class="text-center">
          <h2>Pip the ${s.name}</h2>
          <p class="muted">${s.blurb}</p>
        </div>
        <div class="card flex flex-col gap-2">
          <div class="flex justify-between text-sm"><span>${S.xp} XP</span><span class="muted">${next ? next.xp - S.xp + ' to ' + next.name : 'All grown up'}</span></div>
          <div class="xpbar"><i style="width:${xpPct()}%"></i></div>
        </div>
        <div class="statgrid">
          <div class="stat"><div class="v">${S.caught}</div><div class="l">tricks caught</div></div>
          <div class="stat"><div class="v">${S.best}</div><div class="l">best streak</div></div>
          <div class="stat"><div class="v">${totalStars}</div><div class="l">stars</div></div>
        </div>
        <div class="ladder">${ladder}</div>
      </section>`;
  }

  /* ---------------- ending ---------------- */
  function renderEnding() {
    renderStory('The end', 'The fog lifts', chapter(LAST).img, D.ENDING, 'happy', () => {
      S.ending = true; save(); show(renderMap);
    }, 'Back to the forest');
  }

  /* ---------------- actions ---------------- */
  const ACTS = {
    start() {
      const inp = document.getElementById('name-input');
      const name = (inp && inp.value.trim()) || 'Detective';
      S = Object.assign({}, DEFAULT, { name, lessons: {}, stars: {}, stats: {}, intros: {} });
      save(); Sound.play('grow');
      show(renderChapter, 1);
    },
    reset() {
      if (!window.confirm('Start again? Pip goes back to the egg.')) return;
      S = Object.assign({}, DEFAULT, { lessons: {}, stars: {}, stats: {}, intros: {} });
      save(); show(renderTitle);
    },
    title() { show(renderTitle); },
    map() { show(renderMap); },
    continue() { const f = onContinue; onContinue = null; if (f) f(); },
    chapter(n) { show(renderChapter, Number(n)); },
    chapterOf(fid) { const c = D.CHAPTERS.find(x => x.unlocks.includes(fid)); show(renderChapter, c.n); },
    lesson(fid) { show(renderLesson, fid); },
    quiz(i) { quiz(Number(i)); },
    scene(id) { startScene(id); },
    patrol() { startScene('patrol'); },
    judge(call) { judge(call); },
    pick(fid) { pick(fid); },
    next() { nextLine(); },
    rebut(i) { rebut(Number(i)); },
    quit() {
      if (P && P.i < P.scene.lines.length && !window.confirm('Leave this scene?')) return;
      if (P && P.scene.patrol) show(renderMap); else if (P) show(renderChapter, P.scene.chapter); else show(renderMap);
    },
    ending() { show(renderEnding); },
    guide() { show(renderGuide); },
    guideOpen(id) { show(renderGuide, id); },
    den() { show(renderDen); },
    bold() { S.bold = !S.bold; save(); rerender(); },
    sound() { S.sound = !S.sound; save(); rerender(); if (S.sound) Sound.play('tap'); },
    closeOverlay() { const o = document.getElementById('overlay'); if (o) o.remove(); }
  };

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const fn = ACTS[b.dataset.act];
    if (fn) fn(b.dataset.a);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target && e.target.id === 'name-input') ACTS.start();
  });

  setFog();
  show(renderTitle);
})();
