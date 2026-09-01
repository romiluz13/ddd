import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import type { CapabilityStatus, ChangeEnvelope } from "./assurance-types";
import { parseYaml, readText, sha256Digest } from "./utils";

interface EvidenceReference {
  id: string;
  ref?: string;
  source?: string;
  source_url?: string;
  subject?: string;
  version?: string;
  cache_path?: string;
  content_digest?: string;
  revoked?: boolean;
  superseded_by?: string | null;
}

interface StackComponent {
  kind: "dependency" | "service" | "platform" | "frontend";
  name: string;
  versions?: string[];
  evidence_refs?: string[];
  required_constraints?: string[];
  constraints?: Array<{ name: string; evidence_refs?: string[] }>;
}

interface InteractionRecord {
  components?: string[];
  status?: string;
  rationale?: string;
}

interface ExternalReference {
  id: string;
  source: string;
}

export interface CoverageAnalysis {
  capabilities: Record<string, CapabilityStatus>;
  requiredCapabilities: string[];
  defeaters: string[];
}

export function analyzeCoverage(
  bookDir: string,
  envelope: ChangeEnvelope,
  evidence: EvidenceReference[],
): CoverageAnalysis {
  const components = readStackComponents(bookDir);
  const evidenceById = new Map(evidence.map((entry) => [entry.id, entry]));
  const expectedByKey = new Map<string, StackComponent>();
  for (const component of [...expectedComponents(envelope), ...components]) {
    const key = componentKey(component);
    if (!expectedByKey.has(key)) expectedByKey.set(key, component);
  }
  const expected = [...expectedByKey.values()];
  const missing = expected.filter((item) => {
    const component = components.find(
      (candidate) => candidate.kind === item.kind && candidate.name === item.name,
    );
    return (
      !component ||
      !(component.evidence_refs?.length) ||
      !versionsMatch(item.versions, component.versions) ||
      component.evidence_refs.some((id) => {
        const entry = evidenceById.get(id);
        return (
          !isVerifiedEvidence(bookDir, entry) ||
          entry?.subject !== component.name ||
          (component.versions?.length && !component.versions.includes(entry.version ?? ""))
        );
      }) ||
      (item.versions?.some(
        (version) =>
          !component.evidence_refs?.some((id) => {
            const entry = evidenceById.get(id);
            return (
              isVerifiedEvidence(bookDir, entry) &&
              entry?.subject === component.name &&
              entry.version === version
            );
          }),
      ) ??
        false)
    );
  });

  const platforms = expected.filter((item) => item.kind === "platform");
  const missingConstraints = platforms.filter((item) => {
    const component = components.find(
      (candidate) => candidate.kind === item.kind && candidate.name === item.name,
    );
    if (!component?.required_constraints?.length || !component.constraints?.length) {
      return true;
    }
    return component.required_constraints.some((constraintName) => {
      const constraint = component.constraints?.find(
        (candidate) => candidate.name === constraintName,
      );
      return (
        !constraint?.evidence_refs?.length ||
        constraint.evidence_refs.some((id) => {
          const entry = evidenceById.get(id);
          return (
            !isVerifiedEvidence(bookDir, entry) ||
            entry?.subject !== component.name
          );
        })
      );
    });
  });

  const externalReferences = readExternalReferences(bookDir);
  const missingReferences = externalReferences.filter((reference) => {
    return !evidence.some(
      (entry) =>
        isVerifiedEvidence(bookDir, entry) &&
        entry.ref === reference.id &&
        urlsRelated(entry.source ?? entry.source_url ?? "", reference.source),
    );
  });
  const gaps = readOpenGaps(bookDir);
  const hasKnowledgeMap = existsSync(join(bookDir, "knowledge-map.yaml"));
  const expectedInteractionPairs = crossKindPairs(expected);
  const interactions = readInteractions(bookDir);
  const missingInteractions = expectedInteractionPairs.filter(
    ([left, right]) => !hasInteraction(interactions, left, right),
  );
  const frontendExpected = expected.filter((item) => item.kind === "frontend");
  const missingFrontend = missing.filter((item) => item.kind === "frontend");

  const requiredCapabilities: string[] = [];
  if (expected.length > 0) requiredCapabilities.push("stack_coverage");
  if (externalReferences.length > 0) {
    requiredCapabilities.push("reference_evidence_completeness");
  }
  if (existsSync(join(bookDir, "knowledge-map.yaml"))) {
    requiredCapabilities.push("gap_resolution");
  }
  if (platforms.length > 0) requiredCapabilities.push("platform_constraints");
  if (frontendExpected.length > 0) requiredCapabilities.push("frontend_coverage");
  if (expectedInteractionPairs.length > 0) requiredCapabilities.push("interaction_analysis");

  return {
    capabilities: {
      stack_coverage:
        expected.length === 0
          ? "not-evaluated"
          : missing.length === 0
            ? "tool-enforced"
            : "not-evaluated",
      reference_evidence_completeness:
        externalReferences.length === 0
          ? "not-evaluated"
          : missingReferences.length === 0
          ? "tool-enforced"
          : "not-evaluated",
      gap_resolution: !hasKnowledgeMap
        ? "not-evaluated"
        : gaps.length === 0
          ? "tool-enforced"
          : "not-evaluated",
      platform_constraints:
        platforms.length === 0
          ? "not-evaluated"
          : missingConstraints.length === 0
          ? "recorded-attestation"
          : "not-evaluated",
      frontend_coverage:
        frontendExpected.length === 0
          ? "not-evaluated"
          : missingFrontend.length === 0
          ? "tool-enforced"
          : "not-evaluated",
      interaction_analysis:
        expectedInteractionPairs.length === 0
          ? "not-evaluated"
          : missingInteractions.length === 0
          ? "recorded-attestation"
          : "not-evaluated",
    },
    requiredCapabilities,
    defeaters: [
      ...missing.map((item) => `stack:${item.kind}:${item.name}`),
      ...missingReferences.map((reference) => `reference:${reference.id}`),
      ...gaps.map((gap) => `gap:${gap.domain}:${gap.description}`),
      ...missingConstraints.map((item) => `constraint:${item.kind}:${item.name}`),
      ...missingInteractions.map(([left, right]) => `interaction:${left}+${right}`),
    ],
  };
}

function expectedComponents(envelope: ChangeEnvelope): StackComponent[] {
  const dependencies = new Set([
    ...(envelope.declared_dependencies ?? []),
    ...(envelope.affected_dependencies ?? []),
  ]);
  return [
    ...[...dependencies].map((name) => ({
      kind: "dependency" as const,
      name,
      versions: envelope.declared_dependency_versions?.[name],
    })),
    ...(envelope.affected_services ?? []).map((name) => ({ kind: "service" as const, name })),
    ...(envelope.affected_platforms ?? []).map((name) => ({ kind: "platform" as const, name })),
    ...((envelope.frontend_files ?? []).length > 0
      ? [{ kind: "frontend" as const, name: "frontend" }]
      : []),
  ];
}

function versionsMatch(expected?: string[], recorded?: string[]): boolean {
  if (!expected?.length) return true;
  if (!recorded?.length) return false;
  return [...expected].sort().join("\0") === [...recorded].sort().join("\0");
}

function readStackComponents(bookDir: string): StackComponent[] {
  const path = join(bookDir, "stack.yaml");
  if (!existsSync(path)) return [];
  const document = parseYaml(readText(path)) as Record<string, unknown>;
  return Array.isArray(document.components) ? (document.components as StackComponent[]) : [];
}

function readExternalReferences(bookDir: string): ExternalReference[] {
  const path = join(bookDir, "book.yaml");
  if (!existsSync(path)) return [];
  const document = parseYaml(readText(path)) as Record<string, unknown>;
  if (!Array.isArray(document.references)) return [];
  return (document.references as Array<Record<string, unknown>>)
    .filter(
      (reference) =>
        reference.type === "external" &&
        typeof reference.id === "string" &&
        typeof reference.source === "string",
    )
    .map((reference) => ({
      id: String(reference.id),
      source: String(reference.source),
    }));
}

function readOpenGaps(bookDir: string): Array<{ domain: string; description: string }> {
  const path = join(bookDir, "knowledge-map.yaml");
  if (!existsSync(path)) return [];
  const document = parseYaml(readText(path)) as Record<string, unknown>;
  const gaps: Array<{ domain: string; description: string }> = [];
  const recordedGaps = Array.isArray(document.gaps)
    ? (document.gaps as Array<Record<string, unknown>>)
    : [];
  const resolvedGaps = new Set(
    recordedGaps
      .filter((gap) => gap.status === "resolved")
      .map((gap) => `${String(gap.domain ?? "overall")}\0${String(gap.description)}`),
  );
  if (Array.isArray(document.domains)) {
    for (const domain of document.domains as Array<Record<string, unknown>>) {
      if (!Array.isArray(domain.gaps)) continue;
      for (const gap of domain.gaps) {
        const description =
          typeof gap === "object" && gap !== null
            ? String((gap as Record<string, unknown>).description ?? gap)
            : String(gap);
        const domainId = String(domain.id ?? domain.name ?? "unknown");
        if (resolvedGaps.has(`${domainId}\0${description}`)) continue;
        gaps.push({ domain: domainId, description });
      }
    }
  }
  if (Array.isArray(document.overall_gaps)) {
    for (const gap of document.overall_gaps) {
      const description = String(gap);
      if (!resolvedGaps.has(`overall\0${description}`)) {
        gaps.push({ domain: "overall", description });
      }
    }
  }
  for (const gap of recordedGaps) {
    if (gap.status === "resolved") continue;
    gaps.push({
      domain: String(gap.domain ?? "overall"),
      description: String(gap.description ?? "Unspecified gap"),
    });
  }
  return gaps;
}

function readInteractions(bookDir: string): InteractionRecord[] {
  const path = join(bookDir, "interactions.yaml");
  if (!existsSync(path)) return [];
  const document = parseYaml(readText(path)) as Record<string, unknown>;
  return Array.isArray(document.interactions)
    ? (document.interactions as InteractionRecord[])
    : [];
}

function crossKindPairs(components: StackComponent[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (let left = 0; left < components.length; left++) {
    for (let right = left + 1; right < components.length; right++) {
      if (components[left].kind === components[right].kind) continue;
      pairs.push([componentKey(components[left]), componentKey(components[right])]);
    }
  }
  return pairs;
}

function hasInteraction(
  interactions: InteractionRecord[],
  left: string,
  right: string,
): boolean {
  return interactions.some((interaction) => {
    const components = new Set(interaction.components ?? []);
    return (
      interaction.status === "analyzed" &&
      Boolean(interaction.rationale?.trim()) &&
      components.has(left) &&
      components.has(right)
    );
  });
}

function componentKey(component: StackComponent): string {
  return `${component.kind}:${component.name}`;
}

function urlsRelated(left: string, right: string): boolean {
  const normalizedLeft = left.replace(/\/index\.md$/, "").replace(/\/+$/, "");
  const normalizedRight = right.replace(/\/index\.md$/, "").replace(/\/+$/, "");
  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.startsWith(`${normalizedRight}/`) ||
    normalizedRight.startsWith(`${normalizedLeft}/`)
  );
}

function isVerifiedEvidence(
  bookDir: string,
  entry: EvidenceReference | undefined,
): boolean {
  if (
    !entry ||
    entry.revoked ||
    entry.superseded_by ||
    !entry.cache_path ||
    !entry.content_digest
  ) {
    return false;
  }
  const cachePath = entry.cache_path.startsWith(".ddd/")
    ? join(dirname(bookDir), entry.cache_path)
    : join(bookDir, entry.cache_path);
  if (!existsSync(cachePath)) return false;
  const expected = entry.content_digest.startsWith("sha256:")
    ? entry.content_digest
    : `sha256:${entry.content_digest}`;
  return sha256Digest(readText(cachePath)) === expected;
}
