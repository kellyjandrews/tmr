-- Supabase-specific Authentication Enhancements

-- Function to handle secure username generation
CREATE OR REPLACE FUNCTION generate_unique_username(base_username TEXT)
RETURNS TEXT AS $$
DECLARE
    unique_username TEXT;
    counter INTEGER := 0;
BEGIN
    base_username := lower(trim(base_username));
    base_username := regexp_replace(base_username, '[^a-z0-9_]', '_', 'g');
    base_username := substring(base_username from 1 for 47);
    
    unique_username := base_username;
    
    WHILE EXISTS(SELECT 1 FROM accounts WHERE username = unique_username) LOOP
        counter := counter + 1;
        unique_username := base_username || '_' || counter;
        
        -- Prevent infinite loop and ensure username doesn't exceed 50 characters
        IF counter > 100 THEN
            RAISE EXCEPTION 'Could not generate unique username after 100 attempts';
        END IF;
    END LOOP;
    
    RETURN unique_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Trigger to ensure unique, lowercase username on insert
CREATE OR REPLACE FUNCTION enforce_username_rules()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure username is lowercase and uses only allowed characters
    IF NEW.username IS NOT NULL THEN
        NEW.username := lower(NEW.username);
        NEW.username := regexp_replace(NEW.username, '[^a-z0-9_]', '_', 'g');
        
        -- Generate unique username if needed
        IF EXISTS(SELECT 1 FROM accounts WHERE username = NEW.username AND id != NEW.id) THEN
            NEW.username := generate_unique_username(NEW.username);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_username_uniqueness
BEFORE INSERT OR UPDATE ON public.accounts
FOR EACH ROW EXECUTE FUNCTION enforce_username_rules();

-- Audit trail for critical account changes
CREATE TABLE public.account_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES public.accounts(id) ON DELETE SET NULL
);

-- Function to log account changes
CREATE OR REPLACE FUNCTION log_account_changes()
RETURNS TRIGGER AS $$
DECLARE
    audit_data JSONB;
BEGIN
    -- Only log if there's an actual change
    IF (TG_OP = 'UPDATE' AND (OLD.* IS DISTINCT FROM NEW.*)) OR 
       (TG_OP = 'DELETE') THEN
        
        -- Prepare audit log data
        audit_data := jsonb_build_object(
            'action_type', TG_OP,
            'account_id', COALESCE(NEW.id, OLD.id),
            'old_data', to_jsonb(OLD),
            'new_data', to_jsonb(NEW),
            'changed_by', current_setting('request.jwt.claims', true)::jsonb->>'sub',
            'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
            'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent'
        );
        
        -- Insert audit log
        INSERT INTO public.account_audit_log (
            account_id, action_type, old_data, new_data, 
            changed_by, ip_address, user_agent
        ) VALUES (
            COALESCE(NEW.id, OLD.id),
            TG_OP,
            to_jsonb(OLD),
            to_jsonb(NEW),
            (audit_data->>'changed_by')::UUID,
            audit_data->>'ip_address',
            audit_data->>'user_agent'
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger audit logging for public.accounts table
CREATE TRIGGER account_audit_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.accounts
FOR EACH ROW EXECUTE FUNCTION log_account_changes();

-- Additional security views for admin reporting
CREATE OR REPLACE VIEW account_security_overview AS
SELECT 
    id,
    email,
    anonymize_email(email) AS anonymized_email,
    username,
    auth_type,
    account_status,
    last_login,
    login_attempts,
    lockout_until,
    two_factor_enabled,
    created_at
FROM public.accounts
WHERE account_status != 'deleted';

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

-- Extend public.accounts table to include password complexity validation
ALTER TABLE public.accounts 
ADD CONSTRAINT password_complexity 
CHECK (is_password_complex(password_hash));

-- Performance and security extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Comprehensive account search function (for admin use)
CREATE OR REPLACE FUNCTION search_accounts(
    search_term TEXT DEFAULT NULL,
    status_filter TEXT[] DEFAULT NULL,
    role_filter TEXT[] DEFAULT NULL,
    created_after TIMESTAMPTZ DEFAULT NULL,
    created_before TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    username TEXT,
    account_status TEXT,
    role TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        a.id, 
        anonymize_email(a.email) AS email, 
        a.username, 
        a.account_status, 
        a.role, 
        a.created_at
    FROM public.accounts a
    WHERE 
        (search_term IS NULL OR 
            (
                a.email ILIKE '%' || search_term || '%' OR 
                a.username ILIKE '%' || search_term || '%'
            )
        ) AND
        (status_filter IS NULL OR a.account_status = ANY(status_filter)) AND
        (role_filter IS NULL OR a.role = ANY(role_filter)) AND
        (created_after IS NULL OR a.created_at >= created_after) AND
        (created_before IS NULL OR a.created_at <= created_before);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments and documentation
COMMENT ON FUNCTION generate_unique_username IS 'Generates a unique username ensuring no duplicates';
COMMENT ON FUNCTION anonymize_email IS 'Masks email for privacy protection';
COMMENT ON FUNCTION search_accounts IS 'Secure account search with privacy controls';
COMMENT ON TABLE public.account_audit_log IS 'Tracks all critical changes to user accounts for security and compliance';