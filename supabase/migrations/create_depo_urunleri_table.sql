-- KAFKASDER Projesi - Depo Ürünleri Tablosu
-- Bu migration dosyası depo_urunleri tablosunu oluşturur
-- Oluşturulma tarihi: 2025-01-06

-- Depo Ürünleri tablosu
CREATE TABLE IF NOT EXISTS depo_urunleri (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    barcode VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    min_stock_level DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_stock_level DECIMAL(10,2),
    shelf_location VARCHAR(100),
    purchase_price DECIMAL(10,2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiration_date DATE,
    supplier VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_depo_urunleri_code ON depo_urunleri(code);
CREATE INDEX IF NOT EXISTS idx_depo_urunleri_barcode ON depo_urunleri(barcode);
CREATE INDEX IF NOT EXISTS idx_depo_urunleri_category ON depo_urunleri(category);
CREATE INDEX IF NOT EXISTS idx_depo_urunleri_name ON depo_urunleri(name);
CREATE INDEX IF NOT EXISTS idx_depo_urunleri_expiration_date ON depo_urunleri(expiration_date);

-- RLS (Row Level Security) politikaları
ALTER TABLE depo_urunleri ENABLE ROW LEVEL SECURITY;

-- Tüm kullanıcılar depo ürünlerini görüntüleyebilir
CREATE POLICY "Authenticated users can view all depo_urunleri" ON depo_urunleri
    FOR SELECT USING (auth.role() = 'authenticated');

-- Sadece yöneticiler ve editörler depo ürünü ekleyebilir
CREATE POLICY "Only admins and editors can insert depo_urunleri" ON depo_urunleri
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Sadece yöneticiler ve editörler depo ürünü güncelleyebilir
CREATE POLICY "Only admins and editors can update depo_urunleri" ON depo_urunleri
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Sadece yöneticiler depo ürünü silebilir
CREATE POLICY "Only admins can delete depo_urunleri" ON depo_urunleri
    FOR DELETE USING (auth.role() = 'authenticated');

-- Permissions
GRANT SELECT ON depo_urunleri TO anon;
GRANT ALL PRIVILEGES ON depo_urunleri TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE depo_urunleri_id_seq TO authenticated;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_depo_urunleri_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_depo_urunleri_updated_at
    BEFORE UPDATE ON depo_urunleri
    FOR EACH ROW
    EXECUTE FUNCTION update_depo_urunleri_updated_at();

-- Constraints
ALTER TABLE depo_urunleri ADD CONSTRAINT check_category 
    CHECK (category IN ('GIDA', 'GIYIM', 'KIRTASIYE', 'TEMIZLIK', 'DIGER'));

ALTER TABLE depo_urunleri ADD CONSTRAINT check_unit 
    CHECK (unit IN ('ADET', 'KG', 'LITRE', 'PAKET'));

ALTER TABLE depo_urunleri ADD CONSTRAINT check_quantity_non_negative 
    CHECK (quantity >= 0);

ALTER TABLE depo_urunleri ADD CONSTRAINT check_min_stock_level_non_negative 
    CHECK (min_stock_level >= 0);

ALTER TABLE depo_urunleri ADD CONSTRAINT check_max_stock_level_positive 
    CHECK (max_stock_level IS NULL OR max_stock_level > 0);

ALTER TABLE depo_urunleri ADD CONSTRAINT check_purchase_price_non_negative 
    CHECK (purchase_price IS NULL OR purchase_price >= 0);