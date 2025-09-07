import { NextResponse } from 'next/server';

// Deprecated: categories are fixed client-side presets. No initialization needed.
export async function POST() {
  return NextResponse.json(
    { error: 'Categories are presets only. Initialization is disabled.' },
    { status: 410 }
  );
}
