// Run: npm test  (Node's built-in runner, no deps)
import assert from "node:assert/strict";
import { test } from "node:test";
import { toTSV, toMarkdown, toDMY, workingDays, daysBetween, type Row } from "./format.ts";

const row: Row = {
  date: "23/10/2026",
  project: "Ops Console",
  module: "Stock sync",
  task: "Fixed nightly sync",
  details: "Line one\nline two\twith tab",
  status: "Resolved",
  resolution: "Skipped empty BOM → added guard",
  requestedBy: "Priya",
  department: "Operations",
};

test("TSV: column order, name injected, no tabs/newlines inside cells, no header", () => {
  const tsv = toTSV([row, row], ["date", "name", "project", "details", "status"], "Yash");
  const lines = tsv.split("\n");
  assert.equal(lines.length, 2);
  assert.deepEqual(lines[0].split("\t"), ["23/10/2026", "Yash", "Ops Console", "Line one line two with tab", "Resolved"]);
});

test("markdown groups by date then project", () => {
  const md = toMarkdown([row, { ...row, task: "Second" }, { ...row, project: "API", task: "Third" }]);
  assert.equal(md.match(/### 23\/10\/2026/g)?.length, 1);
  assert.equal(md.match(/\*\*Ops Console\*\*/g)?.length, 1);
  assert.match(md, /\*\*API\*\*/);
  assert.match(md, /Requested by: Priya \(Operations\)/);
});

test("dates", () => {
  assert.equal(toDMY("2026-10-03"), "03/10/2026");
  // 24 Oct 2026 is a Saturday, 25th a Sunday
  assert.deepEqual(workingDays("2026-10-24", 3), ["2026-10-24", "2026-10-26", "2026-10-27"]);
  assert.deepEqual(daysBetween("2026-10-30", "2026-11-01"), ["2026-10-30", "2026-10-31", "2026-11-01"]);
});
