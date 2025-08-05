import { VefaDestek, VefaDestekTuru, VefaDestekDurumu } from '../types';

export const MOCK_VEFA_DESTEK: VefaDestek[] = [
    {
        id: 1,
        adiSoyadi: 'Hasan Yücel',
        dogumTarihi: '1945-05-20',
        telefon: '5321002030',
        adres: 'Fatih, İstanbul',
        destekTuru: VefaDestekTuru.ALISVERIS_DESTEGI,
        destekDurumu: VefaDestekDurumu.AKTIF,
        sorumluGonullu: 'Fatma Kaya',
        kayitTarihi: '2023-02-10'
    },
    {
        id: 2,
        adiSoyadi: 'Emine Doğan',
        dogumTarihi: '1950-01-15',
        telefon: '5422003040',
        adres: 'Keçiören, Ankara',
        destekTuru: VefaDestekTuru.EVDE_TEMIZLIK,
        destekDurumu: VefaDestekDurumu.AKTIF,
        sorumluGonullu: 'Zeynep Demir',
        kayitTarihi: '2023-06-01'
    },
    {
        id: 3,
        adiSoyadi: 'İsmail Kurt',
        dogumTarihi: '1948-11-30',
        telefon: '5333004050',
        adres: 'Üsküdar, İstanbul',
        destekTuru: VefaDestekTuru.SOSYAL_AKTIVITE,
        destekDurumu: VefaDestekDurumu.PASIF,
        sorumluGonullu: 'Hasan Şahin',
        kayitTarihi: '2022-10-05'
    }
];
