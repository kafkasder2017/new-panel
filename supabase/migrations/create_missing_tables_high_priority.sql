-- KAFKASDER Eksik Tablolar - Yüksek Öncelik
-- Bu migration dosyası kritik eksik tabloları oluşturur

-- 1. Kişi belgeleri tablosu
CREATE TABLE IF NOT EXISTS person_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id INTEGER NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Kişi notları tablosu
CREATE TABLE IF NOT EXISTS person_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id INTEGER NOT NULL,
    note_content TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'GENEL',
    is_important BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Yardım ödemeleri tablosu
CREATE TABLE IF NOT EXISTS aid_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id INTEGER NOT NULL,
    payment_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    payment_reference VARCHAR(255),
    notes TEXT,
    paid_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Üyelik sistemi tablosu
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id INTEGER NOT NULL,
    membership_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'AKTIF',
    monthly_fee DECIMAL(10,2),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Aidat takibi tablosu
CREATE TABLE IF NOT EXISTS membership_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL,
    period VARCHAR(20) NOT NULL, -- '2024-01'
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'BEKLEMEDE',
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Kullanıcı oturum takibi
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Başarısız giriş denemeleri
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    ip_address INET,
    attempt_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_person_documents_person_id ON person_documents(person_id);
CREATE INDEX IF NOT EXISTS idx_person_documents_type ON person_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_person_notes_person_id ON person_notes(person_id);
CREATE INDEX IF NOT EXISTS idx_person_notes_type ON person_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_aid_payments_application_id ON aid_payments(application_id);
CREATE INDEX IF NOT EXISTS idx_aid_payments_date ON aid_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_memberships_person_id ON memberships(person_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_membership_fees_membership_id ON membership_fees(membership_id);
CREATE INDEX IF NOT EXISTS idx_membership_fees_period ON membership_fees(period);
CREATE INDEX IF NOT EXISTS idx_membership_fees_status ON membership_fees(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_failed_login_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_time ON failed_login_attempts(attempt_time);

-- Updated_at trigger fonksiyonu (eğer yoksa)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated_at triggerları (IF NOT EXISTS kullanarak)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_person_documents_updated_at') THEN
        CREATE TRIGGER update_person_documents_updated_at BEFORE UPDATE ON person_documents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_person_notes_updated_at') THEN
        CREATE TRIGGER update_person_notes_updated_at BEFORE UPDATE ON person_notes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_aid_payments_updated_at') THEN
        CREATE TRIGGER update_aid_payments_updated_at BEFORE UPDATE ON aid_payments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_memberships_updated_at') THEN
        CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_membership_fees_updated_at') THEN
        CREATE TRIGGER update_membership_fees_updated_at BEFORE UPDATE ON membership_fees FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

-- RLS (Row Level Security) politikaları
ALTER TABLE person_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE aid_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- RLS politikaları - authenticated kullanıcılar için tam erişim
CREATE POLICY "Enable all operations for authenticated users" ON person_documents FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON person_notes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON aid_payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON memberships FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON membership_fees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read for own sessions" ON user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users" ON user_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for own sessions" ON user_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for failed login attempts" ON failed_login_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read for authenticated users" ON failed_login_attempts FOR SELECT USING (auth.role() = 'authenticated');

-- Tablolara erişim izinleri
GRANT ALL PRIVILEGES ON person_documents TO authenticated;
GRANT ALL PRIVILEGES ON person_notes TO authenticated;
GRANT ALL PRIVILEGES ON aid_payments TO authenticated;
GRANT ALL PRIVILEGES ON memberships TO authenticated;
GRANT ALL PRIVILEGES ON membership_fees TO authenticated;
GRANT ALL PRIVILEGES ON user_sessions TO authenticated;
GRANT ALL PRIVILEGES ON failed_login_attempts TO authenticated;

GRANT SELECT ON person_documents TO anon;
GRANT SELECT ON person_notes TO anon;
GRANT SELECT ON aid_payments TO anon;
GRANT SELECT ON memberships TO anon;
GRANT SELECT ON membership_fees TO anon;
GRANT INSERT ON failed_login_attempts TO anon;

-- Başlangıç verileri (sadece tablo yapısı test edilecek)
-- INSERT INTO memberships (person_id, membership_type, start_date, status, monthly_fee, notes) 
-- VALUES 
-- (1, 'STANDART', '2024-01-01', 'AKTIF', 50.00, 'Örnek üyelik kaydı')
-- ON CONFLICT DO NOTHING;

-- INSERT INTO membership_fees (membership_id, period, amount, due_date, status) 
-- VALUES 
-- ((SELECT id FROM memberships LIMIT 1), '2024-01', 50.00, '2024-01-31', 'ODENDI'),
-- ((SELECT id FROM memberships LIMIT 1), '2024-02', 50.00, '2024-02-29', 'BEKLEMEDE')
-- ON CONFLICT DO NOTHING;