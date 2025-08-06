-- KAFKASDER Projesi - Bağış Kampanyaları Tablosu
-- Sadece donation_campaigns tablosu (diğerleri zaten mevcut)
-- Oluşturulma tarihi: 2025-01-05

-- Bağış kampanyaları tablosu
CREATE TABLE donation_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(12,2),
    current_amount DECIMAL(12,2) DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'AKTIF',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_donation_campaigns_status ON donation_campaigns(status);
CREATE INDEX idx_donation_campaigns_dates ON donation_campaigns(start_date, end_date);
CREATE INDEX idx_donation_campaigns_created_by ON donation_campaigns(created_by);

-- RLS (Row Level Security) Etkinleştirme
ALTER TABLE donation_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları
CREATE POLICY "donation_campaigns_select_policy" ON donation_campaigns
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            -- Aktif kampanyalar herkese açık
            status = 'AKTIF' OR
            -- Admin ve bağış yöneticileri tüm kampanyaları görebilir
            EXISTS (
                SELECT 1 FROM user_profiles up 
                WHERE up.id = auth.uid() 
                AND up.role IN ('ADMIN', 'SUPER_ADMIN', 'BAGIS_YONETICISI')
            ) OR
            -- Kampanya oluşturanı görebilir
            created_by = auth.uid()
        )
    );

CREATE POLICY "donation_campaigns_insert_policy" ON donation_campaigns
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('ADMIN', 'SUPER_ADMIN', 'BAGIS_YONETICISI')
        ) AND
        created_by = auth.uid()
    );

CREATE POLICY "donation_campaigns_update_policy" ON donation_campaigns
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM user_profiles up 
                WHERE up.id = auth.uid() 
                AND up.role IN ('ADMIN', 'SUPER_ADMIN', 'BAGIS_YONETICISI')
            ) OR
            created_by = auth.uid()
        )
    );

CREATE POLICY "donation_campaigns_delete_policy" ON donation_campaigns
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Tabloya izinler verme
GRANT ALL PRIVILEGES ON donation_campaigns TO authenticated;
GRANT SELECT ON donation_campaigns TO anon;

-- Başarı mesajı
DO $$
BEGIN
    RAISE NOTICE 'donation_campaigns tablosu başarıyla oluşturuldu';
END $$;