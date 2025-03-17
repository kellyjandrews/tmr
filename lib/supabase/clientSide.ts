// lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'
import type { ImageLoaderProps } from 'next/image';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

export function createClient() {
    // Create a supabase client on the browser with project's credentials
    return createBrowserClient(
        supabaseUrl,
        supabaseKey
    )
}

// Supabase client side image loader - use with <Image loader=supabaseLoader
export function supabaseLoader({ src, width, quality }: ImageLoaderProps) {
    const url = new URL(`${supabaseUrl}/${src}?w=${width}&q=${quality || 75}`)
    url.searchParams.set('width', width.toString())
    url.searchParams.set('quality', (quality || 75).toString())
    return url.href
}
