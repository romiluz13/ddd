/**
 * TypeScript types for legacy DDD compatibility artifacts.
 */

/** Evidence lock entry */
export interface EvidenceLockEntry {
  id: string; // EL-NNN
  schema_version: string;
  source_class: string; // standard | vendor-doc | source-code | waiver | ...
  source_url: string;
  publisher: string;
  product: string;
  version: string;
  retrieved_at: string; // ISO 8601
  content_digest: string; // sha256:...
  doc_version: string;
  cache_path?: string;
  content_type?: string;
  canonical_url?: string;
  etag?: string;
  last_modified?: string;
  sections: string[];
  status: string; // normative | informative
  authority_for: string[];
  freshness: string; // e.g. "90d"
  adapter: string;
  license: string;
  independence: string; // external | internal
  superseded_by: string | null;
  supersedes?: string;
  revoked?: boolean;
  revoked_at?: string;
  notes?: string;
}

export interface EvidenceLock {
  schema_version: string;
  entries: EvidenceLockEntry[];
}

/** Claim ledger entry */
export interface ClaimSource {
  ref: string;
  authority_domain: string;
  entailment?: "explicit" | "implicit" | "paraphrase" | "not-entailed" | "contradicts" | "not-evaluated";
}

export interface Claim {
  id: string; // C-NNN
  schema_version?: string;
  statement: string;
  rationale?: string;
  sources: ClaimSource[];
  claim_kind?: string;
  impact?: string;
  tier?: string;
  status?: string;
  constructs: string[];
  validations?: string[];
  exceptions?: string[];
}

export interface ClaimLedger {
  schema_version: string;
  entries: Claim[];
}

/** Trace entry */
export interface TraceEntry {
  id: string; // TR-NNN
  schema_version: string;
  change_id: string | null;
  claim_id: string;
  construct_id: string;
  validation_id: string | null;
  direction: "forward" | "reverse";
  sweep_pass: boolean;
  checked_at: string;
  notes: string | null;
}

export interface TraceMatrix {
  schema_version: string;
  traces: TraceEntry[];
}

/** Sweep violation reported by the Compliance Sweep primitive */
export interface SweepViolation {
  type:
    | "empty-scope"
    | "book-manifest-missing"
    | "manifest-artifact-missing"
    | "manifest-artifact-digest-mismatch"
    | "manifest-digest-mismatch"
    | "claim-without-source"
    | "claim-without-construct"
    | "claim-with-missing-evidence"
    | "claim-with-inactive-evidence"
    | "claim-with-uncaptured-evidence"
    | "claim-with-corrupt-evidence"
    | "claim-with-unversioned-evidence"
    | "invalid-evidence-class"
    | "invalid-evidence-provenance"
    | "authority-domain-mismatch"
    | "citation-section-missing"
    | "citation-not-verified"
    | "citation-failed"
    | "implicit-entailment-without-rationale"
    | "unapproved-evidence"
    | "retracted-claim-cited"
    | "claim-without-validation"
    | "claim-tier-mismatch"
    | "validation-link-mismatch"
    | "validation-record-missing"
    | "validation-failed"
    | "validation-record-invalid"
    | "trace-without-validation"
    | "t3-not-allowed-in-lite"
    | "t3-without-refutation"
    | "t3-without-rationale"
    | "untraced-construct"
    | "orphan-trace"
    | "trace-without-construct";
  claim_id?: string;
  trace_id?: string;
  construct?: string;
  message: string;
}

export interface SweepReport {
  schema_version: string;
  direction: "forward" | "reverse" | "both";
  checked_at: string;
  claims_checked: number;
  traces_checked: number;
  violations: SweepViolation[];
  verdict: "CONFORMANT_DECLARED_SCOPE" | "NONCONFORMANT" | "NOT_EVALUATED";
  scope: "declared-constructs";
  capabilities: {
    evidence_integrity: "tool-enforced";
    trace_graph: "tool-enforced";
    tier_requirements: "tool-enforced";
    entailment: "recorded-attestation";
    reverse_sweep: "declared-constructs-only";
    validation_records: "tool-enforced";
    refutation_independence: "recorded-metadata";
  };
  pass: boolean;
}

/** Drift report entry for one evidence lock entry */
export interface DriftReportEntry {
  entry_id: string;
  source_url: string;
  retrieved_at: string;
  freshness: string | null;
  freshness_days: number | null;
  age_days: number;
  status: "fresh" | "stale" | "inactive" | "unknown";
  reason?: string;
}

export interface DriftReport {
  schema_version: string;
  checked_at: string;
  entries_checked: number;
  stale_count: number;
  entries: DriftReportEntry[];
}
