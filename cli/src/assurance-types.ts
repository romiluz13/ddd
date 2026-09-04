export type EpistemicRole =
  | "normative"
  | "descriptive"
  | "observation"
  | "validation"
  | "implementation"
  | "waiver";

export type AssuranceNodeType =
  | "requirement"
  | "contract"
  | "implementation"
  | "observation"
  | "validation"
  | "decision"
  | "exception";

export type AssuranceEdgeType =
  | "supports"
  | "constrains"
  | "implements"
  | "validates"
  | "derived_from"
  | "contradicts"
  | "affects"
  | "waives";

export type AssuranceVerdict = "SATISFIED" | "UNSATISFIED" | "INDETERMINATE" | "WAIVED";
export type AssuranceSchemaVersion = "0.4.0" | "0.5.0";
export type CapabilityStatus = "tool-enforced" | "recorded-attestation" | "not-evaluated";
export type BoundaryConfidence = "complete" | "partial" | "unknown";
export type CoverageStatus =
  | "covered"
  | "descriptive-only"
  | "gap"
  | "exempt"
  | "grandfathered"
  | "outside-boundary";

export interface Provenance {
  origin: "external" | "project" | "generated" | "runtime" | "human";
  actor: string;
  tool: string;
  revision: string;
  captured_at: string;
}

export interface ChangeExclusion {
  construct: string;
  reason: string;
}

export interface ChangeEnvelope {
  schema_version: AssuranceSchemaVersion;
  id: string;
  base_revision: string;
  head_revision: string;
  changed_files: string[];
  changed_symbols: string[];
  /**
   * Changed files that exercise the declared external stack (bare imports of
   * declared dependencies or literal external service URLs). Changed symbols
   * in these files are boundary-relevant; symbols in other files are internal
   * and below the supported assurance boundary. Absent in 0.4.0 envelopes,
   * where every changed symbol is treated as boundary-relevant.
   */
  boundary_files?: string[];
  declared_dependencies: string[];
  declared_dependency_versions?: Record<string, string[]>;
  affected_dependencies: string[];
  affected_services: string[];
  affected_platforms: string[];
  affected_contracts: string[];
  frontend_files: string[];
  known_consumers: string[];
  risk: "low" | "medium" | "high" | "critical";
  owner: string | null;
  exclusions: ChangeExclusion[];
  boundary_confidence: BoundaryConfidence;
  detector: {
    name: string;
    version: string;
  };
  created_at: string;
}

export interface AssuranceNode {
  id: string;
  node_type: AssuranceNodeType;
  label: string;
  epistemic_role: EpistemicRole;
  approval_state: "approved" | "proposed" | "rejected" | "not-applicable";
  derived_from: string[];
  provenance: Provenance;
  construct?: string;
  coverage_status?: CoverageStatus;
  risk_tier?: "T0" | "T1" | "T2" | "T3";
  status?: "open" | "resolved" | "approved";
  rationale?: string;
  validation_result?: "pass" | "fail" | "not-run";
  /** Waiver nodes only: ISO date after which the accepted risk lapses. */
  expires_at?: string;
}

export interface AssuranceEdge {
  id: string;
  edge_type: AssuranceEdgeType;
  source_node: string;
  target_node: string;
  rationale?: string;
}

export interface CaseObligation {
  id: string;
  defeater: string;
  issue: string;
  due_at?: string;
  status: "open" | "fulfilled";
}

export interface AssuranceCase {
  schema_version: AssuranceSchemaVersion;
  id: string;
  envelope: ChangeEnvelope;
  goals: string[];
  nodes: AssuranceNode[];
  edges: AssuranceEdge[];
  defeaters: string[];
  capabilities: Record<string, CapabilityStatus>;
  required_capabilities: string[];
  /** Obligations tracking this case's open defeaters against issue URLs. */
  obligations?: CaseObligation[];
  implementer_id?: string;
  reviewer_id?: string;
  created_at: string;
}

export type AssuranceViolationType =
  | "graph-cycle"
  | "duplicate-node"
  | "duplicate-edge"
  | "unknown-node"
  | "self-derived-support"
  | "descriptive-normative-support"
  | "retrospective-baseline"
  | "unapproved-normative-source"
  | "uncovered-construct"
  | "unlinked-implementation"
  | "missing-goal"
  | "invalid-goal"
  | "unsupported-goal"
  | "unresolved-defeater"
  | "missing-validation"
  | "failed-validation"
  | "missing-reviewer-independence"
  | "reviewer-not-independent"
  | "contradicted-goal"
  | "invalid-waiver";

export interface AssuranceViolation {
  type: AssuranceViolationType;
  message: string;
  node_id?: string;
  edge_id?: string;
  construct?: string;
  /** Exact command or action that resolves this violation class. */
  resolution?: string;
}

export interface AssuranceReport {
  schema_version: "0.5.0";
  case_id: string;
  evaluated_at: string;
  verdict: AssuranceVerdict;
  evaluated_boundary: string[];
  boundary_confidence: BoundaryConfidence;
  supported_capabilities: string[];
  unevaluated_capabilities: string[];
  open_defeaters: string[];
  approved_exceptions: string[];
  /** IDs of open obligations tracking this case's defeaters. */
  open_obligations: string[];
  violations: AssuranceViolation[];
}
