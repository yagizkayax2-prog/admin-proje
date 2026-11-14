/* Saha Kenarı — üretilen görseller (arma, oyuncu portresi, ikonlar) ve ses efektleri */
(function () {
  let uid = 0;
  const SHAPES = [
    'M50 4 92 16V52c0 24-18 38-42 44C26 90 8 76 8 52V16z',
    'M50 5a45 45 0 1 0 .01 0z',
    'M50 4 90 26V74L50 96 10 74V26z'
  ];
  const STAR = 'M50 33l5 10.200 11.300 1.600-8.200 8 1.900 11.200L50 58.700 39.900 64l1.900-11.200-8.200-8 11.300-1.600z';
  FM.crest = function (t, size) {
    const [sh, pat, em] = t.crest, id = 'cr' + (uid++);
    const p = [
      `<rect x="18" width="13" height="100" fill="${t.c2}"/><rect x="43.500" width="13" height="100" fill="${t.c2}"/><rect x="69" width="13" height="100" fill="${t.c2}"/>`,
      `<polygon points="0,100 100,0 100,100" fill="${t.c2}"/>`,
      `<rect y="24" width="100" height="14" fill="${t.c2}"/><rect y="62" width="100" height="14" fill="${t.c2}"/>`,
      `<path d="M0 30 50 60 100 30V52L50 82 0 52z" fill="${t.c2}"/>`
    ][pat];
    const e = em === 0
      ? `<path d="${STAR}" fill="#ffc93c"/>`
      : `<text x="50" y="58" text-anchor="middle" font-family="'Barlow Condensed',Impact,sans-serif" font-weight="800" font-size="26" fill="#f3efe4">${t.short[0]}</text>`;
    return `<svg class="crest" width="${size || 40}" height="${size || 40}" viewBox="0 0 100 100" role="img" aria-label="${t.name} arması"><defs><clipPath id="${id}"><path d="${SHAPES[sh]}"/></clipPath></defs>` +
      `<g clip-path="url(#${id})"><rect width="100" height="100" fill="${t.c1}"/>${p}</g>` +
      `<circle cx="50" cy="49" r="19" fill="#14202f" stroke="${t.c2}" stroke-width="2.500"/>${e}` +
      `<path d="${SHAPES[sh]}" fill="none" stroke="#0a1322" stroke-width="5" stroke-linejoin="round"/></svg>`;
  };

  const SKIN = ['#f6d1b0', '#e9b98f', '#d39b6c', '#a8734a', '#7a4f30'];
  const HAIR = ['#1b1b1b', '#3b2a1a', '#6b4423', '#b08a4a', '#8a8a8a'];
  FM.LOOK = { SKIN, HAIR };
  FM.avatar = function (p, size) {
    const t = p.tid != null ? FM.T(p.tid) : { c1: '#52627a', c2: '#c9d3e0' };
    const sk = SKIN[p.look[0]], hc = HAIR[p.look[1]];
    const hair = [
      `<path d="M19 27c0-12 6-17 13-17s13 5 13 17c-3-6-6-8-13-8s-10 2-13 8z" fill="${hc}"/>`,
      `<path d="M19 28c-1-13 5-18 13-18 9 0 14 6 13 18-2-5-4-8-8-9-6 4-13 3-18 9z" fill="${hc}"/>`,
      `<path d="M20 24c1-9 6-13 12-13s11 4 12 13c-4-5-7-6-12-6s-8 1-12 6z" fill="${hc}" opacity=".55"/>`,
      `<g fill="${hc}"><circle cx="22" cy="20" r="5"/><circle cx="29" cy="14" r="6"/><circle cx="37" cy="14" r="6"/><circle cx="43" cy="21" r="5"/><circle cx="32" cy="17" r="6"/></g>`
    ][p.look[2]];
    return `<svg class="avatar" width="${size || 44}" height="${size || 44}" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="32" fill="#1d3250"/>` +
      `<path d="M8 64c0-13 10-19 24-19s24 6 24 19z" fill="${t.c1}"/><path d="M25 45l7 8 7-8-3-2h-8z" fill="${t.c2}"/>` +
      `<rect x="27" y="36" width="10" height="10" rx="4" fill="${sk}"/><ellipse cx="32" cy="27" rx="12" ry="14" fill="${sk}"/>${hair}` +
      `<circle cx="27" cy="28" r="1.600" fill="#14202f"/><circle cx="37" cy="28" r="1.600" fill="#14202f"/><path d="M28 35q4 3 8 0" stroke="#14202f" stroke-width="1.500" fill="none" stroke-linecap="round"/></svg>`;
  };

  const IC = {
    home: '<path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    squad: '<circle cx="9" cy="8" r="3.500"/><path d="M2 20c0-4 3-6.500 7-6.500s7 2.500 7 6.500M16 5a3.500 3.500 0 0 1 0 7M18 13.500c2.500.700 4 2.800 4 6.500"/>',
    tactics: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><circle cx="12" cy="12" r="3"/>',
    fixtures: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    table: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    transfer: '<path d="M4 8h14l-4-4M20 16H6l4 4"/>',
    training: '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>',
    club: '<path d="M4 21V8l8-5 8 5v13M9 21v-6h6v6M2 21h20"/>',
    sound: '<path d="M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M18.500 6.500a8 8 0 0 1 0 11"/>',
    mute: '<path d="M4 9h4l5-4v14l-5-4H4zM17 9l5 6M22 9l-5 6"/>',
    play: '<path d="M7 4v16l13-8z" fill="currentColor"/>',
    pause: '<path d="M7 4v16M17 4v16"/>',
    swap: '<path d="M7 4v16l-4-4M17 20V4l4 4"/>',
    skip: '<path d="M4 5l9 7-9 7zM13 5l9 7-9 7z" fill="currentColor"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    cam: '<rect x="3" y="7" width="12" height="10" rx="2"/><path d="M15 11l6-3v8l-6-3z"/>',
    youth: '<path d="M12 3l9 5-9 5-9-5zM6 11v5c2 2 10 2 12 0v-5"/>',
    stats: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    social: '<path d="M4 5h16v11H9l-5 4z"/>',
    euro: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM5 5h3M16 5h3M12 13v4M8 20h8"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    inbox: '<path d="M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5"/>',
    career: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM5 5h3M16 5h3M12 13v4M8 20h8"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    press: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M8 6V4h8v2"/>',
    staff: '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7.500 18c.700-2.300 2.300-3.500 4.500-3.500s3.800 1.200 4.500 3.500"/>',
    med: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>',
    scout: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.500-4.500"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.500 3 14.500 0 18M12 3c-3 3.500-3 14.500 0 18"/>',
    world: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    team: '<circle cx="9" cy="8" r="3.500"/><path d="M2 20c0-4 3-6.500 7-6.500s7 2.500 7 6.500M16 5a3.500 3.500 0 0 1 0 7M18 13.500c2.500.700 4 2.800 4 6.500"/>'
  };
  FM.tacSegs = (tac, attr) => Object.keys(FM.TAC).map(k => `<div class="tac-row" title="${FM.TAC[k][2]}"><span>${FM.TAC[k][0]}</span><div class="seg">${FM.TAC[k][1].map((n, i) => `<button ${attr}="tac" data-k="${k}" data-v="${i}" class="${tac[k] === i ? 'on' : ''}">${n}</button>`).join('')}</div></div>`).join('');
  /* ---------- Tribün pankartları: ortada taraftar grubu, yanlarda kulüp pankartları ---------- */
  const lumHex = h => { const n = parseInt(h.slice(1), 16); return (n >> 16) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114; };
  FM.fansOf = t => (t && (t.fans || ((FM.TEAMS.concat(FM.FOREIGN || [])).find(x => x.name === t.name) || {}).fans || (t.short ? t.short + ' Ultras' : ''))) || '';
  FM.bannerTexts = t => { const H = t.name.split(' ')[0].toLocaleUpperCase('tr'); return [H, H + ' SEVDALILARI', FM.fansOf(t).toLocaleUpperCase('tr'), 'ÖLÜMÜNE ' + H, 'İYİ Kİ VARSIN ' + H]; };
  /* g: 2D bağlam; (x, y, w, h) şerit; items: metinler; center: ortadaki büyük pankartın sırası; flip: 180° çevir */
  FM.paintBanners = function (g, x, y, w, h, team, items, center, flip) {
    const dk = lumHex(team.c1) <= lumHex(team.c2) ? team.c1 : team.c2, lt = dk === team.c1 ? team.c2 : team.c1;
    const ws = items.map((_, i) => (i === center ? 1.45 : 1)), tot = ws.reduce((a, b) => a + b, 0), gap = Math.max(2, w * .012), avail = w - gap * (items.length + 1);
    g.save();
    if (flip) { g.translate(x + w / 2, y + h / 2); g.rotate(Math.PI); g.translate(-(x + w / 2), -(y + h / 2)); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    let cx = x + gap;
    items.forEach((txt, i) => {
      const bw = avail * ws[i] / tot, big = i === center, bh = big ? h : h * .7, by = y + h - bh;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(cx + 1.5, by + 2, bw, bh);
      if (big) {
        g.fillStyle = team.c1; g.fillRect(cx, by, bw, bh);
        g.fillStyle = team.c2; g.fillRect(cx, by, bw, bh * .12); g.fillRect(cx, by + bh * .88, bw, bh * .12);
        g.strokeStyle = '#f3efe4'; g.lineWidth = Math.max(1, bh * .04); g.strokeRect(cx + bh * .06, by + bh * .17, bw - bh * .12, bh * .66);
        g.fillStyle = Math.abs(lumHex(team.c1) - lumHex(team.c2)) > 70 ? team.c2 : (lumHex(team.c1) > 150 ? '#14202f' : '#ffffff');
        g.font = `800 ${Math.round(bh * .42)}px 'Barlow Condensed', Impact, sans-serif`;
      } else {
        g.fillStyle = '#ece6d8'; g.fillRect(cx, by, bw, bh);
        g.fillStyle = team.c1; g.fillRect(cx, by, bw, bh * .1); g.fillRect(cx, by + bh * .9, bw, bh * .1);
        g.fillStyle = lumHex(dk) < 150 ? dk : '#7a1f1f';
        g.font = `800 ${Math.round(bh * .46)}px 'Barlow Condensed', Impact, sans-serif`;
      }
      g.fillText(txt, cx + bw / 2, by + bh * .52, bw * .9);
      cx += bw + gap;
    });
    g.restore();
  };
  FM.icon = n => `<svg class="ic" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ''}</svg>`;

  /* ---------- Ses (WebAudio ile sentezlenir, dosya gerekmez) ---------- */
  FM.Audio = (function () {
    let ctx = null, master = null, crowdG = null, muted = false, vol = .7;
    try { muted = localStorage.getItem('saha-kenari-mute') === '1'; } catch (e) { /* yok say */ }
    function init() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain(); master.gain.value = muted ? 0 : vol; master.connect(ctx.destination);
      } catch (e) { ctx = null; }
    }
    function noise(sec) {
      const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const s = ctx.createBufferSource(); s.buffer = b; return s;
    }
    function crowd(on) {
      if (!ctx) return;
      if (on && !crowdG) {
        const s = noise(3); s.loop = true;
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = .5;
        crowdG = ctx.createGain(); crowdG.gain.value = .05; crowdG.src = s;
        s.connect(f); f.connect(crowdG); crowdG.connect(master); s.start();
      } else if (!on && crowdG) { try { crowdG.src.stop(); } catch (e) { /* zaten durmuş */ } crowdG.disconnect(); crowdG = null; }
    }
    function burst(freq, peak, dur, type) {
      if (!ctx) return;
      const s = noise(dur), f = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime;
      f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = .7;
      g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(peak, t + dur * .15); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      s.connect(f); f.connect(g); g.connect(master); s.start(); s.stop(t + dur);
    }
    function whistle(n) {
      if (!ctx) return;
      for (let k = 0; k < n; k++) {
        const t = ctx.currentTime + k * .32, len = k === n - 1 ? .5 : .2;
        const o = ctx.createOscillator(), l = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain();
        o.type = 'square'; o.frequency.value = 2250; l.frequency.value = 34; lg.gain.value = 140;
        l.connect(lg); lg.connect(o.frequency);
        g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(.09, t + .02); g.gain.setValueAtTime(.09, t + len - .05); g.gain.exponentialRampToValueAtTime(0.001, t + len);
        o.connect(g); g.connect(master); o.start(t); l.start(t); o.stop(t + len); l.stop(t + len);
      }
    }
    function kick() {
      if (!ctx) return;
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + .09);
      g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + .11);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + .12);
    }
    function anthem() {
      if (!ctx) return;
      const notes = [523, 659, 784, 1047, 784, 880, 1047, 1319, 1175, 1047], t0 = ctx.currentTime + .3;
      notes.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), t = t0 + i * .42, len = i === notes.length - 1 ? 1.1 : .4;
        o.type = 'triangle'; o.frequency.value = f / 2;
        g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(.16, t + .04); g.gain.exponentialRampToValueAtTime(0.001, t + len);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + len + .05);
        if (i % 2 === 0) setTimeout(kick, (t - ctx.currentTime) * 1000);
      });
      burst(800, .2, 5);
    }
    /* tezahürat: el çırpma ritmi ve kalabalık sesi; ritim ve ezgi kulübe göre değişir */
    function clap(t, g) {
      const s = noise(.09), f = ctx.createBiquadFilter(), gn = ctx.createGain();
      f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 1.1;
      gn.gain.setValueAtTime(0.001, t); gn.gain.exponentialRampToValueAtTime(g, t + .006); gn.gain.exponentialRampToValueAtTime(0.001, t + .085);
      s.connect(f); f.connect(gn); gn.connect(master); s.start(t); s.stop(t + .1);
    }
    function voice(t, freq, len, g) {
      const out = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 760; f.Q.value = 1.4;
      out.gain.setValueAtTime(0.001, t); out.gain.exponentialRampToValueAtTime(g, t + .05); out.gain.setValueAtTime(g, t + len * .7); out.gain.exponentialRampToValueAtTime(0.001, t + len);
      f.connect(out); out.connect(master);
      for (const dt of [-22, -8, 6, 19]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq; o.detune.value = dt; o.connect(f); o.start(t); o.stop(t + len + .05); }
    }
    const RHY = [[0, .5, 1, 1.5, 1.75, 2.25, 2.5], [0, .25, .5, 1, 1.5, 1.75, 2], [0, .5, .75, 1.25, 1.5, 2, 2.5], [0, .33, .66, 1, 1.5, 2], [0, .5, 1, 1.25, 1.5, 2, 2.75],
      [0, .75, 1, 1.75, 2, 2.75], [0, .5, 1, 2, 2.5, 3], [0, .25, .5, .75, 1.5, 2.25], [0, 1, 1.5, 2, 2.25, 2.5, 2.75]];
    const MEL = [[0, 0, 2, 4, 2, 0, -1, 0], [0, 2, 4, 4, 2, 0], [4, 4, 2, 0, 2, 4], [0, -3, 0, 2, 4, 2, 0], [7, 4, 4, 2, 0, 2],
      [0, 0, 0, 5, 4, 2, 0], [2, 4, 5, 4, 2, 0, 2], [0, 4, 7, 4, 0], [5, 5, 4, 2, 4, 0]];
    /* davul: tribündeki büyük davul, alçak frekanslı darbe */
    function drum(t, g) {
      const o = ctx.createOscillator(), gn = ctx.createGain();
      o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(48, t + .16);
      gn.gain.setValueAtTime(0.001, t); gn.gain.exponentialRampToValueAtTime(g, t + .008); gn.gain.exponentialRampToValueAtTime(0.001, t + .3);
      o.connect(gn); gn.connect(master); o.start(t); o.stop(t + .32);
    }
    function chant(seed, derby) {
      if (!ctx || muted) return;
      seed = Math.abs(seed | 0) + 3;
      const r = RHY[seed % RHY.length], ml = MEL[Math.floor(seed / 2) % MEL.length], base = 185 * Math.pow(2, (seed * 7 % 6) / 12), beat = derby ? .34 : .4, t0 = ctx.currentTime + .1, reps = derby ? 3 : 2, bar = beat * 3.2;
      for (let k = 0; k < reps; k++) {
        const tk = t0 + k * bar;
        r.forEach((b, j) => { clap(tk + b * beat, derby ? .45 : .3); if (j % 2 === 0 || derby) drum(tk + b * beat, derby ? .5 : .32); });
        ml.forEach((n, i) => voice(tk + i * bar / ml.length, base * Math.pow(2, n / 12), bar / ml.length * .92, derby ? .05 : .034));
      }
    }
    return {
      boo() { burst(260, .32, 2.2, 'lowpass'); for (let i = 0; i < 4; i++) setTimeout(() => { if (!ctx) return; const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime; o.type = 'sine'; o.frequency.setValueAtTime(2600 + Math.random() * 600, t); g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(.04, t + .05); g.gain.exponentialRampToValueAtTime(0.001, t + .5); o.connect(g); g.connect(master); o.start(t); o.stop(t + .52); }, i * 180); },
      init, crowd, whistle, kick, anthem, chant,
      cheer: () => { burst(950, .55, 2.8); burst(1900, .18, 2.2); },
      /* kaçan pozisyonda tribünün "ooo"su: sesli harf formantı yükselip düşer */
      ooh() {
        if (!ctx) return;
        const t = ctx.currentTime, s = noise(1.6), f = ctx.createBiquadFilter(), g = ctx.createGain();
        f.type = 'bandpass'; f.Q.value = 2.2; f.frequency.setValueAtTime(330, t); f.frequency.linearRampToValueAtTime(560, t + .45); f.frequency.linearRampToValueAtTime(300, t + 1.5);
        g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(.5, t + .25); g.gain.exponentialRampToValueAtTime(0.001, t + 1.55);
        s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + 1.6);
      },
      /* alkış: dağınık el çırpmaları */
      applause(sec) {
        if (!ctx) return;
        const t0 = ctx.currentTime, n = Math.round((sec || 1.8) * 38);
        for (let i = 0; i < n; i++) clap(t0 + Math.random() * (sec || 1.8), .05 + Math.random() * .09);
      },
      /* direk: metalik tını */
      clang() {
        if (!ctx) return;
        const t = ctx.currentTime;
        for (const [f, g] of [[1180, .14], [1730, .08], [2610, .05]]) { const o = ctx.createOscillator(), gn = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; gn.gain.setValueAtTime(g, t); gn.gain.exponentialRampToValueAtTime(0.001, t + .9); o.connect(gn); gn.connect(master); o.start(t); o.stop(t + .95); }
      },
      /* kalabalık uğultusunun şiddeti (0–1): baskı arttıkça yükselir */
      level(x) { if (crowdG && ctx) crowdG.gain.setTargetAtTime(.03 + Math.max(0, Math.min(1, x)) * .09, ctx.currentTime, .6); },
      groan: () => burst(380, .22, 1.1, 'lowpass'),
      get muted() { return muted; },
      toggle() {
        muted = !muted;
        try { localStorage.setItem('saha-kenari-mute', muted ? '1' : '0'); } catch (e) { /* yok say */ }
        if (master) master.gain.value = muted ? 0 : vol;
        return muted;
      },
      setVol(v) { vol = v; if (master) master.gain.value = muted ? 0 : vol; }
    };
  })();
})();
