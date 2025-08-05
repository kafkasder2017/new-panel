import React, { useState, useMemo, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import toast from 'react-hot-toast';
import { OgrenciBursu, PerformansNotu, Odeme, OdemeTuru } from '../types';
import Modal from './Modal';
import { getOgrenciBursuById, getOdemeler, updateOgrenciBursu } from '../services/apiService';


const StatCard: React.FC<{ label: string, value: React.ReactNode, icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-4">
        <div className="p-3 bg-blue-100 rounded-full text-blue-600">{icon}</div>
        <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-lg font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const TabButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors duration-200 ${
            active ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
        }`}
    >
        {children}
    </button>
);

const OgrenciBursDetay: React.FC = () => {
    const { bursId } = ReactRouterDOM.useParams<{ bursId: string }>();
    const [burs, setBurs] = useState<OgrenciBursu | null>(null);
    const [payments, setPayments] = useState<Odeme[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!bursId) return;

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [bursData, paymentsData] = await Promise.all([
                    getOgrenciBursuById(parseInt(bursId, 10)),
                    getOdemeler()
                ]);

                if (bursData) {
                    const paymentHistory = paymentsData.filter(p => p.odemeTuru === OdemeTuru.BURS_ODEMESI && p.kisi === bursData.ogrenciAdi);
                    setBurs({ ...bursData, odemeGecmisi: paymentHistory });
                    setPayments(paymentsData);
                } else {
                    setBurs(null);
                }
                setError('');
            } catch (err: any) {
                setError(err.message || 'Veri yüklenemedi.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [bursId]);


    const [activeTab, setActiveTab] = useState<'payments' | 'performance'>('payments');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const handleSavePerformanceNote = async (note: Omit<PerformansNotu, 'id'>) => {
        if (!burs) return;
        const noteToAdd: PerformansNotu = { ...note, id: Date.now() };
        const updatedHistory = [noteToAdd, ...(burs.performansGecmisi || [])];
        const updatedBurs = { ...burs, performansGecmisi: updatedHistory, gpa: note.gpa };
        
        try {
            const saved = await updateOgrenciBursu(burs.id, { performansGecmisi: updatedHistory, gpa: note.gpa });
            setBurs(saved);
        } catch(err) {
            toast.error("Performans notu güncellenirken bir hata oluştu.");
        }
        
        setIsModalOpen(false);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    }

    if (error) {
        return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    }


    if (!burs) {
        return (
             <div className="text-center py-20 text-slate-500">
                <h2 className="text-2xl font-bold">Burs Kaydı Bulunamadı</h2>
                <p className="mt-2">Belirtilen ID ile bir burs kaydı bulunamadı.</p>
                <ReactRouterDOM.Link to="/burslar" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                    Burs Listesine Geri Dön
                </ReactRouterDOM.Link>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm flex items-center space-x-6">
                 <img src={`https://i.pravatar.cc/100?u=${burs.ogrenciAdi}`} alt={burs.ogrenciAdi} className="h-20 w-20 rounded-full" />
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{burs.ogrenciAdi}</h2>
                    <p className="text-slate-500 mt-1">{burs.okulAdi} - {burs.bolum}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Burs Türü" value={burs.bursTuru} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 18-6-6 6-6 6 6Z"/><path d="m6 18-6-6 6-6 6 6Z"/></svg>}/>
                <StatCard label="Aylık Tutar" value={burs.bursMiktari.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}/>
                <StatCard label="Güncel GPA" value={typeof burs.gpa === 'number' ? burs.gpa.toFixed(2) : 'N/A'} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 22v-4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4"/><path d="M18 10a6 6 0 0 0-12 0"/></svg>}/>
                <StatCard label="Durum" value={burs.durum} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 12 4 10 4-10-4-10zM2 12h8"/><path d="M2 18h8"/><path d="M2 6h8"/></svg>}/>
            </div>
            
             <div className="bg-white rounded-lg shadow-sm">
                <div className="border-b border-slate-200 px-4">
                    <nav className="-mb-px flex space-x-4">
                        <TabButton active={activeTab === 'payments'} onClick={() => setActiveTab('payments')}>Ödeme Geçmişi</TabButton>
                        <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')}>Performans Takibi</TabButton>
                    </nav>
                </div>
                <div className="p-6">
                    {activeTab === 'payments' && <PaymentHistory history={burs.odemeGecmisi || []} />}
                    {activeTab === 'performance' && <PerformanceHistory history={burs.performansGecmisi || []} onAddNote={() => setIsModalOpen(true)} />}
                </div>
            </div>

            {isModalOpen && (
                <PerformansNotuModal 
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSavePerformanceNote}
                    currentGpa={burs.gpa}
                />
            )}
        </div>
    );
};

// Sub-components for tabs
const PaymentHistory: React.FC<{ history: Odeme[] }> = ({ history }) => {
    if (!history.length) return <p className="text-sm text-slate-500">Bu bursa ait ödeme kaydı bulunamadı.</p>;
    return (
        <ul className="space-y-3">
            {history.map(item => (
                <li key={item.id} className="p-3 bg-slate-50 rounded-md flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-slate-800">{item.aciklama}</p>
                        <p className="text-xs text-slate-500">{item.odemeYontemi}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-green-700">{item.tutar.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}</p>
                        <p className="text-sm text-slate-600">{new Date(item.odemeTarihi).toLocaleDateString('tr-TR')}</p>
                    </div>
                </li>
            ))}
        </ul>
    );
};

const PerformanceHistory: React.FC<{ history: PerformansNotu[], onAddNote: () => void }> = ({ history, onAddNote }) => {
    return (
        <div className="space-y-4">
            <div className="text-right">
                <button onClick={onAddNote} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700">Yeni Performans Notu Ekle</button>
            </div>
            <ul className="space-y-3">
                {history.map(item => (
                    <li key={item.id} className="p-3 bg-slate-50 rounded-md">
                        <div className="flex justify-between items-center mb-1">
                             <p className="font-semibold text-slate-800">Dönem Notu: <span className="text-blue-600">{typeof item.gpa === 'number' ? item.gpa.toFixed(2) : 'N/A'}</span></p>
                             <span className="text-xs text-slate-500">{new Date(item.tarih).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <p className="text-sm text-slate-600">{item.not}</p>
                    </li>
                ))}
            </ul>
             {!history.length && <p className="text-sm text-slate-500 text-center">Henüz performans kaydı girilmemiş.</p>}
        </div>
    );
};

const PerformansNotuModal: React.FC<{ onClose: () => void, onSave: (note: Omit<PerformansNotu, 'id'>) => void, currentGpa: number }> = ({ onClose, onSave, currentGpa }) => {
     const [formData, setFormData] = useState({
        gpa: currentGpa,
        not: '',
        tarih: new Date().toISOString().split('T')[0]
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'gpa' ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.not) {
            toast.error('Not alanı zorunludur.');
            return;
        }
        onSave(formData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Yeni Performans Notu Ekle">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Dönem/Yıl</label>
                        <input type="date" name="tarih" value={formData.tarih} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" required/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Yeni GPA</label>
                        <input type="number" name="gpa" step="0.01" min="0" max="4" value={formData.gpa} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" required/>
                    </div>
                 </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Notlar</label>
                    <textarea name="not" value={formData.not} onChange={handleChange} rows={3} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" placeholder="Dönem başarısı, devam durumu veya diğer notlar..." required></textarea>
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300">İptal</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Kaydet</button>
                 </div>
            </form>
        </Modal>
    )
}

export default OgrenciBursDetay;