

import React, { useState, useEffect } from 'react';
import { Profil as ProfilData } from '../types';
import Modal from './Modal';

interface ProfilProps {
    profile: ProfilData;
    onSave: (updatedProfile: ProfilData) => void;
}

const Profil: React.FC<ProfilProps> = ({ profile, onSave }) => {
    const [formData, setFormData] = useState<ProfilData>(profile);
    const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

    useEffect(() => {
        setFormData(profile);
    }, [profile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    }

    const handleSave = (e: React.FormEvent, part: 'info' | 'password') => {
        e.preventDefault();
        onSave(formData);
        setStatus({ message: part === 'info' ? 'Bilgiler başarıyla güncellendi!' : 'Şifre başarıyla güncellendi!', type: 'success' });
        setTimeout(() => setStatus(null), 3000);
        
        if (part === 'password') {
            const form = e.target as HTMLFormElement;
            form.reset();
        }
    }

    const handlePhotoSave = (newUrl: string) => {
        const updatedProfile = { ...formData, profilFotoUrl: newUrl };
        onSave(updatedProfile);
        setFormData(updatedProfile);
        setIsPhotoModalOpen(false);
    };


    const FormCard: React.FC<{ title: string; children: React.ReactNode; footer?: React.ReactNode }> = ({ title, children, footer }) => (
        <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
                <div className="space-y-4">{children}</div>
            </div>
            {footer && <div className="bg-slate-50 px-6 py-3 rounded-b-lg flex justify-end">{footer}</div>}
        </div>
    );
    
    const FormRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
         <div className="grid grid-cols-3 gap-4 items-center">
            <label className="text-sm font-medium text-slate-600 col-span-1">{label}</label>
            <div className="col-span-2">{children}</div>
        </div>
    );

    return (
        <>
        <div className="max-w-4xl mx-auto space-y-6">
            {status && (
                <div className={`p-4 rounded-md text-sm ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {status.message}
                </div>
            )}
            <form onSubmit={(e) => handleSave(e, 'info')}>
                <FormCard 
                    title="Kişisel Bilgiler" 
                    footer={<button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700">Bilgileri Güncelle</button>}
                >
                    <FormRow label="Ad Soyad">
                        <input type="text" name="adSoyad" value={formData.adSoyad} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </FormRow>
                     <FormRow label="E-posta">
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </FormRow>
                     <FormRow label="Telefon">
                        <input type="tel" name="telefon" value={formData.telefon} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </FormRow>
                     <FormRow label="Rol">
                        <p className="px-3 py-2 text-slate-500">{formData.rol}</p>
                    </FormRow>
                </FormCard>
            </form>
            
            <FormCard 
                title="Profil Fotoğrafı"
                footer={<button type="button" onClick={() => setIsPhotoModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700">Fotoğrafı Değiştir</button>}
            >
                <div className="flex items-center space-x-6">
                    <img src={formData.profilFotoUrl} alt="Profil" className="h-20 w-20 rounded-full" />
                    <p className="text-sm text-slate-500">Profil fotoğrafınızı güncellemek için butona tıklayın.</p>
                </div>
            </FormCard>

            <form onSubmit={(e) => handleSave(e, 'password')}>
                <FormCard 
                    title="Şifre Değiştirme"
                    footer={<button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700">Şifreyi Güncelle</button>}
                >
                    <FormRow label="Mevcut Şifre">
                        <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </FormRow>
                     <FormRow label="Yeni Şifre">
                        <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </FormRow>
                     <FormRow label="Yeni Şifre Tekrar">
                        <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </FormRow>
                </FormCard>
            </form>
        </div>
        {isPhotoModalOpen && <PhotoChangeModal onClose={() => setIsPhotoModalOpen(false)} onSave={handlePhotoSave} />}
        </>
    );
};

const PhotoChangeModal: React.FC<{onClose: () => void; onSave: (url: string) => void}> = ({ onClose, onSave }) => {
    const [url, setUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(url);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Profil Fotoğrafını Değiştir">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Yeni Fotoğraf URL'si</label>
                    <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/image.png" className="mt-1 block w-full p-2 border border-slate-300 rounded-md" required />
                    <p className="text-xs text-slate-500 mt-1">Lütfen yeni profil fotoğrafınızın URL'sini yapıştırın.</p>
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300">İptal</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Kaydet</button>
                 </div>
            </form>
        </Modal>
    );
};

export default Profil;