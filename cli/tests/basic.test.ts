import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { classify, TAXONOMY } from "../src/classify";
import { driftCheck, parseFreshnessDays } from "../src/drift";
import { lockEvidence } from "../src/lock";
import { sweep } from "../src/sweep";
import { addTrace } from "../src/trace";
import { isStubPrimitive } from "../src/stubs";
import { nextId, parseYaml, sha256Hex } from "../src/utils";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let workDir: string;
let dddDir: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), "ddd-cli-test-"));
  dddDir = join(workDir, ".ddd");
  mkdirSync(dddDir, { recursive: true });
  writeFileSync(
    join(dddDir, "book.yaml"),
    `schema_version: 0.1.0\nmanifest_digest: sha256:${sha256Hex("\n")}\nprofile: lite\n`,
  );
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

const CLAIMS_YAML = `schema_version: 0.1.0

entries:
  - id: C-001
    statement: "Server components cannot use browser-only APIs"
    sources:
      - ref: EL-001#Server Components
        authority_domain: api-semantics
    constructs: [OrderList.component, ProductCard.component]
    validations: []

  - id: C-002
    statement: "Claim with no sources"
    sources: []
    constructs: [Foo.component]
`;

const TRACE_YAML = `schema_version: 0.1.0

traces:
  - id: TR-001
    schema_version: 0.1.0
    change_id: null
    claim_id: C-001
    construct_id: OrderList.component
    validation_id: null
    direction: forward
    sweep_pass: false
    checked_at: 2026-08-29T12:00:00Z
    notes: null
`;

const LOCK_YAML = `schema_version: 0.1.0

entries:
  - id: EL-001
    source_url: https://example.com/fresh
    retrieved_at: ${new Date(Date.now() - 10 * 86400000).toISOString()}
    freshness: 90d
    superseded_by: null

  - id: EL-002
    source_url: https://example.com/stale
    retrieved_at: ${new Date(Date.now() - 200 * 86400000).toISOString()}
    freshness: 90d
    superseded_by: null

  - id: EL-003
    source_url: https://example.com/old-but-inactive
    retrieved_at: ${new Date(Date.now() - 400 * 86400000).toISOString()}
    freshness: 90d
    superseded_by: EL-004
`;

// ---------------------------------------------------------------------------
// utils
// ---------------------------------------------------------------------------

describe("utils", () => {
  test("sha256Hex matches known digest", () => {
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  test("nextId increments max numeric suffix", () => {
    expect(nextId([{ id: "EL-001" }, { id: "EL-009" }], "EL")).toBe("EL-010");
    expect(nextId([], "TR")).toBe("TR-001");
  });

  test("parseYaml parses the DDD artifact subset", () => {
    const doc = parseYaml(CLAIMS_YAML) as any;
    expect(doc.schema_version).toBe("0.1.0");
    expect(doc.entries).toHaveLength(2);
    expect(doc.entries[0].id).toBe("C-001");
    expect(doc.entries[0].sources[0].ref).toBe("EL-001#Server Components");
    expect(doc.entries[0].constructs).toEqual(["OrderList.component", "ProductCard.component"]);
    expect(doc.entries[1].sources).toEqual([]);
  });

  test("parseYaml handles null, booleans, numbers, comments", () => {
    const doc = parseYaml(`# comment\na: null\nb: true\nc: 42\nd: hello  # trailing\n`) as any;
    expect(doc.a).toBeNull();
    expect(doc.b).toBe(true);
    expect(doc.c).toBe(42);
    expect(doc.d).toBe("hello");
  });

  test("parseYaml handles empty flow sequence and quoted strings", () => {
    const doc = parseYaml(`traces: []\nname: "quoted: value"\n`) as any;
    expect(doc.traces).toEqual([]);
    expect(doc.name).toBe("quoted: value");
  });

  test("parseYaml resumes after folded block scalars", () => {
    expect(
      parseYaml(`project:
  description: >
    First line.
    Second line.
references:
  - id: REF-001
    type: external
`),
    ).toEqual({
      project: { description: "First line. Second line." },
      references: [{ id: "REF-001", type: "external" }],
    });
  });
});

// ---------------------------------------------------------------------------
// classify
// ---------------------------------------------------------------------------

describe("classify", () => {
  test("taxonomy has 18 dimensions", () => {
    expect(TAXONOMY).toHaveLength(18);
  });

  test("matches relevant domains for a change description", () => {
    const domains = classify("Add retry logic and error handling to the Postgres database migration");
    const ids = domains.map((d) => d.id);
    expect(ids).toContain(16); // Resilience and error handling
    expect(ids).toContain(4); // Data and persistence
    expect(ids).toContain(9); // Delivery, migration, and compatibility
    expect(domains[0].score).toBeGreaterThanOrEqual(domains[domains.length - 1].score);
  });

  test("returns empty for unrelated text", () => {
    expect(classify("the quick brown fox jumps over the lazy dog")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// lock
// ---------------------------------------------------------------------------

describe("lock", () => {
  test("appends an evidence lock entry with sha256 digest", async () => {
    const entry = await lockEvidence(dddDir, "https://example.com/doc", {
      contentOverride: "hello evidence",
      version: "1.0.0",
      sections: ["Overview"],
      authorityFor: ["api-semantics"],
    });

    expect(entry.id).toBe("EL-001");
    expect(entry.content_digest).toBe(`sha256:${sha256Hex("hello evidence")}`);
    expect(entry.source_class).toBe("vendor-doc");
    expect(entry.freshness).toBe("90d");

    // File exists, is parseable, and the entry round-trips.
    const lockPath = join(dddDir, "evidence.lock");
    expect(existsSync(lockPath)).toBe(true);
    const doc = parseYaml(readFileSync(lockPath, "utf8")) as any;
    expect(doc.entries).toHaveLength(1);
    expect(doc.entries[0].content_digest).toBe(entry.content_digest);
    expect(doc.entries[0].sections).toEqual(["Overview"]);
  });

  test("generates sequential ids on existing files", async () => {
    writeFileSync(join(dddDir, "evidence.lock"), LOCK_YAML);
    const entry = await lockEvidence(dddDir, "https://example.com/new", {
      contentOverride: "new content",
      version: "2.0.0",
    });
    expect(entry.id).toBe("EL-004");
  });

  test("appends to an explicitly empty evidence ledger", async () => {
    writeFileSync(join(dddDir, "evidence.lock"), "schema_version: 0.1.0\nentries: []\n");
    const entry = await lockEvidence(dddDir, "https://example.com/v1", {
      contentOverride: "# API v1\n",
      version: "1.0.0",
    });
    const parsed = parseYaml(readFileSync(join(dddDir, "evidence.lock"), "utf8")) as {
      entries: Array<{ id: string }>;
    };
    expect(parsed.entries.map((candidate) => candidate.id)).toEqual([entry.id]);
  });
});

// ---------------------------------------------------------------------------
// trace
// ---------------------------------------------------------------------------

describe("trace", () => {
  test("appends a trace entry to an empty matrix", () => {
    writeFileSync(join(dddDir, "claims.yaml"), CLAIMS_YAML);
    const entry = addTrace(dddDir, "C-001", "OrderList.component", { direction: "forward" });

    expect(entry.id).toBe("TR-001");
    expect(entry.claim_id).toBe("C-001");
    expect(entry.construct_id).toBe("OrderList.component");

    const doc = parseYaml(readFileSync(join(dddDir, "trace-matrix.yaml"), "utf8")) as any;
    expect(doc.traces).toHaveLength(1);
    expect(doc.traces[0].direction).toBe("forward");
  });

  test("increments ids on an existing matrix", () => {
    writeFileSync(join(dddDir, "claims.yaml"), CLAIMS_YAML);
    writeFileSync(join(dddDir, "trace-matrix.yaml"), TRACE_YAML);
    const entry = addTrace(dddDir, "C-001", "ProductCard.component");
    expect(entry.id).toBe("TR-002");
  });

  test("rejects unknown claim ids", () => {
    writeFileSync(join(dddDir, "claims.yaml"), CLAIMS_YAML);
    expect(() => addTrace(dddDir, "C-999", "Foo.component")).toThrow(/not found/);
  });
});

// ---------------------------------------------------------------------------
// sweep
// ---------------------------------------------------------------------------

describe("sweep", () => {
  test("does not report conformance for an empty scope", () => {
    const report = sweep(dddDir, "both");
    expect(report.pass).toBe(false);
    expect(report.verdict).toBe("NOT_EVALUATED");
    expect(report.violations.map((violation) => violation.type)).toContain("empty-scope");
  });

  test("forward sweep reports claims without sources and untraced constructs", () => {
    writeFileSync(join(dddDir, "claims.yaml"), CLAIMS_YAML);
    writeFileSync(join(dddDir, "trace-matrix.yaml"), TRACE_YAML);

    const report = sweep(dddDir, "forward");
    expect(report.pass).toBe(false);
    expect(report.claims_checked).toBe(2);

    const types = report.violations.map((v) => v.type);
    expect(types).toContain("claim-without-source"); // C-002
    expect(types).toContain("untraced-construct"); // ProductCard.component + Foo.component

    const sourceViolation = report.violations.find((v) => v.type === "claim-without-source");
    expect(sourceViolation?.claim_id).toBe("C-002");
    expect(
      report.violations.some((v) => v.type === "untraced-construct" && v.construct === "OrderList.component"),
    ).toBe(false); // it is traced
  });

  test("reverse sweep reports orphan traces", () => {
    writeFileSync(join(dddDir, "claims.yaml"), CLAIMS_YAML);
    writeFileSync(
      join(dddDir, "trace-matrix.yaml"),
      TRACE_YAML.replace("claim_id: C-001", "claim_id: C-999"),
    );

    const report = sweep(dddDir, "reverse");
    expect(report.violations.some((v) => v.type === "orphan-trace" && v.claim_id === "C-999")).toBe(true);
  });

  test("passes when declared claims, evidence, and traces are consistent", async () => {
    await lockEvidence(dddDir, "https://example.com/api/v1", {
      contentOverride: "# API v1\n",
      version: "1.0.0",
      sections: ["API"],
      authorityFor: ["api-semantics"],
    });
    writeFileSync(
      join(dddDir, "claims.yaml"),
      `schema_version: 0.1.0\nentries:\n  - id: C-001\n    statement: "API call follows v1"\n    sources:\n      - ref: EL-001#API\n        authority_domain: api-semantics\n        entailment: explicit\n    claim_kind: api\n    impact: medium\n    tier: T1\n    status: known-and-supported\n    constructs: [A.component]\n    validations: []\n`,
    );
    writeFileSync(
      join(dddDir, "trace-matrix.yaml"),
      `schema_version: 0.1.0\ntraces:\n  - id: TR-001\n    claim_id: C-001\n    construct_id: A.component\n    direction: forward\n`,
    );
    const report = sweep(dddDir, "both");
    expect(report.pass).toBe(true);
    expect(report.violations).toEqual([]);
  });

  test("rejects a persisted tier that is lower than the derived tier", async () => {
    await lockEvidence(dddDir, "https://example.com/security/v1", {
      contentOverride: "# Token verification\n",
      version: "1.0.0",
      sections: ["Token verification"],
      authorityFor: ["security"],
    });
    writeFileSync(
      join(dddDir, "claims.yaml"),
      `schema_version: 0.1.0\nentries:\n  - id: C-001\n    statement: "Verify tokens"\n    sources:\n      - ref: EL-001#Token verification\n        authority_domain: security\n        entailment: explicit\n    claim_kind: behavioral\n    impact: critical\n    tier: T1\n    status: known-and-supported\n    constructs: [auth.verify]\n    validations: []\n`,
    );
    writeFileSync(
      join(dddDir, "trace-matrix.yaml"),
      `schema_version: 0.1.0\ntraces:\n  - id: TR-001\n    claim_id: C-001\n    construct_id: auth.verify\n    direction: forward\n`,
    );

    const report = sweep(dddDir, "both");
    expect(report.violations.map((violation) => violation.type)).toContain("claim-tier-mismatch");
    expect(report.violations.map((violation) => violation.type)).toContain("t3-not-allowed-in-lite");
  });

  test("rejects validation IDs without passing validation records", async () => {
    await lockEvidence(dddDir, "https://example.com/behavior/v1", {
      contentOverride: "# Retry behavior\n",
      version: "1.0.0",
      sections: ["Retry behavior"],
      authorityFor: ["product-behavior"],
    });
    writeFileSync(
      join(dddDir, "claims.yaml"),
      `schema_version: 0.1.0\nentries:\n  - id: C-001\n    statement: "Retry once"\n    sources:\n      - ref: EL-001#Retry behavior\n        authority_domain: product-behavior\n        entailment: explicit\n    claim_kind: behavioral\n    impact: medium\n    tier: T2\n    status: known-and-supported\n    constructs: [client.retry]\n    validations: [V-001]\n`,
    );
    writeFileSync(
      join(dddDir, "trace-matrix.yaml"),
      `schema_version: 0.1.0\ntraces:\n  - id: TR-001\n    claim_id: C-001\n    construct_id: client.retry\n    validation_id: V-001\n    direction: forward\n`,
    );

    const report = sweep(dddDir, "both");
    expect(report.violations.map((violation) => violation.type)).toContain("validation-record-missing");
  });

  test("rejects incomplete validation proof metadata", async () => {
    await lockEvidence(dddDir, "https://example.com/behavior/v1", {
      contentOverride: "# Retry behavior\n",
      version: "1.0.0",
      sections: ["Retry behavior"],
      authorityFor: ["product-behavior"],
    });
    writeFileSync(
      join(dddDir, "claims.yaml"),
      `schema_version: 0.1.0\nentries:\n  - id: C-001\n    statement: "Retry once"\n    sources:\n      - ref: EL-001#Retry behavior\n        authority_domain: product-behavior\n        entailment: explicit\n    claim_kind: behavioral\n    impact: medium\n    tier: T2\n    status: known-and-supported\n    constructs: [client.retry]\n    validations: [V-001]\n`,
    );
    writeFileSync(
      join(dddDir, "trace-matrix.yaml"),
      `schema_version: 0.1.0\ntraces:\n  - id: TR-001\n    claim_id: C-001\n    construct_id: client.retry\n    validation_id: V-001\n    direction: forward\n`,
    );
    mkdirSync(join(dddDir, "reports"), { recursive: true });
    writeFileSync(
      join(dddDir, "reports", "validations.yaml"),
      "schema_version: 0.1.0\nentries:\n  - id: V-001\n    claim: C-001\n    result: pass\n",
    );

    const report = sweep(dddDir, "both");
    expect(report.violations.map((violation) => violation.type)).toContain("validation-record-invalid");
    expect(report.violations.map((violation) => violation.type)).toContain("validation-link-mismatch");
  });

  test("does not declare conformance after only one sweep direction", async () => {
    await lockEvidence(dddDir, "https://example.com/api/v1", {
      contentOverride: "# API v1\n",
      version: "1.0.0",
      sections: ["API"],
      authorityFor: ["api-semantics"],
    });
    writeFileSync(
      join(dddDir, "claims.yaml"),
      `schema_version: 0.1.0\nentries:\n  - id: C-001\n    statement: "API call follows v1"\n    sources:\n      - ref: EL-001#API\n        authority_domain: api-semantics\n        entailment: explicit\n    claim_kind: api\n    impact: medium\n    tier: T1\n    status: known-and-supported\n    constructs: [A.component]\n    validations: []\n`,
    );
    writeFileSync(
      join(dddDir, "trace-matrix.yaml"),
      `schema_version: 0.1.0\ntraces:\n  - id: TR-001\n    claim_id: C-001\n    construct_id: A.component\n    direction: forward\n`,
    );

    const report = sweep(dddDir, "reverse");
    expect(report.pass).toBe(true);
    expect(report.verdict).toBe("NOT_EVALUATED");
  });

  test("rejects a missing Book manifest", () => {
    unlinkSync(join(dddDir, "book.yaml"));
    writeFileSync(join(dddDir, "claims.yaml"), "schema_version: 0.1.0\nentries: []\n");

    const report = sweep(dddDir, "both");
    expect(report.violations.map((violation) => violation.type)).toContain("book-manifest-missing");
  });

  test("accepts complete T3 proof in the Assurance profile", async () => {
    writeFileSync(
      join(dddDir, "book.yaml"),
      `schema_version: 0.1.0\nmanifest_digest: sha256:${sha256Hex("\n")}\nprofile: assurance\n`,
    );
    await lockEvidence(dddDir, "https://example.com/auth/v1", {
      contentOverride: "# Verify tokens\n",
      version: "1.0.0",
      sections: ["Verify tokens"],
      authorityFor: ["security"],
    });
    writeFileSync(
      join(dddDir, "claims.yaml"),
      `schema_version: 0.1.0\nentries:\n  - id: C-001\n    statement: "Verify every token"\n    rationale: "Unverified tokens permit unauthorized access"\n    sources:\n      - ref: EL-001#Verify tokens\n        authority_domain: security\n        entailment: explicit\n    claim_kind: api\n    impact: critical\n    tier: T3\n    status: known-and-supported\n    constructs: [auth.verify]\n    validations: [V-001]\n`,
    );
    writeFileSync(
      join(dddDir, "trace-matrix.yaml"),
      `schema_version: 0.1.0\ntraces:\n  - id: TR-001\n    claim_id: C-001\n    construct_id: auth.verify\n    validation_id: V-001\n    direction: forward\n`,
    );
    mkdirSync(join(dddDir, "reports"), { recursive: true });
    writeFileSync(
      join(dddDir, "reports", "validations.yaml"),
      `schema_version: 0.1.0\nentries:\n  - id: V-001\n    claim: C-001\n    construct: auth.verify\n    method: test\n    target: test:verify-token\n    result: pass\n    run_at: 2026-08-30T12:00:00Z\n    evidence_hash: sha256:${"a".repeat(64)}\n`,
    );
    writeFileSync(
      join(dddDir, "reports", "refutation-C-001.yaml"),
      `schema_version: 0.1.0\nid: REF-001\nclaim_id: C-001\nrefuter_id: reviewer-1\nimplementer_id: implementer-1\nindependence_verified: true\noutcome: sustained\n`,
    );

    const report = sweep(dddDir, "both");
    expect(report.pass).toBe(true);
    expect(report.verdict).toBe("CONFORMANT_DECLARED_SCOPE");
  });

  test("rejects a stale Book artifact digest", () => {
    writeFileSync(join(workDir, "SPEC.md"), "current spec");
    writeFileSync(
      join(dddDir, "book.yaml"),
      `schema_version: 0.1.0\nmanifest_digest: sha256:deadbeef\nrequirements:\n  - path: SPEC.md\n    digest: sha256:${sha256Hex("old spec")}\n`,
    );
    writeFileSync(join(dddDir, "claims.yaml"), "schema_version: 0.1.0\nentries: []\n");

    const report = sweep(dddDir, "both");
    expect(report.violations.map((violation) => violation.type)).toContain(
      "manifest-artifact-digest-mismatch",
    );
    expect(report.violations.map((violation) => violation.type)).toContain("manifest-digest-mismatch");
  });
});

// ---------------------------------------------------------------------------
// drift_check
// ---------------------------------------------------------------------------

describe("drift_check", () => {
  test("parseFreshnessDays parses Nd windows", () => {
    expect(parseFreshnessDays("90d")).toBe(90);
    expect(parseFreshnessDays("365d")).toBe(365);
    expect(parseFreshnessDays("forever")).toBeNull();
  });

  test("reports stale, fresh, and inactive entries", () => {
    writeFileSync(join(dddDir, "evidence.lock"), LOCK_YAML);
    const report = driftCheck(dddDir);

    expect(report.entries_checked).toBe(2); // inactive entry excluded
    expect(report.stale_count).toBe(1);

    const byId = Object.fromEntries(report.entries.map((e) => [e.entry_id, e]));
    expect(byId["EL-001"].status).toBe("fresh");
    expect(byId["EL-002"].status).toBe("stale");
    expect(byId["EL-003"].status).toBe("inactive");
  });

  test("marks evidence stale exactly when its freshness window expires", () => {
    const retrievedAt = "2026-01-01T00:00:00.000Z";
    writeFileSync(
      join(dddDir, "evidence.lock"),
      `schema_version: 0.1.0\nentries:\n  - id: EL-001\n    source_url: https://example.com/api\n    retrieved_at: ${retrievedAt}\n    freshness: 1d\n`,
    );

    const report = driftCheck(dddDir, new Date("2026-01-02T00:00:00.000Z"));
    expect(report.entries[0].status).toBe("stale");
  });
});

// ---------------------------------------------------------------------------
// stubs
// ---------------------------------------------------------------------------

describe("stubs", () => {
  test("recognizes the stub primitives", () => {
    for (const name of ["discover", "refute", "exception", "obligation", "compile"]) {
      expect(isStubPrimitive(name)).toBe(true);
    }
    expect(isStubPrimitive("packet")).toBe(false);
    expect(isStubPrimitive("claim")).toBe(false);
    expect(isStubPrimitive("sweep")).toBe(false);
  });
});
