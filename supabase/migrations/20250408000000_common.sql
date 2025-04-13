-- Common Functions Database Migration
-- Create extensions used throughout the project
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Common domain types for validation
CREATE DOMAIN email_type AS TEXT
CHECK(VALUE ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

CREATE DOMAIN url_type AS TEXT 
CHECK(VALUE ~* '^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$');

CREATE DOMAIN phone_type AS TEXT 
CHECK(VALUE ~* '^\+?[1-9]\d{1,14}$');

CREATE DOMAIN ip_address_type AS TEXT
CHECK(VALUE ~* '^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$' OR 
      VALUE ~* '^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate URL-friendly slugs
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
BEGIN
    -- Convert to lowercase
    slug := lower(input_text);
    
    -- Replace non-alphanumeric characters with hyphens
    slug := regexp_replace(slug, '[^a-z0-9]+', '-', 'g');
    
    -- Remove leading and trailing hyphens
    slug := trim(both '-' from slug);
    
    RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Helper function for password complexity check
CREATE OR REPLACE FUNCTION is_password_complex(password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN 
        length(password) >= 12 AND
        password ~ '[A-Z]' AND  -- At least one uppercase letter
        password ~ '[a-z]' AND  -- At least one lowercase letter
        password ~ '\d' AND     -- At least one digit
        password ~ '[!@#$%^&*(),.?":{}|<>]';  -- At least one special character
END;
$$ LANGUAGE plpgsql;

-- Function to anonymize email for non-admin views
CREATE OR REPLACE FUNCTION anonymize_email(email TEXT)
RETURNS TEXT AS $$
DECLARE
    username TEXT;
    domain TEXT;
BEGIN
    -- Split email into username and domain
    username := split_part(email, '@', 1);
    domain := split_part(email, '@', 2);
    
    -- Anonymize username, keep first and last characters
    IF length(username) > 2 THEN
        username := substring(username from 1 for 1) || 
                   repeat('*', least(length(username) - 2, 4)) || 
                   substring(username from length(username));
    END IF;
    
    RETURN username || '@' || domain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log a global event
CREATE OR REPLACE FUNCTION log_global_event(
    p_event_namespace TEXT,
    p_event_type TEXT,
    p_entity_id UUID,
    p_related_entity_id UUID DEFAULT NULL,
    p_account_id UUID DEFAULT NULL,
    p_data JSONB DEFAULT '{}'::JSONB,
    p_severity TEXT DEFAULT 'info',
    p_source TEXT DEFAULT 'system'
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
    client_ip TEXT;
    client_user_agent TEXT;
BEGIN
    -- Attempt to get client IP and user agent from request headers
    BEGIN
        client_ip := nullif(current_setting('request.headers', true)::json->>'x-forwarded-for', '')::TEXT;
        client_user_agent := nullif(current_setting('request.headers', true)::json->>'user-agent', '')::TEXT;
    EXCEPTION
        WHEN OTHERS THEN
            client_ip := NULL;
            client_user_agent := NULL;
    END;

    -- Insert the event into global_events table
    INSERT INTO public.global_events (
        id,
        event_namespace,
        event_type,
        entity_id,
        related_entity_id,
        account_id,
        ip_address,
        user_agent,
        severity,
        data,
        source,
        created_at
    ) VALUES (
        uuid_generate_v4(),
        p_event_namespace,
        p_event_type,
        p_entity_id,
        p_related_entity_id,
        p_account_id,
        client_ip,
        client_user_agent,
        p_severity,
        p_data,
        p_source,
        now()
    )
    RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_modified_column IS 'Automatically updates the updated_at timestamp on record modification';
COMMENT ON FUNCTION generate_slug IS 'Generates a URL-friendly slug from any text input';
COMMENT ON FUNCTION is_password_complex IS 'Validates password complexity requirements';
COMMENT ON FUNCTION anonymize_email IS 'Masks email for privacy protection';
COMMENT ON FUNCTION log_global_event IS 'Centralized event logging for system-wide activity tracking';