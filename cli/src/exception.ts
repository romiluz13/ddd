/**
 * exception(goal | capability, rationale, owner, expires) -> exception_entry
 *
 * Records an approved waiver in .ddd/exceptions.yaml: accountable acceptance
 * of residual risk, owned by a human, time-boxed by an expiry date. A waiver
 * records accepted risk; it is not correctness evidence, and an expired
 * waiver is invalid at evaluation time.
 *
 * A waiver targets either a goal claim (--goal C-NNN) or a required
 * capability that no tool evaluates yet (--capability consumer_impact).
 * Capability waivers keep the same semantics: recorded risk, not evidence.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Claim } from "./types";
import { loadLedger, nextId, nowIso, readText, parseYaml, writeText, yamlScalar } from "./utils";

const EXCEPTIONS_HEADER = `# DDD Exceptions
# Approved waivers: accountable acceptance of residual risk for a goal or a
# required capability. A waiver is recorded risk, not correctness evidence.
# Expired waivers are invalid at evaluation time.

schema_version: 0.1.0

exceptions: []
`;

/**
 * Required capabilities that no CLI tool can currently evaluate, so a waiver
 * (or an obligation) is the only honest resolution path for them.
 */
export const WAIVABLE_CAPABILITIES = ["consumer_impact", "contract_compatibility"] as const;

export type WaivableCapability = (typeof WAIVABLE_CAPABILITIES)[number];

export interface ExceptionEntry {
  id: string;
  schema_version: string;
  goal: string | null;
  capability?: WaivableCapability;
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
  capability?: string;
}

export function addException(
  dddDir: string,
  goalClaimId: string | null,
  opts: AddExceptionOptions,
): ExceptionEntry {
  const capability = opts.capability?.trim() || undefined;
  if (!goalClaimId && !capability) {
    throw new Error("A waiver requires --goal <C-NNN> or --capability <name> as its target");
  }
  if (goalClaimId && capability) {
    throw new Error("A waiver targets one of --goal or --capability, not both");
  }
  if (capability && !WAIVABLE_CAPABILITIES.includes(capability as WaivableCapability)) {
    throw new Error(
      `--capability "${capability}" not in [${WAIVABLE_CAPABILITIES.join(", ")}]. ` +
        `Only required capabilities with no evaluation path can be waived; every other capability must be evaluated.`,
    );
  }
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

  if (goalClaimId) {
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
  }

  const exceptionsPath = join(dddDir, "exceptions.yaml");
  const { text: baseText, entries: exceptions } = loadLedger<ExceptionEntry>(
    exceptionsPath,
    EXCEPTIONS_HEADER,
    "exceptions",
  );
  let text = baseText;
  if (capability) {
    // Idempotent per capability: one live waiver per required capability.
    const existing = exceptions.find(
      (candidate) => candidate.capability === capability && candidate.goal === null,
    );
    if (existing) return existing;
  }

  const entry: ExceptionEntry = {
    id: nextId(exceptions, "EXC"),
    schema_version: "0.1.0",
    goal: goalClaimId,
    ...(capability ? { capability: capability as WaivableCapability } : {}),
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
  const lines = [
    `  - id: ${entry.id}`,
    `    schema_version: ${yamlScalar(entry.schema_version)}`,
    `    goal: ${entry.goal ? yamlScalar(entry.goal) : "null"}`,
  ];
  if (entry.capability) lines.push(`    capability: ${yamlScalar(entry.capability)}`);
  lines.push(
    `    rationale: ${yamlScalar(entry.rationale)}`,
    `    owner: ${yamlScalar(entry.owner)}`,
    `    expires_at: ${yamlScalar(entry.expires_at)}`,
    `    status: ${yamlScalar(entry.status)}`,
    `    created_at: ${yamlScalar(entry.created_at)}`,
  );
  return `${lines.join("\n")}\n`;
}
