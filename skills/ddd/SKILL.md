---
name: ddd
description: >
  Router skill for Docs-Driven Development (DDD). Determines the appropriate DDD
  operation for a change and reports project status. Routes to T0/T1 fast paths when
  eligible. Use when starting a new change in a DDD-conformant project, when asked
  "what DDD step should I do next?", or when a workflow hook fires (Evidence Scope,
  Evidence Lock, Grounding Check, Compliance Sweep, Assurance Review).
metadata:
  author: ddd-methodology
  version: "0.3.0"
---

# ddd

**Router skill for Docs-Driven Development (DDD).**

Determines the appropriate DDD operation and reports project status. Routes to fast paths when eligible.

## When to invoke

- A change is about to be implemented in a DDD-conformant project
- Someone asks "what DDD state is this project in?"
- Someone asks "what DDD step should I do next?"
- A workflow hook fires (Evidence Scope, Evidence Lock, Grounding Check, Compliance Sweep, Assurance Review)
- Adopting DDD on an existing (brownfield) codebase

## What it does

1. Reads `.ddd/book.yaml` to determine if the project is DDD-conformant
2. Reads `.ddd/project-context.yaml` to understand the project's tech stack
3. Reads the current change's lifecycle state (if a change is in progress)
4. Determines which DDD skill or machine API primitive is appropriate
5. Checks for fast path eligibility (T0-only or T1 fast path)
6. Reports: project profile (Lite/Assurance), current lifecycle state, active exceptions, coverage status, stack summary

## Routing table

| Situation | Route to | Machine API |
|---|---|---|
| `.ddd/` does not exist — initialize DDD | `ddd-book` | — |
| Brownfield codebase — audit existing code | `ddd-audit` | — |
| New change, no evidence gathered | `ddd-scope` | `classify(change) → domains` |
| Stack not yet detected (no project-context.yaml) | `ddd-scope` (Step 0) / `ddd-book` | — |
| Evidence scoped, need to acquire and lock | `ddd-scope` (continue) | `discover(domains) → evidence[]` then `lock(evidence[]) → lock_entry` |
| Need to assemble context for implementation | `ddd-ground` | `packet(change, lock) → evidence_packet` |
| Need to extract claims from sources | `ddd-ground` | `claim(statement, source) → claim_id` |
| Need to trace constructs to claims | `ddd-ground` | `trace(claim_id, construct) → trace_entry` |
| Domain modeling needed (state machines, aggregates, threat models) | `ddd-model` | — |
| Implementation done, need verification | `ddd-verify` | `sweep(direction) → violations[]` |
| Gap, conflict, or unsupported claim found | `ddd-exception` | `exception(claim_id, type, rationale) → exception_id` |
| Claim discovered to be false or superseded | `ddd-exception` (retraction) | — |
| Consequential design decision needed | `ddd-decide` (V2) | — |
| T3 claim needs adversarial review | `ddd-refute` (V2) | `refute(claim_id) → refutation_report` |
| Control obligation needs compilation | `ddd-controls` (V3) | `compile(obligation_id, adapter) → control` |
| Need to check for drift | `ddd-drift` (V3) | `drift_check() → drift_report[]` |
| Book needs initialization or update | `ddd-book` | — |

## Fast path routing

| Change classification | Route | Required artifacts |
|---|---|---|
| **T0-only** (all claims mechanical, low impact) | `ddd-scope` → T0 scope record → `ddd-verify` (lite) | T0 scope record only (§4.2.1) |
| **T1 fast path** (all claims API-level, low/medium impact) | `ddd-scope` → lightweight evidence record → `ddd-ground` (claims only) → `ddd-verify` | Lightweight record with version-matched evidence per API (§4.2.2) |
| **T2+** (any behavioral, architectural, or operational claim) | Full pipeline: `ddd-scope` → `ddd-ground` → `ddd-verify` → (`ddd-refute` if T3) | Full evidence packet, claims, traces, validations |

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
  ddd_version: 0.3.0
  profile: lite  # lite | assurance
  book_version: 0.1.0
  stack:
    language: TypeScript
    framework: Next.js 15.1.0
    database: PostgreSQL 16
  coverage: 20%  # DDD-governed vs total
current_change:
  id: CH-001
  lifecycle_state: EVIDENCE_LOCKED
  fast_path: null  # null | "t0-only" | "t1-fast-path"
  active_exceptions: 0
  blocking_exceptions: 0
next_action: "Assemble evidence packet and begin implementation"
route_to: ddd-ground
```

## Spec reference

- SPEC.md §1 (Purpose), §2 (Terminology), §3 (Principles), §4 (Architecture: §4.1, §4.2, §4.2.1 enforcement modes, §4.2.2 T1 fast path), §8 (Gates and Lifecycle: §8.3 state machine), §9.8 (Stack detection), §15 (Integration: §15.1, §15.2, §15.3 machine API), Annex A.1

