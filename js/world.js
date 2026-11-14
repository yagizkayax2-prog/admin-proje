/* Saha Kenarı — veri tabanı: ülkelerin kurgusal kulüpleri ve kulüp profilleri.
   Her şey kulüp anahtarından (ör. "DE:5") tohumlanan rastgele sayı üretecinden türetilir; böylece takım seçme ekranında
   görülen kulüp ile oyunda kurulan kulüp aynıdır. Türk kulüpleri FM.TEAMS'ten gelir. */
(function () {
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => { let a = hash(seed) || 1; return () => { a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return ((a >>> 0) % 100000) / 100000; }; };
  const PALETTE = ['#c8102e', '#0b3c8c', '#f2c230', '#1f8a4c', '#5b2a86', '#e07a1f', '#111111', '#ffffff', '#6cace4', '#8b1e2d', '#00857c', '#d7263d', '#203864', '#f4f1de', '#2d6a4f', '#ff8f1c'];
  const NICK = ['Kartallar', 'Aslanlar', 'Kurtlar', 'Martılar', 'Şimşekler', 'Atmacalar', 'Boğalar', 'Denizciler', 'Madenciler', 'Gemiciler', 'Kızıllar', 'Mavi Şimşekler', 'Sarı Kanaryalar', 'Yeşil Fırtına', 'Siyah İnciler', 'Demirciler'];
  const MCULT = ['Altyapıdan oyuncu yetiştirilmesi', 'Genç ve gelişime açık oyuncuların transferi', 'Tanınmış, yüksek itibarlı oyuncuların transfer edilmesi', 'Hücum futbolu oynanması', 'Kontrollü harcama, borçsuz yönetim', 'Yerli oyunculara güvenilmesi', 'Kupalarda iddialı olunması'];
  const FCULT = ['Takıma bağlılık ve mücadele', 'Hücum futbolu oynanması', 'Yıldız oyuncuların transfer edilmesi', 'Altyapıdan yetişen oyunculara süre verilmesi', 'Derbilerin kazanılması', 'Tribünle bütünleşen oyuncular'];
  const CHAIR = ['Kulübü çok seviyor', 'Sabırlı', 'Sonuç odaklı', 'Gösterişi seviyor', 'Hesabını bilen'];
  const REPN = ['Yerel', 'Yerel', 'Bölgesel', 'Ulusal', 'Kıtasal', 'Dünya çapında'];
  const FIN = ['Borçlu', 'Kısıtlı', 'Kısıtlı', 'İstikrarlı', 'Güvende', 'Zengin'];
  const TRAIN = ['Temel antrenman sahaları', 'Temel antrenman sahaları', 'Yeterli antrenman tesisleri', 'İyi antrenman tesisleri', 'Çok iyi antrenman tesisleri', 'Muhteşem antrenman tesisleri'];
  const YOUTH = ['Zayıf altyapı tesisleri', 'Zayıf altyapı tesisleri', 'Ortalama altyapı tesisleri', 'İyi altyapı tesisleri', 'Çok iyi altyapı tesisleri', 'Süper altyapı tesisleri'];
  const STAD = ['Stadı', 'Arena', 'Park', 'Sahası', 'Stadyumu'];
  const lum = h => { const n = parseInt(h.slice(1), 16); return (n >> 16) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114; };
  const cache = {};

  /* Bir ülkenin kurgusal kulüpleri: 1. lig (12) ve 2. lig (12) */
  function clubs(cc) {
    if (cache[cc]) return cache[cc];
    const C = FM.COUNTRIES[cc];
    if (C.base) return (cache[cc] = FM.TEAMS.map((t, i) => profile({ ...t, key: 'TR:' + i, cc, tier: t.div || (i >= 12 ? 1 : 0), city: t.stadium.split(' ')[0] })));
    const r = rng('clubs:' + cc), out = [];
    const used = new Set();
    C.towns.forEach((town, i) => {
      const tier = i < 12 ? 0 : 1, k = i % 12, pre = C.pre[Math.floor(r() * C.pre.length)], suf = C.suf[Math.floor(r() * C.suf.length)];
      let name = (pre ? (r() < .3 && suf && suf !== pre ? [pre, town, suf] : [pre, town]) : [town, suf || 'FC']).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
      if (used.has(name)) name = town + ' ' + (C.suf.find(x => x && !used.has(town + ' ' + x)) || 'FC');
      used.add(name);
      const c1 = PALETTE[Math.floor(r() * PALETTE.length)]; let c2 = PALETTE[Math.floor(r() * PALETTE.length)];
      if (Math.abs(lum(c1) - lum(c2)) < 60) c2 = lum(c1) > 128 ? '#14202f' : '#ffffff';
      const rep = Math.max(1, Math.min(5, C.rep[tier] - Math.floor(k / (tier ? 4 : 3)) + (r() < .2 ? 1 : 0)));
      const short = (town.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, '').slice(0, 3)).toLocaleUpperCase('tr');
      out.push(profile({ key: cc + ':' + i, cc, tier, name, short, c1, c2, rep, city: town, stadium: town + ' ' + STAD[Math.floor(r() * STAD.length)], crest: [Math.floor(r() * 3), Math.floor(r() * 4), Math.floor(r() * 2)], fans: town + ' ' + FM.FANS_G[Math.floor(r() * FM.FANS_G.length)] }));
    });
    // her kulübe aynı ülkeden bir ezeli rakip
    out.forEach((c, i) => { if (!c.rivalKey) { const j = i % 2 ? i - 1 : i + 1; if (out[j]) { c.rivalKey = out[j].key; out[j].rivalKey = c.key; } } });
    return (cache[cc] = out);
  }
  function profile(c) {
    const r = rng('info:' + c.key);
    const pk = (a, n) => { const s = a.slice(), o = []; for (let i = 0; i < n && s.length; i++) o.push(s.splice(Math.floor(r() * s.length), 1)[0]); return o; };
    c.info = {
      founded: 1880 + Math.floor(r() * 100), nick: NICK[Math.floor(r() * NICK.length)],
      mcult: pk(MCULT, 1 + (r() < .6 ? 1 : 0)), fcult: pk(FCULT, 1 + (r() < .5 ? 1 : 0)), chair: CHAIR[Math.floor(r() * CHAIR.length)],
      status: c.rep >= 2 || c.tier === 0 ? 'Profesyonel' : 'Yarı profesyonel', pattern: Math.floor(r() * 4)
    };
    return c;
  }
  const tiers = o => (o.leagues ? o.leagues.slice().sort() : Array.from({ length: o.depth || 1 }, (_, i) => i));
  /* Seçilen ülkelerin ligleri ve kulüpleri (oyun kurulmadan önce takım seçme ekranı için) */
  function leagues(setup) {
    const out = [];
    for (const cc of Object.keys(setup.countries)) {
      const o = setup.countries[cc], C = FM.COUNTRIES[cc], all = clubs(cc);
      for (const tier of tiers(o)) out.push({ cc, tier, name: C.l[tier], mode: o.mode, clubs: all.filter(c => c.tier === tier) });
    }
    return out;
  }
  const repName = rep => REPN[Math.max(0, Math.min(5, rep))];
  const finName = rep => FIN[Math.max(0, Math.min(5, rep))];
  const facName = (rep, tier) => [TRAIN[Math.max(0, Math.min(5, rep - tier))], YOUTH[Math.max(0, Math.min(5, rep - tier))]];
  /* Lig içindeki beklenti (itibar sırasına göre) */
  function expectLabel(lg, club) {
    const order = lg.clubs.slice().sort((a, b) => b.rep - a.rep || a.key.localeCompare(b.key)), i = order.indexOf(club) + 1;
    const pos = Math.max(1, Math.min(12, i + (lg.tier ? 0 : 0)));
    const lab = lg.tier ? (pos <= 2 ? 'Yükselme' : pos <= 5 ? 'Play-off yarışı' : pos <= 9 ? 'Orta sıralar' : 'Ligde kalma') : (pos === 1 ? 'Şampiyonluk' : pos <= 4 ? 'Kıta Kupası\'na katılım' : pos <= 6 ? 'Üst sıralar' : pos <= 9 ? 'Orta sıraların altı' : 'Küme düşme savaşı');
    return { pos, lab };
  }
  /* Basit forma çizimi */
  function kit(c1, c2, pat, label) {
    const id = 'k' + Math.floor(Math.random() * 1e9), ink = lum(c1) > 150 ? '#14202f' : '#ffffff';
    const p = [`<rect x="0" y="0" width="100" height="100" fill="${c1}"/>`, `<g fill="${c2}">${[14, 38, 62, 86].map(x => `<rect x="${x - 6}" y="0" width="12" height="100"/>`).join('')}</g>`,
      `<rect x="0" y="34" width="100" height="22" fill="${c2}"/>`, `<polygon points="0,100 100,0 100,26 26,100" fill="${c2}"/>`][pat || 0];
    return `<svg viewBox="0 0 100 100" width="64" height="64" role="img" aria-label="${label}"><defs><clipPath id="${id}"><path d="M30 8 L42 4 Q50 12 58 4 L70 8 L94 22 L84 42 L74 36 L74 96 L26 96 L26 36 L16 42 L6 22 Z"/></clipPath></defs>
      <g clip-path="url(#${id})">${p}<rect x="0" y="0" width="100" height="100" fill="url(#none)"/></g>
      <path d="M30 8 L42 4 Q50 12 58 4 L70 8 L94 22 L84 42 L74 36 L74 96 L26 96 L26 36 L16 42 L6 22 Z" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="2"/>
      <path d="M42 4 Q50 12 58 4" fill="none" stroke="${c2 === c1 ? ink : c2}" stroke-width="3"/></svg>`;
  }
  /* Kulüp başına oyuncu sayısı ve kayıt boyutu tahmini */
  function estimate(setup) {
    let teams = 0, play = 0;
    for (const cc of Object.keys(setup.countries)) { const o = setup.countries[cc], n = 12 * tiers(o).length; teams += n; if (o.mode === 'play') play += n; }
    teams += 12;   // Kıta Kupası kulüpleri
    const players = teams * 22 + 28 + 14, kb = Math.round(teams * 12.5 + 150);
    const speed = play <= 48 ? 'Hızlı' : play <= 96 ? 'Dengeli' : play <= 144 ? 'Yavaş' : 'Çok yavaş';
    return { teams, players, kb, speed, play };
  }
  FM.World = { tiers, clubs, leagues, repName, finName, facName, expectLabel, kit, estimate, profile, LIMIT_KB: 4300 };
})();
