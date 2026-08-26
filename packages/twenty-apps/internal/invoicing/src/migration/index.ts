import { moneyFromDecimal } from '../accounting/money';
import { currencyWriteValue, richTextWriteValue, type InvoiceItemWritePayload, type InvoiceWritePayload, type PaymentWritePayload } from '../writer/payloads';
import type { InvoiceItemMappedRecord, InvoiceMappedRecord, JoinedExportReconciliation, JoinedPerfexExport, PaymentMappedRecord, RawRecord } from './types';

const requireValue = (row: RawRecord, field: string): string => {
  const value = row[field];
  if (typeof value !== 'string' && typeof value !== 'number') throw new Error(`joined Perfex export requires ${field}`);
  const text = String(value).trim();
  if (text === '') throw new Error(`joined Perfex export requires ${field}`);
  return text;
};
const requireNullableDate = (row: RawRecord, field: string): string | null => {
  if (!(field in row)) throw new Error(`joined Perfex export requires ${field}`);
  const value = row[field];
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) throw new Error(`joined Perfex export has invalid ${field}`);
  return value.slice(0, 10);
};
const currencyCode = (row: RawRecord) => {
  const value = requireValue(row, 'currency_code').toUpperCase();
  if (!/^[A-Z]{3}$/.test(value)) throw new Error('joined Perfex export has invalid currency_code');
  return value;
};
const cents = (row: RawRecord, field: string, currency: string) => moneyFromDecimal(requireValue(row, field), currency).amount;
const sourceId = (row: RawRecord, field: 'id' | 'paymentid') => requireValue(row, field);
const optionalText = (row: RawRecord, field: string) => {
  const value = row[field];
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim();
  return text === '' ? null : text;
};
const officialStatus = (value: string): string => ({ '1': 'UNPAID', '2': 'PAID', '3': 'PARTIALLY_PAID', '4': 'OVERDUE', '5': 'CANCELLED', '6': 'DRAFT' }[value] ?? (() => { throw new Error(`joined Perfex export has unsupported status ${value}`); })());
const assertEqual = (expected: bigint, actual: bigint, label: string) => { if (expected !== actual) throw new Error(`joined Perfex export aggregate mismatch: ${label}`); };

export function mapPerfexInvoice(row: RawRecord): InvoiceMappedRecord {
  const id = sourceId(row, 'id'); const currency = currencyCode(row); const status = requireValue(row, 'status'); const subtotal = cents(row, 'subtotal', currency); const tax = cents(row, 'total_tax', currency); const discount = cents(row, 'discount_total', currency); const adjustment = cents(row, 'adjustment', currency); const total = cents(row, 'total', currency); const amountPaid = cents(row, 'amount_paid', currency); const balanceDue = cents(row, 'balance_due', currency); const paymentTotal = cents(row, 'payment_total', currency); const creditTotal = cents(row, 'credit_total', currency);
  officialStatus(status); assertEqual(subtotal + tax - discount + adjustment, total, 'invoice total equation'); assertEqual(paymentTotal + creditTotal, amountPaid, 'payment_total + credit_total != amount_paid'); assertEqual(total - amountPaid, balanceDue, 'total - amount_paid != balance_due');
  const clientId = optionalText(row, 'clientid'); const values: InvoiceWritePayload = {
    name: `Invoice ${requireValue(row, 'formatted_number')}`, invoiceNumber: requireValue(row, 'formatted_number'), sourceExternalId: `perfex:invoices:${id}`, sourceSystem: 'PERFEX', sourceStatus: status, status: 'HISTORICAL', issueDate: requireNullableDate(row, 'date'), dueDate: requireNullableDate(row, 'duedate'), currencyCode: currency,
    subtotal: currencyWriteValue(subtotal, currency), tax: currencyWriteValue(tax, currency), discount: currencyWriteValue(discount, currency), adjustment: currencyWriteValue(adjustment, currency), total: currencyWriteValue(total, currency), amountPaid: currencyWriteValue(amountPaid, currency), balanceDue: currencyWriteValue(balanceDue, currency),
    clientNote: richTextWriteValue(optionalText(row, 'clientnote')), adminNote: richTextWriteValue(optionalText(row, 'adminnote')), hasDiscrepancy: false, discrepancyNotes: null, sourceMetadata: JSON.stringify({ perfexId: id, officialStatus: officialStatus(status), paymentTotal: paymentTotal.toString(), creditTotal: creditTotal.toString() }),
  };
  return { sourceExternalId: values.sourceExternalId, values, relations: clientId === null ? [] : [{ fieldName: 'company', writeKey: 'companyId', referenceExternalId: `perfex:clients:${clientId}` }] };
}

export function mapPerfexInvoiceItem(row: RawRecord): InvoiceItemMappedRecord {
  const id = sourceId(row, 'id'); const currency = currencyCode(row); const invoiceId = requireValue(row, 'rel_id'); if (requireValue(row, 'rel_type') !== 'invoice') throw new Error('joined Perfex item export requires rel_type invoice'); const subtotal = cents(row, 'subtotal', currency); const tax = cents(row, 'total_tax', currency); const total = cents(row, 'total', currency); assertEqual(subtotal + tax, total, 'item total equation'); const values: InvoiceItemWritePayload = {
    name: requireValue(row, 'description'), sourceExternalId: `perfex:itemable:${id}`, description: requireValue(row, 'description'), longDescription: richTextWriteValue(optionalText(row, 'long_description')), quantity: Number(requireValue(row, 'qty')), unit: optionalText(row, 'unit'), currencyCode: currency, unitPrice: currencyWriteValue(cents(row, 'rate', currency), currency), subtotal: currencyWriteValue(subtotal, currency), tax: currencyWriteValue(tax, currency), total: currencyWriteValue(total, currency),
  };
  if (!Number.isFinite(values.quantity)) throw new Error('joined Perfex item export has invalid qty');
  return { sourceExternalId: values.sourceExternalId, values, relations: [{ fieldName: 'invoice', writeKey: 'invoiceId', referenceExternalId: `perfex:invoices:${invoiceId}` }] };
}

export function mapPerfexPayment(row: RawRecord): PaymentMappedRecord {
  const id = sourceId(row, 'paymentid'); const currency = currencyCode(row); const invoiceId = requireValue(row, 'invoiceid'); const values: PaymentWritePayload = { name: `Payment ${id}`, sourceExternalId: `perfex:invoicepaymentrecords:${id}`, paymentDate: requireNullableDate(row, 'date'), amount: currencyWriteValue(cents(row, 'amount', currency), currency), currencyCode: currency, method: optionalText(row, 'name') ?? optionalText(row, 'paymentmode'), transactionId: optionalText(row, 'transactionid'), note: richTextWriteValue(optionalText(row, 'note')) };
  return { sourceExternalId: values.sourceExternalId, values, relations: [{ fieldName: 'invoice', writeKey: 'invoiceId', referenceExternalId: `perfex:invoices:${invoiceId}` }] };
}

export function reconcileJoinedPerfexExport(input: JoinedPerfexExport): JoinedExportReconciliation {
  const duplicate = (kind: string, identifiers: readonly string[]) => {
    const seen = new Set<string>();
    for (const identifier of identifiers) {
      if (seen.has(identifier)) throw new Error(`joined Perfex export has duplicate ${kind} source ID ${identifier}`);
      seen.add(identifier);
    }
  };
  duplicate('invoice', input.invoices.map((invoice) => sourceId(invoice, 'id')));
  duplicate('item', input.items.map((item) => sourceId(item, 'id')));
  duplicate('payment', input.payments.map((payment) => sourceId(payment, 'paymentid')));
  const invoices = input.invoices.map(mapPerfexInvoice);
  const invoiceById = new Map(input.invoices.map((invoice, index) => [sourceId(invoice, 'id'), { row: invoice, mapped: invoices[index], currency: currencyCode(invoice) }]));
  const paymentsByInvoice = new Map<string, bigint>();
  const itemTotalsByInvoice = new Map<string, { subtotal: bigint; tax: bigint; count: number }>();
  const report = new Map<string, { invoiceTotalMicros: bigint; amountPaidMicros: bigint; balanceDueMicros: bigint; paymentTotalMicros: bigint }>();
  const addReport = (currency: string, key: 'invoiceTotalMicros' | 'amountPaidMicros' | 'balanceDueMicros' | 'paymentTotalMicros', centsValue: bigint) => {
    const aggregate = report.get(currency) ?? { invoiceTotalMicros: 0n, amountPaidMicros: 0n, balanceDueMicros: 0n, paymentTotalMicros: 0n };
    aggregate[key] += centsValue * 10_000n;
    report.set(currency, aggregate);
  };
  for (const { row, currency } of invoiceById.values()) {
    addReport(currency, 'invoiceTotalMicros', cents(row, 'total', currency));
    addReport(currency, 'amountPaidMicros', cents(row, 'amount_paid', currency));
    addReport(currency, 'balanceDueMicros', cents(row, 'balance_due', currency));
  }
  for (const item of input.items) {
    mapPerfexInvoiceItem(item);
    const invoiceId = requireValue(item, 'rel_id'); const invoice = invoiceById.get(invoiceId);
    if (invoice === undefined) throw new Error(`joined Perfex export has orphan item for invoice ${invoiceId}`);
    if (currencyCode(item) !== invoice.currency) throw new Error(`joined Perfex export has currency mismatch for item on invoice ${invoiceId}`);
    const totals = itemTotalsByInvoice.get(invoiceId) ?? { subtotal: 0n, tax: 0n, count: 0 };
    totals.subtotal += cents(item, 'subtotal', invoice.currency);
    totals.tax += cents(item, 'total_tax', invoice.currency);
    totals.count += 1;
    itemTotalsByInvoice.set(invoiceId, totals);
  }
  for (const payment of input.payments) {
    mapPerfexPayment(payment);
    const invoiceId = requireValue(payment, 'invoiceid'); const invoice = invoiceById.get(invoiceId);
    if (invoice === undefined) throw new Error(`joined Perfex export has orphan payment for invoice ${invoiceId}`);
    if (currencyCode(payment) !== invoice.currency) throw new Error(`joined Perfex export has currency mismatch for payment on invoice ${invoiceId}`);
    const amount = cents(payment, 'amount', invoice.currency);
    paymentsByInvoice.set(invoiceId, (paymentsByInvoice.get(invoiceId) ?? 0n) + amount);
    addReport(invoice.currency, 'paymentTotalMicros', amount);
  }
  for (const [invoiceId, invoice] of invoiceById) {
    const itemTotals = itemTotalsByInvoice.get(invoiceId) ?? { subtotal: 0n, tax: 0n, count: 0 };
    const invoiceSubtotal = cents(invoice.row, 'subtotal', invoice.currency);
    const invoiceTax = cents(invoice.row, 'total_tax', invoice.currency);
    if (itemTotals.count === 0 && (invoiceSubtotal !== 0n || invoiceTax !== 0n)) throw new Error(`joined Perfex export has zero-item invoice with nonzero snapshot ${invoiceId}`);
    assertEqual(invoiceSubtotal, itemTotals.subtotal, `item subtotal aggregate for invoice ${invoiceId}`);
    assertEqual(invoiceTax, itemTotals.tax, `item tax aggregate for invoice ${invoiceId}`);
    assertEqual(cents(invoice.row, 'payment_total', invoice.currency), paymentsByInvoice.get(invoiceId) ?? 0n, `payment aggregate for invoice ${invoiceId}`);
  }
  return {
    invoiceCount: invoices.length,
    itemCount: input.items.length,
    paymentCount: input.payments.length,
    byCurrency: Object.fromEntries([...report].map(([currency, totals]) => [currency, { invoiceTotalMicros: totals.invoiceTotalMicros.toString(), amountPaidMicros: totals.amountPaidMicros.toString(), balanceDueMicros: totals.balanceDueMicros.toString(), paymentTotalMicros: totals.paymentTotalMicros.toString() }])),
  };
}

export type { JoinedPerfexExport } from './types';
