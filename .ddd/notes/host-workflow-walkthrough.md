# DDD installed-host walkthrough

Run date: 2026-09-06. Status: walkthroughs finished; automatic-workflow acceptance
is not met. These are disposable local tasks, not
production evidence or a cross-host reliability measurement.

## Setup and sources

Factory Droid 0.213.0, default gpt-5.6-sol with medium reasoning. Project copies
of the four methodology skills live under `.factory/skills/`. The projects contain
no Proofline CLI, Book, evidence lock, or assurance case. No global configuration
was changed. Personal host instructions remain present, so this is an installed
host test, not an isolated model evaluation.

The parent checked the official [skills guide](https://docs.factory.ai/harness/skills),
[headless execution guide](https://docs.factory.ai/droid-exec/overview), and
[instruction discovery guide](https://docs.factory.ai/harness/agents-md), plus
the installed CLI's help. The local CLI uses `--only-tools`, while an online
example still uses `--restrict-tools`; the executed command follows local help.

Temporary root: `/tmp/ddd-loop.UstN7H`. Separate `droid exec` processes omit
`--session-id` and `--fork`. Their JSONL logs contain actual tool calls/results.
The parent inspects those events and resulting files, excluding private reasoning
from this record. Temporary logs may disappear; observations are preserved here.

Runs use `--auto medium --disable-builtin-skills` and
`--only-tools Read,Grep,Glob,LS,Skill,ApplyPatch,Execute,TodoWrite,FetchUrl,WebSearch`,
with `--output-format stream-json --file <ordinary-request>`. ToolSearch remains
available. The startup manifest lists additional tools despite the selector;
only actually executed calls establish what was used. `--cwd` is a working
directory choice, not a filesystem sandbox. Prompts restrict work to the fixture.

## Python request and checks

Python 3.11.15, Flask 3.1.2, SQLite through Python's standard library. Existing
`open_database` returns connections using `sqlite3.Row`. The contacts table
contains `id`, `name`, `email`, and private `internal_note`. Two existing unittest
cases check ordered public fields with a Unicode name and an empty result.

Ordinary request, with no documentation links or note instructions:

> Add GET /contacts to this application. Return a JSON array of contacts ordered
> by id, exposing only id, name, and email. Preserve Unicode names. An empty
> database should return an empty array. Use the existing database setup and keep
> dependencies unchanged. Implement the endpoint and run the project checks.

The project instruction initially says “Use DDD for coding tasks.” Later runs use
the earlier README instruction: “Use DDD for coding tasks. Read the DDD skill and
follow its documentation discovery, grounded planning, implementation, and final
comparison process.” The explicit-entry run
prefixes the same request with “Use DDD for this task.” No run receives a skill
file path, source URL, or note path in its task prompt.

Parent baseline: `.venv/bin/python -m unittest -v` exits 1; two failures because
the endpoint returns 404. The parent later injects a regression replacing the
conversion to dictionaries with `jsonify(rows)`; populated results fail with
`TypeError: Object of type Row is not JSON serializable`, while the empty case
passes. This is a deliberately injected fixture bug, not a discovered repository
application defect.

## Failed development attempts

These failures remain evidence; later reruns do not erase them. All runs use
development snapshots marked 0.7.2, so their names distinguish instruction edits.

| Log | Observed actions | Limitation |
|---|---|---|
| `ordinary.jsonl` | Invoked installed `ddd`; resolved Flask 3.1.2; tried a versioned URL, recovered from 404 through stable official docs and shipped provider source; created `.ddd/notes/get-contacts.md` before app edits; two tests passed. | No SQLite source read, no saved integration snippet, and no post-edit source reread. |
| `ordinary-revised.jsonl` | Invoked `ddd`; fetched Flask docs and read provider source; saved a snippet before implementation. | Wrote completed comparison and “3 tests, OK” into the note before editing code or running checks. Actual output says 2 tests. No subsequent note update or final source reread. |
| `resume.jsonl` | Fresh session found and read `.ddd/notes/contacts-endpoint.md` without a supplied path; reproduced the injected 500; read Flask's shipped JSON provider and probed row conversion; restored dictionaries; two tests passed; updated the same note. | The edit script read back resulting app.py, but no post-fix external-source reread occurred; earlier unsupported and inaccurate statements remained in the note. This demonstrates resumption and targeted investigation, not complete compliance. |
| `ordinary-final.jsonl` | Implemented and ran checks. | Did not activate DDD or save a note. Also created an empty `/tmp/contacts_patch.py` outside the fixture despite the scope instruction. The new pending-results instruction was not exercised. |
| `ordinary-routine.jsonl` | Implemented and ran two tests using the full published project instruction. | Again did not activate DDD or research/save context. A separate no-tools instruction probe correctly reproduced the project instruction already present in context; non-discovery is not established as the cause. |

The revised-run sequence is especially important: JSONL line 62 writes the
completed note, line 65 writes application code, and lines 68–69 execute/report
two tests. Its claims of a later comparison and three tests are unsupported.

The final skill now requires source reads for each technology question, keeps
implementation/comparison/checks pending until performed, and orders actual
post-edit reads before recording a comparison. These instructions address the
observed mistakes without adding an enforcement service or another artifact.

## Final instruction runs

| Log / session | Observed result | Remaining limitation |
|---|---|---|
| `explicit.jsonl` / `c536917c-1364-41cd-b194-c20109b3bdd0` | Invoked `ddd`; read Python 3.11 SQLite and Flask docs before saving the plan/snippet with results pending; implemented; ran two tests; read resulting app.py and reopened a cached official Flask section; updated the note after results. | Final note also claims SQLite and ensure_ascii section rereads absent from the post-edit tool results. Final source comparison is partial. |
| `ts-plan.jsonl` / `a4803933-3575-4d21-a1ba-eb6e038d45de` | Invoked `ddd-ground`, which read `ddd`; identified installed Zod 3.25.76 and its v3 root export; read shipped v3 implementation; saved `.ddd/notes/parse-account.md` with a useful untested snippet and pending checks; app stub unchanged. | Explicitly skipped online documentation without attempting it. Applicable source was read, but required online discovery was not exercised. |
| `ts-resume.jsonl` / `202ed97d-d5c2-4bf1-b0a4-4f68110bc993` | Fresh session found the note without its path; requirement changed from Number-compatible strings to decimal digits only. Read shipped preprocessing/NaN handling, updated plan before edits, implemented, ran checks, reread final code and v3 source, then updated the same note. | No online lookup or source read for newly introduced JavaScript regex semantics. The final note also claims a helpers/util.ts reread absent after editing; post-edit searches only cover types.ts. Demonstrates resumption and partial source comparison. |
| `gap.jsonl` / `b1ea0b7f-3e45-46b6-9343-5b6c7d246d85` | Invoked `ddd`; supplied fictional private Nimbus Ledger v2 contract URL failed; web search and curl/DNS found no usable source; saved exact missing endpoint/schema/auth/polling/result questions; left client.py unchanged and implementation blocked. | Expected gap handling, not a completed client. No application tests ran. The note's general RFC assertion was not independently researched by that agent. |

The explicit Python sequence is plan write at line 44, app edit at 49, tests at
52, resulting file read at 57, cached Flask reread at 58, and final note write at
71. One ad-hoc probe bypassed the existing row factory and failed; a corrected
probe using `open_database` succeeded. This was recorded as a probe error.

TypeScript uses Bun 1.3.13 and Zod 3.25.76. The current official
[Zod release documentation](https://zod.dev/v4), read by the parent, describes v4;
the fixture deliberately keeps the older installed root API. Its ordinary task
requests email validation, age at least 18 with numeric strings, unknown-field
stripping, and invalid-input errors. The subsequent requirement adds rejection
of hex/scientific notation, whitespace, and decimal points in strings. The
implementation uses v3 preprocessing with a decimal-digit check, then
`z.number().min(18)`, and preserves installed dependencies.

## Independent parent checks

| Check | Actual result |
|---|---|
| Python `.venv/bin/python -m unittest -v`, final explicit implementation | Exit 0; 2 tests, OK. |
| TypeScript `bun run test`, after plan-only run | Exit 1, original `Not implemented` stub; expected planning boundary. |
| TypeScript `bun run test`, after resumed implementation | Exit 0; 4 original behavior checks and 4 decimal-string checks. |
| TypeScript trailing-newline age probe | Rejected `"18\n"`; exit 0. |
| Python after revised workflow-ownership instruction, Droid run | Exit 0; 2 tests, OK. |
| Python after revised workflow-ownership instruction, Codex search-enabled run | Exit 0; 2 tests, OK; compilation exits 0. |
| Unavailable-contract client bytes | Still `def submit_and_wait(payload):` followed by `raise NotImplementedError`; no invented implementation. |

No dependency manifests or lockfiles were changed by the agents. Both completed
fixtures lack the optional CLI and its evidence machinery. The TypeScript task
uses Bun as its native runtime, while the Python project does not need Bun.
No static TypeScript check was configured or claimed.

## Workflow ownership across skills

A second installed host, Codex CLI 0.153.4 (configured gpt-5.6-sol/high), ran the
same ordinary request with project skills under `.agents/skills/`. Commands use
`codex exec --ephemeral --json --sandbox workspace-write --skip-git-repo-check
--cd <fixture> -`, reading the unchanged ordinary task from stdin. The last run
also uses the CLI's `--search` option. These are fresh sessions with existing
personal configuration, not an isolated model comparison. Local CLI help and
official [skill](https://developers.openai.com/codex/skills) and
[noninteractive](https://developers.openai.com/codex/noninteractive) docs were
checked. No global configuration or model override was applied.

The first Codex run loaded DDD and a personal brainstorming skill, then stopped
for design approval without implementing or saving research. That is a competing
workflow overriding the already-authorized task. The public one-time project
instruction and main skill now explicitly make DDD the workflow owner; other
skills supply technical guidance without adding routine approval stages.

| Log / session | Actual outcome |
|---|---|
| `codex-ordinary.jsonl` / `01a07861-dc44-7562-8fb0-1398da7703ee` | Requested design approval despite the implementation request; no endpoint, research note, or documentation investigation completed. |
| `codex-priority.jsonl` / `01a07864-1594-7690-9866-b3afd5564144` | With the stronger project instruction, treated the concrete request as authorization, read shipped Flask/Python sources, created the note before implementation, implemented, invoked post-edit code/source reads, updated the same note and passed 2 tests. The final note contains a proposed snippet; pre-edit contents are absent from the events and cannot establish pending status then. No hosted-document lookup was observed. |
| `droid-priority.jsonl` / `d185e550-f7b3-48e5-8b6a-b94897ae677e` | Same stronger project instruction, ordinary prompt with no DDD phrase: invoked `ddd`, fetched Flask docs, saved the plan before editing, implemented, reread code/a Flask section and passed 2 tests. SQLite source coverage still missing; broader automatic compliance remains unmet. |
| `codex-search.jsonl` / `01a07867-3f07-70b0-bd80-2b14f7584d41` | With live search enabled, attempted tagged Flask/Python documentation through Octocode. That MCP call was blocked because it required approval under policy `never`. Used installed source/docstrings and explicitly identified runtime row probes, saved and read a pending note before implementation, implemented, invoked final code/source reads, passed 2 tests and compilation. This demonstrates a fallback path, not successful online discovery. |

Codex emitted a skill-catalog truncation warning; DDD was still visibly read.
The blocked MCP read does not establish that every remote documentation channel
was unavailable. It establishes that this attempted channel was blocked. No
permissions were bypassed. The clarified workflow instruction removed the extra
approval pause in these reruns; a small number of runs does not prove causality
or eliminate the other observed failures.
Some invoked comparison reads have incomplete returned evidence: priority-run
line 38 omits the requested resulting app.py excerpt, and search-run line 59
omits the requested Flask app.py excerpt. Other post-edit file/provider/docstring
reads are visible. These logs do not establish every claimed comparison.

These runs demonstrate useful research, saved plans, corrected fixture code,
and fresh-session resumption. The workflow-ownership correction also let Codex
continue authorized work alongside another skill. Runs still demonstrate missed activation, omitted
source reads, and overstated notes. The instructions are improved, but this
evidence does not justify reliable automatic compliance or publication readiness.
No further instruction wording change is assumed to fix the remaining host/model
behavior without another actual test.

The [2026-09-05 suite](methodology-walkthroughs.md) remains historical coverage of
eight scenarios using explicitly supplied skill/note paths. It is not a rerun of
this revision and does not establish host activation or automatic persistence.
