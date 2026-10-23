"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { COLUMNS, STATUSES, type ColKey, type Row, type Status } from "@/lib/format";
import type { Settings } from "@/lib/store";

/* ---------- icons (lucide paths, inline to skip a dependency) ---------- */
const paths = {
  mic: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v3",
  stop: "M6 6h12v12H6z",
  settings:
    "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  left: "m15 18-6-6 6-6",
  right: "m9 18 6-6-6-6",
  copy: "M8 8h12v12H8z M4 16V4h12",
  check: "M20 6 9 17l-5-5",
  trash: "M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  sparkle: "M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z M19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z",
  git: "M6 3v12 M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 9a9 9 0 0 1-9 9",
  x: "M18 6 6 18 M6 6l12 12",
  up: "m18 15-6-6-6 6",
  down: "m6 9 6 6 6-6",
  sheet: "M3 3h18v18H3z M3 9h18 M3 15h18 M9 3v18",
  text: "M4 6h16 M4 12h16 M4 18h10",
  pencil: "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z",
  plus: "M12 5v14 M5 12h14",
};
export function Icon({ name, className = "size-4" }: { name: keyof typeof paths; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={paths[name]} />
    </svg>
  );
}

/* ---------- primitives ---------- */
export const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition active:scale-[.98] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
export const btnPrimary = `${btn} h-9 px-3.5 bg-fg text-bg hover:opacity-90 shadow-sm`;
export const btnGhost = `${btn} h-9 px-3 text-muted hover:text-fg hover:bg-surface-2`;
export const btnOutline = `${btn} h-9 px-3 border border-line bg-surface hover:border-line-strong`;
export const card = "rounded-2xl border border-line bg-surface shadow-card";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-surface-2 px-1.5 py-px font-mono text-[10px] text-muted">{children}</kbd>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="group inline-flex items-center gap-2 text-sm">
      <span className={`relative h-5 w-9 rounded-full transition ${on ? "bg-fg" : "bg-line-strong"}`}>
        <span className={`absolute top-0.5 size-4 rounded-full bg-bg shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
      <span className={on ? "text-fg" : "text-muted"}>{label}</span>
    </button>
  );
}

export function CopyButton({ text, label, icon, primary }: { text: () => string; label: string; icon: "sheet" | "text"; primary?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className={primary ? btnPrimary : btnOutline}
      onClick={async () => {
        await navigator.clipboard.writeText(text());
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
    >
      <Icon name={done ? "check" : icon} />
      {done ? "Copied" : label}
    </button>
  );
}

/* ---------- mic: record → /api/transcribe ---------- */
const MAX_SECONDS = 60;

export function MicButton({ onText, hint, size = "md" }: { onText: (t: string) => void; hint: string; size?: "md" | "sm" }) {
  const [state, setState] = useState<"idle" | "rec" | "busy">("idle");
  const [secs, setSecs] = useState(0);
  const [err, setErr] = useState("");
  const rec = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (state !== "rec") return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);
  useEffect(() => {
    if (state === "rec" && secs >= MAX_SECONDS) rec.current?.stop();
  }, [secs, state]);
  useEffect(() => {
    if (!err) return;
    const t = setTimeout(() => setErr(""), 4000);
    return () => clearTimeout(t);
  }, [err]);

  async function start() {
    setErr("");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setErr("Mic blocked. Allow it in the address bar.");
      return;
    }
    const type = ["audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
    const r = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    const chunks: Blob[] = [];
    r.ondataavailable = (e) => chunks.push(e.data);
    r.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setState("busy");
      const blob = new Blob(chunks, { type: r.mimeType });
      const fd = new FormData();
      fd.append("file", blob, r.mimeType.includes("mp4") ? "note.mp4" : "note.webm");
      fd.append("projects", hint);
      try {
        const res = await fetch("/api/transcribe", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (data.text) onText(data.text);
      } catch (e) {
        setErr((e as Error).message || "Couldn't transcribe.");
      }
      setState("idle");
    };
    rec.current = r;
    r.start();
    setSecs(0);
    setState("rec");
  }

  const dim = size === "sm" ? "size-8" : "size-9";
  return (
    <span className="relative inline-flex items-center gap-2">
      <button
        type="button"
        title={state === "rec" ? "Stop and transcribe" : "Record a note (no Wispr? use this)"}
        aria-label={state === "rec" ? "Stop recording" : "Record"}
        onClick={() => (state === "rec" ? rec.current?.stop() : state === "idle" && start())}
        className={`${btn} ${dim} rounded-full ${
          state === "rec" ? "recording bg-accent text-white" : "border border-line bg-surface text-muted hover:text-fg hover:border-line-strong"
        }`}
      >
        {state === "busy" ? (
          <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Icon name={state === "rec" ? "stop" : "mic"} className={state === "rec" ? "size-3.5 fill-current" : "size-4"} />
        )}
      </button>
      {state === "rec" && <span className="font-mono text-xs tabular-nums text-accent">0:{String(secs).padStart(2, "0")}</span>}
      {state === "busy" && <span className="text-xs text-muted">Transcribing…</span>}
      {err && <span className="absolute left-0 top-full z-10 mt-1.5 whitespace-nowrap rounded-md bg-fg px-2 py-1 text-xs text-bg">{err}</span>}
    </span>
  );
}

/* ---------- one tracker row, editable ---------- */
const statusColor: Record<Status, string> = {
  Done: "bg-emerald-500",
  Resolved: "bg-sky-500",
  "In progress": "bg-amber-500",
  Pending: "bg-zinc-400",
  Closed: "bg-violet-500",
};
const field = "w-full rounded-md bg-transparent px-1.5 -mx-1.5 py-0.5 outline-none transition hover:bg-surface-2 focus:bg-surface-2 placeholder:text-faint";

export function RowCard({ row, onChange, onDelete, index }: { row: Row; onChange: (r: Row) => void; onDelete: () => void; index: number }) {
  const set = (k: keyof Row) => (e: { target: { value: string } }) => onChange({ ...row, [k]: e.target.value });
  return (
    <article className={`${card} rise group p-4 sm:p-5`} style={{ animationDelay: `${index * 40}ms` }}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <label className="relative inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 py-0.5 pl-2 pr-1 font-medium">
          <span className={`size-1.5 rounded-full ${statusColor[row.status] ?? "bg-zinc-400"}`} />
          <select value={row.status} onChange={set("status")} className="cursor-pointer appearance-none bg-transparent pr-1 outline-none">
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <input value={row.project} onChange={set("project")} placeholder="Project" className={`${field} !w-auto [field-sizing:content] min-w-10 max-w-40 font-medium`} />
        <span className="text-faint">/</span>
        <input value={row.module} onChange={set("module")} placeholder="Module" className={`${field} !w-auto [field-sizing:content] min-w-10 max-w-48 text-muted`} />
        <span className="ml-auto flex items-center gap-1">
          <input value={row.date} onChange={set("date")} className={`${field} !w-[86px] font-mono text-muted`} aria-label="Date" />
          <button onClick={onDelete} aria-label="Delete row" className={`${btn} size-7 text-faint opacity-0 hover:text-fg group-hover:opacity-100 focus:opacity-100`}>
            <Icon name="trash" className="size-3.5" />
          </button>
        </span>
      </div>
      <input value={row.task} onChange={set("task")} placeholder="Task summary" className={`${field} mt-2.5 text-[15px] font-semibold tracking-tight`} />
      <textarea value={row.details} onChange={set("details")} placeholder="Details" rows={1} className={`${field} mt-1 min-h-6 text-sm leading-relaxed text-muted`} />
      {(row.resolution || row.status === "Resolved") && (
        <div className="mt-3 flex gap-2 rounded-lg border border-dashed border-line px-3 py-2">
          <span className="pt-0.5 text-[11px] font-medium uppercase tracking-wide text-faint">Fix</span>
          <textarea value={row.resolution} onChange={set("resolution")} placeholder="Problem → fix" rows={1} className={`${field} text-sm`} />
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-1 text-xs text-muted">
        <span className="text-faint">Requested by</span>
        <input value={row.requestedBy} onChange={set("requestedBy")} placeholder="—" className={`${field} !w-auto [field-sizing:content] min-w-10`} />
        <span className="text-faint">· Dept</span>
        <input value={row.department} onChange={set("department")} placeholder="—" className={`${field} !w-auto [field-sizing:content] min-w-10`} />
      </div>
    </article>
  );
}

/* ---------- settings drawer ---------- */
export function SettingsPanel({
  settings,
  onChange,
  onClose,
  onExport,
  onImport,
  onFresh,
  onSample,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
  onClose: () => void;
  onExport: () => void;
  onImport: (f: File) => void;
  onFresh: () => void;
  onSample: () => void;
}) {
  const [projects, setProjects] = useState(settings.projects.join("\n"));
  const [people, setPeople] = useState(settings.people.map((p) => `${p.name} = ${p.department}`).join("\n"));
  const label = (k: ColKey) => COLUMNS.find((c) => c.key === k)!.label;
  const cols = settings.columns;
  const unused = COLUMNS.filter((c) => !cols.includes(c.key));
  const move = (i: number, d: number) => {
    const next = [...cols];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange({ ...settings, columns: next });
  };
  const input = "w-full rounded-lg border border-line bg-surface-2/50 px-3 py-2 text-sm outline-none focus:border-line-strong";

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-[2px]" onClick={onClose}>
      <aside role="dialog" aria-label="Settings" className="rise h-full w-full max-w-md overflow-y-auto border-l border-line bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Settings</h2>
          <button onClick={onClose} className={`${btnGhost} !px-2`} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>

        <section className="mt-6 space-y-1.5">
          <h3 className="text-sm font-medium">Your name</h3>
          <p className="text-xs text-muted">Fills the Name column.</p>
          <input className={input} value={settings.name} onChange={(e) => onChange({ ...settings, name: e.target.value })} placeholder="e.g. Yash Gurav" />
        </section>

        <section className="mt-6 space-y-1.5">
          <h3 className="text-sm font-medium">Projects</h3>
          <p className="text-xs text-muted">One per line. Notes get matched to these names.</p>
          <textarea
            className={`${input} min-h-20 font-mono`}
            value={projects}
            onChange={(e) => setProjects(e.target.value)}
            onBlur={() => onChange({ ...settings, projects: projects.split("\n").map((s) => s.trim()).filter(Boolean) })}
          />
        </section>

        <section className="mt-6 space-y-1.5">
          <h3 className="text-sm font-medium">People → department</h3>
          <p className="text-xs text-muted">
            One per line, like <span className="font-mono">Priya = Operations</span>. Used when a note says who asked.
          </p>
          <textarea
            className={`${input} min-h-20 font-mono`}
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            onBlur={() =>
              onChange({
                ...settings,
                people: people
                  .split("\n")
                  .map((l) => l.split("="))
                  .filter(([n, d]) => n?.trim() && d?.trim())
                  .map(([n, d]) => ({ name: n.trim(), department: d.trim() })),
              })
            }
          />
        </section>

        <section className="mt-6 space-y-1.5">
          <h3 className="text-sm font-medium">Sheet columns</h3>
          <p className="text-xs text-muted">Same order as your Google Sheet. Copy for Sheets pastes in this order.</p>
          <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line">
            {cols.map((k, i) => (
              <li key={k} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                <span className="w-5 font-mono text-xs text-faint">{String.fromCharCode(65 + i)}</span>
                <span className="flex-1">{label(k)}</span>
                <button className={`${btnGhost} !h-7 !px-1.5`} disabled={!i} onClick={() => move(i, -1)} aria-label="Move up">
                  <Icon name="up" />
                </button>
                <button className={`${btnGhost} !h-7 !px-1.5`} disabled={i === cols.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                  <Icon name="down" />
                </button>
                <button className={`${btnGhost} !h-7 !px-1.5`} onClick={() => onChange({ ...settings, columns: cols.filter((c) => c !== k) })} aria-label="Remove column">
                  <Icon name="x" />
                </button>
              </li>
            ))}
          </ol>
          {unused.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {unused.map((c) => (
                <button key={c.key} className={`${btnOutline} !h-7 !text-xs`} onClick={() => onChange({ ...settings, columns: [...cols, c.key] })}>
                  <Icon name="plus" className="size-3" /> {c.label}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 space-y-2 border-t border-line pt-6">
          <h3 className="text-sm font-medium">Your data</h3>
          <p className="text-xs text-muted">Everything stays in this browser. Export it to back it up or move it to another one.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button className={btnOutline} onClick={onExport}>Export JSON</button>
            <label className={`${btnOutline} cursor-pointer`}>
              Import JSON
              <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button className={`${btnGhost} text-accent`} onClick={onFresh}>Start fresh (clear all)</button>
            <button className={btnGhost} onClick={onSample}>Load sample day</button>
          </div>
        </section>
      </aside>
    </div>
  );
}
