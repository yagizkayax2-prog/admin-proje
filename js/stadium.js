/* Saha Kenarı — 2D stadyum: takım değerine göre 5 kademe, seyirci, koreografi (kart gösterisi, dev pankart, bayrak, meşale), hava efektleri */
(function () {
  const TIERS = ['', 'Mahalle Sahası', 'İlçe Stadı', 'Şehir Stadı', 'Arena', 'Dev Arena'];
  const NEUTRAL = ['#e8d5b7', '#c9a27e', '#3a4a66', '#d9dde4', '#7b5a43', '#2d3648'];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* o: { W, dpr, tier, home, away, fill (0-1), wx: {t, n} } */
  function create(o) {
    const W = o.W, dpr = o.dpr || 1, t = o.tier, c = Math.max(4.5, W * .0075);
    const rows = [0, 2, 3, 4, 5, 6][t], cols = Math.min(rows, 5);
    const gd = W * .028, mT = c * 6 + (t >= 5 ? 12 : 6) + 12, mB = mT, mx = c * 5 + gd + 12;
    const pw = W - 2 * mx, ph = pw * .62, H = Math.round(mT + ph + mB);
    const geom = { x0: mx, y0: mT, x1: W - mx, y1: mT + ph, gd, c };
    const snow = o.wx && o.wx.t === 'snow';
    const seats = [], empty = [], stands = [];
    const home = o.home, away = o.away;
    const homePal = [home.c1, home.c1, home.c1, home.c2, home.c2, ...NEUTRAL], awayPal = [away.c1, away.c1, away.c2, ...NEUTRAL.slice(0, 2)];
    const topStand = t >= 2, sideStands = t >= 3, full = t >= 4;
    const hs = topStand ? 'T' : 'B'; // koreografinin yapıldığı tribün

    function addStand(id, x, y, nx, ny) {
      stands.push({ id, x, y, w: nx * c, h: ny * c });
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const u = id === 'L' || id === 'R' ? j / Math.max(1, ny - 1) : i / Math.max(1, nx - 1);
        const isAway = (topStand ? id === 'T' : id === 'B') && u > .87;
        const s = { x: x + i * c, y: y + j * c, st: id, u, r: id === 'T' ? ny - 1 - j : id === 'B' ? j : id === 'L' ? nx - 1 - i : i, ph: Math.random() * 6.28, away: isAway };
        if (Math.random() > o.fill * (isAway ? .8 : 1)) { empty.push(s); continue; }
        const pal = isAway ? awayPal : homePal;
        s.col = pal[Math.floor(Math.random() * pal.length)];
        seats.push(s);
      }
    }
    const sx0 = full ? 6 : mx, sw = Math.floor((W - 2 * sx0) / c);
    if (topStand) addStand('T', sx0, mT - 10 - rows * c, sw, rows);
    if (t === 1) { const n = Math.floor(pw * .6 / c); addStand('B', W / 2 - n * c / 2, geom.y1 + 10, n, rows); }
    else addStand('B', sx0, geom.y1 + 10, sw, rows);
    if (sideStands) {
      const n = Math.floor(ph / c);
      addStand('L', mx - gd - 6 - cols * c, mT, cols, n);
      addStand('R', W - mx + gd + 6, mT, cols, n);
    }
    const hStand = stands.find(s => s.id === hs);

    /* Sabit arka plan */
    const bg = document.createElement('canvas'); bg.width = W * dpr; bg.height = H * dpr;
    const g = bg.getContext('2d'); g.scale(dpr, dpr);
    g.fillStyle = t <= 2 ? '#35603f' : '#232d3b'; g.fillRect(0, 0, W, H);
    if (t <= 2) { // çevrede ağaçlar ve toprak yol
      for (let i = 0; i < 46; i++) {
        const x = Math.random() * W, y = Math.random() < .5 ? Math.random() * (mT - 14) : geom.y1 + 14 + Math.random() * (mB - 14);
        if (stands.some(s => x > s.x - 8 && x < s.x + s.w + 8 && y > s.y - 8 && y < s.y + s.h + 8)) continue;
        g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.arc(x + 2, y + 3, c * 1.1, 0, 6.29); g.fill();
        g.fillStyle = ['#24512f', '#2c6338', '#1f4829'][i % 3]; g.beginPath(); g.arc(x, y, c * 1.1, 0, 6.29); g.fill();
      }
    }
    for (const s of stands) {
      g.fillStyle = t >= 5 ? '#0f1826' : '#141e2c'; g.fillRect(s.x - 4, s.y - 4, s.w + 8, s.h + 8);
      g.fillStyle = '#1b2738'; g.fillRect(s.x - 1, s.y - 1, s.w + 1, s.h + 1);
    }
    g.fillStyle = '#2b3a52';
    for (const s of empty) g.fillRect(s.x, s.y, c - 1, c - 1);
    if (t >= 5) { // çatı kenarı
      g.fillStyle = '#c9d3e0';
      for (const s of stands) { if (s.id === 'T') g.fillRect(s.x - 4, s.y - 9, s.w + 8, 4); if (s.id === 'B') g.fillRect(s.x - 4, s.y + s.h + 5, s.w + 8, 4); if (s.id === 'L') g.fillRect(s.x - 9, s.y - 4, 4, s.h + 8); if (s.id === 'R') g.fillRect(s.x + s.w + 5, s.y - 4, 4, s.h + 8); }
    }
    // saha çevresi ve çim
    g.fillStyle = snow ? '#b9c9c6' : '#1c6b3c'; g.fillRect(mx - gd - 4, mT - 8, pw + 2 * gd + 8, ph + 16);
    for (let i = 0; i < 12; i++) { g.fillStyle = snow ? (i % 2 ? '#e3ecea' : '#d5e1de') : (i % 2 ? '#2f9e5b' : '#2a9154'); g.fillRect(mx + pw * i / 12, mT, pw / 12 + 1, ph); }
    g.strokeStyle = snow ? 'rgba(200,60,60,.75)' : 'rgba(243,239,228,.85)'; g.lineWidth = Math.max(1.5, W / 420);
    g.strokeRect(mx, mT, pw, ph);
    const cy = mT + ph / 2;
    g.beginPath(); g.moveTo(W / 2, mT); g.lineTo(W / 2, mT + ph); g.stroke();
    g.beginPath(); g.arc(W / 2, cy, ph * .14, 0, 6.29); g.stroke();
    for (const sx of [0, 1]) {
      const x0 = sx ? W - mx : mx, d = sx ? -1 : 1;
      g.strokeRect(x0, cy - ph * .3, d * pw * .16, ph * .6);
      g.strokeRect(x0, cy - ph * .14, d * pw * .055, ph * .28);
      g.beginPath(); g.arc(x0 + d * pw * .11, cy, ph * .12, sx ? Math.PI * .68 : -Math.PI * .32, sx ? Math.PI * 1.32 : Math.PI * .32); g.stroke();
      g.beginPath(); g.arc(x0 + d * pw * .11, cy, 1.8, 0, 6.29); g.fillStyle = g.strokeStyle; g.fill();
    }
    // reklam panoları, tünel, kulübeler
    const ads = [home.c1, '#ffc93c', home.c2, '#f3efe4'];
    for (let i = 0; i < 16; i++) { g.fillStyle = ads[i % 4]; g.fillRect(mx + pw * i / 16 + 1, mT - 6, pw / 16 - 2, 3.5); }
    g.fillStyle = '#0a1322'; g.fillRect(W / 2 - c * 2, geom.y1 + 3, c * 4, 7);
    g.fillStyle = '#58c4dd'; g.fillRect(W / 2 - pw * .2, geom.y1 + 3, pw * .09, 5); g.fillRect(W / 2 + pw * .11, geom.y1 + 3, pw * .09, 5);
    if (t >= 4) for (const [x, y] of [[10, 10], [W - 10, 10], [10, H - 10], [W - 10, H - 10]]) { g.fillStyle = '#0a1322'; g.fillRect(x - 6, y - 6, 12, 12); g.fillStyle = '#fff3c4'; g.fillRect(x - 4, y - 4, 8, 8); }
    if (t >= 5) { g.fillStyle = '#0a1322'; g.fillRect(W - mx - pw * .2, 2, pw * .12, 9); g.fillStyle = home.c1; g.fillRect(W - mx - pw * .2 + 2, 4, pw * .12 - 4, 5); }

    /* Dev pankart */
    let banner = null;
    if (hStand) {
      const bw = Math.round(Math.min(hStand.w * .46, 340)), bh = Math.round(hStand.h);
      banner = document.createElement('canvas'); banner.width = bw * 2; banner.height = Math.max(8, bh * 2);
      const b = banner.getContext('2d'); b.scale(2, 2);
      b.fillStyle = home.c1; b.fillRect(0, 0, bw, bh);
      b.fillStyle = home.c2; for (let i = -1; i < 9; i++) { b.beginPath(); b.moveTo(i * bw / 8, bh); b.lineTo(i * bw / 8 + bw / 16, bh); b.lineTo(i * bw / 8 + bw / 16 + bh, 0); b.lineTo(i * bw / 8 + bh, 0); b.fill(); }
      b.fillStyle = 'rgba(10,19,34,.82)'; b.fillRect(bw * .14, bh * .12, bw * .72, bh * .76);
      b.fillStyle = '#ffc93c'; b.textAlign = 'center'; b.textBaseline = 'middle';
      b.font = `800 ${Math.max(7, bh * .62)}px 'Barlow Condensed', Impact, sans-serif`;
      b.fillText((bh >= 22 ? '★ ' + home.name.toLocaleUpperCase('tr') + ' ★' : home.short), bw / 2, bh / 2 + .5, bw * .68);
      banner.bw = bw; banner.bh = bh; banner.x = hStand.x + hStand.w / 2 - bw / 2; banner.y = hStand.y;
    }
    const flags = [];
    if (hStand) for (let i = 0; i < (t === 1 ? 3 : 7); i++) flags.push({ u: .06 + i / (t === 1 ? 3 : 7) * .78, ph: Math.random() * 6, col: i % 2 ? home.c2 : home.c1 });
    const smoke = [];

    /* a: { choreo (0→1 açılış, >1 tam), alpha (koreografi görünürlüğü), cheer:[ev, dep], dt } */
    function drawCrowd(ctx, time, a) {
      const ch = a.choreo || 0, al = a.alpha == null ? 1 : a.alpha;
      for (const s of seats) {
        let col = s.col, dy = 0;
        const cheer = s.away ? a.cheer[1] : a.cheer[0];
        if (cheer > 0) dy = -Math.abs(Math.sin(time * 9 + s.ph)) * c * .55 * cheer;
        else if (s.ph < 1) dy = Math.sin(time * 2 + s.ph * 8) * .5;
        if (ch > 0 && al > .5 && !s.away && (s.st === hs || (full && s.st === 'L'))) {
          const rev = ch * 1.5 - s.u * .5;
          if (rev > 0) {
            col = Math.floor(s.u * 16 + s.r * .6 + time * .9) % 2 ? home.c1 : home.c2;
            dy -= Math.max(0, Math.sin(Math.min(rev, 1) * Math.PI)) * c * .5 + Math.sin(time * 5 - s.u * 22) * .9;
          }
        }
        ctx.fillStyle = col; ctx.fillRect(s.x, s.y + dy, c - 1, c - 1);
      }
      if (!hStand) return;
      if (ch > .2 && al > 0 && banner) {
        const k = clamp((ch - .2) / .4, 0, 1) * al, vis = banner.bh * k, top = hs === 'T';
        for (let x = 0; x < banner.bw; x += 4) {
          const off = Math.sin(time * 3 + x * .06) * 1.4;
          ctx.drawImage(banner, x * 2, top ? 0 : (banner.bh - vis) * 2, 8, Math.max(1, vis * 2), banner.x + x, banner.y + (top ? 0 : banner.bh - vis) + off, 4, vis);
        }
      }
      const fl = clamp(al + Math.max(a.cheer[0], 0), 0, 1);
      if (fl > 0) for (const f of flags) {
        const x = hStand.x + f.u * hStand.w, y = hStand.y + hStand.h * .5, sway = Math.sin(time * 2.4 + f.ph) * .5, L = c * 3.4 * fl;
        const tx = x + Math.sin(sway) * L, ty = y - Math.cos(sway) * L;
        ctx.strokeStyle = '#d9dde4'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.fillStyle = f.col; ctx.beginPath(); ctx.moveTo(tx, ty);
        for (let i = 1; i <= 4; i++) ctx.lineTo(tx + i * c * .7, ty + Math.sin(time * 7 + f.ph + i) * 1.6);
        for (let i = 4; i >= 0; i--) ctx.lineTo(tx + i * c * .7, ty + c * 1.5 + Math.sin(time * 7 + f.ph + i + 1) * 1.6);
        ctx.fill();
      }
      // meşaleler ve duman
      const flare = (ch > .45 && al > .3) || a.cheer[0] > .5;
      if (flare && smoke.length < 90) for (const u of [.2, .8, .5]) if (Math.random() < .5) smoke.push({ x: hStand.x + hStand.w * u + (Math.random() - .5) * 8, y: hStand.y + hStand.h * .5, vx: (Math.random() - .5) * 10, vy: (hs === 'T' ? 1 : -1) * (4 + Math.random() * 8), r: 3, life: 1, red: Math.random() < .5 });
      for (let i = smoke.length - 1; i >= 0; i--) {
        const p = smoke[i]; p.x += p.vx * a.dt; p.y += p.vy * a.dt; p.r += 9 * a.dt; p.life -= a.dt * .45;
        if (p.life <= 0) { smoke.splice(i, 1); continue; }
        ctx.globalAlpha = p.life * .35; ctx.fillStyle = p.red ? '#ff5a4a' : '#e9edf2';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.29); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (flare) for (const u of [.2, .8, .5]) {
        const x = hStand.x + hStand.w * u, y = hStand.y + hStand.h * .5, r = c * 2.2 + Math.sin(time * 20 + u * 9) * 2;
        const gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,240,200,.95)'); gr.addColorStop(.35, 'rgba(255,80,60,.7)'); gr.addColorStop(1, 'rgba(255,80,60,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.29); ctx.fill();
      }
    }

    /* Gece, projektör, yağmur, kar */
    function drawFx(ctx, time) {
      const wx = o.wx || { t: 'clear', n: 0 };
      if (wx.n) {
        ctx.fillStyle = 'rgba(6,10,30,.36)'; ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';
        for (const [x, y] of [[0, 0], [W, 0], [0, H], [W, H]]) {
          const gr = ctx.createRadialGradient(x, y, 0, x, y, W * .5); gr.addColorStop(0, 'rgba(255,243,196,.16)'); gr.addColorStop(1, 'rgba(255,243,196,0)');
          ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      if (wx.t === 'rain') {
        ctx.strokeStyle = 'rgba(190,215,240,.45)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let i = 0; i < 110; i++) { const x = ((i * 97.3 + time * 260) % (W + 40)) - 20, y = (i * 53.7 + time * 620) % H; ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 11); }
        ctx.stroke();
      } else if (wx.t === 'snow') {
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        for (let i = 0; i < 90; i++) { const x = (i * 71.7 + Math.sin(time * .8 + i) * 14 + time * 12) % W, y = (i * 39.1 + time * (34 + i % 5 * 9)) % H; ctx.fillRect(x, y, 1.6 + i % 3 * .6, 1.6 + i % 3 * .6); }
      }
    }
    return { W, H, geom, bg, tier: t, snow, drawCrowd, drawFx };
  }

  /* Kulüp sayfasındaki canlı önizleme */
  function preview(canvas, team) {
    const w = canvas.parentElement.clientWidth, dpr = Math.min(2, window.devicePixelRatio || 1);
    const st = create({ W: w, dpr, tier: FM.stadiumTier(team), home: team, away: { c1: '#52627a', c2: '#c9d3e0' }, fill: clamp(.35 + FM.G.fans / 100 * .6, .3, 1), wx: { t: 'clear', n: 0 } });
    canvas.width = w * dpr; canvas.height = st.H * dpr; canvas.style.height = st.H + 'px';
    const g = canvas.getContext('2d'), t0 = performance.now(), still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let last = t0;
    (function loop(now) {
      if (!canvas.isConnected) return;
      const t = (now - t0) / 1000, dt = Math.min(.05, (now - last) / 1000); last = now;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.drawImage(st.bg, 0, 0, w, st.H);
      st.drawCrowd(g, t, { choreo: still ? 1.2 : Math.min(1.2, t * .35), alpha: 1, cheer: [0, 0], dt });
      if (!still) requestAnimationFrame(loop);
    })(t0);
  }

  FM.Stadium = { TIERS, create, preview };
})();
