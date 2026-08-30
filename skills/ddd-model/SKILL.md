---
name: ddd-model
description: >
  Domain modeling skill for DDD. Creates and maintains domain models (state machines,
  aggregates, entities, value objects, threat models, architecture models) in .ddd/models/.
  Use when designing domain logic, modeling state transitions, creating aggregate boundaries,
  performing threat analysis, or documenting system architecture.
metadata:
  author: ddd-methodology
  version: "0.3.0"
---

# ddd-model

**Create and maintain domain models in `.ddd/models/`.**

V1 skill — produces the domain, state, threat, and architecture models that ground design decisions and object passports.

## When to invoke

- Designing domain logic that involves state transitions, invariants, or aggregates
- Modeling a new bounded context or entity relationship
- Performing threat modeling (STRIDE) for a security-sensitive change
- Documenting system architecture (components, boundaries, data flows)
- When `ddd-scope` identifies domain-modeling or threat-modeling knowledge domains
- When `ddd-book` initialization detects domain code without existing models
- When `ddd-ground` needs a model to ground claims about domain behavior

## What it does

### Step 1: Determine model kind

Select the appropriate model kind based on the change's domain:

| Model kind | When to use |
|---|---|
| `state-machine` | Entity has a lifecycle with discrete states and transition rules |
| `aggregate` | A cluster of entities and value objects with consistency invariants |
| `entity` | A domain object with identity and lifecycle that is not an aggregate root |
| `value-object` | An immutable domain concept with equality semantics |
| `domain-service` | A stateless operation that spans multiple aggregates |
| `event` | A domain event with payload schema and consumers |
| `context-map` | Bounded context relationships (upstream/downstream, anti-corruption layers) |
| `threat-model` | STRIDE or similar security threat analysis |
| `architecture` | Component, boundary, and data-flow diagram |

### Step 2: Gather evidence

Models MUST be grounded in evidence:

1. Read `project-context.yaml` to understand the project's domain structure
2. Read existing claims in `.ddd/claims.yaml` related to the domain
3. Read evidence lock entries for domain documentation
4. If no evidence exists, route to `ddd-scope` to acquire domain documentation
5. Consult `CONTEXT.md` for domain glossary terms

### Step 3: Create the model

Create a model file in `.ddd/models/` following §7.6.12:

```yaml
schema_version: 0.1.0
id: DM-001
name: "Order lifecycle"
model_kind: state-machine
description: "State transitions for order processing"
sources:
  - ref: EL-002#domain-model
    authority_domain: domain-rules
  - ref: CONTEXT.md#Order
    authority_domain: product-behavior

states:
  - name: PENDING
    description: "Order created but not confirmed"
    allowed_transitions: [CONFIRMED, CANCELLED]
  - name: CONFIRMED
    description: "Order confirmed by customer"
    allowed_transitions: [SHIPPED, CANCELLED]
  - name: SHIPPED
    description: "Order dispatched"
    allowed_transitions: [DELIVERED]
  - name: DELIVERED
    description: "Order delivered to customer"
    allowed_transitions: []
  - name: CANCELLED
    description: "Order cancelled"
    allowed_transitions: []

invariants:
  - "Order cannot transition from SHIPPED to CANCELLED"
  - "Order total MUST equal sum of line item prices"

entities: [Order, LineItem, OrderEvent]
value_objects: [Money, Address]
aggregates: [Order]
domain_events: [OrderCreated, OrderConfirmed, OrderShipped, OrderCancelled]

created_at: "2026-08-29T10:00:00Z"
created_by: "agent"
independence: agent-proposed-human-approved
linked_passports: [order.aggregate]
linked_claims: [C-017, C-055]
```

### Step 4: Link model to claims and passports

Each model MUST link to:
- **Claims**: any claim derived from this model (via `linked_claims`)
- **Passports**: any passport that implements this model (via `linked_passports`)
- **Evidence**: the sources that ground this model (via `sources`)

Claims about state transitions, invariants, and domain rules MUST reference the model in their `rationale` field.

### Step 5: Validate model consistency

Check that:
1. All states in a state machine have defined `allowed_transitions`
2. All invariants are expressible as claims
3. All entities referenced in the model exist in the codebase or are planned
4. The model does not contradict existing claims (if it does, record an exception)
5. All `sources` references point to valid evidence lock entries

### Step 6: Update knowledge map

Record the domain model in the knowledge map:
- Domain: `domain-rules` (or appropriate domain)
- Evidence: the model file and its sources
- Gaps: any invariants that lack evidence

## Threat modeling

When `model_kind: threat-model`, the model follows STRIDE:

```yaml
schema_version: 0.1.0
id: DM-003
name: "Auth middleware threat model"
model_kind: threat-model
description: "STRIDE analysis of authentication middleware"
sources:
  - ref: EL-005#security
    authority_domain: security

threats:
  - id: T-001
    category: spoofing
    description: "Attacker forges JWT token"
    severity: high
    mitigation: "Verify JWT signature with server secret"
    status: mitigated
  - id: T-002
    category: denial-of-service
    description: "Brute force login attempts"
    severity: medium
    mitigation: "Rate limiting per IP"
    status: mitigated
  - id: T-003
    category: information-disclosure
    description: "Error messages reveal user existence"
    severity: medium
    mitigation: "Generic error messages"
    status: open

created_at: "2026-08-29T10:00:00Z"
created_by: "agent"
independence: agent-proposed-human-approved
linked_passports: [auth.middleware]
linked_claims: [C-072, C-073]
```

## Architecture modeling

When `model_kind: architecture`, the model documents system structure:

```yaml
schema_version: 0.1.0
id: DM-005
name: "System architecture"
model_kind: architecture
description: "Component and boundary diagram"
sources:
  - ref: project-context.yaml
    authority_domain: project-architecture

components:
  - name: "Web App"
    type: "Next.js application"
    boundaries: ["src/app/**"]
    dependencies: ["API Gateway", "Auth Service"]
  - name: "API Gateway"
    type: "Node.js service"
    boundaries: ["src/api/**"]
    dependencies: ["Database", "Cache"]

boundaries:
  - name: "Domain-Adapter"
    rule: "Domain code MUST NOT import adapter code"
    obligation: "order.no-direct-payment-gateway"

data_flows:
  - from: "Web App"
    to: "API Gateway"
    protocol: "HTTPS"
    data: "API requests"

created_at: "2026-08-29T10:00:00Z"
created_by: "agent"
independence: agent-proposed-human-approved
```

## Artifacts

- Model files in `.ddd/models/DM-*.yaml`
- Updated claims in `.ddd/claims.yaml` (if model introduces new claims)
- Updated passports in `.ddd/passports/` (if model defines passport requirements)
- Updated knowledge map in `.ddd/knowledge-map.yaml`

## Spec reference

- SPEC.md §7.6.12 (Domain model record schema), §9.1 (Knowledge taxonomy — dimension 1: Product and domain), §11 (Object Passports — passports reference models), §13.1 (Nested traceability — models are L0 sources for domain claims)
