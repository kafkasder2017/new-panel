import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Bildirim, BildirimTuru, BildirimDurumu, KullaniciRol } from '../types.ts';
import { ICONS } from '../constants.tsx';
import Modal from './Modal.tsx';
import { getBildirimler, createBildirim, updateBildirim, deleteBildirim, markAllAsRead as apiMarkAllAsRead } from '../services/apiService.ts';


interface SendNotificationForm {
    target: 'all' | 'role' | 'user';
    role: KullaniciRol | '';
    userId: string;
    title: string;
    content: string;
}

const Bildirimler: React.FC = () => {
    const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [typeFilter, setTypeFilter] = useState<string | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'unread'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchNotifications = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await getBildirimler();
            setBildirimler(data);
        } catch (err: any) {
            setError(err.message || 'Bildirimler yüklenemedi.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const filteredBildirimler = useMemo(() => {
        return bildirimler.filter(b => 
            (typeFilter === 'all' || b.type === typeFilter) &&
            (statusFilter === 'all' || (statusFilter === 'read' ? b.is_read : statusFilter === 'unread' ? !b.is_read : true))
        ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [bildirimler, typeFilter, statusFilter]);
    
    const handleToggleRead = async (id: string, currentIsRead: boolean) => {
        try {
            const updated = await updateBildirim(id, { is_read: !currentIsRead });
            setBildirimler(bildirimler.map(b => b.id === id ? updated : b));
        } catch (err) {
            toast.error('Bildirim durumu güncellenemedi.');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteBildirim(id);
            setBildirimler(bildirimler.filter(b => b.id !== id));
            toast.success('Bildirim silindi.');
        } catch(err) {
            toast.error('Bildirim silinemedi.');
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiMarkAllAsRead();
            setBildirimler(bildirimler.map(b => ({...b, is_read: true})));
            toast.success('Tüm bildirimler okundu olarak işaretlendi.');
        } catch (err) {
            toast.error('Tüm bildirimler okundu olarak işaretlenemedi.');
        }
    };
    
    const handleSendNotification = async (formData: SendNotificationForm) => {
        try {
            const newNotification: Omit<Bildirim, 'id'> = {
                type: 'INFO', // Using database enum values
                title: formData.title,
                message: formData.content,
                created_at: new Date().toISOString(),
                is_read: false,
                user_id: null, // Will be set by backend for specific users
                action_url: null
            };
            const created = await createBildirim(newNotification);
            setBildirimler([created, ...bildirimler]);
            setIsModalOpen(false);
            toast.success('Bildirim başarıyla gönderildi.');
        } catch(err) {
            toast.error('Bildirim gönderilemedi.');
        }
    };

    const getIconForType = (type: string) => {
        switch(type) {
            case 'SYSTEM': return <div className="p-3 bg-red-100 text-red-600 rounded-full">{ICONS.SETTINGS}</div>;
            case 'INFO': return <div className="p-3 bg-blue-100 text-blue-600 rounded-full">{ICONS.BELL}</div>;
            case 'WARNING': return <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">{ICONS.BELL}</div>;
            case 'ERROR': return <div className="p-3 bg-red-100 text-red-600 rounded-full">{ICONS.BELL}</div>;
            case 'SUCCESS': return <div className="p-3 bg-green-100 text-green-600 rounded-full">{ICONS.BELL}</div>;
            case 'REMINDER': return <div className="p-3 bg-purple-100 text-purple-600 rounded-full">{ICONS.PEOPLE}</div>;
            default: return <div className="p-3 bg-gray-100 text-gray-600 rounded-full">{ICONS.BELL}</div>;
        }
    }
    
    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-sm">
                 <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 mb-6">
                    <div className="flex items-center space-x-4">
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="px-4 py-2 border border-slate-300 rounded-lg bg-white">
                            <option value="all">Tüm Türler</option>
                            <option value="SYSTEM">Sistem</option>
                            <option value="INFO">Bilgi</option>
                            <option value="WARNING">Uyarı</option>
                            <option value="ERROR">Hata</option>
                            <option value="SUCCESS">Başarılı</option>
                            <option value="REMINDER">Hatırlatma</option>
                        </select>
                         <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="px-4 py-2 border border-slate-300 rounded-lg bg-white">
                              <option value="all">Tüm Durumlar</option>
                              <option value="unread">Okunmamış</option>
                              <option value="read">Okunmuş</option>
                          </select>
                    </div>
                     <div className="flex items-center space-x-4">
                         <button onClick={markAllAsRead} className="text-sm font-semibold text-blue-600 hover:text-blue-800">Tümünü Okundu İşaretle</button>
                         <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Yeni Bildirim Gönder</button>
                     </div>
                </div>
                
                <ul className="space-y-3">
                    {filteredBildirimler.map(b => (
                        <li key={b.id} className={`p-4 rounded-lg flex items-start gap-4 transition-colors ${!b.is_read ? 'bg-blue-50' : 'bg-slate-50'}`}>
                            {getIconForType(b.type)}
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-slate-800">{b.title}</h4>
                                    <span className="text-xs text-slate-500">{new Date(b.created_at).toLocaleString('tr-TR')}</span>
                                </div>
                                <p className="text-sm text-slate-600">{b.message}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                 <button onClick={() => handleToggleRead(b.id, b.is_read)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full" title={b.is_read ? "Okunmadı olarak işaretle" : "Okundu olarak işaretle"}>
                                     {b.is_read ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>}
                                 </button>
                                <button onClick={() => handleDelete(b.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Sil">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
                 {filteredBildirimler.length === 0 && <div className="text-center py-10 text-slate-500">Gösterilecek bildirim yok.</div>}
            </div>
            {isModalOpen && <SendNotificationModal onClose={() => setIsModalOpen(false)} onSend={handleSendNotification} />}
        </>
    )
};

const SendNotificationModal: React.FC<{onClose: () => void; onSend: (data: SendNotificationForm) => void;}> = ({ onClose, onSend }) => {
    const [formData, setFormData] = useState<SendNotificationForm>({
        target: 'all',
        role: '',
        userId: '',
        title: '',
        content: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            toast.error('Başlık ve içerik alanları zorunludur.');
            return;
        }
        onSend(formData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Yeni Bildirim Gönder">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Hedef Kitle</label>
                    <select name="target" value={formData.target} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md bg-white">
                        <option value="all">Tüm Kullanıcılar</option>
                        <option value="role">Belirli Bir Rol</option>
                        <option value="user" disabled>Belirli Bir Kullanıcı (Yakında)</option>
                    </select>
                </div>
                {formData.target === 'role' && (
                    <div>
                         <label className="block text-sm font-medium text-slate-700">Rol Seçin</label>
                         <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md bg-white">
                             <option value="" disabled>Rol seçin...</option>
                             {Object.values(KullaniciRol).map(r => <option key={r} value={r}>{r}</option>)}
                         </select>
                    </div>
                )}
                <div>
                     <label className="block text-sm font-medium text-slate-700">Başlık</label>
                     <input type="text" name="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" required />
                </div>
                 <div>
                     <label className="block text-sm font-medium text-slate-700">İçerik</label>
                     <textarea name="content" value={formData.content} onChange={handleChange} rows={5} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" required />
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300">İptal</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Gönder</button>
                 </div>
            </form>
        </Modal>
    );
}

export default Bildirimler;