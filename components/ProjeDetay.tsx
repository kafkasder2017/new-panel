import React, { useState, useMemo, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import toast from 'react-hot-toast';
import { Proje, Gorev, GorevStatus, GorevOncelik, Person } from '../types';
import Modal from './Modal';
import { getProjeById, getPeople, updateProje } from '../services/apiService';


const StatCard: React.FC<{ label: string, value: React.ReactNode, icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-4">
        <div className="p-3 bg-blue-100 rounded-full text-blue-600">{icon}</div>
        <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-lg font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const getGorevStatusClass = (status: GorevStatus) => {
    switch(status) {
        case GorevStatus.YAPILACAK: return 'bg-slate-200 text-slate-800';
        case GorevStatus.YAPILIYOR: return 'bg-yellow-100 text-yellow-800';
        case GorevStatus.TAMAMLANDI: return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

const getGorevOncelikClass = (oncelik: GorevOncelik) => {
    switch(oncelik) {
        case GorevOncelik.YUKSEK: return 'text-red-500';
        case GorevOncelik.NORMAL: return 'text-yellow-500';
        case GorevOncelik.DUSUK: return 'text-green-500';
        default: return 'text-slate-400';
    }
};

const ProjeDetay: React.FC = () => {
    const { projeId } = ReactRouterDOM.useParams<{ projeId: string }>();
    
    const [project, setProject] = useState<Proje | null>(null);
    const [people, setPeople] = useState<Person[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProjectDetails = async () => {
        if (!projeId) return;
        setIsLoading(true);
        setError('');
        try {
            const [projectData, peopleData] = await Promise.all([
                getProjeById(parseInt(projeId, 10)),
                getPeople()
            ]);
            setProject(projectData);
            setPeople(peopleData);
        } catch (err: any) {
            setError(err.message || 'Proje detayları yüklenemedi.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjectDetails();
    }, [projeId]);
    
    const onUpdateProject = async (projectToUpdate: Proje) => {
        try {
            const updated = await updateProje(projectToUpdate.id, projectToUpdate);
            setProject(updated);
        } catch (err) {
            toast.error('Proje güncellenirken bir hata oluştu.');
        }
    };

    const [statusFilter, setStatusFilter] = useState<GorevStatus | 'all'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGorev, setEditingGorev] = useState<Partial<Gorev> | null>(null);

    const filteredGorevler = useMemo(() => {
        if (!project?.gorevler) return [];
        if (statusFilter === 'all') return project.gorevler;
        return project.gorevler.filter(g => g.durum === statusFilter);
    }, [project, statusFilter]);

    const handleSaveGorev = (gorevToSave: Gorev) => {
        if (!project) return;
        let updatedGorevler: Gorev[];
        if (gorevToSave.id) { // Editing
            updatedGorevler = (project.gorevler || []).map(g => g.id === gorevToSave.id ? gorevToSave : g);
        } else { // Adding
            const newGorev = { ...gorevToSave, id: Date.now() };
            updatedGorevler = [...(project.gorevler || []), newGorev];
        }
        onUpdateProject({ ...project, gorevler: updatedGorevler });
        setIsModalOpen(false);
        setEditingGorev(null);
    };
    
    const handleDeleteGorev = (id: number) => {
        if (!project) return;
        if (window.confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
            const updatedGorevler = (project.gorevler || []).filter(g => g.id !== id);
            onUpdateProject({ ...project, gorevler: updatedGorevler });
        }
    };

    const handleGorevStatusChange = (id: number, newStatus: GorevStatus) => {
        if (!project) return;
        const updatedGorevler = (project.gorevler || []).map(g => g.id === id ? { ...g, durum: newStatus } : g);
        onUpdateProject({ ...project, gorevler: updatedGorevler });
    }
    
    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    if (!project) {
        return <div className="text-center py-20 text-slate-500">Proje bulunamadı.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-2xl font-bold text-slate-800">{project.name}</h2>
                <p className="text-slate-600 mt-1">{project.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard label="Proje Yöneticisi" value={project.manager} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"></circle><path d="M12 14s-7 4-7 7h14c0-3-7-7-7-7z"></path></svg>}/>
                 <StatCard label="Proje Takvimi" value={`${new Date(project.startDate).toLocaleDateString('tr-TR')} - ${new Date(project.endDate).toLocaleDateString('tr-TR')}`} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>}/>
                 <StatCard label="Bütçe Durumu" value={`${project.spent.toLocaleString()} / ${project.budget.toLocaleString()} TL`} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}/>
                 <StatCard label="İlerleme" value={`${project.progress}%`} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2.4-3-4-5.4-4.4"></path><path d="M4.8 9A7.3 7.3 0 0 0 2 15c.7 1.2 1 2.5.7 3.9.6 2.4 3 4 5.4 4.4"></path><path d="M12 21a7.3 7.3 0 0 1-5.2-12.2"></path><path d="M12 3a7.3 7.3 0 0 0 5.2 12.2"></path><circle cx="12" cy="12" r="3"></circle></svg>}/>
            </div>
            
             <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 mb-6">
                    <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-semibold">Görevler</h3>
                         <select 
                            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as GorevStatus | 'all')}
                         >
                            <option value="all">Tüm Durumlar</option>
                            {Object.values(GorevStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                     <button onClick={() => { setEditingGorev({}); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm">
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        <span>Yeni Görev Ekle</span>
                    </button>
                </div>

                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Görev Başlığı</th>
                                <th scope="col" className="px-6 py-3">Sorumlu</th>
                                <th scope="col" className="px-6 py-3">Son Tarih</th>
                                <th scope="col" className="px-6 py-3">Öncelik</th>
                                <th scope="col" className="px-6 py-3">Durum</th>
                                <th scope="col" className="px-6 py-3 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGorevler.map((gorev) => {
                                const sorumlu = people.find(p => p.id === String(gorev.sorumluId));
                                return (
                                <tr key={gorev.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{gorev.baslik}</td>
                                    <td className="px-6 py-4">{sorumlu ? `${sorumlu.first_name} ${sorumlu.last_name}` : 'Atanmamış'}</td>
                                    <td className="px-6 py-4">{new Date(gorev.sonTarih).toLocaleDateString('tr-TR')}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <span className={`w-3 h-3 rounded-full mr-2 ${getGorevOncelikClass(gorev.oncelik)}`}></span>
                                            {gorev.oncelik}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select 
                                            value={gorev.durum} 
                                            onChange={(e) => handleGorevStatusChange(gorev.id, e.target.value as GorevStatus)}
                                            className={`px-2 py-1 text-xs font-medium rounded-full border-none appearance-none ${getGorevStatusClass(gorev.durum)}`}
                                        >
                                            {Object.values(GorevStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-3">
                                            <button onClick={() => { setEditingGorev(gorev); setIsModalOpen(true); }} className="text-yellow-600 hover:text-yellow-800 font-medium">Düzenle</button>
                                            <button onClick={() => handleDeleteGorev(gorev.id)} className="text-red-600 hover:text-red-800 font-medium">Sil</button>
                                        </div>
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                 </div>
                 {filteredGorevler.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                        <p>Gösterilecek görev bulunamadı.</p>
                    </div>
                 )}
            </div>
            
            {isModalOpen && editingGorev && (
                <GorevFormModal
                    gorev={editingGorev}
                    onClose={() => { setIsModalOpen(false); setEditingGorev(null); }}
                    onSave={handleSaveGorev}
                    people={people}
                />
            )}
        </div>
    );
};


const GorevFormModal: React.FC<{ gorev: Partial<Gorev>; people: Person[]; onClose: () => void; onSave: (gorev: Gorev) => void; }> = ({ gorev, people, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Gorev>>(gorev);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'sorumluId') {
            setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Gorev);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={gorev.id ? "Görevi Düzenle" : "Yeni Görev Ekle"}>
             <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700">Görev Başlığı</label>
                        <input type="text" name="baslik" value={formData.baslik || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Sorumlu Kişi</label>
                        <select 
                            name="sorumluId" 
                            value={formData.sorumluId || ''} 
                            onChange={handleChange} 
                            className="mt-1 block w-full p-2 border border-slate-300 rounded-md bg-white" 
                            required
                        >
                            <option value="" disabled>Bir kişi seçin...</option>
                            {people.map(person => (
                                <option key={person.id} value={person.id}>{person.first_name} {person.last_name}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Son Tarih</label>
                        <input type="date" name="sonTarih" value={formData.sonTarih || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Öncelik</label>
                        <select name="oncelik" value={formData.oncelik || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md bg-white" required>
                             <option value="" disabled>Seçiniz...</option>
                             {Object.values(GorevOncelik).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Durum</label>
                        <select name="durum" value={formData.durum || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md bg-white" required>
                             <option value="" disabled>Seçiniz...</option>
                             {Object.values(GorevStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700">Açıklama</label>
                        <textarea name="aciklama" value={formData.aciklama || ''} onChange={handleChange} rows={3} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" required />
                    </div>
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300">İptal</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Kaydet</button>
                 </div>
            </form>
        </Modal>
    );
};

export default ProjeDetay;