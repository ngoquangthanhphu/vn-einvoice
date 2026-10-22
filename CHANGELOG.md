# Changelog

All notable changes are documented here. The format follows
Keep a Changelog, and versions follow Semantic Versioning.

## [0.1.0] - 2026-10-22

### Added

- `parseInvoiceXml` for Circular 78 invoice XML, accepting both the
  direct `DLHDon` layout and the `DLieu`-wrapped layout.
- `decodeInvoiceSymbol` and `decodeTemplateCode` for the invoice symbol
  and template code defined in Article 4 of Circular 78/2021/TT-BTC,
  including the seven-character printed form.
- `validateInvoice` checking line sums, payable totals, symbol year and
  required identifying fields.
- Sample fixtures with fictional data, test suite, and CI on Node 20
  and 22.
