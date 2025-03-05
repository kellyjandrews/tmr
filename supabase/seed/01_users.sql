-- Seed file for creating 10 random users
-- Note: These use placeholder hashed passwords

-- User 1
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'authenticated',
  'authenticated',
  'merlin@example.com',
  '$2a$10$6aKm6yAIYgGKbZl7F4n.wOfKT8RUF9JrFl8.LkIBLfD/Ap3uMo/Vi', -- Placeholder hash
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Merlin Wizard"}',
  now()
);

INSERT INTO auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "email": "merlin@example.com"}',
  'email',
  now(),
  now(),
  now()
);

-- User 2
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  'authenticated',
  'authenticated',
  'morgana@example.com',
  '$2a$10$6aKm6yAIYgGKbZl7F4n.wOfKT8RUF9JrFl8.LkIBLfD/Ap3uMo/Vi', -- Placeholder hash
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Morgana Enchanter"}',
  now()
);

INSERT INTO auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12", "email": "morgana@example.com"}',
  'email',
  now(),
  now(),
  now()
);

-- User 3
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  'authenticated',
  'authenticated',
  'gandalf@example.com',
  '$2a$10$6aKm6yAIYgGKbZl7F4n.wOfKT8RUF9JrFl8.LkIBLfD/Ap3uMo/Vi', -- Placeholder hash
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Gandalf Greyhame"}',
  now()
);

INSERT INTO auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13", "email": "gandalf@example.com"}',
  'email',
  now(),
  now(),
  now()
);

-- User 4
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
  'authenticated',
  'authenticated',
  'luna@example.com',
  '$2a$10$6aKm6yAIYgGKbZl7F4n.wOfKT8RUF9JrFl8.LkIBLfD/Ap3uMo/Vi', -- Placeholder hash
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Luna Lovecraft"}',
  now()
);

INSERT INTO auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
  '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14", "email": "luna@example.com"}',
  'email',
  now(),
  now(),
  now()
);

-- User 5
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
  'authenticated',
  'authenticated',
  'salem@example.com',
  '$2a$10$6aKm6yAIYgGKbZl7F4n.wOfKT8RUF9JrFl8.LkIBLfD/Ap3uMo/Vi', -- Placeholder hash
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Salem Spellcrafter"}',
  now()
);

INSERT INTO auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
  '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15", "email": "salem@example.com"}',
  'email',
  now(),
  now(),
  now()
);

-- User 6
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
  'authenticated',
  'authenticated',
  'willow@example.com',
  '$2a$10$6aKm6yAIYgGKbZl7F4n.wOfKT8RUF9JrFl8.LkIBLfD/Ap3uMo/Vi', -- Placeholder hash
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Willow Witchcraft"}',
  now()
);

INSERT INTO auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
  '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16", "email": "willow@example.com"}',
  'email',
  now(),
  now(),
  now()
);

-- User 7
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17',
  'authenticated',
  'authenticated',
  'orion@example.com',
  '$2a$10$6aKm6yAIYgGKbZl7F4n.wOfKT8RUF9JrFl8.LkIBLfD/Ap3uMo/Vi', -- Placeholder hash
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Orion Stardust"}',
  now()
);

INSERT INTO auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17',
  '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17", "email": "orion@example.com"}',
  'email',
  now(),
  now(),
  now()
);

-- User 8
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
  'authenticated',
  'authenticated',
  'zephyr@example.com',
  '$2a$10$6aKm6yAIYgGKbZl7F4n.wOfKT8RUF9JrFl8.LkIBLfD/Ap3uMo/Vi', -- Placeholder hash
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Zephyr Windrider"}',
  now()
);

INSERT INTO auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
  '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18", "email": "zephyr@example.com"}',
  'email',
  now(),
  now(),
  now()
);

-- User 9
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19',
  'authenticated',
  'authenticated',
  'ember@example.com',
  '$2a$10$6aKm6yAIYgGKbZl7F4n.wOfKT8RUF9JrFl8.LkIBLfD/Ap3uMo/Vi', -- Placeholder hash
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Ember Flameheart"}',
  now()
);

INSERT INTO auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19',
  '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19", "email": "ember@example.com"}',
  'email',
  now(),
  now(),
  now()
);

-- User 10
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20',
  'authenticated',
  'authenticated',
  'aurora@example.com',
  '$2a$10$6aKm6yAIYgGKbZl7F4n.wOfKT8RUF9JrFl8.LkIBLfD/Ap3uMo/Vi', -- Placeholder hash
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Aurora Nightshade"}',
  now()
);

INSERT INTO auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20',
  '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20", "email": "aurora@example.com"}',
  'email',
  now(),
  now(),
  now()
);