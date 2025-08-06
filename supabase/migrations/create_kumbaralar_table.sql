-- KAFKASDER Projesi - Kumbaralar Tablosu
-- Bu migration dosyası kumbaralar tablosunu oluşturur
-- Oluşturulma tarihi: 2025-01-06

-- Kumbaralar tablosu
CREATE TABLE IF NOT EXISTS kumbaralar (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    location TEXT NOT NULL,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    last_emptied TIMESTAMP WITH TIME ZONE,
    balance DECIMAL(12,2) DEFAULT 0,
    qr_code_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kumbaralar tablosu için RLS (Row Level Security) etkinleştir
ALTER TABLE kumbaralar ENABLE ROW LEVEL SECURITY;

-- Authenticated kullanıcılar için tüm işlemlere izin ver
CREATE POLICY "Authenticated users can manage kumbaralar" ON kumbaralar
    FOR ALL USING (auth.role() = 'authenticated');

-- Anonim kullanıcılar için sadece okuma izni
CREATE POLICY "Anonymous users can view kumbaralar" ON kumbaralar
    FOR SELECT USING (true);

-- Kumbaralar tablosu için izinleri ver
GRANT SELECT ON kumbaralar TO anon;
GRANT ALL PRIVILEGES ON kumbaralar TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE kumbaralar_id_seq TO authenticated;

-- Kumbaralar tablosu için updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_kumbaralar_updated_at
    BEFORE UPDATE ON kumbaralar
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Örnek veri ekleme (isteğe bağlı)
INSERT INTO kumbaralar (code, location, lat, lng, type, status, balance, qr_code_url) VALUES
('KMBR-IST-001', 'KAFKASDER Genel Merkezi, Fatih, İstanbul', 41.0175, 28.9497, 'Bağış', 'Aktif', 1250.75, 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=KMBR-IST-001'),
('KMBR-IST-002', 'Beyoğlu Şubesi, İstanbul', 41.0369, 28.9857, 'Bağış', 'Aktif', 850.50, 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=KMBR-IST-002'),
('KMBR-ANK-001', 'Ankara Temsilciliği, Çankaya', 39.9208, 32.8541, 'Özel Amaç', 'Aktif', 2100.25, 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=KMBR-ANK-001')
ON CONFLICT (code) DO NOTHING;