-- İki faktörlü kimlik doğrulama tabloları
-- Bu migration 2FA sistemi için gerekli tabloları oluşturur

-- 1. İki faktörlü kimlik doğrulama ayarları tablosu
CREATE TABLE IF NOT EXISTS user_two_factor_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    secret_key TEXT NOT NULL, -- TOTP secret key (encrypted)
    is_enabled BOOLEAN DEFAULT false,
    backup_codes_generated BOOLEAN DEFAULT false,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Her kullanıcı için sadece bir 2FA ayarı olabilir
    UNIQUE(user_id)
);

-- 2. 2FA backup codes tablosu
CREATE TABLE IF NOT EXISTS two_factor_backup_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL, -- Hashed backup code
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Her kod sadece bir kez kullanılabilir
    UNIQUE(user_id, code_hash)
);

-- 3. 2FA verification attempts tablosu
CREATE TABLE IF NOT EXISTS two_factor_verification_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    attempt_type TEXT NOT NULL CHECK (attempt_type IN ('totp', 'backup_code')),
    is_successful BOOLEAN DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_user_two_factor_auth_user_id ON user_two_factor_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_user_two_factor_auth_enabled ON user_two_factor_auth(user_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_backup_codes_user_id ON two_factor_backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_codes_unused ON two_factor_backup_codes(user_id, is_used) WHERE is_used = false;
CREATE INDEX IF NOT EXISTS idx_2fa_verification_attempts_user_id ON two_factor_verification_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_verification_attempts_time ON two_factor_verification_attempts(attempted_at);

-- RLS (Row Level Security) politikaları
ALTER TABLE user_two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_verification_attempts ENABLE ROW LEVEL SECURITY;

-- user_two_factor_auth için RLS politikaları
CREATE POLICY "Users can view their own 2FA settings" ON user_two_factor_auth
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings" ON user_two_factor_auth
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings" ON user_two_factor_auth
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own 2FA settings" ON user_two_factor_auth
    FOR DELETE USING (auth.uid() = user_id);

-- two_factor_backup_codes için RLS politikaları
CREATE POLICY "Users can view their own backup codes" ON two_factor_backup_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own backup codes" ON two_factor_backup_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backup codes" ON two_factor_backup_codes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backup codes" ON two_factor_backup_codes
    FOR DELETE USING (auth.uid() = user_id);

-- two_factor_verification_attempts için RLS politikaları
CREATE POLICY "Users can view their own verification attempts" ON two_factor_verification_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert verification attempts" ON two_factor_verification_attempts
    FOR INSERT WITH CHECK (true); -- Sistem tarafından eklenir

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at trigger'ları
CREATE TRIGGER update_user_two_factor_auth_updated_at
    BEFORE UPDATE ON user_two_factor_auth
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Yetkilendirme
GRANT SELECT, INSERT, UPDATE, DELETE ON user_two_factor_auth TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON two_factor_backup_codes TO authenticated;
GRANT SELECT, INSERT ON two_factor_verification_attempts TO authenticated;
GRANT SELECT ON two_factor_verification_attempts TO anon;

-- Sequence'lere yetki verme
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;