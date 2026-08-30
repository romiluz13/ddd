# Exception Types and Escalation (SPEC.md §14)

## Exception types

| Type | Description | When |
|---|---|---|
| `unknown` | No evidence found after search | Searched vendor docs, ADRs, code comments — nothing covers this |
| `unsupported` | Evidence found but insufficient | Found a blog post but need official docs for an operational claim |
| `conflicting` | Sources disagree within same claim domain | Two vendor docs describe different API behavior for same version |
| `experimental` | Runtime behavior documented but not officially supported | API works in runtime but vendor says "undocumented, may change" |

## Risk-based escalation

| Derived tier | Handling |
|---|---|
| T0 / T1 | Record with rationale. No block. Non-blocking exceptions do not prevent `CONFORMANT`. |
| T2 | Record and flag. SHOULD be resolved before merge. If unresolved at merge: Lite → agent review, Assurance → human approval. |
| T3 | **Blocked.** Requires human approval. Cannot proceed without explicit waiver. |

## Anti-Goodhart measures

- An exception count that is too high triggers a methodology review, not a block
- Exceptions MUST cite what was searched and why no evidence was found
- An exception without a `search_record` is a conformance failure
- The goal is honest gaps, not exception inflation or citation fabrication

## Cross-domain discrepancies (documentation vs runtime)

- This is NOT a same-authority contradiction
- Vendor docs are authoritative for *supported* API semantics
- Experiments are authoritative for *observed* runtime behavior
- The experiment does not override documentation; it records a discrepancy
- The observation MAY justify an experimental implementation under human approval

## Claim retraction

A claim MAY be retracted when discovered to be false, superseded, or no longer applicable:

1. Mark claim `status: retracted` with `retracted_at` timestamp and `retraction_reason`
2. Identify all constructs tracing to the retracted claim (via trace matrix)
3. For each affected construct:
   - If behavior still needed: find or create a replacement claim with valid evidence
   - If behavior no longer needed: mark construct for removal
   - If neither: record an exception (type: `unknown`) for the construct
4. Update the trace matrix
5. Any change citing the retracted claim MUST return to `UNSCOPED` for re-scoping

A retracted claim MUST NOT be cited by any active construct. A construct still citing a retracted claim is a conformance failure.
