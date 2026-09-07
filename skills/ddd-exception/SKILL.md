---
name: ddd-exception
description: >
  Use only when explicitly asked to manage a waiver, goal, or open obligation
  in the optional experimental Proofline CLI. Missing documentation in an
  ordinary coding task is handled by DDD discovery.
metadata:
  author: ddd-methodology
  version: "0.7.3"
---

# Record a gap or waiver

This is optional experimental tooling, outside the default DDD route. Follow
[DDD](../ddd/SKILL.md) for ordinary documentation gaps. Read `cli/README.md`
and `cli/SPEC.md` in the tooling checkout before using these commands; the
documented waiver and validation defects remain unresolved. The root
specification describes the methodology. Do not infer human risk acceptance
from authorization to implement a coding task.

**A gap stays visible. A waiver accepts risk; it does not create evidence.**

## Classify the condition

- `unknown`: no applicable evidence was found.
- `unsupported`: available evidence does not support the goal.
- `conflicting`: applicable sources disagree.
- `experimental`: only observation or runtime evidence exists.
- `waiver`: an accountable human accepts named residual risk.

## Record a waiver

A waiver is time-boxed. Its target is either a goal claim or a required
capability that no tool evaluates. Record it with the `exception` command:

```sh
# Goal waiver
bun run cli/bin/ddd.ts exception --goal <C-NNN> \
  --rationale "<the accepted residual risk>" \
  --owner <accountable human> \
  --expires <future ISO date, e.g. 2027-03-31>

# Capability waiver (consumer_impact | contract_compatibility)
bun run cli/bin/ddd.ts exception --capability consumer_impact \
  --rationale "<the accepted residual risk>" \
  --owner <accountable human> \
  --expires <future ISO date, e.g. 2027-09-30>
```

The command requires a rationale, an accountable owner, and a future expiry
date, and writes an approved exception entry to `.ddd/exceptions.yaml`. A
goal waiver requires the claim to already exist (`ddd claim ...`); waivers
scope to one goal and must not be reused as support for another goal. A
capability waiver is idempotent per capability. The existing implementation can
return an expired record on a renewal request; inspect the persisted record and
report that tooling defect instead of claiming renewal succeeded. An obligation
can track the unresolved capability while the case remains INDETERMINATE.

The intended assurance contract requires human approval, rationale, scope, and
a valid time box. Inspect those fields yourself: known builder/evaluator defects
mean a CLI verdict alone does not establish them. A waiver cannot justify a hard
graph, lineage, or contradiction failure. `WAIVED` records accepted risk, never
correctness; an expired waiver means that acceptance has lapsed.

## Track an unresolved defeater

When a gap stays open but work is planned, bind it to a tracking issue:

```sh
bun run cli/bin/ddd.ts obligation --defeater <id> \
  --issue <https://github.com/org/repo/issues/NNN> \
  [--description "<what evidence will resolve it>"] [--due YYYY-MM-DD]
```

An obligation records that evidence is coming; it does not resolve the
defeater, and the case stays `INDETERMINATE` until the evidence lands. A
required capability can be tracked this way with the `capability:<name>`
defeater convention (e.g. `capability:consumer_impact`); the evaluation
report names this path whenever an unevaluated required capability blocks a
case.

## Declare a case goal

If the change matched no claims but a claim must still be assured, declare it
as a case goal so every built case keeps it reachable:

```sh
bun run cli/bin/ddd.ts goal --claim <C-NNN>
```

## Verify

```sh
bun run cli/bin/ddd.ts build-case <ENV-NNN>
bun run cli/bin/ddd.ts evaluate-case <CASE-NNN>
```

The step is complete when the report names the approved exception and no
unwaived gap is hidden.
