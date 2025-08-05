import { Etkinlik, EtkinlikStatus } from '../types';

export const MOCK_ETKINLIKLER: Etkinlik[] = [
    {
        id: 1,
        ad: 'Geleneksel Bahar Şenliği',
        tarih: '2024-05-25',
        saat: '14:00',
        konum: 'Dernek Merkezi Bahçesi',
        aciklama: 'Tüm üyelerimiz ve ailelerinin davetli olduğu yıllık bahar şenliğimiz. Çeşitli etkinlikler ve ikramlar olacaktır.',
        status: EtkinlikStatus.TAMAMLANDI,
        sorumluId: 2, // Fatma Kaya
        katilimcilar: [
            { personId: 3, kayitTarihi: '2024-05-20' },
            { personId: 5, kayitTarihi: '2024-05-21' },
            { personId: 7, kayitTarihi: '2024-05-22' }
        ]
    },
    {
        id: 2,
        ad: 'Gönüllü Tanışma ve Eğitim Toplantısı',
        tarih: '2024-08-10',
        saat: '19:00',
        konum: 'Dernek Merkezi Konferans Salonu',
        aciklama: 'Yeni gönüllülerimizle tanışmak ve saha çalışmaları hakkında temel eğitim vermek amacıyla düzenlenecek toplantı.',
        status: EtkinlikStatus.YAYINDA,
        sorumluId: 7, // Hasan Şahin
        katilimcilar: [
            { personId: 2, kayitTarihi: '2024-07-20' }
        ]
    },
    {
        id: 3,
        ad: 'Kışlık Yardım Kampanyası Başlangıcı',
        tarih: '2024-10-05',
        saat: '11:00',
        konum: 'Kızılay Meydanı Standı',
        aciklama: 'Kışlık giysi ve battaniye toplama kampanyamızın açılış etkinliği.',
        status: EtkinlikStatus.PLANLAMA,
        sorumluId: 2, // Fatma Kaya
        katilimcilar: []
    }
];
