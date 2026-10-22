import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseInvoiceXml } from "../src/parser.js";
import { validateInvoice } from "../src/validate.js";

const readFixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf-8");

describe("validateInvoice", () => {
  it("accepts both sample invoices", () => {
    expect(validateInvoice(parseInvoiceXml(readFixture("invoice-vat.xml")))).toEqual([]);
    expect(validateInvoice(parseInvoiceXml(readFixture("invoice-cash-register.xml")))).toEqual([]);
  });

  it("reports a line sum that does not match the stated total", () => {
    const invoice = parseInvoiceXml(readFixture("invoice-vat.xml"));
    invoice.totals.totalBeforeVat = 1200000;
    const codes = validateInvoice(invoice).map((issue) => issue.code);
    expect(codes).toContain("line-sum-mismatch");
  });

  it("reports a payable total that is not before-VAT plus VAT", () => {
    const invoice = parseInvoiceXml(readFixture("invoice-vat.xml"));
    invoice.totals.totalPayable = 1400000;
    const issue = validateInvoice(invoice).find((i) => i.code === "payable-mismatch");
    expect(issue).toMatchObject({ expected: 1400000, actual: 1430000 });
  });

  it("reports a symbol year that disagrees with the issue date", () => {
    const invoice = parseInvoiceXml(readFixture("invoice-vat.xml"));
    invoice.issueDate = "2025-01-15";
    const codes = validateInvoice(invoice).map((issue) => issue.code);
    expect(codes).toContain("symbol-year-mismatch");
  });

  it("tolerates rounding differences within the tolerance", () => {
    const invoice = parseInvoiceXml(readFixture("invoice-vat.xml"));
    invoice.totals.totalPayable += 1;
    expect(validateInvoice(invoice)).toEqual([]);
    expect(validateInvoice(invoice, 0).map((i) => i.code)).toContain("payable-mismatch");
  });
});
