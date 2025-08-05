

import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';

const faqData = [
    {
        question: 'Giriş yapamıyorum, ne yapmalıyım?',
        answer: 'E-posta ve şifrenizi doğru yazdığınızdan emin olun. Caps Lock tuşunun kapalı olduğunu kontrol edin. Sorun devam ederse, giriş sayfasındaki "Şifremi Unuttum" linkini kullanarak şifrenizi sıfırlayabilirsiniz.'
    },
    {
        question: 'Kaydettiğim veriler görünmüyor.',
        answer: 'Öncelikle internet bağlantınızı kontrol edin ve sayfayı yenileyin (Ctrl+R veya Cmd+R). Sorun devam ederse, tarayıcınızın önbelleğini temizlemeyi deneyin. Bu adımlar işe yaramazsa sistem yöneticinize başvurun.'
    },
    {
        question: 'Rapor oluştururken hata alıyorum.',
        answer: 'Seçtiğiniz tarih aralığını ve filtreleri kontrol edin. Çok geniş bir tarih aralığı veya çok fazla veri içeren karmaşık filtreler performansı etkileyebilir ve hataya neden olabilir. Daha küçük aralıklarla deneme yapın. Sorun devam ederse sistem yöneticisine bildirin.'
    },
    {
        question: 'Dosya yükleyemiyorum.',
        answer: 'Yüklemeye çalıştığınız dosyanın boyutunu ve formatını kontrol edin. Sistem genellikle 10MB\'den büyük dosyalara veya belirli formatlar (örn. .exe) dışındaki dosyalara izin vermeyebilir. İzin verilen formatlar genellikle PDF, JPG, PNG, DOCX, XLSX\'dir. Dosya boyutu limitini aşıp aşmadığınızı kontrol edin.'
    }
];

const FaqItem: React.FC<{ item: typeof faqData[0]; isOpen: boolean; onClick: () => void }> = ({ item, isOpen, onClick }) => {
    return (
        <div className="border-b border-slate-200">
            <button
                onClick={onClick}
                className="w-full flex justify-between items-center text-left py-4 px-2 hover:bg-slate-50"
            >
                <span className="font-semibold text-slate-800">{item.question}</span>
                <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    {ICONS.CHEVRON_DOWN}
                </span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                 <div className="p-4 bg-slate-50 text-slate-600">
                    <p>{item.answer}</p>
                </div>
            </div>
        </div>
    );
};

const Destek: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const handleToggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Yardım & Destek</h2>
                <p className="text-slate-600">Sıkça karşılaşılan sorunlara çözümler ve destek iletişim bilgileri.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Sıkça Sorulan Sorular (SSS)</h3>
                <div className="space-y-2">
                    {faqData.map((item, index) => (
                        <FaqItem 
                            key={index}
                            item={item}
                            isOpen={openIndex === index}
                            onClick={() => handleToggle(index)}
                        />
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Teknik Destek</h3>
                <div className="flex items-start space-x-4">
                     <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </div>
                    <div>
                        <p className="text-slate-700">Yukarıdaki çözümler sorununuzu gidermediyse, lütfen sistem yöneticinizle iletişime geçin veya aşağıdaki e-posta adresine bir bildirim gönderin.</p>
                        <a href="mailto:destek@kafkasyadernegi.org" className="mt-2 inline-block text-lg font-semibold text-blue-600 hover:text-blue-800">
                            destek@kafkasyadernegi.org
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Destek;
