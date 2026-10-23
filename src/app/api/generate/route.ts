import { generateRows, rateLimited, type GenerateInput } from "@/lib/ai";

export const maxDuration = 60;

const MAX_CHARS = 20_000;

export async function POST(req: Request) {
  if (rateLimited(req, "gen", 30)) {
    return Response.json({ error: "Hourly limit reached (30 generates). Try again later." }, { status: 429 });
  }
  const raw = await req.text();
  if (raw.length > MAX_CHARS * 2) return Response.json({ error: "Too much input." }, { status: 413 });

  let input: GenerateInput;
  try {
    input = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  input.notes ??= [];
  input.gitLogs ??= [];
  const text = input.notes.map((n) => n.text).join("") + input.gitLogs.map((g) => g.text).join("");
  if (!input.dates?.length) return Response.json({ error: "No dates given." }, { status: 400 });
  if (!text.trim()) return Response.json({ error: "Add a note or a git log first." }, { status: 400 });
  if (text.length > MAX_CHARS) {
    return Response.json({ error: `Notes are too long (max ${MAX_CHARS.toLocaleString()} characters).` }, { status: 413 });
  }
  if (input.previous && !input.refine?.trim()) return Response.json({ error: "Say what to change." }, { status: 400 });

  try {
    const rows = await generateRows(input);
    return Response.json({ rows });
  } catch (e) {
    if ((e as Error).message?.startsWith("No AI key")) return Response.json({ error: (e as Error).message }, { status: 500 });
    const status = (e as { status?: number }).status === 429 ? 429 : 502;
    return Response.json(
      { error: status === 429 ? "The AI is busy (free-tier limit). Try again in a minute." : "The AI couldn't answer. Your notes are safe, so try again." },
      { status }
    );
  }
}
