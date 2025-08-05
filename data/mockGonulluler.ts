import { Gonullu, GonulluDurum, Beceri } from '../types';

export const MOCK_GONULLULER: Gonullu[] = [
    {
        id: 1,
        personId: 2, // Fatma Kaya
        baslangicTarihi: '2022-11-20',
        durum: GonulluDurum.AKTIF,
        beceriler: [Beceri.ORGANIZASYON, Beceri.ILETISIM],
        ilgiAlanlari: ['Çocuklar', 'Eğitim'],
        musaitlik: 'Hafta sonları',
        toplamSaat: 120
    },
    {
        id: 2,
        personId: 7, // Hasan Şahin
        baslangicTarihi: '2021-08-01',
        durum: GonulluDurum.AKTIF,
        beceriler: [Beceri.SAHA_CALISMASI, Beceri.TEKNIK_DESTEK, Beceri.YABANCI_DIL],
        ilgiAlanlari: ['Lojistik', 'Tercümanlık'],
        musaitlik: 'Hafta içi akşamları',
        toplamSaat: 250
    },
    {
        id: 3,
        personId: 5, // Mustafa Çelik
        baslangicTarihi: '2023-04-01',
        durum: GonulluDurum.PASIF,
        beceriler: [Beceri.SAHA_CALISMASI],
        ilgiAlanlari: ['Gençlik Aktiviteleri'],
        musaitlik: 'Dönemsel',
        toplamSaat: 40
    }
];
