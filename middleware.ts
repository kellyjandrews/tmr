import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    for (const { name, value } of cookiesToSet) {
                        request.cookies.set(name, value)

                        response = NextResponse.next({
                            request,
                        })
                    }

                    for (const { name, value, options } of cookiesToSet) {
                        response.cookies.set(name, value, options)
                    }
                },
            },
        }
    )

    const {
        data: { session },
    } = await supabase.auth.getSession()

    // Protection for dashboard routes
    if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    // Redirect authenticated users away from login/register pages
    if (session && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
        const dashboardUrl = new URL('/dashboard', request.url)
        return NextResponse.redirect(dashboardUrl)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}