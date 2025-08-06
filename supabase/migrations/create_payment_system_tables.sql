-- Ödeme Sistemi Tabloları
-- Bu dosya ödeme sistemi için gerekli tüm tabloları oluşturur

-- Ödeme yöntemleri tablosu
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'card', 'bank_account', 'wallet'
    brand VARCHAR(50), -- 'visa', 'mastercard', 'amex', etc.
    last4 VARCHAR(4),
    exp_month INTEGER,
    exp_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ödemeler tablosu
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_charge_id VARCHAR(255),
    user_id UUID REFERENCES auth.users(id),
    person_id INTEGER REFERENCES kisiler(id),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    status VARCHAR(50) NOT NULL, -- 'pending', 'succeeded', 'failed', 'canceled', 'refunded'
    payment_method_id UUID REFERENCES payment_methods(id),
    payment_type VARCHAR(50) NOT NULL, -- 'donation', 'membership_fee', 'aid_payment', 'project_funding'
    entity_type VARCHAR(50), -- 'bagis', 'aidat', 'proje', 'yardim'
    entity_id UUID,
    description TEXT,
    metadata JSONB,
    fee_amount DECIMAL(10,2), -- Stripe fee
    net_amount DECIMAL(12,2), -- Amount after fees
    receipt_url TEXT,
    failure_reason TEXT,
    refunded_amount DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abonelikler tablosu (düzenli ödemeler için)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    person_id INTEGER REFERENCES kisiler(id),
    status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'incomplete', 'past_due', 'unpaid'
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    interval_type VARCHAR(20) NOT NULL, -- 'month', 'year'
    interval_count INTEGER DEFAULT 1,
    subscription_type VARCHAR(50) NOT NULL, -- 'monthly_donation', 'membership_fee', 'sponsorship'
    entity_type VARCHAR(50), -- 'bagis', 'aidat', 'sponsorluk'
    entity_id UUID,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abonelik ödemeleri tablosu
CREATE TABLE subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id),
    stripe_invoice_id VARCHAR(255),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'paid', 'pending', 'failed'
    attempt_count INTEGER DEFAULT 0,
    next_payment_attempt TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bağış kampanyaları tablosu
CREATE TABLE donation_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(12,2),
    current_amount DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'TRY',
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'AKTIF', -- 'AKTIF', 'TAMAMLANDI', 'IPTAL'
    image_url TEXT,
    qr_code_data TEXT, -- QR kod için veri
    stripe_product_id VARCHAR(255),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR kod ödemeleri tablosu
CREATE TABLE qr_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    campaign_id UUID REFERENCES donation_campaigns(id),
    amount DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'TRY',
    description TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    payment_id UUID REFERENCES payments(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geri ödemeler tablosu
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_refund_id VARCHAR(255) UNIQUE NOT NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    reason VARCHAR(100), -- 'duplicate', 'fraudulent', 'requested_by_customer'
    status VARCHAR(50) NOT NULL, -- 'pending', 'succeeded', 'failed', 'canceled'
    failure_reason TEXT,
    receipt_number VARCHAR(255),
    refunded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook olayları tablosu
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    data JSONB NOT NULL,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_type ON payments(payment_type);
CREATE INDEX idx_payments_entity ON payments(entity_type, entity_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX idx_donation_campaigns_status ON donation_campaigns(status);
CREATE INDEX idx_qr_payments_code ON qr_payments(qr_code);
CREATE INDEX idx_qr_payments_campaign ON qr_payments(campaign_id);
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);

-- RLS Politikaları
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Payment Methods RLS
CREATE POLICY "Users can view their own payment methods" ON payment_methods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods" ON payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" ON payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" ON payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- Payments RLS
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert payments" ON payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "System can update payments" ON payments
    FOR UPDATE USING (true);

-- Subscriptions RLS
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update subscriptions" ON subscriptions
    FOR UPDATE USING (true);

-- Subscription Payments RLS
CREATE POLICY "Users can view subscription payments" ON subscription_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM subscriptions s 
            WHERE s.id = subscription_payments.subscription_id 
            AND s.user_id = auth.uid()
        )
    );

-- Donation Campaigns RLS
CREATE POLICY "Everyone can view active campaigns" ON donation_campaigns
    FOR SELECT USING (status = 'AKTIF');

CREATE POLICY "Authenticated users can create campaigns" ON donation_campaigns
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

CREATE POLICY "Campaign creators can update their campaigns" ON donation_campaigns
    FOR UPDATE USING (auth.uid() = created_by);

-- QR Payments RLS
CREATE POLICY "Everyone can view QR payments" ON qr_payments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create QR payments" ON qr_payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "System can update QR payments" ON qr_payments
    FOR UPDATE USING (true);

-- Refunds RLS
CREATE POLICY "Users can view refunds for their payments" ON refunds
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM payments p 
            WHERE p.id = refunds.payment_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Authorized users can create refunds" ON refunds
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Webhook Events RLS (sadece sistem erişimi)
CREATE POLICY "System only access" ON webhook_events
    FOR ALL USING (false);

-- Fonksiyonlar

-- Kampanya tutarını güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_campaign_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'succeeded' AND NEW.payment_type = 'donation' THEN
        UPDATE donation_campaigns 
        SET current_amount = current_amount + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.entity_id::UUID
        AND NEW.entity_type = 'bagis';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Başarılı ödeme sonrası kampanya tutarını güncelle
CREATE TRIGGER trigger_update_campaign_amount
    AFTER UPDATE OF status ON payments
    FOR EACH ROW
    WHEN (NEW.status = 'succeeded' AND OLD.status != 'succeeded')
    EXECUTE FUNCTION update_campaign_amount();

-- Abonelik durumunu güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Başarısız ödeme durumunda abonelik durumunu güncelle
    IF NEW.status = 'failed' THEN
        UPDATE subscriptions 
        SET status = 'past_due',
            updated_at = NOW()
        WHERE id = NEW.subscription_id;
    ELSIF NEW.status = 'paid' THEN
        UPDATE subscriptions 
        SET status = 'active',
            updated_at = NOW()
        WHERE id = NEW.subscription_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Abonelik ödemesi durumu değiştiğinde abonelik durumunu güncelle
CREATE TRIGGER trigger_update_subscription_status
    AFTER INSERT OR UPDATE OF status ON subscription_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_status();

-- Varsayılan ödeme yöntemi güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        -- Diğer ödeme yöntemlerini varsayılan olmaktan çıkar
        UPDATE payment_methods 
        SET is_default = false,
            updated_at = NOW()
        WHERE user_id = NEW.user_id 
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Varsayılan ödeme yöntemi değiştiğinde diğerlerini güncelle
CREATE TRIGGER trigger_update_default_payment_method
    AFTER INSERT OR UPDATE OF is_default ON payment_methods
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION update_default_payment_method();

-- Yetkilendirme: anon ve authenticated rollere gerekli izinleri ver
GRANT SELECT, INSERT, UPDATE ON payment_methods TO authenticated;
GRANT SELECT, INSERT, UPDATE ON payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON subscriptions TO authenticated;
GRANT SELECT ON subscription_payments TO authenticated;
GRANT SELECT ON donation_campaigns TO anon, authenticated;
GRANT INSERT, UPDATE ON donation_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE ON qr_payments TO authenticated;
GRANT SELECT ON refunds TO authenticated;
GRANT INSERT ON refunds TO authenticated;

-- Webhook events sadece service role erişimi
GRANT ALL ON webhook_events TO service_role;

COMMIT;