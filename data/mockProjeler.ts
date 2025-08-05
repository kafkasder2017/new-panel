import { Proje, ProjeStatus, Gorev, GorevStatus, GorevOncelik } from '../types';

const MOCK_GOREVLER_RAMAZAN: Gorev[] = [
    { id: 1, baslik: 'Kumanya Paketlerinin Hazırlanması', aciklama: 'Depodaki ürünlerle 200 adet kumanya paketi hazırlanacak.', sorumluId: 7, sonTarih: '2025-03-10', oncelik: GorevOncelik.YUKSEK, durum: GorevStatus.YAPILIYOR },
    { id: 2, baslik: 'Dağıtım Lojistiğinin Planlanması', aciklama: 'Araç ve gönüllü planlaması yapılacak.', sorumluId: 2, sonTarih: '2025-03-15', oncelik: GorevOncelik.NORMAL, durum: GorevStatus.YAPILACAK },
    { id: 3, baslik: 'İhtiyaç Sahibi Listelerinin Güncellenmesi', aciklama: 'Son 6 ayda başvuranlar arasından listeler güncellenecek.', sorumluId: 4, sonTarih: '2025-03-05', oncelik: GorevOncelik.YUKSEK, durum: GorevStatus.TAMAMLANDI },
];

const MOCK_GOREVLER_KISLIK: Gorev[] = [
    { id: 4, baslik: 'Giysi Bağışlarının Toplanması', aciklama: 'Belirlenen noktalardan giysi bağışları toplanacak.', sorumluId: 7, sonTarih: '2024-10-15', oncelik: GorevOncelik.YUKSEK, durum: GorevStatus.TAMAMLANDI },
    { id: 5, baslik: 'Giysilerin Tasnif Edilmesi', aciklama: 'Toplanan giysiler yaş ve cinsiyete göre ayrılacak.', sorumluId: 4, sonTarih: '2024-10-25', oncelik: GorevOncelik.NORMAL, durum: GorevStatus.YAPILIYOR },
];

export const MOCK_PROJELER: Proje[] = [
    {
        id: 1,
        name: 'Ramazan Kumanyası 2025',
        manager: 'Ayşe Kaya',
        status: ProjeStatus.DEVAM_EDIYOR,
        startDate: '2025-02-15',
        endDate: '2025-03-25',
        budget: 50000,
        spent: 15000,
        progress: 45,
        description: 'Ramazan ayı boyunca ihtiyaç sahibi ailelere temel gıda malzemelerinden oluşan kumanya paketlerinin ulaştırılması projesi.',
        gorevler: MOCK_GOREVLER_RAMAZAN
    },
    {
        id: 2,
        name: 'Kışlık Giysi Yardımı 2024',
        manager: 'Hasan Şahin',
        status: ProjeStatus.PLANLAMA,
        startDate: '2024-10-01',
        endDate: '2024-12-01',
        budget: 20000,
        spent: 2500,
        progress: 10,
        description: 'Soğuk kış aylarında ihtiyaç sahibi çocuk ve yetişkinlere mont, bot, kazak gibi kışlık giysilerin temin edilmesi ve dağıtılması.',
        gorevler: MOCK_GOREVLER_KISLIK
    },
    {
        id: 3,
        name: 'Eğitime Destek Bursları 2023',
        manager: 'Yönetici Kullanıcı',
        status: ProjeStatus.TAMAMLANDI,
        startDate: '2023-09-01',
        endDate: '2024-06-15',
        budget: 120000,
        spent: 120000,
        progress: 100,
        description: '2023-2024 eğitim öğretim yılında başarılı ve ihtiyaç sahibi 10 üniversite öğrencisine burs desteği sağlanması projesi.',
    }
];
