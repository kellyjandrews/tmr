import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from './lib/supabase/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()

  // Specify which routes need protection
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

// Specify which routes to run middleware on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}