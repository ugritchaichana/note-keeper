import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { PRESET_CATEGORIES } from '@/lib/presets';

// Map preset key -> name (client-side constant)
function getCategoryNameByKey(key: string | null | undefined) {
  if (!key) return null;
  const preset = PRESET_CATEGORIES.find((p) => p.key === key);
  return preset?.name ?? null;
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const qRaw = searchParams.get('q');
    const q = qRaw && qRaw.trim().length > 0 ? qRaw.trim() : undefined;
    const categoryKeysCsv = searchParams.get('categoryKeys') || '';
    const categoriesCsv = searchParams.get('categories') || '';
    const searchInCsv =
      searchParams.get('searchIn') || 'title,category,content';

    const categoryKeys = categoryKeysCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const categories = categoriesCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const searchIn = new Set(
      searchInCsv
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    );

    const orClauses: Array<{
      title?: { contains: string; mode: 'insensitive' };
      content?: { contains: string; mode: 'insensitive' };
      category?: { contains: string; mode: 'insensitive' };
    }> = [];
    if (q) {
      if (searchIn.has('title')) {
        orClauses.push({ title: { contains: q, mode: 'insensitive' } });
      }
      if (searchIn.has('content') || searchIn.has('detail')) {
        orClauses.push({ content: { contains: q, mode: 'insensitive' } });
      }
      if (searchIn.has('category')) {
        orClauses.push({ category: { contains: q, mode: 'insensitive' } });
      }
    }

    // Build where conditions (loosely typed to avoid env type drift)
    const whereConditions: Array<Record<string, unknown>> = [];
    const namesFromKeys = PRESET_CATEGORIES.filter((p) =>
      categoryKeys.includes(p.key)
    ).map((p) => p.name);
    const allNames = [...categories, ...namesFromKeys];
    if (allNames.length > 0) {
      whereConditions.push({ category: { in: allNames } });
    }
    if (q && orClauses.length > 0) whereConditions.push({ OR: orClauses });

    const notes = await prisma.note.findMany({
      where: {
        userId: user.id,
        AND: whereConditions.length > 0 ? whereConditions : undefined,
      },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(notes);
  } catch (error: unknown) {
    console.error('Notes GET error:', error);
    const message =
      error instanceof Error ? error.message : 'Database connection failed';
    return NextResponse.json(
      { error: 'Failed to load notes', details: message },
      { status: 500 }
    );
  }
}
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, content, category, categoryKey } = body as {
      title: string;
      content: string;
      category?: string | null;
      categoryKey?: string | null;
    };

    let resolvedCategory: string | null | undefined = category ?? null;
    if (!resolvedCategory && categoryKey) {
      resolvedCategory = getCategoryNameByKey(categoryKey);
    }
    if (!resolvedCategory) resolvedCategory = 'Personal';

    const note = await prisma.note.create({
      data: {
        title,
        content,
        userId: user.id,
        category: resolvedCategory,
      },
    });
    return NextResponse.json(note, { status: 201 });
  } catch (error: unknown) {
    console.error('Notes POST error:', error);
    const message =
      error instanceof Error ? error.message : 'Database connection failed';
    return NextResponse.json(
      { error: 'Failed to create note', details: message },
      { status: 500 }
    );
  }
}
