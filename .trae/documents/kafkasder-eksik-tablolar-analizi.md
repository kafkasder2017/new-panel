# KAFKASDER Projesi - Eksik Tablolar Analizi

## 1. Genel Durum

KAFKASDER dernek yönetim paneli projesinde mevcut veritabanı şeması ile gerçek implementasyon arasında önemli farklar tespit edilmiştir. Kullanıcının belirttiği gibi, login tablosu dahil olmak üzere birçok tablo eksiktir.

## 2. Authentication Sistemi Eksiklikleri

### 2.1 Mevcut Durum
- **Supabase Auth**: `auth.users` tablosu kullanılıyor
- **User Profiles**: `user_profiles` tablosu dokümante edilmiş ancak implementasyonda `kullanicilar` tablosu kullanılıyor
- **Login Tablosu**: Ayrı bir login tablosu yok, Supabase auth sistemi kullanılıyor

### 2.2 Eksik Tablolar
```sql
-- Kullanıcı oturum takibi için
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Başarısız giriş denemeleri
CREATE TABLE failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    ip_address INET,
    attempt_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT
);

-- Şifre sıfırlama istekleri
CREATE TABLE password_reset_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reset_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 3. Ana Modül Tabloları - Eksiklikler

### 3.1 Dokümante Edilmiş Ancak Eksik Tablolar

#### Kişi Yönetimi
- ✅ `people` (dokümante) → ❌ `kisiler` (implementasyonda)
- ❌ `person_documents` (eksik)
- ❌ `person_notes` (eksik)
- ❌ `person_photos` (eksik)

#### Yardım Yönetimi
- ✅ `aid_applications` (dokümante) → ❌ `yardim_basvurulari` (implementasyonda)
- ❌ `aid_payments` (eksik)
- ❌ `aid_categories` (eksik)

#### Bağış Yönetimi
- ✅ `donations` (dokümante) → ❌ `bagislar` (implementasyonda)
- ❌ `donation_items` (eksik)
- ❌ `donation_campaigns` (eksik)

#### Proje Yönetimi
- ✅ `projects` (dokümante) → ❌ `projeler` (implementasyonda)
- ❌ `project_participants` (eksik)
- ❌ `project_milestones` (eksik)

#### Finansal Yönetim
- ✅ `financial_transactions` (dokümante) → ❌ `finansal_kayitlar` (implementasyonda)
- ❌ `financial_categories` (eksik)
- ❌ `budget_plans` (eksik)

#### Üyelik Yönetimi
- ❌ `memberships` (tamamen eksik)
- ❌ `membership_fees` (aidatlar için)
- ❌ `membership_types` (eksik)

### 3.2 Implementasyonda Var Ancak Dokümante Edilmemiş
- ✅ `kullanicilar`
- ✅ `kisiler`
- ✅ `yardim_basvurulari`
- ✅ `bagislar`
- ✅ `projeler`
- ✅ `davalar`
- ✅ `odemeler`
- ✅ `finansal_kayitlar`
- ✅ `gonulluler`
- ✅ `vefa_destek`
- ✅ `kumbaralar`
- ✅ `depo_urunleri`
- ✅ `yetimler`
- ✅ `ogrenci_burslari`
- ✅ `etkinlikler`
- ✅ `gonderilen_mesajlar`
- ✅ `ayni_yardim_islemleri`
- ✅ `hizmetler`
- ✅ `hastane_sevkler`
- ✅ `denetim_kayitlari`
- ✅ `yorumlar`
- ✅ `kurumlar`

## 4. Kritik Eksik Tablolar

### 4.1 Yüksek Öncelik
```sql
-- 1. Kişi belgeleri
CREATE TABLE person_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id INTEGER REFERENCES kisiler(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Kişi notları
CREATE TABLE person_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id INTEGER REFERENCES kisiler(id) ON DELETE CASCADE,
    note_content TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'GENEL',
    is_important BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Yardım ödemeleri
CREATE TABLE aid_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id INTEGER REFERENCES yardim_basvurulari(id) ON DELETE CASCADE,
    payment_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    payment_reference VARCHAR(255),
    notes TEXT,
    paid_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Üyelik sistemi
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id INTEGER REFERENCES kisiler(id) ON DELETE CASCADE,
    membership_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'AKTIF',
    monthly_fee DECIMAL(10,2),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Aidat takibi
CREATE TABLE membership_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID REFERENCES memberships(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL, -- '2024-01'
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'BEKLEMEDE',
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.2 Orta Öncelik
```sql
-- 6. Bildirimler sistemi
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Sistem logları
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

-- 8. Dosya sistemi
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- 'person', 'project', 'financial'
    entity_id UUID,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.3 Düşük Öncelik
```sql
-- 9. Proje katılımcıları
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

-- 10. Bağış kampanyaları
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
```

## 5. Implementasyon Önerileri

### 5.1 Aşama 1 (Acil - 1-2 hafta)
1. **Authentication tabloları**: `user_sessions`, `failed_login_attempts`
2. **Kişi yönetimi**: `person_documents`, `person_notes`
3. **Yardım sistemi**: `aid_payments`

### 5.2 Aşama 2 (Orta vadeli - 3-4 hafta)
1. **Üyelik sistemi**: `memberships`, `membership_fees`
2. **Bildirimler**: `notifications`
3. **Dosya yönetimi**: `file_uploads`

### 5.3 Aşama 3 (Uzun vadeli - 5-8 hafta)
1. **Audit sistemi**: `activity_logs`
2. **Proje yönetimi**: `project_participants`
3. **Kampanya yönetimi**: `donation_campaigns`

## 6. Migration Stratejisi

### 6.1 Veri Uyumluluğu
- Mevcut `kullanicilar` tablosunu `user_profiles` ile uyumlu hale getirme
- `kisiler` tablosunu `people` şemasına göre güncelleme
- Foreign key ilişkilerini düzenleme

### 6.2 Güvenlik
- Tüm yeni tablolar için RLS politikaları
- Uygun indekslerin eklenmesi
- Backup stratejisi

### 6.3 Test Stratejisi
- Staging ortamında test
- Veri migrasyonu testleri
- Performance testleri

## 7. Sonuç

KAFKASDER projesinde **toplam 15+ kritik tablo eksik**tir. En önemli eksiklikler:

1. **Authentication sistemi tabloları** (login tracking, security)
2. **Kişi yönetimi detay tabloları** (belgeler, notlar, fotoğraflar)
3. **Üyelik ve aidat sistemi** (tamamen eksik)
4. **Bildirim sistemi** (kullanıcı deneyimi için kritik)
5. **Audit ve log sistemi** (güvenlik ve takip için gerekli)

Bu eksikliklerin giderilmesi projenin tam fonksiyonel hale gelmesi için kritik öneme sahiptir.