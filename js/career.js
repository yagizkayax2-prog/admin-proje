/* Saha Kenarı — kariyer sistemleri:
   sözleşme pazarlığı, soyunma odası (kişilik, kaptan, uyum, gruplar), scout ağı ve izleme listesi, altyapı akademisi,
   teknik ekip, haftalık antrenman takvimi, finans (bilet fiyatı, yönetimden bütçe), derbiler, sezon ödülleri,
   oyuncu kariyer geçmişi ve kulüp efsaneleri, sosyal akış, Kıta Kupası. Çekirdeğe FM.Career kancalarıyla bağlanır. */
(function () {
  const { ri, pick, clamp, wpick } = FM.util;
  const R = Math.random, P = id => FM.G.players[id], T = id => FM.G.teams[id], G_ = () => FM.G;
  const r10k = v => Math.round(v / 10000) * 10000, r100 = v => Math.round(v / 100) * 100;
  const name = () => pick(FM.FIRST) + ' ' + pick(FM.LAST);
  const me = () => T(G_().teamId);
  const mine = () => me().players.map(P);

  /* ---------- Sabitler ---------- */
  const FOREIGN = [
    { name: 'Nordhavn FK', short: 'NRD', c1: '#1b4f8a', c2: '#f2f2f2', rep: 5, stadium: 'Fjordparken', crest: [1, 0, 1] },
    { name: 'Real Castellar', short: 'RCS', c1: '#f4f4f4', c2: '#6b2d8b', rep: 5, stadium: 'Estadio del Castillo', crest: [0, 1, 0] },
    { name: 'Sporting Alvor', short: 'ALV', c1: '#1f8a4c', c2: '#ffffff', rep: 4, stadium: 'Estádio da Ria', crest: [2, 0, 1] },
    { name: 'Dinamo Varna', short: 'DVR', c1: '#2357a8', c2: '#e8e8e8', rep: 4, stadium: 'Morski Arena', crest: [1, 1, 0] },
    { name: 'AC Ventura', short: 'VEN', c1: '#a1162b', c2: '#111111', rep: 4, stadium: 'Stadio dei Venti', crest: [0, 2, 1] },
    { name: 'Olympique Rhône', short: 'ORH', c1: '#0e9cd8', c2: '#f7d117', rep: 4, stadium: 'Stade du Fleuve', crest: [2, 1, 1] },
    { name: 'Hafenstadt 05', short: 'HAF', c1: '#d6001c', c2: '#ffffff', rep: 3, stadium: 'Kaiarena', crest: [1, 3, 0] },
    { name: 'Lechia Brzeg', short: 'LBR', c1: '#ffd400', c2: '#0b5d2a', rep: 3, stadium: 'Stadion Nadbrzeżny', crest: [0, 3, 1] }
  ];
  const RIVALS = [[0, 1, 'Büyük Derbi'], [0, 4, 'Boğaz Derbisi'], [2, 6, 'Kıyı Derbisi'], [3, 5, 'Bozkır Derbisi'], [7, 5, 'İç Anadolu Derbisi'], [8, 9, 'Trakya-Marmara Derbisi'], [10, 11, 'Fırat Derbisi'],
    [12, 14, 'Göller Derbisi'], [13, 15, 'Ova Derbisi'], [16, 23, 'Likya Derbisi'], [17, 20, 'Yayla Derbisi'], [18, 21, 'Mavi Derbi'], [19, 22, 'Kadim Derbi']];
  const PER = { leader: ['Lider', 'Soyunma odasını sürükler, uyumu artırır.'], pro: ['Profesyonel', 'Antrenmanda daha hızlı gelişir.'], temper: ['Sinirli', 'Morali düşünce ortamı bozar.'], quiet: ['Sessiz', 'Kendi halinde, etkisi az.'], joker: ['Neşeli', 'Takımın moralini yükseltir, antrenmanda biraz gevşek.'] };
  const SESS = { tac: ['Taktik', 'Takım uyumu artar'], phy: ['Fiziksel', 'Gelişim hızlanır, yorgunluk ve sakatlık riski artar'], tec: ['Teknik', 'Bireysel gelişim'], rest: ['Dinlenme', 'Kondisyon ve moral'], prep: ['Maç hazırlığı', 'Sıradaki rakibe özel hazırlık'], sp: ['Duran top', 'Duran toplarda küçük avantaj'] };
  const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'];
  const ROLES = { asst: 'Yardımcı antrenör', gkc: 'Kaleci antrenörü', phys: 'Fizyoterapist', scout: 'Baş scout' };
  const ROLE_FX = { asst: 'Antrenmanda gelişim hızını artırır.', gkc: 'Kalecilerin gelişimini hızlandırır.', phys: 'Sakatlık sürelerini kısaltır, toparlanmayı hızlandırır.', scout: 'Scout görevlerinde daha çok ve daha isabetli oyuncu bulur.' };
  const EURO_AFTER = [5, 9, 13], EURO_ROUNDS = { 8: 'Çeyrek final', 4: 'Yarı final', 2: 'Final' };
  Object.assign(FM.ACH, { euro: ['Kıta fatihi', 'Kıta Kupası\'nı kazan.'], derby: ['Derbi kralı', 'Bir derbiyi kazan.'], award: ['Yılın oyuncusu', 'Bir oyuncun yılın oyuncusu seçilsin.'], academy: ['Altyapı ürünü', 'Altyapından bir oyuncuyu A takıma al.'] });

  /* ---------- Kurulum ve eski kayıtlar ---------- */
  function staffMember(q) { q = clamp(q, 1, 5); return { n: name(), q, w: q * q * 1600 + 2000, age: ri(34, 62) }; }
  function staffCands() { const out = {}; for (const k in ROLES) out[k] = [0, 1, 2].map(() => staffMember(ri(1, 5))); return out; }
  function ensure() {
    const G = G_(); if (!G) return;
    const t = me();
    if (!G.watch) G.watch = [];
    if (!G.watchT) G.watchT = {};
    if (!G.youth) G.youth = [];
    if (!G.staffQ) {
      const q = clamp(Math.round(t.rep / 2) + 1, 1, 4);
      G.staffQ = { asst: { ...staffMember(q), n: G.staff ? G.staff.asst : name() }, gkc: staffMember(q - 1), phys: { ...staffMember(q), n: G.staff ? G.staff.med : name() }, scout: { ...staffMember(q), n: G.staff ? G.staff.scout : name() } };
    }
    if (!G.staffC) G.staffC = staffCands();
    if (!G.sched) G.sched = ['tac', 'tec', 'phy', 'rest', 'prep'];
    if (G.fam == null) G.fam = 50;
    if (G.prep == null) G.prep = 0;
    if (G.fin && G.fin.tp == null) G.fin.tp = 1;
    if (G.fin && !G.fin.tot) G.fin.tot = { tickets: 0, sponsor: 0, wages: 0, staff: 0, trIn: 0, trOut: 0, prize: 0 };
    if (!G.awards) G.awards = [];
    if (!G.social) G.social = [];
    if (!G.museum.euro) G.museum.euro = [];
    if (!G.museum.leg) G.museum.leg = [];
    if (t.cap == null || !t.players.includes(t.cap)) t.cap = pickCaptain(t);
    if (!G.teams.some(x => x.div === 9)) addForeign();
    if (!G.euro) startEuro(true);
    if (!G.youth.length && G.season === 1 && G.week === 0) intake(true);
  }
  function addForeign() {
    const G = G_();
    for (const d of FOREIGN) {
      const t = { id: G.teams.length, ...d, div: 0, players: [], lineup: [], formation: pick(['4-4-2', '4-3-3', '4-2-3-1', '3-5-2']), ment: 1, tac: { press: ri(0, 2), tempo: ri(0, 2), line: ri(0, 2), width: ri(0, 2) }, sp: {}, fac: { training: 2, youth: 2, stadium: 3 }, foreign: true };
      G.teams.push(t); FM.buildSquad(t); t.div = 9; FM.autoPick(t);
    }
  }

  /* ---------- Kişilik, kaptan, uyum ---------- */
  function per(p) { if (!p.per) { const k = Object.keys(PER), h = (p.id * 2654435761) >>> 0; p.per = k[h % 7 < 1 ? 0 : h % 7 < 3 ? 1 : h % 7 < 4 ? 2 : h % 7 < 6 ? 3 : 4]; } return p.per; }
  function pickCaptain(t) { const xs = t.players.map(P).filter(p => !p.loan); return xs.length ? xs.sort((a, b) => (per(b) === 'leader') * 20 + b.age + b.ovr / 3 - ((per(a) === 'leader') * 20 + a.age + a.ovr / 3))[0].id : null; }
  function harmony() {
    const t = me(), sq = mine(); if (!sq.length) return 50;
    let h = sq.reduce((s, p) => s + p.mor, 0) / sq.length;
    const xi = new Set(t.lineup);
    h += Math.min(9, sq.filter(p => per(p) === 'leader' && xi.has(p.id)).length * 3);
    h += Math.min(5, sq.filter(p => per(p) === 'joker').length * 1.5);
    h -= sq.filter(p => per(p) === 'temper' && p.mor < 50).length * 4;
    const c = t.cap != null ? P(t.cap) : null;
    if (c) h += c.mor >= 70 ? 4 : c.mor < 45 ? -6 : 0;
    return clamp(Math.round(h), 0, 100);
  }
  function groups() {
    const sq = mine().filter(p => !p.loan), top = new Set(sq.slice().sort((a, b) => b.ovr - a.ovr).slice(0, 4).map(p => p.id));
    const defs = [['Yıldızlar', p => top.has(p.id)], ['Kıdemliler', p => !top.has(p.id) && p.age >= 29], ['Gençler', p => !top.has(p.id) && p.age <= 22], ['Orta kuşak', p => !top.has(p.id) && p.age > 22 && p.age < 29]];
    return defs.map(([n, f]) => { const ps = sq.filter(f); if (!ps.length) return null; const lead = ps.slice().sort((a, b) => (per(b) === 'leader') * 10 + b.age / 3 + b.ovr / 10 - ((per(a) === 'leader') * 10 + a.age / 3 + a.ovr / 10))[0]; return { n, ps, mor: Math.round(ps.reduce((s, p) => s + p.mor, 0) / ps.length), lead }; }).filter(Boolean);
  }
  function setCaptain(pid) { const t = me(), old = t.cap; if (old === pid) return; t.cap = pid; const p = P(pid); p.mor = clamp(p.mor + 8, 20, 100); if (old != null && P(old) && P(old).tid === t.id) P(old).mor = clamp(P(old).mor - 6, 20, 100); FM.save(); }

  /* ---------- Maç gücü değiştiricisi (kullanıcı tarafı) ---------- */
  function isDerby(fx) { if (!fx) return null; const r = RIVALS.find(([a, b]) => (fx.h === a && fx.a === b) || (fx.h === b && fx.a === a)); return r ? r[2] : null; }
  function sideMod(team, fx) {
    const G = G_(), cap = team.cap != null ? P(team.cap) : null;
    let k = .97 + harmony() / 100 * .06;
    k *= .98 + G.fam / 100 * .05;
    k *= 1 + Math.min(2, G.prep) * .012;
    if (cap && per(cap) === 'leader' && team.lineup.includes(cap.id)) k *= 1.01;
    if (fx && isDerby(fx) && fx.h === team.id) k *= 1.01;
    return k;
  }
  function trainMult(p) {
    const s = G_().staffQ; let k = 1 + (s.asst.q - 3) * .07;
    if (p.pos === 'GK') k *= 1 + (s.gkc.q - 3) * .12;
    const pr = per(p); if (pr === 'pro') k *= 1.15; else if (pr === 'joker') k *= .95;
    return k;
  }
  const staffWages = () => { const s = G_().staffQ; return s ? Object.values(s).reduce((a, x) => a + x.w, 0) : 0; };
  function money(kind, amt) { const t = G_().fin.tot; if (t) t[kind] = (t[kind] || 0) + amt; }

  /* ---------- Sözleşme pazarlığı ---------- */
  const NEG = {};
  function demand(p, kind) {
    const star = p.ovr >= 76 ? 1.12 : 1, mood = kind === 'renew' ? 1 + (70 - p.mor) / 220 : 1.12;
    const wage = r100(Math.max(p.wage * (kind === 'renew' ? 1.06 : 1), p.value / 250) * star * mood);
    const years = p.age <= 23 ? 4 : p.age <= 29 ? 3 : p.age <= 32 ? 2 : 1;
    return { wage, years, bonus: Math.max(20000, r10k(p.value * (kind === 'renew' ? .04 : .06))) };
  }
  function negStart(pid, kind) {
    const p = P(pid), d = demand(p, kind);
    const s = { pid, kind, dem: d, offer: { wage: r100(d.wage * .88), years: d.years, bonus: r10k(d.bonus * .7) }, pat: 3, msg: `${p.name}'in menajeri: “Oyuncumun beklentisi haftalık ${FM.money(d.wage)}, ${d.years} yıllık sözleşme ve ${FM.money(d.bonus)} imza parası.”`, done: null, round: 0 };
    NEG[pid] = s; return s;
  }
  function negOffer(pid) {
    const s = NEG[pid], p = P(pid); if (!s || s.done) return s;
    const o = s.offer, d = s.dem, yr = Math.abs(o.years - d.years) <= 1 ? 1 : .9;
    const sc = (Math.min(1.3, o.wage / d.wage) * .72 + Math.min(1.5, o.bonus / d.bonus) * .28) * yr;
    s.round++;
    if (sc >= .985) { s.done = 'ok'; s.msg = `Anlaşma sağlandı! ${p.name} haftalık ${FM.money(o.wage)} ile ${o.years} yıllık sözleşmeyi kabul etti.`; return s; }
    s.pat -= sc < .78 ? 2 : 1;
    if (s.pat <= 0) { s.done = 'walk'; s.msg = `Menajer masadan kalktı: “Bu teklifler oyuncumun değerini yansıtmıyor.” Bu hafta tekrar görüşülemez.`; G_().cool['n' + pid] = 1; return s; }
    if (o.wage < d.wage) d.wage = r100(d.wage - (d.wage - o.wage) * (sc > .9 ? .45 : .2));
    if (o.bonus < d.bonus) d.bonus = r10k(d.bonus - (d.bonus - o.bonus) * .3);
    s.msg = sc > .93 ? `Menajer: “Çok yaklaştık. Haftalık ${FM.money(d.wage)} ve ${FM.money(d.bonus)} imza parası olursa imzalarız.”` : sc > .8 ? `Menajer: “Biraz daha iyileştirmeniz gerek. En az ${FM.money(d.wage)} haftalık bekliyoruz.”` : `Menajer bu teklifi küçümsedi: “Ciddi bir teklif bekliyoruz.”`;
    return s;
  }
  const negCan = pid => !G_().cool['n' + pid];

  /* ---------- İzleme listesi ve scout görevleri ---------- */
  function toggleWatch(pid) { const G = G_(), i = G.watch.indexOf(pid); if (i >= 0) G.watch.splice(i, 1); else { G.watch.push(pid); G.watchT[pid] = P(pid).tid; } FM.save(); return i < 0; }
  function scoutTask(pos, maxAge, minPot) {
    const G = G_(); if (G.stask) return { ok: false, msg: 'Scout ekibi zaten bir görevde.' };
    if (G.fin.balance < 50000) return { ok: false, msg: 'Bütçe yetersiz.' };
    G.fin.balance -= 50000; G.stask = { pos, maxAge, minPot, w: 2 }; FM.save();
    return { ok: true, msg: `${G.staffQ.scout.n} ve ekibi yola çıktı. Rapor 2 hafta içinde gelir.` };
  }
  function scoutReport() {
    const G = G_(), t = G.stask, q = G.staffQ.scout.q;
    const pool = FM.marketList().filter(p => (t.pos === 'ALL' || p.pos === t.pos) && p.age <= t.maxAge && p.tid !== G.teamId && p.pot >= t.minPot - (5 - q));
    const found = pool.sort((a, b) => (b.pot + R() * (12 - q * 2)) - (a.pot + R() * (12 - q * 2))).slice(0, 2 + Math.floor(q / 2));
    found.forEach(p => { p.sc = 1; });
    G.stask = null;
    const posTr = t.pos === 'ALL' ? 'her mevkiden' : FM.POS_LONG[t.pos].toLocaleLowerCase('tr');
    FM.Inbox.make('scoutTask', { list: found.map(p => p.id), txt: `${posTr}, en fazla ${t.maxAge} yaşında, potansiyeli ${t.minPot}+` });
  }

  /* ---------- Altyapı ---------- */
  function intake(silent) {
    const G = G_(), t = me(), lv = t.fac.youth, q = G.staffQ.asst.q, n = 3 + Math.floor(lv / 2) + (R() < .5 ? 1 : 0), made = [];
    for (let i = 0; i < n; i++) {
      const pos = wpick(['GK', 'DEF', 'MID', 'FWD'], x => (x === 'GK' ? 1 : 3));
      const p = FM.genPlayer(pos, ri(34, 42) + lv * 3 + q, ri(15, 17));
      p.pot = clamp(p.ovr + ri(14, 30) + lv * 2 + (R() < .08 ? 8 : 0), p.ovr, 94); FM.refresh(p);
      p.youth = true; p.sc = 1; p.con = 0; p.wage = 300; p.mor = 75;
      G.youth.push(p.id); made.push(p);
    }
    if (!silent) FM.Inbox.make('intake', { list: made.map(p => p.id) });
    return made;
  }
  function promote(pid) {
    const G = G_(), p = P(pid), t = me();
    if (t.players.length >= 28) return { ok: false, msg: 'Kadro dolu (en fazla 28 oyuncu).' };
    G.youth = G.youth.filter(x => x !== pid); p.youth = false; p.con = 3; p.wage = 900; p.mor = 85;
    FM.addToTeam(p, t); FM.unlock('academy');
    FM.news(`Altyapıdan ${p.name} (${FM.POS_LONG[p.pos]}, ${p.age}) A takıma yükseldi.`, 'good');
    social('fan', `Altyapıdan bir yıldız daha! ${p.name} A takımda. Gençlere güvenen hocaya teşekkürler.`);
    FM.save(); return { ok: true, msg: `${p.name} A takıma yükseldi.` };
  }
  function release(pid) { const G = G_(); G.youth = G.youth.filter(x => x !== pid); delete G.players[pid]; FM.save(); }

  /* ---------- Teknik ekip ---------- */
  function hire(role, i) {
    const G = G_(), c = G.staffC[role][i], old = G.staffQ[role], cost = c.w * 8 + old.w * 4;
    if (G.fin.balance < cost) return { ok: false, msg: 'Bütçe yetersiz.' };
    G.fin.balance -= cost; G.staffQ[role] = c; G.staffC[role].splice(i, 1, staffMember(ri(1, 5)));
    if (role === 'asst') G.staff.asst = c.n; if (role === 'phys') G.staff.med = c.n; if (role === 'scout') G.staff.scout = c.n;
    FM.news(`${ROLES[role]} olarak ${c.n} göreve başladı.`, 'club'); FM.save();
    return { ok: true, msg: `${c.n} ile anlaşıldı. Bedel: ${FM.money(cost)} (eski çalışanın tazminatı dahil).` };
  }

  /* ---------- Antrenman takvimi ---------- */
  function setDay(i, k) {
    const G = G_(); G.sched[i] = k;
    const c = kk => G.sched.filter(x => x === kk).length, load = c('phy') + c('tec') * .6 + c('tac') * .5 + c('prep') * .4 + c('sp') * .4 - c('rest');
    G.training.intensity = load < 1.4 ? 0 : load < 3 ? 1 : 2; FM.save();
  }
  const schedCount = k => G_().sched.filter(x => x === k).length;

  /* ---------- Finans ---------- */
  function setTicket(v) { G_().fin.tp = clamp(Math.round(v * 20) / 20, .6, 1.8); FM.save(); }
  function askBoard() {
    const G = G_(); if (G.fin.req === G.season) return { ok: false, msg: 'Bu sezon yönetimden zaten bütçe istedin.' };
    G.fin.req = G.season;
    if (R() < G.board / 110) { const amt = r10k((me().rep + 1) * 650000 * (me().div ? .5 : 1)); G.fin.balance += amt; G.board = clamp(G.board - 4, 0, 100); FM.news(`Yönetim ${FM.money(amt)} ek bütçe ayırdı.`, 'good'); FM.save(); return { ok: true, msg: `Yönetim ${FM.money(amt)} ek bütçe verdi (yönetim güveni −4).` }; }
    G.board = clamp(G.board - 3, 0, 100); FM.save();
    return { ok: false, msg: 'Yönetim talebini reddetti: “Önce sonuç görmek istiyoruz.” (yönetim güveni −3)' };
  }

  /* ---------- Sosyal akış ---------- */
  const HANDLE = () => { const t = me(); return pick([`${t.short}Tribün`, `${t.short.toLowerCase()}_aşkı`, `kale_arkası_${t.short.toLowerCase()}`, `${t.name.split(' ')[0].toLowerCase()}lı_${ri(1, 99)}`, `sarı_çizgi_${t.short.toLowerCase()}`]); };
  const NEUTRAL = ['futbolanaliz', 'taktiktahtası', 'istatistikçi', 'ligfm', 'skorborsası'];
  function social(kind, text, by) {
    const G = G_(); if (!G || !G.social) return;
    const fans = kind === 'fan', j = kind === 'press' && by != null ? G.journos[by] : null;
    const who = j ? j.name : fans ? HANDLE() : pick(NEUTRAL), h = j ? '@' + j.name.toLocaleLowerCase('tr').replace(/\s+/g, '') : '@' + who;
    G.social.unshift({ id: (G.nextMsg = (G.nextMsg || 1) + 1), s: G.season, d: FM.Inbox.today(), who: j ? j.name : who, h, kind, text, likes: Math.round((fans ? 40 : 15) * (1 + G.fans / 25) * (.5 + R() * 1.6)), rt: ri(0, 60), c: fans ? me().c1 : j ? '#58c4dd' : '#9db0c8' });
    if (G.social.length > 80) G.social.length = 80;
  }
  function matchPosts(m, us, d) {
    const opp = T(m.s[1 - us].tid), gf = m.score[us], ga = m.score[1 - us], derby = isDerby(m.fx), motm = m.motm != null && P(m.motm) && P(m.motm).tid === G_().teamId ? P(m.motm) : null;
    if (d > 0) social('fan', pick([`${gf}-${ga}! ${opp.name} karşısında harika bir galibiyet. Bu takım bambaşka!`, `Bugün stadın havası başkaydı. ${gf}-${ga}, devam!`, `Üç puan cebimizde. ${derby ? derby + ' bizim!' : 'Sırada ne varsa gelsin.'}`]));
    else if (d < 0) social('fan', pick([`${gf}-${ga}... Böyle oyunla bir yere varamayız.`, `Hoca bu kadroyla neden böyle oynuyor? ${opp.name} maçı utanç verici.`, `Kötü gün, kötü sonuç. Ama formamızın arkasındayız.`]));
    else social('fan', pick([`${gf}-${ga}. Ne sevinebildik ne üzülebildik.`, `${opp.name} deplasmanında bir puan fena değil ama daha fazlası lazım.`, 'Beraberlik... Hücumda yine üretkenlik sıfır.']));
    social('neutral', `${me().name} ${gf}-${ga} ${opp.name}. Topla oynama %${Math.round(m.st.poss[us] / Math.max(1, m.st.poss[0] + m.st.poss[1]) * 100)}, şut ${m.st.shots[us]}-${m.st.shots[1 - us]}.`);
    if (motm) social('fan', `Maçın adamı ${motm.name}! Bu oyuncu formayı hak ediyor.`);
    if (derby && d !== 0) social('fan', d > 0 ? `${derby} kazanıldı! Şehir bizim!` : `${derby} kaybedildi. Bu acı kolay geçmez.`);
  }

  /* ---------- Kıta Kupası ---------- */
  function startEuro(first) {
    const G = G_();
    let dom = first || !G.euroNext ? G.teams.filter(t => t.div === 0).sort((a, b) => b.rep - a.rep || a.id - b.id).slice(0, 2).map(t => t.id) : G.euroNext.slice(0, 2);
    const foreign = G.teams.filter(t => t.div === 9).sort(() => R() - .5).slice(0, 6).map(t => t.id);
    G.euro = { name: '', alive: dom.concat(foreign), ties: [], hist: [], winner: null, final: false, s: G.season };
    G.euroDue = false;
    if (dom.includes(G.teamId)) FM.Inbox.make('euroIn');
  }
  function drawEuro() {
    const G = G_(), e = G.euro, al = e.alive.slice().sort(() => R() - .5);
    e.name = EURO_ROUNDS[al.length] || 'Tur'; e.final = al.length === 2; e.ties = [];
    for (let i = 0; i < al.length; i += 2) e.ties.push({ h: al[i], a: al[i + 1], hs: null, as: null, wx: FM.genWeather(G.week) });
    const mt = e.ties.find(t => t.h === G.teamId || t.a === G.teamId);
    if (mt) { G.euroDue = true; FM.news(`Kıta Kupası ${e.name} kurası: rakibin ${T(mt.h === G.teamId ? mt.a : mt.h).name}.`, 'club'); }
    else playEuroRound();
  }
  const euroTie = () => (G_().euroDue ? G_().euro.ties.find(t => (t.h === G_().teamId || t.a === G_().teamId) && t.hs == null) : null);
  function playEuroRound() {
    const G = G_(), e = G.euro;
    for (const t of e.ties) if (t.hs == null) FM.finishMatch(FM.simFull(FM.newMatch(t, { cup: true, neutral: e.final })));
    const losers = new Set(e.ties.map(t => (t.w === t.h ? t.a : t.h)));
    e.alive = e.alive.filter(id => !losers.has(id));
    e.hist.push({ name: e.name, ties: e.ties });
    const mt = e.ties.find(t => t.h === G.teamId || t.a === G.teamId);
    if (mt) {
      if (mt.w === G.teamId) { const pr = 700000 * e.hist.length; G.fin.balance += pr; money('prize', pr); G.fans = clamp(G.fans + 5, 0, 100); G.board = clamp(G.board + 3, 0, 100); FM.news(`Kıta Kupası ${e.name} geçildi! Ödül: ${FM.money(pr)}.`, 'good'); }
      else { FM.news(`Kıta Kupası'na ${e.name} turunda veda ettin.`, 'bad'); }
    }
    if (e.alive.length === 1) {
      e.winner = e.alive[0]; FM.news(`Kıta Kupası'nı ${T(e.winner).name} kazandı!`, 'club');
      if (e.winner === G.teamId) { G.fin.balance += 6000000; money('prize', 6000000); G.museum.euro.push(G.season); G.board = clamp(G.board + 15, 0, 100); G.fans = clamp(G.fans + 15, 0, 100); FM.unlock('euro'); social('fan', 'KITA KUPASI BİZİM! Bu geceyi asla unutmayacağız!'); }
    }
    for (const id in G.players) { const p = G.players[id]; if (p.tid != null && e.ties.some(t => t.h === p.tid || t.a === p.tid)) p.fit = clamp(p.fit + 14, 0, 100); }
    const done = e.ties; e.ties = []; G.euroDue = false; FM.save();
    return done;
  }

  /* ---------- Sezon ödülleri, oyuncu geçmişi, efsaneler ---------- */
  function awards() {
    const G = G_(), ps = Object.values(G.players).filter(p => p.tid != null && T(p.tid).div === 0 && p.apps >= 8), avg = p => p.rs / Math.max(1, p.rn);
    if (!ps.length) return null;
    const by = f => ps.slice().sort((a, b) => f(b) - f(a));
    const snap = p => ({ id: p.id, name: p.name, tid: p.tid, pos: p.pos, avg: Math.round(avg(p) * 100) / 100, g: p.g, as: p.as, age: p.age });
    const poy = by(p => avg(p) + p.g * .04 + p.as * .03)[0], top = by(p => p.g * 10 + avg(p))[0], young = by(p => (p.age <= 21 ? 10 : 0) + avg(p))[0], gk = by(p => (p.pos === 'GK' ? 10 : 0) + avg(p))[0];
    const xi = [gk].concat(...[['DEF', 4], ['MID', 4], ['FWD', 2]].map(([pos, n]) => by(p => (p.pos === pos ? 10 : 0) + avg(p)).slice(0, n)));
    const a = { s: G.season, poy: snap(poy), top: snap(top), young: young.age <= 21 ? snap(young) : null, xi: xi.map(snap) };
    G.awards.push(a);
    const won = [a.poy, a.top, a.young].filter(x => x && x.tid === G.teamId);
    if (a.poy.tid === G.teamId) FM.unlock('award');
    won.forEach(x => { const p = P(x.id); if (p) p.mor = clamp(p.mor + 8, 20, 100); });
    FM.Inbox.make('awards', { n: won.length + a.xi.filter(x => x.tid === G.teamId).length });
    return a;
  }
  function history() {
    const G = G_();
    for (const id in G.players) {
      const p = G.players[id]; if (!p.apps || p.tid == null) continue;
      (p.hist = p.hist || []).push({ s: G.season, tid: p.tid, apps: p.apps, g: p.g, as: p.as, avg: Math.round(p.rs / Math.max(1, p.rn) * 100) / 100 });
      if (p.tid === G.teamId) legend(p);
    }
  }
  function clubApps(p) { const G = G_(); return (p.hist || []).filter(h => h.tid === G.teamId).reduce((a, h) => ({ apps: a.apps + h.apps, g: a.g + h.g }), { apps: 0, g: 0 }); }
  function legend(p) {
    const G = G_(), c = clubApps(p); if (c.apps < 40) return;
    const e = G.museum.leg.find(x => x.id === p.id), rec = { id: p.id, name: p.name, pos: p.pos, apps: c.apps, g: c.g, team: me().name };
    if (e) Object.assign(e, rec); else { G.museum.leg.push(rec); FM.news(`${p.name} kulüp efsaneleri arasına girdi (${c.apps} maç).`, 'good'); }
  }
  function retire(p) { if (p.tid === G_().teamId) { legend(p); social('fan', `${p.name} futbolu bıraktı. Teşekkürler efsane!`); } }

  /* ---------- Kancalar ---------- */
  function newGame() { const G = G_(); G.euroNext = null; }
  function endWeek() {
    const G = G_(), t = me(), sq = mine();
    // kaptanın morali takıma yayılır
    const cap = t.cap != null ? P(t.cap) : null;
    if (cap && cap.tid === t.id) for (const p of sq) if (p !== cap) p.mor = clamp(p.mor + (cap.mor - p.mor) * .04, 20, 100);
    else if (!cap || cap.tid !== t.id) t.cap = pickCaptain(t);
    for (const p of sq) if (per(p) === 'temper' && p.mor < 45) for (const q of sq) q.mor = clamp(q.mor - .5, 20, 100);
    // antrenman takvimi
    const rest = schedCount('rest'), tac = schedCount('tac');
    for (const p of sq) { p.mor = clamp(p.mor + rest, 20, 100); p.fit = clamp(p.fit + rest * 3, 0, 100); }
    G.fam = clamp(G.fam + tac * 5 - 4, 0, 100);
    G.prep = schedCount('prep') + schedCount('sp') * .5;
    // fizyoterapist
    const ph = G.staffQ.phys.q;
    for (const p of sq) if (p.inj > 1 && R() < (ph - 2) * .15) p.inj--;
    // altyapı gelişimi
    for (const id of G.youth) { const p = P(id); if (p) FM.trainPlayer(p, .8 * (1 + t.fac.youth * .1) * (1 + (G.staffQ.asst.q - 3) * .05), 'bal'); }
    // finans
    const l = G.fin.last, tot = G.fin.tot; if (l && tot) { tot.tickets += l.tickets; tot.sponsor += l.sponsor; tot.wages += l.wages; tot.staff += l.staff || 0; }
    if (G.fin.tp > 1.25) G.fans = clamp(G.fans - (G.fin.tp - 1.2) * 3, 0, 100); else if (G.fin.tp < .85) G.fans = clamp(G.fans + .8, 0, 100);
    // izleme listesi
    for (const pid of G.watch.slice()) {
      const p = P(pid); if (!p) { G.watch = G.watch.filter(x => x !== pid); continue; }
      if (G.watchT[pid] !== p.tid && p.tid !== G.teamId) { FM.Inbox.make('watch', { pid, k: 'moved', from: G.watchT[pid] }); G.watchT[pid] = p.tid; }
      else if (p.tid != null && p.con <= 1 && p.wn !== G.season && G.week >= 8) { p.wn = G.season; FM.Inbox.make('watch', { pid, k: 'con' }); }
    }
    // scout görevi
    if (G.stask && --G.stask.w <= 0) scoutReport();
    // Kıta Kupası kurası
    if (EURO_AFTER.includes(G.week) && G.euro && G.euro.alive.length > 1 && G.euro.s === G.season) drawEuro();
    // derbi öncesi taraftar mektubu
    const fx = FM.userFixture(), dn = isDerby(fx);
    if (dn) FM.Inbox.make('derby', { name: dn, opp: fx.h === G.teamId ? fx.a : fx.h });
    // kaptan morali düşükse uyarı
    if (cap && cap.mor < 45 && G.ibCool && (!G.ibCool.capLow || G.season * 100 + G.week - G.ibCool.capLow > 5)) { G.ibCool.capLow = G.season * 100 + G.week; FM.Inbox.make('capLow', { pid: cap.id }); }
    if (R() < .5) social(R() < .6 ? 'fan' : 'neutral', pick([`Bu hafta antrenmanları izledim, takım ${harmony() >= 65 ? 'çok neşeli' : 'biraz gergin'} görünüyor.`, `${t.name} için kritik bir hafta. Hoca kimi oynatacak?`, `Transfer dedikoduları başladı bile...`, `Tribünde yerimizi aldık, ${t.stadium} yine dolacak!`]));
  }
  function userMatch(m, us, d) {
    const G = G_(), dn = isDerby(m.fx);
    if (dn) {
      if (d > 0) { G.fans = clamp(G.fans + 5, 0, 100); G.board = clamp(G.board + 3, 0, 100); FM.unlock('derby'); FM.news(`${dn} kazanıldı! Taraftar bayram ediyor.`, 'good'); }
      else if (d < 0) { G.fans = clamp(G.fans - 5, 0, 100); G.board = clamp(G.board - 3, 0, 100); FM.news(`${dn} kaybedildi. Tribünler öfkeli.`, 'bad'); }
    }
    G.prep = 0;
    matchPosts(m, us, d);
  }
  function seasonEnd(tbs) {
    const G = G_();
    history(); awards();
    G.euroNext = tbs[0].slice(0, 2).map(r => r.id);
  }
  function newSeason() {
    const G = G_();
    for (const id of G.youth.slice()) { const p = P(id); if (!p) continue; p.age++; if (p.age >= 20) { FM.news(`Altyapıdan ${p.name} yaş sınırına takıldı ve kulüpten ayrıldı.`, 'info'); release(id); } }
    intake(false);
    G.staffC = staffCands();
    G.fin.tot = { tickets: 0, sponsor: 0, wages: 0, staff: 0, trIn: 0, trOut: 0, prize: 0 };
    G.prep = 0;
    startEuro(false);
    for (const t of G.teams) if (t.div === 9) { for (const id of t.players.slice()) { const p = P(id); p.age++; p.g = 0; p.as = 0; p.apps = 0; p.rs = 0; p.rn = 0; p.inj = 0; p.susp = 0; p.fit = 100; FM.refresh(p); } FM.autoPick(t); }
    const t = me(); if (t.cap == null || !t.players.includes(t.cap)) t.cap = pickCaptain(t);
  }

  /* Basın ve transfer olaylarını sosyal akışa da yansıt */
  if (FM.Press) {
    const tr = FM.Press.transfer, an = FM.Press.answer;
    FM.Press.transfer = (k, p, amt) => { tr(k, p, amt); if (G_() && G_().social && (k !== 'sell' || amt >= 500000)) social('fan', k === 'sell' ? `${p.name} gitti mi? ${FM.money(amt)} için mi? Yönetim açıklama yapmalı.` : `${p.name} aramıza hoş geldin! ${k === 'loan' ? 'Kiralık ama kalıcı olması dileğiyle.' : 'Bu transfer bizi bir üst seviyeye taşır.'}`); };
    FM.Press.answer = (id, ai) => { const r = an(id, ai); if (r && G_().social) social('press', `Hoca basın toplantısında: “${r.q.a[ai][0]}”`, r.q.j); return r; };
  }

  /* ---------- Gelen kutusu şablonları ---------- */
  FM.Inbox.TPL = FM.Inbox.TPL || null;
  const TPL = {
    scoutTask: x => ({ from: G_().staffQ.scout.n, role: 'Baş scout', ic: 'scout', cat: 'scout', title: `Scout görevi tamamlandı: ${x.list.length} oyuncu`,
      body: `Aradığın profil (${x.txt}) için bulduklarımız: ${x.list.map(id => `{p:${id}}`).join(', ') || 'uygun oyuncu bulamadık'}. Hepsinin tam raporu dosyanda.`, pid: x.list[0] }),
    intake: x => ({ ...stf('asst'), cat: 'squad', title: 'Altyapı alım günü', body: `Bu sezon akademiye ${x.list.length} yeni genç katıldı: ${x.list.map(id => `{p:${id}}`).join(', ')}. Antrenman sayfasındaki Altyapı bölümünden takip edebilirsin.`, pid: x.list.slice().sort((a, b) => P(b).pot - P(a).pot)[0] }),
    watch: x => { const p = P(x.pid); return { ...stf('scoutS'), cat: 'scout', title: x.k === 'moved' ? `İzlediğin ${p.name} transfer oldu` : `İzlediğin ${p.name}: sözleşmesi bitiyor`, pid: p.id,
      body: x.k === 'moved' ? `İzleme listendeki {p:${p.id}} ${p.tid == null ? 'serbest kaldı' : `{t:${p.tid}} kulübüne geçti`}.` : `İzleme listendeki {p:${p.id}} sözleşmesinin son sezonunda. Kulübü {t:${p.tid}} onu daha uygun bir bedelle bırakabilir.` }; },
    derby: x => ({ from: `${me().short} Tribün Grubu`, role: 'Taraftar grubu', ic: 'board', cat: 'board', title: `${x.name} haftası!`, tid: x.opp,
      body: `Hocam, bu hafta {t:${x.opp}} ile ${x.name} var. Bu maç bizim için sezonun en önemli maçı. Tribünler dolu olacak; galibiyet taraftarı ve yönetimi çok mutlu eder, yenilgi ise kolay affedilmez.` }),
    capLow: x => ({ ...stf('asst'), cat: 'squad', title: 'Kaptanın morali bozuk', pid: x.pid, body: `Kaptan {p:${x.pid}} son günlerde çok mutsuz ve bu soyunma odasına yansıyor. Onunla konuşmak ya da kaptanlığı başka birine vermek isteyebilirsin (Kadro → Soyunma odası).` }),
    awards: x => { const a = G_().awards[G_().awards.length - 1]; return { from: 'Lig Federasyonu', role: 'Ödül komitesi', ic: 'board', cat: 'board', title: `${a.s}. sezon ödülleri açıklandı`, pid: a.poy.id,
      body: `Yılın oyuncusu {p:${a.poy.id}}, gol kralı {p:${a.top.id}} (${a.top.g} gol)${a.young ? `, yılın genci {p:${a.young.id}}` : ''}. ${x.n ? `Kulübünden ${x.n} isim ödül ya da yılın 11'inde yer aldı.` : 'Bu yıl kulübünden ödül alan olmadı.'}` }; },
    euroIn: () => ({ from: 'Kıta Futbol Birliği', role: 'Turnuva komitesi', ic: 'board', cat: 'board', title: 'Kıta Kupası\'na katılıyorsun!', body: `Kulübün bu sezon Kıta Kupası\'nda mücadele edecek. Çeyrek final ${EURO_AFTER[0] + 1}., yarı final ${EURO_AFTER[1] + 1}., final ${EURO_AFTER[2] + 1}. hafta öncesinde oynanır. Her tur ödül getirir; şampiyonluk ${FM.money(6000000)}.` })
  };
  function stf(k) { const s = G_().staffQ; return k === 'asst' ? { from: s.asst.n, role: ROLES.asst, ic: 'staff' } : { from: s.scout.n, role: ROLES.scout, ic: 'scout' }; }
  FM.Inbox.extend(TPL);

  FM.Career = {
    ensure, newGame, endWeek, userMatch, seasonEnd, newSeason, retire, sideMod, trainMult, staffWages, money,
    per, PER, harmony, groups, setCaptain, pickCaptain, isDerby, RIVALS,
    demand, negStart, negOffer, negCan, NEG,
    toggleWatch, scoutTask, intake, promote, release, hire, ROLES, ROLE_FX, SESS, DAYS, setDay, schedCount, setTicket, askBoard,
    social, euroTie, playEuroRound, EURO_AFTER, clubApps, FOREIGN
  };
})();
