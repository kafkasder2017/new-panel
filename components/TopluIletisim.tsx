
import React, { useState, useEffect } from 'react';
import { GonderimTuru, HedefKitle, GonderilenMesaj, MembershipType } from '../types';
import { getMessages, createMessageLog, getPeople, getGonulluler } from '../services/apiService';

const TopluIletisim: React.FC = () => {
    const [gonderimTuru, setGonderimTuru] = useState<GonderimTuru>(GonderimTuru.SMS);
    const [hedefKitle, setHedefKitle] = useState<HedefKitle>(HedefKitle.TUM_KISILER);
    const [baslik, setBaslik] = useState('');
    const [icerik, setIcerik] = useState('');
    const [gonderilenler, setGonderilenler] = useState<GonderilenMesaj[]>([]);
    
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');
    
    const [recipientCount, setRecipientCount] = useState(0);
    const [isCalculating, setIsCalculating] = useState(true);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const data = await getMessages();
                setGonderilenler(data);
            } catch (err) {
                setError('Geçmiş mesajlar yüklenemedi.');
            }
        };
        fetchMessages();
    }, []);

    useEffect(() => {
        const calculateAudience = async () => {
            setIsCalculating(true);
            setError('');
            try {
                let count = 0;
                let allPeople;
                switch (hedefKitle) {
                    case HedefKitle.TUM_KISILER:
                        count = (await getPeople()).length;
                        break;
                    case HedefKitle.TUM_UYELER:
                        allPeople = await getPeople();
                        count = allPeople.filter(p => p.membershipType && p.membershipType !== MembershipType.GONULLU).length;
                        break;
                    case HedefKitle.TUM_GONULLULER:
                        count = (await getGonulluler()).length;
                        break;
                    case HedefKitle.YARDIM_ALANLAR:
                        allPeople = await getPeople();
                        count = allPeople.filter(p => p.aldigiYardimTuru && p.aldigiYardimTuru.length > 0).length;
                        break;
                    default:
                        count = 0;
                }
                setRecipientCount(count);
            } catch (err: any) {
                setError("Hedef kitle hesaplanırken bir hata oluştu: " + err.message);
                setRecipientCount(0);
            } finally {
                setIsCalculating(false);
            }
        };
        calculateAudience();
    }, [hedefKitle]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!icerik || recipientCount === 0) {
            setError('Mesaj içeriği boş olamaz ve hedef kitle en az 1 kişi olmalıdır.');
            return;
        }
        setIsSending(true);
        setError('');
        setStatus('');

        try {
            const newMessage: Omit<GonderilenMesaj, 'id'> = {
                gonderimTuru,
                hedefKitle,
                kisiSayisi: recipientCount,
                baslik,
                icerik,
                gonderimTarihi: new Date().toISOString(),
                gonderenKullanici: 'Admin User' // Should come from user context
            };
            
            const savedMessage = await createMessageLog(newMessage);
            setGonderilenler([savedMessage, ...gonderilenler]);

            setStatus(`Mesajınız ${recipientCount} kişiye başarıyla gönderildi (simülasyon).`);
            setBaslik('');
            setIcerik('');

        } catch (err: any) {
            setError(err.message || "Mesaj gönderilirken bir hata oluştu.");
        } finally {
            setIsSending(false);
            setTimeout(() => setStatus(''), 5000);
        }
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gönderim Formu */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
                 <h2 className="text-xl font-bold text-slate-800 border-b pb-3 mb-4">Yeni Mesaj Gönder</h2>
                <form onSubmit={handleSendMessage} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Gönderim Türü</label>
                            <select value={gonderimTuru} onChange={e => setGonderimTuru(e.target.value as GonderimTuru)} className="mt-1 block w-full p-2 border border-slate-300 rounded-lg bg-white">
                                <option value={GonderimTuru.SMS}>SMS</option>
                                <option value={GonderimTuru.EPOSTA}>E-posta</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Hedef Kitle {isCalculating ? <span className="text-purple-600">(Hesaplanıyor...)</span> : <span className="text-slate-500">({recipientCount} kişi)</span>}
                            </label>
                            <select value={hedefKitle} onChange={e => setHedefKitle(e.target.value as HedefKitle)} className="mt-1 block w-full p-2 border border-slate-300 rounded-lg bg-white">
                                 {Object.values(HedefKitle).map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Konu / Başlık</label>
                        <div className="relative">
                           <input type="text" value={baslik} onChange={e => setBaslik(e.target.value)} placeholder="örn: Bayram Tebriği, Etkinlik Duyurusu" className="mt-1 block w-full p-2 border border-slate-300 rounded-lg" />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Mesaj İçeriği</label>
                        <textarea value={icerik} onChange={e => setIcerik(e.target.value)} rows={gonderimTuru === GonderimTuru.SMS ? 4 : 8} className="mt-1 block w-full p-2 border border-slate-300 rounded-lg"></textarea>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {status && <p className="text-sm text-green-600">{status}</p>}
                    <div className="pt-2 text-right">
                        <button type="submit" disabled={isSending || isCalculating} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400">
                            {isSending ? 'Gönderiliyor...' : 'Gönder'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Gönderilen Mesajlar */}
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-3 mb-4">Gönderim Geçmişi</h3>
                 <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {gonderilenler.map(mesaj => (
                        <div key={mesaj.id} className="p-3 bg-slate-50 rounded-lg">
                            <p className="font-semibold text-slate-700">{mesaj.baslik || '(Başlıksız)'}</p>
                            <p className="text-xs text-slate-500 truncate">{mesaj.icerik}</p>
                            <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                                <span>{new Date(mesaj.gonderimTarihi).toLocaleDateString('tr-TR')}</span>
                                <span className={`font-semibold ${mesaj.gonderimTuru === 'SMS' ? 'text-green-600' : 'text-purple-600'}`}>{mesaj.gonderimTuru}</span>
                                <span>{mesaj.kisiSayisi} kişi</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TopluIletisim;
