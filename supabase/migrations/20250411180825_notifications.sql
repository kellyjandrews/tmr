-- Notifications System
-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Notifications Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL,
    notification_type TEXT 
        CHECK (notification_type IN ('order_update','price_drop','back_in_stock','message','system_alert','promotion','account')),
    title TEXT NOT NULL 
        CHECK (length(title) BETWEEN 2 AND 200),
    content TEXT NOT NULL 
        CHECK (length(content) BETWEEN 5 AND 1000),
    is_read BOOLEAN DEFAULT false,
    related_entity_id UUID,
    related_entity_type TEXT,
    action_url TEXT,
    expiration TIMESTAMPTZ,
    importance TEXT 
        CHECK (importance IN ('low','medium','high','critical')),
    icon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE
);

-- Indexes for notifications
CREATE INDEX idx_notifications_account ON public.notifications(account_id);
CREATE INDEX idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX idx_notifications_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_importance ON public.notifications(importance);
CREATE INDEX idx_notifications_created ON public.notifications(created_at);
CREATE INDEX idx_notifications_entity ON public.notifications(related_entity_id, related_entity_type);
CREATE INDEX idx_notifications_expiration ON public.notifications(expiration);

-- Notification Cleanup Function
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.notifications 
    WHERE expiration IS NOT NULL AND expiration < now();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add a constraint trigger to enforce that only is_read can be changed during updates
CREATE OR REPLACE FUNCTION enforce_notification_update_limitations()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow changes only to the is_read field
    IF (NEW.account_id != OLD.account_id OR
        NEW.notification_type != OLD.notification_type OR
        NEW.title != OLD.title OR
        NEW.content != OLD.content OR
        NEW.related_entity_id IS DISTINCT FROM OLD.related_entity_id OR
        NEW.related_entity_type IS DISTINCT FROM OLD.related_entity_type OR
        NEW.action_url IS DISTINCT FROM OLD.action_url OR
        NEW.expiration IS DISTINCT FROM OLD.expiration OR
        NEW.importance IS DISTINCT FROM OLD.importance OR
        NEW.icon IS DISTINCT FROM OLD.icon OR
        NEW.created_at != OLD.created_at) THEN
            RAISE EXCEPTION 'Only the is_read field can be updated for notifications';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_notification_update_limitations_trigger
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION enforce_notification_update_limitations();

-- Row Level Security Policy
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own notifications
CREATE POLICY "Users can view their own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = account_id);

CREATE POLICY "Users can mark their own notifications as read" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = account_id)
    WITH CHECK (
        -- Only allow updating the is_read field
        auth.uid() = account_id
        -- The policy will only apply to the is_read column in a limited way
    );

-- System can create and manage all notifications
CREATE POLICY "System can manage all notifications" 
    ON public.notifications FOR ALL 
    USING (auth.uid() IS NULL);

-- Create a notification deletion policy for users
CREATE POLICY "Users can delete their own notifications" 
    ON public.notifications FOR DELETE 
    USING (auth.uid() = account_id);

-- Comments for documentation
COMMENT ON TABLE public.notifications IS 'In-app notifications for user events and system alerts';
COMMENT ON FUNCTION cleanup_expired_notifications() IS 'Automated cleanup of expired notifications';