import type { InvoiceItemWritePayload, InvoiceWritePayload, PaymentWritePayload, RelationWriteValue } from '../writer/payloads';

export type RawRecord = Readonly<Record<string, unknown>>;
export type PerfexInvoiceJoinedSnapshot = RawRecord & {
  id: string | number; formatted_number: string; status: string | number; date: string | null; duedate: string | null; currency_code: string;
  subtotal: string | number; total_tax: string | number; discount_total: string | number; adjustment: string | number; total: string | number;
  amount_paid: string | number; balance_due: string | number; payment_total: string | number; credit_total: string | number;
};
export type PerfexItemJoinedSnapshot = RawRecord & { id: string | number; rel_id: string | number; rel_type: 'invoice'; description: string; qty: string | number; rate: string | number; subtotal: string | number; total: string | number; total_tax: string | number; currency_code: string };
export type PerfexPaymentJoinedSnapshot = RawRecord & { paymentid: string | number; invoiceid: string | number; date: string | null; amount: string | number; currency_code: string };
export type MappedRecord<TValues> = { sourceExternalId: string; values: TValues; relations: readonly RelationWriteValue[] };
export type JoinedPerfexExport = { invoices: readonly PerfexInvoiceJoinedSnapshot[]; items: readonly PerfexItemJoinedSnapshot[]; payments: readonly PerfexPaymentJoinedSnapshot[] };
export type CurrencyAggregateReport = { invoiceTotalMicros: string; amountPaidMicros: string; balanceDueMicros: string; paymentTotalMicros: string };
export type JoinedExportReconciliation = { invoiceCount: number; itemCount: number; paymentCount: number; byCurrency: Record<string, CurrencyAggregateReport> };
export type InvoiceMappedRecord = MappedRecord<InvoiceWritePayload>;
export type InvoiceItemMappedRecord = MappedRecord<InvoiceItemWritePayload>;
export type PaymentMappedRecord = MappedRecord<PaymentWritePayload>;
