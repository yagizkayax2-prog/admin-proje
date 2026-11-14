/* Saha Kenarı — derinlik sistemlerinin arayüzü: maç raporu (xG grafiği, şut haritası, pas ağı, ısı haritası),
   oyuncu talimatları ve duran top organizasyonu, yardımcı önerileri, sözleşme maddeleri, kadro planlayıcı, karşılaştırma,
   kayıtlı transfer filtreleri, oyuncu notları, gazete, teknik direktör sayfası, kafa kafaya geçmiş, zaman çizelgesi, kısayollar. */
(function () {
  const UI = FM.ui, { U, $, esc, toast, modal, closeModal, render, go, me, posChip, ovrB, fmtR, playerRows, P_HEAD, VIEWS, GROUPS, acts } = UI;
  const P = id => FM.P(id), T = id => FM.T(id), money = FM.money, Dp = FM.Depth;
  const say = r => toast(r.msg, r.ok ? 'good' : 'bad');
  const D = () => FM.G.dp;
  const f2 = v => (+v).toFixed(2).replace('.', ',');
  const lum = h => { const n = parseInt(h.slice(1), 16); return (n >> 16) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114; };
  const cdist = (a, b) => { const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16); return Math.abs((x >> 16) - (y >> 16)) + Math.abs(((x >> 8) & 255) - ((y >> 8) & 255)) + Math.abs((x & 255) - (y & 255)); };
  const sn = n => { const a = n.split(' '); return a.length > 1 ? a[0][0] + '. ' + a.slice(1).join(' ') : n; };

  /* ---------- menü ---------- */
  const addTab = (g, v, n, after) => { const grp = GROUPS.find(x => x[0] === g); if (!grp || grp[2].some(x => x[0] === v)) return; const i = after ? grp[2].findIndex(x => x[0] === after) : -1; if (i >= 0) grp[2].splice(i + 1, 0, [v, n]); else grp[2].push([v, n]); };
  addTab('home', 'paper', 'Gazete', 'social'); addTab('home', 'manager', 'Teknik direktör', 'career');
  addTab('team', 'planner', 'Planlama', 'training');
  addTab('transfer', 'compare', 'Karşılaştır');

  /* ================= Maç raporu ================= */
  function sideColors(r) {
    const h = T(r.t[0]), a = T(r.t[1]), c0 = h.c1, c1 = cdist(a.c1, c0) < 160 ? a.c2 : a.c1;
    const fix = c => (lum(c) < 40 ? '#9aa8bb' : c);
    return [fix(c0), fix(cdist(fix(c1), fix(c0)) < 120 ? '#58c4dd' : c1)];
  }
  const pitchBg = (W, H) => `<rect x="0" y="0" width="${W}" height="${H}" rx="6" class="rp-grass"/><g class="rp-ln"><rect x="6" y="6" width="${W - 12}" height="${H - 12}"/><line x1="${W / 2}" y1="6" x2="${W / 2}" y2="${H - 6}"/><circle cx="${W / 2}" cy="${H / 2}" r="${H * .14}"/><rect x="6" y="${H * .22}" width="${W * .16}" height="${H * .56}"/><rect x="${W - 6 - W * .16}" y="${H * .22}" width="${W * .16}" height="${H * .56}"/><rect x="6" y="${H * .37}" width="${W * .055}" height="${H * .26}"/><rect x="${W - 6 - W * .055}" y="${H * .37}" width="${W * .055}" height="${H * .26}"/></g>`;
  function xgChart(r, col) {
    const W = 600, H = 190, pl = 34, pr = 12, pt = 14, pb = 26, end = Math.max(90, ...r.shots.map(e => e.min)), cum = [[[0, 0]], [[0, 0]]], tot = [0, 0];
    r.shots.slice().sort((a, b) => a.min - b.min).forEach(e => { cum[e.s].push([e.min, tot[e.s]]); tot[e.s] += e.xg; cum[e.s].push([e.min, tot[e.s]]); });
    cum.forEach((c, s) => c.push([end, tot[s]]));
    const ym = Math.max(1, Math.ceil(Math.max(tot[0], tot[1]) * 2) / 2), X = m => pl + m / end * (W - pl - pr), Y = v => H - pb - v / ym * (H - pt - pb);
    const path = c => c.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('');
    const grid = []; for (let v = 0; v <= ym + 1e-9; v += ym > 2 ? 1 : .5) grid.push(`<line x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}" class="rp-grid"/><text x="${pl - 6}" y="${Y(v) + 4}" class="rp-ax" text-anchor="end">${String(v).replace('.', ',')}</text>`);
    const xt = [0, 15, 30, 45, 60, 75, 90].filter(m => m <= end).map(m => `<text x="${X(m)}" y="${H - 8}" class="rp-ax" text-anchor="middle">${m}'</text>`).join('');
    const gm = r.shots.filter(e => e.o === 'goal').map(e => { const c = cum[e.s], v = c.filter(p => p[0] <= e.min).slice(-1)[0][1]; return `<circle cx="${X(e.min)}" cy="${Y(v)}" r="6" fill="${col[e.s]}" class="rp-gm"><title>${e.min}' gol · ${f2(e.xg)} xG</title></circle>`; }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" class="rp-svg" role="img" aria-label="Dakikaya göre birikimli gol beklentisi: ${esc(T(r.t[0]).name)} ${f2(r.xg[0])}, ${esc(T(r.t[1]).name)} ${f2(r.xg[1])}">${grid.join('')}<line x1="${X(45)}" x2="${X(45)}" y1="${pt}" y2="${H - pb}" class="rp-ht"/>${xt}${[0, 1].map(s => `<path d="${path(cum[s])}" fill="none" stroke="${col[s]}" stroke-width="2.5" stroke-linejoin="round"/>`).join('')}${gm}</svg>`;
  }
  function shotMap(r, col) {
    const W = 600, H = 388;
    const dots = r.shots.filter(e => e.x != null).map(e => {
      const x = (e.s === 0 ? e.x : 1 - e.x) * (W - 12) + 6, y = (e.s === 0 ? e.y : 1 - e.y) * (H - 12) + 6, rr = 4 + Math.sqrt(e.xg) * 17, g = e.o === 'goal', p = P(e.pid);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}" fill="${g ? col[e.s] : 'none'}" stroke="${col[e.s]}" stroke-width="${g ? 2 : 1.6}" class="${g ? 'rp-goal' : 'rp-shot'}"><title>${e.min}' ${p ? esc(p.name) : ''} · ${f2(e.xg)} xG · ${g ? 'gol' : e.o === 'save' ? 'kurtarış' : e.o === 'var' ? 'VAR iptali' : 'isabetsiz'}</title></circle>`;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" class="rp-svg" role="img" aria-label="Şut haritası: ${r.shots.length} şut">${pitchBg(W, H)}${dots}</svg>`;
  }
  function passNet(r, col) {
    const W = 600, H = 388, us = r.us, px = n => 26 + (n.x || 0) * (W - 70) * (us === 0 ? 1 : 1), py = n => 20 + n.y * (H - 40);
    const ed = r.edges.map(e => { const a = r.nodes[e.a], b = r.nodes[e.b]; return `<line x1="${px(a)}" y1="${py(a)}" x2="${px(b)}" y2="${py(b)}" stroke="${col[us]}" stroke-opacity="${Math.min(.9, .25 + e.w * .9)}" stroke-width="${(1 + e.w * 7).toFixed(1)}" stroke-linecap="round"/>`; }).join('');
    const ink = lum(col[us]) > 150 ? '#14202f' : '#ffffff';
    const nd = r.nodes.map(n => `<g><circle cx="${px(n)}" cy="${py(n)}" r="${(10 + Math.max(0, n.r - 5) * 2.4).toFixed(1)}" fill="${col[us]}" stroke="#fff" stroke-width="1.5"/><text x="${px(n)}" y="${py(n) + 4}" text-anchor="middle" class="rp-num" fill="${ink}">${n.num}</text><text x="${px(n)}" y="${py(n) + 26 + Math.max(0, n.r - 5) * 2}" text-anchor="middle" class="rp-nm">${esc(n.n)}</text></g>`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" class="rp-svg" role="img" aria-label="Pas ağı: ilk 11'in konumları ve aralarındaki pas bağlantıları">${pitchBg(W, H)}${ed}${nd}</svg>`;
  }
  function heatMap(r) {
    const W = 600, H = 388, cw = (W - 12) / 12, ch = (H - 12) / 8;
    const cells = r.heat.map((v, i) => v < .06 ? '' : `<rect x="${6 + (i % 12) * cw}" y="${6 + Math.floor(i / 12) * ch}" width="${cw + .5}" height="${ch + .5}" class="rp-heat" fill-opacity="${(v * .78).toFixed(2)}"/>`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" class="rp-svg" role="img" aria-label="Isı haritası: takımın en çok bulunduğu bölgeler">${pitchBg(W, H)}${cells}</svg>`;
  }
  function reportHtml(r) {
    if (!r) return '<p class="muted">Henüz rapor yok. İlk maçından sonra burada görünür.</p>';
    const h = T(r.t[0]), a = T(r.t[1]), col = sideColors(r), us = r.us, tab = U.repTab || 'xg';
    const sh = s => r.shots.filter(e => e.s === s), on = s => sh(s).filter(e => e.o === 'goal' || e.o === 'save').length;
    const goals = r.goals.map(g => `<li class="${g.s ? 'r' : 'l'}">${esc(P(g.pid) ? sn(P(g.pid).name) : '')} ${g.min}'</li>`).join('');
    const tabs = [['xg', 'xG akışı'], ['shots', 'Şut haritası'], ['net', 'Pas ağı'], ['heat', 'Isı haritası']];
    const body = tab === 'shots' ? shotMap(r, col) : tab === 'net' ? passNet(r, col) : tab === 'heat' ? heatMap(r) : xgChart(r, col);
    const cap = { xg: 'Her şutun gol olma olasılığı (xG) dakika dakika toplanır. Dolu daireler goller.', shots: 'Daire büyüklüğü şutun xG değeri; dolu daireler gol. Ev sahibi sağa, deplasman sola hücum ediyor.', net: `${esc(T(r.t[us]).name)}: çizgi kalınlığı pas bağlantısının yoğunluğu, daire büyüklüğü maç puanı.`, heat: `${esc(T(r.t[us]).name)}: takımın maç boyunca en çok bulunduğu bölgeler (hücum yönü sağa).` }[tab];
    return `<div class="rep">
      <div class="rep-head"><div class="rep-t">${FM.crest(h, 40)}<b>${esc(h.name)}</b></div><div class="rep-sc"><strong>${r.sc[0]} – ${r.sc[1]}</strong>${r.pens ? `<small>pen. ${r.pens[0]}–${r.pens[1]}</small>` : ''}<span>xG ${f2(r.xg[0])} – ${f2(r.xg[1])}</span></div><div class="rep-t r">${FM.crest(a, 40)}<b>${esc(a.name)}</b></div></div>
      <ul class="ft-goals">${goals}</ul>
      <div class="rep-kpi"><div><b style="color:${col[0]}">${sh(0).length}</b><span>Şut</span><b style="color:${col[1]}">${sh(1).length}</b></div><div><b>${on(0)}</b><span>İsabetli</span><b>${on(1)}</b></div><div><b>${sh(0).filter(e => e.xg >= .16).length}</b><span>Net pozisyon</span><b>${sh(1).filter(e => e.xg >= .16).length}</b></div><div><b>${us === 0 ? r.poss : 100 - r.poss}%</b><span>Topa sahip olma</span><b>${us === 0 ? 100 - r.poss : r.poss}%</b></div></div>
      <div class="seg rep-tabs" role="tablist">${tabs.map(([k, n]) => `<button data-a="rep-tab" data-v="${k}" class="${tab === k ? 'on' : ''}" role="tab" aria-selected="${tab === k}">${n}</button>`).join('')}</div>
      <figure class="rep-fig">${body}<figcaption>${cap}</figcaption></figure>
      <div class="rep-why"><h4>Maçı ne belirledi?</h4><ul>${r.why.map(([k, t]) => `<li class="${k}">${esc(t)}</li>`).join('') || '<li class="mid">Dengeli bir maçtı; belirleyici bir fark yoktu.</li>'}</ul></div></div>`;
  }
  UI.reportHtml = reportHtml;
  acts['rep-open'] = () => modal(reportHtml(D().rep), true);
  acts['rep-tab'] = (d, el) => {
    U.repTab = d.v;
    const ov = el.closest('.ov-rep');   // maç ekranında henüz kaydedilmemiş maçın raporu
    if (ov && FM.MatchView.cur) { ov.innerHTML = reportHtml(FM.MatchView.cur()); return; }
    modal(reportHtml(D().rep), true);
  };

  /* ================= Ana sayfa kartları ================= */
  const vHome = VIEWS.home;
  VIEWS.home = () => {
    const d = D(), r = d && d.rep, iss = d && d.paper[0];
    const rc = r ? `<section class="card rep-card"><div><h2>Son maç raporu</h2><p class="muted">${esc(T(r.t[0]).name)} ${r.sc[0]}–${r.sc[1]} ${esc(T(r.t[1]).name)} · xG ${f2(r.xg[0])}–${f2(r.xg[1])}</p><p>${esc((r.why[0] || ['', 'Raporda şut haritası, pas ağı ve ısı haritası var.'])[1])}</p></div><button class="btn" data-a="rep-open">Raporu aç</button></section>` : '';
    const pc = iss ? `<section class="card paper-teaser" data-a="tab" data-v="paper" role="button" tabindex="0"><span class="eyebrow">Saha Kenarı Gazetesi · Sayı ${iss.no}</span><h2>${esc(iss.head)}</h2><p class="muted">${esc(iss.sub)}</p></section>` : '';
    return vHome() + (rc || pc ? `<div class="grid2">${rc}${pc}</div>` : '');
  };

  /* ================= Taktik: oyuncu talimatları ve duran toplar ================= */
  const PI = [['', 'Talimat yok'], ['push', 'Öne çık'], ['dist', 'Pas dağıt'], ['press', 'Önde bas'], ['long', 'Uzaktan şut']];
  const PI_D = { push: 'Hücuma daha çok katılır, daha çok şut çeker; arkada boşluk bırakır.', dist: 'Asist ve pas oyununun merkezi olur, daha az şut çeker.', press: 'Rakibi önde karşılar; orta saha hâkimiyeti artar, savunma biraz açılır.', long: 'Ceza sahası dışından daha sık şut dener; şutların kalitesi düşer.' };
  const vTac = VIEWS.tactics;
  VIEWS.tactics = () => {
    const t = me(), pi = t.pi || {}, spr = t.spr || { ck: 'mix', fk: 'direct', wall: 4 }, sl = FM.FORMATIONS[t.formation];
    const xi = t.lineup.map((id, i) => (id != null ? { p: P(id), i } : null)).filter(x => x && sl[x.i] && sl[x.i][0] !== 'GK');
    const cnt = k => Object.keys(pi).filter(id => pi[id] === k && t.lineup.includes(+id)).length;
    const seg = (k, opts) => `<div class="seg wrap">${opts.map(([v, n]) => `<button data-a="spr" data-k="${k}" data-v="${v}" class="${String(spr[k]) === String(v) ? 'on' : ''}">${n}</button>`).join('')}</div>`;
    return vTac() + `<div class="grid2"><section class="card"><h2>Oyuncu talimatları</h2><p class="muted">İlk 11'deki oyunculara bireysel görev ver. Aynı talimatın etkisi en fazla 3 oyuncuya kadar artar.</p>
      <div class="pi-list">${xi.map(({ p }) => `<label class="pi-row" for="pi${p.id}">${posChip(p.pos)}<span>${esc(p.name)}</span><select id="pi${p.id}" data-a="pi-set" data-id="${p.id}">${PI.map(([k, n]) => `<option value="${k}" ${(pi[p.id] || '') === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`).join('')}</div>
      <p class="chips">${PI.slice(1).map(([k, n]) => `<span class="chip ${cnt(k) ? 'on' : ''}" title="${PI_D[k]}">${n}: ${cnt(k)}</span>`).join('')}</p></section>
      <section class="card"><h2>Duran top organizasyonu</h2>
        <div class="spr"><strong>Kornerler</strong>${seg('ck', [['mix', 'Karışık'], ['near', 'Ön direk'], ['far', 'Arka direk'], ['short', 'Kısa']])}<p class="hint">Ön direk hızlı ve güçlü kafacılarla, arka direk uzun boylu bir hedef adamla etkilidir. Kısa korner şutörü öne çıkarır.</p></div>
        <div class="spr"><strong>Frikikler</strong>${seg('fk', [['direct', 'Direkt vuruş'], ['cross', 'Ortaya ortala']])}<p class="hint">İyi bir frikikçin varsa direkt vur; yoksa ortalamak kafa vuruşu fırsatı yaratır.</p></div>
        <div class="spr"><strong>Savunmada baraj</strong>${seg('wall', [[3, '3 kişi'], [4, '4 kişi'], [5, '5 kişi']])}<p class="hint">Kalabalık baraj direkt frikiği zorlaştırır ama ceza sahasında daha az adam kalır: rakip kornerleri tehlikeli olur.</p></div>
      </section></div>`;
  };
  acts['pi-set'] = (d, el) => { const t = me(); t.pi = t.pi || {}; if (el.value) t.pi[d.id] = el.value; else delete t.pi[d.id]; FM.save(); render(true); };
  acts.spr = d => { const t = me(); t.spr = t.spr || { ck: 'mix', fk: 'direct', wall: 4 }; t.spr[d.k] = d.k === 'wall' ? +d.v : d.v; FM.save(); render(true); };

  /* ================= Yardımcı antrenör ================= */
  UI.asstHtml = (oppId, home) => {
    const adv = Dp.advice(oppId, home);
    const btn = a => (!a ? '' : a === 'tactics' || a === 'squad' ? `<button class="lnk" data-a="pre-tactics">Taktiğe git</button>` : a.startsWith('team:') ? `<button class="lnk" data-a="team" data-id="${a.slice(5)}">Maç planı</button>` : '');
    return `<h3>Yardımcı antrenörün notları</h3><p class="muted">${esc(T(oppId).name)} maçı için hazırlık önerileri.</p><ul class="asst">${adv.map(([t, a]) => `<li><span>${esc(t)}</span>${btn(a)}</li>`).join('')}</ul>`;
  };

  /* ================= Sözleşme maddeleri (pazarlık penceresi) ================= */
  UI.negExtra = (s, p, step) => {
    const o = s.offer, sign = s.kind === 'sign', G = FM.G, t = me();
    const swaps = sign && p.tid != null ? t.players.map(P).filter(q => !q.loan && q.id !== t.cap) .sort((a, b) => b.value - a.value) : [];
    return `<details class="neg-cl" ${o.gb || o.ab || o.rcl || o.cut || o.swap != null ? 'open' : ''}><summary>Sözleşme maddeleri</summary>
      ${step('gb', 'Gol primi', money(o.gb || 0), 'Attığı her gol için')}${step('ab', 'Maç primi', money(o.ab || 0), 'Oynadığı her maç için')}${step('rcl', 'Serbest kalma bedeli', o.rcl ? money(o.rcl) : 'Yok', 'Makul bedel oyuncuyu ikna eder; başka kulüp ödeyip alabilir')}
      ${sign && p.tid != null ? `<div class="neg-row"><span><strong>Satıştan pay</strong><small>Satan kulübe ileride %15 pay: bonservis %10 düşer</small></span><button class="btn ${o.cut ? 'primary' : ''}" data-a="neg-cut" data-id="${p.id}" ${s.done ? 'disabled' : ''}>${o.cut ? 'Eklendi' : 'Ekle'}</button></div>
      <label class="neg-row" for="negSwap"><span><strong>Takas</strong><small>Oyuncun bonservisten düşülür (değerinin %90'ı)</small></span><select id="negSwap" data-a="neg-swap" data-id="${p.id}" ${s.done ? 'disabled' : ''}><option value="">Takas yok</option>${swaps.map(q => `<option value="${q.id}" ${o.swap === q.id ? 'selected' : ''}>${esc(q.name)} · ${FM.POS_TR[q.pos]} · ${money(q.value)}</option>`).join('')}</select></label>` : ''}
    </details>`;
  };
  const vNegAdj = acts['neg-adj'];
  acts['neg-adj'] = (d, el) => {
    if (!['gb', 'ab', 'rcl'].includes(d.k)) return vNegAdj(d, el);
    const s = FM.Career.NEG[+d.id], o = s.offer, p = P(+d.id), v = +d.v;
    if (d.k === 'gb') o.gb = Math.max(0, (o.gb || 0) + v * Math.max(5000, Math.round(p.wage * .25 / 5000) * 5000));
    else if (d.k === 'ab') o.ab = Math.max(0, (o.ab || 0) + v * Math.max(2500, Math.round(p.wage * .1 / 2500) * 2500));
    else { const st = Math.round(p.value * .5 / 100000) * 100000 || 100000; o.rcl = o.rcl ? o.rcl + v * st : v > 0 ? Math.round(p.value * 3 / 100000) * 100000 : 0; if (o.rcl < p.value) o.rcl = 0; }
    acts['neg-open-re'](+d.id);
  };
  acts['neg-open-re'] = pid => vNegAdj({ id: pid, k: 'years', v: 0 });   // pencereyi yeniden çizer
  acts['neg-cut'] = d => { const o = FM.Career.NEG[+d.id].offer; o.cut = !o.cut; acts['neg-open-re'](+d.id); };
  acts['neg-swap'] = (d, el) => {
    const o = FM.Career.NEG[+d.id].offer, p = P(+d.id), q = el.value ? P(+el.value) : null;
    if (q && q.ovr < FM.T(p.tid).players.map(P).reduce((s, x) => s + x.ovr, 0) / FM.T(p.tid).players.length - 6) { toast(`${T(p.tid).name}, ${q.name} ile ilgilenmiyor.`, 'bad'); el.value = ''; o.swap = null; }
    else o.swap = q ? q.id : null;
    acts['neg-open-re'](+d.id);
  };

  /* ================= Oyuncu penceresi ekleri: maddeler, not, karşılaştırma, opsiyonlu kiralık ================= */
  const vPm = UI.pmExtra;
  UI.pmExtra = p => {
    const G = FM.G, d = D(), mine = p.tid === G.teamId, cl = [];
    if (p.gb) cl.push(`Gol primi ${money(p.gb)}`); if (p.ab) cl.push(`Maç primi ${money(p.ab)}`); if (p.rcl) cl.push(`Serbest kalma ${money(p.rcl)}`);
    if (p.sellOnTo && !p.sellOnTo.mine) cl.push(`Satıştan pay: %${p.sellOnTo.pct} ${T(p.sellOnTo.tid).name}`);
    if (p.loan && p.loan.opt) cl.push(`Satın alma opsiyonu ${money(p.loan.opt)}${p.optBuy ? ' (kullanıldı)' : ''}`);
    if (p.caps) cl.push(`Milli maç: ${p.caps}`);
    const loanable = !mine && p.tid != null && !p.loan && T(p.tid).players.length > 18 && !T(p.tid).lineup.includes(p.id);
    return (vPm ? vPm(p) : '') + `${cl.length ? `<p class="chips">${cl.map(x => `<span class="chip">${esc(x)}</span>`).join('')}</p>` : ''}
      <div class="pm-tools"><button class="btn ${d.cmp.includes(p.id) ? 'primary' : ''}" data-a="cmp" data-id="${p.id}">${d.cmp.includes(p.id) ? 'Karşılaştırmada ✓' : 'Karşılaştırmaya ekle'}</button>${loanable ? `<button class="btn" data-a="loan-opt" data-id="${p.id}">Opsiyonlu kirala · ${money(Math.round(p.value * .15 / 10000) * 10000)}</button>` : ''}</div>
      <label class="pm-note" for="pnote"><span>Notların</span><textarea id="pnote" data-id="${p.id}" rows="2" maxlength="400" placeholder="Bu oyuncu hakkında not al (yalnızca sen görürsün)">${esc(d.notes[p.id] || '')}</textarea></label>`;
  };
  acts.cmp = (d, el) => { const on = Dp.toggleCmp(+d.id); el.classList.toggle('primary', on); el.textContent = on ? 'Karşılaştırmada ✓' : 'Karşılaştırmaya ekle'; toast(on ? 'Karşılaştırma listesine eklendi (en fazla 4).' : 'Listeden çıkarıldı.'); if (U.view === 'compare') render(true); };
  acts['loan-opt'] = d => { const r = FM.loanIn(+d.id, true); say(r.ok ? { ok: true, msg: r.msg + ' Sezon sonunda satın alma opsiyonun var.' } : r); if (r.ok) { closeModal(); render(true); } };
  let noteT = null;
  document.addEventListener('input', e => { if (e.target.id !== 'pnote' || !FM.G) return; Dp.setNote(+e.target.dataset.id, e.target.value); clearTimeout(noteT); noteT = setTimeout(() => FM.save(), 400); });

  /* ================= Transfer: ek filtreler ve kayıtlı filtreler ================= */
  UI.tfSel = f => `<label class="sp" for="tfAge"><span>Yaş</span><select id="tfAge" data-a="tf-age"><option value="">Hepsi</option>${[19, 21, 23, 25, 28, 31].map(v => `<option value="${v}" ${f.maxAge === v ? 'selected' : ''}>≤ ${v}</option>`).join('')}</select></label><label class="sp" for="tfOvr"><span>Güç</span><select id="tfOvr" data-a="tf-ovr"><option value="">Hepsi</option>${[55, 60, 65, 70, 75, 80].map(v => `<option value="${v}" ${f.minOvr === v ? 'selected' : ''}>≥ ${v}</option>`).join('')}</select></label>`;
  UI.tfExtra = f => {
    const l = D().tfs;
    return `<div class="tf-saved"><span class="muted">Kayıtlı filtreler:</span>${l.map((x, i) => `<span class="tfs"><button class="chip" data-a="tf-load" data-v="${i}">${esc(x.n)}</button><button class="x" data-a="tf-del" data-v="${i}" aria-label="${esc(x.n)} filtresini sil">×</button></span>`).join('') || '<span class="muted">yok</span>'}<button class="btn sm" data-a="tf-save">Bu filtreyi kaydet</button></div>`;
  };
  acts['tf-age'] = (d, el) => { U.tf.maxAge = el.value ? +el.value : null; render(true); };
  acts['tf-ovr'] = (d, el) => { U.tf.minOvr = el.value ? +el.value : null; render(true); };
  acts['tf-save'] = () => {
    const f = U.tf, n = [f.pos !== 'ALL' ? FM.POS_TR[f.pos] : 'Tümü', f.maxAge ? '≤' + f.maxAge + ' yaş' : '', f.minOvr ? '≥' + f.minOvr : '', f.free ? 'serbest' : '', f.afford ? 'bütçe' : ''].filter(Boolean).join(' · ');
    Dp.saveFilter(n, f); toast('Filtre kaydedildi.', 'good'); render(true);
  };
  acts['tf-load'] = d => { const x = D().tfs[+d.v]; if (x) { Object.assign(U.tf, { pos: 'ALL', afford: false, free: false, maxAge: null, minOvr: null }, x.f); render(true); } };
  acts['tf-del'] = d => { D().tfs.splice(+d.v, 1); FM.save(); render(true); };

  /* ================= Karşılaştırma ================= */
  VIEWS.compare = () => {
    const G = FM.G, ps = D().cmp.map(P).filter(Boolean);
    if (!ps.length) return `<section class="card"><h2>Oyuncu karşılaştırma</h2><p class="muted">Bir oyuncunun penceresinden “Karşılaştırmaya ekle” ile en fazla 4 oyuncuyu yan yana koy. Kendi oyuncularını da ekleyebilirsin.</p><button class="btn primary" data-a="tab" data-v="transfer">Transfer pazarına git</button></section>`;
    const kn = p => FM.known(p);
    const rows = [
      ['Kulüp', p => (p.tid != null ? esc(T(p.tid).name) : 'Serbest'), null],
      ['Yaş', p => p.age, p => -p.age], ['Mevki', p => posChip(p.pos) + ' ' + FM.ROLE_TR[p.role], null],
      ['Güç', p => (kn(p) ? p.ovr : FM.est(p).join('–')), p => (kn(p) ? p.ovr : (FM.est(p)[0] + FM.est(p)[1]) / 2)],
      ['Potansiyel', p => (kn(p) ? p.pot : '?'), p => (kn(p) ? p.pot : -1)],
      ...Object.keys(FM.ATTR_TR).map(k => [FM.ATTR_TR[k], p => (kn(p) ? p.a[k] : '?'), p => (kn(p) ? p.a[k] : -1)]),
      ['Maç / gol / asist', p => `${p.apps} / ${p.g} / ${p.as}`, p => p.g * 2 + p.as],
      ['Ort. puan', p => fmtR(FM.avgRating(p)), p => FM.avgRating(p) || 0],
      ['Değer', p => money(p.value), p => p.value], ['Maaş', p => money(p.wage), p => -p.wage],
      ['Bedel', p => (p.tid === G.teamId ? '—' : money(FM.askPrice(p))), p => (p.tid === G.teamId ? null : -FM.askPrice(p))],
      ['Sözleşme', p => (p.tid == null ? '—' : p.con + ' sezon'), null]
    ];
    const body = rows.map(([n, f, sc]) => {
      const vals = sc ? ps.map(sc) : null, best = vals ? Math.max(...vals.filter(v => v != null)) : null;
      return `<tr><th class="l">${n}</th>${ps.map((p, i) => `<td class="${vals && vals[i] === best && vals.filter(v => v === best).length < ps.length && best > -1 ? 'best' : ''}">${f(p)}</td>`).join('')}</tr>`;
    }).join('');
    return `<section class="card"><h2>Oyuncu karşılaştırma <small class="muted">${ps.length}/4</small></h2><div class="scroll"><table class="tbl cmp"><thead><tr><th></th>${ps.map(p => `<th><button class="lnk" data-a="player" data-id="${p.id}">${FM.avatar(p, 44)}<span>${esc(p.name)}</span></button><button class="x" data-a="cmp-del" data-id="${p.id}" aria-label="${esc(p.name)} oyuncusunu çıkar">×</button></th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div><p class="hint">Yeşil hücreler o satırdaki en iyi değeri gösterir. Gücü bilinmeyen oyuncular için scout raporu gerekir.</p></section>`;
  };
  acts['cmp-del'] = d => { Dp.toggleCmp(+d.id); render(true); };

  /* ================= Kadro planlayıcı ================= */
  VIEWS.planner = () => {
    const G = FM.G, pl = Dp.planner(), weak = Dp.weakest(), sug = Dp.suggestBuys(weak, 3);
    const posN = { GK: 'Kaleci', DEF: 'Defans', MID: 'Orta saha', FWD: 'Forvet' };
    const cell = (pos, n) => {
      const l = pl[pos][n], cnt = l.filter(x => !x.y).length, need = Dp.NEED[pos];
      return `<td class="${cnt < need ? 'short' : ''}"><span class="pl-cnt">${cnt}<small>/${need}</small></span><div class="pl-ps">${l.slice(0, 9).map(x => `<button class="pl-p ${x.y ? 'y' : ''} ${x.exp ? 'exp' : ''} ${x.old ? 'old' : ''}" data-a="${x.y ? 'player' : 'player'}" data-id="${x.p.id}" title="${esc(x.p.name)} · ${x.p.age + n} yaş · tahmini güç ${x.o}${x.exp ? ' · sözleşmesi bu sezon biter' : ''}${x.old ? ' · 32 yaş üstü' : ''}${x.y ? ' · U19' : ''}"><b>${x.o}</b>${esc(sn(x.p.name))}${x.exp ? ' <i>⌛</i>' : ''}${x.y ? ' <i>U19</i>' : ''}${x.loan ? ' <i>K</i>' : ''}</button>`).join('')}</div></td>`;
    };
    const exp = me().players.map(P).filter(p => p.con <= 1 && !p.loan).sort((a, b) => b.ovr - a.ovr);
    return `<section class="card"><h2>Kadro planlayıcı</h2><p class="muted">Önümüzdeki iki sezonun derinlik tablosu. Sözleşmesi biten oyuncular sonraki sezonda düşer; gençlerin tahmini gelişimi ve 30 yaş üstü düşüş hesaba katılır.</p>
      <div class="scroll"><table class="tbl planner"><thead><tr><th class="l">Bölge</th>${[0, 1, 2].map(n => `<th>${G.season + n}. sezon${n ? '' : ' (şimdi)'}</th>`).join('')}</tr></thead><tbody>${['GK', 'DEF', 'MID', 'FWD'].map(pos => `<tr class="${pos === weak ? 'weak' : ''}"><th class="l">${posN[pos]}${pos === weak ? '<em>öncelik</em>' : ''}</th>${[0, 1, 2].map(n => cell(pos, n)).join('')}</tr>`).join('')}</tbody></table></div>
      <p class="chips legend"><span class="chip">⌛ sözleşme biter</span><span class="chip old">32+ yaş</span><span class="chip y">U19 adayı</span><span class="chip">K kiralık</span><span class="chip short">kırmızı: eksik derinlik</span></p></section>
      <div class="grid2"><section class="card"><h2>Sözleşmesi bitenler <small class="muted">${exp.length}</small></h2>${exp.length ? `<div class="scroll"><table class="tbl pls">${P_HEAD()}<tbody>${playerRows(exp)}</tbody></table></div>` : '<p class="muted">Bu sezon sözleşmesi bitecek oyuncu yok.</p>'}</section>
      <section class="card"><h2>Takviye önerisi: ${FM.POS_LONG[weak]}</h2>${sug.length ? `<div class="scroll"><table class="tbl pls">${P_HEAD(true)}<tbody>${playerRows(sug, true)}</tbody></table></div>` : '<p class="muted">Bütçene uyan, kadroyu güçlendirecek aday yok. Scout görevi ya da kiralık deneyebilirsin.</p>'}</section></div>`;
  };

  /* ================= Gazete ================= */
  VIEWS.paper = () => {
    const l = D().paper, i = Math.min(U.paperI || 0, Math.max(0, l.length - 1)), x = l[i];
    if (!x) return `<section class="card"><h2>Saha Kenarı Gazetesi</h2><p class="muted">İlk sayı ilk haftanın ardından çıkacak.</p></section>`;
    const dt = FM.fmtDate(x.s, x.w);
    return `<article class="paper ${x.special ? 'special' : ''}"><header class="pp-mast"><span>Sayı ${x.no} · ${dt.d}</span><h1>SAHA KENARI</h1><span>${x.special ? 'Sezon sonu özel sayısı' : 'Haftalık spor gazetesi'}</span></header>
      <h2 class="pp-head">${esc(x.head)}</h2><p class="pp-sub">${esc(x.sub)}</p>
      <div class="pp-cols"><div class="pp-items">${x.items.map(([k, t]) => `<section><h4>${esc(k)}</h4><p>${esc(t)}</p></section>`).join('')}</div>
      <aside class="pp-op">${x.cols.map(([n, r, t]) => `<section><h4>${esc(n)}</h4><small>${esc(r)}</small><p>“${esc(t)}”</p></section>`).join('')}</aside></div>
      <nav class="pp-nav"><button class="btn" data-a="paper-i" data-v="${i + 1}" ${i >= l.length - 1 ? 'disabled' : ''}>‹ Önceki sayı</button><span class="muted">${i + 1} / ${l.length}</span><button class="btn" data-a="paper-i" data-v="${i - 1}" ${i <= 0 ? 'disabled' : ''}>Sonraki sayı ›</button></nav></article>`;
  };
  acts['paper-i'] = d => { U.paperI = Math.max(0, +d.v); render(true); };

  /* ================= Teknik direktör ================= */
  VIEWS.manager = () => {
    const G = FM.G, d = D(), M = d.mgr, st = M.st, lv = Dp.level(), pg = Dp.lvProg(), cap = Dp.skCap(), LIC = Dp.LIC;
    const wp = st.m ? Math.round(st.w / st.m * 100) : 0, nem = d.nem, nemT = nem ? G.teams.find(t => t.coach === nem) : null;
    const tree = Object.keys(Dp.SK).map(k => `<div class="sk"><strong>${Dp.SK[k][0]}</strong><p>${Dp.SK[k][1]}</p><div class="sk-lv">${[1, 2, 3].map(i => `<i class="${i <= M.sk[k] ? 'on' : i <= cap ? '' : 'lock'}" title="${i <= cap ? i + '. seviye' : LIC[i - 1][0] + ' lisansı gerekir'}"></i>`).join('')}</div><button class="btn sm" data-a="learn" data-v="${k}" ${M.pts < 1 || M.sk[k] >= cap ? 'disabled' : ''}>${M.sk[k] >= 3 ? 'Tamamlandı' : M.sk[k] >= cap ? 'Lisans gerekli' : 'Geliştir'}</button></div>`).join('');
    const nx = M.lic + 1;
    const lic = LIC.map((l, i) => `<li class="${i <= M.lic ? 'on' : M.course && M.course.to === i ? 'cur' : ''}"><b>${l[0]}</b><span>${i <= M.lic ? 'Alındı' : M.course && M.course.to === i ? `Kursta: ${M.course.w} hafta kaldı` : `${money(l[1])} · ${l[2]} hafta · itibar ${l[3]}+`}</span></li>`).join('');
    const cos = FM.table().map(r => T(r.id)).filter(t => t.id !== G.teamId).map(t => { const c = d.coaches[t.id] || {}; return `<tr><td class="l"><span class="tm-c">${FM.crest(t, 18)} ${esc(t.name)}</span></td><td class="l">${esc(t.coach || '—')}${t.coach === nem ? ' <em class="nem">ezeli hasım</em>' : ''}</td><td>${c.s != null ? (c.w ? `${c.s}. sezon ${c.w}. hafta` : `${c.s}. sezon başı`) : '—'}</td><td>${Math.round(d.heat[t.coach] || 0)}</td></tr>`; }).join('');
    return `<div class="kpis"><div><span>Seviye</span><b>${lv}</b></div><div><span>İtibar</span><b>${Math.round(M.rep)}</b><small>${Dp.repTxt(M.rep)}</small></div><div><span>Lisans</span><b>${LIC[M.lic][0]}</b></div><div><span>Maç</span><b>${st.m}</b><small>${st.w}G ${st.d}B ${st.l}M · %${wp}</small></div><div><span>Kupa</span><b>${st.tr + d.trophies.length}</b></div></div>
      <section class="card"><h2>${esc(G.manager)} <small class="muted">teknik direktör</small></h2><div class="xpbar" role="progressbar" aria-valuemin="0" aria-valuemax="${pg.need}" aria-valuenow="${pg.cur}" aria-label="Seviye ilerlemesi"><i style="width:${Math.round(pg.cur / pg.need * 100)}%"></i></div><p class="muted">${pg.cur} / ${pg.need} XP · bir sonraki seviyede 1 yetenek puanı. Harcanmamış puan: <b>${M.pts}</b>. Galibiyet 30, beraberlik 12 XP; kupalar ve hedefler çok daha fazlası.</p>
        <p class="muted">Attığı / yediği: ${st.gf} / ${st.ga} · Kulüpler: ${M.clubs.map(c => `${esc(T(c.tid).name)} (${c.from}–${c.to == null ? '' : c.to})`).join(', ')}</p></section>
      <section class="card"><h2>Yetenek ağacı</h2><div class="sks">${tree}</div></section>
      <div class="grid2"><section class="card"><h2>Antrenörlük lisansı</h2><ol class="lic">${lic}</ol>${nx < LIC.length && !M.course ? `<button class="btn primary" data-a="course" ${M.rep < LIC[nx][3] ? 'disabled' : ''}>${LIC[nx][0]} kursuna yazıl · ${money(LIC[nx][1])}</button>${M.rep < LIC[nx][3] ? `<p class="hint">Kurs için itibarın en az ${LIC[nx][3]} olmalı.</p>` : '<p class="hint">Kurs süresince takımın maç gücü %1 düşer. Lisans yetenek ağacında yeni seviyeler açar; yüksek itibar ve A lisansı büyük kulüplerin ilgisini çeker.</p>'}` : ''}</section>
      <section class="card"><h2>Ezeli hasım</h2>${nem ? `<p><b>${esc(nem)}</b> ${nemT ? `· ${esc(nemT.name)}` : '· şu an işsiz'}</p><p class="muted">Karşılaşmalar: ${d.nemRec.w}G ${d.nemRec.d}B ${d.nemRec.l}M. Ona karşı galibiyetler fazladan XP, itibar ve taraftar desteği getirir.</p>` : '<p class="muted">Henüz yok. Basında sana laf atan hocalarla atıştıkça gerginlik birikir; en çok gerildiğin hoca ezeli hasmın olur.</p>'}</section></div>
      <section class="card"><h2>Ligdeki hocalar</h2><div class="scroll"><table class="tbl"><thead><tr><th class="l">Kulüp</th><th class="l">Teknik direktör</th><th>Göreve başlama</th><th>Gerginlik</th></tr></thead><tbody>${cos}</tbody></table></div><p class="hint">Hedefinin çok gerisinde kalan kulüpler hocalarını gönderir; başarılı küçük kulüp hocaları büyüklere transfer olabilir.</p></section>`;
  };
  acts.learn = d => { say(Dp.learn(d.v)); render(true); };
  acts.course = () => { say(Dp.course()); render(true); };

  /* ================= Kariyer: zaman çizelgesi ve hazırlık kupaları ================= */
  const TL_I = { start: '🏁', win: '✅', big: '💥', mil: '🎯', lvl: '⭐', lic: '🎓', title: '🏆', cup: '🏆', euro: '🌍', season: '📅', up: '⬆️', down: '⬇️', sack: '❌', job: '✍️', buy: '💰', sell: '💸', swap: '🔁', nem: '⚔️', winter: '❄️' };
  const vCar = VIEWS.career;
  VIEWS.career = () => {
    const d = D(), tl = d.tl.slice().reverse(), seasons = [...new Set(tl.map(x => x.s))];
    return vCar() + (d.trophies.length ? `<section class="card"><h2>Hazırlık kupaları</h2><p class="chips">${d.trophies.map(x => `<span class="chip on">🏆 ${esc(x.n)} · ${x.s}. sezon</span>`).join('')}</p></section>` : '') +
      `<section class="card"><h2>Kariyer zaman çizelgesi</h2><div class="tline">${seasons.map(s => `<div class="tl-s"><h4>${s}. sezon</h4><ol>${tl.filter(x => x.s === s).map(x => `<li class="tl-${x.k}"><span class="tl-i" aria-hidden="true">${TL_I[x.k] || '•'}</span><span class="tl-w">${x.w}. hf</span><span>${esc(x.t)}</span></li>`).join('')}</ol></div>`).join('')}</div></section>`;
  };

  /* ================= Takım penceresi: kafa kafaya ve hoca ================= */
  UI.tmExtra = t => {
    const G = FM.G, d = D(); if (!d || t.id === G.teamId) return '';
    const h = d.h2h[t.id], nem = t.coach && t.coach === d.nem;
    const hd = h ? `<div class="h2h"><div class="h2h-bar" aria-label="${h.w} galibiyet, ${h.d} beraberlik, ${h.l} mağlubiyet"><i class="w" style="flex:${h.w}"></i><i class="d" style="flex:${h.d}"></i><i class="l" style="flex:${h.l}"></i></div><p><b>${h.w}G ${h.d}B ${h.l}M</b> · goller ${h.gf}–${h.ga}</p><ul>${h.last.map(x => `<li class="${x.gf > x.ga ? 'w' : x.gf < x.ga ? 'l' : 'd'}"><span>${x.s}. sezon ${x.w}. hf · ${x.c === 'cup' ? 'Kupa' : x.c === 'euro' ? 'Kıta' : 'Lig'} · ${x.home ? 'iç saha' : 'deplasman'}</span><b>${x.gf}–${x.ga}</b></li>`).join('')}</ul></div>` : '<p class="muted">Bu rakiple senin dönemindeki ilk karşılaşma olacak.</p>';
    return `<section class="plan h2h-s"><h4>Kafa kafaya <small class="muted">senin dönemin</small></h4>${hd}<p class="muted">Teknik direktör: <b>${esc(t.coach || '—')}</b>${nem ? ' <em class="nem">ezeli hasmın</em>' : ''}</p></section>`;
  };

  /* ================= Klavye kısayolları ================= */
  const KEYS = [['h', 'home', 'Ana sayfa'], ['g', 'inbox', 'Gelen kutusu'], ['k', 'squad', 'Kadro'], ['t', 'tactics', 'Taktik'], ['a', 'training', 'Antrenman'], ['p', 'planner', 'Kadro planlayıcı'], ['l', 'table', 'Lig tablosu'], ['f', 'fixtures', 'Fikstür'], ['m', 'transfer', 'Transfer pazarı'], ['c', 'compare', 'Karşılaştırma'], ['z', 'paper', 'Gazete'], ['y', 'manager', 'Teknik direktör'], ['r', null, 'Son maç raporu'], [' ', null, 'Boşluk: Devam / maça çık'], ['?', null, 'Bu yardım']];
  const keysHtml = () => `<h3>Klavye kısayolları</h3><div class="keys">${KEYS.map(([k, , n]) => `<div><kbd>${k === ' ' ? 'Boşluk' : k.toUpperCase()}</kbd><span>${n}</span></div>`).join('')}<div><kbd>Esc</kbd><span>Pencereyi kapat</span></div></div>`;
  acts.keys = () => modal(keysHtml());
  document.addEventListener('keydown', e => {
    if (!FM.G || e.ctrlKey || e.metaKey || e.altKey) return;
    const tg = e.target; if (tg && (tg.matches('input, textarea, select') || tg.isContentEditable)) return;
    if (!$('match').hidden || ($('pre') && !$('pre').hidden) || ($('press') && !$('press').hidden)) return;
    if (FM.G.phase) return;
    const k = e.key.toLowerCase();
    if (k === '?') { e.preventDefault(); return acts.keys(); }
    if (!$('modal').hidden) return;
    if (k === ' ') { const b = document.querySelector('[data-a="play"]'); if (b && !b.disabled) { e.preventDefault(); b.click(); } return; }
    if (k === 'r') { if (D() && D().rep) acts['rep-open'](); return; }
    const x = KEYS.find(y => y[0] === k && y[1]); if (x) { e.preventDefault(); go(x[1]); }
  });
})();
