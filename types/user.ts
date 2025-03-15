// types/user.ts
import type { UUID } from './common';

/**
 * Basic user information
 */
export type User = {
    id: UUID;
    email?: string | null;
    created_at?: string;
};

/**
 * Extended user profile information
 */
export type UserProfile = {
    id: UUID;
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    created_at: string;
    updated_at: string;
};

/**
 * User login form data
 */
export type LoginFormData = {
    email: string;
    password: string;
};

/**
 * User registration form data
 */
export type RegisterFormData = {
    email: string;
    password: string;
    confirmPassword: string;
};

/**
 * User profile update form data
 */
export type ProfileUpdateFormData = {
    full_name?: string;
    bio?: string;
    avatar_url?: string;
};

/**
 * User password change form data
 */
export type PasswordChangeFormData = {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
};

/**
 * User session information
 */
export type Session = {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    user: User;
};

/**
 * User authentication response
 */
export type AuthResponse = {
    session: Session | null;
    user: User | null;
};