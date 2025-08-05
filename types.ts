import type { ReactNode } from 'react';

export interface NavItem {
  path: string;
  name: string;
  subItems?: NavItem[];
  icon?: ReactNode;
  roles?: KullaniciRol[];
}

export interface DashboardStats {
  totalMembers: number;
  monthlyDonations: number;
  activeProjects: number;
  pendingApplications: number;
}

export interface RecentActivity {
  id: string; // e.g., "donation-1"
  type: 'donation' | 'person' | 'application';
  timestamp: string; // ISO date string
  description: string; // "Ahmet Yılmaz yeni bir başvuru yaptı."
  amount?: string; // "500 TL"
  link: string;
}

export enum MembershipType {
    STANDART = 'Standart',
    GONULLU = 'Gönüllü',
    ONURSAL = 'Onursal',
}

export enum AidatDurumu {
    ODENDI = 'Ödendi',
    BEKLEMEDE = 'Beklemede',
}

export interface Aidat {
    id: number;
    uyeId: number; // Corresponds to Person.id
    donem: string; // e.g., "2024-Ocak"
    tutar: number;
    odemeTarihi?: string;
    durum: AidatDurumu;
}


export enum PersonStatus {
    AKTIF = 'Aktif',
    PASIF = 'Pasif',
    BEKLEMEDE = 'Beklemede',
}

export enum KimlikTuru {
    TC = 'T.C. Kimlik No',
    PASAPORT = 'Pasaport',
    YABANCI_KIMLIK = 'Yabancı Kimlik No',
}

export interface Not {
  id: number;
  tarih: string;
  icerik: string;
  girenKullanici: string;
}

// Yardım Alanlar (Aid Recipients) & Kişi Yönetimi Types
export enum Uyruk {
    TC = 'T.C.',
    SURIYE = 'Suriye',
    CECENISTAN = 'Çeçenistan',
    AFGANISTAN = 'Afganistan',
    DIGER = 'Diğer',
}

export enum YardimTuruDetay {
    NAKIT = 'Nakit',
    KART = 'Kart (LCW, Gıda vb.)',
    KOLI = 'Yardım Kolisi',
    FATURA_ODEMESI = 'Fatura Ödemesi',
}

// For Kişi Detay page
export enum SponsorlukTipi {
    BIREYSEL = 'Bireysel',
    KURUMSAL = 'Kurumsal',
    PROJE_BAZLI = 'Proje Bazlı',
    YOK = 'Yok',
}
export enum DosyaBaglantisi {
    PARTNER = 'Partner Kurum',
    BAGIMSIZ = 'Bağımsız',
    DERNEK = 'Dernek Merkezi',
}
export enum RizaBeyaniStatus {
    ALINDI = 'Alındı',
    ALINMADI = 'Alınmadı',
    BEKLEMEDE = 'Beklemede',
}

export interface BankaHesabi {
    id: string;
    iban: string;
    hesapAdi: string;
}

export enum DokumanTipi {
    KIMLIK = 'Kimlik Fotokopisi',
    PASAPORT = 'Pasaport',
    IKAMETGAH = 'İkametgah Belgesi',
    SAGLIK_RAPORU = 'Sağlık Raporu',
    DILEKCE = 'Dilekçe',
    BASVURU_FORMU = 'Başvuru Formu',
    RIZA_BEYANI = 'Rıza Beyanı',
    DIGER = 'Diğer',
}

export interface PersonDocument {
    id: string;
    ad: string;
    tip: DokumanTipi;
    path: string; // File path in Supabase Storage, not the full URL.
}

export interface PersonPhoto {
    id: string;
    url: string;
    aciklama: string;
    yuklenmeTarihi: string;
}

export enum YakinlikTuru {
    ESI = 'Eşi',
    OGLU = 'Oğlu',
    KIZI = 'Kızı',
    ANNESI = 'Annesi',
    BABASI = 'Babası',
    KARDESI = 'Kardeşi',
    DIGER = 'Diğer',
}

export interface Dependent {
    personId: number;
    relationship: YakinlikTuru;
}

// New Enums for detailed Person model
export enum MedeniDurum {
    BEKAR = 'Bekar',
    EVLI = 'Evli',
    DUL = 'Dul',
    BOSANMIS = 'Boşanmış'
}

export enum EgitimDurumu {
    OKUR_YAZAR_DEGIL = 'Okur Yazar Değil',
    ILKOKUL = 'İlkokul',
    ORTAOKUL = 'Ortaokul',
    LISE = 'Lise',
    UNIVERSITE = 'Üniversite',
    YUKSEK_LISANS_DOKTORA = 'Yüksek Lisans/Doktora'
}

export enum IsDurumu {
    CALISIYOR = 'Çalışıyor',
    ISSIZ = 'İşsiz',
    OGRENCI = 'Öğrenci',
    EMEKLI = 'Emekli',
    EV_HANIMI = 'Ev Hanımı'
}

export enum YasadigiYer {
    KIRA = 'Kira',
    KENDINE_AIT = 'Kendine Ait',
    AKRABA_YANI = 'Akraba Yanı',
    DIGER = 'Diğer',
}

export enum GelirKaynagi {
    MAAS = 'Maaş',
    DEVLET_YARDIMI = 'Devlet Yardımı',
    ZEKAT = 'Zekat',
    TARIMSAL = 'Tarımsal',
    DIGER = 'Diğer',
}

export enum KanGrubu {
    APozitif = 'A+',
    ANegatif = 'A-',
    BPozitif = 'B+',
    BNegatif = 'B-',
    ABPozitif = 'AB+',
    ABNegatif = 'AB-',
    SifirPozitif = '0+',
    SifirNegatif = '0-'
}

export enum Hastalik {
    KRONIK = 'Kronik Hastalık',
    KALP = 'Kalp Rahatsızlığı',
    TANSIYON = 'Tansiyon',
    DIYABET = 'Diyabet',
    ASTIM = 'Astım',
    DIGER = 'Diğer',
}

export interface AcilDurumKisisi {
    id: string;
    ad: string;
    yakinlik: YakinlikTuru;
    telefon1: string;
    telefon2?: string;
}

export enum PersonelEtiket {
    DUZENLI_YARDIM = 'Düzenli Yardım Yapılabilir',
    BASVURU_RED = 'Gelecek Başvuruları Reddedilmeli',
    OLUMSUZ = 'Olumsuz',
    SAHTE_EVRAK = 'Sahte Evrak/Yalan Beyan',
}

export enum OzelDurum {
    DEPREMZEDE = 'Depremzede',
}

export interface Person {
    id: number;
    // --- Genel Bilgiler ---
    ad: string;
    soyad: string;
    uyruk: Uyruk[]; 
    kimlikTuru: KimlikTuru;
    kimlikNo: string;
    dogumTarihi: string;
    cepTelefonu: string;
    sabitTelefon?: string;
    yurtdisiTelefon?: string;
    email?: string;
    ulke: string;
    sehir: string;
    yerlesim: string; // ilçe / bölge
    mahalle: string;
    adres: string;
    lat?: number;
    lng?: number;
    kategori?: 'Bağışçı' | 'Yardım Alan' | 'Üye';
    dosyaNumarasi: string;
    sponsorlukTipi: SponsorlukTipi;
    kayitDurumu: 'Taslak' | 'Kaydedildi';

    // --- Bağlantılı Kayıtlar ---
    bankaHesaplari?: BankaHesabi[];
    dokumanlar?: PersonDocument[];
    fotograflar?: PersonPhoto[];
    bagislar?: any[]; // Placeholder
    referanslar?: any[]; // Placeholder
    sosyalKartlar?: any[]; // Placeholder
    yardimTalepleri?: any[]; // Placeholder
    dependents?: Dependent[]; // Bakmakla yükümlü oldukları
    aldigiYardimTuru?: YardimTuruDetay[];
    notlar?: Not[];
    rizaBeyani: RizaBeyaniStatus;
    
    // --- Kimlik Bilgileri ---
    babaAdi?: string;
    anaAdi?: string;
    gecerlilikVerenKurum?: string;
    seriNumarasi?: string;
    
    // --- Pasaport ve Vize ---
    pasaportTuru?: string;
    pasaportNo?: string;
    pasaportGecerlilikTarihi?: string;
    vizeBaslangicBitis?: string;
    geriDonusBelgesi?: boolean;

    // --- Kişisel Veriler ---
    cinsiyet?: 'Erkek' | 'Kız';
    dogumYeri?: string;
    medeniDurum?: MedeniDurum;
    egitim?: EgitimDurumu;
    isDurumu?: IsDurumu;
    calistigiSektor?: string;
    meslekGrubu?: string;
    meslekAciklamasi?: string;
    adliSicilKaydi?: boolean;

    // --- İş ve Gelir Durumu ---
    yasadigiYer?: YasadigiYer;
    aylikGelir?: number;
    aylikGider?: number;
    sosyalGuvence?: boolean;
    gelirKaynaklari?: GelirKaynagi[];
    
    // --- Sağlık Durumu ---
    kanGrubu?: KanGrubu;
    sigaraKullanimi?: boolean;
    engellilik?: { durum: boolean; aciklama?: string };
    kullanilanProtezler?: string;
    tibbiCihazlar?: string;
    kullanilanIlaclar?: string;
    ameliyatlar?: string;
    hastaliklar?: Hastalik[];
    hastaliklarAciklama?: string;

    // --- Acil Durum İletişim ---
    acilDurumIletisim?: AcilDurumKisisi[];

    // --- Etiketler & Özel Durumlar ---
    etiketler?: PersonelEtiket[];
    ozelDurumlar?: OzelDurum[];

    // --- Kayıt Bilgisi ---
    kayitTarihi: string;
    kaydiAcanBirim: string;
    kayitEden?: string;
    kayitIp?: string;

    // --- İlave Açıklamalar ---
    aciklamalar?: {
        tr?: string;
        en?: string;
        ar?: string;
    };
    
    // from old model, keep for now
    dosyaBaglantisi: DosyaBaglantisi;
    isKaydiSil: boolean;
    durum: PersonStatus;
    membershipType?: MembershipType;
}

// Kurum Yönetimi Types
export enum KurumTuru {
    RESMI_KURUM = 'Resmi Kurum',
    STK = 'Sivil Toplum Kuruluşu',
    OZEL_SEKTOR = 'Özel Sektor',
    DIGER = 'Diğer',
}

export interface Kurum {
    id: number;
    resmiUnvan: string;
    kisaAd?: string;
    kurumTuru: KurumTuru;
    vergiDairesi?: string;
    vergiNumarasi?: string;
    telefon: string;
    email?: string;
    adres: string;
    yetkiliKisiId?: number; // Corresponds to Person.id
    status: PersonStatus; // Re-using PersonStatus
    kayitTarihi: string;
}

// Bağış Yönetimi Types
export enum BagisTuru {
    NAKIT = 'Nakit',
    KREDI_KARTI = 'Kredi Kartı',
    BANKA_TRANSFERI = 'Banka Transferi',
    ONLINE = 'Online',
    AYNI = 'Ayni Yardım',
}

export interface Bagis {
    id: number;
    bagisciId: number;
    tutar: number;
    paraBirimi: 'TRY' | 'USD' | 'EUR';
    bagisTuru: BagisTuru;
    tarih: string;
    aciklama: string;
    projeId?: number;
    makbuzNo: string;
}

// Kumbara Yönetimi Types
export enum KumbaraType {
    BAGIS = 'Bağış',
    OZEL_AMAC = 'Özel Amaç',
}

export enum KumbaraStatus {
    AKTIF = 'Aktif',
    PASIF = 'Pasif',
}

export interface Kumbara {
    id: number;
    code: string;
    location: string;
    lat?: number;
    lng?: number;
    type: KumbaraType;
    status: KumbaraStatus;
    lastEmptied: string | null;
    balance: number;
    qrCodeUrl: string;
}


// Depo Yönetimi Types
export enum DepoUrunKategorisi {
    GIDA = 'Gıda',
    GIYIM = 'Giyim',
    KIRTASIYE = 'Kırtasiye',
    TEMIZLIK = 'Temizlik',
    DIGER = 'Diğer',
}

export enum DepoUrunBirimi {
    ADET = 'Adet',
    KG = 'Kg',
    LITRE = 'Litre',
    PAKET = 'Paket',
}

export interface DepoUrunu {
    id: number;
    code: string;
    name: string;
    barcode?: string;
    category: DepoUrunKategorisi;
    quantity: number;
    unit: DepoUrunBirimi;
    minStockLevel: number;
    maxStockLevel?: number;
    shelfLocation?: string;
    purchasePrice?: number;
    lastUpdated: string;
    expirationDate?: string;
    supplier?: string;
    description?: string;
}

// Hukuki Yardım Types
export enum DavaStatus {
    DEVAM_EDEN = 'Devam Ediyor',
    SONUCLANAN = 'Sonuçlandı',
    TEMYIZDE = 'Temyizde',
}

export enum DavaTuru {
    CEZA = 'Ceza',
    MEDENI = 'Medeni',
    IDARI = 'İdari',
    DIGER = 'Diğer',
}

export interface Durusma {
    id: number;
    tarih: string;
    saat: string;
    aciklama: string;
}

export interface Gelisime {
    id: number;
    tarih: string;
    aciklama: string;
}

export interface Masraf {
    id: number;
    tarih: string;
    aciklama: string;
    tutar: number;
}

export interface Dava {
    id: number;
    caseNumber: string;
    muvekkil: string;
    karsiTaraf: string;
    davaKonusu: string;
    davaTuru: DavaTuru;
    davaDurumu: DavaStatus;
    sorumluAvukat: string;
    mahkeme: string;
    acilisTarihi: string;
    karar?: string;
    durusmalar?: Durusma[];
    gelismeler?: Gelisime[];
    masraflar?: Masraf[];
    dosyalar?: PersonDocument[]; // Placeholder for actual file objects
}


// Proje Yönetimi Types
export enum ProjeStatus {
    PLANLAMA = 'Planlama',
    DEVAM_EDIYOR = 'Devam Ediyor',
    TAMAMLANDI = 'Tamamlandı',
    IPTAL_EDILDI = 'İptal Edildi',
}

export enum GorevStatus {
    YAPILACAK = 'Yapılacak',
    YAPILIYOR = 'Yapılıyor',
    TAMAMLANDI = 'Tamamlandı',
}

export enum GorevOncelik {
    DUSUK = 'Düşük',
    NORMAL = 'Normal',
    YUKSEK = 'Yüksek',
}

export interface Gorev {
    id: number;
    baslik: string;
    aciklama: string;
    sorumluId?: number;
    sonTarih: string;
    oncelik: GorevOncelik;
    durum: GorevStatus;
}

export interface Proje {
    id: number;
    name: string;
    manager: string;
    status: ProjeStatus;
    startDate: string;
    endDate: string;
    budget: number;
    spent: number;
    progress: number; // Percentage 0-100
    description: string;
    gorevler?: Gorev[];
}

// Yardım Başvuruları Types
export enum YardimTuru {
    EGITIM = 'Eğitim Yardımı',
    SAGLIK = 'Sağlık Yardımı',
    ACIL = 'Acil Yardım',
    DIGER = 'Diğer',
}

export enum BasvuruStatus {
    BEKLEYEN = 'Bekleyen',
    INCELENEN = 'İncelenen',
    ONAYLANAN = 'Onaylanan', // Komisyon Onayladı, Başkan Onayı Bekliyor
    REDDEDILEN = 'Reddedilen', // Komisyon Reddetti
    TAMAMLANAN = 'Tamamlanan', // Ödeme yapıldı
    BASKAN_REDDETTI = 'Başkan Reddetti', // Başkan Reddetti
}

export enum BasvuruOncelik {
    DUSUK = 'Düşük',
    ORTA = 'Orta',
    YUKSEK = 'Yüksek',
}

export interface YardimBasvurusu {
    id: number;
    basvuruSahibiId: number;
    basvuruTuru: YardimTuru;
    talepTutari: number;
    oncelik: BasvuruOncelik;
    basvuruTarihi: string;
    durum: BasvuruStatus;
    degerlendirmeNotu?: string;
    talepDetayi?: string;
    odemeId?: number;
    baskanOnayi: boolean | null;
    baskanOnayNotu: string | null;
    dosyalar?: PersonDocument[];
    yorumlar?: Yorum[];
}

// Ödeme Yönetimi Types
export enum OdemeTuru {
    BAGIS_GIRISI = 'Bağış Girişi',
    YARDIM_ODEMESI = 'Yardım Ödemesi',
    BURS_ODEMESI = 'Burs Ödemesi',
    YETIM_DESTEGI = 'Yetim Desteği',
    VEFA_DESTEGI = 'Vefa Desteği',
    GIDER_ODEMESI = 'Gider Ödemesi',
}

export enum OdemeDurumu {
    BEKLEYEN = 'Bekleyen',
    TAMAMLANAN = 'Tamamlanan',
    IPTAL = 'İptal',
}

export enum OdemeYontemi {
    NAKIT = 'Nakit',
    BANKA_TRANSFERI = 'Banka Transferi',
    KREDI_KARTI = 'Kredi Kartı',
}

export interface Odeme {
    id: number;
    odemeTuru: OdemeTuru;
    kisi: string; // Ödemeyi yapan veya alan kişi/kurum
    tutar: number;
    paraBirimi: 'TRY' | 'USD' | 'EUR';
    aciklama: string;
    odemeYontemi: OdemeYontemi;
    odemeTarihi: string;
    durum: OdemeDurumu;
}

// Ayni Yardım İşlemleri
export interface AyniYardimIslemi {
    id: number;
    kisiId: number;
    urunId: number;
    miktar: number;
    birim: DepoUrunBirimi;
    tarih: string;
    notlar?: string;
}

// Hizmet Takip İşlemleri
export enum HizmetTuru {
    DANISMANLIK = 'Danışmanlık',
    EGITIM = 'Eğitim',
    SAGLIK_TARAMASI = 'Sağlık Taraması',
    PSIKOLOJIK_DESTEK = 'Psikolojik Destek',
    HUKUKI_DESTEK = 'Hukuki Destek',
    TERCUMANLIK = 'Tercümanlık',
    DIGER = 'Diğer',
}

export enum HizmetDurumu {
    PLANLANDI = 'Planlandı',
    TAMAMLANDI = 'Tamamlandı',
    IPTAL_EDILDI = 'İptal Edildi',
}

export interface Hizmet {
    id: number;
    kisiId: number;
    hizmetTuru: HizmetTuru;
    hizmetVeren: string;
    tarih: string;
    aciklama: string;
    durum: HizmetDurumu;
}

// Hastane Sevk İşlemleri
export enum SevkDurumu {
    PLANLANDI = 'Planlandı',
    RANDEVU_ALINDI = 'Randevu Alındı',
    GIDILDI = 'Gidildi',
    IPTAL_EDILDI = 'İptal Edildi',
}

export interface HastaneSevk {
    id: number;
    kisiId: number;
    hastaneAdi: string;
    bolum: string;
    doktorAdi?: string;
    sevkTarihi: string;
    randevuTarihi?: string;
    sevkNedeni: string;
    durum: SevkDurumu;
    sonuc?: string;
    maliyet?: number;
}

// Öğrenci Bursları Types
export enum BursTuru {
    LISANS = 'Lisans',
    YUKSEK_LISANS = 'Yüksek Lisans',
    DOKTORA = 'Doktora',
    OZEL = 'Özel',
}

export enum BursDurumu {
    AKTIF = 'Aktif',
    TAMAMLANDI = 'Tamamlandı',
    IPTAL_EDILDI = 'İptal Edildi',
}

export interface PerformansNotu {
    id: number;
    tarih: string;
    gpa: number;
    not: string;
}

export interface OgrenciBursu {
    id: number;
    ogrenciAdi: string;
    okulAdi: string;
    bolum: string;
    bursTuru: BursTuru;
    bursMiktari: number; // Aylık
    baslangicTarihi: string;
    bitisTarihi: string;
    durum: BursDurumu;
    gpa: number;
    performansGecmisi?: PerformansNotu[];
    odemeGecmisi?: Odeme[];
}

// Yetim Yönetimi Types
export enum EgitimSeviyesi {
    OKUL_ONCESI = 'Okul Öncesi',
    ILKOKUL = 'İlkokul',
    ORTAOKUL = 'Ortaokul',
    LISE = 'Lise',
    MEZUN = 'Mezun',
}

export enum DestekDurumu {
    DESTEK_ALIYOR = 'Destek Alıyor',
    DESTEK_ALMIYOR = 'Destek Almıyor',
}

export interface SaglikNotu {
    id: number;
    yetimId: number;
    tarih: string;
    not: string;
}

export interface EgitimNotu {
    id: number;
    yetimId: number;
    tarih: string;
    not: string;
}

export interface Yetim {
    id: number;
    adiSoyadi: string;
    dogumTarihi: string;
    cinsiyet: 'Erkek' | 'Kız';
    veliAdi: string;
    veliTelefonu: string;
    sehir: string;
    egitimSeviyesi: EgitimSeviyesi;
    okulAdi: string;
    destekDurumu: DestekDurumu;
    kayitTarihi: string;
    saglikGecmisi?: SaglikNotu[];
    egitimGecmisi?: EgitimNotu[];
}

// Vefa Destek Yönetimi Types
export enum VefaDestekTuru {
    EVDE_TEMIZLIK = 'Evde Temizlik',
    ALISVERIS_DESTEGI = 'Alışveriş Desteği',
    SOSYAL_AKTIVITE = 'Sosyal Aktivite',
    TEKNIK_DESTEK = 'Teknik Destek',
    DIGER = 'Diğer',
}

export enum VefaDestekDurumu {
    AKTIF = 'Aktif',
    PASIF = 'Pasif',
}

export interface VefaNotu {
    id: number;
    tarih: string;
    icerik: string;
    girenKullanici: string;
}

export interface VefaDestek {
    id: number;
    adiSoyadi: string;
    dogumTarihi: string;
    telefon: string;
    adres: string;
    destekTuru: VefaDestekTuru;
    destekDurumu: VefaDestekDurumu;
    sorumluGonullu: string;
    kayitTarihi: string;
    notlar?: VefaNotu[];
}

// Finansal Kayıtlar Types
export enum FinansalIslemTuru {
    GELIR = 'Gelir',
    GIDER = 'Gider',
}

export enum HesapKategorisi {
    BAGIS = 'Bağış',
    UYE_AIDATI = 'Üye Aidatı',
    PROJE_GELIRI = 'Proje Geliri',
    MAAS_ODEMESI = 'Maaş Ödemesi',
    KIRA = 'Kira Gideri',
    FATURA = 'Fatura Ödemesi',
    OFIS_GIDERI = 'Ofis Gideri',
    PROJE_GIDERI = 'Proje Gideri',
    DIGER_GELIR = 'Diğer Gelir',
    DIGER_GIDER = 'Diğer Gider',
}

export interface FinansalKayit {
    id: number;
    tarih: string;
    aciklama: string;
    tur: FinansalIslemTuru;
    kategori: HesapKategorisi;
    tutar: number;
    belgeNo?: string;
    projeId?: number;
}

// Kullanıcı Yönetimi Types
export enum KullaniciRol {
    YONETICI = 'Yönetici',
    EDITOR = 'Editör',
    MUHASEBE = 'Muhasebe',
    GONULLU = 'Gönüllü',
}

export enum KullaniciDurum {
    AKTIF = 'Aktif',
    PASIF = 'Pasif',
}

export interface Kullanici {
    id: number;
    kullaniciAdi: string;
    email: string;
    rol: KullaniciRol;
    durum: KullaniciDurum;
    sonGiris?: string;
}

// Gönüllü Yönetimi Types
export enum Beceri {
    ORGANIZASYON = 'Organizasyon',
    EGITIM = 'Eğitim Verme',
    SAHA_CALISMASI = 'Saha Çalışması',
    ILETISIM = 'İletişim ve Halkla İlişiler',
    TEKNIK_DESTEK = 'Teknik Destek',
    ILK_YARDIM = 'İlk Yardım',
    YABANCI_DIL = 'Yabancı Dil',
}

export interface EtkinlikKatilimi {
    id: number;
    etkinlikAdi: string;
    tarih: string;
    rol: string;
}

export enum GonulluDurum {
    AKTIF = 'Aktif',
    PASIF = 'Pasif',
}

export interface Gonullu {
    id: number;
    personId: number;
    baslangicTarihi: string;
    durum: GonulluDurum;
    beceriler: Beceri[];
    ilgiAlanlari: string[];
    musaitlik: string; // "Hafta sonları", "Hafta içi akşamları" etc.
    etkinlikGecmisi?: EtkinlikKatilimi[];
    toplamSaat?: number;
}

// Etkinlik Yönetimi Types
export enum EtkinlikStatus {
    PLANLAMA = 'Planlama',
    YAYINDA = 'Yayında',
    TAMAMLANDI = 'Tamamlandı',
    IPTAL_EDILDI = 'İptal Edildi',
}

export interface EtkinlikKatilimcisi {
    personId: number;
    kayitTarihi: string;
}

export interface Etkinlik {
    id: number;
    ad: string;
    tarih: string;
    saat: string;
    konum: string;
    aciklama: string;
    status: EtkinlikStatus;
    sorumluId: number; // personId of the organizer
    katilimcilar?: EtkinlikKatilimcisi[];
}

// Ayarlar (Settings) Types
export interface SistemAyarlari {
    id: number; // Should have a single row with a fixed ID, e.g., 1
    dernekAdi: string;
    dernekAdresi: string;
    logoUrl: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    varsayilanParaBirimi: 'TRY' | 'USD' | 'EUR';
    tarihFormati: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
}

// Profil Types
export interface Profil {
    id: number;
    adSoyad: string;
    email: string;
    rol: KullaniciRol;
    telefon: string;
    profilFotoUrl: string;
}

// Raporlar & Analitik Types
export interface ChartDataPoint {
    name: string;
    value: number;
    [key: string]: any; // Allow other properties
}

export interface AnalyticsSummary {
    summary: string;
    positiveTrends: string[];
    areasForAttention: string[];
    actionableInsights: string[];
}


// Dosya Yönetimi Types
export type FileType = 'pdf' | 'image' | 'word' | 'excel' | 'other';

export interface Dosya {
  id: string;
  name: string;
  type: 'file';
  fileType: FileType;
  size: number; // in bytes
  uploadDate: string;
  parentId: string | null;
  url?: string; // for image previews
  tags?: string[];
  path?: string;
}

export interface Klasor {
  id: string;
  name:string;
  type: 'folder';
  parentId: string | null;
}

export type DosyaSistemiOgesi = Dosya | Klasor;

// Bildirimler Types
export enum BildirimTuru {
    SISTEM = 'Sistem',
    KULLANICI = 'Kullanıcı',
    TOPLU = 'Toplu Duyuru',
}

export enum BildirimDurumu {
    OKUNMADI = 'Okunmadı',
    OKUNDU = 'Okundu',
}

export interface Bildirim {
    id: number;
    tur: BildirimTuru;
    baslik: string;
    icerik: string;
    tarih: string;
    durum: BildirimDurumu;
    gonderen?: string; // For Kullanıcı type
}


// API & Entegrasyon Types
export interface ApiKey {
    id: number;
    name: string;
    key: string; // The full key, will be partially hidden
    createdDate: string;
    status: 'Active' | 'Revoked';
}

export enum WebhookEvent {
    YENI_BAGIS = 'Yeni Bağış',
    YENI_UYE = 'Yeni Üye',
    YENI_BASVURU = 'Yeni Başvuru',
}

export interface Webhook {
    id: number;
    url: string;
    event: WebhookEvent;
    status: 'Active' | 'Inactive';
}

// Toplu İletişim Types
export enum GonderimTuru {
    SMS = 'SMS',
    EPOSTA = 'E-posta',
}

export enum HedefKitle {
    TUM_KISILER = 'Tüm Kişiler',
    TUM_UYELER = 'Tüm Üyeler',
    TUM_GONULLULER = 'Tüm Gönüllüler',
    YARDIM_ALANLAR = 'Tüm Yardım Alanlar',
}

export interface GonderilenMesaj {
    id: number;
    gonderimTuru: GonderimTuru;
    hedefKitle: string; // Store descriptive name
    kisiSayisi: number;
    baslik: string;
    icerik: string;
    gonderimTarihi: string;
    gonderenKullanici: string;
}

export interface SavedView {
    name: string;
    filters: {
        searchTerm: string;
        statusFilter: PersonStatus | 'all';
        nationalityFilter: Uyruk | 'all';
        yardimTuruFilter: YardimTuruDetay | 'all';
    };
}

// Denetim Kayıtları (Audit Log) Types
export enum LogAction {
    CREATE = 'Oluşturma',
    UPDATE = 'Güncelleme',
    DELETE = 'Silme',
    LOGIN = 'Giriş',
    LOGOUT = 'Çıkış',
    APPROVE = 'Onaylama',
    REJECT = 'Reddetme',
    PAYMENT = 'Ödeme Oluşturma',
    SMART_SEARCH = 'Akıllı Arama',
}

export enum LogEntityType {
    PERSON = 'Kişi',
    APPLICATION = 'Yardım Başvurusu',
    PROJECT = 'Proje',
    DONATION = 'Bağış',
    USER = 'Kullanıcı',
    VEFA = 'Vefa Destek',
    YETIM = 'Yetim',
    BURS = 'Burs',
    SYSTEM = 'Sistem',
    COMMENT = 'Yorum',
}

export interface Yorum {
    id: number;
    timestamp: string;
    kullaniciId: number;
    kullaniciAdi: string;
    kullaniciAvatarUrl: string;
    icerik: string;
    entityTipi: LogEntityType;
    entityId: number;
}

export interface DenetimKaydi {
    id: number;
    timestamp: string;
    kullaniciId: number;
    kullaniciAdi: string;
    eylem: LogAction;
    entityTipi: LogEntityType;
    entityId?: number;
    aciklama: string;
    detaylar?: Record<string, any>;
}

// Calendar Module Types
export enum CalendarEventType {
    ETKINLIK = 'Etkinlik',
    GOREV = 'Görev',
    DURUSMA = 'Duruşma',
}

export interface CalendarEvent {
    id: string; // e.g., "etkinlik-1", "gorev-5"
    title: string;
    date: string; // YYYY-MM-DD
    type: CalendarEventType;
    link: string; // e.g., "/etkinlikler/1"
    details: string; // e.g., "Saat: 14:00, Konum: Merkez"
}

// Akıllı Arama
export interface SmartSearchResult {
    path: string;
    filters?: {
        [key: string]: string;
    };
    explanation: string;
}

// Kişi AI Özeti
export interface PersonSummaryInput {
    adSoyad: string;
    kayitTarihi: string;
    durum: PersonStatus;
    ozelDurumlar?: OzelDurum[];
    aciklamalar?: {
        tr?: string;
        en?: string;
        ar?: string;
    };
}