/* Saha Kenarı — kulüp yönetimi: tesisler (kampüs haritası, seviyeler, etkiler, uzun vadeli projeler, yurt dışı akademi),
   stadyum (koltuk deseni, bilet ve kombine fiyatı, stat adı sponsoru, büyütme), forma tasarımı ve forma sponsoru,
   maliye ve müze. Kulüp sayfası alt sekmelere ayrılır. */
(function () {
  const UI = FM.ui, { U, $, esc, toast, render, me, gauge, acts, VIEWS } = UI, C = FM.Career;
  const { clamp, ri, pick } = FM.util, R = Math.random, money = FM.money, G_ = () => FM.G;
  const r10k = v => Math.round(v / 10000) * 10000;
  const say = r => toast(r.msg, r.ok ? 'good' : 'bad');

  /* ================= Tesis tanımları ================= */
  /* Etki: ortalama kulübe (3. seviye) göre fark, seviye başına %10. Proje tamamlanınca seviye 6 sayılır. */
  const FACS = {
    training: { n: 'Antrenman merkezi', ic: 'training', d: 'Sahalar: maçlar arasında kondisyonun dönüşü ve forma giymeyenlerin antrenmanla gelişimi.', fx: [['Toparlanma', 1], ['Oynamayanın gelişimi', 1]], base: 2000000,
      proj: ['Entegre antrenman sahaları', 'Sahalar ve toparlanma tek yapıda: toparlanma ve oynamayanların gelişimi bir kademe daha artar.', 4000000] },
    coach: { n: 'Teknik ekip binası', ic: 'staff', d: 'Antrenör ofisleri ve analiz odaları: gençlerin gelişimi ve tecrübeli oyuncuların yaşla düşüşü.', fx: [['Gençlerin gelişimi', 1], ['Tecrübelinin düşüşü', -1]], base: 1800000,
      proj: ['Teknik gelişim merkezi', 'Video analiz ve bireysel antrenman laboratuvarı: gençler daha hızlı gelişir, tecrübeliler daha geç düşer.', 9000000] },
    med: { n: 'Sağlık merkezi', ic: 'med', d: 'Fizyoterapi ve tıbbi tarama: sakatlık riski ve sakatlıktan dönüş süresi.', fx: [['Sakatlık riski', -1], ['Sakatlık süresi', -1]], base: 1600000,
      proj: ['Spor sağlığı ve rehabilitasyon merkezi', 'Kriyoterapi, hidroterapi ve tarama ünitesi: sakatlıklar daha az ve daha kısa.', 7000000] },
    scout: { n: 'Gözlem ağı', ic: 'scout', d: 'Bölge ofisleri ve veri ekibi: pazardaki oyuncuları tanıma ve scout raporlarının zenginliği.', fx: [['Oyuncu tanıma', 1], ['Rapor zenginliği', 1]], base: 1200000,
      proj: ['Bölgesel gözlem ağı', 'Her bölgede kalıcı gözlemciler: her hafta daha çok oyuncu tanınır, raporlar daha çok aday getirir.', 2000000] },
    youth: { n: 'Altyapı akademisi', ic: 'squad', d: 'Akademi sahası, yurt ve okul: gelen gençlerin kalitesi ve sayısı.', fx: [['Gençlerin kalitesi', 1], ['Gelen genç sayısı', 1]], base: 1500000,
      proj: ['Akademi eğitim kampüsü', 'Okul ve yatılı kampüs: altyapıya daha kaliteli ve daha çok genç gelir.', 4000000] }
  };
  const ABROAD = { n: 'Yurt dışı akademi', ic: 'globe', d: 'Başka bir ülkede ortak akademi: her alım gününe 2 yabancı yetenek ekler.', cost: 6000000 };
  const PROJ_WEEKS = 22;
  const lvOf = k => { const t = me(); return t.fac[k] || 1; };
  const eff = k => (lvOf(k) - 3) * .1;   // %: -0.2 … +0.3
  const pct = v => (v > 0 ? '+' : v < 0 ? '−' : '±') + '%' + Math.abs(Math.round(v * 100));

  function ensure() {
    const G = G_(); if (!G) return;
    const t = me(), base = clamp(Math.round(t.rep / 2) + 1, 1, 4);
    for (const k of ['coach', 'med', 'scout']) if (t.fac[k] == null) t.fac[k] = base;
    if (t.fac.abroad == null) t.fac.abroad = 0;
    if (!G.fproj) G.fproj = { cur: null, done: {} };
    if (!G.seats) G.seats = { pat: 'mix', c1: t.c1, c2: t.c2 };
    if (!G.kits) G.kits = [{ pat: 'solid', c1: t.c1, c2: t.c2 }, { pat: 'solid', c1: t.c2, c2: t.c1 }, { pat: 'sash', c1: '#1b2433', c2: t.c1 }];
    if (G.fin.stp == null) G.fin.stp = 1;
    if (!G.offersS) G.offersS = { s: 0, shirt: [], name: [] };
    if (G.offersS.s !== G.season) genOffers();
  }
  for (const k of ['coach', 'med', 'scout']) FM.FAC[k] = { name: FACS[k].n, base: FACS[k].base };
  FM.FAC.training.name = FACS.training.n; FM.FAC.youth.name = FACS.youth.n;

  /* ---- Etkilerin oyuna bağlanması: kariyer kancalarını sar ---- */
  const wrap = (k, f) => { const o = C[k]; C[k] = (...a) => f(o, ...a); };
  wrap('ensure', (o, ...a) => { o(...a); ensure(); });
  wrap('trainMult', (o, p) => {
    let k = o(p); const t = me();
    if (p.age <= 21) k *= 1 + eff('coach');
    if (!t.lineup.includes(p.id)) k *= 1 + eff('training');
    return k;
  });
  wrap('endWeek', (o) => {
    const G = G_(), t = me(), sq = t.players.map(FM.P);
    for (const p of sq) p.fit = clamp(p.fit + 24 * eff('training') * .5, 0, 100);
    for (const p of sq) if (p.inj > 1 && R() < Math.max(0, eff('med')) * 1.2) p.inj--;
    // gözlem ağı: her hafta birkaç oyuncu tanınır
    const n = Math.max(0, lvOf('scout') - 1) + (G.fproj.done.scout ? 2 : 0), pool = FM.marketList().filter(p => !p.sc);
    for (let i = 0; i < n && pool.length; i++) pool.splice((R() * pool.length) | 0, 1)[0].sc = 1;
    // uzun vadeli proje
    const pr = G.fproj.cur;
    if (pr && --pr.w <= 0) { G.fproj.done[pr.k] = G.season; t.fac[pr.k] = 6; G.fproj.cur = null; FM.news(`${FACS[pr.k].proj[0]} tamamlandı! ${FACS[pr.k].n} artık dünya standartlarında.`, 'good'); FM.Inbox.make('projDone', { k: pr.k }); }
    // sponsor gelirleri ve kombine satışı
    const sp = ((G.shirt && G.shirt.s1 >= G.season ? G.shirt.amt : 0) + (G.naming && G.naming.s1 >= G.season ? G.naming.amt : 0)) / FM.WEEK_COUNT;
    if (sp) { G.fin.balance += sp; if (G.fin.tot) G.fin.tot.sponsor += sp; if (G.fin.last) { G.fin.last.spx = sp; G.fin.last.net += sp; } }
    if (G.week === 1 && G.fin.stS !== G.season) { const e = stEst(); G.fin.stS = G.season; G.fin.stSold = e.sold; G.fin.balance += e.rev; if (G.fin.tot) G.fin.tot.tickets += e.rev; FM.news(`Kombine satışı kapandı: ${e.sold.toLocaleString('tr-TR')} kombine, gelir ${money(e.rev)}.`, 'club'); }
    o();
  });
  wrap('userMatch', (o, m, us, d) => {
    const G = G_(), known = new Set(G.injKnown || []), played = new Set(m.s[us].played);
    for (const p of me().players.map(FM.P)) if (p.inj && played.has(p.id) && !known.has(p.id) && R() < Math.max(0, eff('med')) * 1.4) { p.inj = 0; FM.news(`Sağlık ekibi müdahale etti: ${p.name}'in darbesi hafif çıktı, sakatlık yok.`, 'good'); }
    o(m, us, d);
  });
  wrap('newSeason', (o) => {
    o();
    const t = me();
    // teknik ekip binası: tecrübelilerin yaşla düşüşünü yavaşlatır
    for (const p of t.players.map(FM.P)) if (p.age >= 30 && R() < Math.max(0, eff('coach')) * 2.5) { const k = pick(p.pos === 'GK' ? ['gk', 'phy'] : ['pac', 'phy']); p.a[k] = Math.min(97, p.a[k] + 1); FM.refresh(p); }
    if (t.fac.abroad) abroadIntake();
    ensure();
  });
  wrap('intake', (o, silent) => {
    const made = o(silent), t = me(), bonus = Math.round(eff('youth') * 20);
    for (const p of made) { p.pot = clamp(p.pot + bonus, p.ovr, 95); FM.refresh(p); }
    const extra = lvOf('youth') >= 5 ? (lvOf('youth') - 4) : 0;
    for (let i = 0; i < extra; i++) made.push(youngster(0));
    return made;
  });
  function youngster(potB) {
    const G = G_(), t = me(), pos = FM.util.wpick(['GK', 'DEF', 'MID', 'FWD'], x => (x === 'GK' ? 1 : 3));
    const p = FM.genPlayer(pos, ri(36, 44) + t.fac.youth * 3, ri(15, 17));
    p.pot = clamp(p.ovr + ri(16, 30) + potB + Math.round(eff('youth') * 20), p.ovr, 95); FM.refresh(p);
    p.youth = true; p.sc = 1; p.con = 0; p.wage = 300; p.mor = 75; G.youth.push(p.id);
    return p;
  }
  function abroadIntake() { const ps = [youngster(6), youngster(6)]; FM.news(`Yurt dışı akademiden ${ps.map(p => p.name).join(' ve ')} altyapıya katıldı.`, 'good'); }

  /* ---- Geliştirme, proje, yurt dışı akademi ---- */
  function upgrade(k) { const t = me(); if (t.fac[k] >= 5) return { ok: false, msg: 'En üst seviyede.' }; return FM.upgrade(k); }
  function startProj(k) {
    const G = G_(), t = me(), P_ = FACS[k].proj;
    if (t.fac[k] < 5) return { ok: false, msg: 'Önce tesisi 5. seviyeye çıkar.' };
    if (G.fproj.done[k]) return { ok: false, msg: 'Bu proje zaten tamamlandı.' };
    if (G.fproj.cur) return { ok: false, msg: 'Aynı anda yalnızca bir uzun vadeli proje yürütülebilir.' };
    if (G.fin.balance < P_[2]) return { ok: false, msg: 'Bütçe yetersiz.' };
    G.fin.balance -= P_[2]; G.fproj.cur = { k, w: PROJ_WEEKS, s: G.season }; FM.news(`${P_[0]} projesi başladı (${PROJ_WEEKS} hafta).`, 'club'); FM.save();
    return { ok: true, msg: `${P_[0]} başladı. ${PROJ_WEEKS} hafta sürecek.` };
  }
  function buildAbroad() {
    const G = G_(), t = me(); if (t.fac.abroad) return { ok: false, msg: 'Zaten kurulu.' };
    if (G.fin.balance < ABROAD.cost) return { ok: false, msg: 'Bütçe yetersiz.' };
    G.fin.balance -= ABROAD.cost; t.fac.abroad = 1; FM.news('Yurt dışı akademi kuruldu.', 'good'); abroadIntake(); FM.save();
    return { ok: true, msg: 'Yurt dışı akademi kuruldu; ilk iki yetenek altyapıya katıldı.' };
  }

  /* ================= Stadyum: koltuk deseni, bilet, kombine, stat adı ================= */
  const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const SEAT_PATS = { solid: 'Düz', mix: 'Karışık', stripe: 'Çizgili', check: 'Dama', grad: 'Geçişli', letter: 'Baş harf' };
  function seatAt(pat, u, v, lower) {   // u: 0..1 tribün boyunca, v: 0..1 aşağıdan yukarı → 0 ana, 1 ikinci, 2 beyaz
    switch (pat) {
      case 'solid': return 0;
      case 'stripe': return Math.floor(v * 8) % 2;
      case 'check': return (Math.floor(u * 60) + Math.floor(v * 8)) % 2;
      case 'grad': return v > .66 ? 1 : v > .33 ? (Math.floor(u * 200) % 2) : 0;
      case 'letter': { const x = (u * 40) % 1, y = v; return (x > .25 && x < .4 && y > .2 && y < .8) || (y > .2 && y < .35 && x > .25 && x < .75) ? 1 : 0; }
      default: { const h = Math.sin(u * 912.7 + v * 77.3 + (lower ? 3 : 0)) * 43758.5; const f = h - Math.floor(h); return f < .62 ? 0 : f < .86 ? 1 : 2; }
    }
  }
  function seatFn() { const s = G_().seats, c = [hexRgb(s.c1), hexRgb(s.c2), [214, 218, 224]]; return (u, v, lower) => c[seatAt(s.pat, u, v, lower)]; }
  function seatPreview(s) {
    const c = [s.c1, s.c2, '#d6dae0']; let out = '';
    for (let b = 0; b < 4; b++) for (let r = 0; r < 14; r++) {
      const v = 1 - r / 13, y = 14 + r * 13, sk = (13 - r) * 3.2, x0 = 10 + b * 240 + (b < 2 ? sk : 0), x1 = 10 + b * 240 + 226 - (b > 1 ? sk : 0), n = 11;
      for (let i = 0; i < n; i++) { const u = (b * n + i) / (4 * n); out += `<rect x="${(x0 + (x1 - x0) * i / n).toFixed(1)}" y="${y}" width="${((x1 - x0) / n - 3).toFixed(1)}" height="8" rx="2" fill="${c[seatAt(s.pat, u, v, false)]}"/>`; }
    }
    return `<svg viewBox="0 0 970 200" class="seats" role="img" aria-label="Koltuk deseni önizlemesi">${out}</svg>`;
  }
  const price = () => (15 - me().div * 4) * (G_().fin.tp || 1);
  function gateEst(tp) {
    const G = G_(), t = me(), cap = FM.stadiumCap(t), pos = FM.table().findIndex(r => r.id === G.teamId) + 1;
    const att = Math.min(cap, Math.round(cap * clamp(.32 + G.fans / 100 * .5 + (12 - pos) * .012 + .03, .25, 1) * clamp(1.3 - tp * .3, .45, 1.12)));
    const hold = G.fin.stS === G.season ? G.fin.stSold || 0 : stEst().sold;
    return { cap, att, occ: att / cap, rev: Math.round(Math.max(0, att - hold) * (15 - t.div * 4) * tp), price: (15 - t.div * 4) * tp };
  }
  function stEst(stp) {
    const G = G_(), t = me(), cap = FM.stadiumCap(t), s = stp == null ? G.fin.stp : stp;
    const per = (15 - t.div * 4) * (G.fin.tp || 1) * .75 * s, sold = Math.round(cap * clamp(.18 + G.fans / 100 * .5 - (s - 1) * .45, .03, .75) * (t.div ? .6 : 1));
    return { per, total: per * 11, sold, rev: Math.round(sold * per * 11) };
  }
  const BRANDS = ['Kervan Enerji', 'Mavi Liman Sigorta', 'Anka Telekom', 'Yıldırım Kargo', 'Göktürk Hava Yolları', 'Demirkol Yapı', 'Çınar Bankası', 'Lale Gıda', 'Poyraz Otomotiv', 'Ada Turizm'];
  function genOffers() {
    const G = G_(), t = me(), rep = t.rep - t.div * 2 + 2, mk = (mult, used) => { let b; do b = pick(BRANDS); while (used.has(b)); used.add(b); return b; };
    const used = new Set();
    G.offersS = { s: G.season,
      shirt: [0, 1, 2].map(i => ({ brand: mk(1, used), years: ri(1, 4), amt: r10k((rep * 600000 + 300000) * (.8 + R() * .5) * (1 - i * .05)) })),
      name: [0, 1, 2].map(i => ({ brand: mk(1, used), years: ri(3, 10), amt: r10k((rep * 450000 + 200000) * (.8 + R() * .5)) })) };
  }
  const logo = (b, w) => { const h = [...b].reduce((a, c) => a + c.charCodeAt(0), 0), col = ['#c62839', '#12355b', '#2e8b57', '#f4a020', '#6a4c93', '#1c7c8c'][h % 6]; return `<span class="brand" style="--b:${col}"><i>${esc(b.split(' ')[0][0])}</i>${esc(b.split(' ')[0])}${w ? `<small>${esc(b.split(' ').slice(1).join(' '))}</small>` : ''}</span>`; };

  /* ================= Forma ================= */
  const KIT_PATS = { solid: 'Düz', stripes: 'Dikey çizgili', hoops: 'Yatay çizgili', halves: 'Yarım', sash: 'Çapraz şerit', sleeves: 'Renkli kollar' };
  function shirt(k, sponsor, w) {
    const id = 'kp' + Math.random().toString(36).slice(2, 7), c1 = k.c1, c2 = k.c2, body = 'M60 20 L90 8 Q110 22 130 8 L160 20 L198 58 L172 84 L156 70 L156 196 L64 196 L64 70 L48 84 L22 58 Z';
    const pat = { solid: '', stripes: [0, 1, 2, 3, 4].map(i => `<rect x="${70 + i * 18}" y="0" width="9" height="200" fill="${c2}"/>`).join(''), hoops: [0, 1, 2, 3, 4, 5].map(i => `<rect x="0" y="${40 + i * 28}" width="220" height="13" fill="${c2}"/>`).join(''),
      halves: `<rect x="110" y="0" width="110" height="200" fill="${c2}"/>`, sash: `<path d="M40 40 L80 20 L200 180 L160 200Z" fill="${c2}"/>`, sleeves: `<path d="M22 58 L60 20 L64 70 L48 84Z M198 58 L160 20 L156 70 L172 84Z" fill="${c2}"/>` }[k.pat] || '';
    const ink = (parseInt(c1.slice(1, 3), 16) * .3 + parseInt(c1.slice(3, 5), 16) * .59 + parseInt(c1.slice(5, 7), 16) * .11) > 150 ? '#14202f' : '#ffffff';
    return `<svg viewBox="0 0 220 210" width="${w || 160}" class="shirt" role="img" aria-label="Forma"><defs><clipPath id="${id}"><path d="${body}"/></clipPath></defs>
      <path d="${body}" fill="${c1}"/><g clip-path="url(#${id})">${pat}</g><path d="M90 8 Q110 30 130 8" fill="none" stroke="${c2}" stroke-width="6"/><path d="${body}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="3"/>
      ${sponsor ? `<text x="110" y="120" text-anchor="middle" font-family="Barlow Condensed, sans-serif" font-weight="800" font-size="22" fill="${ink}">${esc(sponsor.split(' ')[0].toLocaleUpperCase('tr'))}</text>` : ''}</svg>`;
  }

  /* ================= Kampüs haritası (SVG, eğik izdüşüm) ================= */
  const SW = 1000, SH = 470;
  const kY = y => .72 + .28 * (y / 60);
  const pr = (x, y, z) => [SW / 2 + (x - 50) * kY(y) * 9.6, 34 + y * 6.7 + y * y * .012 - (z || 0) * kY(y) * 5];
  const poly = (pts, fill, extra) => `<polygon points="${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="${fill}" ${extra || ''}/>`;
  const quad = (x, y, w, d, z) => [pr(x, y, z), pr(x + w, y, z), pr(x + w, y + d, z), pr(x, y + d, z)];
  function box(x, y, w, d, h, top, front, side) {
    return poly([pr(x, y + d, 0), pr(x + w, y + d, 0), pr(x + w, y + d, h), pr(x, y + d, h)], front) + (x + w < 50 ? poly([pr(x + w, y, 0), pr(x + w, y + d, 0), pr(x + w, y + d, h), pr(x + w, y, h)], side) : x > 50 ? poly([pr(x, y, 0), pr(x, y + d, 0), pr(x, y + d, h), pr(x, y, h)], side) : '') + poly(quad(x, y, w, d, h), top);
  }
  function pitch(x, y, w, d) {
    let s = poly(quad(x, y, w, d), '#3f9a52');
    for (let i = 0; i < 6; i += 2) s += poly(quad(x + w * i / 6, y, w / 6, d), '#4aa85d');
    const L = (a, b) => { const p = pr(...a), q = pr(...b); return `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}"/>`; };
    s += `<g stroke="rgba(255,255,255,.75)" stroke-width="1.2">${L([x + .6, y + .6], [x + w - .6, y + .6])}${L([x + w - .6, y + .6], [x + w - .6, y + d - .6])}${L([x + w - .6, y + d - .6], [x + .6, y + d - .6])}${L([x + .6, y + d - .6], [x + .6, y + .6])}${L([x + w / 2, y + .6], [x + w / 2, y + d - .6])}${L([x + .6, y + d * .3], [x + w * .16, y + d * .3])}${L([x + w * .16, y + d * .3], [x + w * .16, y + d * .7])}${L([x + w * .16, y + d * .7], [x + .6, y + d * .7])}${L([x + w - .6, y + d * .3], [x + w * .84, y + d * .3])}${L([x + w * .84, y + d * .3], [x + w * .84, y + d * .7])}${L([x + w * .84, y + d * .7], [x + w - .6, y + d * .7])}</g>`;
    const c = pr(x + w / 2, y + d / 2); s += `<ellipse cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" rx="${(w * .1 * kY(y) * 9.6).toFixed(1)}" ry="${(d * .17 * 6.7).toFixed(1)}" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="1.2"/>`;
    return s;
  }
  function campus() {
    const t = me(), lv = k => t.fac[k] || 1, G = G_(), rnd = (() => { let a = t.id * 97 + 7; return () => { a = (a * 9301 + 49297) % 233280; return a / 233280; }; })();
    const pos = {};
    let s = `<svg viewBox="0 0 ${SW} ${SH}" class="campus-svg" role="img" aria-label="Tesis kampüsü haritası">`;
    s += poly([pr(-2, -2), pr(102, -2), pr(102, 62), pr(-2, 62)], '#5d8f3f') + poly([pr(-2, 62), pr(102, 62), pr(102, 62, -3), pr(-2, 62, -3)], '#3a5a2a');
    // yollar
    s += poly(quad(46, 0, 5, 62), '#a9aea5') + poly(quad(2, 41, 96, 3), '#a9aea5') + poly(quad(20, 0, 2, 41), '#b8bcb3') + poly(quad(76, 0, 2, 41), '#b8bcb3');
    // antrenman sahaları
    const nP = Math.min(8, 1 + lv('training') + (G.fproj.done.training ? 1 : 0)), slots = [[3, 3], [24, 3], [54, 3], [79, 3], [3, 16], [24, 16], [54, 16], [79, 16]];
    for (let i = 0; i < nP; i++) s += pitch(slots[i][0], slots[i][1], 17, 11);
    for (let i = nP; i < 8; i++) s += poly(quad(slots[i][0], slots[i][1], 17, 11), '#6f9b4c');
    pos.training = pr(32, 14);
    // kapalı salon (antrenman 4+)
    if (lv('training') >= 4) { s += box(78, 29, 19, 10, 6, '#c9ced6', '#8b929c', '#a3a9b2'); const p = pr(87.5, 33.5, 6); s += `<text x="${p[0]}" y="${p[1]}" text-anchor="middle" font-size="11" font-weight="800" fill="${t.c1}">${esc(t.short)}</text>`; }
    // ana bina: teknik ekip
    const hC = 3 + lv('coach') * 1.2; s += box(41, 30, 15, 9, hC, '#d7dbe0', '#9aa1ab', '#b4bac2') + box(43, 31, 4, 3, hC + .6, '#c3c9d0', '#8e959f', '#a6acb5');
    { const f = pr(54, 31, hC + 4); s += `<line x1="${f[0]}" y1="${f[1]}" x2="${f[0]}" y2="${f[1] + 22}" stroke="#555" stroke-width="1.5"/><rect x="${f[0]}" y="${f[1]}" width="12" height="8" fill="${t.c1}"/>`; }
    pos.coach = pr(48.5, 30, hC + 2);
    // sağlık merkezi
    const hM = 2 + lv('med'); s += box(58, 31, 11, 8, hM, '#e3e6ea', '#a0a7b0', '#bcc2c9'); { const c = pr(63.5, 35, hM); s += `<rect x="${c[0] - 5}" y="${c[1] - 2}" width="10" height="4" fill="#d33"/><rect x="${c[0] - 2}" y="${c[1] - 5}" width="4" height="10" fill="#d33"/>`; }
    pos.med = pr(63.5, 40.5);
    // gözlem ağı ofisi
    const hS = 2 + lv('scout') * .8; s += box(28, 31, 11, 8, hS, '#d0d4da', '#969da7', '#b0b6be');
    for (let i = 0; i < Math.min(5, lv('scout')); i++) { const d = pr(29.5 + i * 2, 32, hS + 1.5); s += `<circle cx="${d[0]}" cy="${d[1]}" r="3.2" fill="#e8ecf0" stroke="#777"/>`; }
    pos.scout = pr(33.5, 40.5);
    // altyapı akademisi: tribünlü saha
    s += pitch(8, 47, 26, 12);
    const st = lv('youth'), sc = [t.c1, t.c2, '#e9e3d5'];
    for (let r = 0; r < Math.min(st, 5); r++) { const y0 = 45.6 - r * .9; s += poly([pr(8, y0, r * .8), pr(34, y0, r * .8), pr(34, y0 + .9, r * .8 + .6), pr(8, y0 + .9, r * .8 + .6)], sc[r % 2], 'opacity=".9"'); }
    if (st >= 3) for (let r = 0; r < st - 2; r++) s += poly([pr(35 + r, 47), pr(36 + r, 47), pr(36 + r, 59, 1 + r), pr(35 + r, 59, 1 + r)], sc[r % 2]);
    pos.youth = pr(21, 52);
    // otopark
    if (lv('coach') + lv('med') >= 5) for (let r = 0; r < 3; r++) for (let i = 0; i < 18; i++) { const p = pr(56 + i * 2.2, 47 + r * 3); s += `<rect x="${p[0] - 4}" y="${p[1] - 2}" width="8" height="4" rx="1" fill="${['#e9ecef', '#c62839', '#22303f', '#f4a020', '#9aa3ad'][(i * 7 + r * 3) % 5]}"/>`; }
    // yurt dışı akademi
    if (t.fac.abroad) { s += box(86, 52, 10, 7, 4, '#f0e6d0', '#b5a888', '#cbbfa2'); const f = pr(95, 52, 9); s += `<line x1="${f[0]}" y1="${f[1]}" x2="${f[0]}" y2="${f[1] + 18}" stroke="#555"/><rect x="${f[0]}" y="${f[1]}" width="11" height="7" fill="#58c4dd"/>`; pos.abroad = pr(91, 55, 4); }
    else pos.abroad = pr(91, 55);
    // ağaçlar ve oyuncular
    for (let i = 0; i < 60; i++) { const edge = i % 4, x = edge < 2 ? rnd() * 100 : edge === 2 ? -1 : 101, y = edge === 0 ? -1 : edge === 1 ? 61 : rnd() * 60, p = pr(x, y); s += `<circle cx="${p[0].toFixed(1)}" cy="${(p[1] - 4).toFixed(1)}" r="${(4 * kY(y)).toFixed(1)}" fill="${i % 3 ? '#2f6b34' : '#3e7d3b'}"/>`; }
    for (let i = 0; i < nP * 6; i++) { const sl = slots[i % nP], p = pr(sl[0] + 2 + rnd() * 13, sl[1] + 2 + rnd() * 7); s += `<rect x="${(p[0] - 1).toFixed(1)}" y="${(p[1] - 4).toFixed(1)}" width="2.2" height="4" fill="${i % 3 ? t.c1 : '#f3efe4'}"/>`; }
    s += '</svg>';
    return { svg: s, pos };
  }

  /* ================= Kulüp sayfası: alt sekmeler ================= */
  const TABS = [['fac', 'Tesisler'], ['stadium', 'Stadyum'], ['kit', 'Forma ve sponsor'], ['fin', 'Maliye'], ['museum', 'Müze ve kayıt']];
  UI.clubView = parts => {
    ensure();
    const tab = U.clubTab || 'fac', ex = UI.clubExtra ? UI.clubExtra() : {};
    const nav = `<nav class="subtabs" aria-label="Kulüp bölümleri">${TABS.map(([k, n]) => `<button data-a="club-tab" data-v="${k}" class="${tab === k ? 'on' : ''}" ${tab === k ? 'aria-current="page"' : ''}>${n}</button>`).join('')}</nav>`;
    const t = me(), head = `<header class="club-h">${FM.crest(t, 44)}<div><h2>${esc(t.name)}</h2><p class="muted">${FM.DIV_TR[t.div]} · ${esc(t.stadium)}</p></div></header>`;
    let body;
    if (tab === 'fac') body = facView() + (ex.staff || '');
    else if (tab === 'stadium') body = stadiumView(parts);
    else if (tab === 'kit') body = kitView();
    else if (tab === 'fin') body = `<div class="grid2">${parts.fin}${ex.fin || ''}</div>${parts.board}`;
    else body = parts.museum + (ex.extra || '') + parts.save;
    return nav + head + body;
  };
  acts['club-tab'] = d => { U.clubTab = d.v; render(true); };

  /* ---- Tesisler ---- */
  function facView() {
    const G = G_(), t = me(), sel = U.facSel || 'training', zoom = U.facZoom || 'all', { svg, pos } = campus();
    const bars = (l, k) => `<span class="lvb">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= Math.min(5, l) ? 'on' : ''}"></i>`).join('')}${l >= 6 ? '<i class="star" title="Uzun vadeli proje tamamlandı">★</i>' : ''}<b>${Math.min(5, l)}/5</b></span>`;
    const keys = Object.keys(FACS), pr_ = G.fproj.cur;
    const sp0 = pos[sel] || pos.training, sc0 = zoom === 'near' ? 2.3 : zoom === 'far' ? 1.45 : 1, ox = sp0[0] / SW * 100, oy = sp0[1] / SH * 100;
    const labels = keys.concat(t.fac.abroad ? ['abroad'] : []).map(k => { const p = pos[k], lx = ox + (p[0] / SW * 100 - ox) * sc0, ly = oy + (p[1] / SH * 100 - oy) * sc0; if (lx < 3 || lx > 97 || ly < 8 || ly > 100) return ''; return `<button class="cp-l ${sel === k ? 'on' : ''}" data-a="fac-sel" data-v="${k}" style="left:${lx}%;top:${ly}%">${k === 'abroad' ? ABROAD.n : FACS[k].n}${k === 'abroad' ? '' : ` <b>${Math.min(5, t.fac[k])}</b>`}</button>`; }).join('');
    const sp = pos[sel] || pos.training, sc = zoom === 'near' ? 2.3 : zoom === 'far' ? 1.45 : 1;
    const map = `<section class="card campus"><div class="cp-zoom seg">${[['near', 'Yakın'], ['far', 'Uzak'], ['all', 'Tümü']].map(([k, n]) => `<button data-a="fac-zoom" data-v="${k}" class="${zoom === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="cp-view"><div class="cp-in" style="transform-origin:${sp[0] / SW * 100}% ${sp[1] / SH * 100}%;transform:scale(${sc})">${svg}</div><div class="cp-labels">${labels}</div></div></section>`;
    const row = k => { const f = FACS[k], l = t.fac[k], st = pr_ && pr_.k === k ? `Proje sürüyor · ${pr_.w} hafta` : l >= 6 ? 'Proje tamamlandı' : l >= 5 ? 'En üst seviye' : `Geliştir · ${money(FM.facCost(k))}`;
      return `<tr class="${sel === k ? 'on' : ''}" data-a="fac-sel" data-v="${k}" tabindex="0"><td class="l"><span class="fi">${FM.icon(f.ic)}</span>${f.n}</td><td>${bars(l)}</td><td class="l fxs-c">${f.fx.map(([n, sg]) => `<span>${n} <b class="${sg * eff(k) >= 0 ? 'pos-v' : 'neg-v'}">${pct(sg * eff(k))}</b></span>`).join('')}</td><td class="l st-c">${st}</td></tr>`; };
    const table = `<section class="card"><p class="ib-lbl">Tesisler</p><div class="scroll"><table class="tbl facs-t"><thead><tr><th class="l">Tesis</th><th class="l">Seviye</th><th class="l">Etkileri</th><th class="l">Durum</th></tr></thead><tbody>${keys.map(row).join('')}
        <tr class="${sel === 'abroad' ? 'on' : ''}" data-a="fac-sel" data-v="abroad" tabindex="0"><td class="l"><span class="fi">${FM.icon('globe')}</span>${ABROAD.n}</td><td class="l" colspan="2">${t.fac.abroad ? 'Kurulu · her alım gününe 2 yabancı yetenek' : 'Kurulmadı'}</td><td class="l">${t.fac.abroad ? 'Aktif' : 'Kur · ' + money(ABROAD.cost)}</td></tr></tbody></table></div>
      <p class="ib-lbl">Uzun vadeli projeler</p><p class="muted">Tesis 5. seviyeye ulaşınca her tesis için bir uzun vadeli proje açılır; aynı anda yalnızca biri yürütülür. Proje ${PROJ_WEEKS} hafta sürer, bedeli bir kez ödenir; bittiğinde tesis bir kademe daha güçlenir.</p>
      <div class="scroll"><table class="tbl"><thead><tr><th class="l">Proje</th><th class="l">Durum</th><th class="r">Bedel</th></tr></thead><tbody>${keys.map(k => `<tr class="${sel === k ? 'on' : ''}" data-a="fac-sel" data-v="${k}" tabindex="0"><td class="l"><span class="fi">${FM.icon(FACS[k].ic)}</span>${FACS[k].proj[0]}</td><td class="l">${G.fproj.done[k] ? 'Tamamlandı' : pr_ && pr_.k === k ? `Sürüyor · ${pr_.w} hafta kaldı` : t.fac[k] >= 5 ? (pr_ ? 'Sırada' : 'Açık') : 'Kilitli · 5. seviye gerekli'}</td><td class="r">${money(FACS[k].proj[2])}</td></tr>`).join('')}</tbody></table></div></section>`;
    const pn = U.facPanel || 'fac', ptabs = `<div class="seg fp-tabs">${[['fac', FACS[sel] ? FACS[sel].n.split(' ')[0] : 'Tesis'], ['focus', 'Bireysel hedef'], ['mentor', 'Mentörlük']].map(([k, n]) => `<button data-a="fac-panel" data-v="${k}" class="${pn === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;
    return `<div class="fac-grid"><div class="fac-main">${map}${table}</div><aside class="card fac-side">${ptabs}${pn === 'focus' ? focusPanel() : pn === 'mentor' ? mentorPanel() : facDetail(sel)}</aside></div>`;
  }
  function facDetail(k) {
    const G = G_(), t = me();
    if (k === 'abroad') return `<h3>${FM.icon('globe')} ${ABROAD.n}</h3><p class="muted">${ABROAD.d}</p>${t.fac.abroad ? '<p class="ht-res">Kurulu. Her sezon başındaki alım gününe 2 yabancı yetenek ekler; potansiyelleri yüksektir.</p>' : `<p>Kuruluş bedeli <b>${money(ABROAD.cost)}</b>.</p><button class="btn primary" data-a="fac-abroad">Akademiyi kur</button>`}`;
    const f = FACS[k], l = t.fac[k], cur = (l - 3) * .1, nxt = Math.min(5, l + 1), pr_ = G.fproj.cur;
    const rows = f.fx.map(([n, sg]) => `<tr><td class="l">${n}</td><td class="r"><b>${pct(sg * cur)}</b></td><td class="r">${l >= 5 ? (l >= 6 ? '—' : `<span class="muted">proje: ${pct(sg * .3)}</span>`) : pct(sg * (nxt - 3) * .1)}</td></tr>`).join('');
    let act;
    if (l < 5) act = `<button class="btn primary" data-a="fac-up" data-v="${k}">${l + 1}. seviyeye geliştir · ${money(FM.facCost(k))}</button>`;
    else if (G.fproj.done[k]) act = `<p class="ht-res">${f.proj[0]} tamamlandı. Tesis dünya standartlarında.</p>`;
    else if (pr_ && pr_.k === k) act = `<div class="proj-bar"><span>${f.proj[0]}</span><i style="--p:${(1 - pr_.w / PROJ_WEEKS) * 100}%"></i><small>${pr_.w} hafta kaldı</small></div>`;
    else act = `<h4>Uzun vadeli proje</h4><p><b>${f.proj[0]}</b></p><p class="muted">${f.proj[1]}</p><p class="muted">Bedel ${money(f.proj[2])} · ${PROJ_WEEKS} hafta${pr_ ? ` · Şu an ${FACS[pr_.k].proj[0]} sürüyor.` : ''}</p><button class="btn primary" data-a="fac-proj" data-v="${k}" ${pr_ ? 'disabled' : ''}>Projeyi başlat</button>`;
    return `<h3><span class="fi">${FM.icon(f.ic)}</span> ${f.n}</h3><span class="lvb big">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= Math.min(5, l) ? 'on' : ''}"></i>`).join('')}${l >= 6 ? '<i class="star">★</i>' : ''}<b>${Math.min(5, l)}/5</b></span>
      <p class="muted">${f.d}</p><table class="tbl"><thead><tr><th class="l">Etki</th><th class="r">Şimdi</th><th class="r">${l >= 5 ? 'Sonra' : 'Sonraki seviye'}</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="hint">Ortalama kulübe (3. seviye) göre fark. Riskte, sürede ve düşüşte eksi daha iyi demek.</p>${act}`;
  }
  Object.assign(acts, {
    'fac-sel': d => { U.facSel = d.v; if ((U.facZoom || 'all') === 'all') U.facZoom = 'all'; render(true); },
    'fac-zoom': d => { U.facZoom = d.v; render(true); },
    'fac-up': d => { say(upgrade(d.v)); render(true); },
    'fac-proj': d => { say(startProj(d.v)); render(true); },
    'fac-abroad': () => { say(buildAbroad()); render(true); }
  });

  /* ---- Stadyum ---- */
  function stadiumView(parts) {
    const G = G_(), t = me(), s = U.seatDraft || G.seats, tp = U.tpDraft != null ? U.tpDraft : G.fin.tp, stp = U.stpDraft != null ? U.stpDraft : G.fin.stp;
    const g = gateEst(tp), st = stEst(stp), closed = G.fin.stS === G.season, nm = G.naming && G.naming.s1 >= G.season ? G.naming : null;
    const seats = `<section class="card"><p class="ib-lbl">Koltuk deseni</p>${seatPreview(s)}
      <div class="row"><label class="sp" for="seatPat"><span>Desen</span><select id="seatPat" data-a="seat-pat">${Object.keys(SEAT_PATS).map(k => `<option value="${k}" ${s.pat === k ? 'selected' : ''}>${SEAT_PATS[k]}</option>`).join('')}</select></label>
      <label class="clr"><input type="color" value="${s.c1}" data-a="seat-c" data-k="c1"> Ana renk</label><label class="clr"><input type="color" value="${s.c2}" data-a="seat-c" data-k="c2"> İkinci renk</label><button class="btn" data-a="seat-club">Kulüp renkleri</button></div>
      <div class="row"><button class="btn primary" data-a="seat-apply" ${U.seatDraft ? '' : 'disabled'}>Uygula</button><span class="muted">${U.seatDraft ? 'Uygulanmamış değişiklik var.' : 'Desen 3D stadyumda boş koltuklarda görünür.'}</span></div></section>`;
    const tick = `<section class="card"><p class="ib-lbl">Bilet fiyatı</p><p class="muted">Ligin ortalama rakibine karşı tahmin</p>
      <div class="big-sl"><b>₺${(Math.round(g.price * 10) / 10).toLocaleString('tr-TR')}</b><input type="range" min=".6" max="1.8" step=".05" value="${tp}" data-a="tp-draft" aria-label="Bilet fiyatı"></div>
      <div class="kpis sm"><div><span>Doluluk</span><b>%${Math.round(g.occ * 100)}</b></div><div><span>Seyirci</span><b>${g.att.toLocaleString('tr-TR')}</b></div><div><span>Maç başı hasılat</span><b class="pos-v">${money(g.rev)}</b></div><div><span>Kapasite</span><b>${g.cap.toLocaleString('tr-TR')}</b></div></div>
      <div class="row"><button class="btn primary" data-a="tp-apply" ${U.tpDraft != null && U.tpDraft !== G.fin.tp ? '' : 'disabled'}>Fiyatı uygula</button><span class="muted">${U.tpDraft != null && U.tpDraft !== G.fin.tp ? 'Uygulanmamış değişiklik' : 'Değişiklik yok'}${tp > 1.25 ? ' · yüksek fiyat taraftarı kızdırır' : tp < .85 ? ' · düşük fiyat taraftarı memnun eder' : ''}</span></div></section>`;
    const comb = `<section class="card"><p class="ib-lbl">Kombine bilet</p><p class="muted">${closed ? `Satış kapandı: ${(G.fin.stSold || 0).toLocaleString('tr-TR')} kombine satıldı. Kombine sahipleri iç saha lig maçlarına bilet almadan gelir.` : 'Satış sezonun ilk haftası sonunda kapanır. Kombine iç saha lig maçlarını kapsar; maç başına bilet fiyatından %25 indirimlidir.'}</p>
      <div class="big-sl"><b>₺${Math.round(st.total).toLocaleString('tr-TR')}</b><input type="range" min=".5" max="1.6" step=".05" value="${stp}" data-a="stp-draft" ${closed ? 'disabled' : ''} aria-label="Kombine fiyatı"></div>
      <div class="kpis sm"><div><span>Maç başına</span><b>₺${(Math.round(st.per * 10) / 10).toLocaleString('tr-TR')}</b></div><div><span>Tahmini kombine</span><b>${(closed ? G.fin.stSold : st.sold).toLocaleString('tr-TR')}</b></div><div><span>Kombine geliri</span><b class="pos-v">${money(closed ? Math.round((G.fin.stSold || 0) * st.per * 11) : st.rev)}</b></div></div>
      ${closed ? '' : `<div class="row"><button class="btn primary" data-a="stp-apply" ${U.stpDraft != null && U.stpDraft !== G.fin.stp ? '' : 'disabled'}>Fiyatı uygula</button><span class="muted">${U.stpDraft != null && U.stpDraft !== G.fin.stp ? 'Uygulanmamış değişiklik' : 'Değişiklik yok'}</span></div>`}</section>`;
    const naming = `<section class="card"><p class="ib-lbl">Stat adı sponsoru</p>${nm ? `<div class="sponsor-cur">${logo(nm.brand, true)}<p>${esc(nm.brand)}: ${nm.years} sezon, yılda ${money(nm.amt)} · ${nm.s1}. sezona kadar</p></div>` : `<p class="muted">Bir marka stadının adına ortak olmak istiyor. Gelir sezon boyunca haftalık olarak kasaya girer.</p><ul class="offers">${G.offersS.name.map((o, i) => `<li>${logo(o.brand, true)}<span>${o.years} sezon · yılda <b>${money(o.amt)}</b></span><button class="btn" data-a="name-acc" data-i="${i}">Anlaş</button></li>`).join('')}</ul>`}
      <label class="sp" for="stName"><span>Stadyum adı</span><span class="row"><input id="stName" type="text" maxlength="28" value="${esc(t.stadium)}"><button class="btn" data-a="st-rename">Değiştir</button></span></label></section>`;
    const B = FM.Banners, md = B ? B.mood(t) : null, sty = B ? B.STYLE[B.styleOf(t)] : null;
    const tribune = B ? `<section class="card"><p class="ib-lbl">Taraftar tribünü</p><p><b>${sty.n}</b> · en sevdikleri: ${Object.keys(sty.w).slice(0, 3).map(k => B.CAT_TR[k].toLocaleLowerCase('tr')).join(', ')}</p>
      ${md.protest >= 2 ? '<p class="ht-res bad-res">Tribünler protesto modunda: iç saha maçlarında “YÖNETİM İSTİFA!” pankartları açılıyor. Her protesto yönetim güvenini düşürür; sonuçlar ve taraftar desteği düzelince sona erer.</p>' : md.protest === 1 ? '<p class="muted">Tribünlerde huzursuzluk başladı; tek tük protesto pankartları görülüyor.</p>' : md.title ? '<p class="muted">Şampiyonluk yarışı tribünleri coşturuyor.</p>' : md.drop ? '<p class="muted">Küme düşme hattında: tribünler “zor gün dostu” pankartlarıyla takımın arkasında.</p>' : '<p class="muted">Tribünler takımın arkasında.</p>'}</section>` : '';
    return `<div class="grid2"><div class="col">${seats}${parts.stadium}</div><div class="col">${tick}${comb}${naming}${tribune}</div></div>
      <section class="card"><div class="row" style="justify-content:space-between"><div><h2>Stadyumu büyüt</h2><p class="muted">Seviye ${t.fac.stadium}/5 · kapasite ve stadyum kademesi artar.</p></div><button class="btn primary" data-a="upgrade" data-v="stadium" ${t.fac.stadium >= 5 ? 'disabled' : ''}>${t.fac.stadium >= 5 ? 'En üst seviye' : 'Büyüt · ' + money(FM.facCost('stadium'))}</button></div></section>`;
  }
  Object.assign(acts, {
    'seat-pat': (d, el) => { U.seatDraft = { ...(U.seatDraft || G_().seats), pat: el.value }; render(true); },
    'seat-c': (d, el) => { U.seatDraft = { ...(U.seatDraft || G_().seats), [d.k]: el.value }; render(true); },
    'seat-club': () => { U.seatDraft = { ...(U.seatDraft || G_().seats), c1: me().c1, c2: me().c2 }; render(true); },
    'seat-apply': () => { G_().seats = U.seatDraft; U.seatDraft = null; FM.save(); toast('Koltuk deseni uygulandı.', 'good'); render(true); },
    'tp-draft': (d, el) => { U.tpDraft = +el.value; render(true); },
    'tp-apply': () => { C.setTicket(U.tpDraft); U.tpDraft = null; toast('Bilet fiyatı güncellendi.', 'good'); render(true); },
    'stp-draft': (d, el) => { U.stpDraft = +el.value; render(true); },
    'stp-apply': () => { G_().fin.stp = U.stpDraft; U.stpDraft = null; FM.save(); toast('Kombine fiyatı güncellendi.', 'good'); render(true); },
    'name-acc': d => { const G = G_(), o = G.offersS.name[+d.i]; G.naming = { ...o, s1: G.season + o.years - 1 }; FM.news(`Stat adı sponsorluğu: ${o.brand} ile ${o.years} sezonluk anlaşma.`, 'good'); FM.save(); toast(`${o.brand} ile anlaşıldı.`, 'good'); render(true); },
    'st-rename': () => { const v = $('stName').value.trim(); if (!v) return; me().stadium = v; FM.save(); toast('Stadyum adı değişti.', 'good'); render(true); }
  });

  /* ---- Forma ve sponsor ---- */
  function kitView() {
    const G = G_(), ks = U.kitDraft || G.kits, sh = G.shirt && G.shirt.s1 >= G.season ? G.shirt : null, sp = sh ? sh.brand : null;
    const kit = (k, i) => `<div class="kit-card"><p class="ib-lbl">${['İç saha', 'Deplasman', 'Üçüncü'][i]}</p>${shirt(k, sp, 150)}
      <label class="sp"><span>Desen</span><select data-a="kit-pat" data-i="${i}">${Object.keys(KIT_PATS).map(p => `<option value="${p}" ${k.pat === p ? 'selected' : ''}>${KIT_PATS[p]}</option>`).join('')}</select></label>
      <div class="row"><label class="clr"><input type="color" value="${k.c1}" data-a="kit-c" data-i="${i}" data-k="c1"> Ana</label><label class="clr"><input type="color" value="${k.c2}" data-a="kit-c" data-i="${i}" data-k="c2"> İkinci</label></div></div>`;
    const kits = `<section class="card"><h2>Formalar</h2><div class="kits">${ks.map(kit).join('')}</div>
      <div class="row"><button class="btn primary" data-a="kit-apply" ${U.kitDraft ? '' : 'disabled'}>Uygula</button><button class="btn" data-a="kit-reset">Kulüp renklerine dön</button><span class="muted">${U.kitDraft ? 'Uygulanmamış değişiklik var.' : 'Formalar maç öncesi ekranında ve maçta kullanılır.'}</span></div></section>`;
    const spn = `<section class="card"><h2>Forma sponsoru</h2>${sh ? `<div class="sponsor-cur">${logo(sh.brand, true)}<p>${esc(sh.brand)}: ${sh.years} sezon, yılda ${money(sh.amt)} · ${sh.s1}. sezona kadar</p></div>` : `<p class="muted">Formanın göğsü için teklifler. Gelir sezon boyunca haftalık olarak kasaya girer; kulübün başarısı ve ünü teklifleri büyütür.</p><ul class="offers">${G.offersS.shirt.map((o, i) => `<li>${logo(o.brand, true)}<span>${o.years} sezon · yılda <b>${money(o.amt)}</b></span><button class="btn" data-a="shirt-acc" data-i="${i}">Anlaş</button></li>`).join('')}</ul>`}</section>`;
    return kits + spn;
  }
  Object.assign(acts, {
    'kit-pat': (d, el) => { const k = (U.kitDraft || G_().kits).map(x => ({ ...x })); k[+d.i].pat = el.value; U.kitDraft = k; render(true); },
    'kit-c': (d, el) => { const k = (U.kitDraft || G_().kits).map(x => ({ ...x })); k[+d.i][d.k] = el.value; U.kitDraft = k; render(true); },
    'kit-apply': () => { G_().kits = U.kitDraft; U.kitDraft = null; FM.save(); toast('Formalar güncellendi.', 'good'); render(true); },
    'kit-reset': () => { const t = me(); U.kitDraft = [{ pat: 'solid', c1: t.c1, c2: t.c2 }, { pat: 'solid', c1: t.c2, c2: t.c1 }, { pat: 'sash', c1: '#1b2433', c2: t.c1 }]; render(true); },
    'shirt-acc': d => { const G = G_(), o = G.offersS.shirt[+d.i]; G.shirt = { ...o, s1: G.season + o.years - 1 }; FM.news(`Forma sponsoru: ${o.brand} ile ${o.years} sezonluk anlaşma.`, 'good'); FM.save(); toast(`${o.brand} formada!`, 'good'); render(true); }
  });

  /* ================= Bireysel hedef ve mentörlük ================= */
  const ATTR = { pac: 'Hız', sho: 'Şut', pas: 'Pas', def: 'Savunma', phy: 'Fizik', gk: 'Kalecilik' };
  const focusSlots = () => 2 + Math.min(6, lvOf('training'));                 // antrenman merkezi seviyesine bağlı
  const mentorSlots = () => 1 + Math.floor(Math.min(6, lvOf('coach')) / 2);  // teknik ekip binası seviyesine bağlı
  const squad = () => me().players.map(FM.P).filter(p => !p.loan || p.loan.own !== G_().teamId);
  const focused = () => squad().filter(p => p.tf);
  function setFocus(pid, attr) {
    const p = FM.P(pid); if (!p) return { ok: false, msg: 'Oyuncu bulunamadı.' };
    if (!p.tf && focused().length >= focusSlots()) return { ok: false, msg: `Bireysel hedef kontenjanı dolu (${focusSlots()}). Antrenman merkezi seviyesi kontenjanı artırır.` };
    if ((p.pos === 'GK') !== (attr === 'gk')) return { ok: false, msg: p.pos === 'GK' ? 'Kaleciler için yalnızca kalecilik çalışılabilir.' : 'Kalecilik yalnızca kalecilere verilebilir.' };
    p.tf = attr; p.tfBase = p.a[attr]; p.tfW = 0; FM.save();
    return { ok: true, msg: `${p.name}: bireysel hedef ${ATTR[attr].toLocaleLowerCase('tr')}.` };
  }
  function clearFocus(pid) { const p = FM.P(pid); if (p) { delete p.tf; delete p.tfBase; delete p.tfW; FM.save(); } }
  function addMentor(mid, yid) {
    const G = G_(), m = FM.P(mid), y = FM.P(yid);
    if (!m || !y || m === y) return { ok: false, msg: 'Geçerli bir eşleşme seç.' };
    if (G.mentors.length >= mentorSlots()) return { ok: false, msg: `Mentörlük kontenjanı dolu (${mentorSlots()}). Teknik ekip binası seviyesi kontenjanı artırır.` };
    if (G.mentors.some(x => x.m === mid || x.y === yid)) return { ok: false, msg: 'Bu oyunculardan biri zaten bir eşleşmede.' };
    if (m.age < 27 || y.age > 21) return { ok: false, msg: 'Mentor en az 27, öğrenci en fazla 21 yaşında olmalı.' };
    G.mentors.push({ m: mid, y: yid, w: 0 }); y.mor = clamp(y.mor + 4, 20, 100); FM.save();
    return { ok: true, msg: `${m.name}, ${y.name}'e mentorluk yapacak.` };
  }
  function delMentor(i) { G_().mentors.splice(i, 1); FM.save(); }
  const mentorBoost = m => { const pr = C.per(m); return pr === 'pro' || pr === 'leader' ? .25 : pr === 'temper' ? .05 : .15; };
  wrap('ensure', (o, ...a) => { o(...a); const G = G_(); if (G && !G.mentors) G.mentors = []; });
  wrap('trainMult', (o, p) => {
    let k = o(p); const G = G_(), pair = G.mentors && G.mentors.find(x => x.y === p.id), m = pair && FM.P(pair.m);
    if (m) k *= 1 + mentorBoost(m);
    if (p.tf) k *= 1.1;
    return k;
  });
  wrap('endWeek', o => {
    const G = G_(), tid = G.teamId;
    for (const p of Object.values(G.players)) if (p.tf && p.tid !== tid) { delete p.tf; delete p.tfBase; delete p.tfW; } else if (p.tf) p.tfW = (p.tfW || 0) + 1;
    G.mentors = (G.mentors || []).filter(x => {
      const m = FM.P(x.m), y = FM.P(x.y);
      if (!m || !y || m.tid !== tid || y.tid !== tid) { FM.news('Bir mentörlük eşleşmesi oyunculardan biri ayrıldığı için sona erdi.', 'info'); return false; }
      if (y.age > 22) { FM.news(`${y.name} artık genç sayılmıyor; ${m.name} ile mentörlük tamamlandı.`, 'good'); return false; }
      x.w++; y.mor = clamp(y.mor + (m.mor - y.mor) * .1, 20, 100);
      if (x.w === 16 && (C.per(m) === 'pro' || C.per(m) === 'leader') && C.per(y) !== C.per(m) && R() < .5) {
        y.per = C.per(m); FM.Inbox.make('mentorDone', { m: m.id, y: y.id });
      }
      return true;
    });
    o();
  });
  function focusPanel() {
    const sq = squad().sort((a, b) => a.age - b.age), fs = focused(), free = sq.filter(p => !p.tf);
    return `<h3>Bireysel hedef</h3><p class="muted">Seçtiğin özellik bu oyuncunun antrenmanında öncelikli çalışılır (gelişimin yaklaşık %60'ı o özelliğe gider, gelişim hızı +%10). Kontenjan: <b>${fs.length}/${focusSlots()}</b> · antrenman merkezi seviyesiyle artar.</p>
      ${fs.length ? `<ul class="fp-list">${fs.map(p => `<li><span><button class="lnk" data-a="player" data-id="${p.id}">${esc(p.name)}</button><small>${p.age} yaş · ${FM.POS_TR[p.pos]} · ${p.tfW || 0} haftadır</small></span><span class="fp-v">${ATTR[p.tf]} <b>${p.a[p.tf]}</b>${p.a[p.tf] > p.tfBase ? ` <em class="pos-v">+${p.a[p.tf] - p.tfBase}</em>` : ''}</span><button class="btn icon" data-a="tf-del" data-id="${p.id}" aria-label="${esc(p.name)} hedefini kaldır">×</button></li>`).join('')}</ul>` : '<p class="muted">Henüz bireysel hedef verilmedi.</p>'}
      ${fs.length < focusSlots() ? `<div class="fp-form"><label class="sp"><span>Oyuncu</span><select id="tfP">${free.map(p => `<option value="${p.id}">${esc(p.name)} · ${p.age} · ${FM.POS_TR[p.pos]} · ${p.ovr}/${p.pot}</option>`).join('')}</select></label>
        <label class="sp"><span>Özellik</span><select id="tfA">${Object.keys(ATTR).map(k => `<option value="${k}">${ATTR[k]}</option>`).join('')}</select></label><button class="btn primary" data-a="tf-add">Hedef ver</button></div>` : ''}`;
  }
  function mentorPanel() {
    const G = G_(), sq = squad(), olds = sq.filter(p => p.age >= 27).sort((a, b) => b.age - a.age), kids = sq.filter(p => p.age <= 21).sort((a, b) => a.age - b.age), busy = new Set(G.mentors.flatMap(x => [x.m, x.y]));
    return `<h3>Mentörlük</h3><p class="muted">Tecrübeli bir oyuncu bir genci yanına alır: genç daha hızlı gelişir, morali mentorununkine yaklaşır. Profesyonel ya da lider bir mentor en büyük etkiyi yapar ve 16 hafta sonra kişiliğini gence aktarabilir. Kontenjan: <b>${G.mentors.length}/${mentorSlots()}</b> · teknik ekip binası seviyesiyle artar.</p>
      ${G.mentors.length ? `<ul class="fp-list">${G.mentors.map((x, i) => { const m = FM.P(x.m), y = FM.P(x.y); return `<li><span><b>${esc(m.name)}</b> → <b>${esc(y.name)}</b><small>${C.PER[C.per(m)][0]} mentor · ${x.w} hafta · gelişim +%${Math.round(mentorBoost(m) * 100)}</small></span><button class="btn icon" data-a="mt-del" data-v="${i}" aria-label="Eşleşmeyi bitir">×</button></li>`; }).join('')}</ul>` : '<p class="muted">Henüz mentörlük eşleşmesi yok.</p>'}
      ${G.mentors.length < mentorSlots() ? (olds.length && kids.length ? `<div class="fp-form"><label class="sp"><span>Mentor (27+)</span><select id="mtM">${olds.filter(p => !busy.has(p.id)).map(p => `<option value="${p.id}">${esc(p.name)} · ${p.age} · ${C.PER[C.per(p)][0]}</option>`).join('')}</select></label>
        <label class="sp"><span>Genç (21 ve altı)</span><select id="mtY">${kids.filter(p => !busy.has(p.id)).map(p => `<option value="${p.id}">${esc(p.name)} · ${p.age} · ${FM.POS_TR[p.pos]} · ${p.ovr}/${p.pot}</option>`).join('')}</select></label><button class="btn primary" data-a="mt-add">Eşleştir</button></div>` : '<p class="muted">Eşleşme için kadroda 27 yaş üstü ve 21 yaş altı oyuncu gerekir. Altyapıdan genç alabilirsin.</p>') : ''}`;
  }
  Object.assign(acts, {
    'fac-panel': d => { U.facPanel = d.v; render(true); },
    'tf-add': () => { if (!$('tfP') || !$('tfP').value) return; say(setFocus(+$('tfP').value, $('tfA').value)); render(true); },
    'tf-del': d => { clearFocus(+d.id); render(true); },
    'mt-add': () => { if (!$('mtM') || !$('mtM').value || !$('mtY').value) return; say(addMentor(+$('mtM').value, +$('mtY').value)); render(true); },
    'mt-del': d => { delMentor(+d.v); toast('Mentörlük eşleşmesi sona erdi.'); render(true); }
  });

  FM.Inbox.extend({ projDone: x => ({ from: G_().staffQ.asst.n, role: 'Yardımcı antrenör', ic: 'staff', cat: 'board', title: `${FACS[x.k].proj[0]} tamamlandı`, body: `${FACS[x.k].n} için başlattığımız uzun vadeli proje bitti. Etkileri bu haftadan itibaren geçerli.` }) });
  FM.Inbox.extend({ mentorDone: x => ({ from: G_().staffQ.asst.n, role: 'Yardımcı antrenör', ic: 'staff', cat: 'squad', title: `${FM.P(x.y).name}, mentorundan çok şey öğrendi`, pid: x.y,
    body: `{p:${x.y}}, {p:${x.m}} ile geçirdiği 16 haftanın ardından onun gibi ${C.PER[C.per(FM.P(x.y))][0].toLocaleLowerCase('tr')} bir oyuncuya dönüştü.` }) });
  FM.Club = { seatFn, FACS, campus, ensure, setFocus, clearFocus, addMentor, delMentor, focusSlots, mentorSlots };
  if (FM.G) ensure();
})();
