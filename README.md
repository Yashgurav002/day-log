# Day Log

**Talk through your workday. Get your tracker rows.**

Live: **https://day-log.vercel.app** (opens on a sample day, no sign-in; click **Generate rows**)

Built for **No Hands: The Wispr Challenge** (WeMakeDevs × Wispr Flow, 16–30 Oct 2026), Track 1: Builders.

---

## The problem

I'm a developer at a jewellery company. Every day I log each task as a row in my team's Google Sheet tracker: Date, Name, Project, Module, Task schedule, Details, Status, Resolution, plus who asked for it and their department.

My work is spread over 3–5 repos and a lot of jobs that never reach git: calls with ops, DB resets, manual deploys. By evening I've forgotten half of it, and rebuilding the day from `git log` and memory took **15–30 minutes**. On days I skipped it, I had to back-fill several days at once.

## Who it's for

Me first, and any developer or IT person who has to post a daily update, standup or timesheet row.

## How it works

1. **During the day:** after each task, click the note box, hold the Wispr Flow key and say what you did, in English or Hinglish. Enter saves it with the time. No Wispr? The mic button records and transcribes in the browser.
2. **Optional:** paste `git log` for the day. The app gives you the exact command to copy.
3. **Generate:** you get one row per real task. Small tweaks are merged and trivia dropped. Each row has a short summary, a full walkthrough and a status (Done / In progress / Pending / Resolved / Closed). Resolution notes and "who asked + department" are filled only when the notes say so, never invented.
4. **Fix by voice:** "merge the two calculator rows", "the cron one is pending". Only that change is applied.
5. **Copy for Sheets:** the rows are tab-separated, with no header, in your sheet's column order. One Ctrl+V and each field lands in its own cell.

Other features:
- **Split into N days**, to back-fill a week (Sundays are skipped).
- Every cell is editable.
- Settings for your name, projects, people → department, and column order.
- The last 7 results are saved.
- JSON export and import.

## How I used Wispr Flow

- **Building it:** I dictated everything to Claude Code with Wispr Flow: the problem, the spec, the PRD and task list reviews, the answers to every question (tracker columns, statuses, date format), feedback on the UI, and the deploy instructions. I used the keyboard only for shortcuts.
- **In the product:** Wispr is the main way notes go in. You talk into the note box and the "fix by voice" box. The daily habit the tool is built around is speaking, not typing.

## What existed before

- **The idea:** earlier I had made a Claude Code skill (`task-log`) that drafts tracker lines from `git log` inside one repo. It only saw git, needed a terminal in the right folder, and missed the non-code half of my day. Day Log reuses its writing rules.
- **The code:** everything in this repo was built from scratch during the challenge (23–30 Oct 2026), starting from an empty `create-next-app`.

## Tech

| Part | Choice |
|---|---|
| App | Next.js 16 (App Router), React 19, Tailwind 4, TypeScript |
| Hosting | Vercel Hobby |
| Rows | Groq `openai/gpt-oss-120b` with a strict JSON schema; fallback `gemini-3.5-flash-lite` if Groq is rate-limited or down |
| Speech-to-text | Groq `whisper-large-v3-turbo` (in-app mic only) |
| Storage | Browser localStorage only. No accounts, no database. |

The only server code is two API routes: `POST /api/generate` and `POST /api/transcribe`. Both have a per-IP hourly limit and an input size cap. Notes stay in your browser; only the text being processed is sent to the AI provider.

## Run it locally

```bash
npm install
cp .env.example .env.local   # add GROQ_API_KEY (and GEMINI_API_KEY for the fallback)
npm run dev
npm test                     # format self-check (Node's built-in test runner)
```

Both keys are on free tiers.

## Known limits

- The in-memory rate limit resets when Vercel starts a new instance. That's enough for a demo; a shared store (Upstash/KV) is the upgrade if the link gets abused.
- Groq's free tier allows about 8K tokens a minute on the 120B model (about 2 generates a minute). Above that, the Gemini fallback answers.
- The AI sometimes still keeps a trivia item as its own row. Delete the card, or say "drop the labels row".
