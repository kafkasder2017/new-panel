import { Yorum, LogEntityType } from '../types';

export const MOCK_YORUMLAR: Yorum[] = [
    {
        id: 1,
        timestamp: '2024-07-14T10:30:00Z',
        kullaniciId: 2,
        kullaniciAdi: 'Ayşe Kaya',
        kullaniciAvatarUrl: 'https://i.pravatar.cc/100?u=ayse.kaya@example.com',
        icerik: 'Başvuru sahibinin durumu incelendi, acil yardım kategorisinde değerlendirilebilir. @YöneticiKullanıcı başkan onayına sunalım mı?',
        entityTipi: LogEntityType.APPLICATION,
        entityId: 1,
    },
    {
        id: 2,
        timestamp: '2024-07-14T11:05:00Z',
        kullaniciId: 1,
        kullaniciAdi: 'Yönetici Kullanıcı',
        kullaniciAvatarUrl: 'https://i.pravatar.cc/100?u=admin@kafkader.org',
        icerik: 'Teşekkürler @AyşeKaya. Dokümanları kontrol edip onaya sunuyorum.',
        entityTipi: LogEntityType.APPLICATION,
        entityId: 1,
    },
    {
        id: 3,
        timestamp: '2024-07-15T09:00:00Z',
        kullaniciId: 3,
        kullaniciAdi: 'Mehmet Öztürk',
        kullaniciAvatarUrl: 'https://i.pravatar.cc/100?u=mehmet.ozturk@example.com',
        icerik: 'Bu başvurunun eğitim yardımı talebi için ek belgeler gerekiyor. Başvuru sahibinden talep edebilir miyiz?',
        entityTipi: LogEntityType.APPLICATION,
        entityId: 2,
    }
];
