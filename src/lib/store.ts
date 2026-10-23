import { COLUMNS, isoDay, type ColKey, type Row } from "./format";

export type Note = { id: string; date: string; time: string; text: string }; // date yyyy-mm-dd, time HH:MM
export type Result = { from: string; to: string; rows: Row[]; createdAt: number };
export type Settings = {
  name: string;
  projects: string[];
  people: { name: string; department: string }[];
  columns: ColKey[];
};
export type State = {
  notes: Note[];
  gitLogs: Record<string, string>; // by yyyy-mm-dd
  results: Record<string, Result>; // by "from|to"
  settings: Settings;
  sample: boolean; // true while the preloaded sample day is in use
};

const KEY = "daylog:v1";

export const uid = () => Math.random().toString(36).slice(2, 10);

function sampleState(): State {
  const d = isoDay();
  const n = (time: string, text: string): Note => ({ id: uid(), date: d, time, text });
  return {
    sample: true,
    notes: [
      n("10:12", "Silverline voucher print was cutting off the last row on A5, it was the page break CSS in the print stylesheet, fixed with break-inside avoid on the table rows. Priya from ops reported it yesterday"),
      n("11:40", "pricing calculator mein export to excel ka button tha, uska column width theek kiya aur UID column ko text format diya taaki leading zeros na jaaye"),
      n("13:05", "renamed a few labels on the calculator"),
      n("15:30", "Rahul asked for the monthly scheme report filter by city on the ops console, added the city dropdown and wired it into the report query, still need to test with live data tomorrow"),
      n("17:10", "looked at why the nightly stock sync cron skipped some locations, it ignores locations with no BOM rows. Added a guard and a log line. Deployed by hand on the server"),
    ],
    gitLogs: {
      [d]: [
        "a1c9e2f fix(print): keep voucher table rows together on A5",
        "7d03b11 feat(export): text format for UID column, auto column widths",
        "0e4f8aa chore: label copy",
        "c58d920 feat(reports): city filter on scheme report",
        "91be7d4 fix(cron): skip guard for locations without BOM",
      ].join("\n"),
    },
    results: {},
    settings: {
      name: "Yash Gurav",
      projects: ["Silverline", "Pricing Calculator", "Ops Console"],
      people: [
        { name: "Priya", department: "Operations" },
        { name: "Rahul", department: "Accounts" },
      ],
      columns: COLUMNS.map((c) => c.key),
    },
  };
}

export function emptyState(settings: Settings): State {
  return { sample: false, notes: [], gitLogs: {}, results: {}, settings };
}

export function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return sampleState();
}

export function save(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export { sampleState };
