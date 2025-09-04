import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from './logout-button';

export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  return user ? (
    <div className="flex items-center gap-4">
      {user.email}
      <LogoutButton />
    </div>
  ) : null;
}
