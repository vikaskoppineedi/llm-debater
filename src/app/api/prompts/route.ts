import { getAllPrompts, upsertPrompt } from '@/lib/db-prompts';
import { NextResponse } from 'next/server';
import type { PromptTemplate } from '@/lib/types';

export async function GET() {
  const prompts = getAllPrompts();
  return NextResponse.json({ prompts });
}

export async function POST(req: Request) {
  const prompt = (await req.json()) as PromptTemplate;
  upsertPrompt(prompt);
  return NextResponse.json({ ok: true });
}
