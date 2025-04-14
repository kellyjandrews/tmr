// app/actions/accounts.ts
'use server'

import { createSession } from '@/lib/supabase/serverSide'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Account, AccountAddress, AccountSettings, AccountPaymentInfo } from '@/types/accounts'

/**
 * Get user profile data
 */
export async function getProfile() {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', user.id)
        .single()

    if (error || !data) return null

    return data as Account
}

/**
 * Update user profile
 */
export async function updateProfile(formData: FormData) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const schema = z.object({
        username: z.string().min(3).max(50).regex(/^[a-z0-9_]+$/),
        preferred_language: z.string().length(2).optional(),
        timezone: z.string().max(50).optional(),
        profile_picture_url: z.string().url().optional().nullable(),
        marketing_opt_in: z.boolean().optional(),
    })

    const parsed = schema.parse({
        username: formData.get('username'),
        preferred_language: formData.get('preferred_language') || undefined,
        timezone: formData.get('timezone') || undefined,
        profile_picture_url: formData.get('profile_picture_url') || null,
        marketing_opt_in: formData.get('marketing_opt_in') === 'true',
    })

    const { error } = await supabase
        .from('accounts')
        .update(parsed)
        .eq('id', user.id)

    if (error) throw new Error(`Failed to update profile: ${error.message}`)

    revalidatePath('/account')
    return { success: true }
}

/**
 * Get user addresses
 */
export async function getUserAddresses() {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('account_addresses')
        .select('*')
        .eq('account_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) return []

    return data as AccountAddress[]
}

/**
 * Add new user address
 */
export async function addUserAddress(formData: FormData) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const schema = z.object({
        address_type: z.enum(['shipping', 'billing', 'primary', 'work', 'home', 'temporary', 'pickup']),
        full_name: z.string().min(2).max(200),
        organization_name: z.string().max(200).optional(),
        street_address: z.string().min(5).max(500),
        street_address_2: z.string().max(500).optional(),
        city: z.string().min(2).max(100),
        state_province: z.string().max(100).optional(),
        postal_code: z.string().min(3).max(20),
        country: z.string().length(2),
        phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
        is_default: z.boolean().optional(),
        is_commercial: z.boolean().optional(),
    })

    const parsed = schema.parse({
        address_type: formData.get('address_type'),
        full_name: formData.get('full_name'),
        organization_name: formData.get('organization_name') || undefined,
        street_address: formData.get('street_address'),
        street_address_2: formData.get('street_address_2') || undefined,
        city: formData.get('city'),
        state_province: formData.get('state_province') || undefined,
        postal_code: formData.get('postal_code'),
        country: formData.get('country'),
        phone: formData.get('phone') || undefined,
        is_default: formData.get('is_default') === 'true',
        is_commercial: formData.get('is_commercial') === 'true',
    })

    // If this is set as default, update all others to not be default
    if (parsed.is_default) {
        await supabase
            .from('account_addresses')
            .update({ is_default: false })
            .eq('account_id', user.id)
            .eq('address_type', parsed.address_type)
    }

    const { error } = await supabase
        .from('account_addresses')
        .insert({
            ...parsed,
            account_id: user.id,
        })

    if (error) throw new Error(`Failed to add address: ${error.message}`)

    revalidatePath('/account/addresses')
    return { success: true }
}

/**
 * Get user payment methods
 */
export async function getUserPaymentMethods() {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('account_payment_info')
        .select('*')
        .eq('account_id', user.id)
        .eq('status', 'active')
        .order('is_default', { ascending: false })

    if (error) return []

    return data as AccountPaymentInfo[]
}

/**
 * Get user settings
 */
export async function getUserSettings() {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
        .from('account_settings')
        .select('*')
        .eq('account_id', user.id)
        .single()

    if (error || !data) return null

    return data as AccountSettings
}

/**
 * Update user settings
 */
export async function updateUserSettings(formData: FormData) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Parse notification preferences from form data
    const notificationPreferences = {
        order_updates: formData.get('order_updates') === 'true',
        price_drops: formData.get('price_drops') === 'true',
        back_in_stock: formData.get('back_in_stock') === 'true',
        messages: formData.get('messages') === 'true',
        system_alerts: formData.get('system_alerts') === 'true',
        promotions: formData.get('promotions') === 'true',
        account_activity: formData.get('account_activity') === 'true',
        marketing_emails: formData.get('marketing_emails') === 'true',
        newsletter: formData.get('newsletter') === 'true',
    }

    const schema = z.object({
        theme_preference: z.enum(['light', 'dark', 'system', 'high_contrast']).optional(),
        color_scheme: z.enum(['default', 'deuteranopia', 'protanopia', 'tritanopia']).optional(),
        email_notification_frequency: z.enum(['immediate', 'daily', 'weekly', 'never', 'digest']).optional(),
        sms_notifications_enabled: z.boolean().optional(),
        push_notifications_enabled: z.boolean().optional(),
        data_sharing_consent: z.boolean().optional(),
        accessibility_mode: z.boolean().optional(),
        content_filter_level: z.enum(['none', 'mild', 'moderate', 'strict']).optional(),
        notification_preferences: z.any().optional(),
    })

    const parsed = schema.parse({
        theme_preference: formData.get('theme_preference') || undefined,
        color_scheme: formData.get('color_scheme') || undefined,
        email_notification_frequency: formData.get('email_notification_frequency') || undefined,
        sms_notifications_enabled: formData.get('sms_notifications_enabled') === 'true',
        push_notifications_enabled: formData.get('push_notifications_enabled') === 'true',
        data_sharing_consent: formData.get('data_sharing_consent') === 'true',
        accessibility_mode: formData.get('accessibility_mode') === 'true',
        content_filter_level: formData.get('content_filter_level') || undefined,
        notification_preferences: notificationPreferences,
    })

    // Check if user settings exist
    const { data: existingSettings } = await supabase
        .from('account_settings')
        .select('id')
        .eq('account_id', user.id)
        .single()

    if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
            .from('account_settings')
            .update(parsed)
            .eq('account_id', user.id)

        if (error) throw new Error(`Failed to update settings: ${error.message}`)
    } else {
        // Create new settings
        const { error } = await supabase
            .from('account_settings')
            .insert({
                ...parsed,
                account_id: user.id,
            })

        if (error) throw new Error(`Failed to create settings: ${error.message}`)
    }

    revalidatePath('/account/settings')
    return { success: true }
}