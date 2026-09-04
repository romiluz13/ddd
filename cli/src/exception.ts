/**
 * exception(goal, rationale, owner, expires) -> exception_entry
 *
 * Records an approved waiver in .ddd/exceptions.yaml: accountable acceptance
 * of residual risk for a declared goal, owned by a human, time-boxed by an
 * expiry date. A waiver records accepted risk; it is not correctness
 * evidence, and an expired waiver is invalid at evaluation time.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Claim } from "./types";
import { nextId, nowIso, parseYaml, readText, writeText, yamlScalar } from "./utils";

const EXCEPTIONS_HEADER = `# DDD Exceptions
# Approved waivers: accountable acceptance of residual risk for a goal.
# A waiver is recorded risk, not correctness evidence. Expired waivers are
# invalid at evaluation time.

schema_version: 0.1.0

exceptions: []
`;

export interface ExceptionEntry {
  id: string;
  schema_version: string;
  goal: string;
  rationale: string;
  owner: string;
  expires_at: string;
  status: "approved";
  created_at: string;
}

export interface AddExceptionOptions {
  rationale: string;
  owner: string;
  expiresAt: string;
}

export function addException(
  dddDir: string,
  goalClaimId: string,
  opts: AddExceptionOptions,
): ExceptionEntry {
  if (!opts.rationale?.trim()) {
    throw new Error("A waiver requires a rationale describing the accepted residual risk");
  }
  if (!opts.owner?.trim()) {
    throw new Error("A waiver requires --owner, the human accountable for the accepted risk");
  }
  const expires = parseDate(opts.expiresAt);
  if (!expires) {
    throw new Error(
      `--expires "${opts.expiresAt}" is not a valid ISO date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)`,
    );
  }
  if (expires.getTime() <= Date.now()) {
    throw new Error(
      `--expires "${opts.expiresAt}" is not in the future; a waiver must be time-boxed ahead`,
    );
  }

  const claimsPath = join(dddDir, "claims.yaml");
  if (!existsSync(claimsPath)) {
    throw new Error(
      `Claims ledger not found at ${claimsPath}; declare the goal's claim first (ddd claim ...)`,
    );
  }
  const claimsDoc = parseYaml(readText(claimsPath)) as { entries?: Claim[] };
  const claims = Array.isArray(claimsDoc.entries) ? claimsDoc.entries : [];
  const claim = claims.find((candidate) => candidate.id === goalClaimId);
  if (!claim) {
    const known = claims.map((candidate) => candidate.id).join(", ");
    throw new Error(
      `Goal claim ${goalClaimId} not found in ${claimsPath}${known ? ` (known claims: ${known})` : ""}. ` +
        `Rule: a waiver targets a claim; declare it as a goal with ddd goal --claim ${goalClaimId}`,
    );
  }
  if (claim.status === "retracted") {
    throw new Error(`Goal claim ${goalClaimId} is retracted and cannot be waived`);
  }

  const exceptionsPath = join(dddDir, "exceptions.yaml");
  let text = existsSync(exceptionsPath) ? readText(exceptionsPath) : EXCEPTIONS_HEADER;
  const doc = (parseYaml(text) as { exceptions?: ExceptionEntry[] }) ?? {};
  const exceptions = Array.isArray(doc.exceptions) ? doc.exceptions : [];

  const entry: ExceptionEntry = {
    id: nextId(exceptions, "EXC"),
    schema_version: "0.1.0",
    goal: goalClaimId,
    rationale: opts.rationale,
    owner: opts.owner,
    expires_at: opts.expiresAt,
    status: "approved",
    created_at: nowIso(),
  };

  if (/^exceptions:\s*\[\]\s*$/m.test(text)) {
    text = text.replace(/^exceptions:\s*\[\]\s*$/m, "exceptions:");
  } else if (!/^\s*exceptions:/m.test(text)) {
    if (!text.endsWith("\n")) text += "\n";
    text += "\nexceptions:\n";
  }
  if (!text.endsWith("\n")) text += "\n";
  text += serializeException(entry);
  writeText(exceptionsPath, text);
  return entry;
}

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z)?$/.test(value)) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function serializeException(entry: ExceptionEntry): string {
  return (
    [
      `  - id: ${entry.id}`,
      `    schema_version: ${yamlScalar(entry.schema_version)}`,
      `    goal: ${yamlScalar(entry.goal)}`,
      `    rationale: ${yamlScalar(entry.rationale)}`,
      `    owner: ${yamlScalar(entry.owner)}`,
      `    expires_at: ${yamlScalar(entry.expires_at)}`,
      `    status: ${yamlScalar(entry.status)}`,
      `    created_at: ${yamlScalar(entry.created_at)}`,
    ].join("\n") + "\n"
  );
}
