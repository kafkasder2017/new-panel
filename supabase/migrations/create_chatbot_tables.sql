-- AI Chatbot için temel altyapı tabloları

-- Chatbot konuşmaları tablosu
CREATE TABLE chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    title VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    context JSONB DEFAULT '{}', -- Konuşma bağlamı ve metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Chatbot mesajları tablosu
CREATE TABLE chatbot_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- Token sayısı, model bilgisi vb.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatbot yanıt şablonları tablosu
CREATE TABLE chatbot_response_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    template TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- Şablonda kullanılacak değişkenler
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatbot ayarları tablosu
CREATE TABLE chatbot_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
CREATE INDEX idx_chatbot_conversations_person_id ON chatbot_conversations(person_id);
CREATE INDEX idx_chatbot_conversations_status ON chatbot_conversations(status);
CREATE INDEX idx_chatbot_conversations_created_at ON chatbot_conversations(created_at);

CREATE INDEX idx_chatbot_messages_conversation_id ON chatbot_messages(conversation_id);
CREATE INDEX idx_chatbot_messages_role ON chatbot_messages(role);
CREATE INDEX idx_chatbot_messages_created_at ON chatbot_messages(created_at);

CREATE INDEX idx_chatbot_response_templates_category ON chatbot_response_templates(category);
CREATE INDEX idx_chatbot_response_templates_is_active ON chatbot_response_templates(is_active);

CREATE INDEX idx_chatbot_settings_key ON chatbot_settings(key);

-- RLS (Row Level Security) politikaları
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_settings ENABLE ROW LEVEL SECURITY;

-- Chatbot konuşmaları için RLS politikaları
CREATE POLICY "Users can view their own conversations" ON chatbot_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" ON chatbot_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON chatbot_conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON chatbot_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Chatbot mesajları için RLS politikaları
CREATE POLICY "Users can view messages from their conversations" ON chatbot_messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM chatbot_conversations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their conversations" ON chatbot_messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM chatbot_conversations WHERE user_id = auth.uid()
        )
    );

-- Yanıt şablonları için RLS politikaları (tüm kullanıcılar okuyabilir)
CREATE POLICY "All authenticated users can view active templates" ON chatbot_response_templates
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Chatbot ayarları için RLS politikaları (tüm kullanıcılar okuyabilir)
CREATE POLICY "All authenticated users can view settings" ON chatbot_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- updated_at trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at trigger'ları
CREATE TRIGGER update_chatbot_conversations_updated_at
    BEFORE UPDATE ON chatbot_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chatbot_response_templates_updated_at
    BEFORE UPDATE ON chatbot_response_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chatbot_settings_updated_at
    BEFORE UPDATE ON chatbot_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Başlangıç verileri
INSERT INTO chatbot_settings (key, value, description) VALUES
('ai_model', '"gpt-3.5-turbo"', 'Kullanılacak AI modeli'),
('max_tokens', '1000', 'Maksimum token sayısı'),
('temperature', '0.7', 'AI yanıt çeşitliliği (0-1 arası)'),
('system_prompt', '"Sen Kafkasder Derneğinin yardım süreçlerinde kullanıcılara destek olan bir asistansın. Yardım başvuruları, kişi bilgileri ve dernek faaliyetleri hakkında bilgi verebilirsin."', 'Sistem prompt mesajı'),
('max_conversation_length', '50', 'Bir konuşmada maksimum mesaj sayısı'),
('auto_close_after_hours', '24', 'Konuşmaların otomatik kapanma süresi (saat)');

INSERT INTO chatbot_response_templates (name, category, template, variables) VALUES
('Hoş Geldin Mesajı', 'greeting', 'Merhaba! Kafkasder Derneği asistanıyım. Size nasıl yardımcı olabilirim?', '[]'),
('Yardım Başvurusu Bilgi', 'help', 'Yardım başvurusu yapmak için {{person_name}} adlı kişi için gerekli bilgileri toplayabilirim. Hangi tür yardıma ihtiyacınız var?', '["person_name"]'),
('Başvuru Durumu', 'status', 'Başvuru numarası {{application_id}} olan başvurunuzun durumu: {{status}}. {{additional_info}}', '["application_id", "status", "additional_info"]'),
('Genel Bilgi', 'info', 'Kafkasder Derneği olarak {{service_type}} konusunda hizmet vermekteyiz. Daha detaylı bilgi için lütfen {{contact_info}} ile iletişime geçin.', '["service_type", "contact_info"]'),
('Hata Mesajı', 'error', 'Üzgünüm, şu anda bu konuda size yardımcı olamıyorum. Lütfen daha sonra tekrar deneyin veya {{contact_info}} ile iletişime geçin.', '["contact_info"]');

-- Tablolara erişim izinleri
GRANT SELECT, INSERT, UPDATE, DELETE ON chatbot_conversations TO authenticated;
GRANT SELECT, INSERT ON chatbot_messages TO authenticated;
GRANT SELECT ON chatbot_response_templates TO authenticated;
GRANT SELECT ON chatbot_settings TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON chatbot_conversations TO anon;
GRANT SELECT, INSERT ON chatbot_messages TO anon;
GRANT SELECT ON chatbot_response_templates TO anon;
GRANT SELECT ON chatbot_settings TO anon;