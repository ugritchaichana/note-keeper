import { LogoutButton } from '@/components/logout-button';
import { AuthModal } from '@/components/auth-modal';
import { createClient } from '@/lib/supabase/server';
import { Dashboard } from '@/components/dashboard';

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
          <div className="font-bold text-2xl bg-gradient-to-r from-gray-700 via-gray-400 to-white bg-clip-text text-transparent animate-pulse [animation-duration:3s]">
            NoteKeeper.
          </div>
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
            {/* Theme system removed: fixed dark theme */}
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
          {isLoggedIn ? (
            <Dashboard />
          ) : (
            <div className="py-12 text-center text-foreground/70">
              Please sign in to continue
            </div>
          )}
        </div>
        {/* Auth modal overlay when not logged in */}
        {!isLoggedIn && <AuthModal open={!isLoggedIn} />}
      </div>
    </main>
  );
}
