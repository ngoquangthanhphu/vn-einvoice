# vn-einvoice

Parse and validate Vietnamese e-invoice XML files in the format defined by
Circular 78/2021/TT-BTC (Thong tu 78). Written in TypeScript, runs on
Node.js 18 or later.

The library covers the three things accounting software repeatedly needs
when it receives invoice XML from the tax portal or from an issuer:

- turn the XML into a typed object (seller, buyer, line items, totals),
- decode the invoice symbol (`KHHDon`) and template code (`KHMSHDon`),
- check the arithmetic: line amounts against the stated total before VAT,
  and total before VAT plus VAT against the stated amount payable.

It does not download invoices, talk to the tax portal, or verify digital
signatures. It reads the document you already have.

## Install

```sh
npm install vn-einvoice
```

## Usage

```ts
import { readFileSync } from "node:fs";
import { parseInvoiceXml, validateInvoice, decodeInvoiceSymbol } from "vn-einvoice";

const xml = readFileSync("invoice.xml", "utf-8");
const invoice = parseInvoiceXml(xml);

console.log(invoice.seller.name, invoice.seller.taxCode);
console.log(invoice.number, invoice.symbol, invoice.issueDate);
console.log(invoice.items.length, invoice.totals.totalPayable);

const issues = validateInvoice(invoice);
for (const issue of issues) {
  console.warn(issue.code, issue.message);
}

const symbol = decodeInvoiceSymbol("1C26TAA");
console.log(symbol.year, symbol.taxCodeKind, symbol.kindLabel);
```

Runnable version: `npm run example` parses one of the test fixtures and
prints the result.

## Symbol format

Template code (`KHMSHDon`) is one digit: `1` VAT invoice, `2` sales
invoice, `3` sale of public assets, `4` sale of national reserve goods,
`5` electronic stamps/tickets/cards/receipts, `6` warehouse delivery or
consignment documents.

Symbol (`KHHDon`) is six characters:

| Position | Meaning |
| --- | --- |
| 1 | `C` issued with a tax authority code, `K` without one |
| 2-3 | Year of issue, last two digits (`26` = 2026) |
| 4 | Kind: `T` registered invoice, `D` public-assets / reserve / special, `L` issued by the tax authority per transaction, `M` created from a cash register, `N` internal delivery note, `B` consignment delivery note, `G` stamp/ticket/card (VAT), `H` stamp/ticket/card (sales) |
| 5-6 | Chosen by the seller for internal management |

Printed invoices often merge the two fields into a seven-character
string such as `1K26DAA`. `decodeInvoiceSymbol` accepts both forms.

## Format notes

- Issuers wrap the data block inconsistently: `DLHDon` usually sits
  directly under the `HDon` root, but some issuers nest it inside a
  `DLieu` element. Both layouts are accepted.
- VAT rates are kept as the raw string from the XML (`TSuat`), because
  the field also carries non-numeric values such as `KCT` (not subject
  to VAT) and `KKKNT` (not declared).
- Amounts are returned as numbers. The tax authority code (`MCCQT`) is a
  string and may be absent on invoices issued without one.

## API

- `parseInvoiceXml(xml: string): Invoice`
- `decodeInvoiceSymbol(symbol: string): DecodedSymbol`
- `decodeTemplateCode(code: string): string | undefined`
- `validateInvoice(invoice: Invoice, tolerance?: number): ValidationIssue[]`

Types `Invoice`, `Party`, `LineItem` and `InvoiceTotals` are exported
for consumers that build invoices from other sources and want the
validator on its own.

## Development

```sh
npm install
npm test        # vitest
npm run typecheck
npm run build   # emits dist/
```

The XML files under `test/fixtures/` are samples written for this
project. Company names, tax codes and amounts in them are fictional.

## License

MIT. See [LICENSE](LICENSE).
