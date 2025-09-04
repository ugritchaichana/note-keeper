import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

async function ensureUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await ensureUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { title, content, categoryId } = body as {
    title?: string;
    content?: string;
    categoryId?: string | null;
  };

  const note = await prisma.note.update({
    where: { id, userId: user.id },
    data: { title, content, categoryId: categoryId ?? undefined },
  });
  return NextResponse.json(note);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await ensureUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await prisma.note.delete({
    where: { id, userId: user.id } as any,
  });
  return NextResponse.json({ ok: true });
}
