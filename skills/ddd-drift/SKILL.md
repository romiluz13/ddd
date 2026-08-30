---
name: ddd-drift
description: >
  Drift detection for DDD. Scans seven dimensions: evidence, documentation, decision, control,
  code, project context, and cache drift. Produces severity-classified drift reports with
  routing recommendations. Use for scheduled drift checks, after external documentation
  updates, before Book release, or when troubleshooting unexplained behavior.
metadata:
  author: ddd-methodology
  version: "0.3.0"
---

# ddd-drift

**DRIFT IS INEVITABLE. UNDETECTED DRIFT IS A SILENT CONFORMANCE FAILURE.**

Detect evidence, documentation, decision, control, code, project context, and cache drift.

## When to invoke

- Scheduled drift check (CI cron, pre-commit, or on-demand)
- After external documentation updates (vendor docs, standards)
- After significant code changes outside DDD scope
- When troubleshooting unexplained behavior
- Before releasing a new Book version

## What it does

The drift checker scans seven dimensions. **See `references/drift-dimensions.md`** for the full dimension details, severity guidance, and lifecycle re-entry rules.

**Machine API**: `drift_check() → drift_report[]`

### The seven dimensions

| # | Dimension | What drifts | Route to |
|---|---|---|---|
| 1 | Evidence | Source content digest changed, freshness expired, URL dead | `ddd-scope` |
| 2 | Documentation | Code changed but ADRs/CONTEXT.md/Book refs not updated | `ddd-book` |
| 3 | Decision | Implementation diverges from accepted ADR | `ddd-decide` |
| 4 | Control | Compiled control no longer catches violations, adapter changed | `ddd-controls` |
| 5 | Code | Grandfathered code modified without DDD scope, new constructs without passports | `ddd-ground` |
| 6 | Project context | Dependencies changed but `project-context.yaml` not updated | `ddd-book` |
| 7 | Cache | Cache files not content-addressed, missing entries, digest mismatch | `ddd-scope` |

### Drift report format

```yaml
id: DRFT-001
type: evidence_drift
lock_entry: EL-003
expected_digest: sha256:abc123...
actual_digest: sha256:def456...
severity: high
description: "Source content has changed since evidence lock was created"
recommended_action: "Re-evaluate claims citing EL-003. Update evidence lock."
```

### Severity guidance

| Severity | Meaning |
|---|---|
| `critical` | Evidence underlying a T3 claim has drifted — claims may be unfounded |
| `high` | Evidence for T2 claims drifted, or doc significantly mismatches code |
| `medium` | Freshness expired, minor doc mismatch, uncompiled obligation |
| `low` | Cosmetic drift, grandfathered code minor change |

## Good vs bad drift check

**Good**:
```
Evidence drift: EL-003 (Next.js docs) — re-fetched, digest changed
→ New content contradicts C-055 ("fetch caches by default")
→ Severity: high (T2 claim affected)
→ All changes citing EL-003 return to UNSCOPED
→ Route to ddd-scope for re-acquisition
```

**Bad**:
```
Evidence drift: EL-003 — "source probably changed, I'll just re-lock it"
→ No digest comparison
→ No check of which claims are affected
→ No lifecycle re-entry
→ Silent conformance failure: claims may be unfounded but still active
```

## Rationalization table

| Excuse | Reality |
|---|---|
| "Drift checks are overkill, we just locked the evidence" | Evidence drifts the moment vendor docs are updated. Daily checks catch it before claims become unfounded. |
| "I'll just re-lock without checking affected claims" | Re-locking without checking which claims depend on the drifted evidence leaves potentially false claims active. Trace the dependency. |
| "Project context drift doesn't matter" | If `project-context.yaml` says `zod@3.23` but `package-lock.json` has `zod@3.24`, every evidence lock entry for zod may be stale. |
| "Cache drift is cosmetic" | Corrupted cache means verification is checking against wrong content. That's a conformance failure, not cosmetics. |
| "I'll skip the pre-release drift check" | Critical drift findings SHOULD block Book release. Skipping means shipping a Book with potentially unfounded claims. |

## Lifecycle re-entry

When drift is detected, affected changes re-enter the lifecycle — **see `references/drift-dimensions.md`** for the full transition table. Key rule: only changes depending on the invalidated evidence are affected. Unrelated changes are not disrupted.

## CI integration

- Drift checks SHOULD run on a schedule (daily or weekly)
- Drift checks MUST run before Book release
- Critical drift findings SHOULD block Book release
- Drift summary is stored in `.ddd/reports/`

## Self-improvement

1. Is the same evidence drifting repeatedly? If so, the freshness policy is too lenient — tighten it in the evidence lock entry.
2. Are drift checks finding issues that code review should have caught? If so, the review process needs DDD awareness — add drift findings to the review checklist.
3. Are lifecycle re-entries too disruptive? If unrelated changes keep getting disrupted, the dependency tracing in the drift checker is too broad — tighten the scope.

## Spec reference

- SPEC.md §8.3 (Lifecycle re-entry), §12 (Executable Controls), §20.5 (Worked example)
