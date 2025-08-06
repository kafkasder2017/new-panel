import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Person, Uyruk, KimlikTuru, SponsorlukTipi, DosyaBaglantisi, RizaBeyaniStatus, MedeniDurum, EgitimDurumu, IsDurumu, YasadigiYer, GelirKaynagi, KanGrubu, Hastalik, PersonelEtiket, OzelDurum, PersonDocument, DokumanTipi, BankaHesabi, Dependent, YakinlikTuru, PersonStatus, PersonSummaryInput } from '../types';
import { getPersonById, updatePerson, getPeople } from '../services/apiService';
import Modal from './Modal';
import SearchableSelect from './SearchableSelect';
import toast from 'react-hot-toast';
import { ICONS } from '../constants';
import { generatePersonSummary } from '../services/geminiService';


// --- Reusable Components --- //
const getStatusClass = (status: PersonStatus) => {
    switch (status) {
        case PersonStatus.AKTIF: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        case PersonStatus.PASIF: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        case PersonStatus.BEKLEMEDE: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
};

const DetailItem: React.FC<{ label: string, value?: React.ReactNode, children?: React.ReactNode, className?: string }> = ({ label, value, children, className }) => (
    <div className={className}>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <div className="mt-1 text-base text-zinc-800 dark:text-zinc-200">{children || value || '-'}</div>
    </div>
);

const FormInput: React.FC<{ label: string, name: string, value: any, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, required?: boolean, disabled?: boolean }> = 
    ({ label, name, value, onChange, type = 'text', required = false, disabled = false }) => (
    <div className="flex flex-col">
        <label htmlFor={name} className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">{label}</label>
        <input id={name} name={name} type={type} value={value || ''} onChange={onChange} required={required} disabled={disabled} className="p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-zinc-100 dark:disabled:bg-zinc-700/50 disabled:cursor-not-allowed" />
    </div>
);

const FormSelect: React.FC<{ label: string, name: string, value: any, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: { value: string, label: string }[], required?: boolean, disabled?: boolean }> = 
    ({ label, name, value, onChange, options, required = false, disabled = false }) => (
    <div className="flex flex-col">
        <label htmlFor={name} className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">{label}</label>
        <select id={name} name={name} value={value || ''} onChange={onChange} required={required} disabled={disabled} className="p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-sm appearance-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-zinc-100 dark:disabled:bg-zinc-700/50 disabled:cursor-not-allowed">
            <option value="" disabled>Seçiniz...</option>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const FormTextarea: React.FC<{ label: string, name: string, value: any, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, rows?: number }> = ({ label, name, value, onChange, rows = 3 }) => (
     <div className="flex flex-col">
        <label htmlFor={name} className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">{label}</label>
        <textarea id={name} name={name} value={value || ''} onChange={onChange} rows={rows} className="p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm" />
    </div>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${active ? 'bg-blue-600 text-white' : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}>
        {children}
    </button>
);


// --- MODAL COMPONENTS --- //
const BankaHesaplariModal: React.FC<{ person: Person, onClose: () => void, onSave: (data: Partial<Person>) => void }> = ({ person, onClose, onSave }) => {
    const [hesaplar, setHesaplar] = useState(person.bankaHesaplari || []);
    const [newHesap, setNewHesap] = useState({ iban: '', hesapAdi: '' });

    const handleAdd = () => {
        if (newHesap.iban && newHesap.hesapAdi) {
            setHesaplar([...hesaplar, { id: `new_${Date.now()}`, ...newHesap }]);
            setNewHesap({ iban: '', hesapAdi: '' });
        }
    };
    const handleDelete = (id: string) => setHesaplar(hesaplar.filter(h => h.id !== id));
    const handleSave = () => onSave({ bankaHesaplari: hesaplar });

    return (
        <Modal isOpen={true} onClose={onClose} title="Banka Hesapları">
            <div className="space-y-4">
                <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                    {hesaplar.length > 0 ? hesaplar.map(hesap => (
                        <div key={hesap.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-zinc-100 dark:bg-zinc-700 rounded-md gap-2">
                            <div className="flex-1">
                                <p className="font-semibold text-zinc-800 dark:text-zinc-200">{hesap.hesapAdi}</p>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-mono break-all">{hesap.iban}</p>
                            </div>
                            <button onClick={() => handleDelete(hesap.id)} className="self-end sm:self-center text-red-500 p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full text-xl leading-none">&times;</button>
                        </div>
                    )) : <p className="text-center text-zinc-500 py-4">Banka hesabı eklenmemiş.</p>}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 border-t pt-4">
                    <input type="text" placeholder="Hesap Adı" value={newHesap.hesapAdi} onChange={e => setNewHesap(p => ({...p, hesapAdi: e.target.value}))} className="flex-1 p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700" />
                    <input type="text" placeholder="IBAN" value={newHesap.iban} onChange={e => setNewHesap(p => ({...p, iban: e.target.value}))} className="flex-1 p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700" />
                    <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700">Ekle</button>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <button onClick={onClose} className="bg-white dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-lg font-semibold border border-zinc-300 dark:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-500">İptal</button>
                    <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Değişiklikleri Kaydet</button>
                </div>
            </div>
        </Modal>
    );
};

const DokumanlarModal: React.FC<{ person: Person, onClose: () => void, onSave: (data: Partial<Person>) => void }> = ({ person, onClose, onSave }) => {
    const [dokumanlar, setDokumanlar] = useState(person.dokumanlar || []);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const newDoc: PersonDocument = {
                id: `new_${Date.now()}`,
                ad: file.name,
                tip: DokumanTipi.DIGER,
                path: `people/${person.id}/${file.name}`,
            };
            setDokumanlar(prev => [...prev, newDoc]);
        } catch (error) {
            console.error(error);
            alert("Dosya işlenirken hata oluştu.");
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleDelete = (id: string) => setDokumanlar(dokumanlar.filter(d => d.id !== id));
    const handleSave = () => onSave({ dokumanlar });

    return (
        <Modal isOpen={true} onClose={onClose} title="Dokümanlar">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto p-1">
                    {dokumanlar.length > 0 ? dokumanlar.map(doc => (
                        <div key={doc.id} className="group relative border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-700/50">
                             <p className="font-semibold text-sm truncate text-zinc-800 dark:text-zinc-200" title={doc.ad}>{doc.ad}</p>
                             <p className="text-xs text-zinc-500 dark:text-zinc-400">{doc.tip}</p>
                            <button onClick={() => handleDelete(doc.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100">&times;</button>
                        </div>
                    )) : <p className="col-span-full text-center text-zinc-500 py-4">Doküman eklenmemiş.</p>}
                </div>
                <div className="border-t pt-4">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden"/>
                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full p-3 bg-zinc-100 dark:bg-zinc-700 border-dashed border-2 border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-50 text-zinc-600 dark:text-zinc-300 font-semibold">
                        {isUploading ? 'Yükleniyor...' : 'Yeni Doküman Yükle'}
                    </button>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <button onClick={onClose} className="bg-white dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-lg font-semibold border border-zinc-300 dark:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-500">İptal</button>
                    <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Değişiklikleri Kaydet</button>
                </div>
            </div>
        </Modal>
    );
};

const BagliKisilerModal: React.FC<{ person: Person, allPeople: Person[], onClose: () => void, onSave: (data: Partial<Person>) => void }> = ({ person, allPeople, onClose, onSave }) => {
    const [dependents, setDependents] = useState(person.dependents || []);
    const [newDependent, setNewDependent] = useState<{ personId: number | string, relationship: YakinlikTuru | '' }>({ personId: '', relationship: '' });

    const peopleMap = new Map(allPeople.map(p => [p.id, `${p.ad} ${p.soyad}`]));
    const availablePeople = allPeople.filter(p => p.id !== person.id && !dependents.some(d => d.personId === p.id));
    
    const handleAdd = () => {
        if (newDependent.personId && newDependent.relationship) {
            setDependents([...dependents, { personId: Number(newDependent.personId), relationship: newDependent.relationship as YakinlikTuru }]);
            setNewDependent({ personId: '', relationship: '' });
        }
    };
    const handleDelete = (personId: number) => setDependents(dependents.filter(d => d.personId !== personId));
    const handleSave = () => onSave({ dependents });
    
    return (
        <Modal isOpen={true} onClose={onClose} title="Baktığı Kişiler">
            <div className="space-y-4">
                 <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                    {dependents.length > 0 ? dependents.map(dep => (
                         <div key={dep.personId} className="flex items-center justify-between p-2 bg-zinc-100 dark:bg-zinc-700 rounded-md">
                             <div>
                                <p className="font-semibold text-zinc-800 dark:text-zinc-200">{peopleMap.get(dep.personId) || 'Bilinmeyen Kişi'}</p>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">{dep.relationship}</p>
                            </div>
                            <button onClick={() => handleDelete(dep.personId)} className="text-red-500 p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full text-xl leading-none">&times;</button>
                        </div>
                    )) : <p className="text-center text-zinc-500 py-4">Bağlı kişi eklenmemiş.</p>}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 border-t pt-4">
                    <div className="flex-1">
                         <SearchableSelect<Person> options={availablePeople} value={newDependent.personId} onChange={val => setNewDependent(p => ({...p, personId: val}))} getOptionValue={p => p.id} getOptionLabel={p => `${p.ad} ${p.soyad} (${p.kimlikNo})`} placeholder="Kişi seçin..." />
                    </div>
                    <select value={newDependent.relationship} onChange={e => setNewDependent(p => ({...p, relationship: e.target.value as YakinlikTuru}))} className="p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700">
                        <option value="">Yakınlık...</option>
                        {Object.values(YakinlikTuru).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700">Ekle</button>
                </div>
                 <div className="flex justify-end gap-2 pt-4">
                    <button onClick={onClose} className="bg-white dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-lg font-semibold border border-zinc-300 dark:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-500">İptal</button>
                    <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Değişiklikleri Kaydet</button>
                </div>
            </div>
        </Modal>
    );
};

const KisiDetay: React.FC = () => {
    const { kisiId } = ReactRouterDOM.useParams<{ kisiId: string }>();
    const navigate = ReactRouterDOM.useNavigate();
    const [person, setPerson] = useState<Person | null>(null);
    const [formData, setFormData] = useState<Person | null>(null);
    const [allPeople, setAllPeople] = useState<Person[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [activeTab, setActiveTab] = useState('genel');
    const [summaryState, setSummaryState] = useState({ isLoading: false, error: '', summary: '' });

    const fetchData = useCallback(async () => {
        if (!kisiId) return;
        setIsLoading(true);
        setError('');
        try {
            const [personData, allPeopleData] = await Promise.all([ getPersonById(parseInt(kisiId, 10)), getPeople() ]);
            setPerson(personData);
            setFormData(personData);
            setAllPeople(allPeopleData);
        } catch (err: any) {
            setError(err.message || 'Kişi detayı yüklenemedi.');
        } finally {
            setIsLoading(false);
        }
    }, [kisiId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleGenerateSummary = async () => {
        if (!person) return;
        setSummaryState({ isLoading: true, error: '', summary: '' });
        try {
            const summaryInput: PersonSummaryInput = {
                adSoyad: `${person.ad} ${person.soyad}`,
                kayitTarihi: person.kayitTarihi,
                durum: person.durum,
                ozelDurumlar: person.ozelDurumlar,
                aciklamalar: person.aciklamalar,
            };
            const result = await generatePersonSummary(summaryInput);
            setSummaryState({ isLoading: false, error: '', summary: result });
        } catch (err: any) {
            setSummaryState({ isLoading: false, error: err.message || 'Özet oluşturulurken bir hata oluştu.', summary: '' });
        }
    };


    const handleUpdate = async (updatedData: Partial<Person>) => {
        if (!person) return;
        const promise = new Promise<Person>(async (resolve, reject) => {
            setIsSaving(true);
            try {
                const dataToSave = { ...person, ...updatedData };
                const savedPerson = await updatePerson(person.id, dataToSave);
                setPerson(savedPerson);
                setFormData(savedPerson);
                setActiveModal(null);
                resolve(savedPerson);
            } catch (err) {
                console.error(err);
                reject(err);
            } finally {
                setIsSaving(false);
            }
        });

        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: 'Değişiklikler kaydedildi!',
            error: 'Bir hata oluştu.',
        });
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (!formData) return;
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveChanges = async () => {
        if (!formData) return;
        await handleUpdate(formData);
        setIsEditMode(false);
    };

    const handleCancelEdit = () => {
        setFormData(person);
        setIsEditMode(false);
    };
    
    if (isLoading && !person) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    if (!person || !formData) return <div className="text-center py-10">Kişi bulunamadı.</div>;
    
    const fullNameForUrl = encodeURIComponent(`${person.ad} ${person.soyad}`);
    const linkedRecordsConfig = [
        { label: 'Banka Hesapları', action: () => setActiveModal('banka'), count: person.bankaHesaplari?.length },
        { label: 'Dokümanlar', action: () => setActiveModal('dokuman'), count: person.dokumanlar?.length },
        { label: 'Fotoğraflar', disabled: true, count: person.fotograflar?.length },
        { label: 'Bağlı Yetimler', disabled: true },
        { label: 'Baktığı Kişiler', action: () => setActiveModal('bagli-kisiler'), count: person.dependents?.length },
        { label: 'Sponsorlar', disabled: true },
        { label: 'Referanslar', disabled: true },
        { label: 'Görüşme Kayıtları', disabled: true },
        { label: 'Yardım Talepleri', to: `/yardimlar?kisiAdi=${fullNameForUrl}`},
        { label: 'Yapılan Yardımlar', to: `/yardim-yonetimi/tum-yardimlar?kisiAdi=${fullNameForUrl}` },
        { label: 'Rıza Beyanları', disabled: true, status: person.rizaBeyani },
        { label: 'Sosyal Kartlar', disabled: true },
    ];
    
    const renderContent = () => {
        const View = (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
                <DetailItem label="Ad Soyad" value={`${formData.ad} ${formData.soyad}`} />
                <DetailItem label="Durum" children={<span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(formData.durum)}`}>{formData.durum}</span>} />
                <DetailItem label="Cep Telefonu" value={formData.cepTelefonu} />
                <DetailItem label="E-posta" value={formData.email} />
                <DetailItem label="Uyruk" value={formData.uyruk.join(', ')} />
                <DetailItem label="Doğum Tarihi" value={new Date(formData.dogumTarihi).toLocaleDateString('tr-TR')} />
                <DetailItem label="TC Kimlik No" value={formData.kimlikNo} />
                <DetailItem label="Cinsiyet" value={formData.cinsiyet} />
                <DetailItem label="Medeni Durum" value={formData.medeniDurum} />
                <DetailItem label="Adres" value={`${formData.adres}, ${formData.mahalle}, ${formData.yerlesim}/${formData.sehir}`} className="sm:col-span-2 lg:col-span-3"/>
            </div>
        );
        const Edit = (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormInput label="Ad" name="ad" value={formData.ad} onChange={handleInputChange} required />
                <FormInput label="Soyad" name="soyad" value={formData.soyad} onChange={handleInputChange} required />
                <FormSelect label="Durum" name="durum" value={formData.durum} onChange={handleInputChange} options={Object.values(PersonStatus).map(s=>({value:s, label:s}))} required />
                <FormInput label="Cep Telefonu" name="cepTelefonu" value={formData.cepTelefonu} onChange={handleInputChange} required />
                <FormInput label="E-posta" name="email" value={formData.email} onChange={handleInputChange} type="email" />
                <FormInput label="Doğum Tarihi" name="dogumTarihi" value={formData.dogumTarihi} onChange={handleInputChange} type="date" />
                <FormInput label="TC Kimlik No" name="kimlikNo" value={formData.kimlikNo} onChange={handleInputChange} />
                <FormSelect label="Cinsiyet" name="cinsiyet" value={formData.cinsiyet} onChange={handleInputChange} options={[{value:'Erkek', label:'Erkek'}, {value:'Kız', label:'Kız'}]} />
                <FormSelect label="Medeni Durum" name="medeniDurum" value={formData.medeniDurum} onChange={handleInputChange} options={Object.values(MedeniDurum).map(s=>({value:s, label:s}))} />
                <FormInput label="Şehir" name="sehir" value={formData.sehir} onChange={handleInputChange} />
                <FormInput label="İlçe/Yerleşim" name="yerlesim" value={formData.yerlesim} onChange={handleInputChange} />
                <FormInput label="Mahalle" name="mahalle" value={formData.mahalle} onChange={handleInputChange} />
                <div className="sm:col-span-2 lg:col-span-3">
                    <FormTextarea label="Açık Adres" name="adres" value={formData.adres} onChange={handleInputChange} rows={2} />
                </div>
            </div>
        );
        return isEditMode ? Edit : View;
    }

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{person.ad} {person.soyad} (ID: #{person.id})</h2>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button onClick={handleGenerateSummary} disabled={summaryState.isLoading} className="px-3 py-2 text-sm font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 flex items-center justify-center gap-2 disabled:bg-purple-300">
                            <span className="w-4 h-4">{ICONS.LIGHTBULB}</span>
                            <span className="hidden sm:inline">AI Özet Oluştur</span>
                            <span className="sm:hidden">AI Özet</span>
                        </button>
                        {isEditMode ? (
                            <div className="flex gap-2">
                                <button onClick={handleCancelEdit} className="flex-1 sm:flex-none px-3 py-2 text-sm font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50">İptal</button>
                                <button onClick={handleSaveChanges} disabled={isSaving} className="flex-1 sm:flex-none px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400">
                                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setIsEditMode(true)} className="px-3 py-2 text-sm font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50">
                                <span className="hidden sm:inline">Bilgileri Düzenle</span>
                                <span className="sm:hidden">Düzenle</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
                <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-700 pb-4">
                        <TabButton active={activeTab === 'genel'} onClick={() => setActiveTab('genel')}>Genel Bilgiler</TabButton>
                        <TabButton active={false} onClick={() => alert('Bu sekme yapım aşamasındadır.')}>Diğer Detaylar</TabButton>
                    </div>
                    {renderContent()}
                </div>

                <div className="space-y-4">
                    <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Bağlantılı Kayıtlar</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
                           {linkedRecordsConfig.map(item => {
                                if (item.to) {
                                    return <ReactRouterDOM.Link key={item.label} to={item.to} className="p-3 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm text-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">{item.label}</ReactRouterDOM.Link>
                                }
                                return (
                                    <button 
                                        key={item.label} 
                                        onClick={item.action}
                                        disabled={item.disabled}
                                        className="p-3 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm text-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {item.label} {item.count !== undefined ? `(${item.count})` : ''}
                                    </button>
                                );
                           })}
                        </div>
                    </div>
                </div>
            </div>
            
            {activeModal === 'banka' && person && <BankaHesaplariModal person={person} onClose={() => setActiveModal(null)} onSave={handleUpdate} />}
            {activeModal === 'dokuman' && person && <DokumanlarModal person={person} onClose={() => setActiveModal(null)} onSave={handleUpdate} />}
            {activeModal === 'bagli-kisiler' && person && <BagliKisilerModal person={person} allPeople={allPeople} onClose={() => setActiveModal(null)} onSave={handleUpdate} />}
        
            { (summaryState.isLoading || summaryState.summary || summaryState.error) && (
                <Modal isOpen={true} onClose={() => setSummaryState({ isLoading: false, error: '', summary: '' })} title={`AI Özet: ${person.ad} ${person.soyad}`}>
                    {summaryState.isLoading && (
                        <div className="text-center p-8">
                            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Özet oluşturuluyor...</p>
                        </div>
                    )}
                    {summaryState.error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-md">
                            <p className="font-bold">Hata!</p>
                            <p>{summaryState.error}</p>
                        </div>
                    )}
                    {summaryState.summary && (
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg space-y-2">
                            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{summaryState.summary}</p>
                        </div>
                    )}
                </Modal>
            )}

        </div>
    );
};
export default KisiDetay;