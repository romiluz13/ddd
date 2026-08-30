# Model Schemas (SPEC.md §7.6.12)

## Model kinds

| Model kind | When to use |
|---|---|
| `state-machine` | Entity has lifecycle with discrete states and transition rules |
| `aggregate` | Cluster of entities and value objects with consistency invariants |
| `entity` | Domain object with identity and lifecycle, not an aggregate root |
| `value-object` | Immutable domain concept with equality semantics |
| `domain-service` | Stateless operation spanning multiple aggregates |
| `event` | Domain event with payload schema and consumers |
| `context-map` | Bounded context relationships (upstream/downstream, ACLs) |
| `threat-model` | STRIDE or similar security threat analysis |
| `architecture` | Component, boundary, and data-flow diagram |

## State machine example

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
    allowed_transitions: [CONFIRMED, CANCELLED]
  - name: CONFIRMED
    allowed_transitions: [SHIPPED, CANCELLED]
  - name: SHIPPED
    allowed_transitions: [DELIVERED]
  - name: DELIVERED
    allowed_transitions: []
  - name: CANCELLED
    allowed_transitions: []
invariants:
  - "Order cannot transition from SHIPPED to CANCELLED"
  - "Order total MUST equal sum of line item prices"
entities: [Order, LineItem, OrderEvent]
value_objects: [Money, Address]
aggregates: [Order]
domain_events: [OrderCreated, OrderConfirmed, OrderShipped, OrderCancelled]
linked_passports: [order.aggregate]
linked_claims: [C-017, C-055]
```

## Threat model example (STRIDE)

```yaml
schema_version: 0.1.0
id: DM-003
name: "Auth middleware threat model"
model_kind: threat-model
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
linked_passports: [auth.middleware]
linked_claims: [C-072, C-073]
```

## Architecture model example

```yaml
schema_version: 0.1.0
id: DM-005
name: "System architecture"
model_kind: architecture
sources:
  - ref: project-context.yaml
    authority_domain: project-architecture
components:
  - name: "Web App"
    type: "Next.js application"
    boundaries: ["src/app/**"]
    dependencies: ["API Gateway", "Auth Service"]
boundaries:
  - name: "Domain-Adapter"
    rule: "Domain code MUST NOT import adapter code"
    obligation: "order.no-direct-payment-gateway"
data_flows:
  - from: "Web App"
    to: "API Gateway"
    protocol: "HTTPS"
    data: "API requests"
```

## Validation checklist

1. All states in a state machine have defined `allowed_transitions`
2. All invariants are expressible as claims
3. All entities referenced exist in the codebase or are planned
4. Model does not contradict existing claims (if it does, record an exception)
5. All `sources` references point to valid evidence lock entries
