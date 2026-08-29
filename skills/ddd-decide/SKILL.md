---
name: ddd-decide
description: >
  Grounded design tournament for DDD. Runs a structured multi-alternative evaluation with
  predeclared weighted criteria, jury structure, and negative knowledge preservation.
  Use when a decision is architecturally consequential, security-sensitive, expensive to
  reverse, or supported by multiple plausible methodologies.
metadata:
  author: ddd-methodology
  version: "0.2.6"
---

# ddd-decide

**Run a grounded design tournament, produce the selected ADR and rejected alternatives.**

V2 skill — available after V1 foundation is established.

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

All candidates receive identical:
- Requirements
- Constraints
- Evidence corpus (from evidence lock)
- Risks
- Quality priorities
- Architecture restrictions

### Step 2: Generate 2-3 independent alternatives

- **Mandatory**: simplest viable design (the baseline that could work)
- **Mandatory**: quality/domain-optimized design
- **Optional**: hybrid when genuinely distinct from the above two

Independent agent contexts SHOULD be used to reduce anchoring.

### Step 3: Produce standardized design cards

Each card states:
- Object and responsibility model
- Data and control flow
- Invariants
- Failure behavior
- Trust boundaries
- Applied methodologies and applicability rationale
- Rejected complexity
- Required controls
- Operational consequences
- Evidence citations
- Known uncertainties

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

Rejected designs are summarized in the resulting ADR:
- Why they lost
- Which assumptions mattered
- Under what future conditions they should be reconsidered

Do not retain pages of agent debate. Keep rejected alternatives compactly.

## Output

1. Selected design with grounded ADR in `.ddd/decisions/` (or project's ADR directory)
2. Rejected alternatives recorded as negative knowledge in the ADR
3. Updated claims and obligations if the decision introduces new ones
4. Updated passports if the decision creates or modifies responsibility-bearing units

## Worked example (SPEC.md §20.7)

Caching strategy for product catalog:
- Tournament triggered (architecturally consequential, hard to reverse)
- Three alternatives: in-memory TTL, Redis with invalidation, stale-while-revalidate with ISR
- Hard constraint (no new infra) eliminated Redis
- Predeclared criteria weighted: correctness, simplicity, documentary support
- Selected: stale-while-revalidate (satisfies constraint, best balance, strongest docs)
- Negative knowledge: Redis rejected due to V1 infra boundary, reconsider when Redis adopted

## Spec reference

- SPEC.md §10 (Design Tournament: §10.1 trigger criteria, §10.2 tournament protocol), §20.7 (Worked example)
