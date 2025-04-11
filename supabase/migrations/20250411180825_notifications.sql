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
        (OLD.account_id = NEW.account_id) AND
        (OLD.notification_type = NEW.notification_type) AND
        (OLD.title = NEW.title) AND
        (OLD.content = NEW.content) AND
        (OLD.related_entity_id = NEW.related_entity_id) AND
        (OLD.related_entity_type = NEW.related_entity_type) AND
        (OLD.action_url = NEW.action_url) AND
        (OLD.expiration = NEW.expiration) AND
        (OLD.importance = NEW.importance) AND
        (OLD.icon = NEW.icon) AND
        (OLD.created_at = NEW.created_at)
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