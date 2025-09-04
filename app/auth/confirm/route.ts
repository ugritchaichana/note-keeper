// Email confirmation flow removed. Keeping this file empty to avoid 404s
// in case of stale links. Optionally, redirect to login.
import { redirect } from 'next/navigation';
export function GET() {
  redirect('/auth/login');
}
