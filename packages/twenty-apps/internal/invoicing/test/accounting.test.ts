import { describe, expect, it } from 'vitest';

import {
  formatMoney,
  moneyFromDecimal,
  sumMoney,
} from '../src/accounting/money';
import {
  reconcileImportedInvoice,
  recalculateManualInvoice,
} from '../src/accounting/recalculation';

describe('exact invoice money', () => {
  it('rounds decimal inputs to cents without floating point loss', () => {
    expect(formatMoney(moneyFromDecimal('10.005', 'USD'))).toBe('10.01 USD');
    expect(sumMoney([moneyFromDecimal('0.10', 'USD'), moneyFromDecimal('0.20', 'USD')]).amount).toBe(30n);
  });

  it('rejects overflow and mismatched currencies', () => {
    expect(() => moneyFromDecimal('90071992547409.92', 'USD')).toThrow('safe storage range');
    expect(() => sumMoney([moneyFromDecimal('1', 'USD'), moneyFromDecimal('1', 'CAD')])).toThrow('currency');
  });
});

describe('invoice calculation', () => {
  it('calculates totals, payments, and an overdue status for manual invoices', () => {
    const result = recalculateManualInvoice({
      currencyCode: 'USD',
      dueDate: '2026-08-24',
      today: '2026-08-25',
      items: [
        { quantity: '2', unitPrice: '100', tax: '10' },
        { quantity: '1', unitPrice: '50', tax: '0' },
      ],
      discount: '20',
      adjustment: '-5',
      payments: ['100'],
    });

    expect(result.snapshot).toEqual({
      subtotal: 25000n,
      tax: 1000n,
      discount: 2000n,
      adjustment: -500n,
      total: 23500n,
      amountPaid: 10000n,
      balanceDue: 13500n,
      currencyCode: 'USD',
    });
    expect(result.status).toBe('OVERDUE');
  });

  it('does not mutate imported snapshots and reports a discrepancy', () => {
    const result = reconcileImportedInvoice({
      currencyCode: 'USD',
      stored: { subtotal: '100', tax: '5', discount: '0', adjustment: '0', total: '104', amountPaid: '0', balanceDue: '104' },
      items: [{ quantity: '1', unitPrice: '100', tax: '5' }],
      payments: [],
    });

    expect(result.snapshot.total).toBe(10400n);
    expect(result.discrepancy).toMatchObject({ hasDiscrepancy: true });
  });

  it('moves a manual invoice through unpaid, partially paid, and paid states', () => {
    const input = { currencyCode: 'USD', today: '2026-08-01', items: [{ quantity: '1', unitPrice: '10' }] };
    expect(recalculateManualInvoice({ ...input, payments: [] }).status).toBe('UNPAID');
    expect(recalculateManualInvoice({ ...input, payments: ['4'] }).status).toBe('PARTIALLY_PAID');
    expect(recalculateManualInvoice({ ...input, payments: ['10'] }).status).toBe('PAID');
    expect(recalculateManualInvoice({ ...input, status: 'CANCELLED', payments: [] }).status).toBe('CANCELLED');
  });
});
