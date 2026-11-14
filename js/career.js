/* Saha Kenarı — kariyer sistemleri (ana dalın teknik ekip, U19, Kıta Kupası, derbi ve sosyal akış sistemlerine bağlanır):
   sözleşme pazarlığı, oyuncu kişilikleri ve soyunma odası grupları, izleme listesi ve scout görevi, gün gün antrenman takvimi,
   bireysel hedef ve mentörlük, oyuncu kariyer geçmişi ve kulüp efsaneleri, tesisler ve uzun vadeli projeler, yurt dışı akademi,
   stadyum (koltuk deseni, kombine, stat adı sponsoru), forma tasarımı ve forma sponsoru, ek bütçe ve sezonluk gelir-gider.
   Çekirdeğe FM.Career kancalarıyla bağlanır (core.js içindeki hook çağrıları). */
(function () {
  const { ri, pick, clamp, wpick } = FM.util;
  const R = Math.random, P = id => FM.G.players[id], T = id => FM.G.teams[id], G_ = () => FM.G;
  const r10k = v => Math.round(v / 10000) * 10000, r100 = v => Math.round(v / 100) * 100;
  const me = () => T(G_().teamId);
  const squad = () => me().players.map(P).filter(Boolean);
  const nm = () => pick(FM.FIRST) + ' ' + pick(FM.LAST);

  /* ================= Sabitler ================= */
  const PER = { leader: ['Lider', 'Soyunma odasını sürükler, takım uyumunu artırır.'], pro: ['Profesyonel', 'Antrenmanda daha hızlı gelişir.'], temper: ['Sinirli', 'Morali düşünce ortamı bozar.'], quiet: ['Sessiz', 'Kendi halinde, etkisi az.'], joker: ['Neşeli', 'Takımın moralini yükseltir, antrenmanda biraz gevşek.'] };
  const SESS = { tac: ['Taktik', 'Takım uyumu artar'], phy: ['Fiziksel', 'Gelişim hızlanır, yorgunluk ve sakatlık riski artar'], tec: ['Teknik', 'Bireysel gelişim'], rest: ['Dinlenme', 'Kondisyon ve moral'], prep: ['Maç hazırlığı', 'Sıradaki rakibe özel hazırlık'], sp: ['Duran top', 'Duran toplarda küçük avantaj'] };
  const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'];
  const ATTR = { pac: 'Hız', sho: 'Şut', pas: 'Pas', def: 'Savunma', phy: 'Fizik', gk: 'Kalecilik' };
  /* Tesisler: etki 1. seviyeye göre seviye başına %7,5; proje tamamlanınca seviye 6 sayılır */
  const FACS = {
    training: { n: 'Antrenman merkezi', ic: 'training', d: 'Sahalar: maçlar arasında kondisyonun dönüşü ve forma giymeyenlerin antrenmanla gelişimi.', fx: [['Toparlanma', 1], ['Oynamayanın gelişimi', 1]],
      proj: ['Entegre antrenman sahaları', 'Sahalar ve toparlanma tek yapıda: toparlanma ve oynamayanların gelişimi bir kademe daha artar.', 4000000] },
    tcoach: { n: 'Teknik ekip binası', ic: 'staff', d: 'Antrenör ofisleri ve analiz odaları: gençlerin gelişimi ve tecrübeli oyuncuların yaşla düşüşü.', fx: [['Gençlerin gelişimi', 1], ['Tecrübelinin düşüşü', -1]], base: 1800000,
      proj: ['Teknik gelişim merkezi', 'Video analiz ve bireysel antrenman laboratuvarı: gençler daha hızlı gelişir, tecrübeliler daha geç düşer.', 9000000] },
    med: { n: 'Sağlık merkezi', ic: 'med', d: 'Fizyoterapi ve tıbbi tarama: sakatlık riski ve sakatlıktan dönüş süresi.', fx: [['Sakatlık riski', -1], ['Sakatlık süresi', -1]], base: 1600000,
      proj: ['Spor sağlığı ve rehabilitasyon merkezi', 'Kriyoterapi, hidroterapi ve tarama ünitesi: sakatlıklar daha az ve daha kısa.', 7000000] },
    scoutnet: { n: 'Gözlem ağı', ic: 'scout', d: 'Bölge ofisleri ve veri ekibi: pazardaki oyuncuları tanıma ve scout raporlarının zenginliği.', fx: [['Oyuncu tanıma', 1], ['Rapor zenginliği', 1]], base: 1200000,
      proj: ['Bölgesel gözlem ağı', 'Her bölgede kalıcı gözlemciler: her hafta daha çok oyuncu tanınır, raporlar daha çok aday getirir.', 2000000] },
    youth: { n: 'Altyapı akademisi', ic: 'team', d: 'Akademi sahası, yurt ve okul: altyapıya gelen gençlerin kalitesi ve sayısı.', fx: [['Gençlerin kalitesi', 1], ['Gelen genç sayısı', 1]],
      proj: ['Akademi eğitim kampüsü', 'Okul ve yatılı kampüs: altyapıya daha kaliteli ve daha çok genç gelir.', 4000000] }
  };
  const ABROAD = { n: 'Yurt dışı akademi', d: 'Başka bir ülkede ortak akademi: her yeni dönemde altyapıya 2 yüksek potansiyelli yabancı genç ekler.', cost: 6000000 };
  const PROJ_WEEKS = 22;
  for (const k of ['tcoach', 'med', 'scoutnet']) FM.FAC[k] = { name: FACS[k].n, base: FACS[k].base };
  FM.FAC.training.name = FACS.training.n; FM.FAC.youth.name = FACS.youth.n;
  Object.assign(FM.ACH, { mentor: ['Usta-çırak', 'Bir mentor kişiliğini gence aktarsın.'], legend: ['Kulüp efsanesi', 'Bir oyuncun kulübünde 40 maça ulaşsın.'] });

  const lvOf = k => me().fac[k] || 1;
  const effAt = l => (l - 1) * .075;    // 1. seviyeye göre: 5. seviye +%30, proje sonrası +%37,5
  const eff = k => effAt(lvOf(k));

  /* ================= Kurulum ve eski kayıtlar ================= */
  function ensure() {
    const G = G_(); if (!G) return;
    const t = me(), base = clamp(Math.round(t.rep / 2) + 1, 1, 4);
    G.watch = G.watch || []; G.watchT = G.watchT || {}; G.mentors = G.mentors || [];
    if (!G.sched) G.sched = ['tac', 'tec', 'phy', 'rest', 'prep'];
    if (G.fam == null) G.fam = 50;
    if (G.prep == null) G.prep = 0;
    if (!G.fin.tot) G.fin.tot = { tickets: 0, season: 0, sponsor: 0, deals: 0, wages: 0, staff: 0, trIn: 0, trOut: 0, prize: 0 };
    if (G.fin.stp == null) G.fin.stp = 1;
    for (const k of ['tcoach', 'med', 'scoutnet']) if (t.fac[k] == null) t.fac[k] = base;
    if (t.fac.abroad == null) t.fac.abroad = 0;
    if (!G.fproj) G.fproj = { cur: null, done: {} };
    if (!G.seats) G.seats = { pat: 'mix', c1: t.c1, c2: t.c2 };
    if (!G.kits) G.kits = defaultKits(t);
    if (!G.museum.leg) G.museum.leg = [];
    if (!G.ybInit) { G.ybInit = true; for (const id of G.youth || []) { const p = P(id); if (p) p.yb = 1; } }
    if (!G.offersS || G.offersS.s !== G.season) genOffers();
    if (FM.Press) FM.Press.ensure();
  }
  const defaultKits = t => [{ pat: 'solid', c1: t.c1, c2: t.c2 }, { pat: 'solid', c1: t.c2, c2: t.c1 }, { pat: 'sash', c1: '#1b2433', c2: t.c1 }];

  /* ================= Kişilik ve soyunma odası ================= */
  function per(p) { if (!p.per) { const k = Object.keys(PER), h = (p.id * 2654435761) >>> 0, x = h % 7; p.per = k[x < 1 ? 0 : x < 3 ? 1 : x < 4 ? 2 : x < 6 ? 3 : 4]; } return p.per; }
  function groups() {
    const sq = squad().filter(p => !p.loan), top = new Set(sq.slice().sort((a, b) => b.ovr - a.ovr).slice(0, 4).map(p => p.id));
    const defs = [['Yıldızlar', p => top.has(p.id)], ['Kıdemliler', p => !top.has(p.id) && p.age >= 29], ['Gençler', p => !top.has(p.id) && p.age <= 22], ['Orta kuşak', p => !top.has(p.id) && p.age > 22 && p.age < 29]];
    return defs.map(([n, f]) => { const ps = sq.filter(f); if (!ps.length) return null; const lead = ps.slice().sort((a, b) => (per(b) === 'leader') * 10 + b.age / 3 + b.ovr / 10 - ((per(a) === 'leader') * 10 + a.age / 3 + a.ovr / 10))[0]; return { n, ps, mor: Math.round(ps.reduce((s, p) => s + p.mor, 0) / ps.length), lead }; }).filter(Boolean);
  }

  /* ================= Maç gücü ve antrenman çarpanları ================= */
  function sideMod(team) {
    const G = G_(), cap = team.cap != null ? P(team.cap) : null;
    let k = .98 + G.fam / 100 * .05;                     // taktik uyum (antrenman takviminden)
    k *= 1 + Math.min(2, G.prep) * .012;                  // maç hazırlığı
    if (cap && per(cap) === 'leader' && team.lineup.includes(cap.id)) k *= 1.01;
    return k;
  }
  function trainMult(p) {
    const G = G_(), t = me(); let k = 1;
    const pr = per(p); if (pr === 'pro') k *= 1.15; else if (pr === 'joker') k *= .95;
    if (p.age <= 21) k *= 1 + eff('tcoach');
    if (!t.lineup.includes(p.id)) k *= 1 + eff('training');
    const pair = G.mentors.find(x => x.y === p.id), m = pair && P(pair.m); if (m) k *= 1 + mentorBoost(m);
    if (p.tf) k *= 1.1;
    return k;
  }

  /* ================= Sözleşme pazarlığı ================= */
  const NEG = {};
  function demand(p, kind) {
    const star = p.ovr >= 76 ? 1.12 : 1, mood = kind === 'renew' ? 1 + (70 - p.mor) / 220 : 1.12;
    const wage = r100(Math.max(p.wage * (kind === 'renew' ? 1.06 : 1), p.value / 250) * star * mood);
    const years = p.age <= 23 ? 4 : p.age <= 29 ? 3 : p.age <= 32 ? 2 : 1;
    return { wage, years, bonus: Math.max(20000, r10k(p.value * (kind === 'renew' ? .04 : .06))) };
  }
  function negStart(pid, kind) {
    const p = P(pid), d = demand(p, kind);
    return (NEG[pid] = { pid, kind, dem: d, offer: { wage: r100(d.wage * .88), years: d.years, bonus: r10k(d.bonus * .7) }, pat: 3, done: null,
      msg: `${p.name} adına menajeri: “Oyuncumun beklentisi haftalık ${FM.money(d.wage)}, ${d.years} yıllık sözleşme ve ${FM.money(d.bonus)} imza parası.”` });
  }
  function negOffer(pid) {
    const s = NEG[pid], p = P(pid); if (!s || s.done) return s;
    const o = s.offer, d = s.dem, yr = Math.abs(o.years - d.years) <= 1 ? 1 : .9;
    // sözleşme maddeleri: gol/maç primi haftalık maaşa eklenmiş gibi değerlendirilir, makul bir serbest kalma bedeli oyuncuyu ikna eder
    const gr = { FWD: .4, MID: .15, DEF: .05, GK: 0 }[p.pos], ext = ((o.gb || 0) * gr + (o.ab || 0) * .85) / Math.max(1, d.wage);
    const rc = o.rcl ? (o.rcl <= p.value * 1.5 ? .05 : o.rcl <= p.value * 2.5 ? .025 : 0) : 0;
    const sc = (Math.min(1.3, o.wage / d.wage) * .72 + Math.min(1.5, o.bonus / d.bonus) * .28) * yr + Math.min(.12, ext * .72) + rc;
    if (sc >= .985) { s.done = 'ok'; s.msg = `Anlaşma sağlandı! ${p.name} haftalık ${FM.money(o.wage)} ile ${o.years} yıllık sözleşmeyi kabul etti.`; return s; }
    s.pat -= sc < .78 ? 2 : 1;
    if (s.pat <= 0) { s.done = 'walk'; s.msg = 'Menajer masadan kalktı: “Bu teklifler oyuncumun değerini yansıtmıyor.” Bu hafta tekrar görüşülemez.'; G_().cool['n' + pid] = 1; return s; }
    if (o.wage < d.wage) d.wage = r100(d.wage - (d.wage - o.wage) * (sc > .9 ? .45 : .2));
    if (o.bonus < d.bonus) d.bonus = r10k(d.bonus - (d.bonus - o.bonus) * .3);
    s.msg = sc > .93 ? `Menajer: “Çok yaklaştık. Haftalık ${FM.money(d.wage)} ve ${FM.money(d.bonus)} imza parası olursa imzalarız.”` : sc > .8 ? `Menajer: “Biraz daha iyileştirmeniz gerek. En az ${FM.money(d.wage)} haftalık bekliyoruz.”` : 'Menajer bu teklifi küçümsedi: “Ciddi bir teklif bekliyoruz.”';
    return s;
  }
  const negCan = pid => !G_().cool['n' + pid];

  /* ================= İzleme listesi ve scout görevi ================= */
  function toggleWatch(pid) { const G = G_(), i = G.watch.indexOf(pid); if (i >= 0) G.watch.splice(i, 1); else { G.watch.push(pid); G.watchT[pid] = P(pid).tid; } FM.save(); return i < 0; }
  const scoutQ = () => (G_().staff ? G_().staff.scout : 0) + lvOf('scoutnet');
  function scoutTask(pos, maxAge, minPot) {
    const G = G_(); if (G.stask) return { ok: false, msg: 'Scout ekibi zaten bir görevde.' };
    if (G.fin.balance < 50000) return { ok: false, msg: 'Bütçe yetersiz.' };
    G.fin.balance -= 50000; G.stask = { pos, maxAge, minPot, w: 2 }; FM.save();
    return { ok: true, msg: 'Scout ekibi yola çıktı. Rapor 2 hafta içinde gelir.' };
  }
  function scoutReport() {
    const G = G_(), t = G.stask, q = scoutQ();
    const pool = FM.marketList().filter(p => (t.pos === 'ALL' || p.pos === t.pos) && p.age <= t.maxAge && p.pot >= t.minPot - Math.max(0, 6 - q));
    const found = pool.sort((a, b) => (b.pot + R() * Math.max(2, 12 - q * 1.5)) - (a.pot + R() * Math.max(2, 12 - q * 1.5))).slice(0, 2 + Math.floor(q / 2) + (G.fproj.done.scoutnet ? 1 : 0));
    found.forEach(p => { p.sc = 1; });
    G.stask = null;
    const posTr = t.pos === 'ALL' ? 'her mevkiden' : FM.POS_LONG[t.pos].toLocaleLowerCase('tr');
    FM.mail({ cat: 'SCOUT', from: 'Baş scout', pid: found[0] ? found[0].id : undefined, title: `Scout görevi tamamlandı: ${found.length} oyuncu`,
      body: `Aradığın profil (${posTr}, en fazla ${t.maxAge} yaşında, potansiyeli ${t.minPot}+) için bulduklarımız: ${found.map(p => `${p.name} (${p.age} yaş, ${p.tid == null ? 'serbest' : T(p.tid).name}, güç ${p.ovr}, potansiyel ${p.pot})`).join('; ') || 'uygun oyuncu bulamadık'}. Hepsinin tam raporu artık açık.` });
  }

  /* ================= Antrenman takvimi ================= */
  const schedCount = k => G_().sched.filter(x => x === k).length;
  function setDay(i, k) {
    const G = G_(); G.sched[i] = k;
    const c = schedCount, load = c('phy') + c('tec') * .6 + c('tac') * .5 + c('prep') * .4 + c('sp') * .4 - c('rest');
    G.training.intensity = load < 1.4 ? 0 : load < 3 ? 1 : 2; FM.save();
  }

  /* ================= Bireysel hedef ve mentörlük ================= */
  const focusSlots = () => 2 + Math.min(6, lvOf('training'));
  const mentorSlots = () => 1 + Math.floor(Math.min(6, lvOf('tcoach')) / 2);
  const focused = () => squad().filter(p => p.tf);
  function setFocus(pid, attr) {
    const p = P(pid); if (!p) return { ok: false, msg: 'Oyuncu bulunamadı.' };
    if (!p.tf && focused().length >= focusSlots()) return { ok: false, msg: `Bireysel hedef kontenjanı dolu (${focusSlots()}). Antrenman merkezi seviyesi kontenjanı artırır.` };
    if ((p.pos === 'GK') !== (attr === 'gk')) return { ok: false, msg: p.pos === 'GK' ? 'Kaleciler için yalnızca kalecilik çalışılabilir.' : 'Kalecilik yalnızca kalecilere verilebilir.' };
    p.tf = attr; p.tfBase = p.a[attr]; p.tfW = 0; FM.save();
    return { ok: true, msg: `${p.name}: bireysel hedef ${ATTR[attr].toLocaleLowerCase('tr')}.` };
  }
  function clearFocus(pid) { const p = P(pid); if (p) { delete p.tf; delete p.tfBase; delete p.tfW; FM.save(); } }
  const mentorBoost = m => { const pr = per(m); return pr === 'pro' || pr === 'leader' ? .25 : pr === 'temper' ? .05 : .15; };
  function addMentor(mid, yid) {
    const G = G_(), m = P(mid), y = P(yid);
    if (!m || !y || m === y) return { ok: false, msg: 'Geçerli bir eşleşme seç.' };
    if (G.mentors.length >= mentorSlots()) return { ok: false, msg: `Mentörlük kontenjanı dolu (${mentorSlots()}). Teknik ekip binası seviyesi kontenjanı artırır.` };
    if (G.mentors.some(x => x.m === mid || x.y === yid)) return { ok: false, msg: 'Bu oyunculardan biri zaten bir eşleşmede.' };
    if (m.age < 27 || y.age > 21) return { ok: false, msg: 'Mentor en az 27, öğrenci en fazla 21 yaşında olmalı.' };
    G.mentors.push({ m: mid, y: yid, w: 0 }); y.mor = clamp(y.mor + 4, 20, 100); FM.save();
    return { ok: true, msg: `${m.name}, ${y.name} için mentor oldu.` };
  }
  function delMentor(i) { G_().mentors.splice(i, 1); FM.save(); }

  /* ================= Kariyer geçmişi ve efsaneler ================= */
  function clubApps(p) { const G = G_(); return (p.hist || []).filter(h => h.tid === G.teamId).reduce((a, h) => ({ apps: a.apps + h.apps, g: a.g + h.g }), { apps: 0, g: 0 }); }
  function legend(p) {
    const G = G_(), c = clubApps(p); if (c.apps < 40) return;
    const e = G.museum.leg.find(x => x.id === p.id), rec = { id: p.id, name: p.name, pos: p.pos, apps: c.apps, g: c.g, team: me().name };
    if (e) Object.assign(e, rec); else { G.museum.leg.push(rec); FM.unlock('legend'); FM.news(`${p.name} kulüp efsaneleri arasına girdi (${c.apps} maç).`, 'good', { pid: p.id }); }
  }
  function history() {
    const G = G_();
    for (const id in G.players) {
      const p = G.players[id]; if (!p.apps || p.tid == null) continue;
      (p.hist = p.hist || []).push({ s: G.season, tid: p.tid, apps: p.apps, g: p.g, as: p.as, avg: Math.round(p.rs / Math.max(1, p.rn) * 100) / 100 });
      if (p.tid === G.teamId) legend(p);
    }
  }

  /* ================= Tesisler, projeler, yurt dışı akademi ================= */
  function upgradeFac(k) { if (lvOf(k) >= 5) return { ok: false, msg: 'En üst seviyede.' }; return FM.upgrade(k); }
  function startProj(k) {
    const G = G_(), t = me(), pj = FACS[k].proj;
    if (t.fac[k] < 5) return { ok: false, msg: 'Önce tesisi 5. seviyeye çıkar.' };
    if (G.fproj.done[k]) return { ok: false, msg: 'Bu proje zaten tamamlandı.' };
    if (G.fproj.cur) return { ok: false, msg: 'Aynı anda yalnızca bir uzun vadeli proje yürütülebilir.' };
    if (G.fin.balance < pj[2]) return { ok: false, msg: 'Bütçe yetersiz.' };
    G.fin.balance -= pj[2]; G.fproj.cur = { k, w: PROJ_WEEKS }; FM.news(`${pj[0]} projesi başladı (${PROJ_WEEKS} hafta).`, 'club'); FM.save();
    return { ok: true, msg: `${pj[0]} başladı. ${PROJ_WEEKS} hafta sürecek.` };
  }
  function buildAbroad() {
    const G = G_(), t = me(); if (t.fac.abroad) return { ok: false, msg: 'Zaten kurulu.' };
    if (G.fin.balance < ABROAD.cost) return { ok: false, msg: 'Bütçe yetersiz.' };
    G.fin.balance -= ABROAD.cost; t.fac.abroad = 1; abroadIntake(); FM.news('Yurt dışı akademi kuruldu; ilk iki yetenek altyapıya katıldı.', 'good'); FM.save();
    return { ok: true, msg: 'Yurt dışı akademi kuruldu.' };
  }
  function abroadIntake() {
    const G = G_(), n0 = G.youth.length; FM.genYouth(2);
    for (const id of G.youth.slice(n0)) { const p = P(id); p.pot = clamp(p.pot + 6, p.ovr, 95); FM.refresh(p); p.abroad = 1; p.yb = 1; }
  }

  /* ================= Stadyum, kombine, sponsorlar, formalar ================= */
  const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const SEAT_PATS = { solid: 'Düz', mix: 'Karışık', stripe: 'Çizgili', check: 'Dama', grad: 'Geçişli', letter: 'Baş harf' };
  function seatAt(pat, u, v, lower) {
    switch (pat) {
      case 'solid': return 0;
      case 'stripe': return Math.floor(v * 8) % 2;
      case 'check': return (Math.floor(u * 60) + Math.floor(v * 8)) % 2;
      case 'grad': return v > .66 ? 1 : v > .33 ? (Math.floor(u * 200) % 2) : 0;
      case 'letter': { const x = (u * 40) % 1; return (x > .25 && x < .4 && v > .2 && v < .8) || (v > .2 && v < .35 && x > .25 && x < .75) ? 1 : 0; }
      default: { const h = Math.sin(u * 912.7 + v * 77.3 + (lower ? 3 : 0)) * 43758.5; const f = h - Math.floor(h); return f < .62 ? 0 : f < .86 ? 1 : 2; }
    }
  }
  function seatFn() { const s = G_().seats, c = [hexRgb(s.c1), hexRgb(s.c2), [214, 218, 224]]; return (u, v, lower) => c[seatAt(s.pat, u, v, lower)]; }
  function stEst(stp) {
    const G = G_(), t = me(), cap = FM.stadiumCap(t), s = stp == null ? G.fin.stp : stp;
    const per = G.fin.ticket * .75 * s, sold = Math.round(cap * clamp(.18 + G.fans / 100 * .5 - (s - 1) * .45, .03, .75) * (t.div ? .6 : 1));
    return { per, total: per * 11, sold, rev: Math.round(sold * per * 11) };
  }
  const BRANDS = ['Kervan Enerji', 'Mavi Liman Sigorta', 'Anka Telekom', 'Yıldırım Kargo', 'Göktürk Hava Yolları', 'Demirkol Yapı', 'Çınar Bankası', 'Lale Gıda', 'Poyraz Otomotiv', 'Ada Turizm'];
  function genOffers() {
    const G = G_(), t = me(), rep = t.rep - t.div * 2 + 2, used = new Set(), mk = () => { let b; do b = pick(BRANDS); while (used.has(b)); used.add(b); return b; };
    G.offersS = { s: G.season,
      shirt: [0, 1, 2].map(i => ({ brand: mk(), years: ri(1, 4), amt: r10k((rep * 600000 + 300000) * (.8 + R() * .5) * (1 - i * .05)) })),
      name: [0, 1, 2].map(() => ({ brand: mk(), years: ri(3, 10), amt: r10k((rep * 450000 + 200000) * (.8 + R() * .5)) })) };
  }
  const dealOn = d => d && d.s1 >= G_().season;
  function accept(kind, i) {
    const G = G_(), o = G.offersS[kind][i]; if (!o) return { ok: false, msg: 'Teklif bulunamadı.' };
    G[kind === 'shirt' ? 'shirt' : 'naming'] = { ...o, s1: G.season + o.years - 1 };
    FM.news(`${kind === 'shirt' ? 'Forma sponsoru' : 'Stat adı sponsoru'}: ${o.brand} ile ${o.years} sezonluk anlaşma (yılda ${FM.money(o.amt)}).`, 'good', { cat: 'MALİYE' });
    FM.save(); return { ok: true, msg: `${o.brand} ile anlaşıldı.` };
  }
  function askBoard() {
    const G = G_(); if (G.fin.req === G.season) return { ok: false, msg: 'Bu sezon yönetimden zaten bütçe istedin.' };
    G.fin.req = G.season;
    if (R() < G.board / 110) { const amt = r10k((me().rep + 1) * 650000 * (me().div ? .5 : 1)); G.fin.balance += amt; G.board = clamp(G.board - 4, 0, 100); FM.news(`Yönetim ${FM.money(amt)} ek bütçe ayırdı.`, 'good', { cat: 'MALİYE' }); FM.save(); return { ok: true, msg: `Yönetim ${FM.money(amt)} ek bütçe verdi (yönetim güveni −4).` }; }
    G.board = clamp(G.board - 3, 0, 100); FM.save();
    return { ok: false, msg: 'Yönetim talebini reddetti: “Önce sonuç görmek istiyoruz.” (yönetim güveni −3)' };
  }
  const money = (kind, amt) => { const t = G_().fin.tot; if (t) t[kind] = (t[kind] || 0) + amt; };

  /* ================= Kancalar ================= */
  function endWeek() {
    const G = G_(), t = me(), sq = squad(), tot = G.fin.tot, l = G.fin.last;
    // gelir-gider toplamları
    if (l && tot) { tot.tickets += l.tickets || 0; tot.sponsor += l.sponsor || 0; tot.wages += l.wages || 0; tot.staff += l.staff || 0; }
    // forma ve stat adı sponsorları (haftalık)
    const sp = ((dealOn(G.shirt) ? G.shirt.amt : 0) + (dealOn(G.naming) ? G.naming.amt : 0)) / FM.WEEK_COUNT;
    if (sp) { G.fin.balance += sp; if (tot) tot.deals += sp; if (l) { l.deals = sp; l.net += sp; } }
    // kombine satışı ilk haftanın sonunda kapanır
    if (G.week === 1 && G.fin.stS !== G.season) { const e = stEst(); G.fin.stS = G.season; G.fin.stSold = e.sold; G.fin.balance += e.rev; if (tot) tot.season += e.rev; FM.news(`Kombine satışı kapandı: ${e.sold.toLocaleString('tr-TR')} kombine, gelir ${FM.money(e.rev)}.`, 'club', { cat: 'MALİYE' }); }
    // kişilikler: sinirli ve mutsuz oyuncular ortamı bozar, neşeliler yükseltir; lider kaptan uyumu artırır
    const tempers = sq.filter(p => per(p) === 'temper' && p.mor < 45).length, jokers = sq.filter(p => per(p) === 'joker').length;
    for (const p of sq) p.mor = clamp(p.mor - tempers * .5 + Math.min(2, jokers * .4), 20, 100);
    const cap = t.cap != null ? P(t.cap) : null; if (cap && per(cap) === 'leader') t.chem = clamp((t.chem || 60) + .6, 20, 100);
    // antrenman takvimi
    const rest = schedCount('rest'), tac = schedCount('tac');
    for (const p of sq) { p.mor = clamp(p.mor + rest, 20, 100); p.fit = clamp(p.fit + rest * 3 + 24 * eff('training') * .5, 0, 100); }
    G.fam = clamp(G.fam + tac * 5 - 4, 0, 100);
    G.prep = schedCount('prep') + schedCount('sp') * .5;
    // sağlık merkezi: sakatlık süresi
    for (const p of sq) if (p.inj > 1 && R() < Math.max(0, eff('med')) * .8) p.inj--;
    // gözlem ağı: her hafta birkaç oyuncu tanınır
    const n = Math.max(0, lvOf('scoutnet') - 1) + (G.fproj.done.scoutnet ? 2 : 0), pool = FM.marketList().filter(p => !p.sc);
    for (let i = 0; i < n && pool.length; i++) pool.splice((R() * pool.length) | 0, 1)[0].sc = 1;
    // bireysel hedef ve mentörlük
    for (const p of Object.values(G.players)) if (p.tf && p.tid !== G.teamId) { delete p.tf; delete p.tfBase; delete p.tfW; } else if (p.tf) p.tfW = (p.tfW || 0) + 1;
    G.mentors = G.mentors.filter(x => {
      const m = P(x.m), y = P(x.y);
      if (!m || !y || m.tid !== G.teamId || y.tid !== G.teamId) { FM.news('Bir mentörlük eşleşmesi oyunculardan biri ayrıldığı için sona erdi.', 'info'); return false; }
      if (y.age > 22) { FM.news(`${y.name} artık genç sayılmıyor; ${m.name} ile mentörlük tamamlandı.`, 'good'); return false; }
      x.w++; y.mor = clamp(y.mor + (m.mor - y.mor) * .1, 20, 100);
      if (x.w === 16 && (per(m) === 'pro' || per(m) === 'leader') && per(y) !== per(m) && R() < .5) {
        y.per = per(m); FM.unlock('mentor');
        FM.news(`${y.name}, mentoru ${m.name} ile geçirdiği 16 haftanın ardından onun gibi ${PER[y.per][0].toLocaleLowerCase('tr')} bir oyuncuya dönüştü.`, 'good', { pid: y.id, title: `${y.name}, mentorundan çok şey öğrendi` });
      }
      return true;
    });
    // izleme listesi
    for (const pid of G.watch.slice()) {
      const p = P(pid); if (!p) { G.watch = G.watch.filter(x => x !== pid); continue; }
      if (G.watchT[pid] !== p.tid && p.tid !== G.teamId) { FM.mail({ cat: 'SCOUT', from: 'Baş scout', pid, title: `İzlediğin ${p.name} transfer oldu`, body: `İzleme listendeki ${p.name} ${p.tid == null ? 'serbest kaldı' : T(p.tid).name + ' kulübüne geçti'}.` }); G.watchT[pid] = p.tid; }
      else if (p.tid != null && p.con <= 1 && p.wn !== G.season && G.week >= 8) { p.wn = G.season; FM.mail({ cat: 'SCOUT', from: 'Baş scout', pid, title: `İzlediğin ${p.name}: sözleşmesi bitiyor`, body: `İzleme listendeki ${p.name} sözleşmesinin son sezonunda. Kulübü ${T(p.tid).name} onu daha uygun bir bedelle bırakabilir.` }); }
    }
    if (G.stask && --G.stask.w <= 0) scoutReport();
    // uzun vadeli proje
    const pr = G.fproj.cur;
    if (pr && --pr.w <= 0) { G.fproj.done[pr.k] = G.season; t.fac[pr.k] = 6; G.fproj.cur = null; FM.news(`${FACS[pr.k].proj[0]} tamamlandı! ${FACS[pr.k].n} artık dünya standartlarında.`, 'good', { cat: 'KULÜP' }); }
    // basın toplantıları: süresi dolanlar ve sıradaki maç
    if (FM.Press) FM.Press.week();
  }
  function userMatch(m, us, d) {
    const G = G_(), played = new Set(m.s[us].played), key = G.season * 100 + G.week;
    // sağlık merkezi: sakatlık riski (maçta sakatlanan oyuncunun darbesi hafif çıkabilir)
    for (const p of squad()) if (p.inj && played.has(p.id) && p.injK !== key) { p.injK = key; if (R() < Math.max(0, eff('med')) * .8) { p.inj = 0; p.injT = null; FM.news(`Sağlık ekibi müdahale etti: ${p.name}'in darbesi hafif çıktı, sakatlık yok.`, 'good', { pid: p.id }); } }
    G.prep = 0;
    if (FM.Banners) FM.Banners.afterMatch(m, us, d);
    if (FM.Press) FM.Press.post(m, us);
  }
  function seasonEnd() { history(); }
  function newSeason() {
    const G = G_(), t = me();
    // teknik ekip binası: tecrübelilerin yaşla düşüşünü yavaşlatır
    for (const p of squad()) if (p.age >= 30 && R() < Math.max(0, eff('tcoach')) * 1.5) { const k = pick(p.pos === 'GK' ? ['gk', 'phy'] : ['pac', 'phy']); p.a[k] = Math.min(97, p.a[k] + 1); FM.refresh(p); }
    // altyapı akademisi kalitesi
    const bonus = Math.round(eff('youth') * 20); for (const id of G.youth) { const p = P(id); if (p && !p.yb) { p.yb = 1; p.pot = clamp(p.pot + bonus, p.ovr, 95); FM.refresh(p); } }
    if (t.fac.abroad) abroadIntake();
    G.fin.tot = { tickets: 0, season: 0, sponsor: 0, deals: 0, wages: 0, staff: 0, trIn: 0, trOut: 0, prize: 0 };
    G.prep = 0; genOffers();
  }
  const youthExtra = () => (lvOf('youth') >= 5 ? lvOf('youth') - 4 : 0);
  function retire(p) { if (p.tid === G_().teamId) legend(p); }
  function transfer(kind, p, amt) { if (FM.Press) FM.Press.transfer(kind, p, amt); }

  FM.Career = {
    ensure, newGame: () => {}, endWeek, userMatch, seasonEnd, newSeason, retire, transfer, money, sideMod, trainMult, youthExtra,
    PER, per, groups, demand, negStart, negOffer, negCan, NEG,
    toggleWatch, scoutTask, scoutQ, SESS, DAYS, setDay, schedCount, ATTR, focusSlots, mentorSlots, focused, setFocus, clearFocus, addMentor, delMentor, mentorBoost,
    clubApps, FACS, ABROAD, PROJ_WEEKS, lvOf, eff, effAt, upgradeFac, startProj, buildAbroad,
    SEAT_PATS, seatAt, stEst, accept, dealOn, askBoard, defaultKits
  };
  FM.Club = { seatFn: () => (G_() && G_().seats ? seatFn() : null) };
})();
