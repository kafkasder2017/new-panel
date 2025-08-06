-- KAFKASDER Projesi - Kurumlar Tablosu
-- Bu migration kurumlar tablosunu oluşturur
-- Oluşturulma tarihi: 2025-01-06

-- Kurumlar tablosu
CREATE TABLE IF NOT EXISTS kurumlar (
    id SERIAL PRIMARY KEY,
    kurum_adi VARCHAR(255) NOT NULL,
    adres TEXT,
    telefon VARCHAR(20),
    email VARCHAR(255),
    yetkili_kisi VARCHAR(255),
    notlar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kurumlar tablosu için indeksler
CREATE INDEX IF NOT EXISTS idx_kurumlar_kurum_adi ON kurumlar(kurum_adi);
CREATE INDEX IF NOT EXISTS idx_kurumlar_email ON kurumlar(email);
CREATE INDEX IF NOT EXISTS idx_kurumlar_created_at ON kurumlar(created_at);

-- Updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_kurumlar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kurumlar_updated_at
    BEFORE UPDATE ON kurumlar
    FOR EACH ROW
    EXECUTE FUNCTION update_kurumlar_updated_at();

-- RLS (Row Level Security) politikaları
ALTER TABLE kurumlar ENABLE ROW LEVEL SECURITY;

-- Authenticated kullanıcılar için okuma izni
CREATE POLICY "Kurumlar okuma izni" ON kurumlar
    FOR SELECT
    TO authenticated
    USING (true);

-- Authenticated kullanıcılar için yazma izni
CREATE POLICY "Kurumlar yazma izni" ON kurumlar
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Anon kullanıcılar için okuma izni (gerekirse)
CREATE POLICY "Kurumlar anon okuma izni" ON kurumlar
    FOR SELECT
    TO anon
    USING (true);

-- Örnek veri ekleme
INSERT INTO kurumlar (kurum_adi, adres, telefon, email, yetkili_kisi, notlar) VALUES
('KAFKASDER Merkez', 'Ankara, Türkiye', '+90 312 123 4567', 'info@kafkasder.org', 'Ahmet Yılmaz', 'Ana merkez ofisi'),
('KAFKASDER İstanbul Şubesi', 'İstanbul, Türkiye', '+90 212 987 6543', 'istanbul@kafkasder.org', 'Mehmet Demir', 'İstanbul bölge ofisi'),
('KAFKASDER İzmir Şubesi', 'İzmir, Türkiye', '+90 232 555 1234', 'izmir@kafkasder.org', 'Ayşe Kaya', 'İzmir bölge ofisi')
ON CONFLICT DO NOTHING;

COMMIT;