import { faker } from '@faker-js/faker';

const {person, internet} = faker;

const firstName = person.firstName();
const lastName = person.lastName();
const displayName = internet.displayName({ firstName, lastName})
const email = internet.email({ firstName, lastName})
const password = "Password123"

console.log(firstName, lastName, displayName, email)



// -- User 1
// INSERT INTO auth.users (
//   instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
//   raw_app_meta_data, raw_user_meta_data, created_at
// ) VALUES (
//   '00000000-0000-0000-0000-000000000000',
//   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
//   'authenticated',
//   'authenticated',
//   'merlin@example.com',
//   '$2a$10$6aKm6yAIYgGKbZl7F4n.wOfKT8RUF9JrFl8.LkIBLfD/Ap3uMo/Vi', -- Placeholder hash
//   now(),
//   '{"provider": "email", "providers": ["email"]}',
//   '{"name": "Merlin Wizard"}',
//   now()
// );

// INSERT INTO auth.identities (
//   provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
// ) VALUES (
//   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
//   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
//   '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "email": "merlin@example.com"}',
//   'email',
//   now(),
//   now(),
//   now()
// );