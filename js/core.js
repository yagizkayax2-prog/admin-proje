/* Saha Kenarı — oyun çekirdeği: kadro üretimi, maç simülasyonu, sezon, transfer, finans */
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

  const ATTRS = ['pac', 'sho', 'pas', 'def', 'phy', 'gk'];
  const W = {
    GK: { gk: .8, phy: .1, pas: .1 },
    DEF: { def: .5, phy: .2, pac: .15, pas: .15 },
    MID: { pas: .45, def: .15, sho: .15, pac: .1, phy: .15 },
    FWD: { sho: .5, pac: .25, pas: .1, phy: .15 }
  };
  const SAVE_KEY = 'saha-kenari-v1';
  const WEEK_COUNT = 22;
  let G = null;
  Object.defineProperty(FM, 'G', { get: () => G });

  /* ---------- Oyuncular ---------- */
  function ovrAs(p, pos) { let s = 0; for (const k in W[pos]) s += p.a[k] * W[pos][k]; return Math.round(s); }
  function calcValue(p) {
    const ageF = p.age <= 21 ? 1.25 : p.age <= 25 ? 1.1 : p.age <= 28 ? 1 : p.age <= 30 ? .75 : p.age <= 32 ? .5 : .28;
    const v = 180000 * Math.pow(1.13, p.ovr - 50) * ageF * (1 + Math.max(0, p.pot - p.ovr) * .03);
    return Math.max(50000, Math.round(v / 10000) * 10000);
  }
  function refresh(p) {
    p.ovr = ovrAs(p, p.pos);
    if (p.pot < p.ovr) p.pot = p.ovr;
    p.value = calcValue(p);
  }
  function genName() {
    for (;;) { const n = pick(FM.FIRST) + ' ' + pick(FM.LAST); if (!FM.NAME_BLOCK.includes(n)) return n; }
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
      fit: ri(88, 100), mor: ri(60, 80), inj: 0, susp: 0,
      g: 0, as: 0, apps: 0, yc: 0, rc: 0,
      look: [ri(0, 4), ri(0, 4), ri(0, 3)], num: ri(2, 99)
    };
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
  function eff(p, role) {
    const base = p.pos === role ? p.ovr : ovrAs(p, role) * .92;
    return base * (.72 + .28 * p.fit / 100) * (.96 + .08 * p.mor / 100);
  }
  function addToTeam(p, team) {
    p.tid = team.id; team.players.push(p.id);
    if (p.pos === 'GK' && !team.players.some(id => id !== p.id && P(id).num === 1)) p.num = 1;
    const used = new Set(team.players.filter(id => id !== p.id).map(id => P(id).num));
    while (used.has(p.num)) p.num = ri(2, 99);
  }
  function removeFromTeam(p) {
    const t = T(p.tid); if (!t) return;
    t.players = t.players.filter(id => id !== p.id);
    t.lineup = t.lineup.map(id => (id === p.id ? null : id));
    p.tid = null;
  }

  /* ---------- Kadro seçimi ---------- */
  function autoPick(team) {
    const slots = FM.FORMATIONS[team.formation];
    const used = new Set();
    team.lineup = slots.map(s => {
      let best = null, bv = -1;
      for (const id of team.players) {
        const p = P(id);
        if (used.has(id) || !available(p)) continue;
        const v = eff(p, s[0]);
        if (v > bv) { bv = v; best = id; }
      }
      if (best != null) used.add(best);
      return best;
    });
  }
  /* Kullanıcının kadrosunda yalnızca geçersiz slotları doldurur; değişenleri döndürür */
  function ensureLineup(team) {
    const slots = FM.FORMATIONS[team.formation];
    const changed = [];
    if (!team.lineup || team.lineup.length !== 11) team.lineup = new Array(11).fill(null);
    const seen = new Set();
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
    return changed;
  }
  function benchOf(team) {
    const inXI = new Set(team.lineup);
    const rest = team.players.filter(id => !inXI.has(id) && available(P(id))).sort((a, b) => P(b).ovr - P(a).ovr);
    const gk = rest.find(id => P(id).pos === 'GK');
    const out = rest.filter(id => P(id).pos !== 'GK').slice(0, gk != null ? 8 : 9);
    if (gk != null) out.push(gk);
    return out;
  }

  /* ---------- Maç motoru ---------- */
  function makeSide(team, isUser) {
    if (isUser) ensureLineup(team); else autoPick(team);
    return {
      tid: team.id, formation: team.formation, slots: FM.FORMATIONS[team.formation],
      on: team.lineup.slice(), bench: benchOf(team), subsLeft: 5, ment: isUser ? team.ment : 1,
      yel: {}, played: team.lineup.filter(x => x != null), user: !!isUser
    };
  }
  function newMatch(fx) {
    const m = {
      fx, min: 0, score: [0, 0], done: false,
      s: [makeSide(T(fx.h), fx.h === G.teamId), makeSide(T(fx.a), fx.a === G.teamId)],
      st: { shots: [0, 0], target: [0, 0], poss: [0, 0], fouls: [0, 0], corners: [0, 0], yel: [0, 0], red: [0, 0] },
      log: []
    };
    return m;
  }
  function ratings(side) {
    let f = 0, mi = 0, d = 0, gk = 0;
    side.slots.forEach((s, i) => {
      const id = side.on[i]; if (id == null) return;
      const e = eff(P(id), s[0]);
      if (s[0] === 'FWD') f += e; else if (s[0] === 'MID') mi += e; else if (s[0] === 'DEF') d += e; else gk += e;
    });
    const am = [.9, 1, 1.1][side.ment], dm = [1.1, 1, .9][side.ment];
    return {
      att: Math.max(8, (f + mi * .45) / 3.8 * am),
      def: Math.max(8, (d * 1.15 + mi * .25 + gk) / 6.6 * dm),
      ctl: Math.max(8, (mi + f * .2 + d * .2) / 5.2),
      gk: Math.max(8, gk)
    };
  }
  const txt = (key, o) => pick(FM.TXT[key]).replace(/\{(\w)\}/g, (_, k) => o[k] || '');
  const onPitch = side => side.on.filter(x => x != null).map(P);
  function slotRole(side, pid) { const i = side.on.indexOf(pid); return i < 0 ? null : side.slots[i][0]; }

  function chance(m, s, r) {
    const side = m.s[s], opp = m.s[1 - s];
    const outfield = onPitch(side).filter(p => slotRole(side, p.id) !== 'GK');
    if (!outfield.length) return null;
    const roleW = { FWD: 5, MID: 2, DEF: .6 };
    const sh = wpick(outfield, p => roleW[slotRole(side, p.id)] * p.a.sho);
    const others = outfield.filter(p => p !== sh);
    const as = others.length && R() < .72 ? wpick(others, p => p.a.pas * (slotRole(side, p.id) === 'DEF' ? .5 : 1)) : null;
    const keeperId = opp.on[0];
    const keeper = keeperId != null ? P(keeperId) : null;
    const shoE = sh.a.sho * (.75 + .25 * sh.fit / 100);
    const pg = clamp(.118 * Math.pow(shoE / Math.max(20, r[1 - s].gk), 1.3), .03, .45);
    m.st.shots[s]++;
    const e = { type: 'chance', min: m.min, side: s, pid: sh.id, aid: as ? as.id : null, kid: keeperId };
    const names = { p: sh.name, a: as ? as.name : '', k: keeper ? keeper.name : 'Savunma' };
    const x = R();
    if (x < pg) {
      e.out = 'goal'; m.score[s]++; m.st.target[s]++;
      sh.g++; if (as) as.as++;
      e.text = txt('goal', names) + (as ? ' ' + txt('assist', names) : '');
      m.log.push({ min: m.min, side: s, type: 'goal', pid: sh.id, aid: e.aid });
    } else {
      const y = R();
      if (y < .42 && keeper) { e.out = 'save'; m.st.target[s]++; e.text = txt('save', names); }
      else if (y < .78) { e.out = 'miss'; e.text = txt('miss', names); }
      else if (y < .94) { e.out = 'block'; m.st.corners[s]++; e.text = txt('block', names); }
      else { e.out = 'post'; e.text = txt('post', names); }
    }
    return e;
  }
  function doSub(m, s, slotIdx, inId) {
    const side = m.s[s];
    const outId = side.on[slotIdx];
    if (side.subsLeft <= 0 || !side.bench.includes(inId)) return null;
    side.on[slotIdx] = inId;
    side.bench = side.bench.filter(x => x !== inId);
    side.subsLeft--;
    if (!side.played.includes(inId)) side.played.push(inId);
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
    const side = m.s[s];
    const i = side.on.indexOf(p.id);
    if (i >= 0) side.on[i] = null;
    p.susp = 2; p.rc++; m.st.red[s]++;
    ev.push({ type: 'red', min: m.min, side: s, pid: p.id, text: FM.TXT.red[second ? 1 : 0].replace('{p}', p.name) });
    m.log.push({ min: m.min, side: s, type: 'red', pid: p.id });
    // Kaleci atıldıysa bir saha oyuncusu çıkar, yedek kaleci girer
    if (i === 0) {
      const gk = bestBenchFor(side, 'GK');
      const victim = side.on.findIndex((id, k) => k > 0 && id != null);
      if (gk != null && side.subsLeft > 0 && victim > 0) {
        side.on[0] = side.on[victim]; side.on[victim] = null;
        const e = doSub(m, s, 0, gk); if (e) ev.push(e);
      } else if (victim > 0) { side.on[0] = side.on[victim]; side.on[victim] = null; }
    }
  }
  function simMinute(m) {
    if (m.done) return [];
    m.min++;
    const ev = [];
    const r = [ratings(m.s[0]), ratings(m.s[1])];
    const c0 = r[0].ctl ** 2, c1 = r[1].ctl ** 2;
    const poss0 = c0 / (c0 + c1);
    m.st.poss[0] += poss0; m.st.poss[1] += 1 - poss0;
    for (let s = 0; s < 2; s++) {
      const side = m.s[s], o = 1 - s, pos = s ? 1 - poss0 : poss0;
      const pc = .118 * (.55 + .9 * pos) * Math.pow(r[s].att / r[o].def, 1.7) * (s === 0 ? 1.07 : .95);
      if (R() < pc) { const e = chance(m, s, r); if (e) ev.push(e); }
      if (R() < .14) m.st.fouls[s]++;
      const pl = onPitch(side);
      if (pl.length && R() < .016) {
        const p = wpick(pl, q => (slotRole(side, q.id) === 'GK' ? .15 : slotRole(side, q.id) === 'FWD' ? .7 : 1.2));
        m.st.fouls[s]++;
        if (side.yel[p.id]) sendOff(m, s, p, ev, true);
        else {
          side.yel[p.id] = 1; p.yc++; m.st.yel[s]++;
          ev.push({ type: 'yellow', min: m.min, side: s, pid: p.id, text: txt('yellow', { p: p.name }) });
          m.log.push({ min: m.min, side: s, type: 'yellow', pid: p.id });
        }
      } else if (pl.length && R() < .0007) sendOff(m, s, pick(pl), ev, false);
      if (pl.length && R() < .0009) {
        const p = pick(pl), i = side.on.indexOf(p.id), role = side.slots[i][0];
        p.inj = ri(2, 6);
        ev.push({ type: 'inj', min: m.min, side: s, pid: p.id, text: txt('inj', { p: p.name }) });
        const rep = bestBenchFor(side, role) ?? (role !== 'GK' ? side.bench.find(id => P(id).pos !== 'GK') : null);
        const e = rep != null ? doSub(m, s, i, rep) : null;
        if (e) ev.push(e); else side.on[i] = null;
      }
      for (const p of pl) p.fit = Math.max(20, p.fit - (slotRole(side, p.id) === 'GK' ? .06 : .2 + side.ment * .025));
      // Yapay zekâ: değişiklik ve mentalite
      if (!side.user) {
        if ((m.min === 60 || m.min === 70 || m.min === 80) && side.subsLeft > 0) {
          const tired = onPitch(side).filter(p => slotRole(side, p.id) !== 'GK').sort((a, b) => a.fit - b.fit)[0];
          if (tired) {
            const i = side.on.indexOf(tired.id), rep = bestBenchFor(side, side.slots[i][0]);
            if (rep != null && eff(P(rep), side.slots[i][0]) > eff(tired, side.slots[i][0]) * .97) { const e = doSub(m, s, i, rep); if (e) ev.push(e); }
          }
        }
        if (m.min >= 70) side.ment = m.score[s] < m.score[o] ? 2 : m.score[s] > m.score[o] && m.min >= 80 ? 0 : 1;
      }
    }
    if (m.min === 45) ev.push({ type: 'ht', min: 45, text: txt('ht', {}) });
    if (m.min >= 90) { m.done = true; ev.push({ type: 'ft', min: 90, text: txt('ft', {}) }); }
    return ev;
  }
  function simFull(m) { while (!m.done) simMinute(m); return m; }
  function finishMatch(m) {
    m.fx.hs = m.score[0]; m.fx.as = m.score[1];
    m.fx.scorers = m.log.filter(l => l.type === 'goal').map(l => ({ min: l.min, side: l.side, name: P(l.pid).name }));
    for (let s = 0; s < 2; s++) {
      const side = m.s[s], team = T(side.tid);
      const d = m.score[s] - m.score[1 - s];
      const played = new Set(side.played);
      for (const id of team.players) {
        const p = P(id);
        if (played.has(id)) { p.apps++; p.mor = clamp(p.mor + (d > 0 ? 6 : d < 0 ? -5 : 1), 20, 100); }
        else p.mor = clamp(p.mor - 1, 30, 100);
      }
    }
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
    const second = rounds.map(rd => rd.map(f => ({ h: f.a, a: f.h })));
    return rounds.concat(second).map(rd => rd.map(f => ({ h: f.h, a: f.a, hs: null, as: null })));
  }
  function table() {
    const rows = G.teams.map(t => ({ id: t.id, pl: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] }));
    for (const rd of G.fixtures) for (const f of rd) {
      if (f.hs == null) continue;
      const h = rows[f.h], a = rows[f.a];
      h.pl++; a.pl++; h.gf += f.hs; h.ga += f.as; a.gf += f.as; a.ga += f.hs;
      if (f.hs > f.as) { h.w++; a.l++; h.pts += 3; h.form.push('G'); a.form.push('M'); }
      else if (f.hs < f.as) { a.w++; h.l++; a.pts += 3; a.form.push('G'); h.form.push('M'); }
      else { h.d++; a.d++; h.pts++; a.pts++; h.form.push('B'); a.form.push('B'); }
    }
    rows.sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || x.id - y.id);
    return rows;
  }
  const userFixture = (w = G.week) => (G.fixtures[w] || []).find(f => f.h === G.teamId || f.a === G.teamId);
  function news(text, kind) { G.news.unshift({ w: G.week + 1, s: G.season, text, kind: kind || 'info' }); if (G.news.length > 40) G.news.length = 40; }

  /* ---------- Yeni oyun / kayıt ---------- */
  function buildSquad(team, q) {
    const plan = [['GK', 3], ['DEF', 7], ['MID', 7], ['FWD', 5]];
    const starters = { GK: 1, DEF: 4, MID: 4, FWD: 2 };
    for (const [pos, n] of plan) for (let i = 0; i < n; i++) {
      const st = i < starters[pos];
      addToTeam(genPlayer(pos, q + (st ? ri(0, 4) : ri(-8, -2)), st ? ri(22, 31) : ri(17, 34)), team);
    }
  }
  function stadiumCap(t) { return Math.round((8000 + t.rep * 7000) * (1 + (t.fac ? t.fac.stadium - 1 : 0) * .15) / 100) * 100; }
  function newGame(teamId, manager) {
    G = { v: 1, season: 1, week: 0, teamId, manager: manager || 'Teknik Direktör', nextId: 1, players: {}, teams: [], free: [], news: [], offers: [], history: [], fin: {}, training: { focus: 'bal', intensity: 1 }, youthUsed: false, cool: {} };
    FM.TEAMS.forEach((d, id) => {
      const t = { id, ...d, players: [], lineup: [], formation: pick(['4-4-2', '4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '5-3-2']), ment: 1, fac: { training: 1, youth: 1, stadium: 1 } };
      G.teams.push(t);
      buildSquad(t, 58 + d.rep * 3.6);
      autoPick(t);
    });
    for (let i = 0; i < 24; i++) genFree();
    const me = T(teamId);
    me.formation = '4-4-2'; autoPick(me);
    const wages = wageBill(me);
    G.fin = { balance: 2000000 + me.rep * 2500000, sponsor: Math.round(wages * .8 / 1000) * 1000, last: null, hist: [] };
    G.fin.hist.push(G.fin.balance);
    G.fixtures = makeFixtures(G.teams.map(t => t.id));
    news(`${G.manager}, ${me.name} teknik direktörlüğüne getirildi. Yönetim hedefi: ${expectation(me)}. sıra veya üstü.`, 'club');
    save();
    return G;
  }
  function genFree() {
    const pos = wpick(['GK', 'DEF', 'MID', 'FWD'], p => (p === 'GK' ? 1 : 3));
    const p = genPlayer(pos, ri(56, 74), ri(18, 33));
    G.free.push(p.id);
    return p;
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch (e) { /* kayıt yoksa oyun yine çalışır */ } }
  function load() {
    try { const s = localStorage.getItem(SAVE_KEY); if (!s) return null; const g = JSON.parse(s); if (g && g.v === 1) { G = g; return G; } } catch (e) { /* bozuk kayıt */ }
    return null;
  }
  function reset() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* yok say */ } G = null; }

  /* ---------- Finans, antrenman, hafta sonu ---------- */
  const wageBill = team => team.players.reduce((s, id) => s + P(id).wage, 0);
  function expectation(team) {
    const order = G.teams.slice().sort((a, b) => b.rep - a.rep || a.id - b.id);
    return clamp(order.indexOf(team) + 2, 1, 12);
  }
  function trainPlayer(p, mult, focus) {
    if (p.ovr >= p.pot) return false;
    const ageF = p.age <= 21 ? 1.3 : p.age <= 24 ? 1 : p.age <= 28 ? .5 : .15;
    if (R() > .2 * mult * ageF) return false;
    const pool = p.pos === 'GK' ? ['gk', 'gk', 'phy', 'pas']
      : focus === 'att' ? ['sho', 'sho', 'pac', 'pas'] : focus === 'def' ? ['def', 'def', 'phy', 'pas']
        : focus === 'fit' ? ['phy', 'pac'] : Object.keys(W[p.pos]);
    const k = pick(pool);
    if (p.a[k] >= 97) return false;
    const before = p.ovr;
    p.a[k]++; refresh(p);
    return p.ovr > before;
  }
  function endWeek() {
    const me = T(G.teamId);
    const fx = userFixture();
    const home = fx && fx.h === G.teamId;
    const tb = table();
    const myPos = tb.findIndex(r => r.id === G.teamId) + 1;
    const cap = stadiumCap(me);
    const att = home ? Math.round(cap * clamp(.52 + me.rep * .05 + (12 - myPos) * .018 + R() * .08, .35, 1)) : 0;
    const tickets = att * 15, wages = wageBill(me), sponsor = G.fin.sponsor;
    G.fin.last = { sponsor, tickets, wages, att, net: sponsor + tickets - wages };
    G.fin.balance += G.fin.last.net;
    G.fin.hist.push(G.fin.balance);

    const tr = G.training, im = [.7, 1, 1.3][tr.intensity];
    const improved = [];
    for (const t of G.teams) {
      const mine = t.id === G.teamId;
      for (const id of t.players) {
        const p = P(id);
        if (p.inj) p.inj--;
        if (p.susp) p.susp--;
        const rec = mine ? 24 * [1.25, 1, .75][tr.intensity] + (tr.focus === 'fit' ? 4 : 0) : 24;
        p.fit = clamp(p.fit + rec, 0, 100);
        if (mine) {
          if (!p.inj && trainPlayer(p, im * (1 + (me.fac.training - 1) * .12), tr.focus)) improved.push(p.name);
          if (!p.inj && tr.intensity === 2 && R() < .012) { p.inj = ri(1, 3); news(`${p.name} yoğun antrenmanda sakatlandı (${p.inj} hafta).`, 'bad'); }
        } else if (p.age <= 23) trainPlayer(p, .6, 'bal');
      }
    }
    if (improved.length) news(`Antrenmanda gelişenler: ${improved.slice(0, 4).join(', ')}${improved.length > 4 ? ' ve ' + (improved.length - 4) + ' oyuncu daha' : ''}.`, 'good');
    G.cool = {};
    G.offers = [];
    if (R() < .22 && me.players.length > 16) {
      const p = P(wpick(me.players, id => P(id).ovr - 40));
      const buyer = pick(G.teams.filter(t => t.id !== G.teamId));
      G.offers.push({ pid: p.id, tid: buyer.id, amt: Math.round(p.value * (.9 + R() * .45) / 10000) * 10000 });
      news(`${buyer.name}, ${p.name} için teklif gönderdi.`, 'offer');
    }
    G.week++;
    if (G.week >= WEEK_COUNT) seasonEnd();
    save();
  }
  function seasonEnd() {
    const tb = table();
    const pos = tb.findIndex(r => r.id === G.teamId) + 1;
    const me = T(G.teamId);
    const prize = (13 - pos) * 450000 + (pos === 1 ? 2500000 : 0);
    const exp = expectation(me);
    G.fin.balance += prize;
    let top = null;
    for (const id in G.players) { const p = G.players[id]; if (p.tid != null && (!top || p.g > top.g)) top = p; }
    G.summary = { season: G.season, pos, exp, prize, champion: tb[0].id, top: top ? { name: top.name, g: top.g, tid: top.tid } : null, table: tb.slice(0, 3).map(r => r.id) };
    G.history.push({ season: G.season, pos, champion: T(tb[0].id).name, pts: tb[pos - 1].pts });
    G.phase = 'seasonEnd';
  }
  function startNewSeason() {
    const retired = [];
    for (const t of G.teams) {
      for (const id of t.players.slice()) {
        const p = P(id);
        p.age++; p.g = 0; p.as = 0; p.apps = 0; p.yc = 0; p.rc = 0; p.inj = 0; p.susp = 0; p.fit = 100; p.mor = clamp(p.mor + 5, 40, 85);
        if (p.age >= 30) { const n = ri(1, p.age >= 33 ? 4 : 2); for (let i = 0; i < n; i++) { const k = pick(p.pos === 'GK' ? ['gk', 'phy'] : ['pac', 'phy', 'pac', pick(ATTRS.slice(0, 5))]); p.a[k] = Math.max(5, p.a[k] - ri(1, 2)); } }
        refresh(p);
        if (p.age >= 35 && R() < .6) {
          if (t.id === G.teamId) retired.push(p.name);
          removeFromTeam(p); delete G.players[p.id];
        }
      }
      if (t.id !== G.teamId) {
        const q = 58 + t.rep * 3.6;
        for (const pos of ['GK', 'DEF', 'MID', 'FWD']) {
          const need = { GK: 2, DEF: 6, MID: 6, FWD: 4 }[pos];
          while (t.players.filter(id => P(id).pos === pos).length < need) addToTeam(genPlayer(pos, q + ri(-6, 1), ri(17, 22)), t);
        }
      }
    }
    for (const id of G.free) delete G.players[id];
    G.free = [];
    for (let i = 0; i < 24; i++) genFree();
    G.season++; G.week = 0; G.phase = null; G.summary = null; G.youthUsed = false; G.offers = []; G.cool = {};
    G.fixtures = makeFixtures(G.teams.map(t => t.id));
    G.fin.sponsor = Math.round(G.fin.sponsor * 1.03 / 1000) * 1000;
    news(`${G.season}. sezon başlıyor!`, 'club');
    if (retired.length) news(`Futbolu bırakanlar: ${retired.join(', ')}.`, 'info');
    ensureLineup(T(G.teamId));
    save();
  }

  /* ---------- Haftayı oynat ---------- */
  function simOthers() {
    const res = [];
    for (const f of G.fixtures[G.week]) {
      if (f.hs != null) continue;
      const m = simFull(newMatch(f)); finishMatch(m); res.push(f);
    }
    return res;
  }

  /* ---------- Transfer ---------- */
  function askPrice(p) {
    if (p.tid == null) return Math.round(p.value * .25 / 10000) * 10000;
    const t = T(p.tid);
    return Math.round(p.value * (t.lineup.includes(p.id) ? 1.5 : 1.15) / 10000) * 10000;
  }
  function marketList() {
    const out = G.free.map(P);
    for (const t of G.teams) if (t.id !== G.teamId && t.players.length > 18) for (const id of t.players) out.push(P(id));
    return out;
  }
  function buy(pid, haggle) {
    const p = P(pid), me = T(G.teamId);
    if (me.players.length >= 28) return { ok: false, msg: 'Kadro dolu (en fazla 28 oyuncu).' };
    if (G.cool[pid]) return { ok: false, msg: 'Bu hafta bu oyuncu için görüşme kapandı.' };
    let price = askPrice(p);
    if (haggle) {
      price = Math.round(price * .85 / 10000) * 10000;
      if (G.fin.balance < price) return { ok: false, msg: 'Bütçe yetersiz.' };
      if (R() > .4) { G.cool[pid] = 1; save(); return { ok: false, msg: `${p.tid == null ? 'Oyuncu' : T(p.tid).name} düşük teklifi reddetti. Gelecek hafta tekrar deneyebilirsin.` }; }
    } else if (G.fin.balance < price) return { ok: false, msg: 'Bütçe yetersiz.' };
    if (p.tid == null) G.free = G.free.filter(x => x !== pid);
    else { const old = T(p.tid); removeFromTeam(p); autoPick(old); }
    addToTeam(p, me);
    G.fin.balance -= price; p.mor = 80;
    news(`${p.name} ${money(price)} karşılığında kadroya katıldı.`, 'good');
    save();
    return { ok: true, msg: `${p.name} artık takımında!`, price };
  }
  function sellOffer(pid) {
    const p = P(pid), me = T(G.teamId);
    if (me.players.length <= 16) return { ok: false, msg: 'Kadroda en az 16 oyuncu kalmalı.' };
    if (G.cool['s' + pid]) return { ok: false, msg: 'Bu hafta başka teklif yok.' };
    const buyer = pick(G.teams.filter(t => t.id !== G.teamId && t.players.length < 28));
    G.cool['s' + pid] = 1;
    return { ok: true, tid: buyer.id, amt: Math.round(p.value * (.72 + R() * .38) / 10000) * 10000 };
  }
  function sell(pid, tid, amt) {
    const p = P(pid), buyer = T(tid);
    removeFromTeam(p); addToTeam(p, buyer); autoPick(buyer);
    G.fin.balance += amt;
    G.offers = G.offers.filter(o => o.pid !== pid);
    ensureLineup(T(G.teamId));
    news(`${p.name}, ${money(amt)} karşılığında ${buyer.name} takımına satıldı.`, 'info');
    save();
  }
  function youthIntake() {
    if (G.youthUsed) return null;
    const me = T(G.teamId);
    if (me.players.length >= 28) return null;
    const p = genPlayer(wpick(['GK', 'DEF', 'MID', 'FWD'], x => (x === 'GK' ? 1 : 3)), ri(48, 56) + me.fac.youth * 2, ri(16, 18));
    p.pot = clamp(p.ovr + ri(12, 22) + me.fac.youth * 2, p.ovr, 94); refresh(p);
    p.wage = 800;
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
    WEEK_COUNT, P, T, eff, ovrAs, available, autoPick, ensureLineup, benchOf, newMatch, simMinute, simFull, finishMatch, doSub, ratings,
    table, userFixture, newGame, save, load, reset, endWeek, startNewSeason, simOthers, askPrice, marketList, buy, sellOffer, sell,
    youthIntake, upgrade, facCost, FAC, money, wageBill, expectation, stadiumCap, slotRole
  });
})();
