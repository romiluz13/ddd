# ADR-001: Dogfood DDD to improve DDD

## Status

Accepted

## Date

2026-08-30

## Context

DDD is a methodology where documentation is the source of truth and code must be provable against docs. The DDD project itself consists of a normative specification (SPEC.md) and 12 Agent Skills that implement it. To improve DDD, we should use DDD on itself — treating the SKILL.md files as "code" that must be traced to claims in SPEC.md.

This is meta-recursion: DDD governs its own improvement. The skills are installed to `.factory/skills/` and are available for Droid to invoke.

## Decision

We will apply DDD to the DDD project:

1. **Initialize the Book** (`.ddd/book.yaml`) with real project metadata, artifact references, and digests
2. **Generate a Knowledge Map** with domains relevant to the project (agent-skills-spec, skills-packaging, ddd-methodology, yaml-schema-design, technical-writing)
3. **Scope improvement changes** using `ddd-scope`: classify what needs improving, discover evidence, lock it
4. **Ground claims**: extract claims from SPEC.md, trace them to SKILL.md constructs
5. **Implement improvements**: modify SKILL.md files based on evidence
6. **Verify**: run forward and reverse sweep to check spec-skill alignment

The project uses the **Assurance** profile because changes to the methodology are architecturally consequential (T3).

## Consequences

- All changes to SKILL.md files must trace to claims in SPEC.md
- The agentskills.io specification becomes external evidence that must be locked
- Gaps between spec and skills become exceptions that must be resolved
- The Knowledge Map tracks what domains are relevant to DDD's own improvement
- This ADR is the first entry in `.ddd/decisions/`
