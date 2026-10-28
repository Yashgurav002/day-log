# PRD: Day Log

| | |
|---|---|
| **Product** | Day Log: talk through your workday, get your tracker rows |
| **Owner** | Yash Gurav |
| **Version** | v1.0 (draft for approval) · 23 Oct 2026 |
| **For** | No Hands: The Wispr Challenge · Track 1: Builders · submit by Fri 30 Oct, 11:59 pm IST |
| **Based on** | `SPEC.md` (approved direction) |

---

## 1. Problem

Every day I fill a row per task in my team's **Google Sheet tracker**: date, name, project, module, task, details, status, resolution, who requested it and their department. The work is spread over 3–5 repos and many non-code jobs: calls with ops, DB resets, manual deploys. By evening I have forgotten half of it, and I spend **15–30 minutes** rebuilding the day from `git log` and memory. On days I skip it, I have to back-fill several days at once.

## 2. Goal and non-goals

**Goal:** turn short voice notes taken during the day (plus an optional git log) into tracker rows I paste into the Google Sheet with one Ctrl+V, in **about 1 minute** at the end of the day.

**Non-goals (v1):**
- Writing to the Google Sheet directly (needs Google sign-in and the Sheets API).
- Accounts, login, a server database.
- Time spent per item.
- Pulling git automatically from GitHub (the work repos are private).
- Local or offline AI models.
- A browser extension (see §8).

## 3. Users

| User | Need |
|---|---|
| **Me (primary)** | A daily tracker entry without the evening dig. I use Wispr Flow for every note. |
| **Judges** | Open a link, see a sample day, click once, see rows. No sign-in, no Wispr needed. |
| **Other devs / IT staff (later)** | The same job for any team that logs to a sheet. |

## 4. Tracker format (the output contract)

One row per task. These are the default columns, in this order:

| # | Column | Filled from |
|---|---|---|
| 1 | **Date** | The note's date (dd/mm/yyyy) |
| 2 | **Name** | Settings (my name, set once) |
| 3 | **Project** | AI, matched against my project list in settings |
| 4 | **Module** | AI (e.g. "Voucher print", "Stock sync cron"); empty if unclear |
| 5 | **Task schedule** | AI: a short summary of the task in one line (e.g. "Fixed voucher print cut-off") |
| 6 | **Details** | AI: the full walkthrough: what changed, which pages, screens or files, what was done step by step, and why |
| 7 | **Status** | AI: `Done` / `In progress` / `Pending` / `Resolved` / `Closed`, default `Done` |
| 8 | **Resolution** | AI: problem → fix, filled only when the toggle is on |
| 9 | **Requested by** | AI: the person's name if the note says it ("Priya asked..."); empty otherwise |
| 10 | **Department** | AI: the department if said, or remembered from settings for a known person; empty otherwise |

- The column order is editable in settings, so the paste matches the sheet exactly.
- The copied text has **no header row**, so it pastes under the existing rows.
- If something isn't in the notes, the cell stays **empty**. The AI must not invent requesters, departments or modules.

## 5. Functional requirements

| ID | Requirement | Acceptance criteria |
|---|---|---|
| **F1** | **Notes**: a text box to add a note; Enter saves it with a timestamp; a list of the day's notes with edit and delete | A note typed or dictated with Wispr appears in the list instantly and is still there after a page reload |
| **F2** | **Mic button**: record in the browser, transcribe, put the text in the note box for review | A 10 s English or Hinglish clip becomes text in under 4 s; mic permission denied shows a clear message |
| **F3** | **Git log paste**: a box per date for pasted `git log` output, with a one-click copy of the command to run | Pasted commits are used in generation; an empty box is fine |
| **F4** | **Generate**: choose a date range (default: today) and toggles for **Resolution** and **Split into N days**, then generate tracker rows | Returns in under 5 s; follows the rules in §6; the rows show in a table on screen |
| **F5** | **Refine by voice**: an instruction box ("merge the two console items", "status of the cron one is pending") that regenerates from the current result | The change is applied without losing the other rows |
| **F6** | **Edit cells**: any cell in the result table can be fixed by hand before copying | Edits are kept in the copy and saved |
| **F7** | **Copy for Sheets**: copies rows as tab-separated text | Ctrl+V into Google Sheets fills one row per task, one column per field, in the settings' column order |
| **F8** | **Copy as text**: the same result as readable markdown, grouped by project | Pastes cleanly into WhatsApp, chat or email |
| **F9** | **Settings**: my name, my project list, column order, known people → department (e.g. "Priya → Ops") | Saved in the browser; used in every generation |
| **F10** | **History**: saved results for the last 7 generated dates, which can be reopened and copied again | Reopening shows the same rows |
| **F11** | **Sample day**: on the first visit, a realistic sample day (fake project names) is preloaded with a banner: "Sample day: click Generate" | A judge gets rows within 30 s of opening the link |
| **F12** | **Export / import**: download and restore all data as one JSON file | Export, clear the browser, import → everything is back |

## 6. Generation rules (from my `task-log` skill)

1. Engineering-level tasks only. Merge small tweaks into one meaningful row. Drop trivia (renames, typo fixes, demo names) unless that's all there was.
2. Each row has a **Task schedule** (a short one-line summary) and **Details** (the full walkthrough: what changed, which pages, screens or files, the steps taken, and why). The Details text uses only what the notes and git log say; it doesn't pad.
2b. Status: `Resolved` for a bug or issue that was fixed, `Closed` for something finished or dropped with no further action, `Done` for completed work, and `In progress` / `Pending` when the note says so.
3. Use the project names from settings when a note matches one. Otherwise use what the note says.
4. **Split into N days**: spread the rows over N consecutive dates from the start date, in logical order.
5. **Resolution on**: fill the Resolution column with the problem and what fixed it. Off: leave it empty.
6. Never invent facts: an unknown requester, department or module is left empty.
7. Hinglish notes produce English rows.

## 7. Non-functional requirements

| ID | Requirement |
|---|---|
| **N1** | **Zero laptop load.** All AI runs in the cloud; the page is a light web app. |
| **N2** | **Free.** Vercel Hobby, the Groq free tier, the Gemini free tier as a fallback. No paid service. |
| **N3** | **Always up for judging (4–6 Nov).** No host that sleeps (not Render) and no database that pauses (not Supabase). |
| **N4** | **Speed.** Generate in under 5 s; transcribe in under 4 s for 10 s of audio. |
| **N5** | **Reliability.** The output is forced into a fixed JSON shape (strict schema), so the table never breaks. If Groq fails or hits its limit, the app falls back to Gemini. If both fail, it shows a clear error and keeps my notes. |
| **N6** | **Privacy.** Notes stay in my browser. Only the text being processed goes to the AI provider. The public demo uses fake data only. API keys stay on the server only, and `.env` is never committed. |
| **N7** | **Abuse guard.** A per-IP limit (about 30 generates and 60 transcribes an hour) and a cap on input size (about 20K characters, 60 s of audio). |
| **N8** | **Works in Chrome and Edge on desktop**, and is usable on a phone browser. |

## 8. Decision: a web page, not an extension

**v1 is a web page** (one pinned tab, installable as an app from Chrome's menu).

- Judges must open a **live link without asking for access**. An extension needs the Chrome Web Store (review takes days, plus a $5 fee) or a manual "load unpacked" install. Either is a blocker for judging.
- Wispr Flow already types into any text box, so a page gets the same voice input as an extension.
- A pinned tab plus "Install app" gives the always-open feel.
- **Later (v2):** a tiny extension or a global hotkey popup that sends a note to the same app.

## 9. Tech

| Part | Choice |
|---|---|
| App | Next.js (App Router) + Tailwind, TypeScript |
| Hosting | Vercel Hobby |
| Speech-to-text | Groq `whisper-large-v3-turbo` (only for the in-app mic; Wispr covers my own notes) |
| LLM | Groq `gpt-oss-20b` with a strict JSON schema; Gemini Flash as the fallback |
| Storage | Browser localStorage + JSON export/import |
| Server | Two API routes only: `POST /api/transcribe` and `POST /api/generate` |

**Generate response shape:**
```json
{ "rows": [ { "date": "", "project": "", "module": "", "task": "", "details": "",
              "status": "Done", "resolution": "", "requestedBy": "", "department": "" } ] }
```
Name comes from settings; the app adds it on the client.

## 10. Wispr in the build and in the product

- **Build:** every prompt, PRD/task review, commit message, README and post is dictated with Flow.
- **Product:** Flow is the main way notes go in, through the note box and the refine box.
- **Proof:** a usage card screenshot by Mon 26 Oct and Mon 2 Nov, plus #NoHandsChallenge posts.

## 11. Success metrics

| Metric | Target |
|---|---|
| Time from opening the link to seeing rows (judge, sample day) | ≤ 30 s |
| My end-of-day time | ≤ 2 min (was 15–30 min) |
| Refines needed before I paste | ≤ 1 on most days |
| Real days used, 23–30 Oct | Every working day |
| Invented requester/department values | 0 |

## 12. Release plan

| Date | Milestone |
|---|---|
| Fri 23 Oct | PRD approved → task list approved. Register with the first Flow. |
| Sun 25 Oct | **M1:** notes → generate → copy for Sheets, working locally |
| Mon 26 Oct | **M2:** live on Vercel with the sample day. Week 1 usage card + post. |
| Wed 28 Oct | **M3:** all F1–F12 done, real use, fixes |
| Thu 29 Oct | Demo video (≤ 2 min) + description |
| Fri 30 Oct | Buffer. Submit before 11:59 pm IST. |

## 13. Risks

| Risk | Mitigation |
|---|---|
| Groq free limits are lower than published | Gemini fallback; check the real limits on day 1 |
| The AI invents requesters or merges wrongly | Strict schema, "leave empty" rule, editable cells, refine box |
| The public link gets abused and burns the free quota | Per-IP limit and input caps (N7) |
| Real company data ends up in the demo | Sample data only; rename projects in the video |

## 14. Decisions (23 Oct)

- **Task schedule** = a short summary of the task. **Details** = the full walkthrough.
- **Status values:** Done, In progress, Pending, Resolved, Closed.
- **Date format:** dd/mm/yyyy.
- **Form:** a web page, not an extension (§8).
