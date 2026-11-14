/* Saha Kenarı — ek ekranlar (ana dal arayüzüne bağlanır): oyun menüsü ve kayıt yuvaları, ayarlar, rehber ve tanıtım turu,
   maç öncesi ekranı, basın salonu, sözleşme pazarlığı, soyunma odası grupları, izleme listesi ve scout görevi,
   antrenman takvimi, bireysel hedef ve mentörlük, kulüp sekmeleri (tesisler, stadyum, forma ve sponsor, maliye),
   kariyer geçmişi ve kulüp efsaneleri. ui.js'in FM.ui yardımcılarını kullanır. */
(function () {
  const UI = FM.ui, { U, $, esc, toast, modal, closeModal, render, go, me, posChip, ovrB, ovrCls, fmtR, gauge, playerRows, P_HEAD, VIEWS, acts } = UI;
  const P = id => FM.P(id), T = id => FM.T(id), money = FM.money, C = FM.Career;
  const say = r => toast(r.msg, r.ok ? 'good' : 'bad');
  const R = Math.random;
  const lumH = h => { const n = parseInt(h.slice(1), 16); return (n >> 16) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114; };
  const cdist = (a, b) => { const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16); return Math.abs((x >> 16) - (y >> 16)) + Math.abs(((x >> 8) & 255) - ((y >> 8) & 255)) + Math.abs((x & 255) - (y & 255)); };
  const forceSave = () => { FM.forceSave = true; FM.save(); FM.forceSave = false; };
  const ago = t => { if (!t) return ''; const d = new Date(t); return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); };

  /* ================= 1–4: Oyun menüsü, kayıt yuvaları, ayarlar, rehber, tur ================= */
  const slotCard = (s, mode) => s.empty
    ? `<div class="slot empty"><span class="slot-n">${s.n}. yuva</span><p class="muted">Boş</p>${mode === 'menu' ? `<button class="btn" data-a="slot-new" data-v="${s.n}">Yeni kariyer</button>` : ''}</div>`
    : `<div class="slot" style="--k1:${FM.TEAMS[s.tid] ? FM.TEAMS[s.tid].c1 : '#58c4dd'}"><span class="slot-n">${s.n}. yuva${s.n === FM.slot() && FM.G ? ' · açık' : ''}</span>
        <div class="slot-t">${FM.TEAMS[s.tid] ? FM.crest({ ...FM.TEAMS[s.tid], id: s.tid }, 40) : ''}<div><strong>${esc(s.team)}</strong><small>${esc(s.manager)} · ${s.season}. sezon · ${Math.min(s.week + 1, FM.WEEK_COUNT)}. hafta</small><small>${FM.DIV_TR[s.div] || ''}${s.at ? ' · ' + ago(s.at) : ''}</small></div></div>
        <div class="row"><button class="btn primary" data-a="slot-load" data-v="${s.n}">Yükle</button>${U.delSlot === s.n ? `<button class="btn danger" data-a="slot-del-yes" data-v="${s.n}">Silmeyi onayla</button><button class="btn" data-a="slot-del-no">Vazgeç</button>` : `<button class="btn" data-a="slot-del" data-v="${s.n}">Sil</button>`}</div></div>`;
  UI.menuScreen = function () {
    const sl = FM.slots(), last = sl.find(s => s.n === FM.slot() && !s.empty) || sl.filter(s => !s.empty).sort((a, b) => b.at - a.at)[0], panel = U.menuPanel;
    return `<div class="menu-scr"><div class="menu-bg" aria-hidden="true"><img src="assets/stadium.svg" alt=""></div>
      <div class="menu-in">
        <header class="menu-head"><img src="assets/logo.svg" alt="" width="96" height="96"><div><h1>Saha Kenarı</h1><p>Futbol menajerlik oyunu</p></div></header>
        <nav class="menu-list" aria-label="Ana menü">
          ${last ? `<button class="mbtn primary" data-a="slot-load" data-v="${last.n}"><span>Devam et</span><small>${esc(last.team)} · ${last.season}. sezon · ${Math.min(last.week + 1, FM.WEEK_COUNT)}. hafta</small></button>` : ''}
          <button class="mbtn ${last ? '' : 'primary'}" data-a="menu-panel" data-v="new"><span>Yeni kariyer</span><small>Kulübünü seç, sıfırdan başla</small></button>
          <button class="mbtn" data-a="menu-panel" data-v="slots"><span>Kariyer yükle</span><small>${sl.filter(s => !s.empty).length}/3 kayıt yuvası dolu</small></button>
          <button class="mbtn" data-a="menu-panel" data-v="settings"><span>Ayarlar</span><small>Ses, maç hızı, grafik</small></button>
          <button class="mbtn" data-a="menu-panel" data-v="guide"><span>Rehber</span><small>Oyunun tüm sistemleri</small></button>
          <button class="mbtn" data-a="import"><span>Kaydı içe aktar</span><small>Başka cihazdan taşı</small></button>
        </nav>
        ${panel ? `<section class="menu-panel card">${panelHtml(panel, 'menu')}</section>` : ''}
      </div></div>`;
  };
  function panelHtml(k, mode) {
    if (k === 'new') return `<h2>Yeni kariyer</h2><p class="muted">Hangi yuvaya kaydedilsin? Dolu bir yuvayı seçersen eski kariyer silinir.</p><div class="slots">${FM.slots().map(s => `<div class="slot ${s.empty ? 'empty' : ''}"><span class="slot-n">${s.n}. yuva</span><p>${s.empty ? 'Boş' : esc(s.team) + ' · ' + s.season + '. sezon'}</p><button class="btn ${s.empty ? 'primary' : ''}" data-a="slot-new" data-v="${s.n}">${s.empty ? 'Burada başla' : 'Üzerine yaz'}</button></div>`).join('')}</div>`;
    if (k === 'slots') return `<h2>Kayıt yuvaları</h2><div class="slots">${FM.slots().map(s => slotCard(s, mode)).join('')}</div>`;
    if (k === 'settings') return settingsHtml(mode);
    if (k === 'guide') return guideHtml();
    return '';
  }
  function settingsHtml(mode) {
    const S = FM.Settings, tog = (k, n, d) => `<label class="tog" for="set-${k}"><input type="checkbox" id="set-${k}" data-a="set-tog" data-k="${k}" ${S.get(k) ? 'checked' : ''}><span class="tg-sw" aria-hidden="true"></span><span><strong>${n}</strong><small>${d}</small></span></label>`;
    return `<h2>Ayarlar</h2>
      <div class="set-row"><label for="set-vol"><strong>Ses düzeyi</strong><small>${FM.Audio.muted ? 'Ses kapalı' : Math.round(S.get('vol') * 100) + '%'}</small></label><div class="row"><input id="set-vol" type="range" min="0" max="1" step=".05" value="${S.get('vol')}" data-a="set-vol"><button class="btn" data-a="sound-set2">${FM.Audio.muted ? 'Sesi aç' : 'Sesi kapat'}</button></div></div>
      <div class="set-row"><span><strong>Varsayılan maç hızı</strong><small>Maç bu hızda başlar</small></span><div class="seg">${[1, 2, 4].map(v => `<button data-a="set-speed" data-v="${v}" class="${S.get('speed') === v ? 'on' : ''}">${v}x</button>`).join('')}</div></div>
      ${tog('gfx3d', '3D stadyum', 'Kapalıyken daha hafif 2D stadyum kullanılır.')}
      ${tog('calm', 'Sakin mod', 'Animasyonları ve geçişleri azaltır.')}
      ${tog('ticker', 'Haber şeridi', 'Ekranın altında kayan sonuçlar ve haberler.')}
      ${tog('autoSave', 'Otomatik kayıt', 'Her işlemden sonra kariyer kaydedilir.')}
      ${tog('prematch', 'Maç öncesi ekranı', 'Maçtan önce diziliş, forma ve takım konuşması ekranını göster.')}
      ${FM.G && mode === 'game' ? `<div class="set-row"><div><strong>Kariyer kaydı</strong><small>Başka cihaza taşımak için dışa aktar.</small></div><div class="row"><button class="btn" data-a="export">Dışa aktar</button><button class="btn" data-a="import">Yükle</button></div></div>` : ''}
      <div class="row"><button class="btn" data-a="tour-start">Tanıtım turunu yeniden göster</button><button class="btn" data-a="set-reset">Varsayılanlara dön</button></div>`;
  }
  const GUIDE = [
    ['Hafta akışı', 'Her hafta bir lig maçı oynanır; bazı haftaların öncesinde kupa ya da Kıta Kupası maçı vardır. “Devam et” maç öncesi ekranını açar. Maçtan sonra hafta kapanır: antrenman, finans, transfer teklifleri ve yeni mesajlar işlenir.'],
    ['Gelen kutusu ve kararlar', 'Çalışanların, basın, oyuncular ve yönetim sana yazar. Karar isteyen mesajlara zamanında cevap ver. Basın toplantıları da burada: maç öncesi, maç sonrası ve önemli transferlerden sonra basın salonuna girersin.'],
    ['Maç öncesi ve maç', 'Maç öncesi ekranında iki takımın dizilişini görür, forma seçer, takım konuşması yapar, rakibi ve maç planını incelersin. Maçta taktik ve oyuncu değiştirebilir, “Bağır” ile 10 dakikalık talimat verebilir, devre arasında soyunma odası konuşması yapabilir, hakeme itiraz edebilirsin.'],
    ['Basın toplantıları', 'Kalıcı gazeteciler var; her birinin bir tarzı ve seninle bir ilişkisi bulunur. Cevapların taraftar, yönetim ve oyuncu moralini etkiler. Katılmadığın toplantılar tepki çeker.'],
    ['Soyunma odası', 'Her oyuncunun bir kişiliği vardır (lider, profesyonel, sinirli, sessiz, neşeli). Sinirli ve mutsuz oyuncular ortamı bozar, neşeliler moral verir, lider kaptan uyumu artırır. Grupları ve liderlerini Kadro sayfasında görürsün.'],
    ['Transfer ve sözleşmeler', 'Oyuncu alırken ya da sözleşme uzatırken menajerle maaş, süre ve imza parası pazarlığı yaparsın; menajerin sabrı sınırlıdır. İzleme listesine eklediğin oyuncuların durumu değişince haber alırsın; scout görevleriyle istediğin profilde oyuncu aratırsın.'],
    ['Antrenman', 'Haftalık takvimi gün gün planlarsın: taktik uyumu, fiziksel ve teknik gelişimi, dinlenme kondisyonu ve morali, maç hazırlığı sıradaki maçı etkiler. Bireysel hedef ile bir oyuncunun belirli özelliğini, mentörlük ile bir gencin gelişimini hızlandırırsın.'],
    ['Kulüp', 'Tesisler sekmesinde kampüs haritası, tesis seviyeleri, uzun vadeli projeler ve yurt dışı akademi; Stadyum sekmesinde koltuk deseni, bilet ve kombine fiyatı, stat adı sponsoru; Forma ve sponsor sekmesinde forma tasarımı ve forma sponsoru; Maliye sekmesinde sezonluk gelir-gider ve ek bütçe talebi var.'],
    ['Taraftar ve tribün', 'Her kulübün tribün kimliği farklıdır; pankartlar maçın durumuna göre seçilir: derbi, şampiyonluk yarışı, küme hattı, kupa, oyuncuya özel. Yönetim ve teknik direktör kötü gidiyorsa tribün “YÖNETİM İSTİFA!” diye protestoya döner ve yönetim güveni düşer.'],
    ['Sezon sonu', 'Ödüller açıklanır, kulübünde 40 maça ulaşan oyuncular efsaneler arasına girer. Başarılı olursan iş teklifleri gelir; yönetim güveni sıfıra yaklaşırsa görevden alınırsın.']
  ];
  const guideHtml = () => `<h2>Rehber</h2><div class="guide">${GUIDE.map(([h, t], i) => `<details ${i === 0 ? 'open' : ''}><summary>${h}</summary><p>${t}</p></details>`).join('')}</div>`;
  function gameMenu(panel) {
    U.gmPanel = panel || null;
    modal(panel ? `<button class="link back-l" data-a="gm" data-v="">‹ Menü</button>${panelHtml(panel, 'game')}` : `<h3>Oyun menüsü</h3>
      <nav class="gm-list"><button class="mbtn" data-a="close"><span>Oyuna dön</span></button>
      <button class="mbtn" data-a="save-now"><span>Kaydet</span><small>${FM.slot()}. yuva</small></button>
      <button class="mbtn" data-a="gm" data-v="slots"><span>Kayıt yuvaları</span></button>
      <button class="mbtn" data-a="gm" data-v="settings"><span>Ayarlar</span></button>
      <button class="mbtn" data-a="gm" data-v="guide"><span>Rehber</span></button>
      <button class="mbtn" data-a="export"><span>Kaydı dışa aktar</span></button>
      <button class="mbtn danger" data-a="quit"><span>Ana menüye dön</span><small>Kariyerin kaydedilir</small></button></nav>`, !!panel);
  }
  UI.openSettings = () => gameMenu('settings');
  const reopen = () => { if (FM.G && !$('modal').hidden) gameMenu(U.gmPanel); else render(); };
  Object.assign(acts, {
    menu: () => gameMenu(), gm: d => gameMenu(d.v),
    'to-menu': () => { U.screen = null; U.menuPanel = null; render(); },
    'menu-panel': d => { U.menuPanel = U.menuPanel === d.v ? null : d.v; render(); },
    'slot-new': d => { U.newSlot = +d.v; U.screen = 'new'; closeModal(); if (FM.G) { forceSave(); FM.close(); } render(); window.scrollTo(0, 0); },
    'slot-load': d => { closeModal(); if (FM.G) forceSave(); const g = FM.useSlot(+d.v); if (!g) return toast('Bu yuvada kayıt yok.', 'bad'); U.view = 'home'; U.hist = ['home']; U.hi = 0; U.shownBal = null; U.screen = null; U.menuPanel = null; render(); window.scrollTo(0, 0); toast(`${me().name} kariyeri yüklendi.`, 'good'); },
    'slot-del': d => { U.delSlot = +d.v; reopen(); }, 'slot-del-no': () => { U.delSlot = null; reopen(); },
    'slot-del-yes': d => { const open = FM.G && +d.v === FM.slot(); FM.deleteSlot(+d.v); U.delSlot = null; toast('Kayıt silindi.'); if (open) { closeModal(); render(); } else reopen(); },
    'save-now': () => { forceSave(); toast(`${FM.slot()}. yuvaya kaydedildi.`, 'good'); },
    quit: () => { forceSave(); FM.close(); closeModal(); U.screen = null; U.menuPanel = null; render(); window.scrollTo(0, 0); },
    'set-vol': (d, el) => { FM.Settings.set('vol', +el.value); const s = el.closest('.set-row').querySelector('small'); if (s) s.textContent = Math.round(el.value * 100) + '%'; },
    'sound-set2': () => { FM.Audio.init(); FM.Audio.toggle(); reopen(); },
    'set-speed': d => { FM.Settings.set('speed', +d.v); reopen(); },
    'set-tog': (d, el) => { FM.Settings.set(d.k, el.checked); if (d.k === 'ticker' && FM.G) render(true); },
    'set-reset': () => { FM.Settings.reset(); reopen(); toast('Ayarlar sıfırlandı.'); },
    'tour-start': () => { closeModal(); if (!FM.G) { toast('Tur bir kariyer açıkken gösterilir.'); return; } U.tourStep = 0; go('home'); },
    'tour-next': () => { U.tourStep++; render(true); }, 'tour-skip': () => endTour()
  });
  const TOUR = [
    ['[data-a="play"].gobtn', 'Devam et', 'Haftayı buradan ilerletirsin. Maç öncesi ekranında forma, takım konuşması ve rakip analizi seni bekler.'],
    ['.mainnav [data-v="home"]', 'Ana sayfa ve gelen kutusu', 'Çalışanların, basın ve yönetim sana buradan yazar. Kararları ve basın toplantılarını kaçırma.'],
    ['.mainnav [data-v="squad"]', 'Takım', 'Kadro ve soyunma odası, taktik, antrenman takvimi, bireysel hedef ve mentörlük, altyapı.'],
    ['.mainnav [data-v="table"]', 'Dünya', 'Lig, fikstür ve kupa, Kıta Kupası ve istatistik merkezi.'],
    ['.mainnav [data-v="transfer"]', 'Transfer', 'Oyuncu ara, izleme listesine ekle, scout görevine gönder; menajerle maaş pazarlığı yap.'],
    ['.mainnav [data-v="club"]', 'Kulüp', 'Tesis kampüsü ve projeler, stadyum ve bilet, forma ve sponsorlar, maliye.'],
    ['[data-a="menu"]', 'Oyun menüsü', 'Kaydetme, kayıt yuvaları, ayarlar ve rehber burada. İyi şanslar hocam!']
  ];
  function endTour() { U.tourStep = null; FM.Settings.set('tourDone', true); const t = $('tour'); if (t) t.remove(); }
  UI.after = function () {
    const old = $('tour'); if (old) old.remove();
    if (U.tourStep == null || !FM.G || FM.G.phase) return;
    if (U.tourStep >= TOUR.length) return endTour();
    const [sel, h, txt] = TOUR[U.tourStep], el = document.querySelector(sel);
    if (!el || !el.offsetParent) { U.tourStep++; return UI.after(); }
    const r = el.getBoundingClientRect(), d = document.createElement('div');
    d.id = 'tour'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Tanıtım turu');
    const below = r.bottom + 190 < window.innerHeight, left = Math.max(12, Math.min(window.innerWidth - 332, r.left + r.width / 2 - 160));
    d.innerHTML = `<div class="tour-hole" style="left:${r.left - 6}px;top:${r.top - 6}px;width:${r.width + 12}px;height:${r.height + 12}px"></div>
      <div class="tour-tip" style="left:${left}px;${below ? `top:${r.bottom + 14}px` : `bottom:${window.innerHeight - r.top + 14}px`}"><small>${U.tourStep + 1}/${TOUR.length}</small><strong>${h}</strong><p>${txt}</p>
      <div class="row end"><button class="btn" data-a="tour-skip">Turu geç</button><button class="btn primary" data-a="tour-next">${U.tourStep === TOUR.length - 1 ? 'Bitir' : 'Sonraki'}</button></div></div>`;
    document.body.appendChild(d);
  };

  /* ================= 5: Maç öncesi ekranı ================= */
  const kitOf = (t, k) => (t.id === FM.G.teamId && FM.G.kits ? FM.G.kits[k] : null);
  const kitFill = (t, k) => (kitOf(t, k) ? kitOf(t, k).c1 : k === 2 ? '#1b2433' : k ? t.c2 : t.c1);
  const kitLine = (t, k) => (kitOf(t, k) ? kitOf(t, k).c2 : k ? t.c1 : t.c2);
  const TALKS = [['calm', 'Sakin olun, kendi oyunumuzu oynayalım', 'Her durumda küçük bir moral artışı.'], ['fire', 'Bugün tarih yazacağız!', 'Güçlü rakibe karşı çok etkili, zayıf rakibe karşı sönük kalır.'], ['press', 'Kaybetmek yok, sonuç istiyorum', 'Favoriyken işe yarar; değilken takımı geriyebilir.'], ['trust', 'Size güveniyorum', 'Moral düşükken takımı toparlar.']];
  function slotAbbr(s) {
    const [r, y, x] = s;
    if (r === 'GK') return 'KL';
    if (r === 'DEF') return x < .3 ? (y > .25 ? 'SLKB' : 'SLB') : x > .7 ? (y > .25 ? 'SĞKB' : 'SĞB') : 'STP';
    if (r === 'MID') return x < .25 ? 'SLO' : x > .75 ? 'SĞO' : y < .41 ? 'DOS' : y > .58 ? 'OOS' : 'MO';
    return x < .3 ? 'SLK' : x > .7 ? 'SĞK' : 'SNT';
  }
  const shortName = n => { const a = n.split(' '); return (a.length > 1 ? a[0][0] + '. ' + a.slice(1).join(' ') : n).toLocaleUpperCase('tr'); };
  const xiStr = t => { const xi = t.lineup.filter(x => x != null).map(P); return xi.length ? Math.round(xi.reduce((s, p) => s + p.ovr, 0) / xi.length) : 0; };
  function preBoard(t, k) {
    const slots = FM.FORMATIONS[t.formation], fill = kitFill(t, k), ink = lumH(fill) > 150 ? '#14202f' : '#ffffff', line = kitLine(t, k);
    return `<div class="pb-wrap"><div class="pb"><i class="pb-box t"></i><i class="pb-box b"></i><i class="pb-c"></i><i class="pb-m"></i>${slots.map((s, i) => {
      const p = t.lineup[i] != null ? P(t.lineup[i]) : null; if (!p) return '';
      const gk = s[0] === 'GK';
      return `<button class="pb-t" data-a="player" data-id="${p.id}" style="left:${s[2] * 100}%;top:${86 - (s[1] || -.08) * 76}%;--f:${gk ? '#f3efe4' : fill};--l:${gk ? '#14202f' : line};--i:${gk ? '#14202f' : ink}" aria-label="${esc(p.name)}, ${slotAbbr(s)}"><span class="pb-n">${p.num}</span><span class="pb-nm">${esc(shortName(p.name))}${t.cap === p.id ? ' <i class="cap" title="Kaptan">K</i>' : ''}</span><span class="pb-r ${gk ? 'gk' : ''}">${slotAbbr(s)}</span></button>`;
    }).join('')}</div></div>`;
  }
  function preScreen() {
    const G = FM.G, pr = U.pre, fx = pr.ctx.fx, h = T(fx.h), a = T(fx.a), mine = fx.h === G.teamId ? 0 : 1, opp = mine ? h : a, myT = me();
    const dt = FM.fmtDate(G.season, G.week), wx = fx.wx || { t: 'clear', n: 0 };
    const kits = [0, 1, 2].map(k => `<button class="kit ${pr.kit === k ? 'on' : ''}" data-a="pre-kit" data-v="${k}" style="--f:${kitFill(myT, k)};--l:${kitLine(myT, k)}" aria-label="${['İç saha', 'Deplasman', 'Üçüncü'][k]} forması" aria-pressed="${pr.kit === k}"></button>`).join('');
    const kOf = (t, i) => (i === mine ? pr.kit : (() => { const uf = kitFill(myT, pr.kit); return cdist(uf, t.c1) < 150 ? (cdist(uf, t.c2) < 150 ? 2 : 1) : 0; })());
    const team = (t, i) => `<div class="pre-team ${i ? 'r' : ''}">${FM.crest(t, 76)}<h2>${esc(t.name)}</h2><span class="pre-f">${t.formation}</span>${t.id === G.teamId ? '<em class="pre-me">Senin takımın</em>' : `<em class="pre-c">${esc(FM.coachOf ? FM.coachOf(t.id) : '')}</em>`}</div>`;
    const patch = (t, i) => `<div class="patch ${i ? 'r' : ''}" style="--f:${kitFill(t, kOf(t, i))};--l:${kitLine(t, kOf(t, i))};--i:${lumH(kitFill(t, kOf(t, i))) > 150 ? '#14202f' : '#ffffff'}" aria-label="Takım gücü ${xiStr(t)}"><span>GÜÇ</span><b>${xiStr(t)}</b></div>`;
    const conf = (G.inbox || []).find(m => m.conf && !m.conf.done && m.conf.type === 'pre');
    const talkPanel = pr.panel === 'talk' ? `<div class="pre-panel" role="dialog" aria-label="Takım konuşması"><div class="pre-card"><h3>Takım konuşması</h3><p class="muted">Soyunma odasında son sözler. Bir kez seçebilirsin.</p><div class="mail-opts col">${TALKS.map(([k, n, d]) => `<button class="mail-opt col" data-a="pre-talk" data-v="${k}"><strong>${n}</strong><small>${d}</small></button>`).join('')}</div><button class="link" data-a="pre-panel" data-v="">Vazgeç</button></div></div>` : '';
    const asstPanel = pr.panel === 'asst' && UI.asstHtml ? `<div class="pre-panel" role="dialog" aria-label="Yardımcı antrenör"><div class="pre-card">${UI.asstHtml(opp.id, mine === 0)}<button class="link" data-a="pre-panel" data-v="">Kapat</button></div></div>` : '';
    return `<div class="pre" style="--h1:${h.c1};--a1:${a.c1}"><div class="pre-bg" aria-hidden="true"></div>${patch(h, 0)}${patch(a, 1)}
      <header class="pre-head">${team(h, 0)}
        <div class="pre-mid"><img src="${pr.ctx.mid ? 'assets/trophy.svg' : 'assets/logo.svg'}" alt="" width="54" height="54"><p class="eyebrow">${pr.ctx.mid ? esc(pr.ctx.name) : FM.DIV_TR[myT.div] + ' · ' + (G.week + 1) + '. hafta'}</p>${h.rival === a.id ? '<p class="derby-b">Derbi</p>' : ''}<p class="pre-st">${esc(pr.ctx.opts.neutral ? 'Tarafsız saha' : h.stadium)}</p><p class="pre-when">${({ Pazar: 'PAZ', Pazartesi: 'PZT', 'Salı': 'SAL', 'Çarşamba': 'ÇAR', 'Perşembe': 'PER', Cuma: 'CUM', Cumartesi: 'CMT' })[dt.g] || dt.g} ${dt.d} · ${wx.n ? '20:00' : '17:00'}</p><p class="pre-wx">${FM.WX_TR[wx.t]}${wx.n ? ' · Gece' : ''}</p>${pr.ban && FM.Banners ? FM.Banners.preHtml(pr.ban) : ''}</div>
        ${team(a, 1)}</header>
      <div class="pre-body">${preBoard(h, kOf(h, 0))}
        <nav class="pre-menu" aria-label="Maç öncesi">
          <div class="pre-kits"><span>Forma</span>${kits}</div>
          <button data-a="pre-tactics">Kadro ve taktik</button>
          <button data-a="pre-panel" data-v="talk" ${pr.talk ? 'disabled' : ''}>Takım konuşması${pr.talk ? ' ✓' : ''}</button>
          <button data-a="team" data-id="${opp.id}">Rakip ve maç planı</button>
          ${FM.Depth ? `<button data-a="pre-panel" data-v="asst">Yardımcının önerileri</button>` : ''}
          ${conf ? `<button class="prs" data-a="press-open" data-id="${conf.id}">Basın toplantısı <i class="dot" aria-label="bekliyor"></i></button>` : ''}
          <button class="go" data-a="pre-go">Onayla ${FM.icon('play')}</button>
          <button class="back" data-a="pre-close">‹ Geri dön</button>
          ${pr.talk ? `<p class="pre-talk-res">${FM.icon('check')} ${esc(pr.talkRes)}</p>` : ''}</nav>
        ${preBoard(a, kOf(a, 1))}</div>${talkPanel}${asstPanel}</div>`;
  }
  function showPre() { const el = $('pre'); el.innerHTML = preScreen(); el.hidden = false; document.body.classList.add('noscroll'); }
  function closePre() { $('pre').hidden = true; $('pre').innerHTML = ''; document.body.classList.remove('noscroll'); }
  UI.preMatch = ctx => {
    if (FM.Settings && FM.Settings.get('prematch') === false) return UI.startMatch(ctx, {});
    const G = FM.G, t = me(), fx = ctx.fx, opp = T(fx.h === G.teamId ? fx.a : fx.h); FM.autoPick(opp);
    const key = G.season + ':' + G.week + ':' + (ctx.mid || 'l');
    if (!U.pre || U.pre.key !== key) {
      const away = fx.a === G.teamId, hc = T(fx.h).c1, f0 = kitFill(t, 0), f1 = kitFill(t, 1);
      U.pre = { key, kit: away && cdist(f0, hc) < 150 ? (cdist(f1, hc) < 150 ? 2 : 1) : 0, talk: null, talkRes: '', panel: '', ban: FM.Banners ? FM.Banners.forMatch(fx, { cup: !!ctx.opts.cup, comp: ctx.mid === 'euro' ? 'euro' : '' }) : null };
    }
    U.pre.ctx = ctx; U.pre.panel = '';
    showPre();
  };
  function teamTalk(k) {
    const G = FM.G, pr = U.pre, t = me(), fx = pr.ctx.fx, opp = T(fx.h === G.teamId ? fx.a : fx.h);
    const xi = t.lineup.filter(x => x != null).map(P), avgM = xi.reduce((s, p) => s + p.mor, 0) / xi.length;
    const edge = xiStr(t) - xiStr(opp) + (fx.h === G.teamId ? 2 : -2), fav = edge >= 2, dog = edge <= -2;
    let d, msg;
    if (k === 'calm') { d = 3; msg = 'Oyuncular sakin ve odaklı.'; }
    else if (k === 'fire') { d = dog ? 9 : fav ? 1 : 5; msg = dog ? 'Soyunma odası ayağa kalktı, oyuncular sahaya koşuyor!' : fav ? 'Oyuncular bu sözleri abartılı buldu.' : 'Konuşman takımı ateşledi.'; }
    else if (k === 'press') { d = fav ? 7 : R() < .5 ? -4 : 2; msg = fav ? 'Takım sorumluluğu üstlendi, galibiyete kilitlendi.' : d < 0 ? 'Baskı ters tepti, bazı oyuncular gergin.' : 'Mesaj alındı ama oyuncular biraz gergin.'; }
    else { d = avgM < 62 ? 8 : 2; msg = avgM < 62 ? 'Güvenin takımı toparladı.' : 'Oyuncular teşekkür etti, zaten iyi durumdalar.'; }
    for (const p of xi) p.mor = Math.max(20, Math.min(100, p.mor + d));
    FM.save(); pr.talk = k; pr.talkRes = `${msg} (ilk 11 morali ${d > 0 ? '+' : ''}${d})`; pr.panel = '';
    toast(pr.talkRes, d > 0 ? 'good' : 'bad');
  }
  Object.assign(acts, {
    'pre-kit': d => { U.pre.kit = +d.v; showPre(); },
    'pre-panel': d => { U.pre.panel = d.v; showPre(); },
    'pre-talk': d => { teamTalk(d.v); showPre(); },
    'pre-go': () => { const pr = U.pre; closePre(); U.pre = null; UI.startMatch(pr.ctx, { kit: pr.kit, ban: pr.ban }); },
    'pre-close': () => closePre(),
    'pre-tactics': () => { closePre(); U.preBack = true; go('tactics'); },
    'pre-back': () => { U.preBack = false; UI.playMatch(); }
  });
  const vTactics = VIEWS.tactics;
  VIEWS.tactics = () => (U.preBack && U.pre ? `<div class="pre-return"><span>Maç öncesi hazırlık sürüyor. Değişiklikler otomatik kaydedilir.</span><button class="btn primary" data-a="pre-back">‹ Maç öncesine dön</button></div>` : '') + vTactics();

  /* ================= 8: Basın salonu ve gelen kutusu ================= */
  const confMsg = id => (FM.G.inbox || []).find(x => x.id === id);
  const fxChips = parts => parts.map(([n, v]) => `<span class="fxc ${v > 0 ? 'up' : 'down'}">${esc(n)} ${v > 0 ? '+' : '−'}${Math.abs(v)}</span>`).join('');
  const confLastDay = m => FM.fmtDate(m.s, m.w + (m.conf.type === 'pre' ? 0 : 1)).d;
  function pressHtml() {
    const G = FM.G, m = confMsg(U.press.id), c = m.conf, last = U.press.last;
    const qi = last ? last.qi : Math.min(c.cur, c.qs.length - 1), q = c.qs[qi], j = G.journos[q.j], first = j.name.split(' ')[0];
    const { svg, tip } = FM.Press.room(m, qi);
    const answers = q.a.map(([t], i) => { const sel = last ? q.ans === i : U.press.pick === i; return `<button class="pr-a ${sel ? 'on' : ''}" data-a="press-pick" data-v="${i}" role="radio" aria-checked="${sel}" ${last ? 'disabled' : ''}>${sel && last ? FM.icon('check') : ''}${esc(t)}</button>`; }).join('');
    const foot = last
      ? `<div class="pr-res"><p>${FM.icon('press')} ${esc(q.res)}</p><div class="fxs">${fxChips(q.fx)}</div><button class="btn primary" data-a="press-next">${c.done ? 'Toplantıyı bitir' : 'Sonraki soru'} ${FM.icon('play')}</button></div>`
      : `<div class="pr-foot"><button class="btn" data-a="press-close">Sonra</button><button class="btn primary" data-a="press-answer" ${U.press.pick == null ? 'disabled' : ''}>Cevabı ver</button>${U.press.pick == null ? '<small class="muted">Önce bir cevap seç</small>' : ''}</div>`;
    const nPrev = j.n - (last ? 1 : 0);
    return `<div class="pr"><header class="pr-h"><button class="btn icon" data-a="press-close" aria-label="Geri">‹</button><div><h2>Basın toplantısı</h2><p class="muted">${esc(c.sub)}</p></div></header>
      <div class="pr-room">${svg}${tip ? `<div class="pr-tip" style="left:${tip.x}%;top:${tip.y}%"><strong>${esc(j.name)}</strong><span>${esc(j.outlet)} · ${j.style} · İlişki: <b>${FM.Press.relTxt(j.rel)}</b></span><small>${nPrev ? 'Daha önce ' + nPrev + ' kez söz aldı' : 'İlk kez söz alıyor'}</small></div>` : ''}</div>
      <section class="pr-panel"><div class="pr-top"><p><b>${esc(G.manager.toLocaleUpperCase('tr'))}</b> Buyurun ${esc(first)}, sizi dinliyorum.</p><small class="muted">Soru ${qi + 1}/${c.qs.length} · Son gün ${confLastDay(m)}</small></div>
        <blockquote class="pr-q"><span class="qm" aria-hidden="true">“</span><div><small>${esc(j.name)} · ${esc(j.outlet)}</small><p>${esc(q.q)}</p></div></blockquote>
        <div class="pr-as" role="radiogroup" aria-label="Cevabın">${answers}</div>${foot}</section></div>`;
  }
  function showPress() { const el = $('press'); el.innerHTML = pressHtml(); el.hidden = false; document.body.classList.add('noscroll'); }
  function openPress(id) { closeModal(); const m = confMsg(id); if (!m || !m.conf) return; if (m.conf.done) { U.mail = m.id; go('inbox'); return; } U.press = { id, pick: null, last: null }; m.read = true; FM.save(); showPress(); }
  function closePress() { $('press').hidden = true; $('press').innerHTML = ''; U.press = null; if ($('pre').hidden) { document.body.classList.remove('noscroll'); render(true); } else showPre(); }
  UI.confDetail = m => {
    const c = m.conf;
    return `<p class="mail-lbl">${c.qs.length} soru · ${c.type === 'pre' ? 'Maç öncesi' : c.type === 'post' ? 'Maç sonrası' : 'Transfer'}</p>
      <ol class="cf-qs">${c.qs.map(q => { const j = FM.G.journos[q.j]; return `<li class="${q.ans != null ? 'done' : ''}"><small>${esc(j.name)} · ${esc(j.outlet)}</small><p>${esc(q.q)}</p>${q.ans != null ? `<p class="cf-a">${FM.icon('check')} ${esc(q.a[q.ans][0])}</p><div class="fxs">${fxChips(q.fx || [])}</div>` : ''}</li>`; }).join('')}</ol>
      <div class="mail-foot"><span class="${c.done ? 'done' : 'wait'}">${FM.icon('clock')} ${c.done ? esc((c.exp ? 'Kaçırıldı. ' : 'Tamamlandı. ') + (m.res || '')) : `Basın seni bekliyor · son gün ${confLastDay(m)}`}</span>${c.done ? '' : `<span class="row"><button class="btn primary" data-a="press-open" data-id="${m.id}">${c.cur ? 'Toplantıya dön' : 'Basın salonuna gir'}</button></span>`}</div>`;
  };
  Object.assign(acts, {
    'press-open': d => openPress(+d.id),
    'press-close': () => closePress(),
    'press-pick': d => { U.press.pick = +d.v; showPress(); },
    'press-answer': () => { if (U.press.pick == null) return; const m = confMsg(U.press.id), qi = m.conf.cur, r = FM.Press.answer(U.press.id, U.press.pick); if (r) { U.press.last = { qi }; U.press.pick = null; showPress(); } },
    'press-next': () => { const m = confMsg(U.press.id); U.press.last = null; if (m.conf.done) { toast('Basın toplantısı tamamlandı.', 'good'); closePress(); } else showPress(); }
  });
  UI.confBtn = () => { const m = (FM.G.inbox || []).find(x => x.conf && !x.conf.done && x.conf.type === 'post'); return m ? `<button class="btn" data-a="press-open" data-id="${m.id}">${FM.icon('press')} Basın toplantısına git</button>` : ''; };

  /* ================= 9: Sözleşme pazarlığı ================= */
  function negHtml(pid) {
    const s = C.NEG[pid], p = P(pid), o = s.offer, d = s.dem, sign = s.kind === 'sign', fee = sign ? (FM.Depth ? FM.Depth.feeOf(p, o) : FM.askPrice(p)) : 0;
    const step = (k, l, val, sub) => `<div class="neg-row"><span><strong>${l}</strong><small>${sub}</small></span><div class="stp"><button class="btn icon" data-a="neg-adj" data-id="${pid}" data-k="${k}" data-v="-1" ${s.done ? 'disabled' : ''} aria-label="${l} azalt">−</button><b>${val}</b><button class="btn icon" data-a="neg-adj" data-id="${pid}" data-k="${k}" data-v="1" ${s.done ? 'disabled' : ''} aria-label="${l} artır">+</button></div></div>`;
    return `<div class="pm-head">${FM.avatar(p, 64)}<div><h3>${sign ? 'Transfer görüşmesi' : 'Sözleşme görüşmesi'}</h3><p>${esc(p.name)} · ${p.age} yaş · ${FM.POS_LONG[p.pos]}</p><p class="muted">Şu anki maaş ${money(p.wage)}/hafta${!sign ? ` · ${p.con} sezon kaldı` : ''}</p></div><div class="pm-ovr"><span>Menajerin sabrı</span><span class="pat">${[0, 1, 2].map(i => `<i class="${i < s.pat ? 'on' : ''}"></i>`).join('')}</span></div></div>
      <blockquote class="neg-msg ${s.done === 'ok' ? 'ok' : s.done === 'walk' ? 'bad' : ''}">${esc(s.msg)}</blockquote>
      ${sign ? `<p class="price">${p.tid == null ? 'İmza parası (serbest oyuncu)' : FM.isClause(p) ? 'Serbest kalma bedeli' : 'Bonservis bedeli'}: <b>${money(fee)}</b> · kulübe ödenir</p>` : ''}
      ${step('wage', 'Haftalık maaş', money(o.wage), `Talep: ${money(d.wage)}`)}${step('years', 'Sözleşme süresi', o.years + ' yıl', `Tercih: ${d.years} yıl`)}${step('bonus', 'İmza parası', money(o.bonus), `Talep: ${money(d.bonus)}`)}${UI.negExtra ? UI.negExtra(s, p, step) : ''}
      <p class="muted">Bugünkü toplam maliyet: <b>${money(fee + o.bonus)}</b> · bütçe ${money(FM.G.fin.balance)}</p>
      <div class="row end">${s.done === 'ok' ? `<button class="btn primary" data-a="neg-sign" data-id="${pid}">${sign ? 'Transferi tamamla' : 'Sözleşmeyi imzala'}</button>` : s.done ? '<button class="btn" data-a="close">Kapat</button>' : `<button class="btn" data-a="player" data-id="${pid}">Vazgeç</button><button class="btn primary" data-a="neg-send" data-id="${pid}">Teklifi sun</button>`}</div>`;
  }
  Object.assign(acts, {
    'neg-open': d => {
      const p = P(+d.id);
      if (!C.negCan(p.id)) return toast('Menajer bu hafta görüşmek istemiyor.', 'bad');
      if (d.k === 'sign') { const err = FM.canDeal(p); if (err) return toast(err, 'bad'); if (FM.G.fin.balance < FM.askPrice(p)) return toast('Bütçe yetersiz.', 'bad'); }
      else { if (p.con >= 4) return toast('Sözleşmesi zaten uzun.', 'bad'); if (p.mor < 35) return toast(`${p.name} mutsuz, yeni sözleşme görüşmek istemiyor.`, 'bad'); }
      C.negStart(p.id, d.k); modal(negHtml(p.id), true);
    },
    'neg-adj': d => { const s = C.NEG[+d.id], o = s.offer, v = +d.v; if (d.k === 'wage') o.wage = Math.max(500, Math.round(o.wage * (1 + v * .05) / 100) * 100); else if (d.k === 'years') o.years = Math.max(1, Math.min(5, o.years + v)); else o.bonus = Math.max(0, Math.round((o.bonus + v * Math.max(10000, s.dem.bonus * .1)) / 10000) * 10000); modal(negHtml(+d.id), true); },
    'neg-send': d => { C.negOffer(+d.id); modal(negHtml(+d.id), true); },
    'neg-sign': d => { const s = C.NEG[+d.id], terms = { ...s.offer }, r = s.kind === 'sign' ? FM.buy(+d.id, false, terms) : FM.renew(+d.id, terms); say(r); if (r.ok) { delete C.NEG[+d.id]; closeModal(); render(true); } }
  });

  /* ================= 10–12: Oyuncu penceresi ekleri, soyunma odası, izleme ve scout ================= */
  UI.watchBtn = p => (p.tid === FM.G.teamId || p.y ? '' : `<button class="star ${FM.G.watch.includes(p.id) ? 'on' : ''}" data-a="watch" data-id="${p.id}" aria-label="İzleme listesi" title="İzleme listesine ekle/çıkar">★</button>`);
  UI.pmExtra = p => {
    const pr = C.PER[C.per(p)], h = (p.hist || []).slice().reverse(), ca = C.clubApps(p), pair = FM.G.mentors.find(x => x.y === p.id || x.m === p.id);
    return `<p class="chips"><span class="chip per-${C.per(p)}" title="${pr[1]}">Kişilik: ${pr[0]}</span>${p.tf ? `<span class="chip on">Bireysel hedef: ${C.ATTR[p.tf]}</span>` : ''}${pair ? `<span class="chip">${pair.m === p.id ? 'Mentor: ' + esc(P(pair.y).name) : 'Mentoru: ' + esc(P(pair.m).name)}</span>` : ''}${ca.apps ? `<span class="chip">Kulübünde ${ca.apps} maç · ${ca.g} gol</span>` : ''}</p>
      ${h.length ? `<details class="pm-hist"><summary>Kariyer geçmişi (${h.length} sezon)</summary><div class="scroll"><table class="tbl"><thead><tr><th>Sezon</th><th class="l">Kulüp</th><th>Maç</th><th>Gol</th><th>Asist</th><th>Ort.</th></tr></thead><tbody>${h.map(x => `<tr><td>${x.s}</td><td class="l">${T(x.tid) ? esc(T(x.tid).name) : '—'}</td><td>${x.apps}</td><td>${x.g}</td><td>${x.as}</td><td>${fmtR(x.avg)}</td></tr>`).join('')}</tbody></table></div></details>` : ''}`;
  };
  acts.watch = (d, el) => { const on = C.toggleWatch(+d.id); el.classList.toggle('on', on); toast(on ? 'İzleme listesine eklendi.' : 'İzleme listesinden çıkarıldı.'); if (U.view === 'transfer') render(true); };
  const vSquad = VIEWS.squad;
  VIEWS.squad = () => {
    const gr = C.groups();
    return vSquad() + `<section class="card room-card"><h2>Soyunma odası</h2><p class="muted">Kişilikler ortamı belirler: sinirli ve mutsuz oyuncular moral düşürür, neşeliler moral verir, lider bir kaptan takım uyumunu artırır, profesyoneller daha hızlı gelişir.</p>
      <div class="groups">${gr.map(g => `<div class="grp"><div><strong>${g.n}</strong><span>${g.ps.length} oyuncu · moral ${g.mor}</span></div><p>Lideri: <button class="lnk" data-a="player" data-id="${g.lead.id}">${esc(g.lead.name)}</button></p><div class="pers">${g.ps.slice(0, 9).map(p => `<span class="chip per-${C.per(p)}" title="${C.PER[C.per(p)][1]}">${esc(p.name.split(' ').pop())}</span>`).join('')}</div></div>`).join('')}</div>
      <p class="chips legend">${Object.keys(C.PER).map(k => `<span class="chip per-${k}" title="${C.PER[k][1]}">${C.PER[k][0]}</span>`).join('')}</p></section>`;
  };
  const vTransfer = VIEWS.transfer;
  VIEWS.transfer = () => {
    const G = FM.G, wl = G.watch.map(P).filter(Boolean), st = G.stask;
    const sel = (id, opts, v) => `<select id="${id}">${opts.map(([k, n]) => `<option value="${k}" ${v == k ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
    return `<div class="grid2"><section class="card"><h2>Scout görevi</h2><p class="muted">Scout ekibi (kalite ${C.scoutQ()}: teknik ekip ve gözlem ağı) aradığın profilde oyuncuları 2 haftada bulur ve tam raporlarını çıkarır.</p>
        ${st ? `<p class="ht-res">Görev sürüyor: ${st.pos === 'ALL' ? 'tüm mevkiler' : FM.POS_LONG[st.pos]}, en fazla ${st.maxAge} yaş, potansiyel ${st.minPot}+ · ${st.w} hafta kaldı.</p>`
          : `<div class="st-form"><label>Mevki ${sel('stPos', [['ALL', 'Tümü'], ['GK', 'Kaleci'], ['DEF', 'Defans'], ['MID', 'Orta saha'], ['FWD', 'Forvet']], 'ALL')}</label><label>En fazla yaş ${sel('stAge', [[19, 19], [21, 21], [23, 23], [26, 26], [30, 30], [40, 'Fark etmez']], 23)}</label><label>En az potansiyel ${sel('stPot', [[60, 60], [65, 65], [70, 70], [75, 75], [80, 80], [85, 85]], 70)}</label><button class="btn primary" data-a="st-go">Göreve gönder · ${money(50000)}</button></div>`}</section>
      <section class="card"><h2>İzleme listesi <small class="muted">${wl.length}</small></h2>${wl.length ? `<div class="scroll"><table class="tbl pls">${P_HEAD(true)}<tbody>${playerRows(wl, true)}</tbody></table></div>` : '<p class="muted">Bir oyuncunun penceresindeki ★ ile listeye ekle. Transfer olunca ya da sözleşmesi bitmek üzereyken haber alırsın.</p>'}</section></div>` + vTransfer();
  };
  acts['st-go'] = () => { say(C.scoutTask($('stPos').value, +$('stAge').value, +$('stPot').value)); render(true); };

  /* ================= 13–14: Antrenman takvimi, bireysel hedef, mentörlük ================= */
  VIEWS.training = () => {
    const G = FM.G, t = me(), tr = G.training, sc = G.sched, sq = t.players.map(P);
    const foc = [['bal', 'Dengeli', 'Her özellik eşit gelişir.'], ['att', 'Hücum', 'Şut ve hız öne çıkar.'], ['def', 'Savunma', 'Savunma ve fizik öne çıkar.'], ['fit', 'Kondisyon', 'Oyuncular daha hızlı dinlenir.']];
    const days = sc.map((k, i) => `<div class="day"><span>${C.DAYS[i]}</span><select data-a="day-set" data-i="${i}" aria-label="${C.DAYS[i]} antrenmanı">${Object.keys(C.SESS).map(s => `<option value="${s}" ${s === k ? 'selected' : ''}>${C.SESS[s][0]}</option>`).join('')}</select><small>${C.SESS[k][1]}</small></div>`).join('') + '<div class="day match"><span>Cmt</span><b>Maç günü</b></div>';
    const prep = C.schedCount('prep') + C.schedCount('sp') * .5, fs = C.focused(), free = sq.filter(p => !p.tf).sort((a, b) => a.age - b.age);
    const olds = sq.filter(p => p.age >= 27).sort((a, b) => b.age - a.age), kids = sq.filter(p => p.age <= 21).sort((a, b) => a.age - b.age), busy = new Set(G.mentors.flatMap(x => [x.m, x.y]));
    const young = sq.filter(p => p.pot > p.ovr).sort((a, b) => (b.pot - b.ovr) - (a.pot - a.ovr)).slice(0, 6);
    return `<section class="card"><h2>Haftalık antrenman takvimi</h2><div class="week">${days}</div>
        <div class="kpis sm"><div><span>Yük</span><b class="ld${tr.intensity}">${['Hafif', 'Normal', 'Yoğun'][tr.intensity]}</b></div><div><span>Taktik uyum</span><b>${Math.round(G.fam)}</b></div><div><span>Maç hazırlığı</span><b>${prep ? '+' + Math.round(prep * 12) / 10 + '%' : '—'}</b></div><div><span>Dinlenme</span><b>${C.schedCount('rest')} gün</b></div></div>
        <p class="hint">Yük takvimden hesaplanır: yoğun hafta gelişimi hızlandırır ama kondisyonu düşürür ve sakatlık riskini artırır. Taktik çalışmaları uyumu yükseltir (uyum zamanla azalır). Maç hazırlığı yalnızca sıradaki maça etki eder.</p></section>
      <section class="card"><h2>Gelişim odağı</h2><div class="opts">${foc.map(([k, n, d]) => `<button data-a="focus" data-v="${k}" class="opt ${tr.focus === k ? 'on' : ''}"><strong>${n}</strong><span>${d}</span></button>`).join('')}</div></section>
      <div class="grid2"><section class="card"><h2>Bireysel hedef <small class="muted">${fs.length}/${C.focusSlots()}</small></h2><p class="muted">Seçtiğin özellik bu oyuncunun antrenmanında öncelikli çalışılır (gelişimin yaklaşık %60'ı, gelişim hızı +%10). Kontenjan antrenman merkezi seviyesiyle artar.</p>
          ${fs.length ? `<ul class="fp-list">${fs.map(p => `<li><span><button class="lnk" data-a="player" data-id="${p.id}">${esc(p.name)}</button><small>${p.age} yaş · ${FM.POS_TR[p.pos]} · ${p.tfW || 0} haftadır</small></span><span class="fp-v">${C.ATTR[p.tf]} <b>${p.a[p.tf]}</b>${p.a[p.tf] > p.tfBase ? ` <em class="pos-v">+${p.a[p.tf] - p.tfBase}</em>` : ''}</span><button class="btn icon" data-a="tf-del" data-id="${p.id}" aria-label="${esc(p.name)} hedefini kaldır">×</button></li>`).join('')}</ul>` : ''}
          ${fs.length < C.focusSlots() ? `<div class="fp-form"><label class="sp"><span>Oyuncu</span><select id="tfP">${free.map(p => `<option value="${p.id}">${esc(p.name)} · ${p.age} · ${FM.POS_TR[p.pos]} · ${p.ovr}/${p.pot}</option>`).join('')}</select></label><label class="sp"><span>Özellik</span><select id="tfA">${Object.keys(C.ATTR).map(k => `<option value="${k}">${C.ATTR[k]}</option>`).join('')}</select></label><button class="btn primary" data-a="tf-add">Hedef ver</button></div>` : ''}</section>
        <section class="card"><h2>Mentörlük <small class="muted">${G.mentors.length}/${C.mentorSlots()}</small></h2><p class="muted">27 yaş üstü bir oyuncu 21 yaş altı bir genci yanına alır: genç daha hızlı gelişir, morali mentorununkine yaklaşır. Profesyonel ya da lider mentor en büyük etkiyi yapar ve 16 hafta sonra kişiliğini aktarabilir. Kontenjan teknik ekip binası seviyesiyle artar.</p>
          ${G.mentors.length ? `<ul class="fp-list">${G.mentors.map((x, i) => { const m = P(x.m), y = P(x.y); return `<li><span><b>${esc(m.name)}</b> → <b>${esc(y.name)}</b><small>${C.PER[C.per(m)][0]} mentor · ${x.w} hafta · gelişim +%${Math.round(C.mentorBoost(m) * 100)}</small></span><button class="btn icon" data-a="mt-del" data-v="${i}" aria-label="Eşleşmeyi bitir">×</button></li>`; }).join('')}</ul>` : ''}
          ${G.mentors.length < C.mentorSlots() ? (olds.length && kids.length ? `<div class="fp-form"><label class="sp"><span>Mentor (27+)</span><select id="mtM">${olds.filter(p => !busy.has(p.id)).map(p => `<option value="${p.id}">${esc(p.name)} · ${p.age} · ${C.PER[C.per(p)][0]}</option>`).join('')}</select></label><label class="sp"><span>Genç (21 ve altı)</span><select id="mtY">${kids.filter(p => !busy.has(p.id)).map(p => `<option value="${p.id}">${esc(p.name)} · ${p.age} · ${FM.POS_TR[p.pos]} · ${p.ovr}/${p.pot}</option>`).join('')}</select></label><button class="btn primary" data-a="mt-add">Eşleştir</button></div>` : '<p class="muted">Eşleşme için kadroda 27 yaş üstü ve 21 yaş altı oyuncu gerekir. Altyapıdan genç alabilirsin.</p>') : ''}</section></div>
      <section class="card"><h2>Altyapı</h2><p>U19 takımında ${G.youth.length} oyuncu var. Gelişimlerini izleyip hazır olanı A takıma alabilirsin.</p><button class="btn primary" data-a="tab" data-v="youth">Altyapıya git</button></section>
      <section class="card"><h2>Gelişime en açık oyuncular</h2><div class="scroll"><table class="tbl pls">${P_HEAD()}<tbody>${playerRows(young)}</tbody></table></div></section>`;
  };
  Object.assign(acts, {
    'day-set': (d, el) => { C.setDay(+d.i, el.value); render(true); },
    'tf-add': () => { if (!$('tfP') || !$('tfP').value) return; say(C.setFocus(+$('tfP').value, $('tfA').value)); render(true); },
    'tf-del': d => { C.clearFocus(+d.id); render(true); },
    'mt-add': () => { if (!$('mtM') || !$('mtM').value || !$('mtY') || !$('mtY').value) return; say(C.addMentor(+$('mtM').value, +$('mtY').value)); render(true); },
    'mt-del': d => { C.delMentor(+d.v); toast('Mentörlük eşleşmesi sona erdi.'); render(true); }
  });

  /* ================= 11: Kariyer sayfası: kulüp efsaneleri ================= */
  const vCareer = VIEWS.career;
  VIEWS.career = () => {
    const leg = FM.G.museum.leg.slice().sort((a, b) => b.apps - a.apps);
    return vCareer() + `<section class="card"><h2>Kulüp efsaneleri <small class="muted">kulüpte 40+ maç</small></h2><ol class="rank">${leg.map((l, i) => `<li><span class="wk">${i + 1}</span>${posChip(l.pos)}<span class="nm">${esc(l.name)} <small class="clubn">${esc(l.team)}</small></span><b>${l.apps} maç · ${l.g} gol</b></li>`).join('') || '<li class="muted">Senin dönemindeki oyunculardan kulübünde 40 maça ulaşanlar burada yer alır. Sezon sonlarında güncellenir.</li>'}</ol></section>`;
  };

  /* ================= 15–18: Kulüp sekmeleri ================= */
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
    const t = me(), lv = k => t.fac[k] || 1, G = FM.G, rnd = (() => { let a = t.id * 97 + 7; return () => { a = (a * 9301 + 49297) % 233280; return a / 233280; }; })();
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
    const hC = 3 + lv('tcoach') * 1.2; s += box(41, 30, 15, 9, hC, '#d7dbe0', '#9aa1ab', '#b4bac2') + box(43, 31, 4, 3, hC + .6, '#c3c9d0', '#8e959f', '#a6acb5');
    { const f = pr(54, 31, hC + 4); s += `<line x1="${f[0]}" y1="${f[1]}" x2="${f[0]}" y2="${f[1] + 22}" stroke="#555" stroke-width="1.5"/><rect x="${f[0]}" y="${f[1]}" width="12" height="8" fill="${t.c1}"/>`; }
    pos.tcoach = pr(48.5, 30, hC + 2);
    // sağlık merkezi
    const hM = 2 + lv('med'); s += box(58, 31, 11, 8, hM, '#e3e6ea', '#a0a7b0', '#bcc2c9'); { const c = pr(63.5, 35, hM); s += `<rect x="${c[0] - 5}" y="${c[1] - 2}" width="10" height="4" fill="#d33"/><rect x="${c[0] - 2}" y="${c[1] - 5}" width="4" height="10" fill="#d33"/>`; }
    pos.med = pr(63.5, 40.5);
    // gözlem ağı ofisi
    const hS = 2 + lv('scoutnet') * .8; s += box(28, 31, 11, 8, hS, '#d0d4da', '#969da7', '#b0b6be');
    for (let i = 0; i < Math.min(5, lv('scoutnet')); i++) { const d = pr(29.5 + i * 2, 32, hS + 1.5); s += `<circle cx="${d[0]}" cy="${d[1]}" r="3.2" fill="#e8ecf0" stroke="#777"/>`; }
    pos.scoutnet = pr(33.5, 40.5);
    // altyapı akademisi: tribünlü saha
    s += pitch(8, 47, 26, 12);
    const st = lv('youth'), sc = [t.c1, t.c2, '#e9e3d5'];
    for (let r = 0; r < Math.min(st, 5); r++) { const y0 = 45.6 - r * .9; s += poly([pr(8, y0, r * .8), pr(34, y0, r * .8), pr(34, y0 + .9, r * .8 + .6), pr(8, y0 + .9, r * .8 + .6)], sc[r % 2], 'opacity=".9"'); }
    if (st >= 3) for (let r = 0; r < st - 2; r++) s += poly([pr(35 + r, 47), pr(36 + r, 47), pr(36 + r, 59, 1 + r), pr(35 + r, 59, 1 + r)], sc[r % 2]);
    pos.youth = pr(21, 52);
    // otopark
    if (lv('tcoach') + lv('med') >= 5) for (let r = 0; r < 3; r++) for (let i = 0; i < 18; i++) { const p = pr(56 + i * 2.2, 47 + r * 3); s += `<rect x="${p[0] - 4}" y="${p[1] - 2}" width="8" height="4" rx="1" fill="${['#e9ecef', '#c62839', '#22303f', '#f4a020', '#9aa3ad'][(i * 7 + r * 3) % 5]}"/>`; }
    // yurt dışı akademi
    if (t.fac.abroad) { s += box(86, 52, 10, 7, 4, '#f0e6d0', '#b5a888', '#cbbfa2'); const f = pr(95, 52, 9); s += `<line x1="${f[0]}" y1="${f[1]}" x2="${f[0]}" y2="${f[1] + 18}" stroke="#555"/><rect x="${f[0]}" y="${f[1]}" width="11" height="7" fill="#58c4dd"/>`; pos.abroad = pr(91, 55, 4); }
    else pos.abroad = pr(91, 55);
    // ağaçlar ve oyuncular
    for (let i = 0; i < 60; i++) { const edge = i % 4, x = edge < 2 ? rnd() * 100 : edge === 2 ? -1 : 101, y = edge === 0 ? -1 : edge === 1 ? 61 : rnd() * 60, p = pr(x, y); s += `<circle cx="${p[0].toFixed(1)}" cy="${(p[1] - 4).toFixed(1)}" r="${(4 * kY(y)).toFixed(1)}" fill="${i % 3 ? '#2f6b34' : '#3e7d3b'}"/>`; }
    for (let i = 0; i < nP * 6; i++) { const sl = slots[i % nP], p = pr(sl[0] + 2 + rnd() * 13, sl[1] + 2 + rnd() * 7); s += `<rect x="${(p[0] - 1).toFixed(1)}" y="${(p[1] - 4).toFixed(1)}" width="2.2" height="4" fill="${i % 3 ? t.c1 : '#f3efe4'}"/>`; }
    s += '</svg>';
    return { svg: s, pos };
  }

  const SEAT_PREVIEW = s => {
    const c = [s.c1, s.c2, '#d6dae0']; let out = '';
    for (let b = 0; b < 4; b++) for (let r = 0; r < 14; r++) {
      const v = 1 - r / 13, y = 14 + r * 13, sk = (13 - r) * 3.2, x0 = 10 + b * 240 + (b < 2 ? sk : 0), x1 = 10 + b * 240 + 226 - (b > 1 ? sk : 0), n = 11;
      for (let i = 0; i < n; i++) { const u = (b * n + i) / (4 * n); out += `<rect x="${(x0 + (x1 - x0) * i / n).toFixed(1)}" y="${y}" width="${((x1 - x0) / n - 3).toFixed(1)}" height="8" rx="2" fill="${c[C.seatAt(s.pat, u, v, false)]}"/>`; }
    }
    return `<svg viewBox="0 0 970 200" class="seats" role="img" aria-label="Koltuk deseni önizlemesi">${out}</svg>`;
  };
  const logo = (b, w) => { const h = [...b].reduce((a, c) => a + c.charCodeAt(0), 0), col = ['#c62839', '#12355b', '#2e8b57', '#f4a020', '#6a4c93', '#1c7c8c'][h % 6]; return `<span class="brand" style="--b:${col}"><i>${esc(b.split(' ')[0][0])}</i>${esc(b.split(' ')[0])}${w ? `<small>${esc(b.split(' ').slice(1).join(' '))}</small>` : ''}</span>`; };
  const KIT_PATS = { solid: 'Düz', stripes: 'Dikey çizgili', hoops: 'Yatay çizgili', halves: 'Yarım', sash: 'Çapraz şerit', sleeves: 'Renkli kollar' };
  function shirt(k, sponsor, w) {
    const id = 'kp' + Math.random().toString(36).slice(2, 7), c1 = k.c1, c2 = k.c2, body = 'M60 20 L90 8 Q110 22 130 8 L160 20 L198 58 L172 84 L156 70 L156 196 L64 196 L64 70 L48 84 L22 58 Z';
    const pat = { solid: '', stripes: [0, 1, 2, 3, 4].map(i => `<rect x="${70 + i * 18}" y="0" width="9" height="200" fill="${c2}"/>`).join(''), hoops: [0, 1, 2, 3, 4, 5].map(i => `<rect x="0" y="${40 + i * 28}" width="220" height="13" fill="${c2}"/>`).join(''),
      halves: `<rect x="110" y="0" width="110" height="200" fill="${c2}"/>`, sash: `<path d="M40 40 L80 20 L200 180 L160 200Z" fill="${c2}"/>`, sleeves: `<path d="M22 58 L60 20 L64 70 L48 84Z M198 58 L160 20 L156 70 L172 84Z" fill="${c2}"/>` }[k.pat] || '';
    const ink = lumH(c1) > 150 ? '#14202f' : '#ffffff';
    return `<svg viewBox="0 0 220 210" width="${w || 160}" class="shirt" role="img" aria-label="Forma"><defs><clipPath id="${id}"><path d="${body}"/></clipPath></defs><path d="${body}" fill="${c1}"/><g clip-path="url(#${id})">${pat}</g><path d="M90 8 Q110 30 130 8" fill="none" stroke="${c2}" stroke-width="6"/><path d="${body}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="3"/>${sponsor ? `<text x="110" y="120" text-anchor="middle" font-family="Barlow Condensed, sans-serif" font-weight="800" font-size="22" fill="${ink}">${esc(sponsor.split(' ')[0].toLocaleUpperCase('tr'))}</text>` : ''}</svg>`;
  }
  const clubHead = () => { const t = me(); return `<header class="club-h">${FM.crest(t, 44)}<div><h2>${esc(t.name)}</h2><p class="muted">${FM.DIV_TR[t.div]} · ${esc(t.stadium)}</p></div></header>`; };

  /* ---- Tesisler ---- */
  const pct = v => (v > 0 ? '+' : v < 0 ? '−' : '±') + '%' + Math.abs(Math.round(v * 100));
  VIEWS.facilities = () => {
    const G = FM.G, t = me(), sel = U.facSel || 'training', zoom = U.facZoom || 'all', { svg, pos } = campus(), F = C.FACS, keys = Object.keys(F), pr_ = G.fproj.cur;
    const bars = l => `<span class="lvb">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= Math.min(5, l) ? 'on' : ''}"></i>`).join('')}${l >= 6 ? '<i class="star" title="Uzun vadeli proje tamamlandı">★</i>' : ''}<b>${Math.min(5, l)}/5</b></span>`;
    const sp0 = pos[sel] || pos.training, sc0 = zoom === 'near' ? 2.3 : zoom === 'far' ? 1.45 : 1, ox = sp0[0] / SW * 100, oy = sp0[1] / SH * 100;
    const labels = keys.concat(t.fac.abroad ? ['abroad'] : []).map(k => { const p = pos[k], lx = ox + (p[0] / SW * 100 - ox) * sc0, ly = oy + (p[1] / SH * 100 - oy) * sc0; if (lx < 3 || lx > 97 || ly < 8 || ly > 100) return ''; return `<button class="cp-l ${sel === k ? 'on' : ''}" data-a="fac-sel" data-v="${k}" style="left:${lx}%;top:${ly}%">${k === 'abroad' ? C.ABROAD.n : F[k].n}${k === 'abroad' ? '' : ` <b>${Math.min(5, t.fac[k])}</b>`}</button>`; }).join('');
    const map = `<section class="card campus"><div class="cp-zoom seg">${[['near', 'Yakın'], ['far', 'Uzak'], ['all', 'Tümü']].map(([k, n]) => `<button data-a="fac-zoom" data-v="${k}" class="${zoom === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="cp-view"><div class="cp-in" style="transform-origin:${ox}% ${oy}%;transform:scale(${sc0})">${svg}</div><div class="cp-labels">${labels}</div></div></section>`;
    const row = k => { const f = F[k], l = t.fac[k], st = pr_ && pr_.k === k ? `Proje sürüyor · ${pr_.w} hafta` : l >= 6 ? 'Proje tamamlandı' : l >= 5 ? 'En üst seviye' : `Geliştir · ${money(FM.facCost(k))}`;
      return `<tr class="${sel === k ? 'on' : ''}" data-a="fac-sel" data-v="${k}" tabindex="0"><td class="l"><span class="fi">${FM.icon(f.ic)}</span>${f.n}</td><td>${bars(l)}</td><td class="l fxs-c">${f.fx.map(([n, sg]) => `<span>${n} <b class="${C.eff(k) > 0 ? 'pos-v' : ''}">${pct(sg * C.eff(k))}</b></span>`).join('')}</td><td class="l st-c">${st}</td></tr>`; };
    const table = `<section class="card"><p class="mail-lbl">Tesisler</p><div class="scroll"><table class="tbl facs-t"><thead><tr><th class="l">Tesis</th><th class="l">Seviye</th><th class="l">Etkileri</th><th class="l">Durum</th></tr></thead><tbody>${keys.map(row).join('')}
        <tr class="${sel === 'abroad' ? 'on' : ''}" data-a="fac-sel" data-v="abroad" tabindex="0"><td class="l"><span class="fi">${FM.icon('globe')}</span>${C.ABROAD.n}</td><td class="l" colspan="2">${t.fac.abroad ? 'Kurulu · her yeni dönemde 2 yabancı yetenek' : 'Kurulmadı'}</td><td class="l st-c">${t.fac.abroad ? 'Aktif' : 'Kur · ' + money(C.ABROAD.cost)}</td></tr></tbody></table></div>
      <p class="mail-lbl">Uzun vadeli projeler</p><p class="muted">Tesis 5. seviyeye ulaşınca her tesis için bir uzun vadeli proje açılır; aynı anda yalnızca biri yürütülür. Proje ${C.PROJ_WEEKS} hafta sürer, bedeli bir kez ödenir; bittiğinde tesis bir kademe daha güçlenir.</p>
      <div class="scroll"><table class="tbl"><thead><tr><th class="l">Proje</th><th class="l">Durum</th><th class="r">Bedel</th></tr></thead><tbody>${keys.map(k => `<tr class="${sel === k ? 'on' : ''}" data-a="fac-sel" data-v="${k}" tabindex="0"><td class="l"><span class="fi">${FM.icon(F[k].ic)}</span>${F[k].proj[0]}</td><td class="l">${G.fproj.done[k] ? 'Tamamlandı' : pr_ && pr_.k === k ? `Sürüyor · ${pr_.w} hafta kaldı` : t.fac[k] >= 5 ? (pr_ ? 'Sırada' : 'Açık') : 'Kilitli · 5. seviye gerekli'}</td><td class="r">${money(F[k].proj[2])}</td></tr>`).join('')}</tbody></table></div></section>`;
    return clubHead() + `<div class="fac-grid"><div class="fac-main">${map}${table}</div><aside class="card fac-side">${facDetail(sel)}</aside></div>`;
  };
  function facDetail(k) {
    const G = FM.G, t = me(), F = C.FACS;
    if (k === 'abroad') return `<h3><span class="fi">${FM.icon('globe')}</span> ${C.ABROAD.n}</h3><p class="muted">${C.ABROAD.d}</p>${t.fac.abroad ? '<p class="ht-res">Kurulu. Her sezon başında altyapıya 2 yüksek potansiyelli yabancı genç katılır.</p>' : `<p>Kuruluş bedeli <b>${money(C.ABROAD.cost)}</b>.</p><button class="btn primary" data-a="fac-abroad">Akademiyi kur</button>`}`;
    const f = F[k], l = t.fac[k], cur = C.effAt(l), nxt = Math.min(5, l + 1), pr_ = G.fproj.cur;
    const rows = f.fx.map(([n, sg]) => `<tr><td class="l">${n}</td><td class="r"><b>${pct(sg * cur)}</b></td><td class="r">${l >= 5 ? (l >= 6 ? '—' : `<span class="muted">proje: ${pct(sg * C.effAt(6))}</span>`) : pct(sg * C.effAt(nxt))}</td></tr>`).join('');
    let act;
    if (l < 5) act = `<button class="btn primary" data-a="fac-up" data-v="${k}">${l + 1}. seviyeye geliştir · ${money(FM.facCost(k))}</button>`;
    else if (G.fproj.done[k]) act = `<p class="ht-res">${f.proj[0]} tamamlandı. Tesis dünya standartlarında.</p>`;
    else if (pr_ && pr_.k === k) act = `<div class="proj-bar"><span>${f.proj[0]}</span><i style="--p:${(1 - pr_.w / C.PROJ_WEEKS) * 100}%"></i><small>${pr_.w} hafta kaldı</small></div>`;
    else act = `<h4>Uzun vadeli proje</h4><p><b>${f.proj[0]}</b></p><p class="muted">${f.proj[1]}</p><p class="muted">Bedel ${money(f.proj[2])} · ${C.PROJ_WEEKS} hafta${pr_ ? ` · Şu an ${F[pr_.k].proj[0]} sürüyor.` : ''}</p><button class="btn primary" data-a="fac-proj" data-v="${k}" ${pr_ ? 'disabled' : ''}>Projeyi başlat</button>`;
    return `<h3><span class="fi">${FM.icon(f.ic)}</span> ${f.n}</h3><span class="lvb big">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= Math.min(5, l) ? 'on' : ''}"></i>`).join('')}${l >= 6 ? '<i class="star">★</i>' : ''}<b>${Math.min(5, l)}/5</b></span>
      <p class="muted">${f.d}</p><table class="tbl"><thead><tr><th class="l">Etki</th><th class="r">Şimdi</th><th class="r">${l >= 5 ? 'Sonra' : 'Sonraki seviye'}</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="hint">1. seviye tesise göre fark. Riskte, sürede ve düşüşte eksi daha iyi demek.</p>${act}`;
  }
  Object.assign(acts, {
    'fac-sel': d => { U.facSel = d.v; render(true); }, 'fac-zoom': d => { U.facZoom = d.v; render(true); },
    'fac-up': d => { say(C.upgradeFac(d.v)); render(true); }, 'fac-proj': d => { say(C.startProj(d.v)); render(true); }, 'fac-abroad': () => { say(C.buildAbroad()); render(true); }
  });

  /* ---- Stadyum ---- */
  VIEWS.stadium = () => {
    const G = FM.G, t = me(), s = U.seatDraft || G.seats, price = U.tpDraft != null ? U.tpDraft : G.fin.ticket, stp = U.stpDraft != null ? U.stpDraft : G.fin.stp;
    const att = FM.projAtt(price), cap = FM.stadiumCap(t), st = C.stEst(stp), closed = G.fin.stS === G.season, hold = closed ? G.fin.stSold || 0 : st.sold, nm = C.dealOn(G.naming) ? G.naming : null, refP = 15 - t.div * 4;
    const B = FM.Banners, md = B ? B.mood(t) : null, sty = B ? B.STYLE[B.styleOf(t)] : null;
    const seats = `<section class="card"><p class="mail-lbl">Koltuk deseni</p>${SEAT_PREVIEW(s)}
      <div class="row"><label class="sp" for="seatPat"><span>Desen</span><select id="seatPat" data-a="seat-pat">${Object.keys(C.SEAT_PATS).map(k => `<option value="${k}" ${s.pat === k ? 'selected' : ''}>${C.SEAT_PATS[k]}</option>`).join('')}</select></label><label class="clr"><input type="color" value="${s.c1}" data-a="seat-c" data-k="c1"> Ana renk</label><label class="clr"><input type="color" value="${s.c2}" data-a="seat-c" data-k="c2"> İkinci renk</label><button class="btn" data-a="seat-club">Kulüp renkleri</button></div>
      <div class="row"><button class="btn primary" data-a="seat-apply" ${U.seatDraft ? '' : 'disabled'}>Uygula</button><span class="muted">${U.seatDraft ? 'Uygulanmamış değişiklik var.' : 'Desen maçta 3D tribünlerde boş koltuklarda görünür.'}</span></div></section>`;
    const tick = `<section class="card"><p class="mail-lbl">Bilet fiyatı</p><p class="muted">Ligin ortalama rakibine karşı tahmin · referans fiyat ₺${refP}</p>
      <div class="big-sl"><b>₺${price}</b><input type="range" min="3" max="60" step="1" value="${price}" data-a="tp-draft" aria-label="Bilet fiyatı"></div>
      <div class="kpis sm"><div><span>Doluluk</span><b>%${Math.round(att / cap * 100)}</b></div><div><span>Seyirci</span><b>${att.toLocaleString('tr-TR')}</b></div><div><span>Maç başı hasılat</span><b class="pos-v">${money(Math.max(0, att - hold) * price)}</b></div><div><span>Kapasite</span><b>${cap.toLocaleString('tr-TR')}</b></div></div>
      <div class="row"><button class="btn primary" data-a="tp-apply" ${U.tpDraft != null && U.tpDraft !== G.fin.ticket ? '' : 'disabled'}>Fiyatı uygula</button><span class="muted">${U.tpDraft != null && U.tpDraft !== G.fin.ticket ? 'Uygulanmamış değişiklik' : 'Değişiklik yok'}${price > refP * 1.4 ? ' · yüksek fiyat taraftarı kızdırır' : price < refP * .7 ? ' · düşük fiyat taraftarı memnun eder' : ''}</span></div></section>`;
    const comb = `<section class="card"><p class="mail-lbl">Kombine bilet</p><p class="muted">${closed ? `Satış kapandı: ${(G.fin.stSold || 0).toLocaleString('tr-TR')} kombine satıldı. Kombine sahipleri iç saha lig maçlarına bilet almadan gelir.` : 'Satış sezonun ilk haftası sonunda kapanır. Kombine iç saha lig maçlarını kapsar; maç başına bilet fiyatından %25 indirimlidir.'}</p>
      <div class="big-sl"><b>₺${Math.round(st.total).toLocaleString('tr-TR')}</b><input type="range" min=".5" max="1.6" step=".05" value="${stp}" data-a="stp-draft" ${closed ? 'disabled' : ''} aria-label="Kombine fiyatı"></div>
      <div class="kpis sm"><div><span>Maç başına</span><b>₺${(Math.round(st.per * 10) / 10).toLocaleString('tr-TR')}</b></div><div><span>${closed ? 'Satılan' : 'Tahmini'} kombine</span><b>${hold.toLocaleString('tr-TR')}</b></div><div><span>Kombine geliri</span><b class="pos-v">${money(closed ? Math.round(hold * st.per * 11) : st.rev)}</b></div></div>
      ${closed ? '' : `<div class="row"><button class="btn primary" data-a="stp-apply" ${U.stpDraft != null && U.stpDraft !== G.fin.stp ? '' : 'disabled'}>Fiyatı uygula</button><span class="muted">${U.stpDraft != null && U.stpDraft !== G.fin.stp ? 'Uygulanmamış değişiklik' : 'Değişiklik yok'}</span></div>`}</section>`;
    const naming = `<section class="card"><p class="mail-lbl">Stat adı sponsoru</p>${nm ? `<div class="sponsor-cur">${logo(nm.brand, true)}<p>${esc(nm.brand)}: ${nm.years} sezon, yılda ${money(nm.amt)} · ${nm.s1}. sezona kadar</p></div>` : `<p class="muted">Markalar stadının adına ortak olmak istiyor. Gelir sezon boyunca haftalık olarak kasaya girer.</p><ul class="offers">${G.offersS.name.map((o, i) => `<li>${logo(o.brand, true)}<span>${o.years} sezon · yılda <b>${money(o.amt)}</b></span><button class="btn" data-a="deal-acc" data-k="name" data-i="${i}">Anlaş</button></li>`).join('')}</ul>`}
      <label class="sp" for="stName"><span>Stadyum adı</span><span class="row"><input id="stName" type="text" maxlength="28" value="${esc(t.stadium)}"><button class="btn" data-a="st-rename">Değiştir</button></span></label></section>`;
    const tribune = B ? `<section class="card"><p class="mail-lbl">Taraftar tribünü</p><p><b>${sty.n}</b> · ${esc(FM.fansOf(t))} · en sevdikleri: ${Object.keys(sty.w).slice(0, 3).map(k => B.CAT_TR[k].toLocaleLowerCase('tr')).join(', ')}</p>
      ${md.protest >= 2 ? '<p class="ht-res bad-res">Tribünler protesto modunda: iç saha maçlarında “YÖNETİM İSTİFA!” pankartları açılıyor. Her protesto yönetim güvenini düşürür; sonuçlar ve taraftar desteği düzelince sona erer.</p>' : md.protest === 1 ? '<p class="muted">Tribünlerde huzursuzluk başladı; tek tük protesto pankartları görülüyor.</p>' : md.title ? '<p class="muted">Şampiyonluk yarışı tribünleri coşturuyor.</p>' : md.drop ? '<p class="muted">Küme düşme hattında: tribünler “zor gün dostu” pankartlarıyla takımın arkasında.</p>' : '<p class="muted">Tribünler takımın arkasında.</p>'}</section>` : '';
    return clubHead() + `<div class="grid2"><div class="col">${seats}${tribune}</div><div class="col">${tick}${comb}${naming}</div></div>
      <section class="card"><div class="row" style="justify-content:space-between"><div><h2>Stadyumu büyüt</h2><p class="muted">Seviye ${t.fac.stadium}/5 · kapasite ve stadyum kademesi artar. Stadyumun 3D görünümü Genel sekmesinde.</p></div><button class="btn primary" data-a="upgrade" data-v="stadium" ${t.fac.stadium >= 5 ? 'disabled' : ''}>${t.fac.stadium >= 5 ? 'En üst seviye' : 'Büyüt · ' + money(FM.facCost('stadium'))}</button></div></section>`;
  };
  Object.assign(acts, {
    'seat-pat': (d, el) => { U.seatDraft = { ...(U.seatDraft || FM.G.seats), pat: el.value }; render(true); },
    'seat-c': (d, el) => { U.seatDraft = { ...(U.seatDraft || FM.G.seats), [d.k]: el.value }; render(true); },
    'seat-club': () => { U.seatDraft = { ...(U.seatDraft || FM.G.seats), c1: me().c1, c2: me().c2 }; render(true); },
    'seat-apply': () => { FM.G.seats = U.seatDraft; U.seatDraft = null; FM.save(); toast('Koltuk deseni uygulandı.', 'good'); render(true); },
    'tp-draft': (d, el) => { U.tpDraft = +el.value; render(true); },
    'tp-apply': () => { FM.setTicket(U.tpDraft); U.tpDraft = null; toast('Bilet fiyatı güncellendi.', 'good'); render(true); },
    'stp-draft': (d, el) => { U.stpDraft = +el.value; render(true); },
    'stp-apply': () => { FM.G.fin.stp = U.stpDraft; U.stpDraft = null; FM.save(); toast('Kombine fiyatı güncellendi.', 'good'); render(true); },
    'deal-acc': d => { say(C.accept(d.k, +d.i)); render(true); },
    'st-rename': () => { const v = $('stName').value.trim(); if (!v) return; me().stadium = v; FM.save(); toast('Stadyum adı değişti.', 'good'); render(true); }
  });

  /* ---- Forma ve sponsor ---- */
  VIEWS.kit = () => {
    const G = FM.G, ks = U.kitDraft || G.kits, sh = C.dealOn(G.shirt) ? G.shirt : null, sp = sh ? sh.brand : null;
    const kit = (k, i) => `<div class="kit-card"><p class="mail-lbl">${['İç saha', 'Deplasman', 'Üçüncü'][i]}</p>${shirt(k, sp, 150)}
      <label class="sp"><span>Desen</span><select data-a="kit-pat" data-i="${i}">${Object.keys(KIT_PATS).map(p => `<option value="${p}" ${k.pat === p ? 'selected' : ''}>${KIT_PATS[p]}</option>`).join('')}</select></label>
      <div class="row"><label class="clr"><input type="color" value="${k.c1}" data-a="kit-c" data-i="${i}" data-k="c1"> Ana</label><label class="clr"><input type="color" value="${k.c2}" data-a="kit-c" data-i="${i}" data-k="c2"> İkinci</label></div></div>`;
    return clubHead() + `<section class="card"><h2>Formalar</h2><div class="kits">${ks.map(kit).join('')}</div>
      <div class="row"><button class="btn primary" data-a="kit-apply" ${U.kitDraft ? '' : 'disabled'}>Uygula</button><button class="btn" data-a="kit-reset">Kulüp renklerine dön</button><span class="muted">${U.kitDraft ? 'Uygulanmamış değişiklik var.' : 'Forma renkleri maç öncesi ekranında ve maçta oyuncularda kullanılır.'}</span></div></section>
      <section class="card"><h2>Forma sponsoru</h2>${sh ? `<div class="sponsor-cur">${logo(sh.brand, true)}<p>${esc(sh.brand)}: ${sh.years} sezon, yılda ${money(sh.amt)} · ${sh.s1}. sezona kadar</p></div>` : `<p class="muted">Formanın göğsü için teklifler. Gelir sezon boyunca haftalık olarak kasaya girer; ana sponsor anlaşmandan ayrıdır. Kulübün başarısı ve ünü teklifleri büyütür.</p><ul class="offers">${G.offersS.shirt.map((o, i) => `<li>${logo(o.brand, true)}<span>${o.years} sezon · yılda <b>${money(o.amt)}</b></span><button class="btn" data-a="deal-acc" data-k="shirt" data-i="${i}">Anlaş</button></li>`).join('')}</ul>`}</section>`;
  };
  Object.assign(acts, {
    'kit-pat': (d, el) => { const k = (U.kitDraft || FM.G.kits).map(x => ({ ...x })); k[+d.i].pat = el.value; U.kitDraft = k; render(true); },
    'kit-c': (d, el) => { const k = (U.kitDraft || FM.G.kits).map(x => ({ ...x })); k[+d.i][d.k] = el.value; U.kitDraft = k; render(true); },
    'kit-apply': () => { FM.G.kits = U.kitDraft; U.kitDraft = null; FM.save(); toast('Formalar güncellendi.', 'good'); render(true); },
    'kit-reset': () => { U.kitDraft = C.defaultKits(me()); render(true); }
  });

  /* ---- Maliye ---- */
  VIEWS.finance = () => {
    const G = FM.G, t = me(), tot = G.fin.tot || {}, l = G.fin.last, deal = G.fin.deal;
    const row = (n, v, neg) => `<tr><td class="l">${n}</td><td class="r ${neg ? 'neg-v' : 'pos-v'}">${neg ? '−' : '+'}${money(v || 0)}</td></tr>`;
    const inc = (tot.tickets || 0) + (tot.season || 0) + (tot.sponsor || 0) + (tot.deals || 0) + (tot.merch || 0) + (tot.trIn || 0), out = (tot.wages || 0) + (tot.staff || 0) + (tot.trOut || 0);
    return clubHead() + `<div class="kpis"><div><span>Bütçe</span><b>${money(G.fin.balance)}</b></div><div><span>Haftalık maaş</span><b>${money(FM.wageBill(t))}</b></div><div><span>Sezon geliri</span><b class="pos-v">${money(inc)}</b></div><div><span>Sezon gideri</span><b class="neg-v">${money(out)}</b></div></div>
      <div class="grid2"><section class="card"><h2>Bütçe gidişatı</h2>${UI.spark(G.fin.hist)}
        ${l ? `<h3 class="rnd">Geçen hafta</h3><table class="tbl fin"><tbody>${row('Sponsor', l.sponsor)}${l.deals ? row('Forma ve stat sponsoru', l.deals) : ''}${row(`Bilet ${l.att ? '(' + l.att.toLocaleString('tr-TR') + ' seyirci)' : '(deplasman)'}`, l.tickets)}${row('Maaşlar', l.wages, true)}${l.staff ? row('Teknik ekip', l.staff, true) : ''}<tr><td class="l"><b>Net</b></td><td class="r"><b>${money(l.net)}</b></td></tr></tbody></table>` : ''}</section>
      <section class="card"><h2>${G.season}. sezon gelir-gider</h2><table class="tbl fin"><tbody>${row('Bilet geliri', tot.tickets)}${row('Kombine', tot.season)}${row('Ana sponsor', tot.sponsor)}${row('Forma ve stat sponsoru', tot.deals)}${row('Forma ve mağaza satışı', tot.merch)}${row('Oyuncu satışları', tot.trIn)}${row('Oyuncu maaşları', tot.wages, true)}${row('Teknik ekip maaşları', tot.staff, true)}${row('Transfer harcaması', tot.trOut, true)}</tbody></table>
        <p class="muted">Ana sponsor: ${deal ? `haftada ${money(deal.weekly)}${deal.win ? ` + galibiyet başına ${money(deal.win)}` : ''}` : `haftada ${money(G.fin.sponsor)}`}</p>
        <div class="row"><button class="btn" data-a="board-ask" ${G.fin.req === G.season ? 'disabled' : ''}>${G.fin.req === G.season ? 'Bu sezon bütçe istendi' : 'Yönetimden ek bütçe iste'}</button><span class="muted">Başarı şansı yönetim güvenine bağlı; ret de kabul de güveni biraz düşürür.</span></div></section></div>`;
  };
  acts['board-ask'] = () => { say(C.askBoard()); render(true); };
})();
