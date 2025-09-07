import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Supabase PKCE callback: exchanges the `code` for a session and sets auth cookies.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const redirectTo = url.searchParams.get('redirect') ?? '/';

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login', url));
  }

  const { createServerClient } = await import('@supabase/ssr');
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, url)
    );
  }

  return NextResponse.redirect(new URL(redirectTo, url.origin));
}
