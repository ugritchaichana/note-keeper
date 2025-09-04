import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const qRaw = searchParams.get('q');
  const q = qRaw && qRaw.trim().length > 0 ? qRaw.trim() : undefined;
  const categoryIdsCsv = searchParams.get('categoryIds') || '';
  const searchInCsv = searchParams.get('searchIn') || 'title,category,content';

  const categoryIds = categoryIdsCsv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const searchIn = new Set(
    searchInCsv
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );

  const orClauses: any[] = [];
  if (q) {
    if (searchIn.has('title')) {
      orClauses.push({ title: { contains: q, mode: 'insensitive' } });
    }
    if (searchIn.has('content') || searchIn.has('detail')) {
      orClauses.push({ content: { contains: q, mode: 'insensitive' } });
    }
    if (searchIn.has('category')) {
      orClauses.push({
        category: { name: { contains: q, mode: 'insensitive' } },
      });
    }
  }

  const notes = await prisma.note.findMany({
    where: {
      userId: user.id,
      AND: [
        categoryIds.length > 0
          ? { categoryId: { in: categoryIds } }
          : undefined,
        q && orClauses.length > 0 ? { OR: orClauses } : undefined,
      ].filter(Boolean) as any,
    },
    include: { category: true },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { title, content, categoryId } = body as {
    title: string;
    content: string;
    categoryId?: string | null;
  };
  const note = await prisma.note.create({
    data: { title, content, userId: user.id, categoryId: categoryId || null },
  });
  return NextResponse.json(note, { status: 201 });
}
