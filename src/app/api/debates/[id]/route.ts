import { getDebateById, deleteDebateById } from '@/lib/db-debates';
import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const debate = getDebateById(id);
  if (!debate) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ debate });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteDebateById(id);
  return NextResponse.json({ ok: true });
}
