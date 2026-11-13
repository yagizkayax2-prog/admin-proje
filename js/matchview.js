/* Saha Kenarı — canlı maç ekranı: stadyum, seremoni ve koreografi, animasyonlu 2D maç, duran toplar,
   seri penaltılar, gol tekrarı, maç içi taktik ve oyuncu değişikliği */
(function () {
  const { clamp } = FM.util;
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const MIN_DUR = .55, CER_END = 8.4;
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
  const clearOv = () => S.dots.forEach(d => { d.ov = null; });
  function dotFor(s, pid) {
    const i = S.m.s[s].on.indexOf(pid);
    if (i >= 0) return dot(s, i);
    const alt = S.dots.filter(d => d.s === s && d.i > 0 && active(d));
    return alt[Math.floor(Math.random() * alt.length)] || dot(s, 0);
  }

  function target(d) {
    if (d.ov) return d.ov;
    const side = S.m.s[d.s], sl = side.slots[d.i], tac = side.tac;
    const prog = S.kickT > 0 ? .42 : ownX(d.s, S.ball.x);
    const by = dirRight(d.s) ? S.ball.y : 1 - S.ball.y;
    let nx, ny;
    if (d.i === 0) { nx = .035 + prog * .05; ny = .5 + (by - .5) * .12; }
    else {
      nx = .07 + sl[1] * .5 + prog * .3 + (tac.line - 1) * .03 * (sl[0] === 'DEF' ? 1.4 : .6);
      if (S.poss !== d.s) nx += -.04 + (tac.press - 1) * .035;
      ny = sl[2] + (by - .5) * .16;
      if (S.poss === d.s && tac.width !== 1) ny = .5 + (ny - .5) * (tac.width === 2 ? 1.12 : .86);
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
    clearOv();
    S.poss = s; S.kickT = 1.3; S.passT = 1.1;
    S.ball.x = .5; S.ball.y = .5; S.ball.z = 0;
    S.holder = S.dots.filter(d => d.s === s && active(d) && d.i > 0).pop() || dot(s, 0);
  }
  function ambientPass() {
    const h = S.holder; if (!h || !active(h)) { S.holder = S.dots.find(d => d.s === S.poss && active(d) && d.i > 4) || dot(S.poss, 0); return; }
    const s = h.s, share = S.m.st.poss[s] / Math.max(1, S.m.st.poss[0] + S.m.st.poss[1]);
    const mates = S.dots.filter(d => d.s === s && d !== h && active(d));
    if (!mates.length) return;
    const wts = mates.map(d => {
      const dist = Math.hypot(d.x - h.x, (d.y - h.y) * .65), fwd = ownX(s, d.x) - ownX(s, h.x);
      return (d.i === 0 ? .12 : 1) * (1 / (.06 + Math.abs(dist - .16))) * (fwd > 0 ? 1.5 : 1);
    });
    let r = Math.random() * wts.reduce((a, b) => a + b, 0), rec = mates[0];
    for (let i = 0; i < mates.length; i++) { r -= wts[i]; if (r <= 0) { rec = mates[i]; break; } }
    if (Math.random() < .1 + .34 * (1 - share)) {
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

  /* ---------- Pozisyon senaryoları (açık oyun, penaltı, frikik, korner) ---------- */
  function playChance(e, replay) {
    const s = e.side, o = 1 - s, A = FM.Audio, tac = S.m.s[s].tac;
    const v = e.v || (e.v = { flank: (Math.random() < .5 ? -1 : 1) * [.12, .3, .4][tac.width] + .5, shotY: .34 + Math.random() * .32, side: Math.random() < .5 ? -1 : 1 });
    const flank = v.flank, side = v.side;
    S.poss = s; S.kickT = 0;
    const sh = dotFor(s, e.pid), gk = dot(o, 0);
    let as = e.aid != null ? dotFor(s, e.aid) : null;
    if (e.kind === 'open' && (!as || as === sh)) as = S.dots.find(d => d.s === s && d !== sh && d.i > 4 && active(d)) || sh;
    const steps = [];
    const others = S.dots.filter(d => d !== sh && d !== gk && d !== as && d.i > 0 && active(d));
    let arc = .25;
    if (e.kind === 'pen') {
      const spot = toPitch(s, .885, .5);
      others.forEach((d, k) => { d.ov = toPitch(s, .775 - (k % 3) * .022, .14 + k / Math.max(1, others.length - 1) * .72); });
      sh.ov = toPitch(s, .84, .5); gk.ov = toPitch(s, .985, .5);
      steps.push(mv(() => spot, .35, { end: () => { S.holder = null; A.whistle(1); pop(sh, 'PENALTI!', '#ffc93c'); } }), wait(1.5, () => { sh.ov = toPitch(s, .875, .5); }), wait(.3, () => A.kick()));
    } else if (e.kind === 'fk') {
      const spot = toPitch(s, .74, .5 + side * .13);
      S.dots.filter(d => d.s === o && d.i > 0 && active(d)).slice(0, 3).forEach((d, k) => { d.ov = toPitch(s, .835, .5 + side * .09 + (k - 1) * .032); });
      sh.ov = toPitch(s, .72, .5 + side * .14);
      steps.push(mv(() => spot, .35, { end: () => { S.holder = null; A.whistle(1); pop(sh, 'FRİKİK', '#ffc93c'); } }), wait(1.1, () => { sh.ov = spot; }), wait(.3, () => A.kick()));
      arc = .8;
    } else if (e.kind === 'ck') {
      const corner = toPitch(s, .992, flank < .5 ? .008 : .992), tk = as || sh;
      tk.ov = corner; if (tk !== sh) sh.ov = toPitch(s, .92, .44 + Math.random() * .12);
      S.dots.filter(d => d.s === s && d.i > 0 && d !== tk && d !== sh && active(d)).slice(-4).forEach((d, k) => { d.ov = toPitch(s, .87 + (k % 2) * .04, .36 + k * .09); });
      steps.push(mv(() => corner, .4, { end: () => { S.holder = null; pop(tk, 'KORNER', '#ffc93c'); } }), wait(.9, () => A.kick()), mv(() => sh, .75, { arc: 1 }), wait(.08, () => A.kick()));
      arc = .15;
    } else {
      if (as !== sh) as.ov = toPitch(s, .7, flank);
      sh.ov = toPitch(s, .86, v.shotY);
      if (as !== sh) steps.push(mv(() => as, .6, { arc: .3, end: () => { S.holder = as; A.kick(); } }), wait(.3));
      steps.push(mv(() => sh, .5, { end: () => { S.holder = sh; A.kick(); } }), wait(.22, () => { S.holder = null; A.kick(); }));
    }
    const done = (holder, poss) => () => { if (replay) return replayNext(); clearOv(); S.holder = holder; S.poss = poss; S.passT = .8; };
    if (e.out === 'goal') {
      const gp = toPitch(s, 1.022, .5 + side * .035);
      if (e.kind === 'pen') steps.push(wait(.01, () => { gk.ov = toPitch(s, .98, .5 - side * .05); }));
      steps.push(mv(() => gp, .3, { arc, end: () => goalFx(e, s, flank, replay) }), wait(2.6, () => (replay ? replayNext() : kickoff(o))));
    } else if (e.out === 'save') {
      const sp = toPitch(s, .975, .5 + side * .04);
      steps.push(wait(.01, () => { gk.ov = sp; }), mv(() => sp, .34, { arc: arc * .8, end: () => { A.groan(); pop(gk, 'KURTARIŞ', '#58c4dd'); } }), wait(.7, done(gk, o)));
    } else if (e.out === 'post') {
      const pp = toPitch(s, 1, .5 + side * .058), rb = toPitch(s, .86, .5 + side * .25);
      steps.push(mv(() => pp, .3, { arc: .2, end: () => { A.kick(); A.groan(); S.shake = .5; S.shakeSide = dirRight(s) ? 1 : 0; pop(sh, 'DİREK!', '#ffc93c'); } }), mv(() => rb, .45, { arc: .5 }), wait(.3, done(gk, o)));
    } else if (e.out === 'block') {
      const bp = toPitch(s, .93, v.shotY), cp = toPitch(s, 1.03, flank < .5 ? .04 : .96);
      steps.push(mv(() => bp, .2), mv(() => cp, .5, { arc: .6, end: () => A.groan() }), wait(.5, done(gk, o)));
    } else {
      const mp = toPitch(s, 1.05, .5 + side * (.1 + Math.random() * .08));
      steps.push(mv(() => mp, .38, { arc: .9, end: () => A.groan() }), wait(.6, done(gk, o)));
    }
    run(steps, true);
  }
  function goalFx(e, s, flank, replay) {
    const t = FM.T(S.m.s[s].tid), p = FM.P(e.pid), A = FM.Audio;
    if (!replay) { S.disp[s]++; paintScore(s); }
    A.cheer();
    S.cheer[s] = 1;
    S.shake = 1; S.shakeSide = dirRight(s) ? 1 : 0;
    const corner = toPitch(s, .9, flank < .5 ? .1 : .9);
    S.dots.forEach(d => { if (d.s === s && d.i > 0) d.ov = { x: corner.x + (Math.random() - .5) * .07, y: corner.y + (Math.random() - .5) * .1 }; });
    for (let i = 0; i < 90; i++) S.conf.push({ x: corner.x + (Math.random() - .5) * .3, y: -.05 - Math.random() * .4, vx: (Math.random() - .5) * .12, vy: .25 + Math.random() * .35, r: Math.random() * 6.28, c: [t.c1, t.c2, '#ffc93c'][i % 3], life: 3 });
    banner(t, replay ? 'TEKRAR' : 'GOL!', `${p ? p.name : ''} · ${e.min}'`);
  }
  function banner(t, head, sub) {
    const b = $('mvBanner');
    b.innerHTML = `<div class="gb-in" style="--k1:${t.c1};--k2:${t.c2}">${FM.crest(t, 46)}<div><strong>${head}</strong><span>${esc(sub)}</span></div></div>`;
    b.hidden = false; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    clearTimeout(S.bannerT); S.bannerT = setTimeout(() => { b.hidden = true; }, 2400 / S.speed + 300);
  }
  function pop(d, text, color) { S.pops.push({ x: d.x, y: d.y, text, color, t: 0 }); }

  /* ---------- Seri penaltılar ---------- */
  function playPens() {
    const m = S.m, A = FM.Audio, steps = [];
    S.phase = 'pens'; S.second = false; clearOv(); S.holder = null; S.pk = [[], []];
    const rest = d => ({ x: .46 + (d.s ? .08 : 0) + (d.i % 2) * .02, y: .22 + d.i * .052 });
    S.dots.forEach(d => { d.ov = d.i === 0 ? { x: .93, y: d.s ? .78 : .22 } : rest(d); });
    $('mvPens').hidden = false; paintPens();
    steps.push(wait(1.2, () => A.whistle(1)));
    for (const k of m.pens.kicks) {
      const dir = Math.random() < .5 ? -1 : 1;
      let shD, gkD;
      steps.push(wait(.5, () => {
        S.dots.forEach(d => { if (d.i > 0) d.ov = rest(d); else d.ov = { x: .93, y: d.s ? .78 : .22 }; });
        shD = k.pid != null ? dotFor(k.side, k.pid) : dot(k.side, 10); gkD = dot(1 - k.side, 0);
        shD.ov = { x: .85, y: .5 }; gkD.ov = { x: .985, y: .5 };
        S.ball.x = .89; S.ball.y = .5; S.ball.z = 0;
      }), wait(1.25, () => { shD.ov = { x: .88, y: .5 }; }), wait(.25, () => A.kick()));
      if (k.ok) steps.push(wait(.01, () => { gkD.ov = { x: .982, y: .5 - dir * .05 }; }), mv(() => ({ x: 1.022, y: .5 + dir * .035 }), .28, { arc: .2, end: () => { S.pk[k.side].push(1); paintPens(); S.shake = .8; S.shakeSide = 1; S.cheer[k.side] = .7; A.cheer(); } }));
      else if (Math.random() < .65) steps.push(wait(.01, () => { gkD.ov = { x: .978, y: .5 + dir * .04 }; }), mv(() => ({ x: .975, y: .5 + dir * .04 }), .3, { arc: .15, end: () => { S.pk[k.side].push(0); paintPens(); pop(gkD, 'KURTARIŞ', '#58c4dd'); A.groan(); } }));
      else steps.push(mv(() => ({ x: 1.05, y: .5 + dir * .12 }), .32, { arc: .8, end: () => { S.pk[k.side].push(0); paintPens(); A.groan(); } }));
      steps.push(wait(.8));
    }
    steps.push(wait(.4, fullTime));
    run(steps, true);
  }
  function paintPens() {
    const row = s => S.pk[s].map(v => `<i class="${v ? 'ok' : 'no'}"></i>`).join('');
    $('mvPens').innerHTML = `<span>${row(0)}</span><b>${S.pk[0].filter(Boolean).length} – ${S.pk[1].filter(Boolean).length}</b><span>${row(1)}</span>`;
  }

  /* ---------- Gol tekrarı ---------- */
  function replayNext() {
    const e = S.goals[S.rep++];
    S.script = null; clearOv();
    if (!e) { S.phase = 'end'; S.slow = 1; $('mvTag').hidden = true; S.paused = true; overlay(S.ftHtml); return; }
    S.phase = 'replay'; S.slow = .6; S.paused = false;
    S.second = (e.min > 45 && e.min <= 90) || e.min > 105;
    const c = toPitch(e.side, .55, .5);
    S.ball.x = c.x; S.ball.y = c.y; S.poss = e.side; S.kickT = 0; S.holder = null;
    const p = FM.P(e.pid);
    $('mvTag').hidden = false; $('mvTag').textContent = `Tekrar ${S.rep}/${S.goals.length} · ${e.min}' ${p ? p.name : ''}`;
    run([wait(.9, () => playChance(e, true))], true);
  }

  /* ---------- Akış ve olaylar ---------- */
  function feed(e, cls) {
    const li = document.createElement('li');
    li.className = 'fd ' + (cls || e.type) + (e.out ? ' ' + e.out : '') + (e.side != null && e.side === S.user ? ' mine' : '');
    li.innerHTML = `<b>${e.min}'</b><span>${esc(e.text)}</span>`;
    const f = $('mvFeed'); f.prepend(li);
    while (f.children.length > 40) f.lastChild.remove();
  }
  function handle(e) {
    const A = FM.Audio;
    feed(e);
    if (e.type === 'chance') { if (e.out === 'goal') S.goals.push(e); return playChance(e); }
    if (e.type === 'yellow' || e.type === 'red') {
      const pos = S.last[e.pid] || { x: .5, y: .5 };
      S.pops.push({ x: pos.x, y: pos.y, card: e.type === 'red' ? '#ef5350' : '#ffc93c', t: 0 });
      S.refs[0].tx = pos.x + .02; S.refs[0].ty = pos.y + .03;
      A.whistle(1);
      return run([wait(.9)], true);
    }
    if (e.type === 'inj') { A.whistle(1); return run([wait(.7)], true); }
    if (e.type === 'ht') { A.whistle(2); S.htPending = true; return htOverlay(); }
    if (e.type === 'et') { A.whistle(2); S.pops.push({ x: .5, y: .45, text: 'UZATMALAR', color: '#ffc93c', t: -1 }); S.second = false; kickoff(0); return run([wait(1.6)], true); }
    if (e.type === 'pens') return playPens();
    if (e.type === 'ft') return fullTime();
  }
  function htOverlay() {
    S.paused = true;
    overlay(`<h3>Devre arası</h3>${statsHtml()}<div class="row"><button class="btn" data-mv="tacp">Taktik</button><button class="btn" data-mv="sub">Değişiklik</button><button class="btn primary" data-mv="second">İkinci yarıyı başlat</button></div>`);
  }
  function fullTime() {
    const m = S.m, A = FM.Audio;
    S.disp = m.score.slice(); paintScore();
    A.whistle(3); A.crowd(false);
    S.ended = true; S.paused = true; S.phase = 'end'; S.script = null; S.queue = [];
    const ws = FM.winnerSide(m), res = m.cup && ws >= 0 ? (ws === S.user ? 1 : -1) : m.score[S.user] - m.score[1 - S.user];
    const head = res > 0 ? (m.cup ? 'Tur atladın!' : 'Galibiyet!') : res < 0 ? (m.cup ? 'Kupaya veda' : 'Mağlubiyet') : 'Beraberlik';
    const goals = m.log.filter(l => l.type === 'goal').map(l => `<li class="${l.side ? 'r' : 'l'}">${esc(FM.P(l.pid) ? FM.P(l.pid).name : '')} ${l.min}'${l.kind === 'pen' ? ' (P)' : ''}</li>`).join('');
    // puanları önizle (kesin değerler maç kaydedilince yazılır)
    const side = m.s[S.user], d = m.score[S.user] - m.score[1 - S.user];
    const rts = side.played.map(id => ({ p: FM.P(id), r: clamp(m.rt[id] + (d > 0 ? .3 : d < 0 ? -.2 : 0), 3, 10) })).filter(x => x.p).sort((a, b) => b.r - a.r);
    let best = null; for (const s of m.s) for (const id of s.played) if (FM.P(id) && (best == null || m.rt[id] > m.rt[best])) best = id;
    S.ftHtml = `<h3 class="${res > 0 ? 'win' : res < 0 ? 'loss' : ''}">${head}</h3><p class="ft-score">${m.score[0]} – ${m.score[1]}${m.pens ? ` <small>(pen. ${m.pens.sc[0]}–${m.pens.sc[1]})</small>` : ''}</p><ul class="ft-goals">${goals}</ul>
      ${best != null ? `<p class="motm">Maçın adamı: <b>${esc(FM.P(best).name)}</b></p>` : ''}
      <div class="rts">${rts.map(x => `<span class="rt ${x.r >= 7.5 ? 'hi' : x.r < 6 ? 'lo' : ''}"><b>${x.r.toFixed(1)}</b>${esc(x.p.name.split(' ').pop())}</span>`).join('')}</div>
      ${statsHtml()}<div class="row">${S.goals.length ? `<button class="btn" data-mv="replay">${FM.icon('play')} Golleri izle</button>` : ''}<button class="btn primary" data-mv="done">Devam et</button></div>`;
    overlay(S.ftHtml);
  }
  function statsHtml() {
    const st = S.m.st, pt = Math.max(1, st.poss[0] + st.poss[1]), p0 = Math.round(st.poss[0] / pt * 100);
    const row = (l, a, b) => `<div class="st-row"><b>${a}</b><span>${l}</span><b>${b}</b><i style="--w:${a + b ? a / (a + b) * 100 : 50}%"></i></div>`;
    return `<div class="st">${row('Topla oynama %', p0, 100 - p0)}${row('Şut', st.shots[0], st.shots[1])}${row('İsabetli şut', st.target[0], st.target[1])}${row('Korner', st.corners[0], st.corners[1])}${row('Faul', st.fouls[0], st.fouls[1])}${row('Sarı kart', st.yel[0], st.yel[1])}</div>`;
  }
  function overlay(html) { const o = $('mvOverlay'); o.innerHTML = `<div class="ov-card">${html}</div>`; o.hidden = false; }
  function closeOverlay() { $('mvOverlay').hidden = true; if (S.htPending) htOverlay(); else S.paused = S.wasPaused; }
  function paintScore(s) {
    $('mvH').textContent = S.disp[0]; $('mvA').textContent = S.disp[1];
    if (s != null) { const el = $(s ? 'mvA' : 'mvH'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  }
  function paintUi() {
    $('mvMin').textContent = S.m.min + "'";
    $('mvBar').style.setProperty('--p', S.m.min / (S.m.et ? 120 : 90) * 100 + '%');
    const sub = $('mvSubs'); if (sub) sub.textContent = S.m.s[S.user].subsLeft;
    $('mvStats').innerHTML = statsHtml();
  }

  /* ---------- Paneller ---------- */
  function subPanel() {
    const side = S.m.s[S.user];
    if (!S.htPending) S.wasPaused = S.paused;
    S.paused = true; S.sel = { out: null, in: null };
    const row = (id, kind, role) => { const p = FM.P(id); return `<button class="sb-row" data-mv="pick" data-kind="${kind}" data-id="${id}"><span class="pos ${role || p.pos}">${FM.POS_TR[role || p.pos]}</span><span class="nm">${esc(p.name)}</span><span class="ov">${p.ovr}</span><span class="fit"><i style="width:${Math.round(p.fit)}%"></i></span></button>`; };
    const on = side.on.map((id, i) => (id == null ? '' : row(id, 'out', side.slots[i][0]))).join('');
    const bench = side.bench.map(id => row(id, 'in')).join('') || '<p class="muted">Yedek kalmadı.</p>';
    overlay(`<h3>Oyuncu değişikliği <small>(${side.subsLeft} hak)</small></h3><div class="sb"><div><h4>Çıkan</h4>${on}</div><div><h4>Giren</h4>${bench}</div></div><div class="row"><button class="btn" data-mv="pclose">Vazgeç</button><button class="btn primary" data-mv="subok" id="mvSubOk" disabled>Değiştir</button></div>`);
  }
  function tacPanel() {
    const side = S.m.s[S.user];
    if (!S.htPending && $('mvOverlay').hidden) S.wasPaused = S.paused;
    S.paused = true;
    overlay(`<h3>Taktik</h3><div class="tacs"><div class="tac-row"><span>Oyun anlayışı</span><div class="seg">${FM.MENT_TR.map((n, i) => `<button data-mv="ment" data-v="${i}" class="${i === side.ment ? 'on' : ''}">${n}</button>`).join('')}</div></div>${FM.tacSegs(side.tac, 'data-mv')}</div><div class="row"><button class="btn primary" data-mv="pclose">Tamam</button></div>`);
  }

  /* ---------- Seremoni ---------- */
  function ceremony(dt) {
    S.ct += dt;
    const ct = S.ct;
    S.choreo = clamp((ct - .3) / 2.6, 0, 1.2);
    S.cheer[0] = Math.max(S.cheer[0], .45);
    if (ct < 3.2) {
      for (const d of S.dots) { d.x = .5 + (d.s ? .018 : -.018); d.y = Math.max(.16 + d.i * .068, 1.14 + d.i * .068 - ct * .42); }
      S.refs.forEach((r, k) => { r.x = .5 + (k - 1) * .03; r.y = Math.max(.08, 1.06 - ct * .42); });
      S.ball.x = .5; S.ball.y = Math.max(.1, 1.08 - ct * .42);
    } else if (ct < 6.8) {
      for (const d of S.dots) d.ov = { x: d.s ? .535 + d.i * .036 : .465 - d.i * .036, y: .5 };
      S.refs.forEach((r, k) => { r.tx = .5; r.ty = .5 + (k - 1) * .07; });
      S.ball.x = lerp(S.ball.x, .5, dt * 3); S.ball.y = lerp(S.ball.y, .46, dt * 3);
      if (ct > 5.3 && !S.cerToss) { S.cerToss = true; S.pops.push({ x: .5, y: .44, text: 'YAZI TURA', color: '#ffc93c', t: 0 }); dot(0, 0).ov = { x: .485, y: .56 }; dot(1, 0).ov = { x: .515, y: .56 }; }
    } else if (!S.cerRun) {
      S.cerRun = true; kickoff(0); S.kickT = 3;
      S.refs[0].tx = .5; S.refs[0].ty = .4; S.refs[1].ty = -.035; S.refs[2].ty = 1.035;
    }
    if (ct >= CER_END) endCeremony();
  }
  function endCeremony() {
    if (S.phase !== 'cer') return;
    S.phase = 'play'; S.ct = CER_END;
    $('mvCer').hidden = true;
    kickoff(0);
    S.refs[1].ty = -.035; S.refs[2].ty = 1.035;
    FM.Audio.whistle(1);
  }

  /* ---------- Çizim ---------- */
  function resize() {
    const c = S.cv, w = c.parentElement.clientWidth, dpr = Math.min(2, window.devicePixelRatio || 1), m = S.m, home = FM.T(m.s[0].tid);
    S.st = FM.Stadium.create({ W: w, dpr, tier: FM.stadiumTier(home), home, away: FM.T(m.s[1].tid), fill: S.fill, wx: m.wx });
    c.width = w * dpr; c.height = S.st.H * dpr; c.style.height = S.st.H + 'px';
    S.W = w; S.H = S.st.H; S.dpr = dpr;
  }
  const px = x => S.st.geom.x0 + x * (S.st.geom.x1 - S.st.geom.x0);
  const py = y => S.st.geom.y0 + y * (S.st.geom.y1 - S.st.geom.y0);
  function draw(dt) {
    const g = S.g, w = S.W, h = S.H, G = S.st.geom, ph = G.y1 - G.y0, cy = (G.y0 + G.y1) / 2;
    g.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    g.drawImage(S.st.bg, 0, 0, w, h);
    S.st.drawCrowd(g, S.t + S.ct, { choreo: S.choreo, alpha: S.choreoA, cheer: S.cheer, dt });
    for (const sx of [0, 1]) {
      const off = S.shake > 0 && S.shakeSide === sx ? Math.sin(S.t * 40) * 4 * S.shake : 0;
      const x0 = sx ? G.x1 : G.x0, d = sx ? 1 : -1, gw = G.gd * .8 + Math.abs(off), y0 = cy - ph * .06, gh = ph * .12;
      g.fillStyle = 'rgba(10,19,34,.35)'; g.fillRect(x0, y0, d * gw, gh);
      g.strokeStyle = 'rgba(243,239,228,.5)'; g.lineWidth = 1;
      g.beginPath();
      for (let i = 1; i < 4; i++) { g.moveTo(x0 + d * gw * i / 4, y0); g.lineTo(x0 + d * gw * i / 4, y0 + gh); }
      for (let i = 1; i < 5; i++) { g.moveTo(x0, y0 + gh * i / 5); g.lineTo(x0 + d * gw, y0 + gh * i / 5); }
      g.stroke();
      g.strokeStyle = '#f3efe4'; g.lineWidth = 2.5; g.strokeRect(x0, y0, d * gw, gh);
    }
    const r = Math.max(5.5, w * .0135);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    S.refs.forEach((rf, k) => {
      const x = px(rf.x), y = py(rf.y);
      g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(x, y + r * .7, r * .8, r * .4, 0, 0, 6.29); g.fill();
      g.beginPath(); g.arc(x, y, r * .82, 0, 6.29); g.fillStyle = '#14181f'; g.fill(); g.lineWidth = 2; g.strokeStyle = k ? '#ffc93c' : '#e8f04a'; g.stroke();
    });
    const list = S.dots.filter(active).sort((a, b) => a.y - b.y);
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
    const bx = px(S.ball.x), by = py(S.ball.y), br = r * .52, lift = S.ball.z * h * .08;
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(bx, by + br * .9, br * (1 + S.ball.z * .3), br * .5, 0, 0, 6.29); g.fill();
    g.beginPath(); g.arc(bx, by - lift, br * (1 + S.ball.z * .25), 0, 6.29); g.fillStyle = S.st.snow ? '#ff9a3c' : '#fff'; g.fill(); g.lineWidth = 1.2; g.strokeStyle = '#14202f'; g.stroke();
    g.beginPath(); g.arc(bx + Math.cos(S.t * 9) * br * .35, by - lift + Math.sin(S.t * 9) * br * .35, br * .3, 0, 6.29); g.fillStyle = '#14202f'; g.fill();
    for (const p of S.pops) {
      if (p.t < 0) continue;
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
    S.st.drawFx(g, S.t + S.ct);
  }

  /* ---------- Döngü ---------- */
  function frame(ts) {
    if (!S) return;
    const raw = Math.min(.05, (ts - (S.lastTs || ts)) / 1000); S.lastTs = ts;
    const dt = S.paused ? 0 : raw * S.speed * S.slow;
    if (dt > 0 && S.phase === 'cer') ceremony(dt);
    else if (dt > 0) {
      S.t += dt;
      if (S.kickT > 0) S.kickT -= dt;
      if (S.choreoA > 0) S.choreoA = Math.max(0, S.choreoA - dt * .22);
      tickScript(dt);
      const live = S.phase === 'play';
      if (!S.script && live) {
        if (S.queue.length) handle(S.queue.shift());
        else if (!S.ended) {
          if (S.holder && active(S.holder)) { S.ball.x = lerp(S.ball.x, S.holder.x + (dirRight(S.holder.s) ? .012 : -.012), Math.min(1, dt * 12)); S.ball.y = lerp(S.ball.y, S.holder.y, Math.min(1, dt * 12)); S.ball.z = 0; }
          S.passT -= dt;
          if (S.passT <= 0) { S.passT = (.55 + Math.random() * .7) * [1.3, 1, .78][S.m.s[S.poss].tac.tempo]; ambientPass(); }
        }
      } else if (live && S.script && !S.script.blocking && S.queue.length) { S.script = null; handle(S.queue.shift()); }
      if (live && (!S.script || !S.script.blocking) && !S.queue.length && !S.ended && !S.paused) {
        S.acc += dt;
        if (S.acc >= MIN_DUR) {
          S.acc -= MIN_DUR;
          if (S.m.min === 0) feed({ min: 0, type: 'ko', text: FM.TXT.ko[0] });
          for (const e of FM.simMinute(S.m)) { if (e.type === 'sub') feed(e); else S.queue.push(e); }
          paintUi();
        }
      }
    }
    if (dt > 0) {
      const march = S.phase === 'cer' && S.ct < 3.2;
      if (!march) for (const d of S.dots) {
        if (!active(d)) continue;
        const tg = target(d), k = Math.min(1, dt * (d.ov ? 3.4 : 2.6));
        d.x += (tg.x - d.x) * k; d.y += (tg.y - d.y) * k;
        S.last[S.m.s[d.s].on[d.i]] = d;
      }
      if (S.phase === 'play' && !S.script) { S.refs[0].tx = clamp(S.ball.x + .05, .05, .95); S.refs[0].ty = clamp(S.ball.y + .1, .08, .92); }
      if (S.phase !== 'cer') { S.refs[1].tx = clamp(S.ball.x, .02, .98); S.refs[2].tx = clamp(S.ball.x, .02, .98); }
      if (!march) for (const rf of S.refs) { rf.x += (rf.tx - rf.x) * Math.min(1, dt * 2); rf.y += (rf.ty - rf.y) * Math.min(1, dt * 2); }
      if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * .8);
      S.cheer[0] = Math.max(0, S.cheer[0] - dt * .3); S.cheer[1] = Math.max(0, S.cheer[1] - dt * .3);
      S.pops = S.pops.filter(p => (p.t += dt) < 1.6);
      S.conf = S.conf.filter(c => { c.x += c.vx * dt; c.y += c.vy * dt; c.r += dt * 6; c.life -= dt; return c.life > 0 && c.y < 1.1; });
    }
    draw(dt);
    S.raf = requestAnimationFrame(frame);
  }

  function skip() {
    const m = S.m;
    if (S.phase === 'cer') endCeremony();
    if (S.ended || S.phase === 'pens' || S.phase === 'replay') return;
    S.script = null; clearOv(); S.htPending = false;
    for (const e of S.queue) { if (e.type === 'chance' && e.out === 'goal') S.goals.push(e); if (e.type !== 'ft' && e.type !== 'chance' && e.type !== 'pens') feed(e); }
    const hadPens = S.queue.some(e => e.type === 'pens');
    S.queue = [];
    let pens = hadPens;
    while (!m.done) for (const e of FM.simMinute(m)) {
      if (e.type === 'chance' && e.out === 'goal') S.goals.push(e);
      if (e.type === 'pens') pens = true;
      if (e.type !== 'ft' && (e.type !== 'chance' || e.out === 'goal')) feed(e);
    }
    paintUi();
    S.disp = m.score.slice(); paintScore();
    if (pens) { $('mvOverlay').hidden = true; S.paused = false; playPens(); } else fullTime();
  }

  function onClick(ev) {
    const b = ev.target.closest('[data-mv]'); if (!b || !S) return;
    const a = b.dataset.mv, side = S.m.s[S.user];
    FM.Audio.init();
    if (a === 'pause') { S.paused = !S.paused; b.innerHTML = FM.icon(S.paused ? 'play' : 'pause'); b.setAttribute('aria-label', S.paused ? 'Devam ettir' : 'Duraklat'); }
    else if (a === 'speed') { S.speed = +b.dataset.v; document.querySelectorAll('[data-mv=speed]').forEach(x => x.classList.toggle('on', x === b)); }
    else if (a === 'ment') { side.ment = +b.dataset.v; FM.T(side.tid).ment = side.ment; tacPanel(); }
    else if (a === 'tac') { side.tac[b.dataset.k] = +b.dataset.v; FM.T(side.tid).tac[b.dataset.k] = +b.dataset.v; tacPanel(); }
    else if (a === 'skip') skip();
    else if (a === 'cerskip') endCeremony();
    else if (a === 'sound') { b.innerHTML = FM.icon(FM.Audio.toggle() ? 'mute' : 'sound'); }
    else if (a === 'tacp') { if (S.phase === 'play' && !S.ended) tacPanel(); }
    else if (a === 'sub') { if (S.phase === 'play' && !S.ended && side.subsLeft > 0 && ($('mvOverlay').hidden || S.htPending)) subPanel(); }
    else if (a === 'pick') {
      S.sel[b.dataset.kind] = +b.dataset.id;
      document.querySelectorAll(`[data-mv=pick][data-kind=${b.dataset.kind}]`).forEach(x => x.classList.toggle('on', x === b));
      $('mvSubOk').disabled = S.sel.out == null || S.sel.in == null;
    }
    else if (a === 'pclose') closeOverlay();
    else if (a === 'subok') {
      const i = side.on.indexOf(S.sel.out), e = i >= 0 ? FM.doSub(S.m, S.user, i, S.sel.in) : null;
      if (e) feed(e);
      paintUi(); closeOverlay();
    }
    else if (a === 'second') { S.htPending = false; $('mvOverlay').hidden = true; S.second = true; S.paused = false; kickoff(1); FM.Audio.whistle(1); }
    else if (a === 'replay') { $('mvOverlay').hidden = true; S.rep = 0; replayNext(); }
    else if (a === 'done') {
      cancelAnimationFrame(S.raf); window.removeEventListener('resize', S.onResize); clearTimeout(S.bannerT);
      const cb = S.onDone; S = null;
      $('match').hidden = true; $('match').innerHTML = '';
      cb();
    }
  }

  FM.MatchView = {
    /* info: { comp: 'Yıldızlar Ligi · 5. hafta', att } */
    start(m, onDone, info) {
      const el = $('match'), h = FM.T(m.s[0].tid), a = FM.T(m.s[1].tid), A = FM.Audio, G = FM.G;
      const user = m.s[0].user ? 0 : 1, tier = FM.stadiumTier(h), cap = FM.stadiumCap(h);
      const fill = clamp((h.id === G.teamId ? .3 + G.fans / 100 * .65 : .45 + h.rep * .09) + (m.cup ? .08 : 0), .25, 1);
      el.innerHTML = `
        <div class="mv">
          <div class="mv-score">
            <div class="mv-team">${FM.crest(h, 44)}<span>${esc(h.name)}</span></div>
            <div class="mv-mid"><div class="mv-num"><span id="mvH">0</span><i>–</i><span id="mvA">0</span></div><div class="mv-min" id="mvMin">0'</div></div>
            <div class="mv-team away"><span>${esc(a.name)}</span>${FM.crest(a, 44)}</div>
            <div class="mv-bar" id="mvBar"></div>
          </div>
          <div class="mv-pitch"><canvas id="mvCanvas" aria-label="Canlı maç sahası"></canvas>
            <div class="mv-cer" id="mvCer"><p class="eyebrow">${esc(info.comp)}</p><strong>${esc(h.stadium)}</strong><span>${FM.Stadium.TIERS[tier]} · ${Math.round(cap * fill).toLocaleString('tr-TR')} seyirci · ${FM.WX_TR[m.wx.t]}${m.wx.n ? ', gece maçı' : ''}</span><button class="btn" data-mv="cerskip">Seremoniyi geç</button></div>
            <div class="mv-pens" id="mvPens" hidden></div><div class="mv-tag" id="mvTag" hidden></div>
            <div class="mv-banner" id="mvBanner" hidden></div><div class="mv-overlay" id="mvOverlay" hidden></div></div>
          <div class="mv-ctl">
            <button class="btn icon" data-mv="pause" aria-label="Duraklat">${FM.icon('pause')}</button>
            <div class="seg" role="group" aria-label="Hız">${[1, 2, 4].map(v => `<button data-mv="speed" data-v="${v}" class="${v === 1 ? 'on' : ''}">${v}x</button>`).join('')}</div>
            <button class="btn" data-mv="tacp">${FM.icon('tactics')} Taktik</button>
            <button class="btn" data-mv="sub">${FM.icon('swap')} Değişiklik <b id="mvSubs">5</b></button>
            <button class="btn" data-mv="skip">${FM.icon('skip')} Sonuca git</button>
            <button class="btn icon" data-mv="sound" aria-label="Ses">${FM.icon(A.muted ? 'mute' : 'sound')}</button>
          </div>
          <div class="mv-bottom"><div id="mvStats"></div><ol class="mv-feed" id="mvFeed" aria-live="polite"></ol></div>
        </div>`;
      el.hidden = false; el.scrollTop = 0;
      const cv = $('mvCanvas');
      const clash = cdist(h.c1, a.c1) < 150;
      const kit = (t, alt) => { const fl = alt ? t.c2 : t.c1, stroke = alt ? t.c1 : t.c2; return { fill: fl, stroke, text: lum(fl) > 150 ? '#14202f' : '#ffffff' }; };
      S = {
        m, onDone, user, cv, g: cv.getContext('2d'), t: 0, ct: 0, speed: 1, slow: 1, paused: false, acc: 0, queue: [], script: null, second: false, phase: 'cer',
        poss: 0, holder: null, passT: 1, kickT: 0, dots: [], ball: { x: .5, y: 1.1, z: 0 }, conf: [], pops: [], last: {}, shake: 0, shakeSide: 0,
        disp: [0, 0], ended: false, fill, cheer: [0, 0], choreo: 0, choreoA: 1, goals: [], rep: 0, pk: [[], []], htPending: false, wasPaused: false,
        refs: [0, 1, 2].map(() => ({ x: .5, y: 1.1, tx: .5, ty: .5 })),
        kits: [{ ...kit(h), gk: '#ffc93c' }, { ...kit(a, clash), gk: '#58c4dd' }]
      };
      for (let s = 0; s < 2; s++) for (let i = 0; i < 11; i++) S.dots.push({ s, i, x: .5, y: 1.2, ph: Math.random() * 6.28, ov: null });
      S.onResize = () => { if (S) resize(); };
      window.addEventListener('resize', S.onResize);
      resize();
      paintUi();
      A.init(); A.crowd(true); A.anthem();
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { S.ct = 6.9; }
      S.raf = requestAnimationFrame(frame);
    }
  };
  document.addEventListener('click', onClick);
})();
