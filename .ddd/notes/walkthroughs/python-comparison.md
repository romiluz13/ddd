# DDD comparison walkthrough

Task: compare the supplied finished `load_settings` against official documentation,
correct discrepancies, and run checks. Public behavior: read TOML into a dictionary
on Python 3.11 and propagate errors. Scope is this disposable project only.

## Observed discovery

1. Read `/Users/rom.iluz/Dev/DDD/skills/ddd/SKILL.md`, then this project's `TASK.md`.
2. Ran `pwd` and `rg --files -g '!WALKTHROUGH.md' -g '!__pycache__/**' -g '!.venv/**'`.
   Found `settings.py`, `test_settings.py`, `pyproject.toml`, and `TASK.md`.
3. Read all three Python/project files. No dependency or lockfile was supplied.
   Manifest declares `requires-python = ">=3.11,<3.12"`; no third-party packages.
4. Ran `uv python find 3.11`; output:
   `/Users/rom.iluz/.local/share/uv/python/cpython-3.11-macos-aarch64-none/bin/python3.11`.
5. Ran `uv run --python 3.11 python --version`; resolved runtime is Python 3.11.15.
   uv created the local `.venv`. This is the target environment and matches the
   manifest. Only Python standard-library TOML parsing and file I/O are involved.
6. Ran the existing unittest suite before changing implementation; see baseline below.
7. Opened these official URLs directly using the web tool (no search engine query):
   - <https://docs.python.org/3.11/library/tomllib.html>
   - <https://docs.python.org/3.11/library/functions.html#open>
   - <https://docs.python.org/3.11/library/io.html#io.IOBase>
   - <https://docs.python.org/3.11/library/exceptions.html#FileNotFoundError>
   Pages identify themselves as Python 3.11.15 documentation. Access date:
   2026-09-05. Read `tomllib.load`, examples, and conversion table; used web `find`
   with exact patterns `open(file`, `context manager`, and
   `exception FileNotFoundError` to read the relevant source sections after the
   initial long functions page response included unrelated introductory sections.
8. Inspected installed official implementation using:
   `uv run --python 3.11 python -c 'import inspect,tomllib._parser; print(inspect.getsource(tomllib._parser.load))'`.
   It reads bytes, decodes them, then calls `loads`; text streams trigger the exact
   baseline TypeError. This corroborates the docs; no unsupported behavior was inferred
   from current examples for another Python version.
9. Read available `find-skills` and `verification-before-completion` instructions.
   No external framework, SDK, or service was introduced, and no skill search or
   installation was run. No optional DDD CLI, Book, evidence lock, or assurance
   tooling was installed or invoked. No memory/history lookup was needed for this
   self-contained disposable task.

## Original implementation

```python
import tomllib

def load_settings(path):
    with open(path, "r", encoding="utf-8") as stream:
        return tomllib.load(stream)
```

## Baseline commands and actual results

Working directory for project commands: `/tmp/ddd-walkthroughs.SIARed/compare`
(macOS canonical path `/private/tmp/ddd-walkthroughs.SIARed/compare`).

```text
$ uv run --python 3.11 python --version
Python 3.11.15
exit=0

$ uv run --python 3.11 python -m unittest -v
test_missing_file_propagates (test_settings.SettingsTest.test_missing_file_propagates) ... ok
test_reads_utf8_toml (test_settings.SettingsTest.test_reads_utf8_toml) ... ERROR
TypeError: File must be opened in binary mode, e.g. use `open('foo.toml', 'rb')`
Ran 2 tests in 0.003s
FAILED (errors=1)
exit=1
```

The omitted traceback points through `settings.py:5` to the installed
`python3.11/tomllib/_parser.py:63`. This is an observed failure of the supplied
implementation, not merely a documentation concern.

## Documentation basis and correction plan

Assumption: preserve `load_settings(path)` and standard parser output unchanged;
the caller supplies a filesystem path. No new defaults or error translation.

- **Python 3.11.15 / `tomllib`**: change to a readable binary stream because
  [`tomllib.load`](https://docs.python.org/3.11/library/tomllib.html#tomllib.load)
  requires it and returns a dictionary. Its conversion table supports the existing
  nested table/string/integer test. Invalid TOML raises `TOMLDecodeError`.
- **Python 3.11.15 / `open`**: use `"rb"` and omit `encoding`; binary mode supplies
  bytes, and encoding is a text-mode option. Path-like arguments are supported.
  [Official `open` section](https://docs.python.org/3.11/library/functions.html#open).
- **Python 3.11.15 / stream lifecycle**: retain `with`, which closes the stream on
  success and exceptions. [Official `IOBase` section](https://docs.python.org/3.11/library/io.html#io.IOBase).
- **Errors**: add no catches. A nonexistent path raises the documented
  [`FileNotFoundError`](https://docs.python.org/3.11/library/exceptions.html#FileNotFoundError);
  parser errors must also escape under the task's public behavior.
- **Checks**: run existing `python -m unittest -v` under Python 3.11. Add a one-off
  malformed-TOML assertion because the existing suite covers only success and missing
  paths. Preserve existing tests; the current success test already exposes this bug.
- **Open questions**: none.
- **Final comparison/check results**: completed below; existing 2 tests and the
  additional malformed-TOML check pass. No remaining documented API mismatch.

**Adapted snippet — proposed correction, untested at planning time.** Adapted
from the [official file-parsing example](https://docs.python.org/3.11/library/tomllib.html#examples):
wrap the example in the existing function, accept its path parameter, and return
the parsed dictionary. Existing naming and style are preserved.

```python
import tomllib

def load_settings(path):
    with open(path, "rb") as stream:
        return tomllib.load(stream)
```

Citation establishes API support; execution evidence is recorded separately below.

## Finished implementation and actual diff

Read back `settings.py` and all of `test_settings.py` after the edit. Tests were
unchanged. The finished implementation is exactly the adapted snippet above,
now executed. A `difflib.unified_diff` comparison of the original contents recorded
above against `Path('settings.py').read_text()` produced:

```diff
--- original/settings.py
+++ settings.py
@@ -1,5 +1,5 @@
 import tomllib

 def load_settings(path):
-    with open(path, "r", encoding="utf-8") as stream:
+    with open(path, "rb") as stream:
         return tomllib.load(stream)
```

Only the one implementation line changed. `WALKTHROUGH.md` is this requested record;
`uv run` also generated local `.venv`, `uv.lock`, and Python bytecode cache artifacts.
No repository file outside the disposable project was edited.

## Final comparison

After the correction, reopened the actual official page sections with web `open`:
`tomllib.html` line 18, `functions.html` line 582, `io.html` line 154, and
`exceptions.html` line 421. Read returned source text while comparing the entire
five-line implementation and surrounding test code, not merely citation labels.

| Actual code/API | Official source section read | Comparison |
| --- | --- | --- |
| `import tomllib` | [Module introduction and examples](https://docs.python.org/3.11/library/tomllib.html#examples) | Available in target Python 3.11; no backport or dependency needed. |
| `open(path, "rb")` | [`open`](https://docs.python.org/3.11/library/functions.html#open), arguments and mode table | Path-like parameter accepted; readable binary file supplied; incompatible text encoding argument removed. |
| `with ... as stream` | [`IOBase`](https://docs.python.org/3.11/library/io.html#io.IOBase), context manager paragraph | Stream remains owned by the function and closes on return or exception. Existing lifecycle preserved. |
| `tomllib.load(stream)` | [`load`](https://docs.python.org/3.11/library/tomllib.html#tomllib.load), signature and conversion table | Correct positional binary argument; dictionary returned directly; no custom conversion or options. |
| No catch or fallback | [`TOMLDecodeError`](https://docs.python.org/3.11/library/tomllib.html#tomllib.TOMLDecodeError), [`FileNotFoundError`](https://docs.python.org/3.11/library/exceptions.html#FileNotFoundError) | Both observed exceptions escape to caller, as required by TASK.md. |

No asynchronous work, cancellation, service revision, frontend layer, or additional
third-party integration applies. The binary-mode correction resolves the single
observed mismatch. No further correction was needed after reopening docs.

## Final commands and actual results

```text
$ uv run --python 3.11 python -m unittest -v
test_missing_file_propagates (test_settings.SettingsTest.test_missing_file_propagates) ... ok
test_reads_utf8_toml (test_settings.SettingsTest.test_reads_utf8_toml) ... ok

----------------------------------------------------------------------
Ran 2 tests in 0.002s

OK
exit=0
```

Additional executed check, verbatim command:

```sh
uv run --python 3.11 python - <<'PY'
import tempfile
import tomllib
from pathlib import Path
from settings import load_settings

with tempfile.TemporaryDirectory() as directory:
    path = Path(directory) / 'invalid.toml'
    path.write_text('[app\n', encoding='utf-8')
    try:
        load_settings(path)
    except tomllib.TOMLDecodeError:
        print('Malformed TOML propagates TOMLDecodeError: PASS')
    else:
        raise AssertionError('Malformed TOML did not raise TOMLDecodeError')
PY
```

```text
Malformed TOML propagates TOMLDecodeError: PASS
exit=0
```

Final file inventory command:
`rg --files -g '!.venv/**' -g '!__pycache__/**'` returned
`test_settings.py`, `WALKTHROUGH.md`, `TASK.md`, `settings.py`, `pyproject.toml`,
and `uv.lock` (exit 0). The diff inspection command also exited 0.

## Limitations

This verifies this function on CPython 3.11.15 on macOS with the supplied UTF-8
table/string/integer case, missing-file behavior, and one malformed document.
It does not execute every TOML type, OS error, filesystem platform, or Python 3.11
patch release. Cleanup was compared to documented context-manager semantics, not
instrumented in an additional test. No lint/type-check configuration was supplied.
No repository-wide or Proofline assurance claim is made; no optional tooling was
available or required. Hosted official docs were accessible, so no unresolved
retrieval gap or API contradiction remains for this declared scope.
