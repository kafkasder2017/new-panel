-- KAFKASDER Projesi - Aşama 3 Tabloları
-- Uzun vadeli tablolar: activity_logs, project_participants, donation_campaigns
-- Oluşturulma tarihi: 2025-01-05

-- 1. Sistem logları (activity_logs)
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Proje katılımcıları (project_participants)
CREATE TABLE project_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id INTEGER REFERENCES projeler(id) ON DELETE CASCADE,
    person_id INTEGER REFERENCES kisiler(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'KATILIMCI',
    joined_date DATE DEFAULT CURRENT_DATE,
    left_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Bağış kampanyaları (donation_campaigns)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

CREATE INDEX idx_project_participants_project_id ON project_participants(project_id);
CREATE INDEX idx_project_participants_person_id ON project_participants(person_id);
CREATE UNIQUE INDEX idx_project_participants_unique ON project_participants(project_id, person_id) WHERE left_date IS NULL;

CREATE INDEX idx_donation_campaigns_status ON donation_campaigns(status);
CREATE INDEX idx_donation_campaigns_dates ON donation_campaigns(start_date, end_date);

-- RLS (Row Level Security) Etkinleştirme
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları

-- activity_logs için politikalar
CREATE POLICY "activity_logs_select_policy" ON activity_logs
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            -- Kullanıcı kendi loglarını görebilir
            user_id = auth.uid() OR
            -- Admin kullanıcılar tüm logları görebilir
            EXISTS (
                SELECT 1 FROM kullanicilar k 
                WHERE k.user_id = auth.uid() 
                AND k.rol IN ('ADMIN', 'SUPER_ADMIN')
            )
        )
    );

CREATE POLICY "activity_logs_insert_policy" ON activity_logs
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        user_id = auth.uid()
    );

-- project_participants için politikalar
CREATE POLICY "project_participants_select_policy" ON project_participants
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            -- Proje yöneticileri ve adminler görebilir
            EXISTS (
                SELECT 1 FROM kullanicilar k 
                WHERE k.user_id = auth.uid() 
                AND k.rol IN ('ADMIN', 'SUPER_ADMIN', 'PROJE_YONETICISI')
            ) OR
            -- Kişi kendi katıldığı projeleri görebilir
            EXISTS (
                SELECT 1 FROM kisiler ki 
                WHERE ki.id = person_id 
                AND ki.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "project_participants_insert_policy" ON project_participants
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM kullanicilar k 
            WHERE k.user_id = auth.uid() 
            AND k.rol IN ('ADMIN', 'SUPER_ADMIN', 'PROJE_YONETICISI')
        )
    );

CREATE POLICY "project_participants_update_policy" ON project_participants
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM kullanicilar k 
            WHERE k.user_id = auth.uid() 
            AND k.rol IN ('ADMIN', 'SUPER_ADMIN', 'PROJE_YONETICISI')
        )
    );

CREATE POLICY "project_participants_delete_policy" ON project_participants
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM kullanicilar k 
            WHERE k.user_id = auth.uid() 
            AND k.rol IN ('ADMIN', 'SUPER_ADMIN', 'PROJE_YONETICISI')
        )
    );

-- donation_campaigns için politikalar
CREATE POLICY "donation_campaigns_select_policy" ON donation_campaigns
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            -- Aktif kampanyalar herkese açık
            status = 'AKTIF' OR
            -- Admin ve bağış yöneticileri tüm kampanyaları görebilir
            EXISTS (
                SELECT 1 FROM kullanicilar k 
                WHERE k.user_id = auth.uid() 
                AND k.rol IN ('ADMIN', 'SUPER_ADMIN', 'BAGIS_YONETICISI')
            ) OR
            -- Kampanya oluşturanı görebilir
            created_by = auth.uid()
        )
    );

CREATE POLICY "donation_campaigns_insert_policy" ON donation_campaigns
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM kullanicilar k 
            WHERE k.user_id = auth.uid() 
            AND k.rol IN ('ADMIN', 'SUPER_ADMIN', 'BAGIS_YONETICISI')
        ) AND
        created_by = auth.uid()
    );

CREATE POLICY "donation_campaigns_update_policy" ON donation_campaigns
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM kullanicilar k 
                WHERE k.user_id = auth.uid() 
                AND k.rol IN ('ADMIN', 'SUPER_ADMIN', 'BAGIS_YONETICISI')
            ) OR
            created_by = auth.uid()
        )
    );

CREATE POLICY "donation_campaigns_delete_policy" ON donation_campaigns
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM kullanicilar k 
            WHERE k.user_id = auth.uid() 
            AND k.rol IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Tablolara izinler verme
GRANT SELECT ON activity_logs TO authenticated;
GRANT INSERT ON activity_logs TO authenticated;

GRANT ALL PRIVILEGES ON project_participants TO authenticated;
GRANT ALL PRIVILEGES ON donation_campaigns TO authenticated;

-- Sequence izinleri (UUID kullandığımız için gerekli değil ama güvenlik için)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Başarı mesajı
DO $$
BEGIN
    RAISE NOTICE 'Aşama 3 tabloları başarıyla oluşturuldu: activity_logs, project_participants, donation_campaigns';
END $$;