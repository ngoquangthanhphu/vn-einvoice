import { readFileSync } from "node:fs";
import { parseInvoiceXml, validateInvoice } from "../dist/index.js";

const xml = readFileSync(new URL("../test/fixtures/invoice-vat.xml", import.meta.url), "utf-8");
const invoice = parseInvoiceXml(xml);

console.log(`${invoice.seller.name} (${invoice.seller.taxCode})`);
console.log(`Invoice ${invoice.number} / ${invoice.symbol} / ${invoice.issueDate}`);
console.log(`Items: ${invoice.items.length}, payable: ${invoice.totals.totalPayable} ${invoice.currency}`);
console.log("Validation issues:", validateInvoice(invoice));
