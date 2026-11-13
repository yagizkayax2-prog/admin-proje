/* Saha Kenarı — ek ekranlar: oyun menüsü, kayıt yuvaları, ayarlar, rehber ve tanıtım turu, sözleşme pazarlığı,
   soyunma odası, izleme listesi ve scout görevi, antrenman takvimi, altyapı, teknik ekip, finans, sosyal akış,
   Kıta Kupası tablosu, sezon ödülleri. ui.js'in FM.ui yardımcılarını kullanır. */
(function () {
  const UI = FM.ui, { U, $, esc, toast, modal, closeModal, render, me, posChip, ovrB, fmtR, gauge, playerRows, P_HEAD, VIEWS, acts } = UI;
  const P = id => FM.P(id), T = id => FM.T(id), money = FM.money, C = FM.Career;
  const say = r => toast(r.msg, r.ok ? 'good' : 'bad');
  const ago = t => { if (!t) return ''; const d = new Date(t); return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); };

  /* ================= Oyun menüsü ================= */
  const slotCard = (s, mode) => s.empty
    ? `<div class="slot empty"><span class="slot-n">${s.n}. yuva</span><p class="muted">Boş</p>${mode === 'menu' ? `<button class="btn" data-a="slot-new" data-v="${s.n}">Yeni kariyer</button>` : ''}</div>`
    : `<div class="slot" style="--k1:${FM.TEAMS[s.tid] ? FM.TEAMS[s.tid].c1 : '#58c4dd'}"><span class="slot-n">${s.n}. yuva${s.n === FM.slot() && FM.G ? ' · açık' : ''}</span>
        <div class="slot-t">${FM.TEAMS[s.tid] ? FM.crest({ ...FM.TEAMS[s.tid], id: s.tid }, 40) : ''}<div><strong>${esc(s.team)}</strong><small>${esc(s.manager)} · ${s.season}. sezon · ${Math.min(s.week + 1, FM.WEEK_COUNT)}. hafta</small><small>${FM.DIV_TR[s.div] || ''}${s.at ? ' · ' + ago(s.at) : ''}</small></div></div>
        <div class="row"><button class="btn primary" data-a="slot-load" data-v="${s.n}">Yükle</button>${U.delSlot === s.n ? `<button class="btn danger" data-a="slot-del-yes" data-v="${s.n}">Silmeyi onayla</button><button class="btn" data-a="slot-del-no">Vazgeç</button>` : `<button class="btn" data-a="slot-del" data-v="${s.n}">Sil</button>`}</div></div>`;
  UI.menuScreen = function () {
    const sl = FM.slots(), last = sl.find(s => s.n === FM.slot() && !s.empty) || sl.filter(s => !s.empty).sort((a, b) => b.at - a.at)[0];
    const panel = U.menuPanel;
    return `<div class="menu-scr">
      <div class="menu-bg" aria-hidden="true"><img src="assets/stadium.svg" alt=""></div>
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
    if (k === 'settings') return settingsHtml();
    if (k === 'guide') return guideHtml();
    return '';
  }
  function settingsHtml() {
    const S = FM.Settings, tog = (k, n, d) => `<label class="tog" for="set-${k}"><input type="checkbox" id="set-${k}" data-a="set-tog" data-k="${k}" ${S.get(k) ? 'checked' : ''}><span class="tg-sw" aria-hidden="true"></span><span><strong>${n}</strong><small>${d}</small></span></label>`;
    return `<h2>Ayarlar</h2>
      <div class="set-row"><label for="set-vol"><strong>Ses düzeyi</strong><small>${Math.round(S.get('vol') * 100)}%</small></label><input id="set-vol" type="range" min="0" max="1" step=".05" value="${S.get('vol')}" data-a="set-vol"></div>
      <div class="set-row"><span><strong>Varsayılan maç hızı</strong><small>Maç bu hızda başlar</small></span><div class="seg">${[1, 2, 4].map(v => `<button data-a="set-speed" data-v="${v}" class="${S.get('speed') === v ? 'on' : ''}">${v}x</button>`).join('')}</div></div>
      ${tog('gfx3d', '3D stadyum', 'Kapalıyken daha hafif 2D stadyum kullanılır.')}
      ${tog('calm', 'Sakin mod', 'Animasyonları ve geçişleri azaltır.')}
      ${tog('ticker', 'Haber şeridi', 'Ekranın altında kayan sonuçlar ve haberler.')}
      ${tog('autoSave', 'Otomatik kayıt', 'Her işlemden sonra kariyer kaydedilir.')}
      <div class="row"><button class="btn" data-a="tour-start">Tanıtım turunu yeniden göster</button><button class="btn" data-a="set-reset">Varsayılanlara dön</button></div>`;
  }
  const GUIDE = [
    ['Hafta akışı', 'Her hafta bir lig maçı oynanır; bazı haftaların öncesinde kupa ya da Kıta Kupası maçı vardır. “Devam et” bekleyen kararlarını gösterir, yoksa maç öncesi ekranını açar. Maçtan sonra hafta kapanır: antrenman, finans, transfer teklifleri ve yeni mesajlar işlenir.'],
    ['Gelen kutusu ve kararlar', 'Çalışanların, basın, menajerler ve yönetim sana yazar. Karar isteyen mesajlara hafta sonuna kadar cevap ver; vermezsen son seçenek geçerli olur. Sosyal sekmesinde taraftarların ve gazetecilerin paylaşımlarını görürsün.'],
    ['Maç öncesi ve maç', 'Maç öncesi ekranında forma seçer, takım konuşması yapar, rakibi incelersin. Maçta taktik ve oyuncu değiştirebilir, “Bağır” ile 10 dakikalık talimat verebilir, devre arasında soyunma odası konuşması yapabilirsin.'],
    ['Basın toplantıları', 'Maç öncesi, maç sonrası ve önemli transferlerden sonra basının karşısına çıkarsın. Cevapların taraftar, yönetim ve oyuncu moralini etkiler; gazetecilerle ilişkin tarzlarına göre değişir.'],
    ['Soyunma odası', 'Her oyuncunun bir kişiliği vardır (lider, profesyonel, sinirli, sessiz, neşeli). Takım uyumu moral, liderler ve kaptandan etkilenir ve maç gücünü değiştirir. Kaptanı Kadro sayfasından seçersin.'],
    ['Transfer ve sözleşmeler', 'Oyuncu alırken ya da sözleşme uzatırken menajerle maaş, süre ve imza parası üzerinde pazarlık yaparsın. Menajerin sabrı sınırlıdır. İzleme listesine eklediğin oyuncuların durumu değişince haber alırsın; scout görevleriyle istediğin profilde oyuncu aratırsın.'],
    ['Antrenman ve altyapı', 'Haftalık takvimi gün gün planlarsın: taktik uyumu, fiziksel ve teknik gelişimi, dinlenme kondisyonu ve morali, maç hazırlığı bir sonraki maçı etkiler. Her sezon başında altyapıya yeni gençler gelir; 20 yaşına gelmeden A takıma almalısın.'],
    ['Kulüp, finans ve teknik ekip', 'Bilet fiyatı gelir ve taraftar desteğini etkiler. Sezonda bir kez yönetimden ek bütçe isteyebilirsin. Yardımcı antrenör, kaleci antrenörü, fizyoterapist ve baş scout kalitesi gelişimi, sakatlıkları ve scout raporlarını etkiler.'],
    ['Turnuvalar ve derbiler', 'Lig, kupa ve Kıta Kupası oynanır. Ligi ilk iki sırada bitirenler gelecek sezon Kıta Kupası\'na katılır. Derbiler daha büyük atmosfer, daha sert basın soruları ve daha büyük taraftar tepkisi getirir.'],
    ['Sezon sonu', 'Yılın oyuncusu, gol kralı, yılın genci ve yılın 11\'i açıklanır. Kulübünde 40 maça ulaşan oyuncular müzedeki efsaneler arasına girer. Başarılı olursan başka kulüplerden iş teklifi gelir; yönetim güveni sıfıra yaklaşırsa görevden alınırsın.']
  ];
  function guideHtml() { return `<h2>Rehber</h2><div class="guide">${GUIDE.map(([h, t], i) => `<details ${i === 0 ? 'open' : ''}><summary>${h}</summary><p>${t}</p></details>`).join('')}</div>`; }

  /* Oyun içi menü */
  function gameMenu(panel) {
    U.gmPanel = panel || null;
    modal(panel ? `<button class="link back-l" data-a="gm" data-v="">${FM.icon('back')} Menü</button>${panelHtml(panel, 'game')}` : `<h3>Oyun menüsü</h3>
      <nav class="gm-list"><button class="mbtn" data-a="close"><span>Oyuna dön</span></button>
      <button class="mbtn" data-a="save-now"><span>Kaydet</span><small>${FM.slot()}. yuva</small></button>
      <button class="mbtn" data-a="gm" data-v="slots"><span>Kayıt yuvaları</span></button>
      <button class="mbtn" data-a="gm" data-v="settings"><span>Ayarlar</span></button>
      <button class="mbtn" data-a="gm" data-v="guide"><span>Rehber</span></button>
      <button class="mbtn" data-a="export"><span>Kaydı dışa aktar</span></button>
      <button class="mbtn danger" data-a="quit"><span>Ana menüye dön</span><small>Kariyerin kaydedilir</small></button></nav>`, !!panel);
  }
  const reopen = () => { if (FM.G && !$('modal').hidden) gameMenu(U.gmPanel); else render(); };
  Object.assign(acts, {
    menu: () => gameMenu(), gm: d => gameMenu(d.v),
    'to-menu': () => { U.screen = null; U.menuPanel = null; render(); },
    'menu-panel': d => { U.menuPanel = U.menuPanel === d.v ? null : d.v; render(); },
    'slot-new': d => { U.newSlot = +d.v; U.screen = 'new'; closeModal(); if (FM.G) { forceSave(); FM.close(); } render(); window.scrollTo(0, 0); },
    'slot-load': d => { closeModal(); if (FM.G) forceSave(); const g = FM.useSlot(+d.v); if (!g) return toast('Bu yuvada kayıt yok.', 'bad'); U.view = 'home'; U.shownBal = null; U.screen = null; U.menuPanel = null; U.pre = null; render(); window.scrollTo(0, 0); toast(`${me().name} kariyeri yüklendi.`, 'good'); },
    'slot-del': d => { U.delSlot = +d.v; reopen(); }, 'slot-del-no': () => { U.delSlot = null; reopen(); },
    'slot-del-yes': d => { const open = FM.G && +d.v === FM.slot(); FM.deleteSlot(+d.v); U.delSlot = null; toast('Kayıt silindi.'); if (open) { closeModal(); render(); } else reopen(); },
    'save-now': () => { forceSave(); toast(`${FM.slot()}. yuvaya kaydedildi.`, 'good'); },
    quit: () => { forceSave(); FM.close(); closeModal(); U.screen = null; U.menuPanel = null; render(); window.scrollTo(0, 0); },
    'set-vol': (d, el) => { FM.Settings.set('vol', +el.value); const s = el.closest('.set-row').querySelector('small'); if (s) s.textContent = Math.round(el.value * 100) + '%'; },
    'set-speed': d => { FM.Settings.set('speed', +d.v); reopen(); },
    'set-tog': (d, el) => { FM.Settings.set(d.k, el.checked); if (d.k === 'ticker' && FM.G) render(true); },
    'set-reset': () => { FM.Settings.reset(); reopen(); toast('Ayarlar sıfırlandı.'); },
    'tour-start': () => { closeModal(); if (!FM.G) { toast('Tur bir kariyer açıkken gösterilir.'); return; } U.view = 'home'; U.tour = 0; render(); window.scrollTo(0, 0); },
    'tour-next': () => { U.tour++; render(true); }, 'tour-skip': () => endTour()
  });
  const forceSave = () => { FM.forceSave = true; FM.save(); FM.forceSave = false; };

  /* ================= Tanıtım turu ================= */
  const TOUR = [
    ['[data-a="continue"]', 'Devam et', 'Haftayı buradan ilerletirsin. Bekleyen kararların varsa önce onları gösterir, yoksa maç öncesi ekranını açar.'],
    ['.tabs [data-v="inbox"]', 'Gelen kutusu', 'Çalışanların, basın ve yönetim sana buradan yazar. Karar isteyen mesajları ve basın toplantılarını kaçırma. Sosyal sekmesinde taraftar tepkilerini görürsün.'],
    ['.tabs [data-v="squad"]', 'Kadro ve soyunma odası', 'Oyuncularını, takım uyumunu, grupları ve kaptanı buradan yönetirsin.'],
    ['.tabs [data-v="tactics"]', 'Taktik', 'Diziliş, ilk 11, talimatlar ve duran top görevlileri.'],
    ['.tabs [data-v="transfer"]', 'Transfer', 'Oyuncu ara, izleme listesine ekle, scout görevine gönder; menajerle maaş pazarlığı yap.'],
    ['.tabs [data-v="training"]', 'Antrenman ve altyapı', 'Haftalık antrenman takvimini planla ve altyapıdaki gençleri takip et.'],
    ['.tabs [data-v="club"]', 'Kulüp', 'Finans, bilet fiyatı, teknik ekip, tesisler ve müze.'],
    ['[data-a="menu"]', 'Oyun menüsü', 'Kaydetme, kayıt yuvaları, ayarlar ve rehber burada. İyi şanslar hocam!']
  ];
  function endTour() { U.tour = null; FM.Settings.set('tourDone', true); const t = $('tour'); if (t) t.remove(); }
  UI.after = function () {
    const old = $('tour'); if (old) old.remove();
    if (U.tour == null || !FM.G || FM.G.phase) return;
    if (U.tour >= TOUR.length) return endTour();
    const [sel, h, txt] = TOUR[U.tour], el = document.querySelector(sel);
    if (!el) { U.tour++; return UI.after(); }
    el.scrollIntoView({ block: 'nearest', inline: 'center' });
    const r = el.getBoundingClientRect(), d = document.createElement('div');
    d.id = 'tour'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Tanıtım turu');
    const below = r.bottom + 190 < window.innerHeight, left = Math.max(12, Math.min(window.innerWidth - 332, r.left + r.width / 2 - 160));
    d.innerHTML = `<div class="tour-hole" style="left:${r.left - 6}px;top:${r.top - 6}px;width:${r.width + 12}px;height:${r.height + 12}px"></div>
      <div class="tour-tip" style="left:${left}px;${below ? `top:${r.bottom + 14}px` : `bottom:${window.innerHeight - r.top + 14}px`}"><small>${U.tour + 1}/${TOUR.length}</small><strong>${h}</strong><p>${txt}</p>
      <div class="row end"><button class="btn" data-a="tour-skip">Turu geç</button><button class="btn primary" data-a="tour-next">${U.tour === TOUR.length - 1 ? 'Bitir' : 'Sonraki'}</button></div></div>`;
    document.body.appendChild(d);
  };

  /* ================= Sözleşme pazarlığı ================= */
  function negHtml(pid) {
    const s = C.NEG[pid], p = P(pid), o = s.offer, d = s.dem, sign = s.kind === 'sign';
    const fee = sign ? FM.askPrice(p) : 0, step = (k, l, val, sub) => `<div class="neg-row"><span><strong>${l}</strong><small>${sub}</small></span><div class="stp"><button class="btn icon" data-a="neg-adj" data-id="${pid}" data-k="${k}" data-v="-1" ${s.done ? 'disabled' : ''} aria-label="${l} azalt">−</button><b>${val}</b><button class="btn icon" data-a="neg-adj" data-id="${pid}" data-k="${k}" data-v="1" ${s.done ? 'disabled' : ''} aria-label="${l} artır">+</button></div></div>`;
    return `<div class="pm-head">${FM.avatar(p, 64)}<div><h3>${sign ? 'Transfer görüşmesi' : 'Sözleşme görüşmesi'}</h3><p>${esc(p.name)} · ${p.age} yaş · ${FM.POS_LONG[p.pos]}</p><p class="muted">Şu anki maaş ${money(p.wage)}/hafta${p.tid != null && !sign ? ` · ${p.con} sezon kaldı` : ''}</p></div>
        <div class="pm-ovr"><span>Menajerin sabrı</span><span class="pat">${[0, 1, 2].map(i => `<i class="${i < s.pat ? 'on' : ''}"></i>`).join('')}</span></div></div>
      <blockquote class="neg-msg ${s.done === 'ok' ? 'ok' : s.done === 'walk' ? 'bad' : ''}">${esc(s.msg)}</blockquote>
      ${sign ? `<p class="price">${p.tid == null ? 'İmza parası (serbest oyuncu)' : FM.isClause(p) ? 'Serbest kalma bedeli' : 'Bonservis bedeli'}: <b>${money(fee)}</b> · kulübe ödenir</p>` : ''}
      ${step('wage', 'Haftalık maaş', money(o.wage), `Talep: ${money(d.wage)}`)}
      ${step('years', 'Sözleşme süresi', o.years + ' yıl', `Tercih: ${d.years} yıl`)}
      ${step('bonus', 'İmza parası', money(o.bonus), `Talep: ${money(d.bonus)}`)}
      <p class="muted">Toplam maliyet bugün: <b>${money(fee + o.bonus)}</b> · bütçe ${money(FM.G.fin.balance)}</p>
      <div class="row end">${s.done === 'ok' ? `<button class="btn primary" data-a="neg-sign" data-id="${pid}">${sign ? 'Transferi tamamla' : 'Sözleşmeyi imzala'}</button>` : s.done ? `<button class="btn" data-a="close">Kapat</button>` : `<button class="btn" data-a="player" data-id="${pid}">Vazgeç</button><button class="btn primary" data-a="neg-send" data-id="${pid}">Teklifi sun</button>`}</div>`;
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
    'neg-sign': d => {
      const s = C.NEG[+d.id], terms = { ...s.offer };
      const r = s.kind === 'sign' ? FM.buy(+d.id, false, terms) : FM.renew(+d.id, terms);
      say(r); if (r.ok) { delete C.NEG[+d.id]; closeModal(); render(true); }
    }
  });

  /* ================= Oyuncu penceresi ekleri ================= */
  UI.watchBtn = p => (p.tid === FM.G.teamId || p.youth ? '' : `<button class="star ${FM.G.watch.includes(p.id) ? 'on' : ''}" data-a="watch" data-id="${p.id}" aria-label="İzleme listesi" title="İzleme listesine ekle/çıkar">★</button>`);
  UI.pmExtra = p => {
    const pr = C.PER[C.per(p)], h = (p.hist || []).slice().reverse(), ca = C.clubApps(p);
    return `<p class="chips"><span class="chip per-${C.per(p)}" title="${pr[1]}">Kişilik: ${pr[0]}</span>${me().cap === p.id ? '<span class="chip on">Kaptan</span>' : ''}${p.youth ? '<span class="chip">Altyapı</span>' : ''}${ca.apps ? `<span class="chip">Kulübünde ${ca.apps} maç · ${ca.g} gol</span>` : ''}</p>
      ${h.length ? `<details class="pm-hist"><summary>Kariyer geçmişi (${h.length} sezon)</summary><div class="scroll"><table class="tbl"><thead><tr><th>Sezon</th><th class="l">Kulüp</th><th>Maç</th><th>Gol</th><th>Asist</th><th>Ort.</th></tr></thead><tbody>${h.map(x => `<tr><td>${x.s}</td><td class="l">${T(x.tid) ? esc(T(x.tid).name) : '—'}</td><td>${x.apps}</td><td>${x.g}</td><td>${x.as}</td><td>${fmtR(x.avg)}</td></tr>`).join('')}</tbody></table></div></details>` : ''}`;
  };
  acts.watch = (d, el) => { const on = C.toggleWatch(+d.id); el.classList.toggle('on', on); toast(on ? 'İzleme listesine eklendi.' : 'İzleme listesinden çıkarıldı.'); if (FM.ui.U.view === 'transfer') render(true); };

  /* ================= Kadro: soyunma odası ================= */
  const vSquad = VIEWS.squad;
  VIEWS.squad = () => {
    const t = me(), h = C.harmony(), gr = C.groups(), cap = t.cap != null ? P(t.cap) : null, sq = t.players.map(P).filter(p => !p.loan).sort((a, b) => b.ovr - a.ovr);
    const room = `<section class="card room-card"><h2>Soyunma odası</h2>
      <div class="grid2"><div>${gauge('Takım uyumu', h, h >= 70 ? 'Takım bir bütün. Maçlarda küçük bir güç avantajı sağlar.' : h >= 45 ? 'Ortam normal.' : 'Huzursuzluk var: maç gücü düşüyor. Moral ve kaptana dikkat.')}
        <label class="sp" for="capSel"><span>Kaptan</span><select id="capSel" data-a="cap-set">${sq.map(p => `<option value="${p.id}" ${t.cap === p.id ? 'selected' : ''}>${esc(p.name)} · ${C.PER[C.per(p)][0]} · moral ${Math.round(p.mor)}</option>`).join('')}</select></label>
        ${cap ? `<p class="muted">Kaptanın morali (${Math.round(cap.mor)}) her hafta takıma yayılır.${C.per(cap) === 'leader' ? ' Doğal bir lider: maçlarda ek katkı verir.' : ''}</p>` : ''}</div>
        <div class="groups">${gr.map(g => `<div class="grp"><div><strong>${g.n}</strong><span>${g.ps.length} oyuncu · moral ${g.mor}</span></div><p>Lideri: <button class="lnk" data-a="player" data-id="${g.lead.id}">${esc(g.lead.name)}</button></p><div class="pers">${g.ps.slice(0, 8).map(p => `<span class="chip per-${C.per(p)}" title="${C.PER[C.per(p)][1]}">${esc(p.name.split(' ').pop())}</span>`).join('')}</div></div>`).join('')}</div></div>
      <p class="chips legend">${Object.keys(C.PER).map(k => `<span class="chip per-${k}" title="${C.PER[k][1]}">${C.PER[k][0]}</span>`).join('')}</p></section>`;
    return vSquad() + room;
  };
  acts['cap-set'] = (d, el) => { C.setCaptain(+el.value); toast(`${P(+el.value).name} yeni kaptan.`, 'good'); render(true); };

  /* ================= Transfer: izleme listesi ve scout görevi ================= */
  const vTransfer = VIEWS.transfer;
  VIEWS.transfer = () => {
    const G = FM.G, wl = G.watch.map(P).filter(Boolean), st = G.stask, sc = G.staffQ.scout;
    const watch = `<section class="card"><h2>İzleme listesi <small class="muted">${wl.length}</small></h2>${wl.length ? `<div class="scroll"><table class="tbl pls">${P_HEAD(true)}<tbody>${playerRows(wl, true)}</tbody></table></div>` : '<p class="muted">Bir oyuncunun penceresindeki ★ ile listeye ekle. Transfer olunca ya da sözleşmesi bitmek üzereyken haber alırsın.</p>'}</section>`;
    const sel = (id, opts, v) => `<select id="${id}">${opts.map(([k, n]) => `<option value="${k}" ${v == k ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
    const task = `<section class="card"><h2>Scout görevi</h2><p class="muted">${esc(sc.n)} (kalite ${sc.q}/5) ve ekibi aradığın profilde oyuncuları 2 haftada bulur ve tam raporlarını çıkarır.</p>
      ${st ? `<p class="ht-res">Görev sürüyor: ${st.pos === 'ALL' ? 'tüm mevkiler' : FM.POS_LONG[st.pos]}, en fazla ${st.maxAge} yaş, potansiyel ${st.minPot}+ · ${st.w} hafta kaldı.</p>`
        : `<div class="st-form"><label>Mevki ${sel('stPos', [['ALL', 'Tümü'], ['GK', 'Kaleci'], ['DEF', 'Defans'], ['MID', 'Orta saha'], ['FWD', 'Forvet']], 'ALL')}</label><label>En fazla yaş ${sel('stAge', [[19, 19], [21, 21], [23, 23], [26, 26], [30, 30], [40, 'Fark etmez']], 23)}</label><label>En az potansiyel ${sel('stPot', [[60, 60], [65, 65], [70, 70], [75, 75], [80, 80], [85, 85]], 70)}</label><button class="btn primary" data-a="st-go">Göreve gönder · ${money(50000)}</button></div>`}</section>`;
    return `<div class="grid2">${task}${watch}</div>` + vTransfer();
  };
  acts['st-go'] = () => { say(C.scoutTask($('stPos').value, +$('stAge').value, +$('stPot').value)); render(true); };

  /* ================= Antrenman: takvim ve altyapı ================= */
  VIEWS.training = () => {
    const G = FM.G, t = me(), tr = G.training, sc = G.sched;
    const foc = [['bal', 'Dengeli', 'Her özellik eşit gelişir.'], ['att', 'Hücum', 'Şut ve hız öne çıkar.'], ['def', 'Savunma', 'Savunma ve fizik öne çıkar.'], ['fit', 'Kondisyon', 'Oyuncular daha hızlı dinlenir.']];
    const loadN = ['Hafif', 'Normal', 'Yoğun'][tr.intensity];
    const days = sc.map((k, i) => `<div class="day"><span>${C.DAYS[i]}</span><select data-a="day-set" data-i="${i}" aria-label="${C.DAYS[i]} antrenmanı">${Object.keys(C.SESS).map(s => `<option value="${s}" ${s === k ? 'selected' : ''}>${C.SESS[s][0]}</option>`).join('')}</select><small>${C.SESS[k][1]}</small></div>`).join('') + '<div class="day match"><span>Cmt</span><b>Maç günü</b></div>';
    const youth = G.youth.map(P).filter(Boolean).sort((a, b) => b.pot - a.pot);
    return `<section class="card"><h2>Haftalık antrenman takvimi</h2><div class="week">${days}</div>
        <div class="kpis sm"><div><span>Yük</span><b class="ld${tr.intensity}">${loadN}</b></div><div><span>Taktik uyum</span><b>${Math.round(G.fam)}</b></div><div><span>Maç hazırlığı</span><b>${C.schedCount('prep') + C.schedCount('sp') * .5 ? '+' + Math.round((C.schedCount('prep') + C.schedCount('sp') * .5) * 1.2 * 10) / 10 + '%' : '—'}</b></div><div><span>Dinlenme</span><b>${C.schedCount('rest')} gün</b></div></div>
        <p class="hint">Yoğun hafta gelişimi hızlandırır ama kondisyonu düşürür ve sakatlık riskini artırır. Taktik çalışmaları uyumu yükseltir; uyum zamanla azalır. Maç hazırlığı yalnızca sıradaki maça etki eder.</p></section>
      <section class="card"><h2>Gelişim odağı</h2><div class="opts">${foc.map(([k, n, d]) => `<button data-a="focus" data-v="${k}" class="opt ${tr.focus === k ? 'on' : ''}"><strong>${n}</strong><span>${d}</span></button>`).join('')}</div></section>
      <section class="card"><h2>Altyapı akademisi <small class="muted">seviye ${t.fac.youth}/5 · ${youth.length} genç</small></h2>
        ${youth.length ? `<div class="scroll"><table class="tbl pls"><thead><tr><th class="l">Oyuncu</th><th>Mevki</th><th>Yaş</th><th>GEN</th><th>POT</th><th>Kişilik</th><th class="r"></th></tr></thead><tbody>${youth.map(p => `<tr><td class="l pl">${FM.avatar(p, 30)}<span><strong>${esc(p.name)}</strong></span></td><td>${posChip(p.pos)}</td><td>${p.age}</td><td><b class="ovr ${UI.ovrCls(p.ovr)}">${p.ovr}</b></td><td class="pot">${p.pot}</td><td><span class="chip per-${C.per(p)}">${C.PER[C.per(p)][0]}</span></td><td class="r"><div class="row end"><button class="btn" data-a="yt-up" data-id="${p.id}">A takıma al</button><button class="btn" data-a="yt-rel" data-id="${p.id}" aria-label="${esc(p.name)} serbest bırak">Bırak</button></div></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Akademide oyuncu yok. Yeni sezonun başında alım günü yapılır.</p>'}
        <p class="hint">Gençler her hafta akademide gelişir. 20 yaşına gelen ve A takıma alınmayanlar kulüpten ayrılır.</p></section>`;
  };
  acts['day-set'] = (d, el) => { C.setDay(+d.i, el.value); render(true); };
  acts['yt-up'] = d => { say(C.promote(+d.id)); render(true); };
  acts['yt-rel'] = d => { const p = P(+d.id); C.release(+d.id); toast(`${p.name} serbest bırakıldı.`); render(true); };

  /* ================= Kulüp: teknik ekip, finans, müze ekleri ================= */
  const vClub = VIEWS.club;
  VIEWS.club = () => {
    const G = FM.G, s = G.staffQ, tot = G.fin.tot || {}, tp = G.fin.tp || 1;
    const stars = q => `<span class="stars" aria-label="${q}/5">${'★'.repeat(q)}<i>${'★'.repeat(5 - q)}</i></span>`;
    const staff = `<section class="card"><h2>Teknik ekip</h2><div class="staff">${Object.keys(C.ROLES).map(k => `<div class="stf"><div><small>${C.ROLES[k]}</small><strong>${esc(s[k].n)}</strong>${stars(s[k].q)}<span class="muted">${money(s[k].w)}/hafta · ${C.ROLE_FX[k]}</span></div>
        <details><summary>Adaylar</summary><ul>${G.staffC[k].map((c, i) => `<li><span>${esc(c.n)} · ${c.age} yaş ${stars(c.q)}</span><span class="muted">${money(c.w)}/hafta</span><button class="btn" data-a="hire" data-k="${k}" data-i="${i}" ${c.q <= s[k].q ? '' : ''}>İşe al · ${money(c.w * 8 + s[k].w * 4)}</button></li>`).join('')}</ul></details></div>`).join('')}</div></section>`;
    const fin = `<section class="card"><h2>Gelir-gider ve bilet</h2>
      <div class="set-row"><label for="tpIn"><strong>Bilet fiyatı</strong><small>${Math.round(tp * 100)}% · ${tp > 1.25 ? 'taraftar tepkili, seyirci azalır' : tp < .85 ? 'taraftar memnun, gelir düşük' : 'dengeli'}</small></label><input id="tpIn" type="range" min=".6" max="1.8" step=".05" value="${tp}" data-a="tp-set"></div>
      <table class="tbl fin"><tbody><tr><td class="l">Bilet geliri (sezon)</td><td class="r pos-v">+${money(tot.tickets || 0)}</td></tr><tr><td class="l">Sponsor (sezon)</td><td class="r pos-v">+${money(tot.sponsor || 0)}</td></tr><tr><td class="l">Ödüller</td><td class="r pos-v">+${money(tot.prize || 0)}</td></tr><tr><td class="l">Oyuncu satışları</td><td class="r pos-v">+${money(tot.trIn || 0)}</td></tr><tr><td class="l">Oyuncu maaşları</td><td class="r neg-v">−${money(tot.wages || 0)}</td></tr><tr><td class="l">Teknik ekip maaşları</td><td class="r neg-v">−${money(tot.staff || 0)}</td></tr><tr><td class="l">Transfer harcaması</td><td class="r neg-v">−${money(tot.trOut || 0)}</td></tr></tbody></table>
      <div class="row"><button class="btn" data-a="board-ask" ${G.fin.req === G.season ? 'disabled' : ''}>${G.fin.req === G.season ? 'Bu sezon bütçe istendi' : 'Yönetimden ek bütçe iste'}</button><span class="muted">Başarı şansı yönetim güvenine bağlı.</span></div></section>`;
    const leg = G.museum.leg.slice().sort((a, b) => b.apps - a.apps), aw = G.awards.slice().reverse();
    const extra = `<section class="card"><h2>Kulüp efsaneleri ve ödüller</h2><div class="grid2"><div><h3 class="rnd">Efsaneler <small>40+ maç</small></h3><ol class="rank">${leg.map((l, i) => `<li><span class="wk">${i + 1}</span><span class="nm">${esc(l.name)} <small class="clubn">${FM.POS_LONG[l.pos]}</small></span><b>${l.apps} maç · ${l.g} gol</b></li>`).join('') || '<li class="muted">Kulübünde 40 maça ulaşan oyuncular burada yer alır.</li>'}</ol></div>
      <div><h3 class="rnd">Sezon ödülleri</h3><ul class="recs">${aw.map(a => `<li><span>${a.s}. sezon</span><b>Yılın oyuncusu: ${esc(a.poy.name)} · Gol kralı: ${esc(a.top.name)} (${a.top.g})</b></li>`).join('') || '<li class="muted">İlk sezon sonunda açıklanır.</li>'}</ul>
      ${G.museum.euro.length ? `<div class="cups">${G.museum.euro.map(s => `<figure class="eurot"><img src="assets/trophy.svg" alt="" width="44" height="52"><figcaption>Kıta Kupası · ${s}. sezon</figcaption></figure>`).join('')}</div>` : ''}</div></div></section>`;
    return `<div class="grid2">${staff}${fin}</div>` + vClub() + extra;
  };
  acts.hire = d => { say(C.hire(d.k, +d.i)); render(true); };
  acts['tp-set'] = (d, el) => { C.setTicket(+el.value); render(true); };
  acts['board-ask'] = () => { say(C.askBoard()); render(true); };

  /* ================= Fikstür: Kıta Kupası ================= */
  const vFix = VIEWS.fixtures;
  VIEWS.fixtures = () => {
    const tabsBtn = `<button data-a="fxtab" data-v="kita" class="${U.fxTab === 'kita' ? 'on' : ''}">Kıta</button>`;
    if (U.fxTab !== 'kita') return vFix().replace('</div>', tabsBtn + '</div>');
    const e = FM.G.euro, row = UI.fxRow;
    const base = vFix(); const seg = base.slice(0, base.indexOf('</div>')) + tabsBtn + '</div>';
    return seg.replace(/class="on"/g, '').replace(`data-v="kita" class=""`, 'data-v="kita" class="on"') + `<section class="card"><h2>Kıta Kupası <small class="muted">${FM.G.season}. sezon</small></h2>
      <p class="muted">Ülke liginden ilk iki takım ve kıtanın 6 güçlü kulübü. Çeyrek final ${C.EURO_AFTER[0] + 1}., yarı final ${C.EURO_AFTER[1] + 1}., final ${C.EURO_AFTER[2] + 1}. hafta öncesinde.</p>
      ${e.hist.map(h => `<h3 class="rnd">${h.name}</h3><ul class="fxl">${h.ties.map(f => row(f)).join('')}</ul>`).join('')}
      ${e.ties.length ? `<h3 class="rnd">${e.name}</h3><ul class="fxl">${e.ties.map(f => row(f)).join('')}</ul>` : ''}
      ${e.winner != null ? `<p class="fin-line"><img src="assets/trophy.svg" alt="" width="28" height="32"> Şampiyon: ${esc(T(e.winner).name)}</p>` : `<h3 class="rnd">Turnuvada kalanlar</h3><div class="chips">${e.alive.map(id => `<span class="chip ${id === FM.G.teamId ? 'on' : ''}">${FM.crest(T(id), 18)} ${esc(T(id).name)}</span>`).join('')}</div>`}</section>`;
  };

  /* ================= Gelen kutusu: sosyal akış ================= */
  const vInbox = VIEWS.inbox;
  VIEWS.inbox = () => {
    const seg = `<div class="seg ib-tabs"><button data-a="ib-tab" data-v="msg" class="${U.ibTab !== 'social' ? 'on' : ''}">Mesajlar</button><button data-a="ib-tab" data-v="social" class="${U.ibTab === 'social' ? 'on' : ''}">Sosyal</button></div>`;
    if (U.ibTab !== 'social') return seg + vInbox();
    const posts = FM.G.social;
    return seg + `<section class="card feed"><h2>Sosyal akış</h2>${posts.length ? `<ul class="posts">${posts.map(p => `<li class="post ${p.kind}"><span class="pav" style="--c:${p.c}">${esc(p.who[0].toLocaleUpperCase('tr'))}</span><div><p class="ph"><strong>${esc(p.who)}</strong> <span class="muted">${esc(p.h)} · ${FM.Inbox.fmtDate(p.s, p.d)}</span></p><p>${esc(p.text)}</p><p class="pm muted"><span>♥ ${p.likes}</span><span>⟲ ${p.rt}</span></p></div></li>`).join('')}</ul>` : '<p class="muted">Henüz paylaşım yok. Maçlar, transferler ve basın toplantılarından sonra taraftarlar konuşmaya başlar.</p>'}</section>`;
  };
  acts['ib-tab'] = d => { U.ibTab = d.v; render(true); };

  /* ================= Sezon ödülleri ================= */
  UI.awardsHtml = () => {
    const G = FM.G, a = G.awards[G.awards.length - 1]; if (!a || a.s !== G.summary.season) return '';
    const card = (l, x, sub) => x ? `<div class="aw ${x.tid === G.teamId ? 'mine' : ''}"><small>${l}</small>${P(x.id) ? FM.avatar(P(x.id), 56) : ''}<strong>${esc(x.name)}</strong><span>${T(x.tid) ? esc(T(x.tid).name) : ''} · ${sub}</span></div>` : '';
    return `<section class="card awards"><p class="eyebrow">Ödül gecesi</p><h2>${a.s}. sezonun en iyileri</h2>
      <div class="aws">${card('Yılın oyuncusu', a.poy, 'ort. ' + fmtR(a.poy.avg))}${card('Gol kralı', a.top, a.top.g + ' gol')}${card('Yılın genci', a.young, a.young ? a.young.age + ' yaş · ort. ' + fmtR(a.young.avg) : '')}</div>
      <h3 class="rnd">Yılın 11'i</h3><div class="xi">${a.xi.map(x => `<span class="${x.tid === G.teamId ? 'mine' : ''}">${posChip(x.pos)} ${esc(x.name)} <small>${T(x.tid) ? esc(T(x.tid).short) : ''}</small></span>`).join('')}</div></section>`;
  };
})();
