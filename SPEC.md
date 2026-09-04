# Proofline change assurance specification

**Version:** 0.5.0-experimental

**Status:** Implemented kernel, experimental boundary detection
**Machine identifier:** `proofline-change-assurance`

Proofline builds and evaluates change-bounded assurance cases. The legacy
`ddd` command and `.ddd/` directory remain compatibility interfaces.

## 1. Supported product boundary

The production-supported workflow checks declared external API or protocol
usage against immutable, version-matched evidence:

```text
lock evidence → record claims → trace constructs → evaluate declared scope
```

A successful legacy sweep means only:

> The declared API or protocol usage is supported by the cited,
> version-matched external contract under the reported checks.

The TypeScript/Bun assurance-case workflow is experimental:

```text
scope-change → build-case → evaluate-case
```

It adds an independently generated Git change boundary, typed provenance,
derivation lineage, and four-valued verdicts. It does not establish
repository-wide, behavioral, architectural, or semantic correctness.

### 1.1 Current limitations

- Changed-symbol discovery supports TypeScript-family declarations.
- Internal contract detection supports explicit OpenAPI and JSON Schema files.
- Internal contract compatibility evaluation is not implemented.
- Bare dependency imports are detected; transitive dependency impact analysis
  is not implemented.
- External services are detected only when changed source contains literal HTTP
  URLs. Dynamic endpoints MUST be declared in `.ddd/stack.yaml`.
- Platform constraints and interaction analysis are recorded attestations; the
  evaluator verifies their presence and coverage, not their semantic truth.
- Semantic entailment remains a recorded attestation.
- The legacy reverse sweep covers declared constructs only.
- Evidence freshness is the only implemented drift dimension.
- `discover`, `refute`, and `compile` remain stubs.

Anything outside these capabilities is `not-evaluated`, never an implicit pass.

### 1.2 Research boundary

Domain modeling, brownfield audit, design tournaments, adversarial refutation,
control compilation, broad drift, object passports, federation, and the
universal internal-artifact registry are research. They are not part of the
supported product contract. The superseded broad specification is preserved at
[`research/SPEC-0.3.md`](research/SPEC-0.3.md).

## 2. Terms

| Term | Meaning |
|---|---|
| Change envelope | Git base/head range, changed files and symbols, affected contracts, exclusions, and boundary confidence. |
| Assurance case | A typed graph of goals, evidence, implementation, validation, observations, decisions, and exceptions for one change. |
| Goal | A requirement the change must satisfy. |
| Provenance | Origin, actor, tool, revision, and capture time for a graph node. |
| Defeater | A contradiction, unknown, or missing premise that prevents an unqualified result. |
| Waiver | Accountable, time-boxed acceptance of residual risk. A waiver is not evidence of correctness, and an expired waiver is invalid. |
| Capability | A check the evaluator can enforce, record by attestation, or leave unevaluated. |
| Stack component | A dependency, external service, runtime platform, or frontend layer that the change may exercise. |
| Open gap | A named unknown that blocks assurance until resolved. |

## 3. Epistemic invariants

1. Source origin and epistemic role are independent.
2. Descriptive evidence cannot terminate a normative support chain.
3. Derivation lineage is explicit and transitive.
4. Evidence cannot support a goal implemented by a construct from which that
   evidence derives.
5. Generated output may become a prospective baseline, but it cannot prove its
   generating revision.
6. Human approval records acceptance, not independence.
7. Observations and validations report behavior; they do not establish intent.
8. Unevaluated required capabilities produce `INDETERMINATE`.
9. Gaps are measured against the change envelope.
10. Exceptions authorize residual risk; they do not establish correctness.
11. Adapters emit facts. Only the policy evaluator emits a verdict.

## 4. Change envelope

`scope-change` creates `.ddd/cases/ENV-NNN.json`.

```ts
interface ChangeEnvelope {
  schema_version: "0.4.0" | "0.5.0";
  id: string;
  base_revision: string;
  head_revision: string;
  changed_files: string[];
  changed_symbols: string[];
  boundary_files?: string[];
  declared_dependencies: string[];
  declared_dependency_versions: Record<string, string[]>;
  affected_dependencies: string[];
  affected_services: string[];
  affected_platforms: string[];
  affected_contracts: string[];
  frontend_files: string[];
  known_consumers: string[];
  risk: "low" | "medium" | "high" | "critical";
  owner: string | null;
  exclusions: Array<{ construct: string; reason: string }>;
  boundary_confidence: "complete" | "partial" | "unknown";
  detector: { name: string; version: string };
  created_at: string;
}
```

The detector MUST resolve both revisions before producing an envelope. Every
changed symbol MUST be covered by an implementation node or named in an
exclusion. Unsupported changed file classes lower boundary confidence.

Scoping is idempotent per resolved (base, head) range: re-running
`scope-change` with the same revisions returns the existing envelope instead
of duplicating lineage.

`boundary_files` (0.5.0) lists changed files that exercise the declared
external stack: they import a declared dependency or embed a literal external
service URL. Changed symbols in these files are boundary-relevant; changed
symbols in other files are internal and are partitioned as
`outside-boundary`, below the supported assurance boundary. 0.4.0 envelopes
carry no `boundary_files`, so every changed symbol remains
boundary-relevant.

### 4.1 Stack coverage

`scope-change` inventories dependencies declared in the head revision and
detects changed dependency imports, literal external-service URLs, known
platform configuration, and frontend files. Dynamic services and architecture
components that cannot be derived from source MUST be declared in
`.ddd/stack.yaml`.

```yaml
schema_version: 0.5.0
components:
  - id: STK-001
    kind: dependency # dependency | service | platform | frontend
    name: ai
    versions: ["5.0.0"]
    evidence_refs: [EL-004]
  - id: STK-002
    kind: platform
    name: cloudflare-workers
    evidence_refs: [EL-001]
    required_constraints: [execution-time, concurrency]
    constraints:
      - name: execution-time
        evidence_refs: [EL-003]
      - name: concurrency
        evidence_refs: [EL-003]
```

Every declared or detected stack component MUST have locked evidence whose
`subject` exactly names the component. Dependency components MUST record every
declared version and cite evidence with a matching `version`. Platform
components MUST also cite subject-matched evidence for runtime constraints such
as execution, memory, concurrency, network, or rate limits.

Every external `references` entry in `.ddd/book.yaml` MUST map to locked
evidence through the evidence entry's `ref` and a matching or descendant source
URL.

Every gap in `.ddd/knowledge-map.yaml` is an open defeater. A gap MUST be
resolved before evaluation. Until a machine command for approved gap waivers is
implemented, a gap cannot be cleared by merely labeling it accepted.

When a change spans stack-component kinds, `.ddd/interactions.yaml` MUST record
the analyzed interaction with a rationale:

```yaml
interactions:
  - id: INT-001
    components: [platform:cloudflare-workers, service:grove.example]
    status: analyzed
    rationale: "Checked provider latency against platform request limits."
```

## 5. Assurance case

`build-case` creates `.ddd/cases/CASE-NNN.json`.

### 5.1 Node types

- `requirement`
- `contract`
- `implementation`
- `observation`
- `validation`
- `decision`
- `exception`

Each node records:

```ts
interface AssuranceNode {
  id: string;
  node_type: NodeType;
  label: string;
  epistemic_role:
    | "normative"
    | "descriptive"
    | "observation"
    | "validation"
    | "implementation"
    | "waiver";
  approval_state: "approved" | "proposed" | "rejected" | "not-applicable";
  derived_from: string[];
  provenance: {
    origin: "external" | "project" | "generated" | "runtime" | "human";
    actor: string;
    tool: string;
    revision: string;
    captured_at: string;
  };
}
```

Implementation nodes may also carry a construct and one coverage status:
`covered`, `descriptive-only`, `gap`, `exempt`, `grandfathered`, or
`outside-boundary`.

### 5.2 Edge types

- `supports`
- `constrains`
- `implements`
- `validates`
- `derived_from`
- `contradicts`
- `affects`
- `waives`

All edge endpoints MUST exist. The graph formed by `supports` and
`derived_from` edges MUST be acyclic.

### 5.3 Case fields

An assurance case contains the envelope, goal node IDs, nodes, edges,
defeaters, capability statuses, required capabilities, obligations, and
creation time.

Case goals are the change-matched claims plus every claim declared in
`.ddd/goals.yaml`, so a case always has reachable goals even when the
changed-symbol matching finds no relevant claims.

Exception nodes carry `expires_at`. Approved waivers for case goals are
bridged into the case with `waives` edges; an expired or untime-boxed waiver
is invalid at evaluation time.

Obligations from `.ddd/obligations.yaml` bind this case's open defeaters to
tracking issues. An obligation records that evidence is coming; it does not
resolve the defeater, and an obligation-backed defeater still yields
`INDETERMINATE` until the evidence lands.

Capability status is one of:

- `tool-enforced`
- `recorded-attestation`
- `not-evaluated`

## 6. Policy evaluation

`evaluate-case` writes `.ddd/reports/CASE-NNN.assurance.json`.

The evaluator MUST check:

- unique graph identities, valid endpoints, goal types, and acyclicity;
- transitive derivation and self-support;
- normative support admissibility;
- retrospective baselines;
- goal support and contradictions;
- changed-symbol coverage and explicit exclusions;
- boundary confidence;
- unresolved defeaters;
- required capability coverage;
- waiver approval, actor, rationale, and time box (an expired waiver is
  invalid);
- stack component evidence coverage;
- Book reference-to-evidence completeness;
- open knowledge-map gaps;
- platform constraint evidence;
- frontend evidence coverage;
- cross-layer interaction analysis.

High-risk envelopes require at least T2 validation for every goal. Critical
envelopes require T3 validation and a reviewer distinct from the implementer,
even when a persisted goal declares a lower tier.

### 6.1 Verdicts

| Verdict | Meaning |
|---|---|
| `SATISFIED` | Goals inside a complete enumerated boundary have admissible support, and every required capability was evaluated. |
| `UNSATISFIED` | A hard invariant failed or a goal is contradicted. |
| `INDETERMINATE` | A boundary, premise, goal, defeater, or required capability is incomplete. |
| `WAIVED` | No hard invariant failed, and an accountable human accepted the specified residual risk. |

`SATISFIED` and `WAIVED` exit zero. `UNSATISFIED` and `INDETERMINATE` exit
non-zero.

Every report records the evaluated boundary, boundary confidence, supported and
unevaluated capabilities, open defeaters, approved exceptions, open
obligations, and violations. Violations carry a `resolution` hint naming the
exact command or action that resolves them. The CLI prints a human summary of
the verdict and violation counts on stderr; the JSON report remains the only
stdout output.

## 7. Legacy external-evidence artifacts

The compatibility kernel stores:

- `.ddd/evidence.lock`: immutable source provenance and captured-content digest;
- `.ddd/cache/`: exact reviewed source content;
- `.ddd/claims.yaml`: atomic claims and source citations;
- `.ddd/trace-matrix.yaml`: declared claim-to-construct links;
- `.ddd/goals.yaml`: claims declared as assurance-case goals;
- `.ddd/exceptions.yaml`: approved, time-boxed waivers for goals;
- `.ddd/obligations.yaml`: open work binding unresolved defeaters to issues;
- `.ddd/packets/`: bounded evidence packets;
- `.ddd/reports/`: sweep, validation, and assurance reports.

External evidence MUST have an explicit non-ambiguous version. Active claims
MUST cite active locked evidence with an applicable authority domain. The
captured content digest MUST match the lock entry.

## 8. Machine API

### 8.1 Normal assurance workflow

```text
scope-change(base, head) → ChangeEnvelope
build-case(envelope) → AssuranceCase
evaluate-case(case) → AssuranceReport
```

### 8.2 Supported external-evidence compatibility API

```text
classify(change) → domains
lock(source) → lock_entry
claim(statement, source) → claim_id
packet(change, claims) → evidence_packet
trace(claim_id, construct) → trace_entry
validation(claim_id, construct, method, target) → validation_record
goal(claim_id) → goal_entry
exception(goal, rationale, owner, expires) → exception_entry
obligation(defeater, issue) → obligation_entry
sweep(direction) → compliance_report
drift-check() → evidence_freshness_report
```

`validation` records a proof run for one claim construct with a closed method
set and an auto-computed artifact digest, and links the record back into the
claim. `trace` and `validation` enforce the exact-match construct contract at
write time: the construct MUST equal a claim `constructs[]` entry verbatim.
`goal` declares a claim as an assurance-case goal. `exception` records an
approved waiver with rationale, owner, and a future expiry date. `obligation`
binds an unresolved defeater to a tracking issue.

### 8.3 Unsupported compatibility stubs

```text
discover
refute
compile
```

Stub commands MUST identify themselves as unimplemented and MUST NOT emit a
successful assurance verdict.

## 9. CLI

```sh
bun run cli/bin/ddd.ts scope-change --base <revision> --head <revision>
bun run cli/bin/ddd.ts build-case <ENV-NNN|path>
bun run cli/bin/ddd.ts evaluate-case <CASE-NNN|path>
bun run cli/bin/ddd.ts validation --claim <C-NNN> --construct <symbol> --method <m> --target <file>
bun run cli/bin/ddd.ts goal --claim <C-NNN>
bun run cli/bin/ddd.ts exception --goal <C-NNN> --rationale "<risk>" --owner <name> --expires <date>
bun run cli/bin/ddd.ts obligation --defeater <id> --issue <url>
```

`proofline` and `ddd` are equivalent binary names during the compatibility
period. Existing `.ddd/` stores remain valid.

## 10. Conformance

A tool conforms to this specification only for the capabilities it reports.
Conformance claims MUST name:

- the evaluated change boundary;
- boundary confidence;
- supported capabilities;
- unevaluated capabilities;
- open defeaters;
- approved exceptions.

No tool may promote `not-evaluated` to success. No declared-scope result may be
described as repository-wide conformance.

## 11. Versioning

The assurance-case schema starts at `0.4.0`; `0.5.0` adds stack coverage fields
and capabilities. Readers accept both versions. The legacy Book artifacts
retain their `0.1.0` schemas during the compatibility period. Additive readers SHOULD
ignore unknown fields. Breaking schema changes require a new minor version
while the specification remains pre-1.0.

## 12. Validation fixtures

The conformance suite MUST include:

- a support cycle;
- generated evidence derived from its implementation;
- a descriptive source used as normative support;
- an uncovered changed symbol;
- an approved human waiver;
- a fully supported case;
- TypeScript changed-symbol extraction;
- JSON Schema or OpenAPI boundary detection.

No circular-lineage fixture may produce `SATISFIED` or `WAIVED`.
