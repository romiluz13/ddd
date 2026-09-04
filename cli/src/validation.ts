/**
 * validation(claim_id, construct, method, target) -> validation_record
 *
 * Appends a validation record to .ddd/reports/validations.yaml and links it
 * into the citing claim. Enforces the kernel invariants at write time so a
 * hand-authoring error class cannot enter the ledger:
 *   - the claim must exist;
 *   - the construct must equal a claim constructs[] entry verbatim;
 *   - the method must be in the closed set;
 *   - evidence_hash must be sha256:<64 hex>, auto-computed from the target
 *     file when --target names an existing file.
 */
import { existsSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import type { Claim } from "./types";
import {
  loadLedger,
  nextId,
  nowIso,
  parseYaml,
  readText,
  sha256Digest,
  writeText,
  yamlFlowList,
  yamlScalar,
} from "./utils";

const VALIDATIONS_HEADER = `# DDD Validation Records
# Proof records for claims: one validation links to exactly one claim and
# targets exactly one declared construct. Legacy validation record schema.

schema_version: 0.1.0

entries: []
`;

export const VALIDATION_METHODS = [
  "test",
  "lint",
  "type-check",
  "formal",
  "manual",
  "runtime-assertion",
] as const;

export type ValidationMethod = (typeof VALIDATION_METHODS)[number];

export interface ValidationRecord {
  id: string;
  schema_version: string;
  claim: string;
  construct: string;
  method: ValidationMethod;
  target: string;
  result: "pass" | "fail";
  run_at: string;
  evidence_hash: string;
  notes?: string | null;
}

export interface AddValidationOptions {
  claimId: string;
  construct: string;
  method: string;
  target: string;
  result?: "pass" | "fail";
  evidenceHash?: string;
  notes?: string;
}

export function addValidation(dddDir: string, opts: AddValidationOptions): ValidationRecord {
  const claimsPath = join(dddDir, "claims.yaml");
  if (!existsSync(claimsPath)) {
    throw new Error(`Claims ledger not found at ${claimsPath}; record a claim first (ddd claim ...)`);
  }
  const claimsDoc = parseYaml(readText(claimsPath)) as { entries?: Claim[] };
  const claims = Array.isArray(claimsDoc.entries) ? claimsDoc.entries : [];
  const claim = claims.find((candidate) => candidate.id === opts.claimId);
  if (!claim) {
    const known = claims.map((candidate) => candidate.id).join(", ");
    throw new Error(
      `Claim ${opts.claimId} not found in ${claimsPath}${known ? ` (known claims: ${known})` : ""}`,
    );
  }
  if (claim.status === "retracted") {
    throw new Error(`Claim ${opts.claimId} is retracted and cannot take new validations`);
  }
  if (!(claim.constructs ?? []).includes(opts.construct)) {
    throw new Error(
      `Construct "${opts.construct}" is not declared on claim ${opts.claimId}. ` +
        `Rule: the validation construct must equal a claim constructs[] entry verbatim. ` +
        `Claim ${opts.claimId} declares: ${yamlFlowList(claim.constructs ?? [])}. ` +
        `Re-record the claim with --construct "${opts.construct}" if it should be covered.`,
    );
  }
  if (!VALIDATION_METHODS.includes(opts.method as ValidationMethod)) {
    throw new Error(
      `method "${opts.method}" not in [${VALIDATION_METHODS.join(", ")}]`,
    );
  }
  if (opts.result !== undefined && !["pass", "fail"].includes(opts.result)) {
    throw new Error(`--result must be one of: pass, fail`);
  }

  const evidenceHash = resolveEvidenceHash(dddDir, opts);

  const validationsPath = join(dddDir, "reports", "validations.yaml");
  const { text: baseText, entries } = loadLedger<{ id?: string }>(
    validationsPath,
    VALIDATIONS_HEADER,
    "entries",
  );
  let text = baseText;

  const record: ValidationRecord = {
    id: nextId(entries, "V"),
    schema_version: "0.1.0",
    claim: opts.claimId,
    construct: opts.construct,
    method: opts.method as ValidationMethod,
    target: opts.target,
    result: opts.result ?? "pass",
    run_at: nowIso(),
    evidence_hash: evidenceHash,
    notes: opts.notes ?? null,
  };

  if (/^entries:\s*\[\]\s*$/m.test(text)) {
    text = text.replace(/^entries:\s*\[\]\s*$/m, "entries:");
  } else if (!/^\s*entries:/m.test(text)) {
    if (!text.endsWith("\n")) text += "\n";
    text += "\nentries:\n";
  }
  if (!text.endsWith("\n")) text += "\n";
  text += serializeValidation(record);
  writeText(validationsPath, text);

  linkValidationToClaim(claimsPath, claim.id, record.id);

  return record;
}

/** Compute the evidence hash: explicit --hash, or the digest of the target file. */
function resolveEvidenceHash(dddDir: string, opts: AddValidationOptions): string {
  if (opts.evidenceHash) {
    if (!/^sha256:[a-f0-9]{64}$/.test(opts.evidenceHash)) {
      throw new Error(
        `--hash "${opts.evidenceHash}" is malformed; expected sha256:<64 lowercase hex>`,
      );
    }
    return opts.evidenceHash;
  }
  const projectRoot = dirname(dddDir);
  const candidates = isAbsolute(opts.target)
    ? [opts.target]
    : [join(projectRoot, opts.target), join(process.cwd(), opts.target)];
  const targetFile = candidates.find((candidate) => existsSync(candidate));
  if (!targetFile) {
    throw new Error(
      `--target "${opts.target}" is not an existing file, so evidence_hash cannot be auto-computed. ` +
        `Pass a file path, or record a non-file artifact digest with --hash sha256:<64 hex>.`,
    );
  }
  return sha256Digest(readText(targetFile));
}

/**
 * Append the validation id to the claim's validations list in claims.yaml so
 * the one-validation-to-one-claim link is written from both sides.
 */
function linkValidationToClaim(claimsPath: string, claimId: string, validationId: string): void {
  let text = readText(claimsPath);
  const lines = text.split("\n");
  let inClaim = false;
  let validationsLine = -1;
  let constructsLine = -1;
  let claimEnd = lines.length;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const entryMatch = line.match(/^  - id: (\S+)\s*$/);
    if (entryMatch) {
      if (inClaim) {
        claimEnd = index;
        break;
      }
      inClaim = entryMatch[1] === claimId;
      continue;
    }
    if (!inClaim) continue;
    if (/^ {4}validations:/.test(line)) validationsLine = index;
    if (/^ {4}constructs:/.test(line)) constructsLine = index;
  }
  if (!inClaim) {
    throw new Error(`Claim ${claimId} disappeared from ${claimsPath} while linking`);
  }
  if (validationsLine >= 0) {
    const existing = parseYaml(`v: ${lines[validationsLine].replace(/^ {4}validations:\s*/, "")}`) as {
      v?: string[];
    };
    const linked = [...new Set([...(Array.isArray(existing.v) ? existing.v : []), validationId])];
    lines[validationsLine] = `    validations: ${yamlFlowList(linked)}`;
  } else if (constructsLine >= 0) {
    lines.splice(constructsLine + 1, 0, `    validations: [${yamlScalar(validationId)}]`);
  } else {
    let insertAt = claimEnd;
    while (insertAt > 0 && lines[insertAt - 1].trim() === "") insertAt--;
    lines.splice(insertAt, 0, `    validations: [${yamlScalar(validationId)}]`);
  }
  text = lines.join("\n");
  writeText(claimsPath, text);
}

function serializeValidation(record: ValidationRecord): string {
  return (
    [
      `  - id: ${record.id}`,
      `    schema_version: ${yamlScalar(record.schema_version)}`,
      `    claim: ${yamlScalar(record.claim)}`,
      `    construct: ${yamlScalar(record.construct)}`,
      `    method: ${yamlScalar(record.method)}`,
      `    target: ${yamlScalar(record.target)}`,
      `    result: ${yamlScalar(record.result)}`,
      `    run_at: ${yamlScalar(record.run_at)}`,
      `    evidence_hash: ${yamlScalar(record.evidence_hash)}`,
      `    notes: ${record.notes ? yamlScalar(record.notes) : "null"}`,
    ].join("\n") + "\n"
  );
}
