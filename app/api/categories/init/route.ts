import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { PRESET_CATEGORIES } from '@/lib/presets';

export async function POST() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch existing categories for the user
  const existing = await prisma.category.findMany({
    where: { userId: user.id },
    select: { id: true, name: true },
  });
  const existingNames = new Set(
    existing.map((c: { id: string; name: string }) => c.name)
  );

  // Create any missing presets
  const toCreate = PRESET_CATEGORIES.filter((p) => !existingNames.has(p.name));
  if (toCreate.length === 0) {
    return NextResponse.json({ created: 0 });
  }

  await prisma.$transaction(
    toCreate.map((p, idx) =>
      prisma.category.create({
        data: {
          userId: user.id,
          name: p.name,
          color: p.color,
          icon: p.icon,
          sortOrder: existing.length + idx + 1,
        },
      })
    )
  );

  return NextResponse.json({ created: toCreate.length });
}
