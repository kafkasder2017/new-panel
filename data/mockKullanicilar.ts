import { Kullanici, KullaniciRol, KullaniciDurum } from '../types';

export const MOCK_KULLANICILAR: Kullanici[] = [
    {
        id: 1,
        kullaniciAdi: 'Yönetici Kullanıcı',
        email: 'admin@kafkader.org',
        rol: KullaniciRol.YONETICI,
        durum: KullaniciDurum.AKTIF,
        sonGiris: '2024-07-20T10:00:00Z'
    },
    {
        id: 2,
        kullaniciAdi: 'Ayşe Kaya',
        email: 'ayse.kaya@example.com',
        rol: KullaniciRol.EDITOR,
        durum: KullaniciDurum.AKTIF,
        sonGiris: '2024-07-19T14:30:00Z'
    },
    {
        id: 3,
        kullaniciAdi: 'Mehmet Öztürk',
        email: 'mehmet.ozturk@example.com',
        rol: KullaniciRol.MUHASEBE,
        durum: KullaniciDurum.AKTIF,
        sonGiris: '2024-07-20T09:15:00Z'
    },
    {
        id: 4,
        kullaniciAdi: 'Zeynep Demir',
        email: 'zeynep.demir@example.com',
        rol: KullaniciRol.GONULLU,
        durum: KullaniciDurum.AKTIF,
        sonGiris: '2024-07-18T18:00:00Z'
    },
     {
        id: 5,
        kullaniciAdi: 'Mustafa Çelik',
        email: 'mustafa.celik@example.com',
        rol: KullaniciRol.GONULLU,
        durum: KullaniciDurum.PASIF,
        sonGiris: '2024-05-10T11:00:00Z'
    }
];
