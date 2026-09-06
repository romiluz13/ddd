---
name: ddd-verify
description: >
  Compare finished code against version-matched official documentation, correct
  authorized discrepancies, and run affected project checks. Use for a final
  documentation comparison or review of an existing implementation.
metadata:
  author: ddd-methodology
  version: "0.7.1"
---

# Compare code with documentation

Read [DDD](../ddd/SKILL.md) and apply **Compare the finished code and correct
it**, using its discovery and resumption rules to refresh missing or stale
context. That skill owns the procedure; inspect the actual changes and reopen
sources even when the plan already has citations.

For review-only work, report discrepancies and proposed corrections without
editing code. For an authorized fix, correct them and rerun affected checks.
Finish with APIs and source sections checked, corrections or findings, actual
test results, and unresolved limitations. Relevant mismatches prevent a clean
completion claim. No assurance case or CLI verdict is required.

Consult [citation comparison](references/citation-entailment.md) or
[execution checks](references/test-traceability.md) when needed.
