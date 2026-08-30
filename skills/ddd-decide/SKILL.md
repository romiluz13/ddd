---
name: ddd-decide
description: >
  Grounded design tournament for DDD. Runs a structured multi-alternative evaluation with
  predeclared weighted criteria, jury structure, and negative knowledge preservation.
  Use when a decision is architecturally consequential, security-sensitive, expensive to
  reverse, or supported by multiple plausible methodologies.
metadata:
  author: ddd-methodology
  version: "0.3.0"
---

# ddd-decide

**NO DECISION WITHOUT ALTERNATIVES. NO ALTERNATIVE WITHOUT EVIDENCE. NO SELECTION WITHOUT CRITERIA.**

Run a grounded design tournament, produce the selected ADR and rejected alternatives.

## When to invoke

A tournament is **required** when a decision is (SPEC.md §10.1):
- Architecturally consequential
- Security or safety sensitive
- Expensive to reverse
- Supported by multiple plausible methodologies
- Based on uncertain or conflicting evidence
- Likely to shape many future objects

A tournament MUST NOT run for naming variables, ordinary CRUD, or settled project conventions.

## What it does

### Step 1: Freeze the design brief

All candidates receive identical: requirements, constraints, evidence corpus (from evidence lock), risks, quality priorities, architecture restrictions.

### Step 2: Generate 2-3 independent alternatives

- **Mandatory**: simplest viable design (the baseline that could work)
- **Mandatory**: quality/domain-optimized design
- **Optional**: hybrid when genuinely distinct from the above two

Independent agent contexts SHOULD be used to reduce anchoring.

### Step 3: Produce standardized design cards

Each card states: object and responsibility model, data and control flow, invariants, failure behavior, trust boundaries, applied methodologies, rejected complexity, required controls, operational consequences, evidence citations, known uncertainties.

### Step 4: Evaluate against predeclared criteria

Hard constraints are pass/fail. Remaining criteria are weighted **before** candidates are revealed:

| Criterion | Type |
|---|---|
| Correctness and invariant coverage | Weighted |
| Simplicity | Weighted |
| Documentary support | Weighted |
| Security | Weighted |
| Testability | Weighted |
| Operability | Weighted |
| Evolvability | Weighted |
| Reversibility | Weighted |
| Performance | Weighted |
| Implementation and maintenance cost | Weighted |

No popularity voting.

### Step 5: Jury structure

- Deterministic constraint checker
- Evidence-validity reviewer
- Relevant specialist critics
- Independent synthesis agent (cannot be a candidate's author)
- Human approval for high-impact decisions

### Step 6: Resolve empirical disputes

When evidence cannot settle a dispute, authorize a bounded spike, benchmark, or experiment.

### Step 7: Preserve negative knowledge

Rejected designs are summarized in the ADR: why they lost, which assumptions mattered, under what future conditions they should be reconsidered.

## Good vs bad tournament

**Good**:
```
Decision: Caching strategy for product catalog
Alternatives: (1) in-memory TTL, (2) Redis with invalidation, (3) stale-while-revalidate with ISR
Hard constraint: no new infra → eliminates (2)
Criteria weighted BEFORE reveal: correctness 0.3, simplicity 0.2, documentary support 0.2, ...
Winner: (3) — satisfies constraint, best balance, strongest docs
Negative knowledge: Redis rejected due to V1 infra boundary, reconsider when Redis adopted
```

**Bad**:
```
Decision: Caching strategy
Alternatives: (1) "use Redis" (2) "use cache" (vague, no evidence)
No hard constraints declared
Criteria weighted AFTER seeing candidates (bias)
Winner: (1) because "Redis is popular"
No negative knowledge recorded
→ No evidence, no criteria, no learning. Tournament violated.
```

## Rationalization table

| Excuse | Reality |
|---|---|
| "There's only one obvious solution, no need for alternatives" | If the decision is consequential enough to trigger a tournament, there are always alternatives. The simplest viable design is a mandatory alternative. |
| "I know which one is best, I'll just pick it" | Predeclare criteria before revealing candidates. Selecting first and justifying after is rationalization, not evaluation. |
| "The alternatives are too similar to matter" | If they're genuinely identical, collapse them. But "similar" often hides different failure modes and operational consequences. |
| "I don't need evidence for the design, just the implementation" | Design cards cite evidence. A methodology choice without documentary support is an unsupported architectural claim. |
| "Negative knowledge isn't worth recording" | Rejected alternatives prevent recurring debates. Without them, the same rejected approach will be proposed again in 3 months. |

## Self-improvement

1. Did the selected design require unexpected rework? If so, the criteria weights were wrong — adjust for future tournaments.
2. Was a rejected alternative later reconsidered? If the negative knowledge didn't predict the conditions for reconsideration, improve the rejection summary.
3. Did the tournament take too long? If so, the scope was too broad — narrow the design brief or reduce alternatives.

## Spec reference

- SPEC.md §10 (Design Tournament), §20.7 (Worked example)
