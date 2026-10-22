export interface Party {
  name?: string;
  taxCode?: string;
  address?: string;
  phone?: string;
  bankAccount?: string;
  bankName?: string;
  /** Buyer contact person (HVTNMHang). Buyer blocks only. */
  contactName?: string;
}

export interface LineItem {
  /** Line nature code (TChat): 1 goods/service, 2 promotion, 3 discount, 4 special notes. */
  nature?: number;
  index: number;
  code?: string;
  name: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  /** Discount rate on this line (TLCKhau), percent. */
  discountRate?: number;
  /** Discount amount on this line (STCKhau). */
  discountAmount?: number;
  /** Line amount after discount (ThTien). */
  amount: number;
  /** Raw VAT rate string as printed in the XML, e.g. "10%", "8%", "KCT", "KKKNT". */
  vatRate?: string;
}

export interface InvoiceTotals {
  /** Sum of line amounts before VAT (TgTCThue). */
  totalBeforeVat: number;
  /** Total VAT amount (TgTThue). */
  totalVat: number;
  /** Total discount amount (TgCKTMai), when present. */
  totalDiscount?: number;
  /** Total payable (TgTTTBSo). */
  totalPayable: number;
  /** Total payable written out in words (TgTTTBChu), when present. */
  totalPayableInWords?: string;
}

export interface Invoice {
  /** Template code (KHMSHDon): a single digit, "1" to "6". */
  templateCode?: string;
  /** Invoice symbol (KHHDon), e.g. "C26TAA". */
  symbol: string;
  /** Invoice number (SHDon). Kept as a string: it is an identifier, not a quantity. */
  number: string;
  /** Issue date (NLap), ISO date string as printed in the XML (yyyy-mm-dd). */
  issueDate?: string;
  /** Currency code (MaNT / currency inside DVTTe), e.g. "VND". */
  currency?: string;
  /** Payment method text (HTTToan), kept as printed (code or label, varies by issuer). */
  paymentMethod?: string;
  seller: Party;
  buyer: Party;
  items: LineItem[];
  totals: InvoiceTotals;
  /** Tax authority code (MCCQT) for invoices issued with one. */
  taxAuthorityCode?: string;
}
