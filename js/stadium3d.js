/* Saha Kenarı — Three.js ile 3D stadyum: saha, çanak tribünler (kart mozaiği dokuları), çatı, projektörler,
   kaleler, kulübeler, tünel, seremoni platformu, dev bayrak. Oyuncu pulları 2D katmanda, bu kameraya göre çizilir.
   THREE yoksa ya da WebGL açılamazsa create() null döner ve 2D stadyum kullanılır. */
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const lum = hex => { const c = rgb(hex); return c[0] * .299 + c[1] * .587 + c[2] * .114; };
  const shade = (c, k) => `rgb(${Math.min(255, c[0] * k) | 0},${Math.min(255, c[1] * k) | 0},${Math.min(255, c[2] * k) | 0})`;
  const A0 = 52.5, B0 = 34;
  /* Yuvarlatılmış dikdörtgen çevre: u 0→1 (uzak kenar soldan sağa başlar), d = taç çizgisinden uzaklık */
  const SEG = [0, .28, .32, .46, .5, .78, .82, .96, 1];
  function ring(u, d) {
    const k = i => (u - SEG[i]) / (SEG[i + 1] - SEG[i]), arc = (cx, cz, a0, i) => { const a = a0 + k(i) * Math.PI / 2; return [cx + d * Math.cos(a), cz + d * Math.sin(a)]; };
    if (u < SEG[1]) return [-A0 + 2 * A0 * k(0), -B0 - d];
    if (u < SEG[2]) return arc(A0, -B0, -Math.PI / 2, 1);
    if (u < SEG[3]) return [A0 + d, -B0 + 2 * B0 * k(2)];
    if (u < SEG[4]) return arc(A0, B0, 0, 3);
    if (u < SEG[5]) return [A0 - 2 * A0 * k(4), B0 + d];
    if (u < SEG[6]) return arc(-A0, B0, Math.PI / 2, 5);
    if (u < SEG[7]) return [-A0 - d, B0 - 2 * B0 * k(6)];
    return arc(-A0, -B0, Math.PI, 7);
  }
  const US = []; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) US.push(SEG[i] + (SEG[i + 1] - SEG[i]) * j / 8); US.push(1);

  /* o: { canvas, W, dpr, tier, home, away, fill, wx } */
  function create(o) {
    const T3 = window.THREE; if (!T3) return null;
    let renderer;
    try { renderer = new T3.WebGLRenderer({ canvas: o.canvas, antialias: true, powerPreference: 'high-performance' }); } catch (e) { return null; }
    const W = o.W, t = o.tier, H = Math.round(W * (W < 560 ? .74 : .6)), wx = o.wx || { t: 'clear', n: 0 }, night = !!wx.n, snow = wx.t === 'snow', lit = night ? 1 : 1.15;
    renderer.setPixelRatio(o.dpr || 1); renderer.setSize(W, H, false); o.canvas.style.height = H + 'px';
    const scene = new T3.Scene(); scene.background = new T3.Color(night ? 0x04060b : 0x86b6e4);
    const camera = new T3.PerspectiveCamera(40, W / H, 1, 900), camMain = new T3.Vector3(0, 72, 128).multiplyScalar((W < 560 ? 1.14 : 1) * (t <= 2 ? .82 : t === 3 ? .92 : 1)), look = new T3.Vector3(0, t >= 4 ? 6 : 1, t >= 4 ? -9 : -3);
    const disposables = [];
    const tex = (cv, mip) => { const x = new T3.CanvasTexture(cv); if (mip) x.anisotropy = renderer.capabilities.getMaxAnisotropy(); else { x.generateMipmaps = false; x.minFilter = T3.LinearFilter; } disposables.push(x); return x; };
    const mat = p => { const m = new T3.MeshBasicMaterial(p); disposables.push(m); return m; };
    const add = (geo, m, x, y, z) => { const mesh = new T3.Mesh(geo, m); disposables.push(geo); if (x != null) mesh.position.set(x, y, z); scene.add(mesh); return mesh; };
    const cv2 = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
    const home = o.home, away = o.away;
    const dkHex = lum(home.c1) <= lum(home.c2) ? home.c1 : home.c2, ltHex = dkHex === home.c1 ? home.c2 : home.c1, inkHex = Math.abs(lum(dkHex) - lum(ltHex)) < 70 ? '#f3efe4' : ltHex;
    const DK = rgb(dkHex), LT = rgb(ltHex), H1 = rgb(home.c1), H2 = rgb(home.c2), A1 = rgb(away.c1), A2 = rgb(away.c2);

    /* ---- zemin ve saha ---- */
    const ground = new T3.PlaneGeometry(900, 900); ground.rotateX(-Math.PI / 2);
    add(ground, mat({ color: t <= 2 ? (night ? 0x0f2217 : 0x2c5a37) : (night ? 0x0b0f17 : 0x39424f) }), 0, -.3, 0);
    const apron = new T3.PlaneGeometry(2 * A0 + 13, 2 * B0 + 13); apron.rotateX(-Math.PI / 2);
    add(apron, mat({ color: snow ? 0xa9bbb7 : night ? 0x124526 : 0x1b6539 }), 0, -.05, 0);
    const [pc, pg] = cv2(2048, 1024);
    for (let i = 0; i < 12; i++) for (let j = 0; j < 6; j++) {
      const a = (i + j) % 2, b = i % 2;
      pg.fillStyle = snow ? (a ? '#e3ecea' : '#d5e0dd') : night ? (b ? (a ? '#2a8a50' : '#288249') : (a ? '#237a45' : '#21733f')) : (b ? (a ? '#34a862' : '#32a05c') : (a ? '#2d9656' : '#2b8f51'));
      pg.fillRect(i * 2048 / 12, j * 1024 / 6, 2048 / 12 + 1, 1024 / 6 + 1);
    }
    pg.strokeStyle = snow ? 'rgba(200,60,60,.9)' : 'rgba(255,255,255,.92)'; pg.lineWidth = 6; pg.fillStyle = pg.strokeStyle;
    const X = x => x * 2048, Y = y => y * 1024;
    pg.strokeRect(X(0) + 3, Y(0) + 3, 2048 - 6, 1024 - 6);
    pg.beginPath(); pg.moveTo(X(.5), 0); pg.lineTo(X(.5), 1024); pg.stroke();
    pg.beginPath(); pg.ellipse(X(.5), Y(.5), X(.0871), Y(.1346), 0, 0, 6.29); pg.stroke();
    pg.beginPath(); pg.arc(X(.5), Y(.5), 7, 0, 6.29); pg.fill();
    for (const sx of [0, 1]) {
      const d = sx ? -1 : 1, x0 = X(sx);
      pg.strokeRect(Math.min(x0, x0 + d * X(.157)), Y(.2035), X(.157), Y(.593));
      pg.strokeRect(Math.min(x0, x0 + d * X(.0524)), Y(.365), X(.0524), Y(.27));
      pg.beginPath(); pg.arc(x0 + d * X(.1048), Y(.5), 6, 0, 6.29); pg.fill();
      pg.beginPath(); pg.ellipse(x0 + d * X(.1048), Y(.5), X(.0871), Y(.1346), 0, sx ? 2.22 : -.92, sx ? 4.06 : .92); pg.stroke();
    }
    const pitchGeo = new T3.PlaneGeometry(2 * A0, 2 * B0); pitchGeo.rotateX(-Math.PI / 2);
    add(pitchGeo, mat({ map: tex(pc, true) }), 0, 0, 0);

    /* ---- tribün katları ---- */
    const CELL = 8, TW = 2048, TH = 256, tiers = [];
    const inc = (u, lower) => {
      if (!lower) return t >= 4 && !(u > .475 && u < .805);
      if (t >= 3) return true;
      if (t === 2) return u < SEG[1] || (u >= SEG[4] && u < SEG[5]);
      return (u > .04 && u < .24) || (u > .56 && u < .72);
    };
    function buildTier(lower, d0, h0, d1, h1, text) {
      const [nc, ng] = cv2(TW, TH), [tc, tg] = cv2(TW, TH), [cc, cg] = cv2(TW, TH);
      for (let i = 0; i < TW / CELL; i++) for (let j = 0; j < TH / CELL; j++) {
        const u = (i + .5) * CELL / TW, nearS = u > SEG[3] && u < SEG[6], farS = u < SEG[1], dim = (nearS ? .5 : farS ? 1 : .86) * lit, x = i * CELL, y = TH - (j + 1) * CELL;
        const awayB = !lower ? u > .3 && u < .41 : u > .31 && u < .36 && t < 4, aisle = i % 18 === 0;
        ng.fillStyle = '#080b11'; ng.fillRect(x, y, CELL, CELL); tg.fillStyle = '#080b11'; tg.fillRect(x, y, CELL, CELL);
        if (aisle) continue;
        if (Math.random() > o.fill * (awayB ? .85 : 1)) ng.fillStyle = shade([30, 36, 50], dim * .7);
        else { const pal = awayB ? [A1, A1, A2, [60, 68, 90]] : [H1, H1, H1, H2, H2, [216, 194, 168], [43, 49, 64], [84, 96, 122]]; ng.fillStyle = shade(pal[(Math.random() * pal.length) | 0], dim * (.8 + Math.random() * .3) * .42); }
        ng.fillRect(x, y, CELL - 1.2, CELL - 1.2);
        const tcol = awayB ? (Math.floor(i / 5 + j / 3) % 2 ? A1 : A2) : farS ? DK : nearS ? (Math.floor(i / 14) % 2 ? H1 : H2) : (Math.floor(j / 5 + (lower ? 0 : 1)) % 2 ? LT : DK);
        tg.fillStyle = Math.random() < .03 ? '#12161f' : shade(tcol, dim * (.84 + Math.random() * .26)); tg.fillRect(x, y, CELL - 1.2, CELL - 1.2);
      }
      if (text) {
        tg.fillStyle = inkHex; tg.textAlign = 'center'; tg.textBaseline = 'middle';
        tg.font = "800 190px 'Barlow Condensed', Impact, sans-serif";
        tg.fillText(text, TW * .14, TH * .54, TW * .23);
        tg.strokeStyle = 'rgba(8,11,17,.5)'; tg.lineWidth = 1.2; tg.beginPath();
        for (let x = 0; x < TW * .28; x += CELL) { tg.moveTo(x - .6, 0); tg.lineTo(x - .6, TH); }
        for (let y = 0; y < TH; y += CELL) { tg.moveTo(0, y - .6); tg.lineTo(TW * .28, y - .6); }
        tg.stroke();
      }
      const pos = [], uv = [];
      for (let i = 0; i < US.length - 1; i++) {
        const ua = US[i], ub = US[i + 1]; if (!inc((ua + ub) / 2, lower)) continue;
        const a0 = ring(ua, d0), b0 = ring(ub, d0), a1 = ring(ua, d1), b1 = ring(ub, d1);
        pos.push(a0[0], h0, a0[1], b0[0], h0, b0[1], b1[0], h1, b1[1], a0[0], h0, a0[1], b1[0], h1, b1[1], a1[0], h1, a1[1]);
        uv.push(ua, 0, ub, 0, ub, 1, ua, 0, ub, 1, ua, 1);
      }
      if (!pos.length) return;
      const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2));
      const map = tex(cc, true), mesh = add(geo, mat({ map, side: T3.DoubleSide }));
      tiers.push({ nc, tc, cc, cg, map, mesh, d0, h0, d1, h1, lower });
    }
    const up1 = home.name.split(' ')[0].toLocaleUpperCase('tr');
    buildTier(true, 7, 1.2, 25, 11, 'ÖLÜMÜNE ' + up1 + '!');
    buildTier(false, 27.5, 14.5, 48, 33, o.banner || 'BURASI ' + home.stadium.toLocaleUpperCase('tr'));
    // katlar arası alın ve arka duvar
    function band(d0, h0, d1, h1, color, filter) {
      const pos = [];
      for (let i = 0; i < US.length - 1; i++) {
        const ua = US[i], ub = US[i + 1]; if (!filter((ua + ub) / 2)) continue;
        const a0 = ring(ua, d0), b0 = ring(ub, d0), a1 = ring(ua, d1), b1 = ring(ub, d1);
        pos.push(a0[0], h0, a0[1], b0[0], h0, b0[1], b1[0], h1, b1[1], a0[0], h0, a0[1], b1[0], h1, b1[1], a1[0], h1, a1[1]);
      }
      if (!pos.length) return null;
      const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(pos, 3));
      return add(geo, mat({ color, side: T3.DoubleSide }));
    }
    band(4.5, 0, 7, 1.2, 0x10151f, u => inc(u, true));
    if (t >= 4) { band(25, 11, 27.5, 14.5, 0x0c1019, u => inc(u, false)); band(25.1, 11.6, 25.2, 12.6, night ? 0x3a5f8f : 0x9fb6d0, u => inc(u, false)); }
    const roofOn = u => u < .47 || u > .81;
    const lampPos = [];
    if (t >= 4) {
      band(48, 33, 61, 40.5, 0x161c27, roofOn);
      const seg = [];
      for (let u = 0; u < 1; u += .0075) {
        if (!roofOn(u) || !roofOn(u + .0075)) continue;
        const a = ring(u, 48.3), b = ring(u + .00375, 60.5), c = ring(u + .0075, 48.3);
        seg.push(a[0], 33.4, a[1], b[0], 40.6, b[1], b[0], 40.6, b[1], c[0], 33.4, c[1], a[0], 33.4, a[1], c[0], 33.4, c[1]);
      }
      const lg = new T3.BufferGeometry(); lg.setAttribute('position', new T3.Float32BufferAttribute(seg, 3)); disposables.push(lg);
      const lm = new T3.LineBasicMaterial({ color: 0xc9d3e0, transparent: true, opacity: .55 }); disposables.push(lm);
      scene.add(new T3.LineSegments(lg, lm));
      for (let u = .006; u < 1; u += .013) if (roofOn(u)) { const p = ring(u, 47.6); lampPos.push(p[0], 33.2, p[1]); if (Math.round(u / .013) % 3 === 0) { const q = ring(u, 59); lampPos.push(q[0], 40.2, q[1]); } }
    } else if (t === 3) for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const px = sx * (A0 + 30), pz = sz * (B0 + 30);
      add(new T3.BoxGeometry(.8, 34, .8), mat({ color: 0x1a202b }), px, 17, pz); add(new T3.BoxGeometry(7, 4, 1), mat({ color: 0x1a202b }), px, 35, pz);
      for (let k = -1; k <= 1; k++) lampPos.push(px + k * 2.2, 35, pz);
    }
    if (t <= 2) { // çevrede ağaçlar
      const g0 = new T3.SphereGeometry(4, 7, 5), m0 = mat({ color: night ? 0x143320 : 0x2c6a3c }), im = new T3.InstancedMesh(g0, m0, 70), mx = new T3.Matrix4();
      disposables.push(g0);
      for (let i = 0; i < 70; i++) { const a = Math.random() * 6.28, r = 85 + Math.random() * 90; mx.makeTranslation(Math.cos(a) * r * 1.3, 3 + Math.random() * 2, Math.sin(a) * r); im.setMatrixAt(i, mx); }
      scene.add(im);
    }
    // ışık lekesi dokusu, projektörler, flaşlar, meşaleler
    const [gc, gg] = cv2(64, 64);
    { const gr = gg.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,252,235,1)'); gr.addColorStop(.25, 'rgba(255,246,205,.55)'); gr.addColorStop(1, 'rgba(255,246,205,0)'); gg.fillStyle = gr; gg.fillRect(0, 0, 64, 64); }
    const glowTex = tex(gc);
    const points = (arr, size, color, opacity) => { const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(arr, 3)); const m = new T3.PointsMaterial({ map: glowTex, size, color, transparent: true, opacity, blending: T3.AdditiveBlending, depthWrite: false }); disposables.push(g, m); const p = new T3.Points(g, m); scene.add(p); return p; };
    const lamps = lampPos.length ? points(lampPos, 11, 0xffffff, night ? 1 : .35) : null;
    const flashN = 26, flash = points(new Array(flashN * 3).fill(0), 2.4, 0xffffff, .9);
    const flarePos = []; for (const u of [.05, .14, .23]) { const p = ring(u, 6.2); flarePos.push(p[0], 1.6, p[1]); }
    const flares = points(flarePos, 16, 0xff5040, 0);

    /* ---- reklam panoları, kaleler, kulübeler, tünel ---- */
    const [ac, ag] = cv2(1024, 16); const ads = [home.c1, '#f3efe4', home.c2, '#ffc93c'];
    for (let i = 0; i < 16; i++) { ag.fillStyle = ads[i % 4]; ag.fillRect(i * 64 + 2, 0, 60, 16); }
    const adMat = mat({ map: tex(ac) });
    add(new T3.BoxGeometry(2 * A0, 1.3, .4), adMat, 0, .65, -B0 - 3.4);
    add(new T3.BoxGeometry(.4, 1.3, 2 * B0), adMat, -A0 - 3.4, .65, 0); add(new T3.BoxGeometry(.4, 1.3, 2 * B0), adMat, A0 + 3.4, .65, 0);
    const [ntc, ntg] = cv2(128, 128); ntg.strokeStyle = 'rgba(255,255,255,.75)'; ntg.lineWidth = 2; for (let i = 0; i <= 128; i += 16) { ntg.beginPath(); ntg.moveTo(i, 0); ntg.lineTo(i, 128); ntg.moveTo(0, i); ntg.lineTo(128, i); ntg.stroke(); }
    const netMat = mat({ map: tex(ntc), transparent: true, side: T3.DoubleSide, depthWrite: false }), postMat = mat({ color: 0xffffff }), nets = [];
    for (const sx of [-1, 1]) {
      const gx = sx * A0, GW = 5.2, GH = 3.8, GD = 3.2;
      add(new T3.BoxGeometry(.35, GH, .35), postMat, gx, GH / 2, -GW); add(new T3.BoxGeometry(.35, GH, .35), postMat, gx, GH / 2, GW); add(new T3.BoxGeometry(.35, .35, 2 * GW + .35), postMat, gx, GH, 0);
      const grp = new T3.Group(); grp.position.set(gx, 0, 0); scene.add(grp);
      const back = new T3.Mesh(new T3.PlaneGeometry(2 * GW, GH), netMat); back.rotation.y = Math.PI / 2; back.position.set(sx * GD, GH / 2, 0);
      const top = new T3.Mesh(new T3.PlaneGeometry(GD, 2 * GW), netMat); top.rotation.x = -Math.PI / 2; top.position.set(sx * GD / 2, GH, 0);
      const s1 = new T3.Mesh(new T3.PlaneGeometry(GD, GH), netMat); s1.position.set(sx * GD / 2, GH / 2, -GW);
      const s2 = new T3.Mesh(new T3.PlaneGeometry(GD, GH), netMat); s2.position.set(sx * GD / 2, GH / 2, GW);
      for (const m of [back, top, s1, s2]) { disposables.push(m.geometry); grp.add(m); }
      nets.push(grp);
    }
    for (const sx of [-1, 1]) { add(new T3.BoxGeometry(24, 1.9, 2.6), mat({ color: 0x141b27 }), sx * 18, .95, B0 + 6.2); add(new T3.BoxGeometry(23, .9, .2), mat({ color: new T3.Color(home.c1) }), sx * 18, .75, B0 + 4.85); }
    const [tnc, tng] = cv2(64, 16); for (let i = 0; i < 6; i++) { tng.fillStyle = i % 2 ? home.c1 : home.c2; tng.fillRect(i * 64 / 6, 0, 64 / 6 + 1, 16); }
    add(new T3.BoxGeometry(4.4, 1.5, 12), mat({ map: tex(tnc) }), 0, .75, B0 + 10.5);

    /* ---- seremoni platformu ---- */
    const [dc, dg] = cv2(512, 512);
    const paintDisc = img => { dg.clearRect(0, 0, 512, 512); for (const [r, c] of [[250, '#f3efe4'], [182, home.c1], [128, '#f3efe4']]) { dg.beginPath(); dg.arc(256, 256, r, 0, 6.29); dg.fillStyle = c; dg.fill(); } if (img) dg.drawImage(img, 156, 156, 200, 200); };
    paintDisc(null);
    const discTex = tex(dc), discGeo = new T3.CircleGeometry(9.6, 48); discGeo.rotateX(-Math.PI / 2);
    const disc = add(discGeo, mat({ map: discTex, transparent: true, depthWrite: false }), 0, .08, 0);
    if (o.logo) { const done = () => { paintDisc(o.logo); discTex.needsUpdate = true; }; if (o.logo.complete && o.logo.naturalWidth) done(); else o.logo.addEventListener('load', done, { once: true }); }
    const dots = new T3.Group(), dotGeo = new T3.SphereGeometry(.75, 10, 8), dotMat = mat({ color: 0x58c4dd, transparent: true }); disposables.push(dotGeo);
    for (let k = 0; k < 18; k++) { const m = new T3.Mesh(dotGeo, dotMat); m.position.set(Math.cos(k / 18 * 6.283) * 11, .8, Math.sin(k / 18 * 6.283) * 11); dots.add(m); }
    scene.add(dots);

    /* ---- dev bayrak (sol tribün) ---- */
    const [fc, fg] = cv2(384, 256);
    fg.fillStyle = dkHex; fg.fillRect(0, 0, 384, 256); fg.fillStyle = ltHex; fg.beginPath(); fg.moveTo(0, 190); fg.lineTo(384, 50); fg.lineTo(384, 120); fg.lineTo(0, 256); fg.fill();
    fg.beginPath(); fg.arc(192, 128, 92, 0, 6.29); fg.fillStyle = '#f3efe4'; fg.fill(); fg.lineWidth = 10; fg.strokeStyle = dkHex; fg.stroke();
    fg.translate(192, 128); fg.rotate(-.35); fg.fillStyle = dkHex; fg.fillRect(-84, -30, 168, 60); fg.fillStyle = '#f3efe4'; fg.textAlign = 'center'; fg.textBaseline = 'middle'; fg.font = "800 54px 'Barlow Condensed', Impact, sans-serif"; fg.fillText(home.short, 0, 3);
    const FN = 18, FM_ = 8, flagGeo = new T3.PlaneGeometry(1, 1, FN, FM_), flag = t >= 3 ? add(flagGeo, mat({ map: tex(fc), side: T3.DoubleSide })) : null;
    if (!flag) disposables.push(flagGeo);
    const slope = Math.atan2(11 - 1.2, 25 - 7), fLen = t >= 4 ? 30 : 18, fWid = 26;
    function waveFlag(time, k) {
      const p = flagGeo.attributes.position;
      for (let j = 0; j <= FM_; j++) for (let i = 0; i <= FN; i++) {
        const a = i / FN, b = (1 - j / FM_) * k, dist = b * fLen, up = dist < 18 ? 1.2 + dist * Math.tan(slope) : 14.5 + (dist - 20.5) * .9;
        p.setXYZ(j * (FN + 1) + i, -A0 - 7 - dist, Math.max(1.2, up) + 1 + Math.sin(time * 2.6 + a * 7 + b * 3) * .7, (.5 - a) * fWid);
      }
      p.needsUpdate = true;
    }

    /* ---- kamera yardımcıları ---- */
    const v = new T3.Vector3(), tp = new T3.Vector3(), tl = new T3.Vector3(), cp = new T3.Vector3(), cl = new T3.Vector3();
    let ref = 1, first = true;
    const scr = (x, y, z) => { v.set(x, y, z).project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
    const proj = (x, y) => { const wxx = (x - .5) * 2 * A0, wz = (y - .5) * 2 * B0, a = scr(wxx, 0, wz), b = scr(wxx + 1, 0, wz); return { X: a[0], Y: a[1], s: Math.abs(b[0] - a[0]) / ref }; };
    let lastKey = '';
    const homeItems = FM.bannerTexts(home), bH = 58, bY = TH - bH - 4;
    function paintStandBanners(g) {
      g.globalAlpha = 1;
      if (inc(.14, true)) FM.paintBanners(g, TW * .006, bY, TW * (SEG[1] - .012), bH, home, homeItems, 2, false);
      if (inc(.64, true)) FM.paintBanners(g, TW * (SEG[4] + .02), bY, TW * (SEG[5] - SEG[4] - .04), bH, home, [homeItems[0], homeItems[2], homeItems[3]], 1, true);
      if (away && away.name && inc(.32, true)) FM.paintBanners(g, TW * .296, bY, TW * .05, bH, away, [FM.fansOf(away).toLocaleUpperCase('tr')], 0, false);
    }
    function compose(al, rv) {
      const key = al.toFixed(2) + '|' + rv.toFixed(2); if (key === lastKey) return; lastKey = key;
      for (const tr of tiers) {
        const g = tr.cg; g.globalAlpha = 1; g.drawImage(tr.nc, 0, 0);
        if (al > 0 && rv > 0) {
          g.save(); g.beginPath();
          const c = .14, hw = rv * .5;   // uzak tribün ortasından iki yana açılır
          for (const sh of [-1, 0, 1]) g.rect((c - hw + sh) * TW, 0, 2 * hw * TW, TH);
          g.clip(); g.globalAlpha = clamp(al, 0, 1); g.drawImage(tr.tc, 0, 0); g.restore();
        }
        if (tr.lower) paintStandBanners(g);
        tr.map.needsUpdate = true;
      }
    }
    /* a: { choreo, alpha, cheer:[ev,dep], disc, shake, shakeSide, cer (seremoni süresi ya da -1) } */
    function render(time, a) {
      const k = a.cer >= 0 ? 1 - clamp(a.cer / 3.6, 0, 1) : 0, e = k * k * (3 - 2 * k);
      const bx = ((a.bx == null ? .5 : a.bx) - .5) * 2 * A0, bz = ((a.by == null ? .5 : a.by) - .5) * 2 * B0;
      if (a.orbit != null) { tp.set(Math.sin(a.orbit) * 150, 78, Math.cos(a.orbit) * 150); tl.set(0, 4, 0); }
      else if (a.zoom) { tp.set(bx * .55, 26, bz + 52); tl.set(bx, 1.5, bz); }
      else if (a.cam === 1) { tp.set(0, 168, 46); tl.set(0, 0, -2); }
      else if (a.cam === 2) { tp.set(-128, 38, 0); tl.set(0, 0, 0); }
      else if (a.cam === 3) { tp.set(bx * .25, 22, 98); tl.set(bx * .35, 4, -4); }
      else { tp.set(camMain.x + Math.sin(time * .12) * 1.2 + e * 14, camMain.y + e * 34, camMain.z + e * 46); tl.copy(look); }
      const kk = first ? 1 : a.orbit != null ? 1 : .07; first = false;
      cp.lerp(tp, kk); cl.lerp(tl, kk);
      camera.position.copy(cp); camera.lookAt(cl);
      camera.updateMatrixWorld(); camera.updateProjectionMatrix();
      const p0 = scr(0, 0, B0), p1 = scr(1, 0, B0); ref = Math.abs(p1[0] - p0[0]) || 1;
      const ch = a.choreo || 0, al = a.alpha == null ? 1 : a.alpha, amp = Math.max(a.cheer[0], a.cheer[1] * .4);
      compose(ch > 0 ? al : 0, clamp(ch, 0, 1));
      for (const tr of tiers) tr.mesh.position.y = Math.abs(Math.sin(time * 9)) * amp * .45;
      if (flag) { const fk = clamp((ch - .45) / .45, 0, 1) * clamp((al - .5) * 4, 0, 1); flag.visible = fk > .01; if (flag.visible) waveFlag(time, fk); }
      if (lamps) lamps.material.opacity = (night ? .95 : .35) + Math.sin(time * 3) * .04;
      const fp = flash.geometry.attributes.position;
      for (let i = 0; i < flashN; i++) { const tr = tiers[(Math.random() * tiers.length) | 0]; if (!tr) break; let u = Math.random(); if (!inc(u, tr.lower)) u = .14; const f = Math.random(), q = ring(u, tr.d0 + (tr.d1 - tr.d0) * f); fp.setXYZ(i, q[0], tr.h0 + (tr.h1 - tr.h0) * f + .6, q[1]); }
      fp.needsUpdate = true;
      flares.material.opacity = t >= 2 && ((ch > .5 && al > .6) || a.cheer[0] > .5) ? .75 + Math.sin(time * 22) * .2 : 0;
      nets.forEach((n, i) => { n.scale.x = 1 + (a.shake > 0 && a.shakeSide === i ? Math.abs(Math.sin(time * 40)) * .35 * a.shake : 0); });
      const da = clamp(a.disc, 0, 1); disc.visible = dots.visible = da > .01; disc.material.opacity = da; dotMat.opacity = da; dots.rotation.y = time * .25;
      renderer.render(scene, camera);
      const f0 = scr(0, 0, -B0), n0 = scr(-A0, 0, B0), n1 = scr(A0, 0, B0);
      st.Hp = p0[1] - f0[1]; st.Wn = n1[0] - n0[0];
    }
    const sil = []; { const c = Math.max(3.6, W / 190); for (let row = 0; row < 3; row++) for (let x = (row % 2) * c * 1.7; x < W; x += c * 3.4) sil.push([x, H - (2 - row) * c * 2.7 - c * 1.3 + Math.random() * c, shade(Math.random() < .6 ? H1 : H2, .15 + row * .06 + Math.random() * .08), Math.random() < .55, c]); }
    function drawFx(ctx, time) {
      ctx.lineCap = 'round';
      for (const [x, y0, col, arms, c] of sil) {
        const y = y0 + Math.sin(time * 2.2 + x) * 1.2;
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, c * .8, 0, 6.29); ctx.fill(); ctx.fillRect(x - c, y + c * .6, c * 2, c * 4);
        if (arms) { ctx.strokeStyle = col; ctx.lineWidth = c * .55; ctx.beginPath(); ctx.moveTo(x - c * .8, y + c); ctx.lineTo(x - c * 1.6, y - c * 1.4); ctx.moveTo(x + c * .8, y + c); ctx.lineTo(x + c * 1.6, y - c * 1.4); ctx.stroke(); }
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
    function dispose() { for (const d of disposables) d.dispose(); renderer.dispose(); }
    const st = { gl: true, W, H, proj, Hp: H * .4, Wn: W * .7, c: Math.max(3.6, W / 190), tier: t, snow, night, render, drawFx, dispose };
    render(0, { choreo: 0, alpha: 1, cheer: [0, 0], disc: 1, shake: 0, shakeSide: 0, cer: 0 });
    return st;
  }
  FM.Stadium3D = { create };
})();
