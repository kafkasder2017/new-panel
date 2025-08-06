-- WhatsApp Business API entegrasyonu için gerekli tablolar
-- Bu dosya WhatsApp mesajlaşma, kişi yönetimi ve şablon sistemi için tablolar oluşturur

-- WhatsApp kişiler tablosu
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    profile_name VARCHAR(255),
    wa_id VARCHAR(50), -- WhatsApp ID
    person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    is_business BOOLEAN DEFAULT false,
    business_description TEXT,
    status VARCHAR(20) DEFAULT 'active', -- active, blocked, deleted
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- WhatsApp mesaj şablonları tablosu
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    language VARCHAR(10) DEFAULT 'tr',
    category VARCHAR(50) NOT NULL, -- UTILITY, MARKETING, AUTHENTICATION
    header_type VARCHAR(20), -- TEXT, IMAGE, VIDEO, DOCUMENT
    header_text TEXT,
    header_media_url TEXT,
    body_text TEXT NOT NULL,
    footer_text TEXT,
    buttons JSONB, -- Buton bilgileri JSON formatında
    variables JSONB, -- Değişken bilgileri
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    template_id VARCHAR(255), -- WhatsApp'tan gelen template ID
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- WhatsApp mesajlar tablosu
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wa_message_id VARCHAR(255) UNIQUE, -- WhatsApp'tan gelen mesaj ID
    contact_id UUID REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
    direction VARCHAR(10) NOT NULL, -- inbound, outbound
    message_type VARCHAR(20) NOT NULL, -- text, image, video, audio, document, template, interactive
    content TEXT,
    media_url TEXT,
    media_type VARCHAR(50),
    media_caption TEXT,
    template_variables JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, read, failed
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- WhatsApp kampanyalar tablosu
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
    target_audience JSONB, -- Hedef kitle kriterleri
    scheduled_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, running, completed, cancelled
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- WhatsApp kampanya alıcıları tablosu
CREATE TABLE IF NOT EXISTS whatsapp_campaign_recipients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES whatsapp_campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
    message_id UUID REFERENCES whatsapp_messages(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, read, failed
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp webhook olayları tablosu
CREATE TABLE IF NOT EXISTS whatsapp_webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    webhook_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone ON whatsapp_contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_person ON whatsapp_contacts(person_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact ON whatsapp_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_status ON whatsapp_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhook_events_processed ON whatsapp_webhook_events(processed, created_at);

-- RLS (Row Level Security) politikaları
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS politikaları - authenticated kullanıcılar için tam erişim
CREATE POLICY "whatsapp_contacts_policy" ON whatsapp_contacts
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "whatsapp_templates_policy" ON whatsapp_templates
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "whatsapp_messages_policy" ON whatsapp_messages
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "whatsapp_campaigns_policy" ON whatsapp_campaigns
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "whatsapp_campaign_recipients_policy" ON whatsapp_campaign_recipients
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "whatsapp_webhook_events_policy" ON whatsapp_webhook_events
    FOR ALL USING (auth.role() = 'authenticated');

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger'ları
CREATE TRIGGER whatsapp_contacts_updated_at
    BEFORE UPDATE ON whatsapp_contacts
    FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER whatsapp_templates_updated_at
    BEFORE UPDATE ON whatsapp_templates
    FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER whatsapp_messages_updated_at
    BEFORE UPDATE ON whatsapp_messages
    FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER whatsapp_campaigns_updated_at
    BEFORE UPDATE ON whatsapp_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

-- İzinler
GRANT ALL PRIVILEGES ON whatsapp_contacts TO authenticated;
GRANT ALL PRIVILEGES ON whatsapp_templates TO authenticated;
GRANT ALL PRIVILEGES ON whatsapp_messages TO authenticated;
GRANT ALL PRIVILEGES ON whatsapp_campaigns TO authenticated;
GRANT ALL PRIVILEGES ON whatsapp_campaign_recipients TO authenticated;
GRANT ALL PRIVILEGES ON whatsapp_webhook_events TO authenticated;

GRANT SELECT ON whatsapp_contacts TO anon;
GRANT SELECT ON whatsapp_templates TO anon;
GRANT SELECT ON whatsapp_messages TO anon;
GRANT SELECT ON whatsapp_campaigns TO anon;
GRANT SELECT ON whatsapp_campaign_recipients TO anon;
GRANT SELECT ON whatsapp_webhook_events TO anon;

-- Başlangıç verileri - Örnek şablonlar
INSERT INTO whatsapp_templates (name, language, category, body_text, status, is_active) VALUES
('hosgeldin_mesaji', 'tr', 'UTILITY', 'Merhaba {{1}}, KAFKASDER ailesine hoş geldiniz! Size nasıl yardımcı olabiliriz?', 'approved', true),
('yardim_onay', 'tr', 'UTILITY', 'Sayın {{1}}, yardım başvurunuz onaylanmıştır. Detaylar için lütfen ofisimizi arayınız.', 'approved', true),
('etkinlik_davet', 'tr', 'MARKETING', 'Merhaba {{1}}, {{2}} tarihinde düzenlenecek {{3}} etkinliğimize davetlisiniz. Katılım için lütfen yanıtlayın.', 'approved', true);

COMMIT