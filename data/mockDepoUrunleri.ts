import { DepoUrunu, DepoUrunKategorisi, DepoUrunBirimi } from '../types';

export const MOCK_DEPO_URUNLERI: DepoUrunu[] = [
    {
        id: 1,
        code: 'GD-001',
        name: 'Makarna',
        barcode: '8690570000001',
        category: DepoUrunKategorisi.GIDA,
        quantity: 150,
        unit: DepoUrunBirimi.PAKET,
        minStockLevel: 50,
        lastUpdated: '2024-07-15',
        expirationDate: '2025-12-31',
        supplier: 'Gıda A.Ş.',
        description: '500g Burgu Makarna'
    },
    {
        id: 2,
        code: 'GD-002',
        name: 'Un',
        barcode: '8690570000002',
        category: DepoUrunKategorisi.GIDA,
        quantity: 45,
        unit: DepoUrunBirimi.KG,
        minStockLevel: 20,
        lastUpdated: '2024-07-10',
        expirationDate: '2025-01-31',
        supplier: 'Gıda A.Ş.',
    },
     {
        id: 3,
        code: 'GY-001',
        name: 'Erkek Mont',
        category: DepoUrunKategorisi.GIYIM,
        quantity: 30,
        unit: DepoUrunBirimi.ADET,
        minStockLevel: 10,
        lastUpdated: '2024-02-01',
        description: 'Farklı bedenlerde kışlık mont'
    },
    {
        id: 4,
        code: 'TMZ-001',
        name: 'Bebek Bezi',
        barcode: '8690570000004',
        category: DepoUrunKategorisi.TEMIZLIK,
        quantity: 25,
        unit: DepoUrunBirimi.PAKET,
        minStockLevel: 30,
        lastUpdated: '2024-07-01',
        description: '4 Numara Bebek Bezi'
    },
    {
        id: 5,
        code: 'KRT-001',
        name: 'Okul Defteri',
        category: DepoUrunKategorisi.KIRTASIYE,
        quantity: 200,
        unit: DepoUrunBirimi.ADET,
        minStockLevel: 100,
        lastUpdated: '2024-07-18',
    },
    {
        id: 6,
        code: 'GD-003',
        name: 'Süt (UHT)',
        barcode: '8690570000003',
        category: DepoUrunKategorisi.GIDA,
        quantity: 80,
        unit: DepoUrunBirimi.LITRE,
        minStockLevel: 40,
        lastUpdated: '2024-07-12',
        expirationDate: '2024-09-30',
        supplier: 'Süt A.Ş.',
        description: '1L Tam Yağlı UHT Süt'
    }
];
