import { Bagis, BagisTuru } from '../types';

export const MOCK_BAGISLAR: Bagis[] = [
    {
        id: 1,
        bagisciId: 3, // Mehmet Öztürk
        tutar: 500,
        paraBirimi: 'TRY',
        bagisTuru: BagisTuru.KREDI_KARTI,
        tarih: '2024-07-15',
        aciklama: 'Genel Bağış',
        makbuzNo: 'MKZ-2024-001'
    },
    {
        id: 2,
        bagisciId: 2, // Fatma Kaya
        tutar: 150,
        paraBirimi: 'TRY',
        bagisTuru: BagisTuru.BANKA_TRANSFERI,
        tarih: '2024-07-10',
        aciklama: 'Ramazan Kumanyası Projesi için',
        projeId: 1,
        makbuzNo: 'MKZ-2024-002'
    },
    {
        id: 3,
        bagisciId: 7, // Hasan Şahin
        tutar: 1000,
        paraBirimi: 'TRY',
        bagisTuru: BagisTuru.NAKIT,
        tarih: '2024-06-25',
        aciklama: 'Yetim Sponsorluğu',
        makbuzNo: 'MKZ-2024-003'
    },
    {
        id: 4,
        bagisciId: 3, // Mehmet Öztürk
        tutar: 2500,
        paraBirimi: 'TRY',
        bagisTuru: BagisTuru.ONLINE,
        tarih: '2024-06-05',
        aciklama: 'Kışlık Giysi Yardımı Projesine Destek',
        projeId: 2,
        makbuzNo: 'MKZ-2024-004'
    },
     {
        id: 5,
        bagisciId: 6, // Ayşe Aydın
        tutar: 250,
        paraBirimi: 'TRY',
        bagisTuru: BagisTuru.KREDI_KARTI,
        tarih: '2024-07-18',
        aciklama: 'Genel Bağış',
        makbuzNo: 'MKZ-2024-005'
    }
];
