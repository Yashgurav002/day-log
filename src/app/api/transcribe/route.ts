import { rateLimited } from "@/lib/ai";

export const maxDuration = 30;

const MAX_BYTES = 4 * 1024 * 1024; // about 60 s of opus audio, under Vercel's 4.5 MB body limit

export async function POST(req: Request) {
  if (rateLimited(req, "stt", 60)) {
    return Response.json({ error: "Hourly limit reached (60 recordings). Try again later." }, { status: 429 });
  }
  if (!process.env.GROQ_API_KEY) return Response.json({ error: "Voice isn't set up on the server." }, { status: 500 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || !file.size) return Response.json({ error: "No audio received." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Recording too long (max 60 s)." }, { status: 413 });

  const projects = String(form?.get("projects") ?? "").slice(0, 300);
  const out = new FormData();
  out.append("file", file, file.name || "note.webm");
  out.append("model", "whisper-large-v3-turbo");
  out.append("response_format", "json");
  // A vocabulary hint helps Whisper spell project names and keep Hinglish in Roman script.
  out.append("prompt", `Work log note, English or Hinglish. Fixed the bug, deploy kiya, client ne bola. ${projects}`);

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: out,
    signal: AbortSignal.timeout(25_000),
  }).catch(() => null);
  if (!res?.ok) {
    if (res) console.error("Groq STT", res.status, await res.text());
    return Response.json({ error: "Couldn't transcribe. Try again, or type the note." }, { status: 502 });
  }
  const { text } = await res.json();
  return Response.json({ text: String(text ?? "").trim() });
}
