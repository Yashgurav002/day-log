export const STATUSES = ["Done", "In progress", "Pending", "Resolved", "Closed"] as const;
export type Status = (typeof STATUSES)[number];

export type Row = {
  date: string; // dd/mm/yyyy
  project: string;
  module: string;
  task: string;
  details: string;
  status: Status;
  resolution: string;
  requestedBy: string;
  department: string;
};

export type ColKey = keyof Row | "name";

export const COLUMNS: { key: ColKey; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "name", label: "Name" },
  { key: "project", label: "Project" },
  { key: "module", label: "Module" },
  { key: "task", label: "Task schedule" },
  { key: "details", label: "Details" },
  { key: "status", label: "Status" },
  { key: "resolution", label: "Resolution" },
  { key: "requestedBy", label: "Requested by" },
  { key: "department", label: "Department" },
];

// "2026-10-23" -> "23/10/2026"
export const toDMY = (iso: string) => iso.split("-").reverse().join("/");

// local calendar date as yyyy-mm-dd
export const isoDay = (d = new Date()) => d.toLocaleDateString("en-CA");

export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return isoDay(d);
}

export function daysBetween(from: string, to: string) {
  const out: string[] = [];
  for (let d = from; d <= to && out.length < 62; d = addDays(d, 1)) out.push(d);
  return out;
}

// n working days (Mon–Sat) starting at `from`
export function workingDays(from: string, n: number) {
  const out: string[] = [];
  for (let d = from; out.length < n; d = addDays(d, 1)) {
    if (new Date(d + "T12:00:00").getDay() !== 0) out.push(d);
  }
  return out;
}

// A cell can't hold tabs or newlines or Sheets splits it.
const cell = (s: string) => s.replace(/[\t\r\n]+/g, " ").trim();

export function toTSV(rows: Row[], columns: ColKey[], name: string) {
  return rows
    .map((r) => columns.map((k) => cell(k === "name" ? name : r[k])).join("\t"))
    .join("\n");
}

export function toMarkdown(rows: Row[]) {
  const out: string[] = [];
  let lastDate = "";
  let lastProject = "";
  for (const r of rows) {
    if (r.date !== lastDate) {
      if (out.length) out.push("");
      out.push(`### ${r.date}`);
      lastDate = r.date;
      lastProject = "";
    }
    if (r.project !== lastProject) {
      out.push("", `**${r.project || "General"}**`);
      lastProject = r.project;
    }
    const mod = r.module ? ` (${r.module})` : "";
    out.push(`- **${r.task}**${mod} [${r.status}]: ${r.details}`);
    if (r.resolution) out.push(`  - Resolution: ${r.resolution}`);
    if (r.requestedBy) out.push(`  - Requested by: ${r.requestedBy}${r.department ? ` (${r.department})` : ""}`);
  }
  return out.join("\n");
}
