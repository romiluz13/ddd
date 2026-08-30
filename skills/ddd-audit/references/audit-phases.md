# Audit Phases Detail (SPEC.md §17.3)

## Step 2: Extracting behavioral claims from code

For each significant code construct, infer what behavioral claim it implements:

| Code pattern | What to extract |
|---|---|
| State machines | States and transitions |
| Validation rules | Invariants from validation logic |
| API contracts | Input/output types and error cases |
| Security boundaries | Auth checks, input sanitization, trust boundaries |
| Data flows | How data moves through the system |

Each extracted claim starts with `status: unknown` and empty `sources` — to be matched in Step 3.

## Step 4: Audit report schema

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
    recommendation: "Acquire documentation or record exception"
contradictions:
  - claim: C-AUDIT-020
    description: "Code allows order cancellation after shipment, but ADR-007 forbids it"
    severity: critical
    recommendation: "Fix code to match ADR-007 or update ADR with justification"
legacy_debt:
  grandfathered_symbols: 330
  documented_symbols: 120
  debt_percentage: 73.3
```

## Step 6: Prioritization

| Priority | Criteria |
|---|---|
| **P0** | Critical security/data integrity gaps, code-doc contradictions |
| **P1** | High-severity gaps in core domain logic, missing ADRs for key decisions |
| **P2** | Medium-severity gaps, missing docs for internal utilities |
| **P3** | Low-severity gaps in non-consequential code, grandfathered utilities |

## Incremental adoption strategy

1. **Phase 1**: Fix all P0 gaps. Create evidence or exceptions for critical claims.
2. **Phase 2**: New changes in audited areas are DDD-governed. Grandfathered code stays exempt.
3. **Phase 3**: As changes touch grandfathered code, bring it into DDD scope (per §17.3).
4. **Phase 4**: Periodically re-audit to track coverage growth and debt reduction.
