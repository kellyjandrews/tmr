-- Resend Email Integration Tables
-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Email Templates Table
CREATE TABLE public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT NOT NULL,
    template_type TEXT 
        CHECK (template_type IN ('transactional','marketing','notification','system')),
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Email Logs Table
CREATE TABLE public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID,
    email_address TEXT NOT NULL 
        CHECK (email_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    template_id UUID,
    subject TEXT NOT NULL,
    email_type TEXT 
        CHECK (email_type IN ('transactional','marketing','notification','system')),
    related_entity_id UUID,
    related_entity_type TEXT,
    status TEXT 
        CHECK (status IN ('sent','delivered','opened','clicked','bounced','complained','unsubscribed')),
    opens INTEGER DEFAULT 0 
        CHECK (opens >= 0),
    clicks INTEGER DEFAULT 0 
        CHECK (clicks >= 0),
    resend_message_id TEXT,
    metadata JSONB,
    ip_address TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (template_id) REFERENCES public.email_templates(id) ON DELETE SET NULL
);

-- Indexes for email_templates
CREATE INDEX idx_email_templates_name ON public.email_templates(name);
CREATE INDEX idx_email_templates_type ON public.email_templates(template_type);
CREATE INDEX idx_email_templates_active ON public.email_templates(is_active);

-- Indexes for email_logs
CREATE INDEX idx_email_logs_account ON public.email_logs(account_id);
CREATE INDEX idx_email_logs_email ON public.email_logs(email_address);
CREATE INDEX idx_email_logs_template ON public.email_logs(template_id);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_type ON public.email_logs(email_type);
CREATE INDEX idx_email_logs_entity ON public.email_logs(related_entity_id, related_entity_type);
CREATE INDEX idx_email_logs_sent ON public.email_logs(sent_at);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_email_templates_modtime
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Row Level Security Policy
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only admin roles can manage email templates
CREATE POLICY "Admin can manage email templates" 
    ON public.email_templates FOR ALL 
    USING (auth.jwt()->>'role' IN ('admin', 'support'));
    
-- Users can view email logs for their own account
CREATE POLICY "Users can view their own email history" 
    ON public.email_logs FOR SELECT 
    USING (auth.uid() = account_id);

-- Admin roles can view all email logs
CREATE POLICY "Admin can view all email logs" 
    ON public.email_logs FOR SELECT 
    USING (auth.jwt()->>'role' IN ('admin', 'support'));

-- Comments for documentation
COMMENT ON TABLE public.email_templates IS 'Email templates for transactional and marketing communications';
COMMENT ON TABLE public.email_logs IS 'Log of all emails sent through the Resend integration';