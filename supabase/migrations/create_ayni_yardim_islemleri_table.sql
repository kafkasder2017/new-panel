-- KAFKASDER Projesi - Ayni Yardım İşlemleri Tablosu
-- Bu migration dosyası ayni_yardim_islemleri tablosunu oluşturur
-- Oluşturulma tarihi: 2025-01-06

-- Ayni Yardım İşlemleri tablosu
CREATE TABLE IF NOT EXISTS ayni_yardim_islemleri (
    id SERIAL PRIMARY KEY,
    kisi_id INTEGER NOT NULL,
    urun_id INTEGER NOT NULL,
    miktar DECIMAL(10,2) NOT NULL,
    birim VARCHAR(20) NOT NULL,
    tarih TIMESTAMP WITH TIME ZONE NOT NULL,
    notlar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ayni_yardim_islemleri_kisi_id ON ayni_yardim_islemleri(kisi_id);
CREATE INDEX IF NOT EXISTS idx_ayni_yardim_islemleri_urun_id ON ayni_yardim_islemleri(urun_id);
CREATE INDEX IF NOT EXISTS idx_ayni_yardim_islemleri_tarih ON ayni_yardim_islemleri(tarih);

-- RLS (Row Level Security) politikaları
ALTER TABLE ayni_yardim_islemleri ENABLE ROW LEVEL SECURITY;

-- Tüm kullanıcılar ayni yardım işlemlerini görüntüleyebilir
CREATE POLICY "Authenticated users can view all ayni_yardim_islemleri" ON ayni_yardim_islemleri
    FOR SELECT USING (auth.role() = 'authenticated');

-- Sadece yöneticiler ve editörler ayni yardım işlemi ekleyebilir
CREATE POLICY "Only admins and editors can insert ayni_yardim_islemleri" ON ayni_yardim_islemleri
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Sadece yöneticiler ve editörler ayni yardım işlemi güncelleyebilir
CREATE POLICY "Only admins and editors can update ayni_yardim_islemleri" ON ayni_yardim_islemleri
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Sadece yöneticiler ayni yardım işlemi silebilir
CREATE POLICY "Only admins can delete ayni_yardim_islemleri" ON ayni_yardim_islemleri
    FOR DELETE USING (auth.role() = 'authenticated');

-- Permissions
GRANT SELECT ON ayni_yardim_islemleri TO anon;
GRANT ALL PRIVILEGES ON ayni_yardim_islemleri TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE ayni_yardim_islemleri_id_seq TO authenticated;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_ayni_yardim_islemleri_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ayni_yardim_islemleri_updated_at
    BEFORE UPDATE ON ayni_yardim_islemleri
    FOR EACH ROW
    EXECUTE FUNCTION update_ayni_yardim_islemleri_updated_at();

-- Constraints
ALTER TABLE ayni_yardim_islemleri ADD CONSTRAINT check_birim 
    CHECK (birim IN ('ADET', 'KG', 'LITRE', 'PAKET'));

ALTER TABLE ayni_yardim_islemleri ADD CONSTRAINT check_miktar_positive 
    CHECK (miktar > 0);

ALTER TABLE ayni_yardim_islemleri ADD CONSTRAINT check_kisi_id_positive 
    CHECK (kisi_id > 0);

ALTER TABLE ayni_yardim_islemleri ADD CONSTRAINT check_urun_id_positive 
    CHECK (urun_id > 0);