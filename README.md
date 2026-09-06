# Docs-Driven Development (DDD)

**Methodology and skills: v0.7.1**

Give your coding agent an ordinary task and say: **“Use DDD for this task.”**

DDD makes the agent find and read the right documentation, produce a grounded
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

> Use DDD for coding tasks. Read the DDD skill and follow its documentation
> discovery, grounded planning, implementation, and final comparison process.
> Respect plan-only and review-only requests.

## What to expect

1. **Discovery:** task-relevant APIs and official documentation matching the
   installed versions, with applicable constraints and open questions.
2. **Grounded plan:** cited decisions and task-specific integration snippets,
   labeled as official examples, adaptations, or untested proposed code.
3. **Implementation:** code built against that plan, with further documentation
   consulted before introducing another API or changing approach.
4. **Final comparison:** the actual diff checked against reopened documentation,
   discrepancies corrected, affected checks rerun, and limitations reported.

A plan-only request stops with the plan. Implementation requests continue through
verification under your existing authorization. Missing documentation triggers
investigation; the agent asks only when access or a decision needs you.

The agent keeps a short **Documentation basis** in the task plan. For a handoff
without an existing persistent plan, it writes one note under `.ddd/notes/`.
You do not copy documentation repeatedly or run bookkeeping commands. Citations
support API decisions; native project checks show what actually ran.

See [Getting started](GETTING_STARTED.md), the [methodology contract](SPEC.md),
and the [skill guide](SKILLS.md). Recorded [fresh-context walkthroughs](.ddd/notes/methodology-walkthroughs.md)
show the checked scenarios and their limits.

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
