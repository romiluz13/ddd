import type {
  AssuranceCase,
  AssuranceEdge,
  AssuranceNode,
  AssuranceReport,
  AssuranceViolation,
} from "./assurance-types";
import { nowIso } from "./utils";

const GRAPH_EDGE_TYPES = new Set(["supports", "derived_from"]);
const HARD_VIOLATIONS = new Set([
  "graph-cycle",
  "duplicate-node",
  "duplicate-edge",
  "unknown-node",
  "self-derived-support",
  "descriptive-normative-support",
  "retrospective-baseline",
  "unapproved-normative-source",
  "contradicted-goal",
  "invalid-waiver",
  "invalid-goal",
  "failed-validation",
  "reviewer-not-independent",
]);

export function evaluateAssuranceCase(assuranceCase: AssuranceCase): AssuranceReport {
  const violations: AssuranceViolation[] = [];
  const nodes = new Map(assuranceCase.nodes.map((node) => [node.id, node]));
  const nodeIds = new Set<string>();
  for (const node of assuranceCase.nodes) {
    if (nodeIds.has(node.id)) {
      violations.push({
        type: "duplicate-node",
        node_id: node.id,
        message: `Node id ${node.id} appears more than once.`,
      });
    }
    nodeIds.add(node.id);
  }
  const edgeIds = new Set<string>();
  for (const edge of assuranceCase.edges) {
    if (edgeIds.has(edge.id)) {
      violations.push({
        type: "duplicate-edge",
        edge_id: edge.id,
        message: `Edge id ${edge.id} appears more than once.`,
      });
    }
    edgeIds.add(edge.id);
  }

  for (const edge of assuranceCase.edges) {
    if (!nodes.has(edge.source_node) || !nodes.has(edge.target_node)) {
      violations.push({
        type: "unknown-node",
        edge_id: edge.id,
        message: `Edge ${edge.id} references a node that is not present in the case.`,
      });
    }
  }

  const cycle = findCycle(assuranceCase.edges.filter((edge) => GRAPH_EDGE_TYPES.has(edge.edge_type)));
  if (cycle) {
    violations.push({
      type: "graph-cycle",
      edge_id: cycle.id,
      message: `The support and derivation graph contains a cycle through edge ${cycle.id}.`,
    });
  }

  const approvedExceptions = validateWaivers(assuranceCase, nodes, violations);
  validateSupportAdmissibility(assuranceCase, nodes, violations);
  validateGoals(assuranceCase, nodes, approvedExceptions, violations);
  validateBoundary(assuranceCase, violations);

  if (assuranceCase.defeaters.length > 0) {
    for (const defeater of assuranceCase.defeaters) {
      const tracked = (assuranceCase.obligations ?? []).some(
        (obligation) => obligation.defeater === defeater && obligation.status === "open",
      );
      violations.push({
        type: "unresolved-defeater",
        node_id: defeater,
        message: tracked
          ? `Defeater ${defeater} remains unresolved (tracked by an open obligation).`
          : `Defeater ${defeater} remains unresolved.`,
        resolution: tracked
          ? `Land the evidence behind the tracking issue, or close it: see the obligation issue for ${defeater} in .ddd/obligations.yaml`
          : `Track it against an issue: ddd obligation --defeater ${defeater} --issue <https://...>`,
      });
    }
  }

  const unevaluatedCapabilities = Object.entries(assuranceCase.capabilities)
    .filter(([, status]) => status === "not-evaluated")
    .map(([name]) => name);
  for (const capability of assuranceCase.required_capabilities) {
    if (assuranceCase.capabilities[capability] === "not-evaluated" || !assuranceCase.capabilities[capability]) {
      violations.push({
        type: "unresolved-defeater",
        message: `Required capability ${capability} was not evaluated.`,
      });
    }
  }

  const hasHardViolation = violations.some((violation) => HARD_VIOLATIONS.has(violation.type));
  const verdict = hasHardViolation
    ? "UNSATISFIED"
    : violations.length > 0
      ? "INDETERMINATE"
      : approvedExceptions.length > 0
        ? "WAIVED"
        : "SATISFIED";

  return {
    schema_version: "0.5.0",
    case_id: assuranceCase.id,
    evaluated_at: nowIso(),
    verdict,
    evaluated_boundary: [
      ...assuranceCase.envelope.changed_symbols,
      ...assuranceCase.envelope.affected_dependencies.map((name) => `dependency:${name}`),
      ...(assuranceCase.envelope.affected_services ?? []).map((name) => `service:${name}`),
      ...(assuranceCase.envelope.affected_platforms ?? []).map((name) => `platform:${name}`),
      ...assuranceCase.envelope.affected_contracts.map((path) => `contract:${path}`),
      ...(assuranceCase.envelope.frontend_files ?? []).map((path) => `frontend:${path}`),
      ...assuranceCase.envelope.known_consumers.map((path) => `consumer:${path}`),
    ],
    boundary_confidence: assuranceCase.envelope.boundary_confidence,
    supported_capabilities: Object.entries(assuranceCase.capabilities)
      .filter(([, status]) => status !== "not-evaluated")
      .map(([name]) => name),
    unevaluated_capabilities: unevaluatedCapabilities,
    open_defeaters: assuranceCase.defeaters,
    approved_exceptions: approvedExceptions,
    open_obligations: (assuranceCase.obligations ?? [])
      .filter((obligation) => obligation.status === "open")
      .map((obligation) => obligation.id),
    violations,
  };
}

function validateSupportAdmissibility(
  assuranceCase: AssuranceCase,
  nodes: Map<string, AssuranceNode>,
  violations: AssuranceViolation[],
): void {
  const derivesFrom = buildReachability(
    assuranceCase.edges.filter((edge) => edge.edge_type === "derived_from"),
  );
  const implementationsByGoal = new Map<string, Set<string>>();
  for (const edge of assuranceCase.edges.filter((candidate) => candidate.edge_type === "implements")) {
    const current = implementationsByGoal.get(edge.target_node) ?? new Set<string>();
    current.add(edge.source_node);
    implementationsByGoal.set(edge.target_node, current);
  }

  for (const edge of assuranceCase.edges.filter((candidate) => candidate.edge_type === "supports")) {
    const source = nodes.get(edge.source_node);
    const target = nodes.get(edge.target_node);
    if (!source || !target) continue;

    if (
      target.epistemic_role === "normative" &&
      source.epistemic_role !== "normative"
    ) {
      violations.push({
        type: "descriptive-normative-support",
        node_id: source.id,
        edge_id: edge.id,
        message: `${source.id} is ${source.epistemic_role} and cannot establish normative goal ${target.id}.`,
      });
    }
    if (source.epistemic_role === "normative" && source.approval_state !== "approved") {
      violations.push({
        type: "unapproved-normative-source",
        node_id: source.id,
        edge_id: edge.id,
        message: `Normative source ${source.id} is not approved.`,
      });
    }

    const goalImplementations = implementationsByGoal.get(target.id) ?? new Set<string>();
    const sourceAncestors = derivesFrom.get(source.id) ?? new Set<string>();
    const selfDerived = [...goalImplementations].find((implementation) =>
      sourceAncestors.has(implementation),
    );
    if (selfDerived) {
      violations.push({
        type: "self-derived-support",
        node_id: source.id,
        edge_id: edge.id,
        message: `${source.id} supports ${target.id} but derives from its implementation ${selfDerived}.`,
      });
    }
    if (
      source.provenance.origin === "generated" &&
      source.provenance.revision === assuranceCase.envelope.head_revision &&
      goalImplementations.size > 0
    ) {
      violations.push({
        type: "retrospective-baseline",
        node_id: source.id,
        edge_id: edge.id,
        message: `${source.id} was generated at the evaluated revision and cannot prove that same revision.`,
      });
    }
  }
}

function validateGoals(
  assuranceCase: AssuranceCase,
  nodes: Map<string, AssuranceNode>,
  approvedExceptions: string[],
  violations: AssuranceViolation[],
): void {
  if (assuranceCase.goals.length === 0) {
    violations.push({
      type: "missing-goal",
      message: "The assurance case has no declared goals.",
      resolution: `Declare a claim as a case goal: ddd goal --claim <C-NNN>`,
    });
    return;
  }

  for (const goalId of assuranceCase.goals) {
    if (!nodes.has(goalId)) {
      violations.push({
        type: "missing-goal",
        node_id: goalId,
        message: `Goal ${goalId} is not present in the case graph.`,
      });
      continue;
    }
    const goal = nodes.get(goalId);
    if (
      goal?.epistemic_role !== "normative" ||
      !["requirement", "contract"].includes(goal.node_type)
    ) {
      violations.push({
        type: "invalid-goal",
        node_id: goalId,
        message: `Goal ${goalId} must be a normative requirement or contract.`,
      });
      continue;
    }
    const contradicted = assuranceCase.edges.some(
      (edge) => edge.edge_type === "contradicts" && edge.target_node === goalId,
    );
    if (contradicted) {
      violations.push({
        type: "contradicted-goal",
        node_id: goalId,
        message: `Goal ${goalId} is contradicted.`,
      });
      continue;
    }
    const supported = assuranceCase.edges.some(
      (edge) => edge.edge_type === "supports" && edge.target_node === goalId,
    );
    const waived = assuranceCase.edges.some(
      (edge) =>
        edge.edge_type === "waives" &&
        edge.target_node === goalId &&
        approvedExceptions.includes(edge.source_node),
    );
    if (!supported && !waived) {
      violations.push({
        type: "unsupported-goal",
        node_id: goalId,
        message: `Goal ${goalId} has neither admissible support nor an approved waiver.`,
        resolution: `Record a verified kernel source for claim ${goalId} (ddd claim --source EL-NNN[#section] ...), or accept the residual risk: ddd exception --goal ${goalId} --rationale "<accepted risk>" --owner <name> --expires <future ISO date>`,
      });
    }
    const effectiveTier = maxRiskTier(
      goal?.risk_tier,
      envelopeRiskTier(assuranceCase.envelope.risk),
    );
    if (["T2", "T3"].includes(effectiveTier) && !waived) {
      const validations = assuranceCase.edges
        .filter((edge) => edge.edge_type === "validates" && edge.target_node === goalId)
        .map((edge) => nodes.get(edge.source_node))
        .filter((node): node is AssuranceNode => Boolean(node));
      if (validations.some((node) => node.validation_result === "fail")) {
        violations.push({
          type: "failed-validation",
          node_id: goalId,
          message: `Goal ${goalId} has a failed required validation.`,
        });
      } else if (!validations.some((node) => node.validation_result === "pass")) {
        violations.push({
          type: "missing-validation",
          node_id: goalId,
          message: `Goal ${goalId} requires a passing validation for tier ${effectiveTier}.`,
          resolution: `Run the check, then record it: ddd validation --claim ${goalId} --construct <symbol> --method <test|lint|type-check|formal|manual|runtime-assertion> --target <file>`,
        });
      }
    }
    if (effectiveTier === "T3") {
      if (!assuranceCase.implementer_id || !assuranceCase.reviewer_id) {
        violations.push({
          type: "missing-reviewer-independence",
          node_id: goalId,
          message: `T3 goal ${goalId} does not record implementer and reviewer identities.`,
        });
      } else if (assuranceCase.implementer_id === assuranceCase.reviewer_id) {
        violations.push({
          type: "reviewer-not-independent",
          node_id: goalId,
          message: `T3 goal ${goalId} was reviewed by its implementer.`,
        });
      }
    }
  }
}

function envelopeRiskTier(risk: AssuranceCase["envelope"]["risk"]): string {
  return { low: "T0", medium: "T1", high: "T2", critical: "T3" }[risk] ?? "T1";
}

function maxRiskTier(left: string | undefined, right: string): string {
  const rank: Record<string, number> = { T0: 0, T1: 1, T2: 2, T3: 3 };
  const normalizedLeft = left && left in rank ? left : "T1";
  return rank[normalizedLeft] >= rank[right] ? normalizedLeft : right;
}

function validateBoundary(
  assuranceCase: AssuranceCase,
  violations: AssuranceViolation[],
): void {
  const linkedImplementations = new Set(
    assuranceCase.edges
      .filter(
        (edge) =>
          edge.edge_type === "implements" && assuranceCase.goals.includes(edge.target_node),
      )
      .map((edge) => edge.source_node),
  );
  const covered = new Set(
    assuranceCase.nodes
      .filter(
        (node) =>
          node.node_type === "implementation" &&
          node.construct &&
          ["covered", "exempt", "grandfathered", "outside-boundary"].includes(
            node.coverage_status ?? "",
          ),
      )
      .map((node) => node.construct as string),
  );
  const excluded = new Set(assuranceCase.envelope.exclusions.map((exclusion) => exclusion.construct));
  for (const construct of assuranceCase.envelope.changed_symbols) {
    if (!covered.has(construct) && !excluded.has(construct)) {
      violations.push({
        type: "uncovered-construct",
        construct,
        message: `Changed construct ${construct} is not accounted for in the assurance case. Rule: every boundary-relevant changed construct must trace to a claim (or carry an envelope exclusion); internal constructs are reported as outside-boundary.`,
        resolution: `Claim it and trace it: ddd claim "<statement>" --source EL-NNN ... --construct ${construct}, then ddd trace <C-NNN> ${construct}`,
      });
    }
  }
  for (const node of assuranceCase.nodes.filter(
    (candidate) =>
      candidate.node_type === "implementation" &&
      candidate.coverage_status === "covered" &&
      !linkedImplementations.has(candidate.id),
  )) {
    violations.push({
      type: "unlinked-implementation",
      node_id: node.id,
      construct: node.construct,
      message: `Covered implementation ${node.id} has no implements edge to a case goal.`,
    });
  }
  if (assuranceCase.envelope.boundary_confidence !== "complete") {
    violations.push({
      type: "uncovered-construct",
      message: `Impact boundary confidence is ${assuranceCase.envelope.boundary_confidence}.`,
    });
  }
}

function validateWaivers(
  assuranceCase: AssuranceCase,
  nodes: Map<string, AssuranceNode>,
  violations: AssuranceViolation[],
): string[] {
  const approved: string[] = [];
  for (const edge of assuranceCase.edges.filter((candidate) => candidate.edge_type === "waives")) {
    const source = nodes.get(edge.source_node);
    const target = nodes.get(edge.target_node);
    const expiresAt = source?.expires_at ? Date.parse(source.expires_at) : Number.NaN;
    const valid =
      source?.node_type === "exception" &&
      source.epistemic_role === "waiver" &&
      source.approval_state === "approved" &&
      source.status === "approved" &&
      source.provenance.origin === "human" &&
      Boolean(source.rationale?.trim()) &&
      Boolean(source.expires_at) &&
      !Number.isNaN(expiresAt) &&
      expiresAt > Date.now() &&
      Boolean(target) &&
      assuranceCase.goals.includes(edge.target_node);
    if (valid) {
      if (!approved.includes(source.id)) approved.push(source.id);
    } else {
      const expired = !Number.isNaN(expiresAt) && expiresAt <= Date.now();
      violations.push({
        type: "invalid-waiver",
        node_id: source?.id,
        edge_id: edge.id,
        message: expired
          ? `Waiver ${source?.id} on goal ${edge.target_node} expired on ${source?.expires_at}; the accepted risk has lapsed.`
          : `Waiver edge ${edge.id} does not have an approved, time-boxed, human-authored exception with rationale.`,
        resolution: expired
          ? `Renew or drop the waiver: ddd exception --goal ${edge.target_node} --rationale "<accepted risk>" --owner <name> --expires <future ISO date>`
          : `Record a proper waiver: ddd exception --goal ${edge.target_node} --rationale "<accepted risk>" --owner <name> --expires <future ISO date>`,
      });
    }
  }
  return approved;
}

function buildReachability(edges: AssuranceEdge[]): Map<string, Set<string>> {
  const outgoing = new Map<string, string[]>();
  for (const edge of edges) {
    const current = outgoing.get(edge.source_node) ?? [];
    current.push(edge.target_node);
    outgoing.set(edge.source_node, current);
  }

  const result = new Map<string, Set<string>>();
  for (const start of outgoing.keys()) {
    const reachable = new Set<string>();
    const stack = [...(outgoing.get(start) ?? [])];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (reachable.has(current)) continue;
      reachable.add(current);
      stack.push(...(outgoing.get(current) ?? []));
    }
    result.set(start, reachable);
  }
  return result;
}

function findCycle(edges: AssuranceEdge[]): AssuranceEdge | null {
  const outgoing = new Map<string, AssuranceEdge[]>();
  for (const edge of edges) {
    const current = outgoing.get(edge.source_node) ?? [];
    current.push(edge);
    outgoing.set(edge.source_node, current);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(nodeId: string): AssuranceEdge | null {
    if (visiting.has(nodeId)) return { id: "unknown", edge_type: "supports", source_node: nodeId, target_node: nodeId };
    if (visited.has(nodeId)) return null;
    visiting.add(nodeId);
    for (const edge of outgoing.get(nodeId) ?? []) {
      if (visiting.has(edge.target_node)) return edge;
      const nested = visit(edge.target_node);
      if (nested) return nested;
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
    return null;
  }

  for (const nodeId of outgoing.keys()) {
    const cycle = visit(nodeId);
    if (cycle) return cycle;
  }
  return null;
}
