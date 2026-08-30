---
name: ddd-exception
description: >
  Exception management for DDD. Records, reviews, escalates, and resolves epistemic gaps
  using a risk-based escalation model. Use when a consequential claim has no supporting
  documentation, sources conflict, runtime behavior differs from documented behavior,
  or a gap is discovered during reverse sweep.
metadata:
  author: ddd-methodology
  version: "0.3.0"
---

# ddd-exception

**Record, review, escalate, and resolve epistemic gaps.**

## When to invoke

- A consequential claim has no supporting documentation
- Sources conflict and cannot be resolved at the current authority level
- Runtime behavior differs from documented behavior
- A gap is discovered during reverse sweep
- An experiment produces behavior not covered by official docs
- A human approves proceeding under known risk

## What it does

### Step 1: Classify the gap

Determine the exception type:

| Type | Description |
|---|---|
| `unknown` | No evidence found after search |
| `unsupported` | Evidence found but insufficient |
| `conflicting` | Sources disagree within the same claim domain |
| `experimental` | Runtime behavior documented but not officially supported |

### Step 2: Determine derived tier

Use the two-axis model (SPEC.md §13.2):
- `claim_kind`: mechanical | api | behavioral | architectural | operational
- `impact`: low | medium | high | critical
- `derived tier`: from the 5×4 matrix

An undocumented authentication API call is `operational` kind with `critical` impact → T3, not a harmless API exception.

### Step 3: Record the exception

```yaml
schema_version: 0.1.0
id: EX-007
claim: C-055
type: unknown  # unknown | unsupported | conflicting | experimental
description: "No official documentation found for..."
recorded_at: 2026-08-29T14:00:00Z
recorded_by: agent
approved_by: null  # required for T2+
approval_id: null  # references AP-001 when approved
rationale: "..."
risk_assessment: "Medium"
search_record: "Checked: vendor docs, project ADRs, OWASP. None cover this case."
status: pending-approval  # pending-approval | approved | rejected | superseded
superseded_by: null
```

**Machine API**: `exception(claim_id, type, rationale) → exception_id`

### Step 4: Risk-based escalation

| Derived tier | Handling |
|---|---|
| T0 / T1 | Record with rationale. No block. Change remains in current lifecycle state. Non-blocking exceptions do not prevent `CONFORMANT`. |
| T2 | Record and flag. SHOULD be resolved before merge. If unresolved at merge, MUST receive approval: Lite → agent review, Assurance → human approval. |
| T3 | **Blocked.** Requires human approval. Cannot proceed without explicit waiver. |

### Step 5: Approval (when required)

Create an approval record:

```yaml
schema_version: 0.1.0
id: AP-001
target_type: exception
target_id: EX-007
approver: human
approver_id: "rom.iluz"
approved_at: 2026-08-29T14:00:00Z
rationale: "Runtime behavior confirmed; proceeding under documented risk"
risk_accepted: true
expires_at: null
```

Update exception `approved_by` and `approval_id` fields. Set status to `approved`.

### Step 6: Resolve or supersede

- If evidence is later found: create the claim, trace it, and supersede the exception (`status: superseded`, `superseded_by: null`)
- If the design changes to eliminate the gap: supersede the exception
- If the exception is rejected: set `status: rejected`

## Anti-Goodhart measures (SPEC.md §14.4)

- An exception count that is too high triggers a methodology review, not a block
- Exceptions MUST cite what was searched and why no evidence was found
- An exception without a `search_record` is a conformance failure
- The goal is honest gaps, not exception inflation or citation fabrication

## Cross-domain discrepancies (SPEC.md §5.5)

When documentation and runtime behavior disagree:
- This is NOT a same-authority contradiction
- Vendor docs are authoritative for *supported* API semantics
- Experiments are authoritative for *observed* runtime behavior
- The experiment does not override documentation; it records a discrepancy
- The observation MAY justify an experimental implementation under human approval

## Conflict resolution (SPEC.md §5.5)

1. Identify the claim domain (§5.1) and determine the primary authority
2. The primary authority prevails
3. If same-authority sources conflict within the same domain → `BLOCKED_CONTRADICTION`
4. If documentation vs runtime → record as cross-domain discrepancy, not override
5. Record the conflict and resolution in the exception ledger

## Lifecycle transitions

| From | To | Condition |
|---|---|---|
| Any state | `BLOCKED_EVIDENCE_GAP` | T3 exception without approval |
| `BLOCKED_EVIDENCE_GAP` | `EVIDENCE_REQUIRED` | New evidence found |
| `BLOCKED_EVIDENCE_GAP` | `WAIVED` | Human approves waiver |
| `BLOCKED_CONTRADICTION` | `EVIDENCE_REQUIRED` | Conflict resolved |
| `BLOCKED_CONTRADICTION` | `WAIVED` | Human approves under conflict |
| `WAIVED` | `CONFORMANT` | Exception resolved (evidence found or design changed) |

## Artifacts

- Exception records in `.ddd/exceptions/`
- Approval records in `.ddd/exceptions/` (or inline)
- Updated claim status in `.ddd/claims.yaml`

## Claim retraction (SPEC.md §14.5)

A claim MAY be retracted when discovered to be false, superseded, or no longer applicable:

1. Mark the claim with `status: retracted` and add `retracted_at` timestamp
2. Record `retraction_reason` (e.g., "Evidence source superseded", "Claim found false during refutation")
3. Identify all constructs tracing to the retracted claim (via trace matrix)
4. For each affected construct:
   - If behavior still needed: find or create a replacement claim with valid evidence
   - If behavior no longer needed: mark construct for removal
   - If neither: record an exception (type: `unknown`) for the construct
5. Update the trace matrix
6. Any change citing the retracted claim MUST return to `UNSCOPED` for re-scoping

A retracted claim MUST NOT be cited by any active construct. A construct still citing a retracted claim is a conformance failure.

## Spec reference

- SPEC.md §5.5 (Conflict resolution), §7.6.6 (Approval record), §7.6.7 (Exception record), §8.3 (Lifecycle transitions), §14 (Exceptions and Epistemic Gaps: §14.1-§14.4 exception types, §14.5 claim retraction), §16 (Conformance Profiles)
