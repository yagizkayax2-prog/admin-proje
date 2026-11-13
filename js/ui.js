/* Saha Kenarı — arayüz: ekranlar, pencereler, etkileşim */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const { P, T, money } = FM;
  const U = { view: 'home', fxWeek: null, fxTab: 'lig', tblDiv: null, sel: null, tf: { pos: 'ALL', afford: false }, pickTeam: 0, confirmReset: false, shownBal: null, ib: { sel: null, f: 'all', q: '', pick: null, open: false } };
  const TABS = [['home', 'Ana Sayfa'], ['inbox', 'Gelen Kutusu'], ['squad', 'Kadro'], ['tactics', 'Taktik'], ['fixtures', 'Fikstür'], ['table', 'Lig'], ['transfer', 'Transfer'], ['training', 'Antrenman'], ['club', 'Kulüp']];
  const me = () => T(FM.G.teamId);
  const stars = n => `<span class="stars" aria-label="${n} yıldız">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`;
  const posChip = pos => `<span class="pos ${pos}">${FM.POS_TR[pos]}</span>`;
  const fitBar = v => `<span class="fit ${v < 60 ? 'low' : v < 80 ? 'mid' : ''}" title="Kondisyon ${Math.round(v)}"><i style="width:${Math.round(v)}%"></i></span>`;
  const status = p => (p.inj ? `<span class="tag bad">Sakat ${p.inj}h</span>` : p.susp ? '<span class="tag bad">Cezalı</span>' : '') + (p.loan ? '<span class="tag info">Kiralık</span>' : '');
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
      <div class="start-hero"><button class="btn icon back-menu" data-a="to-menu" aria-label="Ana menüye dön">${FM.icon('back')}</button><img class="stad" src="assets/stadium.svg" alt=""><div class="start-title"><img src="assets/logo.svg" alt="" width="72" height="72"><div><h1>Saha Kenarı</h1><p>Kulübünü seç, kadronu kur, şampiyonluğa yürü.</p></div></div><img class="hero-ball" src="assets/ball.svg" alt="" width="46" height="46"></div>
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
  function shell(inner) {
    const G = FM.G, t = me(), unr = FM.Inbox.unread(), pend = FM.Inbox.pending().length;
    return `<header class="top"><div class="top-in">
        <div class="club">${FM.crest(t, 38)}<div><strong>${t.name}</strong><span>${esc(G.manager)} · ${G.season}. sezon · Hafta ${Math.min(G.week + 1, FM.WEEK_COUNT)}/${FM.WEEK_COUNT}</span></div></div>
        <div class="top-r"><div class="bal"><span>Bütçe</span><b id="bal" class="${G.fin.balance < 0 ? 'neg' : ''}">${money(G.fin.balance)}</b></div>
        <div class="today"><b>${FM.Inbox.fmtDate(G.season, FM.Inbox.today())}</b><span>${FM.Inbox.fmtDate(G.season, FM.Inbox.today(), true).split(' ').pop()}</span></div>
        <button class="btn primary go" data-a="continue">${pend ? `<b>${pend}</b>` : ''}<span>Devam et</span>${FM.icon('play')}</button>
        <button class="btn icon" data-a="sound" aria-label="Ses aç/kapat">${FM.icon(FM.Audio.muted ? 'mute' : 'sound')}</button><button class="btn icon" data-a="menu" aria-label="Oyun menüsü">${FM.icon('menu')}</button></div>
      </div>
      <nav class="tabs" aria-label="Bölümler"><div class="tabs-in">${TABS.map(([k, n]) => `<button data-a="tab" data-v="${k}" class="${U.view === k ? 'on' : ''}" ${U.view === k ? 'aria-current="page"' : ''}>${FM.icon(k)}<span>${n}</span>${k === 'inbox' && unr ? `<em class="badge" aria-label="${unr} okunmamış">${unr}</em>` : ''}</button>`).join('')}</div></nav>
    </header><main class="view enter ${U.view === 'inbox' ? 'wide' : ''}" id="view">${inner}</main>${ticker()}`;
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
    const euro = G.euroDue && FM.Career.euroTie(), cup = !euro && G.cupDue, tie = cup ? FM.cupTie() : null, fx = euro || (cup ? tie : FM.userFixture()), ko = !!(euro || cup), fin = euro ? G.euro.final : G.cup.final, der = !ko && FM.Career.isDerby(fx);
    let hero;
    if (cup && !tie) {
      hero = `<section class="next"><img class="stad" src="assets/stadium.svg" alt=""><div class="next-in"><p class="eyebrow">Kupa · ${G.cup.name}</p><h3>${G.cup.alive.includes(G.teamId) ? 'Bu turu maç yapmadan geçtin' : 'Kupada elendin'}</h3><p class="hint">${G.cup.ties.length} maç oynanacak.</p><button class="btn primary big" data-a="play">Kupa turunu oynat</button></div></section>`;
    } else {
      const h = T(fx.h), a = T(fx.a), opp = fx.h === G.teamId ? a : h;
      hero = `<section class="next ${ko ? 'cup' : ''} ${euro ? 'euro' : ''}"><img class="stad" src="assets/stadium.svg" alt="">
        <div class="next-in"><p class="eyebrow">${euro ? 'Kıta Kupası · ' + G.euro.name : cup ? 'Kupa · ' + G.cup.name : FM.DIV_TR[t.div] + ' · ' + (G.week + 1) + '. hafta'} · ${h.stadium}</p>${der ? `<p class="derby-b">${esc(der)}</p>` : ''}
          <div class="vs"><div class="vt">${FM.crest(h, 72)}<strong>${h.name}</strong><span class="form">${form(h.id)}</span></div><b>VS</b><div class="vt">${FM.crest(a, 72)}<strong>${a.name}</strong><span class="form">${form(a.id)}</span></div></div>
          <button class="btn primary big pulse" data-a="play">${FM.icon('play')} Maça çık</button>
          <button class="link" data-a="team" data-id="${opp.id}">Rakip analizi: ${opp.name}</button>
          <p class="chips">${wxChip(fx.wx || { t: 'clear', n: 0 })}<span class="chip">${ko && fin ? 'Tarafsız saha' : fx.h === G.teamId ? 'İç saha' : 'Deplasman'}</span><span class="chip">${FM.Stadium.TIERS[FM.stadiumTier(h)]}</span>${ko ? '<span class="chip">Eleme: uzatma ve penaltılar</span>' : `<span class="chip">Rakip ${FM.DIV_TR[opp.div]}'nde ${FM.table(opp.div).findIndex(r => r.id === opp.id) + 1}.</span>`}</p></div>
      </section>`;
    }
    const last = G.week > 0 ? G.fixtures[t.div][G.week - 1] : null;
    return hero +
      inboxPreview() +
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

  /* ---------- Gelen kutusu ---------- */
  const IB = () => FM.G.inbox;
  const rich = s => esc(s).replace(/\{p:(\d+)\}/g, (_, id) => { const p = P(+id); return p ? `<button class="lnk" data-a="player" data-id="${id}">${esc(p.name)}</button>` : 'eski bir oyuncu'; })
    .replace(/\{t:(\d+)\}/g, (_, id) => `<button class="lnk" data-a="team" data-id="${id}">${esc(T(+id).name)}</button>`);
  const plain = s => s.replace(/\{p:(\d+)\}/g, (_, id) => (P(+id) ? P(+id).name : 'eski bir oyuncu')).replace(/\{t:(\d+)\}/g, (_, id) => T(+id).name);
  const mKey = m => m.s * 1000 + m.d;
  function ibFiltered() {
    const q = U.ib.q.trim().toLocaleLowerCase('tr');
    return IB().filter(m => (U.ib.f === 'todo' ? FM.Inbox.todo(m) : U.ib.f === 'unread' ? !m.read : true) &&
      (!q || (m.title + ' ' + m.from + ' ' + m.cat + ' ' + plain(m.body)).toLocaleLowerCase('tr').includes(q)))
      .sort((a, b) => mKey(b) - mKey(a) || b.id - a.id);
  }
  function dayLabel(m) {
    const G = FM.G, t = FM.Inbox.today(), full = FM.Inbox.fmtDate(m.s, m.d, true);
    if (m.s === G.season && m.d === t) return 'Bugün · ' + full;
    if (m.s === G.season && m.d === t - 1) return 'Dün · ' + full;
    return full;
  }
  const ibItem = m => `<li><button class="ib-it ${m.read ? '' : 'new'} ${U.ib.sel === m.id ? 'on' : ''}" data-a="ib-open" data-id="${m.id}" ${U.ib.sel === m.id ? 'aria-current="true"' : ''}>
      <span class="ib-ic">${FM.icon(m.ic)}</span><span class="ib-tx"><strong>${esc(m.title)}</strong><small>${esc(m.from)}</small></span>
      <span class="ib-meta"><em class="cat c-${m.cat}">${m.cat}</em>${m.conf ? `<small class="${m.conf.done ? 'done' : 'todo'}">${m.conf.done ? (m.conf.exp ? 'Kaçırıldı' : 'Tamamlandı') : 'Toplantı'}</small>` : m.opts ? `<small class="${m.ch == null ? 'todo' : 'done'}">${m.ch == null ? 'Karar' : m.exp ? 'Süresi doldu' : 'Yanıtlandı'}</small>` : ''}</span></button></li>`;
  function ibListHtml() {
    const list = ibFiltered();
    if (!list.length) return `<p class="muted ib-empty">${U.ib.q ? 'Aramana uyan mesaj yok.' : U.ib.f === 'todo' ? 'Bekleyen kararın yok.' : 'Okunmamış mesajın yok.'}</p>`;
    let out = '', last = null;
    for (const m of list) { const k = mKey(m); if (k !== last) { out += `${last != null ? '</ul>' : ''}<h4 class="ib-day">${dayLabel(m)}</h4><ul class="ib-ul">`; last = k; } out += ibItem(m); }
    return out + '</ul>';
  }
  function ibCard(m) {
    const p = m.pid != null ? P(m.pid) : null;
    if (p) {
      const t = p.tid != null ? T(p.tid) : null;
      return `<p class="ib-lbl">Oyuncu</p><button class="ib-card" data-a="player" data-id="${p.id}">${posChip(p.pos)}${FM.avatar(p, 40)}
        <span class="ib-cn"><strong>${esc(p.name)}</strong><small>${p.age} yaş · ${t ? esc(t.name) : 'Serbest'}${p.inj ? ' · Sakat ' + p.inj + ' hafta' : ''}</small></span>
        <span class="ib-st"><span>Genel güç</span>${ovrB(p)}</span><span class="ib-st"><span>Değer</span><b>${money(p.value)}</b></span>
        <span class="ib-st hide-s"><span>Sözleşme</span><b>${p.tid == null ? '—' : p.con + ' sezon'}</b></span><span class="ib-st hide-s"><span>Bu sezon</span><b>${p.apps} maç · ${fmtR(FM.avgRating(p))}</b></span></button>`;
    }
    return '';
  }
  function ibDetailHtml() {
    const m = IB().find(x => x.id === U.ib.sel);
    if (!m) return `<div class="ib-none">${FM.icon('inbox')}<p>Okumak için bir mesaj seç.</p></div>`;
    const decided = m.ch != null, pick = decided ? m.ch : U.ib.pick, link = m.pid != null && P(m.pid) ? `data-a="player" data-id="${m.pid}"` : m.tid != null ? `data-a="team" data-id="${m.tid}"` : '';
    return `<button class="ib-back link" data-a="ib-back">${FM.icon('back')} Gelen kutusu</button>
      <header class="ib-h"><span class="ib-ic big">${FM.icon(m.ic)}</span><div><p class="ib-from">${esc(m.from)} · ${esc(m.role)}</p><h3>${rich(m.title)}</h3></div>
        <div class="ib-hr"><em class="cat c-${m.cat}">${m.cat}</em><small>${FM.Inbox.fmtDate(m.s, m.d)}</small></div></header>
      <p class="ib-body">${rich(m.body)}</p>
      ${m.conf ? '' : ibCard(m)}${m.conf ? confDetail(m) : ''}
      ${m.opts ? `<p class="ib-lbl">Kararın</p><div class="ib-opts" role="radiogroup" aria-label="Kararın">${m.opts.map((o, i) => `<button role="radio" aria-checked="${pick === i}" class="ib-opt ${pick === i ? 'on' : ''}" data-a="ib-pick" data-v="${i}" ${decided ? 'disabled' : ''}>${decided && pick === i ? FM.icon('check') : ''}${esc(o)}</button>`).join('')}</div>
        <div class="ib-foot ${decided ? 'done' : ''}">${decided ? `<p>${FM.icon('check')}<span><b>${m.exp ? 'Süresi doldu' : 'Karar verildi'}.</b> ${esc(m.res || '')}</span></p>`
          : `<p class="wait">${FM.icon('clock')} Karar bekliyor <small>Hafta sonuna kadar cevap vermezsen son seçenek geçerli olur.</small></p><div class="row">${link ? `<button class="btn" ${link}>İncele</button>` : ''}<button class="btn primary" data-a="ib-decide" ${pick == null ? 'disabled' : ''}>Kararı ver</button></div>${pick == null ? '<small class="muted">Önce bir cevap seç</small>' : ''}`}</div>` : ''}`;
  }
  function viewInbox() {
    const all = IB(), todo = FM.Inbox.pending().length, unr = FM.Inbox.unread();
    if (U.ib.sel == null && all.length && !window.matchMedia('(max-width: 760px)').matches) openMsg(ibFiltered()[0] || all[0], true);
    const f = (k, n, c) => `<button data-a="ib-filter" data-v="${k}" class="${U.ib.f === k ? 'on' : ''}">${n}${c != null ? ` <b>${c}</b>` : ''}</button>`;
    return `<div class="ib ${U.ib.open ? 'open' : ''}">
      <section class="card ib-list"><div class="ib-top"><h2>Gelen kutusu <small>${unr} okunmamış</small></h2>${unr ? '<button class="link" data-a="ib-allread">Tümünü okundu say</button>' : ''}</div>
        <label class="ib-q">${FM.icon('scout')}<input id="ibq" type="search" placeholder="Mesajlarda ara" value="${esc(U.ib.q)}" autocomplete="off" aria-label="Mesajlarda ara"></label>
        <div class="seg">${f('all', 'Tümü')}${f('todo', 'İşler', todo)}${f('unread', 'Okunmamış', unr)}</div>
        <div id="ibList" class="ib-scroll">${ibListHtml()}</div></section>
      <section class="card ib-detail" id="ibDetail" aria-live="polite">${ibDetailHtml()}</section></div>`;
  }
  function openMsg(m, silent) {
    if (!m) return;
    U.ib.sel = m.id; U.ib.pick = null; U.ib.open = !silent;
    if (!m.read) { m.read = true; FM.save(); }
  }
  function inboxPreview() {
    const pend = FM.Inbox.pending(), news = IB().filter(m => !m.read && !FM.Inbox.todo(m)), list = pend.concat(news).slice(0, 4);
    if (!list.length) return '';
    return `<section class="card ib-prev"><div class="ib-top"><h2>Gelen kutusu</h2><span class="muted">${pend.length ? `<b class="todo">${pend.length} karar bekliyor</b> · ` : ''}${FM.Inbox.unread()} okunmamış</span></div>
      <ul class="ib-ul">${list.map(ibItem).join('')}</ul><button class="link" data-a="tab" data-v="inbox">Tüm mesajlar</button></section>`;
  }
  function ticker() {
    const G = FM.G, items = [];
    const wk = G.week - 1;
    if (wk >= 0) for (let d = 0; d < 2; d++) for (const f of G.fixtures[d][wk]) if (f.hs != null) items.push(`<span class="tk-i"><em>Sonuç</em>${esc(T(f.h).name)} <b>${f.hs}-${f.as}</b> ${esc(T(f.a).name)}</span>`);
    for (const n of G.news.slice(0, 8)) items.push(`<span class="tk-i ${n.kind}"><em>Haber</em>${esc(n.text)}</span>`);
    if (!items.length) return '';
    const run = items.join('');
    return `<div class="ticker" aria-label="Son sonuçlar ve haberler"><div class="tk-run" style="--n:${items.length}">${run}<span aria-hidden="true" class="tk-dup">${run}</span></div></div>`;
  }
  function refreshInbox(listOnly) {
    if (U.view !== 'inbox' || !$('ibList')) return render(true);
    $('ibList').innerHTML = ibListHtml();
    if (!listOnly) { $('ibDetail').innerHTML = ibDetailHtml(); document.querySelector('.ib').classList.toggle('open', U.ib.open); }
  }
  function goInbox(m) { U.view = 'inbox'; U.ib.f = 'all'; U.ib.q = ''; openMsg(m); render(); window.scrollTo(0, 0); }

  /* ---------- Kadro ---------- */
  const ORDER = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
  function playerRows(list, market) {
    return list.map(p => `<tr data-a="player" data-id="${p.id}" tabindex="0"><td class="l pl">${FM.avatar(p, 34)}<span><strong>${esc(p.name)}</strong>${status(p)}${market ? `<small class="clubn">${p.tid == null ? 'Serbest' : T(p.tid).name}</small>` : ''}</span></td><td>${posChip(p.pos)}</td><td>${p.age}</td><td>${ovrB(p)}</td><td class="pot">${FM.known(p) ? p.pot : '?'}</td><td>${fitBar(p.fit)}</td><td class="hide-s">${fmtR(FM.avgRating(p))}</td><td class="hide-s">${market ? p.g + '/' + p.as : p.loan ? 'Kiralık' : p.con + ' sezon'}</td><td class="r">${money(market ? FM.askPrice(p) : p.value)}</td></tr>`).join('');
  }
  const P_HEAD = market => `<thead><tr><th class="l">Oyuncu</th><th>Mevki</th><th>Yaş</th><th>GEN</th><th>POT</th><th>Kond.</th><th class="hide-s">Puan</th><th class="hide-s">${market ? 'G/A' : 'Sözleşme'}</th><th class="r">${market ? 'Bedel' : 'Değer'}</th></tr></thead>`;
  function viewSquad() {
    const t = me(), list = t.players.map(P).sort((a, b) => ORDER[a.pos] - ORDER[b.pos] || b.ovr - a.ovr), out = FM.loanedOut();
    const avg = Math.round(list.reduce((s, p) => s + p.ovr, 0) / list.length), age = (list.reduce((s, p) => s + p.age, 0) / list.length).toFixed(1);
    return `<div class="kpis"><div><span>Oyuncu</span><b>${list.length}</b></div><div><span>Ortalama güç</span><b>${avg}</b></div><div><span>Yaş ortalaması</span><b>${age.replace('.', ',')}</b></div><div><span>Kadro değeri</span><b>${money(FM.squadValue(t))}</b></div><div><span>Haftalık maaş</span><b>${money(FM.wageBill(t))}</b></div></div>
      <section class="card"><h2>A takım kadrosu</h2><div class="scroll"><table class="tbl pls">${P_HEAD()}<tbody>${playerRows(list)}</tbody></table></div></section>
      ${out.length ? `<section class="card"><h2>Kiralıkta olanlar</h2><ul class="rank">${out.map(p => `<li>${posChip(p.pos)}<span class="nm">${esc(p.name)} <small class="clubn">${T(p.tid).name}</small></span><b>${p.ovr}</b></li>`).join('')}</ul></section>` : ''}`;
  }
  function playerModal(id) {
    const p = P(id), G = FM.G, mine = p.tid === G.teamId, t = p.tid != null ? T(p.tid) : null, kn = FM.known(p), own = mine && !p.loan;
    const bars = Object.keys(FM.ATTR_TR).filter(k => (p.pos === 'GK') === (k === 'gk') || (p.pos === 'GK' && (k === 'pas' || k === 'phy'))).map(k => meter(FM.ATTR_TR[k], p.a[k])).join('');
    let act;
    if (mine) {
      const rt = FM.renewTerms(p);
      act = `<div class="row"><button class="btn" data-a="talk" data-k="praise" data-id="${id}">Öv</button><button class="btn" data-a="talk" data-k="crit" data-id="${id}">Eleştir</button></div>` +
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

  function teamModal(id) {
    const t = T(id), G = FM.G, tb = FM.table(t.div), row = tb.find(r => r.id === id), pos = tb.indexOf(row) + 1, tier = FM.stadiumTier(t);
    const list = t.players.map(P).sort((a, b) => ORDER[a.pos] - ORDER[b.pos] || FM.est(b)[0] - FM.est(a)[0]);
    const xi = t.lineup.filter(x => x != null).map(P), star = xi.slice().sort((a, b) => b.g - a.g || FM.est(b)[0] - FM.est(a)[0])[0];
    const tac = id === G.teamId || true ? Object.keys(FM.TAC).map(k => `<span class="chip">${FM.TAC[k][0]}: ${FM.TAC[k][1][t.tac[k]]}</span>`).join('') : '';
    modal(`<div class="pm-head">${FM.crest(t, 72)}<div><h3>${t.name}</h3><p>${FM.DIV_TR[t.div]} · ${pos}. sıra · ${row.pts} puan</p><p class="muted">${esc(t.stadium)} · ${FM.Stadium.TIERS[tier]} · ${FM.stadiumCap(t).toLocaleString('tr-TR')} kişilik</p></div><div class="pm-ovr"><b class="ovr o3">${t.formation}</b><span>Diziliş</span></div></div>
      <p class="chips">${tac}<span class="chip">Form: ${row.form.slice(-5).join(' ') || '—'}</span></p>
      <div class="kpis sm"><div><span>Kadro değeri</span><b>${money(FM.squadValue(t))}</b></div><div><span>Attığı / yediği</span><b>${row.gf} / ${row.ga}</b></div>${star ? `<div><span>Dikkat edilecek isim</span><b>${esc(star.name)}</b></div>` : ''}</div>
      <div class="scroll tall"><table class="tbl pls">${P_HEAD(id !== G.teamId)}<tbody>${playerRows(list, id !== G.teamId)}</tbody></table></div>`, true);
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
    return (U.pre ? `<div class="pre-return"><span>Maç öncesi hazırlık sürüyor. Değişiklikler otomatik kaydedilir.</span><button class="btn primary" data-a="pre-back">${FM.icon('back')} Maç öncesine dön</button></div>` : '') + `<div class="tac">
      <section class="card"><h2>Diziliş</h2><div class="seg wrap">${Object.keys(FM.FORMATIONS).map(f => `<button data-a="formation" data-v="${f}" class="${f === t.formation ? 'on' : ''}">${f}</button>`).join('')}</div>
        <div class="pitch"><div class="pitch-lines"></div>${toks}</div>
        <p class="hint">Yer değiştirmek için önce bir oyuncuya, sonra diğerine dokun. Sarı çerçeve mevki dışı oyuncuyu gösterir.</p></section>
      <div class="tac-side">
        <section class="card"><h2>Talimatlar</h2><div class="tacs"><div class="tac-row"><span>Oyun anlayışı</span><div class="seg">${FM.MENT_TR.map((n, i) => `<button data-a="ment" data-v="${i}" class="${i === t.ment ? 'on' : ''}">${n}</button>`).join('')}</div></div>${FM.tacSegs(t.tac, 'data-a')}</div>
          <div class="attrs">${meter('Hücum', r.att)}${meter('Orta saha', r.ctl)}${meter('Savunma', r.def)}</div>
          <button class="btn" data-a="autopick">En iyi 11'i otomatik seç</button></section>
        <section class="card"><h2>Duran toplar</h2>${spSel('pen', 'Penaltı')}${spSel('fk', 'Frikik')}${spSel('ck', 'Korner')}</section>
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
    const mid = p => { const e = FM.est(p); return (e[0] + e[1]) / 2; };
    list.sort((a, b) => mid(b) - mid(a) || a.age - b.age);
    const total = list.length; list = list.slice(0, 60);
    return `<section class="card tfwin ${open ? 'open' : ''}"><div><h2>Transfer dönemi ${open ? 'açık' : 'kapalı'}</h2><p class="muted">${open ? (FM.deadline() ? 'Son hafta: kulüpler daha cömert teklif yapar.' : 'Sezonun ilk 4 haftası ve 11–14. haftalar arası açık.') : 'Kulüplerden alım, satım ve kiralama yapılamaz. Serbest oyuncularla her zaman anlaşabilirsin.'}</p></div><span class="chip">Scout: ${G.scoutQ.length}/4 görevde</span></section>
      <section class="card"><h2>Transfer pazarı</h2>
      <div class="filters"><div class="seg">${[['ALL', 'Tümü'], ['GK', 'KL'], ['DEF', 'DF'], ['MID', 'OS'], ['FWD', 'FV']].map(([k, n]) => `<button data-a="tf-pos" data-v="${k}" class="${f.pos === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <label class="chk" for="tfAfford"><input type="checkbox" id="tfAfford" data-a="tf-afford" ${f.afford ? 'checked' : ''}> Bütçeme uyanlar</label><label class="chk" for="tfFree"><input type="checkbox" id="tfFree" data-a="tf-free" ${f.free ? 'checked' : ''}> Yalnız serbestler</label><span class="muted">${total} oyuncudan ${list.length} tanesi</span></div>
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
      <section class="card"><h2>Altyapı</h2><p>Her sezon altyapıdan bir genç oyuncuyu A takıma alabilirsin. Akademi seviyesi (${t.fac.youth}/5) yeteneği belirler.</p><button class="btn primary" data-a="youth" ${G.youthUsed || t.players.length >= 28 ? 'disabled' : ''}>${G.youthUsed ? 'Bu sezon kullanıldı' : 'Genç oyuncu çıkar'}</button></section>
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
    const parts = {
      stadium: `<section class="card"><div class="st-head"><div><h2>${esc(t.stadium)}</h2><p class="muted">${FM.Stadium.TIERS[tier]} (${tier}/5) · ${FM.stadiumCap(t).toLocaleString('tr-TR')} kişilik · kadro değeri ${money(FM.squadValue(t))}</p></div><span class="lv big">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= tier ? 'on' : ''}"></i>`).join('')}</span></div>
        <div class="st-prev"><canvas id="stPrev" aria-label="Stadyumun kuşbakışı görünümü"></canvas></div><p class="hint">Stadyum, kadro değerin ve stadyum yatırımın arttıkça büyür: tribünler, köşeler, çatı ve projektörler eklenir.</p></section>
`,
      fin: `      <section class="card"><h2>Finans</h2><div class="kpis sm"><div><span>Bütçe</span><b>${money(G.fin.balance)}</b></div><div><span>Haftalık maaş</span><b>${money(FM.wageBill(t))}</b></div><div><span>Sponsor</span><b>${money(G.fin.sponsor)}</b></div></div>
        ${spark(G.fin.hist)}
        ${l ? `<table class="tbl fin"><tbody><tr><td class="l">Sponsor geliri</td><td class="r pos-v">+${money(l.sponsor)}</td></tr><tr><td class="l">Bilet geliri ${l.att ? '(' + l.att.toLocaleString('tr-TR') + ' seyirci)' : '(deplasman)'}</td><td class="r pos-v">+${money(l.tickets)}</td></tr><tr><td class="l">Maaşlar</td><td class="r neg-v">−${money(l.wages)}</td></tr><tr><td class="l"><b>Geçen hafta net</b></td><td class="r"><b>${money(l.net)}</b></td></tr></tbody></table>` : ''}</section>
`,
      board: `      <section class="card"><h2>Yönetim ve taraftar</h2><p>Hedef: ${FM.DIV_TR[t.div]}'nde <b>${exp}. sıra</b> veya üstü. Şu an <b>${pos}.</b> sıradasın.</p>${gauge('Yönetim güveni', G.board, G.board <= 25 ? 'Tehlike: güven 10\'un altına düşerse görevden alınırsın.' : G.board >= 70 ? 'Yönetim arkanda.' : 'Yönetim gidişatı izliyor.')}${gauge('Taraftar desteği', G.fans, 'Destek arttıkça tribünler dolar, iç saha avantajın büyür.')}
        <h2>Geçmiş sezonlar</h2>${G.history.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>Sezon</th><th class="l">Kulüp</th><th>Sıra</th><th>Puan</th><th class="l">Şampiyon</th><th class="l">Kupa</th></tr></thead><tbody>${G.history.map(h => `<tr><td>${h.season}</td><td class="l">${h.team || ''}</td><td>${h.pos}${h.div ? ' (alt lig)' : ''}</td><td>${h.pts}</td><td class="l">${h.champion}</td><td class="l">${h.cup || '—'}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">İlk sezonun devam ediyor.</p>'}</section>`,
      facs: `      <section class="card"><h2>Tesisler</h2><div class="facs">${Object.keys(FM.FAC).map(k => `<div class="fac"><div><strong>${FM.FAC[k].name}</strong><span class="lv">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= t.fac[k] ? 'on' : ''}"></i>`).join('')}</span><p>${facDesc[k]}</p></div><button class="btn" data-a="upgrade" data-v="${k}" ${t.fac[k] >= 5 ? 'disabled' : ''}>${t.fac[k] >= 5 ? 'En üst seviye' : 'Geliştir · ' + money(FM.facCost(k))}</button></div>`).join('')}</div></section>
`,
      museum: `      <section class="card museum"><h2>Kulüp müzesi</h2>
        <div class="cups">${cups || '<p class="muted">Vitrin henüz boş. İlk kupanı kazan.</p>'}</div>
        <div class="grid2"><div><h3 class="rnd">Rekorlar</h3><ul class="recs"><li><span>En farklı galibiyet</span><b>${G.rec.bigWin ? G.rec.bigWin.text : '—'}</b></li><li><span>Bir sezonda en çok gol</span><b>${G.rec.goals ? `${G.rec.goals.name} (${G.rec.goals.g}) · ${G.rec.goals.s}. sezon` : '—'}</b></li><li><span>En yüksek puan</span><b>${G.rec.pts ? `${G.rec.pts.v} puan · ${G.rec.pts.s}. sezon` : '—'}</b></li></ul></div>
        <div><h3 class="rnd">Efsaneler</h3><ol class="rank">${legends.map(([n, g], i) => `<li><span class="wk">${i + 1}</span><span class="nm">${esc(n)}</span><b>${g} gol</b></li>`).join('') || '<li class="muted">Senin dönemindeki golcüler burada sıralanır.</li>'}</ol></div></div>
        <h3 class="rnd">Başarımlar <small>${Object.keys(G.ach).length}/${Object.keys(FM.ACH).length}</small></h3><div class="achs">${Object.keys(FM.ACH).map(k => `<div class="ach ${G.ach[k] ? 'on' : ''}"><strong>${FM.ACH[k][0]}</strong><span>${FM.ACH[k][1]}</span>${G.ach[k] ? `<em>${G.ach[k].s}. sezon</em>` : ''}</div>`).join('')}</div></section>
`,
      save: `      <section class="card"><h2>Kariyer kaydı</h2><p class="muted">Oyun bu tarayıcıda otomatik kaydedilir. Başka cihaza taşımak için kaydı dışa aktar.</p><div class="row"><button class="btn" data-a="export">Kaydı dışa aktar</button><button class="btn" data-a="import">Kayıt yükle</button>${U.confirmReset ? '' : '<button class="btn" data-a="reset">Yeni kariyere başla</button>'}</div>${U.confirmReset ? '<p>Tüm kariyer silinecek. Emin misin?</p><div class="row"><button class="btn" data-a="reset-no">Vazgeç</button><button class="btn danger" data-a="reset-yes">Kariyeri sil</button></div>' : ''}</section>`
    };
    return FM.ui.clubView ? FM.ui.clubView(parts) : Object.values(parts).join('');
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
      <div class="podium">${s.table.map((id, i) => `<div class="p${i + 1}">${FM.crest(T(id), 48)}<strong>${T(id).name}</strong><span>${i + 1}.</span></div>`).join('')}</div>
      ${FM.ui.awardsHtml ? FM.ui.awardsHtml() : ''}
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
  const VIEWS = { home: viewHome, inbox: viewInbox, squad: viewSquad, tactics: viewTactics, fixtures: viewFixtures, table: viewTable, transfer: viewTransfer, training: viewTraining, club: viewClub };
  function render(keepScroll) {
    const G = FM.G, app = $('app'), y = window.scrollY;
    if (!G) { app.innerHTML = U.screen === 'new' ? startScreen() : FM.ui.menuScreen(); if (FM.ui.after) FM.ui.after(); return; }
    if (G.phase === 'sacked') { app.innerHTML = sackedScreen(); return; }
    if (G.phase === 'seasonEnd') { app.innerHTML = seasonScreen(); confettiBurst(); return; }
    app.innerHTML = shell(VIEWS[U.view]());
    if (keepScroll) { $('view').classList.remove('enter'); window.scrollTo(0, y); }
    if ($('stPrev')) FM.Stadium.preview($('stPrev'), me());
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
  /* ---------- Basın toplantısı ekranı ---------- */
  const confMsg = id => IB().find(x => x.id === id);
  const fxChips = parts => parts.map(([n, v]) => `<span class="fxc ${v > 0 ? 'up' : 'down'}">${esc(n)} ${v > 0 ? '+' : '−'}${Math.abs(v)}</span>`).join('');
  const confLastDay = m => { const bw = m.born % 100; return FM.Inbox.fmtDate(m.s, (bw + (m.conf.type === 'pre' ? 0 : 1)) * 7); };
  function pressHtml() {
    const G = FM.G, m = confMsg(U.press.id), c = m.conf, last = U.press.last;
    const qi = last ? last.qi : Math.min(c.cur, c.qs.length - 1), q = c.qs[qi], j = G.journos[q.j], first = j.name.split(' ')[0];
    const { svg, tip } = FM.Press.room(m, qi);
    const answers = q.a.map(([t], i) => { const sel = last ? q.ans === i : U.press.pick === i; return `<button class="pr-a ${sel ? 'on' : ''}" data-a="press-pick" data-v="${i}" role="radio" aria-checked="${sel}" ${last ? 'disabled' : ''}>${sel && last ? FM.icon('check') : ''}${esc(t)}</button>`; }).join('');
    const foot = last
      ? `<div class="pr-res"><p>${FM.icon('press')} ${esc(q.res)}</p><div class="fxs">${fxChips(q.fx)}</div><button class="btn primary" data-a="press-next">${c.done ? 'Toplantıyı bitir' : 'Sonraki soru'} ${FM.icon('play')}</button></div>`
      : `<div class="pr-foot"><button class="btn" data-a="press-close">Sonra</button><button class="btn primary" data-a="press-answer" ${U.press.pick == null ? 'disabled' : ''}>Cevabı ver</button>${U.press.pick == null ? '<small class="muted">Önce bir cevap seç</small>' : ''}</div>`;
    return `<div class="pr">
      <header class="pr-h"><button class="btn icon" data-a="press-close" aria-label="Geri">${FM.icon('back')}</button><div><h2>Basın toplantısı</h2><p class="muted">${esc(c.sub)}</p></div></header>
      <div class="pr-room">${svg}${tip ? `<div class="pr-tip" style="left:${tip.x}%;top:${tip.y}%"><strong>${esc(j.name)}</strong><span>${esc(j.outlet)} · ${j.style} · İlişki: <b>${FM.Press.relTxt(j.rel)}</b></span><small>${(j.n - (last ? 1 : 0)) ? 'Daha önce ' + (j.n - (last ? 1 : 0)) + ' kez söz aldı' : 'İlk kez söz alıyor'}</small></div>` : ''}</div>
      <section class="pr-panel">
        <div class="pr-top"><p><b>${esc(G.manager.toLocaleUpperCase('tr'))}</b> Buyurun ${esc(first)}, sizi dinliyorum.</p><small class="muted">Soru ${qi + 1}/${c.qs.length} · Son gün ${confLastDay(m)}</small></div>
        <blockquote class="pr-q"><span class="qm" aria-hidden="true">“</span><div><small>${esc(j.name)} · ${esc(j.outlet)}</small><p>${esc(q.q)}</p></div></blockquote>
        <div class="pr-as" role="radiogroup" aria-label="Cevabın">${answers}</div>${foot}</section></div>`;
  }
  function showPress() { const el = $('press'); el.innerHTML = pressHtml(); el.hidden = false; document.body.classList.add('noscroll'); }
  function openPress(id) { closeModal(); const m = confMsg(id); if (!m || !m.conf) return; if (m.conf.done) { U.view = 'inbox'; openMsg(m); render(); return; } U.press = { id, pick: null, last: null }; m.read = true; FM.save(); showPress(); }
  function closePress() { $('press').hidden = true; $('press').innerHTML = ''; U.press = null; if ($('pre').hidden) document.body.classList.remove('noscroll'); if (!$('pre').hidden) showPre(); else render(true); }
  const openConf = type => IB().find(m => m.conf && !m.conf.done && (!type || m.conf.type === type));
  const confBtn = type => { const m = openConf(type); return m ? `<button class="btn" data-a="press-open" data-id="${m.id}">${FM.icon('press')} Basın toplantısına git</button>` : ''; };
  function confDetail(m) {
    const c = m.conf;
    return `<p class="ib-lbl">${c.qs.length} soru · ${c.type === 'pre' ? 'Maç öncesi' : c.type === 'post' ? 'Maç sonrası' : 'Transfer'}</p>
      <ol class="cf-qs">${c.qs.map(q => { const j = FM.G.journos[q.j]; return `<li class="${q.ans != null ? 'done' : ''}"><small>${esc(j.name)} · ${esc(j.outlet)}</small><p>${esc(q.q)}</p>${q.ans != null ? `<p class="cf-a">${FM.icon('check')} ${esc(q.a[q.ans][0])}</p><div class="fxs">${fxChips(q.fx || [])}</div>` : ''}</li>`; }).join('')}</ol>
      <div class="ib-foot ${c.done ? 'done' : ''}">${c.done ? `<p>${FM.icon('check')}<span><b>${c.exp ? 'Kaçırıldı' : 'Tamamlandı'}.</b> ${esc(m.res || '')}</span></p>` : `<p class="wait">${FM.icon('clock')} Basın seni bekliyor <small>Son gün ${confLastDay(m)}. Katılmazsan taraftar ve yönetim tepki gösterir.</small></p><div class="row"><button class="btn primary" data-a="press-open" data-id="${m.id}">${c.cur ? 'Toplantıya dön' : 'Basın salonuna gir'}</button></div>`}</div>`;
  }

  /* ---------- Maç öncesi ekranı ---------- */
  const cdist = (a, b) => { const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16); return Math.abs((x >> 16) - (y >> 16)) + Math.abs(((x >> 8) & 255) - ((y >> 8) & 255)) + Math.abs((x & 255) - (y & 255)); };
  const lumH = h => { const n = parseInt(h.slice(1), 16); return (n >> 16) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114; };
  const ukit = (t, k) => (t.id === FM.G.teamId && FM.G.kits ? FM.G.kits[k] : null);
  const kitFill = (t, k) => (ukit(t, k) ? ukit(t, k).c1 : k === 2 ? '#1b2433' : k ? t.c2 : t.c1);
  const kitLine = (t, k) => (ukit(t, k) ? ukit(t, k).c2 : k ? t.c1 : t.c2);
  const TALKS = [
    ['calm', 'Sakin olun, kendi oyunumuzu oynayalım', 'Her durumda küçük bir moral artışı.'],
    ['fire', 'Bugün tarih yazacağız!', 'Güçlü rakibe karşı çok etkili, zayıf rakibe karşı sönük kalır.'],
    ['press', 'Kaybetmek yok, sonuç istiyorum', 'Favoriyken işe yarar; değilken takımı geriyebilir.'],
    ['trust', 'Size güveniyorum', 'Moral düşükken takımı toparlar.']
  ];
  function slotAbbr(s) {
    const [r, y, x] = s;
    if (r === 'GK') return 'KL';
    if (r === 'DEF') return x < .3 ? (y > .25 ? 'SLKB' : 'SLB') : x > .7 ? (y > .25 ? 'SĞKB' : 'SĞB') : 'STP';
    if (r === 'MID') return x < .25 ? 'SLO' : x > .75 ? 'SĞO' : y < .41 ? 'DOS' : y > .58 ? 'OOS' : 'MO';
    return x < .3 ? 'SLK' : x > .7 ? 'SĞK' : 'SNT';
  }
  const shortName = n => { const a = n.split(' '); return (a.length > 1 ? a[0][0] + '. ' + a.slice(1).join(' ') : n).toLocaleUpperCase('tr'); };
  const xiStr = t => { const xi = t.lineup.filter(x => x != null).map(P); return xi.length ? Math.round(xi.reduce((s, p) => s + p.ovr, 0) / xi.length) : 0; };
  function preBoard(t, k, side) {
    const slots = FM.FORMATIONS[t.formation], fill = kitFill(t, k), ink = lumH(fill) > 150 ? '#14202f' : '#ffffff', line = kitLine(t, k);
    const capId = t.lineup.filter(x => x != null).map(P).sort((a, b) => b.age + b.ovr / 4 - (a.age + a.ovr / 4))[0];
    const toks = slots.map((s, i) => {
      const p = t.lineup[i] != null ? P(t.lineup[i]) : null; if (!p) return '';
      const gk = s[0] === 'GK';
      return `<button class="pb-t" data-a="player" data-id="${p.id}" style="left:${s[2] * 100}%;top:${86 - (s[1] || -.08) * 76}%;--f:${gk ? '#f3efe4' : fill};--l:${gk ? '#14202f' : line};--i:${gk ? '#14202f' : ink}" aria-label="${esc(p.name)}, ${slotAbbr(s)}">
        <span class="pb-n">${p.num}</span><span class="pb-nm">${esc(shortName(p.name))}${capId && capId.id === p.id ? ' <i class="cap" title="Kaptan">K</i>' : ''}</span><span class="pb-r ${gk ? 'gk' : ''}">${slotAbbr(s)}</span></button>`;
    }).join('');
    return `<div class="pb-wrap"><div class="pb"><i class="pb-box t"></i><i class="pb-box b"></i><i class="pb-c"></i><i class="pb-m"></i>${toks}</div></div>`;
  }
  function preScreen() {
    const G = FM.G, pr = U.pre, fx = pr.fx, h = T(fx.h), a = T(fx.a), mine = fx.h === G.teamId ? 0 : 1, opp = mine ? h : a, myT = me();
    const day = G.week * 7 - (pr.cup ? 3 : 0), dt = FM.Inbox.date(G.season, day), wx = fx.wx || { t: 'clear', n: 0 };
    const when = `${['PAZ', 'PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT'][dt.getDay()]} ${dt.getDate()} ${['OCA', 'ŞUB', 'MAR', 'NİS', 'MAY', 'HAZ', 'TEM', 'AĞU', 'EYL', 'EKİ', 'KAS', 'ARA'][dt.getMonth()]} · ${wx.n ? '20:00' : '17:00'}`;
    const kits = [0, 1, 2].map(k => `<button class="kit ${pr.kit === k ? 'on' : ''}" data-a="pre-kit" data-v="${k}" style="--f:${kitFill(myT, k)};--l:${kitLine(myT, k)}" aria-label="${['İç saha', 'Deplasman', 'Üçüncü'][k]} forması" aria-pressed="${pr.kit === k}"></button>`).join('');
    const kOf = (t, i) => (i === mine ? pr.kit : (() => { const uf = kitFill(myT, pr.kit); return cdist(uf, t.c1) < 150 ? (cdist(uf, t.c2) < 150 ? 2 : 1) : 0; })());
    const team = (t, i) => `<div class="pre-team ${i ? 'r' : ''}">${FM.crest(t, 76)}<h2>${esc(t.name)}</h2><span class="pre-f">${t.formation}</span>${t.id === G.teamId ? '<em class="pre-me">Senin takımın</em>' : ''}</div>`;
    const patch = (t, i) => `<div class="patch ${i ? 'r' : ''}" style="--f:${kitFill(t, kOf(t, i))};--l:${kitLine(t, kOf(t, i))};--i:${lumH(kitFill(t, kOf(t, i))) > 150 ? '#14202f' : '#ffffff'}" aria-label="Takım gücü ${xiStr(t)}"><span>GÜÇ</span><b>${xiStr(t)}</b></div>`;
    const talk = pr.talk ? `<p class="pre-talk-res">${FM.icon('check')} ${esc(pr.talkRes)}</p>` : '';
    const talkPanel = pr.panel === 'talk' ? `<div class="pre-panel" role="dialog" aria-label="Takım konuşması"><div class="pre-card"><h3>Takım konuşması</h3><p class="muted">Soyunma odasında son sözler. Bir kez seçebilirsin.</p><div class="ib-opts">${TALKS.map(([k, n, d]) => `<button class="ib-opt col" data-a="pre-talk" data-v="${k}"><strong>${n}</strong><small>${d}</small></button>`).join('')}</div><button class="link" data-a="pre-panel" data-v="">Vazgeç</button></div></div>` : '';
    return `<div class="pre" style="--h1:${h.c1};--a1:${a.c1}">
      <div class="pre-bg" aria-hidden="true"></div>${patch(h, 0)}${patch(a, 1)}
      <header class="pre-head">${team(h, 0)}
        <div class="pre-mid"><img src="${pr.cup ? 'assets/trophy.svg' : 'assets/logo.svg'}" alt="" width="54" height="54"><p class="eyebrow">${pr.comp === 'euro' ? 'Kıta Kupası · ' + esc(G.euro.name) : pr.cup ? 'Kupa · ' + esc(G.cup.name) : FM.DIV_TR[myT.div] + ' · ' + (G.week + 1) + '. hafta'}</p>${!pr.cup && FM.Career.isDerby(fx) ? `<p class="derby-b">${esc(FM.Career.isDerby(fx))}</p>` : ''}<p class="pre-st">${esc(pr.cup && (pr.comp === 'euro' ? G.euro.final : G.cup.final) ? 'Tarafsız saha' : h.stadium)}</p><p class="pre-when">${when}</p><p class="pre-wx">${FM.WX_TR[wx.t]}${wx.n ? ' · Gece' : ''}</p></div>
        ${team(a, 1)}</header>
      <div class="pre-body">${preBoard(h, kOf(h, 0), 0)}
        <nav class="pre-menu" aria-label="Maç öncesi">
          <div class="pre-kits"><span>Forma</span>${kits}</div>
          <button data-a="pre-tactics">Kadro ve taktik</button>
          <button data-a="pre-panel" data-v="talk" ${pr.talk ? 'disabled' : ''}>Takım konuşması${pr.talk ? ' ✓' : ''}</button>
          <button data-a="team" data-id="${opp.id}">Rakip</button>
          ${openConf('pre') ? `<button class="prs" data-a="press-open" data-id="${openConf('pre').id}">Basın toplantısı <i class="dot" aria-label="bekliyor"></i></button>` : ''}
          <button class="go" data-a="pre-go">Onayla ${FM.icon('play')}</button>
          <button class="back" data-a="pre-close">${FM.icon('back')} Geri dön</button>
          ${talk}</nav>
        ${preBoard(a, kOf(a, 1), 1)}</div>${talkPanel}</div>`;
  }
  function showPre() { const el = $('pre'); el.innerHTML = preScreen(); el.hidden = false; document.body.classList.add('noscroll'); }
  function closePre() { $('pre').hidden = true; $('pre').innerHTML = ''; document.body.classList.remove('noscroll'); }
  function openPre() {
    const G = FM.G, t = me(), euro = G.euroDue && FM.Career.euroTie(), cupT = !euro && G.cupDue, fx = euro || (cupT ? FM.cupTie() : FM.userFixture()), cup = !!(euro || cupT), comp = euro ? 'euro' : cupT ? 'cup' : 'league';
    const changed = FM.ensureLineup(t);
    if (t.lineup.filter(x => x != null).length < 11) toast('Sahaya 11 kişiden az çıkıyorsun: uygun oyuncu yok.', 'bad');
    else if (changed.length) toast('Kadro güncellendi: ' + changed.map(id => P(id).name).join(', ') + ' ilk 11\'e girdi.');
    const opp = T(fx.h === G.teamId ? fx.a : fx.h); FM.autoPick(opp);
    const key = G.season + ':' + G.week + ':' + comp;
    if (!U.pre || U.pre.key !== key) {
      const away = fx.a === G.teamId, hc = T(fx.h).c1;
      U.pre = { key, fx, cup, comp, kit: away && cdist(t.c1, hc) < 150 ? (cdist(t.c2, hc) < 150 ? 2 : 1) : 0, talk: null, talkRes: '', panel: '' };
    }
    U.pre.fx = fx; U.pre.panel = '';
    showPre();
  }
  function teamTalk(k) {
    const G = FM.G, pr = U.pre, t = me(), opp = T(pr.fx.h === G.teamId ? pr.fx.a : pr.fx.h);
    const xi = t.lineup.filter(x => x != null).map(P), avgM = xi.reduce((s, p) => s + p.mor, 0) / xi.length;
    const edge = xiStr(t) - xiStr(opp) + (pr.fx.h === G.teamId ? 2 : -2), fav = edge >= 2, dog = edge <= -2;
    let d, msg;
    if (k === 'calm') { d = 3; msg = 'Oyuncular sakin ve odaklı.'; }
    else if (k === 'fire') { d = dog ? 9 : fav ? 1 : 5; msg = dog ? 'Soyunma odası ayağa kalktı, oyuncular sahaya koşuyor!' : fav ? 'Oyuncular bu sözleri abartılı buldu.' : 'Konuşman takımı ateşledi.'; }
    else if (k === 'press') { d = fav ? 7 : Math.random() < .5 ? -4 : 2; msg = fav ? 'Takım sorumluluğu üstlendi, galibiyete kilitlendi.' : d < 0 ? 'Baskı ters tepti, bazı oyuncular gergin.' : 'Mesaj alındı ama oyuncular biraz gergin.'; }
    else { d = avgM < 62 ? 8 : 2; msg = avgM < 62 ? 'Güvenin takımı toparladı.' : 'Oyuncular teşekkür etti, zaten iyi durumdalar.'; }
    for (const p of xi) p.mor = Math.max(20, Math.min(100, p.mor + d));
    FM.save();
    pr.talk = k; pr.talkRes = `${msg} (ilk 11 morali ${d > 0 ? '+' : ''}${d})`; pr.panel = '';
    toast(pr.talkRes, d > 0 ? 'good' : 'bad');
  }
  function startMatch() {
    const G = FM.G, t = me(), pr = U.pre, cup = pr.cup, fx = pr.fx;
    closePre(); U.pre = null;
    FM.Audio.init();
    const euro = pr.comp === 'euro', fin = euro ? G.euro.final : G.cup.final;
    const m = FM.newMatch(fx, { cup, neutral: cup && fin }), wk = G.week, name = euro ? G.euro.name : G.cup.name;
    FM.MatchView.start(m, () => {
      FM.finishMatch(m);
      let ties = null;
      if (euro) ties = FM.Career.playEuroRound(); else if (cup) ties = FM.playCupRound(); else { FM.simOthers(); FM.endWeek(); }
      U.view = 'home'; U.fxWeek = null; U.sel = null;
      render(); window.scrollTo(0, 0);
      if (cup) cupModal(name, ties, euro); else if (!G.phase) weekModal(wk);
    }, { comp: euro ? 'Kıta Kupası · ' + name : cup ? 'Kupa · ' + name : `${FM.DIV_TR[t.div]} · ${G.week + 1}. hafta`, kit: pr.kit, derby: !cup && FM.Career.isDerby(fx) });
  }
  function playMatch(force) {
    const G = FM.G, cup = G.cupDue, pend = FM.Inbox.pending();
    if (pend.length && !force) return modal(`<h3>${pend.length} karar bekliyor</h3><p class="muted">Cevap vermediğin mesajlarda hafta sonunda son seçenek geçerli olur.</p>
      <ul class="ib-ul">${pend.map(ibItem).join('')}</ul><div class="row end"><button class="btn" data-a="play-anyway">Yine de maça çık</button><button class="btn primary" data-a="ib-open" data-id="${pend[pend.length - 1].id}">Gelen kutusuna git</button></div>`, true);
    if (cup && !FM.cupTie()) { const name = G.cup.name, ties = FM.playCupRound(); render(); return cupModal(name, ties); }
    openPre();
  }
  function weekModal(wk) {
    const G = FM.G, l = G.fin.last;
    modal(`<h3>${wk + 1}. hafta sonuçları</h3><ul class="fxl">${G.fixtures[me().div][wk].map(f => fxRow(f)).join('')}</ul>
      <p class="fin-line">Haftalık bilanço: <b class="${l.net >= 0 ? 'pos-v' : 'neg-v'}">${l.net >= 0 ? '+' : ''}${money(l.net)}</b>${l.att ? ` · ${l.att.toLocaleString('tr-TR')} seyirci` : ''}</p>
      <div class="row end">${confBtn('post')}<button class="btn primary" data-a="close">Tamam</button></div>`, true);
  }
  function cupModal(name, ties, euro) {
    const c = euro ? FM.G.euro : FM.G.cup;
    modal(`<h3>${euro ? 'Kıta Kupası' : 'Kupa'} · ${name}</h3><ul class="fxl">${ties.map(f => fxRow(f)).join('')}</ul>${c.winner != null && !c.shown ? `<p class="fin-line"><img src="assets/trophy.svg" alt="" width="28" height="32"> ${euro ? 'Kıta Kupası' : 'Kupa'} ${T(c.winner).name} takımının!</p>` : ''}
      <div class="row end">${confBtn('post')}<button class="btn primary" data-a="close">Tamam</button></div>`, true);
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
      case 'start': FM.Audio.init(); FM.setSlot(U.newSlot || 1); FM.newGame(U.pickTeam, $('mgr').value.trim()); U.screen = null; U.tour = !FM.Settings.get('tourDone') ? 0 : null; U.view = 'home'; U.shownBal = null; render(); window.scrollTo(0, 0); break;
      case 'tab': U.view = d.v; U.sel = null; U.fxWeek = null; U.confirmReset = false; U.ib.open = false; render(); window.scrollTo(0, 0); break;
      case 'ib-open': { closeModal(); const m = IB().find(x => x.id === +d.id); if (U.view !== 'inbox') { goInbox(m); break; } openMsg(m); refreshInbox(); if (window.matchMedia('(max-width: 760px)').matches) window.scrollTo(0, 0); } break;
      case 'ib-back': U.ib.open = false; refreshInbox(); break;
      case 'ib-pick': U.ib.pick = +d.v; refreshInbox(); break;
      case 'ib-decide': { if (U.ib.pick == null) break; const r = FM.Inbox.decide(U.ib.sel, U.ib.pick); if (!r.ok) { toast(r.msg, 'bad'); break; } U.ib.pick = null; render(true); } break;
      case 'ib-filter': U.ib.f = d.v; refreshInbox(true); document.querySelectorAll('[data-a="ib-filter"]').forEach(b => b.classList.toggle('on', b.dataset.v === d.v)); break;
      case 'ib-allread': for (const m of IB()) m.read = true; FM.save(); render(true); break;
      case 'continue': { const p = FM.Inbox.pending(); if (p.length) { goInbox(p[p.length - 1]); toast(p.length === 1 ? 'Bir karar seni bekliyor.' : p.length + ' karar seni bekliyor.'); } else playMatch(); } break;
      case 'play-anyway': closeModal(); playMatch(true); break;
      case 'pre-kit': U.pre.kit = +d.v; showPre(); break;
      case 'pre-panel': U.pre.panel = d.v; showPre(); break;
      case 'pre-talk': teamTalk(d.v); showPre(); break;
      case 'pre-go': startMatch(); break;
      case 'press-open': openPress(+d.id); break;
      case 'press-close': closePress(); break;
      case 'press-pick': U.press.pick = +d.v; showPress(); break;
      case 'press-answer': { if (U.press.pick == null) break; const m = confMsg(U.press.id), qi = m.conf.cur, r = FM.Press.answer(U.press.id, U.press.pick); if (r) { U.press.last = { qi }; U.press.pick = null; showPress(); } } break;
      case 'press-next': { const m = confMsg(U.press.id); U.press.last = null; if (m.conf.done) { toast('Basın toplantısı tamamlandı.', 'good'); closePress(); } else showPress(); } break;
      case 'pre-close': closePre(); break;
      case 'pre-tactics': closePre(); U.view = 'tactics'; U.sel = null; render(); window.scrollTo(0, 0); break;
      case 'pre-back': playMatch(true); break;
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
      case 'youth': { const p = FM.youthIntake(); if (p) { render(true); playerModal(p.id); toast(p.name + ' A takıma yükseldi.', 'good'); } } break;
      case 'upgrade': say(FM.upgrade(d.v)); render(true); break;
      case 'buy': { if (!d.h) { FM.ui.acts['neg-open']({ id: d.id, k: 'sign' }); break; } const r = FM.buy(+d.id, !!d.h); say(r); if (r.ok) { closeModal(); render(true); } } break;
      case 'loan-in': { const r = FM.loanIn(+d.id); say(r); if (r.ok) { closeModal(); render(true); } } break;
      case 'loan-out': { const r = FM.loanOut(+d.id); say(r); if (r.ok) { closeModal(); render(true); } } break;
      case 'scout': { const r = FM.scout(+d.id); say(r); if (r.ok) { closeModal(); render(true); } } break;
      case 'renew': FM.ui.acts['neg-open']({ id: d.id, k: 'renew' }); break;
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
      case 'reset': U.confirmReset = true; render(true); break;
      case 'reset-no': U.confirmReset = false; render(true); break;
      case 'reset-yes': FM.reset(); U.confirmReset = false; U.view = 'home'; U.shownBal = null; render(); window.scrollTo(0, 0); break;
      case 'new-season': FM.startNewSeason(); U.view = 'home'; render(); window.scrollTo(0, 0); break;
      default: if (FM.ui.acts[a]) FM.ui.acts[a](d, el);
    }
  }
  document.addEventListener('click', e => {
    if (e.target.id === 'modal') return closeModal();
    const el = e.target.closest('[data-a]'); if (!el || el.disabled || el.type === 'checkbox' || el.type === 'range' || el.type === 'color' || el.tagName === 'SELECT') return;
    act(el.dataset.a, el.dataset, el);
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'loadFile' && e.target.files[0]) { const rd = new FileReader(); rd.onload = () => { $('loadText').value = rd.result; }; rd.readAsText(e.target.files[0]); return; }
    const el = e.target.closest('input[data-a], select[data-a]'); if (el) act(el.dataset.a, el.dataset, el);
  });
  document.addEventListener('input', e => { if (e.target.id === 'ibq') { U.ib.q = e.target.value; refreshInbox(true); } });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('modal').hidden) closeModal();
    else if (e.key === 'Escape' && !$('press').hidden) closePress();
    else if (e.key === 'Escape' && !$('pre').hidden) { if (U.pre && U.pre.panel) { U.pre.panel = ''; showPre(); } else closePre(); }
    if (e.key === 'Enter' && e.target.matches('tr[data-a]')) act(e.target.dataset.a, e.target.dataset, e.target);
    if (e.key === 'Enter' && e.target.id === 'mgr') act('start', {}, e.target);
  });

  /* Diğer arayüz modüllerinin (ui-more.js) kullandığı yardımcılar */
  FM.ui = { spark, U, $, esc, toast, modal, closeModal, render, me, stars, posChip, fitBar, status, ovrB, ovrCls, fmtR, meter, gauge, playerRows, P_HEAD, VIEWS, TABS, playerModal, teamModal, playMatch, openPre, showPre, closePre, fxRow, goInbox, openMsg, ibItem, refreshInbox, cupModal, weekModal, confBtn, ticker, inboxPreview, openPress, startMatch, acts: {} };
})();
