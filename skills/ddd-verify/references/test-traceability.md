# Select execution checks

Use the project's native checks to exercise the behavior changed by the task.
Inspect existing scripts, tests, and conventions before choosing commands.

- Type checks or compilation can catch invalid imports, arguments, and returns.
- Focused tests should exercise relevant behavior, including asynchronous
  completion, errors, configuration, and lifecycle boundaries where applicable.
- Integration checks should exercise interactions between the technologies
  actually combined by the change.

Prefer existing checks. Add focused tests when needed to expose a meaningful
behavioral failure; avoid tests that merely repeat the implementation or assert
that documentation contains a phrase. Inspect changed test code against the
same applicable API documentation.

After correcting a discrepancy, rerun affected checks and record the command,
actual result, and execution limitations in the Documentation basis. A passing
test does not establish a vendor guarantee; a citation does not establish that
code ran. No claim IDs, validation tiers, or trace ledger are required.
