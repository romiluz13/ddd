# Get started with Proofline

Proofline stores compatibility artifacts in `.ddd/` and exposes both
`proofline` and `ddd` binary names.

## Prerequisites

- Bun 1.3 or later.
- A Git repository.
- A `.ddd/` Book initialized by `ddd-book`.
- Locked evidence, claims, and traces for goals you expect to satisfy.

## Evaluate a change

### 1. Scope the Git range

```sh
bun run cli/bin/ddd.ts scope-change \
  --base origin/main \
  --head HEAD \
  --risk medium \
  --owner your-name
```

This writes `.ddd/cases/ENV-NNN.json`. The detector enumerates TypeScript
declarations, every manifest dependency, changed bare imports, literal external
service URLs, Cloudflare Workers configuration, frontend files, direct
consumers, and explicit OpenAPI or JSON Schema contracts. Unsupported changed
file classes lower `boundary_confidence`.

Contract detection does not yet prove compatibility. A case with an affected
contract requires the `contract_compatibility` capability and therefore remains
`INDETERMINATE` until an adapter or reviewed attestation supplies that check.

Review the envelope before continuing. Add an explicit exclusion and reason
only when a changed construct is intentionally outside the assurance boundary.

### 1.1 Declare stack components that source cannot reveal

Dynamic endpoints and architecture components require `.ddd/stack.yaml`:

```yaml
schema_version: 0.5.0
components:
  - id: STK-001
    kind: service
    name: grove-gateway
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
  - id: STK-003
    kind: frontend
    name: frontend
    evidence_refs: [EL-005]
```

Every component needs locked evidence with a matching `subject`. Dependency
components also record all declared versions and use matching evidence
versions. Platform components need subject-matched constraint evidence covering
applicable execution, memory, concurrency, network, and rate limits.

Every external reference in `.ddd/book.yaml` must map to a locked evidence
entry through `ref` and the same source URL or a descendant URL.

### 1.2 Resolve gaps and analyze interactions

Any entry in `.ddd/knowledge-map.yaml` under a domain's `gaps` or
`overall_gaps` becomes a blocking defeater.

When a change spans component kinds, record their interaction:

```yaml
interactions:
  - id: INT-001
    components: [platform:cloudflare-workers, service:grove-gateway]
    status: analyzed
    rationale: "Checked provider latency against Workers execution constraints."
```

### 2. Build the assurance case

```sh
bun run cli/bin/ddd.ts build-case ENV-001
```

This bridges active entries from `.ddd/evidence.lock`, `.ddd/claims.yaml`, and
`.ddd/trace-matrix.yaml` into `.ddd/cases/CASE-NNN.json`. It also evaluates
stack coverage, reference completeness, open gaps, platform constraints,
frontend coverage, and cross-layer interactions. Changed symbols without a
matching trace remain coverage gaps.

Before relying on an agent skill installed in the repository, check that it
matches the source:

```sh
bun run cli/bin/ddd.ts doctor
```

### 3. Evaluate the case

```sh
bun run cli/bin/ddd.ts evaluate-case CASE-001
```

The evaluator writes `.ddd/reports/CASE-001.assurance.json`.

| Verdict | Meaning | Exit |
|---|---|---|
| `SATISFIED` | Goals are supported inside a complete evaluated boundary. | 0 |
| `WAIVED` | An accountable human accepted named residual risk. | 0 |
| `UNSATISFIED` | A hard invariant failed or a goal was contradicted. | 1 |
| `INDETERMINATE` | Coverage, a premise, or a required capability is incomplete. | 1 |

## Ground external API usage

Use the compatibility workflow before building a case:

```sh
bun run cli/bin/ddd.ts lock "https://vendor.example/api/v2" \
  --version "2.0.0" \
  --sections "createWidget" \
  --authority "api-semantics"

bun run cli/bin/ddd.ts claim "createWidget() returns a Widget" \
  --source "EL-001#createWidget" \
  --authority "api-semantics" \
  --kind api \
  --impact medium \
  --entailment explicit \
  --construct "src/widget.ts#createWidget"

bun run cli/bin/ddd.ts trace C-001 "src/widget.ts#createWidget"
bun run cli/bin/ddd.ts sweep --direction both
```

`lock` requires an explicit version and stores the exact reviewed content.
`--entailment` records a verifier attestation; Proofline does not infer semantic
entailment from prose.

The legacy sweep covers declared constructs only. A successful result is
`CONFORMANT_DECLARED_SCOPE`, not whole-repository conformance.

## Handle incomplete results

- For `uncovered-construct`, add a real claim and trace, or record a justified
  exclusion in the envelope.
- For `unsupported-goal`, lock authoritative evidence and cite it from the
  claim.
- For `self-derived-support` or `retrospective-baseline`, replace generated
  evidence with an independent normative source or adopt it prospectively for a
  later revision.
- For `INDETERMINATE`, complete the named boundary or capability. Do not treat
  the result as a pass.
- Use a waiver only when a human approver is accountable, the rationale is
  recorded, and no hard invariant failed.

## Current boundary

Proofline supports external documentation grounding and an experimental
TypeScript/OpenAPI/JSON Schema assurance path. Domain modeling, brownfield
audit, design tournaments, broad drift, refutation, and control compilation are
research material under `research/`.
