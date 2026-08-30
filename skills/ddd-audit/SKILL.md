---
name: ddd-audit
description: >
  Retroactive audit skill for DDD. Builds a constitution draft for existing (brownfield) code
  by extracting claims from code behavior, matching them to existing docs and ADRs, and
  flagging gaps and contradictions. Use when adopting DDD on an existing codebase, when
  assessing legacy documentation debt, or when producing a coverage report for brownfield code.
metadata:
  author: ddd-methodology
  version: "0.3.0"
---

# ddd-audit

**Retroactively build a DDD constitution draft for existing (brownfield) code.**

V1 skill — enables incremental adoption by producing a starting point for existing codebases.

## When to invoke

- Adopting DDD on an existing codebase (brownfield)
- Assessing documentation debt in legacy code
- Producing a coverage report for grandfathered code
- When `ddd-book` initialization finds existing code without DDD coverage
- When preparing a migration plan from non-DDD to DDD-governed development

## What it does

### Step 1: Scan the codebase

1. Read `project-context.yaml` (create one via `ddd-book` if it doesn't exist)
2. Identify all source directories and their structure
3. Count total symbols (functions, classes, modules, components)
4. Classify each source directory by architecture layer (domain, application, infrastructure, UI)
5. Identify entry points, public APIs, and boundary crossings

### Step 2: Extract behavioral claims from code

For each significant code construct, infer what behavioral claim it implements:

1. **State machines**: Extract states and transitions from code
2. **Validation rules**: Extract invariants from validation logic
3. **API contracts**: Extract input/output types and error cases
4. **Security boundaries**: Extract auth checks, input sanitization, trust boundaries
5. **Data flows**: Extract how data moves through the system

For each extracted claim, record:
```yaml
schema_version: 0.1.0
id: C-AUDIT-001
statement: "Order can be cancelled from CONFIRMED state"
rationale: "Inferred from OrderStateMachine.cancelFromConfirmed() implementation"
sources: []  # empty — to be matched in Step 3
claim_kind: behavioral
impact: medium
tier: T2
status: unknown  # unknown until matched to evidence
constructs: [src/domain/order/OrderStateMachine.ts#cancelFromConfirmed]
validations: []
audit_source: "code-extraction"
```

### Step 3: Match claims to existing documentation

For each extracted claim, search for supporting evidence:

1. Check existing ADRs in the project
2. Check `CONTEXT.md` and project docs
3. Check README and wiki
4. Check code comments and JSDoc/docstrings
5. Check test names and descriptions (tests document expected behavior)

For each match:
- If evidence found: update the claim with the source reference, set `status: known-and-supported`
- If partial evidence found: set `status: unsupported`, record what was found
- If no evidence found: set `status: unknown`, record a search record

### Step 4: Flag gaps and contradictions

Produce an audit report:

```yaml
schema_version: 0.1.0
id: AUDIT-001
generated_at: "2026-08-29T10:00:00Z"
codebase_stats:
  total_symbols: 450
  significant_constructs: 120
  claims_extracted: 85
coverage:
  claims_with_evidence: 32
  claims_without_evidence: 53
  coverage_percentage: 37.6
gaps:
  - claim: C-AUDIT-015
    description: "Retry logic in OrderRepository has no documentation"
    severity: high
    recommendation: "Acquire documentation for retry patterns or record exception"
  - claim: C-AUDIT-042
    description: "Auth middleware uses custom session handling not in any ADR"
    severity: critical
    recommendation: "Create ADR for session strategy or find authoritative documentation"
contradictions:
  - claim: C-AUDIT-020
    description: "Code allows order cancellation after shipment, but ADR-007 forbids it"
    severity: critical
    recommendation: "Fix code to match ADR-007 or update ADR with justification"
legacy_debt:
  grandfathered_symbols: 330
  documented_symbols: 120
  debt_percentage: 73.3
recommended_actions:
  - "Create ADR for session handling strategy (affects auth middleware)"
  - "Acquire retry pattern documentation for OrderRepository"
  - "Fix order cancellation state machine to match ADR-007"
  - "Prioritize critical gaps for first DDD-governed changes"
```

### Step 5: Produce draft Book

From the audit results, produce a draft Book:

1. Create `book.yaml` with references to all discovered documentation
2. Create `knowledge-map.yaml` with domains identified from the codebase
3. Create `claims.yaml` with all extracted claims (with their matched or unmatched status)
4. Create `trace-matrix.yaml` with construct-to-claim mappings
5. Create exceptions for all `unknown` and `unsupported` claims
6. Record legacy debt in the coverage section of `book.yaml`

### Step 6: Prioritize remediation

Rank gaps by severity and impact:

| Priority | Criteria |
|---|---|
| **P0 — Fix immediately** | Critical security or data integrity gaps, contradictions between code and docs |
| **P1 — Fix in next sprint** | High-severity gaps in core domain logic, missing ADRs for key decisions |
| **P2 — Fix opportunistically** | Medium-severity gaps, missing documentation for internal utilities |
| **P3 — Accept as legacy debt** | Low-severity gaps in non-consequential code, grandfathered utilities |

## Incremental adoption strategy

The audit results inform a migration plan:

1. **Phase 1**: Fix all P0 gaps. Create evidence or exceptions for critical claims.
2. **Phase 2**: New changes in audited areas are DDD-governed. Grandfathered code stays exempt.
3. **Phase 3**: As changes touch grandfathered code, bring it into DDD scope (per §17.3).
4. **Phase 4**: Periodically re-audit to track coverage growth and debt reduction.

## Artifacts

- Audit report in `.ddd/reports/AUDIT-*.yaml`
- Draft claims in `.ddd/claims.yaml` (with `audit_source` field)
- Draft Book manifest in `.ddd/book.yaml`
- Draft Knowledge Map in `.ddd/knowledge-map.yaml`
- Exceptions for all gaps in `.ddd/exceptions/`
- Coverage report in `book.yaml` coverage section

## Spec reference

- SPEC.md §17.3 (Incremental adoption — grandfathering rules, coverage boundary), §17.4 (Monorepo scoping — audit per package), §18.1 (Success metrics — coverage percentage), §13.1 (Nested traceability — extracted claims need L0 sources), §14 (Exceptions and Epistemic Gaps — unknown claims become exceptions)
