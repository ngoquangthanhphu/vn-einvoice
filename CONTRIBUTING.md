# Contributing

Issues and pull requests are welcome.

## Setup

```sh
npm install
npm test
```

## Guidelines

- Keep the public API small. New exports need a reason in the pull
  request description.
- Parser changes need a test. If the change handles a new issuer layout,
  add a fixture under `test/fixtures/` — sample files only, with
  fictional company names and tax codes. Never commit a real invoice.
- Run `npm run typecheck` and `npm test` before opening a pull request.
  CI runs both, plus the build, on Node 20 and 22.
- Amounts and identifiers are different things: invoice numbers and tax
  codes stay strings, amounts are numbers. Do not blur the two.
