-- KAFKASDER Projesi - Eksik Tablolar Migration (Aşama 2 - Orta Vadeli)
-- Bu migration dosyası üyelik sistemi, bildirimler ve dosya yönetimi tablolarını oluşturur

-- =====================================================
-- 1. ÜYELİK SİSTEMİ TABLOLARI
-- =====================================================

-- Üyelik sistemi
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id INTEGER REFERENCES kisiler(id) ON DELETE CASCADE,
    membership_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'AKTIF',
    monthly_fee DECIMAL(10,2),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aidat takibi
CREATE TABLE IF NOT EXISTS membership_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID REFERENCES memberships(id) ON DELETE CASCADE,
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

-- =====================================================
-- 2. BİLDİRİMLER SİSTEMİ
-- =====================================================

-- Bildirimler sistemi
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. DOSYA YÖNETİMİ SİSTEMİ
-- =====================================================

-- Dosya sistemi
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- 'person', 'project', 'financial'
    entity_id UUID,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. İNDEKSLER
-- =====================================================

-- Memberships indeksleri
CREATE INDEX IF NOT EXISTS idx_memberships_person_id ON memberships(person_id);
CREATE INDEX IF NOT EXISTS idx_memberships_type ON memberships(membership_type);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_start_date ON memberships(start_date);
CREATE INDEX IF NOT EXISTS idx_memberships_created_by ON memberships(created_by);

-- Membership fees indeksleri
CREATE INDEX IF NOT EXISTS idx_membership_fees_membership_id ON membership_fees(membership_id);
CREATE INDEX IF NOT EXISTS idx_membership_fees_period ON membership_fees(period);
CREATE INDEX IF NOT EXISTS idx_membership_fees_status ON membership_fees(status);
CREATE INDEX IF NOT EXISTS idx_membership_fees_due_date ON membership_fees(due_date);
CREATE INDEX IF NOT EXISTS idx_membership_fees_payment_date ON membership_fees(payment_date);

-- Notifications indeksleri
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- File uploads indeksleri
CREATE INDEX IF NOT EXISTS idx_file_uploads_entity_type ON file_uploads(entity_type);
CREATE INDEX IF NOT EXISTS idx_file_uploads_entity_id ON file_uploads(entity_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_by ON file_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_uploads_mime_type ON file_uploads(mime_type);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at);

-- =====================================================
-- 5. RLS (ROW LEVEL SECURITY) POLİTİKALARI
-- =====================================================

-- Memberships RLS
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view memberships" ON memberships
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert memberships" ON memberships
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

CREATE POLICY "Users can update memberships they created" ON memberships
    FOR UPDATE USING (auth.uid() = created_by);

-- Membership fees RLS
ALTER TABLE membership_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view membership fees" ON membership_fees
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert membership fees" ON membership_fees
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update membership fees" ON membership_fees
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- File uploads RLS
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view file uploads" ON file_uploads
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert file uploads" ON file_uploads
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = uploaded_by);

CREATE POLICY "Users can update files they uploaded" ON file_uploads
    FOR UPDATE USING (auth.uid() = uploaded_by);

-- =====================================================
-- 6. İZİNLER (GRANTS)
-- =====================================================

-- Memberships izinleri
GRANT ALL PRIVILEGES ON memberships TO authenticated;
GRANT ALL PRIVILEGES ON memberships TO service_role;

-- Membership fees izinleri
GRANT ALL PRIVILEGES ON membership_fees TO authenticated;
GRANT ALL PRIVILEGES ON membership_fees TO service_role;

-- Notifications izinleri
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT INSERT ON notifications TO anon;
GRANT ALL PRIVILEGES ON notifications TO service_role;

-- File uploads izinleri
GRANT ALL PRIVILEGES ON file_uploads TO authenticated;
GRANT ALL PRIVILEGES ON file_uploads TO service_role;

-- =====================================================
-- 7. UPDATED_AT TETİKLEYİCİLERİ
-- =====================================================

-- Memberships updated_at tetikleyicisi
CREATE TRIGGER update_memberships_updated_at
    BEFORE UPDATE ON memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Membership fees updated_at tetikleyicisi
CREATE TRIGGER update_membership_fees_updated_at
    BEFORE UPDATE ON membership_fees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Notifications updated_at tetikleyicisi
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- File uploads updated_at tetikleyicisi
CREATE TRIGGER update_file_uploads_updated_at
    BEFORE UPDATE ON file_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. KURAL VE KISITLAMALAR
-- =====================================================

-- Membership status kontrolü
ALTER TABLE memberships ADD CONSTRAINT check_membership_status 
    CHECK (status IN ('AKTIF', 'PASIF', 'ASKIDA', 'IPTAL'));

-- Membership type kontrolü
ALTER TABLE memberships ADD CONSTRAINT check_membership_type 
    CHECK (membership_type IN ('NORMAL', 'OGRENCI', 'EMEKLI', 'FAHRI', 'KURUMSAL'));

-- Membership fees status kontrolü
ALTER TABLE membership_fees ADD CONSTRAINT check_fee_status 
    CHECK (status IN ('BEKLEMEDE', 'ODENDI', 'GECIKTI', 'IPTAL'));

-- Notification type kontrolü
ALTER TABLE notifications ADD CONSTRAINT check_notification_type 
    CHECK (type IN ('INFO', 'WARNING', 'ERROR', 'SUCCESS', 'REMINDER', 'SYSTEM'));

-- File size kontrolü (max 50MB)
ALTER TABLE file_uploads ADD CONSTRAINT check_file_size 
    CHECK (file_size <= 52428800);

-- Entity type kontrolü
ALTER TABLE file_uploads ADD CONSTRAINT check_entity_type 
    CHECK (entity_type IN ('person', 'project', 'financial', 'aid', 'donation', 'membership', 'general'));

-- =====================================================
-- 9. BAŞARI MESAJI
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'KAFKASDER Eksik Tablolar Migration (Aşama 2) başarıyla tamamlandı!';
    RAISE NOTICE 'Oluşturulan tablolar:';
    RAISE NOTICE '- memberships (üyelik sistemi)';
    RAISE NOTICE '- membership_fees (aidat takibi)';
    RAISE NOTICE '- notifications (bildirimler sistemi)';
    RAISE NOTICE '- file_uploads (dosya yönetimi sistemi)';
    RAISE NOTICE 'RLS politikaları, izinler ve kısıtlamalar eklendi.';
END $$;