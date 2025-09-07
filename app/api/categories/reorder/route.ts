import { NextResponse } from 'next/server';

// Deprecated: categories are fixed client-side presets. Reorder is disabled.
export async function POST() {
  return NextResponse.json(
    { error: 'Category reorder is disabled (presets only).' },
    { status: 410 }
  );
}
