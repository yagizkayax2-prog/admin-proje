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
  UI.jobScreen = () => {
    const G = FM.G, w = Wd.W(), sacked = G.phase === 'sacked';
    const offers = sacked && G.jobOffers.length ? `<section class="card jobs"><h2>Gelen teklifler <small>mülakatsız imza</small></h2><div class="team-grid">${G.jobOffers.map(id => { const t = T(id); return `<button class="team-card" data-a="job" data-id="${id}" style="--k1:${t.c1};--k2:${t.c2}">${FM.crest(t, 52)}<strong>${esc(t.name)}</strong><span class="muted">${esc(FM.DIV_TR[t.div])}</span></button>`; }).join('')}</div></section>` : '';
    return `<div class="season-end sacked jobless"><p class="eyebrow">${G.season}. sezon · ${sacked ? 'görevden alındın' : 'işsiz teknik direktör'}</p>
      <h1>${sacked ? 'Yeni bir kulüp ara' : 'Kariyerine bir kulüp bul'}</h1>
      <p>${sacked ? `${esc(me().name)} ile yollar ayrıldı. Gelen teklifleri kabul edebilir ya da açık pozisyonlara başvurabilirsin.` : `${esc(G.manager)}, henüz bir kulübün yok. Açık pozisyonlara başvur; her başvuruda yönetimle bir mülakat yaparsın. Kulübün kültürüne uyan cevaplar şansını artırır, her ret bir sonraki başvuruda tecrübe kazandırır.`}</p>
      <div class="kpis sm"><div><span>Menajer itibarı</span><b>${Math.round(Wd.mgrRep())}</b></div><div><span>Reddedilen başvuru</span><b>${w.tries}</b></div><div><span>Zorluk</span><b>${Wd.DIFF[G.diff == null ? 1 : G.diff][0]}</b></div></div>
      ${offers}
      <section class="card jobs"><h2>Açık pozisyonlar</h2><div class="team-grid">${w.vac.map(card).join('') || '<p class="muted">Şu an açık pozisyon yok.</p>'}</div><button class="btn" data-a="gl-more">Başka ilanlara bak</button></section>
      <button class="link" data-a="reset-yes">Yeni kariyere başla</button></div>`;
  };
  function ivModal() {
    const w = Wd.W(), iv = w.iv; if (!iv) return;
    const t = T(iv.tid), q = Wd.Q[iv.qs[iv.ans.length]];
    modal(`<div class="iv"><p class="eyebrow">Mülakat · ${iv.ans.length + 1}/${iv.qs.length}</p><div class="sg-info">${FM.crest(t, 48)}<div><strong>${esc(t.name)}</strong><span class="muted">Başkanın tarzı: ${esc((t.info && t.info.chair) || '—')} · Kulüp kültürü: ${esc(((t.info && t.info.mcult) || []).join(', '))}</span></div></div>
      <h3>${esc(q.q)}</h3><div class="opts">${q.a.map((a, i) => `<button class="opt" data-a="gl-ans" data-v="${i}"><strong>${esc(a[0])}</strong></button>`).join('')}</div></div>`);
  }
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
})();
