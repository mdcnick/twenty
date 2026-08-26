import { describe, expect, it } from 'vitest';

import {
  filterInvoices,
  formatCurrency,
  getInvoiceCustomerName,
  getInvoiceSummary,
  type InvoiceWorkspaceRecord,
} from '../invoice-workspace';

const invoice = (
  overrides: Partial<InvoiceWorkspaceRecord> = {},
): InvoiceWorkspaceRecord => ({
  id: 'invoice-1',
  name: 'August service',
  invoiceNumber: 'INV-1042',
  status: 'UNPAID',
  issueDate: '2026-08-01',
  dueDate: '2026-08-15',
  currencyCode: 'USD',
  subtotal: { amountMicros: 100_000_000, currencyCode: 'USD' },
  tax: { amountMicros: 7_000_000, currencyCode: 'USD' },
  discount: { amountMicros: 0, currencyCode: 'USD' },
  adjustment: { amountMicros: 0, currencyCode: 'USD' },
  total: { amountMicros: 107_000_000, currencyCode: 'USD' },
  amountPaid: { amountMicros: 0, currencyCode: 'USD' },
  balanceDue: { amountMicros: 107_000_000, currencyCode: 'USD' },
  company: { id: 'company-1', name: "Palmer's Market" },
  person: null,
  clientNote: null,
  adminNote: null,
  hasDiscrepancy: false,
  discrepancyNotes: null,
  sourceSystem: 'MANUAL',
  sourceStatus: null,
  items: [],
  payments: [],
  ...overrides,
});

describe('invoice workspace formatting', () => {
  it('formats Twenty amount micros as currency without understating the value', () => {
    expect(
      formatCurrency(
        { amountMicros: 12_345_000, currencyCode: 'USD' },
        'USD',
      ),
    ).toBe('$12.35');
    expect(formatCurrency(null, 'USD')).toBe('$0.00');
  });

  it('uses company, then person, then a neutral customer fallback', () => {
    expect(getInvoiceCustomerName(invoice())).toBe("Palmer's Market");
    expect(
      getInvoiceCustomerName(
        invoice({
          company: null,
          person: { id: 'person-1', firstName: 'Avery', lastName: 'Stone' },
        }),
      ),
    ).toBe('Avery Stone');
    expect(
      getInvoiceCustomerName(invoice({ company: null, person: null })),
    ).toBe('No customer');
  });
});

describe('invoice workspace filtering and summary', () => {
  const records = [
    invoice(),
    invoice({
      id: 'invoice-2',
      invoiceNumber: 'INV-1043',
      status: 'OVERDUE',
      company: null,
      person: { id: 'person-2', firstName: 'Jordan', lastName: 'Lee' },
      balanceDue: { amountMicros: 50_000_000, currencyCode: 'USD' },
      total: { amountMicros: 50_000_000, currencyCode: 'USD' },
    }),
    invoice({
      id: 'invoice-3',
      invoiceNumber: 'INV-1044',
      status: 'PAID',
      company: { id: 'company-3', name: 'Harbor Bakery' },
      balanceDue: { amountMicros: 0, currencyCode: 'USD' },
      amountPaid: { amountMicros: 80_000_000, currencyCode: 'USD' },
      total: { amountMicros: 80_000_000, currencyCode: 'USD' },
    }),
  ];

  it('filters by status and searches invoice or customer text', () => {
    expect(filterInvoices(records, '', 'OVERDUE')).toHaveLength(1);
    expect(filterInvoices(records, '', 'HISTORICAL')).toHaveLength(0);
    expect(filterInvoices(records, 'jordan', 'ALL')[0]?.id).toBe('invoice-2');
    expect(filterInvoices(records, '1044', 'ALL')[0]?.id).toBe('invoice-3');
  });

  it('summarizes operational counts and outstanding micros', () => {
    expect(getInvoiceSummary(records)).toEqual({
      totalCount: 3,
      openCount: 2,
      overdueCount: 1,
      paidCount: 1,
      historicalCount: 0,
      outstandingByCurrency: { USD: 157_000_000 },
    });
  });
});
