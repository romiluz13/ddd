/**
 * sweep(direction) -> violations[]
 *
 * Compliance Sweep over .ddd/claims.yaml and .ddd/trace-matrix.yaml.
 *
 * Forward sweep:
 *   - every claim has at least one source
 *   - every construct listed on a claim has a trace entry (claim_id + construct)
 *
 * Reverse sweep:
 *   - every trace entry references an existing claim
 *   - every trace entry names a construct
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Claim, SweepReport, SweepViolation, TraceEntry } from "./types";
import { nowIso, parseYaml, readText } from "./utils";

export type SweepDirection = "forward" | "reverse" | "both";

export function sweep(dddDir: string, direction: SweepDirection = "both"): SweepReport {
  const claimsPath = join(dddDir, "claims.yaml");
  const tracePath = join(dddDir, "trace-matrix.yaml");

  const claimsDoc = existsSync(claimsPath)
    ? (parseYaml(readText(claimsPath)) as { entries?: Claim[] })
    : { entries: [] };
  const traceDoc = existsSync(tracePath)
    ? (parseYaml(readText(tracePath)) as { traces?: TraceEntry[] })
    : { traces: [] };

  const claims: Claim[] = Array.isArray(claimsDoc?.entries) ? claimsDoc.entries : [];
  const traces: TraceEntry[] = Array.isArray(traceDoc?.traces) ? traceDoc.traces : [];

  const violations: SweepViolation[] = [];

  if (direction === "forward" || direction === "both") {
    for (const claim of claims) {
      if (!Array.isArray(claim.sources) || claim.sources.length === 0) {
        violations.push({
          type: "claim-without-source",
          claim_id: claim.id,
          message: `Claim ${claim.id} has no sources; every claim MUST cite at least one evidence source.`,
        });
      }
      for (const construct of claim.constructs ?? []) {
        const covered = traces.some(
          (t) => t.claim_id === claim.id && (t.construct_id === construct || (t as any).construct === construct),
        );
        if (!covered) {
          violations.push({
            type: "untraced-construct",
            claim_id: claim.id,
            construct,
            message: `Construct "${construct}" on claim ${claim.id} has no trace entry.`,
          });
        }
      }
    }
  }

  if (direction === "reverse" || direction === "both") {
    const claimIds = new Set(claims.map((c) => c.id));
    for (const trace of traces) {
      if (!claimIds.has(trace.claim_id)) {
        violations.push({
          type: "orphan-trace",
          trace_id: trace.id,
          claim_id: trace.claim_id,
          message: `Trace ${trace.id} references unknown claim ${trace.claim_id}.`,
        });
      }
      if (!trace.construct_id && !(trace as any).construct) {
        violations.push({
          type: "trace-without-construct",
          trace_id: trace.id,
          claim_id: trace.claim_id,
          message: `Trace ${trace.id} does not name a construct.`,
        });
      }
    }
  }

  return {
    schema_version: "0.1.0",
    direction,
    checked_at: nowIso(),
    claims_checked: claims.length,
    traces_checked: traces.length,
    violations,
    pass: violations.length === 0,
  };
}
