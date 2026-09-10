<coding_guidelines>
# Docs-Driven Development (DDD)

DDD is a documentation-driven coding methodology. Proofline is its preserved,
optional experimental assurance CLI.

## Repository map

```text
SPEC.md              Current methodology contract (0.7.5)
skills/ddd/SKILL.md  Complete agent procedure; phase skills point here
README.md            Usage and product boundary
GETTING_STARTED.md   Ordinary-task walkthrough
SKILLS.md            Default, optional, and research skill status
cli/                 Preserved Bun CLI and tests
cli/SPEC.md          Assurance schemas and verdict contract (0.6.0-experimental)
.ddd/                Optional compatibility evidence and historical reports
.ddd/notes/          Task context and recorded methodology walkthroughs
research/            Superseded proposals, skills, and detector registry
```

## Working rules

1. Use DDD for coding tasks. Follow `skills/ddd/SKILL.md`; respect plan-only and
   review-only requests. Save research in the existing persistent task plan or
   one `.ddd/notes/<task>.md` note; find and update it on continuation.
   DDD owns the workflow; other skills supply technical guidance within the user's
   existing authorization, without extra routine approval stages.
   Report sources, decisions and gaps in the main chat, including delegated work.
2. Read root `SPEC.md` for methodology changes and `cli/SPEC.md` before changing
   CLI schemas or verdict semantics. Preserve CLI behavior and `.ddd/` compatibility
   when editing the methodology.
3. Keep Book, locked evidence, trace ledgers, and assurance cases outside the
   default route. Existing CLI workflows are optional experiments.
4. Preserve historical evidence and reports. Generated artifacts cannot prove
   their generating revision; descriptive evidence cannot establish a normative goal.
5. Keep origin, epistemic role, approval, derivation, and temporal baseline
   distinct in optional assurance work. A waiver records risk, not correctness.
6. Never describe declared-scope verification as repository-wide conformance.
   Unevaluated required CLI capabilities and open gaps remain INDETERMINATE;
   an unexpired capability waiver yields WAIVED, an open obligation does not.
7. Material under `research/` is not shipped behavior.
8. When changing installed skills, refresh repository-local copies and hashes,
   then run `bun run cli/bin/ddd.ts doctor`. Leave global configurations alone.

## Validation

From the repository root, run `(cd cli && bun test)` and
`bun run cli/bin/ddd.ts --help`. When Book document references change, refresh
their digests and run `bun run cli/bin/ddd.ts sweep --direction both`; report its declared-scope
limitation. Evaluate historical `CASE-002` in a disposable copy of `.ddd/` and
confirm its expected INDETERMINATE partial boundary without rewriting history.
Use recorded fresh-context walkthroughs for methodology changes.
</coding_guidelines>
