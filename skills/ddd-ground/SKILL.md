---
name: ddd-ground
description: >
  Evidence Lock gate for DDD. Assembles evidence packets, extracts claims and obligations
  from sources, traces code constructs to claims, and updates object passports. Use after
  the Evidence Lock gate has passed, before implementation begins, during implementation
  to extract claims, or when a new control obligation is identified.
metadata:
  author: ddd-methodology
  version: "0.2.6"
---

# ddd-ground

**Extract claims and obligations, create evidence packets, update construct mappings and passports.**

## When to invoke

- Evidence Lock gate has passed (sources acquired and locked)
- Before implementation begins (assemble the evidence packet)
- During implementation (extract claims, trace constructs)
- When a new control obligation is identified from documentation

## What it does

### Step 1: Assemble evidence packet

Create a bounded, change-specific context bundle (SPEC.md §7.5):

```yaml
schema_version: 0.1.0
id: PKT-001
change_id: CH-001
claims: [C-042, C-017, C-055]
evidence: [EL-001, EL-003, EL-008]
passports: [order.aggregate]
obligations: [order.no-direct-payment-gateway]
invariants: ["Order can only be cancelled if status is PENDING or CONFIRMED"]
forbidden: ["Cancelling a SHIPPED order"]
validations_required: [test:cancel-pending, test:cancel-confirmed-passes]
context_budget:
  max_tokens: 50000
  sections_selected: 12
  conflicts_included: 1
assembled_at: 2026-08-29T10:00:00Z
packet_digest: sha256:...
```

**Machine API**: `packet(change, lock) → evidence_packet`

Evidence packets prevent context rot by delivering only the relevant slice of the Book to the implementer.

### Step 2: Extract claims

For each source in the packet, extract atomic normative statements:

```yaml
schema_version: 0.1.0
id: C-042
statement: "Server components cannot use browser-only APIs"
rationale: "ADR-007: Server components render on the server"
sources:
  - ref: EL-001#Server Components
    authority_domain: api-semantics
claim_kind: api
impact: medium
tier: T1  # derived: api raises to at least T1, medium impact minimum is T1
status: known-and-supported
constructs: [OrderList.component]
validations: [test:server-component-no-window]
```

**Claim classification** (SPEC.md §13.2):
- `claim_kind`: mechanical | api | behavioral | architectural | operational
- `impact`: low | medium | high | critical
- `tier`: derived from the 5×4 matrix (impact sets minimum, kind may increase, derived = max)
- Ambiguous classification escalates to the higher tier

**Machine API**: `claim(statement, source) → claim_id`

### Step 3: Trace constructs to claims

For each code construct (class, function, module, boundary):

```yaml
schema_version: 0.1.0
id: CL-001
symbol: src/domain/order/Order.ts#cancelOrder
symbol_kind: method
claims: [C-055, C-017]
passport: order.aggregate
coverage_status: covered  # covered | t0-exempt | uncovered
coverage_reason: null
```

Every L2 construct MUST trace to at least one L1 claim. Every L1 claim MUST trace to at least one L0 source OR an explicit exception (§14).

**Machine API**: `trace(claim_id, construct) → trace_entry`

### Step 4: Extract control obligations

When documentation contains enforceable rules:

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

**Machine API**: `obligation(rule, source, scope) → obligation_id`

Obligations are stored in `.ddd/obligations/` and compiled by `ddd-controls` (V3).

### Step 5: Update passports

If the change introduces or modifies a responsibility-bearing unit, update its passport (see `ddd-book` skill).

## Grounding Check (during implementation)

The Grounding Check gate (SPEC.md §8.1) fires during implementation:
- **Trigger**: each code construct written
- **Pass condition**: every construct traces to a claim or T0 exemption
- **Block condition**: unsupported decisions trigger retrieval or an exception
- T0 regions (formatting, mechanical plumbing) are exempted by enclosing claims

## Lifecycle state

- `EVIDENCE_LOCKED → IMPLEMENTING` (packet delivered to implementer)
- During implementation, Grounding Check is active

## Spec reference

- SPEC.md §7.4-7.6 (Claim, Packet, Construct schemas), §8.1 (Grounding Check gate), §12 (Executable Controls), §13 (Traceability)
