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
  const { name, color } = (await req.json()) as {
    name?: string;
    color?: string;
  };
  const category = await prisma.category.update({
    where: { id, userId: user.id } as any,
    data: { name, color },
  });
  return NextResponse.json(category);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await ensureUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await prisma.category.delete({
    where: { id, userId: user.id } as any,
  });
  return NextResponse.json({ ok: true });
}
