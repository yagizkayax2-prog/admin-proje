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
    const ok = R() < chance; w.iv = null;
    if (ok) { hire(t.id); return { done: true, ok: true, msg: `${t.name} yönetimi seninle anlaştı! Mülakatta kulübün kültürüne uyumun dikkat çekti.` }; }
    w.tries++; w.vac = w.vac.filter(id => id !== t.id); (w.rej || (w.rej = [])).push(t.id);
    if (w.vac.length < 3) makeVacancies(2);
    return { done: true, ok: false, msg: `${t.name} başka bir adayla anlaştı. ${fitScore >= .6 ? 'Mülakatın iyi geçti; bir sonraki başvuruda şansın daha yüksek.' : 'Kulübün kültürüne uygun cevaplar vermek şansını artırır.'}` };
  }
  function hire(tid) {
    const G = G_(), w = W(), first = G.phase === 'jobless';
    if (first) { G.inbox = []; G.news = []; G.offers = []; }   // yer tutucu kulübün karşılama postaları gider
    FM.takeJob(tid);
    w.vac = []; w.rej = []; w.tries = 0;
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

  /* ---------- kancalar ---------- */
  C.ensure = () => { base.ensure && base.ensure(); W(); };
  C.newGame = () => {
    base.newGame && base.newGame(); const G = G_(), w = W();
    if (G.diff === 0) G.fin.balance = Math.round(G.fin.balance * 1.3 / 10000) * 10000;
    if (G.diff === 2) G.fin.balance = Math.round(G.fin.balance * .8 / 10000) * 10000;
    const x = FM.Ext && FM.Ext.X();
    if (x) x.nat.cc = FM.clubCc(me());
    if (G.startMode === 'nat' && x) { x.nat.job = true; x.nat.offered = true; x.nat.rep = 55; G.fans = clamp(G.fans + 3, 0, 100); }
    if (G.startMode === 'jobless') {
      G.phase = 'jobless'; if (G.dp && G.dp.mgr) G.dp.mgr.rep = 15;
      makeVacancies(4);
    }
  };
  C.sacked = t => { base.sacked && base.sacked(t); const w = W(); w.vac = []; w.rej = []; w.tries = 0; makeVacancies(3); };
  C.seasonEnd = tbs => { base.seasonEnd && base.seasonEnd(tbs); recordSeason(); };

  FM.World2 = { W, DIFF, buyNet, NET_COST, covered, contOf, ccName, playerCc, makeVacancies, interview, answer, Q, hire, natCc, mgrRep };
})();
