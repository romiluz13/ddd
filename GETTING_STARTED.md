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

The agent follows the task through the code and identifies the questions it
needs to answer. It reads the applicable official sections for the installed
versions, saves the resulting rules and decisions, and plans with cited snippets.
It implements, returns to research when assumptions fail, then compares the actual
code against reopened sources and runs the project's checks.

You can supply links or constraints alongside the task. The agent checks their
applicability to the installed version; it does not upgrade dependencies to make
newer documentation examples work.

## Plan or review without implementation

> Use DDD for this task. Plan only: add settings-file loading. Include documented
> API choices, a useful snippet, and checks to run. Do not implement yet.

This ends with a saved plan. Snippets are labeled by origin and execution status;
implementation and final checks remain pending until actually performed.

> Use DDD to review the finished settings loader against its official docs.
> Report discrepancies without changing code.

This ends with findings and proposed corrections. An authorized implementation
or fix instead continues through corrections and verification without another
routine approval stage. To invoke one phase explicitly, use `ddd-scope`,
`ddd-ground`, or `ddd-verify`; each follows the same main skill.

## Apply DDD routinely

Add this instruction once to your project's agent instructions:

> Use DDD as the workflow for coding tasks. Load the installed `ddd` skill before
> planning or editing, including when coordinating workers. Respect plan-only and
> review-only requests. Other skills supply technical guidance within existing
> authorization. Keep one task plan and report sources actually read, the decisions
> they support, and gaps in the main chat.

Install the skill directories together through your agent's existing mechanism.
DDD requires no global agent configuration changes.

## Resume a task

The agent maintains one persistent task plan or `.ddd/notes/<task>.md` note
automatically. Its **Documentation basis** connects each important question to
a source/version, the applicable rule and decision, and a check or open question.
It saves before implementation and before ending a planning or review turn.
No Book, document registry, or manual handoff preparation is needed.

In the next session, say:

> Continue the settings-loader task.

With DDD enabled by the project instruction above, the agent finds and reads
the existing note, checks code and versions, and refreshes affected sources.
It names the note path in its response; you do not reconstruct the research.
A `.ddd/` folder alone does not activate a skill.

## Understand the result

After research, expect a brief main-chat update with source links, their effect
on the plan, and any gaps. Reused local research is identified as such; failed
fetches are not reported as successful reads. This also applies when workers do
the research. Their checked findings join the existing task plan.

The final response identifies compared APIs and docs, corrections, actual check
results, and remaining limitations. If docs are unavailable, the agent tries
other official and shipped sources, names the specific unsupported behavior,
and continues independent work. A relevant unresolved mismatch or failing check
prevents a clean completion claim.

See the [installed-host walkthrough](.ddd/notes/host-workflow-walkthrough.md) for
observed activation, persistence, and follow-through, and the earlier
[recorded suite](.ddd/notes/methodology-walkthroughs.md) for its TypeScript and
Python examples. The [Proofline CLI](cli/README.md), Book and
exception skills, and historical evidence remain optional experimental tooling.
They are unnecessary for every example above.
