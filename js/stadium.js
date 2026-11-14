/* Saha Kenarı — yayın açısından perspektifli stadyum: yamuk saha, çanak tribünler, kart mozaiği koreografi,
   tribün yazısı, çatı ve projektörler, tünel ve kulübeler. Kadro değerine göre 5 kademe. */
(function () {
  const TIERS = ['', 'Mahalle Sahası', 'İlçe Stadı', 'Şehir Stadı', 'Arena', 'Dev Arena'];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const lum = hex => { const c = rgb(hex); return c[0] * .299 + c[1] * .587 + c[2] * .114; };
  const shade = (c, k) => `rgb(${Math.min(255, c[0] * k) | 0},${Math.min(255, c[1] * k) | 0},${Math.min(255, c[2] * k) | 0})`;

  /* o: { W, dpr, tier, home, away, fill (0-1), wx: {t, n} } */
  function create(o) {
    const W = o.W, dpr = o.dpr || 1, t = o.tier, H0 = W * .72, cut = H0 * [0, .15, .13, .08, 0, 0][t], H = Math.round(H0 * 1.06 - cut), wx = o.wx || { t: 'clear', n: 0 };
    const cx = W / 2, Yf = H0 * .4 - cut, Yn = H0 * .8 - cut, Wn = W * .74, pa = 1 / .74 - 1, Hp = Yn - Yf;
    const snow = wx.t === 'snow', night = !!wx.n;
    /* saha koordinatı (x: 0 sol kale → 1 sağ kale, y: 0 uzak çizgi → 1 yakın çizgi) → ekran */
    const proj = (x, y) => { const tt = 1 - y, s = 1 / (1 + pa * tt); return { X: cx + (x - .5) * Wn * s, Y: Yn - Hp * tt * (1 + pa) / (1 + pa * tt), s }; };
    const c = Math.max(3.6, W / 190), cyE = (Yf + Yn) / 2, R1 = .93;
    const ap = [proj(-.07, -.13), proj(1.07, -.13), proj(1.09, 1.16), proj(-.09, 1.16)];
    const inApron = (X, Y) => { if (Y < ap[0].Y || Y > ap[2].Y) return false; const k = (Y - ap[0].Y) / (ap[2].Y - ap[0].Y); return X > ap[0].X + (ap[3].X - ap[0].X) * k && X < ap[1].X + (ap[2].X - ap[1].X) * k; };
    const roofH = t >= 4 ? H0 * .13 : H0 * .07;
    const dkHex = lum(o.home.c1) <= lum(o.home.c2) ? o.home.c1 : o.home.c2, ltHex = dkHex === o.home.c1 ? o.home.c2 : o.home.c1, inkHex = Math.abs(lum(dkHex) - lum(ltHex)) < 70 ? '#f3efe4' : ltHex;
    const DK = rgb(dkHex), LT = rgb(ltHex), H1 = rgb(o.home.c1), H2 = rgb(o.home.c2), A1 = rgb(o.away.c1), A2 = rgb(o.away.c2), CARD = [239, 234, 224];
    const mk = () => { const cv = document.createElement('canvas'); cv.width = W * dpr; cv.height = H * dpr; const g = cv.getContext('2d'); g.scale(dpr, dpr); return [cv, g]; };
    const [bg, g] = mk(), [crowdN, gn] = mk(), [crowdT, gt] = mk();

    /* ---- gökyüzü ve çevre ---- */
    const sky = g.createLinearGradient(0, 0, 0, H * .45);
    if (night) { sky.addColorStop(0, '#04060c'); sky.addColorStop(1, '#0d1422'); } else { sky.addColorStop(0, '#5f9bd3'); sky.addColorStop(1, '#b9d6ee'); }
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    g.fillStyle = t <= 2 ? (night ? '#12261a' : '#2f5a38') : (night ? '#0d1119' : '#2a3342'); g.fillRect(0, roofH, W, H - roofH);
    if (t <= 2) for (let i = 0; i < 70; i++) { // ağaçlar
      const x = Math.random() * W, y = roofH + Math.random() * (H - roofH), r = c * (1.2 + Math.random());
      if (inApron(x, y)) continue;
      g.fillStyle = shade([36, 92, 52], (night ? .45 : .9) * (.7 + Math.random() * .5)); g.beginPath(); g.arc(x, y, r, 0, 6.29); g.fill();
    }

    /* ---- tribün hücreleri (iki katman: normal seyirci, kart mozaiği) ---- */
    const bandTop = cyE - (t === 1 ? .86 : R1) * H0 * .36, bandBot = ap[0].Y - c;
    const lamps = [];
    for (let j = 0; j * c < H; j++) for (let i = 0; i * c < W; i++) {
      const X = i * c + c / 2, Y = j * c + c / 2;
      if (Y < roofH || inApron(X, Y)) continue;
      const far = Y < ap[0].Y, near = Y > ap[2].Y, ex = (X - cx) / (W * .5), ey = (Y - cyE) / (Y < cyE ? H0 * .36 : H0 * .5), rho = Math.hypot(ex, ey);
      const upper = t >= 4 && rho > R1;
      if (t === 1 && !(far && rho < .86 && Math.abs(ex) < .62) && !(near && Math.abs(ex) < .5)) continue;
      if (t === 2 && (rho > R1 + .02 || (!far && !near && Math.abs(ey) < .25))) continue;
      if (t === 3 && rho > 1.1) continue;
      if (t === 4 && rho > 1.24) continue;
      const gap = upper && rho < R1 + .028, ang = Math.atan2(ey, ex) * 13 / Math.PI, aisle = Math.abs(ang - Math.round(ang)) < .022;
      if (gap || aisle) { g.fillStyle = gap ? '#0c1018' : '#141a25'; g.fillRect(i * c, j * c, c, c); continue; }
      const dim = (near ? .42 : far ? .95 : .85) * (night ? 1 : 1.12), jit = .8 + Math.random() * .32;
      const awayB = !near && ex > .64 && ey < -.05;
      // normal seyirci
      let col;
      if (Math.random() > o.fill * (awayB ? .85 : 1)) col = shade([30, 36, 50], dim * .7);
      else { const pal = awayB ? [A1, A1, A2, [60, 68, 90]] : [H1, H1, H1, H2, H2, [216, 194, 168], [43, 49, 64], [84, 96, 122]]; col = shade(pal[(Math.random() * pal.length) | 0], dim * jit * .4); }
      gn.fillStyle = '#080b11'; gn.fillRect(i * c, j * c, c, c); gn.fillStyle = col; gn.fillRect(i * c, j * c, c - .7, c - .7);
      // kart mozaiği
      let tc;
      if (awayB) tc = Math.floor((X + Y) / (c * 5)) % 2 ? A1 : A2;
      else if (far && Math.abs(ex) < .5 && (upper || Y > bandTop)) tc = DK;
      else if (near) tc = Math.floor(X / (W * .11)) % 2 ? H1 : H2;
      else tc = Math.floor(rho * 12.5) % 2 ? LT : DK;
      gt.fillStyle = '#080b11'; gt.fillRect(i * c, j * c, c, c);
      gt.fillStyle = Math.random() < .03 ? shade([20, 24, 32], 1) : shade(tc, dim * (.84 + Math.random() * .26)); gt.fillRect(i * c, j * c, c - .7, c - .7);
    }
    // tribün yazıları (kartların üstüne, sonra hücre ızgarasıyla parçalanır)
    const up1 = o.home.name.split(' ')[0].toLocaleUpperCase('tr');
    function sloganLine(text, top, bot) {
      const bh = bot - top; if (bh < 7) return;
      gt.fillStyle = inkHex; gt.textAlign = 'center'; gt.textBaseline = 'middle';
      gt.font = `800 ${Math.max(7, bh * .66)}px 'Barlow Condensed', Impact, sans-serif`;
      gt.fillText(text, cx, top + bh * .54, W * .44);
      gt.strokeStyle = 'rgba(8,11,17,.5)'; gt.lineWidth = .7; gt.beginPath();
      for (let x = Math.floor(W * .26 / c) * c; x < W * .74; x += c) { gt.moveTo(x - .35, top); gt.lineTo(x - .35, bot); }
      for (let y = Math.floor(top / c) * c; y < bot; y += c) { gt.moveTo(W * .26, y - .35); gt.lineTo(W * .74, y - .35); }
      gt.stroke();
    }
    sloganLine(bandBot - bandTop >= 16 ? 'ÖLÜMÜNE ' + up1 + '!' : up1, bandTop + c, bandBot + c * .5);
    if (t >= 4) sloganLine('BURASI ' + o.home.stadium.toLocaleUpperCase('tr'), roofH + c, cyE - (R1 + .03) * H0 * .36 - c * .5);
    // dev bayrak (sol tribünde açılır)
    const flag = document.createElement('canvas'); flag.width = 300; flag.height = 200;
    { const q = flag.getContext('2d'); q.fillStyle = dkHex; q.fillRect(0, 0, 300, 200); q.fillStyle = ltHex; q.beginPath(); q.moveTo(0, 150); q.lineTo(300, 40); q.lineTo(300, 95); q.lineTo(0, 200); q.fill();
      q.beginPath(); q.arc(150, 100, 70, 0, 6.29); q.fillStyle = '#f3efe4'; q.fill(); q.lineWidth = 8; q.strokeStyle = dkHex; q.stroke();
      q.translate(150, 100); q.rotate(-.35); q.fillStyle = dkHex; q.fillRect(-64, -22, 128, 44); q.fillStyle = '#f3efe4'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.font = "800 40px 'Barlow Condensed', Impact, sans-serif"; q.fillText(o.home.short, 0, 2); }
    // ön sıra: kolları havada taraftar siluetleri
    const [front, gf] = mk();
    for (let row = 0; row < 3; row++) for (let x = (row % 2) * c * 1.6; x < W; x += c * 3.2) {
      const y = H - (2 - row) * c * 2.6 - c * 1.2 + Math.random() * c, k = .16 + row * .06, col = shade(Math.random() < .6 ? H1 : H2, k + Math.random() * .08);
      gf.fillStyle = col; gf.strokeStyle = col; gf.lineWidth = c * .5; gf.lineCap = 'round';
      gf.beginPath(); gf.arc(x, y, c * .75, 0, 6.29); gf.fill(); gf.fillRect(x - c * .9, y + c * .6, c * 1.8, c * 3.2);
      if (Math.random() < .55) { gf.beginPath(); gf.moveTo(x - c * .8, y + c); gf.lineTo(x - c * 1.5, y - c * 1.3); gf.moveTo(x + c * .8, y + c); gf.lineTo(x + c * 1.5, y - c * 1.3); gf.stroke(); }
    }

    /* ---- çatı ve projektörler ---- */
    if (t >= 4) {
      g.fillStyle = night ? '#04060c' : '#4f84b8'; g.fillRect(0, 0, W, roofH * .18);
      g.fillStyle = '#1a202b'; g.fillRect(0, roofH * .18, W, roofH * .82);
      g.strokeStyle = 'rgba(214,222,232,.7)'; g.lineWidth = 1; g.beginPath();
      const y0 = roofH * .28, y1 = roofH * .86, n = Math.round(W / (c * 3.2));
      g.moveTo(0, y0); g.lineTo(W, y0); g.moveTo(0, y1); g.lineTo(W, y1); g.moveTo(0, (y0 + y1) / 2); g.lineTo(W, (y0 + y1) / 2);
      for (let i = 0; i <= n; i++) { const x = i * W / n; g.moveTo(x, y0); g.lineTo(x + W / n / 2, y1); g.lineTo(x + W / n, y0); }
      g.stroke();
      for (let i = 0; i < 20; i++) lamps.push([W * (i + .5) / 20, roofH * .22, 1]);
      for (let i = 0; i < 12; i++) lamps.push([W * (i + .5) / 12, roofH * .95, 1.5]);
    } else if (t === 3) for (const x of [.08, .3, .7, .92]) { g.fillStyle = '#1a202b'; g.fillRect(W * x - 1.5, roofH * .3, 3, roofH * .9); g.fillRect(W * x - c * 2.5, roofH * .2, c * 5, c * 2); for (let k = -1; k <= 1; k++) lamps.push([W * x + k * c * 1.6, roofH * .2 + c, 1.2]); }
    g.fillStyle = night ? '#fffbe6' : '#e9edf2';
    for (const [x, y, k] of lamps) { g.beginPath(); g.arc(x, y, c * .38 * k, 0, 6.29); g.fill(); }

    /* ---- saha ---- */
    const quad = (x0, y0, x1, y1, fill, ctx) => { const a = proj(x0, y0), b = proj(x1, y0), d = proj(x1, y1), e = proj(x0, y1); (ctx || g).fillStyle = fill; (ctx || g).beginPath(); (ctx || g).moveTo(a.X, a.Y); (ctx || g).lineTo(b.X, b.Y); (ctx || g).lineTo(d.X, d.Y); (ctx || g).lineTo(e.X, e.Y); (ctx || g).fill(); };
    const poly = pts => { g.beginPath(); pts.forEach((p, i) => { const q = proj(p[0], p[1]); if (i) g.lineTo(q.X, q.Y); else g.moveTo(q.X, q.Y); }); };
    g.fillStyle = '#1c232f'; g.beginPath(); g.moveTo(ap[0].X - 3, ap[0].Y - 3); g.lineTo(ap[1].X + 3, ap[1].Y - 3); g.lineTo(ap[2].X + 4, ap[2].Y + 3); g.lineTo(ap[3].X - 4, ap[3].Y + 3); g.fill();
    g.fillStyle = snow ? '#a9bbb7' : night ? '#134a2b' : '#1c6b3c'; g.beginPath(); ap.forEach((p, i) => (i ? g.lineTo(p.X, p.Y) : g.moveTo(p.X, p.Y))); g.fill();
    for (let i = 0; i < 12; i++) quad(i / 12, 0, (i + 1) / 12 + .001, 1, snow ? (i % 2 ? '#e3ecea' : '#d3dfdc') : night ? (i % 2 ? '#237c47' : '#1f7040') : (i % 2 ? '#2f9e5b' : '#2a9154'));
    g.strokeStyle = snow ? 'rgba(200,60,60,.8)' : 'rgba(243,239,228,.9)'; g.lineWidth = Math.max(1.1, W / 560); g.lineJoin = 'round';
    const rect = (x0, y0, x1, y1) => { poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]); g.stroke(); };
    const arc = (x, y, r, a0, a1) => { const pts = []; for (let k = 0; k <= 28; k++) { const a = a0 + (a1 - a0) * k / 28; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 105 / 68]); } poly(pts); g.stroke(); };
    rect(0, 0, 1, 1); poly([[.5, 0], [.5, 1]]); g.stroke(); arc(.5, .5, .087, 0, 6.29);
    for (const sx of [0, 1]) { const d = sx ? -1 : 1; rect(sx, .2, sx + d * .157, .8); rect(sx, .365, sx + d * .052, .635); arc(sx + d * .105, .5, .087, sx ? 2.22 : -.92, sx ? 4.06 : .92); const sp = proj(sx + d * .105, .5); g.fillStyle = g.strokeStyle; g.beginPath(); g.arc(sp.X, sp.Y, 1.5, 0, 6.29); g.fill(); }
    // reklam panoları, tünel, kulübeler
    const ads = [o.home.c1, '#f3efe4', o.home.c2, '#ffc93c'];
    for (let i = 0; i < 14; i++) quad(i / 14 + .004, -.075, (i + 1) / 14 - .004, -.045, ads[i % 4]);
    for (let i = 0; i < 6; i++) quad(.478 + i * .0075, 1.05, .478 + (i + 1) * .0075, 1.19, i % 2 ? o.home.c1 : o.home.c2);
    for (const [x0, x1] of [[.3, .462], [.538, .7]]) {
      quad(x0, 1.075, x1, 1.125, '#161d2a'); quad(x0 + .004, 1.092, x1 - .004, 1.112, o.home.c1);
      g.strokeStyle = 'rgba(243,239,228,.6)'; g.setLineDash([3, 3]); g.lineWidth = 1; poly([[x0 - .01, 1.07], [x0 - .01, 1.015], [x1 + .01, 1.015], [x1 + .01, 1.07]]); g.stroke(); g.setLineDash([]);
    }

    /* ---- ışık lekesi (gece) ---- */
    const glow = document.createElement('canvas'); glow.width = glow.height = 64;
    { const q = glow.getContext('2d'), gr = q.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,250,225,.9)'); gr.addColorStop(.3, 'rgba(255,244,200,.3)'); gr.addColorStop(1, 'rgba(255,244,200,0)'); q.fillStyle = gr; q.fillRect(0, 0, 64, 64); }
    const smoke = [], flareX = [.22, .5, .78], flareY = ap[0].Y - c * 2;
    const bnW = ap[1].X - ap[0].X, bnH = c * 2.6, [bnr, gb] = (() => { const cv = document.createElement('canvas'); cv.width = Math.max(1, bnW * dpr); cv.height = Math.max(1, bnH * dpr); const q = cv.getContext('2d'); q.scale(dpr, dpr); return [cv, q]; })();
    FM.paintBanners(gb, 0, 0, bnW, bnH, o.home, FM.bannerTexts(o.home), 2, false);

    function layer(ctx, img, amp, time, freq) {
      if (amp < .02) { ctx.drawImage(img, 0, 0, W, H); return; }
      const n = 40, sw = W / n;
      for (let i = 0; i < n; i++) ctx.drawImage(img, i * sw * dpr, 0, sw * dpr, H * dpr, i * sw, -Math.abs(Math.sin(time * freq + i * 1.7)) * amp * c * .9, sw + .5, H);
    }
    /* a: { choreo (0→1 açılış), alpha (mozaik görünürlüğü), cheer:[ev, dep], dt } */
    function drawCrowd(ctx, time, a) {
      const ch = a.choreo || 0, al = a.alpha == null ? 1 : a.alpha, amp = Math.max(a.cheer[0], a.cheer[1] * .4);
      layer(ctx, crowdN, amp, time, 9);
      if (ch > 0 && al > 0) {
        const rv = clamp(ch, 0, 1);
        ctx.save(); ctx.beginPath(); ctx.rect(cx - W / 2 * rv, 0, W * rv, H); ctx.clip();
        ctx.globalAlpha = clamp(al, 0, 1); layer(ctx, crowdT, .22 + amp * .8, time, 3.2); ctx.restore();
      }
      ctx.drawImage(bnr, ap[0].X, ap[0].Y - bnH - c * .2, bnW, bnH);
      // dev bayrak
      const fk = t >= 3 ? clamp((ch - .45) / .45, 0, 1) * clamp((al - .5) * 4, 0, 1) : 0;
      if (fk > 0) {
        const fw = W * .135, fh = H0 * .2 * fk, fx = W * .012, fy = cyE - H0 * .13;
        ctx.save(); ctx.transform(1, -.1, -.14, 1, fx + H0 * .03, fy + W * .012);
        for (let x = 0; x < fw; x += 4) ctx.drawImage(flag, x / fw * 300, 0, 4 / fw * 300, 200 * fk, x, Math.sin(time * 2.6 + x * .07) * 2.2, 4.4, fh);
        ctx.restore();
      }
      // flaşlar
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      for (let i = 0; i < 5; i++) { const x = Math.random() * W, y = roofH + Math.random() * (H - roofH); if (!inApron(x, y)) ctx.fillRect(x, y, 1.6, 1.6); }
      // meşale ve duman
      const flare = t >= 2 && ((ch > .5 && al > .6) || a.cheer[0] > .5);
      if (flare && smoke.length < 80) for (const u of flareX) if (Math.random() < .45) smoke.push({ x: W * u + (Math.random() - .5) * 8, y: flareY, vx: (Math.random() - .5) * 10, vy: -(5 + Math.random() * 9), r: 3, life: 1, red: Math.random() < .5 });
      for (let i = smoke.length - 1; i >= 0; i--) {
        const p = smoke[i]; p.x += p.vx * a.dt; p.y += p.vy * a.dt; p.r += 9 * a.dt; p.life -= a.dt * .45;
        if (p.life <= 0) { smoke.splice(i, 1); continue; }
        ctx.globalAlpha = p.life * .3; ctx.fillStyle = p.red ? '#ff5a4a' : '#e9edf2'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.29); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (flare) for (const u of flareX) { const r = c * 3 + Math.sin(time * 20 + u * 9) * 1.5; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glow, W * u - r, flareY - r, r * 2, r * 2); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#ff4a3a'; ctx.beginPath(); ctx.arc(W * u, flareY, c * .6, 0, 6.29); ctx.fill(); }
    }
    /* Projektör parlaması, yağmur, kar */
    function drawFx(ctx, time) {
      ctx.drawImage(front, 0, Math.sin(time * 2.2) * 1.2, W, H);
      if (night) {
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < lamps.length; i++) { const [x, y, k] = lamps[i], r = c * 4.2 * k * (1 + Math.sin(time * 3 + i) * .06); ctx.drawImage(glow, x - r, y - r, r * 2, r * 2); }
        if (lamps.length) { ctx.globalAlpha = .1; ctx.drawImage(glow, cx - W * .55, Yf - H0 * .5, W * 1.1, H0 * 1.1); ctx.globalAlpha = 1; }
        ctx.globalCompositeOperation = 'source-over';
      }
      if (wx.t === 'rain') {
        ctx.strokeStyle = 'rgba(190,215,240,.45)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let i = 0; i < 110; i++) { const x = ((i * 97.3 + time * 260) % (W + 40)) - 20, y = (i * 53.7 + time * 620) % H; ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 11); }
        ctx.stroke();
      } else if (snow) {
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        for (let i = 0; i < 90; i++) { const x = (i * 71.7 + Math.sin(time * .8 + i) * 14 + time * 12) % W, y = (i * 39.1 + time * (34 + i % 5 * 9)) % H; ctx.fillRect(x, y, 1.6 + i % 3 * .6, 1.6 + i % 3 * .6); }
      }
    }
    return { W, H, proj, Hp, Wn, c, bg, tier: t, snow, night, drawCrowd, drawFx };
  }

  /* Kulüp sayfasındaki canlı önizleme */
  function preview(canvas, team) {
    const w = canvas.parentElement.clientWidth, dpr = Math.min(2, window.devicePixelRatio || 1);
    const st = create({ W: w, dpr, tier: FM.stadiumTier(team), home: team, away: { c1: '#52627a', c2: '#c9d3e0' }, fill: clamp(.35 + FM.G.fans / 100 * .6, .3, 1), wx: { t: 'clear', n: 1 } });
    canvas.width = w * dpr; canvas.height = st.H * dpr; canvas.style.height = st.H + 'px';
    const g = canvas.getContext('2d'), t0 = performance.now(), still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let last = t0;
    (function loop(now) {
      if (!canvas.isConnected) return;
      const t = (now - t0) / 1000, dt = Math.min(.05, (now - last) / 1000); last = now;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.drawImage(st.bg, 0, 0, w, st.H);
      st.drawCrowd(g, t, { choreo: still ? 1 : Math.min(1, t * .4), alpha: 1, cheer: [0, 0], dt });
      st.drawFx(g, t);
      if (!still) requestAnimationFrame(loop);
    })(t0);
  }

  FM.Stadium = { TIERS, create, preview };
})();
