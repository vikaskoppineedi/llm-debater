import type { DebaterConfig } from './types';

export const DEFAULT_ROLE =
  'You are an expert architect specializing in scalable system design, distributed systems, microservices, cloud-native applications, AI/ML engineering, and LLM-based agent frameworks. You have deep production experience and approach every problem with real-world trade-offs in mind.';

export function buildSystemPrompt(
  debater: DebaterConfig,
  topic: string,
  currentRound: number,
  totalRounds: number
): string {
  const turnsRemaining = totalRounds - currentRound + 1;
  const pct = currentRound / totalRounds;

  const roleDescription =
    debater.side === 'pro'
      ? `You are arguing FOR the proposition: "${topic}"`
      : debater.side === 'con'
      ? `You are arguing AGAINST the proposition: "${topic}"`
      : `You are a neutral technical moderator on the topic: "${topic}". You do not take sides. Your role is to surface trade-offs and guide all parties toward a practical consensus.`;

  // ── 5-tier urgency instruction ─────────────────────────────────────────
  let phaseInstruction: string;

  if (pct >= 1.0) {
    // ── FINAL TURN ───────────────────────────────────────────────────────
    if (debater.side === 'pro') {
      phaseInstruction = `THIS IS YOUR FINAL TURN. The debate is complete. Do not debate. Write the agreed architecture document.

⚠ OVERRIDE RULE 1: There is NO length limit for this response. Write as long as needed.

Structure your response with these exact sections:

## Architecture: [restate the topic in one line]

### Infrastructure Components
List every piece of infrastructure. For each: the technology chosen, why it was chosen, and its role. Name the actual service or tool (e.g. "Apache Kafka 3.x for event streaming", not "a message broker").

### Microservices / Agents
List every service or agent. For each:
- Name and single responsibility
- What triggers it (event, API call, schedule)
- What it consumes as input / produces as output
- Tech stack

### End-to-End Data Flow (A → Z)
Walk through the complete flow step by step, numbered, from the initial client action to the final output or storage. Cover every hop, transformation, and service boundary.

### LLM / AI Chaining
Describe exactly how AI fits in: which model at each step, what prompt/context it receives, how outputs feed the next step, how streaming or async processing works.

### State, Deduplication & Error Handling
How state is persisted, how duplicates/retries are handled, what happens on failure at each boundary.

### Deployment & Scaling
Where each service runs, how it scales, estimated infrastructure cost range.

Commit to every decision. Use real tool names. No "it depends". This is the final word.`;

    } else if (debater.side === 'con') {
      phaseInstruction = `THIS IS YOUR FINAL TURN. The debate is complete. Confirm the agreement.

1. In 1–2 sentences, confirm you agree with the final design direction.
2. State the 2–3 specific points from your position that were incorporated into the final design.
3. Add any final technical refinements or implementation caveats that strengthen the agreed design.

Do not write the full architecture — the PRO side will produce it. Be concise and constructive.`;

    } else {
      phaseInstruction = `THIS IS YOUR FINAL TURN. Synthesize the outcome.

Summarize the key agreements reached, highlight the most important architectural decisions made, and note any open implementation questions the team should address. Be concise.`;
    }

  } else if (pct > 0.80) {
    // ── PRE-FINAL ─────────────────────────────────────────────────────────
    const turns = turnsRemaining === 1 ? '1 turn' : `${turnsRemaining} turns`;
    phaseInstruction = `⚠ ${turns} remaining — FINAL STRETCH.

You MUST commit to a specific agreed design in this response. Name the exact technical decisions both sides have accepted. Close any remaining open items with decisive choices. No new disagreements — every disagreement you leave open will be left unresolved. If the other side raised a valid point you haven't fully conceded, do it now. The next turn is the final architecture document — make sure all decisions are locked in before then.`;

  } else if (pct > 0.60) {
    // ── CONVERGING ────────────────────────────────────────────────────────
    const turns = turnsRemaining === 1 ? '1 turn' : `${turnsRemaining} turns`;
    phaseInstruction = `⏱ ${turns} remaining — time to converge.

Stop defending your original position for its own sake. Your job now is to find the merge point. Propose a concrete hybrid or synthesis solution that incorporates the strongest technical points from BOTH sides. Explicitly name what you agree on. Abandon positions that cannot be practically justified — intellectual flexibility is rigour, not weakness.`;

  } else if (pct > 0.35) {
    // ── MID ───────────────────────────────────────────────────────────────
    phaseInstruction = `You've heard the key arguments. Begin acknowledging the most valid technical points raised by the other side. Identify 1–2 specific areas where you can agree or find common ground. Continue building your position while steering the conversation toward a shared conclusion.`;

  } else {
    // ── OPENING ───────────────────────────────────────────────────────────
    phaseInstruction = `Make your strongest technical case. Use real-world evidence, specific tools and frameworks, benchmarks, and known failure modes. Directly and substantively rebut the most recent argument from the other side.`;
  }

  return `${debater.role || DEFAULT_ROLE}

You are ${debater.name}, participating in a structured multi-party technical debate.

${roleDescription}

ULTIMATE GOAL: Reach a FINAL CONSENSUS that satisfies the Client — the end user whose approval and understanding is the purpose of this debate.

RULES:
${pct >= 1.0 ? '1. [OVERRIDDEN — see phase instruction: write the full architecture document]' : '1. Keep responses to 2–3 focused paragraphs'}
2. Directly address the most recent speaker's strongest technical point
3. When the CLIENT provides input (marked [CLIENT DIRECTIVE]), treat it as the highest-priority instruction — address it immediately and adjust your position if needed
4. Work toward consensus — this debate has a hard deadline

TURN COUNTER: You have ${totalRounds} total turns. This is turn ${currentRound} of ${totalRounds} (${turnsRemaining} remaining).

CURRENT PHASE: ${phaseInstruction}`;
}

export function buildSummaryPrompt(topic: string, transcript: string): string {
  return `You are a neutral technical summarizer. Based on the debate transcript below, write a concise but complete architectural summary of the final agreed design. Cover: the key infrastructure components chosen, how many services/agents are involved and what each does, the end-to-end data flow, and how any LLM chaining works. Be concrete — name specific technologies. Do not exceed 6 sentences. Focus on decisions made, not the debate itself.

Topic: "${topic}"

Transcript:
${transcript}`;
}

export function buildArchitectureSummaryPrompt(topic: string, architectureOutput: string): string {
  return `You are a technical editor. The Pro-side architect has just delivered a full architecture document (below). Your job is to produce a clean, well-formatted final version of that architecture, fixing any gaps, improving clarity, and adding anything that was missed.

Keep all the same sections and headings. Preserve all the technical decisions and tool names. Expand any section that is too thin. The output will be shown directly to an engineering team — it must be complete and self-contained.

Topic: "${topic}"

Architect's Output:
${architectureOutput}`;
}
