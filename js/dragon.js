/* Pip the dragon. One SVG, six growth stages, four moods.
   Stage changes the geometry (wings, horns, accessories); mood is a CSS class
   that swaps eyes/mouth and triggers a one-shot animation. */

window.Dragon = (function () {

  const STAGES = [
    { xp: 0,    name: 'Hatchling', blurb: 'Just hatched. Still wearing shell.' },
    { xp: 60,   name: 'Sprout',    blurb: 'Shell gone. Tiny wings!' },
    { xp: 150,  name: 'Scout',     blurb: 'A red scarf. Ready to patrol.' },
    { xp: 260,  name: 'Guardian',  blurb: 'Big wings and tail spikes.' },
    { xp: 380,  name: 'Sage',      blurb: 'Reading glasses. So clever.' },
    { xp: 520,  name: 'Legend',    blurb: 'A crown of leaves. The fog is scared of Pip.' }
  ];

  const SCALE = [0.74, 0.82, 0.9, 0.96, 1.0, 1.06];
  const WING  = [0.3, 0.55, 0.8, 1.0, 1.1, 1.2];
  const HORN  = [0.5, 0.65, 0.8, 1.0, 1.1, 1.2];

  const C = {
    body: '#FF7B6B', dark: '#D95A4B', snout: '#FF9A8C', belly: '#BFEBD6',
    ink: '#2A2420', mouth: '#B3463A', mouthIn: '#7A2E27', cheek: '#FFB3A8',
    horn: '#F6B544', shell: '#F4E8CC', shellEdge: '#E7D6B0', scarf: '#E4574F', leaf: '#63C48F'
  };

  function stageOf(xp) {
    let s = 0;
    for (let i = 0; i < STAGES.length; i++) if (xp >= STAGES[i].xp) s = i;
    return s;
  }

  function svg(stage, mood, opts) {
    stage = Math.max(0, Math.min(5, stage | 0));
    mood = mood || 'idle';
    opts = opts || {};
    const k = SCALE[stage], w = WING[stage], h = HORN[stage];
    const label = 'Pip the dragon, ' + STAGES[stage].name;

    const wings = `
      <g class="pip-wings">
        <g transform="translate(76,134) scale(${w}) translate(-76,-134)">
          <path class="pip-flap wl" d="M76,134 C46,98 22,110 30,146 C48,140 62,136 76,138 Z" fill="${C.dark}"/>
        </g>
        <g transform="translate(144,134) scale(${w}) translate(-144,-134)">
          <path class="pip-flap wr" d="M144,134 C174,98 198,110 190,146 C172,140 158,136 144,138 Z" fill="${C.dark}"/>
        </g>
      </g>`;

    const spines = stage >= 3 ? `
      <g fill="${C.horn}">
        <path d="M150,166 L156,156 L161,168 Z"/>
        <path d="M163,174 L170,165 L173,178 Z"/>
        <path d="M172,186 L181,180 L180,192 Z"/>
      </g>` : '';

    const tail = `<path class="pip-tail" d="M140,166 C178,168 190,192 168,200 C158,203 148,194 156,186 C168,188 170,176 140,172 Z" fill="${C.body}"/>`;

    const body = `
      <ellipse cx="110" cy="152" rx="46" ry="40" fill="${C.body}"/>
      <ellipse cx="110" cy="160" rx="30" ry="26" fill="${C.belly}"/>
      <ellipse cx="88" cy="190" rx="15" ry="8" fill="${C.dark}"/>
      <ellipse cx="132" cy="190" rx="15" ry="8" fill="${C.dark}"/>`;

    const scarf = stage >= 2 ? `
      <g class="pip-scarf">
        <path d="M78,116 Q110,134 142,116 L142,128 Q110,148 78,128 Z" fill="${C.scarf}"/>
        <path d="M134,124 L150,152 L138,155 L126,130 Z" fill="${C.scarf}"/>
      </g>` : '';

    const horns = `
      <g transform="translate(110,52) scale(${h}) translate(-110,-52)" fill="${C.horn}">
        <path d="M84,54 L74,28 L96,44 Z"/>
        <path d="M136,54 L146,28 L124,44 Z"/>
      </g>`;

    const shell = stage === 0 ? `
      <g transform="rotate(-8 110 52)">
        <path d="M74,60 Q110,18 146,60 L138,50 L130,62 L122,50 L114,62 L106,50 L98,62 L90,50 L82,62 Z" fill="${C.shell}" stroke="${C.shellEdge}" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="96" cy="44" r="3" fill="${C.shellEdge}"/>
        <circle cx="118" cy="38" r="2.2" fill="${C.shellEdge}"/>
      </g>` : '';

    const eyes = `
      <g class="pip-eyes">
        <g class="pip-eye">
          <ellipse cx="94" cy="76" rx="9" ry="11" fill="#fff"/>
          <circle cx="96" cy="78" r="5" fill="${C.ink}"/>
          <circle cx="98" cy="74" r="1.8" fill="#fff"/>
        </g>
        <g class="pip-eye">
          <ellipse cx="126" cy="76" rx="9" ry="11" fill="#fff"/>
          <circle cx="128" cy="78" r="5" fill="${C.ink}"/>
          <circle cx="130" cy="74" r="1.8" fill="#fff"/>
        </g>
        <path class="pip-eye-happy" d="M86,78 Q94,66 102,78" stroke="${C.ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path class="pip-eye-happy" d="M118,78 Q126,66 134,78" stroke="${C.ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      </g>`;

    const glasses = stage >= 4 ? `
      <g fill="none" stroke="${C.ink}" stroke-width="2.4">
        <circle cx="94" cy="77" r="13"/>
        <circle cx="126" cy="77" r="13"/>
        <path d="M107,77 L113,77"/>
        <path d="M81,74 L70,70"/>
        <path d="M139,74 L150,70"/>
      </g>` : '';

    const crown = stage >= 5 ? `
      <g fill="${C.leaf}">
        <ellipse cx="80" cy="46" rx="10" ry="5" transform="rotate(-40 80 46)"/>
        <ellipse cx="96" cy="36" rx="10" ry="5" transform="rotate(-20 96 36)"/>
        <ellipse cx="110" cy="32" rx="10" ry="5"/>
        <ellipse cx="124" cy="36" rx="10" ry="5" transform="rotate(20 124 36)"/>
        <ellipse cx="140" cy="46" rx="10" ry="5" transform="rotate(40 140 46)"/>
        <circle cx="110" cy="32" r="3" fill="${C.horn}"/>
      </g>` : '';

    const mouths = `
      <path class="pip-mouth m-idle" d="M100,104 Q110,111 120,104" stroke="${C.mouth}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path class="pip-mouth m-happy" d="M96,102 Q110,120 124,102 Z" fill="${C.mouthIn}"/>
      <path class="pip-mouth m-confused" d="M100,107 Q105,102 110,107 Q115,112 120,107" stroke="${C.mouth}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;

    const head = `
      <g class="pip-head">
        ${horns}
        <circle cx="110" cy="80" r="42" fill="${C.body}"/>
        <ellipse cx="110" cy="97" rx="22" ry="14" fill="${C.snout}"/>
        <circle cx="103" cy="95" r="2" fill="${C.mouth}"/>
        <circle cx="117" cy="95" r="2" fill="${C.mouth}"/>
        <circle cx="78" cy="92" r="6" fill="${C.cheek}" opacity=".85"/>
        <circle cx="142" cy="92" r="6" fill="${C.cheek}" opacity=".85"/>
        ${eyes}
        ${mouths}
        ${glasses}
        ${shell}
        ${crown}
      </g>`;

    const glow = stage >= 5 ? `<circle cx="110" cy="120" r="96" fill="${C.horn}" opacity=".08"/>` : '';

    return `<svg viewBox="0 0 220 220" class="pip st${stage} mood-${mood}${opts.cls ? ' ' + opts.cls : ''}" role="img" aria-label="${label}">
      ${glow}
      <g class="pip-bob">
        <g transform="translate(110,124) scale(${k}) translate(-110,-124)">
          ${wings}
          ${tail}
          ${spines}
          ${body}
          ${scarf}
          ${head}
        </g>
      </g>
    </svg>`;
  }

  /* Swap the mood class on an existing Pip and fall back to idle afterwards. */
  function react(container, mood, ms) {
    const el = container && container.querySelector('.pip');
    if (!el) return;
    el.classList.remove('mood-idle', 'mood-happy', 'mood-confused', 'mood-grow');
    void el.getBoundingClientRect(); // restart animations
    el.classList.add('mood-' + mood);
    clearTimeout(el._moodTimer);
    if (mood !== 'idle') {
      el._moodTimer = setTimeout(() => {
        el.classList.remove('mood-' + mood);
        el.classList.add('mood-idle');
      }, ms || 1600);
    }
  }

  return { STAGES, stageOf, svg, react };
})();
