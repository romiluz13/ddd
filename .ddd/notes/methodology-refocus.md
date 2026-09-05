# DDD methodology refocus

## Authorized plan

Implement the supplied skills-first design: discover official documentation,
plan with cited snippets, implement with renewed consultation, and compare the
actual code with the documentation. Keep the CLI optional and preserve its code,
evidence, historical reports, and research. No new CLI commands or schema changes.

1. Rewrite the main skill and make scope/ground/verify phase shortcuts.
2. Align public docs and supporting guidance; move assurance SPEC to cli/SPEC.md.
3. Run fresh-context walkthroughs covering discovery, old versions, plan-only,
   direction changes, mismatches, unavailable docs, handoff, TypeScript/Python.
4. Refresh local installed copies and hashes; run CLI tests, help, doctor, sweep,
   and the historical partial-assurance fixture. Review actual changes.

## Documentation basis

- Agent Skills format: current unversioned specification, accessed 2026-09-05,
  https://agentskills.io/specification#frontmatter and #file-references.
  Preserve name/description YAML frontmatter, string metadata versions, and
  relative references. No new host APIs or package dependencies are introduced.
- Existing CLI: proofline-cli 0.6.0, Bun 1.3.13. cli/SPEC.md preserves the
  0.6.0-experimental assurance contract. Root methodology and skills use 0.7.0;
  this is not a CLI schema version bump.
- Local implementation authority for maintenance: cli/src/doctor.ts folder
  hashing and cli/src/sweep.ts validateBookManifest canonical digest ordering.
- Approved product behavior: the user's supplied plan. Source format governs
  packaging; it does not establish application requirements.
- Open questions: none. Preexisting untracked assessment and reports are retained.
- Final comparison: reopened the official Agent Skills frontmatter and file-reference
  sections; inspected the main skill, phase wrappers, references, and public docs
  against the approved process. Two read-only reviewers found no actionable
  content or preservation findings. Actual check results follow.

## Implementation and verification

The main skill owns the full process. Scope, ground, and verify are phase entry
points; Book and exception are optional. Root docs, references, and the catalog
agree. cli/SPEC.md preserves the prior assurance specification except an
optional-tooling preface and a relocated research link. CLI code, tests, schemas,
commands, historical evidence/reports, and research were not changed. Known CLI
defects remain documented in the optional guide. Preexisting untracked assessment
and report files were preserved.

All six repository-local .factory skill copies and lock hashes were refreshed.
Book references and hashes now cover both specifications. The Book indexes the
documents; it does not prove this revision. No global configuration changed.

### Actual commands and results

```text
$ (cd cli && bun test)
exit=0
--- first 5 lines (timings omitted) ---
bun test v1.3.13 (bf2e2cec)

tests/assurance.test.ts:
(pass) assurance policy evaluator > rejects a cycle in the support and derivation graph
(pass) assurance policy evaluator > rejects duplicate graph identities
--- last 5 lines ---

 93 pass
 0 fail
 352 expect() calls
Ran 93 tests across 4 files. [4.24s]
```

- `bun run cli/bin/ddd.ts --help`: exit 0; existing commands and explicit stubs
  displayed. CLI implementation was not changed afterwards.
- `bun run cli/bin/ddd.ts doctor`: final exit 0, pass true; six installed
  directories and six lock entries current after the last skill edits.
- `bun run cli/bin/ddd.ts sweep --direction both --ddd-dir /tmp/ddd-walkthroughs.SIARed/legacy/.ddd`:
  final exit 0; CONFORMANT_DECLARED_SCOPE, three claims, three traces, no
  violations. The disposable root copied the updated Book and referenced docs.
  This covers declared constructs only, not repository-wide conformance.
- `bun run cli/bin/ddd.ts evaluate-case CASE-002 --ddd-dir /tmp/ddd-walkthroughs.SIARed/legacy/.ddd`:
  expected exit 1; INDETERMINATE, partial boundary, consumer_impact unevaluated.
  Only the disposable report was written; historical reports stayed intact.
- Format/link inspection: six valid skill frontmatters and 50 resolving relative
  Markdown links across 28 active documents/records before this final note update.
- `git diff --check`: exit 0. Direct comparison with HEAD confirmed spec
  preservation; git diff confirmed no CLI code/test or historical data changes.
- [Fresh-context walkthroughs](methodology-walkthroughs.md): all eight scenarios
  covered by six agent runs over five projects. Parent reruns passed four
  TypeScript tests and Python suites of two, two, and four tests.

The initial replacement patch was rejected before edits; subsequent file writes
succeeded. One walkthrough-index write used the fixture cwd and failed before
creating a file; it was corrected in the repository. A final note update had a
JavaScript syntax error before writing and was reapplied with apply_patch. Three
agent runs hit a service usage limit, then succeeded after the user said to
continue. Failed attempts were not counted as verification evidence.

## Remaining boundaries

This release changes methodology and skills, not experimental CLI behavior.
Known CLI defects are intentionally unresolved. Walkthroughs are small synthetic
local tasks, not production proof, exhaustive language coverage, or a measure of
activation reliability in every agent host. TypeScript had no static typecheck.
The unavailable private-service fixture correctly reports a missing contract;
that fictional client remains unimplemented. No product question or implementation
mismatch remains within this refocus.

## Public release preparation

The user requested a version bump and GitHub delivery. Methodology, skills, and
the README identify v0.7.0; the unchanged experimental CLI package and assurance
contract retain 0.6.0. The public repository is romiluz13/ddd.

Validated the install command against the official
[Skills CLI documentation](https://github.com/vercel-labs/skills#install-a-skill)
and installed Skills CLI 1.5.23 help. A disposable project-scoped Codex install
of the four methodology skills succeeded with `--copy --yes`; all eight files
matched source and all 11 sibling references resolved. README and Getting
Started now provide the public repository install command.

The latest pre-release GitHub run failed only because of stale Book artifact
hashes. Refreshed hashes pass the same sweep. Release preparation reran 93 CLI
tests (0 failures, 352 assertions), inspected public links, and confirmed the
historical reports and unrelated untracked scratch files remain outside the
release changes. GitHub push and CI results are checked after committing.
