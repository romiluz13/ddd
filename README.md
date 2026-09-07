# Docs-Driven Development (DDD)

**Methodology and skills: v0.7.3**

Give your coding agent an ordinary task and say: **“Use DDD for this task.”**

DDD guides the agent to find and read the right documentation, produce a grounded
plan with useful code snippets, implement with those docs, and compare the
finished code against them. It uses the agent's existing tools and works across
languages. The agent maintains the research context and corrects discrepancies.

## Start

Install the four methodology skills in your project:

```sh
npx skills add romiluz13/ddd --skill ddd ddd-scope ddd-ground ddd-verify
```

Choose your coding agent when prompted. The [Skills installer](https://github.com/vercel-labs/skills#install-a-skill)
keeps the sibling directories together so shared references resolve. You can
also use your agent's existing installation mechanism or ask it to read
[skills/ddd/SKILL.md](skills/ddd/SKILL.md) directly in this checkout. No Bun,
Proofline CLI setup, Book, or evidence ledger is required.

Then give it your task:

> Use DDD for this task. Add settings-file loading with the libraries already
> installed in this project.

Documentation links are welcome but optional. The agent discovers missing
official sources and checks the actual dependency versions. For routine use,
add this one-time instruction to your project's agent instructions:

> Use DDD as the workflow for coding tasks. Load the installed `ddd` skill before
> planning or editing, including when coordinating workers. Respect plan-only and
> review-only requests. Other skills supply technical guidance within existing
> authorization. Keep one task plan and report sources actually read, the decisions
> they support, and gaps in the main chat.

## What to expect

1. **Inspect:** follow the requested behavior through the code and identify what
   must be true, including relevant language rules and technology interactions.
2. **Research:** find and read official documentation for those questions and the
   actual versions; resolve conflicts and name unanswered questions.
3. **Save and plan:** keep one persistent task note linking sources to decisions,
   with cited integration snippets and checks to run.
4. **Implement and revisit:** research new APIs and unexplained failed assumptions
   before workarounds, updating the same note.
5. **Compare:** inspect the actual code against reopened sources and requirements,
   correct discrepancies, run affected checks, and report limitations.

A plan-only request stops with the plan. Implementation requests continue through
verification under your existing authorization. Missing documentation triggers
investigation; the agent asks only when access or a decision needs you.

The agent keeps a short **Documentation basis** in the existing persistent plan
or one `.ddd/notes/<task>.md` note, even when no handoff was requested. It saves
questions, sources, applicable rules, decisions, and actual results; it finds and
updates the same note on continuation.
You do not copy documentation repeatedly or run bookkeeping commands. Citations
support API decisions; native project checks show what actually ran.

Research is visible in the main chat: a brief update names the sources read,
the decisions they support, and gaps. When workers research separately, the
coordinator checks their source evidence and brings it into the same task plan.
The final response connects those decisions to the actual code and check results.

See [Getting started](GETTING_STARTED.md), the [methodology contract](SPEC.md),
and the [skill guide](SKILLS.md). The [0.7.3 walkthrough](.ddd/notes/visible-research-0.7.3.md)
checks activation, visible research and continuation. The earlier
[installed-host walkthrough](.ddd/notes/host-workflow-walkthrough.md) retains its
actual tool actions, including failed attempts; the
[fresh-context suite](.ddd/notes/methodology-walkthroughs.md) retains its original scope.
A `.ddd/` directory alone does not activate DDD: the agent must load the installed
skill. Following these instructions depends on the host and model; a completed
note alone does not establish that research or verification happened.

## Optional experimental CLI

The existing **Proofline** CLI remains available through both `ddd` and
`proofline` binary names. Its evidence locks, Books, traces, and assurance cases
are optional experiments, separate from the default skill workflow. See the
[CLI guide](cli/README.md) and preserved [assurance specification](cli/SPEC.md).

The legacy sweep covers declared constructs only. Its result is not
repository-wide conformance, and a CLI report does not replace the final
code-to-docs comparison. Known experimental-tooling defects remain documented
in the CLI guide. Existing `.ddd/` evidence and historical reports retain their
original scope; they do not prove this methodology revision.

For repository maintenance, run the existing CLI tests with `cd cli && bun test`.
The broader proposals under [research/](research/) are preserved historical
material, not shipped behavior.

## License

MIT
