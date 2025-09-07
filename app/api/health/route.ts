import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasEnvVars } from '@/lib/utils';

type HealthResult = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: boolean;
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY: boolean;
    DATABASE_URL: boolean;
    DATABASE_URL_FORMAT: string;
    DIRECT_URL: boolean;
    NODE_ENV: string | undefined;
    hasEnvVars: boolean;
  };
  db: { ok: boolean; error?: string; message?: string };
};

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL || '';
  const urlPrefix = databaseUrl.split('://')[0] || 'none';
  const hasValidPrefix =
    databaseUrl.startsWith('postgresql://') ||
    databaseUrl.startsWith('postgres://');

  const result: HealthResult = {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
      ),
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      DATABASE_URL_FORMAT: `${urlPrefix} (valid: ${hasValidPrefix})`,
      DIRECT_URL: Boolean(process.env.DIRECT_URL),
      NODE_ENV: process.env.NODE_ENV,
      hasEnvVars: Boolean(hasEnvVars),
    },
    db: { ok: false },
  };
  try {
    // Lightweight connectivity check
    await prisma.$queryRaw`SELECT 1`;
    result.db.ok = true;
  } catch (e: unknown) {
    const err = e as { code?: string; name?: string; message?: string };
    result.db.ok = false;
    result.db.error = err.code || err.name || 'DB_ERROR';
    result.db.message = err.message?.slice?.(0, 300);
  }

  return NextResponse.json(result);
}
