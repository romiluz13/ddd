---
name: ddd
description: >
  Router skill for Docs-Driven Development (DDD). Determines the appropriate DDD
  operation for a change and reports project status. Use when starting a new change
  in a DDD-conformant project, when asked "what DDD step should I do next?", or when
  a workflow hook fires (Evidence Scope, Evidence Lock, Grounding Check, Compliance
  Sweep, Assurance Review).
metadata:
  author: ddd-methodology
  version: "0.2.6"
---

# ddd

**Router skill for Docs-Driven Development (DDD).**

Determines the appropriate DDD operation and reports project status.

## When to invoke

- A change is about to be implemented in a DDD-conformant project
- Someone asks "what DDD state is this project in?"
- Someone asks "what DDD step should I do next?"
- A workflow hook fires (Evidence Scope, Evidence Lock, Grounding Check, Compliance Sweep, Assurance Review)

## What it does

1. Reads `.ddd/book.yaml` to determine if the project is DDD-conformant
2. Reads the current change's lifecycle state (if a change is in progress)
3. Determines which DDD skill or machine API primitive is appropriate
4. Reports: project profile (Lite/Assurance), current lifecycle state, active exceptions, coverage status

## Routing table

| Situation | Route to | Machine API |
|---|---|---|
| New change, no evidence gathered | `ddd-scope` | `classify(change) → domains` |
| Evidence scoped, need to acquire and lock | `ddd-scope` (continue) | `discover(domains) → evidence[]` then `lock(evidence[]) → lock_entry` |
| Need to assemble context for implementation | `ddd-ground` | `packet(change, lock) → evidence_packet` |
| Need to extract claims from sources | `ddd-ground` | `claim(statement, source) → claim_id` |
| Need to trace constructs to claims | `ddd-ground` | `trace(claim_id, construct) → trace_entry` |
| Implementation done, need verification | `ddd-verify` | `sweep(direction) → violations[]` |
| Gap, conflict, or unsupported claim found | `ddd-exception` | `exception(claim_id, type, rationale) → exception_id` |
| Consequential design decision needed | `ddd-decide` (V2) | — |
| T3 claim needs adversarial review | `ddd-refute` (V2) | `refute(claim_id) → refutation_report` |
| Control obligation needs compilation | `ddd-controls` (V3) | `compile(obligation_id, adapter) → control` |
| Need to check for drift | `ddd-drift` (V3) | `drift_check() → drift_report[]` |
| Book needs initialization or update | `ddd-book` | — |

## Machine API

Beneath all DDD skills, a stable machine API exists (SPEC.md §15.3). Existing harnesses MAY invoke these primitives directly:

```
classify(change) → domains
discover(domains) → evidence[]
lock(evidence[]) → lock_entry
packet(change, lock) → evidence_packet
claim(statement, source) → claim_id
trace(claim_id, construct) → trace_entry
sweep(direction) → violations[]
refute(claim_id) → refutation_report
exception(claim_id, type, rationale) → exception_id
obligation(rule, source, scope) → obligation_id
compile(obligation_id, adapter) → control
drift_check() → drift_report[]
```

## Output format

```yaml
project:
  ddd_version: 0.2.6
  profile: lite  # lite | assurance
  book_version: 0.1.0
  coverage: 20%  # DDD-governed vs total
current_change:
  id: CH-001
  lifecycle_state: EVIDENCE_LOCKED
  active_exceptions: 0
  blocking_exceptions: 0
next_action: "Assemble evidence packet and begin implementation"
route_to: ddd-ground
```

## Spec reference

- SPEC.md §4 (Architecture), §8 (Gates and Lifecycle), §15 (Integration and Adapter Contract), Annex A.1
