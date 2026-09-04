/**
 * trace(claim_id, construct) -> trace_entry
 *
 * Appends a trace entry to .ddd/trace-matrix.yaml linking a
 * claim to a construct, in the given direction.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Claim, TraceEntry } from "./types";
import { loadLedger, nextId, nowIso, parseYaml, readText, writeText, yamlFlowList, yamlScalar } from "./utils";

const TRACE_HEADER = `# DDD Trace Matrix
# Generated view of the evidence graph: trace entries mapping claims <-> constructs.
# Legacy trace entry schema

schema_version: 0.1.0

traces: []
`;

export interface TraceOptions {
  changeId?: string;
  direction?: "forward" | "reverse";
  validationId?: string;
  notes?: string;
}

function serializeTrace(t: TraceEntry): string {
  return (
    [
      `  - id: ${t.id}`,
      `    schema_version: ${yamlScalar(t.schema_version)}`,
      `    change_id: ${t.change_id ? yamlScalar(t.change_id) : "null"}`,
      `    claim_id: ${yamlScalar(t.claim_id)}`,
      `    construct_id: ${yamlScalar(t.construct_id)}`,
      `    validation_id: ${t.validation_id ? yamlScalar(t.validation_id) : "null"}`,
      `    direction: ${yamlScalar(t.direction)}`,
      `    sweep_pass: ${t.sweep_pass}`,
      `    checked_at: ${yamlScalar(t.checked_at)}`,
      `    notes: ${t.notes ? yamlScalar(t.notes) : "null"}`,
    ].join("\n") + "\n"
  );
}

/**
 * Create a trace entry linking `claimId` to `construct`. Verifies the claim
 * exists in claims.yaml when that file is present, and that `construct`
 * matches a claim constructs[] entry verbatim (the kernel's exact-match
 * contract, enforced at write time rather than at sweep time). Returns the
 * entry.
 */
export function addTrace(
  dddDir: string,
  claimId: string,
  construct: string,
  opts: TraceOptions = {},
): TraceEntry {
  // Validate the claim exists (when a claim ledger is present).
  const claimsPath = join(dddDir, "claims.yaml");
  let claim: Claim | undefined;
  if (existsSync(claimsPath)) {
    const claimsDoc = (parseYaml(readText(claimsPath)) as { entries?: Claim[] }) ?? {};
    const claims = Array.isArray(claimsDoc.entries) ? claimsDoc.entries : [];
    claim = claims.find((candidate) => candidate.id === claimId);
    if (claims.length > 0 && !claim) {
      throw new Error(`Claim ${claimId} not found in ${claimsPath}`);
    }
    if (claim && (claim.constructs ?? []).length > 0 && !(claim.constructs ?? []).includes(construct)) {
      throw new Error(
        `Construct "${construct}" is not declared on claim ${claimId}. ` +
          `Rule: trace construct_id must equal a claim constructs[] entry verbatim. ` +
          `Claim ${claimId} declares: ${yamlFlowList(claim.constructs ?? [])}. ` +
          `Re-record the claim with --construct "${construct}" if it should be covered.`,
      );
    }
  }

  const tracePath = join(dddDir, "trace-matrix.yaml");
  const { text: baseText, entries: traces } = loadLedger<TraceEntry>(
    tracePath,
    TRACE_HEADER,
    "traces",
  );
  let text = baseText;

  const entry: TraceEntry = {
    id: nextId(traces, "TR"),
    schema_version: "0.1.0",
    change_id: opts.changeId ?? null,
    claim_id: claimId,
    construct_id: construct,
    validation_id: opts.validationId ?? null,
    direction: opts.direction ?? "forward",
    sweep_pass: false,
    checked_at: nowIso(),
    notes: opts.notes ?? null,
  };

  // Convert an empty inline sequence ("traces: []") into a block sequence
  // header so the new entry can be appended beneath it.
  if (/^traces:\s*\[\]\s*$/m.test(text)) {
    text = text.replace(/^traces:\s*\[\]\s*$/m, "traces:");
  } else if (!/^\s*traces:/m.test(text)) {
    if (!text.endsWith("\n")) text += "\n";
    text += "\ntraces:\n";
  }
  if (!text.endsWith("\n")) text += "\n";
  text += serializeTrace(entry);
  writeText(tracePath, text);

  return entry;
}
