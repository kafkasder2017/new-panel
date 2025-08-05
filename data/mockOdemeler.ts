import { Odeme, OdemeTuru, OdemeDurumu, OdemeYontemi } from '../types';

export const MOCK_ODEMELER: Odeme[] = [
    {
        id: 1,
        odemeTuru: OdemeTuru.YARDIM_ODEMESI,
        kisi: 'Ahmet Yılmaz',
        tutar: 750,
        paraBirimi: 'TRY',
        aciklama: 'Yardım Başvurusu #1 - Acil Kira/Fatura Desteği',
        odemeYontemi: OdemeYontemi.BANKA_TRANSFERI,
        odemeTarihi: '2024-07-13',
        durum: OdemeDurumu.TAMAMLANAN
    },
    {
        id: 2,
        odemeTuru: OdemeTuru.BURS_ODEMESI,
        kisi: 'Elif Can',
        tutar: 1500,
        paraBirimi: 'TRY',
        aciklama: 'Temmuz 2024 Burs Ödemesi',
        odemeYontemi: OdemeYontemi.BANKA_TRANSFERI,
        odemeTarihi: '2024-07-05',
        durum: OdemeDurumu.TAMAMLANAN
    },
    {
        id: 3,
        odemeTuru: OdemeTuru.YETIM_DESTEGI,
        kisi: 'Ayşe Yıldırım (Veli)',
        tutar: 500,
        paraBirimi: 'TRY',
        aciklama: 'Temmuz 2024 Yetim Aylığı',
        odemeYontemi: OdemeYontemi.NAKIT,
        odemeTarihi: '2024-07-02',
        durum: OdemeDurumu.TAMAMLANAN
    },
    {
        id: 4,
        odemeTuru: OdemeTuru.VEFA_DESTEGI,
        kisi: 'Hasan Yücel',
        tutar: 250,
        paraBirimi: 'TRY',
        aciklama: 'Temmuz 2024 Vefa Destek Nakit Yardımı',
        odemeYontemi: OdemeYontemi.NAKIT,
        odemeTarihi: '2024-07-10',
        durum: OdemeDurumu.TAMAMLANAN
    },
    {
        id: 5,
        odemeTuru: OdemeTuru.GIDER_ODEMESI,
        kisi: 'Merkez Ofis',
        tutar: 1850,
        paraBirimi: 'TRY',
        aciklama: 'Haziran 2024 Elektrik Faturası',
        odemeYontemi: OdemeYontemi.BANKA_TRANSFERI,
        odemeTarihi: '2024-07-08',
        durum: OdemeDurumu.TAMAMLANAN
    }
];
