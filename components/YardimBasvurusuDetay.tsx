import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import toast from 'react-hot-toast';
import { YardimBasvurusu, BasvuruStatus, BasvuruOncelik, DokumanTipi, PersonDocument, Person, Yorum, LogEntityType } from '../types';
import Modal from './Modal';
import { getYardimBasvurusuById, getPeople, updateYardimBasvurusu, createOdeme, getPublicUrl, createYorum } from '../services/apiService';
import { OdemeTuru, OdemeYontemi, OdemeDurumu } from '../types';


const getStatusClass = (status: BasvuruStatus) => {
    switch (status) {
        case BasvuruStatus.BEKLEYEN: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        case BasvuruStatus.INCELENEN: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        case BasvuruStatus.ONAYLANAN: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
        case BasvuruStatus.REDDEDILEN: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        case BasvuruStatus.BASKAN_REDDETTI: return 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-200';
        case BasvuruStatus.TAMAMLANAN: return 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
        default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
};

const getPriorityClass = (priority?: BasvuruOncelik) => {
    switch(priority) {
        case BasvuruOncelik.YUKSEK: return 'text-red-600 dark:text-red-400 font-semibold';
        case BasvuruOncelik.ORTA: return 'text-yellow-600 dark:text-yellow-400 font-semibold';
        case BasvuruOncelik.DUSUK: return 'text-green-600 dark:text-green-400 font-semibold';
        default: return 'text-zinc-600 dark:text-zinc-400';
    }
};


const StatCard: React.FC<{ label: string, value: React.ReactNode, icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm flex items-center space-x-4 border border-zinc-200 dark:border-zinc-700">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-400">{icon}</div>
        <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
            <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{value}</p>
        </div>
    </div>
);

const FilePreviewIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 dark:text-zinc-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
);

const FilePreviewCard: React.FC<{ doc: PersonDocument, onDelete: (docId: string) => void }> = ({ doc, onDelete }) => {
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.ad);
    const url = getPublicUrl(doc.path);

    return (
        <div className="group relative flex flex-col h-full bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-shadow hover:shadow-md">
             <a href={url} target="_blank" rel="noopener noreferrer" className="block p-2">
                <div className="aspect-w-1 aspect-h-1 w-full bg-zinc-100 dark:bg-zinc-700/50 rounded-md flex items-center justify-center overflow-hidden">
                    {isImage ? (
                        <img src={url} alt={doc.ad} className="w-full h-full object-cover" />
                    ) : (
                        <FilePreviewIcon />
                    )}
                </div>
                 <p className="text-xs font-semibold text-center mt-2 text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate" title={doc.ad}>
                    {doc.ad}
                </p>
            </a>
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                aria-label="Sil"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
    );
};

const SafeYorumContent: React.FC<{ content: string }> = ({ content }) => {
    const mentionRegex = /(@[\w\d_]+)/g;
    const parts = content.split(mentionRegex);

    return (
        <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">
            {parts.map((part, index) =>
                mentionRegex.test(part) ? (
                    <strong key={index} className="text-blue-600 font-semibold">{part}</strong>
                ) : (
                    <React.Fragment key={index}>{part}</React.Fragment>
                )
            )}
        </p>
    );
};

const YorumItem: React.FC<{ yorum: Yorum }> = ({ yorum }) => {
    return (
        <li className="flex items-start space-x-3">
            <img src={yorum.kullaniciAvatarUrl} alt={yorum.kullaniciAdi} className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 bg-zinc-100 dark:bg-zinc-700/50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">{yorum.kullaniciAdi}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(yorum.timestamp).toLocaleString('tr-TR')}</p>
                </div>
                <SafeYorumContent content={yorum.icerik} />
            </div>
        </li>
    );
};

const YorumForm: React.FC<{ onSubmit: (text: string) => Promise<void> }> = ({ onSubmit }) => {
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        setIsSubmitting(true);
        await onSubmit(text);
        setText('');
        setIsSubmitting(false);
    };
    return (
        <form onSubmit={handleSubmit} className="flex items-start space-x-3">
            <img src="https://i.pravatar.cc/100?u=admin@kafkader.org" alt="Current User" className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Bir yorum ekle... (@kullanici ile bahsedebilirsin)"
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={3}
                    disabled={isSubmitting}
                />
                <button type="submit" className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-400" disabled={isSubmitting}>
                    {isSubmitting ? 'Gönderiliyor...' : 'Yorum Ekle'}
                </button>
            </div>
        </form>
    );
};


const YardimBasvurusuDetay: React.FC = () => {
    const { basvuruId } = ReactRouterDOM.useParams<{ basvuruId: string }>();
    const [basvuru, setBasvuru] = useState<YardimBasvurusu | null>(null);
    const [applicant, setApplicant] = useState<Person | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');


    const fetchData = async () => {
        if (!basvuruId) return;
        setIsLoading(true);
        setError('');
        try {
            const basvuruData = await getYardimBasvurusuById(parseInt(basvuruId, 10));
            setBasvuru(basvuruData);
            if (basvuruData) {
                const applicantData = await getPeople().then(people => people.find(p => p.id === basvuruData.basvuruSahibiId));
                setApplicant(applicantData || null);
            }
        } catch (err: any) {
            setError(err.message || 'Başvuru detayı yüklenemedi.');
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, [basvuruId]);
    
    const onCreatePayment = async (application: YardimBasvurusu) => {
        if (!applicant) return;
         try {
            const newPayment = await createOdeme({
                odemeTuru: OdemeTuru.YARDIM_ODEMESI,
                kisi: `${applicant.ad} ${applicant.soyad}`,
                tutar: application.talepTutari,
                paraBirimi: 'TRY',
                aciklama: `Yardım Başvurusu #${application.id} - ${application.basvuruTuru}`,
                odemeYontemi: OdemeYontemi.BANKA_TRANSFERI,
                odemeTarihi: new Date().toISOString().split('T')[0],
                durum: OdemeDurumu.TAMAMLANAN,
            });
            const updatedApp = await updateYardimBasvurusu(application.id, { durum: BasvuruStatus.TAMAMLANAN, odemeId: newPayment.id });
            setBasvuru(updatedApp);
            toast.success(`Ödeme kaydı oluşturuldu ve başvuru durumu "Tamamlandı" olarak güncellendi.`);
        } catch(err) {
             toast.error('Ödeme oluşturulurken bir hata oluştu.');
        }
    }


    const handleSaveEvaluation = async (updatedBasvuru: YardimBasvurusu) => {
        try {
            const saved = await updateYardimBasvurusu(updatedBasvuru.id, updatedBasvuru);
            setBasvuru(saved);
            setIsModalOpen(false);
            toast.success('Değerlendirme başarıyla kaydedildi.');
        } catch (err) {
            toast.error('Değerlendirme kaydedilirken bir hata oluştu.');
        }
    };
    
    const handleAddComment = async (commentText: string) => {
        if (!basvuru) return;

        const currentUser = {
            id: 1, adSoyad: 'Yönetici Kullanıcı',
            avatarUrl: 'https://i.pravatar.cc/100?u=admin@kafkader.org',
        };

        const newComment: Omit<Yorum, 'id'> = {
            timestamp: new Date().toISOString(),
            kullaniciId: currentUser.id, kullaniciAdi: currentUser.adSoyad,
            kullaniciAvatarUrl: currentUser.avatarUrl, icerik: commentText,
            entityTipi: LogEntityType.APPLICATION, entityId: basvuru.id,
        };

        try {
            const createdComment = await createYorum(newComment);
            const updatedYorumlar = [...(basvuru.yorumlar || []), createdComment];
            const savedBasvuru = await updateYardimBasvurusu(basvuru.id, { yorumlar: updatedYorumlar });
            setBasvuru(savedBasvuru);
        } catch (err) {
            toast.error("Yorum eklenirken bir hata oluştu.");
            console.error(err);
        }
    };
    
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !basvuru) return;
        const file = e.target.files[0];
        
        setIsUploading(true);
        setUploadError('');

        try {
            const newDoc: PersonDocument = {
                id: `doc_${Date.now()}`,
                ad: file.name,
                tip: DokumanTipi.DIGER, // Could be inferred from MIME type
                path: `applications/${basvuru.id}/${file.name}`,
            };

            const updatedDosyalar = [...(basvuru.dosyalar || []), newDoc];
            const updated = await updateYardimBasvurusu(basvuru.id, { dosyalar: updatedDosyalar });
            setBasvuru(updated);

        } catch (err: any) {
            setUploadError("Dosya yüklenirken bir hata oluştu: " + err.message);
            console.error(err);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };


    const handleFileDelete = async (docId: string) => {
        if (!basvuru) return;
        if (window.confirm("Bu dosyayı silmek istediğinizden emin misiniz?")) {
            const updatedDosyalar = (basvuru.dosyalar || []).filter(d => d.id !== docId);
             try {
                const updated = await updateYardimBasvurusu(basvuru.id, { dosyalar: updatedDosyalar });
                setBasvuru(updated);
            } catch (err) {
                toast.error("Dosya silinirken hata oluştu.");
            }
        }
    };


    const groupedFiles = useMemo(() => {
        return (basvuru?.dosyalar || []).reduce((acc, doc) => {
          (acc[doc.tip] = acc[doc.tip] || []).push(doc);
          return acc;
        }, {} as Record<DokumanTipi, PersonDocument[]>);
    }, [basvuru?.dosyalar]);
    
    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    if (!basvuru) {
        return (
             <div className="text-center py-20 text-zinc-500">
                <h2 className="text-2xl font-bold">Başvuru Bulunamadı</h2>
                <p className="mt-2">Belirtilen ID ile bir yardım başvurusu bulunamadı.</p>
                <ReactRouterDOM.Link to="/yardimlar" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                    Başvuru Listesine Geri Dön
                </ReactRouterDOM.Link>
            </div>
        );
    }

    const applicantName = applicant ? `${applicant.ad} ${applicant.soyad}` : `Bilinmeyen ID: ${basvuru.basvuruSahibiId}`;

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                 <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">{basvuru.basvuruTuru}</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Kişi: 
                            <ReactRouterDOM.Link to={`/kisiler/${basvuru.basvuruSahibiId}`} className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                                {applicantName}
                            </ReactRouterDOM.Link>
                        </p>
                    </div>
                    <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${getStatusClass(basvuru.durum)}`}>
                        {basvuru.durum}
                    </span>
                </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Talep Tutarı" value={basvuru.talepTutari.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}/>
                <StatCard label="Öncelik" value={<span className={getPriorityClass(basvuru.oncelik)}>{basvuru.oncelik}</span>} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4v-4"/></svg>}/>
                <StatCard label="Başvuru Tarihi" value={new Date(basvuru.basvuruTarihi).toLocaleDateString('tr-TR')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>}/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 space-y-6">
                    {basvuru.durum === BasvuruStatus.ONAYLANAN && basvuru.baskanOnayi && !basvuru.odemeId && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl shadow-sm border border-green-200 dark:border-green-700">
                            <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">İşlem Onaylandı ve Ödemeye Hazır</h3>
                            <p className="text-green-700 dark:text-green-400 mt-2">Bu yardım başvurusu hem komisyon hem de başkan tarafından onaylanmıştır. Aşağıdaki butona tıklayarak yardım ödemesini oluşturabilir ve finansal kayıtlara işleyebilirsiniz.</p>
                            <button 
                                onClick={() => onCreatePayment(basvuru)} 
                                className="mt-4 bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                <span>Ödeme Kaydını Oluştur</span>
                            </button>
                        </div>
                    )}
                    {basvuru.odemeId && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl shadow-sm border border-blue-200 dark:border-blue-700">
                            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">Ödeme Yapıldı</h3>
                            <p className="text-blue-700 dark:text-blue-400 mt-2">Bu başvuru için ödeme kaydı oluşturulmuştur. Finansal kayıtlar bölümünden detayı inceleyebilirsiniz.</p>
                        </div>
                    )}
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Komisyon Değerlendirme Notu</h3>
                            <button onClick={() => setIsModalOpen(true)} className="text-sm bg-blue-500 text-white px-3 py-1 rounded-md font-semibold hover:bg-blue-600 disabled:bg-blue-300" disabled={!!basvuru.odemeId || basvuru.durum === BasvuruStatus.BASKAN_REDDETTI}>
                                Düzenle
                            </button>
                        </div>
                         <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">{basvuru.degerlendirmeNotu || 'Henüz bir değerlendirme notu eklenmemiş.'}</p>
                    </div>

                    {(basvuru.baskanOnayi || basvuru.durum === BasvuruStatus.BASKAN_REDDETTI) && (
                         <div className={`p-6 rounded-xl shadow-sm ${basvuru.baskanOnayi ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'}`}>
                            <h3 className={`text-lg font-semibold ${basvuru.baskanOnayi ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>Başkan Onay Notu</h3>
                            <p className={`mt-2 whitespace-pre-wrap ${basvuru.baskanOnayi ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{basvuru.baskanOnayNotu || 'Not belirtilmemiş.'}</p>
                        </div>
                    )}
                    
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Yorumlar ve Gelişmeler</h3>
                        <div className="space-y-4">
                            <ul className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {basvuru.yorumlar && basvuru.yorumlar.length > 0 ? (
                                    basvuru.yorumlar.map(yorum => <YorumItem key={yorum.id} yorum={yorum} />)
                                ) : (
                                    <p className="text-sm text-zinc-500 text-center py-4">Bu başvuru için henüz yorum yapılmamış.</p>
                                )}
                            </ul>
                            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                                <YorumForm onSubmit={handleAddComment} />
                            </div>
                        </div>
                    </div>

                </div>

                 <div className="space-y-6">
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">İlişkili Dosyalar</h3>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} className="text-sm bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-3 py-1 rounded-md font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-600">
                                Yeni Dosya Yükle
                            </button>
                         </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {(basvuru.dosyalar || []).map(doc => <FilePreviewCard key={doc.id} doc={doc} onDelete={handleFileDelete} />)}
                             {isUploading && (
                                <div className="aspect-w-1 aspect-h-1 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-lg flex flex-col items-center justify-center p-2 border-2 border-dashed border-zinc-300 dark:border-zinc-600">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <p className="text-xs mt-2 text-zinc-500">Yükleniyor...</p>
                                </div>
                            )}
                        </div>
                        {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
                        {(basvuru.dosyalar || []).length === 0 && !isUploading && (
                             <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">Bu başvuruya ait doküman bulunmamaktadır.</p>
                        )}
                     </div>
                 </div>
            </div>

            {isModalOpen && (
                 <EvaluationModal
                    basvuru={basvuru}
                    applicantName={applicantName}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveEvaluation}
                />
            )}
        </div>
    );
};

const EvaluationModal: React.FC<{ basvuru: YardimBasvurusu, applicantName: string, onClose: () => void, onSave: (basvuru: YardimBasvurusu) => void }> = ({ basvuru, applicantName, onClose, onSave }) => {
    const [formData, setFormData] = useState<YardimBasvurusu>(basvuru);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Başvuruyu Değerlendir">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-x-4">
                       <p><strong>Kişi:</strong> {applicantName}</p>
                       <p><strong>Başvuru Türü:</strong> {basvuru.basvuruTuru}</p>
                       <p><strong>Talep Tutarı:</strong> <span className="font-semibold">{basvuru.talepTutari.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></p>
                       <p><strong>Öncelik:</strong> <span className={getPriorityClass(basvuru.oncelik)}>{basvuru.oncelik}</span></p>
                    </div>
                     <div className="border-t border-zinc-200 dark:border-zinc-600 pt-2 mt-2">
                         <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Talep Detayı:</p>
                         <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">{basvuru.talepDetayi}</p>
                     </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Başvuru Durumu</label>
                    <select name="durum" value={formData.durum} onChange={handleChange} className="mt-1 block w-full border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm p-2 bg-white dark:bg-zinc-700" required>
                        {[BasvuruStatus.BEKLEYEN, BasvuruStatus.INCELENEN, BasvuruStatus.ONAYLANAN, BasvuruStatus.REDDEDILEN].map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Değerlendirme Notu</label>
                    <textarea name="degerlendirmeNotu" value={formData.degerlendirmeNotu || ''} onChange={handleChange} rows={4} className="mt-1 block w-full border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm p-2 bg-zinc-50 dark:bg-zinc-700" placeholder="Değerlendirme ile ilgili notlarınızı buraya yazın..."></textarea>
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-lg font-semibold border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-600">İptal</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Kaydet</button>
                </div>
            </form>
        </Modal>
    );
};

export default YardimBasvurusuDetay;