import { Kurum, KurumTuru, PersonStatus } from '../types';

export const MOCK_KURUMLAR: Kurum[] = [
    {
        id: 1,
        resmiUnvan: 'Ankara Büyükşehir Belediyesi Sosyal Hizmetler Daire Başkanlığı',
        kisaAd: 'ABB Sosyal Hizmetler',
        kurumTuru: KurumTuru.RESMI_KURUM,
        vergiDairesi: 'Maltepe',
        vergiNumarasi: '1234567890',
        telefon: '0312 555 1122',
        email: 'sosyalhizmetler@ankara.bel.tr',
        adres: 'Hipodrom Cd. No:5, 06330 Yenimahalle/Ankara',
        yetkiliKisiId: 5,
        status: PersonStatus.AKTIF,
        kayitTarihi: '2023-01-15'
    },
    {
        id: 2,
        resmiUnvan: 'Yılmaz Gıda Sanayi ve Ticaret A.Ş.',
        kisaAd: 'Yılmaz Gıda',
        kurumTuru: KurumTuru.OZEL_SEKTOR,
        vergiDairesi: 'Ulus',
        vergiNumarasi: '0987654321',
        telefon: '0212 444 5566',
        email: 'info@yilmazgida.com.tr',
        adres: 'Organize Sanayi Bölgesi, Sincan/Ankara',
        yetkiliKisiId: 3,
        status: PersonStatus.AKTIF,
        kayitTarihi: '2023-05-20'
    },
    {
        id: 3,
        resmiUnvan: 'Umut Işığı Derneği',
        kisaAd: 'Umut Işığı',
        kurumTuru: KurumTuru.STK,
        telefon: '0312 222 3344',
        email: 'iletisim@umutisigi.org',
        adres: 'Kızılay, Çankaya/Ankara',
        yetkiliKisiId: 7,
        status: PersonStatus.PASIF,
        kayitTarihi: '2022-11-10'
    }
];