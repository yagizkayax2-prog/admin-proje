/* Saha Kenarı — açılış: ayarları uygula, ana menüyü göster. Sayfa kapanırken açık kariyer kaydedilir. */
(function () {
  FM.Settings.apply();
  FM.ui.render();
  window.addEventListener('pagehide', () => { if (FM.G) { FM.forceSave = true; FM.save(); FM.forceSave = false; } });
})();
