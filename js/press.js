/* Saha Kenarı — basın toplantıları: maç öncesi, maç sonrası ve transfer sonrası.
   Kalıcı gazeteciler (yayın organı, tarz, seninle ilişkisi), çok sorulu toplantılar, cevapların etkisi
   ve basın salonunun SVG çizimi. Toplantılar gelen kutusuna mesaj olarak düşer. */
(function () {
  const { ri, pick, clamp } = FM.util;
  const R = Math.random, P = id => FM.G.players[id], T = id => FM.G.teams[id];
  const OUTLETS = ['Tribün Postası', 'Saha Dışı', 'Kale Arkası', 'Futbol Ekspres', 'Gol Gündem', 'Soyunma Odası', 'Yedek Kulübesi', 'Ofsayt Radyo'];
  /* tarz → hoşlandığı cevap türü */
  const STYLES = { 'Ölçülü': 'board', 'Sert': 'fans', 'Dostane': 'mor', 'Magazinci': 'pmor' };
  const SKIN = ['#f1c7a5', '#e6b48f', '#d29a72', '#a8704b', '#7a4b2e', '#5a3620'];
  const HAIR = ['#1d1a17', '#2e2119', '#4a3222', '#7a5534', '#b98b4e', '#d8d2c4', '#8a8a8a'];
  const JACKET = ['#26304a', '#1f2a3a', '#3a4658', '#5a2a2e', '#24493a', '#46464f', '#d9d4c7', '#2b5687', '#6b5a3e'];
  const name = () => pick(FM.FIRST) + ' ' + pick(FM.LAST);
  const look = rnd => ({ skin: rpick(rnd, SKIN), hair: rpick(rnd, HAIR), jk: rpick(rnd, JACKET), hs: (rnd() * 4) | 0, gl: rnd() < .3, cam: false, lap: rnd() < .35 });
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const rpick = (rnd, a) => a[(rnd() * a.length) | 0];

  function ensure() {
    const G = FM.G; if (!G || G.journos) return;
    const rnd = rng(G.teamId * 977 + 13), used = new Set();
    G.journos = [];
    for (let i = 0; i < 10; i++) {
      let o; do o = rpick(rnd, OUTLETS); while (used.has(o) && used.size < OUTLETS.length); used.add(o);
      G.journos.push({ id: i, name: name(), outlet: o, style: Object.keys(STYLES)[i % 4], rel: 0, n: 0, look: look(rnd) });
    }
  }
  const relTxt = r => (r >= 6 ? 'Yakın' : r <= -4 ? 'Mesafeli' : 'Normal');

  /* ---------- Soru bankası. {opp} {p} {score} {amt} metinde yerine konur. fx: fans, board, mor (takım), pmor (sorudaki oyuncu) ---------- */
  const Q = {
    preFav: ['{opp} karşısında favori sizsiniz. Rehavet tehlikesi var mı?', [['Rakibe saygımız sonsuz, maç maç düşünüyoruz.', { board: 2, mor: 1 }], ['Üç puanı alıp yolumuza devam edeceğiz.', { fans: 4, mor: 2, board: -1 }], ['Rehavete kapılan oyuncu oynamaz.', { mor: -2, board: 3 }]]],
    preDog: ['{opp} kâğıt üzerinde daha güçlü. Bu maçtan ne bekliyorsunuz?', [['Kaybedecek bir şeyimiz yok, cesur oynayacağız.', { mor: 3, fans: 2 }], ['Bir puan bile bizim için değerli.', { board: 2, fans: -2 }], ['Kâğıt üzerindeki güç sahada oynamaz.', { fans: 4, mor: 1, board: -1 }]]],
    preEven: ['{opp} ile başa baş bir maç bekleniyor. Farkı ne yaratacak?', [['Detaylar: duran toplar ve konsantrasyon.', { board: 2, mor: 1 }], ['Taraftarımızın desteği.', { fans: 5 }], ['Oyuncularımın kalitesi.', { mor: 3, board: -1 }]]],
    preBad: ['Son haftalarda işler yolunda gitmiyor. Bu maç bir dönüm noktası mı?', [['Her maç bir final, bu da öyle.', { mor: 2, board: 1 }], ['Kötü gidişatı bu hafta bitireceğiz.', { fans: 3, mor: 1, board: -2 }], ['Panik yapmanın anlamı yok.', { board: 3, fans: -2 }]]],
    preGood: ['Takım çok iyi gidiyor. Bu seriyi sürdürebilecek misiniz?', [['Ayaklarımız yere basıyor, sıradaki maça bakıyoruz.', { board: 3 }], ['Bu takımı kimse durduramaz.', { fans: 5, mor: 2, board: -2 }], ['Seri değil, performans önemli.', { mor: 2 }]]],
    preInj: ['{p} sakat. Onun yokluğunu nasıl dolduracaksınız?', [['Kadromuz geniş, herkes hazır.', { mor: 3 }], ['Eksikliği büyük ama çözüm bulacağız.', { pmor: 4, board: 1 }], ['Bahane üretmeyeceğiz.', { board: 3, fans: 1 }]]],
    preStar: ['{p} formunun zirvesinde. Bu maçta da gol bekleyebilir miyiz?', [['Takım oyunu her şeyden önce gelir.', { mor: 2 }], ['{p} her maç fark yaratabilir.', { pmor: 6, mor: -1, fans: 2 }], ['Ondan daha fazlasını bekliyorum.', { pmor: -3, board: 2 }]]],
    preCup: ['Kupada {opp} ile eşleştiniz. Kupa sizin için öncelik mi?', [['Her kupa önemlidir, sonuna kadar gideceğiz.', { fans: 5, board: -1 }], ['Önceliğimiz lig ama kupayı da ciddiye alıyoruz.', { board: 3 }], ['Gençlere şans vermek için iyi bir fırsat.', { mor: 1, board: 1, fans: -1 }]]],
    preHome: ['Taraftarınız {opp} maçı için stadı dolduracak. Onlara mesajınız?', [['On ikinci adamımız olun, sizi mahcup etmeyeceğiz.', { fans: 6 }], ['Biz sahada işimizi yapacağız.', { mor: 2, board: 1 }], ['Sabırlı olsunlar, her maç kolay değil.', { board: 2, fans: -2 }]]],
    postWin: ['{opp} karşısında {score} kazandınız. Galibiyetin anahtarı neydi?', [['Takım olarak mücadele ettik.', { mor: 3 }], ['Taktik planımız kusursuz işledi.', { board: 3, mor: -1 }], ['Taraftarımızın desteği.', { fans: 5 }]]],
    postBig: ['Farklı bir galibiyet! Bu skor rakiplere bir mesaj mı?', [['Sadece üç puan, ayaklarımız yere bassın.', { board: 3, mor: 1 }], ['Evet, zirve yarışındayız.', { fans: 6, board: -2 }], ['Mesajı sahada vermeye devam edeceğiz.', { mor: 3, fans: 2 }]]],
    postDraw: ['{opp} ile {score} berabere kaldınız. Bu bir puan kazanç mı, kayıp mı?', [['İki puan kaybettik.', { fans: 2, mor: -1 }], ['Değerli bir puan aldık.', { board: 2 }], ['Hakem kararları sonucu etkiledi.', { fans: 3, board: -3 }]]],
    postLoss: ['{opp} karşısında {score} kaybettiniz. Ne ters gitti?', [['Sorumluluk benim. Hatalarımızdan ders çıkaracağız.', { board: 3, mor: 2 }], ['Bazı oyuncular bu formayı hak etmedi.', { mor: -5, fans: 3 }], ['Şanssızdık, oyun olarak kötü değildik.', { mor: 1, fans: -2 }]]],
    postResign: ['Hocam, sonuçlar ortada ve tribünler kızgın. İstifayı düşünüyor musunuz?', [['Kaçmak yok. Bu takımı ayağa kaldıracağım.', { board: 2, fans: 2 }], ['Sorumluluk benim. Hatalarımızdan ders çıkaracağız.', { board: 3, mor: 1 }], ['Bazı oyuncular bu formanın hakkını vermedi.', { mor: -6, fans: 2, board: -1 }]]],
    postMotm: ['{p} maçın adamı seçildi. Performansını nasıl değerlendiriyorsunuz?', [['Harikaydı, her övgüyü hak ediyor.', { pmor: 7 }], ['İyiydi ama daha fazlasını yapabilir.', { pmor: -2, board: 2 }], ['Bireysel değil, takım başarısı.', { mor: 2 }]]],
    postRed: ['{p} kırmızı kart gördü. Karar hakkında ne düşünüyorsunuz?', [['Hakem doğru karar verdi, oyuncumla konuşacağım.', { pmor: -4, board: 2 }], ['Karar çok sertti.', { pmor: 3, fans: 2, board: -2 }], ['Yorum yapmayacağım.', {}]]],
    postCupOut: ['Kupaya {opp} karşısında veda ettiniz. Hayal kırıklığı büyük mü?', [['Üzgünüz ama ligde telafi edeceğiz.', { board: 2, mor: 1 }], ['Taraftarımızdan özür dileriz.', { fans: 4, mor: -1 }], ['Kupa zaten önceliğimiz değildi.', { board: 1, fans: -4 }]]],
    preDerby: ['{opp} ile {der} öncesi şehir alev alev. Bu maç sizin için ne ifade ediyor?', [['Sezonun en önemli maçı, her şeyimizi vereceğiz.', { fans: 6, mor: 2, board: -1 }], ['Sonuçta üç puan, sakin kalmalıyız.', { board: 3, fans: -3 }], ['Rakibe saygı duyuyoruz ama şehir bizim.', { fans: 4, mor: 1 }]]],
    postDerbyW: ['{der} sizin! Taraftara ne söylemek istersiniz?', [['Bu galibiyet sizin için.', { fans: 6 }], ['Takımımla gurur duyuyorum.', { mor: 4 }], ['Kutlayalım ama sezon bitmedi.', { board: 3, mor: 1 }]]],
    postDerbyL: ['{der} kaybedildi. Tribünler öfkeli, ne diyeceksiniz?', [['Taraftarımızdan özür dileriz.', { fans: 3, mor: -2 }], ['Hakem maçı belirledi.', { fans: 4, board: -3 }], ['Bu yenilgiden güçlenerek çıkacağız.', { board: 2, mor: 2 }]]],
    trBuy: ['{p} için {amt} ödediniz. Bu bedel yüksek değil mi?', [['Kalitesi bedelini fazlasıyla karşılayacak.', { pmor: 5, fans: 2 }], ['Bu piyasada makul bir rakam.', { board: 2 }], ['Zaman gösterecek.', { pmor: -2, board: 1 }]]],
    trRole: ['{p} takıma ne katacak?', [['Hemen ilk 11\'e girecek bir oyuncu.', { pmor: 6, mor: -2 }], ['Kadromuza derinlik kazandıracak.', { mor: 1, board: 1 }], ['Rekabeti artıracak, kimsenin yeri garanti değil.', { mor: -1, board: 2, pmor: 1 }]]],
    trFree: ['{p} bedelsiz geldi. Bu bir fırsat transferi mi?', [['Doğru zamanda doğru hamle.', { board: 3 }], ['Kendini kanıtlaması gerekecek.', { pmor: -2, mor: 1 }], ['Onun gibi bir oyuncuyu bedelsiz bulmak büyük şans.', { pmor: 5, fans: 2 }]]],
    trLoan: ['{p} kiralık geldi. Neden kalıcı transfer değil?', [['Önce yakından görmek istiyoruz.', { board: 2, pmor: -1 }], ['Bütçemizi doğru kullanıyoruz.', { board: 3, fans: -1 }], ['İyi oynarsa kalıcı olması için uğraşacağız.', { pmor: 5, fans: 1 }]]],
    trSell: ['{p} {amt} karşılığında gitti. Taraftar tepkili, ne diyorsunuz?', [['Kulübün geleceği için doğru karardı.', { board: 4, fans: -3 }], ['Oyuncunun isteğiydi, ona başarılar diliyoruz.', { fans: 1, mor: 1 }], ['Yerine daha iyisini getireceğiz.', { fans: 4, board: -2 }]]],
    trMoney: ['Satıştan gelen parayı nasıl kullanacaksınız?', [['Kadroyu güçlendireceğiz.', { fans: 3, mor: 1 }], ['Kasayı dengeleyeceğiz.', { board: 4, fans: -2 }], ['Altyapıya yatırım yapacağız.', { board: 2, fans: 1 }]]]
  };

  const sumMine = () => T(FM.G.teamId).players.map(P);
  const xiAvg = t => { const xi = t.lineup.filter(x => x != null).map(P); return xi.length ? xi.reduce((s, p) => s + p.ovr, 0) / xi.length : 60; };
  function fill(k, ctx) {
    const [q, a] = Q[k], sub = s => s.replace(/\{opp\}/g, ctx.opp || '').replace(/\{p\}/g, ctx.p ? P(ctx.p).name : '').replace(/\{score\}/g, ctx.score || '').replace(/\{amt\}/g, ctx.amt ? FM.money(ctx.amt) : '').replace(/\{der\}/g, ctx.der || 'derbi');
    return { q: sub(q), a: a.map(([t, fx]) => [sub(t), fx]), pid: ctx.p != null ? ctx.p : null, ans: null, res: '' };
  }
  function journos(n) { ensure(); const pool = FM.G.journos.slice().sort(() => R() - .5); return pool.slice(0, n).map(j => j.id); }
  function make(type, title, sub, keys, ctx, intro) {
    const G = FM.G; ensure(); FM.Inbox.ensure();
    const js = journos(keys.length);
    const qs = keys.map((k, i) => Object.assign(fill(k, ctx), { j: js[i] }));
    const m = FM.Inbox.add({ k: 'conf', cat: 'press', ic: 'press', from: 'Basın sözcüsü', role: 'İletişim birimi', title: sub + ' basın toplantısı', x: { type },
      body: intro + ` ${qs.length} soru seni bekliyor.`, conf: { type, sub, qs, cur: 0, done: false, seed: (R() * 1e9) | 0 } });
    return m;
  }

  /* Maç öncesi: hafta sonunda bir sonraki maç için */
  function pre() {
    const G = FM.G, me = T(G.teamId), cup = (G.euroDue && FM.Career && FM.Career.euroTie()) || (G.cupDue && FM.cupTie()), fx = cup || FM.userFixture();
    if (!fx || R() > (cup ? .8 : .55)) return;
    const opp = T(fx.h === G.teamId ? fx.a : fx.h), edge = xiAvg(me) - xiAvg(opp) + (fx.h === G.teamId ? 2 : -2);
    const row = FM.table().find(r => r.id === G.teamId), form = row ? row.form.slice(-3) : [];
    const der = !cup && FM.Career && FM.Career.isDerby(fx), keys = [der ? 'preDerby' : cup ? 'preCup' : edge >= 3 ? 'preFav' : edge <= -3 ? 'preDog' : 'preEven'], ctx = { opp: opp.name, der };
    if (form.filter(x => x === 'M').length >= 2) keys.push('preBad'); else if (form.length === 3 && form.every(x => x === 'G')) keys.push('preGood');
    const inj = sumMine().filter(p => p.inj && p.ovr >= xiAvg(me)).sort((a, b) => b.ovr - a.ovr)[0], star = sumMine().filter(p => p.g >= 3).sort((a, b) => b.g - a.g)[0];
    if (keys.length < 2 && inj) { keys.push('preInj'); ctx.p = inj.id; } else if (keys.length < 2 && star) { keys.push('preStar'); ctx.p = star.id; }
    if (keys.length < 2 && fx.h === G.teamId) keys.push('preHome');
    make('pre', `Maç öncesi basın toplantısı`, `${opp.name} maçı öncesi`, keys, ctx, `${opp.name} maçı öncesi gazeteciler salonda.`);
  }
  /* Maç sonrası: kullanıcı maçından hemen sonra */
  function post(m, us) {
    const G = FM.G, opp = T(m.s[1 - us].tid), gf = m.score[us], ga = m.score[1 - us], score = `${gf}-${ga}`;
    const won = m.cup && gf === ga ? FM.winnerSide(m) === us : gf > ga, lost = m.cup && gf === ga ? !won : gf < ga;
    const keys = [], ctx = { opp: opp.name, score };
    if (m.cup && lost) keys.push('postCupOut');
    else if (won) keys.push(gf - ga >= 3 ? 'postBig' : 'postWin');
    else if (!lost) keys.push('postDraw');
    else keys.push(G.board < 35 || ga - gf >= 3 ? 'postResign' : 'postLoss');
    const der = FM.Career && FM.Career.isDerby(m.fx); if (der && (won || lost)) { keys[0] = won ? 'postDerbyW' : 'postDerbyL'; ctx.der = der; }
    const red = m.log.find(l => l.type === 'red' && l.side === us), motm = m.motm != null && P(m.motm) && P(m.motm).tid === G.teamId ? m.motm : null;
    if (red) { keys.push('postRed'); ctx.p = red.pid; } else if (motm != null && R() < .7) { keys.push('postMotm'); ctx.p = motm; }
    const verb = won ? 'galibiyeti' : lost ? 'yenilgisi' : 'beraberliği';
    make('post', 'Maç sonrası basın toplantısı', `${opp.name} ${verb} sonrası`, keys, ctx, `${opp.name} karşısındaki ${score} ${verb} sonrası basın seni bekliyor.`);
  }
  /* Transfer: önemli bir alış, kiralama ya da satıştan sonra */
  function transfer(kind, p, amt) {
    const G = FM.G; if (!G || !p) return;
    const avg = xiAvg(T(G.teamId));
    if (kind === 'sell' ? amt < 1000000 && p.ovr < avg : kind === 'loan' ? p.ovr < avg - 2 : amt < 600000 && p.ovr < avg) return;
    const keys = kind === 'sell' ? ['trSell', 'trMoney'] : kind === 'loan' ? ['trLoan', 'trRole'] : kind === 'free' ? ['trFree', 'trRole'] : ['trBuy', 'trRole'];
    const ctx = { p: p.id, amt };
    const open = G.inbox.find(x => x.k === 'conf' && x.conf.type === 'tr' && !x.conf.done && x.conf.cur === 0 && x.s === G.season && x.born === G.season * 100 + G.week);
    if (open && open.conf.qs.length < 4) { // aynı haftadaki transfer toplantısına soru ekle
      const js = journos(2);
      keys.forEach((k, i) => open.conf.qs.push(Object.assign(fill(k, ctx), { j: js[i] })));
      open.body = `Bu haftaki transferlerin için gazeteciler salonda. ${open.conf.qs.length} soru seni bekliyor.`; open.read = false;
      return;
    }
    const verb = kind === 'sell' ? 'satışı' : kind === 'loan' ? 'kiralanması' : 'transferi';
    make('tr', 'Transfer basın toplantısı', `${p.name} ${verb} sonrası`, keys, ctx, `${p.name} ${verb} sonrası gazeteciler açıklama bekliyor.`);
  }

  /* Cevap: etkileri uygular, gazeteciyle ilişkiyi günceller */
  function answer(msgId, ai) {
    const G = FM.G, m = G.inbox.find(x => x.id === msgId); if (!m || !m.conf || m.conf.done) return null;
    const c = m.conf, q = c.qs[c.cur]; if (!q || q.ans != null) return null;
    const fx = q.a[ai][1], j = G.journos[q.j], parts = [];
    if (fx.fans) { G.fans = clamp(G.fans + fx.fans, 0, 100); parts.push(['Taraftar', fx.fans]); }
    if (fx.board) { G.board = clamp(G.board + fx.board, 0, 100); parts.push(['Yönetim', fx.board]); }
    if (fx.mor) { for (const p of sumMine()) p.mor = clamp(p.mor + fx.mor, 20, 100); parts.push(['Takım morali', fx.mor]); }
    if (fx.pmor && q.pid != null && P(q.pid)) { const p = P(q.pid); p.mor = clamp(p.mor + fx.pmor, 20, 100); parts.push([p.name.split(' ').pop() + ' morali', fx.pmor]); }
    const liked = (fx[STYLES[j.style]] || 0) > 0 || (j.style === 'Magazinci' && (fx.fans || 0) > 2);
    j.rel = clamp(j.rel + (liked ? 3 : -1), -10, 10); j.n++;
    q.ans = ai; q.fx = parts; q.res = liked ? `${j.name} cevabından memnun, hızlıca not alıyor.` : `${j.name} cevabı pek beğenmedi.`;
    c.cur++;
    if (c.cur >= c.qs.length) { c.done = true; m.read = true; m.res = 'Toplantı tamamlandı.'; }
    FM.save();
    return { q, parts, done: c.done };
  }
  function expire(m) {
    const G = FM.G, c = m.conf; c.done = true; c.exp = true;
    const skipped = c.qs.filter(q => q.ans == null).length;
    G.fans = clamp(G.fans - 1 - skipped, 0, 100); G.board = clamp(G.board - 1, 0, 100);
    m.res = `Toplantıya katılmadın; ${skipped} soru cevapsız kaldı. Basın bunu soğuk karşıladı (taraftar −${1 + skipped}, yönetim −1).`;
  }

  /* ---------- Basın salonu çizimi (SVG) ---------- */
  function person(lk, hl) {
    const hair = [
      `<path d="M-27 -44 Q-28 -74 0 -74 Q28 -74 27 -44 Q20 -60 0 -60 Q-20 -60 -27 -44Z" fill="${lk.hair}"/>`,
      `<path d="M-28 -40 Q-30 -76 0 -76 Q30 -76 28 -40 L28 -10 Q20 -30 22 -50 Q0 -58 -22 -50 Q-20 -30 -28 -10Z" fill="${lk.hair}"/>`,
      `<path d="M-26 -50 Q-22 -72 0 -72 Q22 -72 26 -50 Q10 -58 -26 -50Z" fill="${lk.hair}"/>`,
      `<path d="M-24 -56 Q0 -66 24 -56 Q20 -64 0 -66 Q-20 -64 -24 -56Z" fill="${lk.hair}"/>`][lk.hs];
    return `<g class="ps${hl ? ' hl' : ''}">
      ${hl ? '<ellipse cx="0" cy="0" rx="70" ry="90" class="glow"/>' : ''}
      <path class="bd" d="M-54 74 Q-54 6 -22 -4 L22 -4 Q54 6 54 74Z" fill="${lk.jk}"/>
      <path d="M-14 -4 L0 26 L14 -4Z" fill="#eef0f2"/><path d="M-3 0 L0 30 L3 0Z" fill="${lk.jk === '#d9d4c7' ? '#2b3550' : '#14202f'}" opacity=".7"/>
      <rect x="-30" y="28" width="11" height="15" rx="2" fill="#f3efe4" opacity=".85"/><path d="M-24 28 L-14 -2" stroke="#58c4dd" stroke-width="2"/>
      <rect x="-9" y="-22" width="18" height="20" fill="${lk.skin}"/>
      <ellipse class="hd" cx="0" cy="-42" rx="25" ry="29" fill="${lk.skin}"/>${hair}
      <circle cx="-9" cy="-40" r="2.6" fill="#1b1612"/><circle cx="9" cy="-40" r="2.6" fill="#1b1612"/><path d="M-7 -25 Q0 -21 7 -25" stroke="#7a4030" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      ${lk.gl ? '<g fill="none" stroke="#1b1612" stroke-width="2.2"><circle cx="-10" cy="-40" r="8"/><circle cx="10" cy="-40" r="8"/><path d="M-2 -40h4"/></g>' : ''}
      ${lk.cam ? '<g><rect x="-36" y="-66" width="60" height="42" rx="7" fill="#15171c"/><rect x="-30" y="-74" width="20" height="10" rx="2" fill="#15171c"/><circle cx="2" cy="-45" r="17" fill="#2a2e36" stroke="#0c0d10" stroke-width="5"/><circle cx="-2" cy="-49" r="5" fill="#58c4dd" opacity=".5"/></g>' : ''}
    </g>`;
  }
  function room(m) {
    const G = FM.G, c = m.conf, me = T(G.teamId), rnd = rng(c.seed), qi = Math.min(c.cur, c.qs.length - 1), asked = c.qs[qi].j;
    ensure();
    const ROWS = [[13, 168, .5], [12, 252, .64], [10, 346, .8], [8, 452, .98]];
    const seats = []; ROWS.forEach(([n, y, s], r) => { const w = 1600 - 260 + r * 90, x0 = (1600 - w) / 2; for (let i = 0; i < n; i++) seats.push({ r, x: x0 + (i + .5) * w / n + (rnd() - .5) * 14, y, s }); });
    // kalıcı gazeteciler orta sıralara, soran gazeteci öne yakın
    const mid = seats.filter(s => s.r === 1 || s.r === 2).sort(() => rnd() - .5), who = new Map();
    const order = [asked].concat(G.journos.map(j => j.id).filter(id => id !== asked));
    order.forEach((id, k) => { if (mid[k]) who.set(mid[k], id); });
    const league = me.div ? FM.DIV_TR[1] : FM.DIV_TR[0], dark = me.c1;
    let svg = `<svg viewBox="0 0 1600 560" class="room" role="img" aria-label="Basın salonu, ${c.qs.length} soruluk toplantı">
      <defs><linearGradient id="rw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dark}" stop-opacity=".55"/><stop offset="1" stop-color="#0b111c"/></linearGradient>
      <linearGradient id="rf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2433"/><stop offset="1" stop-color="#0d131d"/></linearGradient></defs>
      <rect width="1600" height="560" fill="#0b111c"/><rect width="1600" height="300" fill="url(#rw)"/>
      <path d="M0 0 L150 30 L150 330 L0 420Z" fill="#000" opacity=".35"/><path d="M1600 0 L1450 30 L1450 330 L1600 420Z" fill="#000" opacity=".35"/>
      <rect x="0" y="0" width="1600" height="26" fill="#070b12"/>${[220, 520, 820, 1120, 1380].map(x => `<rect x="${x}" y="8" width="120" height="7" rx="3" fill="#fff8e0" opacity=".85"/>`).join('')}
      <rect x="0" y="300" width="1600" height="260" fill="url(#rf)"/>`;
    for (let i = 0; i < 5; i++) { const x = 190 + i * 250; svg += `<g transform="translate(${x} 52)"><rect width="215" height="52" rx="4" fill="#0e1a2b" stroke="#2a4365" stroke-width="2"/><circle cx="28" cy="26" r="15" fill="none" stroke="#ffc93c" stroke-width="5"/><text x="52" y="32" fill="#f3efe4" font-size="17" font-family="Barlow, sans-serif" font-weight="600">${league}</text></g>`; }
    let tip = null;
    ROWS.forEach(([, y, s], r) => {
      const row = seats.filter(t => t.r === r);
      for (const t of row) { // koltuk
        svg += `<g transform="translate(${t.x} ${t.y}) scale(${t.s})"><rect x="-60" y="-12" width="120" height="92" rx="16" fill="${r % 2 ? '#7a1f2a' : '#5e1820'}"/><rect x="-60" y="-12" width="120" height="16" rx="8" fill="#ffc93c" opacity=".35"/></g>`;
      }
      for (const t of row) {
        const id = who.get(t), j = id != null ? G.journos[id] : null, lk = j ? j.look : look(rnd);
        if (!j) lk.cam = rnd() < .22; else lk.cam = false;
        svg += `<g transform="translate(${t.x} ${t.y}) scale(${t.s})">${person(lk, id === asked)}</g>`;
        if (id === asked) tip = { x: t.x / 1600 * 100, y: (t.y - 92 * t.s) / 560 * 100, j };
      }
      const dy = y + 50 * s, dh = 22 * s;
      svg += `<rect x="0" y="${dy}" width="1600" height="${dh}" fill="#2b3343"/><rect x="0" y="${dy}" width="1600" height="${3 * s}" fill="#ffc93c" opacity=".55"/>`;
      for (const t of row) if (rnd() < .3) svg += `<path transform="translate(${t.x + 10} ${dy}) scale(${s})" d="M-26 0 L-20 -26 L26 -26 L32 0Z" fill="#14171d"/>`;
    });
    // ön masa ve mikrofonlar
    svg += `<rect x="0" y="512" width="1600" height="48" fill="#121822"/><rect x="0" y="512" width="1600" height="4" fill="${me.c1}"/>`;
    [560, 660, 760, 860, 960, 1060].forEach((x, i) => { const col = i === 2 ? me.c1 : '#1a1d22'; svg += `<path d="M${x} 560 L${x + (i - 2.5) * 6} 488" stroke="#0a0c10" stroke-width="7"/><ellipse cx="${x + (i - 2.5) * 6}" cy="476" rx="26" ry="34" fill="${col}"/><ellipse cx="${x + (i - 2.5) * 6 - 8}" cy="466" rx="8" ry="12" fill="#fff" opacity=".08"/>`; });
    svg += `<rect x="1300" y="520" width="34" height="40" rx="4" fill="#1d2a3d"/><rect x="230" y="500" width="22" height="60" rx="6" fill="#9fb6d0" opacity=".35"/>`;
    // flaşlar
    svg += `<g class="flashes">${[0, 1, 2, 3, 4].map(k => { const t = seats[(rnd() * seats.length) | 0]; return `<circle cx="${t.x}" cy="${t.y - 40 * t.s}" r="${36 * t.s}" style="animation-delay:${(k * 1.3 + rnd()).toFixed(2)}s"/>`; }).join('')}</g></svg>`;
    return { svg, tip };
  }

  FM.Press = { ensure, pre, post, transfer, answer, expire, room, relTxt };
})();
