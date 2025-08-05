import React, { useState, useMemo, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Odeme, AyniYardimIslemi, Person, DepoUrunu, OdemeTuru } from '../types';
import { getOdemeler, getAyniYardimIslemleri, getPeople, getDepoUrunleri } from '../services/apiService';

interface BirlesikYardim {
    id: string; // "nakit-1" or "ayni-1"
    kisiAdi: string;
    yardimTipi: 'Nakit' | 'Ayni';
    aciklama: string;
    tutarMiktar: string; // formatted string
    tarih: string;
    orjinalKayit: Odeme | AyniYardimIslemi;
}

const TumYardimlarListesi: React.FC = () => {
    const [payments, setPayments] = useState<Odeme[]>([]);
    const [inKindAids, setInKindAids] = useState<AyniYardimIslemi[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [products, setProducts] = useState<DepoUrunu[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchParams] = ReactRouterDOM.useSearchParams();
    const kisiAdiFromQuery = searchParams.get('kisiAdi');

    const [typeFilter, setTypeFilter] = useState<'all' | 'Nakit' | 'Ayni'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError('');
            try {
                const [paymentsData, inKindData, peopleData, productsData] = await Promise.all([
                    getOdemeler(),
                    getAyniYardimIslemleri(),
                    getPeople(),
                    getDepoUrunleri()
                ]);
                setPayments(paymentsData);
                setInKindAids(inKindData);
                setPeople(peopleData);
                setProducts(productsData);
            } catch (err: any) {
                setError(err.message || 'Yardım verileri yüklenemedi.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (kisiAdiFromQuery) {
            setSearchTerm(decodeURIComponent(kisiAdiFromQuery));
        }
    }, [kisiAdiFromQuery]);

    const peopleMap = useMemo(() => new Map(people.map(p => [p.id, `${p.ad} ${p.soyad}`])), [people]);
    const productsMap = useMemo(() => new Map(products.map(p => [p.id, p.name])), [products]);

    const birlesikYardimlar = useMemo((): BirlesikYardim[] => {
        const nakitYardimlar: BirlesikYardim[] = payments
            .filter(p => [OdemeTuru.YARDIM_ODEMESI, OdemeTuru.BURS_ODEMESI, OdemeTuru.YETIM_DESTEGI, OdemeTuru.VEFA_DESTEGI].includes(p.odemeTuru))
            .map(p => ({
                id: `nakit-${p.id}`,
                kisiAdi: p.kisi || '',
                yardimTipi: 'Nakit',
                aciklama: p.aciklama || '',
                tutarMiktar: p.tutar.toLocaleString('tr-TR', { style: 'currency', currency: p.paraBirimi }),
                tarih: p.odemeTarihi,
                orjinalKayit: p
            }));
        
        const ayniYardimlar: BirlesikYardim[] = inKindAids.map(a => ({
            id: `ayni-${a.id}`,
            kisiAdi: peopleMap.get(a.kisiId) || 'Bilinmeyen Kişi',
            yardimTipi: 'Ayni',
            aciklama: productsMap.get(a.urunId) || 'Bilinmeyen Ürün',
            tutarMiktar: `${a.miktar} ${a.birim}`,
            tarih: a.tarih,
            orjinalKayit: a
        }));

        return [...nakitYardimlar, ...ayniYardimlar].sort((a,b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime());
    }, [payments, inKindAids, peopleMap, productsMap]);
    
    const filteredYardimlar = useMemo(() => {
        return birlesikYardimlar.filter(y => {
            const matchesType = typeFilter === 'all' || y.yardimTipi === typeFilter;
            const matchesSearch = searchTerm === '' || 
                                  y.kisiAdi.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  y.aciklama.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesType && matchesSearch;
        });
    }, [birlesikYardimlar, typeFilter, searchTerm]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    }

    if (error) {
        return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    }
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 mb-6">
                <div className="w-full md:w-1/3">
                    <input
                        type="text"
                        placeholder="Kişi veya açıklama ara..."
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium">Yardım Tipi:</label>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="all">Tümü</option>
                        <option value="Nakit">Nakit</option>
                        <option value="Ayni">Ayni</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 font-semibold">Tarih</th>
                            <th scope="col" className="px-6 py-3 font-semibold">Kişi</th>
                            <th scope="col" className="px-6 py-3 font-semibold">Yardım Tipi</th>
                            <th scope="col" className="px-6 py-3 font-semibold">Açıklama / Ürün</th>
                            <th scope="col" className="px-6 py-3 font-semibold text-right">Tutar / Miktar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredYardimlar.map((yardim) => (
                            <tr key={yardim.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">{new Date(yardim.tarih).toLocaleDateString('tr-TR')}</td>
                                <td className="px-6 py-4 font-medium text-slate-900">{yardim.kisiAdi}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${yardim.yardimTipi === 'Nakit' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                                        {yardim.yardimTipi}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{yardim.aciklama}</td>
                                <td className="px-6 py-4 text-right font-semibold text-slate-700">{yardim.tutarMiktar}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {filteredYardimlar.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                    <p>Gösterilecek yardım kaydı bulunamadı.</p>
                </div>
            )}
        </div>
    );
};

export default TumYardimlarListesi;