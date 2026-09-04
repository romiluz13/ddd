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

## Record a waiver

A waiver is time-boxed. Record it with the `exception` command:

```sh
bun run cli/bin/ddd.ts exception --goal <C-NNN> \
  --rationale "<the accepted residual risk>" \
  --owner <accountable human> \
  --expires <future ISO date, e.g. 2027-03-31>
```

The command requires a rationale, an accountable owner, and a future expiry
date, and writes an approved exception entry to `.ddd/exceptions.yaml`. The
goal claim must already exist (`ddd claim ...`). Waivers scope to one goal and
must not be reused as support for another goal.

The evaluator rejects missing approval, non-human provenance, absent
rationale, a missing time box, or an expired waiver. Hard graph, lineage, or
contradiction failures remain `UNSATISFIED`; a waiver cannot override them.
Renew or drop an expired waiver; the accepted risk has lapsed.

## Track an unresolved defeater

When a gap stays open but work is planned, bind it to a tracking issue:

```sh
bun run cli/bin/ddd.ts obligation --defeater <id> \
  --issue <https://github.com/org/repo/issues/NNN> \
  [--description "<what evidence will resolve it>"] [--due YYYY-MM-DD]
```

An obligation records that evidence is coming; it does not resolve the
defeater, and the case stays `INDETERMINATE` until the evidence lands.

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
