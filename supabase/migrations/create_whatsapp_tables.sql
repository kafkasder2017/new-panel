-- WhatsApp Business Integration Tables

-- WhatsApp Contacts Table
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    profile_picture TEXT,
    last_seen TIMESTAMP WITH TIME ZONE,
    is_online BOOLEAN DEFAULT false,
    is_blocked BOOLEAN DEFAULT false,
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Messages Table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'image', 'document', 'audio', 'video', 'location')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    media_url TEXT,
    file_name TEXT,
    file_size BIGINT,
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    location_address TEXT,
    reply_to UUID REFERENCES whatsapp_messages(id),
    is_starred BOOLEAN DEFAULT false,
    is_forwarded BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Templates Table
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('marketing', 'utility', 'authentication')),
    language VARCHAR(10) NOT NULL DEFAULT 'tr',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
    components JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Campaigns Table
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    template_id UUID NOT NULL REFERENCES whatsapp_templates(id) ON DELETE CASCADE,
    target_contacts UUID[] NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed')),
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Webhooks Table
CREATE TABLE IF NOT EXISTS whatsapp_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('message', 'status', 'contact')),
    data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Business Profile Table
CREATE TABLE IF NOT EXISTS whatsapp_business_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(255) NOT NULL,
    about TEXT,
    email VARCHAR(255),
    websites TEXT[],
    address_street TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    address_country TEXT,
    profile_picture_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Analytics Table
CREATE TABLE IF NOT EXISTS whatsapp_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period VARCHAR(10) NOT NULL CHECK (period IN ('day', 'week', 'month')),
    messages_sent INTEGER DEFAULT 0,
    messages_received INTEGER DEFAULT 0,
    messages_delivered INTEGER DEFAULT 0,
    messages_read INTEGER DEFAULT 0,
    messages_failed INTEGER DEFAULT 0,
    active_contacts INTEGER DEFAULT 0,
    new_contacts INTEGER DEFAULT 0,
    blocked_contacts INTEGER DEFAULT 0,
    template_messages_sent INTEGER DEFAULT 0,
    campaigns_sent INTEGER DEFAULT 0,
    average_response_time INTEGER DEFAULT 0, -- in seconds
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(period, date)
);

-- WhatsApp Settings Table
CREATE TABLE IF NOT EXISTS whatsapp_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id VARCHAR(255) NOT NULL,
    phone_number_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    webhook_url TEXT,
    webhook_token TEXT,
    is_active BOOLEAN DEFAULT false,
    auto_reply_enabled BOOLEAN DEFAULT false,
    auto_reply_message TEXT,
    working_hours_start TIME,
    working_hours_end TIME,
    working_hours_timezone VARCHAR(50) DEFAULT 'Europe/Istanbul',
    notifications_new_message BOOLEAN DEFAULT true,
    notifications_message_delivered BOOLEAN DEFAULT false,
    notifications_message_read BOOLEAN DEFAULT false,
    notifications_campaign_completed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone ON whatsapp_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_name ON whatsapp_contacts(name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact_id ON whatsapp_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status ON whatsapp_templates(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_status ON whatsapp_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_processed ON whatsapp_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_date ON whatsapp_analytics(date DESC);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_whatsapp_contacts_updated_at
    BEFORE UPDATE ON whatsapp_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at
    BEFORE UPDATE ON whatsapp_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_campaigns_updated_at
    BEFORE UPDATE ON whatsapp_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_business_profile_updated_at
    BEFORE UPDATE ON whatsapp_business_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_settings_updated_at
    BEFORE UPDATE ON whatsapp_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_business_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow authenticated users to access all WhatsApp data
CREATE POLICY "Allow authenticated users to access whatsapp_contacts" ON whatsapp_contacts
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access whatsapp_messages" ON whatsapp_messages
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access whatsapp_templates" ON whatsapp_templates
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access whatsapp_campaigns" ON whatsapp_campaigns
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access whatsapp_webhooks" ON whatsapp_webhooks
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access whatsapp_business_profile" ON whatsapp_business_profile
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access whatsapp_analytics" ON whatsapp_analytics
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access whatsapp_settings" ON whatsapp_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert some sample data for testing
INSERT INTO whatsapp_contacts (name, phone, notes) VALUES
    ('Ahmet Yılmaz', '+905551234567', 'Düzenli bağışçı'),
    ('Fatma Kaya', '+905559876543', 'Gönüllü koordinatörü'),
    ('Mehmet Demir', '+905555555555', 'Yardım başvurusu sahibi')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO whatsapp_templates (name, category, language, status, components) VALUES
    ('Hoş Geldin Mesajı', 'utility', 'tr', 'approved', 
     '[{"type": "body", "text": "Merhaba {{1}}, Kafkasder ailesine hoş geldiniz! Size nasıl yardımcı olabiliriz?"}]'::jsonb),
    ('Yardım Onayı', 'utility', 'tr', 'approved',
     '[{"type": "body", "text": "Sayın {{1}}, yardım başvurunuz onaylanmıştır. Detaylar için lütfen derneğimizi arayınız."}]'::jsonb),
    ('Etkinlik Duyurusu', 'marketing', 'tr', 'approved',
     '[{"type": "header", "format": "text", "text": "Etkinlik Duyurusu"}, {"type": "body", "text": "{{1}} tarihinde {{2}} etkinliğimiz var. Katılım için kayıt yaptırabilirsiniz."}]'::jsonb)
ON CONFLICT (name) DO NOTHING;