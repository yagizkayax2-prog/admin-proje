/* Saha Kenarı — ek özelliklerin arayüzü: başkan kartı, inşaat durumu, milli takım, haftanın 11'i ve haftanın golü */
(function () {
  const { VIEWS, acts, esc, posChip, fmtR, gauge, render, toast } = FM.ui;
  const P = id => FM.P(id), T = id => FM.T(id), money = FM.money, E = () => FM.Ext.X();
  const me = () => T(FM.G.teamId);

  function presCard() {
    const x = E(), pr = x.pres, ty = FM.PRES_T[pr.type];
    return `<section class="card ex-pres"><h2>Başkan</h2><div class="pres"><div class="pa">${esc(pr.name[0])}</div><div><strong>${esc(pr.name)}</strong> <span class="chip">${ty[0]}</span>
      <p class="muted">${ty[1]} ${pr.since}. sezondan beri görevde; seçimler iki sezonda bir yapılır.</p></div></div>
      ${x.closed ? '<p class="trait"><b>Disiplin cezası</b> Sonraki iç saha maçında tribünlerin bir bölümü kapalı; seyirci yaklaşık %30 az olacak.</p>' : ''}
      ${x.disc ? `<p class="muted">Bu sezon tribün olayı: ${x.disc}/3. Üçüncüde kapalı tribün cezası gelir.</p>` : ''}</section>`;
  }
  function buildCard() {
    const b = E().build; if (!b) return '';
    return `<section class="card ex-build"><h2>İnşaat sürüyor</h2><p><b>${esc(FM.Ext.facName(b.k))}</b> ${b.to}. seviyeye çıkıyor · ${b.w} hafta kaldı${b.k === 'stadium' ? ' · kapasite geçici olarak %25 düşük' : ''}. Aynı anda tek inşaat yürütülür.</p><div class="conf ok"><i style="width:${Math.round((b.total - b.w) / b.total * 100)}%"></i></div></section>`;
  }
  function weekCards() {
    const G = FM.G, x = E(), tw = x.totw, gw = x.gotw;
    const a = tw ? `<section class="card"><h2>Haftanın 11'i <small>${tw.s}. sezon ${tw.w + 1}. hafta</small></h2><div class="totw">${tw.xi.map(e => `<button class="tw ${e.tid === G.teamId ? 'mine' : ''}" data-a="player" data-id="${e.pid}">${posChip(e.pos)}<span><strong>${esc(e.name)}</strong><small>${esc(e.team)}</small></span><b>${fmtR(e.r)}</b></button>`).join('')}</div></section>` : '';
    const b = gw ? `<section class="card"><h2>Haftanın golü <small>taraftar oylaması</small></h2><div class="gotw">${gw.cands.map((c, i) => `<div class="gw ${c.mine ? 'mine' : ''} ${gw.voted === i ? 'voted' : ''}"><div><strong>${esc(c.name)}</strong><small>${esc(c.team)} · ${esc(c.desc)}</small></div><div class="gw-bar"><i style="width:${c.pct}%"></i><b>%${c.pct}</b></div>${gw.voted == null ? `<button class="btn" data-a="ex-vote" data-v="${i}">Oy ver</button>` : ''}</div>`).join('')}</div></section>` : '';
    return a + b;
  }

  const vSocial = VIEWS.social; VIEWS.social = () => weekCards() + vSocial();
  const vCareer = VIEWS.career; VIEWS.career = () => vCareer() + `<section class="card"><h2>Milli takım</h2><p class="muted">Milli takım görevi, aday kadro ve maç sonuçları artık Dünya → Ülke sekmesinde.</p><button class="btn" data-a="tab" data-v="country">Ülke sekmesine git</button></section>`;
  const vClub = VIEWS.club; VIEWS.club = () => { const h = vClub(); return presCard() + buildCard() + h; };
  if (VIEWS.facilities) { const vFac = VIEWS.facilities; VIEWS.facilities = () => buildCard() + vFac(); }
  acts['ex-vote'] = d => { FM.Ext.voteGoal(+d.v); toast('Oyun kaydedildi.'); render(true); };
})();
