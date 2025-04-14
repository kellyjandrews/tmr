// app/actions/auth.ts
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

/**
 * Sign up a new user
 */
export async function signUp(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const username = formData.get('username') as string
    const marketingOptIn = formData.get('marketing_opt_in') === 'true'

    const schema = z.object({
        email: z.string().email(),
        password: z.string().min(12),
        username: z.string().min(3).max(50).regex(/^[a-z0-9_]+$/),
    })

    try {
        const parsed = schema.parse({ email, password, username })

        const supabase = createClient()

        // Create the user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: parsed.email,
            password: parsed.password,
        })

        if (authError) throw new Error(authError.message)
        if (!authData.user) throw new Error('Failed to create user')

        // Create account profile in our database
        const { error: profileError } = await supabase
            .from('accounts')
            .insert({
                id: authData.user.id,
                email: parsed.email,
                username: parsed.username,
                marketing_opt_in: marketingOptIn,
                account_status: 'pending', // Requires email verification
            })

        if (profileError) {
            // Roll back auth user creation if profile creation fails
            await supabase.auth.admin.deleteUser(authData.user.id)
            throw new Error(`Failed to create profile: ${profileError.message}`)
        }

        // Create default account settings
        await supabase
            .from('account_settings')
            .insert({
                account_id: authData.user.id,
                theme_preference: 'system',
                color_scheme: 'default',
                email_notification_frequency: 'daily',
                notification_preferences: {
                    order_updates: true,
                    system_alerts: true,
                },
            })

        return { success: true, message: 'Please check your email to verify your account' }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message }
        }
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' }
    }
}

/**
 * Sign in a user
 */
export async function signIn(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const schema = z.object({
        email: z.string().email(),
        password: z.string(),
    })

    try {
        const parsed = schema.parse({ email, password })

        const supabase = createClient()

        const { data, error } = await supabase.auth.signInWithPassword({
            email: parsed.email,
            password: parsed.password,
        })

        if (error) throw new Error(error.message)

        // Update last login time
        await supabase
            .from('accounts')
            .update({
                last_login: new Date().toISOString(),
                last_activity: new Date().toISOString(),
            })
            .eq('id', data.user.id)

        return { success: true }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' }
    }
}

/**
 * Sign out the current user
 */
export async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()

    return redirect('/auth/login')
}

/**
 * Request password reset
 */
export async function requestPasswordReset(formData: FormData) {
    const email = formData.get('email') as string

    const schema = z.object({
        email: z.string().email(),
    })

    try {
        const parsed = schema.parse({ email })

        const supabase = createClient()

        const { error } = await supabase.auth.resetPasswordForEmail(parsed.email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
        })

        if (error) throw new Error(error.message)

        return { success: true, message: 'Password reset instructions sent to your email' }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' }
    }
}

/**
 * Reset password with token
 */
export async function resetPassword(formData: FormData) {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm_password') as string

    const schema = z.object({
        password: z.string().min(12),
        confirmPassword: z.string(),
    }).refine(data => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

    try {
        const parsed = schema.parse({ password, confirmPassword })

        const supabase = createClient()

        const { error } = await supabase.auth.updateUser({
            password: parsed.password,
        })

        if (error) throw new Error(error.message)

        return { success: true, message: 'Password has been reset successfully' }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message }
        }
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' }
    }
}

/**
 * Enable two-factor authentication
 */
export async function setupTwoFactor() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    try {
        // Generate 2FA secret (this is a simplified example)
        const { data, error } = await supabase.functions.invoke('generate-2fa-secret', {
            body: { userId: user.id },
        })

        if (error) throw new Error(error.message)

        return {
            success: true,
            secret: data.secret,
            qrCode: data.qrCode,
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to set up two-factor authentication'
        }
    }
}

/**
 * Verify two-factor authentication token
 */
export async function verifyTwoFactorToken(formData: FormData) {
    const token = formData.get('token') as string

    const schema = z.object({
        token: z.string().length(6).regex(/^\d+$/),
    })

    try {
        const parsed = schema.parse({ token })

        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Verify token with backend
        const { data, error } = await supabase.functions.invoke('verify-2fa-token', {
            body: { userId: user.id, token: parsed.token },
        })

        if (error || !data.valid) throw new Error('Invalid token')

        // Update account settings
        await supabase
            .from('accounts')
            .update({ two_factor_enabled: true })
            .eq('id', user.id)

        return { success: true }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to verify token'
        }
    }
}