-- =====================================================
-- KAFKASDER - File Uploads Tablosu
-- Aşama 2 - Eksik file_uploads tablosu
-- =====================================================

-- File uploads tablosu
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'DOCUMENT', 'IMAGE', 'VIDEO', 'AUDIO', 'OTHER'
    entity_type VARCHAR(50), -- 'PERSON', 'PROJECT', 'AID_APPLICATION', 'DONATION', etc.
    entity_id UUID, -- İlişkili entity'nin ID'si
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    description TEXT,
    tags TEXT[], -- Dosya etiketleri
    metadata JSONB, -- Ek metadata bilgileri
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_file_uploads_entity ON file_uploads(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_by ON file_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_uploads_file_type ON file_uploads(file_type);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_file_uploads_is_public ON file_uploads(is_public);

-- RLS (Row Level Security) Politikaları
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- Herkes kendi yüklediği dosyaları görebilir
CREATE POLICY "Users can view their own uploads" ON file_uploads
    FOR SELECT USING (uploaded_by = auth.uid());

-- Herkes public dosyaları görebilir
CREATE POLICY "Anyone can view public files" ON file_uploads
    FOR SELECT USING (is_public = true);

-- Kullanıcılar dosya yükleyebilir
CREATE POLICY "Users can upload files" ON file_uploads
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- Kullanıcılar kendi dosyalarını güncelleyebilir
CREATE POLICY "Users can update their own uploads" ON file_uploads
    FOR UPDATE USING (uploaded_by = auth.uid());

-- Kullanıcılar kendi dosyalarını silebilir
CREATE POLICY "Users can delete their own uploads" ON file_uploads
    FOR DELETE USING (uploaded_by = auth.uid());

-- İzinler
GRANT SELECT, INSERT, UPDATE, DELETE ON file_uploads TO authenticated;
GRANT SELECT ON file_uploads TO anon;

-- Updated_at tetikleyicisi
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_file_uploads_updated_at
    BEFORE UPDATE ON file_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Dosya boyutu kontrolü (maksimum 50MB)
ALTER TABLE file_uploads ADD CONSTRAINT check_file_size 
    CHECK (file_size > 0 AND file_size <= 52428800); -- 50MB

-- Dosya tipi kontrolü
ALTER TABLE file_uploads ADD CONSTRAINT check_file_type 
    CHECK (file_type IN ('DOCUMENT', 'IMAGE', 'VIDEO', 'AUDIO', 'OTHER'));

-- Bilgilendirme
SELECT 'File uploads tablosu başarıyla oluşturuldu!' as message;