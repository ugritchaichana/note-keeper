Note Keeper Tech Stack

Frontend

- Next.js 15 (App Router) with React 19
- UI: TailwindCSS + DaisyUI components, MUI inputs/dialog transitions
- Icons: lucide-react
- Toasts: react-toastify

Auth

- Supabase SSR auth (cookies/JWT). Server route handlers validate user via createClient().

Data & Backend

- Database: PostgreSQL (Supabase)
- ORM: Prisma 6
- API: Next.js Route Handlers under app/api/\*

Caching & Performance

- Local-first cache via localStorage (lib/cache.ts)
  - Read cached notes/categories on mount for instant UI
  - Write-through after fetch
  - Optimistic updates for create/update/delete/reorder with rollback on failure
- Debounced search (2s) across title/content/category
- Component-level transitions via MUI (Fade/Zoom)

Project Structure (high level)

- app/
  - api/notes, api/categories, auth/\*
  - protected pages and root page
- components/
  - dashboard and modals (create/edit/view/confirm)
  - ui primitives and provider
- lib/
  - prisma client, supabase server/client helpers, cache utils, presets
- prisma/
  - schema.prisma and migrations

Development

- Package manager: pnpm
- Linting: ESLint (eslint-config-next)
- Styling: Tailwind with DaisyUI
- Types: TypeScript 5.9

Future Enhancements (suggested)

- Per-user cache keys and TTL for local cache
- AbortController on fetch for search
- Extract hooks: useNotes/useCategories for data concerns
- Add DB indexes (userId + updatedAt; userId + sortOrder)
- PWA offline read + queued writes
