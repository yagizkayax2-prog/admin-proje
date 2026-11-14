/* Saha Kenarı — canlı maç ekranı: stadyum, seremoni ve koreografi, animasyonlu 2D maç, duran toplar,
   seri penaltılar, gol tekrarı, maç içi taktik ve oyuncu değişikliği */
(function () {
  const { clamp } = FM.util;
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const MIN_DUR = .55, CER_END = 8.4;
  const $ = id => document.getElementById(id);
  const LOGO = new Image(); LOGO.src = 'assets/logo.svg';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let S = null;

  function lum(hex) { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114); }
  function cdist(a, b) { const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16); return Math.abs((x >> 16) - (y >> 16)) + Math.abs(((x >> 8) & 255) - ((y >> 8) & 255)) + Math.abs((x & 255) - (y & 255)); }

  const dirRight = s => (s === 0) !== S.second;
  const toPitch = (s, nx, ny) => (dirRight(s) ? { x: nx, y: ny } : { x: 1 - nx, y: 1 - ny });
  const ownX = (s, x) => (dirRight(s) ? x : 1 - x);
  const dot = (s, i) => S.dots[s * 11 + i];
  const active = d => S.m.s[d.s].on[d.i] != null;
  const clearOv = () => S.dots.forEach(d => { d.ov = null; d.cv = null; });
  const pdist = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * .65);
  function dotFor(s, pid) {
    const i = S.m.s[s].on.indexOf(pid);
    if (i >= 0) return dot(s, i);
    const alt = S.dots.filter(d => d.s === s && d.i > 0 && active(d));
    return alt[Math.floor(Math.random() * alt.length)] || dot(s, 0);
  }

  function target(d) {
    if (d.ov) return d.ov;
    if (d.cv) return d.cv;   // topu süren oyuncu
    if (S.pressers && S.pressers.includes(d) && S.phase === 'play') {   // topa en yakın rakip baskıya çıkar
      const b = S.ball, gx = dirRight(d.s) ? -.035 : .035;
      return { x: clamp(b.x - gx, .02, .98), y: clamp(b.y + (d.y > b.y ? .03 : -.03), .04, .96) };
    }
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
      const wideSlot = sl[2] < .3 || sl[2] > .7;
      if (S.poss === d.s) {   // hücumda takım talimatları
        if (sl[0] === 'DEF' && wideSlot) nx += [-.03, 0, .14][tac.fb];                         // bek bindirmesi
        if (S.ctr && S.ctr.s === d.s && S.t < S.ctr.until && sl[0] !== 'DEF') nx += .11;      // kontra koşusu
        if (tac.counter === 0 && sl[0] !== 'FWD') nx -= .02;                                  // topu tut: sabırlı yerleşim
        if (tac.pass === 2 && sl[0] === 'FWD') nx += .06;                                     // uzun topa derinlik koşusu
        if (tac.pass === 0 && sl[0] !== 'DEF') { nx -= .02; ny = .5 + (ny - .5) * .9; }       // kısa pas: yakın üçgenler
      } else {                // savunmada
        ny = .5 + (ny - .5) * [.7, 1, 1.12][tac.compact] + (by - .5) * [.14, 0, -.04][tac.compact];   // dar blok topun olduğu tarafa kayar
        if (sl[0] === 'DEF') nx += [-.03, 0, .05][tac.trap];                                  // ofsayt için hat öne çıkar
      }
      if (S.kickT > 0) nx = Math.min(nx, .47);
      nx += Math.sin(S.t * .9 + d.ph) * .012; ny += Math.cos(S.t * .7 + d.ph * 2) * .016;
    }
    return toPitch(d.s, clamp(nx, .02, .97), clamp(ny, .04, .96));
  }

  /* ---------- Senaryo (top hareketleri) ---------- */
  const mv = (tf, dur, o) => ({ dur, arc: (o && o.arc) || 0, tf, end: o && o.end });
  const wait = (dur, end) => ({ dur, end });
  const waitFor = (cond, max, end) => ({ dur: max, cond, end });   // koşul sağlanınca (en geç max saniyede) biter
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
    const k = st.cond && st.cond() ? 1 : Math.min(1, sc.t / st.dur);
    if (st.tf) {
      const tg = st.tf(), e = ease(k);
      S.ball.x = lerp(sc.from.x, tg.x, e); S.ball.y = lerp(sc.from.y, tg.y, e); S.ball.z = Math.sin(k * Math.PI) * st.arc;
    }
    if (k >= 1) { const cur = S.script; if (st.end) st.end(); if (S.script === cur) next(); }
  }

  function kickoff(s) {
    clearOv();
    S.poss = s; S.kickT = 2; S.passT = 1.6;
    S.ball.x = .5; S.ball.y = .5; S.ball.z = 0;
    S.holder = S.dots.filter(d => d.s === s && active(d) && d.i > 0).pop() || dot(s, 0);
  }
  function ambientPass() {
    const h = S.holder; if (!h || !active(h)) { S.holder = S.dots.find(d => d.s === S.poss && active(d) && d.i > 4) || dot(S.poss, 0); return; }
    const s = h.s, share = S.m.st.poss[s] / Math.max(1, S.m.st.poss[0] + S.m.st.poss[1]);
    const mates = S.dots.filter(d => d.s === s && d !== h && active(d));
    if (!mates.length) return;
    // top sürme: önü boşsa oyuncu topu ileri taşır, pas sonra gelir
    const tc = S.m.s[s].tac, ctr = S.ctr && S.ctr.s === s && S.t < S.ctr.until;
    const hx = ownX(s, h.x), free = S.dots.filter(d => d.s !== s && active(d)).every(d => (S.pressers || []).includes(d) || pdist(d, h) > .05);
    if (h.i > 0 && !h.cv && free && hx < .8 && Math.random() < (ctr ? .65 : [.32, .42, .3][tc.pass])) {
      const fy = dirRight(s) ? h.y : 1 - h.y, ny = clamp(fy + (Math.random() - .5) * .12, .08, .92);
      h.cv = toPitch(s, Math.min(.82, hx + .07 + Math.random() * .07), ny);
      S.passT = .5 + Math.random() * .4; return;
    }
    h.cv = null;
    const wts = mates.map(d => {
      const dist = Math.hypot(d.x - h.x, (d.y - h.y) * .65), fwd = ownX(s, d.x) - ownX(s, h.x);
      const pref = [.12, .17, .32][tc.pass], fw = ctr ? 3.2 : tc.counter === 0 ? 1.15 : [1.25, 1.5, 2.3][tc.pass], role = S.m.s[s].slots[d.i][0];
      return (d.i === 0 ? (tc.pass === 0 ? .3 : .12) : 1) * (1 / (.06 + Math.abs(dist - pref))) * (fwd > 0 ? fw : 1) * (tc.pass === 2 && role === 'FWD' ? 1.7 : 1) * (ctr && role === 'FWD' ? 1.8 : 1);
    });
    let r = Math.random() * wts.reduce((a, b) => a + b, 0), rec = mates[0];
    for (let i = 0; i < mates.length; i++) { r -= wts[i]; if (r <= 0) { rec = mates[i]; break; } }
    const near = S.dots.filter(d => d.s !== s && active(d) && d.i > 0).reduce((mn, d) => Math.min(mn, Math.hypot(d.x - rec.x, (d.y - rec.y) * .65)), 1);
    const otc = S.m.s[1 - s].tac;
    if (Math.random() < (.05 + .3 * (1 - share) + Math.max(0, .1 - near) * 2.2 + (otc.press - 1) * .04) * [.85, 1, 1.18][otc.tackle] * [.85, 1, 1.12][tc.pass]) {
      const opp = S.dots.filter(d => d.s !== s && active(d) && d.i > 0);
      if (opp.length) {
        const thief = opp.reduce((a, b) => (Math.hypot(a.x - rec.x, a.y - rec.y) < Math.hypot(b.x - rec.x, b.y - rec.y) ? a : b));
        run([mv(() => thief, .38 + pdist(thief, h) * .9, { end: () => { S.holder = thief; S.poss = thief.s; if (Math.random() < .3) pop(thief, otc.tackle === 2 && Math.random() < .5 ? 'SERT MÜDAHALE' : 'TOP KAPMA', '#58c4dd'); if (otc.counter === 2) { S.ctr = { s: thief.s, until: S.t + 2.6 }; S.ctrN = (S.ctrN || 0) + 1; S.passT = .25; if (Math.random() < .35) pop(thief, 'KONTRA!', '#ffc93c'); } else if (otc.counter === 0) S.passT = 1.1; } })], false);
        S.holder = null; return;
      }
    }
    const dd = pdist(rec, h), far = dd > (tc.pass === 2 ? .22 : .3);
    run([mv(() => rec, .3 + dd * 1.4, { arc: far ? .5 : 0, end: () => { S.holder = rec; FM.Audio.kick(); } })], false);
    S.holder = null;
  }

  /* Hücum kurma: pozisyondan önce top bulunduğu yerden pas pas ileri taşınır, takım blok hâlinde çıkar */
  function buildUp(s, toX, exclude) {
    const steps = [], b = { x: S.ball.x, y: S.ball.y }, mates = () => S.dots.filter(d => d.s === s && d.i > 0 && active(d) && !exclude.includes(d));
    let cur = S.holder && S.holder.s === s && active(S.holder) ? S.holder : null;
    if (!cur) {   // önce topu kazan
      const c = mates().sort((x, y) => pdist(x, b) - pdist(y, b))[0]; if (!c) return steps;
      cur = c; const d0 = pdist(c, b), kontra = S.m.s[s].tac.counter === 2;
      steps.push(mv(() => c, .3 + d0 * 1.1, { end: () => { S.holder = c; S.poss = s; if (kontra) { S.ctr = { s, until: S.t + 3 }; S.ctrN = (S.ctrN || 0) + 1; pop(c, 'KONTRA!', '#ffc93c'); } else if (Math.random() < .35) pop(c, 'TOP KAPMA', '#58c4dd'); } }));
    }
    const tc = S.m.s[s].tac, maxP = tc.counter === 2 && !(S.holder && S.holder.s === s) ? 2 : tc.pass === 0 ? 5 : tc.pass === 2 ? 2 : 4, pref = [.15, .2, .3][tc.pass], pause = tc.counter === 2 ? .05 : tc.pass === 0 ? .28 : .18;
    let x = ownX(s, cur.x), guard = 0;
    while (x < toX && guard++ < maxP) {
      const prev = cur, opts = mates().filter(d => d !== prev && ownX(s, d.x) > x + .04 && pdist(d, prev) < (tc.pass === 2 ? .5 : .38));
      if (!opts.length) break;
      const nx = opts.sort((a, c) => Math.abs(pdist(a, prev) - pref) - Math.abs(pdist(c, prev) - pref))[Math.floor(Math.random() * Math.min(2, opts.length))];
      const dd = pdist(nx, prev);
      steps.push(wait(pause + Math.random() * .2), mv(() => nx, .3 + dd * 1.4, { arc: dd > .3 ? .4 : 0, end: () => { S.holder = nx; FM.Audio.kick(); } }));
      cur = nx; x = ownX(s, nx.x);
    }
    return steps;
  }
  const near = (d, p) => () => pdist(d, p) < .035;

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
    if (!replay) steps.push(...buildUp(s, e.kind === 'open' ? .58 : e.kind === 'pen' ? .66 : .62, e.kind === 'open' ? [sh] : []));
    if (e.kind === 'pen') {
      const spot = toPitch(s, .885, .5);
      others.forEach((d, k) => { d.ov = toPitch(s, .775 - (k % 3) * .022, .14 + k / Math.max(1, others.length - 1) * .72); });
      sh.ov = toPitch(s, .84, .5); gk.ov = toPitch(s, .985, .5);
      if (e.varPen && !replay) steps.push(wait(.01, () => { A.whistle(1); S.varSnap = snap(s, sh); varShow('PENALTI İNCELEMESİ', 'Hakem monitöre gidiyor', ''); startVarCam(e, s, 'pen'); S.refs[0].tx = MON.x; S.refs[0].ty = MON.y - .012; S.varOn = true; }), wait(2.6, () => { varShow('PENALTI', 'VAR kararı: penaltı noktası', 'ok'); varVerdict('pen'); S.varOn = false; }), wait(1.4, varHide));
      steps.push(mv(() => spot, .35, { end: () => { S.holder = null; A.whistle(1); pop(sh, 'PENALTI!', '#ffc93c'); } }), waitFor(() => pdist(sh, toPitch(s, .84, .5)) < .03, 2.4), wait(.9, () => { sh.ov = toPitch(s, .875, .5); }), wait(.3, () => A.kick()));
    } else if (e.kind === 'fk') {
      const spot = toPitch(s, .74, .5 + side * .13);
      S.dots.filter(d => d.s === o && d.i > 0 && active(d)).slice(0, 3).forEach((d, k) => { d.ov = toPitch(s, .835, .5 + side * .09 + (k - 1) * .032); });
      sh.ov = toPitch(s, .72, .5 + side * .14);
      steps.push(mv(() => spot, .35, { end: () => { S.holder = null; A.whistle(1); pop(sh, 'FRİKİK', '#ffc93c'); } }), waitFor(() => pdist(sh, toPitch(s, .72, .5 + side * .14)) < .04, 2.2), wait(.5, () => { sh.ov = spot; }), wait(.35, () => A.kick()));
      arc = .8;
    } else if (e.kind === 'ck') {
      const corner = toPitch(s, .992, flank < .5 ? .008 : .992), tk = as || sh;
      tk.ov = corner; if (tk !== sh) sh.ov = toPitch(s, .92, .44 + Math.random() * .12);
      S.dots.filter(d => d.s === s && d.i > 0 && d !== tk && d !== sh && active(d)).slice(-4).forEach((d, k) => { d.ov = toPitch(s, .87 + (k % 2) * .04, .36 + k * .09); });
      steps.push(mv(() => corner, .45, { end: () => { S.holder = null; pop(tk, 'KORNER', '#ffc93c'); } }), waitFor(near(tk, corner), 2.4), wait(.4, () => A.kick()), mv(() => sh, .75, { arc: 1 }), wait(.08, () => A.kick()));
      arc = .15;
    } else {
      if (as !== sh) as.ov = toPitch(s, .7, flank);
      sh.ov = toPitch(s, .86, v.shotY);
      if (as !== sh) { const ap = toPitch(s, .7, flank); steps.push(mv(() => as, .35 + pdist(as, S.ball) * 1.2, { arc: .3, end: () => { S.holder = as; A.kick(); } }), waitFor(() => pdist(as, ap) < .05, 1.2)); }
      const spt = toPitch(s, .86, v.shotY);
      steps.push(waitFor(() => pdist(sh, spt) < .06, 1.6), mv(() => sh, .45, { end: () => { S.holder = sh; A.kick(); } }), wait(.22, () => { S.holder = null; A.kick(); }));
    }
    const done = (holder, poss) => () => { if (replay) return replayNext(); clearOv(); S.holder = holder; S.poss = poss; S.passT = .8; };
    if (e.out === 'goal') {
      const gp = toPitch(s, 1.022, .5 + side * .035);
      if (e.kind === 'pen') steps.push(wait(.01, () => { gk.ov = toPitch(s, .98, .5 - side * .05); }));
      if ((e.varNo || e.varOk) && !replay) steps.push(wait(.01, () => { S.varSnap = snap(s, sh); }));
      steps.push(mv(() => gp, .3, { arc, end: () => goalFx(e, s, flank, replay) }));
      if ((e.varNo || e.varOk) && !replay) {
        steps.push(wait(1.5, () => { FM.Audio.whistle(1); varShow('VAR · GOL İNCELEMESİ', 'Pozisyon kontrol ediliyor', ''); startVarCam(e, s, 'goal'); S.refs[0].tx = MON.x; S.refs[0].ty = MON.y - .012; S.varOn = true; clearOv(); }),
          wait(1.4, () => { varShow('VAR · GOL İNCELEMESİ', 'Hakem monitörde', ''); }),
          wait(1.5, () => varEnd(e, s)), wait(e.varNo ? 1.6 : 1.4, varHide));
        steps.push(wait(.3, () => (e.varNo ? done(gk, o)() : kickoff(o))));
      } else steps.push(wait(2.6, () => (replay ? replayNext() : kickoff(o))));
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
  /* ---------- VAR ---------- */
  const MON = { x: .46, y: 1.03 };
  function varShow(head, sub, res) {
    const el = $('mvVar'); el.className = 'mv-var ' + (res || 'chk');
    el.innerHTML = `<b>VAR</b><div><strong>${head}</strong><span>${sub}</span></div>`; el.hidden = false;
  }
  function varHide() { $('mvVar').hidden = true; S.varOn = false; const c = $('mvVarCam'); if (c) c.hidden = true; S.varCam = null; const pt = $('mvVar') && $('mvVar').parentElement; if (pt) pt.classList.remove('vc-on'); }

  /* ---------- VAR köşe görüntüsü: pozisyonun kuşbakışı tekrarı ---------- */
  function snap(s, shD) {
    return { s, dir: dirRight(s) ? 1 : -1, ball: { x: S.ball.x, y: S.ball.y }, dots: S.dots.filter(active).map(d => ({ x: d.x, y: d.y, s: d.s, gk: d.i === 0, num: FM.P(S.m.s[d.s].on[d.i]).num, sh: d === shD })) };
  }
  function startVarCam(e, s, mode) {
    const sn = S.varSnap || snap(s, dotFor(s, e.pid)); S.varSnap = null;
    const dir = sn.dir, def = sn.dots.filter(d => d.s !== s).sort((a, b) => (b.x - a.x) * dir);
    const lineX = def.length > 1 ? def[1].x : (dir > 0 ? .82 : .18), sh = sn.dots.find(d => d.sh) || sn.dots.find(d => d.s === s);
    if (mode === 'pen' && sh) {
      const tx = dir > 0 ? .9 : .1, ty = .36 + Math.random() * .28, dx = tx - sh.x, dy = ty - sh.y;
      for (const d of sn.dots) if (!d.gk) { d.x = clamp(d.x + dx, .02, .98); d.y = clamp(d.y + dy, .03, .97); }
      sn.ball = { x: sh.x + dir * .012, y: sh.y };
    }
    const kind = mode === 'pen' ? 'foul' : e.varNo ? (e.varNo === 'ofsayt' ? 'off' : 'foul') : (Math.random() < .7 ? 'off' : 'foul');
    if (kind === 'off' && sh) sh.x = lineX + dir * (e.varNo ? .008 : -.011);
    const foe = kind === 'foul' && sh ? sn.dots.filter(d => d.s !== s && !d.gk).sort((a, b) => Math.hypot(a.x - sh.x, a.y - sh.y) - Math.hypot(b.x - sh.x, b.y - sh.y))[0] : null;
    if (foe && sh) { foe.x = sh.x - dir * .012; foe.y = sh.y + .02; }
    const tag = kind === 'off' ? 'Ofsayt çizgisi' : mode === 'pen' ? 'Faul kontrolü' : e.varNo === 'elle oynama' ? 'Elle oynama kontrolü' : 'Faul kontrolü';
    S.varCam = { t: 0, kind, lineX, sn, sh, foe, verdict: null, mode, clip: 2 + Math.floor(Math.random() * 40) };
    const el = $('mvVarCam'); el.hidden = false; el.className = 'mv-varcam'; el.parentElement.classList.add('vc-on');
    $('vcTitle').textContent = mode === 'pen' ? 'PENALTI İNCELEMESİ' : 'GOL İNCELEMESİ'; $('vcTag').textContent = tag;
    const cv = $('vcCanvas'), w = cv.clientWidth || 300, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr); cv.height = Math.round(w * .6 * dpr); cv.style.height = Math.round(w * .6) + 'px';
  }
  function varVerdict(v) {
    const V = S.varCam; if (!V) return;
    V.verdict = v; V.vt = V.t;
    const el = $('mvVarCam'); el.className = 'mv-varcam ' + (v === 'ok' ? 'ok' : 'no');
    $('vcTitle').textContent = v === 'pen' ? 'PENALTI' : v === 'ok' ? 'GOL GEÇERLİ' : 'GOL İPTAL';
    $('vcTag').textContent = V.kind === 'off' ? (v === 'no' ? 'Ofsayt' : 'Ofsayt değil') : v === 'ok' ? 'Temiz pozisyon' : V.mode === 'pen' ? 'Faul var' : 'İhlal var';
  }
  function drawVarCam(dt) {
    const V = S.varCam, cv = $('vcCanvas'); if (!V || !cv) return;
    V.t += dt;
    const g = cv.getContext('2d'), dpr = cv.width / (cv.clientWidth || 1), w = cv.width / dpr, h = cv.height / dpr, sn = V.sn, dir = sn.dir;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const zoom = 1.18 - Math.min(1, V.t / 2.4) * .18, vw = 46 * zoom, vh = vw * h / w, focus = V.sh || sn.ball;
    const cxm = clamp(focus.x * 105 + dir * 7, vw / 2 - 4, 109 - vw / 2), cym = clamp(focus.y * 68, vh / 2 - 4, 72 - vh / 2);
    const X = xm => (xm - (cxm - vw / 2)) / vw * w, Y = ym => (ym - (cym - vh / 2)) / vh * h, k = w / vw;
    g.fillStyle = '#245f33'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#2e7a41' : '#2a703c'; g.fillRect(X(i * 8.75), Y(0), 8.75 * k + .5, 68 * k); }
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = Math.max(1, k * .14);
    const rect = (x0, y0, x1, y1) => g.strokeRect(X(x0), Y(y0), (x1 - x0) * k, (y1 - y0) * k);
    rect(0, 0, 105, 68); g.beginPath(); g.moveTo(X(52.5), Y(0)); g.lineTo(X(52.5), Y(68)); g.stroke();
    g.beginPath(); g.arc(X(52.5), Y(34), 9.15 * k, 0, 6.29); g.stroke();
    for (const gx of [0, 105]) {
      const d = gx ? -1 : 1;
      rect(Math.min(gx, gx + d * 16.5), 13.85, Math.max(gx, gx + d * 16.5), 54.15); rect(Math.min(gx, gx + d * 5.5), 24.85, Math.max(gx, gx + d * 5.5), 43.15);
      g.beginPath(); g.arc(X(gx + d * 11), Y(34), Math.max(1, k * .25), 0, 6.29); g.fillStyle = '#fff'; g.fill();
      g.beginPath(); g.arc(X(gx + d * 11), Y(34), 9.15 * k, gx ? Math.PI * .7 : -Math.PI * .3, gx ? Math.PI * 1.3 : Math.PI * .3); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(X(gx ? 105 : -2), Y(30.34), 2 * k, 7.32 * k); g.strokeRect(X(gx ? 105 : -2), Y(30.34), 2 * k, 7.32 * k);
    }
    const col = V.verdict == null ? '#ffc93c' : V.verdict === 'ok' ? '#4cc38a' : '#ef5350';
    if (V.kind === 'off') {
      const p = clamp((V.t - .5) / .9, 0, 1), lx = X(V.lineX * 105);
      g.strokeStyle = col; g.lineWidth = 2.5; g.shadowColor = col; g.shadowBlur = 8;
      g.beginPath(); g.moveTo(lx, 0); g.lineTo(lx, h * p); g.stroke(); g.shadowBlur = 0;
      if (p >= 1 && V.sh) { g.strokeStyle = '#58c4dd'; g.lineWidth = 1.5; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(X(V.sh.x * 105), 0); g.lineTo(X(V.sh.x * 105), h); g.stroke(); g.setLineDash([]); }
    }
    const r = Math.max(5, k * 1.05);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const d of sn.dots) {
      const x = X(d.x * 105), y = Y(d.y * 68); if (x < -r || x > w + r || y < -r || y > h + r) continue;
      const kit = S.kits[d.s];
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(x + 1.5, y + 2, r, r * .7, 0, 0, 6.29); g.fill();
      g.beginPath(); g.arc(x, y, r, 0, 6.29); g.fillStyle = d.gk ? kit.gk : kit.fill; g.fill(); g.lineWidth = Math.max(1.2, r * .25); g.strokeStyle = d.gk ? '#f3efe4' : kit.stroke; g.stroke();
      if (r >= 6) { g.fillStyle = d.gk ? '#14202f' : kit.text; g.font = `700 ${Math.round(r * 1.05)}px Barlow, sans-serif`; g.fillText(d.num, x, y + .5); }
      if (d.sh) { g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, r + 3 + Math.sin(V.t * 6) * 1.5, 0, 6.29); g.stroke(); }
    }
    const b = sn.ball; g.beginPath(); g.arc(X(b.x * 105), Y(b.y * 68), Math.max(2.5, k * .45), 0, 6.29); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#14202f'; g.lineWidth = 1; g.stroke();
    if (V.kind === 'foul' && V.sh && V.t > .5) {
      const x = X(V.sh.x * 105), y = Y(V.sh.y * 68) + r * .4, rr = r * 3 + Math.sin(V.t * 4) * 2;
      g.strokeStyle = col; g.lineWidth = 2.5; g.shadowColor = col; g.shadowBlur = 8; g.beginPath(); g.arc(x, y, rr, 0, 6.29); g.stroke(); g.shadowBlur = 0;
    }
    g.fillStyle = 'rgba(0,0,0,.06)'; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
    g.font = '600 11px Barlow, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = 'rgba(255,255,255,.8)';
    const fr = Math.floor(V.t * 25) % 25;
    g.fillText(`TEKRAR  00:${String(V.clip).padStart(2, '0')}:${String(fr).padStart(2, '0')}`, 8, h - 8);
    if (V.verdict == null && Math.floor(V.t * 2) % 2) { g.fillStyle = '#ef5350'; g.beginPath(); g.arc(w - 12, h - 12, 4, 0, 6.29); g.fill(); }
  }
  function varEnd(e, s) {
    S.varOn = false;
    const p = FM.P(e.pid);
    if (e.varNo) {
      S.disp[s]--; paintScore(s); S.conf = []; S.cheer[s] = 0; S.cheer[1 - s] = .8; $('tvb').classList.remove('show');
      varShow('GOL İPTAL', 'Gerekçe: ' + e.varNo, 'no'); varVerdict('no'); FM.Audio.groan();
      setMgr(s, 'despair', 2.5); setMgr(1 - s, 'cheer', 2);
    } else { varShow('GOL GEÇERLİ', 'VAR kararı onayladı', 'ok'); varVerdict('ok'); S.cheer[s] = 1; FM.Audio.cheer(); setMgr(s, 'cheer', 2); }
    feed({ min: e.min, side: e.side, type: e.varNo ? 'var no' : 'var ok', text: e.text });
    if (e.dispute === S.user) showDispute(e.why);
  }

  /* ---------- Teknik direktörler ---------- */
  const BENCH = [.36, .64];
  function setMgr(k, st, t) { const M = S.mgrs[k]; if (!M || M.gone || M.st === 'out') return; M.st = st; M.stT = t; if (st !== 'protest') M.ty = 1.035; }
  function showDispute(why) {
    if (S.m.s[S.user].mgr.out || S.ended) return;
    const el = $('mvDisp'); S.dispWhy = why; S.dispT = 7;
    el.innerHTML = `<p><strong>Tartışmalı karar:</strong> ${esc(why)}</p><div class="row"><button class="btn" data-mv="calm">Sakin kal</button><button class="btn danger" data-mv="protest">Hakeme itiraz et</button></div><i id="mvDispBar"></i>`;
    el.hidden = false;
  }
  function hideDispute() { const el = $('mvDisp'); if (el) el.hidden = true; S.dispT = 0; }
  function playProtest(e) {
    const M = S.mgrs[e.side], A = FM.Audio;
    if (!M || M.gone) return;
    M.st = 'protest'; M.stT = 3.2; M.ty = 1.006; M.tx = clamp(M.x + (e.side ? -.035 : .035), .26, .74);
    const steps = [wait(1.3)];
    if (e.card) {
      steps.push(wait(.01, () => { S.refs[0].tx = M.tx; S.refs[0].ty = .975; }), wait(1.2, () => {
        A.whistle(1);
        S.pops.push({ x: M.x, y: M.y, card: e.card === 'red' ? '#ef5350' : '#ffc93c', t: 0, mgr: true });
        if (e.card === 'red') { M.st = 'out'; M.stT = 99; if (e.side === S.user) { talk('Tribüne gönderildin. Yardımcın değişiklik yapabilir ama taktik talimatı veremezsin.'); paintUi(); } }
        else { M.st = 'despair'; M.stT = 1.6; }
      }), wait(1));
    }
    run(steps, true);
  }
  function drawMgr(g, k, r0) {
    const M = S.mgrs[k]; if (!M || M.gone) return;
    const q = S.st.proj(M.x, M.y), r = Math.max(3.2, r0 * q.s * .8), kit = S.kits[k], t = S.rt + M.ph;
    let pose = M.st, lift = 0;
    if (pose === 'idle') pose = Math.abs(M.tx - M.x) > .004 ? 'walk' : 'watch';
    if (pose === 'cheer') lift = Math.abs(Math.sin(t * 9)) * r * .9;
    const x = q.X, by = q.Y - lift;
    g.globalAlpha = M.a;
    g.fillStyle = 'rgba(0,0,0,.32)'; g.beginPath(); g.ellipse(x, q.Y + r * .15, r * .75, r * .3, 0, 0, 6.29); g.fill();
    const sw = pose === 'walk' || pose === 'out' ? Math.sin(t * 8) * r * .25 : 0;
    g.strokeStyle = '#11151d'; g.lineCap = 'round'; g.lineWidth = r * .34;
    g.beginPath(); g.moveTo(x - r * .2, by - r * .95); g.lineTo(x - r * .2 + sw, by); g.moveTo(x + r * .2, by - r * .95); g.lineTo(x + r * .2 - sw, by); g.stroke();
    g.fillStyle = '#1d2433'; g.beginPath(); if (g.roundRect) g.roundRect(x - r * .52, by - r * 2.15, r * 1.04, r * 1.32, r * .3); else g.rect(x - r * .52, by - r * 2.15, r * 1.04, r * 1.32); g.fill();
    g.fillStyle = kit.fill; g.fillRect(x - r * .12, by - r * 2.1, r * .24, r * .85);
    const sy = by - r * 1.95, L = [x - r * .5, sy], Rr = [x + r * .5, sy];
    const hands = {
      watch: [[x + r * .25, by - r * 1.55], [x - r * .25, by - r * 1.5]],
      walk: [[x - r * .6 - sw, by - r * 1.05], [x + r * .6 + sw, by - r * 1.05]],
      cheer: [[x - r * 1, by - r * 3.2], [x + r * 1, by - r * 3.2]],
      despair: [[x - r * .3, by - r * 2.8], [x + r * .3, by - r * 2.8]],
      protest: [[x - r * 1.05, by - r * 2.6 + Math.sin(t * 12) * r * .45], [x + r * 1.05, by - r * 2.2 + Math.cos(t * 12) * r * .45]],
      out: [[x - r * .6 - sw, by - r * 1.05], [x + r * .6 + sw, by - r * 1.05]]
    }[pose] || [[x - r * .6, by - r * 1.05], [x + r * .6, by - r * 1.05]];
    g.strokeStyle = '#1d2433'; g.lineWidth = r * .3;
    g.beginPath(); g.moveTo(L[0], L[1]); g.lineTo(hands[0][0], hands[0][1]); g.moveTo(Rr[0], Rr[1]); g.lineTo(hands[1][0], hands[1][1]); g.stroke();
    g.fillStyle = '#d9a77d'; g.beginPath(); g.arc(x, by - r * 2.5, r * .38, 0, 6.29); g.fill();
    if (S.m.s[k].mgr.yc && M.st !== 'out') { g.fillStyle = '#ffc93c'; g.fillRect(x + r * .55, by - r * 2.2, r * .32, r * .45); }
    const show = k === S.user || M.st === 'protest' || M.st === 'out';
    if (show && r >= 3.6) {
      g.font = `600 ${Math.max(9, Math.round(S.W * .013))}px Barlow, sans-serif`; g.textAlign = 'center';
      const nm = M.name.split(' ').pop(), tw = g.measureText(nm).width + 8, ty = by - r * 3.4 - (pose === 'cheer' ? r : 0);
      g.fillStyle = k === S.user ? 'rgba(255,201,60,.92)' : 'rgba(10,19,34,.8)'; g.fillRect(x - tw / 2, ty - 7, tw, 13);
      g.fillStyle = k === S.user ? '#2a1f00' : '#f3efe4'; g.fillText(nm, x, ty);
    }
    g.globalAlpha = 1;
  }
  function tickMgrs(dt) {
    for (let k = 0; k < 2; k++) {
      const M = S.mgrs[k]; if (!M || M.gone) continue;
      if (M.st !== 'idle' && M.st !== 'out') { M.stT -= dt; if (M.stT <= 0) { M.st = 'idle'; M.ty = 1.035; } }
      if (M.st === 'idle') M.tx = clamp(BENCH[k] + (S.ball.x - .5) * .09 + Math.sin(S.rt * .35 + M.ph) * .018, BENCH[k] - .055, BENCH[k] + .055);
      if (M.st === 'out') { M.tx = .5; M.ty = 1.2; M.a = Math.max(0, M.a - dt * .3); if (M.a <= 0) M.gone = true; }
      const sp = M.st === 'protest' ? 2.4 : 1.4;
      M.x += (M.tx - M.x) * Math.min(1, dt * sp); M.y += (M.ty - M.y) * Math.min(1, dt * sp);
    }
  }
  function drawMonitor(g, r0) {
    const q = S.st.proj(MON.x, MON.y), r = Math.max(3, r0 * q.s * .8);
    g.fillStyle = '#11151d'; g.fillRect(q.X - r * .08, q.Y - r * 1.4, r * .16, r * 1.4);
    g.fillStyle = S.varOn ? '#58c4dd' : '#2a3a52'; g.strokeStyle = '#0a1322'; g.lineWidth = 1;
    g.fillRect(q.X - r * .9, q.Y - r * 2.3, r * 1.8, r * 1.1); g.strokeRect(q.X - r * .9, q.Y - r * 2.3, r * 1.8, r * 1.1);
    if (r >= 4) { g.fillStyle = '#0a1322'; g.font = `800 ${Math.round(r * .7)}px 'Barlow Condensed', sans-serif`; g.textAlign = 'center'; g.fillText('VAR', q.X, q.Y - r * 1.72); }
  }
  function goalFx(e, s, flank, replay) {
    if (!replay) { setMgr(s, 'cheer', 2.6); setMgr(1 - s, 'despair', 2.4); }
    const t = FM.T(S.m.s[s].tid), p = FM.P(e.pid), A = FM.Audio;
    if (!replay) { S.disp[s]++; paintScore(s); }
    A.cheer();
    if (!replay && A.chant) { const sd = t.id, dv = !!S.m.derby; setTimeout(() => { if (S && !S.ended) A.chant(sd, dv); }, 2200); }
    S.cheer[s] = 1;
    if (s === 0) { S.choreoA = Math.max(S.choreoA, .9); S.choreo = 1.2; }
    S.shake = 1; S.shakeSide = dirRight(s) ? 1 : 0;
    const corner = toPitch(s, .9, flank < .5 ? .1 : .9);
    S.dots.forEach(d => { if (d.s === s && d.i > 0) d.ov = { x: corner.x + (Math.random() - .5) * .07, y: corner.y + (Math.random() - .5) * .1 }; });
    for (let i = 0; i < 90; i++) S.conf.push({ x: corner.x + (Math.random() - .5) * .3, y: -.05 - Math.random() * .4, vx: (Math.random() - .5) * .12, vy: .25 + Math.random() * .35, r: Math.random() * 6.28, c: [t.c1, t.c2, '#ffc93c'][i % 3], life: 3 });
    const nm = p ? p.name.split(' ') : ['']; banner(t, replay ? 'TEKRAR' : 'GOOOL', `${nm.length > 1 ? nm[0][0] + '. ' + nm.slice(1).join(' ') : nm[0]}  ${e.min}'`);
  }
  /* TV skor bandı: ortadaki altıgen takım renginde yanar, altından golcü şeridi iner */
  function banner(t, head, sub) {
    const el = $('tvb'), ink = lum(t.c1) > 150 ? '#14202f' : '#ffffff';
    el.style.setProperty('--g1', t.c1); el.style.setProperty('--g2', lum(t.c1) > 150 && lum(t.c2) > 150 ? '#14202f' : t.c2); el.style.setProperty('--gi', ink);
    $('tvbGoal').textContent = head; $('tvbSub').textContent = sub;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(S.bannerT); S.bannerT = setTimeout(() => { const x = $('tvb'); if (x) x.classList.remove('show'); }, 3000 / S.speed + 400);
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
  /* Spiker balonu: saha üstünde kısa süre görünür */
  function talk(text, tag) {
    const el = $('mvTalk'); if (!el) return;
    const d = document.createElement('div');
    d.className = 'tk'; d.innerHTML = `<b>${tag || '●'}</b><span>${esc(text)}</span>`;
    el.appendChild(d);
    while (el.children.length > 2) el.firstChild.remove();
    setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 400); }, 4600);
  }
  function feed(e, cls) {
    talk(e.text, e.min + "'");
    const li = document.createElement('li');
    li.className = 'fd ' + (cls || e.type) + (e.out ? ' ' + e.out : '') + (e.side != null && e.side === S.user ? ' mine' : '');
    li.innerHTML = `<b>${e.min}'</b><span>${esc(e.text)}</span>`;
    const f = $('mvFeed'); f.prepend(li);
    while (f.children.length > 40) f.lastChild.remove();
  }
  function handle(e) {
    const A = FM.Audio;
    if (!e.fed) feed(e.type === 'chance' && (e.varNo || e.varOk) ? { ...e, text: `${FM.P(e.pid) ? FM.P(e.pid).name : ''} topu ağlara gönderdi! VAR inceleme yapıyor…` } : e);
    if (e.dispute === S.user && !e.varNo) showDispute(e.why);
    if (e.type === 'protest') return playProtest(e);
    if (e.type === 'chance') { if (e.out === 'goal' && !e.varNo) S.goals.push(e); return playChance(e); }
    if (e.type === 'yellow' || e.type === 'red') {
      const pos = S.last[e.pid] || { x: .5, y: .5 };
      S.pops.push({ x: pos.x, y: pos.y, card: e.type === 'red' ? '#ef5350' : '#ffc93c', t: 0 });
      S.refs[0].tx = pos.x + .02; S.refs[0].ty = pos.y + .03;
      A.whistle(1);
      return run([wait(.9)], true);
    }
    if (e.type === 'off') {
      const d = dotFor(e.side, e.pid); A.whistle(1); pop(d, 'OFSAYT', '#ffc93c');
      S.refs[1].tx = d.x; S.refs[2].tx = d.x; S.holder = null;
      return run([wait(.9, () => { S.poss = 1 - e.side; S.holder = dot(1 - e.side, 0); S.passT = .6; })], true);
    }
    if (e.type === 'inj') { A.whistle(1); if (e.need && e.side === S.user) return injPanel(e); return run([wait(.7)], true); }
    if (e.type === 'ht') { A.whistle(2); S.htPending = true; return htOverlay(); }
    if (e.type === 'et') { A.whistle(2); S.pops.push({ x: .5, y: .45, text: 'UZATMALAR', color: '#ffc93c', t: -1 }); S.second = false; kickoff(0); return run([wait(1.6)], true); }
    if (e.type === 'pens') return playPens();
    if (e.type === 'ft') return fullTime();
  }
  /* Devre arası konuşması ve kenardan talimatlar: kullanıcı tarafının maç gücünü etkiler */
  const HT = [['praise', 'Harika gidiyorsunuz, devam!'], ['demand', 'Bu yetmez, daha fazlasını istiyorum'], ['calm', 'Sakin olun, plana sadık kalın'], ['angry', 'Bu oyun kabul edilemez!']];
  const SHOUTS = [['attack', 'Öne çıkın!', { att: 1.08, def: .95 }], ['tight', 'Arkayı kapatın!', { def: 1.08, att: .94 }], ['focus', 'Konsantre olun!', { ctl: 1.06 }], ['enc', 'Hadi, yapabilirsiniz!', { att: 1.03, def: 1.03, ctl: 1.03 }]];
  function htTalk(k) {
    const side = S.m.s[S.user], d = S.m.score[S.user] - S.m.score[1 - S.user];
    if (side.mgr.out) { S.htTalk = 'Tribündesin: soyunma odasına inemedin, konuşmayı yardımcın yaptı.'; return htOverlay(); }
    let f, txt;
    if (k === 'praise') { f = d > 0 ? 1.025 : d < 0 ? .985 : 1.01; txt = d > 0 ? 'Oyuncular övgüyle coştu.' : d < 0 ? 'Geride olmalarına rağmen övülmek oyuncuları rahatlattı, belki fazla.' : 'Oyuncular moral buldu.'; }
    else if (k === 'demand') { f = d <= 0 ? 1.04 : .995; txt = d <= 0 ? 'Mesaj alındı, takım daha istekli çıkıyor.' : 'Öndeyken bu baskı oyuncuları şaşırttı.'; }
    else if (k === 'calm') { f = 1.015; txt = 'Takım sakinleşti, plana odaklandı.'; }
    else { f = d < 0 ? (Math.random() < .55 ? 1.06 : .97) : .97; txt = f > 1 ? 'Öfken işe yaradı, oyuncular hırslandı!' : 'Sert sözler bazı oyuncuları kırdı.'; }
    side.mod = (side.mod || 1) * f;
    for (const id of side.on) if (id != null) { const p = FM.P(id); p.mor = clamp(p.mor + (f > 1.01 ? 3 : f < 1 ? -3 : 1), 20, 100); }
    S.htTalk = txt + (f > 1 ? ' (ikinci yarı gücü ↑)' : f < 1 ? ' (ikinci yarı gücü ↓)' : '');
    feed({ min: 45, type: 'talk', text: 'Devre arası: ' + txt });
    htOverlay();
  }
  function shoutPanel() {
    const side = S.m.s[S.user], cd = S.shoutCd && S.m.min < S.shoutCd;
    if (!S.htPending) S.wasPaused = S.paused; S.paused = true;
    overlay(`<h3>Kenardan talimat</h3><p class="muted">${side.mgr.out ? 'Tribündesin: kenardan talimat veremezsin.' : cd ? `Oyuncular son talimatını uyguluyor. Yeni talimat ${S.shoutCd}. dakikadan sonra.` : 'Etkisi 10 dakika sürer. Sonraki talimat için 15 dakika beklemen gerekir.'}</p>
      <div class="ht-talk">${SHOUTS.map(([k, n]) => `<button class="btn" data-mv="shout" data-v="${k}" ${cd || side.mgr.out ? 'disabled' : ''}>${n}</button>`).join('')}</div>${side.shout ? `<p class="ht-res">Etkin: “${SHOUTS.find(x => x[0] === side.shout.k)[1]}” (${side.shout.until}. dakikaya kadar)</p>` : ''}
      <div class="row end"><button class="btn" data-mv="pclose">Kapat</button></div>`);
  }
  function shout(k) {
    const side = S.m.s[S.user], sh = SHOUTS.find(x => x[0] === k);
    side.shout = { ...sh[2], k, until: S.m.min + 10 }; S.shoutCd = S.m.min + 15;
    feed({ min: S.m.min, type: 'talk', text: `Teknik direktör kenardan bağırıyor: “${sh[1]}”` });
    if (S.mgrs && S.mgrs[S.user]) setMgr(S.user, 'protest', 2.2);
    closeOverlay();
  }
  function htOverlay() {
    S.paused = true;
    const talkH = S.htTalk ? `<p class="ht-res">${S.htTalk}</p>` : `<p class="ht-lbl">Soyunma odası konuşması</p><div class="ht-talk">${HT.map(([k, n]) => `<button class="btn" data-mv="httalk" data-v="${k}">${n}</button>`).join('')}</div>`;
    const adv = FM.Depth ? `<div class="ht-adv"><p class="ht-lbl">Yardımcı antrenör</p><ul>${FM.Depth.htAdvice(S.m, S.user).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
    overlay(`<h3>Devre arası</h3>${statsHtml()}${adv}${talkH}<div class="row"><button class="btn" data-mv="tacp">Taktik</button><button class="btn" data-mv="sub">Değişiklik</button><button class="btn primary" data-mv="second">İkinci yarıyı başlat</button></div>`);
  }
  function fullTime() {
    const m = S.m, A = FM.Audio;
    S.disp = m.score.slice(); paintScore();
    A.whistle(3); A.crowd(false);
    S.ended = true; S.paused = true; S.phase = 'end'; S.script = null; S.queue = [];
    const ws = FM.winnerSide(m), res = m.cup && ws >= 0 ? (ws === S.user ? 1 : -1) : m.score[S.user] - m.score[1 - S.user];
    if (S.fin && ws >= 0) S.cheer[ws] = 1;
    $('mvOverlay').classList.toggle('fin', S.fin);
    const head = res > 0 ? (S.fin ? 'KUPA SENİN!' : m.cup ? 'Tur atladın!' : 'Galibiyet!') : res < 0 ? (m.cup ? 'Kupaya veda' : 'Mağlubiyet') : 'Beraberlik';
    const goals = m.log.filter(l => l.type === 'goal').map(l => `<li class="${l.side ? 'r' : 'l'}">${esc(FM.P(l.pid) ? FM.P(l.pid).name : '')} ${l.min}'${l.kind === 'pen' ? ' (P)' : ''}</li>`).join('');
    // puanları önizle (kesin değerler maç kaydedilince yazılır)
    const side = m.s[S.user], d = m.score[S.user] - m.score[1 - S.user];
    const rts = side.played.map(id => ({ p: FM.P(id), r: clamp(m.rt[id] + (d > 0 ? .3 : d < 0 ? -.2 : 0), 3, 10) })).filter(x => x.p).sort((a, b) => b.r - a.r);
    let best = null; for (const s of m.s) for (const id of s.played) if (FM.P(id) && (best == null || m.rt[id] > m.rt[best])) best = id;
    S.ftHtml = `${S.fin && ws >= 0 ? `<img class="trophy won" src="assets/trophy.svg" alt="" width="84" height="98"><p class="eyebrow">Kupa şampiyonu: ${esc(FM.T(m.s[ws].tid).name)}</p>` : ''}<h3 class="${res > 0 ? 'win' : res < 0 ? 'loss' : ''}">${head}</h3><p class="ft-score">${m.score[0]} – ${m.score[1]}${m.pens ? ` <small>(pen. ${m.pens.sc[0]}–${m.pens.sc[1]})</small>` : ''}</p><ul class="ft-goals">${goals}</ul>
      ${best != null ? `<p class="motm">Maçın adamı: <b>${esc(FM.P(best).name)}</b></p>` : ''}
      <div class="rts">${rts.map(x => `<span class="rt ${x.r >= 7.5 ? 'hi' : x.r < 6 ? 'lo' : ''}"><b>${x.r.toFixed(1)}</b>${esc(x.p.name.split(' ').pop())}</span>`).join('')}</div>
      ${statsHtml()}<div class="row">${S.goals.length ? `<button class="btn" data-mv="replay">${FM.icon('play')} Golleri izle</button>` : ''}${FM.Depth && FM.ui.reportHtml ? '<button class="btn" data-mv="report">Maç raporu</button>' : ''}<button class="btn primary" data-mv="done">Devam et</button></div>`;
    overlay(S.ftHtml);
  }
  function statsHtml() {
    const st = S.m.st, pt = Math.max(1, st.poss[0] + st.poss[1]), p0 = Math.round(st.poss[0] / pt * 100);
    const row = (l, a, b) => `<div class="st-row"><b>${a}</b><span>${l}</span><b>${b}</b><i style="--w:${a + b ? a / (a + b) * 100 : 50}%"></i></div>`;
    const xg = S.m.xg ? `<div class="st-row"><b>${S.m.xg[0].toFixed(2).replace('.', ',')}</b><span>Gol beklentisi (xG)</span><b>${S.m.xg[1].toFixed(2).replace('.', ',')}</b><i style="--w:${S.m.xg[0] + S.m.xg[1] ? S.m.xg[0] / (S.m.xg[0] + S.m.xg[1]) * 100 : 50}%"></i></div>` : '';
    return `<div class="st">${row('Topla oynama %', p0, 100 - p0)}${xg}${row('Şut', st.shots[0], st.shots[1])}${row('İsabetli şut', st.target[0], st.target[1])}${row('Pas isabeti %', st.pass[0] ? Math.round(st.passOk[0] / st.pass[0] * 100) : 0, st.pass[1] ? Math.round(st.passOk[1] / st.pass[1] * 100) : 0)}${row('Top kapma', st.tack[0], st.tack[1])}${row('Ofsayt', st.off[0], st.off[1])}${row('Korner', st.corners[0], st.corners[1])}${row('Faul', st.fouls[0], st.fouls[1])}${row('Sarı kart', st.yel[0], st.yel[1])}</div>`;
  }
  function overlay(html) { const o = $('mvOverlay'); o.innerHTML = `<div class="ov-card">${html}</div>`; o.hidden = false; }
  function closeOverlay() { $('mvOverlay').hidden = true; if (S.htPending) htOverlay(); else S.paused = S.wasPaused; }
  function paintScore(s) {
    $('mvH').textContent = S.disp[0]; $('mvA').textContent = S.disp[1];
    if (s != null) { const el = $(s ? 'mvA' : 'mvH'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  }
  function paintUi() {
    const sd = S.m.s[S.user];
    $('mvChMent').textContent = FM.MENT_TR[sd.ment]; $('mvChPress').textContent = FM.TAC.press[1][sd.tac.press];
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
  function injPanel(e) {
    const side = S.m.s[S.user], p = FM.P(e.pid);
    S.wasPaused = S.paused; S.paused = true; S.injSlot = e.slot;
    const rows = side.bench.map(id => { const b = FM.P(id); return `<button class="sb-row" data-mv="injpick" data-id="${id}"><span class="pos ${b.pos}">${FM.POS_TR[b.pos]}</span><span class="nm">${esc(b.name)}</span><span class="ov">${b.ovr}</span><span class="fit"><i style="width:${Math.round(b.fit)}%"></i></span></button>`; }).join('');
    overlay(`<h3 class="loss">Sakatlık</h3><p>${esc(p.name)} (${FM.POS_TR[side.slots[e.slot][0]]}) devam edemiyor. Yerine kimi alıyorsun?</p><div class="sb one"><div>${rows}</div></div><div class="row"><button class="btn" data-mv="injno">10 kişi devam et</button></div>`);
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
    const ct = S.ct, LY = .8;
    S.choreo = clamp((ct - .9) / 3.2, 0, 1.2);
    const say = S.say || [[.3, S.m.derby ? `Derbi günü! ${S.info.stadium} tıklım tıklım: ${S.info.att} seyirci.` : `İyi seyirler! ${S.info.stadium} tribünleri doldu, ${S.info.att} seyirci var.`], [3.2, `${S.info.home} ile ${S.info.away} karşı karşıya. ${FM.fansOf(FM.T(S.m.s[0].tid))} koreografiyi açıyor!`], [5.8, 'Takımlar selam verdi, yazı tura atılıyor. Az sonra başlıyoruz.']];
    while (S.said < say.length && ct >= say[S.said][0]) talk(say[S.said++][1]);
    S.cheer[0] = Math.max(S.cheer[0], .35);
    if (ct < 6.8) {
      for (const d of S.dots) {
        const yy = 1.22 + d.i * .045 - ct * .5;
        if (yy > LY + .02) { d.fix = true; d.x = .5 + (d.s ? .013 : -.013); d.y = yy; }
        else { d.fix = false; if (!d.cap) d.ov = { x: d.s ? .56 + d.i * .03 : .44 - d.i * .03, y: LY }; }
      }
      S.refs.forEach((r, k) => {
        const yy = 1.16 - ct * .5;
        if (yy > LY + .02) { r.fix = true; r.x = .5 + (k - 1) * .02; r.y = yy; }
        else { r.fix = false; if (!S.cerToss || k) { r.tx = .5 + (k - 1) * .03; r.ty = LY; } }
      });
      S.ball.x = .5; S.ball.y = Math.max(LY - .06, 1.14 - ct * .5);
      if (ct > 5.2 && !S.cerToss) {
        S.cerToss = true; S.pops.push({ x: .5, y: .66, text: 'YAZI TURA', color: '#ffc93c', t: 0 });
        dot(0, 0).cap = dot(1, 0).cap = true; dot(0, 0).ov = { x: .48, y: .7 }; dot(1, 0).ov = { x: .52, y: .7 };
        S.refs[0].tx = .5; S.refs[0].ty = .68;
      }
    } else if (!S.cerRun) { S.cerRun = true; freeDots(); kickoff(0); S.kickT = 3; S.refs[0].tx = .5; S.refs[0].ty = .4; S.refs[1].ty = -.04; S.refs[2].ty = 1.04; }
    if (ct >= CER_END) endCeremony();
  }
  function freeDots() { S.dots.forEach(d => { d.fix = false; d.cap = false; }); S.refs.forEach(r => { r.fix = false; }); }
  function endCeremony() {
    if (S.phase !== 'cer') return;
    S.phase = 'play'; S.ct = CER_END; S.choreo = 1.2;
    $('mvCerBtn').hidden = true; $('mvSkipBtn').hidden = false;
    freeDots(); kickoff(0);
    S.refs[1].ty = -.04; S.refs[2].ty = 1.04;
    FM.Audio.whistle(1);
    if (S.m.derby && FM.Audio.chant) { const hid = S.m.s[0].tid; setTimeout(() => { if (S && !S.ended) FM.Audio.chant(hid, true); }, 1500); }
  }

  /* ---------- Çizim (perspektifli) ---------- */
  function resize() {
    const c = S.cv, w = c.parentElement.clientWidth, dpr = Math.min(2, window.devicePixelRatio || 1), m = S.m, home = FM.T(m.s[0].tid);
    const opt = { W: w, dpr, tier: FM.stadiumTier(home), home, away: FM.T(m.s[1].tid), fill: S.fill, wx: m.wx, banner: m.derby ? 'BUGÜN DERBİ GÜNÜ' : null, banners: S.ban, seatFn: home.id === FM.G.teamId && FM.Club ? FM.Club.seatFn() : null };
    if (S.st && S.st.dispose) S.st.dispose();
    S.st = (!S.no3d && FM.Stadium3D && FM.Stadium3D.create({ ...opt, canvas: $('mvGL'), logo: LOGO })) || null;
    if (!S.st) { S.no3d = true; S.st = FM.Stadium.create(opt); }
    c.parentElement.classList.toggle('flat', !S.st.gl);
    c.width = w * dpr; c.height = S.st.H * dpr; c.style.height = S.st.H + 'px'; c.parentElement.style.setProperty('--cvh', S.st.H + 'px');
    S.W = w; S.H = S.st.H; S.dpr = dpr;
  }
  function drawGoals(g) {
    const P = S.st.proj;
    for (const sx of [0, 1]) {
      const d = sx ? 1 : -1, off = S.shake > 0 && S.shakeSide === sx ? Math.sin(S.rt * 40) * .006 * S.shake : 0;
      const p1 = P(sx, .445), p2 = P(sx, .555), b1 = P(sx + d * (.026 + off), .445), b2 = P(sx + d * (.026 + off), .555);
      const h1 = S.st.Hp * .085 * p1.s, h2 = S.st.Hp * .085 * p2.s;
      g.fillStyle = 'rgba(255,255,255,.16)'; g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = .8;
      for (const q of [[b1, b2, [b2.X, b2.Y - h2 * .8], [b1.X, b1.Y - h1 * .8]], [[p1.X, p1.Y - h1], [p2.X, p2.Y - h2], [b2.X, b2.Y - h2 * .8], [b1.X, b1.Y - h1 * .8]], [p2, b2, [b2.X, b2.Y - h2 * .8], [p2.X, p2.Y - h2]]]) {
        g.beginPath(); q.forEach((pt, i) => { const x = pt.X != null ? pt.X : pt[0], y = pt.Y != null ? pt.Y : pt[1]; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); g.fill(); g.stroke();
      }
      g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath();
      g.moveTo(p1.X, p1.Y); g.lineTo(p1.X, p1.Y - h1); g.lineTo(p2.X, p2.Y - h2); g.lineTo(p2.X, p2.Y); g.stroke();
    }
  }
  function drawDisc(g, alpha) {
    const P = S.st.proj, ring = (r, fill) => { g.beginPath(); for (let k = 0; k <= 40; k++) { const a = k / 40 * 6.283, q = P(.5 + Math.cos(a) * r, .5 + Math.sin(a) * r * 105 / 68); if (k) g.lineTo(q.X, q.Y); else g.moveTo(q.X, q.Y); } g.fillStyle = fill; g.fill(); };
    g.globalAlpha = alpha;
    ring(.074, '#f3efe4'); ring(.052, S.kits[0].fill); ring(.036, '#f3efe4');
    const c = P(.5, .5), r = S.st.Wn * .03 * c.s;
    if (LOGO.complete && LOGO.naturalWidth) { g.save(); g.translate(c.X, c.Y); g.scale(1, .62); g.drawImage(LOGO, -r, -r, r * 2, r * 2); g.restore(); }
    g.fillStyle = '#58c4dd';
    for (let k = 0; k < 18; k++) { const a = k / 18 * 6.283 + S.rt * .25, q = P(.5 + Math.cos(a) * .084, .5 + Math.sin(a) * .084 * 105 / 68); g.beginPath(); g.arc(q.X, q.Y, Math.max(2, S.W * .0045), 0, 6.29); g.fill(); }
    g.globalAlpha = 1;
  }
  function draw(dt) {
    const g = S.g, w = S.W, h = S.H, P = S.st.proj;
    g.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    if (S.st.gl) {
      S.st.render(S.rt, { choreo: S.choreo, alpha: S.choreoA, cheer: S.cheer, disc: S.discA, shake: S.shake, shakeSide: S.shakeSide, cer: S.phase === 'cer' ? S.ct : -1, cam: S.cam, zoom: S.phase === 'replay', bx: S.ball.x, by: S.ball.y });
      g.clearRect(0, 0, w, h);
    } else {
      g.drawImage(S.st.bg, 0, 0, w, h);
      S.st.drawCrowd(g, S.rt, { choreo: S.choreo, alpha: S.choreoA, cheer: S.cheer, dt });
      if (S.discA > 0) drawDisc(g, S.discA);
      drawGoals(g);
    }
    const r0 = Math.max(5.2, w * .0125);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const items = S.dots.filter(active).map(d => ({ d, y: d.y })).concat(S.refs.map((rf, k) => ({ rf, k, y: rf.y }))).sort((a, b) => a.y - b.y);
    for (const it of items) {
      if (it.rf) {
        const q = P(it.rf.x, it.rf.y), r = r0 * q.s * .82;
        g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(q.X, q.Y + r * .5, r * .9, r * .38, 0, 0, 6.29); g.fill();
        g.beginPath(); g.arc(q.X, q.Y - r * .3, r, 0, 6.29); g.fillStyle = '#14181f'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = it.k ? '#ffc93c' : '#e8f04a'; g.stroke();
        continue;
      }
      const d = it.d, q = P(d.x, d.y), r = r0 * q.s, x = q.X, y = q.Y - r * .3, k = S.kits[d.s], gkp = d.i === 0;
      g.fillStyle = 'rgba(0,0,0,.32)'; g.beginPath(); g.ellipse(x, q.Y + r * .55, r * .95, r * .4, 0, 0, 6.29); g.fill();
      g.beginPath(); g.arc(x, y, r, 0, 6.29);
      g.fillStyle = gkp ? k.gk : k.fill; g.fill();
      g.lineWidth = Math.max(1.4, r * .26); g.strokeStyle = gkp ? '#f3efe4' : k.stroke; g.stroke();
      if (d === S.holder) { g.beginPath(); g.arc(x, y, r + 3, 0, 6.29); g.strokeStyle = 'rgba(255,201,60,.95)'; g.lineWidth = 1.5; g.stroke(); }
      if (r >= 6.4) { g.fillStyle = gkp ? '#14202f' : k.text; g.font = `700 ${Math.round(r * 1.05)}px Barlow, sans-serif`; g.fillText(FM.P(S.m.s[d.s].on[d.i]).num, x, y + .5); }
    }
    if (S.holder && active(S.holder)) {
      const p = FM.P(S.m.s[S.holder.s].on[S.holder.i]), q = P(S.holder.x, S.holder.y), x = q.X, y = q.Y - r0 * q.s * 1.3 - 9;
      g.font = `600 ${Math.max(10, Math.round(w * .016))}px Barlow, sans-serif`;
      const nm = p.name.split(' ').pop(), tw = g.measureText(nm).width + 8;
      g.fillStyle = 'rgba(10,19,34,.78)'; g.fillRect(x - tw / 2, y - 8, tw, 15);
      g.fillStyle = '#f3efe4'; g.fillText(nm, x, y);
    }
    drawMonitor(g, r0); drawMgr(g, 0, r0); drawMgr(g, 1, r0);
    const bq = P(S.ball.x, S.ball.y), br = r0 * .5 * bq.s, lift = S.ball.z * h * .07;
    g.fillStyle = 'rgba(0,0,0,.34)'; g.beginPath(); g.ellipse(bq.X, bq.Y + br * .5, br * (1 + S.ball.z * .3), br * .45, 0, 0, 6.29); g.fill();
    g.beginPath(); g.arc(bq.X, bq.Y - br * .4 - lift, br * (1 + S.ball.z * .25), 0, 6.29); g.fillStyle = S.st.snow ? '#ff9a3c' : '#fff'; g.fill(); g.lineWidth = 1.1; g.strokeStyle = '#14202f'; g.stroke();
    g.beginPath(); g.arc(bq.X + Math.cos(S.t * 9) * br * .35, bq.Y - br * .4 - lift + Math.sin(S.t * 9) * br * .35, br * .3, 0, 6.29); g.fillStyle = '#14202f'; g.fill();
    for (const p of S.pops) {
      if (p.t < 0) continue;
      const q = P(p.x, p.y), x = q.X, y = q.Y - (p.mgr ? r0 * q.s * 2.9 : r0) - 12 - p.t * 22, a = clamp(1.6 - p.t, 0, 1);
      g.globalAlpha = a;
      if (p.card) { g.fillStyle = p.card; g.strokeStyle = '#14202f'; g.lineWidth = 1.5; g.fillRect(x - 6, y - 16, 12, 17); g.strokeRect(x - 6, y - 16, 12, 17); }
      else { g.font = `800 ${Math.max(12, Math.round(w * .024))}px 'Barlow Condensed', sans-serif`; g.lineWidth = 3; g.strokeStyle = '#0a1322'; g.strokeText(p.text, x, y); g.fillStyle = p.color; g.fillText(p.text, x, y); }
      g.globalAlpha = 1;
    }
    for (const c of S.conf) {
      const q = P(c.x, Math.max(-.6, c.y));
      g.save(); g.translate(q.X, q.Y); g.rotate(c.r); g.globalAlpha = clamp(c.life, 0, 1);
      g.fillStyle = c.c; g.fillRect(-3, -1.5, 6, 3); g.restore();
    }
    S.st.drawFx(g, S.rt);
    for (const f of S.fw) { g.globalAlpha = clamp(f.life, 0, 1); g.fillStyle = f.c; g.fillRect(f.x - 1.5, f.y - 1.5, 3, 3); }
    g.globalAlpha = 1;
  }
  function fireworks(raw) {
    S.fwT -= raw;
    if (S.fwT <= 0) {
      S.fwT = .35 + Math.random() * .5;
      const x = S.W * (.1 + Math.random() * .8), y = S.H * (.1 + Math.random() * .5), c = ['#ffc93c', '#ef5350', '#58c4dd', '#4cc38a', '#ffffff'][Math.floor(Math.random() * 5)];
      for (let i = 0; i < 34; i++) { const a = i / 34 * 6.28, v = 40 + Math.random() * 70; S.fw.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c, life: 1.2 }); }
    }
    S.fw = S.fw.filter(f => { f.x += f.vx * raw; f.y += f.vy * raw; f.vy += 60 * raw; f.vx *= .985; f.life -= raw * .8; return f.life > 0; });
  }

  /* ---------- Döngü ---------- */
  function frame(ts) {
    if (!S) return;
    const raw = Math.min(.05, (ts - (S.lastTs || ts)) / 1000); S.lastTs = ts;
    const dt = S.paused ? 0 : raw * S.speed * S.slow;
    S.rt += raw;
    if (S.dispT > 0) { S.dispT -= raw; const bar = $('mvDispBar'); if (bar) bar.style.width = Math.max(0, S.dispT / 7 * 100) + '%'; if (S.dispT <= 0) hideDispute(); }
    if (S.fin && S.ended) fireworks(raw);
    if (dt > 0 && S.phase === 'cer') ceremony(dt);
    else if (dt > 0) {
      S.t += dt;
      if (S.kickT > 0) S.kickT -= dt;
      if (S.phase === 'play') { S.terrAcc[0] += ownX(0, S.ball.x); S.terrAcc[1] += ownX(1, S.ball.x); S.terrN++; }
      if (S.choreoA > .28) S.choreoA = Math.max(.28, S.choreoA - dt * .035);
      if (S.discA > 0) S.discA = Math.max(0, S.discA - dt * .7);
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
          S.m.terr = [clamp(S.terrAcc[0] / Math.max(1, S.terrN), .15, .85), clamp(S.terrAcc[1] / Math.max(1, S.terrN), .15, .85)]; S.terrAcc = [0, 0]; S.terrN = 0;
          for (const e of FM.simMinute(S.m)) { if (e.type === 'sub') feed(e); else S.queue.push(e); }
          paintUi();
        }
      }
    }
    if (dt > 0) {
      // topa en yakın savunan oyuncu baskıya çıkar
      // topa en yakın savunanlar baskıya çıkar: sayısı ve mesafesi pres talimatına bağlı
      S.pressers = [];
      if (S.phase === 'play' && S.holder && !S.script) {
        const dt2 = S.m.s[1 - S.holder.s].tac, rad = [.16, .25, .34][dt2.press];
        S.pressers = S.dots.filter(d => d.s !== S.holder.s && d.i > 0 && active(d) && !d.ov && pdist(d, S.ball) < rad).sort((a, b) => pdist(a, S.ball) - pdist(b, S.ball)).slice(0, dt2.press === 2 ? 2 : 1);
      }
      const cap = S.phase === 'play';
      for (const d of S.dots) {
        if (!active(d) || d.fix) continue;
        const tg = target(d), k = Math.min(1, dt * (d.ov ? 3.4 : 2.6));
        let sx = (tg.x - d.x) * k, sy = (tg.y - d.y) * k;
        if (cap) {   // hız sınırı: oyuncular koşar, ışınlanmaz (saha boyu / sn)
          const vmax = (d.ov ? .3 : S.pressers.includes(d) ? [.22, .26, .3][S.m.s[d.s].tac.tackle] : d.cv ? .17 : (S.ctr && S.ctr.s === d.s && S.t < S.ctr.until) ? .28 : .21) * dt, st = Math.hypot(sx, sy * .65);
          if (st > vmax) { sx *= vmax / st; sy *= vmax / st; }
        }
        d.x += sx; d.y += sy;
        S.last[S.m.s[d.s].on[d.i]] = d;
      }
      if (S.phase === 'play' && !S.script) { S.refs[0].tx = clamp(S.ball.x + .05, .05, .95); S.refs[0].ty = clamp(S.ball.y + .1, .08, .92); }
      if (S.phase !== 'cer') { S.refs[1].tx = clamp(S.ball.x, .02, .98); S.refs[2].tx = clamp(S.ball.x, .02, .98); }
      tickMgrs(dt);
      for (const rf of S.refs) if (!rf.fix) { rf.x += (rf.tx - rf.x) * Math.min(1, dt * 2); rf.y += (rf.ty - rf.y) * Math.min(1, dt * 2); }
      if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * .8);
      S.cheer[0] = Math.max(0, S.cheer[0] - dt * .3); S.cheer[1] = Math.max(0, S.cheer[1] - dt * .3);
      S.pops = S.pops.filter(p => (p.t += dt) < 1.6);
      S.conf = S.conf.filter(c => { c.x += c.vx * dt; c.y += c.vy * dt; c.r += dt * 6; c.life -= dt; return c.life > 0 && c.y < 1.1; });
    }
    draw(raw);
    if (S.varCam) drawVarCam(dt);
    S.raf = requestAnimationFrame(frame);
  }

  function skip() {
    const m = S.m;
    if (S.phase === 'cer') endCeremony();
    if (S.ended || S.phase === 'pens' || S.phase === 'replay') return;
    S.script = null; clearOv(); S.htPending = false; m.auto = true; hideDispute(); varHide();
    if (S.injSlot != null) { const x = FM.injSub(m, S.user, S.injSlot); if (x) feed(x); S.injSlot = null; }
    for (const e of S.queue) { if (e.need) { const x = FM.injSub(m, e.side, e.slot); if (x) feed(x); } if (e.type === 'chance' && e.out === 'goal' && !e.varNo) S.goals.push(e); if (e.type !== 'ft' && e.type !== 'chance' && e.type !== 'pens' && !e.fed) feed(e); }
    const hadPens = S.queue.some(e => e.type === 'pens');
    S.queue = [];
    let pens = hadPens;
    while (!m.done) for (const e of FM.simMinute(m)) {
      if (e.type === 'chance' && e.out === 'goal' && !e.varNo) S.goals.push(e);
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
    else if (a === 'speedc') { S.speed = S.speed === 1 ? 2 : S.speed === 2 ? 4 : 1; b.textContent = S.speed + 'x'; $('mvSpd').textContent = '▷▷ ' + S.speed + 'x'; }
    else if ((a === 'ment' || a === 'tac' || a === 'tacp') && side.mgr.out) { talk('Tribündesin: taktik talimatı veremezsin. Değişiklikleri yardımcın yapabilir.'); $('mvOverlay').hidden = true; if (!S.htPending) S.paused = S.wasPaused; }
    else if (a === 'protest') { hideDispute(); const pe = FM.protest(S.m, S.user, S.dispWhy || 'hakem'); if (pe) { feed(pe); pe.fed = true; S.queue.unshift(pe); } }
    else if (a === 'calm') { hideDispute(); talk('Sakin kaldın. Hakemle tartışmaya girmedin.'); }
    else if (a === 'ment') { side.ment = +b.dataset.v; FM.T(side.tid).ment = side.ment; tacPanel(); }
    else if (a === 'tac') { side.tac[b.dataset.k] = +b.dataset.v; FM.T(side.tid).tac[b.dataset.k] = +b.dataset.v; tacPanel(); }
    else if (a === 'cam') { S.cam = (S.cam + 1) % 4; talk('Kamera: ' + ['Yayın açısı', 'Kuşbakışı', 'Kale arkası', 'Saha kenarı'][S.cam]); }
    else if (a === 'skip') skip();
    else if (a === 'httalk') htTalk(b.dataset.v);
    else if (a === 'shoutp') { if (S.phase === 'play' && !S.ended && ($('mvOverlay').hidden || S.htPending)) shoutPanel(); }
    else if (a === 'shout') shout(b.dataset.v);
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
    else if (a === 'injpick' || a === 'injno') {
      const e = a === 'injpick' ? FM.doSub(S.m, S.user, S.injSlot, +b.dataset.id) : null;
      if (e) feed(e);
      S.injSlot = null; paintUi(); closeOverlay();
    }
    else if (a === 'subok') {
      const i = side.on.indexOf(S.sel.out), e = i >= 0 ? FM.doSub(S.m, S.user, i, S.sel.in) : null;
      if (e) feed(e);
      paintUi(); closeOverlay();
    }
    else if (a === 'second') { S.htPending = false; $('mvOverlay').hidden = true; S.second = true; S.paused = false; kickoff(1); FM.Audio.whistle(1); }
    else if (a === 'report') { overlay(`<div class="ov-rep">${FM.ui.reportHtml(FM.Depth.buildRep(S.m, S.user))}</div><div class="row"><button class="btn" data-mv="ftback">‹ Geri</button><button class="btn primary" data-mv="done">Devam et</button></div>`); }
    else if (a === 'ftback') overlay(S.ftHtml);
    else if (a === 'replay') { $('mvOverlay').hidden = true; S.rep = 0; replayNext(); }
    else if (a === 'done') {
      cancelAnimationFrame(S.raf); window.removeEventListener('resize', S.onResize); clearTimeout(S.bannerT); if (S.st && S.st.dispose) S.st.dispose();
      const cb = S.onDone; S = null;
      $('match').hidden = true; $('match').innerHTML = '';
      cb();
    }
  }

  FM.MatchView = {
    _s: () => S,   // test ve hata ayıklama için
    cur: () => (S && FM.Depth ? FM.Depth.buildRep(S.m, S.user) : null),
    /* info: { comp: 'Yıldızlar Ligi · 5. hafta', att } */
    start(m, onDone, info) {
      const el = $('match'), h = FM.T(m.s[0].tid), a = FM.T(m.s[1].tid), A = FM.Audio, G = FM.G;
      const user = m.s[0].user ? 0 : 1, tier = FM.stadiumTier(h), cap = FM.stadiumCap(h);
      const fill = clamp((h.id === G.teamId ? .3 + G.fans / 100 * .65 : .45 + h.rep * .09) + (m.cup ? .08 : 0) + (m.derby ? .15 : 0), .25, 1);
      el.innerHTML = `
        <div class="mv">
          <div class="mv-pitch">
            <canvas id="mvGL" class="gl" aria-hidden="true"></canvas><canvas id="mvCanvas" aria-label="Canlı maç sahası"></canvas>
            <div class="tvb" id="tvb" role="status" aria-label="Skor">
              <div class="tvb-logo"><img src="assets/logo.svg" alt="" width="30" height="30"></div>
              <div class="tvb-t" style="--k1:${h.c1};--k2:${h.c2}"><i></i><span>${h.short}</span></div>
              <div class="tvb-c"><div><span class="tvb-sc"><b id="mvH">0</b><em>-</em><b id="mvA">0</b></span><span class="tvb-goal" id="tvbGoal">GOOOL</span></div></div>
              <div class="tvb-t away" style="--k1:${a.c1};--k2:${a.c2}"><span>${a.short}</span><i></i></div>
              <div class="tvb-min"><span id="mvMin">0'</span><small id="mvSpd">▷▷ 1x</small></div>
              <div class="mv-bar" id="mvBar"></div>
              <div class="tvb-sub" id="tvbSub"></div>
            </div>
            <div class="mv-talk" id="mvTalk" aria-hidden="true"></div>
            <div class="mv-var" id="mvVar" role="status" hidden></div><div class="mv-varcam" id="mvVarCam" hidden aria-label="VAR tekrar görüntüsü"><div class="vc-head"><b>VAR</b><strong id="vcTitle">GOL İNCELEMESİ</strong><span id="vcTag">Ofsayt çizgisi</span></div><canvas id="vcCanvas"></canvas></div><div class="mv-disp" id="mvDisp" hidden></div>
            <div class="mv-pens" id="mvPens" hidden></div><div class="mv-tag" id="mvTag" hidden></div>
            <div class="mv-ctl">
              <button class="btn icon" data-mv="pause" aria-label="Duraklat">${FM.icon('pause')}</button>
              <button class="btn icon" data-mv="speedc" id="mvSpdBtn" aria-label="Hızı değiştir">1x</button>
              <button class="btn icon" data-mv="cam" id="mvCamBtn" aria-label="Kamera açısını değiştir" title="Kamera">${FM.icon('cam')}</button>
              <button class="btn icon" data-mv="sound" aria-label="Ses">${FM.icon(A.muted ? 'mute' : 'sound')}</button>
              <button class="btn cer" data-mv="cerskip" id="mvCerBtn">Seremoniyi atla ${FM.icon('skip')}</button>
              <button class="btn" data-mv="skip" id="mvSkipBtn" hidden>${FM.icon('skip')}<span>Sonuca git</span></button>
              <button class="btn chipb" data-mv="tacp"><small>Mentalite</small><b id="mvChMent"></b></button>
              <button class="btn chipb wide" data-mv="tacp"><small>Pres</small><b id="mvChPress"></b></button>
              <button class="btn chipb wide" data-mv="tacp"><small>Taktik</small><b>${m.s[user].formation}</b></button>
              <button class="btn chipb" data-mv="sub"><small>Kenar</small><b><span id="mvSubs">5</span> hak</b></button>
              <button class="btn chipb" data-mv="shoutp" id="mvShout"><small>Talimat</small><b>Bağır</b></button>
            </div>
            <div class="mv-overlay" id="mvOverlay" hidden></div>
          </div>
          <div class="mv-bottom"><div id="mvStats"></div><ol class="mv-feed" id="mvFeed" aria-live="polite"></ol></div>
        </div>`;
      el.hidden = false; el.scrollTop = 0;
      const cv = $('mvCanvas');
      /* forma: 0 iç saha, 1 deplasman, 2 üçüncü; kullanıcının seçimi info.kit, tasarımı G.kits */
      const kit = (t, k) => { const uk = t.id === G.teamId && G.kits ? G.kits[k] : null, fl = uk ? uk.c1 : k === 2 ? '#1b2433' : k ? t.c2 : t.c1, stroke = uk ? uk.c2 : k ? t.c1 : t.c2; return { fill: fl, stroke, text: lum(fl) > 150 ? '#14202f' : '#ffffff' }; };
      const uk = info && info.kit != null ? info.kit : null, hk = user === 0 && uk != null ? uk : 0, hf = kit(h, hk).fill;
      const ak = user === 1 && uk != null ? uk : cdist(hf, a.c1) < 150 ? (cdist(hf, a.c2) < 150 ? 2 : 1) : 0;
      S = {
        m, onDone, user, cv, g: cv.getContext('2d'), t: 0, ct: 0, speed: (FM.Settings && FM.Settings.get('speed')) || 1, slow: 1, paused: false, acc: 0, queue: [], script: null, second: false, phase: 'cer',
        poss: 0, holder: null, passT: 1, kickT: 0, dots: [], ball: { x: .5, y: 1.1, z: 0 }, conf: [], pops: [], last: {}, shake: 0, shakeSide: 0,
        disp: [0, 0], ended: false, fill, cheer: [0, 0], choreo: 0, choreoA: 1, goals: [], rep: 0, pk: [[], []], htPending: false, wasPaused: false,
        rt: 0, discA: 1, said: 0, varOn: false, dispT: 0, dispWhy: '', mgrs: [0, 1].map(k => ({ x: .5, y: 1.2, tx: BENCH[k], ty: 1.035, st: m.s[k].mgr.out ? 'idle' : 'idle', stT: 0, a: 1, ph: Math.random() * 6, gone: m.s[k].mgr.out, name: FM.coachOf(m.s[k].tid) })), cam: 0, terrAcc: [0, 0], terrN: 0, info: { stadium: h.stadium, home: h.name, away: a.name, att: Math.round(cap * fill).toLocaleString('tr-TR') }, fw: [], fwT: 0, injSlot: null, fin: !!(m.cup && G.cup.final), refs: [0, 1, 2].map(() => ({ x: .5, y: 1.1, tx: .5, ty: .5 })),
        kits: [{ ...kit(h, hk), gk: '#ffc93c' }, { ...kit(a, ak), gk: '#58c4dd' }], no3d: FM.Settings ? !FM.Settings.get('gfx3d') : false
      };
      S.ban = (info && info.ban) || (FM.Banners ? FM.Banners.forMatch(m.fx, { cup: m.cup, comp: m.euro ? 'euro' : '' }) : null); m.ban = S.ban;
      if (S.ban) { const bl = FM.Banners.lines(S.ban, h); S.say = [[.3, m.derby ? `Derbi günü! ${h.stadium} tıklım tıklım: ${Math.round(cap * fill).toLocaleString('tr-TR')} seyirci.` : `İyi seyirler! ${h.stadium} tribünleri doldu, ${Math.round(cap * fill).toLocaleString('tr-TR')} seyirci var.`], [2.2, bl[0]], [3.6, S.ban.protest ? 'Koreografi yerine protesto: tribünde dev harflerle “YÖNETİM İSTİFA!” yazıyor.' : `${h.name} ile ${a.name} karşı karşıya. ${FM.fansOf(h)} koreografiyi açıyor: “${S.ban.choreo[0]}”`], [4.8, bl[1]], [5.8, 'Takımlar selam verdi, yazı tura atılıyor. Az sonra başlıyoruz.']]; }
      for (let s = 0; s < 2; s++) for (let i = 0; i < 11; i++) S.dots.push({ s, i, x: .5, y: 1.2, ph: Math.random() * 6.28, ov: null });
      S.onResize = () => { if (S) resize(); };
      window.addEventListener('resize', S.onResize);
      resize();
      $('mvSpdBtn').textContent = S.speed + 'x'; $('mvSpd').textContent = '▷▷ ' + S.speed + 'x';
      paintUi();
      A.init(); A.crowd(true); A.anthem();
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { S.ct = 6.9; }
      S.raf = requestAnimationFrame(frame);
    }
  };
  document.addEventListener('click', onClick);
})();
