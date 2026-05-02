import { deletePromptById } from '@/lib/db-prompts';
import { NextResponse } from 'next/server';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deletePromptById(id);
  return NextResponse.json({ ok: true });
}
