# Spec: Day Log

> Name: **Day Log**.
> Challenge: No Hands: The Wispr Challenge · Track 1: Builders · Deadline **Fri 30 Oct 2026, 11:59 pm IST**
> Status: draft spec for review. Next: PRD + task list once approved.

---

## 1. The problem

At the end of every day I have to write my team tracker entry: what I did, grouped by project, written as engineering-level tasks, sometimes with resolution notes, sometimes split across several days when I forgot to log.

The work itself is scattered: dozens of small commits across 3–5 repos (console, pj-calculator, ds-silver-tracking, bugtrack...), plus things that never reach git — a call with ops, a DB reset, a deploy by hand on the server, debugging that went nowhere. By evening I've forgotten half of it, and I spend 15–30 minutes digging through `git log` and chat history to rebuild the day.

I already built a Claude Code skill (`task-log`) to do this from inside a repo. It proves the need, but it only sees git + the current chat, it needs a terminal open in the right folder, and it misses the non-code half of my day.

## 2. Who it is for

- **Primary user: me** — a developer at Divine Solitaires who reports daily to a team tracker.
- **Same shape:** any developer or IT person who has to post a daily update / standup / timesheet line.

## 3. The one-line pitch

**Talk through your day in 10-second bursts. At 6 pm, click once and get a tracker entry ready to paste.**

## 4. How it works (core flow)

1. **Capture during the day.** I open Daylog (one browser tab, pinned). Whenever I finish something, I click the note box, hold Fn and talk with Wispr Flow: *"fixed the voucher print cutting off the last row in silver tracking, it was the page break CSS"*. Enter saves it with a timestamp. Hinglish is fine.
   - Judges or anyone without Wispr: a **mic button** records in the browser and transcribes (Groq Whisper).
2. **Optional: add git.** Paste the output of one command I copy from the app:
   `git log --all --since=midnight --pretty="%h %s" ` (one per repo, or a loop over my project folders).
3. **Generate.** Choose the date (default: today), toggles for **Resolution notes** and **Split into N days**, then **Generate**.
4. **Get the entry.** Grouped by project, with small tweaks merged, trivia dropped, one short title plus one plain line for each item. **Copy for Sheets** button: paste into my Google Sheet tracker and each item lands in its own row.
5. **Fix by voice.** A refine box: *"merge the two console items and drop the typo one"* → regenerates. Done.

## 5. Output format (same rules as my `task-log` skill)

- Engineering-level tasks only. Merge small tweaks into one meaningful item. Drop trivia (renames, typo fixes, demo names) unless that's all there was.
- Each item: **short title** + one plain line of what and why.
- Grouped by project when there's more than one.
- **Resolution notes on:** one extra line per item, giving the problem and what fixed it.
- **Split into N days:** items spread over Day 1…N in logical order.
- No preamble, ready to paste.

**Two copy buttons:**
- **Copy for Sheets (main).** Tab-separated rows, one per item, so a paste into Google Sheets fills cells directly. Default columns: `Date | Project | Task | Details | Resolution` (Resolution is empty when the toggle is off). The column order is set once in settings to match my sheet.
- **Copy as text.** The markdown below, for chat or email.

Example as text:

```markdown
**ds-silver-tracking**
- **Fixed voucher print cut-off** — last row was clipped on A5 vouchers.
  - Resolution: page-break CSS split the table; moved to break-inside: avoid.
- **Reset the US-East test data** — cleared old handovers before the ops demo.

**console**
- **Debugged the stock sync cron** — the nightly job skipped locations with no BOM.
```

## 6. Scope

### In (MVP, by 28 Oct)
| # | Feature |
|---|---|
| 1 | A note box, plus a list of today's notes with timestamps (edit and delete) |
| 2 | A mic button: record in the browser → `/api/transcribe` → text in the note box |
| 3 | A git log paste box for each day |
| 4 | Generate for a date, with the resolution-notes toggle and split-into-N-days |
| 5 | A refine box (a spoken instruction regenerates the output) |
| 6 | **Copy for Sheets** (tab-separated rows, column order set in settings) + Copy as text, and the last 7 days of saved output |
| 7 | **Sample day preloaded on the first visit**, so a judge can click Generate within 10 seconds |
| 8 | Project names learned from the notes; I can set a short list of my projects (for grouping) |

### Out (not now)
- Login, accounts, a database. All data stays in the browser (localStorage) and can be exported or imported as JSON.
- Pulling git automatically from GitHub (my work repos are private). Pasting is enough.
- Writing straight into the Google Sheet (it needs Google sign-in, OAuth and the Sheets API). Pasting tab-separated rows takes one Ctrl+V.
- Time spent per item.
- Local or offline models. Judges can't reach my laptop, and cloud APIs keep my machine unloaded.
- A mobile app (the web page works on a phone browser).

## 7. Tech

| Part | Choice | Notes |
|---|---|---|
| App | Next.js (App Router) + Tailwind | My usual stack |
| Hosting | Vercel Hobby | No cold-start sleep, free |
| Speech-to-text | Groq `whisper-large-v3-turbo` | Free tier; used only for the in-app mic (Wispr does the rest) |
| LLM | Groq `gpt-oss-20b` with strict `json_schema` | The JSON schema makes the output's shape reliable; markdown is built from it on the client |
| Fallback LLM | Gemini Flash (free tier) | Used if Groq returns 429 or 5xx |
| Storage | localStorage + JSON export/import | Nothing to pause or expire during judging (4–6 Nov) |
| Keys | Server-side env vars on Vercel only | Never in the client, never committed |

**API routes (only two):**
- `POST /api/transcribe`: audio blob (≤ 60 s) → `{ text }`
- `POST /api/generate`: `{ notes[], gitLog, options: { resolution, splitDays, projects[] }, refine? }` → `{ days: [{ label, groups: [{ project, items: [{ title, line, resolution? }] }] }] }`

**Abuse guard:** a simple per-IP limit in memory (for example 30 generates per hour), and a cap on input size. This is enough for judges. Add a real rate limiter only if someone abuses the link.

## 8. Privacy

- The public demo uses **sample data only**: fake project names, no real company data (the rules say WeMakeDevs can feature the demo).
- My real use: notes stay in my browser; only the text I generate is sent to Groq. I'll avoid putting customer or price data in notes.

## 9. The "one real result" for the submission

- I use Daylog for my real tracker every working day from **23 to 30 Oct**.
- The demo shows: the time before (≈20 min of digging) vs. the time after (≈1 min), and the number of entries produced.
- In the demo video, real entries are shown with project names changed.

## 10. How Wispr is used

- **In the build:** every spec, prompt to Claude Code, commit message, README and post is dictated.
- **In the product:** Wispr is the main way notes go in. You talk to the note box, which is the daily habit the tool is built around.
- I'll upload a usage card each week (by Mon 26 Oct and Mon 2 Nov) and post with #NoHandsChallenge.

## 11. Demo video plan (≤ 2:00)

1. 0:00–0:15. The problem: an evening, 4 repos, and "what did I even do today?"
2. 0:15–0:45. Over the day: three quick Wispr notes, one in Hinglish, then a pasted git log.
3. 0:45–1:15. Generate → a grouped entry → toggle resolution notes.
4. 1:15–1:35. The refine box by voice: "merge the console items" → updated.
5. 1:35–1:55. Copy → paste into the tracker. The result: a week of real entries, and about 20 min vs. about 1 min.

## 12. Schedule (7 days left)

| Day | Goal |
|---|---|
| Fri 23 Oct | Approve spec → PRD + tasks. Register with the first Flow. |
| Sat 24 | Note box, notes list, localStorage, `/api/generate` working end to end |
| Sun 25 | Mic + transcribe, git paste, toggles, refine, copy |
| Mon 26 | Deploy to Vercel. Sample data. **Week 1 usage card + post** |
| Tue 27 | Real use, then fix what annoys me |
| Wed 28 | Polish, Gemini fallback, export/import |
| Thu 29 | Record the demo, write the description |
| Fri 30 | Buffer. **Submit before 11:59 pm IST** |

## 13. Success checks

- A judge opens the link and gets a generated entry from sample data in **under 30 seconds**, with no sign-in.
- Generate returns in **under 5 s**.
- On my real days, the entry needs **at most 1 refine** before I'd paste it.
- I actually used it on every working day from 23 to 30 Oct.

## 14. Decisions (23 Oct)

- Tracker = **Google Sheet** → the main output is tab-separated rows.
- **No** time per item.
- Name = **Day Log**.
- Open: the exact column headers of my tracker sheet (default `Date | Project | Task | Details | Resolution`).
