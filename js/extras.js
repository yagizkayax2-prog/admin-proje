/* Saha Kenarı — ek özellikler: başkan ve seçimler, süreli tesis inşaatı, forma ve mağaza geliri, milli takım görevi,
   tribün olaylarında disiplin cezası ve kapalı tribün, haftanın 11'i ve haftanın golü.
   FM.Career kancalarını sarar; çekirdek FM.Ext üzerinden birkaç değere bakar. Veriler G.ex altında durur. */
(function () {
  const { pick, clamp, wpick } = FM.util;
  const R = Math.random, P = id => FM.P(id), T = id => FM.T(id), money = FM.money, G_ = () => FM.G;
  const r10k = v => Math.round(v / 10000) * 10000;
  const me = () => T(G_().teamId);
  const pname = () => pick(FM.FIRST) + ' ' + pick(FM.LAST);
  const BUILD_W = { stadium: 6, training: 4, youth: 3 };
  const facName = k => (FM.Career.FACS && FM.Career.FACS[k] ? FM.Career.FACS[k].n : FM.FAC[k] ? FM.FAC[k].name : k);

  function X() {
    const G = G_(); if (!G) return null;
    const x = G.ex || (G.ex = {});
    if (!x.pres) x.pres = { name: pname(), type: pick(Object.keys(FM.PRES_T)), since: G.season };
    if (!x.nat) x.nat = { job: false, offered: false, rec: { w: 0, d: 0, l: 0 }, rep: 50, matches: [], titles: [] };
    if (x.disc == null) x.disc = 0;
    return x;
  }

  /* ---------- çekirdeğin baktığı değerler ---------- */
  function expAdj() { const x = X(); return x ? FM.PRES_T[x.pres.type][2] : 0; }
  function capMult() { const x = X(); return x && x.build && x.build.k === 'stadium' ? .75 : 1; }

  /* ---------- haftanın 11'i ve golü ---------- */
  function recordWeek(m) {
    const G = G_(); if (!G || T(m.fx.h).div !== me().div) return;
    const x = X();
    if (!x.wk || x.wk.s !== G.season || x.wk.w !== G.week) x.wk = { s: G.season, w: G.week, rt: {}, goals: [] };
    for (const sd of m.s) for (const id of sd.played) if (m.rt[id] != null) x.wk.rt[id] = Math.round(m.rt[id] * 10) / 10;
    for (const l of m.log) if (l.type === 'goal') x.wk.goals.push({ pid: l.pid, kind: l.kind, min: l.min, tid: m.s[l.side].tid, opp: m.s[1 - l.side].tid });
  }
  function weekAwards() {
    const G = G_(), x = X(), W = x.wk; if (!W || W.s !== G.season || W.w !== G.week - 1) return;
    const ids = Object.keys(W.rt).map(Number).filter(id => P(id) && P(id).tid != null), xi = [];
    for (const [pos, n] of [['GK', 1], ['DEF', 4], ['MID', 4], ['FWD', 2]]) ids.filter(id => P(id).pos === pos).sort((a, b) => W.rt[b] - W.rt[a]).slice(0, n).forEach(id => xi.push({ pid: id, name: P(id).name, team: T(P(id).tid).name, tid: P(id).tid, pos, r: W.rt[id] }));
    x.totw = { s: G.season, w: W.w, xi };
    for (const e of xi) if (e.tid === G.teamId) { const p = P(e.pid); p.mor = clamp(p.mor + 3, 20, 100); }
    const desc = { fk: 'frikikten', ck: 'kornerden kafayla', pen: 'penaltıdan', open: 'akan oyunda' };
    const cands = W.goals.filter(g => P(g.pid)).sort(() => R() - .5).sort((a, b) => (b.kind === 'fk') - (a.kind === 'fk')).slice(0, 3);
    if (cands.length >= 2) {
      const ws = cands.map(g => .5 + R() + (g.kind === 'fk' ? .6 : 0) + (g.tid === G.teamId ? .3 : 0)), tot = ws.reduce((a, b) => a + b, 0);
      x.gotw = { s: G.season, w: W.w, voted: null, cands: cands.map((g, i) => ({ pid: g.pid, name: P(g.pid).name, team: T(g.tid).name, mine: g.tid === G.teamId, desc: `${T(g.opp).name} karşısında ${g.min}. dakikada ${desc[g.kind] || 'akan oyunda'}`, pct: Math.round(ws[i] / tot * 100) })) };
    } else x.gotw = null;
  }
  function voteGoal(i) {
    const g = X().gotw; if (!g || g.voted != null) return;
    g.voted = i; g.cands[i].pct += 4; const tot = g.cands.reduce((a, c) => a + c.pct, 0); g.cands.forEach(c => { c.pct = Math.round(c.pct / tot * 100); }); FM.save();
  }

  /* ---------- forma ve mağaza geliri ---------- */
  function merch() {
    const G = G_(), t = me(), x = X(), pos = FM.table().findIndex(r => r.id === G.teamId) + 1;
    const top = t.players.map(P).sort((a, b) => b.value - a.value).slice(0, 3).reduce((a, p) => a + p.value, 0);
    const succ = clamp(1 + (FM.expectation(t) - pos) * .03, .8, 1.3), boost = x.mboost && x.mboost.w > 0 ? x.mboost.k : 1;
    if (x.mboost && x.mboost.w > 0) x.mboost.w--;
    const v = Math.round((30000 + t.rep * 12000) * (.4 + G.fans / 100) * (1 + top / 60000000) * succ * boost * (t.div ? .5 : 1) / 1000) * 1000;
    G.fin.balance += v; if (G.fin.last) { G.fin.last.merch = v; G.fin.last.net += v; }
    if (G.fin.hist.length) G.fin.hist[G.fin.hist.length - 1] = G.fin.balance;
    if (FM.Career.money) FM.Career.money('merch', v);
  }

  /* ---------- süreli tesis inşaatı ---------- */
  function upgradeTimed(k) {
    const G = G_(), t = me(), x = X(), lv = t.fac[k] || 0;
    if (x.build) return { ok: false, msg: `Şu an ${facName(x.build.k).toLocaleLowerCase('tr')} inşaatı sürüyor (${x.build.w} hafta kaldı).` };
    if (lv >= 5) return { ok: false, msg: 'En üst seviyede.' };
    const c = FM.facCost(k);
    if (G.fin.balance < c) return { ok: false, msg: 'Bütçe yetersiz.' };
    const w = BUILD_W[k] || 3;
    G.fin.balance -= c; x.build = { k, w, total: w, to: lv + 1 };
    if (FM.Career.money) FM.Career.money('trOut', 0);
    FM.news(`${facName(k)} inşaatı başladı (${w} hafta).${k === 'stadium' ? ' İnşaat boyunca stadyum kapasitesi %25 düşük olacak.' : ''}`, 'club', { cat: 'KULÜP', title: `${facName(k)} inşaatı başladı` });
    FM.save();
    return { ok: true, msg: `${facName(k)} inşaatı başladı: ${w} hafta sürecek.` };
  }
  function buildTick() {
    const x = X(); if (!x.build) return;
    if (--x.build.w > 0) return;
    const b = x.build, t = me(); t.fac[b.k] = Math.max(t.fac[b.k] || 0, b.to); x.build = null;
    if (t.fac[b.k] >= 5) FM.unlock('builder');
    FM.news(`${facName(b.k)} inşaatı tamamlandı: artık ${t.fac[b.k]}. seviye.`, 'good', { cat: 'KULÜP', title: `${facName(b.k)} açıldı` });
  }

  /* ---------- başkan ve seçim ---------- */
  function election() {
    const G = G_(), x = X(), old = x.pres;
    x.pres = { name: pname(), type: pick(Object.keys(FM.PRES_T)), since: G.season }; G.board = 55;
    FM.mail({ cat: 'KULÜP', from: 'Kulüp sekreteri', title: `Kulüpte seçim: yeni başkan ${x.pres.name}`, body: `${old.name} dönemi sona erdi. Genel kurulda ${x.pres.name} başkan seçildi. Yönetim anlayışı: ${FM.PRES_T[x.pres.type][0]}. ${FM.PRES_T[x.pres.type][1]} Yönetim güveni yeniden 55'ten başlıyor.` });
  }
  function presWeek(pos, exp) {
    const G = G_(), x = X();
    if (x.pres.type === 'sabirsiz' && G.week >= 5 && pos > exp + 2) G.board = clamp(G.board - 1, 0, 100);
    if (x.pres.type === 'yatirimci' && G.board >= 55 && R() < .05) { const amt = r10k(500000 + R() * 1000000); G.fin.balance += amt; FM.mail({ cat: 'MALİYE', from: `Başkan ${x.pres.name}`, title: 'Başkandan transfer bütçesine destek', body: `Başkan ${x.pres.name} kendi şirketinden kulübe ${money(amt)} aktardı. "Takımı güçlendir" dedi.` }); }
  }

  /* ---------- milli takım ---------- */
  const pois = l => { let k = 0, p = 1; const L = Math.exp(-l); do { k++; p *= R(); } while (p > L && k < 12); return k - 1; };
  function natSquad() { const G = G_(); return Object.values(G.players).filter(p => p.tid != null && T(p.tid).div < 2 && !p.inj && !p.y && !FM.FFIRST.includes(p.name.split(' ')[0])).sort((a, b) => b.ovr - a.ovr).slice(0, 23); }
  function natMatch(opp, ko) {
    const G = G_(), n = X().nat, sq = natSquad(), a = sq.slice(0, 11).reduce((s, p) => s + p.ovr, 0) / Math.max(1, Math.min(11, sq.length)) + (n.rep - 50) * .04, b = opp[1];
    const gf = pois(1.3 * Math.pow(a / b, 6)), ga = pois(1.3 * Math.pow(b / a, 6)), sc = [];
    for (let i = 0; i < gf; i++) sc.push(wpick(sq, p => ({ GK: 0, DEF: 1, MID: 3, FWD: 6 }[p.pos])).name);
    let win = gf > ga ? 1 : gf < ga ? -1 : 0, pens = null;
    if (ko && !win) { win = R() < .5 + (a - b) * .02 ? 1 : -1; pens = win > 0 ? '(penaltılarla kazandık)' : '(penaltılarla kaybettik)'; }
    n.rec[win > 0 ? 'w' : win < 0 ? 'l' : 'd']++;
    n.rep = clamp(n.rep + (win > 0 ? 3 : win < 0 ? -3 : 0) + (b > a ? 1 : 0), 0, 100);
    const r = { opp: opp[0], gf, ga, sc, win, pens, s: G.season, w: G.week };
    n.matches.unshift(r); if (n.matches.length > 12) n.matches.length = 12;
    return r;
  }
  const natLine = r => `Türkiye ${r.gf}–${r.ga} ${r.opp}${r.pens ? ' ' + r.pens : ''}${r.sc.length ? ' (goller: ' + r.sc.join(', ') + ')' : ''}`;
  function natBreak() {
    const res = FM.NATIONS.slice().sort(() => R() - .5).slice(0, 2).map(o => natMatch(o, false));
    FM.mail({ cat: 'KULÜP', from: 'Futbol federasyonu', title: `Milli takım: ${res.map(r => `${r.gf}–${r.ga} ${r.opp}`).join(', ')}`, body: res.map(natLine).join('. ') + `. Federasyon güveni: ${Math.round(X().nat.rep)}.` });
    if (X().nat.rep <= 20) natFire();
  }
  function natTournament() {
    const n = X().nat, field = FM.NATIONS.slice().sort((a, b) => b[1] - a[1]).slice(0, 10).sort(() => R() - .5).slice(0, 3), lines = [];
    let champ = true;
    ['Çeyrek final', 'Yarı final', 'Final'].forEach((rn, i) => { if (!champ) return; const r = natMatch(field[i], true); lines.push(`${rn}: ${natLine(r)}`); if (r.win < 0) champ = false; });
    if (champ) { n.titles.push(G_().season); G_().fans = clamp(G_().fans + 8, 0, 100); }
    n.rep = clamp(n.rep + (champ ? 15 : -4), 0, 100);
    FM.mail({ cat: 'KULÜP', from: 'Futbol federasyonu', title: champ ? 'Kıta Şampiyonası: ŞAMPİYON OLDUK!' : 'Kıta Şampiyonası sona erdi', body: lines.join('. ') + '.' });
    if (n.rep <= 20) natFire();
  }
  function natFire() { const n = X().nat; n.job = false; n.offered = false; FM.mail({ cat: 'KULÜP', from: 'Futbol federasyonu', title: 'Milli takım görevi sona erdi', body: 'Kötü sonuçların ardından federasyon milli takımdaki görevine son verdi.' }); }
  function natOffer() {
    const G = G_(), x = X(), mu = G.museum, won = mu.titles.length + mu.cups.length + (mu.euro || []).length > 0;
    if (x.nat.job || x.nat.offered || G.season < 2 || !(won || G.board >= 75) || R() > .7) return;
    x.nat.offered = true;
    FM.mail({ cat: 'KULÜP', kind: 'x', sub: 'exNat', from: 'Futbol federasyonu', title: 'Milli takım teklifi', body: 'Federasyon, kulüp görevini sürdürürken milli takımı da çalıştırmanı istiyor. Milli aralarda iki maç oynanır, çift sezonların sonunda Kıta Şampiyonası var. Kötü sonuçlarda federasyon görevine son verebilir.', opts: ['Kabul et', 'Reddet'] });
  }

  /* ---------- tribün olayları: disiplin ---------- */
  function discipline(m, us) {
    const G = G_(), x = X();
    if (m.closed) x.closed = false;
    if (us !== 0 || !m.inc || !m.inc.length) return;
    const fine = m.inc.reduce((a, k) => a + (k === 'flare' ? 150000 : 60000), 0); G.fin.balance -= fine; x.disc += m.inc.length;
    let t = `Tribün olayları (${m.inc.map(k => (k === 'flare' ? 'meşale' : 'sahaya giren taraftar')).join(', ')}) nedeniyle ${money(fine)} para cezası verildi.`;
    if (x.disc >= 3) { x.closed = true; x.disc = 0; t += ' Olaylar tekrarlandığı için bir sonraki iç saha maçında tribünlerin bir bölümü kapatılacak.'; }
    FM.news(t, 'bad', { cat: 'KULÜP', from: 'Disiplin kurulu', title: 'Disiplin kurulu: tribün olayları' });
  }

  /* ---------- kancalar ---------- */
  const C = FM.Career, base = { ...C };
  C.ensure = () => { base.ensure && base.ensure(); X(); };
  C.newGame = () => { base.newGame && base.newGame(); X(); };
  C.newSeason = () => {
    base.newSeason && base.newSeason(); const G = G_(), x = X();
    x.disc = 0;
    if (G.season % 2 === 1 && G.season > 1) election();
    natOffer();
  };
  C.userMatch = (m, us, d) => {
    base.userMatch && base.userMatch(m, us, d); const G = G_(), x = X();
    discipline(m, us);
    if (x.pres.type === 'altyapici' && m.s[us].played.some(id => P(id) && P(id).age <= 21)) G.board = clamp(G.board + 1, 0, 100);
  };
  C.endWeek = () => {
    base.endWeek && base.endWeek(); const G = G_(); if (!G) return;
    const t = me(), pos = FM.table().findIndex(r => r.id === G.teamId) + 1;
    merch(); buildTick(); weekAwards(); presWeek(pos, FM.expectation(t));
    if ((G.week === 7 || G.week === 16) && X().nat.job) natBreak();
  };
  C.seasonEnd = tbs => { base.seasonEnd && base.seasonEnd(tbs); const G = G_(); if (X().nat.job && G.season % 2 === 0) natTournament(); };
  C.decide = (m, i) => {
    if (m.sub === 'exNat') { if (i === 0) { const n = X().nat; n.job = true; n.rep = 50; G_().fans = clamp(G_().fans + 3, 0, 100); return 'Artık milli takımın da teknik direktörüsün!'; } return 'Teklifi kibarca reddettin.'; }
    return base.decide ? base.decide(m, i) : undefined;
  };
  C.upgradeFac = k => upgradeTimed(k);
  FM.upgrade = upgradeTimed;
  C.transfer = (kind, p, price) => {
    base.transfer && base.transfer(kind, p, price);
    if ((kind === 'buy' || kind === 'free') && p && (p.value >= 5000000 || p.ovr >= Math.max(...me().players.map(id => P(id).ovr)))) {
      X().mboost = { k: 1.6, w: 4 };
      FM.news(`${p.name} forması satış rekoru kırıyor!`, 'good', { cat: 'MALİYE', title: 'Forma satışları patladı' });
    }
  };

  FM.Ext = { X, expAdj, capMult, recordWeek, voteGoal, natSquad, BUILD_W, facName };
})();
