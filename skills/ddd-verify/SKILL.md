---
name: ddd-verify
description: >
  Compliance Sweep gate for DDD. Performs forward and reverse traceability sweeps,
  citation entailment checks, and conformance determination. Use when implementation
  is declared complete, before merge to verify conformance, when auditing DDD
  compliance, or after evidence changes.
metadata:
  author: ddd-methodology
  version: "0.3.0"
---

# ddd-verify

**Forward trace, reverse sweep, evidence entailment, gate and conformance audit.**

## When to invoke

- Implementation is declared complete (Compliance Sweep gate, SPEC.md §8.1)
- Before merge to verify conformance
- When auditing a project's DDD compliance
- After evidence changes (re-verification)

## What it does

### Step 1: Forward sweep

Verify that documented decisions are implemented:

```
requirement → claim → evidence → implementation → validation
```

For each claim:
1. Check that every L1 claim has at least one L2 construct
2. Check that every L2 construct has at least one L1 claim or T0 exemption
3. Check that L3 validation exists for T2+ claims
4. Check that T3 claims have independent refutation (Assurance profile)

**Machine API**: `sweep(direction: forward) → violations[]`

### Step 2: Reverse sweep

Verify that every consequential code behavior has documentary lineage:

```
consequential implementation behavior → claim or approved exception
```

This is what prevents undocumented functionality and citation laundering.

1. Identify all consequential behaviors in the changed code
2. For each, find a corresponding claim or approved exception
3. Flag any behavior with no claim and no exception as a violation

**Machine API**: `sweep(direction: reverse) → violations[]`

### Step 3: Citation entailment (SPEC.md §13.4)

For each claim-source pair, perform the full entailment verification procedure:

1. **Locate the cited section**: Open the evidence lock entry and navigate to the specific `sections` referenced by the claim's `ref` field. If the section cannot be located, the citation fails.

2. **Read the source content**: Read the actual cached content at the cited section. Do NOT rely on the claim author's summary.

3. **Classify the entailment**:
   - `explicit`: the source directly states the claim
   - `implicit`: the source says A and B, from which the claim logically follows (rationale MUST explain derivation)
   - `paraphrase`: the claim is a semantically equivalent restatement
   - `not-entailed`: the source does not address the claim — conformance failure
   - `contradicts`: the source states the opposite — conformance failure

4. **Record results**: Each claim-source pair records the entailment classification with verifier notes.

5. **Prioritize by tier**:
   - T3 claims: every citation MUST be verified
   - T2 claims: every citation MUST be verified
   - T1 claims: sample verification (at least 30% of citations)
   - T0 claims: no individual citation required

### Step 3a: Test-code traceability (SPEC.md §13.6)

Tests are L3 validations but are also code. Classify test code:
- Unit tests for traced claims: T0, covered by the claim they validate
- Integration tests for behavioral claims: T2, MUST trace to the behavioral claim
- Contract tests for API claims: T1, MUST trace to the API claim
- Security tests for operational claims: T3, MUST trace to the operational claim
- A test that validates no claim in the ledger is a reverse-sweep violation

### Step 4: Compliance report

Generate a compliance report in `.ddd/reports/`:

```yaml
schema_version: 0.1.0
id: RPT-001
change_id: CH-001
generated_at: 2026-08-29T12:00:00Z
profile: lite
forward_sweep:
  total_claims: 3
  traced: 3
  untraced: 0
reverse_sweep:
  total_constructs: 5
  documented: 5
  undocumented: 0
  exceptions: 0
citation_entailment:
  total_citations: 4
  entailed: 4
  not_entailed: 0
exceptions:
  blocking: 0
  non_blocking: 0
  pending_approval: 0
verdict: CONFORMANT
```

### Step 5: Conformance determination

| Condition | Result |
|---|---|
| All claims verified, no blocking exceptions (T0/T1 non-blocking OK) | `CONFORMANT` |
| Forward trace complete, exceptions approved at required level | `WAIVED` |
| Required evidence not found for a consequential claim | `BLOCKED_EVIDENCE_GAP` |
| Same-authority sources conflict within a claim domain | `BLOCKED_CONTRADICTION` |
| Verification failed (trace incomplete, citation not entailed, undocumented behavior) | `NONCONFORMANT` |

**Assurance profile additionally requires:**
- Assurance Review passed (T3 refutation report complete)
- Human approval for high-impact decisions
- Role separation verified

### Step 6: CI integration

- Lite profile: CI MAY verify that every change reaches `CONFORMANT` or `WAIVED` before merge
- Assurance profile: CI MUST verify this

## Enforcement modes (SPEC.md §4.2.1)

Each check records its enforcement mode:
- `manual`: human performs, DDD provides checklist
- `agent-assisted`: agent performs, human reviews report
- `tool-enforced`: automated tool performs, failures block

V1 SHOULD NOT imply semantic completeness can be proven automatically.

## Conformance test suite (SPEC.md §18.2)

A DDD conformance test suite SHOULD include:
- Valid Book passing Compliance Sweep
- Invalid citation (source does not entail claim) failing
- Undocumented consequential behavior failing reverse sweep
- Stale evidence lock (hash mismatch) failing freshness check
- T3 claim lacking refutation failing Assurance profile
- Circular self-justification (agent-authored-unapproved as evidence) failing
- Prompt-injection attempt in retrieved docs neutralized

## Lifecycle state

- `IMPLEMENTING → VERIFYING` (implementation declared complete)
- `VERIFYING → CONFORMANT` (all checks pass)
- `VERIFYING → WAIVED` (exceptions approved)
- `VERIFYING → NONCONFORMANT` (verification failed)
- `VERIFYING → BLOCKED_CONTRADICTION` (sources conflict)
- `NONCONFORMANT → IMPLEMENTING` (implementation corrected to address violations — rework loop)

### Rework loop (`NONCONFORMANT → IMPLEMENTING`)

When verification produces `NONCONFORMANT`:
1. The compliance report identifies specific violations (untraced claims, undocumented behavior, citation gaps)
2. The implementer corrects the code to address each violation
3. Updated construct-to-claim traces are produced for the corrected code
4. The change returns to `IMPLEMENTING`, then re-enters `VERIFYING` when ready

This loop continues until all violations are resolved (→ `CONFORMANT`), exceptions are approved (→ `WAIVED`), or a blocking gap is discovered (→ `BLOCKED_EVIDENCE_GAP` or `BLOCKED_CONTRADICTION`).

## Spec reference

- SPEC.md §8.1 (Compliance Sweep gate), §8.3 (Lifecycle state machine), §13 (Traceability and Verification: §13.1 nested model, §13.2 proof tiers, §13.3 bidirectional sweeps, §13.4 citation entailment, §13.6 test-code traceability), §16 (Conformance Profiles), §18 (Evaluation)
