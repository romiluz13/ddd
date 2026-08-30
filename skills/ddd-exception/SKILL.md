---
name: ddd-exception
description: >
  Use when a consequential claim has no supporting documentation, sources conflict,
  runtime behavior differs from documented behavior, or a gap is discovered during
  reverse sweep.
metadata:
  author: ddd-methodology
  version: "0.3.0"
---

# ddd-exception

**HONEST GAPS BEAT FABRICATED CITATIONS. EVERY EXCEPTION RECORDS WHAT WAS SEARCHED.**

Core principle: Gaps are inevitable. Hidden gaps are conformance failures. Recording what was searched makes gaps honest and actionable.

Violating the letter of the rules is violating the spirit of the rules.

## When to invoke

- A consequential claim has no supporting documentation
- Sources conflict and cannot be resolved at the current authority level
- Runtime behavior differs from documented behavior
- A gap is discovered during reverse sweep
- An experiment produces behavior not covered by official docs
- A human approves proceeding under known risk

### When NOT to use

- The claim has supporting evidence — no gap means no exception needed
- As a shortcut to avoid evidence gathering — run `ddd-scope` instead
- For T0 claims with no impact — T0 exceptions are non-blocking but still require a search record

## What it does

### Step 1: Classify the gap

Determine the exception type — **see `references/exception-types.md`** for the full type table, escalation model, and anti-Goodhart measures:

| Type | When |
|---|---|
| `unknown` | No evidence found after search |
| `unsupported` | Evidence found but insufficient |
| `conflicting` | Sources disagree within same claim domain |
| `experimental` | Runtime behavior documented but not officially supported |

### Step 2: Determine derived tier

Use the two-axis model (SPEC.md §13.2): `claim_kind` × `impact` → derived tier.

An undocumented authentication API call is `operational` kind with `critical` impact → T3, not a harmless API exception.

### Step 3: Record the exception

```yaml
id: EX-007
claim: C-055
type: unknown
description: "No official documentation found for..."
rationale: "..."
search_record: "Checked: vendor docs, project ADRs, OWASP. None cover this case."
status: pending-approval
```

**Machine API**: `exception(claim_id, type, rationale) → exception_id`

### Step 4: Risk-based escalation

| Tier | Handling |
|---|---|
| T0/T1 | Record with rationale. No block. |
| T2 | Record and flag. SHOULD resolve before merge. Approval: Lite → agent, Assurance → human. |
| T3 | **Blocked.** Human approval required. Cannot proceed without waiver. |

### Step 5: Approval (when required)

Create approval record with approver, rationale, and `risk_accepted: true`. Update exception status to `approved`.

### Step 6: Resolve or supersede

- Evidence found → create claim, trace it, supersede exception
- Design changes to eliminate gap → supersede exception
- Exception rejected → set `status: rejected`

## Examples

<Good>
```
Type: unknown
Search record: "Checked: Next.js docs v15.1, React docs, GitHub issues #1234, Stack Overflow. None mention this edge case."
Rationale: "Behavior observed in production but not documented. Risk accepted for T1 claim."
Status: approved (agent, T1 non-blocking)
```

</Good>

<Bad>
```
Type: unknown
Search record: "" (empty)
Rationale: "Couldn't find docs"
Status: pending-approval
→ Conformance failure: no search_record. This is citation fabrication, not an honest gap.
```
</Bad>

## Rationalization table

| Excuse | Reality |
|---|---|
| "I'll just mark it as T0 to avoid the approval" | Tier is derived from claim_kind × impact, not chosen. Downgrading to avoid approval is Goodhart. |
| "I don't need a search record, there's obviously no docs" | An exception without a search_record is a conformance failure. Document what you checked. |
| "The exception count is high, I'll skip recording some" | High exception counts trigger methodology review, not shortcuts. Every gap must be visible. |
| "Runtime behavior overrides the docs" | Runtime behavior is a cross-domain discrepancy, not an override. Record it as `experimental`. |
| "I'll retract this claim silently" | Claim retraction requires updating all affected constructs and returning the change to UNSCOPED. Silent retraction is a conformance failure. |

## Claim retraction

A claim MAY be retracted when false, superseded, or no longer applicable. **See `references/exception-types.md`** for the full retraction procedure. Key rule: a retracted claim MUST NOT be cited by any active construct. Any change citing the retracted claim MUST return to `UNSCOPED`.

## Cross-domain discrepancies

When documentation and runtime behavior disagree:
- This is NOT a same-authority contradiction
- Vendor docs are authoritative for *supported* API semantics
- Experiments are authoritative for *observed* runtime behavior
- The experiment does not override documentation; it records a discrepancy

## Self-improvement

1. Are exceptions clustering around a specific dependency or domain? If so, that area needs better evidence acquisition in `ddd-scope`.
2. Are T3 exceptions common? If so, the project may need Assurance profile by default, or the risk classification in `ddd-scope` is too conservative.
3. Are exceptions being resolved quickly or accumulating? Accumulating exceptions indicate documentation debt — route to `ddd-book` for sync.

## Spec reference

- SPEC.md §5.5 (Conflict resolution), §14 (Exceptions and Epistemic Gaps), §16 (Conformance Profiles)
