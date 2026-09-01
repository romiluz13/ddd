---
name: ddd-exception
description: >
  Use when authoritative evidence is missing or conflicting, a changed
  construct cannot be covered, or an accountable human must accept residual
  risk.
metadata:
  author: ddd-methodology
  version: "0.5.0"
---

# Record a gap or waiver

**A gap stays visible. A waiver accepts risk; it does not create evidence.**

## Classify the condition

- `unknown`: no applicable evidence was found.
- `unsupported`: available evidence does not support the goal.
- `conflicting`: applicable sources disagree.
- `experimental`: only observation or runtime evidence exists.
- `waiver`: an accountable human accepts named residual risk.

## Record a waiver in an assurance case

Create an `exception` node with:

- `epistemic_role: waiver`;
- `approval_state: approved`;
- `status: approved`;
- `provenance.origin: human`;
- accountable actor identity;
- a concrete rationale.

Connect it to the affected goal with a `waives` edge. Scope the waiver to that
goal. Do not reuse it as support for another goal.

The evaluator rejects missing approval, non-human provenance, absent rationale,
or an unknown target. Hard graph, lineage, or contradiction failures remain
`UNSATISFIED`; a waiver cannot override them.

## Command status

The `exception` machine command is not implemented. Edit and review the case
artifact explicitly, then run:

```sh
ddd evaluate-case <CASE-NNN>
```

The step is complete when the report names the approved exception and no
unwaived gap is hidden.
