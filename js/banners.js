/* Saha Kenarı — taraftar pankartları: kategoriler, kulübe özgü tribün kimliği ve maç durumuna göre seçim.
   Yönetim ve teknik direktör kötü gidiyorsa tribün protestoya döner ("YÖNETİM İSTİFA!").
   Seçilen pankartlar 3D/2D tribünlere, maç öncesi ekranına ve spiker yorumlarına yansır. */
(function () {
  const CAT = {
    ask: ['Bu Sevda Bitmez!', 'Ölümüne Seninleyiz!', 'Formanın Peşinde Ömür Tüketiriz!', 'Biz Bitti Demeden Bitmez!', 'Bu Şehir Arkanda!', 'Armanın Olduğu Yerdeyiz!', 'Son Nefese Kadar!', 'Yenilsek de Terk Etmeyiz!', 'Bu Aşkın Tarifi Yok!', 'Tribün Susmaz, Sevda Bitmez!', 'Renklerimizden Vazgeçmeyiz!', 'Her Şey Senin İçin!', 'Yağmurda Çamurda Yanındayız!', 'Bir Şehir, Bir Sevda!', 'Çocukluk Aşkımsın!', 'Babamdan Miras, Çocuğuma Emanet!', 'Seninle Doğduk, Seninle Öleceğiz!', 'Kalbimizin Tek Sahibi!', 'Bu Aşk Başka Aşk!', 'Bir Ömür Seninle!', 'Hayatımızın En Güzel Rengi!', 'İyi Günde Kötü Günde!', 'Senin İçin Atıyor Bu Kalp!', 'Bu Forma Bizim Hikâyemiz!', 'Her Zaman Her Yerde!'],
    ultras: ['Burası Bizim Evimiz!', 'Tribün Bizim, Kurallar Bizim!', '90 Dakika Değil, Bir Ömür!', 'Bu Kale Düşmez!', 'Şehrin Sokaklarından Tribüne!', 'Bizim Olduğumuz Yerde Ses Kesilmez!', 'Korku Bilmez Bu Renkler!', 'Her Maç Bir Savaş, Her Tribün Bir Kale!', 'Şanlı Tarih, Büyük Taraftar!', 'Deplasman Bizim İçin Yol Değil, Sevdadır!', 'Tribünde Son Söz Bizim!', 'Bu Tribün Asla Susmaz!', 'Her Sokakta Biz Varız!', 'Armamız İçin Buradayız!', 'Bu Şehrin Sahibi Taraftardır!', 'Sesimiz Şehrin Her Yerinde!', 'Tribünlerin Efendisi!', 'Bizim İçin Futbol Bir Yaşam Biçimi!', 'Her Deplasman Bir Hikâye!', 'Bu Renkler Asla Solmaz!'],
    sampiyon: ['Şampiyonluk Bizim Olacak!', 'Tarih Yazmaya Geldik!', 'Korkma, İnanç Bizde!', 'Hedef Zirve!', 'Bu Sene O Sene!', 'Zafer İnananlarındır!', 'Son Düdüğe Kadar Savaş!', 'Şampiyonluk İçin Tek Yürek!', 'Bu Şehir Kupayı İstiyor!', 'İnanırsak Başarırız!', 'Zirveye Giden Yol Buradan Geçer!', 'Şimdi Sıra Tarih Yazmakta!', 'Bu Formanın Hakkını Verin!', 'Birlikte Kazanacağız!', 'Şampiyonluk Bir Hayal Değil!', 'Mücadele Et, Vazgeçme!', 'Sonuna Kadar Mücadele!', 'Hedefimiz Avrupa!', 'Kupa Bu Şehre Gelecek!', 'Zafer Bizim Olacak!'],
    rakip: ['Büyüklük Formayla Değil, Tarihle Olur!', 'Bizim Hikâyemiz Sizin Hayaliniz!', 'Sahada Cevap Verin!', 'Tarih Konuşur, Gerisi Susar!', 'Zirvenin Sahibi Belli!', 'Bu Şehirde Misafirsiniz!', 'Bizim Sevdamız, Sizin Rekabetiniz!', 'Skor Tabelası Her Şeyi Anlatır!', 'Büyük Takım Büyük Oynar!', 'Şehrimize Hoş Geldiniz!', 'Gerçekler Sahada Belli Olur!', 'Tarih Tekerrür Edecek!', 'Bu Tribün Size Dar Gelir!', 'Biz Buradayız, Siz Neredesiniz?', 'Rekabet Sahada Kazanılır!'],
    derbi: ['Derbinin Adı Bizim, Zaferin Adı Bizim!', 'Bu Maçın Hikâyesi Başka!', 'Şehrin Onuru Sahada!', 'Bugün Günlerden Derbi!', '90 Dakika Boyunca Tek Ses!', 'Bu Maç Bizim İçin Her Şey!', 'Tarihe Bir Sayfa Daha!', 'Derbi Ateşi Hiç Sönmez!', 'Bu Şehir Bugünü Bekledi!', 'Sahaya Çıkın ve Tarih Yazın!'],
    protesto: ['Yönetim İstifa!', 'Bu Taraftar Bunu Hak Etmiyor!', 'Formanın Ağırlığını Taşıyın!', 'Sabrımızın da Bir Sınırı Var!', 'Transfer Değil, Mücadele İstiyoruz!', 'Bu Armanın Hakkını Verin!', 'Taraftarı Dinleyin!', 'Yönetim Hesap Vermeli!', 'Bu Takım Sahipsiz Değil!', 'Değişim Zamanı!', 'Sahada Ruh İstiyoruz!', 'Söz Değil, İcraat İstiyoruz!', 'Bu Formayı Hak Eden Giysin!', 'Taraftarın Sesi Susturulamaz!', 'Mücadele Etmeden Başarı Gelmez!'],
    oyuncu: ['Hoş Geldin Efsane!', 'Bu Şehrin Yeni Kahramanı!', 'Kaptan, Seninleyiz!', 'Armanın Hakkını Ver!', 'Sen Bir Efsanesin!', 'Bu Forma Sana Emanet!', 'Kaptan Bizi Zafere Taşı!', 'Seni Asla Unutmayacağız!', 'Teşekkürler Efsane!', 'Bir Efsane Doğuyor!', 'Golünle Tarih Yaz!', 'Bu Taraftar Sana İnanıyor!', 'Bizim İçin Savaş!', 'Formanın Hakkını Ver!', 'Hoşça Kal Büyük Kaptan!'],
    deplasman: ['Uzaklar Engel Değil!', 'Her Yerde Seninleyiz!', 'Kilometrelerce Yol, Tek Bir Sevda!', 'Bu Şehir Her Yerde!', 'Deplasmanda Yalnız Değilsin!', 'Yollar Biter, Sevdamız Bitmez!', 'Otobüsler Dolusu Sevda!', 'Nerede Oynarsan Oradayız!', 'Her Statta Biz Varız!', 'Uzaklık Sadece Bir Rakam!'],
    avrupa: ['Against All Odds!', 'Forever Together!', 'One Club, One City!', 'Our City, Our Pride!', 'No Surrender!', 'United We Stand!', 'Born To Support!', 'This Is Our Home!', 'Pride Of The City!', 'Football Is Our Life!', 'Never Walk Alone!', 'One Love, One Club!', 'Our Colours, Our Passion!', 'Respect The History!', 'The Story Never Ends!'],
    koreo: ['Bir Şehir Uyanıyor!', 'Tarih Bizimle Yazılıyor!', 'Bu Sevdanın Sonu Yok!', 'Küllerimizden Doğarız!', 'Birlikte Daha Güçlüyüz!', 'Her Zaman Zirveye!', 'Bu Şehir Asla Pes Etmez!', 'Geçmişten Geleceğe Aynı Sevda!', 'Bir Renk, Binlerce Hikâye!', 'Sonsuza Dek Bu Arma!', 'Biz Bir Aileyiz!', 'Bu Tribün Bir Başka!', 'Şanlı Geçmiş, Büyük Gelecek!', 'Tek Yürek, Tek Hedef!', 'Efsaneler Asla Ölmez!'],
    zor: ['Şimdi Birlik Olma Zamanı!', 'Bu Takım Düşmeyecek!', 'Sonuna Kadar Yanınızdayız!', 'Pes Etmek Yok!', 'Bu Şehir Takımını Yalnız Bırakmaz!', 'Birlikte Ayağa Kalkacağız!', 'Mücadele Et, Biz Arkandayız!', 'Kötü Gün Dostu Burada!', 'Bu Forma İçin Savaşın!', 'Son Maça Kadar İnanç!'],
    kultur: ['Futbol Bizim Hayatımız!', 'Tribünler Bizim Evimiz!', 'Her Maç Yeni Bir Hikâye!', 'Bu Sevda Nesilden Nesile!', 'Renklerimiz Bize Yeter!', 'Futbolun Kalbi Burada Atıyor!', 'Tribün Bir Kültürdür!', 'Bu Şehrin Sesi Biziz!', 'Arma İçin Yaşa!', 'Bir Ömür Tribünde!']
  };
  const CAT_TR = { ask: 'Aşk ve bağlılık', ultras: 'Ultras', sampiyon: 'Şampiyonluk', rakip: 'Rakibe gönderme', derbi: 'Derbi', protesto: 'Protesto', oyuncu: 'Oyuncuya özel', deplasman: 'Deplasman', avrupa: 'Avrupa tarzı', koreo: 'Koreografi', zor: 'Zor günler', kultur: 'Tribün kültürü' };
  /* Kulübe özgü tribün kimliği: her kulübün taraftarı bazı kategorileri daha çok sever */
  const STYLE = {
    ultras: { n: 'Ultras tribün', w: { ultras: 4, rakip: 2, koreo: 2, ask: 1 } },
    sevda: { n: 'Sevdalı tribün', w: { ask: 4, koreo: 2, kultur: 2, ultras: 1 } },
    avrupa: { n: 'Avrupa tarzı tribün', w: { avrupa: 4, koreo: 2, ultras: 1, kultur: 1 } },
    kultur: { n: 'Geleneksel tribün', w: { kultur: 3, ask: 3, koreo: 1, ultras: 1 } }
  };
  const R = Math.random, pick = a => a[Math.floor(R() * a.length)];
  function styleOf(t) {
    if (t.foreign) return 'avrupa';
    const k = ['ultras', 'sevda', 'avrupa', 'kultur'][(t.id * 7 + t.short.charCodeAt(0)) % 4];
    return t.rep >= 5 && k === 'kultur' ? 'ultras' : k;
  }
  const up = s => s.toLocaleUpperCase('tr');
  const first = t => up(t.name.split(' ')[0]);
  /* Kulübe özel kalıplar: kulüp adı ve stadyumla şekillenir */
  const own = t => [`Ölümüne ${first(t)}!`, `${first(t)} Sevdası Bitmez!`, `Burası ${t.stadium}!`, `${first(t)} Tek Yürek!`, `${t.short} Ultras`, `Bir Ömür ${first(t)}!`];

  /* Bir takımın gidişatı: protesto şiddeti 0–3 */
  function mood(t) {
    const G = FM.G, tb = FM.table(t.div), i = tb.findIndex(r => r.id === t.id), row = tb[i], n = tb.length;
    const form = row ? row.form.slice(-5) : [], losses = form.filter(x => x === 'M').length, played = row ? row.pl : 0;
    const out = { pos: i + 1, n, losses, played, protest: 0, title: false, drop: false };
    if (t.div > 1 || !row) return out;
    out.title = played >= 5 && i <= 1;
    out.drop = played >= 5 && t.div === 0 && i >= n - 3;
    if (t.id === G.teamId) {
      const exp = FM.expectation(t);
      out.protest = (G.board < 25 ? 2 : G.board < 40 ? 1 : 0) + (G.fans < 35 ? 1 : 0) + (played >= 4 && out.pos > exp + 3 ? 1 : 0) + (losses >= 3 ? 1 : 0);
    } else out.protest = (played >= 6 && i >= n - 2 ? 1 : 0) + (losses >= 4 ? 2 : losses >= 3 ? 1 : 0);
    out.protest = Math.min(3, out.protest);
    return out;
  }

  /* Maç için pankartlar: { choreo: [alt, üst], hang: [...], away: [...], protest, headline, style } */
  function forMatch(fx, opt) {
    opt = opt || {};
    const G = FM.G, h = FM.T(fx.h), a = FM.T(fx.a), md = mood(h), st = STYLE[styleOf(h)], used = new Set();
    const take = (cat, k) => { const pool = CAT[cat].filter(x => !used.has(x)); const x = pick(pool.length ? pool : CAT[cat]); used.add(x); return { t: x, k: k || cat }; };
    const weighted = () => { const w = Object.entries(st.w), tot = w.reduce((s, x) => s + x[1], 0); let r = R() * tot; for (const [c, v] of w) { r -= v; if (r <= 0) return c; } return w[0][0]; };
    const derby = FM.Career && FM.Career.isDerby(fx), ko = !!opt.cup, euro = opt.comp === 'euro';
    const hang = [];
    const special = [];
    // oyuncuya özel: kaptan, golcü, efsane, altyapıdan yeni çıkan
    const sq = h.players.map(FM.P).filter(Boolean), cap = h.cap != null ? FM.P(h.cap) : null;
    if (cap && R() < .7) special.push({ t: `${up(cap.name.split(' ').pop())} · ${R() < .5 ? 'Kaptan, Seninleyiz!' : 'Kaptan Bizi Zafere Taşı!'}`, k: 'oyuncu' });
    const top = sq.slice().sort((x, y) => y.g - x.g)[0];
    if (top && top.g >= 3) special.push({ t: `${up(top.name.split(' ').pop())} · ${pick(['Golünle Tarih Yaz!', 'Bu Taraftar Sana İnanıyor!', 'Bu Şehrin Yeni Kahramanı!'])}`, k: 'oyuncu' });
    const leg = FM.Career && sq.find(p => p.age >= 32 && FM.Career.clubApps(p).apps >= 40);
    if (leg) special.push({ t: `${up(leg.name.split(' ').pop())} · ${pick(['Sen Bir Efsanesin!', 'Teşekkürler Efsane!', 'Seni Asla Unutmayacağız!'])}`, k: 'oyuncu' });
    const kid = sq.find(p => p.age <= 18);
    if (kid && R() < .5) special.push({ t: `${up(kid.name.split(' ').pop())} · Bir Efsane Doğuyor!`, k: 'oyuncu' });

    let choreo, headline;
    if (md.protest >= 2) {
      // yönetim ve teknik direktör kötü: tribün protestoya döner
      choreo = ['YÖNETİM İSTİFA!', up(take('protesto').t)];
      used.add('Yönetim İstifa!');
      hang.push({ t: 'Yönetim İstifa!', k: 'protesto' }, take('protesto'), take('protesto'));
      if (md.protest >= 3) hang.push(take('protesto'));
      if (md.drop) hang.push(take('zor'));
      headline = 'Yönetim İstifa!';
    } else {
      if (derby) { choreo = [up(take('derbi').t), up(take('rakip').t)]; hang.push(take('derbi'), take('rakip')); }
      else if (euro) { choreo = [up(take('avrupa').t), up(pick(['Hedefimiz Avrupa!', 'Tarih Yazmaya Geldik!']))]; hang.push(take('avrupa')); }
      else if (ko) { choreo = [up(pick(['Kupa Bu Şehre Gelecek!', 'Zafer Bizim Olacak!', 'Son Düdüğe Kadar Savaş!'])), up(pick(own(h)))]; hang.push(take('sampiyon')); }
      else if (md.title) { choreo = [up(take('sampiyon').t), up(pick(own(h)))]; hang.push(take('sampiyon'), take('sampiyon')); }
      else if (md.drop) { choreo = [up(take('zor').t), up(take('ask').t)]; hang.push(take('zor'), take('zor')); }
      else { choreo = [up(pick(own(h))), up(take('koreo').t)]; }
      if (md.protest === 1 && !md.title) hang.push(take('protesto'));   // hafif huzursuzluk: tek protesto pankartı
      headline = choreo[0];
    }
    hang.push(...special.slice(0, 2));
    while (hang.length < 6) hang.push(take(weighted()));
    hang.push({ t: own(h)[hang.length % own(h).length], k: 'own' });
    // misafir tribün: deplasman pankartları
    const away = [take('deplasman'), { t: `${up(a.name.split(' ')[0])} Burada!`, k: 'deplasman' }];
    return { choreo, hang: hang.slice(0, 7), away, protest: md.protest >= 2 ? md.protest : 0, uneasy: md.protest === 1 && !md.title, headline, style: st.n, home: h.id };
  }

  /* Tribün yorumları (spiker) */
  function lines(b, h) {
    const out = [];
    if (b.protest) out.push(`Tribünlerde büyük tepki var: dev pankartta “Yönetim İstifa!” yazıyor.`, `Taraftar yönetimi ve teknik heyeti protesto ediyor: “${b.hang[1].t}”`);
    else out.push(`${h.name} tribünlerinde dev pankart: “${b.hang[0].t}”`);
    const sp = b.hang.find(x => x.k === 'oyuncu');
    if (sp && !b.protest) out.push(`Tribünde oyuncuya özel pankart var: “${sp.t}”`);
    out.push(`Misafir tribünü de boş durmuyor: “${b.away[0].t}”`);
    return out;
  }
  function preHtml(b) {
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    return `<div class="ban-pre ${b.protest ? 'prot' : ''}">${b.protest ? '<b>Tribünlerde protesto var</b>' : `<small>${esc(b.style)}</small>`}<span>“${esc(b.hang[0].t)}”</span></div>`;
  }

  /* Protesto sonrası: haber, sosyal akış, yönetimin tepkisi (yalnızca kullanıcının iç saha maçında) */
  function afterMatch(m, us, d) {
    const G = FM.G, b = m.ban; if (!b || b.home !== G.teamId) return;
    if (b.protest) {
      FM.news(`Taraftarlar “Yönetim İstifa!” pankartlarıyla yönetimi ve teknik heyeti protesto etti.`, 'bad');
      G.board = Math.max(0, G.board - (d < 0 ? 2 : 1));
      if (FM.Career) FM.Career.social('fan', pick(['Yönetim istifa! Bu armanın hakkını veremiyorsunuz.', 'Sabrımızın da bir sınırı var. Değişim zamanı!', 'Söz değil icraat istiyoruz. Yönetim hesap vermeli!', 'Bu taraftar bunu hak etmiyor. Sahada ruh istiyoruz!']));
      if (!G.protestW || G.season * 100 + G.week - G.protestW > 4) { G.protestW = G.season * 100 + G.week; FM.Inbox.make('protest', { d }); }
    } else if (d > 0 && R() < .5 && FM.Career) FM.Career.social('fan', `Tribünde “${b.hang[0].t}” pankartı açtık, takım da sahada cevap verdi!`);
  }
  if (FM.Career) { const um = FM.Career.userMatch; FM.Career.userMatch = (m, us, d) => { um(m, us, d); afterMatch(m, us, d); }; }
  FM.Inbox.extend({ protest: () => ({ from: FM.G.staff ? FM.G.staff.chair : 'Kulüp başkanı', role: 'Kulüp başkanı', ic: 'board', cat: 'board', title: 'Tribünler bizi protesto ediyor',
    body: 'Hocam, bugün tribünlerde “Yönetim İstifa!” pankartları vardı. Taraftar hem yönetime hem teknik heyete öfkeli. Sonuçlar düzelmezse bu baskı artacak; yönetim kurulu da sabrının sınırında. Önümüzdeki maçlar çok önemli.' }) });

  FM.Banners = { CAT, CAT_TR, STYLE, styleOf, mood, forMatch, lines, preHtml };
})();
