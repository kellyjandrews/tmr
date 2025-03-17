'use server';

import { cookies } from 'next/headers';
import { createSession } from '@/lib/supabase/serverSide';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ProfileUpdateFormData } from '@/types';
import type { ActionResponse } from '@/types/common';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

// Validation schema for profile updates
const profileSchema = z.object({
    full_name: z.string().max(100, 'Name must be less than 100 characters').optional().nullable(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional().nullable(),
    avatar_url: z.string().url('Invalid URL format').optional().nullable(),
});

/**
 * Update user profile information
 */
export async function updateUserProfile(formData: ProfileUpdateFormData): Promise<ActionResponse> {
    const supabase = await createSession();

    try {
        // Validate the form data
        const validatedData = profileSchema.parse(formData);

        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
            return {
                success: false,
                error: userError?.message || 'Failed to authenticate user'
            };
        }

        // Check if profile exists
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userData.user.id)
            .single();

        let result: PostgrestSingleResponse<null>;

        if (existingProfile) {
            // Update existing profile
            result = await supabase
                .from('profiles')
                .update({
                    full_name: validatedData.full_name,
                    bio: validatedData.bio,
                    avatar_url: validatedData.avatar_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userData.user.id);
        } else {
            // Create new profile
            result = await supabase
                .from('profiles')
                .insert({
                    id: userData.user.id,
                    email: userData.user.email,
                    full_name: validatedData.full_name,
                    bio: validatedData.bio,
                    avatar_url: validatedData.avatar_url,
                });
        }

        if (result.error) {
            throw new Error(result.error.message);
        }

        // Revalidate dashboard paths to show updated user info
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/account');

        return {
            success: true,
            message: 'Profile updated successfully'
        };
    } catch (error) {
        console.error('Update profile error:', error);
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Update user password
 */
export async function updateUserPassword(
    currentPassword: string,
    newPassword: string
): Promise<ActionResponse> {

    const supabase = await createSession();

    try {
        // Get current user from auth token
        const cookieStore = await cookies();
        const token = cookieStore.get('sb-auth-token')?.value;

        if (!token) {
            return {
                success: false,
                error: 'Authentication required. Please sign in again.'
            };
        }

        const { data: userData, error: userError } = await supabase.auth.getUser(token);

        if (userError || !userData.user) {
            return {
                success: false,
                error: userError?.message || 'Failed to authenticate user'
            };
        }

        // Get the user's email
        const email = userData.user.email;

        if (!email) {
            return {
                success: false,
                error: 'User email not found'
            };
        }

        // First verify the current password by attempting to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: currentPassword,
        });

        if (signInError) {
            return {
                success: false,
                error: 'Current password is incorrect'
            };
        }

        // Now update the password
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (updateError) {
            throw new Error(updateError.message);
        }

        return {
            success: true,
            message: 'Password updated successfully'
        };
    } catch (error) {
        console.error('Update password error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Delete user account
 */
export async function deleteUserAccount(): Promise<ActionResponse> {
    const supabase = await createSession();

    try {
        // Get current user from auth token

        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
            return {
                success: false,
                error: userError?.message || 'Failed to authenticate user'
            };
        }

        // Delete user account - Supabase will cascade delete all user data
        const { error: deleteError } = await supabase.auth.admin.deleteUser(
            userData.user.id
        );

        if (deleteError) {
            throw new Error(deleteError.message);
        }

        return {
            success: true,
            message: 'Account deleted successfully'
        };
    } catch (error) {
        console.error('Delete account error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}