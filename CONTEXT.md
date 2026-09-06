# DDD context

## Product

**Docs-Driven Development (DDD)** is a cooperative coding methodology: discover
applicable official documentation, plan with cited integration snippets,
implement with continued consultation, then compare the finished code against
the docs and correct discrepancies. It works across languages using the agent's
existing tools. [SPEC.md](SPEC.md) defines the current methodology contract.

The user supplies the task and desired behavior. The agent handles documentation
research and maintains a short **Documentation basis** in one persistent task
plan, or one `.ddd/notes/<task>.md` note when no persistent plan exists. The agent
finds and updates it on continuation without a user-prepared handoff.

**Proofline** names the preserved optional experimental CLI. `ddd` and `proofline`
remain equivalent binary names; `.ddd/` remains its compatibility store. CLI
schemas and verdict semantics live in [cli/SPEC.md](cli/SPEC.md). Earlier CLI
and Book material in this repository is historical evidence with its original
scope, not proof of the current methodology.

## Methodology terms

- **Documentation basis:** task questions linked to sources and applicable
  versions, rules and implementation decisions, snippets, and actual checks or
  open questions. Persistence is automatic; unsupported assumptions stay visible.
- **Grounded plan:** implementation decisions and concrete integration snippets
  supported by applicable official documentation; proposed code remains untested
  until execution is recorded.
- **Final comparison:** inspection of actual changed code against reopened docs,
  including relevant API details, lifecycle, platform constraints, and interactions.
- **Documentation gap:** a specific behavior that accessible official or shipped
  material cannot establish after investigation. Keep dependent work visibly blocked.

## Optional CLI vocabulary

The assurance specification retains change envelopes, typed assurance cases,
epistemic roles, derivation lineage, boundary confidence, defeaters, waivers,
evidence locks, claims, stack coverage, and interaction attestations. These are
CLI concepts, not required records for ordinary DDD tasks.

A **declared-scope sweep** evaluates constructs named in legacy claims and traces;
it does not discover a repository-wide denominator. **INDETERMINATE** records
incomplete assurance. **WAIVED** records accountable accepted risk, not correctness.
Native checks and the final documentation comparison remain necessary for the
methodology regardless of an optional CLI report.

## Decisions

- Make one skill own the complete process; phase skills reuse it.
- Keep the workflow language-independent and free of mandatory CLI setup.
- Prefer the project's actual versions; never silently upgrade to fit current docs.
- Use existing authorization; a planning request stops with the plan.
- Let the agent discover sources, maintain context, and correct discrepancies.
- Preserve CLI code, evidence, reports, and research without treating their
  unresolved experimental defects as a prerequisite for the methodology.
