
import React, { useState, useEffect } from 'react';
import { SistemAyarlari } from '../types';
import { getSistemAyarlari, updateSistemAyarlari } from '../services/apiService';

const Ayarlar: React.FC = () => {
    const [ayarlar, setAyarlar] = useState<SistemAyarlari | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            setError('');
            try {
                const data = await getSistemAyarlari();
                setAyarlar(data);
            } catch (err: any) {
                setError(err.message || "Ayarlar yüklenemedi.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (!ayarlar) return;
        const { name, value } = e.target;
        setAyarlar(prev => ({ ...prev!, [name]: name === 'smtpPort' ? parseInt(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ayarlar) return;
        
        setStatus({ message: 'Kaydediliyor...', type: 'success' });
        try {
            await updateSistemAyarlari(ayarlar);
            setStatus({ message: 'Ayarlar başarıyla kaydedildi!', type: 'success' });
        } catch(err: any) {
            setStatus({ message: err.message || 'Ayarlar kaydedilirken bir hata oluştu.', type: 'error' });
        } finally {
             setTimeout(() => setStatus(null), 3000);
        }
    };

    const FormCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-4">{title}</h3>
            <div className="space-y-4">{children}</div>
        </div>
    );
    
    const FormRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            {children}
        </div>
    );
    
    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    if (!ayarlar) return <div className="text-center py-10">Ayarlar yüklenemedi.</div>;


    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <FormCard title="Dernek Bilgileri">
                <FormRow label="Dernek Adı">
                    <input type="text" name="dernekAdi" value={ayarlar.dernekAdi} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                </FormRow>
                <FormRow label="Dernek Adresi">
                    <textarea name="dernekAdresi" value={ayarlar.dernekAdresi} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg"></textarea>
                </FormRow>
                 <FormRow label="Logo URL">
                     <div className="flex items-center space-x-4">
                         <img src={ayarlar.logoUrl} alt="Dernek Logosu" className="h-12 w-12 bg-slate-100 p-1 rounded-md object-contain"/>
                        <input type="text" name="logoUrl" value={ayarlar.logoUrl} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                     </div>
                </FormRow>
            </FormCard>

            <FormCard title="E-posta (SMTP) Ayarları">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormRow label="SMTP Host">
                        <input type="text" name="smtpHost" value={ayarlar.smtpHost} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </FormRow>
                    <FormRow label="SMTP Port">
                        <input type="number" name="smtpPort" value={ayarlar.smtpPort} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </FormRow>
                    <FormRow label="SMTP Kullanıcı Adı">
                        <input type="text" name="smtpUser" value={ayarlar.smtpUser} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </FormRow>
                </div>
            </FormCard>

            <FormCard title="Lokalizasyon Ayarları">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormRow label="Varsayılan Para Birimi">
                        <select name="varsayilanParaBirimi" value={ayarlar.varsayilanParaBirimi} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                            <option value="TRY">Türk Lirası (TRY)</option>
                            <option value="USD">Amerikan Doları (USD)</option>
                            <option value="EUR">Euro (EUR)</option>
                        </select>
                    </FormRow>
                    <FormRow label="Tarih Formatı">
                        <select name="tarihFormati" value={ayarlar.tarihFormati} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                            <option value="DD/MM/YYYY">GG/AA/YYYY</option>
                            <option value="MM/DD/YYYY">AA/GG/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-AA-GG</option>
                        </select>
                    </FormRow>
                 </div>
            </FormCard>
            
            <div className="flex justify-end items-center space-x-4 pt-4">
                {status && (
                    <div className={`text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {status.message}
                    </div>
                )}
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Ayarları Kaydet
                </button>
            </div>
        </form>
    );
};

export default Ayarlar;