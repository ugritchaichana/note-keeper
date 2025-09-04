import { ThemeSwitcher } from '@/components/theme-switcher';
import { LogoutButton } from '@/components/logout-button';
import { AuthModal } from '@/components/auth-modal';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const isLoggedIn = !!user;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <nav className="w-full border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-5xl mx-auto h-full flex justify-between items-center px-5 text-sm">
          <div className="font-semibold">NoteKeeper</div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <span className="text-foreground/80 text-sm">
                  {user?.email}
                </span>
                <LogoutButton />
              </>
            ) : (
              <span className="text-foreground/60 text-sm">Welcome</span>
            )}
            <ThemeSwitcher />
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className={'relative flex-1'}>
        <div
          className={`h-full max-w-5xl mx-auto p-6 ${
            isLoggedIn ? '' : 'blur-sm pointer-events-none select-none'
          }`}
        >
          {/* Replace with your main content */}
          <div className="py-12 text-center text-foreground/70">
            {isLoggedIn
              ? "You're logged in. Start taking notes!"
              : 'Please sign in to continue'}
          </div>
        </div>
        {/* Auth modal overlay when not logged in */}
        {!isLoggedIn && <AuthModal open={!isLoggedIn} />}
      </div>
    </main>
  );
}
