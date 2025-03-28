// actions/account.ts
'use server';

import { z } from 'zod';
import { createSession } from '@/utils/supabase/serverSide';
import { revalidatePath } from 'next/cache';
import type { ProfileUpdateFormData } from '@/types';
import type { ActionResponse } from '@/types/common';

// Validation schema for profile updates
const profileSchema = z.object({
    full_name: z.string().max(100, 'Name must be less than 100 characters').optional().nullable(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional().nullable(),
    avatar_url: z.string().url('Invalid URL format').optional().nullable(),
});

/**
 * Update user profile information using stored procedure
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

        // Call the stored procedure to update the profile
        const { data: success, error: updateError } = await supabase.rpc(
            'update_user_profile',
            {
                user_id_param: userData.user.id,
                full_name_param: validatedData.full_name,
                bio_param: validatedData.bio,
                avatar_url_param: validatedData.avatar_url
            }
        );

        if (updateError) {
            throw new Error(updateError.message);
        }

        if (!success) {
            throw new Error('Failed to update profile');
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
        // Get current user
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
            return {
                success: false,
                error: 'Authentication required. Please sign in again.'
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
 * Get user profile using stored procedure
 */
export async function getUserProfile(): Promise<ActionResponse> {
    const supabase = await createSession();

    try {
        // Get current user
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }

        // Call the stored procedure to get the profile
        const { data, error: profileError } = await supabase.rpc(
            'get_user_profile',
            { user_id_param: userData.user.id }
        );

        if (profileError) {
            throw new Error(profileError.message);
        }

        return {
            success: true,
            data: data[0] || null
        };
    } catch (error) {
        console.error('Get profile error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Delete user account using stored procedure
 */
export async function deleteUserAccount(): Promise<ActionResponse> {
    const supabase = await createSession();

    try {
        // Get current user
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }

        // First, delete all user data using stored procedure
        const { data: success, error: deleteDataError } = await supabase.rpc(
            'delete_user_account',
            { user_id_param: userData.user.id }
        );

        if (deleteDataError) {
            throw new Error(deleteDataError.message);
        }

        if (!success) {
            throw new Error('Failed to delete user data');
        }

        // Then, delete the actual auth user
        const { error: deleteUserError } = await supabase.auth.admin.deleteUser(
            userData.user.id
        );

        if (deleteUserError) {
            throw new Error(deleteUserError.message);
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