# DDD Skills Manifest

Maps DDD skills to versions, capabilities, and SPEC.md references.

## V1 Skills (Foundation)

| Skill | Gate | Capabilities | Machine API Primitives |
|---|---|---|---|
| `ddd` | Router | Determine appropriate DDD operation, report project status | All (routing) |
| `ddd-scope` | Evidence Scope | Classify change, discover evidence, lock evidence, determine profile/risk, update Knowledge Map | `classify`, `discover`, `lock` |
| `ddd-book` | — | Initialize/sync/validate/release Book, manage Knowledge Map, passports, artifact references | — |
| `ddd-ground` | Evidence Lock → Grounding Check | Assemble evidence packets, extract claims, trace constructs, extract obligations, update passports | `packet`, `claim`, `trace`, `obligation` |
| `ddd-verify` | Compliance Sweep | Forward sweep, reverse sweep, citation entailment, compliance report, conformance determination, CI integration | `sweep` |
| `ddd-exception` | — | Classify gaps, risk-based escalation, approval workflow, conflict resolution, anti-Goodhart measures | `exception` |

## V2 Skills (Assurance)

| Skill | Gate | Capabilities | Machine API Primitives |
|---|---|---|---|
| `ddd-decide` | — | Grounded design tournament: brief, alternatives, cards, weighted criteria, jury, negative knowledge | — |
| `ddd-refute` | Assurance Review | Independent adversarial review for T3 claims, citation entailment challenge, counter-evidence search | `refute` |

## V3 Skills (Engineering Intelligence)

| Skill | Gate | Capabilities | Machine API Primitives |
|---|---|---|---|
| `ddd-controls` | — | Compile obligations to controls, adapter selection, validation protocol, enforcement levels, CI integration | `compile` |
| `ddd-drift` | — | Detect evidence, documentation, decision, control, and code drift; severity classification; routing | `drift_check` |

## Lifecycle Gates → Skills

| Gate | Trigger | Skill | Pass Condition |
|---|---|---|---|
| Evidence Scope | New change | `ddd-scope` | Technologies, decisions, risks identified; Knowledge Map updated |
| Evidence Lock | Evidence scoped | `ddd-scope` (lock step) / `ddd-ground` (packet) | Sources locked with provenance; packet assembled |
| Grounding Check | During implementation | `ddd-ground` | Every construct traces to a claim or T0 exemption |
| Compliance Sweep | Implementation complete | `ddd-verify` | Forward + reverse sweep pass; conformance determined |
| Assurance Review | T3 claims present | `ddd-refute` | All T3 claims refuted (sustained); role separation verified |

## Machine API (SPEC.md §15.3)

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

## Conformance Profiles

| Profile | V1 | V2 | V3 |
|---|---|---|---|
| Lite | Required | Optional | Optional |
| Assurance | Required | Required (T3 triggers) | Recommended |

## Spec Reference

- SPEC.md Annex A (Skill Inventory)
- SPEC.md §15.3 (Machine API)
- SPEC.md §16 (Conformance Profiles)
