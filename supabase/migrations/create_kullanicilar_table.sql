-- KAFKASDER Projesi - Kullanicilar Tablosu Migration
-- Bu migration dosyası eksik olan 'kullanicilar' tablosunu oluşturur

-- =====================================================
-- KULLANICILAR TABLOSU
-- =====================================================

-- Kullanicilar tablosu - auth.users ile ilişkili
CREATE TABLE IF NOT EXISTS kullanicilar (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    kullanici_adi VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'GONULLU',
    durum VARCHAR(20) NOT NULL DEFAULT 'AKTIF',
    son_giris TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- İNDEKSLER
-- =====================================================

-- Kullanicilar indeksleri
CREATE INDEX IF NOT EXISTS idx_kullanicilar_user_id ON kullanicilar(user_id);
CREATE INDEX IF NOT EXISTS idx_kullanicilar_email ON kullanicilar(email);
CREATE INDEX IF NOT EXISTS idx_kullanicilar_rol ON kullanicilar(rol);
CREATE INDEX IF NOT EXISTS idx_kullanicilar_durum ON kullanicilar(durum);

-- Email unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_kullanicilar_email_unique ON kullanicilar(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kullanicilar_user_id_unique ON kullanicilar(user_id);

-- =====================================================
-- RLS (ROW LEVEL SECURITY) POLİTİKALARI
-- =====================================================

-- Kullanicilar RLS
ALTER TABLE kullanicilar ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all users
CREATE POLICY "Authenticated users can view all users" ON kullanicilar
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON kullanicilar
    FOR SELECT USING (auth.uid() = user_id);

-- Only admins can insert new users
CREATE POLICY "Admins can insert users" ON kullanicilar
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM kullanicilar k 
            WHERE k.user_id = auth.uid() 
            AND k.rol IN ('YONETICI')
        )
    );

-- Users can update their own profile, admins can update all
CREATE POLICY "Users can update own profile or admins can update all" ON kullanicilar
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM kullanicilar k 
            WHERE k.user_id = auth.uid() 
            AND k.rol IN ('YONETICI')
        )
    );

-- Only admins can delete users
CREATE POLICY "Admins can delete users" ON kullanicilar
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM kullanicilar k 
            WHERE k.user_id = auth.uid() 
            AND k.rol IN ('YONETICI')
        )
    );

-- =====================================================
-- İZİNLER
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT ON kullanicilar TO authenticated;
GRANT INSERT ON kullanicilar TO authenticated;
GRANT UPDATE ON kullanicilar TO authenticated;
GRANT DELETE ON kullanicilar TO authenticated;

-- Grant permissions to anon users (for login)
GRANT SELECT ON kullanicilar TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON SEQUENCE kullanicilar_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE kullanicilar_id_seq TO anon;

-- =====================================================
-- TETİKLEYİCİLER
-- =====================================================

-- Updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated_at trigger for kullanicilar
CREATE TRIGGER update_kullanicilar_updated_at
    BEFORE UPDATE ON kullanicilar
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- BAŞLANGIÇ VERİLERİ
-- =====================================================

-- Admin kullanıcısı için kullanicilar tablosuna kayıt ekleme
-- (Bu kayıt create_admin_user.sql'de oluşturulan admin user için)
INSERT INTO kullanicilar (user_id, kullanici_adi, email, rol, durum)
SELECT 
    id,
    'admin',
    email,
    'YONETICI',
    'AKTIF'
FROM auth.users 
WHERE email = 'isahamid095@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- DOĞRULAMA
-- =====================================================

-- Kullanicilar tablosunun başarıyla oluşturulduğunu doğrula
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kullanicilar') THEN
        RAISE NOTICE 'Kullanicilar tablosu başarıyla oluşturuldu!';
    ELSE
        RAISE EXCEPTION 'Kullanicilar tablosu oluşturulamadı!';
    END IF;
END $$;

-- Kullanicilar sayısını göster
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM kullanicilar;
    RAISE NOTICE 'Toplam kullanıcı sayısı: %', user_count;
END $$;