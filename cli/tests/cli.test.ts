import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { parseYaml, sha256Hex } from "../src/utils";

let workDir: string;
let dddDir: string;
const cliPath = resolve(import.meta.dir, "../bin/ddd.ts");

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), "ddd-cli-integration-"));
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

function runCli(...args: string[]) {
  return Bun.spawnSync({
    cmd: [process.execPath, cliPath, ...args, "--ddd-dir", dddDir],
    cwd: workDir,
    stdout: "pipe",
    stderr: "pipe",
  });
}

function runGit(...args: string[]): string {
  const result = Bun.spawnSync({
    cmd: ["git", "-C", workDir, ...args],
    stdout: "pipe",
    stderr: "pipe",
  });
  if (result.exitCode !== 0) throw new Error(result.stderr.toString());
  return result.stdout.toString();
}

describe("external API documentation workflow", () => {
  test("lock preserves the exact reviewed content in the content-addressed cache", () => {
    const sourcePath = join(workDir, "vendor-api.md");
    const content = "# Widget API v2\n\n`createWidget()` returns a Widget.\n";
    writeFileSync(sourcePath, content);

    const result = runCli(
      "lock",
      "https://docs.example.com/widget/v2",
      "--content-file",
      sourcePath,
      "--product",
      "Widget API",
      "--ref",
      "REF-001",
      "--subject",
      "widget-api",
      "--version",
      "2.0.0",
      "--sections",
      "createWidget",
      "--authority",
      "api-semantics",
    );

    expect(result.exitCode).toBe(0);
    const entry = JSON.parse(result.stdout.toString());
    const expectedDigest = `sha256:${sha256Hex(content)}`;
    const expectedCachePath = `cache/${sha256Hex(content).slice(0, 16)}.md`;

    expect(entry.content_digest).toBe(expectedDigest);
    expect(entry.doc_version).toBe("2.0.0");
    expect(entry.ref).toBe("REF-001");
    expect(entry.subject).toBe("widget-api");
    expect(entry.cache_path).toBe(expectedCachePath);
    expect(readFileSync(join(dddDir, expectedCachePath), "utf8")).toBe(content);

    const lock = parseYaml(readFileSync(join(dddDir, "evidence.lock"), "utf8")) as any;
    expect(lock.entries[0].cache_path).toBe(expectedCachePath);
    expect(existsSync(join(dddDir, expectedCachePath))).toBe(true);
  });

  test("lock rejects external documentation without an explicit version", () => {
    const sourcePath = join(workDir, "vendor-api.md");
    writeFileSync(sourcePath, "# Widget API\n");

    const result = runCli(
      "lock",
      "https://docs.example.com/widget",
      "--content-file",
      sourcePath,
      "--product",
      "Widget API",
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr.toString()).toContain("--version is required for external documentation");
    expect(existsSync(join(dddDir, "evidence.lock"))).toBe(false);
  });

  test("lock rejects source classes that cannot serve as external evidence", () => {
    const sourcePath = join(workDir, "waiver.md");
    writeFileSync(sourcePath, "Approved risk acceptance");

    const result = runCli(
      "lock",
      "https://example.com/waiver",
      "--content-file",
      sourcePath,
      "--source-class",
      "waiver",
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr.toString()).toContain("--source-class must be one of");
  });

  test("lock rejects ambiguous versions and invalid provenance enums", () => {
    const sourcePath = join(workDir, "vendor-api.md");
    writeFileSync(sourcePath, "# API\n");

    const ambiguous = runCli(
      "lock",
      "https://example.com/api",
      "--content-file",
      sourcePath,
      "--version",
      "Latest",
    );
    expect(ambiguous.exitCode).toBe(1);

    const invalidIndependence = runCli(
      "lock",
      "https://example.com/api",
      "--content-file",
      sourcePath,
      "--version",
      "1.0.0",
      "--independence",
      "agent-unapproved",
    );
    expect(invalidIndependence.exitCode).toBe(1);
    expect(invalidIndependence.stderr.toString()).toContain("Unsupported evidence independence");

    const invalidStatus = runCli(
      "lock",
      "https://example.com/api",
      "--content-file",
      sourcePath,
      "--version",
      "1.0.0",
      "--status",
      "draft",
    );
    expect(invalidStatus.exitCode).toBe(1);
    expect(invalidStatus.stderr.toString()).toContain("Unsupported evidence status");
  });

  test("claim records a tiered API claim against active locked evidence", () => {
    const sourcePath = join(workDir, "vendor-api.md");
    writeFileSync(sourcePath, "# Widget API v2\n\n`createWidget()` returns a Widget.\n");
    const lockResult = runCli(
      "lock",
      "https://docs.example.com/widget/v2",
      "--content-file",
      sourcePath,
      "--version",
      "2.0.0",
      "--sections",
      "createWidget",
      "--authority",
      "api-semantics",
    );
    expect(lockResult.exitCode).toBe(0);

    const claimResult = runCli(
      "claim",
      "createWidget() returns a Widget",
      "--source",
      "EL-001#createWidget",
      "--authority",
      "api-semantics",
      "--kind",
      "api",
      "--impact",
      "medium",
      "--entailment",
      "explicit",
      "--construct",
      "src/widget.ts#createWidget",
    );

    expect(claimResult.exitCode).toBe(0);
    const claim = JSON.parse(claimResult.stdout.toString());
    expect(claim.id).toBe("C-001");
    expect(claim.tier).toBe("T1");
    expect(claim.sources[0].ref).toBe("EL-001#createWidget");

    const ledger = parseYaml(readFileSync(join(dddDir, "claims.yaml"), "utf8")) as any;
    expect(ledger.entries[0].constructs).toEqual(["src/widget.ts#createWidget"]);
  });

  test("claim rejects unapproved self-authored evidence", () => {
    const sourcePath = join(workDir, "proposal.md");
    writeFileSync(sourcePath, "# Proposed API\n\n## Create\n\nCreates a widget.\n");
    expect(
      runCli(
        "lock",
        "https://example.com/proposal/v1",
        "--content-file",
        sourcePath,
        "--version",
        "1.0.0",
        "--sections",
        "Create",
        "--authority",
        "api-semantics",
        "--independence",
        "agent-authored-unapproved",
      ).exitCode,
    ).toBe(0);

    const result = runCli(
      "claim",
      "Creates a widget",
      "--source",
      "EL-001#Create",
      "--authority",
      "api-semantics",
      "--kind",
      "api",
      "--impact",
      "medium",
      "--entailment",
      "explicit",
    );
    expect(result.exitCode).toBe(1);
    expect(result.stderr.toString()).toContain("invalid or unapproved independence");
  });

  test("packet assembles only requested claims and their locked external evidence", () => {
    const sourcePath = join(workDir, "vendor-api.md");
    writeFileSync(sourcePath, "# Widget API v2\n\n`createWidget()` returns a Widget.\n");
    expect(
      runCli(
        "lock",
        "https://docs.example.com/widget/v2",
        "--content-file",
        sourcePath,
        "--version",
        "2.0.0",
        "--sections",
        "createWidget",
        "--authority",
        "api-semantics",
      ).exitCode,
    ).toBe(0);
    expect(
      runCli(
        "claim",
        "createWidget() returns a Widget",
        "--source",
        "EL-001#createWidget",
        "--authority",
        "api-semantics",
        "--kind",
        "api",
        "--impact",
        "medium",
        "--entailment",
        "explicit",
      ).exitCode,
    ).toBe(0);

    const result = runCli("packet", "CH-001", "--claims", "C-001", "--max-chars", "1000");

    expect(result.exitCode).toBe(0);
    const packet = JSON.parse(result.stdout.toString());
    expect(packet.claims).toEqual(["C-001"]);
    expect(packet.evidence).toEqual(["EL-001"]);
    expect(packet.evidence_files).toEqual(["cache/8fe8c8c5b17ef361.md"]);
    expect(packet.context_budget.max_chars).toBe(1000);
    expect(packet.context_budget.content_chars).toBeGreaterThan(0);
    expect(packet.validations_required).toEqual([]);
    expect(packet.packet_digest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(existsSync(join(dddDir, "packets", "PKT-001.yaml"))).toBe(true);
  });

  test("claim requires rationale for implicit entailment", () => {
    const sourcePath = join(workDir, "vendor-api.md");
    writeFileSync(sourcePath, "# Widget API v2\n\n## createWidget\n\nReturns a Widget.\n");
    expect(
      runCli(
        "lock",
        "https://docs.example.com/widget/v2",
        "--content-file",
        sourcePath,
        "--version",
        "2.0.0",
        "--sections",
        "createWidget",
        "--authority",
        "api-semantics",
      ).exitCode,
    ).toBe(0);

    const result = runCli(
      "claim",
      "A successful call creates one widget",
      "--source",
      "EL-001#createWidget",
      "--authority",
      "api-semantics",
      "--kind",
      "api",
      "--impact",
      "medium",
      "--entailment",
      "implicit",
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr.toString()).toContain("Implicit entailment requires --rationale");
  });

  test("claim requires rationale for T3", () => {
    const sourcePath = join(workDir, "vendor-auth.md");
    writeFileSync(sourcePath, "# Authentication\n\n## Verify\n\nVerify tokens.\n");
    expect(
      runCli(
        "lock",
        "https://docs.example.com/auth/v1",
        "--content-file",
        sourcePath,
        "--version",
        "1.0.0",
        "--sections",
        "Verify",
        "--authority",
        "security",
      ).exitCode,
    ).toBe(0);

    const result = runCli(
      "claim",
      "Tokens must be verified",
      "--source",
      "EL-001#Verify",
      "--authority",
      "security",
      "--kind",
      "operational",
      "--impact",
      "critical",
      "--entailment",
      "explicit",
    );
    expect(result.exitCode).toBe(1);
    expect(result.stderr.toString()).toContain("T3 claims require --rationale");
  });

  test("packet rejects retracted claims", () => {
    const sourcePath = join(workDir, "vendor-api.md");
    writeFileSync(sourcePath, "# API\n\n## Create\n\nCreates a widget.\n");
    expect(
      runCli(
        "lock",
        "https://docs.example.com/api/v1",
        "--content-file",
        sourcePath,
        "--version",
        "1.0.0",
        "--sections",
        "Create",
        "--authority",
        "api-semantics",
      ).exitCode,
    ).toBe(0);
    expect(
      runCli(
        "claim",
        "Creates a widget",
        "--source",
        "EL-001#Create",
        "--authority",
        "api-semantics",
        "--kind",
        "api",
        "--impact",
        "medium",
        "--entailment",
        "explicit",
      ).exitCode,
    ).toBe(0);
    const claimsPath = join(dddDir, "claims.yaml");
    writeFileSync(
      claimsPath,
      readFileSync(claimsPath, "utf8").replace(
        "status: known-and-supported",
        "status: retracted",
      ),
    );

    const result = runCli("packet", "CH-001", "--claims", "C-001");
    expect(result.exitCode).toBe(1);
    expect(result.stderr.toString()).toContain("not active supported evidence");
  });

  test("sweep reports conformance only for the declared external-doc scope", () => {
    const sourcePath = join(workDir, "vendor-api.md");
    writeFileSync(sourcePath, "# Widget API v2\n\n`createWidget()` returns a Widget.\n");
    expect(
      runCli(
        "lock",
        "https://docs.example.com/widget/v2",
        "--content-file",
        sourcePath,
        "--version",
        "2.0.0",
        "--sections",
        "createWidget",
        "--authority",
        "api-semantics",
      ).exitCode,
    ).toBe(0);
    expect(
      runCli(
        "claim",
        "createWidget() returns a Widget",
        "--source",
        "EL-001#createWidget",
        "--authority",
        "api-semantics",
        "--kind",
        "api",
        "--impact",
        "medium",
        "--entailment",
        "explicit",
        "--construct",
        "src/widget.ts#createWidget",
      ).exitCode,
    ).toBe(0);
    expect(runCli("trace", "C-001", "src/widget.ts#createWidget").exitCode).toBe(0);

    const result = runCli("sweep", "--direction", "both");

    expect(result.exitCode).toBe(0);
    const report = JSON.parse(result.stdout.toString());
    expect(report.pass).toBe(true);
    expect(report.verdict).toBe("CONFORMANT_DECLARED_SCOPE");
    expect(report.scope).toBe("declared-constructs");
    expect(report.capabilities.entailment).toBe("recorded-attestation");
    expect(report.capabilities.reverse_sweep).toBe("declared-constructs-only");
  });

  test("sweep fails a T3 claim without validation and independent refutation", () => {
    const sourcePath = join(workDir, "vendor-auth.md");
    writeFileSync(
      sourcePath,
      "# Authentication API v4\n\n## Token verification\n\nTokens must be verified before use.\n",
    );
    expect(
      runCli(
        "lock",
        "https://docs.example.com/auth/v4",
        "--content-file",
        sourcePath,
        "--version",
        "4.0.0",
        "--sections",
        "Token verification",
        "--authority",
        "security",
      ).exitCode,
    ).toBe(0);
    expect(
      runCli(
        "claim",
        "Tokens must be verified before use",
        "--source",
        "EL-001#Token verification",
        "--authority",
        "security",
        "--kind",
        "api",
        "--impact",
        "critical",
        "--entailment",
        "explicit",
        "--rationale",
        "Authentication failures are security-critical",
        "--construct",
        "src/auth.ts#verifyToken",
      ).exitCode,
    ).toBe(0);
    expect(runCli("trace", "C-001", "src/auth.ts#verifyToken").exitCode).toBe(0);

    const result = runCli("sweep");

    expect(result.exitCode).toBe(1);
    const report = JSON.parse(result.stdout.toString());
    expect(report.pass).toBe(false);
    const violationTypes = report.violations.map((violation: any) => violation.type);
    expect(violationTypes).toContain("claim-without-validation");
    expect(violationTypes).toContain("t3-not-allowed-in-lite");
    expect(violationTypes).toContain("t3-without-refutation");
  });
});

describe("change assurance workflow", () => {
  test("scopes, builds, and evaluates a supported change", () => {
    mkdirSync(join(workDir, "src"), { recursive: true });
    runGit("init");
    writeFileSync(join(workDir, "src", "widget.ts"), "export function createWidget() { return 1; }\n");
    runGit("add", "src/widget.ts");
    runGit("-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "base");
    const base = runGit("rev-parse", "HEAD").trim();
    writeFileSync(join(workDir, "src", "widget.ts"), "export function createWidget() { return 2; }\n");
    runGit("add", "src/widget.ts");
    runGit("-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "head");
    const head = runGit("rev-parse", "HEAD").trim();

    const evidenceContent = "# Widget API v2\n\ncreateWidget is supported.\n";
    mkdirSync(join(dddDir, "cache"), { recursive: true });
    writeFileSync(join(dddDir, "cache", "widget.md"), evidenceContent);
    writeFileSync(
      join(dddDir, "evidence.lock"),
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
      join(dddDir, "claims.yaml"),
      `schema_version: 0.1.0
entries:
  - id: C-001
    statement: "Use createWidget from v2"
    status: known-and-supported
    tier: T1
    sources:
      - ref: EL-001#createWidget
        authority_domain: api-semantics
        entailment: explicit
    constructs: [src/widget.ts#createWidget]
    validations: []
`,
    );
    writeFileSync(
      join(dddDir, "trace-matrix.yaml"),
      `schema_version: 0.1.0
traces:
  - id: TR-001
    claim_id: C-001
    construct_id: src/widget.ts#createWidget
    direction: forward
`,
    );

    const scoped = runCli("scope-change", "--base", base, "--head", head);
    expect(scoped.exitCode).toBe(0);
    expect(JSON.parse(scoped.stdout.toString()).id).toBe("ENV-001");

    const built = runCli("build-case", "ENV-001");
    expect(built.exitCode).toBe(0);
    expect(JSON.parse(built.stdout.toString()).id).toBe("CASE-001");

    const evaluated = runCli("evaluate-case", "CASE-001");
    expect(evaluated.exitCode).toBe(0);
    expect(JSON.parse(evaluated.stdout.toString()).verdict).toBe("SATISFIED");
    expect(existsSync(join(dddDir, "reports", "CASE-001.assurance.json"))).toBe(true);
  });
});

describe("installation diagnostics", () => {
  test("doctor rejects a stale installed skill copy", () => {
    mkdirSync(join(workDir, "skills", "ddd"), { recursive: true });
    mkdirSync(join(workDir, ".factory", "skills", "ddd"), { recursive: true });
    mkdirSync(join(workDir, ".factory", "skills", "ddd-refute"), { recursive: true });
    writeFileSync(join(workDir, "skills", "ddd", "SKILL.md"), "version: 0.5.0\n");
    writeFileSync(
      join(workDir, ".factory", "skills", "ddd", "SKILL.md"),
      "version: 0.2.6\n",
    );
    writeFileSync(
      join(workDir, ".factory", "skills", "ddd-refute", "SKILL.md"),
      "version: 0.3.0\n",
    );

    const stale = runCli("doctor");

    expect(stale.exitCode).toBe(1);
    expect(JSON.parse(stale.stdout.toString()).checks).toContainEqual(
      expect.objectContaining({ skill: "ddd", status: "mismatch" }),
    );
    expect(JSON.parse(stale.stdout.toString()).checks).toContainEqual(
      expect.objectContaining({ skill: "ddd-refute", status: "unexpected" }),
    );

    writeFileSync(
      join(workDir, ".factory", "skills", "ddd", "SKILL.md"),
      "version: 0.5.0\n",
    );
    rmSync(join(workDir, ".factory", "skills", "ddd-refute"), { recursive: true });
    mkdirSync(join(workDir, "skills", "ddd", "references"), { recursive: true });
    mkdirSync(join(workDir, ".factory", "skills", "ddd", "references"), {
      recursive: true,
    });
    writeFileSync(join(workDir, "skills", "ddd", "references", "guide.md"), "current\n");
    writeFileSync(
      join(workDir, ".factory", "skills", "ddd", "references", "guide.md"),
      "stale\n",
    );
    const staleReference = runCli("doctor");

    expect(staleReference.exitCode).toBe(1);
    expect(JSON.parse(staleReference.stdout.toString()).checks).toContainEqual(
      expect.objectContaining({ skill: "ddd", status: "mismatch" }),
    );

    writeFileSync(
      join(workDir, ".factory", "skills", "ddd", "references", "guide.md"),
      "current\n",
    );
    const current = runCli("doctor");

    expect(current.exitCode).toBe(0);
    expect(JSON.parse(current.stdout.toString()).pass).toBe(true);
  });

  test("doctor rejects a stale source skill lock hash", () => {
    mkdirSync(join(workDir, "skills", "ddd"), { recursive: true });
    const content = "version: 0.5.0\n";
    writeFileSync(join(workDir, "skills", "ddd", "SKILL.md"), content);
    writeFileSync(
      join(workDir, "skills-lock.json"),
      JSON.stringify({
        version: 1,
        skills: { ddd: { computedHash: "deadbeef" } },
      }),
    );

    const stale = runCli("doctor");

    expect(stale.exitCode).toBe(1);
    expect(JSON.parse(stale.stdout.toString()).lock_checks).toContainEqual(
      expect.objectContaining({ skill: "ddd", status: "mismatch" }),
    );

    writeFileSync(
      join(workDir, "skills-lock.json"),
      JSON.stringify({
        version: 1,
        skills: { ddd: { computedHash: sha256Hex(`SKILL.md${content}`) } },
      }),
    );
    const current = runCli("doctor");

    expect(current.exitCode).toBe(0);
  });
});
