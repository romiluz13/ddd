---
name: ddd-verify
description: >
  Use after implementation to run a declared external-evidence sweep or evaluate
  a Proofline assurance case before merge.
metadata:
  author: ddd-methodology
  version: "0.4.0"
---

# Verify a change

**A verdict is valid only for its reported boundary and capabilities.**

## Declared external-evidence sweep

```sh
ddd sweep --direction both
```

Verify locked-content integrity, source authority, claim traces, recorded
entailment, and required validation records. The successful result is
`CONFORMANT_DECLARED_SCOPE`.

The legacy reverse sweep covers constructs already declared in claims and
traces. It does not enumerate the repository and must not be promoted to
whole-repository conformance.

## Assurance-case evaluation

```sh
ddd evaluate-case <CASE-NNN>
```

Read the generated report and inspect:

1. `evaluated_boundary`
2. `boundary_confidence`
3. `supported_capabilities`
4. `unevaluated_capabilities`
5. `open_defeaters`
6. `approved_exceptions`
7. `violations`

Interpret verdicts exactly:

| Verdict | Action |
|---|---|
| `SATISFIED` | Accept only within the reported complete boundary. |
| `UNSATISFIED` | Correct the hard invariant or contradicted goal, then rebuild and evaluate. |
| `INDETERMINATE` | Complete the missing boundary, premise, goal, or capability. |
| `WAIVED` | Confirm the named human approval and residual-risk rationale. |

The step is complete when the verdict is acceptable to release policy and every
reported limitation remains visible.

## Mandatory checks

- Generated evidence does not support the implementation from which it derives.
- Descriptive evidence does not terminate a normative support chain.
- Required capabilities are evaluated.
- Every changed symbol is covered or explicitly excluded.
- A waiver is human-approved, scoped, and reasoned.
- No exception is described as evidence of correctness.

Adversarial refutation and broad drift remain research capabilities.
