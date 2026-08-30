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

**EXISTING CODE HAS BEHAVIOR. BEHAVIOR WITHOUT DOCUMENTATION IS A GAP. GAPS MUST BE VISIBLE.**

Retroactively build a DDD constitution draft for existing (brownfield) code.

## When to invoke

- Adopting DDD on an existing codebase (brownfield)
- Assessing documentation debt in legacy code
- Producing a coverage report for grandfathered code
- When `ddd-book` initialization finds existing code without DDD coverage
- When preparing a migration plan from non-DDD to DDD-governed development

## What it does

### Step 1: Scan the codebase

1. Read `project-context.yaml` (create via `ddd-book` if it doesn't exist)
2. Identify all source directories and their structure
3. Count total symbols (functions, classes, modules, components)
4. Classify each source directory by architecture layer (domain, application, infrastructure, UI)
5. Identify entry points, public APIs, and boundary crossings

### Step 2: Extract behavioral claims from code

For each significant code construct, infer what behavioral claim it implements. **See `references/audit-phases.md`** for the extraction patterns table.

Each extracted claim starts with `status: unknown` and empty `sources` — to be matched in Step 3.

### Step 3: Match claims to existing documentation

For each extracted claim, search for supporting evidence:
1. Check existing ADRs, `CONTEXT.md`, README, wiki
2. Check code comments and JSDoc/docstrings
3. Check test names and descriptions

For each match: update claim with source reference, set `status: known-and-supported` or `unsupported` or `unknown`.

### Step 4: Flag gaps and contradictions

Produce an audit report — **see `references/audit-phases.md`** for the full report schema. Key sections:
- Coverage: percentage of claims with evidence
- Gaps: claims with no documentation, ranked by severity
- Contradictions: code behavior vs documented behavior
- Legacy debt: grandfathered vs documented symbols

### Step 5: Produce draft Book

From the audit results: create `book.yaml`, `knowledge-map.yaml`, `claims.yaml`, `trace-matrix.yaml`, and exceptions for all `unknown` and `unsupported` claims.

### Step 6: Prioritize remediation

**See `references/audit-phases.md`** for the full prioritization table:

| Priority | Criteria |
|---|---|
| **P0** | Critical security/data integrity gaps, code-doc contradictions |
| **P1** | High-severity gaps in core domain logic, missing ADRs |
| **P2** | Medium-severity gaps, missing docs for internal utilities |
| **P3** | Low-severity gaps in non-consequential code |

## Good vs bad audit

**Good**:
```
Total symbols: 450, significant: 120, claims extracted: 85
Coverage: 38% (32 with evidence, 53 without)
Contradictions: 1 (code allows cancel after ship, ADR-007 forbids)
P0: Fix cancel state machine, create ADR for session handling
P1: Acquire retry pattern docs for OrderRepository
→ Draft Book created, exceptions for all gaps, remediation plan clear
```

**Bad**:
```
Total symbols: 450, claims extracted: 10 (only "obvious" ones)
Coverage: "looks good" (no percentage)
Contradictions: "none" (didn't check ADRs against code)
No prioritization
→ Audit missed 90% of constructs, gaps invisible, contradictions hidden
```

## Rationalization table

| Excuse | Reality |
|---|---|
| "Most of this code is simple, I'll skip it" | Simple code can have behavioral claims (validation rules, state transitions). Skipping creates invisible gaps. Audit everything significant. |
| "I don't need to check ADRs, the code is the source of truth" | In DDD, documentation is the source of truth. Code that contradicts ADRs is a P0 contradiction, not a design decision. |
| "The audit is too slow, I'll just do the important files" | Partial audits create false confidence. Unaudited code has unknown gaps. Either audit all or explicitly mark as grandfathered. |
| "I'll mark everything as grandfathered" | Grandfathered code is exempt from DDD scope, but modifications to it trigger DDD scope. Marking everything grandfathered defeats the purpose. |
| "No contradictions means the code is correct" | No contradictions means you didn't check hard enough. Compare state machines in code against ADRs, test behavior against documented contracts. |

## Incremental adoption

1. **Phase 1**: Fix all P0 gaps. Create evidence or exceptions for critical claims.
2. **Phase 2**: New changes in audited areas are DDD-governed. Grandfathered code stays exempt.
3. **Phase 3**: As changes touch grandfathered code, bring it into DDD scope (per §17.3).
4. **Phase 4**: Periodically re-audit to track coverage growth and debt reduction.

## Self-improvement

1. Did the audit miss any significant constructs? If so, the symbol classification criteria are too narrow — expand them.
2. Are contradictions clustering in a specific module? If so, that module has documentation debt — prioritize it for remediation.
3. Is coverage growing over time? If not, new code is being added without DDD scope — enforce the grandfathering boundary.

## Spec reference

- SPEC.md §17.3 (Incremental adoption), §17.4 (Monorepo scoping), §18.1 (Success metrics), §14 (Exceptions)
