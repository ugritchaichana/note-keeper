# Note Keeper — Setup Guide (Windows)

Follow these steps to run the project locally with Next.js, Supabase (Auth + Postgres), and Prisma.

## 1) Prerequisites

- Node.js 18+ (recommended LTS 20+)
- pnpm (preferred) or npm
- A Supabase project (for Auth and Postgres)

Check versions:

```batch
node --version
pnpm --version
```

Install pnpm if missing:

```batch
npm i -g pnpm
```

## 2) Clone and install dependencies

```batch
git clone <your-repo-url>
cd note-keeper
pnpm install
```

## 3) Supabase configuration

Create a Supabase project at https://supabase.com.

In the Supabase dashboard:

- Get the Project URL and anon/public key (Settings → API)
- Get the Postgres connection string (Settings → Database → Connection string → URI)
- Enable Email auth (Authentication → Providers → Email)

Local development URL for auth callbacks:

- Add http://localhost:3000 to Site URL/Redirect URLs if required.

## 4) Environment variables

Create a `.env.local` at the project root with the following keys:

```ini
# Supabase (client-side)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_anon_key

# Prisma (database)
DATABASE_URL=postgresql://user:password@host:port/dbname?sslmode=require
DIRECT_URL=postgresql://user:password@host:port/dbname?sslmode=require
```

Tips:

- Use the Supabase-provided connection string; it usually requires `sslmode=require`.
- Keep `.env.local` out of version control.

## 5) Generate Prisma Client and run migrations

```batch
pnpm prisma:generate
pnpm prisma:migrate
```

This applies the schema in `prisma/schema.prisma` to your Supabase Postgres.

Optional (visual DB view):

```batch
pnpm prisma:studio
```

## 6) Run the app (dev)

```batch
pnpm dev
```

Navigate to http://localhost:3000

First-time notes/categories:

- Categories are fixed client-side presets; no initialization needed. The API exposes them read-only at `/api/categories` for convenience.

## 7) Build and start (production)

```batch
pnpm build
pnpm start
```

## 8) Common scripts

```batch
pnpm lint
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:studio
```

## 9) Troubleshooting

- 401 Unauthorized → Ensure you’re logged in with Supabase and env keys are correct.
- DB connection errors → Recheck `DATABASE_URL`/`DIRECT_URL` and SSL params.
- Styles not applied → Confirm Tailwind/DaisyUI installed and `globals.css` imported (already wired).
- Version drift → Dependencies are pinned in `package.json`; run `pnpm install` to sync with lockfile.

## 10) Deploy (overview)

- Set the same env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY, DATABASE_URL, DIRECT_URL) on your host (e.g., Vercel).
- Build command: `pnpm build` Runtime: Node 18/20.

You’re ready to develop and collaborate with the team.
