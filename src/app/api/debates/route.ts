import { getAllDebates, upsertDebate } from '@/lib/db-debates';
import { NextResponse } from 'next/server';
import type { SavedDebate } from '@/lib/types';

export async function GET() {
  const debates = getAllDebates();
  return NextResponse.json({ debates });
}

export async function POST(req: Request) {
  const debate = (await req.json()) as SavedDebate;
  upsertDebate(debate);
  return NextResponse.json({ ok: true });
}
