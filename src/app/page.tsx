"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addDays, daysBetween, isoDay, toDMY, toMarkdown, toTSV, workingDays, type Row } from "@/lib/format";
import { emptyState, load, sampleState, save, uid, type Note, type State } from "@/lib/store";
import { btn, btnGhost, btnOutline, btnPrimary, card, CopyButton, Icon, Kbd, MicButton, RowCard, SettingsPanel, Toggle } from "./ui";

const prettyDay = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

export default function Page() {
  const [s, setS] = useState<State | null>(null);
  const [day, setDay] = useState(""); // set on mount: "today" must be the visitor's, not the build's
  const [from, setFrom] = useState(day);
  const [to, setTo] = useState(day);
  const [resolution, setResolution] = useState(true);
  const [split, setSplit] = useState(false);
  const [splitN, setSplitN] = useState(2);
  const [busy, setBusy] = useState<"" | "gen" | "refine">("");
  const [error, setError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const d = isoDay();
    setDay(d);
    setFrom(d);
    setTo(d);
    setS(load());
  }, []);
  useEffect(() => {
    if (s) save(s);
  }, [s]);

  const pickDay = (d: string) => {
    setDay(d);
    setFrom(d);
    setTo(d);
    setError("");
  };

  const key = `${from}|${to}`;
  const result = s?.results[key];

  const generate = useCallback(
    async (refine?: string) => {
      if (!s || busy) return;
      setError("");
      setBusy(refine ? "refine" : "gen");
      const range = daysBetween(from, to < from ? from : to);
      const dates = (split ? workingDays(from, splitN) : range).map(toDMY);
      const body = {
        notes: s.notes.filter((n) => n.date >= from && n.date <= to).sort(byTime).map((n) => ({ date: toDMY(n.date), time: n.time, text: n.text })),
        gitLogs: range.filter((d) => s.gitLogs[d]?.trim()).map((d) => ({ date: toDMY(d), text: s.gitLogs[d] })),
        dates,
        split,
        resolution,
        projects: s.settings.projects,
        people: s.settings.people,
        ...(refine ? { previous: s.results[key]?.rows, refine } : {}),
      };
      try {
        const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setS((p) => p && { ...p, results: { ...p.results, [key]: { from, to, rows: data.rows, createdAt: Date.now() } } });
      } catch (e) {
        setError((e as Error).message || "Something went wrong. Your notes are safe.");
      } finally {
        setBusy("");
      }
    },
    [s, busy, from, to, split, splitN, resolution, key]
  );

  // Global shortcuts: "/" focuses the note box, Ctrl/Cmd+Enter generates.
  const composerRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        composerRef.current?.focus();
      }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        generate();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [generate]);

  if (!s) return <div className="min-h-screen" />;

  const dayNotes = s.notes.filter((n) => n.date === day).sort(byTime);
  const setNotes = (fn: (n: Note[]) => Note[]) => setS({ ...s, notes: fn(s.notes) });
  const setRows = (rows: Row[]) => result && setS({ ...s, results: { ...s.results, [key]: { ...result, rows } } });
  const history = Object.values(s.results).sort((a, b) => b.createdAt - a.createdAt).slice(0, 7);
  const today = isoDay();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      {/* header */}
      <header className="sticky top-0 z-30 -mx-4 mb-6 flex items-center gap-3 border-b border-line bg-bg/80 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-lg bg-fg text-bg">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
              <path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Day Log</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button className={`${btnGhost} !px-2`} onClick={() => pickDay(addDays(day, -1))} aria-label="Previous day">
            <Icon name="left" />
          </button>
          <label className="relative">
            <span className="pointer-events-none block min-w-28 rounded-lg border border-line bg-surface px-3 py-1.5 text-center text-sm font-medium">
              {day === today ? "Today" : prettyDay(day)}
            </span>
            <input type="date" value={day} max={today} onChange={(e) => e.target.value && pickDay(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Pick a day" />
          </label>
          <button className={`${btnGhost} !px-2`} onClick={() => pickDay(addDays(day, 1))} disabled={day >= today} aria-label="Next day">
            <Icon name="right" />
          </button>
          <span className="mx-1 h-5 w-px bg-line" />
          <button className={`${btnGhost} !px-2`} onClick={() => setSettingsOpen(true)} aria-label="Settings">
            <Icon name="settings" />
          </button>
        </div>
      </header>

      {s.sample && (
        <div className="rise mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-accent/30 bg-accent/[.06] px-4 py-3 text-sm">
          <span className="size-2 rounded-full bg-accent" />
          <span className="flex-1">
            <b className="font-semibold">Sample day loaded.</b> <span className="text-muted">Hit</span> <b>Generate rows</b>{" "}
            <span className="text-muted">to turn these notes and commits into tracker rows.</span>
          </span>
          <button
            className={btnOutline}
            onClick={() => {
              setS(emptyState({ ...s.settings, name: "", projects: [], people: [] }));
              setSettingsOpen(true);
            }}
          >
            Start with my own day
          </button>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* ---------------- capture ---------------- */}
        <section className="space-y-4 lg:sticky lg:top-20">
          <Composer
            inputRef={composerRef}
            hint={s.settings.projects.join(", ")}
            onAdd={(text) => {
              const now = new Date();
              setNotes((n) => [...n, { id: uid(), date: day, time: now.toTimeString().slice(0, 5), text }]);
            }}
          />

          <div className={`${card} p-2`}>
            <div className="flex items-center justify-between px-3 pb-1 pt-2">
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted">Notes · {dayNotes.length}</h2>
            </div>
            {dayNotes.length === 0 ? (
              <p className="px-3 pb-4 pt-2 text-sm text-faint">
                Nothing logged {day === today ? "yet today" : "on this day"}. After each task, hold your Wispr key and say what you did.
              </p>
            ) : (
              <ul>
                {dayNotes.map((n) => (
                  <NoteItem
                    key={n.id}
                    note={n}
                    onSave={(text) => setNotes((all) => all.map((x) => (x.id === n.id ? { ...x, text } : x)))}
                    onDelete={() => setNotes((all) => all.filter((x) => x.id !== n.id))}
                  />
                ))}
              </ul>
            )}
          </div>

          <GitBox day={day} value={s.gitLogs[day] ?? ""} onChange={(v) => setS({ ...s, gitLogs: { ...s.gitLogs, [day]: v } })} />
        </section>

        {/* ---------------- tracker ---------------- */}
        <section className="space-y-4">
          <div className={`${card} p-4 sm:p-5`}>
            <div className="flex flex-wrap items-end gap-3">
              <DateField label="From" value={from} max={today} onChange={(v) => { setFrom(v); if (v > to) setTo(v); }} />
              <DateField label="To" value={to} min={from} max={today} onChange={setTo} />
              <div className="ml-auto hidden text-xs text-muted sm:block">
                <Kbd>Ctrl</Kbd> <Kbd>Enter</Kbd>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Toggle on={resolution} onChange={setResolution} label="Resolution notes" />
              <span className="inline-flex items-center gap-2">
                <Toggle on={split} onChange={setSplit} label="Split into" />
                <select
                  value={splitN}
                  onChange={(e) => { setSplitN(+e.target.value); setSplit(true); }}
                  className="rounded-md border border-line bg-surface px-1.5 py-0.5 text-sm outline-none"
                  aria-label="Number of days"
                >
                  {[2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className={split ? "text-sm" : "text-sm text-muted"}>days</span>
              </span>
              <button className={`${btnPrimary} ml-auto w-full sm:w-auto`} onClick={() => generate()} disabled={!!busy}>
                {busy === "gen" ? <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Icon name="sparkle" />}
                {result ? "Regenerate" : "Generate rows"}
              </button>
            </div>
            {split && (
              <p className="mt-3 font-mono text-xs text-muted">
                → {workingDays(from, splitN).map(toDMY).join(" · ")} <span className="text-faint">(Sundays skipped)</span>
              </p>
            )}
          </div>

          {error && (
            <div role="alert" className="rise rounded-xl border border-accent/40 bg-accent/[.07] px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {busy === "gen" ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`${card} space-y-3 p-5`}>
                  <div className="skeleton h-3 w-40 rounded" />
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                </div>
              ))}
            </div>
          ) : result ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className="mr-auto text-sm text-muted">
                  <b className="font-semibold text-fg">{result.rows.length} rows</b> · {from === to ? toDMY(from) : `${toDMY(from)} – ${toDMY(to)}`}
                </p>
                <CopyButton icon="text" label="Copy as text" text={() => toMarkdown(result.rows)} />
                <CopyButton primary icon="sheet" label="Copy for Sheets" text={() => toTSV(result.rows, s.settings.columns, s.settings.name)} />
              </div>
              <div className={`space-y-3 transition ${busy === "refine" ? "pointer-events-none opacity-50" : ""}`}>
                {result.rows.map((r, i) => (
                  <RowCard
                    key={i}
                    index={i}
                    row={r}
                    onChange={(nr) => setRows(result.rows.map((x, j) => (j === i ? nr : x)))}
                    onDelete={() => setRows(result.rows.filter((_, j) => j !== i))}
                  />
                ))}
              </div>
              <Refine busy={busy === "refine"} hint={s.settings.projects.join(", ")} onSubmit={(t) => generate(t)} />
            </>
          ) : (
            <EmptyResult />
          )}

          {history.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 text-xs">
              <span className="mr-1 text-faint">Recent</span>
              {history.map((h) => {
                const k = `${h.from}|${h.to}`;
                return (
                  <button
                    key={k}
                    onClick={() => { setDay(h.to); setFrom(h.from); setTo(h.to); }}
                    className={`rounded-full border px-2.5 py-1 font-mono transition ${k === key ? "border-fg bg-fg text-bg" : "border-line bg-surface text-muted hover:text-fg"}`}
                  >
                    {h.from === h.to ? toDMY(h.from).slice(0, 5) : `${toDMY(h.from).slice(0, 5)}–${toDMY(h.to).slice(0, 5)}`}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {settingsOpen && (
        <SettingsPanel
          settings={s.settings}
          onChange={(settings) => setS({ ...s, settings })}
          onClose={() => setSettingsOpen(false)}
          onExport={() => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([JSON.stringify(s, null, 2)], { type: "application/json" }));
            a.download = `day-log-${today}.json`;
            a.click();
          }}
          onImport={async (f) => {
            try {
              const data = JSON.parse(await f.text()) as State;
              if (!Array.isArray(data.notes) || !data.settings) throw 0;
              setS({ ...data, sample: false });
              setSettingsOpen(false);
            } catch {
              setError("That file isn't a Day Log export.");
            }
          }}
          onFresh={() => {
            if (confirmFresh()) setS(emptyState({ ...s.settings, name: s.sample ? "" : s.settings.name, projects: s.sample ? [] : s.settings.projects, people: s.sample ? [] : s.settings.people }));
          }}
          onSample={() => {
            setS(sampleState());
            pickDay(today);
            setSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}

const byTime = (a: Note, b: Note) => (a.date + a.time).localeCompare(b.date + b.time);

// ponytail: native confirm; the only destructive action in the app.
const confirmFresh = () => window.confirm("Clear all notes, commits and results in this browser? Settings are kept.");

function Composer({ onAdd, hint, inputRef }: { onAdd: (t: string) => void; hint: string; inputRef: React.RefObject<HTMLTextAreaElement | null> }) {
  const [text, setText] = useState("");
  const submit = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText("");
  };
  return (
    <div className={`${card} p-1.5 transition focus-within:border-line-strong`}>
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={2}
        placeholder="What did you just finish? Hold your Wispr key and talk…"
        className="block max-h-60 min-h-[76px] w-full bg-transparent px-3 pt-2.5 text-[15px] leading-relaxed outline-none placeholder:text-faint"
      />
      <div className="flex items-center gap-2 px-1.5 pb-1">
        <MicButton hint={hint} onText={(t) => setText((p) => (p ? p + " " : "") + t)} />
        <span className="hidden text-xs text-faint sm:inline">
          <Kbd>Enter</Kbd> save · <Kbd>/</Kbd> focus
        </span>
        <button className={`${btnPrimary} ml-auto !h-8`} onClick={submit} disabled={!text.trim()}>
          Add note
        </button>
      </div>
    </div>
  );
}

function NoteItem({ note, onSave, onDelete }: { note: Note; onSave: (t: string) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.text);
  return (
    <li className="group relative flex gap-3 rounded-xl px-3 py-2.5 transition hover:bg-surface-2">
      <span className="w-10 shrink-0 pt-0.5 font-mono text-xs text-faint">{note.time}</span>
      {editing ? (
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => { onSave(text.trim() || note.text); setEditing(false); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); }
            if (e.key === "Escape") { setText(note.text); setEditing(false); }
          }}
          className="flex-1 rounded-md bg-surface px-2 py-1 text-sm leading-relaxed outline-none ring-1 ring-line-strong"
        />
      ) : (
        <p className="flex-1 cursor-text text-sm leading-relaxed" onClick={() => setEditing(true)}>
          {note.text}
        </p>
      )}
      <span className="absolute right-1.5 top-1.5 flex gap-0.5 rounded-lg bg-surface-2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
        <button className={`${btn} size-7 text-faint hover:text-fg`} onClick={() => setEditing(true)} aria-label="Edit note">
          <Icon name="pencil" className="size-3.5" />
        </button>
        <button className={`${btn} size-7 text-faint hover:text-fg`} onClick={onDelete} aria-label="Delete note">
          <Icon name="trash" className="size-3.5" />
        </button>
      </span>
    </li>
  );
}

function GitBox({ day, value, onChange }: { day: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(!!value);
  useEffect(() => setOpen(!!value), [day]);
  const cmd = `git log --all --since="${day} 00:00" --until="${day} 23:59" --author="$(git config user.name)" --pretty="%h %s"`;
  const lines = value.split("\n").filter((l) => l.trim()).length;
  return (
    <div className={card}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-5 py-3.5 text-left">
        <Icon name="git" className="size-4 text-muted" />
        <span className="text-sm font-medium">Git commits</span>
        <span className="text-xs text-faint">{lines ? `${lines} pasted` : "optional"}</span>
        <Icon name={open ? "up" : "down"} className="ml-auto size-4 text-faint" />
      </button>
      {open && (
        <div className="space-y-2 px-5 pb-4">
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-surface-2 px-2 py-1.5 font-mono text-[11px] text-muted" title={cmd}>{cmd}</code>
            <CopyCmd cmd={cmd} />
          </div>
          <p className="text-xs text-faint">Run it in each repo you touched, then paste the output below.</p>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder="a1c9e2f fix(print): keep voucher rows together"
            className="block max-h-64 min-h-20 w-full rounded-lg border border-line bg-surface-2/50 px-3 py-2 font-mono text-xs leading-relaxed outline-none focus:border-line-strong"
          />
        </div>
      )}
    </div>
  );
}

function CopyCmd({ cmd }: { cmd: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className={`${btnOutline} !h-7 !px-2 !text-xs`}
      onClick={async () => { await navigator.clipboard.writeText(cmd); setDone(true); setTimeout(() => setDone(false), 1400); }}
    >
      <Icon name={done ? "check" : "copy"} className="size-3.5" /> {done ? "Copied" : "Copy"}
    </button>
  );
}

function DateField({ label, value, onChange, min, max }: { label: string; value: string; onChange: (v: string) => void; min?: string; max?: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wider text-faint">{label}</span>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="h-9 rounded-lg border border-line bg-surface px-2.5 font-mono text-sm outline-none focus:border-line-strong"
      />
    </label>
  );
}

function Refine({ onSubmit, busy, hint }: { onSubmit: (t: string) => void; busy: boolean; hint: string }) {
  const [text, setText] = useState("");
  const go = () => {
    if (!text.trim() || busy) return;
    onSubmit(text.trim());
    setText("");
  };
  return (
    <div className={`${card} flex items-center gap-2 p-1.5 pl-4 focus-within:border-line-strong`}>
      <Icon name="sparkle" className="size-4 shrink-0 text-accent" />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !e.ctrlKey && !e.metaKey && go()}
        placeholder='Fix by voice: "merge the two calculator rows", "cron one is in progress"'
        className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
      />
      <MicButton size="sm" hint={hint} onText={(t) => setText((p) => (p ? p + " " : "") + t)} />
      <button className={`${btnPrimary} !h-8`} onClick={go} disabled={!text.trim() || busy}>
        {busy ? <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : "Apply"}
      </button>
    </div>
  );
}

function EmptyResult() {
  const cols = useMemo(() => ["Date", "Name", "Project", "Module", "Task schedule", "Details", "Status", "Resolution"], []);
  return (
    <div className="rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
      <div className="mx-auto mb-5 flex max-w-md flex-wrap justify-center gap-1.5">
        {cols.map((c) => (
          <span key={c} className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-[11px] text-faint">
            {c}
          </span>
        ))}
      </div>
      <p className="text-sm font-medium">Your tracker rows show up here</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
        Add notes through the day, paste your commits, then generate. One click copies them straight into your Google Sheet.
      </p>
    </div>
  );
}
