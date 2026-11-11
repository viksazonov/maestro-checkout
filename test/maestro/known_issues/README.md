# Known issues as tests

One flow per automatable finding in [FINDINGS.md](../../../FINDINGS.md).
Each flow asserts the behaviour a customer would **expect**, so it **fails
today** and turns green once the issue is fixed — an executable bug report.
They are kept out of the main suite (Maestro only runs the top level of
`test/maestro/`), which stays green.

```bash
maestro test test/maestro/known_issues/
```
