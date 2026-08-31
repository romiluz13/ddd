/**
 * claim(statement, source) -> claim
 *
 * Records one atomic claim against an active, cached evidence entry.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Claim, EvidenceLockEntry } from "./types";
import { EVIDENCE_INDEPENDENCE_LEVELS, LOCKABLE_STATUSES } from "./lock";
import {
  nextId,
  parseYaml,
  readText,
  sha256Digest,
  writeText,
  yamlFlowList,
  yamlScalar,
} from "./utils";

const CLAIMS_HEADER = `# DDD Claim Ledger
# Atomic statements extracted from locked evidence.
# Legacy claim ledger schema

schema_version: 0.1.0

entries:
`;

export type ClaimKind = "mechanical" | "api" | "behavioral" | "architectural" | "operational";
export type ClaimImpact = "low" | "medium" | "high" | "critical";

export interface AddClaimOptions {
  sourceRef: string;
  authorityDomain: string;
  kind: ClaimKind;
  impact: ClaimImpact;
  rationale?: string;
  constructs?: string[];
  validations?: string[];
  entailment: "explicit" | "implicit" | "paraphrase";
}

const IMPACT_MINIMUM: Record<ClaimImpact, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

const KIND_MINIMUM: Record<ClaimKind, number> = {
  mechanical: 0,
  api: 1,
  behavioral: 2,
  architectural: 2,
  operational: 2,
};

export function deriveTier(kind: ClaimKind, impact: ClaimImpact): "T0" | "T1" | "T2" | "T3" {
  const operationalMinimum = kind === "operational" && ["high", "critical"].includes(impact) ? 3 : 0;
  return `T${Math.max(IMPACT_MINIMUM[impact], KIND_MINIMUM[kind], operationalMinimum)}` as
    | "T0"
    | "T1"
    | "T2"
    | "T3";
}

export function addClaim(dddDir: string, statement: string, opts: AddClaimOptions): Claim {
  if (opts.entailment === "implicit" && !opts.rationale?.trim()) {
    throw new Error("Implicit entailment requires --rationale");
  }
  const tier = deriveTier(opts.kind, opts.impact);
  if (tier === "T3" && !opts.rationale?.trim()) {
    throw new Error("T3 claims require --rationale");
  }
  const sourceId = opts.sourceRef.split("#", 1)[0];
  const lockPath = join(dddDir, "evidence.lock");
  if (!existsSync(lockPath)) throw new Error(`Evidence lock not found at ${lockPath}`);

  const lockDoc = parseYaml(readText(lockPath)) as { entries?: EvidenceLockEntry[] };
  const source = (lockDoc.entries ?? []).find((entry) => entry.id === sourceId);
  if (!source) throw new Error(`Evidence ${sourceId} not found in ${lockPath}`);
  if (source.revoked || source.superseded_by) throw new Error(`Evidence ${sourceId} is inactive`);
  if (source.source_class === "waiver") throw new Error(`Evidence ${sourceId} is a waiver, not evidence`);
  if (
    !EVIDENCE_INDEPENDENCE_LEVELS.includes(
      source.independence as (typeof EVIDENCE_INDEPENDENCE_LEVELS)[number],
    ) ||
    source.independence === "agent-authored-unapproved"
  ) {
    throw new Error(`Evidence ${sourceId} has invalid or unapproved independence`);
  }
  if (
    source.status &&
    !LOCKABLE_STATUSES.includes(source.status as (typeof LOCKABLE_STATUSES)[number])
  ) {
    throw new Error(`Evidence ${sourceId} has invalid status`);
  }
  if (
    ["vendor-doc", "standard", "source-code"].includes(source.source_class) &&
    (!source.version?.trim() || ["latest", "unversioned"].includes(source.version.trim().toLowerCase()))
  ) {
    throw new Error(`Evidence ${sourceId} has no explicit version`);
  }
  if (!source.authority_for?.includes(opts.authorityDomain)) {
    throw new Error(`Evidence ${sourceId} is not authoritative for ${opts.authorityDomain}`);
  }

  const citedSection = opts.sourceRef.includes("#") ? opts.sourceRef.slice(opts.sourceRef.indexOf("#") + 1) : null;
  if (citedSection && !source.sections?.includes(citedSection)) {
    throw new Error(`Section "${citedSection}" is not recorded on evidence ${sourceId}`);
  }

  if (!source.cache_path) throw new Error(`Evidence ${sourceId} has no captured content`);
  const cachedPath = join(dddDir, source.cache_path);
  if (!existsSync(cachedPath)) throw new Error(`Captured content for ${sourceId} is missing`);
  const capturedContent = readText(cachedPath);
  if (sha256Digest(capturedContent) !== source.content_digest) {
    throw new Error(`Captured content for ${sourceId} does not match its digest`);
  }
  if (citedSection && !capturedContent.toLowerCase().includes(citedSection.toLowerCase())) {
    throw new Error(`Section "${citedSection}" was not found in captured content for ${sourceId}`);
  }

  const claimsPath = join(dddDir, "claims.yaml");
  let text = existsSync(claimsPath) ? readText(claimsPath) : CLAIMS_HEADER;
  const claimsDoc = parseYaml(text) as { entries?: Claim[] };
  const claims = Array.isArray(claimsDoc.entries) ? claimsDoc.entries : [];
  const claim: Claim = {
    id: nextId(claims, "C"),
    schema_version: "0.1.0",
    statement,
    rationale: opts.rationale,
    sources: [
      {
        ref: opts.sourceRef,
        authority_domain: opts.authorityDomain,
        entailment: opts.entailment,
      },
    ],
    claim_kind: opts.kind,
    impact: opts.impact,
    tier,
    status: "known-and-supported",
    constructs: opts.constructs ?? [],
    validations: opts.validations ?? [],
    exceptions: [],
  };

  if (/^entries:\s*\[\]\s*$/m.test(text)) {
    text = text.replace(/^entries:\s*\[\]\s*$/m, "entries:");
  } else if (!/^\s*entries:/m.test(text)) {
    if (!text.endsWith("\n")) text += "\n";
    text += "\nentries:\n";
  }
  if (!text.endsWith("\n")) text += "\n";
  text += serializeClaim(claim);
  writeText(claimsPath, text);
  return claim;
}

function serializeClaim(claim: Claim): string {
  const source = claim.sources[0];
  const lines = [
    `  - id: ${claim.id}`,
    `    schema_version: ${yamlScalar(claim.schema_version ?? "0.1.0")}`,
    `    statement: ${yamlScalar(claim.statement)}`,
  ];
  if (claim.rationale) lines.push(`    rationale: ${yamlScalar(claim.rationale)}`);
  lines.push(
    "    sources:",
    `      - ref: ${yamlScalar(source.ref)}`,
    `        authority_domain: ${yamlScalar(source.authority_domain)}`,
    `        entailment: ${yamlScalar(source.entailment ?? "not-evaluated")}`,
    `    claim_kind: ${yamlScalar(claim.claim_kind ?? "")}`,
    `    impact: ${yamlScalar(claim.impact ?? "")}`,
    `    tier: ${yamlScalar(claim.tier ?? "")}`,
    `    status: ${yamlScalar(claim.status ?? "")}`,
    `    constructs: ${yamlFlowList(claim.constructs ?? [])}`,
    `    validations: ${yamlFlowList(claim.validations ?? [])}`,
    `    exceptions: ${yamlFlowList(claim.exceptions ?? [])}`,
  );
  return `\n${lines.join("\n")}\n`;
}
