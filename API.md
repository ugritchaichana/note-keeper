Note Keeper API Reference

Auth

- All endpoints require a signed-in user via Supabase SSR. Unauthorized requests return 401.

Notes

- GET /api/notes

  - Query params:
    - q: string (optional) — keyword search across title, content, category name
    - categories: csv string (optional) — filter by category names
    - categoryKeys: csv string (optional) — filter by preset keys
    - searchIn: csv (optional) — any of title,content,category (default: title,category,content)
  - Response 200: Note[]
  - Sort: updatedAt desc

- POST /api/notes

  - Body: { title: string; content: string; category?: string | null, categoryKey?: string | null }
  - Behavior: If both are missing/null, defaults to "Personal".
  - Response 201: created Note

- PUT /api/notes/:id

  - Body: { title?: string; content?: string; category?: string | null }
  - Response 200: updated Note

- DELETE /api/notes/:id
  - Response 200: { ok: true }

Categories

- GET /api/categories

  - Response 200: Preset categories (key, name, color, icon)
  - Note: Categories are fixed client-side presets; creation/editing/deletion is disabled.

Models (Prisma)

- Note { id, title, content, createdAt, updatedAt, userId, category }

Common Responses

- 401 { error: 'Unauthorized' } when user is not signed in
