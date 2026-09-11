# Import entries plan

The initial approach was `executemany` followed by `commit`. Caller inspection
changed that decision before implementation: `caller.py` inserts an audit row,
calls the importer, then commits. The importer must preserve that transaction.

Assumption from the existing caller and tests: import runs inside an active
caller-owned transaction. Input is an iterable of single-item parameter rows.
The existing `entries(name TEXT UNIQUE)` schema uses default conflict behavior.

## Revised implementation

1. Keep the caller unchanged. A connection commit commits all pending work;
   a connection rollback likewise rolls back the entire pending transaction
   ([Python 3.11 connection methods](https://docs.python.org/3.11/library/sqlite3.html#sqlite3.Connection.commit)).
2. Open a named savepoint, run one parameterized INSERT through `executemany`,
   and release the savepoint on success. `executemany` repeats a DML statement
   for each parameter row; it does not provide batch rollback
   ([Python 3.11 executemany](https://docs.python.org/3.11/library/sqlite3.html#sqlite3.Cursor.executemany),
   [SQLite ABORT conflict behavior](https://www.sqlite.org/lang_conflict.html)).
3. On an exception, roll back to the savepoint, release it, and re-raise. This
   removes only this batch. An inner release does not commit the caller's work
   ([SQLite savepoints, section 2](https://www.sqlite.org/lang_savepoint.html)).
   Do not apply this design outside an active transaction: releasing an outermost
   savepoint commits. The inspected caller satisfies the active-transaction condition.
4. Return `None` implicitly. No new dependencies or connection ownership.

Rejected alternatives: whole-connection context management or explicit commit/
rollback affects unrelated pending work; executemany alone leaves earlier batch
rows after a later UNIQUE failure. A savepoint gives the required batch boundary.

### Integration snippet — proposed code (untested at planning time)

Adapted from the documented parameterized executemany pattern and savepoint SQL;
table name, savepoint name, and exception cleanup are task-specific. This is a
proposal, not an official example or execution evidence.

```python
def import_entries(connection, entries):
    connection.execute("SAVEPOINT import_entries")
    try:
        connection.executemany("INSERT INTO entries(name) VALUES (?)", entries)
    except Exception:
        connection.execute("ROLLBACK TO SAVEPOINT import_entries")
        connection.execute("RELEASE SAVEPOINT import_entries")
        raise
    connection.execute("RELEASE SAVEPOINT import_entries")
```

## Documentation basis

- Target: Python >=3.11,<3.12; resolved runtime Python 3.11.15, SQLite 3.50.4.
  No dependency lockfile exists. All changes use the standard library.
- Official sources: Python 3.11 sqlite3 connection shortcut methods,
  Cursor.executemany, transaction control; SQLite savepoints section 2 and
  ON CONFLICT ABORT. Links accompany decisions above.
- Version corroboration: [SQLite 3.50.4 savepoint tests](https://github.com/sqlite/sqlite/blob/version-3.50.4/test/savepoint.test),
  cases 1.4.2 and 2.1–2.11, demonstrate nested release and rollback-to preservation.
  [SQLite 3.6.8 release notes](https://www.sqlite.org/releaselog/3_6_8.html)
  establish savepoint support predates this runtime. Sources accessed 2026-09-05.
- Rules/snippet: revised implementation and integration snippet above.
- Open questions: none for the inspected caller. Calls outside its active
  transaction pattern are outside this project's task scope.
- Native checks: Python 3.11 `-m unittest -v`; existing success/duplicate tests,
  plus caller integration and preservation of prior entry writes.
- Before implementation: existing 2 tests ran and errored with NotImplementedError.
- Final comparison: inspected every importer call, unchanged caller, and all four
  tests; reopened Python connection methods, executemany, transaction control,
  in_transaction, fetchall and exceptions, plus SQLite savepoints/ABORT and
  version-3.50.4 savepoint tests. No discrepancies found for the active caller
  transaction. No correction was needed after implementation.
- Actual check: `~/.local/share/uv/python/cpython-3.11-macos-aarch64-none/bin/python3.11 -m unittest -v`
  passed all 4 tests (0.003s, exit 0). The integration snippet above was then
  exercised as entries.py; its label preserves its status when the plan was written.
- Limitations: evidence covers this in-memory schema and caller-owned transaction;
  no claim about out-of-transaction calls, custom rollback triggers, or crash/I/O
  recovery. Full observed sequence is in WALKTHROUGH.md.
