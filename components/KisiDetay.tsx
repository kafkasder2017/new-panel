import React, { useState, useEffect, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Person, PersonStatus, MedeniDurum, PersonSummaryInput } from '../types';
import { getPersonById, updatePerson, getPeople } from '../services/apiService';
import toast from 'react-hot-toast';
import { ICONS } from '../constants';
import Modal from './Modal';
import { generatePersonSummary } from '../services/geminiService';
import { GenelView, GenelEdit, LinkedRecords, BankaHesaplariModal, DokumanlarModal, BagliKisilerModal } from './kisiDetay/index';

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
            const [personData, allPeopleData] = await Promise.all([ getPersonById(String(kisiId)), getPeople() ]);
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
                durum: (person.status || person.durum) as PersonStatus,
                ozelDurumlar: (person as any).ozelDurumlar,
                aciklamalar: (person as any).notlar,
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
        { label: 'Rıza Beyanları', disabled: true, status: (person.consent_statement || (person as any).rizaBeyani) },
        { label: 'Sosyal Kartlar', disabled: true },
    ];
    
    const renderContent = () => (isEditMode && formData ? <GenelEdit formData={formData} onChange={handleInputChange} /> : formData ? <GenelView data={formData} /> : null);

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{person.ad} {person.soyad} (ID: #{person.id})</h2>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
<button
    onClick={handleGenerateSummary}
    disabled={summaryState.isLoading}
    className="px-3 py-2 text-sm font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 flex items-center justify-center gap-2 disabled:bg-purple-300"
    aria-label="AI özet oluştur"
    title="Kişinin bilgileri üzerinden AI ile kısa özet oluştur"
>
    <span className="w-4 h-4" aria-hidden="true">{ICONS.LIGHTBULB}</span>
    <span className="hidden sm:inline">AI Özet Oluştur</span>
    <span className="sm:hidden">AI Özet</span>
</button>
                        {isEditMode ? (
                            <div className="flex gap-2">
                                <button
    onClick={handleCancelEdit}
    className="flex-1 sm:flex-none px-3 py-2 text-sm font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
    aria-label="Düzenlemeyi iptal et"
    title="Yapılan değişiklikleri kaydetmeden düzenlemeyi iptal et"
>
    İptal
</button>
<button
    onClick={handleSaveChanges}
    disabled={isSaving}
    className="flex-1 sm:flex-none px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
    aria-label="Değişiklikleri kaydet"
    title="Formdaki değişiklikleri kaydet"
>
    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
</button>
                            </div>
                        ) : (
<button
    onClick={() => setIsEditMode(true)}
    className="px-3 py-2 text-sm font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50"
    aria-label="Bilgileri düzenle"
    title="Kişi bilgilerini düzenle"
>
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
                        <button
    onClick={() => setActiveTab('genel')}
    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'genel' ? 'bg-blue-600 text-white' : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}
    aria-pressed={activeTab === 'genel'}
    aria-controls="tab-panel-genel"
    role="tab"
    title="Genel bilgiler sekmesi"
>
    Genel Bilgiler
</button>
                        <button
    onClick={() => alert('Bu sekme yapım aşamasındadır.')}
    className="px-4 py-2 text-sm font-semibold rounded-md transition-colors text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
    aria-pressed={false}
    role="tab"
    title="Diğer detaylar (yakında)"
>
    Diğer Detaylar
</button>
                    </div>
                    <div id="tab-panel-genel" role="tabpanel" aria-labelledby="tab-genel">
    {renderContent()}
</div>
                </div>

                <div className="space-y-4">
<LinkedRecords
    person={person}
    onOpen={(key) => setActiveModal(key)}
/>
{/* Erişilebilirlik: modal butonları ilgili başlıklarla ilişkilendirilecek */}
                </div>
            </div>
            
{activeModal === 'banka' && person && (
    <BankaHesaplariModal
        person={person}
        onClose={() => setActiveModal(null)}
        onSave={handleUpdate}
    />
)}
{activeModal === 'dokuman' && person && (
    <DokumanlarModal
        person={person}
        onClose={() => setActiveModal(null)}
        onSave={handleUpdate}
    />
)}
{activeModal === 'bagli-kisiler' && person && (
    <BagliKisilerModal
        person={person}
        allPeople={allPeople}
        onClose={() => setActiveModal(null)}
        onSave={handleUpdate}
    />
)}

            {(summaryState.isLoading || summaryState.summary || summaryState.error) && (
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
