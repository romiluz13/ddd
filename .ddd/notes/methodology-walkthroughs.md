# DDD fresh-context walkthroughs

Run date: 2026-09-05. Separate agents with no parent conversation history
(`fork_turns: none`) received a pointer to `skills/ddd/SKILL.md` and an ordinary
task file. The parent prepared disposable projects, inspected the resulting
files and records, and reran completed implementation checks. These observations
cover the listed tasks, not every agent host; no evaluation platform was built.

The temporary root was `/tmp/ddd-walkthroughs.SIARed`. No fixture contained the
Proofline CLI, Book, evidence locks, or assurance cases. DDD was loaded by a local
skill-file reference; host-specific skill installation was not exercised. Zod
3.25.76 was installed before dispatch. Python 3.11.15 was available through uv.
No global agent settings were changed.

## Required scenarios

| Scenario | Observed behavior | Record |
|---|---|---|
| 1. No documentation links | Agent found official Zod docs, attempted hosted v3 pages, then used official repository docs and shipped source. | [TypeScript](walkthroughs/typescript.md) |
| 2. Installed version differs from current docs | Root import resolved to Zod 3.25.76 while search surfaced v4 docs. Plan and code used the v3 API; manifest and lock stayed pinned. | [TypeScript](walkthroughs/typescript.md) |
| 3. Plan only | Agent produced cited decisions, an untested snippet, pending checks, and a handoff note; implementation stub and tests stayed untouched. | [Planning](walkthroughs/python-plan.md) |
| 4. Implementation changes direction | Caller inspection invalidated executemany-plus-commit. Agent researched SQLite savepoints before implementing them and updated the existing plan. | [Direction change](walkthroughs/direction-change.md), [plan](walkthroughs/transaction-plan.md) |
| 5. Finished code contradicts docs | Agent identified tomllib.load's binary-stream requirement, reproduced the text-stream failure, corrected rb mode, reopened docs, and reran checks. | [Comparison](walkthroughs/python-comparison.md) |
| 6. Documentation unavailable | Retrieval and searches found no authoritative source; agent kept the client stub and named the missing submission/polling contract. | [Unavailable docs](walkthroughs/unavailable.md) |
| 7. Session handoff | Different agent read the note, checked code/runtime for drift, reopened sources, implemented under new authorization, and updated the same note. | [Resumption](walkthroughs/python-resume.md), [maintained note](walkthroughs/load-settings-plan.md) |
| 8. Different languages without CLI | TypeScript/Zod and Python standard-library tasks ran without optional assurance tooling. | Records above |

## Fixture requests and results

**TypeScript:** implement `parseAccount(input)` with the installed library; valid
email, numeric age-string coercion, age at least 18, invalid-input rejection, and
unknown-field stripping. Initial function returned input unchanged: two tests
failed. Final: four Bun tests passed with 21 assertions. No static TypeScript
check was configured or claimed. The agent added malformed-input and minimum
boundary checks; package and lock versions remained unchanged.

**Python plan and resumption:** plan only for `load_settings(path)`, Python 3.11
standard-library TOML parsing, dictionary return, propagated errors, and a
session handoff. Initial function raised `NotImplementedError`. The next session
received the existing note location and implementation authorization. Two native
unittest cases passed after implementation, plus an executed malformed-TOML
check. The planning note retains its original history and later results.

**Finished-code comparison:** the function opened a text stream with
`encoding="utf-8"` and passed it to `tomllib.load`. Baseline: one passing
missing-file test and one error on valid UTF-8 TOML. The one-line binary-mode
correction produced two passing tests; malformed-TOML propagation also passed.
The record preserves original/final code and actual comparison.

**Direction change:** initial plan used SQLite `executemany` then commit; the
caller already owned a transaction. Batch duplicates must roll back only batch
inserts, preserve unrelated pending writes, and leave commit to the caller.
The agent researched Python 3.11 transaction behavior and SQLite savepoints before
switching approach. Four tests passed on Python 3.11.15 / SQLite 3.50.4. Coverage
is limited to the existing caller's active transaction.

**Unavailable docs:** fictional private Acme Queue v2 job submission/polling,
with a deliberately unresolvable `.invalid` documentation URL. Browser retrieval
failed, curl returned DNS error 6, and searches found no official fallback. No
methods, payloads, terminal states, or retry rules were invented. Gap handling
was exercised successfully; the fictional client remains unimplemented. The
agent also noted default Python 3.14.6 versus the required 3.11 range. Protocol
access was independently blocking, and no implementation tests ran.

## Execution limits

Three initial runs completed; a usage-limit error stopped the next three
fresh-context runs. After the user said to continue, those bounded runs were
retried successfully. Failed service attempts are not scenario evidence.

The records preserve sources, relevant sections, snippet status, changes, and
actual command outcomes. Temporary paths identify the execution environment and
may disappear; the Markdown records preserve the observations. These are
synthetic local tasks, not production assurance or a cross-host reliability
measurement. An expected blocked task is not counted as implemented.

Parent verification reran the native commands against the resulting files:

| Project | Command (from that temporary project) | Actual result |
|---|---|---|
| TypeScript | `bun run test` | Exit 0; 4 pass, 0 fail, 21 assertions. |
| Python resumption | Python 3.11.15 `-m unittest -v` | Exit 0; 2 tests, OK. |
| Python comparison | Python 3.11.15 `-m unittest -v` | Exit 0; 2 tests, OK. |
| Python direction change | Python 3.11.15 `-m unittest -v` | Exit 0; 4 tests, OK. |

The parent also compared the unavailable client's bytes with its original stub,
confirmed all five projects lack CLI/Book/lock/claim artifacts, and read the
agents' recorded original failures, research ordering, final code and notes.
The malformed-TOML probes are recorded agent executions, separate from the
parent's native-suite reruns. All eight required scenarios were exercised.
