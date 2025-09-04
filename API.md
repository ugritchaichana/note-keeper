Note Keeper API Reference

Auth

- All endpoints require a signed-in user via Supabase SSR. Unauthorized requests return 401.

Notes

- GET /api/notes

  - Query params:
    - q: string (optional) — keyword search across title, content, category name
    - categoryIds: csv string (optional) — filter by category ids
    - searchIn: csv (optional) — any of title,content,category (default: title,category,content)
  - Response 200: Note[] with embedded category
  - Sort: updatedAt desc

- POST /api/notes

  - Body: { title: string; content: string; categoryId?: string | null }
  - Response 201: created Note (without embedded category)

- PUT /api/notes/:id

  - Body: { title?: string; content?: string; categoryId?: string | null }
  - Response 200: updated Note

- DELETE /api/notes/:id
  - Response 200: { ok: true }

Categories

- GET /api/categories

  - Response 200: Category[] ordered by sortOrder asc, name asc

- POST /api/categories

  - Body: { name: string; color?: string; icon?: string }
  - Response 201: created Category

- PUT /api/categories/:id

  - Body: { name?: string; color?: string; icon?: string; sortOrder?: number }
  - Response 200: updated Category

- DELETE /api/categories/:id

  - Response 200: { ok: true }

- POST /api/categories/reorder

  - Body: { order: string[] } — array of category ids in the new order
  - Response 200: { ok: true }

- POST /api/categories/init
  - Initializes the user’s missing preset categories. Idempotent.
  - Response 200: { created: number }

Models (Prisma)

- Note { id, title, content, createdAt, updatedAt, userId, categoryId? }
- Category { id, name, color, icon, sortOrder, createdAt, updatedAt, userId }

Common Responses

- 401 { error: 'Unauthorized' } when user is not signed in
