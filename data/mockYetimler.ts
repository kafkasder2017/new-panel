import { Yetim, EgitimSeviyesi, DestekDurumu } from '../types';

export const MOCK_YETIMLER: Yetim[] = [
    {
        id: 1,
        adiSoyadi: 'Ali Veli',
        dogumTarihi: '2015-06-10',
        cinsiyet: 'Erkek',
        veliAdi: 'Ayşe Yıldırım (Anne)',
        veliTelefonu: '5381112233',
        sehir: 'İstanbul',
        egitimSeviyesi: EgitimSeviyesi.ILKOKUL,
        okulAdi: 'Fatih İlkokulu',
        destekDurumu: DestekDurumu.DESTEK_ALIYOR,
        kayitTarihi: '2023-01-20'
    },
    {
        id: 2,
        adiSoyadi: 'Meryem Can',
        dogumTarihi: '2012-09-01',
        cinsiyet: 'Kız',
        veliAdi: 'Ahmet Can (Amca)',
        veliTelefonu: '5372223344',
        sehir: 'Ankara',
        egitimSeviyesi: EgitimSeviyesi.ORTAOKUL,
        okulAdi: 'Atatürk Ortaokulu',
        destekDurumu: DestekDurumu.DESTEK_ALIYOR,
        kayitTarihi: '2022-08-15'
    },
    {
        id: 3,
        adiSoyadi: 'Ömer Aslan',
        dogumTarihi: '2018-02-25',
        cinsiyet: 'Erkek',
        veliAdi: 'Zehra Aslan (Anne)',
        veliTelefonu: '5363334455',
        sehir: 'İstanbul',
        egitimSeviyesi: EgitimSeviyesi.OKUL_ONCESI,
        okulAdi: 'Papatya Anaokulu',
        destekDurumu: DestekDurumu.DESTEK_ALMIYOR,
        kayitTarihi: '2024-03-10'
    }
];
