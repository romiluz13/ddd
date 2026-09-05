# Fresh-context direction-change walkthrough

Date: 2026-09-05. Workspace: `/tmp/ddd-walkthroughs.SIARed/direction`.
Task: implement `import_entries`, maintain the existing caller's transaction,
fail duplicate batches atomically, preserve unrelated pending writes, return None.
No optional DDD CLI, Book, lock, or repository edits were used.

## Observed sequence

1. Read `/Users/rom.iluz/Dev/DDD/skills/ddd/SKILL.md` and this project's TASK.md.
   Listed project files with `rg --files`, then read existing PLAN.md, entries.py,
   caller.py, test_entries.py, and pyproject.toml before any edit. One orchestration
   call had a JavaScript parenthesis syntax error and executed no commands; the
   corrected read completed immediately.
2. The existing plan proposed executemany then commit and explicitly required
   inspecting the caller. The caller inserts an audit message before import and
   commits afterwards. Both existing tests already create pending audit work.
   This established the concrete active-transaction context before source research.
3. Resolved the interpreter with `uv python find 3.11`, then inspected runtime
   versions using that path: Python 3.11.15, SQLite 3.50.4. The manifest range is
   >=3.11,<3.12; no lockfile or third-party dependencies exist.
4. Opened the official Python 3.11 sqlite3 documentation and SQLite savepoint /
   ON CONFLICT pages. Read execute/executemany signatures, transaction control,
   savepoint section 2, and ABORT behavior. The default conflict strategy preserves
   earlier statements; therefore repeated inserts require a savepoint for batch
   atomicity. Whole-connection commit/rollback would affect the caller's audit row.
5. Read the applicable brainstorming, find-skills, and verification skills.
   Reviewed alternatives in the existing implementation authorization: retain
   executemany+commit (ownership violation), use executemany alone (partial batch),
   or wrap executemany in a savepoint (chosen). No extra permission gate was added.
   Opened skills.sh and ran `npx --yes skills find sqlite`, which exited 0 with
   third-party candidates. No skills were installed or adopted; official sources
   directly covered the small standard-library integration.
6. Ran the original tests before implementation with the resolved Python:
   `python3.11 -m unittest -v`: 2 tests, 2 NotImplementedError errors, exit 1.
   These were existing behavior tests, not a proof of any proposed code running.
7. Before editing implementation, corroborated SQLite compatibility using official
   3.6.8 release notes and release-tagged 3.50.4 test/savepoint.test. Read cases
   1.4.2 and 2.1–2.11. Important constraint: releasing an outermost savepoint can
   commit. Explicitly scoped the design to the caller's already-open transaction.
8. Rewrote the existing PLAN.md with cited decisions, rejected alternatives,
   a concrete `proposed code (untested at planning time)` integration snippet,
   versions, sources, open questions, native checks, and pending final comparison.
   The accepted initial direction changed because of the documented transaction
   semantics and observed caller, before implementation.
9. Implemented the planned savepoint wrapper in entries.py. Kept caller.py
   unchanged. Added two behavior checks to test_entries.py: preserve preexisting
   entry writes through failed batch and caller commit; exercise the real caller's
   successful commit of both audit and imported data.
10. Ran all tests with the resolved Python: 4 tests passed, 0.003s, exit 0.
11. Read numbered final entries.py, caller.py, and test_entries.py; displayed a
    unified diff against the observed original importer stub. Reopened official
    source sections themselves for final comparison, including exception hierarchy,
    in_transaction, execute/executemany, fetchall, commit/rollback, transaction
    control, savepoints, ABORT, and release-tagged savepoint tests. No code correction
    was needed. Updated PLAN.md with actual checks and comparison results and wrote
    this observation record.

## Final source comparison

| Actual code | Official section reopened | Comparison |
| --- | --- | --- |
| entries.py:2,6,7,9 execute calls | [Python Connection.execute](https://docs.python.org/3.11/library/sqlite3.html#sqlite3.Connection.execute) and [SQLite savepoints section 2](https://www.sqlite.org/lang_savepoint.html) | Single SQL statements; rollback-to then release removes batch work while retaining the outer transaction. Success release also retains that transaction. |
| entries.py:4 executemany | [Python Cursor.executemany](https://docs.python.org/3.11/library/sqlite3.html#sqlite3.Cursor.executemany) | One parameterized INSERT and iterable of one-value rows match the signature; no result cursor is returned from the importer. |
| entries.py:5–8 failure handling | [Python exception hierarchy](https://docs.python.org/3.11/library/sqlite3.html#exceptions) and [SQLite ABORT](https://www.sqlite.org/lang_conflict.html) | IntegrityError reaches Exception cleanup; rollback-to removes earlier batch rows; original exception is re-raised. |
| caller.py:4–6 | [Python transaction control](https://docs.python.org/3.11/library/sqlite3.html#transaction-control) | Default connection mode opens the transaction on the preceding audit INSERT; commit remains caller-owned. |
| test_entries.py:30–45 and original tests | [Python connection reference](https://docs.python.org/3.11/library/sqlite3.html#connection-objects) and [Cursor.fetchall](https://docs.python.org/3.11/library/sqlite3.html#sqlite3.Cursor.fetchall) | Assertions read actual rows and transaction state, then exercise caller commit/rollback. Cleanup remains the test fixture's responsibility. |
| SQLite 3.50.4 applicability | [Release-tagged savepoint tests](https://github.com/sqlite/sqlite/blob/version-3.50.4/test/savepoint.test) | Cases 1.4.2 and 2.1–2.11 corroborate nested release and rollback-to behavior in the resolved version. Upstream tests were read, not run. |

## Actual check output

Command run from the project directory:

```sh
/Users/rom.iluz/.local/share/uv/python/cpython-3.11-macos-aarch64-none/bin/python3.11 -m unittest -v
```

```text
test_existing_caller_commits_import_and_audit ... ok
test_failed_batch_preserves_prior_entries_for_caller_commit ... ok
test_failure_rolls_back_only_batch ... ok
test_success_keeps_callers_transaction ... ok
Ran 4 tests in 0.003s
OK
```

The documented active caller transaction is the verified scope. An out-of-transaction
call would release an outer savepoint and commit, so it is not claimed as supported.
No crash, disk I/O failure, or custom-trigger rollback guarantee was tested or claimed.
The snippet's original untested label is retained as planning history; entries.py is
its executed implementation. Source citations and test evidence serve different roles.
