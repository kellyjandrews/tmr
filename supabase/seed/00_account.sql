INSERT INTO auth.users (
    instance_id, 
    id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    last_sign_in_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    updated_at
) 
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    '00000000-0000-0000-0000-000000000111', 
    'authenticated', 
    'authenticated', 
    'test@test.com', 
    crypt('Password123!', gen_salt('bf')), 
    current_timestamp, 
    current_timestamp, 
    '{"provider":"email","providers":["email"]}', 
    '{}', 
    current_timestamp, 
    current_timestamp
);

-- Insert into Supabase auth.identities
INSERT INTO auth.identities (
    id, 
    user_id, 
    identity_data, 
    provider, 
    provider_id, 
    last_sign_in_at, 
    created_at, 
    updated_at
)
VALUES (
   '00000000-0000-0000-0000-000000000111', 
   '00000000-0000-0000-0000-000000000111', 
    '{"sub": "00000000-0000-0000-0000-000000000111","email":"test@test.com"}', 
    'email', 
    '00000000-0000-0000-0000-000000000111', 
    current_timestamp, 
    current_timestamp, 
    current_timestamp
);

-- Generate a secure salt and hash for the test user
WITH test_user_creds AS (
    SELECT 
        gen_salt('bf') AS salt,
        crypt('Password123!', gen_salt('bf')) AS password_hash
)
INSERT INTO public.accounts (
    id,
    email, 
    username, 
    password_hash, 
    salt,
    auth_type,
    email_verified,
    account_status,
    role
) VALUES (
    '00000000-0000-0000-0000-000000000111',
    'test@test.com',
    'test_user',  -- Fixed: Use a static username for simplicity
    (SELECT password_hash FROM test_user_creds),
    (SELECT salt FROM test_user_creds),
    'email',
    true,
    'active',
    'user'
);

-- Add a test billing record
INSERT INTO public.account_billing (
    account_id,
    billing_email,
    billing_type
) VALUES (
   '00000000-0000-0000-0000-000000000111',
    'test@test.com',
    'individual'
);

-- Add account settings
INSERT INTO public.account_settings (
    account_id,
    theme_preference,
    email_notification_frequency
) VALUES (
   '00000000-0000-0000-0000-000000000111',
    'system',
    'daily'
);

-- Add a test address for the user
INSERT INTO public.account_addresses (
    account_id,
    address_type,
    full_name,
    street_address,
    city,
    state_province,
    postal_code,
    country,
    is_default
) VALUES (
   '00000000-0000-0000-0000-000000000111',
    'primary',
    'Test User',
    '123 Test Street',
    'Testville',
    'TS',
    '12345',
    'US',
    true
);

-- Optional: Insert a test payment method
INSERT INTO public.account_payment_info (
    account_id,
    payment_type,
    provider,
    last_four,
    bin_category,
    expiration_month,
    expiration_year,
    cardholder_name,
    token,
    status
) VALUES (
   '00000000-0000-0000-0000-000000000111',
    'credit_card',
    'Test Bank',
    '1234',
    'credit',
    12,
    2030,
    'Test User',
    'test_payment_token_123',
    'active'
);
