/* Saha Kenarı — oyun ayarları: ses, maç hızı, 3D stadyum, sakin mod (animasyonları azaltır), haber şeridi, rehber turu.
   Tarayıcıda saklanır; kariyer kayıtlarından bağımsızdır. */
(function () {
  const KEY = 'saha-kenari-ayarlar';
  const DEF = { vol: .7, speed: 1, gfx3d: true, pitchEngine: true, calm: false, ticker: true, tourDone: false, autoSave: true, prematch: true };
  let S = { ...DEF };
  try { S = { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { /* yok say */ }
  function apply() {
    if (FM.Audio && FM.Audio.setVol) FM.Audio.setVol(S.vol);
    document.documentElement.classList.toggle('calm', !!S.calm);
    document.documentElement.classList.toggle('no-ticker', !S.ticker);
  }
  function set(k, v) { S[k] = v; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* yok say */ } apply(); }
  FM.Settings = { get: k => S[k], set, apply, all: () => ({ ...S }), reset() { S = { ...DEF, tourDone: S.tourDone }; set('vol', S.vol); } };
  if (typeof document !== 'undefined') apply();
})();
