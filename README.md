# Saha Kenarı

Tarayıcıda çalışan, Türkçe bir futbol menajerlik oyunu. Kurulum gerektirmez: `index.html` dosyasını aç ya da klasörü herhangi bir statik sunucuyla yayınla (`python3 -m http.server`).

## Neler var

- İki lig (Yıldızlar Ligi ve Umut Ligi, 24 kurgusal kulüp), küme düşme ve yükselme, eleme usulü kupa (uzatma ve seri penaltılar)
- Canvas üzerinde animasyonlu canlı maç: paslaşma, şut, kurtarış, direk, penaltı, frikik, korner, gol sevinci, kartlar, hakemler
- Three.js ile 3D, kadro değerine göre büyüyen 5 kademeli stadyum; maç öncesi seremoni ve ev sahibi tribün koreografisi (kart mozaiği, tribün yazısı, meşale)
- TV tarzı skor bandı: golde takım renginde GOOOL ve golcü şeridi
- Hava durumu (yağmur, kar, gece maçı), maç sonu gol tekrarı, oyuncu maç puanları ve maçın adamı
- Maç içinde hız, taktik talimatları (pres, tempo, savunma hattı, hücum yönü), 5 oyuncu değişikliği
- Diziliş, ilk 11, duran top görevlileri, oyuncu rolleri ve özel yetenekler
- Transfer dönemleri, pazarlık, serbest kalma bedeli, kiralama, sözleşme yenileme, scout raporları, altyapı
- Gelen kutusu: yardımcı antrenör, sağlık ekibi, scout, finans direktörü, yönetim, gazeteciler ve menajerlerden gelen mesajlar; karar isteyen mesajlar (kulis bilgisi, soyunma odası krizi, süre isteyen oyuncu, transfer teklifleri, kiralık fırsatları, sponsor ve kulüp sahibi parası), arama ve filtreler
- Maç öncesi ekranı: iki takımın dizilişi perspektif sahada, forma seçimi (iç saha, deplasman, üçüncü), takım konuşması, rakip analizi, maç tarihi ve saati
- Takvim tarihi, “Devam et” düğmesi ve alt bantta kayan sonuç/haber şeridi
- Basın toplantıları: maç öncesi, maç sonrası ve önemli transferlerden sonra; çizimli basın salonu, kalıcı gazeteciler (yayın organı, tarz, seninle ilişkisi), çok sorulu toplantılar
- Oyuncu görüşmeleri, yönetim güveni ve taraftar desteği, görevden alınma ve iş teklifleri
- Kulüp müzesi: kupalar, rekorlar, efsaneler, başarımlar
- Oyun menüsü: devam et, yeni kariyer, 3 kayıt yuvası, ayarlar (ses, maç hızı, 3D/2D, sakin mod, haber şeridi, otomatik kayıt), rehber ve ilk kariyerde tanıtım turu
- Sözleşme pazarlığı: transferde ve sözleşme uzatmada menajerle maaş, süre ve imza parası görüşmesi; menajerin sabrı sınırlı
- Soyunma odası: oyuncu kişilikleri, takım uyumu, gruplar ve liderleri, kaptan seçimi; uyum maç gücünü etkiler
- Maç içinde devre arası konuşması ve 10 dakikalık kenardan talimatlar
- İzleme listesi ve profil bazlı scout görevleri; altyapı akademisi (her sezon alım günü, A takıma alma)
- Teknik ekip (yardımcı antrenör, kaleci antrenörü, fizyoterapist, baş scout) ve haftalık antrenman takvimi
- Finans: bilet fiyatı, sezonluk gelir-gider tablosu, yönetimden ek bütçe isteme
- Derbiler, Kıta Kupası (ligin ilk ikisi ve 8 yabancı kulüpten 6'sı), sezon ödülleri ve yılın 11'i, oyuncu kariyer geçmişi, kulüp efsaneleri, sosyal akış
- Bireysel hedef (oyuncuya özel çalışılacak özellik) ve mentörlük (tecrübeli oyuncu genci yanına alır, kişiliğini aktarabilir); kontenjanlar tesis seviyelerine bağlı
- Kulüp sayfası alt sekmeleri: Tesisler (kampüs haritası ve yakınlaştırma, 5 tesis + yurt dışı akademi, seviye etkileri, uzun vadeli projeler), Stadyum (koltuk deseni 3D tribünlerde görünür, bilet ve kombine fiyatı tahminleri, stat adı sponsoru, stadyum adı ve büyütme), Forma ve sponsor (3 forma tasarımı maçta kullanılır, forma sponsoru), Maliye, Müze ve kayıt
- Otomatik kayıt (tarayıcının `localStorage` alanı) ve kaydı metin olarak dışa/içe aktarma

## Dosyalar

| Yol | İçerik |
| --- | --- |
| `js/data.js` | Kulüpler, isimler, dizilişler, spiker metinleri |
| `js/core.js` | Oyun çekirdeği: maç motoru, lig, transfer, finans |
| `js/inbox.js` | Gelen kutusu: mesaj şablonları, kararlar ve etkileri, takvim |
| `js/press.js` | Basın toplantıları: gazeteciler, soru bankası, cevap etkileri, salon çizimi |
| `js/career.js` | Kariyer sistemleri: pazarlık, soyunma odası, scout, altyapı, teknik ekip, antrenman takvimi, finans, derbi, Kıta Kupası, ödüller, sosyal akış |
| `js/settings.js` | Oyun ayarları |
| `js/ui-more.js` | Oyun menüsü, ayarlar, rehber ve tur, yeni ekranlar |
| `js/club.js` | Kulüp yönetimi: tesisler ve kampüs haritası, stadyum, forma, sponsorlar |
| `js/boot.js` | Açılış |
| `js/gfx.js` | Üretilen armalar, oyuncu portreleri, ikonlar, sentezlenen sesler |
| `js/stadium3d.js` | Three.js ile 3D stadyum (saha, tribünler, çatı, kaleler, bayrak) |
| `js/stadium.js` | WebGL olmayan cihazlar için 2D stadyum; kulüp sayfasındaki önizleme |
| `js/vendor/three.min.js` | Three.js r128 (MIT lisansı) |
| `js/matchview.js` | Canlı maç ekranı, seremoni ve animasyonlar |
| `js/ui.js` | Ekranlar ve etkileşim |
| `assets/` | SVG görseller: logo, top, kupa, stadyum |
