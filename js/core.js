/* Saha Kenarı — oyun çekirdeği: kadro, maç motoru, iki lig + kupa, transfer, sözleşme, scout, finans, yönetim */
(function () {
  const R = Math.random;
  const ri = (a, b) => Math.floor(a + R() * (b - a + 1));
  const pick = a => a[Math.floor(R() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function wpick(items, wf) {
    let tot = 0;
    const ws = items.map(i => { const w = Math.max(0, wf(i)); tot += w; return w; });
    let r = R() * tot;
    for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  }
  FM.util = { ri, pick, clamp, wpick };
  /* Diğer modüllerin (kariyer, basın...) bağlandığı noktalar */
  const hook = (k, ...a) => { const C = FM.Career; return C && C[k] ? C[k](...a) : undefined; };

  const ATTRS = ['pac', 'sho', 'pas', 'def', 'phy', 'gk'];
  const W = {
    GK: { gk: .8, phy: .1, pas: .1 },
    DEF: { def: .5, phy: .2, pac: .15, pas: .15 },
    MID: { pas: .45, def: .15, sho: .15, pac: .1, phy: .15 },
    FWD: { sho: .5, pac: .25, pas: .1, phy: .15 }
  };
  /* Kayıt yuvaları: 1. yuva eski anahtarı kullanır (eski kayıtlar korunur) */
  const slotKey = n => 'saha-kenari-v2' + (n > 1 ? '-s' + n : '');
  let SLOT = 1;
  try { SLOT = +localStorage.getItem('saha-kenari-slot') || 1; } catch (e) { /* yok say */ }
  const WEEK_COUNT = 22;
  const CUP_AFTER = [3, 7, 11, 15, 19]; // bu lig haftasından önce kupa turu oynanır
  const r10k = v => Math.round(v / 10000) * 10000;
  let G = null;
  Object.defineProperty(FM, 'G', { get: () => G });

  /* ---------- Oyuncular ---------- */
  function ovrAs(p, pos) { let s = 0; for (const k in W[pos]) s += p.a[k] * W[pos][k]; return Math.round(s); }
  function calcValue(p) {
    const ageF = p.age <= 21 ? 1.25 : p.age <= 25 ? 1.1 : p.age <= 28 ? 1 : p.age <= 30 ? .75 : p.age <= 32 ? .5 : .28;
    return Math.max(50000, r10k(180000 * Math.pow(1.13, p.ovr - 50) * ageF * (1 + Math.max(0, p.pot - p.ovr) * .03)));
  }
  function refresh(p) { p.ovr = ovrAs(p, p.pos); if (p.pot < p.ovr) p.pot = p.ovr; p.value = calcValue(p); }
  function genName() { for (;;) { const n = pick(FM.FIRST) + ' ' + pick(FM.LAST); if (!FM.NAME_BLOCK.includes(n)) return n; } }
  function roleFor(p) {
    const a = p.a;
    if (p.pos === 'GK') return 'GK';
    if (p.pos === 'DEF') return a.pac > a.def - 4 ? 'WB' : 'CB';
    if (p.pos === 'MID') return a.def > a.pas ? 'BW' : a.pac > a.pas ? 'WG' : 'PM';
    return a.phy > a.pac ? 'TF' : 'SF';
  }
  function genPlayer(pos, q, age) {
    const a = {};
    for (const k of ATTRS) {
      const w = W[pos][k] || 0;
      const v = w >= .4 ? q + ri(-3, 5) : w > 0 ? q + ri(-9, 4) : k === 'gk' ? ri(5, 18) : q - ri(12, 28);
      a[k] = clamp(Math.round(v), 5, 97);
    }
    const p = {
      id: G.nextId++, name: genName(), pos, age, a, tid: null,
      fit: ri(88, 100), mor: ri(60, 80), inj: 0, susp: 0, con: ri(1, 4), loan: null, sc: 0,
      g: 0, as: 0, apps: 0, yc: 0, rc: 0, rs: 0, rn: 0, form: [],
      look: [ri(0, 4), ri(0, 4), ri(0, 3)], num: ri(2, 99)
    };
    p.role = roleFor(p);
    p.trait = R() < .32 ? pick(pos === 'GK' ? ['lead', 'glass', 'iron', 'big'] : Object.keys(FM.TRAITS)) : null;
    p.ovr = ovrAs(p, pos);
    p.pot = clamp(p.ovr + (age <= 21 ? ri(4, 16) : age <= 24 ? ri(1, 9) : age <= 27 ? ri(0, 3) : 0), p.ovr, 95);
    p.value = calcValue(p);
    p.wage = Math.max(800, Math.round(p.value / 260 / 100) * 100);
    G.players[p.id] = p;
    return p;
  }
  const P = id => G.players[id];
  const T = id => G.teams[id];
  const available = p => !p.inj && !p.susp;
  const avgRating = p => (p.rn ? p.rs / p.rn : 0);
  const known = p => p.tid === G.teamId || !!p.sc || (p.loan && p.loan.own === G.teamId);
  function est(p) { if (known(p)) return [p.ovr, p.ovr]; const lo = clamp(p.ovr - 2 - (p.id % 4), 30, 95); return [lo, Math.min(97, lo + 7)]; }
  function eff(p, role) {
    const base = p.pos === role ? p.ovr : ovrAs(p, role) * .92;
    return base * (.72 + .28 * p.fit / 100) * (.96 + .08 * p.mor / 100);
  }
  function addToTeam(p, team) {
    p.tid = team.id; team.players.push(p.id);
    if (team.id === G.teamId) p.sc = 1;
    const used = new Set(team.players.filter(id => id !== p.id).map(id => P(id).num));
    if (p.pos === 'GK' && !used.has(1)) p.num = 1;
    while (used.has(p.num)) p.num = ri(2, 99);
  }
  function removeFromTeam(p) {
    const t = T(p.tid); if (!t) return;
    t.players = t.players.filter(id => id !== p.id);
    t.lineup = t.lineup.map(id => (id === p.id ? null : id));
    p.tid = null;
  }

  /* ---------- Kadro seçimi ---------- */
  function fillSlots(team, keep) {
    const slots = FM.FORMATIONS[team.formation], seen = new Set(), changed = [];
    if (!keep || !team.lineup || team.lineup.length !== 11) team.lineup = new Array(11).fill(null);
    team.lineup = team.lineup.map(id => {
      const ok = id != null && team.players.includes(id) && available(P(id)) && !seen.has(id);
      if (ok) seen.add(id);
      return ok ? id : null;
    });
    slots.forEach((s, i) => {
      if (team.lineup[i] != null) return;
      let best = null, bv = -1;
      for (const id of team.players) {
        const p = P(id);
        if (seen.has(id) || !available(p)) continue;
        const v = eff(p, s[0]);
        if (v > bv) { bv = v; best = id; }
      }
      if (best != null) { team.lineup[i] = best; seen.add(best); changed.push(best); }
    });
    ensureSP(team);
    return changed;
  }
  const autoPick = team => fillSlots(team, false);
  const ensureLineup = team => fillSlots(team, true);
  function ensureSP(team) {
    const xi = team.lineup.filter((id, i) => id != null && i > 0).map(P);
    if (!team.sp) team.sp = {};
    if (!xi.length) return;
    const best = f => xi.reduce((a, b) => (f(b) > f(a) ? b : a)).id;
    const ok = id => id != null && team.lineup.includes(id);
    if (!ok(team.sp.pen)) team.sp.pen = best(p => p.a.sho + (p.trait === 'pen' ? 30 : 0));
    if (!ok(team.sp.fk)) team.sp.fk = best(p => p.a.sho + p.a.pas * .5 + (p.trait === 'fk' ? 40 : 0));
    if (!ok(team.sp.ck)) team.sp.ck = best(p => p.a.pas);
  }
  function benchOf(team) {
    const inXI = new Set(team.lineup);
    const rest = team.players.filter(id => !inXI.has(id) && available(P(id))).sort((a, b) => P(b).ovr - P(a).ovr);
    const gk = rest.find(id => P(id).pos === 'GK');
    const out = rest.filter(id => P(id).pos !== 'GK').slice(0, gk != null ? 8 : 9);
    if (gk != null) out.push(gk);
    return out;
  }

  /* ---------- Hava ---------- */
  function genWeather(week) {
    const winter = week >= 8 && week <= 14, x = R();
    return { t: winter ? (x < .28 ? 'snow' : x < .55 ? 'rain' : 'clear') : x < .22 ? 'rain' : 'clear', n: R() < .5 ? 1 : 0 };
  }

  /* ---------- Maç motoru ---------- */
  function makeSide(team, isUser, fx) {
    if (isUser) ensureLineup(team); else autoPick(team);
    return {
      tid: team.id, formation: team.formation, slots: FM.FORMATIONS[team.formation],
      on: team.lineup.slice(), bench: benchOf(team), subsLeft: 5, ment: isUser ? team.ment : 1,
      tac: { ...team.tac }, sp: { ...team.sp }, yel: {}, played: team.lineup.filter(x => x != null), user: !!isUser,
      mod: (isUser && hook('sideMod', team, fx)) || 1, shout: null
    };
  }
  function newMatch(fx, opts) {
    opts = opts || {};
    if (!fx.wx) fx.wx = genWeather(G.week);
    const m = {
      fx, min: 0, score: [0, 0], done: false, cup: !!opts.cup, neutral: !!opts.neutral, et: false, pens: null, wx: fx.wx, rt: {},
      s: [makeSide(T(fx.h), fx.h === G.teamId, fx), makeSide(T(fx.a), fx.a === G.teamId, fx)],
      st: { shots: [0, 0], target: [0, 0], poss: [0, 0], fouls: [0, 0], corners: [0, 0], yel: [0, 0], red: [0, 0] },
      log: []
    };
    for (const s of m.s) for (const id of s.played) m.rt[id] = 6 + (R() - .5) * .7;
    return m;
  }
  const rate = (m, id, d) => { if (id != null && m.rt[id] != null) m.rt[id] += d; };
  function ratings(side) {
    let f = 0, mi = 0, d = 0, gk = 0, pm = 0, lead = 1;
    side.slots.forEach((s, i) => {
      const id = side.on[i]; if (id == null) return;
      const p = P(id), e = eff(p, s[0]);
      if (p.trait === 'lead') lead = 1.02;
      if (s[0] === 'FWD') f += e; else if (s[0] === 'MID') { mi += e; if (p.role === 'BW') d += e * .08; if (p.role === 'PM') pm += e * .07; }
      else if (s[0] === 'DEF') d += e * (p.role === 'CB' ? 1.03 : 1); else gk += e;
    });
    const t = side.tac || { press: 1, tempo: 1, line: 1, width: 1 };
    const am = [.9, 1, 1.1][side.ment] * [.96, 1, 1.02][t.line], dm = [1.1, 1, .9][side.ment] * [1.04, 1, .97][t.press] * [1.05, 1, 1][t.line];
    const md = side.mod || 1, sh = side.shout || {};   // kariyer etkileri (uyum, taktik, hazırlık) ve kenardan talimat
    return {
      att: Math.max(8, (f + mi * .45) / 3.8 * am * lead * md * (sh.att || 1)),
      def: Math.max(8, (d * 1.15 + mi * .25 + gk) / 6.6 * dm * lead * md * (sh.def || 1)),
      ctl: Math.max(8, (mi + pm + f * .2 + d * .2) / 5.2 * [.95, 1, 1.06][t.press] * [.96, 1, 1.04][t.line] * lead * md * (sh.ctl || 1)),
      gk: Math.max(8, gk)
    };
  }
  const txt = (key, o) => pick(FM.TXT[key]).replace(/\{(\w)\}/g, (_, k) => o[k] || '');
  const onPitch = side => side.on.filter(x => x != null).map(P);
  function slotRole(side, pid) { const i = side.on.indexOf(pid); return i < 0 ? null : side.slots[i][0]; }

  function chance(m, s, r) {
    const side = m.s[s], opp = m.s[1 - s], tac = side.tac;
    const outfield = onPitch(side).filter(p => slotRole(side, p.id) !== 'GK');
    if (!outfield.length) return null;
    const inXI = id => id != null && side.on.includes(id) && slotRole(side, id) !== 'GK';
    const x0 = R(), wide = tac.width === 2;
    const kind = x0 < .014 ? 'pen' : x0 < .12 ? 'fk' : x0 < (wide ? .27 : .2) ? 'ck' : 'open';
    const roleW = { FWD: 5, MID: 2, DEF: .6 };
    let sh, as = null;
    if (kind === 'pen') sh = inXI(side.sp.pen) ? P(side.sp.pen) : wpick(outfield, p => p.a.sho);
    else if (kind === 'fk') sh = inXI(side.sp.fk) ? P(side.sp.fk) : wpick(outfield, p => p.a.sho);
    else if (kind === 'ck') {
      as = inXI(side.sp.ck) ? P(side.sp.ck) : wpick(outfield, p => p.a.pas);
      const tg = outfield.filter(p => p !== as);
      sh = tg.length ? wpick(tg, p => p.a.phy * (slotRole(side, p.id) === 'MID' ? .5 : 1) * (p.role === 'TF' ? 1.5 : 1)) : as;
      if (sh === as) as = null;
      m.st.corners[s]++;
    } else {
      sh = wpick(outfield, p => roleW[slotRole(side, p.id)] * p.a.sho * (p.role === 'TF' ? 1.15 : 1));
      const others = outfield.filter(p => p !== sh);
      if (others.length && R() < .72) as = wpick(others, p => p.a.pas * (slotRole(side, p.id) === 'DEF' ? (p.role === 'WB' ? 1 : .45) : 1) * (p.role === 'PM' ? 1.8 : p.role === 'WG' && wide ? 1.5 : 1));
    }
    const keeperId = opp.on[0], keeper = keeperId != null ? P(keeperId) : null;
    const shoE = sh.a.sho * (.75 + .25 * sh.fit / 100);
    let pg;
    if (kind === 'pen') pg = clamp(.76 + (sh.a.sho - 70) * .004 - ((keeper ? keeper.ovr : 40) - 70) * .004 + (sh.trait === 'pen' ? .08 : 0), .5, .93);
    else {
      pg = .12 * Math.pow(shoE / Math.max(20, r[1 - s].gk), 1.3);
      pg *= kind === 'fk' ? (sh.trait === 'fk' ? 1.25 : .62) : kind === 'ck' ? .8 : 1;
      pg *= [1.06, 1, .95][tac.tempo] * [1.05, 1, .96][tac.width];
      if (opp.tac.line === 2 && kind === 'open') pg *= sh.role === 'SF' ? 1.15 : 1.08;
      if (sh.trait === 'cool') pg *= 1.08;
      if (sh.trait === 'big' && m.cup) pg *= 1.1;
      pg *= m.wx.t === 'snow' ? .9 : m.wx.t === 'rain' ? .95 : 1;
      pg = clamp(pg, .03, .45);
    }
    m.st.shots[s]++;
    const e = { type: 'chance', kind, min: m.min, side: s, pid: sh.id, aid: as ? as.id : null, kid: keeperId };
    const names = { p: sh.name, a: as ? as.name : '', k: keeper ? keeper.name : 'Savunma' };
    const pre = kind === 'pen' ? txt('pen', names) + ' ' : '';
    if (R() < pg) {
      e.out = 'goal'; m.score[s]++; m.st.target[s]++;
      sh.g++; if (as) as.as++;
      rate(m, sh.id, 1.1); rate(m, e.aid, .6); rate(m, keeperId, -.3);
      opp.on.forEach((id, i) => { if (id != null && opp.slots[i][0] === 'DEF') rate(m, id, -.15); });
      e.text = kind === 'pen' ? pre + txt('penGoal', names) : kind === 'fk' ? txt('fkGoal', names) : kind === 'ck' ? txt('ckGoal', names) : txt('goal', names) + (as ? ' ' + txt('assist', names) : '');
      m.log.push({ min: m.min, side: s, type: 'goal', pid: sh.id, aid: e.aid, kind });
    } else {
      const y = R();
      if (kind === 'pen') { e.out = y < .7 && keeper ? 'save' : 'miss'; if (e.out === 'save') m.st.target[s]++; e.text = pre + txt('penMiss', names); rate(m, sh.id, -.6); if (e.out === 'save') rate(m, keeperId, .7); }
      else if (y < .42 && keeper) { e.out = 'save'; m.st.target[s]++; rate(m, keeperId, .35); rate(m, sh.id, .08); e.text = txt(kind === 'fk' ? 'fkSave' : kind === 'ck' ? 'ckSave' : 'save', names); }
      else if (y < .78 || kind !== 'open') { e.out = 'miss'; rate(m, sh.id, -.08); e.text = txt(kind === 'fk' ? 'fkMiss' : kind === 'ck' ? 'ckMiss' : 'miss', names); }
      else if (y < .94) { e.out = 'block'; m.st.corners[s]++; e.text = txt('block', names); }
      else { e.out = 'post'; e.text = txt('post', names); }
    }
    return e;
  }
  function doSub(m, s, slotIdx, inId) {
    const side = m.s[s], outId = side.on[slotIdx];
    if (side.subsLeft <= 0 || !side.bench.includes(inId)) return null;
    side.on[slotIdx] = inId;
    side.bench = side.bench.filter(x => x !== inId);
    side.subsLeft--;
    if (!side.played.includes(inId)) { side.played.push(inId); m.rt[inId] = 6 + (R() - .5) * .5; }
    return { type: 'sub', min: m.min, side: s, pid: inId, aid: outId, text: txt('sub', { p: P(inId).name, a: outId != null ? P(outId).name : '—' }) };
  }
  function bestBenchFor(side, role) {
    let best = null, bv = -1;
    for (const id of side.bench) {
      const p = P(id);
      if ((role === 'GK') !== (p.pos === 'GK')) continue;
      const v = eff(p, role); if (v > bv) { bv = v; best = id; }
    }
    return best;
  }
  function sendOff(m, s, p, ev, second) {
    const side = m.s[s], i = side.on.indexOf(p.id);
    if (i >= 0) side.on[i] = null;
    p.susp = 2; p.rc++; m.st.red[s]++; rate(m, p.id, -1.5);
    ev.push({ type: 'red', min: m.min, side: s, pid: p.id, text: FM.TXT.red[second ? 1 : 0].replace('{p}', p.name) });
    m.log.push({ min: m.min, side: s, type: 'red', pid: p.id });
    if (i === 0) {
      const gk = bestBenchFor(side, 'GK'), victim = side.on.findIndex((id, k) => k > 0 && id != null);
      if (victim > 0) {
        side.on[0] = side.on[victim]; side.on[victim] = null;
        if (gk != null && side.subsLeft > 0) { const e = doSub(m, s, 0, gk); if (e) ev.push(e); }
      }
    }
  }
  function simPens(m) {
    const kicks = [], sc = [0, 0];
    const order = s => onPitch(m.s[s]).filter(p => slotRole(m.s[s], p.id) !== 'GK').sort((a, b) => (b.a.sho + (b.trait === 'pen' ? 20 : 0)) - (a.a.sho + (a.trait === 'pen' ? 20 : 0)));
    const ord = [order(0), order(1)];
    const prob = (s, p) => { const k = m.s[1 - s].on[0]; return clamp(.74 + (p.a.sho - 68) * .004 - ((k != null ? P(k).ovr : 40) - 68) * .004 + (p.trait === 'pen' ? .08 : 0), .5, .92); };
    const taken = [0, 0];
    for (let i = 0; i < 40; i++) {
      for (let s = 0; s < 2; s++) {
        const p = ord[s][i % Math.max(1, ord[s].length)];
        const ok = !!p && R() < prob(s, p); if (ok) sc[s]++;
        taken[s]++;
        kicks.push({ side: s, pid: p ? p.id : null, ok });
        if (i < 5 && (sc[0] > sc[1] + 5 - taken[1] || sc[1] > sc[0] + 5 - taken[0])) return { kicks, sc };
      }
      if (i >= 4 && sc[0] !== sc[1]) break;
    }
    return { kicks, sc };
  }
  function simMinute(m) {
    if (m.done) return [];
    m.min++;
    const ev = [];
    for (const sd of m.s) if (sd.shout && m.min >= sd.shout.until) sd.shout = null;
    const r = [ratings(m.s[0]), ratings(m.s[1])];
    const c0 = r[0].ctl ** 2, c1 = r[1].ctl ** 2, poss0 = c0 / (c0 + c1);
    m.st.poss[0] += poss0; m.st.poss[1] += 1 - poss0;
    const wxD = m.wx.t === 'snow' ? 1.12 : m.wx.t === 'rain' ? 1.05 : 1;
    for (let s = 0; s < 2; s++) {
      const side = m.s[s], o = 1 - s, pos = s ? 1 - poss0 : poss0, tac = side.tac;
      const homeF = m.neutral ? 1 : s === 0 ? (side.user ? 1.03 + G.fans / 100 * .07 : 1.07) : .95;
      const pc = .13 * (.55 + .9 * pos) * Math.pow(r[s].att / r[o].def, 1.7) * homeF * [.9, 1, 1.1][tac.tempo] * [.96, 1, 1.05][tac.width];
      if (R() < pc) { const e = chance(m, s, r); if (e) ev.push(e); }
      if (R() < .14 * (m.wx.t === 'rain' ? 1.15 : 1) * [.9, 1, 1.15][tac.press]) m.st.fouls[s]++;
      const pl = onPitch(side);
      if (pl.length && R() < .016 * [.9, 1, 1.2][tac.press]) {
        const p = wpick(pl, q => (slotRole(side, q.id) === 'GK' ? .15 : slotRole(side, q.id) === 'FWD' ? .7 : 1.2) * (q.trait === 'hot' ? 2.5 : 1));
        m.st.fouls[s]++;
        if (side.yel[p.id]) sendOff(m, s, p, ev, true);
        else {
          side.yel[p.id] = 1; p.yc++; m.st.yel[s]++; rate(m, p.id, -.35);
          ev.push({ type: 'yellow', min: m.min, side: s, pid: p.id, text: txt('yellow', { p: p.name }) });
          m.log.push({ min: m.min, side: s, type: 'yellow', pid: p.id });
        }
      } else if (pl.length && R() < .0007) sendOff(m, s, pick(pl), ev, false);
      const pl2 = onPitch(side);
      if (pl2.length && R() < .0009 * wxD) {
        const p = wpick(pl2, q => (q.trait === 'glass' ? 3 : 1)), i = side.on.indexOf(p.id), role = side.slots[i][0];
        p.inj = ri(2, 6);
        ev.push({ type: 'inj', min: m.min, side: s, pid: p.id, text: txt('inj', { p: p.name }) });
        if (side.user && !m.auto && side.subsLeft > 0 && side.bench.length) { side.on[i] = null; ev[ev.length - 1].need = true; ev[ev.length - 1].slot = i; }
        else { const e = injSub(m, s, i); if (e) ev.push(e); else side.on[i] = null; }
      }
      const drain = [.85, 1, 1.25][tac.press] * [.95, 1, 1.1][tac.tempo] * wxD;
      for (const p of pl2) p.fit = Math.max(20, p.fit - (slotRole(side, p.id) === 'GK' ? .06 : (.19 + side.ment * .025) * drain * (p.trait === 'iron' ? .7 : 1)));
      if (!side.user) {
        if ((m.min === 60 || m.min === 70 || m.min === 80 || m.min === 100) && side.subsLeft > 0) {
          const tired = onPitch(side).filter(p => slotRole(side, p.id) !== 'GK').sort((a, b) => a.fit - b.fit)[0];
          if (tired) {
            const i = side.on.indexOf(tired.id), rep = bestBenchFor(side, side.slots[i][0]);
            if (rep != null && eff(P(rep), side.slots[i][0]) > eff(tired, side.slots[i][0]) * .97) { const e = doSub(m, s, i, rep); if (e) ev.push(e); }
          }
        }
        if (m.min >= 70) side.ment = m.score[s] < m.score[o] ? 2 : m.score[s] > m.score[o] && m.min >= 80 ? 0 : 1;
      }
    }
    const level = m.score[0] === m.score[1];
    if (m.min === 45) ev.push({ type: 'ht', min: 45, text: txt('ht', {}) });
    if (m.min === 90 && m.cup && level) { m.et = true; ev.push({ type: 'et', min: 90, text: txt('et', {}) }); }
    else if (m.min === 120 && level) { m.pens = simPens(m); m.done = true; ev.push({ type: 'pens', min: 120, text: txt('pens', {}) }); }
    else if ((m.min >= 90 && !m.et) || m.min >= 120) { m.done = true; ev.push({ type: 'ft', min: m.min, text: txt('ft', {}) }); }
    return ev;
  }
  function injSub(m, s, i) {
    const side = m.s[s], role = side.slots[i][0];
    const rep = bestBenchFor(side, role) ?? (role !== 'GK' ? side.bench.find(id => P(id).pos !== 'GK') : null);
    return rep != null ? doSub(m, s, i, rep) : null;
  }
  function simFull(m) { m.auto = true; while (!m.done) simMinute(m); return m; }
  const winnerSide = m => (m.score[0] !== m.score[1] ? (m.score[0] > m.score[1] ? 0 : 1) : m.pens ? (m.pens.sc[0] > m.pens.sc[1] ? 0 : 1) : -1);

  function finishMatch(m) {
    const fx = m.fx;
    fx.hs = m.score[0]; fx.as = m.score[1];
    if (m.pens) fx.pens = m.pens.sc;
    if (m.cup) fx.w = m.s[winnerSide(m)].tid;
    fx.scorers = m.log.filter(l => l.type === 'goal').map(l => ({ min: l.min, side: l.side, name: P(l.pid).name }));
    let motm = null;
    for (let s = 0; s < 2; s++) {
      const side = m.s[s], team = T(side.tid), d = m.score[s] - m.score[1 - s], played = new Set(side.played);
      side.on.forEach((id, i) => { if (id != null && m.score[1 - s] === 0 && side.slots[i][0] !== 'MID' && side.slots[i][0] !== 'FWD') rate(m, id, .55); });
      for (const id of team.players) {
        const p = P(id);
        if (played.has(id)) {
          const rt = clamp(m.rt[id] + (d > 0 ? .3 : d < 0 ? -.2 : 0), 3, 10);
          m.rt[id] = rt; p.rs += rt; p.rn++; p.form.push(Math.round(rt * 10) / 10); if (p.form.length > 5) p.form.shift();
          p.apps++; p.mor = clamp(p.mor + (d > 0 ? 6 : d < 0 ? -5 : 1) + (rt >= 8 ? 2 : 0), 20, 100);
          if (!motm || rt > m.rt[motm]) motm = id;
        } else p.mor = clamp(p.mor - 1, 30, 100);
      }
    }
    m.motm = motm; fx.motm = motm != null ? P(motm).name : null;
    const us = m.s[0].user ? 0 : m.s[1].user ? 1 : -1;
    if (us >= 0) afterUserMatch(m, us);
  }
  function afterUserMatch(m, us) {
    const me = T(G.teamId), opp = T(m.s[1 - us].tid), gf = m.score[us], ga = m.score[1 - us];
    const d = m.cup && gf === ga ? (winnerSide(m) === us ? 1 : -1) : gf - ga;
    const gap = (opp.rep - opp.div * 2) - (me.rep - me.div * 2);
    if (d > 0 && G.winBonus && G.winBonus.s === G.season) { G.fin.balance += G.winBonus.amt; news(`Sponsor galibiyet primi: ${money(G.winBonus.amt)}.`, 'good'); }
    if (d > 0) { G.board += 3 + (gap > 0 ? 2 : 0); G.fans += 2 + (gap > 0 ? 2 : 0); unlock('firstWin'); if (gf - ga >= 5) unlock('bigWin'); if (gap >= 2) unlock('giant'); }
    else if (d === 0) { G.board += gap > 0 ? 1 : gap < 0 ? -1 : 0; }
    else { G.board -= gap > 0 ? 2 : gap < 0 ? 6 : 4; G.fans -= 3; }
    if (!m.cup) {
      G.streak.w = d > 0 ? G.streak.w + 1 : 0; G.streak.u = d >= 0 ? G.streak.u + 1 : 0;
      if (G.streak.w >= 5) unlock('streak5'); if (G.streak.u >= 10) unlock('unbeaten10');
    }
    if (gf - ga > 0 && (!G.rec.bigWin || gf - ga > G.rec.bigWin.d)) G.rec.bigWin = { d: gf - ga, text: `${me.name} ${gf}–${ga} ${opp.name} (${G.season}. sezon)` };
    const cnt = {};
    for (const l of m.log) if (l.type === 'goal' && l.side === us) { const n = P(l.pid).name; cnt[n] = (cnt[n] || 0) + 1; G.legends[n] = (G.legends[n] || 0) + 1; }
    if (Object.values(cnt).some(v => v >= 3)) unlock('hattrick');
    G.board = clamp(G.board, 0, 100); G.fans = clamp(G.fans, 0, 100);
    hook('userMatch', m, us, d);
    if (FM.Inbox) FM.Inbox.onMatch(m, us);
  }
  function unlock(id) {
    if (G.ach[id]) return;
    G.ach[id] = { s: G.season, w: G.week + 1 };
    news(`Başarım kazanıldı: ${FM.ACH[id][0]}.`, 'good');
    if (FM.onAch) FM.onAch(FM.ACH[id][0]);
  }

  /* ---------- Lig ---------- */
  function makeFixtures(ids) {
    const n = ids.length, arr = ids.slice().sort(() => R() - .5), rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const rd = [];
      for (let i = 0; i < n / 2; i++) { const x = arr[i], y = arr[n - 1 - i]; rd.push((r + i) % 2 ? { h: y, a: x } : { h: x, a: y }); }
      rounds.push(rd);
      arr.splice(1, 0, arr.pop());
    }
    // iç saha/deplasman sırasını dengele: art arda iki iç saha ya da deplasmanı mümkün olduğunca önle
    const last = {};
    for (const rd of rounds) for (let i = 0; i < rd.length; i++) {
      const f = rd[i];
      if ((last[f.h] === 'H' && last[f.a] !== 'H') || (last[f.a] === 'A' && last[f.h] !== 'A')) rd[i] = { h: f.a, a: f.h };
      last[rd[i].h] = 'H'; last[rd[i].a] = 'A';
    }
    const second = rounds.map(rd => rd.map(f => ({ h: f.a, a: f.h })));
    return rounds.concat(second).map(rd => rd.map(f => ({ h: f.h, a: f.a, hs: null, as: null })));
  }
  const divTeams = d => G.teams.filter(t => t.div === d);
  function table(d) {
    if (d == null) d = T(G.teamId).div;
    const rows = {};
    for (const t of divTeams(d)) rows[t.id] = { id: t.id, pl: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] };
    for (const rd of G.fixtures[d]) for (const f of rd) {
      if (f.hs == null) continue;
      const h = rows[f.h], a = rows[f.a];
      h.pl++; a.pl++; h.gf += f.hs; h.ga += f.as; a.gf += f.as; a.ga += f.hs;
      if (f.hs > f.as) { h.w++; a.l++; h.pts += 3; h.form.push('G'); a.form.push('M'); }
      else if (f.hs < f.as) { a.w++; h.l++; a.pts += 3; a.form.push('G'); h.form.push('M'); }
      else { h.d++; a.d++; h.pts++; a.pts++; h.form.push('B'); a.form.push('B'); }
    }
    return Object.values(rows).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || x.id - y.id);
  }
  const userFixture = (w = G.week) => { const f = (G.fixtures[T(G.teamId).div][w] || []).find(f => f.h === G.teamId || f.a === G.teamId); if (f && !f.wx && f.hs == null) f.wx = genWeather(w); return f; };
  function news(text, kind) { G.news.unshift({ w: G.week + 1, s: G.season, text, kind: kind || 'info' }); if (G.news.length > 40) G.news.length = 40; }

  /* ---------- Kupa ---------- */
  function drawCup() {
    const c = G.cup, n = c.alive.length;
    let target = 1; while (target * 2 <= n) target *= 2;
    const matches = target === n ? n / 2 : n - target;
    const pool = c.alive.slice().sort((a, b) => (T(a).rep - T(a).div * 2) - (T(b).rep - T(b).div * 2) + (R() - .5) * .5);
    const playing = (target === n ? pool : pool.slice(0, matches * 2)).sort(() => R() - .5);
    c.name = FM.CUP_ROUNDS[n] || 'Tur';
    c.ties = [];
    for (let i = 0; i < playing.length; i += 2) c.ties.push({ h: playing[i], a: playing[i + 1], hs: null, as: null, wx: genWeather(G.week) });
    c.final = n === 2;
    G.cupDue = true;
    const mine = c.ties.find(t => t.h === G.teamId || t.a === G.teamId);
    news(`Kupa ${c.name} kuraları çekildi.${mine ? ' Rakibin: ' + T(mine.h === G.teamId ? mine.a : mine.h).name + '.' : c.alive.includes(G.teamId) ? ' Bu turu maç yapmadan geçtin.' : ''}`, 'club');
  }
  const cupTie = () => (G.cupDue ? G.cup.ties.find(t => (t.h === G.teamId || t.a === G.teamId) && t.hs == null) : null);
  function playCupRound() {
    const c = G.cup;
    for (const t of c.ties) if (t.hs == null) { const m = simFull(newMatch(t, { cup: true, neutral: c.final })); finishMatch(m); }
    const losers = new Set(c.ties.map(t => (t.w === t.h ? t.a : t.h)));
    c.alive = c.alive.filter(id => !losers.has(id));
    c.hist.push({ name: c.name, ties: c.ties });
    const mine = c.ties.find(t => t.h === G.teamId || t.a === G.teamId);
    if (mine) {
      if (mine.w === G.teamId) { const pr = 350000 * c.hist.length; G.fin.balance += pr; G.fans = clamp(G.fans + 4, 0, 100); news(`Kupada ${c.name} geçildi. Ödül: ${money(pr)}.`, 'good'); }
      else { news('Kupaya veda ettin.', 'bad'); G.board = clamp(G.board - 2, 0, 100); }
    }
    if (c.alive.length === 1) {
      c.winner = c.alive[0];
      news(`Kupayı ${T(c.winner).name} kazandı!`, 'club');
      if (c.winner === G.teamId) { G.fin.balance += 3000000; G.museum.cups.push(G.season); G.board = clamp(G.board + 12, 0, 100); G.fans = clamp(G.fans + 12, 0, 100); unlock('cup'); }
    }
    for (const id in G.players) { const p = G.players[id]; p.fit = clamp(p.fit + 14, 0, 100); if (p.susp && T(p.tid) && c.ties.some(t => t.h === p.tid || t.a === p.tid)) p.susp = Math.max(0, p.susp - 1); }
    const done = c.ties; c.ties = []; G.cupDue = false;
    save();
    return done;
  }

  /* ---------- Yeni oyun / kayıt ---------- */
  const teamQ = t => 58 + t.rep * 3.6 - t.div * 7;
  function buildSquad(team) {
    const q = teamQ(team), plan = [['GK', 3], ['DEF', 7], ['MID', 7], ['FWD', 5]], starters = { GK: 1, DEF: 4, MID: 4, FWD: 2 };
    for (const [pos, n] of plan) for (let i = 0; i < n; i++) {
      const st = i < starters[pos];
      addToTeam(genPlayer(pos, q + (st ? ri(0, 4) : ri(-8, -2)), st ? ri(22, 31) : ri(17, 34)), team);
    }
  }
  const squadValue = t => t.players.reduce((s, id) => s + P(id).value, 0);
  function stadiumTier(t) { const v = squadValue(t) / 1e6 + (t.fac.stadium - 1) * 10; return v < 12 ? 1 : v < 24 ? 2 : v < 42 ? 3 : v < 62 ? 4 : 5; }
  function stadiumCap(t) { return Math.round((3000 + stadiumTier(t) * 7500) * (1 + (t.fac.stadium - 1) * .12) / 100) * 100; }
  function newCup() { return { alive: G.teams.filter(t => t.div <= 1).map(t => t.id), ties: [], hist: [], winner: null, name: '', final: false }; }
  function setupClub(me) {
    const wages = wageBill(me);
    G.fin = { balance: 1500000 + me.rep * 2500000 - me.div * 1000000, sponsor: Math.round(wages * .8 / 1000) * 1000, last: null, hist: [] };
    G.fin.hist.push(G.fin.balance);
    G.board = 60; G.fans = 55; G.training = { focus: 'bal', intensity: 1 }; G.youthUsed = false; G.streak = { w: 0, u: 0 }; G.offers = []; G.press = null; G.jobOffers = [];
    for (const id of me.players) P(id).sc = 1;
    me.ment = 1; ensureLineup(me);
  }
  function newGame(teamId, manager) {
    G = { v: 2, season: 1, week: 0, teamId, manager: manager || 'Teknik Direktör', nextId: 1, players: {}, teams: [], free: [], news: [], offers: [], history: [], fin: {}, cool: {}, scoutQ: [], ach: {}, rec: {}, museum: { titles: [], cups: [] }, legends: {}, cupDue: false, phase: null };
    FM.TEAMS.forEach((d, id) => {
      const t = { id, div: 0, ...d, players: [], lineup: [], formation: pick(['4-4-2', '4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '5-3-2']), ment: 1, tac: { press: ri(0, 2), tempo: ri(0, 2), line: ri(0, 2), width: ri(0, 2) }, sp: {}, fac: { training: 1, youth: 1, stadium: 1 } };
      G.teams.push(t);
      buildSquad(t); autoPick(t);
    });
    for (let i = 0; i < 28; i++) genFree();
    const me = T(teamId);
    me.formation = '4-4-2'; me.tac = { press: 1, tempo: 1, line: 1, width: 1 }; autoPick(me);
    setupClub(me);
    G.fixtures = [0, 1].map(d => makeFixtures(divTeams(d).map(t => t.id)));
    G.cup = newCup();
    FM.Inbox.ensure(); hook('ensure'); hook('newGame'); FM.Inbox.make('welcome');
    news(`${G.manager}, ${me.name} teknik direktörlüğüne getirildi. Yönetim hedefi: ${FM.DIV_TR[me.div]}'nde ${expectation(me)}. sıra veya üstü.`, 'club');
    save();
    return G;
  }
  function genFree() {
    const pos = wpick(['GK', 'DEF', 'MID', 'FWD'], p => (p === 'GK' ? 1 : 3));
    const p = genPlayer(pos, ri(52, 74), ri(18, 33));
    p.con = 0; G.free.push(p.id);
    return p;
  }
  function save() { if (!G || (FM.Settings && !FM.Settings.get('autoSave') && !FM.forceSave)) return; G.savedAt = Date.now(); try { localStorage.setItem(slotKey(SLOT), JSON.stringify(G)); localStorage.setItem('saha-kenari-slot', SLOT); } catch (e) { /* kayıt yoksa oyun yine çalışır */ } }
  function load() {
    try { const s = localStorage.getItem(slotKey(SLOT)); if (!s) return null; const g = JSON.parse(s); if (g && g.v === 2) { G = g; if (FM.Inbox) FM.Inbox.ensure(); hook('ensure'); return G; } } catch (e) { /* bozuk kayıt */ }
    return null;
  }
  function reset() { try { localStorage.removeItem(slotKey(SLOT)); } catch (e) { /* yok say */ } G = null; }
  const close = () => { G = null; };
  function slots() {
    const out = [];
    for (let n = 1; n <= 3; n++) {
      let g = null; try { const s = localStorage.getItem(slotKey(n)); g = s ? JSON.parse(s) : null; } catch (e) { g = null; }
      out.push(g && g.v === 2 ? { n, team: g.teams[g.teamId].name, tid: g.teamId, manager: g.manager, season: g.season, week: g.week, div: g.teams[g.teamId].div, at: g.savedAt || 0 } : { n, empty: true });
    }
    return out;
  }
  function useSlot(n) { SLOT = n; G = null; return load(); }
  function deleteSlot(n) { try { localStorage.removeItem(slotKey(n)); } catch (e) { /* yok say */ } if (n === SLOT) G = null; }
  const slot = () => SLOT;
  const setSlot = n => { SLOT = n; };
  const exportSave = () => JSON.stringify(G);
  function importSave(text) {
    try {
      const g = JSON.parse(text);
      if (!g || g.v !== 2 || !Array.isArray(g.teams) || !g.players || !g.fixtures || g.teamId == null) return { ok: false, msg: 'Bu metin geçerli bir Saha Kenarı kaydı değil.' };
      G = g; if (FM.Inbox) FM.Inbox.ensure(); hook('ensure'); save();
      return { ok: true, msg: 'Kariyer yüklendi.' };
    } catch (e) { return { ok: false, msg: 'Kayıt okunamadı: metin eksik ya da bozuk.' }; }
  }

  /* ---------- Finans, antrenman, hafta sonu ---------- */
  const wageBill = team => team.players.reduce((s, id) => s + P(id).wage, 0);
  function expectation(team) {
    const order = divTeams(team.div).sort((a, b) => b.rep - a.rep || a.id - b.id);
    return clamp(order.indexOf(team) + 2, 1, 12);
  }
  function trainPlayer(p, mult, focus) {
    if (p.ovr >= p.pot) return false;
    const ageF = p.age <= 21 ? 1.3 : p.age <= 24 ? 1 : p.age <= 28 ? .5 : .15;
    if (R() > .2 * mult * ageF) return false;
    const pool = p.pos === 'GK' ? ['gk', 'gk', 'phy', 'pas']
      : focus === 'att' ? ['sho', 'sho', 'pac', 'pas'] : focus === 'def' ? ['def', 'def', 'phy', 'pas']
        : focus === 'fit' ? ['phy', 'pac'] : Object.keys(W[p.pos]);
    const k = p.tf && p.tid === G.teamId && (p.pos === 'GK') === (p.tf === 'gk') && R() < .6 ? p.tf : pick(pool);   // bireysel hedef
    if (p.a[k] >= 97) return false;
    const before = p.ovr;
    p.a[k]++; refresh(p);
    return p.ovr > before;
  }
  const windowOpen = () => G.week < 4 || (G.week >= 10 && G.week < 14);
  const deadline = () => G.week === 3 || G.week === 13;
  function endWeek() {
    const me = T(G.teamId), fx = userFixture(), home = fx && fx.h === G.teamId;
    const tb = table(), myPos = tb.findIndex(r => r.id === G.teamId) + 1, cap = stadiumCap(me);
    const att = home ? Math.round(cap * clamp(.32 + G.fans / 100 * .5 + (12 - myPos) * .012 + R() * .06, .25, 1)) : 0;
    const tp = G.fin.tp || 1, att2 = Math.min(cap, Math.round(att * clamp(1.3 - tp * .3, .45, 1.12)));   // bilet fiyatı seyirciyi etkiler
    const stHold = G.fin.stS === G.season ? G.fin.stSold || 0 : 0, tickets = Math.round(Math.max(0, att2 - stHold) * (15 - me.div * 4) * tp),   // kombine sahipleri bilet almaz
      wages = wageBill(me), staff = hook('staffWages') || 0, sponsor = G.fin.sponsor;
    G.fin.last = { sponsor, tickets, wages, staff, att: att2, net: sponsor + tickets - wages - staff };
    G.fin.balance += G.fin.last.net;
    G.fin.hist.push(G.fin.balance);
    if (G.fin.balance > 30000000) unlock('bank');
    if (G.week >= 5) G.board += myPos <= expectation(me) ? 1 : myPos > expectation(me) + 2 ? -1 : 0;
    if (G.fin.balance < 0) G.board -= 3;
    G.board = clamp(G.board, 0, 100);
    G.fans = clamp(G.fans - (G.fans - 50) * .05, 0, 100);

    const tr = G.training, im = [.7, 1, 1.3][tr.intensity], improved = [];
    for (const id in G.players) {
      const p = G.players[id]; if (p.tid == null) continue;
      const mine = p.tid === G.teamId;
      if (p.inj) p.inj--;
      if (p.susp) p.susp--;
      p.fit = clamp(p.fit + (mine ? 24 * [1.25, 1, .75][tr.intensity] + (tr.focus === 'fit' ? 4 : 0) : 24), 0, 100);
      if (mine) {
        if (!p.inj && trainPlayer(p, im * (1 + (me.fac.training - 1) * .12) * (hook('trainMult', p) || 1), tr.focus)) improved.push(p.name);
        if (!p.inj && tr.intensity === 2 && R() < .012 * (p.trait === 'glass' ? 2.5 : 1)) { p.inj = ri(1, 3); news(`${p.name} yoğun antrenmanda sakatlandı (${p.inj} hafta).`, 'bad'); }
      } else if (p.age <= 23) trainPlayer(p, p.loan && p.loan.own === G.teamId ? 1.1 : .6, 'bal');
    }
    if (improved.length) news(`Antrenmanda gelişenler: ${improved.slice(0, 4).join(', ')}${improved.length > 4 ? ' ve ' + (improved.length - 4) + ' oyuncu daha' : ''}.`, 'good');
    for (const id of G.scoutQ) { const p = P(id); if (p) { p.sc = 1; news(`Scout raporu hazır: ${p.name} — güç ${p.ovr}, potansiyel ${p.pot}.`, 'info'); FM.Inbox.make('scoutRep', { pid: id }); } }
    G.scoutQ = []; G.cool = {}; G.offers = [];
    G.week++;
    if (G.week >= WEEK_COUNT) { seasonEnd(); save(); return; }
    const listed = me.players.some(id => P(id).listed === G.season);
    if (windowOpen() && R() < (deadline() ? .7 : listed ? .5 : .22) && me.players.length > 16) {
      const cands = me.players.filter(id => !P(id).loan);
      if (cands.length) {
        const p = P(wpick(cands, id => (P(id).ovr - 40) * (P(id).listed === G.season ? 4 : 1))), buyer = pick(G.teams.filter(t => t.id !== G.teamId));
        const o = { pid: p.id, tid: buyer.id, amt: r10k(p.value * (.9 + R() * .45) * (deadline() ? 1.15 : 1) * (p.listed === G.season ? .85 : 1)) };
        G.offers.push(o); FM.Inbox.make('bid', o);
        news(`${deadline() ? 'Son gün teklifi! ' : ''}${buyer.name}, ${p.name} için teklif gönderdi.`, 'offer');
      }
    }
    if (windowOpen()) aiTransfers();
    if (G.week === 4 || G.week === 14) news('Transfer dönemi kapandı. Yalnızca serbest oyuncularla anlaşabilirsin.', 'info');
    if (G.week === 10) news('Ara transfer dönemi açıldı (4 hafta).', 'club');
    if (deadline()) news('Transfer döneminin son haftası!', 'offer');
    if (G.week === 16) { const ex = me.players.map(P).filter(p => p.con <= 1 && !p.loan); if (ex.length) news(`Sözleşmesi sezon sonunda bitecekler: ${ex.map(p => p.name).join(', ')}.`, 'offer'); }
    G.press = null;
    if (CUP_AFTER.includes(G.week) && !G.cup.winner) drawCup();
    hook('endWeek');
    FM.Inbox.week();
    if (G.board <= 10 && G.week >= 8) sack();
    save();
  }
  /* Diğer kulüpler de transfer yapar: serbest oyuncu imzalar, birbirinden oyuncu alır */
  function aiTransfers() {
    const others = G.teams.filter(t => t.id !== G.teamId);
    if (R() < .4 && G.free.length) {
      const club = pick(others.filter(t => t.players.length < 26));
      const cands = club ? G.free.map(P).filter(p => p.ovr >= teamQ(club) - 3 && p.ovr <= teamQ(club) + 8) : [];
      if (cands.length) {
        const p = cands.sort((a, b) => b.ovr - a.ovr)[0];
        G.free = G.free.filter(id => id !== p.id); addToTeam(p, club); p.con = ri(2, 4); autoPick(club);
        news(`${club.name}, serbest oyuncu ${p.name} ile anlaştı.`, 'info');
      }
    }
    if (R() < .25) {
      const seller = pick(others.filter(t => t.players.length > 20));
      const buyer = seller && pick(others.filter(t => t !== seller && t.players.length < 26 && (t.rep - t.div * 2) >= (seller.rep - seller.div * 2)));
      if (buyer) {
        const cands = seller.players.map(P).filter(p => !p.loan && !seller.lineup.includes(p.id) && p.ovr >= teamQ(buyer) - 4);
        if (cands.length) {
          const p = pick(cands);
          removeFromTeam(p); addToTeam(p, buyer); p.con = ri(2, 4); autoPick(seller); autoPick(buyer);
          news(`${p.name}, ${money(r10k(p.value * 1.15))} karşılığında ${seller.name} takımından ${buyer.name} takımına transfer oldu.`, 'info');
        }
      }
    }
  }
  function sack() {
    const me = T(G.teamId);
    G.phase = 'sacked';
    const lower = G.teams.filter(t => t.div <= 1 && t.id !== me.id && (t.rep - t.div * 2) < (me.rep - me.div * 2)).sort(() => R() - .5);
    G.jobOffers = (lower.length >= 3 ? lower : G.teams.filter(t => t.div <= 1 && t.id !== me.id).sort(() => R() - .5)).slice(0, 3).map(t => t.id);
    news(`${me.name} yönetimi ${G.manager} ile yollarını ayırdı.`, 'bad');
  }
  function takeJob(tid) {
    const t = T(tid);
    G.teamId = tid; G.phase = G.summary ? 'seasonEnd' : null;
    setupClub(t);
    news(`${G.manager}, ${t.name} ile anlaştı. Hedef: ${expectation(t)}. sıra veya üstü.`, 'club');
    save();
  }
  function answerPress(i) {
    const pr = G.press; if (!pr) return null;
    const [text, fx] = FM.PRESS[pr.q].a[i];
    if (fx.fans) G.fans = clamp(G.fans + fx.fans, 0, 100);
    if (fx.board) G.board = clamp(G.board + fx.board, 0, 100);
    if (fx.mor) for (const id of T(G.teamId).players) { const p = P(id); p.mor = clamp(p.mor + fx.mor, 20, 100); }
    G.press = null; save();
    return { text, fx };
  }
  function talk(pid, kind) {
    const p = P(pid);
    if (G.cool['t' + pid]) return { ok: false, msg: 'Bu hafta bu oyuncuyla zaten konuştun.' };
    G.cool['t' + pid] = 1;
    const f = p.form.length ? p.form.reduce((a, b) => a + b, 0) / p.form.length : 6.4;
    let d, msg;
    if (kind === 'praise') { d = f >= 6.8 ? 8 : 2; msg = f >= 6.8 ? `${p.name} övgüden çok memnun.` : `${p.name} teşekkür etti ama pek etkilenmedi.`; }
    else if (f < 6.4 && R() < .6) { d = 9; msg = `${p.name} eleştiriyi hırsa çevirdi.`; }
    else { d = -8; msg = `${p.name} eleştiriden rahatsız oldu.`; }
    p.mor = clamp(p.mor + d, 20, 100); save();
    return { ok: d > 0, msg };
  }

  /* ---------- Sezon sonu ---------- */
  function seasonEnd() {
    const me = T(G.teamId), tbs = [table(0), table(1)], tb = tbs[me.div];
    const pos = tb.findIndex(r => r.id === G.teamId) + 1, exp = expectation(me);
    const prize = Math.round(((13 - pos) * 450000 + (pos === 1 ? 2500000 : 0)) * (me.div ? .4 : 1));
    G.fin.balance += prize;
    let top = null;
    for (const id in G.players) { const p = G.players[id]; if (p.tid != null && T(p.tid).div === me.div && (!top || p.g > top.g)) top = p; }
    const myTop = me.players.map(P).sort((a, b) => b.g - a.g)[0];
    if (myTop && myTop.g > 0 && (!G.rec.goals || myTop.g > G.rec.goals.g)) G.rec.goals = { name: myTop.name, g: myTop.g, s: G.season };
    if (!G.rec.pts || tb[pos - 1].pts > G.rec.pts.v) G.rec.pts = { v: tb[pos - 1].pts, s: G.season };
    const down = tbs[0].slice(-2).map(r => r.id), up = tbs[1].slice(0, 2).map(r => r.id);
    const champ = me.div === 0 && pos === 1;
    if (champ) { G.museum.titles.push(G.season); unlock('champion'); if (G.cup.winner === G.teamId) unlock('double'); }
    if (up.includes(G.teamId)) unlock('promoted');
    if (G.season >= 3) unlock('loyal');
    G.board = clamp(G.board + (pos <= exp ? 10 : -8), 0, 100);
    G.jobOffers = [];
    if (pos <= Math.max(1, exp - 2) || champ) {
      G.jobOffers = G.teams.filter(t => t.div <= 1 && t.id !== me.id && (t.rep - t.div * 2) > (me.rep - me.div * 2)).sort(() => R() - .5).slice(0, 2).map(t => t.id);
    }
    G.summary = { season: G.season, div: me.div, pos, exp, prize, champion: tbs[0][0].id, top: top ? { name: top.name, g: top.g, tid: top.tid } : null, table: tb.slice(0, 3).map(r => r.id), up, down, cup: G.cup.winner };
    G.history.push({ season: G.season, div: me.div, pos, champion: T(tbs[0][0].id).name, pts: tb[pos - 1].pts, team: me.name, cup: G.cup.winner != null ? T(G.cup.winner).name : '—' });
    hook('seasonEnd', tbs);
    G.phase = 'seasonEnd';
    if (G.board <= 10) { sack(); G.phase = 'sacked'; }
  }
  function startNewSeason() {
    const retired = [], left = [], s = G.summary;
    // kiralıklar döner
    for (const id in G.players) { const p = G.players[id]; if (p.loan && p.tid != null) { const own = T(p.loan.own); removeFromTeam(p); addToTeam(p, own); p.loan = null; } }
    for (const id of s.down) T(id).div = 1;
    for (const id of s.up) T(id).div = 0;
    for (const t of G.teams) {
      const mine = t.id === G.teamId;
      for (const id of t.players.slice()) {
        const p = P(id);
        p.age++; p.g = 0; p.as = 0; p.apps = 0; p.yc = 0; p.rc = 0; p.rs = 0; p.rn = 0; p.inj = 0; p.susp = 0; p.fit = 100; p.mor = clamp(p.mor + 5, 40, 85);
        if (p.age >= 30) { const n = ri(1, p.age >= 33 ? 4 : 2); for (let i = 0; i < n; i++) { const k = pick(p.pos === 'GK' ? ['gk', 'phy'] : ['pac', 'phy', 'pac', pick(ATTRS.slice(0, 5))]); p.a[k] = Math.max(5, p.a[k] - ri(1, 2)); } }
        refresh(p);
        p.con--;
        if (p.age >= 35 && R() < .6) { if (mine) retired.push(p.name); hook('retire', p); removeFromTeam(p); delete G.players[p.id]; continue; }
        if (p.con <= 0) {
          if (mine) { left.push(p.name); removeFromTeam(p); p.con = 0; G.free.push(p.id); }
          else p.con = ri(1, 4);
        }
      }
      const q = teamQ(t), min = mine ? { GK: 2, DEF: 5, MID: 5, FWD: 3 } : { GK: 2, DEF: 6, MID: 6, FWD: 4 };
      for (const pos of ['GK', 'DEF', 'MID', 'FWD']) while (t.players.filter(id => P(id).pos === pos).length < min[pos]) { const p = genPlayer(pos, q + ri(-6, 1), ri(17, 22)); p.con = 3; addToTeam(p, t); }
      if (!mine) autoPick(t);
    }
    const keepFree = new Set(left.length ? G.free.slice(-left.length) : []);
    for (const id of G.free) if (!keepFree.has(id) && P(id)) delete G.players[id];
    G.free = G.free.filter(id => P(id));
    for (let i = 0; i < 28; i++) genFree();
    G.season++; G.week = 0; G.phase = null; G.summary = null; G.youthUsed = false; G.offers = []; G.cool = {}; G.scoutQ = []; G.press = null; G.jobOffers = []; G.streak = { w: 0, u: 0 };
    G.fixtures = [0, 1].map(d => makeFixtures(divTeams(d).map(t => t.id)));
    G.cup = newCup(); G.cupDue = false;
    G.fin.sponsor = Math.round(G.fin.sponsor * 1.03 / 1000) * 1000;
    hook('newSeason');
    news(`${G.season}. sezon başlıyor! Transfer dönemi 4 hafta açık.`, 'club');
    if (retired.length) news(`Futbolu bırakanlar: ${retired.join(', ')}.`, 'info');
    if (left.length) news(`Sözleşmesi biten ve ayrılanlar: ${left.join(', ')}.`, 'bad');
    ensureLineup(T(G.teamId));
    save();
  }
  function simOthers() {
    for (let d = 0; d < 2; d++) for (const f of G.fixtures[d][G.week]) if (f.hs == null) finishMatch(simFull(newMatch(f)));
  }

  /* ---------- Transfer, sözleşme, scout ---------- */
  const isClause = p => p.tid != null && T(p.tid).players.length <= 18;
  function askPrice(p) {
    const k = p.disc && p.disc.s === G.season ? p.disc.k : 1;
    if (p.tid == null) return r10k(p.value * .25 * k);
    return r10k(k * p.value * (isClause(p) ? 2.2 : T(p.tid).lineup.includes(p.id) ? 1.5 : 1.15));
  }
  function marketList() {
    const out = G.free.map(P);
    for (const t of G.teams) if (t.id !== G.teamId) for (const id of t.players) if (!P(id).loan) out.push(P(id));
    return out;
  }
  function canDeal(p) {
    if (p.tid != null && !windowOpen()) return 'Transfer dönemi kapalı. Yalnızca serbest oyuncular alınabilir.';
    if (T(G.teamId).players.length >= 28) return 'Kadro dolu (en fazla 28 oyuncu).';
    if (G.cool[p.id]) return 'Bu hafta bu oyuncu için görüşme kapandı.';
    return null;
  }
  function buy(pid, haggle, terms) {
    const p = P(pid), me = T(G.teamId), err = canDeal(p);
    if (err) return { ok: false, msg: err };
    let price = askPrice(p);
    const wasFree = p.tid == null;
    if (haggle) {
      if (isClause(p)) return { ok: false, msg: 'Serbest kalma bedelinde pazarlık olmaz.' };
      price = r10k(price * .85);
      if (G.fin.balance < price) return { ok: false, msg: 'Bütçe yetersiz.' };
      if (R() > .4) { G.cool[pid] = 1; save(); return { ok: false, msg: `${p.tid == null ? 'Oyuncu' : T(p.tid).name} düşük teklifi reddetti. Gelecek hafta tekrar deneyebilirsin.` }; }
    } else if (G.fin.balance < price + (terms ? terms.bonus : 0)) return { ok: false, msg: 'Bütçe yetersiz.' };
    if (p.tid == null) G.free = G.free.filter(x => x !== pid);
    else { const old = T(p.tid); removeFromTeam(p); if (old.players.length < 16) addToTeam(genPlayer(p.pos, teamQ(old) - 4, ri(18, 22)), old); autoPick(old); }
    if (p.ovr >= Math.max(...me.players.map(id => P(id).ovr))) G.fans = clamp(G.fans + 4, 0, 100);
    addToTeam(p, me);
    G.fin.balance -= price; p.mor = 80; p.con = 3; p.wage = Math.max(p.wage, Math.round(p.value / 260 / 100) * 100);
    if (terms) { p.wage = terms.wage; p.con = terms.years; G.fin.balance -= terms.bonus; }
    hook('money', 'trOut', price + (terms ? terms.bonus : 0));
    news(`${p.name} ${money(price)} karşılığında 3 yıllık sözleşmeyle kadroya katıldı.`, 'good');
    if (FM.Press) FM.Press.transfer(wasFree ? 'free' : 'buy', p, price);
    save();
    return { ok: true, msg: `${p.name} artık takımında!`, price };
  }
  function loanIn(pid) {
    const p = P(pid), err = p.tid == null ? 'Serbest oyuncu kiralanamaz.' : canDeal(p);
    if (err) return { ok: false, msg: err };
    const old = T(p.tid);
    if (old.players.length <= 18 || old.lineup.includes(pid)) return { ok: false, msg: `${old.name} bu oyuncuyu kiralamıyor.` };
    const fee = r10k(p.value * .1);
    if (G.fin.balance < fee) return { ok: false, msg: 'Bütçe yetersiz.' };
    removeFromTeam(p); autoPick(old); p.loan = { own: old.id }; addToTeam(p, T(G.teamId));
    G.fin.balance -= fee; p.mor = 75;
    news(`${p.name}, ${old.name} takımından sezon sonuna kadar kiralandı (${money(fee)}).`, 'good');
    if (FM.Press) FM.Press.transfer('loan', p, fee);
    save();
    return { ok: true, msg: `${p.name} sezon sonuna kadar kiralandı.` };
  }
  function loanOut(pid) {
    const p = P(pid), me = T(G.teamId);
    if (!windowOpen()) return { ok: false, msg: 'Transfer dönemi kapalı.' };
    if (me.players.length <= 16) return { ok: false, msg: 'Kadroda en az 16 oyuncu kalmalı.' };
    const club = pick(G.teams.filter(t => t.id !== G.teamId && t.players.length < 26 && teamQ(t) <= p.ovr + 6)) || pick(G.teams.filter(t => t.id !== G.teamId));
    removeFromTeam(p); p.loan = { own: G.teamId }; addToTeam(p, club); autoPick(club); ensureLineup(me);
    news(`${p.name} sezon sonuna kadar ${club.name} takımına kiralandı. Maaşını onlar ödeyecek.`, 'info');
    save();
    return { ok: true, msg: `${p.name}, ${club.name} takımına kiralandı.` };
  }
  const loanedOut = () => Object.values(G.players).filter(p => p.loan && p.loan.own === G.teamId && p.tid !== G.teamId);
  function sellOffer(pid) {
    const p = P(pid), me = T(G.teamId);
    if (!windowOpen()) return { ok: false, msg: 'Transfer dönemi kapalı.' };
    if (me.players.length <= 16) return { ok: false, msg: 'Kadroda en az 16 oyuncu kalmalı.' };
    if (G.cool['s' + pid]) return { ok: false, msg: 'Bu hafta başka teklif yok.' };
    const buyer = pick(G.teams.filter(t => t.id !== G.teamId && t.players.length < 28));
    G.cool['s' + pid] = 1;
    return { ok: true, tid: buyer.id, amt: r10k(p.value * (.72 + R() * .38) * (deadline() ? 1.1 : 1)) };
  }
  function sell(pid, tid, amt) {
    const p = P(pid), buyer = T(tid);
    removeFromTeam(p); addToTeam(p, buyer); autoPick(buyer); p.con = ri(2, 4);
    G.fin.balance += amt; hook('money', 'trIn', amt);
    G.offers = G.offers.filter(o => o.pid !== pid);
    ensureLineup(T(G.teamId));
    if (amt >= 8000000) unlock('seller');
    news(`${p.name}, ${money(amt)} karşılığında ${buyer.name} takımına satıldı.`, 'info');
    if (FM.Press) FM.Press.transfer('sell', p, amt);
    save();
  }
  function renewTerms(p) { return { wage: Math.round(Math.max(p.wage, p.value / 260) * (1.08 + (p.id % 7) * .03) / 100) * 100, years: 2, bonus: r10k(p.value * .04) }; }
  function renew(pid, terms) {
    const p = P(pid), t = terms ? { wage: terms.wage, years: terms.years, bonus: terms.bonus } : renewTerms(p);
    if (p.con >= 4) return { ok: false, msg: 'Sözleşmesi zaten uzun.' };
    if (p.mor < 35) return { ok: false, msg: `${p.name} mutsuz, yeni sözleşme görüşmek istemiyor.` };
    if (G.fin.balance < t.bonus) return { ok: false, msg: 'İmza parası için bütçe yetersiz.' };
    G.fin.balance -= t.bonus; p.wage = t.wage; p.con = terms ? t.years : p.con + t.years; p.mor = clamp(p.mor + 8, 20, 100);
    news(`${p.name} sözleşmesini ${p.con} sezonluk yeniledi.`, 'good');
    save();
    return { ok: true, msg: `${p.name} ile ${p.con} sezonluk anlaşıldı.` };
  }
  function scout(pid) {
    const p = P(pid);
    if (known(p)) return { ok: false, msg: 'Bu oyuncu zaten tanınıyor.' };
    if (G.scoutQ.includes(pid)) return { ok: false, msg: 'Scout zaten yolda.' };
    if (G.scoutQ.length >= 4) return { ok: false, msg: 'Bu hafta en fazla 4 oyuncu izlenebilir.' };
    if (G.fin.balance < 30000) return { ok: false, msg: 'Bütçe yetersiz.' };
    G.fin.balance -= 30000; G.scoutQ.push(pid); save();
    return { ok: true, msg: `Scout ${p.name} için yola çıktı. Rapor hafta sonunda gelir.` };
  }
  function youthIntake() {
    if (G.youthUsed) return null;
    const me = T(G.teamId);
    if (me.players.length >= 28) return null;
    const p = genPlayer(wpick(['GK', 'DEF', 'MID', 'FWD'], x => (x === 'GK' ? 1 : 3)), ri(46, 54) + me.fac.youth * 2 - me.div * 2, ri(16, 18));
    p.pot = clamp(p.ovr + ri(12, 22) + me.fac.youth * 2, p.ovr, 94); refresh(p);
    p.wage = 800; p.con = 3;
    addToTeam(p, me); G.youthUsed = true;
    news(`Altyapıdan ${p.name} (${FM.POS_LONG[p.pos]}, ${p.age}) A takıma yükseldi.`, 'good');
    save();
    return p;
  }
  const FAC = { training: { name: 'Antrenman tesisi', base: 2000000 }, youth: { name: 'Altyapı akademisi', base: 1500000 }, stadium: { name: 'Stadyum', base: 3000000 } };
  const facCost = k => FAC[k].base * T(G.teamId).fac[k];
  function upgrade(k) {
    const me = T(G.teamId);
    if (me.fac[k] >= 5) return { ok: false, msg: 'En üst seviyede.' };
    const c = facCost(k);
    if (G.fin.balance < c) return { ok: false, msg: 'Bütçe yetersiz.' };
    G.fin.balance -= c; me.fac[k]++;
    if (me.fac[k] >= 5) unlock('builder');
    news(`${FAC[k].name} ${me.fac[k]}. seviyeye yükseltildi.`, 'club');
    save();
    return { ok: true, msg: `${FAC[k].name} geliştirildi.` };
  }
  function money(n) {
    const neg = n < 0; n = Math.abs(n);
    const s = n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace('.', ',') + ' Mn' : n >= 1e3 ? Math.round(n / 1e3) + ' Bin' : String(Math.round(n));
    return (neg ? '−' : '') + '₺' + s;
  }

  Object.assign(FM, {
    WEEK_COUNT, P, T, eff, ovrAs, available, autoPick, ensureLineup, ensureSP, benchOf, newMatch, simMinute, simFull, injSub, finishMatch, doSub, ratings, winnerSide,
    table, userFixture, newGame, save, load, reset, exportSave, importSave, endWeek, startNewSeason, simOthers, askPrice, isClause, marketList, buy, sellOffer, sell,
    loanIn, loanOut, loanedOut, renew, renewTerms, scout, known, est, avgRating, talk, answerPress, takeJob, windowOpen, deadline, cupTie, playCupRound,
    youthIntake, upgrade, facCost, FAC, money, news, canDeal, genPlayer, buildSquad, genWeather, teamQ, addToTeam, removeFromTeam, refresh, trainPlayer, unlock, r10k,
    slots, useSlot, deleteSlot, slot, setSlot, close, wageBill, expectation, stadiumCap, stadiumTier, squadValue, slotRole, divTeams
  });
})();
