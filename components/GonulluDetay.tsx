import React, { useState, useMemo, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import toast from 'react-hot-toast';
import { Gonullu, Person, EtkinlikKatilimi, Proje, Beceri, Gorev } from '../types';
import Modal from './Modal';
import { getGonulluById, getPersonById, getProjeler, updateGonullu } from '../services/apiService';


const StatCard: React.FC<{ label: string, value: React.ReactNode, icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-4">
        <div className="p-3 bg-blue-100 rounded-full text-blue-600">{icon}</div>
        <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-lg font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const GonulluDetay: React.FC = () => {
    const { gonulluId } = ReactRouterDOM.useParams<{ gonulluId: string }>();

    const [gonullu, setGonullu] = useState<Gonullu | null>(null);
    const [person, setPerson] = useState<Person | null>(null);
    const [projects, setProjects] = useState<Proje[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    useEffect(() => {
        const fetchData = async () => {
            if (!gonulluId) {
                setError("Gönüllü ID bulunamadı.");
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);
            setError('');

            try {
                // Step 1: Fetch the main record
                const gonulluData = await getGonulluById(parseInt(gonulluId, 10));
                if (!gonulluData) {
                    throw new Error(`Gönüllü kaydı (ID: ${gonulluId}) bulunamadı.`);
                }
                if (!gonulluData.personId) {
                    throw new Error(`Gönüllü kaydı (ID: ${gonulluData.id}) ilişkili bir kişi ID'sine sahip değil.`);
                }

                // Step 2: Fetch dependent and parallel data
                const [personData, projectsData] = await Promise.all([
                    getPersonById(gonulluData.personId),
                    getProjeler(),
                ]);

                // Step 3: Validate dependent data
                if (!personData) {
                    throw new Error(`Gönüllüye bağlı kişi kaydı (ID: ${gonulluData.personId}) bulunamadı.`);
                }
                
                // Step 4: Perform a single, atomic state update after all data is confirmed valid.
                setGonullu(gonulluData);
                setPerson(personData);
                setProjects(projectsData);

            } catch (err: any) {
                setError(err.message || 'Veri yüklenemedi.');
                setGonullu(null);
                setPerson(null);
                setProjects([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [gonulluId]);

    const assignedTasks = useMemo(() => {
        if (!gonullu) return [];
        return projects.flatMap(p => 
            (p.gorevler || []).map(g => ({...g, projectName: p.name}))
        ).filter(g => g.sorumluId === gonullu.personId);
    }, [gonullu, projects]);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const onUpdateGonullu = async (updatedGonullu: Gonullu) => {
        try {
            const saved = await updateGonullu(updatedGonullu.id, updatedGonullu);
            setGonullu(saved);
        } catch (err) {
            toast.error('Gönüllü güncellenirken bir hata oluştu.');
        }
    };

    const handleSaveActivity = (activity: Omit<EtkinlikKatilimi, 'id'>) => {
        if (!gonullu) return;
        const newActivity: EtkinlikKatilimi = { ...activity, id: Date.now() };
        const updatedGonullu: Gonullu = {
            ...gonullu,
            etkinlikGecmisi: [newActivity, ...(gonullu.etkinlikGecmisi || [])]
        };
        onUpdateGonullu(updatedGonullu);
        setIsModalOpen(false);
    };
    
    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    if (!gonullu || !person) {
        return (
             <div className="text-center py-20 text-slate-500">
                <h2 className="text-2xl font-bold">Gönüllü Bulunamadı</h2>
                <ReactRouterDOM.Link to="/gonulluler" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                    Gönüllü Listesine Geri Dön
                </ReactRouterDOM.Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm flex items-center space-x-6">
                 <img src={person.fotograflar?.[0]?.url || `https://i.pravatar.cc/100?u=${person.id}`} alt={person.ad} className="h-20 w-20 rounded-full object-cover" />
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{person.ad} {person.soyad}</h2>
                    <p className="text-slate-500 mt-1">Gönüllü (Başlangıç: {new Date(gonullu.baslangicTarihi).toLocaleDateString('tr-TR')})</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Durum" value={gonullu.durum} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>}/>
                <StatCard label="Müsaitlik" value={gonullu.musaitlik} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>}/>
                <StatCard label="Toplam Katkı" value={`${gonullu.toplamSaat || 0} saat`} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>}/>
                <StatCard label="Katıldığı Etkinlik" value={`${gonullu.etkinlikGecmisi?.length || 0} adet`} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg>}/>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Temel Beceriler</h3>
                        <div className="flex flex-wrap gap-2">
                             {gonullu.beceriler.map(b => <span key={b} className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">{b}</span>)}
                        </div>
                    </div>
                     <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">İletişim Bilgileri</h3>
                        <div className="space-y-2 text-sm">
                            <p className="text-slate-600"><strong>Telefon:</strong> {person.cepTelefonu}</p>
                            <p className="text-slate-600"><strong>E-posta:</strong> {person.email || 'Belirtilmemiş'}</p>
                            <p className="text-slate-600"><strong>Adres:</strong> {person.adres}, {person.yerlesim}, {person.sehir}</p>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-6">
                     <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-slate-800">Etkinlik Geçmişi</h3>
                            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-blue-700">Yeni Etkinlik Ekle</button>
                        </div>
                        <ActivityHistory history={gonullu.etkinlikGecmisi || []} />
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Atanmış Görevler</h3>
                        <AssignedTasks tasks={assignedTasks} />
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <ActivityFormModal
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveActivity}
                />
            )}
        </div>
    );
};

const ActivityHistory: React.FC<{ history: EtkinlikKatilimi[] }> = ({ history }) => {
    if (!history.length) return <p className="text-sm text-slate-500 text-center py-4">Etkinlik geçmişi bulunmamaktadır.</p>;
    return (
        <ul className="space-y-3">
            {history.map(item => (
                <li key={item.id} className="p-3 bg-slate-50 rounded-md flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-slate-800">{item.etkinlikAdi}</p>
                        <p className="text-xs text-slate-500">Rol: {item.rol}</p>
                    </div>
                    <p className="text-sm text-slate-600">{new Date(item.tarih).toLocaleDateString('tr-TR')}</p>
                </li>
            ))}
        </ul>
    );
};

const AssignedTasks: React.FC<{ tasks: (Gorev & {projectName: string})[] }> = ({ tasks }) => {
    if (!tasks.length) return <p className="text-sm text-slate-500 text-center py-4">Atanmış aktif bir görev bulunmamaktadır.</p>;
    return (
        <ul className="space-y-3">
            {tasks.map(task => (
                <li key={task.id} className="p-3 bg-slate-50 rounded-md">
                    <div className="flex justify-between items-start">
                         <div>
                            <p className="font-semibold text-slate-800">{task.baslik}</p>
                            <p className="text-xs text-purple-600 font-semibold bg-purple-100 px-1.5 py-0.5 rounded-full inline-block mt-1">{task.projectName}</p>
                         </div>
                         <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${task.durum === 'Tamamlandı' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{task.durum}</span>
                    </div>
                </li>
            ))}
        </ul>
    );
};

const ActivityFormModal: React.FC<{ onClose: () => void, onSave: (activity: Omit<EtkinlikKatilimi, 'id'>) => void }> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({ etkinlikAdi: '', rol: '', tarih: new Date().toISOString().split('T')[0] });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };
    return (
        <Modal isOpen={true} onClose={onClose} title="Yeni Etkinlik Katılımı Ekle">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700">Etkinlik Adı</label>
                        <input type="text" name="etkinlikAdi" value={formData.etkinlikAdi} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Üstlendiği Rol</label>
                        <input type="text" name="rol" value={formData.rol} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Tarih</label>
                        <input type="date" name="tarih" value={formData.tarih} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" required />
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

export default GonulluDetay;