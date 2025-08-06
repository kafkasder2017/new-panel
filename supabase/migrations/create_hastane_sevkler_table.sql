-- KAFKASDER Projesi - Hastane Sevkler Tablosu
-- Bu migration dosyası hastane_sevkler tablosunu oluşturur
-- Oluşturulma tarihi: 2025-01-06

-- Hastane Sevkler tablosu
CREATE TABLE IF NOT EXISTS hastane_sevkler (
    id SERIAL PRIMARY KEY,
    kisi_id INTEGER NOT NULL,
    hastane_adi VARCHAR(255) NOT NULL,
    bolum VARCHAR(255) NOT NULL,
    doktor_adi VARCHAR(255),
    sevk_tarihi TIMESTAMP WITH TIME ZONE NOT NULL,
    randevu_tarihi TIMESTAMP WITH TIME ZONE,
    sevk_nedeni TEXT NOT NULL,
    durum VARCHAR(20) DEFAULT 'PLANLANDI',
    sonuc TEXT,
    maliyet DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hastane_sevkler_kisi_id ON hastane_sevkler(kisi_id);
CREATE INDEX IF NOT EXISTS idx_hastane_sevkler_hastane_adi ON hastane_sevkler(hastane_adi);
CREATE INDEX IF NOT EXISTS idx_hastane_sevkler_bolum ON hastane_sevkler(bolum);
CREATE INDEX IF NOT EXISTS idx_hastane_sevkler_sevk_tarihi ON hastane_sevkler(sevk_tarihi);
CREATE INDEX IF NOT EXISTS idx_hastane_sevkler_randevu_tarihi ON hastane_sevkler(randevu_tarihi);
CREATE INDEX IF NOT EXISTS idx_hastane_sevkler_durum ON hastane_sevkler(durum);

-- RLS (Row Level Security) politikaları
ALTER TABLE hastane_sevkler ENABLE ROW LEVEL SECURITY;

-- Tüm kullanıcılar hastane sevklerini görüntüleyebilir
CREATE POLICY "Authenticated users can view all hastane_sevkler" ON hastane_sevkler
    FOR SELECT USING (auth.role() = 'authenticated');

-- Sadece yöneticiler ve editörler hastane sevki ekleyebilir
CREATE POLICY "Only admins and editors can insert hastane_sevkler" ON hastane_sevkler
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Sadece yöneticiler ve editörler hastane sevki güncelleyebilir
CREATE POLICY "Only admins and editors can update hastane_sevkler" ON hastane_sevkler
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Sadece yöneticiler hastane sevki silebilir
CREATE POLICY "Only admins can delete hastane_sevkler" ON hastane_sevkler
    FOR DELETE USING (auth.role() = 'authenticated');

-- Permissions
GRANT SELECT ON hastane_sevkler TO anon;
GRANT ALL PRIVILEGES ON hastane_sevkler TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE hastane_sevkler_id_seq TO authenticated;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_hastane_sevkler_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hastane_sevkler_updated_at
    BEFORE UPDATE ON hastane_sevkler
    FOR EACH ROW
    EXECUTE FUNCTION update_hastane_sevkler_updated_at();

-- Constraints
ALTER TABLE hastane_sevkler ADD CONSTRAINT check_durum 
    CHECK (durum IN ('PLANLANDI', 'RANDEVU_ALINDI', 'GIDILDI', 'IPTAL_EDILDI'));

ALTER TABLE hastane_sevkler ADD CONSTRAINT check_kisi_id_positive 
    CHECK (kisi_id > 0);

ALTER TABLE hastane_sevkler ADD CONSTRAINT check_maliyet_non_negative 
    CHECK (maliyet IS NULL OR maliyet >= 0);