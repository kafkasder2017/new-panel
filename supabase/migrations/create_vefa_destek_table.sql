-- KAFKASDER Projesi - Vefa Destek Tablosu
-- Bu migration dosyası vefa_destek tablosunu oluşturur
-- Oluşturulma tarihi: 2025-01-06

-- Vefa Destek tablosu
CREATE TABLE IF NOT EXISTS vefa_destek (
    id SERIAL PRIMARY KEY,
    adi_soyadi VARCHAR(255) NOT NULL,
    dogum_tarihi DATE,
    telefon VARCHAR(20) NOT NULL,
    adres TEXT NOT NULL,
    destek_turu VARCHAR(50) NOT NULL,
    destek_durumu VARCHAR(20) DEFAULT 'AKTIF',
    sorumlu_gonullu VARCHAR(255),
    kayit_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vefa Notları tablosu (ilişkili tablo)
CREATE TABLE IF NOT EXISTS vefa_notlari (
    id SERIAL PRIMARY KEY,
    vefa_destek_id INTEGER NOT NULL REFERENCES vefa_destek(id) ON DELETE CASCADE,
    tarih TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    icerik TEXT NOT NULL,
    giren_kullanici VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vefa_destek_adi_soyadi ON vefa_destek(adi_soyadi);
CREATE INDEX IF NOT EXISTS idx_vefa_destek_telefon ON vefa_destek(telefon);
CREATE INDEX IF NOT EXISTS idx_vefa_destek_destek_turu ON vefa_destek(destek_turu);
CREATE INDEX IF NOT EXISTS idx_vefa_destek_destek_durumu ON vefa_destek(destek_durumu);
CREATE INDEX IF NOT EXISTS idx_vefa_destek_sorumlu_gonullu ON vefa_destek(sorumlu_gonullu);
CREATE INDEX IF NOT EXISTS idx_vefa_notlari_vefa_destek_id ON vefa_notlari(vefa_destek_id);
CREATE INDEX IF NOT EXISTS idx_vefa_notlari_tarih ON vefa_notlari(tarih);

-- RLS (Row Level Security) politikaları
ALTER TABLE vefa_destek ENABLE ROW LEVEL SECURITY;
ALTER TABLE vefa_notlari ENABLE ROW LEVEL SECURITY;

-- Vefa Destek politikaları
CREATE POLICY "Authenticated users can view all vefa_destek" ON vefa_destek
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins and editors can insert vefa_destek" ON vefa_destek
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only admins and editors can update vefa_destek" ON vefa_destek
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can delete vefa_destek" ON vefa_destek
    FOR DELETE USING (auth.role() = 'authenticated');

-- Vefa Notları politikaları
CREATE POLICY "Authenticated users can view all vefa_notlari" ON vefa_notlari
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins and editors can insert vefa_notlari" ON vefa_notlari
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only admins and editors can update vefa_notlari" ON vefa_notlari
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can delete vefa_notlari" ON vefa_notlari
    FOR DELETE USING (auth.role() = 'authenticated');

-- Permissions
GRANT SELECT ON vefa_destek TO anon;
GRANT ALL PRIVILEGES ON vefa_destek TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE vefa_destek_id_seq TO authenticated;

GRANT SELECT ON vefa_notlari TO anon;
GRANT ALL PRIVILEGES ON vefa_notlari TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE vefa_notlari_id_seq TO authenticated;

-- Updated_at trigger for vefa_destek
CREATE OR REPLACE FUNCTION update_vefa_destek_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vefa_destek_updated_at
    BEFORE UPDATE ON vefa_destek
    FOR EACH ROW
    EXECUTE FUNCTION update_vefa_destek_updated_at();

-- Constraints
ALTER TABLE vefa_destek ADD CONSTRAINT check_destek_turu 
    CHECK (destek_turu IN ('EVDE_TEMIZLIK', 'ALISVERIS_DESTEGI', 'SOSYAL_AKTIVITE', 'TEKNIK_DESTEK', 'DIGER'));

ALTER TABLE vefa_destek ADD CONSTRAINT check_destek_durumu 
    CHECK (destek_durumu IN ('AKTIF', 'PASIF'));