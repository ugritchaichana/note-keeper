import { NextResponse } from 'next/server';

// Deprecated: categories are fixed client-side presets. Editing is disabled.
export async function PUT() {
  return NextResponse.json(
    { error: 'Category editing is disabled (presets only).' },
    { status: 410 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Category deletion is disabled (presets only).' },
    { status: 410 }
  );
}
