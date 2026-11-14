/* Saha Kenarı — kulüp çevresi: oyuncu menajerleri (komisyon, tehdit, ön sözleşme), kulüp sahipliği (sahip tipleri,
   satın alma teklifleri), sağlık ekibi (sakatlık riski, yük yönetimi, dinlendirme), altyapı derinliği (U19 ligi, U19 Kupası,
   altyapı hocası). FM.Career kancalarını sarar; veriler G.cl altında durur. */
(function () {
  const { pick, clamp, wpick } = FM.util;
  const R = Math.random, P = id => FM.P(id), T = id => FM.T(id), G_ = () => FM.G, money = FM.money;
  const C = FM.Career, base = { ...C };
  const me = () => T(G_().teamId);
  const r10k = v => Math.round(v / 10000) * 10000;
  const hash = n => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; return h >>> 0; };
  const idle = () => FM.World2 && FM.World2.idle();

  /* ================= Menajerler ================= */
  const AG_FIRST = ['Cem', 'Murat', 'Levent', 'Ayla', 'Serkan', 'Derya', 'Kaan', 'Nil', 'Jorge', 'Paolo', 'Mark', 'Sophie', 'Hans', 'Rui', 'Dimitri', 'Karim'];
  const AG_LAST = ['Aksoy', 'Tekin', 'Ural', 'Mendes', 'Raiola', 'Becker', 'Duarte', 'Varga', 'Lambert', 'Costa', 'Okoye', 'Barros', 'Yalın', 'Ferrer', 'Novak', 'Haddad'];
  const STYLES = {
    makul: ['Makul', 'Uzlaşmacı; komisyonu düşük, pazarlığı kolay.', .04, 1],
    sert: ['Sert pazarlıkçı', 'Maaşı zorlar, oyuncusunu başka kulüplere pazarlar.', .07, 1.12],
    acgozlu: ['Açgözlü', 'Yüksek komisyon ister, her fırsatta zam talep eder.', .11, 1.18],
    sadik: ['Kulübe yakın', 'Oyuncusunu kulübünde tutmak ister; ön sözleşmeye pek yanaşmaz.', .05, .97]
  };
  function CL() {
    const G = G_(); if (!G) return null;
    const c = G.cl || (G.cl = {});
    if (!c.agents) { c.agents = []; for (let i = 0; i < 18; i++) c.agents.push({ id: i, name: AG_FIRST[i % AG_FIRST.length] + ' ' + AG_LAST[(i * 7) % AG_LAST.length], style: ['makul', 'makul', 'sert', 'acgozlu', 'sadik', 'sert'][i % 6], rel: 50 }); }
    if (!c.own) c.own = newOwner(me().rep >= 4 ? 'uye' : pick(['uye', 'isinsani']));
    if (!c.ownHist) c.ownHist = [];
    if (!c.u19) c.u19 = null;
    if (!c.ycoach) c.ycoach = { name: 'Hüseyin Çakır', style: 'teknik', lv: 1 };
    return c;
  }
  const agentOf = p => { const c = CL(); return c.agents[hash(p.id) % c.agents.length]; };
  const agentFee = p => STYLES[agentOf(p).style][2];
  // menajerin maaş talebi çarpanı (sözleşme pazarlığında)
  const wageMul = p => STYLES[agentOf(p).style][3];
  function agentWeek() {
    const G = G_(), c = CL(), mine = me().players.map(P).filter(p => !p.loan);
    // tehdit: değerli, sözleşmesi azalan oyuncunun sert/açgözlü menajeri zam ister
    if (G.week % 3 === 1 && R() < .5) {
      const cand = mine.filter(p => p.ovr >= FM.teamQ(me()) && p.con <= 2 && !p.agAsk && ['sert', 'acgozlu'].includes(agentOf(p).style));
      if (cand.length) {
        const p = pick(cand), ag = agentOf(p), suitor = pick(G.teams.filter(t => t.id !== G.teamId && t.div !== 2 && t.rep >= me().rep - 1)) || pick(G.teams.filter(t => t.id !== G.teamId));
        const nw = Math.round(p.wage * (1.15 + R() * .15) / 100) * 100; p.agAsk = G.season;
        FM.mail({ cat: 'TRANSFER', kind: 'x', sub: 'clAgent', pid: p.id, nw, tid: suitor.id, from: `Menajer ${ag.name}`, title: `${p.name}'in menajeri zam istiyor`,
          body: `${ag.name} (${STYLES[ag.style][0]}): "${suitor.name} oyuncumla ilgileniyor. ${p.name} burada mutlu ama haftalık ${money(nw)} bekliyoruz. Aksi hâlde başka seçenekleri konuşmak zorunda kalırız."`, opts: [`Zammı ver (${money(nw)})`, 'Reddet'] });
      }
    }
    // ön sözleşme: sözleşmesi bitmek üzere olan oyuncu başka kulüple anlaşabilir
    if (G.week === 16) for (const p of mine) {
      if (p.con > 1 || p.pre || agentOf(p).style === 'sadik' || R() > (agentOf(p).style === 'sert' ? .45 : .2)) continue;
      const club = pick(G.teams.filter(t => t.id !== G.teamId && t.div !== 2 && FM.budgetOf(t) > p.value * .5)); if (!club) continue;
      p.pre = club.id;
      FM.mail({ cat: 'TRANSFER', from: `Menajer ${agentOf(p).name}`, pid: p.id, title: `${p.name}, ${club.name} ile ön sözleşme imzaladı`, body: `${p.name}'in sözleşmesi sezon sonunda bitiyor ve ${club.name} ile ön sözleşme imzaladı. Sezon bitmeden sözleşmesini yenilersen ön sözleşme geçersiz olur.` });
    }
  }

  /* ================= Kulüp sahipliği ================= */
  const OWN = {
    uye: ['Üye kulübü', 'Kulüp üyelerine ait; sabırlı ama bütçe kısıtlı.', 0, 1, 1],
    isinsani: ['Yerel iş insanı', 'Şehrin tanınmış iş insanı; kulübe para koyar ama sonuç ister.', 0, 1.15, .8],
    yatirimci: ['Yatırım grubu', 'Kâr odaklı; oyuncu satarak para kazanmayı sever, harcamada temkinli.', 0, .9, 1],
    fon: ['Devlet destekli fon', 'Çok zengin ve çok sabırsız; şampiyonluk bekler.', -2, 1.6, .55]
  };
  const OWN_NAMES = { uye: ['Kulüp Üyeleri Derneği'], isinsani: ['Kaya Holding', 'Demir Grup', 'Aslan Yatırım', 'Yücel İnşaat'], yatirimci: ['Northgate Capital', 'Atlas Partners', 'Meridian Sports Group'], fon: ['Gulf Sports Fund', 'Crescent Investment Authority', 'Orient Fund'] };
  function newOwner(k) { return { k, name: pick(OWN_NAMES[k]), since: G_() ? G_().season : 1 }; }
  const ownExp = () => { const c = G_() && G_().cl; return c && c.own ? OWN[c.own.k][2] : 0; };
  function takeoverCheck() {
    const G = G_(), c = CL(); if (G.week !== 18 || c.bid || G.season < 2 || R() > .22) return;
    const k = pick(['isinsani', 'yatirimci', 'fon', 'fon'].filter(x => x !== c.own.k)), o = newOwner(k);
    c.bid = { ...o, w: G.week };
    FM.mail({ cat: 'KULÜP', kind: 'x', sub: 'clBid', from: 'Yönetim kurulu', title: `Satın alma teklifi: ${o.name}`, body: `${o.name} (${OWN[k][0]}) kulübü satın almak istiyor. ${OWN[k][1]} Yönetim kurulu senin görüşünü soruyor; teknik direktörün tavrı oylamayı etkileyecek.`, opts: ['Satışı destekle', 'Karşı çık', 'Yorum yapma'] });
  }
  function resolveBid(support) {
    const G = G_(), c = CL(), b = c.bid; if (!b) return '';
    const p = clamp(.5 + (support === 0 ? .25 : support === 1 ? -.3 : 0) + (G.board - 50) / 300, .1, .9);
    c.bid = null;
    if (R() < p) {
      c.ownHist.push({ ...c.own, to: G.season }); c.own = { k: b.k, name: b.name, since: G.season };
      const inj = b.k === 'fon' ? 25000000 + R() * 25000000 : b.k === 'isinsani' ? 6000000 + R() * 6000000 : b.k === 'yatirimci' ? 3000000 : 0;
      if (inj) { G.fin.balance += r10k(inj); if (C.money) C.money('owner', r10k(inj)); }
      G.board = clamp(G.board + (support === 0 ? 10 : support === 1 ? -15 : 0), 0, 100);
      FM.news(`${b.name} kulübün yeni sahibi oldu!${inj ? ` Transfer bütçesine ${money(r10k(inj))} eklendi.` : ''} Yeni sahip ${OWN[b.k][2] < 0 ? 'çok daha yüksek bir hedef koydu' : 'hedefleri gözden geçiriyor'}.`, 'club');
      return support === 1 ? 'Karşı çıktın ama satış gerçekleşti. Yeni sahip seni yakından izleyecek.' : 'Satış gerçekleşti.';
    }
    if (support === 0) G.board = clamp(G.board - 4, 0, 100);
    FM.news(`${b.name}'in satın alma teklifi reddedildi. Kulüp ${c.own.name} yönetiminde kalıyor.`, 'club');
    return 'Satış gerçekleşmedi.';
  }
  function ownerWeek() {
    const G = G_(), c = CL(), o = c.own, t = me(), pos = FM.table(t.div).findIndex(r => r.id === G.teamId) + 1, exp = FM.expectation(t);
    if (G.week >= 6 && pos > exp + 1) G.board = clamp(G.board - (1 / OWN[o.k][4] - 1) * 1.5, 0, 100);   // sabırsız sahip güveni daha hızlı düşürür
    if (o.k === 'isinsani' && G.week === 20 && R() < .15) { const cut = r10k(1000000 + R() * 2000000); G.fin.balance -= cut; FM.mail({ cat: 'MALİYE', from: o.name, title: 'Sahibin şirketi zor durumda', body: `${o.name} kendi şirketindeki sorunlar nedeniyle kulübe söz verdiği ${money(cut)} desteği geri çekti.` }); }
  }

  /* ================= Sağlık ekibi ================= */
  function riskOf(p) {
    const G = G_(), physio = G.staff ? G.staff.physio : 0;
    const r = (100 - p.fit) * .6 + Math.max(0, p.age - 28) * 4 + (p.trait === 'glass' ? 18 : p.trait === 'iron' ? -12 : 0) + (p.load || 0) * 14 + (p.rust ? 15 : 0) + [0, 4, 15][G.training ? G.training.intensity : 1] - physio * 4 - (p.rest ? 15 : 0);
    return Math.round(clamp(r, 0, 100));
  }
  function medWeek() {
    const G = G_(), mine = me().players.map(P);
    for (const p of mine) {
      const played = (p.apps || 0) > (p._apw || 0); p._apw = p.apps || 0;
      p.load = Math.round(((p.load || 0) * .55 + (played ? 1 : 0)) * 100) / 100;
      if (p.rest) { p.fit = Math.min(100, p.fit + 12); p.rest = 0; }
      p.risk = riskOf(p);
      if (!p.inj && p.risk >= 70 && R() < .05 + (p.risk - 70) * .004) { const ty = FM.injure(p); FM.news(`Aşırı yüklenme: ${p.name} antrenmanda sakatlandı (${ty}, ${p.inj} hafta). Sağlık ekibi önceden uyarmıştı.`, 'bad', { pid: p.id }); }
    }
    const hi = mine.filter(p => !p.inj && p.risk >= 60);
    if (hi.length && G.week % 2 === 0) FM.mail({ cat: 'KADRO', from: 'Sağlık ekibi', title: `Sakatlık riski yüksek: ${hi.length} oyuncu`, body: `Yük ve yorgunluk nedeniyle riskli görünenler: ${hi.map(p => `${p.name} (%${p.risk})`).join(', ')}. Takım → Sağlık sekmesinden dinlendirebilirsin.` });
  }
  function rest(pid) {
    const p = P(pid); if (!p || p.tid !== G_().teamId) return { ok: false, msg: 'Yalnız kendi oyuncunu dinlendirebilirsin.' };
    if (p.inj) return { ok: false, msg: `${p.name} zaten sakat; tedavi sürüyor.` };
    p.rest = p.rest ? 0 : 1; p.risk = riskOf(p); FM.save();
    return { ok: true, msg: p.rest ? `${p.name} bu hafta antrenmana çıkmayacak, yenilenme çalışması yapacak.` : `${p.name} normal antrenmana döndü.` };
  }

  /* ================= Altyapı derinliği ================= */
  const YC_STYLE = { teknik: ['Teknisyen', ['pas', 'sho']], fizik: ['Atletizm hocası', ['pac', 'phy']], savunma: ['Savunma hocası', ['def', 'phy']], zihinsel: ['Mentör', []] };
  const YC_NAMES = ['Hüseyin Çakır', 'Erdal Sönmez', 'Nuri Kalkan', 'Gökhan Tuna', 'Sinan Avcı', 'Tamer Oral', 'Ufuk Ateş', 'Bülent Sezgin'];
  function ycCandidates() {
    const c = CL(); if (!c.ycCand || c.ycCand.s !== G_().season) c.ycCand = { s: G_().season, l: [0, 1, 2].map(i => { const st = pick(Object.keys(YC_STYLE)), lv = 1 + Math.floor(R() * 5); return { name: pick(YC_NAMES.filter(n => n !== CL().ycoach.name)), style: st, lv, cost: lv * 250000 }; }) };
    return c.ycCand.l;
  }
  function hireYc(i) {
    const G = G_(), c = CL(), cand = ycCandidates()[i]; if (!cand) return { ok: false, msg: 'Aday bulunamadı.' };
    if (G.fin.balance < cand.cost) return { ok: false, msg: 'Bütçe yetersiz.' };
    G.fin.balance -= cand.cost; if (C.money) C.money('staff', cand.cost); c.ycoach = { name: cand.name, style: cand.style, lv: cand.lv }; c.ycCand.l.splice(i, 1); FM.save();
    return { ok: true, msg: `${cand.name} altyapı hocası oldu (${YC_STYLE[cand.style][0]}, seviye ${cand.lv}).` };
  }
  function ycWeek() {
    const G = G_(), yc = CL().ycoach;
    for (const id of G.youth) {
      const p = P(id); if (!p || p.pos === 'GK' && yc.style !== 'zihinsel') continue;
      if (yc.style === 'zihinsel') { if (R() < .02 * yc.lv && p.pot < 92) p.pot++; continue; }
      if (R() < .07 * yc.lv) { const k = pick(YC_STYLE[yc.style][1]); p.a[k] = Math.min(99, p.a[k] + 1); FM.refresh(p); }
    }
  }
  /* U19 ligi: kullanıcının liginin 12 kulübü; rakiplerin gücü itibar ve altyapı tesisinden */
  function u19Init() {
    const G = G_(), c = CL(), ids = FM.table(me().div).map(r => r.id);
    c.u19 = { s: G.season, rows: ids.map(id => ({ id, pl: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 })), cup: null, last: [] };
  }
  const u19Str = id => { const G = G_(); if (id === G.teamId) { const ys = G.youth.map(P).filter(Boolean); return ys.length ? ys.reduce((a, p) => a + p.ovr, 0) / ys.length + CL().ycoach.lv * .6 : 40; } const t = T(id); return 44 + t.rep * 2 + (t.fac ? t.fac.youth : 1) * 1.5 - FM.tierOf(t) * 2; };
  const pois = l => { let k = 0, p = 1; const L = Math.exp(-l); do { k++; p *= R(); } while (p > L && k < 10); return k - 1; };
  function u19Game(h, a) { const sh = u19Str(h), sa = u19Str(a); return [pois(1.45 * Math.pow(sh / sa, 4)), pois(1.2 * Math.pow(sa / sh, 4))]; }
  function u19Week() {
    const G = G_(), c = CL(); if (!c.u19 || c.u19.s !== G.season) u19Init();
    const U = c.u19, ids = U.rows.map(r => r.id).sort((a, b) => a - b), n = ids.length; if (n < 2) return;
    // dairesel eşleşme: her hafta farklı rakipler
    const rot = ids.slice(1), k = G.week % (n - 1), order = [ids[0], ...rot.slice(k), ...rot.slice(0, k)];
    U.last = [];
    for (let i = 0; i < n / 2; i++) {
      const h = order[i], a = order[n - 1 - i], [gh, ga] = u19Game(h, a), rh = U.rows.find(r => r.id === h), ra = U.rows.find(r => r.id === a);
      rh.pl++; ra.pl++; rh.gf += gh; rh.ga += ga; ra.gf += ga; ra.ga += gh;
      if (gh > ga) { rh.w++; ra.l++; rh.pts += 3; } else if (gh < ga) { ra.w++; rh.l++; ra.pts += 3; } else { rh.d++; ra.d++; rh.pts++; ra.pts++; }
      U.last.push([h, a, gh, ga]);
    }
    // eski U19 sayacı lig tablosuyla aynı kaynaktan
    const mine = U.rows.find(r => r.id === G.teamId), lg = U.last.find(x => x[0] === G.teamId || x[1] === G.teamId);
    if (mine && G.u19) { G.u19.w = mine.w; G.u19.d = mine.d; G.u19.l = mine.l; if (lg) G.u19.last = lg[0] === G.teamId ? `${lg[2]}–${lg[3]}` : `${lg[3]}–${lg[2]}`; }
    if (G.week === 19) u19Cup();
  }
  const u19Table = () => { const U = CL().u19; return U ? U.rows.slice().sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf) : []; };
  function u19Cup() {
    const G = G_(), c = CL(), U = c.u19, ids = u19Table().slice(0, 8).map(r => r.id); if (ids.length < 8) return;
    const lines = []; let alive = ids;
    for (const rn of ['Çeyrek final', 'Yarı final', 'Final']) {
      const nx = [];
      for (let i = 0; i < alive.length / 2; i++) { const h = alive[i], a = alive[alive.length - 1 - i]; let [x, y] = u19Game(h, a); let w = x > y ? h : x < y ? a : (R() < .5 ? h : a); nx.push(w); lines.push(`${rn}: ${T(h).name} ${x}–${y} ${T(a).name}${x === y ? ' (pen. ' + T(w).name + ')' : ''}`); }
      alive = nx;
    }
    U.cup = { w: alive[0], lines };
    const won = alive[0] === G.teamId, inIt = ids.includes(G.teamId);
    if (won) { for (const id of G.youth) { const p = P(id); if (p) { p.pot = Math.min(95, p.pot + 2); p.mor = 90; } } G.fans = clamp(G.fans + 2, 0, 100); }
    FM.mail({ cat: 'KULÜP', from: 'Altyapı koordinatörü', title: won ? 'U19 Kupası bizim!' : 'U19 Kupası tamamlandı', body: `${inIt ? '' : 'U19 takımımız ilk 8\'e giremediği için turnuvaya katılamadı. '}${lines.join('\n')}\n\nŞampiyon: ${T(alive[0]).name}.${won ? ' Gençlerin özgüveni tavan: potansiyelleri arttı.' : ''}` });
  }

  /* ================= kancalar ================= */
  C.ensure = () => { base.ensure && base.ensure(); CL(); };
  C.newGame = () => { base.newGame && base.newGame(); CL(); };
  C.endWeek = () => {
    base.endWeek && base.endWeek(); if (!G_() || idle()) return;
    CL(); agentWeek(); takeoverCheck(); ownerWeek(); medWeek(); u19Week(); ycWeek();
  };
  C.newSeason = () => {
    base.newSeason && base.newSeason(); const G = G_(); if (idle()) return;
    // ön sözleşmeliler yeni kulüplerine gider
    for (const id of G.free.slice()) { const p = P(id); if (p && p.pre != null && T(p.pre)) { G.free = G.free.filter(x => x !== id); FM.addToTeam(p, T(p.pre)); p.con = 3; FM.autoPick(T(p.pre)); FM.news(`${p.name}, ön sözleşme imzaladığı ${T(p.pre).name} takımına katıldı.`, 'info'); p.pre = null; } }
    for (const id in G.players) { const p = G.players[id]; if (p.pre != null && p.tid === G.teamId && p.con > 1) p.pre = null; p.agAsk = 0; }
    u19Init();
  };
  C.jobChange = t => { base.jobChange && base.jobChange(t); const c = CL(); c.own = newOwner(t.rep >= 4 ? 'uye' : pick(['uye', 'isinsani', 'yatirimci'])); c.ownHist = []; c.bid = null; u19Init(); };
  C.decide = (m, i) => {
    if (m.sub === 'clAgent') {
      const p = P(m.pid); if (!p || p.tid !== G_().teamId) return 'Oyuncu artık kadroda değil.';
      if (i === 0) { p.wage = m.nw; p.mor = clamp(p.mor + 8, 20, 100); agentOf(p).rel = clamp(agentOf(p).rel + 10, 0, 100); return `${p.name}'in maaşı ${money(m.nw)} oldu. Menajeri memnun.`; }
      p.mor = clamp(p.mor - 12, 20, 100); agentOf(p).rel = clamp(agentOf(p).rel - 15, 0, 100);
      if (R() < .35 && p.con <= 1) { p.pre = m.tid; return `Reddettin. Menajer ${agentOf(p).name}, ${p.name} için ${T(m.tid).name} ile ön sözleşme imzalattı.`; }
      return `Reddettin. ${p.name}'in morali düştü.`;
    }
    if (m.sub === 'clBid') return resolveBid(i);
    return base.decide ? base.decide(m, i) : undefined;
  };
  // sözleşme yenilenince ön sözleşme düşer; menajer tipine göre maaş talebi
  const coreRenew = FM.renew;
  FM.renew = (pid, terms) => { const r = coreRenew(pid, terms), p = P(pid); if (r.ok && p) p.pre = null; return r; };
  const coreTerms = FM.renewTerms;
  FM.renewTerms = p => { const t = coreTerms(p); t.wage = Math.round(t.wage * wageMul(p) / 100) * 100; return t; };
  // yönetim beklentisine sahip etkisi
  if (FM.Ext) { const e0 = FM.Ext.expAdj; FM.Ext.expAdj = () => e0() + ownExp(); }
  // antrenmanda dinlenen oyuncu gelişmez
  C.trainMult = p => (p.rest ? .01 : base.trainMult ? base.trainMult(p) : 1);

  FM.Club = Object.assign(FM.Club || {}, { CL, agentOf, agentFee, STYLES, OWN, riskOf, rest, ycCandidates, hireYc, YC_STYLE, u19Table, u19Str });   // career.js'teki seatFn korunur
})();
