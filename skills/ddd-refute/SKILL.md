---
name: ddd-refute
description: >
  Use when T3 claims exist in a change (Assurance profile), when the Assurance Review gate
  fires, or when a high-impact decision needs adversarial validation.
metadata:
  author: ddd-methodology
  version: "0.3.0"
---

# ddd-refute

**THE CLAIM AUTHOR CANNOT REFUTE THEIR OWN CLAIM. INDEPENDENCE IS MANDATORY.**

Core principle: Adversarial review finds what self-review cannot. Independence is not a courtesy — it is the mechanism that makes refutation meaningful.

Violating the letter of the rules is violating the spirit of the rules.

## When to invoke

- A T3 claim exists in the change (Assurance profile)
- Compliance Sweep has identified T3 claims requiring independent refutation
- Assurance Review gate fires (SPEC.md §8.1)
- A high-impact decision needs adversarial validation

### When NOT to use

- No T3 claims exist in the change — T0/T1/T2 claims do not require refutation
- The project is Lite profile — only Assurance profile requires refutation
- You authored the claims under review — independence is mandatory, use a different agent context

## What it does

### Step 1: Identify T3 claims

From `.ddd/claims.yaml`, select all claims with `tier: T3`.

T3 is reached by (§13.2):
- Any `claim_kind` with `critical` impact
- `operational` with `high` impact

Impact establishes the minimum tier; kind may increase it. Ambiguous classification escalates to the higher tier.

### Step 2: Establish independence

The refutation agent MUST:
- Not have authored or proposed any claims under review
- Not have participated in the design tournament for this change
- Have access to the full evidence lock and evidence packet
- Be able to propose evidence-removing experiments

Role separation is mandatory. If no independent agent context is available, a human reviewer MUST perform the refutation.

### Step 3: Attempt refutation

For each T3 claim:

1. **Challenge the claim statement**: Is it accurately extracted? Is the source authoritative for this domain?
2. **Challenge citation entailment**: Does the cited source actually entail the claim? — **see `ddd-verify/references/citation-entailment.md`** for the full procedure. Read the source text directly, do NOT rely on the claim author's summary.
3. **Challenge the evidence**: Is it stale, superseded, or non-authoritative? Are there newer contradicting sources?
4. **Challenge the reasoning**: If the claim is derived, is the derivation sound? Unstated assumptions?
5. **Search for counter-evidence**: Actively search for sources that contradict the claim. This is adversarial discovery, not confirmation.
6. **Propose refutation**: If counter-evidence or reasoning flaws found, produce a refutation report.

**Machine API**: `refute(claim_id) → refutation_report`

### Step 4: Produce refutation report

```yaml
id: REF-001
claim_id: C-055
refuter_context: "independent-agent-context-id"
refuter_independence_verified: true
outcome: sustained  # sustained | refuted | partially_refuted
findings:
  - type: citation_gap
    description: "Claim C-055 cites EL-003#section-4 but section 4 discusses a different API method"
    severity: high
recommendation: "Narrow citation, create exception for edge case X"
```

### Step 5: Act on results

| Outcome | Action |
|---|---|
| `sustained` | Claim verified. Proceed with confidence. |
| `refuted` | Claim MUST be removed or replaced. Cannot proceed. |
| `partially_refuted` | Claim must be narrowed, citation corrected, or exception created. |

If refutation reveals a new gap, route to `ddd-exception`.

## Examples

<Good>
```
Claim C-055: "bcrypt is available in Edge Runtime"
Refuter: reads EL-003 (Next.js docs), finds "Edge Runtime supports a subset of Node.js APIs"
Then reads EL-005 (bcrypt docs), finds "bcrypt requires Node.js native modules"
Outcome: partially_refuted — bcrypt is NOT available in Edge Runtime
Action: Remove claim, fix code
```

</Good>

<Bad>
```
Claim C-055: "bcrypt is available in Edge Runtime"
Refuter: same agent context that wrote the claim
"Looks correct to me"
Outcome: sustained
→ Independence violation. Refutation is invalid.
```
</Bad>

## Rationalization table

| Excuse | Reality |
|---|---|
| "I can refute my own claim, I know it's correct" | The point of refutation is to find what you missed. Self-refutation is a rubber stamp. Use an independent context. |
| "The claim looks fine, I'll mark it sustained without checking the source" | Citation entailment is the most common failure. Read the actual source text. Summaries lie. |
| "I couldn't find counter-evidence, so the claim is sustained" | Absence of counter-evidence is not proof. Document what you searched. If the search was thorough, sustained is valid. |
| "This T3 claim is low-risk, I'll skip refutation" | T3 means critical impact or operational+high. Skipping refutation violates Assurance profile. |
| "I'll just downgrade it to T2 to avoid refutation" | Tier is derived from the risk matrix, not chosen. Downgrading to avoid refutation is Goodhart. |

## Self-improvement

1. Did any `sustained` claims later prove false? If so, the refutation search was too shallow — broaden counter-evidence search.
2. Did refutation find issues that forward sweep missed? If so, forward sweep's citation check needs strengthening.
3. Was independence verification ever bypassed? If so, the Assurance Review gate is compromised — enforce role separation.

## Spec reference

- SPEC.md §6.2 (Prohibited role combinations), §8.1 (Assurance Review gate), §13.2 (Proof tiers), §13.4 (Citation entailment)
