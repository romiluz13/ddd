---
name: ddd-model
description: >
  Use when designing domain logic with state transitions or invariants, creating aggregate
  boundaries, performing threat analysis (STRIDE), or documenting system architecture.
metadata:
  author: ddd-methodology
  version: "0.3.0"
---

# ddd-model

**MODELS GROUND DECISIONS. DECISIONS GROUND CLAIMS. CLAIMS GROUND CODE. NO MODEL WITHOUT EVIDENCE.**

Core principle: Models are the bridge between domain knowledge and code. They make state, invariants, and threats explicit and traceable.

## When to invoke

- Designing domain logic that involves state transitions, invariants, or aggregates
- Modeling a new bounded context or entity relationship
- Performing threat modeling (STRIDE) for a security-sensitive change
- Documenting system architecture (components, boundaries, data flows)
- When `ddd-scope` identifies domain-modeling or threat-modeling knowledge domains
- When `ddd-book` initialization detects domain code without existing models
- When `ddd-ground` needs a model to ground claims about domain behavior

### When NOT to use

- Simple CRUD without state transitions or invariants — no model needed
- No evidence exists for the domain — route to `ddd-scope` to acquire evidence first
- The model would duplicate an existing model in `.ddd/models/` — update the existing one instead

## What it does

### Step 1: Determine model kind

| Model kind | When to use |
|---|---|
| `state-machine` | Entity has lifecycle with discrete states and transition rules |
| `aggregate` | Cluster of entities and value objects with consistency invariants |
| `entity` | Domain object with identity and lifecycle, not an aggregate root |
| `value-object` | Immutable domain concept with equality semantics |
| `domain-service` | Stateless operation spanning multiple aggregates |
| `event` | Domain event with payload schema and consumers |
| `context-map` | Bounded context relationships |
| `threat-model` | STRIDE or similar security threat analysis |
| `architecture` | Component, boundary, and data-flow diagram |

### Step 2: Gather evidence

Models MUST be grounded in evidence:
1. Read `project-context.yaml` for domain structure
2. Read existing claims related to the domain
3. Read evidence lock entries for domain documentation
4. If no evidence exists, route to `ddd-scope` to acquire it
5. Consult `CONTEXT.md` for domain glossary terms

### Step 3: Create the model

Create a model file in `.ddd/models/` — **see `references/model-schemas.md`** for full schemas and examples for each model kind (state-machine, threat-model, architecture).

Key fields: `id`, `name`, `model_kind`, `sources` (evidence refs with authority_domain), model-specific content (states, invariants, threats, components), `linked_passports`, `linked_claims`.

### Step 4: Link model to claims and passports

Each model MUST link to:
- **Claims**: any claim derived from this model (via `linked_claims`)
- **Passports**: any passport implementing this model (via `linked_passports`)
- **Evidence**: sources grounding this model (via `sources`)

Claims about state transitions, invariants, and domain rules MUST reference the model in their `rationale` field.

### Step 5: Validate model consistency

1. All states in a state machine have defined `allowed_transitions`
2. All invariants are expressible as claims
3. All entities referenced exist in the codebase or are planned
4. Model does not contradict existing claims (if it does, record an exception)
5. All `sources` references point to valid evidence lock entries

### Step 6: Update knowledge map

Record the domain model in the knowledge map with domain, evidence, and gaps.

## Examples

<Good>
```
Model: DM-001 "Order lifecycle" (state-machine)
Sources: EL-002#domain-model (authoritative), CONTEXT.md#Order (product)
States: PENDING → CONFIRMED → SHIPPED → DELIVERED; CANCELLED from PENDING/CONFIRMED
Invariants: "Cannot cancel SHIPPED order", "Total = sum of line items"
Linked claims: C-017, C-055
Linked passport: order.aggregate
Evidence: version-matched, domain-authoritative
```

</Good>

<Bad>
```
Model: DM-001 "Order lifecycle" (state-machine)
Sources: none (designed from memory)
States: PENDING → CONFIRMED → SHIPPED → DELIVERED → CANCELLED (cancel from any state!)
Invariants: none
Linked claims: none
Linked passport: none
→ No evidence, contradicts domain rules (SHIPPED orders can't be cancelled),
  no links to claims or passports. Model is ungrounded and wrong.
```
</Bad>

## Rationalization table

| Excuse | Reality |
|---|---|
| "I know the domain, I don't need evidence for the model" | Domain knowledge from parametric memory is stale and incomplete. Evidence lock entries ground the model in authoritative sources. |
| "The model is just documentation, it doesn't need to be validated" | Models that contradict claims or reference non-existent entities create conformance failures. Validate. |
| "I'll link claims and passports later" | Unlinked models are orphans. The traceability chain breaks: code → claim → ??? → evidence. Link at creation time. |
| "Threat modeling is overkill for this change" | If `ddd-scope` identified security as a knowledge domain, threat modeling is required. STRIDE takes 15 minutes and catches what you missed. |
| "The architecture diagram doesn't need evidence" | Architecture models cite `project-context.yaml` as a source. Without it, the diagram is a guess, not a grounded model. |

## Self-improvement

1. Did any model contradict existing claims? If so, either the model or the claims are wrong — investigate before proceeding.
2. Are models being created but never linked to passports? If so, the passport creation in `ddd-book` is lagging — flag it.
3. Did a threat model find threats that `ddd-scope` didn't anticipate? If so, the adversarial discovery in scope needs strengthening.

## Spec reference

- SPEC.md §7.6.12 (Domain model schema), §9.1 (Knowledge taxonomy), §11 (Object Passports), §13.1 (Nested traceability)
