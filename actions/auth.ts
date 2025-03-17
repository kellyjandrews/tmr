// actions/auth.ts
'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSession } from '@/lib/supabase/serverSide';

// Validation schema
const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

// Type for the registration form data
export type RegisterFormData = z.infer<typeof registerSchema>;

// Type for server action responses
export type ActionResponse = {
    success: boolean;
    message?: string;
    error?: string;
};

/**
 * Register a new user
 */
export async function registerUser(formData: RegisterFormData): Promise<ActionResponse> {
    const supabase = await createSession();

    try {
        // Validate form data
        const validatedData = registerSchema.parse(formData);
        const { email, password } = validatedData;

        // Create the user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // No email verification required
                emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
            }
        });

        if (authError) throw new Error(authError.message);
        if (!authData.user) throw new Error('Failed to create user');

        // If the user was created successfully and we got a session back, set cookies
        if (authData.session) {
            const cookieStore = await cookies();
            cookieStore.set('sb-auth-token', authData.session.access_token, {
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 1 week
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
        }

        return {
            success: true,
            message: 'User registered successfully.'
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.errors.map(e => `${e.path}: ${e.message}`).join(', ')
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Log in a user
 */
export async function loginUser(formData: { email: string; password: string }): Promise<ActionResponse> {
    const supabase = await createSession();

    try {
        const { email, password } = formData;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // Set session cookie
        if (data.session) {
            const cookieStore = await cookies();
            cookieStore.set('sb-auth-token', data.session.access_token, {
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 1 week
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Log out a user
 */
export async function logoutUser(): Promise<void> {
    const supabase = await createSession();

    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.log(error)
    }

    const cookieStore = await cookies();
    cookieStore.delete('sb-auth-token');

    redirect('/');
}