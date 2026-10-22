import { decodeInvoiceSymbol } from "./symbol.js";
import type { Invoice } from "./types.js";

export interface ValidationIssue {
  code:
    | "missing-seller-tax-code"
    | "missing-invoice-number"
    | "invalid-symbol"
    | "symbol-year-mismatch"
    | "line-sum-mismatch"
    | "payable-mismatch";
  message: string;
  expected?: number;
  actual?: number;
}

/**
 * Cross-checks the arithmetic and the identifying fields of a parsed
 * invoice. Returns a list of issues; an empty list means every check
 * passed. Amounts are compared with a tolerance (default 1 currency
 * unit) because issuers round line amounts and totals independently.
 */
export function validateInvoice(invoice: Invoice, tolerance = 1): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const off = (a: number, b: number) => Math.abs(a - b) > tolerance;

  if (!invoice.seller.taxCode) {
    issues.push({
      code: "missing-seller-tax-code",
      message: "Seller tax code (NBan/MST) is missing.",
    });
  }
  if (!invoice.number) {
    issues.push({
      code: "missing-invoice-number",
      message: "Invoice number (SHDon) is missing.",
    });
  }

  let symbolYear: number | undefined;
  try {
    symbolYear = decodeInvoiceSymbol(invoice.symbol).year;
  } catch {
    issues.push({
      code: "invalid-symbol",
      message: `Invoice symbol "${invoice.symbol}" does not match the Circular 78 format.`,
    });
  }
  if (symbolYear !== undefined && invoice.issueDate) {
    const issueYear = Number(invoice.issueDate.slice(0, 4));
    if (Number.isFinite(issueYear) && issueYear !== symbolYear) {
      issues.push({
        code: "symbol-year-mismatch",
        message: `Symbol year ${symbolYear} does not match issue date ${invoice.issueDate}.`,
      });
    }
  }

  const lineSum = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  if (off(lineSum, invoice.totals.totalBeforeVat)) {
    issues.push({
      code: "line-sum-mismatch",
      message: "Sum of line amounts does not match the stated total before VAT.",
      expected: invoice.totals.totalBeforeVat,
      actual: lineSum,
    });
  }

  const payable = invoice.totals.totalBeforeVat + invoice.totals.totalVat;
  if (off(payable, invoice.totals.totalPayable)) {
    issues.push({
      code: "payable-mismatch",
      message: "Total before VAT plus VAT does not match the stated total payable.",
      expected: invoice.totals.totalPayable,
      actual: payable,
    });
  }

  return issues;
}
