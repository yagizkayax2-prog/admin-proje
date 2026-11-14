/* Saha Kenarı — yeni kariyer sihirbazı: 1) veri tabanı kurulumu (ülkeler, lig derinliği, oynanabilir / yalnızca izle),
   2) takım seçme (lig listesi ve kulüp profili), 3) menajer profili. Seçimler FM.newGame(kulüpAnahtarı, ad, kurulum) ile oyuna geçer. */
(function () {
  const UI = FM.ui, { U, $, esc, toast, render, acts } = UI, W = FM.World;
  const flag = cc => { const f = FM.COUNTRIES[cc].f; return `<span class="flag" aria-hidden="true">${f.map(c => `<i style="background:${c}"></i>`).join('')}</span>`; };
  const defSetup = () => ({ countries: { TR: { leagues: [0, 1], mode: 'play' } } });
  const lgsOf = o => W.tiers(o);
  const PRESETS = [
    ['Sadece Türkiye', 'İki lig, en hızlı oyun.', { TR: [2, 'play'] }],
    ['Avrupa\'nın büyükleri', 'Türkiye ve beş büyük lig.', { TR: [2, 'play'], EN: [1, 'play'], ES: [1, 'play'], DE: [1, 'play'], IT: [1, 'play'], FR: [1, 'view'] }],
    ['Dünya turu', 'Her kıtadan ligler; çoğu yalnızca izlenir.', { TR: [2, 'play'], EN: [1, 'play'], ES: [1, 'view'], BR: [1, 'play'], AR: [1, 'view'], JP: [1, 'view'], US: [1, 'view'], EG: [1, 'view'] }]
  ];
  function S() {
    if (!U.ns) U.ns = { step: 'db', setup: defSetup(), lgi: 0, club: 'TR:0', addOpen: false, addCont: 'Avrupa', addSel: {} };
    return U.ns;
  }
  const leagues = () => W.leagues(S().setup);

  /* ---------- 1. Veri tabanı kurulumu ---------- */
  function dbHtml() {
    const N = S(), cs = N.setup.countries, ccs = Object.keys(cs), e = W.estimate(N.setup), over = e.kb > W.LIMIT_KB;
    const rows = ccs.map(cc => { const C = FM.COUNTRIES[cc], o = cs[cc]; return `<tr><td class="l"><span class="db-c">${flag(cc)}<strong>${C.n}</strong>${C.base ? '<small>temel ülke</small>' : ''}</span></td>
      <td><div class="lg-chips">${C.l.map((ln, t) => { const on = lgsOf(o).includes(t), lock = C.base && t === 0; return `<button class="lg-chip ${on ? 'on' : ''}" data-a="db-lg" data-cc="${cc}" data-v="${t}" ${lock ? 'disabled title="Temel lig kaldırılamaz"' : ''} aria-pressed="${on}">${on ? (lock ? '●' : '✓') : '+'} ${esc(ln)}</button>`; }).join('')}</div></td>
      <td><select data-a="db-mode" data-cc="${cc}" aria-label="${C.n} ayarı" ${C.base ? 'disabled' : ''}><option value="play" ${o.mode === 'play' ? 'selected' : ''}>Oynanabilir</option><option value="view" ${o.mode === 'view' ? 'selected' : ''}>Yalnızca izle</option></select></td>
      <td class="r">${C.base ? '' : `<button class="btn icon" data-a="db-del" data-cc="${cc}" aria-label="${C.n} ülkesini kaldır">×</button>`}</td></tr>`; }).join('');
    const ring = { 'Hızlı': 25, 'Dengeli': 55, 'Yavaş': 80, 'Çok yavaş': 100 }[e.speed];
    return `<div class="ns"><header class="ns-head"><button class="btn icon" data-a="to-menu" aria-label="Ana menüye dön">‹</button><div><p class="eyebrow">Yeni kariyer · 1/3</p><h1>Veri tabanı kurulumu</h1></div></header>
      <div class="ns-grid"><aside class="ns-side">
        <section class="card"><h2>Oyunun başlangıç tarihi</h2><p class="ns-date">${FM.fmtDate(1, 0).d} · sezon öncesi</p><p class="muted">Hangi ülkelerin liglerinin kurulacağını seç. Oynanabilir liglerde maçlar tam maç motoruyla oynanır, kulüplerini yönetebilirsin. Yalnızca izlenen liglerde sonuçlar hızlı hesaplanır.</p></section>
        <section class="card"><h2>Hazır kurulumlar</h2><div class="opts">${PRESETS.map((p, i) => `<button class="opt" data-a="db-preset" data-v="${i}"><strong>${p[0]}</strong><span>${p[1]}</span></button>`).join('')}</div></section>
      </aside>
      <section class="card ns-main"><div class="ns-bar"><div class="row"><button class="btn primary" data-a="db-add">Ülke ekle +</button><button class="btn" data-a="db-add-lg">Lig ekle +</button></div><span class="chip">Aktif ligler · ${ccs.reduce((a, cc) => a + lgsOf(cs[cc]).length, 0)}</span></div>
        <h2>Aktif durumdaki ülkeler <small>(${ccs.length})</small></h2>
        <div class="scroll"><table class="tbl db-t"><thead><tr><th class="l">Ülke</th><th class="l">Ligler <small>(eklemek ya da çıkarmak için dokun)</small></th><th class="l">Ayar</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section></div>
      <footer class="ns-foot"><div class="ns-stats"><span>Veri tabanı boyutu <b>${e.players.toLocaleString('tr-TR')} futbolcu · ${e.teams} kulüp</b></span><span class="speed"><i style="--p:${ring}%"></i>Tahmini oyun hızı <b>${e.speed}</b></span><span class="${over ? 'neg-v' : ''}">Kayıt boyutu ≈ <b>${(e.kb / 1024).toFixed(1).replace('.', ',')} MB</b>${over ? ' · tarayıcı kaydı için çok büyük' : ''}</span></div>
        <div class="row"><button class="btn" data-a="to-menu">İptal</button><button class="btn primary" data-a="db-next" ${over ? 'disabled' : ''}>Veri tabanını yükle ›</button></div></footer>
      ${N.addOpen ? addModal() : ''}</div>`;
  }
  function addModal() {
    const N = S(), have = N.setup.countries, list = Object.keys(FM.COUNTRIES).filter(cc => FM.COUNTRIES[cc].cont === N.addCont);
    if (N.addMode === 'lg') return `<div class="ns-modal" role="dialog" aria-modal="true" aria-label="Lig ekle"><div class="card"><h2>Lig ekle</h2>
      <div class="seg wrap">${FM.CONTS.map(c => `<button data-a="db-cont" data-v="${c}" class="${N.addCont === c ? 'on' : ''}">${c}</button>`).join('')}</div>
      <div class="add-lgs">${list.map(cc => { const C = FM.COUNTRIES[cc]; return `<div class="add-lg"><span class="db-c">${flag(cc)}<strong>${C.n}</strong></span>${C.l.map((ln, t) => { const id = 'al-' + cc + t, cur = have[cc] && lgsOf(have[cc]).includes(t), on = N.addSel[cc + ':' + t] != null ? N.addSel[cc + ':' + t] : cur, lock = C.base && t === 0; return `<label class="add-c" for="${id}"><input type="checkbox" id="${id}" data-a="db-pick-lg" data-cc="${cc}" data-v="${t}" ${on ? 'checked' : ''} ${lock ? 'disabled' : ''}><span>${esc(ln)}</span></label>`; }).join('')}</div>`; }).join('')}</div>
      <p class="muted">İşaretlediğin ligler eklenir, işaretini kaldırdıkların çıkarılır. Aynı ülkede iki lig varsa aralarında düşme ve yükselme olur; tek lig varsa olmaz.</p>
      <div class="row end"><button class="btn" data-a="db-add-cancel">İptal</button><button class="btn primary" data-a="db-add-lg-ok">Onayla</button></div></div></div>`;
    return `<div class="ns-modal" role="dialog" aria-modal="true" aria-label="Ülke ekle"><div class="card"><h2>Ülke ekle</h2>
      <div class="seg wrap">${FM.CONTS.map(c => `<button data-a="db-cont" data-v="${c}" class="${N.addCont === c ? 'on' : ''}">${c}</button>`).join('')}</div>
      <div class="add-grid">${list.map(cc => { const on = have[cc] || N.addSel[cc]; return `<label class="add-c ${have[cc] ? 'has' : ''}" for="add-${cc}"><input type="checkbox" id="add-${cc}" data-a="db-pick" data-cc="${cc}" ${on ? 'checked' : ''} ${have[cc] ? 'disabled' : ''}>${flag(cc)}<span>${FM.COUNTRIES[cc].n}</span></label>`; }).join('')}</div>
      <p class="muted">Eklenen ülkeler önce yalnızca birinci ligiyle ve oynanabilir olarak gelir. İkinci ligi tablodan ya da “Lig ekle” ile ekleyebilirsin.</p>
      <div class="row end"><button class="btn" data-a="db-add-cancel">İptal</button><button class="btn primary" data-a="db-add-ok">Onayla</button></div></div></div>`;
  }

  /* ---------- 2. Takım seç ---------- */
  function clubOf(key) { for (const lg of leagues()) { const c = lg.clubs.find(x => x.key === key); if (c) return { c, lg }; } return null; }
  function rivalOf(c) {
    if (c.cc === 'TR') { const i = +c.key.split(':')[1], pr = FM.RIVALS.find(p => p.includes(i)); return pr ? W.clubs('TR')[pr[0] === i ? pr[1] : pr[0]] : null; }
    return c.rivalKey ? W.clubs(c.cc).find(x => x.key === c.rivalKey) : null;
  }
  function detailHtml(key) {
    const hit = clubOf(key); if (!hit) return '<p class="muted">Soldan bir kulüp seç.</p>';
    const { c, lg } = hit, C = FM.COUNTRIES[c.cc], I = c.info, ex = W.expectLabel(lg, c), rv = rivalOf(c), [tr, yo] = W.facName(c.rep, c.tier);
    const cap = Math.round((3000 + Math.max(1, Math.min(5, c.rep - c.tier + 1)) * 7500) / 100) * 100;
    const cups = [`${C.n} Kupası`].concat(c.tier === 0 && ex.pos <= 4 ? ['Kıta Kupası'] : []);
    const third = '#1b2433';
    return `<header class="cd-head" style="--k1:${c.c1}">${FM.crest(c, 56)}<div><h2>${esc(c.name)}</h2><p>Ligi ${ex.pos}. bitireceği tahmin ediliyor</p></div>
        <dl class="cd-meta"><div><dt>Ülke</dt><dd>${flag(c.cc)} ${C.n}</dd></div><div><dt>Yer</dt><dd>${esc(c.city)}</dd></div><div><dt>İtibar</dt><dd>${W.repName(c.rep + (c.tier ? 0 : 1))}</dd></div></dl></header>
      <div class="cd-grid">
        <div><dl class="cd-kv"><div><dt>Kuruluş yılı</dt><dd>${I.founded}</dd></div><div><dt>Lakap</dt><dd>${I.nick}</dd></div></dl>
          <h4>Formalar</h4><div class="kits"><figure>${W.kit(c.c1, c.c2, I.pattern, 'İç saha forması')}<figcaption>İç saha</figcaption></figure><figure>${W.kit(c.c2, c.c1, 0, 'Deplasman forması')}<figcaption>Deplasman</figcaption></figure><figure>${W.kit(third, c.c1, 2, 'Alternatif forma')}<figcaption>Alternatif</figcaption></figure></div></div>
        <div><h4>Yönetim kültürü</h4><ul class="cult">${I.mcult.map(x => `<li>${esc(x)}</li>`).join('')}</ul><h4>Taraftar kültürü</h4><ul class="cult">${I.fcult.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      </div>
      <dl class="cd-facts"><div><dt>Durum</dt><dd>${I.status}</dd></div><div><dt>Başkanın durumu</dt><dd>${I.chair}</dd></div><div><dt>Finans</dt><dd>${W.finName(c.rep - c.tier)}</dd></div>
        <div><dt>Stadyum</dt><dd>${esc(c.stadium)}<small>${cap.toLocaleString('tr-TR')} kişilik</small></dd></div><div><dt>Antrenman tesisleri</dt><dd>${tr}</dd></div><div><dt>Altyapı tesisleri</dt><dd>${yo}</dd></div></dl>
      <div class="cd-row"><h4>Kupa turnuvaları</h4><p class="cd-cups">${cups.map(x => `<span>${x}</span>`).join('')}</p></div>
      <div class="cd-row"><h4>Önemli rakipler</h4>${rv ? `<p class="cd-rv">${FM.crest(rv, 28)}<span><strong>${esc(rv.name)}</strong><small>Ezeli rakip</small></span></p>` : '<p class="muted">Yok</p>'}</div>
      <div class="cd-row"><h4>Yönetim beklentisi</h4><p><b>${ex.lab}</b> · ${lg.name}${lg.mode === 'view' ? ' · <span class="neg-v">bu lig yalnızca izlenebilir, kulübü yönetemezsin</span>' : ''}</p></div>`;
  }
  function teamHtml() {
    const N = S(), lgs = leagues();
    if (N.lgi >= lgs.length) N.lgi = 0;
    const lg = lgs[N.lgi], byC = {};
    lgs.forEach((l, i) => { (byC[l.cc] = byC[l.cc] || []).push([l, i]); });
    const sel = `<select id="ns-lg" data-a="ns-lg" aria-label="Lig">${Object.keys(byC).map(cc => `<optgroup label="${FM.COUNTRIES[cc].n}">${byC[cc].map(([l, i]) => `<option value="${i}" ${i === N.lgi ? 'selected' : ''}>${esc(l.name)}${l.mode === 'view' ? ' (izle)' : ''}</option>`).join('')}</optgroup>`).join('')}</select>`;
    const rows = lg.clubs.map(c => { const ex = W.expectLabel(lg, c), on = N.club === c.key; return `<button class="ts-row ${on ? 'on' : ''}" data-a="ns-club" data-v="${c.key}" aria-pressed="${on}"><i class="radio"></i>${FM.crest(c, 22)}<span class="nm">${esc(c.name)}</span><span class="ex">${ex.lab}</span></button>`; }).join('');
    const pick = clubOf(N.club), can = pick && pick.lg.mode === 'play';
    return `<div class="ns"><header class="ns-head"><button class="btn icon" data-a="ns-back" aria-label="Geri">‹</button><div><p class="eyebrow">Yeni kariyer · 2/3</p><h1>Takım seç</h1></div></header>
      <div class="ts-grid"><aside class="card ts-list"><div class="row"><button class="btn" data-a="ns-rand">Rastgele takım ⤨</button></div>${sel}
        <div class="ts-h"><span>Takım</span><span>Yönetim beklentisi</span></div><div class="ts-rows">${rows}</div></aside>
        <section class="card ts-detail">${detailHtml(N.club)}</section></div>
      <footer class="ns-foot"><button class="btn" data-a="ns-back">‹ Geri</button><button class="btn primary" data-a="ns-mgr" ${can ? '' : 'disabled'}>İleri · Menajer profili ›</button></footer></div>`;
  }

  /* ---------- 3. Menajer profili ---------- */
  function mgrHtml() {
    const N = S(), hit = clubOf(N.club), c = hit.c;
    return `<div class="ns"><header class="ns-head"><button class="btn icon" data-a="ns-back" aria-label="Geri">‹</button><div><p class="eyebrow">Yeni kariyer · 3/3</p><h1>Menajer profili</h1></div></header>
      <section class="card ns-mgr" style="--k1:${c.c1};--k2:${c.c2}"><div class="sg-info">${FM.crest(c, 64)}<div><strong>${esc(c.name)}</strong><span>${esc(hit.lg.name)} · ${W.expectLabel(hit.lg, c).lab}</span></div></div>
        <label for="mgr">Teknik direktör adı</label>
        <div class="row"><input id="mgr" type="text" maxlength="24" placeholder="Adın" autocomplete="off" value="${esc(N.name || '')}"><button class="btn primary big" data-a="start">Kariyere başla</button></div>
        <p class="muted">Veri tabanı: ${Object.keys(N.setup.countries).map(cc => FM.COUNTRIES[cc].n).join(', ')}.</p></section></div>`;
  }

  UI.newScreen = () => { const N = S(); return N.step === 'team' ? teamHtml() : N.step === 'mgr' ? mgrHtml() : dbHtml(); };
  const keep = () => { const y = window.scrollY; render(); window.scrollTo(0, y); };
  Object.assign(acts, {
    'db-lg': d => {
      const N = S(), o = N.setup.countries[d.cc], t = +d.v, cur = lgsOf(o);
      const next = cur.includes(t) ? cur.filter(x => x !== t) : cur.concat(t).sort();
      delete o.depth;
      if (!next.length) { delete N.setup.countries[d.cc]; toast(`${FM.COUNTRIES[d.cc].n} kaldırıldı: hiç ligi kalmadı.`); } else o.leagues = next;
      keep();
    },
    'db-add-lg': () => { const N = S(); N.addOpen = true; N.addMode = 'lg'; N.addSel = {}; keep(); },
    'db-pick-lg': (d, el) => { S().addSel[d.cc + ':' + d.v] = el.checked; },
    'db-add-lg-ok': () => {
      const N = S(), cs = N.setup.countries;
      for (const k in N.addSel) {
        const [cc, t] = k.split(':'), tt = +t, o = cs[cc] || (cs[cc] = { leagues: [], mode: 'play' }), cur = lgsOf(o); delete o.depth;
        o.leagues = (N.addSel[k] ? [...new Set(cur.concat(tt))] : cur.filter(x => x !== tt)).sort();
        if (!o.leagues.length) delete cs[cc];
      }
      N.addOpen = false; keep();
    },
    'db-mode': (d, el) => { S().setup.countries[d.cc].mode = el.value; keep(); },
    'db-del': d => { delete S().setup.countries[d.cc]; keep(); },
    'db-preset': d => { const p = PRESETS[+d.v][2], cs = {}; for (const cc in p) cs[cc] = { leagues: Array.from({ length: p[cc][0] }, (_, i) => i), mode: p[cc][1] }; S().setup.countries = cs; keep(); },
    'db-add': () => { const N = S(); N.addOpen = true; N.addMode = 'cc'; N.addSel = {}; keep(); },
    'db-cont': d => { S().addCont = d.v; keep(); },
    'db-pick': (d, el) => { S().addSel[d.cc] = el.checked; },
    'db-add-cancel': () => { S().addOpen = false; keep(); },
    'db-add-ok': () => { const N = S(); for (const cc in N.addSel) if (N.addSel[cc] && !N.setup.countries[cc]) N.setup.countries[cc] = { leagues: [0], mode: 'play' }; N.addOpen = false; keep(); },
    'db-next': () => { const N = S(); N.step = 'team'; const lg = leagues()[N.lgi] || leagues()[0]; if (!clubOf(N.club)) N.club = lg.clubs[0].key; render(); window.scrollTo(0, 0); },
    'ns-lg': (d, el) => { const N = S(); N.lgi = +el.value; const lg = leagues()[N.lgi]; N.club = lg.clubs.slice().sort((a, b) => b.rep - a.rep)[0].key; keep(); },
    'ns-club': d => { S().club = d.v; keep(); },
    'ns-rand': () => { const N = S(), lgs = leagues().map((l, i) => [l, i]).filter(([l]) => l.mode === 'play'), [lg, i] = lgs[Math.floor(Math.random() * lgs.length)]; N.lgi = i; N.club = lg.clubs[Math.floor(Math.random() * lg.clubs.length)].key; keep(); },
    'ns-mgr': () => { S().step = 'mgr'; render(); window.scrollTo(0, 0); },
    'ns-back': () => { const N = S(); if (N.step === 'mgr') { const el = $('mgr'); if (el) N.name = el.value; } N.step = N.step === 'mgr' ? 'team' : 'db'; render(); window.scrollTo(0, 0); }
  });
  // sihirbazdan menüye dönünce durum sıfırlanır
  const toMenu = acts['to-menu']; acts['to-menu'] = (d, el) => { U.ns = null; if (toMenu) toMenu(d, el); else { U.screen = null; render(); } };
})();
