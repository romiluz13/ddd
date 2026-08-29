---
name: ddd-refute
description: >
  Independent adversarial review for T3 claims in DDD. Attempts to refute high-risk claims
  by challenging citations, evidence, and reasoning. Use when T3 claims exist in a change
  (Assurance profile), when the Assurance Review gate fires, or when a high-impact decision
  needs adversarial validation.
metadata:
  author: ddd-methodology
  version: "0.2.6"
---

# ddd-refute

**Conduct independent adversarial review for T3 claims. MUST preserve genuine context and role independence.**

V2 skill — required for Assurance profile when T3 claims are present.

## When to invoke

- A T3 claim exists in the change (Assurance profile)
- Compliance Sweep has identified T3 claims requiring independent refutation
- Assurance Review gate fires (SPEC.md §8.1)
- A high-impact decision needs adversarial validation

## What it does

### Step 1: Identify T3 claims

From the claim ledger (`.ddd/claims.yaml`), select all claims with `tier: T3`.

T3 claims are those where `claim_kind` is `architectural` or `operational` and `impact` is `high` or `critical`, or any combination that derives to T3 per the risk matrix (SPEC.md §13.2).

### Step 2: Establish independence

The refutation agent MUST:
- Not have authored or proposed any of the claims under review
- Not have participated in the design tournament for this change (if applicable)
- Have access to the full evidence lock and evidence packet
- Be able to propose evidence-removing experiments (bounded spikes, benchmarks)

Role separation is mandatory. The same agent context that generated a claim cannot refute it.

### Step 3: Attempt refutation

For each T3 claim, the refutation agent:

1. **Challenge the claim statement**: Is the claim accurately extracted from the source? Is the source authoritative for this claim domain?

2. **Challenge citation entailment**: Does the cited source actually entail the claim? Check the specific section, not just the URL. A citation that does not support its claim is a conformance failure.

3. **Challenge the evidence**: Is the evidence stale, superseded, or from a non-authoritative source for this domain? Are there newer sources that contradict it?

4. **Challenge the reasoning**: If the claim is derived (not directly stated), is the derivation sound? Are there unstated assumptions?

5. **Search for counter-evidence**: Actively search for sources that contradict the claim. This is adversarial discovery, not confirmation.

6. **Propose refutation**: If counter-evidence or reasoning flaws are found, produce a refutation report.

**Machine API**: `refute(claim_id) → refutation_report`

### Step 4: Produce refutation report

```yaml
schema_version: 0.1.0
id: REF-001
claim_id: C-055
refuter_context: "independent-agent-context-id"
refuter_independence_verified: true
attempted_refutation: true
outcome: sustained  # sustained | refuted | partially_refuted
findings:
  - type: citation_gap
    description: "Claim C-055 cites EL-003#section-4 but section 4 discusses a different API method"
    severity: high
  - type: counter_evidence
    description: "Found EL-009 (newer vendor docs) stating opposite behavior for edge case X"
    severity: medium
recommendation: "Claim partially refuted. Section 4 citation should be narrowed to section 4.2. Edge case X requires an exception."
required_action: "Narrow citation, create exception for edge case X"
generated_at: 2026-08-29T15:00:00Z
```

### Step 5: Act on results

| Outcome | Action |
|---|---|
| `sustained` | Claim verified. Proceed with confidence. |
| `refuted` | Claim MUST be removed or replaced. Cannot proceed without resolution. |
| `partially_refuted` | Claim must be narrowed, citation corrected, or exception created. |

If the refutation reveals a new gap, route to `ddd-exception`.

### Step 6: Assurance Review

The Assurance Review gate (SPEC.md §8.1) requires:
- All T3 claims have refutation reports
- All refutation reports are reviewed
- Role separation is verified
- Human approval for high-impact decisions (Assurance profile)

## Independence guarantees

- The refutation agent's context MUST NOT include the original claim author's reasoning
- The refutation agent MUST have access to the same evidence lock (not less)
- If no independent agent context is available, a human reviewer MUST perform the refutation
- Independence verification is recorded in the refutation report

## Lifecycle state

- `VERIFYING → WAIVED` (if refutation reveals exceptions that are approved)
- `VERIFYING → NONCONFORMANT` (if refutation reveals unresolvable issues)
- Refutation does not change lifecycle state directly; findings feed into the compliance report

## Spec reference

- SPEC.md §6 (Assurance and Refutation), §8.1 (Assurance Review gate), §13.3 (Tier T3 requirements), §20.6 (Worked example: T3 refutation)
