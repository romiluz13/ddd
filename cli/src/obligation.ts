/**
 * obligation(defeater, issue) -> obligation_entry
 *
 * Records an open obligation in .ddd/obligations.yaml binding a defeater to
 * the issue that will resolve it. An obligation tracks work; it does not
 * resolve the defeater, and an obligation-backed defeater still yields
 * INDETERMINATE until the evidence lands.
 */
import { join } from "node:path";
import { loadLedger, nextId, nowIso, writeText, yamlScalar } from "./utils";

const OBLIGATIONS_HEADER = `# DDD Obligations
# Open work items binding unresolved defeaters to tracking issues. An
# obligation records that evidence is coming; it does not resolve the
# defeater or change any verdict.

schema_version: 0.1.0

obligations: []
`;

export interface ObligationEntry {
  id: string;
  schema_version: string;
  defeater: string;
  description?: string;
  issue: string;
  due_at?: string;
  status: "open" | "fulfilled";
  created_at: string;
}

export interface AddObligationOptions {
  description?: string;
  issue: string;
  dueAt?: string;
}

export function addObligation(
  dddDir: string,
  defeater: string,
  opts: AddObligationOptions,
): ObligationEntry {
  if (!defeater.trim()) {
    throw new Error("An obligation requires --defeater, the defeater id it tracks (e.g. stack:dependency:ai)");
  }
  if (!/^https?:\/\//.test(opts.issue)) {
    throw new Error(`--issue "${opts.issue}" must be an http(s) issue URL`);
  }
  if (opts.dueAt !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(opts.dueAt)) {
    throw new Error(`--due "${opts.dueAt}" is not a valid ISO date (YYYY-MM-DD)`);
  }

  const obligationsPath = join(dddDir, "obligations.yaml");
  const { text: baseText, entries: obligations } = loadLedger<ObligationEntry>(
    obligationsPath,
    OBLIGATIONS_HEADER,
    "obligations",
  );
  let text = baseText;
  const existing = obligations.find(
    (obligation) => obligation.defeater === defeater && obligation.issue === opts.issue,
  );
  if (existing) return existing; // idempotent per (defeater, issue)

  const entry: ObligationEntry = {
    id: nextId(obligations, "OB"),
    schema_version: "0.1.0",
    defeater,
    description: opts.description,
    issue: opts.issue,
    due_at: opts.dueAt,
    status: "open",
    created_at: nowIso(),
  };

  if (/^obligations:\s*\[\]\s*$/m.test(text)) {
    text = text.replace(/^obligations:\s*\[\]\s*$/m, "obligations:");
  } else if (!/^\s*obligations:/m.test(text)) {
    if (!text.endsWith("\n")) text += "\n";
    text += "\nobligations:\n";
  }
  if (!text.endsWith("\n")) text += "\n";
  text += serializeObligation(entry);
  writeText(obligationsPath, text);
  return entry;
}

function serializeObligation(entry: ObligationEntry): string {
  const lines = [
    `  - id: ${entry.id}`,
    `    schema_version: ${yamlScalar(entry.schema_version)}`,
    `    defeater: ${yamlScalar(entry.defeater)}`,
  ];
  if (entry.description) lines.push(`    description: ${yamlScalar(entry.description)}`);
  lines.push(`    issue: ${yamlScalar(entry.issue)}`);
  if (entry.due_at) lines.push(`    due_at: ${yamlScalar(entry.due_at)}`);
  lines.push(
    `    status: ${yamlScalar(entry.status)}`,
    `    created_at: ${yamlScalar(entry.created_at)}`,
  );
  return `${lines.join("\n")}\n`;
}
