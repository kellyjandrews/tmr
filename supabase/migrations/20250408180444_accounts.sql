-- Accounts Database Migration

-- Accounts Table
CREATE TABLE public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email email_type NOT NULL UNIQUE,
    username TEXT UNIQUE 
        CHECK (
            length(username) BETWEEN 3 AND 50 AND 
            username ~* '^[a-z0-9_]+$'
        ),
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    auth_type TEXT DEFAULT 'email' 
        CHECK (auth_type IN ('email','google','facebook','apple','x','linkedin')),
    email_verified BOOLEAN DEFAULT false,
    verification_token TEXT UNIQUE,
    two_factor_secret TEXT,
    two_factor_enabled BOOLEAN DEFAULT false,
    recovery_codes TEXT[],
    last_login TIMESTAMPTZ,
    login_attempts INTEGER DEFAULT 0 
        CHECK (login_attempts >= 0),
    lockout_until TIMESTAMPTZ,
    account_status TEXT DEFAULT 'pending' 
        CHECK (account_status IN ('active','suspended','deleted','pending','limited')),
    role TEXT DEFAULT 'user' 
        CHECK (role IN ('user','seller','admin','moderator','support','content_creator')),
    profile_picture_url url_type,
    preferred_language TEXT 
        CHECK (length(preferred_language) = 2),
    timezone TEXT 
        CHECK (length(timezone) <= 50),
    marketing_opt_in BOOLEAN DEFAULT false,
    referral_code TEXT UNIQUE 
        CHECK (length(referral_code) BETWEEN 6 AND 12),
    referred_by UUID,
    last_activity TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraint
    FOREIGN KEY (referred_by) REFERENCES public.accounts(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_accounts_email ON public.accounts(email);
CREATE INDEX idx_accounts_username ON public.accounts(username);
CREATE INDEX idx_accounts_role ON public.accounts(role);
CREATE INDEX idx_accounts_status ON public.accounts(account_status);
CREATE INDEX idx_accounts_referral ON public.accounts(referral_code);
CREATE INDEX idx_accounts_last_login ON public.accounts(last_login);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_accounts_modtime
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Account Billing Table
CREATE TABLE public.account_billing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL UNIQUE,
    payment_method_id UUID,
    billing_email email_type,
    billing_phone phone_type,
    tax_id_number TEXT 
        CHECK (length(tax_id_number) <= 50),
    billing_type TEXT 
        CHECK (billing_type IN ('individual','business','nonprofit','government')),
    business_name TEXT 
        CHECK (length(business_name) <= 200),
    business_tax_exempt BOOLEAN DEFAULT false,
    vat_registered BOOLEAN DEFAULT false,
    credit_balance DECIMAL(10,2) DEFAULT 0 
        CHECK (credit_balance >= 0),
    total_spend DECIMAL(10,2) DEFAULT 0 
        CHECK (total_spend >= 0),
    last_invoice_date TIMESTAMPTZ,
    annual_spending_tier TEXT 
        CHECK (annual_spending_tier IN ('standard','silver','gold','platinum')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE
);

-- Trigger for public.account_billing updated_at
CREATE TRIGGER update_account_billing_modtime
    BEFORE UPDATE ON public.account_billing
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Account Payment Info Table
CREATE TABLE public.account_payment_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL,
    payment_type TEXT 
        CHECK (payment_type IN ('credit_card','debit_card','paypal','bank_transfer','crypto','apple_pay','google_pay','venmo')),
    provider TEXT 
        CHECK (length(provider) <= 100),
    last_four TEXT 
        CHECK (last_four ~* '^\d{4}$'),
    bin_category TEXT 
        CHECK (bin_category IN ('debit','credit','prepaid','corporate')),
    expiration_month INTEGER 
        CHECK (expiration_month BETWEEN 1 AND 12),
    expiration_year INTEGER 
        CHECK (expiration_year BETWEEN 2023 AND 2050),
    cardholder_name TEXT 
        CHECK (length(cardholder_name) <= 200),
    billing_address_id UUID,
    is_default BOOLEAN DEFAULT false,
    token TEXT NOT NULL,
    verification_attempts INTEGER DEFAULT 0 
        CHECK (verification_attempts >= 0),
    last_verification_attempt TIMESTAMPTZ,
    status TEXT DEFAULT 'pending_verification' 
        CHECK (status IN ('active','expired','invalid','suspended','pending_verification')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE
);

-- Indexes for public.account_payment_info
CREATE INDEX idx_payment_info_account ON public.account_payment_info(account_id);
CREATE INDEX idx_payment_info_type ON public.account_payment_info(payment_type);
CREATE INDEX idx_payment_info_status ON public.account_payment_info(status);

-- Trigger for public.account_payment_info updated_at
CREATE TRIGGER update_account_payment_info_modtime
    BEFORE UPDATE ON public.account_payment_info
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Account Settings Table
CREATE TABLE public.account_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL UNIQUE,
    notification_preferences JSONB,
    privacy_settings JSONB,
    display_preferences JSONB,
    communication_channels JSONB,
    theme_preference TEXT 
        CHECK (theme_preference IN ('light','dark','system','high_contrast')),
    color_scheme TEXT 
        CHECK (color_scheme IN ('default','deuteranopia','protanopia','tritanopia')),
    email_notification_frequency TEXT DEFAULT 'daily'
        CHECK (email_notification_frequency IN ('immediate','daily','weekly','never','digest')),
    sms_notifications_enabled BOOLEAN DEFAULT false,
    push_notifications_enabled BOOLEAN DEFAULT false,
    data_sharing_consent BOOLEAN DEFAULT false,
    accessibility_mode BOOLEAN DEFAULT false,
    content_filter_level TEXT DEFAULT 'mild'
        CHECK (content_filter_level IN ('none','mild','moderate','strict')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE
);

-- Trigger for public.account_settings updated_at
CREATE TRIGGER update_account_settings_modtime
    BEFORE UPDATE ON public.account_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Account Sessions Table
CREATE TABLE public.account_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    refresh_token TEXT UNIQUE,
    ip_address ip_address_type,
    user_agent TEXT 
        CHECK (length(user_agent) <= 500),
    device_fingerprint TEXT,
    device_type TEXT 
        CHECK (device_type IN ('mobile','desktop','tablet','smart_tv','console','other')),
    login_method TEXT 
        CHECK (login_method IN ('password','oauth','two_factor','magic_link','biometric')),
    location JSONB,
    is_active BOOLEAN DEFAULT true,
    security_level TEXT 
        CHECK (security_level IN ('low','medium','high')),
    mfa_authenticated BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE
);

-- Indexes for public.account_sessions
CREATE INDEX idx_sessions_account ON public.account_sessions(account_id);
CREATE INDEX idx_sessions_token ON public.account_sessions(session_token);
CREATE INDEX idx_sessions_active ON public.account_sessions(is_active);

-- Account Addresses Table
CREATE TABLE public.account_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL,
    address_type TEXT 
        CHECK (address_type IN ('shipping','billing','primary','work','home','temporary','pickup')),
    full_name TEXT NOT NULL 
        CHECK (length(full_name) BETWEEN 2 AND 200),
    organization_name TEXT 
        CHECK (length(organization_name) <= 200),
    street_address TEXT NOT NULL 
        CHECK (length(street_address) BETWEEN 5 AND 500),
    street_address_2 TEXT 
        CHECK (length(street_address_2) <= 500),
    city TEXT NOT NULL 
        CHECK (length(city) BETWEEN 2 AND 100),
    state_province TEXT 
        CHECK (length(state_province) <= 100),
    postal_code TEXT NOT NULL 
        CHECK (length(postal_code) BETWEEN 3 AND 20),
    country TEXT NOT NULL 
        CHECK (length(country) = 2),
    phone phone_type,
    is_default BOOLEAN DEFAULT false,
    is_commercial BOOLEAN DEFAULT false,
    latitude DECIMAL(10,8) 
        CHECK (latitude BETWEEN -90 AND 90),
    longitude DECIMAL(11,8) 
        CHECK (longitude BETWEEN -180 AND 180),
    address_verification_status TEXT DEFAULT 'unverified'
        CHECK (address_verification_status IN ('unverified','verified','invalid','pending')),
    verification_source TEXT 
        CHECK (verification_source IN ('usps','third_party','manual','user_confirmed')),
    plus_four_code TEXT 
        CHECK (plus_four_code ~* '^\d{4}$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE
);

-- Indexes for public.account_addresses
CREATE INDEX idx_addresses_account ON public.account_addresses(account_id);
CREATE INDEX idx_addresses_type ON public.account_addresses(address_type);
CREATE INDEX idx_addresses_verification ON public.account_addresses(address_verification_status);

-- Trigger for public.account_addresses updated_at
CREATE TRIGGER update_account_addresses_modtime
    BEFORE UPDATE ON public.account_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Row Level Security Policies
-- Note: These are basic examples and should be customized based on specific requirements

-- public.accounts RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and edit their own account" 
    ON public.accounts FOR ALL 
    USING (auth.uid() = id);

-- Account Billing RLS
ALTER TABLE public.account_billing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and edit their own billing info" 
    ON public.account_billing FOR ALL 
    USING (auth.uid() = account_id);

-- Account Payment Info RLS
ALTER TABLE public.account_payment_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and edit their own payment methods" 
    ON public.account_payment_info FOR ALL 
    USING (auth.uid() = account_id);

-- Account Settings RLS
ALTER TABLE public.account_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and edit their own settings" 
    ON public.account_settings FOR ALL 
    USING (auth.uid() = account_id);

-- Account Sessions RLS
ALTER TABLE public.account_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sessions" 
    ON public.account_sessions FOR SELECT 
    USING (auth.uid() = account_id);

-- Account Addresses RLS
ALTER TABLE public.account_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and edit their own addresses" 
    ON public.account_addresses FOR ALL 
    USING (auth.uid() = account_id);

-- Comments for future reference
COMMENT ON TABLE public.accounts IS 'Stores user account information with comprehensive authentication and profile details';
COMMENT ON TABLE public.account_billing IS 'Billing information and financial tracking for user accounts';
COMMENT ON TABLE public.account_payment_info IS 'Secure storage of user payment methods';
COMMENT ON TABLE public.account_settings IS 'User preferences and account settings';
COMMENT ON TABLE public.account_sessions IS 'Tracking of user login sessions and authentication events';
COMMENT ON TABLE public.account_addresses IS 'User address book with verification capabilities';