---
name: ddd-verify
description: >
  Use when implementation is declared complete, before merge to verify conformance,
  when auditing DDD compliance, or after evidence changes require re-verification.
metadata:
  author: ddd-methodology
  version: "0.3.0"
---

# ddd-verify

**IF IT'S NOT TRACED, IT DOESN'T EXIST. IF IT'S NOT ENTAILED, IT'S NOT SUPPORTED.**

Core principle: Conformance is verified by bidirectional sweep — forward (claims → code) and reverse (code → claims) — plus citation entailment.

Violating the letter of the rules is violating the spirit of the rules.

## When to invoke

- Implementation is declared complete (Compliance Sweep gate, SPEC.md §8.1)
- Before merge to verify conformance
- When auditing a project's DDD compliance
- After evidence changes (re-verification)

### When NOT to use

- Implementation is not yet declared complete — wait, then verify
- Gathering evidence — use `ddd-scope`
- Recording a gap — use `ddd-exception`

## What it does

### Step 1: Forward sweep

Verify that documented decisions are implemented:

```
requirement → claim → evidence → implementation → validation
```

For each claim:
1. Every L1 claim has at least one L2 construct
2. Every L2 construct has at least one L1 claim or T0 exemption
3. L3 validation exists for T2+ claims
4. T3 claims have independent refutation (Assurance profile)

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

The current CLI reverse sweep checks only constructs already declared in claims
and traces. Before invoking it, the verifier MUST enumerate consequential
behaviors in the changed files and add those constructs to the Book. Record the
enumeration method in the report.

**Machine API**: `sweep(direction: reverse) → violations[]` (declared constructs only)

### Step 3: Citation entailment

For each claim-source pair, verify the source actually supports the claim. **See `references/citation-entailment.md`** for the full 5-step procedure with classification table and examples.

Classification: `explicit` | `implicit` | `paraphrase` | `not-entailed` (failure) | `contradicts` (failure).

Tier requirements: T3/T2 → every citation verified. T1 → sample 30%. T0 → no citation required.

### Step 3a: Test-code traceability

Tests are L3 validations but are also code. **See `references/test-traceability.md`** for classification and examples. A test that validates no claim in the ledger is a reverse-sweep violation.

### Step 4: Compliance report

```yaml
id: RPT-001
change_id: CH-001
profile: lite
forward_sweep: { total_claims: 3, traced: 3, untraced: 0 }
reverse_sweep: { total_constructs: 5, documented: 5, undocumented: 0 }
citation_entailment: { total_citations: 4, entailed: 4, not_entailed: 0 }
exceptions: { blocking: 0, non_blocking: 0, pending_approval: 0 }
verdict: CONFORMANT
scope: changed-code-enumerated
enforcement:
  reverse_sweep: agent-assisted
  entailment: agent-verified
```

### Step 5: Conformance determination

| Condition | Result |
|---|---|
| All claims verified, no blocking exceptions | `CONFORMANT` |
| Forward trace complete, exceptions approved | `WAIVED` |
| Required evidence not found | `BLOCKED_EVIDENCE_GAP` |
| Same-authority sources conflict | `BLOCKED_CONTRADICTION` |
| Trace incomplete, citation not entailed, undocumented behavior | `NONCONFORMANT` |

Assurance profile additionally requires: Assurance Review passed, human approval for high-impact decisions, role separation verified.

The CLI emits `CONFORMANT_DECLARED_SCOPE` when its checks pass. Promote that
result to change-level `CONFORMANT` only after the agent-assisted changed-code
enumeration and semantic entailment review above are recorded. Never interpret
an empty scope or an unsupported capability as a pass.

## Examples

<Good>
```
Forward: 3 claims, 3 traced, 0 untraced
Reverse: 5 constructs, 5 documented, 0 undocumented
Citations: 4 checked, 4 explicit, 0 not-entailed
Verdict: CONFORMANT
```

</Good>

<Bad>
```
Forward: 3 claims, 2 traced, 1 untraced (C-055 has no construct)
Reverse: 5 constructs, 4 documented, 1 undocumented (retry logic has no claim)
Citations: 4 checked, 3 explicit, 1 not-entailed (source doesn't mention retry)
Verdict: NONCONFORMANT
→ Fix: add construct for C-055, create claim for retry logic, fix citation for retry
```
</Bad>

## Rationalization table

| Excuse | Reality |
|---|---|
| "The code works, verification is a formality" | Working code can have undocumented behavior. Reverse sweep catches what tests miss. Run it. |
| "I'll skip citation entailment, the sources are fine" | "Not-entailed" is the most common conformance failure. Sources often say something adjacent but not what the claim says. |
| "One undocumented behavior won't matter" | That's how citation laundering starts. Record an exception or trace it. |
| "NONCONFORMANT just means I need to fix a few things" | NONCONFORMANT means the change cannot merge. Fix every violation, then re-verify. The rework loop is intentional. |
| "T1 sample verification is enough for this T2 claim" | T2 requires every citation verified. Sampling is only for T1. Don't downgrade. |

## Rework loop

When verification produces `NONCONFORMANT`:
1. The compliance report identifies specific violations
2. The implementer corrects the code to address each violation
3. Updated construct-to-claim traces are produced
4. The change returns to `IMPLEMENTING`, then re-enters `VERIFYING`

This loop continues until all violations are resolved, exceptions are approved, or a blocking gap is discovered.

## Self-improvement

1. Did the reverse sweep find violations the forward sweep missed? If so, forward sweep needs strengthening — check if construct-to-claim traces were incomplete.
2. Were any citation entailment failures due to implicit claims that lacked rationale? If so, the claim extraction in `ddd-ground` needs to require rationale for implicit entailments.
3. Did the rework loop cycle more than twice? If so, the scope or grounding step was incomplete — investigate which domain was missed.

## Spec reference

- SPEC.md §8.1 (Compliance Sweep gate), §8.3 (Lifecycle state machine), §13 (Traceability and Verification), §16 (Conformance Profiles)
