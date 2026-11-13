/* Saha Kenarı — arayüz: ekranlar, pencereler, etkileşim */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const { P, T, money } = FM;
  const U = { view: 'home', fxWeek: null, sel: null, tf: { pos: 'ALL', afford: false }, pickTeam: 0, confirmReset: false, shownBal: null };
  const TABS = [['home', 'Ana Sayfa'], ['squad', 'Kadro'], ['tactics', 'Taktik'], ['fixtures', 'Fikstür'], ['table', 'Lig'], ['transfer', 'Transfer'], ['training', 'Antrenman'], ['club', 'Kulüp']];
  const me = () => T(FM.G.teamId);
  const stars = n => `<span class="stars" aria-label="${n} yıldız">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`;
  const posChip = pos => `<span class="pos ${pos}">${FM.POS_TR[pos]}</span>`;
  const fitBar = v => `<span class="fit ${v < 60 ? 'low' : v < 80 ? 'mid' : ''}" title="Kondisyon ${Math.round(v)}"><i style="width:${Math.round(v)}%"></i></span>`;
  const status = p => (p.inj ? `<span class="tag bad">Sakat ${p.inj}h</span>` : p.susp ? '<span class="tag bad">Cezalı</span>' : '');
  const ovrCls = v => (v >= 78 ? 'o4' : v >= 70 ? 'o3' : v >= 62 ? 'o2' : 'o1');

  function toast(msg, kind) {
    const t = document.createElement('div');
    t.className = 'toast-item ' + (kind || '');
    t.textContent = msg;
    $('toast').appendChild(t);
    setTimeout(() => t.classList.add('out'), 2800);
    setTimeout(() => t.remove(), 3300);
  }
  function modal(html, wide) { $('modal').innerHTML = `<div class="modal-card ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><button class="x" data-a="close" aria-label="Kapat">×</button>${html}</div>`; $('modal').hidden = false; }
  function closeModal() { $('modal').hidden = true; $('modal').innerHTML = ''; }

  /* ---------- Başlangıç ekranı ---------- */
  function startScreen() {
    const t = FM.TEAMS[U.pickTeam];
    return `<div class="start">
      <div class="start-hero"><img class="stad" src="assets/stadium.svg" alt=""><div class="start-title"><img src="assets/logo.svg" alt="" width="72" height="72"><div><h1>Saha Kenarı</h1><p>Kulübünü seç, kadronu kur, şampiyonluğa yürü.</p></div></div><img class="hero-ball" src="assets/ball.svg" alt="" width="46" height="46"></div>
      <div class="start-body">
        <h2>Kulübünü seç</h2>
        <div class="team-grid">${FM.TEAMS.map((x, i) => `<button class="team-card ${i === U.pickTeam ? 'on' : ''}" data-a="pick-team" data-id="${i}" style="--k1:${x.c1};--k2:${x.c2}">${FM.crest(x, 52)}<strong>${x.name}</strong>${stars(x.rep)}</button>`).join('')}</div>
        <div class="start-go" style="--k1:${t.c1};--k2:${t.c2}">
          <div class="sg-info">${FM.crest(t, 64)}<div><strong>${t.name}</strong><span>${t.stadium} · ${['', 'Zorlu görev', 'Alt sıra takımı', 'Orta sıra takımı', 'Avrupa adayı', 'Şampiyonluk adayı'][t.rep]}</span></div></div>
          <label for="mgr">Teknik direktör adı</label>
          <div class="row"><input id="mgr" type="text" maxlength="24" placeholder="Adın" autocomplete="off"><button class="btn primary big" data-a="start">Kariyere başla</button></div>
        </div>
      </div></div>`;
  }

  /* ---------- Kabuk ---------- */
  function shell(inner) {
    const G = FM.G, t = me();
    return `<header class="top"><div class="top-in">
        <div class="club">${FM.crest(t, 38)}<div><strong>${t.name}</strong><span>${esc(G.manager)} · ${G.season}. sezon · Hafta ${Math.min(G.week + 1, FM.WEEK_COUNT)}/${FM.WEEK_COUNT}</span></div></div>
        <div class="top-r"><div class="bal"><span>Bütçe</span><b id="bal" class="${G.fin.balance < 0 ? 'neg' : ''}">${money(G.fin.balance)}</b></div>
        <button class="btn icon" data-a="sound" aria-label="Ses aç/kapat">${FM.icon(FM.Audio.muted ? 'mute' : 'sound')}</button></div>
      </div>
      <nav class="tabs" aria-label="Bölümler"><div class="tabs-in">${TABS.map(([k, n]) => `<button data-a="tab" data-v="${k}" class="${U.view === k ? 'on' : ''}" ${U.view === k ? 'aria-current="page"' : ''}>${FM.icon(k)}<span>${n}</span></button>`).join('')}</div></nav>
    </header><main class="view enter" id="view">${inner}</main>`;
  }
  function fxRow(f, big) {
    const h = T(f.h), a = T(f.a), mine = f.h === FM.G.teamId || f.a === FM.G.teamId;
    return `<li class="fx ${mine ? 'mine' : ''} ${big ? 'big' : ''}"><span class="fh">${h.name}${FM.crest(h, 26)}</span><b class="sc ${f.hs == null ? 'tbd' : ''}">${f.hs == null ? 'vs' : f.hs + ' – ' + f.as}</b><span class="fa">${FM.crest(a, 26)}${a.name}</span></li>`;
  }

  /* ---------- Ana sayfa ---------- */
  function viewHome() {
    const G = FM.G, fx = FM.userFixture(), tb = FM.table();
    const pos = tb.findIndex(r => r.id === G.teamId);
    const from = Math.max(0, Math.min(pos - 2, tb.length - 5));
    const h = T(fx.h), a = T(fx.a), opp = fx.h === G.teamId ? a : h, oppRow = tb.find(r => r.id === opp.id);
    const form = r => r.form.slice(-5).map(x => `<i class="f${x}">${x}</i>`).join('') || '<em>—</em>';
    const last = G.week > 0 ? G.fixtures[G.week - 1] : null;
    return `<section class="next"><img class="stad" src="assets/stadium.svg" alt="">
        <div class="next-in"><p class="eyebrow">${G.week + 1}. hafta · ${h.stadium}</p>
          <div class="vs"><div class="vt">${FM.crest(h, 72)}<strong>${h.name}</strong><span class="form">${form(tb.find(r => r.id === h.id))}</span></div><b>VS</b><div class="vt">${FM.crest(a, 72)}<strong>${a.name}</strong><span class="form">${form(oppRow)}</span></div></div>
          <button class="btn primary big pulse" data-a="play">${FM.icon('play')} Maça çık</button>
          <p class="hint">${fx.h === G.teamId ? 'İç saha' : 'Deplasman'} · Rakip ligde ${tb.indexOf(oppRow) + 1}. sırada</p></div>
      </section>
      ${G.offers.map(o => { const p = P(o.pid); return `<section class="card offer"><div>${FM.avatar(p, 40)}<p><strong>${T(o.tid).name}</strong>, ${esc(p.name)} için <b>${money(o.amt)}</b> teklif ediyor. <small>Piyasa değeri ${money(p.value)}</small></p></div><div class="row"><button class="btn" data-a="offer-no" data-id="${o.pid}">Reddet</button><button class="btn primary" data-a="offer-yes" data-id="${o.pid}">Kabul et</button></div></section>`; }).join('')}
      <div class="grid2">
        <section class="card"><h2>Puan durumu</h2>${tableHtml(tb.slice(from, from + 5), from, true)}<button class="link" data-a="tab" data-v="table">Tüm tablo</button></section>
        <section class="card"><h2>Haberler</h2><ul class="news">${G.news.slice(0, 6).map(n => `<li class="${n.kind}"><b>${n.s}. sezon · ${n.w}. hafta</b>${esc(n.text)}</li>`).join('')}</ul></section>
      </div>
      ${last ? `<section class="card"><h2>Geçen haftanın sonuçları</h2><ul class="fxl">${last.map(f => fxRow(f)).join('')}</ul></section>` : ''}`;
  }
  function tableHtml(rows, offset, compact) {
    return `<div class="scroll"><table class="tbl lg"><thead><tr><th>#</th><th class="l">Takım</th><th>O</th>${compact ? '' : '<th>G</th><th>B</th><th>M</th><th>A</th><th>Y</th>'}<th>AV</th><th>P</th>${compact ? '' : '<th class="l">Form</th>'}</tr></thead><tbody>` +
      rows.map((r, i) => { const t = T(r.id); return `<tr class="${r.id === FM.G.teamId ? 'mine' : ''}"><td class="rk r${offset + i + 1}">${offset + i + 1}</td><td class="l tm">${FM.crest(t, 22)}${t.name}</td><td>${r.pl}</td>${compact ? '' : `<td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}</td><td>${r.ga}</td>`}<td>${r.gf - r.ga > 0 ? '+' : ''}${r.gf - r.ga}</td><td><b>${r.pts}</b></td>${compact ? '' : `<td class="l form">${r.form.slice(-5).map(x => `<i class="f${x}">${x}</i>`).join('')}</td>`}</tr>`; }).join('') + '</tbody></table></div>';
  }

  /* ---------- Kadro ---------- */
  const ORDER = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
  function playerRows(list, extra) {
    return list.map(p => `<tr data-a="player" data-id="${p.id}" tabindex="0"><td class="l pl">${FM.avatar(p, 34)}<span><strong>${esc(p.name)}</strong>${status(p)}${extra ? extra(p) : ''}</span></td><td>${posChip(p.pos)}</td><td>${p.age}</td><td><b class="ovr ${ovrCls(p.ovr)}">${p.ovr}</b></td><td class="pot">${p.pot}</td><td>${fitBar(p.fit)}</td><td class="hide-s">${p.g}/${p.as}</td><td class="r">${money(extra ? FM.askPrice(p) : p.value)}</td></tr>`).join('');
  }
  const P_HEAD = last => `<thead><tr><th class="l">Oyuncu</th><th>Mevki</th><th>Yaş</th><th>GEN</th><th>POT</th><th>Kond.</th><th class="hide-s">G/A</th><th class="r">${last}</th></tr></thead>`;
  function viewSquad() {
    const t = me(), list = t.players.map(P).sort((a, b) => ORDER[a.pos] - ORDER[b.pos] || b.ovr - a.ovr);
    const avg = Math.round(list.reduce((s, p) => s + p.ovr, 0) / list.length), age = (list.reduce((s, p) => s + p.age, 0) / list.length).toFixed(1);
    return `<div class="kpis"><div><span>Oyuncu</span><b>${list.length}</b></div><div><span>Ortalama güç</span><b>${avg}</b></div><div><span>Yaş ortalaması</span><b>${age.replace('.', ',')}</b></div><div><span>Haftalık maaş</span><b>${money(FM.wageBill(t))}</b></div></div>
      <section class="card"><h2>A takım kadrosu</h2><div class="scroll"><table class="tbl pls">${P_HEAD('Değer')}<tbody>${playerRows(list)}</tbody></table></div></section>`;
  }
  function playerModal(id) {
    const p = P(id), G = FM.G, mine = p.tid === G.teamId, t = p.tid != null ? T(p.tid) : null;
    const bars = Object.keys(FM.ATTR_TR).filter(k => (p.pos === 'GK') === (k === 'gk') || (p.pos === 'GK' && (k === 'pas' || k === 'phy'))).map(k => `<div class="attr"><span>${FM.ATTR_TR[k]}</span><i><b class="${ovrCls(p.a[k])}" style="--w:${p.a[k]}%"></b></i><em>${p.a[k]}</em></div>`).join('');
    const act = mine
      ? `<button class="btn" data-a="sell-ask" data-id="${id}">Satış için teklif al</button>`
      : `<p class="price">İstenen bedel <b>${money(FM.askPrice(p))}</b> · Maaş ${money(p.wage)}/hafta</p><div class="row"><button class="btn" data-a="buy" data-h="1" data-id="${id}">Pazarlık et (%15 indirim)</button><button class="btn primary" data-a="buy" data-id="${id}">Satın al</button></div>`;
    modal(`<div class="pm-head">${FM.avatar(p, 84)}<div><h3>${esc(p.name)}</h3><p>${posChip(p.pos)} ${FM.POS_LONG[p.pos]} · ${p.age} yaş · No ${p.num}</p><p class="muted">${t ? FM.crest(t, 18) + ' ' + t.name : 'Serbest oyuncu'} ${status(p)}</p></div><div class="pm-ovr"><b class="ovr ${ovrCls(p.ovr)}">${p.ovr}</b><span>Potansiyel ${p.pot}</span></div></div>
      <div class="attrs">${bars}</div>
      <div class="kpis sm"><div><span>Maç</span><b>${p.apps}</b></div><div><span>Gol</span><b>${p.g}</b></div><div><span>Asist</span><b>${p.as}</b></div><div><span>Kart</span><b>${p.yc}/${p.rc}</b></div><div><span>Moral</span><b>${Math.round(p.mor)}</b></div><div><span>Değer</span><b>${money(p.value)}</b></div></div>
      <div class="pm-act" id="pmAct">${act}</div>`);
  }

  /* ---------- Taktik ---------- */
  function viewTactics() {
    const t = me();
    FM.ensureLineup(t);
    const slots = FM.FORMATIONS[t.formation], inXI = new Set(t.lineup);
    const rest = t.players.filter(id => !inXI.has(id)).map(P).sort((a, b) => ORDER[a.pos] - ORDER[b.pos] || b.ovr - a.ovr);
    const r = FM.ratings({ slots, on: t.lineup, ment: t.ment });
    const toks = slots.map((s, i) => {
      const p = t.lineup[i] != null ? P(t.lineup[i]) : null, selc = U.sel && U.sel.k === 'slot' && U.sel.v === i ? 'sel' : '';
      const wrong = p && p.pos !== s[0];
      return `<button class="tok ${selc} ${wrong ? 'wrong' : ''}" style="left:${s[2] * 100}%;top:${91 - s[1] * 92}%;--k1:${t.c1};--k2:${t.c2};--d:${i * 35}ms" data-a="slot" data-i="${i}" aria-label="${s[0]} ${p ? esc(p.name) : 'boş'}"><span class="dot">${p ? p.num : '+'}</span><span class="nm">${p ? esc(p.name.split(' ').pop()) : FM.POS_TR[s[0]]}</span>${p ? `<span class="ov">${Math.round(FM.eff(p, s[0]))}</span>` : ''}</button>`;
    }).join('');
    const meter = (l, v) => `<div class="attr"><span>${l}</span><i><b class="${ovrCls(v)}" style="--w:${Math.min(100, v)}%"></b></i><em>${Math.round(v)}</em></div>`;
    return `<div class="tac">
      <section class="card"><h2>Diziliş</h2><div class="seg wrap">${Object.keys(FM.FORMATIONS).map(f => `<button data-a="formation" data-v="${f}" class="${f === t.formation ? 'on' : ''}">${f}</button>`).join('')}</div>
        <div class="pitch"><div class="pitch-lines"></div>${toks}</div>
        <p class="hint">Yer değiştirmek için önce bir oyuncuya, sonra diğerine dokun. Sarı çerçeve mevki dışı oyuncuyu gösterir.</p></section>
      <div class="tac-side">
        <section class="card"><h2>Oyun anlayışı</h2><div class="seg">${FM.MENT_TR.map((n, i) => `<button data-a="ment" data-v="${i}" class="${i === t.ment ? 'on' : ''}">${n}</button>`).join('')}</div>
          <div class="attrs">${meter('Hücum', r.att)}${meter('Orta saha', r.ctl)}${meter('Savunma', r.def)}</div>
          <button class="btn" data-a="autopick">En iyi 11'i otomatik seç</button></section>
        <section class="card"><h2>Yedekler</h2><ul class="bench">${rest.map(p => `<li><button class="${U.sel && U.sel.k === 'bench' && U.sel.v === p.id ? 'sel' : ''}" data-a="bench" data-id="${p.id}" ${FM.available(p) ? '' : 'disabled'}>${posChip(p.pos)}<span class="nm">${esc(p.name)} ${status(p)}</span><b class="ovr ${ovrCls(p.ovr)}">${p.ovr}</b>${fitBar(p.fit)}</button></li>`).join('')}</ul></section>
      </div></div>`;
  }
  function tacticClick(k, v) {
    const t = me(), a = U.sel;
    if (!a) { U.sel = { k, v }; return render(); }
    if (a.k === k && a.v === v) { U.sel = null; return render(); }
    if (a.k === 'slot' && k === 'slot') { const x = t.lineup[a.v]; t.lineup[a.v] = t.lineup[v]; t.lineup[v] = x; }
    else if (a.k === 'bench' && k === 'bench') { U.sel = { k, v }; return render(); }
    else { const slot = a.k === 'slot' ? a.v : v, pid = a.k === 'bench' ? a.v : v; t.lineup[slot] = pid; }
    U.sel = null; FM.save(); render();
  }

  /* ---------- Fikstür ve lig ---------- */
  function viewFixtures() {
    const G = FM.G, w = U.fxWeek == null ? G.week : U.fxWeek, rd = G.fixtures[w];
    const mine = G.fixtures.map((r, i) => ({ f: r.find(f => f.h === G.teamId || f.a === G.teamId), i }));
    return `<section class="card"><div class="pager"><button class="btn icon" data-a="fxw" data-v="${w - 1}" ${w <= 0 ? 'disabled' : ''} aria-label="Önceki hafta">‹</button><h2>${w + 1}. hafta</h2><button class="btn icon" data-a="fxw" data-v="${w + 1}" ${w >= FM.WEEK_COUNT - 1 ? 'disabled' : ''} aria-label="Sonraki hafta">›</button></div>
      <ul class="fxl">${rd.map(f => fxRow(f, true)).join('')}</ul></section>
      <section class="card"><h2>Sezon programın</h2><ol class="season">${mine.map(({ f, i }) => { const home = f.h === G.teamId, o = T(home ? f.a : f.h), d = f.hs == null ? null : (home ? f.hs - f.as : f.as - f.hs); return `<li class="${i === G.week ? 'cur' : ''}"><button data-a="fxw" data-v="${i}"><span class="wk">${i + 1}</span>${FM.crest(o, 22)}<span class="nm">${o.name}</span><span class="ha">${home ? 'İç' : 'Dep'}</span>${d == null ? '<b class="tbd">—</b>' : `<b class="${d > 0 ? 'fG' : d < 0 ? 'fM' : 'fB'}">${f.hs}–${f.as}</b>`}</button></li>`; }).join('')}</ol></section>`;
  }
  function viewTable() {
    const all = Object.values(FM.G.players).filter(p => p.tid != null);
    const top = (k, n) => all.filter(p => p[k] > 0).sort((a, b) => b[k] - a[k] || a.apps - b.apps).slice(0, n);
    const lst = (k) => top(k, 8).map((p, i) => `<li class="${p.tid === FM.G.teamId ? 'mine' : ''}"><span class="wk">${i + 1}</span>${FM.crest(T(p.tid), 20)}<span class="nm">${esc(p.name)}</span><b>${p[k]}</b></li>`).join('') || '<li class="muted">Henüz veri yok.</li>';
    return `<section class="card"><h2>Yıldızlar Ligi · ${FM.G.season}. sezon</h2>${tableHtml(FM.table(), 0)}</section>
      <div class="grid2"><section class="card"><h2>Gol krallığı</h2><ol class="rank">${lst('g')}</ol></section><section class="card"><h2>Asist krallığı</h2><ol class="rank">${lst('as')}</ol></section></div>`;
  }

  /* ---------- Transfer ---------- */
  function viewTransfer() {
    const G = FM.G, f = U.tf;
    let list = FM.marketList().filter(p => (f.pos === 'ALL' || p.pos === f.pos) && (!f.afford || FM.askPrice(p) <= G.fin.balance));
    list.sort((a, b) => b.ovr - a.ovr || a.age - b.age);
    const total = list.length; list = list.slice(0, 60);
    return `<section class="card"><h2>Transfer pazarı</h2>
      <div class="filters"><div class="seg">${[['ALL', 'Tümü'], ['GK', 'KL'], ['DEF', 'DF'], ['MID', 'OS'], ['FWD', 'FV']].map(([k, n]) => `<button data-a="tf-pos" data-v="${k}" class="${f.pos === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <label class="chk" for="tfAfford"><input type="checkbox" id="tfAfford" data-a="tf-afford" ${f.afford ? 'checked' : ''}> Bütçeme uyanlar</label><span class="muted">${total} oyuncudan ${list.length} tanesi</span></div>
      <div class="scroll"><table class="tbl pls">${P_HEAD('Bedel')}<tbody>${playerRows(list, p => `<small class="clubn">${p.tid == null ? 'Serbest' : T(p.tid).name}</small>`)}</tbody></table></div></section>`;
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
      <section class="card"><h2>Gelişime en açık oyuncular</h2><div class="scroll"><table class="tbl pls">${P_HEAD('Değer')}<tbody>${playerRows(young)}</tbody></table></div></section>`;
  }

  /* ---------- Kulüp ---------- */
  function spark(h) {
    const d = h.slice(-24), mn = Math.min(...d), mx = Math.max(...d), W = 300, H = 70;
    if (d.length < 2) return '<p class="muted">İlk haftadan sonra bütçe grafiği burada görünür.</p>';
    const pt = d.map((v, i) => [i / (d.length - 1) * W, H - 6 - (v - mn) / Math.max(1, mx - mn) * (H - 12)]);
    const line = pt.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Bütçe: ${money(d[0])} → ${money(d[d.length - 1])}"><path d="${line}L${W} ${H}L0 ${H}z" class="area"/><path d="${line}" class="ln" pathLength="1"/><circle cx="${pt[pt.length - 1][0]}" cy="${pt[pt.length - 1][1]}" r="3.5" class="pt"/></svg><div class="spark-l"><span>${money(mn)}</span><span>${money(mx)}</span></div>`;
  }
  function viewClub() {
    const G = FM.G, t = me(), l = G.fin.last, pos = FM.table().findIndex(r => r.id === G.teamId) + 1, exp = FM.expectation(t);
    const facDesc = { training: 'Oyuncular daha hızlı gelişir.', youth: 'Altyapıdan daha yetenekli gençler çıkar.', stadium: `Kapasite ${FM.stadiumCap(t).toLocaleString('tr-TR')} · her seviye +%15 seyirci.` };
    return `<div class="grid2">
      <section class="card"><h2>Finans</h2><div class="kpis sm"><div><span>Bütçe</span><b>${money(G.fin.balance)}</b></div><div><span>Haftalık maaş</span><b>${money(FM.wageBill(t))}</b></div><div><span>Sponsor</span><b>${money(G.fin.sponsor)}</b></div></div>
        ${spark(G.fin.hist)}
        ${l ? `<table class="tbl fin"><tbody><tr><td class="l">Sponsor geliri</td><td class="r pos-v">+${money(l.sponsor)}</td></tr><tr><td class="l">Bilet geliri ${l.att ? '(' + l.att.toLocaleString('tr-TR') + ' seyirci)' : '(deplasman)'}</td><td class="r pos-v">+${money(l.tickets)}</td></tr><tr><td class="l">Maaşlar</td><td class="r neg-v">−${money(l.wages)}</td></tr><tr><td class="l"><b>Geçen hafta net</b></td><td class="r"><b>${money(l.net)}</b></td></tr></tbody></table>` : ''}</section>
      <section class="card"><h2>Yönetim</h2><p>Hedef: <b>${exp}. sıra</b> veya üstü. Şu an <b>${pos}.</b> sıradasın.</p><div class="conf ${pos <= exp ? 'ok' : pos <= exp + 2 ? 'mid' : 'bad'}"><i style="width:${Math.max(8, Math.min(100, 60 + (exp - pos) * 12))}%"></i></div><p class="muted">${pos <= exp ? 'Yönetim gidişattan memnun.' : pos <= exp + 2 ? 'Yönetim daha iyisini bekliyor.' : 'Yönetim sonuçlardan rahatsız.'}</p>
        <h2>Geçmiş sezonlar</h2>${G.history.length ? `<table class="tbl"><thead><tr><th>Sezon</th><th>Sıra</th><th>Puan</th><th class="l">Şampiyon</th></tr></thead><tbody>${G.history.map(h => `<tr><td>${h.season}</td><td>${h.pos}</td><td>${h.pts}</td><td class="l">${h.champion}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">İlk sezonun devam ediyor.</p>'}</section></div>
      <section class="card"><h2>Tesisler</h2><div class="facs">${Object.keys(FM.FAC).map(k => `<div class="fac"><div><strong>${FM.FAC[k].name}</strong><span class="lv">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= t.fac[k] ? 'on' : ''}"></i>`).join('')}</span><p>${facDesc[k]}</p></div><button class="btn" data-a="upgrade" data-v="${k}" ${t.fac[k] >= 5 ? 'disabled' : ''}>${t.fac[k] >= 5 ? 'En üst seviye' : 'Geliştir · ' + money(FM.facCost(k))}</button></div>`).join('')}</div></section>
      <section class="card"><h2>Kariyer</h2><p class="muted">Oyun bu tarayıcıda otomatik kaydedilir.</p>${U.confirmReset ? '<p>Tüm kariyer silinecek. Emin misin?</p><div class="row"><button class="btn" data-a="reset-no">Vazgeç</button><button class="btn danger" data-a="reset-yes">Kariyeri sil</button></div>' : '<button class="btn" data-a="reset">Yeni kariyere başla</button>'}</section>`;
  }

  /* ---------- Sezon sonu ---------- */
  function seasonScreen() {
    const G = FM.G, s = G.summary, ch = T(s.champion), won = s.champion === G.teamId;
    return `<div class="season-end"><img class="trophy ${won ? 'won' : ''}" src="assets/trophy.svg" alt="" width="120" height="140">
      <p class="eyebrow">${s.season}. sezon tamamlandı</p><h1>${won ? 'ŞAMPİYON!' : s.pos + '. sırada bitirdin'}</h1>
      <p>${won ? 'Kupa müzene geliyor. Taraftar sokaklarda!' : `Şampiyon: ${ch.name}`}</p>
      <div class="kpis"><div><span>Lig sırası</span><b>${s.pos}.</b></div><div><span>Yönetim hedefi</span><b>${s.exp}.</b></div><div><span>Ödül</span><b>${money(s.prize)}</b></div>${s.top ? `<div><span>Gol kralı</span><b>${esc(s.top.name)} (${s.top.g})</b></div>` : ''}</div>
      <p class="${s.pos <= s.exp ? 'good' : 'bad'}">${s.pos <= s.exp ? 'Yönetim hedefi tutturuldu, sözleşmen uzatıldı.' : 'Hedefin gerisinde kaldın. Yönetim gelecek sezon daha iyisini bekliyor.'}</p>
      <div class="podium">${s.table.map((id, i) => `<div class="p${i + 1}">${FM.crest(T(id), 48)}<strong>${T(id).name}</strong><span>${i + 1}.</span></div>`).join('')}</div>
      <button class="btn primary big" data-a="new-season">Yeni sezona başla</button></div>`;
  }

  /* ---------- Çizim ve akış ---------- */
  const VIEWS = { home: viewHome, squad: viewSquad, tactics: viewTactics, fixtures: viewFixtures, table: viewTable, transfer: viewTransfer, training: viewTraining, club: viewClub };
  function render(keepScroll) {
    const G = FM.G, app = $('app'), y = window.scrollY;
    if (!G) { app.innerHTML = startScreen(); return; }
    if (G.phase === 'seasonEnd') { app.innerHTML = seasonScreen(); confettiBurst(); return; }
    const mgr = document.activeElement && document.activeElement.id;
    app.innerHTML = shell(VIEWS[U.view]());
    if (keepScroll) { $('view').classList.remove('enter'); window.scrollTo(0, y); }
    if (mgr && $(mgr)) $(mgr).focus();
    countBalance();
  }
  function countBalance() {
    const el = $('bal'), to = FM.G.fin.balance, from = U.shownBal;
    U.shownBal = to;
    if (from == null || from === to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t0 = performance.now();
    el.classList.add(to > from ? 'up' : 'down');
    (function step(t) {
      const k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3);
      const cur = $('bal'); if (!cur) return;
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
  function playMatch() {
    const G = FM.G, t = me(), fx = FM.userFixture();
    const changed = FM.ensureLineup(t);
    if (t.lineup.filter(x => x != null).length < 11) toast('Sahaya 11 kişiden az çıkıyorsun: uygun oyuncu yok.', 'bad');
    else if (changed.length) toast('Kadro güncellendi: ' + changed.map(id => P(id).name).join(', ') + ' ilk 11\'e girdi.');
    FM.Audio.init();
    const m = FM.newMatch(fx), wk = G.week;
    FM.MatchView.start(m, () => {
      FM.finishMatch(m);
      FM.simOthers();
      FM.endWeek();
      U.view = 'home'; U.fxWeek = null; U.sel = null;
      render(); window.scrollTo(0, 0);
      if (!G.phase) weekModal(wk);
    });
  }
  function weekModal(wk) {
    const G = FM.G, l = G.fin.last;
    modal(`<h3>${wk + 1}. hafta sonuçları</h3><ul class="fxl">${G.fixtures[wk].map(f => fxRow(f)).join('')}</ul>
      <p class="fin-line">Haftalık bilanço: <b class="${l.net >= 0 ? 'pos-v' : 'neg-v'}">${l.net >= 0 ? '+' : ''}${money(l.net)}</b>${l.att ? ` · ${l.att.toLocaleString('tr-TR')} seyirci` : ''}</p>
      <div class="row end"><button class="btn primary" data-a="close">Tamam</button></div>`, true);
  }

  function act(a, d, el) {
    const G = FM.G;
    switch (a) {
      case 'pick-team': U.pickTeam = +d.id; { const v = $('mgr').value; render(); $('mgr').value = v; } break;
      case 'start': FM.Audio.init(); FM.newGame(U.pickTeam, $('mgr').value.trim()); U.view = 'home'; U.shownBal = null; render(); window.scrollTo(0, 0); break;
      case 'tab': U.view = d.v; U.sel = null; U.fxWeek = null; U.confirmReset = false; render(); window.scrollTo(0, 0); break;
      case 'sound': el.innerHTML = FM.icon(FM.Audio.toggle() ? 'mute' : 'sound'); break;
      case 'play': playMatch(); break;
      case 'close': closeModal(); break;
      case 'player': playerModal(+d.id); break;
      case 'slot': tacticClick('slot', +d.i); break;
      case 'bench': tacticClick('bench', +d.id); break;
      case 'formation': me().formation = d.v; FM.autoPick(me()); U.sel = null; FM.save(); render(true); break;
      case 'ment': me().ment = +d.v; FM.save(); render(true); break;
      case 'autopick': FM.autoPick(me()); U.sel = null; FM.save(); render(true); toast('En formda 11 sahaya sürüldü.'); break;
      case 'fxw': U.fxWeek = +d.v; render(true); break;
      case 'tf-pos': U.tf.pos = d.v; render(true); break;
      case 'tf-afford': U.tf.afford = el.checked; render(true); break;
      case 'focus': G.training.focus = d.v; FM.save(); render(true); break;
      case 'intensity': G.training.intensity = +d.v; FM.save(); render(true); break;
      case 'youth': { const p = FM.youthIntake(); if (p) { render(true); playerModal(p.id); toast(p.name + ' A takıma yükseldi.', 'good'); } } break;
      case 'upgrade': { const r = FM.upgrade(d.v); toast(r.msg, r.ok ? 'good' : 'bad'); render(true); } break;
      case 'buy': { const r = FM.buy(+d.id, !!d.h); toast(r.msg, r.ok ? 'good' : 'bad'); if (r.ok) { closeModal(); render(true); } } break;
      case 'sell-ask': {
        const r = FM.sellOffer(+d.id);
        if (!r.ok) { toast(r.msg, 'bad'); break; }
        $('pmAct').innerHTML = `<p class="price"><b>${T(r.tid).name}</b> ${money(r.amt)} teklif ediyor.</p><div class="row"><button class="btn" data-a="close">Reddet</button><button class="btn primary" data-a="sell-yes" data-id="${d.id}" data-t="${r.tid}" data-amt="${r.amt}">Sat</button></div>`;
      } break;
      case 'sell-yes': FM.sell(+d.id, +d.t, +d.amt); closeModal(); render(true); toast('Transfer tamamlandı.', 'good'); break;
      case 'offer-yes': {
        const o = G.offers.find(x => x.pid === +d.id);
        if (me().players.length <= 16) { toast('Kadroda en az 16 oyuncu kalmalı.', 'bad'); break; }
        if (o) { FM.sell(o.pid, o.tid, o.amt); toast('Teklif kabul edildi.', 'good'); } render(true);
      } break;
      case 'offer-no': G.offers = G.offers.filter(x => x.pid !== +d.id); FM.save(); render(true); break;
      case 'reset': U.confirmReset = true; render(true); break;
      case 'reset-no': U.confirmReset = false; render(true); break;
      case 'reset-yes': FM.reset(); U.confirmReset = false; U.view = 'home'; U.shownBal = null; render(); window.scrollTo(0, 0); break;
      case 'new-season': FM.startNewSeason(); U.view = 'home'; render(); window.scrollTo(0, 0); break;
    }
  }
  document.addEventListener('click', e => {
    if (e.target.id === 'modal') return closeModal();
    const el = e.target.closest('[data-a]'); if (!el || el.disabled || el.type === 'checkbox') return;
    act(el.dataset.a, el.dataset, el);
  });
  document.addEventListener('change', e => { const el = e.target.closest('input[data-a]'); if (el) act(el.dataset.a, el.dataset, el); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('modal').hidden) closeModal();
    if (e.key === 'Enter' && e.target.matches('tr[data-a]')) act(e.target.dataset.a, e.target.dataset, e.target);
    if (e.key === 'Enter' && e.target.id === 'mgr') act('start', {}, e.target);
  });

  FM.load();
  render();
})();
