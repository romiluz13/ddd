---
name: ddd
description: >
  Use when starting a change in a DDD-conformant project, when asked "what DDD step
  should I do next?", when a workflow hook fires (Evidence Scope, Evidence Lock,
  Grounding Check, Compliance Sweep, Assurance Review), or when adopting DDD on a
  brownfield codebase.
metadata:
  author: ddd-methodology
  version: "0.3.0"
---

# ddd

**NO CODE WITHOUT EVIDENCE. NO CLAIMS WITHOUT TRACES. NO MERGE WITHOUT CONFORMANCE.**

Core principle: Every change travels scope → ground → implement → verify → ship. The gates between stages are what make DDD more than "read docs and code."

## When to invoke

- A change is about to be implemented in a DDD-conformant project
- Someone asks "what DDD state is this project in?" or "what DDD step should I do next?"
- A workflow hook fires (Evidence Scope, Evidence Lock, Grounding Check, Compliance Sweep, Assurance Review)
- Adopting DDD on an existing (brownfield) codebase

### When NOT to use

- The project has no `.ddd/` directory — route to `ddd-book` to initialize first
- The change only affects non-governed (grandfathered) code and no new governance is needed

## The story of a change

Every change in DDD travels the same road: **scope → ground → implement → verify → ship**. The gates between stages are what make DDD more than "read docs and code." Here's how to find where you are.

### First, is DDD even set up?

Read `.ddd/book.yaml`. If it doesn't exist, you're at the very beginning. Route to **`ddd-book`** to initialize the Project Engineering Book, detect the project stack, and create the `.ddd/` directory structure. If the project is brownfield (existing code, no DDD coverage), route to **`ddd-audit`** to retroactively extract claims from code and match them to existing docs.

### A new change enters the pipeline

When requirements are known but evidence hasn't been gathered, the change is `UNSCOPED`. Route to **`ddd-scope`**. This skill detects the project stack, classifies the change against the 18-dimension knowledge taxonomy, discovers version-matched evidence via doc adapters, and produces the evidence lock. The change exits `ddd-scope` as `EVIDENCE_REQUIRED` or, if evidence is already locked, `EVIDENCE_LOCKED`.

**Fast path check**: If `ddd-scope` classifies all claims as T0 (mechanical, low impact), skip to a T0 scope record and go straight to `ddd-verify`. If all claims are T1 (API-level, low/medium impact), take the T1 fast path: lightweight evidence record → `ddd-ground` (claims only) → `ddd-verify`. For T2+ (any behavioral, architectural, or operational claim), take the full pipeline.

### Evidence is locked — prepare for implementation

When evidence is locked, the change is `EVIDENCE_LOCKED`. Route to **`ddd-ground`**. This skill assembles the evidence packet (a bounded, change-specific context bundle), extracts atomic claims from sources, traces code constructs to claims, and extracts control obligations. The change exits `ddd-ground` as `IMPLEMENTING`.

If domain modeling is needed (state machines, aggregates, threat models), route to **`ddd-model`** before or during grounding. Models ground design decisions and object passports.

### Implementation is done — verify

When implementation is declared complete, the change is `VERIFYING`. Route to **`ddd-verify`**. This skill runs forward sweep (every claim has a construct), reverse sweep (every construct has a claim or exception), citation entailment (sources actually say what claims say), and produces a compliance report. The change exits as `CONFORMANT`, `WAIVED`, `NONCONFORMANT`, `BLOCKED_EVIDENCE_GAP`, or `BLOCKED_CONTRADICTION`.

If `NONCONFORMANT`: fix the violations and re-enter `VERIFYING`. If a gap is found: route to **`ddd-exception`**.

### Assurance profile — adversarial review

If the project is Assurance profile and T3 claims exist, route to **`ddd-refute`** after verification. An independent agent attempts to refute each T3 claim by challenging citations, evidence, and reasoning. The Assurance Review gate requires all refutation reports to be reviewed.

### Gaps and conflicts — anytime

At any point, if a consequential claim has no supporting documentation, sources conflict, or runtime behavior differs from docs, route to **`ddd-exception`**. This skill records the gap, determines the derived tier, and escalates: T0/T1 non-blocking, T2 should resolve before merge, T3 blocked until human approval.

If a claim is discovered to be false or superseded, `ddd-exception` also handles claim retraction — marking the claim retracted, finding affected constructs, and returning the change to `UNSCOPED`.

### Consequential design decisions — when needed

When a decision is architecturally consequential, security-sensitive, expensive to reverse, or supported by multiple plausible methodologies, route to **`ddd-decide`**. This runs a grounded design tournament with predeclared weighted criteria, 2-3 alternatives, and negative knowledge preservation. Do NOT run tournaments for naming variables or ordinary CRUD.

### Controls — when obligations exist

When `ddd-ground` has extracted control obligations (enforceable rules from documentation), route to **`ddd-controls`**. This compiles obligations into executable guardrails (dependency-cruiser rules, eslint plugins, etc.), validates them with three-check protocol, and sets enforcement levels.

### Drift — scheduled

Route to **`ddd-drift`** on a schedule (CI cron, pre-commit, or on-demand). This scans 7 dimensions: evidence, documentation, decision, control, code, project context, and cache drift. Findings route back to the appropriate skill for remediation.

## Rationalization table

| Excuse | Reality |
|---|---|
| "I know this API from training data" | Your parametric memory is stale. That's why evidence lock exists. Run `ddd-scope`. |
| "This change is too simple for DDD" | Simple changes get T0 fast path. The scope check takes 30 seconds. Run `ddd-scope`. |
| "I'll verify after merge" | Reverse sweep catches undocumented behavior. Fixing it post-merge costs 10x. Run `ddd-verify` before merge. |
| "The docs probably say the same thing" | Citation entailment checks whether sources actually support claims. "Probably" is a conformance failure. Run `ddd-verify`. |
| "I don't need an exception, I'll just skip it" | An undocumented consequential claim is a reverse-sweep violation. Record the exception honestly. Run `ddd-exception`. |

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
  coverage: 20%
current_change:
  id: CH-001
  lifecycle_state: EVIDENCE_LOCKED
  fast_path: null  # null | "t0-only" | "t1-fast-path"
  active_exceptions: 0
  blocking_exceptions: 0
next_action: "Assemble evidence packet and begin implementation"
route_to: ddd-ground
```

## Self-improvement

1. Did the routing decision match the change's actual complexity? If you routed to a fast path but ended up doing full pipeline work, the scope classification was wrong.
2. Did any gate pass too easily? If verification found zero violations on a complex change, the reverse sweep may have missed constructs.
3. Did you discover a routing pattern not covered above? Add it to this skill's narrative.

## Spec reference

- SPEC.md §1 (Purpose), §2 (Terminology), §3 (Principles), §4 (Architecture), §8 (Gates and Lifecycle), §15.1 (Hook specification), §15.2 (Workflow integration), §15.3 (Machine API)
