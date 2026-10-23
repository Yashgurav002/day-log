import { STATUSES, type Row } from "./format";

export type GenerateInput = {
  notes: { date: string; time: string; text: string }[]; // date dd/mm/yyyy, time HH:MM
  gitLogs: { date: string; text: string }[];
  dates: string[]; // allowed output dates, dd/mm/yyyy
  split: boolean;
  resolution: boolean;
  projects: string[];
  people: { name: string; department: string }[];
  previous?: Row[];
  refine?: string;
};

const str = { type: "string" };
export const ROWS_SCHEMA = {
  type: "object",
  properties: {
    rows: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: str,
          project: str,
          module: str,
          task: str,
          details: str,
          status: { type: "string", enum: [...STATUSES] },
          resolution: str,
          requestedBy: str,
          department: str,
        },
        required: ["date", "project", "module", "task", "details", "status", "resolution", "requestedBy", "department"],
        additionalProperties: false,
      },
    },
  },
  required: ["rows"],
  additionalProperties: false,
};

function systemPrompt(i: GenerateInput) {
  return `You turn a software developer's raw work notes and git commits into rows for their team's daily tracker (a Google Sheet).

Rules:
1. One row per meaningful engineering task. Merge small related tweaks (same project and area) into one row. A commit that matches a note belongs to that note's row. Trivia (label renames, copy or typo fixes, demo names, breaks, chit-chat) is never its own row: fold it into another row of the same project (and keep it out of that row's task summary), or drop it. Only if a day has nothing else does trivia get a row.
2. task: a short one-line summary, max 10 words, past tense, starting with a verb. Example: "Fixed voucher print cut-off on A5".
3. details: the full walkthrough: what changed, which pages, screens, files or tables, the steps taken, and why. 1–4 plain sentences. Use ONLY facts from the notes and commits. Never pad, guess or add generic filler.
4. project: only when the note or its matching commit names it. If it matches a known project (case-insensitive, loose match, e.g. "silver tracking" = "ds-silver-tracking"), use the known name exactly; otherwise the name as said. If no project is named, use "". Never guess from other rows.
5. module: the feature, screen or area inside the project if stated or obvious; otherwise "".
6. status: "Resolved" = a bug or issue that got fixed. "Done" = completed work. "In progress" = ongoing or continuing later. "Pending" = waiting on someone, or not started. "Closed" = dropped or closed with no further action. Default "Done".
7. resolution: ${
    i.resolution
      ? 'one sentence per row: the problem and what fixed it ("Problem → fix"). For non-bug work: the need and how it was met.'
      : 'always "".'
  }
8. requestedBy: a person's name ONLY if the notes say someone asked, requested or reported it; otherwise "". department: from the notes, or from the known people list for that person; otherwise "". Never invent names or departments.
9. Notes may be Hinglish (Hindi + English, romanized or Devanagari). Always write the output in clear, simple English.
10. date (dd/mm/yyyy): ${
    i.split
      ? `spread the rows across exactly these dates, in logical order (setup and dependencies first), roughly evenly: ${i.dates.join(", ")}.`
      : `the date of the note the row comes from (merged rows take the latest). Allowed dates: ${i.dates.join(", ")}.`
  }
11. Order rows by date, and keep rows of the same project next to each other within a date.`;
}

function userPrompt(i: GenerateInput) {
  const parts = [
    `Known projects: ${i.projects.join(", ") || "(none)"}`,
    `Known people: ${i.people.map((p) => `${p.name} = ${p.department}`).join(", ") || "(none)"}`,
    "",
    "NOTES:",
    i.notes.map((n) => `[${n.date} ${n.time}] ${n.text}`).join("\n") || "(none)",
  ];
  for (const g of i.gitLogs) parts.push("", `GIT COMMITS (${g.date}):`, g.text);
  if (i.previous) {
    parts.push(
      "",
      "CURRENT ROWS:",
      JSON.stringify({ rows: i.previous }),
      "",
      `INSTRUCTION: ${i.refine}`,
      "Apply the instruction to the current rows. Change only what it asks for; keep every other row exactly as it is. Return the full list of rows."
    );
  }
  return parts.join("\n");
}

class HttpError extends Error {
  constructor(public status: number, msg: string) {
    super(msg);
  }
}

async function groq(i: GenerateInput) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt(i) },
        { role: "user", content: userPrompt(i) },
      ],
      response_format: { type: "json_schema", json_schema: { name: "tracker_rows", strict: true, schema: ROWS_SCHEMA } },
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new HttpError(res.status, `Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content).rows as Row[];
}

async function gemini(i: GenerateInput) {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
    {
      method: "POST",
      headers: { "x-goog-api-key": process.env.GEMINI_API_KEY!, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt(i) }] },
        contents: [{ role: "user", parts: [{ text: userPrompt(i) }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseJsonSchema: ROWS_SCHEMA,
        },
      }),
      signal: AbortSignal.timeout(25_000),
    }
  );
  if (!res.ok) throw new HttpError(res.status, `Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return JSON.parse(data.candidates[0].content.parts[0].text).rows as Row[];
}

export async function generateRows(i: GenerateInput): Promise<Row[]> {
  const providers = [process.env.GROQ_API_KEY && groq, process.env.GEMINI_API_KEY && gemini].filter(Boolean) as ((
    i: GenerateInput
  ) => Promise<Row[]>)[];
  if (!providers.length) throw new HttpError(500, "No AI key configured on the server.");
  let lastErr: unknown;
  for (const p of providers) {
    try {
      return clean(await p(i), i);
    } catch (e) {
      lastErr = e;
      console.error(e);
    }
  }
  throw lastErr;
}

// Keep the model honest: allowed dates only, no resolution when the toggle is off.
function clean(rows: Row[], i: GenerateInput): Row[] {
  return rows.map((r) => ({
    ...r,
    date: i.dates.includes(r.date) ? r.date : i.dates[i.dates.length - 1],
    status: STATUSES.includes(r.status) ? r.status : "Done",
    resolution: i.resolution ? r.resolution : "",
  }));
}

// ponytail: in-memory, per server instance; resets on cold start. Use Upstash/KV if the link gets abused.
const hits = new Map<string, number[]>();
export function rateLimited(req: Request, bucket: string, perHour: number) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= perHour) return true;
  recent.push(now);
  hits.set(key, recent);
  return false;
}
