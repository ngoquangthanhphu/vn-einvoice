import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseInvoiceXml } from "../src/parser.js";

const readFixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf-8");

describe("parseInvoiceXml", () => {
  it("parses a VAT invoice with DLHDon directly under the root", () => {
    const invoice = parseInvoiceXml(readFixture("invoice-vat.xml"));

    expect(invoice.templateCode).toBe("1");
    expect(invoice.symbol).toBe("C26TAA");
    expect(invoice.number).toBe("00000123");
    expect(invoice.issueDate).toBe("2026-01-15");
    expect(invoice.currency).toBe("VND");
    expect(invoice.seller.name).toContain("An Phát");
    expect(invoice.seller.taxCode).toBe("0100000001");
    expect(invoice.buyer.taxCode).toBe("0300000002");
    expect(invoice.buyer.contactName).toBe("Người Mua Mẫu");
    expect(invoice.taxAuthorityCode).toBe("00A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5");

    expect(invoice.items).toHaveLength(2);
    expect(invoice.items[0]).toMatchObject({
      index: 1,
      code: "SP001",
      quantity: 20,
      unitPrice: 50000,
      amount: 1000000,
      vatRate: "10%",
    });
    expect(invoice.items[1]?.amount).toBe(300000);

    expect(invoice.totals).toMatchObject({
      totalBeforeVat: 1300000,
      totalVat: 130000,
      totalPayable: 1430000,
    });
  });

  it("parses an invoice whose data block is wrapped in DLieu", () => {
    const invoice = parseInvoiceXml(readFixture("invoice-cash-register.xml"));

    expect(invoice.symbol).toBe("C26MAA");
    expect(invoice.items).toHaveLength(1);
    expect(invoice.items[0]?.amount).toBe(540000);
    expect(invoice.totals.totalPayable).toBe(583200);
    // A walk-in customer leaves the buyer fields empty.
    expect(invoice.buyer.name).toBeUndefined();
    expect(invoice.buyer.taxCode).toBeUndefined();
  });

  it("rejects a document without an invoice data block", () => {
    expect(() => parseInvoiceXml("<root><x>1</x></root>")).toThrow(/DLHDon/);
  });
});
