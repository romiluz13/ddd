---
name: ddd-controls
description: >
  Use when a control obligation needs enforcement, new obligations are created from ADRs or
  documentation, existing controls need recompilation, or drift detection identifies control
  drift.
metadata:
  author: ddd-methodology
  version: "0.3.0"
---

# ddd-controls

**NEVER CLAIM PROSE HAS BECOME EXECUTABLE WHEN NO GATE EXISTS.**

Core principle: Documentation rules become enforceable only when compiled into automated gates. Uncompiled obligations are recipes, not controls.

Violating the letter of the rules is violating the spirit of the rules.

## When to invoke

- A control obligation has been extracted by `ddd-ground` and needs enforcement
- New obligations are created from ADRs or documentation
- Existing controls need recompilation after obligation changes
- Drift detection (`ddd-drift`) identifies control drift

### When NOT to use

- Obligations have not been extracted yet — route to `ddd-ground` first
- No trusted adapter is available — emit a recipe and mark as `uncompiled` instead of claiming enforcement

## What it does

### Step 1: Compile obligation to control

For each obligation in `.ddd/obligations/`, select a trusted adapter and generate an executable control.

```yaml
# Obligation (from ddd-ground)
id: order.no-direct-payment-gateway
rule: "Order domain code must not import payment adapters"
scope: "src/domain/order/**"
severity: blocking
preferred_enforcement: architecture-test
```

**Machine API**: `compile(obligation_id, adapter) → control`

### Step 2: Adapter selection

| Obligation type | Example adapters |
|---|---|
| Architecture boundary | dependency-cruiser, eslint-plugin-boundaries, import-linter |
| Security pattern | eslint-plugin-security, semgrep |
| API contract | openapi-validator, pact |
| Data invariant | runtime assertions, property-based tests |
| Performance | lighthouse, benchmark CI |
| Code style | eslint, prettier |
| Formal verification | Dafny, TLA+, model checker (Level 5) |

An adapter is NOT trusted until validated (Step 3).

### Step 3: Validate the control

Three-check protocol (SPEC.md §12.4):

1. **Compliant fixture**: Code that obeys → control MUST pass
2. **Violating fixture**: Code that breaks → control MUST fail with message referencing obligation ID
3. **Mutation test**: Deliberately introduce violation → control MUST catch it

### Step 4: Set enforcement level

| Level | Description |
|---|---|
| 1 | Documented rationale (docs only) |
| 2 | Review checklist (manual verification) |
| 3 | Executable assertion (test or lint) |
| 4 | Blocking automated gate (CI fails) |
| 5 | Formal/model-checked property (prover verifies) |

`blocking` → Level 4 (or 5). `warning` → Level 2. `advisory` → Level 1. DDD SHOULD compile to the strongest practical level.

### Step 4a: Generation boundary

DDD MAY generate the actual control when a trusted adapter exists and the mapping is deterministic. Otherwise, DDD MUST emit a precise implementation recipe and report the obligation as `uncompiled`:

```yaml
id: order.no-direct-payment-gateway
status: uncompiled
recipe: |
  1. Add dependency-cruiser rule: from src/domain/order/** to src/adapters/payment/**
  2. Set severity to 'error' in .dependency-cruiser.js
adapter: null
uncompiled_reason: "dependency-cruiser not installed in project"
```

**Never claim prose has become executable when no gate exists.**

### Step 5: Register and integrate

Update obligation record with compilation status. Level 4+ controls MUST run in CI and block on failure. Control failures MUST reference the obligation ID.

## Examples

<Good>
```
Obligation: order.no-direct-payment-gateway
Adapter: dependency-cruiser (installed, trusted)
Control: .dependency-cruiser.js rule "order-no-payment-adapter"
Validation: compliant fixture passes, violating fixture fails with "Violates: order.no-direct-payment-gateway", mutation caught
Level: 4 (blocking in CI)
Status: compiled
```

</Good>

<Bad>
```
Obligation: order.no-direct-payment-gateway
Adapter: "we'll check in code review" (no tool)
Control: none
Validation: none
Level: 1 (documented only)
Status: "compiled" (claimed but no gate exists)
→ Generation boundary violation. Prose is not executable.
```
</Bad>

## Rationalization table

| Excuse | Reality |
|---|---|
| "Level 1 is fine, the team knows the rule" | Level 1 means the rule exists in docs only. If severity is `blocking`, Level 4 is required. |
| "I don't need validation fixtures, the rule is simple" | Simple rules have subtle edge cases. The mutation test catches what manual review misses. |
| "I'll skip the violating fixture, it's obvious it'll fail" | The violating fixture verifies the error message references the obligation ID. Without it, failures are untraceable. |
| "The adapter is well-known, no need to validate trust" | Adapter updates can change behavior. Re-validate after every adapter upgrade. `ddd-drift` catches this. |
| "I'll mark it compiled even though CI doesn't run it" | A control that doesn't run is Level 1, not Level 4. Misrepresenting enforcement level is a conformance failure. |

## Self-improvement

1. Did any validated control fail to catch a real violation? If so, the adapter's coverage is weaker than expected — record residual risk and consider a stronger adapter.
2. Are many obligations `uncompiled`? If so, the project lacks the right tooling — consider adapter installation as infrastructure work.
3. Did mutation tests find violations that compliant/violating fixtures missed? If so, the fixtures need more edge cases.

## Spec reference

- SPEC.md §12 (Executable Controls), §20.8 (Worked example)
