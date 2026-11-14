# Saha Kenarı

Tarayıcıda çalışan, Türkçe bir futbol menajerlik oyunu. Kurulum gerektirmez: `index.html` dosyasını aç ya da klasörü herhangi bir statik sunucuyla yayınla (`python3 -m http.server`).

## Neler var

- İki lig (Yıldızlar Ligi ve Umut Ligi, 24 kurgusal kulüp), küme düşme ve yükselme, eleme usulü kupa (uzatma ve seri penaltılar)
- Canvas üzerinde animasyonlu canlı maç: paslaşma, şut, kurtarış, direk, penaltı, frikik, korner, gol sevinci, kartlar, hakemler; oyuncular forma, şort, çorap ve koşu animasyonuyla insan figürü olarak çizilir, hız sınırıyla koşar, top sürer, en yakın rakip baskı yapar; pozisyonlar topun bulunduğu yerden pas pas kurulur
- Three.js ile 3D, kadro değerine göre büyüyen 5 kademeli stadyum; maç öncesi seremoni ve ev sahibi tribün koreografisi (kart mozaiği, tribün yazısı, meşale)
- TV tarzı skor bandı: golde takım renginde GOOOL ve golcü şeridi
- Hava durumu (yağmur, kar, gece maçı), maç sonu gol tekrarı, oyuncu maç puanları ve maçın adamı
- Maç içinde hız, taktik talimatları (pres, tempo, savunma hattı, hücum yönü, pas tercihi, top kazanınca, bekler, savunma genişliği, ofsayt taktiği, müdahale), 5 oyuncu değişikliği; talimatlar hem maç motorunu hem sahadaki hareketi değiştirir (bek bindirmesi, kontra koşuları, dar blok, hattı öne çıkarma, iki kişilik baskı)
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
- Başkan tipleri ve iki sezonda bir başkanlık seçimi; tesis yükseltmeleri haftalarca süren inşaatla tamamlanır (stadyum inşaatında kapasite düşer)
- Forma ve mağaza geliri (yıldız transferinde satış patlaması); havanın oyuna etkisi (yağmurda kaygan zemin, karda yavaş oyun) ve zemin kalitesine bağlı sakatlık riski
- Kulüp göreviyle birlikte milli takımı çalıştırma: milli ara maçları, Kıta Şampiyonası, federasyon güveni
- Tünel sahnesi, gol sevinci çeşitleri, meşale ve sahaya giren taraftar olayları; ev sahibi tribün olaylarında para cezası ve kapalı tribün
- Haftanın 11'i ve haftanın golü oylaması
- Maç akışı: oyun dakikası ~1,15 sn; kendi yarısında sabırlı kurulum, orta sahada ileri pas, son bölümde dolaştırma; pozisyon öncesi topu kazanma ve kısa paslarla ilerleme; oyuncu animasyonları (vuruş, plonjon, kayarak müdahale, kafa için sıçrama, gol sevinci, üzüntü)
- Yeni kariyer sihirbazı: veri tabanı kurulumu (48 ülke, her ülkenin liglerini tek tek ekleme ve çıkarma, oynanabilir ya da yalnızca izle, futbolcu sayısı, oyun hızı ve kayıt boyutu tahmini), takım seçme ekranı (kulüp profili, formalar, kültür, tesisler, rakipler, yönetim beklentisi) ve menajer profili; her ülkede ayrı lig, düşme-yükselme ve kupa
- Her ülkede 3 lig (üçüncü lig isteğe bağlı): lider doğrudan yükselir, 2–5. sıradakiler play-off oynar (yarı final + final), son iki düşer
- Ülkeye göre oyuncu adları ve uyruk (her kadroda ~%15 yabancı); yabancı oyuncu sınırı ülke kuralına göre; başka ülkeye gelen oyuncu 8 hafta uyum sürecinde
- Ülkeler arası transfer: pazarda ülke/kıta filtresi, kıta başına scout ağı (ağ olmayan kıtada güç tahmini daha belirsiz, scout daha pahalı)
- Daha akıllı yapay zekâ kulüpleri: en zayıf mevkiye, bütçeye ve yabancı sınırına göre transfer; bazen yurt dışından alım; her sezon altyapıdan 1–2 genç
- Zorluk seviyeleri (Kolay / Normal / Zor) ve başlangıç türü: kulüple, kulüp + milli takımla ya da işsiz başla (açık pozisyonlara başvuru ve 3 soruluk mülakat; kovulunca da başvurulabilir)
- Dünya → Ülke sekmesi: milli takım (uyruğa göre aday kadro, yurt dışındakiler dahil), ülkenin ligleri, yabancı kuralı
- Oyuncu kariyer grafiği (sezonlara göre güç ve gol) ve kulüp tarihi grafiği (sezonlara göre lig sırası)
- Maçta top fiziği (görsel): sürtünmeyle yavaşlayan yerden pas, yerçekimli havadan top ve sekme, uzun topta falso, sahipsiz topun yuvarlanması
- Sesler: kaçan pozisyonda tribünün "ooo"su, kurtarışa alkış, direğe metalik tını, topun yerine göre yükselen kalabalık uğultusu, davullu ve 9 farklı ritimde tezahürat
- İşsizken ve yalnız milli takım kariyerinde zaman akar: "Haftayı geçir" ile ligler oynanır, yeni ilanlar açılır, milli aralar ve Kıta Şampiyonası gelir; sezon sonunda iş garantisi
- Canlı transfer piyasası: gelen tekliflerde teklif savaşı, son gün uyarısı, aldığın oyuncu için rakip kulüple açık artırma (teklifi artır ya da çekil)
- Ekonomi: tesis ve stadyum bakım gideri, alımda %5 menajer ücreti, satışta %10 vergi, her sezon %4 maaş artışı, kasada aşırı birikimin bir kısmını yönetim alır
- Kıta Kupası tüm kurulu ülkelerden: her ülkenin üst ligindeki ilk 2–3 kulüp (büyük liglerden 3), boşluklar Avrupa kulüpleriyle dolar
- Özel çalışma: oyuncuya özellik (8–12 hafta) ya da yeni rol (5 hafta) öğret; kiralıktaki oyuncuların maç, gol, puan ve güç gelişimi takibi, 4 haftada bir rapor
- Maç motoru ile görüntü bağı: topun son üçte birde geçirdiği süre pozisyon üretimini etkiler; oyun anlayışı değişince takım sahada görünür biçimde öne çıkar ya da geri çekilir, sahada taktik şeridi belirir
- Spiker metinleri iki katından fazla çeşitlendi
- Onur listesi: kupalar, çalıştırılan kulüpler, en çok maça çıkardığın oyuncular, başarımlar
- Kaydı dosya olarak indirme (dışa aktarma penceresi) ve dosyadan yükleme; takım seçme ekranında döndürülebilir 3D stadyum önizlemesi
- Sahaya dayalı maç motoru (canlı izlenen maçlarda): açık oyun pozisyonları oyuncuların yerleşiminden doğar; şut kararı sahadaki konuma, gol beklentisi kaleye uzaklık, açı ve çevredeki rakip sayısına göre hesaplanır, pas kesilme olasılığı pasörün pası ile en yakın rakibin savunmasına bağlıdır; topa sahip olma oranı sahadan ölçülür. Duran toplar ve "Sonuca git" sonrası dakikalar istatistiksel motordan gelir; ayarlardan kapatılabilir
- Oyuncu menajerleri: dört menajer tipi (makul, sert, açgözlü, kulübe yakın), tipe göre komisyon ve maaş talebi, zam tehditleri, sözleşmesi biten oyuncunun başka kulüple ön sözleşme imzalaması
- Kulüp sahipliği: dört sahip tipi (üye kulübü, yerel iş insanı, yatırım grubu, devlet destekli fon); satın alma teklifleri ve teknik direktörün tavrı, yeni sahiple gelen bütçe ve beklenti, sabırsız sahipte daha hızlı düşen yönetim güveni
- Sağlık ekibi (Takım → Sağlık): oyuncu başına sakatlık riski (kondisyon, yaş, maç yükü, yatkınlık, maç eksikliği, antrenman temposu), dinlendirme, aşırı yüklenme sakatlıkları ve uyarılar
- Altyapı derinliği: 12 takımlı U19 ligi, 19. haftada U19 Kupası (kazanınca gençlerin potansiyeli artar), farklı uzmanlıkta altyapı hocası seçimi
- Sıkıştırılmış kayıt (LZ, ~10 kat küçük): büyük veri tabanları da tarayıcıya sığar
- Otomatik kayıt (tarayıcının `localStorage` alanı) ve kaydı metin olarak dışa/içe aktarma

## Dosyalar

| Yol | İçerik |
| --- | --- |
| `js/global.js` | Dünya katmanı: zorluk, işsiz başlangıç ve mülakat, scout ağı, kariyer ve kulüp geçmişi |
| `js/global-ui.js` | Dünya katmanının ekranları: iş ekranı, Ülke sekmesi, pazar filtresi, grafikler |
| `js/club.js` | Kulüp çevresi: menajerler, kulüp sahipliği, sağlık ekibi, U19 ligi ve altyapı hocası |
| `js/club-ui.js` | Sağlık sekmesi, sahip kartı, U19 ekranı |
| `js/data.js` | Kulüpler, isimler, dizilişler, spiker metinleri |
| `js/core.js` | Oyun çekirdeği: maç motoru, lig, transfer, finans |
| `js/gfx.js` | Üretilen armalar, oyuncu portreleri, ikonlar, sentezlenen sesler |
| `js/career.js` | Kariyer sistemleri: pazarlık, kişilikler, scout, antrenman takvimi, mentörlük, tesisler, stadyum, sponsorlar, maliye |
| `js/press.js` | Basın toplantıları ve basın salonu çizimi |
| `js/banners.js` | Taraftar pankartları ve tribün protestoları |
| `js/settings.js` | Oyun ayarları |
| `js/depth.js` | Maç raporu ve xG, yardımcı önerileri, sözleşme maddeleri, takas ve söylentiler, kadro planlayıcı, sezon akışı, teknik direktör gelişimi, diğer hocalar, gazete |
| `js/extras.js` | Başkan ve seçimler, süreli inşaat, forma geliri, milli takım görevi, tribün olaylarında disiplin, haftanın 11'i ve golü |
| `js/extras-ui.js` | Bu eklerin ekranları (başkan, inşaat, milli takım, haftanın 11'i ve golü) |
| `js/world.js` | Veri tabanı: ülkelerin kurgusal kulüpleri ve kulüp profilleri |
| `js/setup-ui.js` | Yeni kariyer sihirbazı: veri tabanı kurulumu, takım seç, menajer profili |
| `js/depth-ui.js` | Bu sistemlerin ekranları ve klavye kısayolları |
| `js/ui-more.js` | Menü, rehber ve tur, maç öncesi ekranı, basın salonu ve yeni ekranlar |
| `js/boot.js` | Açılış |
| `js/stadium3d.js` | Three.js ile 3D stadyum (saha, tribünler, çatı, kaleler, bayrak) |
| `js/stadium.js` | WebGL olmayan cihazlar için 2D stadyum; kulüp sayfasındaki önizleme |
| `js/vendor/three.min.js` | Three.js r128 (MIT lisansı) |
| `js/matchview.js` | Canlı maç ekranı, seremoni ve animasyonlar |
| `js/ui.js` | Ekranlar ve etkileşim |
| `assets/` | SVG görseller: logo, top, kupa, stadyum |
