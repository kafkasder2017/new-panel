-- AI Chatbot için gerekli tablolar

-- Chatbot ayarları tablosu
CREATE TABLE chatbot_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    welcome_message TEXT DEFAULT 'Merhaba! Size nasıl yardımcı olabilirim?',
    fallback_message TEXT DEFAULT 'Üzgünüm, bu konuda size yardımcı olamıyorum. Lütfen bir operatörle görüşmek için bekleyin.',
    max_response_length INTEGER DEFAULT 500,
    response_delay_ms INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatbot konuşmaları tablosu
CREATE TABLE chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'transferred')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    total_messages INTEGER DEFAULT 0,
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatbot mesajları tablosu
CREATE TABLE chatbot_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'bot', 'operator')),
    message_text TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'quick_reply', 'button')),
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatbot bilgi bankası tablosu
CREATE TABLE chatbot_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT[], -- Arama için anahtar kelimeler
    priority INTEGER DEFAULT 1, -- Yüksek öncelik = daha önemli
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatbot hızlı yanıtlar tablosu
CREATE TABLE chatbot_quick_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(255),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatbot analitik tablosu
CREATE TABLE chatbot_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    satisfaction_avg DECIMAL(3,2),
    resolved_by_bot INTEGER DEFAULT 0,
    transferred_to_operator INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
CREATE INDEX idx_chatbot_conversations_session_id ON chatbot_conversations(session_id);
CREATE INDEX idx_chatbot_conversations_status ON chatbot_conversations(status);
CREATE INDEX idx_chatbot_messages_conversation_id ON chatbot_messages(conversation_id);
CREATE INDEX idx_chatbot_messages_created_at ON chatbot_messages(created_at);
CREATE INDEX idx_chatbot_knowledge_base_keywords ON chatbot_knowledge_base USING GIN(keywords);
CREATE INDEX idx_chatbot_knowledge_base_category ON chatbot_knowledge_base(category);
CREATE INDEX idx_chatbot_analytics_date ON chatbot_analytics(date);

-- RLS (Row Level Security) politikaları
ALTER TABLE chatbot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_analytics ENABLE ROW LEVEL SECURITY;

-- Chatbot ayarları için politikalar
CREATE POLICY "Chatbot settings are viewable by authenticated users" ON chatbot_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Chatbot settings are editable by authenticated users" ON chatbot_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Konuşmalar için politikalar
CREATE POLICY "Users can view their own conversations" ON chatbot_conversations
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can create their own conversations" ON chatbot_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON chatbot_conversations
    FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Mesajlar için politikalar
CREATE POLICY "Users can view messages from their conversations" ON chatbot_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chatbot_conversations 
            WHERE id = conversation_id 
            AND (user_id = auth.uid() OR auth.role() = 'service_role')
        )
    );

CREATE POLICY "Users can create messages in their conversations" ON chatbot_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chatbot_conversations 
            WHERE id = conversation_id 
            AND (user_id = auth.uid() OR auth.role() = 'service_role')
        )
    );

-- Bilgi bankası için politikalar
CREATE POLICY "Knowledge base is viewable by authenticated users" ON chatbot_knowledge_base
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Knowledge base is editable by authenticated users" ON chatbot_knowledge_base
    FOR ALL USING (auth.role() = 'authenticated');

-- Hızlı yanıtlar için politikalar
CREATE POLICY "Quick replies are viewable by authenticated users" ON chatbot_quick_replies
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Quick replies are editable by authenticated users" ON chatbot_quick_replies
    FOR ALL USING (auth.role() = 'authenticated');

-- Analitik için politikalar
CREATE POLICY "Analytics are viewable by authenticated users" ON chatbot_analytics
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Analytics are editable by service role" ON chatbot_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_chatbot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger'ları
CREATE TRIGGER update_chatbot_settings_updated_at
    BEFORE UPDATE ON chatbot_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_chatbot_updated_at();

CREATE TRIGGER update_chatbot_conversations_updated_at
    BEFORE UPDATE ON chatbot_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_chatbot_updated_at();

CREATE TRIGGER update_chatbot_knowledge_base_updated_at
    BEFORE UPDATE ON chatbot_knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_chatbot_updated_at();

-- Konuşma mesaj sayısını güncelleyen trigger
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE chatbot_conversations 
        SET total_messages = total_messages + 1,
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE chatbot_conversations 
        SET total_messages = total_messages - 1,
            updated_at = NOW()
        WHERE id = OLD.conversation_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_message_count_trigger
    AFTER INSERT OR DELETE ON chatbot_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_message_count();

-- Bilgi bankası kullanım sayısını artıran trigger
CREATE OR REPLACE FUNCTION increment_knowledge_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Bot mesajı ise ve metadata'da knowledge_base_id varsa
    IF NEW.sender_type = 'bot' AND NEW.metadata ? 'knowledge_base_id' THEN
        UPDATE chatbot_knowledge_base 
        SET usage_count = usage_count + 1
        WHERE id = (NEW.metadata->>'knowledge_base_id')::UUID;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_knowledge_usage_trigger
    AFTER INSERT ON chatbot_messages
    FOR EACH ROW
    EXECUTE FUNCTION increment_knowledge_usage();

-- Varsayılan chatbot ayarları
INSERT INTO chatbot_settings (name, description, welcome_message, fallback_message) VALUES (
    'Varsayılan Chatbot',
    'KAFKASDER için varsayılan AI chatbot ayarları',
    'Merhaba! KAFKASDER AI asistanıyım. Size nasıl yardımcı olabilirim? Bağış, üyelik, projeler hakkında sorularınızı yanıtlayabilirim.',
    'Üzgünüm, bu konuda size tam olarak yardımcı olamıyorum. Daha detaylı bilgi için lütfen bir operatörümüzle görüşün veya web sitemizi ziyaret edin.'
);

-- Örnek bilgi bankası verileri
INSERT INTO chatbot_knowledge_base (category, question, answer, keywords) VALUES 
('Bağış', 'Nasıl bağış yapabilirim?', 'Bağış yapmak için web sitemizin "Bağış Yap" bölümünü kullanabilir, banka havalesi yapabilir veya kapıda nakit bağış verebilirsiniz. Tüm bağışlarınız için makbuz düzenlenmektedir.', ARRAY['bağış', 'yardım', 'para', 'makbuz']),
('Üyelik', 'Nasıl üye olabilirim?', 'KAFKASDER''e üye olmak için web sitemizden üyelik formunu doldurabilir veya ofisimize gelerek başvuru yapabilirsiniz. Üyelik ücretsizdir.', ARRAY['üyelik', 'kayıt', 'başvuru', 'form']),
('Projeler', 'Hangi projeleri destekliyorsunuz?', 'Eğitim, sağlık, sosyal yardım ve kültürel projeler olmak üzere birçok alanda çalışmalar yürütüyoruz. Detaylı bilgi için projeler sayfamızı ziyaret edebilirsiniz.', ARRAY['proje', 'eğitim', 'sağlık', 'sosyal', 'kültür']),
('İletişim', 'Size nasıl ulaşabilirim?', 'Bize telefon, e-posta veya web sitemizden ulaşabilirsiniz. Ofis saatlerimiz Pazartesi-Cuma 09:00-17:00 arası, Cumartesi 09:00-13:00 arasıdır.', ARRAY['iletişim', 'telefon', 'email', 'adres', 'saat']);

-- Örnek hızlı yanıtlar
INSERT INTO chatbot_quick_replies (title, message, category, order_index) VALUES 
('Bağış Yap', 'Bağış yapmak istiyorum', 'Bağış', 1),
('Üye Ol', 'KAFKASDER''e üye olmak istiyorum', 'Üyelik', 2),
('Projeler', 'Desteklediğiniz projeleri öğrenmek istiyorum', 'Projeler', 3),
('İletişim', 'İletişim bilgilerinizi öğrenmek istiyorum', 'İletişim', 4),
('Operatör', 'Bir operatörle görüşmek istiyorum', 'Destek', 5);