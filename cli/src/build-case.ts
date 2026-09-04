import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
  AssuranceCase,
  AssuranceEdge,
  AssuranceNode,
  CapabilityStatus,
  ChangeEnvelope,
  CoverageStatus,
} from "./assurance-types";
import type { Claim, EvidenceLockEntry, TraceEntry } from "./types";
import { analyzeCoverage } from "./coverage";
import { loadChangeEnvelope, nextCaseArtifactId } from "./scope-change";
import { nowIso, parseYaml, readText, sha256Digest } from "./utils";

interface ExtendedEvidence extends EvidenceLockEntry {
  derived_from?: string[];
  actor?: string;
  tool?: string;
  ref?: string;
  source?: string;
}

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

interface GoalLedgerEntry {
  id: string;
  claim: string;
  statement?: string;
}

interface ExceptionLedgerEntry {
  id: string;
  goal: string;
  rationale: string;
  owner: string;
  expires_at: string;
  status?: string;
}

interface ObligationLedgerEntry {
  id: string;
  defeater: string;
  description?: string;
  issue: string;
  due_at?: string;
  status?: string;
}

export function buildAssuranceCase(bookDir: string, envelopeIdOrPath: string): AssuranceCase {
  const envelope = loadChangeEnvelope(bookDir, envelopeIdOrPath);
  const evidence = readEntries<ExtendedEvidence>(join(bookDir, "evidence.lock"), "entries");
  const claims = readEntries<Claim>(join(bookDir, "claims.yaml"), "entries").filter(
    (claim) => claim.status !== "retracted",
  );
  const traces = readEntries<TraceEntry>(join(bookDir, "trace-matrix.yaml"), "traces");
  const validations = readEntries<ValidationRecord>(
    join(bookDir, "reports", "validations.yaml"),
    "entries",
  );
  const declaredGoals = readEntries<GoalLedgerEntry>(join(bookDir, "goals.yaml"), "goals");
  const exceptions = readEntries<ExceptionLedgerEntry>(join(bookDir, "exceptions.yaml"), "exceptions");
  const obligations = readEntries<ObligationLedgerEntry>(
    join(bookDir, "obligations.yaml"),
    "obligations",
  );
  const nodes: AssuranceNode[] = evidence.map(evidenceNode);
  const edges: AssuranceEdge[] = [];

  const changedSymbols = new Set(envelope.changed_symbols);
  const tracedClaimIds = new Set(
    traces
      .filter((trace) => changedSymbols.has(trace.construct_id))
      .map((trace) => trace.claim_id),
  );
  // Declared goals join the change-matched claims so a case always has
  // reachable goals even when symbol matching finds no relevant claims.
  const declaredGoalClaimIds = new Set(
    declaredGoals
      .map((goal) => goal.claim)
      .filter((claimId) => claims.some((claim) => claim.id === claimId)),
  );
  const relevantClaims = claims.filter(
    (claim) =>
      tracedClaimIds.has(claim.id) ||
      declaredGoalClaimIds.has(claim.id) ||
      (claim.constructs ?? []).some((construct) => changedSymbols.has(construct)),
  );
  for (const claim of relevantClaims) {
    nodes.push({
      id: claim.id,
      node_type: "requirement",
      label: claim.statement,
      epistemic_role: "normative",
      approval_state: claim.status === "known-and-supported" ? "approved" : "proposed",
      derived_from: [],
      risk_tier: normalizeTier(claim.tier),
      rationale: claim.rationale,
      provenance: {
        origin: "project",
        actor: "claim-author",
        tool: "claim",
        revision: envelope.head_revision,
        captured_at: envelope.created_at,
      },
    });
    for (const source of claim.sources ?? []) {
      const sourceId = source.ref.split("#", 1)[0];
      if (source.entailment === "implicit" && !claim.rationale?.trim()) continue;
      if (!["explicit", "implicit", "paraphrase"].includes(source.entailment ?? "")) {
        if (source.entailment === "contradicts") {
          edges.push({
            id: nextEdgeId(edges),
            edge_type: "contradicts",
            source_node: sourceId,
            target_node: claim.id,
          });
        }
        continue;
      }
      edges.push({
        id: nextEdgeId(edges),
        edge_type: "supports",
        source_node: sourceId,
        target_node: claim.id,
        rationale: source.entailment ? `entailment: ${source.entailment}` : undefined,
      });
    }
  }

  const relevantClaimIds = new Set(relevantClaims.map((claim) => claim.id));
  for (const validation of validations.filter((candidate) =>
    relevantClaimIds.has(candidate.claim ?? candidate.claim_id ?? ""),
  )) {
    const claimId = validation.claim ?? validation.claim_id!;
    nodes.push({
      id: validation.id,
      node_type: "validation",
      label: validation.target ?? validation.id,
      epistemic_role: "validation",
      approval_state: "not-applicable",
      derived_from: [],
      construct: validation.construct,
      validation_result:
        validation.result === "pass" ? "pass" : validation.result === "fail" ? "fail" : "not-run",
      provenance: {
        origin: "runtime",
        actor: "validation-runner",
        tool: validation.method ?? "unknown",
        revision: validation.evidence_hash ?? envelope.head_revision,
        captured_at: validation.run_at ?? envelope.created_at,
      },
    });
    edges.push({
      id: nextEdgeId(edges),
      edge_type: "validates",
      source_node: validation.id,
      target_node: claimId,
    });
  }

  const traceByConstruct = new Map<string, TraceEntry[]>();
  for (const trace of traces.filter((candidate) => relevantClaimIds.has(candidate.claim_id))) {
    const current = traceByConstruct.get(trace.construct_id) ?? [];
    current.push(trace);
    traceByConstruct.set(trace.construct_id, current);
  }

  for (const [index, construct] of envelope.changed_symbols.entries()) {
    const constructTraces = traceByConstruct.get(construct) ?? [];
    const implementationId = `IMP-${String(index + 1).padStart(3, "0")}`;
    nodes.push({
      id: implementationId,
      node_type: "implementation",
      label: construct,
      epistemic_role: "implementation",
      approval_state: "not-applicable",
      derived_from: [],
      construct,
      // Partition: claim-covered (traced) / boundary-relevant (in a file that
      // exercises the declared external stack) / internal (below the
      // supported boundary). 0.4.0 envelopes have no boundary_files, so every
      // changed symbol stays boundary-relevant.
      coverage_status: partitionCoverageStatus(envelope, construct, constructTraces.length),
      provenance: {
        origin: "project",
        actor: "change-author",
        tool: envelope.detector.name,
        revision: envelope.head_revision,
        captured_at: envelope.created_at,
      },
    });
    for (const trace of constructTraces) {
      edges.push({
        id: nextEdgeId(edges),
        edge_type: "implements",
        source_node: implementationId,
        target_node: trace.claim_id,
        rationale: trace.id,
      });
    }
  }

  for (const evidenceEntry of evidence) {
    for (const sourceId of evidenceEntry.derived_from ?? []) {
      edges.push({
        id: nextEdgeId(edges),
        edge_type: "derived_from",
        source_node: evidenceEntry.id,
        target_node: sourceId,
      });
    }
  }

  // Approved waivers for case goals: accepted risk, not correctness evidence.
  // Expiry is evaluated at evaluation time; an expired waiver is invalid.
  const caseGoalIds = new Set(relevantClaims.map((claim) => claim.id));
  for (const exception of exceptions) {
    if (!caseGoalIds.has(exception.goal)) continue;
    nodes.push({
      id: exception.id,
      node_type: "exception",
      label: `Waiver: ${exception.goal}`,
      epistemic_role: "waiver",
      approval_state: exception.status === "rejected" ? "rejected" : "approved",
      derived_from: [],
      status: "approved",
      rationale: `${exception.rationale} (owner: ${exception.owner}, expires: ${exception.expires_at})`,
      expires_at: exception.expires_at,
      provenance: {
        origin: "human",
        actor: exception.owner,
        tool: "exception",
        revision: envelope.head_revision,
        captured_at: envelope.created_at,
      },
    });
    edges.push({
      id: nextEdgeId(edges),
      edge_type: "waives",
      source_node: exception.id,
      target_node: exception.goal,
    });
  }

  for (const [index, contractPath] of envelope.affected_contracts.entries()) {
    nodes.push({
      id: `BND-${String(index + 1).padStart(3, "0")}`,
      node_type: "contract",
      label: contractPath,
      epistemic_role: "descriptive",
      approval_state: "not-applicable",
      derived_from: [],
      provenance: {
        origin: "project",
        actor: "change-author",
        tool: envelope.detector.name,
        revision: envelope.head_revision,
        captured_at: envelope.created_at,
      },
    });
  }

  const capabilities: Record<string, CapabilityStatus> = {
    boundary_discovery: "tool-enforced",
    external_evidence: hasVerifiedExternalEvidence(bookDir, relevantClaims, evidence)
      ? "tool-enforced"
      : "not-evaluated",
    dependency_detection:
      envelope.affected_dependencies.length > 0 ? "tool-enforced" : "not-evaluated",
    contract_detection:
      envelope.affected_contracts.length > 0 ? "tool-enforced" : "not-evaluated",
    contract_compatibility: "not-evaluated",
    consumer_impact: "not-evaluated",
    semantic_entailment: "recorded-attestation",
  };
  const coverage = analyzeCoverage(bookDir, envelope, evidence);
  Object.assign(capabilities, coverage.capabilities);
  // Obligations bind this case's open defeaters to tracking issues. They
  // record that evidence is coming; they do not resolve the defeater.
  const caseDefeaters = new Set(coverage.defeaters);
  const caseObligations = obligations
    .filter((obligation) => caseDefeaters.has(obligation.defeater))
    .map((obligation) => ({
      id: obligation.id,
      defeater: obligation.defeater,
      issue: obligation.issue,
      due_at: obligation.due_at,
      status: obligation.status === "fulfilled" ? ("fulfilled" as const) : ("open" as const),
    }));
  const requiredCapabilities = ["boundary_discovery"];
  if (relevantClaims.length > 0) requiredCapabilities.push("external_evidence");
  if (envelope.affected_dependencies.length > 0) requiredCapabilities.push("dependency_detection");
  if (envelope.affected_contracts.length > 0) {
    requiredCapabilities.push("contract_detection", "contract_compatibility");
  }
  if (envelope.known_consumers.length > 0) requiredCapabilities.push("consumer_impact");
  requiredCapabilities.push(...coverage.requiredCapabilities);

  const assuranceCase: AssuranceCase = {
    schema_version: "0.5.0",
    id: nextCaseArtifactId(bookDir, "CASE"),
    envelope,
    goals: relevantClaims.map((claim) => claim.id),
    nodes,
    edges,
    defeaters: coverage.defeaters,
    capabilities,
    required_capabilities: requiredCapabilities,
    obligations: caseObligations.length > 0 ? caseObligations : undefined,
    created_at: nowIso(),
  };

  const casesDir = join(bookDir, "cases");
  mkdirSync(casesDir, { recursive: true });
  writeFileSync(
    join(casesDir, `${assuranceCase.id}.json`),
    `${JSON.stringify(assuranceCase, null, 2)}\n`,
  );
  return assuranceCase;
}

export function loadAssuranceCase(bookDir: string, idOrPath: string): AssuranceCase {
  const path = existsSync(idOrPath) ? idOrPath : join(bookDir, "cases", `${idOrPath}.json`);
  if (!existsSync(path)) throw new Error(`Assurance case not found: ${idOrPath}`);
  const assuranceCase = JSON.parse(readFileSync(path, "utf8")) as AssuranceCase;
  if (!/^CASE-\d+$/.test(assuranceCase.id)) {
    throw new Error(`Assurance case has invalid id: ${String(assuranceCase.id)}`);
  }
  if (!["0.4.0", "0.5.0"].includes(assuranceCase.schema_version)) {
    throw new Error(`Unsupported assurance case schema: ${String(assuranceCase.schema_version)}`);
  }
  return assuranceCase;
}

function evidenceNode(entry: ExtendedEvidence): AssuranceNode {
  const normative = entry.status === "normative";
  const external = ["vendor-doc", "standard", "source-code"].includes(entry.source_class);
  return {
    id: entry.id,
    node_type: entry.source_class === "experiment" ? "observation" : "contract",
    label: entry.product || entry.source_url || entry.id,
    epistemic_role:
      entry.source_class === "experiment" ? "observation" : normative ? "normative" : "descriptive",
    approval_state:
      !entry.revoked &&
      !entry.superseded_by &&
      normative &&
      ["external", "human-authored", "agent-proposed-human-approved"].includes(entry.independence)
        ? "approved"
        : normative
          ? "rejected"
          : "not-applicable",
    derived_from: entry.derived_from ?? [],
    provenance: {
      origin: entry.source_class === "code-derived" ? "generated" : external ? "external" : "project",
      actor: entry.actor ?? entry.publisher ?? "unknown",
      tool: entry.tool ?? entry.adapter ?? "unknown",
      revision: String(entry.doc_version ?? entry.version ?? "unknown"),
      captured_at: entry.retrieved_at ?? nowIso(),
    },
  };
}

function readEntries<T>(path: string, key: string): T[] {
  if (!existsSync(path)) return [];
  const document = parseYaml(readText(path)) as Record<string, unknown>;
  const entries = document[key];
  return Array.isArray(entries) ? (entries as T[]) : [];
}

/**
 * Classify a changed construct: covered when traced to a claim,
 * boundary-relevant when its defining file exercises the declared external
 * stack, internal otherwise. 0.4.0 envelopes carry no boundary_files, so
 * every changed file counts as boundary-relevant (legacy behavior).
 */
function partitionCoverageStatus(
  envelope: ChangeEnvelope,
  construct: string,
  traceCount: number,
): CoverageStatus {
  if (traceCount > 0) return "covered";
  const boundaryFiles = new Set(envelope.boundary_files ?? envelope.changed_files);
  const file = construct.split("#", 1)[0];
  return boundaryFiles.has(file) ? "gap" : "outside-boundary";
}

function normalizeTier(value: string | undefined): AssuranceNode["risk_tier"] {
  return ["T0", "T1", "T2", "T3"].includes(value ?? "")
    ? (value as AssuranceNode["risk_tier"])
    : undefined;
}

function nextEdgeId(edges: AssuranceEdge[]): string {
  return `EDGE-${String(edges.length + 1).padStart(3, "0")}`;
}

function hasVerifiedExternalEvidence(
  bookDir: string,
  claims: Claim[],
  evidence: ExtendedEvidence[],
): boolean {
  const byId = new Map(evidence.map((entry) => [entry.id, entry]));
  const sources = claims.flatMap((claim) => claim.sources);
  if (sources.length === 0) return false;
  return sources.every((source) => {
    const [sourceId, citedSection] = source.ref.split("#", 2);
    const entry = byId.get(sourceId);
    if (
      !entry ||
      entry.revoked ||
      entry.superseded_by ||
      entry.status !== "normative" ||
      !(entry.doc_version ?? entry.version) ||
      !entry.source_url ||
      !entry.cache_path ||
      !entry.content_digest
    ) {
      return false;
    }
    const cachePath = join(bookDir, entry.cache_path);
    if (!existsSync(cachePath)) return false;
    const content = readText(cachePath);
    return (
      sha256Digest(content) === entry.content_digest &&
      (entry.authority_for ?? []).includes(source.authority_domain) &&
      (!citedSection || content.toLowerCase().includes(citedSection.toLowerCase()))
    );
  });
}
