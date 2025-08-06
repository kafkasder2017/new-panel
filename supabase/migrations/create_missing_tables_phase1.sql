-- KAFKASDER Projesi - Eksik Tablolar Migration (Aşama 1 - Acil)
-- Bu migration dosyası kritik eksik tabloları oluşturur

-- =====================================================
-- 1. AUTHENTICATION SİSTEMİ TABLOLARI
-- =====================================================

-- Kullanıcı oturum takibi için
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Başarısız giriş denemeleri
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    ip_address INET,
    attempt_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. KİŞİ YÖNETİMİ TABLOLARI
-- =====================================================

-- Kişi belgeleri
CREATE TABLE IF NOT EXISTS person_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id INTEGER REFERENCES kisiler(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kişi notları
CREATE TABLE IF NOT EXISTS person_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id INTEGER REFERENCES kisiler(id) ON DELETE CASCADE,
    note_content TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'GENEL',
    is_important BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. YARDIM YÖNETİMİ TABLOLARI
-- =====================================================

-- Yardım ödemeleri
CREATE TABLE IF NOT EXISTS aid_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id INTEGER REFERENCES yardim_basvurulari(id) ON DELETE CASCADE,
    payment_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    payment_reference VARCHAR(255),
    notes TEXT,
    paid_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. İNDEKSLER
-- =====================================================

-- User sessions indeksleri
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_time ON user_sessions(login_time);

-- Failed login attempts indeksleri
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_time ON failed_login_attempts(attempt_time);

-- Person documents indeksleri
CREATE INDEX IF NOT EXISTS idx_person_documents_person_id ON person_documents(person_id);
CREATE INDEX IF NOT EXISTS idx_person_documents_type ON person_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_person_documents_uploaded_by ON person_documents(uploaded_by);

-- Person notes indeksleri
CREATE INDEX IF NOT EXISTS idx_person_notes_person_id ON person_notes(person_id);
CREATE INDEX IF NOT EXISTS idx_person_notes_type ON person_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_person_notes_important ON person_notes(is_important);
CREATE INDEX IF NOT EXISTS idx_person_notes_created_by ON person_notes(created_by);

-- Aid payments indeksleri
CREATE INDEX IF NOT EXISTS idx_aid_payments_application_id ON aid_payments(application_id);
CREATE INDEX IF NOT EXISTS idx_aid_payments_date ON aid_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_aid_payments_method ON aid_payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_aid_payments_paid_by ON aid_payments(paid_by);

-- =====================================================
-- 5. RLS (ROW LEVEL SECURITY) POLİTİKALARI
-- =====================================================

-- User sessions RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin policy removed due to missing kullanicilar table
-- CREATE POLICY "Admins can view all sessions" ON user_sessions
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM kullanicilar 
--             WHERE kullanicilar.user_id = auth.uid() 
--             AND kullanicilar.rol = 'admin'
--         )
--     );

-- Failed login attempts RLS
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Admin policy removed due to missing kullanicilar table
-- CREATE POLICY "Only admins can view failed login attempts" ON failed_login_attempts
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM kullanicilar 
--             WHERE kullanicilar.user_id = auth.uid() 
--             AND kullanicilar.rol = 'admin'
--         )
--     );

CREATE POLICY "System can insert failed login attempts" ON failed_login_attempts
    FOR INSERT WITH CHECK (true);

-- Person documents RLS
ALTER TABLE person_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view person documents" ON person_documents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert person documents" ON person_documents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = uploaded_by);

CREATE POLICY "Users can update documents they uploaded" ON person_documents
    FOR UPDATE USING (auth.uid() = uploaded_by);

-- Admin policy removed due to missing kullanicilar table
-- CREATE POLICY "Admins can manage all person documents" ON person_documents
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM kullanicilar 
--             WHERE kullanicilar.user_id = auth.uid() 
--             AND kullanicilar.rol = 'admin'
--         )
--     );

-- Person notes RLS
ALTER TABLE person_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view person notes" ON person_notes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert person notes" ON person_notes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

CREATE POLICY "Users can update notes they created" ON person_notes
    FOR UPDATE USING (auth.uid() = created_by);

-- Admin policy removed due to missing kullanicilar table
-- CREATE POLICY "Admins can manage all person notes" ON person_notes
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM kullanicilar 
--             WHERE kullanicilar.user_id = auth.uid() 
--             AND kullanicilar.rol = 'admin'
--         )
--     );

-- Aid payments RLS
ALTER TABLE aid_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view aid payments" ON aid_payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert aid payments" ON aid_payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = paid_by);

CREATE POLICY "Users can update payments they made" ON aid_payments
    FOR UPDATE USING (auth.uid() = paid_by);

-- Admin policy removed due to missing kullanicilar table
-- CREATE POLICY "Admins can manage all aid payments" ON aid_payments
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM kullanicilar 
--             WHERE kullanicilar.user_id = auth.uid() 
--             AND kullanicilar.rol = 'admin'
--         )
--     );

-- =====================================================
-- 6. İZİNLER (GRANTS)
-- =====================================================

-- User sessions izinleri
GRANT SELECT, INSERT, UPDATE ON user_sessions TO authenticated;
GRANT ALL PRIVILEGES ON user_sessions TO service_role;

-- Failed login attempts izinleri
GRANT INSERT ON failed_login_attempts TO anon;
GRANT ALL PRIVILEGES ON failed_login_attempts TO authenticated;
GRANT ALL PRIVILEGES ON failed_login_attempts TO service_role;

-- Person documents izinleri
GRANT ALL PRIVILEGES ON person_documents TO authenticated;
GRANT ALL PRIVILEGES ON person_documents TO service_role;

-- Person notes izinleri
GRANT ALL PRIVILEGES ON person_notes TO authenticated;
GRANT ALL PRIVILEGES ON person_notes TO service_role;

-- Aid payments izinleri
GRANT ALL PRIVILEGES ON aid_payments TO authenticated;
GRANT ALL PRIVILEGES ON aid_payments TO service_role;

-- =====================================================
-- 7. UPDATED_AT TETİKLEYİCİLERİ
-- =====================================================

-- Updated_at fonksiyonu (eğer yoksa)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- User sessions updated_at tetikleyicisi
CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Person documents updated_at tetikleyicisi
CREATE TRIGGER update_person_documents_updated_at
    BEFORE UPDATE ON person_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Person notes updated_at tetikleyicisi
CREATE TRIGGER update_person_notes_updated_at
    BEFORE UPDATE ON person_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Aid payments updated_at tetikleyicisi
CREATE TRIGGER update_aid_payments_updated_at
    BEFORE UPDATE ON aid_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. BAŞARI MESAJI
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'KAFKASDER Eksik Tablolar Migration (Aşama 1) başarıyla tamamlandı!';
    RAISE NOTICE 'Oluşturulan tablolar:';
    RAISE NOTICE '- user_sessions (kullanıcı oturum takibi)';
    RAISE NOTICE '- failed_login_attempts (başarısız giriş denemeleri)';
    RAISE NOTICE '- person_documents (kişi belgeleri)';
    RAISE NOTICE '- person_notes (kişi notları)';
    RAISE NOTICE '- aid_payments (yardım ödemeleri)';
    RAISE NOTICE 'RLS politikaları ve izinler eklendi.';
END $$;