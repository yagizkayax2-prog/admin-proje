/* Saha Kenarı — arayüz: ekranlar, pencereler, etkileşim */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const { P, T, money } = FM;
  const U = { view: 'home', fxWeek: null, fxTab: 'lig', tblDiv: null, sel: null, tf: { pos: 'ALL', afford: false }, pickTeam: 0, confirmReset: false, shownBal: null, hist: ['home'], hi: 0, mail: null, mailF: 'all', mailQ: '', mailPick: null, mailOpen: false };
  const GROUPS = [
    ['home', 'Ana Sayfa', [['home', 'Genel bakış'], ['inbox', 'Gelen kutusu'], ['social', 'Sosyal akış'], ['career', 'Kariyer']]],
    ['team', 'Takım', [['squad', 'Kadro'], ['tactics', 'Taktik'], ['training', 'Antrenman'], ['youth', 'Altyapı']]],
    ['world', 'Dünya', [['table', 'Lig'], ['fixtures', 'Fikstür ve kupa'], ['euro', 'Kıta Kupası'], ['stats', 'İstatistik']]],
    ['transfer', 'Transfer', [['transfer', 'Pazar']]],
    ['club', 'Kulüp', [['club', 'Genel'], ['facilities', 'Tesisler'], ['stadium', 'Stadyum'], ['kit', 'Forma ve sponsor'], ['finance', 'Maliye']]]
  ];
  const groupOf = v => GROUPS.find(g => g[2].some(x => x[0] === v)) || GROUPS[0];
  const pending = () => (FM.G.inbox || []).filter(m => (m.opts && !m.done) || (m.conf && !m.conf.done));
  const unread = () => (FM.G.inbox || []).filter(m => !m.read);
  function go(view, fromHist) {
    if (!fromHist && U.hist[U.hi] !== view) { U.hist = U.hist.slice(0, U.hi + 1); U.hist.push(view); if (U.hist.length > 40) U.hist.shift(); U.hi = U.hist.length - 1; }
    U.view = view; U.sel = null; U.fxWeek = null; U.confirmReset = false; U.mailOpen = false;
    render(); window.scrollTo(0, 0);
  }
  FM.go = go;
  const me = () => T(FM.G.teamId);
  const stars = n => `<span class="stars" aria-label="${n} yıldız">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`;
  const posChip = pos => `<span class="pos ${pos}">${FM.POS_TR[pos]}</span>`;
  const fitBar = v => `<span class="fit ${v < 60 ? 'low' : v < 80 ? 'mid' : ''}" title="Kondisyon ${Math.round(v)}"><i style="width:${Math.round(v)}%"></i></span>`;
  const status = p => (p.jab ? '<span class="tag bad">İğneli</span>' : '') + (p.unhappy ? '<span class="tag bad">Mutsuz</span>' : '') + (p.id === me().cap ? '<span class="tag cap">Kaptan</span>' : '') + (p.inj ? `<span class="tag bad" title="${p.injT || 'Sakat'}">Sakat ${p.inj}h</span>` : p.susp ? '<span class="tag bad">Cezalı</span>' : '') + (p.loan ? '<span class="tag info">Kiralık</span>' : '');
  const ovrCls = v => (v >= 78 ? 'o4' : v >= 70 ? 'o3' : v >= 62 ? 'o2' : 'o1');
  const ovrB = p => { const [lo, hi] = FM.est(p); return lo === hi ? `<b class="ovr ${ovrCls(lo)}">${lo}</b>` : `<b class="ovr est" title="Scout raporu yok: tahmini aralık">${lo}–${hi}</b>`; };
  const fmtR = v => (v ? v.toFixed(1).replace('.', ',') : '—');
  const meter = (l, v) => `<div class="attr"><span>${l}</span><i><b class="${ovrCls(v)}" style="--w:${Math.min(100, v)}%"></b></i><em>${Math.round(v)}</em></div>`;
  const gauge = (l, v, note) => `<div class="gauge"><div><span>${l}</span><b>${Math.round(v)}</b></div><div class="conf ${v >= 55 ? 'ok' : v >= 30 ? 'mid' : 'bad'}"><i style="width:${Math.max(4, v)}%"></i></div>${note ? `<p class="muted">${note}</p>` : ''}</div>`;

  function toast(msg, kind) {
    const t = document.createElement('div');
    t.className = 'toast-item ' + (kind || '');
    t.textContent = msg;
    $('toast').appendChild(t);
    setTimeout(() => t.classList.add('out'), 2800);
    setTimeout(() => t.remove(), 3300);
  }
  FM.onAch = name => toast('Başarım: ' + name, 'good');
  function modal(html, wide) { $('modal').innerHTML = `<div class="modal-card ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><button class="x" data-a="close" aria-label="Kapat">×</button>${html}</div>`; $('modal').hidden = false; }
  function closeModal() { $('modal').hidden = true; $('modal').innerHTML = ''; }

  /* ---------- Başlangıç ---------- */
  function startScreen() {
    const t = FM.TEAMS[U.pickTeam], div = t.div || 0;
    const grid = d => FM.TEAMS.map((x, i) => ((x.div || 0) === d ? `<button class="team-card ${i === U.pickTeam ? 'on' : ''}" data-a="pick-team" data-id="${i}" style="--k1:${x.c1};--k2:${x.c2}">${FM.crest(x, 52)}<strong>${x.name}</strong>${stars(Math.max(1, x.rep - d * 2 + (d ? 1 : 0)))}</button>` : '')).join('');
    return `<div class="start">
      <div class="start-hero"><button class="btn icon back-menu" data-a="to-menu" aria-label="Ana menüye dön">‹</button><img class="stad" src="assets/stadium.svg" alt=""><div class="start-title"><img src="assets/logo.svg" alt="" width="72" height="72"><div><h1>Saha Kenarı</h1><p>Kulübünü seç, kadronu kur, şampiyonluğa yürü.</p></div></div><img class="hero-ball" src="assets/ball.svg" alt="" width="46" height="46"></div>
      <div class="start-body">
        <h2>${FM.DIV_TR[0]}</h2><div class="team-grid">${grid(0)}</div>
        <h2>${FM.DIV_TR[1]} <small>alt lig: yükselmek için ilk 2'ye gir</small></h2><div class="team-grid">${grid(1)}</div>
        <div class="start-go" style="--k1:${t.c1};--k2:${t.c2}">
          <div class="sg-info">${FM.crest(t, 64)}<div><strong>${t.name}</strong><span>${t.stadium} · ${FM.DIV_TR[div]} · ${div ? 'Yükselme mücadelesi' : ['', 'Zorlu görev', 'Alt sıra takımı', 'Orta sıra takımı', 'Üst sıra adayı', 'Şampiyonluk adayı'][t.rep]}</span></div></div>
          <label for="mgr">Teknik direktör adı</label>
          <div class="row"><input id="mgr" type="text" maxlength="24" placeholder="Adın" autocomplete="off"><button class="btn primary big" data-a="start">Kariyere başla</button></div>
          <button class="link" data-a="import">Kayıtlı kariyeri yükle</button>
        </div>
      </div></div>`;
  }

  /* ---------- Kabuk ---------- */
  function ticker() {
    const G = FM.G, t = me(), w = G.week - 1, items = [];
    if (w >= 0) for (const d of [t.div, 1 - t.div]) for (const f of G.fixtures[d][w]) if (f.hs != null) items.push(`<span><b>Sonuç</b>${FM.crest(T(f.h), 16)}${T(f.h).name} <em>${f.hs}-${f.as}</em> ${T(f.a).name}</span>`);
    for (const n of G.news.slice(0, 6)) items.push(`<span><b class="hb">Haber</b>${esc(n.text.length > 80 ? n.text.slice(0, 78) + '…' : n.text)}</span>`);
    if (!items.length) items.push('<span><b class="hb">Haber</b>Sezon başlıyor. İlk maç için “Devam et” düğmesine bas.</span>');
    const row = items.join('');
    return `<footer class="ticker" aria-label="Sonuçlar ve haberler"><div class="ticker-in">${row}${row}</div></footer>`;
  }
  function shell(inner) {
    const G = FM.G, t = me(), grp = groupOf(U.view), dt = FM.fmtDate(G.season, G.week), badge = pending().length + unread().length;
    return `<header class="top"><div class="top-in">
        <div class="navhist"><button class="btn icon" data-a="back" aria-label="Geri" ${U.hi <= 0 ? 'disabled' : ''}>‹</button><button class="btn icon" data-a="fwd" aria-label="İleri" ${U.hi >= U.hist.length - 1 ? 'disabled' : ''}>›</button></div>
        <button class="clubbtn" data-a="team" data-id="${t.id}" aria-label="${t.name}">${FM.crest(t, 34)}</button>
        <nav class="mainnav" aria-label="Bölümler">${GROUPS.map(g => `<button data-a="tab" data-v="${g[2][0][0]}" class="${g === grp ? 'on' : ''}" ${g === grp ? 'aria-current="page"' : ''}>${g[1]}${g[0] === 'home' && badge ? `<i>${badge}</i>` : ''}</button>`).join('')}</nav>
        <div class="gsearch">${FM.icon('search')}<input id="gsearch" type="search" placeholder="Ara: oyuncu ya da takım" autocomplete="off" aria-label="Oyuncu ya da takım ara"><div class="gsr" id="gsr" hidden></div></div>
        <div class="top-r"><div class="bal"><span>Bütçe</span><b id="bal" class="${G.fin.balance < 0 ? 'neg' : ''}">${money(G.fin.balance)}</b></div>
          <button class="btn icon" data-a="settings" aria-label="Ayarlar">${FM.icon('gear')}</button><button class="btn icon" data-a="menu" aria-label="Oyun menüsü">${FM.icon('menu')}</button>
          <div class="datebox"><b>${dt.d}</b><span>${dt.g} · ${G.season}. sezon, ${Math.min(G.week + 1, FM.WEEK_COUNT)}. hafta</span></div>
          <button class="btn primary gobtn" data-a="play">Devam et ${FM.icon('play')}</button></div>
      </div>
      <nav class="tabs" aria-label="${grp[1]} alt bölümleri"><div class="tabs-in">${grp[2].map(([k, n]) => `<button data-a="tab" data-v="${k}" class="${U.view === k ? 'on' : ''}">${n}${k === 'inbox' && badge ? `<i>${badge}</i>` : ''}</button>`).join('')}</div></nav>
    </header><main class="view enter" id="view">${inner}</main>${ticker()}`;
  }
  function fxRow(f, big) {
    const h = T(f.h), a = T(f.a), mine = f.h === FM.G.teamId || f.a === FM.G.teamId;
    const sc = f.hs == null ? 'vs' : f.hs + ' – ' + f.as + (f.pens ? `<small> p ${f.pens[0]}–${f.pens[1]}</small>` : '');
    return `<li class="fx ${mine ? 'mine' : ''} ${big ? 'big' : ''}"><span class="fh ${f.w === f.h ? 'won' : ''}">${h.name}${FM.crest(h, 26)}</span><b class="sc ${f.hs == null ? 'tbd' : ''}">${sc}</b><span class="fa ${f.w === f.a ? 'won' : ''}">${FM.crest(a, 26)}${a.name}</span></li>`;
  }
  const wxChip = wx => `<span class="chip">${FM.WX_TR[wx.t]}${wx.n ? ' · Gece' : ' · Gündüz'}</span>`;

  /* ---------- Ana sayfa ---------- */
  function viewHome() {
    const G = FM.G, t = me(), tb = FM.table(), pos = tb.findIndex(r => r.id === G.teamId);
    const from = Math.max(0, Math.min(pos - 2, tb.length - 5));
    const form = id => { const r = tb.find(x => x.id === id); return r && r.form.length ? r.form.slice(-5).map(x => `<i class="f${x}">${x}</i>`).join('') : '<em>—</em>'; };
    const mid = G.cupDue ? 'cup' : G.euroDue ? 'euro' : null, cup = !!mid, tie = mid === 'cup' ? FM.cupTie() : mid === 'euro' ? FM.euroTie() : null, fx = cup ? tie : FM.userFixture();
    const comp = mid === 'cup' ? 'Kupa · ' + G.cup.name : mid === 'euro' ? 'Kıta Kupası · ' + FM.EURO_ROUNDS[G.euro.round] : FM.DIV_TR[t.div] + ' · ' + (G.week + 1) + '. hafta';
    let hero;
    if (cup && !tie) {
      hero = `<section class="next"><img class="stad" src="assets/stadium.svg" alt=""><div class="next-in"><p class="eyebrow">${comp}</p><h3>${mid === 'euro' ? 'Bu turda maçın yok' : G.cup.alive.includes(G.teamId) ? 'Bu turu maç yapmadan geçtin' : 'Kupada elendin'}</h3><p class="hint">${(mid === 'euro' ? G.euro.cur : G.cup.ties).length} maç oynanacak.</p><button class="btn primary big" data-a="play">Turu oynat</button></div></section>`;
    } else {
      const h = T(fx.h), a = T(fx.a), opp = fx.h === G.teamId ? a : h, derby = t.rival === opp.id, neutral = (mid === 'cup' && G.cup.final) || (mid === 'euro' && G.euro.round === 5), ko = mid === 'cup' || (mid === 'euro' && G.euro.round >= 3);
      hero = `<section class="next ${cup ? 'cup' : ''} ${derby ? 'derby' : ''}"><img class="stad" src="assets/stadium.svg" alt="">
        <div class="next-in"><p class="eyebrow">${derby ? 'Derbi · ' : ''}${comp} · ${h.stadium}</p>
          <div class="vs"><div class="vt">${FM.crest(h, 72)}<strong>${h.name}</strong><span class="form">${form(h.id)}</span></div><b>VS</b><div class="vt">${FM.crest(a, 72)}<strong>${a.name}</strong><span class="form">${form(a.id)}</span></div></div>
          <button class="btn primary big pulse" data-a="play">${FM.icon('play')} Maça çık</button>
          <button class="link" data-a="team" data-id="${opp.id}">Rakip analizi ve maç planı: ${opp.name}</button>
          <p class="chips">${wxChip(fx.wx || { t: 'clear', n: 0 })}<span class="chip">${neutral ? 'Tarafsız saha' : fx.h === G.teamId ? 'İç saha' : 'Deplasman'}</span><span class="chip">${FM.Stadium.TIERS[FM.stadiumTier(h)]}</span>${derby ? '<span class="chip on">Derbi: etkiler iki kat</span>' : ''}${ko ? '<span class="chip">Eleme: uzatma ve penaltılar</span>' : ''}<span class="chip">Plan: ${FM.PLAN_TR[t.plan.focus]}</span>${G.mgrBan ? '<span class="chip bad">Men cezası: maçı tribünden izleyeceksin</span>' : ''}</p></div>
      </section>`;
    }
    const pr = G.press ? FM.PRESS[G.press.q] : null;
    const last = G.week > 0 ? G.fixtures[t.div][G.week - 1] : null;
    return hero +
      (pending().length ? `<section class="card offer"><div>${FM.icon('inbox')}<p><strong>Gelen kutusunda ${pending().length} karar bekliyor.</strong><small>${esc(pending()[0].title)}</small></p></div><button class="btn primary" data-a="tab" data-v="inbox">Gelen kutusunu aç</button></section>` : '') +
      `<div class="grid2">
        <section class="card"><h2>Puan durumu</h2>${tableHtml(tb.slice(from, from + 5), from, true, t.div)}<button class="link" data-a="tab" data-v="table">Tüm tablo</button></section>
        <section class="card"><h2>Durum</h2>${gauge('Yönetim güveni', G.board)}${gauge('Taraftar desteği', G.fans)}<p class="chips"><span class="chip ${FM.windowOpen() ? 'on' : ''}">Transfer dönemi ${FM.windowOpen() ? (FM.deadline() ? 'son hafta!' : 'açık') : 'kapalı'}</span>${G.cup.winner != null ? `<span class="chip">Kupa: ${T(G.cup.winner).name}</span>` : `<span class="chip">Kupada ${G.cup.alive.includes(G.teamId) ? 'devam' : 'elendin'}</span>`}</p></section>
      </div>
      <section class="card"><h2>Haberler</h2><ul class="news">${G.news.slice(0, 7).map(n => `<li class="${n.kind}"><b>${n.s}. sezon · ${n.w}. hafta</b>${esc(n.text)}</li>`).join('')}</ul></section>
      ${last ? `<section class="card"><h2>Geçen haftanın sonuçları</h2><ul class="fxl">${last.map(f => fxRow(f)).join('')}</ul></section>` : ''}`;
  }
  function tableHtml(rows, offset, compact, div) {
    return `<div class="scroll"><table class="tbl lg"><thead><tr><th>#</th><th class="l">Takım</th><th>O</th>${compact ? '' : '<th>G</th><th>B</th><th>M</th><th>A</th><th>Y</th>'}<th>AV</th><th>P</th>${compact ? '' : '<th class="l">Form</th>'}</tr></thead><tbody>` +
      rows.map((r, i) => { const t = T(r.id), n = offset + i + 1, zone = div === 1 && n <= 2 ? 'up' : div === 0 && n >= 11 ? 'down' : ''; return `<tr class="${r.id === FM.G.teamId ? 'mine' : ''} ${zone}" data-a="team" data-id="${r.id}" tabindex="0"><td class="rk r${n}">${n}</td><td class="l tm">${FM.crest(t, 22)}${t.name}</td><td>${r.pl}</td>${compact ? '' : `<td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}</td><td>${r.ga}</td>`}<td>${r.gf - r.ga > 0 ? '+' : ''}${r.gf - r.ga}</td><td><b>${r.pts}</b></td>${compact ? '' : `<td class="l form">${r.form.slice(-5).map(x => `<i class="f${x}">${x}</i>`).join('')}</td>`}</tr>`; }).join('') + '</tbody></table></div>';
  }

  /* ---------- Kadro ---------- */
  const ORDER = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
  function playerRows(list, market) {
    return list.map(p => `<tr data-a="player" data-id="${p.id}" tabindex="0"><td class="l pl">${FM.avatar(p, 34)}<span><strong>${esc(p.name)}</strong>${status(p)}${market ? `<small class="clubn">${p.tid == null ? 'Serbest' : T(p.tid).name}</small>` : ''}</span></td><td>${posChip(p.pos)}</td><td>${p.age}</td><td>${ovrB(p)}</td><td class="pot">${FM.known(p) ? p.pot : '?'}</td><td>${fitBar(p.fit)}</td><td class="hide-s">${fmtR(FM.avgRating(p))}</td><td class="hide-s">${market ? p.g + '/' + p.as : p.loan ? 'Kiralık' : p.con + ' sezon'}</td><td class="r">${money(market ? FM.askPrice(p) : p.value)}</td></tr>`).join('');
  }
  const P_HEAD = market => `<thead><tr><th class="l">Oyuncu</th><th>Mevki</th><th>Yaş</th><th>GEN</th><th>POT</th><th>Kond.</th><th class="hide-s">Puan</th><th class="hide-s">${market ? 'G/A' : 'Sözleşme'}</th><th class="r">${market ? 'Bedel' : 'Değer'}</th></tr></thead>`;
  function viewSquad() {
    const t = me(), list = t.players.map(P).sort((a, b) => ORDER[a.pos] - ORDER[b.pos] || b.ovr - a.ovr), out = FM.loanedOut();
    const avg = Math.round(list.reduce((s, p) => s + p.ovr, 0) / list.length), age = (list.reduce((s, p) => s + p.age, 0) / list.length).toFixed(1);
    return `<div class="kpis"><div><span>Oyuncu</span><b>${list.length}</b></div><div><span>Ortalama güç</span><b>${avg}</b></div><div><span>Yaş ortalaması</span><b>${age.replace('.', ',')}</b></div><div><span>Kadro değeri</span><b>${money(FM.squadValue(t))}</b></div><div><span>Haftalık maaş</span><b>${money(FM.wageBill(t))}</b></div><div><span>Takım uyumu</span><b>${Math.round(t.chem)}</b></div></div>
      <section class="card"><h2>A takım kadrosu</h2><div class="scroll"><table class="tbl pls">${P_HEAD()}<tbody>${playerRows(list)}</tbody></table></div></section>
      ${out.length ? `<section class="card"><h2>Kiralıkta olanlar</h2><ul class="rank">${out.map(p => `<li>${posChip(p.pos)}<span class="nm">${esc(p.name)} <small class="clubn">${T(p.tid).name}</small></span><b>${p.ovr}</b></li>`).join('')}</ul></section>` : ''}`;
  }
  function playerModal(id) {
    const p = P(id), G = FM.G, mine = p.tid === G.teamId, t = p.tid != null ? T(p.tid) : null, kn = FM.known(p), own = mine && !p.loan;
    const bars = Object.keys(FM.ATTR_TR).filter(k => (p.pos === 'GK') === (k === 'gk') || (p.pos === 'GK' && (k === 'pas' || k === 'phy'))).map(k => meter(FM.ATTR_TR[k], p.a[k])).join('');
    let act;
    if (p.y) act = `<p class="muted">Altyapı oyuncusu · bu sezon U19'da ${p.g || 0} gol.</p><div class="row"><button class="btn" data-a="y-release" data-id="${id}">Serbest bırak</button><button class="btn primary" data-a="y-promote" data-id="${id}">A takıma al</button></div>`;
    else if (mine) {
      const rt = FM.renewTerms(p);
      act = (p.inj ? `<p class="trait"><b>${p.injT || 'Sakatlık'}</b> ${p.inj} hafta kaldı.${p.inj <= 2 ? ' İğneyle oynatabilirsin; sakatlığın ağırlaşma riski var.' : ''}</p>` : '') + `<div class="row">${p.inj && p.inj <= 2 ? `<button class="btn" data-a="jab" data-id="${id}">İğneyle oynat</button>` : ''}${p.id !== G.teams[G.teamId].cap ? `<button class="btn" data-a="captain" data-id="${id}">Kaptan yap</button>` : ''}`+`<button class="btn" data-a="talk" data-k="praise" data-id="${id}">Öv</button><button class="btn" data-a="talk" data-k="crit" data-id="${id}">Eleştir</button></div>` +
        (own ? `<p class="price">Sözleşme: ${p.con} sezon kaldı · haftalık <b>${money(p.wage)}</b>. Uzatmak için menajeriyle masaya otur.</p><div class="row"><button class="btn" data-a="renew" data-id="${id}">Sözleşme uzat</button><button class="btn" data-a="sell-ask" data-id="${id}">Satış için teklif al</button><button class="btn" data-a="loan-out" data-id="${id}">Kiralığa gönder</button></div>` : `<p class="muted">Kiralık oyuncu: sezon sonunda ${T(p.loan.own).name} takımına döner.</p>`);
    } else {
      const clause = FM.isClause(p), isOut = p.loan && p.loan.own === G.teamId;
      act = isOut ? `<p class="muted">Senin oyuncun: sezon sonuna kadar ${t.name} takımında kiralık.</p>` :
        `<p class="price">${p.tid == null ? 'İmza parası' : clause ? 'Serbest kalma bedeli' : 'İstenen bedel'} <b>${money(FM.askPrice(p))}</b> · Maaş ${money(p.wage)}/hafta</p>${!kn ? `<p class="muted">Gücü tahmini görünüyor. Kesin rapor için scout gönder.</p>` : ''}
        <div class="row">${!kn ? `<button class="btn" data-a="scout" data-id="${id}">Scout gönder · ₺30 Bin</button>` : ''}${p.tid != null ? `<button class="btn" data-a="loan-in" data-id="${id}">Kirala · ${money(Math.round(p.value * .1 / 10000) * 10000)}</button>` : ''}${clause ? '' : `<button class="btn" data-a="buy" data-h="1" data-id="${id}">Pazarlık (%15)</button>`}<button class="btn primary" data-a="buy" data-id="${id}">Satın al</button></div>`;
    }
    modal(`<div class="pm-head">${FM.avatar(p, 84)}<div><h3>${esc(p.name)} ${FM.ui.watchBtn ? FM.ui.watchBtn(p) : ''}</h3><p>${posChip(p.pos)} ${FM.ROLE_TR[p.role]} · ${p.age} yaş · No ${p.num}</p><p class="muted">${t ? FM.crest(t, 18) + ' ' + t.name : 'Serbest oyuncu'} ${status(p)}</p></div><div class="pm-ovr">${ovrB(p)}<span>Potansiyel ${kn ? p.pot : '?'}</span></div></div>
      ${p.trait && kn ? `<p class="trait"><b>${FM.TRAITS[p.trait][0]}</b> ${FM.TRAITS[p.trait][1]}</p>` : ''}
      ${kn ? `<div class="attrs">${bars}</div>` : '<p class="muted">Özellikler bilinmiyor.</p>'}
      <div class="kpis sm"><div><span>Maç</span><b>${p.apps}</b></div><div><span>Gol / Asist</span><b>${p.g} / ${p.as}</b></div><div><span>Ort. puan</span><b>${fmtR(FM.avgRating(p))}</b></div><div><span>Moral</span><b>${Math.round(p.mor)}</b></div><div><span>Değer</span><b>${money(p.value)}</b></div><div><span>Sözleşme</span><b>${p.tid == null ? '—' : p.con + ' sezon'}</b></div></div>
      ${p.form.length ? `<div class="formr"><span>Son maç puanları</span>${p.form.map(v => `<i class="${v >= 7.5 ? 'hi' : v < 6 ? 'lo' : ''}" style="--h:${Math.round((v - 3) / 7 * 100)}%"><b>${v.toFixed(1)}</b></i>`).join('')}</div>` : ''}
      <div class="pm-act" id="pmAct">${act}</div>${FM.ui.pmExtra ? FM.ui.pmExtra(p) : ''}`);
  }

  function nextOpp() { const G = FM.G, f = G.cupDue ? FM.cupTie() : G.euroDue ? FM.euroTie() : FM.userFixture(); return f ? (f.h === G.teamId ? f.a : f.h) : null; }
  function teamModal(id) {
    const t = T(id), G = FM.G, tb = t.div < 2 ? FM.table(t.div) : [], row = tb.find(r => r.id === id) || { pts: 0, gf: 0, ga: 0, form: [] }, pos = tb.indexOf(row) + 1, tier = FM.stadiumTier(t);
    const nx = nextOpp(), rp = FM.scoutReport(t), my = me();
    const plan = nx === id ? `<section class="plan"><h4>Maç planı</h4><div class="zones">${[['L', 'Sol kanat'], ['C', 'Merkez'], ['R', 'Sağ kanat']].map(([k, n]) => `<div class="${rp.weak === k ? 'weak' : ''}"><span>${n} savunması</span><b>${Math.round(rp[k])}</b>${rp.weak === k ? '<em>en zayıf</em>' : ''}</div>`).join('')}</div><div class="seg wrap">${FM.PLAN_TR.map((n, i) => `<button data-a="plan-focus" data-v="${i}" data-id="${id}" class="${my.plan.focus === i ? 'on' : ''}">${n}</button>`).join('')}</div><label class="sp" for="planMark"><span>Adam adama markaj</span><select id="planMark" data-a="plan-mark" data-id="${id}"><option value="">Kimse</option>${t.lineup.filter((x, i) => x != null && i > 0).map(P).map(q => `<option value="${q.id}" ${my.plan.mark === q.id ? 'selected' : ''}>${esc(q.name)} (${FM.POS_TR[q.pos]}${q.id === rp.star ? ', yıldız' : ''})</option>`).join('')}</select></label><p class="hint">Zayıf bölgeye yüklenmek pozisyon sayısını ve kalitesini artırır. Markaj o oyuncunun şut ve asist payını düşürür, orta saha hâkimiyetinden biraz götürür.</p></section>` : '';
    const list = t.players.map(P).sort((a, b) => ORDER[a.pos] - ORDER[b.pos] || FM.est(b)[0] - FM.est(a)[0]);
    const xi = t.lineup.filter(x => x != null).map(P), star = xi.slice().sort((a, b) => b.g - a.g || FM.est(b)[0] - FM.est(a)[0])[0];
    const tac = id === G.teamId || true ? Object.keys(FM.TAC).map(k => `<span class="chip">${FM.TAC[k][0]}: ${FM.TAC[k][1][t.tac[k]]}</span>`).join('') : '';
    modal(`<div class="pm-head">${FM.crest(t, 72)}<div><h3>${t.name}</h3><p>${t.div < 2 ? `${FM.DIV_TR[t.div]} · ${pos}. sıra · ${row.pts} puan` : 'Kıta Kupası kulübü'}${my.rival === id ? ' · Ezeli rakip' : ''}</p><p class="muted">${esc(t.stadium)} · ${FM.Stadium.TIERS[tier]} · ${FM.stadiumCap(t).toLocaleString('tr-TR')} kişilik</p></div><div class="pm-ovr"><b class="ovr o3">${t.formation}</b><span>Diziliş</span></div></div>
      <p class="chips">${tac}<span class="chip">Form: ${row.form.slice(-5).join(' ') || '—'}</span><span class="chip">Taraftar grubu: ${esc(FM.fansOf(t))}</span></p>
      <div class="kpis sm"><div><span>Kadro değeri</span><b>${money(FM.squadValue(t))}</b></div><div><span>Attığı / yediği</span><b>${row.gf} / ${row.ga}</b></div>${star ? `<div><span>Dikkat edilecek isim</span><b>${esc(star.name)}</b></div>` : ''}</div>
      ${plan}${FM.ui.tmExtra ? FM.ui.tmExtra(t) : ''}<div class="scroll tall"><table class="tbl pls">${P_HEAD(id !== G.teamId)}<tbody>${playerRows(list, id !== G.teamId)}</tbody></table></div>`, true);
  }

  /* ---------- Taktik ---------- */
  function viewTactics() {
    const t = me();
    FM.ensureLineup(t);
    const slots = FM.FORMATIONS[t.formation], inXI = new Set(t.lineup);
    const rest = t.players.filter(id => !inXI.has(id)).map(P).sort((a, b) => ORDER[a.pos] - ORDER[b.pos] || b.ovr - a.ovr);
    const r = FM.ratings({ slots, on: t.lineup, ment: t.ment, tac: t.tac });
    const toks = slots.map((s, i) => {
      const p = t.lineup[i] != null ? P(t.lineup[i]) : null, selc = U.sel && U.sel.k === 'slot' && U.sel.v === i ? 'sel' : '';
      return `<button class="tok ${selc} ${p && p.pos !== s[0] ? 'wrong' : ''}" style="left:${s[2] * 100}%;top:${91 - s[1] * 92}%;--k1:${t.c1};--k2:${t.c2};--d:${i * 35}ms" data-a="slot" data-i="${i}" aria-label="${s[0]} ${p ? esc(p.name) : 'boş'}"><span class="dot">${p ? p.num : '+'}</span><span class="nm">${p ? esc(p.name.split(' ').pop()) : FM.POS_TR[s[0]]}</span>${p ? `<span class="ov">${Math.round(FM.eff(p, s[0]))}</span>` : ''}</button>`;
    }).join('');
    const xi = t.lineup.filter((id, i) => id != null && i > 0).map(P);
    const spSel = (k, l) => `<label class="sp" for="sp-${k}"><span>${l}</span><select id="sp-${k}" data-a="sp" data-k="${k}">${xi.map(p => `<option value="${p.id}" ${t.sp[k] === p.id ? 'selected' : ''}>${esc(p.name)} (${k === 'ck' ? 'pas ' + p.a.pas : 'şut ' + p.a.sho})</option>`).join('')}</select></label>`;
    return `<div class="tac">
      <section class="card"><h2>Diziliş</h2><div class="seg wrap">${Object.keys(FM.FORMATIONS).map(f => `<button data-a="formation" data-v="${f}" class="${f === t.formation ? 'on' : ''}">${f}</button>`).join('')}</div>
        <div class="pitch"><div class="pitch-lines"></div>${toks}</div>
        <p class="hint">Yer değiştirmek için önce bir oyuncuya, sonra diğerine dokun. Sarı çerçeve mevki dışı oyuncuyu gösterir.</p></section>
      <div class="tac-side">
        <section class="card"><h2>Talimatlar</h2><div class="tacs"><div class="tac-row"><span>Oyun anlayışı</span><div class="seg">${FM.MENT_TR.map((n, i) => `<button data-a="ment" data-v="${i}" class="${i === t.ment ? 'on' : ''}">${n}</button>`).join('')}</div></div>${FM.tacSegs(t.tac, 'data-a')}</div>
          <div class="attrs">${meter('Hücum', r.att)}${meter('Orta saha', r.ctl)}${meter('Savunma', r.def)}</div>
          <button class="btn" data-a="autopick">En iyi 11'i otomatik seç</button></section>
        <section class="card"><h2>Duran toplar ve kaptan</h2>${spSel('pen', 'Penaltı')}${spSel('fk', 'Frikik')}${spSel('ck', 'Korner')}<label class="sp" for="capSel"><span>Kaptan</span><select id="capSel" data-a="captain-sel">${t.players.map(P).sort((a, b) => b.ovr - a.ovr).map(q => `<option value="${q.id}" ${t.cap === q.id ? 'selected' : ''}>${esc(q.name)}${q.trait === 'lead' ? ' (lider)' : ''}</option>`).join('')}</select></label>
          <p class="hint">Takım uyumu ${Math.round(t.chem)}: aynı 11 birlikte oynadıkça artar. Plan: ${FM.PLAN_TR[t.plan.focus]}. ${nextOpp() != null ? `<button class="link" data-a="team" data-id="${nextOpp()}">Maç planını düzenle</button>` : ''}</p></section>
        <section class="card"><h2>Yedekler</h2><ul class="bench">${rest.map(p => `<li><button class="${U.sel && U.sel.k === 'bench' && U.sel.v === p.id ? 'sel' : ''}" data-a="bench" data-id="${p.id}" ${FM.available(p) ? '' : 'disabled'}>${posChip(p.pos)}<span class="nm">${esc(p.name)} ${status(p)}</span><b class="ovr ${ovrCls(p.ovr)}">${p.ovr}</b>${fitBar(p.fit)}</button></li>`).join('')}</ul></section>
      </div></div>`;
  }
  function tacticClick(k, v) {
    const t = me(), a = U.sel;
    if (!a) { U.sel = { k, v }; return render(true); }
    if (a.k === k && a.v === v) { U.sel = null; return render(true); }
    if (a.k === 'slot' && k === 'slot') { const x = t.lineup[a.v]; t.lineup[a.v] = t.lineup[v]; t.lineup[v] = x; }
    else if (a.k === 'bench' && k === 'bench') { U.sel = { k, v }; return render(true); }
    else { const slot = a.k === 'slot' ? a.v : v, pid = a.k === 'bench' ? a.v : v; t.lineup[slot] = pid; }
    U.sel = null; FM.ensureSP(t); FM.save(); render(true);
  }

  /* ---------- Fikstür, kupa, lig ---------- */
  function viewFixtures() {
    const G = FM.G, t = me(), w = U.fxWeek == null ? Math.min(G.week, FM.WEEK_COUNT - 1) : U.fxWeek, rd = G.fixtures[t.div][w];
    const tabs = `<div class="seg"><button data-a="fxtab" data-v="lig" class="${U.fxTab === 'lig' ? 'on' : ''}">Lig</button><button data-a="fxtab" data-v="kupa" class="${U.fxTab === 'kupa' ? 'on' : ''}">Kupa</button></div>`;
    if (U.fxTab === 'kupa') {
      const c = G.cup, rounds = c.hist.concat(c.ties.length ? [{ name: c.name, ties: c.ties }] : []);
      return tabs + `<section class="card cupc"><div class="cup-head"><img src="assets/trophy.svg" alt="" width="48" height="56"><div><h2>Kupa</h2><p class="muted">${c.winner != null ? 'Kazanan: ' + T(c.winner).name : c.alive.includes(G.teamId) ? `Yarışıyorsun · kalan ${c.alive.length} takım` : `Elendin · kalan ${c.alive.length} takım`}</p></div></div>
        ${rounds.length ? rounds.slice().reverse().map(r => `<h3 class="rnd">${r.name}</h3><ul class="fxl">${r.ties.map(f => fxRow(f)).join('')}</ul>`).join('') : '<p class="muted">İlk tur 4. lig haftasından önce oynanır. İki ligden 24 takım katılır; eşitlikte uzatma ve seri penaltılar var.</p>'}</section>`;
    }
    const mine = G.fixtures[t.div].map((r, i) => ({ f: r.find(f => f.h === G.teamId || f.a === G.teamId), i }));
    return tabs + `<section class="card"><div class="pager"><button class="btn icon" data-a="fxw" data-v="${w - 1}" ${w <= 0 ? 'disabled' : ''} aria-label="Önceki hafta">‹</button><h2>${w + 1}. hafta</h2><button class="btn icon" data-a="fxw" data-v="${w + 1}" ${w >= FM.WEEK_COUNT - 1 ? 'disabled' : ''} aria-label="Sonraki hafta">›</button></div>
      <ul class="fxl">${rd.map(f => fxRow(f, true)).join('')}</ul></section>
      <section class="card"><h2>Sezon programın</h2><ol class="season">${mine.map(({ f, i }) => { const home = f.h === G.teamId, o = T(home ? f.a : f.h), d = f.hs == null ? null : (home ? f.hs - f.as : f.as - f.hs); return `<li class="${i === G.week ? 'cur' : ''}"><button data-a="fxw" data-v="${i}"><span class="wk">${i + 1}</span>${FM.crest(o, 22)}<span class="nm">${o.name}</span><span class="ha">${home ? 'İç' : 'Dep'}</span>${d == null ? '<b class="tbd">—</b>' : `<b class="${d > 0 ? 'fG' : d < 0 ? 'fM' : 'fB'}">${f.hs}–${f.as}</b>`}</button></li>`; }).join('')}</ol></section>`;
  }
  function viewTable() {
    const d = U.tblDiv == null ? me().div : U.tblDiv;
    const all = Object.values(FM.G.players).filter(p => p.tid != null && T(p.tid).div === d);
    const top = (f, n) => all.filter(p => f(p) > 0).sort((a, b) => f(b) - f(a) || a.apps - b.apps).slice(0, n);
    const lst = (f, fmt) => top(f, 8).map((p, i) => `<li class="${p.tid === FM.G.teamId ? 'mine' : ''}"><span class="wk">${i + 1}</span>${FM.crest(T(p.tid), 20)}<span class="nm">${esc(p.name)}</span><b>${fmt ? fmt(f(p)) : f(p)}</b></li>`).join('') || '<li class="muted">Henüz veri yok.</li>';
    return `<div class="seg">${FM.DIV_TR.map((n, i) => `<button data-a="tbldiv" data-v="${i}" class="${d === i ? 'on' : ''}">${n}</button>`).join('')}</div>
      <section class="card"><h2>${FM.DIV_TR[d]} · ${FM.G.season}. sezon</h2>${tableHtml(FM.table(d), 0, false, d)}<p class="muted">${d === 0 ? 'Son iki takım Umut Ligi\'ne düşer.' : 'İlk iki takım Yıldızlar Ligi\'ne yükselir.'}</p></section>
      <div class="grid2"><section class="card"><h2>Gol krallığı</h2><ol class="rank">${lst(p => p.g)}</ol></section><section class="card"><h2>Asist krallığı</h2><ol class="rank">${lst(p => p.as)}</ol></section>
      <section class="card"><h2>En yüksek ortalama puan</h2><ol class="rank">${lst(p => (p.rn >= 3 ? FM.avgRating(p) : 0), fmtR)}</ol></section></div>`;
  }

  /* ---------- Transfer ---------- */
  function viewTransfer() {
    const G = FM.G, f = U.tf, open = FM.windowOpen();
    let list = FM.marketList().filter(p => (f.pos === 'ALL' || p.pos === f.pos) && (!f.afford || FM.askPrice(p) <= G.fin.balance));
    if (f.free) list = list.filter(p => p.tid == null);
    if (f.maxAge) list = list.filter(p => p.age <= f.maxAge);
    if (f.minOvr) list = list.filter(p => FM.est(p)[1] >= f.minOvr);
    const mid = p => { const e = FM.est(p); return (e[0] + e[1]) / 2; };
    list.sort((a, b) => mid(b) - mid(a) || a.age - b.age);
    const total = list.length; list = list.slice(0, 60);
    return `<section class="card tfwin ${open ? 'open' : ''}"><div><h2>Transfer dönemi ${open ? 'açık' : 'kapalı'}</h2><p class="muted">${open ? (FM.deadline() ? 'Son hafta: kulüpler daha cömert teklif yapar.' : 'Sezonun ilk 4 haftası ve 11–14. haftalar arası açık.') : 'Kulüplerden alım, satım ve kiralama yapılamaz. Serbest oyuncularla her zaman anlaşabilirsin.'}</p></div><span class="chip">Scout: ${G.scoutQ.length}/4 görevde</span></section>
      <section class="card"><h2>Transfer pazarı</h2>
      <div class="filters"><div class="seg">${[['ALL', 'Tümü'], ['GK', 'KL'], ['DEF', 'DF'], ['MID', 'OS'], ['FWD', 'FV']].map(([k, n]) => `<button data-a="tf-pos" data-v="${k}" class="${f.pos === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <label class="chk" for="tfAfford"><input type="checkbox" id="tfAfford" data-a="tf-afford" ${f.afford ? 'checked' : ''}> Bütçeme uyanlar</label><label class="chk" for="tfFree"><input type="checkbox" id="tfFree" data-a="tf-free" ${f.free ? 'checked' : ''}> Yalnız serbestler</label>${FM.ui.tfSel ? FM.ui.tfSel(f) : ''}<span class="muted">${total} oyuncudan ${list.length} tanesi</span></div>${FM.ui.tfExtra ? FM.ui.tfExtra(f) : ''}
      <div class="scroll"><table class="tbl pls">${P_HEAD(true)}<tbody>${playerRows(list, true)}</tbody></table></div></section>`;
  }

  /* ---------- Antrenman ---------- */
  function viewTraining() {
    const G = FM.G, t = me(), tr = G.training;
    const foc = [['bal', 'Dengeli', 'Her özellik eşit gelişir.'], ['att', 'Hücum', 'Şut ve hız öne çıkar.'], ['def', 'Savunma', 'Savunma ve fizik öne çıkar.'], ['fit', 'Kondisyon', 'Oyuncular daha hızlı dinlenir.']];
    const ints = [['Hafif', 'Hızlı toparlanma, yavaş gelişim'], ['Normal', 'Dengeli yük'], ['Yoğun', 'Hızlı gelişim, yorgunluk ve sakatlık riski']];
    const young = t.players.map(P).filter(p => p.pot > p.ovr).sort((a, b) => (b.pot - b.ovr) - (a.pot - a.ovr)).slice(0, 6);
    return `<div class="grid2">
      <section class="card"><h2>Haftalık odak</h2><div class="opts">${foc.map(([k, n, d]) => `<button data-a="focus" data-v="${k}" class="opt ${tr.focus === k ? 'on' : ''}"><strong>${n}</strong><span>${d}</span></button>`).join('')}</div></section>
      <section class="card"><h2>Tempo</h2><div class="opts">${ints.map(([n, d], i) => `<button data-a="intensity" data-v="${i}" class="opt ${tr.intensity === i ? 'on' : ''}"><strong>${n}</strong><span>${d}</span></button>`).join('')}</div></section></div>
      <section class="card"><h2>Altyapı</h2><p>U19 takımında ${FM.G.youth.length} oyuncu var. Gelişimlerini izleyip hazır olanı A takıma alabilirsin.</p><button class="btn primary" data-a="tab" data-v="youth">Altyapıya git</button></section>
      <section class="card"><h2>Gelişime en açık oyuncular</h2><div class="scroll"><table class="tbl pls">${P_HEAD()}<tbody>${playerRows(young)}</tbody></table></div></section>`;
  }

  /* ---------- Kulüp ---------- */
  function spark(h) {
    const d = h.slice(-24), mn = Math.min(...d), mx = Math.max(...d), W = 300, H = 70;
    if (d.length < 2) return '<p class="muted">İlk haftadan sonra bütçe grafiği burada görünür.</p>';
    const pt = d.map((v, i) => [i / (d.length - 1) * W, H - 6 - (v - mn) / Math.max(1, mx - mn) * (H - 12)]);
    const line = pt.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Bütçe: ${money(d[0])} → ${money(d[d.length - 1])}"><path d="${line}L${W} ${H}L0 ${H}z" class="area"/><path d="${line}" class="ln" pathLength="1"/></svg><div class="spark-l"><span>en düşük ${money(mn)}</span><span>en yüksek ${money(mx)}</span></div>`;
  }
  function viewClub() {
    const G = FM.G, t = me(), l = G.fin.last, pos = FM.table().findIndex(r => r.id === G.teamId) + 1, exp = FM.expectation(t), tier = FM.stadiumTier(t), mu = G.museum;
    const facDesc = { training: 'Oyuncular daha hızlı gelişir.', youth: 'Altyapıdan daha yetenekli gençler çıkar.', stadium: 'Kapasiteyi artırır ve stadyumu bir üst kademeye yaklaştırır.' };
    const legends = Object.entries(G.legends).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const cups = mu.titles.map(s => `<figure><img src="assets/trophy.svg" alt="" width="44" height="52"><figcaption>Lig · ${s}. sezon</figcaption></figure>`).join('') + mu.cups.map(s => `<figure class="cupt"><img src="assets/trophy.svg" alt="" width="44" height="52"><figcaption>Kupa · ${s}. sezon</figcaption></figure>`).join('');
    return `<section class="card"><div class="st-head"><div><h2>${esc(t.stadium)}</h2><p class="muted">${FM.Stadium.TIERS[tier]} (${tier}/5) · ${FM.stadiumCap(t).toLocaleString('tr-TR')} kişilik · kadro değeri ${money(FM.squadValue(t))}</p></div><span class="lv big">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= tier ? 'on' : ''}"></i>`).join('')}</span></div>
        <div class="st-prev"><canvas id="stPrev" aria-label="Stadyumun üç boyutlu görünümü"></canvas></div><p class="hint">Sürükleyerek döndürebilirsin. Stadyum, kadro değerin ve stadyum yatırımın arttıkça büyür: tribünler, köşeler, çatı ve projektörler eklenir.</p></section>
      <div class="grid2">
      <section class="card"><h2>Finans</h2><div class="kpis sm"><div><span>Bütçe</span><b>${money(G.fin.balance)}</b></div><div><span>Haftalık maaş</span><b>${money(FM.wageBill(t))}</b></div><div><span>Sponsor</span><b>${G.fin.deal ? money(G.fin.deal.weekly) + (G.fin.deal.win ? ' + prim' : '') : money(G.fin.sponsor)}</b></div></div>
        ${spark(G.fin.hist)}
        <div class="ticket"><div><strong>Bilet fiyatı</strong><p class="muted">Tahmini seyirci ${FM.projAtt(G.fin.ticket).toLocaleString('tr-TR')} · maç başı ${money(FM.projAtt(G.fin.ticket) * G.fin.ticket)}</p></div><div class="stepper"><button class="btn icon" data-a="ticket" data-v="-1" aria-label="Bileti ucuzlat">−</button><b>₺${G.fin.ticket}</b><button class="btn icon" data-a="ticket" data-v="1" aria-label="Bileti pahalılaştır">+</button></div></div>
        ${l ? `<table class="tbl fin"><tbody><tr><td class="l">Sponsor geliri</td><td class="r pos-v">+${money(l.sponsor)}</td></tr><tr><td class="l">Bilet geliri ${l.att ? '(' + l.att.toLocaleString('tr-TR') + ' seyirci)' : '(deplasman)'}</td><td class="r pos-v">+${money(l.tickets)}</td></tr>${l.merch ? `<tr><td class="l">Forma ve mağaza</td><td class="r pos-v">+${money(l.merch)}</td></tr>` : ''}<tr><td class="l">Maaşlar</td><td class="r neg-v">−${money(l.wages)}</td></tr>${l.staff ? `<tr><td class="l">Teknik ekip</td><td class="r neg-v">−${money(l.staff)}</td></tr>` : ''}<tr><td class="l"><b>Geçen hafta net</b></td><td class="r"><b>${money(l.net)}</b></td></tr></tbody></table>` : ''}</section>
      <section class="card"><h2>Yönetim ve taraftar</h2><p>Hedef: ${FM.DIV_TR[t.div]}'nde <b>${exp}. sıra</b> veya üstü. Şu an <b>${pos}.</b> sıradasın.</p>${gauge('Yönetim güveni', G.board, G.board <= 25 ? 'Tehlike: güven 10\'un altına düşerse görevden alınırsın.' : G.board >= 70 ? 'Yönetim arkanda.' : 'Yönetim gidişatı izliyor.')}${gauge('Taraftar desteği', G.fans, 'Destek arttıkça tribünler dolar, iç saha avantajın büyür.')}</section></div>
      <section class="card"><h2>Teknik ekip</h2><div class="facs">${Object.keys(FM.STAFF).map(k => `<div class="fac"><div><strong>${FM.STAFF[k][0]}</strong><span class="lv">${[1, 2, 3].map(i => `<i class="${i <= G.staff[k] ? 'on' : ''}"></i>`).join('')}</span><p>${FM.STAFF[k][1]} Haftalık maaş: seviye başına ${money(FM.STAFF_WAGE)}.</p></div><button class="btn" data-a="staff" data-v="${k}" ${G.staff[k] >= 3 ? 'disabled' : ''}>${G.staff[k] >= 3 ? 'En üst seviye' : (G.staff[k] ? 'Güçlendir' : 'İşe al') + ' · ' + money(FM.staffCost(k))}</button></div>`).join('')}</div></section>
      <section class="card"><div class="row" style="justify-content:space-between"><div><h2>Tesisler ve stadyum</h2><p class="muted">Tesis kampüsü, uzun vadeli projeler, stadyum ve forma ayarları kendi sekmelerinde.</p></div><div class="row"><button class="btn" data-a="tab" data-v="facilities">Tesisler</button><button class="btn" data-a="tab" data-v="stadium">Stadyum</button><button class="btn" data-a="tab" data-v="kit">Forma ve sponsor</button></div></div></section>`;
  }

  /* ---------- Kariyer ---------- */
  function viewCareer() {
    const G = FM.G, mu = G.museum, t = me();
    const legends = Object.entries(G.legends).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const cups = mu.titles.map(s => `<figure><img src="assets/trophy.svg" alt="" width="44" height="52"><figcaption>Lig · ${s}. sezon</figcaption></figure>`).join('') + mu.cups.map(s => `<figure class="cupt"><img src="assets/trophy.svg" alt="" width="44" height="52"><figcaption>Kupa · ${s}. sezon</figcaption></figure>`).join('') + (mu.euro || []).map(s => `<figure class="eurot"><img src="assets/trophy.svg" alt="" width="52" height="62"><figcaption>Kıta Kupası · ${s}. sezon</figcaption></figure>`).join('');
    return `<div class="kpis"><div><span>Teknik direktör</span><b>${esc(G.manager)}</b></div><div><span>Kulüp</span><b>${t.name}</b></div><div><span>Sezon</span><b>${G.season}.</b></div><div><span>Kupa sayısı</span><b>${mu.titles.length + mu.cups.length}</b></div></div>
      <section class="card"><h2>Geçmiş sezonlar</h2>${G.history.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>Sezon</th><th class="l">Kulüp</th><th>Sıra</th><th>Puan</th><th class="l">Şampiyon</th><th class="l">Kupa</th></tr></thead><tbody>${G.history.map(h => `<tr><td>${h.season}</td><td class="l">${h.team || ''}</td><td>${h.pos}${h.div ? ' (alt lig)' : ''}</td><td>${h.pts}</td><td class="l">${h.champion}</td><td class="l">${h.cup || '—'}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">İlk sezonun devam ediyor.</p>'}</section>
      <section class="card museum"><h2>Kulüp müzesi</h2>
        <div class="cups">${cups || '<p class="muted">Vitrin henüz boş. İlk kupanı kazan.</p>'}</div>
        <div class="grid2"><div><h3 class="rnd">Rekorlar</h3><ul class="recs"><li><span>En farklı galibiyet</span><b>${G.rec.bigWin ? G.rec.bigWin.text : '—'}</b></li><li><span>Bir sezonda en çok gol</span><b>${G.rec.goals ? `${G.rec.goals.name} (${G.rec.goals.g}) · ${G.rec.goals.s}. sezon` : '—'}</b></li><li><span>En yüksek puan</span><b>${G.rec.pts ? `${G.rec.pts.v} puan · ${G.rec.pts.s}. sezon` : '—'}</b></li></ul></div>
        <div><h3 class="rnd">Efsaneler</h3><ol class="rank">${legends.map(([n, g], i) => `<li><span class="wk">${i + 1}</span><span class="nm">${esc(n)}</span><b>${g} gol</b></li>`).join('') || '<li class="muted">Senin dönemindeki golcüler burada sıralanır.</li>'}</ol></div></div>
        <h3 class="rnd">Başarımlar <small>${Object.keys(G.ach).length}/${Object.keys(FM.ACH).length}</small></h3><div class="achs">${Object.keys(FM.ACH).map(k => `<div class="ach ${G.ach[k] ? 'on' : ''}"><strong>${FM.ACH[k][0]}</strong><span>${FM.ACH[k][1]}</span>${G.ach[k] ? `<em>${G.ach[k].s}. sezon</em>` : ''}</div>`).join('')}</div></section>`;
  }

  /* ---------- Altyapı ---------- */
  function viewYouth() {
    const G = FM.G, t = me(), ys = G.youth.map(P).filter(Boolean).sort((a, b) => b.pot - a.pot || b.ovr - a.ovr), u = G.u19;
    return `<div class="kpis"><div><span>U19 kadrosu</span><b>${ys.length}</b></div><div><span>Bu sezon</span><b>${u.w}G ${u.d}B ${u.l}M</b></div><div><span>Son maç</span><b>${u.last || '—'}</b></div><div><span>Akademi seviyesi</span><b>${t.fac.youth}/5</b></div></div>
      <section class="card"><h2>U19 takımı</h2><p class="muted">Gençler her hafta kendi liglerinde oynar ve gelişir. 20 yaşına gelen oyuncu A takıma alınmamışsa ayrılır; her sezon başında yeni dönem gelir.</p>
        <div class="scroll"><table class="tbl pls"><thead><tr><th class="l">Oyuncu</th><th>Mevki</th><th>Yaş</th><th>GEN</th><th>POT</th><th>U19 gol</th><th class="r">A takım</th></tr></thead><tbody>${ys.map(p => `<tr data-a="player" data-id="${p.id}" tabindex="0"><td class="l pl">${FM.avatar(p, 34)}<span><strong>${esc(p.name)}</strong><small class="clubn">${FM.ROLE_TR[p.role]}</small></span></td><td>${posChip(p.pos)}</td><td>${p.age}</td><td><b class="ovr ${ovrCls(p.ovr)}">${p.ovr}</b></td><td class="pot">${p.pot}</td><td>${p.g || 0}</td><td class="r"><button class="btn" data-a="y-promote" data-id="${p.id}">Yükselt</button></td></tr>`).join('') || '<tr><td colspan="7" class="muted">Altyapıda oyuncu kalmadı.</td></tr>'}</tbody></table></div></section>`;
  }

  /* ---------- Kıta Kupası ---------- */
  function viewEuro() {
    const G = FM.G, E = G.euro;
    if (!E) return '<section class="card"><h2>Kıta Kupası</h2><p class="muted">Bu sezon turnuva bu kayıtta başlatılmadı; gelecek sezon başında kurulacak.</p></section>';
    const grp = gi => `<section class="card"><h2>${'ABCD'[gi]} Grubu</h2><div class="scroll"><table class="tbl lg"><thead><tr><th>#</th><th class="l">Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AV</th><th>P</th></tr></thead><tbody>${FM.euroTable(gi).map((r, i) => `<tr class="${r.id === G.teamId ? 'mine' : ''} ${i < 2 ? 'up' : ''}" data-a="team" data-id="${r.id}" tabindex="0"><td class="rk">${i + 1}</td><td class="l tm">${FM.crest(T(r.id), 22)}${T(r.id).name}</td><td>${r.pl}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf - r.ga > 0 ? '+' : ''}${r.gf - r.ga}</td><td><b>${r.pts}</b></td></tr>`).join('')}</tbody></table></div></section>`;
    const rounds = E.ko.slice().reverse().map(r => `<h3 class="rnd">${r.name}</h3><ul class="fxl">${r.ties.map(f => fxRow(f)).join('')}</ul>`).join('') + (E.cur.length ? `<h3 class="rnd">${FM.EURO_ROUNDS[E.round]} · sıradaki</h3><ul class="fxl">${E.cur.map(f => fxRow(f)).join('')}</ul>` : '');
    const mds = E.md.slice().reverse().map((md, i) => `<h3 class="rnd">${FM.EURO_ROUNDS[E.md.length - 1 - i]}</h3><ul class="fxl">${md.map(f => fxRow(f)).join('')}</ul>`).join('');
    return `<section class="card cupc"><div class="cup-head"><img class="eurot" src="assets/trophy.svg" alt="" width="48" height="56"><div><h2>Kıta Kupası</h2><p class="muted">${E.winner != null ? 'Kazanan: ' + T(E.winner).name : E.dom.includes(G.teamId) ? 'Turnuvadasın. Gruplardan ilk iki takım çeyrek finale çıkar.' : 'Bu sezon katılamadın. Ligi ilk 4\'te bitiren takımlar gelecek sezon katılır.'}</p></div></div>${rounds}</section>
      <div class="grid2">${[0, 1, 2, 3].map(grp).join('')}</div>
      ${mds ? `<section class="card"><h2>Grup maçları</h2>${mds}</section>` : ''}`;
  }

  /* ---------- İstatistik merkezi ---------- */
  function cmpBars(a, b) {
    const row = (l, x, y, max) => `<div class="cmp-row"><b class="${x >= y ? 'hi' : ''}">${typeof x === 'number' && x % 1 ? x.toFixed(1) : x}</b><i class="l"><u style="width:${Math.min(100, x / max * 100)}%"></u></i><span>${l}</span><i><u style="width:${Math.min(100, y / max * 100)}%"></u></i><b class="${y >= x ? 'hi' : ''}">${typeof y === 'number' && y % 1 ? y.toFixed(1) : y}</b></div>`;
    return row('Genel güç', a.ovr, b.ovr, 99) + ['pac', 'sho', 'pas', 'def', 'phy'].map(k => row(FM.ATTR_TR[k], a.a[k], b.a[k], 99)).join('') + row('Maç', a.apps, b.apps, 30) + row('Gol', a.g, b.g, 25) + row('Asist', a.as, b.as, 20) + row('Ort. puan', Math.round(FM.avgRating(a) * 10) / 10, Math.round(FM.avgRating(b) * 10) / 10, 10);
  }
  function viewStats() {
    const G = FM.G, S = G.stats, t = me(), n = Math.max(1, S.m), per = v => (v / n).toFixed(1).replace('.', ',');
    const pls = t.players.map(P).sort((a, b) => b.ovr - a.ovr);
    if (U.cmpA == null || !P(U.cmpA) || P(U.cmpA).tid !== t.id) U.cmpA = pls[0].id;
    if (U.cmpB == null || !P(U.cmpB) || P(U.cmpB).tid !== t.id) U.cmpB = pls[1].id;
    const dots = G.shots.map(sh => `<circle cx="${(sh.y * 68).toFixed(1)}" cy="${(sh.x * 105).toFixed(1)}" r="${sh.o === 'goal' ? 1.5 : 1}" class="s-${sh.o}"/>`).join('');
    const goals = G.shots.filter(x => x.o === 'goal').length;
    const pts = S.pts, W = 300, H = 70, mx = Math.max(3, pts[pts.length - 1] || 3);
    const line = pts.map((v, i) => (i ? 'L' : 'M') + (i / Math.max(1, pts.length - 1) * W).toFixed(1) + ' ' + (H - 5 - v / mx * (H - 10)).toFixed(1)).join('');
    const sel = (id, cur) => `<select id="${id}" data-a="cmp" data-k="${id}" aria-label="Oyuncu seç">${pls.map(p => `<option value="${p.id}" ${p.id === cur ? 'selected' : ''}>${esc(p.name)} (${FM.POS_TR[p.pos]})</option>`).join('')}</select>`;
    const best = pls.filter(p => p.rn >= 3).sort((a, b) => FM.avgRating(b) - FM.avgRating(a)).slice(0, 6);
    return `<div class="kpis"><div><span>Maç</span><b>${S.m}</b></div><div><span>Gol (attığı / yediği)</span><b>${S.gf} / ${S.ga}</b></div><div><span>Maç başı şut</span><b>${per(S.shots)}</b></div><div><span>İsabetli şut</span><b>${per(S.target)}</b></div><div><span>Topla oynama</span><b>%${Math.round(S.poss / n)}</b></div><div><span>Pas isabeti</span><b>%${S.pass ? Math.round(S.passOk / S.pass * 100) : 0}</b></div><div><span>Maç başı top kapma</span><b>${per(S.tack)}</b></div><div><span>Maç başı ofsayt</span><b>${per(S.off)}</b></div></div>
      <div class="grid2">
        <section class="card"><h2>Şut haritası <small>${G.shots.length} şut, ${goals} gol</small></h2>${G.shots.length ? `<svg class="shotmap" viewBox="0 52 68 55" role="img" aria-label="Bu sezonki şutların konumu: ${G.shots.length} şut, ${goals} gol"><rect x="0" y="52" width="68" height="53" class="sm-g"/><g class="sm-l"><rect x="0" y="52.500" width="68" height="52.500"/><rect x="13.840" y="88.500" width="40.320" height="16.500"/><rect x="24.840" y="99.500" width="18.320" height="5.500"/><circle cx="34" cy="94" r=".5"/><rect x="30.340" y="105" width="7.320" height="1.800"/></g><g>${dots}</g></svg><p class="legend"><span><i class="s-goal"></i>Gol</span><span><i class="s-save"></i>Kurtarış</span><span><i class="s-miss"></i>Dışarı / blok</span></p>` : '<p class="muted">İlk maçtan sonra şutların burada görünür.</p>'}</section>
        <section class="card"><h2>Puan gidişatı</h2>${pts.length > 1 ? `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Haftalara göre toplam puan: ${pts[pts.length - 1]}"><path d="${line}L${W} ${H}L0 ${H}z" class="area"/><path d="${line}" class="ln" pathLength="1"/></svg><div class="spark-l"><span>1. hafta</span><span>${pts.length}. hafta · ${pts[pts.length - 1]} puan</span></div>` : '<p class="muted">İki haftadan sonra grafik oluşur.</p>'}
          <h2>En yüksek ortalama puan</h2><ol class="rank">${best.map((p, i) => `<li><span class="wk">${i + 1}</span>${posChip(p.pos)}<span class="nm">${esc(p.name)}</span><span class="minif">${p.form.map(v => `<i class="${v >= 7.5 ? 'hi' : v < 6 ? 'lo' : ''}" style="height:${Math.round((v - 3) / 7 * 100)}%"></i>`).join('')}</span><b>${fmtR(FM.avgRating(p))}</b></li>`).join('') || '<li class="muted">En az 3 maç oynayan oyuncu yok.</li>'}</ol></section>
      </div>
      <section class="card"><h2>Oyuncu karşılaştırma</h2><div class="cmp-head">${sel('cmpA', U.cmpA)}<span>karşı</span>${sel('cmpB', U.cmpB)}</div><div class="cmp">${cmpBars(P(U.cmpA), P(U.cmpB))}</div></section>`;
  }

  /* ---------- Sosyal akış ---------- */
  function viewSocial() {
    const G = FM.G, list = G.social || [];
    return `<section class="card"><h2>Sosyal akış</h2><p class="muted">Taraftar yorumları, gazete manşetleri ve transfer söylentileri. Her maçtan sonra güncellenir.</p>
      <div class="feed">${list.map(x => `<article class="post ${x.kind}"><div class="pa">${esc(x.who[0])}</div><div><header><strong>${esc(x.who)}</strong><small>${esc(x.handle)} · ${x.s}. sezon ${x.w + 1}. hafta</small></header><p>${esc(x.text)}</p><footer>♥ ${x.likes.toLocaleString('tr-TR')}</footer></div></article>`).join('') || '<p class="muted">İlk maçtan sonra akış dolmaya başlar.</p>'}</div></section>`;
  }
  function stadiumTour(canvas) {
    const t = me(), w = canvas.parentElement.clientWidth, dpr = Math.min(2, window.devicePixelRatio || 1);
    const st = FM.Stadium3D && FM.Stadium3D.create({ canvas, W: w, dpr, tier: FM.stadiumTier(t), home: t, away: { c1: '#52627a', c2: '#c9d3e0' }, fill: Math.max(.3, Math.min(1, .35 + FM.G.fans / 100 * .6)), wx: { t: 'clear', n: 1 } });
    if (!st) return FM.Stadium.preview(canvas, t);
    U.tour = st; let ang = .6, drag = null, auto = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    canvas.style.touchAction = 'pan-y'; canvas.style.cursor = 'grab';
    canvas.onpointerdown = e => { drag = { x: e.clientX, a: ang }; auto = false; canvas.setPointerCapture(e.pointerId); };
    canvas.onpointermove = e => { if (drag) ang = drag.a - (e.clientX - drag.x) * .008; };
    canvas.onpointerup = canvas.onpointercancel = () => { drag = null; };
    const t0 = performance.now();
    (function loop(now) {
      if (U.tour !== st || !canvas.isConnected) return;
      const time = (now - t0) / 1000; if (auto) ang += .0025;
      st.render(time, { choreo: Math.min(1.2, time * .5), alpha: 1, cheer: [0, 0], disc: 0, shake: 0, shakeSide: 0, cer: -1, orbit: ang });
      requestAnimationFrame(loop);
    })(t0);
  }

  /* ---------- Gelen kutusu ---------- */
  const CATC = { KADRO: 'c1', BASIN: 'c2', 'MALİYE': 'c3', TRANSFER: 'c4', 'KULÜP': 'c5', SCOUT: 'c6' };
  function mailList() {
    const G = FM.G, q = U.mailQ.toLocaleLowerCase('tr');
    const list = (G.inbox || []).filter(m => (U.mailF === 'all' || (U.mailF === 'todo' ? (m.opts && !m.done) || (m.conf && !m.conf.done) : !m.read)) && (!q || (m.title + ' ' + m.body + ' ' + m.from).toLocaleLowerCase('tr').includes(q)));
    if (!list.length) return '<p class="muted mail-empty">Bu görünümde mesaj yok.</p>';
    let out = '', last = '';
    for (const m of list) {
      const key = m.s + '-' + m.w, dt = FM.fmtDate(m.s, m.w);
      if (key !== last) { last = key; out += `<h4 class="mail-day">${m.s === G.season && m.w === G.week ? 'Bugün · ' : ''}${dt.d} ${dt.g}</h4>`; }
      out += `<button class="mail-row ${m.id === U.mail ? 'on' : ''} ${m.read ? '' : 'new'}" data-a="mail" data-id="${m.id}">${FM.icon(m.opts ? 'inbox' : 'mail')}<span class="mt"><strong>${esc(m.title)}</strong><small>${esc(m.from)}</small></span><span class="mr"><i class="mtag ${CATC[m.cat] || ''}">${m.cat}</i>${m.opts && !m.done ? '<small>Karar</small>' : m.conf ? `<small>${m.conf.done ? (m.conf.exp ? 'Kaçırıldı' : 'Tamamlandı') : 'Toplantı'}</small>` : ''}</span></button>`;
    }
    return out;
  }
  function mailDetail() {
    const G = FM.G, m = (G.inbox || []).find(x => x.id === U.mail);
    if (!m) return '<div class="mail-none"><p class="muted">Okumak için soldan bir mesaj seç.</p></div>';
    const dt = FM.fmtDate(m.s, m.w), p = m.pid != null ? P(m.pid) : null, open = m.opts && !m.done;
    const card = p ? `<p class="mail-lbl">Oyuncu</p><button class="mail-pl" data-a="player" data-id="${p.id}">${posChip(p.pos)}<span class="nm"><strong>${esc(p.name)}</strong><small>${p.age} yaş · ${p.tid != null ? T(p.tid).name : 'Serbest'}</small></span><span><small>Genel güç</small>${ovrB(p)}</span><span><small>Değer</small><b>${money(p.value)}</b></span><span class="hide-s"><small>Sözleşme</small><b>${p.tid == null ? '—' : p.con + ' sezon'}</b></span><span class="hide-s"><small>Bu sezon</small><b>${p.apps} maç · ${fmtR(FM.avgRating(p))}</b></span></button>` : '';
    const opts = m.opts ? `<p class="mail-lbl">Kararın</p><div class="mail-opts">${m.opts.map((o, i) => `<button class="mail-opt ${open ? (U.mailPick === i ? 'on' : '') : (m.choice === i ? 'on' : 'off')}" data-a="mail-pick" data-v="${i}" ${open ? '' : 'disabled'}>${esc(o)}</button>`).join('')}</div>` : '';
    const foot = m.opts ? `<div class="mail-foot"><span class="${open ? 'wait' : 'done'}">${FM.icon('clock')} ${open ? 'Karar bekliyor' : esc(m.result || 'Karar verildi')}</span><span class="row">${p ? `<button class="btn" data-a="player" data-id="${p.id}">İncele</button>` : ''}${open ? `<button class="btn primary" data-a="mail-decide" ${U.mailPick == null ? 'disabled' : ''}>Kararı ver</button>` : ''}</span>${open && U.mailPick == null ? '<small>Önce bir cevap seç</small>' : ''}</div>` : '';
    return `<article class="mail-body"><button class="link mail-back" data-a="mail-back">‹ Gelen kutusu</button>
      <header><div class="mail-ic">${FM.icon(m.opts ? 'inbox' : 'mail')}</div><div><small>${esc(m.from)}</small><h3>${esc(m.title)}</h3></div><div class="mail-meta"><i class="mtag ${CATC[m.cat] || ''}">${m.cat}</i><small>${dt.d}</small></div></header>
      <p class="mail-text">${esc(m.body)}</p>${m.conf && FM.ui.confDetail ? FM.ui.confDetail(m) : card + opts + foot}</article>`;
  }
  function viewInbox() {
    const todo = pending().length, un = unread().length;
    return `<div class="inbox ${U.mailOpen ? 'open' : ''}">
      <section class="card mail-side"><div class="mail-head"><h2>Gelen kutusu <small>${un} okunmamış</small></h2><button class="link" data-a="mail-allread">Tümünü okundu say ›</button></div>
        <label class="mail-search" for="mailq">${FM.icon('search')}<input id="mailq" type="search" placeholder="Mektuplarda ara" value="${esc(U.mailQ)}" autocomplete="off"></label>
        <div class="seg">${[['all', 'Tümü', ''], ['todo', 'İşler', todo], ['unread', 'Okunmamış', un]].map(([k, n, c]) => `<button data-a="mail-filter" data-v="${k}" class="${U.mailF === k ? 'on' : ''}">${n}${c ? ' ' + c : ''}</button>`).join('')}</div>
        <div class="mail-list" id="mailList">${mailList()}</div></section>
      <section class="card mail-main" id="mailMain">${mailDetail()}</section></div>`;
  }
  function settingsModal() {
    modal(`<h3>Ayarlar</h3>
      <div class="set-row"><div><strong>Ses</strong><p class="muted">Düdük, tribün ve gol sesleri</p></div><button class="btn" data-a="sound-set">${FM.Audio.muted ? 'Kapalı · aç' : 'Açık · kapat'}</button></div>
      <div class="set-row"><div><strong>Kariyer kaydı</strong><p class="muted">Oyun bu tarayıcıda otomatik kaydedilir. Başka cihaza taşımak için dışa aktar.</p></div><div class="row"><button class="btn" data-a="export">Dışa aktar</button><button class="btn" data-a="import">Yükle</button></div></div>
      <div class="set-row"><div><strong>Yeni kariyer</strong><p class="muted">${U.confirmReset ? 'Tüm kariyer silinecek. Emin misin?' : 'Mevcut kariyeri siler ve baştan başlar.'}</p></div>${U.confirmReset ? '<div class="row"><button class="btn" data-a="reset-no">Vazgeç</button><button class="btn danger" data-a="reset-yes">Kariyeri sil</button></div>' : '<button class="btn" data-a="reset">Yeni kariyere başla</button>'}</div>`, true);
  }
  function searchResults(q) {
    const box = $('gsr'); if (!box) return;
    q = q.trim().toLocaleLowerCase('tr');
    if (q.length < 2) { box.hidden = true; return; }
    const G = FM.G, teams = G.teams.filter(t => t.name.toLocaleLowerCase('tr').includes(q)).slice(0, 3);
    const pls = Object.values(G.players).filter(p => p.name.toLocaleLowerCase('tr').includes(q)).sort((a, b) => (b.tid === G.teamId) - (a.tid === G.teamId) || FM.est(b)[0] - FM.est(a)[0]).slice(0, 7);
    box.innerHTML = (teams.map(t => `<button data-a="team" data-id="${t.id}">${FM.crest(t, 22)}<span><strong>${t.name}</strong><small>${FM.DIV_TR[t.div]}</small></span></button>`).join('') + pls.map(p => `<button data-a="player" data-id="${p.id}">${posChip(p.pos)}<span><strong>${esc(p.name)}</strong><small>${p.tid != null ? T(p.tid).name : 'Serbest'} · ${p.age} yaş</small></span>${ovrB(p)}</button>`).join('')) || '<p class="muted">Sonuç yok.</p>';
    box.hidden = false;
  }

  /* ---------- Sezon sonu, görevden alınma ---------- */
  const jobCards = ids => ids.map(id => { const t = T(id); return `<button class="team-card" data-a="job" data-id="${id}" style="--k1:${t.c1};--k2:${t.c2}">${FM.crest(t, 52)}<strong>${t.name}</strong><span class="muted">${FM.DIV_TR[t.div]}</span></button>`; }).join('');
  function seasonScreen() {
    const G = FM.G, s = G.summary, ch = T(s.champion), won = s.champion === G.teamId, up = s.up.includes(G.teamId), down = s.down.includes(G.teamId);
    const head = won ? 'ŞAMPİYON!' : up ? 'YÜKSELDİN!' : down ? 'Küme düştün' : s.pos + '. sırada bitirdin';
    return `<div class="season-end"><img class="trophy ${won || up ? 'won' : ''}" src="assets/trophy.svg" alt="" width="120" height="140">
      <p class="eyebrow">${s.season}. sezon tamamlandı · ${FM.DIV_TR[s.div]}</p><h1>${head}</h1>
      <p>${won ? 'Kupa müzene geliyor. Taraftar sokaklarda!' : `Yıldızlar Ligi şampiyonu: ${ch.name}`}${s.cup != null ? ` · Kupa: ${T(s.cup).name}` : ''}</p>
      <div class="kpis"><div><span>Lig sırası</span><b>${s.pos}.</b></div><div><span>Yönetim hedefi</span><b>${s.exp}.</b></div><div><span>Ödül</span><b>${money(s.prize)}</b></div>${s.top ? `<div><span>Gol kralı</span><b>${esc(s.top.name)} (${s.top.g})</b></div>` : ''}</div>
      <p class="${s.pos <= s.exp ? 'good' : 'bad'}">${s.pos <= s.exp ? 'Yönetim hedefi tutturuldu.' : 'Hedefin gerisinde kaldın. Yönetim gelecek sezon daha iyisini bekliyor.'}</p>
      <p class="muted">Yükselenler: ${s.up.map(id => T(id).name).join(', ')} · Düşenler: ${s.down.map(id => T(id).name).join(', ')}</p>
      ${s.awards ? `<section class="card awards"><h2>Sezon ödülleri · ${FM.DIV_TR[s.div]}</h2><div class="kpis">${s.awards.poy ? `<div class="${s.awards.poy.mine ? 'mine' : ''}"><span>Yılın oyuncusu</span><b>${esc(s.awards.poy.name)}</b><small>${s.awards.poy.team} · ${fmtR(s.awards.poy.r)}</small></div>` : ''}${s.awards.young ? `<div class="${s.awards.young.mine ? 'mine' : ''}"><span>Yılın genç oyuncusu</span><b>${esc(s.awards.young.name)}</b><small>${s.awards.young.team} · ${fmtR(s.awards.young.r)}</small></div>` : ''}${s.awards.coach ? `<div class="${s.awards.coach.mine ? 'mine' : ''}"><span>Yılın teknik direktörü</span><b>${s.awards.coach.mine ? esc(G.manager) : s.awards.coach.team + ' hocası'}</b><small>${s.awards.coach.team}</small></div>` : ''}${s.euro != null ? `<div><span>Kıta Kupası</span><b>${T(s.euro).name}</b></div>` : ''}</div><p class="muted">Yılın 11'i: ${s.awards.xi.map(x => `<span class="${x.mine ? 'minet' : ''}">${esc(x.name)}</span>`).join(', ')}</p></section>` : ''}
      <div class="podium">${s.table.map((id, i) => `<div class="p${i + 1}">${FM.crest(T(id), 48)}<strong>${T(id).name}</strong><span>${i + 1}.</span></div>`).join('')}</div>
      ${G.jobOffers.length ? `<section class="card jobs"><h2>İş teklifleri</h2><p class="muted">Başarın dikkat çekti. İstersen yeni sezona başka bir kulüpte başlayabilirsin.</p><div class="team-grid">${jobCards(G.jobOffers)}</div></section>` : ''}
      <button class="btn primary big" data-a="new-season">${me().name} ile yeni sezona başla</button></div>`;
  }
  function sackedScreen() {
    const G = FM.G;
    return `<div class="season-end sacked"><p class="eyebrow">${G.season}. sezon · ${Math.min(G.week + 1, FM.WEEK_COUNT)}. hafta</p><h1>Görevden alındın</h1>
      <p>${me().name} yönetimi sonuçlardan memnun kalmadı ve sözleşmeni feshetti. Kariyerin bitmedi: seni isteyen kulüpler var.</p>
      <section class="card jobs"><h2>Gelen teklifler</h2><div class="team-grid">${jobCards(G.jobOffers)}</div></section>
      <button class="link" data-a="reset-yes">Yeni kariyere başla</button></div>`;
  }

  /* ---------- Çizim ve akış ---------- */
  const VIEWS = { youth: viewYouth, euro: viewEuro, stats: viewStats, social: viewSocial, inbox: viewInbox, career: viewCareer, home: viewHome, squad: viewSquad, tactics: viewTactics, fixtures: viewFixtures, table: viewTable, transfer: viewTransfer, training: viewTraining, club: viewClub };
  function render(keepScroll) {
    const G = FM.G, app = $('app'), y = window.scrollY;
    if (!G) { app.innerHTML = U.screen === 'new' || !FM.ui.menuScreen ? startScreen() : FM.ui.menuScreen(); if (FM.ui.after) FM.ui.after(); return; }
    if (G.phase === 'sacked') { app.innerHTML = sackedScreen(); return; }
    if (G.phase === 'seasonEnd') { app.innerHTML = seasonScreen(); confettiBurst(); return; }
    app.innerHTML = shell(VIEWS[U.view]());
    if (keepScroll) { $('view').classList.remove('enter'); window.scrollTo(0, y); }
    if (U.tour) { U.tour.dispose(); U.tour = null; }
    if ($('stPrev')) stadiumTour($('stPrev'));
    countBalance();
    if (FM.ui.after) FM.ui.after();
  }
  function countBalance() {
    const el = $('bal'), to = FM.G.fin.balance, from = U.shownBal;
    U.shownBal = to;
    if (from == null || from === to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t0 = performance.now();
    el.classList.add(to > from ? 'up' : 'down');
    (function step(t) {
      const k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3), cur = $('bal');
      if (!cur) return;
      cur.textContent = money(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step); else cur.classList.remove('up', 'down');
    })(t0);
  }
  function confettiBurst() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const host = document.querySelector('.season-end'); if (!host) return;
    const t = me();
    for (let i = 0; i < 60; i++) {
      const c = document.createElement('i');
      c.className = 'cf';
      c.style.cssText = `left:${Math.random() * 100}%;background:${[t.c1, t.c2, '#ffc93c'][i % 3]};animation-delay:${Math.random() * 2.5}s;animation-duration:${2.5 + Math.random() * 2}s`;
      host.appendChild(c);
    }
  }
  function playMatch(force) {
    const G = FM.G, t = me(), mid = G.cupDue ? 'cup' : G.euroDue ? 'euro' : null;
    const tie = mid === 'cup' ? FM.cupTie() : mid === 'euro' ? FM.euroTie() : null;
    const name = mid === 'cup' ? 'Kupa · ' + G.cup.name : mid === 'euro' ? 'Kıta Kupası · ' + FM.EURO_ROUNDS[G.euro.round] : '';
    const finish = () => (mid === 'cup' ? FM.playCupRound() : FM.playEuroRound());
    if (mid && !tie) { const ties = finish(); render(); return cupModal(name, ties); }
    const fx = mid ? tie : FM.userFixture();
    const changed = FM.ensureLineup(t);
    if (t.lineup.filter(x => x != null).length < 11) toast('Sahaya 11 kişiden az çıkıyorsun: uygun oyuncu yok.', 'bad');
    else if (changed.length) toast('Kadro güncellendi: ' + changed.map(id => P(id).name).join(', ') + ' ilk 11\'e girdi.');
    const opts = mid === 'cup' ? { cup: true, neutral: G.cup.final } : mid === 'euro' ? { cup: G.euro.round >= 3, euro: true, neutral: G.euro.round === 5 } : {};
    const ctx = { mid, fx, name, opts, finish };
    if (FM.ui.preMatch && !force) return FM.ui.preMatch(ctx);
    startMatch(ctx, {});
  }
  /* Maçı başlat (maç öncesi ekranından ya da doğrudan); extra: { kit, ban } */
  function startMatch(ctx, extra) {
    const G = FM.G, t = me(), { mid, fx, name, opts, finish } = ctx;
    FM.Audio.init();
    const m = FM.newMatch(fx, opts), wk = G.week;
    FM.MatchView.start(m, () => {
      FM.finishMatch(m);
      let ties = null;
      if (mid) ties = finish(); else { FM.simOthers(); FM.endWeek(); }
      t.plan.mark = null;
      U.view = 'home'; U.fxWeek = null; U.sel = null;
      render(); window.scrollTo(0, 0);
      if (mid) cupModal(name, ties); else if (!G.phase) weekModal(wk);
    }, { comp: mid ? name : `${FM.DIV_TR[t.div]} · ${G.week + 1}. hafta`, ...(extra || {}) });
  }
  function weekModal(wk) {
    const G = FM.G, l = G.fin.last;
    modal(`<h3>${wk + 1}. hafta sonuçları</h3><ul class="fxl">${G.fixtures[me().div][wk].map(f => fxRow(f)).join('')}</ul>
      <p class="fin-line">Haftalık bilanço: <b class="${l.net >= 0 ? 'pos-v' : 'neg-v'}">${l.net >= 0 ? '+' : ''}${money(l.net)}</b>${l.att ? ` · ${l.att.toLocaleString('tr-TR')} seyirci` : ''}</p>
      <div class="row end">${FM.ui.confBtn ? FM.ui.confBtn() : ''}<button class="btn primary" data-a="close">Tamam</button></div>`, true);
  }
  function cupModal(name, ties) {
    const c = FM.G.cup;
    modal(`<h3>${name}</h3><ul class="fxl">${ties.map(f => fxRow(f)).join('')}</ul>${c.winner != null ? `<p class="fin-line"><img src="assets/trophy.svg" alt="" width="28" height="32"> Kupa ${T(c.winner).name} takımının!</p>` : ''}
      <div class="row end">${FM.ui.confBtn ? FM.ui.confBtn() : ''}<button class="btn primary" data-a="close">Tamam</button></div>`, true);
  }
  function exportModal() {
    modal(`<h3>Kaydı dışa aktar</h3><p class="muted">Bu metni kopyalayıp sakla. Başka cihazda “Kayıt yükle” ile yapıştır.</p><textarea id="saveText" readonly rows="6">${esc(FM.exportSave())}</textarea><div class="row end"><button class="btn primary" data-a="copy-save">Kopyala</button></div>`, true);
  }
  function importModal() {
    modal(`<h3>Kayıt yükle</h3><p class="muted">Dışa aktardığın metni yapıştır ya da kayıt dosyasını seç. Şu anki kariyerin üzerine yazılır.</p><textarea id="loadText" rows="6" placeholder="Kayıt metnini buraya yapıştır"></textarea><label class="filein" for="loadFile">Dosya seç <input type="file" id="loadFile" accept=".json,.txt,application/json,text/plain"></label><div class="row end"><button class="btn primary" data-a="do-import">Yükle</button></div>`, true);
  }

  function act(a, d, el) {
    const G = FM.G, say = r => toast(r.msg, r.ok ? 'good' : 'bad');
    switch (a) {
      case 'pick-team': U.pickTeam = +d.id; { const v = $('mgr').value, y = window.scrollY; render(); $('mgr').value = v; window.scrollTo(0, y); } break;
      case 'start': FM.Audio.init(); FM.setSlot(U.newSlot || FM.slot()); FM.newGame(U.pickTeam, $('mgr').value.trim()); U.screen = null; U.hist = ['home']; U.hi = 0; U.tourStep = FM.Settings && !FM.Settings.get('tourDone') ? 0 : null; U.view = 'home'; U.shownBal = null; render(); window.scrollTo(0, 0); break;
      case 'tab': go(d.v); break;
      case 'back': if (U.hi > 0) go(U.hist[--U.hi], true); break;
      case 'fwd': if (U.hi < U.hist.length - 1) go(U.hist[++U.hi], true); break;
      case 'settings': U.confirmReset = false; if (FM.ui.openSettings) FM.ui.openSettings(); else settingsModal(); break;
      case 'sound-set': FM.Audio.init(); FM.Audio.toggle(); settingsModal(); break;
      case 'mail': { const m = G.inbox.find(x => x.id === +d.id); if (m) { m.read = true; U.mail = m.id; U.mailPick = null; U.mailOpen = true; FM.save(); render(true); } } break;
      case 'mail-pick': U.mailPick = +d.v; $('mailMain').innerHTML = mailDetail(); break;
      case 'mail-decide': { const r = FM.decide(U.mail, U.mailPick); say(r); U.mailPick = null; render(true); } break;
      case 'mail-filter': U.mailF = d.v; render(true); break;
      case 'mail-allread': for (const m of G.inbox) m.read = true; FM.save(); render(true); break;
      case 'mail-back': U.mailOpen = false; render(true); break;
      case 'sound': el.innerHTML = FM.icon(FM.Audio.toggle() ? 'mute' : 'sound'); break;
      case 'play': playMatch(); break;
      case 'close': closeModal(); break;
      case 'player': playerModal(+d.id); break;
      case 'team': teamModal(+d.id); break;
      case 'slot': tacticClick('slot', +d.i); break;
      case 'bench': tacticClick('bench', +d.id); break;
      case 'formation': me().formation = d.v; FM.autoPick(me()); U.sel = null; FM.save(); render(true); break;
      case 'ment': me().ment = +d.v; FM.save(); render(true); break;
      case 'tac': me().tac[d.k] = +d.v; FM.save(); render(true); break;
      case 'sp': me().sp[d.k] = +el.value; FM.save(); break;
      case 'autopick': FM.autoPick(me()); U.sel = null; FM.save(); render(true); toast('En formda 11 sahaya sürüldü.'); break;
      case 'fxw': U.fxWeek = +d.v; render(true); break;
      case 'fxtab': U.fxTab = d.v; render(true); break;
      case 'tbldiv': U.tblDiv = +d.v; render(true); break;
      case 'tf-pos': U.tf.pos = d.v; render(true); break;
      case 'tf-afford': U.tf.afford = el.checked; render(true); break;
      case 'tf-free': U.tf.free = el.checked; render(true); break;
      case 'focus': G.training.focus = d.v; FM.save(); render(true); break;
      case 'intensity': G.training.intensity = +d.v; FM.save(); render(true); break;
      case 'y-promote': { const r = FM.promote(+d.id); say(r); closeModal(); render(true); } break;
      case 'y-release': say(FM.releaseYouth(+d.id)); closeModal(); render(true); break;
      case 'jab': { const r = FM.jab(+d.id); say(r); if (r.ok) { render(true); playerModal(+d.id); } } break;
      case 'captain': FM.setCaptain(+d.id); toast(P(+d.id).name + ' artık kaptan.', 'good'); render(true); playerModal(+d.id); break;
      case 'captain-sel': FM.setCaptain(+el.value); render(true); break;
      case 'plan-focus': me().plan.focus = +d.v; FM.save(); teamModal(+d.id); break;
      case 'plan-mark': me().plan.mark = el.value === '' ? null : +el.value; FM.save(); break;
      case 'staff': say(FM.hireStaff(d.v)); render(true); break;
      case 'ticket': FM.setTicket(G.fin.ticket + +d.v); render(true); break;
      case 'cmp': U[d.k] = +el.value; render(true); break;
      case 'upgrade': say(FM.upgrade(d.v)); render(true); break;
      case 'buy': { if (!d.h && FM.ui.acts['neg-open']) { FM.ui.acts['neg-open']({ id: d.id, k: 'sign' }); break; } const r = FM.buy(+d.id, !!d.h); say(r); if (r.ok) { closeModal(); render(true); } } break;
      case 'loan-in': { const r = FM.loanIn(+d.id); say(r); if (r.ok) { closeModal(); render(true); } } break;
      case 'loan-out': { const r = FM.loanOut(+d.id); say(r); if (r.ok) { closeModal(); render(true); } } break;
      case 'scout': { const r = FM.scout(+d.id); say(r); if (r.ok) { closeModal(); render(true); } } break;
      case 'renew': { if (FM.ui.acts['neg-open']) { FM.ui.acts['neg-open']({ id: d.id, k: 'renew' }); break; } const r = FM.renew(+d.id); say(r); if (r.ok) { render(true); playerModal(+d.id); } } break;
      case 'talk': { const r = FM.talk(+d.id, d.k); say(r); if (r.msg.indexOf('zaten') < 0) playerModal(+d.id); } break;
      case 'press': { const r = FM.answerPress(+d.v); if (r) { const f = r.fx, parts = []; if (f.fans) parts.push(`taraftar ${f.fans > 0 ? '+' : ''}${f.fans}`); if (f.board) parts.push(`yönetim ${f.board > 0 ? '+' : ''}${f.board}`); if (f.mor) parts.push(`moral ${f.mor > 0 ? '+' : ''}${f.mor}`); toast(parts.length ? 'Açıklamanın etkisi: ' + parts.join(', ') : 'Açıklaman yankı uyandırmadı.'); } render(true); } break;
      case 'sell-ask': {
        const r = FM.sellOffer(+d.id);
        if (!r.ok) { say(r); break; }
        $('pmAct').innerHTML = `<p class="price"><b>${T(r.tid).name}</b> ${money(r.amt)} teklif ediyor.</p><div class="row"><button class="btn" data-a="close">Reddet</button><button class="btn primary" data-a="sell-yes" data-id="${d.id}" data-t="${r.tid}" data-amt="${r.amt}">Sat</button></div>`;
      } break;
      case 'sell-yes': FM.sell(+d.id, +d.t, +d.amt); closeModal(); render(true); toast('Transfer tamamlandı.', 'good'); break;
      case 'offer-yes': {
        const o = G.offers.find(x => x.pid === +d.id);
        if (me().players.length <= 16) { toast('Kadroda en az 16 oyuncu kalmalı.', 'bad'); break; }
        if (o) { FM.sell(o.pid, o.tid, o.amt); toast('Teklif kabul edildi.', 'good'); } render(true);
      } break;
      case 'offer-no': G.offers = G.offers.filter(x => x.pid !== +d.id); FM.save(); render(true); break;
      case 'job': FM.takeJob(+d.id); U.view = 'home'; U.shownBal = null; toast(`${me().name} ile anlaştın.`, 'good'); render(); window.scrollTo(0, 0); break;
      case 'export': exportModal(); break;
      case 'import': importModal(); break;
      case 'copy-save': { const ta = $('saveText'); ta.select(); const ok = () => toast('Kayıt panoya kopyalandı.', 'good'); if (navigator.clipboard) navigator.clipboard.writeText(ta.value).then(ok).catch(() => toast('Metin seçildi: Ctrl+C ile kopyala.')); else toast('Metin seçildi: Ctrl+C ile kopyala.'); } break;
      case 'do-import': { const r = FM.importSave($('loadText').value.trim()); say(r); if (r.ok) { closeModal(); U.view = 'home'; U.shownBal = null; render(); window.scrollTo(0, 0); } } break;
      case 'reset': U.confirmReset = true; settingsModal(); break;
      case 'reset-no': U.confirmReset = false; settingsModal(); break;
      case 'reset-yes': closeModal(); FM.reset(); U.confirmReset = false; U.view = 'home'; U.shownBal = null; render(); window.scrollTo(0, 0); break;
      case 'new-season': FM.startNewSeason(); U.view = 'home'; render(); window.scrollTo(0, 0); break;
      default: if (FM.ui.acts[a]) FM.ui.acts[a](d, el);
    }
  }
  document.addEventListener('click', e => {
    if (e.target.id === 'modal') return closeModal();
    if (!e.target.closest('.gsearch') && $('gsr')) $('gsr').hidden = true;
    const el = e.target.closest('[data-a]'); if (!el || el.disabled || el.type === 'checkbox' || el.type === 'range' || el.type === 'color' || el.tagName === 'SELECT') return;
    if (el.closest('.gsr')) { $('gsr').hidden = true; $('gsearch').value = ''; }
    act(el.dataset.a, el.dataset, el);
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'gsearch') searchResults(e.target.value);
    else if (e.target.id === 'mailq') { U.mailQ = e.target.value; $('mailList').innerHTML = mailList(); }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'loadFile' && e.target.files[0]) { const rd = new FileReader(); rd.onload = () => { $('loadText').value = rd.result; }; rd.readAsText(e.target.files[0]); return; }
    const el = e.target.closest('input[data-a], select[data-a]'); if (el) act(el.dataset.a, el.dataset, el);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('modal').hidden) closeModal();
    else if (e.key === 'Escape' && $('press') && !$('press').hidden) FM.ui.acts['press-close']();
    else if (e.key === 'Escape' && $('pre') && !$('pre').hidden) FM.ui.acts['pre-close']();
    if (e.key === 'Enter' && e.target.matches('tr[data-a]')) act(e.target.dataset.a, e.target.dataset, e.target);
    if (e.key === 'Enter' && e.target.id === 'mgr') act('start', {}, e.target);
  });

  /* Ek arayüz modüllerinin (ui-more.js) kullandığı yardımcılar */
  FM.ui = { U, $, esc, toast, modal, closeModal, render, go, me, stars, posChip, fitBar, status, ovrB, ovrCls, fmtR, meter, gauge, spark, playerRows, P_HEAD, VIEWS, GROUPS, playerModal, teamModal, playMatch, startMatch, fxRow, cupModal, weekModal, pending, settingsModal, acts: {} };
})();
