import React, { useState, useMemo, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import toast from 'react-hot-toast';
import { Etkinlik, EtkinlikStatus, Person } from '../types';
import Modal from './Modal';
import { getEtkinlikler, createEtkinlik, updateEtkinlik, deleteEtkinlik, getPeople } from '../services/apiService';

const CALENDAR_ICON = <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const USERS_ICON = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

const getStatusClass = (status: EtkinlikStatus) => {
    switch (status) {
        case EtkinlikStatus.PLANLAMA: return 'bg-blue-100 text-blue-800';
        case EtkinlikStatus.YAYINDA: return 'bg-green-100 text-green-800 animate-pulse';
        case EtkinlikStatus.TAMAMLANDI: return 'bg-slate-200 text-slate-800';
        case EtkinlikStatus.IPTAL_EDILDI: return 'bg-red-100 text-red-800';
        default: return 'bg-slate-100 text-slate-800';
    }
};

const EtkinlikCard: React.FC<{ etkinlik: Etkinlik, onEdit: (etkinlik: Etkinlik) => void, onDelete: (id: number) => void }> = ({ etkinlik, onEdit, onDelete }) => {
    const formattedDate = new Date(etkinlik.tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
    
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-lg transition-shadow duration-200 group">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-slate-900">{etkinlik.ad}</h3>
                     <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(etkinlik.status)}`}>
                        {etkinlik.status}
                    </span>
                </div>
                <div className="flex items-center text-sm text-slate-500 mb-3 space-x-4">
                    <div className="flex items-center space-x-1.5">
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span>{formattedDate} - {etkinlik.saat}</span>
                    </div>
                     <div className="flex items-center space-x-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span>{etkinlik.konum}</span>
                    </div>
                </div>
                <p className="text-sm text-slate-600 mb-4 h-12 overflow-hidden">{etkinlik.aciklama}</p>
            </div>
            <div className="border-t border-slate-200 mt-4 pt-4 flex justify-between items-center">
                 <div className="flex items-center space-x-1 text-sm text-slate-600">
                    {USERS_ICON}
                    <span>{etkinlik.katilimcilar?.length || 0} Katılımcı</span>
                </div>
                <div className="flex items-center space-x-3">
                    <ReactRouterDOM.Link to={`/etkinlikler/${etkinlik.id}`} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">Detaylar</ReactRouterDOM.Link>
                    <button onClick={() => onEdit(etkinlik)} className="text-sm font-semibold text-yellow-600 hover:text-yellow-800">Düzenle</button>
                    <button onClick={() => onDelete(etkinlik.id)} className="text-sm font-semibold text-red-600 hover:text-red-800">Sil</button>
                </div>
            </div>
        </div>
    );
};

const EtkinlikYonetimi: React.FC = () => {
    const [etkinlikler, setEtkinlikler] = useState<Etkinlik[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [statusFilter, setStatusFilter] = useState<EtkinlikStatus | 'all'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEtkinlik, setEditingEtkinlik] = useState<Partial<Etkinlik> | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const [etkinliklerData, peopleData] = await Promise.all([getEtkinlikler(), getPeople()]);
            setEtkinlikler(etkinliklerData);
            setPeople(peopleData);
        } catch(err: any) {
            setError(err.message || "Veriler yüklenemedi.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const filteredEtkinlikler = useMemo(() => {
        const sorted = [...etkinlikler].sort((a,b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime());
        if (statusFilter === 'all') return sorted;
        return sorted.filter(e => e.status === statusFilter);
    }, [etkinlikler, statusFilter]);
    
    const handleAddNewClick = () => {
        setEditingEtkinlik({});
        setIsModalOpen(true);
    };

    const handleEditClick = (etkinlik: Etkinlik) => {
        setEditingEtkinlik(etkinlik);
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (id: number) => {
        if (window.confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) {
            try {
                await deleteEtkinlik(id);
                setEtkinlikler(etkinlikler.filter(e => e.id !== id));
                toast.success('Etkinlik başarıyla silindi.');
            } catch(err) {
                toast.error('Etkinlik silinirken bir hata oluştu.');
            }
        }
    };

    const handleSaveEtkinlik = async (etkinlikToSave: Partial<Etkinlik>) => {
        const isNew = !etkinlikToSave.id;
        try {
            if (etkinlikToSave.id) { // Editing
                const updated = await updateEtkinlik(etkinlikToSave.id, etkinlikToSave);
                setEtkinlikler(etkinlikler.map(e => e.id === updated.id ? updated : e));
            } else { // Adding
                const payload = { ...etkinlikToSave, katilimcilar: [] };
                const created = await createEtkinlik(payload as Omit<Etkinlik, 'id'>);
                setEtkinlikler([created, ...etkinlikler]);
            }
            setIsModalOpen(false);
            setEditingEtkinlik(null);
            toast.success(isNew ? 'Etkinlik başarıyla oluşturuldu.' : 'Etkinlik başarıyla güncellendi.');
        } catch(err) {
            toast.error('Etkinlik kaydedilirken bir hata oluştu.');
        }
    };
    
    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-slate-800">Filtrele:</h3>
                    <select 
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as EtkinlikStatus | 'all')}
                    >
                        <option value="all">Tüm Etkinlikler</option>
                        {Object.values(EtkinlikStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                 <button onClick={handleAddNewClick} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2">
                    {CALENDAR_ICON}
                    <span>Yeni Etkinlik Ekle</span>
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredEtkinlikler.map(etkinlik => (
                    <EtkinlikCard key={etkinlik.id} etkinlik={etkinlik} onEdit={handleEditClick} onDelete={handleDeleteClick} />
                ))}
            </div>

            {filteredEtkinlikler.length === 0 && (
                 <div className="text-center py-20 bg-white rounded-xl shadow-sm text-slate-500">
                    <p>Filtreye uygun etkinlik bulunamadı.</p>
                </div>
            )}
        </div>
        
        {isModalOpen && editingEtkinlik && (
            <EtkinlikFormModal 
                etkinlik={editingEtkinlik}
                onClose={() => { setIsModalOpen(false); setEditingEtkinlik(null); }}
                onSave={handleSaveEtkinlik}
                people={people}
            />
        )}
        </>
    );
};

const EtkinlikFormModal: React.FC<{ etkinlik: Partial<Etkinlik>, people: Person[], onClose: () => void, onSave: (etkinlik: Partial<Etkinlik>) => void }> = ({ etkinlik, people, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Etkinlik>>(etkinlik);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Etkinlik);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={etkinlik.id ? 'Etkinliği Düzenle' : 'Yeni Etkinlik Ekle'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700">Etkinlik Adı</label>
                        <input type="text" name="ad" value={formData.ad || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Tarih</label>
                        <input type="date" name="tarih" value={formData.tarih || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-lg" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Saat</label>
                        <input type="time" name="saat" value={formData.saat || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-lg" required />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700">Konum</label>
                        <input type="text" name="konum" value={formData.konum || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Sorumlu Kişi</label>
                        <select name="sorumluId" value={formData.sorumluId || ''} onChange={(e) => setFormData(p => ({...p, sorumluId: Number(e.target.value)}))} className="mt-1 block w-full p-2 border border-slate-300 rounded-lg bg-white" required>
                             <option value="" disabled>Seçiniz...</option>
                             {people.map(p => <option key={p.id} value={p.id}>{p.ad} {p.soyad}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Durum</label>
                         <select name="status" value={formData.status || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-lg bg-white" required>
                             <option value="" disabled>Seçiniz...</option>
                             {Object.values(EtkinlikStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700">Açıklama</label>
                        <textarea name="aciklama" value={formData.aciklama || ''} onChange={handleChange} rows={4} className="mt-1 block w-full p-2 border border-slate-300 rounded-lg" required />
                    </div>
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-white text-slate-700 px-4 py-2 rounded-lg font-semibold border border-slate-300 hover:bg-slate-50">İptal</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Kaydet</button>
                 </div>
            </form>
        </Modal>
    )
}

export default EtkinlikYonetimi;