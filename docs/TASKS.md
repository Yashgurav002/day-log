# Day Log: Tasks

Source: `PRD.md` v1.0 · App folder: repo root · Status: `[ ]` todo · `[~]` built, not yet verified end to end · `[x]` done

## M1 — Core loop works locally (Fri 23 – Sun 25 Oct)

| ID | Task | PRD | Done when | |
|---|---|---|---|---|
| T01 | Scaffold Next.js + Tailwind + TS in `day-log/`, add `.env.example`, ignore `.env*` | — | `npm run dev` serves the page | [x] |
| T02 | Format helpers: rows → TSV for Sheets (column order, dd/mm/yyyy, no header, tabs/newlines removed from cells) and rows → markdown | F7, F8 | `npm test` self-check passes | [x] |
| T03 | Browser store: notes, git logs, results, settings in localStorage, with safe read/write | F1, F9, F10 | Data survives a reload | [x] |
| T04 | `POST /api/generate`: Groq `gpt-oss-120b` (20b was inconsistent) strict JSON schema, generation rules, input cap | F4, N5, N7 | A curl request with sample notes returns valid rows | [x] |
| T05 | Gemini fallback (`gemini-3.5-flash-lite`, ~2 s; Flash models took 40–70 s) when Groq errors or returns 429 | N5 | Groq key removed → still returns rows (if a Gemini key is set) | [x] |
| T06 | `POST /api/transcribe`: Groq `whisper-large-v3-turbo`, 60 s / size cap | F2, N7 | A webm upload returns `{ text }` | [x] |
| T07 | Per-IP rate limit on both routes | N7 | Request 31 in an hour → 429 with a clear message | [~] |
| T08 | Notes panel: add with Enter, list for the chosen date with time, edit, delete | F1 | A dictated note shows instantly and survives a reload | [~] |
| T09 | Mic button: record → transcribe → text in the box; handle denied permission | F2 | A 10 s Hinglish clip turns into text | [~] |
| T10 | Git log box per date + "copy command" button | F3 | Commits show up in the generated rows | [x] |
| T11 | Generate bar: date range, Resolution toggle, Split into N days, loading and error states | F4 | Rows show in under 5 s; errors keep the notes | [x] |
| T12 | Result table with editable cells | F6 | An edited cell is kept in the copy and after a reload | [~] |
| T13 | Copy for Sheets + Copy as text buttons | F7, F8 | A paste into Google Sheets fills one row per task in the right columns | [~] |

## M2 — Live with the sample day (Mon 26 Oct)

| ID | Task | PRD | Done when | |
|---|---|---|---|---|
| T14 | Refine box (spoken instruction → regenerate from the current rows) | F5 | "merge the two console items" works and the other rows stay | [x] |
| T15 | Settings drawer: name, projects, column order, people → department | F9 | Changes apply to the next generate and the copy | [~] |
| T16 | Sample day preloaded on first visit + banner | F11 | A fresh browser shows rows within 30 s | [x] |
| T17 | Deploy to Vercel (live: https://day-log.vercel.app, repo: github.com/Yashgurav002/day-log, auto-deploys on push), set keys in env, smoke-test the live link | N2, N3 | Live link works in an incognito window | [x] |
| T18 | Week 1: usage card screenshot + #NoHandsChallenge post | — | Posted by Mon 26 Oct | [ ] |

## M3 — Complete and used for real (Tue 27 – Wed 28 Oct)

| ID | Task | PRD | Done when | |
|---|---|---|---|---|
| T19 | History: the last 7 generated dates, reopen and copy again | F10 | Reopening shows the same rows | [~] |
| T20 | Export / import JSON | F12 | Export → clear → import restores everything | [~] |
| T21 | Mobile and dark mode check, empty states, keyboard shortcuts | N8 | Usable at 375 px wide | [ ] |
| T22 | Use it for my real tracker every working day; log fixes | §11 | Entries for 23–30 Oct pasted from Day Log | [ ] |

## M4 — Submit (Thu 29 – Fri 30 Oct)

| ID | Task | PRD | Done when | |
|---|---|---|---|---|
| T23 | README (dictated): what it is, how to run it, how Wispr was used | §10 | README in the repo | [x] |
| T24 | Demo video ≤ 2:00: silent footage + clips + voiceover script in `../../day_log_video/` (needs a real Wispr clip + voiceover) | — | Unlisted YouTube link | [~] |
| T25 | Submission: link, video, usage card, description | — | Submitted before Fri 30 Oct, 11:59 pm IST | [ ] |
