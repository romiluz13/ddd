import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { addException } from "../src/exception";
import { addGoal } from "../src/goal";
import { addObligation } from "../src/obligation";
import { addTrace } from "../src/trace";
import { addValidation, VALIDATION_METHODS } from "../src/validation";
import { parseYaml, readText, sha256Digest } from "../src/utils";

let workDir: string;
let dddDir: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), "ddd-writers-test-"));
  dddDir = join(workDir, ".ddd");
  mkdirSync(dddDir, { recursive: true });
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
        entailment: explicit
    constructs: [OrderList.component, ProductCard.component]
    validations: []

  - id: C-002
    statement: "Second claim"
    sources: []
    constructs: [Helper.util]
    validations: []
`;

function writeClaims(): void {
  writeFileSync(join(dddDir, "claims.yaml"), CLAIMS_YAML);
}

// ---------------------------------------------------------------------------
// validation
// ---------------------------------------------------------------------------

describe("validation", () => {
  test("records a validation with an auto-computed evidence hash", () => {
    writeClaims();
    writeFileSync(join(workDir, "test-file.ts"), "export const x = 1;\n");

    const record = addValidation(dddDir, {
      claimId: "C-001",
      construct: "OrderList.component",
      method: "test",
      target: "test-file.ts",
    });

    expect(record.id).toBe("V-001");
    expect(record.evidence_hash).toBe(sha256Digest("export const x = 1;\n"));
    expect(record.result).toBe("pass");

    const persisted = parseYaml(
      readText(join(dddDir, "reports", "validations.yaml")),
    ) as any;
    expect(persisted.entries).toHaveLength(1);
    expect(persisted.entries[0].claim).toBe("C-001");
    expect(persisted.entries[0].method).toBe("test");
  });

  test("links the validation id back into the claim", () => {
    writeClaims();
    writeFileSync(join(workDir, "test-file.ts"), "export const x = 1;\n");

    addValidation(dddDir, {
      claimId: "C-001",
      construct: "OrderList.component",
      method: "test",
      target: "test-file.ts",
    });

    const claims = parseYaml(readText(join(dddDir, "claims.yaml"))) as any;
    expect(claims.entries[0].validations).toEqual(["V-001"]);
    expect(claims.entries[1].validations).toEqual([]);
  });

  test("rejects a construct that is not declared on the claim", () => {
    writeClaims();
    writeFileSync(join(workDir, "test-file.ts"), "export const x = 1;\n");

    expect(() =>
      addValidation(dddDir, {
        claimId: "C-001",
        construct: "Unknown.component",
        method: "test",
        target: "test-file.ts",
      }),
    ).toThrow(/not declared on claim C-001/);
    expect(() =>
      addValidation(dddDir, {
        claimId: "C-001",
        construct: "Unknown.component",
        method: "test",
        target: "test-file.ts",
      }),
    ).toThrow(/OrderList.component, ProductCard.component/);
  });

  test("rejects an unknown claim, method, and missing target", () => {
    writeClaims();
    writeFileSync(join(workDir, "test-file.ts"), "export const x = 1;\n");

    expect(() =>
      addValidation(dddDir, {
        claimId: "C-999",
        construct: "OrderList.component",
        method: "test",
        target: "test-file.ts",
      }),
    ).toThrow(/C-999 not found/);
    expect(() =>
      addValidation(dddDir, {
        claimId: "C-001",
        construct: "OrderList.component",
        method: "vibe-check",
        target: "test-file.ts",
      }),
    ).toThrow(/vibe-check/);
    expect(() =>
      addValidation(dddDir, {
        claimId: "C-001",
        construct: "OrderList.component",
        method: "test",
        target: "missing-file.ts",
      }),
    ).toThrow(/--target "missing-file.ts"/);
  });

  test("accepts an explicit artifact digest for non-file targets", () => {
    writeClaims();
    const digest = sha256Digest("pipeline-run-42");

    const record = addValidation(dddDir, {
      claimId: "C-001",
      construct: "OrderList.component",
      method: "runtime-assertion",
      target: "pipeline://runs/42",
      evidenceHash: digest,
    });

    expect(record.evidence_hash).toBe(digest);
    expect(() =>
      addValidation(dddDir, {
        claimId: "C-001",
        construct: "OrderList.component",
        method: "test",
        target: "pipeline://runs/42",
        evidenceHash: "deadbeef",
      }),
    ).toThrow(/sha256:<64 lowercase hex>/);
  });

  test("method enum covers the closed set", () => {
    expect([...VALIDATION_METHODS]).toEqual([
      "test",
      "lint",
      "type-check",
      "formal",
      "manual",
      "runtime-assertion",
    ]);
  });
});

// ---------------------------------------------------------------------------
// goal
// ---------------------------------------------------------------------------

describe("goal", () => {
  test("declares a claim as a case goal and is idempotent per claim", () => {
    writeClaims();

    const entry = addGoal(dddDir, "C-001");
    const again = addGoal(dddDir, "C-001");

    expect(entry.id).toBe("GOAL-001");
    expect(again.id).toBe("GOAL-001");
    expect(entry.claim).toBe("C-001");
    expect(entry.statement).toBe("Server components cannot use browser-only APIs");

    const goals = parseYaml(readText(join(dddDir, "goals.yaml"))) as any;
    expect(goals.goals).toHaveLength(1);

    const second = addGoal(dddDir, "C-002");
    expect(second.id).toBe("GOAL-002");
    const refreshed = parseYaml(readText(join(dddDir, "goals.yaml"))) as any;
    expect(refreshed.goals).toHaveLength(2);
  });

  test("rejects an unknown claim", () => {
    writeClaims();
    expect(() => addGoal(dddDir, "C-999")).toThrow(/C-999 not found/);
    expect(existsSync(join(dddDir, "goals.yaml"))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// exception
// ---------------------------------------------------------------------------

describe("exception", () => {
  test("records an approved, time-boxed waiver for a goal claim", () => {
    writeClaims();

    const entry = addException(dddDir, "C-001", {
      rationale: "Vendor doc gap accepted until docs land",
      owner: "release-owner",
      expiresAt: "2999-12-31",
    });

    expect(entry.id).toBe("EXC-001");
    expect(entry.status).toBe("approved");
    expect(entry.expires_at).toBe("2999-12-31");

    const exceptions = parseYaml(readText(join(dddDir, "exceptions.yaml"))) as any;
    expect(exceptions.exceptions).toHaveLength(1);
    expect(exceptions.exceptions[0].owner).toBe("release-owner");
  });

  test("rejects past dates, malformed dates, and unknown goal claims", () => {
    writeClaims();

    expect(() =>
      addException(dddDir, "C-001", {
        rationale: "r",
        owner: "o",
        expiresAt: "2000-01-01",
      }),
    ).toThrow(/not in the future/);
    expect(() =>
      addException(dddDir, "C-001", {
        rationale: "r",
        owner: "o",
        expiresAt: "next tuesday",
      }),
    ).toThrow(/not a valid ISO date/);
    expect(() =>
      addException(dddDir, "C-999", {
        rationale: "r",
        owner: "o",
        expiresAt: "2999-12-31",
      }),
    ).toThrow(/C-999 not found/);
  });

  test("requires rationale and owner", () => {
    writeClaims();
    expect(() =>
      addException(dddDir, "C-001", {
        rationale: "",
        owner: "o",
        expiresAt: "2999-12-31",
      }),
    ).toThrow(/rationale/);
    expect(() =>
      addException(dddDir, "C-001", {
        rationale: "r",
        owner: "",
        expiresAt: "2999-12-31",
      }),
    ).toThrow(/owner/);
  });
});

// ---------------------------------------------------------------------------
// obligation
// ---------------------------------------------------------------------------

describe("obligation", () => {
  test("binds a defeater to an issue and is idempotent per pair", () => {
    const entry = addObligation(dddDir, "stack:dependency:ai", {
      issue: "https://github.com/org/repo/issues/12",
      description: "Pin and document the AI SDK version",
      dueAt: "2999-12-31",
    });
    const again = addObligation(dddDir, "stack:dependency:ai", {
      issue: "https://github.com/org/repo/issues/12",
    });

    expect(entry.id).toBe("OB-001");
    expect(again.id).toBe("OB-001");

    const obligations = parseYaml(readText(join(dddDir, "obligations.yaml"))) as any;
    expect(obligations.obligations).toHaveLength(1);
    expect(obligations.obligations[0].issue).toBe("https://github.com/org/repo/issues/12");

    const other = addObligation(dddDir, "stack:service:payments", {
      issue: "https://github.com/org/repo/issues/13",
    });
    expect(other.id).toBe("OB-002");
  });

  test("rejects non-URL issues and malformed due dates", () => {
    expect(() => addObligation(dddDir, "d", { issue: "not-a-url" })).toThrow(/http\(s\) issue URL/);
    expect(() =>
      addObligation(dddDir, "d", { issue: "https://x.example/1", dueAt: "soon" }),
    ).toThrow(/valid ISO date/);
  });
});

// ---------------------------------------------------------------------------
// trace write-time contract
// ---------------------------------------------------------------------------

describe("trace", () => {
  test("accepts a construct declared on the claim", () => {
    writeClaims();
    const entry = addTrace(dddDir, "C-001", "OrderList.component");
    expect(entry.claim_id).toBe("C-001");
    expect(entry.construct_id).toBe("OrderList.component");
  });

  test("rejects a construct that is not declared on the claim", () => {
    writeClaims();
    expect(() => addTrace(dddDir, "C-001", "Unknown.component")).toThrow(
      /not declared on claim C-001/,
    );
    // The rejection message lists the declared constructs.
    expect(() => addTrace(dddDir, "C-001", "Unknown.component")).toThrow(
      /OrderList.component, ProductCard.component/,
    );
  });
});
