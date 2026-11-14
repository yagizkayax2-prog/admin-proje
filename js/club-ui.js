/* Saha Kenarı — kulüp çevresinin arayüzü: Takım → Sağlık sekmesi, kulüp sahibi kartı, U19 ligi ve kupası,
   altyapı hocası seçimi, oyuncu penceresinde menajer ve risk bilgisi. */
(function () {
  const UI = FM.ui, { U, esc, toast, render, me, posChip, VIEWS, GROUPS, acts } = UI;
  const P = id => FM.P(id), T = id => FM.T(id), money = FM.money, K = FM.Club;
  const say = r => toast(r.msg, r.ok ? 'good' : 'bad');
  const riskCls = r => (r >= 70 ? 'neg-v' : r >= 45 ? 'warn-v' : 'pos-v');
  const bar = (v, cls) => `<span class="rk-bar ${cls}" role="img" aria-label="%${v}"><i style="width:${v}%"></i></span>`;

  /* ---------- Takım → Sağlık ---------- */
  const team = GROUPS.find(g => g[0] === 'team'); if (team && !team[2].some(x => x[0] === 'medical')) team[2].splice(3, 0, ['medical', 'Sağlık']);
  VIEWS.medical = () => {
    const G = FM.G, ps = me().players.map(P).filter(p => !p.loan || p.loan.own !== G.teamId || p.tid === G.teamId);
    ps.forEach(p => { if (p.risk == null) p.risk = K.riskOf(p); });
    const inj = ps.filter(p => p.inj), hi = ps.filter(p => !p.inj && p.risk >= 60), physio = G.staff ? G.staff.physio : 0;
    const rows = ps.slice().sort((a, b) => (b.inj ? 200 : 0) + b.risk - ((a.inj ? 200 : 0) + a.risk)).map(p => {
      const st = p.inj ? `<b class="neg-v">${esc(p.injT || 'Sakat')}</b> · ${p.inj} hf` : p.rust ? '<span class="warn-v">Maç eksikliği</span>' : p.rest ? '<span class="pos-v">Dinleniyor</span>' : 'Hazır';
      return `<tr><td class="l"><button class="nm link" data-a="player" data-id="${p.id}">${esc(p.name)}</button></td><td>${posChip(p.pos)}</td><td>${p.age}</td><td class="l">${st}</td><td>${Math.round(p.fit)}</td><td>${(p.load || 0).toFixed(1).replace('.', ',')}</td><td class="l">${bar(p.risk, riskCls(p.risk))} <b class="${riskCls(p.risk)}">%${p.risk}</b></td>
        <td>${p.inj ? '' : `<button class="btn sm ${p.rest ? 'primary' : ''}" data-a="cl-rest" data-id="${p.id}" aria-pressed="${!!p.rest}">${p.rest ? 'Dinleniyor' : 'Dinlendir'}</button>`}</td></tr>`;
    }).join('');
    return `<section class="card"><h2>Sağlık ekibi</h2><div class="kpis sm"><div><span>Sakat</span><b class="${inj.length ? 'neg-v' : ''}">${inj.length}</b></div><div><span>Yüksek risk</span><b class="${hi.length ? 'warn-v' : ''}">${hi.length}</b></div><div><span>Fizyoterapist</span><b>${physio}. seviye</b></div><div><span>Antrenman temposu</span><b>${['Hafif', 'Normal', 'Yoğun'][G.training.intensity]}</b></div></div>
      <p class="muted">Risk; kondisyon, yaş, son haftalardaki maç yükü, sakatlık yatkınlığı, sakatlık dönüşü maç eksikliği ve antrenman temposundan hesaplanır. Riski %70'i geçen oyuncu antrenmanda bile sakatlanabilir; maçta da sakatlanma olasılığı artar. Dinlendirilen oyuncu o hafta gelişmez ama kondisyonu hızlı toparlanır.</p></section>
      <section class="card"><div class="scroll"><table class="tbl med"><thead><tr><th class="l">Oyuncu</th><th>Mevki</th><th>Yaş</th><th class="l">Durum</th><th>Kondisyon</th><th>Yük</th><th class="l">Sakatlık riski</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  };
  acts['cl-rest'] = d => { say(K.rest(+d.id)); render(true); };

  /* ---------- oyuncu penceresi: menajer ve risk ---------- */
  const vPm = UI.pmExtra;
  UI.pmExtra = p => {
    const ag = K.agentOf(p), S = K.STYLES[ag.style], G = FM.G;
    const line = `<p class="muted pm-ag">Menajer: <b>${esc(ag.name)}</b> · ${esc(S[0])} (komisyon %${Math.round(S[2] * 100)}) — ${esc(S[1])}</p>`;
    const pre = p.pre != null && p.tid === G.teamId ? `<p class="trait"><b>Ön sözleşme</b> ${esc(T(p.pre).name)} ile anlaştı; sezon sonunda gidecek. Sözleşmesini yenilersen kalır.</p>` : '';
    const risk = p.tid === G.teamId && !p.y ? `<p class="muted">Sakatlık riski: ${bar(p.risk != null ? p.risk : K.riskOf(p), riskCls(p.risk || 0))} <b class="${riskCls(p.risk || 0)}">%${p.risk != null ? p.risk : K.riskOf(p)}</b> · yük ${(p.load || 0).toFixed(1).replace('.', ',')}</p>` : '';
    return line + pre + risk + (vPm ? vPm(p) : '');
  };

  /* ---------- Kulüp: sahip kartı ---------- */
  const vClub = VIEWS.club;
  VIEWS.club = () => {
    const c = K.CL(), o = c.own, O = K.OWN[o.k];
    const hist = c.ownHist.map(h => `<li><span class="nm">${esc(h.name)}</span><span class="muted">${esc(K.OWN[h.k][0])}</span><b>${h.since}–${h.to}. sezon</b></li>`).join('');
    return `<section class="card own"><h2>Kulübün sahibi</h2><p><b>${esc(o.name)}</b> · ${esc(O[0])} · ${o.since}. sezondan beri</p><p class="muted">${esc(O[1])}${O[2] < 0 ? ' Yönetim hedefi normalden 2 sıra yukarıda.' : ''}${O[4] < 1 ? ' Kötü sonuçlarda yönetim güveni daha hızlı düşer.' : ''}</p>${c.bid ? `<p class="trait"><b>Satın alma teklifi</b> ${esc(c.bid.name)} kulübü almak istiyor; kararın gelen kutunda.</p>` : ''}${hist ? `<h3 class="rnd">Önceki sahipler</h3><ul class="rank">${hist}</ul>` : ''}</section>` + vClub();
  };

  /* ---------- Altyapı: U19 ligi, kupa, altyapı hocası ---------- */
  const vYouth = VIEWS.youth;
  VIEWS.youth = () => {
    const G = FM.G, c = K.CL(), tb = K.u19Table(), U = c.u19, yc = c.ycoach, cands = K.ycCandidates();
    const table = tb.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>#</th><th class="l">Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>A</th><th>P</th></tr></thead><tbody>${tb.map((r, i) => `<tr class="${r.id === G.teamId ? 'me' : ''}"><td>${i + 1}</td><td class="l"><span class="u19n">${FM.crest(T(r.id), 18)} ${esc(T(r.id).name)} U19</span></td><td>${r.pl}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf - r.ga}</td><td><b>${r.pts}</b></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">U19 ligi ilk haftadan sonra başlar.</p>';
    const last = U && U.last.length ? `<p class="muted">Son hafta: ${U.last.filter(x => x[0] === G.teamId || x[1] === G.teamId).map(x => `${esc(T(x[0]).name)} ${x[2]}–${x[3]} ${esc(T(x[1]).name)}`).join('') || '—'}</p>` : '';
    const cup = U && U.cup ? `<h3 class="rnd">U19 Kupası</h3><p>${U.cup.lines.map(esc).join('<br>')}</p><p><b>Şampiyon: ${esc(T(U.cup.w).name)}</b></p>` : '<p class="muted">U19 Kupası 19. haftada, ligin ilk 8 takımıyla oynanır. Kazanırsan gençlerin potansiyeli artar.</p>';
    const ycCard = `<section class="card"><h2>Altyapı hocası</h2><p><b>${esc(yc.name)}</b> · ${esc(K.YC_STYLE[yc.style][0])} · seviye ${yc.lv}</p><p class="muted">${yc.style === 'zihinsel' ? 'Gençlerin potansiyelini yavaş yavaş yükseltir.' : `Gençlerin ${K.YC_STYLE[yc.style][1].map(k => FM.ATTR_TR[k].toLocaleLowerCase('tr')).join(' ve ')} özelliklerini her hafta geliştirir.`} Seviye arttıkça etki büyür.</p>
      ${cands.length ? `<h3 class="rnd">Adaylar (bu sezon)</h3><ul class="rank">${cands.map((x, i) => `<li><span class="nm">${esc(x.name)} <small class="muted">${esc(K.YC_STYLE[x.style][0])} · seviye ${x.lv}</small></span><button class="btn sm" data-a="cl-yc" data-v="${i}">İşe al · ${money(x.cost)}</button></li>`).join('')}</ul>` : ''}</section>`;
    return `<div class="grid2"><section class="card"><h2>U19 ligi <small>${G.season}. sezon</small></h2>${table}${last}${cup}</section>${ycCard}</div>` + vYouth();
  };
  acts['cl-yc'] = d => { say(K.hireYc(+d.v)); render(true); };
})();
