---
name: ddd-controls
description: >
  Compiles and validates DDD Control Obligations into executable guardrails. Selects trusted
  adapters, generates controls, runs the three-check validation protocol, and sets enforcement
  levels. Use when a control obligation needs enforcement, new obligations are created from ADRs,
  or drift detection identifies control drift.
metadata:
  author: ddd-methodology
  version: "0.3.0"
---

# ddd-controls

**Compile and validate Control Obligations into executable guardrails.**

V3 skill — compiles documented rules into automated enforcement.

## When to invoke

- A control obligation has been extracted by `ddd-ground` and needs enforcement
- New obligations are created from ADRs or documentation
- Existing controls need recompilation after obligation changes
- Drift detection (`ddd-drift`) identifies control drift

## What it does

### Step 1: Compile obligation to control

For each obligation in `.ddd/obligations/`, select a trusted adapter and generate an executable control.

**Obligation schema** (from `ddd-ground`):
```yaml
schema_version: 0.1.0
id: order.no-direct-payment-gateway
rule: "Order domain code must not import payment adapters"
source: ADR-004
scope: "src/domain/order/**"
severity: blocking
preferred_enforcement: architecture-test
expected_failure: "Dependency edge from domain to payment adapter"
residual_risk: "Reflection could bypass"
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

An adapter is NOT trusted until it has been validated (Step 3).

### Step 3: Validate the control

Control validation protocol (SPEC.md §12.4) requires three checks:

1. **Compliant fixture**: Code that obeys the obligation → control MUST pass
2. **Violating fixture**: Code that breaks the obligation → control MUST fail with a message referencing the obligation ID
3. **Mutation test**: Deliberately introduce the violation → control MUST catch it

```yaml
# Validation record
schema_version: 0.1.0
obligation_id: order.no-direct-payment-gateway
adapter: dependency-cruiser
compliant_fixture: test/fixtures/order-compliant.ts
compliant_result: pass
violating_fixture: test/fixtures/order-violates-payment.ts
violating_result: fail
violating_message: "Violates obligation: order.no-direct-payment-gateway"
mutation_test:
  applied_mutation: "Added import of PaymentGateway in Order.ts"
  detected: true
validation_status: validated
validated_at: 2026-08-29T16:00:00Z
```

### Step 4: Set enforcement level

Enforcement levels per SPEC.md §12.2:

| Level | Description |
|---|---|
| 1 | **Documented rationale** — the rule exists in docs only |
| 2 | **Review checklist** — a reviewer must verify manually |
| 3 | **Executable assertion** — a test or lint rule checks it |
| 4 | **Blocking automated gate** — CI fails if violated |
| 5 | **Formal or model-checked property** — a prover verifies it |

DDD SHOULD compile to the strongest practical level, not automatically demand level 5.

The enforcement level is determined by the obligation's `severity`:
- `blocking` → Level 4 (or 5 if a formal verifier is available)
- `warning` → Level 2
- `advisory` → Level 1

### Step 4a: Generation boundary (SPEC.md §12.3)

DDD MAY generate the actual control when:
- A trusted adapter exists for the target toolchain
- The mapping from obligation to control is deterministic enough
- The project supports the target tool
- The generated control can be validated (Step 3)

Otherwise, DDD MUST emit a precise implementation recipe and report the obligation as `uncompiled`:

```yaml
# Uncompiled obligation
id: order.no-direct-payment-gateway
status: uncompiled
recipe: |
  1. Add dependency-cruiser rule: from src/domain/order/** to src/adapters/payment/**
  2. Set severity to 'error' in .dependency-cruiser.js
  3. Add test fixture: test/fixtures/order-violates-payment.ts
  4. Run in CI: npx dependency-cruiser src/domain/order
adapter: null  # no trusted adapter available
uncompiled_reason: "dependency-cruiser not installed in project"
```

**Never claim prose has become executable when no gate exists.**

### Step 5: Register the control

Update the obligation record with compilation status and control reference:

```yaml
# Updated obligation
id: order.no-direct-payment-gateway
status: compiled
control:
  adapter: dependency-cruiser
  rule_file: .dependency-cruiser.js#order-no-payment-adapter
  enforcement_level: 4
  validated: true
```

### Step 6: CI integration

- Level 4+ controls MUST run in CI and block on failure
- Level 5 controls (formal verification) SHOULD run in CI when available
- Control failures MUST reference the obligation ID for traceability
- Control results feed into the compliance report (via `ddd-verify`)

## Generated control example

For `order.no-direct-payment-gateway` using dependency-cruiser:

```json
{
  "name": "order-no-payment-adapter",
  "severity": "error",
  "comment": "Enforces obligation: order.no-direct-payment-gateway (ADR-004)",
  "from": { "path": "src/domain/order/.*" },
  "to": { "path": "src/adapters/payment/.*" }
}
```

## Residual risk

Controls have residual risk:
- Static analysis cannot catch all dynamic behavior
- Reflection, metaprogramming, or runtime injection can bypass static controls
- Controls are only as good as their adapter's capabilities

Residual risks are recorded in the obligation and must be acknowledged by the project.

## Worked example (SPEC.md §20.8)

1. ADR-004 establishes "Order domain code must not import payment adapters"
2. Obligation created: `order.no-direct-payment-gateway`
3. Adapter selected: dependency-cruiser (trusted for project toolchain)
4. Control compiled: dependency-cruiser rule generated
5. Control validated: compliant fixture passes, violating fixture fails with obligation ID, mutation test catches deliberate violation
6. Enforcement level: 4 (blocking automated gate in CI)
7. Result: obligation `compiled` and enforced, tracked in `.ddd/obligations/`

## Artifacts

- Control files in the project's tooling config (e.g., `.dependency-cruiser.js`)
- Validation records in `.ddd/obligations/`
- Updated obligation status

## Spec reference

- SPEC.md §12 (Executable Controls: §12.1 obligation IR, §12.2 enforcement levels, §12.3 generation boundary, §12.4 control validation, §12.5 adapter targets), §20.8 (Worked example)
