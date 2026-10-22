import { XMLParser } from "fast-xml-parser";
import type { Invoice, InvoiceTotals, LineItem, Party } from "./types.js";

type Node = Record<string, unknown>;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  trimValues: true,
  isArray: (name) => name === "HHDVu",
});

function asNode(value: unknown): Node | undefined {
  return typeof value === "object" && value !== null ? (value as Node) : undefined;
}

function text(node: Node | undefined, key: string): string | undefined {
  if (!node) return undefined;
  const value = node[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value === "object") {
    const inner = (value as Node)["#text"];
    return inner === undefined ? undefined : String(inner).trim() || undefined;
  }
  const s = String(value).trim();
  return s === "" ? undefined : s;
}

function num(node: Node | undefined, key: string): number | undefined {
  const s = text(node, key);
  if (s === undefined) return undefined;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function parseParty(node: Node | undefined, isBuyer: boolean): Party {
  const party: Party = {};
  const set = (key: keyof Party, value: string | undefined) => {
    if (value !== undefined) party[key] = value;
  };
  set("name", text(node, "Ten"));
  set("taxCode", text(node, "MST"));
  set("address", text(node, "DChi"));
  set("phone", text(node, "SDThoai"));
  set("bankAccount", text(node, "STKNHang"));
  set("bankName", text(node, "TNHang"));
  if (isBuyer) set("contactName", text(node, "HVTNMHang"));
  return party;
}

function parseLine(node: Node): LineItem {
  const item: LineItem = {
    index: num(node, "STT") ?? 0,
    name: text(node, "THHDVu") ?? "",
    amount: num(node, "ThTien") ?? 0,
  };
  const nature = num(node, "TChat");
  if (nature !== undefined) item.nature = nature;
  const code = text(node, "MHHDVu");
  if (code !== undefined) item.code = code;
  const unit = text(node, "DVTinh");
  if (unit !== undefined) item.unit = unit;
  const quantity = num(node, "SLuong");
  if (quantity !== undefined) item.quantity = quantity;
  const unitPrice = num(node, "DGia");
  if (unitPrice !== undefined) item.unitPrice = unitPrice;
  const discountRate = num(node, "TLCKhau");
  if (discountRate !== undefined) item.discountRate = discountRate;
  const discountAmount = num(node, "STCKhau");
  if (discountAmount !== undefined) item.discountAmount = discountAmount;
  const vatRate = text(node, "TSuat");
  if (vatRate !== undefined) item.vatRate = vatRate;
  return item;
}

/**
 * Finds the invoice data block. Issuers are not consistent here: most put
 * DLHDon directly under the HDon root, some wrap it in a DLieu element.
 * Both layouts occur in production files and are accepted.
 */
function findDataBlock(root: Node): Node | undefined {
  const hdon = asNode(root["HDon"]) ?? root;
  const direct = asNode(hdon["DLHDon"]);
  if (direct) return direct;
  const wrapper = asNode(hdon["DLieu"]);
  if (wrapper) {
    const inner = asNode(wrapper["DLHDon"]);
    if (inner) return inner;
    if (wrapper["TTChung"] !== undefined) return wrapper;
  }
  if (hdon["TTChung"] !== undefined) return hdon;
  return undefined;
}

/**
 * Parses one e-invoice XML document (Circular 78 format) into a typed
 * Invoice object. Throws when the document has no recognisable invoice
 * data block.
 */
export function parseInvoiceXml(xml: string): Invoice {
  const parsed = asNode(parser.parse(xml));
  if (!parsed) throw new Error("Input is not a valid XML document.");
  const root = parsed;
  const data = findDataBlock(root);
  if (!data) {
    throw new Error("No invoice data block (DLHDon) found in this XML document.");
  }

  const general = asNode(data["TTChung"]);
  const body = asNode(data["NDHDon"]);
  if (!general || !body) {
    throw new Error("Invoice data block is missing TTChung or NDHDon.");
  }

  const linesNode = asNode(body["DSHHDVu"]);
  const rawLines = linesNode?.["HHDVu"];
  const lineArray = Array.isArray(rawLines) ? rawLines : rawLines ? [rawLines] : [];
  const items = lineArray
    .map((entry) => asNode(entry))
    .filter((entry): entry is Node => entry !== undefined)
    .map(parseLine);

  const totalsNode = asNode(body["TToan"]);
  const totals: InvoiceTotals = {
    totalBeforeVat: num(totalsNode, "TgTCThue") ?? 0,
    totalVat: num(totalsNode, "TgTThue") ?? 0,
    totalPayable: num(totalsNode, "TgTTTBSo") ?? 0,
  };
  const totalDiscount = num(totalsNode, "TgCKTMai");
  if (totalDiscount !== undefined) totals.totalDiscount = totalDiscount;
  const inWords = text(totalsNode, "TgTTTBChu");
  if (inWords !== undefined) totals.totalPayableInWords = inWords;

  const currencyNode = asNode(general["DVTTe"]);
  const invoice: Invoice = {
    symbol: text(general, "KHHDon") ?? "",
    number: text(general, "SHDon") ?? "",
    seller: parseParty(asNode(body["NBan"]), false),
    buyer: parseParty(asNode(body["NMua"]), true),
    items,
    totals,
  };
  const templateCode = text(general, "KHMSHDon");
  if (templateCode !== undefined) invoice.templateCode = templateCode;
  const issueDate = text(general, "NLap");
  if (issueDate !== undefined) invoice.issueDate = issueDate;
  const currency = text(currencyNode, "Ma") ?? text(general, "MaNT");
  if (currency !== undefined) invoice.currency = currency;
  const paymentMethod = text(general, "HTTToan");
  if (paymentMethod !== undefined) invoice.paymentMethod = paymentMethod;

  const hdon = asNode(root["HDon"]);
  const taxCode = text(hdon, "MCCQT");
  if (taxCode !== undefined) invoice.taxAuthorityCode = taxCode;

  return invoice;
}
