// actions/notifications.ts
'use server'

import { createSession } from '@/lib/supabase/serverSide'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Notification } from '@/types/accounts'

/**
 * Get user's notifications
 */
export async function getUserNotifications(page: number = 1, perPage: number = 20, includeRead: boolean = false) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { notifications: [], count: 0 }

    // Apply pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('account_id', user.id)
        .order('created_at', { ascending: false })

    // Filter out read notifications if requested
    if (!includeRead) {
        query = query.eq('is_read', false)
    }

    const { data, error, count } = await query.range(from, to)

    if (error) return { notifications: [], count: 0 }

    // Group notifications by day for UI presentation
    const groupedNotifications = data.reduce((acc, notification) => {
        const date = new Date(notification.created_at)
        const dateStr = date.toISOString().split('T')[0]

        if (!acc[dateStr]) {
            acc[dateStr] = []
        }

        acc[dateStr].push(notification)
        return acc
    }, {} as Record<string, Notification[]>)

    return {
        notifications: data,
        groupedNotifications,
        count: count || 0,
        unreadCount: data.filter(n => !n.is_read).length
    }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('account_id', user.id)

    if (error) throw new Error(`Failed to mark notification as read: ${error.message}`)

    revalidatePath('/notifications')
    return { success: true }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('account_id', user.id)
        .eq('is_read', false)

    if (error) throw new Error(`Failed to mark notifications as read: ${error.message}`)

    revalidatePath('/notifications')
    return { success: true }
}

/**
 * Create a notification
 * This is mostly used server-side but can be useful for testing
 */
export async function createNotification(data: {
    accountId: string;
    notificationType: string;
    title: string;
    content: string;
    relatedEntityId?: string;
    relatedEntityType?: string;
    actionUrl?: string;
    importance?: string;
    icon?: string;
}) {
    const supabase = createSession()

    const schema = z.object({
        accountId: z.string().uuid(),
        notificationType: z.enum([
            'order_update', 'price_drop', 'back_in_stock',
            'message', 'system_alert', 'promotion', 'account'
        ]),
        title: z.string().min(2).max(200),
        content: z.string().min(5).max(1000),
        relatedEntityId: z.string().uuid().optional(),
        relatedEntityType: z.string().optional(),
        actionUrl: z.string().url().optional(),
        importance: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        icon: z.string().optional(),
    })

    const parsed = schema.parse(data)

    const { error } = await supabase
        .from('notifications')
        .insert({
            account_id: parsed.accountId,
            notification_type: parsed.notificationType,
            title: parsed.title,
            content: parsed.content,
            related_entity_id: parsed.relatedEntityId,
            related_entity_type: parsed.relatedEntityType,
            action_url: parsed.actionUrl,
            importance: parsed.importance || 'medium',
            icon: parsed.icon,
            is_read: false
        })

    if (error) throw new Error(`Failed to create notification: ${error.message}`)

    return { success: true }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('account_id', user.id)

    if (error) throw new Error(`Failed to delete notification: ${error.message}`)

    revalidatePath('/notifications')
    return { success: true }
}

/**
 * Clear all read notifications
 */
export async function clearReadNotifications() {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('account_id', user.id)
        .eq('is_read', true)

    if (error) throw new Error(`Failed to clear notifications: ${error.message}`)

    revalidatePath('/notifications')
    return { success: true }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(formData: FormData) {
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
    }

    // Check if user settings exist
    const { data: settings } = await supabase
        .from('account_settings')
        .select('id, notification_preferences')
        .eq('account_id', user.id)
        .single()

    if (settings) {
        // Update existing settings
        const { error } = await supabase
            .from('account_settings')
            .update({
                notification_preferences: notificationPreferences
            })
            .eq('account_id', user.id)

        if (error) throw new Error(`Failed to update notification preferences: ${error.message}`)
    } else {
        // Create new settings
        const { error } = await supabase
            .from('account_settings')
            .insert({
                account_id: user.id,
                notification_preferences: notificationPreferences
            })

        if (error) throw new Error(`Failed to create notification preferences: ${error.message}`)
    }

    revalidatePath('/account/settings')
    return { success: true }
}