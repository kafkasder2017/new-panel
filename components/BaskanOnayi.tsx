

import React, { useState, useMemo, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { YardimBasvurusu, BasvuruStatus, BasvuruOncelik, Person } from '../types';
import Modal from './Modal';
import { getYardimBasvurulari, getPeople, updateYardimBasvurusu } from '../services/apiService';


const getPriorityClass = (priority: BasvuruOncelik) => {
    switch (priority) {
        case BasvuruOncelik.YUKSEK: return 'border-l-red-500';
        case BasvuruOncelik.ORTA: return 'border-l-yellow-500';
        case BasvuruOncelik.DUSUK: return 'border-l-green-500';
        default: return 'border-l-slate-400';
    }
};

const BaskanOnayi: React.FC = () => {
    const [applications, setApplications] = useState<YardimBasvurusu[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [onayModal, setOnayModal] = useState<{ application: YardimBasvurusu, isApprove: boolean } | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const [appsData, peopleData] = await Promise.all([
                getYardimBasvurulari(),
                getPeople()
            ]);
            setApplications(appsData);
            setPeople(peopleData);
        } catch (err: any) {
            setError(err.message || "Veriler yüklenirken bir hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const onBaskanOnay = async (applicationId: number, isApproved: boolean, note: string) => {
        try {
             const updates = {
                baskanOnayi: isApproved,
                baskanOnayNotu: note,
                durum: isApproved ? BasvuruStatus.ONAYLANAN : BasvuruStatus.BASKAN_REDDETTI,
            };
            const updatedApp = await updateYardimBasvurusu(applicationId, updates);
            setApplications(prev => prev.map(a => a.id === updatedApp.id ? updatedApp : a));
        } catch(err) {
            alert("Başkan onayı işlenirken bir hata oluştu.");
        }
    };


    const peopleMap = useMemo(() => {
        return new Map(people.map(p => [p.id, `${p.ad} ${p.soyad}`]));
    }, [people]);

    const applicationsToReview = useMemo(() => {
        return applications.filter(app => app.durum === BasvuruStatus.ONAYLANAN && !app.baskanOnayi && app.baskanOnayNotu === null);
    }, [applications]);

    const handleOnaySubmit = (note: string) => {
        if (!onayModal) return;
        onBaskanOnay(onayModal.application.id, onayModal.isApprove, note);
        setOnayModal(null);
    };
    
    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    }

    if (error) {
        return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    }

    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="border-b pb-4 mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Başkan Onayı Bekleyen Başvurular</h2>
                    <p className="text-sm text-slate-500 mt-1">Komisyon tarafından onaylanmış ve nihai kararınızı bekleyen yardım başvuruları.</p>
                </div>

                {applicationsToReview.length > 0 ? (
                    <div className="space-y-4">
                        {applicationsToReview.map(app => (
                            <div key={app.id} className={`p-4 bg-slate-50 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md ${getPriorityClass(app.oncelik)}`}>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                                    {/* Info */}
                                    <div className="md:col-span-2">
                                        <p className="font-bold text-slate-800">{peopleMap.get(String(app.basvuruSahibiId)) || 'Bilinmeyen Kişi'}</p>
                                        <p className="text-sm text-slate-600">{app.basvuruTuru}</p>
                                        <p className="text-xs text-slate-400">Başvuru Tarihi: {new Date(app.basvuruTarihi).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                    {/* Tutar */}
                                    <div className="text-slate-700">
                                        <span className="text-xs">Talep Tutarı</span>
                                        <p className="font-semibold text-lg">{app.talepTutari.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                                    </div>
                                    {/* Komisyon Notu */}
                                    <div className="text-slate-700">
                                        <span className="text-xs">Komisyon Notu</span>
                                        <p className="text-sm italic">"{app.degerlendirmeNotu || 'Not belirtilmemiş.'}"</p>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex items-center justify-end space-x-3">
                                        <ReactRouterDOM.Link to={`/yardimlar/${app.id}`} className="text-sm font-semibold text-slate-600 hover:text-slate-800">Detay</ReactRouterDOM.Link>
                                        <button onClick={() => setOnayModal({ application: app, isApprove: false })} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-600">Reddet</button>
                                        <button onClick={() => setOnayModal({ application: app, isApprove: true })} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-600">Onayla</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                        <h3 className="mt-4 text-lg font-medium text-slate-800">Tüm başvurular değerlendirilmiş</h3>
                        <p className="mt-1 text-sm text-slate-500">Onayınızı bekleyen yeni bir başvuru bulunmamaktadır.</p>
                    </div>
                )}
            </div>
            {onayModal && (
                <OnayModal
                    application={onayModal.application}
                    applicantName={peopleMap.get(String(onayModal.application.basvuruSahibiId)) || 'Bilinmeyen Kişi'}
                    isApprove={onayModal.isApprove}
                    onClose={() => setOnayModal(null)}
                    onSubmit={handleOnaySubmit}
                />
            )}
        </>
    );
};


interface OnayModalProps {
    application: YardimBasvurusu;
    applicantName: string;
    isApprove: boolean;
    onClose: () => void;
    onSubmit: (note: string) => void;
}

const OnayModal: React.FC<OnayModalProps> = ({ application, applicantName, isApprove, onClose, onSubmit }) => {
    const [note, setNote] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(note);
    };

    return (
        <Modal 
            isOpen={true} 
            onClose={onClose} 
            title={`Başvuru: ${applicantName} - ${isApprove ? 'Onayla' : 'Reddet'}`}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <p>
                    <strong>{applicantName}</strong> adlı kişinin yardım başvurusunu 
                    <span className={`font-bold ${isApprove ? 'text-green-600' : 'text-red-600'}`}>
                        {isApprove ? ' ONNAYLAMAK ' : ' REDDETMEK '}
                    </span>
                    üzere olduğunuzu onaylayın.
                </p>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Onay/Red Notu (İsteğe Bağlı)</label>
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full p-2 border border-slate-300 rounded-lg shadow-sm"
                        placeholder="Kararınızla ilgili bir not ekleyebilirsiniz..."
                    />
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-white text-slate-700 px-4 py-2 rounded-lg font-semibold border border-slate-300 hover:bg-slate-50">İptal</button>
                    <button type="submit" className={`text-white px-4 py-2 rounded-lg font-semibold ${isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                        {isApprove ? 'Başvuruyu Onayla' : 'Başvuruyu Reddet'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default BaskanOnayi;