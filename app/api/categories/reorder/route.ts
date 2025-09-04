import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { order } = (await req.json()) as { order: string[] };
  // update in a transaction
  await prisma.$transaction(
    order.map((id, idx) =>
      prisma.category.update({
        where: { id, userId: user.id },
        data: { sortOrder: idx },
      })
    )
  );
  return NextResponse.json({ ok: true });
}
