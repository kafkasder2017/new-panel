-- Authentication ve Security Tabloları Migration
-- Bu dosya kullanıcı oturum takibi, güvenlik ve 2FA için gerekli tabloları oluşturur

-- 1. Kullanıcı Oturum Takibi
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_time TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    session_duration_minutes INTEGER,
    location_info JSONB, -- Coğrafi konum bilgisi
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Başarısız Giriş Denemeleri
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    attempt_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    failure_reason VARCHAR(100), -- 'WRONG_PASSWORD', 'USER_NOT_FOUND', 'ACCOUNT_LOCKED'
    location_info JSONB,
    blocked_until TIMESTAMP WITH TIME ZONE, -- Geçici blokaj süresi
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Şifre Sıfırlama İstekleri
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. İki Faktörlü Kimlik Doğrulama (2FA)
CREATE TABLE IF NOT EXISTS user_2fa_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    is_enabled BOOLEAN DEFAULT false,
    secret_key VARCHAR(255), -- TOTP secret key (encrypted)
    backup_codes TEXT[], -- Yedek kodlar (encrypted)
    phone_number VARCHAR(20), -- SMS için
    preferred_method VARCHAR(20) DEFAULT 'TOTP', -- 'TOTP', 'SMS', 'EMAIL'
    last_used_at TIMESTAMP WITH TIME ZONE,
    setup_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 2FA Doğrulama Logları
CREATE TABLE IF NOT EXISTS user_2fa_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_method VARCHAR(20) NOT NULL, -- 'TOTP', 'SMS', 'EMAIL', 'BACKUP_CODE'
    verification_code VARCHAR(10),
    is_successful BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 6. Güvenlik Olayları ve Audit Log
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', '2FA_ENABLED', 'SUSPICIOUS_ACTIVITY'
    event_description TEXT,
    severity VARCHAR(20) DEFAULT 'INFO', -- 'INFO', 'WARNING', 'CRITICAL'
    ip_address INET,
    user_agent TEXT,
    location_info JSONB,
    metadata JSONB, -- Ek bilgiler
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Güvenilir Cihazlar
CREATE TABLE IF NOT EXISTS trusted_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50), -- 'DESKTOP', 'MOBILE', 'TABLET'
    browser_info JSONB,
    ip_address INET,
    is_trusted BOOLEAN DEFAULT false,
    trusted_at TIMESTAMP WITH TIME ZONE,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Güven süresi
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. API Anahtarları ve Token Yönetimi
CREATE TABLE IF NOT EXISTS api_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token_name VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) UNIQUE NOT NULL, -- Hashed token
    permissions JSONB, -- Token izinleri
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_failed_login_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_time ON failed_login_attempts(attempt_time);

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_requests(reset_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_requests(expires_at);

CREATE INDEX IF NOT EXISTS idx_2fa_settings_user ON user_2fa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_verifications_user ON user_2fa_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_verifications_time ON user_2fa_verifications(attempted_at);

CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_time ON security_events(created_at);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);

CREATE INDEX IF NOT EXISTS idx_api_tokens_user ON api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_hash ON api_tokens(token_hash);

-- RLS (Row Level Security) Politikaları
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_2fa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_2fa_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları

-- user_sessions: Kullanıcılar sadece kendi oturumlarını görebilir
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- failed_login_attempts: Sadece sistem tarafından yazılabilir, kullanıcılar okuyamaz
CREATE POLICY "System can manage failed login attempts" ON failed_login_attempts
    FOR ALL USING (false); -- Kullanıcılar erişemez, sadece sistem

-- password_reset_requests: Kullanıcılar sadece kendi isteklerini görebilir
CREATE POLICY "Users can view own password reset requests" ON password_reset_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own password reset requests" ON password_reset_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_2fa_settings: Kullanıcılar sadece kendi 2FA ayarlarını yönetebilir
CREATE POLICY "Users can manage own 2FA settings" ON user_2fa_settings
    FOR ALL USING (auth.uid() = user_id);

-- user_2fa_verifications: Kullanıcılar sadece kendi doğrulama loglarını görebilir
CREATE POLICY "Users can view own 2FA verifications" ON user_2fa_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2FA verifications" ON user_2fa_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- security_events: Kullanıcılar sadece kendi güvenlik olaylarını görebilir
CREATE POLICY "Users can view own security events" ON security_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert security events" ON security_events
    FOR INSERT WITH CHECK (true); -- Sistem her zaman ekleyebilir

-- trusted_devices: Kullanıcılar sadece kendi cihazlarını yönetebilir
CREATE POLICY "Users can manage own trusted devices" ON trusted_devices
    FOR ALL USING (auth.uid() = user_id);

-- api_tokens: Kullanıcılar sadece kendi token'larını yönetebilir
CREATE POLICY "Users can manage own API tokens" ON api_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Yönetici izinleri (YONETICI rolü için)
CREATE POLICY "Admins can view all sessions" ON user_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kullanicilar 
            WHERE kullanicilar.auth_user_id = auth.uid() 
            AND kullanicilar.rol = 'YONETICI'
        )
    );

CREATE POLICY "Admins can view all failed login attempts" ON failed_login_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kullanicilar 
            WHERE kullanicilar.auth_user_id = auth.uid() 
            AND kullanicilar.rol = 'YONETICI'
        )
    );

CREATE POLICY "Admins can view all security events" ON security_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kullanicilar 
            WHERE kullanicilar.auth_user_id = auth.uid() 
            AND kullanicilar.rol = 'YONETICI'
        )
    );

-- Trigger'lar

-- user_sessions tablosu için updated_at trigger'ı
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_2fa_settings_updated_at
    BEFORE UPDATE ON user_2fa_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Oturum süresi hesaplama trigger'ı
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.logout_time IS NOT NULL AND OLD.logout_time IS NULL THEN
        NEW.session_duration_minutes = EXTRACT(EPOCH FROM (NEW.logout_time - NEW.login_time)) / 60;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_session_duration_trigger
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_session_duration();

-- Güvenlik olayı otomatik oluşturma trigger'ı
CREATE OR REPLACE FUNCTION log_security_event()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'user_sessions' THEN
        INSERT INTO security_events (user_id, event_type, event_description, ip_address, user_agent)
        VALUES (NEW.user_id, 'LOGIN', 'User logged in', NEW.ip_address, NEW.user_agent);
    ELSIF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'user_sessions' AND NEW.logout_time IS NOT NULL AND OLD.logout_time IS NULL THEN
        INSERT INTO security_events (user_id, event_type, event_description, ip_address, user_agent)
        VALUES (NEW.user_id, 'LOGOUT', 'User logged out', NEW.ip_address, NEW.user_agent);
    ELSIF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'failed_login_attempts' THEN
        INSERT INTO security_events (user_id, event_type, event_description, ip_address, user_agent, severity)
        VALUES (NULL, 'FAILED_LOGIN', 'Failed login attempt for: ' || NEW.email, NEW.ip_address, NEW.user_agent, 'WARNING');
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER log_login_security_event
    AFTER INSERT OR UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION log_security_event();

CREATE TRIGGER log_failed_login_security_event
    AFTER INSERT ON failed_login_attempts
    FOR EACH ROW
    EXECUTE FUNCTION log_security_event();

-- İzinler
GRANT SELECT, INSERT, UPDATE ON user_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_2fa_settings TO authenticated;
GRANT SELECT, INSERT ON user_2fa_verifications TO authenticated;
GRANT SELECT ON security_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON trusted_devices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE ON password_reset_requests TO authenticated;

-- Anon kullanıcılar için sadece failed_login_attempts'e insert izni
GRANT INSERT ON failed_login_attempts TO anon;
GRANT INSERT ON password_reset_requests TO anon;

COMMIT;