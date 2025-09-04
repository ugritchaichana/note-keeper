<h1 align="center">Note Keeper</h1>

Simple, fast notes with categories. Built with Next.js, Supabase Auth (SSR), and Prisma on PostgreSQL.

## Features

- Next.js App Router with SSR-friendly Supabase auth (cookies/JWT)
- Notes and Categories CRUD with optimistic UI and local cache
- Search across title/content/category, debounced for performance
- Clean UI with TailwindCSS, DaisyUI, and MUI transitions

## Tech Stack

- Frontend: Next.js 15, React 19, TailwindCSS + DaisyUI, MUI
- Auth: Supabase (SSR via `@supabase/ssr`)
- Data: PostgreSQL (Supabase) + Prisma ORM 6
- Tooling: TypeScript 5.9, ESLint, pnpm

## Quick Start

Prerequisites

- Node.js 22.x
- pnpm 9.x
- A Supabase project (Auth + Postgres)

1. Install dependencies

- Clone your repo, then in the project folder:
  - `pnpm install`

2. Environment variables
   Create `.env.local` with:

```ini
# Supabase (client-side)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_anon_key

# Prisma (database)
DATABASE_URL=postgresql://user:password@host:port/dbname?sslmode=require
DIRECT_URL=postgresql://user:password@host:port/dbname?sslmode=require
```

3. Prisma

- Generate client: `pnpm prisma:generate`
- Apply schema: `pnpm prisma:migrate`

4. Run

- Dev: `pnpm dev` → http://localhost:3000
- Build: `pnpm build`
- Prod: `pnpm start`

Tips

- First-time users can initialize preset categories via `POST /api/categories/init`.
- Local cache makes the UI feel instant; server stays source of truth.

## API Reference

Auth

- All endpoints require a signed-in user (401 if not signed in).

Notes

- GET `/api/notes`
  - Query: `q?`, `categoryIds?` (csv), `searchIn?` (title,content,category)
  - Response: Note[] with `category`
- POST `/api/notes`
  - Body: `{ title: string; content: string; categoryId?: string | null }`
- PUT `/api/notes/:id`
  - Body: `{ title?: string; content?: string; categoryId?: string | null }`
- DELETE `/api/notes/:id`

Categories

- GET `/api/categories` → ordered by `sortOrder asc, name asc`
- POST `/api/categories` → `{ name: string; color?: string; icon?: string }`
- PUT `/api/categories/:id` → `{ name?, color?, icon?, sortOrder? }`
- DELETE `/api/categories/:id`
- POST `/api/categories/reorder` → `{ order: string[] }`
- POST `/api/categories/init` → `{ created: number }`

Health

- GET `/api/health` → checks env presence and DB connectivity

Models (Prisma)

- Note: `{ id, title, content, createdAt, updatedAt, userId, categoryId? }`
- Category: `{ id, name, color, icon, sortOrder, createdAt, updatedAt, userId }`

## Deploy (Vercel)

Environment Variables

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
- DATABASE_URL (with `sslmode=require`)
- DIRECT_URL (with `sslmode=require`)

Build Settings

- Node.js Version: 22.x
- Package manager: pnpm (lockfile committed)
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm build`

Notes

- Commit `pnpm-lock.yaml` for reproducible installs.
- Ensure your Supabase auth Site URL/Redirect URLs include your prod domain.

## Troubleshooting

- 401 Unauthorized: Login required, verify Supabase envs and cookies.
- Database errors: Check `DATABASE_URL`/`DIRECT_URL` and SSL params.
- Vercel pnpm meta fetch errors: Commit `pnpm-lock.yaml`, use pnpm 9 and Node 22.
- Health check: `/api/health` in prod to inspect env and DB connectivity.
