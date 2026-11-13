/* Saha Kenarı — sabit veriler: kulüpler, isimler, dizilişler, spiker metinleri */
const FM = (typeof window !== 'undefined' ? window : globalThis).FM = {};

FM.TEAMS = [
  { name: 'Boğaziçi Yıldız',    short: 'BYZ', c1: '#c62839', c2: '#f6d55c', rep: 5, stadium: 'Yıldız Arena',        crest: [0, 0, 0] },
  { name: 'Karadeniz Fırtına',  short: 'KFR', c1: '#12355b', c2: '#58c4dd', rep: 5, stadium: 'Dalgakıran Stadı',    crest: [1, 2, 1] },
  { name: 'Ege Rüzgarı',        short: 'EGE', c1: '#1c7c8c', c2: '#f3efe4', rep: 4, stadium: 'İmbat Park',          crest: [2, 1, 0] },
  { name: 'Toros Kartalları',   short: 'TRS', c1: '#2b2d42', c2: '#e9c46a', rep: 4, stadium: 'Zirve Stadı',         crest: [0, 3, 1] },
  { name: 'Marmara Denizciler', short: 'MRD', c1: '#f4f1de', c2: '#1d3557', rep: 4, stadium: 'İskele Stadı',        crest: [1, 0, 0] },
  { name: 'Anadolu Atlıları',   short: 'AND', c1: '#e07a1f', c2: '#22223b', rep: 3, stadium: 'Bozkır Arena',        crest: [2, 2, 1] },
  { name: 'Akdeniz Narenciye',  short: 'AKD', c1: '#f4a020', c2: '#2a7f3e', rep: 3, stadium: 'Portakal Bahçesi',    crest: [1, 1, 1] },
  { name: 'Kapadokya Balon',    short: 'KPD', c1: '#8e3b6d', c2: '#f7c8a0', rep: 3, stadium: 'Peribacası Park',     crest: [0, 2, 0] },
  { name: 'Uludağ Zirve',       short: 'ULU', c1: '#2e8b57', c2: '#ffffff', rep: 2, stadium: 'Kar Stadı',           crest: [2, 0, 1] },
  { name: 'Trakya Güneş',       short: 'TRK', c1: '#f2c230', c2: '#7a1f1f', rep: 2, stadium: 'Ayçiçeği Stadı',      crest: [1, 3, 0] },
  { name: 'Fırat Gençlik',      short: 'FRT', c1: '#6a4c93', c2: '#ffd166', rep: 1, stadium: 'Nehir Stadı',         crest: [0, 1, 1] },
  { name: 'Nemrut Devleri',     short: 'NMR', c1: '#7d4f2a', c2: '#e8dcc4', rep: 1, stadium: 'Gündoğumu Stadı',     crest: [2, 3, 0] },
  { name: 'Göller Gücü',    short: 'GLG', c1: '#1f6f9c', c2: '#e6f1f5', rep: 2, div: 1, stadium: 'Kıyı Sahası',     crest: [1, 2, 0] },
  { name: 'Çukurova Pamuk', short: 'CKP', c1: '#f5f5f0', c2: '#3a7d44', rep: 2, div: 1, stadium: 'Tarla Stadı',     crest: [0, 0, 1] },
  { name: 'Van İnci',       short: 'VAN', c1: '#0f4c81', c2: '#f0e6c8', rep: 2, div: 1, stadium: 'Göl Kenarı',      crest: [2, 1, 0] },
  { name: 'Safran Kent',    short: 'SFK', c1: '#c0392b', c2: '#f4d35e', rep: 2, div: 1, stadium: 'Konak Stadı',     crest: [1, 3, 1] },
  { name: 'Likya Yolu',     short: 'LKY', c1: '#b5651d', c2: '#fdf0d5', rep: 2, div: 1, stadium: 'Antik Saha',      crest: [0, 3, 0] },
  { name: 'Kaçkar Yayla',   short: 'KCK', c1: '#256d3f', c2: '#d9ed92', rep: 1, div: 1, stadium: 'Yayla Sahası',    crest: [2, 0, 0] },
  { name: 'Bozcaada Bağ',   short: 'BZC', c1: '#5a189a', c2: '#e0aaff', rep: 1, div: 1, stadium: 'Bağ Yolu Sahası', crest: [1, 0, 1] },
  { name: 'Harran Kubbe',   short: 'HRN', c1: '#a47148', c2: '#2b2118', rep: 1, div: 1, stadium: 'Kubbe Sahası',    crest: [0, 2, 1] },
  { name: 'Ayder Şelale',   short: 'AYD', c1: '#168aad', c2: '#d9ed92', rep: 1, div: 1, stadium: 'Şelale Sahası',   crest: [2, 2, 0] },
  { name: 'Salda Mavi',     short: 'SLD', c1: '#48cae4', c2: '#03045e', rep: 1, div: 1, stadium: 'Beyaz Kum Sahası',crest: [1, 1, 0] },
  { name: 'Ihlara Vadi',    short: 'IHL', c1: '#606c38', c2: '#fefae0', rep: 1, div: 1, stadium: 'Vadi Sahası',     crest: [0, 1, 0] },
  { name: 'Kekova Batık',   short: 'KKV', c1: '#023e8a', c2: '#ffb703', rep: 1, div: 1, stadium: 'Liman Sahası',    crest: [2, 3, 1] }
];
FM.DIV_TR = ['Yıldızlar Ligi', 'Umut Ligi'];
FM.ROLE_TR = { GK: 'Kaleci', CB: 'Stoper', WB: 'Kanat bek', BW: 'Kesici', PM: 'Oyun kurucu', WG: 'Kanat', TF: 'Hedef forvet', SF: 'Hızlı forvet' };
FM.TRAITS = {
  fk: ['Frikik ustası', 'Serbest vuruşlarda çok daha tehlikeli.'], pen: ['Penaltıcı', 'Penaltılarda nadiren kaçırır.'],
  lead: ['Lider', 'Sahadayken tüm takımı yukarı çeker.'], glass: ['Sakatlığa yatkın', 'Daha sık sakatlanır.'],
  iron: ['Demir adam', 'Maçta daha az yorulur.'], big: ['Büyük maç oyuncusu', 'Kupa maçlarında daha iyi oynar.'],
  cool: ['Soğukkanlı', 'Gol pozisyonlarında daha isabetli.'], hot: ['Hırçın', 'Daha sık kart görür.']
};
FM.TAC = {
  press: ['Pres', ['Geride karşıla', 'Dengeli', 'Önde bas'], 'Önde baskı topu kazandırır ama yorar ve arkada boşluk bırakır.'],
  tempo: ['Tempo', ['Sabırlı', 'Normal', 'Yüksek'], 'Yüksek tempo daha çok pozisyon üretir, pozisyon kalitesi düşer.'],
  line: ['Savunma hattı', ['Derin', 'Normal', 'Önde'], 'Öndeki hat orta sahayı güçlendirir, arkaya atılan toplara açık kalır.'],
  width: ['Hücum yönü', ['Merkezden', 'Karma', 'Kanatlardan'], 'Kanat oyunu çok orta ve korner getirir; merkez oyunu daha net pozisyon.']
};
FM.CUP_ROUNDS = { 24: '1. Tur', 16: 'Son 16', 8: 'Çeyrek final', 4: 'Yarı final', 2: 'Final' };
FM.WX_TR = { clear: 'Açık', rain: 'Yağmurlu', snow: 'Karlı' };
FM.PRESS = [
  { q: 'Taraftar bu sezon sizden ne beklemeli?', a: [['Şampiyonluk için buradayız.', { fans: 6, board: -2 }], ['Adım adım ilerleyeceğiz.', { board: 2 }], ['Sahada cevap veririz.', { mor: 2 }]] },
  { q: 'Son maçtaki performansı nasıl değerlendiriyorsunuz?', a: [['Oyuncularım harikaydı.', { mor: 4 }], ['Daha iyisini yapmalıyız.', { mor: -2, board: 3 }], ['Hakem kararları belirleyici oldu.', { fans: 3, board: -3 }]] },
  { q: 'Transfer bütçesi yeterli mi?', a: [['Yönetim elinden geleni yapıyor.', { board: 4 }], ['Takviye şart.', { fans: 3, board: -4 }], ['Altyapımıza güveniyoruz.', { mor: 3 }]] },
  { q: 'Rakibiniz sizi küçümseyen açıklamalar yaptı. Cevabınız?', a: [['Cevabı sahada veririz.', { mor: 4, fans: 2 }], ['Bizi ilgilendirmiyor.', { board: 2 }], ['Onlar kendi işine baksın.', { fans: 5, mor: -1 }]] },
  { q: 'Genç oyunculara daha fazla şans verecek misiniz?', a: [['Hak eden oynar.', { mor: 2, board: 1 }], ['Gençler bu kulübün geleceği.', { fans: 4 }], ['Tecrübe şu an daha önemli.', { mor: -1, board: 2 }]] },
  { q: 'Tribünlerdeki atmosfer hakkında ne düşünüyorsunuz?', a: [['Taraftarımız on ikinci adamımız.', { fans: 7 }], ['Daha fazla desteğe ihtiyacımız var.', { fans: -4, mor: 1 }], ['Biz işimize bakıyoruz.', {}]] }
];
FM.ACH = {
  firstWin: ['İlk galibiyet', 'Bir resmî maç kazan.'], streak5: ['Seri başı', 'Üst üste 5 lig maçı kazan.'], unbeaten10: ['Yıkılmaz', '10 lig maçı yenilme.'],
  bigWin: ['Farka koştu', 'Bir maçı 5 veya daha fazla farkla kazan.'], hattrick: ['Hat-trick', 'Bir oyuncun tek maçta 3 gol atsın.'], giant: ['Dev avcısı', 'Senden en az 2 yıldız üstün bir takımı yen.'],
  champion: ['Şampiyon', 'Yıldızlar Ligi şampiyonu ol.'], cup: ['Kupa beyi', 'Kupayı kazan.'], double: ['Çifte kupa', 'Aynı sezon lig ve kupayı kazan.'],
  promoted: ['Yükseliş', 'Umut Ligi’nden yüksel.'], seller: ['Tüccar', 'Bir oyuncuyu 8 milyon veya üstüne sat.'], bank: ['Kasa dolu', 'Bütçeyi 30 milyonun üstüne çıkar.'],
  builder: ['İnşaatçı', 'Bir tesisi en üst seviyeye çıkar.'], loyal: ['Sadakat', '3 sezon tamamla.']
};

FM.FIRST = ['Ahmet','Mehmet','Mustafa','Emre','Burak','Can','Cem','Deniz','Efe','Eren','Furkan','Gökhan','Hakan','İbrahim','Kaan','Kerem','Levent','Mert','Murat','Oğuz','Onur','Ozan','Serkan','Sinan','Tolga','Umut','Volkan','Yiğit','Yusuf','Barış','Berk','Arda','Alper','Batuhan','Çağlar','Doruk','Enes','Halil','İlker','Koray','Tuna','Selim','Taylan','Uğur','Emir','Kuzey','Poyraz','Rüzgar','Atlas','Aras','Bora','Ege','Tarık','Erdem','Görkem','Utku','Sarp','Çınar','Anıl','Orhun'];
FM.LAST = ['Yılmaz','Kaya','Demir','Şahin','Çelik','Yıldız','Yıldırım','Öztürk','Aydın','Özdemir','Arslan','Doğan','Kılıç','Aslan','Çetin','Kara','Koç','Kurt','Özkan','Şimşek','Polat','Korkmaz','Aktaş','Bulut','Güneş','Tekin','Acar','Türkmen','Karaca','Sezer','Uçar','Tunç','Ateş','Yavuz','Keskin','Duman','Işık','Toprak','Çakır','Sarı','Akın','Özer','Tan','Baysal','Ermiş','Altın','Dinç','Soydan','Karataş','Eren','Bayram','Coşkun','Sönmez','Yalçın','Güven','Ekinci','Tuncer','Oral','Savaş','Uysal'];
FM.NAME_BLOCK = ['Burak Yılmaz','Umut Bulut','Mert Çetin','Yusuf Demir','Cem Özdemir','Emre Aydın','Murat Yıldırım','Hakan Arslan','Emre Kılıç','Volkan Demir','Ozan Tan'];

/* Diziliş slotları: [rol, x (0 kendi kale → 1 hücum), y (0 üst → 1 alt)] */
FM.FORMATIONS = {
  '4-4-2':   [['GK',0,.5],['DEF',.2,.14],['DEF',.16,.38],['DEF',.16,.62],['DEF',.2,.86],['MID',.52,.12],['MID',.46,.38],['MID',.46,.62],['MID',.52,.88],['FWD',.84,.38],['FWD',.84,.62]],
  '4-3-3':   [['GK',0,.5],['DEF',.2,.14],['DEF',.16,.38],['DEF',.16,.62],['DEF',.2,.86],['MID',.46,.28],['MID',.42,.5],['MID',.46,.72],['FWD',.8,.14],['FWD',.86,.5],['FWD',.8,.86]],
  '4-2-3-1': [['GK',0,.5],['DEF',.2,.14],['DEF',.16,.38],['DEF',.16,.62],['DEF',.2,.86],['MID',.38,.38],['MID',.38,.62],['MID',.62,.16],['MID',.64,.5],['MID',.62,.84],['FWD',.88,.5]],
  '3-5-2':   [['GK',0,.5],['DEF',.16,.26],['DEF',.14,.5],['DEF',.16,.74],['MID',.5,.08],['MID',.44,.32],['MID',.4,.5],['MID',.44,.68],['MID',.5,.92],['FWD',.84,.38],['FWD',.84,.62]],
  '5-3-2':   [['GK',0,.5],['DEF',.24,.08],['DEF',.16,.3],['DEF',.14,.5],['DEF',.16,.7],['DEF',.24,.92],['MID',.48,.28],['MID',.44,.5],['MID',.48,.72],['FWD',.84,.38],['FWD',.84,.62]]
};

FM.POS_TR = { GK: 'KL', DEF: 'DF', MID: 'OS', FWD: 'FV' };
FM.POS_LONG = { GK: 'Kaleci', DEF: 'Defans', MID: 'Orta saha', FWD: 'Forvet' };
FM.ATTR_TR = { pac: 'Hız', sho: 'Şut', pas: 'Pas', def: 'Savunma', phy: 'Fizik', gk: 'Kalecilik' };
FM.MENT_TR = ['Defansif', 'Dengeli', 'Hücum'];

FM.TXT = {
  goal: ['GOOOL! {p} topu ağlara gönderiyor!', '{p} vuruyor ve GOL! Kaleci çaresiz.', 'Ağlar havalanıyor! {p} şık bir vuruşla skoru değiştiriyor.', 'İnanılmaz bir bitiriş! {p} fileleri sarsıyor.'],
  assist: ['Asist {a} imzalı.', '{a} harika gördü.', 'Pas {a}\'dan geldi.'],
  save: ['{p} sert vuruyor ama {k} çıkarıyor!', '{k} uçuyor ve {p}\'nin şutunu kurtarıyor!', '{p} kaleciyle karşı karşıya… {k} duvar gibi!'],
  miss: ['{p} vuruyor, top auta gidiyor.', '{p} şansını deniyor ama top üstten dışarıda.', '{p} iyi pozisyonda, ama çerçeveyi bulamıyor.'],
  post: ['DİREK! {p} golü milimle kaçırıyor.', '{p}\'nin şutu direkten dönüyor!'],
  block: ['{p}\'nin şutu savunmaya çarpıyor, korner.', 'Son anda blok! {p} golü bulamıyor.'],
  yellow: ['Sarı kart: {p}. Sert bir müdahale.', '{p} taktik faul yapıyor ve sarı kart görüyor.'],
  red: ['KIRMIZI KART! {p} oyundan atılıyor.', '{p} ikinci sarıdan kırmızı kart görüyor!'],
  inj: ['{p} yerde kalıyor… Sakatlandı, devam edemeyecek.'],
  sub: ['Oyuncu değişikliği: {a} çıkıyor, {p} giriyor.'],
  pen: ['PENALTI! {p} topun başında…'], penGoal: ['{p} penaltıyı gole çeviriyor!'], penMiss: ['{p} penaltıyı kaçırıyor! {k} kurtardı!'],
  fkGoal: ['Frikikten GOL! {p} topu barajın üstünden ağlara yolluyor!'], fkSave: ['{p} frikiği kullanıyor, {k} köşeden çıkarıyor.'], fkMiss: ['{p} frikikten şansını deniyor, top az farkla dışarıda.'],
  ckGoal: ['Kornerden GOL! {a} ortalıyor, {p} kafayı vuruyor!'], ckSave: ['{a} korneri ortalıyor, {p} kafayı vuruyor ama {k} çıkarıyor.'], ckMiss: ['Korner: {p} yükseliyor, kafa vuruşu üstten dışarıda.'],
  et: ['Normal süre berabere bitti, uzatmalara gidiyoruz!'], pens: ['Uzatmalar da berabere. Seri penaltı atışları!'],
  ko: ['Hakem düdüğü çalıyor, maç başlıyor!'],
  ht: ['İlk yarı sona erdi.'],
  ft: ['Maç bitti!']
};
