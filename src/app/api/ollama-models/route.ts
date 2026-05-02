export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const host = searchParams.get('host') ?? 'http://localhost:11434';

  try {
    const res = await fetch(`${host}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error('Ollama not reachable');

    const data = await res.json();
    const models: string[] = (data.models ?? []).map(
      (m: { name: string }) => m.name
    );

    return Response.json({ models });
  } catch {
    return Response.json({ models: [], error: `Ollama not reachable at ${host}` });
  }
}
