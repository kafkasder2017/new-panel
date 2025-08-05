import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ApiKey, Webhook, WebhookEvent } from '../types';
import Modal from './Modal';
import { getApiKeys, createApiKey, updateApiKey, deleteApiKey, getWebhooks, createWebhook, updateWebhook, deleteWebhook } from '../services/apiService';

const ApiEntegrasyonu: React.FC = () => {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [modal, setModal] = useState<'newApiKey' | 'showApiKey' | 'webhook' | null>(null);
    const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
    const [editingWebhook, setEditingWebhook] = useState<Partial<Webhook> | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const [keysData, webhooksData] = await Promise.all([getApiKeys(), getWebhooks()]);
            setApiKeys(keysData);
            setWebhooks(webhooksData);
        } catch (err: any) {
            setError(err.message || "Entegrasyon verileri yüklenemedi.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveApiKey = async (name: string) => {
        try {
            const { newKey, fullKey } = await createApiKey({ name });
            setApiKeys(prev => [newKey, ...prev]);
            setNewlyGeneratedKey(fullKey);
            setModal('showApiKey');
            toast.success('API anahtarı başarıyla oluşturuldu.');
        } catch (err: any) {
            toast.error("API anahtarı oluşturulurken bir hata oluştu: " + err.message);
        }
    };

    const handleRevokeKey = async (id: number) => {
        if(window.confirm('Bu API anahtarını iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            try {
                const updatedKey = await updateApiKey(id, { status: 'Revoked' });
                setApiKeys(apiKeys.map(key => key.id === id ? updatedKey : key));
                toast.success('API anahtarı iptal edildi.');
            } catch (err: any) {
                toast.error("API anahtarı iptal edilirken bir hata oluştu: " + err.message);
            }
        }
    };

    const handleSaveWebhook = async (webhookToSave: Partial<Webhook>) => {
        const isNew = !webhookToSave.id;
        try {
            if (webhookToSave.id) {
                const updated = await updateWebhook(webhookToSave.id, webhookToSave);
                setWebhooks(webhooks.map(wh => wh.id === updated.id ? updated : wh));
            } else {
                const created = await createWebhook(webhookToSave as Omit<Webhook, 'id'>);
                setWebhooks([created, ...webhooks]);
            }
            setModal(null);
            setEditingWebhook(null);
            toast.success(isNew ? 'Webhook başarıyla oluşturuldu.' : 'Webhook başarıyla güncellendi.');
        } catch (err: any) {
            toast.error("Webhook kaydedilirken bir hata oluştu: " + err.message);
        }
    };

    const handleDeleteWebhook = async (id: number) => {
        if (window.confirm('Bu webhooku silmek istediğinizden emin misiniz?')) {
            try {
                await deleteWebhook(id);
                setWebhooks(webhooks.filter(wh => wh.id !== id));
                toast.success('Webhook başarıyla silindi.');
            } catch (err: any) {
                toast.error("Webhook silinirken bir hata oluştu: " + err.message);
            }
        }
    };
    
    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;


    return (
        <>
            <div className="space-y-8">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center border-b pb-4 mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">API Anahtarları</h3>
                        <button onClick={() => setModal('newApiKey')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 text-sm">Yeni Anahtar Oluştur</button>
                    </div>
                    <ul className="space-y-3">
                        {apiKeys.map(key => (
                            <li key={key.id} className="p-3 bg-slate-50 rounded-md flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-800">{key.name}</p>
                                    <p className="text-sm text-slate-500 font-mono">{key.key}</p>
                                    <p className="text-xs text-slate-400">Oluşturulma: {new Date(key.createdDate).toLocaleDateString('tr-TR')}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${key.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{key.status}</span>
                                    <button onClick={() => handleRevokeKey(key.id)} className="text-sm font-medium text-red-600 hover:text-red-800" disabled={key.status === 'Revoked'}>{key.status === 'Active' ? 'İptal Et' : 'İptal Edildi'}</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                     <div className="flex justify-between items-center border-b pb-4 mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Webhook'lar</h3>
                        <button onClick={() => { setEditingWebhook({}); setModal('webhook'); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 text-sm">Yeni Webhook Oluştur</button>
                    </div>
                     <ul className="space-y-3">
                        {webhooks.map(wh => (
                            <li key={wh.id} className="p-3 bg-slate-50 rounded-md flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-800 truncate max-w-md">{wh.url}</p>
                                    <p className="text-sm text-slate-500">Tetikleyici Olay: <span className="font-semibold">{wh.event}</span></p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${wh.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-800'}`}>{wh.status}</span>
                                    <button onClick={() => { setEditingWebhook(wh); setModal('webhook'); }} className="text-sm font-medium text-slate-600 hover:text-slate-900">Düzenle</button>
                                    <button onClick={() => handleDeleteWebhook(wh.id)} className="text-sm font-medium text-red-600 hover:text-red-800">Sil</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {modal === 'newApiKey' && <ApiKeyFormModal onClose={() => setModal(null)} onSave={handleSaveApiKey} />}
            
            {modal === 'showApiKey' && newlyGeneratedKey && (
                <ShowKeyModal 
                    apiKey={newlyGeneratedKey} 
                    onClose={() => { setModal(null); setNewlyGeneratedKey(null); }} 
                />
            )}

            {modal === 'webhook' && editingWebhook && (
                <WebhookFormModal
                    webhook={editingWebhook}
                    onClose={() => { setModal(null); setEditingWebhook(null); }}
                    onSave={handleSaveWebhook}
                />
            )}
        </>
    );
};

// --- MODAL COMPONENTS ---

const ApiKeyFormModal: React.FC<{onClose: () => void, onSave: (name: string) => void}> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(name);
    }
    return (
        <Modal isOpen={true} onClose={onClose} title="Yeni API Anahtarı Oluştur">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Anahtar Adı</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="örn. Mobil Uygulama" className="mt-1 block w-full p-2 border border-slate-300 rounded-md" required />
                    <p className="text-xs text-slate-500 mt-1">Bu anahtarı ne için kullanacağınızı belirten bir ad girin.</p>
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300">İptal</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Oluştur</button>
                 </div>
            </form>
        </Modal>
    )
}

const ShowKeyModal: React.FC<{apiKey: string, onClose: () => void}> = ({ apiKey, onClose }) => {
    const [copied, setCopied] = useState(false);
    const copyToClipboard = () => {
        navigator.clipboard.writeText(apiKey);
        setCopied(true);
        toast.success('API anahtarı panoya kopyalandı!');
        setTimeout(() => setCopied(false), 2000);
    }
    return (
        <Modal isOpen={true} onClose={onClose} title="API Anahtarınız Oluşturuldu">
            <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                    Lütfen bu anahtarı güvenli bir yere kaydedin. Bu pencereyi kapattıktan sonra anahtarın tamamını bir daha göremezsiniz.
                </div>
                <div className="p-3 bg-slate-100 rounded-md font-mono text-slate-700 flex justify-between items-center">
                    <span>{apiKey}</span>
                    <button onClick={copyToClipboard} className="bg-slate-200 px-3 py-1 rounded-md text-sm font-sans font-semibold hover:bg-slate-300">
                        {copied ? 'Kopyalandı!' : 'Kopyala'}
                    </button>
                </div>
                 <div className="pt-4 flex justify-end">
                    <button type="button" onClick={onClose} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Anladım, Kapat</button>
                 </div>
            </div>
        </Modal>
    )
}

const WebhookFormModal: React.FC<{webhook: Partial<Webhook>, onClose: () => void, onSave: (webhook: Partial<Webhook>) => void}> = ({ webhook, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Webhook>>(webhook);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Webhook);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={webhook.id ? 'Webhook\'u Düzenle' : 'Yeni Webhook Oluştur'}>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Hedef URL</label>
                    <input type="url" name="url" value={formData.url || ''} onChange={handleChange} placeholder="https://example.com/webhook" className="mt-1 block w-full p-2 border border-slate-300 rounded-md" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Tetikleyici Olay</label>
                    <select name="event" value={formData.event || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md bg-white" required>
                         <option value="" disabled>Seçiniz...</option>
                         {Object.values(WebhookEvent).map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Durum</label>
                    <select name="status" value={formData.status || 'Active'} onChange={handleChange} className="mt-1 block w-full p-2 border border-slate-300 rounded-md bg-white" required>
                         <option value="Active">Aktif</option>
                         <option value="Inactive">Pasif</option>
                    </select>
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300">İptal</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Kaydet</button>
                 </div>
            </form>
        </Modal>
    )
};


export default ApiEntegrasyonu;