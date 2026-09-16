# DDD 0.8.0 application knowledge

Status: implementation and candidate validation complete. Publication is tracked
by the v0.8.0 release and its exact-commit GitHub CI run.
Baseline: `5b7cdae` (methodology 0.7.7). Proofline code, schemas, and historical
reports remain unchanged. User authorized implementation and gated publication.

## Outcome and plan

Extend the existing research → plan → implement → compare workflow with a small,
discoverable application map and current explanations maintained across tasks.
Reuse existing documents. Preserve authority distinctions, write restrictions,
and partial verification. No new runtime, commands, or evidence schema.

1. Update contract, authoritative skill, phase entry points, terminology, and
   onboarding; add two compact worked examples. Acceptance: each requested
   lifecycle and proportionality rule has a discoverable instruction.
2. Compare baseline and candidate in disposable Codex sessions across
   lifecycle, authorization, missing authority/probes, diagnosis/honesty, and
   proportionality. Inspect instructions actually loaded, tool results, files,
   diffs, and exits. Independently review; at most three correction rounds.
3. Check fresh Codex installation and cross-task knowledge discovery. Keep raw
   transcripts and machine-specific artifacts outside this public repository;
   publish only sanitized observations. Produce the paired results viewer.
4. Run CLI tests/help, refresh repository-local installations and hashes, doctor,
   Book digests and declared-scope sweep. Evaluate CASE-002 in a disposable copy.
   Check metadata, references, version consistency, and release installation.
5. Only after required checks pass: audit all outgoing commits, commit explicit
   intended paths, push to romiluz13/ddd, verify exact-commit CI, tag/release
   v0.8.0, and verify remote metadata and four-skill installation.

## Documentation basis

| Question | Source and applicable section | Decision | Check/status |
|---|---|---|---|
| Intended behavior | User-approved DDD 0.8.0 implementation plan | Incremental map, current explanations, conditional snippets/probes, partial comparisons, no CLI changes | Independent static review: no required corrections |
| Existing workflow | SPEC.md and skills/ddd/SKILL.md at baseline | Extend the five steps; one authoritative procedure | Read before editing |
| Skill packaging | https://agentskills.io/specification, frontmatter / progressive disclosure / references, read 2026-09-17 | Preserve names and interfaces; link detailed examples on demand | All six skills validate; local references resolve |
| Development evaluation | https://github.com/anthropics/skills/blob/34040c9c568585f6929bedeaad110ad08f079624/skills/skill-creator/SKILL.md | Freeze upstream revision; paired baseline/candidate execution and existing review viewer, no runtime dependency | Six paired scenarios complete; actual instruction paths and results inspected |
| Compatibility boundary | .ddd/book.yaml, .github/workflows/ddd.yml, cli/SPEC.md reference | Refresh live digests; do not rewrite historical verdicts | 93 tests pass; help, doctor, declared-scope sweep pass; CASE-002 preserved |

No integration snippet is necessary for this prose-only methodology change.

## Results and remaining work

Implementation and independent requirements/source review are complete, with no
unresolved implementation findings. All named candidate behaviors passed the
bounded suite below. Publication requires the outgoing-commit audit and
exact-commit CI; this record does not replace those gates.

The authorized evaluation scope uses Codex; the user removed the Claude
comparison requirement. No claim about Claude performance is made. Candidate metadata is now 0.8.0 for installation validation;
release remains gated on final checks.

### Repository checks

- `(cd cli && bun test)`: exit 0; 93 pass, 0 fail, 352 assertions (Bun 1.3.13).
- CLI help, `doctor`, `sweep --direction both`, and `git diff --check`: exit 0.
  Doctor found six matching local copies and six matching lock hashes, within
  its configured `.factory/skills` boundary only. Sweep checked three claims and
  three traces; it does not establish repository-wide conformance.
- Disposable CASE-002 evaluation: expected exit 1, INDETERMINATE, partial boundary;
  consumer impact remains unevaluated. Historical report bytes are unchanged.
- Anthropic's pinned `quick_validate.py`: all six skills valid. The local Codex
  validator rejected the pre-existing `compatibility` field; its allowlist lacks
  that official Agent Skills field. The current upstream validator supports it.
  No skill field was removed to satisfy the outdated validator.
- All local Markdown links in public onboarding and skills resolve. Methodology
  metadata is 0.8.0; CLI package stays 0.6.0 and contract 0.6.0-experimental.
- Final source comparison read the changed procedure and examples, Agent Skills
  packaging rules, Python's `dict.get` contract and URLSearchParams methods.
  Examples remain illustrative, not claimed executions.

### Behavioral evaluation

Baseline is the four public skills from `5b7cdae` (0.7.7); candidate is 0.8.0.
Controlled runs use Codex CLI 0.154.0, gpt-6-astra with medium reasoning,
Python 3.13.13 and SQLite 3.50.4. Each variant has its own disposable workspace
and fresh sessions. Actual session catalogs and tool paths establish which
project skill was loaded; unrelated shared skills are disabled, with the same
five bundled system skills remaining in both variants. Installed files match
frozen snapshots. This controlled setup is distinct from ordinary host discovery.

Three paired scenarios have completed with frozen local official Python sources
and no external documentation fetches, as checked in their actual tool records:

| Scenario | Candidate evidence | Baseline observation |
|---|---|---|
| Missing authority and experiment | Private exactly-once protocol stays blocked; independent escaping test passes (3 tests); normal/error SQLite context exits and explicit close probed; observation limits distinguished from contract | Same correctness and evidence boundaries |
| Diagnosis and evidence honesty | Original failure retained; raw input/render probes distinguish causes; unsupported mutation guarantee and historical pass claim rejected; repaired regression passes (3 test methods, multiple cases) | Same correctness and evidence boundaries |
| Proportionality | Small empty-state branch, characterization passes before implementation edit, 4 final tests; one paragraph updates existing explanation; no dependency or abstraction | Same working code/checks; current explanation omits the new empty state, which remains only in task history |

The coordinator inspected diffs, actual command results, explanations, and
independent test reruns. These three candidates meet 12 scenario assertions;
the baseline meets 11, with the difference confined to current knowledge
maintenance. Counts are not a reliability estimate or proof of causal superiority.
Lifecycle, planning/authorization, and supplemental integration also completed
as described below.

Early lifecycle/planning runs fetched live sources. Their retained exploratory
results are excluded from the frozen-source comparison; both variants were rerun
symmetrically with captured sources established before the first session. The
read-only harness compares complete file manifests, including deletions.

Supplemental SQLite → HTTP/JSON pair: both variants passed four native tests and
three independently executed acceptance tests using real loopback requests,
server restart and a reopened database. Checks covered committed persistence,
Unicode and SQL-like punctuation, private-field exclusion, and fourteen invalid
payload variants. Candidate met six assertions; baseline met five, omitting
source/evidence links from current guidance. Both used identical frozen sources.
One procedural limitation remains recorded: candidate read full resulting files
and diff statistics, but omitted the actual diff read. Independent review read
that diff and found no code/source/explanation mismatch. This does not
retroactively establish perfect instruction adherence by the candidate agent.

Frozen Python documentation is from the 3.13 minor line and labels patch 3.13.15;
the runtime is 3.13.13. Installed-source inspection and runtime checks support
the exercised contracts. These are not exact-patch documentation comparisons.

Controlled lifecycle: four fresh sessions per variant adopted the existing map,
built cancellation filtering, reused the explanation for a distinct count task,
changed the visibility requirement, then retired cancellation. Candidate passed
six assertions and independent stage suites of 5, 6, 6 and 6 tests. Baseline also
passed six assertions, with 6, 7, 7 and 8 tests. Fresh agents discovered explanations
without supplied knowledge paths. The candidate retained original history and
prior task bodies, labeling superseded guidance explicitly.

Controlled planning/authorization: three fresh sessions per variant kept the
initial design proposed, found the prior plan after an intervening accepted ID
normalization requirement, implemented that requirement, and reviewed without
editing. Both passed five assertions and independent 12-test reruns. Complete
before/after file manifests were identical for read-only reviews. Both reviews
reported an omitted inherited CSV field-size limit inline rather than changing
documentation; requested normalization, duplicates and Unicode behavior passed.
Python 3.11 execution remains unverified, and is not claimed by those fixtures.

Combined: **29/29 candidate assertions, 27/29 baseline assertions**, across six
scenario pairs (22 fresh parent sessions, plus available independent reviews).
Differences are current-explanation maintenance in the small change and source/
evidence links in the integration, not product correctness. Correctness, discovery,
freshness, evidence honesty, authorization and effort were assessed separately.
One run per scenario/variant does not establish statistical or universal reliability.
Available timing/token records cover parent sessions; delegated usage is not
fully included. Actual child model/effort was also checked where used. Backend
review tools remained available; a configuration flag alone did not disable them.

The existing Anthropic review generator produced a paired viewer with resulting
files, grades, checks and limitations. Raw transcripts, host settings, experiment
workspaces, and the viewer remain outside the public repository. Installation
used the preserved four-skill interface with Skills installer 1.5.26 in disposable
projects; installed files matched each frozen variant exactly. This verifies the
configured project installation, not every host's discovery behavior.

Evaluated main skill SHA256:
`03bbccd26ec19e62835c363be3918cb404dada9467a962f28d422b01aa527190`.
Final independent review confirmed the four public skill trees still match the
candidate snapshot. No methodology correction rounds were needed; evaluation
harness corrections and exploratory source-isolation failures are retained above.
