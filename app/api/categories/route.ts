import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name, color } = (await req.json()) as {
    name: string;
    color?: string;
  };
  const category = await prisma.category.create({
    data: { name, color: color ?? '#a3a3a3', userId: user.id },
  });
  return NextResponse.json(category, { status: 201 });
}
