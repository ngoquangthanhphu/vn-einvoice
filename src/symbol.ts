/**
 * Decoding of the invoice template code (KHMSHDon) and invoice symbol
 * (KHHDon) as defined in Article 4 of Circular 78/2021/TT-BTC.
 *
 * Template code is a single digit:
 *   1 VAT invoice
 *   2 sales invoice
 *   3 sale of public assets
 *   4 sale of national reserve goods
 *   5 electronic stamps, tickets, cards, receipts and equivalent documents
 *   6 warehouse delivery / consignment documents managed as invoices
 *
 * Symbol is six characters:
 *   [C|K] [YY] [T|D|L|M|N|B|G|H] [XX]
 *   - first character: C = issued with a tax authority code,
 *     K = issued without one. Invoices created from a cash register carry
 *     M in the fourth position and, under the amended cash-register rules,
 *     may also appear with M in the first position.
 *   - next two digits: year of issue (last two digits of the calendar year)
 *   - next character: invoice kind (see INVOICE_KINDS)
 *   - last two characters: chosen by the seller for internal management
 *
 * Printed invoices often show the template code and symbol together as a
 * seven-character string (for example "1C26TAA"). decodeInvoiceSymbol
 * accepts both forms.
 */

export type TaxCodeKind = "with-code" | "without-code" | "cash-register";

export interface DecodedSymbol {
  /** Normalised input (upper-case, trimmed), including the template digit when given. */
  raw: string;
  /** Six-character symbol without the template digit. */
  symbol: string;
  /** Template code, when the seven-character printed form was given. */
  templateCode?: string;
  templateKind?: string;
  taxCodeKind: TaxCodeKind;
  /** Full year of issue, e.g. 2026 for "26". */
  year: number;
  /** Fourth character of the symbol. */
  kind: string;
  kindLabel: string;
  /** Last two characters, chosen by the seller. */
  sellerCode: string;
}

const TEMPLATE_KINDS: Record<string, string> = {
  "1": "VAT invoice",
  "2": "Sales invoice",
  "3": "Sale of public assets",
  "4": "Sale of national reserve goods",
  "5": "Electronic stamp, ticket, card, receipt or equivalent document",
  "6": "Warehouse delivery / consignment document",
};

const INVOICE_KINDS: Record<string, string> = {
  T: "Invoice registered with the tax authority by an enterprise, organisation or business household",
  D: "Sale of public assets, sale of national reserve goods, or special invoice",
  L: "Invoice issued by the tax authority for a single transaction",
  M: "Invoice created from a cash register",
  N: "Electronic warehouse delivery note for internal transport",
  B: "Electronic warehouse delivery note for goods sent to an agent",
  G: "Electronic stamp, ticket or card (VAT)",
  H: "Electronic stamp, ticket or card (sales)",
};

export function decodeTemplateCode(code: string): string | undefined {
  return TEMPLATE_KINDS[code.trim()];
}

export function decodeInvoiceSymbol(input: string): DecodedSymbol {
  const raw = input.trim().toUpperCase();
  let templateCode: string | undefined;
  let symbol = raw;

  if (/^[1-6]/.test(raw) && raw.length === 7) {
    templateCode = raw[0];
    symbol = raw.slice(1);
  }

  const match = /^([CKM])(\d{2})([TDLMNBGH])([A-Z0-9]{2})$/.exec(symbol);
  if (!match) {
    throw new Error(
      `Invalid invoice symbol "${input}". Expected six characters such as "C26TAA", ` +
        `optionally prefixed with a template digit ("1C26TAA").`,
    );
  }

  const [, firstChar, yearDigits, kind, sellerCode] = match as unknown as [
    string,
    string,
    string,
    string,
    string,
  ];

  const taxCodeKind: TaxCodeKind =
    firstChar === "C" ? "with-code" : firstChar === "M" ? "cash-register" : "without-code";

  const result: DecodedSymbol = {
    raw,
    symbol,
    taxCodeKind,
    year: 2000 + Number(yearDigits),
    kind,
    kindLabel: INVOICE_KINDS[kind] as string,
    sellerCode,
  };
  if (templateCode !== undefined) {
    result.templateCode = templateCode;
    const templateKind = TEMPLATE_KINDS[templateCode];
    if (templateKind !== undefined) result.templateKind = templateKind;
  }
  return result;
}
