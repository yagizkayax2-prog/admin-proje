/* Saha Kenarı — dünya katmanının arayüzü: iş başvurusu ve mülakat ekranı, "Ülke" sekmesi (milli takım, yabancı kuralı,
   ülkenin ligleri), transfer pazarında ülke/kıta filtresi ve scout ağı, oyuncu kariyer grafiği, kulüp tarihi. */
(function () {
  const UI = FM.ui, { U, esc, toast, modal, closeModal, render, me, posChip, VIEWS, GROUPS, acts } = UI;
  const P = id => FM.P(id), T = id => FM.T(id), money = FM.money, Wd = FM.World2;
  const say = r => toast(r.msg, r.ok ? 'good' : 'bad');
  const flag = cc => { const C = FM.COUNTRIES[cc]; if (!C) return ''; return `<span class="flag" title="${esc(C.n)}" aria-label="${esc(C.n)}">${C.f.map(c => `<i style="background:${c}"></i>`).join('')}</span>`; };
  FM.ui.flag = flag;

  /* ---------- menü: Dünya → Ülke ---------- */
  const grp = GROUPS.find(g => g[0] === 'world');
  if (grp && !grp[2].some(x => x[0] === 'country')) grp[2].splice(1, 0, ['country', 'Ülke']);

  /* ---------- iş ekranı (işsiz başlangıç ve kovulma) ---------- */
  const card = id => { const t = T(id), C = FM.COUNTRIES[FM.clubCc(t)]; return `<div class="team-card job-c" style="--k1:${t.c1};--k2:${t.c2}">${FM.crest(t, 52)}<strong>${esc(t.name)}</strong><span class="muted">${flag(FM.clubCc(t))} ${esc(FM.DIV_TR[t.div])}</span><span class="muted">${C ? esc(C.n) : ''} · itibar ${'★'.repeat(t.rep)}</span>${t.info ? `<small class="muted">${esc((t.info.mcult || [])[0] || '')}</small>` : ''}<button class="btn primary" data-a="gl-apply" data-id="${id}">Başvur · mülakata gir</button></div>`; };
  function idleBox() {
    const G = FM.G, natonly = G.phase === 'natonly', cc = Wd.natCc(), top = FM.cDivs(cc)[0], d = FM.fmtDate(G.season, G.week);
    const tb = top != null ? FM.table(top).slice(0, 5) : [], x = FM.Ext.X(), n = x.nat;
    const last = n.matches.slice(0, 3).map(r => `<li><span class="nm">${r.s}. sezon · ${esc(r.opp)}</span><b class="${r.win > 0 ? 'pos-v' : r.win < 0 ? 'neg-v' : ''}">${r.gf}–${r.ga}</b></li>`).join('');
    return `<section class="card idle"><div class="idle-h"><div><h2>${esc(d.d)} <small>${G.season}. sezon · ${Math.min(G.week + 1, FM.WEEK_COUNT)}. hafta</small></h2><p class="muted">${natonly ? 'Kulübün yok; milli takımı çalıştırıyorsun. Milli aralar 7. ve 16. haftada, çift sezonların sonunda Kıta Şampiyonası var. İstersen bir kulübe de başvurabilirsin.' : 'Haftalar sen işsizken de akıyor: ligler oynanıyor, kulüpler hoca değiştiriyor, yeni ilanlar açılıyor.'}</p></div>
      <button class="btn primary big" data-a="gl-idle">Haftayı geçir ▶</button></div>
      <div class="grid2"><div><h3 class="rnd">${esc(FM.DIV_TR[top] || '')}</h3><ol class="rank">${tb.map((r, i) => `<li><span class="wk">${i + 1}</span><span class="nm">${esc(T(r.id).name)}</span><b>${r.pts}</b></li>`).join('')}</ol></div>
      <div><h3 class="rnd">Milli takım ${n.job ? '· güven ' + Math.round(n.rep) : ''}</h3>${n.job ? `<ul class="rank">${last || '<li class="muted">Henüz maç yok.</li>'}</ul><p class="muted">Aday kadronun ilk 11 gücü: <b>${(() => { const sq = FM.Ext.natSquad().slice(0, 11); return sq.length ? Math.round(sq.reduce((a, p) => a + p.ovr, 0) / sq.length) : '—'; })()}</b></p>` : '<p class="muted">Milli takım görevin yok.</p>'}</div></div></section>`;
  }
  UI.jobScreen = () => {
    const G = FM.G, w = Wd.W(), sacked = G.phase === 'sacked';
    const offers = sacked && G.jobOffers.length ? `<section class="card jobs"><h2>Gelen teklifler <small>mülakatsız imza</small></h2><div class="team-grid">${G.jobOffers.map(id => { const t = T(id); return `<button class="team-card" data-a="job" data-id="${id}" style="--k1:${t.c1};--k2:${t.c2}">${FM.crest(t, 52)}<strong>${esc(t.name)}</strong><span class="muted">${esc(FM.DIV_TR[t.div])}</span></button>`; }).join('')}</div></section>` : '';
    const natonly = G.phase === 'natonly';
    return `<div class="season-end sacked jobless"><p class="eyebrow">${G.season}. sezon · ${sacked ? 'görevden alındın' : natonly ? 'milli takım teknik direktörü' : 'işsiz teknik direktör'}</p>
      <h1>${sacked ? 'Yeni bir kulüp ara' : natonly ? esc(Wd.ccName(Wd.natCc())) + ' milli takımı' : 'Kariyerine bir kulüp bul'}</h1>
      <p>${sacked ? `${esc(me().name)} ile yollar ayrıldı. Gelen teklifleri kabul edebilir, açık pozisyonlara başvurabilir ya da bekleyip yeni ilanları kollayabilirsin.` : natonly ? 'Federasyon seni göreve getirdi. Milli takım kadrosunu Ülke sekmesindeki gibi uyruğa göre seçersin; maçlar milli aralarda oynanır.' : `${esc(G.manager)}, henüz bir kulübün yok. Açık pozisyonlara başvur; her başvuruda yönetimle bir mülakat yaparsın. Kulübün kültürüne uyan cevaplar şansını artırır, her ret bir sonraki başvuruda tecrübe kazandırır.`}</p>
      <div class="kpis sm"><div><span>Menajer itibarı</span><b>${Math.round(Wd.mgrRep())}</b></div><div><span>Reddedilen başvuru</span><b>${w.tries}</b></div><div><span>Zorluk</span><b>${Wd.DIFF[G.diff == null ? 1 : G.diff][0]}</b></div></div>
      ${offers}
      ${idleBox()}
      <section class="card jobs"><h2>Açık pozisyonlar</h2><div class="team-grid">${w.vac.map(card).join('') || '<p class="muted">Şu an açık pozisyon yok.</p>'}</div><button class="btn" data-a="gl-more">Başka ilanlara bak</button></section>
      <button class="link" data-a="reset-yes">Yeni kariyere başla</button></div>`;
  };
  function ivModal() {
    const w = Wd.W(), iv = w.iv; if (!iv) return;
    const t = T(iv.tid), q = Wd.Q[iv.qs[iv.ans.length]];
    modal(`<div class="iv"><p class="eyebrow">Mülakat · ${iv.ans.length + 1}/${iv.qs.length}</p><div class="sg-info">${FM.crest(t, 48)}<div><strong>${esc(t.name)}</strong><span class="muted">Başkanın tarzı: ${esc((t.info && t.info.chair) || '—')} · Kulüp kültürü: ${esc(((t.info && t.info.mcult) || []).join(', '))}</span></div></div>
      <h3>${esc(q.q)}</h3><div class="opts">${q.a.map((a, i) => `<button class="opt" data-a="gl-ans" data-v="${i}"><strong>${esc(a[0])}</strong></button>`).join('')}</div></div>`);
  }
  acts['gl-idle'] = () => { const r = Wd.idleWeek(); if (r.msg) toast(r.msg, r.ok ? 'good' : 'bad'); render(); };
  acts['gl-apply'] = d => { Wd.interview(+d.id); ivModal(); };
  acts['gl-ans'] = d => {
    const r = Wd.answer(+d.v); if (!r) return;
    if (!r.done) { ivModal(); return; }
    closeModal(); toast(r.msg, r.ok ? 'good' : 'bad');
    if (r.ok) { U.view = 'home'; U.shownBal = null; }
    render(); window.scrollTo(0, 0);
  };
  acts['gl-more'] = () => { const w = Wd.W(); if (w.vac.length >= 8) { toast('Önce mevcut ilanlara başvur.'); return; } Wd.makeVacancies(2); render(); };

  /* ---------- Ülke sekmesi ---------- */
  VIEWS.country = () => {
    const G = FM.G, cc = Wd.natCc(), C = FM.COUNTRIES[cc] || { n: cc, l: [] }, x = FM.Ext.X(), n = x.nat, myCc = FM.clubCc(me());
    const sq = FM.Ext.natSquad(), abroad = Object.values(G.players).filter(p => p.nat === cc && p.tid != null && FM.clubCc(T(p.tid)) !== cc).length;
    const rule = FM.RULES && FM.RULES[myCc], fl = FM.foreignLimit(me()), fc = FM.foreignCount(me());
    const lgs = FM.cDivs(cc).map(d => { const tb = FM.table(d), lead = tb[0] ? T(tb[0].id) : null; return `<li><span class="nm">${esc(FM.DIV_TR[d])}</span><span class="muted">${lead ? 'lider ' + esc(lead.name) : ''}</span></li>`; }).join('');
    const hist = G.history.filter(h => h.team).slice(-6).reverse().map(h => `<li><span class="nm">${h.season}. sezon · ${esc(h.team)}</span><span class="muted">şampiyon ${esc(h.champion)}</span></li>`).join('');
    return `<section class="card"><h2>${flag(cc)} ${esc(C.n)} <small>${esc(C.cont || '')}</small></h2>
        <div class="kpis sm"><div><span>Kurulu lig</span><b>${FM.cDivs(cc).length}</b></div><div><span>Milli havuz</span><b>${Object.values(G.players).filter(p => p.nat === cc && p.tid != null).length}</b></div><div><span>Yurt dışında oynayan</span><b>${abroad}</b></div><div><span>Milli takım gücü</span><b>${sq.length ? Math.round(sq.slice(0, 11).reduce((a, p) => a + p.ovr, 0) / Math.min(11, sq.length)) : '—'}</b></div></div></section>
      <div class="grid2"><section class="card"><h2>Kurallar <small>${esc((FM.COUNTRIES[myCc] || {}).n || '')} ligi</small></h2>
        <p>Kadroda en fazla <b>${fl}</b> yabancı oyuncu olabilir${rule ? '' : ' (federasyonun genel kuralı)'}. Kadronda şu an <b class="${fc >= fl ? 'neg-v' : ''}">${fc}</b> yabancı var.</p>
        <p class="muted">Başka ülkeden gelen oyuncu ilk 8 hafta uyum sürecindedir: sahada biraz düşük performans gösterir. Uzak kıtalardaki oyuncuların gücü daha belirsiz görünür; Transfer → Pazar'dan kıtaya scout ağı kurabilirsin.</p></section>
      <section class="card"><h2>Ligler</h2><ul class="rank">${lgs || '<li class="muted">Bu ülkenin ligi veri tabanında yok; milli takım yine de çalışır.</li>'}</ul>${hist ? `<h3 class="rnd">Senin sezonların</h3><ul class="rank">${hist}</ul>` : ''}</section></div>
      ${n.job ? '' : `<section class="card"><h2>Milli takım</h2><p class="muted">${n.offered ? 'Federasyonun teklifi gelen kutunda.' : 'Kupa kazandıkça ya da yönetim güveni yüksek kaldıkça federasyon milli takımı çalıştırman için teklif getirebilir. Yeni kariyerde "Milli takımla başla" seçeneğiyle görevi ilk günden alabilirsin.'}</p></section>`}
      ${n.job ? `<section class="card"><h2>Milli takım <small>${esc(C.n)}</small></h2><div class="kpis sm"><div><span>G</span><b>${n.rec.w}</b></div><div><span>B</span><b>${n.rec.d}</b></div><div><span>M</span><b>${n.rec.l}</b></div><div><span>Federasyon güveni</span><b>${Math.round(n.rep)}</b></div></div>
        <div class="grid2"><div><h3 class="rnd">Son maçlar</h3><ul class="rank">${n.matches.map(r => `<li><span class="nm">${r.s}. sezon · ${esc(r.opp)}</span><b class="${r.win > 0 ? 'pos-v' : r.win < 0 ? 'neg-v' : ''}">${r.gf}–${r.ga}</b></li>`).join('') || '<li class="muted">Henüz maç yok. Milli aralar 7. ve 16. haftada.</li>'}</ul></div>
        <div><h3 class="rnd">Aday kadro (23)</h3><ol class="rank">${sq.map((p, i) => `<li><span class="wk">${i + 1}</span>${posChip(p.pos)}<button class="nm link" data-a="player" data-id="${p.id}">${esc(p.name)} <small class="clubn">${flag(FM.clubCc(T(p.tid)))} ${esc(T(p.tid).name)}</small></button><b>${p.ovr}</b></li>`).join('')}</ol></div></div></section>` : ''}`;
  };

  /* ---------- transfer pazarı: ülke/kıta filtresi ve scout ağı ---------- */
  const vTf = VIEWS.transfer;
  VIEWS.transfer = () => {
    const f = U.tf, G = FM.G, w = Wd.W();
    const conts = [...new Set(Object.keys(FM.COUNTRIES).map(cc => FM.COUNTRIES[cc].cont))];
    const lgCcs = [...new Set(FM.LDIVS().map(FM.ccOf))].filter(cc => FM.COUNTRIES[cc]);
    const sel = `<label class="sp" for="tfCc"><span>Ülke</span><select id="tfCc" data-a="tf-cc"><option value="">Hepsi</option><option value="@me" ${f.cc === '@me' ? 'selected' : ''}>Yalnız yerli (yabancı sınırına takılmaz)</option>${lgCcs.map(cc => `<option value="${cc}" ${f.cc === cc ? 'selected' : ''}>${esc(FM.COUNTRIES[cc].n)} kulüpleri</option>`).join('')}${conts.map(c => `<option value="#${c}" ${f.cc === '#' + c ? 'selected' : ''}>${esc(c)} kıtası</option>`).join('')}</select></label>`;
    const net = `<section class="card snet"><h2>Scout ağı <small>kıta başına ${money(Wd.NET_COST)}</small></h2><div class="lg-chips">${conts.map(c => { const on = !!w.snet[c] || c === FM.COUNTRIES[FM.clubCc(me())].cont; return `<button class="lg-chip ${on ? 'on' : ''}" ${on ? 'disabled' : ''} data-a="gl-net" data-v="${esc(c)}">${on ? '✓' : '+'} ${esc(c)}</button>`; }).join('')}</div><p class="muted">Ağ olan kıtalardaki oyuncuların gücü daha net görünür, scout masrafı ₺30 Bin'de kalır. Ağ olmayan kıtaya scout göndermek ₺40 Bin daha pahalı.</p></section>`;
    U.tfView = true; let h; try { h = vTf(); } finally { U.tfView = false; }
    h = h.replace('<div class="filters">', '<div class="filters">' + sel);
    return h + net;
  };
  const mk = FM.marketList;
  FM.marketList = () => {
    const f = U.tf, all = mk(); if (!U.tfView || !f || !f.cc || !FM.G) return all;
    const my = FM.clubCc(me());
    if (f.cc === '@me') return all.filter(p => p.nat === my);
    if (f.cc[0] === '#') { const c = f.cc.slice(1); return all.filter(p => Wd.contOf(Wd.playerCc(p)) === c); }
    return all.filter(p => p.tid != null && FM.clubCc(T(p.tid)) === f.cc);
  };
  acts['tf-cc'] = (d, el) => { U.tf.cc = el.value || null; render(true); };
  acts['gl-net'] = d => { const r = Wd.buyNet(d.v); say(r); render(true); };

  /* ---------- oyuncu penceresi: uyruk, uyum ve kariyer grafiği ---------- */
  function careerChart(p) {
    const h = p.h || []; if (h.length < 1) return '';
    const W = 320, H = 96, pad = 18, n = h.length, xs = i => pad + (n === 1 ? (W - pad * 2) / 2 : i * (W - pad * 2) / (n - 1));
    const ov = h.map(r => r[6]), mn = Math.min(...ov) - 3, mx = Math.max(...ov) + 3, ys = v => H - pad - (v - mn) / Math.max(1, mx - mn) * (H - pad * 2);
    const gm = Math.max(1, ...h.map(r => r[3]));
    const bars = h.map((r, i) => `<rect x="${xs(i) - 5}" y="${H - pad - r[3] / gm * 34}" width="10" height="${r[3] / gm * 34}" class="cc-bar"><title>${r[0]}. sezon: ${r[3]} gol</title></rect>`).join('');
    const line = h.map((r, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)} ${ys(r[6]).toFixed(1)}`).join(' ');
    return `<svg viewBox="0 0 ${W} ${H}" class="cc-svg" role="img" aria-label="Sezonlara göre güç ve gol grafiği">${bars}<path d="${line}" class="cc-line"/>${h.map((r, i) => `<circle cx="${xs(i)}" cy="${ys(r[6])}" r="3" class="cc-dot"><title>${r[0]}. sezon: güç ${r[6]}</title></circle><text x="${xs(i)}" y="${H - 4}" class="cc-t">S${r[0]}</text>`).join('')}</svg>`;
  }
  const vPm = UI.pmExtra;
  UI.pmExtra = p => {
    const prev = vPm ? vPm(p) : '', h = p.h || [];
    const nat = p.nat && FM.COUNTRIES[p.nat] ? `<p class="muted">${flag(p.nat)} Uyruk: ${esc(FM.COUNTRIES[p.nat].n)}${p.tid != null && FM.isForeign(p, T(p.tid)) ? ' · bu kulüpte yabancı statüsünde' : ''}${p.adapt ? ` · <b>uyum süreci: ${p.adapt} hafta</b>` : ''}</p>` : '';
    const rows = h.slice().reverse().map(r => `<tr><td class="l">${r[0]}. sezon</td><td class="l">${T(r[1]) ? esc(T(r[1]).name) : '—'}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5] ? (r[5] / 10).toFixed(1).replace('.', ',') : '—'}</td><td>${r[6]}</td></tr>`).join('');
    const car = h.length ? `<section class="pm-car"><h4>Kariyer geçmişi</h4>${careerChart(p)}<div class="scroll"><table class="tbl"><thead><tr><th class="l">Sezon</th><th class="l">Kulüp</th><th>Maç</th><th>Gol</th><th>Asist</th><th>Ort.</th><th>Güç</th></tr></thead><tbody>${rows}</tbody></table></div></section>` : '';
    return nat + prev + car;
  };

  /* ---------- kulüp tarihi ---------- */
  const vClub = VIEWS.club;
  VIEWS.club = () => {
    const G = FM.G, h = (Wd.W().ch[G.teamId] || []);
    if (!h.length) return vClub() + `<section class="card"><h2>Kulüp tarihi</h2><p class="muted">Sezon bittikçe kulübün lig sıralamaları burada birikir.</p></section>`;
    const W = 360, H = 120, pad = 20, n = h.length, xs = i => pad + (n === 1 ? (W - pad * 2) / 2 : i * (W - pad * 2) / (n - 1));
    const y = r => { const tier = FM.tierOf(r[1]); return pad + ((tier * 12 + r[2] - 1) / 35) * (H - pad * 2); };
    const path = h.map((r, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)} ${y(r).toFixed(1)}`).join(' ');
    const svg = `<svg viewBox="0 0 ${W} ${H}" class="cc-svg" role="img" aria-label="Sezonlara göre lig sıralaması">${[0, 1, 2].map(t => `<line x1="${pad}" x2="${W - pad}" y1="${pad + t * 12 / 35 * (H - pad * 2)}" y2="${pad + t * 12 / 35 * (H - pad * 2)}" class="cc-grid"/>`).join('')}<path d="${path}" class="cc-line"/>${h.map((r, i) => `<circle cx="${xs(i)}" cy="${y(r)}" r="3.5" class="cc-dot ${r[2] === 1 ? 'gold' : ''}"><title>${r[0]}. sezon: ${esc(FM.DIV_TR[r[1]] || '')} ${r[2]}. (${r[3]} puan)</title></circle><text x="${xs(i)}" y="${H - 4}" class="cc-t">S${r[0]}</text>`).join('')}</svg>`;
    const rows = h.slice().reverse().map(r => `<tr><td class="l">${r[0]}. sezon</td><td class="l">${esc(FM.DIV_TR[r[1]] || '')}</td><td>${r[2]}.</td><td>${r[3]}</td></tr>`).join('');
    return vClub() + `<section class="card"><h2>Kulüp tarihi <small>lig sıralaması (yukarısı daha iyi)</small></h2>${svg}<div class="scroll"><table class="tbl"><thead><tr><th class="l">Sezon</th><th class="l">Lig</th><th>Sıra</th><th>Puan</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  };

  /* ---------- açık artırma ve özel çalışma (oyuncu penceresi) ---------- */
  const vPm2 = UI.pmExtra;
  UI.pmExtra = p => {
    let h = vPm2 ? vPm2(p) : '';
    const G = FM.G, w = Wd.W(), a = w.auc && w.auc[p.id];
    if (a && p.tid !== G.teamId) h = `<section class="card auc"><h4>Açık artırma</h4><p>${FM.crest(T(a.tid), 20)} <b>${esc(T(a.tid).name)}</b> son teklif: <b>${money(a.amt)}</b></p><div class="row"><button class="btn primary" data-a="gl-raise" data-id="${p.id}">Teklifi artır · ${money(Math.round(a.amt * 1.06 / 10000) * 10000)}</button><button class="btn" data-a="gl-wd" data-id="${p.id}">Çekil</button></div></section>` + h;
    if (p.tid === G.teamId && !p.loan && !p.y) {
      const L = p.learn, traits = Object.keys(FM.TRAITS).filter(k => k !== 'glass' && k !== p.trait), roles = (Wd.ROLES[p.pos] || []).filter(r => r !== p.role);
      h += `<section class="pm-learn"><h4>Özel çalışma</h4>${L ? `<p>${L.kind === 'trait' ? `"${esc(FM.TRAITS[L.key][0])}" özelliği` : `${esc(FM.ROLE_TR[L.key])} rolü`} üzerinde çalışıyor · <b>${L.w} hafta</b> kaldı.</p><button class="btn" data-a="gl-teach" data-id="${p.id}">Çalışmayı bırak</button>` :
        `<p class="muted">Aynı anda en fazla 3 oyuncu. Özellik ${p.age > 27 ? '12' : '8'} hafta sürer (gençler daha kolay öğrenir), rol değişimi 5 hafta.</p><div class="row"><select id="glTr" aria-label="Öğretilecek özellik">${traits.map(k => `<option value="${k}">${esc(FM.TRAITS[k][0])}</option>`).join('')}</select><button class="btn" data-a="gl-teach" data-id="${p.id}" data-k="trait">Özellik öğret</button>${roles.length ? `<select id="glRole" aria-label="Yeni rol">${roles.map(r => `<option value="${r}">${esc(FM.ROLE_TR[r])}</option>`).join('')}</select><button class="btn" data-a="gl-teach" data-id="${p.id}" data-k="role">Rol çalış</button>` : ''}</div>`}</section>`;
    }
    return h;
  };
  acts['gl-raise'] = d => { const r = Wd.raise(+d.id); say(r); if (r.ok) closeModal(); else UI.playerModal(+d.id); render(true); };
  acts['gl-wd'] = d => { say(Wd.withdraw(+d.id)); closeModal(); render(true); };
  acts['gl-teach'] = d => { const el = d.k === 'role' ? document.getElementById('glRole') : document.getElementById('glTr'); say(Wd.teach(+d.id, d.k, el ? el.value : null)); UI.playerModal(+d.id); };

  /* ---------- altyapı: kiralık oyuncu takibi ---------- */
  const vYouth = VIEWS.youth;
  VIEWS.youth = () => {
    const ls = Wd.loans(), lr = Wd.learning();
    const loanCard = `<section class="card"><h2>Kiralıktaki oyuncuların <small>gelişim takibi</small></h2>${ls.length ? `<div class="scroll"><table class="tbl"><thead><tr><th class="l">Oyuncu</th><th class="l">Kulüp</th><th>Maç</th><th>Gol</th><th>Ort.</th><th>Güç</th></tr></thead><tbody>${ls.map(p => `<tr data-a="player" data-id="${p.id}" tabindex="0"><td class="l">${esc(p.name)}</td><td class="l">${esc(T(p.tid).name)}</td><td>${p.apps}</td><td>${p.g}</td><td>${p.rn ? (p.rs / p.rn).toFixed(1).replace('.', ',') : '—'}</td><td>${p.loanOvr != null && p.loanOvr !== p.ovr ? `${p.loanOvr} → <b class="${p.ovr > p.loanOvr ? 'pos-v' : 'neg-v'}">${p.ovr}</b>` : p.ovr}</td></tr>`).join('')}</tbody></table></div><p class="muted">Her 4 haftada bir kiralık raporu gelen kutuna düşer.</p>` : '<p class="muted">Kiralık verdiğin oyuncu yok. Gelişmesi gereken gençleri oyuncu penceresinden kiraya verebilirsin; kiralıktaki genç daha hızlı gelişir.</p>'}</section>`;
    const learnCard = lr.length ? `<section class="card"><h2>Özel çalışmadakiler</h2><ul class="rank">${lr.map(p => `<li><button class="nm link" data-a="player" data-id="${p.id}">${esc(p.name)}</button><span class="muted">${p.learn.kind === 'trait' ? esc(FM.TRAITS[p.learn.key][0]) : esc(FM.ROLE_TR[p.learn.key])}</span><b>${p.learn.w} hf</b></li>`).join('')}</ul></section>` : '';
    return vYouth() + learnCard + loanCard;
  };

  /* ---------- maliye: yeni gider kalemleri ---------- */
  const vFin = VIEWS.finance;
  if (vFin) VIEWS.finance = () => {
    const G = FM.G, tot = G.fin.tot || {}, l = G.fin.last || {};
    return vFin() + `<section class="card"><h2>Diğer giderler <small>${G.season}. sezon</small></h2><table class="tbl fin"><tbody>
      <tr><td class="l">Tesis ve stadyum bakımı${l.upkeep ? ` (bu hafta ${money(l.upkeep)})` : ''}</td><td class="r neg-v">−${money(tot.upkeep || 0)}</td></tr>
      <tr><td class="l">Menajer ücretleri ve satış vergisi</td><td class="r neg-v">−${money(tot.fees || 0)}</td></tr>
      <tr><td class="l">Yönetime aktarılan fazla</td><td class="r neg-v">−${money(tot.board || 0)}</td></tr></tbody></table>
      <p class="muted">Bakım gideri tesis seviyelerine ve stadyum kapasitesine göre artar. Alımlarda %5 menajer ücreti, satışlarda %10 vergi ve aracılık kesintisi var. Maaşlar her yeni sezonda %4 artar. Kasada çok para birikirse yönetim fazlanın bir kısmını alır.</p></section>`;
  };

  /* ---------- Onur listesi ---------- */
  const home = GROUPS.find(g => g[0] === 'home'); if (home && !home[2].some(x => x[0] === 'hof')) home[2].push(['hof', 'Onur listesi']);
  VIEWS.hof = () => {
    const G = FM.G, d = G.dp || {}, M = d.mgr || { st: {}, clubs: [] }, st = M.st || {}, mu = G.museum, x = FM.Ext.X(), n = x.nat;
    const clubs = (M.clubs || []).map(c => `<li>${FM.crest(T(c.tid), 22)}<span class="nm">${esc(T(c.tid).name)}</span><span class="muted">${c.from}. sezon – ${c.to != null ? c.to + '. sezon' : 'bugün'}</span></li>`).join('');
    const myClubs = new Set((M.clubs || []).map(c => c.tid).concat(G.teamId));
    const agg = {}; for (const id in G.players) { const p = G.players[id]; for (const r of (p.h || [])) if (myClubs.has(r[1])) { const a = agg[id] || (agg[id] = { p, apps: 0, g: 0 }); a.apps += r[2]; a.g += r[3]; } }
    const stars = Object.values(agg).sort((a, b) => b.apps - a.apps || b.g - a.g).slice(0, 8);
    const ach = Object.keys(FM.ACH).map(k => `<div class="ach ${G.ach && G.ach[k] ? 'on' : ''}"><b>${G.ach && G.ach[k] ? '★' : '☆'} ${esc(FM.ACH[k][0])}</b><small>${esc(FM.ACH[k][1])}</small></div>`).join('');
    const tr = mu.titles.length + mu.cups.length + (mu.euro || []).length + n.titles.length;
    return `<section class="card"><h2>${esc(G.manager)} <small>onur listesi</small></h2><div class="kpis"><div><span>Sezon</span><b>${G.season}</b></div><div><span>Kupa</span><b>${tr}</b></div><div><span>Maç</span><b>${st.m || 0}</b></div><div><span>G-B-M</span><b>${st.w || 0}-${st.d || 0}-${st.l || 0}</b></div><div><span>İtibar</span><b>${Math.round(M.rep || 0)}</b></div></div></section>
      <div class="grid2"><section class="card"><h2>Kupalar</h2><ul class="rank">${mu.titles.map(s => `<li><span class="nm">Lig şampiyonluğu</span><b>${s}. sezon</b></li>`).join('')}${mu.cups.map(s => `<li><span class="nm">Kupa</span><b>${s}. sezon</b></li>`).join('')}${(mu.euro || []).map(s => `<li><span class="nm">Kıta Kupası</span><b>${s}. sezon</b></li>`).join('')}${n.titles.map(s => `<li><span class="nm">Kıta Şampiyonası (milli)</span><b>${s}. sezon</b></li>`).join('') || ''}${tr ? '' : '<li class="muted">Henüz kupa yok. İlk kupa her şeyi değiştirir.</li>'}</ul></section>
      <section class="card"><h2>Çalıştırdığın kulüpler</h2><ul class="rank hof-c">${clubs || '<li class="muted">—</li>'}</ul>${n.job || n.matches.length ? `<p class="muted">Milli takım: ${n.rec.w}G ${n.rec.d}B ${n.rec.l}M</p>` : ''}</section></div>
      <section class="card"><h2>Senin oyuncuların <small>en çok maça çıkanlar</small></h2>${stars.length ? `<ol class="rank">${stars.map(a => `<li><button class="nm link" data-a="player" data-id="${a.p.id}">${esc(a.p.name)}</button><span class="muted">${a.apps} maç</span><b>${a.g} gol</b></li>`).join('')}</ol>` : '<p class="muted">İlk sezon bitince burada birikir.</p>'}</section>
      <section class="card"><h2>Başarımlar <small>${Object.keys(G.ach || {}).filter(k => G.ach[k]).length}/${Object.keys(FM.ACH).length}</small></h2><div class="ach-grid">${ach}</div></section>`;
  };

  /* ---------- kaydı dosya olarak indir ---------- */
  acts['dl-save'] = async () => {
    const G = FM.G, filename = `saha-kenari-${(T(G.teamId).name || 'kariyer').toLocaleLowerCase('tr').replace(/[^a-z0-9çğıöşü]+/g, '-')}-s${G.season}.json`, data = FM.exportSave();
    // claude.ai görüntüleyicisinde indirme izni "downloads" yeteneğiyle verilir; başka yerde düz indirme bağlantısı kullanılır
    let dl = null; try { dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (e) { dl = null; }
    if (dl) {
      try { await dl.save({ filename, data }); toast('Kayıt dosyası kaydedildi. Başka cihazda "Kayıt yükle" → "Dosya seç" ile açabilirsin.', 'good'); }
      catch (e) { toast('Dosya kaydedilmedi. Metni kopyalayarak da saklayabilirsin.', 'bad'); }
      return;
    }
    try {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = filename;
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      toast('Kayıt dosyası indirildi. Başka cihazda "Kayıt yükle" → "Dosya seç" ile açabilirsin.', 'good');
    } catch (e) { toast('Dosya indirilemedi; metni kopyalayarak saklayabilirsin.', 'bad'); }
  };

  /* ---------- takım seçiminde 3D stadyum önizlemesi ---------- */
  let nsSt = null;
  function nsStadium() {
    const cv = document.getElementById('nsStad'); if (!cv || cv.dataset.on === cv.dataset.k) return;
    cv.dataset.on = cv.dataset.k;
    const c = FM.World.clubs(cv.dataset.k.split(':')[0]).find(x => x.key === cv.dataset.k); if (!c) return;
    const w = cv.parentElement.clientWidth, tier = Math.max(1, Math.min(5, c.rep - c.tier + 1));
    let st = null; try { st = FM.Stadium3D && FM.Stadium3D.create({ canvas: cv, W: w, dpr: Math.min(2, window.devicePixelRatio || 1), tier, home: c, away: { c1: '#52627a', c2: '#c9d3e0' }, fill: .4 + c.rep * .1, wx: { t: 'clear', n: 1 } }); } catch (e) { st = null; }
    if (!st) { if (FM.Stadium && FM.Stadium.preview) try { FM.Stadium.preview(cv, c); } catch (e) { /* önizleme yok */ } return; }
    nsSt = st; let ang = .6; const t0 = performance.now(), still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    (function loop(now) { if (nsSt !== st || !cv.isConnected) return; const time = (now - t0) / 1000; if (!still) ang += .003; st.render(time, { choreo: Math.min(1.2, time * .5), alpha: 1, cheer: [0, 0], disc: 0, shake: 0, shakeSide: 0, cer: -1, orbit: ang }); requestAnimationFrame(loop); })(t0);
  }
  const prevAfter = UI.after;
  UI.after = function () { if (prevAfter) prevAfter.apply(this, arguments); nsStadium(); };
})();
