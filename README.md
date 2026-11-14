# Saha Kenarı

Tarayıcıda çalışan, Türkçe bir futbol menajerlik oyunu. Kurulum gerektirmez: `index.html` dosyasını aç ya da klasörü herhangi bir statik sunucuyla yayınla (`python3 -m http.server`).

## Neler var

- İki lig (Yıldızlar Ligi ve Umut Ligi, 24 kurgusal kulüp), küme düşme ve yükselme, eleme usulü kupa (uzatma ve seri penaltılar)
- Canvas üzerinde animasyonlu canlı maç: paslaşma, şut, kurtarış, direk, penaltı, frikik, korner, gol sevinci, kartlar, hakemler; oyuncular hız sınırıyla koşar, top sürer, en yakın rakip baskı yapar; pozisyonlar topun bulunduğu yerden pas pas kurulur
- Three.js ile 3D, kadro değerine göre büyüyen 5 kademeli stadyum; maç öncesi seremoni ve ev sahibi tribün koreografisi (kart mozaiği, tribün yazısı, meşale)
- TV tarzı skor bandı: golde takım renginde GOOOL ve golcü şeridi
- Hava durumu (yağmur, kar, gece maçı), maç sonu gol tekrarı, oyuncu maç puanları ve maçın adamı
- Maç içinde hız, taktik talimatları (pres, tempo, savunma hattı, hücum yönü), 5 oyuncu değişikliği
- Diziliş, ilk 11, duran top görevlileri, oyuncu rolleri ve özel yetenekler
- Transfer dönemleri, pazarlık, serbest kalma bedeli, kiralama, sözleşme yenileme, scout raporları, altyapı
- Basın toplantıları, oyuncu görüşmeleri, yönetim güveni ve taraftar desteği, görevden alınma ve iş teklifleri
- Üst gezinme çubuğu (geri/ileri, bölümler, arama, tarih, Devam et), alt sekmeler ve kayan haber bandı
- Karar verilebilen gelen kutusu: teklifler, basın toplantıları, kulis bilgileri, soyunma odası, raporlar
- Kıta Kupası: 4 grup, çeyrek final, yarı final, final; yabancı kulüpler
- Rakibe özel maç planı (zayıf bölgeye yüklenme, adam adama markaj), ofsayt, top kapma, pas isabeti ve saha hâkimiyeti
- Oyuncu istekleri (forma, zam, ayrılık), verilen sözlerin takibi, maç sonu röportajları
- Teknik ekip, sakatlık türleri ve iğneyle oynatma, takım uyumu ve kaptanlık
- U19 altyapı takımı, sponsor anlaşması seçimi, bilet fiyatı
- Her kulübün taraftar grubu ve tribün pankartları (ortada taraftar grubu, yanlarda kulüp pankartları, köşede deplasman pankartı)
- Derbiler, sosyal akış, sezon ödülleri, istatistik merkezi (şut haritası, oyuncu karşılaştırma)
- VAR incelemeleri (gol iptali, penaltı kararı), kenarda tepki veren teknik direktörler, hakeme itiraz, teknik direktöre sarı/kırmızı kart ve men cezası; VAR anında köşede kuşbakışı tekrar ve ofsayt çizgisi
- Maçta 4 kamera açısı ve gol tekrarında yakın çekim; kulüp sayfasında döndürülebilir 3D stadyum
- Kulüp müzesi: kupalar, rekorlar, efsaneler, başarımlar
- Oyun menüsü: devam et, yeni kariyer, 3 kayıt yuvası, oyun içi menü; ayarlar (ses düzeyi, varsayılan maç hızı, 3D/2D stadyum, sakin mod, haber şeridi, otomatik kayıt, maç öncesi ekranı), rehber ve ilk kariyerde tanıtım turu
- Maç öncesi ekranı: iki takımın dizilişi perspektif sahada, forma seçimi, takım konuşması, rakip ve maç planı, maç öncesi basın toplantısı kısayolu
- Maçta devre arası soyunma odası konuşması ve 10 dakikalık kenardan talimatlar (“Bağır”)
- Basın salonu: kalıcı gazeteciler (yayın organı, tarz, ilişki), maç öncesi / maç sonrası / transfer sonrası çok sorulu toplantılar
- Sözleşme pazarlığı (transfer ve uzatma: maaş, süre, imza parası; menajerin sabrı sınırlı)
- Oyuncu kişilikleri ve soyunma odası grupları; oyuncu kariyer geçmişi; kulüpte 40+ maça çıkan efsaneler
- İzleme listesi ve profil bazlı scout görevi; gün gün antrenman takvimi; bireysel hedef ve mentörlük
- Kulüp sekmeleri: Tesisler (kampüs haritası ve yakınlaştırma, tesis seviyeleri ve etkileri, uzun vadeli projeler, yurt dışı akademi), Stadyum (koltuk deseni 3D tribünde görünür, bilet ve kombine fiyatı, stat adı sponsoru, stadyum adı ve büyütme), Forma ve sponsor (3 forma tasarımı maçta kullanılır, forma sponsoru), Maliye (sezonluk gelir-gider, yönetimden ek bütçe)
- Taraftar pankartları: 180 pankart 12 kategoride, kulübe göre tribün kimliği ve maç durumuna göre seçim; yönetim ve teknik direktör kötü gidiyorsa “YÖNETİM İSTİFA!” protestosu
- Fikstürde iç saha/deplasman sırası dengeli
- Maç raporu: şut başına gol beklentisi (xG), dakikalık xG grafiği, şut haritası, pas ağı, ısı haritası ve “Maçı ne belirledi?” özeti; maç sonunda ve ana sayfada açılır
- Oyuncu talimatları (öne çık, pas dağıt, önde bas, uzaktan şut) ve duran top organizasyonu (korner: ön direk / arka direk / kısa, frikik: direkt / ortala, baraj 3–5 kişi)
- Yardımcı antrenör: maç öncesi ekranında rakibe göre öneriler, devre arasında xG ve değişiklik tavsiyesi
- Sözleşme maddeleri: gol ve maç primi, serbest kalma bedeli (başka kulüp ödeyip alabilir), satıştan pay, takaslı transfer, satın alma opsiyonlu kiralık
- Takas teklifleri ve transfer söylentileri (söylenti fiyatı şişirir; kendi oyuncun için açıklama yaparsın)
- Kadro planlayıcı: 3 sezonluk mevki derinliği, biten sözleşmeler, yaşlanan oyuncular, U19 adayları ve takviye önerisi
- Sezon akışı: hazırlık kampı seçimi, dostluk maçları ve Yaz Kupası; milli aralar (davet, yorgunluk, sakatlık riski); kış arası kampı, yönetim toplantısı ve ara transfer önerisi
- Teknik direktör: itibar, seviye ve XP, yetenek ağacı (taktisyen, motivasyoncu, gençlik hocası, medya ustası), UEFA C/B/A/Pro lisans kursları, kariyer istatistikleri
- Diğer hocalar: kötü giden kulüplerde kovulmalar, başarılı hocaların büyük kulüplere geçmesi, basında atışmalar ve ezeli hasım
- Haftalık gazete (manşet, haberler, kulis, iki köşe yazarı) ve sezon sonu özel sayısı
- Kulübe özel ritimde sentezlenen tezahüratlar (gol ve derbi)
- Klavye kısayolları (? ile liste), kayıtlı transfer filtreleri, oyuncu notları, 4 oyunculuk karşılaştırma
- Takım penceresinde kafa kafaya geçmiş; kariyer sayfasında zaman çizelgesi
- Otomatik kayıt (tarayıcının `localStorage` alanı) ve kaydı metin olarak dışa/içe aktarma

## Dosyalar

| Yol | İçerik |
| --- | --- |
| `js/data.js` | Kulüpler, isimler, dizilişler, spiker metinleri |
| `js/core.js` | Oyun çekirdeği: maç motoru, lig, transfer, finans |
| `js/gfx.js` | Üretilen armalar, oyuncu portreleri, ikonlar, sentezlenen sesler |
| `js/career.js` | Kariyer sistemleri: pazarlık, kişilikler, scout, antrenman takvimi, mentörlük, tesisler, stadyum, sponsorlar, maliye |
| `js/press.js` | Basın toplantıları ve basın salonu çizimi |
| `js/banners.js` | Taraftar pankartları ve tribün protestoları |
| `js/settings.js` | Oyun ayarları |
| `js/depth.js` | Maç raporu ve xG, yardımcı önerileri, sözleşme maddeleri, takas ve söylentiler, kadro planlayıcı, sezon akışı, teknik direktör gelişimi, diğer hocalar, gazete |
| `js/depth-ui.js` | Bu sistemlerin ekranları ve klavye kısayolları |
| `js/ui-more.js` | Menü, rehber ve tur, maç öncesi ekranı, basın salonu ve yeni ekranlar |
| `js/boot.js` | Açılış |
| `js/stadium3d.js` | Three.js ile 3D stadyum (saha, tribünler, çatı, kaleler, bayrak) |
| `js/stadium.js` | WebGL olmayan cihazlar için 2D stadyum; kulüp sayfasındaki önizleme |
| `js/vendor/three.min.js` | Three.js r128 (MIT lisansı) |
| `js/matchview.js` | Canlı maç ekranı, seremoni ve animasyonlar |
| `js/ui.js` | Ekranlar ve etkileşim |
| `assets/` | SVG görseller: logo, top, kupa, stadyum |
