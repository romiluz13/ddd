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
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { deriveTier, type ClaimImpact, type ClaimKind } from "./claim";
import { EVIDENCE_INDEPENDENCE_LEVELS, LOCKABLE_STATUSES } from "./lock";
import type { Claim, EvidenceLockEntry, SweepReport, SweepViolation, TraceEntry } from "./types";
import { nowIso, parseYaml, readText, sha256Digest } from "./utils";

export type SweepDirection = "forward" | "reverse" | "both";

interface ValidationRecord {
  id: string;
  claim?: string;
  claim_id?: string;
  construct?: string;
  method?: string;
  target?: string;
  result?: string;
  run_at?: string;
  evidence_hash?: string;
}

export function sweep(dddDir: string, direction: SweepDirection = "both"): SweepReport {
  const claimsPath = join(dddDir, "claims.yaml");
  const tracePath = join(dddDir, "trace-matrix.yaml");
  const lockPath = join(dddDir, "evidence.lock");

  const claimsDoc = existsSync(claimsPath)
    ? (parseYaml(readText(claimsPath)) as { entries?: Claim[] })
    : { entries: [] };
  const traceDoc = existsSync(tracePath)
    ? (parseYaml(readText(tracePath)) as { traces?: TraceEntry[] })
    : { traces: [] };
  const lockDoc = existsSync(lockPath)
    ? (parseYaml(readText(lockPath)) as { entries?: EvidenceLockEntry[] })
    : { entries: [] };

  const claims: Claim[] = Array.isArray(claimsDoc?.entries) ? claimsDoc.entries : [];
  const traces: TraceEntry[] = Array.isArray(traceDoc?.traces) ? traceDoc.traces : [];
  const evidenceEntries: EvidenceLockEntry[] = Array.isArray(lockDoc?.entries) ? lockDoc.entries : [];
  const evidenceById = new Map(evidenceEntries.map((entry) => [entry.id, entry]));
  const validationById = readValidationRecords(dddDir);
  const profile = readProfile(dddDir);

  const violations: SweepViolation[] = [];
  validateBookManifest(dddDir, violations);
  if (claims.length === 0) {
    violations.push({
      type: "empty-scope",
      message: "No claims were declared, so conformance was not evaluated.",
    });
  }

  if (direction === "forward" || direction === "both") {
    for (const claim of claims) {
      if (claim.status === "retracted" && traces.some((trace) => trace.claim_id === claim.id)) {
        violations.push({
          type: "retracted-claim-cited",
          claim_id: claim.id,
          message: `Retracted claim ${claim.id} is still cited by an active trace.`,
        });
      }
      if (claim.status === "retracted") continue;
      if (!Array.isArray(claim.sources) || claim.sources.length === 0) {
        violations.push({
          type: "claim-without-source",
          claim_id: claim.id,
          message: `Claim ${claim.id} has no sources. Rule: every claim MUST cite at least one evidence source (field: sources, expected: [{ref: "EL-NNN[#section]", authority_domain: "...", entailment: "explicit|implicit|paraphrase"}]).`,
          resolution: `Lock the evidence first (ddd lock <url> --version <v> ...), then re-record the claim with --source EL-NNN[#section]`,
        });
      } else {
        for (const sourceRef of claim.sources) {
          const [sourceId, citedSection] = sourceRef.ref.split("#", 2);
          const evidence = evidenceById.get(sourceId);
          if (!evidence) {
            violations.push({
              type: "claim-with-missing-evidence",
              claim_id: claim.id,
              message: `Claim ${claim.id} references missing evidence ${sourceId}. Rule: sources[].ref must name an entry that exists in .ddd/evidence.lock.`,
              resolution: `Lock the source first: ddd lock <url> --version <v> --source-class <class> ...`,
            });
            continue;
          }
          if (evidence.revoked || evidence.superseded_by) {
            violations.push({
              type: "claim-with-inactive-evidence",
              claim_id: claim.id,
              message: `Claim ${claim.id} references inactive evidence ${sourceId}${evidence.superseded_by ? ` (superseded by ${evidence.superseded_by})` : " (revoked)"}. Rule: claims must cite active evidence only.`,
              resolution: `Re-record the claim citing ${evidence.superseded_by ?? "an active entry"} instead of ${sourceId}`,
            });
          }
          if (
            !["vendor-doc", "standard", "project-doc", "source-code", "code-derived", "experiment"].includes(
              evidence.source_class,
            )
          ) {
            violations.push({
              type: "invalid-evidence-class",
              claim_id: claim.id,
              message: `Evidence ${sourceId} has source class ${evidence.source_class}, which cannot support a claim.`,
            });
          }
          if (
            !EVIDENCE_INDEPENDENCE_LEVELS.includes(
              evidence.independence as (typeof EVIDENCE_INDEPENDENCE_LEVELS)[number],
            ) ||
            (evidence.status &&
              !LOCKABLE_STATUSES.includes(evidence.status as (typeof LOCKABLE_STATUSES)[number])) ||
            (["vendor-doc", "standard"].includes(evidence.source_class) && !evidence.status)
          ) {
            violations.push({
              type: "invalid-evidence-provenance",
              claim_id: claim.id,
              message: `Evidence ${sourceId} has invalid status or independence provenance.`,
            });
          }
          if (["vendor-doc", "standard", "source-code"].includes(evidence.source_class)) {
            if (
              !evidence.version?.trim() ||
              ["latest", "unversioned"].includes(evidence.version.trim().toLowerCase())
            ) {
              violations.push({
                type: "claim-with-unversioned-evidence",
                claim_id: claim.id,
                message: `Claim ${claim.id} references external evidence ${sourceId} without an explicit version.`,
              });
            }
          }
          if (!evidence.authority_for?.includes(sourceRef.authority_domain)) {
            violations.push({
              type: "authority-domain-mismatch",
              claim_id: claim.id,
              message: `Evidence ${sourceId} is not authoritative for "${sourceRef.authority_domain}". Rule: the claim's --authority must appear in the evidence entry's authority_for (has: [${(evidence.authority_for ?? []).join(", ")}]).`,
              resolution: `Re-record the claim with --authority set to one of: ${(evidence.authority_for ?? []).join(", ")}`,
            });
          }
          if (evidence.independence === "agent-authored-unapproved") {
            violations.push({
              type: "unapproved-evidence",
              claim_id: claim.id,
              message: `Evidence ${sourceId} is agent-authored and unapproved, so it cannot support ${claim.id}.`,
            });
          }
          if (citedSection && !evidence.sections?.includes(citedSection)) {
            violations.push({
              type: "citation-section-missing",
              claim_id: claim.id,
              message: `Section "${citedSection}" is not recorded on evidence ${sourceId}.`,
            });
          }
          if (!sourceRef.entailment || sourceRef.entailment === "not-evaluated") {
            violations.push({
              type: "citation-not-verified",
              claim_id: claim.id,
              message: `Claim ${claim.id} has no recorded entailment result for ${sourceRef.ref}. Rule: every citation must record a positive entailment (field: sources[].entailment, expected: explicit | implicit | paraphrase).`,
              resolution: `Verify the section supports the claim, then re-record the claim with --entailment explicit (or implicit + --rationale)`,
            });
          } else if (["not-entailed", "contradicts"].includes(sourceRef.entailment)) {
            violations.push({
              type: "citation-failed",
              claim_id: claim.id,
              message: `Claim ${claim.id} failed entailment (${sourceRef.entailment}) for ${sourceRef.ref}. Rule: only positive entailment results can support a claim.`,
              resolution: `Re-record the claim citing a section that actually supports it, or retract the claim`,
            });
          }
          if (sourceRef.entailment === "implicit" && !claim.rationale?.trim()) {
            violations.push({
              type: "implicit-entailment-without-rationale",
              claim_id: claim.id,
              message: `Claim ${claim.id} records implicit entailment without a derivation rationale.`,
            });
          }
          if (!evidence.cache_path) {
            violations.push({
              type: "claim-with-uncaptured-evidence",
              claim_id: claim.id,
              message: `Evidence ${sourceId} does not identify captured content.`,
            });
          } else {
            const cachePath = join(dddDir, evidence.cache_path);
            if (!existsSync(cachePath)) {
              violations.push({
                type: "claim-with-uncaptured-evidence",
                claim_id: claim.id,
                message: `Captured content for evidence ${sourceId} is missing.`,
              });
            } else {
              const capturedContent = readText(cachePath);
              if (sha256Digest(capturedContent) !== evidence.content_digest) {
                violations.push({
                  type: "claim-with-corrupt-evidence",
                  claim_id: claim.id,
                  message: `Captured content for evidence ${sourceId} does not match its digest.`,
                });
              } else if (
                citedSection &&
                !capturedContent.toLowerCase().includes(citedSection.toLowerCase())
              ) {
                violations.push({
                  type: "citation-section-missing",
                  claim_id: claim.id,
                  message: `Section "${citedSection}" was not found in captured content for ${sourceId}.`,
                });
              }
            }
          }
        }
      }
      if (!Array.isArray(claim.constructs) || claim.constructs.length === 0) {
        violations.push({
          type: "claim-without-construct",
          claim_id: claim.id,
          message: `Claim ${claim.id} has no declared implementation construct. Rule: every claim must name the symbols it covers (field: constructs, expected: [<path>#<symbol>, ...]).`,
          resolution: `Re-record the claim with --construct <path>#<symbol>[,<path>#<symbol>]`,
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
            message: `Construct "${construct}" on claim ${claim.id} has no trace entry. Rule: every declared construct must have a matching trace (claim_id + construct_id) in .ddd/trace-matrix.yaml.`,
            resolution: `ddd trace ${claim.id} ${construct}`,
          });
        }
      }
      const derivedTier = derivePersistedTier(claim);
      if (!derivedTier || claim.tier !== derivedTier) {
        violations.push({
          type: "claim-tier-mismatch",
          claim_id: claim.id,
          message: derivedTier
            ? `Claim ${claim.id} records ${claim.tier ?? "no tier"} but derives to ${derivedTier}.`
            : `Claim ${claim.id} has an invalid claim_kind or impact.`,
        });
      }
      const effectiveTier = derivedTier ?? "T3";
      if (["T2", "T3"].includes(effectiveTier)) {
        if (!Array.isArray(claim.validations) || claim.validations.length === 0) {
          violations.push({
            type: "claim-without-validation",
            claim_id: claim.id,
            message: `Claim ${claim.id} is ${effectiveTier} and requires validation. Rule: T2/T3 claims must link at least one passing validation record (field: validations, expected: [V-NNN, ...]).`,
            resolution: `Run the check, then: ddd validation --claim ${claim.id} --construct <symbol> --method <test|lint|type-check|formal|manual|runtime-assertion> --target <file>`,
          });
        }
        for (const validationId of claim.validations ?? []) {
          const validation = validationById.get(validationId);
          if (!validation) {
            violations.push({
              type: "validation-record-missing",
              claim_id: claim.id,
              message: `Validation ${validationId} for claim ${claim.id} has no record in reports/validations.yaml. Rule: claim validations[] must reference existing records.`,
              resolution: `Record it: ddd validation --claim ${claim.id} --construct <symbol> --method <m> --target <file>, then re-record the claim with --validation ${validationId.replace(/^V-/, "V-")}`,
            });
          } else if ((validation.claim ?? validation.claim_id) !== claim.id) {
            violations.push({
              type: "validation-link-mismatch",
              claim_id: claim.id,
              message: `Validation ${validationId} does not link back to claim ${claim.id}.`,
            });
          } else if (validation.result !== "pass") {
            violations.push({
              type: "validation-failed",
              claim_id: claim.id,
              message: `Validation ${validationId} for claim ${claim.id} did not pass.`,
            });
          } else if (!isCompleteValidationRecord(validation)) {
            violations.push({
              type: "validation-record-invalid",
              claim_id: claim.id,
              message: `Validation ${validationId} lacks required proof metadata.`,
            });
          }
        }
        for (const trace of traces.filter((candidate) => candidate.claim_id === claim.id)) {
          if (!trace.validation_id) {
            violations.push({
              type: "trace-without-validation",
              claim_id: claim.id,
              trace_id: trace.id,
              message: `Trace ${trace.id} implements ${effectiveTier} claim ${claim.id} without validation. Rule: T2/T3 traces must reference a validation id.`,
              resolution: `Record it (ddd validation --claim ${claim.id} --construct ${trace.construct_id} --method <m> --target <file>), then re-trace with --validation <V-NNN>`,
            });
          } else if (!(claim.validations ?? []).includes(trace.validation_id)) {
            violations.push({
              type: "validation-link-mismatch",
              claim_id: claim.id,
              trace_id: trace.id,
              message: `Trace ${trace.id} references validation ${trace.validation_id}, which is not linked by claim ${claim.id}.`,
            });
          } else if (validationById.get(trace.validation_id)?.construct !== trace.construct_id) {
            violations.push({
              type: "validation-link-mismatch",
              claim_id: claim.id,
              trace_id: trace.id,
              message: `Validation ${trace.validation_id} does not target construct ${trace.construct_id}.`,
            });
          }
        }
      }
      if (effectiveTier === "T3") {
        if (!claim.rationale?.trim()) {
          violations.push({
            type: "t3-without-rationale",
            claim_id: claim.id,
            message: `T3 claim ${claim.id} requires an explicit rationale.`,
          });
        }
        if (profile === "lite") {
          violations.push({
            type: "t3-not-allowed-in-lite",
            claim_id: claim.id,
            message: `T3 claim ${claim.id} requires the Assurance profile.`,
          });
        }
        if (!hasRefutationReport(dddDir, claim.id)) {
          violations.push({
            type: "t3-without-refutation",
            claim_id: claim.id,
            message: `T3 claim ${claim.id} has no sustained independent refutation report.`,
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

  const pass = violations.length === 0;
  const verdict =
    claims.length === 0 || (pass && direction !== "both")
      ? "NOT_EVALUATED"
      : pass
        ? "CONFORMANT_DECLARED_SCOPE"
        : "NONCONFORMANT";
  return {
    schema_version: "0.1.0",
    direction,
    checked_at: nowIso(),
    claims_checked: claims.length,
    traces_checked: traces.length,
    violations,
    verdict,
    scope: "declared-constructs",
    capabilities: {
      evidence_integrity: "tool-enforced",
      trace_graph: "tool-enforced",
      tier_requirements: "tool-enforced",
      entailment: "recorded-attestation",
      reverse_sweep: "declared-constructs-only",
      validation_records: "tool-enforced",
      refutation_independence: "recorded-metadata",
    },
    pass,
  };
}

interface BookArtifactReference {
  path?: string;
  digest?: string;
}

function validateBookManifest(dddDir: string, violations: SweepViolation[]): void {
  const bookPath = join(dddDir, "book.yaml");
  if (!existsSync(bookPath)) {
    violations.push({
      type: "book-manifest-missing",
      message: "The mandatory Book manifest .ddd/book.yaml is missing.",
    });
    return;
  }
  const book = parseYaml(readText(bookPath)) as {
    manifest_digest?: string;
    requirements?: BookArtifactReference[];
    decisions?: BookArtifactReference[];
    agent_context?: BookArtifactReference[];
  };
  const declaredReferences = [
    ...(Array.isArray(book.requirements) ? book.requirements : []),
    ...(Array.isArray(book.decisions) ? book.decisions : []),
    ...(Array.isArray(book.agent_context) ? book.agent_context : []),
  ];
  for (const reference of declaredReferences) {
    if (!reference.path || !reference.digest) {
      violations.push({
        type: "manifest-artifact-digest-mismatch",
        message: `Every Book artifact reference must include path and digest.`,
      });
    }
  }
  const references = declaredReferences.filter(
    (reference): reference is Required<BookArtifactReference> => Boolean(reference.path && reference.digest),
  );
  const projectRoot = dirname(dddDir);
  for (const reference of references) {
    const artifactPath = join(projectRoot, reference.path);
    if (!existsSync(artifactPath)) {
      violations.push({
        type: "manifest-artifact-missing",
        message: `Book artifact ${reference.path} does not exist.`,
      });
    } else if (sha256Digest(readText(artifactPath)) !== reference.digest) {
      violations.push({
        type: "manifest-artifact-digest-mismatch",
        message: `Book artifact ${reference.path} does not match its recorded digest.`,
      });
    }
  }
  const fixed = ["SPEC.md", "CONTEXT.md", "AGENTS.md", "SKILLS.md"];
  const byPath = new Map(references.map((reference) => [reference.path, reference.digest]));
  const order = [
    ...fixed.filter((path) => byPath.has(path)),
    ...references
      .map((reference) => reference.path)
      .filter((path) => !fixed.includes(path))
      .sort(),
  ];
  const canonical = order.map((path) => byPath.get(path)?.replace(/^sha256:/, "")).join("\n") + "\n";
  if (book.manifest_digest !== sha256Digest(canonical)) {
    violations.push({
      type: "manifest-digest-mismatch",
      message: "Book manifest_digest does not match the canonical referenced-artifact digest list.",
    });
  }
}

function isCompleteValidationRecord(validation: ValidationRecord): boolean {
  return (
    Boolean(validation.construct) &&
    ["test", "lint", "type-check", "formal", "manual", "runtime-assertion"].includes(
      validation.method ?? "",
    ) &&
    Boolean(validation.target) &&
    !Number.isNaN(Date.parse(validation.run_at ?? "")) &&
    /^sha256:[a-f0-9]{64}$/.test(validation.evidence_hash ?? "")
  );
}

function derivePersistedTier(claim: Claim): "T0" | "T1" | "T2" | "T3" | null {
  const kinds: ClaimKind[] = ["mechanical", "api", "behavioral", "architectural", "operational"];
  const impacts: ClaimImpact[] = ["low", "medium", "high", "critical"];
  if (!kinds.includes(claim.claim_kind as ClaimKind) || !impacts.includes(claim.impact as ClaimImpact)) {
    return null;
  }
  return deriveTier(claim.claim_kind as ClaimKind, claim.impact as ClaimImpact);
}

function readValidationRecords(dddDir: string): Map<string, ValidationRecord> {
  const path = join(dddDir, "reports", "validations.yaml");
  if (!existsSync(path)) return new Map();
  const doc = parseYaml(readText(path)) as { entries?: ValidationRecord[] };
  const entries = Array.isArray(doc.entries) ? doc.entries : [];
  return new Map(entries.map((entry) => [entry.id, entry]));
}

function readProfile(dddDir: string): string {
  const bookPath = join(dddDir, "book.yaml");
  if (!existsSync(bookPath)) return "lite";
  const book = parseYaml(readText(bookPath)) as { profile?: string };
  return typeof book.profile === "string" ? book.profile : "lite";
}

function hasRefutationReport(dddDir: string, claimId: string): boolean {
  const reportsDir = join(dddDir, "reports");
  if (!existsSync(reportsDir)) return false;
  for (const name of readdirSync(reportsDir)) {
    if (!name.endsWith(".yaml") && !name.endsWith(".yml")) continue;
    const report = parseYaml(readText(join(reportsDir, name))) as {
      claim_id?: string;
      verdict?: string;
      outcome?: string;
      refuter_id?: string;
      implementer_id?: string;
      independence_verified?: boolean;
    };
    if (
      report.claim_id === claimId &&
      ["sustained", "passed"].includes(String(report.verdict ?? report.outcome ?? "").toLowerCase()) &&
      report.independence_verified === true &&
      Boolean(report.refuter_id) &&
      Boolean(report.implementer_id) &&
      report.refuter_id !== report.implementer_id
    ) {
      return true;
    }
  }
  return false;
}
