/* Saha Kenarı — derinlik sistemleri (mantık):
   maç raporu ve xG, yardımcı antrenör önerileri, sözleşme maddeleri (prim, serbest kalma, satıştan pay, opsiyonlu kiralık),
   takas teklifleri ve söylentiler, kadro planlayıcı, hazırlık kampı ve Yaz Kupası, milli ara, kış arası ve yönetim toplantısı,
   teknik direktör itibarı / seviye / yetenek ağacı / lisans kursları, diğer hocalar (kovulmalar, atışmalar, ezeli hasım),
   haftalık gazete, kafa kafaya geçmiş ve kariyer zaman çizelgesi. FM.Career kancalarını sarar. */
(function () {
  const G_ = () => FM.G, P = id => FM.P(id), T = id => FM.T(id), R = Math.random;
  const { ri, pick, clamp } = FM.util;
  const money = v => FM.money(v), r10k = v => Math.round(v / 10000) * 10000;
  const me = () => T(G_().teamId), squad = () => me().players.map(P);
  const D = () => G_().dp;
  const WK = () => FM.WEEK_COUNT;
  const xiStr = t => { const xi = t.lineup.filter(x => x != null).map(P); return xi.length ? xi.reduce((s, p) => s + p.ovr, 0) / xi.length : 50; };
  const sn = n => { const a = n.split(' '); return a.length > 1 ? a[0][0] + '. ' + a.slice(1).join(' ') : n; };
  const ek = (w, k) => {   // Türkçe ek: i (belirtme), e (yönelme), de (bulunma), den (ayrılma), in (ilgi)
    const low = String(w).toLocaleLowerCase('tr'), vs = low.match(/[aeıioöuüâîû]/g) || ['e'], v = vs[vs.length - 1].replace('â', 'a').replace('î', 'i').replace('û', 'u'), last = low[low.length - 1], endV = /[aeıioöuüâîû]/.test(last);
    const back = 'aıou'.includes(v), round = 'oöuü'.includes(v), hard = 'fstkçşhp'.includes(last), i4 = back ? (round ? 'u' : 'ı') : (round ? 'ü' : 'i'), a2 = back ? 'a' : 'e';
    return w + "'" + ({ i: (endV ? 'y' : '') + i4, e: (endV ? 'y' : '') + a2, de: (hard ? 't' : 'd') + a2, den: (hard ? 't' : 'd') + a2 + 'n', in: (endV ? 'n' : '') + i4 + 'n' })[k];
  };
  const newName = () => pick(FM.FIRST) + ' ' + pick(FM.LAST);

  /* ================= Durum ================= */
  function ensure() {
    const G = G_(); if (!G) return;
    const d = G.dp = G.dp || {};
    if (!d.mgr) d.mgr = { xp: 0, pts: 0, sk: { tac: 0, mot: 0, youth: 0, media: 0 }, lic: 0, course: null, rep: clamp(18 + me().rep * 5, 10, 50), st: { m: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, tr: 0 }, clubs: [{ tid: G.teamId, from: G.season, to: null }] };
    d.h2h = d.h2h || {}; d.notes = d.notes || {}; d.cmp = d.cmp || []; d.tfs = d.tfs || [];
    d.tl = d.tl || []; d.paper = d.paper || []; d.wire = d.wire || []; d.coaches = d.coaches || {}; d.heat = d.heat || {}; d.pool = d.pool || [];
    d.trophies = d.trophies || []; d.nemRec = d.nemRec || { w: 0, d: 0, l: 0 }; d.xgS = d.xgS && d.xgS.s === G.season ? d.xgS : { s: G.season, f: 0, a: 0, gf: 0, ga: 0 };
    d.bon = d.bon && d.bon.s === G.season ? d.bon : { s: G.season, v: 0 };
    for (const t of G.teams) for (const k in FM.TAC) if (t.tac[k] == null) t.tac[k] = FM.TAC_DEF(t, k);
    for (const t of G.teams) if (!d.coaches[t.id]) d.coaches[t.id] = { s: G.season, w: 0 };
    if (!d.tl.length) tl('start', `${G.manager}, ${me().name} ile teknik direktörlük kariyerine başladı.`);
  }
  function tl(k, t) { const G = G_(); D().tl.push({ s: G.season, w: Math.min(WK(), G.week + 1), k, t }); if (D().tl.length > 160) D().tl.splice(0, D().tl.length - 160); }
  function wire(t, k) { const G = G_(); D().wire.unshift({ s: G.season, w: G.week, t, k: k || 'info' }); if (D().wire.length > 40) D().wire.length = 40; }
  function social(who, handle, text, kind) { const G = G_(); if (!G.social) return; G.social.unshift({ who, handle, text, kind: kind || 'paper', likes: ri(60, 1800), s: G.season, w: G.week }); if (G.social.length > 45) G.social.length = 45; }

  /* ================= Teknik direktör: itibar, XP, yetenek ağacı, lisans ================= */
  const LV = n => 120 * n * (n + 1) / 2;
  const level = () => { let n = 0; while (D().mgr.xp >= LV(n + 1)) n++; return n + 1; };
  const lvProg = () => { const n = level() - 1, a = LV(n), b = LV(n + 1); return { cur: D().mgr.xp - a, need: b - a }; };
  function xp(v) {
    const M = D().mgr, l0 = level(); M.xp += Math.round(v); const l1 = level();
    if (l1 > l0) { M.pts += l1 - l0; FM.news(`Teknik direktör seviyen ${l1} oldu. Yetenek ağacında harcayabileceğin ${M.pts} puan var.`, 'good', { cat: 'KULÜP', title: `Seviye atladın: ${l1}` }); tl('lvl', `Teknik direktör seviyesi ${l1}.`); }
  }
  const rep = v => { const M = D().mgr; M.rep = clamp(M.rep + v, 0, 100); };
  const REP_T = [[20, 'Tanınmıyor'], [40, 'Yerel isim'], [60, 'Ulusal çapta tanınıyor'], [80, 'Saygın hoca'], [101, 'Efsane']];
  const repTxt = v => REP_T.find(x => v < x[0])[1];
  const SK = {
    tac: ['Taktisyen', 'Takımın maç gücü her seviyede %0,6 artar.'],
    mot: ['Motivasyoncu', 'Morali düşük oyuncular her hafta toparlanır; devre arası konuşmaları daha etkili olur.'],
    youth: ['Gençlik hocası', '21 yaş ve altı oyuncular her seviyede %6 daha hızlı gelişir.'],
    media: ['Medya ustası', 'Taraftar desteği her hafta biraz artar; rakip hocalarla atışmalardan kârlı çıkarsın.']
  };
  const LIC = [['UEFA C', 0, 0, 0], ['UEFA B', 150000, 5, 15], ['UEFA A', 350000, 7, 30], ['UEFA Pro', 700000, 9, 50]];   // ad, ücret, hafta, gereken itibar
  const skCap = () => Math.min(3, D().mgr.lic + 1);
  function learn(k) {
    const M = D().mgr;
    if (!SK[k]) return { ok: false, msg: 'Geçersiz yetenek.' };
    if (M.pts < 1) return { ok: false, msg: 'Harcanacak yetenek puanın yok. Maç kazanarak XP topla.' };
    if (M.sk[k] >= 3) return { ok: false, msg: 'Bu yetenek en üst seviyede.' };
    if (M.sk[k] >= skCap()) return { ok: false, msg: `Bir sonraki seviye için ${LIC[M.sk[k]][0]} lisansı gerekiyor.` };
    M.pts--; M.sk[k]++; FM.save();
    return { ok: true, msg: `${SK[k][0]} ${M.sk[k]}. seviye.` };
  }
  function course() {
    const G = G_(), M = D().mgr, nx = M.lic + 1;
    if (M.course) return { ok: false, msg: 'Zaten bir kurstasın.' };
    if (nx >= LIC.length) return { ok: false, msg: 'En üst lisansa sahipsin.' };
    if (M.rep < LIC[nx][3]) return { ok: false, msg: `${LIC[nx][0]} kursu için en az ${LIC[nx][3]} itibar gerekiyor.` };
    if (G.fin.balance < LIC[nx][1]) return { ok: false, msg: 'Kurs ücreti için bütçe yetersiz.' };
    G.fin.balance -= LIC[nx][1]; M.course = { to: nx, w: LIC[nx][2] }; FM.save();
    return { ok: true, msg: `${LIC[nx][0]} kursuna başladın (${LIC[nx][2]} hafta). Kurs süresince takıma biraz daha az zaman ayırabileceksin.` };
  }

  /* ================= Maç raporu: xG, şut haritası, pas ağı, ısı haritası ================= */
  function buildRep(m, us) {
    const S = m.s, side = S[us], o = 1 - us, sl = side.slots;
    const shots = m.shots.map(e => ({ min: e.min, s: e.side, xg: e.xg != null ? e.xg : .08, o: e.varNo ? 'var' : e.out, pid: e.pid, aid: e.aid, k: e.kind, x: e.sx, y: e.sy }));
    const xg = [0, 0]; shots.forEach(e => { xg[e.s] += e.xg; });
    const goals = m.log.filter(l => l.type === 'goal');
    const st = m.st, pt = Math.max(1, st.poss[0] + st.poss[1]), poss = st.poss[us] / pt;
    // pas ağı: ilk 11'in diziliş yerleri; bağlantı kalınlığı pas yeteneği, yakınlık ve asist ilişkisiyle
    const nodes = [];
    side.start.forEach((id, i) => { const p = id != null ? P(id) : null; if (p && sl[i]) nodes.push({ id, n: sn(p.name), num: p.num, x: sl[i][1] || 0, y: sl[i][2], r: m.rt[id] != null ? m.rt[id] : 6, pas: p.a.pas }); });
    const edges = [];
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j], dd = Math.hypot(a.x - b.x, (a.y - b.y) * .8);
      let w = dd < .46 ? (a.pas + b.pas) / 200 * (1 - dd / .46) * (.6 + poss) : 0;
      for (const e of shots) if (e.s === us && e.aid != null && ((e.aid === a.id && e.pid === b.id) || (e.aid === b.id && e.pid === a.id))) w += .35;
      if (w > .12) edges.push({ a: i, b: j, w: Math.round(w * 100) / 100 });
    }
    edges.sort((x, y) => y.w - x.w); edges.length = Math.min(edges.length, 18);
    // ısı haritası (12×8): oyuncu konumları alan hâkimiyetine göre ileri kayar, şutlar ağırlık ekler
    const terr = m.terr ? m.terr[us] : .5, H = new Array(96).fill(0);
    const add = (x, y, w) => { for (let gx = 0; gx < 12; gx++) for (let gy = 0; gy < 8; gy++) { const cx = (gx + .5) / 12, cy = (gy + .5) / 8, d2 = (cx - x) ** 2 + ((cy - y) * .7) ** 2; H[gy * 12 + gx] += w * Math.exp(-d2 / .012); } };
    nodes.forEach(nd => { if (nd.x <= .02) return; const x = clamp(nd.x * .8 + (terr - .35) * .5, .04, .96); add(x, nd.y, 1); add(clamp(x + .12, 0, 1), nd.y, .45); });
    shots.filter(e => e.s === us && e.x != null).forEach(e => add(e.x, e.y, .22));
    const mx = Math.max(...H) || 1;
    const heat = H.map(v => Math.round(v / mx * 100) / 100);
    // maçı ne belirledi
    const why = [], gU = m.score[us], gO = m.score[o], kp = side.start[0] != null ? P(side.start[0]) : null, okp = S[o].start[0] != null ? P(S[o].start[0]) : null;
    const f1 = v => v.toFixed(1).replace('.', ',');
    if (gU - xg[us] >= 1) why.push(['up', `Bitiricilik farkı: ${f1(xg[us])} xG'den ${gU} gol çıkardık.`]);
    else if (xg[us] - gU >= 1) why.push(['down', `Fırsatlar heba oldu: ${f1(xg[us])} xG'ye rağmen ${gU} gol.`]);
    if (xg[o] - gO >= .9 && kp) why.push(['up', `${kp.name} kalede devleşti: rakip ${f1(xg[o])} xG üretti, ${gO} gol attı.`]);
    else if (gO - xg[o] >= 1) why.push(['down', `Rakip az pozisyonla çok gol buldu (${f1(xg[o])} xG, ${gO} gol).`]);
    if (gU - xg[us] <= -.9 && okp) why.push(['down', `Rakip kaleci ${okp.name} geçit vermedi.`]);
    const sp = goals.filter(l => l.side === us && (l.kind === 'ck' || l.kind === 'fk' || l.kind === 'pen')).length, spO = goals.filter(l => l.side === o && (l.kind === 'ck' || l.kind === 'fk' || l.kind === 'pen')).length;
    if (sp) why.push(['up', `Duran toplar işe yaradı: ${sp} gol.`]); if (spO) why.push(['down', `Duran toptan ${spO} gol yedik.`]);
    if (poss >= .6) why.push(['mid', `Topa %${Math.round(poss * 100)} sahip olduk, oyunu biz kurduk.`]); else if (poss <= .4) why.push(['mid', `Topu rakibe bıraktık (%${Math.round(poss * 100)}).`]);
    if (st.red && st.red[us]) why.push(['down', `${st.red[us]} kırmızı kart oyunu bozdu.`]); if (st.red && st.red[o]) why.push(['up', `Rakip ${st.red[o]} kırmızı kartla eksik kaldı.`]);
    const big = shots.filter(e => e.s === us && e.xg >= .16).length, bigO = shots.filter(e => e.s === o && e.xg >= .16).length;
    if (big || bigO) why.push(['mid', `Net pozisyonlar (xG ≥ 0,16): biz ${big}, rakip ${bigO}.`]);
    if (m.motm != null && P(m.motm)) why.push(['mid', `Maçın adamı: ${P(m.motm).name}.`]);
    return {
      s: G_().season, w: G_().week, us, t: [S[0].tid, S[1].tid], sc: m.score.slice(), xg: xg.map(v => Math.round(v * 100) / 100), shots, goals: goals.map(l => ({ min: l.min, s: l.side, pid: l.pid })),
      nodes, edges, heat, why, poss: Math.round(poss * 100), cup: !!m.cup, euro: !!m.euro, derby: !!m.derby, pens: m.pens ? m.pens.sc.slice() : null
    };
  }

  /* ================= Yardımcı antrenör ================= */
  function advice(oppId, home) {
    const G = G_(), t = me(), o = T(oppId), rp = FM.scoutReport(o), out = [];
    const edge = xiStr(t) - xiStr(o) + (home ? 2 : -2);
    out.push(edge >= 3 ? ['Kâğıt üstünde favoriyiz. Topa sahip olup oyunu kurmamız beklenir; hücumcu mentalite işe yarar.', 'tactics'] : edge <= -3 ? ['Rakip bizden güçlü. Dengeli ya da defansif başlamak, kontralara oynamak mantıklı.', 'tactics'] : ['Güçler denk. Ayrıntılar belirleyecek: duran toplar ve maç planı önemli.', 'tactics']);
    const zn = { L: 'sol kanat', C: 'merkez', R: 'sağ kanat' }, fi = { L: 1, C: 2, R: 3 }[rp.weak];
    if (t.plan && t.plan.focus !== fi) out.push([`Rakibin ${zn[rp.weak]} savunması zayıf (${Math.round(rp[rp.weak])}). Maç planında oraya yüklenmeyi öneririm.`, 'team:' + oppId]);
    const star = rp.star != null ? P(rp.star) : null;
    if (star && (!t.plan || t.plan.mark !== star.id) && (star.g >= 3 || star.ovr >= xiStr(o) + 5)) out.push([`${star.name} (${star.g} gol) en tehlikeli isimleri. Adam adama markaj düşünebilirsin.`, 'team:' + oppId]);
    const xi = t.lineup.filter(x => x != null).map(P), tired = xi.filter(p => p.fit < 72).sort((a, b) => a.fit - b.fit);
    if (tired.length) out.push([`${tired.slice(0, 2).map(p => `${p.name} (kondisyon ${Math.round(p.fit)})`).join(', ')} yorgun. Rotasyon iyi olur.`, 'squad']);
    const low = xi.filter(p => p.mor < 50); if (low.length) out.push([`${low.length} ilk 11 oyuncusunun morali düşük. Takım konuşmasında güven vermek işe yarar.`, null]);
    const of = xi.filter(p => p.pos !== 'GK'), hd = of.slice().sort((a, b) => b.a.phy - a.a.phy)[0], spr = t.spr || {};
    if (hd && hd.a.phy >= 74 && spr.ck !== 'far') out.push([`Kornerlerde arka direği dene: ${hd.name} (fizik ${hd.a.phy}) hava toplarında çok güçlü.`, 'tactics']);
    else if (hd && hd.a.phy < 66 && spr.ck !== 'short') out.push(['Hava toplarında zayıfız; kornerleri kısa kullanmak daha verimli olabilir.', 'tactics']);
    const fk = t.sp && t.sp.fk != null ? P(t.sp.fk) : null;
    if (fk && fk.a.sho >= 76 && spr.fk === 'cross') out.push([`${fk.name} iyi frikikçi (şut ${fk.a.sho}); frikikleri direkt kullanmayı öneririm.`, 'tactics']);
    if (o.tac && o.tac.press === 2) out.push(['Rakip önde basıyor. Orta sahadaki pasöre "Pas dağıt" talimatı vermek presi kırmaya yardım eder.', 'tactics']);
    const tt = t.tac, ot = o.tac;
    if (ot.line === 2 && tt.counter !== 2) out.push(['Rakibin savunma hattı önde. "Top kazanınca: Hızlı kontra" ve arkaya uzun toplar çok etkili olur.', 'tactics']);
    if (ot.width === 2 && tt.compact === 0) out.push(['Rakip kanatlardan oynuyor; dar blokla ortalara açık kalırız. Savunma genişliğini Normal ya da Geniş yap.', 'tactics']);
    if (ot.width === 0 && tt.compact === 2) out.push(['Rakip merkezden oynuyor; geniş blok ortayı boşaltıyor. Savunma genişliğini Dar yapmayı düşün.', 'tactics']);
    if (ot.pass === 2 && tt.trap !== 2 && tt.line !== 0) out.push(['Rakip uzun top oynuyor. Ofsayt taktiğini sık uygularsak forvetlerini ofsayta düşürebiliriz.', 'tactics']);
    if (ot.tackle === 2) out.push(['Rakip sert müdahale ediyor: daha çok frikik kazanacağız, iyi bir frikikçi önemli.', null]);
    const nm = D().nem; if (nm && FM.coachOf(oppId) === nm) out.push([`Karşıda ezeli hasmın ${nm} var. Basın bu maçı çok konuşacak, kazanmak itibarını artırır.`, null]);
    return out.slice(0, 7);
  }
  function htAdvice(m, us) {
    const side = m.s[us], o = 1 - us, xg = [0, 0], out = [];
    m.shots.forEach(e => { xg[e.side] += e.xg || 0; });
    const d = m.score[us] - m.score[o], f1 = v => v.toFixed(2).replace('.', ',');
    out.push(`İlk yarı xG: biz ${f1(xg[us])} – rakip ${f1(xg[o])}.`);
    if (d < 0 && xg[us] >= xg[o]) out.push('Oyun kötü değil, şans bizden yana değil. Plana sadık kalalım, sakin konuşma yeterli.');
    else if (d < 0) out.push('Pozisyon üretemiyoruz. Mentaliteyi hücuma çevirmek ya da forvete takviye yapmak gerekebilir.');
    else if (d > 0 && xg[o] > xg[us]) out.push('Öndeyiz ama rakip daha tehlikeli. Arkayı kapatmayı düşün.');
    else if (d > 0) out.push('Kontrol bizde. Övgü dolu bir konuşma ve aynı plan.');
    else out.push(xg[us] > xg[o] + .4 ? 'Üstünüz ama gol yok: biraz daha fazlasını istemek işe yarayabilir.' : 'Dengeli bir yarı. Küçük bir dokunuş farkı yaratabilir.');
    const tired = side.on.filter(id => id != null).map(P).filter(p => p.fit < 62); if (tired.length) out.push(`Yorulanlar: ${tired.slice(0, 3).map(p => sn(p.name)).join(', ')}. Değişiklik düşünebilirsin.`);
    const yel = side.on.filter(id => id != null && side.yel && side.yel[id]).map(P); if (yel.length) out.push(`Sarı kartlılar: ${yel.map(p => sn(p.name)).join(', ')}. İkinci sarı riskine dikkat.`);
    return out;
  }

  /* ================= Kadro planlayıcı ================= */
  function proj(p, n) {
    const age = p.age + n, grow = p.age <= 21 ? 4 : p.age <= 24 ? 2 : p.age <= 27 ? .5 : 0;
    return Math.round(clamp(p.ovr + Math.min(Math.max(0, p.pot - p.ovr), grow * n) - Math.max(0, age - 30) * 2 * Math.min(n, age - 30), 30, 99));
  }
  const NEED = { GK: 2, DEF: 6, MID: 6, FWD: 4 };
  function planner() {
    const G = G_(), sq = squad(), yth = (G.youth || []).map(P).filter(Boolean);
    const out = {};
    for (const pos of ['GK', 'DEF', 'MID', 'FWD']) {
      out[pos] = [0, 1, 2].map(n => {
        const list = sq.filter(p => p.pos === pos && !(p.loan && p.loan.own !== G.teamId && n > 0) && (n === 0 || p.con > n) && p.age + n <= 35).map(p => ({ p, o: proj(p, n), exp: p.con <= n + 1 && !p.loan, old: p.age + n >= 32, loan: !!p.loan }));
        if (n > 0) yth.filter(p => p.pos === pos && p.pot >= 70).forEach(p => list.push({ p, o: proj(p, n), y: 1 }));
        list.sort((a, b) => b.o - a.o);
        return list;
      });
    }
    return out;
  }
  function weakest() {
    const pl = planner(); let best = null;
    for (const pos in pl) { const l = pl[pos][0].filter(x => !x.y), need = NEED[pos], top = l.slice(0, Math.ceil(need / 2)), avg = top.length ? top.reduce((s, x) => s + x.o, 0) / top.length : 0, sc = avg - Math.max(0, need - l.length) * 6; if (!best || sc < best.sc) best = { pos, sc }; }
    return best ? best.pos : 'MID';
  }
  function suggestBuys(pos, n) {
    const G = G_(), q = xiStr(me());
    return FM.marketList().filter(p => p.pos === pos && FM.askPrice(p) <= G.fin.balance * .9 && FM.est(p)[1] >= q - 1 && !p.loan).sort((a, b) => (FM.est(b)[0] + FM.est(b)[1]) - (FM.est(a)[0] + FM.est(a)[1]) || FM.askPrice(a) - FM.askPrice(b)).slice(0, n || 3);
  }

  /* ================= Hazırlık kampı, dostluk maçları, Yaz Kupası ================= */
  const CAMPS = [
    ['Yurt içi kamp (Bolu)', 100000, 'Taktik uyum +4, moral +2'],
    ['Avrupa kampı (Avusturya)', 450000, 'Taktik uyum +8, takım uyumu +5, moral +4, taraftar +2'],
    ['Yüksek irtifa kampı (Erzurum)', 250000, 'İlk 5 hafta maç gücü +%1,5, taktik uyum +3']
  ];
  function poisson(l) { let k = 0, p = Math.exp(-l), s = p; const u = R(); while (u > s && k < 9) { k++; p *= l / k; s += p; } return k; }
  function friendly(a, b) { const d = (xiStr(a) - xiStr(b)) / 10; return [poisson(clamp(1.35 + d * .55, .25, 3.5)), poisson(clamp(1.35 - d * .55, .25, 3.5))]; }
  function campMail() {
    const G = G_(); D().pre = { s: G.season, camp: null };
    FM.mail({ cat: 'KULÜP', kind: 'x', sub: 'camp', from: 'Yardımcı antrenör', title: 'Hazırlık kampı: nereye gidiyoruz?', body: 'Yeni sezon öncesi kamp yerini seçmen gerekiyor. Kampın ardından üç hazırlık maçı ve dört takımlı Yaz Kupası oynanacak.\n\n' + CAMPS.map(c => `• ${c[0]}: ${c[2]} (${money(c[1])})`).join('\n'), opts: CAMPS.map(c => `${c[0]} · ${money(c[1])}`) });
  }
  function runCamp(i) {
    const G = G_(), t = me(), c = CAMPS[i], pre = D().pre || (D().pre = { s: G.season });
    if (G.fin.balance < c[1]) return { err: 'Bütçe yetersiz.' };
    G.fin.balance -= c[1]; pre.camp = i;
    G.fam = clamp((G.fam || 50) + [4, 8, 3][i], 0, 100);
    for (const p of squad()) p.mor = clamp(p.mor + [2, 4, 1][i], 20, 100);
    if (i === 1) { t.chem = clamp((t.chem || 60) + 5, 20, 100); G.fans = clamp(G.fans + 2, 0, 100); }
    if (i === 2) pre.fitW = 5;
    const pool = G.teams.filter(x => x.id !== t.id), opp = [];
    while (opp.length < 3) { const x = pick(pool); if (!opp.includes(x)) opp.push(x); }
    pre.fr = opp.map(o => { const [a, b] = friendly(t, o); return { tid: o.id, gf: a, ga: b }; });
    const four = [t]; while (four.length < 4) { const x = pick(pool.filter(y => y.div < 2 || i === 1)); if (!four.includes(x)) four.push(x); }
    const ko = (a, b) => { let [x, y] = friendly(a, b); let pen = null; if (x === y) { pen = R() < .5 + (xiStr(a) - xiStr(b)) / 40 ? 0 : 1; } return { a: a.id, b: b.id, x, y, pen, w: x > y ? a : x < y ? b : (pen === 0 ? a : b) }; };
    const s1 = ko(four[0], four[1]), s2 = ko(four[2], four[3]), fin = ko(s1.w, s2.w);
    pre.cup = { name: `${t.stadium.split(' ')[0]} Yaz Kupası`, games: [s1, s2, fin].map(g => ({ a: g.a, b: g.b, x: g.x, y: g.y, pen: g.pen, w: g.w.id })), won: fin.w.id === t.id };
    const fr = pre.fr.map(f => `${T(f.tid).name} ${f.gf}–${f.ga}`).join(', ');
    let cupTxt = `Yaz Kupası: ${s1.w.id === t.id ? `yarı finalde ${ek(T(s1.b).name, 'i')} geçtin, finalde ${T(fin.a === t.id ? fin.b : fin.a).name} ile ${fin.a === t.id ? fin.x + '–' + fin.y : fin.y + '–' + fin.x}` : `yarı finalde ${ek(T(s1.b).name, 'e')} elendin (${s1.x}–${s1.y})`}.`;
    if (pre.cup.won) { D().trophies.push({ s: G.season, n: pre.cup.name }); G.fans = clamp(G.fans + 2, 0, 100); xp(60); tl('cup', `${pre.cup.name} kazanıldı.`); cupTxt += ' Kupa müzeye gitti!'; wire(`${t.name}, hazırlık döneminde ${ek(pre.cup.name, 'i')} kazandı.`, 'good'); }
    FM.mail({ cat: 'KULÜP', from: 'Yardımcı antrenör', title: 'Hazırlık dönemi raporu', body: `${c[0]} tamamlandı (${c[2]}).\n\nHazırlık maçları: ${fr}.\n\n${cupTxt}` });
    return `${c[0]} seçildi. Hazırlık maçları: ${fr}. ${cupTxt}`;
  }

  /* ================= Milli ara ================= */
  function intlBreak() {
    const G = G_(), t = me(), sq = squad().filter(p => !p.loan || p.loan.own !== G.teamId);
    const cut = Math.max(66, Math.round(xiStr(t)) + 2), called = sq.filter(p => p.ovr >= cut && !p.inj).sort((a, b) => b.ovr - a.ovr).slice(0, 6);
    if (!called.length) { wire('Milli ara: kadrondan milli takıma çağrılan olmadı.'); return; }
    const hurt = [];
    for (const p of called) {
      p.caps = (p.caps || 0) + ri(1, 2); p.fit = Math.max(40, p.fit - ri(10, 24)); p.mor = clamp(p.mor + 3, 20, 100); p.value = Math.round(p.value * 1.02 / 1000) * 1000;
      if (R() < .07) { const ty = FM.injure(p); hurt.push(`${p.name} (${ty}, ${p.inj} hafta)`); }
    }
    G.fans = clamp(G.fans + 1, 0, 100); rep(.5);
    FM.mail({ cat: 'KADRO', from: 'Milli takım', title: `Milli ara: ${called.length} oyuncun davet edildi`, body: `Milli takıma çağrılanlar: ${called.map(p => `${p.name} (${p.caps}. maç)`).join(', ')}.\n\nOyuncular yorgun dönecek.${hurt.length ? ` Sakatlanarak dönenler: ${hurt.join(', ')}.` : ' Sakatlık haberi yok.'} Milli formalar kulübün itibarına da yaradı.` });
    wire(`Milli arada ${ek(t.name, 'den')} ${called.length} oyuncu forma giydi${hurt.length ? `, ${hurt.length} oyuncu sakat döndü` : ''}.`, hurt.length ? 'bad' : 'info');
  }

  /* ================= Kış arası: kamp, yönetim toplantısı, transfer önerisi ================= */
  const WINTER = [['Antalya kampı · ₺200 Bin', 200000], ['Dinlenme tatili', 0], ['Çift antrenman', 0]];
  function winter() {
    const G = G_(), t = me(), tb = FM.table(), pos = tb.findIndex(r => r.id === t.id) + 1, exp = FM.expectation(t);
    FM.mail({ cat: 'KULÜP', kind: 'x', sub: 'winter', from: 'Yardımcı antrenör', title: 'Kış arası: nasıl değerlendirelim?', body: 'Ligin ilk yarısı bitti, iki haftalık kış arası başlıyor.\n\n• Antalya kampı: taktik uyum +6, moral +4, kondisyon +10.\n• Dinlenme tatili: kondisyon +20, moral +6, taktik uyum −3.\n• Çift antrenman: gençler ekstra gelişir, kondisyon −10, moral −3.', opts: WINTER.map(x => x[0]) });
    const grade = pos <= exp - 2 ? 'A' : pos <= exp ? 'B' : pos <= exp + 2 ? 'C' : 'D';
    const msg = { A: 'Beklentilerin çok üstündesin. Yönetim çok memnun.', B: 'Hedef doğrultusunda ilerliyorsun.', C: 'Hedefin biraz gerisindesin. İkinci yarıda toparlanma bekleniyor.', D: 'Sonuçlar kabul edilemez. Yönetim sabrının sınırında.' }[grade];
    FM.mail({ cat: 'KULÜP', kind: 'x', sub: 'board', from: 'Kulüp başkanı', title: `Devre arası yönetim toplantısı: not ${grade}`, body: `İlk yarı değerlendirmesi: ${pos}. sıradasın, hedef ${exp}. sıra veya üstü. ${msg}\n\nBütçe ${money(G.fin.balance)}, taraftar desteği ${Math.round(G.fans)}, yönetim güveni ${Math.round(G.board)}.\n\nToplantıda ne istersin?`, opts: ['Hedefi koru', 'Hedefi yükselt: daha iddialıyız', 'Ek transfer bütçesi iste'], grade });
    const pos2 = weakest(), sug = suggestBuys(pos2, 3);
    FM.mail({ cat: 'TRANSFER', from: 'Yardımcı antrenör', pid: sug[0] ? sug[0].id : null, title: `Ara transfer önerisi: ${FM.POS_LONG[pos2]}`, body: `Kadro planlamasına göre en çok takviye gereken bölge: ${FM.POS_LONG[pos2].toLocaleLowerCase('tr')}.\n\n${sug.length ? 'Bütçene uyan adaylar:\n' + sug.map(p => { const e = FM.est(p); return `• ${p.name} (${p.age} yaş, güç ${e[0] === e[1] ? e[0] : e[0] + '–' + e[1]}, ${p.tid != null ? T(p.tid).name : 'serbest'}) · ${money(FM.askPrice(p))}`; }).join('\n') : 'Şu an bütçene uygun, kadroyu güçlendirecek bir aday bulamadık. Kiralık seçeneklere bakabilirsin.'}` });
    tl('winter', `Devre arası yönetim notu: ${grade} (${pos}. sıra).`);
  }

  /* ================= Takas teklifleri, söylentiler, serbest kalma maddesi, opsiyon ================= */
  function swapOffer() {
    const G = G_(), t = me(), mine = squad().filter(p => !p.loan && p.id !== t.cap);
    const clubs = G.teams.filter(x => x.id !== t.id && x.div < 2 && x.players.length >= 18);
    for (let k = 0; k < 6; k++) {
      const c = pick(clubs), y = pick(mine); if (!c || !y) return;
      const cands = c.players.map(P).filter(p => !p.loan && p.pos !== y.pos && p.value > y.value * .7 && p.value < y.value * 1.5);
      if (!cands.length) continue;
      const x = pick(cands), cash = r10k(x.value - y.value);
      FM.mail({ cat: 'TRANSFER', kind: 'x', sub: 'swap', from: c.name, pid: x.id, tid: c.id, yid: y.id, cash, title: `${ek(c.name, 'den')} takas teklifi: ${x.name} ↔ ${y.name}`, body: `${c.name}, ${y.name} karşılığında ${x.name} (${x.age} yaş, ${FM.POS_LONG[x.pos].toLocaleLowerCase('tr')}, değer ${money(x.value)}) teklif ediyor. ${cash > 0 ? `Aradaki fark için ${money(cash)} ödemen gerekiyor.` : cash < 0 ? `Üstüne ${money(-cash)} ödemeye hazırlar.` : 'Para farkı yok.'}`, opts: ['Takası kabul et', 'Reddet'] });
      return;
    }
  }
  function doSwap(m) {
    const G = G_(), t = me(), x = P(m.pid), y = P(m.yid), c = T(m.tid);
    if (!FM.windowOpen()) return { err: 'Transfer dönemi kapandı.' };
    if (!x || x.tid !== c.id || !y || y.tid !== t.id || y.loan) return { err: 'Takas artık mümkün değil.' };
    if (m.cash > 0 && G.fin.balance < m.cash) return { err: 'Bütçe yetersiz.' };
    FM.removeFromTeam(x); FM.removeFromTeam(y); FM.addToTeam(x, t); FM.addToTeam(y, c);
    x.con = 3; x.mor = 80; y.con = ri(2, 4); G.fin.balance -= m.cash; FM.autoPick(c); FM.ensureLineup(t);
    if (FM.Career.money) FM.Career.money(m.cash > 0 ? 'trOut' : 'trIn', Math.abs(m.cash));
    tl('swap', `Takas: ${x.name} geldi, ${y.name} gitti.`);
    wire(`Takas: ${x.name} ${ek(t.name, 'e')}, ${y.name} ${ek(c.name, 'e')} geçti.`, 'info');
    return `Takas tamam: ${x.name} artık senin oyuncun.`;
  }
  function rumors() {
    const G = G_(), t = me();
    if (R() < .6) {
      const c = FM.marketList().filter(p => p.tid != null && !p.loan && p.ovr >= xiStr(t) && p.hype !== G.season);
      if (!c.length) return; const p = pick(c);
      p.hype = G.season;
      const txt = `İddia: ${t.name}, ${T(p.tid).name} forması giyen ${p.name} için temaslara başladı. Kulübü fiyatı yükseltti.`;
      wire(txt, 'rumor'); social('Transfer Kulisi', '@transferkulis', `🔥 ${txt}`, 'paper');
    } else {
      const c = squad().filter(p => !p.loan && p.ovr >= xiStr(t) + 2); if (!c.length) return;
      const p = pick(c), big = pick(G.teams.filter(x => x.id !== t.id && (x.rep - x.div * 2) >= (t.rep - t.div * 2))) || pick(G.teams.filter(x => x.id !== t.id));
      wire(`İddia: ${big.name}, ${ek(t.name, 'in')} yıldızı ${p.name} ile ilgileniyor.`, 'rumor');
      social('Transfer Kulisi', '@transferkulis', `👀 ${big.name}, ${p.name} için harekete geçti iddiası.`, 'paper');
      FM.mail({ cat: 'BASIN', kind: 'x', sub: 'rumor', pid: p.id, tid: big.id, from: 'Basın sözcüsü', title: `Söylenti: ${big.name}, ${ek(p.name, 'i')} istiyor`, body: `Gazeteler ${ek(big.name, 'in')} ${p.name} ile ilgilendiğini yazıyor. Oyuncu da haberleri takip ediyor. Nasıl bir açıklama yapalım?`, opts: ['“Satılık değil.”', '“Gelen teklifleri dinleriz.”', 'Yorum yapma'] });
    }
  }
  function clauses() {
    const G = G_(), t = me();
    for (const p of squad()) {
      if (!p.rcl || p.loan || t.players.length <= 16) continue;
      if (R() < (p.rcl <= p.value * 1.6 ? .06 : .015)) {
        const b = pick(G.teams.filter(x => x.id !== t.id && (x.rep - x.div * 2) >= (t.rep - t.div * 2) && x.players.length < 28)); if (!b) continue;
        const amt = p.rcl; FM.sell(p.id, b.id, amt);
        FM.mail({ cat: 'TRANSFER', from: b.name, title: `Serbest kalma maddesi: ${p.name} gitti`, body: `${b.name}, ${ek(p.name, 'in')} sözleşmesindeki ${money(amt)} tutarındaki serbest kalma bedelini yatırdı. Oyuncu kulüpten ayrıldı.` });
        return;
      }
    }
  }
  function optMails() {
    for (const p of squad()) if (p.loan && p.loan.opt && !p.loan.asked) {
      p.loan.asked = 1;
      FM.mail({ cat: 'TRANSFER', kind: 'x', sub: 'opt', pid: p.id, from: T(p.loan.own).name, title: `Satın alma opsiyonu: ${p.name}`, body: `${p.name} kiralık sözleşmesinde ${money(p.loan.opt)} tutarında satın alma opsiyonu var. Sezon sonunda kullanmazsan oyuncu kulübüne döner. Bu sezon: ${p.apps} maç, ${p.g} gol.`, opts: [`Opsiyonu kullan · ${money(p.loan.opt)}`, 'Sezon sonunda geri gönder'] });
    }
  }

  /* ================= Diğer hocalar: kovulmalar, transferler, atışmalar, ezeli hasım ================= */
  function coaches() {
    const G = G_(), d = D();
    if (G.week < 6) return;
    for (const div of [0, 1]) {
      const tb = FM.table(div);
      for (let i = 0; i < tb.length; i++) {
        const t = T(tb[i].id); if (t.id === G.teamId) continue;
        const ex = FM.expectation(t), c = d.coaches[t.id] || (d.coaches[t.id] = { s: G.season, w: 0 });
        if (i + 1 > ex + 4 && (c.s < G.season || G.week - c.w >= 6) && R() < .05 + (i + 1 - ex - 4) * .025) {
          const old = t.coach, pool = d.pool.filter(x => x.rep >= 0);
          // başarılı küçük kulüp hocası büyüğe geçebilir
          const hot = tb.map(r => T(r.id)).filter(x => x.id !== G.teamId && x.id !== t.id && FM.table(x.div).findIndex(r => r.id === x.id) + 1 < FM.expectation(x) - 2 && (x.rep - x.div * 2) < (t.rep - t.div * 2));
          let nw, from = null;
          if (hot.length && R() < .35) { const h = pick(hot); nw = h.coach; from = h; h.coach = pool.length ? d.pool.splice(d.pool.indexOf(pick(pool)), 1)[0].name : newName(); d.coaches[h.id] = { s: G.season, w: G.week }; }
          else if (pool.length && R() < .5) nw = d.pool.splice(d.pool.indexOf(pick(pool)), 1)[0].name;
          else nw = newName();
          t.coach = nw; d.coaches[t.id] = { s: G.season, w: G.week };
          d.pool.push({ name: old, rep: 1 }); if (d.pool.length > 12) d.pool.shift();
          const txt = `${t.name}, kötü gidiş sonrası teknik direktör ${old} ile yollarını ayırdı. Yeni hoca: ${nw}${from ? ` (${ek(from.name, 'den')} geldi; ${ek(from.name, 'in')} yeni hocası ${from.coach})` : ''}.`;
          wire(txt, 'bad'); G.news.unshift({ w: G.week, s: G.season, text: txt, kind: 'info' }); if (G.news.length > 40) G.news.length = 40;
          if (d.nem === old) { d.nemFree = true; wire(`Ezeli hasmın ${old} işsiz kaldı.`, 'info'); }
          return;   // haftada en fazla bir kovulma
        }
      }
    }
  }
  function spat() {
    const G = G_(), t = me(), fx = FM.userFixture(), opp = fx ? (fx.h === t.id ? fx.a : fx.h) : t.rival;
    const tid = R() < .6 && opp != null ? opp : t.rival != null ? t.rival : opp; if (tid == null) return;
    const c = FM.coachOf(tid), lines = [`${G.manager} kendi takımına bakmalı, başkalarının işine karışmasın.`, `Onların oyununda bir fikir göremiyorum. Sadece şanslılar.`, `${t.name} bütçesiyle bu sonuçlar başarısızlık.`, `Bizim stadımızda ne olduğunu herkes görecek.`];
    FM.mail({ cat: 'BASIN', kind: 'x', sub: 'spat', tid, coach: c, from: 'Basın sözcüsü', title: `${T(tid).name} hocası ${c} sana laf attı`, body: `${T(tid).name} teknik direktörü ${c} basın toplantısında şunu söyledi: “${pick(lines)}”\n\nGazeteciler senin cevabını bekliyor.`, opts: ['Sert karşılık ver', 'Diplomatik bir cevap ver', 'Görmezden gel'] });
  }
  function heatUp(c, v) {
    const d = D(); d.heat[c] = (d.heat[c] || 0) + v;
    if (d.heat[c] >= 4 && d.nem !== c && (!d.nem || d.heat[c] > (d.heat[d.nem] || 0))) { d.nem = c; d.nemFree = false; d.nemRec = { w: 0, d: 0, l: 0 }; tl('nem', `${c} artık ezeli hasmın.`); FM.news(`Basın artık senin ve ${c} arasındaki rekabeti konuşuyor: ezeli hasım ilan edildi.`, 'info', { cat: 'BASIN', title: `Ezeli hasım: ${c}` }); }
  }

  /* ================= Gazete ================= */
  const COLS = [['Kadir Kalem', 'Eski futbolcu, duygusal yorumcu'], ['Selin Erdem', 'Veri ve taktik analisti']];
  function topScorer(div) { let top = null; for (const id in G_().players) { const p = G_().players[id]; if (p.tid != null && T(p.tid).div === div && (!top || p.g > top.g)) top = p; } return top; }
  function issue(special) {
    const G = G_(), d = D(), t = me(), tb = FM.table(), pos = tb.findIndex(r => r.id === t.id) + 1, exp = FM.expectation(t), lu = G.lastUser, lead = T(tb[0].id);
    const wk = G.week, items = [], ts = topScorer(t.div), rep = d.rep, xs = d.xgS;
    let head, sub;
    if (special) {
      const S = G.summary || {}, aw = S.awards || {};
      head = `${T(S.champion != null ? S.champion : tb[0].id).name} şampiyon!`; sub = `${G.season}. sezon özel sayısı`;
      if (S.top) items.push(['Gol kralı', `${S.top.name} (${T(S.top.tid).name}) ${S.top.g} golle sezonu zirvede bitirdi.`]);
      if (aw.poy) items.push(['Sezonun oyuncusu', `${aw.poy.name} (${aw.poy.team}) ortalama ${String(aw.poy.r).replace('.', ',')} puanla.`]);
      if (aw.young) items.push(['Sezonun genci', `${aw.young.name} (${aw.young.team}).`]);
      if (S.cup != null) items.push(['Kupa', `Kupanın sahibi ${T(S.cup).name}.`]);
      items.push([t.name, `${pos}. sıra (hedef ${exp}.). ${pos <= exp - 2 ? 'Beklentilerin çok üstünde bir sezon.' : pos <= exp ? 'Hedef tuttu.' : 'Hayal kırıklığı.'}`]);
      if (aw.xi && aw.xi.length) items.push(['Sezonun 11\'i', aw.xi.map(x => x.name).join(', ') + '.']);
    } else {
      if (lu && rep && rep.s === G.season && rep.w === G.week - 1) {
        const res = lu.d > 0 ? 'win' : lu.d < 0 ? 'loss' : 'draw', big = Math.abs(lu.gf - lu.ga) >= 3;
        head = res === 'win' ? (big ? `${t.name} farka koştu: ${lu.gf}–${lu.ga}!` : lu.derby ? `Derbi ${ek(t.name, 'in')}!` : `${t.name} güldü: ${lu.gf}–${lu.ga}`) : res === 'loss' ? (big ? `${ek(t.name, 'de')} deprem: ${lu.gf}–${lu.ga}` : lu.derby ? `Derbide hüsran` : `${t.name} yine kayıp`) : `${t.name} ile ${lu.opp} yenişemedi`;
        const mo = lu.motm != null && P(lu.motm) ? P(lu.motm).name : null; sub = `${lu.opp} maçının yıldızı: ${mo || 'takım oyunu'}. ${t.name} ligde ${pos}. sırada.`;
      } else { head = `Lige ${lead.name} damgası`; sub = `Zirvede ${lead.name} var.`; }
      items.push(['Zirve', `${lead.name} ${tb[0].pts} puanla lider. ${T(tb[1].id).name} ${tb[1].pts}, ${T(tb[2].id).name} ${tb[2].pts} puanda.`]);
      if (ts && ts.g) items.push(['Gol krallığı', `${ts.name} (${T(ts.tid).name}) ${ts.g} golle zirvede.`]);
      d.wire.filter(x => x.s === G.season && x.w >= wk - 1).slice(0, 5).forEach(x => items.push([x.k === 'rumor' ? 'Kulis' : 'Haber', x.t]));
    }
    // köşe yazıları
    const form = (tb[pos - 1].form || []).slice(-5), fw = form.filter(x => x === 'G').length, fl = form.filter(x => x === 'M').length;
    const c1 = pos <= exp - 2 ? `${G.manager} bu takıma ruh kattı. Tribünle oyuncular arasındaki bağı yıllardır böyle görmemiştim.` : pos > exp + 2 ? `Bu forma ${t.name} taraftarı layık değil. ${G.manager} soyunma odasını kaybetmeden bir şeyler yapmalı.` : fw >= 3 ? `Son haftalarda ${ek(t.name, 'de')} bir şeyler değişiyor. Oyuncuların gözündeki ateşi görüyorum.` : fl >= 3 ? `Takım sahada yürüyor. Bir lider çıkmazsa bu iş zor.` : `${t.name} ne çok iyi ne çok kötü. Bu sezonun kaderini kış transferleri belirleyecek.`;
    const f1 = v => v.toFixed(1).replace('.', ',');
    const c2 = xs && (xs.f + xs.a) > 0 ? (xs.gf - xs.f >= 3 ? `${t.name} ${f1(xs.f)} xG'den ${xs.gf} gol attı. Bu bitiricilik sürdürülebilir değil; ortalamaya dönüş kapıda.` : xs.f - xs.gf >= 3 ? `${t.name} ${f1(xs.f)} xG üretip ${xs.gf} golde kaldı. Oyun iyi, şans eksik: sonuçlar düzelecek.` : xs.a - xs.ga >= 3 ? `Savunma ${f1(xs.a)} xG'ye karşın ${xs.ga} gol yedi. Kaleci müthiş, ama pozisyon vermek tehlikeli.` : `Sezon xG dengesi ${f1(xs.f)} – ${f1(xs.a)}. Rakamlar ${xs.f > xs.a ? 'takımın tablodan daha iyi olduğunu' : 'zorlanacağını'} söylüyor.`) : `Veriler henüz konuşmuyor. ${ek(t.name, 'in')} ilk haftalarındaki şut kalitesini izleyeceğiz.`;
    const iss = { s: G.season, w: wk, special: !!special, head, sub, items, cols: [[...COLS[0], c1], [...COLS[1], c2]], no: d.paper.length ? d.paper[0].no + 1 : 1 };
    d.paper.unshift(iss); if (d.paper.length > 10) d.paper.length = 10;
    return iss;
  }

  /* ================= Kancalar ================= */
  const C = FM.Career, base = { ...C };
  C.ensure = () => { base.ensure(); ensure(); };
  C.newGame = () => { base.newGame && base.newGame(); ensure(); campMail(); };
  C.newSeason = () => {
    base.newSeason(); ensure(); const d = D(), G = G_();
    d.xgS = { s: G.season, f: 0, a: 0, gf: 0, ga: 0 }; d.bon = { s: G.season, v: 0 };
    campMail();
  };
  C.sideMod = team => {
    let k = base.sideMod(team); const d = D(); if (!d) return k;
    k *= 1 + d.mgr.sk.tac * .006;
    if (d.mgr.course) k *= .99;
    if (d.pre && d.pre.s === G_().season && d.pre.fitW && G_().week < d.pre.fitW) k *= 1.015;
    return k;
  };
  C.trainMult = p => { let k = base.trainMult(p); const d = D(); if (d && p.age <= 21) k *= 1 + d.mgr.sk.youth * .06; if (d && d.twin && d.twin > 0 && p.age <= 23) k *= 1.25; return k; };
  C.userMatch = (m, us, dd) => {
    base.userMatch(m, us, dd); const G = G_(), d = D(), oppId = m.s[1 - us].tid, gf = m.score[us], ga = m.score[1 - us], M = d.mgr;
    // rapor ve sezon xG
    d.rep = buildRep(m, us);
    d.xgS.f += d.rep.xg[us]; d.xgS.a += d.rep.xg[1 - us]; d.xgS.gf += gf; d.xgS.ga += ga;
    // kafa kafaya
    const h = d.h2h[oppId] || (d.h2h[oppId] = { w: 0, d: 0, l: 0, gf: 0, ga: 0, last: [] });
    h[dd > 0 ? 'w' : dd < 0 ? 'l' : 'd']++; h.gf += gf; h.ga += ga;
    h.last.unshift({ s: G.season, w: G.week + 1, home: m.s[0].tid === G.teamId, gf, ga, c: m.euro ? 'euro' : m.cup ? 'cup' : 'lig' }); if (h.last.length > 6) h.last.length = 6;
    // teknik direktör istatistikleri ve XP
    M.st.m++; M.st[dd > 0 ? 'w' : dd < 0 ? 'l' : 'd']++; M.st.gf += gf; M.st.ga += ga;
    xp(dd > 0 ? 30 : dd === 0 ? 12 : 4); rep(dd > 0 ? .4 : dd < 0 ? -.3 : 0);
    if (M.st.w === 1 && dd > 0) tl('win', `İlk galibiyet: ${T(oppId).name} karşısında ${gf}–${ga}.`);
    if (gf - ga >= 4) tl('big', `Farklı galibiyet: ${T(oppId).name} ${gf}–${ga}.`);
    if (M.st.m % 50 === 0) tl('mil', `${M.st.m}. maç (${M.st.w} galibiyet).`);
    // ezeli hasım
    if (d.nem && FM.coachOf(oppId) === d.nem) {
      d.nemRec[dd > 0 ? 'w' : dd < 0 ? 'l' : 'd']++;
      if (dd > 0) { xp(40); rep(1); G.fans = clamp(G.fans + 2, 0, 100); FM.news(`Ezeli hasmın ${ek(d.nem, 'i')} yendin! Basın galibiyeti manşetlere taşıyacak.`, 'good', { cat: 'BASIN' }); }
      else if (dd < 0) { rep(-1); G.fans = clamp(G.fans - 1, 0, 100); }
    }
    // performans primleri
    let bon = 0; const gl = {}; m.log.forEach(l => { if (l.type === 'goal' && l.side === us) gl[l.pid] = (gl[l.pid] || 0) + 1; });
    for (const id of m.s[us].played) { const p = P(id); if (!p) continue; if (p.ab) bon += p.ab; if (p.gb && gl[id]) bon += p.gb * gl[id]; }
    if (bon) { G.fin.balance -= bon; d.bon.v += bon; if (C.money) C.money('wages', bon); }
  };
  C.endWeek = () => {
    base.endWeek(); const G = G_(), d = D(); if (!d) return;
    const M = d.mgr;
    // yetenekler
    if (M.sk.mot) for (const p of squad()) if (p.mor < 60) p.mor = clamp(p.mor + M.sk.mot * .8, 20, 100);
    if (M.sk.media) G.fans = clamp(G.fans + M.sk.media * .2, 0, 100);
    if (M.course && --M.course.w <= 0) { M.lic = M.course.to; M.course = null; rep(4); xp(100); FM.news(`${LIC[M.lic][0]} lisansını aldın! Yetenek ağacında yeni seviyeler açıldı.`, 'good', { cat: 'KULÜP', title: `Lisans: ${LIC[M.lic][0]}` }); tl('lic', `${LIC[M.lic][0]} lisansı alındı.`); }
    if (d.twin) d.twin--;
    // hazırlık kampı seçilmediyse yardımcı karar verir
    if (G.week >= 1 && d.pre && d.pre.s === G.season && d.pre.camp == null) { const m = (G.inbox || []).find(x => x.kind === 'x' && x.sub === 'camp' && !x.done); if (m) { const r = runCamp(0); m.done = true; m.choice = 0; m.read = true; if (r && r.err) { d.pre.camp = -1; m.result = 'Bütçe yetersiz olduğu için kamp yapılamadı.'; } else m.result = 'Cevap vermediğin için yardımcın yurt içi kampı seçti. ' + r; } else d.pre.camp = -1; }
    // sezon takvimi
    if (G.week === 7 || G.week === 16) intlBreak();
    if (G.week === 11) winter();
    if (G.week === WK() - 3) optMails();
    if (FM.windowOpen()) { if (R() < .35) rumors(); if (R() < .1) swapOffer(); clauses(); }
    else if (R() < .12) rumors();
    coaches();
    if (G.week >= 3 && R() < .07) spat();
    issue(false);
  };
  C.seasonEnd = tbs => {
    base.seasonEnd(tbs); const G = G_(), d = D(), S = G.summary || {}, M = d.mgr;
    const champ = G.museum.titles.includes(G.season), cup = G.cup.winner === G.teamId, euro = G.euro && G.euro.winner === G.teamId;
    if (champ) { M.st.tr++; xp(300); rep(8); tl('title', `${G.season}. sezon lig şampiyonluğu.`); }
    if (cup) { M.st.tr++; xp(200); rep(5); tl('cup', `${G.season}. sezon kupa zaferi.`); }
    if (euro) { M.st.tr++; xp(400); rep(10); tl('euro', `${G.season}. sezon Kıta Kupası zaferi.`); }
    if (S.pos) { if (S.pos <= S.exp) { xp(150); rep(3); } else rep(-2); tl('season', `${G.season}. sezon: ${FM.DIV_TR[S.div]} ${S.pos}. sıra (hedef ${S.exp}.).`); if ((S.up || []).includes(G.teamId)) tl('up', 'Üst lige yükseliş!'); if ((S.down || []).includes(G.teamId)) tl('down', 'Küme düşme.'); }
    if (d.raise === G.season && S.pos > S.exp - 1) { G.board = clamp(G.board - 8, 0, 100); FM.news('Yönetim, devre arasında yükselttiğin hedefi tutturamadığını hatırlattı (güven −8).', 'bad', { cat: 'KULÜP' }); }
    // itibar yüksekse büyük kulüpler kapını çalar
    if (M.rep >= 60 && M.lic >= 2 && G.jobOffers && G.jobOffers.length < 3 && R() < .6) {
      const t = me(), big = G.teams.filter(x => x.div === 0 && x.id !== t.id && !G.jobOffers.includes(x.id) && (x.rep - x.div * 2) > (t.rep - t.div * 2)).sort((a, b) => b.rep - a.rep)[0];
      if (big) G.jobOffers.push(big.id);
    }
    issue(true);
  };
  C.transfer = (kind, p, amt) => {
    base.transfer(kind, p, amt);
    if (amt >= 3000000 && (kind === 'buy' || kind === 'sell')) tl(kind === 'buy' ? 'buy' : 'sell', `${kind === 'buy' ? 'Büyük transfer' : 'Rekor satış'}: ${p.name} (${money(amt)}).`);
    if (kind === 'buy' || kind === 'free' || kind === 'loan') wire(`${me().name}, ${p.name} transferini ${kind === 'loan' ? 'kiralık olarak ' : ''}bitirdi${amt ? ` (${money(amt)})` : ''}.`, 'good');
    if (kind === 'sell') wire(`${p.name}, ${money(amt)} karşılığında ${p.tid != null ? T(p.tid).name : 'yeni kulübüne'} gitti.`, 'info');
  };
  C.aiSale = (p, fee, s, b) => { wire(`${p.name}, ${money(fee)} bedelle ${ek(T(s).name, 'den')} ${ek(T(b).name, 'e')} transfer oldu.`, 'info'); };
  C.sacked = () => { const d = D(); rep(-8); tl('sack', `${me().name} ile yollar ayrıldı.`); const c = d.mgr.clubs[d.mgr.clubs.length - 1]; if (c) c.to = G_().season; };
  C.jobChange = t => { const d = D(); if (!d) return; const last = d.mgr.clubs[d.mgr.clubs.length - 1]; if (last && last.to == null) last.to = G_().season; d.mgr.clubs.push({ tid: t.id, from: G_().season, to: null }); rep(2); tl('job', `${t.name} ile anlaşıldı.`); };
  C.decide = (m, i) => {
    const G = G_(), d = D();
    if (m.sub === 'camp') { if (i == null || !CAMPS[i]) return { err: 'Geçersiz seçim.' }; return runCamp(i); }
    if (m.sub === 'winter') {
      if (i === 0) { if (G.fin.balance < 200000) return { err: 'Bütçe yetersiz.' }; G.fin.balance -= 200000; G.fam = clamp(G.fam + 6, 0, 100); for (const p of squad()) { p.mor = clamp(p.mor + 4, 20, 100); p.fit = clamp(p.fit + 10, 0, 100); } return 'Antalya kampı yapıldı: taktik uyum +6, moral +4, kondisyon +10.'; }
      if (i === 1) { G.fam = clamp(G.fam - 3, 0, 100); for (const p of squad()) { p.mor = clamp(p.mor + 6, 20, 100); p.fit = clamp(p.fit + 20, 0, 100); } return 'Oyuncular tatile çıktı: kondisyon +20, moral +6.'; }
      const up = []; for (const p of squad()) { p.fit = clamp(p.fit - 10, 0, 100); p.mor = clamp(p.mor - 3, 20, 100); if (p.age <= 23) for (let k = 0; k < 2; k++) if (FM.trainPlayer(p, 2.2, 'bal')) up.push(p.name); }
      d.twin = 3; return `Çift antrenman yapıldı. Gelişenler: ${up.length ? [...new Set(up)].join(', ') : 'henüz yok'}. Gençler üç hafta daha hızlı gelişecek.`;
    }
    if (m.sub === 'board') {
      if (i === 1) { G.board = clamp(G.board + 4, 0, 100); d.raise = G.season; return 'Yönetim iddiandan hoşlandı (güven +4). Sezon sonunda hedefin bir sıra üstü beklenecek.'; }
      if (i === 2) { if (R() < G.board / 120) { const amt = r10k(300000 + R() * 900000); G.fin.balance += amt; G.board = clamp(G.board - 2, 0, 100); return `Başkan ikna oldu: transfer bütçesine ${money(amt)} eklendi (güven −2).`; } G.board = clamp(G.board - 3, 0, 100); return 'Talebin reddedildi. Başkan mevcut bütçeyle devam etmeni istiyor (güven −3).'; }
      return 'Hedef aynı kaldı.';
    }
    if (m.sub === 'swap') { if (i !== 0) return 'Takas teklifini reddettin.'; return doSwap(m); }
    if (m.sub === 'rumor') {
      const p = P(m.pid); if (!p || p.tid !== G.teamId) return 'Oyuncu artık kadroda değil.';
      if (i === 0) { p.mor = clamp(p.mor + 5, 20, 100); G.fans = clamp(G.fans + 1, 0, 100); return `“Satılık değil” dedin. ${p.name} güveninden memnun (moral +5).`; }
      if (i === 1) {
        p.mor = clamp(p.mor - 6, 20, 100);
        if (FM.windowOpen()) { const amt = r10k(p.value * (1 + R() * .35)); G.offers.push({ pid: p.id, tid: m.tid, amt }); FM.news(`${T(m.tid).name}, ${p.name} için ${money(amt)} teklif gönderdi. Teklif bu hafta geçerli.`, 'offer', { kind: 'offer', pid: p.id, tid: m.tid, amt, from: T(m.tid).name, title: `${T(m.tid).name}, ${p.name} için teklif yaptı`, opts: ['Teklifi kabul et', 'Reddet'] }); return `Kapıyı araladın: ${T(m.tid).name} resmi teklif gönderdi. ${p.name} biraz bozuldu (moral −6).`; }
        return `Kapıyı araladın ama transfer dönemi kapalı. ${p.name} biraz bozuldu (moral −6).`;
      }
      p.mor = clamp(p.mor - 2, 20, 100); return 'Yorum yapmadın. Söylentiler bir süre daha sürecek.';
    }
    if (m.sub === 'spat') {
      const sk = d.mgr.sk.media;
      if (i === 0) { G.fans = clamp(G.fans + 3 + sk, 0, 100); G.board = clamp(G.board - (sk >= 2 ? 0 : 1), 0, 100); heatUp(m.coach, 2); social(G.manager, '@' + G.manager.split(' ')[0].toLowerCase(), `${ek(m.coach, 'e')} cevabımı sahada vereceğiz.`, 'paper'); return `Sert cevap verdin: taraftar +${3 + sk}${sk >= 2 ? '' : ', yönetim −1'}. ${m.coach} ile gerginlik arttı.`; }
      if (i === 1) { G.board = clamp(G.board + 1, 0, 100); heatUp(m.coach, .5); return 'Diplomatik cevap: yönetim olgun tavrını beğendi (güven +1).'; }
      heatUp(m.coach, 1); if (sk < 1) for (const p of squad()) p.mor = clamp(p.mor - 1, 20, 100); return `Görmezden geldin${sk < 1 ? '; oyuncular hocalarının sessiz kalmasını yadırgadı (moral −1)' : ''}.`;
    }
    if (m.sub === 'opt') {
      const p = P(m.pid); if (!p || p.tid !== G.teamId || !p.loan) return { err: 'Oyuncu artık kiralık değil.' };
      if (i !== 0) return `${p.name} sezon sonunda kulübüne dönecek.`;
      if (G.fin.balance < p.loan.opt) return { err: 'Bütçe yetersiz.' };
      G.fin.balance -= p.loan.opt; p.optBuy = 1; if (C.money) C.money('trOut', p.loan.opt);
      tl('buy', `Opsiyon kullanıldı: ${p.name} (${money(p.loan.opt)}).`);
      return `Opsiyonu kullandın: ${p.name} sezon sonunda bonservisiyle senin olacak.`;
    }
    return 'Karar verildi.';
  };

  /* ================= Notlar, karşılaştırma, filtreler ================= */
  function feeOf(p, o) { let f = FM.askPrice(p); if (o && o.cut && p.tid != null) f = r10k(f * .9); if (o && o.swap != null && P(o.swap)) f = Math.max(0, r10k(f - P(o.swap).value * .9)); return f; }
  const setNote = (pid, txt) => { const n = D().notes; if (txt && txt.trim()) n[pid] = txt.slice(0, 400); else delete n[pid]; };
  function toggleCmp(pid) { const c = D().cmp, i = c.indexOf(pid); if (i >= 0) { c.splice(i, 1); FM.save(); return false; } if (c.length >= 4) c.shift(); c.push(pid); FM.save(); return true; }
  function saveFilter(name, f) { const l = D().tfs; if (l.length >= 6) l.shift(); l.push({ n: name.slice(0, 24), f: { ...f } }); FM.save(); }

  FM.Depth = {
    ensure, buildRep, advice, htAdvice, planner, proj, NEED, weakest, suggestBuys, CAMPS, learn, course, SK, LIC, skCap, level, lvProg, repTxt, xp, issue, tl,
    setNote, toggleCmp, saveFilter, COLS, feeOf
  };
})();
