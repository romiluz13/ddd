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

This writes `.ddd/cases/ENV-NNN.json`. The TypeScript detector enumerates
top-level declarations and bare dependency imports. It also finds unchanged
TypeScript modules that directly import a changed module. OpenAPI and
`*.schema.json` files become affected contracts. Unsupported changed file
classes lower `boundary_confidence`.

Contract detection does not yet prove compatibility. A case with an affected
contract requires the `contract_compatibility` capability and therefore remains
`INDETERMINATE` until an adapter or reviewed attestation supplies that check.

Review the envelope before continuing. Add an explicit exclusion and reason
only when a changed construct is intentionally outside the assurance boundary.

### 2. Build the assurance case

```sh
bun run cli/bin/ddd.ts build-case ENV-001
```

This bridges active entries from `.ddd/evidence.lock`, `.ddd/claims.yaml`, and
`.ddd/trace-matrix.yaml` into `.ddd/cases/CASE-NNN.json`. Changed symbols without
a matching trace remain coverage gaps.

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
