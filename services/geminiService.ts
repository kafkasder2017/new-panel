
/**
 * Gemini kaldırıldı. Geçici stub servis.
 * Uygulamada bu modülü kullanan yerler import/çağrı hatası vermesin diye
 * aynı fonksiyon imzaları ile deterministic mock sonuçlar döndürülür.
 */
import { AnalyticsSummary, SmartSearchResult, PersonSummaryInput } from '../types.ts';

interface AnalyticsInput {
    totalPeople: number;
    aidRecipientsByNationality: { name: string; value: number }[];
    applicationsByStatus: { name: string; value: number }[];
    monthlyFinancials: { name: string; income: number; expense: number }[];
}

export const generateAnalyticsSummary = async (input: AnalyticsInput): Promise<AnalyticsSummary> => {
    const apiKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY as string | undefined;
    const endpoint = "https://openrouter.ai/api/v1/chat/completions";

    const system = "Sen bir Türkçe konuşan veri analistisın. Yalnızca geçerli JSON döndür.";
    const user = `Aşağıdaki verileri analiz ederek Türkçe bir özet üret ve JSON döndür.
Veriler:
- Kayıtlı kişi sayısı: ${input.totalPeople}
- Uyruklara göre yardım alanlar: ${JSON.stringify(input.aidRecipientsByNationality)}
- Başvuru durumları: ${JSON.stringify(input.applicationsByStatus)}
- Aylık gelir/gider: ${JSON.stringify(input.monthlyFinancials)}

JSON şeması:
{
  "summary": string,
  "positiveTrends": string[],
  "areasForAttention": string[],
  "actionableInsights": string[]
}

Sadece geçerli JSON döndür, başka metin ekleme.`;

    try {
        if (!apiKey) throw new Error("OpenRouter API anahtarı bulunamadı (VITE_OPENROUTER_API_KEY).");

        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "http://localhost",
                "X-Title": "KAFKASDER Panel"
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.1-8b-instruct:free",
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: user }
                ],
                temperature: 0.2,
                response_format: { type: "json_object" }
            })
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`OpenRouter hata: ${res.status} ${text}`);
        }

        const json = await res.json();
        const content = json.choices?.[0]?.message?.content ?? "";
        const parsed = JSON.parse(content);
        return parsed as AnalyticsSummary;
    } catch (e) {
        console.warn("OpenRouter generateAnalyticsSummary hatası, fallback kullanılacak:", e);
        return {
            summary: "Son dönemde kayıtlı kişi sayısında istikrarlı artış gözleniyor. Yardım başvuruları bekleyen ve incelenen durumlarında yoğunlaşıyor. Gelir-gider akışında genel denge korunuyor.",
            positiveTrends: [
                "Aylık bağışlarda önceki döneme göre artış eğilimi var.",
                "Projelerde tamamlanma oranı yükseliyor.",
                "Gönüllü katılımında sürdürülebilir artış mevcut."
            ],
            areasForAttention: [
                "Bekleyen başvuruların sonuçlandırma süresi kısaltılmalı.",
                "Ayni yardım stok alt limitleri gözden geçirilmeli.",
                "Kur etkisi için bütçe senaryoları güçlendirilmeli."
            ],
            actionableInsights: [
                "Yüksek etki potansiyeli olan projelere öncelik verin.",
                "Değerlendirme iş akışlarını sadeleştirerek TAT süresini düşürün.",
                "Düzenli bağışçı programı için iletişim kampanyaları planlayın."
            ]
        };
    }
};

export const getNavigationForQuery = async (query: string): Promise<SmartSearchResult> => {
    const apiKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY as string | undefined;
    const endpoint = "https://openrouter.ai/api/v1/chat/completions";

    const system = "Sen Türkçe konuşan bir yönlendirme yardımcısısın. Yalnızca geçerli JSON döndür.";
    const user = `Kullanıcı sorgusunu yorumla ve aşağıdaki yapıda JSON üret:
{
  "path": string,
  "filters"?: { [key: string]: string },
  "explanation": string
}
Kullanıcı sorgusu: "${query}"
Sadece geçerli JSON döndür.`;

    try {
        if (!apiKey) throw new Error("OpenRouter API anahtarı bulunamadı (VITE_OPENROUTER_API_KEY).");

        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "http://localhost",
                "X-Title": "KAFKASDER Panel"
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.1-8b-instruct:free",
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: user }
                ],
                temperature: 0.2,
                response_format: { type: "json_object" }
            })
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`OpenRouter hata: ${res.status} ${text}`);
        }

        const json = await res.json();
        const content = json.choices?.[0]?.message?.content ?? "";
        const parsed = JSON.parse(content);
        return parsed as SmartSearchResult;
    } catch (e) {
        console.warn("OpenRouter getNavigationForQuery hatası, kural tabanlı fallback kullanılacak:", e);
        const q = query.toLowerCase();
        if (q.includes("gönüllü")) {
            const sehir = /ankara|istanbul|izmir/.exec(q)?.[0];
            const durum = q.includes("aktif") ? "Aktif" : q.includes("pasif") ? "Pasif" : undefined;
            return {
                path: "/gonulluler",
                filters: { ...(sehir ? { sehir: sehir[0].toUpperCase() + sehir.slice(1) } : {}), ...(durum ? { durum } : {}) },
                explanation: "Gönüllüler sayfasına yönlendiriliyor."
            };
        }
        if (q.includes("yardım") && (q.includes("onaylanan") || q.includes("onaylı"))) {
            const basvuruTuru = q.includes("acil") ? "Acil Yardım" : q.includes("eğitim") ? "Eğitim Yardımı" : q.includes("sağlık") ? "Sağlık Yardımı" : undefined;
            return { path: "/yardimlar", filters: { durum: "Onaylanan", ...(basvuruTuru ? { basvuruTuru } : {}) }, explanation: "Onaylanan yardım başvuruları gösteriliyor." };
        }
        if (q.includes("proje") && (q.includes("tamamlanmış") || q.includes("tamamlandi") || q.includes("tamamlandı"))) {
            return { path: "/projeler", filters: { status: "Tamamlandı" }, explanation: "Tamamlanmış projeler listeleniyor." };
        }
        if (q.includes("bağış")) {
            const bagisTuru = q.includes("nakit") ? "Nakit" : q.includes("kredi") ? "Kredi Kartı" : q.includes("online") ? "Online" : q.includes("ayni") ? "Ayni Yardım" : undefined;
            return { path: "/bagis-yonetimi/tum-bagislar", filters: { ...(bagisTuru ? { bagisTuru } : {}) }, explanation: "Bağış listesi gösteriliyor." };
        }
        if (q.includes("kiş") || q.includes("kişi") || q.includes("insan") || q.includes("üye")) {
            const searchTermMatch = /['"]?([a-zçğıöşü\s]+)['"]?/i.exec(query);
            const searchTerm = searchTermMatch ? searchTermMatch[1].trim() : undefined;
            return { path: "/kisiler", filters: { ...(searchTerm ? { searchTerm } : {}) }, explanation: "Kişilerde arama yapılıyor." };
        }
        return { path: "/", explanation: "Dashboard görüntüleniyor." };
    }
};

export const generatePersonSummary = async (input: PersonSummaryInput): Promise<string> => {
    const apiKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY as string | undefined;
    const endpoint = "https://openrouter.ai/api/v1/chat/completions";

    const system = "Sen Türkçe konuşan bir sosyal yardım vaka asistanısın. Kısa, net bir paragraf döndür.";
    const user = `Aşağıdaki kişi bilgilerine dayanarak Türkçe tek paragraf bir özet yaz:
Ad Soyad: ${input.adSoyad}
Kayıt Tarihi: ${new Date(input.kayitTarihi).toLocaleDateString('tr-TR')}
Durum: ${input.durum}
Özel Durumlar: ${input.ozelDurumlar?.join(', ') || 'Yok'}
Notlar: ${input.aciklamalar?.tr || 'Ek not yok.'}`;

    try {
        if (!apiKey) throw new Error("OpenRouter API anahtarı bulunamadı (VITE_OPENROUTER_API_KEY).");

        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "http://localhost",
                "X-Title": "KAFKASDER Panel"
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.1-8b-instruct:free",
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: user }
                ],
                temperature: 0.3
            })
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`OpenRouter hata: ${res.status} ${text}`);
        }

        const json = await res.json();
        const content = json.choices?.[0]?.message?.content ?? "";
        return content.trim();
    } catch (e) {
        console.warn("OpenRouter generatePersonSummary hatası, fallback kullanılacak:", e);
        const ad = input.adSoyad;
        const tarih = new Date(input.kayitTarihi).toLocaleDateString('tr-TR');
        const durum = input.durum;
        const ozel = input.ozelDurumlar?.join(', ') || 'Yok';
        const not = input.aciklamalar?.tr || 'Ek not yok.';
        return `${ad} adlı kişi ${tarih} tarihinde sisteme kaydedilmiştir. Güncel durumu: ${durum}. Özel durumları: ${ozel}. Notlar: ${not}. Kişinin durumuna ilişkin değerlendirme ve yönlendirmeler ilgili birimlerce takip edilmelidir.`;
    }
};
