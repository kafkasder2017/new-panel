-- KAFKASDER Projesi - Hizmetler Tablosu
-- Bu migration dosyası hizmetler tablosunu oluşturur
-- Oluşturulma tarihi: 2025-01-06

-- Hizmetler tablosu
CREATE TABLE IF NOT EXISTS hizmetler (
    id SERIAL PRIMARY KEY,
    kisi_id INTEGER NOT NULL,
    hizmet_turu VARCHAR(50) NOT NULL,
    hizmet_veren VARCHAR(255) NOT NULL,
    tarih TIMESTAMP WITH TIME ZONE NOT NULL,
    aciklama TEXT NOT NULL,
    durum VARCHAR(20) DEFAULT 'PLANLANDI',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hizmetler_kisi_id ON hizmetler(kisi_id);
CREATE INDEX IF NOT EXISTS idx_hizmetler_hizmet_turu ON hizmetler(hizmet_turu);
CREATE INDEX IF NOT EXISTS idx_hizmetler_hizmet_veren ON hizmetler(hizmet_veren);
CREATE INDEX IF NOT EXISTS idx_hizmetler_tarih ON hizmetler(tarih);
CREATE INDEX IF NOT EXISTS idx_hizmetler_durum ON hizmetler(durum);

-- RLS (Row Level Security) politikaları
ALTER TABLE hizmetler ENABLE ROW LEVEL SECURITY;

-- Tüm kullanıcılar hizmetleri görüntüleyebilir
CREATE POLICY "Authenticated users can view all hizmetler" ON hizmetler
    FOR SELECT USING (auth.role() = 'authenticated');

-- Sadece yöneticiler ve editörler hizmet ekleyebilir
CREATE POLICY "Only admins and editors can insert hizmetler" ON hizmetler
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Sadece yöneticiler ve editörler hizmet güncelleyebilir
CREATE POLICY "Only admins and editors can update hizmetler" ON hizmetler
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Sadece yöneticiler hizmet silebilir
CREATE POLICY "Only admins can delete hizmetler" ON hizmetler
    FOR DELETE USING (auth.role() = 'authenticated');

-- Permissions
GRANT SELECT ON hizmetler TO anon;
GRANT ALL PRIVILEGES ON hizmetler TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE hizmetler_id_seq TO authenticated;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_hizmetler_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hizmetler_updated_at
    BEFORE UPDATE ON hizmetler
    FOR EACH ROW
    EXECUTE FUNCTION update_hizmetler_updated_at();

-- Constraints
ALTER TABLE hizmetler ADD CONSTRAINT check_hizmet_turu 
    CHECK (hizmet_turu IN ('DANISMANLIK', 'EGITIM', 'SAGLIK_TARAMASI', 'PSIKOLOJIK_DESTEK', 'HUKUKI_DESTEK', 'TERCUMANLIK', 'DIGER'));

ALTER TABLE hizmetler ADD CONSTRAINT check_durum 
    CHECK (durum IN ('PLANLANDI', 'TAMAMLANDI', 'IPTAL_EDILDI'));

ALTER TABLE hizmetler ADD CONSTRAINT check_kisi_id_positive 
    CHECK (kisi_id > 0);