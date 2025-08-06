-- KAFKASDER Eksik Tablolar - Orta Öncelik (Basitleştirilmiş)
-- Bu migration dosyası orta öncelikli eksik tabloları oluşturur
-- NOT: notifications tablosu zaten mevcut, atlanıyor

-- 2. Sistem logları (Activity Logs)
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Dosya yükleme sistemi
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- 'person', 'project', 'financial', 'aid'
    entity_id UUID,
    is_public BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Şifre sıfırlama istekleri
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Sistem ayarları
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'STRING', -- 'STRING', 'NUMBER', 'BOOLEAN', 'JSON'
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. E-posta şablonları
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    variables JSONB, -- Şablonda kullanılabilecek değişkenler
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SMS şablonları
CREATE TABLE IF NOT EXISTS sms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100) UNIQUE NOT NULL,
    message_text TEXT NOT NULL,
    variables JSONB, -- Şablonda kullanılabilecek değişkenler
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Mesaj kuyruğu
CREATE TABLE IF NOT EXISTS message_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_type VARCHAR(20) NOT NULL, -- 'EMAIL', 'SMS'
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'FAILED', 'CANCELLED'
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler (notifications atlandı)

CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_file_uploads_entity ON file_uploads(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_requests(reset_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_requests(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_requests(expires_at);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public);

CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_sms_templates_name ON sms_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_sms_templates_active ON sms_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_message_queue_status ON message_queue(status);
CREATE INDEX IF NOT EXISTS idx_message_queue_scheduled ON message_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_message_queue_type ON message_queue(message_type);

-- Updated_at triggerları
DO $$
BEGIN
    -- notifications trigger atlandı
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_file_uploads_updated_at_v2') THEN
        CREATE TRIGGER update_file_uploads_updated_at_v2 BEFORE UPDATE ON file_uploads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_settings_updated_at_v2') THEN
        CREATE TRIGGER update_system_settings_updated_at_v2 BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_email_templates_updated_at_v2') THEN
        CREATE TRIGGER update_email_templates_updated_at_v2 BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sms_templates_updated_at_v2') THEN
        CREATE TRIGGER update_sms_templates_updated_at_v2 BEFORE UPDATE ON sms_templates FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_message_queue_updated_at_v2') THEN
        CREATE TRIGGER update_message_queue_updated_at_v2 BEFORE UPDATE ON message_queue FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

-- RLS (Row Level Security) politikaları (notifications atlandı)
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;

-- RLS politikaları - Basitleştirilmiş (notifications atlandı)
CREATE POLICY "Enable all operations for authenticated users" ON activity_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON file_uploads FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON password_reset_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON system_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON email_templates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON sms_templates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON message_queue FOR ALL USING (auth.role() = 'authenticated');

-- Anon kullanıcılar için özel politikalar
CREATE POLICY "Enable insert for password reset" ON password_reset_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read for public settings" ON system_settings FOR SELECT USING (is_public = true);

-- Tablolara erişim izinleri (notifications atlandı)
GRANT ALL PRIVILEGES ON activity_logs TO authenticated;
GRANT ALL PRIVILEGES ON file_uploads TO authenticated;
GRANT ALL PRIVILEGES ON password_reset_requests TO authenticated;
GRANT ALL PRIVILEGES ON system_settings TO authenticated;
GRANT ALL PRIVILEGES ON email_templates TO authenticated;
GRANT ALL PRIVILEGES ON sms_templates TO authenticated;
GRANT ALL PRIVILEGES ON message_queue TO authenticated;

-- notifications anon izni atlandı
GRANT SELECT ON activity_logs TO anon;
GRANT SELECT ON file_uploads TO anon;
GRANT INSERT ON password_reset_requests TO anon;
GRANT SELECT ON system_settings TO anon;
GRANT SELECT ON email_templates TO anon;
GRANT SELECT ON sms_templates TO anon;
GRANT SELECT ON message_queue TO anon;

-- Başlangıç verileri
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('app_name', 'KAFKASDER', 'STRING', 'Uygulama adı', true),
('app_version', '1.0.0', 'STRING', 'Uygulama versiyonu', true),
('maintenance_mode', 'false', 'BOOLEAN', 'Bakım modu durumu', false),
('max_file_size', '10485760', 'NUMBER', 'Maksimum dosya boyutu (bytes)', false),
('allowed_file_types', '["pdf","doc","docx","jpg","jpeg","png"]', 'JSON', 'İzin verilen dosya türleri', false)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO email_templates (template_name, subject, body_html, body_text, variables, is_active) VALUES
('welcome', 'Hoş Geldiniz', '<h1>Hoş Geldiniz {{name}}</h1><p>Sisteme başarıyla kaydoldunuz.</p>', 'Hoş Geldiniz {{name}}\n\nSisteme başarıyla kaydoldunuz.', '{"name": "Kullanıcı adı"}', true),
('password_reset', 'Şifre Sıfırlama', '<h1>Şifre Sıfırlama</h1><p>Şifrenizi sıfırlamak için <a href="{{reset_link}}">buraya tıklayın</a></p>', 'Şifre Sıfırlama\n\nŞifrenizi sıfırlamak için şu linke tıklayın: {{reset_link}}', '{"reset_link": "Sıfırlama linki"}', true)
ON CONFLICT (template_name) DO NOTHING;

INSERT INTO sms_templates (template_name, message_text, variables, is_active) VALUES
('verification_code', 'Doğrulama kodunuz: {{code}}', '{"code": "Doğrulama kodu"}', true),
('password_reset_sms', 'Şifre sıfırlama kodunuz: {{code}}', '{"code": "Sıfırlama kodu"}', true)
ON CONFLICT (template_name) DO NOTHING;