-- Create a type to return conversation details with all related information
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_details') THEN
    DROP TYPE conversation_details CASCADE;
  END IF;
END $$;

-- Then create the type
CREATE TYPE conversation_details AS (
  id UUID,
  title TEXT,
  listing_id UUID,
  order_id UUID,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  participants JSONB,
  latest_message JSONB,
  listing JSONB,
  order_info JSONB,
  unread_count INTEGER
);

-- 1. Get all conversations for a user with related data
CREATE OR REPLACE FUNCTION get_user_conversations_with_details(user_id_param UUID)
RETURNS SETOF conversation_details
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
SET search_path = public
AS $$
DECLARE
  conversation_record RECORD;
  result conversation_details;
BEGIN
  -- Find all conversations where the user is a participant
  FOR conversation_record IN
    SELECT c.*
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    WHERE cp.user_id = user_id
    ORDER BY c.last_message_at DESC NULLS LAST
  LOOP
    -- Set basic conversation fields
    result.id := conversation_record.id;
    result.title := conversation_record.title;
    result.listing_id := conversation_record.listing_id;
    result.order_id := conversation_record.order_id;
    result.last_message_at := conversation_record.last_message_at;
    result.created_at := conversation_record.created_at;
    result.updated_at := conversation_record.updated_at;
    
    -- Get participants
    SELECT jsonb_agg(jsonb_build_object(
      'user_id', cp.user_id,
      'last_read_at', cp.last_read_at,
      'profiles', jsonb_build_object(
        'id', p.id,
        'email', p.email,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url
      )
    ))
    INTO result.participants
    FROM conversation_participants cp
    JOIN profiles p ON cp.user_id = p.id
    WHERE cp.conversation_id = conversation_record.id;
    
    -- Get latest message
    SELECT jsonb_build_object(
      'id', m.id,
      'sender_id', m.sender_id,
      'content', m.content,
      'created_at', m.created_at
    )
    INTO result.latest_message
    FROM messages m
    WHERE m.conversation_id = conversation_record.id
    ORDER BY m.created_at DESC
    LIMIT 1;
    
    -- Get listing if applicable
    IF conversation_record.listing_id IS NOT NULL THEN
      SELECT jsonb_build_object(
        'id', l.id,
        'name', l.name,
        'slug', l.slug,
        'image_url', l.image_url
      )
      INTO result.listing
      FROM listings l
      WHERE l.id = conversation_record.listing_id;
    END IF;
    
    -- Get order if applicable
    IF conversation_record.order_id IS NOT NULL THEN
      SELECT jsonb_build_object(
        'id', o.id,
        'status', o.status
      )
      INTO result.order
      FROM orders o
      WHERE o.id = conversation_record.order_id;
    END IF;
    
    -- Get unread count
    SELECT COUNT(*)
    INTO result.unread_count
    FROM messages m
    JOIN conversation_participants cp 
      ON cp.conversation_id = m.conversation_id AND cp.user_id = user_id_param
    WHERE 
      m.conversation_id = conversation_record.id
      AND m.sender_id != user_id_param
      AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at);
    
    RETURN NEXT result;
  END LOOP;
  
  RETURN;
END;
$$;

-- 2. Get a single conversation with all related data
CREATE OR REPLACE FUNCTION get_conversation_details(conversation_id UUID, user_id_param UUID)
RETURNS conversation_details
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result conversation_details;
  is_participant BOOLEAN;
BEGIN
  -- Check if user is a participant in this conversation
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = get_conversation_details.conversation_id
    AND user_id_param = get_conversation_details.user_id
  ) INTO is_participant;
  
  -- Return NULL if user is not a participant
  IF NOT is_participant THEN
    RETURN NULL;
  END IF;
  
  -- Get conversation data
  SELECT 
    c.id, c.title, c.listing_id, c.order_id, 
    c.last_message_at, c.created_at, c.updated_at
  INTO 
    result.id, result.title, result.listing_id, result.order_id,
    result.last_message_at, result.created_at, result.updated_at
  FROM conversations c
  WHERE c.id = conversation_id;
  
  -- Get participants (same as in get_user_conversations_with_details)
  SELECT jsonb_agg(jsonb_build_object(
    'user_id', cp.user_id,
    'last_read_at', cp.last_read_at,
    'profiles', jsonb_build_object(
      'id', p.id,
      'email', p.email,
      'full_name', p.full_name,
      'avatar_url', p.avatar_url
    )
  ))
  INTO result.participants
  FROM conversation_participants cp
  JOIN profiles p ON cp.user_id = p.id
  WHERE cp.conversation_id = conversation_id;
  
  -- Get latest message
  SELECT jsonb_build_object(
    'id', m.id,
    'sender_id', m.sender_id,
    'content', m.content,
    'created_at', m.created_at
  )
  INTO result.latest_message
  FROM messages m
  WHERE m.conversation_id = conversation_id
  ORDER BY m.created_at DESC
  LIMIT 1;
  
  -- Get listing if applicable
  IF result.listing_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', l.id,
      'name', l.name,
      'slug', l.slug,
      'image_url', l.image_url
    )
    INTO result.listing
    FROM listings l
    WHERE l.id = result.listing_id;
  END IF;
  
  -- Get order if applicable
  IF result.order_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', o.id,
      'status', o.status
    )
    INTO result.order
    FROM orders o
    WHERE o.id = result.order_id;
  END IF;
  
  -- Get unread count
  SELECT COUNT(*)
  INTO result.unread_count
  FROM messages m
  JOIN conversation_participants cp 
    ON cp.conversation_id = m.conversation_id AND cp.user_id = user_id_param
  WHERE 
    m.conversation_id = conversation_id
    AND m.sender_id != user_id_param
    AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at);
  
  RETURN result;
END;
$$;

-- 3. Create a new conversation with initial message
CREATE OR REPLACE FUNCTION create_conversation(
  creator_id UUID,
  participant_ids UUID[],
  title TEXT DEFAULT NULL,
  listing_id UUID DEFAULT NULL,
  order_id UUID DEFAULT NULL,
  initial_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_conversation_id UUID;
  participant_id UUID;
BEGIN
  -- Create the conversation
  INSERT INTO conversations (title, listing_id, order_id)
  VALUES (title, listing_id, order_id)
  RETURNING id INTO new_conversation_id;
  
  -- Add the creator as a participant and admin
  INSERT INTO conversation_participants (conversation_id, user_id, is_admin)
  VALUES (new_conversation_id, creator_id, TRUE);
  
  -- Add other participants
  FOREACH participant_id IN ARRAY participant_ids
  LOOP
    -- Skip if participant is the creator (already added)
    IF participant_id <> creator_id THEN
      INSERT INTO conversation_participants (conversation_id, user_id, is_admin)
      VALUES (new_conversation_id, participant_id, FALSE);
    END IF;
  END LOOP;
  
  -- Add initial message if provided
  IF initial_message IS NOT NULL THEN
    INSERT INTO messages (conversation_id, sender_id, content)
    VALUES (new_conversation_id, creator_id, initial_message);
    
    -- Update the conversation's last_message_at
    UPDATE conversations
    SET last_message_at = NOW()
    WHERE id = new_conversation_id;
  END IF;
  
  RETURN new_conversation_id;
END;
$$;

-- 4. Send a message and update read status
CREATE OR REPLACE FUNCTION send_message(
  sender_id UUID,
  conversation_id UUID,
  message_content TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_participant BOOLEAN;
  new_message_id UUID;
BEGIN
  -- Check if sender is a participant
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = send_message.conversation_id
    AND sender_id = send_message.sender_id
  ) INTO is_participant;
  
  -- Return NULL if not a participant
  IF NOT is_participant THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;
  
  -- Insert the message
  INSERT INTO messages (conversation_id, sender_id, content)
  VALUES (conversation_id, sender_id, message_content)
  RETURNING id INTO new_message_id;
  
  -- Update last_message_at for the conversation
  UPDATE conversations
  SET last_message_at = NOW()
  WHERE id = conversation_id;
  
  -- Update last_read_at for the sender
  UPDATE conversation_participants
  SET last_read_at = NOW()
  WHERE conversation_id = send_message.conversation_id
  AND sender_id = sender_id;
  
  RETURN new_message_id;
END;
$$;

-- 5. Mark conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(
  user_id UUID,
  conversation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_participant BOOLEAN;
BEGIN
  -- Check if user is a participant
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = mark_conversation_as_read.conversation_id
    AND user_id = mark_conversation_as_read.user_id
  ) INTO is_participant;
  
  -- Return false if not a participant
  IF NOT is_participant THEN
    RETURN FALSE;
  END IF;
  
  -- Update last_read_at
  UPDATE conversation_participants
  SET last_read_at = NOW()
  WHERE conversation_id = mark_conversation_as_read.conversation_id
  AND user_id = mark_conversation_as_read.user_id;
  
  RETURN TRUE;
END;
$$;

-- 6. Get messages for a conversation with pagination
CREATE OR REPLACE FUNCTION get_conversation_messages(
  user_id UUID,
  conversation_id UUID,
  page_size INTEGER DEFAULT 20,
  before_timestamp TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  is_system_message BOOLEAN,
  sender JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_participant BOOLEAN;
BEGIN
  -- Check if user is a participant
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = get_conversation_messages.conversation_id
    AND user_id = get_conversation_messages.user_id
  ) INTO is_participant;
  
  -- Return empty set if not a participant
  IF NOT is_participant THEN
    RETURN;
  END IF;
  
  -- Set a default for before_timestamp if NULL
  IF before_timestamp IS NULL THEN
    before_timestamp := NOW() + INTERVAL '1 second'; -- Future time to get all messages
  END IF;
  
  -- Return messages with sender information
  RETURN QUERY
    SELECT 
      m.id,
      m.sender_id,
      m.content,
      m.created_at,
      m.is_system_message,
      jsonb_build_object(
        'id', p.id,
        'email', p.email,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url
      ) AS sender
    FROM messages m
    JOIN profiles p ON m.sender_id = p.id
    WHERE 
      m.conversation_id = get_conversation_messages.conversation_id
      AND m.created_at < before_timestamp
    ORDER BY m.created_at DESC
    LIMIT page_size;
    
  -- Update last_read_at for the user
  UPDATE conversation_participants
  SET last_read_at = NOW()
  WHERE conversation_id = get_conversation_messages.conversation_id
  AND user_id = get_conversation_messages.user_id;
END;
$$;

-- Grant execute privileges to authenticated users
GRANT EXECUTE ON FUNCTION get_user_conversations_with_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_details TO authenticated;
GRANT EXECUTE ON FUNCTION create_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION send_message TO authenticated;
GRANT EXECUTE ON FUNCTION mark_conversation_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_messages TO authenticated;