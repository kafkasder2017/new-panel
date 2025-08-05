import React, { useState, useMemo, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import toast from 'react-hot-toast';
import { Dava, Durusma, Gelisime, Masraf, DavaStatus } from '../types';
import Modal from './Modal';
import { getDavaById, updateDava } from '../services/apiService';

const DavaDetay: React.FC = () => {
    const { davaId } = ReactRouterDOM.useParams<{ davaId: string }>();
    const [caseDetails, setCaseDetails] = useState<Dava | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!davaId) return;

        const fetchDava = async () => {
            try {
                setIsLoading(true);
                const data = await getDavaById(parseInt(davaId, 10));
                setCaseDetails(data);
                setError('');
            } catch (err: any) {
                setError(err.message || 'Dava detayı yüklenirken bir hata oluştu.');
                setCaseDetails(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDava();
    }, [davaId]);


    const [modal, setModal] = useState<'durumsma' | 'gelisme' | 'masraf' | null>(null);

    const updateCaseOnServer = async (updatedCase: Dava) => {
        try {
            // Optimistic UI update
            setCaseDetails(updatedCase);
            const savedCase = await updateDava(updatedCase.id, updatedCase);
            // Sync with server state
            setCaseDetails(savedCase);
        } catch (err) {
            toast.error('Dava güncellenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
            console.error(err);
        }
    };

    const handleAddDurusma = (newDurusma: Omit<Durusma, 'id'>) => {
        if (!caseDetails) return;
        const durusmaToAdd: Durusma = { ...newDurusma, id: Date.now() };
        const updatedCase = {
            ...caseDetails,
            durusmalar: [...(caseDetails.durusmalar || []), durusmaToAdd],
        };
        updateCaseOnServer(updatedCase);
        setModal(null);
    };
    
    const handleAddGelisime = (newGelisime: Omit<Gelisime, 'id'>) => {
        if (!caseDetails) return;
        const gelisimeToAdd: Gelisime = { ...newGelisime, id: Date.now(), tarih: new Date().toISOString().split('T')[0] };
        const updatedCase = {
            ...caseDetails,
            gelismeler: [...(caseDetails.gelismeler || []), gelisimeToAdd].sort((a,b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())
        };
        updateCaseOnServer(updatedCase);
        setModal(null);
    };

    const handleAddMasraf = (newMasraf: Omit<Masraf, 'id'>) => {
        if (!caseDetails) return;
        const masrafToAdd: Masraf = { ...newMasraf, id: Date.now() };
        const updatedCase = {
            ...caseDetails,
            masraflar: [...(caseDetails.masraflar || []), masrafToAdd]
        };
        updateCaseOnServer(updatedCase);
        setModal(null);
    };

     if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="text-center py-20 text-slate-500">
                <h2 className="text-2xl font-bold text-red-600">Hata</h2>
                <p className="mt-2">{error}</p>
                <ReactRouterDOM.Link to="/hukuki-yardim" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                    Dava Listesine Geri Dön
                </ReactRouterDOM.Link>
            </div>
        );
    }

    if (!caseDetails) {
        return (
            <div className="text-center py-20 text-slate-500">
                <h2 className="text-2xl font-bold">Dava Bulunamadı</h2>
                <p className="mt-2">Belirtilen ID ile bir dava kaydı bulunamadı.</p>
                <ReactRouterDOM.Link to="/hukuki-yardim" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                    Dava Listesine Geri Dön
                </ReactRouterDOM.Link>
            </div>
        );
    }
    
    const totalMasraf = useMemo(() => {
        return caseDetails.masraflar?.reduce((acc, curr) => acc + curr.tutar, 0) || 0;
    }, [caseDetails.masraflar]);
    
    const getStatusClass = (status: DavaStatus) => {
        switch (status) {
            case DavaStatus.DEVAM_EDEN: return 'bg-blue-100 text-blue-800';
            case DavaStatus.SONUCLANAN: return 'bg-green-100 text-green-800';
            case DavaStatus.TEMYIZDE: return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{caseDetails.davaKonusu}</h2>
                        <p className="text-slate-500 mt-1">{caseDetails.caseNumber} - {caseDetails.mahkeme}</p>
                    </div>
                    <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${getStatusClass(caseDetails.davaDurumu)}`}>
                        {caseDetails.davaDurumu}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Gelişmeler */}
                    <Card title="Gelişmeler" onAdd={() => setModal('gelisme')}>
                         <ul className="space-y-4">
                            {(caseDetails.gelismeler || []).map(g => (
                                <li key={g.id} className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 h-2.5 w-2.5 bg-blue-500 rounded-full mt-1.5"></div>
                                    <div>
                                        <p className="text-sm text-slate-700">{g.aciklama}</p>
                                        <p className="text-xs text-slate-400">{new Date(g.tarih).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                </li>
                            ))}
                             {!(caseDetails.gelismeler?.length) && <p className="text-sm text-slate-400">Henüz bir gelişme kaydedilmemiş.</p>}
                         </ul>
                    </Card>

                    {/* Duruşmalar */}
                    <Card title="Duruşmalar" onAdd={() => setModal('durumsma')}>
                        <ul className="space-y-3">
                            {(caseDetails.durusmalar || []).map(d => (
                                <li key={d.id} className="p-3 bg-slate-50 rounded-md flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-slate-800">{new Date(d.tarih).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        <p className="text-sm text-slate-600">{d.aciklama}</p>
                                    </div>
                                    <span className="font-bold text-blue-600">{d.saat}</span>
                                </li>
                             ))}
                             {!(caseDetails.durusmalar?.length) && <p className="text-sm text-slate-400">Henüz bir duruşma tarihi belirlenmemiş.</p>}
                        </ul>
                    </Card>
                    
                    {/* Karar */}
                     {caseDetails.davaDurumu === DavaStatus.SONUCLANAN && (
                         <Card title="Mahkeme Kararı">
                             <p className="text-slate-600 whitespace-pre-wrap">{caseDetails.karar || 'Karar bilgisi girilmemiş.'}</p>
                         </Card>
                     )}
                </div>

                <div className="space-y-6">
                    {/* Genel Bilgiler */}
                    <Card title="Dava Bilgileri">
                        <ul className="space-y-2 text-sm">
                            <InfoRow label="Müvekkil" value={caseDetails.muvekkil} />
                            <InfoRow label="Karşı Taraf" value={caseDetails.karsiTaraf} />
                            <InfoRow label="Sorumlu Avukat" value={caseDetails.sorumluAvukat} />
                            <InfoRow label="Dava Türü" value={caseDetails.davaTuru} />
                            <InfoRow label="Açılış Tarihi" value={new Date(caseDetails.acilisTarihi).toLocaleDateString('tr-TR')} />
                        </ul>
                    </Card>
                    {/* Masraflar */}
                    <Card title="Masraflar" onAdd={() => setModal('masraf')}>
                        <ul className="space-y-2">
                             {(caseDetails.masraflar || []).map(m => (
                                 <li key={m.id} className="flex justify-between items-center text-sm">
                                     <span>{m.aciklama}</span>
                                     <span className="font-semibold">{m.tutar.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}</span>
                                 </li>
                             ))}
                             {!(caseDetails.masraflar?.length) && <p className="text-sm text-slate-400 text-center">Masraf kaydı yok.</p>}
                        </ul>
                        <div className="border-t mt-3 pt-3 flex justify-between font-bold text-slate-800">
                            <span>Toplam Masraf</span>
                            <span>{totalMasraf.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}</span>
                        </div>
                    </Card>
                     <Card title="Dava Dosyaları">
                         <p className="text-sm text-slate-400 text-center">Dosya yönetimi entegrasyonu yakında.</p>
                     </Card>
                </div>
            </div>

            {modal === 'durumsma' && 
                <DurusmaEkleModal 
                    onClose={() => setModal(null)} 
                    onSave={handleAddDurusma}
                />
            }
             {modal === 'gelisme' && 
                <GelisimeEkleModal 
                    onClose={() => setModal(null)} 
                    onSave={handleAddGelisime}
                />
            }
             {modal === 'masraf' && 
                <MasrafEkleModal 
                    onClose={() => setModal(null)} 
                    onSave={handleAddMasraf}
                />
            }
        </div>
    );
};

// Sub-components
const Card: React.FC<{ title: string; children: React.ReactNode; onAdd?: () => void }> = ({ title, children, onAdd }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            {onAdd && (
                <button onClick={onAdd} className="text-sm bg-blue-500 text-white px-3 py-1 rounded-md font-semibold hover:bg-blue-600 transition-colors flex items-center space-x-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    <span>Ekle</span>
                </button>
            )}
        </div>
        {children}
    </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <li className="flex justify-between items-center">
        <span className="text-slate-500">{label}:</span>
        <span className="font-semibold text-slate-700 text-right">{value}</span>
    </li>
);

// Modals
const DurusmaEkleModal: React.FC<{ onClose: () => void, onSave: (d: Omit<Durusma, 'id'>) => void }> = ({onClose, onSave}) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSave({
            tarih: formData.get('tarih') as string,
            saat: formData.get('saat') as string,
            aciklama: formData.get('aciklama') as string,
        });
    };
    return (
        <Modal isOpen={true} onClose={onClose} title="Yeni Duruşma Ekle">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Tarih</label>
                        <input type="date" name="tarih" className="mt-1 block w-full p-2 border border-slate-300 rounded-md" required/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Saat</label>
                        <input type="time" name="saat" className="mt-1 block w-full p-2 border border-slate-300 rounded-md" required/>
                    </div>
                 </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Açıklama</label>
                    <textarea name="aciklama" rows={3} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" placeholder="Duruşma konusu, tanıklar vb." required></textarea>
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300">İptal</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Kaydet</button>
                 </div>
            </form>
        </Modal>
    );
};

const GelisimeEkleModal: React.FC<{ onClose: () => void, onSave: (g: Omit<Gelisime, 'id'>) => void }> = ({onClose, onSave}) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSave({
            tarih: new Date().toISOString().split('T')[0], // The date is set on save
            aciklama: formData.get('aciklama') as string,
        });
    };
     return (
        <Modal isOpen={true} onClose={onClose} title="Yeni Gelişme Ekle">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Gelişme Notu</label>
                    <textarea name="aciklama" rows={4} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" placeholder="Dava süreciyle ilgili yeni bir gelişme veya not ekleyin..." required></textarea>
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300">İptal</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Kaydet</button>
                 </div>
            </form>
        </Modal>
    );
};

const MasrafEkleModal: React.FC<{ onClose: () => void, onSave: (m: Omit<Masraf, 'id'>) => void }> = ({onClose, onSave}) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSave({
            tarih: formData.get('tarih') as string,
            aciklama: formData.get('aciklama') as string,
            tutar: parseFloat(formData.get('tutar') as string),
        });
    };
    return (
        <Modal isOpen={true} onClose={onClose} title="Yeni Masraf Ekle">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Tarih</label>
                        <input type="date" name="tarih" className="mt-1 block w-full p-2 border border-slate-300 rounded-md" defaultValue={new Date().toISOString().split('T')[0]} required/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Tutar (TL)</label>
                        <input type="number" step="0.01" name="tutar" className="mt-1 block w-full p-2 border border-slate-300 rounded-md" required/>
                    </div>
                 </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Açıklama</label>
                    <input type="text" name="aciklama" className="mt-1 block w-full p-2 border border-slate-300 rounded-md" placeholder="örn. Posta Gideri, Bilirkişi Ücreti" required />
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300">İptal</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Kaydet</button>
                 </div>
            </form>
        </Modal>
    );
};


export default DavaDetay;