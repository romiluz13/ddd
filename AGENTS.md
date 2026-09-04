<coding_guidelines>
# Proofline

Proofline is a change-assurance tool with a compatible Docs-Driven Development
(`ddd`) interface.

## Status

- Specification: `0.6.0-experimental`
- Supported product: version-matched external API and protocol evidence
- Experimental slice: TypeScript symbols plus OpenAPI and JSON Schema contracts
- CLI: `cli/`
- Compatibility storage: `.ddd/`
- Research archive: `research/`

## Repository map

```text
SPEC.md              Compact current specification
README.md            Product boundary and workflows
GETTING_STARTED.md   Executable walkthrough
SKILLS.md            Supported and research skill status
cli/                 Bun CLI and tests
skills/              Supported agent skills
research/            Superseded broad spec, skills, and detector registry
.ddd/                Dogfood evidence, claims, traces, cases, and reports
```

## Working rules

1. Read `SPEC.md` before changing schemas or verdict semantics.
2. Preserve the legacy external-evidence kernel and `.ddd/` compatibility.
3. Treat `scope-change → build-case → evaluate-case` as the normal assurance
   workflow.
4. Keep origin, epistemic role, approval, derivation, and temporal baseline
   distinct.
5. A generated artifact cannot prove the revision that generated it.
6. Descriptive evidence cannot establish a normative goal.
7. An unevaluated required capability produces `INDETERMINATE`.
8. A waiver records accepted risk; it is not correctness evidence.
9. Never describe declared-scope verification as repository-wide conformance.
10. Material under `research/` is not shipped behavior.
11. Inventory every dependency, service, platform, and frontend layer touched
    by a change; missing stack evidence is `INDETERMINATE`.
12. Open knowledge-map gaps block assurance until resolved.
13. Run `ddd doctor` when repository-local installed skills are present.

## Validation

Run:

```sh
cd cli
bun test
```

For CLI behavior, verify `bun run bin/ddd.ts --help`. For Book changes, run the
legacy sweep and report its declared-scope limitation.
</coding_guidelines>
