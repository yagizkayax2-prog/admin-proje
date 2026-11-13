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
  { name: 'Nemrut Devleri',     short: 'NMR', c1: '#7d4f2a', c2: '#e8dcc4', rep: 1, stadium: 'Gündoğumu Stadı',     crest: [2, 3, 0] }
];

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
  ko: ['Hakem düdüğü çalıyor, maç başlıyor!'],
  ht: ['İlk yarı sona erdi.'],
  ft: ['Maç bitti!']
};
