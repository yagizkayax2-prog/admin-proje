/* Saha Kenarı — canlı maç ekranı: canvas üzerinde animasyonlu 2D maç, spiker akışı, oyuncu değişikliği */
(function () {
  const { clamp } = FM.util;
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const MIN_DUR = .55;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let S = null;

  function lum(hex) { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114); }
  function cdist(a, b) { const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16); return Math.abs((x >> 16) - (y >> 16)) + Math.abs(((x >> 8) & 255) - ((y >> 8) & 255)) + Math.abs((x & 255) - (y & 255)); }

  const dirRight = s => (s === 0) !== S.second;
  const toPitch = (s, nx, ny) => (dirRight(s) ? { x: nx, y: ny } : { x: 1 - nx, y: 1 - ny });
  const ownX = (s, x) => (dirRight(s) ? x : 1 - x);
  const dot = (s, i) => S.dots[s * 11 + i];
  const active = d => S.m.s[d.s].on[d.i] != null;
  function dotFor(s, pid) {
    const i = S.m.s[s].on.indexOf(pid);
    if (i >= 0) return dot(s, i);
    const alt = S.dots.filter(d => d.s === s && d.i > 0 && active(d));
    return alt[Math.floor(Math.random() * alt.length)] || dot(s, 0);
  }

  function target(d) {
    if (d.ov) return d.ov;
    const sl = S.m.s[d.s].slots[d.i];
    const prog = S.kickT > 0 ? .42 : ownX(d.s, S.ball.x);
    const by = dirRight(d.s) ? S.ball.y : 1 - S.ball.y;
    let nx, ny;
    if (d.i === 0) { nx = .035 + prog * .05; ny = .5 + (by - .5) * .12; }
    else {
      nx = .07 + sl[1] * .5 + prog * .3 - (S.poss !== d.s ? .04 : 0);
      ny = sl[2] + (by - .5) * .16;
      if (S.kickT > 0) nx = Math.min(nx, .47);
      nx += Math.sin(S.t * .9 + d.ph) * .012; ny += Math.cos(S.t * .7 + d.ph * 2) * .016;
    }
    return toPitch(d.s, clamp(nx, .02, .97), clamp(ny, .04, .96));
  }

  /* ---------- Senaryo (top hareketleri) ---------- */
  const mv = (tf, dur, o) => ({ dur, arc: (o && o.arc) || 0, tf, end: o && o.end });
  const wait = (dur, end) => ({ dur, end });
  function run(steps, blocking) { S.script = { steps, i: -1, t: 0, blocking, from: null }; next(); }
  function next() {
    const sc = S.script; if (!sc) return;
    sc.i++; sc.t = 0;
    if (sc.i >= sc.steps.length) { S.script = null; return; }
    sc.from = { x: S.ball.x, y: S.ball.y };
  }
  function tickScript(dt) {
    const sc = S.script; if (!sc) return;
    const st = sc.steps[sc.i];
    sc.t += dt;
    const k = Math.min(1, sc.t / st.dur);
    if (st.tf) {
      const tg = st.tf(), e = ease(k);
      S.ball.x = lerp(sc.from.x, tg.x, e); S.ball.y = lerp(sc.from.y, tg.y, e); S.ball.z = Math.sin(k * Math.PI) * st.arc;
    }
    if (k >= 1) { const cur = S.script; if (st.end) st.end(); if (S.script === cur) next(); }
  }

  function kickoff(s) {
    S.dots.forEach(d => { d.ov = null; });
    S.poss = s; S.kickT = 1.3; S.passT = 1.1;
    S.ball.x = .5; S.ball.y = .5; S.ball.z = 0;
    const f = S.dots.filter(d => d.s === s && active(d) && d.i > 0).pop();
    S.holder = f || dot(s, 0);
  }
  function ambientPass() {
    const h = S.holder; if (!h || !active(h)) { S.holder = S.dots.find(d => d.s === S.poss && active(d) && d.i > 4) || dot(S.poss, 0); return; }
    const s = h.s, share = S.m.st.poss[s] / Math.max(1, S.m.st.poss[0] + S.m.st.poss[1]);
    const mates = S.dots.filter(d => d.s === s && d !== h && active(d));
    if (!mates.length) return;
    const wts = mates.map(d => {
      const dist = Math.hypot(d.x - h.x, (d.y - h.y) * .65);
      const fwd = ownX(s, d.x) - ownX(s, h.x);
      return (d.i === 0 ? .12 : 1) * (1 / (.06 + Math.abs(dist - .16))) * (fwd > 0 ? 1.5 : 1);
    });
    let r = Math.random() * wts.reduce((a, b) => a + b, 0), rec = mates[0];
    for (let i = 0; i < mates.length; i++) { r -= wts[i]; if (r <= 0) { rec = mates[i]; break; } }
    const lost = Math.random() < .1 + .34 * (1 - share);
    if (lost) {
      const opp = S.dots.filter(d => d.s !== s && active(d) && d.i > 0);
      if (opp.length) {
        const thief = opp.reduce((a, b) => (Math.hypot(a.x - rec.x, a.y - rec.y) < Math.hypot(b.x - rec.x, b.y - rec.y) ? a : b));
        run([mv(() => thief, .5, { end: () => { S.holder = thief; S.poss = thief.s; } })], false);
        S.holder = null; return;
      }
    }
    const far = Math.hypot(rec.x - h.x, rec.y - h.y) > .3;
    run([mv(() => rec, far ? .75 : .45, { arc: far ? .5 : 0, end: () => { S.holder = rec; } })], false);
    S.holder = null;
  }

  /* ---------- Olay senaryoları ---------- */
  function playChance(e) {
    const s = e.side, o = 1 - s, A = FM.Audio;
    S.poss = s; S.kickT = 0;
    const sh = dotFor(s, e.pid);
    let as = e.aid != null ? dotFor(s, e.aid) : null;
    if (!as || as === sh) as = S.dots.find(d => d.s === s && d !== sh && d.i > 4 && active(d)) || sh;
    const gk = dot(o, 0);
    const flank = Math.random() < .5 ? .2 : .8, shotY = .34 + Math.random() * .32, side = Math.random() < .5 ? -1 : 1;
    if (as !== sh) as.ov = toPitch(s, .7, flank);
    sh.ov = toPitch(s, .86, shotY);
    const steps = [];
    if (as !== sh) steps.push(mv(() => as, .6, { arc: .3, end: () => { S.holder = as; A.kick(); } }), wait(.3));
    steps.push(mv(() => sh, .5, { end: () => { S.holder = sh; A.kick(); } }), wait(.22, () => { S.holder = null; A.kick(); }));
    const done = (holder, poss) => () => { S.dots.forEach(d => { d.ov = null; }); S.holder = holder; S.poss = poss; S.passT = .8; };
    if (e.out === 'goal') {
      const gp = toPitch(s, 1.022, .5 + side * .035);
      steps.push(mv(() => gp, .3, { arc: .25, end: () => goalFx(e, s, flank) }), wait(2.6, () => kickoff(o)));
    } else if (e.out === 'save') {
      const sp = toPitch(s, .975, .5 + side * .04);
      steps.push(wait(.01, () => { gk.ov = sp; }), mv(() => sp, .34, { arc: .2, end: () => { A.groan(); pop(gk, 'KURTARIŞ', '#58c4dd'); } }), wait(.7, done(gk, o)));
    } else if (e.out === 'post') {
      const pp = toPitch(s, 1, .5 + side * .058), rb = toPitch(s, .86, .5 + side * .25);
      steps.push(mv(() => pp, .3, { arc: .2, end: () => { A.kick(); A.groan(); S.shake = .5; S.shakeSide = dirRight(s) ? 1 : 0; pop(sh, 'DİREK!', '#ffc93c'); } }), mv(() => rb, .45, { arc: .5 }), wait(.3, done(gk, o)));
    } else if (e.out === 'block') {
      const bp = toPitch(s, .93, shotY), cp = toPitch(s, 1.03, flank < .5 ? .04 : .96);
      steps.push(mv(() => bp, .2), mv(() => cp, .5, { arc: .6, end: () => A.groan() }), wait(.5, done(gk, o)));
    } else {
      const mp = toPitch(s, 1.05, .5 + side * (.1 + Math.random() * .08));
      steps.push(mv(() => mp, .38, { arc: .9, end: () => A.groan() }), wait(.6, done(gk, o)));
    }
    run(steps, true);
  }
  function goalFx(e, s, flank) {
    const t = FM.T(S.m.s[s].tid), p = FM.P(e.pid), A = FM.Audio;
    S.disp[s]++; paintScore(s);
    A.cheer();
    S.shake = 1; S.shakeSide = dirRight(s) ? 1 : 0;
    const corner = toPitch(s, .9, flank < .5 ? .1 : .9);
    S.dots.forEach(d => { if (d.s === s && d.i > 0) d.ov = { x: corner.x + (Math.random() - .5) * .07, y: corner.y + (Math.random() - .5) * .1 }; });
    for (let i = 0; i < 90; i++) S.conf.push({ x: corner.x + (Math.random() - .5) * .3, y: -.05 - Math.random() * .4, vx: (Math.random() - .5) * .12, vy: .25 + Math.random() * .35, r: Math.random() * 6.28, c: [t.c1, t.c2, '#ffc93c'][i % 3], life: 3 });
    const b = $('mvBanner');
    b.innerHTML = `<div class="gb-in" style="--k1:${t.c1};--k2:${t.c2}">${FM.crest(t, 46)}<div><strong>GOL!</strong><span>${esc(p.name)} · ${e.min}'</span></div></div>`;
    b.hidden = false; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    clearTimeout(S.bannerT); S.bannerT = setTimeout(() => { b.hidden = true; }, 2400 / S.speed + 300);
  }
  function pop(d, text, color) { S.pops.push({ x: d.x, y: d.y, text, color, t: 0 }); }

  function feed(e, cls) {
    const li = document.createElement('li');
    li.className = 'fd ' + (cls || e.type) + (e.out ? ' ' + e.out : '') + (e.side != null ? (e.side === S.user ? ' mine' : '') : '');
    li.innerHTML = `<b>${e.min}'</b><span>${esc(e.text)}</span>`;
    const f = $('mvFeed'); f.prepend(li);
    while (f.children.length > 40) f.lastChild.remove();
  }
  function handle(e) {
    const A = FM.Audio;
    feed(e);
    if (e.type === 'chance') return playChance(e);
    if (e.type === 'yellow' || e.type === 'red') {
      const pos = S.last[e.pid] || { x: .5, y: .5 };
      S.pops.push({ x: pos.x, y: pos.y, card: e.type === 'red' ? '#ef5350' : '#ffc93c', t: 0 });
      A.whistle(1);
      return run([wait(.9)], true);
    }
    if (e.type === 'inj') { A.whistle(1); return run([wait(.7)], true); }
    if (e.type === 'ht') {
      A.whistle(2); S.paused = true;
      overlay(`<h3>Devre arası</h3>${statsHtml()}<button class="btn primary" data-mv="second">İkinci yarıyı başlat</button>`);
      return;
    }
    if (e.type === 'ft') return fullTime();
  }
  function fullTime() {
    const m = S.m, A = FM.Audio;
    S.disp = m.score.slice(); paintScore();
    A.whistle(3); A.crowd(false);
    S.ended = true; S.paused = true;
    const mine = m.score[S.user], their = m.score[1 - S.user];
    const head = mine > their ? 'Galibiyet!' : mine < their ? 'Mağlubiyet' : 'Beraberlik';
    const goals = m.log.filter(l => l.type === 'goal').map(l => `<li class="${l.side ? 'r' : 'l'}">${esc(FM.P(l.pid) ? FM.P(l.pid).name : '')} ${l.min}'</li>`).join('');
    overlay(`<h3 class="${mine > their ? 'win' : mine < their ? 'loss' : ''}">${head}</h3><p class="ft-score">${m.score[0]} – ${m.score[1]}</p><ul class="ft-goals">${goals}</ul>${statsHtml()}<button class="btn primary" data-mv="done">Devam et</button>`);
  }
  function statsHtml() {
    const st = S.m.st, pt = Math.max(1, st.poss[0] + st.poss[1]), p0 = Math.round(st.poss[0] / pt * 100);
    const row = (l, a, b) => `<div class="st-row"><b>${a}</b><span>${l}</span><b>${b}</b><i style="--w:${a + b ? a / (a + b) * 100 : 50}%"></i></div>`;
    return `<div class="st">${row('Topla oynama %', p0, 100 - p0)}${row('Şut', st.shots[0], st.shots[1])}${row('İsabetli şut', st.target[0], st.target[1])}${row('Korner', st.corners[0], st.corners[1])}${row('Faul', st.fouls[0], st.fouls[1])}${row('Sarı kart', st.yel[0], st.yel[1])}</div>`;
  }
  function overlay(html) { const o = $('mvOverlay'); o.innerHTML = `<div class="ov-card">${html}</div>`; o.hidden = false; }
  function paintScore(s) {
    $('mvH').textContent = S.disp[0]; $('mvA').textContent = S.disp[1];
    if (s != null) { const el = $(s ? 'mvA' : 'mvH'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  }
  function paintUi() {
    $('mvMin').textContent = S.m.min + "'";
    $('mvBar').style.setProperty('--p', S.m.min / 90 * 100 + '%');
    const sub = $('mvSubs'); if (sub) sub.textContent = S.m.s[S.user].subsLeft;
    $('mvStats').innerHTML = statsHtml();
  }

  /* ---------- Oyuncu değişikliği ---------- */
  function subPanel() {
    const side = S.m.s[S.user];
    S.wasPaused = S.paused; S.paused = true; S.sel = { out: null, in: null };
    const row = (id, kind, role) => { const p = FM.P(id); return `<button class="sb-row" data-mv="pick" data-kind="${kind}" data-id="${id}"><span class="pos ${role || p.pos}">${FM.POS_TR[role || p.pos]}</span><span class="nm">${esc(p.name)}</span><span class="ov">${p.ovr}</span><span class="fit"><i style="width:${Math.round(p.fit)}%"></i></span></button>`; };
    const on = side.on.map((id, i) => (id == null ? '' : row(id, 'out', side.slots[i][0]))).join('');
    const bench = side.bench.map(id => row(id, 'in')).join('') || '<p class="muted">Yedek kalmadı.</p>';
    overlay(`<h3>Oyuncu değişikliği <small>(${side.subsLeft} hak)</small></h3><div class="sb"><div><h4>Çıkan</h4>${on}</div><div><h4>Giren</h4>${bench}</div></div><div class="row"><button class="btn" data-mv="subcancel">Vazgeç</button><button class="btn primary" data-mv="subok" id="mvSubOk" disabled>Değiştir</button></div>`);
  }

  /* ---------- Çizim ---------- */
  function resize() {
    const c = S.cv, w = c.parentElement.clientWidth, h = Math.round(w * .62), dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = w * dpr; c.height = h * dpr; c.style.height = h + 'px';
    S.W = w; S.H = h; S.dpr = dpr; S.mx = w * .05; S.my = h * .06;
    const bg = S.bg = document.createElement('canvas'); bg.width = c.width; bg.height = c.height;
    const g = bg.getContext('2d'); g.scale(dpr, dpr);
    g.fillStyle = '#1c6b3c'; g.fillRect(0, 0, w, h);
    const pw = w - 2 * S.mx, ph = h - 2 * S.my;
    for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#2f9e5b' : '#2a9154'; g.fillRect(S.mx + pw * i / 12, S.my, pw / 12 + 1, ph); }
    g.strokeStyle = 'rgba(243,239,228,.85)'; g.lineWidth = Math.max(1.5, w / 420);
    g.strokeRect(S.mx, S.my, pw, ph);
    g.beginPath(); g.moveTo(w / 2, S.my); g.lineTo(w / 2, h - S.my); g.stroke();
    g.beginPath(); g.arc(w / 2, h / 2, ph * .14, 0, 6.29); g.stroke();
    g.beginPath(); g.arc(w / 2, h / 2, 2.5, 0, 6.29); g.fillStyle = '#f3efe4'; g.fill();
    for (const sx of [0, 1]) {
      const x0 = sx ? w - S.mx : S.mx, d = sx ? -1 : 1;
      g.strokeRect(x0, h / 2 - ph * .3, d * pw * .16, ph * .6);
      g.strokeRect(x0, h / 2 - ph * .14, d * pw * .055, ph * .28);
      g.beginPath(); g.arc(x0 + d * pw * .11, h / 2, ph * .12, sx ? Math.PI * .68 : -Math.PI * .32, sx ? Math.PI * 1.32 : Math.PI * .32); g.stroke();
    }
  }
  const px = x => S.mx + x * (S.W - 2 * S.mx);
  const py = y => S.my + y * (S.H - 2 * S.my);
  function draw() {
    const g = S.g, w = S.W, h = S.H;
    g.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    g.drawImage(S.bg, 0, 0, w, h);
    const ph = h - 2 * S.my;
    for (const sx of [0, 1]) {
      const off = S.shake > 0 && S.shakeSide === sx ? Math.sin(S.t * 40) * 4 * S.shake : 0;
      const x0 = sx ? w - S.mx : S.mx, d = sx ? 1 : -1, gw = S.mx * .7 + Math.abs(off), y0 = h / 2 - ph * .06, gh = ph * .12;
      g.fillStyle = 'rgba(10,19,34,.35)'; g.fillRect(x0, y0, d * gw, gh);
      g.strokeStyle = 'rgba(243,239,228,.5)'; g.lineWidth = 1;
      g.beginPath();
      for (let i = 1; i < 4; i++) { g.moveTo(x0 + d * gw * i / 4, y0); g.lineTo(x0 + d * gw * i / 4, y0 + gh); }
      for (let i = 1; i < 5; i++) { g.moveTo(x0, y0 + gh * i / 5); g.lineTo(x0 + d * gw, y0 + gh * i / 5); }
      g.stroke();
      g.strokeStyle = '#f3efe4'; g.lineWidth = 2.5; g.strokeRect(x0, y0, d * gw, gh);
    }
    const r = Math.max(5.5, w * .0145);
    const list = S.dots.filter(active).sort((a, b) => a.y - b.y);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const d of list) {
      const x = px(d.x), y = py(d.y), k = S.kits[d.s], gkp = d.i === 0;
      g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(x, y + r * .8, r * .95, r * .45, 0, 0, 6.29); g.fill();
      g.beginPath(); g.arc(x, y, r, 0, 6.29);
      g.fillStyle = gkp ? k.gk : k.fill; g.fill();
      g.lineWidth = Math.max(1.5, r * .28); g.strokeStyle = gkp ? '#f3efe4' : k.stroke; g.stroke();
      if (d === S.holder) { g.beginPath(); g.arc(x, y, r + 3.5, 0, 6.29); g.strokeStyle = 'rgba(255,201,60,.9)'; g.lineWidth = 1.5; g.stroke(); }
      if (r >= 7) { g.fillStyle = gkp ? '#14202f' : k.text; g.font = `700 ${Math.round(r * 1.05)}px Barlow, sans-serif`; g.fillText(FM.P(S.m.s[d.s].on[d.i]).num, x, y + .5); }
    }
    if (S.holder && active(S.holder)) {
      const p = FM.P(S.m.s[S.holder.s].on[S.holder.i]), x = px(S.holder.x), y = py(S.holder.y) - r - 9;
      g.font = `600 ${Math.max(10, Math.round(w * .017))}px Barlow, sans-serif`;
      const nm = p.name.split(' ').pop(), tw = g.measureText(nm).width + 8;
      g.fillStyle = 'rgba(10,19,34,.75)'; g.fillRect(x - tw / 2, y - 8, tw, 15);
      g.fillStyle = '#f3efe4'; g.fillText(nm, x, y);
    }
    const bx = px(S.ball.x), by = py(S.ball.y), br = r * .52, lift = S.ball.z * h * .09;
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(bx, by + br * .9, br * (1 + S.ball.z * .3), br * .5, 0, 0, 6.29); g.fill();
    g.beginPath(); g.arc(bx, by - lift, br * (1 + S.ball.z * .25), 0, 6.29); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 1.2; g.strokeStyle = '#14202f'; g.stroke();
    g.beginPath(); g.arc(bx + Math.cos(S.t * 9) * br * .35, by - lift + Math.sin(S.t * 9) * br * .35, br * .3, 0, 6.29); g.fillStyle = '#14202f'; g.fill();
    for (const p of S.pops) {
      const x = px(p.x), y = py(p.y) - r - 12 - p.t * 22, a = clamp(1.6 - p.t, 0, 1);
      g.globalAlpha = a;
      if (p.card) { g.fillStyle = p.card; g.strokeStyle = '#14202f'; g.lineWidth = 1.5; g.fillRect(x - 6, y - 16, 12, 17); g.strokeRect(x - 6, y - 16, 12, 17); }
      else { g.font = `800 ${Math.max(12, Math.round(w * .024))}px 'Barlow Condensed', sans-serif`; g.lineWidth = 3; g.strokeStyle = '#0a1322'; g.strokeText(p.text, x, y); g.fillStyle = p.color; g.fillText(p.text, x, y); }
      g.globalAlpha = 1;
    }
    for (const c of S.conf) {
      g.save(); g.translate(px(c.x), py(c.y)); g.rotate(c.r); g.globalAlpha = clamp(c.life, 0, 1);
      g.fillStyle = c.c; g.fillRect(-3, -1.5, 6, 3); g.restore();
    }
  }

  /* ---------- Döngü ---------- */
  function frame(ts) {
    if (!S) return;
    const raw = Math.min(.05, (ts - (S.lastTs || ts)) / 1000); S.lastTs = ts;
    const dt = S.paused ? 0 : raw * S.speed;
    if (dt > 0) {
      S.t += dt;
      if (S.kickT > 0) S.kickT -= dt;
      tickScript(dt);
      if (!S.script) {
        if (S.queue.length) handle(S.queue.shift());
        else if (!S.ended) {
          if (S.holder && active(S.holder)) { S.ball.x = lerp(S.ball.x, S.holder.x + (dirRight(S.holder.s) ? .012 : -.012), Math.min(1, dt * 12)); S.ball.y = lerp(S.ball.y, S.holder.y, Math.min(1, dt * 12)); S.ball.z = 0; }
          S.passT -= dt;
          if (S.passT <= 0) { S.passT = .55 + Math.random() * .7; ambientPass(); }
        }
      } else if (!S.script.blocking && S.queue.length) { S.script = null; handle(S.queue.shift()); }
      if ((!S.script || !S.script.blocking) && !S.queue.length && !S.ended && !S.paused) {
        S.acc += dt;
        if (S.acc >= MIN_DUR) {
          S.acc -= MIN_DUR;
          if (S.m.min === 0) feed({ min: 0, type: 'ko', text: FM.TXT.ko[0] });
          const evs = FM.simMinute(S.m);
          for (const e of evs) { if (e.type === 'sub') feed(e); else S.queue.push(e); }
          paintUi();
        }
      }
      for (const d of S.dots) {
        if (!active(d)) continue;
        const tg = target(d), k = Math.min(1, dt * (d.ov ? 3.4 : 2.6));
        d.x += (tg.x - d.x) * k; d.y += (tg.y - d.y) * k;
        S.last[S.m.s[d.s].on[d.i]] = d;
      }
      if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * .8);
      S.pops = S.pops.filter(p => (p.t += dt) < 1.6);
      S.conf = S.conf.filter(c => { c.x += c.vx * dt; c.y += c.vy * dt; c.r += dt * 6; c.life -= dt; return c.life > 0 && c.y < 1.1; });
    }
    draw();
    S.raf = requestAnimationFrame(frame);
  }

  function skip() {
    const m = S.m;
    S.script = null; S.dots.forEach(d => { d.ov = null; });
    for (const e of S.queue) if (e.type !== 'ft' && e.type !== 'chance') feed(e);
    S.queue = [];
    while (!m.done) for (const e of FM.simMinute(m)) if (e.type !== 'ft' && (e.type !== 'chance' || e.out === 'goal')) feed(e);
    paintUi();
    fullTime();
  }

  function onClick(ev) {
    const b = ev.target.closest('[data-mv]'); if (!b || !S) return;
    const a = b.dataset.mv, side = S.m.s[S.user];
    FM.Audio.init();
    if (a === 'pause') { S.paused = !S.paused; b.innerHTML = FM.icon(S.paused ? 'play' : 'pause'); b.setAttribute('aria-label', S.paused ? 'Devam ettir' : 'Duraklat'); }
    else if (a === 'speed') { S.speed = +b.dataset.v; document.querySelectorAll('[data-mv=speed]').forEach(x => x.classList.toggle('on', x === b)); }
    else if (a === 'ment') { side.ment = +b.dataset.v; FM.T(side.tid).ment = side.ment; document.querySelectorAll('[data-mv=ment]').forEach(x => x.classList.toggle('on', x === b)); }
    else if (a === 'skip') skip();
    else if (a === 'sound') { b.innerHTML = FM.icon(FM.Audio.toggle() ? 'mute' : 'sound'); }
    else if (a === 'sub') { if (!S.ended && side.subsLeft > 0 && $('mvOverlay').hidden) subPanel(); }
    else if (a === 'pick') {
      S.sel[b.dataset.kind] = +b.dataset.id;
      document.querySelectorAll(`[data-mv=pick][data-kind=${b.dataset.kind}]`).forEach(x => x.classList.toggle('on', x === b));
      $('mvSubOk').disabled = S.sel.out == null || S.sel.in == null;
    }
    else if (a === 'subcancel') { $('mvOverlay').hidden = true; S.paused = S.wasPaused; }
    else if (a === 'subok') {
      const i = side.on.indexOf(S.sel.out);
      const e = i >= 0 ? FM.doSub(S.m, S.user, i, S.sel.in) : null;
      if (e) feed(e);
      $('mvOverlay').hidden = true; S.paused = S.wasPaused; paintUi();
    }
    else if (a === 'second') { $('mvOverlay').hidden = true; S.second = true; S.paused = false; kickoff(1); FM.Audio.whistle(1); }
    else if (a === 'done') {
      cancelAnimationFrame(S.raf); window.removeEventListener('resize', S.onResize);
      const cb = S.onDone; S = null;
      $('match').hidden = true; $('match').innerHTML = '';
      cb();
    }
  }

  FM.MatchView = {
    start(m, onDone) {
      const el = $('match'), h = FM.T(m.s[0].tid), a = FM.T(m.s[1].tid), A = FM.Audio;
      const user = m.s[0].user ? 0 : 1;
      el.innerHTML = `
        <div class="mv">
          <div class="mv-score">
            <div class="mv-team">${FM.crest(h, 44)}<span>${esc(h.name)}</span></div>
            <div class="mv-mid"><div class="mv-num"><span id="mvH">0</span><i>–</i><span id="mvA">0</span></div><div class="mv-min" id="mvMin">0'</div></div>
            <div class="mv-team away"><span>${esc(a.name)}</span>${FM.crest(a, 44)}</div>
            <div class="mv-bar" id="mvBar"></div>
          </div>
          <div class="mv-pitch"><canvas id="mvCanvas" aria-label="Canlı maç sahası"></canvas><div class="mv-banner" id="mvBanner" hidden></div><div class="mv-overlay" id="mvOverlay" hidden></div></div>
          <div class="mv-ctl">
            <button class="btn icon" data-mv="pause" aria-label="Duraklat">${FM.icon('pause')}</button>
            <div class="seg" role="group" aria-label="Hız">${[1, 2, 4].map(v => `<button data-mv="speed" data-v="${v}" class="${v === 1 ? 'on' : ''}">${v}x</button>`).join('')}</div>
            <div class="seg" role="group" aria-label="Mentalite">${FM.MENT_TR.map((n, i) => `<button data-mv="ment" data-v="${i}" class="${i === m.s[user].ment ? 'on' : ''}">${n}</button>`).join('')}</div>
            <button class="btn" data-mv="sub">${FM.icon('swap')} Değişiklik <b id="mvSubs">5</b></button>
            <button class="btn" data-mv="skip">${FM.icon('skip')} Sonuca git</button>
            <button class="btn icon" data-mv="sound" aria-label="Ses">${FM.icon(A.muted ? 'mute' : 'sound')}</button>
          </div>
          <div class="mv-bottom"><div id="mvStats"></div><ol class="mv-feed" id="mvFeed" aria-live="polite"></ol></div>
        </div>`;
      el.hidden = false;
      const cv = $('mvCanvas');
      const clash = cdist(h.c1, a.c1) < 150;
      const kit = (t, alt) => { const fill = alt ? t.c2 : t.c1, stroke = alt ? t.c1 : t.c2; return { fill, stroke, text: lum(fill) > 150 ? '#14202f' : '#ffffff' }; };
      S = {
        m, onDone, user, cv, g: cv.getContext('2d'), t: 0, speed: 1, paused: false, acc: 0, queue: [], script: null, second: false,
        poss: 0, holder: null, passT: 1, kickT: 0, dots: [], ball: { x: .5, y: .5, z: 0 }, conf: [], pops: [], last: {}, shake: 0, shakeSide: 0,
        disp: [0, 0], ended: false, kits: [{ ...kit(h), gk: '#ffc93c' }, { ...kit(a, clash), gk: '#58c4dd' }]
      };
      for (let s = 0; s < 2; s++) for (let i = 0; i < 11; i++) S.dots.push({ s, i, x: s ? .75 : .25, y: .5, ph: Math.random() * 6.28, ov: null });
      S.onResize = () => { if (S) resize(); };
      window.addEventListener('resize', S.onResize);
      resize();
      kickoff(0);
      S.dots.forEach(d => { const tg = target(d); d.x = tg.x; d.y = tg.y; });
      paintUi();
      A.init(); A.crowd(true); A.whistle(1);
      S.raf = requestAnimationFrame(frame);
    }
  };
  document.addEventListener('click', onClick);
})();
