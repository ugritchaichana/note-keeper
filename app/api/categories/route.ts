import { NextResponse } from 'next/server';
import { PRESET_CATEGORIES } from '@/lib/presets';

export async function GET() {
  // Categories are fixed presets client-side; expose them directly for convenience
  return NextResponse.json(PRESET_CATEGORIES);
}

// Creation of categories is disabled: categories are fixed presets per user.
export async function POST() {
  return NextResponse.json(
    { error: 'Categories are presets only' },
    { status: 405 }
  );
}
