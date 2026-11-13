# Saha Kenarı

Tarayıcıda çalışan, Türkçe bir futbol menajerlik oyunu. Kurulum gerektirmez: `index.html` dosyasını aç ya da klasörü herhangi bir statik sunucuyla yayınla (`python3 -m http.server`).

## Neler var

- 12 kurgusal kulüp, 22 haftalık lig, sezonlar arası yaşlanma, emeklilik ve gelişim
- Canvas üzerinde animasyonlu canlı maç: paslaşma, şut, kurtarış, direk, gol sevinci, konfeti, kartlar
- Maç içinde hız (1x/2x/4x), oyun anlayışı, 5 oyuncu değişikliği, "sonuca git"
- Kadro, 5 diziliş, dokunarak ilk 11 düzenleme
- Transfer pazarı (satın alma, pazarlık, satış, gelen teklifler), altyapı
- Antrenman odağı ve temposu, tesis geliştirme, finans, yönetim hedefi
- Otomatik kayıt (tarayıcının `localStorage` alanı)

## Dosyalar

| Yol | İçerik |
| --- | --- |
| `js/data.js` | Kulüpler, isimler, dizilişler, spiker metinleri |
| `js/core.js` | Oyun çekirdeği: maç motoru, lig, transfer, finans |
| `js/gfx.js` | Üretilen armalar, oyuncu portreleri, ikonlar, sentezlenen sesler |
| `js/matchview.js` | Canlı maç ekranı ve animasyonlar |
| `js/ui.js` | Ekranlar ve etkileşim |
| `assets/` | SVG görseller: logo, top, kupa, stadyum |
