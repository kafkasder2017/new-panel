-- KAFKASDER Projesi - Ödemeler Tablosu
-- Bu migration dosyası ödemeler tablosunu oluşturur
-- Oluşturulma tarihi: 2025-01-06

-- Ödemeler tablosu
CREATE TABLE IF NOT EXISTS odemeler (
    id SERIAL PRIMARY KEY,
    odeme_turu VARCHAR(50) NOT NULL,
    kisi VARCHAR(255) NOT NULL,
    tutar DECIMAL(12,2) NOT NULL,
    para_birimi VARCHAR(3) DEFAULT 'TRY',
    aciklama TEXT,
    odeme_yontemi VARCHAR(50) NOT NULL,
    odeme_tarihi TIMESTAMP WITH TIME ZONE NOT NULL,
    durum VARCHAR(20) DEFAULT 'BEKLEYEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_odemeler_odeme_tarihi ON odemeler(odeme_tarihi);
CREATE INDEX IF NOT EXISTS idx_odemeler_durum ON odemeler(durum);
CREATE INDEX IF NOT EXISTS idx_odemeler_odeme_turu ON odemeler(odeme_turu);

-- RLS (Row Level Security) politikaları
ALTER TABLE odemeler ENABLE ROW LEVEL SECURITY;

-- Tüm kullanıcılar ödemeleri görüntüleyebilir
CREATE POLICY "Authenticated users can view all odemeler" ON odemeler
    FOR SELECT USING (auth.role() = 'authenticated');

-- Sadece yöneticiler ve muhasebe ödeme ekleyebilir
CREATE POLICY "Only admins and accounting can insert odemeler" ON odemeler
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Sadece yöneticiler ve muhasebe ödeme güncelleyebilir
CREATE POLICY "Only admins and accounting can update odemeler" ON odemeler
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Sadece yöneticiler ödeme silebilir
CREATE POLICY "Only admins can delete odemeler" ON odemeler
    FOR DELETE USING (auth.role() = 'authenticated');

-- Permissions
GRANT SELECT ON odemeler TO anon;
GRANT ALL PRIVILEGES ON odemeler TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE odemeler_id_seq TO authenticated;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_odemeler_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_odemeler_updated_at
    BEFORE UPDATE ON odemeler
    FOR EACH ROW
    EXECUTE FUNCTION update_odemeler_updated_at();

-- Constraints
ALTER TABLE odemeler ADD CONSTRAINT check_odeme_turu 
    CHECK (odeme_turu IN ('BAGIS_GIRISI', 'YARDIM_ODEMESI', 'BURS_ODEMESI', 'YETIM_DESTEGI', 'VEFA_DESTEGI', 'GIDER_ODEMESI'));

ALTER TABLE odemeler ADD CONSTRAINT check_para_birimi 
    CHECK (para_birimi IN ('TRY', 'USD', 'EUR'));

ALTER TABLE odemeler ADD CONSTRAINT check_odeme_yontemi 
    CHECK (odeme_yontemi IN ('NAKIT', 'BANKA_TRANSFERI', 'KREDI_KARTI'));

ALTER TABLE odemeler ADD CONSTRAINT check_durum 
    CHECK (durum IN ('BEKLEYEN', 'TAMAMLANAN', 'IPTAL'));

ALTER TABLE odemeler ADD CONSTRAINT check_tutar_positive 
    CHECK (tutar > 0);