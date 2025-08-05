import { Aidat, AidatDurumu } from '../types';

export const MOCK_AIDATLAR: Aidat[] = [
    { id: 1, uyeId: 2, donem: '2024-Ocak', tutar: 100, durum: AidatDurumu.ODENDI, odemeTarihi: '2024-01-15' },
    { id: 2, uyeId: 2, donem: '2024-Şubat', tutar: 100, durum: AidatDurumu.ODENDI, odemeTarihi: '2024-02-12' },
    { id: 3, uyeId: 2, donem: '2024-Mart', tutar: 100, durum: AidatDurumu.BEKLEMEDE },
    { id: 4, uyeId: 4, donem: '2024-Ocak', tutar: 150, durum: AidatDurumu.ODENDI, odemeTarihi: '2024-01-10' },
    { id: 5, uyeId: 4, donem: '2024-Şubat', tutar: 150, durum: AidatDurumu.ODENDI, odemeTarihi: '2024-02-15' },
    { id: 6, uyeId: 4, donem: '2024-Mart', tutar: 150, durum: AidatDurumu.ODENDI, odemeTarihi: '2024-03-11' },
    { id: 7, uyeId: 6, donem: '2024-Ocak', tutar: 100, durum: AidatDurumu.BEKLEMEDE },
    { id: 8, uyeId: 6, donem: '2024-Şubat', tutar: 100, durum: AidatDurumu.BEKLEMEDE },
    { id: 9, uyeId: 6, donem: '2024-Mart', tutar: 100, durum: AidatDurumu.BEKLEMEDE },
];