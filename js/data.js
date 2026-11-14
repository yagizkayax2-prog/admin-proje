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
  width: ['Hücum yönü', ['Merkezden', 'Karma', 'Kanatlardan'], 'Kanat oyunu çok orta ve korner getirir; merkez oyunu daha net pozisyon.'],
  pass: ['Pas tercihi', ['Kısa pas', 'Karışık', 'Uzun top'], 'Kısa pas topu elde tutar ve isabeti artırır; uzun top hızlı ve direkt ama isabeti düşük, ofsayt riski yüksek.'],
  counter: ['Top kazanınca', ['Topu tut', 'Dengeli', 'Hızlı kontra'], 'Hızlı kontra, öne çıkmış rakibe karşı çok etkilidir; topu tutmak oyunu sakinleştirir.'],
  fb: ['Bekler', ['Geride kal', 'Dengeli', 'Bindirme'], 'Bindiren bekler kanat hücumuna sayı katar ama arkada boşluk bırakır ve yorulur.'],
  compact: ['Savunma genişliği', ['Dar', 'Normal', 'Geniş'], 'Dar blok merkezi kapatır ama kanat ortalarına açıktır; geniş blok kanatları kapatır.'],
  trap: ['Ofsayt taktiği', ['Kapalı', 'Ara sıra', 'Sürekli'], 'Hattı sık sık öne çıkarmak rakibi ofsayta düşürür; kırılırsa forvet kaleciyle karşı karşıya kalır.'],
  tackle: ['Müdahale', ['Dikkatli', 'Normal', 'Sert'], 'Sert müdahale daha çok top kazandırır ama faul ve kart getirir.']
};
FM.TAC_DEF = (t, k) => (t.id === (FM.G && FM.G.teamId) ? 1 : (t.id * 7 + k.length * 3) % 3);   // eksik talimat için varsayılan
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

/* ---------- Genişleme verileri: kıta kupası, rekabetler, sakatlıklar, teknik ekip, sosyal akış ---------- */
FM.FOREIGN = [
  { name: 'Rhein Adler',     short: 'RHA', c1: '#b3001b', c2: '#f5f5f5', rep: 5, stadium: 'Adler Park',        crest: [0, 1, 1] },
  { name: 'Nordhavn BK',     short: 'NHV', c1: '#0b3c5d', c2: '#f2c14e', rep: 4, stadium: 'Havn Stadion',      crest: [1, 0, 0] },
  { name: 'Costa Dorada CF', short: 'CDO', c1: '#e8a100', c2: '#1b1b3a', rep: 5, stadium: 'Estadi Daurat',     crest: [2, 2, 1] },
  { name: 'Lumière FC',      short: 'LUM', c1: '#1d2d50', c2: '#e63946', rep: 4, stadium: 'Parc Lumière',      crest: [0, 3, 0] },
  { name: 'Alpen United',    short: 'ALP', c1: '#2d6a4f', c2: '#f1faee', rep: 3, stadium: 'Gipfel Arena',      crest: [1, 3, 1] },
  { name: 'Danube Stars',    short: 'DNB', c1: '#3a0ca3', c2: '#f7b801', rep: 4, stadium: 'Duna Aréna',        crest: [2, 0, 0] },
  { name: 'Highland Rovers', short: 'HLR', c1: '#14532d', c2: '#fbbf24', rep: 3, stadium: 'Glen Park',         crest: [0, 2, 1] },
  { name: 'Adriatik Yıldız', short: 'ADR', c1: '#0077b6', c2: '#ffffff', rep: 4, stadium: 'Riva Stadion',      crest: [1, 1, 0] },
  { name: 'Porto Atlântico', short: 'PAT', c1: '#003049', c2: '#fcbf49', rep: 5, stadium: 'Estádio do Mar',    crest: [2, 1, 1] },
  { name: 'Vistula KS',      short: 'VIS', c1: '#9d0208', c2: '#e9ecef', rep: 3, stadium: 'Stadion Wiślany',   crest: [0, 0, 0] },
  { name: 'Baltık Deniz SK', short: 'BLT', c1: '#005f73', c2: '#ee9b00', rep: 3, stadium: 'Liman Arena',       crest: [1, 2, 1] },
  { name: 'Lombard Calcio',  short: 'LOM', c1: '#1b263b', c2: '#48cae4', rep: 4, stadium: 'Stadio del Naviglio', crest: [2, 3, 0] }
];
FM.FFIRST = ['Lukas', 'Mateo', 'Jonas', 'Hugo', 'Marco', 'Erik', 'Pedro', 'Luca', 'Adam', 'Noah', 'Felix', 'Diego', 'Nils', 'Rafael', 'Tomas', 'Viktor', 'Andrei', 'Milan', 'Oscar', 'Leon', 'Ivan', 'Bruno', 'Emil', 'Theo', 'Samuel', 'Kofi', 'Yann', 'Dario', 'Stefan', 'Mikel'];
FM.FLAST = ['Weber', 'Costa', 'Lindqvist', 'Moreau', 'Rossi', 'Novak', 'Ferreira', 'Brandt', 'Kowalski', 'Dubois', 'Marino', 'Hansen', 'Petrov', 'Silva', 'Keller', 'Jansen', 'Horvat', 'Santos', 'Bianchi', 'Nyberg', 'Laurent', 'Pavlov', 'Mensah', 'Okafor', 'Vidal', 'Fischer', 'Lopes', 'Berg', 'Marek', 'Dalton'];
FM.RIVALS = [[0, 1], [2, 6], [3, 5], [4, 9], [7, 11], [8, 10], [12, 14], [13, 15], [16, 17], [18, 22], [19, 23], [20, 21]];
FM.INJ = [['Kas zorlanması', 1, 2, 30], ['Ayak bileği burkulması', 1, 3, 26], ['Kas yırtığı', 3, 6, 22], ['Bağ zedelenmesi', 5, 9, 14], ['Kırık', 8, 14, 8]];
FM.STAFF = {
  coach: ['Yardımcı antrenör', 'Antrenmanda oyuncu gelişimini hızlandırır.', 600000],
  fitness: ['Kondisyoner', 'Oyuncular haftalar arasında daha hızlı dinlenir.', 500000],
  scout: ['Scout ekibi', 'Her seviye haftada bir oyuncu daha izletir.', 400000],
  physio: ['Fizyoterapist', 'Sakatlıkların süresini kısaltır.', 500000]
};
FM.PLAN_TR = ['Plan yok', 'Rakibin sol kanadına yüklen', 'Rakibin merkezine yüklen', 'Rakibin sağ kanadına yüklen'];
FM.EURO_ROUNDS = ['Grup · 1. maç', 'Grup · 2. maç', 'Grup · 3. maç', 'Çeyrek final', 'Yarı final', 'Final'];
FM.ACH.euro = ['Kıta fatihi', 'Kıta Kupası’nı kazan.'];
FM.ACH.derby = ['Derbi kralı', 'Bir derbiyi kazan.'];
FM.TXT.off = ['Ofsayt! {p} savunmanın arkasında yakalandı.', 'Yardımcı hakem bayrağı kaldırdı: {p} ofsaytta.'];
FM.TXT.tackle = ['{p} araya girdi, topu kaptı.', '{p} temiz bir müdahaleyle topu aldı.'];
FM.SOCIAL = {
  win: ['Bu takım bu sene çok başka! {t} ❤', 'Maç boyu baskı, hak edilmiş galibiyet. Helal olsun.', '{s} bugün sahanın en iyisiydi, alkış.', 'Hoca ne dediyse sahada o oldu. Devam!'],
  draw: ['Bir puan bir puandır ama bu maç alınırdı.', 'İkinci yarı düştük, hoca değişiklikte geç kaldı.', 'Kötünün iyisi. Haftaya telafi şart.'],
  loss: ['Bu oyunla bir yere varamayız. Yönetim uyansın.', 'Savunma yine dağıldı, kim sorumlu?', 'Hocaya güveniyorum ama sabrım azalıyor.', 'Tribün üstüne düşeni yaptı, takım yapmadı.'],
  headWin: ['{t} durdurulamıyor: {sc}', '{s} şov yaptı, {t} güldü', '{t} taraftarına bayram yaşattı'],
  headDraw: ['{t} puanı paylaştı: {sc}', 'Kazanan çıkmadı: {sc}'],
  headLoss: ['{t} için alarm: {sc}', '{t} dağıldı, taraftar tepkili', 'Kötü gece: {sc}'],
  rumor: ['{c}, {p} için nabız yokluyor.', '{p} ile {c} arasında görüşme iddiası.', 'Menajeri doğruladı: {p} teklifleri değerlendiriyor.'],
  names: [['Tribün Sesi', '@tribunsesi'], ['Kale Arkası', '@kalearkasi'], ['Forma Aşkı', '@formaaski'], ['Deplasman Yolcusu', '@deplasmanci'], ['Eski Açık', '@eskiacik'], ['Gece Maçı', '@gecemaci']],
  papers: ['Spor Postası', 'Saha Gazetesi', 'Maç Günü']
};

/* ---------- VAR ve teknik direktör itirazları ---------- */
FM.TXT.varWhy = ['ofsayt', 'elle oynama', 'hücumda faul'];
FM.TXT.varNo = ['{p} topu ağlara gönderdi ama VAR devreye girdi: {w}. Gol iptal!', 'VAR incelemesi: {p}\'nin golü {w} gerekçesiyle iptal edildi!'];
FM.TXT.mgrProt = ['{c}, {w} kararına sert tepki gösteriyor!', '{c} dördüncü hakemin üstüne yürüyor: {w} kararını kabul etmiyor.', '{c} kenarda çılgına döndü, {w} kararına itiraz ediyor.'];
FM.TXT.mgrYel = ['Hakem kenara geldi: {c} sarı kart gördü.'];
FM.TXT.mgrRed = ['KIRMIZI KART! {c} tribüne gönderildi.'];

/* ---------- Taraftar grupları (kurgusal) ---------- */
FM.FANS = ['Yıldız Tayfası', 'Fırtına Gençliği', 'İmbatçılar', 'Kartal Yuvası', 'Martılar', 'Bozkır Süvarileri', 'Portakal Çetesi', 'Peribacaları', 'Zirve Tayfası', 'Ayçiçekleri', 'Fırat Akıncıları', 'Gündoğanlar',
  'Kıyı Çocukları', 'Pamuk Eller', 'İnci Tayfası', 'Safran Ordusu', 'Likya Gezginleri', 'Yayla Kurtları', 'Bağ Bozumu', 'Kubbe Altı', 'Şelale Gençliği', 'Mavi Kumlar', 'Vadi Ruhu', 'Batık Şehir'];
FM.TEAMS.forEach((t, i) => { t.fans = FM.FANS[i]; });
['Adlerfront', 'Havnens Drenge', 'Penya Daurada', 'Brigade Lumière', 'Gipfelsturm', 'Duna Brigád', 'Glen Army', 'Riva Boys', 'Maré Azul', 'Vistula Front', 'Liman Tayfası', 'Curva Naviglio'].forEach((n, i) => { FM.FOREIGN[i].fans = n; });

/* ---------- Ek özellikler: başkan tipleri, milli takım rakipleri, tribün olayları, gol sevinçleri ---------- */
FM.PRES_T = {
  sabirsiz: ['Sabırsız', 'Hedefin bir sıra üstünü bekler; kötü gidişte güven hızlı düşer.', -1],
  yatirimci: ['Yatırımcı', 'Zaman zaman transfer bütçesine kendi cebinden ekleme yapar.', 0],
  tutumlu: ['Tutumlu', 'Ek bütçe pek vermez ama hedefleri makuldür.', 1],
  altyapici: ['Altyapıcı', 'Gençlere süre verildikçe memnun olur.', 0]
};
FM.NATIONS = [['Almanya', 80], ['Fransa', 81], ['İspanya', 80], ['İtalya', 78], ['Hollanda', 77], ['Portekiz', 78], ['Belçika', 75], ['Hırvatistan', 74], ['Danimarka', 72], ['İsviçre', 72], ['Polonya', 70], ['Avusturya', 70], ['Çekya', 69], ['Macaristan', 67], ['İskoçya', 67], ['Norveç', 70], ['Sırbistan', 69], ['Ukrayna', 69], ['Galler', 66], ['Yunanistan', 66]];
FM.TXT.flare = ['Tribünden sahaya meşale atıldı! Hakem maçı durdurdu.', 'Sahaya yabancı madde atılıyor, oyun durdu.'];
FM.TXT.invader = ['Bir taraftar sahaya girdi! Güvenlik peşinde.', 'Sahaya taraftar girdi, oyun bir süre durdu.'];
FM.CELEB = { corner: 'köşeye koştu', pile: 'takım arkadaşları üstüne çıktı', fans: 'tribüne koştu', slide: 'dizlerinin üstünde kaydı', flag: 'köşe bayrağında dans etti' };

/* ---------- Veri tabanı: ülkeler ve ligleri (kulüpler kurgusal, şehir adları uydurma) ---------- */
FM.CONTS = ['Avrupa', 'Asya', 'Afrika', 'Güney Amerika', 'Kuzey Amerika'];
FM.COUNTRIES = {
  TR: { n: 'Türkiye', cont: 'Avrupa', f: ['#e30a17', '#ffffff'], l: ['Yıldızlar Ligi', 'Umut Ligi'], base: true },
  DE: { n: 'Almanya', cont: 'Avrupa', f: ['#000000', '#dd0000', '#ffce00'], l: ['Almanya Birinci Lig', 'Almanya İkinci Lig'], rep: [5, 3], pre: ['FC', 'SV', 'TSV', 'VfL', 'Sportfreunde', 'Union'], suf: ['04', '1910', 'Kickers'],
    towns: ['Altenbrück', 'Kesselbach', 'Steinfeld', 'Wolfshagen', 'Lindenau', 'Mittelsee', 'Ostwald', 'Grünheim', 'Felsberg', 'Hochtal', 'Eichstadt', 'Brunnfeld', 'Haldenburg', 'Moosach', 'Rabenau', 'Tannwies', 'Erlenhof', 'Kronsfeld', 'Seebrück', 'Waldach', 'Ulmenrode', 'Sternau', 'Birkhain', 'Lerchental'] },
  EN: { n: 'İngiltere', cont: 'Avrupa', f: ['#ffffff', '#cf142b'], l: ['İngiltere Birinci Lig', 'İngiltere İkinci Lig'], rep: [5, 3], pre: [''], suf: ['United', 'Town', 'City', 'Rovers', 'Athletic', 'Wanderers', 'Albion'],
    towns: ['Ashbridge', 'Kingsmere', 'Holloway', 'Westbrook', 'Marlow Heath', 'Stonegate', 'Ravensby', 'Oakham Vale', 'Thornbury', 'Bramwell', 'Fenwick', 'Larkhill', 'Crowmarsh', 'Elmstead', 'Harrowfield', 'Lynwood', 'Saltmere', 'Northcote', 'Whitlock', 'Brackenford', 'Dunmore', 'Hartwell', 'Coldbrook', 'Ferrisby'] },
  ES: { n: 'İspanya', cont: 'Avrupa', f: ['#aa151b', '#f1bf00'], l: ['İspanya Birinci Lig', 'İspanya İkinci Lig'], rep: [5, 3], pre: ['CD', 'Real', 'UD', 'SD', 'Atlético', 'CF'], suf: ['', 'CF', 'Balompié'],
    towns: ['Valdemora', 'Sierra Alta', 'Puerto Blanco', 'Castronuevo', 'Alcarria', 'Montealbo', 'Riofrío', 'Villaverde Sur', 'Santa Lucía', 'Torreblanca', 'Navalcruz', 'Peñaroja', 'Almarén', 'Benicarde', 'Fuentesol', 'Lagunilla', 'Mirandela', 'Olivar', 'Robledo', 'Salinera', 'Tejada', 'Urbel', 'Valdecas', 'Zarzal'] },
  IT: { n: 'İtalya', cont: 'Avrupa', f: ['#009246', '#ffffff', '#ce2b37'], l: ['İtalya Birinci Lig', 'İtalya İkinci Lig'], rep: [5, 3], pre: ['AC', 'US', 'SS', 'Calcio', 'Virtus', 'Sporting'], suf: ['', '1906', 'Calcio'],
    towns: ['Montebello', 'Castelverde', 'Rocca Alta', 'San Vitale', 'Valdorso', 'Portonuovo', 'Ferrandina', 'Lagomare', 'Pietrasanta Alta', 'Borgoreale', 'Collefiore', 'Marinella', 'Altamura Bassa', 'Casalfiume', 'Doriano', 'Fontebianca', 'Grottalba', 'Isolella', 'Lucentina', 'Montorso', 'Nervina', 'Olmeto', 'Pianoro Nuovo', 'Ventimare'] },
  FR: { n: 'Fransa', cont: 'Avrupa', f: ['#0055a4', '#ffffff', '#ef4135'], l: ['Fransa Birinci Lig', 'Fransa İkinci Lig'], rep: [4, 2], pre: ['FC', 'AS', 'Olympique', 'Stade', 'US', 'RC'], suf: ['', 'FC'],
    towns: ['Belmont-sur-Loire', 'Valfleury', 'Saint-Aubin', 'Montclair', 'Bourgneuf', 'Clairvaux', 'Rochebrune', 'Lavernay', 'Castelmont', 'Pontvieux', 'Haut-Rivage', 'Mareuil', 'Aubeterre', 'Bellerive', 'Chantenay', 'Dampierre', 'Fontenelle', 'Granval', 'Lormont', 'Montverdun', 'Noirval', 'Roquefeuil', 'Sainte-Marine', 'Vauclerc'] },
  NL: { n: 'Hollanda', cont: 'Avrupa', f: ['#ae1c28', '#ffffff', '#21468b'], l: ['Hollanda Birinci Lig', 'Hollanda İkinci Lig'], rep: [4, 2], pre: ['FC', 'SC', 'VV', 'Go Ahead', 'Sparta'], suf: ['', 'Boys', '\'09'],
    towns: ['Westerdijk', 'Oosterveen', 'Hoogland', 'Lindewaard', 'Zeewolde Noord', 'Brakel', 'Dorrestein', 'Eemhaven', 'Grevelingen', 'Hollewaard', 'Kempenaar', 'Lisseveld', 'Moerkapelle', 'Noordhorn', 'Oudewater', 'Polderzicht', 'Riethoven', 'Schagerbrug', 'Twisk', 'Utingeradeel', 'Vlietland', 'Waardenburg', 'IJsselmonde', 'Zandhoven'] },
  PT: { n: 'Portekiz', cont: 'Avrupa', f: ['#006600', '#ff0000'], l: ['Portekiz Birinci Lig', 'Portekiz İkinci Lig'], rep: [4, 2], pre: ['SC', 'CD', 'GD', 'FC', 'Académica'], suf: ['', 'FC'],
    towns: ['Vila Serena', 'Porto Velho', 'Monte Alto', 'Ribeira Funda', 'Alvorada', 'Barreiro Novo', 'Castelo Branco Sul', 'Fontainhas', 'Lagoa Azul', 'Marinha', 'Nogueira', 'Oliveirinha', 'Pedrogão', 'Quintela', 'Rio Maior Norte', 'Santa Clara do Mar', 'Torre Nova', 'Valverde', 'Alfama Alta', 'Belmira', 'Carvalhal', 'Esmoriz', 'Gaivota', 'Ilhavo Sul'] },
  BE: { n: 'Belçika', cont: 'Avrupa', f: ['#000000', '#fdda24', '#ef3340'], l: ['Belçika Birinci Lig', 'Belçika İkinci Lig'], rep: [3, 2], pre: ['KV', 'RSC', 'KAA', 'Royal', 'SV'], suf: ['', 'FC'],
    towns: ['Waasmunster', 'Hoogstraten Oost', 'Lievegem', 'Meerhout', 'Oostkamp', 'Ronse Noord', 'Tielt Heide', 'Zandvliet', 'Beaumont', 'Chimay Sud', 'Durbuy', 'Florennes', 'Gembloux', 'Hannut', 'Jodoigne', 'Leuze', 'Marche', 'Neufchâteau', 'Perwez', 'Rochefort', 'Sombreffe', 'Tubize Ouest', 'Virton', 'Wavre Nord'] },
  JP: { n: 'Japonya', cont: 'Asya', f: ['#ffffff', '#bc002d'], l: ['Japonya Birinci Lig', 'Japonya İkinci Lig'], rep: [3, 1], pre: [''], suf: ['FC', 'United', 'Sakura', 'Blaze', 'Tide'],
    towns: ['Kitamura', 'Higashiyama', 'Minamisato', 'Aokawa', 'Shirahama', 'Takamori', 'Yamanaka', 'Kawaguchi Nishi', 'Matsubara', 'Nagisa', 'Oshiro', 'Sakuragi', 'Tsurugaoka', 'Umihara', 'Wakaba', 'Yoshino', 'Akatsuki', 'Fujimino', 'Hanazono', 'Ishikari Kita', 'Kazamori', 'Midorigawa', 'Nishiura', 'Senbonmatsu'] },
  SA: { n: 'Suudi Arabistan', cont: 'Asya', f: ['#006c35', '#ffffff'], l: ['Suudi Arabistan Birinci Lig', 'Suudi Arabistan İkinci Lig'], rep: [3, 1], pre: ['Al', 'Al', 'Al'], suf: ['Club', 'SC', ''],
    towns: ['Nakheel', 'Rimal', 'Wadi', 'Sahil', 'Qamar', 'Najm', 'Fajr', 'Sukoon', 'Badr', 'Hilm', 'Jazira', 'Karama', 'Manar', 'Noor', 'Rawda', 'Safa', 'Tal', 'Uruba', 'Wafa', 'Yarmuk Jadid', 'Zahra', 'Bayan', 'Diyar', 'Ghazal'] },
  EG: { n: 'Mısır', cont: 'Afrika', f: ['#ce1126', '#ffffff', '#000000'], l: ['Mısır Birinci Lig', 'Mısır İkinci Lig'], rep: [2, 1], pre: ['El', 'Nile', ''], suf: ['SC', 'FC', 'Club'],
    towns: ['Nil Kıyısı', 'Delta', 'Sahra', 'Vaha', 'Liman', 'Kızıldeniz', 'Piramit', 'Gizem', 'Altın Kum', 'Lotus', 'Papirüs', 'Sfenks', 'Hurma', 'Kervan', 'Yıldız Vadisi', 'Şafak', 'Rüzgâr', 'Kum Tepesi', 'Mercan', 'Nehir Ağzı', 'Taş Ocağı', 'Ufuk', 'Yeşil Vadi', 'Zeytin'] },
  MA: { n: 'Fas', cont: 'Afrika', f: ['#c1272d', '#006233'], l: ['Fas Birinci Lig', 'Fas İkinci Lig'], rep: [2, 1], pre: ['Ittihad', 'Chabab', 'Nahdat', 'Olympique', 'Hassania'], suf: [''],
    towns: ['Atlas', 'Sahil', 'Medine', 'Kasba', 'Ribat', 'Sous', 'Rif', 'Tafilalt', 'Draa', 'Ziz', 'Moulouya', 'Sebou', 'Tensift', 'Ourika', 'Ifrane Kuzey', 'Errachidia Yeni', 'Azrou', 'Midelt', 'Tinghir', 'Zagora', 'Taroudant', 'Essaouira Eski', 'Larache', 'Asilah'] },
  BR: { n: 'Brezilya', cont: 'Güney Amerika', f: ['#009c3b', '#ffdf00', '#002776'], l: ['Brezilya Birinci Lig', 'Brezilya İkinci Lig'], rep: [4, 2], pre: ['EC', 'SE', 'Atlético', 'Esporte Clube', 'Clube'], suf: ['', 'FC'],
    towns: ['Serra Azul', 'Rio Claro do Sul', 'Vila Bela', 'Porto Alegre do Norte', 'Campo Verde', 'Santa Rita', 'Boa Vista Nova', 'Cachoeira', 'Itapema', 'Juruá', 'Lagoa Santa', 'Maracajá', 'Nova Esperança', 'Ouro Branco', 'Palmeira do Sul', 'Quixadá', 'Rio Verde', 'São Bento', 'Taquara', 'Ubatuba', 'Vale Dourado', 'Xanxerê', 'Itaipava', 'Jacaré'] },
  AR: { n: 'Arjantin', cont: 'Güney Amerika', f: ['#74acdf', '#ffffff'], l: ['Arjantin Birinci Lig', 'Arjantin İkinci Lig'], rep: [4, 2], pre: ['Club Atlético', 'CA', 'Deportivo', 'Sportivo', 'Club'], suf: [''],
    towns: ['Villa Serena', 'Los Álamos', 'San Martín Sur', 'Puerto Viejo', 'La Pampa Alta', 'Río Hondo', 'Cerro Azul', 'Bahía Clara', 'Cañada Larga', 'Dolores Norte', 'El Ombú', 'General Paz', 'Huerta Grande', 'Junín Oeste', 'La Cumbre', 'Mar Chico', 'Nueva Pompeya', 'Olavarría Sur', 'Pergamino', 'Quilmes Alto', 'Ramallo', 'Salto Grande', 'Tandil Norte', 'Unquillo'] },
  US: { n: 'ABD', cont: 'Kuzey Amerika', f: ['#3c3b6e', '#ffffff', '#b22234'], l: ['ABD Birinci Lig', 'ABD İkinci Lig'], rep: [3, 1], pre: [''], suf: ['FC', 'SC', 'United', 'City', 'Galaxy', 'Fire'],
    towns: ['Cedar Falls', 'Red Rock', 'Bay Harbor', 'Silver Lake', 'Maple Grove', 'Stone Creek', 'Iron Ridge', 'Pine Valley', 'Clearwater Bay', 'Summit Hill', 'Riverbend', 'Eagle Point', 'Fox Hollow', 'Granite City', 'Harbor Springs', 'Juniper', 'Lakeshore', 'Mesa Verde', 'North Shore', 'Oak Creek', 'Prairie View', 'Sandpoint', 'Twin Rivers', 'Willow Park'] },
  MX: { n: 'Meksika', cont: 'Kuzey Amerika', f: ['#006847', '#ffffff', '#ce1126'], l: ['Meksika Birinci Lig', 'Meksika İkinci Lig'], rep: [3, 1], pre: ['Club', 'Deportivo', 'Atlético', 'Real'], suf: ['', 'FC'],
    towns: ['San Andrés', 'Valle Hermoso', 'Puerto Escondido Sur', 'Sierra Madre', 'Agua Clara', 'Cerro Verde', 'Las Palmas', 'Los Cabos Norte', 'Monte Real', 'Nuevo Laredo Oeste', 'Ocotlán', 'Pachuca Alta', 'Querétaro Viejo', 'Río Bravo', 'Santa Fe', 'Tlalpan', 'Uruapan', 'Villahermosa Norte', 'Xalapa Sur', 'Zacatlán', 'Atlixco', 'Bahía Azul', 'Celaya', 'Durango Viejo'] }
};
FM.FANS_G = ['Ultras', 'Tayfası', 'Ordusu', 'Gençliği', 'Kuzey Tribünü', 'Kartalları', 'Fırtınası'];

/* ---------- Ek ülkeler: şehir adları dile göre hecelerden üretilir (uydurma) ---------- */
(function () {
  const add = (cc, n, cont, f, rep, pre, suf, syl) => { FM.COUNTRIES[cc] = { n, cont, f, l: [n + ' Birinci Lig', n + ' İkinci Lig'], rep, pre, suf, syl }; };
  // Avrupa
  add('SC', 'İskoçya', 'Avrupa', ['#005eb8', '#ffffff'], [3, 2], ['', ''], ['FC', 'Athletic', 'Thistle', 'United'], [['Kil', 'Dun', 'Inver', 'Glen', 'Bal', 'Strath', 'Aber', 'Loch'], ['mar', 'ross', 'ock', 'ell', 'ach', 'ford', 'ton'], ['', 'ie', 'side', 'brae']]);
  add('AT', 'Avusturya', 'Avrupa', ['#ed2939', '#ffffff', '#ed2939'], [3, 2], ['SV', 'SK', 'FC', 'ASK'], [''], [['Stein', 'Wald', 'Berg', 'Hof', 'Lind', 'Grün', 'Hall', 'Kirch'], ['ach', 'au', 'en', 'ing', 'stätt'], ['', 'dorf', 'brunn', 'feld']]);
  add('CH', 'İsviçre', 'Avrupa', ['#da291c', '#ffffff'], [3, 2], ['FC', 'FC', 'SC', 'AC'], [''], [['Ror', 'Wil', 'Bel', 'Lau', 'Sion', 'Thun', 'Gren', 'Mor'], ['', 'en', 'dorf', 'ach', 'lis'], ['', 'berg', 'tal', 'ens']]);
  add('GR', 'Yunanistan', 'Avrupa', ['#0d5eaf', '#ffffff'], [3, 2], ['', 'Athlitikos', 'Omilos', 'Asteras'], ['FC', ''], [['Ana', 'Kala', 'Peri', 'Thes', 'Kori', 'Lefk', 'Mega', 'Ira'], ['po', 'ma', 'sto', 'ri', 'the'], ['lis', 'ra', 'nos', 'kio', 'ada']]);
  add('UA', 'Ukrayna', 'Avrupa', ['#0057b7', '#ffd700'], [3, 2], ['FK', 'SK', 'Dynamo', 'Avangard'], [''], [['Zhyto', 'Vyno', 'Kher', 'Pol', 'Myko', 'Bila', 'Sumy', 'Rivn'], ['myr', 'hra', 'son', 'tava', 'lai'], ['iv', 'e', 'ka', 'ske']]);
  add('PL', 'Polonya', 'Avrupa', ['#ffffff', '#dc143c'], [3, 2], ['KS', 'MKS', 'LKS', 'GKS', 'Olimpia'], [''], [['Brze', 'Kosz', 'Opo', 'Rado', 'Tar', 'Zie', 'Ostro', 'Ple'], ['lin', 'zów', 'nów', 'sko', 'ęcin'], ['', 'ek', 'ice', 'owo']]);
  add('CZ', 'Çekya', 'Avrupa', ['#ffffff', '#d7141a', '#11457e'], [3, 2], ['FK', 'SK', 'TJ', 'FC'], [''], [['Hrad', 'Jab', 'Ples', 'Tře', 'Zlín', 'Kol', 'Přer', 'Bud'], ['ec', 'lon', 'bí', 'nov', 'ín'], ['', 'ice', 'ov', 'any']]);
  add('HR', 'Hırvatistan', 'Avrupa', ['#ff0000', '#ffffff', '#171796'], [3, 2], ['NK', 'HNK', 'NK', 'HNK'], [''], [['Vara', 'Osi', 'Zad', 'Šibe', 'Kar', 'Sla', 'Vuko', 'Pula'], ['ž', 'je', 'ar', 'ni', 'lo'], ['din', 'k', 'ovac', 'ica']]);
  add('RS', 'Sırbistan', 'Avrupa', ['#c6363c', '#0c4076', '#ffffff'], [3, 2], ['FK', 'OFK', 'FK', 'Sloga'], [''], [['Novi', 'Kragu', 'Šaba', 'Valje', 'Čača', 'Lesko', 'Pan', 'Sombo'], ['', 'je', 'va', 'če'], ['vac', 'c', 'k', 'r']]);
  add('DK', 'Danimarka', 'Avrupa', ['#c8102e', '#ffffff'], [3, 2], ['', 'FC', 'IK', ''], ['IF', 'BK', 'FC', ''], [['Vej', 'Hor', 'Sil', 'Næst', 'Ran', 'Esb', 'Her', 'Lyng'], ['le', 'sens', 'ke', 'ved', 'ers'], ['', 'borg', 'by', 'høj']]);
  add('SE', 'İsveç', 'Avrupa', ['#006aa7', '#fecc02'], [3, 2], ['IFK', 'IF', 'BK', 'FF'], [''], [['Öster', 'Norr', 'Väs', 'Sunds', 'Kal', 'Halm', 'Öre', 'Lin'], ['sund', 'ås', 'vall', 'mar', 'stad'], ['', 'by', 'köping', 'holm']]);
  add('NO', 'Norveç', 'Avrupa', ['#ba0c2f', '#ffffff', '#00205b'], [3, 2], ['', 'IK', 'SK', 'FK'], ['IL', 'FK', 'BK'], [['Mol', 'Bod', 'Tromsø', 'Lille', 'Hauge', 'Sand', 'Strøm', 'Kristian'], ['de', 'ø', 'ham', 'sund', 'nes'], ['', 'mer', 'fjord', 'vik']]);
  add('RO', 'Romanya', 'Avrupa', ['#002b7f', '#fcd116', '#ce1126'], [3, 2], ['FC', 'CS', 'ACS', 'CSM'], [''], [['Cra', 'Pite', 'Bra', 'Galați', 'Plo', 'Tim', 'Arad', 'Sibi'], ['io', 'ș', 'și', 'va', 'ești'], ['va', 'ti', 'u', 'ana']]);
  // Asya ve Okyanusya
  add('KR', 'Güney Kore', 'Asya', ['#ffffff', '#cd2e3a', '#0047a0'], [3, 1], [''], ['FC', 'United', 'Citizen', 'City'], [['Gang', 'Chung', 'Jeon', 'Gyeong', 'Dae', 'Su', 'Pyeong', 'Mok'], ['won', 'ju', 'nam', 'buk', 'san'], ['', 'do', 'po', 'cheon']]);
  add('CN', 'Çin', 'Asya', ['#de2910', '#ffde00'], [3, 1], [''], ['FC', 'City', 'United', 'Dragons'], [['Hang', 'Xia', 'Chang', 'Kun', 'Nan', 'Shi', 'Dong', 'Yun'], ['zhou', 'men', 'sha', 'ming', 'jing'], ['', ' Xin', ' Bei', ' Hai']]);
  add('QA', 'Katar', 'Asya', ['#8a1538', '#ffffff'], [2, 1], ['Al', 'Al', 'Al'], ['SC', ''], [['Wak', 'Gha', 'Rayy', 'Sha', 'Kho', 'Mar', 'Duh', 'Arab'], ['ra', 'ra', 'ya', 'mal', 'khiya'], ['h', 'fa', 'n', 'i']]);
  add('AE', 'BAE', 'Asya', ['#00732f', '#ffffff', '#000000', '#ff0000'], [2, 1], ['Al', 'Al', 'Shabab Al'], ['Club', ''], [['Ain', 'Wah', 'Ajm', 'Fuj', 'Shar', 'Nasr', 'Was', 'Dhaf'], ['da', 'an', 'air', 'jah', 'l'], ['', 'ah', 'ra', 'i']]);
  add('IR', 'İran', 'Asya', ['#239f40', '#ffffff', '#da0000'], [3, 1], ['', 'Sanat', 'Shahr', 'Pars'], ['FC', ''], [['Esfa', 'Tabr', 'Shir', 'Mash', 'Kerm', 'Ahv', 'Rasht', 'Yaz'], ['han', 'iz', 'az', 'had', 'an'], ['', 'i', 'eh', 'ar']]);
  add('AU', 'Avustralya', 'Asya', ['#00008b', '#ffffff', '#ff0000'], [3, 1], [''], ['FC', 'City', 'United', 'Victory', 'Mariners'], [['Bris', 'Wollon', 'Gee', 'Bal', 'Towns', 'Cairn', 'Bun', 'Darwin'], ['bane', 'gong', 'long', 'larat', 'ville'], ['', ' Bay', ' Coast', ' Heights']]);
  add('ID', 'Endonezya', 'Asya', ['#ff0000', '#ffffff'], [2, 1], ['Persatuan', 'PS', 'Putra', 'Bintang', 'Garuda'], [''], [['Sura', 'Mada', 'Pale', 'Sema', 'Bali', 'Mala', 'Pada', 'Ponti'], ['ba', 'ra', 'ka', 'ngan', 'nak'], ['ya', 'n', 'ng', 'ra']]);
  // Afrika
  add('NG', 'Nijerya', 'Afrika', ['#008751', '#ffffff'], [2, 1], ['', 'Royal', 'Mighty', 'Warri'], ['United', 'FC', 'Pillars', 'Stars'], [['Aba', 'Ibad', 'Enu', 'Kad', 'Ilo', 'Owe', 'Maku', 'Lok'], ['kuta', 'an', 'gu', 'una', 'rin'], ['', 'ja', 'di', 'oja']]);
  add('GH', 'Gana', 'Afrika', ['#ce1126', '#fcd116', '#006b3f'], [2, 1], ['', 'Golden', 'Real', 'Ebusua'], ['FC', 'SC', 'Stars'], [['Kuma', 'Tama', 'Cape', 'Sekon', 'Ho', 'Kofori', 'Obu', 'Tema'], ['si', 'le', 'di', 'asi', 'du'], ['', 'a', 'na', 'm']]);
  add('ZA', 'Güney Afrika', 'Afrika', ['#007a4d', '#ffb612', '#de3831'], [3, 1], ['', 'Royal', 'Golden', 'Highland'], ['FC', 'City', 'United', 'Arrows', 'Stars'], [['Polo', 'Bloem', 'Kimber', 'Durban', 'Rusten', 'Nel', 'Mbom', 'Witbank'], ['kwane', 'fontein', 'ley', 'burg', 'spruit'], ['', ' North', ' Bay', ' Hills']]);
  add('TN', 'Tunus', 'Afrika', ['#e70013', '#ffffff'], [2, 1], ['CS', 'US', 'AS', 'ES', 'Stade'], [''], [['Sfa', 'Sous', 'Moni', 'Bizer', 'Gab', 'Kair', 'Nabe', 'Tozeu'], ['x', 'se', 'stir', 'te', 'ès'], ['', 'ouan', 'ul', 'r']]);
  add('DZ', 'Cezayir', 'Afrika', ['#006233', '#ffffff', '#d21034'], [2, 1], ['MC', 'JS', 'CR', 'ES', 'USM'], [''], [['Ora', 'Kons', 'Blida', 'Séti', 'Tlem', 'Biskra', 'Béja', 'Annaba'], ['n', 'tantine', '', 'f', 'cen'], ['', 'ia', 'ouz', 'i']]);
  add('SN', 'Senegal', 'Afrika', ['#00853f', '#fdef42', '#e31b23'], [2, 1], ['AS', 'US', 'ASC', 'Stade'], [''], [['Thi', 'Kao', 'Zigu', 'Saint', 'Rufis', 'Mbo', 'Louga', 'Tamba'], ['ès', 'lack', 'inchor', 'que', 'ur'], ['', 'a', 'counda', 'e']]);
  // Güney ve Kuzey Amerika
  add('CO', 'Kolombiya', 'Güney Amerika', ['#fcd116', '#003893', '#ce1126'], [3, 2], ['Atlético', 'Deportivo', 'Real', 'Cortuluá de', 'Unión'], [''], [['Pal', 'Mani', 'Pere', 'Tun', 'Monte', 'Barran', 'Cúcu', 'Ibag'], ['mira', 'zales', 'ira', 'ja', 'ría'], ['', ' Sur', ' Norte', 'quilla']]);
  add('CL', 'Şili', 'Güney Amerika', ['#0039a6', '#ffffff', '#d52b1e'], [3, 2], ['Club', 'Deportes', 'Unión', 'Atlético', 'Sportivo'], [''], [['Anto', 'Valdi', 'Talca', 'Chi', 'Ran', 'Curi', 'Copia', 'Iqui'], ['fagasta', 'via', 'huano', 'llán', 'cagua'], ['', ' Alto', ' Sur', 'po']]);
  add('UY', 'Uruguay', 'Güney Amerika', ['#0038a8', '#ffffff', '#fcd116'], [3, 2], ['Club', 'Atlético', 'Sportivo', 'Deportivo', 'Central'], [''], [['Salto', 'Paysan', 'Melo', 'Mina', 'Florida', 'Rivera', 'Durazno', 'Rocha'], ['', 'dú', ' Viejo', 's'], ['', ' Norte', ' Sur', ' Este']]);
  add('PE', 'Peru', 'Güney Amerika', ['#d91023', '#ffffff'], [2, 1], ['Club', 'Sporting', 'Atlético', 'Deportivo', 'Unión'], [''], [['Are', 'Truji', 'Chicla', 'Hua', 'Cus', 'Piu', 'Taca', 'Puno'], ['quipa', 'llo', 'yo', 'ncayo', 'co'], ['', ' Alto', ' Sur', 'ra']]);
  add('CA', 'Kanada', 'Kuzey Amerika', ['#ff0000', '#ffffff'], [2, 1], [''], ['FC', 'SC', 'United', 'City', 'Athletic'], [['Hali', 'Winni', 'Regi', 'Kelow', 'Sudbu', 'Monc', 'Saska', 'Thunder'], ['fax', 'peg', 'na', 'na', 'ry'], ['', ' Bay', ' Valley', 'ton']]);
  add('CR', 'Kosta Rika', 'Kuzey Amerika', ['#002b7f', '#ffffff', '#ce1126'], [2, 1], ['Club Sport', 'Deportivo', 'AD', 'Municipal'], [''], [['Here', 'Ala', 'Carta', 'Punta', 'Liberia', 'Limón', 'Grecia', 'Pérez'], ['dia', 'juela', 'go', 'renas', ''], ['', ' Norte', ' Sur', ' Viejo']]);
})();

/* ---------- Ülkeye özel oyuncu adları (dil gruplarına göre) ---------- */
FM.NAMEPOOLS = {
  de: [['Lukas', 'Jonas', 'Felix', 'Leon', 'Maximilian', 'Tim', 'Niklas', 'Jan', 'Moritz', 'Paul', 'Florian', 'Tobias', 'Julian', 'Sebastian', 'Kevin', 'Marco', 'Dominik', 'Fabian'], ['Müller', 'Schmidt', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Schulz', 'Koch', 'Richter', 'Klein', 'Wolf', 'Neumann', 'Braun', 'Zimmermann', 'Hartmann', 'Krüger', 'Lange', 'Vogel']],
  en: [['Jack', 'Harry', 'James', 'Oliver', 'George', 'Charlie', 'Thomas', 'Liam', 'Ryan', 'Callum', 'Connor', 'Daniel', 'Sam', 'Lewis', 'Jordan', 'Reece', 'Kieran', 'Ben'], ['Smith', 'Jones', 'Taylor', 'Brown', 'Wilson', 'Evans', 'Walker', 'Wright', 'Robinson', 'Hughes', 'Clarke', 'Hall', 'Wood', 'Turner', 'Cooper', 'Morris', 'Bennett', 'Graham']],
  es: [['Sergio', 'Pablo', 'Javier', 'Diego', 'Álvaro', 'Iker', 'Raúl', 'Mario', 'Adrián', 'Hugo', 'Marcos', 'Alejandro', 'Nicolás', 'Mateo', 'Santiago', 'Lucas', 'Martín', 'Gonzalo'], ['García', 'Rodríguez', 'Martínez', 'López', 'Sánchez', 'Pérez', 'Gómez', 'Díaz', 'Moreno', 'Romero', 'Navarro', 'Torres', 'Ruiz', 'Herrera', 'Castro', 'Vargas', 'Rojas', 'Silva']],
  it: [['Lorenzo', 'Matteo', 'Alessandro', 'Federico', 'Andrea', 'Riccardo', 'Davide', 'Simone', 'Nicolò', 'Gianluca', 'Marco', 'Stefano', 'Luca', 'Daniele', 'Fabio', 'Tommaso', 'Gabriele', 'Paolo'], ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Costa', 'Mancini', 'Lombardi', 'Moretti']],
  fr: [['Lucas', 'Hugo', 'Théo', 'Antoine', 'Maxime', 'Louis', 'Nathan', 'Mathis', 'Clément', 'Julien', 'Romain', 'Quentin', 'Baptiste', 'Yanis', 'Kylian', 'Ousmane', 'Moussa', 'Enzo'], ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garnier', 'Rousseau', 'Fontaine', 'Mercier', 'Blanc']],
  pt: [['João', 'Rafael', 'Tiago', 'Diogo', 'Gonçalo', 'Pedro', 'Bruno', 'Rúben', 'André', 'Gabriel', 'Lucas', 'Matheus', 'Thiago', 'Vinícius', 'Felipe', 'Gustavo', 'Caio', 'Renan'], ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Sousa', 'Fernandes', 'Gomes', 'Lopes', 'Carvalho', 'Almeida', 'Ribeiro', 'Barbosa', 'Araújo', 'Moura']],
  nl: [['Daan', 'Sem', 'Lars', 'Thijs', 'Bram', 'Ruben', 'Jesse', 'Stijn', 'Joris', 'Wout', 'Niels', 'Koen', 'Matthijs', 'Jasper', 'Teun', 'Milan', 'Arne', 'Jelle'], ['de Jong', 'Jansen', 'de Vries', 'van den Berg', 'Bakker', 'Visser', 'Smit', 'Meijer', 'Mulder', 'de Boer', 'Bos', 'Vos', 'Peeters', 'Maes', 'Claes', 'Willems', 'Janssens', 'Wouters']],
  nor: [['Erik', 'Lars', 'Magnus', 'Oskar', 'Emil', 'Viktor', 'Anders', 'Jonas', 'Mikkel', 'Rasmus', 'Kasper', 'Sander', 'Mathias', 'Henrik', 'Isak', 'Elias', 'Filip', 'Gustav'], ['Hansen', 'Johansson', 'Nielsen', 'Andersen', 'Larsen', 'Karlsson', 'Pedersen', 'Olsen', 'Lindqvist', 'Berg', 'Holm', 'Dahl', 'Strand', 'Lund', 'Nyberg', 'Eriksen', 'Solberg', 'Haugen']],
  sl: [['Jakub', 'Mateusz', 'Kamil', 'Tomáš', 'Ondřej', 'Luka', 'Ivan', 'Marko', 'Nikola', 'Stefan', 'Dmytro', 'Andriy', 'Oleksandr', 'Petar', 'Filip', 'Bartosz', 'Josip', 'Milan'], ['Kowalski', 'Nowak', 'Wiśniewski', 'Novák', 'Svoboda', 'Dvořák', 'Horvat', 'Kovačić', 'Babić', 'Jovanović', 'Petrović', 'Nikolić', 'Shevchenko', 'Kovalenko', 'Bondarenko', 'Lewandowski', 'Marić', 'Popović']],
  gr: [['Giorgos', 'Dimitris', 'Kostas', 'Nikos', 'Giannis', 'Christos', 'Vasilis', 'Panagiotis', 'Andreas', 'Petros'], ['Papadopoulos', 'Georgiou', 'Nikolaou', 'Karagiannis', 'Vlachos', 'Dimitriou', 'Makris', 'Oikonomou', 'Pappas', 'Antoniou']],
  ro: [['Andrei', 'Alexandru', 'Ionuț', 'Florin', 'Mihai', 'Răzvan', 'Cristian', 'Vlad', 'Bogdan', 'Darius'], ['Popescu', 'Ionescu', 'Stan', 'Dumitru', 'Munteanu', 'Constantin', 'Marin', 'Stoica', 'Rusu', 'Lungu']],
  jp: [['Takumi', 'Haruto', 'Yuto', 'Kaito', 'Sota', 'Ren', 'Daiki', 'Kenta', 'Ryota', 'Shota', 'Hiroki', 'Yuki'], ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida', 'Yamada']],
  kr: [['Min-jun', 'Seo-jun', 'Ji-ho', 'Hyun-woo', 'Jun-young', 'Dong-hyun', 'Sung-min', 'Jae-won', 'Tae-yang', 'Woo-jin'], ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim']],
  cn: [['Wei', 'Hao', 'Jun', 'Lei', 'Yang', 'Peng', 'Bo', 'Tao', 'Zhen', 'Xin'], ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Zhao', 'Huang', 'Zhou', 'Wu']],
  ar: [['Mohammed', 'Ahmed', 'Omar', 'Youssef', 'Khalid', 'Abdullah', 'Hassan', 'Ali', 'Karim', 'Sami', 'Fahad', 'Saad', 'Amine', 'Yacine', 'Riyad', 'Bilal'], ['Al-Harbi', 'Al-Qahtani', 'Al-Dosari', 'Mansour', 'Haddad', 'Saleh', 'Nasser', 'El-Sayed', 'Benali', 'Bensaid', 'Ziani', 'Brahimi', 'Hamdi', 'Trabelsi', 'Jaziri', 'Kamal']],
  ir: [['Ali', 'Reza', 'Mehdi', 'Amir', 'Sardar', 'Saeed', 'Hossein', 'Milad', 'Ehsan', 'Karim'], ['Karimi', 'Hosseini', 'Rezaei', 'Ahmadi', 'Moradi', 'Jafari', 'Rahimi', 'Ghasemi', 'Mohammadi', 'Azizi']],
  id: [['Budi', 'Agus', 'Rizky', 'Dimas', 'Fajar', 'Andi', 'Bayu', 'Yoga', 'Eko', 'Arif'], ['Santoso', 'Wijaya', 'Saputra', 'Hidayat', 'Pratama', 'Kurniawan', 'Setiawan', 'Nugroho', 'Gunawan', 'Siregar']],
  wa: [['Chinedu', 'Emeka', 'Kwame', 'Kofi', 'Samuel', 'Victor', 'Ibrahima', 'Moussa', 'Cheikh', 'Abdoulaye', 'Joseph', 'Daniel', 'Sadio', 'Thomas'], ['Okafor', 'Adeyemi', 'Mensah', 'Boateng', 'Asamoah', 'Diallo', 'Ndiaye', 'Sarr', 'Diop', 'Osei', 'Eze', 'Nwosu', 'Owusu', 'Faye']],
  za: [['Thabo', 'Sipho', 'Themba', 'Lebo', 'Bongani', 'Kagiso', 'Mandla', 'Ruan', 'Pieter', 'Teboho'], ['Nkosi', 'Dlamini', 'Mokoena', 'Zulu', 'Khumalo', 'Ndlovu', 'van Wyk', 'Botha', 'Mabaso', 'Shabalala']],
  au: [['Jack', 'Lachlan', 'Mitchell', 'Cooper', 'Riley', 'Harrison', 'Brandon', 'Josh', 'Liam', 'Nathan'], ['Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Mitchell', 'Kelly', 'Ryan', 'Campbell']]
};
FM.LANG = { DE: 'de', AT: 'de', CH: 'de', EN: 'en', SC: 'en', US: 'en', CA: 'en', AU: 'au', ES: 'es', AR: 'es', MX: 'es', CO: 'es', CL: 'es', UY: 'es', PE: 'es', CR: 'es', IT: 'it', FR: 'fr', BE: 'nl', NL: 'nl', PT: 'pt', BR: 'pt', DK: 'nor', SE: 'nor', NO: 'nor', PL: 'sl', CZ: 'sl', HR: 'sl', RS: 'sl', UA: 'sl', GR: 'gr', RO: 'ro', JP: 'jp', KR: 'kr', CN: 'cn', SA: 'ar', QA: 'ar', AE: 'ar', EG: 'ar', TN: 'ar', DZ: 'ar', MA: 'ar', IR: 'ir', ID: 'id', NG: 'wa', GH: 'wa', SN: 'wa', ZA: 'za', EU: 'mix' };
/* Ülke kuralları: maç kadrosunda en fazla yabancı oyuncu (yoksa sınırsız) */
FM.RULES = { TR: { fl: 8 }, EN: { fl: 11 }, ES: { fl: 5 }, IT: { fl: 6 }, DE: { fl: 11 }, FR: { fl: 6 }, RU: { fl: 6 }, SA: { fl: 8 }, QA: { fl: 6 }, AE: { fl: 6 }, CN: { fl: 5 }, JP: { fl: 5 }, KR: { fl: 4 }, US: { fl: 8 }, MX: { fl: 9 }, BR: { fl: 9 }, AR: { fl: 6 }, IR: { fl: 0 } };

/* ---------- Üçüncü lig: her ülkeye otomatik eklenir (isteğe bağlı kurulur) ---------- */
(function () {
  for (const cc in FM.COUNTRIES) {
    const C = FM.COUNTRIES[cc];
    if (C.l.length < 3) C.l.push(cc === 'TR' ? 'Gelecek Ligi' : C.n + ' Üçüncü Lig');
    if (C.rep && C.rep.length < 3) C.rep.push(Math.max(1, C.rep[1] - 1));
  }
  // Türkiye 3. lig kasabaları (uydurma, coğrafi heceler)
  FM.TR_TOWNS3 = ['Karaağaç', 'Yenipınar', 'Akçadere', 'Kızıltepe Ova', 'Sarıkaya', 'Göldere', 'Çamyaka', 'Taşoba', 'Yeşilkent', 'Ilıcabük', 'Çaykent', 'Akyurt Ova'];
})();
