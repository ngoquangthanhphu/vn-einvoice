import { describe, expect, it } from "vitest";
import { decodeInvoiceSymbol, decodeTemplateCode } from "../src/symbol.js";

describe("decodeInvoiceSymbol", () => {
  it("decodes a symbol issued with a tax authority code", () => {
    const decoded = decodeInvoiceSymbol("C26TAA");
    expect(decoded.taxCodeKind).toBe("with-code");
    expect(decoded.year).toBe(2026);
    expect(decoded.kind).toBe("T");
    expect(decoded.sellerCode).toBe("AA");
  });

  it("decodes a symbol issued without a tax authority code", () => {
    const decoded = decodeInvoiceSymbol("K25DBB");
    expect(decoded.taxCodeKind).toBe("without-code");
    expect(decoded.year).toBe(2025);
    expect(decoded.kind).toBe("D");
  });

  it("recognises a cash-register invoice by the fourth character", () => {
    const decoded = decodeInvoiceSymbol("C26MAA");
    expect(decoded.kind).toBe("M");
    expect(decoded.kindLabel).toMatch(/cash register/);
  });

  it("accepts the seven-character printed form with a template digit", () => {
    const decoded = decodeInvoiceSymbol("1K26DAA");
    expect(decoded.templateCode).toBe("1");
    expect(decoded.templateKind).toBe("VAT invoice");
    expect(decoded.symbol).toBe("K26DAA");
    expect(decoded.taxCodeKind).toBe("without-code");
  });

  it("rejects malformed symbols", () => {
    expect(() => decodeInvoiceSymbol("ABCDEF")).toThrow(/Invalid invoice symbol/);
    expect(() => decodeInvoiceSymbol("C2TAA")).toThrow(/Invalid invoice symbol/);
    expect(() => decodeInvoiceSymbol("")).toThrow(/Invalid invoice symbol/);
  });
});

describe("decodeTemplateCode", () => {
  it("maps the six template codes", () => {
    expect(decodeTemplateCode("1")).toBe("VAT invoice");
    expect(decodeTemplateCode("2")).toBe("Sales invoice");
    expect(decodeTemplateCode("6")).toMatch(/Warehouse/);
  });

  it("returns undefined for unknown codes", () => {
    expect(decodeTemplateCode("9")).toBeUndefined();
  });
});
