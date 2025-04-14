// app/actions/payments.ts
'use server'

import { createSession } from '@/lib/supabase/serverSide'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { PaymentTransaction } from '@/types/stripe_integration'

/**
 * Create a payment intent
 */
export async function createPaymentIntent(formData: FormData) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const schema = z.object({
        amount: z.number().min(1),
        currency: z.string().length(3).default('USD'),
        order_id: z.string().uuid().optional(),
        payment_method_id: z.string().uuid().optional(),
        description: z.string().max(500).optional(),
    })

    // Parse and validate form data
    const parsed = schema.parse({
        amount: parseFloat(formData.get('amount') as string),
        currency: formData.get('currency') as string || 'USD',
        order_id: formData.get('order_id') as string || undefined,
        payment_method_id: formData.get('payment_method_id') as string || undefined,
        description: formData.get('description') as string || undefined,
    })

    // Call Stripe API via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
            amount: parsed.amount,
            currency: parsed.currency,
            customer_id: user.id,
            payment_method_id: parsed.payment_method_id,
            description: parsed.description,
        }
    })

    if (error) throw new Error(`Failed to create payment intent: ${error.message}`)

    // Record the payment transaction in our database
    const { error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
            account_id: user.id,
            order_id: parsed.order_id,
            stripe_payment_intent_id: data.paymentIntentId,
            stripe_customer_id: data.customerId,
            amount: parsed.amount,
            currency: parsed.currency,
            status: 'pending',
            description: parsed.description,
        })

    if (transactionError) {
        throw new Error(`Failed to record transaction: ${transactionError.message}`)
    }

    return {
        success: true,
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId
    }
}

/**
 * Confirm payment success
 */
export async function confirmPaymentSuccess(paymentIntentId: string) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Update the payment transaction status
    const { data, error } = await supabase
        .from('payment_transactions')
        .update({
            status: 'succeeded',
            updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntentId)
        .eq('account_id', user.id)
        .select('order_id')
        .single()

    if (error) throw new Error(`Failed to confirm payment: ${error.message}`)

    // If this is for an order, update the order payment status
    if (data?.order_id) {
        await supabase
            .from('orders')
            .update({
                payment_status: 'paid',
                status: 'processing',
                updated_at: new Date().toISOString()
            })
            .eq('id', data.order_id)

        // Add order event
        await supabase
            .from('order_events')
            .insert({
                order_id: data.order_id,
                account_id: user.id,
                event_type: 'payment_received',
                data: {
                    payment_intent_id: paymentIntentId,
                    amount: null, // Would be filled from the transaction
                    timestamp: new Date().toISOString()
                }
            })

        revalidatePath(`/orders/${data.order_id}`)
    }

    return { success: true }
}

/**
 * Get payment methods for current user
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

    return data
}

/**
 * Add payment method
 */
export async function addPaymentMethod(formData: FormData) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const schema = z.object({
        payment_type: z.enum([
            'credit_card', 'debit_card', 'paypal', 'bank_transfer',
            'crypto', 'apple_pay', 'google_pay', 'venmo'
        ]),
        provider: z.string().max(100).optional(),
        last_four: z.string().regex(/^\d{4}$/).optional(),
        bin_category: z.enum(['debit', 'credit', 'prepaid', 'corporate']).optional(),
        expiration_month: z.number().min(1).max(12).optional(),
        expiration_year: z.number().min(2023).max(2050).optional(),
        cardholder_name: z.string().max(200).optional(),
        billing_address_id: z.string().uuid().optional(),
        is_default: z.boolean().optional(),
        token: z.string(), // Payment method token from Stripe
    })

    // Parse and validate form data
    const parsed = schema.parse({
        payment_type: formData.get('payment_type'),
        provider: formData.get('provider') || undefined,
        last_four: formData.get('last_four') || undefined,
        bin_category: formData.get('bin_category') || undefined,
        expiration_month: formData.has('expiration_month')
            ? parseInt(formData.get('expiration_month') as string)
            : undefined,
        expiration_year: formData.has('expiration_year')
            ? parseInt(formData.get('expiration_year') as string)
            : undefined,
        cardholder_name: formData.get('cardholder_name') || undefined,
        billing_address_id: formData.get('billing_address_id') || undefined,
        is_default: formData.get('is_default') === 'true',
        token: formData.get('token') as string,
    })

    // If this is set as default, update all others to not be default
    if (parsed.is_default) {
        await supabase
            .from('account_payment_info')
            .update({ is_default: false })
            .eq('account_id', user.id)
    }

    // Add payment method
    const { error } = await supabase
        .from('account_payment_info')
        .insert({
            ...parsed,
            account_id: user.id,
            status: 'active',
            verification_attempts: 0,
        })

    if (error) throw new Error(`Failed to add payment method: ${error.message}`)

    revalidatePath('/account/payment-methods')
    return { success: true }
}

/**
 * Process refund
 */
export async function processRefund(formData: FormData) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const schema = z.object({
        order_id: z.string().uuid(),
        order_item_id: z.string().uuid().optional(),
        refund_amount: z.number().min(0.01),
        refund_method: z.enum(['original_payment', 'store_credit', 'exchange', 'gift_card']),
        reason: z.string().min(10).max(1000),
        reason_category: z.enum([
            'defective', 'not_as_described', 'wrong_item',
            'shipping_damage', 'changed_mind', 'other'
        ]).optional(),
        notes: z.string().max(1000).optional(),
    })

    // Parse and validate form data
    const parsed = schema.parse({
        order_id: formData.get('order_id'),
        order_item_id: formData.get('order_item_id') || undefined,
        refund_amount: parseFloat(formData.get('refund_amount') as string),
        refund_method: formData.get('refund_method'),
        reason: formData.get('reason'),
        reason_category: formData.get('reason_category') || undefined,
        notes: formData.get('notes') || undefined,
    })

    // Verify permissions (check if user is the order owner or store owner)
    const { data: orderCheck, error: orderError } = await supabase
        .from('orders')
        .select(`
      id, 
      account_id, 
      store_id, 
      payment_status,
      stores!inner(owner_id)
    `)
        .eq('id', parsed.order_id)
        .or(`account_id.eq.${user.id},stores.owner_id.eq.${user.id}`)
        .single()

    if (orderError || !orderCheck) {
        throw new Error('Order not found or you do not have permission')
    }

    // Store owners can process refunds, customers can request them
    const isStoreOwner = orderCheck.stores.owner_id === user.id
    const isCustomer = orderCheck.account_id === user.id

    if (!isStoreOwner && !isCustomer) {
        throw new Error('You do not have permission to process refunds for this order')
    }

    // For store owners, process the refund immediately
    // For customers, set status to pending for approval
    const refundStatus = isStoreOwner ? 'approved' : 'pending'

    // Create refund record
    const { data: refund, error } = await supabase
        .from('order_refunds')
        .insert({
            order_id: parsed.order_id,
            order_item_id: parsed.order_item_id,
            account_id: user.id,
            refund_amount: parsed.refund_amount,
            refund_method: parsed.refund_method,
            reason: parsed.reason,
            reason_category: parsed.reason_category,
            notes: parsed.notes,
            status: refundStatus,
            processed_by: isStoreOwner ? user.id : null,
        })
        .select()
        .single()

    if (error) throw new Error(`Failed to process refund: ${error.message}`)

    // If approved by store owner, update order
    if (isStoreOwner) {
        // Update order refund total
        await supabase
            .from('orders')
            .update({
                refund_total: supabase.rpc('get_order_refund_total', { p_order_id: parsed.order_id }),
                status: parsed.order_item_id ? 'partially_refunded' : 'refunded',
                updated_at: new Date().toISOString()
            })
            .eq('id', parsed.order_id)

        // If refunding specific item, update item status
        if (parsed.order_item_id) {
            await supabase
                .from('order_items')
                .update({
                    refund_status: 'completed',
                    refund_amount: parsed.refund_amount,
                    updated_at: new Date().toISOString()
                })
                .eq('id', parsed.order_item_id)
        }

        // Log refund event
        await supabase
            .from('order_events')
            .insert({
                order_id: parsed.order_id,
                account_id: user.id,
                event_type: 'refund_processed',
                data: {
                    refund_id: refund.id,
                    refund_amount: parsed.refund_amount,
                    refund_method: parsed.refund_method,
                    order_item_id: parsed.order_item_id
                }
            })
    }

    revalidatePath(`/orders/${parsed.order_id}`)
    if (isStoreOwner) revalidatePath('/dashboard/orders')

    return { success: true, refundId: refund.id }
}

/**
 * Get user's payment transactions
 */
export async function getUserTransactions(page: number = 1, perPage: number = 10) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { transactions: [], count: 0 }

    // Apply pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const { data, error, count } = await supabase
        .from('payment_transactions')
        .select(`
      *,
      order:orders(order_number, store:stores(name))
    `, { count: 'exact' })
        .eq('account_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) return { transactions: [], count: 0 }

    return {
        transactions: data,
        count: count || 0
    }
}