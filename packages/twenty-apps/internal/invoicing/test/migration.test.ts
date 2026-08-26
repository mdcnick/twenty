import { describe, expect, it } from 'vitest';

import {
  mapPerfexInvoice,
  mapPerfexInvoiceItem,
  mapPerfexPayment,
  reconcileJoinedPerfexExport,
} from '../src/migration';

describe('Perfex invoice mappers', () => {
  it('maps actual Perfex invoice, itemable, and payment record fields deterministically', () => {
    const invoice = mapPerfexInvoice({
      id: 7, clientid: 17, formatted_number: 'INV-2026-007', status: 3, date: '2026-08-01', duedate: '2026-08-15',
      subtotal: '100.00', total_tax: '8.25', discount_total: '5.00', adjustment: '-1.00', total: '102.25', currency_code: 'USD', amount_paid: '25.00', balance_due: '77.25', payment_total: '25.00', credit_total: '0.00', adminnote: 'Imported',
    });
    const item = mapPerfexInvoiceItem({ id: 9, rel_id: 7, rel_type: 'invoice', description: 'Repair', long_description: 'Compressor repair', qty: '1', rate: '100.00', subtotal: '100.00', total: '108.25', total_tax: '8.25', currency_code: 'USD' });
    const payment = mapPerfexPayment({ paymentid: 11, invoiceid: 7, date: '2026-08-02', amount: '25.00', currency_code: 'USD', name: 'Cash', transactionid: 'tx-1', note: 'Deposit' });

    expect(invoice.sourceExternalId).toBe('perfex:invoices:7');
    expect(invoice.values.status).toBe('HISTORICAL');
    expect(invoice.relations).toEqual([{ fieldName: 'company', writeKey: 'companyId', referenceExternalId: 'perfex:clients:17' }]);
    expect(invoice.values.total).toEqual({ amountMicros: 102_250_000, currencyCode: 'USD' });
    expect(item.sourceExternalId).toBe('perfex:itemable:9');
    expect(item.values.tax).toEqual({ amountMicros: 8_250_000, currencyCode: 'USD' });
    expect(item.values.total).toEqual({ amountMicros: 108_250_000, currencyCode: 'USD' });
    expect(item.relations).toEqual([{ fieldName: 'invoice', writeKey: 'invoiceId', referenceExternalId: 'perfex:invoices:7' }]);
    expect(payment.sourceExternalId).toBe('perfex:invoicepaymentrecords:11');
    expect(payment.values.method).toBe('Cash');
  });

  it('is idempotent and rejects source rows without an ID', () => {
    const record = { id: 7, formatted_number: 'INV-7', status: 1, date: null, duedate: null, subtotal: '0', total_tax: '0', discount_total: '0', adjustment: '0', total: '0', currency_code: 'USD', amount_paid: '0', balance_due: '0', payment_total: '0', credit_total: '0' };
    expect(mapPerfexInvoice(record)).toEqual(
      mapPerfexInvoice({ ...record, id: '7' }),
    );
    expect(() => mapPerfexPayment({ invoiceid: 7, amount: '1', currency_code: 'USD' })).toThrow('paymentid');
  });

  it('rejects incomplete joined export rows and reconciles source aggregates', () => {
    expect(() => mapPerfexInvoice({ id: 7, formatted_number: 'INV-7' })).toThrow('currency_code');
    expect(() => mapPerfexInvoice({ id: 7, formatted_number: 'INV-7', status: 1, subtotal: '0', total_tax: '0', discount_total: '0', adjustment: '0', total: '0', currency_code: 'USD', amount_paid: '9', balance_due: '0', payment_total: '4', credit_total: '4' })).toThrow('aggregate');
    expect(reconcileJoinedPerfexExport({
      invoices: [{ id: 7, formatted_number: 'INV-7', status: 1, date: null, duedate: null, subtotal: '10', total_tax: '0', discount_total: '0', adjustment: '0', total: '10', currency_code: 'USD', amount_paid: '4', balance_due: '6', payment_total: '4', credit_total: '0' }],
      items: [{ id: 9, rel_id: 7, rel_type: 'invoice', description: 'Repair', qty: '1', rate: '10', subtotal: '10', total: '10', total_tax: '0', currency_code: 'USD' }],
      payments: [{ paymentid: 11, invoiceid: 7, date: null, amount: '4', currency_code: 'USD' }],
    })).toMatchObject({ invoiceCount: 1, itemCount: 1, paymentCount: 1, byCurrency: { USD: { invoiceTotalMicros: '10000000', amountPaidMicros: '4000000', balanceDueMicros: '6000000', paymentTotalMicros: '4000000' } } });
  });

  it('rejects duplicate, orphan, child-currency, per-invoice aggregate, and equation mismatches', () => {
    const invoice = { id: 7, formatted_number: 'INV-7', status: 1, date: null, duedate: null, subtotal: '10', total_tax: '0', discount_total: '0', adjustment: '0', total: '10', currency_code: 'USD', amount_paid: '4', balance_due: '6', payment_total: '4', credit_total: '0' };
    const item = { id: 9, rel_id: 7, rel_type: 'invoice' as const, description: 'Repair', qty: '1', rate: '10', subtotal: '10', total_tax: '0', total: '10', currency_code: 'USD' };
    const payment = { paymentid: 11, invoiceid: 7, date: null, amount: '4', currency_code: 'USD' };
    expect(() => reconcileJoinedPerfexExport({ invoices: [invoice, invoice], items: [item], payments: [payment] })).toThrow('duplicate invoice');
    expect(() => reconcileJoinedPerfexExport({ invoices: [invoice], items: [item, item], payments: [payment] })).toThrow('duplicate item');
    expect(() => reconcileJoinedPerfexExport({ invoices: [invoice], items: [item], payments: [payment, payment] })).toThrow('duplicate payment');
    expect(() => reconcileJoinedPerfexExport({ invoices: [invoice], items: [{ ...item, rel_id: 99 }], payments: [payment] })).toThrow('orphan item');
    expect(() => reconcileJoinedPerfexExport({ invoices: [invoice], items: [{ ...item, currency_code: 'CAD' }], payments: [payment] })).toThrow('currency mismatch');
    expect(() => reconcileJoinedPerfexExport({ invoices: [invoice], items: [item], payments: [{ ...payment, amount: '3' }] })).toThrow('payment aggregate');
    expect(() => reconcileJoinedPerfexExport({ invoices: [{ ...invoice, total: '9' }], items: [item], payments: [payment] })).toThrow('invoice total');
    expect(() => reconcileJoinedPerfexExport({ invoices: [invoice], items: [{ ...item, total: '9' }], payments: [payment] })).toThrow('item total');
  });

  it('keeps aggregate micros exact as strings beyond JavaScript safe integers', () => {
    const invoice = (id: number) => ({ id, formatted_number: `INV-${id}`, status: 1, date: null, duedate: null, subtotal: '9007199254.74', total_tax: '0', discount_total: '0', adjustment: '0', total: '9007199254.74', currency_code: 'USD', amount_paid: '0', balance_due: '9007199254.74', payment_total: '0', credit_total: '0' });
    const item = (id: number, invoiceId: number) => ({ id, rel_id: invoiceId, rel_type: 'invoice' as const, description: 'Large line', qty: '1', rate: '9007199254.74', subtotal: '9007199254.74', total_tax: '0', total: '9007199254.74', currency_code: 'USD' });
    expect(reconcileJoinedPerfexExport({ invoices: [invoice(1), invoice(2)], items: [item(1, 1), item(2, 2)], payments: [] }).byCurrency.USD.invoiceTotalMicros).toBe('18014398509480000');
  });

  it('reconciles item subtotal and tax against each parent, including zero-item invoices', () => {
    const invoice = { id: 7, formatted_number: 'INV-7', status: 1, date: null, duedate: null, subtotal: '10', total_tax: '1', discount_total: '0', adjustment: '0', total: '11', currency_code: 'USD', amount_paid: '0', balance_due: '11', payment_total: '0', credit_total: '0' };
    const item = (id: number, subtotal: string, tax: string) => ({ id, rel_id: 7, rel_type: 'invoice' as const, description: 'Line', qty: '1', rate: subtotal, subtotal, total_tax: tax, total: String(Number(subtotal) + Number(tax)), currency_code: 'USD' });
    expect(() => reconcileJoinedPerfexExport({ invoices: [invoice], items: [item(1, '1', '0')], payments: [] })).toThrow('item subtotal aggregate');
    expect(() => reconcileJoinedPerfexExport({ invoices: [invoice], items: [item(1, '10', '0')], payments: [] })).toThrow('item tax aggregate');
    expect(reconcileJoinedPerfexExport({ invoices: [invoice], items: [item(1, '4', '0.40'), item(2, '6', '0.60')], payments: [] }).itemCount).toBe(2);
    expect(reconcileJoinedPerfexExport({ invoices: [{ ...invoice, subtotal: '0', total_tax: '0', total: '0', balance_due: '0' }], items: [], payments: [] }).itemCount).toBe(0);
    expect(() => reconcileJoinedPerfexExport({ invoices: [invoice], items: [], payments: [] })).toThrow('zero-item');
  });
});
