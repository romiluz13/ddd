# Object Passport Schema (SPEC.md §11)

## When a passport is required

A passport is required when a unit:
- Owns domain meaning or invariants
- Owns mutable state or a lifecycle
- Crosses a trust, process, or data boundary
- Exposes a stable interface
- Persists data or events
- Performs irreversible side effects
- Coordinates multiple components
- Has high coupling or high failure impact

DTOs, trivial helpers, generated types, and framework glue inherit coverage from a parent passport.

## Schema

```yaml
id: order.aggregate
kind: aggregate  # aggregate | entity | value-object | domain-service | component | module
purpose: Protect the consistency of an accepted order
domain_sources: [CONTEXT.md#Order, EL-002#domain-model, DM-001]
responsibilities: [...]
non_responsibilities: [...]
invariants: [...]
states: [...]
collaborators: [...]
allowed_dependencies: [...]
forbidden_dependencies: [...]
methodology:
  pattern: aggregate-root
  source: EL-002#ddd-patterns
  applicability_rationale: "Order has consistency invariants spanning multiple entities"
risks: [...]
controls: [...]
validating_tests: [...]
symbols: [...]
```

## Linking

Passports SHOULD reference domain models (§7.6.12) via `domain_sources` when a model exists.
Claims about passport behavior MUST reference the passport in their `rationale` field.
