/* Saha Kenarı — gelen kutusu: kulüp çalışanlarından, basından, menajerlerden ve yönetimden gelen mesajlar.
   Bazı mesajlar karar ister; seçilen cevabın etkisi (moral, bütçe, indirim, transfer) burada uygulanır.
   Mesaj gövdesindeki {p:12} oyuncu, {t:3} kulüp bağlantısıdır; arayüz bunları tıklanabilir yapar. */
(function () {
  const { ri, pick, clamp } = FM.util;
  const R = Math.random, P = id => FM.G.players[id], T = id => FM.G.teams[id];
  const r10k = v => Math.round(v / 10000) * 10000;
  const OUTLETS = ['Tribün Postası', 'Saha Dışı', 'Kale Arkası', 'Futbol Ekspres', 'Gol Gündem', 'Soyunma Odası'];
  const CAT = { squad: 'KADRO', press: 'BASIN', fin: 'MALİYE', transfer: 'TRANSFER', agent: 'MENAJER', board: 'YÖNETİM', scout: 'SCOUT', med: 'SAĞLIK' };
  const name = () => pick(FM.FIRST) + ' ' + pick(FM.LAST);
  const mine = () => T(FM.G.teamId).players.map(P);
  const mor = (p, d) => { p.mor = clamp(p.mor + d, 20, 100); };
  /* Özel isimlere ünlü uyumuna göre ek: ek('Yılmaz','in') → Yılmaz'ın */
  function ek(w, k) {
    const s = w.toLocaleLowerCase('tr'), v = (s.match(/[aıoueiöü](?=[^aıoueiöü]*$)/) || ['e'])[0], vEnd = /[aıoueiöü]$/.test(s), hard = /[çfhkpsşt]$/.test(s);
    const i4 = { a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' }[v], a2 = 'aıou'.includes(v) ? 'a' : 'e';
    const suf = { in: (vEnd ? 'n' : '') + i4 + 'n', i: (vEnd ? 'y' : '') + i4, e: (vEnd ? 'y' : '') + a2, den: (hard ? 't' : 'd') + a2 + 'n' }[k];
    return w + "'" + suf;
  }
  const sgn = v => (v > 0 ? '+' : '') + v;

  /* ---------- Takvim: her sezonun ilk lig maçı ağustosun ikinci cumartesisine yakın ---------- */
  const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  function date(s, d) { const y = 2025 + s, b = new Date(y, 7, 8); b.setDate(8 - (b.getDay() + 1) % 7 + d); return b; }
  const fmtDate = (s, d, wd) => { const x = date(s, d); return `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}${wd ? ' ' + DAYS[x.getDay()] : ''}`; };
  const today = () => FM.G.week * 7 - 1;          // maç günü cumartesi, "bugün" bir önceki gün
  const msgDay = () => Math.max(-6, today() - ri(0, 4));

  /* ---------- Mesaj ekleme ---------- */
  function add(m) {
    const G = FM.G;
    const msg = Object.assign({ id: G.nextMsg++, s: G.season, d: msgDay(), born: G.season * 100 + G.week, read: false, ch: null }, m);
    msg.cat = CAT[msg.cat] || msg.cat;
    G.inbox.unshift(msg);
    if (G.inbox.length > 80) G.inbox.length = 80;
    return msg;
  }
  const staff = k => FM.G.staff[k];
  const ROLE = { asst: 'Yardımcı antrenör', med: 'Sağlık ekibi şefi', scout: 'Baş scout', chair: 'Kulüp başkanı', owner: 'Kulüp sahibi', fin: 'Finans direktörü' };
  const from = k => ({ from: staff(k), role: ROLE[k], ic: k === 'chair' || k === 'owner' ? 'board' : k === 'med' ? 'med' : k === 'scout' ? 'scout' : k === 'fin' ? 'fin' : 'staff' });

  function ensure() {
    const G = FM.G; if (!G) return;
    if (!G.inbox) G.inbox = [];
    if (G.nextMsg == null) G.nextMsg = 1;
    if (!G.staff) G.staff = { asst: name(), med: name(), scout: name(), chair: name(), owner: name(), fin: name() };
    if (!G.ibCool) G.ibCool = {};
    if (FM.Press) FM.Press.ensure();
  }

  /* ---------- Şablonlar: gen() mesajı üretir, act(m, i) kararın etkisini uygular ve sonuç metnini döner ---------- */
  const TPL = {
    welcome: {
      gen() {
        const G = FM.G, me = T(G.teamId);
        return { ...from('chair'), cat: 'board', title: 'Kulübe hoş geldin', tid: me.id,
          body: `{t:${me.id}} ailesine hoş geldin hocam. Bu sezon senden beklentimiz ${FM.DIV_TR[me.div]}'nde ${FM.expectation(me)}. sıra veya üstü. Transfer dönemi 4 hafta açık; kasada ${FM.money(G.fin.balance)} var. Kararlarını buradan, gelen kutundan takip edeceğiz.` };
      }
    },
    press: {
      gen() {
        const q = ri(0, FM.PRESS.length - 1), j = name(), o = pick(OUTLETS);
        return { from: j, role: o, ic: 'press', cat: 'press', title: 'Basın toplantısı: tek soru', x: { q },
          body: `${o} muhabiri ${j} maç öncesi basın toplantısında soruyor: “${FM.PRESS[q].q}”`, opts: FM.PRESS[q].a.map(a => a[0]) };
      },
      act(m, i) {
        const fx = FM.PRESS[m.x.q].a[i][1], parts = [];
        if (fx.fans) { FM.G.fans = clamp(FM.G.fans + fx.fans, 0, 100); parts.push('taraftar ' + sgn(fx.fans)); }
        if (fx.board) { FM.G.board = clamp(FM.G.board + fx.board, 0, 100); parts.push('yönetim ' + sgn(fx.board)); }
        if (fx.mor) { for (const p of mine()) mor(p, fx.mor); parts.push('takım morali ' + sgn(fx.mor)); }
        return parts.length ? 'Açıklamanın etkisi: ' + parts.join(', ') + '.' : 'Açıklaman pek yankı uyandırmadı.';
      }
    },
    bid: {
      gen(x) {
        const p = P(x.pid);
        return { ...from('fin'), cat: 'transfer', title: `${T(x.tid).name}, ${p.name} için teklif yaptı`, pid: p.id, x,
          body: `{t:${x.tid}} oyuncumuz {p:${p.id}} için ${FM.money(x.amt)} teklif etti. Oyuncunun piyasa değeri ${FM.money(p.value)}. Karşı teklif yaparsak masadan kalkabilirler.`,
          opts: [`Kabul et · ${FM.money(x.amt)}`, `Karşı teklif · ${FM.money(r10k(x.amt * 1.2))}`, 'Reddet'] };
      },
      act(m, i) {
        const x = m.x, p = P(x.pid);
        if (i === 2) return 'Teklif reddedildi.';
        if (!p || p.tid !== FM.G.teamId) return 'Oyuncu artık kadroda değil.';
        if (!FM.windowOpen()) return 'Transfer dönemi kapandığı için teklif düştü.';
        if (T(FM.G.teamId).players.length <= 16) return { err: 'Kadroda en az 16 oyuncu kalmalı.' };
        if (i === 1) {
          if (R() < .5) { FM.sell(p.id, x.tid, r10k(x.amt * 1.2)); return `${T(x.tid).name} karşı teklifini kabul etti: ${p.name} ${FM.money(r10k(x.amt * 1.2))} karşılığında satıldı.`; }
          return `${T(x.tid).name} karşı teklifini kabul etmedi ve masadan kalktı.`;
        }
        FM.sell(p.id, x.tid, x.amt);
        return `${p.name}, ${FM.money(x.amt)} karşılığında ${T(x.tid).name} takımına satıldı.`;
      }
    },
    leak: {
      gen() {
        const G = FM.G, avg = mine().reduce((s, p) => s + p.ovr, 0) / mine().length;
        const pool = FM.marketList().filter(p => p.tid != null && !p.loan && p.ovr >= avg && !(p.disc && p.disc.s === G.season));
        if (!pool.length) return null;
        const p = pick(pool), j = name(), o = pick(OUTLETS);
        return { from: j, role: o, ic: 'press', cat: 'press', title: `${j} kulis bilgisi verdi`, pid: p.id, x: { j },
          body: `${ek(o, 'den')} ${j} aradı ve bir bilgi verdi: {t:${p.tid}} oyuncusu {p:${p.id}} kulübünde mutlu değilmiş; uygun bir teklif onu düşündürebilirmiş. Karşılığında bir sonraki demecini önce ona vermeni bekliyor.`,
          opts: ['Söz ver: bir sonraki demecim önce ona', 'Teşekkür et, söz verme', 'Bir şey yapma'] };
      },
      act(m, i) {
        const p = P(m.pid); if (!p) return 'Oyuncu artık futbolu bıraktı.';
        if (i === 2) return 'Bilgiyi dosyaya kaldırdın.';
        p.sc = 1;
        if (i === 1) return `${m.x.j} biraz bozuldu ama bilgiyi doğruladı. ${p.name} hakkında tam rapor dosyana eklendi.`;
        p.disc = { s: FM.G.season, k: .85 };
        FM.G.board = clamp(FM.G.board - 2, 0, 100);
        return `${m.x.j} bilgiyi kulübün içinden doğruladı: ${p.tid != null ? T(p.tid).name : 'Kulübü'} bu sezon ${p.name} için %15 indirime razı. Yönetim basına bu kadar yakın durmandan hoşlanmadı (yönetim −2).`;
      }
    },
    split: {
      gen() {
        const sq = mine().filter(p => !p.loan), old = sq.filter(p => p.age >= 28).sort((a, b) => b.ovr - a.ovr), yng = sq.filter(p => p.age <= 23);
        if (!old.length || !yng.length) return null;
        const a = pick(old.slice(0, 4)), b = pick(yng);
        return { ...from('asst'), cat: 'squad', title: 'Soyunma odası bölündü', pid: b.id, x: { a: a.id, b: b.id },
          body: `Antrenmanda {p:${a.id}} ile {p:${b.id}} arasında sert bir tartışma çıktı. Kıdemliler ${ek(a.name.split(' ')[0], 'in')}, gençler ${ek(b.name.split(' ')[0], 'in')} arkasında. Senin tavrını bekliyorlar.`,
          opts: [`${ek(a.name, 'in')} tarafını tut`, `${ek(b.name, 'i')} koru`, 'Takım toplantısı yap', 'Bir şey yapma'] };
      },
      act(m, i) {
        const a = P(m.x.a), b = P(m.x.b); if (!a || !b) return 'Tartışma kendiliğinden kapandı.';
        if (i === 0) { mor(a, 8); mor(b, -10); return `${a.name} memnun (moral +8), ${b.name} kırgın (moral −10).`; }
        if (i === 1) { mor(b, 8); mor(a, -10); return `${b.name} rahatladı (moral +8), ${a.name} küstü (moral −10).`; }
        if (i === 2) {
          if (R() < .65) { for (const p of mine()) mor(p, 2); mor(a, 2); mor(b, 2); return 'Toplantı iyi geçti, kırgınlıklar giderildi. Takım morali +2.'; }
          for (const p of mine()) mor(p, -2); return 'Toplantı gergin geçti, kimse ikna olmadı. Takım morali −2.';
        }
        mor(a, -4); mor(b, -4); for (const p of mine()) mor(p, -2);
        return 'Sessiz kalman soyunma odasında iyi karşılanmadı. Takım morali −2.';
      }
    },
    mins: {
      gen() {
        const me = T(FM.G.teamId), xi = new Set(me.lineup);
        const pool = mine().filter(p => !xi.has(p.id) && !p.inj && !p.prom && p.ovr >= 58);
        if (!pool.length) return null;
        const p = pool.sort((a, b) => b.ovr - a.ovr)[0];
        return { from: p.name, role: 'Oyuncu', ic: 'player', cat: 'squad', title: `${p.name} daha fazla süre istiyor`, pid: p.id,
          body: `{p:${p.id}} kapını çaldı: “Hocam, kendimi hazır hissediyorum ama yedek kulübesinde oturuyorum. Bana bir şans verin.” Bu sezon ${p.apps} maçta forma giydi.`,
          opts: ['Önümüzdeki 3 haftada 2 maç sözü ver', 'Sabırlı olmasını söyle', 'Satış listesine koy'] };
      },
      act(m, i) {
        const p = P(m.pid); if (!p || p.tid !== FM.G.teamId) return 'Oyuncu artık kadroda değil.';
        if (i === 0) { mor(p, 12); p.prom = { w: FM.G.week + 3, apps: p.apps + 2 }; return `${p.name} çok sevindi (moral +12). Sözünü unutma: 3 hafta içinde en az 2 maç.`; }
        if (i === 1) { const d = p.age >= 27 ? -6 : 3; mor(p, d); return d > 0 ? `${p.name} anlayışla karşıladı (moral +3).` : `${p.name} bu cevabı beklemiyordu (moral −6).`; }
        mor(p, -12); p.listed = FM.G.season; return `${p.name} satış listesine kondu (moral −12). Transfer dönemi açıkken teklif gelme ihtimali arttı.`;
      }
    },
    promise: {
      gen(x) {
        const p = P(x.pid), ok = x.ok;
        return { ...from('asst'), cat: 'squad', title: ok ? `${ek(p.name, 'e')} verilen söz tutuldu` : `${p.name} sözünü tutmadığını düşünüyor`, pid: p.id,
          body: ok ? `{p:${p.id}} söz verdiğin süreyi aldı ve çok mutlu. Takım içinde sözünün eri olduğun konuşuluyor (moral +6).`
            : `{p:${p.id}} söz verdiğin maçlarda forma giymedi. Soyunma odasında bu konu konuşuluyor (oyuncu morali −16, takım morali −2).` };
      }
    },
    agent: {
      gen() {
        const pool = FM.G.free.map(P).filter(p => p && p.ovr >= 60);
        if (!pool.length) return null;
        const p = pool.sort((a, b) => b.ovr - a.ovr)[ri(0, Math.min(3, pool.length - 1))], ag = name(), fee = r10k(FM.askPrice(p) * .7);
        return { from: ag, role: 'Oyuncu menajeri', ic: 'agent', cat: 'agent', title: `${p.name} için menajeri kapıda`, pid: p.id, x: { fee },
          body: `Menajer ${ag}, serbest oyuncu {p:${p.id}} ile çalışmak istediğini söylüyor. Bu hafta imzalarsan imza parasında indirim yapmaya hazır: ${FM.money(fee)}.`,
          opts: [`İmzala · ${FM.money(fee)}`, 'Dosyasını incele (scout raporu)', 'İlgilenmiyoruz'] };
      },
      act(m, i) {
        const p = P(m.pid); if (!p || p.tid != null) return 'Oyuncu başka bir kulüple anlaştı.';
        if (i === 2) return 'Menajere teşekkür edip kapıyı kapattın.';
        if (i === 1) { p.sc = 1; return `Raporu geldi: güç ${p.ovr}, potansiyel ${p.pot}. Oyuncu Transfer sayfasında serbestler arasında.`; }
        const was = p.disc; p.disc = { s: FM.G.season, k: m.x.fee / Math.max(1, FM.askPrice(p)) * (was ? was.k : 1) };
        const r = FM.buy(p.id);
        if (!r.ok) { p.disc = was; return { err: r.msg }; }
        return `${p.name} ${FM.money(r.price)} imza parasıyla kadroya katıldı.`;
      }
    },
    loan: {
      gen() {
        if (!FM.windowOpen()) return null;
        const avg = mine().reduce((s, p) => s + p.ovr, 0) / mine().length;
        const pool = FM.marketList().filter(p => p.tid != null && T(p.tid).players.length > 18 && !T(p.tid).lineup.includes(p.id) && p.ovr >= avg - 3);
        if (!pool.length) return null;
        const p = pick(pool), fee = r10k(p.value * .1);
        return { ...from('asst'), cat: 'transfer', title: `${FM.deadline() ? 'Son gün fırsatı: ' : ''}kiralık oyuncu`, pid: p.id,
          body: `{t:${p.tid}} kulübünde forma bulamayan {p:${p.id}} sezon sonuna kadar kiralanabilir. Kiralama bedeli ${FM.money(fee)}, maaşı ${FM.money(p.wage)}/hafta.${FM.deadline() ? ' Transfer döneminin son haftası, beklersek kaçar.' : ''}`,
          opts: [`Kirala · ${FM.money(fee)}`, 'Önce scout gönder', 'Geç'] };
      },
      act(m, i) {
        const p = P(m.pid); if (!p) return 'Oyuncu artık yok.';
        if (i === 2) return 'Fırsatı değerlendirmedin.';
        const r = i === 0 ? FM.loanIn(p.id) : FM.scout(p.id);
        if (!r.ok) return { err: r.msg };
        return r.msg;
      }
    },
    owner: {
      gen() {
        const amt = r10k(T(FM.G.teamId).rep * 400000 + ri(3, 9) * 100000);
        return { ...from('owner'), cat: 'fin', title: 'Kulüp sahibinden para', x: { amt },
          body: `Kulüp sahibi ${staff('owner')} kulübe ${FM.money(amt)} aktarmaya karar verdi. Paranın nereye gideceğine sen karar ver.`,
          opts: ['Transfer bütçesine ekle', 'Altyapı akademisine yatır', 'Antrenman tesisine yatır'] };
      },
      act(m, i) {
        const me = T(FM.G.teamId), k = i === 1 ? 'youth' : 'training';
        if (i === 0 || me.fac[k] >= 5) { FM.G.fin.balance += m.x.amt; return `${FM.money(m.x.amt)} transfer bütçesine eklendi.`; }
        me.fac[k]++; FM.G.board = clamp(FM.G.board + 2, 0, 100);
        return `${FM.FAC[k].name} ${me.fac[k]}. seviyeye çıktı. Yönetim uzun vadeli düşünmeni beğendi (yönetim +2).`;
      }
    },
    sponsor: {
      gen() {
        const base = T(FM.G.teamId).rep * 250000 + 400000, fixed = r10k(base), perWin = r10k(base / 6);
        return { ...from('fin'), cat: 'fin', title: 'Forma sponsorundan iki seçenek', x: { fixed, perWin },
          body: `Yeni forma sponsorumuz iki ödeme planı sunuyor: bugün tek seferde ${FM.money(fixed)} ya da sezonun geri kalanında kazandığımız her resmî maç için ${FM.money(perWin)}.`,
          opts: [`Peşin al · ${FM.money(fixed)}`, `Galibiyet başına · ${FM.money(perWin)}`] };
      },
      act(m, i) {
        if (i === 0) { FM.G.fin.balance += m.x.fixed; return `${FM.money(m.x.fixed)} kasaya girdi.`; }
        FM.G.winBonus = { s: FM.G.season, amt: m.x.perWin }; return `Anlaşma imzalandı: her galibiyet ${FM.money(m.x.perWin)} getirecek.`;
      }
    },
    youthRep: {
      gen() {
        const me = T(FM.G.teamId), lv = me.fac.youth, n = name();
        return { ...from('asst'), cat: 'squad', title: 'Alt yaş takımları: aylık rapor',
          body: `Akademimiz ${lv}/5 seviyesinde. U19 takımında ${n} göze çarpıyor; ${lv >= 4 ? 'teknik ekip onu çok beğeniyor' : lv >= 2 ? 'gelişimi umut verici' : 'ama tesislerimiz yeteneğini geliştirmeye yetmiyor'}. ${FM.G.youthUsed ? 'Bu sezon altyapıdan bir oyuncuyu zaten A takıma aldın.' : 'Antrenman sayfasından bir genci A takıma alabilirsin.'}` };
      }
    },
    review: {
      gen() {
        const G = FM.G, me = T(G.teamId), pos = FM.table().findIndex(r => r.id === G.teamId) + 1, exp = FM.expectation(me);
        const tone = pos <= exp ? 'Gidişattan memnunuz, böyle devam.' : pos <= exp + 2 ? 'Hedefin biraz gerisindeyiz; önümüzdeki haftalar önemli.' : 'Sonuçlar beklentinin çok altında. Sabrımız sınırsız değil.';
        return { ...from('chair'), cat: 'board', title: 'Yönetimden ara değerlendirme',
          body: `Ligde ${pos}. sıradayız, hedef ${exp}. sıra. Yönetim güveni ${Math.round(G.board)}, taraftar desteği ${Math.round(G.fans)}. ${tone}` };
      }
    },
    scoutRep: {
      gen(x) {
        const p = P(x.pid);
        return { ...from('scout'), cat: 'scout', title: `Scout raporu: ${p.name}`, pid: p.id,
          body: `{p:${p.id}} raporu hazır. Güç ${p.ovr}, potansiyel ${p.pot}. ${p.pot - p.ovr >= 10 ? 'Gelişime çok açık, uzun vadeli bir yatırım olabilir.' : p.ovr >= 72 ? 'Hemen ilk 11\'e katkı verebilir.' : 'Kadro derinliği için düşünülebilir.'}` };
      }
    },
    injury: {
      gen(x) {
        const p = P(x.pid);
        return { ...from('med'), cat: 'med', title: `${p.name} sakatlandı`, pid: p.id,
          body: `{p:${p.id}} son maçta sakatlandı. Tahmini dönüş süresi ${p.inj} hafta.${x.more ? ` Ayrıca ${x.more} oyuncu daha tedavi görüyor.` : ''}` };
      }
    }
  };

  function make(k, x) { const t = TPL[k], m = t.gen(x); if (!m) return null; m.k = k; if (x && !m.x) m.x = x; return add(m); }

  /* Kararı uygula. Hata dönerse ({err}) mesaj kararsız kalır. */
  function decide(id, i, auto) {
    const G = FM.G, m = G.inbox.find(x => x.id === id);
    if (!m || !m.opts || m.ch != null) return { ok: false, msg: 'Bu karar zaten verildi.' };
    const r = TPL[m.k].act(m, i);
    if (r && r.err) { if (!auto) return { ok: false, msg: r.err }; m.ch = m.opts.length - 1; m.res = 'Karar verilmediği için işlem yapılmadı.'; m.exp = true; return { ok: false }; }
    m.ch = i; m.res = r; m.read = true; if (auto) m.exp = true;
    FM.save();
    return { ok: true, msg: r };
  }
  const todo = m => (m.conf ? !m.conf.done : !!m.opts && m.ch == null);
  const pending = () => (FM.G && FM.G.inbox ? FM.G.inbox.filter(todo) : []);
  const unread = () => (FM.G && FM.G.inbox ? FM.G.inbox.filter(m => !m.read).length : 0);

  function cool(k, w) { const G = FM.G, key = G.season * 100 + G.week; if (G.ibCool[k] && key - G.ibCool[k] < w) return false; G.ibCool[k] = key; return true; }

  /* Hafta sonunda (G.week artırıldıktan sonra) çağrılır */
  function week() {
    ensure();
    const G = FM.G;
    const cur = G.season * 100 + G.week;
    for (const m of pending()) {
      if (m.conf) { if (m.conf.type !== 'pre' && m.born === cur - 1) continue; FM.Press.expire(m); }   // maç sonrası/transfer toplantısı bir hafta daha açık
      else decide(m.id, m.opts.length - 1, true);   // cevapsız kalanlar: son seçenek
    }
    for (const p of mine()) if (p.prom && G.week >= p.prom.w) {
      const ok = p.apps >= p.prom.apps; delete p.prom;
      if (ok) mor(p, 6); else { mor(p, -16); for (const q of mine()) mor(q, -2); }
      make('promise', { pid: p.id, ok });
    }
    if (G.week === 1) make('sponsor');
    if (G.week % 6 === 3) make('youthRep');
    if (G.week % 6 === 0 && G.week >= 6) make('review');
    FM.Press.pre();
    const pool = [['leak', .3, 4], ['split', .14, 6], ['mins', .22, 3], ['agent', .2, 4], ['loan', .3, 2], ['owner', .05, 30]];
    let n = 0;
    for (const [k, pr, w] of pool.sort(() => R() - .5)) if (n < 2 && R() < pr && cool(k, w) && make(k)) n++;
  }
  function onMatch(m, us) {
    ensure();
    const G = FM.G, now = mine().filter(p => p.inj).map(p => p.id), known = new Set(G.injKnown || []), played = new Set(m.s[us].played);
    const fresh = now.filter(id => !known.has(id) && played.has(id)).map(P);
    G.injKnown = now;
    if (fresh.length) { const p = fresh.sort((a, b) => b.inj - a.inj)[0]; make('injury', { pid: p.id, more: fresh.length - 1 }); }
    FM.Press.post(m, us);
  }

  FM.ek = ek;
  const extend = o => { for (const k in o) TPL[k] = { gen: o[k] }; };
  FM.Inbox = { extend, add, todo, ensure, make, decide, pending, unread, week, onMatch, fmtDate, today, date, CAT };
})();
