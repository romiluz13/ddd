# DDD skills

Use **DDD** for an ordinary coding task. [The main skill](skills/ddd/SKILL.md)
owns discovery, grounded planning, implementation-time documentation consultation,
and final comparison. All methodology skills work with the agent's existing
tools and the project's language; none requires the optional CLI.

## Default workflow and individual phases

| Skill | Use | Completion boundary |
|---|---|---|
| `ddd` | Complete documentation-driven task | Plan-only stops at a cited plan; implementation continues through corrected code and actual checks. |
| `ddd-scope` | Documentation discovery only | Touched APIs, resolved versions, official sections, constraints, and specific gaps. |
| `ddd-ground` | Ground a plan or continue an authorized implementation | Cited decisions and useful labeled snippets; authorized builds continue through DDD verification. |
| `ddd-verify` | Compare finished code to docs | Actual changes compared to reopened sources, findings or authorized fixes, check results and limitations. |

Install the skill directories together so phase skills and supporting references
can resolve the main procedure. The agent maintains the Documentation basis in
the existing persistent plan or one `.ddd/notes/<task>.md` file on every task.
The note connects questions, sources, rules, decisions, and checks; the agent
finds it on resumption and updates it when assumptions fail.

## Optional experimental tooling skills

| Skill | Explicit request |
|---|---|
| `ddd-book` | Initialize or maintain the Proofline CLI's compatibility Book and artifacts. |
| `ddd-exception` | Record an accountable waiver or open obligation in that optional CLI. |

These are outside the default route. Missing documentation triggers DDD's
investigation and gap reporting, not automatic Book or exception setup.
CLI commands and limitations are documented in [cli/README.md](cli/README.md),
with schemas and verdict semantics in [cli/SPEC.md](cli/SPEC.md). The CLI retains
its existing behavior; its declared-scope reports are not repository-wide proof.
Repository maintainers run `ddd doctor` through the local CLI to check installed
copies and lock hashes. Users of the methodology do not need this command.

## Research

`ddd-model`, `ddd-audit`, `ddd-decide`, `ddd-refute`, `ddd-controls`, and `ddd-drift`
remain archived under `research/skills/`, not distributed as shipped methodology.
The CLI's `discover`, `refute`, and `compile` commands remain unimplemented stubs.
The implemented `drift-check` checks evidence freshness only.

See [SPEC.md](SPEC.md) for the methodology contract and
[research/SPEC-0.3.md](research/SPEC-0.3.md) for superseded research.
