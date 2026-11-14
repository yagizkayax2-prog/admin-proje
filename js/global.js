/* Saha Kenarı — dünya katmanı: zorluk, işsiz başlangıç ve iş başvurusu/mülakat, milli takımla başlangıç,
   kıtasal scout ağı, oyuncu kariyer geçmişi ve kulüp tarihi. FM.Career kancalarını sarar; veriler G.gl altında durur. */
(function () {
  const { pick, clamp } = FM.util;
  const R = Math.random, P = id => FM.P(id), T = id => FM.T(id), G_ = () => FM.G;
  const C = FM.Career, base = { ...C };
  const me = () => T(G_().teamId);
  const ccName = cc => (FM.COUNTRIES[cc] ? FM.COUNTRIES[cc].n : cc === 'EU' ? 'Avrupa' : cc);
  const contOf = cc => (FM.COUNTRIES[cc] ? FM.COUNTRIES[cc].cont : 'Avrupa');
  const DIFF = [['Kolay', 'Daha sabırlı yönetim, %30 fazla bütçe, takımın biraz daha güçlü oynar.'], ['Normal', 'Dengeli deneyim.'], ['Zor', 'Sabırsız yönetim, %20 az bütçe, rakipler bir adım önde.']];

  function W() {
    const G = G_(); if (!G) return null;
    const w = G.gl || (G.gl = {});
    if (!w.snet) w.snet = {};      // kıta → 1 (scout ağı kurulu)
    if (!w.ch) w.ch = {};          // kulüp id → [[sezon, lig, sıra, puan]]
    if (!w.vac) w.vac = [];        // açık pozisyonlar (işsizken)
    if (w.tries == null) w.tries = 0;
    return w;
  }

  /* ---------- kıtasal scout ağı ---------- */
  const NET_COST = 400000;
  const myCont = () => contOf(FM.clubCc(me()));
  const playerCc = p => (p.tid != null ? FM.clubCc(T(p.tid)) : p.nat || 'TR');
  const covered = p => { const c = contOf(playerCc(p)); return c === myCont() || !!W().snet[c]; };
  function buyNet(cont) {
    const G = G_(), w = W();
    if (w.snet[cont]) return { ok: false, msg: 'Bu kıtada scout ağın zaten var.' };
    if (G.fin.balance < NET_COST) return { ok: false, msg: 'Bütçe yetersiz.' };
    G.fin.balance -= NET_COST; w.snet[cont] = 1; FM.save();
    return { ok: true, msg: `${cont} scout ağı kuruldu: oradaki oyuncuların güç tahmini netleşti, scout masrafı düştü.` };
  }
  const coreEst = FM.est;
  FM.est = p => {
    const e = coreEst(p); if (e[0] === e[1] || !G_()) return e;
    if (covered(p)) return [e[0] + 2, e[1] - 2];               // ağ kapsamında: daha dar aralık
    return [Math.max(30, e[0] - 3), Math.min(97, e[1] + 3)];   // uzak kıtada: belirsizlik büyük
  };
  const coreScout = FM.scout;
  FM.scout = pid => {
    const p = P(pid), G = G_(), extra = covered(p) ? 0 : 40000;
    if (extra && G.fin.balance < 30000 + extra) return { ok: false, msg: 'Bütçe yetersiz (uzak kıtaya scout göndermek pahalı).' };
    const r = coreScout(pid);
    if (r.ok && extra) { G.fin.balance -= extra; r.msg += ` Scout ağın olmayan bir kıta olduğu için ek yol masrafı: ₺40 Bin.`; }
    return r;
  };

  /* ---------- iş başvurusu ve mülakat ---------- */
  const mgrRep = () => { const d = G_().dp; return d && d.mgr ? d.mgr.rep : 25; };
  const level = t => t.rep - FM.tierOf(t) * 2;
  function makeVacancies(n) {
    const G = G_(), w = W(), mr = mgrRep(), cap = mr < 30 ? 2 : mr < 45 ? 3 : mr < 60 ? 4 : 6;
    let pool = G.teams.filter(t => t.div !== 2 && G.lg && G.lg[t.div] && G.lg[t.div].mode === 'play' && t.id !== (G.phase === 'sacked' ? G.teamId : -1) && !w.vac.includes(t.id) && !(w.rej || []).includes(t.id));
    const fit = pool.filter(t => level(t) <= cap);
    if (fit.length >= n) pool = fit;
    pool.sort(() => R() - .5).sort((a, b) => level(b) - level(a));
    const pickN = pool.slice(0, Math.max(n * 3, 6)).sort(() => R() - .5).slice(0, n);
    w.vac.push(...pickN.map(t => t.id));
  }
  const Q = [
    { q: 'Kulübümüzde nasıl bir futbol oynatmak istersin?', a: [['Hücum futbolu: topa sahip olup rakibi boğmak', 'Hücum'], ['Önce sağlam savunma, sonra hızlı kontra', 'Kontrollü'], ['Gençlere süre verip altyapıdan bir takım kurmak', 'Altyapı|Genç|Yerli'], ['Kadroya göre esnek bir oyun', '']] },
    { q: 'Transfer bütçesi kısıtlı olursa ne yaparsın?', a: [['Altyapıdan oyuncu çıkarırım', 'Altyapı'], ['Serbest oyuncular ve kiralıklarla takviye yaparım', 'Kontrollü|borçsuz'], ['Yönetimden ek bütçe isterim', 'itibarlı|Gösteriş'], ['Kadrodaki yıldızı satıp kadroyu yenilerim', 'Genç']] },
    { q: 'İlk sezon için hedefin ne?', a: [['Beklentinin üstüne çıkmak', 'Sonuç'], ['Yönetimin hedefini tutturmak', 'Hesabını|Sabırlı'], ['Önce yapılanma, sonraki yıl iddia', 'Sabırlı|seviyor']] },
    { q: 'Taraftarla ilişkin nasıl olur?', a: [['Tribünle sürekli iletişimde olurum', 'Tribün|bağlılık|Derbi'], ['Sonuçlar konuşsun, ben işime bakarım', 'Sonuç'], ['Kulübün kimliğini her basın toplantısında savunurum', 'seviyor|bağlılık']] }
  ];
  function interview(tid) {
    const w = W(); w.iv = { tid, qs: Q.slice().sort(() => R() - .5).slice(0, 3).map(x => Q.indexOf(x)), ans: [] };
    return w.iv;
  }
  function answer(i) {
    const w = W(), iv = w.iv; if (!iv) return null;
    const t = T(iv.tid), q = Q[iv.qs[iv.ans.length]], key = q.a[i][1], info = t.info || {};
    const txt = [...(info.mcult || []), ...(info.fcult || []), info.chair || ''].join(' ');
    const good = key && key.split('|').some(k => txt.toLocaleLowerCase('tr').includes(k.toLocaleLowerCase('tr')));
    iv.ans.push(good ? 1 : key ? 0 : .4);
    if (iv.ans.length < iv.qs.length) return { done: false };
    const fitScore = iv.ans.reduce((a, b) => a + b, 0) / iv.ans.length;
    const chance = clamp(.32 + (mgrRep() - 25) / 120 - (level(t) - 2) * .12 + fitScore * .38 + w.tries * .12 + (G_().diff === 0 ? .1 : G_().diff === 2 ? -.08 : 0), .08, .95);
    const ok = iv.tid === w.sureId || R() < chance; w.iv = null;
    if (ok) { hire(t.id); return { done: true, ok: true, msg: `${t.name} yönetimi seninle anlaştı! Mülakatta kulübün kültürüne uyumun dikkat çekti.` }; }
    w.tries++; w.vac = w.vac.filter(id => id !== t.id); (w.rej || (w.rej = [])).push(t.id);
    if (w.vac.length < 3) makeVacancies(2);
    return { done: true, ok: false, msg: `${t.name} başka bir adayla anlaştı. ${fitScore >= .6 ? 'Mülakatın iyi geçti; bir sonraki başvuruda şansın daha yüksek.' : 'Kulübün kültürüne uygun cevaplar vermek şansını artırır.'}` };
  }
  function hire(tid) {
    const G = G_(), w = W(), first = !!w.fresh;
    if (first) { G.inbox = G.inbox.filter(m => m.from === 'Futbol federasyonu'); G.news = []; G.offers = []; }   // yer tutucu kulübün karşılama postaları gider
    FM.takeJob(tid);
    w.vac = []; w.rej = []; w.tries = 0; w.sure = 0; w.fresh = 0;
    if (first) {   // işsiz başlangıç: kariyer kaydı yeni kulüpten başlar
      const d = G.dp; if (d && d.mgr) d.mgr.clubs = [{ tid, from: G.season, to: null }];
      G.phase = null;
    }
  }

  /* ---------- kariyer ve kulüp geçmişi ---------- */
  function recordSeason() {
    const G = G_(), w = W();
    for (const d of FM.LDIVS()) FM.table(d).forEach((r, i) => { const a = w.ch[r.id] || (w.ch[r.id] = []); a.push([G.season, d, i + 1, r.pts]); if (a.length > 30) a.shift(); });
    for (const id in G.players) {
      const p = G.players[id]; if (p.tid == null || !p.apps) continue;
      const h = p.h || (p.h = []); h.push([G.season, p.tid, p.apps, p.g, p.as, Math.round(FM.avgRating(p) * 10), p.ovr]); if (h.length > 20) h.shift();
    }
  }

  /* ---------- milli takım ülkesi ---------- */
  const natCc = () => { const x = FM.Ext && FM.Ext.X(); return (x && x.nat && x.nat.cc) || FM.clubCc(me()); };

  /* ---------- işsizken / yalnız milli takımdayken zaman akar ---------- */
  const IDLE = ['jobless', 'natonly', 'sacked'];
  const idle = () => G_() && IDLE.includes(G_().phase);
  function idleWeek() {
    const G = G_(); if (!idle()) return { ok: false };
    if (G.phase === 'sacked') G.phase = 'jobless';
    const w = W(), wk = G.week, lines = [];
    if (G.phase === 'jobless' && wk >= FM.WEEK_COUNT - 1) return { ok: false, msg: 'Sezonun son haftası: bir kulüple anlaşmadan sezon kapanamaz. İlanlardan birine başvur.' };
    // kupa ve kıta kupası turları (eski kulübün maçı da hızlı oynanır)
    const keep = JSON.stringify({ museum: G.museum, rec: G.rec, legends: G.legends, board: G.board, fans: G.fans, bal: G.fin.balance }), nIn = new Set(G.news); G.quiet = 1;
    if (FM.CUP_AFTER.includes(wk) && G.cup && !G.cup.winner && G.cup.alive.length > 1) { FM.drawCup(); if (G.cupDue) { const t = FM.cupTie(); if (t) FM.finishMatch(FM.simFull(FM.newMatch(t, { cup: true }))); FM.playCupRound(); } }
    const er = FM.EURO_AFTER.indexOf(wk); if (er >= 0 && G.euro && !G.euro.winner && G.euro.round < er) { FM.startEuroRound(er); if (G.euroDue) { const t = FM.euroTie(); if (t) FM.finishMatch(FM.simFull(FM.newMatch(t, { cup: G.euro.round >= 3, euro: true }))); FM.playEuroRound(); } }
    { const k = JSON.parse(keep); G.museum = k.museum; G.rec = k.rec; G.legends = k.legends; G.board = k.board; G.fans = k.fans; G.fin.balance = k.bal; G.news = G.news.filter(n => nIn.has(n) || n.kind === 'club' && /Kupa/.test(n.text || '')); delete G.quiet; }
    for (const d of FM.LDIVS()) for (const f of ((G.fixtures[d] || [])[wk] || [])) if (f.hs == null) FM.quickResult(f);
    for (const id in G.players) { const p = G.players[id]; if (p.inj) p.inj--; if (p.susp) p.susp--; p.fit = 100; if (p.adapt) p.adapt--; }
    if (FM.windowOpen()) FM.aiTransfers();
    G.week++;
    const x = FM.Ext && FM.Ext.X();
    if (x && x.nat.job && (G.week === 7 || G.week === 16)) { FM.Ext.natBreak(); lines.push('Milli ara oynandı: sonuçlar gelen kutunda.'); }
    if (G.phase === 'jobless' && R() < .45) { makeVacancies(1); lines.push('Yeni bir iş ilanı açıldı.'); }
    if (G.phase === 'jobless' && G.week >= FM.WEEK_COUNT - 2 && !w.sure) { w.sure = 1; makeVacancies(1); w.sureId = w.vac[w.vac.length - 1]; lines.push('Sezon bitmek üzere: bir kulüp seninle mutlaka görüşmek istiyor.'); }
    if (G.week >= FM.WEEK_COUNT && G.phase === 'natonly') idleSeasonEnd();
    FM.save();
    return { ok: true, msg: lines.join(' ') || `${G.week}. hafta geride kaldı.` };
  }
  /* yalnız milli takım kariyerinde sezon sonu: çekirdeğin sezon sonunu çalıştırır, yer tutucu kulübe yazılanları geri alır */
  function idleSeasonEnd() {
    const G = G_(), keep = JSON.stringify({ museum: G.museum, rec: G.rec, ach: G.ach, mgr: G.dp && G.dp.mgr, board: G.board, fans: G.fans, bal: G.fin.balance, legends: G.legends });
    const hl = G.history.length, inbox = new Set(G.inbox), news = new Set(G.news);
    FM.seasonEnd();
    const k = JSON.parse(keep); G.museum = k.museum; G.rec = k.rec; G.ach = k.ach; if (G.dp && k.mgr) G.dp.mgr = k.mgr; G.board = k.board; G.fans = k.fans; G.fin.balance = k.bal; G.legends = k.legends;
    G.history.length = hl;
    FM.startNewSeason();
    G.inbox = G.inbox.filter(m => inbox.has(m) || m.from === 'Futbol federasyonu'); G.news = G.news.filter(n => news.has(n));
    G.phase = 'natonly';
  }

  /* ---------- ekonomi: tesis bakımı, transfer vergisi ve menajer ücreti, maaş enflasyonu, fazla paranın yönetime aktarılması ---------- */
  const money = (k, v) => { if (C.money) C.money(k, v); };
  function upkeep() {
    const G = G_(), t = me(), f = t.fac || { training: 1, youth: 1, stadium: 1 };
    const v = Math.round(((f.training + f.youth) * 9000 + f.stadium * 14000 + FM.stadiumCap(t) * 3) / 1000) * 1000;
    G.fin.balance -= v; money('upkeep', v); if (G.fin.last) { G.fin.last.upkeep = v; G.fin.last.net -= v; }
  }

  /* ---------- canlı transfer piyasası: teklif savaşı, son gün, açık artırma ---------- */
  const r10k = v => Math.round(v / 10000) * 10000;
  function rivalBids() {
    const G = G_(), base = G.offers.slice();
    for (const o of base) {
      if (R() > (FM.deadline() ? .5 : .3)) continue;
      const p = P(o.pid), rival = pick(G.teams.filter(t => t.id !== G.teamId && t.id !== o.tid && t.div !== 2 && FM.budgetOf(t) >= o.amt && t.players.length < 26));
      if (!p || !rival) continue;
      const amt = r10k(o.amt * (1.08 + R() * .17));
      G.offers.push({ pid: p.id, tid: rival.id, amt });
      FM.news(`Teklif savaşı! ${rival.name}, ${p.name} için ${T(o.tid).name} teklifini geçti: ${FM.money(amt)}. Teklif bu hafta geçerli.`, 'offer', { kind: 'offer', pid: p.id, tid: rival.id, amt, from: rival.name, title: `Teklif savaşı: ${p.name} için ${FM.money(amt)}`, opts: ['Teklifi kabul et', 'Reddet'] });
    }
    if (FM.deadline() && base.length) FM.mail({ cat: 'TRANSFER', from: 'Sportif direktör', title: 'Transferde son gün!', body: `Pencere bu hafta kapanıyor. Masada ${G.offers.length} teklif var; cevapsız kalanlar hafta sonunda düşer. Kadronda ${me().players.length} oyuncu var.` });
  }
  const coreBuy = FM.buy;
  FM.buy = (pid, haggle, terms) => {
    const G = G_(), w = W(), p = P(pid);
    if (p && p.tid != null && !haggle && !w.aucOk && p.ovr >= 66 && !(w.auc && w.auc[pid]) && R() < .3 && !FM.canDeal(p)) {
      const rival = pick(G.teams.filter(t => t.id !== G.teamId && t.id !== p.tid && t.div !== 2 && FM.budgetOf(t) >= FM.askPrice(p) * .8 && t.players.length < 26 && FM.foreignOk(p, t)));
      if (rival) {
        const amt = r10k(FM.askPrice(p) * (1.08 + R() * .1));
        (w.auc || (w.auc = {}))[pid] = { tid: rival.id, amt, base: FM.askPrice(p), terms: terms || null, s: G.season, w: G.week };
        FM.save();
        return { ok: false, auction: true, msg: `Açık artırma! ${rival.name} de ${p.name} için ${FM.money(amt)} teklif etti. Oyuncunun penceresinden teklifini artırabilir ya da çekilebilirsin.` };
      }
    }
    const r = coreBuy(pid, haggle, terms); if (r.ok && w.auc) delete w.auc[pid];
    if (r.ok && r.price) { const fee = r10k(r.price * .05); if (fee) { G.fin.balance -= fee; money('fees', fee); r.msg += ` Menajer ücreti: ${FM.money(fee)}.`; } }
    return r;
  };
  function raise(pid) {
    const G = G_(), w = W(), a = w.auc && w.auc[pid], p = P(pid); if (!a || !p) return { ok: false, msg: 'Açık artırma kapanmış.' };
    const mine = r10k(a.amt * 1.06), extra = mine - a.base;
    if (G.fin.balance < mine + (a.terms ? a.terms.bonus : 0)) return { ok: false, msg: 'Bütçe bu teklife yetmiyor.' };
    if (R() < .38) { a.amt = r10k(mine * (1.04 + R() * .06)); FM.save(); return { ok: false, again: true, msg: `${T(a.tid).name} geri adım atmadı: teklif ${FM.money(a.amt)} oldu.` }; }
    w.aucOk = 1; const r = FM.buy(pid, false, a.terms || undefined); w.aucOk = 0;
    if (r.ok) { G.fin.balance -= Math.max(0, extra); money('trOut', Math.max(0, extra)); delete w.auc[pid]; r.msg = `Açık artırmayı kazandın! ${p.name} ${FM.money(mine)} karşılığında kadroda.`; }
    return r;
  }
  function withdraw(pid) {
    const w = W(), a = w.auc && w.auc[pid], p = P(pid); if (!a || !p) return { ok: false, msg: 'Açık artırma kapanmış.' };
    const rival = T(a.tid), old = p.tid != null ? T(p.tid) : null; delete w.auc[pid];
    if (old && rival.players.length < 28 && FM.foreignOk(p, rival)) { FM.removeFromTeam(p); FM.addToTeam(p, rival); p.con = 3; FM.autoPick(old); FM.autoPick(rival); FM.news(`${p.name}, ${FM.money(a.amt)} karşılığında ${old.name} takımından ${rival.name} takımına transfer oldu.`, 'info'); }
    FM.save(); return { ok: true, msg: `Çekildin. ${p.name} ${rival.name} yolunda.` };
  }

  /* ---------- oyuncu gelişimi: özellik ve rol öğretme, kiralık takibi ---------- */
  const LEARN_W = 8, ROLE_W = 5;
  const ROLES = { GK: ['GK'], DEF: ['CB', 'WB'], MID: ['BW', 'PM', 'WG'], FWD: ['TF', 'SF'] };
  const learning = () => me().players.map(P).filter(p => p.learn);
  function teach(pid, kind, key) {
    const p = P(pid); if (!p || p.tid !== G_().teamId) return { ok: false, msg: 'Yalnız kendi oyuncuna öğretebilirsin.' };
    if (p.learn) { p.learn = null; FM.save(); return { ok: true, msg: `${p.name} için özel çalışma bırakıldı.` }; }
    if (learning().length >= 3) return { ok: false, msg: 'Aynı anda en fazla 3 oyuncuya özel çalışma verilebilir.' };
    if (kind === 'trait' && p.trait === key) return { ok: false, msg: 'Bu özellik zaten var.' };
    if (kind === 'role' && (!ROLES[p.pos].includes(key) || p.role === key)) return { ok: false, msg: 'Bu rol uygun değil.' };
    p.learn = { kind, key, w: kind === 'trait' ? LEARN_W + (p.age > 27 ? 4 : 0) : ROLE_W }; FM.save();
    return { ok: true, msg: `${p.name} ${kind === 'trait' ? `"${FM.TRAITS[key][0]}" özelliği` : `${FM.ROLE_TR[key]} rolü`} için özel çalışmaya başladı (${p.learn.w} hafta).` };
  }
  function learnTick() {
    for (const p of learning()) {
      if (p.inj) continue;
      if (--p.learn.w > 0) continue;
      const L = p.learn; p.learn = null;
      if (L.kind === 'trait') { const ok = R() < (p.age <= 24 ? .85 : p.age <= 29 ? .65 : .45); if (ok) p.trait = L.key; FM.mail({ cat: 'KADRO', from: 'Yardımcı antrenör', pid: p.id, title: ok ? `${p.name} yeni bir özellik kazandı` : `${p.name} özel çalışmadan sonuç alamadı`, body: ok ? `Haftalardır süren çalışma meyvesini verdi: ${p.name} artık "${FM.TRAITS[L.key][0]}". ${FM.TRAITS[L.key][1]}` : `${p.name} "${FM.TRAITS[L.key][0]}" özelliğini kazanamadı. Genç oyuncular yeni alışkanlıkları daha kolay öğrenir.` }); }
      else { p.role = L.key; FM.mail({ cat: 'KADRO', from: 'Yardımcı antrenör', pid: p.id, title: `${p.name} yeni rolüne hazır`, body: `${p.name} artık ${FM.ROLE_TR[L.key]} olarak oynayabilir.` }); }
    }
  }
  const loans = () => Object.values(G_().players).filter(p => p.loan && p.loan.own === G_().teamId && p.tid !== G_().teamId);
  function loanReport() {
    const G = G_(), ls = loans(); if (!ls.length || G.week % 4 !== 0) return;
    FM.mail({ cat: 'KADRO', from: 'Kiralık oyuncu sorumlusu', title: `Kiralık raporu: ${ls.length} oyuncu`, body: ls.map(p => `${p.name} (${T(p.tid).name}): ${p.apps} maç, ${p.g} gol, ortalama ${p.rn ? (p.rs / p.rn).toFixed(1).replace('.', ',') : '—'}, güç ${p.loanOvr != null ? p.loanOvr + ' → ' : ''}${p.ovr}`).join('\n') });
  }

  /* ---------- kancalar ---------- */
  C.ensure = () => { base.ensure && base.ensure(); W(); };
  C.newGame = () => {
    base.newGame && base.newGame(); const G = G_(), w = W();
    if (G.diff === 0) G.fin.balance = Math.round(G.fin.balance * 1.3 / 10000) * 10000;
    if (G.diff === 2) G.fin.balance = Math.round(G.fin.balance * .8 / 10000) * 10000;
    const x = FM.Ext && FM.Ext.X();
    if (x) x.nat.cc = FM.clubCc(me());
    if ((G.startMode === 'nat' || G.startMode === 'natonly') && x) { x.nat.job = true; x.nat.offered = true; x.nat.rep = 55; G.fans = clamp(G.fans + 3, 0, 100); }
    if (G.startMode === 'jobless' || G.startMode === 'natonly') {
      G.phase = G.startMode; w.fresh = 1; if (G.dp && G.dp.mgr) G.dp.mgr.rep = G.startMode === 'natonly' ? 30 : 15;
      makeVacancies(G.startMode === 'natonly' ? 2 : 4);
    }
  };
  C.sacked = t => { base.sacked && base.sacked(t); const w = W(); w.vac = []; w.rej = []; w.tries = 0; w.sure = 0; makeVacancies(3); };
  C.seasonEnd = tbs => {
    base.seasonEnd && base.seasonEnd(tbs); recordSeason(); const G = G_();
    // diğer ülkelerin kıta kupası temsilcileri
    G.euroQ2 = {}; for (const cc of [...new Set(FM.LDIVS().map(FM.ccOf))]) { const top = FM.cDivs(cc)[0]; if (top != null && FM.tierOf(top) === 0) G.euroQ2[cc] = FM.table(top).slice(0, 3).map(r => r.id); }
    if (idle()) return;
    // fazla para: yönetim kasadaki fazlanın bir kısmını kulübün diğer işlerine aktarır
    const cap = 8000000 * Math.pow(1.5, me().rep - 1) * [1, .5, .3][FM.tierOf(me())];
    if (G.fin.balance > cap) { const cut = r10k((G.fin.balance - cap) * .5); G.fin.balance -= cut; money('board', cut); FM.mail({ cat: 'MALİYE', from: 'Yönetim kurulu', title: `Yönetim kasadan ${FM.money(cut)} aktardı`, body: `Kasadaki fazlanın bir bölümü borç ödemesi, amatör şubeler ve yatırımlar için yönetime aktarıldı. Paranın çoğu sende kalıyor ama harcanmayan bütçe sonsuza dek birikmez.` }); }
  };
  C.newSeason = () => {
    base.newSeason && base.newSeason(); const G = G_(); if (idle()) return;
    let n = 0; for (const id of me().players) { const p = P(id); if (p.con >= 1) { p.wage = Math.round(p.wage * 1.04 / 100) * 100; n++; } }
    if (n) FM.news(`Yeni sezonda sözleşmelerdeki yıllık artışla maaşlar %4 yükseldi.`, 'info');
  };
  C.endWeek = () => {
    base.endWeek && base.endWeek(); if (!G_() || idle()) return;
    upkeep(); rivalBids(); learnTick(); loanReport();
  };
  C.transfer = (kind, p, price) => {
    base.transfer && base.transfer(kind, p, price); const G = G_();
    if (kind === 'sell' && price > 0) { const tax = r10k(price * .1); G.fin.balance -= tax; money('fees', tax); FM.news(`Satıştan ${FM.money(tax)} vergi ve aracılık kesintisi yapıldı.`, 'info', { cat: 'MALİYE' }); }
    if (kind === 'loan' && p) p.loanOvr = p.ovr;
  };
  const coreLoanOut = FM.loanOut;
  FM.loanOut = pid => { const p = P(pid), o = p && p.ovr, r = coreLoanOut(pid); if (r.ok && p) p.loanOvr = o; return r; };

  FM.World2 = { idle, idleWeek, raise, withdraw, teach, ROLES, loans, learning, W, DIFF, buyNet, NET_COST, covered, contOf, ccName, playerCc, makeVacancies, interview, answer, Q, hire, natCc, mgrRep };
})();
