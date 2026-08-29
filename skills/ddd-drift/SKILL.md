---
name: ddd-drift
description: >
  Drift detection for DDD. Scans five dimensions: evidence, documentation, decision, control,
  and code drift. Produces severity-classified drift reports with routing recommendations.
  Use for scheduled drift checks, after external documentation updates, before Book release,
  or when troubleshooting unexplained behavior.
metadata:
  author: ddd-methodology
  version: "0.2.6"
---

# ddd-drift

**Detect evidence, documentation, decision, control, and code drift.**

V3 skill — continuous integrity monitoring across the DDD system.

## When to invoke

- Scheduled drift check (CI cron, pre-commit, or on-demand)
- After external documentation updates (vendor docs, standards)
- After significant code changes outside DDD scope
- When troubleshooting unexplained behavior
- Before releasing a new Book version

## What it does

The drift checker scans five dimensions and produces a drift report for each finding.

**Machine API**: `drift_check() → drift_report[]`

### Drift dimension 1: Evidence drift

Evidence lock entries become stale when:
- A source's content digest no longer matches (source changed)
- A source's freshness policy has expired
- A source has been superseded by a newer version
- A source URL returns 404 or redirect to different content

**Check**: For each entry in `.ddd/evidence.lock`, re-fetch (or check cached copy) and compare digest.

**Drift report**:
```yaml
schema_version: 0.1.0
id: DRFT-001
type: evidence_drift
lock_entry: EL-003
source_url: https://docs.example.com/api/v3
expected_digest: sha256:abc123...
actual_digest: sha256:def456...
severity: high
description: "Source content has changed since evidence lock was created"
recommended_action: "Re-evaluate claims citing EL-003. Update evidence lock with new entry."
detected_at: 2026-08-29T18:00:00Z
```

### Drift dimension 2: Documentation drift

Documentation drifts from code when:
- Code behavior has changed but ADRs, CONTEXT.md, or Book references have not been updated
- API signatures in code no longer match documented signatures
- Domain model in `.ddd/models/` no longer matches implemented domain logic

**Check**: Compare current code structure against Book references and passports.

### Drift dimension 3: Decision drift

Decision drift occurs when:
- An ADR is marked "accepted" but the implementation diverges from the selected alternative
- Negative knowledge (rejected alternatives) has been silently adopted
- A decision's constraints are violated by later changes

**Check**: Compare ADR decisions against current implementation and obligation status.

### Drift dimension 4: Control drift

Control drift occurs when:
- A compiled control no longer catches violations it was validated to catch
- An adapter has been updated and the control's behavior changed
- An obligation exists but no control has been compiled
- A control exists but its obligation has been superseded

**Check**: Re-run control validation fixtures. Check obligation-control mapping.

### Drift dimension 5: Code drift

Code drift occurs when:
- Grandfathered code (pre-DDD) has been modified without entering DDD scope
- A construct's traced claims no longer match its implementation
- New constructs exist without passports (if responsibility-bearing)
- Reverse sweep violations have accumulated since last check

**Check**: Run reverse sweep on changed code. Check passport coverage.

## Drift report summary

```yaml
schema_version: 0.1.0
id: DRFT-SUMMARY-001
generated_at: 2026-08-29T18:00:00Z
total_findings: 5
by_type:
  evidence_drift: 2
  documentation_drift: 1
  decision_drift: 0
  control_drift: 1
  code_drift: 1
by_severity:
  critical: 0
  high: 2
  medium: 2
  low: 1
findings:
  - DRFT-001
  - DRFT-002
  - DRFT-003
  - DRFT-004
  - DRFT-005
recommended_actions:
  - "Re-evaluate claims citing EL-003 and EL-007 (evidence drift)"
  - "Update CONTEXT.md#Order to match new code structure (documentation drift)"
  - "Recompile control for obligation order.no-direct-payment-gateway (control drift)"
  - "Add passport for new class PaymentReconciliation (code drift)"
```

## Severity guidance

| Severity | Meaning |
|---|---|
| `critical` | Evidence underlying a T3 claim has drifted — claims may be unfounded |
| `high` | Evidence for T2 claims has drifted, or documentation significantly mismatches code |
| `medium` | Freshness expired, minor doc mismatch, uncompiled obligation |
| `low` | Cosmetic drift, grandfathered code minor change |

## Routing

Drift findings route to appropriate skills:

| Finding | Route to |
|---|---|
| Evidence drift | `ddd-scope` (re-acquire and re-lock) |
| Documentation drift | `ddd-book` (update references) |
| Decision drift | `ddd-decide` (re-evaluate if needed) |
| Control drift | `ddd-controls` (recompile) |
| Code drift | `ddd-ground` (trace new constructs) or `ddd-exception` (if gaps found) |

## Lifecycle re-entry (SPEC.md §8.3)

When drift is detected, the affected change's lifecycle state transitions depend on the drift type:

| Drift type | Transition | Precondition |
|---|---|---|
| Evidence drift (contradictory content) | Any active change → `UNSCOPED` | Evidence lock entry invalidated, new content contradicts existing claims |
| Evidence drift (version refresh only) | Any active change → `EVIDENCE_LOCKED` | Evidence lock entry invalidated, new content is consistent |
| Documentation drift | Route to `ddd-book` → update references | No lifecycle state change (Book updated in place) |
| Decision drift | Route to `ddd-decide` → re-evaluate | Change returns to `UNSCOPED` if decision is revised |
| Control drift | Route to `ddd-controls` → recompile | No lifecycle state change (control updated in place) |
| Code drift | Route to `ddd-ground` → trace new constructs | Change enters `IMPLEMENTING` → `VERIFYING` cycle |

**Re-entry scope:** Only changes that depend on the invalidated evidence lock entry are affected. Unrelated changes are not disrupted. When an evidence lock entry is superseded, all claims depending on that entry are flagged.

## CI integration

- Drift checks SHOULD run on a schedule (e.g., daily or weekly)
- Drift checks MUST run before Book release
- Critical drift findings SHOULD block Book release
- Drift summary is stored in `.ddd/reports/`

## Worked example (SPEC.md §20.5)

1. Evidence lock entry EL-003 (vendor API docs) becomes stale (freshness expired)
2. Drift checker re-fetches source, computes new digest
3. New content contradicts existing claims about API behavior
4. Drift report generated: `evidence_drift`, severity `high`
5. All changes citing EL-003 return to `UNSCOPED`
6. Knowledge Curator re-acquires and locks new evidence
7. Claims updated, traces re-validated

## Spec reference

- SPEC.md §8.3 (Lifecycle state machine — drift re-entry transitions), §12 (Executable Controls), §17 (Versioning and Migration: §17.1 spec versioning, §17.2 schema versioning), §20.5 (Worked example: stale documentation and content drift)
