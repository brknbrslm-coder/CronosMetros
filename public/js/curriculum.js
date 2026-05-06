// ===== YKS MÜFREDATı 2026 =====
const YKS_CURRICULUM = {

  topicsBySubject: {
    'TYT Türkçe': [
      'Sözcükte Anlam','Cümlede Anlam','Paragrafta Ana Düşünce',
      'Paragrafta Yardımcı Düşünceler','Paragrafta Yapı','Anlatım Teknikleri',
      'Paragrafta Konu ve Başlık','Sözcükte Yapı','Ses Bilgisi',
      'Yazım Kuralları','Noktalama İşaretleri','İsim','Sıfat','Zamir',
      'Zarf','Edat, Bağlaç, Ünlem','Fiil Kip ve Kişi','Fiil Çatısı',
      'Fiilimsi','Cümle Ögeleri','Cümle Türleri','Anlatım Bozuklukları'
    ],
    'TYT Matematik': [
      'Sayılar ve Sayı Basamakları','Bölme ve Bölünebilme','EBOB - EKOK',
      'Rasyonel Sayılar','Mutlak Değer','Üslü Sayılar','Köklü Sayılar',
      'Çarpanlara Ayırma','Oran - Orantı','Denklem Çözme',
      'Sayı Problemleri','Kesir Problemleri','Yaş Problemleri',
      'İşçi - Havuz Problemleri','Hız - Zaman - Yol Problemleri',
      'Yüzde - Faiz Problemleri','Kâr - Zarar Problemleri',
      'Karışım Problemleri','Kümeler','Fonksiyonlar',
      'Permütasyon','Kombinasyon','Olasılık','Veri ve İstatistik'
    ],
    'TYT Geometri': [
      'Doğruda Açılar','Üçgende Açılar','Dik Üçgen','İkizkenar Üçgen',
      'Eşkenar Üçgen','Üçgende Açıortay','Üçgende Kenarortay',
      'Üçgende Eşlik','Üçgende Benzerlik','Üçgende Alan',
      'Üçgende Açı-Kenar Bağıntıları','Çokgenler','Dörtgenler Genel',
      'Yamuk','Paralelkenar','Eşkenar Dörtgen','Deltoid','Dikdörtgen','Kare',
      'Çemberde Açılar','Çember Uzunluk ve Alan','Analitik Nokta',
      'Analitik Doğru','Katı Cisimler - Prizma','Katı Cisimler - Silindir',
      'Katı Cisimler - Piramit ve Koni','Katı Cisimler - Küre'
    ],
    'TYT Fizik': [
      'Fizik Bilimine Giriş','Madde ve Özellikleri','Hareket',
      'Kuvvet ve Newton Yasaları','İş, Güç ve Enerji',
      'Isı ve Sıcaklık','Genleşme','Basınç','Kaldırma Kuvveti',
      'Elektrostatik','Elektrik Akımı','Manyetizma','Dalgalar','Optik'
    ],
    'TYT Kimya': [
      'Kimya Bilimine Giriş','Atom Modelleri','Periyodik Sistem',
      'Kimyasal Türler Arası Etkileşimler','Maddenin Halleri',
      'Doğa ve Kimya','Kimyanın Temel Kanunları','Kimyasal Hesaplamalar (Mol)',
      'Karışımlar','Asitler ve Bazlar','Tuzlar','Kimya Her Yerde'
    ],
    'TYT Biyoloji': [
      'Canlıların Ortak Özellikleri','Canlıların Temel Bileşenleri',
      'Hücre Yapısı ve Organeller','Hücre Zarından Madde Geçişi',
      'Canlıların Sınıflandırılması','Mitoz Bölünme','Eşeysiz Üreme',
      'Mayoz Bölünme','Eşeyli Üreme','Kalıtım','Ekosistem Ekolojisi',
      'Güncel Çevre Sorunları'
    ],
    'TYT Tarih': [
      'Tarih Bilimine Giriş','İnsanlığın İlk Dönemleri',
      'İlk ve Orta Çağda Türk Dünyası','İslam Medeniyetinin Doğuşu',
      'İlk Türk-İslam Devletleri','Orta Çağda Dünya','Selçuklu Türkiyesi',
      'Beylikten Devlete Osmanlı (1300-1453)','Dünya Gücü Osmanlı (1453-1600)',
      'Osmanlı Kültür ve Medeniyeti','Yeni Çağ Avrupa Tarihi',
      'Arayış Yılları - 17. Yüzyıl','18. Yüzyılda Değişim',
      'En Uzun Yüzyıl - 19. Yüzyıl Osmanlı','I. Dünya Savaşı ve Osmanlı',
      'Milli Mücadele','Türk İnkılabı ve Atatürkçülük','Türk Dış Politikası'
    ],
    'TYT Coğrafya': [
      'Doğa ve İnsan','Dünyanın Şekli ve Hareketleri','Coğrafi Konum',
      'Harita Bilgisi','Atmosfer ve İklim','Basınç ve Rüzgarlar',
      'Nem ve Yağış','İklim Tipleri','İç Kuvvetler','Dış Kuvvetler',
      'Kayaçlar ve Jeolojik Zamanlar','Su - Yüzey ve Yer Altı',
      'Toprak Oluşumu','Bitki Örtüsü','Nüfus','Göç ve Yerleşme',
      'Ekonomik Faaliyetler','Bölgeler ve Ülkeler',
      'Uluslararası Ulaşım Hatları','Çevre Sorunları ve Doğal Afetler'
    ],
    'TYT Felsefe': [
      'Felsefenin Alanı','Bilgi Felsefesi','Varlık Felsefesi',
      'Ahlak Felsefesi','Siyaset Felsefesi','Din Felsefesi',
      'Sanat Felsefesi','Bilim Felsefesi'
    ],
    'TYT Din Kültürü': [
      'Bilgi ve İnanç','İslam Temel İnanç Esasları','İslam ve İbadet',
      'Kurandaki Temel Kavramlar','Hz. Muhammedin Hayatı',
      'İslam ve Bilim','Anadoluda İslam','Mezhepler'
    ],
    'AYT Matematik': [
      'Sayılar ve Sayı Kümeleri','Üslü Sayılar','Köklü Sayılar',
      'Fonksiyonlar - Tanım ve Türleri','Bileşke ve Ters Fonksiyon',
      'Polinomlar','İkinci Dereceden Denklemler',
      'İkinci Dereceden Eşitsizlikler','Karmaşık Sayılar','Parabol',
      'Logaritma','Aritmetik Dizi','Geometrik Dizi',
      'Trigonometri Temel','Trigonometri Formüller',
      'Limit ve Süreklilik','Türev Temel Kurallar',
      'Türev Uygulamaları','Belirsiz İntegral','Belirli İntegral ve Alan'
    ],
    'AYT Geometri': [
      'Doğrunun Analitik İncelenmesi','Çemberin Analitik İncelenmesi',
      'Üçgenler İleri','Trigonometrik Alan','Sinüs-Kosinüs Teoremi',
      'Çokgenler İleri','Dörtgenler İleri','Çember ve Daire İleri',
      'Prizma','Piramit','Silindir ve Koni','Küre'
    ],
    'AYT Fizik': [
      'Vektörler','Bağıl Hareket','Newton Hareket Yasaları',
      'Bir Boyutta Sabit İvmeli Hareket','Eğik Atış','Dairesel Hareket',
      'Enerji ve Hareket','İtme ve Momentum','Tork',
      'Denge ve Denge Şartları','Ağırlık Merkezi','Basit Makineler',
      'Elektriksel Kuvvet ve Alan','Elektriksel Potansiyel',
      'Sığa ve Kondansatörler','Manyetizma',
      'Elektromanyetik İndüklenme','Alternatif Akım',
      'Atom Fiziği','Radyoaktivite','Modern Fizik'
    ],
    'AYT Kimya': [
      'Modern Atom Teorisi','Gazlar','Sıvı Çözeltiler','Çözünürlük',
      'Kimyasal Tepkimelerde Enerji','Kimyasal Tepkimelerde Hız',
      'Kimyasal Denge','Asit-Baz Dengesi','Çözünürlük Dengesi',
      'Elektrokimya','Karbon Kimyasına Giriş','Hidrokarbonlar',
      'Fonksiyonlu Organik Bileşikler','Enerji Kaynakları'
    ],
    'AYT Biyoloji': [
      'Sinir Sistemi','Endokrin Sistem','Duyu Organları',
      'Destek ve Hareket Sistemi','Sindirim Sistemi',
      'Dolaşım Sistemi','Bağışıklık Sistemi','Solunum Sistemi',
      'Boşaltım Sistemi','Üreme Sistemi','Embriyonik Gelişim',
      'Komünite ve Popülasyon Ekolojisi','Protein Sentezi',
      'Fotosentez','Kemosentez','Hücresel Solunum','Bitki Biyolojisi'
    ],
    'AYT Türk Dili ve Edebiyatı': [
      'Sözcükte Anlam','Cümlede Anlam','Paragrafta Anlam',
      'Şiir Bilgisi - Nazım Biçimleri','Şiir Bilgisi - Ölçü',
      'Kafiye ve Redif','Edebi Sanatlar',
      'İslamiyet Öncesi Türk Edebiyatı','Halk Edebiyatı','Divan Edebiyatı',
      'Tanzimat Dönemi','Servet-i Fünun','Fecr-i Ati',
      'Milli Edebiyat Dönemi','Cumhuriyet Dönemi - Şiir',
      'Cumhuriyet Dönemi - Roman ve Hikaye',
      'Cumhuriyet Dönemi - Tiyatro','Yazar - Eser Eşleştirme'
    ],
    'AYT Tarih-1': [
      'Tarih Bilimine Giriş','İlk ve Orta Çağda Türk Dünyası',
      'İslam Medeniyetinin Doğuşu','İlk İslam Devletleri',
      'Türk-İslam Devletleri','Selçuklu Devleti',
      'Türkiye Selçukluları','Anadolu Beylikleri',
      'Beylikten Devlete Osmanlı','Dünya Gücü Osmanlı',
      'Osmanlı Kültür ve Medeniyeti'
    ],
    'AYT Coğrafya-1': [
      'Coğrafyanın Konusu','Dünyanın Şekli ve Hareketleri',
      'Harita Bilgisi','Atmosfer ve İklim','İklim Tipleri',
      'Volkanizma','Deprem ve Tektonik',
      'Dış Kuvvetler','Su Kaynakları','Toprak','Bitki Örtüsü'
    ],
    'AYT Tarih-2': [
      'Yeni ve Yakın Çağda Avrupa','Fransız İhtilali',
      'Arayış Yılları - 17. Yüzyıl','18. Yüzyılda Değişim',
      'En Uzun Yüzyıl - 19. Yüzyıl','Milliyetçilik ve Osmanlı',
      'XX. Yüzyıl Başları','I. Dünya Savaşı',
      'Milli Mücadele - Hazırlık','Milli Mücadele - Cepheler',
      'Türk İnkılabı','Atatürkçülük',
      'II. Dünya Savaşı','Soğuk Savaş','Türk Dış Politikası'
    ],
    'AYT Coğrafya-2': [
      'Dünya ve Türkiye Nüfusu','Nüfus Politikaları','Göç Türleri',
      'Kır ve Şehir Yerleşmesi','Tarım ve Hayvancılık',
      'Madencilik ve Enerji','Sanayi','Turizm',
      'Ulaşım Türleri','Uluslararası Ulaşım',
      'Bölgeler ve Ülkeler','Küresel Çevre Sorunları',
      'Doğal Afetler','Türkiye Ekonomik Coğrafyası'
    ],
    'AYT Felsefe Grubu': [
      'Felsefenin Alanı','Bilgi Felsefesi','Varlık Felsefesi',
      'Ahlak Felsefesi','Sanat Felsefesi','Din Felsefesi',
      'Siyaset Felsefesi','Bilim Felsefesi',
      'Psikoloji Temel Süreçleri','Öğrenme','Bellek',
      'Düşünme ve Dil','Kişilik Kuramları','Sosyal Psikoloji',
      'Sosyolojiye Giriş','Birey ve Toplum','Toplumsal Yapı',
      'Toplumsal Değişme','Toplumsal Kurumlar',
      'Klasik Mantık','Mantık ve Dil','Sembolik Mantık'
    ],
    'AYT Din Kültürü': [
      'İslam Temel Kaynakları','İslam İnanç Esasları',
      'İslam ve İbadet','Hz. Muhammed','İslam Düşüncesinde Yorumlar',
      'İslam ve Bilim','Günümüz Din Anlayışları'
    ]
  },

  // Havuzlama eşleşmeleri
  poolingAliases: {
    'Fizik':           { tyt: ['TYT Fizik'],              ayt: ['AYT Fizik'] },
    'Kimya':           { tyt: ['TYT Kimya'],              ayt: ['AYT Kimya'] },
    'Biyoloji':        { tyt: ['TYT Biyoloji'],           ayt: ['AYT Biyoloji'] },
    'Matematik':       { tyt: ['TYT Matematik','TYT Geometri'], ayt: ['AYT Matematik','AYT Geometri'] },
    'Türkçe/Edebiyat': { tyt: ['TYT Türkçe'],            ayt: ['AYT Türk Dili ve Edebiyatı'] },
    'Tarih':           { tyt: ['TYT Tarih'],              ayt: ['AYT Tarih-1','AYT Tarih-2'] },
    'Coğrafya':        { tyt: ['TYT Coğrafya'],           ayt: ['AYT Coğrafya-1','AYT Coğrafya-2'] },
    'Felsefe':         { tyt: ['TYT Felsefe'],            ayt: ['AYT Felsefe Grubu'] },
    'Din Kültürü':     { tyt: ['TYT Din Kültürü'],        ayt: ['AYT Din Kültürü'] },
  },

  // TYT ve AYT ders listeleri (filtre için)
  tytSubjects: [
    'TYT Türkçe','TYT Matematik','TYT Geometri','TYT Fizik',
    'TYT Kimya','TYT Biyoloji','TYT Tarih','TYT Coğrafya',
    'TYT Felsefe','TYT Din Kültürü'
  ],
  aytSubjects: [
    'AYT Matematik','AYT Geometri','AYT Fizik','AYT Kimya',
    'AYT Biyoloji','AYT Türk Dili ve Edebiyatı',
    'AYT Tarih-1','AYT Coğrafya-1','AYT Tarih-2',
    'AYT Coğrafya-2','AYT Felsefe Grubu','AYT Din Kültürü'
  ]
};

// Konu önerilerini getir
function getTopicSuggestions(subjectName) {
  return YKS_CURRICULUM.topicsBySubject[subjectName] || [];
}

// Bir ders TYT mi AYT mi?
function getSubjectCategory(name) {
  if (YKS_CURRICULUM.tytSubjects.includes(name)) return 'TYT';
  if (YKS_CURRICULUM.aytSubjects.includes(name)) return 'AYT';
  return null;
}
