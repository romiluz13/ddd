# Get started with DDD

Install the methodology skills once in your project, then choose your coding
agent when prompted:

```sh
npx skills add romiluz13/ddd --skill ddd ddd-scope ddd-ground ddd-verify
```

This uses the [Skills installer](https://github.com/vercel-labs/skills#install-a-skill).
Alternatively, make [skills/ddd/SKILL.md](skills/ddd/SKILL.md) and its sibling
directories available through your agent's installation mechanism, or read that
file directly in this checkout. The agent uses its usual file, search, browsing,
and execution tools; DDD requires no Proofline CLI or Bun runtime.

## Give it a task

> Use DDD for this task. Implement `load_settings(path)` to load a TOML settings
> file into a dictionary using this project's Python version. Let parse and file
> errors reach the caller.

The agent inspects the code and installed runtime, finds the applicable official
documentation, and reads the relevant sections itself. It plans with cited
API choices and a concrete snippet, implements the task, then reopens the docs
to compare the finished code and runs the project's checks.

You can supply links or constraints alongside the task. The agent checks their
applicability to the installed version; it does not upgrade dependencies to make
newer documentation examples work.

## Plan or review without implementation

> Use DDD for this task. Plan only: add settings-file loading. Include documented
> API choices, a useful snippet, and checks to run. Do not implement yet.

This ends with a plan. Snippets are labeled by origin and execution status, and
checks remain pending until actually run.

> Use DDD to review the finished settings loader against its official docs.
> Report discrepancies without changing code.

This ends with findings and proposed corrections. An authorized implementation
or fix instead continues through corrections and verification without another
routine approval stage. To invoke one phase explicitly, use `ddd-scope`,
`ddd-ground`, or `ddd-verify`; each follows the same main skill.

## Apply DDD routinely

Add this instruction once to your project's agent instructions:

> Use DDD for coding tasks. Read the DDD skill and follow its documentation
> discovery, grounded planning, implementation, and final comparison process.
> Respect plan-only and review-only requests.

Install the skill directories together through your agent's existing mechanism.
DDD requires no global agent configuration changes.

## Resume a task

The agent maintains a short **Documentation basis** in the existing plan:
versions, source sections, needed rules/snippets, questions, and actual comparison
and check results. If a handoff needs a file and there is no persistent plan,
it creates one note in `.ddd/notes/`. That note needs no Book or other setup.

Point the next session at the existing plan or note and say:

> Resume this task using DDD and the existing Documentation basis.

The agent checks whether code or versions changed and refreshes affected sources.
You do not need to repeat the documentation research.

## Understand the result

The final response identifies compared APIs and docs, corrections, actual check
results, and remaining limitations. If docs are unavailable, the agent tries
other official and shipped sources, names the specific unsupported behavior,
and continues independent work. A relevant unresolved mismatch or failing check
prevents a clean completion claim.

See the [recorded walkthroughs](.ddd/notes/methodology-walkthroughs.md) for
TypeScript and Python examples. The [Proofline CLI](cli/README.md), Book and
exception skills, and historical evidence remain optional experimental tooling.
They are unnecessary for every example above.
