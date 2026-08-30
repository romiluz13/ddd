---
name: ddd-ground
description: >
  Use after evidence is locked and before implementation begins, during implementation
  to extract claims and trace constructs, or when a new control obligation is identified
  from documentation.
metadata:
  author: ddd-methodology
  version: "0.3.0"
---

# ddd-ground

**EVERY CONSTRUCT TRACES TO A CLAIM. EVERY CLAIM TRACES TO EVIDENCE. NO ORPHANS.**

Core principle: Implementation is grounded when every code construct has documentary lineage through claims to evidence.

Violating the letter of the rules is violating the spirit of the rules.

## When to invoke

- Evidence Lock gate has passed (sources acquired and locked)
- Before implementation begins (assemble the evidence packet)
- During implementation (extract claims, trace constructs)
- When a new control obligation is identified from documentation

### When NOT to use

- Evidence has not been locked yet — route to `ddd-scope` first
- Implementation is declared complete — route to `ddd-verify` for conformance checking
- You need to discover new evidence — route to `ddd-scope`

## What it does

### Step 1: Assemble evidence packet

Create a bounded, change-specific context bundle (SPEC.md §7.5):

```yaml
id: PKT-001
change_id: CH-001
claims: [C-042, C-017, C-055]
evidence: [EL-001, EL-003, EL-008]
passports: [order.aggregate]
obligations: [order.no-direct-payment-gateway]
invariants: ["Order can only be cancelled if status is PENDING or CONFIRMED"]
forbidden: ["Cancelling a SHIPPED order"]
context_budget: { max_tokens: 50000, sections_selected: 12 }
```

**Machine API**: `packet(change, lock) → evidence_packet`

Evidence packets prevent context rot by delivering only the relevant slice of the Book.

### Step 2: Extract claims

For each source, extract atomic normative statements:

```yaml
id: C-042
statement: "Server components cannot use browser-only APIs"
rationale: "ADR-007: Server components render on the server"
sources:
  - ref: EL-001#Server Components
    authority_domain: api-semantics
claim_kind: api
impact: medium
tier: T1  # api raises to at least T1, medium impact minimum is T1
status: known-and-supported
constructs: [OrderList.component]
```

**Claim classification** (SPEC.md §13.2):
- `claim_kind`: mechanical | api | behavioral | architectural | operational
- `impact`: low | medium | high | critical
- `tier`: derived from the 5×4 matrix (impact sets minimum, kind may increase)
- Ambiguous classification escalates to the higher tier

**Machine API**: `claim(statement, source) → claim_id`

### Step 3: Trace constructs to claims

For each code construct:

```yaml
id: CL-001
symbol: src/domain/order/Order.ts#cancelOrder
symbol_kind: method
claims: [C-055, C-017]
passport: order.aggregate
coverage_status: covered  # covered | t0-exempt | uncovered
```

Every L2 construct MUST trace to at least one L1 claim. Every L1 claim MUST trace to at least one L0 source OR an explicit exception.

**Machine API**: `trace(claim_id, construct) → trace_entry`

### Step 4: Extract control obligations

When documentation contains enforceable rules:

```yaml
id: order.no-direct-payment-gateway
rule: "Order domain code must not import payment adapters"
source: ADR-004
scope: "src/domain/order/**"
severity: blocking
preferred_enforcement: architecture-test
```

**Machine API**: `obligation(rule, source, scope) → obligation_id`

Obligations are stored in `.ddd/obligations/` and compiled by `ddd-controls` (V3).

### Step 5: Update passports

If the change introduces or modifies a responsibility-bearing unit, update its passport. See `ddd-book/references/passport-schema.md` for schema.

## Grounding Check (during implementation)

The Grounding Check gate fires during implementation:
- **Trigger**: each code construct written
- **Pass condition**: every construct traces to a claim or T0 exemption
- **Block condition**: unsupported decisions trigger retrieval or an exception

## Examples

<Good>
```
Construct: src/domain/order/Order.ts#cancelOrder
Traces to: C-055 ("Order can be cancelled from PENDING or CONFIRMED")
C-055 traces to: EL-002#domain-model
Coverage: covered
```

</Good>

<Bad>
```
Construct: src/domain/order/Order.ts#cancelOrder
Traces to: nothing
Coverage: uncovered
→ Grounding Check BLOCKS. Must trace or record exception.
```
</Bad>

## Rationalization table

| Excuse | Reality |
|---|---|
| "I'll trace constructs after implementation" | Grounding Check fires on each construct. Untraced constructs block implementation. Trace as you go. |
| "This claim is obvious, no need to extract it" | If it's not in `claims.yaml`, it doesn't exist for verification. Reverse sweep will catch the undocumented behavior. |
| "The evidence packet is too big, I'll just read the spec" | The packet is bounded to prevent context rot. Reading the full spec defeats the purpose. Trust the packet. |
| "This construct is too simple to trace" | T0 exemption exists for mechanical plumbing. But if it has any behavioral impact, it needs a claim. |

## Self-improvement

1. Did any constructs fail Grounding Check? If so, the evidence packet was incomplete — check if scope missed a domain.
2. Were any extracted claims unused in traces? If so, the scope was too broad — tighten domain classification.
3. Did any obligations surface that weren't anticipated in scope? Feed those back into `ddd-scope` for future changes.

## Spec reference

- SPEC.md §7.4 (Claim ledger), §7.5 (Evidence packet), §8.1 (Grounding Check gate), §12 (Executable Controls), §13 (Traceability)
