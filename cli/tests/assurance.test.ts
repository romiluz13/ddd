import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { evaluateAssuranceCase } from "../src/assurance";
import type { AssuranceCase } from "../src/assurance-types";
import { buildAssuranceCase, loadAssuranceCase } from "../src/build-case";
import { loadChangeEnvelope, scopeChange } from "../src/scope-change";
import { sha256Hex } from "../src/utils";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function baseCase(overrides: Partial<AssuranceCase> = {}): AssuranceCase {
  return {
    schema_version: "0.4.0",
    id: "CASE-001",
    envelope: {
      schema_version: "0.4.0",
      id: "ENV-001",
      base_revision: "base",
      head_revision: "head",
      changed_files: ["src/widget.ts"],
      changed_symbols: ["src/widget.ts#createWidget"],
      declared_dependencies: [],
      affected_dependencies: [],
      affected_services: [],
      affected_platforms: [],
      affected_contracts: [],
      frontend_files: [],
      known_consumers: [],
      risk: "medium",
      owner: null,
      exclusions: [],
      boundary_confidence: "complete",
      detector: { name: "test", version: "1" },
      created_at: "2026-08-31T00:00:00.000Z",
    },
    goals: ["REQ-001"],
    nodes: [
      {
        id: "CON-001",
        node_type: "contract",
        label: "Widget API v2",
        epistemic_role: "normative",
        approval_state: "approved",
        derived_from: [],
        provenance: {
          origin: "external",
          actor: "vendor",
          tool: "lock",
          revision: "2.0.0",
          captured_at: "2026-08-31T00:00:00.000Z",
        },
      },
      {
        id: "REQ-001",
        node_type: "requirement",
        label: "Use createWidget from v2",
        epistemic_role: "normative",
        approval_state: "approved",
        derived_from: [],
        risk_tier: "T1",
        provenance: {
          origin: "project",
          actor: "author",
          tool: "claim",
          revision: "head",
          captured_at: "2026-08-31T00:00:00.000Z",
        },
      },
      {
        id: "IMP-001",
        node_type: "implementation",
        label: "createWidget implementation",
        epistemic_role: "implementation",
        approval_state: "not-applicable",
        derived_from: [],
        construct: "src/widget.ts#createWidget",
        coverage_status: "covered",
        provenance: {
          origin: "project",
          actor: "author",
          tool: "git",
          revision: "head",
          captured_at: "2026-08-31T00:00:00.000Z",
        },
      },
    ],
    edges: [
      {
        id: "EDGE-001",
        edge_type: "supports",
        source_node: "CON-001",
        target_node: "REQ-001",
      },
      {
        id: "EDGE-002",
        edge_type: "implements",
        source_node: "IMP-001",
        target_node: "REQ-001",
      },
    ],
    defeaters: [],
    capabilities: {
      boundary_discovery: "tool-enforced",
      external_evidence: "tool-enforced",
      internal_contracts: "not-evaluated",
      semantic_entailment: "recorded-attestation",
    },
    required_capabilities: ["boundary_discovery", "external_evidence"],
    created_at: "2026-08-31T00:00:00.000Z",
    ...overrides,
  };
}

describe("assurance policy evaluator", () => {
  test("rejects a cycle in the support and derivation graph", () => {
    const assuranceCase = baseCase();
    assuranceCase.edges.push({
      id: "EDGE-003",
      edge_type: "derived_from",
      source_node: "REQ-001",
      target_node: "CON-001",
    });

    const report = evaluateAssuranceCase(assuranceCase);

    expect(report.verdict).toBe("UNSATISFIED");
    expect(report.violations.map((violation) => violation.type)).toContain("graph-cycle");
  });

  test("rejects duplicate graph identities", () => {
    const assuranceCase = baseCase();
    assuranceCase.nodes.push({ ...assuranceCase.nodes[0] });
    assuranceCase.edges.push({ ...assuranceCase.edges[0] });

    const report = evaluateAssuranceCase(assuranceCase);

    expect(report.verdict).toBe("UNSATISFIED");
    expect(report.violations.map((violation) => violation.type)).toContain("duplicate-node");
    expect(report.violations.map((violation) => violation.type)).toContain("duplicate-edge");
  });

  test("rejects evidence derived from the implementation it supports", () => {
    const assuranceCase = baseCase();
    assuranceCase.nodes[0].provenance.origin = "generated";
    assuranceCase.nodes[0].provenance.revision = "head";
    assuranceCase.nodes[0].derived_from = ["IMP-001"];
    assuranceCase.edges.push({
      id: "EDGE-003",
      edge_type: "derived_from",
      source_node: "CON-001",
      target_node: "IMP-001",
    });

    const report = evaluateAssuranceCase(assuranceCase);

    expect(report.verdict).toBe("UNSATISFIED");
    expect(report.violations.map((violation) => violation.type)).toContain("self-derived-support");
    expect(report.violations.map((violation) => violation.type)).toContain("retrospective-baseline");
  });

  test("does not let descriptive evidence terminate a normative support chain", () => {
    const assuranceCase = baseCase();
    assuranceCase.nodes[0].epistemic_role = "descriptive";
    assuranceCase.nodes[0].approval_state = "not-applicable";

    const report = evaluateAssuranceCase(assuranceCase);

    expect(report.verdict).toBe("UNSATISFIED");
    expect(report.violations.map((violation) => violation.type)).toContain(
      "descriptive-normative-support",
    );
  });

  test("does not let a validation establish normative intent", () => {
    const assuranceCase = baseCase();
    assuranceCase.nodes[0].epistemic_role = "validation";
    assuranceCase.nodes[0].approval_state = "not-applicable";

    const report = evaluateAssuranceCase(assuranceCase);

    expect(report.verdict).toBe("UNSATISFIED");
    expect(report.violations.map((violation) => violation.type)).toContain(
      "descriptive-normative-support",
    );
  });

  test("returns indeterminate when the changed-symbol boundary is incomplete", () => {
    const assuranceCase = baseCase();
    assuranceCase.envelope.changed_symbols.push("src/widget.ts#deleteWidget");

    const report = evaluateAssuranceCase(assuranceCase);

    expect(report.verdict).toBe("INDETERMINATE");
    expect(report.violations).toContainEqual(
      expect.objectContaining({
        type: "uncovered-construct",
        construct: "src/widget.ts#deleteWidget",
      }),
    );
  });

  test("does not trust a covered label without an implements edge", () => {
    const assuranceCase = baseCase();
    assuranceCase.edges = assuranceCase.edges.filter((edge) => edge.edge_type !== "implements");

    const report = evaluateAssuranceCase(assuranceCase);

    expect(report.verdict).toBe("INDETERMINATE");
    expect(report.violations.map((violation) => violation.type)).toContain(
      "unlinked-implementation",
    );
  });

  test("returns waived only for an explicitly approved goal waiver", () => {
    const assuranceCase = baseCase();
    assuranceCase.edges = assuranceCase.edges.filter((edge) => edge.edge_type !== "supports");
    assuranceCase.nodes.push({
      id: "EXC-001",
      node_type: "exception",
      label: "Accept unsupported Widget API claim",
      epistemic_role: "waiver",
      approval_state: "approved",
      derived_from: [],
      status: "approved",
      rationale: "Temporary vendor documentation gap accepted by release owner",
      expires_at: "2999-12-31",
      provenance: {
        origin: "human",
        actor: "release-owner",
        tool: "manual-approval",
        revision: "head",
        captured_at: "2026-08-31T00:00:00.000Z",
      },
    });
    assuranceCase.edges.push({
      id: "EDGE-003",
      edge_type: "waives",
      source_node: "EXC-001",
      target_node: "REQ-001",
    });

    const report = evaluateAssuranceCase(assuranceCase);

    expect(report.verdict).toBe("WAIVED");
    expect(report.approved_exceptions).toEqual(["EXC-001"]);
  });

  test("waives an unevaluated required capability via an unexpired capability waiver", () => {
    const assuranceCase = baseCase({
      required_capabilities: ["boundary_discovery", "external_evidence", "consumer_impact"],
      capabilities: {
        boundary_discovery: "tool-enforced",
        external_evidence: "tool-enforced",
        consumer_impact: "not-evaluated",
        internal_contracts: "not-evaluated",
        semantic_entailment: "recorded-attestation",
      },
      capability_waivers: [
        {
          capability: "consumer_impact",
          exception: "EXC-009",
          owner: "release-owner",
          expires_at: "2999-12-31",
        },
      ],
    });

    const report = evaluateAssuranceCase(assuranceCase);

    // Recorded risk, never correctness: the verdict is WAIVED, not SATISFIED.
    expect(report.verdict).toBe("WAIVED");
    expect(report.approved_exceptions).toEqual(["EXC-009"]);
    expect(report.violations).toEqual([]);
  });

  test("rejects an expired capability waiver with the renewal path named", () => {
    const assuranceCase = baseCase({
      required_capabilities: ["boundary_discovery", "external_evidence", "consumer_impact"],
      capabilities: {
        boundary_discovery: "tool-enforced",
        external_evidence: "tool-enforced",
        consumer_impact: "not-evaluated",
        internal_contracts: "not-evaluated",
        semantic_entailment: "recorded-attestation",
      },
      capability_waivers: [
        {
          capability: "consumer_impact",
          exception: "EXC-009",
          owner: "release-owner",
          expires_at: "2000-01-01",
        },
      ],
    });

    const report = evaluateAssuranceCase(assuranceCase);

    expect(report.verdict).toBe("INDETERMINATE");
    expect(report.approved_exceptions).toEqual([]);
    expect(report.violations).toContainEqual(
      expect.objectContaining({
        type: "unresolved-defeater",
        message: expect.stringContaining("consumer_impact was not evaluated and its waiver expired"),
        resolution: expect.stringContaining("ddd exception --capability consumer_impact"),
      }),
    );
  });

  test("keeps an obligation-tracked capability indeterminate with an honest message", () => {
    const assuranceCase = baseCase({
      required_capabilities: ["boundary_discovery", "external_evidence", "consumer_impact"],
      capabilities: {
        boundary_discovery: "tool-enforced",
        external_evidence: "tool-enforced",
        consumer_impact: "not-evaluated",
        internal_contracts: "not-evaluated",
        semantic_entailment: "recorded-attestation",
      },
      obligations: [
        {
          id: "OB-001",
          defeater: "capability:consumer_impact",
          issue: "https://github.com/org/repo/issues/20",
          status: "open",
        },
      ],
    });

    const report = evaluateAssuranceCase(assuranceCase);

    expect(report.verdict).toBe("INDETERMINATE");
    expect(report.open_obligations).toEqual(["OB-001"]);
    expect(report.violations).toContainEqual(
      expect.objectContaining({
        type: "unresolved-defeater",
        message: expect.stringContaining("tracked by an open obligation"),
      }),
    );
  });

  test("names every resolution path for an untracked unevaluated capability", () => {
    const assuranceCase = baseCase({
      required_capabilities: ["boundary_discovery", "external_evidence", "consumer_impact"],
      capabilities: {
        boundary_discovery: "tool-enforced",
        external_evidence: "tool-enforced",
        consumer_impact: "not-evaluated",
        internal_contracts: "not-evaluated",
        semantic_entailment: "recorded-attestation",
      },
    });

    const report = evaluateAssuranceCase(assuranceCase);

    expect(report.verdict).toBe("INDETERMINATE");
    expect(report.violations).toContainEqual(
      expect.objectContaining({
        type: "unresolved-defeater",
        resolution: expect.stringContaining("ddd obligation --defeater capability:consumer_impact"),
      }),
    );
    expect(report.violations).toContainEqual(
      expect.objectContaining({
        type: "unresolved-defeater",
        resolution: expect.stringContaining("ddd exception --capability consumer_impact"),
      }),
    );
  });

  test("rejects an expired or untime-boxed waiver", () => {
    const assuranceCase = baseCase();
    assuranceCase.edges = assuranceCase.edges.filter((edge) => edge.edge_type !== "supports");
    assuranceCase.nodes.push(
      {
        id: "EXC-001",
        node_type: "exception",
        label: "Expired waiver",
        epistemic_role: "waiver",
        approval_state: "approved",
        derived_from: [],
        status: "approved",
        rationale: "Accepted risk whose time box has lapsed",
        expires_at: "2000-01-01",
        provenance: {
          origin: "human",
          actor: "release-owner",
          tool: "manual-approval",
          revision: "head",
          captured_at: "1999-12-31T00:00:00.000Z",
        },
      },
      {
        id: "EXC-002",
        node_type: "exception",
        label: "Waiver without a time box",
        epistemic_role: "waiver",
        approval_state: "approved",
        derived_from: [],
        status: "approved",
        rationale: "Accepted risk with no expiry recorded",
        provenance: {
          origin: "human",
          actor: "release-owner",
          tool: "manual-approval",
          revision: "head",
          captured_at: "2026-08-31T00:00:00.000Z",
        },
      },
    );
    assuranceCase.edges.push(
      {
        id: "EDGE-003",
        edge_type: "waives",
        source_node: "EXC-001",
        target_node: "REQ-001",
      },
      {
        id: "EDGE-004",
        edge_type: "waives",
        source_node: "EXC-002",
        target_node: "REQ-001",
      },
    );

    const report = evaluateAssuranceCase(assuranceCase);

    expect(report.verdict).toBe("UNSATISFIED");
    expect(report.approved_exceptions).toEqual([]);
    expect(report.violations).toContainEqual(
      expect.objectContaining({
        type: "invalid-waiver",
        node_id: "EXC-001",
        resolution: expect.stringContaining("ddd exception --goal REQ-001"),
      }),
    );
    expect(report.violations).toContainEqual(
      expect.objectContaining({ type: "invalid-waiver", node_id: "EXC-002" }),
    );
  });

  test("rejects a waiver aimed at a non-goal node", () => {
    const assuranceCase = baseCase();
    assuranceCase.nodes.push({
      id: "EXC-001",
      node_type: "exception",
      label: "Accept implementation risk",
      epistemic_role: "waiver",
      approval_state: "approved",
      derived_from: [],
      status: "approved",
      rationale: "Release owner accepted the implementation risk",
      provenance: {
        origin: "human",
        actor: "release-owner",
        tool: "manual-approval",
        revision: "head",
        captured_at: "2026-08-31T00:00:00.000Z",
      },
    });
    assuranceCase.edges.push({
      id: "EDGE-003",
      edge_type: "waives",
      source_node: "EXC-001",
      target_node: "IMP-001",
    });

    const report = evaluateAssuranceCase(assuranceCase);

    expect(report.verdict).toBe("UNSATISFIED");
    expect(report.violations.map((violation) => violation.type)).toContain("invalid-waiver");
  });

  test("returns satisfied for supported goals inside a complete boundary", () => {
    const assuranceCase = baseCase();
    assuranceCase.envelope.affected_services = ["api.example.com"];
    assuranceCase.envelope.affected_platforms = ["cloudflare-workers"];
    assuranceCase.envelope.frontend_files = ["src/App.tsx"];
    const report = evaluateAssuranceCase(assuranceCase);

    expect(report.verdict).toBe("SATISFIED");
    expect(report.violations).toEqual([]);
    expect(report.evaluated_boundary).toEqual(
      expect.arrayContaining([
        "service:api.example.com",
        "platform:cloudflare-workers",
        "frontend:src/App.tsx",
      ]),
    );
  });

  test("requires passing validation for a T2 goal", () => {
    const assuranceCase = baseCase();
    assuranceCase.nodes.find((node) => node.id === "REQ-001")!.risk_tier = "T2";

    const report = evaluateAssuranceCase(assuranceCase);

    expect(report.verdict).toBe("INDETERMINATE");
    expect(report.violations.map((violation) => violation.type)).toContain("missing-validation");
  });

  test("does not let a persisted goal tier understate critical envelope risk", () => {
    const assuranceCase = baseCase();
    assuranceCase.envelope.risk = "critical";

    const report = evaluateAssuranceCase(assuranceCase);

    expect(report.verdict).toBe("INDETERMINATE");
    expect(report.violations.map((violation) => violation.type)).toContain("missing-validation");
    expect(report.violations.map((violation) => violation.type)).toContain(
      "missing-reviewer-independence",
    );
  });

  test("keeps a T3 goal indeterminate until reviewer independence is recorded", () => {
    const assuranceCase = baseCase();
    assuranceCase.nodes.find((node) => node.id === "REQ-001")!.risk_tier = "T3";
    assuranceCase.nodes.push({
      id: "VAL-001",
      node_type: "validation",
      label: "Widget contract test",
      epistemic_role: "validation",
      approval_state: "not-applicable",
      derived_from: [],
      validation_result: "pass",
      provenance: {
        origin: "runtime",
        actor: "test-runner",
        tool: "bun-test",
        revision: "head",
        captured_at: "2026-08-31T00:00:00.000Z",
      },
    });
    assuranceCase.edges.push({
      id: "EDGE-003",
      edge_type: "validates",
      source_node: "VAL-001",
      target_node: "REQ-001",
    });

    const report = evaluateAssuranceCase(assuranceCase);

    expect(report.verdict).toBe("INDETERMINATE");
    expect(report.violations.map((violation) => violation.type)).toContain(
      "missing-reviewer-independence",
    );
  });

  test("rejects a failed required validation", () => {
    const assuranceCase = baseCase();
    assuranceCase.nodes.find((node) => node.id === "REQ-001")!.risk_tier = "T2";
    assuranceCase.nodes.push({
      id: "VAL-001",
      node_type: "validation",
      label: "Widget contract test",
      epistemic_role: "validation",
      approval_state: "not-applicable",
      derived_from: [],
      validation_result: "fail",
      provenance: {
        origin: "runtime",
        actor: "test-runner",
        tool: "bun-test",
        revision: "head",
        captured_at: "2026-08-31T00:00:00.000Z",
      },
    });
    assuranceCase.edges.push({
      id: "EDGE-003",
      edge_type: "validates",
      source_node: "VAL-001",
      target_node: "REQ-001",
    });

    const report = evaluateAssuranceCase(assuranceCase);

    expect(report.verdict).toBe("UNSATISFIED");
    expect(report.violations.map((violation) => violation.type)).toContain("failed-validation");
  });
});

describe("change scope", () => {
  test("enumerates changed TypeScript symbols and explicit JSON Schema contracts", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "proofline-scope-"));
    temporaryDirectories.push(projectRoot);
    const bookDir = join(projectRoot, ".proofline");
    mkdirSync(join(projectRoot, "src"), { recursive: true });
    mkdirSync(join(projectRoot, "contracts"), { recursive: true });
    mkdirSync(bookDir, { recursive: true });
    runGit(projectRoot, "init");
    writeFileSync(
      join(projectRoot, "package.json"),
      '{"dependencies":{"@vendor/widget":"1.0.0"}}\n',
    );
    writeFileSync(
      join(projectRoot, "src", "widget.ts"),
      'import { api } from "@vendor/widget";\nexport function createWidget() { return api(1); }\n',
    );
    writeFileSync(
      join(projectRoot, "src", "consumer.ts"),
      'import { createWidget } from "./widget";\nexport const result = createWidget();\n',
    );
    writeFileSync(join(projectRoot, "src", "legacy.ts"), "export const retiredWidget = true;\n");
    runGit(projectRoot, "add", ".");
    runGit(projectRoot, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "base");
    const base = runGit(projectRoot, "rev-parse", "HEAD").trim();

    writeFileSync(
      join(projectRoot, "src", "widget.ts"),
      'import { api } from "@vendor/widget";\nexport function createWidget() { return api(2); }\nexport const deleteWidget = () => true;\n',
    );
    writeFileSync(
      join(projectRoot, "package.json"),
      '{"dependencies":{"@vendor/widget":"2.0.0"}}\n',
    );
    writeFileSync(
      join(projectRoot, "contracts", "widget.schema.json"),
      '{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object"}\n',
    );
    rmSync(join(projectRoot, "src", "legacy.ts"));
    runGit(projectRoot, "add", ".");
    runGit(projectRoot, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "head");
    const head = runGit(projectRoot, "rev-parse", "HEAD").trim();

    const envelope = scopeChange(projectRoot, bookDir, { base, head });

    expect(envelope.changed_files).toEqual([
      "contracts/widget.schema.json",
      "package.json",
      "src/legacy.ts",
      "src/widget.ts",
    ]);
    expect(envelope.changed_symbols).toContain("src/widget.ts#createWidget");
    expect(envelope.changed_symbols).toContain("src/widget.ts#deleteWidget");
    expect(envelope.changed_symbols).toContain("src/legacy.ts#retiredWidget");
    expect(envelope.affected_dependencies).toContain("@vendor/widget");
    expect(envelope.affected_contracts).toContain("contracts/widget.schema.json");
    expect(envelope.known_consumers).toContain("src/consumer.ts");
    expect(envelope.boundary_confidence).toBe("complete");
  });

  test("enumerates frontend, platform, dependency, and external-service layers", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "proofline-stack-scope-"));
    temporaryDirectories.push(projectRoot);
    const bookDir = join(projectRoot, ".ddd");
    mkdirSync(join(projectRoot, "src"), { recursive: true });
    mkdirSync(join(projectRoot, "apps", "web"), { recursive: true });
    mkdirSync(bookDir, { recursive: true });
    runGit(projectRoot, "init");
    writeFileSync(
      join(projectRoot, "package.json"),
      '{"dependencies":{"react":"19.0.0","tailwindcss":"4.0.0","shared":"1.0.0"}}\n',
    );
    writeFileSync(
      join(projectRoot, "apps", "web", "package.json"),
      '{"dependencies":{"zod":"4.0.0","shared":"1.0.0"}}\n',
    );
    writeFileSync(join(projectRoot, "src", "base.ts"), "export const base = true;\n");
    runGit(projectRoot, "add", ".");
    runGit(
      projectRoot,
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.com",
      "commit",
      "-m",
      "base",
    );
    const base = runGit(projectRoot, "rev-parse", "HEAD").trim();

    writeFileSync(
      join(projectRoot, "src", "App.tsx"),
      'import React from "react";\nexport const App = () => fetch("https://api.example.com/v1");\n',
    );
    writeFileSync(join(projectRoot, "src", "styles.css"), '@import "tailwindcss";\n');
    writeFileSync(
      join(projectRoot, "apps", "web", "package.json"),
      '{"dependencies":{"zod":"4.0.0","shared":"2.0.0"}}\n',
    );
    writeFileSync(join(projectRoot, "wrangler.jsonc"), '{"name":"example"}\n');
    runGit(projectRoot, "add", ".");
    runGit(
      projectRoot,
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.com",
      "commit",
      "-m",
      "head",
    );
    const head = runGit(projectRoot, "rev-parse", "HEAD").trim();

    const envelope = scopeChange(projectRoot, bookDir, { base, head });

    expect(envelope.declared_dependencies).toEqual(["react", "shared", "tailwindcss", "zod"]);
    expect(envelope.declared_dependency_versions).toEqual({
      react: ["19.0.0"],
      shared: ["1.0.0", "2.0.0"],
      tailwindcss: ["4.0.0"],
      zod: ["4.0.0"],
    });
    expect(envelope.affected_dependencies).toEqual(
      expect.arrayContaining(["react", "shared", "tailwindcss"]),
    );
    expect(envelope.affected_services).toEqual(["api.example.com"]);
    expect(envelope.affected_platforms).toEqual(["cloudflare-workers"]);
    expect(envelope.frontend_files).toEqual(["src/App.tsx", "src/styles.css"]);
    expect(envelope.boundary_confidence).toBe("complete");
  });

  test("marks stack-exercising files as boundary files and is idempotent per range", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "proofline-boundary-scope-"));
    temporaryDirectories.push(projectRoot);
    const bookDir = join(projectRoot, ".ddd");
    mkdirSync(join(projectRoot, "src"), { recursive: true });
    mkdirSync(bookDir, { recursive: true });
    runGit(projectRoot, "init");
    writeFileSync(
      join(projectRoot, "package.json"),
      '{"dependencies":{"react":"19.0.0"}}\n',
    );
    writeFileSync(join(projectRoot, "src", "stale.ts"), "export const old = true;\n");
    runGit(projectRoot, "add", ".");
    runGit(
      projectRoot,
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.com",
      "commit",
      "-m",
      "base",
    );
    const base = runGit(projectRoot, "rev-parse", "HEAD").trim();

    writeFileSync(
      join(projectRoot, "src", "api.ts"),
      'import React from "react";\nexport const callApi = () => 1;\n',
    );
    writeFileSync(join(projectRoot, "src", "internal.ts"), "export const helper = () => 2;\n");
    rmSync(join(projectRoot, "src", "stale.ts"));
    runGit(projectRoot, "add", ".");
    runGit(
      projectRoot,
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.com",
      "commit",
      "-m",
      "head",
    );
    const head = runGit(projectRoot, "rev-parse", "HEAD").trim();

    const envelope = scopeChange(projectRoot, bookDir, { base, head });
    const rerun = scopeChange(projectRoot, bookDir, { base, head });

    // Only the file importing the declared stack lands in boundary_files.
    expect(envelope.boundary_files).toEqual(["src/api.ts"]);
    expect(envelope.changed_symbols).toEqual(
      expect.arrayContaining(["src/api.ts#callApi", "src/internal.ts#helper", "src/stale.ts#old"]),
    );
    // Re-scoping the same (base, head) range returns the same envelope.
    expect(rerun.id).toBe(envelope.id);
    const caseFiles = readdirSync(join(bookDir, "cases"))
      .filter((name) => name.startsWith("ENV-"))
      .sort();
    expect(caseFiles).toEqual([`${envelope.id}.json`]);
  });

  test("regenerates a stale-detector envelope in place instead of failing idempotency", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "proofline-detector-scope-"));
    temporaryDirectories.push(projectRoot);
    const bookDir = join(projectRoot, ".ddd");
    mkdirSync(join(projectRoot, "src"), { recursive: true });
    mkdirSync(bookDir, { recursive: true });
    runGit(projectRoot, "init");
    writeFileSync(join(projectRoot, "package.json"), "{}\n");
    writeFileSync(join(projectRoot, "src", "widget.ts"), "export const widget = 1;\n");
    runGit(projectRoot, "add", ".");
    runGit(
      projectRoot,
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.com",
      "commit",
      "-m",
      "base",
    );
    const base = runGit(projectRoot, "rev-parse", "HEAD").trim();

    writeFileSync(join(projectRoot, "src", "widget.ts"), "export const widget = 2;\n");
    runGit(projectRoot, "add", ".");
    runGit(
      projectRoot,
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.com",
      "commit",
      "-m",
      "head",
    );
    const head = runGit(projectRoot, "rev-parse", "HEAD").trim();

    const envelope = scopeChange(projectRoot, bookDir, { base, head });
    // Simulate an envelope cached by an older detector: same range, old version.
    const envelopePath = join(bookDir, "cases", `${envelope.id}.json`);
    const stale = {
      ...JSON.parse(readFileSync(envelopePath, "utf8")),
      detector: { name: "proofline-typescript-contracts", version: "0.5.0" },
    };
    writeFileSync(envelopePath, `${JSON.stringify(stale, null, 2)}\n`);

    let regenerated: { id: string; from: string | null; to: string } | null = null;
    const rerun = scopeChange(projectRoot, bookDir, {
      base,
      head,
      onRegenerate: (info) => {
        regenerated = info;
      },
    });

    // Same ENV id (regenerated in place), detector version advanced.
    expect(rerun.id).toBe(envelope.id);
    expect(rerun.detector.version).toBe("0.6.0");
    expect(regenerated).toEqual({ id: envelope.id, from: "0.5.0", to: "0.6.0" });
    const caseFiles = readdirSync(join(bookDir, "cases"))
      .filter((name) => name.startsWith("ENV-"))
      .sort();
    expect(caseFiles).toEqual([`${envelope.id}.json`]);

    // Once current, re-running the same range is a pure idempotent hit.
    let calledAgain = false;
    const third = scopeChange(projectRoot, bookDir, {
      base,
      head,
      onRegenerate: () => {
        calledAgain = true;
      },
    });
    expect(third.id).toBe(envelope.id);
    expect(calledAgain).toBe(false);
  });

  test("treats book ledgers, project docs, hygiene files, and runtime builtins as inert", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "proofline-inert-scope-"));
    temporaryDirectories.push(projectRoot);
    const bookDir = join(projectRoot, ".ddd");
    mkdirSync(join(projectRoot, "src"), { recursive: true });
    mkdirSync(bookDir, { recursive: true });
    runGit(projectRoot, "init");
    writeFileSync(join(projectRoot, "package.json"), "{}\n");
    writeFileSync(join(projectRoot, "src", "base.ts"), "export const base = true;\n");
    runGit(projectRoot, "add", ".");
    runGit(
      projectRoot,
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.com",
      "commit",
      "-m",
      "base",
    );
    const base = runGit(projectRoot, "rev-parse", "HEAD").trim();

    // An assurance-cycle commit: book ledger (with issue URLs), root docs,
    // hygiene files, and a Bun builtin import.
    writeFileSync(
      join(bookDir, "obligations.yaml"),
      `schema_version: 0.1.0
obligations:
  - id: OB-001
    schema_version: 0.1.0
    defeater: stack:dependency:react
    issue: https://github.com/org/repo/issues/12
    status: open
    created_at: 2026-08-31T00:00:00.000Z
`,
    );
    writeFileSync(
      join(projectRoot, "README.md"),
      "See https://api.example.com/docs for the provider API.\n",
    );
    writeFileSync(join(projectRoot, ".gitignore"), "node_modules\n");
    writeFileSync(
      join(projectRoot, "src", "db.ts"),
      'import { Database } from "bun:sqlite";\nexport const db = new Database(":memory:");\n',
    );
    runGit(projectRoot, "add", ".");
    runGit(
      projectRoot,
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.com",
      "commit",
      "-m",
      "head",
    );
    const head = runGit(projectRoot, "rev-parse", "HEAD").trim();

    const envelope = scopeChange(projectRoot, bookDir, { base, head });

    // Inert files carry no stack signals and no confidence penalty, so an
    // assurance-cycle commit can still reach a complete boundary.
    expect(envelope.boundary_confidence).toBe("complete");
    expect(envelope.affected_services).toEqual([]);
    // bun: is a runtime-provided builtin, not an external dependency.
    expect(envelope.affected_dependencies).toEqual([]);
    expect(envelope.changed_symbols).toContain("src/db.ts#db");
  });
});

describe("case construction", () => {
  test("requires evidence for every stack layer and blocks unresolved gaps", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "proofline-stack-case-"));
    temporaryDirectories.push(projectRoot);
    const bookDir = join(projectRoot, ".proofline");
    mkdirSync(join(bookDir, "cases"), { recursive: true });
    mkdirSync(join(bookDir, "cache"), { recursive: true });
    const envelope = {
      ...baseCase().envelope,
      changed_files: ["src/App.tsx", "src/styles.css", "wrangler.jsonc"],
      changed_symbols: [],
      declared_dependency_versions: {
        react: ["19.0.0"],
        tailwindcss: ["4.0.0"],
      },
      affected_dependencies: ["react", "tailwindcss"],
      affected_services: ["api.example.com"],
      affected_platforms: ["cloudflare-workers"],
      frontend_files: ["src/App.tsx", "src/styles.css"],
    };
    writeFileSync(join(bookDir, "cases", "ENV-001.json"), JSON.stringify(envelope));
    writeFileSync(
      join(bookDir, "book.yaml"),
      `references:
  - id: REF-CF
    type: external
    source: https://developers.cloudflare.com/workers/
  - id: REF-AI
    type: external
    source: https://api.example.com/docs
`,
    );
    writeFileSync(
      join(bookDir, "evidence.lock"),
      `entries:
  - id: EL-CF
    ref: REF-CF
    subject: cloudflare-workers
    source_url: https://developers.cloudflare.com/workers/
`,
    );
    writeFileSync(
      join(bookDir, "stack.yaml"),
      `schema_version: 0.5.0
components:
  - id: STK-001
    kind: dependency
    name: react
    evidence_refs: [EL-CF]
  - id: STK-002
    kind: platform
    name: cloudflare-workers
    evidence_refs: [EL-CF]
    constraint_refs: [EL-CF]
`,
    );
    writeFileSync(
      join(bookDir, "knowledge-map.yaml"),
      `domains:
  - id: DM-001
    name: provider
    gaps: ["Provider authentication is unverified"]
overall_gaps: []
`,
    );

    const assuranceCase = buildAssuranceCase(bookDir, "ENV-001");

    expect(assuranceCase.capabilities.stack_coverage).toBe("not-evaluated");
    expect(assuranceCase.capabilities.reference_evidence_completeness).toBe("not-evaluated");
    expect(assuranceCase.capabilities.gap_resolution).toBe("not-evaluated");
    expect(assuranceCase.capabilities.platform_constraints).toBe("not-evaluated");
    expect(assuranceCase.capabilities.frontend_coverage).toBe("not-evaluated");
    expect(assuranceCase.capabilities.interaction_analysis).toBe("not-evaluated");
    expect(assuranceCase.defeaters).toContain("stack:dependency:tailwindcss");
    expect(assuranceCase.defeaters).toContain("stack:service:api.example.com");
    expect(assuranceCase.defeaters).toContain("gap:DM-001:Provider authentication is unverified");
    expect(assuranceCase.required_capabilities).toEqual(
      expect.arrayContaining([
        "stack_coverage",
        "reference_evidence_completeness",
        "gap_resolution",
        "platform_constraints",
        "frontend_coverage",
        "interaction_analysis",
      ]),
    );

    writeFileSync(
      join(bookDir, "evidence.lock"),
      `entries:
  - id: EL-CF
    ref: REF-CF
    subject: cloudflare-workers
    source_url: https://developers.cloudflare.com/workers/
    cache_path: cache/cloudflare.md
    content_digest: sha256:${sha256Hex("Cloudflare Workers constraints")}
  - id: EL-AI
    ref: REF-AI
    subject: api.example.com
    source_url: https://api.example.com/docs
    cache_path: cache/provider.md
    content_digest: sha256:${sha256Hex("Provider API")}
  - id: EL-REACT
    subject: react
    version: 19.0.0
    source_url: https://react.dev/
    cache_path: cache/provider.md
    content_digest: sha256:${sha256Hex("Provider API")}
  - id: EL-TAILWIND
    subject: tailwindcss
    version: 4.0.0
    source_url: https://tailwindcss.com/docs/
    cache_path: cache/provider.md
    content_digest: sha256:${sha256Hex("Provider API")}
  - id: EL-FRONTEND
    subject: frontend
    source_url: https://example.com/frontend/
    cache_path: cache/provider.md
    content_digest: sha256:${sha256Hex("Provider API")}
`,
    );
    writeFileSync(join(bookDir, "cache", "cloudflare.md"), "Cloudflare Workers constraints");
    writeFileSync(join(bookDir, "cache", "provider.md"), "Provider API");
    writeFileSync(
      join(bookDir, "stack.yaml"),
      `schema_version: 0.5.0
components:
  - id: STK-001
    kind: dependency
    name: react
    versions: [19.0.0]
    evidence_refs: [EL-REACT]
  - id: STK-002
    kind: dependency
    name: tailwindcss
    versions: [4.0.0]
    evidence_refs: [EL-TAILWIND]
  - id: STK-003
    kind: service
    name: api.example.com
    evidence_refs: [EL-AI]
  - id: STK-004
    kind: platform
    name: cloudflare-workers
    evidence_refs: [EL-CF]
    required_constraints: [execution-time, concurrency]
    constraints:
      - name: execution-time
        evidence_refs: [EL-CF]
      - name: concurrency
        evidence_refs: [EL-CF]
  - id: STK-005
    kind: frontend
    name: frontend
    evidence_refs: [EL-FRONTEND]
`,
    );
    writeFileSync(
      join(bookDir, "knowledge-map.yaml"),
      `domains:
  - id: DM-001
    gaps: ["Provider authentication is unverified"]
  - id: DM-002
    gaps: ["Provider authentication is unverified"]
gaps:
  - domain: DM-001
    description: "Provider authentication is unverified"
    status: resolved
overall_gaps: []
`,
    );
    writeFileSync(
      join(bookDir, "interactions.yaml"),
      `interactions:
  - id: INT-001
    components: [dependency:react, dependency:tailwindcss, service:api.example.com, platform:cloudflare-workers, frontend:frontend]
    status: analyzed
    rationale: "The browser, framework, provider, and Workers runtime paths were reviewed together."
`,
    );

    const partiallyResolvedCase = buildAssuranceCase(bookDir, "ENV-001");
    expect(partiallyResolvedCase.capabilities.gap_resolution).toBe("not-evaluated");
    expect(partiallyResolvedCase.defeaters).toContain(
      "gap:DM-002:Provider authentication is unverified",
    );
    writeFileSync(
      join(bookDir, "knowledge-map.yaml"),
      `domains:
  - id: DM-001
    gaps: ["Provider authentication is unverified"]
  - id: DM-002
    gaps: ["Provider authentication is unverified"]
gaps:
  - domain: DM-001
    description: "Provider authentication is unverified"
    status: resolved
  - domain: DM-002
    description: "Provider authentication is unverified"
    status: resolved
overall_gaps: []
`,
    );

    const completeCase = buildAssuranceCase(bookDir, "ENV-001");

    expect(completeCase.capabilities.stack_coverage).toBe("tool-enforced");
    expect(completeCase.capabilities.reference_evidence_completeness).toBe("tool-enforced");
    expect(completeCase.capabilities.gap_resolution).toBe("tool-enforced");
    expect(completeCase.capabilities.platform_constraints).toBe("recorded-attestation");
    expect(completeCase.capabilities.frontend_coverage).toBe("tool-enforced");
    expect(completeCase.capabilities.interaction_analysis).toBe("recorded-attestation");
    expect(completeCase.defeaters).toEqual([]);

    const stackPath = join(bookDir, "stack.yaml");
    const completeStack = readFileSync(stackPath, "utf8");
    writeFileSync(stackPath, completeStack.replace("    versions: [4.0.0]\n", ""));
    const omittedVersionCase = buildAssuranceCase(bookDir, "ENV-001");
    expect(omittedVersionCase.capabilities.stack_coverage).toBe("not-evaluated");
    writeFileSync(stackPath, completeStack);

    const evidencePath = join(bookDir, "evidence.lock");
    const completeEvidence = readFileSync(evidencePath, "utf8");
    writeFileSync(evidencePath, completeEvidence.replace("version: 4.0.0", "version: 3.0.0"));
    const wrongVersionCase = buildAssuranceCase(bookDir, "ENV-001");
    expect(wrongVersionCase.capabilities.stack_coverage).toBe("not-evaluated");

    writeFileSync(evidencePath, completeEvidence);
    writeFileSync(join(bookDir, "cache", "provider.md"), "corrupted");
    const corruptCase = buildAssuranceCase(bookDir, "ENV-001");
    expect(corruptCase.capabilities.stack_coverage).toBe("not-evaluated");
  });

  test("bridges locked evidence, claims, and traces into a typed assurance case", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "proofline-case-"));
    temporaryDirectories.push(projectRoot);
    const bookDir = join(projectRoot, ".proofline");
    mkdirSync(join(bookDir, "cases"), { recursive: true });
    mkdirSync(join(bookDir, "cache"), { recursive: true });
    const envelope = baseCase().envelope;
    const evidenceContent = "# Widget API v2\n\ncreateWidget is supported.\n";
    writeFileSync(join(bookDir, "cache", "widget.md"), evidenceContent);
    writeFileSync(join(bookDir, "cases", "ENV-001.json"), `${JSON.stringify(envelope, null, 2)}\n`);
    writeFileSync(
      join(bookDir, "evidence.lock"),
      `schema_version: 0.1.0
entries:
  - id: EL-001
    source_class: vendor-doc
    source_url: https://docs.example.com/widget/v2
    version: 2.0.0
    doc_version: 2.0.0
    status: normative
    independence: external
    authority_for: [api-semantics]
    cache_path: cache/widget.md
    content_digest: sha256:${sha256Hex(evidenceContent)}
    retrieved_at: 2026-08-31T00:00:00.000Z
`,
    );
    writeFileSync(
      join(bookDir, "claims.yaml"),
      `schema_version: 0.1.0
entries:
  - id: C-001
    statement: "Use createWidget from v2"
    status: known-and-supported
    tier: T2
    sources:
      - ref: EL-001#createWidget
        authority_domain: api-semantics
        entailment: explicit
    constructs: []
    validations: [V-001]
`,
    );
    writeFileSync(
      join(bookDir, "trace-matrix.yaml"),
      `schema_version: 0.1.0
traces:
  - id: TR-001
    claim_id: C-001
    construct_id: src/widget.ts#createWidget
    validation_id: V-001
    direction: forward
`,
    );
    mkdirSync(join(bookDir, "reports"), { recursive: true });
    writeFileSync(
      join(bookDir, "reports", "validations.yaml"),
      `schema_version: 0.1.0
entries:
  - id: V-001
    claim: C-001
    construct: src/widget.ts#createWidget
    method: test
    target: test:create-widget
    result: pass
    run_at: 2026-08-31T00:00:00.000Z
    evidence_hash: sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
`,
    );

    const assuranceCase = buildAssuranceCase(bookDir, "ENV-001");
    const report = evaluateAssuranceCase(assuranceCase);

    expect(assuranceCase.goals).toEqual(["C-001"]);
    expect(assuranceCase.nodes.map((node) => node.id)).toContain("EL-001");
    expect(assuranceCase.nodes.map((node) => node.id)).toContain("C-001");
    expect(
      assuranceCase.nodes.find(
        (node) =>
          node.node_type === "implementation" &&
          node.construct === "src/widget.ts#createWidget",
      )?.coverage_status,
    ).toBe("covered");
    expect(
      assuranceCase.edges.some(
        (edge) =>
          edge.edge_type === "validates" &&
          edge.source_node === "V-001" &&
          edge.target_node === "C-001",
      ),
    ).toBe(true);
    expect(report.verdict).toBe("SATISFIED");
  });

  test("wires declared goals, waivers, obligations, and partitions symbols by boundary", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "proofline-partition-case-"));
    temporaryDirectories.push(projectRoot);
    const bookDir = join(projectRoot, ".proofline");
    mkdirSync(join(bookDir, "cases"), { recursive: true });
    mkdirSync(join(bookDir, "cache"), { recursive: true });
    const evidenceContent = "# Widget API v2\n\ncreateWidget is supported.\n";
    writeFileSync(join(bookDir, "cache", "widget.md"), evidenceContent);
    const envelope = {
      ...baseCase().envelope,
      schema_version: "0.5.0" as const,
      changed_files: ["src/api.ts", "src/helpers.ts", "src/internal.ts"],
      changed_symbols: [
        "src/api.ts#fetchWidget",
        "src/helpers.ts#formatName",
        "src/internal.ts#deepHelper",
      ],
      boundary_files: ["src/api.ts"],
    };
    writeFileSync(join(bookDir, "cases", "ENV-001.json"), `${JSON.stringify(envelope, null, 2)}\n`);
    writeFileSync(
      join(bookDir, "evidence.lock"),
      `schema_version: 0.1.0
entries:
  - id: EL-001
    source_class: vendor-doc
    source_url: https://docs.example.com/widget/v2
    version: 2.0.0
    doc_version: 2.0.0
    status: normative
    independence: external
    authority_for: [api-semantics]
    cache_path: cache/widget.md
    content_digest: sha256:${sha256Hex(evidenceContent)}
    retrieved_at: 2026-08-31T00:00:00.000Z
`,
    );
    writeFileSync(
      join(bookDir, "claims.yaml"),
      `schema_version: 0.1.0
entries:
  - id: C-001
    statement: "Use createWidget from v2"
    status: known-and-supported
    tier: T2
    claim_kind: api
    impact: high
    sources:
      - ref: EL-001#createWidget
        authority_domain: api-semantics
        entailment: explicit
    constructs: [src/api.ts#fetchWidget]
    validations: [V-001]
  - id: C-002
    statement: "Payments retry policy"
    status: known-and-supported
    tier: T1
    claim_kind: behavioral
    impact: medium
    sources: []
    constructs: []
    validations: []
`,
    );
    writeFileSync(
      join(bookDir, "trace-matrix.yaml"),
      `schema_version: 0.1.0
traces:
  - id: TR-001
    claim_id: C-001
    construct_id: src/api.ts#fetchWidget
    validation_id: V-001
    direction: forward
`,
    );
    mkdirSync(join(bookDir, "reports"), { recursive: true });
    writeFileSync(
      join(bookDir, "reports", "validations.yaml"),
      `schema_version: 0.1.0
entries:
  - id: V-001
    claim: C-001
    construct: src/api.ts#fetchWidget
    method: test
    target: test:fetch-widget
    result: pass
    run_at: 2026-08-31T00:00:00.000Z
    evidence_hash: sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
`,
    );
    // C-002 is not change-matched; declaring it as a goal keeps it reachable.
    writeFileSync(
      join(bookDir, "goals.yaml"),
      `schema_version: 0.1.0
goals:
  - id: GOAL-001
    schema_version: 0.1.0
    claim: C-002
    statement: Payments retry policy
    created_at: 2026-08-31T00:00:00.000Z
`,
    );
    writeFileSync(
      join(bookDir, "exceptions.yaml"),
      `schema_version: 0.1.0
exceptions:
  - id: EXC-001
    schema_version: 0.1.0
    goal: C-002
    rationale: "Vendor retry docs pending; risk accepted until they land"
    owner: release-owner
    expires_at: 2999-12-31
    status: approved
    created_at: 2026-08-31T00:00:00.000Z
`,
    );
    writeFileSync(
      join(bookDir, "obligations.yaml"),
      `schema_version: 0.1.0
obligations:
  - id: OB-001
    schema_version: 0.1.0
    defeater: stack:dependency:react
    description: Pin and document the react version
    issue: https://github.com/org/repo/issues/12
    status: open
    created_at: 2026-08-31T00:00:00.000Z
`,
    );
    writeFileSync(
      join(bookDir, "stack.yaml"),
      `schema_version: 0.5.0
components:
  - id: STK-001
    kind: dependency
    name: react
`,
    );

    const assuranceCase = buildAssuranceCase(bookDir, "ENV-001");

    // Declared goal joins change-matched claims as a case goal.
    expect(assuranceCase.goals).toEqual(expect.arrayContaining(["C-001", "C-002"]));
    // Symbol partitioning: traced -> covered, boundary file -> gap, internal
    // -> outside-boundary (no gap).
    const coverageByConstruct = new Map(
      assuranceCase.nodes
        .filter((node) => node.node_type === "implementation")
        .map((node) => [node.construct as string, node.coverage_status]),
    );
    expect(coverageByConstruct.get("src/api.ts#fetchWidget")).toBe("covered");
    expect(coverageByConstruct.get("src/helpers.ts#formatName")).toBe("outside-boundary");
    expect(coverageByConstruct.get("src/internal.ts#deepHelper")).toBe("outside-boundary");
    // Waiver node and edge for the declared goal.
    const waiver = assuranceCase.nodes.find((node) => node.id === "EXC-001");
    expect(waiver?.node_type).toBe("exception");
    expect(waiver?.expires_at).toBe("2999-12-31");
    expect(
      assuranceCase.edges.some(
        (edge) => edge.edge_type === "waives" && edge.source_node === "EXC-001" && edge.target_node === "C-002",
      ),
    ).toBe(true);
    // Obligation bound to this case's defeater.
    expect(assuranceCase.defeaters).toContain("stack:dependency:react");
    expect(assuranceCase.obligations).toEqual([
      expect.objectContaining({ id: "OB-001", defeater: "stack:dependency:react", status: "open" }),
    ]);

    const report = evaluateAssuranceCase(assuranceCase);

    // The internal symbols produce no uncovered-construct violations.
    expect(
      report.violations.filter(
        (violation) =>
          violation.type === "uncovered-construct" &&
          (violation.construct ?? "").startsWith("src/helpers.ts"),
      ),
    ).toEqual([]);
    expect(report.approved_exceptions).toEqual(["EXC-001"]);
    expect(report.open_obligations).toEqual(["OB-001"]);
    // The obligation does not resolve the defeater: still INDETERMINATE.
    expect(report.verdict).toBe("INDETERMINATE");
  });

  test("wires capability waivers and capability obligations into the case", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "proofline-capability-case-"));
    temporaryDirectories.push(projectRoot);
    const bookDir = join(projectRoot, ".proofline");
    mkdirSync(join(bookDir, "cases"), { recursive: true });
    mkdirSync(join(bookDir, "cache"), { recursive: true });
    const evidenceContent = "# Widget API v2\n\ncreateWidget is supported.\n";
    writeFileSync(join(bookDir, "cache", "widget.md"), evidenceContent);
    // A known consumer makes consumer_impact a required capability.
    const envelope = {
      ...baseCase().envelope,
      changed_files: [],
      known_consumers: ["src/consumer.ts"],
    };
    writeFileSync(join(bookDir, "cases", "ENV-001.json"), `${JSON.stringify(envelope, null, 2)}\n`);
    writeFileSync(
      join(bookDir, "evidence.lock"),
      `schema_version: 0.1.0
entries:
  - id: EL-001
    source_class: vendor-doc
    source_url: https://docs.example.com/widget/v2
    version: 2.0.0
    doc_version: 2.0.0
    status: normative
    independence: external
    authority_for: [api-semantics]
    cache_path: cache/widget.md
    content_digest: sha256:${sha256Hex(evidenceContent)}
    retrieved_at: 2026-08-31T00:00:00.000Z
`,
    );
    writeFileSync(
      join(bookDir, "claims.yaml"),
      `schema_version: 0.1.0
entries:
  - id: C-001
    statement: "Use createWidget from v2"
    status: known-and-supported
    tier: T2
    sources:
      - ref: EL-001#createWidget
        authority_domain: api-semantics
        entailment: explicit
    constructs: []
    validations: [V-001]
`,
    );
    writeFileSync(
      join(bookDir, "trace-matrix.yaml"),
      `schema_version: 0.1.0
traces:
  - id: TR-001
    claim_id: C-001
    construct_id: src/widget.ts#createWidget
    validation_id: V-001
    direction: forward
`,
    );
    mkdirSync(join(bookDir, "reports"), { recursive: true });
    writeFileSync(
      join(bookDir, "reports", "validations.yaml"),
      `schema_version: 0.1.0
entries:
  - id: V-001
    claim: C-001
    construct: src/widget.ts#createWidget
    method: test
    target: test:create-widget
    result: pass
    run_at: 2026-08-31T00:00:00.000Z
    evidence_hash: sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
`,
    );
    writeFileSync(
      join(bookDir, "exceptions.yaml"),
      `schema_version: 0.1.0
exceptions:
  - id: EXC-001
    schema_version: 0.1.0
    goal: null
    capability: consumer_impact
    rationale: "Consumer impact review deferred to the quarterly audit"
    owner: release-owner
    expires_at: 2999-12-31
    status: approved
    created_at: 2026-08-31T00:00:00.000Z
`,
    );
    writeFileSync(
      join(bookDir, "obligations.yaml"),
      `schema_version: 0.1.0
obligations:
  - id: OB-001
    schema_version: 0.1.0
    defeater: capability:consumer_impact
    description: Review consumer call sites for the next release
    issue: https://github.com/org/repo/issues/20
    status: open
    created_at: 2026-08-31T00:00:00.000Z
`,
    );

    const assuranceCase = buildAssuranceCase(bookDir, "ENV-001");

    expect(assuranceCase.required_capabilities).toContain("consumer_impact");
    expect(assuranceCase.capability_waivers).toEqual([
      expect.objectContaining({
        capability: "consumer_impact",
        exception: "EXC-001",
        owner: "release-owner",
        expires_at: "2999-12-31",
      }),
    ]);
    expect(assuranceCase.obligations).toEqual([
      expect.objectContaining({
        id: "OB-001",
        defeater: "capability:consumer_impact",
        status: "open",
      }),
    ]);

    const report = evaluateAssuranceCase(assuranceCase);

    // The unexpired waiver records the accepted risk (WAIVED, not SATISFIED);
    // the obligation stays visible as open work.
    expect(report.verdict).toBe("WAIVED");
    expect(report.approved_exceptions).toEqual(["EXC-001"]);
    expect(report.open_obligations).toEqual(["OB-001"]);
  });

  test("rejects artifact IDs that could escape the cases or reports directories", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "proofline-invalid-id-"));
    temporaryDirectories.push(projectRoot);
    const bookDir = join(projectRoot, ".proofline");
    mkdirSync(join(bookDir, "cases"), { recursive: true });
    const maliciousEnvelope = { ...baseCase().envelope, id: "../../outside" };
    const maliciousCase = { ...baseCase(), id: "../../outside" };
    const envelopePath = join(projectRoot, "malicious-envelope.json");
    const casePath = join(projectRoot, "malicious-case.json");
    writeFileSync(envelopePath, JSON.stringify(maliciousEnvelope));
    writeFileSync(casePath, JSON.stringify(maliciousCase));

    expect(() => loadChangeEnvelope(bookDir, envelopePath)).toThrow("invalid id");
    expect(() => loadAssuranceCase(bookDir, casePath)).toThrow("invalid id");
  });
});

function runGit(projectRoot: string, ...args: string[]): string {
  const result = Bun.spawnSync({
    cmd: ["git", "-C", projectRoot, ...args],
    stdout: "pipe",
    stderr: "pipe",
  });
  if (result.exitCode !== 0) {
    throw new Error(result.stderr.toString());
  }
  return result.stdout.toString();
}
