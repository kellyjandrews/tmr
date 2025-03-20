// app/auth/callback/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/utils/supabase/serverSide';

export async function GET(request: NextRequest) {
    const supabase = await createSession();
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        await supabase.auth.exchangeCodeForSession(code);
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL('/dashboard', request.url));
}